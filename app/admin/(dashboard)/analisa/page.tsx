import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/lib/links";
import { countryName } from "@/lib/format";
import { Flag } from "@/lib/flag";

export const dynamic = "force-dynamic";

const n = (v: number) => v.toLocaleString("id-ID");
const RANGES = [7, 14, 30] as const;

function labelDevice(d: string): string {
  if (d === "mobile") return "Mobile";
  if (d === "desktop") return "Desktop";
  return d || "Tidak diketahui";
}

function labelRef(r: string): string {
  if (!r || r === "langsung") return "Langsung";
  return r;
}

export default async function AnalisaPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const days = (RANGES as readonly number[]).includes(Number(sp.days)) ? Number(sp.days) : 14;
  const host = (await headers()).get("host") ?? "";
  const a = await getAnalytics(days);

  const deltaPct = a.prevTotal !== null && a.prevTotal > 0 ? Math.round(((a.total - a.prevTotal) / a.prevTotal) * 100) : null;
  const maxDay = Math.max(1, ...a.daily.map(([, v]) => v));
  const maxTop = Math.max(1, ...a.topLinks.map((l) => l.n));
  const maxDevice = Math.max(1, ...a.devices.map(([, v]) => v));
  const maxRef = Math.max(1, ...a.referrers.slice(0, 6).map(([, v]) => v));

  return (
    <main className="wrap">
      <div className="top">
        <h1>
          Analisa <small>{host}</small>
        </h1>
        <nav aria-label="Rentang waktu" style={{ display: "inline-flex", gap: 4, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 4 }}>
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analisa?days=${r}`}
              aria-current={r === days ? "page" : undefined}
              style={{
                border: 0,
                font: "inherit",
                fontSize: ".82rem",
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: 9,
                textDecoration: "none",
                color: r === days ? "var(--btnt)" : "var(--muted)",
                background: r === days ? "var(--btn)" : "transparent",
              }}
            >
              {r} Hari
            </Link>
          ))}
        </nav>
      </div>

      {a.linkCount === 0 ? (
        <div className="empty">
          <p>Belum ada tautan. Buat tautan dulu di halaman Tautan.</p>
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <b>{n(a.total)}</b>
                {deltaPct !== null && (
                  <span
                    style={{
                      fontSize: ".74rem",
                      fontWeight: 700,
                      borderRadius: 99,
                      padding: "3px 8px",
                      color: deltaPct >= 0 ? "var(--ok)" : "var(--danger)",
                      background: "var(--hover)",
                    }}
                  >
                    {deltaPct >= 0 ? "+" : ""}
                    {deltaPct}%
                  </span>
                )}
              </div>
              <span>Total klik ({days} hari)</span>
            </div>
            <div className="stat">
              <b>{n(a.avgPerDay)}</b>
              <span>Rata-rata klik/hari</span>
            </div>
            <div className="stat">
              <b>{n(a.linkCount)}</b>
              <span>Tautan aktif</span>
            </div>
            <div className="stat">
              <b>{a.peak ? n(a.peak.n) : "-"}</b>
              <span>Puncak harian{a.peak ? ` (${a.peak.day.slice(8)}/${a.peak.day.slice(5, 7)})` : ""}</span>
            </div>
          </div>

          <section className="panel">
            <h2>Tren klik harian</h2>
            {a.total === 0 ? (
              <p className="empty">Belum ada klik dalam {days} hari terakhir.</p>
            ) : (
              <div className="dchart">
                {a.daily.map(([day, v]) => (
                  <div className="dcol" key={day} title={`${day}: ${n(v)} klik`}>
                    <span className="dn">{v > 0 ? n(v) : ""}</span>
                    <div className="dbar">
                      <div className={`dfill${v === 0 ? " nol" : ""}`} style={{ height: v > 0 ? `${(v / maxDay) * 100}%` : undefined }} />
                    </div>
                    <span className="dl">
                      {day.slice(8)}/{day.slice(5, 7)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="cols">
            <section className="panel">
              <h2>
                Tautan teratas <small>{days} hari</small>
              </h2>
              {a.topLinks.every((l) => l.n === 0) ? (
                <p className="empty">Belum ada klik.</p>
              ) : (
                <div className="rbars">
                  {a.topLinks.map((l) => (
                    <Link className="rbar mini" key={l.slug} href={`/admin/statistik/${l.slug}`}>
                      <span className="cn">/{l.slug}</span>
                      <div className="track">
                        <div className="fill" style={{ width: `${(l.n / maxTop) * 100}%` }} />
                      </div>
                      <span className="v">{n(l.n)}</span>
                      <span className="pct">{a.total > 0 ? Math.round((l.n / a.total) * 100) : 0}%</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <h2>
                Negara <small>sepanjang waktu</small>
              </h2>
              {a.countries.length === 0 ? (
                <p className="empty">Belum ada data.</p>
              ) : (
                <div className="rbars">
                  {a.countries.slice(0, 6).map(([code, c]) => (
                    <div className="rbar mini" key={code}>
                      <span className="cn">
                        <Flag code={code} />
                        {countryName(code)}
                      </span>
                      <div className="track">
                        <div className="fill" style={{ width: `${(c / (a.countries[0]?.[1] ?? 1)) * 100}%` }} />
                      </div>
                      <span className="v">{n(c)}</span>
                      <span className="pct">{a.total > 0 ? Math.round((c / a.countries.reduce((s, [, x]) => s + x, 0)) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="cols">
            <section className="panel">
              <h2>
                Perangkat <small>sepanjang waktu</small>
              </h2>
              {a.devices.length === 0 ? (
                <p className="empty">Belum ada data.</p>
              ) : (
                <div className="bars">
                  {a.devices.map(([d, c]) => (
                    <div className="bar" key={d}>
                      <span>{labelDevice(d)}</span>
                      <div className="track">
                        <div className="fill" style={{ width: `${(c / maxDevice) * 100}%` }} />
                      </div>
                      <span className="v">{n(c)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <h2>
                Sumber trafik <small>sepanjang waktu</small>
              </h2>
              {a.referrers.length === 0 ? (
                <p className="empty">Belum ada data.</p>
              ) : (
                <div className="bars">
                  {a.referrers.slice(0, 6).map(([r, c]) => (
                    <div className="bar" key={r}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{labelRef(r)}</span>
                      <div className="track">
                        <div className="fill" style={{ width: `${(c / maxRef) * 100}%` }} />
                      </div>
                      <span className="v">{n(c)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
