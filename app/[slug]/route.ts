import { createHash } from "node:crypto";
import { after, NextRequest, NextResponse } from "next/server";
import { notFoundResponse } from "@/lib/notfound";
import { getLink, recordClick, validSlugFormat } from "@/lib/links";
import { interstitialResponse } from "@/lib/interstitial";

const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|headless|python-requests|monitor|uptime/i;

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

    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
    // Satu pengunjung = satu alamat IP (sama seperti penghitung di portal). Browser berbeda dari IP yang sama tidak dihitung dua kali.
    // Kalau IP tidak terbaca, pakai IP+browser supaya semua yang tak dikenal tidak tergabung jadi satu orang.
    const visitor = createHash("sha256").update(ip ? ip : `|${ua}`).digest("hex").slice(0, 32);

    after(async () => {
      try {
        await recordClick(slug, { country, referrer, device, visitor });
      } catch (e) {
        console.error("recordClick gagal", e);
      }
    });
  }

  if (link.interstitial && ua !== "" && !BOT.test(ua)) {
    return interstitialResponse(link.url);
  }

  return NextResponse.redirect(link.url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
