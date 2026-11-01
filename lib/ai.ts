import { db } from "./redis";
import { countryName } from "./format";

export const AI_MODEL = "gemini-3.5-flash-lite";

const KEY = "ai:key"; // token Gemini (string)
const HIST = "ai:hist"; // riwayat saran, terbaru di depan
const LAST = "ai:last"; // saran terakhir per "{sumber}|{negara}", untuk kartu Tindakan
const HIST_MAX = 100;
const TIMEOUT_MS = 20000;

export type AiEntry = {
  id: string;
  t: number;
  ref: string; // nama ramah sumber, mis. "Instagram"
  country: string; // kode 2 huruf
  hashtags: string[];
  saran: string;
  model: string;
};

/** Pesan galat yang aman ditampilkan ke admin (tidak pernah memuat token). */
export class AiError extends Error {}

// ---------- token ----------

export async function getKey(): Promise<string | null> {
  const v = await db().get<string | number>(KEY);
  const s = v === null || v === undefined ? "" : String(v);
  return s || null;
}

export async function hasKey(): Promise<boolean> {
  return (await db().exists(KEY)) === 1;
}

export function validKey(k: string): boolean {
  return /^\S{10,300}$/.test(k);
}

export async function setKey(k: string) {
  await db().set(KEY, k);
}

export async function deleteKey() {
  await db().del(KEY);
}

/** Tampilan sebagian, mis. AQ.A••••xyz1. Token utuh tidak pernah dikirim ke browser. */
export function maskKey(k: string): string {
  return k.length >= 12 ? `${k.slice(0, 4)}••••${k.slice(-4)}` : "••••";
}

// ---------- panggilan Gemini ----------

const SYSTEM =
  "Kamu asisten pemasaran media sosial untuk toko hair extension (EMAHAIRSHOP). " +
  "Balas hanya dengan JSON valid, tanpa teks lain dan tanpa blok kode.";

function buildPrompt(refLabel: string, country: string): string {
  const negara = `${countryName(country)} (${country})`;
  return [
    `Pengunjung tautan toko berasal dari ${refLabel} di negara ${negara}.`,
    "Beri hashtag yang relevan untuk hair extension (misalnya clip-in, tape-in, human hair, wig, rambut) dan cocok untuk audiens itu.",
    "Pakai bahasa yang benar-benar dipakai orang di negara tersebut (boleh campur bahasa Inggris), bukan terjemahan kaku.",
    "Jangan mengaku tahu tren hari ini; pilih hashtag yang umum dan populer.",
    'Format: {"hashtags": ["#contoh", ...], "saran": "..."}',
    "hashtags: 6 sampai 8 item, tiap item diawali #, tanpa spasi.",
    "saran: 1 sampai 2 kalimat Bahasa Indonesia tentang cara memakai hashtag atau konten itu di platform tersebut.",
  ].join("\n");
}

function friendly(status: number, apiMsg: string): string {
  if (status === 429) return "Kuota atau batas permintaan Gemini habis. Coba lagi nanti.";
  if (status === 400 && /api key|api_key/i.test(apiMsg)) return "Token ditolak Gemini (tidak valid). Periksa kembali token.";
  if (status === 401 || status === 403) return "Token ditolak Gemini (tidak punya izin atau tidak didukung).";
  if (status === 404) return `Model ${AI_MODEL} tidak ditemukan untuk token ini.`;
  if (status >= 500) return "Layanan Gemini sedang bermasalah. Coba lagi nanti.";
  return "Gemini menolak permintaan.";
}

async function callGemini(key: string, prompt: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      // model ini tidak menerima temperature/top_p/top_k, jadi tidak dikirim
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 800 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new AiError(timeout ? "Gemini terlalu lama menjawab. Coba lagi." : "Tidak bisa terhubung ke Gemini.");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // isi bukan JSON
  }
  const d = data as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;

  if (!res.ok) {
    const raw = String(d?.error?.message ?? "").split(key).join("***");
    const base = friendly(res.status, raw);
    // pesan asli dari Google ikut ditampilkan (dipotong) supaya mudah ditelusuri
    throw new AiError(raw ? `${base} (${res.status}: ${raw.slice(0, 160)})` : `${base} (${res.status})`);
  }

  const text = (d?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
  if (!text) throw new AiError("Gemini tidak memberi jawaban.");
  return text;
}

/** Tes singkat: kembalikan teks balasan model, atau lempar AiError dengan pesan galat asli. */
export async function testKey(key: string): Promise<string> {
  const t = await callGemini(key, 'Balas JSON ini saja: {"ok": true}');
  return t.slice(0, 60);
}

// ---------- bersihkan hasil ----------

function cleanTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of raw) {
    const body = String(x ?? "")
      .replace(/^#+/, "")
      .replace(/[^\p{L}\p{N}_]/gu, "");
    if (body.length < 2 || body.length > 40) continue;
    const k = body.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(`#${body}`);
    if (out.length === 8) break;
  }
  return out;
}

function parseJson(text: string): { hashtags?: unknown; saran?: unknown } | null {
  const t = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(t.slice(a, b + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ---------- minta saran + riwayat ----------

const asEntry = (v: unknown): AiEntry | null => {
  try {
    const o = typeof v === "string" ? JSON.parse(v) : v;
    return o && typeof o === "object" && typeof (o as AiEntry).id === "string" ? (o as AiEntry) : null;
  } catch {
    return null;
  }
};

export async function askAi(ref: string, country: string): Promise<AiEntry> {
  const key = await getKey();
  if (!key) throw new AiError("Token AI belum diisi.");

  const text = await callGemini(key, buildPrompt(ref, country));
  const j = parseJson(text);
  const hashtags = cleanTags(j?.hashtags);
  if (hashtags.length < 3) throw new AiError("Hasil AI tidak bisa dipakai. Coba minta ulang.");
  const saran = String(j?.saran ?? "").replace(/\s+/g, " ").trim().slice(0, 400);

  const entry: AiEntry = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    t: Date.now(),
    ref,
    country,
    hashtags,
    saran,
    model: AI_MODEL,
  };
  const p = db().pipeline();
  p.lpush(HIST, entry);
  p.ltrim(HIST, 0, HIST_MAX - 1);
  p.hset(LAST, { [`${ref}|${country}`]: entry });
  await p.exec();
  return entry;
}

export async function listHistory(): Promise<AiEntry[]> {
  const raw = await db().lrange(HIST, 0, HIST_MAX - 1);
  return (raw ?? []).map(asEntry).filter((x): x is AiEntry => !!x);
}

/** Saran terakhir per "{sumber}|{negara}". */
export async function lastMap(): Promise<Record<string, AiEntry>> {
  const raw = (await db().hgetall(LAST)) as Record<string, unknown> | null;
  const out: Record<string, AiEntry> = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    const e = asEntry(v);
    if (e) out[k] = e;
  }
  return out;
}

export async function deleteEntry(id: string) {
  const all = await listHistory();
  const kept = all.filter((e) => e.id !== id);
  const gone = all.find((e) => e.id === id);
  const p = db().pipeline();
  p.del(HIST);
  if (kept.length) p.rpush(HIST, ...kept);
  if (gone) {
    // kalau yang dihapus adalah saran terakhir pasangan itu, ganti dengan entri sebelumnya (jika ada)
    const field = `${gone.ref}|${gone.country}`;
    const prev = kept.find((e) => e.ref === gone.ref && e.country === gone.country);
    if (prev) p.hset(LAST, { [field]: prev });
    else p.hdel(LAST, field);
  }
  await p.exec();
}

export async function clearHistory() {
  await db().del(HIST, LAST);
}
