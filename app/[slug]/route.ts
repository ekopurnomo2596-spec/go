import { after, NextRequest, NextResponse } from "next/server";
import { getLink, recordClick, validSlugFormat } from "@/lib/links";

const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|headless|python-requests|monitor|uptime/i;

function notFoundResponse() {
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Tautan tidak ditemukan</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;text-align:center;padding:24px}p{color:#666}a{color:#a97c1f;font-weight:600}</style></head><body><div><h1>Tautan tidak ditemukan</h1><p>Alamat yang kamu buka tidak terdaftar atau sudah diganti.</p><a href="/">Lihat semua tautan</a></div></body></html>`;
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
