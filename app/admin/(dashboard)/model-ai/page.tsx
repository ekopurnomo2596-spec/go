import { requireAdmin } from "@/lib/auth";
import { getChatKey, getModels, maskChatToken } from "@/lib/chatai";
import { ChatKeyForm } from "./chat-key-form";
import { ModelsForm } from "./models-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Model AI" };

export default async function ModelAiPage() {
  await requireAdmin();
  const key = await getChatKey();
  const { models, source } = await getModels();

  return (
    <main className="wrap">
      <style>{`
        .ma-row { display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
        .ma-row:last-child { border-bottom: 0; }
        .ma-num { width: 18px; color: var(--muted); text-align: center; font-size: .78rem; flex: none; }
        .ma-name { flex: 1 1 auto; min-width: 120px; font-family: ui-monospace, Menlo, monospace; font-size: .85rem; overflow-wrap: anywhere; }
        .ma-row button { padding: 5px 10px; font-size: .76rem; flex: none; }
        .ma-add { display: flex; gap: 8px; margin-top: 4px; }
        .ma-add input { flex: 1; }
        .ma-hint { color: var(--muted); font-size: .8rem; margin: 10px 0 0; }
        .ma-foot { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
        .ma-sugg { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .ma-sugg button { padding: 4px 10px; font-size: .76rem; border-radius: 999px; }
      `}</style>
      <div className="top">
        <div>
          <h1>Model AI</h1>
          <div className="an-sub">Model Gemini yang dipakai chatbot web di emahairshop.com</div>
        </div>
      </div>

      <div className="panel">
        <h2>
          Token Gemini <small>terpisah dari token AI go di halaman Token</small>
        </h2>
        <p className="ma-hint" style={{ margin: "0 0 14px" }}>
          Hanya dipakai untuk tombol <strong>Tes</strong> di bawah dan daftar saran model. Chatbot sendiri tetap
          jalan pakai token yang sudah di-set di environment Vercel portal — token di sini tidak menggantikannya.
        </p>
        <ChatKeyForm masked={key ? maskChatToken(key) : null} testModel={models[0] ?? "gemini-2.5-flash"} />
      </div>

      <div className="panel">
        <h2>
          Daftar model <small>{source === "admin" ? "diatur dari sini" : "bawaan portal, belum pernah diubah"}</small>
        </h2>
        <p className="ma-hint" style={{ margin: "0 0 14px" }}>
          Dicoba berurutan dari atas; kalau gagal atau kuota habis, chatbot lanjut ke model berikutnya. Perubahan
          dibaca portal dalam ±30 detik.
        </p>
        <ModelsForm initial={models} hasKey={!!key} />
      </div>
    </main>
  );
}
