# Mesin Data

Spreadsheet tempat seluruh data Satu Data Tambora berkumpul, beserta Google Apps Script-nya. Halaman [`unduh/`](../../unduh/index.html) (tab **Unduh Data** di hub) membaca data dari sini.

```
File patroli SMART (zip/xml per ST) di folder Drive ─┐
                                                     ├─► lembar Rute ─► 12 rekap (data mentah per kategori data model)
Sumber sebelum 2027 (lembar Sumber), diseragamkan ───┘        │             └─► lembar survei metode teknis (Kalkulator Teknis)
   ke kategori dan atribut data model 2027:                   ▼
   LPK teknis PEH, rekap SMART, penyuluhan, pulbaket,      lembar Katalog ─► aplikasi web (Unduh.gs) ─► hub: Unduh Data
   titik panas, areal terbakar, RBM, drone, laporan kejadian                          └─► hub: grafik temuan aktivitas manusia
   2026 dan arsip laporan kejadian 2016 sampai 2025
```

Alurnya mengikuti Peta Konsep Satu Data Tambora 2027 (perbaikan 27-11-2026): **rekap berisi data mentah, terpisah dari hasil analisis**. Kategori observasi SMART dicocokkan ke rekap lewat lembar **Rute**, dan data sebelum 2027 dari lembar **Sumber** diseragamkan dulu ke kategori dan atribut data model 2027 lalu masuk ke rekap yang sama, jadi file patroli 2027 dan data lama berada di satu tabel. Kartu dan tab hub hanya menyajikan data dari rekap ini. Kolom **Sumber** di setiap rekap mencatat asal baris. Setiap sumber hanya mengganti baris miliknya sendiri, dan titik patroli yang sama dari dua sumber dicatat sekali (kolom **Kunci titik**: tanggal, jam, dan koordinat).

**12 rekap**: Upaya Patroli (tab per leg dan tab titik/kegiatan RBM), Temuan Gangguan Kawasan, Kejadian Kebakaran Hutan, Spesies Invasif, Tipe Ekosistem dan Tutupan Lahan, Temuan Satwa, Sarana Prasarana/Pal Batas/Media Informasi, Temuan Tumbuhan, Fitur Alami dan Potensi Kawasan, Kegiatan Penyuluhan, Sampah Pengunjung, Kunjungan dan Pendakian. Data yang data modelnya sama tidak dipisah menjadi tab sendiri: pulbaket tenurial = Aktivitas Manusia > Penggunaan Kawasan (pengguna lahan = Pelaku), titik panas dan delineasi = Kebakaran Hutan dan Lahan, kondisi kelompok binaan = Monev Kelompok Binaan, laporan form RBM = Kegiatan RBM, register kegiatan LPK dan penerbangan drone = Upaya Patroli. Lembar acuan (Daftar Jenis Kehati, Daftar Kelompok Binaan, Rencana RBM 2026) tetap terpisah karena bukan data temuan.

**Query atribut jenis**: Rekap Temuan Satwa dan Temuan Tumbuhan juga menerima observasi kategori apa pun yang berisi atribut jenis satwa atau tumbuhan (baris `@...` di Rute), seperti query atribut di SMART, hanya dengan kolom jenis, jumlah, dan satuan. Survei Kehati Metode Teknis tetap ada di data model; barisnya bercabang saat masuk: baris lengkap dengan parameter metode ke lembar survei per tabel (bahan Kalkulator Teknis, tidak ditawarkan di Unduh Data), jenisnya ke rekap satwa atau tumbuhan.

## Berkas

| Berkas | Isi |
|---|---|
| `Code.gs` | Menu, pembaca file patroli SMART, Rute (kategori dan atribut), Mandat, Kamus Jenis, Ejaan, rekap upaya patroli, pemicu otomatis |
| `Sumber.gs` | Pembaca lembar Sumber (CSV, JSON, GeoJSON, spreadsheet Google, ekspor SMART, arsip laporan kejadian) yang menyeragamkan data lama ke data model 2027, termasuk pembaca koordinat dan tanggal yang ditulis bermacam-macam. Sumber yang isinya tidak berubah dilewati (kolom `sidik`) |
| `Unduh.gs` | Lembar Katalog dan aplikasi web untuk hub (`doPost`: `katalog`, `hitung`, `unduh`, `grafik`) |
| `Kendali.gs` | Isi lembar kendali versi terbaru (Rute, Induk, Petunjuk, Pengaturan, Sumber). Menu 1 memakainya untuk memperbarui spreadsheet yang sudah terpasang. Dibuat ulang oleh `buat_kendali.py`, jangan disunting tangan |
| `appsscript.json` | Zona waktu Asia/Makassar, izin, dan setelan aplikasi web |

File Excel awal (`Mesin_Data_Satu_Data_Tambora.xlsx`, berisi data terbaru dan lembar Petunjuk) **tidak disimpan di repo ini** karena memuat nama pelaku dan pengguna lahan. File itu dikirim terpisah lewat Drive.

## Pasang (sekali saja)

Langkah lengkap ada di lembar **Petunjuk** file Excel. Ringkasnya:

1. Unggah file Excel ke Google Drive, buka, lalu **File > Simpan sebagai Google Spreadsheet**.
2. **Ekstensi > Apps Script**: buat berkas `Code`, `Sumber`, `Unduh`, `Kendali`, tempel isinya, lalu ganti `appsscript.json` (centang dulu "Tampilkan file manifes" di Setelan proyek).
3. Kembali ke tab spreadsheet dan muat ulang. Menu **Mesin Data** muncul di bilah menu spreadsheet, di sebelah kanan Bantuan (bukan di editor Apps Script). Jalankan **Mesin Data > 1. Siapkan tab dan cek pengaturan**, atau dari editor pilih fungsi `siapkanSpreadsheetInduk` lalu Jalankan. 🔐 Google meminta otorisasi (spreadsheet, Drive, akses internet, pemicu). Nama tab yang terpotong 31 huruf oleh Excel dipulihkan di langkah ini.
4. **3. Perbarui data sumber lain sekarang** mengisi sumber yang butuh akun Google kantor (rekap laporan kejadian 2026, rekap karhut, rekap kunjungan wisata) dan membaca laporan form RBM.
5. **4. Pasang pemicu otomatis**: file patroli tiap jam, sumber lain tiap hari sekitar pukul 05.00.
6. **Terapkan > Deployment baru > Aplikasi web**, Jalankan sebagai: Saya, Yang memiliki akses: Siapa saja. 🔐 Izinkan. Tempel URL `/exec` di tab `Pengaturan` Sheet konten hub dengan kunci `unduh_data` (atau di `UNDUH_DATA` pada `data/sumber.js`).
7. Perbarui juga deployment Tanya Data ke versi baru: aksi `siapa` di `apps-script/TanyaData.gs` memberi tahu Mesin Data peran pemakai (admin atau pegawai).

Setiap kali kode diubah: **Terapkan > Kelola deployment > ikon pensil > Versi baru > Terapkan**. URL `/exec` tidak berubah.

## Memperbarui spreadsheet yang sudah terpasang

Bila susunan rekap berubah (seperti perbaikan peta konsep 27-11-2026), spreadsheet lama tidak perlu diunggah ulang:

1. Tempel ulang `Code.gs`, `Sumber.gs`, dan `Unduh.gs` ke berkas yang namanya sama. Buat berkas baru `Kendali` (ikon + > Skrip) lalu tempel `Kendali.gs`. Simpan.
2. Muat ulang tab spreadsheet, lalu **Mesin Data > 1. Siapkan tab dan cek pengaturan**. Bila `VERSI_KENDALI` di Pengaturan lebih lama dari `Kendali.gs`, muncul pertanyaan; pilih **Ya**. Lembar Rute, Induk, Petunjuk, Pengaturan, dan Sumber diganti versi baru (isian folder, alamat sumber, dan status aktif yang sudah ada tetap), label pulbaket lama dihapus dari Label Data Model, tab rekap lama dihapus, lalu tab rekap dikosongkan.
3. **3. Perbarui data sumber lain sekarang**, lalu **2. Proses file patroli sekarang** untuk mengisi ulang rekap. File patroli dan sumber aslinya tidak disentuh.
4. **Terapkan > Kelola deployment > ikon pensil > Versi baru > Terapkan**.

Menu 1 berikutnya tidak bertanya lagi selama versinya sama.

**Pembaruan ringan.** Bila Rute dan Induk di `Kendali.gs` sama dengan yang terpasang (misalnya pembaruan 28-11-2026 yang hanya menambah baris `lk_arsip` di lembar Sumber dan `GRAFIK_SUMBER_MATI` di Pengaturan), menu 1 tetap memperbarui lembar kendali tetapi **tidak mengosongkan tab rekap**. Langkah 3 cukup menu 3 saja; menu 2 tidak perlu diulang.

## Aplikasi web untuk Unduh Data

Hub mengirim `POST` berisi JSON (teks biasa, tanpa preflight CORS):

| `aksi` | Isi permintaan | Jawaban |
|---|---|---|
| `katalog` | `token`, `versi: 2` | Daftar induk (`tema`) dan data yang boleh dilihat: sub data (`jenis: sub`, dengan `induk`, `kategori`, `urut`), data pendukung, dan Lainnya, masing-masing dengan pilihan saring (`faset`), kolom terisi, rentang tahun, tanda berkoordinat, dan tanda terkunci. Tanpa `versi` (hub lama) hanya data yang berisi yang dikirim |
| `hitung` | `token`, `dataset: [id]`, `saring` | Jumlah baris yang lolos saringan per data (disimpan 10 menit) |
| `unduh` | `token`, `id`, `saring`, `awal` | Satu halaman baris (300 sampai 5.000 baris tergantung jumlah kolom); halaman berikutnya diminta dengan `awal = berikut` |
| `grafik` | `token` | Ringkasan untuk halaman grafik temuan aktivitas manusia di hub (`perlindungan/`): jumlah baris Rekap Temuan Gangguan Kawasan dan Rekap Kejadian Kebakaran Hutan per tahun, kategori (Kategori 1 Aktivitas Manusia, serta Perdagangan dan Kepemilikan TSL), sumber, dan resor: `{kategori, sumber: [{label, n, mati}], resor, baris: [[tahun, kategori, sumber, resor, temuan, pelaku]], karhutLain}`. Baris Pelaku tidak dihitung sebagai temuan; kolom Jumlah pelaku (bawaan 1) dijumlahkan terpisah. Hanya angka, jadi akun pegawai juga boleh. Disimpan 30 menit dan dihapus setiap kali katalog diperbarui |

`id` adalah id sub data (`induk.nama-sub-data`, mis. `pp.perburuan-satwa`) atau id tab di Katalog (data pendukung, atau satu tab utuh untuk tautan lama). Sub data yang barisnya ada di beberapa tab diunduh sebagai satu tabel.

`saring` = `{ dari, sampai, tahun: [..], nilai: { "Resor": [..], "Jenis kegiatan": [..] }, cari }`. Saringan yang tidak berlaku untuk suatu data (misalnya Resor pada Daftar Jenis Kehati) dilewati dan disebut di `diabaikan`.

**Login dan privasi**

- Token adalah token sesi Tanya Data (login hub). Mesin Data memeriksanya ke Tanya Data (aksi `siapa`) dan menyimpan hasilnya 10 menit. Tanya Data versi lama tanpa aksi `siapa` tetap bisa dipakai; semua akun lalu dianggap pegawai.
- Kolom di `UNDUH_KOLOM_ADMIN` (lembar Pengaturan) dan kolom `kolom_admin` per data di Katalog hanya ikut bagi akun admin. Nama kolom cocok bila sama atau diawali nama itu, dan bagian yang sama di kolom "Atribut lain" ikut dibuang. `UNDUH_KOLOM_SEMBUNYI` (bawaan: Kunci titik) tidak ikut bagi siapa pun.
- Katalog `akses` = `pegawai`, `admin` (seluruh data khusus admin), atau `tidak`; `tampil` = `tidak` menyembunyikan data. Lembar kendali tidak pernah bisa diunduh.
- Sumber di lembar Sumber yang `akses_unduh`-nya `admin` (atau `tidak`) dan mengikuti Rute tidak punya tab sendiri, jadi aksesnya berlaku per baris: baris dengan kolom Sumber bernama sumber itu (mis. rekap laporan kejadian 2026 di Rekap Temuan Gangguan Kawasan) hanya terlihat, terhitung, dan bisa dicari oleh akun admin. Katalog menyimpan ringkasan terpisah untuk akun pegawai, dan dihitung ulang otomatis bila daftar sumber khusus admin berubah.
- `UNDUH_INDUK_TANPA` (bawaan: `survei`) berisi induk yang tidak ditawarkan di Unduh Data: lembar survei metode teknis adalah bahan Kalkulator Teknis, bukan rekap.
- Setiap unduhan dicatat di lembar **Log Unduhan** (waktu, akun, data, saringan, jumlah baris).

Sumber yang bawaannya tidak dihitung di grafik (`mati`) diatur di Pengaturan `GRAFIK_SUMBER_MATI`, dipisah koma (bawaan: titik panas, delineasi areal terbakar, dan pulbaket tenurial, karena berupa pantauan citra atau pendataan bidang garapan). Di hub sumber itu tetap bisa dinyalakan.

## Arsip laporan kejadian 2016 sampai 2025

Baris `lk_arsip` di lembar Sumber membaca `LK_Terkurasi_2016_2025.xlsx` (hasil kurasi enam rekap laporan kejadian tahunan: tanggal, jam, koordinat, kategori, resor batas 2026, dan pelaku diseragamkan). File itu memuat nama pelaku, jadi **tidak disimpan di repo** dan `akses_unduh` baris ini `admin`.

1. Unggah file ke Drive, buka, lalu **File > Simpan sebagai Google Spreadsheet**.
2. Salin ID spreadsheet baru (bagian alamat di antara `/d/` dan `/edit`) ke kolom `alamat` baris `lk_arsip`, lalu jalankan menu 3.

Lembar **LK terkurasi** (satu baris per kejadian) masuk ke rekap mengikuti Rute dengan Jenis kegiatan "Laporan kejadian"; jenis satwa dan tumbuhan ikut ke Rekap Temuan Satwa dan Tumbuhan. Lembar **Pelaku** masuk sebagai baris Aktivitas Manusia > Pelaku dengan nomor LK, umur, asal, peran, tindakan, dan Jumlah pelaku. Kolom yang tidak punya atribut di kategorinya ditulis ke Keterangan. Baris arsip tidak memakai Kunci titik, jadi tidak menyembunyikan titik patroli SMART.

Kebakaran dari arsip dilewati untuk tahun yang sudah dimuat sumber spreadsheet lain yang aktif dengan catatan `kategori=aktivitasmanusia.kebakaranhutandanlahan` (rekap kejadian kebakaran hutan), agar satu kejadian tidak terhitung dua kali; tahunnya tertulis di kolom status. Awali catatan `lk_arsip` dengan `kebakaran=semua` untuk tetap memuat semuanya.

**Pembaca koordinat dan tanggal** (berlaku juga untuk sumber `spreadsheet`): derajat-menit-detik (`S 8°20'01" E 118°01'02"`), derajat-menit desimal, koma atau spasi sebagai pemisah desimal (`-8, 301573 118. 066531`), lintang tanpa titik desimal (`-81631`), X dan Y tertukar, lintang positif, dan UTM zona 50S dibaca ke derajat desimal dalam batas kawasan; teks aslinya disimpan di Atribut lain (`Koordinat asli: ...`). Tanggal bernama bulan (`Selasa, 10 Agustus 2021`, `10 Agt 2021`), tanggal angka di tengah teks, dan rentang (`10-12 Agustus 2021`) dibaca; jam diambil dari teks seperti `pukul 13.30 WITA`. Kolom `Hari/Tanggal` dan `Waktu` dikenali sebagai tanggal dan jam.

## Susunan sub data

Unduh Data mengikuti Garis Besar Peta Konsep Satu Data Tambora 2027: **induk data > kategori > sub data**. Daftarnya ada di `SUB_DATA` (awal `Unduh.gs`), satu baris per bagian: `[induk, kategori, sub data, tab, Kategori 0, Kategori 1]`.

- `tab`: kode penghubung di lembar Rute (`gangguan`, `satwa`, ...), `@upaya`, atau `=Nama tab`.
- Kategori 0 dan Kategori 1: label yang diterima, dipisah `|`, tidak peka huruf besar-kecil. Kosong berarti semua, awalan `!` berarti selain label itu. Label laporan lama (mis. `Pendampingan & monev kelompok`) ditulis sebagai padanan.
- Satu sub data boleh mengambil dari beberapa tab: tulis barisnya lagi dengan induk, kategori, dan nama yang sama.
- Kategori Survei Kehati Metode Teknis di bawah Keanekaragaman Hayati berisi jenis dari survei metode teknis yang masuk ke rekap satwa, tumbuhan, dan invasif (tanpa parameter metode). Kategori Lain (query atribut jenis) berisi jenis dari observasi kategori lain, mis. jenis satwa yang tercatat di temuan perburuan.
- Urutan kategori di hub mengikuti sub data pertamanya di `SUB_DATA`; satu kategori boleh berisi sub data dari beberapa rekap.
- Baris tab rekap yang Kategori 0 dan 1-nya tidak cocok dengan sub data mana pun masuk "Lainnya dari <tab>" (terlipat bersama data pendukung) dan disebut di kolom `di_luar_sub` Katalog. `SUB_DATA_ABAIKAN` untuk baris yang sengaja dilewati karena observasinya sudah ada di tab lain (sekarang kosong: setiap observasi hanya ada di satu rekap).
- Tab di luar data model menjadi **data pendukung** di bawah induknya.

Setelah `SUB_DATA` diubah, naikkan `SUB_VERSI`: katalog lama dihitung ulang otomatis. Menu **Perbarui katalog Unduh Data** menampilkan jumlah sub data, data pendukung, dan baris yang masuk Lainnya.

## Lembar Katalog

Satu baris per tab data. Kolom `judul`, `tema`, `keterangan`, `akses`, `kolom_admin`, dan `tampil` boleh diubah dan dipertahankan. Kolom `jumlah_baris`, `tahun_awal`, `tahun_akhir`, `kolom` (kolom yang terisi), `faset`, `diperbarui`, `jumlah_titik` (baris yang punya koordinat X dan Y; data tanpa titik tidak ditawarkan sebagai GeoJSON atau Shapefile), `sub` (ringkasan tiap sub data di tab itu), `di_luar_sub`, dan `versi_sub` dihitung ulang setiap kali data berubah (setelah proses file patroli dan pembaruan sumber), atau lewat menu **Perbarui katalog Unduh Data**. `akses` dan `tampil` sebuah tab berlaku untuk semua sub data dari tab itu.
