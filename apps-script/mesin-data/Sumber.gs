/**
 * Mesin Data Satu Data Tambora – sumber data selain file patroli
 *
 * Data sebelum 2027 dan data tab lain Satu Data Tambora masuk ke tab yang sama dengan data patroli, mengikuti alur peta
 * konsep ("Sumber sebelum 2027" -> penghubung). Satu baris lembar "Sumber" = satu sumber:
 *   kode, nama, jenis (nama pengimpor di bawah), alamat (URL atau ID spreadsheet, beberapa dipisah " | "),
 *   tab_tujuan, induk, aktif (ya/tidak), akses_unduh (pegawai, admin, atau tidak: bawaan akses tab sumber ini di
 *   Katalog; untuk sumber yang mengikuti Rute, "admin" berarti barisnya di tab rekap hanya terlihat oleh admin),
 *   catatan; kolom diperbarui, baris, status, sidik diisi skrip.
 * Sumber yang isinya tidak berubah sejak pembaruan terakhir dilewati (kolom sidik). Kosongkan sel sidik untuk memaksa
 * satu sumber dibaca ulang.
 * Alamat boleh memakai {HUB} dan {PAGES} (lembar Pengaturan URL_HUB dan URL_PAGES).
 *
 * Peta konsep 2027 (perbaikan Deo 27-11-2026): setiap sumber diseragamkan ke kategori dan atribut data model 2027
 * (kolom Kategori 0/1/2, Kode kategori, dan judul kolom = label atribut) lalu masuk ke salah satu dari 12 rekap, sama
 * seperti baris dari file patroli. Tidak ada lagi tab terpisah untuk data yang data modelnya sama (tenurial, kelompok
 * binaan, titik panas, delineasi, drone, kegiatan RBM). Yang tetap terpisah hanya lembar acuan (Daftar Jenis Kehati,
 * Daftar Kelompok Binaan, Rencana RBM 2026), bukan data temuan.
 *
 * Setiap sumber mengganti baris miliknya sendiri (kolom Sumber) tiap diperbarui; baris sumber lain di tab yang sama
 * tidak disentuh. Titik patroli yang sama dari dua sumber (file patroli, Dashboard SMART, rekap spreadsheet) hanya
 * dicatat sekali lewat kolom "Kunci titik" (tanggal, jam, koordinat 5 desimal).
 */

var KOLOM_LEMBAR_SUMBER = ['kode', 'nama', 'jenis', 'alamat', 'tab_tujuan', 'induk', 'aktif', 'akses_unduh', 'catatan',
  'diperbarui', 'baris', 'status', 'sidik'];

/** Naikkan bila cara olah sumber berubah, agar semua sumber dibaca ulang sekali. */
var VERSI_PENGIMPOR = '2026-11-28';
/** Pengimpor yang selalu dibaca ulang (isinya dari API yang tidak bisa disidik dari alamatnya). */
var SELALU_BACA = { rbm: true };

var LABEL_SUMBER = {
  smart_dashboard: 'Patroli 2026 (Dashboard SMART)',
  smart_rekap: 'Rekap SMART (spreadsheet)',
  lpk_peh: 'LPK teknis PEH',
  penyuluhan: 'Laporan penyuluhan',
  kelompok: 'Laporan penyuluhan (kondisi kelompok)',
  pulbaket: 'Pulbaket tenurial',
  rbm: 'Form Laporan RBM',
  titik_panas: 'Titik panas (hotspot)',
  areal_terbakar: 'Delineasi areal terbakar',
  drone: 'Flight SMART',
  register_lpk: 'Register kegiatan LPK PEH',
  smart_kehati: 'Temuan kehati SMART (Data Masuk Kehati)'
};

var KAT_KEHATI = {
  // jenis temuan Data Masuk Kehati -> kategori data model 2027
  satwa: { perjumpaan: 'satwaliar.perjumpaansatwa.', 'daftar jenis laporan': 'satwaliar.perjumpaansatwa.',
    tanda: 'satwaliar.jejaksatwa.', sarang: 'satwaliar.jejaksatwa.', 'satwa mati': 'satwaliar.satwamati.' },
  // tingkat tumbuh di petak vegetasi -> Survey Kehati > Plot Vegetasi
  plot: { semai: 'surveykehati.plotvegetasi.semai2x2meter.', 'semai/tumbuhan bawah': 'surveykehati.plotvegetasi.semai2x2meter.',
    pancang: 'surveykehati.plotvegetasi.pancang5x5meter.', tiang: 'surveykehati.plotvegetasi.tiang10x10meter.',
    pohon: 'surveykehati.plotvegetasi.pohon20x20meter.' },
  kelompok: { Aves: 'Burung', Mamalia: 'Mamalia', Flora: 'Tumbuhan', Anggrek: 'Anggrek', 'Fauna lain': 'Fauna lain',
    'Belum terkelompok': 'Belum terkelompok' }
};

/* =========================== menu =========================== */

function perbaruiSemuaSumber() {
  var kunci = LockService.getScriptLock();
  if (!kunci.tryLock(5000)) { kabari_('Proses lain masih berjalan.'); return; }
  try {
    var M = muatMesin_();
    samakanZona_(M.ss);
    var hasil = jalankanSumber_(M);
    perbaruiKatalog_(M);
    kabari_(hasil.ok + ' sumber diperbarui, ' + hasil.baris + ' baris ditulis' + (hasil.tetap ? ', ' + hasil.tetap + ' tidak berubah' : '') +
      (hasil.gagal ? ', ' + hasil.gagal + ' gagal (lihat lembar Sumber)' : '') + '.');
  } finally {
    kunci.releaseLock();
  }
}

/** Jalankan semua sumber aktif berurutan. opsi.kode: hanya sumber itu; opsi.semua: termasuk yang tidak aktif. */
function jalankanSumber_(M, opsi) {
  opsi = opsi || {};
  var sh = M.ss.getSheetByName(LEMBAR.sumber);
  if (!sh) throw new Error('Lembar "Sumber" tidak ada.');
  var v = sh.getDataRange().getValues(), h = v[0].map(String), hasil = { ok: 0, gagal: 0, baris: 0, tetap: 0 };
  if (h.indexOf('sidik') < 0) { sh.getRange(1, h.length + 1).setValue('sidik').setFontWeight('bold'); h.push('sidik'); }
  var mulai = Date.now(), batas = Number(M.atur.BATAS_WAKTU_DETIK || 270) * 1000;
  for (var i = 1; i < v.length; i++) {
    var s = {};
    h.forEach(function (k, j) { s[k] = typeof v[i][j] === 'string' ? v[i][j].trim() : v[i][j]; });
    if (!s.kode || !s.jenis) continue;
    s.tab_tujuan = tabTujuan_(s);
    if (opsi.kode && s.kode !== opsi.kode) continue;
    if (!opsi.kode && !opsi.semua && String(s.aktif).toLowerCase() !== 'ya') continue;
    if (Date.now() - mulai > batas) { tandaiSumber_(sh, h, i + 1, { status: 'lanjut putaran berikutnya' }); continue; }
    var f = PENGIMPOR[s.jenis], n = '', sidik = '';
    AMBILAN_ = {};
    try { sidik = f ? sidikSumber_(M, s) : ''; } catch (e) { sidik = ''; }
    if (sidik && sidik === String(s.sidik || '') && /^OK/.test(String(s.status || ''))) {
      tandaiSumber_(sh, h, i + 1, { status: 'OK (tidak berubah, diperiksa ' + Utilities.formatDate(new Date(), ZONA, 'dd/MM/yyyy HH.mm') + ')' });
      hasil.tetap++;
      continue;
    }
    try {
      if (!f) throw new Error('jenis "' + s.jenis + '" tidak dikenal');
      n = f(M, s);
      hasil.ok++;
      hasil.baris += Number(n) || 0;
      tandaiSumber_(sh, h, i + 1, { diperbarui: new Date(), baris: n, status: 'OK', sidik: sidik });
    } catch (e) {
      hasil.gagal++;
      tandaiSumber_(sh, h, i + 1, { diperbarui: new Date(), baris: '', status: 'GAGAL: ' + String(e && e.message || e).slice(0, 300), sidik: '' });
    }
  }
  AMBILAN_ = {};
  return hasil;
}

/** Kolom tab_tujuan; keterangan dalam kurung, misalnya "(mengikuti Rute)", berarti tab dipilih pengimpor. */
function tabTujuan_(s) {
  var t = String(s.tab_tujuan || '').trim();
  return /^\(/.test(t) ? '' : t;
}

function tandaiSumber_(sh, h, baris, isi) {
  Object.keys(isi).forEach(function (k) {
    var j = h.indexOf(k);
    if (j >= 0) sh.getRange(baris, j + 1).setValue(amanSel_(isi[k]));
  });
}

/** Sidik lembar kendali yang menentukan hasil olahan: Rute, Mandat, Kamus Jenis, Alih Kunci, Ejaan, Label, Pengaturan. */
function sidikKendali_(M) {
  if (M.sidikKendali) return M.sidikKendali;
  var ejaan = M.ejaan.map(function (e) { return e.re.source + '>' + e.benar; });
  return (M.sidikKendali = md5_(JSON.stringify([VERSI_PENGIMPOR, M.atur, M.rute, M.mandat, M.alih, ejaan, M.label]) +
    md5_(JSON.stringify(Object.keys(M.kamus).sort().map(function (k) { return [k, M.kamus[k]]; })))));
}

/**
 * Sidik satu sumber: berubah bila isi alamatnya (atau waktu ubah spreadsheet sumber), isi baris Sumber, atau lembar
 * kendali berubah. Kosong = selalu dibaca ulang.
 */
function sidikSumber_(M, s) {
  if (SELALU_BACA[s.jenis]) return '';
  var bagian = [sidikKendali_(M), s.jenis, s.alamat, s.tab_tujuan, s.induk, s.catatan];
  alamat_(M, s).forEach(function (a) {
    try {
      if (/^https?:/i.test(a) && !/\/spreadsheets\/d\/[A-Za-z0-9_-]{20,}/.test(a)) bagian.push(md5_(ambil_(a)));
      else {
        var id = (/\/d\/([A-Za-z0-9_-]+)/.exec(a) || /[?&]id=([A-Za-z0-9_-]+)/.exec(a) || [null, a.split('#')[0].trim()])[1];
        bagian.push(String(DriveApp.getFileById(id).getLastUpdated().getTime()));
      }
    } catch (e) { bagian.push('?'); }
  });
  return md5_(bagian.join('|'));
}

/* =========================== alat bantu =========================== */

function alamat_(M, s) {
  return String(s.alamat || '').split('|').map(function (a) {
    return a.trim().replace('{HUB}', String(M.atur.URL_HUB || 'https://satudatambora.my.id/'))
      .replace('{PAGES}', String(M.atur.URL_PAGES || 'https://kopluck8.github.io/'));
  }).filter(String);
}

/** Isi alamat yang sudah diambil untuk satu sumber (dipakai sidik lalu pengimpor tanpa mengambil dua kali). */
var AMBILAN_ = {};

function ambil_(url) {
  if (AMBILAN_[url] !== undefined) return AMBILAN_[url];
  var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  if (r.getResponseCode() >= 300) throw new Error('HTTP ' + r.getResponseCode() + ' dari ' + url);
  return (AMBILAN_[url] = r.getContentText('UTF-8'));
}
function ambilJson_(url) { return JSON.parse(ambil_(url)); }

/** CSV -> daftar objek {judul kolom: isi}. */
function bacaCsv_(teks) {
  var v = Utilities.parseCsv(String(teks || '').replace(/^﻿/, ''));
  var h = (v.shift() || []).map(function (x) { return String(x).trim(); });
  return v.filter(function (r) { return r.some(function (c) { return c !== ''; }); }).map(function (r) {
    var o = {};
    h.forEach(function (k, i) { if (k) o[k] = r[i] === undefined ? '' : r[i]; });
    return o;
  });
}

var BULAN_INGGRIS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  mei: 5, agu: 8, agt: 8, okt: 10, des: 12 };
function dua_(n) { return (n < 10 ? '0' : '') + n; }

/** Tanggal ekspor SMART ("2026-07-23", "Jul 23, 2026", "23/07/2026", objek Date) -> "YYYY-MM-DD". */
function tanggalIso_(v, zona) {
  if (v instanceof Date) return Utilities.formatDate(v, zona || ZONA, 'yyyy-MM-dd');
  var s = String(v || '').trim(), m;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return m[1] + '-' + dua_(+m[2]) + '-' + dua_(+m[3]);
  if ((m = /^([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})/.exec(s)) && BULAN_INGGRIS[m[1].toLowerCase()]) {
    return m[3] + '-' + dua_(BULAN_INGGRIS[m[1].toLowerCase()]) + '-' + dua_(+m[2]);
  }
  if ((m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(s))) return m[3] + '-' + dua_(+m[2]) + '-' + dua_(+m[1]);
  return '';
}

/** Jam ekspor SMART ("5:17:01 PM", "17:17:01", objek Date jam) -> "HH:MM:SS". */
function jamIso_(v, zona) {
  if (v instanceof Date) return Utilities.formatDate(v, zona || ZONA, 'HH:mm:ss');
  var m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?/.exec(String(v || '').trim());
  if (!m) return '';
  var j = +m[1];
  if (m[4]) { var pm = /p/i.test(m[4]); if (j === 12) j = pm ? 12 : 0; else if (pm) j += 12; }
  return dua_(j) + ':' + m[2] + ':' + (m[3] || '00');
}

function angkaAtauKosong_(v) {
  if (v === '' || v === null || v === undefined) return '';
  var f = Number(String(v).replace(',', '.'));
  return isNaN(f) ? '' : f;
}

function tanggalDari_(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : '';
}

/** Isi kolom waktu baku (Tanggal, Tahun, Bulan) dari teks ISO; tahun/bulan cadangan bila tanggal kosong. */
function waktuBaku_(b, iso, tahun, bulan) {
  var d = tanggalDari_(iso);
  b['Tanggal'] = d;
  b['Tahun'] = d ? d.getFullYear() : (Number(tahun) || '');
  b['Bulan'] = d ? d.getMonth() + 1 : (Number(bulan) || '');
  return b;
}

/** Resor 2026 dari koordinat, cadangan dari nama resor di sumber; ikut isi SPTN. */
function resorBaku_(M, b, x, y, namaAsal) {
  var r = typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y) ? cariResor_(M, x, y) : '';
  b['Resor'] = r || namaResor_(namaAsal);
  b['SPTN'] = sptnResor_(M, b['Resor']);
  return b;
}

/** Titik tengah sederhana (rata-rata titik cincin luar) untuk poligon dan multipoligon GeoJSON. */
function titikTengah_(geom) {
  if (!geom) return [NaN, NaN];
  if (geom.type === 'Point') return geom.coordinates;
  var cincin = geom.type === 'Polygon' ? geom.coordinates[0] : geom.type === 'MultiPolygon' ? geom.coordinates[0][0] :
    geom.type === 'LineString' ? geom.coordinates : geom.type === 'MultiLineString' ? geom.coordinates[0] : [];
  if (!cincin.length) return [NaN, NaN];
  var sx = 0, sy = 0;
  cincin.forEach(function (c) { sx += c[0]; sy += c[1]; });
  return [Math.round(sx / cincin.length * 1e6) / 1e6, Math.round(sy / cincin.length * 1e6) / 1e6];
}

/** Buka spreadsheet sumber; pesan galat menjelaskan langkah bila berkasnya .xlsx atau belum dibagikan. */
function bukaSpreadsheet_(id) {
  try {
    return SpreadsheetApp.openById(id);
  } catch (e) {
    throw new Error('spreadsheet ' + id + ' tidak bisa dibuka (' + e.message + '). Pastikan akun pemasang skrip punya akses. ' +
      'Bila berkasnya .xlsx, buka lalu File > Simpan sebagai Google Spreadsheet dan tempel ID barunya di kolom alamat.');
  }
}

function penghubung_(M, id) {
  var r = M.rute.filter(function (x) { return x.penghubung === id; })[0];
  if (!r) throw new Error('Penghubung "' + id + '" tidak ada di lembar Rute.');
  return { tab: r.tab, induk: r.induk };
}

/* =========================== penyeragaman ke data model 2027 =========================== */

/**
 * Isi kolom kategori dan atribut satu baris mengikuti data model 2027. nilai: {kunci atribut: nilai}; nilai berbentuk
 * {k: 'kunci'} diganti label nilai data model (LIST/TREE), larik {k: [..]} untuk MLIST. Nilai kosong dilewati.
 */
function isiDM_(M, b, hkey, nilai) {
  var kat = labelKategori_(M, hkey);
  b['Kategori 0'] = kat[0] || ''; b['Kategori 1'] = kat[1] || ''; b['Kategori 2'] = kat.slice(2).join(' > ');
  b['Kode kategori'] = hkey;
  Object.keys(nilai || {}).forEach(function (ak) {
    var v = nilai[ak];
    if (v === '' || v === null || v === undefined) return;
    if (typeof v === 'object' && !(v instanceof Date)) {
      var ks = [].concat(v.k).filter(function (x) { return x; });
      if (!ks.length) return;
      v = ks.map(function (k) { return labelNilai_(M, ak, k); }).join(', ');
    }
    b[judulAtribut_(M, ak)] = v;
  });
  return b;
}

/** Tab tujuan (rute kategori pertama) untuk satu kunci kategori data model. */
function tujuanKategori_(M, hkey) {
  var r = cariRute_(M, hkey, '', null)[0];
  if (!r) throw new Error('kategori ' + hkey + ' belum punya rute di lembar Rute');
  return { tab: r.tab, induk: r.induk };
}

/** Kelompokkan baris per tab tujuan kategorinya lalu ganti baris milik sumber di tiap tab. */
function tulisDM_(M, label, baris, opsi) {
  var perTab = {}, n = 0;
  baris.forEach(function (b) {
    var t = tujuanKategori_(M, b['Kode kategori']), k = t.induk + '|' + t.tab;
    (perTab[k] = perTab[k] || { t: t, baris: [] }).baris.push(b);
  });
  Object.keys(perTab).forEach(function (k) {
    var x = perTab[k];
    n += gantiSumber_(M, x.t.induk, x.t.tab, label, KOLOM_DEPAN, x.baris, opsi || { jenis: KOLOM_JENIS, belakang: KOLOM_BELAKANG });
  });
  return n;
}

/** Baris ringkasan leg/kegiatan untuk Rekap Upaya Patroli (TAB_UPAYA) dari sumber selain file patroli. */
function tulisUpaya_(M, label, baris) {
  return gantiSumber_(M, 'rbm', String(M.atur.TAB_UPAYA || 'Rekap Upaya Patroli'), label, KOLOM_UPAYA, baris);
}

/** Jenis kegiatan RBM baku (atribut tmbjeniskegiatanrbm) dari nama kegiatan rencana RBM 2026. */
var ATURAN_JENIS_RBM = [
  [/^perlindungan/i, [[/gabungan/i, 'patroligabungan'], [/karhut|kebakaran|\bapi\b/i, 'patrolidanpengendaliankebakaranhutan'],
    [/papan|himbauan|informasi/i, 'pemasanganpapanhimbauandaninformasi'], [/./, 'patrolipengamanankawasan']]],
  [/^penyuluhan/i, [[/monev|evaluasi/i, 'monitoringdanevaluasikelompokbinaan'], [/bantuan|ekonomi produktif/i, 'bantuanekonomiproduktif'],
    [/pembentukan|kader/i, 'pembentukankelompokdankaderkonservasi'], [/kemitraan|kesepakatan/i, 'kemitraankonservasi'],
    [/school|tgs|sekolah|pramuka|cinta alam|edukasi/i, 'edukasikonservasitgssekolahalambinacintaalampramuka'],
    [/promosi|publikasi|qris|media sosial/i, 'promosidanpublikasiwisatanonlapangan'],
    [/potensi|kearifan|hhbk|identifikasi|budaya/i, 'identifikasipotensidesakearifanlokaldanhhbk'],
    [/pendampingan|pemandu|porter|kelompok|binaan/i, 'pendampingankelompokbinaanpemandudanporter'],
    [/./, 'sosialisasidananjangsana']]],
  [/^keanekaragaman/i, [[/sanctuary/i, 'pengelolaansanctuaryrusatimor'], [/elang|rusa|satwa kunci/i, 'monitoringsatwakuncielangfloresdanrusatimor'],
    [/kamera|camera/i, 'kamerajebak'], [/herbarium|insectarium|persemaian|demplot|label|koleksi|anggrek/i, 'koleksipersemaiandandemplot'],
    [/pemulihan|rehabilitasi|penanaman/i, 'pemulihanekosistem'], [/./, 'inventarisasidanmonitoringkehati']]],
  [/^umum/i, [[/sampah/i, 'penanganansampah'], [/pos|pengunjung|pelayanan|pendaki/i, 'penjagaanposdanpelayananpengunjung'],
    [/jalur|sarana|prasarana|pemeliharaan|penataan/i, 'penataanjalurdanpemeliharaansaranaprasarana'],
    [/./, 'keselamatanlayanandanadministrasiresornonlapangan']]]
];

function jenisRbm_(indikator, kegiatan) {
  for (var i = 0; i < ATURAN_JENIS_RBM.length; i++) {
    if (!ATURAN_JENIS_RBM[i][0].test(indikator || '')) continue;
    var a = ATURAN_JENIS_RBM[i][1];
    for (var j = 0; j < a.length; j++) if (a[j][0].test(kegiatan || '')) return kunci_(indikator) + '.' + a[j][1] + '.';
  }
  return '';
}

/** Laporan penyuluhan (jenis_kegiatan hub) -> [kategori 1 data model, nilai tmbjeniskegiatanpenyuluhan, topik, jenis kemitraan]. */
var PETA_PENYULUHAN = {
  'Pendampingan kelompok binaan': ['pendampingankelompokbinaan', 'pendampingankelompokbinaan.'],
  'Monitoring & evaluasi kelompok': ['monevkelompokbinaan', 'monitoringdanevaluasikelompokbinaan.'],
  'Penyusunan RPP/RKT/RPM': ['pendampingankelompokbinaan', 'pendampingankelompokbinaan.penyusunanrpprktataurpm.'],
  'Bantuan ekonomi produktif': ['pendampingankelompokbinaan', 'pendampingankelompokbinaan.bantuanekonomiproduktif.'],
  'Pembentukan kelompok': ['tmbpembentukankelompok', 'pembentukankelompokdankaderkonservasi.'],
  'Kader konservasi': ['tmbpembentukankelompok', 'pembentukankelompokdankaderkonservasi.'],
  'Tambora Goes To School': ['tamboragoestoschool', 'edukasikonservasi.tamboragoestoschool.'],
  'Sosialisasi karhutla': ['sosialisasi', 'sosialisasidanpenyadartahuan.sosialisasipencegahankarhutla.', 'karhutla'],
  'Sosialisasi zonasi': ['sosialisasi', 'sosialisasidanpenyadartahuan.sosialisasizonasidanbataskawasan.', 'zonasidanbataskawasan'],
  'Penanganan sampah': ['sosialisasi', 'sosialisasidanpenyadartahuan.penanganansampahbersamamasyarakat.', 'sampah'],
  'Penyadartahuan & sosialisasi lain': ['sosialisasi', 'sosialisasidanpenyadartahuan.penyadartahuankonservasi.', 'konservasiumum'],
  'Kemitraan konservasi': ['tmbkemitraankonservasi', 'kemitraandankesepakatankonservasi.kemitraankonservasi.', '', 'kemitraankonservasi'],
  'Kesepakatan konservasi desa': ['tmbkemitraankonservasi', 'kemitraandankesepakatankonservasi.kesepakatankonservasidesa.', '',
    'kesepakatankonservasidesa'],
  'Pemulihan ekosistem': ['pendampingankelompokbinaan', 'pemulihanekosistembersamamasyarakat.'],
  'Lainnya': ['sosialisasi', 'kegiatanpenyuluhanlainnya.']
};
/** Kategori penyuluhan yang punya atribut Nama desa di data model 2027. */
var PENYULUHAN_DESA = { sosialisasi: 1, anjangsana: 1, identifikasipotensisosialbudaya: 1, tmbkemitraankonservasi: 1, tmbpembentukankelompok: 1 };
var KENDALA_KELOMPOK = [[/modal|dana|biaya/i, 'modal'], [/pasar/i, 'pemasaran'], [/lembaga|organisasi|pengurus/i, 'kelembagaan'],
  [/sarana|alat|peralatan/i, 'sarana'], [/terampil|kapasitas|pelatihan/i, 'keterampilan'], [/produksi|bahan baku/i, 'produksi'],
  [/legal|izin|sk\b/i, 'legalitas'], [/akses|jarak/i, 'akses']];

function kunciKendala_(teks) {
  var k = [];
  String(teks || '').split(/[;,]/).forEach(function (t) {
    for (var i = 0; i < KENDALA_KELOMPOK.length; i++) if (KENDALA_KELOMPOK[i][0].test(t)) { if (k.indexOf(KENDALA_KELOMPOK[i][1]) < 0) k.push(KENDALA_KELOMPOK[i][1]); break; }
  });
  return k;
}

function kunciStatusKelompok_(s) {
  var t = String(s || '').toLowerCase();
  if (/kurang/.test(t)) return 'kurangaktif';
  if (/tidak aktif/.test(t)) return 'tidakaktif';
  if (/baru/.test(t)) return 'barudibentuk';
  if (/situasional/.test(t)) return 'situasional';
  if (/^aktif/.test(t)) return 'aktif';
  return '';
}

/* =========================== ekspor SMART (CSV / spreadsheet) =========================== */

var KOLOM_EKSPOR_INTI = ['Source', 'Waypoint ID', 'Waypoint Date', 'Waypoint Time', 'X', 'Y', 'Comment', 'Last Modified',
  'Last Modified By', 'Observation Category 0', 'Observation Category 1', 'Observation Category 2', 'Observation Group',
  'Resor', 'Resort', 'Nama Resor', 'SPTN', 'Station', 'ST', 'Foto', 'Patrol ID', 'Patrol Leg ID', 'Mandate', 'Mandat',
  'Patrol Mandate'];

/**
 * Judul kolom ekspor dengan garis bawah atau ejaan lain (Waypoint_Date, Observation_Category_0) disamakan dengan judul
 * ekspor SMART biasa. Atribut tidak perlu, karena atributEkspor_ sudah mencocokkan tanpa tanda baca.
 */
function bakuKepalaEkspor_(h) {
  if (!bakuKepalaEkspor_.peta) {
    bakuKepalaEkspor_.peta = {};
    KOLOM_EKSPOR_INTI.forEach(function (k) { bakuKepalaEkspor_.peta[kunci_(k)] = k; });
  }
  h = String(h == null ? '' : h).trim();
  return bakuKepalaEkspor_.peta[kunci_(h)] || h;
}

/** Kunci kategori dari nama kategori ekspor (2027, kantor 2026, atau kunci mentah bila label belum ada). */
function hkeyEkspor_(M, k0, k1, k2) {
  var bagian = [k0, k1, k2].map(function (x) { return String(x || '').trim(); });
  for (var n = 3; n >= 1; n--) {
    var p = bagian.slice(0, n);
    if (!p[n - 1]) continue;
    var hk = M.hkeyLabel[kunci_(p.join(' > '))] || M.hkeyLabel[kunci_(baku_(M, p.join(' > ')))];
    if (hk) return hk;
    if (p.every(function (x) { return /^[a-z0-9]+$/.test(x); })) return p.join('.') + '.';
  }
  return '';
}

/** Kunci atribut dari judul kolom ekspor (label 2027 atau kantor 2026). */
function atributEkspor_(M, judul) {
  if (!M.atributLabel) {
    M.atributLabel = {};
    Object.keys(M.label).forEach(function (k) {
      if (k.indexOf('a|') !== 0) return;
      var kk = kunci_(M.label[k]);
      if (kk && !M.atributLabel[kk]) M.atributLabel[kk] = k.slice(2);
    });
  }
  return M.atributLabel[kunci_(judul)] || '';
}

/**
 * Satu baris ekspor SMART -> baris per tab mengikuti Rute. info: {sumber, awalan, berkas, mandat, st, leg}.
 * Nama kolom atribut diseragamkan ke label 2027 bila dikenali; nama jenis lewat Kamus Jenis (label).
 */
function olahBarisEkspor_(M, r, info, sekarang, zona) {
  var hkey = hkeyEkspor_(M, r['Observation Category 0'], r['Observation Category 1'], r['Observation Category 2']);
  var mandat = info.mandat || r['Mandate'] || r['Mandat'] || r['Patrol Mandate'] || '';
  var jenis = mandat ? jenisKegiatan_(M, mandat) : JENIS_TANPA_MANDAT;
  var berkas = info.berkas || '';
  if (!hkey) { catatTanpaRute_(M, '(label) ' + [r['Observation Category 0'], r['Observation Category 1']].filter(String).join(' > '), '', berkas); return []; }
  var kat = labelKategori_(M, hkey);
  var tglIso = tanggalIso_(r['Waypoint Date'], zona), waktu = jamIso_(r['Waypoint Time'], zona);
  var x = angkaAtauKosong_(r.X), y = angkaAtauKosong_(r.Y);
  var isi = {};
  Object.keys(r).sort().forEach(function (k) { if (k !== 'Last Modified' && k !== 'Last Modified By') isi[k] = r[k] instanceof Date ? r[k].getTime() : r[k]; });
  var dasar = {
    'ID Observasi': info.awalan + md5_(JSON.stringify(isi)).slice(0, 16), 'Sumber': info.sumber, 'Waktu': waktu,
    'Jenis kegiatan': jenis, 'Mandat': mandat, 'ST': info.st || r['ST'] || '', 'Leg': info.leg || '',
    'Kategori 0': kat[0] || '', 'Kategori 1': kat[1] || '', 'Kategori 2': kat.slice(2).join(' > '),
    'Komentar': r['Comment'] || '', 'X': x, 'Y': y, 'Foto': r['Foto'] === undefined ? '' : r['Foto'], 'Kode kategori': hkey,
    'Kunci titik': kunciTitik_(tglIso, waktu, x, y), 'Berkas': berkas, 'Diproses': sekarang
  };
  waktuBaku_(dasar, tglIso);
  resorBaku_(M, dasar, x, y, r['Resor'] || r['Resort'] || r['Nama Resor']);
  if (r['SPTN'] && !dasar['SPTN']) dasar['SPTN'] = r['SPTN'];
  var atr = {}, atrKunci = {}, ada = {}, jenisNama = null;
  Object.keys(r).forEach(function (h) {
    var v = r[h];
    if (KOLOM_EKSPOR_INTI.indexOf(h) >= 0 || h.indexOf('__') === 0 || v === '' || v === null || v === undefined) return;
    var ak = atributEkspor_(M, h), judul = ak ? judulAtribut_(M, ak) : baku_(M, h);
    if (KOLOM_TETAP.indexOf(judul) >= 0) judul += ' (isian patroli)';
    atr[judul] = typeof v === 'string' ? baku_(M, v) : v;
    atrKunci[judul] = ak;
    if (ak) ada[ak] = true;
    if (!jenisNama && ATRIBUT_JENIS.indexOf(ak) >= 0 && typeof v === 'string') {
      var k = M.kamusLabel[kunci_(v)];
      jenisNama = k ? barisKamus_(k, k.atribut + '|' + k.kunci) : namaDariLabel_(v, '', ak + '|(label) ' + v);
    }
  });
  var rute = cariRute_(M, hkey, jenis, ada);
  if (!rute.length) { catatTanpaRute_(M, hkey, kat.join(' > '), berkas); return []; }
  return rute.map(function (rt) {
    var b = {}, k;
    for (k in dasar) b[k] = dasar[k];
    if (jenisNama) for (k in jenisNama) b[k] = jenisNama[k];
    for (k in atr) {
      // rute tanpa atribut lain (rute per atribut, tabel metode teknis ke rekap): hanya kolom atribut rute
      if (!rt.atributLain && rt.atribut.length && rt.atribut.indexOf(atrKunci[k]) < 0) continue;
      b[k] = atr[k];
    }
    return { induk: rt.induk, tab: rt.tab, baris: b, urutAtribut: rt.atribut.map(function (ak) { return judulAtribut_(M, ak); }) };
  });
}

/** Kelompokkan hasil olahBarisEkspor_ per tab lalu tulis (ganti baris milik sumber, atau tambah saja). */
function tulisPerTab_(M, hasil, label, tambahSaja) {
  var perTab = {}, n = 0;
  hasil.forEach(function (r) {
    var k = r.induk + '|' + r.tab;
    (perTab[k] = perTab[k] || { induk: r.induk, tab: r.tab, baris: [], urut: [] }).baris.push(r.baris);
    r.urutAtribut.forEach(function (h) { if (perTab[k].urut.indexOf(h) < 0) perTab[k].urut.push(h); });
  });
  Object.keys(perTab).forEach(function (k) {
    var t = perTab[k], opsi = { jenis: KOLOM_JENIS, atribut: t.urut, belakang: KOLOM_BELAKANG, lewatiTitik: true };
    n += tambahSaja ? tulisTab_(M, t.induk, t.tab, KOLOM_DEPAN, t.baris, opsi) :
      gantiSumber_(M, t.induk, t.tab, label, KOLOM_DEPAN, t.baris, opsi);
  });
  if (!tambahSaja) {
    // Tab yang dulu berisi baris sumber ini tetapi sekarang tidak lagi: bersihkan baris lamanya.
    var semuaTab = tabData_(M);
    Object.keys(semuaTab).forEach(function (nama) {
      var ind = semuaTab[nama];
      if (perTab[ind + '|' + nama]) return;
      var sh;
      try { sh = bukaInduk_(M, ind).getSheetByName(nama); } catch (e) { return; }
      if (sh && adaSumber_(sh, label)) gantiSumber_(M, ind, nama, label, KOLOM_DEPAN, [], {});
    });
  }
  simpanCatatan_(M);
  return n;
}

/** Apakah tab berisi baris dari sumber berlabel ini (hanya kolom Sumber yang dibaca). */
function adaSumber_(sh, label) {
  var n = sh.getLastRow() - 1, lc = sh.getLastColumn();
  if (n < 1 || lc < 1) return false;
  var iS = sh.getRange(1, 1, 1, lc).getValues()[0].map(String).indexOf('Sumber');
  if (iS < 0) return false;
  return sh.getRange(2, iS + 1, n, 1).getValues().some(function (r) { return String(r[0]) === label; });
}

/** Tahun yang dimuat baris sumber berlabel ini di satu tab (dibaca dari kolom Sumber dan Tahun). */
function tahunSumber_(M, kode, nama, label) {
  var sh, hasil = {};
  try { sh = bukaInduk_(M, kode).getSheetByName(nama); } catch (e) { return hasil; }
  if (!sh || sh.getLastRow() < 2) return hasil;
  var h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String), iS = h.indexOf('Sumber'), iT = h.indexOf('Tahun');
  if (iS < 0 || iT < 0) return hasil;
  var n = sh.getLastRow() - 1, s = sh.getRange(2, iS + 1, n, 1).getValues(), t = sh.getRange(2, iT + 1, n, 1).getValues();
  for (var i = 0; i < n; i++) if (String(s[i][0]) === label && t[i][0]) hasil[Number(t[i][0])] = true;
  return hasil;
}

/**
 * Rekap SMART dan Dashboard SMART lebih lengkap daripada salinan temuan kehati SMART di Data Masuk Kehati: baris
 * smart_kehati untuk tahun yang kini dimuat rekap dibuang agar tidak ganda.
 */
function buangTahunKehati_(M, hasil) {
  var tahun = {};
  hasil.forEach(function (r) { if (r.baris['Tahun']) tahun[Number(r.baris['Tahun'])] = true; });
  if (!Object.keys(tahun).length) return;
  var label = LABEL_SUMBER.smart_kehati;
  ['satwa', 'tumbuhan', 'invasif', 'ekosistem'].forEach(function (g) {
    var p;
    try { p = penghubung_(M, g); } catch (e) { return; }
    var t = tabInduk_(M, p.induk, p.tab, KOLOM_DEPAN), n = t.sh.getLastRow() - 1;
    if (n < 1) return;
    var iS = t.kepala.indexOf('Sumber'), iT = t.kepala.indexOf('Tahun');
    if (iS < 0 || iT < 0) return;
    var v = t.sh.getRange(2, 1, n, t.kepala.length).getValues();
    var sisa = v.filter(function (r) { return !(String(r[iS]) === label && tahun[Number(r[iT])]); });
    if (sisa.length === v.length) return;
    t.sh.getRange(2, 1, n, t.kepala.length).clearContent();
    if (sisa.length) t.sh.getRange(2, 1, sisa.length, t.kepala.length).setValues(sisa.map(function (r) { return r.map(amanSel_); }));
    delete M.idAda[p.induk + '|' + p.tab];
    M.diubah[p.tab] = true;
  });
}

/* =========================== pengimpor =========================== */

var PENGIMPOR = {

  /** Data patroli 2026 yang sudah diolah Dashboard SMART dari folder Drive (observasi, leg, jalur). */
  smart_dashboard: function (M, s) {
    var a = alamat_(M, s), label = LABEL_SUMBER.smart_dashboard, sekarang = new Date();
    var obs = bacaCsv_(ambil_(a[0])), legs = a[1] ? bacaCsv_(ambil_(a[1])) : [], jalur = {};
    if (a[2]) {
      try {
        (ambilJson_(a[2]).features || []).forEach(function (f) {
          var p = f.properties || {};
          var g = f.geometry && f.geometry.type === 'LineString' ? [f.geometry.coordinates] :
            f.geometry && f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [];
          jalur[p.ST + '|' + p.Leg + '|' + p['Tanggal mulai']] = g;
        });
      } catch (e) { /* jalur tidak wajib */ }
    }
    var legInfo = {}, mandatST = {}, nObsLeg = {};
    legs.forEach(function (l) { legInfo[l.ST + '|' + l.Leg + '|' + l['Tanggal mulai']] = l; mandatST[l.ST] = mandatST[l.ST] || l.Mandat; });
    var hasil = [];
    obs.forEach(function (r) {
      var g = String(r['Observation Group'] || '').split('|'), kLeg = g[0] + '|' + g[1] + '|' + g[2];
      var l = legInfo[kLeg];
      nObsLeg[kLeg] = (nObsLeg[kLeg] || 0) + 1;
      var info = { sumber: label, awalan: 'dsb-', st: r.ST || g[0] || '', leg: g[1] || '',
        mandat: l ? l.Mandat : mandatST[r.ST] || '', berkas: l ? l.File : '' };
      hasil = hasil.concat(olahBarisEkspor_(M, r, info, sekarang));
    });
    var n = tulisPerTab_(M, hasil, label);
    buangTahunKehati_(M, hasil);
    var barisLeg = legs.map(function (l) {
      var k = l.ST + '|' + l.Leg + '|' + l['Tanggal mulai'];
      var resor = jalur[k] ? resorJalur_(M, jalur[k]) : '';
      var b = {
        'ID Leg': k, 'Sumber': label, 'ST': l.ST, 'Leg': l.Leg, 'Tanggal mulai': tanggalDari_(l['Tanggal mulai']),
        'Tanggal selesai': tanggalDari_(l['Tanggal selesai']), 'Tahun': Number(String(l['Tanggal mulai']).slice(0, 4)) || '',
        'Hari patroli': angkaAtauKosong_(l['Hari patroli']), 'Mandat': l.Mandat, 'Jenis kegiatan': jenisKegiatan_(M, l.Mandat),
        'Transportasi': l.Transportasi, 'SPTN': l.SPTN, 'Tim': l.Tim, 'Resor': resor || namaResor_(l.Resor), 'Ketua': l.Ketua,
        'Jumlah anggota': angkaAtauKosong_(l['Jumlah anggota']), 'Anggota': l.Anggota,
        'Jumlah waypoint': angkaAtauKosong_(l['Jumlah waypoint']), 'Jumlah observasi': nObsLeg[k] || 0,
        'Panjang jalur (km)': angkaAtauKosong_(l['Panjang jalur (km)']), 'Berkas': l.File, 'Diproses': sekarang
      };
      return b;
    });
    n += gantiSumber_(M, 'rbm', String(M.atur.TAB_UPAYA || 'Rekap Upaya Patroli'), label, KOLOM_UPAYA, barisLeg);
    return n;
  },

  /**
   * Rekap SMART di Google Sheets: semua tab berformat ekspor SMART (punya kolom Observation Category 0). Alamat: ID
   * spreadsheet, dan/atau URL CSV hasil "Publikasikan ke web" sebagai cadangan bila spreadsheet tidak bisa dibuka.
   */
  smart_rekap: function (M, s) {
    var label = LABEL_SUMBER.smart_rekap, sekarang = new Date(), hasil = [], terbaca = false, galat = [];
    alamat_(M, s).forEach(function (a) {
      if (terbaca) return;
      try {
        if (/^https?:/i.test(a) && !/\/spreadsheets\/d\/[A-Za-z0-9_-]{20,}\/edit/.test(a)) {
          bacaCsv_(ambil_(a)).forEach(function (r0) {
            var r = {};
            Object.keys(r0).forEach(function (k) { r[bakuKepalaEkspor_(k)] = r0[k]; });
            hasil = hasil.concat(olahBarisEkspor_(M, r, { sumber: label, awalan: 'rks-', berkas: 'Rekap SMART (CSV)' }, sekarang));
          });
        } else {
          var id = (/\/d\/([A-Za-z0-9_-]+)/.exec(a) || /[?&]id=([A-Za-z0-9_-]+)/.exec(a) || [null, a])[1];
          var ss = bukaSpreadsheet_(id), zona = ss.getSpreadsheetTimeZone();
          ss.getSheets().forEach(function (sh) {
            if (sh.getLastRow() < 2) return;
            var v = sh.getDataRange().getValues(), h = v[0].map(bakuKepalaEkspor_);
            var i0 = h.indexOf('Observation Category 0');
            var dariNama = sh.getName().split('/');
            if (h.indexOf('Waypoint Date') < 0 || (i0 < 0 && dariNama.length < 1)) return;
            v.slice(1).forEach(function (row) {
              var r = {};
              h.forEach(function (k, j) { if (k) r[k] = row[j]; });
              if (i0 < 0) { r['Observation Category 0'] = dariNama[0]; r['Observation Category 1'] = dariNama[1] || ''; }
              hasil = hasil.concat(olahBarisEkspor_(M, r, { sumber: label, awalan: 'rks-', berkas: 'Rekap SMART / ' + sh.getName() }, sekarang, zona));
            });
          });
        }
        terbaca = true;
      } catch (e) { galat.push(e.message); }
    });
    if (!terbaca) throw new Error(galat.join('; ') || 'alamat kosong');
    var n = tulisPerTab_(M, hasil, label);
    buangTahunKehati_(M, hasil);
    return n;
  },

  /** Temuan LPK teknis PEH 2020 sampai 2026 dari Data Masuk Kehati (hanya baris LPK). */
  lpk_peh: function (M, s) {
    var a = alamat_(M, s);
    return tulisKehati_(M, ambilJson_(a[0]), ambilJson_(a[1]), ambilJson_(a[2]), 'LPK', LABEL_SUMBER.lpk_peh, 'lpk-', false);
  },

  /**
   * Temuan kehati SMART tahun lalu yang sudah dikurasi di Data Masuk Kehati (bawaan: 2025; ubah lewat "tahun 2024, 2025"
   * di kolom catatan). Tahun yang sudah dimuat sumber rekap SMART (smart_rekap) atau Dashboard SMART dilewati agar
   * titik yang sama tidak tercatat dua kali.
   */
  smart_kehati: function (M, s) {
    var a = alamat_(M, s), m = /tahun\s+([\d,\s]+)/i.exec(String(s.catatan || ''));
    var tahun = m ? m[1].split(/[,\s]+/).map(Number).filter(Boolean) : [2025];
    var lewat = {}, tab = penghubung_(M, 'satwa');
    [LABEL_SUMBER.smart_rekap, LABEL_SUMBER.smart_dashboard].forEach(function (l) {
      var t = tahunSumber_(M, tab.induk, tab.tab, l);
      for (var k in t) lewat[k] = true;
    });
    tahun = tahun.filter(function (t) { return !lewat[t]; });
    return tulisKehati_(M, ambilJson_(a[0]), ambilJson_(a[1]), ambilJson_(a[2]), 'SMART', LABEL_SUMBER.smart_kehati, 'skh-',
      false, tahun);
  },

  /** Daftar jenis kehati TN Tambora beserta status perlindungan. */
  daftar_jenis: function (M, s) {
    var taksa = ambilJson_(alamat_(M, s)[0]);
    var baris = taksa.map(function (x) {
      return { 'ID jenis': x.tid, 'Kategori': x.k, 'Tingkat': x.t, 'Nama ilmiah': x.i, 'Nama Indonesia': x.n,
        'Nama lokal': (x.l || []).join(', '), 'Nama Inggris': x.e, 'Famili': x.f, 'IUCN': x.iucn, 'P.106/2018': x.p106,
        'CITES': x.cites, 'Habitus atau status kehadiran': x.h, 'Sebaran': x.sb, 'Invasif': x.inv ? 'ya' : '',
        'Ada di daftar induk': x.induk ? 'ya' : '', 'Sumber nama': x.sn, 'Sinonim': (x.sin || []).join(', '),
        'Jumlah temuan': x.nr, 'Temuan berkoordinat': x.nk, 'Tahun pertama': (x.th || [])[0] || '',
        'Tahun terakhir': (x.th || [])[1] || '', 'Resor (batas lama)': (x.res || []).join(', '),
        'Sumber temuan': (x.smb || []).join(', '), 'Model MaxEnt': x.model ? 'ya' : '' };
    });
    return tulisUtuh_(M, s.induk || 'kehati', s.tab_tujuan || 'Daftar Jenis Kehati', ['ID jenis'], baris);
  },

  /** Register kegiatan LPK teknis PEH: satu kegiatan = satu upaya (Rekap Upaya Patroli). */
  register_lpk: function (M, s) {
    var keg = ambilJson_(alamat_(M, s)[0]), label = LABEL_SUMBER.register_lpk, sekarang = new Date();
    var baris = keg.map(function (k) {
      var resor = namaResor_(k.resor) || k.resor, mulai = tanggalDari_(k.mulai), selesai = tanggalDari_(k.selesai);
      var hari = mulai && selesai ? Math.round((selesai - mulai) / 864e5) + 1 : '';
      return { 'ID Leg': 'lpk-' + k.id, 'Sumber': label, 'ST': k.kode || '', 'Leg': '', 'Tanggal mulai': mulai,
        'Tanggal selesai': selesai, 'Tahun': k.tahun || (mulai ? mulai.getFullYear() : ''), 'Hari patroli': hari,
        'Mandat': k.metode, 'Jenis kegiatan': jenisKegiatan_(M, k.metode), 'Transportasi': '', 'SPTN': sptnResor_(M, resor),
        'Tim': '', 'Resor': resor, 'Ketua': '', 'Jumlah anggota': '', 'Anggota': '', 'Jumlah waypoint': '',
        'Jumlah observasi': k.n, 'Panjang jalur (km)': '', 'Berkas': k.judul, 'Diproses': sekarang };
    });
    return tulisUpaya_(M, label, baris);
  },

  /**
   * Laporan kegiatan penyuluhan dan pemberdayaan 2020 sampai 2026, diseragamkan ke kategori Penyuluhan dan
   * Pemberdayaan Masyarakat data model 2027 (PETA_PENYULUHAN).
   */
  penyuluhan: function (M, s) {
    var sekarang = new Date(), label = LABEL_SUMBER.penyuluhan;
    var baris = bacaCsv_(ambil_(alamat_(M, s)[0])).map(function (r) {
      var pt = PETA_PENYULUHAN[r.jenis_kegiatan] || PETA_PENYULUHAN['Lainnya'];
      var b = { 'ID Observasi': 'pyl-' + r.id, 'Sumber': label };
      waktuBaku_(b, '', r.tahun, r.bulan);
      b['Resor'] = namaResor_(r.resort);
      b['SPTN'] = sptnResor_(M, b['Resor']);
      b['Jenis kegiatan'] = 'Penyuluhan dan pemberdayaan';
      b['Mandat'] = r.judul;
      var ket = [r.judul, r.ringkasan].filter(String);
      if (!PENYULUHAN_DESA[pt[0]] && r.desa) ket.unshift('Desa: ' + r.desa);
      isiDM_(M, b, 'sosialisasidananjangsana.' + pt[0] + '.', {
        tmbjeniskegiatanpenyuluhan: { k: pt[1] }, tmbtopiksosialisasi: pt[0] === 'sosialisasi' ? { k: pt[2] } : '',
        tmbjeniskemitraan: pt[3] ? { k: pt[3] } : '', namadesa: PENYULUHAN_DESA[pt[0]] ? r.desa : '',
        namakelompokbinaan: r.kelompok, namasekolah: r.sekolah,
        jumlahpartisipan: /sosialisasi|tamboragoestoschool/.test(pt[0]) ? angkaAtauKosong_(r.peserta) : '',
        satuan: /sosialisasi|tamboragoestoschool/.test(pt[0]) && r.peserta ? { k: 'orang' } : '',
        keterangan: ket.join(' | ')
      });
      b['Foto'] = r.url; b['Berkas'] = r.url; b['Diproses'] = sekarang;
      return b;
    });
    return tulisDM_(M, label, baris);
  },

  /** Kondisi kelompok binaan per tahun = Monev Kelompok Binaan (Rekap Kegiatan Penyuluhan). */
  kelompok: function (M, s) {
    var a = alamat_(M, s), sekarang = new Date(), daftar = {}, label = LABEL_SUMBER.kelompok;
    if (a[1]) bacaCsv_(ambil_(a[1])).forEach(function (k) { daftar[k.id] = k; });
    var baris = bacaCsv_(ambil_(a[0])).map(function (r) {
      var k = daftar[r.kelompok_id] || {};
      var b = { 'ID Observasi': 'klp-' + r.kelompok_id + '-' + r.tahun, 'Sumber': label };
      waktuBaku_(b, '', r.tahun, '');
      b['Resor'] = namaResor_(k.resort);
      b['SPTN'] = k.wilayah || sptnResor_(M, b['Resor']);
      b['Jenis kegiatan'] = 'Penyuluhan dan pemberdayaan';
      b['Mandat'] = 'Monitoring dan evaluasi kelompok binaan ' + r.tahun;
      isiDM_(M, b, 'sosialisasidananjangsana.monevkelompokbinaan.', {
        tmbjeniskegiatanpenyuluhan: { k: 'monitoringdanevaluasikelompokbinaan.' }, namakelompokbinaan: r.nama,
        jenisusahakelompokbinaan: k.usaha || '', hasilmonev: [r.penilaian, r.kondisi].filter(String).join(' | '),
        statuskelompokbinaan: { k: kunciStatusKelompok_(r.status) }, tmbjumlahanggota: angkaAtauKosong_(r.anggota),
        tmbjumlahanggotaperempuan: angkaAtauKosong_(r.anggota_perempuan),
        tmbkendalakelompok: { k: kunciKendala_(r.tema_kendala) }, tmbkebutuhankelompok: r.kebutuhan,
        tmbbantuanditerima: r.bantuan, tmbprodukkelompok: r.produk,
        keterangan: [k.desa ? 'Desa: ' + k.desa : '', k.jenis ? 'Jenis kelompok: ' + k.jenis : '',
          r.status && !kunciStatusKelompok_(r.status) ? 'Status: ' + r.status : '', r.kendala ? 'Kendala: ' + r.kendala : '']
          .filter(String).join(' | ')
      });
      b['Diproses'] = sekarang;
      return b;
    });
    return tulisDM_(M, label, baris);
  },

  /** Daftar kelompok binaan (lembar acuan, bukan data temuan). */
  daftar_kelompok: function (M, s) {
    var baris = bacaCsv_(ambil_(alamat_(M, s)[0])).map(function (k) {
      var resor = namaResor_(k.resort);
      return { 'ID kelompok': k.id, 'Nama kelompok': k.nama, 'Desa': k.desa, 'Resor': resor, 'SPTN': k.wilayah || sptnResor_(M, resor),
        'Jenis kelompok': k.jenis, 'Bidang usaha': k.usaha, 'Tahun dibentuk': angkaAtauKosong_(k.dibentuk),
        'Dasar pembentukan': k.dasar_pembentukan, 'Tahun terakhir dilaporkan': angkaAtauKosong_(k.tahun_terakhir),
        'Status terakhir': k.status_terakhir, 'Tahun dilaporkan': k.tahun_dilaporkan };
    });
    return tulisUtuh_(M, s.induk || 'peny', s.tab_tujuan || 'Daftar Kelompok Binaan', ['ID kelompok'], baris);
  },

  /**
   * Pulbaket penggunaan lahan (konflik tenurial): isiannya Aktivitas Manusia > Penggunaan Kawasan (satu baris per
   * bidang) dan Aktivitas Manusia > Pelaku (satu baris per pengguna lahan dan pihak berpengaruh), di Rekap Temuan
   * Gangguan Kawasan. Nama pelaku hanya untuk akun admin di Unduh Data.
   */
  pulbaket: function (M, s) {
    var a = alamat_(M, s), sekarang = new Date(), keg = {}, label = LABEL_SUMBER.pulbaket, baris = [];
    if (a[1]) { try { keg = ambilJson_(a[1]).kegiatan || {}; } catch (e) { keg = {}; } }
    var modus = function (riwayat) {
      return /buka/i.test(riwayat || '') ? 'membukasendiri' : /sewa|beli|jual|ganti/i.test(riwayat || '') ? 'membeli' : riwayat ? 'lainnya' : '';
    };
    (ambilJson_(a[0]).features || []).forEach(function (f) {
      var q = f.properties || {}, c = titikTengah_(f.geometry), orang = q.orang || [];
      var dasar = { 'Sumber': label };
      waktuBaku_(dasar, keg.mulai || '', 2026, '');
      resorBaku_(M, dasar, c[0], c[1], q.resor);
      dasar['Jenis kegiatan'] = 'Patroli pengamanan kawasan';
      dasar['Mandat'] = keg.judul || 'Pengumpulan bahan keterangan penggunaan lahan';
      dasar['ST'] = keg.st || '';
      dasar['X'] = c[0]; dasar['Y'] = c[1];
      dasar['Berkas'] = 'data/tenurial/bidang.geojson'; dasar['Diproses'] = sekarang;
      var salin = function (id) { var b = { 'ID Observasi': id }; for (var k in dasar) b[k] = dasar[k]; return b; };
      var md = orang.map(function (o) { return modus(o.riwayat); }).filter(String);
      var aktif = /buka|sewa/i.test(q.status || '') ? 'aktif' : /kosong/i.test(q.status || '') ? 'tidakaktif' : '';
      baris.push(isiDM_(M, salin('tnr-' + q.kode), 'aktivitasmanusia.penggunaankawasan.', {
        pelanggaran: { k: 'pelanggaran' }, namakelompok: q.blok, tipetemuan: { k: 'penggunaankawasan.lahanterbuka.' },
        jumlah: angkaAtauKosong_(q.luas), satuan: { k: 'hektar' }, usiatemuan: { k: 'diatas1tahun' },
        keaktifan: { k: aktif }, moduspenggunaankawasan: { k: md[0] || '' },
        perlutindaklanjut: /perlu/i.test(q.catatan || '') ? { k: 'ya' } : '',
        keterangan: ['Kode bidang ' + q.kode, q.lokasi ? 'lokasi ' + q.lokasi : '', q.zona ? 'zona ' + q.zona : '',
          q.status ? 'status bidang ' + q.status : '', q.pengguna !== undefined ? q.pengguna + ' pengguna' : '',
          Number(q.terbakar) ? 'terbakar ' + q.terbakar + ' ha' : '', q.tutupan ? 'tutupan ' + q.tutupan : '', q.catatan || '']
          .filter(String).join('; ')
      }));
      // Nama dan alamat orang hanya di kolom Nama pelaku dan Alamat (khusus admin di Unduh Data), tidak di Keterangan.
      orang.forEach(function (o, i) {
        if (!o.nama && !o.riwayat) return;
        baris.push(isiDM_(M, salin('tnr-' + q.kode + '-p' + (i + 1)), 'aktivitasmanusia.pelaku.', {
          namapelaku: o.nama, alamat: o.alamat, pelanggaran: { k: 'pelanggaran' }, jumlahpelaku: 1,
          tipetemuan: { k: 'penggunaankawasan.pelakupembukaanlahan.' },
          keterangan: ['Pengguna lahan bidang ' + q.kode, o.riwayat ? 'riwayat perolehan: ' + o.riwayat : '',
            o.menyewakan ? 'lahan disewa atau dibeli dari pihak lain (baris -s)' : ''].filter(String).join('; ')
        }));
        if (o.menyewakan) {
          baris.push(isiDM_(M, salin('tnr-' + q.kode + '-p' + (i + 1) + '-s'), 'aktivitasmanusia.pelaku.', {
            namapelaku: o.menyewakan, jumlahpelaku: 1,
            keterangan: 'Pihak yang menyewakan atau menjual lahan bidang ' + q.kode + ' kepada pengguna'
          }));
        }
      });
      (q.pengaruh || []).forEach(function (nm, i) {
        baris.push(isiDM_(M, salin('tnr-' + q.kode + '-h' + (i + 1)), 'aktivitasmanusia.pelaku.', {
          namapelaku: nm, pelanggaran: { k: 'bukanpelanggaran' }, keterangan: 'Pihak berpengaruh bidang ' + q.kode
        }));
      });
    });
    return tulisDM_(M, label, baris);
  },

  /** Titik panas (hotspot) = Kebakaran Hutan dan Lahan dengan sumber informasi Hotspot satelit. */
  titik_panas: function (M, s) {
    var label = LABEL_SUMBER.titik_panas, sekarang = new Date();
    var baris = (ambilJson_(alamat_(M, s)[0]).features || []).map(function (f) {
      var q = f.properties || {}, c = f.geometry ? f.geometry.coordinates : [NaN, NaN], t = String(q.t || '');
      var b = { 'ID Observasi': 'hs-' + (q.ev || md5_(t + c[0] + c[1] + q.s).slice(0, 12)), 'Sumber': label };
      waktuBaku_(b, t.slice(0, 10));
      b['Waktu'] = t.slice(11, 16);
      resorBaku_(M, b, c[0], c[1], '');
      b['Jenis kegiatan'] = 'Pemantauan titik panas';
      b['Mandat'] = 'Titik panas ' + (q.src || '');
      isiDM_(M, b, 'aktivitasmanusia.kebakaranhutandanlahan.', {
        tipetemuan: { k: 'kebakaranhutandanlahan.potensiterbakar.' }, tmbsumberinfokebakaran: { k: 'hotspotsatelit' },
        keterangan: ['Satelit ' + (q.s || q.src || ''), q.c ? 'kepercayaan ' + ({ L: 'rendah', M: 'sedang', H: 'tinggi' }[q.c] || q.c) : '',
          q.tn === true ? 'di dalam TN' : q.tn === false ? 'di luar TN' : '', q.desa ? 'desa ' + q.desa : '',
          q.kec ? 'kecamatan ' + q.kec : '', q.kab ? 'kabupaten ' + q.kab : ''].filter(String).join('; ')
      });
      b['X'] = c[0]; b['Y'] = c[1]; b['Berkas'] = 'titik_panas.geojson'; b['Diproses'] = sekarang;
      return b;
    });
    return tulisDM_(M, label, baris);
  },

  /** Bidang areal terbakar hasil delineasi manual = Kebakaran Hutan dan Lahan (bekas kebakaran, luas terbakar). */
  areal_terbakar: function (M, s) {
    var label = LABEL_SUMBER.areal_terbakar, sekarang = new Date();
    var baris = (ambilJson_(alamat_(M, s)[0]).features || []).map(function (f) {
      var q = f.properties || {}, asli = q.asli || {}, c = titikTengah_(f.geometry);
      var b = { 'ID Observasi': 'dln-' + (q.tanggal || '') + '-' + q.id, 'Sumber': label };
      waktuBaku_(b, q.tanggal);
      resorBaku_(M, b, c[0], c[1], q.resort);
      b['Jenis kegiatan'] = 'Delineasi areal terbakar';
      b['Mandat'] = 'Delineasi areal terbakar';
      isiDM_(M, b, 'aktivitasmanusia.kebakaranhutandanlahan.', {
        tipetemuan: { k: 'kebakaranhutandanlahan.bekaskebakaran.' }, tmbluasterbakarha: angkaAtauKosong_(q.luas_ha),
        jumlah: angkaAtauKosong_(q.luas_ha), satuan: { k: 'hektar' }, tmbstatusapi: { k: 'bekasterbakar' },
        tmbsumberinfokebakaran: { k: 'lainnya' },
        keterangan: ['Delineasi manual citra', q.tn_persen !== undefined ? q.tn_persen + ' persen di TN' : '',
          q.luar_kawasan ? 'di luar kawasan' : '', asli.Zona ? 'zona ' + asli.Zona : '', asli.Grid ? 'grid ' + asli.Grid : '',
          asli.Bulan ? 'bulan kejadian ' + asli.Bulan : '', asli.Tahun ? 'tahun kejadian ' + asli.Tahun : ''].filter(String).join('; ')
      });
      b['X'] = c[0]; b['Y'] = c[1]; b['Berkas'] = q.file || ''; b['Diproses'] = sekarang;
      return b;
    });
    return tulisDM_(M, label, baris);
  },

  /**
   * Rencana RBM 2026 (lembar acuan Rencana RBM 2026) dan laporan form RBM. Satu laporan = satu kegiatan RBM = satu
   * patroli: baris Kegiatan RBM (atribut data model) di Rekap Upaya Patroli (titik dan kegiatan). Capaian dihitung di
   * dashboard RBM dari rekap ini, bukan disimpan sebagai rekap.
   */
  rbm: function (M, s) {
    var a = alamat_(M, s), sekarang = new Date();
    var rencana = ambilJson_(a[0]), laporan = null;
    try {
      var cfg = a[1] ? ambil_(a[1]) : '';
      var api = (/API_URL:\s*'([^']*)'/.exec(cfg) || /API_URL:\s*"([^"]*)"/.exec(cfg) || [])[1] || a[2];
      if (api) laporan = ambilJson_(api).laporan || [];
    } catch (e) { laporan = null; }
    var resorNama = {}, resorSptn = {}, keg = {};
    rencana.resor.forEach(function (r) { resorNama[r.id] = namaResor_(r.nama) || r.nama; resorSptn[r.id] = r.sptn; });
    rencana.kegiatan.forEach(function (k) { keg[k.id] = k; });
    var barisRencana = rencana.kegiatan.map(function (k) {
      return { 'Kode kegiatan': k.id, 'Tahun': rencana.tahun, 'Resor': resorNama[k.resor] || k.resor, 'SPTN': resorSptn[k.resor] || '',
        'Indikator': k.indikator, 'Kegiatan': k.kegiatan, 'Jenis kegiatan RBM': labelNilai_(M, 'tmbjeniskegiatanrbm', jenisRbm_(k.indikator, k.kegiatan)),
        'Jenis kegiatan': jenisKegiatan_(M, k.kegiatan), 'Target': k.target, 'Satuan': k.satuan, 'Cara hitung': k.metode,
        'Keterangan': k.keterangan };
    });
    var n = tulisUtuh_(M, s.induk || 'rbm', s.tab_tujuan || 'Rencana RBM 2026', ['Kode kegiatan'], barisRencana);
    if (laporan) {
      var barisLap = laporan.map(function (l) {
        var k = keg[l.kegiatan] || {}, nama = k.kegiatan || l.nama_kegiatan || l.kegiatan;
        var b = { 'ID Observasi': 'rbm-' + l.id, 'Sumber': LABEL_SUMBER.rbm };
        waktuBaku_(b, l.tanggal, rencana.tahun, l.bulan);
        b['Resor'] = resorNama[l.resor] || l.resor; b['SPTN'] = resorSptn[l.resor] || sptnResor_(M, b['Resor']);
        b['Jenis kegiatan'] = jenisKegiatan_(M, nama); b['Mandat'] = nama;
        isiDM_(M, b, 'tmbkegiatanrbm.', {
          tmbindikatorrbm: k.indikator ? { k: kunci_(k.indikator) } : '', tmbjeniskegiatanrbm: { k: jenisRbm_(k.indikator, nama) },
          tmbkodekegiatanrencana: l.kegiatan, tmbsesuairencana: l.sesuai ? 'Ya' : 'Tidak',
          tmbvolumekegiatan: angkaAtauKosong_(l.volume), tmbsatuanvolume: k.satuan ? { k: kunci_(k.satuan) } : '',
          tmbcatatanhasil: nama
        });
        b['Status verifikasi'] = l.status; b['Diproses'] = sekarang;
        return b;
      });
      n += tulisDM_(M, LABEL_SUMBER.rbm, barisLap);
    }
    return n;
  },

  /** Log penerbangan drone (Flight SMART): satu penerbangan = satu upaya di Rekap Upaya Patroli. */
  drone: function (M, s) {
    var a = alamat_(M, s), dasar = a[0].replace(/flights\/index\.json.*$/, ''), label = LABEL_SUMBER.drone, sekarang = new Date();
    var baris = (ambilJson_(a[0]).flights || []).map(function (f) {
      var tgl = tanggalDari_(String(f.startLocal || '').slice(0, 10)), h = f.home || {}, b0 = {};
      resorBaku_(M, b0, h.lon, h.lat, '');
      var fl = f.files || {};
      return { 'ID Leg': 'drone-' + f.id, 'Sumber': label, 'ST': '', 'Leg': '', 'Tanggal mulai': tgl, 'Tanggal selesai': tgl,
        'Tahun': tgl ? tgl.getFullYear() : '', 'Hari patroli': 1, 'Mandat': 'Patroli drone', 'Jenis kegiatan': jenisKegiatan_(M, 'Patroli drone'),
        'Transportasi': 'Drone', 'SPTN': b0['SPTN'] || '', 'Tim': f.aircraft || '', 'Resor': b0['Resor'] || '', 'Ketua': '',
        'Jumlah anggota': '', 'Anggota': '', 'Jumlah waypoint': '', 'Jumlah observasi': f.photos || '',
        'Panjang jalur (km)': f.distanceM ? Math.round(f.distanceM / 10) / 100 : '',
        'Berkas': fl.gpx ? dasar + fl.gpx : (f.location || ''), 'Diproses': sekarang };
    });
    return tulisUpaya_(M, label, baris);
  },

  /**
   * Satu tab Google Sheets lain (rekap laporan kejadian, rekap karhut, kunjungan wisata) yang diseragamkan ke data model
   * 2027 lalu masuk ke rekap kategorinya. Alamat: ID atau URL spreadsheet, tambahkan "#Nama tab" untuk memilih tab
   * (bawaan: tab pertama). Kolom catatan wajib memuat "kategori=<kunci kategori>", misalnya
   * "kategori=aktivitasmanusia.kebakaranhutandanlahan.". Bila kategorinya punya anak (misalnya "aktivitasmanusia."),
   * kategori tiap baris dicari dari isi sel yang sama dengan nama kategori anak (Pembalakan, Perburuan Satwa, ...),
   * atau dari kata yang biasa dipakai di laporan lama (SINONIM_KATEGORI: perambahan = Penggunaan Kawasan, dan
   * seterusnya) di kolom kejadian/jenis/kategori. Baris yang tetap tidak dikenali masuk ke kategori induknya.
   * Judul kolom yang sama dengan label atribut data model menjadi kolom atribut itu; kolom tanggal, waktu, resor, dan
   * koordinat dikenali; kolom lain masuk ke "Atribut lain" agar tidak ada isian yang hilang.
   */
  spreadsheet: function (M, s) {
    var a = alamat_(M, s)[0] || '', bagian = a.split('#');
    var m = /kategori\s*=\s*([a-z0-9_.]+)/i.exec(String(s.catatan || ''));
    if (!m) throw new Error('isi kolom catatan dengan "kategori=<kunci kategori data model>"');
    var hkInduk = m[1].replace(/\.?$/, '.');
    if (!M.label['k|' + hkInduk]) throw new Error('kategori ' + hkInduk + ' tidak ada di Label Data Model');
    var id = (/\/d\/([A-Za-z0-9_-]+)/.exec(bagian[0]) || /[?&]id=([A-Za-z0-9_-]+)/.exec(bagian[0]) || [null, bagian[0].trim()])[1];
    var ss = bukaSpreadsheet_(id), sh = bagian[1] ? ss.getSheetByName(bagian[1].trim()) : ss.getSheets()[0];
    if (!sh) throw new Error('tab "' + bagian[1] + '" tidak ada');
    var zona = ss.getSpreadsheetTimeZone(), v = sh.getDataRange().getValues();
    // baris judul = baris terisi terbanyak di 10 baris pertama
    var iH = 0, terbanyak = -1;
    v.slice(0, 10).forEach(function (r, i) {
      var n = r.filter(function (c) { return c !== '' && c !== null; }).length;
      if (n > terbanyak) { terbanyak = n; iH = i; }
    });
    var h = v[iH].map(function (x) { return String(x).trim(); });
    // kategori anak di bawah hkInduk: label -> hkey
    var anak = {};
    Object.keys(M.label).forEach(function (k) {
      if (k.indexOf('k|' + hkInduk) !== 0 || k === 'k|' + hkInduk) return;
      anak[kunci_(M.label[k].split(' > ').pop())] = k.slice(2);
    });
    var cari = function (re) { for (var j = 0; j < h.length; j++) if (re.test(h[j])) return j; return -1; };
    // sinonim hanya untuk kategori anak hkInduk, dicari di kolom yang judulnya menandakan jenis kejadian
    var sinonim = SINONIM_KATEGORI.filter(function (x) { return x[1].indexOf(hkInduk) === 0 && x[1] !== hkInduk && M.label['k|' + x[1]]; });
    var kolSinonim = h.map(function (x, j) { return /kejadian|jenis|kategori|gangguan|kasus|pelanggaran|temuan|aktivitas/i.test(x) ? j : -1; })
      .filter(function (j) { return j >= 0; });
    var iTgl = cari(/^(tanggal|tgl|date|waypoint date)/i), iJam = cari(/^(waktu|jam|time)/i), iRes = cari(/^(resor|resort)/i),
      iX = cari(/^(x|bujur|longitude|lon|lng)$/i), iY = cari(/^(y|lintang|latitude|lat)$/i), iKor = cari(/koordinat/i);
    var label = s.nama || s.kode, sekarang = new Date(), dipakai = [iTgl, iJam, iRes, iX, iY, iKor];
    var baris = [];
    v.slice(iH + 1).forEach(function (r, ib) {
      if (!r.some(function (c) { return c !== '' && c !== null; })) return;
      var hk = hkInduk;
      r.forEach(function (c) { var k = anak[kunci_(String(c))]; if (k && k.length > hk.length) hk = k; });
      for (var js = 0; hk === hkInduk && js < kolSinonim.length; js++) {
        var teks = String(r[kolSinonim[js]] === null || r[kolSinonim[js]] === undefined ? '' : r[kolSinonim[js]]);
        for (var q = 0; teks && q < sinonim.length; q++) if (sinonim[q][0].test(teks)) { hk = sinonim[q][1]; break; }
      }
      var tglIso = iTgl >= 0 ? tanggalIso_(r[iTgl], zona) : '', x = iX >= 0 ? angkaAtauKosong_(r[iX]) : '',
        y = iY >= 0 ? angkaAtauKosong_(r[iY]) : '';
      if (iKor >= 0 && (x === '' || y === '')) {
        var ang = String(r[iKor]).match(/-?\d+(?:[.,]\d+)?/g) || [];
        if (ang.length >= 2) {
          var p1 = Number(ang[0].replace(',', '.')), p2 = Number(ang[1].replace(',', '.'));
          if (Math.abs(p1) < 20) { y = p1; x = p2; } else { x = p1; y = p2; }
        }
      }
      var b = { 'ID Observasi': s.kode + '-' + md5_(JSON.stringify(r.map(String))).slice(0, 12), 'Sumber': label };
      waktuBaku_(b, tglIso);
      if (iJam >= 0) b['Waktu'] = jamIso_(r[iJam], zona);
      resorBaku_(M, b, x, y, iRes >= 0 ? r[iRes] : '');
      b['Jenis kegiatan'] = 'Data sebelum 2027 (' + label + ')';
      isiDM_(M, b, hk, {});
      var lain = [];
      h.forEach(function (judul, j) {
        var c = r[j];
        if (!judul || dipakai.indexOf(j) >= 0 || c === '' || c === null) return;
        var ak = atributEkspor_(M, judul);
        var isi = c instanceof Date ? Utilities.formatDate(c, zona, 'yyyy-MM-dd') : c;
        if (ak) b[judulAtribut_(M, ak)] = typeof isi === 'string' ? baku_(M, isi) : isi;
        else if (!anak[kunci_(String(c))]) lain.push(judul + ': ' + isi);
      });
      if (lain.length) b['Atribut lain'] = lain.join('; ');
      b['X'] = x; b['Y'] = y; b['Kunci titik'] = tglIso && x !== '' ? kunciTitik_(tglIso, b['Waktu'] || '', x, y) : '';
      b['Berkas'] = ss.getName() + ' / ' + sh.getName() + ' / baris ' + (iH + ib + 2); b['Diproses'] = sekarang;
      baris.push(b);
    });
    return tulisDM_(M, label, baris);
  }
};

/**
 * Kata yang biasa dipakai laporan lama (rekap laporan kejadian, DaPolTam) -> kategori data model 2027. Urutan penting:
 * pola pertama yang cocok dipakai. Hanya kategori di bawah kategori= sumber itu yang dipertimbangkan.
 */
var SINONIM_KATEGORI = [
  [/kebakaran|terbakar|karhut|\bapi\b/i, 'aktivitasmanusia.kebakaranhutandanlahan.'],
  [/peramba|perladang|ladang|pembukaan lahan|buka lahan|garapan|okupasi|penggunaan (lahan|kawasan)|pemukiman|kebun|tenurial/i,
    'aktivitasmanusia.penggunaankawasan.'],
  [/buru|jerat|pikat|satwa ditembak|senapan/i, 'aktivitasmanusia.perburuansatwa.'],
  [/hhbk|madu|rotan|kemiri|gaharu|bambu|bukan kayu|non ?kayu/i, 'aktivitasmanusia.pengambilanhhbk.'],
  [/tebang|pembalak|illegal logging|kayu/i, 'aktivitasmanusia.pembalakan.'],
  [/tambang|galian|pengeboran/i, 'aktivitasmanusia.pertambangandanpengeboran.'],
  [/gembala|ternak|sapi|kerbau|kambing/i, 'aktivitasmanusia.pengembalaanternak.'],
  [/cemar|limbah|sampah/i, 'aktivitasmanusia.pencemaran.'],
  [/akses jalan|pembuatan jalan|buka jalan/i, 'aktivitasmanusia.pembuatanaksesjalan.'],
  [/chainsaw|gergaji|alat kerja|kendaraan/i, 'aktivitasmanusia.alatkerjadantransportasi.']
];

/** Satuan di Data Masuk Kehati yang tidak ada di daftar satuan data model -> nilai data model terdekat. */
var SATUAN_KEHATI = { pohon: 'batang', tegakan: 'batang', rumpun: 'kelompok' };

/**
 * Atribut aktif tiap kategori data model 2027 yang dipakai temuan kehati lama. Isian sumber "Label: nilai" hanya
 * masuk kolom atribut bila atributnya milik kategori itu; selebihnya ke Keterangan. Jumlah dan satuan selalu kolom.
 */
var ATRIBUT_KAT_KEHATI = {
  'satwaliar.perjumpaansatwa.': 'jenissatwa jeniskelaminsatwa kondisisatwa umursatwa jumlah satuan keterangan status jarakkesatwam tmbjenissatwa',
  'satwaliar.jejaksatwa.': 'jenissatwa tipetemuan usiatemuan keterangan tmbjenissatwa',
  'satwaliar.satwamati.': 'jenissatwa jeniskelaminsatwa jumlah kondisisatwamati tandapadasatwamati keutuhanbangkai indikasipenyebabkematian keterangan tmbjenissatwa',
  'tumbuhan.': 'tipetemuan jenistumbuhan kondisitumbuhan keterangan tmbjenistumbuhan',
  'surveykehati.plotvegetasi.semai2x2meter.': 'noplot nopetak notransek jenistumbuhan1 family jumlah keterangan',
  'surveykehati.plotvegetasi.pancang5x5meter.': 'noplot nopetak notransek jenistumbuhan1 family jumlah keterangan dbhpohoncm tinggipohonm',
  'surveykehati.plotvegetasi.tiang10x10meter.': 'noplot nopetak notransek jenistumbuhan1 family dbhpohoncm tinggipohonm keterangan',
  'surveykehati.plotvegetasi.pohon20x20meter.': 'noplot nopetak jenistumbuhan1 family dbhpohoncm tinggipohonm keterangan',
  'groundcheck.tipeekosis.': 'klasifikasi1te klasifikasi2te klasifikasi3 klasifikasi4 keterangan',
  'groundcheck.tutupanlahan.': 'klasifikasi01 klasifikasi02 keterangan',
  'spesiesinvasif.': 'nolk jenissatwa jenistumbuhan jumlah satuan tindakan perlutindaklanjut keterangan statustindaklanjut tanggaltindaklanjut tmbjenistumbuhan'
};

/** Baris Kamus Jenis untuk satu nama ilmiah baku, dari atribut jenis yang dipakai kategori (urut prioritas). */
function jenisDM_(M, nama, daftar) {
  if (!M.kamusIlmiah) {
    M.kamusIlmiah = {};
    Object.keys(M.kamus).forEach(function (k) {
      var r = M.kamus[k], kk = kunci_(r.nama_ilmiah_baku);
      if (!r.atribut || !r.kunci || !kk) return;
      var l = M.kamusIlmiah[kk] = M.kamusIlmiah[kk] || [];
      if (l.indexOf(r) < 0) l.push(r);
    });
  }
  var calon = M.kamusIlmiah[kunci_(nama)] || [];
  for (var i = 0; i < daftar.length; i++)
    for (var j = 0; j < calon.length; j++) if (calon[j].atribut === daftar[i]) return calon[j];
  return null;
}

/**
 * Temuan kehati lama dari Data Masuk Kehati (temuan.json + taksa.json + kegiatan.json), diseragamkan ke data model
 * 2027 seperti observasi file patroli: kategori data model (Perjumpaan, Tanda, atau Satwa Mati; Tumbuhan atau Plot
 * Vegetasi per tingkat tumbuh; Tipe Ekosistem dan Tutupan Lahan; Spesies invasif), kolom atribut berlabel data model
 * (jenis dari Kamus Jenis, jumlah, satuan, no. plot, klasifikasi, tipe temuan, kondisi), dan isian sumber yang tidak
 * punya atribut di data model masuk Keterangan. Status perlindungan dan kurasi nama ada di Daftar Jenis Kehati dan tab
 * Kehati hub, bukan di rekap. pilihSumber: 'LPK' atau 'SMART'. tambahSaja: tambah tanpa mengganti.
 */
function tulisKehati_(M, t, taksa, kegiatan, pilihSumber, label, awalan, tambahSaja, hanyaTahun) {
  var grupTab = ['satwa', 'tumbuhan', 'invasif', 'ekosistem'].map(function (g) { return penghubung_(M, g); });
  if (hanyaTahun && !hanyaTahun.length && !tambahSaja) {
    // semua tahun sudah dimuat sumber lain: hapus baris lama sumber ini saja
    grupTab.forEach(function (p) { gantiSumber_(M, p.induk, p.tab, label, KOLOM_DEPAN, [], {}); });
    return 0;
  }
  var C = t.kolom, Q = t.kamus, sekarang = new Date(), kegId = {}, perTab = {};
  (kegiatan || []).forEach(function (k) { kegId[k.id] = k; });
  var satuanDM = {};
  Object.keys(M.label).forEach(function (k) {
    if (k.indexOf('n|satuan|') === 0) satuanDM[kunci_(M.label[k])] = k.slice(9);
  });
  function tambah(b) {
    var tj = tujuanKategori_(M, b['Kode kategori']), k = tj.induk + '|' + tj.tab;
    (perTab[k] = perTab[k] || { t: tj, baris: [] }).baris.push(b);
  }
  for (var i = 0; i < t.n; i++) {
    if (Q.sumber[C.s[i]] !== pilihSumber) continue;
    if (hanyaTahun && hanyaTahun.indexOf(Number(C.th[i])) < 0) continue;
    var x = C.t[i] >= 0 ? taksa[C.t[i]] : null, kat = Q.kategori[C.kat[i]], jt = Q.temuan[C.jt[i]];
    var tt = String(C.tt[i] || '').toLowerCase(), kid = Q.kegiatan[C.k[i]], kg = kegId[kid] || {};
    var lon = C.lon[i], lat = C.lat[i];
    lon = typeof lon === 'number' ? lon : angkaAtauKosong_(lon);
    lat = typeof lat === 'number' ? lat : angkaAtauKosong_(lat);
    var grup = kat === 'Tipe Ekosistem' ? 'ekosistem' : kat === 'Flora' || kat === 'Anggrek' ? 'tumbuhan' : 'satwa';
    var hkey = grup === 'ekosistem' ? (jt === 'tutupan lahan' ? 'groundcheck.tutupanlahan.' : 'groundcheck.tipeekosis.') :
      grup === 'tumbuhan' ? (jt === 'petak vegetasi' && KAT_KEHATI.plot[tt]) || 'tumbuhan.' :
      KAT_KEHATI.satwa[jt] || 'satwaliar.perjumpaansatwa.';
    var plotVeg = hkey.indexOf('surveykehati.plotvegetasi.') === 0;
    var b = { 'ID Observasi': awalan + C.id[i], 'Sumber': label };
    waktuBaku_(b, C.tgl[i], C.th[i], '');
    resorBaku_(M, b, lon, lat, Q.resor[C.res[i]]);
    var metode = kg.metode || (pilihSumber === 'SMART' ? '' : kid);
    b['Jenis kegiatan'] = pilihSumber === 'SMART' ? M.mandat[kunci_(metode)] || JENIS_TANPA_MANDAT : jenisKegiatan_(M, metode);
    b['Mandat'] = metode;
    b['ST'] = kid;
    var nilai = {}, ket = [], pasangan = [];
    // isian atribut SMART 2025 yang tersimpan sebagai teks "Label: nilai; ..." -> [kunci atribut, teks, nilai]
    String(C.atr[i] || '').split(/;\s*/).forEach(function (p) {
      p = p.trim();
      if (!p) return;
      var m = /^([^:]+):\s*(.+)$/.exec(p), ak = m ? atributEkspor_(M, m[1].trim()) : '';
      // klasifikasi ground check yang sudah jadi kolom Klasifikasi tidak diulang di Keterangan
      if (grup === 'ekosistem' && m && /^(tipe ekosistem|verifikasi tutupan lahan|tutupan lahan) klasifikasi \d/i.test(m[1].trim())) return;
      pasangan.push([ak && ATRIBUT_JENIS.indexOf(ak) < 0 ? ak : '', p, m ? baku_(M, m[2].trim()) : '']);
    });
    if (grup !== 'ekosistem') {
      var daftar = grup === 'satwa' ? ['jenissatwa', 'tmbjenissatwa'] : ['jenistumbuhan', 'tmbjenistumbuhan'];
      var kj = x && x.i ? jenisDM_(M, x.i + (x.t === 'marga' ? ' sp.' : ''), daftar) : null;
      var jenis;
      if (kj) {
        jenis = barisKamus_(kj, kj.atribut + '|' + kj.kunci);
        if (plotVeg) nilai.jenistumbuhan1 = kj.label_smart || kj.nama_ilmiah_baku;
        else nilai[kj.atribut] = { k: kj.kunci };
      } else if (x) {
        jenis = { 'Nama ilmiah baku': x.i ? x.i + (x.t === 'marga' ? ' sp.' : '') : '', 'Nama umum': x.n || '',
          'Nama lokal': (x.l || []).join(', '), 'Kelompok jenis': KAT_KEHATI.kelompok[kat] || kat, 'Kode jenis': 'kehati|' + x.tid };
        if (plotVeg) nilai.jenistumbuhan1 = jenis['Nama ilmiah baku'] || C.ns[i] || '';
      } else {
        jenis = { 'Nama ilmiah baku': '', 'Nama umum': String(C.ns[i] || '').split(' | ')[0], 'Nama lokal': '',
          'Kelompok jenis': KAT_KEHATI.kelompok[kat] || kat, 'Kode jenis': '' };
        if (plotVeg) nilai.jenistumbuhan1 = jenis['Nama umum'];
      }
      if (C.nl[i]) jenis['Nama lokal'] = C.nl[i];
      for (var kk in jenis) b[kk] = jenis[kk];
      var ns = String(C.ns[i] || '');
      if (ns && kunci_(ns) !== kunci_(jenis['Nama ilmiah baku']) && kunci_(ns) !== kunci_(jenis['Nama umum']))
        ket.unshift('Nama di sumber: ' + ns);
      if (C.j[i] !== null && C.j[i] !== '' && C.j[i] !== undefined) nilai.jumlah = C.j[i];
      var sat = String(Q.satuan[C.sat[i]] || ''), ks = satuanDM[kunci_(SATUAN_KEHATI[sat] || sat)];
      if (sat) {
        nilai.satuan = { k: ks || satuanDM.lainnya || 'lainnya' };
        if (!ks) ket.push('Satuan di sumber: ' + sat);
      }
      if (hkey === 'satwaliar.jejaksatwa.' && !nilai.tipetemuan) nilai.tipetemuan = { k: jt === 'sarang' ? 'jejak.sarang.' : 'jejak.' };
      if (C.plot[i]) { if (plotVeg) nilai.noplot = C.plot[i]; else ket.push('Petak atau titik: ' + C.plot[i]); }
      if (jt === 'petak vegetasi' && !plotVeg) ket.push('Petak vegetasi' + (tt ? ' tingkat ' + tt : ''));
    }
    if (Q.lokasi[C.lok[i]]) ket.push('Lokasi: ' + Q.lokasi[C.lok[i]]);
    var pos = Q.posisi[C.pos[i]] || '';
    if (pos && pos !== 'pengamat' && pos !== 'tanpa') ket.push('Koordinat: posisi ' + pos);
    b['Komentar'] = C.ctn[i] || ''; b['X'] = lon; b['Y'] = lat;
    b['Berkas'] = [Q.berkas[C.bk[i]], Q.lembar[C.lb[i]], C.br[i] ? 'baris ' + C.br[i] : ''].filter(String).join(' / ');
    b['Diproses'] = sekarang;
    function selesai(bb, hk, nl) {
      var boleh = ' ' + (ATRIBUT_KAT_KEHATI[hk] || '') + ' ', lain = [];
      pasangan.forEach(function (q) {
        if (q[0] && q[0] !== 'jumlah' && q[0] !== 'satuan' && boleh.indexOf(' ' + q[0] + ' ') >= 0) nl[q[0]] = q[2];
        else lain.push(q[1]);
      });
      nl.keterangan = (nl.keterangan ? [nl.keterangan] : []).concat(ket, lain).join('; ');
      isiDM_(M, bb, hk, nl);
      tambah(bb);
    }
    if (grup === 'ekosistem') {
      // satu titik ground check lama bisa memuat tipe ekosistem dan tutupan lahan: dua observasi data model
      var te = String(C.eko[i] || '').split(' > '), tl = String(C.tut[i] || '').split(' > ');
      var isiTe = C.eko[i] || hkey === 'groundcheck.tipeekosis.', isiTl = C.tut[i] || hkey === 'groundcheck.tutupanlahan.';
      if (isiTe) {
        var bt = salin_(b), nt = salin_(nilai);
        ['klasifikasi1te', 'klasifikasi2te', 'klasifikasi3', 'klasifikasi4'].forEach(function (ak, j) { if (te[j]) nt[ak] = te[j].trim(); });
        if (hkey !== 'groundcheck.tipeekosis.') bt['ID Observasi'] += '-te';
        selesai(bt, 'groundcheck.tipeekosis.', nt);
      }
      if (isiTl) {
        var bl = salin_(b), nl2 = salin_(nilai);
        ['klasifikasi01', 'klasifikasi02'].forEach(function (ak, j) { if (tl[j]) nl2[ak] = tl.slice(j, j === 1 ? tl.length : 1).join(' > ').trim(); });
        if (hkey !== 'groundcheck.tutupanlahan.') bl['ID Observasi'] += '-tl';
        selesai(bl, 'groundcheck.tutupanlahan.', nl2);
      }
      continue;
    }
    if (grup === 'tumbuhan' && x && x.inv) {
      // jenis invasif: juga satu observasi Spesies invasif
      var bi = salin_(b), ni = salin_(nilai);
      delete ni.jenistumbuhan1; delete ni.noplot;
      if (kj) ni[kj.atribut] = { k: kj.kunci };
      ni.tipetemuan = { k: 'spesiesinvasif.tumbuhaninvasif.' };
      bi['ID Observasi'] += '-inv';
      selesai(bi, 'spesiesinvasif.', ni);
    }
    selesai(b, hkey, nilai);
  }
  var n = 0, opsi = { jenis: KOLOM_JENIS, belakang: KOLOM_BELAKANG }, ditulis = {};
  Object.keys(perTab).forEach(function (k) {
    var tj = perTab[k].t;
    ditulis[k] = true;
    n += tambahSaja ? tulisTab_(M, tj.induk, tj.tab, KOLOM_DEPAN, perTab[k].baris, opsi) :
      gantiSumber_(M, tj.induk, tj.tab, label, KOLOM_DEPAN, perTab[k].baris, opsi);
  });
  if (!tambahSaja) grupTab.forEach(function (p) {
    if (!ditulis[p.induk + '|' + p.tab]) gantiSumber_(M, p.induk, p.tab, label, KOLOM_DEPAN, [], {});
  });
  return n;
}

function salin_(o) {
  var b = {};
  for (var k in o) b[k] = o[k];
  return b;
}
