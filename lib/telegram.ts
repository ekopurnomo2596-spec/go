import { randomBytes } from "node:crypto";
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
const TIMEOUT_MS = 10000;

export type TgCfg = { token: string; chat: string };

/** Galat yang pesannya aman ditampilkan (tidak pernah memuat token). */
export class TgError extends Error {}

export const validBotToken = (t: string) => /^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(t);
export const validChat = (c: string) => /^-?\d{1,20}$/.test(c) || /^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(c);

export function maskBotToken(t: string): string {
  return t.length > 10 ? `${t.slice(0, 4)}…${t.slice(-4)}` : "••••";
}

export async function getTg(): Promise<TgCfg | null> {
  const h = await db().hgetall<{ token?: string; chat?: string }>(KEY);
  if (!h?.token) return null;
  return { token: String(h.token), chat: String(h.chat ?? "") };
}

export async function setTg(c: TgCfg) {
  await db().hset(KEY, { token: c.token, chat: c.chat });
}

export async function deleteTg() {
  await db().del(KEY);
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
  if (/webhook/i.test(desc)) throw new TgError("Bot ini memakai webhook (dipakai project lain). Pakai bot baru khusus laporan, atau isi chat ID manual.");
  if (/chat not found/i.test(desc)) throw new TgError("Chat tidak ditemukan. Sambungkan chat lewat tombol Sambungkan, dan pastikan sudah menekan Start pada bot.");
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
  if (!cfg.chat) throw new TgError("Chat belum tersambung. Tekan Sambungkan di halaman Token, atau isi chat ID.");
  await sendMessage(cfg, await buildReport());
}


/* ---------- sambungkan chat lewat kode (tanpa cari chat ID) ----------
 * 1. startPair: buat kode acak (berlaku 10 menit) + tautan t.me/<bot>?start=<kode>
 * 2. pengguna membuka tautan dan menekan Start, jadi Telegram mengirim "/start <kode>" ke bot
 * 3. finishPair: baca pesan masuk lewat getUpdates, cocokkan kode, simpan chat ID
 * Memakai getUpdates, jadi bot tidak boleh sedang memakai webhook (pakai bot khusus laporan).
 */
const PAIR = "tg:pair";

export async function startPair(): Promise<{ code: string; link: string }> {
  const cfg = await getTg();
  if (!cfg) throw new TgError("Simpan token bot dulu.");
  const me = (await call(cfg.token, "getMe", {})) as { username?: string } | undefined;
  if (!me?.username) throw new TgError("Tidak bisa membaca nama bot. Periksa token-nya.");
  const code = randomBytes(9).toString("base64url");
  await db().set(PAIR, code, { ex: 600 });
  return { code, link: `https://t.me/${me.username}?start=${code}` };
}

export async function finishPair(): Promise<void> {
  const cfg = await getTg();
  if (!cfg) throw new TgError("Simpan token bot dulu.");
  const raw = await db().get<string | number>(PAIR);
  if (raw === null || raw === undefined) throw new TgError("Kode sudah kedaluwarsa. Tekan Sambungkan lagi.");
  const code = String(raw);
  const ups = ((await call(cfg.token, "getUpdates", { limit: 100, allowed_updates: ["message"] })) as
    | { message?: { text?: string; chat?: { id?: number } } }[]
    | undefined) ?? [];
  const hit = [...ups].reverse().find((u) => u.message?.text === `/start ${code}` && u.message.chat?.id !== undefined);
  if (!hit) throw new TgError("Belum ada pesan Start dengan kode itu. Buka tautannya, tekan Start, lalu cek lagi.");
  const chat = String(hit.message!.chat!.id);
  await setTg({ token: cfg.token, chat });
  await db().del(PAIR);
  await sendMessage({ token: cfg.token, chat }, "✅ Tersambung. Laporan mingguan go.emahairshop.com akan dikirim ke chat ini tiap Senin 08.00 WIB.");
}
