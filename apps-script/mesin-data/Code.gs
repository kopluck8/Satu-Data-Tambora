/**
 * Mesin Data Satu Data Tambora
 *
 * Satu spreadsheet tempat seluruh data Satu Data Tambora berkumpul:
 *   1. file patroli SMART (zip/xml per surat tugas) di folder Google Drive dipecah ke tab rekap sesuai alur peta konsep
 *      (lembar "Rute"); satu observasi boleh masuk ke beberapa tab;
 *   2. jenis kegiatan dibaca dari mandat patroli (lembar "Mandat");
 *   3. nama jenis diseragamkan ke nama ilmiah baku, nama umum, dan nama lokal (lembar "Kamus Jenis");
 *   4. salah ketik label data model dibetulkan (lembar "Ejaan" dan kolom label_baku di "Label Data Model");
 *   5. data sebelum 2027 dan data tab lain (LPK PEH, penyuluhan, RBM, karhut, pulbaket, drone) diseragamkan ke kategori
 *      dan atribut data model 2027 lalu masuk ke rekap yang sama (lembar "Sumber", berkas Sumber.gs);
 *   6. tab "Unduh Data" di hub membaca data dari sini lewat aplikasi web (berkas Unduh.gs, lembar "Katalog").
 *
 * Peta konsep 2027 (perbaikan Deo 27-11-2026): 12 rekap berisi data mentah per kategori data model, terpisah dari hasil
 * analisis. Kartu dan tab hub menyajikan data dari rekap ini. Rekap Temuan Satwa dan Temuan Tumbuhan juga dirute per
 * atribut (seperti query atribut SMART): observasi kategori apa pun yang berisi jenis satwa/tumbuhan ikut masuk, hanya
 * dengan kolom jenis dan jumlah. Tabel Survei Kehati Metode Teknis tetap lengkap di lembar survei (bahan Kalkulator Teknis).
 *
 * Skrip ini menempel pada spreadsheet Mesin Data (Ekstensi > Apps Script). File patroli di folder Drive tidak dipindah
 * atau diubah; berkas yang sudah diproses dicatat di "Log Berkas".
 */

var LEMBAR = {
  atur: 'Pengaturan', induk: 'Induk', rute: 'Rute', mandat: 'Mandat', kamus: 'Kamus Jenis',
  alih: 'Alih Kunci 2026', ejaan: 'Ejaan', label: 'Label Data Model', log: 'Log Berkas',
  belumKamus: 'Jenis Belum di Kamus', tanpaRute: 'Tanpa Rute', sumber: 'Sumber', katalog: 'Katalog',
  logUnduh: 'Log Unduhan'
};
/** Lembar kendali: tidak pernah dianggap tab data. */
var LEMBAR_KENDALI = ['Petunjuk', 'Pengaturan', 'Induk', 'Rute', 'Mandat', 'Kamus Jenis', 'Alih Kunci 2026', 'Ejaan',
  'Label Data Model', 'Nama Tampilan CM', 'Log Berkas', 'Jenis Belum di Kamus', 'Tanpa Rute', 'Sumber', 'Katalog',
  'Log Unduhan'];

/** Nilai kolom Sumber untuk baris dari file patroli yang dibaca langsung dari folder Drive. */
var SUMBER_PATROLI = 'File patroli SMART';
var ZONA = 'Asia/Makassar';

// Atribut jenis, urut prioritas: atribut Tambora (tmb...) dipakai bila terisi karena nilai nasionalnya biasanya "lainnya".
var ATRIBUT_JENIS = ['tmbjenissatwa', 'jenissatwa', 'tmbjenistumbuhan', 'jenistumbuhan', 'jenistumbuhan1'];

var KOLOM_DEPAN = ['ID Observasi', 'Sumber', 'Tanggal', 'Tahun', 'Bulan', 'Waktu', 'Resor', 'SPTN', 'Jenis kegiatan',
  'Mandat', 'ST', 'Leg', 'Kategori 0', 'Kategori 1', 'Kategori 2'];
var KOLOM_JENIS = ['Nama ilmiah baku', 'Nama umum', 'Nama lokal', 'Kelompok jenis', 'Kode jenis'];
var KOLOM_BELAKANG = ['Atribut lain', 'Komentar', 'X', 'Y', 'Foto', 'Kode kategori', 'Kunci titik', 'Berkas', 'Diproses'];
/** Kolom tetap rekap. Atribut berlabel sama (misalnya "Jenis kegiatan") diberi akhiran agar tidak menimpa kolom ini. */
var KOLOM_TETAP = KOLOM_DEPAN.concat(KOLOM_JENIS, KOLOM_BELAKANG);
/** Jenis kegiatan untuk data SMART yang mandatnya tidak ikut tercatat (ekspor tabulasi, salinan Data Masuk Kehati). */
var JENIS_TANPA_MANDAT = 'SMART Patrol (mandat tidak tercatat)';
var KOLOM_UPAYA = ['ID Leg', 'Sumber', 'ST', 'Leg', 'Tanggal mulai', 'Tanggal selesai', 'Tahun', 'Hari patroli', 'Mandat',
  'Jenis kegiatan', 'Transportasi', 'SPTN', 'Tim', 'Resor', 'Ketua', 'Jumlah anggota', 'Anggota',
  'Jumlah waypoint', 'Jumlah observasi', 'Panjang jalur (km)', 'Berkas', 'Diproses'];

// Cadangan bila mandat belum tercantum di lembar Mandat (dicek berurutan).
var ATURAN_MANDAT = [
  [/karhut|kebakaran|\bapi\b/i, 'Patroli dan pengendalian karhutla'],
  [/bersama|gabungan|tni|polri|mmp|mpa|pokma/i, 'Patroli gabungan'],
  [/resort base|\brbm\b/i, 'Kegiatan RBM lainnya'],
  [/satwa kunci|elang flores|rusa timor/i, 'Monitoring satwa kunci'],
  [/kehati|\bpeh\b|inventarisasi|survei|survey|monitoring|biodiversity|identifikasi|ground ?check|stok karbon/i,
    'Inventarisasi dan monitoring kehati (PEH)'],
  [/penyuluh|sosialisasi|pemberdaya|anjangsana|kelompok|goes to school|kader/i, 'Penyuluhan dan pemberdayaan'],
  [/pendakian|odtwa|wisata/i, 'Penjagaan jalur pendakian dan ODTWA'],
  [/sanctuary/i, 'Pengelolaan Sanctuary Rusa Timor'],
  [/sarpras|sarana|prasarana|pemeliharaan|pal batas/i, 'Pemeliharaan sarana prasarana'],
  [/tipihut|pengamanan|gangguan|patrol/i, 'Patroli pengamanan kawasan']
];

/* =========================== menu =========================== */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Mesin Data')
    .addItem('1. Siapkan tab dan cek pengaturan', 'siapkanSpreadsheetInduk')
    .addItem('2. Proses file patroli sekarang', 'prosesFileMasuk')
    .addItem('3. Perbarui data sumber lain sekarang', 'perbaruiSemuaSumber')
    .addItem('4. Pasang pemicu otomatis', 'pasangPemicu')
    .addSeparator()
    .addItem('Perbarui katalog Unduh Data', 'perbaruiKatalog')
    .addItem('Uji Unduh Data (tanpa hub)', 'ujiUnduhData')
    .addItem('Rapikan nama di semua rekap (setelah Kamus/Ejaan diubah)', 'rapikanSemuaRekap')
    .addItem('Proses ulang semua file patroli', 'prosesUlangSemua')
    .addItem('Hentikan pemicu otomatis', 'hapusPemicu')
    .addToUi();
}

function kabari_(pesan) {
  Logger.log(pesan);
  try { SpreadsheetApp.getActive().toast(pesan, 'Mesin Data', 8); } catch (e) { /* dijalankan dari pemicu atau web */ }
}

/* =========================== baca lembar kendali =========================== */

function bacaTabel_(ss, nama, boleh) {
  var sh = ss.getSheetByName(nama);
  if (!sh) {
    if (boleh) return [];
    throw new Error('Lembar "' + nama + '" tidak ditemukan di spreadsheet Mesin Data.');
  }
  var v = sh.getDataRange().getValues();
  var kepala = v.shift().map(function (h) { return String(h).trim(); });
  return v.filter(function (r) { return r.some(function (c) { return c !== '' && c !== null; }); })
    .map(function (r) {
      var o = {};
      kepala.forEach(function (h, i) { o[h] = typeof r[i] === 'string' ? r[i].trim() : r[i]; });
      return o;
    });
}

function kunci_(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
}

function escRe_(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function muatMesin_() {
  var ss = SpreadsheetApp.getActive();
  var M = { ss: ss, atur: {}, induk: {}, urutInduk: [], rute: [], mandat: {}, kamus: {}, kamusLabel: {}, alih: {},
    ejaan: [], label: {}, hkeyLabel: {}, buka: {}, tab: {}, idAda: {}, titikLain: {}, belumKamus: {}, tanpaRute: {},
    diubah: {} };
  bacaTabel_(ss, LEMBAR.atur).forEach(function (r) { M.atur[r.kunci] = r.nilai; });
  bacaTabel_(ss, LEMBAR.induk).forEach(function (r) { M.induk[r.kode] = r; M.urutInduk.push(r.kode); });
  bacaTabel_(ss, LEMBAR.ejaan).forEach(function (r) {
    if (String(r.aktif).toLowerCase() !== 'ya' || !r.salah) return;
    M.ejaan.push({ re: new RegExp('(?<![\\p{L}\\p{N}_.])' + escRe_(String(r.salah)) + '(?![\\p{L}\\p{N}_.])', 'gu'),
      benar: String(r.benar) });
  });
  bacaTabel_(ss, LEMBAR.label).forEach(function (r) {
    var k = r.jenis === 'kategori' ? 'k|' + r.kunci : r.jenis === 'atribut' ? 'a|' + r.kunci : 'n|' + r.atribut + '|' + r.kunci;
    M.label[k] = r.label_baku ? String(r.label_baku) : baku_(M, String(r.label_smart));
    if (r.jenis === 'kategori') {
      // Untuk data ekspor SMART (CSV/spreadsheet) yang hanya memuat nama kategori: nama jalur kategori -> kunci.
      [r.label_smart, r.label_baku].forEach(function (l) { if (l) M.hkeyLabel[kunci_(l)] = M.hkeyLabel[kunci_(l)] || String(r.kunci); });
    }
  });
  bacaTabel_(ss, LEMBAR.rute).forEach(function (r) {
    if (r.kategori_hkey && r.nama_kategori && String(r.kategori_hkey).charAt(0) !== '@')
      M.hkeyLabel[kunci_(r.nama_kategori)] = M.hkeyLabel[kunci_(r.nama_kategori)] || String(r.kategori_hkey);
    if (!r.kategori_hkey || !r.tab_tujuan) return;
    var hk = String(r.kategori_hkey).trim();
    M.rute.push({ hkey: hk, penghubung: r.penghubung, tab: String(r.tab_tujuan), induk: r.induk,
      atribut: String(r.atribut || '').split(',').map(function (s) { return s.trim(); }).filter(String),
      syarat: String(r.syarat_jenis_kegiatan || '').split(',').map(function (s) { return kunci_(s); }).filter(String),
      // "@a|b": rute per atribut (observasi kategori apa pun yang berisi atribut a atau b)
      syaratAtribut: hk.charAt(0) === '@' ? hk.slice(1).split('|').map(function (s) { return s.trim(); }).filter(String) : null,
      // atribut_lain "tidak": atribut di luar kolom atribut tidak ditulis (juga tidak ke kolom Atribut lain)
      atributLain: String(r.atribut_lain || '').trim().toLowerCase() !== 'tidak' });
  });
  bacaTabel_(ss, LEMBAR.mandat).forEach(function (r) { M.mandat[kunci_(r.mandat)] = r.jenis_kegiatan; });
  bacaTabel_(ss, LEMBAR.kamus).forEach(function (r) {
    if (r.atribut && r.kunci) M.kamus[r.atribut + '|' + r.kunci] = r;
    if (r.atribut_2026 && r.kunci_2026) M.kamus[r.atribut_2026 + '|' + r.kunci_2026] = r;
    // Ekspor SMART hanya memuat label jenis: label -> baris kamus (label pertama yang ditemukan dipakai).
    [r.label_smart, r.nama_ilmiah_baku && r.nama_umum ? r.nama_umum + ' - ' + r.nama_ilmiah_baku : ''].forEach(function (l) {
      var k = kunci_(l);
      if (k && !M.kamusLabel[k]) M.kamusLabel[k] = r;
    });
  });
  bacaTabel_(ss, LEMBAR.alih).forEach(function (r) {
    M.alih[r.atribut_2026 + '|' + r.kunci_2026] = { atribut: r.atribut_2027, kunci: r.kunci_2027 };
  });
  pulihkanNamaTab_(M);
  return M;
}

/**
 * File Excel membatasi nama lembar 31 huruf. Bila Mesin Data pernah lewat file Excel, tab data yang namanya lebih
 * panjang terpotong; tab itu dinamai ulang ke nama lengkapnya (dari Rute, Sumber, dan Pengaturan).
 */
function pulihkanNamaTab_(M) {
  var potong = {}, n = 0;
  Object.keys(tabData_(M)).forEach(function (t) { if (t.length > 31) potong[t.slice(0, 31).trim()] = t; });
  if (!Object.keys(potong).length) return 0;
  M.ss.getSheets().forEach(function (s) {
    var penuh = potong[s.getName().trim()];
    if (penuh && !M.ss.getSheetByName(penuh)) { s.setName(penuh); n++; }
  });
  return n;
}

/** Lembar bernama nama, atau lembar yang namanya terpotong 31 huruf dari nama itu (belum dipulihkan). */
function cariLembar_(ss, nama) {
  var sh = ss.getSheetByName(nama);
  if (sh || nama.length <= 31) return sh;
  var pendek = nama.slice(0, 31).trim();
  return ss.getSheets().filter(function (s) { return s.getName().trim() === pendek; })[0] || null;
}

/** Terapkan aturan Ejaan pada satu teks label. */
function baku_(M, teks) {
  var t = String(teks || '');
  M.ejaan.forEach(function (e) { t = t.replace(e.re, e.benar); });
  return t;
}

function labelKategori_(M, hkey) {
  var segs = hkey.split('.').filter(String), out = [];
  for (var i = 0; i < segs.length; i++) {
    var p = segs.slice(0, i + 1).join('.') + '.';
    var l = M.label['k|' + p];
    out.push(l ? l.split(' > ').pop() : segs[i]);
  }
  return out;
}

function labelAtribut_(M, key) { return M.label['a|' + key] || key; }

/** Judul kolom untuk satu atribut: labelnya, diberi akhiran bila sama dengan kolom tetap. */
function judulAtribut_(M, key) {
  var j = labelAtribut_(M, key);
  return KOLOM_TETAP.indexOf(j) >= 0 ? j + ' (isian patroli)' : j;
}

function labelNilai_(M, atr, key) {
  return M.label['n|' + atr + '|' + key] || (key.split('.').filter(String).pop() || key);
}

function jenisKegiatan_(M, mandat) {
  var j = M.mandat[kunci_(mandat)];
  if (j) return j;
  for (var i = 0; i < ATURAN_MANDAT.length; i++) if (ATURAN_MANDAT[i][0].test(mandat || '')) return ATURAN_MANDAT[i][1];
  return mandat ? 'Belum dipetakan' : '';
}

/** Kunci satu titik (waypoint) untuk membuang data ganda antarsumber: tanggal, jam, dan koordinat 5 desimal. */
function kunciTitik_(tgl, waktu, x, y) {
  if (!tgl || typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) return '';
  return String(tgl).slice(0, 10) + ' ' + String(waktu || '').slice(0, 8) + ' ' + x.toFixed(5) + ' ' + y.toFixed(5);
}

/** Teks yang akan dibaca Sheets sebagai angka, tanggal, jam, atau rumus (misalnya "17:17:01", "=...", "12/3"). */
var POLA_DIBACA_SHEETS = new RegExp('^[=+@\'-]|^[\\d\\s.,:/%$()e+-]+$|^(true|false)$|^(\\d{1,2}[\\s/.-])?' +
  '(jan|feb|mar|apr|mei|may|jun|jul|agu|agt|aug|sep|okt|oct|nov|des|dec)[a-z]*\\.?([\\s/.,-]+\\d{1,4}){1,2}$', 'i');

/**
 * Nilai sel yang aman ditulis lewat setValues: angka biasa dalam bentuk teks jadi angka, teks lain yang bisa salah
 * terbaca (jam, tanggal, kode berawalan nol, rumus) diberi tanda kutip satu agar tersimpan sebagai teks apa adanya.
 */
function amanSel_(v) {
  if (typeof v !== 'string' || v === '') return v;
  if (/^-?(0|[1-9]\d{0,14})(\.\d*[1-9])?$/.test(v)) return Number(v);
  return POLA_DIBACA_SHEETS.test(v) ? "'" + v : v;
}

/** Zona waktu spreadsheet disamakan dengan zona skrip agar tanggal yang ditulis skrip tidak bergeser sehari. */
function samakanZona_(ss) {
  var z = Session.getScriptTimeZone();
  if (z && ss.getSpreadsheetTimeZone() !== z) ss.setSpreadsheetTimeZone(z);
}

/* =========================== batas resor =========================== */

function muatResor_(M) {
  if (M.resor) return M.resor;
  M.resor = [];
  M.sptnResor = M.sptnResor || {};
  var url = M.atur.URL_BATAS_RESOR;
  if (!url) return M.resor;
  var g = JSON.parse(UrlFetchApp.fetch(url, { muteHttpExceptions: false }).getContentText());
  g.features.forEach(function (f) {
    var p = f.properties || {};
    var nama = String(p.nama || p.NAME || p.Nama || '').replace(/^\s*(resort|resor)\s+/i, '');
    nama = 'Resor ' + nama;
    var sptn = String(p.sptn || p.SPTN || '').trim();
    if (sptn) M.sptnResor[nama] = /^ii\b|pekat/i.test(sptn) ? 'SPTN Wilayah II Pekat' : /^i\b|kore/i.test(sptn) ? 'SPTN Wilayah I Kore' : sptn;
    var polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
    polys.forEach(function (poly) {
      var xs = poly[0].map(function (c) { return c[0]; }), ys = poly[0].map(function (c) { return c[1]; });
      M.resor.push({ nama: nama, poly: poly, bb: [Math.min.apply(null, xs), Math.min.apply(null, ys),
        Math.max.apply(null, xs), Math.max.apply(null, ys)] });
    });
  });
  return M.resor;
}

/** SPTN dari nama resor 2026 (dari properti batas resor). */
function sptnResor_(M, resor) {
  muatResor_(M);
  return (M.sptnResor || {})[resor] || '';
}

/** Nama resor lama atau tanpa awalan ("Doro Ncanga", "Resort Piong") ke nama resor 2026 ("Resor Doroncanga"). */
function namaResor_(s) {
  var t = String(s || '').replace(/^\s*(resort|resor)\s+/i, '').trim();
  if (!t) return '';
  var k = kunci_(t);
  var baku = { doroncanga: 'Doroncanga', dorotabe: 'Doro Tabe', doropeti: 'Doropeti', pancasila: 'Pancasila', piong: 'Piong',
    oikatupa: 'Oi Katupa', kawindatoi: 'Kawinda Toi' }[k];
  return baku ? 'Resor ' + baku : '';
}

function dalam_(x, y, ring) {
  var ada = false;
  for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ada = !ada;
  }
  return ada;
}

function jarakM_(a, b) {
  var R = 6371008.8, r = Math.PI / 180;
  var la1 = a[1] * r, la2 = b[1] * r, dla = la2 - la1, dlo = (b[0] - a[0]) * r;
  var h = Math.pow(Math.sin(dla / 2), 2) + Math.cos(la1) * Math.cos(la2) * Math.pow(Math.sin(dlo / 2), 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Resor dari koordinat; titik di luar batas (misalnya desa penyangga) ikut resor terdekat dalam 3 km. */
function cariResor_(M, x, y) {
  if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) return '';
  var R = muatResor_(M), i;
  for (i = 0; i < R.length; i++) {
    var b = R[i].bb;
    if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] && dalam_(x, y, R[i].poly[0]) &&
        !R[i].poly.slice(1).some(function (h) { return dalam_(x, y, h); })) return R[i].nama;
  }
  var best = '', jarak = 3000;
  for (i = 0; i < R.length; i++) {
    var bb = R[i].bb;
    if (x < bb[0] - 0.03 || x > bb[2] + 0.03 || y < bb[1] - 0.03 || y > bb[3] + 0.03) continue;
    R[i].poly[0].forEach(function (c) {
      var d = jarakM_([x, y], c);
      if (d < jarak) { jarak = d; best = R[i].nama; }
    });
  }
  return best;
}

/* =========================== geometri jalur (WKB) =========================== */

function bacaWkb_(hex) {
  var n = hex.length / 2, b = new Uint8Array(n);
  for (var i = 0; i < n; i++) b[i] = parseInt(hex.substr(i * 2, 2), 16);
  var dv = new DataView(b.buffer), pos = 0;
  function geom() {
    var le = b[pos] === 1; pos += 1;
    var t = dv.getUint32(pos, le); pos += 4;
    var z = !!(t & 0x80000000), m = !!(t & 0x40000000);
    if (t & 0x20000000) pos += 4;
    t = t & 0x0FFFFFFF;
    if (t >= 1000) { var g = Math.floor(t / 1000); z = z || g === 1 || g === 3; m = m || g === 2 || g === 3; t = t % 1000; }
    var dim = 2 + (z ? 1 : 0) + (m ? 1 : 0), k, out = [];
    if (t === 2) {
      var np = dv.getUint32(pos, le); pos += 4;
      var pts = [];
      for (k = 0; k < np; k++) { pts.push([dv.getFloat64(pos, le), dv.getFloat64(pos + 8, le)]); pos += 8 * dim; }
      return [pts];
    }
    if (t === 5) {
      var nl = dv.getUint32(pos, le); pos += 4;
      for (k = 0; k < nl; k++) out = out.concat(geom());
      return out;
    }
    throw new Error('Tipe WKB ' + t + ' tidak didukung');
  }
  return geom();
}

/* =========================== baca file patroli =========================== */

function anak_(el, nama) { return el.getChildren(nama, el.getNamespace()); }
function satu_(el, nama) { return el.getChild(nama, el.getNamespace()); }
function at_(el, nama) { var a = el && el.getAttribute(nama); return a ? a.getValue() : ''; }
function nilaiEl_(el, nama) {
  var c = satu_(el, nama);
  if (!c) return '';
  return at_(c, 'value') || c.getText() || '';
}
function turunan_(el, nama, hasil) {
  hasil = hasil || [];
  el.getChildren().forEach(function (c) {
    if (c.getName() === nama) hasil.push(c);
    turunan_(c, nama, hasil);
  });
  return hasil;
}
function angka_(v) {
  if (v === '' || v === null || v === undefined) return '';
  var f = Number(v);
  return isNaN(f) ? v : f;
}
function tanggal_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : '';
}

/** Daftar {nama, xml} dari satu berkas Drive (zip berisi xml, atau xml langsung). */
function isiBerkas_(file) {
  var nama = file.getName(), blob = file.getBlob(), out = [];
  if (/\.zip$/i.test(nama)) {
    Utilities.unzip(blob).forEach(function (b) {
      var n = b.getName();
      if (/\.xml$/i.test(n) && n.replace(/^\/+|\/+$/g, '').indexOf('/') < 0) out.push({ nama: nama, xml: b.getDataAsString('UTF-8') });
    });
  } else if (/\.xml$/i.test(nama)) {
    out.push({ nama: nama, xml: blob.getDataAsString('UTF-8') });
  }
  return out;
}

/** Ubah satu XML patroli menjadi {obs: [...], leg: [...]} dengan kunci data model (belum diberi label). */
function bacaPatroli_(xml, namaBerkas) {
  var root = XmlService.parse(xml).getRootElement();
  var st = at_(root, 'id') || namaBerkas;
  var sptn = nilaiEl_(root, 'station'), tim = nilaiEl_(root, 'team');
  var obs = [], legs = [];
  anak_(root, 'legs').forEach(function (leg) {
    var legId = at_(leg, 'id'), mandat = nilaiEl_(leg, 'mandate');
    var anggota = anak_(leg, 'members');
    var namaOrang = function (m) { return (at_(m, 'givenName') + ' ' + at_(m, 'familyName')).trim(); };
    var hari = anak_(leg, 'days'), nWp = 0, nObs = 0;
    hari.forEach(function (day) {
      var tgl = at_(day, 'date');
      anak_(day, 'waypoints').forEach(function (wp) {
        nWp++;
        var x = angka_(at_(wp, 'x')), y = angka_(at_(wp, 'y'));
        var kom = (satu_(wp, 'comment') ? satu_(wp, 'comment').getText() : '').trim();
        anak_(wp, 'groups').forEach(function (grp, gi) {
          anak_(grp, 'observations').forEach(function (o) {
            nObs++;
            var atr = {};
            anak_(o, 'attributes').forEach(function (a) {
              var ak = at_(a, 'attributeKey'), items = anak_(a, 'itemKey').map(function (i) { return i.getText(); }).filter(String);
              if (items.length) atr[ak] = { items: items };
              else if (satu_(a, 'dValue')) atr[ak] = { nilai: angka_(satu_(a, 'dValue').getText()) };
              else if (satu_(a, 'bValue')) atr[ak] = { nilai: satu_(a, 'bValue').getText() === 'true' ? 'Ya' : 'Tidak' };
              else atr[ak] = { nilai: (satu_(a, 'sValue') ? satu_(a, 'sValue').getText() : '').trim() };
            });
            obs.push({ st: st, sptn: sptn, leg: legId, mandat: mandat, tgl: tgl, waktu: at_(wp, 'time'), x: x, y: y,
              komentar: kom, hkey: at_(o, 'categoryKey'), atr: atr, foto: anak_(o, 'attachments').length,
              wp: at_(wp, 'id'), grup: gi });
          });
        });
      });
    });
    var garis = [];
    turunan_(leg, 'track').forEach(function (tr) {
      var g = at_(tr, 'geom');
      if (g) garis = garis.concat(bacaWkb_(g).filter(function (l) { return l.length > 1; }));
    });
    var panjang = 0;
    garis.forEach(function (g) { for (var i = 0; i + 1 < g.length; i++) panjang += jarakM_(g[i], g[i + 1]); });
    legs.push({ st: st, leg: legId, mulai: at_(leg, 'startDate'), selesai: at_(leg, 'endDate'), hari: hari.length,
      mandat: mandat, moda: nilaiEl_(leg, 'transportType'), sptn: sptn, tim: tim,
      ketua: anggota.filter(function (m) { return at_(m, 'isLeader') === 'true'; }).map(namaOrang).join(', '),
      anggota: anggota.map(namaOrang), nWp: nWp, nObs: nObs, panjangKm: Math.round(panjang / 10) / 100, garis: garis });
  });
  return { obs: obs, leg: legs };
}

/* =========================== olah observasi =========================== */

/** Kunci 2026 yang dialihkan ke kunci 2027 (lembar Alih Kunci 2026). */
function alihKunci_(M, atr) {
  var out = {};
  Object.keys(atr).forEach(function (ak) {
    var v = atr[ak];
    if (!v.items) { out[ak] = v; return; }
    v.items.forEach(function (ik) {
      var t = M.alih[ak + '|' + ik] || { atribut: ak, kunci: ik };
      out[t.atribut] = out[t.atribut] || { items: [] };
      if (out[t.atribut].items.indexOf(t.kunci) < 0) out[t.atribut].items.push(t.kunci);
    });
  });
  return out;
}

function nilaiTampil_(M, ak, v) {
  if (v.items) return v.items.map(function (ik) { return labelNilai_(M, ak, ik); }).join(', ');
  return typeof v.nilai === 'string' ? baku_(M, v.nilai) : v.nilai;
}

function barisKamus_(k, kode) {
  return { 'Nama ilmiah baku': k.nama_ilmiah_baku || '', 'Nama umum': k.nama_umum || '',
    'Nama lokal': k.nama_lokal || '', 'Kelompok jenis': k.kelompok || '', 'Kode jenis': kode };
}

/** Nama jenis dari label saja (kamus tidak memuatnya): "Nama umum - Nama ilmiah" dipisah bila bentuknya cocok. */
function namaDariLabel_(lab, kelompok, kode) {
  var bagian = String(lab || '').split(' - ');
  var ilm = bagian.length > 1 && /^[A-Z][a-z]+ [a-z.-]+/.test(bagian[bagian.length - 1].trim()) ? bagian.pop().trim() : '';
  return { 'Nama ilmiah baku': ilm, 'Nama umum': ilm ? bagian.join(' - ').trim() : String(lab || ''), 'Nama lokal': '',
    'Kelompok jenis': kelompok || '', 'Kode jenis': kode };
}

/** Nama jenis baku dari Kamus Jenis; atribut Tambora diutamakan. */
function namaJenis_(M, atr, berkas) {
  for (var i = 0; i < ATRIBUT_JENIS.length; i++) {
    var ak = ATRIBUT_JENIS[i], v = atr[ak];
    if (!v || !v.items || !v.items.length) continue;
    var ik = v.items[0], k = M.kamus[ak + '|' + ik];
    if (k) return barisKamus_(k, ak + '|' + ik);
    var lab = labelNilai_(M, ak, ik);
    if (!M.belumKamus[ak + '|' + ik]) M.belumKamus[ak + '|' + ik] = [ak, ik, lab, new Date(), berkas];
    return namaDariLabel_(lab, ik.split('.')[0] || '', ak + '|' + ik);
  }
  return null;
}

function md5_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function idObservasi_(o) {
  // Waypoint yang sama bisa ikut di lebih dari satu file ST: ID dari isi, bukan dari nomor ST.
  var atr = {};
  Object.keys(o.atr).sort().forEach(function (k) { atr[k] = o.atr[k]; });
  return 'ptr-' + md5_(JSON.stringify([o.tgl, o.waktu, o.x, o.y, o.hkey, atr])).slice(0, 16);
}

/**
 * Rute yang cocok untuk satu observasi (awalan hkey + syarat jenis kegiatan); satu tab hanya sekali. Rute kategori
 * didahulukan; rute per atribut ("@...") dipakai bila observasi berisi salah satu atribut syaratnya (adaAtribut:
 * {kunci atribut: true}) dan tabnya belum terisi rute kategori.
 */
function cariRute_(M, hkey, jenis, adaAtribut) {
  var dipakai = {}, hasil = [];
  var urut = M.rute.filter(function (r) { return !r.syaratAtribut; }).concat(M.rute.filter(function (r) { return r.syaratAtribut; }));
  urut.forEach(function (r) {
    if (r.syaratAtribut) {
      if (!adaAtribut || !r.syaratAtribut.some(function (a) { return adaAtribut[a]; })) return;
    } else if (hkey.indexOf(r.hkey) !== 0) return;
    if (r.syarat.length && r.syarat.indexOf(kunci_(jenis)) < 0) return;
    var k = r.induk + '|' + r.tab;
    if (dipakai[k]) return;
    dipakai[k] = true;
    hasil.push(r);
  });
  return hasil;
}

function catatTanpaRute_(M, hkey, nama, berkas) {
  var t = M.tanpaRute[hkey] || (M.tanpaRute[hkey] = [hkey, nama, 0, new Date(), berkas]);
  t[2]++;
}

/** Ubah satu observasi mentah menjadi baris per tab: [{induk, tab, baris, urutAtribut}]. */
function olahObservasi_(M, o, berkas, sekarang) {
  o.atr = alihKunci_(M, o.atr);
  var jenis = jenisKegiatan_(M, o.mandat);
  var ada = {};
  Object.keys(o.atr).forEach(function (ak) { if (o.atr[ak] !== '' && o.atr[ak] !== null && o.atr[ak] !== undefined) ada[ak] = true; });
  var rute = cariRute_(M, o.hkey, jenis, ada);
  var kat = labelKategori_(M, o.hkey);
  if (!rute.length) { catatTanpaRute_(M, o.hkey, kat.join(' > '), berkas); return []; }
  var tgl = tanggal_(o.tgl), resor = cariResor_(M, o.x, o.y);
  var dasar = {
    'ID Observasi': idObservasi_(o), 'Sumber': SUMBER_PATROLI, 'Tanggal': tgl, 'Tahun': tgl ? tgl.getFullYear() : '',
    'Bulan': tgl ? tgl.getMonth() + 1 : '', 'Waktu': o.waktu, 'Resor': resor, 'SPTN': sptnResor_(M, resor) || o.sptn,
    'Jenis kegiatan': jenis, 'Mandat': o.mandat, 'ST': o.st, 'Leg': o.leg,
    'Kategori 0': kat[0] || '', 'Kategori 1': kat[1] || '', 'Kategori 2': kat.slice(2).join(' > '),
    'Komentar': o.komentar, 'X': o.x, 'Y': o.y, 'Foto': o.foto, 'Kode kategori': o.hkey,
    'Kunci titik': kunciTitik_(o.tgl, o.waktu, o.x, o.y), 'Berkas': berkas, 'Diproses': sekarang
  };
  var jenisNama = namaJenis_(M, o.atr, berkas);
  return rute.map(function (r) {
    var b = {}, k;
    for (k in dasar) b[k] = dasar[k];
    if (jenisNama) for (k in jenisNama) b[k] = jenisNama[k];
    var pilih = r.atribut.length ? r.atribut : Object.keys(o.atr);
    var lain = [];
    pilih.forEach(function (ak) { if (o.atr[ak]) b[judulAtribut_(M, ak)] = nilaiTampil_(M, ak, o.atr[ak]); });
    Object.keys(o.atr).forEach(function (ak) {
      if (pilih.indexOf(ak) < 0) {
        var v = nilaiTampil_(M, ak, o.atr[ak]);
        if (v !== '' && v !== null) lain.push(labelAtribut_(M, ak) + ': ' + v);
      }
    });
    if (lain.length && r.atributLain) b['Atribut lain'] = lain.join('; ');
    return { induk: r.induk, tab: r.tab, baris: b, urutAtribut: pilih.map(function (ak) { return judulAtribut_(M, ak); }) };
  });
}

/** Resor jalur = resor yang paling banyak dilalui titik jalur (contoh tiap ~1/200 titik). */
function resorJalur_(M, garis) {
  var hitung = {}, semua = [];
  garis.forEach(function (g) { semua = semua.concat(g); });
  var langkah = Math.max(1, Math.floor(semua.length / 200));
  for (var i = 0; i < semua.length; i += langkah) {
    var r = cariResor_(M, semua[i][0], semua[i][1]);
    if (r) hitung[r] = (hitung[r] || 0) + 1;
  }
  return Object.keys(hitung).sort(function (a, b) { return hitung[b] - hitung[a]; })[0] || '';
}

function olahLeg_(M, l, berkas, sekarang) {
  var resor = resorJalur_(M, l.garis);
  var mulai = tanggal_(l.mulai);
  return {
    'ID Leg': l.st + '|' + l.leg + '|' + l.mulai, 'Sumber': SUMBER_PATROLI, 'ST': l.st, 'Leg': l.leg, 'Tanggal mulai': mulai,
    'Tanggal selesai': tanggal_(l.selesai), 'Tahun': mulai ? mulai.getFullYear() : '', 'Hari patroli': l.hari,
    'Mandat': l.mandat, 'Jenis kegiatan': jenisKegiatan_(M, l.mandat), 'Transportasi': l.moda, 'SPTN': l.sptn,
    'Tim': l.tim, 'Resor': resor, 'Ketua': l.ketua, 'Jumlah anggota': l.anggota.length, 'Anggota': l.anggota.join(', '),
    'Jumlah waypoint': l.nWp, 'Jumlah observasi': l.nObs, 'Panjang jalur (km)': l.panjangKm, 'Berkas': berkas,
    'Diproses': sekarang
  };
}

/* =========================== tulis ke tab data =========================== */

/** Spreadsheet tempat satu induk disimpan. Kosong atau "ini" = spreadsheet Mesin Data ini (bawaan). */
function bukaInduk_(M, kode) {
  if (M.buka[kode]) return M.buka[kode];
  var ind = M.induk[kode], id = ind ? String(ind.id_spreadsheet || '').trim() : '';
  if (!id || /^(ini|baru)$/i.test(id)) return (M.buka[kode] = M.ss);
  return (M.buka[kode] = SpreadsheetApp.openById(id));
}

function tabInduk_(M, kode, nama, kolomAwal) {
  var k = kode + '|' + nama;
  if (M.tab[k]) return M.tab[k];
  if (LEMBAR_KENDALI.indexOf(nama) >= 0) throw new Error('Nama tab "' + nama + '" dipakai lembar kendali.');
  var ss = bukaInduk_(M, kode), sh = ss.getSheetByName(nama);
  if (!sh) {
    sh = ss.insertSheet(nama, ss.getSheets().length);
    sh.getRange(1, 1, 1, kolomAwal.length).setValues([kolomAwal]).setFontWeight('bold');
    sh.setFrozenRows(1);
    var w = M.induk[kode] && M.induk[kode].warna;
    if (w) sh.setTabColor(String(w));
  }
  var lc = Math.max(1, sh.getLastColumn());
  var kepala = sh.getRange(1, 1, 1, lc).getValues()[0].map(String).filter(String);
  return (M.tab[k] = { sh: sh, kepala: kepala });
}

/**
 * ID yang sudah ada di satu tab, dan kunci titik milik sumber lain (bukan file patroli). Titik yang sudah tercatat dari
 * sumber lain (data awal, rekap spreadsheet SMART) tidak ditulis lagi dari file patroli agar tidak ganda.
 */
function idTab_(M, kode, nama, t) {
  var k = kode + '|' + nama;
  if (M.idAda[k]) return M.idAda[k];
  var set = {}, titik = {}, n = t.sh.getLastRow() - 1;
  var iS = t.kepala.indexOf('Sumber'), iT = t.kepala.indexOf('Kunci titik');
  if (n > 0) {
    var v = t.sh.getRange(2, 1, n, t.kepala.length).getValues();
    v.forEach(function (r) {
      set[String(r[0])] = true;
      if (iT >= 0 && r[iT] && (iS < 0 || r[iS] !== SUMBER_PATROLI)) titik[String(r[iT])] = true;
    });
  }
  M.titikLain[k] = titik;
  return (M.idAda[k] = set);
}

/** Urutan kolom gabungan: kolom tetap, lalu kolom baru dari baris, lalu kolom penutup. */
function susunKepala_(kepalaLama, kolomAwal, baris, opsi) {
  var belakang = opsi.belakang || [], jenis = opsi.jenis || [];
  var tetap = kolomAwal.slice();
  if (baris.some(function (b) { return jenis.some(function (h) { return b[h]; }); })) tetap = tetap.concat(jenis);
  tetap = tetap.concat(opsi.atribut || []);
  var calon = tetap.slice();
  baris.forEach(function (b) {
    Object.keys(b).forEach(function (h) {
      if (calon.indexOf(h) < 0 && belakang.indexOf(h) < 0 && jenis.indexOf(h) < 0) calon.push(h);
    });
  });
  calon = calon.concat(belakang);
  var hasil = kepalaLama.slice();
  calon.forEach(function (h) { if (hasil.indexOf(h) < 0) hasil.push(h); });
  return hasil;
}

function lebarKolom_(t, kepala) {
  var perlu = kepala.slice(t.kepala.length);
  if (perlu.length) {
    t.sh.getRange(1, t.kepala.length + 1, 1, perlu.length).setValues([perlu]).setFontWeight('bold');
    t.kepala = kepala;
  }
}

function nilaiBaris_(kepala, b) {
  return kepala.map(function (h) { return b[h] === undefined || b[h] === null ? '' : amanSel_(b[h]); });
}

/**
 * Tambahkan baris baru (yang ID-nya belum ada) ke satu tab. Kolom yang belum ada ditambahkan di ujung kanan.
 * opsi.jenis: kolom nama jenis (dipasang bersama bila salah satunya terisi); opsi.atribut: kolom atribut dari Rute
 * (selalu dipasang agar urutan tetap); opsi.belakang: kolom penutup (selalu dipasang);
 * opsi.lewatiTitik: lewati baris yang kunci titiknya sudah tercatat dari sumber lain.
 */
function tulisTab_(M, kode, nama, kolomAwal, baris, opsi) {
  opsi = opsi || {};
  var t = tabInduk_(M, kode, nama, kolomAwal), ada = idTab_(M, kode, nama, t), idKol = kolomAwal[0];
  var titik = M.titikLain[kode + '|' + nama] || {};
  var baru = baris.filter(function (b) {
    var id = String(b[idKol]);
    if (ada[id]) return false;
    if (opsi.lewatiTitik && b['Kunci titik'] && titik[b['Kunci titik']]) return false;
    ada[id] = true;
    return true;
  });
  if (!baru.length) return 0;
  lebarKolom_(t, susunKepala_(t.kepala, kolomAwal, baru, opsi));
  var nilai = baru.map(function (b) { return nilaiBaris_(t.kepala, b); });
  t.sh.getRange(t.sh.getLastRow() + 1, 1, nilai.length, t.kepala.length).setValues(nilai);
  M.diubah[nama] = true;
  return nilai.length;
}

/**
 * Ganti semua baris milik satu sumber di satu tab dengan baris baru (dipakai sumber yang isinya diperbarui utuh,
 * misalnya data awal, LPK PEH, laporan penyuluhan). Baris sumber lain tidak disentuh. Baris baru yang ID atau kunci
 * titiknya sudah ada dari sumber lain dilewati. Mengembalikan jumlah baris yang ditulis.
 */
function gantiSumber_(M, kode, nama, label, kolomAwal, baris, opsi) {
  opsi = opsi || {};
  var t = tabInduk_(M, kode, nama, kolomAwal), sh = t.sh, n = sh.getLastRow() - 1;
  var lama = n > 0 ? sh.getRange(2, 1, n, t.kepala.length).getValues() : [];
  var iS = t.kepala.indexOf('Sumber'), iT = t.kepala.indexOf('Kunci titik');
  var simpan = lama.filter(function (r) { return iS < 0 || String(r[iS]) !== label; });
  var idAda = {}, titik = {};
  simpan.forEach(function (r) {
    idAda[String(r[0])] = true;
    if (iT >= 0 && r[iT]) titik[String(r[iT])] = true;
  });
  var idKol = kolomAwal[0];
  var baru = baris.filter(function (b) {
    var id = String(b[idKol]);
    if (idAda[id]) return false;
    if (b['Kunci titik'] && titik[b['Kunci titik']]) return false;
    idAda[id] = true;
    return true;
  });
  if (simpan.length === lama.length && !baru.length) return 0;
  var kepala = susunKepala_(t.kepala, kolomAwal, baru, opsi);
  var semua = simpan.map(function (r) {
    var x = r.map(amanSel_);
    while (x.length < kepala.length) x.push('');
    return x;
  }).concat(baru.map(function (b) { return nilaiBaris_(kepala, b); }));
  if (lama.length) sh.getRange(2, 1, lama.length, t.kepala.length).clearContent();
  if (kepala.length > t.kepala.length) sh.getRange(1, 1, 1, kepala.length).setValues([kepala]).setFontWeight('bold');
  t.kepala = kepala;
  if (semua.length) sh.getRange(2, 1, semua.length, kepala.length).setValues(semua);
  delete M.idAda[kode + '|' + nama];
  M.diubah[nama] = true;
  return baru.length;
}

/** Tulis ulang satu tab utuh (tab rujukan seperti Daftar Jenis, Rencana RBM, titik panas). */
function tulisUtuh_(M, kode, nama, kolom, baris) {
  var t = tabInduk_(M, kode, nama, kolom), sh = t.sh;
  var kepala = susunKepala_([], kolom, baris, {});
  sh.clearContents();
  sh.getRange(1, 1, 1, kepala.length).setValues([kepala]).setFontWeight('bold');
  sh.setFrozenRows(1);
  if (baris.length) sh.getRange(2, 1, baris.length, kepala.length).setValues(baris.map(function (b) { return nilaiBaris_(kepala, b); }));
  t.kepala = kepala;
  delete M.idAda[kode + '|' + nama];
  M.diubah[nama] = true;
  return baris.length;
}

/* =========================== proses file patroli =========================== */

function daftarBerkas_(folder, hasil) {
  hasil = hasil || [];
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (/\.(zip|xml)$/i.test(f.getName())) hasil.push(f);
  }
  var sub = folder.getFolders();
  while (sub.hasNext()) daftarBerkas_(sub.next(), hasil);
  return hasil;
}

function logBerkas_(M) {
  var sh = M.ss.getSheetByName(LEMBAR.log), n = sh.getLastRow() - 1, log = {};
  if (n > 0) sh.getRange(2, 1, n, 9).getValues().forEach(function (r) {
    if (String(r[8]).indexOf('OK') === 0) log[r[0] + '|' + Number(r[3])] = true;
  });
  return log;
}

/** FOLDER_PATROLI boleh berisi beberapa ID folder dipisah koma (misalnya folder 2026 dan 2027). */
function folderPatroli_(M) {
  return String(M.atur.FOLDER_PATROLI || '').split(/[,;\s]+/).map(function (s) {
    var m = /folders\/([A-Za-z0-9_-]+)/.exec(s) || /id=([A-Za-z0-9_-]+)/.exec(s);
    return m ? m[1] : s.trim();
  }).filter(String);
}

function prosesFileMasuk() {
  var kunciProses = LockService.getScriptLock();
  if (!kunciProses.tryLock(5000)) { kabari_('Proses lain masih berjalan.'); return; }
  try {
    var M = muatMesin_(), mulai = Date.now(), batas = Number(M.atur.BATAS_WAKTU_DETIK || 240) * 1000;
    samakanZona_(M.ss);
    var folder = folderPatroli_(M);
    if (!folder.length) throw new Error('Isi FOLDER_PATROLI di lembar Pengaturan.');
    var log = logBerkas_(M), shLog = M.ss.getSheetByName(LEMBAR.log), antre = [];
    folder.forEach(function (id) { daftarBerkas_(DriveApp.getFolderById(id), antre); });
    antre = antre.filter(function (f) {
      return !log[f.getId() + '|' + f.getLastUpdated().getTime()];
    }).sort(function (a, b) { return a.getName() < b.getName() ? -1 : 1; });
    var selesai = 0, totalBaris = 0;
    for (var i = 0; i < antre.length; i++) {
      if (Date.now() - mulai > batas) break;
      var f = antre[i], sekarang = new Date(), status = 'OK', nObs = 0, nBaris = 0, nLeg = 0;
      try {
        var perTab = {}, legBaris = [];
        isiBerkas_(f).forEach(function (isi) {
          var p = bacaPatroli_(isi.xml, isi.nama);
          p.obs.forEach(function (o) {
            nObs++;
            olahObservasi_(M, o, f.getName(), sekarang).forEach(function (r) {
              var k = r.induk + '|' + r.tab;
              (perTab[k] = perTab[k] || { induk: r.induk, tab: r.tab, baris: [], urut: [] }).baris.push(r.baris);
              r.urutAtribut.forEach(function (h) { if (perTab[k].urut.indexOf(h) < 0) perTab[k].urut.push(h); });
            });
          });
          p.leg.forEach(function (l) { legBaris.push(olahLeg_(M, l, f.getName(), sekarang)); });
        });
        Object.keys(perTab).forEach(function (k) {
          var t = perTab[k];
          nBaris += tulisTab_(M, t.induk, t.tab, KOLOM_DEPAN, t.baris,
            { jenis: KOLOM_JENIS, atribut: t.urut, belakang: KOLOM_BELAKANG, lewatiTitik: true });
        });
        nLeg = tulisTab_(M, 'rbm', String(M.atur.TAB_UPAYA || 'Rekap Upaya Patroli'), KOLOM_UPAYA, legBaris);
        if (!nObs && !legBaris.length) status = 'OK (tidak ada data patroli di berkas)';
      } catch (e) {
        status = 'GAGAL: ' + e.message;
      }
      shLog.appendRow([f.getId(), amanSel_(f.getName()), f.getLastUpdated(), f.getLastUpdated().getTime(), sekarang, nObs, nBaris,
        nLeg, amanSel_(status)]);
      selesai++;
      totalBaris += nBaris + nLeg;
    }
    simpanCatatan_(M);
    if (totalBaris) perbaruiKatalog_(M);
    var sisa = antre.length - selesai;
    kabari_(selesai + ' berkas diproses, ' + totalBaris + ' baris rekap baru.' +
      (sisa ? ' ' + sisa + ' berkas lanjut di putaran berikutnya.' : ''));
  } finally {
    kunciProses.releaseLock();
  }
}

/** Catat jenis yang belum ada di Kamus dan kategori tanpa rute agar tim bisa melengkapi. */
function simpanCatatan_(M) {
  var sh = M.ss.getSheetByName(LEMBAR.belumKamus), n = sh.getLastRow() - 1, ada = {};
  if (n > 0) sh.getRange(2, 1, n, 2).getValues().forEach(function (r) { ada[r[0] + '|' + r[1]] = true; });
  var baru = Object.keys(M.belumKamus).filter(function (k) { return !ada[k]; }).map(function (k) { return M.belumKamus[k]; });
  if (baru.length) sh.getRange(sh.getLastRow() + 1, 1, baru.length, 5).setValues(baru);

  sh = M.ss.getSheetByName(LEMBAR.tanpaRute);
  n = sh.getLastRow() - 1;
  var baris = {};
  if (n > 0) sh.getRange(2, 1, n, 5).getValues().forEach(function (r, i) { baris[r[0]] = i + 2; });
  Object.keys(M.tanpaRute).forEach(function (hk) {
    var t = M.tanpaRute[hk];
    if (baris[hk]) {
      var c = sh.getRange(baris[hk], 3);
      c.setValue(Number(c.getValue() || 0) + t[2]);
    } else {
      sh.appendRow(t);
    }
  });
  M.belumKamus = {};
  M.tanpaRute = {};
}

/* =========================== siapkan, rapikan, pemicu =========================== */

/** Semua tab data yang dikenal: tab tujuan Rute, tab Sumber, tab rekap tetap. {nama: induk} */
function tabData_(M) {
  var tab = {};
  M.rute.forEach(function (r) { if (!tab[r.tab]) tab[r.tab] = r.induk; });
  bacaTabel_(M.ss, LEMBAR.sumber, true).forEach(function (s) {
    var t = tabTujuan_(s);
    if (t && s.induk && !tab[t]) tab[t] = s.induk;
  });
  tab[String(M.atur.TAB_UPAYA || 'Rekap Upaya Patroli')] = 'rbm';
  return tab;
}

/**
 * Siapkan tab rekap (tab survei metode teknis dibuat saat datanya pertama masuk), urutkan tab per induk, beri warna.
 * Lembar kendali diperbarui dulu dari Kendali.gs bila versinya lebih baru, lalu tab rekap lama yang isinya kini masuk
 * ke 12 rekap dihapus. Induk yang kolom id_spreadsheet-nya diisi "baru" dipindah ke spreadsheet tersendiri.
 */
function siapkanSpreadsheetInduk() {
  var catatan = [], ssAktif = SpreadsheetApp.getActive(), naik = false;
  // Lembar kendali bawaan (berkas Kendali.gs) dipasang dulu bila versinya lebih baru. Tab rekap lalu dikosongkan dan
  // diisi ulang dengan susunan baru: menu 3 (sumber lain) dan menu 2 (semua file patroli dibaca lagi).
  if (typeof kendaliPerluDiperbarui_ !== 'function') {
    catatan.push('Berkas Kendali belum ada di proyek Apps Script, jadi lembar kendali tidak diperbarui ke peta konsep ' +
      'terbaru. Buat berkas skrip Kendali, tempel Kendali.gs, lalu jalankan menu 1 lagi');
  } else if (kendaliPerluDiperbarui_(ssAktif)) {
    // Rute dan Induk tidak berubah (hanya Sumber, Pengaturan, atau Petunjuk): tab rekap tetap, cukup menu 3
    var ringan = typeof kendaliRingan_ === 'function' && kendaliRingan_(ssAktif);
    try {
      var ui = SpreadsheetApp.getUi();
      if (ui.alert('Perbarui Mesin Data ke peta konsep ' + VERSI_KENDALI + '?', ringan ?
        'Lembar Pengaturan, Sumber, dan Petunjuk diperbarui (isian folder, alamat, dan status aktif yang sudah ada tetap). ' +
        'Rute dan Induk tidak berubah, jadi isi tab rekap tetap. Lanjutkan dengan menu 3.' :
        'Lembar Rute, Induk, Petunjuk, Pengaturan, dan Sumber diperbarui (isian folder, alamat, dan status aktif yang sudah ' +
        'ada tetap). Tab rekap dikosongkan lalu diisi ulang: jalankan menu 3, lalu menu 2. File patroli dan sumber aslinya ' +
        'tidak disentuh.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
    } catch (e) { /* dijalankan dari editor */ }
    naik = perbaruiLembarKendali_(ssAktif, catatan) ? (ringan ? 'ringan' : 'penuh') : false;
  }
  var M = muatMesin_(), sh = M.ss.getSheetByName(LEMBAR.induk), v = sh.getDataRange().getValues();
  if (naik === 'ringan') catatan.push('Rute dan Induk tidak berubah, jadi isi tab rekap tetap: jalankan menu 3 agar sumber baru terbaca');
  else if (naik) catatan.push(kosongkanRekap_(M) + ' tab rekap dikosongkan dan Log Berkas dikosongkan: jalankan menu 3 lalu menu 2');
  samakanZona_(M.ss);
  var kepala = v[0].map(String), iId = kepala.indexOf('id_spreadsheet');
  var folder = M.atur.FOLDER_REKAP ? DriveApp.getFolderById(String(M.atur.FOLDER_REKAP)) : null;
  var tab = tabData_(M), pesan = [];
  if (!folderPatroli_(M).length) pesan.push('FOLDER_PATROLI masih kosong');
  // tab rekap utama (bukan per tabel survei) dibuat kosong agar susunannya terlihat
  M.rute.forEach(function (r) { if (r.penghubung !== 'surveikehati') tabInduk_(M, r.induk, r.tab, KOLOM_DEPAN); });
  hapusTabLama_(M, catatan);
  tabInduk_(M, 'rbm', String(M.atur.TAB_UPAYA || 'Rekap Upaya Patroli'), KOLOM_UPAYA);
  // induk yang diminta pindah ke spreadsheet sendiri
  var dipindah = 0;
  for (var i = 1; i < v.length; i++) {
    var kode = v[i][0], nama = v[i][1];
    if (!kode || String(v[i][iId]).trim().toLowerCase() !== 'baru') continue;
    var ssBaru = SpreadsheetApp.create('Mesin Data – ' + nama);
    if (folder) DriveApp.getFileById(ssBaru.getId()).moveTo(folder);
    Object.keys(tab).forEach(function (t) {
      if (tab[t] !== kode) return;
      var lama = M.ss.getSheetByName(t);
      if (!lama) return;
      lama.copyTo(ssBaru).setName(t);
      M.ss.deleteSheet(lama);
    });
    var awal = ssBaru.getSheetByName('Sheet1') || ssBaru.getSheetByName('Lembar1');
    if (awal && ssBaru.getSheets().length > 1) ssBaru.deleteSheet(awal);
    sh.getRange(i + 1, iId + 1).setValue(ssBaru.getId());
    dipindah++;
  }
  M = muatMesin_();
  urutkanTab_(M);
  perbaruiKatalog_(M, true);
  kabari_('Tab siap' + (dipindah ? ', ' + dipindah + ' induk dipindah ke spreadsheet sendiri' : '') + '.' +
    (pesan.length ? ' Perlu diisi: ' + pesan.join(', ') + '.' : '') + (catatan.length ? ' ' + catatan.join('. ') + '.' : ''));
}

/**
 * Tab rekap lama (sebelum peta konsep 27-11-2026) yang isinya kini masuk ke rekap lain. Tab itu dihapus bila sudah
 * tidak dipakai Rute maupun Sumber, supaya tidak ada dua salinan data yang sama. Isinya terisi ulang di rekap baru
 * lewat menu 3 (sumber lain) dan "Proses ulang semua file patroli".
 */
var TAB_LAMA = ['Rekap Tindakan dan Tindak Lanjut', 'Rekap Konflik Tenurial (Pulbaket)', 'Rekap Sanctuary Rusa Timor',
  'Rekap Koleksi, Persemaian, dan Pemulihan Ekosistem', 'Rekap Kondisi Kelompok Binaan', 'Rekap Kegiatan Resor dan Capaian RBM',
  'Rekap Potensi dan Ancaman per Resor', 'Titik Posisi Patroli', 'Titik Panas (Hotspot)', 'Areal Terbakar (Delineasi)',
  'Penerbangan Drone', 'Profil Resor 2026', 'Register Kegiatan LPK PEH', 'Rencana dan Capaian RBM 2026'];

function hapusTabLama_(M, catatan) {
  var dipakai = tabData_(M), n = 0;
  TAB_LAMA.forEach(function (t) {
    if (dipakai[t]) return;
    var sh = M.ss.getSheetByName(t) || M.ss.getSheetByName(t.slice(0, 31).trim());
    if (!sh) return;
    M.ss.deleteSheet(sh);
    n++;
  });
  if (n) catatan.push(n + ' tab rekap lama dihapus (isinya kini masuk ke 12 rekap)');
}

/**
 * Kosongkan tab rekap (tujuan Rute dan tab upaya) agar diisi ulang dengan susunan peta konsep yang baru, dan kosongkan
 * Log Berkas agar semua file patroli dibaca lagi. Lembar acuan (daftar jenis, kelompok, rencana RBM) ditulis ulang
 * utuh oleh sumbernya, jadi tidak disentuh. Mengembalikan jumlah tab yang dikosongkan.
 */
function kosongkanRekap_(M) {
  var tab = {}, n = 0, upaya = String(M.atur.TAB_UPAYA || 'Rekap Upaya Patroli');
  M.rute.forEach(function (r) { if (!tab[r.tab]) tab[r.tab] = r.induk; });
  tab[upaya] = 'rbm';
  Object.keys(tab).forEach(function (nama) {
    var ss;
    try { ss = bukaInduk_(M, tab[nama]); } catch (e) { return; }
    var sh = ss.getSheetByName(nama);
    if (!sh || sh.getLastRow() < 2) return;
    var kolom = nama === upaya ? KOLOM_UPAYA : KOLOM_DEPAN;
    sh.clearContents();
    sh.getRange(1, 1, 1, kolom.length).setValues([kolom]).setFontWeight('bold');
    n++;
  });
  var log = M.ss.getSheetByName(LEMBAR.log);
  if (log && log.getLastRow() > 1) log.getRange(2, 1, log.getLastRow() - 1, log.getLastColumn()).clearContent();
  M.tab = {};
  M.idAda = {};
  M.titikLain = {};
  return n;
}

/** Lembar kendali di depan, lalu tab data per induk sesuai urutan lembar Induk, masing-masing diberi warna induk. */
function urutkanTab_(M) {
  var ss = M.ss, tab = tabData_(M), urut = [];
  LEMBAR_KENDALI.forEach(function (n) { if (ss.getSheetByName(n)) urut.push(n); });
  M.urutInduk.forEach(function (kode) {
    var nama = ss.getSheets().map(function (s) { return s.getName(); }).filter(function (n) { return tab[n] === kode; });
    nama.forEach(function (n) {
      urut.push(n);
      var w = M.induk[kode] && M.induk[kode].warna;
      if (w) ss.getSheetByName(n).setTabColor(String(w));
    });
  });
  ss.getSheets().forEach(function (s) { if (urut.indexOf(s.getName()) < 0) urut.push(s.getName()); });
  urut.forEach(function (n, i) {
    var s = ss.getSheetByName(n);
    if (s && s.getIndex() !== i + 1) { ss.setActiveSheet(s); ss.moveActiveSheet(i + 1); }
  });
  ss.setActiveSheet(ss.getSheets()[0]);
}

/**
 * Setelah Kamus Jenis atau Ejaan diubah: hitung ulang kolom nama jenis dari "Kode jenis" dan terapkan Ejaan
 * ke kolom label di semua tab data. Komentar, ST, mandat, berkas, dan data sumber lain tidak disentuh.
 */
function rapikanSemuaRekap() {
  var M = muatMesin_(), lewati = ['ID Observasi', 'ID Leg', 'Sumber', 'Komentar', 'ST', 'Mandat', 'Berkas', 'Kode kategori',
    'Kode jenis', 'Kunci titik', 'Anggota', 'Ketua', 'Tim'];
  var diubah = 0, tab = tabData_(M);
  Object.keys(tab).forEach(function (nama) {
    var sh;
    try { sh = bukaInduk_(M, tab[nama]).getSheetByName(nama); } catch (e) { return; }
    if (!sh || sh.getLastRow() < 2) return;
    var rg = sh.getDataRange(), v = rg.getValues(), h = v[0], ubah = false;
    var iKode = h.indexOf('Kode jenis'), iSumber = h.indexOf('Sumber');
    for (var r = 1; r < v.length; r++) {
      var dariPatroli = iSumber < 0 || /SMART|patroli/i.test(String(v[r][iSumber]));
      if (!dariPatroli) continue;
      for (var c = 0; c < h.length; c++) {
        if (lewati.indexOf(h[c]) >= 0 || typeof v[r][c] !== 'string' || !v[r][c]) continue;
        var b = baku_(M, v[r][c]);
        if (b !== v[r][c]) { v[r][c] = b; ubah = true; diubah++; }
      }
      if (iKode >= 0 && v[r][iKode]) {
        var k = M.kamus[v[r][iKode]];
        if (k) {
          [['Nama ilmiah baku', 'nama_ilmiah_baku'], ['Nama umum', 'nama_umum'], ['Nama lokal', 'nama_lokal'],
            ['Kelompok jenis', 'kelompok']].forEach(function (p) {
            var i = h.indexOf(p[0]);
            if (i >= 0 && v[r][i] !== (k[p[1]] || '')) { v[r][i] = k[p[1]] || ''; ubah = true; diubah++; }
          });
        }
      }
    }
    if (ubah) {
      rg.setValues(v.map(function (r) { return r.map(amanSel_); }));
      M.diubah[nama] = true;
    }
  });
  if (diubah) perbaruiKatalog_(M);
  kabari_(diubah + ' sel dirapikan.');
}

function prosesUlangSemua() {
  try {
    var ui = SpreadsheetApp.getUi();
    if (ui.alert('Proses ulang semua file?', 'Log Berkas dikosongkan lalu semua file dibaca lagi. Baris yang sudah ' +
      'ada tidak digandakan (dicek dari ID Observasi dan kunci titik).', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  } catch (e) { /* dijalankan dari editor */ }
  var sh = SpreadsheetApp.getActive().getSheetByName(LEMBAR.log);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  prosesFileMasuk();
}

function pasangPemicu() {
  hapusPemicu();
  var M = muatMesin_(), minta = Number(M.atur.PEMICU_JAM || 1);
  // Apps Script hanya menerima 1, 2, 4, 6, 8, atau 12 jam.
  var jam = [12, 8, 6, 4, 2, 1].filter(function (j) { return j <= minta; })[0] || 1;
  ScriptApp.newTrigger('prosesFileMasuk').timeBased().everyHours(jam).create();
  var jamSumber = Math.min(23, Math.max(0, Number(M.atur.JAM_PERBARUI_SUMBER === '' || M.atur.JAM_PERBARUI_SUMBER === undefined ? 5 : M.atur.JAM_PERBARUI_SUMBER)));
  ScriptApp.newTrigger('perbaruiSemuaSumber').timeBased().everyDays(1).atHour(jamSumber).create();
  kabari_('Pemicu terpasang: file patroli tiap ' + jam + ' jam, data sumber lain tiap hari sekitar pukul ' + jamSumber + '.00.');
}

function hapusPemicu() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['prosesFileMasuk', 'perbaruiSemuaSumber'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
}
