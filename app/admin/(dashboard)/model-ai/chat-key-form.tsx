"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { deleteChatKeyAction, saveChatKeyAction, testModelAction } from "../../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function ChatKeyForm({ masked, testModel }: { masked: string | null; testModel: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [show, setShow] = useState(false);
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();
  const [removing, startRemove] = useTransition();
  const busy = saving || testing || removing;
  const [editing, setEditing] = useState(!masked);
  useEffect(() => {
    if (!masked) setEditing(true);
  }, [masked]);

  if (masked && !editing) {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="ghost" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        const form = e.currentTarget;
        const fd = new FormData(form);
        startSave(async () => {
          const r = await run(() => saveChatKeyAction(fd));
          flash(r);
          if (r.kind === "ok") {
            form.reset();
            setShow(false);
            setEditing(false);
          }
        });
      }}
    >
      <label htmlFor="chat-key">{masked ? "Ganti token" : "Token Gemini"}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          id="chat-key"
          name="key"
          type={show ? "text" : "password"}
          placeholder={masked ? "Tempel token baru" : "Tempel token (AQ.… atau AIza…)"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={300}
          style={{ flex: 1 }}
        />
        <button type="button" className="ghost" onClick={() => setShow((v) => !v)} aria-pressed={show}>
          {show ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
            fd.set("model", testModel);
            startTest(async () => flash(await run(() => testModelAction(fd))));
          }}
        >
          Tes
          {testing && <span className="spin" aria-hidden="true" />}
        </button>
        {masked && (
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
        {masked && (
          <button
            type="button"
            className={"danger" + (removing ? " is-loading" : "")}
            disabled={busy}
            aria-busy={removing}
            onClick={() => {
              if (!window.confirm("Hapus token ini? Tombol Tes dan saran model tidak jalan sampai diisi lagi.")) return;
              startRemove(async () => flash(await run(() => deleteChatKeyAction())));
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
