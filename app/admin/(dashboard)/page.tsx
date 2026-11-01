import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { getWebStats } from "@/lib/visits";
import { countryName } from "@/lib/format";
import { Flag } from "@/lib/flag";
import { Info } from "./info";

export const dynamic = "force-dynamic";

const n = (v: number) => v.toLocaleString("id-ID");

export default async function DashboardPage() {
  await requireAdmin();
  const host = (await headers()).get("host") ?? "";
  const w = await getWebStats();

  const maxDay = Math.max(1, ...w.days.map((d) => d.visitors));
  const maxCountry = Math.max(1, ...w.countries.map(([, c]) => c));
  const totalCountry = w.countries.reduce((a, [, c]) => a + c, 0);

  return (
    <main className="wrap">
      <div className="top">
        <h1>
          Dashboard
          <Info text="Pengunjung dihitung satu kali per alamat IP per hari, dan hari tanpa data tampil 0. Angkanya sama dengan laporan statistik di Telegram. Data dari website hanya bertahan 3 hari lalu dihapus otomatis, jadi buka dashboard ini minimal sekali dalam 3 hari supaya riwayatnya tersimpan lengkap." />
          <small>{host}</small>
        </h1>
      </div>

      <div className="stats">
        <div className="stat">
          <b>{n(w.today.visitors)}</b>
          <span>Pengunjung hari ini</span>
        </div>
        <div className="stat">
          <b>{n(w.today.pageviews)}</b>
          <span>Halaman dilihat hari ini</span>
        </div>
        <div className="stat">
          <b>{n(w.sum.visitors)}</b>
          <span>Pengunjung 14 hari</span>
        </div>
        <div className="stat">
          <b>{n(w.sum.pageviews)}</b>
          <span>Halaman dilihat 14 hari</span>
        </div>
      </div>

      {w.daysWithData === 0 ? (
        <p className="empty">Belum ada data kunjungan di Redis. Pastikan website utama sudah terhubung ke database yang sama.</p>
      ) : (
        <>
          <section className="panel">
            <h2>Pengunjung per hari (WIB)</h2>
            <div className="dchart">
              {w.days.map((d) => (
                <div className="dcol" key={d.day} title={`${d.day}: ${n(d.visitors)} pengunjung, ${n(d.pageviews)} halaman dilihat`}>
                  <span className="dn">{d.visitors > 0 ? n(d.visitors) : ""}</span>
                  <div className="dbar">
                    <div
                      className={`dfill${d.visitors === 0 ? " nol" : ""}`}
                      style={{ height: d.visitors > 0 ? `${(d.visitors / maxDay) * 100}%` : undefined }}
                    />
                  </div>
                  <span className="dl">{d.day.slice(8)}/{d.day.slice(5, 7)}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="cols">
            <section className="panel">
              <h2>
                Negara pengunjung <small>14 hari</small>
              </h2>
              {w.countries.length === 0 ? (
                <p className="empty">Belum ada data.</p>
              ) : (
                <div className="rbars">
                  {w.countries.slice(0, 14).map(([code, c]) => (
                    <div className="rbar mini" key={code}>
                      <span className="cn">
                        <Flag code={code} />
                        {countryName(code)}
                      </span>
                      <div className="track">
                        <div className="fill" style={{ width: `${(c / maxCountry) * 100}%` }} />
                      </div>
                      <span className="v">{n(c)}</span>
                      <span className="pct">{totalCountry > 0 ? Math.round((c / totalCountry) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <h2>Rincian harian</h2>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th className="num">Pengunjung</th>
                      <th className="num">Halaman dilihat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...w.days].reverse().map((d) => (
                      <tr key={d.day} className={d.visitors === 0 && d.pageviews === 0 ? "zero" : undefined}>
                        <td>{d.day}</td>
                        <td className="num">{n(d.visitors)}</td>
                        <td className="num">{n(d.pageviews)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
