"use client";

import { useState, useTransition } from "react";
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
  const dirty = text.trim() !== start0;

  return (
    <div>
      <div className="ma-add">
        <input
          inputMode="numeric"
          value={text}
          placeholder="Kosongkan untuk memakai bawaan portal"
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
            start(async () => flash(await run(() => saveChatLimitAction(fd))));
          }}
        >
          Simpan
          {saving && <span className="spin" aria-hidden="true" />}
        </button>
      </div>
      <p className="ma-hint">
        Jumlah pesan chat yang boleh masuk dalam sehari. Perubahan dibaca chatbot dalam ±15 detik, tanpa redeploy dan
        tanpa mengubah environment Vercel.
      </p>
    </div>
  );
}
