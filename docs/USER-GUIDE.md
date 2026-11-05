# Panduan singkat HydroGig-Mesh

Buka `/dashboard`. Bahasa Indonesia adalah default; tombol ID/EN dan tema ada di header. Demo ini untuk penelitian, bukan panduan keselamatan atau pemantauan banjir langsung.

## Mode dataset eksperimental — alur utama

1. Tekan **Jelajahi Simulasi Skenario Banjir** (English: **Explore Flood Scenario Simulation**). Mode dataset aktif di `/pre-order`. Contoh awal memakai N01 → N03 → N12; pilih asal, penjemputan dan tujuan lain bila perlu, lalu tekan **Bandingkan rute**. Setelah titik diubah, hasil lama disembunyikan sampai perhitungan baru diminta.
2. Bandingkan **Acuan jarak** dan **Rute berbobot eksperimental**. Jarak perjalanan menjumlahkan panjang kedua bagian; biaya menjumlahkan objektif yang sama. Keduanya memakai satuan berbeda. Tekan alternatif untuk menyorot jalur. Garis utuh dan putus membedakan rute, titik-titik menandai nilai berubah, dan garis tebal menandai ruas diperiksa. Sentuh garis, arahkan pointer, atau gunakan pemilih **Periksa ruas** dengan keyboard. Nilai kedalaman dan komponen kecepatan mentah belum terverifikasi; sumbu kecepatan tidak diketahui. Skema bukan peta jalan autentik.
3. Tekan **Lanjut ke navigasi**. Lima tombol **t0–t4** menunjukkan waktu historis dari API dalam Asia/Jakarta. Gunakan bingkai sebelumnya/berikutnya atau **Putar simulasi**. Kecepatan tampilan dua detik per bingkai, menunggu respons API; bukan kecepatan perjalanan pengemudi. Pemutaran berhenti pada t4, saat tab disembunyikan, ketika titik diedit, atau ketika perjalanan diatur ulang. Pada contoh awal jalur berbobot berubah di t1 dan tetap sama melalui t4. Biaya dan nilai ruas tetap berubah. Ringkasan membandingkan bingkai sumber sebelumnya, bukan bingkai terakhir yang kebetulan dibuka. Buka rincian perubahan untuk nilai sebelum/sesudah. Perbandingan gagal ditandai tidak tersedia dan dapat dicoba lagi.
4. Tekan **Lanjut ke pratinjau bukti**. Tinjau perjalanan, bingkai, waktu historis, ID ruas dan nilai sumber. Status menunjukkan **Bukti tanpa tanda tangan**, **Data Sumber Belum Terverifikasi**, serta **Tidak Dikirim ke Platform Mana Pun**. Tekan **Buat pratinjau bukti**, lalu **Ekspor pratinjau JSON**. Paket dihitung ulang oleh backend; browser memeriksa digest sebelum ekspor. SHA-256 hanya membantu memeriksa integritas konten, tidak membuktikan identitas atau insiden dan tidak memberikan pembebasan penalti.

Indikator tiga tahap tersedia di ketiga halaman. Tombol kembali mempertahankan perjalanan; navigasi bawah ponsel juga memuat **Klaim**. Atur ulang memulihkan contoh dataset pada t0 dan menghapus referensi rute/pratinjau terkait.

## Mode sintetis lama

Tekan **Buka demo sintetis lama** di Dasbor atau **Kembali ke demo sintetis** di pemilih mode. Di Pra-pesanan, tekan **Coba contoh perjalanan** lalu **Periksa rute**. Manifest mengisi A → C → F. **Ubah lokasi** dan **Pengaturan simulasi** membuka kontrol lanjutan. Linimasa lama tetap memakai Kondisi awal (t0), 5 menit kemudian (t1), dan 10 menit kemudian (t2). Biaya dan jarak sepenuhnya sintetis; bukti dataset memerlukan mode eksperimental.

## Sesi, cuaca dan keterbatasan

Pilihan dataset dan sintetis disimpan terpisah per tab (`hydrogig-experimental-v1` dan `hydrogig-demo-v1`), tervalidasi dan bertahan saat muat ulang. Hanya pilihan mode/titik/skenario/bingkai/ID referensi yang disimpan, tanpa hasil API, paket JSON, GPS, identitas atau telemetri. Paket pratinjau perlu dibuat lagi setelah reload. Versi lama atau data rusak menghasilkan fallback. Jika penyimpanan diblokir, pilihan bertahan dalam memori selama navigasi klien, tetapi hilang pada reload.

Cuaca Open-Meteo terpisah dari skenario. **Gunakan lokasi saya** meminta satu lokasi atas tindakan eksplisit dan mengirim koordinat yang dibulatkan; **Pilih Bogor manual** memberi alternatif tanpa GPS. Tidak ada riwayat lokasi. Waktu model dan pengambilan ditampilkan; data hilang tidak diganti nol. Cuaca tidak mengubah bobot rute atau membuktikan jalan bebas banjir.

Tidak ada sumber jalan/CRS/lisensi/kalibrasi terverifikasi, peta geografis operasional, pengukuran banjir tervalidasi, model DeepONet terlatih, prakiraan atau penilaian risiko terkalibrasi. Bukti tidak ditandatangani, tidak disimpan server-side dan tidak dikirim ke platform. Jangan memasuki genangan untuk menguji purwarupa. Rute tersedia bukan jaminan keselamatan.

English quick start: **Explore Flood Scenario Simulation → Compare routes → Continue to navigation → t0–t4 / Play simulation → Continue to evidence preview → Generate evidence preview → Export preview JSON**. Use the three-stage indicator to revisit steps. Choose **Open legacy synthetic demo** for the original independent experience.

Lihat [laporan antarmuka dan screenshot](INTERACTIVE-DEMO-UX.md), [kontrak eksperimental](EXPERIMENTAL-DATASET-INTEGRATION.md), [demo sintetis](DEMO-SIMULATION.md), dan [cuaca](WEATHER.md).
