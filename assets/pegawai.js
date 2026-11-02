/* Kepegawaian De-Bora: membaca spreadsheet DE-BORA bagian Kepegawaian langsung dari browser.
 *
 * Tiap tab dibaca lewat Google Visualization (gviz, CSV) dengan link spreadsheet yang dibagikan
 * "Siapa saja yang memiliki link: Pelihat", lalu diolah di perangkat menjadi angka ringkas, pengingat,
 * dan agenda. Hanya hasil olahan yang ditampilkan dan disimpan sementara (sessionStorage, 10 menit);
 * NIP, tanggal lahir, asal, agama, dan nilai per orang tidak ditampilkan dan tidak disimpan.
 *
 * Link DE-BORA diambil dari tab Pengaturan Sheet konten (kunci "kepegawaian"), atau dari
 * KEPEGAWAIAN di data/sumber.js bila diisi. Dipakai oleh kepegawaian/ dan panel ubin Kepegawaian di hub.
 *
 * Pengolahan tab di bawah ini sama dengan yang dulu dirancang untuk Apps Script: kolom dikenali dari judul
 * dan isinya, bukan posisi tetap, jadi tetap jalan bila bagian Kepegawaian menambah baris atau kolom.
 */
(function () {
  'use strict';

  var ZONA = 'Asia/Makassar';
  function dua_(n) { return (n < 10 ? '0' : '') + n; }
  function normal_(s) { return String(s === null || s === undefined ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  /** Tanggal hari ini (WITA) sebagai yyyy-mm-dd. */
  function hariIni_() { return formatTgl_(new Date(), ZONA); }
  function formatTgl_(d, zona) {
    try {
      var p = {};
      new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)
        .forEach(function (x) { p[x.type] = x.value; });
      return p.year + '-' + p.month + '-' + p.day;
    } catch (e) {
      return d.getFullYear() + '-' + dua_(d.getMonth() + 1) + '-' + dua_(d.getDate());
    }
  }
  // Pengganti Utilities.formatDate Apps Script (hanya pola yyyy-MM-dd yang dipakai).
  var Utilities = { formatDate: function (d, zona) { return formatTgl_(d, zona === 'UTC' ? 'UTC' : zona); } };

  var BULAN_ID = {
    jan: 1, januari: 1, january: 1, feb: 2, peb: 2, februari: 2, pebruari: 2, february: 2, mar: 3, maret: 3, march: 3, apr: 4, april: 4,
    mei: 5, may: 5, jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7, agu: 8, agt: 8, ags: 8, agus: 8, agust: 8, agustus: 8, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, okt: 10, oktober: 10, oct: 10, october: 10, nov: 11, nop: 11, november: 11, nopember: 11,
    des: 12, desember: 12, dec: 12, december: 12
  };
  var NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function isoTgl_(y, m, d) {
    if (!(y > 1900 && y < 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return '';
    var t = new Date(Date.UTC(y, m - 1, d));
    if (t.getUTCMonth() !== m - 1) return '';
    return y + '-' + dua_(m) + '-' + dua_(d);
  }

  /** Tanggal dari isi sel: objek Date, 01/12/2026, 01-12-2026, 2026-12-01, "1 Desember 2026", "Desember 2026", "November 2, 2026", nomor seri. */
  function tglPegawai_(teks, nilai) {
    if (nilai instanceof Date && !isNaN(nilai.getTime())) return Utilities.formatDate(nilai, ZONA_HR_ || ZONA, 'yyyy-MM-dd');
    var s = normal_(teks).replace(/(\d)(st|nd|rd|th)\b/g, '$1');
    if (!s) return '';
    var m = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/.exec(s);
    if (m) return isoTgl_(+m[1], +m[2], +m[3]);
    m = /\b(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{4}|\d{2})\b/.exec(s);
    if (m) {
      var d = +m[1], b = +m[2], y = +m[3];
      if (y < 100) y += y > 50 ? 1900 : 2000;
      if (b > 12 && d <= 12) { var x = d; d = b; b = x; }
      return isoTgl_(y, b, d);
    }
    m = /\b(\d{1,2})\s+([a-z]{3,9})\.?,?\s+(\d{4})\b/.exec(s);
    if (m && BULAN_ID[m[2]]) return isoTgl_(+m[3], BULAN_ID[m[2]], +m[1]);
    m = /\b([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/.exec(s);
    if (m && BULAN_ID[m[1]]) return isoTgl_(+m[3], BULAN_ID[m[1]], +m[2]);
    m = /\b([a-z]{3,9})\.?\s+(\d{4})\b/.exec(s);
    if (m && BULAN_ID[m[1]]) return isoTgl_(+m[2], BULAN_ID[m[1]], 1);
    m = /^(\d{5})(\.\d+)?$/.exec(s);
    if (m && +m[1] > 20000 && +m[1] < 80000) return Utilities.formatDate(new Date(Date.UTC(1899, 11, 30) + +m[1] * 864e5), 'UTC', 'yyyy-MM-dd');
    return '';
  }

  /** Rentang tanggal dari teks bebas: "12-16 Mei 2026", "29 Juni s.d. 3 Juli 2026", "1 Januari 2026 - 31 Maret 2026". */
  function rentangPegawai_(teks, nilai) {
    var tunggal = tglPegawai_(teks, nilai);
    var s = normal_(teks).replace(/\bs\s*\/\s*d\b|\bs\.\s*d\.?|\bsd\b|\bsampai( dengan)?\b|\bhingga\b|[–—]/g, ' - ');
    s = s.replace(/([a-z]\.?)\s*-\s*(\d)/g, '$1 - $2').replace(/(\d{4})\s*-\s*(\d{1,2}\s+[a-z])/g, '$1 - $2');
    var bagian = s.split(/\s+-\s+/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (bagian.length < 2) {
      var m = /^(\d{1,2})\s*-\s*(\d{1,2})\s+([a-z]{3,9})\.?\s+(\d{4})$/.exec(s);
      if (m && BULAN_ID[m[3]]) return { mulai: isoTgl_(+m[4], BULAN_ID[m[3]], +m[1]), selesai: isoTgl_(+m[4], BULAN_ID[m[3]], +m[2]) };
      return { mulai: tunggal, selesai: tunggal };
    }
    var akhir = tglPegawai_(bagian[bagian.length - 1]);
    if (!akhir) return { mulai: tunggal, selesai: tunggal };
    var a = bagian[0], ya = akhir.slice(0, 4), ma = akhir.slice(5, 7);
    var awal = tglPegawai_(a);
    if (!awal) {
      var m1 = /^(\d{1,2})\s+([a-z]{3,9})\.?$/.exec(a);
      var m2 = /^(\d{1,2})$/.exec(a);
      var m3 = /^([a-z]{3,9})\.?$/.exec(a);
      if (m1 && BULAN_ID[m1[2]]) awal = isoTgl_(+ya, BULAN_ID[m1[2]], +m1[1]);
      else if (m2) awal = isoTgl_(+ya, +ma, +m2[1]);
      else if (m3 && BULAN_ID[m3[1]]) awal = isoTgl_(+ya, BULAN_ID[m3[1]], 1);
    }
    if (awal && awal > akhir && awal.slice(0, 4) === akhir.slice(0, 4)) awal = isoTgl_(+ya - 1, +awal.slice(5, 7), +awal.slice(8, 10));
    return { mulai: awal || akhir, selesai: akhir };
  }

  /** Selisih hari dari hari ini (zona WITA) ke tanggal ISO; negatif bila sudah lewat. */
  function hariKe_(iso) {
    if (!iso) return null;
    var h = hariIni_().split('-'), t = iso.split('-');
    return Math.round((Date.UTC(+t[0], +t[1] - 1, +t[2]) - Date.UTC(+h[0], +h[1] - 1, +h[2])) / 864e5);
  }

  function tambahBulan_(iso, n) {
    var t = iso.split('-').map(Number);
    var d = new Date(Date.UTC(t[0], t[1] - 1 + n, 1));
    var akhir = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    return isoTgl_(d.getUTCFullYear(), d.getUTCMonth() + 1, Math.min(t[2], akhir));
  }

  function umurTahun_(lahir, pada) {
    if (!lahir) return null;
    var a = lahir.split('-').map(Number), b = (pada || hariIni_()).split('-').map(Number);
    var u = b[0] - a[0];
    if (b[1] < a[1] || (b[1] === a[1] && b[2] < a[2])) u--;
    return u >= 15 && u <= 80 ? u : null;
  }

  /** Nama orang dirapikan: spasi ganda dibuang, gelar dibiarkan seperti tertulis. */
  function namaPegawai_(s) { return String(s || '').replace(/\s+/g, ' ').replace(/^[\s,.;:-]+|[\s,;:-]+$/g, '').trim(); }
  function kunciNama_(s) { return normal_(String(s || '').split(',')[0]).replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim(); }
  function nipDari_(s) { var m = /\b(\d{18})\b/.exec(String(s || '').replace(/\s+/g, '')); return m ? m[1] : ''; }

  /** Cari lembar menurut pola nama. Untuk tab bertahun (KGB 2026, SKP 2026, Cuti 2026) dipilih tahun berjalan, kalau tidak ada tahun terbaru. */
  function cariLembarPegawai_(lembar, pola, bertahun) {
    var tahun = Number(hariIni_().slice(0, 4)), kandidat = [];
    lembar.forEach(function (l) {
      var n = normal_(l.nama);
      if (!pola.test(n)) return;
      var m = /(20\d{2})/.exec(n);
      kandidat.push({ sh: l.sh, tahun: m ? +m[1] : 0 });
    });
    if (!kandidat.length) return null;
    if (!bertahun) return kandidat[0].sh;
    var pas = kandidat.filter(function (k) { return k.tahun === tahun; })[0];
    if (pas) return pas.sh;
    kandidat.sort(function (a, b) { return b.tahun - a.tahun; });
    return kandidat.filter(function (k) { return k.tahun <= tahun; })[0] ? kandidat.filter(function (k) { return k.tahun <= tahun; })[0].sh : kandidat[0].sh;
  }

  function gridLembar_(sh) {
    var r = sh.getDataRange();
    return { nama: sh.getName(), teks: r.getDisplayValues(), nilai: r.getValues() };
  }

  /** Baris judul: baris pertama (dalam 15 baris teratas) yang memuat semua kata kunci. Mengembalikan indeks kolom per kunci. */
  function cariJudul_(teks, kunci, mulai) {
    for (var i = mulai || 0; i < Math.min(teks.length, (mulai || 0) + 15); i++) {
      var sel = teks[i].map(function (c) { return normal_(c); });
      var kol = {}, lengkap = true;
      Object.keys(kunci).forEach(function (k) {
        var pola = kunci[k], j = -1;
        for (var c = 0; c < sel.length; c++) if (sel[c] && pola.test(sel[c])) { j = c; break; }
        if (j < 0 && !/\?$/.test(k)) lengkap = false;
        kol[k.replace(/\?$/, '')] = j;
      });
      if (lengkap) return { baris: i, kol: kol };
    }
    return null;
  }

  function hitungNilai_(daftar, fn) {
    var n = {}, urut = [];
    daftar.forEach(function (x) {
      var k = fn(x);
      if (k === null || k === undefined || k === '') return;
      if (!(k in n)) { n[k] = 0; urut.push(k); }
      n[k]++;
    });
    return urut.map(function (k) { return { nama: k, n: n[k] }; }).sort(function (a, b) { return b.n - a.n; });
  }


  /* ---------- pengolahan spreadsheet DE-BORA ---------- */
  /* Semua pembacaan berdasarkan judul kolom dan isi sel, bukan posisi tetap, jadi tetap jalan bila bagian Kepegawaian
     menambah baris, menggeser kolom, atau membuat tab tahun baru (KGB 2027, SKP 2027, Cuti 2027). */

  var ZONA_HR_ = null; // zona waktu spreadsheet Kepegawaian, dipakai untuk sel bertipe tanggal

  function geserHari_(iso, n) {
    var t = iso.split('-').map(Number), d = new Date(Date.UTC(t[0], t[1] - 1, t[2] + n));
    return d.getUTCFullYear() + '-' + dua_(d.getUTCMonth() + 1) + '-' + dua_(d.getUTCDate());
  }
  function barisPertama_(s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean)[0] || ''; }
  function angkaSel_(teks, nilai) {
    if (typeof nilai === 'number' && isFinite(nilai)) return nilai;
    var s = String(teks === null || teks === undefined ? '' : teks).trim().replace(/^[−–]/, '-');
    if (!/^[-+]?\d+([.,]\d+)?$/.test(s)) return null;
    return parseFloat(s.replace(',', '.'));
  }
  /** Isi sel yang hanya berupa tanggal (objek Date atau teks tanggal lengkap), bukan teks yang kebetulan memuat tanggal. */
  function hanyaTanggal_(teks, nilai) {
    if (nilai instanceof Date && !isNaN(nilai.getTime())) return tglPegawai_('', nilai);
    var s = normal_(teks);
    if (!s || s.length > 25) return '';
    return /^\d{1,2}\s*[\/.-]\s*\d{1,2}\s*[\/.-]\s*(\d{4}|\d{2})$|^\d{4}-\d{1,2}-\d{1,2}$|^\d{1,2}\s+[a-z]{3,9}\.?\s+\d{4}$/.test(s) ? tglPegawai_(s) : '';
  }
  function bulanTahun_(iso) { var t = iso.split('-'); return NAMA_BULAN[+t[1] - 1] + ' ' + t[0]; }
  function tglPanjang_(iso) { var t = iso.split('-'); return +t[2] + ' ' + NAMA_BULAN[+t[1] - 1] + ' ' + t[0]; }

  var SINGKATAN_ = { sk: 'SK', pns: 'PNS', cpns: 'CPNS', pppk: 'PPPK', asn: 'ASN', bkn: 'BKN', kp: 'KP', kgb: 'KGB', skp: 'SKP', pak: 'PAK',
    tu: 'TU', sptn: 'SPTN', bpjs: 'BPJS', npwp: 'NPWP', ktp: 'KTP', siasn: 'SIASN', simpeg: 'SIMPEG', sikadir: 'Sikadir', myasn: 'MyASN',
    tnt: 'TNT', tn: 'TN', sdm: 'SDM', sdmo: 'SDMO', klhk: 'KLHK', ksdae: 'KSDAE', pp: 'PP', uu: 'UU', bmn: 'BMN', peh: 'PEH', jf: 'JF', pdf: 'PDF' };
  /** Teks HURUF BESAR semua dijadikan huruf kalimat; singkatan dan angka Romawi dipertahankan. */
  function judulKalimat_(s) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    if (!s || /[a-z]/.test(s)) return s;
    var awal = true;
    return s.toLowerCase().replace(/[a-z0-9]+/g, function (w) {
      var h = SINGKATAN_[w] || (/^[ivx]{1,4}$/.test(w) ? w.toUpperCase() : awal ? w.charAt(0).toUpperCase() + w.slice(1) : w);
      awal = false;
      return h;
    });
  }
  /** Huruf awal tiap kata (untuk nama unit). */
  function hurufAwal_(s) {
    return String(s || '').toLowerCase().replace(/[a-z0-9]+/g, function (w) {
      if (SINGKATAN_[w]) return SINGKATAN_[w];
      if (/^[ivx]{1,4}$/.test(w)) return w.toUpperCase();
      if (/^(dan|di|ke|dari|yang|atau|untuk|dengan|pada)$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).replace(/\s+/g, ' ').trim();
  }

  /* Tanggal berulang tanpa tahun ("5 Nov", "1 Februari") */
  function hariBulan_(teks) {
    var m = /(\d{1,2})\s*([a-z]{3,9})\.?/.exec(normal_(teks));
    return m && BULAN_ID[m[2]] ? { h: +m[1], b: BULAN_ID[m[2]] } : null;
  }
  function tglHB_(y, hb) { return isoTgl_(y, hb.b, hb.h) || isoTgl_(y, hb.b, 28); }
  /** Kemunculan (hari, bulan) terakhir pada atau sebelum iso. */
  function sebelumAtau_(hb, iso) { var y = +iso.slice(0, 4), t = tglHB_(y, hb); return t > iso ? tglHB_(y - 1, hb) : t; }
  /** Kemunculan (hari, bulan) pertama pada atau sesudah iso. */
  function berikutnya_(hb, iso) { var y = +iso.slice(0, 4), t = tglHB_(y, hb); return t < iso ? tglHB_(y + 1, hb) : t; }
  /** "5 Nov s/d 10 Desember", "1 s/d 20 Desember", "6 Jan s/d 10 Jan", "10 September". */
  function rentangTanpaTahun_(teks) {
    var s = normal_(teks).replace(/\bs\s*\/\s*d\b|\bs\.\s*d\.?|\bsd\b|\bsampai( dengan)?\b|\bhingga\b|[–—]/g, ' - ').replace(/(\d)\s*-\s*(\d)/g, '$1 - $2');
    var p = s.split(/\s+-\s+/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (!p.length || /\d{4}/.test(s)) return null;
    var akhir = hariBulan_(p[p.length - 1]);
    if (!akhir) return null;
    var awal = p.length > 1 ? hariBulan_(p[0]) : akhir;
    if (!awal && /^\d{1,2}$/.test(p[0])) awal = { h: +p[0], b: akhir.b };
    return awal ? { awal: awal, akhir: akhir } : null;
  }
  /** Tanggal yang sudah lewat lebih dari sebulan digeser per tahun ke depan (jadwal tahunan yang belum diperbarui). */
  function gulirTahun_(iso, batas) {
    var t = iso, n = 0;
    while (t < batas && n < 5) { t = isoTgl_(+t.slice(0, 4) + 1, +t.slice(5, 7), +t.slice(8, 10)) || isoTgl_(+t.slice(0, 4) + 1, +t.slice(5, 7), 28); n++; }
    return { tanggal: t, perkiraan: n > 0 };
  }

  /** Pengingat yang sama (jenis, judul, tanggal) digabung menjadi satu butir dengan daftar orang. */
  function tambahIngat_(H, x, orang) {
    var k = [x.jenis, x.judul, x.tanggal || '', x.sampai || ''].join('|');
    H._ingat = H._ingat || {};
    var ada = H._ingat[k];
    if (!ada) { ada = H._ingat[k] = x; x.orang = x.orang || []; H.pengingat.push(x); }
    if (orang) {
      var kn = kunciNama_(orang.nama || orang);
      if (!ada.orang.some(function (o) { return kunciNama_(o.nama || o) === kn; })) ada.orang.push(orang);
    }
    return ada;
  }
  function tambahAgenda_(H, a) {
    var k = [a.judul, a.kelompok || '', a.mulai || '', a.selesai || ''].join('|');
    H._agenda = H._agenda || {};
    if (H._agenda[k]) return;
    H._agenda[k] = 1;
    H.agenda.push(a);
  }

  /* ---------- daftar pegawai (baseline) ---------- */

  var POLA_ROSTER_ = {
    nama: /^nama( lengkap| pegawai)?$/, 'nip?': /^nip$/, 'jabatan?': /^(nama )?jabatan$/, 'lahir?': /tanggal lahir|tgl\.? lahir/,
    'pensiun?': /pensiun|^bup$/, 'diklat?': /diklat/, 'fungsional?': /^fungsional$|^jenis jabatan$/, 'masa?': /^masa kerja$/,
    'tahunKerja?': /^tahun kerja$/, 'bulanKerja?': /^bulan kerja$/, 'kelamin?': /jenis kelamin|^l\s*\/\s*p$|^jk$|^kelamin$/,
    'status?': /^status( kepegawaian| pegawai| asn)?$/, 'unit?': /^unit( kerja)?$|^satuan kerja$|^penempatan$|^lokasi kerja$/,
    'pangkat?': /pangkat|^gol/, 'umur?': /^umur$|^usia$/
  };
  var BAND_UMUR_ = [[0, 24, '≤ 24'], [25, 29, '25–29'], [30, 34, '30–34'], [35, 39, '35–39'], [40, 44, '40–44'], [45, 49, '45–49'], [50, 54, '50–54'], [55, 99, '≥ 55']];
  var BAND_MASA_ = [[0, 1, '< 2'], [2, 4, '2–4'], [5, 9, '5–9'], [10, 14, '10–14'], [15, 19, '15–19'], [20, 24, '20–24'], [25, 29, '25–29'], [30, 99, '≥ 30']];

  function kelompokJabatan_(j) {
    var s = String(j || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    if (/^(kepala|kasubb?ag|kasi\b|plt\b|plh\b)/i.test(s)) return 'Pejabat struktural';
    s = s.replace(/\s+(pada|di)\s+.*$/i, '').replace(/\s*\([^)]*\)\s*$/, '')
      .replace(/\s+(ahli\s+(utama|madya|muda|pertama)|terampil|mahir|penyelia|pemula|pelaksana lanjutan|pelaksana pemula|pelaksana|lanjutan)$/i, '').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function labelJenisJabatan_(v) {
    var s = String(v || '').replace(/\s+/g, ' ').trim(), n = normal_(s);
    if (!n) return '';
    if (n === 'khusus' || n === 'fungsional khusus') return 'Fungsional khusus';
    if (n === 'umum' || n === 'fungsional umum') return 'Fungsional umum';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function kodeGolongan_(s) {
    var t = String(s || ''), m = /\(([^)]*)\)\s*$/.exec(t) || /\b((?:IV|III|II|I)\s*\/\s*[a-e])\b/i.exec(t) || /^\s*([IVX]{1,5})\s*$/i.exec(t);
    if (!m) return '';
    var k = m[1].replace(/\s+/g, ''), p = /^([ivx]+)\/([a-e])$/i.exec(k);
    if (p) return p[1].toUpperCase() + '/' + p[2].toLowerCase();
    return /^[ivx]+$/i.test(k) ? k.toUpperCase() : '';
  }
  function nilaiRomawi_(r) {
    var v = { I: 1, V: 5, X: 10 }, n = 0;
    for (var i = 0; i < r.length; i++) { var a = v[r[i]] || 0, b = v[r[i + 1]] || 0; n += a < b ? -a : a; }
    return n;
  }
  function bandKe_(band, x) {
    for (var i = 0; i < band.length; i++) if (x >= band[i][0] && x <= band[i][1] + 0.999) return i;
    return -1;
  }
  function rerata_(daftar) { return daftar.length ? Math.round(daftar.reduce(function (a, b) { return a + b; }, 0) / daftar.length * 10) / 10 : null; }

  function olahDaftarPegawai_(H, lembar, bacaSh) {
    var terbaik = null, golLembar = null;
    lembar.filter(function (l) { return /^sheet ?1$|diklat|^data pegawai|^daftar pegawai|^pegawai$|^duk\b/.test(normal_(l.nama)); }).forEach(function (l) {
      var g = bacaSh(l.sh), j = cariJudul_(g.teks, POLA_ROSTER_);
      if (!j) return;
      var skor = Object.keys(j.kol).filter(function (k) { return j.kol[k] >= 0; }).length;
      if (skor < 3) return;
      if (!terbaik || skor > terbaik.skor) terbaik = { g: g, j: j, skor: skor };
      if (j.kol.pangkat >= 0 && !golLembar) golLembar = { g: g, j: j };
    });
    if (!terbaik) throw new Error('tab daftar pegawai (kolom Nama Lengkap, NIP, Tanggal Lahir/Pensiun) tidak ditemukan');
    var g = terbaik.g, k = terbaik.j.kol, T = g.teks, V = g.nilai, mulai = terbaik.j.baris + 1, orang = [];
    for (var i = mulai; i < T.length; i++) {
      var r = T[i], nama = namaPegawai_(barisPertama_(r[k.nama]));
      if (!nama || /^(jumlah|total|rata|keterangan|catatan)/i.test(nama) || /^[\d.,%\s]+$/.test(nama)) continue;
      var sel = function (key) { return k[key] >= 0 ? String(r[k[key]] || '').trim() : ''; };
      var nil = function (key) { return k[key] >= 0 ? V[i][k[key]] : ''; };
      var nip = nipDari_(sel('nip')), jab = sel('jabatan').replace(/\s+/g, ' ');
      var lahir = k.lahir >= 0 ? tglPegawai_(sel('lahir'), nil('lahir')) : '';
      if (!lahir && nip) lahir = isoTgl_(+nip.slice(0, 4), +nip.slice(4, 6), +nip.slice(6, 8));
      if (!nip && !lahir && !jab) continue;
      var masa = null, tm = /(\d+)\s*(?:tahun|thn|th)\b(?:\D*(\d+)\s*(?:bulan|bln|bl)\b)?/i.exec(sel('masa'));
      if (tm) masa = +tm[1] + (tm[2] ? +tm[2] / 12 : 0);
      else if (angkaSel_(sel('masa'), nil('masa')) !== null) masa = angkaSel_(sel('masa'), nil('masa'));
      else if (angkaSel_(sel('tahunKerja'), nil('tahunKerja')) !== null) masa = angkaSel_(sel('tahunKerja'), nil('tahunKerja')) + (angkaSel_(sel('bulanKerja'), nil('bulanKerja')) || 0) / 12;
      var umur = umurTahun_(lahir);
      if (umur === null) umur = angkaSel_(sel('umur'), nil('umur'));
      orang.push({ baris: i, nama: nama, nip: nip, lahir: lahir, jabatan: jab, umur: umur, masa: masa,
        pensiun: k.pensiun >= 0 ? tglPegawai_(sel('pensiun'), nil('pensiun')) : '', diklat: normal_(sel('diklat')),
        jenis: labelJenisJabatan_(sel('fungsional')), unit: sel('unit'), status: normal_(sel('status')), kelamin: normal_(sel('kelamin')) });
    }
    if (!orang.length) throw new Error('daftar pegawai kosong di tab ' + g.nama);

    // Kolom tanpa judul dikenali dari isinya: L/P, PNS/PPPK, CPNS.
    var dipakai = {};
    Object.keys(k).forEach(function (x) { if (k[x] >= 0) dipakai[k[x]] = 1; });
    var kolKelamin = -1, kolStatus = [], lebar = Math.max.apply(null, T.map(function (b) { return b.length; }));
    for (var c = 0; c < lebar; c++) {
      if (dipakai[c]) continue;
      var isi = orang.map(function (o) { return normal_(T[o.baris][c]); }).filter(Boolean);
      if (!isi.length) continue;
      if (kolKelamin < 0 && isi.length >= orang.length * 0.5 && isi.every(function (v) { return /^(l|p|lk|pr|laki-laki|laki laki|perempuan|pria|wanita)$/.test(v); })) kolKelamin = c;
      // kolom status (PNS/PPPK, CPNS): nilai berulang, bukan tabel ringkas yang memuat tiap label sekali
      else if (isi.length >= 2 && (isi.length >= orang.length * 0.1 || isi.length > new Set(isi).size) && isi.every(function (v) { return /^(pns|cpns|pppk|p3k)$/.test(v); })) kolStatus.push(c);
    }
    orang.forEach(function (o) {
      var kl = o.kelamin || (kolKelamin >= 0 ? normal_(T[o.baris][kolKelamin]) : '');
      o.kel = /^(l|lk|laki|pria)/.test(kl) ? 'l' : /^(p|pr|perempuan|wanita)/.test(kl) ? 'p' : o.nip.charAt(14) === '1' ? 'l' : o.nip.charAt(14) === '2' ? 'p' : '';
      var st = /cpns/.test(o.status) ? 'CPNS' : /pppk|p3k/.test(o.status) ? 'PPPK' : /pns/.test(o.status) ? 'PNS' : '';
      kolStatus.forEach(function (c) { var v = normal_(T[o.baris][c]); if (v === 'cpns') st = 'CPNS'; else if (!st && v) st = v === 'p3k' ? 'PPPK' : v.toUpperCase(); });
      o.st = st || 'Belum tercatat';
    });

    var P = H.pegawai = { total: orang.length, sumber: g.nama };
    H.jumlahTab['Daftar pegawai (' + g.nama + ')'] = orang.length;
    P.kelamin = { l: orang.filter(function (o) { return o.kel === 'l'; }).length, p: orang.filter(function (o) { return o.kel === 'p'; }).length };
    var urutStatus = ['PNS', 'CPNS', 'PPPK'];
    P.status = hitungNilai_(orang, function (o) { return o.st; }).map(function (s) {
      var ini = orang.filter(function (o) { return o.st === s.nama; });
      return { nama: s.nama, n: s.n, l: ini.filter(function (o) { return o.kel === 'l'; }).length, p: ini.filter(function (o) { return o.kel === 'p'; }).length };
    }).sort(function (a, b) { var x = urutStatus.indexOf(a.nama), y = urutStatus.indexOf(b.nama); return (x < 0 ? 9 : x) - (y < 0 ? 9 : y) || b.n - a.n; });
    P.jenisJabatan = hitungNilai_(orang, function (o) { return o.jenis; });
    var grupJab = {};
    orang.forEach(function (o) {
      var nm = kelompokJabatan_(o.jabatan) || 'Belum tercatat', kk = normal_(nm);
      if (!grupJab[kk]) grupJab[kk] = { nama: nm, n: 0, l: 0, p: 0 };
      grupJab[kk].n++;
      if (o.kel) grupJab[kk][o.kel]++;
    });
    P.jabatan = Object.keys(grupJab).map(function (x) { return grupJab[x]; }).sort(function (a, b) { return b.n - a.n || a.nama.localeCompare(b.nama); });
    if (k.unit >= 0) P.unit = hitungNilai_(orang, function (o) { return o.unit; });

    var umur = orang.map(function (o) { return o.umur; }).filter(function (x) { return x !== null && x >= 15 && x <= 80; });
    if (umur.length) {
      P.umur = BAND_UMUR_.map(function (b) { return { nama: b[2] + ' tahun', label: b[2], n: 0 }; });
      umur.forEach(function (u) { var i = bandKe_(BAND_UMUR_, Math.floor(u)); if (i >= 0) P.umur[i].n++; });
      P.rerataUmur = rerata_(umur);
    }
    var masa = orang.map(function (o) { return o.masa; }).filter(function (x) { return x !== null && x >= 0 && x < 60; });
    if (masa.length) {
      P.masaKerja = BAND_MASA_.map(function (b) { return { nama: b[2] + ' tahun', label: b[2], n: 0 }; });
      masa.forEach(function (u) { var i = bandKe_(BAND_MASA_, Math.floor(u)); if (i >= 0) P.masaKerja[i].n++; });
      P.rerataMasaKerja = rerata_(masa);
    }
    if (k.diklat >= 0) {
      var sudah = orang.filter(function (o) { return /^(sudah|ya|v|ok|✓)/.test(o.diklat); });
      var belum = orang.filter(function (o) { return /^(belum|blm|tidak)/.test(o.diklat); });
      P.diklat = { sudah: sudah.length, belum: belum.length, kosong: orang.length - sudah.length - belum.length, belumOrang: belum.map(function (o) { return o.nama; }) };
    }

    var lima = geserHari_(H.hariIni, 1826), dua = geserHari_(H.hariIni, 730);
    if (k.pensiun >= 0) P.pensiun5 = orang.filter(function (o) { return o.pensiun && o.pensiun >= H.hariIni && o.pensiun <= lima; }).length;
    orang.forEach(function (o) {
      if (o.pensiun && o.pensiun <= dua && hariKe_(o.pensiun) >= -31) {
        var lewat = o.pensiun < H.hariIni;
        tambahIngat_(H, { jenis: 'pensiun', judul: 'Batas usia pensiun', tanggal: o.pensiun, tetap: lewat || undefined,
          ket: lewat ? 'Masih tercantum di daftar pegawai' : 'Siapkan usul pensiun dan berkasnya' }, { nama: o.nama, ket: o.jabatan });
      }
      if (o.lahir) {
        var ut = berikutnya_({ h: +o.lahir.slice(8, 10), b: +o.lahir.slice(5, 7) }, H.hariIni);
        if (hariKe_(ut) <= 7) tambahIngat_(H, { jenis: 'ultah', judul: 'Ulang tahun', tanggal: ut }, { nama: o.nama, ket: '' });
      }
    });

    // Pangkat/golongan dari tab yang punya kolom Pangkat/Gol (Daftar Pegawai TNT).
    var sumberGol = golLembar || (k.pangkat >= 0 ? { g: g, j: terbaik.j } : null);
    if (sumberGol) {
      var kg = sumberGol.j.kol, gol = [];
      for (var b = sumberGol.j.baris + 1; b < sumberGol.g.teks.length; b++) {
        var rr = sumberGol.g.teks[b];
        if (!namaPegawai_(barisPertama_(rr[kg.nama]))) continue;
        var kode = kodeGolongan_(rr[kg.pangkat]);
        if (kode) gol.push(kode);
      }
      if (sumberGol.g !== g) H.jumlahTab[sumberGol.g.nama] = sumberGol.g.teks.slice(sumberGol.j.baris + 1).filter(function (rr) { return namaPegawai_(barisPertama_(rr[kg.nama])) && (nipDari_(rr[kg.nip]) || String(rr[kg.jabatan] || '').trim()); }).length;
      P.golongan = hitungNilai_(gol, function (x) { return x; }).map(function (x) {
        var pns = x.nama.indexOf('/') > 0;
        return { nama: pns ? x.nama : x.nama + ' (PPPK)', n: x.n, _u: pns ? nilaiRomawi_(x.nama.split('/')[0]) * 10 + 'abcde'.indexOf(x.nama.slice(-1)) : 100 + nilaiRomawi_(x.nama) };
      }).sort(function (a, b) { return a._u - b._u; }).map(function (x) { return { nama: x.nama, n: x.n }; });
    }
  }

  /* ---------- Struktur Organisasi: sebaran per unit kerja ---------- */

  /** Tabel kecil di bawah sel judul: baris label lalu angka (L, P, jumlah). */
  function tabelLP_(g, i, c) {
    var T = g.teks, hasil = [], kosong = 0;
    for (var r = i + 1; r < Math.min(T.length, i + 30); r++) {
      var lab = String(T[r][c] || '').replace(/\s+/g, ' ').trim(), n = normal_(lab);
      if (!lab) { if (hasil.length && ++kosong >= 2) break; continue; }
      if (/^(sebaran|jumlah pegawai)/.test(n)) break;
      var angka = [];
      for (var cc = c + 1; cc <= c + 5 && angka.length < 3; cc++) { var v = angkaSel_(T[r][cc], g.nilai[r][cc]); if (v !== null) angka.push(v); }
      if (!angka.length) continue;
      if (/^(jumlah|total)$/.test(n)) break;
      hasil.push(angka.length >= 3 ? { nama: lab, l: angka[0], p: angka[1], n: angka[2] } : angka.length === 2 ? { nama: lab, l: angka[0], p: angka[1], n: angka[0] + angka[1] } : { nama: lab, n: angka[0] });
    }
    return hasil;
  }

  function olahStruktur_(H, g) {
    if (!g) return;
    var T = g.teks, unit = [], status = null, jabatan = null;
    for (var i = 0; i < T.length; i++) for (var c = 0; c < T[i].length; c++) {
      var s = normal_(T[i][c]);
      if (!s) continue;
      var m = /^sebaran pegawai\s+(.+)$/.exec(s);
      if (m && /^di\s/.test(m[1])) { status = tabelLP_(g, i, c).filter(function (x) { return /^(pns|cpns|pppk|p3k)$/.test(normal_(x.nama)); }); continue; }
      if (/^jumlah pegawai (berdasarkan|per|menurut) jabatan/.test(s)) { jabatan = tabelLP_(g, i, c); continue; }
      if (!m) continue;
      var u = { nama: String(T[i][c]).replace(/^\s*sebaran pegawai\s+/i, '').replace(/\s+/g, ' ').trim(), n: 0, l: 0, p: 0, pns: 0, cpns: 0, pppk: 0 }, ada = false;
      for (var r = i + 1; r < Math.min(T.length, i + 12); r++) {
        var lab = normal_(T[r][c]);
        if (/^sebaran/.test(lab)) break;
        var key = /^laki/.test(lab) ? 'l' : /^perempuan/.test(lab) ? 'p' : lab === 'pns' ? 'pns' : lab === 'cpns' ? 'cpns' : /^(pppk|p3k)$/.test(lab) ? 'pppk' : '';
        if (!key) continue;
        for (var cc = c + 1; cc <= c + 3; cc++) { var v = angkaSel_(T[r][cc], g.nilai[r][cc]); if (v !== null) { u[key] = v; ada = true; break; } }
      }
      u.n = (u.l + u.p) || (u.pns + u.cpns + u.pppk);
      if (ada && u.n) unit.push(u);
    }
    var P = H.pegawai;
    if (!P) {
      // Tanpa daftar pegawai: komposisi diambil dari tabel ringkas Struktur Organisasi.
      P = H.pegawai = { total: 0, sumber: g.nama };
      if (status && status.length) {
        P.status = status.map(function (x) { return { nama: normal_(x.nama) === 'p3k' ? 'PPPK' : x.nama.toUpperCase(), n: x.n, l: x.l || 0, p: x.p || 0 }; });
        P.total = P.status.reduce(function (a, x) { return a + x.n; }, 0);
        P.kelamin = { l: P.status.reduce(function (a, x) { return a + x.l; }, 0), p: P.status.reduce(function (a, x) { return a + x.p; }, 0) };
      }
      if (jabatan && jabatan.length) P.jabatan = jabatan.map(function (x) { return { nama: x.nama, n: x.n, l: x.l || 0, p: x.p || 0 }; });
    }
    if (unit.length) {
      if (!P.unit || !P.unit.length) { P.unit = unit; P.unitSumber = g.nama; }
      H.jumlahTab['Sebaran unit kerja (' + g.nama + ')'] = unit.reduce(function (a, u) { return a + u.n; }, 0);
    }
  }

  /* ---------- Peta Jabatan: bezetting dan kebutuhan ---------- */

  function angkaKanan_(g, r, c) {
    for (var cc = c + 1; cc < g.teks[r].length; cc++) { var v = angkaSel_(g.teks[r][cc], g.nilai[r][cc]); if (v !== null) return v; }
    return null;
  }
  function namaUnitPeta_(teks) {
    var s = normal_(teks), m = /seksi pengelolaan taman nasional wilayah\s+([ivx]+|\d+)/.exec(s);
    if (m) return 'SPTN Wilayah ' + m[1].toUpperCase();
    if (/^kepala balai/.test(s)) return 'Langsung di bawah Kepala Balai';
    m = /^kepala\s+(sub\s*bagian|subbag)\s+(.+)$/.exec(s);
    if (m) return 'Subbagian ' + hurufAwal_(m[2]);
    return hurufAwal_(s.replace(/^kepala\s+/, ''));
  }

  function olahPeta_(H, g) {
    if (!g) return;
    var T = g.teks, V = g.nilai, batas = T.length, blok = [], kepala = [], kepalaBalai = null, F = { sumber: g.nama };
    for (var i = 0; i < T.length; i++) for (var c = 0; c < T[i].length; c++) {
      var s = normal_(T[i][c]);
      if (!s) continue;
      if (/^b\s*:/.test(s)) { F.bezetting = angkaKanan_(g, i, c); batas = Math.min(batas, i); }
      else if (/^k\s*:/.test(s)) { F.kebutuhan = angkaKanan_(g, i, c); batas = Math.min(batas, i); }
      else if (s === 'nama jabatan') blok.push({ r: i, c: c, b: 0, k: 0 });
      else if (/^kepala\b/.test(s)) { kepala.push({ r: i, c: c, teks: T[i][c] }); if (/^kepala balai/.test(s) && !kepalaBalai) kepalaBalai = { r: i, c: c }; }
    }
    blok.forEach(function (b, x) {
      var dekat = kepala.filter(function (k) { return k.r < b.r && k.r >= b.r - 6 && k.c >= b.c - 4 && k.c <= b.c + 12; }).sort(function (p, q) { return q.r - p.r || Math.abs(p.c - b.c) - Math.abs(q.c - b.c); })[0];
      b.nama = dekat ? namaUnitPeta_(dekat.teks) : kepalaBalai && Math.abs(kepalaBalai.c - b.c) <= 4 ? 'Langsung di bawah Kepala Balai' : 'Kelompok jabatan ' + (x + 1);
    });
    var jabatan = [], lain = { nama: 'Pejabat struktural dan lainnya', b: 0, k: 0 };
    for (var r = 0; r < batas; r++) for (var c2 = 0; c2 < T[r].length; c2++) {
      var teks = String(T[r][c2] || '').replace(/\s+/g, ' ').trim(), n = normal_(teks);
      if (!teks || angkaSel_(teks, V[r][c2]) !== null || teks.length < 3) continue;
      if (/^(nama jabatan|kelas( jabatan)?\b|jumlah|total|sub ?total|no\.?$|b$|k$|\+\s*\/\s*-)/.test(n)) continue;
      var angka = [];
      for (var cc = c2 + 1; cc < Math.min(T[r].length, c2 + 17) && angka.length < 4; cc++) {
        var t = String(T[r][cc] || '').trim();
        if (!t) continue;
        var v = angkaSel_(t, V[r][cc]);
        if (v === null) { if (/^[-–—]$/.test(t)) { angka.push(null); continue; } break; }
        angka.push(v);
      }
      if (angka.length < 2 || angka[0] === null || angka[1] === null || angka[0] < 0 || angka[1] < 0 || angka[0] > 500 || angka[1] > 500) continue;
      var B = angka[0], K = angka[1], kelas = null;
      if (angka.length >= 4) kelas = angka[3];
      else if (angka.length === 3 && angka[2] !== null && Math.abs(angka[2]) !== Math.abs(B - K) && angka[2] >= 1 && angka[2] <= 17) kelas = angka[2];
      var milik = blok.filter(function (b) { return b.r < r && b.c <= c2 + 3; }).sort(function (p, q) { return q.c - p.c || q.r - p.r; })[0];
      var unit = milik || lain;
      unit.b += B; unit.k += K;
      jabatan.push({ nama: judulKalimat_(teks), unit: unit.nama, kelas: kelas !== null && kelas >= 1 && kelas <= 17 ? kelas : '', b: B, k: K });
    }
    if (!jabatan.length && F.bezetting == null) return;
    var jumlahB = jabatan.reduce(function (a, j) { return a + j.b; }, 0), jumlahK = jabatan.reduce(function (a, j) { return a + j.k; }, 0);
    if (F.bezetting == null) F.bezetting = jumlahB;
    if (F.kebutuhan == null) F.kebutuhan = jumlahK;
    if (F.bezetting > jumlahB) lain.b += F.bezetting - jumlahB;
    if (F.kebutuhan > jumlahK) lain.k += F.kebutuhan - jumlahK;
    F.unit = blok.filter(function (b) { return b.b || b.k; }).map(function (b) { return { nama: b.nama, b: b.b, k: b.k }; });
    if (lain.b || lain.k) F.unit.push({ nama: lain.nama, b: lain.b, k: lain.k });
    F.jabatan = jabatan;
    F.selisih = F.bezetting - F.kebutuhan;
    H.formasi = F;
    H.jumlahTab['Bezetting (' + g.nama + ')'] = F.bezetting;
  }

  /* ---------- Jadwal Kepegawaian: periode KP, uji kompetensi, batas usulan ---------- */

  function namaJadwal_(judul) {
    var s = normal_(judul).replace(/^jadwal\s*/, '').trim();
    if (/^kp\b|kenaikan pangkat/.test(s)) return 'Kenaikan pangkat';
    if (/^kj\b|kenaikan jenjang/.test(s)) return 'Kenaikan jenjang jabatan';
    if (/uji ?kom|uji kompetensi/.test(s)) return 'Uji kompetensi';
    if (/^kgb\b|berkala/.test(s)) return 'Kenaikan gaji berkala';
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Jadwal kepegawaian';
  }
  function judulLangkah_(h) {
    var s = normal_(h).replace(/^tanggal\s+/, '');
    if (/usulan unit kerja/.test(s)) return 'Usulan dari unit kerja';
    if (/sanggah/.test(s)) return 'Masa sanggah';
    if (/^batas (akhir )?usulan/.test(s)) return 'Batas usulan';
    if (/^batas akhir/.test(s)) return 'Batas akhir';
    var t = String(h || '').replace(/^\s*tanggal\s+/i, '').replace(/\s+/g, ' ').trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function olahJadwal_(H, g) {
    if (!g) return;
    var T = g.teks, V = g.nilai, kini = H.hariIni, bawah = geserHari_(kini, -31), atas = geserHari_(kini, 366), dekat = geserHari_(kini, 90);
    var tahun = +kini.slice(0, 4), blok = [], digeser = 0;
    for (var i = 0; i < T.length; i++) {
      var isi = T[i].map(function (x) { return String(x || '').trim(); }).filter(Boolean);
      if (isi.length && isi.length <= 2 && /^jadwal\b/i.test(isi[0])) blok.push({ r: i, judul: isi[0] });
    }
    if (!blok.length) blok.push({ r: -1, judul: g.nama });
    blok.forEach(function (b, x) {
      var akhir = x + 1 < blok.length ? blok[x + 1].r : T.length, h = -1, pL = -1;
      for (var r = b.r + 1; r < Math.min(akhir, b.r + 4) && h < 0; r++) for (var c = 0; c < T[r].length; c++) if (normal_(T[r][c]) === 'periode') { h = r; pL = c; break; }
      if (h < 0) return;
      var kel = namaJadwal_(b.judul), kepala = T[h].map(normal_), bukan = /days|hari|sisa/;
      var kolKiri = -1;
      for (var c1 = pL + 1; c1 <= pL + 3 && c1 < kepala.length; c1++) if (/tanggal|batas/.test(kepala[c1]) && !bukan.test(kepala[c1])) { kolKiri = c1; break; }
      var kanan = [];
      kepala.forEach(function (t, c) { if (c > (kolKiri >= 0 ? kolKiri : pL) + 1 && /usulan|verifikasi|sanggah|batas|pelaksanaan|pengumuman|seleksi|penetapan/.test(t) && !bukan.test(t)) kanan.push(c); });
      var kolPer = kanan.length ? kanan[0] - 1 : -1;
      for (var r2 = h + 1; r2 < akhir; r2++) {
        var per = String(T[r2][pL] || '').replace(/\s+/g, ' ').trim();
        // Bagian kiri: periode dengan tanggal batas akhir lengkap (bertahun).
        if (per && kolKiri >= 0) {
          var bt = tglPegawai_(T[r2][kolKiri], V[r2][kolKiri]);
          if (bt) {
            var gl = gulirTahun_(bt, bawah), hb = hariBulan_(per), label;
            if (gl.perkiraan) digeser++;
            label = hb ? tglPanjang_(berikutnya_(hb, geserHari_(gl.tanggal, 1))) : per;
            var langkahKiri = judulLangkah_(T[h][kolKiri]);
            if (gl.tanggal <= atas) tambahAgenda_(H, { judul: langkahKiri, kelompok: kel + ' periode ' + label, mulai: gl.tanggal, selesai: gl.tanggal, perkiraan: gl.perkiraan || undefined });
            if (gl.tanggal >= kini && gl.tanggal <= dekat) tambahIngat_(H, { jenis: 'jadwal', judul: kel + ' periode ' + label + ': ' + langkahKiri.toLowerCase(), tanggal: gl.tanggal,
              ket: gl.perkiraan ? 'Perkiraan dari jadwal tahun lalu' : '', perkiraan: gl.perkiraan || undefined });
          }
        }
        // Bagian kanan: periode tanpa tahun dengan rentang tiap tahap (usulan, verifikasi, sanggah).
        if (kolPer < 0) continue;
        var hbK = hariBulan_(T[r2][kolPer]);
        if (!hbK) continue;
        for (var y = tahun - 1; y <= tahun + 1; y++) {
          var tmt = tglHB_(y, hbK);
          kanan.forEach(function (c) {
            var w = rentangTanpaTahun_(T[r2][c]);
            if (!w) return;
            var mulai = sebelumAtau_(w.awal, tmt), selesai = berikutnya_(w.akhir, mulai);
            if (selesai < bawah || mulai > atas) return;
            var langkah = judulLangkah_(T[h][c]), periode = kel + ' periode ' + tglPanjang_(tmt);
            tambahAgenda_(H, { judul: langkah, kelompok: periode, mulai: mulai, selesai: selesai });
            if (/usulan|batas/i.test(langkah) && selesai >= kini && mulai <= dekat) {
              tambahIngat_(H, { jenis: 'jadwal', judul: periode + ': ' + langkah.charAt(0).toLowerCase() + langkah.slice(1), tanggal: mulai, sampai: selesai !== mulai ? selesai : undefined });
            }
          });
        }
      }
    });
    H.agendaTahun = tahun;
    if (digeser) H.catatanData.push(g.nama + ': ' + digeser + ' tanggal batas sudah lewat lebih dari sebulan, jadi tanggal tahun berikutnya diperkirakan (ditandai "perkiraan"). Perbarui tab ini bila jadwal baru sudah terbit.');
  }

  /* ---------- KGB dan berkas KGB ---------- */

  function pecahDokumen_(teks) {
    return String(teks || '').split(/[,;\n]|\s+dan\s+|&|\+/i).map(function (x) { return x.replace(/^[\s\-–•*\d.)]+/, '').replace(/\s+/g, ' ').trim(); })
      .filter(function (x) { return x && !/^(-|lengkap|sudah lengkap|tidak ada|nihil|ok)$/i.test(x); });
  }
  function adaIsi_(t) { var s = normal_(t); return !!s && !/^(-|–|belum|tidak|x|0)$/.test(s); }

  function olahKgb_(H, g, gDok) {
    var kini = H.hariIni, dekat = geserHari_(kini, 90), sudahAda = {};
    if (g) {
      var j = cariJudul_(g.teks, { nama: /^n\s*a\s*m\s*a\b/, 'gol?': /gol/, 'jabatan?': /jabatan/ });
      if (!j) throw new Error('judul kolom Nama tidak ditemukan di tab ' + g.nama);
      var T = g.teks, V = g.nilai, k = j.kol, baris = [];
      for (var i = j.baris + 1; i < T.length; i++) {
        var nama = namaPegawai_(barisPertama_(T[i][k.nama]));
        if (!nama || /^(nip\b|jumlah|total|catatan)/i.test(nama) || /^[\d.,\s]+$/.test(nama)) continue;
        baris.push({ i: i, nama: nama, gol: k.gol >= 0 ? (kodeGolongan_(T[i][k.gol]) || barisPertama_(T[i][k.gol])) : '' });
      }
      var lebar = Math.max.apply(null, T.map(function (b) { return b.length; })), kolTgl = [];
      for (var c = 0; c < lebar; c++) {
        if (c === k.nama || c === k.jabatan) continue;
        var n = baris.filter(function (b) { return hanyaTanggal_(T[b.i][c], V[b.i][c]); }).length;
        if (n && n >= baris.length * 0.5) kolTgl.push(c);
      }
      if (!kolTgl.length) throw new Error('kolom tanggal KGB tidak ditemukan di tab ' + g.nama);
      var kolBaru = kolTgl[kolTgl.length - 1], mTahun = /(20\d{2})/.exec(g.nama), tahun = mTahun ? +mTahun[1] : +kini.slice(0, 4);
      var bulan = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], total = 0;
      baris.forEach(function (b) {
        var baru = hanyaTanggal_(T[b.i][kolBaru], V[b.i][kolBaru]);
        if (!baru) return;
        total++;
        if (+baru.slice(0, 4) === tahun) bulan[+baru.slice(5, 7) - 1]++;
        sudahAda[kunciNama_(b.nama)] = baru;
        if (baru >= kini && baru <= dekat) tambahIngat_(H, { jenis: 'kgb', judul: 'Kenaikan gaji berkala', tanggal: baru, ket: 'Siapkan SK KGB' }, { nama: b.nama, ket: b.gol });
      });
      H.kgb = { tahun: tahun, total: total, bulan: bulan, sumber: g.nama };
    }
    if (gDok) {
      var jd = cariJudul_(gDok.teks, { nama: /^nama( lengkap)?$/, 'nip?': /^nip$/, 'terakhir?': /terakhir/, 'kurang?': /belum ada|kekurangan|belum lengkap/ });
      if (!jd) throw new Error('judul kolom Nama Lengkap tidak ditemukan di tab ' + gDok.nama);
      var D = gDok.teks, DV = gDok.nilai, kd = jd.kol, orang = [];
      for (var r = jd.baris + 1; r < D.length; r++) {
        var nm = namaPegawai_(barisPertama_(D[r][kd.nama]));
        if (nm && !/^(jumlah|total)/i.test(nm)) orang.push({ r: r, nama: nm });
      }
      var dipakai = {};
      Object.keys(kd).forEach(function (x) { if (kd[x] >= 0) dipakai[kd[x]] = 1; });
      var kolOk = -1, kolBulan = -1, lebarD = Math.max.apply(null, D.map(function (b) { return b.length; }));
      for (var c2 = 0; c2 < lebarD; c2++) {
        if (dipakai[c2]) continue;
        var isi = orang.map(function (o) { return normal_(D[o.r][c2]); }).filter(Boolean);
        if (!isi.length) continue;
        if (kolOk < 0 && isi.every(function (v) { return /^(ok|sudah|lengkap|v|✓)$/.test(v); })) kolOk = c2;
        else if (kolBulan < 0 && isi.length >= orang.length * 0.3 && isi.filter(function (v) { return /^[a-z]{3,9}\.?\s+\d{4}$/.test(v) && tglPegawai_(v); }).length >= isi.length * 0.8) kolBulan = c2;
      }
      var hasil = { total: orang.length, ok: 0, kurang: [], sumber: gDok.nama }, hitung = {}, tampil = {};
      orang.forEach(function (o) {
        if (kolOk >= 0 && normal_(D[o.r][kolOk])) hasil.ok++;
        var kurang = kd.kurang >= 0 ? pecahDokumen_(D[o.r][kd.kurang]) : [];
        var bln = kolBulan >= 0 ? tglPegawai_(D[o.r][kolBulan], DV[o.r][kolBulan]) : '';
        var kn = kunciNama_(o.nama);
        if (bln && !sudahAda[kn] && bln >= kini && bln <= dekat) tambahIngat_(H, { jenis: 'kgb', judul: 'Kenaikan gaji berkala', tanggal: bln, ket: 'Bulan KGB menurut tab ' + gDok.nama }, { nama: o.nama, ket: '' });
        if (!kurang.length) return;
        hasil.kurang.push({ nama: o.nama, ket: kurang.join(', ') });
        kurang.forEach(function (x) { var kk = normal_(x).replace(/[^a-z0-9 ]/g, '').trim(); hitung[kk] = (hitung[kk] || 0) + 1; if (!tampil[kk]) tampil[kk] = x.charAt(0).toUpperCase() + x.slice(1); });
        var kgb = sudahAda[kn] && sudahAda[kn] >= geserHari_(kini, -31) ? sudahAda[kn] : bln;
        if (kgb && kgb <= geserHari_(kini, 120) && kgb.slice(0, 7) >= kini.slice(0, 7)) {
          tambahIngat_(H, { jenis: 'kgb', judul: 'Berkas KGB belum lengkap menjelang KGB', tanggal: kgb, tetap: kgb < kini || undefined, ket: 'Lengkapi sebelum SK KGB diproses' }, { nama: o.nama, ket: kurang.join(', ') });
        } else {
          tambahIngat_(H, { jenis: 'kgb', judul: 'Berkas KGB belum lengkap', ket: 'Dari tab ' + gDok.nama }, { nama: o.nama, ket: kurang.join(', ') });
        }
      });
      hasil.jenis = Object.keys(hitung).map(function (x) { return { nama: tampil[x], n: hitung[x] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 10);
      H.dokKgb = hasil;
      H.jumlahTab[gDok.nama] = orang.length;
    }
  }

  /* ---------- PAK: angka kredit jabatan fungsional ---------- */

  var ROMAWI_ = ['', 'I', 'II', 'III', 'IV'];

  function olahPak_(H, g, gUnggah) {
    var kini = H.hariIni, dekat = geserHari_(kini, 90), atas = geserHari_(kini, 366);
    if (g) {
      var j = cariJudul_(g.teks, { nama: /^nama\b/, 'jabatan?': /jabatan/, 'pangkat?': /pangkat|gol/, 'ket?': /^keterangan|^ket\.?$/ });
      if (!j) throw new Error('judul kolom Nama tidak ditemukan di tab ' + g.nama);
      var T = g.teks, V = g.nilai, k = j.kol, calon = [];
      for (var i = j.baris + 1; i < T.length; i++) {
        var nama = namaPegawai_(barisPertama_(T[i][k.nama]));
        if (nama && !/^(angka kredit|jumlah|total|nip\b)/i.test(nama) && !/^[\d.,\s-]+$/.test(nama)) calon.push({ i: i, nama: nama });
      }
      var dari = Math.max(k.nama, k.jabatan, k.pangkat) + 1, sampai = k.ket >= 0 ? k.ket : T[j.baris].length, kolAngka = [];
      for (var c = dari; c < sampai; c++) {
        var n = calon.filter(function (o) { return angkaSel_(T[o.i][c], V[o.i][c]) !== null; }).length;
        if (n && n >= calon.length * 0.5) kolAngka.push(c);
      }
      var label = function (re) {
        for (var r = j.baris; r <= j.baris + 2 && r < T.length; r++) for (var x = 0; x < kolAngka.length; x++) if (re.test(normal_(T[r][kolAngka[x]]))) return kolAngka[x];
        return -1;
      };
      var kTotal = label(/^(total|jumlah)/), kKp = label(/\bkp\b|pangkat/), kKj = label(/\bkj\b|jenjang/);
      if (kolAngka.length >= 3) {
        if (kTotal < 0) kTotal = kolAngka[kolAngka.length - 3];
        if (kKp < 0) kKp = kolAngka[kolAngka.length - 2];
        if (kKj < 0) kKj = kolAngka[kolAngka.length - 1];
      }
      var orang = [];
      calon.forEach(function (o) {
        var kp = kKp >= 0 ? angkaSel_(T[o.i][kKp], V[o.i][kKp]) : null, kj = kKj >= 0 ? angkaSel_(T[o.i][kKj], V[o.i][kKj]) : null;
        var tot = kTotal >= 0 ? angkaSel_(T[o.i][kTotal], V[o.i][kTotal]) : null;
        if (kp === null && kj === null && tot === null) return;
        var ket = k.ket >= 0 ? String(T[o.i][k.ket] || '').replace(/\s+/g, ' ').trim() : '';
        orang.push({ nama: o.nama, kp: kp, kj: kj, total: tot, ket: ket });
        var nk = normal_(ket), mb = /batas usulan/.exec(nk);
        if (mb) {
          var tg = (nk.slice(mb.index).match(/\d{1,2}\s+[a-z]{3,9}\.?\s+\d{4}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}/g) || []).map(function (x) { return tglPegawai_(x); })
            .filter(function (x) { return x && x >= kini && x <= atas; }).sort()[0];
          if (tg) tambahIngat_(H, { jenis: 'pak', judul: 'Batas usulan kenaikan pangkat', tanggal: tg, ket: 'Menurut keterangan di tab ' + g.nama }, { nama: o.nama, ket: '' });
        }
        var mu = /uji ?kom|uji kompetensi/.test(nk) && /\(([^)]*\d{4}[^)]*)\)/.exec(ket);
        if (mu) {
          var rg = rentangPegawai_(mu[1]);
          if (rg.selesai && rg.selesai >= kini && rg.mulai <= atas) tambahIngat_(H, { jenis: 'pak', judul: 'Uji kompetensi', tanggal: rg.mulai, sampai: rg.selesai !== rg.mulai ? rg.selesai : undefined, ket: 'Kemungkinan diajukan, menurut keterangan di tab ' + g.nama }, { nama: o.nama, ket: '' });
        }
      });
      var kurang = orang.filter(function (o) { return o.kp !== null && o.kp < 0; }).sort(function (a, b) { return b.kp - a.kp; });
      H.pak = { total: orang.length, sumber: g.nama,
        cukupKp: orang.filter(function (o) { return o.kp !== null && o.kp >= 0; }).length, kurangKp: kurang.length,
        cukupKj: orang.filter(function (o) { return o.kj !== null && o.kj >= 0; }).length,
        siap: orang.filter(function (o) { return o.kp !== null && o.kp >= 0; }).map(function (o) { return o.nama; }),
        hampir: kurang.filter(function (o) { return o.kp >= -5; }).slice(0, 8).map(function (o) { return o.nama; }) };
      // Tenggat periode angka kredit (Triwulan 1-4, Final) di sisi tab PAK.
      var tenggat = {};
      for (var r = 0; r < T.length; r++) for (var c2 = 0; c2 < T[r].length; c2++) {
        var s = normal_(T[r][c2]), mt = /^(?:triwulan|tw)\s*(\d|i{1,3}|iv)$|^(final)$/.exec(s);
        if (!mt) continue;
        for (var cc = c2 + 1; cc <= c2 + 3 && cc < T[r].length; cc++) {
          var hb = hariBulan_(T[r][cc]);
          if (!hb) continue;
          var lab = mt[2] ? 'final' : 'Triwulan ' + (/^\d$/.test(mt[1]) ? ROMAWI_[+mt[1]] || mt[1] : mt[1].toUpperCase());
          var kunci = hb.b + '-' + hb.h;
          (tenggat[kunci] = tenggat[kunci] || { hb: hb, lab: [] }).lab.push(lab);
          break;
        }
      }
      Object.keys(tenggat).forEach(function (x) {
        var t = tenggat[x], tg = berikutnya_(t.hb, kini), judul = 'Tenggat angka kredit ' + t.lab.join(' dan ');
        tambahAgenda_(H, { judul: judul, kelompok: 'Penilaian angka kredit', mulai: tg, selesai: tg });
        if (tg <= dekat) tambahIngat_(H, { jenis: 'pak', judul: judul, tanggal: tg, ket: 'Kolom Periode di tab ' + g.nama });
      });
    }
    if (gUnggah) {
      var ju = cariJudul_(gUnggah.teks, { nama: /^nama\b/, 'simpeg?': /simpeg/, 'siasn?': /siasn/, 'fisik?': /hard ?file|fisik/ });
      if (!ju) return;
      var U = gUnggah.teks, ku = ju.kol, baris = [];
      for (var b = ju.baris + 1; b < U.length; b++) { var nm = namaPegawai_(barisPertama_(U[b][ku.nama])); if (nm && !/^(jumlah|total)/i.test(nm)) baris.push({ b: b, nama: nm }); }
      var unggah = [];
      [['simpeg', 'SIMPEG', 'PAK belum diunggah ke SIMPEG'], ['siasn', 'SIASN', 'PAK belum diunggah ke SIASN'], ['fisik', 'Berkas fisik', 'Berkas fisik PAK belum diserahkan']].forEach(function (x) {
        var c = ku[x[0]];
        if (c < 0) return;
        var sudah = baris.filter(function (o) { return adaIsi_(U[o.b][c]); });
        if (!sudah.length) return; // kolom belum dipakai
        unggah.push({ nama: x[1], n: sudah.length, total: baris.length });
        baris.filter(function (o) { return !adaIsi_(U[o.b][c]); }).forEach(function (o) {
          tambahIngat_(H, { jenis: 'pak', judul: x[2], ket: 'Dari tab ' + gUnggah.nama }, { nama: o.nama, ket: '' });
        });
      });
      if (!H.pak) H.pak = { total: 0 };
      H.pak.unggah = unggah;
    }
  }

  /* ---------- SKP per triwulan ---------- */

  function olahSkp_(H, g) {
    if (!g) return;
    var T = g.teks, j = cariJudul_(T, { nama: /^nama( lengkap)?$/ });
    if (!j) throw new Error('judul kolom Nama Lengkap tidak ditemukan di tab ' + g.nama);
    var kolTw = {}, kolUnggah = -1, kolFinal = -1, akhirJudul = j.baris;
    for (var r = j.baris; r <= j.baris + 2 && r < T.length; r++) T[r].forEach(function (t, c) {
      var s = normal_(t), m = /^(?:tw|triwulan)\s*(\d|i{1,3}|iv)$/.exec(s);
      if (m) {
        var n = /^\d$/.test(m[1]) ? +m[1] : ROMAWI_.indexOf(m[1].toUpperCase());
        if (n >= 1 && n <= 4 && kolTw[n] === undefined) { kolTw[n] = c; akhirJudul = Math.max(akhirJudul, r); }
      } else if (/upload|unggah/.test(s) && kolUnggah < 0) { kolUnggah = c; akhirJudul = Math.max(akhirJudul, r); }
      else if (/final/.test(s) && kolFinal < 0) kolFinal = c;
    });
    if (!Object.keys(kolTw).length) throw new Error('kolom TW 1-4 tidak ditemukan di tab ' + g.nama);
    var orang = [];
    for (var i = akhirJudul + 1; i < T.length; i++) {
      var nama = namaPegawai_(barisPertama_(T[i][j.kol.nama]));
      if (nama && !/^(jumlah|total)/i.test(nama)) orang.push({ i: i, nama: nama, unggah: kolUnggah >= 0 ? (normal_(T[i][kolUnggah]).match(/\d/g) || []).map(Number) : [] });
    }
    var mt = /(20\d{2})/.exec(g.nama), tahun = mt ? +mt[1] : +H.hariIni.slice(0, 4), kini = H.hariIni;
    var ok = function (t) { return /^(ok|sudah|v|✓|done|selesai|lengkap)\b/.test(normal_(t)); };
    var dipakaiUnggah = orang.some(function (o) { return o.unggah.length; });
    var K = { tahun: tahun, total: orang.length, tw: [], belum: [], sumber: g.nama };
    [1, 2, 3, 4].forEach(function (n) {
      var c = kolTw[n];
      if (c === undefined) return;
      var akhirTw = isoTgl_(tahun, n * 3, n === 1 || n === 4 ? 31 : 30), selesai = akhirTw < kini;
      var sudah = orang.filter(function (o) { return ok(T[o.i][c]); });
      var diunggah = orang.filter(function (o) { return o.unggah.indexOf(n) >= 0; });
      K.tw.push({ nama: 'Triwulan ' + ROMAWI_[n], ok: sudah.length, isi: orang.filter(function (o) { return normal_(T[o.i][c]); }).length, unggah: dipakaiUnggah ? diunggah.length : null, selesai: selesai });
      if (!selesai) return;
      var belum = orang.filter(function (o) { return !ok(T[o.i][c]); });
      if (belum.length) {
        K.belum.push({ nama: 'Triwulan ' + ROMAWI_[n], status: 'OK', orang: belum.map(function (o) { return o.nama; }) });
        belum.forEach(function (o) { tambahIngat_(H, { jenis: 'skp', judul: 'SKP Triwulan ' + ROMAWI_[n] + ' ' + tahun + ' belum OK', ket: 'Dari tab ' + g.nama }, { nama: o.nama, ket: '' }); });
      }
      if (dipakaiUnggah) sudah.filter(function (o) { return o.unggah.indexOf(n) < 0; }).forEach(function (o) {
        tambahIngat_(H, { jenis: 'skp', judul: 'SKP Triwulan ' + ROMAWI_[n] + ' ' + tahun + ' sudah OK, belum diunggah ke SIMPEG', ket: 'Kolom unggah di tab ' + g.nama }, { nama: o.nama, ket: '' });
      });
    });
    if (kolFinal >= 0) {
      var isiFinal = orang.filter(function (o) { return normal_(T[o.i][kolFinal]); }).length;
      if (isiFinal) K.tw.push({ nama: 'SKP dan nilai akhir', ok: orang.filter(function (o) { return ok(T[o.i][kolFinal]); }).length, isi: isiFinal, unggah: null, selesai: false });
    }
    H.skp = K;
    H.jumlahTab[g.nama] = orang.length;
  }

  /* ---------- Kelengkapan dokumen ---------- */

  var PETA_DOKUMEN_ = { akte: 'Akte kelahiran', akta: 'Akte kelahiran', aktekelahiran: 'Akte kelahiran', askes: 'Askes/BPJS', bpjs: 'Askes/BPJS', ktp: 'KTP', npwp: 'NPWP',
    taspen: 'Taspen', kk: 'Kartu keluarga', kartukeluarga: 'Kartu keluarga', karpeg: 'Kartu pegawai', sii: 'Ijazah S2', s2: 'Ijazah S2', si: 'Ijazah S1', s1: 'Ijazah S1',
    siii: 'Ijazah S3', s3: 'Ijazah S3', diii: 'Ijazah D3', d3: 'Ijazah D3', div: 'Ijazah D4', d4: 'Ijazah D4', sma: 'Ijazah SMA', smk: 'Ijazah SMK', slta: 'Ijazah SLTA',
    smp: 'Ijazah SMP', sltp: 'Ijazah SLTP', sd: 'Ijazah SD', akad: 'Akta nikah', aktanikah: 'Akta nikah', bukunikah: 'Akta nikah', foto: 'Pas foto' };
  function labelDokumen_(grup, dok) {
    var g = normal_(grup), d = normal_(dok).replace(/[^a-z0-9]/g, '');
    var lab = PETA_DOKUMEN_[d] || (d ? hurufAwal_(dok) : /foto/.test(g) ? 'Pas foto' : hurufAwal_(grup));
    if (/anak/.test(g)) return lab + ' anak';
    if (/pasangan|istri|suami/.test(g) && !/nikah/i.test(lab)) return lab + ' pasangan';
    return lab;
  }

  function olahDokumen_(H, g) {
    if (!g) return;
    var T = g.teks, j = cariJudul_(T, { nama: /^nama\b/ });
    if (!j) throw new Error('judul kolom Nama tidak ditemukan di tab ' + g.nama);
    var rGrup = -1;
    for (var r = Math.max(0, j.baris - 1); r <= j.baris + 2 && r < T.length && rGrup < 0; r++) {
      if (T[r].filter(function (t) { return /^(foto|dokumen pokok|ijazah|pasangan|anak|keluarga)$/.test(normal_(t)); }).length >= 2) rGrup = r;
    }
    if (rGrup < 0) rGrup = j.baris;
    var rDok = rGrup + 1, rAnak = rGrup + 2 < T.length && T[rGrup + 2].some(function (t) { return /^anak\s*\d/.test(normal_(t)); }) ? rGrup + 2 : -1;
    var mulai = Math.max(j.baris, rAnak >= 0 ? rAnak : rDok) + 1, kol = [], grup = '', dok = '';
    for (var c = j.kol.nama + 1; c < T[rGrup].length; c++) {
      var tg = String(T[rGrup][c] || '').trim(), td = String((T[rDok] || [])[c] || '').trim(), ta = rAnak >= 0 ? String(T[rAnak][c] || '').trim() : '';
      if (!tg && !td && !ta) continue;
      if (tg) { grup = tg; dok = ''; }
      if (td) dok = td;
      if (/^(nip|no\.?|keterangan|ket)$/i.test(tg || td)) continue;
      kol.push({ c: c, label: labelDokumen_(grup, dok), anak: ta });
    }
    var jenis = {}, urut = [], orang = [], lengkap = 0;
    for (var i = mulai; i < T.length; i++) {
      var nama = namaPegawai_(barisPertama_(T[i][j.kol.nama]));
      if (!nama || /^(jumlah|total)/i.test(nama)) continue;
      var kurang = [], ada = false;
      kol.forEach(function (k) {
        var v = normal_(T[i][k.c]);
        if (!v) return;
        var sudah = /^(sudah|ada|ok|v|✓|lengkap)/.test(v), belum = /^(belum|tidak|x$)/.test(v);
        if (!sudah && !belum) return;
        ada = true;
        if (!jenis[k.label]) { jenis[k.label] = { nama: k.label, sudah: 0, belum: 0 }; urut.push(k.label); }
        jenis[k.label][sudah ? 'sudah' : 'belum']++;
        if (belum) kurang.push(k.anak ? k.label.replace(/ anak$/, '') + ' ' + k.anak.toLowerCase() : k.label);
      });
      if (!ada) continue;
      orang.push(nama);
      if (!kurang.length) { lengkap++; continue; }
      var ket = kurang.length > 6 ? kurang.slice(0, 6).join(', ') + ', dan ' + (kurang.length - 6) + ' lainnya' : kurang.join(', ');
      tambahIngat_(H, { jenis: 'dokumen', judul: 'Dokumen kepegawaian belum lengkap', ket: 'Dari tab ' + g.nama }, { nama: nama, ket: ket });
    }
    H.dokumen = { total: orang.length, lengkap: lengkap, jenis: urut.map(function (x) { return jenis[x]; }), sumber: g.nama };
    H.jumlahTab[g.nama] = orang.length;
  }

  /* ---------- Cuti ---------- */

  /** Tanggal cuti dari teks bebas di kolom bulan: "25-26 Mei", "29-30 Jun, 1-2 Jul", "1 - 28 Feb". */
  function rentangCuti_(teks, tahun, bulan) {
    var hasil = [];
    String(teks || '').split(/[,;\n]|\s+dan\s+/).forEach(function (seg) {
      var s = normal_(seg);
      if (!/\d/.test(s)) return;
      if (!/[a-z]{3}/.test(s.replace(/\bs\s*\/\s*d\b|\bs\.\s*d\.?|\bsd\b|\bsampai\b|\bhingga\b/g, ''))) s += ' ' + NAMA_BULAN[bulan - 1].toLowerCase();
      if (!/\d{4}/.test(s)) s += ' ' + tahun;
      var r = rentangPegawai_(s);
      if (r.mulai && r.selesai && r.mulai <= r.selesai) hasil.push(r);
    });
    return hasil;
  }

  function olahCuti_(H, g) {
    if (!g) return;
    var T = g.teks, V = g.nilai, j = cariJudul_(T, { nama: /^nama( lengkap)?$/, 'nip?': /^nip$/, 'ket?': /^keterangan/ });
    if (!j) throw new Error('judul kolom Nama tidak ditemukan di tab ' + g.nama);
    var h = j.baris, k = j.kol, kepala = T[h].map(normal_), kini = H.hariIni;
    var mt = /(20\d{2})/.exec(g.nama), tahun = mt ? +mt[1] : +kini.slice(0, 4);
    var kolJenis = [];
    kepala.forEach(function (t, c) { if (c > Math.max(k.nama, k.nip) && /cuti|izin/.test(t) && !/sisa/.test(t)) kolJenis.push(c); });
    // Kolom bulan: dari nama bulan di sekitar baris judul, atau 12 kolom antara NIP dan kolom jenis cuti pertama.
    var kolBulan = {};
    for (var r = Math.max(0, h - 2); r <= h + 1 && r < T.length; r++) T[r].forEach(function (t, c) { var b = BULAN_ID[normal_(t)]; if (b && kolBulan[b] === undefined) kolBulan[b] = c; });
    var awal = Math.max(k.nama, k.nip) + 1;
    if (Object.keys(kolBulan).length < 12 && kolJenis.length && kolJenis[0] - awal === 12) { kolBulan = {}; for (var b = 1; b <= 12; b++) kolBulan[b] = awal + b - 1; }
    if (Object.keys(kolBulan).length < 12) throw new Error('12 kolom bulan tidak dikenali di tab ' + g.nama);
    var kolBln = Object.keys(kolBulan).map(function (b) { return kolBulan[b]; }), terakhirJenis = kolJenis.length ? kolJenis[kolJenis.length - 1] : kolBulan[12];
    var batasKanan = k.ket >= 0 ? k.ket : T[h].length;
    var orang = [], orangIni = null;
    for (var i = h + 1; i < T.length; i++) {
      var nama = namaPegawai_(barisPertama_(T[i][k.nama]));
      if (nama && /^(jumlah|total)/i.test(nama)) continue;
      if (nama) { orangIni = { i: i, nama: nama, bulan: [], jenis: {}, rentang: [], angkaKanan: [] }; orang.push(orangIni); }
      if (!orangIni) continue;
      for (var b2 = 1; b2 <= 12; b2++) {
        var c = kolBulan[b2], t = String(T[i][c] || '').trim(), v = angkaSel_(t, V[i][c]);
        if (v !== null) { if (nama) orangIni.bulan[b2 - 1] = v; }
        else if (t) orangIni.rentang = orangIni.rentang.concat(rentangCuti_(t, tahun, b2));
      }
      if (!nama) continue;
      kolJenis.forEach(function (c) { var v2 = angkaSel_(T[i][c], V[i][c]); if (v2) orangIni.jenis[c] = v2; });
      for (var c3 = terakhirJenis + 1; c3 < batasKanan; c3++) orangIni.angkaKanan.push(angkaSel_(T[i][c3], V[i][c3]));
    }
    if (!orang.length) return;
    // Kolom sisa: kolom angka terakhir sebelum Keterangan, bila cocok dengan rumus total - terpakai.
    var kolSisa = -1, cocok = 0, diuji = 0;
    orang.forEach(function (o) {
      var a = o.angkaKanan.filter(function (x) { return x !== null; });
      if (a.length < 3) return;
      diuji++;
      if (Math.abs(a[a.length - 1] - (a[a.length - 3] - a[a.length - 2])) < 0.01) cocok++;
    });
    if (diuji && cocok >= diuji * 0.7) kolSisa = 1;
    var C = { tahun: tahun, total: 0, bulan: [], jenis: [], sisa: [], sumber: g.nama };
    for (var m = 0; m < 12; m++) C.bulan.push({ n: orang.reduce(function (a, o) { return a + (o.bulan[m] || 0); }, 0) });
    var tahunan = C.bulan.reduce(function (a, x) { return a + x.n; }, 0);
    C.jenis.push({ nama: 'Cuti tahunan', hari: tahunan, orang: orang.filter(function (o) { return o.bulan.some(function (x) { return x > 0; }); }).length });
    kolJenis.forEach(function (c) {
      var hari = orang.reduce(function (a, o) { return a + (o.jenis[c] || 0); }, 0);
      var nm = String(T[h][c]).replace(/\s+/g, ' ').trim();
      if (hari > 0) C.jenis.push({ nama: nm.charAt(0).toUpperCase() + nm.slice(1).toLowerCase(), hari: hari, orang: orang.filter(function (o) { return o.jenis[c] > 0; }).length });
    });
    C.total = C.jenis.reduce(function (a, x) { return a + x.hari; }, 0);
    if (kolSisa > 0) {
      var sisa = orang.map(function (o) { var a = o.angkaKanan.filter(function (x) { return x !== null; }); return { nama: o.nama, sisa: a.length >= 3 ? a[a.length - 1] : null }; })
        .filter(function (x) { return x.sisa !== null && x.sisa > 0; }).sort(function (a, b) { return b.sisa - a.sisa; });
      C.sisa = sisa.slice(0, 10);
      if (tahun === +kini.slice(0, 4) && +kini.slice(5, 7) >= 10) sisa.filter(function (x) { return x.sisa > 6; }).forEach(function (x) {
        tambahIngat_(H, { jenis: 'cuti', judul: 'Sisa cuti tahunan ' + tahun + ' masih lebih dari 6 hari', tanggal: tahun + '-12-31', ket: 'Ingatkan untuk diambil sebelum akhir tahun' }, { nama: x.nama, ket: x.sisa + ' hari' });
      });
    }
    var dekat = geserHari_(kini, 14);
    orang.forEach(function (o) {
      o.rentang.forEach(function (rg) {
        if (rg.selesai >= kini && rg.mulai <= dekat) tambahIngat_(H, { jenis: 'cuti', judul: 'Pegawai cuti', tanggal: rg.mulai, sampai: rg.selesai !== rg.mulai ? rg.selesai : undefined }, { nama: o.nama, ket: '' });
      });
    });
    H.cuti = C;
    H.jumlahTab[g.nama] = orang.length;
  }

  /* ---------- Pelatihan ---------- */

  function olahPelatihan_(H, g) {
    if (!g) return;
    var T = g.teks, V = g.nilai, kini = H.hariIni;
    var j = cariJudul_(T, { nama: /^nama( lengkap| pegawai)?$/, pel: /^(nama )?(pelatihan|diklat|kegiatan)/, 'tgl?': /^(tanggal|tgl|waktu|pelaksanaan)/ });
    if (!j) throw new Error('judul kolom Nama dan Nama Pelatihan tidak ditemukan di tab ' + g.nama);
    var k = j.kol, grup = {}, urut = [], total = 0;
    for (var i = j.baris + 1; i < T.length; i++) {
      var nama = namaPegawai_(barisPertama_(T[i][k.nama])), pel = String(T[i][k.pel] || '').replace(/\s+/g, ' ').trim();
      if (!nama || !pel) continue;
      total++;
      var kk = normal_(pel);
      if (!grup[kk]) {
        var teksTgl = k.tgl >= 0 ? String(T[i][k.tgl] || '').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim() : '';
        var rg = teksTgl ? rentangPegawai_(teksTgl, V[i][k.tgl]) : { mulai: '', selesai: '' }, th = /(20\d{2})/.exec(teksTgl);
        grup[kk] = { nama: pel, peserta: 0, tanggal: teksTgl, mulai: rg.mulai || '', selesai: rg.selesai || '', tahun: rg.mulai ? +rg.mulai.slice(0, 4) : th ? +th[1] : null, orang: [] };
        urut.push(kk);
      }
      grup[kk].peserta++;
      grup[kk].orang.push(nama);
    }
    var daftar = urut.map(function (x) { return grup[x]; });
    var dekat = geserHari_(kini, 60), hitungTahun = {};
    daftar.forEach(function (d) {
      if (d.tahun) hitungTahun[d.tahun] = (hitungTahun[d.tahun] || 0) + d.peserta;
      if (d.mulai && d.selesai >= kini && d.mulai <= dekat) d.orang.forEach(function (o) {
        tambahIngat_(H, { jenis: 'pelatihan', judul: d.nama, tanggal: d.mulai, sampai: d.selesai !== d.mulai ? d.selesai : undefined, ket: 'Peserta menurut tab ' + g.nama }, { nama: o, ket: '' });
      });
    });
    daftar.sort(function (a, b) { return (b.mulai || String(b.tahun || '')).localeCompare(a.mulai || String(a.tahun || '')) || b.peserta - a.peserta; });
    var tahunList = Object.keys(hitungTahun).sort();
    H.pelatihan = { total: total, tahun: tahunList.length ? (tahunList.length > 1 ? tahunList[0] + '–' + tahunList[tahunList.length - 1] : tahunList[0]) : '', sumber: g.nama,
      daftar: daftar.map(function (d) { return { nama: d.nama, peserta: d.peserta, tanggal: d.tanggal, mulai: d.mulai, selesai: d.selesai }; }) };
  }

  /* ---------- Indeks Profesionalitas ASN (hanya rata-rata, tanpa nilai per orang) ---------- */

  var DIMENSI_IPASN_ = [{ nama: 'Kualifikasi', maks: 25, re: /kualifikasi/ }, { nama: 'Kompetensi', maks: 40, re: /kompetensi/ }, { nama: 'Kinerja', maks: 30, re: /kinerja/ }, { nama: 'Disiplin', maks: 5, re: /disiplin/ }];
  var KATEGORI_IPASN_ = [{ nama: 'Sangat tinggi', min: 91 }, { nama: 'Tinggi', min: 81 }, { nama: 'Sedang', min: 71 }, { nama: 'Rendah', min: 61 }, { nama: 'Sangat rendah', min: -1 }];

  function olahIpasn_(H, g) {
    if (!g) return;
    var T = g.teks, V = g.nilai, j = cariJudul_(T, { nama: /^nama\b/, 'jenis?': /jenis jabatan|^jabatan$/ });
    if (!j) throw new Error('judul kolom Nama tidak ditemukan di tab ' + g.nama);
    var k = j.kol, baris = [];
    for (var i = j.baris + 1; i < T.length; i++) { var nm = namaPegawai_(barisPertama_(T[i][k.nama])); if (nm && !/^(jumlah|total|rata)/i.test(nm)) baris.push(i); }
    if (!baris.length) return;
    var lebar = Math.max.apply(null, T.map(function (b) { return b.length; })), kolAngka = [], kolTahun = -1, kolTgl = -1;
    for (var c = Math.max(k.nama, k.jenis) + 1; c < lebar; c++) {
      var nAngka = 0, nTahun = 0, nTgl = 0;
      baris.forEach(function (r) {
        var v = angkaSel_(T[r][c], V[r][c]);
        if (hanyaTanggal_(T[r][c], V[r][c])) nTgl++;
        else if (v !== null && v >= 2015 && v <= 2035 && Math.round(v) === v) nTahun++;
        else if (v !== null) nAngka++;
      });
      if (nTgl >= baris.length * 0.5) { if (kolTgl < 0) kolTgl = c; }
      else if (nTahun >= baris.length * 0.5) { if (kolTahun < 0) kolTahun = c; }
      else if (nAngka >= baris.length * 0.5) kolAngka.push(c);
    }
    var kepalaKol = function (c) { var t = []; for (var r = Math.max(0, j.baris - 1); r <= j.baris + 1 && r < T.length; r++) t.push(normal_(T[r][c])); return t.join(' '); };
    var dim = DIMENSI_IPASN_.map(function (d, x) {
      var c = kolAngka.filter(function (kc) { return d.re.test(kepalaKol(kc)); })[0];
      return { nama: d.nama, maks: d.maks, c: c !== undefined ? c : kolAngka[x] };
    });
    var kolTotal = kolAngka.filter(function (kc) { return /total|jumlah|indeks|nilai ip|ip ?asn/.test(kepalaKol(kc)); })[0];
    if (kolTotal === undefined && kolAngka.length >= 5) kolTotal = kolAngka[4];
    var sah = dim.every(function (d) { return d.c !== undefined && baris.every(function (r) { var v = angkaSel_(T[r][d.c], V[r][d.c]); return v === null || v <= d.maks + 0.01; }); });
    var nilai = [], jenis = {}, tahun = {}, tanggal = '';
    baris.forEach(function (r) {
      var t = kolTotal !== undefined ? angkaSel_(T[r][kolTotal], V[r][kolTotal]) : null;
      if (t === null && sah) {
        var bagian = dim.map(function (d) { return angkaSel_(T[r][d.c], V[r][d.c]); });
        if (bagian.every(function (x) { return x !== null; })) t = bagian.reduce(function (a, b) { return a + b; }, 0);
      }
      if (t === null || t < 0 || t > 100) return;
      nilai.push({ r: r, t: t });
      var jn = k.jenis >= 0 ? String(T[r][k.jenis] || '').replace(/\s+/g, ' ').trim() : '';
      if (jn) (jenis[jn] = jenis[jn] || []).push(t);
      if (kolTahun >= 0) { var y = angkaSel_(T[r][kolTahun], V[r][kolTahun]); if (y) tahun[y] = (tahun[y] || 0) + 1; }
      if (kolTgl >= 0) { var tg = hanyaTanggal_(T[r][kolTgl], V[r][kolTgl]); if (tg > tanggal) tanggal = tg; }
    });
    if (!nilai.length) return;
    var rerata = rerata_(nilai.map(function (x) { return x.t; }));
    var kategori = function (v) { return KATEGORI_IPASN_.filter(function (x) { return v >= x.min; })[0].nama; };
    var I = { n: nilai.length, rerata: rerata, kategoriRerata: kategori(rerata), tanggal: tanggal, sumber: g.nama,
      tahun: Object.keys(tahun).sort(function (a, b) { return tahun[b] - tahun[a]; })[0] || '',
      kategori: KATEGORI_IPASN_.map(function (x) { return { nama: x.nama + (x.min > 0 ? ' (' + x.min + (x.min === 91 ? '–100' : '–' + (x.min + 9)) + ')' : ' (≤ 60)'), n: nilai.filter(function (v) { return kategori(v.t) === x.nama; }).length }; }),
      perJenis: Object.keys(jenis).map(function (x) { return { nama: x, n: jenis[x].length, rerata: rerata_(jenis[x]) }; }).sort(function (a, b) { return b.n - a.n; }) };
    if (sah) I.dimensi = dim.map(function (d) {
      var v = nilai.map(function (x) { return angkaSel_(T[x.r][d.c], V[x.r][d.c]); }).filter(function (x) { return x !== null; });
      return { nama: d.nama, maks: d.maks, nilai: rerata_(v) };
    });
    H.ipasn = I;
  }

  /* ---------- Laporan kendala presensi Sikadir (jawaban formulir) ---------- */

  function olahSikadir_(H, g) {
    if (!g) return;
    var T = g.teks, V = g.nilai;
    var j = cariJudul_(T, { nama: /^nama/, 'waktu?': /^(timestamp|cap waktu|stempel waktu|waktu)/, 'tgl?': /^(tanggal|tgl|hari)/, 'sesuai?': /penyesuaian|disesuaikan/, 'berkas?': /berkas|fisik/, 'ket?': /^keterangan/ });
    if (!j) throw new Error('judul kolom Nama tidak ditemukan di tab ' + g.nama);
    var k = j.kol, lap = [];
    for (var i = j.baris + 1; i < T.length; i++) {
      var nama = namaPegawai_(barisPertama_(T[i][k.nama]));
      if (!nama) continue;
      var tg = k.tgl >= 0 ? tglPegawai_(T[i][k.tgl], V[i][k.tgl]) : '';
      if (!tg && k.waktu >= 0) tg = tglPegawai_(T[i][k.waktu], V[i][k.waktu]);
      lap.push({ nama: nama, tgl: tg, sesuai: k.sesuai >= 0 ? normal_(T[i][k.sesuai]) : '', berkas: k.berkas >= 0 ? normal_(T[i][k.berkas]) : '', ket: k.ket >= 0 ? normal_(T[i][k.ket]) : '' });
    }
    if (!lap.length) return;
    var bulan = {};
    lap.forEach(function (x) { if (x.tgl) { var b = x.tgl.slice(0, 7); bulan[b] = (bulan[b] || 0) + 1; } });
    var pakaiSesuai = lap.some(function (x) { return x.sesuai; }), pakaiBerkas = lap.some(function (x) { return x.berkas; });
    var status = function (x) { return /^sudah|^selesai|^ok/.test(x.sesuai) ? 'Sudah disesuaikan' : /double|ganda/.test(x.sesuai) ? 'Double input' : x.sesuai ? x.sesuai.charAt(0).toUpperCase() + x.sesuai.slice(1) : x.ket ? 'Ada keterangan' : 'Belum ditindaklanjuti'; };
    var Z = { total: lap.length, sumber: g.nama, bulan: Object.keys(bulan).sort().map(function (b) { return { bulan: b, n: bulan[b] }; }) };
    if (pakaiSesuai) Z.jenis = hitungNilai_(lap, status);
    var tunda = function (saring, judul) {
      var per = {}, urut = [];
      lap.filter(saring).forEach(function (x) { var kk = kunciNama_(x.nama); if (!per[kk]) { per[kk] = { nama: x.nama, tgl: [] }; urut.push(kk); } if (x.tgl) per[kk].tgl.push(x.tgl); });
      urut.forEach(function (kk) {
        var o = per[kk];
        tambahIngat_(H, { jenis: 'presensi', judul: judul, ket: 'Dari tab ' + g.nama }, { nama: o.nama, ket: o.tgl.length ? 'kendala ' + o.tgl.sort().map(function (t) { return +t.slice(8, 10) + '/' + +t.slice(5, 7); }).join(', ') : '' });
      });
      return urut.length;
    };
    if (pakaiSesuai) Z.belumSesuai = tunda(function (x) { return !x.sesuai && !x.ket; }, 'Laporan kendala Sikadir belum disesuaikan');
    if (pakaiBerkas) Z.belumBerkas = tunda(function (x) { return !x.berkas; }, 'Berkas fisik laporan kendala Sikadir belum diserahkan');
    H.sikadir = Z;
  }

  /* ---------- Aplikasi Kepegawaian: laman, peraturan, pengumuman ---------- */

  function olahAplikasi_(H, sh) {
    if (!sh) return;
    var rg = sh.getDataRange(), T = rg.getDisplayValues(), R = null;
    try { R = rg.getRichTextValues(); } catch (e) { R = null; }
    var tautanSel = function (r, c) {
      if (r >= T.length || c < 0 || c >= T[r].length) return '';
      var t = String(T[r][c] || '').trim();
      if (/^https?:\/\/\S+$/i.test(t)) return t;
      var rt = R && R[r] && R[r][c];
      if (!rt) return '';
      var u = rt.getLinkUrl && rt.getLinkUrl();
      if (u) return u;
      var runs = rt.getRuns ? rt.getRuns() : [];
      for (var i = 0; i < runs.length; i++) { var lu = runs[i].getLinkUrl(); if (lu) return lu; }
      return '';
    };
    var judulBagian = /^(daftar laman|laman|daftar aplikasi|aplikasi|daftar peraturan|peraturan|pengumuman)$/;
    var cari = function (re) { for (var r = 0; r < T.length; r++) for (var c = 0; c < T[r].length; c++) if (re.test(normal_(T[r][c]))) return { r: r, c: c }; return null; };
    var baris = function (awal, fn) {
      var kosong = 0;
      for (var r = awal.r + 1; r < T.length; r++) {
        var t = String(T[r][awal.c] || '').trim();
        if (!t) { if (++kosong >= 2) break; continue; }
        kosong = 0;
        if (judulBagian.test(normal_(t))) break;
        fn(r, t.replace(/\s+/g, ' '));
      }
    };
    var host = function (u) { var m = /^https?:\/\/(?:www\.)?([^\/?#]+)/i.exec(u); return m ? m[1] : ''; };
    var laman = cari(/^(daftar laman|laman|daftar aplikasi)$/), atur = cari(/^(daftar peraturan|peraturan)$/), umum = cari(/^pengumuman$/);
    H.tautan = [];
    if (laman) baris(laman, function (r, t) {
      var u = tautanSel(r, laman.c + 1) || tautanSel(r, laman.c);
      if (u) H.tautan.push({ kelompok: 'Aplikasi kepegawaian', judul: t, url: u, ket: host(u) });
    });
    if (atur) {
      var kp = T[atur.r].map(normal_), kBaru = kp.findIndex(function (x) { return /terbaru|perubahan|berlaku/.test(x); }),
        kLama = kp.findIndex(function (x) { return /sebelum/.test(x); }), kMateri = kp.findIndex(function (x) { return /^(materi|bahan)/.test(x); });
      H.peraturan = [];
      baris(atur, function (r, t) {
        var p = { topik: t, terbaru: kBaru >= 0 ? String(T[r][kBaru] || '').replace(/\s+/g, ' ').trim() : '', sebelumnya: kLama >= 0 ? String(T[r][kLama] || '').replace(/\s+/g, ' ').trim() : '',
          materi: kMateri >= 0 ? String(T[r][kMateri] || '').replace(/\s+/g, ' ').trim() : '', url: tautanSel(r, kBaru), urlMateri: tautanSel(r, kMateri) };
        if (p.terbaru || p.sebelumnya || p.materi) H.peraturan.push(p);
      });
    }
    if (umum) {
      var kLink = T[umum.r].map(normal_).findIndex(function (x, c) { return c > umum.c && /link|file|berkas|tautan/.test(x); });
      H.pengumuman = [];
      baris(umum, function (r, t) {
        var berkas = kLink >= 0 ? String(T[r][kLink] || '').replace(/\s+/g, ' ').trim() : '';
        H.pengumuman.push({ judul: judulKalimat_(String(T[r][umum.c]).split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean).join(' ')),
          berkas: /^https?:/i.test(berkas) ? '' : berkas, url: tautanSel(r, kLink) || tautanSel(r, umum.c) });
      });
    }
  }

  /* ---------- penutup: urutan, jumlah, catatan data ---------- */

  function rapikanKepegawaian_(H) {
    var bersih = function (x) { Object.keys(x).forEach(function (k) { if (x[k] === undefined || x[k] === '' || x[k] === null) delete x[k]; }); };
    H.pengingat.forEach(function (x) { if (x.orang && x.orang.length) x.jumlah = x.orang.length; else delete x.orang; bersih(x); });
    H.pengingat.sort(function (a, b) { var p = a.tanggal || '9999', q = b.tanggal || '9999'; return p < q ? -1 : p > q ? 1 : String(a.judul).localeCompare(String(b.judul)); });
    H.agenda.forEach(bersih);
    H.agenda.sort(function (a, b) { return a.mulai < b.mulai ? -1 : a.mulai > b.mulai ? 1 : String(a.judul).localeCompare(String(b.judul)); });
    var kunci = Object.keys(H.jumlahTab), nilai = kunci.map(function (k) { return H.jumlahTab[k]; }).filter(function (v) { return v > 0; });
    if (nilai.length > 1 && Math.max.apply(null, nilai) !== Math.min.apply(null, nilai)) {
      H.catatanData.unshift('Jumlah pegawai berbeda antar-tab: ' + kunci.map(function (k) { return k + ' ' + H.jumlahTab[k]; }).join(', ') + '. Angka di tiap bagian mengikuti tab sumbernya.');
    }
  }

  /* ---------- pengolahan semua tab ---------- */

  function olahDariLembar_(lembar) {
    ZONA_HR_ = ZONA;
    var H = { versi: 2, diolah: new Date().toISOString(), hariIni: hariIni_(), lembar: lembar.length,
      peringatan: [], catatanData: [], pengingat: [], agenda: [], jumlahTab: {} };
    var grid = {};
    var bacaSh = function (sh) { var n = sh.getName(); if (!grid[n]) grid[n] = gridLembar_(sh); return grid[n]; };
    var baca = function (pola, bertahun) { var sh = cariLembarPegawai_(lembar, pola, bertahun); return sh ? bacaSh(sh) : null; };
    var langkah = function (label, fn) {
      try { fn(); } catch (e) { console.error(label, e); H.peringatan.push(label + ': ' + (e && e.message || e)); }
    };
    langkah('Daftar pegawai', function () { olahDaftarPegawai_(H, lembar, bacaSh); });
    langkah('Struktur Organisasi', function () { olahStruktur_(H, baca(/^struktur organisasi|^struktur\b/)); });
    langkah('Peta Jabatan', function () { olahPeta_(H, baca(/^peta jabatan/, true)); });
    langkah('Jadwal Kepegawaian', function () { olahJadwal_(H, baca(/^jadwal/)); });
    langkah('KGB', function () { olahKgb_(H, baca(/^kgb\b/, true), baca(/^belum upload dok/)); });
    langkah('PAK', function () { olahPak_(H, baca(/^pak\b/), baca(/^upload pak/)); });
    langkah('SKP', function () { olahSkp_(H, baca(/^skp\b/, true)); });
    langkah('Kelengkapan Dokumen', function () { olahDokumen_(H, baca(/^kelengkapan dok/)); });
    langkah('Cuti', function () { olahCuti_(H, baca(/^cuti\b/, true)); });
    langkah('Pelatihan', function () { olahPelatihan_(H, baca(/^pelatihan/)); });
    langkah('Nilai IPASN', function () { olahIpasn_(H, baca(/ipasn/)); });
    langkah('Kendala Sikadir', function () { olahSikadir_(H, baca(/kendala sikadir|^sikadir/)); });
    langkah('Aplikasi Kepegawaian', function () { olahAplikasi_(H, cariLembarPegawai_(lembar, /^aplikasi|^daftar laman/)); });
    langkah('Ringkasan', function () { rapikanKepegawaian_(H); });
    delete H._ingat; delete H._agenda;
    return H;
  }

  /* ---------- membaca tab lewat gviz ---------- */

  var KUNCI_SIMPAN = 'sdt-pegawai-v1', LAMA_SIMPAN = 10 * 60 * 1000, BATAS_WAKTU = 30000;

  function bacaCsv(teks) {
    var baris = [], sel = '', row = [], kutip = false, i, c;
    teks = String(teks || '').replace(/^﻿/, '');
    for (i = 0; i < teks.length; i++) {
      c = teks[i];
      if (kutip) {
        if (c === '"') { if (teks[i + 1] === '"') { sel += '"'; i++; } else kutip = false; }
        else sel += c;
      } else if (c === '"') kutip = true;
      else if (c === ',') { row.push(sel); sel = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && teks[i + 1] === '\n') i++;
        row.push(sel); baris.push(row); row = []; sel = '';
      } else sel += c;
    }
    if (sel !== '' || row.length) { row.push(sel); baris.push(row); }
    var lebar = 0;
    baris.forEach(function (r) { if (r.length > lebar) lebar = r.length; });
    baris.forEach(function (r) { while (r.length < lebar) r.push(''); });
    return baris;
  }

  /** Tab hasil gviz dibungkus seperti lembar Apps Script, agar pengolahan di atas bisa dipakai apa adanya. */
  function lembarCsv(nama, teks) {
    var g = bacaCsv(teks);
    if (!g.length) g = [['']];
    var salin = function () { return g.map(function (r) { return r.slice(); }); };
    return { getName: function () { return nama; },
      getDataRange: function () { return { getDisplayValues: salin, getValues: salin, getRichTextValues: function () { return null; } }; } };
  }

  function idSheet(link) {
    var s = String(link || '').trim(), m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    return /^[a-zA-Z0-9_-]{20,}$/.test(s) ? s : '';
  }
  function alamatTab(id, nama, kepala) {
    return 'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:csv&headers=' + (kepala ? 1 : 0) +
      (nama ? '&sheet=' + encodeURIComponent(nama) : '');
  }
  function ambilTeks(url) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, BATAS_WAKTU) : null;
    return fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined }).then(function (r) {
      if (t) clearTimeout(t);
      if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
      return r.text();
    }, function (e) {
      if (t) clearTimeout(t);
      throw new Error(e && e.name === 'AbortError' ? 'Google terlalu lama menjawab.' : 'Tidak tersambung ke Google. Periksa koneksi internet.');
    });
  }
  // Jawaban gviz yang bukan CSV (halaman masuk Google, galat kueri).
  function bukanCsv(teks) { return /^\s*(<!doctype|<html|google\.visualization|\/\*o_o\*\/)/i.test(teks); }

  /** Nama tab yang dicoba, berurutan. Tab bertahun mencoba tahun berjalan dulu, lalu tahun-tahun sebelumnya. */
  function daftarTab(tahun) {
    var th = function (awalan) {
      var out = [];
      for (var y = tahun; y >= tahun - 3; y--) awalan.forEach(function (a) { out.push(a + y); });
      return out;
    };
    return [
      ['sheet1', 'Sheet1'],
      ['Daftar Pegawai TNT', 'Daftar Pegawai', 'Data Pegawai'],
      ['Struktur Organisasi'],
      th(['Peta Jabatan Revisi ', 'Peta Jabatan ']),
      ['Jadwal Kepegawaian', 'Jadwal'],
      th(['KGB ']),
      ['Belum Upload DOk KGB', 'Belum Upload Dok KGB'],
      ['PAK'],
      ['Upload PAK SIMPEG'],
      th(['SKP ']),
      ['Kelengkapan Dokumen'],
      th(['Cuti ']),
      ['Pelatihan'],
      ['Nilai IPASN', 'IPASN'],
      ['Bukti kendala Sikadir', 'Kendala Sikadir'],
      ['Aplikasi Kepegawaian', 'Aplikasi', 'Daftar Laman']
    ];
  }

  /**
   * Membaca semua tab yang dikenal. gviz tidak bisa mendaftar nama tab, jadi tiap kelompok dicoba satu per satu.
   * Untuk nama tab yang tidak ada, gviz biasanya mengembalikan tab paling kiri. Jawabannya untuk nama yang pasti
   * tidak ada dipakai sebagai pembanding: tab yang jawabannya sama dengan itu dianggap tidak ada.
   */
  function bacaSemua(id) {
    var acak = 'sdt-tidak-ada-' + Date.now().toString(36);
    return Promise.all([
      ambilTeks(alamatTab(id, '')),
      ambilTeks(alamatTab(id, acak)).then(function (t) { return bukanCsv(t) ? null : t; },
        function (e) { return e && e.status ? null : undefined; })
    ]).then(function (awal) {
      var pertama = awal[0], hilang = awal[1] === undefined ? pertama : awal[1];
      if (bukanCsv(pertama)) throw new Error('Spreadsheet DE-BORA tidak bisa dibuka tanpa login Google.');
      var tahun = Number(hariIni_().slice(0, 4));
      var kelompok = daftarTab(tahun);
      return Promise.all(kelompok.map(function (calon, urutan) {
        var coba = function (i) {
          if (i >= calon.length) return Promise.resolve(null);
          return ambilTeks(alamatTab(id, calon[i])).then(function (teks) {
            if (bukanCsv(teks) || (urutan > 0 && hilang !== null && teks === hilang)) return coba(i + 1);
            return { nama: calon[i], teks: teks };
          }, function (e) {
            if (e && e.status) return coba(i + 1);
            throw e;
          });
        };
        return coba(0);
      })).then(function (hasil) {
        var lembar = [], ada = {}, tidakAda = [], catatan = [];
        hasil.forEach(function (h, urutan) {
          if (!h) {
            if (urutan > 0) tidakAda.push(String(kelompok[urutan][0]).replace(/\s*\d{4}$/, ' ' + tahun).trim());
            return;
          }
          if (ada[h.nama]) return;
          ada[h.nama] = 1;
          lembar.push({ sh: lembarCsv(h.nama, h.teks), nama: h.nama });
        });
        if (tidakAda.length) {
          catatan.push('Tab tidak ditemukan: ' + tidakAda.join(', ') + '. Bila namanya diubah, kembalikan ke nama semula (tab bertahun boleh tahun berjalan atau sebelumnya).');
        }
        // Tab paling kiri tidak bisa dibedakan dari tab yang tidak ada, kecuali tab itu sheet1.
        if (hilang === pertama && hasil[0] && hasil[0].teks !== pertama) {
          catatan.push('Tab paling kiri di DE-BORA bukan lagi "sheet1". Lewat link, isi tab paling kiri tidak bisa dibedakan dari tab yang tidak ada, jadi bisa terlewat. Kembalikan tab "sheet1" ke posisi paling kiri.');
        }
        return { lembar: lembar, catatan: catatan };
      });
    });
  }

  /* ---------- link DE-BORA dari Pengaturan ---------- */

  function dariPengaturan(rows) {
    var v = '';
    (rows || []).forEach(function (r) {
      var k = String(r.kunci || '').trim().toLowerCase();
      if (!v && (k === 'kepegawaian' || k === 'spreadsheet_kepegawaian' || k === 'de-bora')) v = idSheet(r.nilai);
    });
    return v;
  }
  function pengaturanCsv(teks) {
    var g = bacaCsv(teks);
    if (!g.length) return [];
    var kepala = g[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var ik = kepala.indexOf('kunci'), iv = kepala.indexOf('nilai');
    if (ik < 0 || iv < 0) return [];
    return g.slice(1).map(function (r) { return { kunci: r[ik], nilai: r[iv] }; });
  }
  function cariId() {
    var S = window.SUMBER || {};
    var langsung = idSheet(S.KEPEGAWAIAN);
    if (langsung) return Promise.resolve(langsung);
    var konten = idSheet(S.GOOGLE_SHEETS);
    try {
      var o = JSON.parse(localStorage.getItem('sdt-konten-v1'));
      var simpan = o && o.id === konten && o.data ? dariPengaturan(o.data.Pengaturan) : '';
      if (simpan) return Promise.resolve(simpan);
    } catch (e) { /* tanpa salinan konten */ }
    if (!konten) return Promise.reject(kosong());
    return ambilTeks(alamatTab(konten, 'Pengaturan', true)).then(function (teks) {
      var v = dariPengaturan(pengaturanCsv(teks));
      if (!v) throw kosong();
      return v;
    });
  }
  function kosong() {
    var e = new Error('Link spreadsheet DE-BORA belum diisi. Tambahkan baris dengan kunci "kepegawaian" dan link DE-BORA di tab Pengaturan Sheet konten.');
    e.belumDiatur = true;
    return e;
  }

  /* ---------- simpanan sementara dan pintu masuk ---------- */

  function bacaSimpanan(id) {
    try {
      var o = JSON.parse(sessionStorage.getItem(KUNCI_SIMPAN));
      return o && o.id === id && o.data && Date.now() - o.waktu < LAMA_SIMPAN ? o.data : null;
    } catch (e) { return null; }
  }
  function simpan(id, data) {
    try { sessionStorage.setItem(KUNCI_SIMPAN, JSON.stringify({ id: id, waktu: Date.now(), data: data })); } catch (e) { /* tanpa penyimpanan */ }
  }

  var berjalan = null;
  window.DataPegawai = {
    /** Hasil olahan DE-BORA: { id, data }. opsi.segarkan membaca ulang dari Google. */
    ambil: function (opsi) {
      var segar = !!(opsi && opsi.segarkan);
      if (berjalan && !segar) return berjalan;
      var janji = cariId().then(function (id) {
        var ada = segar ? null : bacaSimpanan(id);
        if (ada) return { id: id, data: ada };
        return bacaSemua(id).then(function (baca) {
          if (!baca.lembar.length) throw new Error('Tidak ada tab DE-BORA yang terbaca.');
          var data = olahDariLembar_(baca.lembar);
          data.peringatan = baca.catatan.concat(data.peringatan || []);
          simpan(id, data);
          return { id: id, data: data };
        });
      });
      berjalan = janji;
      var lepas = function () { if (berjalan === janji) berjalan = null; };
      janji.then(lepas, lepas);
      return janji;
    },
    /** Hapus hasil olahan dari perangkat (dipanggil saat keluar). */
    hapus: function () {
      berjalan = null;
      try { sessionStorage.removeItem(KUNCI_SIMPAN); } catch (e) { /* tanpa penyimpanan */ }
    },
    // Untuk pengujian.
    _olah: function (tab) { return olahDariLembar_(tab.map(function (t) { return { sh: lembarCsv(t.nama, t.teks), nama: t.nama }; })); },
    _daftarTab: daftarTab,
    _tgl: tglPegawai_,
    _rentang: rentangPegawai_
  };
})();
