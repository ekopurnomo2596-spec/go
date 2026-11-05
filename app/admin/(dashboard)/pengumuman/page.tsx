import { requireAdmin } from "@/lib/auth";
import { INFO_LANGS, getInfo, infoStatus } from "@/lib/pengumuman";
import { PengumumanForm } from "./pengumuman-form";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // terjemahan AI bisa beberapa detik
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
          <small>{{ tampil: "sedang tampil", terjadwal: "terjadwal, belum mulai", berakhir: "jadwal sudah berakhir", mati: "tidak tampil" }[info ? infoStatus(info) : "mati"]}</small>
        </h2>
        <PengumumanForm key={info?.v ?? 0} on={info?.on ?? false} text={info?.text ?? ""} url={info?.url ?? ""} startAt={info?.start ?? null} endAt={info?.end ?? null} />
      </div>

      {info && Object.keys(info.texts).length > 0 && (
        <div className="panel">
          <h2>
            Terjemahan <small>dibuat AI saat disimpan</small>
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8, fontSize: 14 }}>
            {INFO_LANGS.filter((l) => info.texts[l]).map((l) => (
              <li key={l} style={{ display: "flex", gap: 10 }}>
                <b style={{ width: 24, textTransform: "uppercase", opacity: 0.6 }}>{l}</b>
                <span dir={l === "ar" ? "rtl" : "ltr"}>{info.texts[l]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
