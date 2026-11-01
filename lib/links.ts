import { db } from "./redis";
import { jakartaDay } from "./format";

export type Link = {
  slug: string;
  url: string;
  title: string;
  listed: boolean;
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
