import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatTime } from "@/lib/format";
import { clearChatsAction, deleteChatAction } from "../../actions";
import { ActionForm } from "../forms";
import { RefIcon } from "@/lib/sumber-icon";
import {
  RemoteError,
  SOURCES,
  getCfg,
  getConv,
  isSrc,
  listConvs,
  srcName,
  validChatId,
  type ChatRow,
  type Msg,
  type Src,
} from "@/lib/remote";

export const dynamic = "force-dynamic";
export const metadata = { title: "Percakapan" };

function stamp(ts: number): string {
  return new Date(ts).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "short", timeStyle: "short" });
}

export default async function PercakapanPage({ searchParams }: { searchParams: Promise<{ s?: string; id?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const src: Src = isSrc(sp.s) ? sp.s : "wa";
  const id = sp.id && validChatId(sp.id) ? sp.id : null;
  const cfg = await getCfg(src);

  let chats: ChatRow[] = [];
  let conv: { title: string; messages: Msg[] } | null = null;
  let error = "";
  if (cfg) {
    try {
      [chats, conv] = await Promise.all([listConvs(cfg, 100), id ? getConv(cfg, id) : Promise.resolve(null)]);
    } catch (e) {
      error = e instanceof RemoteError ? e.message : "Gagal membaca percakapan.";
    }
  }

  return (
    <main className="wrap">
      <div className="top">
        <div>
          <h1>Percakapan</h1>
          <div className="an-sub">Pesan masuk dan balasan bot. Tersimpan maksimal 30 hari. Hapus butuh token Redis dengan akses tulis.</div>
        </div>
        <nav className="cv-tabs" aria-label="Sumber percakapan">
          {SOURCES.map((s) => (
            <Link key={s.id} href={`/admin/percakapan?s=${s.id}`} aria-current={s.id === src ? "page" : undefined}>
              <RefIcon name={s.name} />
              {s.name}
            </Link>
          ))}
        </nav>
      </div>

      {!cfg ? (
        <section className="panel">
          <p className="empty">
            Redis {srcName(src)} belum tersambung. <Link href="/admin/token">Isi di halaman Token</Link>.
          </p>
        </section>
      ) : error ? (
        <section className="panel">
          <p className="empty">
            {error} <Link href="/admin/token">Periksa di halaman Token</Link>.
          </p>
        </section>
      ) : (
        <div className={"cv" + (id ? " has-sel" : "")}>
          <section className="panel cv-list">
            <h2>
              <span className="cn">
                <RefIcon name={srcName(src)} />
                {srcName(src)}
              </span>{" "}
              <small>{chats.length} percakapan</small>
            </h2>
            {chats.length > 0 && (
              <ActionForm
                action={clearChatsAction}
                formClass="cv-clear"
                btnClass="danger"
                confirm={`Hapus SEMUA percakapan ${srcName(src)}? Data di Redis bot ikut terhapus dan tidak bisa dikembalikan.`}
                label="Hapus semua"
              >
                <input type="hidden" name="src" value={src} />
              </ActionForm>
            )}
            {chats.length === 0 ? (
              <p className="empty">Belum ada percakapan.</p>
            ) : (
              <ul>
                {chats.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/admin/percakapan?s=${src}&id=${c.id}`}
                      className={"cv-item" + (c.id === id ? " on" : "")}
                    >
                      <span className="cv-t">{c.title}</span>
                      <span className="cv-m">
                        {formatTime(c.last)} · {c.count} pesan
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel cv-view">
            {id && conv ? (
              <>
                <Link className="back cv-back" href={`/admin/percakapan?s=${src}`}>
                  &larr; Semua percakapan
                </Link>
                <div className="cv-head">
                  <h2>
                    {conv.title} <small>{conv.messages.length} pesan</small>
                  </h2>
                  <ActionForm
                    action={deleteChatAction}
                    btnClass="danger"
                    confirm={`Hapus percakapan "${conv.title}"? Data di Redis bot ikut terhapus.`}
                    label="Hapus percakapan"
                  >
                    <input type="hidden" name="src" value={src} />
                    <input type="hidden" name="id" value={id} />
                  </ActionForm>
                </div>
                {conv.messages.length === 0 ? (
                  <p className="empty">Percakapan kosong atau sudah kedaluwarsa.</p>
                ) : (
                  <div className="cv-msgs">
                    {conv.messages.map((m, i) => (
                      <div className={"cv-b " + (m.r === "bot" ? "bot" : "user")} key={i}>
                        <span className="cv-who">{m.r === "bot" ? "Bot" : m.n || "Pengguna"}</span>
                        <p>{m.x}</p>
                        <span className="cv-ts">{m.t ? stamp(m.t) : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="empty">Pilih percakapan di sebelah kiri.</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
