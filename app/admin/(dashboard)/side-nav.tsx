"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function closeMenu() {
  const t = document.getElementById("nav") as HTMLInputElement | null;
  if (t) t.checked = false;
}

export function SideNav() {
  const path = usePathname() ?? "";
  const onAnalisa = path.startsWith("/admin/analisa");
  const onTindakan = path.startsWith("/admin/tindakan");
  const onTautan = path.startsWith("/admin/tautan");
  const onStats = path.startsWith("/admin/statistik");
  const onAi = path.startsWith("/admin/ai");
  const onChat = path.startsWith("/admin/percakapan");
  const onToken = path.startsWith("/admin/token");
  const onDash = !onAnalisa && !onTindakan && !onTautan && !onStats && !onAi && !onChat && !onToken;
  return (
    <>
      <Link href="/admin" onClick={closeMenu} className={"snavLink" + (onDash ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" /></svg>
        Dashboard
      </Link>
      <Link href="/admin/analisa" onClick={closeMenu} className={"snavLink" + (onAnalisa ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M21 7v6h-6" /></svg>
        Analisa
      </Link>
      <Link href="/admin/tindakan" onClick={closeMenu} className={"snavLink" + (onTindakan ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9" /></svg>
        Tindakan
      </Link>
      <Link href="/admin/tautan" onClick={closeMenu} className={"snavLink" + (onTautan ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" /></svg>
        Tautan
      </Link>
      <Link href="/admin/statistik" onClick={closeMenu} className={"snavLink" + (onStats ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
        Statistik
      </Link>
      <Link href="/admin/ai" onClick={closeMenu} className={"snavLink" + (onAi ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></svg>
        AI
      </Link>
      <Link href="/admin/percakapan" onClick={closeMenu} className={"snavLink" + (onChat ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        Percakapan
      </Link>
      <Link href="/admin/token" onClick={closeMenu} className={"snavLink" + (onToken ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
        Token
      </Link>
    </>
  );
}
