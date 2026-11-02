"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { deleteTelegram, saveTelegram, sendReportNow } from "../../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function TelegramForm({ masked, chat }: { masked: string | null; chat: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [show, setShow] = useState(false);
  const [saving, startSave] = useTransition();
  const [sending, startSend] = useTransition();
  const [removing, startRemove] = useTransition();
  const busy = saving || sending || removing;
  const connected = !!masked;
  const [editing, setEditing] = useState(!connected);
  useEffect(() => {
    if (!connected) setEditing(true);
  }, [connected]);

  const sendBtn = (
    <button
      type="button"
      className={sending ? "is-loading" : ""}
      disabled={busy}
      aria-busy={sending}
      onClick={() => startSend(async () => flash(await run(() => sendReportNow())))}
    >
      Kirim laporan sekarang
      {sending && <span className="spin" aria-hidden="true" />}
    </button>
  );

  if (connected && !editing) {
    return (
      <div className="tk-btns">
        {sendBtn}
        <button type="button" className="ghost" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
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
      <label htmlFor="tg-chat">Chat ID</label>
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
          {saving && <span className="spin" aria-hidden="true" />}
        </button>
        {connected && sendBtn}
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
              startRemove(async () => flash(await run(() => deleteTelegram())));
            }}
          >
            Hapus
            {removing && <span className="spin" aria-hidden="true" />}
          </button>
        )}
      </div>
    </form>
  );
}
