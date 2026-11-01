"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function closeMenu() {
  const t = document.getElementById("nav") as HTMLInputElement | null;
  if (t) t.checked = false;
}

export function SideNav() {
  const path = usePathname() ?? "";
  const onTautan = path.startsWith("/admin/tautan");
  const onStats = path.startsWith("/admin/statistik");
  const onDash = !onTautan && !onStats;
  return (
    <>
      <Link href="/admin" onClick={closeMenu} className={"snavLink" + (onDash ? " active" : "")}>
        <svg viewBox="0 0 24 24"><path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" /></svg>
        Dashboard
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
