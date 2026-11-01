import { NextResponse } from "next/server";
import { notFoundResponse } from "@/lib/notfound";
import { ADMIN_PATH } from "@/lib/admin-path";

// Alamat asli /admin ditutup (404) kalau dashboard dipindah ke path rahasia.
// Path rahasia sendiri diteruskan ke halaman admin lewat rewrites di next.config.mjs.
export function middleware() {
  if (ADMIN_PATH === "admin") return NextResponse.next();
  return notFoundResponse();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
