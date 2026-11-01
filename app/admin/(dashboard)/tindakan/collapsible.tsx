"use client";

import { Children, useState } from "react";

/** Tampilkan beberapa kartu dulu; sisanya muncul lewat "Lihat semua", dan bisa ditutup lagi. */
export function Collapsible({ limit, children }: { limit: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const all = Children.toArray(children);
  const more = all.length > limit;
  const shown = open || !more ? all : all.slice(0, limit);
  return (
    <>
      <div className="tx-list">{shown}</div>
      {more && (
        <div className="tx-more">
          <button type="button" className="ghost" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? "Tutup" : `Lihat semua (${all.length})`}
          </button>
        </div>
      )}
    </>
  );
}
