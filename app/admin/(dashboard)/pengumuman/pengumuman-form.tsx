"use client";

import { useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { savePengumuman } from "../../actions";

const MAX = 200;

// epoch ms -> "YYYY-MM-DDTHH:mm" dalam WIB (UTC+7), format input datetime-local
const toWib = (ms: number | null) => (ms ? new Date(ms + 7 * 3600_000).toISOString().slice(0, 16) : "");

export function PengumumanForm({ on, text, url, startAt, endAt }: { on: boolean; text: string; url: string; startAt: number | null; endAt: number | null }) {
  const [pending, start] = useTransition();
  const [len, setLen] = useState(text.length);

  return (
    <form
      className="pg-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        start(async () => {
          let r: Flash;
          try {
            r = await savePengumuman(fd);
          } catch {
            r = { kind: "err", text: "Gagal menyimpan. Periksa koneksi lalu coba lagi." };
          }
          flash(r);
        });
      }}
    >
      <style>{`
        .pg-form { display: flex; flex-direction: column; gap: 16px; }
        .pg-form .pg-field { display: flex; flex-direction: column; gap: 6px; }
        .pg-form label.pg-l { font-size: 13px; font-weight: 500; margin: 0; }
        .pg-form .pg-hint { font-size: 12px; opacity: 0.6; margin: 0; }
        .pg-form textarea, .pg-form input[type="url"], .pg-form input[type="datetime-local"] {
          box-sizing: border-box; width: 100%; padding: 9px 12px; font: inherit; font-size: 14px;
          background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; outline: none;
        }
        .pg-form textarea { min-height: 84px; resize: vertical; line-height: 1.5; }
        .pg-form .pg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 520px) { .pg-form .pg-row { grid-template-columns: 1fr; } }
        .pg-form textarea:focus, .pg-form input[type="url"]:focus, .pg-form input[type="datetime-local"]:focus { border-color: #3b6ef0; box-shadow: 0 0 0 3px rgba(59, 110, 240, 0.15); }
        .pg-form .pg-act { display: flex; justify-content: flex-end; }
      `}</style>

      <label className="switch" htmlFor="pg-on">
        <span>Tampilkan di portal</span>
        <input id="pg-on" name="on" type="checkbox" defaultChecked={on} />
        <i aria-hidden="true" />
      </label>

      <div className="pg-field">
        <label className="pg-l" htmlFor="pg-text">Isi pengumuman</label>
        <textarea
          id="pg-text"
          name="text"
          defaultValue={text}
          maxLength={MAX}
          placeholder="Contoh: Libur Lebaran, pesanan dikirim kembali mulai 5 April."
          onChange={(e) => setLen(e.target.value.length)}
        />
        <p className="pg-hint">{len} dari {MAX} karakter. Tulis dalam satu bahasa. Saat disimpan, AI menerjemahkannya otomatis ke 8 bahasa portal.</p>
      </div>

      <div className="pg-field">
        <label className="pg-l" htmlFor="pg-url">Tautan (opsional)</label>
        <input
          id="pg-url"
          name="url"
          type="url"
          defaultValue={url}
          placeholder="https://"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={500}
        />
        <p className="pg-hint">Kalau diisi, seluruh kotak pengumuman bisa diklik.</p>
      </div>

      <div className="pg-row">
        <div className="pg-field">
          <label className="pg-l" htmlFor="pg-start">Mulai tampil (opsional)</label>
          <input id="pg-start" name="start" type="datetime-local" defaultValue={toWib(startAt)} />
        </div>
        <div className="pg-field">
          <label className="pg-l" htmlFor="pg-end">Berhenti tampil (opsional)</label>
          <input id="pg-end" name="end" type="datetime-local" defaultValue={toWib(endAt)} />
        </div>
      </div>
      <p className="pg-hint">Waktu dalam WIB. Kosongkan untuk tampil langsung / tanpa batas akhir. Pengumuman muncul dan hilang otomatis, tidak perlu cron. Tetap aktifkan saklar "Tampilkan di portal".</p>

      <div className="pg-act">
        <button type="submit" className={pending ? "is-loading" : ""} disabled={pending} aria-busy={pending}>
          Simpan
          {pending && <span className="spin" aria-hidden="true" />}
        </button>
      </div>
    </form>
  );
}
