import { NextResponse } from "next/server";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Lama tunggu sebelum pindah otomatis (detik). */
const WAIT = 3;

/** Halaman perantara: judul, tujuan, tiga titik loading, lalu pindah otomatis setelah WAIT detik. Ada link manual. */
export function interstitialResponse(url: string) {
  let shown = url;
  try {
    const u = new URL(url);
    shown = u.host + (u.pathname === "/" ? "" : u.pathname);
  } catch {}
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Redirecting… | EMAHAIRSHOP</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><noscript><meta http-equiv="refresh" content="${WAIT};url=${esc(url)}"></noscript><style>
:root{color-scheme:light dark;--bg:#fafafa;--ink:#111;--muted:#666}
@media(prefers-color-scheme:dark){:root{--bg:#0e0e0e;--ink:#f3f3f3;--muted:#a0a0a0}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:start center;padding:22vh 16px 16px;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{width:min(420px,100%);text-align:center}
h1{font-size:1.05rem;font-weight:600;margin:0 0 6px}
.to{font-weight:600;word-break:break-all;font-size:.95rem}
.dots{display:flex;gap:8px;justify-content:center;margin:22px 0}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--ink);opacity:.2;animation:p 1s infinite}
.dots i:nth-child(2){animation-delay:.2s}.dots i:nth-child(3){animation-delay:.4s}
@keyframes p{50%{opacity:1;transform:translateY(-4px)}}
a.link{color:var(--muted);font-size:.85rem;text-decoration:underline}
@media(prefers-reduced-motion:reduce){.dots i{animation:none}}
</style></head><body><main>
<h1>Opening link…</h1>
<div class="to">${esc(shown)}</div>
<div class="dots" role="progressbar" aria-label="Redirecting"><i></i><i></i><i></i></div>
<a class="link" href="${esc(url)}">Not redirecting? Click here</a>
</main><script>
var U=${JSON.stringify(url).replace(/</g, "\\u003c")};
setTimeout(function(){location.replace(U)},${WAIT * 1000});
</script></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
