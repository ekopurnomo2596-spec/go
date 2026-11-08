import { requireAdmin } from "@/lib/auth";
import { LABEL_BUTTONS, getLabels } from "@/lib/labels";
import { LabelForm } from "./label-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Label tombol" };

export default async function LabelPage() {
  await requireAdmin();
  const labels = await getLabels().catch(() => null);

  return (
    <main className="wrap">
      <div className="top">
        <div>
          <h1>Label tombol</h1>
          <div className="an-sub">Label kecil di samping nama tombol pada portal emahairshop.com</div>
        </div>
      </div>

      <div className="panel">
        <h2>
          Tombol portal <small>{labels ? `${Object.values(labels).filter((l) => l.on).length} label tampil` : "belum bisa dibaca"}</small>
        </h2>
        <LabelForm buttons={[...LABEL_BUTTONS]} initial={labels ?? {}} />
      </div>
    </main>
  );
}
