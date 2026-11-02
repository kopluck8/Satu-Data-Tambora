# Satu Data Tambora

Satu layar untuk data, peta, dan aplikasi kerja Balai Taman Nasional Tambora.

Alamat: **https://satudatambora.my.id/**

Domain diatur lewat file `CNAME` di repo ini dan DNS di Hostinger. Alamat lama `https://kopluck8.github.io/Satu-Data-Tambora/` otomatis dialihkan ke domain ini. Aplikasi lain (SMART, RBM, Simulasi API, dan seterusnya) tetap di `kopluck8.github.io`.

## Tampilan

Tampilannya meniru layar utama konsol PS5:

- **Deretan ubin** di atas: Beranda, satu ubin per tema (Profil Kawasan, Resor Pengelolaan, SMART Patrol, RBM, Kebakaran Hutan, Perlindungan Kawasan, Wisata & Pelayanan, Aset BMN, Kepegawaian), dan Pustaka. Memilih ubin mengganti foto latar, sorotan, dan baris kartu di bawahnya.
- **Sorotan tema**: judul, ringkasan, tombol **Buka** untuk isi utama tema, dan menu **⋯** (buka di tab baru, lihat kode di GitHub, salin tautan).
- **Angka langsung** dari aplikasi lain: capaian RBM, observasi SMART Patrol, areal terbakar, skor potensi tiap resor, serta jumlah pegawai dan pengingat kepegawaian terdekat.
- **Pustaka**: semua isi dalam satu daftar, dengan pencarian dan saringan jenis/tema.
- **Penampil layar penuh**: aplikasi, peta, grafik, slide, dan file Drive dibuka di dalam dashboard. Setiap isi punya alamat sendiri (misalnya `#/smart/dashboard-data-smart-patrol`) yang bisa dibagikan.

Bisa dipakai dengan papan ketik seperti stik konsol: tombol panah untuk berpindah, Enter untuk membuka, `/` untuk mencari, Esc untuk kembali.

## Isi diubah lewat Google Sheets

Semua isi (tema, kartu, teks, foto, link) dibaca dari satu spreadsheet dengan tiga tab:

| Tab | Isi |
|---|---|
| `Pengaturan` | Nama dashboard, sambutan, teks pengelola, link spreadsheet DE-BORA (kunci `kepegawaian`) |
| `Tema` | Satu baris per ubin tema: judul, ringkasan, ikon, warna, foto latar |
| `Item` | Satu baris per kartu: tema, kelompok, judul, jenis, link, keterangan |

Spreadsheet yang dipakai sekarang: [Konten Satu Data Tambora](https://docs.google.com/spreadsheets/d/10YLAl0fgiLHScrToPyOLGLidSajFUiKJ6bSj516Naa0/edit) (tersambung sejak 2 November 2026). Perubahan di sana tampil di dashboard tanpa commit apa pun.

Tab `Panduan` di spreadsheet menjelaskan setiap kolom. Arahkan kursor ke judul kolom untuk melihat catatannya.

### Menyambungkan spreadsheet baru (sekali saja)

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

Tema dengan `id` berikut menampilkan angka terkini. Jangan ganti kelima `id` ini.

| `id` | Angka | Sumber |
|---|---|---|
| `rbm` | Capaian kegiatan resor tahun berjalan dan per resor | [RBM_TNGunungTambora](https://github.com/kopluck8/RBM_TNGunungTambora), dihitung dengan kode yang sama dengan Dashboard Capaian RBM |
| `smart` | Jumlah observasi patroli tahun berjalan dan kategori terbanyak | [Dashboard_SMART_TNGunungTambora](https://github.com/kopluck8/Dashboard_SMART_TNGunungTambora) |
| `karhut` | Areal terbakar musim ini dari delineasi manual, per resor dan per delineasi; bila belum ada delineasi, estimasi Sentinel-2 | [Simulasi-API-Tambora](https://github.com/kopluck8/Simulasi-API-Tambora) (`status/areal_terbakar.json`, cadangan `status/landscape_terbaru.json`) |
| `resor` | Jumlah resor, skor potensi tiap resor, dan ancaman tertinggi di kawasan | `data/resor/analisis.json` di repo ini (lihat *Resor Pengelolaan*) |
| `kepegawaian` | Jumlah pegawai per status dan pengingat tenggat terdekat | Spreadsheet DE-BORA bagian Kepegawaian, dibaca langsung oleh browser setelah login (lihat *Kepegawaian (De-Bora)*) |

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

## Penanganan Konflik Tenurial

Tab **Perlindungan Kawasan** memuat kartu *Penanganan Konflik Tenurial Karya Sari dan So Tompo* yang membuka halaman [`tenurial/`](tenurial/index.html): rangkuman hasil pengumpulan bahan keterangan (pulbaket) penggunaan lahan dalam SMART Patrol berdasarkan Surat Tugas Nomor ST.1452/T.41/TU/DIPA/10/2026 (14–18 Oktober 2026). Isinya peta 146 bidang garapan, status identifikasi pengguna per blok dan lokasi, asal pengguna, sewa dan jual beli lahan, pembukaan baru 2026, irisan dengan areal terbakar 2026, rekomendasi tindak lanjut, dan metode.

- **Data** ada di `data/tenurial/`: `ringkasan.json` (angka agregat), `bidang.geojson` (bidang L001–L146 dengan blok, resor, lokasi, zona, luas, status identifikasi, jumlah pengguna, dan luas irisan areal terbakar), `terbakar.geojson` (poligon areal terbakar 2026 yang beririsan dengan atau berjarak hingga 1 km dari bidang), dan `zonasi.geojson` (zonasi di sekitar kedua blok). Batas resor diambil dari `data/resor/batas_resor_2026.geojson`.
- **Tanpa identitas pribadi**: nama pengguna lahan, pihak yang menyewakan atau menjual, dan nilai transaksi tidak disimpan di repo ini. Rinciannya hanya ada di Laporan Pelaksanaan Kegiatan ST.1452.
- **Pembaruan**: setelah pulbaket lanjutan, olah ulang isian pulbaket dan SHP bidang, lalu ganti keempat file di `data/tenurial/`. Halaman langsung memakai angka baru tanpa perubahan kode.

## Kepegawaian (De-Bora)

Tab **Kepegawaian** membuka halaman [`kepegawaian/`](kepegawaian/index.html), hasil olahan spreadsheet **DE-BORA** yang dikelola dan diperbarui sendiri oleh bagian Kepegawaian. Bagian Kepegawaian tetap bekerja di spreadsheet seperti biasa; halaman ini tidak menampilkan spreadsheet, melainkan ringkasannya:

- **Ringkasan**: jumlah pegawai (PNS, CPNS, PPPK), laki-laki dan perempuan, pengingat 30 hari ke depan, formasi terisi, diklat fungsional, rata-rata umur dan masa kerja.
- **Pengingat**: semua tenggat yang mendekat, diurutkan dari yang terdekat dan bisa disaring per jenis: KGB, pensiun, jadwal kenaikan pangkat dan uji kompetensi, batas usulan PAK, SKP triwulan, cuti, pelatihan, ulang tahun, serta hal yang belum lengkap (dokumen, berkas KGB, unggahan SIMPEG, kendala presensi Sikadir). Hitungan hari mengikuti tanggal di perangkat.
- **Agenda**: jadwal kepegawaian per bulan.
- **Komposisi**, **Formasi**, **Kinerja** (SKP, IPASN rata-rata, PAK, diklat, pelatihan), **Administrasi** (dokumen, KGB, cuti, presensi), dan **Tautan** (aplikasi kepegawaian, pengumuman, peraturan).

Pengingat berlaku umum untuk semua pegawai, tidak per akun. Browser membaca DE-BORA langsung lewat link (CSV gviz Google Sheets, seperti isi dashboard) dan mengolahnya di perangkat dengan [`assets/pegawai.js`](assets/pegawai.js). Tidak ada Apps Script dan tidak ada izin Google tambahan.

- **Menyambungkan (sekali saja)**: di Sheet konten, tab `Pengaturan`, tambahkan baris dengan `kunci` = `kepegawaian` dan `nilai` = link DE-BORA. Link itu sengaja tidak disimpan di repo ini.
- **Akses DE-BORA** harus tetap *Siapa saja yang memiliki link: Pelihat*. Bila diubah menjadi terbatas, halaman menampilkan pesan bahwa spreadsheet tidak bisa dibuka.
- **Nama tab** dikenali dari namanya: `sheet1`, `Daftar Pegawai TNT`, `Struktur Organisasi`, `Peta Jabatan Revisi <tahun>`, `Jadwal Kepegawaian`, `KGB <tahun>`, `Belum Upload DOk KGB`, `PAK`, `Upload PAK SIMPEG`, `SKP <tahun>`, `Kelengkapan Dokumen`, `Cuti <tahun>`, `Pelatihan`, `Nilai IPASN`, `Bukti kendala Sikadir`, `Aplikasi Kepegawaian`. Untuk tab bertahun dipakai tahun berjalan, atau tahun terakhir sebelumnya bila tab tahun ini belum dibuat (misalnya `KGB 2027` otomatis terbaca begitu dibuat). Kolom dikenali dari judul atau isinya, jadi bagian Kepegawaian bebas menambah baris atau menggeser kolom. Tab yang tidak ditemukan disebut di bagian catatan halaman. Tab `sheet1` sebaiknya tetap paling kiri, karena lewat link tab paling kiri tidak bisa dibedakan dari tab yang tidak ada.
- **Batas cara link**: tautan yang ditanam di sel (misalnya file materi atau SK) tidak ikut terbaca, hanya teksnya. Tautan yang ditulis sebagai teks `https://…` tetap bisa dibuka. Pada kolom yang isinya bercampur angka dan teks, Google kadang mengosongkan jenis yang lebih sedikit.
- **Pembaruan**: hasil olahan disimpan di tab browser selama 10 menit (sessionStorage `sdt-pegawai-v1`, dihapus saat keluar). Tombol **Muat ulang** membaca ulang DE-BORA saat itu juga.
- **Privasi**: tidak ada data pegawai di repo ini. Halaman hanya menampilkan angka olahan dan nama untuk pengingat; NIP, tanggal lahir, asal, agama, dan nilai per orang tidak ditampilkan. Namun, karena browser membaca tab DE-BORA apa adanya, siapa pun yang memegang link DE-BORA tetap bisa membuka isi lengkapnya. Link itu tersimpan di Sheet konten yang juga bisa dibaca lewat link.

## Login

Situs ini, termasuk halaman `resor/`, `tenurial/`, dan `kepegawaian/`, baru tampil setelah pegawai masuk dengan akun di lembar **Akun** Apps Script Tanya Data (lihat [`apps-script/README.md`](apps-script/README.md)). Sekali masuk berlaku untuk seluruh situs dan panel Tanya Data selama 6 jam (`LAMA_SESI_JAM`). Tombol berinisial nama di kanan atas berisi menu **Keluar**. Gerbangnya ada di [`assets/gerbang.js`](assets/gerbang.js) dan hanya aktif bila `TANYA_DATA` di `data/sumber.js` terisi.

> Gerbang ini menutup tampilan, bukan file. Selama repo dan GitHub Pages publik, file data (misalnya `data/resor/*.json`, `data/tenurial/*.geojson`) dan aplikasi lain di `kopluck8.github.io` tetap bisa dibuka langsung oleh siapa pun yang tahu alamatnya, dan isi repo terlihat di GitHub. Data yang benar-benar rahasia jangan disimpan di repo publik; sajikan lewat Apps Script yang memeriksa login. Halaman diberi `noindex` dan `robots.txt` agar tidak muncul di mesin pencari.

## Tanya Data (chatbot)

Tombol **Tanya Data** di pojok kanan bawah membuka panel chat. Pegawai masuk dengan username dan password, lalu bisa bertanya bebas tentang data dashboard: SMART Patrol, RBM, Resor Pengelolaan, Laporan Kajian, areal terbakar, konflik tenurial, dan penerbangan drone. Bot bisa menghitung dan merekap, menyiapkan unduhan (CSV, Excel, GeoJSON), dan membuka kartu dashboard yang relevan. Angka di jawaban selalu dihitung dari data lewat alat, bukan dikarang AI.

- **Backend** ada di [`apps-script/`](apps-script/): Google Apps Script yang menempel pada satu Google Sheets berisi akun pegawai dan log pertanyaan. Kunci API Gemini atau Claude disimpan di sana, tidak pernah di browser atau repo.
- **Batas harian**: 20 pertanyaan per pegawai dan 600 untuk seluruh kantor, bisa diubah.
- **Tombol baru tampil** setelah URL Web App diisi di `TANYA_DATA` pada [`data/sumber.js`](data/sumber.js).

Panduan pemasangan, membuat akun pegawai, mengganti model, dan menambah dataset: [`apps-script/README.md`](apps-script/README.md).

## Foto

Foto latar ada di `assets/foto/` (versi besar 1920 px dan versi `-kecil` 720 px untuk ubin dan kartu). Data EXIF, termasuk lokasi GPS, sudah dihapus. Kredit tampil di pojok sorotan dan diatur di kolom `kredit` tab `Tema`.

Untuk foto baru, cara termudah: unggah ke Google Drive, bagikan **Siapa saja yang memiliki link: Pelihat**, lalu tempel link file-nya di kolom `gambar`. Kolom `fokus` (misalnya `50% 45%`) mengatur bagian foto yang tetap terlihat saat dipotong layar. Bila `gambar` kosong, dashboard membuat ilustrasi otomatis sesuai warna tema dan jenis isi.

## Struktur repo

```
index.html                         kerangka halaman
assets/app.js                      memuat isi dan menyusun tampilan
assets/style.css                   tampilan
assets/seni.js                     ikon dan ilustrasi otomatis (SVG)
assets/pantauan.js                 angka langsung dari RBM, SMART, Simulasi API, analisis resor, dan DE-BORA
assets/tanya.js, tanya.css         panel chat Tanya Data
assets/gerbang.js                  halaman masuk (login) untuk seluruh situs
assets/pegawai.js                  membaca dan mengolah spreadsheet DE-BORA di browser (tab Kepegawaian)
assets/foto/                       foto latar
assets/img/                        logo
data/sumber.js                     link Google Sheets dan URL Web App Tanya Data
data/konten/*.csv                  salinan cadangan isi (sama dengan tab spreadsheet)
data/Konten_Satu_Data_Tambora.xlsx spreadsheet awal untuk diunggah ke Google Drive
resor/                             halaman Resor Pengelolaan (ikhtisar, profil per resor, metode)
data/resor/                        batas resor 2026, isi Laporan Kajian, hasil analisis, tempat foto
tools/resor/                       skrip analisis potensi dan ancaman per resor beserta ujinya
tenurial/                          halaman Penanganan Konflik Tenurial Karya Sari dan So Tompo
kepegawaian/                       halaman Kepegawaian De-Bora (DE-BORA dibaca langsung oleh browser, tidak disimpan di repo)
data/tenurial/                     rangkuman pulbaket ST.1452 tanpa identitas pribadi, peta bidang, areal terbakar, zonasi
apps-script/                       backend Tanya Data (Google Apps Script) dan panduan pemasangannya
.github/workflows/resor.yml        pembaruan analisis resor harian
```

Situs statis tanpa proses build: GitHub Pages langsung menyajikan isi cabang `main`. Untuk mencoba di komputer sendiri, jalankan `python3 -m http.server` di folder repo lalu buka `http://localhost:8000`.

Untuk memperbarui salinan cadangan: di Google Sheets, **File → Download → CSV** untuk tab `Pengaturan`, `Tema`, dan `Item`, lalu ganti file di `data/konten/` dengan nama yang sama.
