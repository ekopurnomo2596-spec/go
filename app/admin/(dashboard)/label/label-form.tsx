"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { previewLabelTranslations, saveLabels } from "../../actions";

const COLORS = { merah: "#EE4D2D", emas: "#a8802f", hijau: "#1f8a4c", hitam: "#1a1a1a" } as const;
const LANGS = ["en", "id", "it", "es", "fr", "de", "ru"] as const;
type Lang = (typeof LANGS)[number];
type Tx = Partial<Record<Lang, string>>;
type Item = { on: boolean; text: string; color: keyof typeof COLORS; anim: boolean; texts: Tx };
const MAX = 14;
// Pratinjau = halaman portal ASLI (CSS dan markup asli) di dalam iframe. Label yang belum disimpan dikirim lewat postMessage.
const PORTAL = "https://emahairshop.com";
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

export function LabelForm({
  buttons,
  initial,
}: {
  buttons: { key: string; name: string }[];
  initial: Record<string, Partial<Item>>;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [saving, startSave] = useTransition();
  const [trans, startTrans] = useTransition();
  const [lang, setLang] = useState<Lang>("id");
  const [v, setV] = useState<Record<string, Item>>(() =>
    Object.fromEntries(
      buttons.map((b) => {
        const i = initial[b.key];
        return [b.key, { on: !!i?.on, text: i?.text ?? "", color: i?.color ?? "merah", anim: !!i?.anim, texts: i?.texts ?? {} }];
      }),
    ),
  );
  // Teks yang menjadi dasar terjemahan tiap label. Awalnya teks tersimpan (kalau sudah punya terjemahan).
  const [tFor, setTFor] = useState<Record<string, string>>(() =>
    Object.fromEntries(buttons.map((b) => [b.key, Object.keys(initial[b.key]?.texts ?? {}).length ? norm(initial[b.key]?.text ?? "") : ""])),
  );
  const set = (k: string, p: Partial<Item>) => setV((s) => ({ ...s, [k]: { ...s[k], ...p } }));

  const live = (k: string) => v[k].on && !!norm(v[k].text);
  const stale = (k: string) => live(k) && tFor[k] !== norm(v[k].text);
  const needKeys = buttons.filter((b) => stale(b.key)).map((b) => b.key);

  const fr = useRef<HTMLIFrameElement>(null);
  const payload = {
    type: "lblpv",
    lang,
    labels: Object.fromEntries(
      buttons.filter((b) => live(b.key)).map((b) => [b.key, { t: norm(v[b.key].text), c: v[b.key].color, a: v[b.key].anim ? 1 : 0, x: stale(b.key) ? {} : v[b.key].texts }]),
    ),
  };
  const send = () => fr.current?.contentWindow?.postMessage(payload, PORTAL);
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    send();
  });
  useEffect(() => {
    const h = (e: MessageEvent) => {
      if (e.origin === PORTAL && (e.data as { type?: string } | null)?.type === "lblpv-ready") sendRef.current();
    };
    window.addEventListener("message", h);
    return () => window.removeEventListener("message", h);
  }, []);

  const translate = () => {
    if (!ref.current || trans || !needKeys.length) return;
    const fd = new FormData(ref.current);
    const snap: Record<string, string> = {};
    for (const k of needKeys) {
      fd.set(`need_${k}`, "1");
      snap[k] = norm(v[k].text);
    }
    startTrans(async () => {
      let r: Flash & { texts?: Record<string, Tx> };
      try {
        r = await previewLabelTranslations(fd);
      } catch {
        r = { kind: "err", text: "Gagal menerjemahkan. Periksa koneksi lalu coba lagi." };
      }
      if (r.texts) {
        const got = r.texts;
        setV((s) => {
          const n = { ...s };
          for (const k of Object.keys(got)) n[k] = { ...n[k], texts: got[k] };
          return n;
        });
        setTFor((s) => {
          const n = { ...s };
          for (const k of Object.keys(got)) n[k] = snap[k];
          return n;
        });
      }
      flash(r);
    });
  };

  return (
    <form
      ref={ref}
      className="lb-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (saving || trans || needKeys.length) return;
        const fd = new FormData(e.currentTarget);
        startSave(async () => {
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
        .lb-ctl { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
        .lb-form input[type="text"] { box-sizing: border-box; height: 38px; padding: 0 12px; font: inherit; font-size: 14px; background: #fff; border: 1px solid #e0e0e0; border-radius: 0; outline: none; }
        .lb-form input[type="text"]:focus { border-color: #3b6ef0; box-shadow: 0 0 0 3px rgba(59, 110, 240, 0.15); }
        .lb-ctl input[type="text"] { flex: 1; min-width: 140px; }
        .lb-sw { display: flex; gap: 8px; }
        .lb-sw label { position: relative; width: 26px; height: 26px; cursor: pointer; }
        .lb-sw input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
        .lb-sw i { position: absolute; inset: 0; border-radius: 0; box-shadow: 0 0 0 1px #e0e0e0; }
        .lb-sw input:checked + i { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #111; }
        .lb-sw input:focus-visible + i { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #3b6ef0; }
        .lb-state { font-size: 12px; opacity: 0.65; }
        .lb-state.warn { color: #b45309; opacity: 1; }
        .lb-det { font-size: 13px; }
        .lb-det summary { display: flex; align-items: center; gap: 8px; padding: 2px 0; font-size: 13px; font-weight: 600; cursor: pointer; opacity: 0.75; }
        .lb-det summary::before { content: ""; width: 6px; height: 6px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(-45deg); transition: transform 0.2s; }
        .lb-det[open] summary::before { transform: rotate(45deg); }
        .lb-tr { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
        .lb-tr label { display: flex; flex-direction: column; gap: 4px; margin: 0; }
        .lb-tr b { font-size: 11px; text-transform: uppercase; opacity: 0.6; }
        .lb-tr input[type="text"] { width: 100%; min-width: 0; height: 32px; font-size: 13px; }
        @media (max-width: 640px) { .lb-tr { grid-template-columns: repeat(2, 1fr); } }
        .lb-anim { font-size: 13px; cursor: default; }
        .lb-on { cursor: default; }
        .lb-anim-sw { display: flex; margin: 0; cursor: pointer; }
        .lb-pv { margin-top: 20px; }
        .lb-pv h3 { margin: 0 0 8px; font-size: 14px; }
        .lb-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .lb-chips button { height: 30px; padding: 0 10px; font: inherit; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #111; background: #fff; border: 1px solid #e0e0e0; border-radius: 0; cursor: pointer; }
        .lb-chips button[aria-pressed="true"] { background: #111; color: #fff; border-color: #111; }
        .lb-frame { display: block; width: 100%; max-width: 480px; height: 660px; margin: 0 auto; border: 1px solid #e5e5e5; background: #fafafa; }
        .lb-act { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding-top: 16px; }
        .lb-act .lb-btns { display: flex; gap: 10px; margin-inline-start: auto; }
        .lb-btn2 { height: 38px; padding: 0 16px; font: inherit; font-size: 14px; font-weight: 600; color: #111; background: #fff; border: 1px solid #111; border-radius: 0; cursor: pointer; }
        .lb-btn2:disabled { opacity: 0.45; cursor: default; }
      `}</style>

      {buttons.map((b) => {
        const it = v[b.key];
        const hasTr = Object.keys(it.texts).length > 0;
        return (
          <div className="lb-row" key={b.key}>
            <div className="lb-head">
              <span>{b.name}</span>
              <div className="switch lb-on">
                <span>Tampil</span>
                <label className="lb-anim-sw" htmlFor={`on-${b.key}`} aria-label={`Tampilkan label ${b.name}`}>
                  <input id={`on-${b.key}`} name={`on_${b.key}`} type="checkbox" checked={it.on} onChange={(e) => set(b.key, { on: e.target.checked })} />
                  <i aria-hidden="true" />
                </label>
              </div>
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
            <div className="switch lb-anim">
              <span>Tampilkan animasi (kilau halus)</span>
              <label className="lb-anim-sw" htmlFor={`anim-${b.key}`} aria-label={`Tampilkan animasi label ${b.name}`}>
                <input id={`anim-${b.key}`} name={`anim_${b.key}`} type="checkbox" checked={it.anim} onChange={(e) => set(b.key, { anim: e.target.checked })} />
                <i aria-hidden="true" />
              </label>
            </div>
            <input type="hidden" name={`texts_${b.key}`} value={JSON.stringify(it.texts)} />
            {live(b.key) && (
              <div className={"lb-state" + (stale(b.key) ? " warn" : "")}>
                {stale(b.key) ? "Belum diterjemahkan ke 7 bahasa." : "Sudah diterjemahkan ke 7 bahasa."}
              </div>
            )}
            {hasTr && !stale(b.key) && (
              <details className="lb-det">
                <summary>Lihat atau ubah terjemahan</summary>
                <div className="lb-tr">
                  {LANGS.map((l) => (
                    <label key={l}>
                      <b>{l}</b>
                      <input
                        type="text"
                        value={it.texts[l] ?? ""}
                        maxLength={20}
                        aria-label={`Label ${b.name} bahasa ${l}`}
                        onChange={(e) => set(b.key, { texts: { ...it.texts, [l]: e.target.value } })}
                      />
                    </label>
                  ))}
                </div>
              </details>
            )}
          </div>
        );
      })}

      <div className="lb-pv">
        <h3>Pratinjau di portal</h3>
        <div className="lb-chips" role="group" aria-label="Bahasa pratinjau">
          {LANGS.map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l}
            </button>
          ))}
        </div>
        <iframe ref={fr} className="lb-frame" src={`${PORTAL}/?lblpv=1`} title="Pratinjau portal" onLoad={() => send()} />
        <p className="lb-state" style={{ margin: "8px 0 0" }}>
          Label yang belum diterjemahkan tampil dengan teks aslinya. Maksimal {MAX} karakter. Perubahan muncul di portal dalam beberapa detik setelah disimpan.
        </p>
      </div>

      <div className="lb-act">
        <span className={"lb-state" + (needKeys.length ? " warn" : "")}>
          {needKeys.length ? `${needKeys.length} label perlu diterjemahkan dulu sebelum disimpan.` : "Siap disimpan."}
        </span>
        <div className="lb-btns">
          <button type="button" className="lb-btn2" onClick={translate} disabled={trans || saving || !needKeys.length} aria-busy={trans}>
            {trans ? "Menerjemahkan..." : "Terjemahkan dan pratinjau"}
          </button>
          <button type="submit" className={saving ? "is-loading" : ""} disabled={saving || trans || needKeys.length > 0} aria-busy={saving}>
            Simpan
            {saving && <span className="spin" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </form>
  );
}
