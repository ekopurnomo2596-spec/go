import { NextResponse } from "next/server";

export function notFoundResponse() {
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>EMAHAIRSHOP | Halaman tidak ditemukan</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><style>
:root{color-scheme:light dark;--bg:#fafafa;--card:#fff;--line:#e5e5e5;--lineh:#c4c4c4;--ico:#f0f0f0;--icos:#404040;--ink:#111;--muted:#666;--gold:#a8802f}
@media (prefers-color-scheme:dark){:root{--bg:#101010;--card:#171715;--line:#2a2a2a;--lineh:#3a3a3a;--ico:#201f1c;--icos:#cfcfcb;--ink:#f4f4f2;--muted:#9a9a96}}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;min-height:100vh}
.nav{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:16px max(20px,calc((100% - 400px)/2 + 20px));background:var(--bg)}
@media(max-width:600px){.nav{padding-block:12px}}
.public{width:100%;max-width:400px;margin:0 auto;padding:56px 16px 48px;text-align:center}
.lg{text-decoration:none;display:flex;align-items:center}
.logo-nav-container{display:flex;flex-direction:column;align-items:center;justify-content:center;width:max-content}
.logo-nav-container .logo-top{display:flex;align-items:center;width:100%;margin-bottom:-1px}
.logo-nav-container .line-top{height:2px;background:var(--ink);flex-grow:1;margin-right:4px}
.logo-nav-container .text-ext{color:var(--ink);font-family:Lato,Inter,sans-serif;font-weight:900;font-size:.35rem;letter-spacing:2px;text-transform:uppercase;margin-right:-2px}
.logo-nav-container .logo-main{color:var(--ink);font-family:"Arial Black",Lato,sans-serif;font-weight:900;font-size:1.1rem;letter-spacing:.5px;line-height:1.1;text-transform:uppercase;text-align:center;margin-right:-.5px}
.logo-nav-container .line-bottom{width:100%;height:2px;background:var(--ink);margin:0 0 2px}
.logo-nav-container .logo-year{color:#906A00;font-family:Lato,Inter,sans-serif;font-weight:900;font-size:.45rem;letter-spacing:1.5px;text-align:center;margin-right:-1.5px}
.code{font-size:clamp(72px,22vw,104px);font-weight:600;line-height:1.1;letter-spacing:-2px}
.divider{width:56px;height:2px;background:var(--lineh);margin:22px auto}
h1{font-size:19px;font-weight:600}
p.sub{color:var(--muted);font-size:13px;margin:8px 0 32px}
.linklist a{display:flex;align-items:center;gap:16px;width:100%;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;text-decoration:none;font-weight:600;font-size:15px;color:var(--ink)}
.ico{width:44px;height:44px;border-radius:12px;background:var(--ico);display:grid;place-items:center;flex:none}
.ico svg{width:20px;height:20px;stroke:var(--icos);fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.foot{margin-top:36px;color:var(--muted);font-size:11px}
.lw{position:relative}
.lb{display:flex;align-items:center;gap:8px;height:42px;padding:0 14px 0 8px;border-radius:99px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:600 14px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.06)}
.lb svg.c{width:14px;height:14px;stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .25s}
.lw.o .lb svg.c{transform:rotate(180deg)}
.fl{width:26px;height:26px;border-radius:50%;overflow:hidden;display:block;flex:none;border:1px solid var(--line)}
.fl svg{width:100%;height:100%;display:block}
#lc{display:inline-block;min-width:24px;text-align:center}
.lm{position:absolute;right:0;top:calc(100% + 8px);min-width:170px;max-height:60vh;overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:6px;box-shadow:0 14px 40px rgba(0,0,0,.18);opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .2s,transform .2s,visibility .2s}
.lw.o .lm{opacity:1;visibility:visible;transform:none}
.lm button{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;border-radius:11px;padding:9px 10px;color:var(--ink);font:500 14px Inter,system-ui,sans-serif;cursor:pointer;text-align:left}
.lm button:hover,.lm button.a{background:var(--ico)}
.lm button.a{font-weight:700}
[dir=rtl] .lm{right:auto;left:0}
[dir=rtl] .linklist a{text-align:right}
</style></head><body><header class="nav"><a class="lg" href="https://emahairshop.com/"><div class="logo-nav-container"><div class="logo-top"><span class="line-top"></span><span class="text-ext">Extension</span></div><div class="logo-main">EMAHAIRSHOP</div><div class="line-bottom"></div><div class="logo-year">2019</div></div></a><div class="lw" id="lw"><button class="lb" id="lb" type="button" aria-label="Language"><span class="fl" id="lf"></span><span id="lc">ID</span><svg class="c" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button><div class="lm" id="lmn"></div></div></header><main class="public"><div class="code">404</div><div class="divider"></div><h1 data-i="0">Halaman tidak ditemukan</h1><p class="sub" data-i="1">Tautan tidak valid atau sudah tidak tersedia.</p><div class="linklist"><a href="https://emahairshop.com/"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg></span><span data-i="2">Kembali ke Beranda</span></a></div><p class="foot" data-i="3">&copy; 2026 EMAHAIRSHOP. Seluruh hak cipta dilindungi.</p></main><script>var R=document.documentElement,LG="id";
var FL={
  id: '<svg viewBox="0 0 24 24"><rect width="24" height="12" fill="#e11d48"/><rect y="12" width="24" height="12" fill="#fff"/></svg>',
  en: '<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#1e3a8a"/><path d="M0 0L24 24M24 0L0 24" stroke="#fff" stroke-width="4"/><path d="M0 0L24 24M24 0L0 24" stroke="#dc2626" stroke-width="1.5"/><path d="M12 0v24M0 12h24" stroke="#fff" stroke-width="7"/><path d="M12 0v24M0 12h24" stroke="#dc2626" stroke-width="4"/></svg>',
  it: '<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#fff"/><rect width="8" height="24" fill="#15803d"/><rect x="16" width="8" height="24" fill="#dc2626"/></svg>',
  es: '<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#c60b1e"/><rect y="6" width="24" height="12" fill="#ffc400"/></svg>',
  fr: '<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#fff"/><rect width="8" height="24" fill="#1d4ed8"/><rect x="16" width="8" height="24" fill="#dc2626"/></svg>',
  ar: '<svg viewBox="0 0 24 24"><rect width="24" height="24" fill="#15803d"/><rect x="5" y="15" width="14" height="2" rx="1" fill="#fff"/><rect x="8" y="8" width="8" height="2" rx="1" fill="#fff"/></svg>',
  de: '<svg viewBox="0 0 24 24"><rect width="24" height="8" fill="#111"/><rect y="8" width="24" height="8" fill="#dd0000"/><rect y="16" width="24" height="8" fill="#ffce00"/></svg>',
  ru: '<svg viewBox="0 0 24 24"><rect width="24" height="8" fill="#fff"/><rect y="8" width="24" height="8" fill="#1c57a5"/><rect y="16" width="24" height="8" fill="#d52b1e"/></svg>',
};
var LN={
  id: "Indonesia", en: "English", it: "Italiano", es: "Español",
  fr: "Français", ar: "العربية", de: "Deutsch", ru: "Русский",
};
var T={
  id: ["Halaman tidak ditemukan", "Tautan tidak valid atau sudah tidak tersedia.", "Kembali ke Beranda", "© 2026 EMAHAIRSHOP. Seluruh hak cipta dilindungi."],
  en: ["Page not found", "This link is invalid or no longer available.", "Back to Home", "© 2026 EMAHAIRSHOP. All rights reserved."],
  it: ["Pagina non trovata", "Link non valido o non più disponibile.", "Torna alla Home", "© 2026 EMAHAIRSHOP. Tutti i diritti riservati."],
  es: ["Página no encontrada", "Enlace no válido o ya no disponible.", "Volver al inicio", "© 2026 EMAHAIRSHOP. Todos los derechos reservados."],
  fr: ["Page introuvable", "Lien invalide ou plus disponible.", "Retour à l'accueil", "© 2026 EMAHAIRSHOP. Tous droits réservés."],
  ar: ["الصفحة غير موجودة", "الرابط غير صالح أو لم يعد متاحًا.", "العودة إلى الرئيسية", "© 2026 EMAHAIRSHOP. جميع الحقوق محفوظة."],
  de: ["Seite nicht gefunden", "Ungültiger Link oder nicht mehr verfügbar.", "Zurück zur Startseite", "© 2026 EMAHAIRSHOP. Alle Rechte vorbehalten."],
  ru: ["Страница не найдена", "Ссылка недействительна или недоступна.", "На главную", "© 2026 EMAHAIRSHOP. Все права защищены."],
};
function applyLang(){var d=T[LG];
document.querySelectorAll("[data-i]").forEach(function(e){e.textContent=d[+e.getAttribute("data-i")]});
R.lang=LG;R.dir=LG==="ar"?"rtl":"ltr";document.title="EMAHAIRSHOP | "+d[0];
document.getElementById("lf").innerHTML=FL[LG];
document.getElementById("lc").textContent=LG.toUpperCase();
document.querySelectorAll("#lmn button").forEach(function(b){b.classList.toggle("a",b.getAttribute("data-l")===LG)})}
function setLang(l){document.getElementById("lw").classList.remove("o");if(LN[l]){LG=l;try{localStorage.setItem("lang",l)}catch(e){}applyLang()}}
document.getElementById("lb").addEventListener("click",function(e){e.stopPropagation();document.getElementById("lw").classList.toggle("o")});
document.addEventListener("click",function(){document.getElementById("lw").classList.remove("o")});
document.getElementById("lmn").innerHTML=Object.keys(LN).map(function(k){return '<button type="button" data-l="'+k+'"><span class="fl">'+FL[k]+'</span>'+LN[k]+'</button>'}).join("");
document.getElementById("lmn").addEventListener("click",function(e){var b=e.target.closest("button");if(b)setLang(b.getAttribute("data-l"))});
(function(){var l=null;try{l=localStorage.getItem("lang")}catch(e){}
if(!l)l=(navigator.language||"id").slice(0,2);
LG=LN[l]?l:"id";applyLang()})();</script></body></html>`;
  return new NextResponse(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
