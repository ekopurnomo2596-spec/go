import { db } from "./redis";

/**
 * Pengumuman singkat untuk portal emahairshop.com.
 * Disimpan di database yang sama dengan portal (key `portal:info`, berupa teks JSON).
 * Portal membacanya lewat middleware.js dan /api/info.
 */
export const INFO_KEY = "portal:info";
export const MAX_TEXT = 200;

export type Info = { on: boolean; text: string; url: string; v: number };

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
    return { on: !!o.on, text: String(o.text ?? ""), url: String(o.url ?? ""), v: Number(o.v) || 0 };
  } catch {
    return null;
  }
}

export async function setInfo(i: { on: boolean; text: string; url: string }) {
  await db().set(INFO_KEY, JSON.stringify({ ...i, v: Date.now() }));
}
