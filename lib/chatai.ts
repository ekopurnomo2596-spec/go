import { db } from "./redis";

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
 * chatbot yang sebenarnya tetap jalan pakai GEMINI_API_KEYS di environment Vercel portal.
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

/** Hapus pengaturan di sini; portal kembali pakai default dari environment-nya sendiri. */
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
