import { requireAdmin } from "@/lib/auth";
import { AI_MODEL, getKey, maskKey } from "@/lib/ai";
import { SOURCES, getCfg, maskToken } from "@/lib/remote";
import { TokenForm } from "./token-form";
import { RemoteForm } from "./remote-form";
import { TelegramForm } from "./telegram-form";
import { getTg, maskBotToken } from "@/lib/telegram";
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
  const tg = await getTg();
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
          <span className="cn">
            <RefIcon name="Gemini" />
            Gemini
          </span>{" "}
          <small>{AI_MODEL}</small>
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

      <div className="panel">
        <h2>
          <span className="cn">
            <RefIcon name="Telegram" />
            Telegram
          </span>{" "}
          <small>laporan mingguan, Senin 08.00 WIB</small>
        </h2>
        <p className="tk-state">
          {tg ? (
            <>
              Bot: <code>{maskBotToken(tg.token)}</code> ·{" "}
              {tg.chat ? (
                <>
                  chat <code>{tg.chat}</code>
                </>
              ) : (
                "chat belum tersambung"
              )}
            </>
          ) : (
            "Belum diatur."
          )}
        </p>
        <TelegramForm masked={tg ? maskBotToken(tg.token) : null} chat={tg?.chat || null} />
        <p className="tk-help">
          Buat bot lewat @BotFather, simpan tokennya, lalu tekan Sambungkan: buka tautannya, tekan Start, dan tekan Cek.
          Chat ID tersimpan otomatis. Pakai bot khusus laporan (bukan bot yang sudah dipakai project lain dengan webhook).
          Token disimpan di database dan tidak dikirim balik ke browser. Laporan otomatis butuh <code>CRON_SECRET</code>{" "}
          di Vercel.
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
