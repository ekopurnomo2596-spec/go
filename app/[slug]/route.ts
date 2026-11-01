import { after, NextRequest, NextResponse } from "next/server";
import { getLink, recordClick, validSlugFormat } from "@/lib/links";

const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|headless|python-requests|monitor|uptime/i;

function notFoundResponse() {
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Tautan tidak ditemukan</title><style>
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fafafa;color:#111;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:24px}
@media (prefers-color-scheme:dark){body{background:#101010;color:#f4f4f2}}
.brand{display:flex;align-items:center;gap:14px;margin:0 auto 24px}
.badge{width:40px;height:40px;border-radius:50%;border:2px solid #c9a46a;background:linear-gradient(145deg,#2a2118,#0f0d0a);display:grid;place-items:center;font:700 18px Georgia,serif;color:#c9a46a}
.rule{width:1px;height:32px;background:#e5e5e5}
.brandText{font:700 18px Georgia,"Times New Roman",serif;color:#a8802f;letter-spacing:.5px;line-height:1.25;text-align:left}
.brandText small{display:block;font-family:Inter,system-ui,sans-serif;font-weight:500;font-size:11px;color:#888}
h1{font-size:1.9rem;font-weight:800;margin:0}
p{color:#666;font-size:.95rem;margin:16px 0 26px;max-width:360px}
a.btn{display:inline-block;font:600 .85rem Inter,system-ui,sans-serif;padding:10px 18px;border-radius:10px;background:#1a1a1a;color:#fff;text-decoration:none}
</style></head><body><div><div class="brand"><span class="badge">E</span><span class="rule"></span><span class="brandText">GO<small>emahairshop.com</small></span></div><h1>Tautan tidak ditemukan</h1><p>Alamat yang kamu buka tidak terdaftar atau sudah diganti.</p><a class="btn" href="/">Lihat semua tautan</a></div></body></html>`;
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
