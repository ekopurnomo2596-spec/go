/**
 * Tampilan widget chat (bentuk tombol, gelembung, animasi, warna). Tidak ada import server di sini,
 * jadi aman dipakai komponen client dashboard. Disimpan di Redis "cfg:chat:style" (JSON), dibaca widget.js
 * lewat api/chat.js?cfg=1. Daftar nilai yang sah HARUS sama dengan STYLE_OPTS di api/chat.js dan public/widget.js.
 * Nilai bawaan = tampilan widget sebelum fitur ini ada.
 */

export const STYLE_FIELDS = {
  launcher: { label: "Bentuk", options: [["pill", "Pil dengan teks"], ["circle", "Bulat"], ["square", "Kotak membulat"]] },
  pos: { label: "Posisi", options: [["right", "Kanan"], ["left", "Kiri"]] },
  enter: { label: "Animasi muncul", options: [["none", "Tanpa"], ["fade", "Memudar"], ["pop", "Membesar"], ["slide", "Naik"], ["bounce", "Memantul"]] },
  panel: { label: "Sudut", options: [["sharp", "Tajam"], ["soft", "Sedikit bulat"], ["round", "Sangat bulat"]] },
  open: { label: "Animasi buka", options: [["none", "Tanpa"], ["fade", "Memudar"], ["slide", "Naik"], ["pop", "Membesar"]] },
  bubble: { label: "Bentuk gelembung", options: [["round", "Bulat"], ["soft", "Sedikit bulat"], ["square", "Kotak"], ["tail", "Dengan ekor"]] },
  msg: { label: "Animasi pesan", options: [["none", "Tanpa"], ["fade", "Memudar"], ["slide", "Naik"], ["pop", "Membesar"]] },
} as const;

export type StyleKey = keyof typeof STYLE_FIELDS;

export type ChatStyle = {
  launcher: "pill" | "circle" | "square";
  pos: "right" | "left";
  enter: "none" | "fade" | "pop" | "slide" | "bounce";
  panel: "sharp" | "soft" | "round";
  open: "none" | "fade" | "slide" | "pop";
  bubble: "round" | "soft" | "square" | "tail";
  msg: "none" | "fade" | "slide" | "pop";
  /** "" = warna bawaan (hitam/putih mengikuti tema), atau "#rrggbb". */
  accent: string;
  /** Tombol berdenyut saat ada sapaan/balasan baru. */
  pulse: boolean;
};

export const DEFAULT_STYLE: ChatStyle = {
  launcher: "pill",
  pos: "right",
  enter: "none",
  panel: "sharp",
  open: "none",
  bubble: "round",
  msg: "none",
  accent: "",
  pulse: true,
};

/** Bersihkan input apa pun (string JSON / objek) jadi ChatStyle yang valid; yang tidak sah jatuh ke bawaan. */
export function cleanStyle(raw: unknown): ChatStyle {
  let o: unknown = raw;
  if (typeof raw === "string") {
    try {
      o = JSON.parse(raw);
    } catch {
      o = null;
    }
  }
  const src = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
  const out: ChatStyle = { ...DEFAULT_STYLE };
  for (const k of Object.keys(STYLE_FIELDS) as StyleKey[]) {
    const v = src[k];
    if ((STYLE_FIELDS[k].options as readonly (readonly [string, string])[]).some(([val]) => val === v)) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  if (typeof src.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(src.accent)) out.accent = src.accent.toLowerCase();
  if (src.pulse === false) out.pulse = false;
  return out;
}

export const isDefaultStyle = (s: ChatStyle) => JSON.stringify(s) === JSON.stringify(DEFAULT_STYLE);

/** Teks di atas warna aksen: putih atau hitam, mana yang kontrasnya lebih baik. */
export function accentText(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#111111" : "#ffffff";
}
