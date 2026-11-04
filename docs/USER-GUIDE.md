# Panduan singkat HydroGig-Mesh

Buka `/guide` untuk versi visual tiga langkah dalam Bahasa Indonesia atau English. Tombol ID/EN dan tema ada di header. URL tidak berubah saat bahasa diganti.

1. **Periksa rute:** buka `/pre-order`, pilih tiga titik berbeda serta skenario/bingkai, lalu tekan Periksa rute. Acuan jarak dan alternatif berbobot demo menampilkan jarak sintetis, biaya buatan serta ruas terpengaruh. Jaringan satu arah dapat membuat perjalanan dari H tidak terjangkau.
2. **Jelajahi simulasi:** tekan Buka navigasi atau buka `/navigation`. Pilih perjalanan bawaan atau terakhir diperiksa, lalu gunakan `t0`, `t1`, `t2` atau Bingkai berikutnya. Perubahan adalah snapshot fiktif; bukan prediksi waktu tiba. Skema bukan peta Bogor. Rincian perhitungan dapat dibuka dengan keyboard.
3. **Bukti perjalanan:** `/claims` menjelaskan fitur yang masih direncanakan. Belum tersedia pembuatan, penyimpanan, penandatanganan atau verifikasi klaim. Bukti mendatang juga tidak menjamin pembatalan penalti platform.

Di Dasbor, **Gunakan lokasi saya** meminta satu lokasi setelah ditekan. Browser meminta izin pada HTTPS/localhost yang mendukungnya. Bila ditolak, timeout, offline atau tidak didukung, pilih **Pilih Bogor manual**. Nama lokasi perangkat hanya menyebut koordinat perkiraan; pilihan manual tidak disebut hasil deteksi. Koordinat dibulatkan untuk permintaan cuaca dan tidak disimpan sebagai riwayat. Muat ulang menghapus pilihan lokasi dan sesi perjalanan di memori.

Cuaca Open-Meteo adalah kondisi berbasis model, dilengkapi sumber, satuan, waktu model, waktu pengambilan dan interval presipitasi. Penyegaran sekitar sepuluh menit; tombol dibatasi untuk mengurangi volume permintaan. Data hilang ditandai tidak tersedia; respons lama dapat diberi label kedaluwarsa. Cuaca tidak digunakan untuk menghitung bobot demo atau menyimpulkan jalan bebas banjir.

Di ponsel, gunakan navigasi bawah; menu samping tetap tersedia untuk seluruh modul, termasuk Klaim. Di desktop, sidebar dapat diciutkan dengan tombol ikon atau Ctrl/⌘ B. Diagnostik konektivitas berada pada bagian yang dapat dibuka di Dasbor.

**Jangan memasuki genangan untuk menguji purwarupa ini. Rute yang tersedia bukan jaminan keselamatan.** Lihat [DEMO-SIMULATION.md](DEMO-SIMULATION.md) dan [WEATHER.md](WEATHER.md) untuk batas data.

English interface quick start: choose **EN**, screen three distinct stops, open Navigation and select fixed frames. Choose **Use my location** or **Select Bogor manually** on Dashboard for weather context. Guide explains all three workflows; evidence claims remain unavailable. Model weather and synthetic flood scenarios remain separate.
