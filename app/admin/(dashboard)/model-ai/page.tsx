import { requireAdmin } from "@/lib/auth";
import { DEFAULT_PROMPT, MAX_CHAT_KEYS, MAX_KEY_NAME, chatKeyId, getChatKey, getChatKeyNames, getChatKeys, getModels, getPrompt, maskChatToken } from "@/lib/chatai";
import { ChatKeysForm } from "./chat-keys-form";
import { ChatToggle } from "./chat-toggle";
import { EmbedSnippet } from "./embed-snippet";
import { HideForm } from "./hide-form";
import { ModelsForm } from "./models-form";
import { PromptForm } from "./prompt-form";
import { getChatEnabled, getChatHide, getChatLimit, getChatStyle } from "@/lib/webchat";
import { StyleForm } from "./style-form";
import { LimitForm } from "./limit-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan Chatbot" };

export default async function ModelAiPage() {
  await requireAdmin();
  const { models, source } = await getModels();
  const { data: prompt, source: promptSource } = await getPrompt();
  const chatOn = await getChatEnabled();
  const hideRules = await getChatHide();
  const limit = await getChatLimit();
  const style = await getChatStyle();
  const chatKeys = await getChatKeys();
  const keyNames = await getChatKeyNames();
  const hasTestKey = chatKeys.length > 0 || !!(await getChatKey());

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
        .wrap input:not([type]), .wrap textarea { width: 100%; padding: 10px 12px; font: inherit; font-size: .9rem; background: var(--bg); color: var(--ink); border: 1px solid var(--line); border-radius: 10px; transition: border-color .15s; outline: none; }
        .wrap input:not([type]):focus, .wrap textarea:focus { border-color: var(--gold); }
        .pr-field textarea { font-family: ui-monospace, Menlo, monospace; font-size: .78rem; line-height: 1.55; resize: vertical; min-height: 160px; }
        .pr-vars label span, .pr-field > span { color: var(--muted); }
        .ma-nav { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 22px; }
        .ma-nav a { padding: 6px 14px; border: 1px solid var(--line); border-radius: 999px; font-size: .82rem; color: var(--ink); text-decoration: none; background: var(--card); }
        .ma-nav a:hover { border-color: var(--lineh); }
        .ma-sec { margin: 34px 0 14px; scroll-margin-top: 16px; }
        .ma-sec:first-of-type { margin-top: 0; }
        .ma-sec h2 { margin: 0; font-size: 1.1rem; }
        .ma-sec p { margin: 4px 0 0; color: var(--muted); font-size: .84rem; }
        .ma-adv > summary { cursor: pointer; font-weight: 600; font-size: .95rem; }
        .ma-adv[open] > summary { margin-bottom: 14px; }
        .ma-sugg button { padding: 4px 10px; font-size: .76rem; border-radius: 999px; }

        /* Gaya seragam semua panel, mengikuti halaman Token */
        .wrap .panel h2 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
        .wrap .panel h2 small { margin-left: 0; }
        .wrap .panel button:not(.st-opt):not(.ct-sw) { min-height: 32px; padding: 0 12px; font-size: 13px; font-weight: 500; line-height: 1.2; border-radius: 8px; box-shadow: none; }
        .wrap .panel button:not(.ghost):not(.danger):not(.st-opt):not(.ct-sw) { background: #3b6ef0; border: 1px solid #3b6ef0; color: #fff; }
        .wrap .panel button:not(.ghost):not(.danger):not(.st-opt):not(.ct-sw):hover:not(:disabled) { background: #2f5fd8; border-color: #2f5fd8; }
        .wrap .panel button.ghost:not(.st-opt) { background: var(--card); border: 1px solid var(--line); color: var(--ink); }
        .wrap .panel button.ghost:not(.st-opt):hover:not(:disabled) { background: var(--hover); }
        .wrap .panel button.danger { background: var(--card); border: 1px solid #efc4c4; color: #c93636; }
        .wrap .panel button.danger:hover:not(:disabled) { background: #fff5f5; }
        .wrap .panel button:disabled { opacity: .55; cursor: not-allowed; }
        .wrap .panel .st button.st-opt { min-height: 30px; padding: 0 12px; font-size: 13px; font-weight: 500; }
        .wrap .panel .st button.st-opt.on { background: #3b6ef0; border-color: #3b6ef0; color: #fff; }
        .wrap input:not([type]), .wrap textarea { border-radius: 8px; font-size: 14px; }
        .wrap input:not([type]) { height: 36px; padding: 0 12px; }
        .wrap input:not([type]):focus, .wrap textarea:focus, .wrap .pf textarea.pf-area:focus { border-color: #3b6ef0; box-shadow: 0 0 0 3px rgba(59, 110, 240, .15); }
        .wrap .ma-hint { font-size: 12px; line-height: 1.5; }
        .wrap .ma-foot, .wrap .ma-add { gap: 8px; }
      `}</style>
      <div className="top">
        <div>
          <h1>Pengaturan Chatbot</h1>
          <div className="an-sub">Atur kapan chatbot tampil, bagaimana tampilannya, dan cara menjawabnya di emahairshop.com dan seluruh subdomain.</div>
        </div>
      </div>

      <nav className="ma-nav" aria-label="Lompat ke bagian">
        <a href="#umum">Umum</a>
        <a href="#tampilan">Tampilan &amp; pemasangan</a>
        <a href="#prompt">Isi prompt</a>
        <a href="#teknis">Model &amp; key AI</a>
      </nav>

      <div className="ma-sec" id="umum">
        <h2>Umum</h2>
        <p>Aktifkan chatbot dan atur batas pemakaian.</p>
      </div>

      <div className="panel">
        <h2>
          Tampilkan chat di website <small>emahairshop.com</small>
        </h2>
        <ChatToggle initial={chatOn} />
      </div>

      <div className="panel">
        <h2>
          Batas chat per hari <small>{limit ? "Diatur dari sini" : "Belum diatur, memakai 300"}</small>
        </h2>
        <LimitForm initial={limit} />
      </div>

      <div className="ma-sec" id="tampilan">
        <h2>Tampilan &amp; pemasangan</h2>
        <p>Gaya widget, halaman yang dikecualikan, dan kode pemasangan.</p>
      </div>

      <div className="panel">
        <h2>
          Tampilan widget <small>Bentuk, animasi, warna</small>
        </h2>
        <StyleForm initial={style} />
      </div>

      <div className="panel">
        <h2>
          Halaman yang disembunyikan <small>Mis. order, checkout, keranjang</small>
        </h2>
        <HideForm initial={hideRules} />
      </div>

      <div className="panel">
        <h2>
          Kode pemasangan <small>Satu baris, tinggal tempel</small>
        </h2>
        <EmbedSnippet />
      </div>

      <div className="ma-sec" id="prompt">
        <h2>Isi prompt</h2>
        <p>Menentukan isi dan gaya jawaban chatbot.</p>
      </div>

      <div className="panel">
        <h2>
          Prompt chatbot <small>{promptSource === "admin" ? "Diatur dari sini" : "Belum disimpan"}</small>
        </h2>
        {promptSource === "default" && (
          <p className="ma-hint" style={{ margin: "0 0 14px" }}>
            <strong>Belum disimpan:</strong> editor memuat teks bawaan, tetapi chatbot memakai prompt darurat singkat
            sampai kamu klik <strong>Simpan</strong>.
          </p>
        )}
        <PromptForm initial={prompt} defaults={DEFAULT_PROMPT} />
      </div>

      <div className="ma-sec" id="teknis">
        <h2>Model &amp; key AI</h2>
        <p>Pengaturan teknis, biasanya cukup diisi sekali.</p>
      </div>

      <div className="panel ck-panel">
        <h2>
          Key Gemini chatbot <small>{chatKeys.length ? `${chatKeys.length} key aktif` : "Belum ada key"}</small>
        </h2>
        <ChatKeysForm
          items={chatKeys.map((k) => ({ mask: maskChatToken(k), name: keyNames[chatKeyId(k)] ?? "" }))}
          max={MAX_CHAT_KEYS}
          maxName={MAX_KEY_NAME}
        />
      </div>

      <div className="panel">
        <h2>
          Daftar model <small>{source === "admin" ? "Diatur dari sini" : "Bawaan"}</small>
        </h2>
        <p className="ma-hint" style={{ margin: "0 0 14px" }}>
          Dicoba berurutan dari atas; jika gagal atau kuota habis, lanjut ke model berikutnya. Perubahan aktif dalam
          ±30 detik.
        </p>
        <ModelsForm initial={models} hasKey={hasTestKey} />
      </div>
    </main>
  );
}
