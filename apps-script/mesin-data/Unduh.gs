/**
 * Mesin Data Satu Data Tambora – layanan Unduh Data
 *
 * Tab "Unduh Data" di hub Satu Data Tambora membaca tab data spreadsheet ini lewat aplikasi web:
 *   Terapkan > Deployment baru > Aplikasi web, Jalankan sebagai: Saya, Akses: Siapa saja.
 * URL /exec-nya ditempel ke tab Pengaturan Sheet konten hub (kunci unduh_data) atau ke data/sumber.js (UNDUH_DATA).
 *
 * Susunan unduhan mengikuti Garis Besar Peta Konsep Satu Data Tambora 2027: induk data > kategori (Kategori 0 data
 * model yang tersambung ke induk itu) > sub data (Kategori 1). Satu sub data = baris tab rekap yang Kategori 0 dan
 * Kategori 1-nya cocok (SUB_DATA di bawah), dengan kolom yang terisi saja. Tab di luar data model (titik panas,
 * daftar jenis, rencana RBM, dan sejenisnya) menjadi "data pendukung" di bawah induknya.
 *
 * Hanya pegawai yang sudah masuk lewat gerbang hub yang bisa mengunduh: token sesi diperiksa ke aplikasi web Tanya Data
 * (Pengaturan URL_TANYA_DATA, aksi "siapa"). Kolom data pribadi (Pengaturan UNDUH_KOLOM_ADMIN dan kolom_admin di
 * Katalog) hanya ikut terunduh untuk akun berperan admin.
 *
 * Lembar "Katalog": satu baris per tab data. Kolom judul, tema, keterangan, akses (pegawai, admin, tidak), kolom_admin,
 * dan tampil boleh diubah; kolom lain dihitung ulang skrip setiap data berubah (kolom sub berisi ringkasan tiap sub data).
 *
 * Permintaan dari hub (JSON dikirim sebagai text/plain agar tidak ada preflight CORS):
 *   {aksi: 'katalog', token, versi: 2}
 *   {aksi: 'hitung', token, dataset: [id], saring}
 *   {aksi: 'unduh', token, id, saring, awal, kolom, format}
 * id: id sub data (mis. "pp.pembalakan") atau id tab di Katalog (data pendukung, atau satu tab utuh).
 * saring: {dari: 'YYYY-MM-DD', sampai: 'YYYY-MM-DD', tahun: [2025], nilai: {'Resor': ['Resor Piong']}, cari: 'teks'}
 */

var KOLOM_KATALOG = ['id', 'judul', 'tab', 'induk', 'tema', 'keterangan', 'akses', 'kolom_admin', 'tampil', 'jumlah_baris',
  'tahun_awal', 'tahun_akhir', 'kolom', 'faset', 'diperbarui', 'jumlah_titik', 'sub', 'di_luar_sub', 'versi_sub'];
/** Kolom katalog yang diisi admin; tidak ditimpa saat katalog dihitung ulang. */
var KOLOM_KATALOG_ISIAN = ['judul', 'tema', 'keterangan', 'akses', 'kolom_admin', 'tampil'];
/** Kolom yang nilainya ditawarkan sebagai pilihan saring di hub (bila ada di tab), per sub data dan per data pendukung. */
var FASET_UNDUH = ['Resor', 'SPTN', 'Jenis kegiatan', 'Kelompok jenis'];
var KOLOM_LOG_UNDUH = ['Waktu', 'Pengguna', 'Peran', 'Data', 'Saringan', 'Jumlah baris', 'Format'];
var UNDUH_ADMIN_BAWAAN = 'Nama pelaku, ID Pelaku, Identitas pelaku, Alamat, Tersangka, Nama informan, Nama pemilik, ' +
  'Nama pengepul, Nama kapten, Nama masyarakat, Nama pewaris, Nama guide, Nama pengguna lahan, Riwayat perolehan lahan, ' +
  'Pihak berpengaruh, NIK, Nomor HP, Telepon';
var UNDUH_SEMBUNYI_BAWAAN = 'Kunci titik';
/** Satu halaman unduhan sekitar sekian sel (baris x kolom) agar jawaban aplikasi web tetap ringan, 300-5000 baris. */
var SEL_PER_HALAMAN = 120000;
var HALAMAN_MIN = 300, HALAMAN_MAKS = 5000;

var KETERANGAN_PENGHUBUNG = {
  gangguan: 'Temuan gangguan kawasan dari patroli: perambahan, perburuan, penebangan, pemukiman, dan aktivitas ilegal lain.',
  tindakan: 'Tindakan di lapangan dan tindak lanjut temuan patroli.',
  tenurial: 'Pengumpulan bahan keterangan penggunaan lahan dan konflik tenurial per bidang.',
  karhut: 'Kejadian kebakaran hutan dan lahan yang dicatat saat patroli.',
  satwa: 'Perjumpaan, tanda, dan kematian satwa dari patroli SMART, LPK teknis PEH, dan rekap SMART.',
  tumbuhan: 'Temuan tumbuhan dari patroli SMART, LPK teknis PEH, dan rekap SMART.',
  invasif: 'Temuan jenis tumbuhan asing invasif.',
  ekosistem: 'Ground check tipe ekosistem dan tutupan lahan.',
  sanctuary: 'Kegiatan dan temuan di Sanctuary Rusa Timor.',
  pemulihan: 'Koleksi benih, persemaian, dan pemulihan ekosistem.',
  penyuluhan: 'Kegiatan penyuluhan dan pemberdayaan masyarakat sejak 2020.',
  kelompok: 'Kondisi kelompok binaan per tahun.',
  kunjungan: 'Kunjungan wisata dan pendakian.',
  sampah: 'Sampah pengunjung.',
  sarpras: 'Sarana prasarana, pal batas, dan media informasi.',
  potensi: 'Fitur alami dan potensi kawasan.',
  upaya: 'Titik posisi patroli.',
  rbm: 'Laporan kegiatan resor dari form RBM dan kegiatan RBM yang dicatat saat patroli.',
  surveikehati: 'Data survei kehati metode teknis (satu tab per tabel isian).'
};

/* =========================== susunan sub data =========================== */

/** Naikkan bila SUB_DATA atau aturan hitungnya berubah: katalog lama lalu dihitung ulang otomatis. */
var SUB_VERSI = '2027-11-27';
/** Induk yang ditampilkan di bawah induk lain (Garis Besar peta konsep memakai 7 induk). */
var INDUK_GABUNG_UNDUH = { survei: 'kehati' };
var KATEGORI_SURVEI_UNDUH = 'Survei Kehati Metode Teknis';
/** Penanda kategori survei sebelum tabel surveinya ada (bukan sub data sungguhan). */
var ID_SURVEI_KOSONG = 'kehati.survei-metode-teknis';

/**
 * Induk > kategori > sub data, berurutan seperti di halaman Unduh Data.
 * [induk, kategori, sub data, tab, Kategori 0, Kategori 1]
 *   tab: kode penghubung di lembar Rute (gangguan, satwa, ...), '@upaya' (TAB_UPAYA), '@perresor' (TAB_PER_RESOR),
 *        atau '=Nama tab'.
 *   Kategori 0 dan Kategori 1: label yang diterima, dipisah '|', tidak peka huruf besar-kecil; kosong = semua;
 *        awalan '!' = semua kecuali label itu. Label laporan lama ditulis di sini sebagai padanan.
 * Satu sub data boleh mengambil dari beberapa tab: tulis barisnya lagi dengan induk, kategori, dan nama yang sama.
 * Tab survei metode teknis (penghubung surveikehati di Rute) otomatis menjadi sub data di kategori Survei Kehati
 * Metode Teknis. Baris tab rekap yang tidak cocok dengan sub data mana pun masuk sub data "Lainnya" di tab itu.
 */
var SUB_DATA = [
  ['pp', 'Aktivitas Manusia', 'Pelaku', 'gangguan', 'Aktivitas Manusia', 'Pelaku'],
  ['pp', 'Aktivitas Manusia', 'Penggunaan Kawasan', 'gangguan', 'Aktivitas Manusia', 'Penggunaan Kawasan'],
  ['pp', 'Aktivitas Manusia', 'Pembalakan', 'gangguan', 'Aktivitas Manusia', 'Pembalakan'],
  ['pp', 'Aktivitas Manusia', 'Perburuan Satwa', 'gangguan', 'Aktivitas Manusia', 'Perburuan Satwa'],
  ['pp', 'Aktivitas Manusia', 'Penambangan dan Pengeboran', 'gangguan', 'Aktivitas Manusia', 'Penambangan dan Pengeboran'],
  ['pp', 'Aktivitas Manusia', 'Alat Kerja dan Transportasi', 'gangguan', 'Aktivitas Manusia', 'Alat Kerja dan Transportasi'],
  ['pp', 'Aktivitas Manusia', 'Pencemaran', 'gangguan', 'Aktivitas Manusia', 'Pencemaran'],
  ['pp', 'Aktivitas Manusia', 'Pengambilan HHBK', 'gangguan', 'Aktivitas Manusia', 'Pengambilan HHBK'],
  ['pp', 'Aktivitas Manusia', 'Pembuatan Akses Jalan', 'gangguan', 'Aktivitas Manusia', 'Pembuatan Akses Jalan'],
  ['pp', 'Aktivitas Manusia', 'Penggembalaan Ternak', 'gangguan', 'Aktivitas Manusia', 'Penggembalaan Ternak'],
  ['pp', 'Aktivitas Manusia', 'Pulbaket Penggunaan Lahan (Tenurial)', 'tenurial', 'Aktivitas Manusia', 'Pulbaket Penggunaan Lahan (Tenurial)'],
  ['pp', 'Konflik Manusia dan Satwa', 'Informasi dan Respon Konflik', 'gangguan', 'Konflik Manusia dan Satwa', 'Informasi dan Respon Konflik'],
  ['pp', 'Konflik Manusia dan Satwa', 'Dampak Konflik', 'gangguan', 'Konflik Manusia dan Satwa', 'Dampak Konflik'],
  ['pp', 'Perdagangan dan Kepemilikan TSL', 'Perdagangan dan Kepemilikan TSL', 'tindakan', 'Perdagangan dan Kepemilikan TSL', ''],
  ['pp', 'Pengelolaan', 'Penyitaan dan Penyerahan TSL', 'tindakan', 'Pengelolaan', 'Penyitaan dan Penyerahan TSL'],
  ['pp', 'Tindakan dan Tindak Lanjut', 'Tindakan dan Tindak Lanjut', 'tindakan', '!Perdagangan dan Kepemilikan TSL', '!Penyitaan dan Penyerahan TSL'],

  ['karhut', 'Aktivitas Manusia', 'Kebakaran Hutan dan Lahan', 'karhut', 'Aktivitas Manusia', 'Kebakaran Hutan dan Lahan'],
  ['karhut', 'Pengelolaan', 'Penanggulangan Kebakaran', 'karhut', 'Pengelolaan', 'Penanggulangan Kebakaran'],

  ['kehati', 'Satwa Liar', 'Perjumpaan Satwa', 'satwa', 'Satwa Liar', 'Perjumpaan Satwa'],
  ['kehati', 'Satwa Liar', 'Tanda Satwa', 'satwa', 'Satwa Liar', 'Tanda Satwa'],
  ['kehati', 'Satwa Liar', 'Satwa Mati', 'satwa', 'Satwa Liar', 'Satwa Mati'],
  ['kehati', 'Tumbuhan', 'Tumbuhan', 'tumbuhan', 'Tumbuhan', ''],
  ['kehati', 'Spesies Invasif', 'Spesies Invasif', 'invasif', 'Spesies invasif', ''],
  ['kehati', 'Ground Check', 'Tipe Ekosistem', 'ekosistem', 'Ground Check', 'Tipe Ekosistem'],
  ['kehati', 'Ground Check', 'Tutupan Lahan', 'ekosistem', 'Ground Check', 'Tutupan Lahan'],
  ['kehati', 'Survey Kehati', 'Burung Metode Titik Hitung', 'satwa', 'Survey Kehati', 'Burung Metode Titik Hitung'],
  ['kehati', 'Survey Kehati', 'Transek Satwa', 'satwa', 'Survey Kehati', 'Transek Satwa'],
  ['kehati', 'Survey Kehati', 'Survey Herpetofauna', 'satwa', 'Survey Kehati', 'Survey Herpetofauna'],
  ['kehati', 'Survey Kehati', 'Camera Trapping', 'satwa', 'Survey Kehati', 'Camera Trapping'],
  ['kehati', 'Survey Kehati', 'Fenologi', 'tumbuhan', 'Survey Kehati', 'Fenologi'],
  ['kehati', 'Survey Kehati', 'Plot Vegetasi', 'tumbuhan', 'Survey Kehati', 'Plot Vegetasi'],
  ['kehati', 'Survey Kehati', 'Pengamatan Migrasi Burung', 'satwa', 'Survey Kehati', 'Pengamatan Migrasi Burung'],
  ['kehati', 'Survey Kehati', 'Survey Serangga', 'satwa', 'Survey Kehati', 'Survey Serangga'],
  ['kehati', 'Pengelolaan', 'Pelepasliaran dan Translokasi Satwa Liar', 'satwa', 'Pengelolaan', 'Pelepasliaran dan Translokasi Satwa Liar'],
  ['kehati', 'Pengelolaan', 'Rehabilitasi Hutan dan Lahan', 'pemulihan', 'Pengelolaan', 'Rehabilitasi Hutan dan Lahan'],
  ['kehati', 'Pengelolaan', 'Pembinaan Habitat', 'pemulihan', 'Pengelolaan', 'Pembinaan Habitat'],
  ['kehati', 'Pengelolaan', 'Koleksi, Persemaian, dan Demplot', 'pemulihan', 'Pengelolaan', 'Koleksi, Persemaian, dan Demplot'],
  ['kehati', 'Pengelolaan', 'Pengelolaan Sanctuary Rusa Timor', 'sanctuary', 'Pengelolaan', 'Pengelolaan Sanctuary Rusa Timor'],

  // Penyuluhan: data SMART 2027 dan laporan lama bisa berada di tab Kegiatan Penyuluhan atau Kondisi Kelompok Binaan.
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Sosialisasi', 'penyuluhan', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Sosialisasi|Sosialisasi & lainnya'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Anjangsana', 'penyuluhan', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Anjangsana'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Edukasi Konservasi', 'penyuluhan', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Edukasi Konservasi (Tambora Goes To School dan lainnya)|Edukasi Konservasi|Edukasi & kader konservasi'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Identifikasi Potensi Sosial Budaya', 'penyuluhan', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Identifikasi Potensi Sosial Budaya'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Pendampingan Kelompok Binaan', 'penyuluhan', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Pendampingan Kelompok Binaan|Pendampingan & monev kelompok'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Pendampingan Kelompok Binaan', 'kelompok', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Pendampingan Kelompok Binaan|Pendampingan & monev kelompok'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Monev Kelompok Binaan', 'kelompok', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Monev Kelompok Binaan'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Monev Kelompok Binaan', 'penyuluhan', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Monev Kelompok Binaan'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Kemitraan dan Kesepakatan Konservasi', 'penyuluhan', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Kemitraan dan Kesepakatan Konservasi|Kemitraan & kesepakatan konservasi'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Kemitraan dan Kesepakatan Konservasi', 'kelompok', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Kemitraan dan Kesepakatan Konservasi|Kemitraan & kesepakatan konservasi'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Pembentukan Kelompok dan Kader Konservasi', 'kelompok', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Pembentukan Kelompok dan Kader Konservasi'],
  ['peny', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Pembentukan Kelompok dan Kader Konservasi', 'penyuluhan', 'Penyuluhan dan Pemberdayaan Masyarakat', 'Pembentukan Kelompok dan Kader Konservasi'],

  ['wisata', 'Penjagaan Jalur Pendakian dan ODTWA', 'Pelayanan Pengunjung Wisata', 'kunjungan', 'Penjagaan Jalur Pendakian dan ODTWA', 'Pelayanan Pengunjung Wisata'],
  ['wisata', 'Penjagaan Jalur Pendakian dan ODTWA', 'Penanganan Sampah Pengunjung', 'sampah', 'Penjagaan Jalur Pendakian dan ODTWA', 'Penanganan Sampah Pengunjung'],

  ['fitur', 'Fitur', 'Fitur Alami', 'potensi', 'Fitur', 'Fitur Alami'],
  ['fitur', 'Fitur', 'Infrastruktur/ Sarana dan Prasarana', 'sarpras', 'Fitur', 'Infrastruktur/ Sarana dan Prasarana'],
  ['fitur', 'Fitur', 'Pal Batas', 'sarpras', 'Fitur', 'Pal Batas'],
  ['fitur', 'Fitur', 'Media Informasi', 'sarpras', 'Fitur', 'Media Informasi'],
  ['fitur', 'Pengelolaan', 'Pengelolaan Infrastruktur', 'sarpras', 'Pengelolaan', 'Pengelolaan Infrastruktur'],
  ['fitur', 'Pengelolaan', 'Pengelolaan Pal Batas', 'sarpras', 'Pengelolaan', 'Pengelolaan Pal Batas'],
  ['fitur', 'Pengelolaan', 'Pengelolaan Media Informasi', 'sarpras', 'Pengelolaan', 'Pengelolaan Media Informasi'],
  ['fitur', 'Pemanfaatan', 'Pemanfaatan Tumbuhan dan Satwa Liar', 'potensi', 'Pemanfaatan', 'Pemanfaatan Tumbuhan dan Satwa Liar'],
  ['fitur', 'Pemanfaatan', 'Pemanfaatan Jasa Lingkungan', 'potensi', 'Pemanfaatan', 'Pemanfaatan Jasa Lingkungan'],
  ['fitur', 'Pemanfaatan', 'Potensi Air', 'potensi', 'Pemanfaatan', 'Potensi Air'],
  ['fitur', 'Pemanfaatan', 'Obyek Wisata', 'potensi', 'Pemanfaatan', 'Obyek Wisata'],
  ['fitur', 'Bencana Alam', 'Bencana Alam', 'potensi', 'Bencana Alam', ''],

  ['rbm', 'Data Patroli', 'Upaya Patroli per Leg', '@upaya', '', ''],
  ['rbm', 'Posisi', 'Titik Posisi Patroli', 'upaya', '', ''],
  ['rbm', 'Kegiatan RBM', 'Kegiatan Resor dan Capaian RBM', 'rbm', '', ''],
  ['rbm', 'Ringkasan per Resor', 'Potensi dan Ancaman per Resor', '@perresor', '', '']
];

/**
 * Baris yang sengaja tidak masuk sub data mana pun (juga tidak ke "Lainnya") karena observasinya sudah ada di tab lain.
 * [tab, Kategori 0, Kategori 1], aturan label sama dengan SUB_DATA.
 */
var SUB_DATA_ABAIKAN = [
  ['tenurial', 'Aktivitas Manusia', 'Penggunaan Kawasan'], // sama dengan sub data Penggunaan Kawasan di tab gangguan
  ['satwa', 'Survei Kehati Metode Teknis', ''],            // salinan baris tab survei metode teknis
  ['tumbuhan', 'Survei Kehati Metode Teknis', ''],
  ['invasif', 'Survei Kehati Metode Teknis', '']
];

function labelNormal_(s) {
  return String(s === null || s === undefined ? '' : s).trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Aturan label "A|B" (salah satu), "!A|!B" (selain itu), atau kosong (semua) menjadi fungsi nilai -> boolean. */
function aturanLabel_(teks) {
  var terima = null, tolak = null;
  String(teks || '').split('|').forEach(function (b) {
    b = String(b).trim();
    if (!b) return;
    if (b.charAt(0) === '!') { tolak = tolak || {}; tolak[labelNormal_(b.slice(1))] = true; }
    else { terima = terima || {}; terima[labelNormal_(b)] = true; }
  });
  return function (v) {
    var n = labelNormal_(v);
    return (!terima || !!terima[n]) && (!tolak || !tolak[n]);
  };
}

/** Pencocok satu bagian sub data: fungsi (Kategori 0, Kategori 1) -> boolean. */
function pencocokBagian_(k0, k1) {
  var a = aturanLabel_(k0), b = aturanLabel_(k1);
  return function (v0, v1) { return a(v0) && b(v1); };
}

/**
 * Pencocok untuk satu bagian yang tersimpan di Katalog. Bagian "Lainnya" (sisa) menerima baris yang tidak cocok dengan
 * bagian lain di tab yang sama dan tidak termasuk aturan abaikan.
 */
function pencocokTersimpan_(b, saudara) {
  if (!b.sisa) return pencocokBagian_(b.k0, b.k1);
  var lain = (saudara || []).filter(function (x) { return !x.sisa; }).map(function (x) { return pencocokBagian_(x.k0, x.k1); });
  var abai = (b.abaikan || []).map(function (a) { return pencocokBagian_(a[0], a[1]); });
  return function (v0, v1) {
    for (var i = 0; i < lain.length; i++) if (lain[i](v0, v1)) return false;
    for (var j = 0; j < abai.length; j++) if (abai[j](v0, v1)) return false;
    return true;
  };
}

function indukTampil_(kode) {
  return INDUK_GABUNG_UNDUH[kode] || String(kode || '');
}

function slugSub_(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'data';
}

/** Nama tab untuk kode tab di SUB_DATA. */
function tabSub_(M, kode) {
  kode = String(kode || '');
  if (kode === '@upaya') return String(M.atur.TAB_UPAYA || 'Rekap Upaya Patroli');
  if (kode === '@perresor') return String(M.atur.TAB_PER_RESOR || 'Rekap Potensi dan Ancaman per Resor');
  if (kode.charAt(0) === '=') return kode.slice(1);
  for (var i = 0; i < M.rute.length; i++) if (String(M.rute[i].penghubung) === kode) return String(M.rute[i].tab);
  return '';
}

/** Kunci pencarian nama tab yang tahan nama terpotong 31 huruf (file Excel). */
function kunciTab_(nama) {
  return String(nama || '').slice(0, 31).trim().toLowerCase();
}

/**
 * Pembuat id sub data: induk.slug(nama sub data), atau induk.slug(kategori).slug(nama) bila bentrok. Id SUB_DATA
 * ditetapkan lebih dulu sesuai urutannya, jadi id yang sama keluar di menu katalog dan di aplikasi web.
 */
function pembuatIdSub_() {
  var idKunci = {}, dipakai = {};
  var idUntuk = function (induk, kategori, judul) {
    var k = induk + '|' + kategori + '|' + judul;
    if (idKunci[k]) return idKunci[k];
    var dasar = induk + '.' + slugSub_(judul), id = dasar, i = 2;
    if (dipakai[id]) id = dasar = induk + '.' + slugSub_(kategori) + '.' + slugSub_(judul);
    while (dipakai[id]) id = dasar + '-' + i++;
    dipakai[id] = true;
    return (idKunci[k] = id);
  };
  SUB_DATA.forEach(function (s) { idUntuk(s[0], s[1], s[2]); });
  return idUntuk;
}

/** Tab survei metode teknis tampil tepat setelah kategori Survey Kehati: urutannya di antara dua baris SUB_DATA. */
function urutSurvei_() {
  var setelah = 0;
  SUB_DATA.forEach(function (s, i) { if (s[0] === 'kehati' && s[1] === 'Survey Kehati') setelah = i; });
  return setelah;
}

/**
 * SUB_DATA ditambah tab survei metode teknis dari Rute, dengan nama tab yang sudah diketahui.
 * Hasil: {daftar: [bagian], perTab: {kunciTab: [bagian]}, abaikan: {kunciTab: [[k0, k1]]}}.
 * Bagian: {id, induk, kategori, judul, urut, k0, k1, tab}. urut = nomor baris SUB_DATA (urutan tampil di hub).
 */
function susunSubData_(M) {
  var hasil = { daftar: [], perTab: {}, abaikan: {} }, idUntuk = pembuatIdSub_();
  var tambah = function (induk, kategori, judul, tab, k0, k1, urut) {
    if (!tab) return;
    var b = { id: idUntuk(induk, kategori, judul), induk: induk, kategori: kategori, judul: judul, urut: urut,
      k0: String(k0 || ''), k1: String(k1 || ''), tab: tab };
    hasil.daftar.push(b);
    var kt = kunciTab_(tab);
    (hasil.perTab[kt] = hasil.perTab[kt] || []).push(b);
  };
  SUB_DATA.forEach(function (s, i) { tambah(s[0], s[1], s[2], tabSub_(M, s[3]), s[4], s[5], i); });
  var setelah = urutSurvei_(), survei = {}, k = 0;
  M.rute.forEach(function (r) {
    if (String(r.penghubung) !== 'surveikehati' || survei[r.tab]) return;
    survei[r.tab] = true;
    tambah('kehati', KATEGORI_SURVEI_UNDUH, String(r.tab), String(r.tab), '', '', setelah + (++k) / 1000);
  });
  SUB_DATA_ABAIKAN.forEach(function (a) {
    var t = tabSub_(M, a[0]);
    if (t) (hasil.abaikan[kunciTab_(t)] = hasil.abaikan[kunciTab_(t)] || []).push([String(a[1] || ''), String(a[2] || '')]);
  });
  return hasil;
}

/** JSON ringkasan sub data untuk satu sel Katalog (di bawah batas 50.000 huruf per sel). */
function teksSub_(daftar) {
  if (!daftar.length) return '';
  var s = JSON.stringify(daftar);
  if (s.length <= 45000) return s;
  daftar.forEach(function (b) { b.faset = { Tahun: (b.faset || {}).Tahun || {} }; });
  s = JSON.stringify(daftar);
  if (s.length <= 45000) return s;
  daftar.forEach(function (b) { b.faset = {}; b.kolom = null; });
  return JSON.stringify(daftar);
}

/* =========================== katalog =========================== */

function perbaruiKatalog() {
  var M = muatMesin_();
  perbaruiKatalog_(M, true);
  var r = ringkasKatalog_(M), pesan = 'Katalog Unduh Data diperbarui: ' + r.teks;
  kabari_(pesan);
  try { SpreadsheetApp.getUi().alert('Katalog Unduh Data', pesan + (r.luar.length ? '\n\n' + r.luar.join('\n') : ''), SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { /* dari pemicu */ }
}

/** Ringkasan katalog untuk pesan menu: jumlah tab, sub data, data pendukung, dan baris di luar sub data. */
function ringkasKatalog_(M) {
  var kat = katalogTersimpan_({ ss: M.ss, atur: M.atur, induk: M.induk, urutInduk: M.urutInduk });
  var sub = {}, berisi = {}, pendukung = 0, luar = [];
  kat.forEach(function (r) {
    if (r.daftarSub.length) {
      r.daftarSub.forEach(function (b) { sub[b.id] = true; if (Number(b.n) > 0) berisi[b.id] = true; });
      if (r.di_luar_sub) luar.push(r.tab + ': ' + r.di_luar_sub + '.');
    } else if (Number(r.jumlah_baris) > 0 && bolehLihat_(r)) pendukung++;
  });
  return { teks: kat.length + ' tab data, ' + Object.keys(sub).length + ' sub data (' + Object.keys(berisi).length + ' berisi data), ' +
    pendukung + ' data pendukung.', luar: luar };
}

/** Semua tab data (bukan lembar kendali) di spreadsheet ini dan di spreadsheet induk terpisah. */
function daftarTabData_(M) {
  var tab = tabData_(M), hasil = [], dilihat = {};
  var tambah = function (ssX, indukBawaan) {
    ssX.getSheets().forEach(function (s) {
      var n = s.getName();
      if (LEMBAR_KENDALI.indexOf(n) >= 0 || dilihat[n]) return;
      dilihat[n] = true;
      hasil.push({ sh: s, nama: n, induk: tab[n] || indukBawaan || '', dikenal: !!tab[n] });
    });
  };
  tambah(M.ss, '');
  M.urutInduk.forEach(function (kode) {
    var x;
    try { x = bukaInduk_(M, kode); } catch (e) { return; }
    if (x.getId() !== M.ss.getId()) tambah(x, kode);
  });
  return hasil;
}

function idKatalog_(nama, dipakai) {
  var dasar = String(nama).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'data';
  var id = dasar, i = 2;
  while (dipakai[id]) id = dasar + '-' + i++;
  dipakai[id] = true;
  return id;
}

function tahunBaris_(r, iTh, iTg, zona) {
  var th = iTh >= 0 ? Number(r[iTh]) : 0;
  if (th > 1900 && th < 2200) return th;
  var tg = iTg >= 0 ? r[iTg] : '';
  if (tg instanceof Date) return Number(Utilities.formatDate(tg, zona, 'yyyy'));
  var m = /^(\d{4})-\d{2}-\d{2}/.exec(String(tg || ''));
  return m ? Number(m[1]) : 0;
}

/** Baris punya koordinat X (bujur) dan Y (lintang): keduanya terisi angka dan bukan 0,0. Sama dengan aturan Shapefile di hub. */
function adaKoordinat_(x, y) {
  if (x === '' || y === '' || x === null || y === null || x === undefined || y === undefined) return false;
  var a = Number(x), b = Number(y);
  return isFinite(a) && isFinite(b) && !(a === 0 && b === 0);
}

function selIsi_(x) {
  return !(x === '' || x === null || x === undefined || (typeof x === 'string' && !x.trim()));
}

/**
 * Ringkasan isi satu tab: jumlah baris, rentang tahun, kolom yang terisi, hitungan nilai kolom pilihan saring,
 * jumlah baris berkoordinat (untuk GeoJSON dan Shapefile), dan ringkasan yang sama per sub data tab ini.
 * spes: bagian sub data dari susunSubData_ untuk tab ini; abaikan: [[k0, k1]] baris yang sengaja dilewati;
 * lainnya: {id, induk, judul} untuk baris yang tidak masuk sub data mana pun.
 */
function ringkasTab_(sh, zona, spes, abaikan, lainnya) {
  var n = Math.max(0, sh.getLastRow() - 1), lc = sh.getLastColumn();
  var ring = { jumlah: n, kolom: [], faset: {}, tahun: ['', ''], titik: 0, sub: [], luar: null };
  if (lc < 1) return ring;
  var v = n ? sh.getRange(1, 1, n + 1, lc).getValues() : sh.getRange(1, 1, 1, lc).getValues();
  var h = v.shift().map(function (x) { return String(x).trim(); }), isiTab = {}, belumIsi = h.filter(String).length;
  var iTh = h.indexOf('Tahun'), iTg = h.indexOf('Tanggal'), iX = h.indexOf('X'), iY = h.indexOf('Y'), idx = {}, hit = {}, hitTahun = {};
  var i0 = h.indexOf('Kategori 0'), i1 = h.indexOf('Kategori 1');
  FASET_UNDUH.forEach(function (f) { var i = h.indexOf(f); if (i >= 0) { idx[f] = i; hit[f] = {}; } });
  var baru = function (s) { var o = { s: s, n: 0, th: {}, titik: 0, isi: {}, faset: {} }; Object.keys(idx).forEach(function (f) { o.faset[f] = {}; }); return o; };
  var bag = (spes || []).map(function (s) { var o = baru(s); o.cocok = pencocokBagian_(s.k0, s.k1); return o; });
  var abai = (abaikan || []).map(function (a) { return pencocokBagian_(a[0], a[1]); });
  var sisa = bag.length && lainnya ? baru(lainnya) : null, luar = { abaikan: 0, sisa: {} };
  var catat = function (b, r, th, titik) {
    b.n++;
    if (th) b.th[th] = (b.th[th] || 0) + 1;
    if (titik) b.titik++;
    for (var j = 0; j < h.length; j++) if (h[j] && !b.isi[j] && selIsi_(r[j])) b.isi[j] = true;
    Object.keys(idx).forEach(function (f) {
      var x = r[idx[f]];
      x = x === null || x === undefined ? '' : String(x).trim();
      if (x) b.faset[f][x] = (b.faset[f][x] || 0) + 1;
    });
  };
  v.forEach(function (r) {
    for (var j = 0; belumIsi && j < h.length; j++) if (h[j] && !isiTab[j] && selIsi_(r[j])) { isiTab[j] = true; belumIsi--; }
    Object.keys(idx).forEach(function (f) {
      var x = r[idx[f]];
      x = x === null || x === undefined ? '' : String(x).trim();
      if (x) hit[f][x] = (hit[f][x] || 0) + 1;
    });
    var th = tahunBaris_(r, iTh, iTg, zona);
    if (th) hitTahun[th] = (hitTahun[th] || 0) + 1;
    var titik = iX >= 0 && iY >= 0 && adaKoordinat_(r[iX], r[iY]);
    if (titik) ring.titik++;
    if (!bag.length) return;
    var k0 = i0 >= 0 ? r[i0] : '', k1 = i1 >= 0 ? r[i1] : '', kena = false;
    for (var b = 0; b < bag.length; b++) if (bag[b].cocok(k0, k1)) { kena = true; catat(bag[b], r, th, titik); }
    if (kena) return;
    for (var a = 0; a < abai.length; a++) if (abai[a](k0, k1)) { luar.abaikan++; return; }
    var label = [k0, k1].map(function (x) { return String(x === null || x === undefined ? '' : x).trim(); }).filter(String).join(' > ') || '(tanpa kategori)';
    luar.sisa[label] = (luar.sisa[label] || 0) + 1;
    if (sisa) catat(sisa, r, th, titik);
  });
  var urutFaset = function (o, batas) {
    var urut = Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).slice(0, batas), hasil = {};
    urut.forEach(function (k) { hasil[k] = o[k]; });
    return hasil;
  };
  Object.keys(hit).forEach(function (f) {
    var o = urutFaset(hit[f], 150);
    if (Object.keys(o).length) ring.faset[f] = o;
  });
  // Hanya kolom yang terisi sedikitnya satu baris yang ikut diunduh (tab tanpa baris: semua judul kolom).
  ring.kolom = h.filter(function (x, j) { return x && (!n || isiTab[j]); });
  var th = Object.keys(hitTahun).map(Number).sort(function (a, b) { return a - b; });
  if (th.length) {
    ring.faset.Tahun = hitTahun;
    ring.tahun = [th[0], th[th.length - 1]];
  }
  var keluar = function (b, tambahan) {
    var t = Object.keys(b.th).map(Number).sort(function (x, y) { return x - y; }), f = {};
    Object.keys(b.faset).forEach(function (k) { var o = urutFaset(b.faset[k], 60); if (Object.keys(o).length) f[k] = o; });
    if (t.length) f.Tahun = b.th;
    var o = { id: b.s.id, induk: b.s.induk, kategori: b.s.kategori, judul: b.s.judul, urut: b.s.urut, k0: b.s.k0 || '', k1: b.s.k1 || '',
      n: b.n, tahun: t.length ? [t[0], t[t.length - 1]] : ['', ''], titik: b.titik,
      kolom: h.filter(function (x, j) { return x && b.isi[j]; }), faset: f };
    for (var k in tambahan) o[k] = tambahan[k];
    return o;
  };
  ring.sub = bag.map(function (b) { return keluar(b); });
  if (sisa && sisa.n) ring.sub.push(keluar(sisa, { sisa: true, abaikan: abaikan || [], label: urutFaset(luar.sisa, 12) }));
  if (bag.length && (luar.abaikan || Object.keys(luar.sisa).length)) ring.luar = luar;
  return ring;
}

/** Teks kolom di_luar_sub: baris tab ini yang tidak masuk sub data biasa. */
function teksLuarSub_(luar) {
  if (!luar) return '';
  var a = [];
  if (luar.abaikan) a.push(luar.abaikan + ' baris dilewati karena observasinya sudah ada di tab lain');
  var s = Object.keys(luar.sisa).sort(function (x, y) { return luar.sisa[y] - luar.sisa[x]; });
  if (s.length) a.push('masuk Lainnya: ' + s.slice(0, 12).map(function (k) { return k + ' (' + luar.sisa[k] + ')'; }).join(', '));
  return a.join('; ');
}

/**
 * Hitung ulang lembar Katalog. semua = true: semua tab dihitung; bila tidak, hanya tab yang berubah di putaran ini
 * (M.diubah), tab baru, atau tab yang jumlah barisnya berbeda dari catatan katalog. Mengembalikan jumlah tab data.
 */
function perbaruiKatalog_(M, semua) {
  var ss = M.ss, sh = ss.getSheetByName(LEMBAR.katalog);
  if (!sh) sh = ss.insertSheet(LEMBAR.katalog, ss.getSheets().length);
  var kepala = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (x) { return String(x).trim(); }).filter(String) : [];
  KOLOM_KATALOG.forEach(function (k) { if (kepala.indexOf(k) < 0) kepala.push(k); });
  var lama = {}, dipakai = {};
  bacaTabel_(ss, LEMBAR.katalog, true).forEach(function (r) {
    if (!r.tab) return;
    lama[r.tab] = r;
    if (r.id) dipakai[String(r.id)] = true;
  });
  var zona = ss.getSpreadsheetTimeZone(), sekarang = new Date(), diubah = M.diubah || {};
  var sumber = {};
  bacaTabel_(ss, LEMBAR.sumber, true).forEach(function (s) { var t = tabTujuan_(s); if (t && !sumber[t]) sumber[t] = s; });
  var penghubung = {}, susun = susunSubData_(M);
  M.rute.forEach(function (r) { if (!penghubung[r.tab]) penghubung[r.tab] = r.penghubung; });
  var baris = daftarTabData_(M).map(function (d) {
    var r = lama[d.nama] || {}, o = {}, k;
    for (k in r) o[k] = r[k];
    var n = Math.max(0, d.sh.getLastRow() - 1);
    var hitung = semua || !lama[d.nama] || diubah[d.nama] || Number(r.jumlah_baris) !== n || !r.kolom ||
      r.jumlah_titik === undefined || r.jumlah_titik === '' || String(r.versi_sub || '') !== SUB_VERSI;
    o.id = r.id || idKatalog_(d.nama, dipakai);
    o.tab = d.nama;
    o.induk = d.induk || r.induk || '';
    if (!o.judul) o.judul = d.nama;
    if (!o.tema) o.tema = M.induk[o.induk] ? M.induk[o.induk].nama : 'Lainnya';
    if (!o.keterangan) {
      var p = penghubung[d.nama], s = sumber[d.nama];
      o.keterangan = d.nama === String(M.atur.TAB_UPAYA || 'Rekap Upaya Patroli') ?
        'Ringkasan tiap leg patroli: tanggal, tim, resor, jumlah titik, dan panjang jalur.' :
        d.nama === String(M.atur.TAB_PER_RESOR || 'Rekap Potensi dan Ancaman per Resor') ?
          'Jumlah temuan per resor per tahun, dihitung ulang setiap putaran.' :
          p ? KETERANGAN_PENGHUBUNG[p] || '' : s ? String(s.catatan || s.nama || '') : '';
    }
    if (!o.akses) o.akses = sumber[d.nama] && sumber[d.nama].akses_unduh ? String(sumber[d.nama].akses_unduh) : 'pegawai';
    if (!o.tampil) o.tampil = d.dikenal ? 'ya' : 'tidak';
    if (hitung) {
      var kt = kunciTab_(d.nama), spes = susun.perTab[kt] || [], indukSub = spes.length ? spes[0].induk : '';
      var ring = ringkasTab_(d.sh, zona, spes, susun.abaikan[kt] || [], spes.length ? { id: indukSub + '.lainnya-' + slugSub_(d.nama),
        induk: indukSub, kategori: 'Lainnya', judul: 'Lainnya dari ' + d.nama, urut: 10000 } : null);
      o.jumlah_baris = ring.jumlah;
      o.tahun_awal = ring.tahun[0];
      o.tahun_akhir = ring.tahun[1];
      o.kolom = JSON.stringify(ring.kolom);
      var f = JSON.stringify(ring.faset);
      if (f.length > 32000) f = JSON.stringify({ Tahun: ring.faset.Tahun || {} });
      o.faset = f;
      o.jumlah_titik = ring.titik;
      o.sub = teksSub_(ring.sub);
      o.di_luar_sub = teksLuarSub_(ring.luar);
      o.versi_sub = SUB_VERSI;
      o.diperbarui = sekarang;
    }
    return kepala.map(function (h) { return o[h] === undefined || o[h] === null ? '' : amanSel_(o[h]); });
  });
  sh.clearContents();
  sh.getRange(1, 1, 1, kepala.length).setValues([kepala]).setFontWeight('bold');
  sh.setFrozenRows(1);
  if (baris.length) sh.getRange(2, 1, baris.length, kepala.length).setValues(baris);
  M.diubah = {};
  return baris.length;
}

/* =========================== aturan kolom =========================== */

function daftarKoma_(s) {
  return String(s === null || s === undefined ? '' : s).split(',').map(function (x) { return x.trim(); }).filter(String);
}

/** Nama kolom sama dengan, atau diawali, salah satu nama di daftar (tidak peka huruf besar-kecil). */
function cocokAwal_(nama, daftar) {
  var n = String(nama).toLowerCase();
  return daftar.some(function (d) {
    d = String(d).toLowerCase();
    return n === d || (n.indexOf(d) === 0 && /[\s(:\/-]/.test(n.charAt(d.length)));
  });
}

function aturUnduh_(M, kunci, bawaan) {
  var v = M.atur[kunci];
  return v === undefined || v === null || v === '' ? bawaan : String(v);
}

function daftarAdmin_(M, kat) {
  return daftarKoma_(aturUnduh_(M, 'UNDUH_KOLOM_ADMIN', UNDUH_ADMIN_BAWAAN)).concat(daftarKoma_(kat.kolom_admin));
}

/** Kolom yang tidak ikut diunduh: {nama kolom: 'sembunyi' | 'admin'}. */
function kolomTolak_(M, kat, kepala, sesi) {
  var sembunyi = daftarKoma_(aturUnduh_(M, 'UNDUH_KOLOM_SEMBUNYI', UNDUH_SEMBUNYI_BAWAAN));
  var admin = daftarAdmin_(M, kat), tolak = {};
  kepala.forEach(function (h) {
    if (!h) return;
    if (cocokAwal_(h, sembunyi)) tolak[h] = 'sembunyi';
    else if (sesi.peran !== 'admin' && cocokAwal_(h, admin)) tolak[h] = 'admin';
  });
  return tolak;
}

/** Kolom "Atribut lain" berisi "Label: nilai; ...": buang bagian yang labelnya kolom khusus admin. */
function bersihAtributLain_(teks, admin) {
  return String(teks).split('; ').filter(function (p) {
    var i = p.indexOf(': ');
    return i < 0 || !cocokAwal_(p.slice(0, i), admin);
  }).join('; ');
}

/* =========================== saring =========================== */

function isoAman_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  return m ? m[0] : '';
}

/** Rentang waktu satu baris [awal, akhir] dalam teks ISO: dari Tanggal, atau dari Tahun (dan Bulan) bila tanggal kosong. */
function rentangBaris_(tg, th, bl, zona) {
  if (tg instanceof Date) { var s = Utilities.formatDate(tg, zona, 'yyyy-MM-dd'); return [s, s]; }
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(tg || ''));
  if (m) return [m[0], m[0]];
  var y = Number(th);
  if (!(y > 1900 && y < 2200)) return null;
  var b = Number(bl);
  if (b >= 1 && b <= 12) return [y + '-' + dua_(b) + '-01', y + '-' + dua_(b) + '-31'];
  return [y + '-01-01', y + '-12-31'];
}

/**
 * Baris yang lolos saringan (indeks 0 = baris data pertama). Hanya kolom yang dibutuhkan saringan yang dibaca,
 * kecuali bila ada pencarian teks. Saringan untuk kolom yang tidak ada di tab dicatat di "diabaikan".
 * cocok: fungsi (Kategori 0, Kategori 1) -> boolean untuk sub data, atau null untuk seluruh tab.
 * privasi: {lewati: {indeks kolom: true}, iLain, admin} agar kata kunci tidak mencari di kolom yang tidak boleh dilihat.
 * memo: {} yang dipakai bersama dalam satu permintaan agar kolom tab yang sama dibaca sekali untuk banyak sub data.
 */
function saringTab_(sh, kepala, n, saring, zona, cocok, privasi, memo) {
  saring = saring || {};
  var diabaikan = [], perlu = {}, i;
  var dari = isoAman_(saring.dari), sampai = isoAman_(saring.sampai);
  var tahun = (Array.isArray(saring.tahun) ? saring.tahun : []).map(Number).filter(Boolean);
  var iTg = kepala.indexOf('Tanggal'), iTh = kepala.indexOf('Tahun'), iBl = kepala.indexOf('Bulan');
  var pakaiWaktu = !!(dari || sampai || tahun.length);
  if (pakaiWaktu && iTg < 0 && iTh < 0) { diabaikan.push('Waktu'); pakaiWaktu = false; }
  if (pakaiWaktu) [iTg, iTh, iBl].forEach(function (x) { if (x >= 0) perlu[x] = true; });
  var nilai = [];
  Object.keys(saring.nilai || {}).forEach(function (k) {
    var daftar = (Array.isArray(saring.nilai[k]) ? saring.nilai[k] : []).map(function (x) { return String(x).trim(); }).filter(String);
    if (!daftar.length) return;
    var j = kepala.indexOf(k);
    if (j < 0) { diabaikan.push(k); return; }
    var set = {};
    daftar.forEach(function (x) { set[x] = true; });
    nilai.push({ i: j, set: set });
    perlu[j] = true;
  });
  var cari = String(saring.cari || '').trim().toLowerCase().slice(0, 100);
  var i0 = kepala.indexOf('Kategori 0'), i1 = kepala.indexOf('Kategori 1');
  if (cocok) [i0, i1].forEach(function (x) { if (x >= 0) perlu[x] = true; });
  var indeks = [];
  if (n <= 0) return { indeks: indeks, diabaikan: diabaikan };
  if (!pakaiWaktu && !nilai.length && !cari && !cocok) {
    for (i = 0; i < n; i++) indeks.push(i);
    return { indeks: indeks, diabaikan: diabaikan };
  }
  var semua = null, kol = {}, kunciMemo = memo ? kunciLembar_(sh) + '|' + n + '|' : '';
  if (cari) semua = isiLembar_(sh, kepala.length, n, memo);
  else Object.keys(perlu).forEach(function (x) {
    var k = kunciMemo + 'k' + x;
    kol[x] = memo && memo[k] ? memo[k] : sh.getRange(2, Number(x) + 1, n, 1).getValues();
    if (memo) memo[k] = kol[x];
  });
  var sel = function (r, j) { return j < 0 ? '' : semua ? semua[r][j] : kol[j][r][0]; };
  for (var r = 0; r < n; r++) {
    if (cocok && !cocok(sel(r, i0), sel(r, i1))) continue;
    if (pakaiWaktu) {
      var rg = rentangBaris_(sel(r, iTg), sel(r, iTh), sel(r, iBl), zona);
      if (!rg) continue;
      if (dari && rg[1] < dari) continue;
      if (sampai && rg[0] > sampai) continue;
      if (tahun.length && tahun.indexOf(Number(rg[0].slice(0, 4))) < 0) continue;
    }
    var lolos = true;
    for (var k = 0; k < nilai.length && lolos; k++) {
      var v = sel(r, nilai[k].i);
      lolos = !!nilai[k].set[v === null || v === undefined ? '' : String(v).trim()];
    }
    if (!lolos) continue;
    if (cari && teksCari_(semua[r], zona, privasi).indexOf(cari) < 0) continue;
    indeks.push(r);
  }
  return { indeks: indeks, diabaikan: diabaikan };
}

function kunciLembar_(sh) {
  return sh.getParent().getId() + '|' + sh.getSheetId();
}

/** Semua baris data satu tab (tanpa judul kolom), dibaca sekali per permintaan bila memo diberikan. */
function isiLembar_(sh, lebar, n, memo) {
  var k = memo ? kunciLembar_(sh) + '|' + n + '|semua' : '';
  if (memo && memo[k]) return memo[k];
  var v = n > 0 ? sh.getRange(2, 1, n, lebar).getValues() : [];
  if (memo) memo[k] = v;
  return v;
}

/** Isi satu baris sebagai teks pencarian (huruf kecil), tanpa kolom yang tidak boleh dilihat pengguna. */
function teksCari_(row, zona, privasi) {
  var a = [];
  for (var j = 0; j < row.length; j++) {
    if (privasi && privasi.lewati[j]) continue;
    var x = row[j];
    if (x instanceof Date) x = Utilities.formatDate(x, zona, 'yyyy-MM-dd');
    else x = String(x === null || x === undefined ? '' : x);
    if (privasi && j === privasi.iLain && privasi.admin && x) x = bersihAtributLain_(x, privasi.admin);
    a.push(x);
  }
  return a.join(' ').toLowerCase();
}

/** Nilai sel untuk dikirim ke hub: tanggal jadi teks ISO menurut zona waktu spreadsheet. */
function selKeluar_(v, zona) {
  if (v instanceof Date) {
    if (v.getFullYear() < 1901) return Utilities.formatDate(v, zona, 'HH:mm:ss');
    var s = Utilities.formatDate(v, zona, 'yyyy-MM-dd HH:mm:ss');
    return /00:00:00$/.test(s) ? s.slice(0, 10) : s;
  }
  return v === null || v === undefined ? '' : v;
}

/* =========================== layanan web =========================== */

/** Muatan ringan untuk aplikasi web: Pengaturan dan Induk saja (Kamus dan Rute tidak dibutuhkan). */
function muatRingan_() {
  var ss = SpreadsheetApp.getActive();
  var M = { ss: ss, atur: {}, induk: {}, urutInduk: [], buka: {}, tab: {}, idAda: {}, titikLain: {}, rute: [] };
  bacaTabel_(ss, LEMBAR.atur).forEach(function (r) { M.atur[r.kunci] = r.nilai; });
  bacaTabel_(ss, LEMBAR.induk).forEach(function (r) { M.induk[r.kode] = r; M.urutInduk.push(r.kode); });
  return M;
}

function jsonAman_(s, cadangan) {
  try { return s ? JSON.parse(s) : cadangan; } catch (e) { return cadangan; }
}

function katalogUsang_(daftar) {
  return !daftar.length || daftar.some(function (r) { return String(r.versi_sub || '') !== SUB_VERSI; });
}

/**
 * Baris Katalog dengan kolom JSON yang sudah dibaca. Katalog yang kosong, atau yang dihitung dengan susunan sub data
 * lama (versi_sub berbeda dari SUB_VERSI), dihitung ulang sekali. Kunci skrip mencegah dua hitungan berbarengan.
 */
function katalogTersimpan_(M) {
  if (M.katalog) return M.katalog;
  var baca = function () { return bacaTabel_(M.ss, LEMBAR.katalog, true).filter(function (r) { return r.id && r.tab; }); };
  var daftar = baca();
  if (katalogUsang_(daftar)) {
    var kunci = LockService.getScriptLock();
    if (kunci.tryLock(30000)) {
      try {
        daftar = baca();
        if (katalogUsang_(daftar)) { perbaruiKatalog_(muatMesin_(), false); daftar = baca(); }
      } finally { kunci.releaseLock(); }
    }
  }
  daftar.forEach(function (r) {
    r.id = String(r.id);
    r.daftarKolom = jsonAman_(r.kolom, []);
    r.isiFaset = jsonAman_(r.faset, {});
    r.daftarSub = String(r.versi_sub || '') === SUB_VERSI ? jsonAman_(r.sub, []) : [];
  });
  return (M.katalog = daftar);
}

function bolehLihat_(kat) {
  return String(kat.tampil).toLowerCase() !== 'tidak' && String(kat.akses).toLowerCase() !== 'tidak';
}

function terkunci_(kat, sesi) {
  return String(kat.akses).toLowerCase() === 'admin' && sesi.peran !== 'admin';
}

function bukaTabKatalog_(M, kat) {
  if (LEMBAR_KENDALI.indexOf(String(kat.tab)) >= 0) return null; // lembar kendali tidak pernah diunduh
  var ss;
  try { ss = kat.induk ? bukaInduk_(M, String(kat.induk)) : M.ss; } catch (e) { ss = M.ss; }
  return cariLembar_(ss, String(kat.tab)) || cariLembar_(M.ss, String(kat.tab));
}

function waktuTeks_(v, zona) {
  return v instanceof Date ? Utilities.formatDate(v, zona, "yyyy-MM-dd'T'HH:mm:ss") : String(v || '');
}

var KETERANGAN_LAINNYA = 'Baris yang kategorinya belum ada di peta konsep, jadi belum masuk sub data mana pun.';

function urutBagian_(a, b) {
  return (a.b ? Number(a.b.urut) || 0 : 0) - (b.b ? Number(b.b.urut) || 0 : 0);
}

/**
 * Satu data yang bisa diunduh: sub data (bagian dari satu tab atau lebih, masing-masing dengan pencocok Kategori 0/1),
 * atau satu tab utuh (data pendukung, atau id tab lama). Tab yang disembunyikan di Katalog dilewati.
 * Hasil: {id, jenis: 'sub' | 'lainnya' | 'pendukung' | 'tab', judul, induk, kategori, keterangan, urut, bagian: [{r, b}]}.
 */
function cariData_(M, id) {
  id = String(id || '');
  if (!id) return null;
  var kat = katalogTersimpan_(M), bagian = [];
  kat.forEach(function (r) {
    if (!bolehLihat_(r)) return;
    r.daftarSub.forEach(function (b) { if (b.id === id) bagian.push({ r: r, b: b }); });
  });
  if (bagian.length) return dataDariBagian_(id, bagian.sort(urutBagian_));
  var r = kat.filter(function (x) { return x.id === id && bolehLihat_(x); })[0];
  return r ? dataDariTab_(r) : null;
}

function dataDariBagian_(id, bagian) {
  var b = bagian[0].b, label = Object.keys(b.label || {});
  return { id: id, jenis: b.sisa ? 'lainnya' : 'sub', judul: String(b.judul || id), induk: indukTampil_(b.induk),
    kategori: String(b.kategori || ''), urut: Number(b.urut) || 0, bagian: bagian,
    keterangan: b.sisa ? KETERANGAN_LAINNYA + (label.length ? ' Kategorinya: ' + label.map(function (k) {
      return k + ' (' + b.label[k] + ')'; }).join(', ') + '.' : '') : '' };
}

function dataDariTab_(r) {
  return { id: r.id, jenis: r.daftarSub.length ? 'tab' : 'pendukung', judul: String(r.judul || r.tab),
    induk: indukTampil_(String(r.induk || '')), kategori: '', urut: 0, keterangan: String(r.keterangan || ''),
    bagian: [{ r: r, b: null }] };
}

/** Ringkasan tersimpan satu bagian: dari ringkasan sub data, atau dari baris Katalog untuk tab utuh. */
function statBagian_(x) {
  var r = x.r, b = x.b;
  if (!b) {
    return { n: Number(r.jumlah_baris) || 0, tahun: [Number(r.tahun_awal) || null, Number(r.tahun_akhir) || null],
      titik: r.jumlah_titik === '' || r.jumlah_titik === undefined ? null : Number(r.jumlah_titik) || 0,
      kolom: r.daftarKolom || [], faset: r.isiFaset || {} };
  }
  var t = Array.isArray(b.tahun) ? b.tahun : [];
  return { n: Number(b.n) || 0, tahun: [Number(t[0]) || null, Number(t[1]) || null], titik: Number(b.titik) || 0,
    kolom: Array.isArray(b.kolom) ? b.kolom : r.daftarKolom || [], faset: b.faset || {} };
}

/**
 * Gabungan bagian satu data untuk katalog hub: jumlah baris, rentang tahun, kolom terisi yang boleh dilihat, pilihan
 * saring, dan tanda berkoordinat. Bagian dari tab khusus admin dilewati untuk akun pegawai; bila semua bagian khusus
 * admin, datanya terkunci.
 */
function gabungBagian_(M, sesi, bagian, zona) {
  var buka = bagian.filter(function (x) { return !terkunci_(x.r, sesi); }), pakai = buka.length ? buka : bagian;
  var o = { jumlah: 0, tahun: [null, null], diperbarui: '', terkunci: !buka.length, asal: [] };
  var kolom = [], ada = {}, faset = {}, admin = {}, titik = 0, titikTahu = true;
  pakai.forEach(function (x) {
    var s = statBagian_(x), w = waktuTeks_(x.r.diperbarui, zona);
    o.jumlah += s.n;
    if (s.tahun[0] && (!o.tahun[0] || s.tahun[0] < o.tahun[0])) o.tahun[0] = s.tahun[0];
    if (s.tahun[1] && (!o.tahun[1] || s.tahun[1] > o.tahun[1])) o.tahun[1] = s.tahun[1];
    if (w > o.diperbarui) o.diperbarui = w;
    if (o.asal.indexOf(x.r.id) < 0) o.asal.push(x.r.id);
    if (o.terkunci) return;
    var tolak = kolomTolak_(M, x.r, s.kolom, sesi);
    s.kolom.forEach(function (h) {
      if (tolak[h] === 'admin') admin[h] = true;
      else if (!tolak[h] && !ada[h]) { ada[h] = true; kolom.push(h); }
    });
    Object.keys(s.faset).forEach(function (f) {
      if (f !== 'Tahun' && FASET_UNDUH.indexOf(f) < 0) return;
      var t = faset[f] = faset[f] || {};
      Object.keys(s.faset[f]).forEach(function (v) { t[v] = (t[v] || 0) + (Number(s.faset[f][v]) || 0); });
    });
    if (s.titik === null) titikTahu = false; else titik += s.titik;
  });
  if (!o.terkunci) {
    o.kolom = kolom;
    o.faset = faset;
    o.waktu = !!(ada.Tanggal || ada.Tahun);
    o.titik = !!(ada.X && ada.Y) && (!titikTahu || titik > 0);
    o.khususAdmin = Object.keys(admin);
  }
  return o;
}

function dataKosong_(id, induk, kategori, judul, urut) {
  return { id: id, jenis: 'sub', judul: judul, induk: induk, kategori: kategori, urut: urut, keterangan: '', jumlah: 0,
    tahun: [null, null], diperbarui: '', terkunci: false, asal: [], kolom: [], faset: {}, waktu: false, titik: false, khususAdmin: [] };
}

function isiData_(M, sesi, d, zona) {
  var g = gabungBagian_(M, sesi, d.bagian, zona), k;
  delete d.bagian;
  for (k in g) d[k] = g[k];
  return d;
}

/**
 * Daftar data untuk hub, tersusun induk > kategori > sub data: sub data peta konsep, baris "Lainnya" per tab rekap,
 * dan data pendukung (tab di luar data model) di bawah induknya. m.versi >= 2 (hub baru): sub data yang belum
 * berisi data ikut dikirim agar tampil sebagai "Belum ada data". Hub lama hanya menerima data yang berisi.
 */
function katalogUntuk_(M, sesi, m) {
  var zona = M.ss.getSpreadsheetTimeZone(), versi = Number(m && m.versi) || 1;
  var sub = {}, urutId = [], sembunyi = {}, data = [], akhir = '';
  katalogTersimpan_(M).forEach(function (r) {
    var boleh = bolehLihat_(r);
    if (r.daftarSub.length) {
      r.daftarSub.forEach(function (b) {
        if (!boleh) { sembunyi[b.id] = true; return; }
        if (!sub[b.id]) { sub[b.id] = []; urutId.push(b.id); }
        sub[b.id].push({ r: r, b: b });
      });
    } else if (boleh && Number(r.jumlah_baris) > 0) data.push(isiData_(M, sesi, dataDariTab_(r), zona));
  });
  urutId.forEach(function (id) { data.push(isiData_(M, sesi, dataDariBagian_(id, sub[id].sort(urutBagian_)), zona)); });
  if (versi >= 2) {
    var idUntuk = pembuatIdSub_();
    SUB_DATA.forEach(function (s, i) {
      var id = idUntuk(s[0], s[1], s[2]);
      if (sub[id] || sembunyi[id]) return;
      sub[id] = [];
      data.push(dataKosong_(id, indukTampil_(s[0]), s[1], s[2], i));
    });
    // Tabel survei metode teknis baru menjadi tab saat datanya masuk; sebelum itu kategorinya tetap terlihat.
    if (!data.some(function (d) { return d.kategori === KATEGORI_SURVEI_UNDUH; })) {
      data.push(dataKosong_(ID_SURVEI_KOSONG, 'kehati', KATEGORI_SURVEI_UNDUH, 'Tabel survei metode teknis', urutSurvei_() + 0.0005));
    }
  } else data = data.filter(function (d) { return d.jumlah > 0; });
  data.forEach(function (d) {
    d.tema = M.induk[d.induk] ? String(M.induk[d.induk].nama || d.induk) : 'Lainnya';
    if (d.diperbarui > akhir) akhir = d.diperbarui;
  });
  var tema = M.urutInduk.filter(function (k) { return !INDUK_GABUNG_UNDUH[k]; }).map(function (k) {
    return { kode: k, nama: String(M.induk[k].nama || k), warna: String(M.induk[k].warna || '') };
  });
  return { ok: true, versi: 2, nama: sesi.nama, peran: sesi.peran, tema: tema, dataset: data, diperbarui: akhir };
}

function kepalaTab_(sh) {
  var lc = sh.getLastColumn();
  return lc ? sh.getRange(1, 1, 1, lc).getValues()[0].map(function (x) { return String(x).trim(); }) : [];
}

/**
 * Baris satu bagian yang lolos saringan dan cocok dengan sub datanya: {sh, n, kepala, tolak, indeks, diabaikan, iLain,
 * admin}, atau null bila tabnya tidak ada lagi.
 */
function saringBagian_(M, sesi, x, saring, zona, memo) {
  var sh = bukaTabKatalog_(M, x.r);
  if (!sh) return null;
  var kk = 'kepala|' + x.r.id, kepala = memo[kk] || (memo[kk] = kepalaTab_(sh));
  var tolak = kolomTolak_(M, x.r, kepala, sesi), lewati = {};
  kepala.forEach(function (h, i) { if (tolak[h]) lewati[i] = true; });
  var privasi = { lewati: lewati, iLain: kepala.indexOf('Atribut lain'), admin: sesi.peran === 'admin' ? null : daftarAdmin_(M, x.r) };
  var n = Math.max(0, sh.getLastRow() - 1);
  var h = saringTab_(sh, kepala, n, saring, zona, x.b ? pencocokTersimpan_(x.b, x.r.daftarSub) : null, privasi, memo);
  h.sh = sh;
  h.n = n;
  h.kepala = kepala;
  h.tolak = tolak;
  h.iLain = privasi.iLain;
  h.admin = privasi.admin;
  return h;
}

/** Jumlah baris yang lolos saringan untuk beberapa data sekaligus (pratinjau di hub). */
function hitungUnduh_(M, sesi, m) {
  var zona = M.ss.getSpreadsheetTimeZone(), mulai = Date.now(), cache = CacheService.getScriptCache(), hasil = [], belum = [];
  var saringTeks = JSON.stringify(m.saring || {}), memo = {};
  (Array.isArray(m.dataset) ? m.dataset : []).forEach(function (id, urutan) {
    if (urutan >= 150 || Date.now() - mulai > 25000) { belum.push(String(id)); return; }
    var d = cariData_(M, id);
    if (!d) return;
    var bagian = d.bagian.filter(function (x) { return !terkunci_(x.r, sesi); });
    if (!bagian.length) return;
    var kunci = 'hitung_' + md5_([d.id, saringTeks, sesi.peran, SUB_VERSI].concat(bagian.map(function (x) {
      return x.r.id + ':' + x.r.jumlah_baris + ':' + waktuTeks_(x.r.diperbarui, zona);
    })).join('|'));
    var ada = cache.get(kunci);
    if (ada) { hasil.push(JSON.parse(ada)); return; }
    var o = { id: d.id, jumlah: 0, diabaikan: [] };
    bagian.forEach(function (x) {
      var h = saringBagian_(M, sesi, x, m.saring, zona, memo);
      if (!h) return;
      o.jumlah += h.indeks.length;
      h.diabaikan.forEach(function (k) { if (o.diabaikan.indexOf(k) < 0) o.diabaikan.push(k); });
    });
    try { cache.put(kunci, JSON.stringify(o), 600); } catch (e) { /* cache penuh */ }
    hasil.push(o);
  });
  return { ok: true, hasil: hasil, belum: belum };
}

/**
 * Satu halaman baris data yang lolos saringan. Halaman berikutnya diminta dengan awal = berikut.
 * Sub data dari beberapa tab digabung berurutan; kolomnya gabungan kolom yang terisi di tiap bagian.
 */
function ambilUnduh_(M, sesi, m) {
  var d = cariData_(M, m.id);
  if (!d) return { ok: false, galat: 'Data tidak ditemukan. Muat ulang halaman Unduh Data.' };
  var bagian = d.bagian.filter(function (x) { return !terkunci_(x.r, sesi); });
  if (!bagian.length) return { ok: false, galat: 'Data ini khusus akun admin.' };
  var zona = M.ss.getSpreadsheetTimeZone(), memo = {}, pilih = Array.isArray(m.kolom) && m.kolom.length ? m.kolom.map(String) : null;
  var kolom = [], adaKolom = {}, khusus = {}, diabaikan = [], total = 0, siap = [];
  bagian.forEach(function (x) {
    var h = saringBagian_(M, sesi, x, m.saring, zona, memo);
    if (!h) return;
    // Kolom yang terisi menurut Katalog; bila Katalog belum mencatat isi bagian ini, semua kolom tab.
    var simpan = statBagian_(x).kolom.filter(function (k) { return h.kepala.indexOf(k) >= 0; });
    var dasar = simpan.length ? simpan : h.indeks.length ? h.kepala.filter(String) : [];
    dasar.forEach(function (k) {
      if (h.tolak[k] === 'admin') khusus[k] = true;
      else if (!h.tolak[k] && !adaKolom[k] && (!pilih || pilih.indexOf(k) >= 0)) { adaKolom[k] = true; kolom.push(k); }
    });
    h.diabaikan.forEach(function (k) { if (diabaikan.indexOf(k) < 0) diabaikan.push(k); });
    total += h.indeks.length;
    siap.push(h);
  });
  if (!siap.length) return { ok: false, galat: 'Tab data "' + bagian[0].r.tab + '" tidak ada lagi. Minta admin memperbarui katalog.' };
  var ukuran = Math.max(HALAMAN_MIN, Math.min(HALAMAN_MAKS, Math.floor(SEL_PER_HALAMAN / Math.max(1, kolom.length))));
  var awal = Math.max(0, Math.floor(Number(m.awal) || 0)), lompat = awal, sisa = ukuran, baris = [];
  siap.forEach(function (h) {
    var n = h.indeks.length;
    if (lompat >= n) { lompat -= n; return; }
    if (sisa <= 0) return;
    var potong = h.indeks.slice(lompat, lompat + sisa);
    lompat = 0;
    sisa -= potong.length;
    var peta = kolom.map(function (k) { return h.kepala.indexOf(k); });
    var a = potong[0], b = potong[potong.length - 1], semua = memo[kunciLembar_(h.sh) + '|' + h.n + '|semua'];
    var blok = semua ? null : h.sh.getRange(2 + a, 1, b - a + 1, h.kepala.length).getValues();
    potong.forEach(function (r) {
      var row = semua ? semua[r] : blok[r - a];
      baris.push(peta.map(function (i) {
        if (i < 0) return '';
        var v = row[i];
        if (i === h.iLain && h.admin && v) v = bersihAtributLain_(v, h.admin);
        return selKeluar_(v, zona);
      }));
    });
  });
  if (!awal && !m.uji) catatUnduh_(M, sesi, d, m, total);
  var lanjut = awal + baris.length;
  return { ok: true, id: d.id, judul: d.judul, induk: d.induk, kategori: d.kategori, kolom: kolom, baris: baris, jumlah: total,
    awal: awal, berikut: lanjut < total ? lanjut : null, diabaikan: diabaikan, khususAdmin: Object.keys(khusus) };
}

function catatUnduh_(M, sesi, kat, m, jumlah) {
  try {
    var sh = M.ss.getSheetByName(LEMBAR.logUnduh);
    if (!sh) {
      sh = M.ss.insertSheet(LEMBAR.logUnduh, M.ss.getSheets().length);
      sh.getRange(1, 1, 1, KOLOM_LOG_UNDUH.length).setValues([KOLOM_LOG_UNDUH]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    var judul = String(kat.judul || kat.tab), nama = kat.kategori && kat.kategori !== judul ? kat.kategori + ' > ' + judul : judul;
    sh.appendRow([new Date(), sesi.u, sesi.peran, amanSel_(nama), amanSel_(JSON.stringify(m.saring || {}).slice(0, 1000)),
      jumlah, String(m.format || '')]);
  } catch (e) { /* catatan tidak boleh menggagalkan unduhan */ }
}

/**
 * Periksa token sesi ke Tanya Data. Hasil disimpan 10 menit. Tanya Data versi lama (belum punya aksi "siapa")
 * diperiksa lewat aksi "sisa": sesi yang sah dianggap pegawai, jadi kolom khusus admin tetap tertutup.
 */
function cekSesi_(M, token) {
  if (!token || !/^[a-f0-9]{64}$/.test(String(token))) return null;
  var cache = CacheService.getScriptCache(), kunci = 'sesi_unduh_' + md5_(String(token)), ada = cache.get(kunci);
  if (ada) return JSON.parse(ada);
  var url = String(M.atur.URL_TANYA_DATA || '').trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) return null;
  var tanya = function (aksi) {
    try {
      var r = UrlFetchApp.fetch(url, { method: 'post', contentType: 'text/plain;charset=utf-8', muteHttpExceptions: true,
        followRedirects: true, payload: JSON.stringify({ aksi: aksi, token: token }) });
      return JSON.parse(r.getContentText());
    } catch (e) { return null; }
  };
  var h = tanya('siapa'), sesi = null;
  if (h && h.ok && h.u) sesi = { u: String(h.u), nama: String(h.nama || h.u), peran: h.peran === 'admin' ? 'admin' : 'pegawai' };
  else if (h && h.masukLagi) return null;
  else {
    var s = tanya('sisa');
    if (s && s.ok) sesi = { u: 'pegawai', nama: 'Pegawai', peran: 'pegawai' };
  }
  if (sesi) cache.put(kunci, JSON.stringify(sesi), 600);
  return sesi;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, layanan: 'Unduh Data Satu Data Tambora' });
}

function doPost(e) {
  var m;
  try { m = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, galat: 'Permintaan tidak dikenali.' }); }
  try {
    var M = muatRingan_(), sesi = cekSesi_(M, m.token);
    if (!sesi) return json_({ ok: false, galat: 'Sesi berakhir. Silakan masuk lagi.', masukLagi: true });
    if (m.aksi === 'katalog') return json_(katalogUntuk_(M, sesi, m));
    if (m.aksi === 'hitung') return json_(hitungUnduh_(M, sesi, m));
    if (m.aksi === 'unduh') return json_(ambilUnduh_(M, sesi, m));
    return json_({ ok: false, galat: 'Aksi tidak dikenal.' });
  } catch (err) {
    console.error(err && err.stack || err);
    return json_({ ok: false, galat: 'Terjadi galat di server: ' + (err && err.message || err) });
  }
}

/** Menu "Uji Unduh Data": katalog, satu halaman data, sambungan ke Tanya Data, dan alamat aplikasi web. */
function ujiUnduhData() {
  var M = muatRingan_(), sesi = { u: 'uji', nama: 'Uji', peran: 'admin' }, pesan = [];
  var kat = katalogUntuk_(M, sesi, { versi: 2 }), jenis = function (j) { return kat.dataset.filter(function (x) { return x.jenis === j; }); };
  var sub = jenis('sub').filter(function (x) { return x.id !== ID_SURVEI_KOSONG; }), berisi = sub.filter(function (x) { return x.jumlah > 0; }), lain = jenis('lainnya');
  pesan.push(sub.length + ' sub data peta konsep (' + berisi.length + ' berisi data), ' + jenis('pendukung').length + ' data pendukung' +
    (lain.length ? ', ' + lain.length + ' kelompok Lainnya (kategori di luar peta konsep)' : '') + '.');
  var d = berisi[0] || kat.dataset.filter(function (x) { return x.jumlah > 0; })[0];
  if (d) {
    var u = ambilUnduh_(M, sesi, { id: d.id, saring: {}, awal: 0, uji: true });
    pesan.push(u.ok ? 'Contoh "' + d.judul + '": ' + u.jumlah + ' baris, ' + u.kolom.length + ' kolom, halaman pertama ' + u.baris.length + ' baris.' :
      'Contoh "' + d.judul + '" gagal: ' + u.galat);
  }
  var url = String(M.atur.URL_TANYA_DATA || '').trim();
  if (!url) pesan.push('URL_TANYA_DATA di Pengaturan masih kosong, jadi login hub belum bisa diperiksa.');
  else {
    try {
      var r = JSON.parse(UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true }).getContentText());
      pesan.push(r.ok ? 'Tanya Data tersambung untuk memeriksa login.' : 'Tanya Data menjawab galat.');
    } catch (e) { pesan.push('Tanya Data tidak bisa dihubungi: ' + e.message); }
  }
  var web = '';
  try { web = ScriptApp.getService().getUrl(); } catch (e) { web = ''; }
  pesan.push(web ? 'Alamat aplikasi web: ' + web : 'Aplikasi web belum diterapkan (Terapkan > Deployment baru > Aplikasi web).');
  try { SpreadsheetApp.getUi().alert('Uji Unduh Data', pesan.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { Logger.log(pesan.join('\n')); }
  return pesan;
}
