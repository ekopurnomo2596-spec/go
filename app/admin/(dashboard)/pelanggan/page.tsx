import { requireAdmin } from "@/lib/auth";
import { countryName } from "@/lib/format";
import { Flag } from "@/lib/flag";
import { RefIcon } from "@/lib/sumber-icon";
import { STATUS, listPelanggan, waDigits, type Pelanggan } from "@/lib/pelanggan";
import { PelangganDialog } from "./pelanggan-form";
import { PelangganFilters } from "./pelanggan-filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pelanggan" };

// Email dan telepon: ikon bergaris. WhatsApp dan Instagram: logo merek dari RefIcon.
const OUT = {
  Email: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6",
  Telepon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
};

function Ic({ n }: { n: "Email" | "Telepon" | "WhatsApp" | "Instagram" }) {
  return (
    <span className="pl-ic" role="img" aria-label={n} title={n}>
      {n === "Email" || n === "Telepon" ? (
        <svg className="ref-ico ref-ico-s" viewBox="0 0 24 24" aria-hidden="true">
          <path d={OUT[n]} />
        </svg>
      ) : (
        <RefIcon name={n} />
      )}
    </span>
  );
}

function matches(p: Pelanggan, q: string): boolean {
  if (!q) return true;
  const hay = [p.nama, p.email, p.wa, p.hp, p.ig, p.catatan, p.negara ? countryName(p.negara) : ""].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((w) => hay.includes(w));
}

export default async function PelangganPage({ searchParams }: { searchParams: Promise<{ q?: string; s?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const s = STATUS.some((x) => x.id === sp.s) ? sp.s : "";

  let all: Pelanggan[] = [];
  let error = "";
  try {
    all = await listPelanggan();
  } catch {
    error = "Gagal membaca data pelanggan.";
  }
  const rows = all.filter((p) => (!s || p.status === s) && matches(p, q));
  const statusName = (id: string) => STATUS.find((x) => x.id === id)?.name ?? id;

  return (
    <main className="wrap">
      <style>{`
        .pl-search { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .pl-search input, .pl-search select { padding: 9px 12px; font: inherit; font-size: 14px; background: var(--bg); color: var(--ink); border: 1px solid var(--line); border-radius: 10px; }
        .pl-search input { flex: 1 1 200px; min-width: 0; }
        .pl-search input:focus, .pl-search select:focus { outline: none; border-color: var(--gold); }
        .pl-search input:focus-visible, .pl-search select:focus-visible { outline: none; box-shadow: 0 0 0 4px var(--glow); }
        .pl-lbl { display: none; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin-bottom: 4px; }
        .pl-ct { display: grid; gap: 6px; font-size: 13px; }
        .pl-ct span { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .pl-ic { display: inline-flex; flex: none; }
        .pl-ct a { color: inherit; text-decoration: none; overflow-wrap: anywhere; }
        .pl-ct a:hover { text-decoration: underline; }
        .pl-nm { font-weight: 600; }
        .pl-sm { color: var(--muted); font-size: 12.5px; margin-top: 2px; }
        .pl-country { display: flex; align-items: center; gap: 6px; }
        .pl-country .flag { flex: none; display: block; }
        .pl-note { color: var(--muted); font-size: 12.5px; margin-top: 6px; white-space: pre-wrap; overflow-wrap: anywhere; max-width: 46ch; }
        .pl-st { display: inline-block; padding: 3px 9px; border-radius: 99px; border: 1px solid var(--line); font-size: 12px; white-space: nowrap; }
        .pl-st.pembeli, .pl-st.langganan { border-color: #22c55e; color: #1f8a4c; }
        .pl-ac { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .pl-ac .btn, .pl-ac button { padding: 7px 12px; font-size: 13px; }

        /* Mobile: ubah tabel jadi kartu bertumpuk supaya tidak sempit dan teks tidak pecah per-huruf. */
        @media (max-width: 640px) {
          .pelanggan-table, .pelanggan-table tbody { display: block; width: 100%; }
          .pelanggan-table thead { display: none; }
          .pelanggan-table tr { display: block; padding: 14px 0; border-bottom: 1px solid var(--line); }
          .pelanggan-table tbody tr:last-child { border-bottom: 0; }
          .pelanggan-table td { display: block; padding: 0; border: 0; }
          .pelanggan-table td + td { margin-top: 10px; }
          .pelanggan-table .pl-ac { justify-content: stretch; }
          .pelanggan-table .pl-ac .editbtn { flex: 1; text-align: center; }
          .pl-lbl { display: block; }
        }
      `}</style>

      <div className="top">
        <div>
          <h1>Pelanggan</h1>
          <div className="an-sub">Catatan kontak pelanggan dan calon pelanggan</div>
        </div>
        <PelangganDialog />
      </div>

      <section className="panel">
        <h2>
          Daftar pelanggan <small>{rows.length === all.length ? `${all.length} orang` : `${rows.length} dari ${all.length} orang`}</small>
        </h2>

        <PelangganFilters initialQ={q} initialS={s ?? ""} />

        {error ? (
          <p className="empty">{error}</p>
        ) : rows.length === 0 ? (
          <p className="empty">{all.length === 0 ? 'Belum ada pelanggan. Klik "Tambah data pelanggan" untuk mulai.' : "Tidak ada yang cocok dengan pencarian."}</p>
        ) : (
          <div className="tablewrap">
            <table className="pelanggan-table">
              <thead>
                <tr>
                  <th>Pelanggan</th>
                  <th>Kontak</th>
                  <th>Status</th>
                  <th aria-label="Aksi" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const wd = p.wa ? waDigits(p.wa, p.negara) : "";
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="pl-nm">{p.nama}</div>
                        {p.negara && (
                          <div className="pl-sm pl-country">
                            <Flag code={p.negara} />
                            <span>{countryName(p.negara)}</span>
                          </div>
                        )}
                        {p.catatan && <div className="pl-note">{p.catatan}</div>}
                      </td>
                      <td>
                        <div className="pl-lbl">Kontak</div>
                        <div className="pl-ct">
                          {p.email && (
                            <span>
                              <Ic n="Email" />
                              <a href={`mailto:${p.email}`}>{p.email}</a>
                            </span>
                          )}
                          {p.wa && (
                            <span>
                              <Ic n="WhatsApp" />
                              {wd ? (
                                <a href={`https://wa.me/${wd}`} target="_blank" rel="noopener noreferrer">
                                  {p.wa}
                                </a>
                              ) : (
                                p.wa
                              )}
                            </span>
                          )}
                          {p.hp && (
                            <span>
                              <Ic n="Telepon" />
                              <a href={`tel:${p.hp.replace(/[^\d+]/g, "")}`}>{p.hp}</a>
                            </span>
                          )}
                          {p.ig && (
                            <span>
                              <Ic n="Instagram" />
                              <a href={`https://instagram.com/${p.ig}`} target="_blank" rel="noopener noreferrer">
                                @{p.ig}
                              </a>
                            </span>
                          )}
                          {!p.email && !p.wa && !p.hp && !p.ig && <span className="pl-sm">Belum ada kontak</span>}
                        </div>
                      </td>
                      <td>
                        <div className="pl-lbl">Status</div>
                        <span className={"pl-st " + p.status}>{statusName(p.status)}</span>
                      </td>
                      <td>
                        <div className="pl-ac">
                          <PelangganDialog initial={p} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
