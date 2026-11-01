import Link from "next/link";

export default function NotFound() {
  return (
    <main className="public" style={{ textAlign: "center", paddingTop: "18vh" }}>
      <h1 style={{ fontSize: "1.5rem" }}>Tautan tidak ditemukan</h1>
      <p className="lead">Alamat yang kamu buka tidak terdaftar atau sudah diganti.</p>
      <Link href="/" style={{ color: "var(--gold)", fontWeight: 600 }}>Lihat semua tautan</Link>
    </main>
  );
}
