import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";
import { Logo } from "@/lib/logo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="shell">
      <input type="checkbox" id="nav" className="navToggle" />
      <label htmlFor="nav" className="navBackdrop" aria-hidden="true" />

      <aside className="sidebar">
        <Logo href="/admin" />

        <nav className="snav">
          <Link href="/admin" className="snavLink active">
            <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" /></svg>
            Tautan
          </Link>
          <a href="/" target="_blank" rel="noreferrer" className="snavLink">
            <svg viewBox="0 0 24 24"><path d="M14 3h7v7M10 14 21 3M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" /></svg>
            Lihat halaman publik
          </a>
          <a href="https://emahairshop.com" target="_blank" rel="noreferrer" className="snavLink">
            <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
            emahairshop.com
          </a>
        </nav>

        <form action={logout} className="snavFoot">
          <button type="submit" className="snavLink out">
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Keluar
          </button>
        </form>
      </aside>

      <div className="content">
        <label htmlFor="nav" className="navBtn" aria-label="Buka menu">
          <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </label>
        {children}
      </div>
    </div>
  );
}
