// Alamat dashboard admin. Diatur lewat NEXT_PUBLIC_ADMIN_PATH (contoh: panel-ema-7x2k).
// Kalau kosong, tetap /admin. Kalau diisi, /admin otomatis jadi 404 (lihat middleware.ts).
export const ADMIN_PATH = (process.env.NEXT_PUBLIC_ADMIN_PATH || "admin").replace(/^\/+|\/+$/g, "") || "admin";
export const ADMIN_BASE = `/${ADMIN_PATH}`;
