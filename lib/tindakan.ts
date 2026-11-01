import { db } from "./redis";
import { countryName, jakartaDay } from "./format";
import { getAnalytics, listLinks, topPairs, type Pair } from "./links";
import { hasKey, lastMap, type AiEntry } from "./ai";

export type Tone = "penting" | "peluang" | "info";
export type Item = {
  id: string;
  tone: Tone;
  title: string;
  why: string;
  href: string;
  cta: string;
  /** sudah ditandai selesai (dan masalahnya masih ada) */
  done: boolean;
  /** saran AI terakhir yang pernah diminta untuk kartu ini (jika ada) */
  last: AiEntry | null;
  /** hanya kartu sumber x negara: AI memberi hashtag, bukan saran umum */
  pair?: { ref: string; country: string };
};

const WIN = 14; // rentang yang dinilai (hari)
const DONE_KEY = "tindakan:done";
const DONE_TTL = 14 * 86400e3; // tanda selesai berlaku 14 hari, lalu bisa muncul lagi

// ambang batas: sengaja konservatif supaya data sedikit tidak memicu peringatan palsu
const MIN_PREV = 10; // periode sebelumnya minimal segini klik sebelum dibandingkan
const DROP = 0.3; // turun >= 30%
const RISE_TOTAL = 0.3; // naik >= 30%
const RISE_LINK = 0.5; // satu tautan naik >= 50%
const RISE_LINK_MIN = 5; // ...dan minimal 5 klik
const CTR_DROP = 1.5; // CTR turun >= 1,5 poin
const DEV_MIN = 10; // minimal 10 klik untuk menilai perangkat
const MAX_PER_RULE = 3;
const PAIR_MIN = 3; // minimal klik satu pasangan sumber x negara untuk dapat kartu saran AI
const PAIR_MAX = 3;

const f1 = (v: number) => v.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const ago = (d: number) => (d <= 0 ? "hari ini" : d === 1 ? "kemarin" : `${d} hari lalu`);
const slugHref = (s: string) => `/admin/statistik/${s}`;

export type TindakanResult = {
  items: Item[];
  done: Item[];
  /** berapa hari data klik sudah terkumpul (0 = belum ada) */
  dataDays: number;
  linkCount: number;
  /** token AI sudah diisi */
  aiReady: boolean;
  /** sudah ada data pasangan sumber x negara */
  hasPairs: boolean;
};

export async function getTindakan(): Promise<TindakanResult> {
  const links = await listLinks();
  if (!links.length) return { items: [], done: [], dataDays: 0, linkCount: 0, aiReady: false, hasPairs: false };

  const now = Date.now();
  const today = jakartaDay(0);
  const cur = new Set(Array.from({ length: WIN }, (_, i) => jakartaDay(i)));
  const prev = new Set(Array.from({ length: WIN }, (_, i) => jakartaDay(WIN + i)));

  const p = db().pipeline();
  for (const l of links) p.hgetall(`daily:${l.slug}`);
  p.hgetall(DONE_KEY);
  // bagian AI tidak boleh membuat halaman Tindakan error
  const [a, res, pairs, last, aiReady] = await Promise.all([
    getAnalytics(WIN),
    p.exec<(Record<string, number | string> | null)[]>(),
    topPairs(WIN).catch((): Pair[] => []),
    lastMap().catch((): Record<string, AiEntry> => ({})),
    hasKey().catch(() => false),
  ]);
  const doneMap = (res[links.length] ?? {}) as Record<string, number | string>;

  // klik per tautan: periode ini vs sebelumnya, dan hari pertama ada data
  let first = "";
  const per = links.map((l, i) => {
    let c = 0;
    let pv = 0;
    for (const [day, v] of Object.entries(res[i] ?? {})) {
      const n = Number(v);
      if (!n) continue;
      if (!first || day < first) first = day;
      if (cur.has(day)) c += n;
      else if (prev.has(day)) pv += n;
    }
    return { l, c, pv };
  });
  const dataDays = first ? Math.floor((Date.parse(today) - Date.parse(first)) / 86400e3) + 1 : 0;

  const out: Omit<Item, "done" | "last">[] = [];

  // 1. total klik turun / naik
  if (a.prevTotal !== null && a.prevTotal >= MIN_PREV) {
    const ch = (a.total - a.prevTotal) / a.prevTotal;
    if (ch <= -DROP)
      out.push({
        id: "total-turun",
        tone: "penting",
        title: `Total klik turun ${Math.round(-ch * 100)}% dari periode sebelumnya`,
        why: `${a.total} klik, sebelumnya ${a.prevTotal}. Cek apakah tautan masih berfungsi dan apakah trafik website ikut turun.`,
        href: `/admin/analisa?days=${WIN}&src=go`,
        cta: "Buka Analisa",
      });
    else if (ch >= RISE_TOTAL)
      out.push({
        id: "total-naik",
        tone: "peluang",
        title: `Total klik naik ${Math.round(ch * 100)}% dari periode sebelumnya`,
        why: `${a.total} klik, sebelumnya ${a.prevTotal}. Catat apa yang kamu lakukan di periode ini dan ulangi.`,
        href: `/admin/analisa?days=${WIN}&src=go`,
        cta: "Buka Analisa",
      });
  }

  // 2. tautan lama tanpa klik (hanya jika data sudah cukup lama)
  if (dataDays >= WIN) {
    per
      .filter(({ l, c }) => c === 0 && now - l.createdAt >= WIN * 86400e3)
      .sort((x, y) => x.l.createdAt - y.l.createdAt)
      .slice(0, 5)
      .forEach(({ l }) =>
        out.push({
          id: `nol:${l.slug}`,
          tone: "penting",
          title: `/${l.slug} tidak ada klik dalam ${WIN} hari`,
          why: `Dibuat ${ago(Math.floor((now - l.createdAt) / 86400e3))}. Ganti judulnya, taruh lebih menonjol di website, atau hapus kalau tidak dipakai.`,
          href: "/admin/tautan",
          cta: "Kelola tautan",
        }),
      );
  }

  // 3. satu tautan turun tajam / naik tajam
  per
    .filter(({ c, pv }) => pv >= MIN_PREV && c <= pv * (1 - 0.5))
    .sort((x, y) => y.pv - y.c - (x.pv - x.c))
    .slice(0, MAX_PER_RULE)
    .forEach(({ l, c, pv }) =>
      out.push({
        id: `turun:${l.slug}`,
        tone: "penting",
        title: `/${l.slug} turun ${Math.round(((pv - c) / pv) * 100)}% dari periode sebelumnya`,
        why: `${c} klik, sebelumnya ${pv}. Pastikan tautannya masih terpasang di website dan tujuannya masih benar.`,
        href: slugHref(l.slug),
        cta: "Lihat statistik",
      }),
    );
  per
    .filter(({ c, pv }) => c >= RISE_LINK_MIN && pv >= 2 && c >= pv * (1 + RISE_LINK))
    .sort((x, y) => y.c - y.pv - (x.c - x.pv))
    .slice(0, MAX_PER_RULE)
    .forEach(({ l, c, pv }) =>
      out.push({
        id: `naik:${l.slug}`,
        tone: "peluang",
        title: `/${l.slug} naik ${Math.round(((c - pv) / pv) * 100)}% dari periode sebelumnya`,
        why: `${c} klik, sebelumnya ${pv}. Tempatkan lebih menonjol dan ulangi apa yang kamu lakukan di periode ini.`,
        href: slugHref(l.slug),
        cta: "Lihat statistik",
      }),
    );

  // 4. CTR turun
  if (a.ctr !== null && a.prevCtr !== null && a.prevCtr - a.ctr >= CTR_DROP)
    out.push({
      id: "ctr-turun",
      tone: "peluang",
      title: `CTR turun dari ${f1(a.prevCtr)}% ke ${f1(a.ctr)}%`,
      why: "Pengunjung melihat halaman tapi lebih sedikit yang mengeklik tautan go. Perjelas ajakan kliknya atau pindahkan lebih ke atas.",
      href: `/admin/analisa?days=${WIN}&src=go`,
      cta: "Buka Analisa",
    });

  // 5. semua klik dari satu jenis perangkat
  const devTotal = a.devices.reduce((s: number, [, v]: [string, number]) => s + v, 0);
  if (devTotal >= DEV_MIN && a.devices.length === 1) {
    const mobile = a.devices[0][0] === "mobile";
    out.push({
      id: "perangkat",
      tone: "info",
      title: `Semua klik berasal dari ${mobile ? "HP" : "desktop"}`,
      why: `Tidak ada klik dari ${mobile ? "desktop" : "HP"} dalam ${WIN} hari. Cek apakah tautan dan halaman tujuan bisa dibuka normal di ${mobile ? "desktop" : "HP"}.`,
      href: "/admin/analisa?days=14&src=go",
      cta: "Buka Analisa",
    });
  }

  // 6. tautan baru belum diklik
  per
    .filter(({ l, c }) => c === 0 && now - l.createdAt < 7 * 86400e3)
    .forEach(({ l }) =>
      out.push({
        id: `baru:${l.slug}`,
        tone: "info",
        title: `/${l.slug} baru dibuat dan belum diklik`,
        why: `Dibuat ${ago(Math.floor((now - l.createdAt) / 86400e3))}. Bagikan dulu ke grup atau taruh di website, lalu tunggu beberapa hari.`,
        href: slugHref(l.slug),
        cta: "Lihat statistik",
      }),
    );

  // 7. saran AI per pasangan sumber x negara (mis. Instagram di Amerika)
  pairs
    .filter((x) => x.n >= PAIR_MIN && x.country !== "XX" && x.ref !== "Langsung")
    .slice(0, PAIR_MAX)
    .forEach((x) => {
      const slug = x.ref.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";
      out.push({
        id: `ai:${slug}:${x.country.toLowerCase()}`,
        tone: "peluang",
        title: `${x.ref} di ${countryName(x.country)}: ${x.n} klik dalam ${WIN} hari`,
        why: "Pasangan sumber dan negara dengan klik terbanyak. Minta saran hashtag hair extension yang cocok untuk audiens ini.",
        href: `/admin/analisa?days=${WIN}&src=go`,
        cta: "Buka Analisa",
        pair: { ref: x.ref, country: x.country },
      });
    });

  // tanda selesai: berlaku 14 hari; yang sudah kedaluwarsa dibersihkan
  const stale = Object.entries(doneMap)
    .filter(([, t]) => now - Number(t) >= DONE_TTL)
    .map(([k]) => k);
  if (stale.length) db().hdel(DONE_KEY, ...stale).catch(() => {});
  const isDone = (id: string) => {
    const t = Number(doneMap[id] ?? 0);
    return t > 0 && now - t < DONE_TTL;
  };

  const order: Record<Tone, number> = { penting: 0, peluang: 1, info: 2 };
  const all = out.map((x) => ({ ...x, done: isDone(x.id), last: last[x.id] ?? null })).sort((x, y) => order[x.tone] - order[y.tone]);
  return {
    items: all.filter((x) => !x.done),
    done: all.filter((x) => x.done),
    dataDays,
    linkCount: links.length,
    aiReady,
    hasPairs: pairs.length > 0,
  };
}
