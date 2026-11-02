// Nama sumber trafik yang ramah (hostname -> Instagram, WhatsApp, dst).
const REF_NAMES: [RegExp, string][] = [
  [/^(www\.)?emahairshop\.com$/, "EMAHAIRSHOP"], // klik dari tombol di website utama
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$|^fb\.me$/, "Facebook"],
  [/(^|\.)whatsapp\.com$|^wa\.me$/, "WhatsApp"],
  [/(^|\.)google\.[a-z.]+$/, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/^t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, "X"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/^t\.me$|(^|\.)telegram\.org$/, "Telegram"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/(^|\.)pinterest\.[a-z.]+$/, "Pinterest"],
];

export function labelRef(r: string): string {
  if (!r || r === "langsung") return "Langsung";
  const h = r.toLowerCase();
  for (const [re, name] of REF_NAMES) if (re.test(h)) return name;
  return h.replace(/^www\./, "");
}

export function labelDevice(d: string): string {
  if (d === "mobile") return "Mobile";
  if (d === "desktop") return "Desktop";
  if (d === "tablet") return "Tablet";
  return d || "Tidak diketahui";
}

/** Gabungkan baris yang labelnya sama (mis. l.instagram.com + instagram.com), urut terbesar dulu. */
export function groupByLabel(rows: [string, number][], label: (k: string) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const [k, v] of rows) m.set(label(k), (m.get(label(k)) ?? 0) + v);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
