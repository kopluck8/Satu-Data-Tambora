/* Unduh Data · Satu Data Tambora.
   Daftar data dibaca dari aplikasi web Mesin Data (apps-script/mesin-data), spreadsheet tempat seluruh data
   Satu Data Tambora berkumpul. Susunannya mengikuti Garis Besar Peta Konsep Satu Data Tambora 2027:
   induk data > kategori > sub data, dengan data pendukung terlipat di bawah induknya. Login memakai sesi Tanya Data (assets/gerbang.js); Mesin Data memeriksa token dan
   peran pemakai ke Tanya Data, jadi kolom data pribadi hanya ikut terunduh oleh akun admin.
   Berkas Excel, CSV, GeoJSON, dan Shapefile disusun di browser (SheetJS dimuat hanya saat dibutuhkan).
   Alamat aplikasi web: window.SUMBER.UNDUH_DATA, atau baris berkunci "unduh_data" di tab Pengaturan Sheet konten.
   Tautan langsung: #tema=<kode induk> (mis. #tema=kehati), #data=<id sub data atau id tab lama>[,<id>], #peta. */
(function () {
  'use strict';

  var SUMBER = window.SUMBER || {};
  var SHEETJS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  var KUNCI_SIMPAN = 'sdt-unduh-v1';
  var KUNCI_KONTEN = 'sdt-konten-v1';
  var BATAS_WAKTU = 150000;
  var TAMPIL_AWAL = 10;
  var PAGES = 'https://kopluck8.github.io/';
  // Kolom pilihan saring: [kolom di Mesin Data, judul di halaman]. Tahun ditangani sendiri.
  // Jenis data sudah dipilih lewat induk dan sub data, jadi kategori dan sumber tidak lagi menjadi saringan.
  var FASET = [
    ['Jenis kegiatan', 'Jenis kegiatan'],
    ['Resor', 'Resor'],
    ['SPTN', 'SPTN'],
    ['Kelompok jenis', 'Kelompok jenis']
  ];
  var KATEGORI_SURVEI = 'Survei Kehati Metode Teknis';
  var LAPISAN = [
    { judul: 'Batas Kawasan TN Tambora', url: PAGES + 'SMART_Report_generator/data/batas_tambora.geojson', berkas: 'batas_kawasan_tn_tambora.geojson', ket: 'Batas kawasan dengan luas SK dan fungsi kawasan.' },
    { judul: 'Batas Resor 2026', url: '../data/resor/batas_resor_2026.geojson', berkas: 'batas_resor_2026.geojson', ket: 'Tujuh resor hasil Kajian Wilayah Kerja Resor 2026, dengan SPTN dan luas.' },
    { judul: 'Zonasi Kawasan', url: PAGES + 'SMART_Report_generator/data/zonasi.geojson', berkas: 'zonasi_tn_tambora.geojson', ket: 'Zona pengelolaan dengan kode zona dan luas.' },
    { judul: 'Jalan dan Jalur', url: PAGES + 'SMART_Report_generator/data/jalur.geojson', berkas: 'jalan_dan_jalur_tn_tambora.geojson', ket: 'Jalur patroli, pendakian, eksplorasi, dan jalan lain.' },
    { judul: 'Jalur Patroli SMART 2026', url: PAGES + 'Dashboard_SMART_TNGunungTambora/data/jalur-patroli.geojson', berkas: 'jalur_patroli_smart_2026.geojson', ket: 'Lintasan tiap leg patroli dengan ST, mandat, resor, dan panjang jalur.' },
    { judul: 'Areal Terbakar 2026', url: PAGES + 'Simulasi-API-Tambora/data/areal_terbakar.geojson', berkas: 'areal_terbakar_2026.geojson', ket: 'Delineasi areal terbakar dengan tanggal, resor, dan luas.' }
  ];
  var IKON = {
    unduh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 16.5v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
    cari: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
    kunci: '<svg class="data-ikon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>',
    panah: '<svg class="panah" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
  };
  var PUTAR = '<span class="memuat-cincin kecil" aria-hidden="true"></span>';
  var POLA_TGL = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/;
  // Format yang hanya memuat baris berkoordinat.
  var FORMAT_PETA = { geojson: 'GeoJSON', shp: 'Shapefile' };

  var S = {
    api: '', kat: null, byId: {}, pilih: {}, format: 'xlsx', pohon: [], buka: {}, bukaPendukung: {}, tuju: '',
    saring: { dari: '', sampai: '', tahun: [], nilai: {}, cari: '' },
    hitung: {}, nomor: 0, tunda: null, galatHitung: '', lagi: {}, cariData: '', sibuk: false, memuat: false
  };
  var main = document.getElementById('isi');

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function angka(n) { return Number(n || 0).toLocaleString('id-ID'); }
  function normal(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); }
  function dua(n) { return (n < 10 ? '0' : '') + n; }
  function hariIni() { var d = new Date(); return d.getFullYear() + '-' + dua(d.getMonth() + 1) + '-' + dua(d.getDate()); }
  function tglId(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(iso || ''));
    return m ? m[3] + '/' + m[2] + '/' + m[1] + (m[4] ? ' ' + m[4] + '.' + m[5] : '') : String(iso || '');
  }
  function daftarTeks(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' dan ' + a[a.length - 1]; }
  function ukuran(b) { return b > 1048576 ? (b / 1048576).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function rentangTahun(t) { return !t || !t[0] ? '' : t[0] === t[1] || !t[1] ? String(t[0]) : t[0] + '–' + t[1]; }
  function namaFaset(k) {
    if (k === 'Waktu') return 'waktu';
    for (var i = 0; i < FASET.length; i++) if (FASET[i][0] === k) return FASET[i][1].toLowerCase();
    return k;
  }

  /* ---------- alamat aplikasi web Mesin Data ---------- */
  function urlSah(u) { return /^https:\/\/script\.google(usercontent)?\.com\/\S+$/.test(u) || /^https?:\/\/(localhost|127\.0\.0\.1)[:/]\S*$/.test(u); }
  function idSheet(link) {
    var s = String(link || '').trim(), m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    return /^[a-zA-Z0-9_-]{20,}$/.test(s) ? s : '';
  }
  function bacaCsv(teks) {
    var baris = [], sel = '', row = [], kutip = false, i, c;
    teks = String(teks || '').replace(/^\ufeff/, '');
    for (i = 0; i < teks.length; i++) {
      c = teks[i];
      if (kutip) {
        if (c === '"') { if (teks[i + 1] === '"') { sel += '"'; i++; } else kutip = false; } else sel += c;
      } else if (c === '"') kutip = true;
      else if (c === ',') { row.push(sel); sel = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && teks[i + 1] === '\n') i++;
        row.push(sel); baris.push(row); row = []; sel = '';
      } else sel += c;
    }
    if (sel !== '' || row.length) { row.push(sel); baris.push(row); }
    return baris;
  }
  function dariPengaturan(rows) {
    var v = '';
    (rows || []).forEach(function (r) {
      var k = String(r.kunci || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (!v && (k === 'unduh_data' || k === 'url_unduh_data' || k === 'mesin_data')) v = String(r.nilai || '').trim();
    });
    return urlSah(v) ? v : '';
  }
  function cariApi() {
    var langsung = String(SUMBER.UNDUH_DATA || '').trim();
    if (urlSah(langsung)) return Promise.resolve(langsung);
    var konten = idSheet(SUMBER.GOOGLE_SHEETS);
    try {
      var o = JSON.parse(localStorage.getItem(KUNCI_KONTEN));
      var simpanan = o && o.id === konten && o.data ? dariPengaturan(o.data.Pengaturan) : '';
      if (simpanan) return Promise.resolve(simpanan);
    } catch (e) { /* tanpa salinan konten */ }
    if (!konten) return Promise.resolve('');
    var url = 'https://docs.google.com/spreadsheets/d/' + konten + '/gviz/tq?tqx=out:csv&headers=1&sheet=Pengaturan';
    return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (teks) {
      var g = bacaCsv(teks);
      if (!g.length) return '';
      var kepala = g[0].map(function (h) { return String(h).trim().toLowerCase(); }), ik = kepala.indexOf('kunci'), iv = kepala.indexOf('nilai');
      if (ik < 0 || iv < 0) return '';
      return dariPengaturan(g.slice(1).map(function (r) { return { kunci: r[ik], nilai: r[iv] }; }));
    }).catch(function () { return ''; });
  }

  /* ---------- panggilan ke Mesin Data ---------- */
  function galatMasuk(pesan) {
    var e = new Error(pesan || 'Sesi berakhir. Silakan masuk lagi.');
    e.masuk = true;
    if (window.SDTGerbang && window.SDTGerbang.aktif) window.SDTGerbang.kunci(e.message);
    return e;
  }
  function panggil(badan, ms) {
    var sesi = window.SDTGerbang && window.SDTGerbang.sesi();
    if (!sesi) return Promise.reject(galatMasuk());
    var isi = {};
    Object.keys(badan).forEach(function (k) { isi[k] = badan[k]; });
    isi.token = sesi.token;
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || BATAS_WAKTU) : null;
    return fetch(S.api, { method: 'POST', body: JSON.stringify(isi), redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        if (t) clearTimeout(t);
        if (!r.ok) throw new Error('Mesin Data menjawab HTTP ' + r.status + '. Coba lagi sebentar lagi.');
        return r.text();
      }, function (e) {
        if (t) clearTimeout(t);
        var err = new Error(e && e.name === 'AbortError' ? 'Mesin Data terlalu lama menjawab. Coba lagi, atau persempit saringan.' :
          'Tidak tersambung ke Mesin Data. Periksa koneksi internet. Bila tetap gagal, admin perlu memeriksa akses aplikasi web Mesin Data ("Siapa saja").');
        err.jaringan = true;
        throw err;
      })
      .then(function (teks) {
        var j;
        try { j = JSON.parse(teks); } catch (e) {
          throw new Error(/<html|<!doctype/i.test(teks) ? 'Mesin Data meminta login Google. Admin perlu menerapkan aplikasi web dengan akses "Siapa saja".' : 'Jawaban Mesin Data tidak dikenali.');
        }
        if (j.masukLagi) throw galatMasuk(j.galat);
        if (!j.ok) throw new Error(j.galat || 'Mesin Data menolak permintaan.');
        return j;
      });
  }

  /* ---------- muat katalog ---------- */
  function memuatHtml(pesan) { return '<div class="memuat" role="status"><span class="memuat-cincin" aria-hidden="true"></span>' + esc(pesan) + '</div>'; }

  function muatKatalog() {
    if (S.memuat) return;
    S.memuat = true;
    main.innerHTML = memuatHtml('Memuat daftar data…');
    cariApi().then(function (url) {
      if (!url) { tampilBelumAtur(); return null; }
      S.api = url;
      return panggil({ aksi: 'katalog', versi: 2 }, 90000).then(function (j) {
        S.kat = j;
        siapkan();
      });
    }).catch(function (e) {
      if (e.masuk) { main.innerHTML = memuatHtml('Menunggu login…'); return; }
      tampilGalat('Daftar data belum bisa dimuat', e.message);
    }).then(function () { S.memuat = false; });
  }

  function tampilGalat(judul, pesan) {
    main.innerHTML = '<div class="galat" role="alert"><h2>' + esc(judul) + '</h2><p>' + esc(pesan) + '</p>' +
      '<p><button type="button" class="tombol tombol--hantu" id="ulangiMuat">Coba lagi</button></p></div>';
    $('ulangiMuat').addEventListener('click', muatKatalog);
  }

  function tampilBelumAtur() {
    main.innerHTML = '<div class="info"><h2>Unduh Data belum tersambung ke Mesin Data</h2>' +
      '<p>Halaman ini membaca data dari aplikasi web Mesin Data, spreadsheet tempat seluruh data Satu Data Tambora berkumpul. Admin perlu menyambungkannya sekali:</p>' +
      '<ol><li>Pasang Mesin Data (lihat lembar Petunjuk di file Mesin Data).</li>' +
      '<li>Di Apps Script Mesin Data: Terapkan &gt; Deployment baru &gt; Aplikasi web. Jalankan sebagai: Saya. Yang memiliki akses: Siapa saja.</li>' +
      '<li>Tempel URL aplikasi web (berakhiran <code>/exec</code>) di tab Pengaturan Sheet konten hub, pada baris berkunci <code>unduh_data</code>.</li></ol>' +
      '<p>Sementara itu, lapisan peta di bawah sudah bisa diunduh.</p></div>';
  }

  function siapkan() {
    var k = S.kat;
    k.dataset = (k.dataset || []).filter(function (d) { return d && d.id; });
    if (!k.versi) {
      // Mesin Data yang belum diperbarui: satu data per tab, tanpa kategori.
      k.dataset.forEach(function (d, i) { d.jenis = 'sub'; d.kategori = ''; d.urut = i; d.asal = [d.id]; });
    }
    S.byId = {};
    k.dataset.forEach(function (d) { S.byId[d.id] = d; });
    S.pohon = susunPohon();
    S.pilih = {};
    bacaSimpanan();
    terapkanAlamat(true);
    if (!k.dataset.length) {
      main.innerHTML = '<div class="info"><h2>Belum ada data di katalog</h2><p>Admin dapat menjalankan menu Mesin Data &gt; Perbarui katalog Unduh Data di spreadsheet Mesin Data.</p></div>';
      return;
    }
    gambarHalaman();
    S.hitung = {};
    jadwalHitung();
    gulirKeTuju(false);
    var berisi = k.dataset.filter(function (d) { return Number(d.jumlah) > 0; });
    var sub = k.dataset.filter(function (d) { return d.jenis === 'sub'; }), subIsi = sub.filter(function (d) { return Number(d.jumlah) > 0; });
    var baris = berisi.reduce(function (a, d) { return a + (Number(d.jumlah) || 0); }, 0);
    $('kakiData').textContent = 'Katalog: ' + (k.versi ? subIsi.length + ' dari ' + sub.length + ' sub data berisi data, ' + (berisi.length - subIsi.length) + ' data pendukung' : berisi.length + ' data') +
      ', ' + angka(baris) + ' baris' + (k.diperbarui ? ', diperbarui ' + tglId(k.diperbarui) + ' WITA.' : '.');
  }

  /** Induk (urutan Garis Besar peta konsep) > kategori (urutan sub data pertamanya) > sub data; data pendukung terpisah. */
  function susunPohon() {
    var k = S.kat, peta = {}, urut = [];
    var grup = function (kode, nama, warna) {
      if (!peta[kode]) { peta[kode] = { kode: kode, nama: nama || 'Lainnya', warna: warna || '', kategori: [], petaKat: {}, pendukung: [] }; urut.push(peta[kode]); }
      return peta[kode];
    };
    (k.tema || []).forEach(function (t) { grup(String(t.kode), t.nama, t.warna); });
    k.dataset.map(function (d, i) { return { d: d, i: i }; }).sort(function (a, b) {
      return (Number(a.d.urut) || 0) - (Number(b.d.urut) || 0) || a.i - b.i;
    }).forEach(function (x) {
      var d = x.d, g = grup(String(d.induk || ''), d.tema, '');
      if (d.jenis === 'pendukung' || d.jenis === 'lainnya') { g.pendukung.push(d); return; }
      var nama = String(d.kategori || ''), kat = g.petaKat[nama];
      if (!kat) { kat = g.petaKat[nama] = { nama: nama, data: [] }; g.kategori.push(kat); }
      kat.data.push(d);
    });
    return urut.filter(function (g) { return g.kategori.length || g.pendukung.length; });
  }
  function grupInduk(kode) {
    for (var i = 0; i < S.pohon.length; i++) if (S.pohon[i].kode === kode) return S.pohon[i];
    return null;
  }
  function namaInduk(d) { var g = grupInduk(String(d.induk || '')); return g ? g.nama : d.tema || ''; }
  function bisaDipilih(d) { return !d.terkunci && Number(d.jumlah) > 0; }

  /* ---------- simpanan pilihan (hanya di perangkat ini) ---------- */
  function bacaSimpanan() {
    try {
      var o = JSON.parse(localStorage.getItem(KUNCI_SIMPAN) || 'null');
      if (!o) return;
      (o.pilih || []).forEach(function (id) { if (S.byId[id] && bisaDipilih(S.byId[id])) S.pilih[id] = true; });
      (o.buka || []).forEach(function (kode) { S.buka[kode] = true; });
      if (['xlsx', 'csv', 'geojson', 'shp'].indexOf(o.format) >= 0) S.format = o.format;
    } catch (e) { /* penyimpanan tidak tersedia */ }
  }
  function simpan() {
    try {
      localStorage.setItem(KUNCI_SIMPAN, JSON.stringify({ pilih: Object.keys(S.pilih), format: S.format,
        buka: Object.keys(S.buka).filter(function (k) { return S.buka[k]; }) }));
    } catch (e) { /* biarkan */ }
  }

  /**
   * #tema=kehati membuka induk itu dan memilih sub datanya yang berisi (#tema=survei: Survei Kehati Metode Teknis);
   * #data=id1,id2 memilih data (id tab lama memilih sub data dari tab itu); #peta menggulir ke lapisan peta.
   */
  function terapkanAlamat(awal) {
    var h = '';
    try { h = decodeURIComponent(location.hash.replace(/^#\/?/, '')); } catch (e) { h = ''; }
    if (h === 'peta') { setTimeout(function () { var p = $('peta'); p.scrollIntoView({ block: 'start' }); p.focus({ preventScroll: true }); }, awal ? 300 : 0); return; }
    var m = /^(tema|data)=(.+)$/.exec(h);
    if (!m || !S.kat) return;
    var nilai = m[2].split(',').map(function (s) { return s.trim(); }).filter(String), pilih = {}, buka = [];
    var survei = m[1] === 'tema' && nilai.indexOf('survei') >= 0;
    if (m[1] === 'tema') nilai.forEach(function (v) { var g = grupInduk(v === 'survei' && !grupInduk('survei') ? 'kehati' : v); if (g) buka.push(g.kode); });
    S.kat.dataset.forEach(function (d) {
      if (!bisaDipilih(d)) return;
      var kena = m[1] === 'data' ? nilai.some(function (v) { return v === d.id || (!S.byId[v] && (d.asal || []).indexOf(v) >= 0); }) :
        d.jenis === 'sub' && (nilai.indexOf(d.induk) >= 0 || nilai.indexOf(d.tema) >= 0 || (survei && d.kategori === KATEGORI_SURVEI));
      if (!kena) return;
      pilih[d.id] = true;
      if (buka.indexOf(String(d.induk || '')) < 0) buka.push(String(d.induk || ''));
      if (d.jenis !== 'sub') S.bukaPendukung[String(d.induk || '')] = true;
    });
    buka.forEach(function (kode) { S.buka[kode] = true; });
    if (buka.length) S.tuju = buka[0];
    if (Object.keys(pilih).length) S.pilih = pilih;
    if (!awal) { gambarDaftar(); pilihanBerubah(); gulirKeTuju(true); }
  }
  /** Gulir ke induk dari tautan #tema= atau #data= tepat setelah digambar, sebelum pengguna sempat menggulir sendiri. */
  function gulirKeTuju(halus) {
    var kode = S.tuju;
    S.tuju = '';
    if (!kode) return;
    requestAnimationFrame(function () {
      var el = document.querySelector('[data-induk="' + cssEsc(kode) + '"]');
      if (el) el.scrollIntoView({ block: 'start', behavior: halus && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
    });
  }

  /* ---------- kerangka halaman ---------- */
  function gambarHalaman() {
    var k = S.kat, admin = k.peran === 'admin';
    main.innerHTML =
      '<section class="pembuka">' +
        '<div><h1>Unduh Data</h1><p>Data Satu Data Tambora disusun mengikuti peta konsep: induk data, kategori, lalu sub data. Buka induknya, pilih sub data, saring bila perlu, lalu unduh sebagai Excel, CSV, GeoJSON, atau Shapefile. Lapisan peta ada di bagian bawah halaman.</p></div>' +
        '<div class="pembuka-meta">' +
          (k.diperbarui ? '<span class="lencana">Diperbarui <b>' + esc(tglId(k.diperbarui)) + '</b></span>' : '') +
          '<span class="lencana' + (admin ? ' lencana--admin' : '') + '">' + esc(k.nama || 'Pegawai') + ' · ' + (admin ? 'Admin' : 'Pegawai') + '</span>' +
        '</div>' +
      '</section>' +
      '<div class="tata">' +
        '<div class="tata-utama">' +
          '<section class="kotak" id="bagData" aria-labelledby="judulData">' +
            '<div class="kotak-kepala"><h2 id="judulData"><span class="langkah" aria-hidden="true">1</span>Pilih data</h2>' +
              '<div class="alat-data"><label class="isian cari-data">' + IKON.cari + '<span class="sr">Cari sub data</span><input type="search" id="cariData" placeholder="Cari sub data, mis. perburuan" autocomplete="off"></label>' +
              '<button type="button" class="teks-tombol" id="bukaSemua"></button></div></div>' +
            '<div id="daftarData"></div>' +
          '</section>' +
          '<section class="kotak" id="bagSaring" aria-labelledby="judulSaring">' +
            '<div class="kotak-kepala"><h2 id="judulSaring"><span class="langkah" aria-hidden="true">2</span>Saring</h2>' +
              '<button type="button" class="teks-tombol" id="hapusSaring">Hapus semua saringan</button></div>' +
            '<p class="kotak-ket">Boleh dilewati. Tanpa saringan, semua baris data terpilih ikut terunduh. Pilihan yang tampil mengikuti data yang dipilih.</p>' +
            '<div id="isiSaring"></div>' +
          '</section>' +
        '</div>' +
        '<aside class="tata-samping"><section class="kotak" id="bagUnduh" aria-labelledby="judulUnduh">' +
          '<div class="kotak-kepala"><h2 id="judulUnduh"><span class="langkah" aria-hidden="true">3</span>Unduh</h2></div>' +
          '<fieldset class="format"><legend>Format berkas</legend><div class="saklar">' +
            pilihFormat('xlsx', 'Excel') + pilihFormat('csv', 'CSV') + pilihFormat('geojson', 'GeoJSON') + pilihFormat('shp', 'Shapefile') +
          '</div><p class="format-ket" id="formatKet">' + esc(KET_FORMAT[S.format]) + '</p></fieldset>' +
          '<ul class="rincian" id="rincian"></ul>' +
          '<div class="total" aria-live="polite"><span id="totalKet">Belum ada data dipilih</span><b id="totalAngka">0</b></div>' +
          '<button type="button" class="tombol tombol--utama" id="tombolUnduh" disabled>' + IKON.unduh + '<span id="tombolUnduhTeks">Unduh</span></button>' +
          '<div class="kemajuan" id="kemajuan" hidden><div class="kemajuan-jalur"><i id="kemajuanBatang"></i></div></div>' +
          '<p class="status" id="status" role="status" aria-live="polite"></p>' +
          '<p class="catatan-admin">' + (admin ?
            '<b>Akun admin:</b> kolom data pribadi (nama pelaku, nama pengguna lahan, dan sejenisnya) ikut terunduh. Simpan berkasnya hanya untuk keperluan dinas.' :
            '<b>Akun pegawai:</b> kolom data pribadi (nama pelaku, nama pengguna lahan, dan sejenisnya) tidak ikut terunduh. Data bertanda khusus admin hanya bisa diunduh akun admin.') + '</p>' +
          '<p class="atur-ulang"><button type="button" class="teks-tombol" id="aturUlang">Mulai dari awal</button></p>' +
        '</section></aside>' +
      '</div>';
    pasangPeristiwa();
    gambarDaftar();
    gambarSaring();
    // Bilah bawah (layar sempit) disembunyikan saat panel Unduh sudah terlihat.
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (e) {
        S.panelTampak = e[0].isIntersecting;
        perbaruiRingkas();
      }, { threshold: 0.25 }).observe($('bagUnduh'));
    }
  }

  var KET_FORMAT = {
    xlsx: 'Satu berkas .xlsx: satu lembar per sub data, ditambah lembar Keterangan berisi induk, kategori, dan saringan.',
    csv: 'Satu berkas per data, zip bila lebih dari satu. Pemisah koma, untuk QGIS, R, atau Python. Untuk dibuka di Excel, pilih format Excel.',
    geojson: 'Titik dari data berkoordinat X dan Y (WGS 84), untuk QGIS dan peta web. Zip bila lebih dari satu data.',
    shp: 'Zip berisi .shp, .shx, .dbf, .prj, dan .cpg (WGS 84) untuk ArcGIS, QGIS, atau Google Earth Pro. Hanya baris berkoordinat; nama kolom dipendekkan menjadi 10 huruf dan padanannya ikut di zip.'
  };
  function pilihFormat(nilai, judul) {
    return '<label><input type="radio" name="format" value="' + nilai + '"' + (S.format === nilai ? ' checked' : '') + '><span>' + esc(judul) + '</span></label>';
  }

  /* ---------- 1. daftar data: induk > kategori > sub data ---------- */
  function idTerpilih() {
    return S.kat ? S.kat.dataset.filter(function (d) { return S.pilih[d.id] && bisaDipilih(d); }).map(function (d) { return d.id; }) : [];
  }

  function cocokCari(q, g) {
    return function (d) { return !q || normal(d.judul + ' ' + (d.kategori || '') + ' ' + (d.keterangan || '') + ' ' + g.nama).indexOf(q) >= 0; };
  }

  function tombolGrup(nama, data) {
    var ids = data.filter(bisaDipilih).map(function (d) { return d.id; });
    return ids.length > 1 ? '<button type="button" class="teks-tombol" data-grup="' + esc(nama) + '" data-isi="' + esc(ids.join(',')) + '"></button>' : '';
  }

  function ringkasInduk(g) {
    var sub = [], baris = 0;
    g.kategori.forEach(function (c) { sub = sub.concat(c.data); });
    sub.concat(g.pendukung).forEach(function (d) { baris += Number(d.jumlah) || 0; });
    var isi = sub.filter(function (d) { return Number(d.jumlah) > 0; }).length;
    var teks = S.kat.versi ? isi + ' dari ' + sub.length + ' sub data berisi' : isi + ' data';
    if (g.pendukung.length) teks += ' · ' + g.pendukung.length + ' data pendukung';
    return teks + ' · ' + angka(baris) + ' baris';
  }

  function gambarDaftar() {
    var q = normal(S.cariData).trim(), html = '';
    S.pohon.forEach(function (g) {
      var cocok = cocokCari(q, g);
      var kat = g.kategori.map(function (c) { return { nama: c.nama, data: c.data.filter(cocok) }; }).filter(function (c) { return c.data.length; });
      var pend = g.pendukung.filter(cocok);
      if (!kat.length && !pend.length) return;
      var kode = g.kode, id = 'induk-' + slug(kode || 'lainnya'), buka = !!q || !!S.buka[kode], semuaSub = [];
      kat.forEach(function (c) { semuaSub = semuaSub.concat(c.data); });
      var warna = /^#[0-9a-f]{3,8}$/i.test(g.warna) ? g.warna : '#8a93a6';
      html += '<section class="induk" data-induk="' + esc(kode) + '" style="--warna:' + esc(warna) + '">' +
        '<div class="induk-kepala">' +
          '<h3 class="induk-judul"><button type="button" class="induk-buka" id="buka-' + esc(id) + '" data-buka="' + esc(kode) + '" aria-expanded="' + buka + '" aria-controls="' + esc(id) + '">' +
            IKON.panah + '<span class="induk-tanda" aria-hidden="true"></span>' +
            '<span class="induk-teks"><span class="induk-nama">' + esc(g.nama) + '</span><span class="induk-ringkas">' + esc(ringkasInduk(g)) + '</span></span>' +
            '<span class="induk-dipilih" data-dipilih="' + esc(kode) + '"></span>' +
          '</button></h3>' +
          tombolGrup(g.nama, semuaSub) +
        '</div>' +
        '<div class="induk-isi" id="' + esc(id) + '" role="region" aria-labelledby="buka-' + esc(id) + '"' + (buka ? '' : ' hidden') + '>' +
          kat.map(function (c) { return kategoriHtml(c, g); }).join('') +
          (pend.length ? pendukungHtml(g, pend, !!q || !!S.bukaPendukung[kode]) : '') +
        '</div></section>';
    });
    $('daftarData').innerHTML = html || '<p class="kosong">Tidak ada sub data yang cocok dengan "' + esc(S.cariData) + '".</p>';
    perbaruiTombolGrup();
    perbaruiMeta();
    perbaruiTombolBuka();
  }

  /** Satu kategori: kartu sub data yang berisi, lalu satu baris nama sub data yang belum berisi data. */
  function kategoriHtml(c, g) {
    var isi = c.data.filter(function (d) { return Number(d.jumlah) > 0 || d.terkunci; });
    var kosong = c.data.filter(function (d) { return !(Number(d.jumlah) > 0) && !d.terkunci; });
    var judul = c.nama && c.nama !== g.nama;
    return '<div class="kategori">' +
      (judul ? '<div class="kategori-kepala"><h4>' + esc(c.nama) + '</h4>' + tombolGrup(c.nama, isi) + '</div>' : '') +
      (isi.length ? '<div class="data-deret">' + isi.map(kartuData).join('') + '</div>' : '') +
      (kosong.length ? '<p class="belum"><b>Belum ada data:</b> ' + kosong.map(function (d) { return '<span>' + esc(d.judul) + '</span>'; }).join(', ') + '</p>' : '') +
      '</div>';
  }

  function pendukungHtml(g, data, buka) {
    var lain = data.filter(function (d) { return d.jenis === 'lainnya'; }).length;
    return '<details class="pendukung" data-pendukung="' + esc(g.kode) + '"' + (buka ? ' open' : '') + '>' +
      '<summary>' + IKON.panah + '<span>Data pendukung</span><small>' + data.length + ' data</small></summary>' +
      '<p class="pendukung-ket">Data pelengkap di luar sub data peta konsep' + (lain ? ', termasuk baris yang kategorinya belum ada di peta konsep' : '') + '.</p>' +
      '<div class="pendukung-alat">' + tombolGrup('data pendukung ' + g.nama, data) + '</div>' +
      '<div class="data-deret">' + data.map(kartuData).join('') + '</div></details>';
  }

  function kartuData(d) {
    var ket = d.keterangan ? '<span class="data-ket">' + esc(d.keterangan) + '</span>' : '';
    if (d.terkunci) {
      return '<div class="data data--kunci">' + IKON.kunci + '<span class="data-judul">' + esc(d.judul) + '</span>' +
        '<span class="data-meta"><span class="label-kunci">Khusus admin</span> · ' + angka(d.jumlah) + ' baris' + (d.tahun && d.tahun[0] ? ' · ' + rentangTahun(d.tahun) : '') + '</span>' + ket + '</div>';
    }
    return '<label class="data"><input type="checkbox" value="' + esc(d.id) + '"' + (S.pilih[d.id] ? ' checked' : '') + '>' +
      '<span class="data-judul">' + esc(d.judul) + '</span><span class="data-meta" data-meta="' + esc(d.id) + '"></span>' + ket + '</label>';
  }

  function metaHtml(d) {
    var h = S.pilih[d.id] && adaSaring() ? hitungUntuk(d.id) : null;
    var dasar = (h ? '<b>' + angka(h.jumlah) + '</b> dari ' : '') + angka(d.jumlah) + ' baris';
    if (S.pilih[d.id] && adaSaring() && !h) dasar = 'menghitung… dari ' + angka(d.jumlah) + ' baris';
    return dasar + (d.tahun && d.tahun[0] ? ' · ' + rentangTahun(d.tahun) : '') + (d.titik ? ' · berkoordinat' : '');
  }

  function perbaruiMeta() {
    var el = main.querySelectorAll('[data-meta]');
    for (var i = 0; i < el.length; i++) { var d = S.byId[el[i].getAttribute('data-meta')]; if (d) el[i].innerHTML = metaHtml(d); }
    var dipilih = {};
    idTerpilih().forEach(function (id) { var k = String(S.byId[id].induk || ''); dipilih[k] = (dipilih[k] || 0) + 1; });
    el = main.querySelectorAll('[data-dipilih]');
    for (var j = 0; j < el.length; j++) { var n = dipilih[el[j].getAttribute('data-dipilih')] || 0; el[j].textContent = n ? n + ' dipilih' : ''; }
  }

  function perbaruiTombolGrup() {
    var el = main.querySelectorAll('[data-grup]');
    for (var i = 0; i < el.length; i++) {
      var ids = el[i].getAttribute('data-isi').split(','), semua = ids.every(function (id) { return S.pilih[id]; });
      el[i].textContent = semua ? 'Lepas semua' : 'Pilih semua';
      el[i].setAttribute('aria-label', (semua ? 'Lepas semua ' : 'Pilih semua ') + el[i].getAttribute('data-grup'));
    }
  }

  function perbaruiTombolBuka() {
    var b = $('bukaSemua'), el = main.querySelectorAll('[data-buka]'), terbuka = 0;
    for (var i = 0; i < el.length; i++) if (el[i].getAttribute('aria-expanded') === 'true') terbuka++;
    b.hidden = !el.length;
    b.textContent = el.length && terbuka === el.length ? 'Tutup semua' : 'Buka semua';
  }

  function bukaInduk(tombol, buka) {
    var kode = tombol.getAttribute('data-buka'), panel = $(tombol.getAttribute('aria-controls'));
    tombol.setAttribute('aria-expanded', buka ? 'true' : 'false');
    if (panel) panel.hidden = !buka;
    S.buka[kode] = buka;
  }

  /* ---------- 2. saring ---------- */
  function adaSaring() {
    var s = S.saring;
    return !!(s.dari || s.sampai || s.tahun.length || s.cari || Object.keys(s.nilai).some(function (k) { return s.nilai[k].length; }));
  }

  function saringKirim() {
    var s = S.saring, o = {}, nilai = {};
    if (s.dari) o.dari = s.dari;
    if (s.sampai) o.sampai = s.sampai;
    if (s.tahun.length) o.tahun = s.tahun.slice().sort();
    Object.keys(s.nilai).sort().forEach(function (k) { if (s.nilai[k].length) nilai[k] = s.nilai[k].slice().sort(); });
    if (Object.keys(nilai).length) o.nilai = nilai;
    if (s.cari.trim()) o.cari = s.cari.trim();
    return o;
  }

  /** Gabungan pilihan satu kolom dari data terpilih (atau semua data bila belum ada yang dipilih). */
  function gabungFaset(kolom) {
    var ids = idTerpilih(), dasar = ids.length ? ids.map(function (id) { return S.byId[id]; }) : S.kat.dataset.filter(function (d) { return !d.terkunci; });
    var hasil = {};
    dasar.forEach(function (d) {
      var f = d.faset && d.faset[kolom];
      if (!f) return;
      Object.keys(f).forEach(function (v) { if (v !== '') hasil[v] = (hasil[v] || 0) + Number(f[v] || 0); });
    });
    return hasil;
  }

  function chipHtml(kolom, nilai, label, n, tekan) {
    return '<button type="button" class="chip" data-kolom="' + esc(kolom) + '" data-nilai="' + esc(nilai) + '" aria-pressed="' + (tekan ? 'true' : 'false') + '">' +
      esc(label) + (n !== null && n !== undefined ? ' <small>' + angka(n) + '</small>' : '') + '</button>';
  }

  function deretChip(kolom, pilihan, terpilih, urutTahun) {
    var nilai = Object.keys(pilihan);
    terpilih.forEach(function (v) { if (nilai.indexOf(v) < 0) nilai.push(v); });
    nilai.sort(urutTahun ? function (a, b) { return Number(a) - Number(b); } : function (a, b) { return (pilihan[b] || 0) - (pilihan[a] || 0) || (a < b ? -1 : 1); });
    var buka = S.lagi[kolom] || nilai.length <= TAMPIL_AWAL + 2, tampil = buka ? nilai : nilai.filter(function (v, i) { return i < TAMPIL_AWAL || terpilih.indexOf(v) >= 0; });
    return '<div class="chip-deret" role="group" aria-label="' + esc(kolom) + '">' +
      chipHtml(kolom, '', 'Semua', null, !terpilih.length) +
      tampil.map(function (v) { return chipHtml(kolom, v, v, pilihan[v] || 0, terpilih.indexOf(v) >= 0); }).join('') +
      (tampil.length < nilai.length ? '<button type="button" class="chip chip--lagi" data-lagi="' + esc(kolom) + '">+' + (nilai.length - tampil.length) + ' lainnya</button>' : '') +
      '</div>';
  }

  function gambarSaring() {
    var s = S.saring, html = '';
    var tahun = gabungFaset('Tahun'), tahunPilih = s.tahun.map(String);
    html += '<div class="saring-blok"><div class="saring-kepala"><h3>Waktu</h3><small>' + esc(ringkasWaktu()) + '</small></div>' +
      (Object.keys(tahun).length || tahunPilih.length ? deretChip('Tahun', tahun, tahunPilih, true) : '') +
      '<div class="rentang">' +
        '<label for="dari">Dari tanggal<span class="isian"><input type="date" id="dari" value="' + esc(s.dari) + '" max="' + esc(s.sampai || '') + '"></span></label>' +
        '<label for="sampai">Sampai tanggal<span class="isian"><input type="date" id="sampai" value="' + esc(s.sampai) + '" min="' + esc(s.dari || '') + '"></span></label>' +
      '</div></div>';
    FASET.forEach(function (f) {
      var pilihan = gabungFaset(f[0]), terpilih = s.nilai[f[0]] || [];
      if (!Object.keys(pilihan).length && !terpilih.length) return;
      html += '<div class="saring-blok"><div class="saring-kepala"><h3>' + esc(f[1]) + '</h3><small>' + (terpilih.length ? terpilih.length + ' dipilih' : 'semua') + '</small></div>' +
        deretChip(f[0], pilihan, terpilih, false) + '</div>';
    });
    html += '<div class="saring-blok"><div class="saring-kepala"><h3><label for="cariTeks">Kata kunci</label></h3></div>' +
      '<div class="isian cari-teks">' + IKON.cari + '<input type="search" id="cariTeks" value="' + esc(s.cari) + '" placeholder="mis. elang, perambahan, Doropeti" autocomplete="off"></div>' +
      '<p class="saring-catatan">Mencari di semua kolom, termasuk komentar. Angka di samping pilihan adalah jumlah baris di data terpilih.</p></div>';
    pulihkanFokus(function () { $('isiSaring').innerHTML = html; });
    $('hapusSaring').disabled = !adaSaring();
  }

  function ringkasWaktu() {
    var s = S.saring, a = [];
    if (s.tahun.length) a.push('tahun ' + daftarTeks(s.tahun.slice().sort().map(String)));
    if (s.dari && s.sampai) a.push(tglId(s.dari) + ' sampai ' + tglId(s.sampai));
    else if (s.dari) a.push('sejak ' + tglId(s.dari));
    else if (s.sampai) a.push('sampai ' + tglId(s.sampai));
    return a.length ? a.join(', ') : 'semua waktu';
  }

  function teksSaring(o) {
    var a = [];
    if (o.tahun) a.push('Tahun ' + daftarTeks(o.tahun.map(String)));
    if (o.dari || o.sampai) a.push('Tanggal ' + (o.dari ? tglId(o.dari) : 'awal') + ' sampai ' + (o.sampai ? tglId(o.sampai) : 'akhir'));
    Object.keys(o.nilai || {}).forEach(function (k) {
      var judul = k;
      FASET.forEach(function (f) { if (f[0] === k) judul = f[1]; });
      a.push(judul + ': ' + o.nilai[k].join(', '));
    });
    if (o.cari) a.push('Kata kunci: ' + o.cari);
    return a.length ? a.join('; ') : 'Tanpa saringan';
  }

  /** Jalankan fn yang menggambar ulang, lalu kembalikan fokus ke tombol atau isian yang sama. */
  function pulihkanFokus(fn) {
    var a = document.activeElement, kunci = null;
    if (a && main.contains(a)) {
      if (a.id) kunci = '#' + a.id;
      else if (a.hasAttribute('data-kolom')) kunci = '[data-kolom="' + cssEsc(a.getAttribute('data-kolom')) + '"][data-nilai="' + cssEsc(a.getAttribute('data-nilai')) + '"]';
      else if (a.hasAttribute('data-lagi')) kunci = '[data-kolom="' + cssEsc(a.getAttribute('data-lagi')) + '"]:not([data-nilai=""])';
    }
    fn();
    if (kunci) { var b = main.querySelector(kunci); if (b && b !== document.activeElement) b.focus({ preventScroll: true }); }
  }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }

  /* ---------- hitung baris yang cocok ---------- */
  function hitungUntuk(id) {
    var d = S.byId[id];
    if (!adaSaring()) return { jumlah: Number(d.jumlah) || 0, diabaikan: [] };
    var h = S.hitung[id];
    return h && h.kunci === JSON.stringify(saringKirim()) ? h : null;
  }

  function jadwalHitung() {
    clearTimeout(S.tunda);
    S.galatHitung = '';
    perbaruiRingkas();
    if (!adaSaring() || !idTerpilih().length) return;
    S.tunda = setTimeout(hitungSekarang, 450);
  }

  function hitungSekarang() {
    var saring = saringKirim(), kunci = JSON.stringify(saring), nomor = ++S.nomor;
    var perlu = idTerpilih().filter(function (id) { return !hitungUntuk(id); });
    if (!perlu.length) { perbaruiRingkas(); return; }
    panggil({ aksi: 'hitung', dataset: perlu, saring: saring }, 90000).then(function (j) {
      (j.hasil || []).forEach(function (h) { S.hitung[h.id] = { jumlah: Number(h.jumlah) || 0, diabaikan: h.diabaikan || [], kunci: kunci }; });
      if (nomor !== S.nomor) return;
      if (j.belum && j.belum.length) { hitungSekarang(); return; }
      perbaruiRingkas();
    }).catch(function (e) {
      if (nomor !== S.nomor || e.masuk) return;
      S.galatHitung = e.message;
      perbaruiRingkas();
    });
  }

  /* ---------- 3. ringkasan unduhan ---------- */
  function perbaruiRingkas() {
    if (!$('rincian')) return;
    var ids = idTerpilih(), total = 0, tunggu = false, html = '', geo = FORMAT_PETA[S.format], adaTitik = false;
    ids.forEach(function (id) {
      var d = S.byId[id], h = hitungUntuk(id), ikut = !geo || d.titik;
      if (d.titik) adaTitik = true;
      if (!h) tunggu = true; else if (ikut) total += h.jumlah;
      var catatan = '';
      if (h && h.diabaikan && h.diabaikan.length) catatan += '<span class="lewat">Saringan ' + esc(daftarTeks(h.diabaikan.map(namaFaset))) + ' tidak berlaku untuk data ini.</span>';
      if (!ikut) catatan += '<span class="lewat">Tanpa koordinat, tidak ikut ' + geo + '.</span>';
      html += '<li><span class="nm">' + esc(d.judul) + '<small>' + esc(namaInduk(d)) + '</small></span><span class="nl">' + (h ? angka(h.jumlah) : PUTAR + '<span class="sr">menghitung</span>') + '</span>' + catatan + '</li>';
    });
    $('rincian').innerHTML = html;
    var ket = !ids.length ? 'Belum ada data dipilih' : ids.length + ' data dipilih' + (tunggu ? ', menghitung…' : '');
    if (S.galatHitung) ket = 'Jumlah belum bisa dihitung: ' + S.galatHitung;
    $('totalKet').textContent = ket;
    $('totalAngka').textContent = tunggu || S.galatHitung ? '…' : angka(total) + ' baris';
    var siap = ids.length && !S.sibuk && (S.galatHitung || (!tunggu && total > 0)) && (!geo || adaTitik);
    var tombol = $('tombolUnduh');
    tombol.disabled = !siap;
    $('tombolUnduhTeks').textContent = S.sibuk ? 'Menyiapkan…' : !ids.length ? 'Pilih data dulu' : geo && !adaTitik ? 'Tidak ada data berkoordinat' :
      !tunggu && !S.galatHitung && total === 0 ? 'Tidak ada baris yang cocok' : 'Unduh' + (tunggu || S.galatHitung ? '' : ' ' + angka(total) + ' baris');
    perbaruiMeta();
    perbaruiBilah(ids.length, tunggu || S.galatHitung ? null : total);
  }

  function perbaruiBilah(nData, total) {
    var b = $('bilah');
    b.hidden = !nData || S.sibuk || S.panelTampak;
    document.body.classList.toggle('ada-bilah', nData > 0);
    $('bilahTeks').innerHTML = '<b>' + nData + '</b> data · <b>' + (total === null ? '…' : angka(total)) + '</b> baris';
  }

  /* ---------- peristiwa ---------- */
  function pilihanBerubah() {
    simpan();
    perbaruiTombolGrup();
    gambarSaring();
    jadwalHitung();
  }

  function saringBerubah() {
    gambarSaring();
    jadwalHitung();
  }

  function pasangPeristiwa() {
    var tundaCari = null, tundaData = null;
    main.addEventListener('change', function (e) {
      var t = e.target;
      if (t.type === 'checkbox' && t.closest('#daftarData')) {
        if (t.checked) S.pilih[t.value] = true; else delete S.pilih[t.value];
        pilihanBerubah();
      } else if (t.name === 'format') {
        S.format = t.value;
        $('formatKet').textContent = KET_FORMAT[S.format];
        simpan();
        perbaruiRingkas();
      } else if (t.id === 'dari' || t.id === 'sampai') {
        S.saring[t.id] = /^\d{4}-\d{2}-\d{2}$/.test(t.value) ? t.value : '';
        if (S.saring.dari && S.saring.sampai && S.saring.dari > S.saring.sampai) {
          var x = S.saring.dari; S.saring.dari = S.saring.sampai; S.saring.sampai = x;
        }
        saringBerubah();
      }
    });
    main.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'cariData') {
        clearTimeout(tundaData);
        tundaData = setTimeout(function () { S.cariData = t.value; gambarDaftar(); }, 150);
      } else if (t.id === 'cariTeks') {
        clearTimeout(tundaCari);
        tundaCari = setTimeout(function () { S.saring.cari = t.value.slice(0, 100); $('hapusSaring').disabled = !adaSaring(); jadwalHitung(); }, 450);
      }
    });
    main.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || !main.contains(t)) return;
      if (t.hasAttribute('data-kolom')) {
        var kolom = t.getAttribute('data-kolom'), v = t.getAttribute('data-nilai');
        if (kolom === 'Tahun') {
          if (!v) S.saring.tahun = [];
          else {
            var n = Number(v), i = S.saring.tahun.indexOf(n);
            if (i >= 0) S.saring.tahun.splice(i, 1); else S.saring.tahun.push(n);
          }
        } else {
          var daftar = S.saring.nilai[kolom] || [];
          if (!v) daftar = [];
          else if (daftar.indexOf(v) >= 0) daftar = daftar.filter(function (x) { return x !== v; });
          else daftar = daftar.concat(v);
          if (daftar.length) S.saring.nilai[kolom] = daftar; else delete S.saring.nilai[kolom];
        }
        saringBerubah();
      } else if (t.hasAttribute('data-lagi')) {
        S.lagi[t.getAttribute('data-lagi')] = true;
        gambarSaring();
      } else if (t.hasAttribute('data-buka')) {
        bukaInduk(t, t.getAttribute('aria-expanded') !== 'true');
        perbaruiTombolBuka();
        simpan();
      } else if (t.id === 'bukaSemua') {
        var semuaTombol = main.querySelectorAll('[data-buka]'), bukaKah = t.textContent !== 'Tutup semua';
        for (var b = 0; b < semuaTombol.length; b++) bukaInduk(semuaTombol[b], bukaKah);
        perbaruiTombolBuka();
        simpan();
      } else if (t.hasAttribute('data-grup')) {
        var ids = t.getAttribute('data-isi').split(','), semua = ids.every(function (id) { return S.pilih[id]; });
        ids.forEach(function (id) { if (semua) delete S.pilih[id]; else S.pilih[id] = true; });
        var kotak = main.querySelectorAll('#daftarData input[type="checkbox"]');
        for (var k = 0; k < kotak.length; k++) kotak[k].checked = !!S.pilih[kotak[k].value];
        pilihanBerubah();
      } else if (t.id === 'hapusSaring') {
        S.saring = { dari: '', sampai: '', tahun: [], nilai: {}, cari: '' };
        saringBerubah();
        var judul = $('judulSaring');
        judul.setAttribute('tabindex', '-1');
        judul.focus({ preventScroll: true });
      } else if (t.id === 'aturUlang') {
        S.pilih = {};
        S.saring = { dari: '', sampai: '', tahun: [], nilai: {}, cari: '' };
        S.cariData = '';
        S.buka = {};
        S.bukaPendukung = {};
        $('cariData').value = '';
        simpan();
        gambarDaftar();
        saringBerubah();
        tampilStatus('', false);
        $('kemajuan').hidden = true;
        window.scrollTo({ top: 0 });
      } else if (t.id === 'tombolUnduh') {
        unduh();
      }
    });
    main.addEventListener('toggle', function (e) {
      var d = e.target;
      if (d.hasAttribute && d.hasAttribute('data-pendukung') && !S.cariData.trim()) S.bukaPendukung[d.getAttribute('data-pendukung')] = d.open;
    }, true);
    $('bilahTombol').addEventListener('click', function () {
      var b = $('bagUnduh');
      b.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      setTimeout(function () { var u = $('tombolUnduh'); (u.disabled ? b.querySelector('input[name="format"]:checked') : u).focus({ preventScroll: true }); }, 400);
    });
  }

  /* ---------- unduh ---------- */
  function tampilStatus(teks, galat) {
    var s = $('status');
    s.textContent = teks;
    s.classList.toggle('status--galat', !!galat);
  }
  function tampilKemajuan(bagian, teks) {
    $('kemajuan').hidden = false;
    $('kemajuanBatang').style.width = Math.round(Math.max(0, Math.min(1, bagian)) * 100) + '%';
    tampilStatus(teks, false);
  }

  function unduh() {
    if (S.sibuk) return;
    var format = S.format, saring = saringKirim();
    var ids = idTerpilih().filter(function (id) { return !FORMAT_PETA[format] || S.byId[id].titik; });
    if (!ids.length) return;
    var harap = 0;
    ids.forEach(function (id) { var h = hitungUntuk(id); harap += h ? h.jumlah : Number(S.byId[id].jumlah) || 0; });
    S.sibuk = true;
    perbaruiRingkas();
    tampilKemajuan(0, 'Menyiapkan unduhan…');
    var hasil = [], selesai = 0;
    var perluPustaka = format === 'xlsx' || format === 'shp' || ids.length > 1;
    (perluPustaka ? muatSheetJS() : Promise.resolve()).then(function () {
      var rantai = Promise.resolve();
      ids.forEach(function (id) {
        rantai = rantai.then(function () {
          var d = S.byId[id];
          return ambilSemua(d, saring, format, function (n, jumlah) {
            tampilKemajuan(harap ? (selesai + n) / harap : 0, d.judul + ': ' + angka(n) + ' dari ' + angka(jumlah) + ' baris');
          }).then(function (r) { selesai += r.baris.length; hasil.push(r); });
        });
      });
      return rantai;
    }).then(function () {
      tampilKemajuan(1, 'Menyusun berkas…');
      return new Promise(function (ok) { setTimeout(ok, 30); });
    }).then(function () {
      var b = susunBerkas(hasil, format, saring), isi = angka(selesai) + ' baris';
      if (FORMAT_PETA[format]) {
        var titik = hasil.reduce(function (a, r) { return a + (r.titikAda || 0); }, 0);
        if (!titik) {
          $('kemajuan').hidden = true;
          tampilStatus('Tidak ada baris berkoordinat yang lolos saringan, jadi berkas ' + FORMAT_PETA[format] + ' tidak dibuat. Ubah saringan, atau pilih Excel atau CSV.', true);
          return;
        }
        isi = angka(titik) + ' titik' + (titik < selesai ? ' dari ' + angka(selesai) + ' baris' : '');
      }
      simpanBerkas(b.blob, b.nama);
      tampilKemajuan(1, 'Selesai: ' + b.nama + ' (' + ukuran(b.blob.size) + ', ' + isi + '). Periksa folder Unduhan.');
    }).catch(function (e) {
      if (e.masuk) { tampilStatus('Sesi berakhir. Masuk lagi lalu tekan Unduh.', true); return; }
      $('kemajuan').hidden = true;
      tampilStatus('Unduhan gagal: ' + e.message, true);
    }).then(function () {
      S.sibuk = false;
      perbaruiRingkas();
    });
  }

  /** Semua halaman satu data. Satu halaman yang gagal karena jaringan dicoba sekali lagi. */
  function ambilSemua(d, saring, format, lapor) {
    var baris = [], info = null;
    function halaman(awal, coba) {
      return panggil({ aksi: 'unduh', id: d.id, saring: saring, awal: awal, format: format }).then(function (j) {
        info = j;
        for (var i = 0; i < j.baris.length; i++) baris.push(j.baris[i]);
        lapor(baris.length, j.jumlah);
        return j.berikut === null || j.berikut === undefined ? null : halaman(j.berikut, 0);
      }, function (e) {
        if (e.masuk || coba) throw e;
        return new Promise(function (ok) { setTimeout(ok, 2500); }).then(function () { return halaman(awal, 1); });
      });
    }
    return halaman(0, 0).then(function () {
      return { d: d, judul: info.judul || d.judul, kolom: info.kolom || [], baris: baris, jumlah: info.jumlah,
        diabaikan: info.diabaikan || [], khususAdmin: info.khususAdmin || [] };
    });
  }

  var janjiPustaka = null;
  function muatSheetJS() {
    if (window.XLSX && window.XLSX.utils) return Promise.resolve(window.XLSX);
    if (janjiPustaka) return janjiPustaka;
    janjiPustaka = new Promise(function (ok, gagal) {
      var s = document.createElement('script');
      s.src = SHEETJS;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = function () { if (window.XLSX && window.XLSX.utils) ok(window.XLSX); else { janjiPustaka = null; gagal(new Error('Pustaka Excel tidak termuat.')); } };
      s.onerror = function () { janjiPustaka = null; gagal(new Error('Pustaka Excel (SheetJS) tidak bisa dimuat. Periksa koneksi internet, atau unduh satu data sebagai CSV.')); };
      document.head.appendChild(s);
    });
    return janjiPustaka;
  }

  /* ---------- susun berkas ---------- */
  function slug(s) { return String(s || 'data').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 80) || 'data'; }
  function namaBerkas(hasil, ext) {
    var induk = hasil.map(function (r) { return namaInduk(r.d); }).filter(function (n, i, a) { return a.indexOf(n) === i; });
    return (hasil.length === 1 ? slug(hasil[0].judul) : induk.length === 1 && induk[0] ? slug(induk[0]) : 'Satu_Data_Tambora') + '_' + hariIni() + '.' + ext;
  }

  function susunBerkas(hasil, format, saring) {
    if (format === 'xlsx') return { blob: bukuExcel(hasil, infoUnduhan(hasil, saring, format)), nama: namaBerkas(hasil, 'xlsx') };
    if (format === 'shp') {
      var isiShp = [], dasarDipakai = {}, dipotong = 0, lebih = 0;
      hasil.forEach(function (r) {
        var dasar = dasarShp(r.judul), d = dasar, n = 2;
        while (dasarDipakai[d.toLowerCase()]) d = dasar + '_' + n++;
        dasarDipakai[d.toLowerCase()] = true;
        var s = shapefileData(r, d);
        dipotong += s.dipotong;
        lebih = Math.max(lebih, s.kolomLebih);
        isiShp = isiShp.concat(s.berkas);
      });
      var infoShp = infoUnduhan(hasil, saring, format);
      isiShp.push({ nama: 'KETERANGAN.txt', isi: '﻿' + infoShp.teks.concat([''], catatanShp(dipotong, lebih)).join('\r\n') + '\r\n' });
      return { blob: zip(isiShp), nama: namaBerkas(hasil, 'shp.zip') };
    }
    var berkas = hasil.map(function (r) {
      return format === 'csv' ? { nama: slug(r.judul) + '.csv', isi: csvTeks(r.kolom, r.baris), jenis: 'text/csv;charset=utf-8' } :
        { nama: slug(r.judul) + '.geojson', isi: JSON.stringify(geojson(r)), jenis: 'application/geo+json' };
    });
    var info = infoUnduhan(hasil, saring, format);
    if (berkas.length === 1) return { blob: new Blob([berkas[0].isi], { type: berkas[0].jenis }), nama: namaBerkas(hasil, format) };
    berkas.push({ nama: 'KETERANGAN.txt', isi: '\ufeff' + info.teks.join('\r\n') + '\r\n' });
    return { blob: zip(berkas), nama: namaBerkas(hasil, format === 'csv' ? 'csv.zip' : 'geojson.zip') };
  }

  function infoUnduhan(hasil, saring, format) {
    var k = S.kat, kini = new Date();
    var waktu = kini.getFullYear() + '-' + dua(kini.getMonth() + 1) + '-' + dua(kini.getDate()) + ' ' + dua(kini.getHours()) + ':' + dua(kini.getMinutes());
    var umum = [
      ['Unduhan Satu Data Tambora'],
      [],
      ['Diunduh', waktu + ' (waktu perangkat)'],
      ['Oleh', (k.nama || '') + ' (' + (k.peran === 'admin' ? 'admin' : 'pegawai') + ')'],
      ['Saringan', teksSaring(saring)],
      ['Susunan', 'Peta Konsep Satu Data Tambora: induk data > kategori > sub data'],
      ['Sumber', 'Mesin Data Satu Data Tambora, katalog diperbarui ' + tglId(k.diperbarui || '') + ' WITA'],
      ['Alamat', location.href.split('#')[0]]
    ];
    var tabel = [['Induk', 'Kategori', 'Sub data', 'Baris', 'Saringan tidak berlaku', 'Kolom khusus admin yang tidak ikut', 'Keterangan']];
    hasil.forEach(function (r) {
      var cat = FORMAT_PETA[format] ? r.titikAda + ' titik berkoordinat' : '';
      tabel.push([namaInduk(r.d), r.d.jenis === 'sub' ? r.d.kategori || '' : 'Data pendukung', r.judul, r.baris.length, r.diabaikan.map(namaFaset).join(', '),
        r.khususAdmin.join(', '), [r.d.keterangan || '', cat].filter(String).join(' ')]);
    });
    var teks = umum.map(function (b) { return b.join(': '); }).concat([''], tabel.map(function (b) { return b.join(' | '); }));
    return { umum: umum, tabel: tabel, teks: teks };
  }

  function serialExcel(m) {
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)) / 864e5 + 25569;
  }

  function lembarData(kolom, baris) {
    var X = window.XLSX, aoa = [kolom], lebar = kolom.map(function (h) { return Math.min(48, Math.max(8, String(h).length + 2)); });
    for (var r = 0; r < baris.length; r++) {
      var row = baris[r], out = new Array(row.length);
      for (var c = 0; c < row.length; c++) {
        var v = row[c], tgl = null;
        if (v === '' || v === null || v === undefined) { out[c] = null; continue; }
        if (typeof v === 'string') {
          tgl = POLA_TGL.exec(v);
          if (tgl) out[c] = { t: 'n', v: serialExcel(tgl), z: tgl[4] ? 'yyyy-mm-dd hh:mm' : 'yyyy-mm-dd' };
          else out[c] = v.length > 32000 ? v.slice(0, 32000) + '…' : v;
        } else out[c] = v;
        if (r < 300) lebar[c] = Math.min(48, Math.max(lebar[c] || 8, tgl ? (tgl[4] ? 17 : 11) : String(v).length + 2));
      }
      aoa.push(out);
    }
    var ws = X.utils.aoa_to_sheet(aoa);
    ws['!cols'] = lebar.map(function (w) { return { wch: w }; });
    if (ws['!ref']) ws['!autofilter'] = { ref: ws['!ref'] };
    return ws;
  }

  function namaLembar(judul, dipakai) {
    var dasar = String(judul || 'Data').replace(/[\\\/?*\[\]:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31).trim() || 'Data', nama = dasar, n = 2;
    while (dipakai[nama.toLowerCase()]) { var akhir = ' (' + n++ + ')'; nama = dasar.slice(0, 31 - akhir.length).trim() + akhir; }
    dipakai[nama.toLowerCase()] = true;
    return nama;
  }

  function bukuExcel(hasil, info) {
    var X = window.XLSX, wb = X.utils.book_new(), dipakai = {};
    hasil.forEach(function (r) { X.utils.book_append_sheet(wb, lembarData(r.kolom, r.baris), namaLembar(r.judul, dipakai)); });
    var ket = X.utils.aoa_to_sheet(info.umum.concat([[]], info.tabel));
    ket['!cols'] = [{ wch: 34 }, { wch: 30 }, { wch: 40 }, { wch: 10 }, { wch: 24 }, { wch: 36 }, { wch: 70 }];
    X.utils.book_append_sheet(wb, ket, namaLembar('Keterangan', dipakai));
    wb.Props = { Title: 'Unduhan Satu Data Tambora', Author: 'Satu Data Tambora', CreatedDate: new Date() };
    var isi = X.write(wb, { bookType: 'xlsx', type: 'array', compression: true });
    return new Blob([isi], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function selCsv(v) {
    if (v === null || v === undefined) return '';
    var s = String(v);
    return /[",\r\n]/.test(s) || /^\s|\s$/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function csvTeks(kolom, baris) {
    var out = [kolom.map(selCsv).join(',')];
    for (var i = 0; i < baris.length; i++) out.push(baris[i].map(selCsv).join(','));
    return '\ufeff' + out.join('\r\n') + '\r\n';
  }

  /** Baris yang punya koordinat X (bujur) dan Y (lintang) WGS 84. */
  function titikBaris(r) {
    var iX = r.kolom.indexOf('X'), iY = r.kolom.indexOf('Y'), hasil = [];
    if (iX < 0 || iY < 0) return hasil;
    r.baris.forEach(function (row) {
      var x = Number(row[iX]), y = Number(row[iY]);
      if (row[iX] === '' || row[iY] === '' || row[iX] === null || row[iY] === null || !isFinite(x) || !isFinite(y) || (x === 0 && y === 0)) return;
      hasil.push({ x: x, y: y, row: row });
    });
    return hasil;
  }

  function geojson(r) {
    var iX = r.kolom.indexOf('X'), iY = r.kolom.indexOf('Y');
    var fitur = titikBaris(r).map(function (t) {
      var p = {};
      r.kolom.forEach(function (h, i) { if (i !== iX && i !== iY) p[h] = t.row[i] === '' ? null : t.row[i]; });
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [t.x, t.y] }, properties: p };
    });
    r.titikAda = fitur.length;
    return { type: 'FeatureCollection', name: r.judul, features: fitur };
  }

  function zip(berkas) {
    var CFB = window.XLSX.CFB, z = CFB.utils.cfb_new(), kini = new Date(), enc = new TextEncoder(), dipakai = {};
    berkas.forEach(function (f) {
      var nama = f.nama, n = 2;
      while (dipakai[nama.toLowerCase()]) nama = f.nama.replace(/(\.[\w.]+)$/, '_' + n++ + '$1');
      dipakai[nama.toLowerCase()] = true;
      CFB.utils.cfb_add(z, nama, typeof f.isi === 'string' ? enc.encode(f.isi) : f.isi, { mt: kini });
    });
    var isi = CFB.write(z, { fileType: 'zip', type: 'array', compression: true });
    return new Blob([tanggalZip(isi instanceof Uint8Array ? isi : new Uint8Array(isi))], { type: 'application/zip' });
  }
  /** SheetJS hanya menulis tanggal berkas di kepala lokal zip; salin ke direktori pusat yang dibaca Windows dan 7-Zip. */
  function tanggalZip(u8) {
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), e = u8.length - 22;
    while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) return u8;
    for (var i = 0, n = dv.getUint16(e + 10, true), o = dv.getUint32(e + 16, true); i < n && o + 46 <= u8.length; i++) {
      if (dv.getUint32(o, true) !== 0x02014b50) break;
      var lokal = dv.getUint32(o + 42, true);
      if (lokal + 14 <= u8.length && dv.getUint32(lokal, true) === 0x04034b50) dv.setUint32(o + 12, dv.getUint32(lokal + 10, true), true);
      o += 46 + dv.getUint16(o + 28, true) + dv.getUint16(o + 30, true) + dv.getUint16(o + 32, true);
    }
    return u8;
  }

  /* ---------- Shapefile (ArcGIS, QGIS, Google Earth Pro) ----------
     Satu set .shp, .shx, .dbf, .prj, .cpg per jenis bentuk. Koordinat WGS 84, teks UTF-8.
     Cincin luar poligon searah jarum jam dan lubang berlawanan arah, sesuai spesifikasi ESRI. */
  var PRJ_WGS84 = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';
  var TIPE_SHP = { titik: 1, garis: 3, poligon: 5, multititik: 8 };
  var JENIS_FIELD = { C: 'teks', N: 'angka', D: 'tanggal' };
  var POLA_TGL_SAJA = /^\d{4}-\d{2}-\d{2}$/;
  var PENYANDI = null;

  function dasarShp(judul) { return slug(judul).replace(/-/g, '_'); }
  function utf8(s) { return (PENYANDI || (PENYANDI = new TextEncoder())).encode(s); }
  function ascii(s) { var b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0x7f; return b; }
  function catatanShp(dipotong, lebih) {
    return ['Shapefile',
      '- Koordinat dalam derajat WGS 84 (EPSG:4326), tertulis di berkas .prj. Teks dalam UTF-8 (berkas .cpg).',
      '- Hanya baris yang punya koordinat X dan Y yang ikut.',
      '- Nama kolom dipendekkan menjadi paling banyak 10 huruf (aturan dBASE). Padanannya dengan nama kolom asli ada di berkas <nama data>_kolom.csv.',
      '- Tanggal tanpa jam disimpan sebagai tanggal. Tanggal dengan jam, dan jam saja, disimpan sebagai teks.',
      '- Ekstrak zip ini dulu, lalu buka berkas .shp (ArcGIS Pro: Add Data; QGIS: seret ke peta). Berkas .shp, .shx, .dbf, .prj, dan .cpg yang bernama sama harus tetap satu folder.'
    ].concat(dipotong ? ['- ' + angka(dipotong) + ' isian teks lebih dari 254 byte dipotong (batas Shapefile). Teks lengkapnya ada di format Excel atau CSV.'] : [],
      lebih ? ['- ' + lebih + ' kolom terakhir tidak ikut karena Shapefile paling banyak memuat 254 kolom.'] : []);
  }

  function koordinat(t) {
    if (!Array.isArray(t) || t[0] === null || t[0] === '' || t[1] === null || t[1] === '') return null;
    var x = Number(t[0]), y = Number(t[1]);
    return isFinite(x) && isFinite(y) ? [x, y] : null;
  }
  function deretTitik(a) {
    var out = [];
    if (Array.isArray(a)) a.forEach(function (t) { var k = koordinat(t); if (k) out.push(k); });
    return out;
  }
  function luasBertanda(c) {
    var a = 0;
    for (var i = 0; i < c.length - 1; i++) a += c[i][0] * c[i + 1][1] - c[i + 1][0] * c[i][1];
    return a / 2;
  }
  function cincin(a, luar) {
    var c = deretTitik(a), n = c.length;
    if (n && (c[0][0] !== c[n - 1][0] || c[0][1] !== c[n - 1][1])) c.push([c[0][0], c[0][1]]);
    if (c.length < 4) return null;
    var l = luasBertanda(c);
    if (luar ? l > 0 : l < 0) c.reverse();
    return c;
  }
  /** Geometri GeoJSON menjadi { kelompok, bagian } untuk Shapefile, atau null bila kosong atau tidak didukung. */
  function bentukShp(g) {
    if (!g || !Array.isArray(g.coordinates)) return null;
    var k = g.coordinates, bagian = [], t;
    if (g.type === 'Point') {
      t = koordinat(k);
      return t ? { kelompok: 'titik', bagian: [[t]] } : null;
    }
    if (g.type === 'MultiPoint') {
      t = deretTitik(k);
      return t.length ? { kelompok: 'multititik', bagian: [t] } : null;
    }
    if (g.type === 'LineString' || g.type === 'MultiLineString') {
      (g.type === 'LineString' ? [k] : k).forEach(function (l) { var d = deretTitik(l); if (d.length > 1) bagian.push(d); });
      return bagian.length ? { kelompok: 'garis', bagian: bagian } : null;
    }
    if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
      (g.type === 'Polygon' ? [k] : k).forEach(function (p) {
        if (!Array.isArray(p)) return;
        var luar = cincin(p[0], true);
        if (!luar) return;
        bagian.push(luar);
        for (var i = 1; i < p.length; i++) { var lubang = cincin(p[i], false); if (lubang) bagian.push(lubang); }
      });
      return bagian.length ? { kelompok: 'poligon', bagian: bagian } : null;
    }
    return null;
  }

  function kepalaShp(dv, tipe, panjang, k) {
    dv.setInt32(0, 9994);
    dv.setInt32(24, panjang / 2);
    dv.setInt32(28, 1000, true);
    dv.setInt32(32, tipe, true);
    for (var j = 0; j < 4; j++) dv.setFloat64(36 + 8 * j, k[j], true);
  }
  /** Berkas .shp dan .shx untuk satu jenis bentuk. */
  function tulisShp(tipe, daftar) {
    var n = daftar.length, isi = new Array(n), total = 100, semua = [Infinity, Infinity, -Infinity, -Infinity];
    daftar.forEach(function (b, i) {
      var titik = 0, k = [Infinity, Infinity, -Infinity, -Infinity];
      b.bagian.forEach(function (p) {
        titik += p.length;
        p.forEach(function (t) {
          if (t[0] < k[0]) k[0] = t[0];
          if (t[1] < k[1]) k[1] = t[1];
          if (t[0] > k[2]) k[2] = t[0];
          if (t[1] > k[3]) k[3] = t[1];
        });
      });
      b.titik = titik;
      b.kotak = k;
      for (var j = 0; j < 2; j++) { semua[j] = Math.min(semua[j], k[j]); semua[j + 2] = Math.max(semua[j + 2], k[j + 2]); }
      isi[i] = tipe === 1 ? 20 : tipe === 8 ? 40 + 16 * titik : 44 + 4 * b.bagian.length + 16 * titik;
      total += 8 + isi[i];
    });
    if (!n) semua = [0, 0, 0, 0];
    var shp = new DataView(new ArrayBuffer(total)), shx = new DataView(new ArrayBuffer(100 + 8 * n)), o = 100;
    kepalaShp(shp, tipe, total, semua);
    kepalaShp(shx, tipe, 100 + 8 * n, semua);
    daftar.forEach(function (b, i) {
      shx.setInt32(100 + 8 * i, o / 2);
      shx.setInt32(104 + 8 * i, isi[i] / 2);
      shp.setInt32(o, i + 1);
      shp.setInt32(o + 4, isi[i] / 2);
      shp.setInt32(o + 8, tipe, true);
      o += 12;
      if (tipe === 1) {
        shp.setFloat64(o, b.bagian[0][0][0], true);
        shp.setFloat64(o + 8, b.bagian[0][0][1], true);
        o += 16;
        return;
      }
      for (var j = 0; j < 4; j++) { shp.setFloat64(o, b.kotak[j], true); o += 8; }
      if (tipe === 8) {
        shp.setInt32(o, b.titik, true);
        o += 4;
      } else {
        shp.setInt32(o, b.bagian.length, true);
        shp.setInt32(o + 4, b.titik, true);
        o += 8;
        var awal = 0;
        b.bagian.forEach(function (p) { shp.setInt32(o, awal, true); o += 4; awal += p.length; });
      }
      b.bagian.forEach(function (p) {
        p.forEach(function (t) { shp.setFloat64(o, t[0], true); shp.setFloat64(o + 8, t[1], true); o += 16; });
      });
    });
    return { shp: new Uint8Array(shp.buffer), shx: new Uint8Array(shx.buffer) };
  }

  /** Nama field dBASE: huruf, angka, garis bawah, paling banyak 10, diawali huruf, tidak kembar. */
  function namaField(asli, dipakai) {
    var s = String(asli || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    if (!/^[A-Za-z]/.test(s)) s = 'F_' + s;
    s = s.slice(0, 10).replace(/_+$/, '') || 'F';
    var nama = s, n = 2;
    while (dipakai[nama.toUpperCase()]) {
      var akhir = '_' + n++;
      nama = s.slice(0, 10 - akhir.length).replace(/_+$/, '') + akhir;
    }
    dipakai[nama.toUpperCase()] = true;
    return nama;
  }
  function desimal(v) {
    if (Number.isInteger(v)) return 0;
    var s = String(Math.abs(v)), e = s.indexOf('e');
    if (e < 0) return Math.min(8, (s.split('.')[1] || '').length);
    return Math.max(0, Math.min(8, (s.slice(0, e).split('.')[1] || '').length - Number(s.slice(e + 1))));
  }
  /** Rancangan satu field: angka (N), tanggal tanpa jam (D), selain itu teks (C, paling panjang 254 byte). */
  function rancangField(nama, nilai) {
    var n = nilai.length, angkaSaja = true, tglSaja = true, ada = false, des = 0, i, v, s;
    for (i = 0; i < n && (angkaSaja || tglSaja); i++) {
      v = nilai[i];
      if (v === '' || v === null || v === undefined) continue;
      ada = true;
      if (typeof v === 'number' && isFinite(v) && Math.abs(v) < 1e15) { tglSaja = false; des = Math.max(des, desimal(v)); }
      else { angkaSaja = false; if (typeof v !== 'string' || !POLA_TGL_SAJA.test(v)) tglSaja = false; }
    }
    var f = { nama: nama, jenis: 'C', lebar: 1, desimal: 0, isi: new Array(n), dipotong: 0 };
    if (ada && angkaSaja) {
      var teks = new Array(n), lebar = 1;
      for (i = 0; i < n; i++) {
        v = nilai[i];
        teks[i] = typeof v === 'number' ? v.toFixed(des) : null;
        if (teks[i] && teks[i].length > lebar) lebar = teks[i].length;
      }
      if (lebar <= 24) {
        f.jenis = 'N'; f.lebar = lebar; f.desimal = des;
        for (i = 0; i < n; i++) f.isi[i] = teks[i] ? ascii(teks[i]) : null;
        return f;
      }
    } else if (ada && tglSaja) {
      f.jenis = 'D'; f.lebar = 8;
      for (i = 0; i < n; i++) { v = nilai[i]; f.isi[i] = typeof v === 'string' && v ? ascii(v.replace(/-/g, '')) : null; }
      return f;
    }
    for (i = 0; i < n; i++) {
      v = nilai[i];
      if (v === '' || v === null || v === undefined) { f.isi[i] = null; continue; }
      s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      var b = utf8(s);
      if (b.length > 254) {
        var potong = 254;
        while (potong > 0 && (b[potong] & 0xc0) === 0x80) potong--;
        b = b.subarray(0, potong);
        f.dipotong++;
      }
      f.isi[i] = b;
      if (b.length > f.lebar) f.lebar = b.length;
    }
    return f;
  }
  /** Berkas .dbf (dBASE III) dari rancangan field. */
  function tulisDbf(fields, n) {
    var lebarRekam = 1;
    fields.forEach(function (f) { lebarRekam += f.lebar; });
    var kepala = 32 + 32 * fields.length + 1, total = kepala + n * lebarRekam + 1;
    var u8 = new Uint8Array(total), dv = new DataView(u8.buffer), kini = new Date();
    u8[0] = 3;
    u8[1] = kini.getFullYear() - 1900;
    u8[2] = kini.getMonth() + 1;
    u8[3] = kini.getDate();
    dv.setUint32(4, n, true);
    dv.setUint16(8, kepala, true);
    dv.setUint16(10, lebarRekam, true);
    fields.forEach(function (f, j) {
      var o = 32 + 32 * j;
      for (var c = 0; c < f.nama.length; c++) u8[o + c] = f.nama.charCodeAt(c);
      u8[o + 11] = f.jenis.charCodeAt(0);
      u8[o + 16] = f.lebar;
      u8[o + 17] = f.desimal;
    });
    u8[kepala - 1] = 0x0d;
    u8.fill(0x20, kepala, total - 1);
    for (var i = 0, o = kepala; i < n; i++, o += lebarRekam) {
      var p = o + 1;
      for (var j = 0; j < fields.length; j++) {
        var f = fields[j], b = f.isi[i];
        if (b) u8.set(b, f.jenis === 'N' ? p + f.lebar - b.length : p);
        p += f.lebar;
      }
    }
    u8[total - 1] = 0x1a;
    return u8;
  }

  /** Set Shapefile dari daftar { bentuk, nilai } (nilai sejajar dengan kolom). Bentuk campuran dipecah per jenis. */
  function setShapefile(dasar, kolom, fitur) {
    var kelompok = {}, urut = [], pakai = kolom.slice(0, 254), berkas = [], peta = [];
    var hasil = { berkas: berkas, jumlah: {}, dipotong: 0, kolomLebih: kolom.length - pakai.length };
    fitur.forEach(function (f) {
      var k = f.bentuk.kelompok;
      if (!kelompok[k]) { kelompok[k] = []; urut.push(k); }
      kelompok[k].push(f);
    });
    urut.forEach(function (k) {
      var daftar = kelompok[k], nama = urut.length > 1 ? dasar + '_' + k : dasar, dipakai = {};
      var fields = pakai.map(function (h, c) {
        return rancangField(namaField(h, dipakai), daftar.map(function (f) { return f.nilai[c]; }));
      });
      if (!fields.length) fields = [rancangField('ID', daftar.map(function (f, i) { return i + 1; }))];
      var g = tulisShp(TIPE_SHP[k], daftar.map(function (f) { return f.bentuk; }));
      berkas.push({ nama: nama + '.shp', isi: g.shp }, { nama: nama + '.shx', isi: g.shx }, { nama: nama + '.dbf', isi: tulisDbf(fields, daftar.length) },
        { nama: nama + '.prj', isi: PRJ_WGS84 }, { nama: nama + '.cpg', isi: 'UTF-8' });
      hasil.jumlah[k] = daftar.length;
      fields.forEach(function (f, c) {
        hasil.dipotong += f.dipotong;
        if (!peta[c]) peta[c] = [f.nama, pakai[c] === undefined ? 'nomor urut' : pakai[c], JENIS_FIELD[f.jenis] + ' (' + f.jenis + ' ' + f.lebar + (f.desimal ? '.' + f.desimal : '') + ')'];
      });
    });
    if (urut.length) berkas.push({ nama: dasar + '_kolom.csv', isi: csvTeks(['Field', 'Kolom asli', 'Jenis'], peta) });
    return hasil;
  }

  /** Data tabel: titik dari kolom X dan Y. Kolom X dan Y tetap ikut sebagai atribut. */
  function shapefileData(r, dasar) {
    var titik = titikBaris(r);
    r.titikAda = titik.length;
    return setShapefile(dasar, r.kolom, titik.map(function (t) { return { bentuk: { kelompok: 'titik', bagian: [[[t.x, t.y]]] }, nilai: t.row }; }));
  }

  /** Lapisan GeoJSON apa pun: atribut dari properti semua fitur, fitur tanpa bentuk dilewati. */
  function shapefileGeojson(gj, dasar) {
    var fitur = gj && Array.isArray(gj.features) ? gj.features : [], kolom = [], ada = {}, daftar = [], lewat = 0;
    fitur.forEach(function (f) {
      Object.keys((f && f.properties) || {}).forEach(function (k) { if (!ada[k]) { ada[k] = true; kolom.push(k); } });
    });
    fitur.forEach(function (f) {
      var b = null;
      try { b = bentukShp(f && f.geometry); } catch (e) { b = null; }
      if (!b) { lewat++; return; }
      var p = f.properties || {};
      daftar.push({ bentuk: b, nilai: kolom.map(function (k) { return p[k] === null || p[k] === undefined ? '' : p[k]; }) });
    });
    var hasil = setShapefile(dasar, kolom, daftar);
    hasil.lewat = lewat;
    return hasil;
  }

  function simpanBerkas(blob, nama) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url;
    a.download = nama;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  /* ---------- lapisan peta (berkas publik, tanpa Mesin Data) ---------- */
  function statusLapisan(teks, galat) {
    var s = $('statusLapisan');
    if (!s) return;
    s.textContent = teks;
    s.classList.toggle('status--galat', !!galat);
  }

  function gambarLapisan() {
    var ul = $('daftarLapisan');
    ul.innerHTML = LAPISAN.map(function (l, i) {
      return '<li><b>' + esc(l.judul) + '</b><p>' + esc(l.ket) + '</p><div class="lapisan-tombol">' +
        '<button type="button" class="tombol tombol--hantu tombol--kecil" data-lapisan="' + i + '" data-format="geojson" aria-label="Unduh ' + esc(l.judul) + ' sebagai GeoJSON">' + IKON.unduh + 'GeoJSON</button>' +
        '<button type="button" class="tombol tombol--hantu tombol--kecil" data-lapisan="' + i + '" data-format="shp" aria-label="Unduh ' + esc(l.judul) + ' sebagai Shapefile">' + IKON.unduh + 'Shapefile</button>' +
        '</div></li>';
    }).join('');
    ul.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lapisan]');
      if (!b || b.disabled) return;
      var l = LAPISAN[Number(b.getAttribute('data-lapisan'))], shp = b.getAttribute('data-format') === 'shp', asli = b.innerHTML;
      b.disabled = true;
      b.innerHTML = PUTAR + (shp ? 'Menyusun' : 'Mengunduh');
      statusLapisan('');
      var ambil = fetch(l.url, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return shp ? r.json() : r.blob();
      });
      var kerja = shp ? Promise.all([ambil, muatSheetJS()]).then(function (x) {
        var dasar = l.berkas.replace(/\.geojson$/, ''), s = shapefileGeojson(x[0], dasar);
        if (!s.berkas.length) throw new Error('lapisan ini tidak berisi bentuk yang bisa disimpan sebagai Shapefile');
        var isi = Object.keys(s.jumlah).map(function (k) { return angka(s.jumlah[k]) + ' ' + k; });
        s.berkas.push({ nama: 'KETERANGAN.txt', isi: '﻿' + [l.judul, '', 'Sumber: ' + new URL(l.url, location.href).href, 'Isi: ' + daftarTeks(isi) + (s.lewat ? ' (' + s.lewat + ' fitur tanpa bentuk dilewati)' : ''), '']
          .concat(catatanShp(s.dipotong, s.kolomLebih).slice(1).filter(function (t) { return t.indexOf('X dan Y') < 0; })).join('\r\n') + '\r\n' });
        simpanBerkas(zip(s.berkas), dasar + '.shp.zip');
        statusLapisan(l.judul + ': ' + daftarTeks(isi) + ' disimpan sebagai ' + dasar + '.shp.zip.');
      }).catch(function (err) {
        statusLapisan('Shapefile ' + l.judul + ' gagal disusun: ' + err.message + '. Coba lagi, atau unduh GeoJSON-nya.', true);
      }) : ambil.then(function (blob) {
        simpanBerkas(new Blob([blob], { type: 'application/geo+json' }), l.berkas);
      }).catch(function () {
        window.open(l.url, '_blank', 'noopener');
      });
      kerja.then(function () {
        b.disabled = false;
        b.innerHTML = asli;
      });
    });
  }

  /* ---------- mulai ---------- */
  function mulai() {
    gambarLapisan();
    window.addEventListener('hashchange', function () { terapkanAlamat(false); });
    if (!window.SDTGerbang || !window.SDTGerbang.aktif) {
      main.innerHTML = '<div class="info"><h2>Login hub belum aktif</h2><p>Unduh Data memakai akun Tanya Data untuk memeriksa siapa yang mengunduh. Isi TANYA_DATA di data/sumber.js agar halaman ini bisa dipakai. Lapisan peta di bawah tetap bisa diunduh.</p></div>';
      return;
    }
    window.addEventListener('sdt-sesi', function (e) {
      if (e.detail && !S.kat) muatKatalog();
      else if (e.detail && S.kat && S.kat.nama !== e.detail.nama) { S.kat = null; muatKatalog(); }
    });
    if (window.SDTGerbang.sesi()) muatKatalog();
    else main.innerHTML = memuatHtml('Menunggu login…');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
