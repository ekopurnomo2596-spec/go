/** Tanggal (YYYY-MM-DD) dalam zona WIB, dengan geser mundur `daysAgo` hari. */
export function jakartaDay(daysAgo = 0): string {
  return new Date(Date.now() + 7 * 3600e3 - daysAgo * 86400e3).toISOString().slice(0, 10);
}

export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code) || code === "XX") return "Tidak diketahui";
  try {
    return new Intl.DisplayNames(["id"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
