/*
 * MENU & ISI HALAMAN
 * ---------------------------------------------------------------------------
 * Kerangka mengikuti Google Site lama (sites.google.com/view/dashboardtntambora).
 * Setiap menu punya beberapa halaman, dan setiap halaman tersusun dari "blok".
 *
 * Jenis blok:
 *   { jenis: "teks",    judul, isi }                  isi = paragraf (boleh HTML sederhana)
 *   { jenis: "poin",    judul, daftar: ["...", ...] } daftar berpoin
 *   { jenis: "sematan", judul, url, tinggi }         tampilkan halaman lain di dalam dashboard
 *   { jenis: "sematan", judul, app, path, tinggi }   sama, tapi alamat diambil dari data/aplikasi.js
 *   { jenis: "tautan",  judul, daftar: [{ label, url, tipe }] }
 *                       tipe: "sheet", "slides", "drive", "peta", "web"
 *   { jenis: "gambar",  judul, src, keterangan }
 *   { jenis: "aplikasi", ids: ["id-aplikasi", ...] } kartu aplikasi tertentu
 *   { jenis: "catatan", isi }                        kotak keterangan
 *
 * Aplikasi di data/aplikasi.js otomatis tampil di halaman depan menu sesuai "kelompok",
 * jadi tidak perlu ditulis ulang di sini.
 */
(function () {
  var GS = "https://sites.google.com/view/dashboardtntambora/";
  var SHEET = "https://docs.google.com/spreadsheets/d/";
  var CHART_RBM = "https://docs.google.com/spreadsheets/d/e/2CAIWO3emAV1x3glDUfwxF17DdMTFQ3Ir6qmjgL00uSfi205SDI1PS6XoWdV2LVBmWB5XiQoFZzOv80BSqRQ/gviz/chartiframe?autosize=true&oid=";
  var CHART_WISATA = "https://docs.google.com/spreadsheets/d/e/2CAIWO3em26JSDdJwPkxsRlMO-XcUw4VyLnQ_KVhzOLG4ai4Hw2XL8XD9DdX8YuSpFJu-ZjmAzbJrs1C1OYQ/gviz/chartiframe?autosize=true&oid=";
  var MYMAPS = "https://www.google.com/maps/d/embed?mid=";

  function smart(judul, path) {
    return { jenis: "sematan", judul: judul, app: "smart-dashboard", path: path + "?embed=1", tinggi: 1400 };
  }
  function resor(nama, chartOid) {
    var blok = [
      { jenis: "catatan", isi: "Profil Resor " + nama + " (luas, alamat kantor, wilayah administrasi, potensi, ancaman) belum diisi. Tambahkan di data/menu.js, fungsi resor()." }
    ];
    if (chartOid) blok.push({ jenis: "sematan", judul: "Beban kerja Resor " + nama, url: CHART_RBM + chartOid, tinggi: 420 });
    blok.push({ jenis: "sematan", judul: "Capaian RBM", app: "rbm", path: "dashboard/", tinggi: 1200 });
    return blok;
  }

  window.SITUS = {
    judul: "Dashboard Perlindungan dan Pengamanan",
    subjudul: "Taman Nasional Tambora",
    pengelola: "Dikelola oleh Pokja Urusan Advokasi Hukum, Bahan Pemanfaatan, Pelayanan, Perlindungan, Pengamanan dan Pengawetan, Balai Taman Nasional Tambora",
    tahun: 2026,
    githubUser: "kopluck8",
    siteLama: GS + "dashboard"
  };

  window.MENU = [
    {
      id: "kawasan",
      judul: "Informasi Kawasan",
      ikon: "gunung",
      ringkas: "Data dasar kawasan: dokumen penetapan, zonasi, rencana pengelolaan, peta tematik, dan pustaka data.",
      pengantar: "Penamaan kawasan mengikuti Keputusan Dirjen KSDAE No. 138 Tahun 2025 tentang nomor register kawasan konservasi tahun 2025.",
      halaman: [
        { id: "sejarah", judul: "Sejarah & Nilai Penting", blok: [
          { jenis: "tautan", judul: "Dokumen dasar", daftar: [
            { label: "Sejarah Kawasan (presentasi)", url: "https://docs.google.com/presentation/d/1dMAojMH3mYI1xGQ7XJYUghzzV1H9KzbWDHc9oKnlSt0/present", tipe: "slides" },
            { label: "SK Dirjen KSDAE No. 138/2025 (nomor register)", url: "https://drive.google.com/file/d/1ZlCfyWf7CsY2PKB4PnQwUDqA5Q--oii5/view?usp=sharing", tipe: "drive" },
            { label: "Pustaka data kawasan (folder Drive)", url: "https://drive.google.com/drive/folders/1ZmpztD8BdgLzmGVOKWTois-_74JTYmE8?usp=drive_link", tipe: "drive" }
          ] },
          { jenis: "poin", judul: "Nilai penting dan mandat kawasan", daftar: [
            "Rujukan: Rencana Konservasi Nasional 1982 (Vol. 7 Nusa Tenggara, pembaruan 1995), kajian teknis BKSDA NTB, laporan pendukung instansi provinsi, dokumen pra-taman nasional, dan laporan pengelolaan.",
            "Daerah tangkapan air",
            "Fitur geologi unik",
            "Wisata berkelanjutan: pendakian dan geowisata",
            "Satwa kunci: Elang Flores dan Rusa Timor"
          ] }
        ] },
        { id: "fisiografi", judul: "Fisiografi Kawasan", blok: [
          { jenis: "poin", judul: "Geomorfologi kawasan", daftar: [
            "Sejak letusan tahun 1815, kondisi fisik kawasan dan ekosistemnya terus berubah dan berkembang hingga kini.",
            "Gunung Tambora dikenal sebagai salah satu kaldera terdalam di dunia yang terbentuk dari satu kejadian letusan.",
            "Kedalaman vertikal kaldera sekitar 1.100 sampai 1.250 meter (pemetaan PVMBG).",
            "Gunung api purba Tambora, diperkirakan setinggi 4.000 sampai 4.300 mdpl, runtuh ke dapur magma yang kosong setelah memuntahkan sekitar 150 km³ material vulkanik dalam hitungan hari."
          ] },
          { jenis: "tautan", judul: "Presentasi", daftar: [
            { label: "Kondisi Fisik Kawasan", url: "https://docs.google.com/presentation/d/1cbdvAvSIiXViCcLJTarK0AdAgw2oeux728IyLzdX2X8/present", tipe: "slides" },
            { label: "Geogenesis Gunung Tambora", url: "https://docs.google.com/presentation/d/1cQkQEU9sCjMPtNgu82hV_oAa1HhQlkhv47-YsVZsIPs/present", tipe: "slides" },
            { label: "Peta Geomorfologi Kawasan", url: "https://docs.google.com/presentation/d/1doeg08LdjkoSmUTRhUdggSgSo6014w6jRe9E0OfP1fo/present", tipe: "slides" }
          ] }
        ] },
        { id: "keanekaragaman-hayati", judul: "Keanekaragaman Hayati", blok: [
          { jenis: "teks", judul: "Satwa liar dan tumbuhan", isi: "Jenis satwa liar (aves, mamalia, reptilia, insecta) dan tumbuhan (famili dan jenis) di kawasan TN Tambora, beserta peta Areal Bernilai Konservasi Tinggi (ABKT) yang disusun dari distribusi keanekaragaman hayati." },
          { jenis: "tautan", judul: "Data dan peta", daftar: [
            { label: "Rincian daftar jenis terverifikasi", url: SHEET + "1g31M2KhRn0MeJ6skbQ69bUQue6qqqF7BPDfwI7LOuKM/edit?usp=sharing", tipe: "sheet" },
            { label: "Rincian sebaran per jenis (insecta)", url: SHEET + "1zF6lLubW2I2HJbHNxqhksAO-3EsmSumNAy6gPJCJn5Y/edit?usp=sharing", tipe: "sheet" },
            { label: "Distribusi habitat satwa liar", url: "https://docs.google.com/presentation/d/1e_tEflWde51eCdi9MQPxABDquUlvfnxlGYS4LwfgTJk/present", tipe: "slides" },
            { label: "Distribusi tumbuhan", url: "https://docs.google.com/presentation/d/1QW7CkPYxAhe1WH8MABLuK4KsAoe-3AgxQiWERzl4dE0/present", tipe: "slides" }
          ] },
          { jenis: "aplikasi", ids: ["smart-dashboard"] }
        ] },
        { id: "ancaman", judul: "Ancaman dan Gangguan", blok: [
          { jenis: "poin", judul: "Gangguan utama di kawasan", daftar: ["Kebakaran hutan", "Penebangan liar", "Perambahan kawasan", "Perburuan satwa"] },
          { jenis: "sematan", judul: "Grafik temuan gangguan kawasan", url: "https://docs.google.com/spreadsheets/d/e/2CAIWO3em_JBP-A0i1W6YQObvXgLB2INRQpm0Jsz0l57-MtjVqcog1jXHfPuH6IyRKztWAREZxRCQwPScb2Q/gviz/chartiframe?autosize=true&oid=860122238", tinggi: 420 },
          { jenis: "sematan", judul: "Peta sebaran gangguan kawasan 2020–2026", url: MYMAPS + "1Z_mO4yPMvjnjEm4BOaqZl-2H2GTKYis", tinggi: 560 }
        ] },
        { id: "aksesibilitas", judul: "Aksesibilitas", blok: [
          { jenis: "sematan", judul: "Aksesibilitas ke dalam kawasan", url: MYMAPS + "1TzuDicUDgnkB1cy1VjPuoYjQxUvj4rA", tinggi: 560 }
        ] },
        { id: "desa-binaan", judul: "Desa Binaan", blok: [
          { jenis: "sematan", judul: "Peta kompleksitas: desa binaan", url: MYMAPS + "1QpvKZnaRnsVIzZ3g_YUobbG9jCkICPg", tinggi: 560 }
        ] },
        { id: "pelayanan-publik", judul: "Pelayanan Publik", blok: [
          { jenis: "teks", judul: "Kunjungan wisata", isi: "Rekap pengunjung wisatawan nusantara dan mancanegara, kunjungan per lokasi, dan asal wisatawan pendakian." },
          { jenis: "sematan", judul: "Jumlah pengunjung: wisatawan nusantara", url: CHART_WISATA + "1763812454", tinggi: 400 },
          { jenis: "sematan", judul: "Jumlah pengunjung: wisatawan mancanegara", url: CHART_WISATA + "1960609530", tinggi: 400 },
          { jenis: "sematan", judul: "Oi Marai", url: CHART_WISATA + "2118360008", tinggi: 400 },
          { jenis: "sematan", judul: "Sanctuary Rusa Timor", url: CHART_WISATA + "999855916", tinggi: 400 },
          { jenis: "sematan", judul: "Rata-rata pengunjung 2023–2025", url: CHART_WISATA + "745623019", tinggi: 400 },
          { jenis: "sematan", judul: "Asal wisatawan nusantara (pendakian), semua", url: CHART_WISATA + "1774462162", tinggi: 400 },
          { jenis: "sematan", judul: "Asal wisatawan nusantara (pendakian), luar NTB", url: CHART_WISATA + "462221941", tinggi: 400 },
          { jenis: "sematan", judul: "Asal wisatawan mancanegara (pendakian)", url: CHART_WISATA + "437062767", tinggi: 400 },
          { jenis: "tautan", judul: "Data", daftar: [
            { label: "Rekap Data Kunjungan Wisata TN Tambora", url: SHEET + "1EqteU7YyVOZeuMxgtCksg5EgNqoQbRukg4sUGJQgmPs/edit?usp=sharing", tipe: "sheet" }
          ] }
        ] }
      ]
    },
    {
      id: "smart",
      judul: "SMART Patrol",
      ikon: "patroli",
      ringkas: "Patroli berbasis Spatial Monitoring and Reporting Tool: potensi kawasan dan risiko gangguan dipantau dengan data spasial agar keputusan tepat sasaran.",
      halaman: [
        { id: "ringkasan", judul: "Ringkasan", blok: [ smart("Overview kawasan", "index.html") ] },
        { id: "tabulasi", judul: "Tabulasi", blok: [
          { jenis: "teks", judul: "Tabel informasi temuan", isi: "Rekap seluruh temuan SMART Patrol tahun 2026 dalam bentuk spreadsheet." },
          { jenis: "tautan", judul: "Data", daftar: [
            { label: "Rekap_SMART_2026", url: "https://drive.google.com/open?id=1VfP1gZb7Ah9Lt0iNAjVvUGbjVN19aZ2b-7XXfjnUNK8", tipe: "sheet" }
          ] }
        ] },
        { id: "tumbuhan", judul: "Grafik: Tumbuhan", blok: [ smart("Tumbuhan", "tumbuhan.html") ] },
        { id: "satwa-liar", judul: "Grafik: Satwa Liar", blok: [ smart("Satwa liar", "satwa-liar.html") ] },
        { id: "aktivitas-manusia", judul: "Grafik: Aktivitas Manusia", blok: [ smart("Aktivitas manusia", "aktivitas-manusia.html") ] },
        { id: "ground-check", judul: "Grafik: Ground Check Tipek/Tuplah", blok: [ smart("Ground check", "ground-check.html") ] },
        { id: "fitur", judul: "Grafik: Fitur", blok: [ smart("Fitur", "fitur.html") ] },
        { id: "spesies-invasif", judul: "Grafik: Spesies Invasif", blok: [ smart("Spesies invasif", "spesies-invasif.html") ] },
        { id: "pengelolaan", judul: "Grafik: Pengelolaan", blok: [ smart("Pengelolaan", "pengelolaan.html") ] },
        { id: "penyuluhan", judul: "Grafik: Penyuluhan", blok: [ smart("Penyuluhan dan pemberdayaan masyarakat", "penyuluhan.html") ] },
        { id: "jalur-pendakian", judul: "Grafik: Jalur Pendakian", blok: [ smart("Penjagaan jalur pendakian dan ODTWA", "jalur-pendakian.html") ] },
        { id: "peta", judul: "Peta Temuan", blok: [
          { jenis: "sematan", judul: "Peta temuan SMART Patrol TN Tambora", url: MYMAPS + "1zzggN4lmKULtMFTWs6ofxUdfCKZDaFg", tinggi: 640 }
        ] },
        { id: "kerawanan-aktif", judul: "Kerawanan Aktif", blok: [
          { jenis: "catatan", isi: "Halaman ini dalam tahap pengembangan. Nantinya berisi peta lokasi kerawanan aktif yang perlu diawasi rutin dan memerlukan tindak lanjut penyelesaian." }
        ] },
        { id: "laporan", judul: "Laporan LPK & RPK", blok: [ { jenis: "aplikasi", ids: ["smart-laporan"] } ] }
      ]
    },
    {
      id: "rbm",
      judul: "Resort Based Management",
      ikon: "resor",
      ringkas: "Capaian kegiatan RBM 2026 dibandingkan rencana awal tahun, beban kerja, dan profil enam resor.",
      halaman: [
        { id: "capaian", judul: "Capaian RBM 2026", blok: [
          { jenis: "sematan", judul: "Dashboard capaian RBM", app: "rbm", path: "dashboard/", tinggi: 1200 }
        ] },
        { id: "beban-kerja", judul: "Beban Kerja", blok: [
          { jenis: "sematan", judul: "Beban kerja TN Tambora", url: CHART_RBM + "930395445", tinggi: 460 }
        ] },
        { id: "piong", judul: "Resor Piong", blok: resor("Piong", "915370174") },
        { id: "oi-katupa", judul: "Resor Oi Katupa", blok: resor("Oi Katupa") },
        { id: "kawinda-toi", judul: "Resor Kawinda Toi", blok: resor("Kawinda Toi") },
        { id: "doroncanga", judul: "Resor Doroncanga", blok: resor("Doroncanga") },
        { id: "doropeti", judul: "Resor Doropeti", blok: resor("Doropeti") },
        { id: "pancasila", judul: "Resor Pancasila", blok: resor("Pancasila") }
      ]
    },
    {
      id: "karhut",
      judul: "Kebakaran Hutan",
      ikon: "api",
      ringkas: "Informasi hotspot, peta kerawanan dan areal terbakar, rekap kejadian, serta pemodelan rambatan api.",
      halaman: [
        { id: "hotspot", judul: "Hotspot per Resor", blok: [
          { jenis: "sematan", judul: "WebGIS hotspot resor", app: "karhut-webgis", path: "", tinggi: 720 }
        ] },
        { id: "peta-sebaran", judul: "Peta Areal Terbakar", blok: [
          { jenis: "sematan", judul: "Sebaran burn area", url: MYMAPS + "1mOK7vlcmfg8DN8Wr0OhR3Q_VK4ajzY4", tinggi: 640 }
        ] },
        { id: "peta-kerawanan", judul: "Peta Kerawanan", blok: [
          { jenis: "teks", judul: "Kerawanan kebakaran hutan di wilayah kerja TN Tambora", isi: "Peta disusun dengan analisis kernel density dari koordinat hotspot situs SiPongi. Warna merah menunjukkan lokasi dengan kejadian kebakaran yang intens dan berulang setiap tahun. Warna hijau menunjukkan kejadian yang jarang, yang bisa berasal dari bias hotspot atau rambatan api dari lokasi yang lebih rawan." },
          { jenis: "sematan", judul: "Peta kerawanan kebakaran hutan", url: MYMAPS + "1ivtMxwFx5T4t6S699NZ_Y1pSn-TJd4Q", tinggi: 640 }
        ] },
        { id: "rekap", judul: "Rekap Data Karhut", blok: [
          { jenis: "tautan", judul: "Data", daftar: [
            { label: "Rekap Kejadian Kebakaran Hutan", url: "https://drive.google.com/open?id=1J0Ys2ccDlIkI8PgLmeTgkfBcpHWz8bWX77mBEXyCCr4", tipe: "sheet" }
          ] }
        ] },
        { id: "simulasi", judul: "Simulasi Rambatan Api", blok: [
          { jenis: "sematan", judul: "Simulasi API Tambora", app: "simulasi-api", path: "", tinggi: 1000 }
        ] },
        { id: "flammap", judul: "Work Page FlamMap", blok: [
          { jenis: "sematan", judul: "Work page FlamMap", app: "flammap-workpage", path: "", tinggi: 1000 }
        ] }
      ]
    },
    {
      id: "kejadian",
      judul: "Laporan Kejadian",
      ikon: "laporan",
      ringkas: "Rekap laporan kejadian (LK) tahun berjalan.",
      halaman: [
        { id: "rekap-lk", judul: "Rekap LK 2026", blok: [
          { jenis: "tautan", judul: "Data", daftar: [
            { label: "Rekap LK Tahun 2026", url: "https://drive.google.com/open?id=18qc30ZrKAgXeiqRzeqXh2Vqqhscq1kqVKEL_6mBA6Wc", tipe: "sheet" }
          ] }
        ] }
      ]
    },
    {
      id: "polhut",
      judul: "Polisi Kehutanan",
      ikon: "perisai",
      ringkas: "Tentang jabatan fungsional Polisi Kehutanan dan profil Polhut TN Tambora.",
      halaman: [
        { id: "tentang", judul: "Tentang Polhut", blok: [
          { jenis: "teks", judul: "Polisi Kehutanan", isi: "Menurut Permenpan RB Nomor 21 Tahun 2019, Polisi Kehutanan adalah PNS dalam lingkup instansi kehutanan pusat dan/atau daerah yang diberi tugas melaksanakan perlindungan hutan serta diberi wewenang kepolisian khusus di bidang kehutanan dan konservasi sumber daya alam hayati dan ekosistemnya sesuai peraturan perundang-undangan." }
        ] },
        { id: "profil", judul: "Profil Polhut TN Tambora", blok: [
          { jenis: "tautan", judul: "Basis data", daftar: [
            { label: "(DaPolTam) Database Polhut BTN Tambora", url: "https://drive.google.com/open?id=17O0M1sCb8oUHnNcCWMiPc1gNNSRthOfDw6zhjAP21KA", tipe: "sheet" }
          ] }
        ] }
      ]
    },
    {
      id: "manajemen",
      judul: "Manajemen & Evaluasi",
      ikon: "evaluasi",
      ringkas: "Alat bantu pengelolaan kantor, seperti pengelolaan aset BMN.",
      halaman: []
    }
  ];
})();
