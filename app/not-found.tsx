import Link from "next/link";

export default function NotFound() {
  return (
    <main className="public" style={{ paddingTop: "56px" }}>
      <div className="brand center">
        <span className="badge">E</span>
        <span className="rule" />
        <span className="brandText">
          GO
          <small>emahairshop.com</small>
        </span>
      </div>

      <div className="code" aria-hidden="true">404</div>
      <div className="divider" />
      <h1 style={{ fontSize: "19px", fontWeight: 600, margin: 0 }}>Halaman tidak ditemukan</h1>
      <p className="lead" style={{ margin: "8px 0 32px", fontSize: ".81rem" }}>
        Tautan tidak valid atau sudah tidak tersedia.
      </p>

      <div className="linklist">
        <a href="/">
          <span className="ico">
            <svg viewBox="0 0 24 24">
              <path d="M3 11l9-8 9 8" />
              <path d="M5 10v10h5v-6h4v6h5V10" />
            </svg>
          </span>
          <span className="t">Kembali ke Beranda</span>
        </a>
      </div>

      <p className="foot">&copy; 2026 EMAHAIRSHOP. Seluruh hak cipta dilindungi.</p>
    </main>
  );
}
