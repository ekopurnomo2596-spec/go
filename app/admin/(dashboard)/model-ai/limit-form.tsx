"use client";

import { useEffect, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { saveChatLimitAction } from "../../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function LimitForm({ initial }: { initial: number | null }) {
  const start0 = initial ? String(initial) : "";
  const [text, setText] = useState(start0);
  const [saving, start] = useTransition();
  const [editing, setEditing] = useState(initial === null);
  const dirty = text.trim() !== start0;

  useEffect(() => {
    if (initial === null) setEditing(true);
  }, [initial]);

  if (initial !== null && !editing) {
    return (
      <div>
        <div className="ma-foot" style={{ marginTop: 0 }}>
          <span>
            Batas saat ini: <strong>{initial}</strong> pesan/hari
          </span>
          <button type="button" className="ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="ma-add">
        <input
          inputMode="numeric"
          value={text}
          placeholder="Kosongkan untuk memakai 300"
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="button"
          className={saving ? "is-loading" : ""}
          disabled={saving || !dirty}
          aria-busy={saving}
          onClick={() => {
            const fd = new FormData();
            fd.set("limit", text);
            start(async () => {
              const r = await run(() => saveChatLimitAction(fd));
              flash(r);
              if (r.kind === "ok") setEditing(false);
            });
          }}
        >
          Simpan
          {saving && <span className="spin" aria-hidden="true" />}
        </button>
        {initial !== null && (
          <button
            type="button"
            className="ghost"
            disabled={saving}
            onClick={() => {
              setText(start0);
              setEditing(false);
            }}
          >
            Batal
          </button>
        )}
      </div>
      <p className="ma-hint">
        Batas pesan chat per hari. Perubahan berlaku mulai pesan berikutnya.
      </p>
    </div>
  );
}
