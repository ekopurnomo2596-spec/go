"use client";

import { useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { addChatKeysAction, removeChatKeyAction, renameChatKeyAction } from "../../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function ChatKeysForm({
  items,
  max,
  maxName,
}: {
  items: { mask: string; name: string }[];
  max: number;
  maxName: number;
}) {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, startSave] = useTransition();
  const [removing, startRemove] = useTransition();
  const [renaming, startRename] = useTransition();
  const busy = saving || removing || renaming;

  function submitRename(i: number) {
    const fd = new FormData();
    fd.set("index", String(i));
    fd.set("name", draft);
    startRename(async () => {
      const r = await run(() => renameChatKeyAction(fd));
      flash(r);
      if (r.kind === "ok") setEditing(null);
    });
  }

  return (
    <div>
      <style>{`
        .ck-info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .ck-name { font-size: .9rem; font-weight: 600; overflow-wrap: anywhere; }
        .ck-mask { font-family: ui-monospace, Menlo, monospace; font-size: .76rem; color: var(--muted); }
        .ck-edit { flex: 1 1 auto; min-width: 0; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .ck-edit input { flex: 1 1 160px; min-width: 0; }
      `}</style>
      {items.length > 0 ? (
        items.map((it, i) => (
          <div className="ma-row" key={i}>
            <span className="ma-num">{i + 1}</span>
            {editing === i ? (
              <form
                className="ck-edit"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!busy) submitRename(i);
                }}
              >
                <input
                  autoFocus
                  value={draft}
                  maxLength={maxName}
                  placeholder={`Key ${i + 1}`}
                  aria-label="Nama key"
                  autoComplete="off"
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className={renaming ? "is-loading" : ""} disabled={busy} aria-busy={renaming}>
                  Simpan
                  {renaming && <span className="spin" aria-hidden="true" />}
                </button>
                <button type="button" className="ghost" disabled={busy} onClick={() => setEditing(null)}>
                  Batal
                </button>
              </form>
            ) : (
              <>
                <div className="ck-info">
                  <span className="ck-name">{it.name || `Key ${i + 1}`}</span>
                  <span className="ck-mask">{it.mask}</span>
                </div>
                <button
                  type="button"
                  className="ghost"
                  disabled={busy}
                  onClick={() => {
                    setDraft(it.name);
                    setEditing(i);
                  }}
                >
                  Ganti nama
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`Hapus "${it.name || `Key ${i + 1}`}" dari chatbot?`)) return;
                    const fd = new FormData();
                    fd.set("index", String(i));
                    startRemove(async () => flash(await run(() => removeChatKeyAction(fd))));
                  }}
                >
                  Hapus
                </button>
              </>
            )}
          </div>
        ))
      ) : (
        <p className="ma-hint" style={{ margin: "0 0 12px" }}>
          Belum ada key. Tambahkan minimal satu agar chatbot dapat menjawab.
        </p>
      )}
      <label className="pr-field" style={{ marginTop: 12, marginBottom: 12 }}>
        <span>
          Nama <small>opsional, untuk satu key</small>
        </span>
        <input
          value={name}
          maxLength={maxName}
          placeholder="Mis. Akun utama"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="pr-field" style={{ marginBottom: 12 }}>
        <span>Key</span>
        <textarea
          value={text}
          rows={3}
          spellCheck={false}
          autoComplete="off"
          placeholder={"Satu key per baris"}
          onChange={(e) => setText(e.target.value)}
          style={{ minHeight: 0 }}
        />
      </label>
      <div className="ma-foot" style={{ marginTop: 0 }}>
        <button
          type="button"
          className={saving ? "is-loading" : ""}
          disabled={busy || !text.trim() || items.length >= max}
          aria-busy={saving}
          onClick={() => {
            const fd = new FormData();
            fd.set("keys", text);
            fd.set("name", name);
            startSave(async () => {
              const r = await run(() => addChatKeysAction(fd));
              flash(r);
              if (r.kind === "ok") {
                setText("");
                setName("");
              }
            });
          }}
        >
          Simpan
          {saving && <span className="spin" aria-hidden="true" />}
        </button>
      </div>
      <p className="ma-hint">
        Maksimal {max} key, dipakai bergantian; key yang kehabisan kuota dilewati. Key nomor 1 juga dipakai untuk Tes dan
        Lihat model tersedia di panel Daftar model. Perubahan aktif dalam ±30 detik.
      </p>
    </div>
  );
}
