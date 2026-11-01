import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/lib/links";
import { countryName } from "@/lib/format";
import { Flag } from "@/lib/flag";

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

// Nama sumber trafik yang ramah (hostname -> Instagram, WhatsApp, dst), seperti di demo.
const REF_NAMES: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$|^fb\.me$/, "Facebook"],
  [/(^|\.)whatsapp\.com$|^wa\.me$/, "WhatsApp"],
  [/(^|\.)google\.[a-z.]+$/, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/^t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, "X"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/^t\.me$|(^|\.)telegram\.org$/, "Telegram"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/(^|\.)pinterest\.[a-z.]+$/, "Pinterest"],
];

function labelRef(r: string): string {
  if (!r || r === "langsung") return "Langsung";
  const h = r.toLowerCase();
  for (const [re, name] of REF_NAMES) if (re.test(h)) return name;
  return h.replace(/^www\./, "");
}

/** Gabungkan baris yang labelnya sama (mis. l.instagram.com + instagram.com), urut terbesar dulu. */
function group(rows: [string, number][], label: (k: string) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const [k, v] of rows) m.set(label(k), (m.get(label(k)) ?? 0) + v);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
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
const pct = (v: number, total: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
const same = (k: string) => k;

function Pill({ tone, children }: { tone?: "up" | "down"; children: React.ReactNode }) {
  return <span className={`an-pill${tone ? ` ${tone}` : ""}`}>{children}</span>;
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

  const deltaPct =
    a.prevTotal !== null && a.prevTotal > 0 ? Math.round(((a.total - a.prevTotal) / a.prevTotal) * 100) : null;

  // ---- grafik tren: satu kolom per hari, titik berada di tengah kolom ----
  const N = a.daily.length;
  const maxDay = Math.max(1, ...a.daily.map(([, v]) => v));
  const px = (i: number) => Number((((i + 0.5) / N) * 100).toFixed(2));
  const py = (v: number) => Number((94 - (v / maxDay) * 88).toFixed(2));
  const pts = a.daily.map(([, v], i) => [px(i), py(v)] as const);
  const linePath = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const areaPath = N ? `M${pts[0][0]},94 ${pts.map(([x, y]) => `L${x},${y}`).join(" ")} L${pts[N - 1][0]},94 Z` : "";
  const tickIdx = N ? [...new Set(Array.from({ length: 6 }, (_, k) => Math.round((k * (N - 1)) / 5)))] : [];

  // ---- tautan teratas ----
  const maxTop = Math.max(1, ...a.topLinks.map((l) => l.n));

  // ---- perangkat / sumber / negara (akumulatif, persen dari totalnya) ----
  const devGroups = group(a.devices, labelDevice);
  const refGroups = group(a.referrers, labelRef);
  const devSum = sum(devGroups);
  const refSum = sum(refGroups);
  const ctrySum = sum(a.countries);

  const devices = withRest(devGroups, 4, same);
  const refs = withRest(refGroups, 4, same);
  const countries = withRest(a.countries, 4, countryName);

  return (
    <main className="wrap an">
      <div className="top">
        <h1>
          Analisa <small>{host}</small>
        </h1>
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
                <b>{nf(a.total)}</b>
                {deltaPct !== null &&
                  (deltaPct === 0 ? (
                    <Pill>stabil</Pill>
                  ) : (
                    <Pill tone={deltaPct > 0 ? "up" : "down"}>{`${deltaPct > 0 ? "+" : ""}${deltaPct}%`}</Pill>
                  ))}
              </div>
              <span className="an-kpi-l">Total klik</span>
            </div>

            <div className="an-kpi">
              <div className="an-kpi-top">
                <b>{nf(a.avgPerDay)}</b>
              </div>
              <span className="an-kpi-l">Rata-rata klik/hari</span>
            </div>

            <div className="an-kpi">
              <div className="an-kpi-top">
                <b>{a.peak ? nf(a.peak.n) : "-"}</b>
                {a.peak && <Pill>{dayLabel(a.peak.day)}</Pill>}
              </div>
              <span className="an-kpi-l">Puncak harian</span>
            </div>

            <div className="an-kpi">
              <div className="an-kpi-top">
                <b>{nf(a.linkCount)}</b>
                {a.newLinks > 0 ? <Pill tone="up">{`+${a.newLinks} baru`}</Pill> : <Pill>stabil</Pill>}
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
                <div className="an-plot" role="img" aria-label={`Grafik tren klik ${days} hari terakhir`}>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <line className="an-g" x1="0" y1="6" x2="100" y2="6" />
                    <line className="an-g" x1="0" y1="50" x2="100" y2="50" />
                    <line className="an-g base" x1="0" y1="94" x2="100" y2="94" />
                    <path className="an-area" d={areaPath} />
                    <path className="an-ln" d={linePath} />
                  </svg>
                  <div className="an-hov">
                    {a.daily.map(([day, v], i) => (
                      <div
                        key={day}
                        className={`an-hc${pts[i][1] < 35 ? " lo" : ""}`}
                        style={{ "--y": `${pts[i][1]}%` } as React.CSSProperties}
                      >
                        <i className="an-hl" />
                        <i className="an-hdot" />
                        <span className="an-tp">
                          <b>{dayLabel(day)}</b>
                          {nf(v)} klik
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="an-xl">
                  {tickIdx.map((i) => (
                    <span key={a.daily[i][0]} style={{ left: `${pts[i][0]}%` }}>
                      {dayLabel(a.daily[i][0])}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Tautan teratas + perangkat + sumber */}
          <div className="an-cols">
            <section className="an-card">
              <h2>Tautan teratas</h2>
              {a.topLinks.every((l) => l.n === 0) ? (
                <p className="an-empty-s">Belum ada klik.</p>
              ) : (
                <div className="an-top">
                  {a.topLinks.map((l, i) => (
                    <Link
                      key={l.slug}
                      href={`/admin/statistik/${l.slug}`}
                      className="an-top-row"
                      title={`${l.title || `/${l.slug}`} · ${pct(l.n, a.total)}% dari total klik`}
                    >
                      <span className="an-rank">{i + 1}</span>
                      <div className="an-mid">
                        <div className="an-line">
                          <b className="an-nm">/{l.slug}</b>
                          <b>{nf(l.n)}</b>
                        </div>
                        <div className="an-track s">
                          <div className="an-fill" style={{ width: `${(l.n / maxTop) * 100}%`, background: "var(--an-acc)" }} />
                        </div>
                      </div>
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
                          <div className="an-fill" style={{ width: `${pct(r.v, devSum)}%`, background: "var(--ink)" }} />
                        </div>
                        <span className="an-pct">{pct(r.v, devSum)}%</span>
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
                          <div className="an-fill" style={{ width: `${pct(r.v, refSum)}%`, background: "var(--an-acc)" }} />
                        </div>
                        <span className="an-pct">{pct(r.v, refSum)}%</span>
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
                {countries.map((r) => (
                  <div className="an-ci" key={r.key}>
                    {r.rest ? <span className="an-rest" aria-hidden="true">…</span> : <Flag code={r.key} />}
                    <span className="an-cn">{r.label}</span>
                    <span className="an-pct">{pct(r.v, ctrySum)}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
