"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { resetPromptAction, savePromptAction } from "../../actions";
import { MAX_PROMPT_CHARS, type PromptData } from "@/lib/chatai";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

const VARS = [
  { key: "priceFrom", tag: "{{PRICE_FROM}}", label: "Harga mulai", hint: "Satu-satunya harga yang boleh disebut chatbot." },
  { key: "welcomeBonus", tag: "{{WELCOME_BONUS}}", label: "Welcome bonus", hint: "Bonus untuk pendaftar baru." },
] as const;

const count = (text: string, tag: string) => text.split(tag).length - 1;

export function PromptForm({ initial, defaults, saved }: { initial: PromptData; defaults: PromptData; saved: boolean }) {
  const [d, setD] = useState<PromptData>(initial);
  const [showFinal, setShowFinal] = useState(false);
  const [saving, startSave] = useTransition();
  const [resetting, startReset] = useTransition();
  const [editing, setEditing] = useState(!saved);
  const area = useRef<HTMLTextAreaElement>(null);
  const busy = saving || resetting;
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const legacy = d.prompt.includes("{{COMPANY}}");
  const tooLong = d.prompt.length > MAX_PROMPT_CHARS;
  const blocked = legacy || tooLong || !d.prompt.trim();

  useEffect(() => {
    if (!saved) setEditing(true);
  }, [saved]);

  const insert = (tag: string) => {
    const el = area.current;
    const at = el ? el.selectionStart : d.prompt.length;
    const to = el ? el.selectionEnd : at;
    setD((p) => ({ ...p, prompt: p.prompt.slice(0, at) + tag + p.prompt.slice(to) }));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + tag.length, at + tag.length);
    });
  };

  const finalText = () =>
    d.prompt.split("{{PRICE_FROM}}").join(d.priceFrom).split("{{WELCOME_BONUS}}").join(d.welcomeBonus);

  return (
    <div className="pf">
      <style>{`
        .pf-step { margin: 0 0 6px; font-size: .9rem; font-weight: 600; }
        .pf-step i { font-style: normal; display: inline-flex; width: 20px; height: 20px; border-radius: 50%; align-items: center; justify-content: center; margin-right: 8px; background: var(--btn); color: var(--btnt); font-size: .72rem; }
        .pf-sub { margin: 0 0 12px; color: var(--muted); font-size: .8rem; }
        .pf-vars { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 22px; }
        .pf-var { border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 6px; font-size: .82rem; }
        .pf-var .row { display: flex; gap: 8px; align-items: center; }
        .pf-var input { flex: 1; min-width: 0; }
        .pf-var small { color: var(--muted); }
        .pf-var code, .pf-tags code { font-size: .74rem; }
        .pf .pf-chip { padding: 4px 10px; font-size: .74rem; border-radius: 999px; flex: none; }
        .pf-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; justify-content: space-between; margin: 0 0 6px; font-size: .78rem; color: var(--muted); }
        .pf textarea.pf-area { width: 100%; min-height: 420px; max-height: 80vh; padding: 12px 14px; font: inherit; font-family: ui-monospace, Menlo, monospace; font-size: .78rem; line-height: 1.6; resize: vertical; background: var(--bg); color: var(--ink); border: 1px solid var(--line); border-radius: 10px; outline: none; transition: border-color .15s; }
        .pf textarea.pf-area:focus { border-color: var(--gold); }
        .pf-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 0; }
        .pf-tag { font-size: .76rem; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
        .pf-tag.ok { color: var(--ok, #1c6b3a); border-color: currentColor; }
        .pf-tag.warn { color: var(--danger, #b3261e); border-color: currentColor; }
        .pf-err { margin: 10px 0 0; font-size: .8rem; color: var(--danger, #b3261e); }
        .pf details { margin-top: 16px; border: 1px solid var(--line); border-radius: 12px; }
        .pf summary { cursor: pointer; padding: 10px 14px; font-size: .84rem; font-weight: 600; }
        .pf details pre { margin: 0; padding: 12px 14px; max-height: 380px; overflow: auto; border-top: 1px solid var(--line); font-size: .74rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--muted); }
        .pf-dirty { font-size: .78rem; color: var(--muted); align-self: center; }
        .pf-locked-vars { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 0 0 14px; font-size: .82rem; }
        .pf-locked-vars span { color: var(--muted); }
        .pf-locked-vars strong { color: var(--ink); }
        .pf-locked-area { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 260px; overflow: auto; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); font-family: ui-monospace, Menlo, monospace; font-size: .78rem; line-height: 1.6; color: var(--ink); }
      `}</style>

      {saved && !editing ? (
        <>
          <div className="pf-locked-vars">
            {VARS.map((v) => (
              <span key={v.key}>
                {v.label}: <strong>{d[v.key] || "—"}</strong>
              </span>
            ))}
          </div>
          <div className="pf-locked-area">{d.prompt}</div>
          <div className="ma-foot">
            <button type="button" onClick={() => setEditing(true)}>
              Edit
            </button>
          </div>
          <p className="ma-hint">Prompt tersimpan dan terkunci. Klik Edit untuk mengubah.</p>
        </>
      ) : (
        <>
      <p className="pf-step">
        <i>1</i>Angka yang sering berubah
      </p>
      <p className="pf-sub">
        Ubah angkanya di sini, tidak perlu mengedit prompt. Tulis kodenya di prompt dan chatbot menggantinya otomatis.
      </p>
      <div className="pf-vars">
        {VARS.map((v) => (
          <div className="pf-var" key={v.key}>
            <span>
              <strong>{v.label}</strong> <code>{v.tag}</code>
            </span>
            <div className="row">
              <input
                value={d[v.key]}
                maxLength={20}
                aria-label={v.label}
                onChange={(e) => setD({ ...d, [v.key]: e.target.value })}
              />
              <button type="button" className="ghost pf-chip" onClick={() => insert(v.tag)} title="Masukkan kode ini di posisi kursor prompt">
                Sisipkan
              </button>
            </div>
            <small>{v.hint}</small>
          </div>
        ))}
      </div>

      <p className="pf-step">
        <i>2</i>Isi prompt
      </p>
      <p className="pf-sub">
        Satu teks utuh yang dibaca AI setiap ada pesan: info perusahaan, produk, harga, aturan menjawab, dan gaya bicara.
        Edit langsung, tidak ada lagi kolom terpisah.
      </p>
      <div className="pf-meta">
        <span>
          {d.prompt.length.toLocaleString("id-ID")} dari {MAX_PROMPT_CHARS.toLocaleString("id-ID")} karakter · ≈{" "}
          {Math.round(d.prompt.length / 4).toLocaleString("id-ID")} token
        </span>
        {dirty && <span>Ada perubahan yang belum disimpan</span>}
      </div>
      <textarea
        ref={area}
        className="pf-area"
        value={d.prompt}
        spellCheck={false}
        aria-label="Isi prompt chatbot"
        onChange={(e) => setD({ ...d, prompt: e.target.value })}
      />
      <div className="pf-tags" aria-label="Status kode di dalam prompt">
        {VARS.map((v) => {
          const n = count(d.prompt, v.tag);
          const empty = !d[v.key].trim();
          const cls = n && empty ? "warn" : n ? "ok" : "";
          return (
            <span className={`pf-tag ${cls}`} key={v.key}>
              <code>{v.tag}</code>{" "}
              {n && empty ? `dipakai ${n}×, tapi angkanya kosong` : n ? `dipakai ${n}× → ${d[v.key]}` : "belum dipakai di prompt"}
            </span>
          );
        })}
      </div>
      {legacy && (
        <p className="pf-err">
          Ada <code>{"{{COMPANY}}"}</code> di prompt. Kode ini sudah tidak dipakai; tempel info perusahaan langsung di prompt
          lalu hapus kode itu, kalau tidak tombol Simpan tetap mati.
        </p>
      )}
      {tooLong && <p className="pf-err">Prompt terlalu panjang. Kurangi sebagian isinya.</p>}

      <details onToggle={(e) => setShowFinal((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>Lihat teks akhir yang dikirim ke AI</summary>
        {showFinal && <pre>{finalText()}</pre>}
      </details>

      <div className="ma-foot">
        <button
          type="button"
          className={saving ? "is-loading" : ""}
          disabled={busy || blocked || !dirty}
          aria-busy={saving}
          onClick={() => {
            const fd = new FormData();
            fd.set("prompt", d.prompt);
            fd.set("priceFrom", d.priceFrom);
            fd.set("welcomeBonus", d.welcomeBonus);
            startSave(async () => {
              const r = await run(() => savePromptAction(fd));
              flash(r);
              if (r.kind === "ok") setEditing(false);
            });
          }}
        >
          Simpan
          {saving && <span className="spin" aria-hidden="true" />}
        </button>
        {saved && (
          <button
            type="button"
            className="ghost"
            disabled={busy}
            onClick={() => {
              setD(initial);
              setEditing(false);
            }}
          >
            Batal
          </button>
        )}
        <button
          type="button"
          className={"ghost" + (resetting ? " is-loading" : "")}
          disabled={busy}
          aria-busy={resetting}
          onClick={() => {
            if (!window.confirm("Hapus prompt tersimpan dan muat isi bawaan ke editor? Chatbot memakai prompt darurat sampai kamu klik Simpan.")) return;
            startReset(async () => {
              const r = await run(() => resetPromptAction());
              flash(r);
              if (r.kind === "ok") setD(defaults);
            });
          }}
        >
          Kembalikan ke bawaan
          {resetting && <span className="spin" aria-hidden="true" />}
        </button>
      </div>
      <p className="ma-hint">
        Chatbot menambahkan sendiri tanggal hari ini, bahasa pengunjung, dan nama pengunjung di belakang teks ini. Perubahan
        dibaca chatbot dalam ±30 detik.
      </p>
      </>
      )}
    </div>
  );
}
