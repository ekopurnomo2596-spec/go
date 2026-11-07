"use client";

import { useState, useTransition } from "react";
import { flash, type Flash } from "@/lib/flash";
import { resetModelsAction, saveModelsAction, suggestModelsAction, testModelAction } from "../../actions";

async function run(fn: () => Promise<Flash>): Promise<Flash> {
  try {
    return await fn();
  } catch {
    return { kind: "err", text: "Gagal. Periksa koneksi lalu coba lagi." };
  }
}

export function ModelsForm({ initial, hasKey }: { initial: string[]; hasKey: boolean }) {
  const [models, setModels] = useState<string[]>(initial);
  const [add, setAdd] = useState("");
  const [sugg, setSugg] = useState<string[] | null>(null);
  const [testRow, setTestRow] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [resetting, startReset] = useTransition();
  const [loadingSugg, startSugg] = useTransition();
  const busy = saving || resetting || testRow !== null;

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= models.length) return;
    const next = models.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setModels(next);
  }
  function remove(i: number) {
    setModels(models.filter((_, k) => k !== i));
  }
  function addModel(name: string) {
    const v = name.trim();
    if (!v) return;
    if (models.includes(v)) {
      setAdd("");
      return;
    }
    if (models.length >= 8) {
      flash({ kind: "err", text: "Maksimal 8 model." });
      return;
    }
    setModels([...models, v]);
    setAdd("");
  }

  async function testOne(m: string) {
    setTestRow(m);
    const fd = new FormData();
    fd.set("model", m);
    flash(await run(() => testModelAction(fd)));
    setTestRow(null);
  }

  return (
    <div>
      {models.length === 0 && (
        <p className="ma-hint" style={{ margin: "0 0 10px" }}>
          Belum pernah diatur dari sini — chatbot masih pakai daftar bawaan di environment portal. Tambahkan
          model di bawah lalu Simpan kalau mau mulai mengatur dari sini.
        </p>
      )}
      <ol style={{ listStyle: "none", margin: "0 0 12px", padding: 0 }}>
        {models.map((m, i) => (
          <li key={m} className="ma-row">
            <span className="ma-num">{i + 1}</span>
            <span className="ma-name">{m}</span>
            <button type="button" className="ghost" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Naikkan urutan">
              ↑
            </button>
            <button
              type="button"
              className="ghost"
              disabled={busy || i === models.length - 1}
              onClick={() => move(i, 1)}
              aria-label="Turunkan urutan"
            >
              ↓
            </button>
            <button
              type="button"
              className={"ghost" + (testRow === m ? " is-loading" : "")}
              disabled={busy || !hasKey}
              title={hasKey ? "Tes model ini" : "Isi token Gemini dulu"}
              onClick={() => testOne(m)}
            >
              Tes
            </button>
            <button type="button" className="danger" disabled={busy} onClick={() => remove(i)}>
              Hapus
            </button>
          </li>
        ))}
      </ol>

      <div className="ma-add">
        <input
          placeholder="mis. gemini-2.5-flash"
          value={add}
          onChange={(e) => setAdd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addModel(add);
            }
          }}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={60}
        />
        <button type="button" onClick={() => addModel(add)} disabled={busy}>
          Tambah
        </button>
      </div>

      {hasKey && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            className={"ghost" + (loadingSugg ? " is-loading" : "")}
            disabled={busy || loadingSugg}
            onClick={() => startSugg(async () => setSugg(await suggestModelsAction()))}
          >
            Lihat model tersedia
            {loadingSugg && <span className="spin" aria-hidden="true" />}
          </button>
          {sugg && (
            <div className="ma-sugg">
              {sugg.length === 0 && <span className="ma-hint" style={{ margin: 0 }}>Tidak ada saran (token belum valid atau Google sedang bermasalah).</span>}
              {sugg
                .filter((s) => !models.includes(s))
                .map((s) => (
                  <button type="button" key={s} className="ghost" onClick={() => addModel(s)} disabled={busy}>
                    + {s}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="ma-foot">
        <button
          type="button"
          className={saving ? "is-loading" : ""}
          disabled={busy || !models.length}
          aria-busy={saving}
          onClick={() => {
            const fd = new FormData();
            models.forEach((m) => fd.append("model", m));
            startSave(async () => flash(await run(() => saveModelsAction(fd))));
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
            if (!window.confirm("Kembalikan ke daftar bawaan? Pengaturan dari sini akan dihapus.")) return;
            startReset(async () => {
              const r = await run(() => resetModelsAction());
              flash(r);
              if (r.kind === "ok") setModels([]);
            });
          }}
        >
          Kembalikan ke bawaan
          {resetting && <span className="spin" aria-hidden="true" />}
        </button>
      </div>
      <div className="ma-hint">
        Urutan penting: model paling atas jadi pilihan utama. Nama model hanya huruf, angka, titik, dan minus.
      </div>
    </div>
  );
}
