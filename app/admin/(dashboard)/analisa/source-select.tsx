"use client";

import { useRouter } from "next/navigation";

export function SourceSelect({
  value,
  days,
  options,
}: {
  value: string;
  days: number;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  return (
    <select
      className="an-src"
      aria-label="Sumber data"
      value={value}
      onChange={(e) => router.push(`/admin/analisa?days=${days}&src=${e.target.value}`)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
