/**
 * Mesin Data Satu Data Tambora – layanan Unduh Data
 *
 * Tab "Unduh Data" di hub Satu Data Tambora membaca tab data spreadsheet ini lewat aplikasi web:
 *   Terapkan > Deployment baru > Aplikasi web, Jalankan sebagai: Saya, Akses: Siapa saja.
 * URL /exec-nya ditempel ke data/sumber.js (UNDUH_DATA) di repo Satu-Data-Tambora.
 *
 * Hanya pegawai yang sudah masuk lewat gerbang hub yang bisa mengunduh: token sesi diperiksa ke aplikasi web Tanya Data
 * (Pengaturan URL_TANYA_DATA, aksi "siapa"). Kolom data pribadi (Pengaturan UNDUH_KOLOM_ADMIN dan kolom_admin di
 * Katalog) hanya ikut terunduh untuk akun berperan admin.
 *
 * Lembar "Katalog": satu baris per tab data. Kolom judul, tema, keterangan, akses (pegawai, admin, tidak), kolom_admin,
 * dan tampil boleh diubah; kolom lain dihitung ulang skrip setiap data berubah.
 *
 * Permintaan dari hub (JSON dikirim sebagai text/plain agar tidak ada preflight CORS):
 *   {aksi: 'katalog', token}
 *   {aksi: 'hitung', token, dataset: [id], saring}
 *   {aksi: 'unduh', token, id, saring, awal, kolom, format}
 * saring: {dari: 'YYYY-MM-DD', sampai: 'YYYY-MM-DD', tahun: [2025], nilai: {'Resor': ['Resor Piong']}, cari: 'teks'}
 */

var KOLOM_KATALOG = ['id', 'judul', 'tab', 'induk', 'tema', 'keterangan', 'akses', 'kolom_admin', 'tampil', 'jumlah_baris',
  'tahun_awal', 'tahun_akhir', 'kolom', 'faset', 'diperbarui', 'jumlah_titik'];
/** Kolom katalog yang diisi admin; tidak ditimpa saat katalog dihitung ulang. */
var KOLOM_KATALOG_ISIAN = ['judul', 'tema', 'keterangan', 'akses', 'kolom_admin', 'tampil'];
/** Kolom yang nilainya ditawarkan sebagai pilihan saring di hub (bila ada di tab). */
var FASET_UNDUH = ['Sumber', 'Resor', 'SPTN', 'Jenis kegiatan', 'Kategori 0', 'Kategori 1', 'Kelompok jenis'];
var KOLOM_LOG_UNDUH = ['Waktu', 'Pengguna', 'Peran', 'Data', 'Saringan', 'Jumlah baris', 'Format'];
var UNDUH_ADMIN_BAWAAN = 'Nama pelaku, ID Pelaku, Identitas pelaku, Alamat, Tersangka, Nama informan, Nama pemilik, ' +
  'Nama pengepul, Nama kapten, Nama masyarakat, Nama pewaris, Nama guide, Nama pengguna lahan, Riwayat perolehan lahan, ' +
  'Pihak berpengaruh, NIK, Nomor HP, Telepon';
var UNDUH_SEMBUNYI_BAWAAN = 'Kunci titik';
/** Satu halaman unduhan sekitar sekian sel (baris x kolom) agar jawaban aplikasi web tetap ringan. */
var SEL_PER_HALAMAN = 120000;

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

/* =========================== katalog =========================== */

function perbaruiKatalog() {
  var n = perbaruiKatalog_(muatMesin_(), true);
  kabari_('Katalog Unduh Data diperbarui: ' + n + ' tab data.');
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

/**
 * Ringkasan isi satu tab: jumlah baris, rentang tahun, judul kolom, hitungan nilai kolom pilihan saring,
 * dan jumlah baris berkoordinat (untuk GeoJSON dan Shapefile).
 */
function ringkasTab_(sh, zona) {
  var n = Math.max(0, sh.getLastRow() - 1), lc = sh.getLastColumn();
  var ring = { jumlah: n, kolom: [], faset: {}, tahun: ['', ''], titik: 0 };
  if (lc < 1) return ring;
  var v = sh.getRange(1, 1, n + 1, lc).getValues();
  var h = v.shift().map(function (x) { return String(x).trim(); });
  ring.kolom = h.filter(String);
  var iTh = h.indexOf('Tahun'), iTg = h.indexOf('Tanggal'), iX = h.indexOf('X'), iY = h.indexOf('Y'), idx = {}, hit = {}, hitTahun = {};
  FASET_UNDUH.forEach(function (f) { var i = h.indexOf(f); if (i >= 0) { idx[f] = i; hit[f] = {}; } });
  v.forEach(function (r) {
    Object.keys(idx).forEach(function (f) {
      var x = r[idx[f]];
      x = x === null || x === undefined ? '' : String(x).trim();
      if (x) hit[f][x] = (hit[f][x] || 0) + 1;
    });
    var th = tahunBaris_(r, iTh, iTg, zona);
    if (th) hitTahun[th] = (hitTahun[th] || 0) + 1;
    if (iX >= 0 && iY >= 0 && adaKoordinat_(r[iX], r[iY])) ring.titik++;
  });
  Object.keys(hit).forEach(function (f) {
    var urut = Object.keys(hit[f]).sort(function (a, b) { return hit[f][b] - hit[f][a]; }).slice(0, 150), o = {};
    urut.forEach(function (k) { o[k] = hit[f][k]; });
    if (urut.length) ring.faset[f] = o;
  });
  var th = Object.keys(hitTahun).map(Number).sort(function (a, b) { return a - b; });
  if (th.length) {
    ring.faset.Tahun = hitTahun;
    ring.tahun = [th[0], th[th.length - 1]];
  }
  return ring;
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
  var penghubung = {};
  M.rute.forEach(function (r) { if (!penghubung[r.tab]) penghubung[r.tab] = r.penghubung; });
  var baris = daftarTabData_(M).map(function (d) {
    var r = lama[d.nama] || {}, o = {}, k;
    for (k in r) o[k] = r[k];
    var n = Math.max(0, d.sh.getLastRow() - 1);
    var hitung = semua || !lama[d.nama] || diubah[d.nama] || Number(r.jumlah_baris) !== n || !r.kolom ||
      r.jumlah_titik === undefined || r.jumlah_titik === '';
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
      var ring = ringkasTab_(d.sh, zona);
      o.jumlah_baris = ring.jumlah;
      o.tahun_awal = ring.tahun[0];
      o.tahun_akhir = ring.tahun[1];
      o.kolom = JSON.stringify(ring.kolom);
      var f = JSON.stringify(ring.faset);
      if (f.length > 32000) f = JSON.stringify({ Tahun: ring.faset.Tahun || {} });
      o.faset = f;
      o.jumlah_titik = ring.titik;
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
 */
function saringTab_(sh, kepala, n, saring, zona) {
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
  var indeks = [];
  if (n <= 0) return { indeks: indeks, diabaikan: diabaikan };
  if (!pakaiWaktu && !nilai.length && !cari) {
    for (i = 0; i < n; i++) indeks.push(i);
    return { indeks: indeks, diabaikan: diabaikan };
  }
  var semua = null, kol = {};
  if (cari) semua = sh.getRange(2, 1, n, kepala.length).getValues();
  else Object.keys(perlu).forEach(function (x) { kol[x] = sh.getRange(2, Number(x) + 1, n, 1).getValues(); });
  var sel = function (r, j) { return j < 0 ? '' : semua ? semua[r][j] : kol[j][r][0]; };
  for (var r = 0; r < n; r++) {
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
    if (cari && semua[r].map(function (x) { return x instanceof Date ? Utilities.formatDate(x, zona, 'yyyy-MM-dd') : String(x); })
      .join(' ').toLowerCase().indexOf(cari) < 0) continue;
    indeks.push(r);
  }
  return { indeks: indeks, diabaikan: diabaikan };
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

function katalogTersimpan_(M) {
  if (M.katalog) return M.katalog;
  var daftar = bacaTabel_(M.ss, LEMBAR.katalog, true).filter(function (r) { return r.id && r.tab; });
  if (!daftar.length) {
    perbaruiKatalog_(muatMesin_(), true);
    daftar = bacaTabel_(M.ss, LEMBAR.katalog, true).filter(function (r) { return r.id && r.tab; });
  }
  daftar.forEach(function (r) {
    r.id = String(r.id);
    r.daftarKolom = jsonAman_(r.kolom, []);
    r.isiFaset = jsonAman_(r.faset, {});
  });
  return (M.katalog = daftar);
}

function cariKatalog_(M, id) {
  return katalogTersimpan_(M).filter(function (r) { return r.id === String(id || ''); })[0] || null;
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

/** Daftar data yang boleh dilihat pengguna, dengan pilihan saringnya. */
function katalogUntuk_(M, sesi) {
  var zona = M.ss.getSpreadsheetTimeZone(), akhir = '';
  var data = katalogTersimpan_(M).filter(function (r) { return bolehLihat_(r) && Number(r.jumlah_baris) > 0; }).map(function (r) {
    var d = { id: r.id, judul: String(r.judul || r.tab), tema: String(r.tema || ''), induk: String(r.induk || ''),
      keterangan: String(r.keterangan || ''), jumlah: Number(r.jumlah_baris) || 0,
      tahun: [Number(r.tahun_awal) || null, Number(r.tahun_akhir) || null], diperbarui: waktuTeks_(r.diperbarui, zona),
      terkunci: terkunci_(r, sesi) };
    if (d.diperbarui > akhir) akhir = d.diperbarui;
    if (!d.terkunci) {
      var tolak = kolomTolak_(M, r, r.daftarKolom, sesi);
      d.kolom = r.daftarKolom.filter(function (h) { return !tolak[h]; });
      d.faset = r.isiFaset;
      d.waktu = r.daftarKolom.indexOf('Tanggal') >= 0 || r.daftarKolom.indexOf('Tahun') >= 0;
      // Ada kolom X dan Y, dan (bila sudah dihitung) sedikitnya satu baris berkoordinat.
      d.titik = r.daftarKolom.indexOf('X') >= 0 && r.daftarKolom.indexOf('Y') >= 0 &&
        (r.jumlah_titik === '' || r.jumlah_titik === undefined || Number(r.jumlah_titik) > 0);
      d.khususAdmin = Object.keys(tolak).filter(function (h) { return tolak[h] === 'admin'; });
    }
    return d;
  });
  var tema = M.urutInduk.map(function (k) { return { kode: k, nama: String(M.induk[k].nama || k), warna: String(M.induk[k].warna || '') }; });
  return { ok: true, nama: sesi.nama, peran: sesi.peran, tema: tema, dataset: data, diperbarui: akhir };
}

function kepalaTab_(sh) {
  var lc = sh.getLastColumn();
  return lc ? sh.getRange(1, 1, 1, lc).getValues()[0].map(function (x) { return String(x).trim(); }) : [];
}

/** Jumlah baris yang lolos saringan untuk beberapa data sekaligus (pratinjau di hub). */
function hitungUnduh_(M, sesi, m) {
  var zona = M.ss.getSpreadsheetTimeZone(), mulai = Date.now(), cache = CacheService.getScriptCache(), hasil = [], belum = [];
  var saringTeks = JSON.stringify(m.saring || {});
  (Array.isArray(m.dataset) ? m.dataset : []).slice(0, 100).forEach(function (id) {
    var kat = cariKatalog_(M, id);
    if (!kat || !bolehLihat_(kat) || terkunci_(kat, sesi)) return;
    if (Date.now() - mulai > 25000) { belum.push(kat.id); return; }
    var kunci = 'hitung_' + md5_(kat.id + '|' + saringTeks + '|' + kat.jumlah_baris + '|' + waktuTeks_(kat.diperbarui, zona));
    var ada = cache.get(kunci);
    if (ada) { hasil.push(JSON.parse(ada)); return; }
    var sh = bukaTabKatalog_(M, kat);
    if (!sh) return;
    var h = saringTab_(sh, kepalaTab_(sh), sh.getLastRow() - 1, m.saring, zona);
    var o = { id: kat.id, jumlah: h.indeks.length, diabaikan: h.diabaikan };
    try { cache.put(kunci, JSON.stringify(o), 600); } catch (e) { /* cache penuh */ }
    hasil.push(o);
  });
  return { ok: true, hasil: hasil, belum: belum };
}

/** Satu halaman baris data yang lolos saringan. Halaman berikutnya diminta dengan awal = berikut. */
function ambilUnduh_(M, sesi, m) {
  var kat = cariKatalog_(M, m.id);
  if (!kat || !bolehLihat_(kat)) return { ok: false, galat: 'Data tidak ditemukan. Muat ulang halaman Unduh Data.' };
  if (terkunci_(kat, sesi)) return { ok: false, galat: 'Data ini khusus akun admin.' };
  var sh = bukaTabKatalog_(M, kat);
  if (!sh) return { ok: false, galat: 'Tab "' + kat.tab + '" tidak ada lagi. Minta admin memperbarui katalog.' };
  var zona = M.ss.getSpreadsheetTimeZone(), n = sh.getLastRow() - 1, kepala = kepalaTab_(sh);
  var tolak = kolomTolak_(M, kat, kepala, sesi);
  var pilih = Array.isArray(m.kolom) && m.kolom.length ? m.kolom.map(String) : null, keluar = [];
  kepala.forEach(function (h, i) { if (h && !tolak[h] && (!pilih || pilih.indexOf(h) >= 0)) keluar.push(i); });
  var hasil = saringTab_(sh, kepala, n, m.saring, zona);
  var ukuran = Math.max(300, Math.min(5000, Math.floor(SEL_PER_HALAMAN / Math.max(1, keluar.length))));
  var awal = Math.max(0, Math.floor(Number(m.awal) || 0)), bagian = hasil.indeks.slice(awal, awal + ukuran), baris = [];
  if (bagian.length) {
    var a = bagian[0], b = bagian[bagian.length - 1];
    var blok = sh.getRange(2 + a, 1, b - a + 1, kepala.length).getValues();
    var iLain = kepala.indexOf('Atribut lain'), admin = sesi.peran === 'admin' ? null : daftarAdmin_(M, kat);
    baris = bagian.map(function (r) {
      var row = blok[r - a];
      return keluar.map(function (i) {
        var v = row[i];
        if (i === iLain && admin && v) v = bersihAtributLain_(v, admin);
        return selKeluar_(v, zona);
      });
    });
  }
  if (!awal && !m.uji) catatUnduh_(M, sesi, kat, m, hasil.indeks.length);
  var lanjut = awal + bagian.length;
  return { ok: true, id: kat.id, judul: String(kat.judul || kat.tab), kolom: keluar.map(function (i) { return kepala[i]; }),
    baris: baris, jumlah: hasil.indeks.length, awal: awal, berikut: lanjut < hasil.indeks.length ? lanjut : null,
    diabaikan: hasil.diabaikan, khususAdmin: Object.keys(tolak).filter(function (h) { return tolak[h] === 'admin'; }) };
}

function catatUnduh_(M, sesi, kat, m, jumlah) {
  try {
    var sh = M.ss.getSheetByName(LEMBAR.logUnduh);
    if (!sh) {
      sh = M.ss.insertSheet(LEMBAR.logUnduh, M.ss.getSheets().length);
      sh.getRange(1, 1, 1, KOLOM_LOG_UNDUH.length).setValues([KOLOM_LOG_UNDUH]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    sh.appendRow([new Date(), sesi.u, sesi.peran, String(kat.judul || kat.tab), amanSel_(JSON.stringify(m.saring || {}).slice(0, 1000)),
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
    if (m.aksi === 'katalog') return json_(katalogUntuk_(M, sesi));
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
  var kat = katalogUntuk_(M, sesi);
  pesan.push(kat.dataset.length + ' data siap diunduh.');
  var d = kat.dataset.filter(function (x) { return x.jumlah > 0; })[0];
  if (d) {
    var u = ambilUnduh_(M, sesi, { id: d.id, saring: {}, awal: 0, uji: true });
    pesan.push('Contoh "' + d.judul + '": ' + u.jumlah + ' baris, ' + u.kolom.length + ' kolom, halaman pertama ' + u.baris.length + ' baris.');
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
