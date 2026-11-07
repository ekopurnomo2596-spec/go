"use client";

import { useEffect, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { saveChatHideAction } from "../../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function HideForm({ initial }: { initial: string[] }) {
  const [text, setText] = useState(initial.join("\n"));
  const [saving, start] = useTransition();
  const [tick, setTick] = useState(0);
  const dirty = text.trim() !== initial.join("\n");

  // Setelah Simpan, server merapikan aturan (mis. buang https://). Tampilkan hasil rapinya di kotak.
  const saved = initial.join("\n");
  useEffect(() => {
    setText(saved);
  }, [saved, tick]);

  return (
    <div>
      <label className="pr-field" style={{ marginBottom: 12 }}>
        <textarea
          value={text}
          rows={5}
          spellCheck={false}
          placeholder={"/order\n/checkout\n/cart*\nshop.emahairshop.com/cart"}
          onChange={(e) => setText(e.target.value)}
          style={{ minHeight: 0 }}
        />
      </label>
      <div className="ma-foot" style={{ marginTop: 0 }}>
        <button
          type="button"
          className={saving ? "is-loading" : ""}
          disabled={saving || !dirty}
          aria-busy={saving}
          onClick={() => {
            const fd = new FormData();
            fd.set("rules", text);
            start(async () => {
              const r = await run(() => saveChatHideAction(fd));
              flash(r);
              if (r.kind === "ok") setTick((t) => t + 1);
            });
          }}
        >
          Simpan
          {saving && <span className="spin" aria-hidden="true" />}
        </button>
      </div>
      <p className="ma-hint">
        Satu aturan per baris, berlaku di semua subdomain. <code>/order</code> = halaman dan turunannya,{" "}
        <code>/cart*</code> = wildcard, <code>/</code> = beranda saja, <code>shop.emahairshop.com/cart</code> = hanya
        di subdomain tersebut. Perubahan aktif dalam ±15 detik.
      </p>
    </div>
  );
}
