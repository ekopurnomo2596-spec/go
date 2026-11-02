# go.emahairshop.com

Pemendek tautan EMAHAIRSHOP dengan dashboard statistik. Next.js (App Router) + Upstash Redis, dipasang di Vercel.

## Fitur
- Redirect `go.emahairshop.com/<slug>` ke URL tujuan (302, jadi tujuan bisa diganti kapan saja).
- Hitung klik total, klik per negara, klik per hari (WIB), dan 50 klik terbaru (waktu, negara, sumber, perangkat).
- Dashboard `/admin`: buat, ubah, dan hapus link. Menghapus link ikut menghapus semua datanya.
- Halaman depan `/` menampilkan link yang diberi centang "Tampilkan di halaman depan".
- Bot dan pratinjau tautan (WhatsApp, Telegram, Slack, dll.) tidak dihitung.
- Yang disimpan hanya kode negara, domain sumber, dan jenis perangkat. Alamat IP tidak disimpan.

## Pasang
1. Push folder ini ke repo GitHub.
2. Di Vercel: **Add New, Project**, pilih repo itu (Framework: Next.js, otomatis).
3. Di project Vercel buka **Storage**, tambahkan **Upstash Redis** (Marketplace), sambungkan ke project ini.
   Variabel database akan terisi otomatis.
4. Di **Settings, Environment Variables**, tambahkan:
   - `ADMIN_PASSWORD`: password login dashboard (panjang dan unik)
   - `SESSION_SECRET`: acak minimal 32 karakter, buat dengan `openssl rand -base64 32`
5. Deploy ulang setelah variabel ditambahkan.
6. **Settings, Domains**: tambahkan `go.emahairshop.com`, lalu di DNS buat CNAME `go` ke nilai yang ditampilkan Vercel.
7. Buka `https://go.emahairshop.com/admin`, login, lalu klik tombol untuk menambahkan 7 link awal.

## Saran AI (Gemini)
- Halaman **Token**: isi token Gemini (disimpan di Redis, bukan di Vercel; tidak perlu env tambahan). Ada tombol Tampilkan dan Tes kunci.
- Halaman **Tindakan**: setiap kartu punya tombol **Minta saran AI**. Kartu sumber x negara teratas (mis. Instagram di Amerika Serikat) dapat hashtag; kartu lain dapat saran dan langkah umum. AI hanya dipanggil saat tombol ditekan (maks. 30 permintaan per jam).
- Halaman **AI**: riwayat saran (100 terakhir), bisa dihapus per entri atau semuanya.
- Model: `gemini-3.5-flash-lite`. Pasangan sumber x negara dicatat di `bd:x:{tanggal}` sejak pembaruan ini, jadi kartu baru muncul setelah ada klik baru.

## Menjalankan lokal
```
cp .env.example .env.local   # isi nilainya
npm install
npm run dev
```
Saat lokal, negara selalu tercatat "Tidak diketahui" karena header negara hanya diberikan Vercel.

## Keamanan
- Login memakai password dari environment dan cookie sesi bertanda tangan (7 hari), dengan batas 5 percobaan per 15 menit per IP.
- Semua aksi di dashboard memeriksa sesi di sisi server.
- Aktifkan 2FA di akun GitHub dan Vercel.
- Slug `admin`, `api`, `_next` dicadangkan sistem.

## Cek tautan mati
- Tiap hari jam 02.00 WIB (Vercel Cron, lihat `vercel.json`) go memeriksa apakah URL tujuan tiap tautan masih bisa dibuka. Hasilnya tampil di kolom **Status tujuan** halaman Tautan, dan tautan bermasalah dimunculkan di kotak peringatan.
- Tombol **Cek sekarang** menjalankannya manual.
- Perlu variabel `CRON_SECRET` di Vercel (isi acak), lalu deploy ulang.
- Yang diperiksa hanya halaman bisa dibuka (status di bawah 400), bukan isi halamannya.
