/* Unduh Data · Satu Data Tambora.
   Daftar data dibaca dari aplikasi web Mesin Data (apps-script/mesin-data), spreadsheet tempat seluruh data
   Satu Data Tambora berkumpul. Login memakai sesi Tanya Data (assets/gerbang.js); Mesin Data memeriksa token dan
   peran pemakai ke Tanya Data, jadi kolom data pribadi hanya ikut terunduh oleh akun admin.
   Berkas Excel, CSV, dan GeoJSON disusun di browser (SheetJS dimuat hanya saat dibutuhkan).
   Alamat aplikasi web: window.SUMBER.UNDUH_DATA, atau baris berkunci "unduh_data" di tab Pengaturan Sheet konten.
   Tautan langsung: #tema=<kode induk> (mis. #tema=kehati), #data=<id>[,<id>], #peta. */
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
  var FASET = [
    ['Jenis kegiatan', 'Jenis kegiatan'],
    ['Resor', 'Resor'],
    ['SPTN', 'SPTN'],
    ['Kategori 0', 'Kategori temuan'],
    ['Kategori 1', 'Subkategori temuan'],
    ['Kelompok jenis', 'Kelompok jenis'],
    ['Sumber', 'Sumber data']
  ];
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
    kunci: '<svg class="data-ikon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>'
  };
  var PUTAR = '<span class="memuat-cincin kecil" aria-hidden="true"></span>';
  var POLA_TGL = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/;

  var S = {
    api: '', kat: null, byId: {}, pilih: {}, format: 'xlsx',
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
      return panggil({ aksi: 'katalog' }, 90000).then(function (j) {
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
    S.byId = {};
    k.dataset.forEach(function (d) { S.byId[d.id] = d; });
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
    var baris = k.dataset.reduce(function (a, d) { return a + (Number(d.jumlah) || 0); }, 0);
    $('kakiData').textContent = 'Katalog: ' + k.dataset.length + ' data, ' + angka(baris) + ' baris' + (k.diperbarui ? ', diperbarui ' + tglId(k.diperbarui) + ' WITA.' : '.');
  }

  /* ---------- simpanan pilihan (hanya di perangkat ini) ---------- */
  function bacaSimpanan() {
    try {
      var o = JSON.parse(localStorage.getItem(KUNCI_SIMPAN) || 'null');
      if (!o) return;
      (o.pilih || []).forEach(function (id) { if (S.byId[id] && !S.byId[id].terkunci) S.pilih[id] = true; });
      if (['xlsx', 'csv', 'geojson'].indexOf(o.format) >= 0) S.format = o.format;
    } catch (e) { /* penyimpanan tidak tersedia */ }
  }
  function simpan() {
    try { localStorage.setItem(KUNCI_SIMPAN, JSON.stringify({ pilih: Object.keys(S.pilih), format: S.format })); } catch (e) { /* biarkan */ }
  }

  /** #tema=kehati, #data=id1,id2 memilih data; #peta menggulir ke lapisan peta. */
  function terapkanAlamat(awal) {
    var h = '';
    try { h = decodeURIComponent(location.hash.replace(/^#\/?/, '')); } catch (e) { h = ''; }
    if (h === 'peta') { setTimeout(function () { var p = $('peta'); p.scrollIntoView({ block: 'start' }); p.focus({ preventScroll: true }); }, awal ? 300 : 0); return; }
    var m = /^(tema|data)=(.+)$/.exec(h);
    if (!m || !S.kat) return;
    var nilai = m[2].split(',').map(function (s) { return s.trim(); }).filter(String), pilih = {};
    S.kat.dataset.forEach(function (d) {
      if (d.terkunci) return;
      if (m[1] === 'data' ? nilai.indexOf(d.id) >= 0 : nilai.indexOf(d.induk) >= 0 || nilai.indexOf(d.tema) >= 0) pilih[d.id] = true;
    });
    if (!Object.keys(pilih).length) return;
    S.pilih = pilih;
    if (!awal) { gambarDaftar(); pilihanBerubah(); }
  }

  /* ---------- kerangka halaman ---------- */
  function kelompok() {
    var urut = {}, grup = {}, hasil = [];
    (S.kat.tema || []).forEach(function (t, i) { urut[t.kode] = { i: i, warna: t.warna, nama: t.nama }; });
    S.kat.dataset.forEach(function (d) {
      var t = urut[d.induk], nama = d.tema || (t && t.nama) || 'Lainnya';
      if (!grup[nama]) { grup[nama] = { nama: nama, i: t ? t.i : 999, warna: t ? t.warna : '', data: [] }; hasil.push(grup[nama]); }
      grup[nama].i = Math.min(grup[nama].i, t ? t.i : 999);
      grup[nama].data.push(d);
    });
    return hasil.sort(function (a, b) { return a.i - b.i || (a.nama < b.nama ? -1 : 1); });
  }

  function gambarHalaman() {
    var k = S.kat, admin = k.peran === 'admin';
    main.innerHTML =
      '<section class="pembuka">' +
        '<div><h1>Unduh Data</h1><p>Semua data yang terkumpul di Mesin Data Satu Data Tambora: patroli SMART, temuan kehati, kebakaran hutan, penyuluhan, RBM, dan lainnya. Pilih data, saring bila perlu, lalu unduh sebagai Excel, CSV, atau GeoJSON. Lapisan peta ada di bagian bawah halaman.</p></div>' +
        '<div class="pembuka-meta">' +
          (k.diperbarui ? '<span class="lencana">Diperbarui <b>' + esc(tglId(k.diperbarui)) + '</b></span>' : '') +
          '<span class="lencana' + (admin ? ' lencana--admin' : '') + '">' + esc(k.nama || 'Pegawai') + ' · ' + (admin ? 'Admin' : 'Pegawai') + '</span>' +
        '</div>' +
      '</section>' +
      '<div class="tata">' +
        '<div class="tata-utama">' +
          '<section class="kotak" id="bagData" aria-labelledby="judulData">' +
            '<div class="kotak-kepala"><h2 id="judulData"><span class="langkah" aria-hidden="true">1</span>Pilih data</h2>' +
              '<label class="isian cari-data">' + IKON.cari + '<span class="sr">Cari nama data</span><input type="search" id="cariData" placeholder="Cari nama data" autocomplete="off"></label></div>' +
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
            pilihFormat('xlsx', 'Excel') + pilihFormat('csv', 'CSV') + pilihFormat('geojson', 'GeoJSON') +
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
    xlsx: 'Satu berkas .xlsx: satu lembar per data, ditambah lembar Keterangan berisi saringan dan sumber.',
    csv: 'Satu berkas per data, zip bila lebih dari satu. Pemisah koma, untuk QGIS, R, atau Python. Untuk dibuka di Excel, pilih format Excel.',
    geojson: 'Titik dari data berkoordinat X dan Y (WGS 84), untuk peta di QGIS atau ArcGIS. Zip bila lebih dari satu data.'
  };
  function pilihFormat(nilai, judul) {
    return '<label><input type="radio" name="format" value="' + nilai + '"' + (S.format === nilai ? ' checked' : '') + '><span>' + esc(judul) + '</span></label>';
  }

  /* ---------- 1. daftar data ---------- */
  function idTerpilih() {
    return S.kat ? S.kat.dataset.filter(function (d) { return S.pilih[d.id] && !d.terkunci; }).map(function (d) { return d.id; }) : [];
  }

  function gambarDaftar() {
    var q = normal(S.cariData).trim(), html = '';
    kelompok().forEach(function (g) {
      var isi = g.data.filter(function (d) { return !q || normal(d.judul + ' ' + d.keterangan + ' ' + g.nama).indexOf(q) >= 0; });
      if (!isi.length) return;
      var bisa = isi.filter(function (d) { return !d.terkunci; });
      html += '<section class="grup" aria-label="' + esc(g.nama) + '">' +
        '<div class="grup-kepala"><span class="grup-titik" style="background:' + esc(/^#[0-9a-f]{3,8}$/i.test(g.warna) ? g.warna : '#8a93a6') + '" aria-hidden="true"></span><h3>' + esc(g.nama) + '</h3>' +
        (bisa.length > 1 ? '<button type="button" class="teks-tombol" data-grup="' + esc(g.nama) + '" data-isi="' + esc(bisa.map(function (d) { return d.id; }).join(',')) + '"></button>' : '') + '</div>' +
        '<div class="data-deret">' + isi.map(kartuData).join('') + '</div></section>';
    });
    $('daftarData').innerHTML = html || '<p class="kosong">Tidak ada data yang cocok dengan "' + esc(S.cariData) + '".</p>';
    perbaruiTombolGrup();
    perbaruiMeta();
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
  }

  function perbaruiTombolGrup() {
    var el = main.querySelectorAll('[data-grup]');
    for (var i = 0; i < el.length; i++) {
      var ids = el[i].getAttribute('data-isi').split(','), semua = ids.every(function (id) { return S.pilih[id]; });
      el[i].textContent = semua ? 'Lepas semua' : 'Pilih semua';
      el[i].setAttribute('aria-label', (semua ? 'Lepas semua data ' : 'Pilih semua data ') + el[i].getAttribute('data-grup'));
    }
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
    var ids = idTerpilih(), total = 0, tunggu = false, html = '', geo = S.format === 'geojson', adaTitik = false;
    ids.forEach(function (id) {
      var d = S.byId[id], h = hitungUntuk(id), ikut = !geo || d.titik;
      if (d.titik) adaTitik = true;
      if (!h) tunggu = true; else if (ikut) total += h.jumlah;
      var catatan = '';
      if (h && h.diabaikan && h.diabaikan.length) catatan += '<span class="lewat">Saringan ' + esc(daftarTeks(h.diabaikan.map(namaFaset))) + ' tidak berlaku untuk data ini.</span>';
      if (!ikut) catatan += '<span class="lewat">Tanpa koordinat, tidak ikut GeoJSON.</span>';
      html += '<li><span class="nm">' + esc(d.judul) + '</span><span class="nl">' + (h ? angka(h.jumlah) : PUTAR + '<span class="sr">menghitung</span>') + '</span>' + catatan + '</li>';
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
    var ids = idTerpilih().filter(function (id) { return format !== 'geojson' || S.byId[id].titik; });
    if (!ids.length) return;
    var harap = 0;
    ids.forEach(function (id) { var h = hitungUntuk(id); harap += h ? h.jumlah : Number(S.byId[id].jumlah) || 0; });
    S.sibuk = true;
    perbaruiRingkas();
    tampilKemajuan(0, 'Menyiapkan unduhan…');
    var hasil = [], selesai = 0;
    var perluPustaka = format === 'xlsx' || ids.length > 1;
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
      var b = susunBerkas(hasil, format, saring);
      simpanBerkas(b.blob, b.nama);
      tampilKemajuan(1, 'Selesai: ' + b.nama + ' (' + ukuran(b.blob.size) + ', ' + angka(selesai) + ' baris). Periksa folder Unduhan.');
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
    return (hasil.length === 1 ? slug(hasil[0].judul) : 'Satu_Data_Tambora') + '_' + hariIni() + '.' + ext;
  }

  function susunBerkas(hasil, format, saring) {
    if (format === 'xlsx') return { blob: bukuExcel(hasil, infoUnduhan(hasil, saring, format)), nama: namaBerkas(hasil, 'xlsx') };
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
      ['Sumber', 'Mesin Data Satu Data Tambora, katalog diperbarui ' + tglId(k.diperbarui || '') + ' WITA'],
      ['Alamat', location.href.split('#')[0]]
    ];
    var tabel = [['Data', 'Baris', 'Saringan tidak berlaku', 'Kolom khusus admin yang tidak ikut', 'Keterangan']];
    hasil.forEach(function (r) {
      var cat = format === 'geojson' ? r.titikAda + ' titik berkoordinat' : '';
      tabel.push([r.judul, r.baris.length, r.diabaikan.map(namaFaset).join(', '), r.khususAdmin.join(', '), [r.d.keterangan || '', cat].filter(String).join(' ')]);
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
    ket['!cols'] = [{ wch: 44 }, { wch: 10 }, { wch: 24 }, { wch: 36 }, { wch: 80 }];
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

  function geojson(r) {
    var iX = r.kolom.indexOf('X'), iY = r.kolom.indexOf('Y'), fitur = [];
    r.baris.forEach(function (row) {
      var x = Number(row[iX]), y = Number(row[iY]);
      if (row[iX] === '' || row[iY] === '' || !isFinite(x) || !isFinite(y) || (x === 0 && y === 0)) return;
      var p = {};
      r.kolom.forEach(function (h, i) { if (i !== iX && i !== iY) p[h] = row[i] === '' ? null : row[i]; });
      fitur.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [x, y] }, properties: p });
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
      CFB.utils.cfb_add(z, nama, enc.encode(f.isi), { mt: kini });
    });
    return new Blob([CFB.write(z, { fileType: 'zip', type: 'array', compression: true })], { type: 'application/zip' });
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
  function gambarLapisan() {
    var ul = $('daftarLapisan');
    ul.innerHTML = LAPISAN.map(function (l, i) {
      return '<li><b>' + esc(l.judul) + '</b><p>' + esc(l.ket) + '</p>' +
        '<button type="button" class="tombol tombol--hantu tombol--kecil" data-lapisan="' + i + '" aria-label="Unduh ' + esc(l.judul) + ' (GeoJSON)">' + IKON.unduh + 'GeoJSON</button></li>';
    }).join('');
    ul.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lapisan]');
      if (!b || b.disabled) return;
      var l = LAPISAN[Number(b.getAttribute('data-lapisan'))], asli = b.innerHTML;
      b.disabled = true;
      b.innerHTML = PUTAR + 'Mengunduh';
      fetch(l.url, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.blob();
      }).then(function (blob) {
        simpanBerkas(new Blob([blob], { type: 'application/geo+json' }), l.berkas);
      }).catch(function () {
        window.open(l.url, '_blank', 'noopener');
      }).then(function () {
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
