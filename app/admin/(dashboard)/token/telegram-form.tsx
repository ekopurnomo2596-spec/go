"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { deleteTelegram, finishTelegramPair, saveTelegram, sendReportNow, startTelegramPair } from "../../actions";

async function run<T extends Flash>(fn: () => Promise<T>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function TelegramForm({ masked, chat }: { masked: string | null; chat: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [show, setShow] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [sending, startSend] = useTransition();
  const [removing, startRemove] = useTransition();
  const [pairing, startPair] = useTransition();
  const [checking, startCheck] = useTransition();
  const busy = saving || sending || removing || pairing || checking;
  const connected = !!masked;
  const [editing, setEditing] = useState(!connected);
  useEffect(() => {
    if (!connected) setEditing(true);
  }, [connected]);

  const spin = <span className="spin" aria-hidden="true" />;

  const pairBlock = connected && (
    <div className="tk-btns">
      {link ? (
        <>
          <a className="ghost" href={link} target="_blank" rel="noopener noreferrer">
            Buka bot &amp; Start
          </a>
          <button
            type="button"
            className={checking ? "is-loading" : ""}
            disabled={busy}
            aria-busy={checking}
            onClick={() =>
              startCheck(async () => {
                const r = await run(() => finishTelegramPair());
                flash(r);
                if (r.kind === "ok") setLink(null);
              })
            }
          >
            Cek
            {checking && spin}
          </button>
        </>
      ) : (
        <button
          type="button"
          className={"ghost" + (pairing ? " is-loading" : "")}
          disabled={busy}
          aria-busy={pairing}
          onClick={() =>
            startPair(async () => {
              const r = await startTelegramPair().catch(() => null);
              if (!r) return flash({ kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." });
              flash(r);
              if (r.kind === "ok" && r.link) setLink(r.link);
            })
          }
        >
          {chat ? "Ganti chat (Sambungkan)" : "Sambungkan"}
          {pairing && spin}
        </button>
      )}
    </div>
  );

  const sendBtn = chat ? (
    <button
      type="button"
      className={sending ? "is-loading" : ""}
      disabled={busy}
      aria-busy={sending}
      onClick={() => startSend(async () => flash(await run(() => sendReportNow())))}
    >
      Kirim laporan sekarang
      {sending && spin}
    </button>
  ) : null;

  if (connected && !editing) {
    return (
      <>
        <div className="tk-btns">
          {sendBtn}
          <button type="button" className="ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
        {pairBlock}
      </>
    );
  }

  return (
    <form
      ref={formRef}
      className="tk-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        const form = e.currentTarget;
        const fd = new FormData(form);
        startSave(async () => {
          const r = await run(() => saveTelegram(fd));
          flash(r);
          if (r.kind === "ok") {
            form.reset();
            setShow(false);
            setEditing(false);
          }
        });
      }}
    >
      <label htmlFor="tg-token">{connected ? "Ganti token bot (kosongkan kalau tidak berubah)" : "Token bot"}</label>
      <div className="tk-row">
        <input
          id="tg-token"
          name="token"
          type={show ? "text" : "password"}
          placeholder={connected ? "Tempel token baru" : "123456789:AA… dari BotFather"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={200}
        />
        <button type="button" className="ghost" onClick={() => setShow((v) => !v)} aria-pressed={show}>
          {show ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>
      <label htmlFor="tg-chat">Chat ID (opsional, kosongkan lalu pakai Sambungkan)</label>
      <input
        id="tg-chat"
        name="chat"
        defaultValue={chat ?? ""}
        placeholder="123456789 atau -100… atau @namakanal"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={40}
      />
      <div className="tk-btns">
        <button type="submit" className={saving ? "is-loading" : ""} disabled={busy} aria-busy={saving}>
          Simpan
          {saving && spin}
        </button>
        {connected && (
          <button
            type="button"
            className="ghost"
            disabled={busy}
            onClick={() => {
              formRef.current?.reset();
              setShow(false);
              setEditing(false);
            }}
          >
            Batal
          </button>
        )}
        {connected && (
          <button
            type="button"
            className={"danger" + (removing ? " is-loading" : "")}
            disabled={busy}
            aria-busy={removing}
            onClick={() => {
              if (!window.confirm("Hapus pengaturan Telegram? Laporan mingguan tidak akan terkirim sampai diisi lagi.")) return;
              startRemove(async () => {
                const r = await run(() => deleteTelegram());
                flash(r);
                setLink(null);
              });
            }}
          >
            Hapus
            {removing && spin}
          </button>
        )}
      </div>
    </form>
  );
}
