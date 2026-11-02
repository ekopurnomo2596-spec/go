"use client";

import { useState } from "react";

/** Daftar sumber trafik: baris "Lainnya" bisa diklik untuk menampilkan sisa sumbernya. */
export function RefList({
  top,
  more,
  rest,
  barsClass = "an-bars",
  rowClass = "an-bar",
}: {
  top: React.ReactNode;
  more?: React.ReactNode;
  /** isi baris "Lainnya" saat tertutup (ikon, bar, persen) */
  rest?: React.ReactNode;
  /** kelas pembungkus dan baris; default untuk halaman Analisa, Dashboard memakai "rbars" dan "rbar mini" */
  barsClass?: string;
  rowClass?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={barsClass}>
      {top}
      {open && more}
      {more && (
        <button type="button" className={`${rowClass} an-more`} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? (
            <>
              <span className="an-src-l">
                <span className="an-rest" aria-hidden="true">−</span>
                <span>Tutup</span>
              </span>
            </>
          ) : (
            rest
          )}
        </button>
      )}
    </div>
  );
}
