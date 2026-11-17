# Satu Data Tambora

Satu layar untuk data, peta, dan aplikasi kerja Balai Taman Nasional Tambora.

Alamat: **https://satudatambora.my.id/**

Domain diatur lewat file `CNAME` di repo ini dan DNS di Hostinger. Alamat lama `https://kopluck8.github.io/Satu-Data-Tambora/` otomatis dialihkan ke domain ini. Aplikasi lain (SMART, RBM, Simulasi API, dan seterusnya) tetap di `kopluck8.github.io`.

## Tampilan

Tampilannya meniru layar utama konsol PS5:

- **Deretan ubin** di atas: Beranda, satu ubin per tema (Profil Kawasan, Resor Pengelolaan, Keanekaragaman Hayati, SMART Patrol, RBM, Kebakaran Hutan, Perlindungan Kawasan, Wisata & Pelayanan, Aset BMN, Kepegawaian), dan Pustaka. Memilih ubin mengganti foto latar, sorotan, dan baris kartu di bawahnya.
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

## Keanekaragaman Hayati

Tab **Keanekaragaman Hayati** membuka halaman [`kehati/`](kehati/index.html). Susunannya mengikuti kerangka empat cabang: potensi kehati, kalkulator dan generator teknis PEH, perencanaan inventarisasi, dan data masuk. Ketujuh menunya ada di panel kiri, yang di layar sedang menyempit menjadi deret ikon. Di ponsel, menu dibuka dari tombol **Menu** di bilah bawah. Kotak cari di kepala halaman mencari jenis di Kamus jenis.

- **Potensi kehati** (`kehati/index.html#/`): peta temuan per kelompok, daftar jenis dengan status perlindungan (P.106/2018, IUCN, CITES), dan model sebaran habitat MaxEnt.
- **Kamus jenis** (`#/jenis`): 440 jenis yang tercatat sampai tingkat jenis, masing-masing dengan foto dan keterangan. Daftarnya bisa disaring per kelompok, diurutkan, dan dicari dari nama Indonesia, nama lokal, nama ilmiah, nama Inggris, atau famili. Setiap jenis punya halaman sendiri, misalnya `#/jenis/nisaetus-floris`, berisi foto, keterangan beserta sumbernya, status perlindungan, peta temuan, dan model sebaran bila ada.
- **Kamus metode dan rumus** (`#/kamus`): 69 metode inventarisasi dan perhitungan kehati dalam 9 kelompok. Setiap metode memuat kegunaan, kebutuhan data, dan sumbernya; rumus, simbol, dan cara membaca hasil dicantumkan bila ada. Isinya tidak terbatas pada metode yang dipakai di LPK dan RPK.
- **Kalkulator teknis** (`#/kalkulator`): 14 kalkulator. Data bisa ditempel dari Excel, dibaca dari CSV, dari ekspor SMART (kueri CSV atau patroli XML dan ZIP), atau dimuat dari data terkurasi tab ini. Semua hitungan berjalan di browser.
- **Generator RPK dan LPK** (`#/generator`): generator untuk 14 jenis kegiatan teknis di [PEH-Tambora](https://github.com/kopluck8/PEH-Tambora) dan generator SMART Patrol. Setiap baris tabel kegiatan menautkan ke generator jenis kegiatannya.
- **Perencanaan inventarisasi** (`#/perencanaan`): grid 1 km di atas kawasan, sel yang sudah dan belum terjamah survei, prioritas survei, penduga kekayaan jenis, dan jumlah jenis yang habitatnya sesuai menurut model di setiap sel.
- **Data masuk** (`#/data`): tabel temuan per kategori daftar kehati (Aves, Mamalia, Flora, Anggrek, Tipe Ekosistem, ditambah Fauna lain dan Belum terkelompok), register kegiatan, baris yang dibuang saat kurasi beserta letaknya di berkas sumber, nama yang perlu ditinjau, dan buku kerja [`data/kehati/Data_Masuk_Kehati_TN_Tambora.xlsx`](data/kehati/Data_Masuk_Kehati_TN_Tambora.xlsx).

Sumber dan kurasi:

- **Sumber**: 81 LPK teknis PEH 2020 sampai 2026 dari folder Drive kehati (77 di antaranya punya tabel temuan yang terbaca) dan temuan satwa, tumbuhan, spesies invasif, serta ground check dari SMART Patrol 10 Mei 2025 sampai 3 Oktober 2026. Zip arsip yang terpotong di Drive tidak diunduh ulang; berkas yang masih utuh di dalamnya tetap dibaca.
- **SMART Patrol** dibaca dari dua tempat: spreadsheet rekap temuan SMART (dibaca 15 November 2026, satu-satunya sumber untuk 2025) dan berkas patroli di repo Dashboard SMART per 27 Oktober 2026. Waypoint yang ada di keduanya (tanggal dan jam sama, koordinat berselisih paling banyak 0,00002 derajat) dihitung sekali dengan versi berkas patroli. Baris yang hanya ada di salinan lama dashboard (`data/data.csv`) tidak dimasukkan. Untuk label *Belum ada di list*, nama jenis dibaca dari kolom Keterangan atau Comment; jumlah, jarak, dan azimut yang hanya diketik di kolom itu juga ikut dibaca. Isi kedua kolom itu tidak disalin ke data halaman karena bisa memuat nama orang.
- **Kurasi**: dari 13.295 baris, 11.073 lolos (10.351 berkoordinat) dan 1.864 dibuang. Temuan yang berada lebih dari 1 km di luar batas kawasan dibuang; titik sampai 1 km di luar batas tetap masuk. Data ganda (koordinat, jenis, tanggal, dan jumlah sama) dibuang. Pengamatan ulang pada tanggal berbeda disimpan, tetapi dihitung satu lokasi di peta dan model. Temuan tanpa koordinat masuk tabel, tidak ikut peta dan model.
- **Nama jenis** diseragamkan ke daftar induk kehati TN Tambora dan kamus data model SMART. Nama di sumber yang tidak cocok persis (1.110 nama) dicatat di lembar *Nama perlu tinjau* beserta cara penyeragamannya, untuk dikoreksi pada pengolahan berikutnya.
- **Batas kawasan, resor, dan grid 1 km** diambil dari repo Dashboard SMART, jadi tab ini memakai enam resor yang sama dengan data SMART Patrol, bukan batas tujuh resor 2026 di tab Resor Pengelolaan.

Model MaxEnt:

- **Peubah lingkungan** dari landscape FlamMap 10 m `tambora_20261111_10m.lcp`: elevasi, kemiringan lereng, arah lereng (utara atau selatan dan timur atau barat), posisi topografi, tutupan kanopi, tinggi kanopi, dan kelas tutupan lahan, diolah ke sel 50 m.
- **Ambang data**: jenis dengan 10 lokasi unik atau lebih mendapat model penuh, 5 sampai 9 lokasi mendapat model sederhana yang hanya indikatif, kurang dari 5 lokasi hanya ditampilkan titiknya. Saat ini 166 jenis dimodelkan (123 penuh, 43 sederhana). Habitat sesuai memakai ambang P10.
- **Hasil** ada di `data/kehati/maxent/` (satu raster WebP per jenis, ditambah peta jumlah jenis) dengan ringkasan di `data/kehati/maxent.json`.

Isi Kamus jenis:

- **Keterangan** diambil lebih dulu dari dokumen Balai, yaitu draf buku burung 2025, buku kupu-kupu, dan Buku Saku Penamaan Flora Multibahasa (129 jenis). Jenis yang tidak ada di dokumen Balai diberi keterangan yang ditulis ulang dari Wikipedia bahasa Indonesia dan Inggris, iNaturalist, GBIF, dan WCVP. Jenis yang bahannya tidak cukup mendapat keterangan singkat yang disusun dari daftar induk kehati dan data GBIF, iNaturalist, atau WCVP. Sumber setiap keterangan tercantum di halaman jenisnya.
- **Foto** diambil dari dokumen Balai bila ada (135 jenis): buku burung, buku saku flora, serta bahan presentasi Pohon dan Tumbuhan Bawah TN Tambora. Foto di dokumen itu yang diberi kredit pihak luar tidak dipakai. Foto lainnya dari iNaturalist dan GBIF (303 jenis), hanya yang berlisensi CC0, CC BY, CC BY-SA, atau CC BY-NC, dengan nama pemotret, lisensi, dan tautan asal di bawah foto. Foto CC BY-NC tidak boleh dipakai untuk keperluan komersial.
- **Nama yang dibetulkan**: sepuluh nama di data dicari rujukannya dengan ejaan yang dibetulkan, misalnya Kleinhovia flava sebagai Kleinhovia hospita dan Collocalia fuciphaga sebagai Aerodramus fuciphagus. Halaman jenisnya memuat catatan tentang hal itu. Rhomboda cretata dari laporan anggrek 2022 sudah dibakukan menjadi Rhomboda cristata di data. Canarium argentea dan Buchanania buxifolia belum ketemu padanannya di GBIF maupun iNaturalist, jadi belum berfoto.
- **Catatan sebaran tumbuhan**: bila WCVP belum mencatat Nusa Tenggara dalam sebaran suatu tumbuhan, halaman jenisnya memberi catatan. Isinya dibedakan menurut data WCVP: jenis asli di pulau lain Indonesia (temuan di Tambora bisa menjadi catatan sebaran baru, jadi identifikasinya perlu dicek), jenis yang tercatat sebagai pendatang di pulau lain, jenis yang dimuat daftar induk kehati Balai, dan jenis yang belum tercatat di wilayah Indonesia mana pun (identifikasinya perlu dicek ulang).
- **Berkas**: `data/kehati/kamus_jenis.json`, foto dengan sisi terpanjang 720 px di `data/kehati/jenis/`, dan gambar kecil 240 px di `data/kehati/jenis/k/`.

Data halaman ada di `data/kehati/` (`temuan.json`, `taksa.json`, `kegiatan.json`, `buang.json`, `nama_tinjau.json`, `celah.json`, `batas.json`, `smart_jenis.json`, `ringkasan.json`, `kamus_jenis.json`, dan folder `jenis/`). Skrip pengolahan (pembacaan arsip Drive, kurasi, MaxEnt, grid, kamus jenis, dan ekspor) tidak disimpan di repo ini. Untuk pembaruan, olah ulang lalu ganti seluruh isi `data/kehati/`; halaman langsung memakai angka baru tanpa perubahan kode.

> Koordinat temuan, termasuk jenis dilindungi, disimpan apa adanya di `data/kehati/`. Selama repo dan GitHub Pages publik, file itu bisa dibuka siapa saja yang tahu alamatnya.

## Penyuluhan dan Pemberdayaan Masyarakat

Tab **Penyuluhan & Pemberdayaan** membuka halaman [`penyuluhan/`](penyuluhan/index.html), hasil kurasi 274 berkas di folder Drive penyuluhan dan pemberdayaan menjadi 260 laporan kegiatan 2020 sampai 2026.

- **Ringkasan**: angka kunci, kegiatan per tahun menurut jenisnya, dan sebaran kegiatan per resort.
- **Kelompok binaan** (`penyuluhan/index.html#kelompok`): riwayat kondisi 43 kelompok per tahun (aktif, kurang aktif, tidak aktif, baru dibentuk), bidang usaha, kendala yang paling sering muncul, dan kelompok yang paling sering didampingi. Riwayat satu kelompok bisa dibuka langsung, misalnya `#kelompok/k03`.
- **Program** (`#penyuluhan`): 15 jenis kegiatan, masing-masing dengan tujuan, isi laporan, desa, laporan per tahun, dan daftar semua laporannya. Juga peserta tercatat, desa yang paling sering dikunjungi, dan sekolah Tambora Goes To School.
- **Laporan** (`#laporan`): pencarian semua laporan dengan ringkasan, temuan, kendala, rekomendasi, dan tautan ke berkas aslinya di Drive.
- **Kegiatan teknis PEH tidak diulang di sini**; hasilnya ada di tab Keanekaragaman Hayati.
- **Resort** mengikuti yang tertulis di laporan (enam resort sebelum pemekaran Doro Tabe), bukan batas tujuh resor 2026.

Data ada di `data/penyuluhan/`: `dashboard.json` (dibaca halaman), serta `penyuluhan.csv`, `kelompok.csv`, `kelompok_riwayat.csv`, dan `sumber_penyuluhan.csv` untuk diunduh. Ekstraksi laporan, skrip pengolahan, dan penjelasan lengkap per topik ada di repo [Penyuluh_BTNT](https://github.com/kopluck8/Penyuluh_BTNT). Untuk pembaruan, jalankan `scripts/build_data.py` di repo itu, lalu salin `data/dashboard.json` (tanpa bagian teknis) dan keempat CSV ke `data/penyuluhan/`.

> Ringkasan laporan bisa memuat nama ketua kelompok atau petugas seperti tertulis di laporan aslinya. Selama repo publik, file ini bisa dibuka siapa saja yang tahu alamatnya.

## Penanganan Konflik Tenurial

Tab **Perlindungan Kawasan** memuat kartu *Penanganan Konflik Tenurial Karya Sari dan So Tompo* yang membuka halaman [`tenurial/`](tenurial/index.html): rangkuman hasil pengumpulan bahan keterangan (pulbaket) penggunaan lahan dalam SMART Patrol berdasarkan Surat Tugas Nomor ST.1452/T.41/TU/DIPA/10/2026 (14–18 Oktober 2026). Isinya peta 146 bidang garapan, status identifikasi pengguna per blok dan lokasi, asal pengguna, sewa dan jual beli lahan, pembukaan baru 2026, irisan dengan areal terbakar 2026, rekomendasi tindak lanjut, dan metode.

- **Data** ada di `data/tenurial/`: `ringkasan.json` (angka agregat), `bidang.geojson` (bidang L001–L146 dengan blok, resor, lokasi, zona, luas, status identifikasi, jumlah pengguna, dan luas irisan areal terbakar), `terbakar.geojson` (poligon areal terbakar 2026 yang beririsan dengan atau berjarak hingga 1 km dari bidang), dan `zonasi.geojson` (zonasi di sekitar kedua blok). Batas resor diambil dari `data/resor/batas_resor_2026.geojson`.
- **Nama pengguna lahan dan pihak yang menyewakan/menjual** disimpan di `bidang.geojson` (properti `orang`: nama, alamat, riwayat, yang menyewakan, tahun aktif, keterangan; `pengaruh`: pihak berpengaruh; `tutupan` dan `catatan`) atas permintaan Balai, dari seluruh kolom `join_rambah.xlsx`. Nilai transaksi tidak ada di file itu. Ingat: file ini bisa dibuka siapa saja yang tahu alamatnya, karena repo dan GitHub Pages publik.
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

Situs ini, termasuk halaman `resor/`, `kehati/`, `penyuluhan/`, `tenurial/`, dan `kepegawaian/`, baru tampil setelah pegawai masuk dengan akun di lembar **Akun** Apps Script Tanya Data (lihat [`apps-script/README.md`](apps-script/README.md)). Sekali masuk berlaku untuk seluruh situs dan panel Tanya Data selama 6 jam (`LAMA_SESI_JAM`). Tombol berinisial nama di kanan atas berisi menu **Keluar**. Gerbangnya ada di [`assets/gerbang.js`](assets/gerbang.js) dan hanya aktif bila `TANYA_DATA` di `data/sumber.js` terisi.

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
kehati/                            halaman Keanekaragaman Hayati (potensi, kamus jenis, kamus metode, kalkulator, generator, perencanaan, data masuk)
data/kehati/                       temuan terkurasi, daftar takson, kamus jenis dan fotonya, register kegiatan, grid 1 km, raster MaxEnt, buku kerja Data Masuk
tenurial/                          halaman Penanganan Konflik Tenurial Karya Sari dan So Tompo
penyuluhan/                        halaman Penyuluhan dan Pemberdayaan Masyarakat (kelompok binaan, 15 program, laporan)
data/penyuluhan/                   data kurasi laporan penyuluhan dan pemberdayaan (JSON dan CSV)
kepegawaian/                       halaman Kepegawaian De-Bora (DE-BORA dibaca langsung oleh browser, tidak disimpan di repo)
data/tenurial/                     rangkuman pulbaket ST.1452, peta bidang beserta nama pengguna, areal terbakar, zonasi
apps-script/                       backend Tanya Data (Google Apps Script) dan panduan pemasangannya
.github/workflows/resor.yml        pembaruan analisis resor harian
```

Situs statis tanpa proses build: GitHub Pages langsung menyajikan isi cabang `main`. Untuk mencoba di komputer sendiri, jalankan `python3 -m http.server` di folder repo lalu buka `http://localhost:8000`.

Untuk memperbarui salinan cadangan: di Google Sheets, **File → Download → CSV** untuk tab `Pengaturan`, `Tema`, dan `Item`, lalu ganti file di `data/konten/` dengan nama yang sama.
