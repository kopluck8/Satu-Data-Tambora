/* Kepegawaian De-Bora: ringkasan data pegawai dan pengingat tenggat dari spreadsheet DE-BORA bagian Kepegawaian.
   Data tidak disimpan di repo. Halaman meminta data ke layanan Tanya Data (Apps Script, aksi "kepegawaian")
   dengan token sesi login, jadi hanya pegawai yang sudah masuk yang menerima datanya. */
(function () {
  'use strict';

  var URL_API = ((window.SUMBER || {}).TANYA_DATA || '').trim();
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var BULAN3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var IKON = {
    orang: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c.6-3.3 2.8-5.2 5.5-5.2s4.9 1.9 5.5 5.2"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.3c2.6-.2 4.5 1.4 4.9 4.4"/>',
    kalender: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    jam: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    awas: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17h.01"/>',
    centang: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.2 2.5 2.5 4.9-5"/>',
    daftar: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
    naik: '<path d="M4 17.5 10 11.5l3.5 3.5L20 8.5"/><path d="M14.5 8.5H20V14"/>',
    pensiun: '<path d="M4 20.5h16"/><path d="M6 20.5v-6.5a6 6 0 0 1 12 0v6.5"/><path d="M12 8V3.5M9.5 5.5h5"/>',
    dokumen: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
    map: '<path d="M3 6.5a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    koper: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3.5 12.5h17"/>',
    kue: '<path d="M4 20.5h16M5.5 20.5v-6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6"/><path d="M5.5 16c1.2 1 2.4 1 3.6 0s2.4-1 3.6 0 2.4 1 3.6 0 1.6-.8 2.2-.4"/><path d="M12 12.5V9M12 6.5c-.8-.8-.8-1.8 0-3 .8 1.2.8 2.2 0 3z"/>',
    topi: '<path d="m2.5 9.5 9.5-4.5 9.5 4.5-9.5 4.5z"/><path d="M6.5 11.5v4.5c3.3 2.2 7.7 2.2 11 0v-4.5M21.5 9.5V15"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    grafik: '<path d="M3.5 20h17"/><path d="M6.5 20v-7M12 20V5M17.5 20v-10"/>',
    struktur: '<rect x="9" y="3.5" width="6" height="4.5" rx="1"/><rect x="3" y="16" width="6" height="4.5" rx="1"/><rect x="15" y="16" width="6" height="4.5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
    tautan: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    luar: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18.5 14v4.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5H10"/>',
    timbang: '<path d="M12 4v16M7 20h10M4.5 7.5h15"/><path d="m4.5 7.5-2.5 6a2.5 2.5 0 0 0 5 0zM19.5 7.5l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
    sidik: '<path d="M7.5 5.5a8 8 0 0 1 11.5 7v2.5"/><path d="M5 9a8 8 0 0 0-.5 3v3"/><path d="M8.5 19.5c.6-1.6 1-3.4 1-5.5v-1.5a2.5 2.5 0 0 1 5 0V14c0 2.5-.4 4.6-1.2 6.4"/><path d="M17.5 18.5c.3-1.3.5-2.8.5-4.5"/>'
  };
  var JENIS = {
    jadwal: { nama: 'Jadwal', ikon: 'kalender' },
    kgb: { nama: 'KGB', ikon: 'naik' },
    pensiun: { nama: 'Pensiun', ikon: 'pensiun' },
    pak: { nama: 'PAK', ikon: 'dokumen' },
    skp: { nama: 'SKP', ikon: 'target' },
    dokumen: { nama: 'Dokumen', ikon: 'map' },
    cuti: { nama: 'Cuti', ikon: 'koper' },
    pelatihan: { nama: 'Pelatihan', ikon: 'topi' },
    ultah: { nama: 'Ulang tahun', ikon: 'kue' },
    presensi: { nama: 'Presensi', ikon: 'sidik' },
    lain: { nama: 'Lainnya', ikon: 'info' }
  };
  var GRUP = [
    { id: 'lewat', judul: 'Sudah lewat, perlu dicek' },
    { id: 'pekan', judul: 'Hari ini dan 7 hari ke depan' },
    { id: 'bulan', judul: '30 hari ke depan' },
    { id: 'triwulan', judul: 'Tiga bulan ke depan' },
    { id: 'jauh', judul: 'Lebih jauh' },
    { id: 'tindak', judul: 'Perlu dilengkapi', ket: 'tanpa tanggal tenggat' }
  ];
  var TAMPIL_NAMA = 6;
  var S = { d: null, peran: '', saring: 'semua', nomor: 0 };

  /* ---------- utilitas ---------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(x, d) {
    if (x == null || x === '' || isNaN(x)) return '–';
    return Number(x).toLocaleString('id-ID', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }
  function persen(a, b, d) { return b ? fmt(a / b * 100, d == null ? 0 : d) + '%' : '–'; }
  function ikon(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IKON[n] || IKON.info) + '</svg>'; }
  function urai(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }
  function tgl(iso, pendek) {
    var t = urai(iso);
    if (!t) return '–';
    return t.d + ' ' + (pendek ? BULAN3 : BULAN)[t.m - 1] + ' ' + t.y;
  }
  function rentang(a, b) {
    var x = urai(a), y = urai(b);
    if (!x) return '–';
    if (!y || a === b) return tgl(a, true);
    if (x.y === y.y && x.m === y.m) return x.d + '–' + y.d + ' ' + BULAN3[y.m - 1] + ' ' + y.y;
    if (x.y === y.y) return x.d + ' ' + BULAN3[x.m - 1] + ' – ' + y.d + ' ' + BULAN3[y.m - 1] + ' ' + y.y;
    return tgl(a, true) + ' – ' + tgl(b, true);
  }
  function hariIniUtc() { var n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); }
  function selisih(iso) {
    var t = urai(iso);
    return t ? Math.round((Date.UTC(t.y, t.m - 1, t.d) - hariIniUtc()) / 864e5) : null;
  }
  // Waktu olah selalu dalam WITA (sama dengan hub), apa pun zona waktu perangkatnya.
  function waktuOlah(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    try {
      return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }) + ' WITA';
    } catch (e) {
      return d.getDate() + ' ' + BULAN3[d.getMonth()] + ' ' + d.getFullYear() + ', ' + ('0' + d.getHours()).slice(-2) + '.' + ('0' + d.getMinutes()).slice(-2);
    }
  }
  function jumlah(arr, k) { return (arr || []).reduce(function (s, x) { return s + (Number(k ? x[k] : x) || 0); }, 0); }
  function namaOrang(o) { return typeof o === 'string' ? { nama: o, ket: '' } : { nama: o.nama || '', ket: o.ket || '' }; }

  function bagian(id, no, judul, isi, ket) {
    return '<section class="bagian" id="' + id + '"><div class="bagian-kepala"><span class="bagian-no">' + no + '</span><h2>' + judul + '</h2>' +
      (ket ? '<p>' + ket + '</p>' : '') + '</div>' + isi + '</section>';
  }
  function kartu(judul, isi, ik, kanan, kelas) {
    return '<div class="kartu ' + (kelas || '') + '"><div class="kartu-judul">' + (ik ? ikon(ik) : '') + '<span>' + judul + '</span>' +
      (kanan ? '<span class="kanan">' + kanan + '</span>' : '') + '</div>' + isi + '</div>';
  }
  function kosong(teks) { return '<p class="bagian-kosong">' + esc(teks) + '</p>'; }
  function lipat(judul, tabel) { return '<details class="lipat"><summary>' + judul + '</summary><div class="tabel-wadah">' + tabel + '</div></details>'; }
  function daftarNama(judul, orang) {
    if (!orang || !orang.length) return '';
    return '<details class="nama-lipat"><summary>' + judul + '</summary><div class="chip-deret">' +
      orang.map(function (o) { o = namaOrang(o); return '<span class="chip">' + esc(o.nama) + (o.ket ? ' <i>' + esc(o.ket) + '</i>' : '') + '</span>'; }).join('') + '</div></details>';
  }

  /* ---------- komponen grafik ---------- */
  // Batang mendatar satu warna, nilai di ujung kanan.
  function batang(rows, opsi) {
    opsi = opsi || {};
    rows = (rows || []).filter(function (r) { return r && r.n > 0; });
    if (!rows.length) return '<p class="redup kecil">Belum ada data.</p>';
    var maks = opsi.maks || Math.max.apply(null, rows.map(function (r) { return r.n; }));
    var total = opsi.total;
    return '<ul class="batang' + (opsi.padat ? ' batang--padat' : '') + '">' + rows.map(function (r) {
      var tip = '<b>' + esc(r.nama) + '</b>' + fmt(r.n) + ' ' + (opsi.satuan || 'pegawai') + (total ? ' (' + persen(r.n, total, 1) + ')' : '');
      return '<li data-tip="' + esc(tip) + '"><span class="nm" title="' + esc(r.nama) + '">' + esc(r.nama) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span>' +
        '<span class="jalur"><i style="width:' + Math.max(1.5, r.n / maks * 100).toFixed(2) + '%"></i></span><span class="nl">' + fmt(r.n) + '</span></li>';
    }).join('') + '</ul>';
  }

  // Batang bertumpuk laki-laki/perempuan atau kategori lain (urutan warna tetap).
  function tumpuk(rows, seri) {
    var maks = Math.max.apply(null, rows.map(function (r) { return r.n; }).concat([1]));
    return '<ul class="tumpuk-daftar">' + rows.map(function (r) {
      var seg = seri.map(function (s, i) {
        var v = r[s.k] || 0;
        if (!v) return '';
        return '<i class="k' + (i + 1) + '" style="flex-grow:' + v + '" data-tip="' + esc('<b>' + r.nama + ' · ' + s.nama + '</b>' + v + ' pegawai (' + persen(v, r.n, 1) + ')') + '"></i>';
      }).join('');
      var label = seri.map(function (s) { return s.nama + ' ' + (r[s.k] || 0); }).join(', ');
      return '<li class="tumpuk-baris"><span class="nm">' + esc(r.nama) + '</span>' +
        '<span class="tumpuk-jalur"><span class="tumpuk" style="width:' + (r.n / maks * 100).toFixed(2) + '%" role="img" aria-label="' + esc(r.nama + ': ' + label) + '">' + seg + '</span></span>' +
        '<span class="nl">' + fmt(r.n) + '<small>' + seri.map(function (s) { return s.singkat + ' ' + (r[s.k] || 0); }).join(' · ') + '</small></span></li>';
    }).join('') + '</ul>' +
      '<div class="legenda">' + seri.map(function (s, i) { return '<span><i class="k' + (i + 1) + '"></i>' + esc(s.nama) + '</span>'; }).join('') + '</div>';
  }

  // Kolom tegak (histogram kecil). Ujung atas membulat 4px, dasar rata.
  function kolom(rows, opsi) {
    opsi = opsi || {};
    rows = rows || [];
    if (!jumlah(rows, 'n')) return '<p class="redup kecil">Belum ada data.</p>';
    var lebarK = opsi.lebarKolom || 46, gap = 10, tinggi = opsi.tinggi || 150, atas = 18, bawah = 24;
    var w = rows.length * (lebarK + gap) - gap, maks = Math.max.apply(null, rows.map(function (r) { return r.n; }));
    var skala = function (v) { return v / maks * (tinggi - atas - bawah); };
    var s = '<svg viewBox="0 0 ' + w + ' ' + tinggi + '" style="max-width:' + Math.round(w * 1.35) + 'px" role="img" aria-label="' + esc(opsi.label || '') + '">';
    s += '<line class="dasar" x1="0" x2="' + w + '" y1="' + (tinggi - bawah) + '" y2="' + (tinggi - bawah) + '"/>';
    rows.forEach(function (r, i) {
      var x = i * (lebarK + gap), h = skala(r.n), y = tinggi - bawah - h, rr = Math.min(4, h, lebarK / 2);
      var tip = '<b>' + esc(r.nama) + '</b>' + fmt(r.n) + ' ' + (opsi.satuan || 'pegawai') + (opsi.total ? ' (' + persen(r.n, opsi.total, 1) + ')' : '');
      s += '<g class="k">' + (r.n ? '<path class="isi' + (r.sorot ? ' sorot' : '') + '" d="M' + x + ' ' + (tinggi - bawah) + 'V' + (y + rr) + 'Q' + x + ' ' + y + ' ' + (x + rr) + ' ' + y +
        'H' + (x + lebarK - rr) + 'Q' + (x + lebarK) + ' ' + y + ' ' + (x + lebarK) + ' ' + (y + rr) + 'V' + (tinggi - bawah) + 'Z"/>' : '') +
        (r.n ? '<text class="nilai" x="' + (x + lebarK / 2) + '" y="' + (y - 5) + '" text-anchor="middle">' + fmt(r.n) + '</text>' : '') +
        '<text x="' + (x + lebarK / 2) + '" y="' + (tinggi - 7) + '" text-anchor="middle">' + esc(r.label || r.nama) + '</text>' +
        '<rect class="hit" x="' + (x - gap / 2) + '" y="0" width="' + (lebarK + gap) + '" height="' + tinggi + '" data-tip="' + esc(tip) + '"/></g>';
    });
    return '<div class="kolom-grafik">' + s + '</svg></div>';
  }

  // Peluru: jalur putus-putus = kebutuhan, isi = terisi.
  function peluru(rows) {
    var maks = Math.max.apply(null, rows.map(function (r) { return Math.max(r.k || 0, r.b || 0); }).concat([1]));
    return '<ul class="peluru">' + rows.map(function (r) {
      var kurang = (r.k || 0) - (r.b || 0);
      var tip = '<b>' + esc(r.nama) + '</b>Terisi ' + fmt(r.b) + ' dari kebutuhan ' + fmt(r.k) + (kurang > 0 ? ' · kurang ' + fmt(kurang) : kurang < 0 ? ' · lebih ' + fmt(-kurang) : ' · pas');
      return '<li data-tip="' + esc(tip) + '"><span class="nm">' + esc(r.nama) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span>' +
        '<span class="jalur" role="img" aria-label="' + esc(r.nama + ': terisi ' + r.b + ' dari ' + r.k) + '"><span class="butuh" style="width:' + ((r.k || 0) / maks * 100).toFixed(2) + '%"></span>' +
        '<span class="isi" style="width:' + Math.max(1, (r.b || 0) / maks * 100).toFixed(2) + '%"></span></span>' +
        '<span class="nl">' + fmt(r.b) + ' / ' + fmt(r.k) + '<small>' + (kurang > 0 ? 'kurang ' + fmt(kurang) : kurang < 0 ? 'lebih ' + fmt(-kurang) : 'terpenuhi') + '</small></span></li>';
    }).join('') + '</ul>' +
      '<div class="legenda"><span><i class="isi"></i>Terisi (bezetting)</span><span><i class="butuh"></i>Kebutuhan</span></div>';
  }

  function meter(rows) {
    return '<ul class="meter-daftar">' + rows.map(function (r) {
      var p = r.total ? r.n / r.total * 100 : 0;
      return '<li><span class="nm">' + esc(r.nama) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span>' +
        '<span class="nl">' + persen(r.n, r.total) + '<small>' + fmt(r.n) + ' dari ' + fmt(r.total) + '</small></span>' +
        '<span class="meter-jalur" role="img" aria-label="' + esc(r.nama + ' ' + persen(r.n, r.total)) + '"><i class="' + (p < 100 ? 'sebagian' : '') + '" style="width:' + Math.min(100, p).toFixed(1) + '%"></i></span></li>';
    }).join('') + '</ul>';
  }

  /* ---------- tenggat ---------- */
  function tenggat(x) {
    if (!x.tanggal) return { grup: 'tindak', t: 'tanpa', label: x.label || 'Perlu ditindaklanjuti', ik: 'daftar' };
    var h0 = selisih(x.tanggal), h1 = x.sampai ? selisih(x.sampai) : h0, grup;
    if (h1 < 0) return { grup: 'lewat', t: 'kritis', label: 'Lewat ' + (-h1) + ' hari', ik: 'awas', hari: h1 };
    if (x.sampai && h0 <= 0) {
      grup = h1 <= 7 ? 'pekan' : h1 <= 30 ? 'bulan' : h1 <= 90 ? 'triwulan' : 'jauh';
      return { grup: grup, t: h1 <= 7 ? 'serius' : 'berlangsung', label: h1 === 0 ? 'Berakhir hari ini' : 'Berakhir ' + h1 + ' hari lagi', ik: 'jam', hari: h1, berlangsung: true };
    }
    // rentang yang belum dimulai dihitung dari tanggal mulainya
    var awal = x.sampai ? 'Mulai ' : '';
    if (h0 === 0) return { grup: 'pekan', t: 'kritis', label: 'Hari ini', ik: 'awas', hari: 0 };
    if (h0 === 1) return { grup: 'pekan', t: 'serius', label: awal ? 'Mulai besok' : 'Besok', ik: 'jam', hari: 1 };
    if (h0 <= 7) return { grup: 'pekan', t: 'serius', label: awal + h0 + ' hari lagi', ik: 'jam', hari: h0 };
    if (h0 <= 30) return { grup: 'bulan', t: 'waspada', label: awal + h0 + ' hari lagi', ik: 'jam', hari: h0 };
    if (h0 <= 90) return { grup: 'triwulan', t: 'dekat', label: awal + h0 + ' hari lagi', ik: 'kalender', hari: h0 };
    var bln = Math.round(h0 / 30.4);
    return { grup: 'jauh', t: 'jauh', label: awal + (bln >= 12 ? '± ' + fmt(h0 / 365, 1) + ' tahun lagi' : '± ' + bln + ' bulan lagi'), ik: 'kalender', hari: h0 };
  }
  function lencanaTenggat(g) { return '<span class="hitung" data-t="' + g.t + '">' + ikon(g.ik) + g.label + '</span>'; }

  function kotakTanggal(x, g) {
    var j = JENIS[x.jenis] || JENIS.lain;
    var t = urai(g.berlangsung ? x.sampai : x.tanggal);
    if (!t) return '<div class="ingat-tgl" aria-hidden="true">' + ikon(j.ikon) + '</div>';
    var tahunLain = t.y !== new Date().getFullYear();
    return '<div class="ingat-tgl" aria-hidden="true"><b>' + t.d + '</b><span>' + BULAN3[t.m - 1] + '</span>' + (tahunLain ? '<small>' + t.y + '</small>' : '') + '</div>';
  }

  function itemIngat(x, i) {
    var g = tenggat(x), j = JENIS[x.jenis] || JENIS.lain;
    var orang = (x.orang || []).map(namaOrang);
    var ket = [j.nama + (x.kelompok ? ' · ' + x.kelompok : '')];
    if (x.tanggal) ket.push(x.sampai ? rentang(x.tanggal, x.sampai) : tgl(x.tanggal));
    if (x.ket) ket.push(x.ket);
    var nama = '';
    if (orang.length) {
      nama = '<div class="ingat-orang">' + orang.map(function (o, k) {
        return '<span' + (k >= TAMPIL_NAMA ? ' hidden' : '') + '>' + esc(o.nama) + (o.ket ? '<small>' + esc(o.ket) + '</small>' : '') + '</span>';
      }).join('') + (orang.length > TAMPIL_NAMA ? '<button type="button" data-lagi="' + i + '">+' + (orang.length - TAMPIL_NAMA) + ' lainnya</button>' : '') + '</div>';
    }
    return '<li class="ingat" data-jenis="' + esc(x.jenis) + '" data-grup="' + g.grup + '" data-t="' + g.t + '">' + kotakTanggal(x, g) +
      '<div class="ingat-isi"><p class="ingat-judul">' + esc(x.judul) + (x.jumlah && !orang.length ? ' <span class="redup">(' + fmt(x.jumlah) + ' pegawai)</span>' : '') + '</p>' +
      '<p class="ingat-ket">' + ket.map(esc).join(' · ') + '</p>' + nama + '</div>' + lencanaTenggat(g) + '</li>';
  }

  function siapkanPengingat(D) {
    return (D.pengingat || []).map(function (x) { x._g = tenggat(x); return x; }).filter(function (x) {
      // butir bertanggal yang sudah lewat hanya tampil bila server menandainya tetap perlu dicek
      return x._g.grup !== 'lewat' || x.tetap;
    }).sort(function (a, b) {
      var ga = GRUP.map(function (g) { return g.id; }).indexOf(a._g.grup), gb = GRUP.map(function (g) { return g.id; }).indexOf(b._g.grup);
      if (ga !== gb) return ga - gb;
      return (a._g.hari == null ? 1e9 : a._g.hari) - (b._g.hari == null ? 1e9 : b._g.hari) || String(a.judul).localeCompare(String(b.judul), 'id');
    });
  }

  /* ---------- bagian halaman ---------- */
  function sampul(D, ingat) {
    var P = D.pegawai || {}, F = D.formasi, A = [];
    var status = (P.status || []).map(function (s) { return s.nama + ' ' + s.n; }).join(' · ');
    A.push({ label: 'Jumlah pegawai', nilai: fmt(P.total), sub: status });
    if (P.kelamin) A.push({ label: 'Laki-laki / perempuan', nilai: fmt(P.kelamin.l) + '<span class="pecahan"> / ' + fmt(P.kelamin.p) + '</span>', sub: persen(P.kelamin.p, P.kelamin.l + P.kelamin.p) + ' perempuan' });
    var dekat = ingat.filter(function (x) { return x._g.grup === 'pekan' || x._g.grup === 'bulan'; });
    A.push({ label: 'Pengingat 30 hari ke depan', nilai: fmt(dekat.length), sub: dekat.length ? ringkasJenis(dekat) : 'Tidak ada tenggat dekat', sorot: dekat.length > 0, href: '#pengingat' });
    if (F && F.kebutuhan) A.push({ label: 'Formasi terisi', nilai: persen(F.bezetting, F.kebutuhan), sub: fmt(F.bezetting) + ' dari kebutuhan ' + fmt(F.kebutuhan) + ' jabatan' });
    if (P.diklat && (P.diklat.sudah + P.diklat.belum)) A.push({ label: 'Sudah diklat fungsional', nilai: persen(P.diklat.sudah, P.diklat.sudah + P.diklat.belum, 1), sub: fmt(P.diklat.sudah) + ' dari ' + fmt(P.diklat.sudah + P.diklat.belum) + ' pegawai' });
    if (P.rerataUmur) A.push({ label: 'Rata-rata umur', nilai: fmt(P.rerataUmur, 1) + '<small>tahun</small>', sub: P.rerataMasaKerja ? 'Masa kerja rata-rata ' + fmt(P.rerataMasaKerja, 1) + ' tahun' : '' });
    var tautSumber = D.urlSumber ? ' <a href="' + esc(D.urlSumber) + '" target="_blank" rel="noopener">Buka spreadsheet</a>' : '';
    return '<section class="sampul sampul--polos" id="ringkasan"><div class="sampul-isi">' +
      '<div class="alis"><span>De-Bora</span><span class="titik"></span><span>Data Elektronik Kepegawaian</span></div>' +
      '<h1><small>Balai Taman Nasional Tambora</small>Kepegawaian dan pengingat tenggat</h1>' +
      '<p class="lede">Ringkasan dari spreadsheet <b>DE-BORA</b> yang diperbarui sendiri oleh bagian Kepegawaian: komposisi pegawai, formasi jabatan, kinerja, kelengkapan administrasi, dan tenggat yang mendekat. Data per <b>' + esc(waktuOlah(D.diolah)) + '</b>.' + tautSumber + '</p>' +
      '<div class="angka-deret">' + A.map(function (a) {
        var isi = '<div class="angka-label">' + a.label + '</div><div class="angka-nilai">' + a.nilai + '</div>' + (a.sub ? '<div class="angka-sub">' + esc(a.sub) + '</div>' : '');
        return '<div class="angka' + (a.sorot ? ' angka--sorot' : '') + '">' + isi + '</div>';
      }).join('') + '</div></div></section>';
  }
  function ringkasJenis(daftar) {
    var n = {};
    daftar.forEach(function (x) { n[x.jenis] = (n[x.jenis] || 0) + 1; });
    return Object.keys(JENIS).filter(function (k) { return n[k]; }).map(function (k) { return JENIS[k].nama + ' ' + n[k]; }).join(' · ');
  }

  function bagianPengingat(D, ingat) {
    if (!ingat.length) return bagian('pengingat', '01', 'Pengingat', '<p class="ingat-kosong">Tidak ada tenggat atau hal yang perlu dilengkapi saat ini.</p>');
    var hitung = {};
    ingat.forEach(function (x) { hitung[x.jenis] = (hitung[x.jenis] || 0) + 1; });
    var chip = '<div class="saring" id="saringIngat" role="group" aria-label="Saring pengingat"><button type="button" data-jenis="semua" aria-pressed="true">Semua <i>' + ingat.length + '</i></button>' +
      Object.keys(JENIS).filter(function (k) { return hitung[k]; }).map(function (k) {
        return '<button type="button" data-jenis="' + k + '" aria-pressed="false">' + JENIS[k].nama + ' <i>' + hitung[k] + '</i></button>';
      }).join('') + '</div>';
    var isi = GRUP.map(function (g) {
      var b = ingat.filter(function (x) { return x._g.grup === g.id; });
      if (!b.length) return '';
      return '<div class="ingat-grup" data-grup="' + g.id + '"><h3>' + g.judul + ' <small>' + (g.ket ? g.ket + ' · ' : '') + '<span data-n>' + b.length + '</span></small></h3>' +
        '<ul class="ingat-daftar">' + b.map(function (x) { return itemIngat(x, ingat.indexOf(x)); }).join('') + '</ul></div>';
    }).join('');
    var legenda = '<div class="legenda-tenggat"><span>' + lencanaTenggat({ t: 'kritis', ik: 'awas', label: 'Hari ini / lewat' }) + '</span><span>' +
      lencanaTenggat({ t: 'serius', ik: 'jam', label: '≤ 7 hari' }) + '</span><span>' + lencanaTenggat({ t: 'waspada', ik: 'jam', label: '≤ 30 hari' }) + '</span><span>' +
      lencanaTenggat({ t: 'dekat', ik: 'kalender', label: 'Lebih dari 30 hari' }) + '</span></div>';
    return bagian('pengingat', '01', 'Pengingat', chip + isi + legenda,
      'Tenggat dari Jadwal Kepegawaian, KGB, pensiun, PAK, cuti, dan pelatihan, serta hal yang belum lengkap (SKP, dokumen, unggahan, laporan Sikadir). Hitungan hari mengikuti tanggal di perangkat ini.');
  }

  function bagianAgenda(D) {
    var ag = (D.agenda || []).filter(function (a) { return a.mulai || a.selesai; });
    if (!ag.length) return bagian('agenda', '02', 'Agenda kepegawaian', kosong('Jadwal Kepegawaian belum terbaca dari spreadsheet.'));
    var kini = new Date(), kunciKini = kini.getFullYear() * 12 + kini.getMonth();
    var bulan = {}, urut = [];
    ag.forEach(function (a) {
      var t = urai(a.mulai || a.selesai), k = t.y * 12 + (t.m - 1);
      if (!bulan[k]) { bulan[k] = []; urut.push(k); }
      bulan[k].push(a);
    });
    urut.sort(function (a, b) { return a - b; });
    var lalu = 0, nanti = 0;
    var isi = '<ol class="agenda">' + urut.map(function (k) {
      var y = Math.floor(k / 12), m = k % 12;
      var semuaLalu = bulan[k].every(function (a) { return selisih(a.selesai || a.mulai) < 0; });
      var jauh = !semuaLalu && k > kunciKini + 3;
      if (semuaLalu) lalu++;
      if (jauh) nanti++;
      return '<li class="agenda-bulan' + (k === kunciKini ? ' kini' : '') + '"' + (semuaLalu ? ' data-lalu hidden' : jauh ? ' data-nanti hidden' : '') + '><h3>' + BULAN[m] + ' ' + y + '</h3><ul>' +
        bulan[k].map(function (a) {
          var g = tenggat({ tanggal: a.mulai || a.selesai, sampai: a.mulai && a.selesai && a.selesai !== a.mulai ? a.selesai : null });
          var sudah = g.grup === 'lewat';
          return '<li class="' + (sudah ? 'lalu' : '') + '"><span class="tg">' + rentang(a.mulai || a.selesai, a.selesai) + '</span>' +
            '<span class="jd"><b>' + esc(a.judul) + '</b>' + (a.kelompok || a.ket || a.perkiraan ? '<small>' + esc([a.kelompok, a.ket, a.perkiraan ? 'perkiraan dari jadwal tahun lalu' : ''].filter(Boolean).join(' · ')) + '</small>' : '') + '</span>' +
            (sudah ? '<span class="hitung" data-t="jauh">' + ikon('centang') + 'Lewat</span>' : lencanaTenggat(g)) + '</li>';
        }).join('') + '</ul></li>';
    }).join('') + '</ol>';
    if (nanti) isi += '<button type="button" class="tombol agenda-tampil" id="tampilNanti">' + ikon('kalender') + '<span>Tampilkan ' + nanti + ' bulan berikutnya</span></button>';
    if (lalu) isi += '<button type="button" class="tombol agenda-tampil" id="tampilLalu">' + ikon('kalender') + '<span>Tampilkan ' + lalu + ' bulan yang sudah lewat</span></button>';
    return bagian('agenda', '02', 'Agenda kepegawaian', kartu('Jadwal ' + (D.agendaTahun || kini.getFullYear()), isi, 'kalender', esc(ag.length + ' kegiatan')),
      'Periode kenaikan pangkat, kenaikan jenjang jabatan fungsional, uji kompetensi, dan batas usulan dari tab Jadwal Kepegawaian.');
  }

  function bagianKomposisi(D) {
    var P = D.pegawai;
    if (!P || !P.total) return bagian('komposisi', '03', 'Komposisi pegawai', kosong('Daftar pegawai belum terbaca dari spreadsheet.'));
    var seriLP = [{ k: 'l', nama: 'Laki-laki', singkat: 'L' }, { k: 'p', nama: 'Perempuan', singkat: 'P' }];
    var seriSt = [{ k: 'pns', nama: 'PNS', singkat: 'PNS' }, { k: 'cpns', nama: 'CPNS', singkat: 'CPNS' }, { k: 'pppk', nama: 'PPPK', singkat: 'PPPK' }];
    var kiri = kartu('Status kepegawaian dan jenis kelamin', tumpuk(P.status || [], seriLP), 'orang', fmt(P.total) + ' pegawai');
    var unit = '';
    if (P.unit && P.unit.length) {
      var jmlUnit = jumlah(P.unit, 'n'), adaSt = P.unit.some(function (u) { return u.pns != null; });
      unit = kartu('Unit kerja', (adaSt ? tumpuk(P.unit, seriSt) : batang(P.unit, { total: P.total })) +
        (P.unitSumber ? '<p class="kartu-catatan">Dari tab ' + esc(P.unitSumber) + (jmlUnit !== P.total ? ' (jumlahnya ' + fmt(jmlUnit) + ' pegawai, daftar pegawai ' + fmt(P.total) + ')' : '') + '.</p>' : ''),
        'struktur', P.unit.length + ' unit');
    }
    var gol = P.golongan && P.golongan.length ? kartu('Pangkat/golongan', batang(P.golongan, { total: P.total, padat: true }), 'naik', P.golongan.length + ' golongan') : '';
    var jab = '';
    if (P.jabatan && P.jabatan.length) {
      jab = kartu('Jabatan', tumpuk(P.jabatan.slice(0, 10), seriLP) + (P.jabatan.length > 10 ? lipat('Semua ' + P.jabatan.length + ' kelompok jabatan',
        '<table><thead><tr><th>Jabatan</th><th class="n">L</th><th class="n">P</th><th class="n">Jumlah</th></tr></thead><tbody>' +
        P.jabatan.map(function (j) { return '<tr><td>' + esc(j.nama) + '</td><td class="n">' + fmt(j.l) + '</td><td class="n">' + fmt(j.p) + '</td><td class="n">' + fmt(j.n) + '</td></tr>'; }).join('') + '</tbody></table>') : '') +
        '<p class="kartu-catatan">Jenjang (ahli pertama, terampil, dan seterusnya) digabung per nama jabatan.</p>', 'dokumen', P.jabatan.length + ' kelompok');
    }
    var jenis = P.jenisJabatan && P.jenisJabatan.length ? kartu('Jenis jabatan', batang(P.jenisJabatan, { total: P.total }), 'struktur') : '';
    var umur = P.umur && P.umur.length ? kartu('Kelompok umur', kolom(P.umur, { total: P.total, label: 'Jumlah pegawai per kelompok umur' }) +
      (P.pensiun5 != null ? '<p class="kartu-catatan">' + fmt(P.pensiun5) + ' pegawai mencapai batas usia pensiun dalam 5 tahun ke depan.</p>' : ''), 'jam', P.rerataUmur ? 'rata-rata ' + fmt(P.rerataUmur, 1) + ' tahun' : '') : '';
    var masa = P.masaKerja && P.masaKerja.length ? kartu('Masa kerja', kolom(P.masaKerja, { total: P.total, label: 'Jumlah pegawai per masa kerja' }), 'grafik',
      P.rerataMasaKerja ? 'rata-rata ' + fmt(P.rerataMasaKerja, 1) + ' tahun' : '') : '';
    var baris = [[kiri, unit || jenis], [umur, masa], [gol, jab], unit ? [jenis] : []];
    return bagian('komposisi', '03', 'Komposisi pegawai', baris.filter(function (b) { return b.join(''); }).map(function (b, i) {
      return '<div class="grid grid-2s"' + (i ? ' style="margin-top:18px"' : '') + '>' + b.join('') + '</div>';
    }).join(''), 'Dihitung dari tab ' + esc(P.sumber || 'daftar pegawai') + ' di spreadsheet.');
  }

  function bagianFormasi(D) {
    var F = D.formasi;
    if (!F || !F.kebutuhan) return bagian('formasi', '04', 'Formasi jabatan', kosong('Peta Jabatan belum terbaca dari spreadsheet.'));
    var fakta = '<div class="fakta-deret"><div><span>Terisi (bezetting)</span><b>' + fmt(F.bezetting) + '</b><small>pegawai pada peta jabatan</small></div>' +
      '<div><span>Kebutuhan</span><b>' + fmt(F.kebutuhan) + '</b><small>jabatan menurut peta jabatan</small></div>' +
      '<div><span>' + (F.kebutuhan - F.bezetting >= 0 ? 'Kekurangan' : 'Kelebihan') + '</span><b>' + fmt(Math.abs(F.kebutuhan - F.bezetting)) + '</b><small>' + persen(F.bezetting, F.kebutuhan) + ' formasi terisi</small></div></div>';
    var unit = F.unit && F.unit.length ? kartu('Per unit kerja', peluru(F.unit), 'struktur') : '';
    var kurang = (F.jabatan || []).filter(function (j) { return (j.k || 0) - (j.b || 0) > 0; }).sort(function (a, b) { return (b.k - b.b) - (a.k - a.b); });
    var jab = kurang.length ? kartu('Kekurangan terbesar per jabatan', peluru(kurang.slice(0, 10)) +
      lipat('Semua ' + F.jabatan.length + ' baris peta jabatan', '<table><thead><tr><th>Jabatan</th><th>Unit</th><th class="n">Kelas</th><th class="n">Terisi</th><th class="n">Kebutuhan</th><th class="n">±</th></tr></thead><tbody>' +
        F.jabatan.map(function (j) {
          return '<tr><td>' + esc(j.nama) + '</td><td>' + esc(j.unit || '') + '</td><td class="n">' + esc(j.kelas || '') + '</td><td class="n">' + fmt(j.b) + '</td><td class="n">' + fmt(j.k) + '</td><td class="n">' + fmt((j.b || 0) - (j.k || 0)) + '</td></tr>';
        }).join('') + '</tbody></table>'), 'timbang') : '';
    return bagian('formasi', '04', 'Formasi jabatan', fakta + '<div class="grid grid-2s" style="margin-top:18px">' + unit + jab + '</div>',
      'Perbandingan pegawai yang ada (bezetting) dengan kebutuhan jabatan menurut ' + esc(F.sumber || 'Peta Jabatan') + '.');
  }

  // Nilai rata-rata terhadap nilai maksimal (bobot dimensi IPASN, indeks per jenis jabatan).
  function skor(rows) {
    return '<ul class="meter-daftar">' + rows.map(function (d) {
      return '<li><span class="nm">' + esc(d.nama) + (d.sub ? '<small>' + esc(d.sub) + '</small>' : '') + '</span><span class="nl">' + fmt(d.nilai, 1) + '<small>dari ' + fmt(d.maks) + '</small></span>' +
        '<span class="meter-jalur" role="img" aria-label="' + esc(d.nama + ' ' + fmt(d.nilai, 1) + ' dari ' + d.maks) + '"><i class="sebagian" style="width:' + Math.min(100, d.nilai / d.maks * 100).toFixed(1) + '%"></i></span></li>';
    }).join('') + '</ul>';
  }

  function bagianKinerja(D) {
    var kartuK = [];
    var K = D.skp;
    if (K && K.tw && K.tw.length) {
      var isi = '<p class="kartu-catatan" style="margin:0 0 12px">Persentase pegawai dengan SKP berstatus OK per triwulan.</p>' +
        meter(K.tw.map(function (t) {
          var sub = t.selesai === false && /^Triwulan/.test(t.nama) ? 'belum berakhir' : t.unggah != null ? fmt(t.unggah) + ' sudah diunggah ke SIMPEG' : '';
          return { nama: t.nama, sub: sub, n: t.ok, total: K.total };
        }));
      (K.belum || []).forEach(function (b) { isi += daftarNama(esc(b.nama) + ': ' + b.orang.length + ' pegawai belum ' + esc(b.status || 'OK'), b.orang); });
      kartuK.push(kartu('SKP ' + (K.tahun || ''), isi, 'target', fmt(K.total) + ' pegawai'));
    }
    var I = D.ipasn;
    if (I && I.n) {
      var isiI = '<div class="fakta-deret" style="margin-bottom:14px"><div><span>Rata-rata indeks</span><b>' + fmt(I.rerata, 1) + '</b><small>dari 100 · ' + fmt(I.n) + ' pegawai dinilai</small></div>' +
        (I.kategoriRerata ? '<div><span>Kategori rata-rata</span><b style="font-size:18px">' + esc(I.kategoriRerata) + '</b><small>' + (I.tanggal ? 'data ' + tgl(I.tanggal) : 'menurut rata-rata indeks') + '</small></div>' : '') + '</div>' +
        (I.dimensi && I.dimensi.length ? '<div class="sub-judul">Rata-rata per dimensi</div>' + skor(I.dimensi.map(function (d) { return { nama: d.nama, sub: 'bobot ' + d.maks, nilai: d.nilai, maks: d.maks }; })) : '') +
        (I.kategori && I.kategori.length ? '<div class="sub-judul" style="margin-top:16px">Sebaran kategori</div>' + batang(I.kategori, { total: I.n, padat: true }) : '') +
        (I.perJenis && I.perJenis.length > 1 ? '<div class="sub-judul" style="margin-top:16px">Rata-rata per jenis jabatan</div>' + skor(I.perJenis.map(function (j) { return { nama: j.nama, sub: fmt(j.n) + ' pegawai', nilai: j.rerata, maks: 100 }; })) : '') +
        '<p class="kartu-catatan">Hanya rata-rata yang ditampilkan; nilai per pegawai tetap di spreadsheet.</p>';
      kartuK.push(kartu('Indeks Profesionalitas ASN ' + (I.tahun || ''), isiI, 'grafik'));
    }
    var A = D.pak;
    if (A && (A.total || (A.unggah && A.unggah.length))) {
      var isiA = '';
      if (A.total) isiA += '<div class="fakta-deret" style="margin-bottom:14px"><div><span>Pegawai dalam tab PAK</span><b>' + fmt(A.total) + '</b><small>jabatan fungsional</small></div>' +
        '<div><span>Cukup untuk naik pangkat</span><b>' + fmt(A.cukupKp) + '</b><small>angka kredit sudah memenuhi</small></div>' +
        '<div><span>Belum cukup</span><b>' + fmt(A.kurangKp) + '</b><small>' + (A.cukupKj != null ? fmt(A.cukupKj) + ' sudah cukup untuk naik jenjang' : 'angka kredit belum memenuhi') + '</small></div></div>';
      var unggah = (A.unggah || []).filter(function (u) { return u.total; });
      if (unggah.length) isiA += '<div class="sub-judul">Unggah dokumen PAK</div>' + meter(unggah.map(function (u) { return { nama: u.nama, n: u.n, total: u.total }; }));
      if (A.siap && A.siap.length) isiA += daftarNama('Angka kredit cukup untuk naik pangkat: ' + A.siap.length + ' pegawai', A.siap);
      if (A.hampir && A.hampir.length) isiA += daftarNama('Kurang 5 angka kredit atau kurang: ' + A.hampir.length + ' pegawai', A.hampir);
      kartuK.push(kartu('Penilaian angka kredit', isiA, 'dokumen'));
    }
    var P = D.pegawai || {}, L = D.pelatihan;
    if ((P.diklat && (P.diklat.sudah + P.diklat.belum)) || (L && L.daftar && L.daftar.length)) {
      var isiL = '';
      if (P.diklat && (P.diklat.sudah + P.diklat.belum)) isiL += meter([{ nama: 'Sudah mengikuti diklat fungsional', n: P.diklat.sudah, total: P.diklat.sudah + P.diklat.belum }]) +
        (P.diklat.belumOrang && P.diklat.belumOrang.length ? daftarNama('Belum diklat fungsional: ' + P.diklat.belumOrang.length + ' pegawai', P.diklat.belumOrang) : '');
      if (L && L.daftar && L.daftar.length) {
        isiL += '<div class="sub-judul" style="margin-top:16px">Pelatihan yang diikuti' + (L.tahun ? ' ' + esc(L.tahun) : '') + '</div>' +
          '<ul class="pel-daftar">' + L.daftar.map(function (x) {
            return '<li><span class="nm">' + esc(x.nama) + '<small>' + esc(x.mulai ? rentang(x.mulai, x.selesai) : x.tanggal || 'tanggal belum diisi') + '</small></span><span class="nl">' + fmt(x.peserta) + '<small>peserta</small></span></li>';
          }).join('') + '</ul>';
      }
      kartuK.push(kartu('Pengembangan kompetensi', isiL, 'topi', L && L.total ? fmt(L.total) + ' peserta pelatihan' : ''));
    }
    if (!kartuK.length) return bagian('kinerja', '05', 'Kinerja dan pengembangan', kosong('Data SKP, IPASN, PAK, dan pelatihan belum terbaca dari spreadsheet.'));
    return bagian('kinerja', '05', 'Kinerja dan pengembangan', '<div class="grid grid-2s">' + kartuK.join('') + '</div>',
      'Kemajuan SKP per triwulan, Indeks Profesionalitas ASN, angka kredit jabatan fungsional, dan pelatihan.');
  }

  function bagianAdministrasi(D) {
    var kartuA = [], kini = new Date();
    var K = D.dokumen;
    if (K && K.jenis && K.jenis.length) {
      var isi = '<div class="fakta-deret" style="margin-bottom:14px"><div><span>Dokumen lengkap</span><b>' + fmt(K.lengkap) + '</b><small>dari ' + fmt(K.total) + ' pegawai</small></div>' +
        '<div><span>Belum lengkap</span><b>' + fmt(K.total - K.lengkap) + '</b><small>pegawai, minimal satu dokumen</small></div></div>' +
        meter(K.jenis.map(function (j) { return { nama: j.nama, n: j.sudah, total: j.sudah + j.belum }; })) +
        '<p class="kartu-catatan">Sel kosong di spreadsheet dianggap tidak perlu (misalnya belum punya anak) dan tidak dihitung.</p>';
      kartuA.push(kartu('Kelengkapan dokumen kepegawaian', isi, 'map'));
    }
    var G = D.kgb, B = D.dokKgb;
    if ((G && G.total) || (B && B.total)) {
      var isiG = '';
      if (G && G.total) isiG += '<div class="sub-judul">Jumlah KGB per bulan, ' + G.tahun + '</div>' + kolom(G.bulan.map(function (n, i) {
        return { nama: BULAN[i] + ' ' + G.tahun, label: BULAN3[i], n: n, sorot: G.tahun === kini.getFullYear() && i === kini.getMonth() };
      }), { lebarKolom: 30, tinggi: 140, satuan: 'pegawai', label: 'Jumlah KGB per bulan' });
      if (B && B.total) {
        var kurang = B.kurang || [];
        isiG += '<div class="fakta-deret" style="margin:14px 0"><div><span>Berkas KGB belum lengkap</span><b>' + fmt(kurang.length) + '</b><small>dari ' + fmt(B.total) + ' pegawai</small></div></div>' +
          (B.jenis && B.jenis.length ? '<div class="sub-judul">Dokumen yang paling sering belum ada</div>' + batang(B.jenis.slice(0, 8), { padat: true }) : '') +
          daftarNama('Pegawai dengan berkas KGB belum lengkap (' + kurang.length + ')', kurang);
      }
      kartuA.push(kartu('Kenaikan gaji berkala', isiG, 'naik', G && G.total ? fmt(G.total) + ' pegawai KGB ' + G.tahun : ''));
    }
    var C = D.cuti;
    if (C && (jumlah(C.jenis, 'hari') || jumlah(C.bulan, 'n'))) {
      var isiC = '';
      if (C.bulan && jumlah(C.bulan, 'n')) isiC += '<div class="sub-judul">Hari cuti tahunan per bulan</div>' + kolom(C.bulan.map(function (b, i) {
        return { nama: BULAN[i], label: BULAN3[i], n: b.n, sorot: C.tahun === kini.getFullYear() && i === kini.getMonth() };
      }), { lebarKolom: 30, tinggi: 140, satuan: 'hari cuti', label: 'Hari cuti tahunan per bulan' });
      if (C.jenis && C.jenis.length) isiC += '<div class="sub-judul" style="margin-top:14px">Menurut jenis cuti</div>' + batang(C.jenis.map(function (j) { return { nama: j.nama, n: j.hari, sub: j.orang ? j.orang + ' pegawai' : '' }; }), { padat: true, satuan: 'hari' });
      if (C.sisa && C.sisa.length) isiC += daftarNama('Sisa cuti tahunan terbanyak (' + C.sisa.length + ' pegawai)', C.sisa.map(function (s) { return { nama: s.nama, ket: s.sisa + ' hari' }; }));
      kartuA.push(kartu('Cuti ' + (C.tahun || ''), isiC, 'koper', C.total ? fmt(C.total) + ' hari terpakai' : ''));
    }
    var Z = D.sikadir;
    if (Z && Z.total) {
      var fakta = [];
      if (Z.belumSesuai != null) fakta.push('<div><span>Belum disesuaikan</span><b>' + fmt(Z.belumSesuai) + '</b><small>pegawai dengan laporan terbuka</small></div>');
      if (Z.belumBerkas != null) fakta.push('<div><span>Berkas fisik belum masuk</span><b>' + fmt(Z.belumBerkas) + '</b><small>pegawai</small></div>');
      var isiZ = (fakta.length ? '<div class="fakta-deret" style="margin-bottom:14px">' + fakta.join('') + '</div>' : '') +
        (Z.bulan && Z.bulan.length ? '<div class="sub-judul">Laporan per bulan</div>' + kolom(bulanBerurut(Z.bulan).map(function (b) { var t = urai(b.bulan + '-01'); return { nama: t ? BULAN[t.m - 1] + ' ' + t.y : b.bulan, label: t ? BULAN3[t.m - 1] : b.bulan, n: b.n }; }),
          { lebarKolom: 30, tinggi: 140, satuan: 'laporan', label: 'Laporan kendala Sikadir per bulan' }) : '') +
        (Z.jenis && Z.jenis.length ? '<div class="sub-judul" style="margin-top:14px">Status penyesuaian</div>' + batang(Z.jenis, { total: Z.total, padat: true, satuan: 'laporan' }) : '');
      kartuA.push(kartu('Laporan kendala presensi Sikadir', isiZ, 'sidik', fmt(Z.total) + ' laporan'));
    }
    if (!kartuA.length) return bagian('administrasi', '06', 'Administrasi', kosong('Data dokumen, KGB, cuti, dan presensi belum terbaca dari spreadsheet.'));
    return bagian('administrasi', '06', 'Administrasi', '<div class="grid grid-2s">' + kartuA.join('') + '</div>',
      'Kelengkapan dokumen, kenaikan gaji berkala dan berkasnya, pemakaian cuti, dan laporan kendala presensi.');
  }

  // Deret bulan "yyyy-mm" tanpa celah (bulan tanpa laporan bernilai 0), paling banyak 12 bulan terakhir.
  function bulanBerurut(rows) {
    var peta = {};
    rows.forEach(function (r) { peta[r.bulan] = r.n; });
    var a = urai(rows[0].bulan + '-01'), b = urai(rows[rows.length - 1].bulan + '-01'), hasil = [];
    if (!a || !b) return rows;
    for (var k = a.y * 12 + a.m - 1; k <= b.y * 12 + b.m - 1; k++) {
      var kunci = Math.floor(k / 12) + '-' + ('0' + (k % 12 + 1)).slice(-2);
      hasil.push({ bulan: kunci, n: peta[kunci] || 0 });
    }
    return hasil.slice(-12);
  }

  function urlAman(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function bagianTautan(D) {
    var T = (D.tautan || []).filter(function (t) { return urlAman(t.url); }), R = D.peraturan || [], U = D.pengumuman || [];
    if (!T.length && !R.length && !U.length) return bagian('tautan', '07', 'Aplikasi, pengumuman, dan peraturan', kosong('Tab Aplikasi Kepegawaian belum terbaca dari spreadsheet.'));
    var isi = '';
    if (T.length) isi += '<div class="tautan-kisi">' + T.map(function (t) {
      return '<a class="tautan-kartu" href="' + esc(t.url) + '" target="_blank" rel="noopener"><span class="ik">' + ikon('luar') + '</span><b>' + esc(t.judul) + '</b><span>' + esc(t.ket || '') + '</span></a>';
    }).join('') + '</div>';
    var kartuB = [];
    if (U.length) kartuB.push(kartu('Pengumuman', '<ul class="umum-daftar">' + U.map(function (u) {
      var url = urlAman(u.url);
      return '<li><b>' + esc(u.judul) + '</b>' + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + ikon('luar') + esc(u.berkas || 'Buka tautan') + '</a>' : u.berkas ? '<span class="redup">' + esc(u.berkas) + '</span>' : '') + '</li>';
    }).join('') + '</ul>', 'info', U.length + ' pengumuman'));
    if (R.length) kartuB.push(kartu('Peraturan kepegawaian', '<div class="tabel-wadah"><table class="tabel-atur"><thead><tr><th>Topik</th><th>Terbaru</th><th>Sebelumnya</th></tr></thead><tbody>' +
      R.map(function (r) {
        var url = urlAman(r.url), um = urlAman(r.urlMateri);
        return '<tr><td>' + esc(r.topik) + (um ? '<a class="materi" href="' + esc(um) + '" target="_blank" rel="noopener">' + ikon('dokumen') + 'Materi</a>' : '') + '</td>' +
          '<td>' + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(r.terbaru || 'Buka') + '</a>' : esc(r.terbaru || '–')) + '</td><td class="redup">' + esc(r.sebelumnya || '–') + '</td></tr>';
      }).join('') + '</tbody></table></div>', 'timbang', R.length + ' topik'));
    if (kartuB.length) isi += '<div class="grid grid-2s"' + (T.length ? ' style="margin-top:18px"' : '') + '>' + kartuB.join('') + '</div>';
    return bagian('tautan', '07', 'Aplikasi, pengumuman, dan peraturan', isi, 'Dari tab Aplikasi Kepegawaian. Tautan dibuka di tab baru.');
  }

  function catatanOlah(D) {
    var p = (D.peringatan || []).filter(Boolean), c = (D.catatanData || []).filter(Boolean);
    if (!p.length && !c.length) return '';
    var daftar = function (x) { return '<ul>' + x.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; };
    return '<section class="bagian" id="catatan">' +
      (p.length ? '<div class="catatan-data">' + ikon('awas') + '<div><b>Sebagian isi spreadsheet belum terbaca.</b> Bagian terkait tetap tampil dengan data yang ada.' + daftar(p) + '</div></div>' : '') +
      (c.length ? '<div class="catatan-data"' + (p.length ? ' style="margin-top:12px"' : '') + '>' + ikon('info') + '<div><b>Catatan data untuk bagian Kepegawaian.</b>' + daftar(c) + '</div></div>' : '') + '</section>';
  }

  function aman(fn, id, judul) {
    var arg = Array.prototype.slice.call(arguments, 3);
    try { return fn.apply(null, arg); } catch (e) {
      console.error(e);
      return '<section class="bagian" id="' + id + '"><div class="bagian-kepala"><span class="bagian-no">!</span><h2>' + judul + '</h2></div>' + kosong('Bagian ini gagal ditampilkan: ' + e.message) + '</section>';
    }
  }

  function render() {
    var D = S.d, ingat = siapkanPengingat(D);
    $('#isi').innerHTML =
      aman(sampul, 'ringkasan', 'Ringkasan', D, ingat) +
      aman(bagianPengingat, 'pengingat', 'Pengingat', D, ingat) +
      aman(bagianAgenda, 'agenda', 'Agenda kepegawaian', D) +
      aman(bagianKomposisi, 'komposisi', 'Komposisi pegawai', D) +
      aman(bagianFormasi, 'formasi', 'Formasi jabatan', D) +
      aman(bagianKinerja, 'kinerja', 'Kinerja dan pengembangan', D) +
      aman(bagianAdministrasi, 'administrasi', 'Administrasi', D) +
      aman(bagianTautan, 'tautan', 'Aplikasi, pengumuman, dan peraturan', D) +
      catatanOlah(D);
    $('#kepalaData').textContent = 'Data per ' + waktuOlah(D.diolah);
    $('#kakiData').textContent = 'Sumber: ' + (D.judul || 'spreadsheet DE-BORA') + (D.lembar ? ' · ' + D.lembar + ' tab dibaca' : '') + ' · diolah ' + waktuOlah(D.diolah) + '.';
    $('#tombolMuat').hidden = S.peran !== 'admin';
    pasangSaring();
    amatiBagian();
    if (location.hash.length > 1) {
      var tuju = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (tuju) setTimeout(function () { tuju.scrollIntoView(); }, 30);
    }
  }

  /* ---------- interaksi ---------- */
  function pasangSaring() {
    var saring = $('#saringIngat');
    if (saring) saring.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-jenis]');
      if (!b) return;
      S.saring = b.getAttribute('data-jenis');
      $$('button', saring).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $$('.ingat').forEach(function (li) { li.hidden = S.saring !== 'semua' && li.getAttribute('data-jenis') !== S.saring; });
      $$('.ingat-grup').forEach(function (g) {
        var n = $$('.ingat', g).filter(function (li) { return !li.hidden; }).length;
        g.hidden = !n;
        var c = $('[data-n]', g);
        if (c) c.textContent = n;
      });
    });
    [['#tampilLalu', '.agenda-bulan[data-lalu]'], ['#tampilNanti', '.agenda-bulan[data-nanti]']].forEach(function (x) {
      var b = $(x[0]);
      if (b) b.addEventListener('click', function () {
        $$(x[1]).forEach(function (el) { el.hidden = false; });
        b.remove();
      });
    });
  }

  function pasangAksi() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-lagi]');
      if (!b) return;
      var wadah = b.parentNode;
      $$('span[hidden]', wadah).forEach(function (s) { s.hidden = false; });
      b.remove();
    });
    $('#tombolCetak').addEventListener('click', function () { window.print(); });
    $('#tombolMuat').addEventListener('click', function () {
      var s = window.SDTGerbang && window.SDTGerbang.sesi();
      if (s) muat(s, true);
    });
  }

  function amatiBagian() {
    var tautan = $$('#tab a');
    if (!window.IntersectionObserver) return;
    if (S.io) S.io.disconnect();
    S.io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        tautan.forEach(function (a) { if (a.getAttribute('href') === '#' + x.target.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('#isi > section[id]').forEach(function (s) { S.io.observe(s); });
  }

  function pasangTip() {
    var tip = $('#tip');
    function posisi(e) {
      var x = e.clientX + 14, y = e.clientY + 14, r = tip.getBoundingClientRect();
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
      tip.style.left = Math.max(8, x) + 'px';
      tip.style.top = Math.max(8, y) + 'px';
    }
    document.addEventListener('pointerover', function (e) {
      var el = e.target.closest && e.target.closest('[data-tip]');
      if (!el) return;
      tip.innerHTML = el.getAttribute('data-tip');
      tip.hidden = false;
      posisi(e);
    });
    document.addEventListener('pointermove', function (e) { if (!tip.hidden && e.target.closest && e.target.closest('[data-tip]')) posisi(e); });
    document.addEventListener('pointerout', function (e) {
      var el = e.target.closest && e.target.closest('[data-tip]');
      if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) tip.hidden = true;
    });
    window.addEventListener('scroll', function () { tip.hidden = true; }, { passive: true });
  }

  /* ---------- muat data ---------- */
  function pesan(judul, teks, tombol) {
    $('#isi').innerHTML = '<div class="galat" role="status"><h2>' + esc(judul) + '</h2><p>' + teks + '</p>' +
      (tombol ? '<p style="margin-top:14px"><button type="button" class="tombol" id="cobaLagi">' + ikon('jam') + '<span>Coba lagi</span></button></p>' : '') + '</div>';
    var c = $('#cobaLagi');
    if (c) c.addEventListener('click', function () { var s = window.SDTGerbang && window.SDTGerbang.sesi(); if (s) muat(s); });
  }

  function apiPost(badan, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ms) : null;
    return fetch(URL_API, { method: 'POST', body: JSON.stringify(badan), redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (t) clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
        function (e) { if (t) clearTimeout(t); throw new Error(e && e.name === 'AbortError' ? 'Server terlalu lama menjawab.' : 'Tidak tersambung ke server. Periksa koneksi internet.'); });
  }

  function muat(s, segarkan) {
    var nomor = ++S.nomor;
    S.peran = s.peran || '';
    if (!S.d || segarkan) $('#isi').innerHTML = '<div class="memuat" role="status"><span class="memuat-cincin" aria-hidden="true"></span>' +
      (segarkan ? 'Membaca ulang spreadsheet…' : 'Memuat data kepegawaian…') + '</div>';
    apiPost({ aksi: 'kepegawaian', token: s.token, segarkan: !!segarkan }, 120000).then(function (j) {
      if (nomor !== S.nomor) return;
      if (j.masukLagi) { if (window.SDTGerbang) window.SDTGerbang.kunci(j.galat || 'Sesi berakhir. Silakan masuk lagi.'); return; }
      if (!j.ok) {
        // Web App masih versi lama (belum punya aksi kepegawaian).
        throw new Error(/aksi tidak dikenal/i.test(j.galat || '')
          ? 'Layanan Tanya Data belum memuat fitur Kepegawaian. Admin: tempel TanyaData.gs terbaru, lalu terbitkan versi baru (Terapkan → Kelola deployment → Versi baru).'
          : (j.galat || 'Data belum bisa dimuat.'));
      }
      S.d = j.data;
      render();
    }).catch(function (e) {
      if (nomor !== S.nomor) return;
      pesan('Data kepegawaian belum bisa dimuat', esc(e.message), true);
    });
  }

  function kosongkan() {
    // Keluar atau sesi habis: data pribadi dihapus dari halaman.
    S.nomor++;
    S.d = null;
    $('#isi').innerHTML = '<div class="memuat" role="status">Masuk untuk melihat data kepegawaian.</div>';
    $('#kepalaData').textContent = '';
    $('#kakiData').textContent = '';
  }

  function mulai() {
    pasangTip();
    pasangAksi();
    var G = window.SDTGerbang;
    if (!URL_API || !G || !G.aktif) {
      pesan('Belum tersambung', 'Halaman ini membaca spreadsheet Kepegawaian lewat layanan Tanya Data, dan hanya untuk pegawai yang sudah masuk. Isi alamat <b>TANYA_DATA</b> di <code>data/sumber.js</code>.');
      return;
    }
    window.addEventListener('sdt-sesi', function (e) { if (e.detail) muat(e.detail); else kosongkan(); });
    var s = G.sesi();
    if (s) muat(s); else kosongkan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
