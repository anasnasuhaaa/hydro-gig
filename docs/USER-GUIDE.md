# Panduan singkat HydroGig-Mesh

Buka `/guide` untuk versi visual empat langkah dalam Bahasa Indonesia atau English. Tombol ID/EN dan tema ada di header; URL tetap sama.

1. **Mulai demo:** dari Dasbor, tekan **Periksa rute**, lalu **Coba contoh perjalanan**. Manifest mengisi A (lokasi awal) → C (penjemputan) → F (tujuan). Tidak perlu memahami graf; **Ubah lokasi** dan **Pengaturan simulasi** bersifat opsional.
2. **Periksa dan bandingkan:** tekan **Periksa rute** dan tunggu API. Bandingkan **Rute terpendek** (jarak sintetis) dengan **Rute alternatif (simulasi)** (biaya buatan). Keduanya memuat awal→penjemputan serta penjemputan→tujuan. Jika tidak terjangkau, ubah lokasi; H adalah ujung satu arah. Lalu tekan **Lanjut ke navigasi**.
3. **Jelajahi linimasa:** **Kondisi awal**=`t0`, **5 menit kemudian**=`t1`, **10 menit kemudian**=`t2`. Gunakan **Sebelumnya/Berikutnya**, atau pilih snapshot langsung. Pada `t1`, BC/CD naik dan contoh berubah menjadi A→G→C serta C→E→F. Pada `t2`, BC/CD kembali, DF naik dan rute menjadi A→B→C serta C→E→F. Ringkasan menunjukkan perubahan biaya/rute, bukan pengukuran banjir. **Atur ulang demo** kembali ke contoh awal. **Rincian teknis** dapat dibuka dengan keyboard untuk ID/versi/waktu fiktif. Skema bukan peta Bogor.
4. **Pahami status Klaim:** `/claims` menjelaskan fitur mendatang. Belum ada pembuatan, penyimpanan, penandatanganan atau verifikasi bukti, maupun penerbitan token. Penerimaan platform dan pembatalan penalti tidak dijamin.

Istilah: **bingkai simulasi** adalah snapshot fiktif biaya jalan; **rute terpendek** meminimalkan jarak sintetis; **rute alternatif** meminimalkan biaya demo; **risiko belum diketahui** berarti tidak ada bukti untuk menyimpulkan keselamatan. Seluruh penalti terkait banjir sintetis, bukan pemantauan langsung. Tidak ada gerakan/pelacakan pengemudi pada skema.

Pilihan demo tervalidasi tersimpan per tab dan bertahan saat muat ulang; **Atur ulang demo** menghapus perjalanan pemeriksaan terakhir. Hanya ID titik/skenario/bingkai tersimpan, tanpa koordinat atau hasil rute. Data rusak diabaikan; bila penyimpanan browser diblokir, pilihan hanya bertahan dalam memori.

Di Dasbor, **Gunakan lokasi saya** meminta satu lokasi setelah ditekan. Browser meminta izin pada HTTPS/localhost yang mendukungnya. Bila ditolak, timeout, offline atau tidak didukung, pilih **Pilih Bogor manual**. Nama lokasi perangkat hanya menyebut koordinat perkiraan; pilihan manual tidak disebut hasil deteksi. Koordinat dibulatkan untuk permintaan cuaca dan tidak disimpan sebagai riwayat. Muat ulang menghapus pilihan lokasi cuaca; pilihan demo tidak memuat GPS.

Cuaca Open-Meteo adalah kondisi berbasis model, dilengkapi sumber, satuan, waktu model, waktu pengambilan dan interval presipitasi. Penyegaran sekitar sepuluh menit; tombol dibatasi untuk mengurangi volume permintaan. Data hilang ditandai tidak tersedia; respons lama dapat diberi label kedaluwarsa. Cuaca tidak digunakan untuk menghitung bobot demo atau menyimpulkan jalan bebas banjir.

Di ponsel, gunakan navigasi bawah; menu samping tetap tersedia untuk seluruh modul, termasuk Klaim. Di desktop, sidebar dapat diciutkan dengan tombol ikon atau Ctrl/⌘ B. Diagnostik konektivitas berada pada bagian yang dapat dibuka di Dasbor.

**Jangan memasuki genangan untuk menguji purwarupa ini. Rute yang tersedia bukan jaminan keselamatan.** Lihat [DEMO-SIMULATION.md](DEMO-SIMULATION.md) dan [WEATHER.md](WEATHER.md) untuk batas data.

English interface quick start: choose **EN**, press **Try Example Trip**, **Check route**, then **Continue to navigation**. Explore **Initial condition / 5 minutes later / 10 minutes later** with **Previous / Next / Reset demo**. Choose **Use my location** or **Select Bogor manually** on Dashboard for weather context. Guide explains the four steps; evidence claims remain unavailable. Model weather and synthetic flood scenarios remain separate.
