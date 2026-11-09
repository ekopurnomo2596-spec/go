"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { deletePelangganAction, deletePembelianAction, savePelangganAction } from "../../actions";
import { COUNTRY_CODES, STATUS, fmtTgl, type Pelanggan } from "@/lib/pelanggan-info";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function useCountries() {
  return useMemo(() => {
    let dn: Intl.DisplayNames | null = null;
    try {
      dn = new Intl.DisplayNames(["id"], { type: "region" });
    } catch {
      // browser lama: pakai kode negara
    }
    return COUNTRY_CODES.map((code) => ({ code, name: dn?.of(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name, "id"));
  }, []);
}

/** Kolom negara yang bisa diketik untuk mencari. Nilainya (kode negara) dikirim lewat input tersembunyi. */
function CountryPick({ defaultValue }: { defaultValue: string }) {
  const all = useCountries();
  const nameOf = (c: string) => all.find((x) => x.code === c)?.name ?? "";
  const [code, setCode] = useState(defaultValue);
  const [text, setText] = useState(() => nameOf(defaultValue));
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const list = useMemo(() => {
    const n = norm(q);
    if (!n) return all;
    const hit = all.filter((c) => norm(c.name).includes(n) || c.code.toLowerCase() === n);
    return hit.sort((a, b) => Number(norm(b.name).startsWith(n)) - Number(norm(a.name).startsWith(n)));
  }, [all, q]);

  useEffect(() => {
    listRef.current?.children[hi]?.scrollIntoView({ block: "nearest" });
  }, [hi, open]);

  function pick(c: { code: string; name: string }) {
    setCode(c.code);
    setText(c.name);
    setQ("");
    setOpen(false);
  }

  return (
    <div className="pl-cb">
      <input type="hidden" name="negara" value={code} />
      <input
        id="pl-negara"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="pl-negara-list"
        aria-autocomplete="list"
        aria-activedescendant={open && list[hi] ? `pl-neg-${list[hi].code}` : undefined}
        value={text}
        placeholder="Ketik untuk mencari negara"
        autoComplete="off"
        spellCheck={false}
        onFocus={(e) => {
          setQ("");
          setHi(Math.max(0, all.findIndex((c) => c.code === code)));
          setOpen(true);
          e.currentTarget.select();
        }}
        onChange={(e) => {
          setText(e.target.value);
          setQ(e.target.value);
          setCode("");
          setHi(0);
          setOpen(true);
        }}
        onBlur={() => {
          setOpen(false);
          if (code) {
            setText(nameOf(code));
            return;
          }
          const exact = all.find((c) => norm(c.name) === norm(text));
          if (exact) pick(exact);
          else setText("");
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHi((h) => Math.min(list.length - 1, h + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((h) => Math.max(0, h - 1));
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            if (list[hi]) pick(list[hi]);
          } else if (e.key === "Escape" && open) {
            e.preventDefault(); // tutup daftar saja, jangan tutup jendela
            setOpen(false);
          }
        }}
      />
      {open && (
        <ul id="pl-negara-list" className="pl-cb-list" role="listbox" ref={listRef}>
          {list.length === 0 && <li className="pl-cb-empty">Negara tidak ditemukan</li>}
          {list.map((c, i) => (
            <li
              key={c.code}
              id={`pl-neg-${c.code}`}
              role="option"
              aria-selected={c.code === code}
              className={(i === hi ? "hi " : "") + (c.code === code ? "sel" : "")}
              onMouseDown={(e) => {
                e.preventDefault(); // jangan lepas fokus sebelum terpilih
                pick(c);
              }}
              onMouseEnter={() => setHi(i)}
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Tombol + jendela form. Tanpa `initial` = tambah baru, dengan `initial` = ubah. */
export function PelangganDialog({ initial }: { initial?: Pelanggan }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [delPending, startDel] = useTransition();
  const [beliPending, startBeli] = useTransition();
  const editing = !!initial;
  const busy = pending || delPending || beliPending;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function handleDelete() {
    if (!initial || busy) return;
    if (!window.confirm(`Hapus "${initial.nama}" dari daftar pelanggan?`)) return;
    startDel(async () => {
      let r: Flash;
      try {
        const fd = new FormData();
        fd.set("id", initial.id);
        r = await deletePelangganAction(fd);
      } catch {
        r = { kind: "err", text: "Gagal menghapus. Periksa koneksi lalu coba lagi." };
      }
      flash(r);
      if (r.kind === "ok") setOpen(false);
    });
  }

  function removeBeli(tgl: string) {
    if (!initial || busy) return;
    if (!window.confirm(`Hapus tanggal pembelian ${fmtTgl(tgl)}?`)) return;
    startBeli(async () => {
      let r: Flash;
      try {
        const fd = new FormData();
        fd.set("id", initial.id);
        fd.set("tanggal", tgl);
        r = await deletePembelianAction(fd);
      } catch {
        r = { kind: "err", text: "Gagal menghapus. Periksa koneksi lalu coba lagi." };
      }
      flash(r);
    });
  }

  return (
    <>
      <button type="button" className={editing ? "editbtn" : "btn"} onClick={() => setOpen(true)}>
        {editing ? "Ubah" : "+ Tambah data pelanggan"}
      </button>
      {open && (
        <div
          className="modal-back"
          onClick={() => !busy && setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !e.defaultPrevented && !busy) setOpen(false);
          }}
        >
          <div
            className="modal pl-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editing ? "Ubah pelanggan" : "Tambah pelanggan"}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              .pl-modal { width: min(560px, 100%); max-height: calc(100dvh - 32px); overflow-y: auto; }
              .pl-form { display: flex; flex-direction: column; gap: 14px; }
              .pl-form .pl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
              @media (max-width: 560px) { .pl-form .pl-grid { grid-template-columns: 1fr; } }
              .pl-form .pl-f { display: flex; flex-direction: column; gap: 6px; min-width: 0; position: relative; }
              .pl-form label { font-size: 13px; font-weight: 500; margin: 0; }
              .pl-form .pl-hint { font-size: 12px; opacity: .6; margin: 0; }
              .pl-form input[type="text"], .pl-form input[type="email"], .pl-form input[type="tel"], .pl-form select, .pl-form textarea {
                box-sizing: border-box; width: 100%; padding: 9px 12px; font: inherit; font-size: 14px;
                background: var(--bg); color: var(--ink); border: 1px solid var(--line); border-radius: 10px; outline: none;
              }
              .pl-form textarea { min-height: 84px; resize: vertical; line-height: 1.5; }
              .pl-form input:focus, .pl-form select:focus, .pl-form textarea:focus { border-color: var(--gold); }
              .pl-form .pl-act { display: flex; justify-content: flex-end; gap: 10px; align-items: center; flex-wrap: wrap; }
              .pl-form .pl-act .pl-del { margin-right: auto; }
              .pl-cb { position: relative; }
              .pl-cb-list { position: absolute; z-index: 5; left: 0; right: 0; top: calc(100% + 4px); max-height: 220px; overflow-y: auto; margin: 0; padding: 4px; list-style: none; background: var(--card); border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 14px 40px rgba(0,0,0,.18); }
              .pl-cb-list li { padding: 8px 10px; border-radius: 8px; font-size: 14px; cursor: pointer; }
              .pl-cb-list li.hi { background: var(--bg); }
              .pl-cb-list li.sel { font-weight: 600; }
              .pl-cb-list li.pl-cb-empty { cursor: default; color: var(--muted); }
              .pl-beli { list-style: none; margin: 4px 0 0; padding: 0; border-top: 1px solid var(--line); }
              .pl-beli li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 2px; border-bottom: 1px solid var(--line); font-size: 14px; }
              .pl-beli button { padding: 4px 10px; font-size: 12px; }
            `}</style>
            <div className="modal-head">
              <strong>{editing ? "Ubah pelanggan" : "Tambah pelanggan"}</strong>
              <button type="button" className="modal-x" aria-label="Tutup" onClick={() => !busy && setOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <form
              className="pl-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (pending) return;
                const fd = new FormData(e.currentTarget);
                start(async () => {
                  let r: Flash;
                  try {
                    r = await savePelangganAction(fd);
                  } catch {
                    r = { kind: "err", text: "Gagal menyimpan. Periksa koneksi lalu coba lagi." };
                  }
                  flash(r);
                  if (r.kind === "ok") setOpen(false);
                });
              }}
            >
              {initial && <input type="hidden" name="id" value={initial.id} />}

              <div className="pl-grid">
                <div className="pl-f">
                  <label htmlFor="pl-nama">Nama</label>
                  <input id="pl-nama" name="nama" type="text" defaultValue={initial?.nama ?? ""} maxLength={100} required autoFocus autoComplete="off" />
                </div>
                <div className="pl-f">
                  <label htmlFor="pl-negara">Negara</label>
                  <CountryPick defaultValue={initial?.negara ?? ""} />
                </div>
                <div className="pl-f">
                  <label htmlFor="pl-email">Email</label>
                  <input id="pl-email" name="email" type="email" defaultValue={initial?.email ?? ""} maxLength={120} autoComplete="off" autoCapitalize="off" spellCheck={false} />
                </div>
                <div className="pl-f">
                  <label htmlFor="pl-wa">WhatsApp</label>
                  <input id="pl-wa" name="wa" type="tel" defaultValue={initial?.wa ?? ""} maxLength={25} autoComplete="off" placeholder="+62 812 3456 7890" />
                </div>
                <div className="pl-f">
                  <label htmlFor="pl-hp">Telepon</label>
                  <input id="pl-hp" name="hp" type="tel" defaultValue={initial?.hp ?? ""} maxLength={25} autoComplete="off" />
                </div>
                <div className="pl-f">
                  <label htmlFor="pl-ig">Instagram</label>
                  <input id="pl-ig" name="ig" type="text" defaultValue={initial?.ig ?? ""} maxLength={80} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="username atau tautan profil" />
                </div>
                <div className="pl-f">
                  <label htmlFor="pl-status">Status</label>
                  <select id="pl-status" name="status" defaultValue={initial?.status ?? "prospek"}>
                    {STATUS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pl-f">
                <label htmlFor="pl-catatan">Catatan</label>
                <textarea id="pl-catatan" name="catatan" defaultValue={initial?.catatan ?? ""} maxLength={1000} placeholder="Contoh: minta harga weft 22 inci, follow up minggu depan." />
                <p className="pl-hint">Hanya nama yang wajib diisi. Kolom lain boleh dikosongkan.</p>
              </div>

              <div className="pl-f">
                <label htmlFor="pl-beli">{editing ? "Tambah tanggal pembelian" : "Tanggal pembelian"}</label>
                <input id="pl-beli" name="beli_baru" type="text" inputMode="numeric" placeholder="DD/MM/YYYY" autoComplete="off" maxLength={10} />
                <p className="pl-hint">Boleh dikosongkan. Contoh: 24/03/2026</p>
                {initial && initial.beli.length > 0 && (
                  <ul className="pl-beli" aria-label="Tanggal pembelian tercatat">
                    {initial.beli.map((t) => (
                      <li key={t}>
                        <span>{fmtTgl(t)}</span>
                        <button type="button" className="danger" onClick={() => removeBeli(t)} disabled={busy}>
                          Hapus
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pl-act">
                {editing && (
                  <button
                    type="button"
                    className={"danger pl-del" + (delPending ? " is-loading" : "")}
                    onClick={handleDelete}
                    disabled={busy}
                    aria-busy={delPending}
                  >
                    Hapus
                    {delPending && <span className="spin" aria-hidden="true" />}
                  </button>
                )}
                <button type="button" className="ghost" onClick={() => !busy && setOpen(false)} disabled={busy}>
                  Batal
                </button>
                <button type="submit" className={pending ? "is-loading" : ""} disabled={busy} aria-busy={pending}>
                  {editing ? "Simpan perubahan" : "Tambah pelanggan"}
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
