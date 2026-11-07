"use client";

import { useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { setChatEnabledAction } from "../../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function ChatToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !on;
    const fd = new FormData();
    fd.set("on", next ? "1" : "0");
    start(async () => {
      const r = await run(() => setChatEnabledAction(fd));
      flash(r);
      if (r.kind === "ok") setOn(next);
    });
  }

  return (
    <div className="ct-row">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Tampilkan chat di website"
        className={"ct-sw" + (on ? " on" : "") + (pending ? " is-loading" : "")}
        disabled={pending}
        onClick={toggle}
      >
        <span className="ct-knob" />
      </button>
      <div>
        <strong>{on ? "Chat tampil di website" : "Chat disembunyikan"}</strong>
        <div className="ma-hint" style={{ margin: "2px 0 0" }}>
          {on
            ? "Tombol dan jendela chat muncul di emahairshop.com."
            : "Tombol dan jendela chat hilang, dan pesan baru ditolak server. Percakapan lama tetap tersimpan."}
        </div>
      </div>
    </div>
  );
}
