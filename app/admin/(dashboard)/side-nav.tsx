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
  const onDash = !onAnalisa && !onTindakan && !onTautan && !onStats;
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
    </>
  );
}
