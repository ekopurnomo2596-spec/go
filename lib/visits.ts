import { db } from "./redis";
import { jakartaDay } from "./format";

// Data kunjungan website utama (emahairshop.com). Ditulis oleh api/chat.js di portal
// sebagai snapshot harian di Redis dengan key "statsday:YYYY-MM-DD" (JSON), yang hangus setelah 3 hari.
// Supaya riwayat lebih panjang, setiap kali dashboard dibuka snapshot itu disalin ke "webhist:YYYY-MM-DD"
// (tanpa masa hangus), milik go sendiri. Portal tidak perlu diubah.

type Snap = {
  pageviews?: number;
  visitors?: number;
  chats?: number;
  leads?: number;
  vc?: Record<string, number>;
  /** sumber trafik (hostname referrer atau "langsung") per pengunjung */
  vr?: Record<string, number>;
  /** perangkat (mobile/desktop/tablet) per pengunjung */
  vd?: Record<string, number>;
  /** pengunjung baru per jam WIB (kunci "0"-"23") */
  vh?: Record<string, number>;
  /** kunjungan terakhir hari ini (maks 10): jam WIB, negara, IP, sumber (hostname referrer atau "langsung") */
  visits?: Visit[];
};

export type Visit = { t?: string; c?: string; ip?: string; r?: string };

export type DayRow = { day: string; visitors: number; pageviews: number; chats: number; leads: number };

export type WebStats = {
  /** 14 hari terakhir, terlama dulu */
  days: DayRow[];
  today: DayRow;
  sum: { visitors: number; pageviews: number; chats: number; leads: number };
  countries: [string, number][];
  /** sumber trafik (hostname referrer / "langsung") dan perangkat, dijumlah 14 hari */
  referrers: [string, number][];
  devices: [string, number][];
  daysWithData: number;
};

function parse(v: unknown): Snap | null {
  if (!v) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as Snap;
    } catch {
      return null;
    }
  }
  return typeof v === "object" ? (v as Snap) : null;
}

export async function getWebStats(): Promise<WebStats> {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) days.push(jakartaDay(i));

  const raw = await db().mget<unknown[]>(...days.map((d) => `statsday:${d}`), ...days.map((d) => `webhist:${d}`));
  const keep: Record<string, Snap> = {};

  const country: Record<string, number> = {};
  const refs: Record<string, number> = {};
  const devs: Record<string, number> = {};
  let daysWithData = 0;
  const rows: DayRow[] = days.map((day, i) => {
    const live = parse(raw[i]);
    const s = live ?? parse(raw[days.length + i]);
    if (s) daysWithData++;
    if (live) {
      keep[day] = {
        pageviews: live.pageviews,
        visitors: live.visitors,
        chats: live.chats,
        leads: live.leads,
        vc: live.vc,
        vr: live.vr,
        vd: live.vd,
      };
    }
    for (const [code, n] of Object.entries(s?.vc ?? {})) {
      const c = /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase() : "XX";
      country[c] = (country[c] ?? 0) + Number(n || 0);
    }
    for (const [k, n] of Object.entries(s?.vr ?? {})) refs[k] = (refs[k] ?? 0) + Number(n || 0);
    for (const [k, n] of Object.entries(s?.vd ?? {})) devs[k] = (devs[k] ?? 0) + Number(n || 0);
    return {
      day,
      visitors: Number(s?.visitors ?? 0),
      pageviews: Number(s?.pageviews ?? 0),
      chats: Number(s?.chats ?? 0),
      leads: Number(s?.leads ?? 0),
    };
  });

  const save = Object.entries(keep);
  if (save.length) {
    try {
      const p = db().pipeline();
      for (const [day, snap] of save) p.set(`webhist:${day}`, JSON.stringify(snap));
      await p.exec();
    } catch (e) {
      console.error("simpan riwayat gagal", e);
    }
  }

  const add = (k: keyof Omit<DayRow, "day">) => rows.reduce((a, r) => a + r[k], 0);

  return {
    days: rows,
    today: rows[rows.length - 1],
    sum: { visitors: add("visitors"), pageviews: add("pageviews"), chats: add("chats"), leads: add("leads") },
    countries: Object.entries(country).sort((a, b) => b[1] - a[1]),
    referrers: Object.entries(refs),
    devices: Object.entries(devs),
    daysWithData,
  };
}

export type WebSnap = {
  visitors: number;
  pageviews: number;
  vc: Record<string, number>;
  vr: Record<string, number>;
  vd: Record<string, number>;
  vh: Record<string, number>;
  visits: Visit[];
};

/** Snapshot kunjungan website utama per hari (hanya hari yang punya data). Snapshot yang masih hidup ikut disalin ke webhist agar riwayat tidak hilang. */
export async function getWebSnaps(days: string[]): Promise<Record<string, WebSnap>> {
  if (!days.length) return {};
  const raw = await db().mget<unknown[]>(...days.map((d) => `statsday:${d}`), ...days.map((d) => `webhist:${d}`));
  const out: Record<string, WebSnap> = {};
  const save: [string, Snap][] = [];
  days.forEach((day, i) => {
    const live = parse(raw[i]);
    const s = live ?? parse(raw[days.length + i]);
    if (!s) return;
    out[day] = { visitors: Number(s.visitors ?? 0), pageviews: Number(s.pageviews ?? 0), vc: s.vc ?? {}, vr: s.vr ?? {}, vd: s.vd ?? {}, vh: s.vh ?? {}, visits: Array.isArray(s.visits) ? s.visits : [] };
    if (live) save.push([day, { pageviews: live.pageviews, visitors: live.visitors, chats: live.chats, leads: live.leads, vc: live.vc, vr: live.vr, vd: live.vd, vh: live.vh }]);
  });
  if (save.length) {
    try {
      const p = db().pipeline();
      for (const [day, snap] of save) p.set(`webhist:${day}`, JSON.stringify(snap));
      await p.exec();
    } catch (e) {
      console.error("simpan riwayat gagal", e);
    }
  }
  return out;
}

/** Pageviews website utama per hari (hanya hari yang punya snapshot). */
export async function getPageviewsByDay(days: string[]): Promise<Record<string, number>> {
  const snaps = await getWebSnaps(days);
  return Object.fromEntries(Object.entries(snaps).map(([d, v]) => [d, v.pageviews]));
}
