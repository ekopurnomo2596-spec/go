"use client";

import { useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { saveChatStyleAction } from "../../actions";
import {
  DEFAULT_STYLE,
  STYLE_FIELDS,
  accentText,
  isDefaultStyle,
  type ChatStyle,
  type StyleKey,
} from "@/lib/chatstyle";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

const GROUPS: { title: string; keys: StyleKey[] }[] = [
  { title: "Tombol chat", keys: ["launcher", "pos", "enter"] },
  { title: "Jendela chat", keys: ["panel", "open"] },
  { title: "Pesan", keys: ["bubble", "msg"] },
];

const BUBBLE_R: Record<ChatStyle["bubble"], { a: string; u: string }> = {
  round: { a: "16px", u: "16px" },
  soft: { a: "10px", u: "10px" },
  square: { a: "3px", u: "3px" },
  tail: { a: "16px 16px 16px 4px", u: "16px 16px 4px 16px" },
};
const PANEL_R: Record<ChatStyle["panel"], string> = { sharp: "0", soft: "14px", round: "24px" };
const ENTER_ANIM: Record<ChatStyle["enter"], string> = {
  none: "none",
  fade: "pvFade .5s ease-out both",
  pop: "pvPop .45s cubic-bezier(.34,1.56,.64,1) both",
  slide: "pvUp .5s cubic-bezier(.2,.8,.2,1) both",
  bounce: "pvBounce .8s ease-out both",
};
const OPEN_ANIM: Record<ChatStyle["open"], string> = {
  none: "none",
  fade: "pvFade .22s ease-out .5s both",
  slide: "pvUp .3s cubic-bezier(.2,.8,.2,1) .5s both",
  pop: "pvPop .28s cubic-bezier(.34,1.56,.64,1) .5s both",
};
const MSG_ANIM: Record<ChatStyle["msg"], string> = {
  none: "none",
  fade: "pvFade .25s ease-out",
  slide: "pvMsgUp .28s ease-out",
  pop: "pvMsgPop .26s cubic-bezier(.34,1.56,.64,1)",
};

function Preview({ s }: { s: ChatStyle }) {
  const accent = s.accent || "#1a1a1a";
  const onAccent = s.accent ? accentText(s.accent) : "#ffffff";
  const side = s.pos === "left" ? { left: 12 } : { right: 12 };
  const br = BUBBLE_R[s.bubble];
  const inputR = s.bubble === "square" ? 6 : s.bubble === "soft" ? 12 : 999;
  const sendR = s.bubble === "square" ? 6 : s.bubble === "soft" ? 12 : 999;
  const bubble = (who: "a" | "u", text: string, delay: number) => (
    <div
      style={{
        alignSelf: who === "a" ? "flex-start" : "flex-end",
        maxWidth: "86%",
        padding: "7px 11px",
        fontSize: 12,
        borderRadius: br[who],
        background: who === "a" ? "#f0f0f0" : accent,
        color: who === "a" ? "#111" : onAccent,
        transformOrigin: who === "a" ? "bottom left" : "bottom right",
        animation: MSG_ANIM[s.msg] === "none" ? "none" : `${MSG_ANIM[s.msg]} ${delay}s both`,
      }}
    >
      {text}
    </div>
  );
  return (
    <div className="st-pv">
      <div
        className="st-panel"
        style={{
          ...side,
          borderRadius: PANEL_R[s.panel],
          animation: OPEN_ANIM[s.open],
          transformOrigin: s.pos === "left" ? "bottom left" : "bottom right",
        }}
      >
        <div className="st-head">AI Assistant</div>
        <div className="st-body">
          {bubble("a", "Halo, ada yang bisa dibantu?", 0)}
          {bubble("u", "Harga mulai berapa?", 0.9)}
          {bubble("a", "Harga mulai dari Rp 250.000.", 1.6)}
        </div>
        <div className="st-foot">
          <span className="st-in" style={{ borderRadius: inputR }}>
            Tulis pertanyaanmu…
          </span>
          <span className="st-send" style={{ borderRadius: sendR, background: accent, color: onAccent }}>
            ↑
          </span>
        </div>
      </div>
      <div
        className="st-launch"
        style={{
          ...side,
          background: accent,
          color: onAccent,
          width: s.launcher === "pill" ? "auto" : 40,
          padding: s.launcher === "pill" ? "0 14px" : 0,
          borderRadius: s.launcher === "circle" ? "50%" : s.launcher === "square" ? 14 : 999,
          animation: ENTER_ANIM[s.enter],
        }}
      >
        {s.launcher === "pill" ? "AI Assistant" : "💬"}
      </div>
    </div>
  );
}

export function StyleForm({ initial }: { initial: ChatStyle }) {
  const [s, setS] = useState<ChatStyle>(initial);
  const [run0, setRun] = useState(0); // naikkan = pratinjau dipasang ulang, animasi diputar lagi
  const [saving, start] = useTransition();
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);

  const set = <K extends keyof ChatStyle>(k: K, v: ChatStyle[K]) => {
    setS((p) => ({ ...p, [k]: v }));
    setRun((n) => n + 1);
  };

  return (
    <div className="st">
      <style>{`
        @keyframes pvFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pvUp { from { opacity: 0; transform: translateY(22px) } to { opacity: 1; transform: none } }
        @keyframes pvPop { from { opacity: 0; transform: scale(.86) } to { opacity: 1; transform: none } }
        @keyframes pvBounce { 0% { opacity: 0; transform: translateY(40px) } 55% { opacity: 1; transform: translateY(-10px) } 78% { transform: translateY(4px) } 100% { transform: none } }
        @keyframes pvMsgUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes pvMsgPop { from { opacity: 0; transform: scale(.88) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .st-pv * { animation: none !important } }
        .st-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 22px; align-items: start; }
        @media (max-width: 760px) { .st-layout { grid-template-columns: 1fr; } }
        .st-group { margin-bottom: 18px; }
        .st-group > h3 { margin: 0 0 10px; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 600; }
        .st-field { margin-bottom: 12px; font-size: .82rem; }
        .st-field > span { display: block; margin-bottom: 6px; color: var(--muted); }
        .st-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .st button.st-opt { padding: 5px 12px; font-size: .78rem; border-radius: 999px; background: transparent; color: var(--ink); border: 1px solid var(--line); }
        .st button.st-opt.on { background: var(--btn); color: var(--btnt); border-color: var(--btn); }
        .st-color { display: flex; align-items: center; gap: 8px; }
        .st-color input[type="color"] { width: 44px; height: 32px; padding: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); cursor: pointer; }
        .st-color code { font-size: .78rem; color: var(--muted); }
        .st-pv { height: 330px; overflow: hidden; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); position: sticky; top: 12px; }
        .st-panel { position: absolute; bottom: 62px; width: 226px; height: 210px; display: flex; flex-direction: column; overflow: hidden; background: #fff; border: 1px solid var(--line); box-shadow: 0 10px 28px rgba(0,0,0,.18); }
        .st-head { padding: 8px 12px; font-size: 12px; font-weight: 700; border-bottom: 1px solid var(--line); color: #111; }
        .st-body { flex: 1; min-height: 0; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
        .st-foot { display: flex; gap: 6px; padding: 8px; border-top: 1px solid var(--line); }
        .st-in { flex: 1; padding: 5px 10px; font-size: 11px; color: #888; border: 1px solid var(--line); white-space: nowrap; overflow: hidden; }
        .st-send { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; flex: none; }
        .st-launch { position: absolute; bottom: 12px; height: 40px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; white-space: nowrap; box-shadow: 0 6px 18px rgba(0,0,0,.2); }
      `}</style>

      <div className="st-layout">
        <div>
          {GROUPS.map((g) => (
            <div className="st-group" key={g.title}>
              <h3>{g.title}</h3>
              {g.keys.map((k) => (
                <div className="st-field" key={k}>
                  <span>{STYLE_FIELDS[k].label}</span>
                  <div className="st-chips" role="radiogroup" aria-label={STYLE_FIELDS[k].label}>
                    {(STYLE_FIELDS[k].options as readonly (readonly [string, string])[]).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        role="radio"
                        aria-checked={s[k] === val}
                        className={`st-opt${s[k] === val ? " on" : ""}`}
                        onClick={() => set(k, val as ChatStyle[typeof k])}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {g.title === "Tombol chat" && (
                <>
                  <div className="st-field">
                    <span>Warna tombol dan pesan pengunjung</span>
                    <div className="st-color">
                      <input
                        type="color"
                        value={s.accent || "#1a1a1a"}
                        aria-label="Warna aksen"
                        onChange={(e) => set("accent", e.target.value.toLowerCase())}
                      />
                      <code>{s.accent || "bawaan (hitam di tema terang)"}</code>
                      {s.accent && (
                        <button type="button" className="ghost st-opt" onClick={() => set("accent", "")}>
                          Bawaan
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="st-field">
                    <span>Tombol berdenyut saat ada sapaan atau balasan baru</span>
                    <div className="st-chips" role="radiogroup" aria-label="Denyut tombol">
                      {([[true, "Ya"], [false, "Tidak"]] as const).map(([v, label]) => (
                        <button
                          key={label}
                          type="button"
                          role="radio"
                          aria-checked={s.pulse === v}
                          className={`st-opt${s.pulse === v ? " on" : ""}`}
                          onClick={() => set("pulse", v)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="ma-foot" style={{ marginTop: 0 }}>
            <button
              type="button"
              className={saving ? "is-loading" : ""}
              disabled={saving || !dirty}
              aria-busy={saving}
              onClick={() => {
                const fd = new FormData();
                fd.set("style", JSON.stringify(s));
                start(async () => flash(await run(() => saveChatStyleAction(fd))));
              }}
            >
              Simpan
              {saving && <span className="spin" aria-hidden="true" />}
            </button>
            <button type="button" className="ghost" onClick={() => setRun((n) => n + 1)}>
              Putar ulang animasi
            </button>
            <button
              type="button"
              className="ghost"
              disabled={isDefaultStyle(s)}
              onClick={() => {
                setS({ ...DEFAULT_STYLE });
                setRun((n) => n + 1);
              }}
            >
              Kembalikan ke bawaan
            </button>
          </div>
          <p className="ma-hint">
            Pratinjau di kanan hanya perkiraan. Setelah Simpan, widget di website memakai pengaturan ini dalam ±15
            detik tanpa mengubah kode tempel. Animasi otomatis mati bagi pengunjung yang mengaktifkan “kurangi gerakan”
            di perangkatnya.
          </p>
        </div>
        <Preview key={run0} s={s} />
      </div>
    </div>
  );
}
