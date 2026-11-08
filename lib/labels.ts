import { db } from "./redis";
import { cleanInfoTexts, type InfoTexts } from "./pengumuman";

/**
 * Label kecil di tombol portal emahairshop.com (mis. "BARU", "PROMO -20%").
 * Disimpan di database yang sama dengan portal (key `portal:labels`, teks JSON).
 * Portal membacanya lewat middleware.js dan /api/labels, lalu menempelkannya ke tombol
 * yang atribut `data-lbl`-nya sama dengan `key` di bawah.
 * Seperti Pengumuman, tiap label diterjemahkan AI ke 7 bahasa portal (dengan pratinjau sebelum disimpan).
 */
export const LABEL_KEY = "portal:labels";
export const MAX_LABEL = 14;
export const MAX_LABEL_TR = 20;

export const LABEL_BUTTONS = [
  { key: "shop", name: "Shop Wholesale" },
  { key: "review", name: "Customer Reviews" },
  { key: "blog", name: "Blog" },
  { key: "help", name: "Help Center" },
  { key: "contact", name: "Contact Us" },
  { key: "about", name: "About Us" },
] as const;

/** Nama warna -> kode warna. Portal punya daftar yang sama (hanya nama yang dikirim ke portal). */
export const LABEL_COLORS = { merah: "#EE4D2D", emas: "#a8802f", hijau: "#1f8a4c", hitam: "#1a1a1a" } as const;
export type LabelColor = keyof typeof LABEL_COLORS;
export type LabelItem = { on: boolean; text: string; color: LabelColor; texts: InfoTexts };
export type Labels = Record<string, LabelItem>;

export const isColor = (c: string): c is LabelColor => c in LABEL_COLORS;

export function cleanLabels(raw: unknown): Labels {
  const out: Labels = {};
  const src = raw && typeof raw === "object" ? (raw as Record<string, Partial<LabelItem>>) : {};
  for (const b of LABEL_BUTTONS) {
    const x = src[b.key];
    const text = typeof x?.text === "string" ? x.text.replace(/\s+/g, " ").trim().slice(0, MAX_LABEL) : "";
    out[b.key] = {
      on: !!x?.on && !!text,
      text,
      color: x?.color && isColor(x.color) ? x.color : "merah",
      texts: text ? cleanInfoTexts(x?.texts, MAX_LABEL_TR) : {},
    };
  }
  return out;
}

export async function getLabelState(): Promise<{ items: Labels; anim: boolean }> {
  const raw = await db().get<unknown>(LABEL_KEY);
  try {
    const o = (typeof raw === "string" ? JSON.parse(raw) : raw) as { items?: unknown; anim?: unknown } | null;
    return { items: cleanLabels(o?.items), anim: o?.anim === true };
  } catch {
    return { items: cleanLabels(null), anim: false };
  }
}

export async function getLabels(): Promise<Labels> {
  return (await getLabelState()).items;
}

/** `anim`: toggle "Tampilkan animasi" (satu untuk semua label). Portal menambah kelas animasi pada label bila true. */
export async function setLabels(items: Labels, anim = false) {
  await db().set(LABEL_KEY, JSON.stringify({ items, anim, v: Date.now() }));
}
