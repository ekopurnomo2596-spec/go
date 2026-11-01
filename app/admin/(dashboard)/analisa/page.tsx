import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/lib/links";
import { countryName } from "@/lib/format";

export const dynamic = "force-dynamic";

const nf = (v: number) => v.toLocaleString("id-ID");
const RANGES = [7, 14, 30] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-11-01" -> "1 Nov" */
function dayLabel(day: string): string {
  return `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1] ?? ""}`;
}

function labelDevice(d: string): string {
  if (d === "mobile") return "Mobile";
  if (d === "desktop") return "Desktop";
  if (d === "tablet") return "Tablet";
  return d || "Tidak diketahui";
}

function labelRef(r: string): string {
  if (!r || r === "langsung") return "Langsung";
  return r;
}

type Row = { key: string; label: string; v: number; rest?: boolean };

/** Ambil `max` teratas; sisanya digabung jadi "Lainnya" (seperti di demo). */
function withRest(rows: [string, number][], max: number, label: (k: string) => string): Row[] {
  if (rows.length <= max + 1) return rows.map(([k, v]) => ({ key: k, label: label(k), v }));
  const head = rows.slice(0, max).map(([k, v]) => ({ key: k, label: label(k), v }));
  const rest = rows.slice(max).reduce((s, [, v]) => s + v, 0);
  return [...head, { key: "__rest", label: "Lainnya", v: rest, rest: true }];
}

const sum = (rows: [string, number][]) => rows.reduce((s, [, v]) => s + v, 0);

const CSS = `
.an{background:#fafafa;color:#111;min-height:100vh;padding:40px 24px 80px;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.an *{box-sizing:border-box}
.an a{color:#111;text-decoration:none}
.an-t{font-variant-numeric:tabular-nums}
.an-in{max-width:1200px;margin:0 auto}
.an-hd{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.an h1.an-h1{margin:0;font-size:1.4rem;font-weight:800;color:#111;line-height:1.3}
.an-sub{color:#666;font-size:.82rem;margin-top:4px}
.an-tabs{display:inline-flex;gap:4px;background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:4px}
.an .an-tabs a{font-size:.82rem;font-weight:600;padding:8px 14px;border-radius:9px;color:#666;background:transparent}
.an .an-tabs a[aria-current]{background:#16a34a;color:#fff}
.an-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:20px}
.an-kpi{border:1px solid #e5e5e5;border-radius:14px;padding:18px;background:#fff}
.an-kpi-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.an-kpi b{font-size:1.8rem;font-weight:800;line-height:1.2}
.an-kpi-l{color:#666;font-size:.8rem}
.an-pill{font-size:.74rem;font-weight:700;border-radius:99px;padding:3px 8px;color:#666;background:#f5f5f5;white-space:nowrap}
.an-pill.up{color:#15803d;background:#f0fdf4}
.an-pill.down{color:#b3261e;background:#fef2f2}
.an-card{border:1px solid #e5e5e5;border-radius:16px;padding:20px;background:#fff}
.an .an-card h2{margin:0 0 14px;font-size:1rem;font-weight:700;color:#111;line-height:1.4}
.an .an-card h2 small{font-size:.72rem;font-weight:500;color:#999;margin-left:6px}
.an-mb{margin-bottom:20px}
.an .an-trend h2{margin-bottom:16px}
.an-xl{display:flex;justify-content:space-between;color:#666;font-size:.72rem;margin-top:4px}
.an-cols{display:grid;grid-template-columns:1.3fr 1fr;gap:20px;margin-bottom:20px}
.an-stack{display:grid;gap:20px}
.an-top{display:grid;gap:12px}
.an-top-row{display:grid;grid-template-columns:20px 1fr 56px;gap:12px;align-items:center;font-size:.86rem}
.an-rank{color:#666;font-weight:600;font-size:.78rem}
.an-mid{min-width:0}
.an-line{display:flex;justify-content:space-between;gap:8px}
.an-line b{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.an-share{text-align:right;color:#666;font-size:.8rem}
.an-track{height:7px;border-radius:99px;background:#eee;overflow:hidden}
.an-track.s{height:6px;margin-top:4px}
.an-fill{height:100%}
.an-bars{display:grid;gap:10px;font-size:.84rem}
.an-bar{display:grid;grid-template-columns:96px 1fr 34px;gap:10px;align-items:center}
.an-bar span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.an-bar .an-pct{text-align:right;color:#666}
.an-ctry{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;font-size:.84rem}
.an-ci{display:flex;align-items:center;gap:10px}
.an-badge{width:26px;height:26px;border-radius:50%;color:#fff;font-size:.62rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.an-ci .an-nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.an-ci .an-pct{color:#666}
.an-empty{border:1px solid #e5e5e5;border-radius:16px;padding:40px 20px;background:#fff;text-align:center;color:#666;font-size:.9rem}
.an-empty-s{color:#666;font-size:.86rem;padding:20px 0;text-align:center}
@media (max-width:820px){.an{padding:24px 16px 64px}.an-cols{grid-template-columns:1fr}}
`;

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

  const deltaPct =
    a.prevTotal !== null && a.prevTotal > 0 ? Math.round(((a.total - a.prevTotal) / a.prevTotal) * 100) : null;

  // ---- grafik tren (area + garis, sama seperti demo) ----
  const N = a.daily.length;
  const maxDay = Math.max(1, ...a.daily.map(([, v]) => v));
  const step = N > 1 ? 760 / (N - 1) : 0;
  const pts = a.daily.map(([, v], i) => [Number((i * step).toFixed(1)), Number((150 - (v / maxDay) * 140).toFixed(1))] as const);
  const linePath = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const areaPath = N ? `M0,150 ${pts.map(([x, y]) => `L${x},${y}`).join(" ")} L${pts[N - 1][0]},150 Z` : "";
  const ticks = N ? Array.from({ length: 6 }, (_, k) => a.daily[Math.round((k * (N - 1)) / 5)][0]) : [];

  // ---- tautan teratas ----
  const maxTop = Math.max(1, ...a.topLinks.map((l) => l.n));

  // ---- perangkat / sumber / negara (persentase dari total akumulatif) ----
  const devSum = sum(a.devices);
  const refSum = sum(a.referrers);
  const ctrySum = sum(a.countries);
  const pct = (v: number, total: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  const devices = withRest(a.devices, 4, labelDevice);
  const refs = withRest(a.referrers, 4, labelRef);
  const countries = withRest(a.countries, 4, (c) => countryName(c));

  return (
    <main className="an">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="an-in">
        {/* Header */}
        <div className="an-hd">
          <div>
            <h1 className="an-h1">Analisa</h1>
            <div className="an-sub">
              {host ? `${host} · ` : ""}menampilkan data {days} Hari terakhir
            </div>
          </div>
          <nav className="an-tabs" aria-label="Rentang waktu">
            {RANGES.map((r) => (
              <Link key={r} href={`/admin/analisa?days=${r}`} aria-current={r === days ? "page" : undefined}>
                {r} Hari
              </Link>
            ))}
          </nav>
        </div>

        {a.linkCount === 0 ? (
          <div className="an-empty">Belum ada tautan. Buat tautan dulu di halaman Tautan.</div>
        ) : (
          <>
            {/* KPI */}
            <div className="an-kpis">
              <div className="an-kpi">
                <div className="an-kpi-top">
                  <b className="an-t">{nf(a.total)}</b>
                  {deltaPct !== null && (
                    <span className={`an-pill ${deltaPct > 0 ? "up" : deltaPct < 0 ? "down" : ""}`}>
                      {deltaPct === 0 ? "stabil" : `${deltaPct > 0 ? "+" : ""}${deltaPct}%`}
                    </span>
                  )}
                </div>
                <span className="an-kpi-l">Total klik</span>
              </div>
              <div className="an-kpi">
                <div className="an-kpi-top">
                  <b className="an-t">{nf(a.avgPerDay)}</b>
                </div>
                <span className="an-kpi-l">Rata-rata klik/hari</span>
              </div>
              <div className="an-kpi">
                <div className="an-kpi-top">
                  <b className="an-t">{a.peak ? nf(a.peak.n) : "-"}</b>
                  {a.peak && <span className="an-pill">{dayLabel(a.peak.day)}</span>}
                </div>
                <span className="an-kpi-l">Puncak harian</span>
              </div>
              <div className="an-kpi">
                <div className="an-kpi-top">
                  <b className="an-t">{nf(a.linkCount)}</b>
                </div>
                <span className="an-kpi-l">Tautan aktif</span>
              </div>
            </div>

            {/* Tren */}
            <section className="an-card an-mb an-trend">
              <h2>Tren klik harian</h2>
              {a.total === 0 ? (
                <p className="an-empty-s">Belum ada klik dalam {days} hari terakhir.</p>
              ) : (
                <>
                  <svg
                    viewBox="0 0 780 170"
                    width="100%"
                    height="190"
                    role="img"
                    aria-label={`Grafik tren klik ${days} hari terakhir`}
                  >
                    <line x1="0" y1="10" x2="760" y2="10" stroke="#eee" strokeWidth="1" />
                    <line x1="0" y1="80" x2="760" y2="80" stroke="#eee" strokeWidth="1" />
                    <line x1="0" y1="150" x2="760" y2="150" stroke="#e5e5e5" strokeWidth="1" />
                    <path d={areaPath} fill="#16a34a" opacity=".12" />
                    <path d={linePath} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map(([x, y], i) => (
                      <circle key={a.daily[i][0]} cx={x} cy={y} r="9" fill="transparent">
                        <title>{`${dayLabel(a.daily[i][0])}: ${nf(a.daily[i][1])} klik`}</title>
                      </circle>
                    ))}
                  </svg>
                  <div className="an-xl">
                    {ticks.map((d, i) => (
                      <span key={`${d}-${i}`}>{dayLabel(d)}</span>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* Tautan teratas + perangkat + sumber */}
            <div className="an-cols">
              <section className="an-card">
                <h2>
                  Tautan teratas <small>{days} hari</small>
                </h2>
                {a.topLinks.every((l) => l.n === 0) ? (
                  <p className="an-empty-s">Belum ada klik.</p>
                ) : (
                  <div className="an-top">
                    {a.topLinks.map((l, i) => (
                      <Link key={l.slug} href={`/admin/statistik/${l.slug}`} className="an-top-row" title={l.title}>
                        <span className="an-rank">{i + 1}</span>
                        <div className="an-mid">
                          <div className="an-line">
                            <b>/{l.slug}</b>
                            <b className="an-t">{nf(l.n)}</b>
                          </div>
                          <div className="an-track s">
                            <div className="an-fill" style={{ width: `${(l.n / maxTop) * 100}%`, background: "#16a34a" }} />
                          </div>
                        </div>
                        <span className="an-share an-t">{pct(l.n, a.total)}%</span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <div className="an-stack">
                <section className="an-card">
                  <h2>
                    Perangkat <small>sepanjang waktu</small>
                  </h2>
                  {devices.length === 0 ? (
                    <p className="an-empty-s">Belum ada data.</p>
                  ) : (
                    <div className="an-bars">
                      {devices.map((r) => (
                        <div className="an-bar" key={r.key}>
                          <span title={r.label}>{r.label}</span>
                          <div className="an-track">
                            <div className="an-fill" style={{ width: `${pct(r.v, devSum)}%`, background: "#111" }} />
                          </div>
                          <span className="an-pct an-t">{pct(r.v, devSum)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="an-card">
                  <h2>
                    Sumber trafik <small>sepanjang waktu</small>
                  </h2>
                  {refs.length === 0 ? (
                    <p className="an-empty-s">Belum ada data.</p>
                  ) : (
                    <div className="an-bars">
                      {refs.map((r) => (
                        <div className="an-bar" key={r.key}>
                          <span title={r.label}>{r.label}</span>
                          <div className="an-track">
                            <div className="an-fill" style={{ width: `${pct(r.v, refSum)}%`, background: "#16a34a" }} />
                          </div>
                          <span className="an-pct an-t">{pct(r.v, refSum)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Negara */}
            <section className="an-card">
              <h2>
                Sebaran negara <small>sepanjang waktu</small>
              </h2>
              {countries.length === 0 ? (
                <p className="an-empty-s">Belum ada data.</p>
              ) : (
                <div className="an-ctry">
                  {countries.map((r, i) => (
                    <div className="an-ci" key={r.key}>
                      <span
                        className="an-badge"
                        aria-hidden="true"
                        style={{ background: r.rest ? "#999" : i === 0 ? "#111" : "#666" }}
                      >
                        {r.rest ? "…" : r.key.toUpperCase()}
                      </span>
                      <span className="an-nm">{r.label}</span>
                      <span className="an-pct an-t">{pct(r.v, ctrySum)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
