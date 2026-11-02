import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLink, getStats, validSlugFormat } from "@/lib/links";
import { removeStatsAction, resetStats } from "../../../actions";
import { ActionForm } from "../../forms";
import { countryName, formatTime } from "@/lib/format";
import { Flag } from "@/lib/flag";
import { Info } from "../../info";
import { labelDevice, labelRef } from "@/lib/sumber";
import { DeviceIcon, RefIcon } from "@/lib/sumber-icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Statistik" };

function X({ slug, mode, value, label }: { slug: string; mode: string; value: string; label: string }) {
  return (
    <ActionForm
      action={removeStatsAction}
      formClass="xf"
      btnClass="xbtn"
      title="Hapus"
      confirm={`Hapus data ${label}? Angka total ikut berkurang.`}
      label={
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6" />
        </svg>
      }
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="value" value={value} />
    </ActionForm>
  );
}

function tally(items: string[], label: (k: string) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const i of items) {
    const k = label(i?.trim() ?? "");
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function Dist({
  title,
  rows,
  total,
  kind,
  info,
}: {
  title: string;
  rows: [string, number][];
  total: number;
  kind: "ref" | "dev";
  info?: string;
}) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <section className="panel">
      <h2>
        {title} <small>dari {total} klik terbaru</small>
        {info && <Info text={info} />}
      </h2>
      {rows.length === 0 ? (
        <p className="empty">Belum ada data.</p>
      ) : (
        <div className="rbars">
          {rows.map(([k, n]) => (
            <div className="rbar mini" key={k}>
              <span className="cn" title={k}>
                {kind === "ref" ? <RefIcon name={k} /> : <DeviceIcon name={k} />}
                {k}
              </span>
              <div className="track">
                <div className="fill" style={{ width: `${(n / max) * 100}%` }} />
              </div>
              <span className="v">{n.toLocaleString("id-ID")}</span>
              <span className="pct">{total > 0 ? Math.round((n / total) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function StatsPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  if (!validSlugFormat(slug)) notFound();
  const link = await getLink(slug);
  if (!link) notFound();

  const stats = await getStats(slug);
  const maxCountry = Math.max(1, ...stats.countries.map(([, n]) => n));
  const maxDay = Math.max(1, ...stats.daily.map(([, n]) => n));
  const last14 = stats.daily.reduce((a, [, n]) => a + n, 0);

  return (
    <main className="wrap">
      <Link className="back" href="/admin/statistik">&larr; Semua statistik</Link>
      <div className="top">
        <h1>
          /{link.slug}
          {link.title && link.title !== link.slug && <small>{link.title}</small>}
        </h1>
        <details className="hapusmenu">
          <summary>Hapus data</summary>
          <div className="pop">
            <ActionForm
              action={removeStatsAction}
              btnClass="danger"
              confirm="Hapus data klik pada rentang tanggal ini?"
              label="Hapus rentang"
            >
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
            </ActionForm>
            <ActionForm
              action={resetStats}
              btnClass="danger"
              confirm={`Hapus SEMUA data statistik /${link.slug}? Link tetap ada.`}
              label="Hapus semua data"
            >
              <input type="hidden" name="slug" value={link.slug} />
            </ActionForm>
            <p className="hint">Ikon tong sampah di setiap baris menghapus per negara, per hari, atau per klik.</p>
          </div>
        </details>
      </div>

      <p className="sum">
        Tujuan:{" "}
        <a className="destlink" href={link.url} target="_blank" rel="noopener noreferrer">
          {link.url}
        </a>
      </p>

      <div className="stats">
        <div className="stat">
          <b>{stats.total.toLocaleString("id-ID")}</b>
          <span>Total klik</span>
        </div>
        <div className="stat">
          <b>{(stats.daily[stats.daily.length - 1]?.[1] ?? 0).toLocaleString("id-ID")}</b>
          <span>Hari ini</span>
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

      <section className="panel">
        <h2>Klik per hari (WIB)</h2>
        <div className="dchart">
          {stats.daily.map(([day, n]) => (
            <div className="dcol" key={day} title={`${day}: ${n.toLocaleString("id-ID")} klik`}>
              <span className="dn">{n > 0 ? n.toLocaleString("id-ID") : ""}</span>
              <div className="dbar">
                <div className={`dfill${n === 0 ? " nol" : ""}`} style={{ height: n > 0 ? `${(n / maxDay) * 100}%` : undefined }} />
              </div>
              <span className="dl">{day.slice(8)}/{day.slice(5, 7)}</span>
              {n > 0 ? <X slug={link.slug} mode="day" value={day} label={`tanggal ${day}`} /> : <span className="xs" />}
            </div>
          ))}
        </div>
      </section>

      <div className="cols">
        <Dist
          title="Sumber trafik"
          rows={tally(stats.recent.map((c) => c.r), labelRef)}
          total={stats.recent.length}
          kind="ref"
          info="Dihitung dari maksimal 50 klik terbaru, bukan hanya hari ini dan bukan total semua klik. Sumber adalah situs asal pengunjung. EMAHAIRSHOP berarti klik dari tombol di website utama. Tulisan “Langsung” berarti asalnya tidak terdeteksi, misalnya link diketik atau dibuka dari aplikasi seperti WhatsApp dan Telegram."
        />
        <Dist title="Perangkat" rows={tally(stats.recent.map((c) => c.d), labelDevice)} total={stats.recent.length} kind="dev" />
      </div>

      <section className="panel">
        <h2>
          Negara <small>sepanjang waktu</small>
        </h2>
        {stats.countries.length === 0 ? (
          <p className="empty">Belum ada klik.</p>
        ) : (
          <div className="rbars">
            {stats.countries.map(([code, n]) => (
              <div className="rbar" key={code}>
                <span className="cn">
                  <Flag code={code} />
                  {countryName(code)}
                </span>
                <div className="track">
                  <div className="fill" style={{ width: `${(n / maxCountry) * 100}%` }} />
                </div>
                <span className="v">{n.toLocaleString("id-ID")}</span>
                <span className="pct">{stats.total > 0 ? Math.round((n / stats.total) * 100) : 0}%</span>
                <X slug={link.slug} mode="country" value={code} label={countryName(code)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Klik terbaru</h2>
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
                    <td>
                      <span className="cn">
                        <RefIcon name={labelRef(c.r)} />
                        {labelRef(c.r)}
                      </span>
                    </td>
                    <td>
                      <span className="cn">
                        <DeviceIcon name={labelDevice(c.d)} />
                        {labelDevice(c.d)}
                      </span>
                    </td>
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
