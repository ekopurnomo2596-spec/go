import { requireAdmin } from "@/lib/auth";
import { AI_MODEL, getKey, maskKey } from "@/lib/ai";
import { TokenForm } from "./token-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Token" };

export default async function TokenPage() {
  await requireAdmin();
  const key = await getKey();

  return (
    <main className="wrap">
      <div className="top">
        <div>
          <h1>Token</h1>
          <div className="an-sub">Token Gemini untuk saran AI di halaman Tindakan</div>
        </div>
      </div>

      <div className="panel">
        <h2>
          Gemini <small>{AI_MODEL}</small>
        </h2>
        <p className="tk-state">
          {key ? (
            <>
              Token tersimpan: <code>{maskKey(key)}</code>
            </>
          ) : (
            "Belum ada token."
          )}
        </p>
        <TokenForm masked={key ? maskKey(key) : null} />
        <p className="tk-help">
          Token disimpan di database dan hanya dipakai di server. Di layar hanya tampil sebagian, dan token yang sudah
          tersimpan tidak dikirim balik ke browser. Tombol Tampilkan hanya berlaku untuk teks yang sedang kamu ketik.
          Tes kunci memakai token yang diketik, atau token tersimpan kalau kolomnya kosong. AI hanya dipanggil saat
          tombol saran ditekan.
        </p>
      </div>
    </main>
  );
}
