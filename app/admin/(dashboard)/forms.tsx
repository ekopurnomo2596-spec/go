"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { createLink, deleteLink, updateLink } from "../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal menyimpan. Periksa koneksi lalu coba lagi." };
  }
}

export function Toast() {
  const [f, setF] = useState<Flash | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const on = (e: Event) => {
      setF((e as CustomEvent<Flash>).detail);
      clearTimeout(t);
      t = setTimeout(() => setF(null), 4500);
    };
    window.addEventListener("flash", on);
    return () => {
      window.removeEventListener("flash", on);
      clearTimeout(t);
    };
  }, []);
  if (!f) return null;
  return (
    <div className={`msg toast ${f.kind}`} role="status">
      {f.text}
    </div>
  );
}

function Btn({ pending, className, children }: { pending: boolean; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className={(className ?? "") + (pending ? " is-loading" : "")}
      disabled={pending}
      aria-busy={pending}
    >
      {children}
      {pending && <span className="spin" aria-hidden="true" />}
    </button>
  );
}

export function CreateForm() {
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await run(() => createLink(fd));
          flash(r);
          if (r.kind === "ok") form.reset();
        });
      }}
    >
      <div className="grid">
        <div>
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" type="text" placeholder="promo" required maxLength={40} />
        </div>
        <div>
          <label htmlFor="url">URL tujuan</label>
          <input id="url" name="url" type="url" placeholder="https://..." required />
        </div>
        <div>
          <label htmlFor="title">Judul</label>
          <input id="title" name="title" type="text" placeholder="Promo November" maxLength={80} />
        </div>
        <Btn pending={pending}>Buat</Btn>
      </div>
    </form>
  );
}

export function DeleteLink({ slug }: { slug: string }) {
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        if (!window.confirm(`Hapus /${slug}? Link dan semua data kliknya akan hilang permanen.`)) return;
        const fd = new FormData(e.currentTarget);
        start(async () => flash(await run(() => deleteLink(fd))));
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <Btn pending={pending} className="danger">Hapus</Btn>
    </form>
  );
}

export function EditLink({ slug, title, url, interstitial }: { slug: string; title: string; url: string; interstitial: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

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
        <div className="modal-back" onClick={() => !pending && setOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label={`Ubah /${slug}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <strong>Ubah /{slug}</strong>
              <button type="button" className="modal-x" aria-label="Tutup" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (pending) return;
                const fd = new FormData(e.currentTarget);
                start(async () => {
                  const r = await run(() => updateLink(fd));
                  flash(r);
                  if (r.kind === "ok") setOpen(false);
                });
              }}
            >
              <input type="hidden" name="slug" value={slug} />
              <div>
                <label htmlFor={`t-${slug}`}>Judul</label>
                <input id={`t-${slug}`} name="title" type="text" defaultValue={title} maxLength={80} />
              </div>
              <div>
                <label htmlFor={`u-${slug}`}>URL tujuan</label>
                <input id={`u-${slug}`} name="url" type="url" defaultValue={url} required />
              </div>
              <div className="check">
                <input id={`i-${slug}`} name="interstitial" type="checkbox" defaultChecked={interstitial} />
                <label htmlFor={`i-${slug}`}>Halaman perantara (hitung mundur 2 detik)</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="ghost" onClick={() => setOpen(false)} disabled={pending}>Batal</button>
                <Btn pending={pending}>Simpan</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
