import { db } from "./redis";
import { DEFAULT_PRICE_FROM, DEFAULT_PROMPT_TEXT, DEFAULT_WELCOME_BONUS } from "./chatprompt-default";

/**
 * Pengaturan chatbot WEB (widget chat di emahairshop.com, dijalankan oleh project "portal").
 *
 * go dan portal memakai Upstash Redis yang SAMA (lihat lib/visits.ts & lib/telegram.ts yang
 * juga baca/tulis key dipakai bersama), jadi di sini kita langsung baca/tulis key "cfg:models"
 * persis seperti yang dibaca api/chat.js di portal (cache 30 detik di sana) — bukan salinan,
 * tapi sumber yang sama.
 *
 * Token Gemini di sini SENGAJA terpisah dari token AI milik go sendiri (lib/ai.ts, dipakai
 * fitur Tindakan/saran). Token di sini hanya dipakai untuk tombol "Tes" & daftar saran model;
 * chatbot yang sebenarnya memakai daftar key di bagian "key chatbot" bawah ini (Redis "cfg:chat:keys").
 */

const MODELS_KEY = "cfg:models";
const TOKEN_KEY = "cfg:chatkey";
const MODEL_RE = /^[a-z0-9._-]{3,60}$/i;
export const MAX_MODELS = 8;

export function validChatToken(k: string): boolean {
  return /^\S{10,300}$/.test(k);
}

export function maskChatToken(k: string): string {
  return k.length >= 12 ? `${k.slice(0, 4)}••••${k.slice(-4)}` : "••••";
}

export function validModelName(m: string): boolean {
  return MODEL_RE.test(m);
}

// ---------- token ----------

export async function getChatKey(): Promise<string | null> {
  const v = await db().get<string>(TOKEN_KEY);
  return typeof v === "string" && v ? v : null;
}

export async function setChatKey(k: string) {
  await db().set(TOKEN_KEY, k);
}

export async function deleteChatKey() {
  await db().del(TOKEN_KEY);
}

// ---------- key Gemini untuk chatbot (dibaca pages/api/chat.js, cache 30 detik) ----------

const CHAT_KEYS_KEY = "cfg:chat:keys";
export const MAX_CHAT_KEYS = 10;

export async function getChatKeys(): Promise<string[]> {
  const v = await db().get<string>(CHAT_KEYS_KEY);
  return typeof v === "string" ? [...new Set(v.split(/[\r\n,]+/).map((x) => x.trim()).filter(Boolean))] : [];
}

export async function setChatKeys(list: string[]) {
  if (list.length) await db().set(CHAT_KEYS_KEY, list.join("\n"));
  else await db().del(CHAT_KEYS_KEY);
}

// Nama key disimpan terpisah dari daftar key (portal membaca daftar key apa adanya, jadi formatnya tidak boleh berubah).
// Kuncinya potongan hash key, bukan key-nya, supaya nama tetap menempel ke key yang sama walau urutan berubah.
const CHAT_KEY_NAMES = "cfg:chat:keynames";
export const MAX_KEY_NAME = 40;

// Hash murni JS (bukan node:crypto) karena file ini ikut dibundel ke komponen client. Hanya dipakai sebagai ID nama,
// bukan untuk keamanan, dan hasilnya tidak pernah dikirim ke browser.
export function chatKeyId(k: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  let h3 = 0x9e3779b9;
  for (let i = 0; i < k.length; i++) {
    const c = k.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
    h3 = Math.imul(h3 ^ c, 2246822519);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  return [h1, h2].map((n) => (n >>> 0).toString(16).padStart(8, "0")).join("").slice(0, 12);
}

export async function getChatKeyNames(): Promise<Record<string, string>> {
  const v = await db().get<unknown>(CHAT_KEY_NAMES);
  let o: unknown = v;
  if (typeof v === "string") {
    try {
      o = JSON.parse(v);
    } catch {
      o = null;
    }
  }
  const out: Record<string, string> = {};
  if (o && typeof o === "object") {
    for (const [id, n] of Object.entries(o as Record<string, unknown>)) {
      if (/^[a-f0-9]{12}$/.test(id) && typeof n === "string" && n.trim()) out[id] = n.trim().slice(0, MAX_KEY_NAME);
    }
  }
  return out;
}

export async function setChatKeyNames(m: Record<string, string>) {
  if (Object.keys(m).length) await db().set(CHAT_KEY_NAMES, JSON.stringify(m));
  else await db().del(CHAT_KEY_NAMES);
}

// ---------- daftar model ----------

export type ModelsInfo = { models: string[]; source: "admin" | "default" };

export async function getModels(): Promise<ModelsInfo> {
  const stored = await db().get<string>(MODELS_KEY);
  if (typeof stored === "string" && stored.trim()) {
    return { models: stored.split(",").map((s) => s.trim()).filter(Boolean), source: "admin" };
  }
  return { models: [], source: "default" };
}

/** Validasi & bersihkan daftar; null kalau tidak valid. */
export function parseModelList(raw: string[]): string[] | null {
  const uniq = [...new Set(raw.map((s) => String(s).trim()).filter(Boolean))];
  if (!uniq.length || uniq.length > MAX_MODELS || !uniq.every(validModelName)) return null;
  return uniq;
}

export async function setModels(list: string[]) {
  await db().set(MODELS_KEY, list.join(","));
}

/** Hapus pengaturan di sini; chatbot kembali memakai daftar model bawaan. */
export async function resetModels() {
  await db().del(MODELS_KEY);
}

// ---------- panggilan langsung ke Google (bukan lewat portal) ----------

/** Tes satu model dengan permintaan super kecil. */
export async function testModel(
  model: string,
  key: string,
): Promise<{ ok: boolean; ms: number; status?: number; error?: string }> {
  const t0 = Date.now();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with: OK" }] }], generationConfig: { maxOutputTokens: 64 } }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      let msg = t;
      try {
        msg = JSON.parse(t).error.message;
      } catch {
        // bukan JSON, pakai teks mentah
      }
      return { ok: false, ms: Date.now() - t0, status: res.status, error: String(msg).slice(0, 160) };
    }
    return { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return { ok: false, ms: Date.now() - t0, error: timeout ? "timeout 12 dtk" : "gagal terhubung" };
  }
}

/** Daftar model Gemini yang tersedia untuk token ini (buat saran, bukan wajib dipakai). */
export async function listGoogleModels(key: string): Promise<string[]> {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const d = await res.json();
    type GModel = { name?: string; supportedGenerationMethods?: string[] };
    return ((d.models ?? []) as GModel[])
      .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent") && /^models\/gemini-/.test(m.name ?? ""))
      .map((m) => String(m.name).replace(/^models\//, ""))
      .filter((n) => !/(tts|image|embedding|live|audio|robotics|computer-use)/i.test(n))
      .sort();
  } catch {
    return [];
  }
}

// ---------- prompt chatbot ----------
// Prompt dulu hardcode di api/chat.js (portal). Sekarang disimpan di Redis dan dibaca portal
// (cache 30 detik) dari key yang sama dengan di bawah ini. Kalau kosong, portal pakai prompt darurat
// yang sangat pendek, jadi simpan sekali dari halaman Pengaturan Chatbot setelah pemasangan.

const PROMPT_SYSTEM_KEY = "cfg:prompt:system";
const PROMPT_COMPANY_KEY = "cfg:prompt:company";
const PROMPT_VARS_KEY = "cfg:prompt:vars";
export const MAX_PROMPT_CHARS = 100_000;

/**
 * Satu prompt saja. Dulu dipisah jadi "Info perusahaan" + "Prompt utama" yang disambung lewat {{COMPANY}};
 * sekarang digabung. Data lama tetap terbaca: kalau key company masih ada dan prompt lama memuat {{COMPANY}},
 * keduanya digabung saat dibaca, dan key company dihapus saat Simpan berikutnya.
 */
export type PromptData = {
  prompt: string;
  priceFrom: string;
  welcomeBonus: string;
};

export const DEFAULT_PROMPT: PromptData = {
  prompt: DEFAULT_PROMPT_TEXT,
  priceFrom: DEFAULT_PRICE_FROM,
  welcomeBonus: DEFAULT_WELCOME_BONUS,
};

/** Isi prompt tersimpan; source "default" kalau belum pernah disimpan dari dashboard (editor diisi bawaan). */
export async function getPrompt(): Promise<{ data: PromptData; source: "admin" | "default" }> {
  const [system, company, vars] = await Promise.all([
    db().get<string>(PROMPT_SYSTEM_KEY),
    db().get<string>(PROMPT_COMPANY_KEY),
    db().get<{ priceFrom?: string; welcomeBonus?: string } | string>(PROMPT_VARS_KEY),
  ]);
  if (typeof system !== "string" || !system.trim()) {
    return { data: DEFAULT_PROMPT, source: "default" };
  }
  let v: { priceFrom?: string; welcomeBonus?: string } = {};
  if (typeof vars === "string") {
    try {
      v = JSON.parse(vars);
    } catch {
      // abaikan, pakai bawaan
    }
  } else if (vars && typeof vars === "object") {
    v = vars;
  }
  const merged = typeof company === "string" && company.trim() ? system.split("{{COMPANY}}").join(company) : system;
  return {
    data: {
      prompt: merged,
      priceFrom: v.priceFrom ?? DEFAULT_PRICE_FROM,
      welcomeBonus: v.welcomeBonus ?? DEFAULT_WELCOME_BONUS,
    },
    source: "admin",
  };
}

/** Mengembalikan pesan error, atau null kalau valid. */
export function validatePrompt(d: PromptData): string | null {
  if (!d.prompt.trim()) return "Prompt tidak boleh kosong.";
  if (d.prompt.length > MAX_PROMPT_CHARS) return `Maksimal ${MAX_PROMPT_CHARS.toLocaleString("id-ID")} karakter.`;
  if (d.prompt.includes("{{COMPANY}}")) {
    return "{{COMPANY}} sudah tidak dipakai. Tempel info perusahaan langsung di dalam prompt, lalu hapus {{COMPANY}}.";
  }
  if (d.priceFrom.length > 20 || d.welcomeBonus.length > 20) return "Harga mulai / welcome bonus maksimal 20 karakter.";
  return null;
}

export async function setPrompt(d: PromptData) {
  await Promise.all([
    db().set(PROMPT_SYSTEM_KEY, d.prompt),
    db().del(PROMPT_COMPANY_KEY), // sudah digabung ke prompt
    db().set(PROMPT_VARS_KEY, JSON.stringify({ priceFrom: d.priceFrom.trim(), welcomeBonus: d.welcomeBonus.trim() })),
  ]);
}

/** Hapus prompt tersimpan; portal pakai prompt darurat sampai disimpan lagi. */
export async function resetPrompt() {
  await db().del(PROMPT_SYSTEM_KEY, PROMPT_COMPANY_KEY, PROMPT_VARS_KEY);
}
