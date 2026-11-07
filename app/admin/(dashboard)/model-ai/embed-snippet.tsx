"use client";

import { useState } from "react";
import { flash } from "@/lib/flash";

const SRC = "https://emahairshop.com/widget.js";
const LANGS: [string, string][] = [
  ["", "Otomatis (ikut bahasa situs)"],
  ["id", "Indonesia"],
  ["en", "English"],
  ["it", "Italiano"],
  ["es", "Español"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["ru", "Русский"],
];

export function EmbedSnippet() {
  const [lang, setLang] = useState("");
  const [theme, setTheme] = useState("light");

  const attrs = (lang ? ` data-lang="${lang}"` : "") + (theme === "dark" ? ` data-theme="dark"` : "");
  const code = `<script src="${SRC}"${attrs} defer></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      flash({ kind: "ok", text: "Kode disalin." });
    } catch {
      flash({ kind: "err", text: "Gagal menyalin. Salin manual dari kotak di atas." });
    }
  }

  return (
    <div>
      <div className="pr-vars">
        <label>
          Bahasa
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tema
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Terang</option>
            <option value="dark">Gelap</option>
          </select>
        </label>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "12px 14px",
          border: "1px solid var(--line)",
          borderRadius: 8,
          overflowX: "auto",
          fontSize: ".8rem",
          userSelect: "all",
        }}
      >
        <code>{code}</code>
      </pre>
      <div className="ma-foot" style={{ marginTop: 12 }}>
        <button type="button" onClick={copy}>
          Salin kode
        </button>
      </div>
      <p className="ma-hint">
        Tempel di sebelum <code>&lt;/body&gt;</code> tiap subdomain (shop, track, verify, dst). Jangan dipasang di
        portal emahairshop.com — chat bawaannya sudah ada, nanti dobel. Widget otomatis berhenti kalau halaman sudah
        punya chat. Menyala/mati ikut saklar di atas.
      </p>
    </div>
  );
}
