import { ADMIN_BASE } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";
import { Logo } from "@/lib/logo";
import { SideNav } from "./side-nav";
import { Toast } from "./forms";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="shell">
      <input type="checkbox" id="nav" className="navToggle" />
      <label htmlFor="nav" className="navBackdrop" aria-hidden="true" />

      <aside className="sidebar">
        <Logo href={ADMIN_BASE} />

        <nav className="snav">
          <SideNav />
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
      <Toast />
    </div>
  );
}
