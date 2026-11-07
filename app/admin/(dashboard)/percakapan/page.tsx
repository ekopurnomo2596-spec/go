import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatTime } from "@/lib/format";
import { clearChatsAction, deleteChatAction } from "../../actions";
import { ActionForm, SyncUsage } from "../forms";
import { RefIcon } from "@/lib/sumber-icon";
import {
  RemoteError,
  SOURCES,
  getCfg,
  getConv,
  getSvcUsage,
  isSrc,
  listConvs,
  srcName,
  validChatId,
  type ChatRow,
  type SvcUsage,
  type Msg,
  type Src,
} from "@/lib/remote";
import { getWebConv, listWebConvs, validWebId } from "@/lib/webchat";

export const dynamic = "force-dynamic";
export const metadata = { title: "Percakapan" };

type Tab = Src | "web";
const TABS: { id: Tab; name: string }[] = [...SOURCES, { id: "web", name: "Website" }];

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const num = (n: number) => n.toLocaleString("id-ID");

function stamp(ts: number): string {
  return new Date(ts).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "short", timeStyle: "short" });
}

export default async function PercakapanPage({ searchParams }: { searchParams: Promise<{ s?: string; id?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  // "web" = chat di website emahairshop.com. Datanya ada di Redis go sendiri (ditulis portal), jadi tidak perlu token sumber.
  const isWeb = sp.s === "web";
  const src: Tab = isWeb ? "web" : isSrc(sp.s) ? sp.s : "wa";
  const id = sp.id && (isWeb ? validWebId(sp.id) : validChatId(sp.id)) ? sp.id : null;
  const cfg = isWeb ? null : await getCfg(src as Src);
  const name = isWeb ? "Website" : srcName(src as Src);

  let chats: ChatRow[] = [];
  let conv: { title: string; messages: Msg[] } | null = null;
  let usage: SvcUsage | null = null;
  let error = "";
  if (isWeb) {
    try {
      [chats, conv] = await Promise.all([listWebConvs(100), id ? getWebConv(id) : Promise.resolve(null)]);
    } catch {
      error = "Gagal membaca percakapan Website.";
    }
  } else if (cfg) {
    try {
      [chats, conv, usage] = await Promise.all([
        listConvs(cfg, 100),
        id ? getConv(cfg, id) : Promise.resolve(null),
        src === "wa" ? getSvcUsage(cfg).catch(() => null) : Promise.resolve(null),
      ]);
    } catch (e) {
      error = e instanceof RemoteError ? e.message : "Gagal membaca percakapan.";
    }
  }

  return (
    <main className="wrap">
      <div className="top">
        <div>
          <h1>Percakapan</h1>
          <div className="an-sub">
            {isWeb ? "Chat pengunjung di emahairshop.com, balasan AI dan tim. " : "Pesan masuk dan balasan AI. "}Tersimpan maksimal 30 hari.
          </div>
        </div>
        <nav className="cv-tabs" aria-label="Sumber percakapan">
          {TABS.map((s) => (
            <Link key={s.id} href={`/admin/percakapan?s=${s.id}`} aria-current={s.id === src ? "page" : undefined}>
              <RefIcon name={s.name} />
              {s.name}
            </Link>
          ))}
        </nav>
      </div>

      {!isWeb && !cfg ? (
        <section className="panel">
          <p className="empty">
            Redis {name} belum tersambung. <Link href="/admin/token">Isi di halaman Token</Link>.
          </p>
        </section>
      ) : error ? (
        <section className="panel">
          <p className="empty">
            {error} <Link href="/admin/token">Periksa di halaman Token</Link>.
          </p>
        </section>
      ) : (
        <>
        {usage && <UsageBar u={usage} />}
        <div className={"cv src-" + src + (id ? " has-sel" : "")}>
          <section className="panel cv-list">
            <div className="cv-lh">
              <h2>
                <span className="cn">
                  <RefIcon name={name} />
                  {name}
                </span>
                <small>{chats.length} chat</small>
              </h2>
              {chats.length > 0 && (
                <ActionForm
                  action={clearChatsAction}
                  formClass="cv-clear"
                  btnClass="danger"
                  confirm={`Hapus SEMUA percakapan ${name}? Datanya ikut terhapus dan tidak bisa dikembalikan.`}
                  label="Hapus semua"
                >
                  <input type="hidden" name="src" value={src} />
                </ActionForm>
              )}
            </div>
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
                    confirm={`Hapus percakapan "${conv.title}"? Datanya ikut terhapus.`}
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
                        <span className="cv-who">{m.r === "bot" ? (isWeb && m.n ? m.n : "AI") : m.n || (isWeb ? "Pengunjung" : "Pengguna")}</span>
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
        </>
      )}
    </main>
  );
}

function UsageBar({ u }: { u: SvcUsage }) {
  const pct = Math.min(100, Math.round((u.used / u.free) * 100));
  const over = u.used > u.free;
  const [ry, rm, rd] = u.reset.split("-").map(Number);
  return (
    <section className="panel usage" aria-label="Pemakaian pesan bulan ini">
      <div className="usage-h">
        <b>Pesan layanan bulan ini</b>
        <span className="usage-r">
          <span className={over ? "bad" : ""}>
            {num(u.used)} / {num(u.free)}
          </span>
          <SyncUsage />
        </span>
      </div>
      <div className="usage-bar" role="progressbar" aria-valuemin={0} aria-valuemax={u.free} aria-valuenow={Math.min(u.used, u.free)}>
        <span className={pct >= 90 ? "hot" : pct >= 70 ? "warm" : ""} style={{ width: pct + "%" }} />
      </div>
      <p className="usage-n">
        {over ? `Jatah gratis habis, ${num(u.used - u.free)} balasan terakhir ditagih Meta.` : `Sisa ${num(u.free - u.used)} balasan gratis.`} Reset {rd}{" "}
        {BULAN[rm - 1]} {ry}.{" "}
        {u.metaAt ? `Angka Meta terakhir disinkronkan ${stamp(u.metaAt)}.` : "Angka Meta belum pernah disinkronkan."}
      </p>
    </section>
  );
}
