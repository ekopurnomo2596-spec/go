import { NextResponse } from "next/server";
import { notFoundResponse } from "@/lib/notfound";
import { LOGIN_PATH } from "@/lib/login-path";

// Kalau halaman login dipindah ke path rahasia, alamat lama /admin/login ditutup (404).
// Path rahasia sendiri diteruskan ke halaman login lewat rewrites di next.config.mjs.
export function middleware() {
  if (!LOGIN_PATH) return NextResponse.next();
  return notFoundResponse();
}

export const config = { matcher: ["/admin/login"] };
