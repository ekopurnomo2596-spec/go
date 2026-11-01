// Alamat halaman login. Diatur lewat env LOGIN_PATH (contoh: masuk-ema-7x2k).
// Kalau diisi: halaman login hanya ada di /<LOGIN_PATH>, /admin/login jadi 404,
// dan /admin tampil 404 untuk yang belum login. Setelah login, dashboard tetap di /admin.
// Kalau kosong: seperti biasa (/admin/login).
// NEXT_PUBLIC_ADMIN_PATH (nama lama) tetap dibaca supaya pengaturan sebelumnya tidak hilang.
export const LOGIN_PATH = (process.env.LOGIN_PATH || process.env.NEXT_PUBLIC_ADMIN_PATH || "").replace(/^\/+|\/+$/g, "");
export const LOGIN_BASE = LOGIN_PATH ? `/${LOGIN_PATH}` : "/admin/login";
