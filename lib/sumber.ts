// Nama sumber trafik yang ramah (hostname -> Instagram, WhatsApp, dst).
const REF_NAMES: [RegExp, string][] = [
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
