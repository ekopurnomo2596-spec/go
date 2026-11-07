"use client";

import { useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { addChatKeysAction, removeChatKeyAction } from "../../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function ChatKeysForm({ masked, max }: { masked: string[]; max: number }) {
  const [text, setText] = useState("");
  const [saving, startSave] = useTransition();
  const [removing, startRemove] = useTransition();
  const busy = saving || removing;

  return (
    <div>
      {masked.length > 0 ? (
        masked.map((m, i) => (
          <div className="ma-row" key={i}>
            <span className="ma-num">{i + 1}</span>
            <span className="ma-name">{m}</span>
            <button
              type="button"
              className="danger"
              disabled={busy}
              onClick={() => {
                if (!window.confirm("Hapus key ini dari chatbot?")) return;
                const fd = new FormData();
                fd.set("index", String(i));
                startRemove(async () => flash(await run(() => removeChatKeyAction(fd))));
              }}
            >
              Hapus
            </button>
          </div>
        ))
      ) : (
        <p className="ma-hint" style={{ margin: "0 0 12px" }}>
          Belum ada key di sini. Selama kosong, chatbot memakai key dari environment kalau ada.
        </p>
      )}
      <label className="pr-field" style={{ marginTop: 12, marginBottom: 12 }}>
        <span>Tambah key</span>
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
          disabled={busy || !text.trim() || masked.length >= max}
          aria-busy={saving}
          onClick={() => {
            const fd = new FormData();
            fd.set("keys", text);
            startSave(async () => {
              const r = await run(() => addChatKeysAction(fd));
              flash(r);
              if (r.kind === "ok") setText("");
            });
          }}
        >
          Simpan
          {saving && <span className="spin" aria-hidden="true" />}
        </button>
      </div>
      <p className="ma-hint">
        Maksimal {max} key. Chatbot memakai semuanya bergantian dan melewati key yang kena kuota. Perubahan terbaca
        dalam ±30 detik, tanpa redeploy.
      </p>
    </div>
  );
}
