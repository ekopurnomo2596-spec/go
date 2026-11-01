import { db } from "./redis";
import { jakartaDay } from "./format";

export type Link = {
  slug: string;
  url: string;
  title: string;
  listed: boolean;
  /** Tampilkan halaman perantara (hitung mundur) sebelum pindah */
  interstitial?: boolean;
  createdAt: number;
};

export type Click = { t: number; c: string; r: string; d: string };

export type Stats = {
  total: number;
  countries: [string, number][];
  daily: [string, number][];
  recent: Click[];
};

const RESERVED = new Set(["admin", "api", "_next"]);

export function isReserved(slug: string): boolean {
  return RESERVED.has(slug);
}

export function validSlugFormat(slug: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{0,39}$/.test(slug);
}

export function validUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function getLink(slug: string): Promise<Link | null> {
  return (await db().get<Link>(`link:${slug}`)) ?? null;
}

export async function listLinks(): Promise<Link[]> {
  const slugs = (await db().smembers("links")) as string[];
  if (!slugs.length) return [];
  const items = await db().mget<(Link | null)[]>(...slugs.map((s) => `link:${s}`));
  return items
    .filter((l): l is Link => !!l)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Daftar link + jumlah klik dengan 2 round-trip ke Redis (bukan 3). */
export async function listLinksWithCounts(): Promise<{ links: Link[]; counts: Record<string, number> }> {
  const slugs = (await db().smembers("links")) as string[];
  if (!slugs.length) return { links: [], counts: {} };
  const p = db().pipeline();
  p.mget(...slugs.map((s) => `link:${s}`));
  p.mget(...slugs.map((s) => `clicks:${s}`));
  const [items, vals] = await p.exec<[(Link | null)[], (number | string | null)[]]>();
  const counts: Record<string, number> = Object.fromEntries(slugs.map((s, i) => [s, Number(vals[i] ?? 0)]));
  const links = items.filter((l): l is Link => !!l).sort((a, b) => b.createdAt - a.createdAt);
  return { links, counts };
}

export async function totals(slugs: string[]): Promise<Record<string, number>> {
  if (!slugs.length) return {};
  const vals = await db().mget<(number | string | null)[]>(...slugs.map((s) => `clicks:${s}`));
  return Object.fromEntries(slugs.map((s, i) => [s, Number(vals[i] ?? 0)]));
}

export async function getStats(slug: string): Promise<Stats> {
  const p = db().pipeline();
  p.get(`clicks:${slug}`);
  p.hgetall(`country:${slug}`);
  p.hgetall(`daily:${slug}`);
  p.lrange(`recent:${slug}`, 0, 49);
  const [total, countries, daily, recent] = await p.exec<
    [number | string | null, Record<string, number | string> | null, Record<string, number | string> | null, unknown[]]
  >();

  const countryList = Object.entries(countries ?? {})
    .map(([k, v]) => [k, Number(v)] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const dailyMap = daily ?? {};
  const dailyList: [string, number][] = [];
  for (let i = 13; i >= 0; i--) {
    const day = jakartaDay(i);
    dailyList.push([day, Number(dailyMap[day] ?? 0)]);
  }

  const recentList = (recent ?? [])
    .map((x) => (typeof x === "string" ? safeParse(x) : (x as Click)))
    .filter((x): x is Click => !!x);

  return { total: Number(total ?? 0), countries: countryList, daily: dailyList, recent: recentList };
}

function safeParse(s: string): Click | null {
  try {
    return JSON.parse(s) as Click;
  } catch {
    return null;
  }
}

export async function recordClick(slug: string, info: { country: string; referrer: string; device: string }) {
  const p = db().pipeline();
  p.incr(`clicks:${slug}`);
  p.hincrby(`country:${slug}`, info.country, 1);
  p.hincrby(`daily:${slug}`, jakartaDay(0), 1);
  const click: Click = { t: Date.now(), c: info.country, r: info.referrer, d: info.device };
  p.lpush(`recent:${slug}`, click);
  p.ltrim(`recent:${slug}`, 0, 99);
  await p.exec();
}

export async function deleteLinkData(slug: string) {
  const p = db().pipeline();
  p.del(`link:${slug}`);
  p.srem("links", slug);
  p.del(`clicks:${slug}`, `country:${slug}`, `daily:${slug}`, `recent:${slug}`);
  await p.exec();
}

export async function resetStatsData(slug: string) {
  const p = db().pipeline();
  p.del(`clicks:${slug}`, `country:${slug}`, `daily:${slug}`, `recent:${slug}`);
  await p.exec();
}

const dayOf = (t: number) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10);

/** Hapus sebagian data statistik: per hari, per negara, atau satu klik. Angka total ikut disesuaikan. */
export async function removeStats(slug: string, sel: { days?: string[]; country?: string; t?: number }) {
  const p0 = db().pipeline();
  p0.get(`clicks:${slug}`);
  p0.hgetall(`daily:${slug}`);
  p0.hgetall(`country:${slug}`);
  p0.lrange(`recent:${slug}`, 0, -1);
  const [cur, dailyRaw, countryRaw, recentRaw] = await p0.exec<
    [number | string | null, Record<string, number | string> | null, Record<string, number | string> | null, unknown[]]
  >();

  const daily: Record<string, number> = Object.fromEntries(Object.entries(dailyRaw ?? {}).map(([k, v]) => [k, Number(v)]));
  const country: Record<string, number> = Object.fromEntries(Object.entries(countryRaw ?? {}).map(([k, v]) => [k, Number(v)]));
  const recent = (recentRaw ?? [])
    .map((x) => (typeof x === "string" ? safeParse(x) : (x as Click)))
    .filter((x): x is Click => !!x);

  const daySet = new Set(sel.days ?? []);
  let firstT = true;
  const removed: Click[] = [];
  const kept: Click[] = [];
  for (const c of recent) {
    let hit = false;
    if (sel.t !== undefined) {
      if (c.t === sel.t && firstT) { hit = true; firstT = false; }
    } else if (sel.country) hit = c.c === sel.country;
    else hit = daySet.has(dayOf(c.t));
    (hit ? removed : kept).push(c);
  }

  let total = 0;
  if (sel.days) {
    for (const d of daySet) { total += daily[d] ?? 0; delete daily[d]; }
    for (const c of removed) country[c.c] = (country[c.c] ?? 0) - 1;
  } else if (sel.country) {
    total += country[sel.country] ?? 0;
    delete country[sel.country];
    for (const c of removed) daily[dayOf(c.t)] = (daily[dayOf(c.t)] ?? 0) - 1;
  } else if (sel.t !== undefined) {
    total += removed.length;
    for (const c of removed) {
      country[c.c] = (country[c.c] ?? 0) - 1;
      daily[dayOf(c.t)] = (daily[dayOf(c.t)] ?? 0) - 1;
    }
  }

  const positive = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v > 0));
  const d2 = positive(daily);
  const c2 = positive(country);
  const newTotal = Math.max(0, Number(cur ?? 0) - total);

  const p = db().pipeline();
  p.del(`clicks:${slug}`, `daily:${slug}`, `country:${slug}`, `recent:${slug}`);
  if (newTotal > 0) p.set(`clicks:${slug}`, newTotal);
  if (Object.keys(d2).length) p.hset(`daily:${slug}`, d2);
  if (Object.keys(c2).length) p.hset(`country:${slug}`, c2);
  if (kept.length) p.rpush(`recent:${slug}`, ...kept);
  await p.exec();
}
