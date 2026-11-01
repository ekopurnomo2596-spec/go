import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLink, getStats, validSlugFormat } from "@/lib/links";
import { removeStatsAction, resetStats } from "../../../actions";
import { ConfirmButton } from "../../../confirm-button";
import { countryName, formatTime } from "@/lib/format";
import { Flag } from "@/lib/flag";

export const dynamic = "force-dynamic";

function X({ slug, mode, value, label }: { slug: string; mode: string; value: string; label: string }) {
  return (
    <form action={removeStatsAction} className="xf">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="value" value={value} />
      <ConfirmButton className="xbtn" title="Hapus" message={`Hapus data ${label}? Angka total ikut berkurang.`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6" />
        </svg>
      </ConfirmButton>
    </form>
  );
}

export default async function StatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const sp = await searchParams;
  if (!validSlugFormat(slug)) notFound();
  const link = await getLink(slug);
  if (!link) notFound();

  const host = (await headers()).get("host") ?? "";
  const stats = await getStats(slug);
  const maxCountry = Math.max(1, ...stats.countries.map(([, n]) => n));
  const maxDay = Math.max(1, ...stats.daily.map(([, n]) => n));
  const last14 = stats.daily.reduce((a, [, n]) => a + n, 0);

  return (
    <main className="wrap">
      <Link className="back" href="/admin/statistik">&larr; Semua statistik</Link>
      <div className="top">
        <h1>
          /{link.slug} <small>{link.title}</small>
        </h1>
        <details className="hapusmenu">
          <summary>Hapus data</summary>
          <div className="pop">
            <form action={removeStatsAction}>
              <input type="hidden" name="slug" value={link.slug} />
              <input type="hidden" name="mode" value="range" />
              <strong>Hapus per tanggal (WIB)</strong>
              <div className="dates">
                <div>
                  <label htmlFor="from">Dari</label>
                  <input id="from" name="from" type="date" required />
                </div>
                <div>
                  <label htmlFor="to">Sampai</label>
                  <input id="to" name="to" type="date" required />
                </div>
              </div>
              <ConfirmButton className="danger" message="Hapus data klik pada rentang tanggal ini?">
                Hapus rentang
              </ConfirmButton>
            </form>
            <form action={resetStats}>
              <input type="hidden" name="slug" value={link.slug} />
              <ConfirmButton
                className="danger"
                message={`Hapus SEMUA data statistik /${link.slug}? Link tetap ada.`}
              >
                Hapus semua data
              </ConfirmButton>
            </form>
            <p className="hint">Ikon tong sampah di setiap baris menghapus per negara, per hari, atau per klik.</p>
          </div>
        </details>
      </div>

      {sp.ok === "reset" && <div className="msg ok">Data statistik dihapus.</div>}
      {sp.ok === "removed" && <div className="msg ok">Data yang dipilih dihapus.</div>}
      {sp.ok === "badrange" && <div className="msg err">Rentang tanggal tidak valid.</div>}
      <p className="sum">
        {host}/{link.slug} mengarah ke <span className="dest">{link.url}</span>
      </p>

      <div className="stats">
        <div className="stat">
          <b>{stats.total.toLocaleString("id-ID")}</b>
          <span>Total klik</span>
        </div>
        <div className="stat">
          <b>{last14.toLocaleString("id-ID")}</b>
          <span>14 hari terakhir</span>
        </div>
        <div className="stat">
          <b>{stats.countries.length}</b>
          <span>Negara</span>
        </div>
      </div>

      <div className="cols">
        <section>
          <h2 style={{ fontSize: "1rem" }}>Negara</h2>
          {stats.countries.length === 0 ? (
            <p className="empty">Belum ada klik.</p>
          ) : (
            <div className="bars">
              {stats.countries.map(([code, n]) => (
                <div className="bar" key={code}>
                  <span className="cn">
                    <Flag code={code} />
                    {countryName(code)}
                  </span>
                  <div className="track">
                    <div className="fill" style={{ width: `${(n / maxCountry) * 100}%` }} />
                  </div>
                  <span className="v">{n.toLocaleString("id-ID")}</span>
                  <X slug={link.slug} mode="country" value={code} label={countryName(code)} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: "1rem" }}>Klik per hari (WIB)</h2>
          <div className="bars">
            {stats.daily.map(([day, n]) => (
              <div className="bar" key={day}>
                <span>{day.slice(5)}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${(n / maxDay) * 100}%` }} />
                </div>
                <span className="v">{n.toLocaleString("id-ID")}</span>
                {n > 0 ? <X slug={link.slug} mode="day" value={day} label={`tanggal ${day}`} /> : <span />}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: "1rem" }}>Klik terbaru</h2>
        {stats.recent.length === 0 ? (
          <p className="empty">Belum ada klik.</p>
        ) : (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Negara</th>
                  <th>Sumber</th>
                  <th>Perangkat</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((c, i) => (
                  <tr key={i}>
                    <td>{formatTime(c.t)}</td>
                    <td>
                      <span className="cn">
                        <Flag code={c.c} />
                        {countryName(c.c)}
                      </span>
                    </td>
                    <td>{c.r}</td>
                    <td>{c.d}</td>
                    <td className="num"><X slug={link.slug} mode="click" value={String(c.t)} label="klik ini" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
