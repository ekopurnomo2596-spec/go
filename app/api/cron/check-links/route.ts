import type { NextRequest } from "next/server";
import { checkAll } from "@/lib/linkcheck";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Dipanggil Vercel Cron (lihat vercel.json). Vercel otomatis mengirim "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const r = await checkAll();
  const all = Object.values(r);
  return Response.json({ checked: all.length, bad: all.filter((x) => !x.ok).length });
}
