/**
 * Mesin Data Satu Data Tambora – sumber data selain file patroli
 *
 * Data sebelum 2027 dan data tab lain Satu Data Tambora masuk ke tab yang sama dengan data patroli, mengikuti alur peta
 * konsep ("Sumber sebelum 2027" -> penghubung). Satu baris lembar "Sumber" = satu sumber:
 *   kode, nama, jenis (nama pengimpor di bawah), alamat (URL atau ID spreadsheet, beberapa dipisah " | "),
 *   tab_tujuan, induk, aktif (ya/tidak), akses_unduh (bawaan akses tab ini di Katalog: pegawai, admin, atau tidak),
 *   catatan; kolom diperbarui, baris, status, sidik diisi skrip.
 * Sumber yang isinya tidak berubah sejak pembaruan terakhir dilewati (kolom sidik). Kosongkan sel sidik untuk memaksa
 * satu sumber dibaca ulang.
 * Alamat boleh memakai {HUB} dan {PAGES} (lembar Pengaturan URL_HUB dan URL_PAGES).
 *
 * Setiap sumber mengganti baris miliknya sendiri (kolom Sumber) tiap diperbarui; baris sumber lain di tab yang sama
 * tidak disentuh. Titik patroli yang sama dari dua sumber (file patroli, Dashboard SMART, rekap spreadsheet) hanya
 * dicatat sekali lewat kolom "Kunci titik" (tanggal, jam, koordinat 5 desimal).
 */

var KOLOM_LEMBAR_SUMBER = ['kode', 'nama', 'jenis', 'alamat', 'tab_tujuan', 'induk', 'aktif', 'akses_unduh', 'catatan',
  'diperbarui', 'baris', 'status', 'sidik'];

/** Naikkan bila cara olah sumber berubah, agar semua sumber dibaca ulang sekali. */
var VERSI_PENGIMPOR = '2026-11-26';
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
  smart_kehati: 'Temuan kehati SMART (Data Masuk Kehati)'
};

var KAT_KEHATI = {
  satwa: { perjumpaan: ['Perjumpaan Satwa', 'satwaliar.perjumpaansatwa.'], tanda: ['Tanda Satwa', 'satwaliar.jejaksatwa.'],
    sarang: ['Tanda Satwa', 'satwaliar.jejaksatwa.'], 'satwa mati': ['Satwa Mati', 'satwaliar.satwamati.'],
    'daftar jenis laporan': ['Perjumpaan Satwa', 'satwaliar.perjumpaansatwa.'] },
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
    rekapPerResor_(M);
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

/* =========================== ekspor SMART (CSV / spreadsheet) =========================== */

var KOLOM_EKSPOR_INTI = ['Source', 'Waypoint ID', 'Waypoint Date', 'Waypoint Time', 'X', 'Y', 'Comment', 'Last Modified',
  'Last Modified By', 'Observation Category 0', 'Observation Category 1', 'Observation Category 2', 'Observation Group',
  'Resor', 'Resort', 'Nama Resor', 'SPTN', 'Station', 'ST', 'Foto', 'Patrol ID', 'Patrol Leg ID', 'Mandate', 'Mandat',
  'Patrol Mandate'];

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
  var rute = cariRute_(M, hkey, jenis);
  var kat = labelKategori_(M, hkey);
  if (!rute.length) { catatTanpaRute_(M, hkey, kat.join(' > '), berkas); return []; }
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
  var atr = {}, jenisNama = null;
  Object.keys(r).forEach(function (h) {
    var v = r[h];
    if (KOLOM_EKSPOR_INTI.indexOf(h) >= 0 || h.indexOf('__') === 0 || v === '' || v === null || v === undefined) return;
    var ak = atributEkspor_(M, h), judul = ak ? judulAtribut_(M, ak) : baku_(M, h);
    if (KOLOM_TETAP.indexOf(judul) >= 0) judul += ' (isian patroli)';
    atr[judul] = typeof v === 'string' ? baku_(M, v) : v;
    if (!jenisNama && ATRIBUT_JENIS.indexOf(ak) >= 0 && typeof v === 'string') {
      var k = M.kamusLabel[kunci_(v)];
      jenisNama = k ? barisKamus_(k, k.atribut + '|' + k.kunci) : namaDariLabel_(v, '', ak + '|(label) ' + v);
    }
  });
  return rute.map(function (rt) {
    var b = {}, k;
    for (k in dasar) b[k] = dasar[k];
    if (jenisNama) for (k in jenisNama) b[k] = jenisNama[k];
    for (k in atr) b[k] = atr[k];
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
          bacaCsv_(ambil_(a)).forEach(function (r) {
            hasil = hasil.concat(olahBarisEkspor_(M, r, { sumber: label, awalan: 'rks-', berkas: 'Rekap SMART (CSV)' }, sekarang));
          });
        } else {
          var id = (/\/d\/([A-Za-z0-9_-]+)/.exec(a) || /[?&]id=([A-Za-z0-9_-]+)/.exec(a) || [null, a])[1];
          var ss = bukaSpreadsheet_(id), zona = ss.getSpreadsheetTimeZone();
          ss.getSheets().forEach(function (sh) {
            if (sh.getLastRow() < 2) return;
            var v = sh.getDataRange().getValues(), h = v[0].map(function (x) { return String(x).trim(); });
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

  /** Register kegiatan LPK teknis PEH. */
  register_lpk: function (M, s) {
    var keg = ambilJson_(alamat_(M, s)[0]);
    var baris = keg.map(function (k) {
      var b = { 'ID kegiatan': k.id, 'Sumber': LABEL_SUMBER.lpk_peh };
      waktuBaku_(b, k.mulai, k.tahun, k.bulan);
      b['Tanggal selesai'] = tanggalDari_(k.selesai);
      b['Resor'] = namaResor_(k.resor) || k.resor;
      b['SPTN'] = sptnResor_(M, b['Resor']);
      b['Jenis kegiatan'] = jenisKegiatan_(M, k.metode);
      b['Metode'] = k.metode; b['Kode metode'] = k.kode; b['Judul'] = k.judul;
      b['Temuan lolos kurasi'] = k.n; b['Temuan berkoordinat'] = k.nk; b['Jumlah jenis'] = k.nj; b['Baris dibuang'] = k.nb;
      return b;
    });
    return tulisUtuh_(M, s.induk || 'survei', s.tab_tujuan || 'Register Kegiatan LPK PEH', ['ID kegiatan'], baris);
  },

  /** Laporan kegiatan penyuluhan dan pemberdayaan 2020 sampai 2026. */
  penyuluhan: function (M, s) {
    var p = penghubung_(M, 'penyuluhan'), sekarang = new Date();
    var baris = bacaCsv_(ambil_(alamat_(M, s)[0])).map(function (r) {
      var b = { 'ID Observasi': 'pyl-' + r.id, 'Sumber': LABEL_SUMBER.penyuluhan };
      waktuBaku_(b, '', r.tahun, r.bulan);
      b['Resor'] = namaResor_(r.resort);
      b['SPTN'] = sptnResor_(M, b['Resor']);
      b['Jenis kegiatan'] = 'Penyuluhan dan pemberdayaan';
      b['Mandat'] = r.jenis_kegiatan;
      b['Kategori 0'] = 'Penyuluhan dan Pemberdayaan Masyarakat';
      b['Kategori 1'] = r.kelompok_kegiatan;
      b['Kategori 2'] = r.jenis_kegiatan;
      b['Judul kegiatan'] = r.judul; b['Desa'] = r.desa; b['Jumlah peserta'] = angkaAtauKosong_(r.peserta);
      b['Kelompok binaan'] = r.kelompok; b['Sekolah'] = r.sekolah; b['Ringkasan laporan'] = r.ringkasan;
      b['Tautan laporan'] = r.url; b['Diproses'] = sekarang;
      return b;
    });
    return gantiSumber_(M, s.induk || p.induk, s.tab_tujuan || p.tab, LABEL_SUMBER.penyuluhan, KOLOM_DEPAN, baris,
      { belakang: KOLOM_BELAKANG });
  },

  /** Kondisi kelompok binaan per tahun (riwayat) dari laporan penyuluhan. */
  kelompok: function (M, s) {
    var a = alamat_(M, s), p = penghubung_(M, 'kelompok'), sekarang = new Date(), daftar = {};
    if (a[1]) bacaCsv_(ambil_(a[1])).forEach(function (k) { daftar[k.id] = k; });
    var baris = bacaCsv_(ambil_(a[0])).map(function (r) {
      var k = daftar[r.kelompok_id] || {};
      var b = { 'ID Observasi': 'klp-' + r.kelompok_id + '-' + r.tahun, 'Sumber': LABEL_SUMBER.kelompok };
      waktuBaku_(b, '', r.tahun, '');
      b['Resor'] = namaResor_(k.resort);
      b['SPTN'] = k.wilayah || sptnResor_(M, b['Resor']);
      b['Jenis kegiatan'] = 'Penyuluhan dan pemberdayaan';
      b['Kategori 0'] = 'Penyuluhan dan Pemberdayaan Masyarakat';
      b['Kategori 1'] = 'Monev Kelompok Binaan';
      b['Nama kelompok binaan'] = r.nama; b['Desa'] = k.desa || ''; b['Jenis kelompok'] = k.jenis || '';
      b['Bidang usaha'] = k.usaha || ''; b['Status kelompok'] = r.status; b['Jumlah anggota'] = angkaAtauKosong_(r.anggota);
      b['Anggota perempuan'] = angkaAtauKosong_(r.anggota_perempuan); b['Penilaian'] = r.penilaian; b['Kondisi'] = r.kondisi;
      b['Tema kendala'] = r.tema_kendala; b['Kendala'] = r.kendala; b['Kebutuhan'] = r.kebutuhan; b['Bantuan'] = r.bantuan;
      b['Produk'] = r.produk; b['Jumlah laporan'] = angkaAtauKosong_(r.jumlah_laporan); b['Diproses'] = sekarang;
      return b;
    });
    return gantiSumber_(M, s.induk || p.induk, s.tab_tujuan || p.tab, LABEL_SUMBER.kelompok, KOLOM_DEPAN, baris,
      { belakang: KOLOM_BELAKANG });
  },

  /** Daftar kelompok binaan (rujukan). */
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

  /** Pulbaket penggunaan lahan (konflik tenurial). Nama pengguna lahan hanya untuk akun admin di Unduh Data. */
  pulbaket: function (M, s) {
    var a = alamat_(M, s), p = penghubung_(M, 'tenurial'), sekarang = new Date(), keg = {};
    if (a[1]) { try { keg = ambilJson_(a[1]).kegiatan || {}; } catch (e) { keg = {}; } }
    var baris = (ambilJson_(a[0]).features || []).map(function (f) {
      var q = f.properties || {}, c = titikTengah_(f.geometry);
      var b = { 'ID Observasi': 'tnr-' + q.kode, 'Sumber': LABEL_SUMBER.pulbaket };
      waktuBaku_(b, keg.mulai || '', 2026, '');
      resorBaku_(M, b, c[0], c[1], q.resor);
      b['Jenis kegiatan'] = 'Patroli pengamanan kawasan';
      b['Mandat'] = keg.judul || 'Pengumpulan bahan keterangan penggunaan lahan';
      b['ST'] = keg.st || '';
      b['Kategori 0'] = 'Aktivitas Manusia'; b['Kategori 1'] = 'Pulbaket Penggunaan Lahan (Tenurial)';
      b['Kode bidang'] = q.kode; b['Blok'] = q.blok; b['Lokasi'] = q.lokasi; b['Zona'] = q.zona; b['Luas (ha)'] = q.luas;
      b['Status bidang'] = q.status; b['Jumlah pengguna'] = q.pengguna; b['Terbakar (ha)'] = q.terbakar; b['Tutupan'] = q.tutupan;
      b['Catatan'] = q.catatan;
      b['Nama pengguna lahan'] = (q.orang || []).map(function (o) { return o.nama; }).filter(String).join('; ');
      b['Riwayat perolehan lahan'] = (q.orang || []).map(function (o) { return o.riwayat; }).filter(String).join('; ');
      b['Alamat pengguna lahan'] = (q.orang || []).map(function (o) { return o.alamat; }).filter(String).join('; ');
      b['Pihak berpengaruh'] = (q.pengaruh || []).join('; ');
      b['X'] = c[0]; b['Y'] = c[1]; b['Kode kategori'] = 'aktivitasmanusia.tmbpulbakettenurial.';
      b['Berkas'] = 'data/tenurial/bidang.geojson'; b['Diproses'] = sekarang;
      return b;
    });
    return gantiSumber_(M, s.induk || p.induk, s.tab_tujuan || p.tab, LABEL_SUMBER.pulbaket, KOLOM_DEPAN, baris,
      { belakang: KOLOM_BELAKANG });
  },

  /** Titik panas (hotspot) di kawasan dan sekitarnya. */
  titik_panas: function (M, s) {
    var baris = (ambilJson_(alamat_(M, s)[0]).features || []).map(function (f) {
      var q = f.properties || {}, c = f.geometry ? f.geometry.coordinates : [NaN, NaN];
      var t = String(q.t || ''), b = { 'ID titik': q.ev || md5_(t + c[0] + c[1] + q.s).slice(0, 12), 'Sumber': 'Hotspot ' + (q.src || '') };
      waktuBaku_(b, t.slice(0, 10));
      b['Waktu (WITA)'] = t.slice(11, 16);
      resorBaku_(M, b, c[0], c[1], '');
      b['Di dalam TN'] = q.tn === true ? 'ya' : q.tn === false ? 'tidak' : '';
      b['Satelit'] = q.s; b['Kepercayaan'] = { L: 'rendah', M: 'sedang', H: 'tinggi' }[q.c] || q.c || '';
      b['Desa'] = q.desa; b['Kecamatan'] = q.kec; b['Kabupaten'] = q.kab; b['X'] = c[0]; b['Y'] = c[1];
      return b;
    });
    return tulisUtuh_(M, s.induk || 'karhut', s.tab_tujuan || 'Titik Panas (Hotspot)', ['ID titik'], baris);
  },

  /** Bidang areal terbakar hasil delineasi manual tiap 5 hari. */
  areal_terbakar: function (M, s) {
    var baris = (ambilJson_(alamat_(M, s)[0]).features || []).map(function (f) {
      var q = f.properties || {}, asli = q.asli || {}, c = titikTengah_(f.geometry);
      var b = { 'ID bidang': (q.tanggal || '') + '-' + q.id, 'Sumber': 'Delineasi manual' };
      waktuBaku_(b, q.tanggal);
      resorBaku_(M, b, c[0], c[1], q.resort);
      b['Luas (ha)'] = q.luas_ha; b['Bagian di TN (persen)'] = q.tn_persen; b['Di luar kawasan'] = q.luar_kawasan ? 'ya' : 'tidak';
      b['Zona'] = asli.Zona || ''; b['Grid'] = asli.Grid || ''; b['Bulan kejadian'] = asli.Bulan || '';
      b['Tahun kejadian'] = asli.Tahun || ''; b['Berkas delineasi'] = q.file; b['X'] = c[0]; b['Y'] = c[1];
      return b;
    });
    return tulisUtuh_(M, s.induk || 'karhut', s.tab_tujuan || 'Areal Terbakar (Delineasi)', ['ID bidang'], baris);
  },

  /** Rencana RBM 2026 + laporan dari form RBM (API publik tanpa nama petugas), capaian dihitung seperti dashboard RBM. */
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
    var perKeg = {};
    (laporan || []).forEach(function (l) { (perKeg[l.kegiatan] = perKeg[l.kegiatan] || []).push(l); });
    var realisasi = function (k, list) {
      if (!list.length) return 0;
      if (k.metode === 'bulan') { var b = {}; list.forEach(function (l) { b[l.bulan] = 1; }); return Object.keys(b).length; }
      if (k.metode === 'persen') return list.slice().sort(function (x, y) { return x.tanggal < y.tanggal ? -1 : 1; }).pop().volume;
      return list.reduce(function (n, l) { return n + (Number(l.volume) || 0); }, 0);
    };
    var barisRencana = rencana.kegiatan.map(function (k) {
      var b = { 'Kode kegiatan': k.id, 'Tahun': rencana.tahun, 'Resor': resorNama[k.resor] || k.resor, 'SPTN': resorSptn[k.resor] || '',
        'Indikator': k.indikator, 'Kegiatan': k.kegiatan, 'Jenis kegiatan': jenisKegiatan_(M, k.kegiatan), 'Target': k.target,
        'Satuan': k.satuan, 'Cara hitung': k.metode, 'Keterangan': k.keterangan };
      if (laporan) {
        var semua = perKeg[k.id] || [];
        var diterima = realisasi(k, semua.filter(function (l) { return l.status === 'Diterima'; }));
        var pD = k.target ? diterima / k.target * 100 : 0;
        b['Realisasi diterima'] = diterima;
        b['Realisasi masuk'] = realisasi(k, semua.filter(function (l) { return l.status !== 'Ditolak'; }));
        b['Capaian (persen)'] = Math.round(Math.min(100, pD) * 10) / 10;
        b['Status'] = pD >= 100 ? 'tercapai' : pD > 0 ? 'berjalan' : 'belum';
        b['Jumlah laporan'] = semua.length;
        b['Menunggu verifikasi'] = semua.filter(function (l) { return l.status === 'Menunggu'; }).length;
      } else {
        b['Status'] = 'laporan belum terbaca';
      }
      return b;
    });
    var n = tulisUtuh_(M, s.induk || 'rbm', s.tab_tujuan || 'Rencana dan Capaian RBM 2026', ['Kode kegiatan'], barisRencana);
    if (laporan) {
      var p = penghubung_(M, 'rbm');
      var barisLap = laporan.map(function (l) {
        var k = keg[l.kegiatan] || {}, nama = k.kegiatan || l.nama_kegiatan || l.kegiatan;
        var b = { 'ID Observasi': 'rbm-' + l.id, 'Sumber': LABEL_SUMBER.rbm };
        waktuBaku_(b, l.tanggal, rencana.tahun, l.bulan);
        b['Resor'] = resorNama[l.resor] || l.resor; b['SPTN'] = resorSptn[l.resor] || sptnResor_(M, b['Resor']);
        b['Jenis kegiatan'] = jenisKegiatan_(M, nama); b['Mandat'] = nama;
        b['Kategori 0'] = 'Kegiatan RBM'; b['Kategori 1'] = k.indikator || 'Di luar rencana';
        b['Kode kegiatan rencana'] = l.kegiatan; b['Kegiatan'] = nama; b['Sesuai rencana'] = l.sesuai ? 'Ya' : 'Tidak';
        b['Volume'] = l.volume; b['Satuan'] = k.satuan || ''; b['Status verifikasi'] = l.status; b['Diproses'] = sekarang;
        return b;
      });
      n += gantiSumber_(M, p.induk, p.tab, LABEL_SUMBER.rbm, KOLOM_DEPAN, barisLap, { belakang: KOLOM_BELAKANG });
    }
    return n;
  },

  /** Log penerbangan drone (Flight SMART). */
  drone: function (M, s) {
    var a = alamat_(M, s), dasar = a[0].replace(/flights\/index\.json.*$/, '');
    var baris = (ambilJson_(a[0]).flights || []).map(function (f) {
      var b = { 'ID penerbangan': f.id, 'Sumber': 'Flight SMART' };
      waktuBaku_(b, String(f.startLocal || '').slice(0, 10));
      b['Jam mulai (WITA)'] = String(f.startLocal || '').slice(11, 16);
      var h = f.home || {};
      resorBaku_(M, b, h.lon, h.lat, '');
      b['Jenis kegiatan'] = 'Patroli drone';
      b['Durasi (menit)'] = Math.round((f.durationSec || 0) / 6) / 10; b['Jarak terbang (m)'] = f.distanceM;
      b['Tinggi maksimum (m)'] = f.maxHeightM; b['Kecepatan maksimum (m/s)'] = f.maxSpeedMs;
      b['Jarak terjauh dari titik lepas (m)'] = f.maxDistanceFromHomeM; b['Foto'] = f.photos; b['Video (detik)'] = f.videoSec;
      b['Pesawat'] = f.aircraft; b['Lokasi'] = f.location; b['Status'] = f.status; b['X'] = h.lon; b['Y'] = h.lat;
      var fl = f.files || {};
      b['Berkas GPX'] = fl.gpx ? dasar + fl.gpx : ''; b['Berkas KML'] = fl.kml ? dasar + fl.kml : '';
      b['Berkas GeoJSON'] = fl.geojson ? dasar + fl.geojson : '';
      return b;
    });
    return tulisUtuh_(M, s.induk || 'rbm', s.tab_tujuan || 'Penerbangan Drone', ['ID penerbangan'], baris);
  },

  /** Profil potensi dan ancaman 7 resor 2026 (analisis harian tab Resor Pengelolaan). */
  profil_resor: function (M, s) {
    var d = ambilJson_(alamat_(M, s)[0]), tingkat = ['', 'rendah', 'sedang', 'tinggi', 'sangat tinggi'], jenis = {};
    (d.jenis_ancaman || []).forEach(function (j) { jenis[j.id] = j.nama; });
    var baris = (d.resor || []).map(function (r) {
      var b = { 'Resor': 'Resor ' + r.nama, 'Sumber': 'Analisis Resor Pengelolaan', 'SPTN': r.sptn === 'II' ? 'SPTN Wilayah II Pekat' : 'SPTN Wilayah I Kore',
        'Tahun': Number(String(d.diperbarui || '').slice(0, 4)) || 2026, 'Luas (ha)': r.luas_ha,
        'Status ancaman': tingkat[r.status_ancaman] || '', 'Skor potensi': r.potensi && r.potensi.total ? r.potensi.total.skor : '',
        'Tingkat potensi': r.potensi && r.potensi.total ? tingkat[r.potensi.total.tingkat] : '',
        'Skor pengawetan': r.potensi && r.potensi.pengawetan ? r.potensi.pengawetan.skor : '',
        'Skor perlindungan': r.potensi && r.potensi.perlindungan ? r.potensi.perlindungan.skor : '',
        'Skor pemanfaatan': r.potensi && r.potensi.pemanfaatan ? r.potensi.pemanfaatan.skor : '',
        'Observasi SMART': r.upaya ? r.upaya.observasi : '', 'Hari patroli': r.upaya ? r.upaya.hari_patroli : '',
        'Cakupan grid (persen)': r.upaya ? r.upaya.cakupan_pct : '',
        'Terbakar musim ini (ha)': r.terbakar ? (r.terbakar.ha !== undefined ? r.terbakar.ha : r.terbakar.luas_ha) : '',
        'Jumlah jenis satwa': r.satwa ? r.satwa.S : '', 'Jumlah jenis tumbuhan': r.tumbuhan ? r.tumbuhan.S : '',
        'Ancaman utama (kajian)': (r.ancaman_utama || []).map(function (j) { return jenis[j] || j; }).join(', '),
        'Peringkat ancaman': (r.ancaman || []).filter(function (x) { return x.peringkat; }).sort(function (x, y) { return y.peringkat - x.peringkat; })
          .map(function (x) { return (jenis[x.id] || x.id) + ' (' + tingkat[x.peringkat] + ')'; }).join('; '),
        'Arahan pengelolaan': (r.arahan || []).map(function (x) { return typeof x === 'string' ? x : x.teks || x.judul || ''; }).filter(String).join(' | '),
        'Diperbarui': d.diperbarui };
      return b;
    });
    return tulisUtuh_(M, s.induk || 'rbm', s.tab_tujuan || 'Profil Resor 2026', ['Resor'], baris);
  },

  /**
   * Salinan apa adanya satu tab Google Sheets lain (rekap laporan kejadian, rekap karhut, kunjungan wisata).
   * Alamat: ID atau URL spreadsheet, tambahkan "#Nama tab" untuk memilih tab (bawaan: tab pertama).
   */
  spreadsheet: function (M, s) {
    var a = alamat_(M, s)[0] || '', bagian = a.split('#');
    var id = (/\/d\/([A-Za-z0-9_-]+)/.exec(bagian[0]) || /[?&]id=([A-Za-z0-9_-]+)/.exec(bagian[0]) || [null, bagian[0].trim()])[1];
    var ss = bukaSpreadsheet_(id), sh = bagian[1] ? ss.getSheetByName(bagian[1].trim()) : ss.getSheets()[0];
    if (!sh) throw new Error('tab "' + bagian[1] + '" tidak ada');
    var v = sh.getDataRange().getValues();
    // baris judul = baris terisi terbanyak di 10 baris pertama
    var iH = 0, terbanyak = -1;
    v.slice(0, 10).forEach(function (r, i) {
      var n = r.filter(function (c) { return c !== '' && c !== null; }).length;
      if (n > terbanyak) { terbanyak = n; iH = i; }
    });
    var h = v[iH].map(function (x, j) { return String(x).trim() || 'Kolom ' + (j + 1); });
    var pakai = h.map(function (x, j) { return v.slice(iH + 1).some(function (r) { return r[j] !== '' && r[j] !== null; }) || String(v[iH][j]).trim(); });
    var kolom = h.filter(function (x, j) { return pakai[j]; });
    var unik = {};
    kolom = kolom.map(function (x) { var k = x, n = 2; while (unik[k]) k = x + ' (' + n++ + ')'; unik[k] = 1; return k; });
    var baris = v.slice(iH + 1).filter(function (r) { return r.some(function (c) { return c !== '' && c !== null; }); }).map(function (r) {
      var o = {}, j2 = 0;
      h.forEach(function (x, j) { if (pakai[j]) o[kolom[j2++]] = r[j]; });
      return o;
    });
    return tulisUtuh_(M, s.induk || 'pp', s.tab_tujuan || sh.getName(), kolom, baris);
  }
};

/**
 * Temuan kehati dari Data Masuk Kehati (temuan.json + taksa.json + kegiatan.json) ke tab satwa, tumbuhan, invasif,
 * dan ekosistem. pilihSumber: 'LPK' atau 'SMART'. tambahSaja: tambah tanpa mengganti (dipakai data awal SMART 2025).
 */
function tulisKehati_(M, t, taksa, kegiatan, pilihSumber, label, awalan, tambahSaja, hanyaTahun) {
  if (hanyaTahun && !hanyaTahun.length && !tambahSaja) {
    // semua tahun sudah dimuat sumber lain: hapus baris lama sumber ini saja
    ['satwa', 'tumbuhan', 'invasif', 'ekosistem'].forEach(function (g) {
      var p = penghubung_(M, g);
      gantiSumber_(M, p.induk, p.tab, label, KOLOM_DEPAN, [], {});
    });
    return 0;
  }
  var C = t.kolom, Q = t.kamus, sekarang = new Date(), kegId = {};
  (kegiatan || []).forEach(function (k) { kegId[k.id] = k; });
  var tujuan = { satwa: penghubung_(M, 'satwa'), tumbuhan: penghubung_(M, 'tumbuhan'), invasif: penghubung_(M, 'invasif'),
    ekosistem: penghubung_(M, 'ekosistem') };
  var perTab = { satwa: [], tumbuhan: [], invasif: [], ekosistem: [] };
  for (var i = 0; i < t.n; i++) {
    if (Q.sumber[C.s[i]] !== pilihSumber) continue;
    if (hanyaTahun && hanyaTahun.indexOf(Number(C.th[i])) < 0) continue;
    var x = C.t[i] >= 0 ? taksa[C.t[i]] : null, kat = Q.kategori[C.kat[i]], jt = Q.temuan[C.jt[i]];
    var kid = Q.kegiatan[C.k[i]], kg = kegId[kid] || {};
    var lon = C.lon[i], lat = C.lat[i];
    lon = typeof lon === 'number' ? lon : angkaAtauKosong_(lon);
    lat = typeof lat === 'number' ? lat : angkaAtauKosong_(lat);
    var b = { 'ID Observasi': awalan + C.id[i], 'Sumber': label };
    waktuBaku_(b, C.tgl[i], C.th[i], '');
    resorBaku_(M, b, lon, lat, Q.resor[C.res[i]]);
    var metode = kg.metode || (pilihSumber === 'SMART' ? '' : kid);
    b['Jenis kegiatan'] = pilihSumber === 'SMART' ? M.mandat[kunci_(metode)] || JENIS_TANPA_MANDAT : jenisKegiatan_(M, metode);
    b['Mandat'] = metode;
    b['ST'] = kid;
    var grup = kat === 'Tipe Ekosistem' ? 'ekosistem' : kat === 'Flora' || kat === 'Anggrek' ? 'tumbuhan' : 'satwa';
    if (grup === 'ekosistem') {
      b['Kategori 0'] = 'Ground Check'; b['Kategori 1'] = jt === 'tutupan lahan' ? 'Tutupan Lahan' : 'Tipe Ekosistem';
      b['Kode kategori'] = jt === 'tutupan lahan' ? 'groundcheck.tutupanlahan.' : 'groundcheck.tipeekosis.';
    } else if (grup === 'tumbuhan') {
      b['Kategori 0'] = 'Tumbuhan'; b['Kategori 2'] = jt === 'perjumpaan' ? '' : jt; b['Kode kategori'] = 'tumbuhan.';
    } else {
      var kk = KAT_KEHATI.satwa[jt] || ['Perjumpaan Satwa', 'satwaliar.perjumpaansatwa.'];
      b['Kategori 0'] = 'Satwa Liar'; b['Kategori 1'] = kk[0]; b['Kategori 2'] = jt === 'perjumpaan' ? '' : jt; b['Kode kategori'] = kk[1];
    }
    if (x) {
      b['Nama ilmiah baku'] = x.i ? x.i + (x.t === 'marga' ? ' sp.' : '') : '';
      b['Nama umum'] = x.n || '';
      b['Nama lokal'] = C.nl[i] || (x.l || []).join(', ');
      b['Kelompok jenis'] = KAT_KEHATI.kelompok[kat] || kat;
      b['Kode jenis'] = 'kehati|' + x.tid;
      b['Status perlindungan (P.106)'] = x.p106 || ''; b['IUCN'] = x.iucn || ''; b['CITES'] = x.cites || '';
    } else if (grup !== 'ekosistem') {
      b['Nama umum'] = String(C.ns[i] || '').split(' | ')[0];
      b['Kelompok jenis'] = KAT_KEHATI.kelompok[kat] || kat;
    }
    b['Jumlah'] = C.j[i] === null ? '' : C.j[i]; b['Satuan'] = Q.satuan[C.sat[i]] || ''; b['Jenis temuan'] = jt;
    b['Tingkat tumbuh'] = C.tt[i] || ''; b['Tipe ekosistem'] = C.eko[i] || ''; b['Tutupan lahan'] = C.tut[i] || '';
    b['Tingkat identifikasi'] = x ? x.t : ''; b['Nama di sumber'] = C.ns[i] || ''; b['Cara penyeragaman nama'] = Q.cara[C.cn[i]] || '';
    b['Petak atau titik'] = C.plot[i] || ''; b['Lokasi'] = Q.lokasi[C.lok[i]] || ''; b['Grid 1 km'] = C.g[i] || '';
    b['Posisi koordinat'] = Q.posisi[C.pos[i]] || ''; b['Keterangan sumber'] = C.atr[i] || '';
    b['Komentar'] = C.ctn[i] || ''; b['X'] = lon; b['Y'] = lat;
    b['Berkas'] = [Q.berkas[C.bk[i]], Q.lembar[C.lb[i]], C.br[i] ? 'baris ' + C.br[i] : ''].filter(String).join(' / ');
    b['Diproses'] = sekarang;
    perTab[grup].push(b);
    if (grup === 'tumbuhan' && x && x.inv) {
      var bi = {};
      for (var k in b) bi[k] = b[k];
      bi['Kategori 0'] = 'Spesies invasif'; bi['Kode kategori'] = 'spesiesinvasif.';
      perTab.invasif.push(bi);
    }
  }
  var n = 0, opsi = { jenis: KOLOM_JENIS, belakang: KOLOM_BELAKANG };
  Object.keys(perTab).forEach(function (g) {
    var tj = tujuan[g];
    n += tambahSaja ? tulisTab_(M, tj.induk, tj.tab, KOLOM_DEPAN, perTab[g], opsi) :
      gantiSumber_(M, tj.induk, tj.tab, label, KOLOM_DEPAN, perTab[g], opsi);
  });
  return n;
}
