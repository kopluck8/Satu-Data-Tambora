# Tanya Data

Chatbot di Satu Data Tambora. Pegawai masuk dengan username dan password, lalu bertanya bebas tentang data di dashboard ("berapa temuan jerat di Piong bulan ini?", "unduh observasi satwa 2026 dalam Excel", "buka peta areal terbakar"). Jawaban selalu dihitung dari data, bukan dikarang AI.

Folder ini berisi backend-nya: satu Google Apps Script yang menempel pada satu Google Sheets. Tampilan chat ada di `assets/tanya.js` dan `assets/tanya.css` repo ini.

## Cara kerja

```
Browser (tombol Tanya Data)
   │  username + password → token sesi (6 jam)
   ▼
Apps Script (Web App)  ── cek sesi dan sisa kuota harian
   │  kunci API disimpan di sini, tidak pernah sampai ke browser
   ▼
Gemini atau Claude  ⇄  alat di Apps Script:
   lihat_dataset    kolom, nilai yang ada, rentang tanggal
   cari_data        saring, kelompokkan, hitung, jumlahkan
   siapkan_unduhan  CSV, Excel, atau GeoJSON sesuai permintaan
   buka_halaman     tombol ke kartu dashboard yang relevan
   ▼
Jawaban + tombol Unduh / Buka  → dicatat di lembar Log
```

AI tidak membaca seluruh data. Ia hanya meminta hitungan lewat alat, dan Apps Script yang menghitung. Karena itu angka di jawaban sama dengan angka di data.

### Data yang bisa ditanyakan

| Dataset | Isi | Sumber |
|---|---|---|
| `smart_observasi` | Setiap observasi SMART Patrol (Drive + Google Sheets, sudah dibuang ganda) | Dashboard_SMART_TNGunungTambora |
| `rbm_kegiatan` | Target, realisasi, dan capaian kegiatan RBM 2026 per resor | RBM_TNGunungTambora |
| `rbm_laporan` | Laporan kegiatan dari form RBM dan status verifikasinya | RBM_TNGunungTambora |
| `penerbangan_drone` | Log penerbangan drone | Flight_SMART |
| `resor_pengelolaan` | Ringkasan tujuh resor: luas, potensi, ancaman Miradi, temuan SMART | `data/resor/` repo ini |
| `kajian_resor` | Isi Laporan Kajian Wilayah Kerja Resor 2026 | `data/resor/kajian_2026.json` |
| `areal_terbakar` | Rekap delineasi areal terbakar musim ini | Simulasi-API-Tambora |
| `tenurial` | Rangkuman pulbaket konflik tenurial Karya Sari dan So Tompo | `data/tenurial/` repo ini |

Data SMART dan RBM memakai batas **enam resor lama**, sama dengan dashboard aslinya. Data Resor Pengelolaan memakai **tujuh resor 2026**. Bot diberi tahu perbedaan ini dan menyebutkannya bila pertanyaan menyangkut keduanya.

## Yang perlu disiapkan

- **Akun Google kantor** yang akan memiliki skrip. Skrip berjalan atas nama akun ini.
- **Kunci API**, pilih salah satu:
  - **Gemini** (bawaan): buat di [Google AI Studio](https://aistudio.google.com/apikey). Untuk data kantor, aktifkan penagihan (tier berbayar). Di tier gratis, Google boleh memakai isi pertanyaan untuk mengembangkan produknya, dan batas permintaannya kecil.
  - **Claude**: buat di [Claude Console](https://console.anthropic.com/settings/keys) (kunci diawali `sk-ant-`).

## Pasang (sekali saja)

Langkah bertanda 🔐 adalah **otorisasi Google**: muncul jendela izin dari Google yang harus kamu setujui sendiri.

1. Buka [Google Sheets](https://sheets.new) dengan akun kantor dan beri nama `Tanya Data Satu Data Tambora`.
2. **Ekstensi → Apps Script**. Di editor:
   - Hapus isi `Kode.gs`, lalu tempel seluruh isi [`TanyaData.gs`](TanyaData.gs).
   - **Setelan proyek** (ikon roda gigi) → centang **Tampilkan file manifes "appsscript.json" di editor**. Kembali ke **Editor**, buka `appsscript.json`, ganti isinya dengan [`appsscript.json`](appsscript.json).
   - Simpan (Ctrl+S).
3. 🔐 Di daftar fungsi pilih `pasang`, klik **Jalankan**. Google meminta izin:
   - **Lihat dan kelola spreadsheet** (untuk lembar Akun dan Log),
   - **Hubungkan ke layanan eksternal** (untuk membaca data dashboard dan memanggil Gemini/Claude),
   - **Tampilkan konten pihak ketiga** (menu dan jendela di Sheets).

   Bila muncul "Google belum memverifikasi aplikasi ini", klik **Lanjutan → Buka Tanya Data (tidak aman)**. Itu wajar untuk skrip buatan sendiri. Setelah selesai, Sheets punya lembar **Akun** dan **Log**.
4. Kembali ke Sheets dan muat ulang halaman. Muncul menu **Tanya Data**. Pilih **Tanya Data → Atur kunci API**, lalu tempel kuncinya. Skrip mengenali sendiri apakah itu kunci Gemini atau Claude.
5. **Tanya Data → Uji koneksi AI**. Bila berhasil, muncul jawaban tentang jumlah resor.
6. 🔐 **Tanya Data → Aktifkan pemanasan data otomatis**. Google meminta satu izin tambahan: **Menjalankan aplikasi saat Anda tidak ada** (pemicu waktu). Setelah itu semua dataset dibaca ulang tiap 15 menit di belakang layar, sehingga pegawai tidak perlu menunggu data SMART dan RBM dimuat saat bertanya.
7. Isi akun pegawai di lembar **Akun** (lihat bagian berikut). Minimal buat satu akun `admin` untuk dirimu.
8. 🔐 Di editor Apps Script: **Terapkan → Deployment baru → ikon roda gigi → Aplikasi web**.
   - Deskripsi: `Tanya Data`
   - **Jalankan sebagai: Saya**
   - **Yang memiliki akses: Siapa saja**

   Klik **Terapkan**, setujui izin bila diminta, lalu salin **URL aplikasi web** (berakhiran `/exec`).

   "Siapa saja" diperlukan karena pegawai tidak masuk dengan akun Google. Penjaganya adalah username dan password di lembar Akun: tanpa token sesi, Web App hanya menjawab "silakan masuk".
9. Tempel URL itu ke `TANYA_DATA` di [`data/sumber.js`](../data/sumber.js), lalu commit. Selama `TANYA_DATA` kosong, tombol Tanya Data tidak tampil di dashboard.

## Akun pegawai

Akun yang sama dipakai untuk masuk ke seluruh situs Satu Data Tambora dan panel Tanya Data. Satu baris per pegawai di lembar **Akun**:

| Kolom | Isi |
|---|---|
| `Username` | Singkat, tanpa spasi, misalnya NIP atau `deo.falsa`. Tidak membedakan huruf besar-kecil. |
| `Nama` | Nama yang tampil di panel chat |
| `Peran` | `pegawai` atau `admin`. Admin bisa membuka unduhan milik siapa pun. |
| `Aktif` | `Ya` atau `Tidak`. Ubah ke `Tidak` untuk menonaktifkan tanpa menghapus. |
| `Batas harian` | Kosongkan untuk memakai batas bawaan (20 pertanyaan per hari) |
| `Password baru` | Lihat di bawah. Kolom ini selalu kosong setelah diproses. |
| `Hash`, `Garam` | Diisi otomatis dan disembunyikan. Jangan diubah. |
| `Terakhir masuk` | Diisi otomatis |

Ada dua cara memberi password:

- **Disarankan:** isi `Username` dan `Nama` untuk banyak pegawai sekaligus, blok barisnya, lalu **Tanya Data → Buat password acak untuk baris terpilih**. Jendela yang muncul berisi daftar username dan password. Salin dan bagikan ke masing-masing pegawai; daftar itu hanya tampil sekali.
- Ketik password di kolom `Password baru`. Begitu Enter, password diacak (hash) dan kolomnya dikosongkan. Kekurangannya, ketikan itu masih terlihat di **Riwayat versi** Sheets oleh siapa pun yang bisa mengedit Sheets ini.

Password tidak pernah disimpan apa adanya. Bila pegawai lupa, buat password baru dengan salah satu cara di atas. Setelah lima kali salah, akun dikunci 15 menit.

Bagikan Sheets ini hanya ke pengelola. Siapa pun yang bisa mengedit Sheets bisa mengganti password orang lain dan membaca Log.

## Kepegawaian (De-Bora)

Skrip yang sama menyajikan data untuk tab **Kepegawaian** di hub (halaman [`kepegawaian/`](../kepegawaian/index.html)). Sumbernya spreadsheet **DE-BORA** yang dikelola dan diperbarui sendiri oleh bagian Kepegawaian. Skrip hanya membaca spreadsheet itu, tidak pernah mengubahnya.

```
Spreadsheet DE-BORA (bagian Kepegawaian)
   │  dibaca oleh akun pemilik skrip (cukup akses Lihat)
   ▼
Apps Script ── olah: komposisi, formasi, kinerja, administrasi, pengingat tenggat, agenda
   │  disimpan sementara 10 menit, hanya dikirim ke pegawai yang sudah masuk
   ▼
Halaman kepegawaian/ dan panel ringkas di ubin Kepegawaian
```

### Menyambungkan (sekali saja)

1. 🔐 Pastikan akun Google pemilik skrip ini bisa membuka spreadsheet DE-BORA. Cara paling aman: bagian Kepegawaian membuka **Bagikan**, menambahkan email akun itu sebagai **Pelihat**, lalu mengubah **Akses umum** menjadi **Dibatasi**. DE-BORA berisi data pribadi (NIP, tanggal lahir, alamat asal), jadi sebaiknya tidak terbuka untuk "Siapa saja yang memiliki link".
2. Tempel isi `TanyaData.gs` terbaru dan terbitkan versi baru (lihat *Memperbarui skrip*).
3. 🔐 Di Sheets ini: **Tanya Data → Atur spreadsheet Kepegawaian (De-Bora)**, tempel link spreadsheet DE-BORA, lalu OK. Bila Google meminta izin, setujui. Jendela hasilnya menyebut nama spreadsheet, jumlah pegawai dan pengingat yang terbaca, serta tab yang gagal dibaca bila ada.
4. Buka ubin **Kepegawaian** di dashboard.

Link DE-BORA disimpan di Properti skrip `KEPEGAWAIAN_ID`, tidak di repo. Untuk melepas sambungan, jalankan menu yang sama dan kosongkan isiannya.

### Tab yang dibaca

Tab dikenali dari awal namanya, dan kolom dari judul atau isinya. Bagian Kepegawaian bebas menambah baris, menggeser kolom, atau membuat tab tahun baru (misalnya `KGB 2027`). Untuk tab bertahun, skrip memakai tahun berjalan, atau tahun terakhir sebelumnya bila tab tahun ini belum ada.

| Tab di DE-BORA | Menjadi |
|---|---|
| `Sheet1` / `Daftar Pegawai` | Komposisi PNS, CPNS, PPPK, jenis kelamin, jabatan, golongan, umur, masa kerja, diklat fungsional. Pengingat pensiun (2 tahun ke depan) dan ulang tahun (7 hari). |
| `Struktur Organisasi` | Sebaran pegawai per unit kerja |
| `Peta Jabatan <tahun>` | Formasi: pegawai yang ada dan kebutuhan per unit dan jabatan |
| `Jadwal …` | Agenda kenaikan pangkat, uji kompetensi, dan jadwal lain. Pengingat batas usulan. |
| `KGB <tahun>`, `Belum Upload Dok…` | KGB per bulan. Pengingat KGB 90 hari ke depan dan berkas KGB yang belum lengkap. |
| `PAK …`, `Upload PAK …` | Angka kredit cukup atau kurang untuk kenaikan pangkat dan jabatan, batas usulan, tenggat triwulan, unggahan SIMPEG |
| `SKP <tahun>` | SKP per triwulan: sudah OK dan sudah diunggah |
| `Kelengkapan Dokumen` | Kelengkapan dokumen per jenis |
| `Cuti <tahun>` | Cuti per bulan dan jenis, sisa cuti tahunan. Pengingat pegawai yang akan cuti. |
| `Pelatihan …` | Daftar pelatihan dan jumlah peserta |
| tab berisi `IPASN` | Rata-rata indeks profesionalitas per dimensi dan kategori |
| `Kendala Sikadir` | Laporan kendala presensi per bulan dan status |
| `Aplikasi …` / `Daftar Laman` | Tautan aplikasi, pengumuman, dan daftar peraturan |

Tanggal tanpa tahun, atau dari jadwal tahun lalu, digeser ke tahun berjalan dan ditandai *perkiraan*. Tab yang gagal dibaca dicatat di bagian *Catatan* halaman Kepegawaian; bagian lain tetap tampil.

### Yang sampai ke browser

- Angka olahan (jumlah, persentase, rata-rata), dan nama pegawai hanya untuk pengingat dan daftar tindak lanjut.
- **Tidak dikirim**: NIP, tanggal lahir, tempat asal, agama, dan nilai per orang (IPASN, angka kredit).
- Hanya pegawai yang sudah masuk yang menerima data. Link DE-BORA, tombol **Buka spreadsheet**, dan tombol **Muat ulang** hanya untuk akun `admin`.
- Untuk membuka halaman ini bagi admin saja, isi Properti skrip `KEPEGAWAIAN_UNTUK` = `admin`.

### Pembaruan

Hasil olahan disimpan sementara 10 menit (`SIMPAN_KEPEGAWAIAN_MENIT`), jadi perubahan di DE-BORA tampil paling lambat 10 menit kemudian. Admin bisa menekan **Muat ulang** di halaman Kepegawaian untuk membaca ulang saat itu juga. Bila pemanasan data otomatis aktif, data kepegawaian ikut dibaca ulang tiap 15 menit. **Tanya Data → Uji baca Kepegawaian** menunjukkan lama membaca dan ringkasan hasilnya.

## Batas harian dan biaya

- **Per pegawai**: 20 pertanyaan per hari (bisa diubah per akun di kolom `Batas harian`).
- **Seluruh kantor**: 600 pertanyaan per hari.

Hitungan direset tengah malam WITA. Setiap pertanyaan, jumlah token masuk/keluar, dan alat yang dipakai tercatat di lembar **Log**, jadi pemakaian bisa dipantau dan biaya diperkirakan.

Sebagai pengaman tambahan, pasang batas atau peringatan anggaran di tempat penagihan penyedia AI: **Google Cloud Console → Penagihan → Anggaran & notifikasi** untuk Gemini, atau **Claude Console → Settings → Limits** untuk Claude.

## Pengaturan lanjutan

Semua pengaturan punya nilai bawaan di bagian `BAWAAN` pada `TanyaData.gs`. Untuk mengubahnya tanpa menyunting kode, tambahkan **Properti skrip** dengan nama yang sama di **Setelan proyek → Properti skrip**:

| Properti | Bawaan | Keterangan |
|---|---|---|
| `PENYEDIA` | `gemini` | `gemini` atau `claude`. Bisa juga lewat menu **Pilih penyedia AI**. |
| `MODEL_GEMINI` | `gemini-3.8-flash` | Model Gemini |
| `MODEL_GEMINI_CADANGAN` | `gemini-flash-lite-latest` | Dipakai otomatis bila model utama sedang penuh. Kosongkan untuk mematikan. |
| `PIKIR_GEMINI` | `low` | Seberapa dalam Gemini 3 berpikir: `minimal`, `low`, `medium`, `high`. Makin tinggi makin teliti tetapi makin lambat. |
| `MODEL_CLAUDE` | `claude-haiku-5-5` | Model Claude. Haiku cepat dan murah; `claude-sonnet-5-5` atau `claude-opus-5-5` lebih teliti tetapi lebih lambat dan mahal. |
| `UPAYA_CLAUDE` | `low` | Seberapa dalam Claude berpikir: `low`, `medium`, `high` |
| `BATAS_HARIAN_TOTAL` | `600` | Pertanyaan per hari untuk seluruh kantor |
| `BATAS_HARIAN_ORANG` | `20` | Pertanyaan per hari per pegawai |
| `LAMA_SESI_JAM` | `6` | Lama login sebelum harus masuk lagi (maksimal 6) |
| `SIMPAN_CACHE_MENIT` | `30` | Lama data sumber disimpan sementara sebelum dibaca ulang |
| `BATAS_DETIK` | `150` | Setelah sekian detik, AI berhenti membaca data dan langsung menjawab dengan yang sudah ada |
| `GITHUB_TOKEN` | kosong | Diperlukan bila repo data dijadikan privat (lihat di bawah) |
| `KEPEGAWAIAN_ID` | kosong | ID spreadsheet DE-BORA. Diisi lewat menu **Atur spreadsheet Kepegawaian (De-Bora)**. |
| `KEPEGAWAIAN_UNTUK` | `semua` | `semua` pegawai yang sudah masuk, atau `admin` saja |
| `SIMPAN_KEPEGAWAIAN_MENIT` | `10` | Lama hasil olahan Kepegawaian disimpan sebelum DE-BORA dibaca ulang |

Kunci API tersimpan di properti `GEMINI_API_KEY` atau `ANTHROPIC_API_KEY`. Jangan menulis kunci di kode atau di repo.

## Bila jawaban lambat

Jalankan **Tanya Data → Uji kecepatan**. Jendela hasilnya menunjukkan lama membaca setiap dataset dari sumbernya dan lama satu pertanyaan uji ke AI. Kolom **Durasi (detik)** di lembar Log mencatat lama setiap pertanyaan pegawai.

- Membaca data lama (misalnya SMART lebih dari 20 detik): pastikan pemanasan data otomatis aktif.
- AI lama: turunkan `PIKIR_GEMINI` ke `minimal`, pakai `gemini-flash-lite-latest` sebagai `MODEL_GEMINI`, atau beralih ke Claude Haiku (cukup tempel kunci Claude lewat **Atur kunci API**).

## Bila muncul "Layanan AI sedang penuh"

Server Gemini kadang menolak permintaan saat sedang ramai (HTTP 503), terutama untuk model yang baru rilis dan di tier gratis. Skrip mencoba ulang dua kali (jeda 2 dan 6 detik), lalu mengulang pertanyaan dengan `MODEL_GEMINI_CADANGAN`. Bila keduanya tetap penuh, pegawai melihat pesan "Layanan AI sedang penuh" dan jatah pertanyaannya tidak berkurang. Bila sering terjadi, aktifkan penagihan (tier berbayar) atau ganti `MODEL_GEMINI` ke model yang lebih stabil.

## Memperbarui skrip

Setelah mengganti isi `TanyaData.gs`, terbitkan versi baru tanpa mengganti URL: **Terapkan → Kelola deployment → ikon pensil → Versi: Versi baru → Terapkan**. Jangan memilih *Deployment baru*, karena itu membuat URL baru dan `TANYA_DATA` harus diganti.

## Bila repo dijadikan privat

Skrip membaca data dari alamat GitHub Pages tiap repo. Bila repo privat dan Pages-nya mati, skrip bisa membaca langsung dari GitHub:

1. Di GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Repository access: pilih `Satu-Data-Tambora`, `Dashboard_SMART_TNGunungTambora`, `RBM_TNGunungTambora`, `Simulasi-API-Tambora`, dan `Flight_SMART`.
   - Permissions → Repository permissions → **Contents: Read-only**. Tidak perlu izin lain.
2. Simpan token itu sebagai properti skrip `GITHUB_TOKEN`.

Data SMART dari Google Sheets dan rekap RBM dari Apps Script RBM tetap dibaca dari link masing-masing, jadi keduanya tidak terpengaruh.

## Menambah dataset

Dataset didaftarkan di objek `KATALOG` dalam `TanyaData.gs`. Setiap entri berisi:

- `judul` dan `ket`: nama dan penjelasan kolom. AI memakai teks ini untuk memilih dataset, jadi tulis sejelas mungkin.
- `jenis`: `tabel` (baris yang bisa disaring dan dihitung) atau `ringkasan` (satu objek JSON yang dibaca utuh).
- `muat`: fungsi yang mengembalikan data. Untuk `tabel`, larik objek dengan kunci kolom yang sama di setiap baris.
- `tema`: id tema hub (`smart`, `rbm`, `karhut`, `resor`, dan seterusnya) untuk tombol Buka.
- `geo: true` bila baris punya kolom `x` (bujur) dan `y` (lintang), agar bisa diunduh sebagai GeoJSON. Untuk `ringkasan`, `peta` berisi alamat file GeoJSON yang diunduh utuh.

Tambahkan alamat sumbernya di `SUMBER`, bungkus pembacaan dengan `denganCache_` agar tidak dibaca ulang di setiap pertanyaan, lalu terbitkan versi baru.

## Keamanan dan privasi

- Kunci API hanya ada di Properti skrip. Browser tidak pernah melihatnya.
- Hanya pegawai yang masuk yang bisa bertanya dan mengunduh. Token sesi kedaluwarsa setelah 6 jam dan hilang saat pegawai menekan Keluar.
- Pertanyaan dan data yang dibaca alat dikirim ke penyedia AI (Google atau Anthropic) untuk diproses. Gunakan tier berbayar agar data tidak dipakai untuk melatih model.
- Bot tidak menuliskan koordinat persis satwa dilindungi di teks jawaban. Unduhan data SMART tetap berisi koordinat lengkap untuk pegawai yang masuk.
- Isi data diperlakukan sebagai data. Teks di catatan patroli yang berbunyi seperti perintah tidak dijalankan.
- Lembar Log menyimpan setiap pertanyaan beserta username-nya, alat yang dipakai, jumlah token, dan lamanya.
- Data Kepegawaian tidak masuk ke AI dan tidak ada di repo. Browser hanya menerima angka olahan dan nama untuk pengingat (lihat *Kepegawaian (De-Bora)*).
