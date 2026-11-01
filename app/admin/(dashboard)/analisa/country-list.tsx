"use client";

import { useState } from "react";

/** Daftar negara: "Lainnya" bisa diklik untuk menampilkan sisa negaranya. */
export function CountryList({
  top,
  more,
  restPct,
}: {
  top: React.ReactNode;
  more?: React.ReactNode;
  restPct: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="an-ctry">
      {top}
      {open && more}
      {more && (
        <button type="button" className="an-ci an-more" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="an-rest" aria-hidden="true">{open ? "−" : "…"}</span>
          <span className="an-cn">{open ? "Tutup" : "Lainnya"}</span>
          {!open && <span className="an-pct">{restPct}%</span>}
        </button>
      )}
    </div>
  );
}
