import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { listLinksWithCounts } from "@/lib/links";
import { resetAllStats } from "../../actions";
import { ConfirmButton } from "../../confirm-button";

export const dynamic = "force-dynamic";

export default async function StatistikIndex({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
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
        <h1>Statistik</h1>
      </div>

      {sp.ok === "reset" && <div className="msg ok">Data statistik dihapus.</div>}

      <div className="stats">
        <div className="stat">
          <b>{sum.toLocaleString("id-ID")}</b>
          <span>Total klik</span>
        </div>
        <div className="stat">
          <b>{links.length}</b>
          <span>Tautan</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="empty">Belum ada link.</p>
      ) : (
        <div className="statlist">
          {rows.map((r) => (
            <Link key={r.slug} className="statrow" href={`/admin/statistik/${r.slug}`}>
              <span className="nm">
                {host}/{r.slug}
                <small>{r.title}</small>
              </span>
              <span className="cnt">
                {r.n.toLocaleString("id-ID")}
                <small>klik</small>
              </span>
              <span className="track">
                <span className="fill" style={{ display: "block", width: `${(r.n / max) * 100}%` }} />
              </span>
            </Link>
          ))}
        </div>
      )}

      {sum > 0 && (
        <form action={resetAllStats} style={{ marginTop: 28 }}>
          <ConfirmButton
            className="danger"
            message="Hapus data statistik SEMUA link? Total klik, negara, harian, dan klik terbaru akan dikosongkan. Link tetap ada."
          >
            Hapus semua data statistik
          </ConfirmButton>
        </form>
      )}
    </main>
  );
}
