import { db } from "./redis";
import { listLinks } from "./links";

/**
 * Cek apakah URL tujuan tiap tautan masih bisa dibuka.
 * Hasil terakhir disimpan di hash Redis `linkcheck` (slug -> JSON).
 * Yang dicek hanya "bisa dibuka (status < 400)", bukan isi halamannya.
 */
export type CheckResult = { ok: boolean; label: string; t: number; manual?: boolean };

const KEY = "linkcheck";
const TIMEOUT_MS = 8000;
const UA = "emahairshop-linkcheck/1.0";

function statusLabel(code: number): string {
  if (code === 404) return "404 Tidak ditemukan";
  if (code === 410) return "410 Sudah dihapus";
  if (code === 401 || code === 403) return `${code} Akses ditolak`;
  if (code >= 500) return `Error server (${code})`;
  return `HTTP ${code}`;
}

async function request(url: string, method: "HEAD" | "GET"): Promise<number> {
  const res = await fetch(url, {
    method,
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "user-agent": UA },
  });
  void res.body?.cancel().catch(() => {});
  return res.status;
}

export async function probe(url: string): Promise<CheckResult> {
  const t = Date.now();
  try {
    let code = await request(url, "HEAD");
    // sebagian situs menolak HEAD (405/403/501): ulangi dengan GET
    if (code >= 400) code = await request(url, "GET");
    return code < 400 ? { ok: true, label: "Hidup", t } : { ok: false, label: statusLabel(code), t };
  } catch (e) {
    const name = (e as Error)?.name ?? "";
    if (name === "TimeoutError" || name === "AbortError") return { ok: false, label: "Tidak menjawab (timeout)", t };
    return { ok: false, label: "Tidak bisa dibuka", t };
  }
}

/** Cek semua tautan (5 sekaligus), simpan hasilnya, buang hasil tautan yang sudah dihapus. */
export async function checkAll(): Promise<Record<string, CheckResult>> {
  const all = await listLinks();
  const links = all.filter((l) => !l.noCheck); // yang bertanda "jangan dicek" dilewati
  const keep = new Set(all.map((l) => l.slug));
  const out: Record<string, CheckResult> = {};
  for (let i = 0; i < links.length; i += 5) {
    const part = links.slice(i, i + 5);
    const res = await Promise.all(part.map((l) => probe(l.url)));
    part.forEach((l, j) => (out[l.slug] = res[j]));
  }
  const p = db().pipeline();
  const old = (await db().hkeys(KEY)) as string[];
  const stale = old.filter((s) => !keep.has(s)); // hanya hasil tautan yang sudah dihapus
  if (stale.length) p.hdel(KEY, ...stale);
  for (const [slug, r] of Object.entries(out)) p.hset(KEY, { [slug]: JSON.stringify(r) });
  await p.exec();
  return out;
}

export async function getChecks(): Promise<Record<string, CheckResult>> {
  const raw = (await db().hgetall<Record<string, unknown>>(KEY)) ?? {};
  const out: Record<string, CheckResult> = {};
  for (const [slug, v] of Object.entries(raw)) {
    try {
      const r = (typeof v === "string" ? JSON.parse(v) : v) as CheckResult;
      if (r && typeof r.ok === "boolean") out[slug] = r;
    } catch {
      /* abaikan data rusak */
    }
  }
  return out;
}

/** Tandai OK manual untuk tautan yang tidak dicek otomatis. */
export async function markManualOk(slug: string): Promise<void> {
  const r: CheckResult = { ok: true, label: "OK (manual)", t: Date.now(), manual: true };
  await db().hset(KEY, { [slug]: JSON.stringify(r) });
}

export async function clearCheck(slug: string): Promise<void> {
  await db().hdel(KEY, slug);
}
