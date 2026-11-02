"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { flash, type Flash } from "@/lib/flash";
import type { Pair } from "@/lib/telegram";
import { deleteTelegram, saveTelegram, sendReportNow, startTelegramPair } from "../../actions";

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
  const busy = saving || sending || removing || pairing;
  const router = useRouter();
  const connected = !!masked;
  const [editing, setEditing] = useState(!connected);
  useEffect(() => {
    if (!connected) setEditing(true);
  }, [connected]);
  // Token bot berubah atau dihapus: kode lama milik bot sebelumnya, jadi dibuang.
  useEffect(() => {
    setPair(initialPair);
  }, [masked, initialPair]);
  // Chat sudah tersambung (bot menjawab kode lewat webhook): kode tidak diperlukan lagi.
  const hadPair = useRef(!!initialPair);
  useEffect(() => {
    if (pair) hadPair.current = true;
    if (chat) {
      setPair(null);
      if (hadPair.current) {
        hadPair.current = false;
        flash({ kind: "ok", text: "Chat tersambung. Bot sudah membalas." });
      }
    }
  }, [chat, pair]);
  // Selama menunggu kode dikirim ke bot, cek status tiap 3 detik (halaman dimuat ulang diam-diam).
  const waiting = !!pair && !chat;
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(t);
  }, [waiting, router]);

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
        Kirim kode ini ke bot <b>@{pair.username}</b> di Telegram (berlaku 10 menit). Tersambung otomatis begitu bot menjawab.
      </p>
      <code className="tk-big">{pair.code}</code>
      <div className="tk-btns">
        <button
          type="button"
          className="ghost tk-icon"
          aria-label="Salin kode"
          title="Salin kode"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(pair.code);
            } catch {
              const t = document.createElement("textarea");
              t.value = pair.code;
              t.style.position = "fixed";
              t.style.opacity = "0";
              document.body.appendChild(t);
              t.select();
              const ok = document.execCommand("copy");
              t.remove();
              if (!ok) return flash({ kind: "err", text: "Gagal menyalin kode." });
            }
            flash({ kind: "ok", text: "Kode disalin." });
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          )}
        </button>
        <a className="btn ghost" href={`https://t.me/${pair.username}?start=${pair.code}`} target="_blank" rel="noopener noreferrer">
          Buka bot
        </a>
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
            if ("pair" in r && r.pair) setPair(r.pair);
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
