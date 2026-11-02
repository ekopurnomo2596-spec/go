"use client";

import { useState } from "react";

/** Daftar terbaru: tampil 5 baris dulu, sisanya bisa dibuka lewat tombol. */
export function RecentList({
  head,
  rows,
  limit = 5,
}: {
  head: React.ReactNode;
  rows: React.ReactNode[];
  limit?: number;
}) {
  const [open, setOpen] = useState(false);
  const extra = rows.length - limit;
  const shown = open ? rows : rows.slice(0, limit);
  return (
    <div className="an-rec">
      {head}
      {shown}
      {extra > 0 && (
        <button type="button" className="an-rec-more" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Tutup" : `Tampilkan ${extra} lainnya`}
          <svg viewBox="0 0 24 24" aria-hidden="true" className={open ? "up" : ""}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
