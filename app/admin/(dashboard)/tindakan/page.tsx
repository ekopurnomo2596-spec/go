import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getTindakan, type Item, type Tone } from "@/lib/tindakan";
import { askAiAction, doneTindakan, undoTindakan } from "../../actions";
import { formatTime } from "@/lib/format";
import { ActionForm } from "../forms";
import { Collapsible } from "./collapsible";
import { AiResult } from "./ai-result";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tindakan" };

const TAG: Record<Tone, { cls: string; label: string }> = {
  penting: { cls: "red", label: "Penting" },
  peluang: { cls: "grn", label: "Peluang" },
  info: { cls: "gry", label: "Info" },
};

function Card({ it, aiReady }: { it: Item; aiReady: boolean }) {
  const t = TAG[it.tone];
  const last = it.last;
  return (
    <div className={`tx-card has-ai${it.done ? " is-done" : ""}`}>
      <div className="tx-body">
        {!it.done && <span className={`tx-tag ${t.cls}`}>{t.label}</span>}
        <h3>{it.title}</h3>
        <p>{it.why}</p>
        {last && (
          <AiResult key={last.id} defaultOpen={Date.now() - last.t < 120000}>
            {last.hashtags.length > 0 && (
              <div className="ai-tags">
                {last.hashtags.map((h) => (
                  <span key={h} className="ai-tag">
                    {h}
                  </span>
                ))}
              </div>
            )}
            {last.saran && <p className="ai-saran">{last.saran}</p>}
            {last.langkah?.length > 0 && (
              <ol className="ai-steps">
                {last.langkah.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ol>
            )}
            <p className="ai-meta">
              {formatTime(last.t)} · {last.model} · <Link href="/admin/ai">Riwayat</Link>
            </p>
          </AiResult>
        )}
      </div>
      <div className="tx-btns">
        {!it.done &&
          (aiReady ? (
            <ActionForm action={askAiAction} btnClass={last ? "ghost" : "btn"} label={last ? "Minta ulang" : "Minta saran AI"}>
              <input type="hidden" name="id" value={it.id} />
            </ActionForm>
          ) : (
            <Link className="btn" href="/admin/token">
              Isi token AI
            </Link>
          ))}
        <ActionForm
          action={it.done ? undoTindakan : doneTindakan}
          btnClass="ghost"
          label={it.done ? "Batalkan" : "Tandai selesai"}
        >
          <input type="hidden" name="id" value={it.id} />
        </ActionForm>
      </div>
    </div>
  );
}

function Section({ title, items, limit, aiReady }: { title: string; items: Item[]; limit?: number; aiReady: boolean }) {
  if (!items.length) return null;
  const cards = items.map((it) => <Card key={it.id} it={it} aiReady={aiReady} />);
  return (
    <section>
      <div className="tx-sec">{title}</div>
      {limit ? <Collapsible limit={limit}>{cards}</Collapsible> : <div className="tx-list">{cards}</div>}
    </section>
  );
}

export default async function TindakanPage() {
  await requireAdmin();
  const { items, done, dataDays, linkCount, aiReady, hasPairs } = await getTindakan();
  const by = (t: Tone) => items.filter((i) => i.tone === t);
  const penting = by("penting");
  const peluang = by("peluang");
  const info = by("info");

  return (
    <main className="wrap">
      <div className="top">
        <div>
          <h1>Tindakan</h1>
          <div className="an-sub">Saran otomatis dari data 14 hari terakhir, diperbarui setiap halaman dibuka</div>
        </div>
        {items.length > 0 && (
          <div className="tx-sum">
            {penting.length > 0 && <span className="tx-tag red">{penting.length} penting</span>}
            {peluang.length > 0 && <span className="tx-tag grn">{peluang.length} peluang</span>}
            {info.length > 0 && <span className="tx-tag gry">{info.length} info</span>}
          </div>
        )}
      </div>

      {linkCount > 0 && dataDays < 14 && (
        <p className="tx-note">
          {dataDays === 0
            ? items.length > 0
              ? "Belum ada klik yang tercatat, jadi baru ada info awal. Saran lengkap muncul setelah ada data klik."
              : "Belum ada data klik, jadi belum ada saran."
            : `Data baru terkumpul ${dataDays} hari. Saran makin akurat setelah 14 hari, dan sebagian aturan baru aktif setelah itu.`}
        </p>
      )}

      {linkCount > 0 && !hasPairs && (
        <p className="tx-note">
          Kartu hashtag AI per sumber dan negara muncul setelah ada klik baru dari sumber yang dikenal, misalnya
          Instagram. Pencatatan pasangan sumber dan negara baru aktif sejak pembaruan ini.
        </p>
      )}

      {linkCount === 0 ? (
        <div className="an-empty">Belum ada tautan. Buat tautan dulu di halaman Tautan.</div>
      ) : items.length === 0 && done.length === 0 ? (
        <div className="an-empty">Tidak ada yang perlu dikerjakan saat ini.</div>
      ) : (
        <>
          {items.length === 0 && <div className="an-empty">Semua tindakan sudah ditandai selesai.</div>}
          <Section title="Perlu perhatian" items={penting} limit={5} aiReady={aiReady} />
          <Section title="Peluang" items={peluang} limit={3} aiReady={aiReady} />
          <Section title="Info" items={info} limit={3} aiReady={aiReady} />
          <Section title="Selesai" items={done} limit={3} aiReady={aiReady} />
        </>
      )}
    </main>
  );
}
