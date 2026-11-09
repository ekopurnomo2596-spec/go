"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { addPembelianAction, deletePembelianAction } from "../../actions";
import { fmtTgl, type Pelanggan } from "@/lib/pelanggan-info";

/** Tombol "Riwayat" + jendela daftar tanggal pembelian satu pelanggan, dengan form tambah tanggal. */
export function PembelianDialog({ p }: { p: Pelanggan }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [delPending, startDel] = useTransition();
  const [gone, setGone] = useState<string>("");
  const input = useRef<HTMLInputElement>(null);
  const busy = pending || delPending;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    fd.set("id", p.id);
    start(async () => {
      let r: Flash;
      try {
        r = await addPembelianAction(fd);
      } catch {
        r = { kind: "err", text: "Gagal menyimpan. Periksa koneksi lalu coba lagi." };
      }
      flash(r);
      if (r.kind === "ok" && input.current) {
        input.current.value = "";
        input.current.focus();
      }
    });
  }

  function remove(tgl: string) {
    if (busy) return;
    if (!window.confirm(`Hapus tanggal pembelian ${fmtTgl(tgl)}?`)) return;
    setGone(tgl);
    startDel(async () => {
      let r: Flash;
      try {
        const fd = new FormData();
        fd.set("id", p.id);
        fd.set("tanggal", tgl);
        r = await deletePembelianAction(fd);
      } catch {
        r = { kind: "err", text: "Gagal menghapus. Periksa koneksi lalu coba lagi." };
      }
      flash(r);
      setGone("");
    });
  }

  return (
    <>
      <button type="button" className="editbtn" onClick={() => setOpen(true)}>
        Riwayat
      </button>
      {open && (
        <div
          className="modal-back"
          onClick={() => !busy && setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !e.defaultPrevented && !busy) setOpen(false);
          }}
        >
          <div className="modal pb-modal" role="dialog" aria-modal="true" aria-label="Riwayat pembelian" onClick={(e) => e.stopPropagation()}>
            <style>{`
              .pb-modal { width: min(460px, 100%); max-height: calc(100dvh - 32px); overflow-y: auto; }
              .pb-list { list-style: none; margin: 0 0 16px; padding: 0; border-top: 1px solid var(--line); }
              .pb-list li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 2px; border-bottom: 1px solid var(--line); font-size: 14px; }
              .pb-list li.gone { opacity: .45; }
              .pb-list button { padding: 5px 10px; font-size: 12px; }
              .pb-form { display: flex; flex-direction: column; gap: 6px; }
              .pb-form label { font-size: 13px; font-weight: 500; margin: 0; }
              .pb-form input[type="text"] { box-sizing: border-box; width: 100%; padding: 9px 12px; font: inherit; font-size: 14px; background: var(--bg); color: var(--ink); border: 1px solid var(--line); border-radius: 10px; outline: none; }
              .pb-form input:focus { border-color: var(--gold); }
              .pb-hint { font-size: 12px; opacity: .6; margin: 0; }
              .pb-act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
            `}</style>
            <div className="modal-head">
              <strong>Riwayat pembelian: {p.nama}</strong>
              <button type="button" className="modal-x" aria-label="Tutup" onClick={() => !busy && setOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {p.beli.length === 0 ? (
              <p className="empty">Belum ada pembelian.</p>
            ) : (
              <ul className="pb-list">
                {p.beli.map((t) => (
                  <li key={t} className={gone === t ? "gone" : ""}>
                    <span>{fmtTgl(t)}</span>
                    <button type="button" className="danger" onClick={() => remove(t)} disabled={busy}>
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form className="pb-form" onSubmit={add}>
              <label htmlFor={`pb-t-${p.id}`}>Tanggal pembelian</label>
              <input id={`pb-t-${p.id}`} ref={input} name="tanggal" type="text" inputMode="numeric" placeholder="DD/MM/YYYY" autoComplete="off" maxLength={10} required autoFocus />
              <p className="pb-hint">Contoh: 24/03/2026</p>
              <div className="pb-act">
                <button type="button" className="ghost" onClick={() => !busy && setOpen(false)} disabled={busy}>
                  Tutup
                </button>
                <button type="submit" className={pending ? "is-loading" : ""} disabled={busy} aria-busy={pending}>
                  Tambah pembelian
                  {pending && <span className="spin" aria-hidden="true" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
