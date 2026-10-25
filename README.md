# Satu Data Tambora

Dashboard Perlindungan dan Pengamanan Taman Nasional Tambora: satu pintu untuk data kawasan dan semua aplikasi kerja Balai yang dibangun di GitHub. Kerangkanya meneruskan Google Site lama ([sites.google.com/view/dashboardtntambora](https://sites.google.com/view/dashboardtntambora)).

Alamat: **https://kopluck8.github.io/Satu-Data-Tambora/**

Situs statis (HTML + JavaScript, tanpa server dan tanpa proses build). Cukup ubah file di folder `data/` lalu simpan (commit); GitHub Pages memperbarui situs dalam 1–2 menit.

## Menu

| Menu | Isi | Aplikasi |
|---|---|---|
| Informasi Kawasan | Sejarah & nilai penting, fisiografi, keanekaragaman hayati, ancaman, aksesibilitas, desa binaan, pelayanan publik | |
| SMART Patrol | Ringkasan, tabulasi, grafik per kategori, peta temuan, kerawanan aktif, LPK & RPK | `Dashboard_SMART_TNGunungTambora`, `SMART_Report_generator` |
| Resort Based Management | Capaian RBM, beban kerja, profil 6 resor | `RBM_TNGunungTambora` |
| Kebakaran Hutan | Hotspot, peta areal terbakar, peta kerawanan, rekap, simulasi, FlamMap | `Karhut_TN_Tambora`, `Simulasi-API-Tambora`, `ModelAPI` |
| Laporan Kejadian | Rekap LK | |
| Polisi Kehutanan | Tentang Polhut, profil Polhut TN Tambora | |
| Manajemen & Evaluasi | | `Dasboard_BMN_BTNT` |

## Menambah repo/aplikasi baru

1. Pastikan repo baru sudah punya GitHub Pages (Settings → Pages).
2. Buka [`data/aplikasi.js`](data/aplikasi.js), salin satu blok `{ ... }`, lalu ubah isinya:

```js
{
  id: "patroli-gabungan",                 // kode unik, huruf kecil
  nama: "Dashboard Patroli Gabungan",
  ringkas: "Satu kalimat tentang fungsi aplikasi.",
  kelompok: "smart",                      // kawasan | smart | rbm | karhut | kejadian | polhut | manajemen
  repo: "Nama_Repo_Baru",
  url: "https://kopluck8.github.io/Nama_Repo_Baru/",
  status: "uji coba",                     // aktif | uji coba | pengembangan
  pengguna: "Polhut",
  fitur: ["Fitur 1", "Fitur 2"],
  sematkan: true
},
```

3. Simpan. Aplikasi otomatis muncul di menu sesuai `kelompok`, di **Katalog Aplikasi**, dan di pencarian.

Kalau aplikasi juga perlu halaman sendiri di menu (misalnya ditampilkan langsung di dalam dashboard), tambahkan di [`data/menu.js`](data/menu.js):

```js
{ id: "patroli-gabungan", judul: "Patroli Gabungan", blok: [
  { jenis: "sematan", judul: "Patroli gabungan", app: "patroli-gabungan", path: "", tinggi: 1000 }
] }
```

## Menambah menu atau isi halaman

Semua menu dan isi halaman ada di [`data/menu.js`](data/menu.js). Setiap halaman tersusun dari blok:

| Blok | Kegunaan |
|---|---|
| `teks` | Paragraf |
| `poin` | Daftar berpoin |
| `sematan` | Menampilkan halaman lain (aplikasi, Google My Maps, grafik Google Sheets) di dalam dashboard |
| `tautan` | Kartu tautan ke Sheets, Slides, Drive |
| `gambar` | Gambar (simpan file di `assets/img/`) |
| `aplikasi` | Kartu aplikasi tertentu dari `data/aplikasi.js` |
| `catatan` | Kotak keterangan, misalnya "dalam pengembangan" |

Menu baru: tambahkan satu objek `{ id, judul, ikon, ringkas, halaman: [...] }` ke `window.MENU`. Ikon yang tersedia: `gunung`, `patroli`, `resor`, `api`, `laporan`, `perisai`, `evaluasi`.

## Struktur

```
index.html          kerangka halaman
assets/app.js       router dan penyusun halaman (biasanya tidak perlu diubah)
assets/style.css    tampilan (mode terang & gelap)
assets/img/         logo
data/aplikasi.js    DAFTAR APLIKASI: tambah repo baru di sini
data/menu.js        MENU & ISI HALAMAN
```

## Catatan pemindahan dari Google Site

- Grafik Google Sheets, peta Google My Maps, dan tautan Sheets/Slides/Drive dipakai langsung dari sumber aslinya, jadi tetap terbarui otomatis.
- Gambar yang diunggah langsung ke Google Site (ilustrasi gangguan, peta ABKT, peta aksesibilitas, peta densitas wisata, dll.) belum dipindahkan. Unduh dari Google Site, simpan ke `assets/img/`, lalu tambahkan blok `gambar`.
- Profil enam resor belum berisi teks di Google Site lama; tempatnya sudah disiapkan.
- Halaman Kebakaran Hutan → Grafik di Google Site masih kosong, jadi tidak dipindahkan.

## Pemasangan GitHub Pages

Settings → Pages → Source: **Deploy from a branch**, Branch: `main`, folder `/ (root)`.
