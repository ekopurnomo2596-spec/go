"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [adding, setAdding] = useState(items.length === 0);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, startSave] = useTransition();
  const [removing, startRemove] = useTransition();
  const [renaming, startRename] = useTransition();
  const busy = saving || removing || renaming;
  const full = items.length >= max;

  useEffect(() => {
    if (items.length === 0) setAdding(true);
  }, [items.length]);

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

  function closeAdd() {
    setText("");
    setName("");
    setAdding(false);
  }

  return (
    <div className="ck">
      <style>{`
        .ck-panel h2 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
        .ck-panel h2 small { font-weight: 400; margin-left: 0; }
        @media (min-width: 720px) {
          .ck-panel { position: relative; }
          .ck-panel .ck-top { position: absolute; top: 15px; right: 20px; margin: 0; }
          .ck-panel h2 { padding-right: 150px; }
        }
        .ck-panel .ck-btns { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .ck-panel button { min-height: 32px; padding: 0 12px; font-size: 13px; font-weight: 500; line-height: 1.2; border-radius: 8px; box-shadow: none; }
        .ck-panel button:not(.ghost):not(.danger) { background: #3b6ef0; border: 1px solid #3b6ef0; color: #fff; }
        .ck-panel button:not(.ghost):not(.danger):hover:not(:disabled) { background: #2f5fd8; border-color: #2f5fd8; }
        .ck-panel .ghost { background: var(--card); border: 1px solid var(--line); color: var(--ink); }
        .ck-panel .ghost:hover:not(:disabled) { background: var(--hover); }
        .ck-panel .danger { background: var(--card); border: 1px solid #efc4c4; color: #c93636; }
        .ck-panel .danger:hover:not(:disabled) { background: #fff5f5; }
        .ck-panel button:disabled { opacity: .55; cursor: not-allowed; }

        .ck-list { list-style: none; margin: 0 0 4px; padding: 0; }
        .ck-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--line); flex-wrap: wrap; }
        .ck-item:first-child { border-top: 0; padding-top: 4px; }
        .ck-num { flex: none; width: 24px; height: 24px; border-radius: 50%; background: var(--hover); color: var(--muted); font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
        .ck-info { flex: 1 1 200px; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
        .ck-info strong { font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
        .ck-info code { color: var(--ink); background: var(--hover); padding: 2px 8px; border-radius: 6px; font-size: 12px; }
        .ck-edit { flex: 1 1 260px; min-width: 0; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .ck-edit input { flex: 1 1 160px; min-width: 0; }

        .ck-panel .ck-form { display: flex; flex-direction: column; gap: 14px; margin-top: 8px; padding-top: 16px; border-top: 1px solid var(--line); }
        .ck-panel .ck-form:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
        .ck-panel .ck-field { display: flex; flex-direction: column; gap: 6px; }
        .ck-panel .ck-field > label { font-size: 13px; font-weight: 500; margin: 0; }
        .ck-panel .ck-field > label small { font-weight: 400; opacity: .6; margin-left: 6px; }
        .ck-panel .ck-hint { font-size: 12px; opacity: .6; margin: 12px 0 0; line-height: 1.5; }
        .ck-panel .ck-form input, .ck-panel .ck-edit input, .ck-panel .ck-form textarea {
          box-sizing: border-box; width: 100%; padding: 0 12px; font: inherit; font-size: 14px;
          background: var(--bg); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; outline: none;
        }
        .ck-panel .ck-form input, .ck-panel .ck-edit input { height: 36px; }
        .ck-panel .ck-form textarea { padding: 8px 12px; min-height: 84px; resize: vertical; font-family: ui-monospace, Menlo, monospace; font-size: 13px; line-height: 1.5; }
        .ck-panel .ck-form input::placeholder, .ck-panel .ck-edit input::placeholder, .ck-panel .ck-form textarea::placeholder { color: #9a9a9a; }
        .ck-panel .ck-form input:focus, .ck-panel .ck-edit input:focus, .ck-panel .ck-form textarea:focus { border-color: #3b6ef0; box-shadow: 0 0 0 3px rgba(59, 110, 240, .15); }
      `}</style>

      {items.length > 0 && !adding && !full && (
        <div className="ck-btns ck-top">
          <button type="button" className="ghost" onClick={() => setAdding(true)}>
            Tambah key
          </button>
        </div>
      )}

      {items.length > 0 ? (
        <ul className="ck-list">
          {items.map((it, i) => (
            <li className="ck-item" key={i}>
              <span className="ck-num">{i + 1}</span>
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
                  <div className="ck-btns">
                    <button type="submit" className={renaming ? "is-loading" : ""} disabled={busy} aria-busy={renaming}>
                      Simpan
                      {renaming && <span className="spin" aria-hidden="true" />}
                    </button>
                    <button type="button" className="ghost" disabled={busy} onClick={() => setEditing(null)}>
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="ck-info">
                    <strong>{it.name || `Key ${i + 1}`}</strong>
                    <code>{it.mask}</code>
                  </div>
                  <div className="ck-btns">
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
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ck-hint" style={{ margin: "0 0 14px" }}>
          Belum ada key. Tambahkan minimal satu agar chatbot dapat menjawab.
        </p>
      )}

      {adding && (
        <form
          className="ck-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (busy || !text.trim()) return;
            const fd = new FormData();
            fd.set("keys", text);
            fd.set("name", name);
            startSave(async () => {
              const r = await run(() => addChatKeysAction(fd));
              flash(r);
              if (r.kind === "ok") closeAdd();
            });
          }}
        >
          <div className="ck-field">
            <label htmlFor="ck-name">
              Nama<small>opsional, untuk satu key</small>
            </label>
            <input
              id="ck-name"
              value={name}
              maxLength={maxName}
              placeholder="Mis. Akun utama"
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="ck-field">
            <label htmlFor="ck-keys">
              Key<small>satu key per baris</small>
            </label>
            <textarea
              id="ck-keys"
              value={text}
              rows={3}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              placeholder="Tempel key (AQ.… atau AIza…)"
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="ck-btns">
            <button
              type="submit"
              className={saving ? "is-loading" : ""}
              disabled={busy || !text.trim() || full}
              aria-busy={saving}
            >
              Simpan
              {saving && <span className="spin" aria-hidden="true" />}
            </button>
            {items.length > 0 && (
              <button type="button" className="ghost" disabled={busy} onClick={closeAdd}>
                Batal
              </button>
            )}
          </div>
        </form>
      )}

      <p className="ck-hint">
        Maksimal {max} key, dipakai bergantian; key yang kehabisan kuota dilewati. Key nomor 1 juga dipakai untuk Tes dan
        Lihat model tersedia di panel Daftar model. Perubahan aktif dalam ±30 detik.
      </p>
    </div>
  );
}
