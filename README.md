# Satu Data Tambora

Satu layar untuk data, peta, dan aplikasi kerja Balai Taman Nasional Tambora.

Alamat: **https://kopluck8.github.io/Satu-Data-Tambora/**

## Tampilan

Tampilannya meniru layar utama konsol PS5:

- **Deretan ubin** di atas: Beranda, satu ubin per tema (Profil Kawasan, Resor Pengelolaan, SMART Patrol, RBM, Kebakaran Hutan, Perlindungan Kawasan, Wisata & Pelayanan, Aset BMN), dan Pustaka. Memilih ubin mengganti foto latar, sorotan, dan baris kartu di bawahnya.
- **Sorotan tema**: judul, ringkasan, tombol **Buka** untuk isi utama tema, dan menu **⋯** (buka di tab baru, lihat kode di GitHub, salin tautan).
- **Angka langsung** dari aplikasi lain: capaian RBM, observasi SMART Patrol, areal terbakar, dan skor potensi tiap resor.
- **Pustaka**: semua isi dalam satu daftar, dengan pencarian dan saringan jenis/tema.
- **Penampil layar penuh**: aplikasi, peta, grafik, slide, dan file Drive dibuka di dalam dashboard. Setiap isi punya alamat sendiri (misalnya `#/smart/dashboard-data-smart-patrol`) yang bisa dibagikan.

Bisa dipakai dengan papan ketik seperti stik konsol: tombol panah untuk berpindah, Enter untuk membuka, `/` untuk mencari, Esc untuk kembali.

## Isi diubah lewat Google Sheets

Semua isi (tema, kartu, teks, foto, link) dibaca dari satu spreadsheet dengan tiga tab:

| Tab | Isi |
|---|---|
| `Pengaturan` | Nama dashboard, sambutan, teks pengelola |
| `Tema` | Satu baris per ubin tema: judul, ringkasan, ikon, warna, foto latar |
| `Item` | Satu baris per kartu: tema, kelompok, judul, jenis, link, keterangan |

Tab `Panduan` di spreadsheet menjelaskan setiap kolom. Arahkan kursor ke judul kolom untuk melihat catatannya.

### Menyambungkan spreadsheet (sekali saja)

1. Unduh [`data/Konten_Satu_Data_Tambora.xlsx`](data/Konten_Satu_Data_Tambora.xlsx).
2. Unggah ke Google Drive, buka, lalu **File → Simpan sebagai Google Spreadsheet**.
3. Di file baru itu: **Bagikan → Akses umum: Siapa saja yang memiliki link → Pelihat**. Hanya ini izin Google yang dibutuhkan; dashboard tidak perlu login.
4. Tempel link spreadsheet ke `GOOGLE_SHEETS` di [`data/sumber.js`](data/sumber.js), lalu commit.

Sebelum link diisi, atau bila spreadsheet tidak terbaca, dashboard memakai salinan cadangan `data/konten/*.csv`. Kaki halaman menunjukkan sumber yang sedang dipakai. Kunjungan berikutnya langsung tampil dari salinan terakhir di perangkat, lalu diperbarui dari Google Sheets di belakang layar.

> Spreadsheet bisa dibaca siapa saja yang tahu link-nya. Jangan menaruh data rahasia di sana.

### Pekerjaan yang sering dilakukan

- **Menambah repo atau aplikasi baru**: tambah baris di tab `Item` dengan `jenis` = `aplikasi`, `url` = alamat GitHub Pages-nya, dan `repo` = `kopluck8/nama-repo`. Kartunya muncul di tema itu, di baris *Aplikasi kerja* beranda, dan di Pustaka.
- **Menyembunyikan isi**: tulis `tidak` di kolom `tampil`.
- **Mengganti isi utama tema** (yang dibuka tombol Buka): pindahkan `ya` di kolom `utama`.
- **Menambah tema**: tambah baris di tab `Tema` dengan `id` singkat tanpa spasi, lalu pakai `id` itu di kolom `tema` tab `Item`.

### Jenis isi

| `jenis` | Untuk | Dibuka |
|---|---|---|
| `aplikasi` | Aplikasi web (GitHub Pages dan lainnya) | di dalam dashboard |
| `peta` | Google My Maps, WebGIS | di dalam dashboard |
| `grafik` | Grafik terbitan Google Sheets | di dalam dashboard |
| `presentasi` | Google Slides | di dalam dashboard |
| `data` | Google Sheets | di dalam dashboard (pratinjau) |
| `dokumen` | PDF, Google Docs, file Drive | di dalam dashboard (pratinjau) |
| `folder` | Folder Google Drive | di dalam dashboard |
| `tautan` | Situs lain | tab baru |

Link `github.com` selalu dibuka di tab baru. File Google yang tidak dibagikan ke publik hanya tampil bagi akun yang punya akses; tombol **Buka di tab baru** selalu tersedia.

## Angka langsung

Tema dengan `id` berikut menampilkan angka terkini. Jangan ganti keempat `id` ini.

| `id` | Angka | Sumber |
|---|---|---|
| `rbm` | Capaian kegiatan resor tahun berjalan dan per resor | [RBM_TNGunungTambora](https://github.com/kopluck8/RBM_TNGunungTambora), dihitung dengan kode yang sama dengan Dashboard Capaian RBM |
| `smart` | Jumlah observasi patroli tahun berjalan dan kategori terbanyak | [Dashboard_SMART_TNGunungTambora](https://github.com/kopluck8/Dashboard_SMART_TNGunungTambora) |
| `karhut` | Areal terbakar musim ini dari delineasi manual, per resor dan per delineasi; bila belum ada delineasi, estimasi Sentinel-2 | [Simulasi-API-Tambora](https://github.com/kopluck8/Simulasi-API-Tambora) (`status/areal_terbakar.json`, cadangan `status/landscape_terbaru.json`) |
| `resor` | Jumlah resor, skor potensi tiap resor, dan ancaman tertinggi di kawasan | `data/resor/analisis.json` di repo ini (lihat *Resor Pengelolaan*) |

Bila salah satu sumber tidak terbaca, kartunya menulis *Belum bisa dimuat* dan bagian lain tetap jalan.

Delineasi areal terbakar cukup diunggah sebagai zip SHP ke folder Drive `Simulasi API Tambora/delineasi`, dengan tanggal di nama file. Rekap dan [peta areal terbakar](https://kopluck8.github.io/Simulasi-API-Tambora/peta_terbakar.html) diperbarui otomatis paling lama satu jam kemudian. Panduan: [PANDUAN_DELINEASI.md](https://github.com/kopluck8/Simulasi-API-Tambora/blob/main/docs/PANDUAN_DELINEASI.md).

## Resor Pengelolaan

Tab **Resor Pengelolaan** membuka halaman [`resor/`](resor/index.html): ikhtisar tujuh resor, satu profil per resor (`resor/index.html#/piong`, `#/oi-katupa`, `#/kawinda-toi`, `#/doro-tabe`, `#/doroncanga`, `#/doropeti`, `#/pancasila`), dan halaman metode (`#/metode`).

- **Batas resor 2026** dari SHP Laporan Hasil Kajian Wilayah Kerja Resor (`data/resor/batas_resor_2026.geojson`) hanya dipakai di tab ini. Dashboard SMART, RBM, dan tab lain tetap memakai batas lama.
- **Isi Laporan Kajian** (luas, desa binaan, kantor, aksesibilitas, potensi dan ancaman utama, hasil Zonation, kebutuhan personel) ada di `data/resor/kajian_2026.json`.
- **Data SMART Patrol** diambil dari repo Dashboard SMART dengan cara gabung dan buang ganda yang sama, lalu setiap observasi dipetakan ke batas resor 2026 menurut koordinatnya.
- **Ancaman** dinilai dengan Miradi Simple Threat Rating (Conservation Standards): lingkup × keparahan × ketakpulihan per jenis ancaman IUCN-CMP, dirangkum per resor dengan aturan 3-5-7 dan 2-prime. Laju temuan dihitung per 10 hari patroli.
- **Potensi** dinilai menurut tiga fungsi kawasan konservasi (perlindungan, pengawetan, pemanfaatan), masing-masing tiga indikator berskor 1–4.
- **Pembaruan otomatis**: workflow [`resor.yml`](.github/workflows/resor.yml) menjalankan `tools/resor/olah_resor.py` setiap hari pukul 07.40 WITA (dan setiap kali data kajian atau skrip berubah), lalu menyimpan `data/resor/analisis.json` dan `data/resor/peta.geojson`. Nilai dasar keparahan dan ketakpulihan tiap jenis ancaman bisa disesuaikan di tabel `ANCAMAN` pada skrip itu.

Foto profil resor diatur di [`data/resor/foto.json`](data/resor/foto.json). Setiap resor punya enam tempat foto bertema; foto pertama yang bertanda `utama` menjadi sampul. Isi `src` dengan path di repo (misalnya `assets/foto/resor/piong-savana.jpg`) atau link file Google Drive yang dibagikan **Siapa saja yang memiliki link: Pelihat**. Tempat yang masih kosong tampil sebagai bingkai bertuliskan temanya.

## Foto

Foto latar ada di `assets/foto/` (versi besar 1920 px dan versi `-kecil` 720 px untuk ubin dan kartu). Data EXIF, termasuk lokasi GPS, sudah dihapus. Kredit tampil di pojok sorotan dan diatur di kolom `kredit` tab `Tema`.

Untuk foto baru, cara termudah: unggah ke Google Drive, bagikan **Siapa saja yang memiliki link: Pelihat**, lalu tempel link file-nya di kolom `gambar`. Kolom `fokus` (misalnya `50% 45%`) mengatur bagian foto yang tetap terlihat saat dipotong layar. Bila `gambar` kosong, dashboard membuat ilustrasi otomatis sesuai warna tema dan jenis isi.

## Struktur repo

```
index.html                         kerangka halaman
assets/app.js                      memuat isi dan menyusun tampilan
assets/style.css                   tampilan
assets/seni.js                     ikon dan ilustrasi otomatis (SVG)
assets/pantauan.js                 angka langsung dari RBM, SMART, Simulasi API, dan analisis resor
assets/foto/                       foto latar
assets/img/                        logo
data/sumber.js                     link Google Sheets
data/konten/*.csv                  salinan cadangan isi (sama dengan tab spreadsheet)
data/Konten_Satu_Data_Tambora.xlsx spreadsheet awal untuk diunggah ke Google Drive
resor/                             halaman Resor Pengelolaan (ikhtisar, profil per resor, metode)
data/resor/                        batas resor 2026, isi Laporan Kajian, hasil analisis, tempat foto
tools/resor/                       skrip analisis potensi dan ancaman per resor beserta ujinya
.github/workflows/resor.yml        pembaruan analisis resor harian
```

Situs statis tanpa proses build: GitHub Pages langsung menyajikan isi cabang `main`. Untuk mencoba di komputer sendiri, jalankan `python3 -m http.server` di folder repo lalu buka `http://localhost:8000`.

Untuk memperbarui salinan cadangan: di Google Sheets, **File → Download → CSV** untuk tab `Pengaturan`, `Tema`, dan `Item`, lalu ganti file di `data/konten/` dengan nama yang sama.
