import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { listLinksWithCounts } from "@/lib/links";
import { resetAllStats } from "../../actions";
import { ActionForm } from "../forms";

export const dynamic = "force-dynamic";

export default async function StatistikIndex() {
  await requireAdmin();
  const host = (await headers()).get("host") ?? "";
  const { links, counts } = await listLinksWithCounts();
  const rows = links
    .map((l) => ({ ...l, n: counts[l.slug] ?? 0 }))
    .sort((a, b) => b.n - a.n);
  const sum = rows.reduce((a, r) => a + r.n, 0);
  const max = Math.max(1, ...rows.map((r) => r.n));

  return (
    <main className="wrap">
      <div className="top">
        <h1>
          Statistik <small>{host}</small>
        </h1>
        {sum > 0 && (
          <details className="hapusmenu">
            <summary>Hapus data</summary>
            <div className="pop">
              <ActionForm
                action={resetAllStats}
                btnClass="danger"
                confirm="Hapus data statistik SEMUA link? Total klik, negara, harian, dan klik terbaru akan dikosongkan. Link tetap ada."
                label="Hapus semua data"
              />
              <p className="hint">Menghapus statistik semua tautan sekaligus. Tautannya tetap ada.</p>
            </div>
          </details>
        )}
      </div>

      <div className="stats">
        <div className="stat">
          <b>{sum.toLocaleString("id-ID")}</b>
          <span>Total klik</span>
        </div>
        <div className="stat">
          <b>{links.length}</b>
          <span>Tautan</span>
        </div>
        <div className="stat">
          <b className="stat-top">{rows[0] && rows[0].n > 0 ? `/${rows[0].slug}` : "-"}</b>
          <span>Terpopuler</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="empty">Belum ada link.</p>
      ) : (
        <div className="statlist">
          {rows.map((r, i) => {
            const pct = sum > 0 ? Math.round((r.n / sum) * 100) : 0;
            return (
              <Link
                key={r.slug}
                className={`statrow${r.n === 0 ? " zero" : ""}`}
                href={`/admin/statistik/${r.slug}`}
              >
                <span className="rk">{i + 1}</span>
                <span className="nm">
                  <b>
                    /{r.slug}
                    {r.title && r.title !== r.slug && <em>{r.title}</em>}
                  </b>
                  <small title={r.url}>{r.url}</small>
                </span>
                <span className="meter" aria-hidden="true">
                  <span className="track">
                    <span className="fill" style={{ width: `${(r.n / max) * 100}%` }} />
                  </span>
                  <span className="pct">{pct}%</span>
                </span>
                <span className="cnt">
                  {r.n.toLocaleString("id-ID")}
                  <small>klik</small>
                </span>
                <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
