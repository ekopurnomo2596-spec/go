"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import type { Pair } from "@/lib/telegram";
import { deleteTelegram, finishTelegramPair, saveTelegram, sendReportNow, startTelegramPair } from "../../actions";

async function run<T extends Flash>(fn: () => Promise<T>): Promise<T | Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function TelegramForm({ masked, chat, pair: initialPair }: { masked: string | null; chat: string | null; pair: Pair | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [show, setShow] = useState(false);
  const [pair, setPair] = useState<Pair | null>(initialPair);
  const [copied, setCopied] = useState(false);
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
  // Token bot berubah atau dihapus: kode lama milik bot sebelumnya, jadi dibuang.
  useEffect(() => {
    setPair(initialPair);
  }, [masked, initialPair]);
  // Chat sudah tersambung: kode tidak diperlukan lagi.
  useEffect(() => {
    if (chat) setPair(null);
  }, [chat]);

  const spin = <span className="spin" aria-hidden="true" />;

  const newCode = () =>
    startPair(async () => {
      const r = await startTelegramPair().catch(() => null);
      if (!r) return flash({ kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." });
      flash(r);
      if (r.kind === "ok" && r.pair) setPair(r.pair);
    });

  const codeBlock = pair && !chat && (
    <div className="tk-code">
      <p>
        Kirim kode ini ke bot <b>@{pair.username}</b> di Telegram (berlaku 10 menit), lalu tekan Cek.
      </p>
      <code className="tk-big">{pair.code}</code>
      <div className="tk-btns">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            navigator.clipboard?.writeText(pair.code).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              },
              () => {},
            );
          }}
        >
          {copied ? "Tersalin" : "Salin kode"}
        </button>
        <a className="btn ghost" href={pair.link} target="_blank" rel="noopener noreferrer">
          Buka bot
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
              if (r.kind === "ok") {
                setPair(null);
                setEditing(false);
              }
            })
          }
        >
          Cek
          {checking && spin}
        </button>
        <button type="button" className="ghost" disabled={busy} onClick={newCode}>
          Kode baru
        </button>
      </div>
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

  const noCode = connected && !chat && !pair && (
    <button type="button" className={"ghost" + (pairing ? " is-loading" : "")} disabled={busy} aria-busy={pairing} onClick={newCode}>
      Buat kode
      {pairing && spin}
    </button>
  );

  if (connected && !editing) {
    return (
      <>
        {codeBlock}
        <div className="tk-btns">
          {sendBtn}
          {noCode}
          {chat && (
            <button type="button" className="ghost" disabled={busy} onClick={newCode}>
              Sambungkan ulang
            </button>
          )}
          <button type="button" className="ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
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
            setPair("pair" in r ? (r.pair ?? null) : null);
          }
        });
      }}
    >
      <div className="tk-field">
        <label htmlFor="tg-token">{connected ? "Ganti token bot" : "Token bot"}</label>
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
        <p className="tk-hint">
          {connected ? "Kosongkan kalau token tidak berubah. " : ""}Setelah disimpan, kamu dapat kode untuk dikirim ke bot supaya chat tersambung otomatis.
        </p>
      </div>
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
                setPair(null);
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
