"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { checkLinksAction, createLink, deleteLink, updateLink } from "../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal menyimpan. Periksa koneksi lalu coba lagi." };
  }
}

export function Toast() {
  const [f, setF] = useState<(Flash & { id: number }) | null>(null);
  const [out, setOut] = useState(false);
  useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    let gone: ReturnType<typeof setTimeout> | undefined;
    const on = (e: Event) => {
      clearTimeout(hide);
      clearTimeout(gone);
      setOut(false);
      setF({ ...(e as CustomEvent<Flash>).detail, id: Date.now() });
      hide = setTimeout(() => setOut(true), 4000);
      gone = setTimeout(() => setF(null), 4300);
    };
    window.addEventListener("flash", on);
    return () => {
      window.removeEventListener("flash", on);
      clearTimeout(hide);
      clearTimeout(gone);
    };
  }, []);
  if (!f) return null;
  return (
    <div key={f.id} className={`msg toast ${f.kind}${out ? " out" : ""}`} role="status">
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
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        + Tambah
      </button>
      {open && (
        <div className="modal-back" onClick={() => !pending && setOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Buat link baru" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <strong>Buat link baru</strong>
              <button type="button" className="modal-x" aria-label="Tutup" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (pending) return;
                const form = e.currentTarget;
                const fd = new FormData(form);
                start(async () => {
                  const r = await run(() => createLink(fd));
                  flash(r);
                  if (r.kind === "ok") {
                    form.reset();
                    setOpen(false);
                  }
                });
              }}
            >
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
              <div className="modal-actions">
                <button type="button" className="ghost" onClick={() => setOpen(false)} disabled={pending}>Batal</button>
                <Btn pending={pending}>Buat</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function CheckNow() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={"ghost" + (pending ? " is-loading" : "")}
      disabled={pending}
      aria-busy={pending}
      onClick={() => start(async () => flash(await run(() => checkLinksAction())))}
    >
      Cek sekarang
      {pending && <span className="spin" aria-hidden="true" />}
    </button>
  );
}

export function CopyLink({ slug }: { slug: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    const url = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const t = document.createElement("textarea");
      t.value = url;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand("copy");
      t.remove();
      if (!ok) return flash({ kind: "err", text: "Gagal menyalin tautan." });
    }
    flash({ kind: "ok", text: "Tautan disalin." });
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }
  return (
    <button type="button" className="copybtn" onClick={copy} aria-label={`Salin tautan /${slug}`} title="Salin tautan">
      {done ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
      )}
    </button>
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
              <label className="switch" htmlFor={`i-${slug}`}>
                <span>Halaman perantara (pindah otomatis 3 detik)</span>
                <input id={`i-${slug}`} name="interstitial" type="checkbox" defaultChecked={interstitial} />
                <i aria-hidden="true" />
              </label>
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

/** Form generik: konfirmasi opsional, tombol berputar, tanpa pindah halaman. */
export function ActionForm({
  action,
  confirm,
  formClass,
  btnClass,
  title,
  label,
  children,
}: {
  action: (fd: FormData) => Promise<Flash>;
  confirm?: string;
  formClass?: string;
  btnClass?: string;
  title?: string;
  label: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  return (
    <form
      className={formClass}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        if (confirm && !window.confirm(confirm)) return;
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await run(() => action(fd));
          flash(r);
          if (r.kind === "ok") form.closest("details")?.removeAttribute("open");
        });
      }}
    >
      {children}
      <button
        type="submit"
        className={(btnClass ?? "") + (pending ? " is-loading" : "")}
        title={title}
        aria-label={title}
        disabled={pending}
        aria-busy={pending}
      >
        {label}
        {pending && <span className="spin" aria-hidden="true" />}
      </button>
    </form>
  );
}
