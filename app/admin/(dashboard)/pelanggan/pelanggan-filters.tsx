"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { STATUS } from "@/lib/pelanggan";

export function PelangganFilters({ initialQ, initialS }: { initialQ: string; initialS: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initialQ);
  const [s, setS] = useState(initialS);
  const first = useRef(true);

  useEffect(() => {
    // Lewati jalan pertama (hasil dari server) supaya tidak langsung navigasi ulang.
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (s) params.set("s", s);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, s]);

  const reset = () => {
    setQ("");
    setS("");
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="pl-search" role="search">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari nama, negara, email, nomor, Instagram, catatan"
        aria-label="Cari pelanggan"
        autoComplete="off"
      />
      <select value={s} onChange={(e) => setS(e.target.value)} aria-label="Filter status">
        <option value="">Semua status</option>
        {STATUS.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      {(q || s) && (
        <button type="button" className="btn ghost" onClick={reset}>
          Reset
        </button>
      )}
    </div>
  );
}
