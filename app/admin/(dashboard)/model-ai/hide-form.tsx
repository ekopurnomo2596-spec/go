"use client";

import { useState, useTransition } from "react";
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
  const dirty = text.trim() !== initial.join("\n");

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
            start(async () => flash(await run(() => saveChatHideAction(fd))));
          }}
        >
          Simpan
          {saving && <span className="spin" aria-hidden="true" />}
        </button>
      </div>
      <p className="ma-hint">
        Satu aturan per baris, berlaku di semua subdomain yang memasang widget. <code>/order</code> = halaman itu dan
        turunannya, <code>/cart*</code> = wildcard, <code>/</code> = beranda saja, <code>shop.emahairshop.com/cart</code>{" "}
        = hanya di subdomain itu. Perubahan terbaca widget dalam ±15 detik; tidak perlu mengubah kode tempel.
      </p>
    </div>
  );
}
