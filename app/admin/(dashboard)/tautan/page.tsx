import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { listLinksWithCounts } from "@/lib/links";
import { CreateForm, DeleteLink, EditLink } from "../forms";

export const dynamic = "force-dynamic";

const n = (v: number) => v.toLocaleString("id-ID");

export default async function AdminPage() {
  await requireAdmin();
  const host = (await headers()).get("host") ?? "";
  const { links, counts } = await listLinksWithCounts();
  const sum = Object.values(counts).reduce((a, b) => a + b, 0);
  const top = [...links].sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0))[0];
  const topN = top ? counts[top.slug] ?? 0 : 0;

  return (
    <main className="wrap">
      <div className="top">
        <h1>
          Semua tautan <small>{host}</small>
        </h1>
        <CreateForm />
      </div>

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
                  <td className="num">{n(counts[l.slug] ?? 0)}</td>
                  <td>
                    <div className="actions">
                      <EditLink slug={l.slug} title={l.title} url={l.url} interstitial={!!l.interstitial} />
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
