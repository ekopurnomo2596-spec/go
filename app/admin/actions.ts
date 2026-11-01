"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, passwordOk, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/redis";
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
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function login(formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `rl:login:${ip}`;
  const attempts = await db().incr(key);
  if (attempts === 1) await db().expire(key, 900);
  if (attempts > 5) redirect("/admin/login?err=limit");

  if (!passwordOk(String(formData.get("password") ?? ""))) redirect("/admin/login?err=bad");

  await db().del(key);
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
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

export async function resetAllStats(): Promise<Flash> {
  await requireAdmin();
  for (const l of await listLinks()) await resetStatsData(l.slug);
  revalidatePath("/admin/statistik");
  return ok("Data statistik dihapus.");
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
