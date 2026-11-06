import { db } from "./redis";

/**
 * Pengumuman singkat untuk portal emahairshop.com.
 * Disimpan di database yang sama dengan portal (key `portal:info`, berupa teks JSON).
 * Portal membacanya lewat middleware.js dan /api/info.
 */
export const INFO_KEY = "portal:info";
export const MAX_TEXT = 200;

/** Bahasa yang ada di portal. Urutan tidak penting, kodenya harus sama dengan LN di index.html. */
export const INFO_LANGS = ["en", "id", "it", "es", "fr", "de", "ru"] as const;
export type InfoLang = (typeof INFO_LANGS)[number];
export type InfoTexts = Partial<Record<InfoLang, string>>;

/** Ambil hanya bahasa yang dikenal, berupa teks tak kosong, dipotong `max` karakter. */
export function cleanInfoTexts(raw: unknown, max = 300): InfoTexts {
  const out: InfoTexts = {};
  if (!raw || typeof raw !== "object") return out;
  for (const l of INFO_LANGS) {
    const v = (raw as Record<string, unknown>)[l];
    if (typeof v !== "string") continue;
    const t = v.replace(/\s+/g, " ").trim().slice(0, max);
    if (t) out[l] = t;
  }
  return out;
}

export type Info = { on: boolean; text: string; texts: InfoTexts; url: string; start: number | null; end: number | null; v: number };

const num = (x: unknown): number | null => (typeof x === "number" && Number.isFinite(x) && x > 0 ? x : null);

/** Status tayang pada waktu `now`: tampil, terjadwal (belum mulai), berakhir, atau mati. */
export function infoStatus(i: Pick<Info, "on" | "start" | "end">, now = Date.now()): "tampil" | "terjadwal" | "berakhir" | "mati" {
  if (!i.on) return "mati";
  if (i.start && now < i.start) return "terjadwal";
  if (i.end && now >= i.end) return "berakhir";
  return "tampil";
}

export function validInfoUrl(u: string): boolean {
  try {
    const p = new URL(u).protocol;
    return p === "https:" || p === "http:";
  } catch {
    return false;
  }
}

export async function getInfo(): Promise<Info | null> {
  const raw = await db().get<unknown>(INFO_KEY);
  if (!raw) return null;
  try {
    const o = (typeof raw === "string" ? JSON.parse(raw) : raw) as Partial<Info> | null;
    if (!o || typeof o !== "object") return null;
    return { on: !!o.on, text: String(o.text ?? ""), texts: cleanInfoTexts(o.texts), url: String(o.url ?? ""), start: num(o.start), end: num(o.end), v: Number(o.v) || 0 };
  } catch {
    return null;
  }
}

export async function setInfo(i: { on: boolean; text: string; texts: InfoTexts; url: string; start: number | null; end: number | null }) {
  await db().set(INFO_KEY, JSON.stringify({ ...i, v: Date.now() }));
}
