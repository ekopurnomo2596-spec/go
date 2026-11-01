// Ikon kecil untuk tiap tautan di halaman depan, ditebak dari slug/judulnya
// supaya gayanya konsisten dengan daftar tautan di portal utama.

const PATHS: Record<string, string> = {
  whatsapp: "M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1",
  telegram: "M21.5 3 2.5 10.5l6 2.2L17 7l-6.5 7.2.5 5.3 3-3.3 4.2 3.1z",
  shop: "M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0",
  blog: "M5 4h11l3 3v13H5zM15 4v4h4M8 12h8M8 16h5",
  help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01",
  chat: "M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  web: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
};

const MATCH: [RegExp, keyof typeof PATHS][] = [
  [/wa|whats?app/, "whatsapp"],
  [/tg|telegram/, "telegram"],
  [/shop|toko|store|beli/, "shop"],
  [/blog|artikel/, "blog"],
  [/help|bantuan|faq/, "help"],
  [/chat|ai|asisten/, "chat"],
  [/web|situs|home|main|utama/, "web"],
];

function pathFor(slug: string, title: string): string {
  const s = `${slug} ${title}`.toLowerCase();
  for (const [re, key] of MATCH) if (re.test(s)) return PATHS[key];
  // default: ikon rantai/tautan generik
  return "M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2";
}

export function LinkIcon({ slug, title }: { slug: string; title: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={pathFor(slug, title)} />
    </svg>
  );
}
