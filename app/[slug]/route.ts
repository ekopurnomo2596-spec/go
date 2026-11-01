import { after, NextRequest, NextResponse } from "next/server";
import { getLink, recordClick, validSlugFormat } from "@/lib/links";

const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|headless|python-requests|monitor|uptime/i;

function notFoundResponse() {
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>EMAHAIRSHOP | Halaman tidak ditemukan</title><style>
:root{color-scheme:light dark;--bg:#fafafa;--card:#fff;--line:#e5e5e5;--lineh:#c4c4c4;--ico:#f0f0f0;--icos:#404040;--ink:#111;--muted:#666;--gold:#a8802f}
@media (prefers-color-scheme:dark){:root{--bg:#101010;--card:#171715;--line:#2a2a2a;--lineh:#3a3a3a;--ico:#201f1c;--icos:#cfcfcb;--ink:#f4f4f2;--muted:#9a9a96}}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;min-height:100vh;padding:56px 20px 40px}
.public{max-width:420px;margin:0 auto;text-align:center}
.lg{text-decoration:none;display:inline-block;margin:0 auto 28px}
.logo-nav-container{display:flex;flex-direction:column;align-items:center;justify-content:center;width:max-content;margin:0 auto}
.logo-nav-container .logo-top{display:flex;align-items:center;width:100%;margin-bottom:-1px}
.logo-nav-container .line-top{height:2px;background:var(--ink);flex-grow:1;margin-right:4px}
.logo-nav-container .text-ext{color:var(--ink);font-family:Lato,Inter,sans-serif;font-weight:900;font-size:.35rem;letter-spacing:2px;text-transform:uppercase;margin-right:-2px}
.logo-nav-container .logo-main{color:var(--ink);font-family:"Arial Black",Lato,sans-serif;font-weight:900;font-size:1.1rem;letter-spacing:.5px;line-height:1.1;text-transform:uppercase;text-align:center;margin-right:-.5px}
.logo-nav-container .line-bottom{width:100%;height:2px;background:var(--ink);margin:0 0 2px}
.logo-nav-container .logo-year{color:#906A00;font-family:Lato,Inter,sans-serif;font-weight:900;font-size:.45rem;letter-spacing:1.5px;text-align:center;margin-right:-1.5px}
.code{font-size:clamp(60px,18vw,88px);font-weight:600;line-height:1.1;letter-spacing:-2px}
.divider{width:56px;height:2px;background:var(--lineh);margin:22px auto}
h1{font-size:19px;font-weight:600}
p.sub{color:var(--muted);font-size:.81rem;margin:8px 0 32px}
.linklist a{display:flex;align-items:center;gap:16px;width:100%;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;text-decoration:none;font-weight:600;font-size:.95rem;color:var(--ink)}
.ico{width:44px;height:44px;border-radius:12px;background:var(--ico);display:grid;place-items:center;flex:none}
.ico svg{width:20px;height:20px;stroke:var(--icos);fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.foot{margin-top:28px;color:var(--muted);font-size:.8rem}
</style></head><body><main class="public"><a class="lg" href="/"><div class="logo-nav-container"><div class="logo-top"><span class="line-top"></span><span class="text-ext">Extension</span></div><div class="logo-main">EMAHAIRSHOP</div><div class="line-bottom"></div><div class="logo-year">2019</div></div></a><div class="code">404</div><div class="divider"></div><h1>Halaman tidak ditemukan</h1><p class="sub">Tautan tidak valid atau sudah tidak tersedia.</p><div class="linklist"><a href="/"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg></span><span>Kembali ke Beranda</span></a></div><p class="foot">&copy; 2026 EMAHAIRSHOP. Seluruh hak cipta dilindungi.</p></main></body></html>`;
  return new NextResponse(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug.toLowerCase();
  const link = validSlugFormat(slug) ? await getLink(slug) : null;
  if (!link) return notFoundResponse();

  const ua = req.headers.get("user-agent") ?? "";
  const purpose = `${req.headers.get("purpose") ?? ""} ${req.headers.get("sec-purpose") ?? ""}`;
  const countable = req.method === "GET" && ua !== "" && !BOT.test(ua) && !/prefetch|prerender/i.test(purpose);

  if (countable) {
    const country = (req.headers.get("x-vercel-ip-country") ?? "XX").toUpperCase();
    let referrer = "langsung";
    const ref = req.headers.get("referer");
    if (ref) {
      try {
        referrer = new URL(ref).hostname || "langsung";
      } catch {
        referrer = "langsung";
      }
    }
    const device = /mobi|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";

    after(async () => {
      try {
        await recordClick(slug, { country, referrer, device });
      } catch (e) {
        console.error("recordClick gagal", e);
      }
    });
  }

  return NextResponse.redirect(link.url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
