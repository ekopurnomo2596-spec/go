import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLink, getStats, validSlugFormat } from "@/lib/links";
import { countryName, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StatsPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
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
      </div>
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
                  <span>{countryName(code)}</span>
                  <div className="track">
                    <div className="fill" style={{ width: `${(n / maxCountry) * 100}%` }} />
                  </div>
                  <span className="v">{n.toLocaleString("id-ID")}</span>
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
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((c, i) => (
                  <tr key={i}>
                    <td>{formatTime(c.t)}</td>
                    <td>{countryName(c.c)}</td>
                    <td>{c.r}</td>
                    <td>{c.d}</td>
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
