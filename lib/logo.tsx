import Link from "next/link";

export function Logo({ href = "/", center = false }: { href?: string; center?: boolean }) {
  return (
    <Link className={center ? "lg center" : "lg"} href={href}>
      <div className="logo-nav-container">
        <div className="logo-top">
          <span className="line-top" />
          <span className="text-ext">Extension</span>
        </div>
        <div className="logo-main">EMAHAIRSHOP</div>
        <div className="line-bottom" />
        <div className="logo-year">2019</div>
      </div>
    </Link>
  );
}
