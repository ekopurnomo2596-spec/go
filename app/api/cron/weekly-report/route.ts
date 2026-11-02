import type { NextRequest } from "next/server";
import { TgError, sendWeeklyReport } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Dipanggil Vercel Cron tiap Senin 08.00 WIB (lihat vercel.json). Vercel mengirim "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await sendWeeklyReport();
    return Response.json({ sent: true });
  } catch (e) {
    const msg = e instanceof TgError ? e.message : "Gagal menyusun atau mengirim laporan.";
    console.error("weekly-report:", msg);
    return Response.json({ sent: false, error: msg }, { status: e instanceof TgError ? 412 : 500 });
  }
}
