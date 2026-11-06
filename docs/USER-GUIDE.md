# Panduan HydroGig-Mesh

Simulasi eksperimental dengan sumber belum terverifikasi. Bukan panduan keselamatan atau pemantauan banjir langsung.

1. Di **Dasbor**, tekan **Mulai periksa rute**. `/pre-order` juga dapat dibuka langsung. Contoh awal N01 → N03 → N12 siap dibandingkan. ID titik dipertahankan karena nama lokasi belum terverifikasi.
2. Ubah asal, penjemputan dan tujuan bila perlu, lalu **Bandingkan rute**. Hasil lama disembunyikan selama perubahan belum dihitung. Pilih **Acuan jarak** atau **Rute berbobot eksperimental** untuk menyorot jalur; buka **Urutan titik rute** bila diperlukan. Jarak fisik dan biaya eksperimental berbeda satuan; biaya rendah tidak menjamin aman.
3. Tekan **Lanjut ke navigasi**. Pilih t0–t4 atau gunakan sebelumnya/berikutnya dan pemutaran dua detik per bingkai. Waktu berasal dari skenario historis dan ditampilkan Asia/Jakarta. Contoh awal berubah jalur di t1, lalu tetap melalui t4 meskipun nilai dan biaya berubah. Ringkasan membandingkan dengan bingkai sumber sebelumnya, termasuk saat melompat.
4. Arahkan pointer ke ruas untuk pratinjau singkat. Klik atau sentuh untuk membuka detail yang tetap dipilih. Daftar **Lihat detail ruas** mendukung keyboard dan pencarian ketik bawaan Select. **Tutup detail ruas** atau Esc menutup panel dan mengembalikan fokus ke daftar. Semua perubahan tersedia melalui **Detail perubahan ruas**; tabel sumber lengkap ada di rincian teknis yang tertutup saat awal.
5. Tekan **Lanjut ke pratinjau bukti**, tinjau perjalanan dan waktu historis, lalu **Buat pratinjau bukti**. Setelah siap, **Ekspor pratinjau JSON** menyimpan paket lokal. Waktu pembuatan paket terpisah dari waktu skenario. Rincian sumber dan SHA-256 dapat dibuka. Digest membuktikan konsistensi konten, bukan keaslian insiden. Paket tidak ditandatangani atau dikirim ke platform.

Sesi tervalidasi bertahan lintas halaman dan reload menggunakan sessionStorage. Flag mode versi lama dinormalisasi tanpa mengubah perjalanan valid. Sesi rusak atau berbeda versi kembali ke contoh awal dengan pesan pemulihan. Penyimpanan terblokir memakai memori selama navigasi klien; reload tidak dapat memulihkan memori. Atur ulang mengembalikan contoh t0 dan mengosongkan referensi rute/paket. Hasil API dan paket bukti tidak disimpan dalam sesi.

Cuaca di Dasbor terpisah dari perhitungan rute. **Gunakan lokasi saya** meminta satu lokasi hanya setelah ditekan; **Pilih Bogor manual** tidak meminta GPS. Koordinat dibulatkan, tanpa riwayat lokasi. Kondisi model Open-Meteo bukan bukti genangan atau keselamatan jalan.

Bahasa Indonesia/English dan tema terang/gelap tersedia di header. Navigasi bawah ponsel serta sidebar mengarah ke URL yang sama. Skema bukan peta geografis; satelit dan lalu lintas belum tersedia. Implementasi sintetis lama tetap ada secara internal untuk pengujian, tanpa pemilih mode publik.

Lihat [audit UX](UX-REFINEMENT-AUDIT.md), [kesiapan peta](GEOSPATIAL-MAP-READINESS.md), dan [kontrak ilmiah](SCIENTIFIC-MODULES.md).
