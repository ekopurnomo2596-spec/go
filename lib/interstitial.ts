import { NextResponse } from "next/server";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Halaman perantara: hitung mundur 2, 1, 0 lalu pindah. Ada tombol lewati. */
export function interstitialResponse(url: string) {
  let shown = url;
  try {
    const u = new URL(url);
    shown = u.host + (u.pathname === "/" ? "" : u.pathname);
  } catch {}
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Redirecting… | EMAHAIRSHOP</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><noscript><meta http-equiv="refresh" content="2;url=${esc(url)}"></noscript><style>
:root{color-scheme:light dark;--bg:#fafafa;--ink:#111;--muted:#666;--line:#e5e5e5;--btn:#1b1b1b;--btnt:#fff}
@media(prefers-color-scheme:dark){:root{--bg:#0e0e0e;--ink:#f3f3f3;--muted:#a0a0a0;--line:#2a2a2a;--btn:#f3f3f3;--btnt:#111}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{width:min(420px,100%);text-align:center}
h1{font-size:1.05rem;font-weight:600;margin:0 0 6px}
.to{font-weight:600;word-break:break-all;font-size:.95rem}
.bar{height:10px;border-radius:99px;background:var(--line);overflow:hidden;margin:18px 0 0}
.bar i{display:block;height:100%;width:0;border-radius:99px;background:#22c55e;transition:width 2s linear}
.bar.run i{width:100%}
p{color:var(--muted);font-size:.85rem;margin:14px 0 22px}
a.btn{display:block;height:46px;line-height:46px;border-radius:12px;background:var(--btn);color:var(--btnt);font-weight:600;text-decoration:none;font-size:.95rem}
@media(prefers-reduced-motion:reduce){.bar i{transition:none}}
</style></head><body><main>
<h1>You are being redirected to</h1>
<div class="to">${esc(shown)}</div>
<div class="bar" id="bar" role="progressbar" aria-label="Redirect progress"><i></i></div>
<p>Redirecting in <span id="s">2</span> seconds…</p>
<a class="btn" href="${esc(url)}">Skip, click here</a>
</main><script>
var U=${JSON.stringify(url).replace(/</g, "\\u003c")},n=2,s=document.getElementById("s"),b=document.getElementById("bar");
requestAnimationFrame(function(){requestAnimationFrame(function(){b.className="bar run"})});
(function t(){s.textContent=n;if(n<=0){location.replace(U);return}n--;setTimeout(t,1000)})();
</script></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
