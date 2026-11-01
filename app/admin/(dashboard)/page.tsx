import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { listLinksWithCounts } from "@/lib/links";
import { CreateForm, DeleteLink, EditLink } from "./forms";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const host = (await headers()).get("host") ?? "";
  const { links, counts } = await listLinksWithCounts();
  const sum = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <main className="wrap">
      <div className="top">
        <h1>Semua tautan</h1>
      </div>


      <section className="card">
        <h2>Buat link baru</h2>
        <CreateForm />
      </section>

      <p className="sum">
        {links.length} link &middot; {sum.toLocaleString("id-ID")} klik total
      </p>

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
                  <td className="num">{(counts[l.slug] ?? 0).toLocaleString("id-ID")}</td>
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
