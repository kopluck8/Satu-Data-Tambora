# Satu Data Tambora

Satu pintu untuk data dan aplikasi Balai Taman Nasional Tambora. Kerangka dan isinya meneruskan Google Site lama ([sites.google.com/view/dashboardtntambora](https://sites.google.com/view/dashboardtntambora)).

Alamat: **https://kopluck8.github.io/Satu-Data-Tambora/**

## Isi diubah lewat Google Sheets, bukan lewat kode

Seluruh isi dashboard (menu, halaman, teks, gambar, peta, grafik, tautan, dan daftar aplikasi) dibaca dari satu spreadsheet: **Isi Satu Data Tambora**. Ubah spreadsheet, lalu buka ulang dashboard. Perubahan tampil dalam beberapa menit.

| Tab | Isi |
|---|---|
| `Pengaturan` | Nama dashboard, sambutan, teks pengelola |
| `Halaman` | Daftar menu dan halaman (urutan baris = urutan menu) |
| `Isi` | Isi setiap halaman, satu baris per elemen: judul, teks, gambar, sematan (grafik/peta/slides/aplikasi), tautan, kartu |
| `Aplikasi` | Daftar repo/aplikasi GitHub |
| `Panduan` | Penjelasan setiap kolom dan jenis isi |

### Pemasangan pertama (sekali saja)

1. Unduh [`data/Isi_Satu_Data_Tambora.xlsx`](data/Isi_Satu_Data_Tambora.xlsx). Isinya sudah sama dengan Google Site lama.
2. Unggah ke Google Drive, buka, lalu **File → Simpan sebagai Google Spreadsheet**.
3. **Bagikan → Akses umum: Siapa saja yang memiliki link → Pelihat**. Dashboard tidak perlu login atau izin Google lain; cukup ini.
4. Salin link spreadsheet, tempel ke `GOOGLE_SHEETS` di [`data/sumber.js`](data/sumber.js), lalu commit.

Selama link belum diisi, atau bila spreadsheet tidak bisa dibaca, dashboard memakai salinan cadangan di `data/isi/*.csv`. Baris bawah (footer) dashboard menunjukkan sumber mana yang sedang dipakai.

> Isi spreadsheet bisa dibaca siapa saja yang tahu link-nya, sama seperti Google Site yang publik. Jangan menaruh data rahasia di spreadsheet ini.

### Gambar

Kolom `gambar` menerima link gambar biasa atau link file Google Drive. Untuk gambar baru: unggah ke satu folder Drive (misalnya *Gambar Satu Data Tambora*), bagikan folder sebagai **Siapa saja yang memiliki link: Pelihat**, lalu tempel link file-nya. Gambar-gambar dari Google Site lama saat ini masih memakai alamat gambar Google Site; bila Google Site dihapus, ganti dengan link Drive.

### Menambah repo/aplikasi baru

Tambah satu baris di tab `Aplikasi`: `id`, `nama`, `ringkas`, `kelompok` (id menu, misalnya `smart`, `rbm`, `karhut`, `manajemen`), `repo`, `url` GitHub Pages, `status` (aktif / uji coba / pengembangan). Aplikasi otomatis muncul di halaman utama menu tersebut, di Katalog Aplikasi, dan di pencarian. Bila ingin ditampilkan langsung di dalam dashboard, tambahkan halaman di tab `Halaman` dan satu baris `sematan` di tab `Isi`.

## Struktur repo

```
index.html                  kerangka halaman
assets/app.js               memuat isi dari Google Sheets dan menyusun halaman
assets/style.css            tampilan (mode terang & gelap)
assets/img/                 logo
data/sumber.js              link Google Sheets
data/isi/*.csv              salinan cadangan isi (format sama dengan tab spreadsheet)
data/Isi_Satu_Data_Tambora.xlsx   spreadsheet awal untuk diunggah ke Google Drive
```

Untuk memperbarui salinan cadangan: di Google Sheets, **File → Download → CSV** untuk tiap tab, lalu ganti file di `data/isi/` dengan nama yang sama (`Pengaturan.csv`, `Halaman.csv`, `Isi.csv`, `Aplikasi.csv`).

## Catatan pemindahan dari Google Site

- Grafik Google Sheets, peta Google My Maps, Google Slides, dan tautan Sheets/Drive memakai sumber aslinya, jadi tetap terbarui otomatis.
- Empat sematan kode khusus di Google Site (SMART Patrol → Rangkuman dan halaman Grafik, Resor Base Management → Dashboard Capaian, Kebakaran Hutan → Informasi Hotspot) tidak bisa dibaca isinya dari luar. Diisi dengan halaman GitHub Pages yang sesuai (Dashboard SMART, Dashboard RBM, WebGIS Hotspot). Ubah kolom `url` bila berbeda.
- Dua PDF di halaman Geomorfologi (`bf01073515.pdf`, `0091-761329123Avsotgt3B2.pdf`) belum punya link; isi kolom `url`-nya.
- Halaman Kebakaran Hutan → Grafik dan profil lima resor memang masih kosong di Google Site.
