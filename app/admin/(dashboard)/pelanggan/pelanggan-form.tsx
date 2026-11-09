"use client";

import { useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { flash, type Flash } from "@/lib/flash";
import { savePelangganAction } from "../../actions";
import { STATUS, type Pelanggan } from "@/lib/pelanggan";

export function PelangganForm({ initial, countries }: { initial?: Pelanggan; countries: { code: string; name: string }[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const editing = !!initial;

  return (
    <form
      ref={ref}
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
          if (r.kind !== "ok") return;
          if (editing) router.push("/admin/pelanggan");
          else ref.current?.reset();
        });
      }}
    >
      <style>{`
        .pl-form { display: flex; flex-direction: column; gap: 14px; }
        .pl-form .pl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 560px) { .pl-form .pl-grid { grid-template-columns: 1fr; } }
        .pl-form .pl-f { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .pl-form label { font-size: 13px; font-weight: 500; margin: 0; }
        .pl-form .pl-hint { font-size: 12px; opacity: .6; margin: 0; }
        .pl-form input, .pl-form select, .pl-form textarea {
          box-sizing: border-box; width: 100%; padding: 9px 12px; font: inherit; font-size: 14px;
          background: var(--bg); color: var(--ink); border: 1px solid var(--line); border-radius: 10px; outline: none;
        }
        .pl-form textarea { min-height: 84px; resize: vertical; line-height: 1.5; }
        .pl-form input:focus, .pl-form select:focus, .pl-form textarea:focus { border-color: var(--gold); }
        .pl-form .pl-act { display: flex; justify-content: flex-end; gap: 10px; align-items: center; }
      `}</style>

      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="pl-grid">
        <div className="pl-f">
          <label htmlFor="pl-nama">Nama</label>
          <input id="pl-nama" name="nama" type="text" defaultValue={initial?.nama ?? ""} maxLength={100} required autoComplete="off" />
        </div>
        <div className="pl-f">
          <label htmlFor="pl-perusahaan">Salon / perusahaan</label>
          <input id="pl-perusahaan" name="perusahaan" type="text" defaultValue={initial?.perusahaan ?? ""} maxLength={100} autoComplete="off" />
        </div>
        <div className="pl-f">
          <label htmlFor="pl-negara">Negara</label>
          <select id="pl-negara" name="negara" defaultValue={initial?.negara ?? ""}>
            <option value="">Belum dipilih</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
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
      </div>

      <div className="pl-f">
        <label htmlFor="pl-catatan">Catatan</label>
        <textarea id="pl-catatan" name="catatan" defaultValue={initial?.catatan ?? ""} maxLength={1000} placeholder="Contoh: minta harga weft 22 inci, follow up minggu depan." />
        <p className="pl-hint">Hanya nama yang wajib diisi. Kolom lain boleh dikosongkan.</p>
      </div>

      <div className="pl-act">
        {editing && (
          <Link href="/admin/pelanggan" className="btn ghost">
            Batal
          </Link>
        )}
        <button type="submit" className={pending ? "is-loading" : ""} disabled={pending} aria-busy={pending}>
          {editing ? "Simpan perubahan" : "Tambah pelanggan"}
          {pending && <span className="spin" aria-hidden="true" />}
        </button>
      </div>
    </form>
  );
}
