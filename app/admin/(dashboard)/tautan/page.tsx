import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { listLinksWithCounts } from "@/lib/links";
import { getChecks } from "@/lib/linkcheck";
import { CheckNow, CopyLink, CreateForm, DeleteLink, EditLink, ManualCheck } from "../forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tautan" };

const n = (v: number) => v.toLocaleString("id-ID");
const stamp = (ts: number) => new Date(ts).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "short", timeStyle: "short" });

export default async function AdminPage() {
  await requireAdmin();
  const host = (await headers()).get("host") ?? "";
  const { links, counts } = await listLinksWithCounts();
  const checks = await getChecks().catch(() => ({}) as Awaited<ReturnType<typeof getChecks>>);
  const bad = links.filter((l) => !l.noCheck && checks[l.slug] && !checks[l.slug].ok);
  const sum = Object.values(counts).reduce((a, b) => a + b, 0);
  const top = [...links].sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0))[0];
  const topN = top ? counts[top.slug] ?? 0 : 0;

  return (
    <main className="wrap">
      <div className="top">
        <h1>
          Semua tautan <small>{host}</small>
        </h1>
        <div className="top-actions">
          <CheckNow />
          <CreateForm />
        </div>
      </div>

      {bad.length > 0 && (
        <div className="chk-alert" role="alert">
          <b>{bad.length} tautan bermasalah:</b> {bad.map((l) => `/${l.slug} (${checks[l.slug].label})`).join(", ")}. Pengunjung melihat halaman error.
        </div>
      )}

      <div className="stats">
        <div className="stat">
          <b>{n(links.length)}</b>
          <span>Tautan</span>
        </div>
        <div className="stat">
          <b>{n(sum)}</b>
          <span>Klik total</span>
        </div>
        <div className="stat">
          <b className="stat-top">{top && topN > 0 ? `/${top.slug}` : "-"}</b>
          <span>Terpopuler</span>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="empty">
          <p>Belum ada link.</p>
        </div>
      ) : (
        <div className="tablewrap">
          <table className="linktable">
            <thead>
              <tr>
                <th>Link</th>
                <th>Tujuan</th>
                <th>Status tujuan</th>
                <th className="num">Klik</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.slug}>
                  <td>
                    <a className="short" href={`/${l.slug}`} target="_blank" rel="noreferrer">
                      {host}/{l.slug}
                    </a>
                    <div className="sum">{l.title}</div>
                    {l.interstitial && <div className="sum">Halaman perantara aktif</div>}
                  </td>
                  <td className="dest">{l.url}</td>
                  <td>
                    {l.noCheck ? (
                      <div className="chk-stack">
                        {checks[l.slug]?.manual ? (
                          <span className="chk ok">
                            <i aria-hidden="true" />
                            OK (manual) · {stamp(checks[l.slug].t)}
                          </span>
                        ) : (
                          <span className="chk none">Cek manual</span>
                        )}
                        <ManualCheck slug={l.slug} url={l.url} />
                      </div>
                    ) : checks[l.slug] ? (
                      <span className={"chk " + (checks[l.slug].ok ? "ok" : "bad")}>
                        <i aria-hidden="true" />
                        {checks[l.slug].label} · {stamp(checks[l.slug].t)}
                      </span>
                    ) : (
                      <span className="chk none">Belum dicek</span>
                    )}
                  </td>
                  <td className="num">{n(counts[l.slug] ?? 0)}</td>
                  <td>
                    <div className="actions">
                      <CopyLink slug={l.slug} />
                      <EditLink slug={l.slug} title={l.title} url={l.url} interstitial={!!l.interstitial} noCheck={!!l.noCheck} />
                      <DeleteLink slug={l.slug} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
