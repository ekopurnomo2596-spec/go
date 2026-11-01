import Link from "next/link";

export default function NotFound() {
  return (
    <main className="public" style={{ textAlign: "center", paddingTop: "14vh" }}>
      <div className="brand center">
        <span className="badge">E</span>
        <span className="rule" />
        <span className="brandText">
          GO
          <small>emahairshop.com</small>
        </span>
      </div>
      <p className="lead" style={{ margin: "22px 0" }}>Tautan tidak ditemukan. Alamat yang kamu buka tidak terdaftar atau sudah diganti.</p>
      <Link href="/" className="btn">Lihat semua tautan</Link>
    </main>
  );
}
