import { db } from "./redis";

/**
 * Catatan pelanggan dan calon pelanggan.
 * Disimpan di satu hash Redis (`pelanggan:data`): field = id, nilai = teks JSON.
 */
export const PEL_KEY = "pelanggan:data";
export const MAX_PELANGGAN = 5000;

export const STATUS = [
  { id: "prospek", name: "Prospek" },
  { id: "pembeli", name: "Sudah beli" },
  { id: "langganan", name: "Langganan" },
] as const;
export type PelStatus = (typeof STATUS)[number]["id"];

export type Pelanggan = {
  id: string;
  nama: string;
  perusahaan: string;
  negara: string; // kode negara 2 huruf, atau kosong
  email: string;
  wa: string;
  hp: string;
  ig: string; // username tanpa @
  status: PelStatus;
  catatan: string;
  dibuat: number;
  diubah: number;
};

export const COUNTRY_CODES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");

const isStatus = (s: string): s is PelStatus => STATUS.some((x) => x.id === s);
export const validPelId = (s: string) => /^[a-z0-9]{6,32}$/.test(s);

const clip = (s: string, n: number) => s.replace(/\s+/g, " ").trim().slice(0, n);

export type PelInput = Omit<Pelanggan, "id" | "dibuat" | "diubah">;

/** Rapikan dan periksa isian form. Kolom selain nama boleh kosong. */
export function cleanPelanggan(raw: Record<string, string>): { ok: true; data: PelInput } | { ok: false; error: string } {
  const nama = clip(raw.nama ?? "", 100);
  if (!nama) return { ok: false, error: "Nama belum diisi." };

  const negara = (raw.negara ?? "").trim().toUpperCase();
  if (negara && !COUNTRY_CODES.includes(negara)) return { ok: false, error: "Negara tidak dikenal." };

  const email = (raw.email ?? "").trim().toLowerCase().slice(0, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Format email tidak valid." };

  const phone = (v: string, label: string): { v: string; err?: string } => {
    const t = v.replace(/[^\d+\-\s()]/g, "").replace(/\s+/g, " ").trim().slice(0, 25);
    if (t && t.replace(/\D/g, "").length < 6) return { v: "", err: `Nomor ${label} terlalu pendek.` };
    return { v: t };
  };
  const wa = phone(raw.wa ?? "", "WhatsApp");
  if (wa.err) return { ok: false, error: wa.err };
  const hp = phone(raw.hp ?? "", "telepon");
  if (hp.err) return { ok: false, error: hp.err };

  // Instagram: terima "@nama", "nama", atau tautan profil
  let ig = (raw.ig ?? "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").replace(/^@/, "");
  ig = ig.slice(0, 30);
  if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig)) return { ok: false, error: "Username Instagram tidak valid." };

  const status = isStatus(raw.status ?? "") ? (raw.status as PelStatus) : "prospek";
  const catatan = (raw.catatan ?? "").replace(/\r/g, "").trim().slice(0, 1000);

  return { ok: true, data: { nama, perusahaan: clip(raw.perusahaan ?? "", 100), negara, email, wa: wa.v, hp: hp.v, ig, status, catatan } };
}

function parse(v: unknown): Pelanggan | null {
  try {
    const o = (typeof v === "string" ? JSON.parse(v) : v) as Partial<Pelanggan> | null;
    if (!o || typeof o !== "object" || !o.id || !o.nama) return null;
    const s = (x: unknown) => String(x ?? "");
    return {
      id: s(o.id),
      nama: s(o.nama),
      perusahaan: s(o.perusahaan),
      negara: s(o.negara),
      email: s(o.email),
      wa: s(o.wa),
      hp: s(o.hp),
      ig: s(o.ig),
      status: isStatus(s(o.status)) ? (o.status as PelStatus) : "prospek",
      catatan: s(o.catatan),
      dibuat: Number(o.dibuat) || 0,
      diubah: Number(o.diubah) || 0,
    };
  } catch {
    return null;
  }
}

export async function listPelanggan(): Promise<Pelanggan[]> {
  const raw = await db().hgetall<Record<string, unknown>>(PEL_KEY);
  if (!raw) return [];
  const out: Pelanggan[] = [];
  for (const v of Object.values(raw)) {
    const p = parse(v);
    if (p) out.push(p);
  }
  return out.sort((a, b) => b.diubah - a.diubah);
}

export async function getPelanggan(id: string): Promise<Pelanggan | null> {
  if (!validPelId(id)) return null;
  return parse(await db().hget<unknown>(PEL_KEY, id));
}

export async function countPelanggan(): Promise<number> {
  return (await db().hlen(PEL_KEY)) || 0;
}

/** Simpan baru (prev = null) atau perbarui yang sudah ada. */
export async function savePelanggan(prev: Pelanggan | null, data: PelInput): Promise<void> {
  const now = Date.now();
  const id = prev?.id ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const p: Pelanggan = { ...data, id, dibuat: prev?.dibuat ?? now, diubah: now };
  await db().hset(PEL_KEY, { [id]: JSON.stringify(p) });
}

export async function deletePelanggan(id: string): Promise<void> {
  if (validPelId(id)) await db().hdel(PEL_KEY, id);
}

/** Nomor untuk tautan wa.me (hanya angka). Nomor lokal Indonesia berawalan 0 diubah ke 62. */
export function waDigits(wa: string, negara: string): string {
  let d = wa.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0") && negara === "ID") d = "62" + d.slice(1);
  return d;
}
