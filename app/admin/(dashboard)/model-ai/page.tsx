import { requireAdmin } from "@/lib/auth";
import { DEFAULT_PROMPT, getChatKey, getModels, getPrompt, maskChatToken } from "@/lib/chatai";
import { ChatKeyForm } from "./chat-key-form";
import { ChatToggle } from "./chat-toggle";
import { EmbedSnippet } from "./embed-snippet";
import { ModelsForm } from "./models-form";
import { PromptForm } from "./prompt-form";
import { getChatEnabled } from "@/lib/webchat";

export const dynamic = "force-dynamic";
export const metadata = { title: "Model AI" };

export default async function ModelAiPage() {
  await requireAdmin();
  const key = await getChatKey();
  const { models, source } = await getModels();
  const { data: prompt, source: promptSource } = await getPrompt();
  const chatOn = await getChatEnabled();

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
        .ct-row { display: flex; align-items: center; gap: 14px; }
        .ct-sw { position: relative; flex: none; width: 46px; height: 26px; padding: 0; border-radius: 999px; border: 1px solid var(--line); background: var(--line); cursor: pointer; transition: background .15s; }
        .ct-sw.on { background: #25a35a; border-color: #25a35a; }
        .ct-knob { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .15s; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
        .ct-sw.on .ct-knob { transform: translateX(20px); }
        .ct-sw:disabled { opacity: .6; cursor: default; }
        .pr-vars { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 14px; }
        .pr-vars label, .pr-field { display: flex; flex-direction: column; gap: 6px; font-size: .82rem; }
        .pr-field { margin-bottom: 14px; }
        .pr-field small { color: var(--muted); margin-left: 6px; }
        .pr-field textarea { width: 100%; font-family: ui-monospace, Menlo, monospace; font-size: .78rem; line-height: 1.5; resize: vertical; min-height: 160px; }
        .ma-sugg button { padding: 4px 10px; font-size: .76rem; border-radius: 999px; }
      `}</style>
      <div className="top">
        <div>
          <h1>Model AI</h1>
          <div className="an-sub">Model dan prompt Gemini yang dipakai chatbot web di emahairshop.com</div>
        </div>
      </div>

      <div className="panel">
        <h2>
          Tampilkan chat di website <small>emahairshop.com</small>
        </h2>
        <ChatToggle initial={chatOn} />
      </div>

      <div className="panel">
        <h2>
          Pasang di subdomain <small>satu baris, tinggal tempel</small>
        </h2>
        <EmbedSnippet />
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

      <div className="panel">
        <h2>
          Prompt chatbot <small>{promptSource === "admin" ? "diatur dari sini" : "belum disimpan dari sini"}</small>
        </h2>
        <p className="ma-hint" style={{ margin: "0 0 14px" }}>
          Dulu ada di <code>api/chat.js</code> di portal, sekarang diatur dari sini dan dibaca portal dalam ±30 detik.
          {promptSource === "default" && (
            <>
              {" "}
              <strong>Belum pernah disimpan:</strong> editor berisi teks bawaan, tapi chatbot memakai prompt darurat
              yang sangat pendek sampai kamu klik <strong>Simpan</strong> sekali.
            </>
          )}
        </p>
        <PromptForm initial={prompt} defaults={DEFAULT_PROMPT} />
      </div>
    </main>
  );
}
