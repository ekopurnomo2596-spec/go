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
  const onInfo = path.startsWith("/admin/pengumuman");
  const onModelAi = path.startsWith("/admin/model-ai");
  const onDash = !onAnalisa && !onTindakan && !onTautan && !onStats && !onAi && !onChat && !onToken && !onInfo && !onModelAi;
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
      <Link href="/admin/percakapan" onClick={closeMenu} className={"snavLink" + (onChat ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        Percakapan
      </Link>
      <Link href="/admin/tindakan" onClick={closeMenu} className={"snavLink" + (onTindakan ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9" /></svg>
        Tindakan
      </Link>
      <Link href="/admin/tautan" onClick={closeMenu} className={"snavLink" + (onTautan ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" /></svg>
        Tautan
      </Link>
      <Link href="/admin/pengumuman" onClick={closeMenu} className={"snavLink" + (onInfo ? " active" : "")}>
        <svg viewBox="0 0 512 512" style={{ fill: "currentColor", stroke: "none" }}><path d="M480 32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9L381.7 53c-48 48-113.1 75-181 75H192 160 64c-35.3 0-64 28.7-64 64v96c0 35.3 28.7 64 64 64l0 128c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V352l8 0c67.9 0 133 27 181 75l43.6 43.6c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V300.4c18.6-8.8 32-32.5 32-60.4s-13.4-51.6-32-60.4V32zm-64 76.7V240 371.3C357.2 317.8 280.5 288 200.1 288H192V192h8.1c80.4 0 157.1-29.8 215.9-83.3z" /></svg>
        Pengumuman
      </Link>
      <Link href="/admin/model-ai" onClick={closeMenu} className={"snavLink" + (onModelAi ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 1 3 3v2h1a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h1V5a3 3 0 0 1 3-3zM9 12v3M15 12v3M4 10h2M4 15h2M18 10h2M18 15h2" /></svg>
        Pengaturan Chatbot
      </Link>
      <Link href="/admin/statistik" onClick={closeMenu} className={"snavLink" + (onStats ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
        Statistik
      </Link>
      <Link href="/admin/ai" onClick={closeMenu} className={"snavLink" + (onAi ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></svg>
        Riwayat Saran AI
      </Link>
      <Link href="/admin/token" onClick={closeMenu} className={"snavLink" + (onToken ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
        Token
      </Link>
    </>
  );
}
