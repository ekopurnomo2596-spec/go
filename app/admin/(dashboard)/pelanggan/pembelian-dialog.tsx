"use client";

import { useEffect, useState } from "react";
import { fmtTgl, type Pelanggan } from "@/lib/pelanggan-info";

/** Tombol "Riwayat" + jendela daftar tanggal pembelian (hanya lihat). */
export function PembelianDialog({ p }: { p: Pelanggan }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button type="button" className="editbtn" onClick={() => setOpen(true)}>
        Riwayat
      </button>
      {open && (
        <div
          className="modal-back"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !e.defaultPrevented) setOpen(false);
          }}
        >
          <div className="modal pb-modal" role="dialog" aria-modal="true" aria-label="Riwayat pembelian" onClick={(e) => e.stopPropagation()}>
            <style>{`
              .pb-modal { width: min(420px, 100%); max-height: calc(100dvh - 32px); overflow-y: auto; }
              .pb-modal .modal-x { padding: 0; }
              .pb-modal .modal-x svg { flex: none; }
              .pb-list { list-style: none; margin: 0 0 16px; padding: 0; border-top: 1px solid var(--line); }
              .pb-list li { display: flex; gap: 12px; padding: 10px 2px; border-bottom: 1px solid var(--line); font-size: 14px; }
              .pb-no { min-width: 2ch; color: var(--muted); font-variant-numeric: tabular-nums; }
              .pb-act { display: flex; justify-content: flex-end; }
            `}</style>
            <div className="modal-head">
              <strong>Riwayat pembelian: {p.nama}</strong>
              <button type="button" className="modal-x" aria-label="Tutup" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {p.beli.length === 0 ? (
              <p className="empty">Belum ada pembelian.</p>
            ) : (
              <ul className="pb-list">
                {p.beli.map((t, i) => (
                  <li key={t}>
                    <span className="pb-no">{p.beli.length - i}.</span>
                    <span>{fmtTgl(t)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="pb-act">
              <button type="button" className="ghost" onClick={() => setOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
