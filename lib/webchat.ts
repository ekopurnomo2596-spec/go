import { db } from "./redis";
import type { ChatRow, Msg } from "./remote";
import { cleanStyle, isDefaultStyle, type ChatStyle } from "./chatstyle";

/**
 * Chatbot di website emahairshop.com (dijalankan project "portal", api/chat.js).
 * Portal dan go memakai Redis yang SAMA, jadi di sini langsung baca/tulis key yang sama.
 *
 * - cfg:chat:on           "1" / "0". Kosong dianggap menyala (perilaku lama). Dibaca middleware.js dan api/chat.js portal.
 * - cfg:chat:limit        batas pesan chat per hari (angka). Kosong = portal pakai bawaannya. Dibaca api/chat.js portal.
 * - cfg:chat:hide         daftar halaman yang menyembunyikan widget.js (satu aturan per baris). Dibaca api/chat.js portal (?cfg=1).
 * - cfg:chat:style        JSON tampilan widget (bentuk tombol/gelembung, animasi, warna). Kosong = tampilan bawaan. Dibaca api/chat.js (?cfg=1).
 * - web:conv:idx          sorted set id chat (16 hex), skor = waktu pesan terakhir
 * - web:conv:meta:{id}    hash { title, last }
 * - web:conv:msgs:{id}    list pesan { t, r: "user"|"bot", n, x }   (ditulis portal, kedaluwarsa 30 hari)
 */

const ON_KEY = "cfg:chat:on";
const HIDE_KEY = "cfg:chat:hide";
const LIMIT_KEY = "cfg:chat:limit";
const STYLE_KEY = "cfg:chat:style";
export const MAX_CHAT_LIMIT = 1_000_000;
const IDX = "web:conv:idx";

export const validWebId = (id: string) => /^[a-f0-9]{16}$/.test(id);

export async function getChatEnabled(): Promise<boolean> {
  const v = await db().get<string | number>(ON_KEY);
  return !(v === "0" || v === 0);
}

export async function setChatEnabled(on: boolean) {
  await db().set(ON_KEY, on ? "1" : "0");
}

/** Batas pesan per hari yang tersimpan, atau null kalau belum diatur dari dashboard. */
export async function getChatLimit(): Promise<number | null> {
  const v = await db().get<string | number>(LIMIT_KEY);
  const n = Number(v);
  return v !== null && v !== "" && Number.isInteger(n) && n > 0 ? n : null;
}

export async function setChatLimit(n: number | null) {
  if (n === null) await db().del(LIMIT_KEY);
  else await db().set(LIMIT_KEY, String(n));
}

/** Aturan valid: "/path", "/path*", "/", "sub.emahairshop.com", "sub.emahairshop.com/path". */
export function cleanHideRules(raw: string): string[] {
  const out: string[] = [];
  for (const l of raw.split(/[\r\n,]+/)) {
    let x = l.trim();
    if (!x) continue;
    if (!/^[A-Za-z0-9/_\-.*~%:]{1,200}$/.test(x)) continue;
    if (!x.startsWith("/") && !/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(\/|$)/.test(x)) x = "/" + x;
    if (!out.includes(x)) out.push(x);
    if (out.length >= 100) break;
  }
  return out;
}

export async function getChatHide(): Promise<string[]> {
  const v = await db().get<string>(HIDE_KEY);
  return typeof v === "string" ? cleanHideRules(v) : [];
}

export async function setChatHide(rules: string[]) {
  if (rules.length) await db().set(HIDE_KEY, rules.join("\n"));
  else await db().del(HIDE_KEY);
}

export async function getChatStyle(): Promise<ChatStyle> {
  return cleanStyle(await db().get<unknown>(STYLE_KEY));
}

/** Sama dengan bawaan = hapus key, supaya widget tidak membawa pengaturan yang tidak perlu. */
export async function setChatStyle(s: ChatStyle) {
  if (isDefaultStyle(s)) await db().del(STYLE_KEY);
  else await db().set(STYLE_KEY, JSON.stringify(s));
}

export async function listWebConvs(n = 100): Promise<ChatRow[]> {
  const r = db();
  const ids = ((await r.zrange(IDX, 0, n - 1, { rev: true })) as (string | number)[]) || [];
  if (!ids.length) return [];
  const p = r.pipeline();
  ids.forEach((id) => {
    p.hgetall(`web:conv:meta:${id}`);
    p.llen(`web:conv:msgs:${id}`);
  });
  const out = (await p.exec()) as unknown[];
  const rows: ChatRow[] = [];
  const stale: string[] = [];
  ids.forEach((id, i) => {
    const meta = out[i * 2] as { title?: string; last?: number | string } | null;
    if (!meta || !Object.keys(meta).length) {
      stale.push(String(id)); // sudah kedaluwarsa
      return;
    }
    rows.push({
      id: String(id),
      title: meta.title || String(id),
      last: Number(meta.last) || 0,
      count: Number(out[i * 2 + 1]) || 0,
    });
  });
  if (stale.length) await r.zrem(IDX, ...stale).catch(() => null);
  return rows;
}

export async function getWebConv(id: string): Promise<{ title: string; messages: Msg[] }> {
  const r = db();
  const [meta, rows] = await Promise.all([
    r.hgetall<{ title?: string }>(`web:conv:meta:${id}`),
    r.lrange(`web:conv:msgs:${id}`, 0, -1),
  ]);
  return {
    title: meta?.title || id,
    messages: ((rows as unknown[]) || []).filter((x): x is Msg => !!x && typeof x === "object"),
  };
}

export async function deleteWebConv(id: string): Promise<void> {
  await db().pipeline().del(`web:conv:msgs:${id}`).del(`web:conv:meta:${id}`).zrem(IDX, id).exec();
}

export async function clearWebConvs(): Promise<void> {
  const r = db();
  const ids = ((await r.zrange(IDX, 0, -1)) as (string | number)[]) || [];
  const p = r.pipeline();
  ids.forEach((id) => {
    p.del(`web:conv:msgs:${id}`);
    p.del(`web:conv:meta:${id}`);
  });
  p.del(IDX);
  await p.exec();
}
