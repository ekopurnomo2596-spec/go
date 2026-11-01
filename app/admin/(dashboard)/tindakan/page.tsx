import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getTindakan, type Item, type Tone } from "@/lib/tindakan";
import { doneTindakan, undoTindakan } from "../../actions";
import { ActionForm } from "../forms";
import { Collapsible } from "./collapsible";

export const dynamic = "force-dynamic";

const TAG: Record<Tone, { cls: string; label: string }> = {
  penting: { cls: "red", label: "Penting" },
  peluang: { cls: "grn", label: "Peluang" },
  info: { cls: "gry", label: "Info" },
};

function Card({ it }: { it: Item }) {
  const t = TAG[it.tone];
  return (
    <div className={`tx-card${it.done ? " is-done" : ""}`}>
      <div className="tx-body">
        {!it.done && <span className={`tx-tag ${t.cls}`}>{t.label}</span>}
        <h3>{it.title}</h3>
        <p>{it.why}</p>
      </div>
      <div className="tx-btns">
        {!it.done && (
          <Link className="btn" href={it.href}>
            {it.cta}
          </Link>
        )}
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

function Section({ title, items, limit }: { title: string; items: Item[]; limit?: number }) {
  if (!items.length) return null;
  const cards = items.map((it) => <Card key={it.id} it={it} />);
  return (
    <section>
      <div className="tx-sec">{title}</div>
      {limit ? <Collapsible limit={limit}>{cards}</Collapsible> : <div className="tx-list">{cards}</div>}
    </section>
  );
}

export default async function TindakanPage() {
  await requireAdmin();
  const { items, done, dataDays, linkCount } = await getTindakan();
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

      {linkCount === 0 ? (
        <div className="an-empty">Belum ada tautan. Buat tautan dulu di halaman Tautan.</div>
      ) : items.length === 0 && done.length === 0 ? (
        <div className="an-empty">Tidak ada yang perlu dikerjakan saat ini.</div>
      ) : (
        <>
          {items.length === 0 && <div className="an-empty">Semua tindakan sudah ditandai selesai.</div>}
          <Section title="Perlu perhatian" items={penting} limit={5} />
          <Section title="Peluang" items={peluang} limit={3} />
          <Section title="Info" items={info} limit={3} />
          <Section title="Selesai" items={done} limit={3} />
        </>
      )}
    </main>
  );
}
