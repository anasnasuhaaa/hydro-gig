# Konteks cuaca dan privasi

`GET /api/v1/weather/current?latitude=-6.60&longitude=106.80` berjalan tanpa PostgreSQL. Router tipis memakai dependency provider, HTTPX async dengan host/path tetap `https://api.open-meteo.com/v1/forecast`, tanpa redirect dan tanpa URL upstream dari klien. Batas koordinat divalidasi; timeout HTTP 5 detik (koneksi 2 detik), deadline keseluruhan 7 detik. Kegagalan provider menghasilkan HTTP 503 dan kode `weather_unavailable`; parameter tidak valid HTTP 422. Tidak ada body upstream atau detail exception yang dikembalikan.

Variabel: suhu 2 m (°C), kelembapan relatif (%), presipitasi (mm), angin 10 m (km/h), kode cuaca WMO, siang/malam. `current_units` diverifikasi; nilai opsional yang hilang tetap `null`, bukan nol. Respons seluruhnya kosong, malformed atau satuan tidak sesuai menjadi unavailable. `interval_seconds` adalah rentang agregasi presipitasi yang berakhir pada waktu model, bukan akumulasi harian.

`model_time` berasal dari `current.time` epoch UTC; `fetched_at` adalah waktu pengambilan server. UI memformat keduanya dalam zona Asia/Jakarta dan locale aktif. Provenance `model_predicted`: kondisi kini berbasis model, bukan pengukuran stasiun di perangkat. Ambang tampilan stale (model >30 menit atau pengambilan >15 menit) adalah kebijakan kesegaran UI, bukan ambang risiko ilmiah. Kegagalan refresh mempertahankan respons lama dengan label kedaluwarsa. Cuaca sama sekali tidak membobot graf, menghitung genangan, atau membuktikan keselamatan jalan.

Lokasi hanya diminta dengan tombol eksplisit; satu `getCurrentPosition`, tanpa `watchPosition`. Timeout 10 detik, maximumAge 5 menit, tanpa kebutuhan akurasi tinggi. Koordinat segera dibulatkan menjadi dua desimal untuk request cuaca dan tampilan perkiraan; tidak direverse-geocode atau disimpan di akun, DB, cookie, localStorage maupun analytics. Pilihan Bogor manual selalu diberi label manual. State lokasi di memori komponen, Query cache `gcTime=0` dihapus setelah observer dilepas. Pemilihan manual membatalkan relevansi callback GPS yang tertunda.

Query memakai stale/refetch 10 menit, tanpa retry otomatis tambahan atau refetch karena fokus/reconnect; tombol refresh dibatasi 10 menit sejak hasil percobaan terakhir. Tidak ada cache server, Redis atau worker. Ini pengendalian volume klien, **bukan pembatas kuota global**. Sebelum penggunaan luas perlu anggaran trafik dan rate limiting di hosting; jangan menggambarkan cache memori sebagai cache bersama serverless.

Logging aplikasi meredaksi query endpoint cuaca dari `uvicorn.access` dan menonaktifkan log URL HTTPX/HTTPCore pada level INFO. Hosting/reverse proxy di luar aplikasi juga harus dikonfigurasi untuk tidak merekam query koordinat; belum ada deployment yang diverifikasi. Jangan mengaktifkan debug HTTP/request logging di produksi. Open-Meteo menerima koordinat perkiraan; backend tidak mengirim identitas perangkat.

## Atribusi dan penggunaan

Tampilan menyertakan tautan Open-Meteo dan CC BY 4.0. Berdasarkan [syarat resmi](https://open-meteo.com/en/terms), diperiksa 4 November 2026, layanan gratis hanya untuk penggunaan nonkomersial: kurang dari 10.000 panggilan/hari, 5.000/jam, dan 600/menit. Kuota IP bersama serverless dapat tercapai lebih cepat. Penggunaan komersial memerlukan peninjauan paket/lisensi penyedia; aplikasi transportasi operasional tidak otomatis memenuhi syarat nonkomersial. Layanan tidak menjamin akurasi atau ketersediaan.

Rujukan teknis: [Open-Meteo Forecast API](https://open-meteo.com/en/docs), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Tidak ada API key dibutuhkan pada prototipe nonkomersial ini.

## Verifikasi

`backend/tests/test_weather.py` memakai MockTransport melalui dependency injection: provenance/waktu/satuan, pembulatan, kegagalan HTTP/timeout, respons partial/malformed, input invalid dan redaksi log. `frontend/tests/weather.spec.ts` memalsukan geolocation dan provider: consent, GPS ditolak/tidak tersedia/timeout, manual, offline, loading, stale, null, kegagalan dan interval retry, serta locale tanpa request ulang. Tes tidak membutuhkan internet atau Neon.
