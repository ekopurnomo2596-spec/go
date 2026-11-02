"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { deleteRemote, saveRemote, testRemote } from "../../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function RemoteForm({ src, name, connected }: { src: "wa" | "tg"; name: string; connected: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [show, setShow] = useState(false);
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();
  const [removing, startRemove] = useTransition();
  const busy = saving || testing || removing;
  const [editing, setEditing] = useState(!connected);
  useEffect(() => {
    if (!connected) setEditing(true);
  }, [connected]);

  if (connected && !editing) {
    return (
      <div className="tk-btns tk-top">
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
          const r = await run(() => saveRemote(fd));
          flash(r);
          if (r.kind === "ok") {
            form.reset();
            setShow(false);
            setEditing(false);
          }
        });
      }}
    >
      <input type="hidden" name="src" value={src} />
      <label htmlFor={`rurl-${src}`}>{connected ? "Ganti URL" : "REST URL"}</label>
      <input
        id={`rurl-${src}`}
        name="url"
        type="url"
        placeholder="https://xxxx.upstash.io"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={300}
      />
      <label htmlFor={`rtok-${src}`}>{connected ? "Ganti token" : "REST Token"}</label>
      <div className="tk-row">
        <input
          id={`rtok-${src}`}
          name="token"
          type={show ? "text" : "password"}
          placeholder={connected ? "Tempel token baru" : "Tempel token (boleh read-only)"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={500}
        />
        <button type="button" className="ghost" onClick={() => setShow((v) => !v)} aria-pressed={show}>
          {show ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>
      <div className="tk-btns">
        <button type="submit" className={saving ? "is-loading" : ""} disabled={busy} aria-busy={saving}>
          Simpan
          {saving && <span className="spin" aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={"ghost" + (testing ? " is-loading" : "")}
          disabled={busy}
          aria-busy={testing}
          onClick={() => {
            if (!formRef.current) return;
            const fd = new FormData(formRef.current);
            startTest(async () => flash(await run(() => testRemote(fd))));
          }}
        >
          Tes koneksi
          {testing && <span className="spin" aria-hidden="true" />}
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
              if (!window.confirm(`Putus koneksi Redis ${name}? Halaman Percakapan ${name} akan kosong sampai diisi lagi.`)) return;
              const fd = new FormData();
              fd.set("src", src);
              startRemove(async () => flash(await run(() => deleteRemote(fd))));
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
