import { DeviceIcon, RefIcon } from "@/lib/sumber-icon";
import { RefList } from "./analisa/ref-list";

const n = (v: number) => v.toLocaleString("id-ID");
const MAX = 6;

/** Kartu sebaran (sumber trafik / perangkat) untuk Dashboard; baris "Lainnya" bisa diklik untuk menampilkan sisanya. */
export function WebBars({
  title,
  rows,
  kind,
}: {
  title: string;
  rows: [string, number][];
  kind: "ref" | "dev";
}) {
  const total = rows.reduce((a, [, v]) => a + v, 0);
  const max = Math.max(1, ...rows.map(([, v]) => v));
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const icon = (label: string, rest = false) =>
    kind === "ref" ? <RefIcon name={label} rest={rest} /> : <DeviceIcon name={label} rest={rest} />;

  const cells = (label: string, v: number, rest = false) => (
    <>
      <span className="cn" title={label}>
        {icon(label, rest)}
        {label}
      </span>
      <div className="track">
        <div className="fill" style={{ width: `${(v / max) * 100}%` }} />
      </div>
      <span className="v">{n(v)}</span>
      <span className="pct">{pct(v)}%</span>
    </>
  );
  const row = ([k, v]: [string, number]) => (
    <div className="rbar mini" key={k}>
      {cells(k, v)}
    </div>
  );

  const hasRest = rows.length > MAX + 1;
  const head = hasRest ? rows.slice(0, MAX) : rows;
  const tail = hasRest ? rows.slice(MAX) : [];
  const restSum = tail.reduce((a, [, v]) => a + v, 0);

  return (
    <section className="panel">
      <h2>
        {title} <small>14 hari</small>
      </h2>
      {rows.length === 0 ? (
        <p className="empty">Belum ada data.</p>
      ) : (
        <RefList
          barsClass="rbars"
          rowClass="rbar mini"
          top={head.map(row)}
          more={hasRest ? tail.map(row) : undefined}
          rest={hasRest ? cells("Lainnya", restSum, true) : undefined}
        />
      )}
    </section>
  );
}
