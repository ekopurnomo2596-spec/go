import { db } from "./redis";
import { COUNTRY_CODES, MAX_BELI, STATUS, fmtTgl, isTgl, parseTanggal, type PelStatus, type Pelanggan } from "./pelanggan-info";

/**
 * Catatan pelanggan dan calon pelanggan.
 * Disimpan di satu hash Redis (`pelanggan:data`): field = id, nilai = teks JSON.
 */
export const PEL_KEY = "pelanggan:data";
export const MAX_PELANGGAN = 5000;

export { COUNTRY_CODES, MAX_BELI, STATUS, fmtTgl, parseTanggal };
export type { PelStatus, Pelanggan };

const isStatus = (s: string): s is PelStatus => STATUS.some((x) => x.id === s);
export const validPelId = (s: string) => /^[a-z0-9]{6,32}$/.test(s);

const clip = (s: string, n: number) => s.replace(/\s+/g, " ").trim().slice(0, n);

export type PelInput = Omit<Pelanggan, "id" | "dibuat" | "diubah" | "beli">;

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

  return { ok: true, data: { nama, negara, email, wa: wa.v, hp: hp.v, ig, status, catatan } };
}

/** Tanggal pembelian yang tersimpan: buang yang rusak dan kembar, urut terbaru dulu. Data lama tanpa field ini jadi kosong. */
function cleanBeli(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const set = new Set<string>();
  for (const x of v) if (typeof x === "string" && isTgl(x)) set.add(x);
  return [...set].sort().reverse().slice(0, MAX_BELI);
}

function parse(v: unknown): Pelanggan | null {
  try {
    const o = (typeof v === "string" ? JSON.parse(v) : v) as Partial<Pelanggan> | null;
    if (!o || typeof o !== "object" || !o.id || !o.nama) return null;
    const s = (x: unknown) => String(x ?? "");
    return {
      id: s(o.id),
      nama: s(o.nama),
      negara: s(o.negara),
      email: s(o.email),
      wa: s(o.wa),
      hp: s(o.hp),
      ig: s(o.ig),
      status: isStatus(s(o.status)) ? (o.status as PelStatus) : "prospek",
      catatan: s(o.catatan),
      beli: cleanBeli(o.beli),
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
export async function savePelanggan(prev: Pelanggan | null, data: PelInput, tglBaru?: string): Promise<void> {
  const now = Date.now();
  const id = prev?.id ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const beli = [...(prev?.beli ?? [])];
  if (tglBaru && !beli.includes(tglBaru) && beli.length < MAX_BELI) beli.push(tglBaru); // tanggal pembelian baru dari form Ubah
  beli.sort().reverse();
  const p: Pelanggan = { ...data, id, beli, dibuat: prev?.dibuat ?? now, diubah: now };
  await db().hset(PEL_KEY, { [id]: JSON.stringify(p) });
}

export async function removePembelian(id: string, tgl: string): Promise<boolean> {
  const p = await getPelanggan(id);
  if (!p || !p.beli.includes(tgl)) return false;
  const next: Pelanggan = { ...p, beli: p.beli.filter((x) => x !== tgl) };
  await db().hset(PEL_KEY, { [id]: JSON.stringify(next) });
  return true;
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
