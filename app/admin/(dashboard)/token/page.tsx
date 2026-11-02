import { requireAdmin } from "@/lib/auth";
import { AI_MODEL, getKey, maskKey } from "@/lib/ai";
import { SOURCES, getCfg, maskToken } from "@/lib/remote";
import { TokenForm } from "./token-form";
import { RemoteForm } from "./remote-form";
import { RefIcon } from "@/lib/sumber-icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Token" };

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return u;
  }
}

export default async function TokenPage() {
  await requireAdmin();
  const key = await getKey();
  const remotes = await Promise.all(SOURCES.map(async (s) => ({ ...s, cfg: await getCfg(s.id) })));

  return (
    <main className="wrap">
      <div className="top">
        <div>
          <h1>Token</h1>
          <div className="an-sub">Token Gemini dan koneksi Redis bot WhatsApp &amp; Telegram</div>
        </div>
      </div>

      <div className="panel">
        <h2>
          Gemini <small>{AI_MODEL}</small>
        </h2>
        <p className="tk-state">
          {key ? (
            <>
              Token tersimpan: <code>{maskKey(key)}</code>
            </>
          ) : (
            "Belum ada token."
          )}
        </p>
        <TokenForm masked={key ? maskKey(key) : null} />
        <p className="tk-help">
          Token disimpan di database dan hanya dipakai di server. Di layar hanya tampil sebagian, dan token yang sudah
          tersimpan tidak dikirim balik ke browser. Tombol Tampilkan hanya berlaku untuk teks yang sedang kamu ketik.
          Tes kunci memakai token yang diketik, atau token tersimpan kalau kolomnya kosong. AI hanya dipanggil saat
          tombol saran ditekan.
        </p>
      </div>

      {remotes.map((r) => (
        <div className="panel" key={r.id}>
          <h2>
            <span className="cn">
              <RefIcon name={r.name} />
              Redis {r.name}
            </span>{" "}
            <small>untuk halaman Percakapan</small>
          </h2>
          <p className="tk-state">
            {r.cfg ? (
              <>
                Tersambung: <code>{hostOf(r.cfg.url)}</code> · token <code>{maskToken(r.cfg.token)}</code>
              </>
            ) : (
              "Belum tersambung."
            )}
          </p>
          <RemoteForm src={r.id} name={r.name} connected={!!r.cfg} />
        </div>
      ))}
      <p className="tk-help">
        Isi REST URL dan REST Token dari database Upstash milik project bot (tab REST API di Upstash). Pakai
        token biasa kalau mau bisa menghapus percakapan dari halaman Percakapan, atau <b>read-only token</b> kalau hanya
        untuk melihat (tombol hapus akan ditolak). Saat disimpan, koneksi dites dulu.
      </p>
    </main>
  );
}
