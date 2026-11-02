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
      <style>{`
        .tk-panel h2 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
        .tk-panel h2 small { font-weight: 400; }
        .tk-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
        .tk-meta .tk-k { opacity: 0.6; }
        .tk-meta .tk-sep { width: 1px; height: 12px; background: currentColor; opacity: 0.2; }
      `}</style>
      <div className="top">
        <div>
          <h1>Token</h1>
          <div className="an-sub">Token Gemini dan koneksi Redis bot WhatsApp &amp; Telegram</div>
        </div>
      </div>

      <div className="panel tk-panel">
        <h2>
          <span className="cn">
            <RefIcon name="Gemini" />
            Gemini
          </span>{" "}
          <small>{AI_MODEL}</small>
        </h2>
        <p className="tk-state tk-meta">
          {key ? (
            <>
              <span className="tk-k">Token tersimpan</span>
              <code>{maskKey(key)}</code>
            </>
          ) : (
            "Belum ada token."
          )}
        </p>
        <TokenForm masked={key ? maskKey(key) : null} />
      </div>

      <div className="panel tk-panel">
        <h2>
          <span className="cn">
            <RefIcon name="Telegram" />
            Telegram
          </span>{" "}
          <small>laporan mingguan, Senin 08.00 WIB</small>
        </h2>
        <p className="tk-state tk-meta">
          {tg ? (
            <>
              <span className="tk-k">Bot</span>
              <code>{maskBotToken(tg.token)}</code>
              <span className="tk-sep" aria-hidden="true" />
              <span className="tk-k">Chat</span>
              {tg.chat ? <code>{tg.chat}</code> : <span>belum tersambung</span>}
            </>
          ) : (
            "Belum diatur."
          )}
        </p>
        <TelegramForm masked={tg ? maskBotToken(tg.token) : null} chat={tg?.chat || null} />
      </div>

      {remotes.map((r) => (
        <div className="panel tk-panel" key={r.id}>
          <h2>
            <span className="cn">
              <RefIcon name={r.name} />
              Redis {r.name}
            </span>{" "}
            <small>untuk halaman Percakapan</small>
          </h2>
          <p className="tk-state tk-meta">
            {r.cfg ? (
              <>
                <span className="tk-k">Tersambung</span>
                <code>{hostOf(r.cfg.url)}</code>
                <span className="tk-sep" aria-hidden="true" />
                <span className="tk-k">Token</span>
                <code>{maskToken(r.cfg.token)}</code>
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
