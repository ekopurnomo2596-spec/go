"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, passwordOk, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/redis";
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

export async function createLink(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "slug").toLowerCase();
  const url = str(formData, "url");
  const title = str(formData, "title").slice(0, 80) || slug;
  const listed = true;

  if (isReserved(slug)) redirect("/admin?err=reserved");
  if (!validSlugFormat(slug)) redirect("/admin?err=slug");
  if (!validUrl(url)) redirect("/admin?err=url");

  const link: Link = { slug, url, title, listed, createdAt: Date.now() };
  const created = await db().set(`link:${slug}`, link, { nx: true });
  if (!created) redirect("/admin?err=exists");
  await db().sadd("links", slug);

  refresh();
  redirect("/admin?ok=created");
}

export async function updateLink(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "slug").toLowerCase();
  const url = str(formData, "url");
  const title = str(formData, "title").slice(0, 80);

  if (!validSlugFormat(slug)) redirect("/admin?err=slug");
  if (!validUrl(url)) redirect("/admin?err=url");

  const existing = await getLink(slug);
  if (!existing) redirect("/admin");
  await db().set(`link:${slug}`, { ...existing, url, title: title || slug });

  refresh();
  redirect("/admin?ok=updated");
}

export async function deleteLink(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "slug").toLowerCase();
  if (!validSlugFormat(slug)) redirect("/admin?err=slug");
  await deleteLinkData(slug);

  refresh();
  redirect("/admin?ok=deleted");
}

export async function seedLinks() {
  await requireAdmin();
  const seed: [string, string, string][] = [
    ["wa", "Chat WhatsApp", "https://wa.me/6285602636720"],
    ["tg", "Chat Telegram", "https://t.me/emahairshop_bot"],
    ["shop", "Toko grosir", "https://shop.emahairshop.com"],
    ["blog", "Blog", "https://blog.emahairshop.com/en"],
    ["help", "Pusat bantuan", "https://help.emahairshop.com"],
    ["chat", "Asisten AI", "https://chat.emahairshop.com"],
    ["web", "Situs utama", "https://emahairshop.com"],
  ];
  let now = Date.now();
  for (const [slug, title, url] of seed) {
    const link: Link = { slug, url, title, listed: true, createdAt: now++ };
    const created = await db().set(`link:${slug}`, link, { nx: true });
    if (created) await db().sadd("links", slug);
  }
  refresh();
  redirect("/admin?ok=seeded");
}

export async function resetStats(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "slug").toLowerCase();
  if (!validSlugFormat(slug)) redirect("/admin/statistik");
  await resetStatsData(slug);
  revalidatePath("/admin/statistik");
  redirect(`/admin/statistik/${slug}?ok=reset`);
}

export async function resetAllStats() {
  await requireAdmin();
  for (const l of await listLinks()) await resetStatsData(l.slug);
  revalidatePath("/admin/statistik");
  redirect("/admin/statistik?ok=reset");
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

export async function removeStatsAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "slug").toLowerCase();
  if (!validSlugFormat(slug)) redirect("/admin/statistik");
  const mode = str(formData, "mode");
  const back = `/admin/statistik/${slug}`;

  if (mode === "day" && /^\d{4}-\d{2}-\d{2}$/.test(str(formData, "value"))) {
    await removeStats(slug, { days: [str(formData, "value")] });
  } else if (mode === "country" && /^[A-Z]{2}$/.test(str(formData, "value"))) {
    await removeStats(slug, { country: str(formData, "value") });
  } else if (mode === "click" && Number.isFinite(Number(str(formData, "value")))) {
    await removeStats(slug, { t: Number(str(formData, "value")) });
  } else if (mode === "range") {
    const days = dayRange(str(formData, "from"), str(formData, "to"));
    if (!days) return redirect(`${back}?ok=badrange`);
    await removeStats(slug, { days });
  } else {
    redirect(back);
  }
  revalidatePath("/admin/statistik");
  redirect(`${back}?ok=removed`);
}
