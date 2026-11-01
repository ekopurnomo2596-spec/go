"use client";

import { useEffect, useState } from "react";
import { SubmitButton } from "../confirm-button";

export function EditLink({
  slug,
  title,
  url,
  action,
}: {
  slug: string;
  title: string;
  url: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="editbtn" onClick={() => setOpen(true)}>
        Ubah
      </button>
      {open && (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label={`Ubah /${slug}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <strong>Ubah /{slug}</strong>
              <button type="button" className="modal-x" aria-label="Tutup" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <form action={action}>
              <input type="hidden" name="slug" value={slug} />
              <div>
                <label htmlFor={`t-${slug}`}>Judul</label>
                <input id={`t-${slug}`} name="title" type="text" defaultValue={title} maxLength={80} />
              </div>
              <div>
                <label htmlFor={`u-${slug}`}>URL tujuan</label>
                <input id={`u-${slug}`} name="url" type="url" defaultValue={url} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="ghost" onClick={() => setOpen(false)}>Batal</button>
                <SubmitButton>Simpan</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
