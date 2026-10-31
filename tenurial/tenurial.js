/* Konflik Tenurial Karya Sari dan So Tompo: rangkuman hasil pulbaket ST.1452 (14–18 Oktober 2026).
   Data: ../data/tenurial/ringkasan.json (angka agregat), bidang.geojson (146 bidang tanpa identitas pribadi),
   terbakar.geojson dan zonasi.geojson (dipotong ke sekitar kedua blok), dan ../data/resor/batas_resor_2026.geojson. */
(function () {
  'use strict';

  var DATA = '../data/tenurial/';
  var BATAS_RESOR = '../data/resor/batas_resor_2026.geojson';
  var URUT = ['buka', 'sewa', 'kosong', 'belum'];
  var WARNA = { buka: '#3987e5', sewa: '#d95926', kosong: '#199e70', belum: '#6f746a' };
  var NAMA = { buka: 'Buka sendiri', sewa: 'Sewa/beli', kosong: 'Riwayat kosong', belum: 'Belum teridentifikasi' };
  var ARTI = {
    buka: 'pengguna menyatakan membuka lahan sendiri',
    sewa: 'lahan disewa atau dibeli dari pihak lain, termasuk campuran buka sendiri dan sewa/beli',
    kosong: 'pengguna diketahui, riwayat penggunaan tidak diisi',
    belum: 'nama pengguna belum diperoleh'
  };
  var ZONA_WARNA = { 'Zona Tradisional': '#e9c46d', 'Zona Rehabilitasi': '#86c591', 'Zona Pemanfaatan': '#7ccab6', 'Zona Khusus': '#ffffff', 'Zona Rimba': '#b5bda9', 'Zona Inti': '#c7a2ff' };
  var FOKUS = ['Kepastian subjek dan objek', 'Pencegahan perambahan baru', 'Identifikasi gangguan karhutla', 'Monitoring kesepakatan konservasi',
    'Rehabilitasi dan pemberdayaan', 'Monitoring berkelanjutan', 'Permasalahan kawasan dan solusi dari masyarakat'];
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var IKON = {
    peta: '<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
    grafik: '<path d="M3.5 20h17"/><path d="M6.5 20v-7M12 20V5M17.5 20v-10"/>',
    orang: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c.6-3.3 2.8-5.2 5.5-5.2s4.9 1.9 5.5 5.2"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.3c2.6-.2 4.5 1.4 4.9 4.4"/>',
    api: '<path d="M12 3c.6 3 4.9 5.2 4.9 10.1a4.9 4.9 0 0 1-9.8 0c0-2.2 1.1-3.8 2.3-4.9.2 1.6.9 2.7 2 3.3-.3-3.2.1-6.2.6-8.5z"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    timbang: '<path d="M12 4v16M7 20h10M4.5 7.5h15"/><path d="m4.5 7.5-2.5 6a2.5 2.5 0 0 0 5 0zM19.5 7.5l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
    kompas: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    dokumen: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    kunci: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>'
  };
  var S = { r: null, bidang: null, map: null, lapis: {}, indeks: {} };

  /* ---------- utilitas ---------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(x, d) {
    if (x == null || isNaN(x)) return '–';
    return Number(x).toLocaleString('id-ID', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }
  function ha(x) { return fmt(x, 2) + ' ha'; }
  function persen(a, b) { return fmt(b ? a / b * 100 : 0, 1) + '%'; }
  function tgl(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? +m[3] + ' ' + BULAN[+m[2] - 1] + ' ' + m[1] : '–';
  }
  function periode(a, b) {
    var x = /^(\d{4})-(\d{2})-(\d{2})/.exec(a), y = /^(\d{4})-(\d{2})-(\d{2})/.exec(b);
    if (x && y && x[1] === y[1] && x[2] === y[2]) return +x[3] + '–' + +y[3] + ' ' + BULAN[+y[2] - 1] + ' ' + y[1];
    return tgl(a) + ' – ' + tgl(b);
  }
  function daftar(arr) {
    arr = arr.filter(Boolean);
    return arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' dan ' + arr[arr.length - 1];
  }
  function ikon(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IKON[n] || '') + '</svg>'; }
  function ambil(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r.json();
    });
  }
  function noop() {}
  function bagian(id, no, judul, isi, ket) {
    return '<section class="bagian" id="' + id + '"><div class="bagian-kepala"><span class="bagian-no">' + no + '</span><h2>' + judul + '</h2>' +
      (ket ? '<p>' + ket + '</p>' : '') + '</div>' + isi + '</section>';
  }
  function kartu(judul, isi, ik, kanan, kelas) {
    return '<div class="kartu ' + (kelas || '') + '"><div class="kartu-judul">' + (ik ? ikon(ik) : '') + '<span>' + judul + '</span>' +
      (kanan ? '<span class="kanan">' + kanan + '</span>' : '') + '</div>' + isi + '</div>';
  }
  function swatch(k) { return '<span class="st"><i style="background:' + WARNA[k] + '"></i>' + NAMA[k] + '</span>'; }
  function legendaStatus() {
    return '<div class="legenda" style="margin:0 0 16px">' + URUT.map(function (k) { return '<span><i class="s-' + k + '"></i>' + NAMA[k] + '</span>'; }).join('') + '</div>';
  }
  function lipat(judul, tabel) {
    return '<details class="lipat"><summary>' + judul + '</summary><div class="tabel-wadah">' + tabel + '</div></details>';
  }

  /* ---------- batang bertumpuk menurut status ---------- */
  function tumpuk(rows, padat) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.ha; }));
    return '<ul class="tumpuk-daftar' + (padat ? ' tumpuk-daftar--padat' : '') + '">' + rows.map(function (r) {
      var ada = URUT.filter(function (k) { return r.status[k]; });
      var seg = ada.map(function (k) {
        var s = r.status[k];
        var tip = swatch(k) + '<br>' + esc(r.nm) + ': ' + s.n + ' bidang · ' + ha(s.ha) + ' (' + persen(s.ha, r.ha) + ' luas)';
        return '<i class="s-' + k + '" style="flex-grow:' + s.ha + '" data-tip="' + esc(tip) + '"></i>';
      }).join('');
      var label = ada.map(function (k) { return NAMA[k] + ' ' + r.status[k].n + ' bidang'; }).join(', ');
      return '<li class="tumpuk-baris"><span class="nm">' + esc(r.nm) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span>' +
        '<span class="tumpuk-jalur"><span class="tumpuk" style="width:' + (r.ha / max * 100).toFixed(2) + '%" role="img" aria-label="' + esc(r.nm + ': ' + label) + '">' + seg + '</span></span>' +
        '<span class="nl">' + ha(r.ha) + '<small>' + r.n + ' bidang</small></span></li>';
    }).join('') + '</ul>';
  }
  function tabelStatus(rows, kolom, total) {
    var sel = function (s) { return s ? s.n + '<small>' + fmt(s.ha, 2) + ' ha</small>' : '–'; };
    return '<table class="tabel-status"><thead><tr><th>' + kolom + '</th><th class="n">Bidang</th><th class="n">Luas (ha)</th>' +
      URUT.map(function (k) { return '<th class="n">' + NAMA[k] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th>' + esc(r.nm) + '</th><td class="n">' + r.n + '</td><td class="n">' + fmt(r.ha, 2) + '</td>' +
          URUT.map(function (k) { return '<td class="n">' + sel(r.status[k]) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody>' +
      (total ? '<tfoot><tr><th>Jumlah</th><td class="n">' + total.n + '</td><td class="n">' + fmt(total.ha, 2) + '</td>' +
        URUT.map(function (k) { return '<td class="n">' + sel(total.status[k]) + '</td>'; }).join('') + '</tr></tfoot>' : '') + '</table>';
  }

  /* ---------- isi halaman ---------- */
  function render() {
    var r = S.r, T = r.total, st = r.status, K = r.kegiatan, tb = r.terbakar, P = r.pengguna;
    var blokKS = r.blok[0], blokST = r.blok[1];
    var unidST = blokST.status.belum || { n: 0, ha: 0 };
    var html = '';

    /* sampul */
    var angka = [
      ['Bidang garapan', fmt(T.n), ha(T.ha)],
      ['Teridentifikasi', fmt(T.n_id) + '<small>bidang</small>', persen(T.ha_id, T.ha) + ' luas'],
      ['Belum teridentifikasi', fmt(T.n - T.n_id) + '<small>bidang</small>', ha(T.ha - T.ha_id)],
      ['Pengguna tercatat', fmt(P.nama) + '<small>nama</small>', P.pihak_menyewakan + ' pihak menyewakan/menjual'],
      ['Disewa atau dibeli', fmt(r.peralihan.n) + '<small>bidang</small>', ha(r.peralihan.ha)],
      ['Beririsan areal terbakar 2026', fmt(tb.n) + '<small>bidang</small>', ha(tb.ha)]
    ];
    html += '<section class="sampul sampul--polos" id="ringkasan"><div class="sampul-isi">' +
      '<div class="alis"><span>Perlindungan Kawasan</span><span class="titik"></span><span>' + esc(K.sptn) + '</span><span class="titik"></span><span>Pulbaket ' + esc(periode(K.mulai, K.selesai)) + '</span></div>' +
      '<h1>' + esc(r.judul) + '</h1>' +
      '<p class="lede">Pengumpulan bahan keterangan (pulbaket) dalam SMART Patrol memetakan <b>' + T.n + ' bidang lahan terbuka seluas ' + ha(T.ha) + '</b> di blok Karya Sari (Resor Doropeti) dan So Tompo (Resor Doro Tabe). ' +
      '<b>' + T.n_id + ' bidang (' + persen(T.ha_id, T.ha) + ' luas)</b> sudah teridentifikasi penggunanya; ' + (T.n - T.n_id) + ' bidang lainnya, terutama di So Tompo, menjadi prioritas pulbaket berikutnya.</p>' +
      '<div class="angka-deret">' + angka.map(function (a) {
        return '<div class="angka"><div class="angka-label">' + a[0] + '</div><div class="angka-nilai">' + a[1] + '</div><div class="angka-sub">' + a[2] + '</div></div>';
      }).join('') + '</div></div></section>';

    /* 01 peta */
    var lg = URUT.map(function (k) { return '<span><i class="kotak s-' + k + '" style="background:' + WARNA[k] + '"></i>' + NAMA[k] + ' <span class="redup">' + st[k].n + '</span></span>'; }).join('');
    html += bagian('peta', '01', 'Peta bidang garapan',
      '<div class="saring" id="saringBlok" role="group" aria-label="Perbesar ke blok"><span class="label">Perbesar ke</span>' +
      '<button type="button" data-blok="" aria-pressed="true">Kedua blok</button>' +
      r.blok.map(function (b) { return '<button type="button" data-blok="' + esc(b.nama) + '" aria-pressed="false">' + esc(b.nama) + ' <span class="redup">(' + b.n + ')</span></button>'; }).join('') + '</div>' +
      '<div class="peta-wadah peta-wadah--isi"><div class="peta peta--besar" id="petaBidang" role="region" aria-label="Peta bidang garapan Karya Sari dan So Tompo"></div>' +
      '<div class="peta-legenda"><div class="lg-grup"><b>Status bidang</b>' + lg + '</div>' +
      '<div class="lg-grup"><b>Lapisan</b><span><i class="baru"></i>Pembukaan baru 2026</span><span><i class="api"></i>Areal terbakar 2026</span><span><i class="resor"></i>Batas resor 2026</span><span><i class="zona"></i>Zonasi (dapat ditampilkan)</span></div></div></div>' +
      '<p class="kartu-catatan">Batas bidang adalah delineasi lahan terbuka dari citra (angka indikatif). Areal terbakar yang ditampilkan adalah poligon yang beririsan dengan atau berjarak hingga 1 km dari bidang garapan. Pilih lapisan dan peta dasar lewat tombol di pojok kanan atas peta.</p>',
      T.n + ' bidang lahan terbuka hasil aktualisasi (kode L001–L146), diwarnai menurut riwayat penggunaan dalam isian pulbaket. Arahkan kursor atau ketuk bidang untuk melihat rinciannya.');

    /* 02 status identifikasi */
    var rowsBlok = r.blok.map(function (b) { return { nm: b.nama, sub: 'Resor ' + b.resor + ' · ' + b.n_id + ' dari ' + b.n + ' bidang teridentifikasi', n: b.n, ha: b.ha, status: b.status }; });
    var rowsLok = r.lokasi.map(function (l) { return { nm: l.nama, sub: l.blok.length > 1 ? 'Karya Sari dan So Tompo' : 'Blok ' + l.blok[0], n: l.n, ha: l.ha, status: l.status }; });
    var totStatus = { n: T.n, ha: T.ha, status: st };
    var zonaFakta = r.zona.map(function (z) { return '<div><span>Zona ' + esc(z.nama.toLowerCase()) + '</span><b>' + z.n + ' <i>bidang</i></b><small>' + ha(z.ha) + '</small></div>'; }).join('');
    html += bagian('identifikasi', '02', 'Status identifikasi',
      legendaStatus() +
      '<div class="grid grid-2s">' +
      kartu('Menurut blok', tumpuk(rowsBlok) + lipat('Lihat tabel', tabelStatus(rowsBlok, 'Blok', totStatus)) +
        '<div class="sub-judul" style="margin-top:26px">Menurut zona</div><div class="fakta-deret">' + zonaFakta + '</div>' +
        '<p class="kartu-catatan">Tiga bidang di zona rehabilitasi (Karya Sari) seluruhnya digarap dengan riwayat buka sendiri; tiga bidang di zona pemanfaatan berada di So Tompo.</p>', 'grafik', 'luas (ha)') +
      kartu('Menurut lokasi dalam isian', tumpuk(rowsLok, true) + lipat('Lihat tabel', tabelStatus(rowsLok, 'Lokasi', totStatus)), 'peta', 'luas (ha)') + '</div>',
      T.n_id + ' dari ' + T.n + ' bidang (' + persen(T.ha_id, T.ha) + ' luas) sudah teridentifikasi pengguna atau pihak yang menyewakannya. Bidang yang belum teridentifikasi terpusat di So Tompo (' +
      unidST.n + ' bidang, ' + ha(unidST.ha) + ').');

    /* 03 pengguna lahan */
    var maxAsal = Math.max.apply(null, r.asal.map(function (a) { return a.n; }));
    var asal = '<ul class="batang">' + r.asal.map(function (a) {
      var tip = '<b>' + esc(a.nama) + '</b>' + a.n + ' bidang · ' + ha(a.ha);
      return '<li data-tip="' + esc(tip) + '"><span class="nm">' + esc(a.nama) + '</span><span class="jalur"><i style="width:' + (a.n / maxAsal * 100).toFixed(1) + '%"></i></span><span class="nl">' + a.n + '</span></li>';
    }).join('') + '</ul>';
    var tAsal = '<table><thead><tr><th>Alamat pengguna</th><th class="n">Bidang</th><th class="n">Luas (ha)</th></tr></thead><tbody>' +
      r.asal.map(function (a) { return '<tr><th>' + esc(a.nama) + '</th><td class="n">' + a.n + '</td><td class="n">' + fmt(a.ha, 2) + '</td></tr>'; }).join('') + '</tbody></table>';
    html += bagian('pengguna', '03', 'Pengguna lahan',
      '<div class="grid grid-2s">' +
      kartu('Asal pengguna menurut alamat', asal + '<p class="kartu-catatan">Jumlah bidang per alamat pengguna. Satu bidang dapat dihitung pada lebih dari satu alamat bila keterangannya berasal dari beberapa pengguna.</p>' + lipat('Lihat tabel', tAsal), 'orang', 'bidang') +
      kartu('Kepastian subjek dan objek', '<div class="fakta-deret">' +
        '<div><span>Keterangan pengguna ganda</span><b>' + r.ganda + ' <i>bidang</i></b><small>lebih dari satu pengguna atau keterangan berbeda</small></div>' +
        '<div><span>Luas menurut keterangan</span><b>' + fmt(r.klaim.klaim_ha, 2) + ' <i>ha</i></b><small>pada ' + r.klaim.n + ' bidang So Tompo; luas peta ' + ha(r.klaim.peta_ha) + '</small></div></div>' +
        '<div class="prosa" style="margin-top:14px"><p>Batas bidang pada peta adalah delineasi lahan terbuka dari citra, sehingga satu bidang dapat memuat garapan lebih dari satu pengguna atau lahan bera dan bekas terbakar. ' +
        'Pengukuran batas garapan bersama pengguna dan pencatatan kode lahan yang konsisten pada SMART Mobile diperlukan sebelum penyelesaian per bidang.</p></div>', 'timbang') + '</div>',
      'Isian pulbaket mencatat ' + P.nama + ' nama pengguna lahan; ' + P.buka_sendiri + ' di antaranya menyatakan membuka lahan sendiri. Nama tidak ditampilkan di halaman ini.');

    /* 04 peralihan dan pembukaan baru */
    var temuan = '<ul class="temuan">' + r.baru.map(function (b) {
      return '<li><span class="kode-deret">' + b.kode.map(function (k) { return '<button type="button" class="kode" data-kode="' + esc(k) + '" title="Tampilkan ' + esc(k) + ' di peta">' + esc(k) + '</button>'; }).join('') + '</span><p>' + esc(b.ket) + '</p></li>';
    }).join('') + '</ul>';
    html += bagian('peralihan', '04', 'Peralihan dan pembukaan baru',
      '<div class="grid grid-2s">' +
      kartu('Peralihan lahan menurut keterangan pengguna', '<div class="fakta-deret">' +
        '<div><span>Disewa atau dibeli</span><b>' + r.peralihan.n + ' <i>bidang</i></b><small>' + ha(r.peralihan.ha) + '; ' + esc(st.sewa.rinci) + '</small></div>' +
        '<div><span>Pihak yang menyewakan atau menjual</span><b>' + P.pihak_menyewakan + ' <i>pihak</i></b><small>menurut keterangan pengguna</small></div>' +
        '<div><span>Pengguna musiman</span><b>' + r.peralihan.musim_tanam + ' <i>bidang</i></b><small>digarap pengguna yang datang saat musim tanam jagung, sebagian besar dari Donggo</small></div></div>' +
        '<p class="kartu-catatan">Keterangan sewa dan jual beli lahan kawasan masih perlu dikonfirmasi kepada pihak yang disebutkan.</p>', 'timbang') +
      kartu('Pembukaan baru tahun 2026', temuan + '<p class="kartu-catatan">Ketuk kode lahan untuk menampilkannya di peta.</p>', 'kompas') + '</div>',
      'Keterangan masyarakat menyebut adanya sewa dan jual beli lahan di dalam kawasan, dan pembukaan lahan baru masih terjadi pada 2026.');

    /* 05 kebakaran */
    html += bagian('kebakaran', '05', 'Bidang garapan dan areal terbakar 2026',
      '<div class="grid grid-2s">' +
      kartu('Blok So Tompo', '<div class="fakta-deret">' +
        '<div><span>Bidang beririsan areal terbakar</span><b>' + tb.n + ' <i>dari ' + tb.blok_n + ' bidang</i></b><small>' + ha(tb.ha) + ' atau ' + fmt(tb.persen, 1) + '% luas bidang di blok ini</small></div>' +
        '<div><span>Terbakar ≥ 90% luas bidang</span><b>' + tb.n90 + ' <i>bidang</i></b><small>tidak ada bidang Karya Sari yang beririsan</small></div></div>' +
        '<div class="persen-batang" role="img" aria-label="' + fmt(tb.persen, 1) + '% luas bidang So Tompo beririsan areal terbakar" data-tip="' + esc('<b>So Tompo</b>' + ha(tb.ha) + ' dari ' + ha(tb.blok_ha) + ' (' + fmt(tb.persen, 1) + '%)') + '"><i style="width:' + tb.persen + '%"></i></div>' +
        '<p class="kartu-catatan">Delineasi manual areal terbakar musim 2026 sejak ' + tgl(tb.sejak) + ', pembaruan ' + tgl(tb.pembaruan) + '.</p>', 'api') +
      kartu('Yang perlu diverifikasi', '<div class="prosa"><p>Rekaman SMART Mobile dan isian pulbaket tidak memuat catatan bekas kebakaran atau penggunaan api. Jalur patroli tidak mencapai blok So Tompo (titik terdekat sekitar 4 km), sehingga waktu, rangkaian kejadian, dan penyebab kebakaran di blok ini belum diketahui.</p>' +
        '<p>Kajian Wilayah Kerja Resor 2026 mencatat kebakaran di kawasan umumnya dipicu perburuan dan pembukaan lahan; keterkaitan kebakaran dengan penyiapan lahan garapan perlu diverifikasi di lapangan.</p></div>', 'info') + '</div>',
      'Tumpang susun bidang garapan dengan delineasi areal terbakar musim 2026.');

    /* 06 tindak lanjut */
    html += bagian('tindak-lanjut', '06', 'Rekomendasi tindak lanjut',
      '<ol class="langkah">' + r.tindak_lanjut.map(function (t) { return '<li><span>' + esc(t) + '</span></li>'; }).join('') + '</ol>' +
      '<div class="catatan-data" style="margin-top:16px">' + ikon('info') + '<span>Usulan solusi dari masyarakat belum tercatat dalam isian pulbaket maupun SMART Mobile; rekomendasi di atas adalah saran tim pelaksana.</span></div>',
      'Saran tim dalam Laporan Pelaksanaan Kegiatan ST.1452, menunggu arahan pimpinan.');

    /* 07 metode */
    var arti = '<dl class="fakta">' + URUT.map(function (k) { return '<dt>' + swatch(k) + '</dt><dd>' + esc(ARTI[k]) + ' (' + st[k].n + ' bidang, ' + ha(st[k].ha) + ')</dd>'; }).join('') + '</dl>';
    html += bagian('metode', '07', 'Metode dan sumber data',
      '<div class="kartu"><div class="dua-kolom"><div class="prosa">' +
      '<p>Pulbaket dipadukan dengan patroli SMART pada ' + esc(periode(K.mulai, K.selesai)) + ' oleh ' + esc(K.tim) + ', mengikuti matriks penguatan teknis SMART Patrol dari pimpinan dengan tujuh fokus:</p>' +
      '<div class="fokus-deret">' + FOKUS.map(function (f) { return '<span class="chip">' + esc(f) + '</span>'; }).join('') + '</div>' +
      '<p>Keterangan direkam pada SMART Mobile dengan model data <b>Pengumpulan Bahan Keterangan</b> (kode lahan, nama, alamat, keterangan pengguna lahan, pihak yang menyewakan, tahun mulai penggunaan, dan foto) serta pada format isian tabel pulbaket (' + P.baris_isian + ' baris, ' + P.kode_tercatat + ' kode lahan). ' +
      'Keduanya dipadankan dengan peta bidang berdasarkan kode lahan, lalu ditumpangsusunkan dengan zonasi, batas resor 2026, jalur patroli (' + fmt(r.smart.km, 2) + ' km), dan areal terbakar.</p></div>' +
      '<div><div class="sub-judul">Arti status bidang</div>' + arti + '</div></div></div>' +
      '<div class="grid" style="margin-top:18px">' +
      '<div class="catatan-data">' + ikon('kunci') + '<span>' + esc(r.catatan.privasi) + '</span></div>' +
      '<div class="catatan-data">' + ikon('info') + '<span>' + esc(r.catatan.verifikasi) + ' ' + esc(r.catatan.dasbor) + '</span></div></div>' +
      '<div style="margin-top:18px"><div class="sub-judul">Sumber data</div><ul class="sumber-daftar">' + r.sumber.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>',
      'Kegiatan: ' + esc(K.judul) + ' (Surat Tugas Nomor ' + esc(K.st) + ').');

    $('#isi').innerHTML = html;
    $('#kepalaData').innerHTML = 'Pulbaket ' + esc(periode(K.mulai, K.selesai)) + '<br>' + esc(K.st);
    $('#kakiData').textContent = 'Data diolah ' + tgl(r.dibuat) + ' dari isian pulbaket, rekaman SMART Mobile, peta bidang garapan, dan delineasi areal terbakar per ' + tgl(tb.pembaruan) + '.';
  }

  /* ---------- peta ---------- */
  function tipBidang(p) {
    var lok = p.lokasi ? 'Lokasi ' + esc(p.lokasi) + ' · ' : '';
    return '<b>' + esc(p.kode) + ' · Blok ' + esc(p.blok) + '</b>' + 'Resor ' + esc(p.resor) + ' · ' + lok + 'Zona ' + esc(p.zona.toLowerCase()) + '<br>' +
      fmt(p.luas, 2) + ' ha · ' + swatch(p.status) + (p.pengguna ? ' · ' + p.pengguna + ' pengguna' : '') +
      (p.ganda ? '<br>Keterangan pengguna ganda' : '') +
      (p.terbakar > 0 ? '<br>Beririsan areal terbakar 2026: ' + fmt(p.terbakar, 2) + ' ha' : '') +
      (p.baru ? '<span class="baru">' + esc(p.baru) + '</span>' : '');
  }
  function gaya(f) {
    var k = f.properties.status;
    return { color: WARNA[k], weight: 1.2, opacity: .95, fillColor: WARNA[k], fillOpacity: k === 'belum' ? .35 : .55, dashArray: k === 'belum' ? '3 3' : null };
  }
  function pasangArsir(renderer) {
    var svg = renderer && renderer._container;
    if (!svg || svg.querySelector('#arsir-api')) return;
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = '<pattern id="arsir-api" patternUnits="userSpaceOnUse" width="8" height="8">' +
      '<path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" fill="none" stroke="#ff7a6b" stroke-width="1.3" stroke-opacity=".75" stroke-linecap="square"/></pattern>';
    svg.insertBefore(defs, svg.firstChild);
  }
  function pasangPeta() {
    var el = $('#petaBidang');
    if (!el || !window.L) { if (el) el.innerHTML = '<p class="galat">Peta belum bisa dimuat.</p>'; return; }
    var map = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.25, attributionControl: true });
    var dasar = {
      'Citra satelit': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, maxNativeZoom: 18, attribution: 'Citra © Esri, Maxar, Earthstar Geographics' }),
      'Topografi': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, maxNativeZoom: 18, attribution: 'Peta © Esri' }),
      'OpenStreetMap': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' })
    };
    dasar['Citra satelit'].addTo(map);
    [['zonasi', 405], ['bidang', 420], ['arsir', 430], ['sorot', 440]].forEach(function (p) { map.createPane(p[0]); map.getPane(p[0]).style.zIndex = p[1]; });
    map.getPane('arsir').style.pointerEvents = 'none';
    map.getPane('sorot').style.pointerEvents = 'none';
    var bidang = L.geoJSON(S.bidang, {
      pane: 'bidang', style: gaya,
      onEachFeature: function (f, l) {
        S.indeks[f.properties.kode] = l;
        l.bindTooltip(tipBidang(f.properties), { sticky: true, className: 'tip-peta', direction: 'top', offset: [0, -10] });
        l.on('mouseover', function () { l.setStyle({ weight: 2.6, fillOpacity: .8 }); });
        l.on('mouseout', function () { bidang.resetStyle(l); });
      }
    }).addTo(map);
    var baru = L.geoJSON({ type: 'FeatureCollection', features: S.bidang.features.filter(function (f) { return f.properties.baru; }) },
      { pane: 'sorot', interactive: false, style: { color: '#f0cf7e', weight: 2.8, opacity: 1, fill: false } }).addTo(map);
    S.lapis = { bidang: bidang, baru: baru };
    map.fitBounds(bidang.getBounds(), { padding: [24, 24] });
    S.blokBatas = {};
    S.r.blok.forEach(function (b, i) {
      var bb = L.geoJSON({ type: 'FeatureCollection', features: S.bidang.features.filter(function (f) { return f.properties.blok === b.nama; }) }).getBounds();
      S.blokBatas[b.nama] = bb;
      var kanan = i === 0;  // Karya Sari di barat laut: label di kanan; So Tompo di tenggara: label di kiri
      L.tooltip({ permanent: true, interactive: false, direction: kanan ? 'right' : 'left', offset: [kanan ? 10 : -10, 0], className: 'label-blok' })
        .setLatLng([bb.getCenter().lat, kanan ? bb.getEast() : bb.getWest()])
        .setContent('<b>' + esc(b.nama) + '</b><span>' + b.n + ' bidang · Resor ' + esc(b.resor) + '</span>').addTo(map);
    });
    var kontrol = L.control.layers(dasar, { 'Bidang garapan': bidang, 'Pembukaan baru 2026': baru }, { collapsed: true }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    S.map = map;

    ambil(DATA + 'terbakar.geojson').then(function (g) {
      var rd = L.svg({ pane: 'arsir' });
      var lap = L.geoJSON(g, { pane: 'arsir', renderer: rd, interactive: false, style: { color: '#ff7a6b', weight: .9, opacity: .7, fillColor: 'url(#arsir-api)', fillOpacity: 1 } }).addTo(map);
      pasangArsir(rd);
      kontrol.addOverlay(lap, 'Areal terbakar 2026');
    }).catch(noop);
    ambil(BATAS_RESOR).then(function (g) {
      g.features = g.features.filter(function (f) { return f.properties.nama === 'Doropeti' || f.properties.nama === 'Doro Tabe'; });
      var lap = L.geoJSON(g, { pane: 'sorot', interactive: false, style: { color: '#e8e2c8', weight: 1.6, opacity: .75, dashArray: '8 6', fill: false } }).addTo(map);
      kontrol.addOverlay(lap, 'Batas resor 2026');
    }).catch(noop);
    ambil(DATA + 'zonasi.geojson').then(function (g) {
      var lap = L.geoJSON(g, {
        pane: 'zonasi',
        style: function (f) { var z = f.properties.zona; return { color: ZONA_WARNA[z] || '#cfd8c8', weight: 1.2, opacity: .85, fill: z === 'Zona Khusus', fillColor: '#ffffff', fillOpacity: .08 }; },
        onEachFeature: function (f, l) { l.bindTooltip('<b>' + esc(f.properties.zona) + '</b>', { sticky: true, className: 'tip-peta' }); }
      });
      kontrol.addOverlay(lap, 'Zonasi');
    }).catch(noop);
  }

  /* ---------- interaksi ---------- */
  function pasangTip() {
    var tip = $('#tip');
    function posisi(e) {
      var w = tip.offsetWidth, h = tip.offsetHeight, x = e.clientX + 14, y = e.clientY - h - 12;
      if (x + w > window.innerWidth - 8) x = Math.max(8, e.clientX - w - 14);
      if (y < 8) y = e.clientY + 18;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    }
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) return;
      tip.innerHTML = t.getAttribute('data-tip'); tip.hidden = false; posisi(e);
    });
    document.addEventListener('pointermove', function (e) { if (!tip.hidden && e.target.closest && e.target.closest('[data-tip]')) posisi(e); });
    document.addEventListener('pointerout', function (e) {
      var t = e.target.closest && e.target.closest('[data-tip]');
      if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) tip.hidden = true;
    });
    window.addEventListener('scroll', function () { tip.hidden = true; }, { passive: true });
  }
  function pasangAksi() {
    var saring = $('#saringBlok');
    if (saring) saring.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-blok]');
      if (!b || !S.map) return;
      $$('button', saring).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      if (S.terbuka) { S.terbuka.closeTooltip(); S.terbuka = null; }
      var v = b.getAttribute('data-blok');
      S.map.flyToBounds(v ? S.blokBatas[v] : S.lapis.bidang.getBounds(), { padding: [24, 24], duration: .6 });
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button.kode');
      if (!b || !S.map) return;
      var l = S.indeks[b.getAttribute('data-kode')];
      if (!l) return;
      $('#peta').scrollIntoView({ behavior: 'smooth', block: 'start' });
      S.map.flyToBounds(l.getBounds(), { maxZoom: 17, padding: [60, 60], duration: .8 });
      if (S.terbuka && S.terbuka !== l) S.terbuka.closeTooltip();
      S.terbuka = l;
      setTimeout(function () { l.openTooltip(l.getBounds().getCenter()); }, 950);
    });
    $('#tombolCetak').addEventListener('click', function () { window.print(); });
    // tab aktif mengikuti bagian yang sedang dibaca
    var tautan = $$('#tab a');
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        tautan.forEach(function (a) { if (a.getAttribute('href') === '#' + x.target.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('#isi > section[id]').forEach(function (s) { io.observe(s); });
  }

  /* ---------- mulai ---------- */
  Promise.all([ambil(DATA + 'ringkasan.json'), ambil(DATA + 'bidang.geojson')]).then(function (d) {
    S.r = d[0]; S.bidang = d[1];
    render();
    pasangTip();
    pasangAksi();
    pasangPeta();
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  }).catch(function (e) {
    $('#isi').innerHTML = '<div class="galat"><h2>Data belum bisa dimuat</h2><p class="redup">' + esc(e.message) + '</p></div>';
  });
})();
