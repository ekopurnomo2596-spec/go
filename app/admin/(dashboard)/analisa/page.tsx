import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/lib/links";
import { countryName, jakartaDay } from "@/lib/format";
import { getWebSnaps } from "@/lib/visits";
import { SourceSelect } from "./source-select";
import { Info } from "../info";
import { CountryList } from "./country-list";
import { Flag } from "@/lib/flag";
import { labelRef } from "@/lib/sumber";
import { DeviceIcon, RefIcon } from "@/lib/sumber-icon";
import { RefList } from "./ref-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analisa" };

const nf = (v: number) => v.toLocaleString("id-ID");
const RANGES = [1, 7, 14, 30] as const;
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

const SRC = ["go", "ema", "semua"] as const;
type Src = (typeof SRC)[number];

const pctDelta = (cur: number, prev: number | null) =>
  prev !== null && prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;

function Delta({ v }: { v: number | null }) {
  if (v === null) return <Pill tone="up">Baru</Pill>;
  return v === 0 ? <Pill>Stabil</Pill> : <Pill tone={v > 0 ? "up" : "down"}>{`${v > 0 ? "+" : ""}${v}%`}</Pill>;
}

const CMP = "Persen (%) = naik/turun dibanding periode sebelumnya.\nBaru = periode sebelumnya belum ada data.";
const CMP_AVG = "Persen (%) = perubahan rata-rata harian dibanding periode sebelumnya.\nBaru = periode sebelumnya belum ada data.";

function Kpi({
  value,
  label,
  info,
  delta,
  pill,
}: {
  value: string;
  label: string;
  info?: string;
  delta?: number | null;
  pill?: React.ReactNode;
}) {
  return (
    <div className="an-kpi">
      <div className="an-kpi-top">
        <b>{value}</b>
        {pill ?? (delta !== undefined && <Delta v={delta} />)}
      </div>
      <span className="an-kpi-l">
        <span>{label}</span>
        {info && <Info text={info} />}
      </span>
    </div>
  );
}

export default async function AnalisaPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; src?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const days = (RANGES as readonly number[]).includes(Number(sp.days)) ? Number(sp.days) : 14;
  const src: Src = (SRC as readonly string[]).includes(sp.src ?? "") ? (sp.src as Src) : "semua";
  const one = days === 1;
  const span = one ? "hari ini" : `${days} hari`;
  const showGo = src !== "ema";
  const showEma = src !== "go";
  const goName = (await headers()).get("host") ?? "go.emahairshop.com";
  const emaName = "emahairshop.com";
  const a = await getAnalytics(days);

  // ---- data website utama (ema) ----
  const dayList: string[] = [];
  for (let i = days - 1; i >= 0; i--) dayList.push(jakartaDay(i));
  const prevList: string[] = [];
  for (let i = days * 2 - 1; i >= days; i--) prevList.push(jakartaDay(i));
  const snaps = showEma ? await getWebSnaps([...prevList, ...dayList]) : {};
  const sumOf = (list: string[], k: "visitors" | "pageviews") => list.reduce((t, d) => t + (snaps[d]?.[k] ?? 0), 0);
  const withData = (list: string[]) => list.filter((d) => snaps[d]).length;
  const eVis = sumOf(dayList, "visitors");
  const ePv = sumOf(dayList, "pageviews");
  const curN = withData(dayList);
  const prevN = withData(prevList);
  // bandingkan rata-rata per hari yang punya data, supaya hari tanpa snapshot tidak dianggap penurunan
  const avgDelta = (k: "visitors" | "pageviews") =>
    curN > 0 && prevN > 0 ? pctDelta(sumOf(dayList, k) / curN, sumOf(prevList, k) / prevN) : null;
  const emaDev: Record<string, number> = {};
  const emaRef: Record<string, number> = {};
  for (const d of dayList) {
    for (const [k, n] of Object.entries(snaps[d]?.vd ?? {})) emaDev[k] = (emaDev[k] ?? 0) + Number(n || 0);
    for (const [k, n] of Object.entries(snaps[d]?.vr ?? {})) emaRef[k] = (emaRef[k] ?? 0) + Number(n || 0);
  }
  const emaDaily: [string, number][] = dayList.map((d) => [d, snaps[d]?.visitors ?? 0]);
  const emaCountry: Record<string, number> = {};
  for (const d of dayList)
    for (const [code, n] of Object.entries(snaps[d]?.vc ?? {})) {
      const c = /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase() : "XX";
      emaCountry[c] = (emaCountry[c] ?? 0) + Number(n || 0);
    }

  const deltaPct = a.prevTotal !== null ? pctDelta(a.total, a.prevTotal) : null;
  const uniqDelta = a.unique !== null && a.prevUnique !== null ? pctDelta(a.unique, a.prevUnique) : null;
  const f1 = (v: number) => v.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const cmp = one ? "Hari ini belum selesai, jadi tidak dibandingkan dengan kemarin. Lihat perbandingannya di grafik." : CMP;
  const cmpAvg = one ? cmp : CMP_AVG;
  const dv = (v: number | null) => (one ? undefined : v);
  const ctrDelta = a.ctr !== null && a.prevCtr !== null ? Math.round((a.ctr - a.prevCtr) * 10) / 10 : null;
  const ctrPill = one ? undefined : ctrDelta === null ? (
    <Pill tone="up">Baru</Pill>
  ) : ctrDelta === 0 ? (
    <Pill>Stabil</Pill>
  ) : (
    <Pill tone={ctrDelta > 0 ? "up" : "down"}>{`${ctrDelta > 0 ? "+" : ""}${f1(ctrDelta)}%`}</Pill>
  );

  // ---- grafik tren: satu kolom per hari, titik berada di tengah kolom ----
  const series: { cls: string; unit: string; name: string; data: [string, number][]; prev: number }[] = [];
  if (showGo) series.push({ cls: "", unit: "klik", name: goName, data: a.daily, prev: a.prevTotal ?? 0 });
  if (showEma) series.push({ cls: showGo ? "b" : "", unit: "pengunjung", name: emaName, data: emaDaily, prev: sumOf(prevList, "visitors") });
  const N = dayList.length;
  const maxDay = Math.max(1, ...series.flatMap((x) => x.data.map(([, v]) => v)));
  const px = (i: number) => (N > 1 ? Number(((i / (N - 1)) * 100).toFixed(2)) : 50);
  const colW = N > 1 ? 100 / (N - 1) : 100;
  const py = (v: number) => Number((94 - (v / maxDay) * 88).toFixed(2));
  const drawn = series.map((x) => {
    const pts = x.data.map(([, v], i) => [px(i), py(v)] as const);
    return {
      ...x,
      pts,
      line: pts.map(([X, Y], i) => `${i ? "L" : "M"}${X},${Y}`).join(" "),
      area: N ? `M${pts[0][0]},94 ${pts.map(([X, Y]) => `L${X},${Y}`).join(" ")} L${pts[N - 1][0]},94 Z` : "",
    };
  });
  const trendTotal = series.reduce((t, x) => t + x.data.reduce((u, [, v]) => u + v, 0), 0);
  const prevTrend = series.reduce((t, x) => t + x.prev, 0);
  const prevVis = prevList[0] && snaps[prevList[0]] ? snaps[prevList[0]].visitors : null;
  // label sumbu X: interval tetap, dihitung mundur dari hari terakhir supaya jaraknya rata
  const tickStep = Math.max(1, Math.ceil((N - 1) / 5));
  const tickIdx: number[] = [];
  for (let i = N - 1; i >= 0; i -= tickStep) tickIdx.unshift(i);

  // ---- tautan teratas ----
  const maxTop = Math.max(1, ...a.topLinks.map((l) => l.n));

  // ---- perangkat / sumber / negara ----
  const devGroups = group(
    [...(showGo ? a.devices : []), ...(showEma ? Object.entries(emaDev) : [])] as [string, number][],
    labelDevice,
  );
  const refGroups = group(
    [...(showGo ? a.referrers : []), ...(showEma ? Object.entries(emaRef) : [])] as [string, number][],
    labelRef,
  );
  const devSum = sum(devGroups);
  const refSum = sum(refGroups);
  const countryMap: Record<string, number> = {};
  if (showGo) for (const [c, v] of a.countries) countryMap[c] = (countryMap[c] ?? 0) + v;
  if (showEma) for (const [c, v] of Object.entries(emaCountry)) countryMap[c] = (countryMap[c] ?? 0) + v;
  const countryRows = Object.entries(countryMap).sort((x, y) => y[1] - x[1]);
  const ctrySum = sum(countryRows);

  const devices = withRest(devGroups, 4, same);
  const refs = withRest(refGroups, 4, same);
  const refCells = (label: string, v: number, isRest = false) => (
    <>
      <span className="an-src-l" title={label}>
        <RefIcon name={label} rest={isRest} />
        <span>{label}</span>
      </span>
      <div className="an-track">
        <div className="an-fill" style={{ width: `${pct(v, refSum)}%`, background: "var(--an-acc)" }} />
      </div>
      <span className="an-pct">{pct(v, refSum)}%</span>
    </>
  );
  const refRow = (key: string, label: string, v: number) => (
    <div className="an-bar" key={key}>
      {refCells(label, v)}
    </div>
  );
  const countries = withRest(countryRows, 4, countryName);
  const ctryNote = span;
  const subtitle = src === "go" ? goName : src === "ema" ? emaName : `${goName} + ${emaName}`;
  const srcOptions = [
    { value: "semua", label: "Semua" },
    { value: "go", label: goName },
    { value: "ema", label: emaName },
  ];
  const empty = src === "go" && a.linkCount === 0;

  return (
    <main className="wrap an">
      <div className="top">
        <div>
          <h1>Analisa</h1>
          <div className="an-sub">{subtitle}</div>
        </div>
        <div className="an-ctl">
          <SourceSelect value={src} days={days} options={srcOptions} />
          <nav className="an-tabs" aria-label="Rentang waktu">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/analisa?days=${r}&src=${src}`}
                aria-current={r === days ? "page" : undefined}
              >
                {r === 1 ? "Hari ini" : `${r} Hari`}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {empty ? (
        <div className="an-empty">Belum ada tautan. Buat tautan dulu di halaman Tautan.</div>
      ) : (
        <>
          {/* KPI */}
          <div className="an-kpis">
            {src === "go" && (
              <>
                <Kpi value={nf(a.total)} label="Total klik" info={`Jumlah klik pada tautan go dalam ${span}. Satu alamat IP dihitung sekali per tautan per hari, bot tidak dihitung.\n${cmp}`} delta={dv(deltaPct)} />
                <Kpi value={a.unique !== null ? nf(a.unique) : "-"} label="Pengunjung unik" info={`Perkiraan jumlah orang berbeda yang mengeklik tautan go. Satu alamat IP dihitung sekali per hari.\n${cmp}`} delta={dv(uniqDelta)} />
                <Kpi
                  value={a.ctr !== null ? `${f1(a.ctr)}%` : "-"}
                  label="Rata-rata CTR"
                  info={"Persentase halaman dilihat di emahairshop.com yang berujung klik tautan go (klik ÷ halaman dilihat).\nPersen (%) = selisih poin dibanding periode sebelumnya."}
                  pill={ctrPill}
                />
                <Kpi
                  value={nf(a.linkCount)}
                  label="Tautan aktif"
                  info="Jumlah tautan yang ada sekarang. +N Baru = dibuat dalam periode ini."
                  pill={a.newLinks > 0 ? <Pill tone="up">{`+${a.newLinks} Baru`}</Pill> : <Pill>Stabil</Pill>}
                />
              </>
            )}
            {src === "ema" && (
              <>
                <Kpi value={nf(eVis)} label="Pengunjung" info={`Jumlah pengunjung emahairshop.com. Satu orang dihitung sekali per hari.\n${cmpAvg}`} delta={dv(avgDelta("visitors"))} />
                <Kpi value={nf(ePv)} label="Halaman dilihat" info={`Jumlah halaman emahairshop.com yang dibuka.\n${cmpAvg}`} delta={dv(avgDelta("pageviews"))} />
                {one ? (
                  <Kpi value={prevVis !== null ? nf(prevVis) : "-"} label="Pengunjung kemarin" info="Pengunjung emahairshop.com kemarin, sebagai pembanding hari ini." />
                ) : (
                  <Kpi value={curN > 0 ? nf(Math.round(eVis / curN)) : "-"} label="Rata-rata pengunjung/hari" info="Total pengunjung dibagi jumlah hari yang ada datanya." delta={dv(avgDelta("visitors"))} />
                )}
              </>
            )}
            {src === "semua" && (
              <>
                <Kpi value={nf(a.total)} label="Total klik" info={`Klik pada tautan go (${goName}) dalam ${span}.\n${cmp}`} delta={dv(deltaPct)} />
                <Kpi value={nf(eVis)} label="Pengunjung" info={`Pengunjung ${emaName}. Satu orang dihitung sekali per hari.\n${cmpAvg}`} delta={dv(avgDelta("visitors"))} />
                <Kpi value={nf(ePv)} label="Halaman dilihat" info={`Halaman ${emaName} yang dibuka.\n${cmpAvg}`} delta={dv(avgDelta("pageviews"))} />
                <Kpi
                  value={a.ctr !== null ? `${f1(a.ctr)}%` : "-"}
                  label="Rata-rata CTR"
                  info={"Persentase halaman dilihat di emahairshop.com yang berujung klik tautan go (klik ÷ halaman dilihat).\nPersen (%) = selisih poin dibanding periode sebelumnya."}
                  pill={ctrPill}
                />
              </>
            )}
          </div>

          {/* Tren */}
          <section className="an-card an-mb an-trend">
            <h2>
              {one ? "Hari ini dibanding kemarin" : src === "go" ? "Tren klik harian" : src === "ema" ? "Tren pengunjung harian" : "Tren harian"}
              {src === "semua" && !one && (
                <span className="an-lg">
                  <span>
                    <i className="g" />
                    {goName}
                  </span>
                  <span>
                    <i className="k" />
                    {emaName}
                  </span>
                </span>
              )}
            </h2>
            {trendTotal + prevTrend === 0 ? (
              <p className="an-empty-s">{one ? "Belum ada data hari ini." : `Belum ada data dalam ${days} hari terakhir.`}</p>
            ) : one ? (
              <div className="an-vs">
                {series.map((x) => {
                  const now = x.data[0]?.[1] ?? 0;
                  const mx = Math.max(1, now, x.prev);
                  return (
                    <div className="an-vs-g" key={x.unit}>
                      {src === "semua" && <div className="an-vs-n">{x.name}</div>}
                      <div className="an-vs-r">
                        <span>Kemarin</span>
                        <div className="an-track">
                          <div className="an-fill mute" style={{ width: `${(x.prev / mx) * 100}%` }} />
                        </div>
                        <b>{nf(x.prev)}</b>
                      </div>
                      <div className="an-vs-r">
                        <span>Hari ini</span>
                        <div className="an-track">
                          <div className="an-fill" style={{ width: `${(now / mx) * 100}%`, background: x.cls === "b" ? "var(--ink)" : "var(--an-acc)" }} />
                        </div>
                        <b>{nf(now)}</b>
                      </div>
                      <div className="an-vs-u">Satuan: {x.unit}</div>
                    </div>
                  );
                })}
                <p className="an-vs-note">Hari ini belum selesai (zona waktu WIB), jadi angkanya masih bertambah.</p>
              </div>
            ) : (
              <>
                <div className="an-plot" role="img" aria-label={`Grafik tren ${days} hari terakhir`}>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <line className="an-g" x1="0" y1="6" x2="100" y2="6" />
                    <line className="an-g" x1="0" y1="50" x2="100" y2="50" />
                    <line className="an-g base" x1="0" y1="94" x2="100" y2="94" />
                    {drawn.map((d) => (
                      <path key={`a${d.unit}`} className={`an-area ${d.cls}`} d={d.area} />
                    ))}
                    {drawn.map((d) => (
                      <path key={`l${d.unit}`} className={`an-ln ${d.cls}`} d={d.line} />
                    ))}
                  </svg>
                  <div className="an-hov">
                    {dayList.map((day, i) => {
                      const ys = drawn.map((d) => d.pts[i][1]);
                      return (
                        <div
                          key={day}
                          className={`an-hc${Math.min(...ys) < 35 ? " lo" : ""}`}
                          style={{ "--y": `${Math.min(...ys)}%`, left: `${px(i) - colW / 2}%`, width: `${colW}%` } as React.CSSProperties}
                        >
                          <i className="an-hl" />
                          <i className="an-hdot" />
                          <span className="an-tp">
                            <b>{dayLabel(day)}</b>
                            {drawn.map((d) => (
                              <span key={d.unit} className="an-tl">
                                {src === "semua" && <i className={d.cls === "b" ? "k" : "g"} />}
                                {nf(d.data[i][1])} {d.unit}
                              </span>
                            ))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="an-xl">
                  {tickIdx.map((i) => (
                    <span
                      key={dayList[i]}
                      style={{
                        left: `${px(i)}%`,
                        transform: i === 0 ? "none" : i === N - 1 ? "translateX(-100%)" : undefined,
                      }}
                    >
                      {dayLabel(dayList[i])}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Tautan teratas + perangkat + sumber (data go) */}
          <div className={`an-cols${showGo ? "" : " one"}`}>
              {showGo && (
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
              )}

              <div className={`an-stack${showGo ? "" : " row"}`}>
                <section className="an-card">
                  <h2>
                    Perangkat <small>{ctryNote}</small>
                  </h2>
                  {devices.length === 0 ? (
                    <p className="an-empty-s">Belum ada data.</p>
                  ) : (
                    <div className="an-bars">
                      {devices.map((r) => (
                        <div className="an-bar" key={r.key}>
                          <span className="an-src-l" title={r.label}>
                            <DeviceIcon name={r.label} rest={r.rest} />
                            <span>{r.label}</span>
                          </span>
                          <div className="an-track">
                            <div className="an-fill" style={{ width: `${pct(r.v, devSum)}%`, background: "var(--an-acc)" }} />
                          </div>
                          <span className="an-pct">{pct(r.v, devSum)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="an-card">
                  <h2>
                    Sumber trafik <small>{ctryNote}</small>
                  </h2>
                  {refs.length === 0 ? (
                    <p className="an-empty-s">Belum ada data.</p>
                  ) : (
                    <RefList
                      top={refs
                        .filter((r) => !r.rest)
                        .map((r) => refRow(r.key, r.label, r.v))}
                      more={
                        refs.some((r) => r.rest)
                          ? refGroups.slice(4).map(([k, v]) => refRow(k, k, v))
                          : undefined
                      }
                      rest={(() => {
                        const r = refs.find((x) => x.rest);
                        return r ? refCells(r.label, r.v, true) : undefined;
                      })()}
                    />
                  )}
                </section>
              </div>
          </div>

          {/* Negara */}
          <section className="an-card">
            <h2>
              Sebaran negara <small>{ctryNote}</small>
            </h2>
            {countries.length === 0 ? (
              <p className="an-empty-s">Belum ada data.</p>
            ) : (
              <CountryList
                top={countries
                  .filter((r) => !r.rest)
                  .map((r) => (
                    <div className="an-ci" key={r.key}>
                      <Flag code={r.key} />
                      <span className="an-cn">{r.label}</span>
                      <span className="an-pct">{pct(r.v, ctrySum)}%</span>
                    </div>
                  ))}
                more={
                  countries.some((r) => r.rest)
                    ? countryRows.slice(4).map(([code, v]) => (
                        <div className="an-ci" key={code}>
                          <Flag code={code} />
                          <span className="an-cn">{countryName(code)}</span>
                          <span className="an-pct">{pct(v, ctrySum)}%</span>
                        </div>
                      ))
                    : undefined
                }
                restPct={pct(countries.find((r) => r.rest)?.v ?? 0, ctrySum)}
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}
