import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { hasKey, listHistory } from "@/lib/ai";
import { countryName, formatTime } from "@/lib/format";
import { Flag } from "@/lib/flag";
import { clearAiHistory, deleteAiEntry } from "../../actions";
import { ActionForm } from "../forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI" };

export default async function AiPage() {
  await requireAdmin();
  const [list, ready] = await Promise.all([listHistory(), hasKey()]);

  return (
    <main className="wrap">
      <div className="top">
        <div>
          <h1>AI</h1>
          <div className="an-sub">Riwayat saran AI, maksimal 100 terakhir</div>
        </div>
        {list.length > 0 && (
          <ActionForm
            action={clearAiHistory}
            confirm="Hapus semua riwayat saran AI?"
            btnClass="danger"
            label="Hapus semua"
          />
        )}
      </div>

      {!ready && (
        <p className="tx-note">
          Token AI belum diisi. <Link href="/admin/token">Isi di halaman Token</Link>, lalu minta saran dari halaman
          Tindakan.
        </p>
      )}

      {list.length === 0 ? (
        <div className="an-empty">Belum ada saran. Tekan Minta saran AI di kartu Peluang pada halaman Tindakan.</div>
      ) : (
        <div className="tx-list">
          {list.map((e) => (
            <div key={e.id} className="tx-card has-ai">
              <div className="tx-body">
                <h3 className="ai-h">
                  {e.country ? (
                    <>
                      <Flag code={e.country} /> {e.ref} di {countryName(e.country)}
                    </>
                  ) : (
                    e.title
                  )}
                </h3>
                {e.hashtags.length > 0 && (
                  <div className="ai-tags">
                    {e.hashtags.map((h) => (
                      <span key={h} className="ai-tag">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
                {e.saran && <p className="ai-saran">{e.saran}</p>}
                {e.langkah?.length > 0 && (
                  <ol className="ai-steps">
                    {e.langkah.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ol>
                )}
                <p className="ai-meta">
                  {formatTime(e.t)} · {e.model}
                </p>
              </div>
              <div className="tx-btns">
                <ActionForm action={deleteAiEntry} btnClass="danger" label="Hapus" confirm="Hapus entri ini?">
                  <input type="hidden" name="id" value={e.id} />
                </ActionForm>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
