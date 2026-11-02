import { randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "./redis";
import { getAnalytics, listLinks } from "./links";
import { getChecks } from "./linkcheck";
import { countryName, jakartaDay } from "./format";
import { groupByLabel, labelRef } from "./sumber";

/**
 * Laporan mingguan ke Telegram. Token bot dan chat ID disimpan di Redis (hash `tg:report`),
 * diisi dari halaman Token. Token tidak pernah dikirim balik ke browser.
 */
const KEY = "tg:report";
/** "report" = laporan mingguan, "visit" = notifikasi kunjungan harian (dibaca portal dari Redis yang sama). */
export type TgKind = "report" | "visit";
const keyOf = (k: TgKind) => (k === "visit" ? "tg:visit" : KEY);
const pairKeyOf = (k: TgKind) => (k === "visit" ? "tg:visit:pair" : "tg:pair");
const TIMEOUT_MS = 10000;

export type TgCfg = { token: string; chat: string; secret?: string };

/** Galat yang pesannya aman ditampilkan (tidak pernah memuat token). */
export class TgError extends Error {}

export const validBotToken = (t: string) => /^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(t);
export const validChat = (c: string) => /^-?\d{1,20}$/.test(c) || /^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(c);

export function maskBotToken(t: string): string {
  return t.length > 10 ? `${t.slice(0, 4)}…${t.slice(-4)}` : "••••";
}

export async function getTg(kind: TgKind = "report"): Promise<TgCfg | null> {
  const h = await db().hgetall<{ token?: string; chat?: string; secret?: string }>(keyOf(kind));
  if (!h?.token) return null;
  return { token: String(h.token), chat: String(h.chat ?? ""), secret: h.secret ? String(h.secret) : undefined };
}

export async function setTg(c: TgCfg, kind: TgKind = "report") {
  await db().hset(keyOf(kind), { token: c.token, chat: c.chat, secret: c.secret ?? "" });
}

export async function deleteTg(kind: TgKind = "report") {
  await db().del(keyOf(kind));
}

async function call(token: string, method: string, body: Record<string, unknown>): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new TgError("Telegram tidak menjawab. Coba lagi sebentar lagi.");
  }
  if (res.ok) return ((await res.json().catch(() => ({}))) as { result?: unknown }).result;
  if (res.status === 401 || res.status === 404) throw new TgError("Token bot ditolak Telegram. Periksa token-nya.");
  let desc = "";
  try {
    desc = String(((await res.json()) as { description?: string }).description ?? "");
  } catch {
    /* abaikan */
  }
  if (/bad webhook|https/i.test(desc)) throw new TgError("Telegram menolak alamat webhook. Halaman ini harus dibuka lewat alamat HTTPS publik (bukan localhost).");
  if (/webhook/i.test(desc)) throw new TgError("Bot ini sedang dipakai project lain. Pakai bot baru khusus laporan.");
  if (/chat not found/i.test(desc)) throw new TgError("Chat tidak ditemukan. Pastikan sudah menekan Start pada bot.");
  if (/blocked|kicked|not a member/i.test(desc)) throw new TgError("Bot tidak bisa mengirim ke chat itu (diblokir atau belum jadi anggota).");
  throw new TgError(`Telegram menolak permintaan (${res.status}).`);
}

export async function sendMessage(c: TgCfg, text: string): Promise<void> {
  await call(c.token, "sendMessage", { chat_id: c.chat, text, disable_web_page_preview: true });
}


/* ---------- teks laporan ---------- */

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function parts(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return { y, m: m - 1, d };
}

export function rangeLabel(from: string, to: string): string {
  const a = parts(from);
  const b = parts(to);
  const left = `${a.d} ${BULAN[a.m]}${a.y !== b.y ? ` ${a.y}` : ""}`;
  return `${left} – ${b.d} ${BULAN[b.m]} ${b.y}`;
}

export const dayName = (day: string) => HARI[new Date(`${day}T00:00:00Z`).getUTCDay()];

/** Persen dibulatkan, jumlahnya dijaga tetap 100 (sisa masuk ke yang terbesar). */
function percents(rows: [string, number][]): [string, number][] {
  const sum = rows.reduce((a, [, n]) => a + n, 0);
  if (!sum) return [];
  const out = rows.map(([k, n]) => [k, Math.round((n / sum) * 100)] as [string, number]);
  out[0][1] += 100 - out.reduce((a, [, n]) => a + n, 0);
  return out.filter(([, n]) => n > 0);
}

const deviceLabel = (d: string) => (d === "desktop" ? "Desktop" : d === "mobile" || d === "tablet" ? "HP" : "Lainnya");

export async function buildReport(): Promise<string> {
  // 7 hari penuh yang berakhir kemarin; dijalankan Senin = Senin sampai Minggu
  const a = await getAnalytics(7, 1);
  const [links, checks] = await Promise.all([listLinks(), getChecks()]);

  const from = jakartaDay(7);
  const to = jakartaDay(1);
  const L: string[] = [`📊 Rangkuman mingguan go.emahairshop.com`, rangeLabel(from, to), ""];

  let trend = "";
  if (a.prevTotal !== null && a.prevTotal > 0) {
    const pct = Math.round(((a.total - a.prevTotal) / a.prevTotal) * 100);
    trend = pct > 0 ? `  (naik ${pct}% dari minggu lalu)` : pct < 0 ? `  (turun ${-pct}% dari minggu lalu)` : `  (sama dengan minggu lalu)`;
  }
  L.push(`Total klik: ${a.total}${trend}`);

  const top = a.topLinks.filter((x) => x.n > 0).slice(0, 3);
  if (top.length) {
    const w = Math.max(...top.map((x) => x.slug.length + 1)) + 3;
    L.push("", "Link teratas", ...top.map((x, i) => `${i + 1}. ${`/${x.slug}`.padEnd(w)}${x.n} klik`));
  } else {
    L.push("", "Belum ada klik pada periode ini.");
  }

  const countries = groupByLabel(a.countries, countryName).slice(0, 3);
  if (countries.length) L.push("", "Negara", countries.map(([k, n]) => `${k} ${n}`).join(" · "));

  const refs = groupByLabel(a.referrers, labelRef).slice(0, 3);
  if (refs.length) L.push("", "Sumber", refs.map(([k, n]) => `${k} ${n}`).join(" · "));

  const dev = percents(groupByLabel(a.devices, deviceLabel));
  if (dev.length) L.push("", "Perangkat", dev.map(([k, n]) => `${k} ${n}%`).join(" · "));

  if (a.peak) L.push("", `Hari tersibuk: ${dayName(a.peak.day)} (${a.peak.n} klik)`);

  // hanya tautan yang dicek otomatis (yang "jangan dicek" tidak dihitung)
  const checked = links.filter((l) => !l.noCheck && checks[l.slug]);
  if (checked.length) {
    const dead = checked.filter((l) => !checks[l.slug].ok);
    L.push(
      "",
      dead.length
        ? `Status tautan: ${checked.length} dicek, ${dead.length} mati ⚠️ (${dead.map((l) => `/${l.slug}`).join(", ")})`
        : `Status tautan: ${checked.length} dicek, semua hidup ✅`,
    );
  }
  return L.join("\n");
}

/** Susun laporan lalu kirim. Melempar TgError kalau belum diatur atau gagal. */
export async function sendWeeklyReport(): Promise<void> {
  const cfg = await getTg();
  if (!cfg) throw new TgError("Telegram belum diatur. Isi token bot di halaman Token.");
  if (!cfg.chat) throw new TgError("Chat belum tersambung. Kirim kode ke bot dari halaman Token.");
  await sendMessage(cfg, await buildReport());
}


/* ---------- sambungkan chat lewat kode (tanpa cari chat ID) ----------
 * 1. startPair: buat kode acak (berlaku 10 menit), disimpan di Redis
 * 2. pengguna mengirim kode itu ke bot
 * 3. Telegram memanggil webhook (/api/telegram); handleUpdate mencocokkan kode, menyimpan chat ID,
 *    dan bot langsung membalas. Webhook dipasang saat token disimpan (setWebhook).
 * Bot jadi tidak boleh dipakai project lain (satu bot hanya punya satu webhook), pakai bot khusus laporan.
 */
const PAIR_TTL = 600;
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 huruf, tanpa yang mirip (0/O, 1/I)

export type Pair = { code: string; username: string };

const makeCode = () => Array.from(randomBytes(8), (b: number) => ALPHABET[b & 31]).join("");
export const makeSecret = () => randomBytes(24).toString("base64url");

/** Kode yang sedang menunggu (belum kedaluwarsa), atau null. */
export async function getPair(kind: TgKind = "report"): Promise<Pair | null> {
  const raw = await db().get<string>(pairKeyOf(kind));
  if (raw === null || raw === undefined) return null;
  const [code, username] = String(raw).split("|");
  return code && username ? { code, username } : null;
}

export async function startPair(kind: TgKind = "report"): Promise<Pair> {
  const cfg = await getTg(kind);
  if (!cfg) throw new TgError("Simpan token bot dulu.");
  const me = (await call(cfg.token, "getMe", {})) as { username?: string } | undefined;
  if (!me?.username) throw new TgError("Tidak bisa membaca nama bot. Periksa token-nya.");
  const code = makeCode();
  await db().set(pairKeyOf(kind), `${code}|${me.username}`, { ex: PAIR_TTL });
  return { code, username: me.username };
}

export async function clearPair(kind: TgKind = "report") {
  await db().del(pairKeyOf(kind));
}

/** Pasang webhook supaya pesan ke bot dikirim Telegram ke aplikasi ini. */
export async function setWebhook(token: string, url: string, secret: string): Promise<void> {
  await call(token, "setWebhook", { url, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true });
}

export async function removeWebhook(token: string): Promise<void> {
  await call(token, "deleteWebhook", {}).catch(() => {});
}

function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

type Update = { message?: { text?: string; chat?: { id?: number } } };

/** Dipanggil webhook. Mengembalikan false kalau secret salah (bukan dari Telegram). */
export async function handleUpdate(update: Update, secretHeader: string | null, kind: TgKind = "report"): Promise<boolean> {
  const cfg = await getTg(kind);
  if (!cfg?.secret || !secretHeader || !sameSecret(cfg.secret, secretHeader)) return false;
  if (cfg.chat) return true; // sudah tersambung: pesan lain diabaikan
  const text = (update.message?.text ?? "").trim().toLowerCase();
  const id = update.message?.chat?.id;
  if (!text || id === undefined) return true;
  const pair = await getPair(kind);
  if (!pair) return true;
  const code = pair.code.toLowerCase();
  if (text !== code && text !== `/start ${code}`) return true;
  const chat = String(id);
  await setTg({ ...cfg, chat }, kind);
  await clearPair(kind);
  await sendMessage(
    { token: cfg.token, chat },
    kind === "visit"
      ? "✅ Tersambung. Notifikasi pengunjung baru emahairshop.com akan dikirim ke chat ini."
      : "✅ Tersambung. Laporan mingguan go.emahairshop.com akan dikirim ke chat ini tiap Senin 08.00 WIB.",
  );
  return true;
}

/** Pesan tes untuk notifikasi kunjungan (tampilannya sama dengan notif dari portal). */
export async function sendVisitTest(): Promise<void> {
  const cfg = await getTg("visit");
  if (!cfg) throw new TgError("Telegram belum diatur. Isi token bot di halaman Token.");
  if (!cfg.chat) throw new TgError("Chat belum tersambung. Kirim kode ke bot dari halaman Token.");
  await sendMessage(cfg, "Tes notifikasi kunjungan\nNotifikasi pengunjung baru akan dikirim ke chat ini.");
}
