import { requireAdmin } from "@/lib/auth";
import { AI_MODEL, getKey, maskKey } from "@/lib/ai";
import { SOURCES, getCfg, maskToken } from "@/lib/remote";
import { TokenForm } from "./token-form";
import { RemoteForm } from "./remote-form";
import { TelegramForm } from "./telegram-form";
import { getBotInfo, getChatLabel, getPair, getTg, maskBotToken, type BotInfo, type TgCfg } from "@/lib/telegram";
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

/** Info bot Telegram, satu baris per hal: username bot, token (disamarkan), dan akun Telegram yang tersambung. */
function TgInfo({ cfg, info, chatLabel }: { cfg: TgCfg | null; info: BotInfo | null; chatLabel: string | null }) {
  if (!cfg) return <p className="tk-state">Belum diatur.</p>;
  return (
    <dl className="tk-list">
      <dt>Username</dt>
      <dd>{info ? <strong>@{info.username}</strong> : <span className="tk-dim">tidak terbaca</span>}</dd>
      <dt>Token</dt>
      <dd><code>{maskBotToken(cfg.token)}</code></dd>
      <dt>Chat</dt>
      <dd>{cfg.chat ? <strong>{chatLabel ?? cfg.chat}</strong> : <span className="tk-dim">belum tersambung</span>}</dd>
    </dl>
  );
}

export default async function TokenPage() {
  await requireAdmin();
  const key = await getKey();
  const tg = await getTg();
  const pair = tg && !tg.chat ? await getPair().catch(() => null) : null;
  const tgv = await getTg("visit");
  const [tgInfo, tgvInfo, tgChat, tgvChat] = await Promise.all([
    tg ? getBotInfo(tg.token) : null,
    tgv ? getBotInfo(tgv.token) : null,
    tg?.chat ? getChatLabel(tg.token, tg.chat) : null,
    tgv?.chat ? getChatLabel(tgv.token, tgv.chat) : null,
  ]);
  const pairv = tgv && !tgv.chat ? await getPair("visit").catch(() => null) : null;
  const remotes = await Promise.all(SOURCES.map(async (s) => ({ ...s, cfg: await getCfg(s.id) })));

  return (
    <main className="wrap">
      <style>{`
        .tk-panel h2 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
        .tk-panel h2 small { font-weight: 400; }
        .tk-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
        .tk-meta .tk-k { opacity: 0.6; }
        .tk-meta .tk-sep { width: 1px; height: 12px; background: currentColor; opacity: 0.2; }

        .tk-list { display: grid; grid-template-columns: max-content 1fr; gap: 10px 20px; align-items: center; margin: 12px 0 16px; font-size: 14px; }
        .tk-list dt { margin: 0; opacity: 0.6; }
        .tk-list dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
        .tk-list dd code { color: var(--ink); background: var(--hover); padding: 2px 8px; border-radius: 6px; }
        .tk-list .tk-dim { opacity: 0.55; }

        /* Desktop: tombol aksi (Edit, Kirim tes, dst) pindah ke kanan atas kartu. HP tetap di bawah. */
        @media (min-width: 720px) {
          .wrap .tk-panel { position: relative; }
          .wrap .tk-panel .tk-btns.tk-top { position: absolute; top: 15px; right: 20px; margin: 0; justify-content: flex-end; }
          .wrap .tk-panel h2 { padding-right: 280px; }
        }

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
        .wrap .tk-panel button.tk-icon { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 38px; height: 38px; min-height: 38px; padding: 0; border-radius: 10px; }
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
        <TgInfo cfg={tg} info={tgInfo} chatLabel={tgChat} />
        <TelegramForm masked={tg ? maskBotToken(tg.token) : null} chat={tg?.chat || null} pair={pair} />
      </div>

      <div className="panel tk-panel">
        <h2>
          <span className="cn">
            <RefIcon name="Telegram" />
            Telegram
          </span>{" "}
          <small>notifikasi kunjungan harian</small>
        </h2>
        <TgInfo cfg={tgv} info={tgvInfo} chatLabel={tgvChat} />
        <TelegramForm kind="visit" masked={tgv ? maskBotToken(tgv.token) : null} chat={tgv?.chat || null} pair={pairv} />
      </div>

      {remotes.map((r) => (
        <div className="panel tk-panel" key={r.id}>
          <h2>
            <span className="cn">
              <RefIcon name={r.name} />
              Chat {r.name}
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
    </main>
  );
}
