"use client";

import { useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { saveLabels } from "../../actions";

const COLORS = { merah: "#EE4D2D", emas: "#a8802f", hijau: "#1f8a4c", hitam: "#1a1a1a" } as const;
const MAX = 14;
type Item = { on: boolean; text: string; color: keyof typeof COLORS };

export function LabelForm({ buttons, initial }: { buttons: { key: string; name: string }[]; initial: Record<string, Item> }) {
  const [pending, start] = useTransition();
  const [v, setV] = useState<Record<string, Item>>(() =>
    Object.fromEntries(buttons.map((b) => [b.key, initial[b.key] ?? { on: false, text: "", color: "merah" }])),
  );
  const set = (k: string, p: Partial<Item>) => setV((s) => ({ ...s, [k]: { ...s[k], ...p } }));

  return (
    <form
      className="lb-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        start(async () => {
          let r: Flash;
          try {
            r = await saveLabels(fd);
          } catch {
            r = { kind: "err", text: "Gagal menyimpan. Periksa koneksi lalu coba lagi." };
          }
          flash(r);
        });
      }}
    >
      <style>{`
        .lb-form { display: flex; flex-direction: column; }
        .lb-row { display: grid; gap: 10px; padding: 14px 0; border-bottom: 1px solid #e5e5e5; }
        .lb-row:first-child { padding-top: 0; }
        .lb-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-weight: 600; font-size: 14px; }
        .lb-tag { display: inline-block; margin-inline-start: 8px; padding: 3px 6px; border-radius: 3px; color: #fff; font-size: 11px; font-weight: 600; line-height: 1.2; vertical-align: middle; }
        .lb-ctl { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
        .lb-ctl input[type="text"] { flex: 1; min-width: 140px; height: 38px; box-sizing: border-box; padding: 0 12px; font: inherit; font-size: 14px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; outline: none; }
        .lb-ctl input[type="text"]:focus { border-color: #3b6ef0; box-shadow: 0 0 0 3px rgba(59, 110, 240, 0.15); }
        .lb-sw { display: flex; gap: 8px; }
        .lb-sw label { position: relative; width: 26px; height: 26px; cursor: pointer; }
        .lb-sw input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
        .lb-sw i { position: absolute; inset: 0; border-radius: 6px; box-shadow: 0 0 0 1px #e0e0e0; }
        .lb-sw input:checked + i { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #111; }
        .lb-sw input:focus-visible + i { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #3b6ef0; }
        .lb-act { display: flex; justify-content: flex-end; padding-top: 16px; }
      `}</style>

      {buttons.map((b) => {
        const it = v[b.key];
        return (
          <div className="lb-row" key={b.key}>
            <div className="lb-head">
              <span>
                {b.name}
                {it.on && it.text && (
                  <span className="lb-tag" style={{ background: COLORS[it.color] }}>
                    {it.text}
                  </span>
                )}
              </span>
              <label className="switch" htmlFor={`on-${b.key}`}>
                <span>Tampil</span>
                <input id={`on-${b.key}`} name={`on_${b.key}`} type="checkbox" checked={it.on} onChange={(e) => set(b.key, { on: e.target.checked })} />
                <i aria-hidden="true" />
              </label>
            </div>
            <div className="lb-ctl">
              <input
                type="text"
                name={`text_${b.key}`}
                value={it.text}
                maxLength={MAX}
                placeholder="Contoh: BARU"
                aria-label={`Teks label ${b.name}`}
                onChange={(e) => set(b.key, { text: e.target.value, ...(e.target.value && !it.on ? { on: true } : {}) })}
              />
              <div className="lb-sw" role="radiogroup" aria-label={`Warna label ${b.name}`}>
                {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map((c) => (
                  <label key={c} title={c}>
                    <input type="radio" name={`color_${b.key}`} value={c} checked={it.color === c} onChange={() => set(b.key, { color: c })} aria-label={c} />
                    <i style={{ background: COLORS[c] }} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      <p style={{ fontSize: 12, opacity: 0.6, margin: "12px 0 0" }}>Maksimal {MAX} karakter per label. Satu teks dipakai untuk semua bahasa portal. Perubahan tampil di portal dalam beberapa detik.</p>

      <div className="lb-act">
        <button type="submit" className={pending ? "is-loading" : ""} disabled={pending} aria-busy={pending}>
          Simpan
          {pending && <span className="spin" aria-hidden="true" />}
        </button>
      </div>
    </form>
  );
}
