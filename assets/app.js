/* Satu Data Tambora, tampilan ala PS5: deretan ubin tema, foto latar besar, sorotan tema,
   baris kartu, pustaka, dan penampil layar penuh.
   Isi dibaca dari Google Sheets (link di data/sumber.js) atau salinan cadangan data/konten/*.csv. */
(function () {
  'use strict';

  var TAB = ['Pengaturan', 'Tema', 'Item'];
  var KOLOM_WAJIB = { Pengaturan: ['kunci', 'nilai'], Tema: ['id', 'judul'], Item: ['tema', 'judul', 'url'] };
  var BATAS_WAKTU = 8000;
  var KUNCI_SIMPAN = 'sdt-konten-v1';
  var WARNA_BERANDA = '#9db8ff', WARNA_PUSTAKA = '#d7dce6';

  var JENIS = {
    aplikasi: { label: 'Aplikasi', ikon: 'aplikasi' },
    peta: { label: 'Peta', ikon: 'peta' },
    grafik: { label: 'Grafik', ikon: 'grafik' },
    presentasi: { label: 'Presentasi', ikon: 'presentasi' },
    data: { label: 'Data', ikon: 'data' },
    dokumen: { label: 'Dokumen', ikon: 'dokumen' },
    folder: { label: 'Folder', ikon: 'folder' },
    tautan: { label: 'Tautan', ikon: 'tautan' }
  };
  var URUT_JENIS = ['aplikasi', 'peta', 'grafik', 'presentasi', 'data', 'dokumen', 'folder', 'tautan'];
  var KATEGORI_SINGKAT = {
    'Penyuluhan dan Pemberdayaan Masyarakat': 'Penyuluhan',
    'Penjagaan Jalur Pendakian dan ODTWA': 'Jalur pendakian'
  };

  var $ = function (id) { return document.getElementById(id); };
  var ikon = window.SENI.ikon;
  var M = null;       // isi yang sudah disusun
  var ASAL = '';      // sheets | simpanan | simpanan-gagal | cadangan | cadangan-gagal
  var HASIL = {};     // angka pantauan yang sudah termuat
  var S = { pilih: 'beranda', tampilan: '', latar: '', penampil: null, jenis: '', tema: '', fokusCari: false };

  /* ---------- alat bantu ---------- */
  function bersih(s) { return String(s == null ? '' : s).replace(/ /g, ' ').trim(); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ya(s) { return /^(ya|y|yes|true|1)$/i.test(bersih(s)); }
  function tampil(r) { return !/^(tidak|no|false|0|sembunyi)$/i.test(bersih(r.tampil)); }
  function normal(s) { return bersih(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function slug(s) {
    return normal(s).replace(/&/g, ' dan ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }
  // Hanya link http(s) atau berkas di repo ini yang dipakai.
  function aman(url) {
    url = bersih(url);
    if (/^https?:\/\/[^\s"'<>]+$/i.test(url)) return url;
    if (/^[\w-]+(\/[\w.-]+)*\.[a-z0-9]+$/i.test(url) && url.indexOf('..') < 0) return url;
    return '';
  }
  function warna(s) {
    s = bersih(s);
    if (/^#[0-9a-f]{6}$/i.test(s)) return s;
    if (/^#[0-9a-f]{3}$/i.test(s)) return '#' + s.slice(1).split('').map(function (c) { return c + c; }).join('');
    return '';
  }
  function posisi(s) {
    s = bersih(s).toLowerCase();
    return /^((\d{1,3}%|left|right|center|top|bottom)\s*){1,2}$/.test(s) ? s : '';
  }
  function fmt(x, d) {
    return Number(x).toLocaleString('id-ID', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 });
  }
  function tanggal(s, denganJam) {
    if (!s) return '';
    var d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T12:00:00+08:00' : s);
    if (isNaN(d)) return '';
    var o = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Makassar' };
    if (denganJam) { o.hour = '2-digit'; o.minute = '2-digit'; }
    return d.toLocaleString('id-ID', o);
  }
  function gerak() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }

  /* ---------- membaca CSV & Google Sheets ---------- */
  function bacaCsv(teks) {
    var baris = [], sel = '', row = [], kutip = false, i, c;
    teks = teks.replace(/^﻿/, '');
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
    if (!baris.length) return [];
    var kepala = baris[0].map(function (h) { return bersih(h).toLowerCase(); });
    return baris.slice(1).filter(function (r) { return r.some(function (v) { return bersih(v) !== ''; }); }).map(function (r) {
      var o = {};
      kepala.forEach(function (h, j) { if (h) o[h] = bersih(r[j]); });
      return o;
    });
  }

  function idSheet(link) {
    var m = bersih(link).match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    return /^[a-zA-Z0-9_-]{20,}$/.test(bersih(link)) ? bersih(link) : '';
  }
  function idDrive(url) {
    var m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)([a-zA-Z0-9_-]{10,})/);
    return m ? m[1] : '';
  }

  function ambil(url) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, BATAS_WAKTU);
    return fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined }).then(function (res) {
      clearTimeout(t);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }, function (e) { clearTimeout(t); throw e; });
  }
  function muatDari(alamat) {
    return Promise.all(TAB.map(function (tab) {
      return ambil(alamat(tab)).then(function (teks) {
        var rows = bacaCsv(teks);
        var kolom = rows.length ? Object.keys(rows[0]) : [];
        var kurang = KOLOM_WAJIB[tab].filter(function (k) { return kolom.indexOf(k) < 0; });
        if (!rows.length || kurang.length) throw new Error('Tab ' + tab + ' tidak terbaca');
        return rows;
      });
    })).then(function (hasil) {
      var d = {};
      TAB.forEach(function (tab, i) { d[tab] = hasil[i]; });
      return d;
    });
  }
  function alamatSheets(id) {
    return function (tab) {
      return 'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent(tab);
    };
  }
  function alamatCadangan(tab) { return 'data/konten/' + tab + '.csv'; }
  function bacaSimpanan(id) {
    try {
      var o = JSON.parse(localStorage.getItem(KUNCI_SIMPAN));
      return o && o.id === id && o.data ? o.data : null;
    } catch (e) { return null; }
  }
  function simpan(id, data) {
    try { localStorage.setItem(KUNCI_SIMPAN, JSON.stringify({ id: id, waktu: Date.now(), data: data })); } catch (e) { /* penyimpanan tidak tersedia */ }
  }

  /* ---------- link: gambar, sematan, jenis ---------- */
  function srcGambar(src, kecil) {
    src = aman(src);
    if (!src) return '';
    var id = idDrive(src);
    if (id) return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + (kecil ? 720 : 1920);
    if (kecil && /^assets\/foto\/[^/]+\.jpe?g$/i.test(src)) return src.replace(/\.(jpe?g)$/i, '-kecil.$1');
    return src;
  }
  // Link Google/GitHub Pages -> alamat yang bisa ditampilkan di dalam dashboard. Kosong = buka di tab baru.
  function alamatSematan(url, jenis) {
    var m;
    if (!url || jenis === 'tautan' || /^https?:\/\/(www\.)?github\.com\//i.test(url)) return '';
    if ((m = url.match(/docs\.google\.com\/presentation\/d\/([\w-]{20,})/))) return 'https://docs.google.com/presentation/d/' + m[1] + '/embed?start=false&loop=false&delayms=5000';
    if (/docs\.google\.com\/spreadsheets\/d\/e\//.test(url)) return url;
    if ((m = url.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]{20,})/))) return 'https://docs.google.com/spreadsheets/d/' + m[1] + '/preview';
    if ((m = url.match(/docs\.google\.com\/document\/d\/([\w-]{20,})/))) return 'https://docs.google.com/document/d/' + m[1] + '/preview';
    if ((m = url.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([\w-]{10,})/))) return 'https://drive.google.com/embeddedfolderview?id=' + m[1] + '#grid';
    if ((m = url.match(/drive\.google\.com\/open\?(?:[^#]*&)?id=([\w-]{10,})/))) {
      return jenis === 'data' ? 'https://docs.google.com/spreadsheets/d/' + m[1] + '/preview' : 'https://drive.google.com/file/d/' + m[1] + '/preview';
    }
    if ((m = url.match(/drive\.google\.com\/file\/d\/([\w-]{10,})/))) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
    if ((m = url.match(/google\.com\/maps\/d\/(?:u\/\d+\/)?(?:edit|viewer|embed)\?(?:[^#]*&)?mid=([\w-]{10,})/))) return 'https://www.google.com/maps/d/embed?mid=' + m[1];
    return url;
  }
  function tebakJenis(url) {
    if (/\.github\.io\//i.test(url)) return 'aplikasi';
    if (/google\.com\/maps\/d\//i.test(url)) return 'peta';
    if (/chartiframe|pubchart/i.test(url)) return 'grafik';
    if (/docs\.google\.com\/presentation/i.test(url)) return 'presentasi';
    if (/docs\.google\.com\/spreadsheets/i.test(url)) return 'data';
    if (/drive\.google\.com\/drive\/(u\/\d+\/)?folders/i.test(url)) return 'folder';
    if (/drive\.google\.com|docs\.google\.com\/document|\.pdf($|\?)/i.test(url)) return 'dokumen';
    return 'tautan';
  }
  function repoUrl(s) {
    var m = bersih(s).match(/^(?:https?:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
    return m ? 'https://github.com/' + m[1] + '/' + m[2] : '';
  }

  /* ---------- menyusun isi ---------- */
  function susun(d) {
    var atur = {};
    d.Pengaturan.forEach(function (r) { var k = bersih(r.kunci).toLowerCase(); if (k) atur[k] = bersih(r.nilai); });
    atur.judul = atur.judul || 'Satu Data Tambora';

    var tema = [], temaById = {};
    d.Tema.filter(tampil).forEach(function (r) {
      var id = slug(r.id);
      if (!id || id === 'beranda' || id === 'pustaka' || temaById[id]) return;
      var t = {
        id: id, judul: bersih(r.judul) || id, label: bersih(r.label), ringkas: bersih(r.ringkas),
        ikon: window.SENI.IKON[bersih(r.ikon)] ? bersih(r.ikon) : 'gunung',
        warna: warna(r.warna) || WARNA_BERANDA, gambar: aman(r.gambar), fokus: posisi(r.fokus),
        kredit: bersih(r.kredit), sorotan: bersih(r.sorotan).split(/\s*;\s*/).filter(Boolean), item: []
      };
      tema.push(t);
      temaById[id] = t;
    });

    var item = [], itemById = {};
    d.Item.filter(tampil).forEach(function (r) {
      var url = aman(r.url), judul = bersih(r.judul);
      if (!url || !judul) return;
      var jenis = bersih(r.jenis).toLowerCase();
      if (!JENIS[jenis]) jenis = tebakJenis(url);
      var dasar = slug(judul) || 'isi', id = dasar, n = 2;
      while (itemById[id] || id === 'pustaka') id = dasar + '-' + n++;
      var t = temaById[slug(r.tema)] || null;
      var x = {
        id: id, tema: t ? t.id : '', judul: judul, jenis: jenis, url: url, ket: bersih(r.keterangan),
        kelompok: bersih(r.kelompok), gambar: aman(r.gambar), repo: repoUrl(r.repo), utama: ya(r.utama),
        sematan: alamatSematan(url, jenis)
      };
      x.cari = normal([x.judul, x.ket, x.kelompok, t ? t.judul : '', JENIS[jenis].label].join(' '));
      item.push(x);
      itemById[id] = x;
      if (t) t.item.push(x);
    });
    tema.forEach(function (t) { t.utama = t.item.filter(function (x) { return x.utama; })[0] || t.item[0] || null; });
    return { atur: atur, tema: tema, temaById: temaById, item: item, itemById: itemById };
  }

  function temaBeranda() {
    return {
      id: 'beranda', judul: M.atur.judul, label: M.atur.subjudul || '', ringkas: M.atur.sambutan || '',
      ikon: 'beranda', warna: WARNA_BERANDA, gambar: aman(M.atur.gambar_beranda), fokus: '', kredit: '', sorotan: []
    };
  }
  function temaPustaka() {
    var jumlah = {};
    M.item.forEach(function (x) { jumlah[x.jenis] = (jumlah[x.jenis] || 0) + 1; });
    return {
      id: 'pustaka', judul: 'Pustaka', label: 'Semua isi',
      ringkas: 'Semua aplikasi, peta, grafik, presentasi, data, dan dokumen dalam satu daftar. Cari dengan kata kunci atau saring menurut jenis dan tema.',
      ikon: 'pustaka', warna: WARNA_PUSTAKA, gambar: '', fokus: '', kredit: '',
      sorotan: URUT_JENIS.filter(function (j) { return jumlah[j]; }).map(function (j) { return jumlah[j] + ' ' + JENIS[j].label.toLowerCase(); })
    };
  }
  function ambilTema(id) {
    if (id === 'beranda') return temaBeranda();
    if (id === 'pustaka') return temaPustaka();
    return M.temaById[id] || null;
  }
  function semuaUbin() { return [temaBeranda()].concat(M.tema, [temaPustaka()]); }

  /* ---------- potongan tampilan ---------- */
  function hrefItem(x, temaId) {
    return x.sematan ? '#/' + (temaId || x.tema || 'pustaka') + '/' + x.id : x.url;
  }
  function atributLuar(x) { return x.sematan ? '' : ' target="_blank" rel="noopener"'; }
  function seniKartu(x) {
    if (x.gambar) return srcGambar(x.gambar, true);
    var t = M.temaById[x.tema];
    return window.SENI.latar({ warna: t ? t.warna : WARNA_PUSTAKA, benih: x.id, motif: x.jenis, gaya: 'kartu' });
  }
  function kartu(x, opsi) {
    opsi = opsi || {};
    var t = M.temaById[x.tema];
    return '<li><a class="kartu" data-nav="kartu" data-item="' + x.id + '" href="' + esc(hrefItem(x, opsi.tema)) + '"' + atributLuar(x) + '>' +
      '<span class="kartu-seni"><img src="' + esc(seniKartu(x)) + '" alt="" loading="lazy" decoding="async">' +
      '<span class="kartu-jenis">' + ikon(JENIS[x.jenis].ikon) + JENIS[x.jenis].label + '</span>' +
      (x.sematan ? '' : '<span class="kartu-luar" title="Dibuka di tab baru">' + ikon('luar') + '<span class="sr">, dibuka di tab baru</span></span>') +
      '</span>' +
      (opsi.denganTema && t ? '<span class="kartu-tema">' + esc(t.judul) + '</span>' : '') +
      '<span class="kartu-judul">' + esc(x.judul) + '</span>' +
      (x.ket ? '<span class="kartu-ket">' + esc(x.ket) + '</span>' : '') + '</a></li>';
  }

  function seniUbin(t) {
    var isi;
    if (t.id === 'beranda' && !t.gambar) isi = '<span class="seni-langit"><img src="assets/foto/panorama-kecil.webp" alt="" decoding="async"></span>';
    else if (t.id === 'pustaka') isi = '<span class="seni-pustaka"></span>';
    else if (t.gambar) isi = '<img src="' + esc(srcGambar(t.gambar, true)) + '" alt="" decoding="async"' + (t.fokus ? ' style="object-position:' + esc(t.fokus) + '"' : '') + '>';
    else isi = '<img src="' + esc(window.SENI.latar({ warna: t.warna, benih: t.id, gaya: 'tema' })) + '" alt="">';
    return isi + '<span class="ubin-ikon">' + ikon(t.ikon) + '</span>';
  }

  function gambarDeret() {
    $('deret').innerHTML = semuaUbin().map(function (t) {
      return '<button type="button" class="ubin ubin--' + t.id + '" role="tab" id="ubin-' + t.id + '" data-id="' + t.id + '" data-nav="ubin" ' +
        'aria-selected="false" aria-controls="sorot" tabindex="-1"><span class="ubin-seni">' + seniUbin(t) + '</span>' +
        '<span class="ubin-nama">' + esc(t.judul) + '</span></button>';
    }).join('');
  }

  /* ---------- sorotan (hero) ---------- */
  function tombolAksi(t) {
    if (t.id === 'beranda') {
      var awal = M.tema[0];
      return (awal ? '<a class="tombol tombol--utama" href="#/' + awal.id + '" data-pilih="' + awal.id + '" data-nav="aksi">' + ikon('main') + '<strong>Mulai jelajah</strong></a>' : '') +
        '<a class="tombol tombol--kaca" href="#/pustaka" data-nav="aksi">' + ikon('pustaka') + '<strong>Pustaka</strong></a>';
    }
    if (t.id === 'pustaka') {
      return '<a class="tombol tombol--utama" href="#/pustaka" data-nav="aksi">' + ikon('pustaka') + '<strong>Buka Pustaka</strong></a>';
    }
    var u = t.utama;
    if (!u) return '<p class="sorot-kosong">Belum ada isi untuk tema ini.</p>';
    return '<a class="tombol tombol--utama" href="' + esc(hrefItem(u, t.id)) + '"' + atributLuar(u) + ' data-nav="aksi">' + ikon('main') +
      '<strong>Buka</strong><span>' + esc(u.judul) + '</span></a>' +
      '<button type="button" class="tombol tombol--kaca tombol--bulat" data-menu="' + u.id + '" data-tema="' + t.id + '" data-nav="aksi" ' +
      'aria-haspopup="menu" aria-expanded="false" aria-label="Pilihan lain untuk ' + esc(u.judul) + '">' + ikon('lainnya') + '</button>';
  }

  function gambarSorot(t) {
    var pil = t.sorotan || [];
    $('sorot').innerHTML = '<div class="sorot-teks">' +
      (t.label ? '<p class="sorot-label">' + esc(t.label) + '</p>' : '') +
      '<h1 class="sorot-judul">' + esc(t.judul) + '</h1>' +
      (t.ringkas ? '<p class="sorot-ringkas">' + esc(t.ringkas) + '</p>' : '') +
      (pil.length ? '<ul class="pil">' + pil.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="aksi">' + tombolAksi(t) + '</div></div>' +
      '<div class="pantau" id="pantau" aria-live="polite"></div>' +
      (t.kredit ? '<p class="kredit">' + esc(t.kredit) + '</p>' : '');
    $('sorot').setAttribute('aria-labelledby', 'ubin-' + t.id);
    isiPantauan(t);
  }

  /* ---------- angka terkini ---------- */
  var tokenPantau = 0;
  var LABEL_RINGKAS = { rbm: 'Capaian RBM', smart: 'Observasi SMART', karhut: 'Areal terbakar' };

  function daftarBatang(judul, list, teks, maks) {
    var m = maks || Math.max.apply(null, list.map(function (r) { return r.nilai; }).concat([1]));
    return '<p class="stat-kecil">' + esc(judul) + '</p><ul class="batang">' + list.map(function (r) {
      var p = Math.max(0, Math.min(100, r.nilai / m * 100));
      return '<li title="' + esc((r.penuh || r.nama) + ': ' + teks(r)) + '"><span class="batang-nama">' + esc(r.nama) + '</span>' +
        '<span class="batang-jalur"><i style="width:' + p.toFixed(1) + '%"></i></span><span class="batang-nilai">' + esc(teks(r)) + '</span></li>';
    }).join('') + '</ul>';
  }

  // Areal baru per delineasi: kolom tipis satu warna, delineasi terakhir paling tegas.
  function kolomRiwayat(r) {
    var akhir = r.slice(-12), m = Math.max.apply(null, akhir.map(function (x) { return x.baru; }).concat([1]));
    return '<p class="stat-kecil">Areal baru per delineasi</p><div class="kolom" role="img" aria-label="Areal baru per delineasi, ' +
      akhir.length + ' delineasi terakhir">' + akhir.map(function (x, i) {
        return '<span title="' + esc(tanggal(x.tanggal)) + ': +' + fmt(x.baru) + ' ha"' + (i === akhir.length - 1 ? ' class="kini"' : '') + '>' +
          '<i style="height:' + Math.max(3, x.baru / m * 100).toFixed(1) + '%"></i></span>';
      }).join('') + '</div><div class="kolom-sumbu"><span>' + esc(tanggal(akhir[0].tanggal)) + '</span><span>' +
      esc(tanggal(akhir[akhir.length - 1].tanggal)) + '</span></div>';
  }

  var PANEL = {
    rbm: function (d) {
      return '<div class="panel-kaca"><p class="stat-label">Capaian terverifikasi ' + d.tahun + '</p>' +
        '<p class="stat-nilai">' + fmt(d.capaian) + '<small>%</small></p>' +
        '<div class="meter" role="img" aria-label="Capaian ' + fmt(d.capaian) + ' persen dari target tahunan"><i style="width:' + Math.min(100, d.capaian).toFixed(1) + '%"></i></div>' +
        '<p class="stat-sub">' + d.tercapai + ' dari ' + d.kegiatan + ' kegiatan tercapai · ' + d.menunggu + ' laporan menunggu verifikasi</p>' +
        daftarBatang('Capaian per resor', d.perResor, function (r) { return fmt(r.nilai) + '%'; }, 100) +
        '<p class="stat-catatan">Data per ' + esc(tanggal(d.diperbarui, true)) + ' · dihitung sama dengan Dashboard Capaian RBM</p></div>';
    },
    smart: function (d) {
      var atas = d.kategori.slice(0, 5).map(function (k) { return { nama: KATEGORI_SINGKAT[k.nama] || k.nama, penuh: k.nama, nilai: k.nilai }; });
      return '<div class="panel-kaca"><p class="stat-label">Observasi patroli ' + d.tahun + '</p>' +
        '<p class="stat-nilai">' + fmt(d.observasi) + '</p>' +
        '<p class="stat-sub">' + fmt(d.titik) + ' titik temuan (waypoint)</p>' +
        (atas.length ? daftarBatang('Kategori terbanyak', atas, function (r) { return fmt(r.nilai); }) : '') +
        '<p class="stat-catatan">Dihitung dari data Dashboard SMART Patrol</p></div>';
    },
    karhut: function (d) {
      var manual = d.sumber === 'delineasi';
      var persen = d.luasKawasan ? fmt(d.terbakar / d.luasKawasan * 100, 1) + '% luas kawasan' : '';
      var akhir = manual && d.riwayat.length > 1 ? d.riwayat[d.riwayat.length - 1] : null; // satu delineasi: tambahan = total
      var peta = M.item.filter(function (x) { return /peta_terbakar\.html/.test(x.url); })[0];
      return '<div class="panel-kaca"><p class="stat-label">' + (manual ? 'Areal terbakar' : 'Bekas terbakar') + ' musim ini' +
        (d.cakupan === 'kawasan' ? ' di kawasan TN' : '') + '</p>' +
        '<p class="stat-nilai">' + fmt(d.terbakar) + '<small> ha</small></p>' +
        '<p class="stat-sub">' + [d.awalMusim ? 'Sejak ' + esc(tanggal(d.awalMusim)) : '', persen,
          akhir ? '+' + fmt(akhir.baru) + ' ha pada delineasi ' + esc(tanggal(akhir.tanggal)) : ''].filter(Boolean).join(' · ') + '</p>' +
        (d.perResor.length ? daftarBatang('Per resor', d.perResor, function (r) { return fmt(r.nilai) + ' ha'; }) : '') +
        (manual && d.riwayat.length > 1 ? kolomRiwayat(d.riwayat) : '') +
        '<p class="stat-catatan">' + (manual
          ? 'Delineasi manual, ' + d.jumlah + ' kali sejak awal musim · terakhir ' + esc(tanggal(d.tanggal))
          : 'Estimasi otomatis dari citra Sentinel-2 (uji coba) · citra terakhir ' + esc(tanggal(d.citra || d.tanggal))) +
        (peta ? ' · <a href="' + esc(hrefItem(peta, 'karhut')) + '"' + atributLuar(peta) + '>Lihat peta</a>' : '') + '</p></div>';
    }
  };

  function isiRingkas(id, d, gagal) {
    var t = M.temaById[id], label = LABEL_RINGKAS[id], nilai = '', sub = '';
    if (d && id === 'rbm') { nilai = fmt(d.capaian) + '<small>%</small>'; sub = d.tahun + ' · ' + d.tercapai + ' dari ' + d.kegiatan + ' kegiatan tercapai'; }
    if (d && id === 'smart') { nilai = fmt(d.observasi); sub = d.tahun + ' · ' + fmt(d.titik) + ' titik temuan'; }
    if (d && id === 'karhut') {
      nilai = fmt(d.terbakar) + '<small> ha</small>';
      sub = d.sumber === 'delineasi' ? 'Delineasi ' + tanggal(d.tanggal) : 'Musim ini' + (d.cakupan === 'kawasan' ? ' di kawasan TN' : '') + ' (estimasi)';
    }
    return '<span class="stat-ikon" style="--warna-ikon:' + t.warna + '">' + ikon(t.ikon) + '</span>' +
      '<span class="stat-label">' + esc(label) + '</span>' +
      (d ? '<span class="stat-nilai stat-nilai--sedang">' + nilai + '</span><span class="stat-sub">' + esc(sub) + '</span>'
        : gagal ? '<span class="stat-nilai stat-nilai--sedang">–</span><span class="stat-sub">Belum bisa dimuat</span>'
          : '<span class="kerangka"></span><span class="kerangka kerangka--pendek"></span>');
  }

  function isiPantauan(t) {
    var wadah = $('pantau'), token = ++tokenPantau;
    if (!wadah) return;
    var P = window.PANTAUAN;
    if (t.id === 'beranda') {
      var ids = ['rbm', 'smart', 'karhut'].filter(function (id) { return M.temaById[id] && P && P.ada(id); });
      if (!ids.length) { wadah.hidden = true; return; }
      wadah.className = 'pantau pantau--ringkas';
      wadah.innerHTML = '<p class="stat-kecil">Pantauan terkini</p><div class="ringkas-grid">' + ids.map(function (id) {
        return '<a class="stat-ubin" id="ringkas-' + id + '" href="#/' + id + '" data-pilih="' + id + '" data-nav="aksi">' + isiRingkas(id, HASIL[id]) + '</a>';
      }).join('') + '</div>';
      ids.forEach(function (id) {
        if (HASIL[id]) return;
        P.ambil(id).then(function (d) {
          HASIL[id] = d;
          var el = token === tokenPantau && $('ringkas-' + id);
          if (el) el.innerHTML = isiRingkas(id, d);
        }, function () {
          var el = token === tokenPantau && $('ringkas-' + id);
          if (el) el.innerHTML = isiRingkas(id, null, true);
        });
      });
      return;
    }
    if (!P || !P.ada(t.id) || !PANEL[t.id]) { wadah.hidden = true; return; }
    if (HASIL[t.id]) { wadah.innerHTML = PANEL[t.id](HASIL[t.id]); return; }
    wadah.innerHTML = '<div class="panel-kaca"><span class="kerangka kerangka--besar"></span><span class="kerangka"></span><span class="kerangka kerangka--pendek"></span></div>';
    P.ambil(t.id).then(function (d) {
      HASIL[t.id] = d;
      if (token === tokenPantau) wadah.innerHTML = PANEL[t.id](d);
    }, function () {
      if (token === tokenPantau) wadah.innerHTML = '<div class="panel-kaca pantau-gagal">Angka terkini belum bisa dimuat. Buka aplikasinya untuk melihat data lengkap.</div>';
    });
  }

  /* ---------- baris kartu ---------- */
  function gambarIsi(t) {
    var baris = [];
    if (t.id === 'beranda') {
      baris.push({ judul: 'Aplikasi kerja', item: M.item.filter(function (x) { return x.jenis === 'aplikasi'; }), denganTema: true });
      baris.push({ judul: 'Peta', item: M.item.filter(function (x) { return x.jenis === 'peta'; }), denganTema: true });
    } else if (t.id !== 'pustaka') {
      var urut = [], grup = {};
      t.item.forEach(function (x) {
        var k = x.kelompok || JENIS[x.jenis].label;
        if (!grup[k]) { grup[k] = []; urut.push(k); }
        grup[k].push(x);
      });
      baris = urut.map(function (k) { return { judul: k, item: grup[k] }; });
    }
    $('isi').innerHTML = baris.filter(function (b) { return b.item.length; }).map(function (b, i) {
      return '<section class="baris" aria-labelledby="baris-' + i + '"><div class="baris-kepala">' +
        '<h2 id="baris-' + i + '">' + esc(b.judul) + ' <small>' + b.item.length + '</small></h2>' +
        '<div class="baris-geser"><button type="button" class="geser" data-geser="-1" tabindex="-1" aria-label="Geser ke kiri">' + ikon('kiri') + '</button>' +
        '<button type="button" class="geser" data-geser="1" tabindex="-1" aria-label="Geser ke kanan">' + ikon('kanan') + '</button></div></div>' +
        '<ul class="gulir">' + b.item.map(function (x) { return kartu(x, { tema: t.id === 'beranda' ? '' : t.id, denganTema: b.denganTema }); }).join('') + '</ul></section>';
    }).join('');
    cekGeser();
  }

  function cekGeser() {
    Array.prototype.forEach.call(document.querySelectorAll('.baris'), function (b) {
      var g = b.querySelector('.gulir'), maks = g.scrollWidth - g.clientWidth - 2;
      b.classList.toggle('bisa-geser', maks > 0);
      b.querySelector('[data-geser="-1"]').disabled = g.scrollLeft <= 2;
      b.querySelector('[data-geser="1"]').disabled = g.scrollLeft >= maks;
    });
  }

  /* ---------- latar ---------- */
  var lapis = [], lapisAktif = 0, tokenLatar = 0;

  function gambarLatar(t) {
    var img;
    if (t.id === 'beranda' && !t.gambar) {
      var langit = document.createElement('div');
      langit.className = 'latar-langit';
      langit.innerHTML = '<img class="latar-bintang" alt="" src="' + window.SENI.langit('tambora') + '">' +
        '<img class="latar-panorama" alt="" decoding="async" src="assets/foto/' + (innerWidth < 900 ? 'panorama-kecil' : 'panorama') + '.webp">';
      img = langit.querySelector('.latar-panorama');
      siapkan(img);
      return langit;
    }
    if (t.id === 'pustaka') {
      var foto = M.tema.filter(function (x) { return x.gambar; }).map(function (x) { return srcGambar(x.gambar, true); });
      var kolase = document.createElement('div');
      kolase.className = 'latar-kolase';
      var h = '';
      for (var i = 0; foto.length && i < 24; i++) h += '<img alt="" decoding="async" src="' + esc(foto[(i * 5) % foto.length]) + '">';
      kolase.innerHTML = h;
      return kolase;
    }
    img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.className = 'latar-foto';
    if (t.fokus) img.style.objectPosition = t.fokus;
    img.src = t.gambar ? srcGambar(t.gambar, false) : window.SENI.latar({ warna: t.warna, benih: t.id, gaya: 'tema' });
    siapkan(img);
    return img;
  }
  function siapkan(img) {
    var tandai = function () { img.classList.add('siap'); };
    if (img.complete && img.naturalWidth) tandai();
    else { img.addEventListener('load', tandai); img.addEventListener('error', tandai); }
  }

  function gantiLatar(t) {
    if (S.latar === t.id) return;
    S.latar = t.id;
    var token = ++tokenLatar;
    var baru = lapis[1 - lapisAktif], lama = lapis[lapisAktif];
    baru.innerHTML = '';
    baru.style.backgroundColor = window.SENI.campur(t.warna, '#04060b', 0.86);
    baru.appendChild(gambarLatar(t));
    baru.classList.add('tampil');
    lama.classList.remove('tampil');
    lapisAktif = 1 - lapisAktif;
    setTimeout(function () { if (token === tokenLatar) lama.innerHTML = ''; }, 1000);
  }

  function muatTetangga(id) {
    var daftar = semuaUbin(), i = daftar.map(function (t) { return t.id; }).indexOf(id);
    var jalan = function () {
      [daftar[i - 1], daftar[i + 1]].forEach(function (t) {
        if (t && t.gambar) { var im = new Image(); im.decoding = 'async'; im.src = srcGambar(t.gambar, false); }
      });
    };
    if (window.requestIdleCallback) requestIdleCallback(jalan, { timeout: 1500 }); else setTimeout(jalan, 400);
  }

  /* ---------- memilih tema ---------- */
  function judulHalaman(awal) { document.title = (awal ? awal + ' · ' : '') + M.atur.judul; }

  function pilihTema(id, opsi) {
    opsi = opsi || {};
    var t = ambilTema(id);
    if (!t) { id = 'beranda'; t = ambilTema(id); }
    var berubah = S.pilih !== id || opsi.paksa;
    S.pilih = id;
    Array.prototype.forEach.call(document.querySelectorAll('.ubin'), function (b) {
      var aktif = b.getAttribute('data-id') === id;
      b.setAttribute('aria-selected', aktif ? 'true' : 'false');
      b.tabIndex = aktif ? 0 : -1;
    });
    document.documentElement.style.setProperty('--aksen', t.warna);
    if (berubah || !$('sorot').firstChild) { gambarSorot(t); gambarIsi(t); }
    gantiLatar(t);
    muatTetangga(id);
    var b = $('ubin-' + id);
    if (opsi.fokus && b) b.focus({ preventScroll: true });
    gulirUbin(b);
    if (opsi.alamat !== false) gantiAlamat(id === 'beranda' ? '#/' : '#/' + id);
    if (!S.penampil) judulHalaman(id === 'beranda' ? '' : t.judul);
  }

  // Bila deretan lebih lebar dari layar, ubin terpilih ditaruh di posisi kedua (satu ubin sebelumnya tetap terlihat).
  function gulirUbin(b) {
    var d = $('deret');
    if (!b || d.scrollWidth <= d.clientWidth + 1) return;
    var i = Array.prototype.indexOf.call(d.children, b);
    var gaya = getComputedStyle(d), jarak = parseFloat(gaya.columnGap) || 14;
    var ubin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ubin')) || 74;
    d.scrollTo({ left: Math.max(0, (i - 1) * (ubin + jarak)), behavior: gerak() });
  }

  /* ---------- pustaka ---------- */
  function gambarSaring() {
    var jumlah = {};
    M.item.forEach(function (x) { jumlah[x.jenis] = (jumlah[x.jenis] || 0) + 1; });
    var chip = function (attr, nilai, label, aktif) {
      return '<button type="button" class="chip" data-nav="chip" ' + attr + '="' + nilai + '" aria-pressed="' + (aktif ? 'true' : 'false') + '">' + label + '</button>';
    };
    $('saringJenis').innerHTML = chip('data-jenis', '', 'Semua <small>' + M.item.length + '</small>', !S.jenis) +
      URUT_JENIS.filter(function (j) { return jumlah[j]; }).map(function (j) {
        return chip('data-jenis', j, ikon(JENIS[j].ikon) + JENIS[j].label + ' <small>' + jumlah[j] + '</small>', S.jenis === j);
      }).join('');
    $('saringTema').innerHTML = chip('data-tema', '', 'Semua tema', !S.tema) +
      M.tema.filter(function (t) { return t.item.length; }).map(function (t) {
        return chip('data-tema', t.id, '<i class="titik" style="background:' + t.warna + '"></i>' + esc(t.judul), S.tema === t.id);
      }).join('');
  }
  function saring() {
    var kata = normal($('cari').value).split(/\s+/).filter(Boolean);
    var hasil = M.item.filter(function (x) {
      return (!S.jenis || x.jenis === S.jenis) && (!S.tema || x.tema === S.tema) &&
        kata.every(function (k) { return x.cari.indexOf(k) >= 0; });
    });
    $('gridPustaka').innerHTML = hasil.map(function (x) { return kartu(x, { tema: 'pustaka', denganTema: true }); }).join('');
    $('pustakaKosong').hidden = hasil.length > 0;
    $('pustakaHitung').textContent = hasil.length === M.item.length ? M.item.length + ' isi' : hasil.length + ' dari ' + M.item.length + ' isi';
  }
  function gambarPustaka() { gambarSaring(); saring(); }

  /* ---------- tampilan & rute ---------- */
  function gantiAlamat(hash) {
    if (location.hash !== hash && !(hash === '#/' && !location.hash)) history.replaceState(null, '', hash);
  }
  function alamatSekarang() {
    if (S.tampilan === 'pustaka') return '#/pustaka';
    return S.pilih === 'beranda' ? '#/' : '#/' + S.pilih;
  }

  function tampilkan(v) {
    if (S.tampilan === v) return;
    S.tampilan = v;
    $('beranda').hidden = v !== 'beranda';
    $('pustaka').hidden = v !== 'pustaka';
    document.body.classList.toggle('mode-pustaka', v === 'pustaka');
    $('tabBeranda').setAttribute('aria-current', v === 'beranda' ? 'page' : 'false');
    $('tabPustaka').setAttribute('aria-current', v === 'pustaka' ? 'page' : 'false');
    if (v === 'pustaka') {
      gambarPustaka();
      var p = temaPustaka();
      document.documentElement.style.setProperty('--aksen', p.warna);
      gantiLatar(p);
      window.scrollTo(0, 0);
      judulHalaman('Pustaka');
    }
  }

  function bacaRute() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var bagian = h.split('/').filter(Boolean).map(function (s) { try { return decodeURIComponent(s); } catch (e) { return s; } });
    return { a: bagian[0] || '', b: bagian[1] || '' };
  }

  function terapkanRute(dariApp) {
    if (!M) return;
    var r = bacaRute();
    var x = r.b ? M.itemById[r.b] : null;
    if (r.a === 'pustaka') {
      tampilkan('pustaka');
      if (S.fokusCari) { S.fokusCari = false; $('cari').focus(); }
    } else {
      var id = M.temaById[r.a] ? r.a : 'beranda';
      var kembali = S.tampilan !== 'beranda';
      tampilkan('beranda');
      pilihTema(id, { alamat: false, paksa: kembali && !$('sorot').firstChild });
      if (r.a && !M.temaById[r.a]) gantiAlamat('#/');
    }
    if (x && x.sematan) {
      if (!S.penampil || S.penampil.item !== x) bukaPenampil(x, dariApp);
    } else {
      if (S.penampil) tutupPenampil();
      if (r.b) gantiAlamat(alamatSekarang());
    }
  }

  /* ---------- penampil layar penuh ---------- */
  function bukaPenampil(x, dariApp) {
    var t = M.temaById[x.tema];
    var wadah = $('penampilIsi'), lama = wadah.querySelector('iframe');
    if (lama) lama.remove();
    S.penampil = { item: x, dariApp: !!dariApp, muat: 0, fokus: S.penampil ? S.penampil.fokus : document.activeElement };
    $('penampilJudul').textContent = x.judul;
    $('penampilTema').textContent = (t ? t.judul + ' · ' : '') + JENIS[x.jenis].label;
    $('penampilBaru').href = x.url;
    $('penampilMemuat').hidden = false;
    $('penampilPetunjuk').hidden = true;
    var f = document.createElement('iframe');
    f.title = x.judul;
    f.allow = 'fullscreen; clipboard-write; geolocation';
    f.setAttribute('allowfullscreen', '');
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    var tunda = setTimeout(function () { $('penampilPetunjuk').hidden = false; }, 9000);
    f.addEventListener('load', function () {
      if (!S.penampil || S.penampil.item !== x) return;
      S.penampil.muat++;
      clearTimeout(tunda);
      $('penampilMemuat').hidden = true;
    });
    f.src = x.sematan;
    wadah.appendChild(f);
    var p = $('penampil');
    p.hidden = false;
    $('halaman').inert = true;
    document.body.classList.add('ada-penampil');
    requestAnimationFrame(function () { p.classList.add('buka'); });
    $('penampilTutup').focus();
    judulHalaman(x.judul);
  }

  function tutupPenampil() {
    if (!S.penampil) return;
    var asal = S.penampil.fokus;
    S.penampil = null;
    var p = $('penampil');
    p.classList.remove('buka');
    p.hidden = true;
    var f = $('penampilIsi').querySelector('iframe');
    if (f) f.remove();
    $('halaman').inert = false;
    document.body.classList.remove('ada-penampil');
    if (asal && document.contains(asal) && asal.focus) asal.focus({ preventScroll: true });
    var t = S.tampilan === 'pustaka' ? 'Pustaka' : (S.pilih === 'beranda' ? '' : ambilTema(S.pilih).judul);
    judulHalaman(t);
  }

  // Tombol kembali: pakai riwayat browser bila penampil dibuka dari dalam dashboard dan halaman di dalamnya belum berpindah.
  function tutupLewatTombol() {
    if (!S.penampil) return;
    if (S.penampil.dariApp && S.penampil.muat <= 1) {
      var sebelum = location.hash;
      history.back();
      setTimeout(function () {
        if (S.penampil && location.hash === sebelum) { gantiAlamat(alamatSekarang()); tutupPenampil(); }
      }, 400);
    } else {
      gantiAlamat(alamatSekarang());
      tutupPenampil();
    }
  }

  /* ---------- menu pilihan lain ---------- */
  function bukaMenu(tombol) {
    var x = M.itemById[tombol.getAttribute('data-menu')];
    if (!x) return;
    var m = $('menuLain');
    var tautan = location.href.split('#')[0] + '#/' + (tombol.getAttribute('data-tema') || x.tema || 'pustaka') + '/' + x.id;
    m.innerHTML = '<a role="menuitem" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + ikon('luar') + 'Buka di tab baru</a>' +
      (x.repo ? '<a role="menuitem" href="' + esc(x.repo) + '" target="_blank" rel="noopener">' + ikon('github') + 'Lihat kode di GitHub</a>' : '') +
      (x.sematan ? '<button type="button" role="menuitem" data-salin="' + esc(tautan) + '">' + ikon('salin') + 'Salin tautan dashboard</button>' : '');
    m.hidden = false;
    var r = tombol.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
    var kiri = Math.min(Math.max(8, r.left), innerWidth - w - 8);
    var atas = r.bottom + 10 + h > innerHeight - 8 ? r.top - h - 10 : r.bottom + 10;
    m.style.left = kiri + 'px';
    m.style.top = Math.max(8, atas) + 'px';
    tombol.setAttribute('aria-expanded', 'true');
    S.tombolMenu = tombol;
    m.querySelector('[role="menuitem"]').focus();
  }
  function tutupMenu(kembalikanFokus) {
    var m = $('menuLain');
    if (m.hidden) return;
    m.hidden = true;
    if (S.tombolMenu) {
      S.tombolMenu.setAttribute('aria-expanded', 'false');
      if (kembalikanFokus && document.contains(S.tombolMenu)) S.tombolMenu.focus();
    }
    S.tombolMenu = null;
  }
  function salin(teks) {
    var ok = function () { kabar('Tautan disalin'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(teks).then(ok, function () { salinLama(teks); ok(); });
    else { salinLama(teks); ok(); }
  }
  function salinLama(teks) {
    var t = document.createElement('textarea');
    t.value = teks;
    t.setAttribute('readonly', '');
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); } catch (e) { /* tidak didukung */ }
    t.remove();
  }
  function kabar(teks) {
    var k = $('kabar');
    k.textContent = teks;
    k.classList.add('tampil');
    clearTimeout(kabar.t);
    kabar.t = setTimeout(function () { k.classList.remove('tampil'); }, 2200);
  }

  /* ---------- navigasi dengan tombol panah (seperti stik konsol) ---------- */
  function terlihat(el) { return !!(el.offsetWidth || el.offsetHeight) && !el.closest('[hidden]'); }
  function cariArah(asal, arah) {
    var a = asal.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    var terbaik = null, skorTerbaik = Infinity, semua = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < semua.length; i++) {
      var el = semua[i];
      if (el === asal || !terlihat(el)) continue;
      var b = el.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2, skor;
      if (arah === 'kanan' || arah === 'kiri') {
        if (b.bottom <= a.top + 2 || b.top >= a.bottom - 2) continue;
        var dx = arah === 'kanan' ? bx - ax : ax - bx;
        if (dx <= 1) continue;
        skor = dx + Math.abs(by - ay) * 2;
      } else {
        if (arah === 'bawah' ? by <= ay + 2 : by >= ay - 2) continue;
        var dy = arah === 'bawah' ? b.top - a.bottom : a.top - b.bottom;
        if (dy < -Math.min(a.height, b.height) / 2) continue;
        skor = Math.max(0, dy) + Math.abs(bx - ax) * 0.35;
      }
      if (skor < skorTerbaik) { skorTerbaik = skor; terbaik = el; }
    }
    return terbaik;
  }
  function fokuskan(el) {
    el.focus({ preventScroll: true });
    if (el.classList.contains('ubin') || el.closest('#sorot')) {
      if (window.scrollY > 0 && el.classList.contains('ubin')) window.scrollTo({ top: 0, behavior: gerak() });
      else el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: gerak() });
    } else el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: gerak() });
  }

  function tekanTombol(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var a = document.activeElement;
    var menu = $('menuLain');
    if (!menu.hidden) {
      var butir = Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]')), i = butir.indexOf(a);
      if (e.key === 'Escape') { e.preventDefault(); tutupMenu(true); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        butir[(i + (e.key === 'ArrowDown' ? 1 : butir.length - 1)) % butir.length].focus();
      } else if (e.key === 'Tab') tutupMenu(false);
      return;
    }
    if (S.penampil) {
      if (e.key === 'Escape') { e.preventDefault(); tutupLewatTombol(); }
      return;
    }
    var diInput = a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable);
    if (e.key === '/' && !diInput) { e.preventDefault(); keCari(); return; }
    if (diInput) {
      if (a.id === 'cari' && e.key === 'Escape' && a.value) { a.value = ''; saring(); }
      else if (a.id === 'cari' && e.key === 'ArrowDown') {
        var bawah = cariArah(a, 'bawah');
        if (bawah) { e.preventDefault(); fokuskan(bawah); }
      }
      return;
    }
    if (e.key === 'Escape' && S.tampilan === 'pustaka') { e.preventDefault(); location.hash = S.pilih === 'beranda' || S.pilih === 'pustaka' ? '#/' : '#/' + S.pilih; return; }
    var ubin = a && a.classList && a.classList.contains('ubin');
    if (ubin && (e.key === 'Home' || e.key === 'End')) {
      var semua = document.querySelectorAll('.ubin');
      e.preventDefault();
      fokuskan(semua[e.key === 'Home' ? 0 : semua.length - 1]);
      return;
    }
    if (ubin && e.key === 'Enter') {
      var utama = document.querySelector('#sorot .tombol--utama');
      if (utama) { e.preventDefault(); fokuskan(utama); }
      return;
    }
    var arah = { ArrowLeft: 'kiri', ArrowRight: 'kanan', ArrowUp: 'atas', ArrowDown: 'bawah' }[e.key];
    if (!arah) return;
    if (!a || a === document.body) {
      if (S.tampilan === 'beranda') { e.preventDefault(); fokuskan($('ubin-' + S.pilih)); }
      return;
    }
    if (!a.hasAttribute('data-nav')) return;
    var tujuan = ubin && arah === 'bawah' ? document.querySelector('#sorot [data-nav]') || cariArah(a, arah) : cariArah(a, arah);
    if (tujuan && tujuan.classList.contains('ubin') && !ubin) tujuan = $('ubin-' + S.pilih);
    if (tujuan) { e.preventDefault(); fokuskan(tujuan); }
    else if (ubin) e.preventDefault(); // jangan menggulir halaman (dan memotong animasi gulir ke atas)
  }

  function keCari() {
    if (S.tampilan === 'pustaka') { $('cari').focus(); $('cari').select(); return; }
    S.fokusCari = true;
    location.hash = '#/pustaka';
  }

  /* ---------- kaki halaman, jam, gulir ---------- */
  function teksAsal() {
    return {
      sheets: 'Isi dibaca langsung dari Google Sheets.',
      simpanan: 'Isi dari Google Sheets (salinan terakhir di perangkat ini, sedang diperbarui).',
      'simpanan-gagal': 'Google Sheets sedang tidak terbaca; memakai salinan terakhir di perangkat ini.',
      cadangan: 'Isi dari salinan cadangan di repo. Google Sheets belum disambungkan.',
      'cadangan-gagal': 'Google Sheets tidak terbaca; memakai salinan cadangan di repo.'
    }[ASAL] || '';
  }
  function gambarKaki() {
    var gh = repoUrl(M.atur.github);
    $('kaki').innerHTML = '<div class="kaki-merek"><img src="assets/img/logo.png" alt="Logo kementerian dan logo Taman Nasional Tambora" width="96" height="49">' +
      '<div><strong>' + esc(M.atur.judul) + '</strong><span>' + esc(M.atur.subjudul || '') + '</span></div></div>' +
      (M.atur.pengelola ? '<p>' + esc(M.atur.pengelola) + '</p>' : '') +
      '<p class="kaki-asal"><span id="kakiAsal">' + esc(teksAsal()) + '</span>' +
      (gh ? ' <a href="' + esc(gh) + '" target="_blank" rel="noopener">' + ikon('github') + 'Kode di GitHub</a>' : '') + '</p>' +
      '<p class="kaki-kunci">Navigasi: tombol panah untuk berpindah, Enter untuk membuka, / untuk mencari, Esc untuk kembali.</p>';
  }
  function aturAsal(a) {
    ASAL = a;
    var el = $('kakiAsal');
    if (el) el.textContent = teksAsal();
  }

  function jalankanJam() {
    var el = $('jam');
    var fm;
    try { fm = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' }); }
    catch (e) { fm = null; }
    var detak = function () {
      var d = new Date();
      el.textContent = fm ? fm.format(d) : ('0' + d.getHours()).slice(-2) + '.' + ('0' + d.getMinutes()).slice(-2);
      el.setAttribute('datetime', d.toISOString());
    };
    detak();
    setInterval(detak, 15000);
  }

  function pasangGulirHalaman() {
    var jalan = false, akar = document.documentElement;
    var hitung = function () {
      jalan = false;
      var y = window.scrollY || 0;
      akar.style.setProperty('--gelap', Math.min(1, y / ((window.innerHeight || 800) * 0.5)).toFixed(3));
      document.body.classList.toggle('tergulir', y > 8);
    };
    window.addEventListener('scroll', function () { if (!jalan) { jalan = true; requestAnimationFrame(hitung); } }, { passive: true });
    hitung();
  }

  /* ---------- memasang isi ---------- */
  function pasang(data, asal) {
    var lama = M;
    M = susun(data);
    ASAL = asal;
    if (lama) { S.latar = ''; S.tampilan = ''; }
    var fokusUbin = document.activeElement && document.activeElement.classList.contains('ubin');
    gambarDeret();
    gambarKaki();
    S.pilih = M.temaById[S.pilih] || S.pilih === 'pustaka' ? S.pilih : 'beranda';
    $('sorot').innerHTML = '';
    terapkanRute(false);
    if (S.tampilan === 'beranda') pilihTema(S.pilih, { alamat: false, paksa: true, fokus: fokusUbin });
    selesaiMulai();
  }

  function selesaiMulai() {
    var m = $('mulai');
    if (!m || m.classList.contains('selesai')) return;
    m.classList.add('selesai');
    setTimeout(function () { m.remove(); }, 700);
  }

  function gagalTotal(e) {
    console.error(e);
    $('sorot').innerHTML = '<div class="sorot-teks"><p class="sorot-label">Satu Data Tambora</p><h1 class="sorot-judul">Isi belum bisa dimuat</h1>' +
      '<p class="sorot-ringkas">Periksa koneksi internet lalu muat ulang halaman ini.</p>' +
      '<div class="aksi"><button type="button" class="tombol tombol--utama" onclick="location.reload()">' + ikon('main') + '<strong>Muat ulang</strong></button></div></div>';
    selesaiMulai();
  }

  function mulai() {
    var id = idSheet((window.SUMBER || {}).GOOGLE_SHEETS);
    var simpanan = id ? bacaSimpanan(id) : null;
    var dariSheets = id ? muatDari(alamatSheets(id)) : null;
    var cadangan = function () { return muatDari(alamatCadangan); };
    if (simpanan) {
      pasang(simpanan, 'simpanan');
      dariSheets.then(function (d) {
        simpan(id, d);
        if (JSON.stringify(d) !== JSON.stringify(simpanan)) pasang(d, 'sheets');
        else aturAsal('sheets');
      }, function (e) {
        console.warn('Google Sheets tidak bisa dibaca, memakai salinan terakhir:', e);
        aturAsal('simpanan-gagal');
      });
      return;
    }
    var pertama = dariSheets
      ? dariSheets.then(function (d) { simpan(id, d); return [d, 'sheets']; }, function (e) {
        console.warn('Google Sheets tidak bisa dibaca, memakai cadangan:', e);
        return cadangan().then(function (d) { return [d, 'cadangan-gagal']; });
      })
      : cadangan().then(function (d) { return [d, 'cadangan']; });
    pertama.then(function (h) { pasang(h[0], h[1]); }).catch(gagalTotal);
  }

  /* ---------- peristiwa ---------- */
  function pasangPeristiwa() {
    lapis = [$('lapisA'), $('lapisB')];
    Array.prototype.forEach.call(document.querySelectorAll('[data-ikon]'), function (el) {
      el.insertAdjacentHTML('afterbegin', ikon(el.getAttribute('data-ikon')));
    });

    $('deret').addEventListener('focusin', function (e) {
      var b = e.target.closest('.ubin');
      if (b && M) pilihTema(b.getAttribute('data-id'));
    });
    $('deret').addEventListener('click', function (e) {
      var b = e.target.closest('.ubin');
      if (b && M) pilihTema(b.getAttribute('data-id'), { fokus: true });
    });

    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-pilih], [data-menu], [data-geser], [data-salin], [data-jenis], [data-tema]');
      var menu = $('menuLain');
      if (!menu.hidden && !e.target.closest('#menuLain') && !e.target.closest('[data-menu]')) tutupMenu(false);
      if (!el || !M) return;
      if (el.hasAttribute('data-pilih')) {
        e.preventDefault();
        if (S.tampilan !== 'beranda') location.hash = '#/' + el.getAttribute('data-pilih');
        else { window.scrollTo({ top: 0, behavior: gerak() }); pilihTema(el.getAttribute('data-pilih'), { fokus: true }); }
      } else if (el.hasAttribute('data-menu')) {
        e.preventDefault();
        if (!menu.hidden && S.tombolMenu === el) tutupMenu(true); else { tutupMenu(false); bukaMenu(el); }
      } else if (el.hasAttribute('data-geser')) {
        var g = el.closest('.baris').querySelector('.gulir');
        g.scrollBy({ left: Number(el.getAttribute('data-geser')) * g.clientWidth * 0.85, behavior: gerak() });
      } else if (el.hasAttribute('data-salin')) {
        salin(el.getAttribute('data-salin'));
        tutupMenu(true);
      } else if (el.hasAttribute('data-jenis') && el.classList.contains('chip')) {
        S.jenis = el.getAttribute('data-jenis');
        gambarSaring(); saring();
        var j = document.querySelector('#saringJenis [data-jenis="' + S.jenis + '"]');
        if (j) j.focus();
      } else if (el.hasAttribute('data-tema') && el.classList.contains('chip')) {
        S.tema = el.getAttribute('data-tema');
        gambarSaring(); saring();
        var tm = document.querySelector('#saringTema [data-tema="' + S.tema + '"]');
        if (tm) tm.focus();
      }
    });
    $('menuLain').addEventListener('click', function (e) {
      if (e.target.closest('a[role="menuitem"]')) tutupMenu(false);
    });

    document.addEventListener('scroll', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('gulir')) cekGeser();
    }, true);
    var tundaUkur;
    window.addEventListener('resize', function () { clearTimeout(tundaUkur); tundaUkur = setTimeout(cekGeser, 150); });

    $('cari').addEventListener('input', saring);
    $('tombolCari').addEventListener('click', keCari);
    $('penampilTutup').addEventListener('click', tutupLewatTombol);
    $('lompat').addEventListener('click', function () {
      var t = S.tampilan === 'pustaka' ? $('cari') : document.querySelector('#sorot .tombol--utama') || $('ubin-' + S.pilih);
      if (t) t.focus();
    });
    window.addEventListener('hashchange', function () { terapkanRute(true); });
    document.addEventListener('keydown', tekanTombol);
  }

  pasangPeristiwa();
  jalankanJam();
  pasangGulirHalaman();
  mulai();
})();
