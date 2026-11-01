export type Flash = { kind: "ok" | "err"; text: string };

/** Tampilkan pesan singkat (toast) dari mana saja di sisi browser. */
export function flash(f: Flash) {
  window.dispatchEvent(new CustomEvent("flash", { detail: f }));
}
