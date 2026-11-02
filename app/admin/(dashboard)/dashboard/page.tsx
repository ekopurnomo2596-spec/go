import { requireAdmin } from "@/lib/auth";
import { getWebStats } from "@/lib/visits";
import { countryName } from "@/lib/format";
import { Flag } from "@/lib/flag";
import { removeWebStatsAction, resetWebStats } from "../../actions";
import { ActionForm } from "../forms";
import { WebX } from "../webx";
import { Info } from "../info";
import { WebBars } from "../web-bars";
import { groupByLabel, labelDevice, labelRef } from "@/lib/sumber";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const n = (v: number) => v.toLocaleString("id-ID");

export default async function DashboardPage() {
  await requireAdmin();
  const w = await getWebStats();

  const maxDay = Math.max(1, ...w.days.map((d) => d.visitors));
  const maxCountry = Math.max(1, ...w.countries.map(([, c]) => c));
  const totalCountry = w.countries.reduce((a, [, c]) => a + c, 0);

  return (
    <main className="wrap">
      <div className="top">
        <h1>
          Dashboard
          <Info text="Pengunjung dihitung satu kali per alamat IP per hari, dan hari tanpa data tampil 0. Angkanya sama dengan laporan statistik di Telegram. Data tidak dihapus otomatis; hapus manual lewat tombol Hapus data." />
          <small>Website emahairshop.com</small>
        </h1>
        {w.daysWithData > 0 && (
          <details className="hapusmenu">
            <summary>Hapus data</summary>
            <div className="pop">
              <ActionForm
                action={removeWebStatsAction}
                btnClass="danger"
                confirm="Hapus data kunjungan pada rentang tanggal ini?"
                label="Hapus rentang"
              >
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
              </ActionForm>
              <ActionForm
                action={resetWebStats}
                btnClass="danger"
                confirm="Hapus SEMUA data kunjungan website (pengunjung, halaman dilihat, negara)? Data CTR di Analisa juga ikut hilang."
                label="Hapus semua data"
              />
              <p className="hint">Ikon tong sampah di setiap baris menghapus per negara atau per hari.</p>
            </div>
          </details>
        )}
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
                  {d.visitors > 0 || d.pageviews > 0 ? (
                    <WebX mode="day" value={d.day} label={`tanggal ${d.day}`} />
                  ) : (
                    <span className="xs" />
                  )}
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
                    <div className="rbar" key={code}>
                      <span className="cn">
                        <Flag code={code} />
                        {countryName(code)}
                      </span>
                      <div className="track">
                        <div className="fill" style={{ width: `${(c / maxCountry) * 100}%` }} />
                      </div>
                      <span className="v">{n(c)}</span>
                      <span className="pct">{totalCountry > 0 ? Math.round((c / totalCountry) * 100) : 0}%</span>
                      <WebX mode="country" value={code} label={countryName(code)} />
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

          <div className="cols">
            <WebBars title="Sumber trafik" rows={groupByLabel(w.referrers, labelRef)} kind="ref" />
            <WebBars title="Perangkat" rows={groupByLabel(w.devices, labelDevice)} kind="dev" />
          </div>
        </>
      )}
    </main>
  );
}
