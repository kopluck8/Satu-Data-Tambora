# Mesin Data

Spreadsheet tempat seluruh data Satu Data Tambora berkumpul, beserta Google Apps Script-nya. Halaman [`unduh/`](../../unduh/index.html) (tab **Unduh Data** di hub) membaca data dari sini.

```
File patroli SMART (zip/xml per ST) di folder Drive ─┐
                                                     ├─► lembar Rute ─► tab rekap per tema (satu observasi boleh masuk ke beberapa tab)
Sumber sebelum 2027 dan tab lain (lembar Sumber) ────┘        │
   LPK teknis PEH, rekap SMART, penyuluhan, pulbaket,         ▼
   titik panas, areal terbakar, RBM, drone, profil resor   lembar Katalog ─► aplikasi web (Unduh.gs) ─► hub: Unduh Data
```

Alurnya mengikuti peta konsep Satu Data Tambora 2027: kategori observasi SMART dicocokkan ke tab tujuan lewat lembar **Rute**, dan data lama dari lembar **Sumber** masuk ke tab yang sama lewat penghubung yang sama. Kolom **Sumber** di setiap tab mencatat asal baris. Setiap sumber hanya mengganti baris miliknya sendiri, dan titik patroli yang sama dari dua sumber dicatat sekali (kolom **Kunci titik**: tanggal, jam, dan koordinat).

## Berkas

| Berkas | Isi |
|---|---|
| `Code.gs` | Menu, pembaca file patroli SMART, Rute, Mandat, Kamus Jenis, Ejaan, rekap upaya patroli, rekap per resor, pemicu otomatis |
| `Sumber.gs` | Pembaca lembar Sumber (CSV, JSON, GeoJSON, spreadsheet Google, ekspor SMART). Sumber yang isinya tidak berubah dilewati (kolom `sidik`) |
| `Unduh.gs` | Lembar Katalog dan aplikasi web untuk hub (`doPost`: `katalog`, `hitung`, `unduh`) |
| `appsscript.json` | Zona waktu Asia/Makassar, izin, dan setelan aplikasi web |

File Excel awal (`Mesin_Data_Satu_Data_Tambora.xlsx`, berisi data terbaru dan lembar Petunjuk) **tidak disimpan di repo ini** karena memuat nama pelaku dan pengguna lahan. File itu dikirim terpisah lewat Drive.

## Pasang (sekali saja)

Langkah lengkap ada di lembar **Petunjuk** file Excel. Ringkasnya:

1. Unggah file Excel ke Google Drive, buka, lalu **File > Simpan sebagai Google Spreadsheet**.
2. **Ekstensi > Apps Script**: buat berkas `Code`, `Sumber`, `Unduh`, tempel isinya, lalu ganti `appsscript.json` (centang dulu "Tampilkan file manifes" di Setelan proyek).
3. Muat ulang spreadsheet, lalu jalankan menu **Mesin Data > 1. Siapkan tab dan cek pengaturan**. 🔐 Google meminta otorisasi (spreadsheet, Drive, akses internet, pemicu). Nama tab yang terpotong 31 huruf oleh Excel dipulihkan di langkah ini.
4. **3. Perbarui data sumber lain sekarang** mengisi sumber yang butuh akun Google kantor (rekap laporan kejadian, rekap karhut, kunjungan, laporan RBM).
5. **4. Pasang pemicu otomatis**: file patroli tiap jam, sumber lain tiap hari sekitar pukul 05.00.
6. **Terapkan > Deployment baru > Aplikasi web**, Jalankan sebagai: Saya, Yang memiliki akses: Siapa saja. 🔐 Izinkan. Tempel URL `/exec` di tab `Pengaturan` Sheet konten hub dengan kunci `unduh_data` (atau di `UNDUH_DATA` pada `data/sumber.js`).
7. Perbarui juga deployment Tanya Data ke versi baru: aksi `siapa` di `apps-script/TanyaData.gs` memberi tahu Mesin Data peran pemakai (admin atau pegawai).

Setiap kali kode diubah: **Terapkan > Kelola deployment > ikon pensil > Versi baru > Terapkan**. URL `/exec` tidak berubah.

## Aplikasi web untuk Unduh Data

Hub mengirim `POST` berisi JSON (teks biasa, tanpa preflight CORS):

| `aksi` | Isi permintaan | Jawaban |
|---|---|---|
| `katalog` | `token` | Daftar data yang boleh dilihat, pilihan saring (`faset`), kolom, rentang tahun, dan data mana yang terkunci |
| `hitung` | `token`, `dataset: [id]`, `saring` | Jumlah baris yang lolos saringan per data (disimpan 10 menit) |
| `unduh` | `token`, `id`, `saring`, `awal` | Satu halaman baris (300 sampai 5.000 baris tergantung jumlah kolom); halaman berikutnya diminta dengan `awal = berikut` |

`saring` = `{ dari, sampai, tahun: [..], nilai: { "Resor": [..], "Jenis kegiatan": [..] }, cari }`. Saringan yang tidak berlaku untuk suatu data (misalnya Resor pada Daftar Jenis Kehati) dilewati dan disebut di `diabaikan`.

**Login dan privasi**

- Token adalah token sesi Tanya Data (login hub). Mesin Data memeriksanya ke Tanya Data (aksi `siapa`) dan menyimpan hasilnya 10 menit. Tanya Data versi lama tanpa aksi `siapa` tetap bisa dipakai; semua akun lalu dianggap pegawai.
- Kolom di `UNDUH_KOLOM_ADMIN` (lembar Pengaturan) dan kolom `kolom_admin` per data di Katalog hanya ikut bagi akun admin. Nama kolom cocok bila sama atau diawali nama itu, dan bagian yang sama di kolom "Atribut lain" ikut dibuang. `UNDUH_KOLOM_SEMBUNYI` (bawaan: Kunci titik) tidak ikut bagi siapa pun.
- Katalog `akses` = `pegawai`, `admin` (seluruh data khusus admin), atau `tidak`; `tampil` = `tidak` menyembunyikan data. Lembar kendali tidak pernah bisa diunduh.
- Setiap unduhan dicatat di lembar **Log Unduhan** (waktu, akun, data, saringan, jumlah baris).

## Lembar Katalog

Satu baris per tab data. Kolom `judul`, `tema`, `keterangan`, `akses`, `kolom_admin`, dan `tampil` boleh diubah dan dipertahankan. Kolom `jumlah_baris`, `tahun_awal`, `tahun_akhir`, `kolom`, `faset`, dan `diperbarui` dihitung ulang setiap kali data berubah (setelah proses file patroli dan pembaruan sumber), atau lewat menu **Perbarui katalog Unduh Data**.
