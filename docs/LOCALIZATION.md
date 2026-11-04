# Lokalisasi antarmuka

`next-intl` membaca cookie `hydrogig_locale` melalui konfigurasi request di `frontend/src/i18n/request.ts`. Nilai selain `id`/`en` menjadi `id`. Tidak ada segmen locale, middleware/proxy atau penggantian URL. `NextIntlClientProvider` mewarisi pesan, locale dan zona waktu `Asia/Jakarta` yang sama dengan server. Metadata dan atribut `html.lang` ikut berubah.

Tombol ID/EN memanggil Server Action tervalidasi; cookie berlaku satu tahun, `SameSite=Lax`, HttpOnly, Secure pada produksi. Pembaruan server mempertahankan komponen form, sesi perjalanan dan cache Query; muat ulang penuh tetap menghapus sesi demo yang hanya berada di memori.

Edit `frontend/messages/id.json` dan `en.json` bersama-sama. Gunakan namespace komponen dan nama kunci bermakna; pertahankan placeholder ICU identik. Gunakan `useTranslations`/`getTranslations`, `useFormatter`, dan format tanggal dengan zona waktu konfigurasi. Jangan menerjemahkan ID graf, enum provenance, satuan kontrak, atau JSON API. Copy fixture diterjemahkan pada tampilan; kontrak demo tetap berbahasa sumber. Pesan kegagalan menggunakan copy lokal yang aman, bukan exception backend.

Jalankan `pnpm test:e2e tests/i18n.spec.ts` setelah build untuk memeriksa kesetaraan kunci/placeholder, default SSR, cookie invalid, pergantian bahasa, persistensi dan form yang tidak direset. Tes lama menggunakan cookie English secara eksplisit agar tetap memverifikasi perilaku baseline.

Rujukan: [setup App Router](https://next-intl.dev/docs/getting-started/app-router), [konfigurasi request](https://next-intl.dev/docs/usage/configuration). Implementasi mengikuti panduan resmi tanpa locale routing, diperiksa 4 November 2026.

Pengujian browser memakai server produksi terisolasi: `pnpm build:e2e` lalu `pnpm test:e2e`. Build `.next-e2e`, frontend port 3100 dan backend tanpa DB port 8100 menjaga server pengembangan 3000/8000 tetap terpisah. Playwright sengaja tidak memakai server yang sudah berjalan. `NEXT_DIST_DIR` dapat digunakan untuk build produksi terpisah saat `pnpm dev` aktif. Jangan menguji build produksi yang direktori keluarannya sedang ditulis server dev.
