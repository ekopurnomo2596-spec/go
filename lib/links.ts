import { db } from "./redis";
import { LOGIN_PATH } from "./login-path";
import { jakartaDay } from "./format";
import { getPageviewsByDay } from "./visits";

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
  return RESERVED.has(slug) || (!!LOGIN_PATH && slug === LOGIN_PATH);
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

export type Analytics = {
  windowDays: number;
  linkCount: number;
  /** Jumlah tautan yang dibuat dalam jendela windowDays terakhir */
  newLinks: number;
  total: number;
  prevTotal: number | null;
  avgPerDay: number;
  /** Pengunjung unik (perkiraan HyperLogLog) di jendela ini; null jika belum ada data */
  unique: number | null;
  prevUnique: number | null;
  /** CTR (%) = klik tautan / pageviews website utama pada hari yang punya data kunjungan; null jika belum ada data */
  ctr: number | null;
  prevCtr: number | null;
  daily: [string, number][];
  peak: { day: string; n: number } | null;
  topLinks: { slug: string; title: string; n: number }[];
  countries: [string, number][];
  devices: [string, number][];
  referrers: [string, number][];
};

/**
 * Rincian per hari untuk halaman Analisa: negara (c), perangkat (d), sumber (r).
 * Satu hash per jenis per hari: `bd:{jenis}:{YYYY-MM-DD}`, field `{slug}|{nilai}`.
 * Slug tidak boleh memuat "|", jadi pemisah pertama selalu aman.
 */
type BdKind = "c" | "d" | "r";
const BD_KINDS: BdKind[] = ["c", "d", "r"];
const BD_KEEP_DAYS = 100;
const bdKey = (k: BdKind, day: string) => `bd:${k}:${day}`;
const bdAllDays = () => Array.from({ length: BD_KEEP_DAYS }, (_, i) => jakartaDay(i));

/** Hapus semua field milik slug pada hari-hari tertentu (semua jenis). */
async function purgeBreakdown(slug: string, days: string[]) {
  if (!days.length) return;
  const keys = days.flatMap((d) => BD_KINDS.map((k) => bdKey(k, d)));
  const p = db().pipeline();
  for (const key of keys) p.hgetall(key);
  const res = await p.exec<(Record<string, number | string> | null)[]>();
  const q = db().pipeline();
  let any = false;
  res.forEach((h, i) => {
    const fields = Object.keys(h ?? {}).filter((f) => f.startsWith(`${slug}|`));
    if (fields.length) {
      q.hdel(keys[i], ...fields);
      any = true;
    }
  });
  if (any) await q.exec();
}

/** Ringkasan klik seluruh tautan untuk halaman Analisa. Semua angka (tren, tautan teratas, negara, perangkat, sumber) mengikuti jendela windowDays. */
export async function getAnalytics(windowDays: number): Promise<Analytics> {
  const links = await listLinks();
  const empty: Analytics = {
    windowDays,
    linkCount: 0,
    newLinks: 0,
    total: 0,
    prevTotal: null,
    avgPerDay: 0,
    unique: null,
    prevUnique: null,
    ctr: null,
    prevCtr: null,
    daily: [],
    peak: null,
    topLinks: [],
    countries: [],
    devices: [],
    referrers: [],
  };
  if (!links.length) return empty;

  const slugs = links.map((l) => l.slug);
  const days: string[] = [];
  for (let i = windowDays - 1; i >= 0; i--) days.push(jakartaDay(i));
  const prevDays: string[] = [];
  for (let i = windowDays * 2 - 1; i >= windowDays; i--) prevDays.push(jakartaDay(i));
  const daySet = new Set(days);
  const prevSet = new Set(prevDays);

  const slugSet = new Set(slugs);
  const n = slugs.length;
  const p = db().pipeline();
  for (const s of slugs) p.hgetall(`daily:${s}`);
  for (const k of BD_KINDS) for (const d of days) p.hgetall(bdKey(k, d));
  p.pfcount(...(days.map((d) => `uv:${d}`) as [string, ...string[]]));
  p.pfcount(...(prevDays.map((d) => `uv:${d}`) as [string, ...string[]]));
  const res = await p.exec<(Record<string, number | string> | number)[]>();
  const D = days.length;
  const [uv, prevUv] = [Number(res[n + 3 * D] ?? 0), Number(res[n + 3 * D + 1] ?? 0)];
  const pvByDay = await getPageviewsByDay([...prevDays, ...days]).catch(() => ({}) as Record<string, number>);

  const dailyHashes = res.slice(0, n) as Record<string, number | string>[];
  const countryHashes = res.slice(n, n + D) as (Record<string, number | string> | null)[];
  const deviceHashes = res.slice(n + D, n + 2 * D) as (Record<string, number | string> | null)[];
  const refHashes = res.slice(n + 2 * D, n + 3 * D) as (Record<string, number | string> | null)[];

  const dayTotals: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
  const perLink: Record<string, number> = {};
  const prevDayTotals: Record<string, number> = {};
  let prevTotal = 0;
  let hasPrevData = false;
  dailyHashes.forEach((h, i) => {
    let t = 0;
    for (const [day, v] of Object.entries(h ?? {})) {
      const num = Number(v);
      if (daySet.has(day)) {
        dayTotals[day] += num;
        t += num;
      } else if (prevSet.has(day)) {
        prevTotal += num;
        prevDayTotals[day] = (prevDayTotals[day] ?? 0) + num;
        hasPrevData = true;
      }
    }
    perLink[slugs[i]] = t;
  });

  // jumlahkan field `{slug}|{nilai}` dari semua hari; abaikan tautan yang sudah dihapus
  const sumHashes = (hashes: (Record<string, number | string> | null)[]) => {
    const out: Record<string, number> = {};
    for (const h of hashes)
      for (const [f, v] of Object.entries(h ?? {})) {
        const i = f.indexOf("|");
        if (i < 0 || !slugSet.has(f.slice(0, i))) continue;
        const k = f.slice(i + 1);
        out[k] = (out[k] ?? 0) + Number(v);
      }
    return Object.entries(out)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
  };

  // CTR: hanya hari yang punya data kunjungan website, supaya pembilang & penyebut sebanding
  const ctrOf = (list: string[], clicks: Record<string, number>) => {
    let c = 0;
    let v = 0;
    for (const d of list) {
      if (pvByDay[d] === undefined) continue;
      c += clicks[d] ?? 0;
      v += pvByDay[d];
    }
    return v > 0 ? (c / v) * 100 : null;
  };

  const total = Object.values(dayTotals).reduce((a, b) => a + b, 0);
  const daily = days.map((d) => [d, dayTotals[d]] as [string, number]);
  const peak = daily.reduce<{ day: string; n: number } | null>(
    (best, [day, n]) => (n > 0 && (!best || n > best.n) ? { day, n } : best),
    null,
  );
  const topLinks = links
    .map((l) => ({ slug: l.slug, title: l.title, n: perLink[l.slug] ?? 0 }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  return {
    windowDays,
    linkCount: links.length,
    newLinks: links.filter((l) => l.createdAt >= Date.now() - windowDays * 86400e3).length,
    total,
    prevTotal: hasPrevData ? prevTotal : null,
    avgPerDay: windowDays > 0 ? Math.round(total / windowDays) : 0,
    unique: uv > 0 ? uv : null,
    prevUnique: prevUv > 0 ? prevUv : null,
    ctr: ctrOf(days, dayTotals),
    prevCtr: ctrOf(prevDays, prevDayTotals),
    daily,
    peak,
    topLinks,
    countries: sumHashes(countryHashes),
    devices: sumHashes(deviceHashes),
    referrers: sumHashes(refHashes),
  };
}

function safeParse(s: string): Click | null {
  try {
    return JSON.parse(s) as Click;
  } catch {
    return null;
  }
}

export async function recordClick(
  slug: string,
  info: { country: string; referrer: string; device: string; visitor?: string },
) {
  const p = db().pipeline();
  p.incr(`clicks:${slug}`);
  p.hincrby(`country:${slug}`, info.country, 1);
  p.hincrby(`device:${slug}`, info.device, 1);
  p.hincrby(`ref:${slug}`, info.referrer, 1);
  p.hincrby(`daily:${slug}`, jakartaDay(0), 1);
  // rincian per hari untuk Analisa (negara/perangkat/sumber), disimpan ~100 hari
  const today = jakartaDay(0);
  for (const [k, v] of [["c", info.country], ["d", info.device], ["r", info.referrer]] as [BdKind, string][]) {
    p.hincrby(bdKey(k, today), `${slug}|${v}`, 1);
    p.expire(bdKey(k, today), BD_KEEP_DAYS * 86400);
  }
  if (info.visitor) {
    // pengunjung unik per hari (HyperLogLog, hanya hash — tanpa IP mentah); simpan ~100 hari
    const uvKey = `uv:${jakartaDay(0)}`;
    p.pfadd(uvKey, info.visitor);
    p.expire(uvKey, 100 * 86400);
  }
  const click: Click = { t: Date.now(), c: info.country, r: info.referrer, d: info.device };
  p.lpush(`recent:${slug}`, click);
  p.ltrim(`recent:${slug}`, 0, 99);
  await p.exec();
}

export async function deleteLinkData(slug: string) {
  const p = db().pipeline();
  p.del(`link:${slug}`);
  p.srem("links", slug);
  p.del(`clicks:${slug}`, `country:${slug}`, `device:${slug}`, `ref:${slug}`, `daily:${slug}`, `recent:${slug}`);
  await p.exec();
  await purgeBreakdown(slug, bdAllDays());
}

export async function resetStatsData(slug: string) {
  const p = db().pipeline();
  p.del(`clicks:${slug}`, `country:${slug}`, `device:${slug}`, `ref:${slug}`, `daily:${slug}`, `recent:${slug}`);
  await p.exec();
  await purgeBreakdown(slug, bdAllDays());
}

const dayOf = (t: number) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10);

/** Hapus sebagian data statistik: per hari, per negara, atau satu klik. Angka total ikut disesuaikan. */
export async function removeStats(slug: string, sel: { days?: string[]; country?: string; t?: number }) {
  const p0 = db().pipeline();
  p0.get(`clicks:${slug}`);
  p0.hgetall(`daily:${slug}`);
  p0.hgetall(`country:${slug}`);
  p0.hgetall(`device:${slug}`);
  p0.hgetall(`ref:${slug}`);
  p0.lrange(`recent:${slug}`, 0, -1);
  const [cur, dailyRaw, countryRaw, deviceRaw, refRaw, recentRaw] = await p0.exec<
    [
      number | string | null,
      Record<string, number | string> | null,
      Record<string, number | string> | null,
      Record<string, number | string> | null,
      Record<string, number | string> | null,
      unknown[],
    ]
  >();

  const daily: Record<string, number> = Object.fromEntries(Object.entries(dailyRaw ?? {}).map(([k, v]) => [k, Number(v)]));
  const country: Record<string, number> = Object.fromEntries(Object.entries(countryRaw ?? {}).map(([k, v]) => [k, Number(v)]));
  const device: Record<string, number> = Object.fromEntries(Object.entries(deviceRaw ?? {}).map(([k, v]) => [k, Number(v)]));
  const ref: Record<string, number> = Object.fromEntries(Object.entries(refRaw ?? {}).map(([k, v]) => [k, Number(v)]));
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
  for (const c of removed) {
    if (c.d) device[c.d] = (device[c.d] ?? 0) - 1;
    if (c.r) ref[c.r] = (ref[c.r] ?? 0) - 1;
  }

  const positive = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v > 0));
  const d2 = positive(daily);
  const c2 = positive(country);
  const dev2 = positive(device);
  const ref2 = positive(ref);
  const newTotal = Math.max(0, Number(cur ?? 0) - total);

  const p = db().pipeline();
  p.del(`clicks:${slug}`, `daily:${slug}`, `country:${slug}`, `device:${slug}`, `ref:${slug}`, `recent:${slug}`);
  if (newTotal > 0) p.set(`clicks:${slug}`, newTotal);
  if (Object.keys(d2).length) p.hset(`daily:${slug}`, d2);
  if (Object.keys(c2).length) p.hset(`country:${slug}`, c2);
  if (Object.keys(dev2).length) p.hset(`device:${slug}`, dev2);
  if (Object.keys(ref2).length) p.hset(`ref:${slug}`, ref2);
  if (kept.length) p.rpush(`recent:${slug}`, ...kept);
  await p.exec();

  // sinkronkan rincian per hari (Analisa)
  if (sel.days) {
    await purgeBreakdown(slug, [...daySet]);
  } else {
    const q = db().pipeline();
    if (sel.country) for (const d of bdAllDays()) q.hdel(bdKey("c", d), `${slug}|${sel.country}`);
    for (const c of removed) {
      const day = dayOf(c.t);
      if (!sel.country) q.hincrby(bdKey("c", day), `${slug}|${c.c}`, -1);
      if (c.d) q.hincrby(bdKey("d", day), `${slug}|${c.d}`, -1);
      if (c.r) q.hincrby(bdKey("r", day), `${slug}|${c.r}`, -1);
    }
    await q.exec();
  }
}
