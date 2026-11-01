"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LOGIN_BASE } from "@/lib/login-path";
import { createSession, destroySession, passwordOk, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/redis";
import { getTindakan } from "@/lib/tindakan";
import { AiError, askAi, clearHistory, deleteEntry, deleteKey, getKey, setKey, testKey, validKey } from "@/lib/ai";
import type { Flash } from "@/lib/flash";
import {
  deleteLinkData,
  getLink,
  listLinks,
  removeStats,
  resetStatsData,
  isReserved,
  validSlugFormat,
  validUrl,
  type Link,
} from "@/lib/links";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function refresh() {
  revalidatePath("/admin/tautan");
  revalidatePath("/");
}

export async function login(formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `rl:login:${ip}`;
  const attempts = await db().incr(key);
  if (attempts === 1) await db().expire(key, 900);
  if (attempts > 5) redirect(`${LOGIN_BASE}?err=limit`);

  if (!passwordOk(String(formData.get("password") ?? ""))) redirect(`${LOGIN_BASE}?err=bad`);

  await db().del(key);
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect(LOGIN_BASE);
}

const ok = (text: string): Flash => ({ kind: "ok", text });
const err = (text: string): Flash => ({ kind: "err", text });

// Aksi di bawah ini TIDAK redirect. Hasilnya dikembalikan ke browser, dan revalidatePath
// membuat Next mengirim daftar terbaru dalam respons yang sama. Halaman lama tetap tampil
// (tombol berputar) sampai data baru siap, jadi tidak ada layar kosong.
export async function createLink(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const slug = str(formData, "slug").toLowerCase();
  const url = str(formData, "url");
  const title = str(formData, "title").slice(0, 80) || slug;

  if (isReserved(slug)) return err("Slug itu dipakai sistem. Pilih yang lain.");
  if (!validSlugFormat(slug)) return err("Slug tidak valid. Pakai huruf kecil, angka, - atau _ (maksimal 40 karakter).");
  if (!validUrl(url)) return err("URL tujuan harus diawali http:// atau https://.");

  const link: Link = { slug, url, title, listed: true, createdAt: Date.now() };
  const created = await db().set(`link:${slug}`, link, { nx: true });
  if (!created) return err("Slug itu sudah ada.");
  await db().sadd("links", slug);

  refresh();
  return ok("Link dibuat.");
}

export async function updateLink(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const slug = str(formData, "slug").toLowerCase();
  const url = str(formData, "url");
  const title = str(formData, "title").slice(0, 80);
  const interstitial = formData.get("interstitial") === "on";

  if (!validSlugFormat(slug)) return err("Slug tidak valid.");
  if (!validUrl(url)) return err("URL tujuan harus diawali http:// atau https://.");

  const existing = await getLink(slug);
  if (!existing) return err("Link tidak ditemukan.");
  await db().set(`link:${slug}`, { ...existing, url, title: title || slug, interstitial });

  refresh();
  return ok("Link diperbarui.");
}

export async function deleteLink(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const slug = str(formData, "slug").toLowerCase();
  if (!validSlugFormat(slug)) return err("Slug tidak valid.");
  await deleteLinkData(slug);

  refresh();
  return ok("Link dihapus beserta datanya.");
}

export async function resetStats(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const slug = str(formData, "slug").toLowerCase();
  if (!validSlugFormat(slug)) return err("Slug tidak valid.");
  await resetStatsData(slug);
  revalidatePath("/admin/statistik");
  revalidatePath(`/admin/statistik/${slug}`);
  return ok("Data statistik dihapus.");
}

export async function doneTindakan(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!/^[a-z0-9:_-]{1,100}$/.test(id)) return err("Tindakan tidak valid.");
  await db().hset("tindakan:done", { [id]: Date.now() });
  revalidatePath("/admin/tindakan");
  return ok("Ditandai selesai.");
}

export async function undoTindakan(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!/^[a-z0-9:_-]{1,100}$/.test(id)) return err("Tindakan tidak valid.");
  await db().hdel("tindakan:done", id);
  revalidatePath("/admin/tindakan");
  return ok("Dikembalikan ke daftar.");
}

export async function resetAllStats(): Promise<Flash> {
  await requireAdmin();
  for (const l of await listLinks()) await resetStatsData(l.slug);
  revalidatePath("/admin/statistik");
  return ok("Data statistik dihapus.");
}

async function webKeys(): Promise<string[]> {
  const out: string[] = [];
  for (const match of ["statsday:*", "webhist:*"]) {
    let cursor: string | number = 0;
    do {
      const [next, keys]: [string | number, string[]] = await db().scan(cursor, { match, count: 200 });
      out.push(...keys);
      cursor = next;
    } while (String(cursor) !== "0");
  }
  return out;
}

function refreshWeb() {
  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/analisa");
}

export async function resetWebStats(): Promise<Flash> {
  await requireAdmin();
  const keys = await webKeys();
  if (keys.length) await db().del(...keys);
  refreshWeb();
  return ok("Data dashboard dihapus.");
}

/** Hapus sebagian data kunjungan website: per hari, per negara, atau rentang tanggal. */
export async function removeWebStatsAction(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const mode = str(formData, "mode");

  if (mode === "day" || mode === "range") {
    const days =
      mode === "day"
        ? /^\d{4}-\d{2}-\d{2}$/.test(str(formData, "value"))
          ? [str(formData, "value")]
          : null
        : dayRange(str(formData, "from"), str(formData, "to"));
    if (!days) return err("Tanggal tidak valid.");
    await db().del(...days.flatMap((d) => [`statsday:${d}`, `webhist:${d}`]));
  } else if (mode === "country" && /^[A-Za-z]{2}$/.test(str(formData, "value"))) {
    const code = str(formData, "value").toUpperCase();
    for (const key of await webKeys()) {
      const raw = await db().get<unknown>(key);
      type WebSnap = { visitors?: number; vc?: Record<string, number> };
      let snap: WebSnap | null = null;
      if (typeof raw === "string") {
        try {
          snap = JSON.parse(raw);
        } catch {}
      } else if (raw && typeof raw === "object") snap = raw as WebSnap;
      if (!snap?.vc) continue;
      // negara tak valid/tak dikenal dikelompokkan sebagai XX di dashboard
      const hit = Object.keys(snap.vc).filter((k) => (/^[A-Za-z]{2}$/.test(k) ? k.toUpperCase() : "XX") === code);
      if (!hit.length) continue;
      let removed = 0;
      for (const k of hit) {
        removed += Number(snap.vc[k] || 0);
        delete snap.vc[k];
      }
      snap.visitors = Math.max(0, Number(snap.visitors ?? 0) - removed);
      await db().set(key, JSON.stringify(snap));
    }
  } else {
    return err("Permintaan tidak valid.");
  }
  refreshWeb();
  return ok("Data yang dipilih dihapus.");
}

function dayRange(from: string, to: string): string[] | null {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(from) || !re.test(to) || from > to) return null;
  const out: string[] = [];
  const end = new Date(to + "T00:00:00Z").getTime();
  for (let t = new Date(from + "T00:00:00Z").getTime(); t <= end && out.length < 800; t += 86400e3) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

export async function removeStatsAction(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const slug = str(formData, "slug").toLowerCase();
  if (!validSlugFormat(slug)) return err("Slug tidak valid.");
  const mode = str(formData, "mode");

  if (mode === "day" && /^\d{4}-\d{2}-\d{2}$/.test(str(formData, "value"))) {
    await removeStats(slug, { days: [str(formData, "value")] });
  } else if (mode === "country" && /^[A-Z]{2}$/.test(str(formData, "value"))) {
    await removeStats(slug, { country: str(formData, "value") });
  } else if (mode === "click" && Number.isFinite(Number(str(formData, "value")))) {
    await removeStats(slug, { t: Number(str(formData, "value")) });
  } else if (mode === "range") {
    const days = dayRange(str(formData, "from"), str(formData, "to"));
    if (!days) return err("Rentang tanggal tidak valid.");
    await removeStats(slug, { days });
  } else {
    return err("Permintaan tidak valid.");
  }
  revalidatePath("/admin/statistik");
  revalidatePath(`/admin/statistik/${slug}`);
  return ok("Data yang dipilih dihapus.");
}

// ---------- AI (token + saran) ----------

function aiErr(e: unknown): Flash {
  return err(e instanceof AiError ? e.message : "Terjadi kesalahan saat memanggil AI.");
}

export async function saveAiKey(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const key = str(formData, "key");
  if (!validKey(key)) return err("Token tidak valid. Tempel token utuh tanpa spasi.");
  await setKey(key);
  revalidatePath("/admin/token");
  revalidatePath("/admin/tindakan");
  revalidatePath("/admin/ai");
  return ok("Token disimpan.");
}

export async function deleteAiKey(): Promise<Flash> {
  await requireAdmin();
  await deleteKey();
  revalidatePath("/admin/token");
  revalidatePath("/admin/tindakan");
  revalidatePath("/admin/ai");
  return ok("Token dihapus.");
}

/** Tes token: pakai yang diketik kalau ada, kalau kosong pakai yang tersimpan. */
export async function testAiKey(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const typed = str(formData, "key");
  const key = typed || (await getKey());
  if (!key) return err("Isi token dulu.");
  if (!validKey(key)) return err("Token tidak valid. Tempel token utuh tanpa spasi.");
  try {
    await testKey(key);
    return ok("Token berfungsi.");
  } catch (e) {
    return aiErr(e);
  }
}

export async function askAiAction(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!/^[a-z0-9:_-]{1,100}$/.test(id)) return err("Kartu tidak valid.");

  // isi kartu dihitung ulang di server, bukan dipercaya dari browser
  const t = await getTindakan();
  const card = [...t.items, ...t.done].find((x) => x.id === id);
  if (!card) return err("Kartu sudah berubah. Muat ulang halaman lalu coba lagi.");

  // batas pemakaian: maksimal 30 permintaan per jam
  const rl = "rl:ai";
  const n = await db().incr(rl);
  if (n === 1) await db().expire(rl, 3600);
  if (n > 30) return err("Terlalu banyak permintaan AI. Coba lagi dalam satu jam.");

  try {
    await askAi({ id: card.id, title: card.title, why: card.why, pair: card.pair });
  } catch (e) {
    return aiErr(e);
  }
  revalidatePath("/admin/tindakan");
  revalidatePath("/admin/ai");
  return ok("Saran AI dibuat.");
}

export async function deleteAiEntry(formData: FormData): Promise<Flash> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!/^[a-z0-9]{1,30}$/.test(id)) return err("Entri tidak valid.");
  await deleteEntry(id);
  revalidatePath("/admin/tindakan");
  revalidatePath("/admin/ai");
  return ok("Entri dihapus.");
}

export async function clearAiHistory(): Promise<Flash> {
  await requireAdmin();
  await clearHistory();
  revalidatePath("/admin/tindakan");
  revalidatePath("/admin/ai");
  return ok("Riwayat dihapus.");
}
