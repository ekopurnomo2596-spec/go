import type { NextRequest } from "next/server";
import { handleUpdate } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Webhook Telegram: dipanggil Telegram tiap ada pesan ke bot laporan. Dilindungi secret_token acak
// (header X-Telegram-Bot-Api-Secret-Token) yang dibuat saat token bot disimpan.
export async function POST(req: NextRequest) {
  const update = await req.json().catch(() => null);
  try {
    const ok = await handleUpdate(update ?? {}, req.headers.get("x-telegram-bot-api-secret-token"));
    if (!ok) return new Response("Unauthorized", { status: 401 });
  } catch (e) {
    console.error("telegram webhook:", e instanceof Error ? e.message : "gagal");
  }
  return new Response("ok"); // selalu 200 supaya Telegram tidak mengulang kiriman
}
