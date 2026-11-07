"use client";

import { useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { resetPromptAction, savePromptAction } from "../../actions";
import type { PromptData } from "@/lib/chatai";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function PromptForm({ initial, defaults }: { initial: PromptData; defaults: PromptData }) {
  const [d, setD] = useState<PromptData>(initial);
  const [saving, startSave] = useTransition();
  const [resetting, startReset] = useTransition();
  const busy = saving || resetting;
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const missing = !d.system.includes("{{COMPANY}}");

  return (
    <div>
      <div className="pr-vars">
        <label>
          <span>Harga mulai {"{{PRICE_FROM}}"}</span>
          <input value={d.priceFrom} maxLength={20} onChange={(e) => setD({ ...d, priceFrom: e.target.value })} />
        </label>
        <label>
          <span>Welcome bonus {"{{WELCOME_BONUS}}"}</span>
          <input value={d.welcomeBonus} maxLength={20} onChange={(e) => setD({ ...d, welcomeBonus: e.target.value })} />
        </label>
      </div>

      <label className="pr-field">
        <span>
          Info perusahaan <small>{d.company.length.toLocaleString("id-ID")} karakter</small>
        </span>
        <textarea
          value={d.company}
          rows={14}
          spellCheck={false}
          onChange={(e) => setD({ ...d, company: e.target.value })}
        />
      </label>

      <label className="pr-field">
        <span>
          Prompt utama <small>{d.system.length.toLocaleString("id-ID")} karakter</small>
        </span>
        <textarea
          value={d.system}
          rows={18}
          spellCheck={false}
          onChange={(e) => setD({ ...d, system: e.target.value })}
        />
      </label>
      {missing && (
        <p className="ma-hint" style={{ color: "var(--danger, #c0392b)" }}>
          Prompt utama harus memuat {"{{COMPANY}}"}, kalau tidak Info perusahaan tidak dikirim ke AI.
        </p>
      )}

      <div className="ma-foot">
        <button
          type="button"
          className={saving ? "is-loading" : ""}
          disabled={busy || missing || !dirty}
          aria-busy={saving}
          onClick={() => {
            const fd = new FormData();
            fd.set("system", d.system);
            fd.set("company", d.company);
            fd.set("priceFrom", d.priceFrom);
            fd.set("welcomeBonus", d.welcomeBonus);
            startSave(async () => flash(await run(() => savePromptAction(fd))));
          }}
        >
          Simpan
          {saving && <span className="spin" aria-hidden="true" />}
        </button>
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
      <div className="ma-hint">
        Placeholder {"{{COMPANY}}"}, {"{{PRICE_FROM}}"}, {"{{WELCOME_BONUS}}"} diganti otomatis oleh portal. Tanggal, bahasa
        pengunjung, dan nama pengunjung ditambahkan portal di belakang prompt ini.
      </div>
    </div>
  );
}
