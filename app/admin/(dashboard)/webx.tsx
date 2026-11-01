import { removeWebStatsAction } from "../actions";
import { ActionForm } from "./forms";

/** Ikon tong sampah hapus per hari / per negara di Dashboard. */
export function WebX({ mode, value, label }: { mode: "day" | "country"; value: string; label: string }) {
  return (
    <ActionForm
      action={removeWebStatsAction}
      formClass="xf"
      btnClass="xbtn"
      title="Hapus"
      confirm={`Hapus data ${label}? Angka total ikut berkurang.`}
      label={
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6" />
        </svg>
      }
    >
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="value" value={value} />
    </ActionForm>
  );
}
