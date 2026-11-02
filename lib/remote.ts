import { Redis } from "@upstash/redis";
import { db } from "./redis";

/**
 * Koneksi ke Redis milik project lain (bot WhatsApp & Telegram).
 * URL + token disimpan di database utama (hash `remote:wa` / `remote:tg`),
 * diisi dari halaman Token. Semua akses ke database itu hanya BACA.
 */

export type Src = "wa" | "tg";
export const SOURCES: { id: Src; name: string }[] = [
  { id: "wa", name: "WhatsApp" },
  { id: "tg", name: "Telegram" },
];
export const isSrc = (s: unknown): s is Src => s === "wa" || s === "tg";
export const srcName = (s: Src) => SOURCES.find((x) => x.id === s)!.name;

export type Cfg = { url: string; token: string };

const key = (s: Src) => `remote:${s}`;

export function validUrl(u: string): boolean {
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
}
export const validToken = (t: string) => /^\S{10,500}$/.test(t);

export function maskToken(t: string): string {
  return t.length > 10 ? `${t.slice(0, 4)}…${t.slice(-4)}` : "••••";
}

export async function getCfg(s: Src): Promise<Cfg | null> {
  const h = await db().hgetall<{ url?: string; token?: string }>(key(s));
  if (!h?.url || !h?.token) return null;
  return { url: String(h.url), token: String(h.token) };
}

export async function setCfg(s: Src, c: Cfg) {
  await db().hset(key(s), { url: c.url, token: c.token });
}

export async function deleteCfg(s: Src) {
  await db().del(key(s));
}

function client(c: Cfg): Redis {
  return new Redis({ url: c.url, token: c.token, retry: { retries: 1, backoff: () => 300 } });
}

/** Galat yang pesannya aman ditampilkan (tidak pernah memuat token). */
export class RemoteError extends Error {}

async function guard<T>(p: Promise<T>): Promise<T> {
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 10000)),
    ]);
  } catch (e) {
    const m = String((e as Error)?.message ?? "");
    if (m === "timeout") throw new RemoteError("Redis tidak menjawab (timeout). Periksa URL-nya.");
    if (/NOPERM|permission/i.test(m)) throw new RemoteError("Token ini read-only. Pakai token yang punya akses tulis untuk menghapus.");
    if (/WRONGPASS|Unauthorized|invalid|token/i.test(m)) throw new RemoteError("Token ditolak. Periksa token-nya.");
    throw new RemoteError("Tidak bisa terhubung. Periksa URL dan token.");
  }
}

export async function ping(c: Cfg): Promise<void> {
  await guard(client(c).ping());
}

/* ---------- percakapan (skema sama di project WhatsApp & Telegram) ----------
 * conv:idx          sorted set chatId, skor = waktu pesan terakhir
 * conv:meta:{chat}  hash { title, last }
 * conv:msgs:{chat}  list pesan { t, r: "user"|"bot", n, x }
 */
export type ChatRow = { id: string; title: string; last: number; count: number };
export type Msg = { t: number; r: "user" | "bot"; n?: string; x?: string };

export const validChatId = (id: string) => /^-?\d{1,20}$/.test(id);

export async function listConvs(c: Cfg, n = 100): Promise<ChatRow[]> {
  const r = client(c);
  return guard(
    (async () => {
      const ids = ((await r.zrange(`conv:idx`, 0, n - 1, { rev: true })) as (string | number)[]) || [];
      if (!ids.length) return [];
      const p = r.pipeline();
      ids.forEach((id) => {
        p.hgetall(`conv:meta:${id}`);
        p.llen(`conv:msgs:${id}`);
      });
      const out = (await p.exec()) as unknown[];
      const rows: ChatRow[] = [];
      ids.forEach((id, i) => {
        const meta = out[i * 2] as { title?: string; last?: number | string } | null;
        if (!meta) return; // sudah kedaluwarsa
        rows.push({
          id: String(id),
          title: meta.title || String(id),
          last: Number(meta.last) || 0,
          count: Number(out[i * 2 + 1]) || 0,
        });
      });
      return rows;
    })(),
  );
}

export async function getConv(c: Cfg, id: string): Promise<{ title: string; messages: Msg[] }> {
  const r = client(c);
  return guard(
    (async () => {
      const [meta, rows] = await Promise.all([
        r.hgetall<{ title?: string }>(`conv:meta:${id}`),
        r.lrange(`conv:msgs:${id}`, 0, -1),
      ]);
      return {
        title: meta?.title || id,
        messages: ((rows as unknown[]) || []).filter((x): x is Msg => !!x && typeof x === "object"),
      };
    })(),
  );
}

/** Hapus satu percakapan. Perlu token dengan akses tulis. */
export async function deleteConv(c: Cfg, id: string): Promise<void> {
  const r = client(c);
  await guard(r.pipeline().del(`conv:msgs:${id}`).del(`conv:meta:${id}`).zrem("conv:idx", id).exec());
}

/** Hapus semua percakapan di sumber itu. Perlu token dengan akses tulis. */
export async function clearConvs(c: Cfg): Promise<void> {
  const r = client(c);
  await guard(
    (async () => {
      const ids = ((await r.zrange("conv:idx", 0, -1)) as (string | number)[]) || [];
      const p = r.pipeline();
      ids.forEach((id) => {
        p.del(`conv:msgs:${id}`);
        p.del(`conv:meta:${id}`);
      });
      p.del("conv:idx");
      await p.exec();
    })(),
  );
}
