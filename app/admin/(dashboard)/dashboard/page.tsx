import { requireAdmin } from "@/lib/auth";
import { getWebStats } from "@/lib/visits";
import { countryName } from "@/lib/format";
import { Flag } from "@/lib/flag";

export const dynamic = "force-dynamic";

const n = (v: number) => v.toLocaleString("id-ID");

export default async function DashboardPage() {
  await requireAdmin();
  const w = await getWebStats();

  const maxDay = Math.max(1, ...w.days.map((d) => d.visitors));
  const maxCountry = Math.max(1, ...w.countries.map(([, c]) => c));

  return (
    <main className="wrap">
      <div className="top">
        <h1>
          Dashboard <small>Website emahairshop.com</small>
        </h1>
      </div>

      <p className="sum" style={{ margin: "0 0 4px" }}>
        Pengunjung dihitung satu kali per alamat IP per hari. Hari tanpa data tampil 0. Angka ini sama dengan laporan statistik di Telegram.
      </p>

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
          <div className="cols">
            <section>
              <h2 style={{ fontSize: "1rem" }}>Pengunjung per hari (WIB)</h2>
              <div className="bars">
                {w.days.map((d) => (
                  <div className="bar" key={d.day}>
                    <span>{d.day.slice(5)}</span>
                    <div className="track">
                      <div className="fill" style={{ width: `${(d.visitors / maxDay) * 100}%` }} />
                    </div>
                    <span className="v">{n(d.visitors)}</span>
                    <span />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: "1rem" }}>Negara pengunjung (14 hari)</h2>
              {w.countries.length === 0 ? (
                <p className="empty">Belum ada data.</p>
              ) : (
                <div className="bars">
                  {w.countries.slice(0, 14).map(([code, c]) => (
                    <div className="bar" key={code}>
                      <span className="cn">
                        <Flag code={code} />
                        {countryName(code)}
                      </span>
                      <div className="track">
                        <div className="fill" style={{ width: `${(c / maxCountry) * 100}%` }} />
                      </div>
                      <span className="v">{n(c)}</span>
                      <span />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: "1rem" }}>Rincian harian</h2>
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
                    <tr key={d.day}>
                      <td>{d.day}</td>
                      <td className="num">{n(d.visitors)}</td>
                      <td className="num">{n(d.pageviews)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </>
      )}
    </main>
  );
}
