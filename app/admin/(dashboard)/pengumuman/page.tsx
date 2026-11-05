import { requireAdmin } from "@/lib/auth";
import { getInfo } from "@/lib/pengumuman";
import { PengumumanForm } from "./pengumuman-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengumuman" };

export default async function PengumumanPage() {
  await requireAdmin();
  const info = await getInfo().catch(() => null);

  return (
    <main className="wrap">
      <div className="top">
        <div>
          <h1>Pengumuman</h1>
          <div className="an-sub">Info singkat di bagian atas daftar tautan portal emahairshop.com</div>
        </div>
      </div>

      <div className="panel">
        <h2>
          Info portal{" "}
          <small>{info?.on ? "sedang tampil" : "tidak tampil"}</small>
        </h2>
        <PengumumanForm key={info?.v ?? 0} on={info?.on ?? false} text={info?.text ?? ""} url={info?.url ?? ""} />
      </div>
    </main>
  );
}
