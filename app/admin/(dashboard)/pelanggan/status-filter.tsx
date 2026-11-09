"use client";

import { STATUS } from "@/lib/pelanggan";

export function StatusFilter({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      name="s"
      defaultValue={defaultValue}
      aria-label="Filter status"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      <option value="">Semua status</option>
      {STATUS.map((x) => (
        <option key={x.id} value={x.id}>
          {x.name}
        </option>
      ))}
    </select>
  );
}
