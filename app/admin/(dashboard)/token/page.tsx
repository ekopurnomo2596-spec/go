import { requireAdmin } from "@/lib/auth";
import { AI_MODEL, getKey, maskKey } from "@/lib/ai";
import { SOURCES, getCfg, maskToken } from "@/lib/remote";
import { TokenForm } from "./token-form";
import { RemoteForm } from "./remote-form";
import { TelegramForm } from "./telegram-form";
import { getPair, getTg, maskBotToken } from "@/lib/telegram";
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
  const pair = tg && !tg.chat ? await getPair().catch(() => null) : null;
  const remotes = await Promise.all(SOURCES.map(async (s) => ({ ...s, cfg: await getCfg(s.id) })));

  return (
    <main className="wrap">
      <style>{`
        .tk-panel h2 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
        .tk-panel h2 small { font-weight: 400; }
        .tk-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
        .tk-meta .tk-k { opacity: 0.6; }
        .tk-meta .tk-sep { width: 1px; height: 12px; background: currentColor; opacity: 0.2; }

        .wrap .tk-panel .tk-btns { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .wrap .tk-panel button,
        .wrap .tk-panel a.btn {
          min-height: 32px; padding: 0 12px; font-size: 13px; font-weight: 500; line-height: 1.2;
          border-radius: 8px; box-shadow: none;
        }
        .wrap .tk-panel a.btn { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
        .wrap .tk-panel button:not(.ghost):not(.danger) { background: #3b6ef0; border: 1px solid #3b6ef0; color: #fff; }
        .wrap .tk-panel button:not(.ghost):not(.danger):hover:not(:disabled) { background: #2f5fd8; border-color: #2f5fd8; }
        .wrap .tk-panel .ghost { background: #fff; border: 1px solid #e0e0e0; color: #333; }
        .wrap .tk-panel .ghost:hover:not(:disabled) { background: #f6f6f6; }
        .wrap .tk-panel .danger { background: #fff; border: 1px solid #efc4c4; color: #c93636; }
        .wrap .tk-panel .danger:hover:not(:disabled) { background: #fff5f5; }
        .wrap .tk-panel button:disabled { opacity: 0.55; cursor: not-allowed; }

        .wrap .tk-panel .tk-form { display: flex; flex-direction: column; gap: 14px; }
        .wrap .tk-panel .tk-field { display: flex; flex-direction: column; gap: 6px; }
        .wrap .tk-panel .tk-field label { font-size: 13px; font-weight: 500; margin: 0; }
        .wrap .tk-panel .tk-hint { font-size: 12px; opacity: 0.6; margin: 0; }
        .wrap .tk-panel .tk-row { display: flex; gap: 8px; align-items: stretch; }
        .wrap .tk-panel .tk-row input { flex: 1; min-width: 0; }
        .wrap .tk-panel .tk-form input {
          box-sizing: border-box; width: 100%; height: 36px; padding: 0 12px; font: inherit; font-size: 14px;
          background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; outline: none;
        }
        .wrap .tk-panel .tk-code { display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid #e0e0e0; border-radius: 10px; background: #fafafa; }
        .wrap .tk-panel .tk-code p { margin: 0; font-size: 13px; }
        .wrap .tk-panel .tk-code code.tk-big { align-self: flex-start; font-size: 20px; font-weight: 600; letter-spacing: 0.12em; padding: 6px 12px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; user-select: all; }
        .wrap .tk-panel .tk-form input::placeholder { color: #9a9a9a; }
        .wrap .tk-panel .tk-form input:focus { border-color: #3b6ef0; box-shadow: 0 0 0 3px rgba(59, 110, 240, 0.15); }
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
        <TelegramForm masked={tg ? maskBotToken(tg.token) : null} chat={tg?.chat || null} pair={pair} />
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
