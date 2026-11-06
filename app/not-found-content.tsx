"use client";

import { useEffect, useState } from "react";

const FL: Record<string, string> = {
  id: '<svg viewBox="0 0 24 24"><rect width="24" height="12" fill="#e11d48"/><rect y="12" width="24" height="12" fill="#fff"/></svg>',
  en: '<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#1e3a8a"/><path d="M0 0L24 24M24 0L0 24" stroke="#fff" stroke-width="4"/><path d="M0 0L24 24M24 0L0 24" stroke="#dc2626" stroke-width="1.5"/><path d="M12 0v24M0 12h24" stroke="#fff" stroke-width="7"/><path d="M12 0v24M0 12h24" stroke="#dc2626" stroke-width="4"/></svg>',
  it: '<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#fff"/><rect width="8" height="24" fill="#15803d"/><rect x="16" width="8" height="24" fill="#dc2626"/></svg>',
  es: '<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#c60b1e"/><rect y="6" width="24" height="12" fill="#ffc400"/></svg>',
  fr: '<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#fff"/><rect width="8" height="24" fill="#1d4ed8"/><rect x="16" width="8" height="24" fill="#dc2626"/></svg>',
  de: '<svg viewBox="0 0 24 24"><rect width="24" height="8" fill="#111"/><rect y="8" width="24" height="8" fill="#dd0000"/><rect y="16" width="24" height="8" fill="#ffce00"/></svg>',
  ru: '<svg viewBox="0 0 24 24"><rect width="24" height="8" fill="#fff"/><rect y="8" width="24" height="8" fill="#1c57a5"/><rect y="16" width="24" height="8" fill="#d52b1e"/></svg>',
};

const LN: Record<string, string> = {
  id: "Indonesia", en: "English", it: "Italiano", es: "Español",
  fr: "Français", de: "Deutsch", ru: "Русский",
};

// [judul, sub, tombol beranda, hak cipta]
const T: Record<string, string[]> = {
  id: ["Halaman tidak ditemukan", "Tautan tidak valid atau sudah tidak tersedia.", "Kembali ke Beranda", "© 2026 EMAHAIRSHOP. Seluruh hak cipta dilindungi."],
  en: ["Page not found", "This link is invalid or no longer available.", "Back to Home", "© 2026 EMAHAIRSHOP. All rights reserved."],
  it: ["Pagina non trovata", "Link non valido o non più disponibile.", "Torna alla Home", "© 2026 EMAHAIRSHOP. Tutti i diritti riservati."],
  es: ["Página no encontrada", "Enlace no válido o ya no disponible.", "Volver al inicio", "© 2026 EMAHAIRSHOP. Todos los derechos reservados."],
  fr: ["Page introuvable", "Lien invalide ou plus disponible.", "Retour à l'accueil", "© 2026 EMAHAIRSHOP. Tous droits réservés."],
  de: ["Seite nicht gefunden", "Ungültiger Link oder nicht mehr verfügbar.", "Zurück zur Startseite", "© 2026 EMAHAIRSHOP. Alle Rechte vorbehalten."],
  ru: ["Страница не найдена", "Ссылка недействительна или недоступна.", "На главную", "© 2026 EMAHAIRSHOP. Все права защищены."],
};

export default function NotFoundContent() {
  const [lg, setLg] = useState("id");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let l: string | null = null;
    try { l = localStorage.getItem("lang"); } catch {}
    if (!l) l = (navigator.language || "id").slice(0, 2);
    if (LN[l]) setLg(l);
  }, []);

  useEffect(() => {
    const d = T[lg];
    document.documentElement.lang = lg;
    document.documentElement.dir = "ltr";
    document.title = "EMAHAIRSHOP | " + d[0];
  }, [lg]);

  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const pick = (l: string) => {
    setOpen(false);
    setLg(l);
    try { localStorage.setItem("lang", l); } catch {}
  };

  const d = T[lg];

  return (
    <>
      <div className="lang-wrap">
        <div className={"lw" + (open ? " o" : "")}>
          <button
            className="lb"
            type="button"
            aria-label="Language"
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          >
            <span className="fl" dangerouslySetInnerHTML={{ __html: FL[lg] }} />
            <span className="lc">{lg.toUpperCase()}</span>
            <svg className="c" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div className="lm">
            {Object.keys(LN).map((k) => (
              <button key={k} type="button" className={k === lg ? "a" : ""} onClick={() => pick(k)}>
                <span className="fl" dangerouslySetInnerHTML={{ __html: FL[k] }} />
                {LN[k]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="code" aria-hidden="true">404</div>
      <div className="divider" />
      <h1 style={{ fontSize: "19px", fontWeight: 600, margin: 0 }}>{d[0]}</h1>
      <p className="lead" style={{ margin: "8px 0 32px", fontSize: ".81rem" }}>{d[1]}</p>

      <div className="linklist">
        <a href="https://emahairshop.com/">
          <span className="ico">
            <svg viewBox="0 0 24 24">
              <path d="M3 11l9-8 9 8" />
              <path d="M5 10v10h5v-6h4v6h5V10" />
            </svg>
          </span>
          <span className="t">{d[2]}</span>
        </a>
      </div>

      <p className="foot">{d[3]}</p>
    </>
  );
}
