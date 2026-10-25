/*
 * DAFTAR APLIKASI (registry)
 * ---------------------------------------------------------------------------
 * Setiap repo/aplikasi GitHub cukup didaftarkan SATU KALI di sini.
 * Aplikasi otomatis muncul di:
 *   - halaman menu sesuai "kelompok" (lihat id menu di data/menu.js),
 *   - halaman "Katalog Aplikasi",
 *   - pencarian.
 *
 * Cara menambah repo baru: salin satu blok { ... } di bawah, ubah isinya,
 * lalu simpan (commit). Tidak ada langkah lain.
 *
 * Kolom:
 *   id        : kode unik, huruf kecil tanpa spasi (dipakai di data/menu.js)
 *   nama      : nama yang tampil
 *   ringkas   : satu kalimat penjelasan
 *   kelompok  : id menu tempat aplikasi tampil: "kawasan", "smart", "rbm",
 *               "karhut", "kejadian", "polhut", "manajemen"
 *   repo      : nama repo di github.com/kopluck8
 *   url       : alamat GitHub Pages (diakhiri "/")
 *   status    : "aktif", "uji coba", atau "pengembangan"
 *   pengguna  : siapa pemakai utamanya
 *   fitur     : daftar singkat kemampuan
 *   halaman   : (opsional) halaman penting di dalam aplikasi { label, path }
 *   sematkan  : true bila aplikasi enak ditampilkan langsung di dalam dashboard
 */
window.APLIKASI = [
  {
    id: "smart-dashboard",
    nama: "Dashboard Data SMART Patrol",
    ringkas: "Statistik, grafik, peta, dan tabel temuan patroli SMART per kategori, SPTN, dan resor.",
    kelompok: "smart",
    repo: "Dashboard_SMART_TNGunungTambora",
    url: "https://kopluck8.github.io/Dashboard_SMART_TNGunungTambora/",
    status: "aktif",
    pengguna: "Pimpinan, Polhut, pengolah data SMART",
    fitur: ["Overview kawasan", "Grafik per kategori temuan", "Peta sebaran", "Rekap per SPTN dan resor"],
    halaman: [
      { label: "Overview kawasan", path: "index.html" },
      { label: "Tumbuhan", path: "tumbuhan.html" },
      { label: "Satwa liar", path: "satwa-liar.html" },
      { label: "Aktivitas manusia", path: "aktivitas-manusia.html" },
      { label: "Ground check", path: "ground-check.html" },
      { label: "Fitur", path: "fitur.html" },
      { label: "Spesies invasif", path: "spesies-invasif.html" },
      { label: "Pengelolaan", path: "pengelolaan.html" },
      { label: "Penyuluhan & pemberdayaan", path: "penyuluhan.html" },
      { label: "Jalur pendakian & ODTWA", path: "jalur-pendakian.html" }
    ],
    sematkan: true
  },
  {
    id: "smart-laporan",
    nama: "Generator LPK & RPK SMART Patrol",
    ringkas: "Mengubah ekspor SMART Desktop menjadi Laporan Pelaksanaan Kegiatan (LPK) dan menyusun RPK.",
    kelompok: "smart",
    repo: "SMART_Report_generator",
    url: "https://kopluck8.github.io/SMART_Report_generator/",
    status: "aktif",
    pengguna: "Ketua tim patroli, admin SMART",
    fitur: ["LPK format Balai", "RPK dari isian form", "Peta otomatis", "Ekspor PDF dan Word"],
    sematkan: false
  },
  {
    id: "rbm",
    nama: "Form & Dashboard Capaian RBM",
    ringkas: "Petugas resor melapor lewat form, verifikator memeriksa, dashboard menampilkan capaian terhadap rencana.",
    kelompok: "rbm",
    repo: "RBM_TNGunungTambora",
    url: "https://kopluck8.github.io/RBM_TNGunungTambora/",
    status: "aktif",
    pengguna: "Petugas resor, verifikator, pimpinan",
    fitur: ["Form laporan tanpa akun", "Dashboard capaian 6 resor", "Unduh PDF laporan bulanan"],
    halaman: [
      { label: "Dashboard capaian", path: "dashboard/" },
      { label: "Form laporan", path: "form/" },
      { label: "Laporan bulanan", path: "laporan/" }
    ],
    sematkan: true
  },
  {
    id: "karhut-webgis",
    nama: "WebGIS Hotspot Resor",
    ringkas: "Peta hotspot kebakaran hutan per resor di wilayah kerja TN Tambora.",
    kelompok: "karhut",
    repo: "Karhut_TN_Tambora",
    url: "https://kopluck8.github.io/Karhut_TN_Tambora/",
    status: "aktif",
    pengguna: "Tim Karhut, Polhut, resor",
    fitur: ["Peta hotspot", "Batas resor, jalur, grid"],
    sematkan: true
  },
  {
    id: "simulasi-api",
    nama: "Simulasi API Tambora",
    ringkas: "Simulasi rambatan api di savana (pendamping FlamMap/FARSITE) dengan cuaca dan landscape otomatis.",
    kelompok: "karhut",
    repo: "Simulasi-API-Tambora",
    url: "https://kopluck8.github.io/Simulasi-API-Tambora/",
    status: "uji coba",
    pengguna: "Tim Karhut, analis GIS",
    fitur: ["Simulasi rambatan api", "Pembuat cuaca .wxs", "Landscape Sentinel-2 otomatis"],
    halaman: [
      { label: "Dashboard", path: "index.html" },
      { label: "Simulasi", path: "simulasi.html" },
      { label: "Pembuat WXS", path: "pembuat_wxs.html" }
    ],
    sematkan: true
  },
  {
    id: "flammap-workpage",
    nama: "Work Page FlamMap Tambora",
    ringkas: "Progres pemodelan arah rambatan api: tugas, input plot lapangan, rekap strata, dan fuel model.",
    kelompok: "karhut",
    repo: "ModelAPI",
    url: "https://kopluck8.github.io/ModelAPI/",
    status: "uji coba",
    pengguna: "Tim pemodelan api",
    fitur: ["Peta & input plot", "Progres tugas", "Unduh .fmd dan .fms"],
    sematkan: true
  },
  {
    id: "bmn",
    nama: "Dashboard Aset BMN",
    ringkas: "Membaca file Daftar Aset BMN (.xlsx) langsung di browser: ringkasan, temuan, dan tindak lanjut.",
    kelompok: "manajemen",
    repo: "Dasboard_BMN_BTNT",
    url: "https://kopluck8.github.io/Dasboard_BMN_BTNT/",
    status: "aktif",
    pengguna: "Pimpinan, pengelola BMN",
    fitur: ["Data tidak keluar dari browser", "Kandidat penghapusan", "Kendaraan & umur aset"],
    sematkan: false
  }
];
