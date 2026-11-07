/*! EMAHAIRSHOP chat widget \u2014 tempel di situs mana pun:
   <script src="https://go.emahairshop.com/widget.js" defer></script>
   Opsi (atribut di tag script): data-lang="id|en|it|es|fr|de|ru"  data-theme="light|dark"  data-hide="/order,/checkout,/cart*"
   Backend + semua pengaturan (prompt, model, saklar, halaman tersembunyi) ada di dashboard go. Style diisolasi (Shadow DOM). */
(function(){
if(window.__EMA_WIDGET||document.getElementById("echat-btn"))return; // sudah ada / halaman portal: jangan dobel
window.__EMA_WIDGET=1;
var SC=document.currentScript,API="https://emahairshop.com"; // backend chat tetap di portal; widget.js sendiri disajikan dari go
if(SC&&/^https:\/\/[a-z0-9.-]+$/i.test(SC.getAttribute("data-api")||""))API=SC.getAttribute("data-api");
var LANGS=["en","id","it","es","fr","de","ru"];
var LG=(SC&&SC.getAttribute("data-lang"))||window.LG||document.documentElement.lang||navigator.language||"en";
LG=String(LG).toLowerCase().slice(0,2);if(LANGS.indexOf(LG)<0)LG="en";
var THEME=(SC&&SC.getAttribute("data-theme"))==="dark"?"dark":"light";
var CSS=`:host{all:initial;display:block;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color-scheme:light;--bg:#fafafa;--card:#fff;--line:#e5e5e5;--lineh:#c4c4c4;--ico:#f0f0f0;--text:#111;--mute:#666;--btn:#1a1a1a;--btnt:#fff}
:host([data-theme=dark]){color-scheme:dark;--bg:#111;--card:#1c1c1c;--line:#333;--lineh:#555;--ico:#2a2a2a;--text:#f2f2f2;--mute:#aaa;--btn:#f2f2f2;--btnt:#111}
*,*::before,*::after{box-sizing:border-box}
button,input{font-family:inherit}
#echat-btn{position:fixed;bottom:calc(20px + env(safe-area-inset-bottom,0px));inset-inline-end:16px;z-index:30;display:flex;align-items:center;gap:8px;height:48px;border:0;border-radius:999px;background:var(--btn);color:var(--btnt);padding:0 18px;font:600 14px/1 inherit;box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer}
#echat-btn svg{width:20px;height:20px;flex:none}
#echat-btn span{white-space:nowrap}
@media (max-width:640px){#echat-btn-label{display:none}#echat-btn{padding:0;width:48px;justify-content:center}}
#echat-panel{position:fixed;inset-inline:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:40;display:flex;flex-direction:column;height:75vh;height:75dvh;max-height:560px;overflow:hidden;border-radius:0;border:1px solid var(--line);background:var(--card);color:var(--text);box-shadow:0 24px 60px rgba(0,0,0,.25)}
@media (min-width:640px){#echat-panel{inset-inline:auto;inset-inline-end:16px;bottom:calc(88px + env(safe-area-inset-bottom,0px));width:380px}}
@media (min-width:1024px){#echat-btn{bottom:calc(36px + env(safe-area-inset-bottom,0px))}#echat-hi{bottom:calc(108px + env(safe-area-inset-bottom,0px))}#echat-panel{bottom:calc(104px + env(safe-area-inset-bottom,0px));width:440px;height:80vh;height:80dvh;max-height:680px}}
#echat-panel.hide{display:none}
#echat-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--line)}
#echat-head b{font-size:14px}
#echat-close{width:32px;height:32px;border:0;border-radius:999px;background:transparent;color:var(--text);cursor:pointer;display:flex;align-items:center;justify-content:center}
#echat-close:hover{background:var(--ico)}
#echat-body{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px;font-size:14px}
.echat-msg{max-width:88%;padding:9px 13px;border-radius:16px;white-space:pre-wrap;word-break:break-word}
.echat-intro,.echat-a{background:var(--ico);align-self:flex-start}
.echat-u{background:var(--btn);color:var(--btnt);align-self:flex-end}
.echat-wa{align-self:flex-start;display:inline-block;border-radius:999px;padding:7px 14px;font-size:12px;font-weight:600;background:#25d366;color:#fff;text-decoration:none}
#echat-think{font-size:12px;color:var(--mute);display:flex;align-items:center;gap:6px}
.echat-dots{display:inline-flex;gap:3px}
.echat-dots span{width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.35;animation:echatDot 1.2s ease-in-out infinite}
.echat-dots span:nth-child(2){animation-delay:.2s}
.echat-dots span:nth-child(3){animation-delay:.4s}
@keyframes echatDot{0%,80%,100%{opacity:.35;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.echat-dots span{animation:none;opacity:.6}}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.echat-sent{align-self:flex-end;margin:-4px 6px 0;font-size:11px;color:var(--mute)}
.echat-retry{align-self:flex-end;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:7px 14px;font:inherit;font-size:12px;font-weight:600;background:var(--card);color:var(--text);cursor:pointer}
.echat-q{margin:6px 8px;font-size:12px;line-height:1.4;text-align:center;opacity:.75}
.echat-tm{display:block;font-size:11px;font-weight:700;opacity:.65;margin-bottom:2px}
.echat-tm .echat-ic{vertical-align:-2px;margin-right:2px}
.echat-retry:hover{border-color:var(--lineh)}
.echat-retry:disabled{opacity:.5;cursor:default}
.echat-lk{display:inline-flex;align-items:center;gap:7px;max-width:100%;vertical-align:middle}
.echat-lk svg{width:18px;height:18px;flex:none}
#echat-note{margin:0;padding:6px 16px 8px;font-size:11px;line-height:1.4;color:var(--mute);color:color-mix(in srgb,var(--mute) 80%,var(--text));text-align:center}
#echat-form{display:flex;gap:8px;padding:12px;border-top:1px solid var(--line)}
#echat-input{flex:1;min-width:0;border:1px solid var(--line);border-radius:999px;padding:9px 14px;font:inherit;background:var(--card);color:var(--text)}
#echat-input:focus{outline:none;border-color:var(--lineh)}
#echat-send{border:0;border-radius:999px;padding:9px 16px;font:600 14px/1 inherit;background:var(--btn);color:var(--btnt);cursor:pointer}
#echat-send:disabled{opacity:.5;cursor:default}
#echat-hi{position:fixed;bottom:calc(92px + env(safe-area-inset-bottom,0px));inset-inline-end:16px;z-index:29;max-width:min(240px,calc(100vw - 32px));display:flex;align-items:center;gap:6px;padding:10px 8px 10px 14px;border:1px solid var(--line);border-radius:14px;background:var(--card);color:var(--text);font-size:13.5px;line-height:1.4;box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer;opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s}
#echat-hi.show{opacity:1;transform:none}
#echat-hi.hide{display:none}
#echat-hi button{flex:none;width:24px;height:24px;border:0;border-radius:999px;background:transparent;color:var(--mute);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
#echat-hi button:hover{background:var(--ico)}
@keyframes echatPulse{0%{box-shadow:0 8px 24px rgba(0,0,0,.18),0 0 0 0 var(--btn)}100%{box-shadow:0 8px 24px rgba(0,0,0,.18),0 0 0 14px transparent}}
#echat-btn.pulse{animation:echatPulse 1.6s ease-out 3}
#echat-badge{position:absolute;top:-4px;inset-inline-end:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#e4393c;color:#fff;font:700 11px/18px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px var(--bg)}
#echat-badge.hide{display:none}
@media (prefers-reduced-motion:reduce){#echat-hi{transition:none;transform:none}#echat-btn.pulse{animation:none}}
#echat-head small{display:block;margin-top:1px;font-size:12px;font-weight:400;color:var(--mute)}
.echat-qs{display:flex;flex-wrap:wrap;gap:8px;align-self:flex-start}
.echat-qb{min-height:36px;border:1px solid var(--line);border-radius:999px;padding:7px 14px;font:inherit;font-size:13px;font-weight:600;background:var(--card);color:var(--text);cursor:pointer;text-align:start}
.echat-qb:hover{border-color:var(--lineh)}
@media (max-width:640px){#echat-close{width:44px;height:44px;margin-block:-6px;margin-inline-end:-10px}#echat-input,#echat-send{min-height:44px}.echat-qb{min-height:44px}}`;
var HTML=`<button type="button" id="echat-btn" aria-label="Chat">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
<span id="echat-btn-label">AI Assistant</span>
<span id="echat-badge" class="hide" aria-hidden="true">0</span>
</button>

<div id="echat-hi" class="hide" role="status"><span>Hello, how can I help you?</span><button type="button" aria-label="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>

<div id="echat-panel" class="hide" role="dialog" aria-label="Chat">
<div id="echat-head"><div><b id="echat-title">AI Assistant</b><small id="echat-sub"></small></div><button type="button" id="echat-close" aria-label="Close">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
</button></div>
<div id="echat-body" role="log" aria-label="Chat messages"></div>
<div id="echat-announce" class="sr-only" aria-live="polite" aria-atomic="true"></div>
<p id="echat-note">Answered by AI. For prices, stock and orders, please confirm via WhatsApp.</p>
<form id="echat-form">
<input id="echat-input" type="text" maxlength="300" autocomplete="off">
<button id="echat-send" type="submit">Send</button>
</form>
</div>`;
var ET={
en:{open:"AI Assistant",title:"AI Assistant",sub:"Fast answers, 24/7",intro:"Hello, I'm EMAHAIRSHOP's AI assistant. How can I help you?",hi:"Hello, how can I help you?",note:"Answered by AI. For prices, stock and orders, please confirm via WhatsApp.",ph:"Type your question\u2026",send:"Send",close:"Close",wa:"Ask on WhatsApp",rate:"Too many questions in a short time. Please try again in a minute.",busy:"The assistant is busy right now. Please try again shortly.",error:"Something went wrong. Please try again.",offtopic:"Sorry, that's outside what I can help with here. Ask me about EMAHAIRSHOP or hair extensions instead.",think:"Thinking"},
id:{open:"Asisten AI",title:"Asisten AI",sub:"Respons cepat, 24 jam",intro:"Halo, saya asisten AI EMAHAIRSHOP. Ada yang bisa saya bantu?",hi:"Halo, ada yang bisa dibantu?",note:"Dijawab oleh AI. Untuk harga, stok, dan pesanan, mohon konfirmasi via WhatsApp.",ph:"Tulis pertanyaanmu\u2026",send:"Kirim",close:"Tutup",wa:"Tanya lewat WhatsApp",rate:"Terlalu banyak pertanyaan dalam waktu singkat. Coba lagi sebentar lagi.",busy:"Asisten sedang sibuk. Coba lagi sebentar lagi.",error:"Terjadi kesalahan. Coba lagi.",offtopic:"Maaf, itu di luar hal yang bisa saya bantu di sini. Coba tanya soal EMAHAIRSHOP atau hair extension ya.",think:"Mengetik"},
it:{open:"Assistente AI",title:"Assistente AI",sub:"Risposte rapide, 24/7",intro:"Buongiorno, sono l'assistente AI di EMAHAIRSHOP. Come posso aiutarla?",hi:"Buongiorno, posso aiutarla?",note:"Risposte generate da AI. Per prezzi, disponibilit\u00e0 e ordini, confermi via WhatsApp.",ph:"Scrivi la tua domanda\u2026",send:"Invia",close:"Chiudi",wa:"Chiedi su WhatsApp",rate:"Troppe domande in poco tempo. Riprova tra un minuto.",busy:"L'assistente \u00e8 occupato. Riprova tra poco.",error:"Qualcosa \u00e8 andato storto. Riprova.",offtopic:"Mi dispiace, questo esula da ci\u00f2 che posso aiutarti qui. Chiedimi di EMAHAIRSHOP o delle extension per capelli.",think:"Sto scrivendo"},
es:{open:"Asistente IA",title:"Asistente IA",sub:"Respuestas r\u00e1pidas, 24/7",intro:"Hola, soy el asistente de IA de EMAHAIRSHOP. \u00bfEn qu\u00e9 puedo ayudarle?",hi:"Hola, \u00bfen qu\u00e9 puedo ayudarle?",note:"Respuestas generadas por IA. Para precios, stock y pedidos, confirme por WhatsApp.",ph:"Escribe tu pregunta\u2026",send:"Enviar",close:"Cerrar",wa:"Preguntar por WhatsApp",rate:"Demasiadas preguntas en poco tiempo. Int\u00e9ntalo de nuevo en un minuto.",busy:"El asistente est\u00e1 ocupado. Int\u00e9ntalo de nuevo en breve.",error:"Algo sali\u00f3 mal. Int\u00e9ntalo de nuevo.",offtopic:"Lo siento, eso est\u00e1 fuera de lo que puedo ayudarte aqu\u00ed. Preg\u00fantame sobre EMAHAIRSHOP o extensiones de cabello.",think:"Escribiendo"},
fr:{open:"Assistant IA",title:"Assistant IA",sub:"R\u00e9ponses rapides, 24/7",intro:"Bonjour, je suis l'assistant IA d'EMAHAIRSHOP. Comment puis-je vous aider ?",hi:"Bonjour, puis-je vous aider ?",note:"R\u00e9ponses g\u00e9n\u00e9r\u00e9es par IA. Pour les prix, le stock et les commandes, confirmez via WhatsApp.",ph:"\u00c9crivez votre question\u2026",send:"Envoyer",close:"Fermer",wa:"Demander sur WhatsApp",rate:"Trop de questions en peu de temps. R\u00e9essayez dans une minute.",busy:"L'assistant est occup\u00e9. R\u00e9essayez dans un instant.",error:"Une erreur est survenue. R\u00e9essayez.",offtopic:"D\u00e9sol\u00e9, cela d\u00e9passe ce que je peux vous aider ici. Posez-moi vos questions sur EMAHAIRSHOP ou les extensions.",think:"En train d'\u00e9crire"},
de:{open:"KI-Assistent",title:"KI-Assistent",sub:"Schnelle Antworten, 24/7",intro:"Guten Tag, ich bin der KI-Assistent von EMAHAIRSHOP. Wie kann ich Ihnen helfen?",hi:"Guten Tag, kann ich helfen?",note:"Antworten von KI. F\u00fcr Preise, Verf\u00fcgbarkeit und Bestellungen bitte per WhatsApp best\u00e4tigen.",ph:"Frage eingeben\u2026",send:"Senden",close:"Schlie\u00dfen",wa:"Per WhatsApp fragen",rate:"Zu viele Fragen in kurzer Zeit. Bitte versuchen Sie es in einer Minute erneut.",busy:"Der Assistent ist gerade ausgelastet. Bitte versuchen Sie es gleich noch einmal.",error:"Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",offtopic:"Entschuldigung, das liegt au\u00dferhalb dessen, wobei ich hier helfen kann. Fragen Sie mich zu EMAHAIRSHOP oder Haarverl\u00e4ngerungen.",think:"Tippt"},
ru:{open:"\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442",title:"\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442",sub:"\u0411\u044b\u0441\u0442\u0440\u044b\u0435 \u043e\u0442\u0432\u0435\u0442\u044b, 24/7",intro:"\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435, \u044f \u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442 EMAHAIRSHOP. \u0427\u0435\u043c \u043c\u043e\u0433\u0443 \u043f\u043e\u043c\u043e\u0447\u044c?",hi:"\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435, \u0447\u0435\u043c \u043c\u043e\u0433\u0443 \u043f\u043e\u043c\u043e\u0447\u044c?",note:"\u041e\u0442\u0432\u0435\u0442\u044b \u0434\u0430\u0451\u0442 \u0418\u0418. \u0426\u0435\u043d\u044b, \u043d\u0430\u043b\u0438\u0447\u0438\u0435 \u0438 \u0437\u0430\u043a\u0430\u0437\u044b \u0443\u0442\u043e\u0447\u043d\u044f\u0439\u0442\u0435 \u0432 WhatsApp.",ph:"\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u2026",send:"\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c",close:"\u0417\u0430\u043a\u0440\u044b\u0442\u044c",wa:"\u0421\u043f\u0440\u043e\u0441\u0438\u0442\u044c \u0432 WhatsApp",rate:"\u0421\u043b\u0438\u0448\u043a\u043e\u043c \u043c\u043d\u043e\u0433\u043e \u0432\u043e\u043f\u0440\u043e\u0441\u043e\u0432 \u0437\u0430 \u043a\u043e\u0440\u043e\u0442\u043a\u043e\u0435 \u0432\u0440\u0435\u043c\u044f. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u043c\u0438\u043d\u0443\u0442\u0443.",busy:"\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442 \u0441\u0435\u0439\u0447\u0430\u0441 \u0437\u0430\u043d\u044f\u0442. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0447\u0443\u0442\u044c \u043f\u043e\u0437\u0436\u0435.",error:"\u0427\u0442\u043e-\u0442\u043e \u043f\u043e\u0448\u043b\u043e \u043d\u0435 \u0442\u0430\u043a. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.",offtopic:"\u0418\u0437\u0432\u0438\u043d\u0438\u0442\u0435, \u044d\u0442\u043e \u0432\u044b\u0445\u043e\u0434\u0438\u0442 \u0437\u0430 \u0440\u0430\u043c\u043a\u0438 \u0442\u043e\u0433\u043e, \u0441 \u0447\u0435\u043c \u044f \u043c\u043e\u0433\u0443 \u043f\u043e\u043c\u043e\u0447\u044c \u0437\u0434\u0435\u0441\u044c. \u0421\u043f\u0440\u043e\u0441\u0438\u0442\u0435 \u043c\u0435\u043d\u044f \u043e EMAHAIRSHOP \u0438\u043b\u0438 \u043d\u0430\u0440\u0430\u0449\u0438\u0432\u0430\u043d\u0438\u0438 \u0432\u043e\u043b\u043e\u0441.",think:"\u041f\u0435\u0447\u0430\u0442\u0430\u0435\u0442"}
};
function et(){return ET[LG]||ET.en}
var RT={en:"Try again",id:"Kirim ulang",it:"Riprova",es:"Reintentar",fr:"R\u00e9essayer",de:"Erneut versuchen",ru:"\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c"};
function rt(){return RT[LG]||RT.en}
var SD={en:"Sent",id:"Terkirim",it:"Inviato",es:"Enviado",fr:"Envoy\u00e9",de:"Gesendet",ru:"\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u043e"};
function sd(){return SD[LG]||SD.en}
var QS={en:["What's the starting price?","What is the minimum order?","How long does shipping take?","How do I order?","Can I use my own logo?"],
id:["Harga mulai berapa?","Minimal order berapa?","Pengiriman berapa lama?","Bagaimana cara order?","Bisa custom logo?"],
it:["Qual \u00e8 il prezzo di partenza?","Qual \u00e8 l'ordine minimo?","Quanto tempo richiede la spedizione?","Come posso ordinare?","Posso usare il mio logo?"],
es:["\u00bfCu\u00e1l es el precio inicial?","\u00bfCu\u00e1l es el pedido m\u00ednimo?","\u00bfCu\u00e1nto tarda el env\u00edo?","\u00bfC\u00f3mo hago un pedido?","\u00bfPuedo usar mi propio logo?"],
fr:["Quel est le prix de d\u00e9part ?","Quelle est la commande minimale ?","Quel est le d\u00e9lai de livraison ?","Comment commander ?","Puis-je utiliser mon propre logo ?"],
de:["Was ist der Einstiegspreis?","Wie hoch ist die Mindestbestellmenge?","Wie lange dauert der Versand?","Wie bestelle ich?","Kann ich mein eigenes Logo verwenden?"],
ru:["\u041a\u0430\u043a\u043e\u0432\u0430 \u043d\u0430\u0447\u0430\u043b\u044c\u043d\u0430\u044f \u0446\u0435\u043d\u0430?","\u041a\u0430\u043a\u043e\u0439 \u043c\u0438\u043d\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u0437\u0430\u043a\u0430\u0437?","\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u0437\u0430\u043d\u0438\u043c\u0430\u0435\u0442 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0430?","\u041a\u0430\u043a \u0441\u0434\u0435\u043b\u0430\u0442\u044c \u0437\u0430\u043a\u0430\u0437?","\u041c\u043e\u0436\u043d\u043e \u043b\u0438 \u043d\u0430\u043d\u0435\u0441\u0442\u0438 \u0441\u0432\u043e\u0439 \u043b\u043e\u0433\u043e\u0442\u0438\u043f?"]};
function qs(){return QS[LG]||QS.en}
function init(){
var host=document.createElement("div");
host.setAttribute("data-theme",THEME);
var sh=host.attachShadow({mode:"open"});
sh.innerHTML="<style>"+CSS+"</style>"+HTML;
document.body.appendChild(host);
// Aturan sembunyikan per halaman: dari dashboard go (diambil saat load) + opsional data-hide di tag script.
// Format: "/order" (semua subdomain, awalan path), "/cart*" (wildcard), "/" (beranda saja), "shop.emahairshop.com/order" (satu subdomain), "blog.emahairshop.com" (seluruh subdomain)
function ruleHit(x){var p=location.pathname.replace(/\/+$/,"")||"/";
if(x.charAt(0)!=="/"){var i=x.indexOf("/"),h=(i<0?x:x.slice(0,i)).toLowerCase();if(h!==location.hostname.toLowerCase())return false;x=i<0?"/*":x.slice(i)}
if(x==="/")return p==="/";
return new RegExp("^"+x.replace(/[.+?^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\/+$/,"")+"(/.*)?$","i").test(p)}
function applyHide(){host.style.display=RULES.some(ruleHit)?"none":"block"}
if(RULES.length){applyHide();
["pushState","replaceState"].forEach(function(k){var o=history[k];history[k]=function(){var r=o.apply(this,arguments);setTimeout(applyHide,0);return r}});
addEventListener("popstate",applyHide);addEventListener("hashchange",applyHide)}
function $(id){return sh.getElementById(id)}
var WA_PHONE="62895379994528";
function waCtx(last){var u=msgs.filter(function(m){return m.role==="user"}).slice(-3).map(function(m){return m.content});if(u.length<2||last.length>40)return last;return u.join(" / ").slice(0,200)}
function waLink(q){return "https://wa.me/"+WA_PHONE+"?text="+encodeURIComponent("Hi EMAHAIRSHOP, "+q)}

var btn=$("echat-btn"),panel=$("echat-panel"),
body=$("echat-body"),form=$("echat-form"),
input=$("echat-input"),closeBtn=$("echat-close"),
sendBtn=$("echat-send"),badge=$("echat-badge"),
announce=$("echat-announce");
var msgs=[],loading=false,labelsReady=false,unread=0;
function sayAria(text){if(announce)announce.textContent=String(text==null?"":text)}
// Badge angka di tombol chat: jumlah balasan yang belum dibaca selama panel tertutup.
function updateBadge(){
if(!badge)return;
if(unread>0){badge.textContent=unread>9?"9+":String(unread);badge.classList.remove("hide")}
else badge.classList.add("hide");
}
// Dipanggil tiap ada balasan AI/tim yang baru masuk ke msgs selagi panel tertutup: tambah badge
// dan sentil tombol (pulse) biar kelihatan ada balasan baru.
function notifyNewMessage(){
if(panel.classList.contains("hide")){
unread++;updateBadge();
btn.classList.remove("pulse");void btn.offsetWidth;btn.classList.add("pulse");
}
}
var knownName="";try{knownName=sessionStorage.getItem("echat:name")||""}catch(e){}
var arc=null;try{arc=JSON.parse(sessionStorage.getItem("echat:arc")||"null")}catch(e){}
var cid="";try{cid=sessionStorage.getItem("echat:cid")||""}catch(e){}
if(!/^[a-f0-9]{16}$/.test(cid)){var ra=new Uint8Array(8);if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(ra);else for(var ri=0;ri<8;ri++)ra[ri]=Math.floor(Math.random()*256);cid=Array.prototype.map.call(ra,function(b){return("0"+b.toString(16)).slice(-2)}).join("");try{sessionStorage.setItem("echat:cid",cid)}catch(e){}}
var toTeam=false,pend=0;// true = pesan sedang diteruskan ke admin (bukan dijawab AI): jangan tampilkan "Mengetik"
var qline="";var live=false;try{live=sessionStorage.getItem("echat:live")==="1"}catch(e){}
var lastTeam=0;try{lastTeam=+sessionStorage.getItem("echat:team")||0}catch(e){}
var lastAct=Date.now();
var hi=$("echat-hi"),hiTimer,hiAuto;

function loadHistory(){
try{var raw=sessionStorage.getItem("echat:hist");msgs=raw?JSON.parse(raw):[]}catch(e){msgs=[]}
if(!Array.isArray(msgs))msgs=[];
msgs=msgs.filter(function(m){return m&&typeof m.content==="string"&&m.content});
}
function saveHistory(){
try{sessionStorage.setItem("echat:hist",JSON.stringify(msgs.slice(-20)))}catch(e){}
}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
var IC={
wa:["#25d366",'<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>'],
shop:["currentColor",'<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>'],
track:["currentColor",'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'],
verify:["currentColor",'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>'],
blog:["currentColor",'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/>'],
help:["currentColor",'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>'],
review:["currentColor",'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'],
mail:["currentColor",'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>']};
function icFor(u){var h=u.replace(/^https?:\/\//,"").split(/[\/?#]/)[0];return h==="wa.me"?IC.wa:h==="shop.emahairshop.com"?(/^https?:\/\/shop\.emahairshop\.com\/view-review/i.test(u)?IC.review:IC.shop):h==="track.emahairshop.com"?IC.track:h==="verify.emahairshop.com"?IC.verify:h==="blog.emahairshop.com"?IC.blog:h==="help.emahairshop.com"?IC.help:null}
function aLink(u){return '<a href="'+esc(u)+'" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;word-break:break-all">'+esc(u)+'</a>'}
function mLink(e){return '<a href="mailto:'+esc(e)+'" style="color:inherit;text-decoration:underline;word-break:break-all">'+esc(e)+'</a>'}
function linkify(s){return String(s==null?"":s).split("\n").map(function(line){
var em=line.match(/^\s*(?:[^:@\n]{1,30}:\s*)?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\s*$/);
if(em){var mc=IC.mail;return '<span class="echat-lk"><svg viewBox="0 0 24 24" fill="none" stroke="'+mc[0]+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+mc[1]+'</svg>'+mLink(em[1])+'</span>'}
var m=line.match(/^\s*(?:[^:\n]{1,30}:\s*)?(https?:\/\/\S*[^\s.,;:!?)\]])\s*$/);
if(m){var ic=icFor(m[1]);if(ic)return '<span class="echat-lk"><svg viewBox="0 0 24 24" fill="none" stroke="'+ic[0]+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ic[1]+'</svg>'+aLink(m[1])+'</span>'}
return esc(line).replace(/(https?:\/\/[^\s<]*[^\s<.,;:!?)\]])/g,function(u){return '<a href="'+u+'" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;word-break:break-all">'+u+'</a>'})}).join("\n")}
function render(){
var t=et(),html='<p class="echat-msg echat-intro">'+esc(t.intro)+'</p>';
if(!msgs.length&&!loading)html+='<div class="echat-qs">'+qs().map(function(q,i){return '<button type="button" class="echat-qb" data-q="'+i+'">'+esc(q)+'</button>'}).join("")+'</div>';
msgs.forEach(function(m,i){
html+='<p class="echat-msg '+(m.role==="user"?"echat-u":"echat-a")+'">'+(m.human?'<b class="echat-tm"><svg class="echat-ic" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> EMAHAIRSHOP Customer Service</b>':'')+(m.role==="user"?esc(m.content):linkify(m.content))+'</p>';
if(m.role==="user"&&m.sent&&i===msgs.length-1)html+='<span class="echat-sent">'+esc(sd())+'</span>';
if(m.role==="user"&&!loading&&i===msgs.length-2&&msgs[i+1].err)html+='<button type="button" class="echat-retry" id="echat-retry">\u21BB '+esc(rt())+'</button>';
if(m.wa)html+='<a class="echat-wa" href="'+m.wa+'" target="_blank" rel="noopener">'+esc(t.wa)+'</a>';
});
if(qline&&!loading)html+='<p class="echat-q">\u23F3 '+esc(qline)+'</p>';
if(loading&&!toTeam)html+='<p id="echat-think" role="status" aria-label="'+esc(t.think)+'"><span class="echat-dots" aria-hidden="true"><span></span><span></span><span></span></span></p>';
body.innerHTML=html;
body.scrollTop=body.scrollHeight;
if(sendBtn)sendBtn.disabled=loading&&!toTeam;
}
function labels(){
var t=et();
$("echat-btn-label").textContent=t.open;
btn.setAttribute("aria-label",t.open);
$("echat-title").textContent=t.title;
var sb=$("echat-sub");if(sb)sb.textContent=t.sub;
$("echat-note").textContent=t.note;
var hs=hi&&hi.querySelector("span");if(hs)hs.textContent=t.hi;
closeBtn.setAttribute("aria-label",t.close);
input.placeholder=t.ph;
$("echat-send").textContent=t.send;
panel.setAttribute("aria-label",t.title);
}
function open(){
hideHi();
loadHistory();
labels();
render();
panel.classList.remove("hide");
unread=0;updateBadge();
if(msgs.length||!(window.matchMedia&&matchMedia("(pointer:coarse)").matches))input.focus();
}
function close(){panel.classList.add("hide")}
window.emaWidget={open:open,close:close};
btn.addEventListener("click",function(){panel.classList.contains("hide")?open():close()});
closeBtn.addEventListener("click",close);
document.addEventListener("keydown",function(e){if(e.key==="Escape")close()});

labels();

// Gelembung sapaan: muncul sekali per kunjungan (setelah ~6 detik), hilang sendiri, tombol berdenyut 3x lalu berhenti.
function hiSeen(){try{return sessionStorage.getItem("echat:hi")}catch(e){return null}}
function hideHi(){
clearTimeout(hiTimer);clearTimeout(hiAuto);
if(!hi||hi.classList.contains("hide"))return;
try{sessionStorage.setItem("echat:hi","1")}catch(e){}
hi.classList.remove("show");
setTimeout(function(){hi.classList.add("hide")},350);
}
if(hi&&!hiSeen()){
hiTimer=setTimeout(function(){
if(!panel.classList.contains("hide")||hiSeen())return;
labels();
hi.classList.remove("hide");
void hi.offsetWidth;
hi.classList.add("show");
btn.classList.add("pulse");
btn.addEventListener("animationend",function(){btn.classList.remove("pulse")},{once:true});
hiAuto=setTimeout(hideHi,10000);
},6000);
hi.addEventListener("click",function(e){
if(e.target.closest("button")){hideHi();return}
hideHi();if(panel.classList.contains("hide"))open();
});
}

// Riwayat yang dikirim ke server: tanpa pesan error, dan tanpa pertanyaan yang jawabannya gagal
// (supaya tidak ada dua pesan pengunjung berurutan atau teks error ikut jadi konteks AI).
function payload(){
var out=[];
msgs.forEach(function(m,i){
if(m.err||m.skip)return;
var nx=msgs[i+1];
if(m.role==="user"&&nx&&nx.err)return;
out.push({role:m.role,content:m.human?"[Team reply] "+m.content:m.content});
});
return out.slice(-24);
}
// Kirim pertanyaan terakhir (yang sudah ada di msgs) ke server. Dipakai oleh kirim biasa dan tombol "Kirim ulang".
// Mode admin aktif = pesan tim terakhir bukan penutup dan masih baru (30 menit). Kalau tidak, AI menjawab lagi.
function humanOn(){for(var i=msgs.length-1;i>=0;i--){var m=msgs[i];if(m.human)return !m.close&&(Date.now()-(m.at||0)<1800000)}return false}
function ask(text,tries,um){
tries=tries||0;lastAct=Date.now();
if(!um){um=msgs[msgs.length-1];if(!um||um.role!=="user")um=null}
if(!tries)pend++;
toTeam=live||humanOn();
loading=true;
render();
saveHistory();
var t=et();
function fail(kind){var c=kind==="rate"?t.rate:kind==="busy"?t.busy:t.error;msgs.push({role:"assistant",content:c,err:true,kind:kind||"error"});sayAria(c)}
var retryAuto=false;
var ac=window.AbortController?new AbortController():null,to=setTimeout(function(){if(ac)ac.abort()},28000);
fetch(API+"/api/chat",{method:"POST",signal:ac?ac.signal:undefined,headers:{"Content-Type":"application/json"},
body:JSON.stringify({lang:LG,name:knownName,arc:arc,cid:cid,human:humanOn(),messages:payload()})})
.then(function(r){return r.json().catch(function(){return{}})})
.then(function(data){
if(typeof data.name==="string"&&data.name){knownName=data.name;try{sessionStorage.setItem("echat:name",knownName)}catch(e){}}
if(data.arc&&typeof data.arc==="object"&&typeof data.arc.sig==="string"){arc=data.arc;try{sessionStorage.setItem("echat:arc",JSON.stringify(arc))}catch(e){}}
if(typeof data.q==="string")qline=data.q;
if(data.live&&!live){live=true;try{sessionStorage.setItem("echat:live","1")}catch(e){}}
if(data.error){if(data.error==="error"&&tries<2){retryAuto=true;return}fail(data.error)}
else if(data.handoff){if(um)um.sent=true}
else if(data.offtopic){msgs.push({role:"assistant",content:t.offtopic});sayAria(t.offtopic);notifyNewMessage()}
else if(typeof data.reply==="string"&&data.reply){msgs.push({role:"assistant",content:data.reply,wa:data.wa?waLink(waCtx(text)):undefined});sayAria(data.reply);notifyNewMessage()}
else{if(tries<2){retryAuto=true;return}fail("error")}
})
.catch(function(){if(tries<2){retryAuto=true;return}fail("error")})
.finally(function(){clearTimeout(to);
if(retryAuto){retryAuto=false;setTimeout(function(){ask(text,tries+1,um)},1500);return}
pend--;if(pend<=0){pend=0;loading=false;toTeam=false}render();saveHistory()});
}
form.addEventListener("submit",function(e){
e.preventDefault();
var text=input.value.trim().slice(0,300);
if(!text||(loading&&!toTeam))return;
input.value="";
// Kalau jawaban sebelumnya error lalu pengunjung mengetik hal baru, buang pesan error lamanya.
var lm=msgs[msgs.length-1];
if(lm&&lm.err){msgs.pop();var pu=msgs[msgs.length-1];if(pu&&pu.role==="user")pu.skip=true}
msgs.push({role:"user",content:text});
ask(text);
});
// Balasan dari tim (dikirim admin lewat Telegram): diambil berkala selama percakapan sudah ditandai ke admin.
function pollTeam(){
if(!live||loading||document.hidden||Date.now()-lastAct>1800000)return;
fetch(API+"/api/chat?poll="+cid+"&after="+lastTeam,{cache:"no-store"})
.then(function(r){return r.json()})
.then(function(d){
if(!d)return;
var qc=false;
if(typeof d.q==="string"&&d.q!==qline){qline=d.q;qc=true}
var added=false;
(d.m||[]).forEach(function(x){if(x&&x.id>lastTeam&&typeof x.text==="string"){lastTeam=x.id;msgs.push({role:"assistant",content:x.text,human:true,close:!!x.close,at:Date.now()});added=true;sayAria(x.text);if(x.close){qline="";live=false;try{sessionStorage.setItem("echat:live","0")}catch(e){}}}});
if(!added&&!qc)return;
if(added){try{sessionStorage.setItem("echat:team",String(lastTeam))}catch(e){}
saveHistory();
notifyNewMessage()}
if(!panel.classList.contains("hide"))render();
})
.catch(function(){});
}
setInterval(pollTeam,4000);
// Tombol pertanyaan cepat: diklik = terkirim seperti diketik; tombolnya hilang karena chat sudah berjalan.
body.addEventListener("click",function(e){
var q=e.target.closest&&e.target.closest(".echat-qb");
if(!q||loading||msgs.length)return;
var text=(qs()[+q.getAttribute("data-q")]||"").slice(0,300);
if(!text)return;
msgs.push({role:"user",content:text});
ask(text);
});
// Tombol "Kirim ulang": pertanyaan yang sama dikirim lagi, pengunjung tidak perlu menyalin/menempel.
body.addEventListener("click",function(e){
var b=e.target.closest&&e.target.closest("#echat-retry");
if(!b||loading)return;
var lm=msgs[msgs.length-1];
if(!lm||!lm.err)return;
msgs.pop();
var lu=msgs[msgs.length-1];
if(!lu||lu.role!=="user"){render();return}
ask(lu.content);
});

// Ikut ganti bahasa kalau situs punya pemilih bahasa sendiri (window.LG, mis. portal).
setInterval(function(){var l=window.LG;if(l&&l!==LG&&LANGS.indexOf(l)>=0){LG=l;labels();if(!panel.classList.contains("hide")){loadHistory();render()}}},800);
}
var RULES=((SC&&SC.getAttribute("data-hide"))||"").split(",").map(function(x){return x.trim()}).filter(Boolean);
var started=false,off=false;
function go(){if(started||off)return;started=true;if(document.body)init();else document.addEventListener("DOMContentLoaded",init)}
// Ambil pengaturan dari server (saklar chat + daftar halaman yang disembunyikan); gagal/lambat = tetap tampil.
try{fetch(API+"/api/chat?cfg=1",{cache:"no-store"}).then(function(r){return r.json()}).then(function(c){
if(c&&c.on===false){off=true;return}
if(c&&Array.isArray(c.hide))RULES=RULES.concat(c.hide.filter(function(x){return typeof x==="string"&&x}));
go()}).catch(go)}catch(e){go()}
setTimeout(go,3000);
})();
