"use client";

import { useState } from "react";

/** Hasil saran AI yang bisa dibuka dan ditutup. Terbuka otomatis hanya untuk hasil yang baru diminta. */
export function AiResult({ defaultOpen, children }: { defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ai-res">
      <button type="button" className="ai-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? "Tutup saran AI" : "Lihat saran AI"}
      </button>
      {open && <div className="ai-body">{children}</div>}
    </div>
  );
}
