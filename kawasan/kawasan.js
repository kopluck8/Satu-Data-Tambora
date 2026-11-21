/* Profil Kawasan · Satu Data Tambora.
   Halaman ini tidak punya data sendiri: setiap bagian membaca hasil analisis tab lain.
   - Keanekaragaman Hayati: ../data/kehati/ (temuan LPK + SMART, daftar takson, model MaxEnt, batas kawasan)
   - Resor Pengelolaan:     ../data/resor/  (Laporan Kajian Wilayah Kerja Resor 2026, analisis SMART 2026, sel patroli)
   - Penyuluhan:            ../data/penyuluhan/ (kelompok binaan, laporan kegiatan)
   - Konflik Tenurial:      ../data/tenurial/zonasi.geojson
   Batas resor 2026 sengaja tidak digambar di sini (hanya dipakai tab Resor Pengelolaan); peta memakai batas kawasan dan
   batas resor yang sama dengan tab Keanekaragaman Hayati. */
(function () {
  'use strict';

  var isi = document.getElementById('isi');
  var tip = document.getElementById('tip');
  var KEHATI = '../kehati/index.html', RESOR = '../resor/index.html', PENYULUHAN = '../penyuluhan/index.html', TENURIAL = '../tenurial/index.html';

  /* ================= pembantu ================= */
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var nf = {};
  function n(x, d) {
    if (x === null || x === undefined || x === '' || !isFinite(x)) return '-';
    d = d || 0;
    if (!nf[d]) nf[d] = new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
    return nf[d].format(x);
  }
  function nd(x, d) {
    if (x === null || x === undefined || x === '' || !isFinite(x)) return '-';
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: d === undefined ? 1 : d }).format(x);
  }
  function tgl(s) {
    var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(s || '');
    if (!m) return s || '';
    return (m[3] ? +m[3] + ' ' : '') + ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][+m[2] - 1] + ' ' + m[1];
  }
  function kunci(s) { return String(s || '').toLowerCase().replace(/[^a-z]/g, ''); }
  function rentang(th) { return th ? (th[0] === th[1] ? String(th[0]) : th[0] + '–' + th[1]) : '-'; }

  var IKON = {
    luar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18.5 14v4.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5H10"/></svg>',
    unduh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 19.5h14"/></svg>',
    cari: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>',
    titik: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    rusa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v3l-2 2M8 6l2-2M16 3v3l2 2M16 6l-2-2"/><path d="M8.5 9.5h7l-1 6.5-2.5 4-2.5-4z"/></svg>',
    daun: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10.5 10.5 5 19 5c0 8.5-5.5 14-14 14z"/><path d="M5 19 13.5 10.5"/></svg>',
    daftar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    desa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5h17M5 20.5V11l5-4 5 4v9.5M15 20.5V14h4.5v6.5"/><path d="M8.5 20.5v-4h3v4"/></svg>',
    jalan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20.5 10 3.5M17 20.5 14 3.5M12 6v2M12 11v2M12 16v2"/></svg>',
    gunung: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 18 9 9.5l2.6 3.6L14.5 8l6 10z"/></svg>',
    peta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/></svg>'
  };

  /* ---------- pemuat data ---------- */
  var simpan = {};
  function ambil(path, jenis) {
    if (!simpan[path]) {
      simpan[path] = fetch('../data/' + path, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) { var e = new Error('Server menjawab ' + r.status + ' saat mengambil data/' + path + '.'); e.kode = r.status; throw e; }
        return jenis === 'csv' ? r.text().then(uraiCsv) : r.json().catch(function () { throw new Error('Isi data/' + path + ' bukan JSON yang utuh.'); });
      }).catch(function (e) {
        delete simpan[path];
        if (e instanceof TypeError) e = new Error('Sambungan terputus saat mengambil data/' + path + '.');
        throw e;
      });
    }
    return simpan[path];
  }
  function semua(daftar) { return Promise.all(daftar.map(function (p) { return /\.csv$/.test(p) ? ambil(p, 'csv') : ambil(p); })); }
  function uraiCsv(teks) {
    var baris = [], sel = '', rek = [], kutip = false, i, c;
    teks = teks.replace(/^﻿/, '');
    for (i = 0; i < teks.length; i++) {
      c = teks[i];
      if (kutip) {
        if (c === '"') { if (teks[i + 1] === '"') { sel += '"'; i++; } else kutip = false; }
        else sel += c;
      } else if (c === '"') kutip = true;
      else if (c === ',') { rek.push(sel); sel = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && teks[i + 1] === '\n') i++; rek.push(sel); baris.push(rek); rek = []; sel = ''; }
      else sel += c;
    }
    if (sel || rek.length) { rek.push(sel); baris.push(rek); }
    var kepala = baris.shift() || [];
    return baris.filter(function (r) { return r.length > 1 || r[0]; }).map(function (r) { var o = {}; kepala.forEach(function (k, j) { o[k] = r[j] === undefined ? '' : r[j]; }); return o; });
  }
  function memuat(teks) { isi.innerHTML = '<div class="memuat" role="status"><span class="memuat-cincin" aria-hidden="true"></span>' + esc(teks) + '</div>'; }
  function galat(e) {
    isi.innerHTML = '<div class="galat" role="alert"><h2>Data tidak bisa dimuat</h2><p>' + esc(e && e.message ? e.message : 'Terjadi kesalahan saat mengolah data.') + '</p>' +
      '<p class="redup" style="margin-top:8px">' + (e && e.kode === 404 ? 'Berkas itu belum ada di repo. Bagian ini membaca data dari tab lain, jadi pastikan tab asalnya sudah terunggah.' : 'Periksa sambungan internet lalu coba lagi.') + '</p>' +
      '<p style="margin-top:14px"><button class="tombol" type="button" id="ulang">Coba muat lagi</button></p></div>';
    document.getElementById('ulang').addEventListener('click', function () { aktif = null; arah(); });
    if (window.console) console.error(e);
  }

  /* ---------- potongan tampilan ---------- */
  function judul(kecil, h1, p, sumber) {
    return '<div class="judul-hal"><div class="kecil">' + esc(kecil) + '</div><h1>' + h1 + '</h1>' + (p ? '<p>' + p + '</p>' : '') +
      (sumber && sumber.length ? '<div class="sumber-baris">' + sumber.map(function (s) { return '<a class="sumber" href="' + esc(s[1]) + '">' + IKON.luar + esc(s[0]) + '</a>'; }).join('') + '</div>' : '') + '</div>';
  }
  function angka(label, nilai, sub) { return '<div class="angka"><div class="angka-label">' + label + '</div><div class="angka-nilai">' + nilai + '</div>' + (sub ? '<div class="angka-sub">' + sub + '</div>' : '') + '</div>'; }
  /* baris: [nama, nilai, teks nilai (opsional), warna (opsional)] */
  function batang(baris, satuan, maks) {
    maks = maks || Math.max.apply(null, baris.map(function (b) { return b[1]; }).concat([1]));
    return '<ul class="batang">' + baris.map(function (b) {
      return '<li' + (b[3] ? ' data-warna="' + b[3] + '"' : '') + ' data-tip="' + esc(b[0] + '|' + nd(b[1], 2) + ' ' + satuan) + '"><span class="nm">' + esc(b[0]) + '</span><span class="jalur"><i style="width:' + Math.max(0, b[1] / maks * 100).toFixed(1) + '%"></i></span><span class="nl">' + (b[2] || nd(b[1], 1)) + '</span></li>';
    }).join('') + '</ul>';
  }
  function sumberKecil(teks) { return '<p class="catatan">' + teks + '</p>'; }

  /* ---------- tabel sederhana: urut per kolom dan halaman ---------- */
  function tabel(wadah, o) {
    var urut = o.urut || null, hal = 0, perHal = o.perHal || 25, baris = o.baris;
    function gambar() {
      var data = baris.slice();
      if (urut) {
        var k = o.kolom.filter(function (c) { return c.id === urut.id; })[0];
        data.sort(function (a, b) {
          var x = k.nilai(a), y = k.nilai(b);
          if (x === y) return 0;
          if (x === null || x === undefined || x === '') return 1;
          if (y === null || y === undefined || y === '') return -1;
          return (x < y ? -1 : 1) * (urut.turun ? -1 : 1);
        });
      }
      var jml = Math.max(1, Math.ceil(data.length / perHal));
      if (hal >= jml) hal = jml - 1;
      var tampil = data.slice(hal * perHal, hal * perHal + perHal);
      wadah.innerHTML = '<div class="tabel-wadah"><table><caption class="sr">' + esc(o.label) + '</caption><thead><tr>' + o.kolom.map(function (c) {
        var s = urut && urut.id === c.id ? (urut.turun ? 'descending' : 'ascending') : null;
        return '<th scope="col"' + (c.n ? ' class="n"' : '') + (s ? ' aria-sort="' + s + '"' : '') + '>' + (c.nilai ? '<button type="button" data-urut="' + c.id + '">' + esc(c.judul) + '</button>' : esc(c.judul)) + '</th>';
      }).join('') + '</tr></thead><tbody>' + (tampil.length ? tampil.map(function (b) {
        return '<tr>' + o.kolom.map(function (c, j) { var t = j === 0 ? 'th scope="row"' : 'td'; return '<' + t + (c.n ? ' class="n"' : '') + '>' + c.isi(b) + '</' + t.split(' ')[0] + '>'; }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + o.kolom.length + '" class="redup">' + esc(o.kosong || 'Tidak ada baris yang cocok.') + '</td></tr>') + '</tbody></table></div>' +
        (data.length > perHal ? '<div class="halaman"><span>Baris ' + n(hal * perHal + 1) + '–' + n(Math.min(data.length, (hal + 1) * perHal)) + ' dari ' + n(data.length) + '</span><span class="tombol-deret"><button class="tombol tombol--hantu" type="button" data-hal="-1"' + (hal ? '' : ' disabled') + '>Sebelumnya</button><button class="tombol tombol--hantu" type="button" data-hal="1"' + (hal < jml - 1 ? '' : ' disabled') + '>Berikutnya</button></span></div>' : '');
    }
    wadah.addEventListener('click', function (e) {
      var u = e.target.closest('[data-urut]'), h = e.target.closest('[data-hal]');
      if (u) { var id = u.getAttribute('data-urut'); urut = urut && urut.id === id ? { id: id, turun: !urut.turun } : { id: id, turun: !!(o.kolom.filter(function (c) { return c.id === id; })[0].n) }; hal = 0; gambar(); var b = wadah.querySelector('[data-urut="' + id + '"]'); if (b) b.focus(); }
      if (h) { hal += +h.getAttribute('data-hal'); gambar(); wadah.scrollIntoView({ block: 'nearest' }); }
    });
    gambar();
    return { ganti: function (b) { baris = b; hal = 0; gambar(); } };
  }
  function unduhCsv(nama, kolom, baris) {
    var teks = '﻿' + [kolom.map(function (k) { return k[0]; })].concat(baris.map(function (b) { return kolom.map(function (k) { return k[1](b); }); })).map(function (r) {
      return r.map(function (v) { v = v === null || v === undefined ? '' : String(v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',');
    }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([teks], { type: 'text/csv;charset=utf-8' }));
    a.download = nama; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- tip ---------- */
  function tampilTip(e) {
    var t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) { tip.hidden = true; return; }
    var p = t.getAttribute('data-tip').split('|');
    tip.innerHTML = '<b>' + esc(p[0]) + '</b>' + (p[1] ? esc(p[1]) : '');
    tip.hidden = false;
    var r = t.getBoundingClientRect(), x = e.clientX !== undefined && e.type !== 'focusin' ? e.clientX : r.left + r.width / 2, y = e.clientY !== undefined && e.type !== 'focusin' ? e.clientY : r.top;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px';
    tip.style.top = (y - h - 12 < 8 ? y + 18 : y - h - 12) + 'px';
  }
  document.addEventListener('mousemove', tampilTip);
  document.addEventListener('focusin', tampilTip);
  document.addEventListener('scroll', function () { tip.hidden = true; }, true);

  /* ---------- status jenis ---------- */
  var IUCN = { CR: 'Kritis', EN: 'Genting', VU: 'Rentan', NT: 'Hampir terancam' };
  function lencana(x) {
    var h = '';
    if (x.p106 === 'Dilindungi') h += '<span class="status status--lindung" title="Dilindungi menurut Permen LHK P.106/2018">Dilindungi</span>';
    if (IUCN[x.iucn]) h += '<span class="status status--' + esc(x.iucn) + '" title="Daftar Merah IUCN: ' + esc(IUCN[x.iucn]) + '">' + esc(x.iucn) + '</span>';
    if (x.cites === 'Appendix I' || x.cites === 'Appendix II') h += '<span class="status" title="CITES ' + esc(x.cites) + '">CITES ' + (x.cites === 'Appendix I' ? 'I' : 'II') + '</span>';
    if (x.h === 'Endemik') h += '<span class="status" title="Endemik menurut daftar induk">Endemik</span>';
    if (x.inv) h += '<span class="status status--asing" title="Jenis asing invasif">Invasif</span>';
    else if (x.sb === 'Introduced' || x.h === 'Introduksi') h += '<span class="status status--asing" title="Jenis asing (introduksi)">Asing</span>';
    return h ? '<span class="status-deret">' + h + '</span>' : '';
  }
  var KEL = {
    burung: { nama: 'Burung', warna: '#3987e5' },
    satwa: { nama: 'Mamalia dan fauna lain', warna: '#d95926' },
    tumbuhan: { nama: 'Tumbuhan dan anggrek', warna: '#199e70' },
    lain: { nama: 'Belum terkelompok', warna: '#929381' }
  };
  function kelDari(k) { return k === 'Aves' ? 'burung' : (k === 'Mamalia' || k === 'Fauna lain') ? 'satwa' : (k === 'Flora' || k === 'Anggrek') ? 'tumbuhan' : 'lain'; }
  function namaJenis(x) { return x.i ? '<span class="ilmiah">' + esc(x.i) + (x.t === 'marga' ? ' sp.' : '') + '</span>' : esc(x.n || x.tid); }
  function namaKecil(x) { return x.i ? (x.n || (x.l && x.l[0]) || '') : ''; }
  function tautKehati(tid) { return KEHATI + '#/jenis/' + encodeURIComponent(tid); }
  function kelasAndal(m) { return m.m === 'penuh' ? m.andal : 'indikatif'; }
  var ANDAL = { tinggi: 'Tinggi', berguna: 'Berguna', rendah: 'Rendah', indikatif: 'Indikatif' };

  /* ================= peta ================= */
  var bersih = [];
  function lepas() { bersih.forEach(function (f) { try { f(); } catch (e) { /* sudah dilepas */ } }); bersih = []; }
  function petaGalat(el) { el.innerHTML = '<div class="galat" role="alert" style="margin:20px"><h2>Peta tidak bisa ditampilkan</h2><p>Pustaka peta Leaflet dari cdnjs.cloudflare.com tidak termuat. Angka dan tabel di halaman ini tetap bisa dipakai.</p></div>'; }
  function peta(el, batas, o) {
    o = o || {};
    if (!window.L) { petaGalat(el); return null; }
    var L = window.L;
    var map = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.25, preferCanvas: true });
    var dasar = {
      'Citra satelit': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, maxNativeZoom: 17, attribution: 'Citra © Esri, Maxar, Earthstar Geographics' }),
      'Topografi': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, maxNativeZoom: 17, attribution: 'Peta © Esri' }),
      'OpenStreetMap': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' })
    };
    dasar[o.dasar || 'Citra satelit'].addTo(map);
    map.createPane('raster'); map.getPane('raster').style.zIndex = 350;
    map.createPane('batas'); map.getPane('batas').style.zIndex = 420; map.getPane('batas').style.pointerEvents = 'none';
    var lapis = {};
    lapis['Batas kawasan'] = L.polygon(batas.kawasan, { pane: 'batas', color: '#f0cf7e', weight: 2, fill: false, interactive: false }).addTo(map);
    if (o.resor !== false) {
      lapis['Batas resor'] = L.layerGroup(batas.resor.map(function (r) { return L.polygon(r.cincin, { pane: 'batas', color: '#eee8d5', weight: 1, opacity: .7, dashArray: '5 5', fill: false, interactive: false }); })).addTo(map);
      lapis['Nama resor'] = L.layerGroup(batas.resor.map(function (r) {
        return L.marker(L.polygon(r.cincin).getBounds().getCenter(), { interactive: false, keyboard: false, icon: L.divIcon({ className: 'label-resor', html: esc(r.nama), iconSize: [120, 16] }) });
      })).addTo(map);
    }
    var hasil = { map: map, kendali: L.control.layers(dasar, lapis, { collapsed: true }).addTo(map), batasKawasan: lapis['Batas kawasan'].getBounds() };
    L.control.scale({ imperial: false }).addTo(map);
    map.fitBounds(hasil.batasKawasan, { padding: [12, 12] });
    map.on('click', function () { map.scrollWheelZoom.enable(); });
    map.on('mouseout', function () { map.scrollWheelZoom.disable(); });
    bersih.push(function () { map.remove(); });
    return hasil;
  }
  /* raster MaxEnt (WebP tanpa susut, sama dengan tab Keanekaragaman Hayati) */
  var JENJANG = ['#3fa84e', '#73bf49', '#aad347', '#dcdd40', '#fede23', '#f9a726', '#e16c10', '#c43512', '#a20711'];
  function warnaJenjang(t) {
    var x = Math.max(0, Math.min(1, t)) * (JENJANG.length - 1), a = Math.floor(x), b = Math.min(JENJANG.length - 1, a + 1), f = x - a;
    function h(c, k) { return parseInt(c.substr(1 + k * 2, 2), 16); }
    return [0, 1, 2].map(function (k) { return Math.round(h(JENJANG[a], k) + (h(JENJANG[b], k) - h(JENJANG[a], k)) * f); });
  }
  function pita(kiri, kanan, mulai) {
    var a = mulai || 0, w = [];
    for (var k = 0; k <= 8; k++) w.push('rgb(' + warnaJenjang(a + (1 - a) * k / 8).join(',') + ')');
    return '<span class="jenjang"><em>' + esc(kiri) + '</em><span class="jenjang-pita" style="background:linear-gradient(90deg,' + w.join(',') + ')"></span><em>' + esc(kanan) + '</em></span>';
  }
  var rasterSimpan = {};
  function bacaRaster(url) {
    if (rasterSimpan[url]) return rasterSimpan[url];
    return (rasterSimpan[url] = new Promise(function (ok, gagal) {
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
          var ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
          var d = ctx.getImageData(0, 0, c.width, c.height).data, v = new Uint8Array(c.width * c.height);
          for (var i = 0; i < v.length; i++) v[i] = d[i * 4];
          ok({ w: c.width, h: c.height, v: v });
        } catch (e) { gagal(new Error('Browser menolak membaca piksel peta model.')); }
      };
      img.onerror = function () { gagal(new Error('Peta model ' + url.replace(/^.*\//, '') + ' tidak bisa diambil.')); };
      img.src = url;
    }).catch(function (e) { delete rasterSimpan[url]; throw e; }));
  }
  function gambarRaster(r, warnai) {
    var c = document.createElement('canvas'); c.width = r.w; c.height = r.h;
    var ctx = c.getContext('2d'), im = ctx.createImageData(r.w, r.h), d = im.data, tb = {}, i, w;
    for (i = 0; i < r.v.length; i++) {
      var v = r.v[i]; if (!v) continue;
      w = tb[v]; if (w === undefined) w = tb[v] = warnai(v);
      if (!w) continue;
      d[i * 4] = w[0]; d[i * 4 + 1] = w[1]; d[i * 4 + 2] = w[2]; d[i * 4 + 3] = w[3];
    }
    ctx.putImageData(im, 0, 0);
    return c.toDataURL('image/png');
  }
  /* peta tumpukan model: jumlah jenis yang habitatnya sesuai di tiap sel 50 m */
  function petaTumpuk(el, lg, batas, mx, grup, judulLegenda) {
    var p = peta(el, batas);
    var dasarLg = '<span><i class="garis"></i>Batas kawasan</span><span><i class="garis" style="border-top:2px dashed #eee8d5"></i>Batas resor</span>';
    lg.innerHTML = dasarLg + '<span class="redup">Memuat lapisan model…</span>';
    if (!p) return;
    var maks = mx.tumpuk[grup].maks;
    bacaRaster('../data/kehati/maxent/potensi_' + grup + '.webp').then(function (r) {
      if (!el.isConnected) return;
      var url = gambarRaster(r, function (v) { var c = warnaJenjang((v - 1) / maks); return [c[0], c[1], c[2], 255]; });
      var lp = window.L.imageOverlay(url, mx.batas, { pane: 'raster', opacity: 0.75, className: 'raster-model', interactive: false }).addTo(p.map);
      p.kendali.addOverlay(lp, judulLegenda);
      lg.innerHTML = '<span><b>' + esc(judulLegenda) + '</b></span>' + pita('0', maks + ' jenis') + dasarLg;
    }).catch(function (e) { if (el.isConnected) lg.innerHTML = dasarLg + '<span class="redup">' + esc(e.message) + '</span>'; });
  }

  /* luas poligon GeoJSON (ha), rumus luas bola seperti turf/area */
  function luasCincin(c) {
    var R = 6378137, s = 0, i, rad = Math.PI / 180;
    for (i = 0; i < c.length - 1; i++) s += (c[i + 1][0] - c[i][0]) * rad * (2 + Math.sin(c[i][1] * rad) + Math.sin(c[i + 1][1] * rad));
    return Math.abs(s * R * R / 2);
  }
  function luasGeom(g) {
    var poli = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    return poli.reduce(function (t, p) { return t + p.reduce(function (u, c, j) { return u + (j ? -1 : 1) * luasCincin(c); }, 0); }, 0) / 10000;
  }

  /* ================= RINGKASAN ================= */
  function ringkasan() {
    memuat('Memuat ringkasan kawasan…');
    semua(['resor/kajian_2026.json', 'resor/analisis.json', 'kehati/ringkasan.json', 'kehati/taksa.json', 'kehati/maxent.json', 'penyuluhan/kelompok.csv']).then(function (h) {
      var kj = h[0], an = h[1], rk = h[2], taksa = h[3], mx = h[4], kel = h[5], kw = kj.kawasan;
      var jenis = taksa.filter(function (x) { return x.t === 'jenis' && x.nr > 0; });
      var nDesa = kw.desa_penyangga.reduce(function (t, k) { return t + k.desa.length; }, 0);
      var nFauna = mx.model.filter(function (m) { return m.grup === 'fauna'; }).length, nFlora = mx.model.filter(function (m) { return m.grup === 'flora'; }).length;
      var eko = kw.ekosistem.slice().sort(function (a, b) { return b.ha - a.ha; }), totEko = eko.reduce(function (t, e) { return t + e.ha; }, 0);
      var desaKel = {}; kel.forEach(function (k) { if (k.desa) desaKel[k.desa] = 1; });
      var kartu = [
        ['sebaran', IKON.titik, 'Sebaran per Jenis', n(rk.berkoordinat), 'temuan berkoordinat', 'Peta titik temuan tiap jenis dari LPK ' + rk.periode[0] + '–' + rk.periode[1] + ' dan SMART Patrol, lengkap dengan model habitatnya.', 'Keanekaragaman Hayati'],
        ['satwa', IKON.rusa, 'Distribusi Habitat Satwa Liar', n(nFauna), 'model habitat satwa', 'Peta jumlah jenis satwa yang habitatnya sesuai (MaxEnt), satwa kunci, dan satwa penting hasil patroli.', 'Keanekaragaman Hayati, Resor'],
        ['tumbuhan', IKON.daun, 'Distribusi Tumbuhan', n(nFlora), 'model habitat tumbuhan', 'Peta kekayaan jenis tumbuhan menurut model, jenis yang paling sering dijumpai, dan tumbuhan invasif per resor.', 'Keanekaragaman Hayati, Resor'],
        ['jenis', IKON.daftar, 'Daftar Jenis Terverifikasi', n(jenis.length), 'jenis', 'Jenis yang namanya sudah dicocokkan dengan daftar induk dan sumber taksonomi, beserta status perlindungannya.', 'Keanekaragaman Hayati'],
        ['desa', IKON.desa, 'Desa Binaan', n(nDesa), 'desa penyangga', n(kel.length) + ' kelompok binaan di ' + n(Object.keys(desaKel).length) + ' desa, desa binaan tiap resor, dan jangkauan kegiatan penyuluhan.', 'Penyuluhan, Resor'],
        ['akses', IKON.jalan, 'Aksesibilitas ke Dalam Kawasan', nd(an.tn.km_jalur, 0), 'km jalur patroli 2026', 'Moda akses dan kantor tiap resor, jalur pendakian, serta sel 1 km yang sudah dijangkau patroli SMART.', 'Resor Pengelolaan'],
        ['fisik', IKON.gunung, 'Kondisi Fisik Kawasan', n(kw.fisik.puncak_mdpl), 'mdpl puncak', 'Topografi, geologi, tanah, tipe ekosistem, tutupan lahan, zonasi, dan areal terbakar musim ini.', 'Resor, Kehati, Tenurial']
      ];
      isi.innerHTML = judul('Profil kawasan', esc(kw.nama),
        'Ditetapkan dengan ' + esc(kw.penetapan) + ', di Kabupaten ' + esc(kw.kabupaten.join(' dan ')) + ', ' + esc(kw.provinsi) + '. Dikelola ' + esc(kw.pengelola) + '. Setiap kartu di bawah merangkum hasil analisis yang sudah ada di tab lain Satu Data Tambora.') +
        '<div class="angka-deret">' +
        angka('Luas menurut SK', nd(kw.luas_sk_ha, 2) + '<small>ha</small>', 'luas hitung kajian ' + nd(kw.luas_kajian_ha, 2) + ' ha') +
        angka('Puncak tertinggi', n(kw.fisik.puncak_mdpl) + '<small>mdpl</small>', 'Gunung Tambora') +
        angka('Jenis terverifikasi', n(jenis.length), n(jenis.filter(function (x) { return x.p106 === 'Dilindungi'; }).length) + ' jenis dilindungi') +
        angka('Desa penyangga', n(nDesa), 'di ' + n(kw.desa_penyangga.length) + ' kecamatan') +
        angka('Savana', nd(eko[0].ha / totEko * 100, 0) + '<small>%</small>', 'ekosistem terluas, ' + nd(eko[0].ha, 0) + ' ha') +
        angka('Areal terbakar 2026', nd(an.tn.terbakar.pct, 1) + '<small>%</small>', nd(an.tn.terbakar.ha, 0) + ' ha sejak awal musim') +
        '</div>' +
        '<h2 class="sub">Isi profil</h2><p class="sub-ket">Pilih kartu untuk membuka analisis lengkapnya. Angka di kartu dibaca langsung dari data tab asal.</p>' +
        '<div class="kartu-deret">' + kartu.map(function (k) {
          return '<a class="kartu" href="#/' + k[0] + '"><span class="kartu-ikon">' + k[1] + '</span><b>' + esc(k[2]) + '</b><span class="kartu-angka">' + k[3] + '<small>' + esc(k[4]) + '</small></span><p>' + esc(k[5]) + '</p><span class="kartu-dari">Dari tab ' + esc(k[6]) + '</span></a>';
        }).join('') + '</div>' +
        '<div class="kisi-3" style="margin-top:22px">' +
        '<div class="kotak"><h3>Nilai penting kawasan</h3><p class="ket">Laporan Kajian Wilayah Kerja Resor 2026</p><ul class="poin">' + kw.nilai_penting.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="kotak"><h3>Satwa kunci</h3><p class="ket">' + esc(kw.satwa_kunci.dasar) + '</p><ul class="poin">' + kw.satwa_kunci.jenis.map(function (x) { var t = taksa.filter(function (y) { return y.i === x.ilmiah; })[0]; return '<li><b>' + esc(x.nama) + '</b> <span class="ilmiah redup">' + esc(x.ilmiah) + '</span>' + (t ? '<br><span class="redup">' + n(t.nr) + ' temuan di ' + n(t.nl) + ' lokasi, ' + rentang(t.th) + '</span>' : '') + '</li>'; }).join('') + '</ul></div>' +
        '<div class="kotak"><h3>Batas kawasan</h3><p class="ket">Berbatasan langsung dengan</p><ul class="poin">' + kw.batas.map(function (b) { return '<li><b>' + esc(b.arah) + ':</b> ' + esc(b.nama) + '</li>'; }).join('') + '</ul></div>' +
        '</div>';
      kakiData('Kajian Wilayah Kerja Resor ' + tgl(kj.sumber.tanggal) + ' · data kehati ' + tgl(rk.dibuat) + ' · analisis SMART ' + tgl(an.diperbarui));
    }).catch(galat);
  }

  /* ================= SEBARAN PER JENIS ================= */
  var SB = null; // keadaan halaman sebaran supaya pindah jenis tidak memuat ulang daftar
  function sebaran(arg) {
    memuat('Memuat temuan dan daftar jenis…');
    semua(['kehati/taksa.json', 'kehati/temuan.json', 'kehati/batas.json', 'kehati/maxent.json', 'kehati/ringkasan.json']).then(function (h) {
      var taksa = h[0], tm = h[1], batas = h[2], mx = h[3], rk = h[4];
      var C = tm.kolom, Q = tm.kamus, per = {}, i;
      for (i = 0; i < tm.n; i++) { var t = C.t[i]; if (t >= 0) (per[t] || (per[t] = [])).push(i); }
      taksa.forEach(function (x, j) { x._j = j; });
      var MX = {}; mx.model.forEach(function (m) { MX[m.tid] = m; });
      var daftar = taksa.filter(function (x) { return x.nr > 0 && (x.t === 'jenis' || x.t === 'marga'); }).sort(function (a, b) { return b.nr - a.nr; });
      isi.innerHTML = judul('Profil kawasan · keanekaragaman hayati', 'Sebaran per jenis',
        'Pilih jenis untuk melihat titik temuannya di peta. Temuan dihimpun dari ' + n(rk.kegiatan.lpk) + ' LPK teknis PEH ' + rk.periode[0] + '–' + rk.periode[1] + ' dan SMART Patrol ' + rk.smart.map(function (s) { return s.tahun; }).join(' dan ') + ', sudah dikurasi (data ganda dan temuan lebih dari 1 km di luar kawasan dibuang). Jenis yang punya model MaxEnt bisa ditampilkan bersama peta kesesuaian habitatnya.',
        [['Kamus jenis di tab Keanekaragaman Hayati', KEHATI + '#/jenis'], ['Peta temuan semua kategori', KEHATI + '#/']]) +
        '<div class="angka-deret">' + angka('Temuan lolos kurasi', n(rk.lolos), n(rk.berkoordinat) + ' berkoordinat') + angka('Jenis dan marga tercatat', n(daftar.length), 'dengan sedikitnya satu temuan') + angka('Model sebaran', n(mx.model.length), 'jenis dengan model MaxEnt') + angka('Kegiatan sumber', n(rk.kegiatan.lpk), 'LPK, ditambah SMART Patrol') + '</div>' +
        '<div class="sebaran" style="margin-top:18px">' +
        '<div class="pilih-jenis"><label class="isian">' + IKON.cari + '<span class="sr">Cari jenis</span><input type="search" id="sbCari" placeholder="Cari nama ilmiah, Indonesia, atau lokal" autocomplete="off" spellcheck="false"></label>' +
        '<label class="isian"><span class="sr">Kelompok</span><select id="sbKel"><option value="">Semua kelompok</option>' + ['burung', 'satwa', 'tumbuhan'].map(function (k) { return '<option value="' + k + '">' + KEL[k].nama + '</option>'; }).join('') + '<option value="model">Yang punya model habitat</option><option value="lindung">Dilindungi atau terancam</option></select></label>' +
        '<ul class="daftar-jenis" id="sbDaftar" aria-label="Daftar jenis"></ul><span class="redup" id="sbJml" style="font-size:12.5px"></span></div>' +
        '<div id="sbProfil"></div></div>';
      var elDaftar = document.getElementById('sbDaftar'), elCari = document.getElementById('sbCari'), elKel = document.getElementById('sbKel');
      function cocok(x) {
        var q = elCari.value.trim().toLowerCase(), k = elKel.value;
        if (k === 'model' && !MX[x.tid]) return false;
        if (k === 'lindung' && !(x.p106 === 'Dilindungi' || IUCN[x.iucn])) return false;
        if (k && k !== 'model' && k !== 'lindung' && kelDari(x.k) !== k) return false;
        if (q && [x.i, x.n, x.e, x.f].concat(x.l || []).join(' ').toLowerCase().indexOf(q) < 0) return false;
        return true;
      }
      function gambarDaftar() {
        var d = daftar.filter(cocok), pilih = SB && SB.tid;
        elDaftar.innerHTML = d.slice(0, 300).map(function (x) {
          return '<li><button type="button" data-tid="' + esc(x.tid) + '" aria-pressed="' + (x.tid === pilih) + '"><span class="titik" style="background:' + KEL[kelDari(x.k)].warna + '"></span><span class="nm"><span>' + namaJenis(x) + '</span>' + (namaKecil(x) ? '<small>' + esc(namaKecil(x)) + '</small>' : '') + '</span><span class="jml">' + n(x.nr) + '</span></button></li>';
        }).join('') || '<li class="redup" style="padding:10px">Tidak ada jenis yang cocok.</li>';
        document.getElementById('sbJml').textContent = n(d.length) + ' jenis cocok' + (d.length > 300 ? ', 300 teratas ditampilkan' : '') + '. Angka di kanan = jumlah temuan.';
      }
      elCari.addEventListener('input', gambarDaftar);
      elKel.addEventListener('change', gambarDaftar);
      elDaftar.addEventListener('click', function (e) { var b = e.target.closest('[data-tid]'); if (b) location.hash = '#/sebaran/' + encodeURIComponent(b.getAttribute('data-tid')); });
      SB = { taksa: taksa, per: per, C: C, Q: Q, batas: batas, mx: mx, MX: MX, gambarDaftar: gambarDaftar, tid: null };
      var awal = arg[0] && taksa.some(function (x) { return x.tid === arg[0]; }) ? arg[0] : 'rusa-timorensis';
      profilJenis(awal);
    }).catch(galat);
  }
  function profilJenis(tid) {
    var S = SB, x = S.taksa.filter(function (y) { return y.tid === tid; })[0], wadah = document.getElementById('sbProfil');
    if (!x || !wadah) return;
    lepas();
    S.tid = tid; S.gambarDaftar();
    var b = document.querySelector('#sbDaftar [aria-pressed="true"]'); if (b) b.scrollIntoView({ block: 'nearest' });
    var C = S.C, Q = S.Q, idx = S.per[x._j] || [], m = S.MX[tid], kel = KEL[kelDari(x.k)];
    var resor = {}, titik = {}, tanpa = 0;
    idx.forEach(function (i) {
      var r = Q.resor[C.res[i]] || 'Tidak tercatat', o = resor[r] || (resor[r] = { n: 0, a: 9999, b: 0, lpk: 0, smart: 0 });
      o.n++; o.a = Math.min(o.a, C.th[i]); o.b = Math.max(o.b, C.th[i]); if (Q.sumber[C.s[i]] === 'SMART') o.smart++; else o.lpk++;
      if (C.lat[i] === null) { tanpa++; return; }
      var k = C.lat[i].toFixed(5) + ',' + C.lon[i].toFixed(5); (titik[k] || (titik[k] = { lat: C.lat[i], lon: C.lon[i], idx: [] })).idx.push(i);
    });
    var nm = namaKecil(x), lain = [x.e].concat(x.l || []).filter(Boolean);
    wadah.innerHTML = '<div class="profil-jenis"><img src="../data/kehati/jenis/' + encodeURIComponent(tid) + '.webp" alt="Foto ' + esc(x.i || x.n) + '" loading="lazy" onerror="this.outerHTML=\'<div class=&quot;tanpa-foto&quot;>Belum ada foto</div>\'">' +
      '<div><h2>' + namaJenis(x) + '</h2><div class="nama-lain">' + esc(nm) + (lain.length ? ' <span class="redup">· ' + esc(lain.join(', ')) + '</span>' : '') + '</div>' +
      '<div class="chip-deret"><span class="chip"><span class="titik" style="width:9px;height:9px;border-radius:50%;background:' + kel.warna + '"></span>' + esc(kel.nama) + (x.f ? ' · ' + esc(x.f) : '') + '</span>' + lencana(x) + '</div>' +
      '<div class="mini-angka"><span><b>' + n(x.nr) + '</b>temuan</span><span><b>' + n(x.nl) + '</b>lokasi unik</span><span><b>' + rentang(x.th) + '</b>tahun</span><span><b>' + n(x.nkeg) + '</b>kegiatan</span><span><b>' + esc((x.smb || []).join(' + ')) + '</b>sumber</span></div>' +
      '<p style="margin:10px 0 0"><a class="sumber" href="' + tautKehati(tid) + '">' + IKON.luar + 'Halaman lengkap jenis ini di tab Keanekaragaman Hayati</a></p></div></div>' +
      (m ? '<div class="kendali" id="sbMode"><span class="redup" style="font-size:13px">Model habitat:</span><div class="saklar" role="radiogroup" aria-label="Lapisan model habitat">' +
        [['tanpa', 'Tanpa model'], ['penuh', 'Kesesuaian habitat'], ['p10', 'Habitat sesuai (di atas P10)']].map(function (o, j) { return '<label><input type="radio" name="sbm" value="' + o[0] + '"' + (j === 2 ? ' checked' : '') + '><span>' + o[1] + '</span></label>'; }).join('') +
        '</div><span class="status">keandalan ' + esc(ANDAL[kelasAndal(m)]) + '</span></div>' : '') +
      '<div class="peta-wadah"><div class="peta" id="sbPeta" role="region" aria-label="Peta sebaran ' + esc(x.i || x.n) + '"></div><div class="legenda" id="sbLg"></div></div>' +
      (tanpa ? sumberKecil(n(tanpa) + ' temuan tidak punya koordinat sehingga tidak tampil di peta, tetapi tetap dihitung di tabel.') : '') +
      '<div class="kisi-2" style="margin-top:14px"><div class="kotak"><h3>Temuan per resor</h3><p class="ket">Resor menurut batas yang dipakai tab Keanekaragaman Hayati</p><div id="sbResor"></div></div>' +
      '<div class="kotak"><h3>Habitat menurut model</h3>' + (m ? '<p class="ket">Luas sel yang kesesuaiannya di atas ambang P10 (' + nd(m.p10, 2) + '), dari model ' + esc(m.m) + ' dengan ' + n(m.n) + ' lokasi</p>' +
        batang(Object.keys(m.resor).map(function (r) { return [r, m.resor[r], nd(m.resor[r], 0) + ' ha']; }).sort(function (a, b) { return b[1] - a[1]; }), 'ha') +
        '<p class="catatan">Total ' + nd(m.luas, 0) + ' ha atau ' + nd(m.luas / S.mx.luas_kawasan_ha * 100, 1) + '% luas kawasan. Elevasi temuan ' + n(m.el[0]) + '–' + n(m.el[2]) + ' m (median ' + n(m.el[1]) + ' m).</p>'
        : '<p class="ket">Jenis ini belum punya model sebaran. Model MaxEnt baru dibuat bila jenis tercatat di sedikitnya 5 lokasi berbeda.</p>') + '</div></div>';
    var baris = Object.keys(resor).map(function (r) { return { r: r, o: resor[r] }; });
    tabel(document.getElementById('sbResor'), {
      label: 'Temuan per resor', baris: baris, urut: { id: 'n', turun: true }, perHal: 10,
      kolom: [
        { id: 'r', judul: 'Resor', nilai: function (b) { return b.r; }, isi: function (b) { return esc(b.r); } },
        { id: 'n', judul: 'Temuan', n: true, nilai: function (b) { return b.o.n; }, isi: function (b) { return n(b.o.n); } },
        { id: 'l', judul: 'LPK / SMART', n: true, nilai: function (b) { return b.o.lpk; }, isi: function (b) { return n(b.o.lpk) + ' / ' + n(b.o.smart); } },
        { id: 't', judul: 'Tahun', nilai: function (b) { return b.o.a; }, isi: function (b) { return rentang([b.o.a, b.o.b]); } }
      ]
    });
    var elPeta = document.getElementById('sbPeta'), lg = document.getElementById('sbLg');
    var p = peta(elPeta, S.batas);
    var dasarLg = '<span><i style="background:' + kel.warna + '"></i>' + n(Object.keys(titik).length) + ' titik temuan</span><span><i class="garis"></i>Batas kawasan</span>';
    lg.innerHTML = dasarLg;
    if (!p) return;
    var L = window.L, kanvas = L.canvas({ padding: 0.4, tolerance: 6 }), grupTitik = L.layerGroup().addTo(p.map), lapisModel = null, raster = null;
    p.kendali.addOverlay(grupTitik, 'Titik temuan');
    Object.keys(titik).forEach(function (k) {
      var o = titik[k];
      L.circleMarker([o.lat, o.lon], { renderer: kanvas, radius: Math.min(9, 3.5 + Math.sqrt(o.idx.length)), color: '#04060b', weight: 1.4, fillColor: kel.warna, fillOpacity: 0.95 })
        .on('click', function () {
          var li = o.idx.slice().sort(function (a, b) { return (C.tgl[b] || '').localeCompare(C.tgl[a] || ''); }).slice(0, 5).map(function (i) {
            return '<li>' + (C.tgl[i] ? esc(tgl(C.tgl[i])) : C.th[i]) + ' <span class="redup">· ' + esc(Q.sumber[C.s[i]]) + ' · ' + esc(Q.temuan[C.jt[i]] || '') + (C.j[i] !== null && C.j[i] !== undefined ? ', ' + nd(C.j[i], 1) + ' ' + esc(Q.satuan[C.sat[i]] || '') : '') + '</span></li>';
          }).join('');
          L.popup({ maxWidth: 300 }).setLatLng([o.lat, o.lon]).setContent('<b>' + n(o.idx.length) + ' temuan di titik ini</b><div class="redup">' + (Q.resor[C.res[o.idx[0]]] ? 'Resor ' + esc(Q.resor[C.res[o.idx[0]]]) : '') + '</div><ul style="margin:6px 0 0;padding-left:16px">' + li + '</ul>').openOn(p.map);
        }).addTo(grupTitik);
    });
    if (!m) return;
    function pasang() {
      var mode = (document.querySelector('input[name="sbm"]:checked') || {}).value;
      if (lapisModel) { p.map.removeLayer(lapisModel); lapisModel = null; }
      if (mode === 'tanpa' || !raster) { lg.innerHTML = dasarLg + (raster ? '' : '<span class="redup">Memuat model…</span>'); return; }
      var url = gambarRaster(raster, function (v) {
        var t = Math.floor((v - 1) / 2), sesuai = (v - 1) % 2;
        if (mode === 'p10' && !sesuai) return null;
        var c = warnaJenjang(t / 24); return [c[0], c[1], c[2], 255];
      });
      lapisModel = L.imageOverlay(url, S.mx.batas, { pane: 'raster', opacity: 0.7, className: 'raster-model', interactive: false }).addTo(p.map);
      lg.innerHTML = dasarLg + '<span><b>' + (mode === 'p10' ? 'Habitat sesuai' : 'Kesesuaian habitat') + '</b></span>' + (mode === 'p10' ? pita(nd(m.p10, 2), '1', m.p10) : pita('0', '1'));
    }
    document.getElementById('sbMode').addEventListener('change', pasang);
    lg.innerHTML = dasarLg + '<span class="redup">Memuat model…</span>';
    bacaRaster('../data/kehati/maxent/' + tid + '.webp').then(function (r) { if (!elPeta.isConnected) return; raster = r; pasang(); })
      .catch(function (e) { if (elPeta.isConnected) lg.innerHTML = dasarLg + '<span class="redup">' + esc(e.message) + '</span>'; });
  }

  /* ---------- tabel model habitat (dipakai halaman satwa dan tumbuhan) ---------- */
  function tabelModel(wadah, model, TX, luasKawasan) {
    tabel(wadah, {
      label: 'Model habitat per jenis', baris: model, urut: { id: 'luas', turun: true }, perHal: 15,
      kolom: [
        { id: 'nama', judul: 'Jenis', nilai: function (m) { var x = TX[m.tid]; return (x && x.i || m.tid).toLowerCase(); }, isi: function (m) { var x = TX[m.tid] || { tid: m.tid, i: m.tid }; return '<a href="#/sebaran/' + encodeURIComponent(m.tid) + '">' + namaJenis(x) + '</a>' + (namaKecil(x) ? '<small>' + esc(namaKecil(x)) + '</small>' : ''); } },
        { id: 'st', judul: 'Status', isi: function (m) { return TX[m.tid] ? lencana(TX[m.tid]) : ''; } },
        { id: 'n', judul: 'Lokasi', n: true, nilai: function (m) { return m.n; }, isi: function (m) { return n(m.n); } },
        { id: 'luas', judul: 'Habitat sesuai', n: true, nilai: function (m) { return m.luas; }, isi: function (m) { return nd(m.luas, 0) + ' ha<small>' + nd(m.luas / luasKawasan * 100, 1) + '% kawasan</small>'; } },
        { id: 'res', judul: 'Resor terluas', nilai: function (m) { return terluas(m); }, isi: function (m) { return esc(terluas(m)); } },
        { id: 'el', judul: 'Elevasi temuan', n: true, nilai: function (m) { return m.el[1]; }, isi: function (m) { return n(m.el[0]) + '–' + n(m.el[2]) + ' m'; } },
        { id: 'and', judul: 'Keandalan', nilai: function (m) { return ['tinggi', 'berguna', 'indikatif', 'rendah'].indexOf(kelasAndal(m)); }, isi: function (m) { return '<span class="status">' + esc(ANDAL[kelasAndal(m)]) + '</span>'; } }
      ]
    });
  }
  function terluas(m) { var k = Object.keys(m.resor || {}).sort(function (a, b) { return m.resor[b] - m.resor[a]; })[0]; return k || '-'; }

  /* ================= HABITAT SATWA LIAR ================= */
  function satwa() {
    memuat('Memuat model habitat satwa…');
    semua(['kehati/maxent.json', 'kehati/batas.json', 'kehati/taksa.json', 'resor/analisis.json', 'kehati/ringkasan.json']).then(function (h) {
      var mx = h[0], batas = h[1], taksa = h[2], an = h[3], rk = h[4], TX = {}, sw = an.tn.satwa;
      taksa.forEach(function (x) { TX[x.tid] = x; });
      var model = mx.model.filter(function (m) { return m.grup === 'fauna'; });
      var kunci2 = [['rusa-timorensis', 'Rusa timor'], ['nisaetus-floris', 'Elang flores']];
      var nFauna = taksa.filter(function (x) { return x.t === 'jenis' && x.nr > 0 && kelDari(x.k) !== 'tumbuhan' && kelDari(x.k) !== 'lain'; });
      isi.innerHTML = judul('Profil kawasan · keanekaragaman hayati', 'Distribusi habitat satwa liar',
        'Peta menunjukkan berapa jenis satwa yang habitatnya sesuai di tiap sel 50 m, hasil penumpukan model MaxEnt per jenis dari temuan LPK dan SMART Patrol. Makin merah, makin banyak jenis yang habitatnya bertumpuk di sana. Pilih jenis di tabel untuk melihat peta habitatnya sendiri.',
        [['Potensi kehati dan model sebaran', KEHATI + '#/'], ['Satwa per resor di tab Resor Pengelolaan', RESOR + '#/']]) +
        '<div class="angka-deret">' + angka('Jenis satwa terverifikasi', n(nFauna.length), 'burung, mamalia, dan fauna lain') + angka('Model habitat satwa', n(model.length), n(mx.tumpuk.fauna.n_model) + ' model ikut ditumpuk') +
        angka('Jenis satwa SMART ' + an.periode.tahun_awal, n(sw.S), 'dari ' + n(sw.rekaman) + ' rekaman patroli') + angka('Indeks Shannon', nd(sw.H, 2), 'kemerataan ' + nd(sw.E, 2)) +
        angka('Satwa dilindungi tercatat', n(sw.dilindungi), n(sw.terancam) + ' terancam menurut IUCN') + '</div>' +
        '<div class="peta-wadah" style="margin-top:16px"><div class="peta" id="swPeta" role="region" aria-label="Peta jumlah jenis satwa dengan habitat sesuai"></div><div class="legenda" id="swLg"></div></div>' +
        sumberKecil('Model ' + n(mx.sel_m) + ' m dengan peubah ' + Object.keys(mx.peubah).map(function (k) { return mx.peubah[k].toLowerCase(); }).join(', ') + '. Model dibuat ' + tgl(mx.dibuat) + ' di tab Keanekaragaman Hayati.') +
        '<h2 class="sub">Satwa kunci</h2><p class="sub-ket">Ditetapkan dengan SK Kepala Balai TN Tambora Nomor SK.5/T.41/TU/KSA/1/2021.</p><div class="kisi-2">' +
        kunci2.map(function (k) {
          var x = TX[k[0]], m = mx.model.filter(function (y) { return y.tid === k[0]; })[0], s = (sw.kunci || []).filter(function (y) { return y.ilmiah === (x && x.i); })[0];
          if (!x) return '';
          return '<div class="kotak"><h3><a href="#/sebaran/' + k[0] + '">' + esc(k[1]) + '</a> <span class="ilmiah redup" style="font-weight:400">' + esc(x.i) + '</span></h3><div class="chip-deret" style="margin:6px 0 10px">' + lencana(x) + '</div>' +
            '<div class="mini-angka" style="margin-bottom:12px"><span><b>' + n(x.nr) + '</b>temuan ' + rentang(x.th) + '</span><span><b>' + n(x.nl) + '</b>lokasi</span>' + (s ? '<span><b>' + n(s.rekaman) + '</b>rekaman SMART ' + an.periode.tahun_awal + ' di ' + n(s.sel) + ' sel 1 km</span>' : '') + '</div>' +
            (m ? '<p class="ket" style="margin:0 0 8px;color:var(--teks-3);font-size:13px">Habitat sesuai ' + nd(m.luas, 0) + ' ha (' + nd(m.luas / mx.luas_kawasan_ha * 100, 1) + '% kawasan), keandalan ' + esc(ANDAL[kelasAndal(m)].toLowerCase()) + '</p>' +
              batang(Object.keys(m.resor).map(function (r) { return [r, m.resor[r], nd(m.resor[r], 0) + ' ha', kelDari(x.k)]; }).sort(function (a, b) { return b[1] - a[1]; }), 'ha') : '') + '</div>';
        }).join('') + '</div>' +
        '<h2 class="sub">Model habitat per jenis satwa</h2><p class="sub-ket">Klik nama jenis untuk melihat titik temuan dan peta habitatnya. Keandalan indikatif berarti model dibuat dari kurang dari 10 lokasi, jadi baru petunjuk awal.</p><div id="swTabel"></div>' +
        '<h2 class="sub">Satwa penting dalam patroli SMART ' + an.periode.tahun_awal + '</h2><p class="sub-ket">Jenis dilindungi atau terancam yang tercatat ' + tgl(an.periode.awal) + ' sampai ' + tgl(an.periode.akhir) + ', dihitung di tab Resor Pengelolaan.</p>' +
        '<div class="kotak">' + batang(sw.penting.map(function (p) { return [p.nama + ' (' + p.ilmiah + ')', p.n, n(p.n) + ' rekaman', 'satwa']; }), 'rekaman') + '</div>';
      petaTumpuk(document.getElementById('swPeta'), document.getElementById('swLg'), batas, mx, 'fauna', 'Jumlah jenis satwa');
      tabelModel(document.getElementById('swTabel'), model, TX, mx.luas_kawasan_ha);
      kakiData('Model MaxEnt ' + tgl(mx.dibuat) + ' · data kehati ' + tgl(rk.dibuat) + ' · analisis SMART ' + tgl(an.diperbarui));
    }).catch(galat);
  }

  /* ================= DISTRIBUSI TUMBUHAN ================= */
  function tumbuhan() {
    memuat('Memuat model dan temuan tumbuhan…');
    semua(['kehati/maxent.json', 'kehati/batas.json', 'kehati/taksa.json', 'resor/analisis.json', 'kehati/ringkasan.json']).then(function (h) {
      var mx = h[0], batas = h[1], taksa = h[2], an = h[3], rk = h[4], TX = {};
      taksa.forEach(function (x) { TX[x.tid] = x; });
      var model = mx.model.filter(function (m) { return m.grup === 'flora'; });
      var tb = taksa.filter(function (x) { return x.t === 'jenis' && x.nr > 0 && kelDari(x.k) === 'tumbuhan'; });
      var atas = tb.slice().sort(function (a, b) { return b.nr - a.nr; }).slice(0, 15);
      var asing = tb.filter(function (x) { return x.inv || x.sb === 'Introduced' || x.h === 'Introduksi'; });
      isi.innerHTML = judul('Profil kawasan · keanekaragaman hayati', 'Distribusi tumbuhan',
        'Peta menunjukkan berapa jenis tumbuhan yang habitatnya sesuai di tiap sel 50 m menurut model MaxEnt. Sumbernya petak vegetasi dan daftar jenis di LPK teknis PEH serta temuan tumbuhan di SMART Patrol.',
        [['Potensi kehati dan model sebaran', KEHATI + '#/'], ['Perencanaan inventarisasi (celah survei)', KEHATI + '#/perencanaan']]) +
        '<div class="angka-deret">' + angka('Jenis tumbuhan terverifikasi', n(tb.length), n(tb.filter(function (x) { return x.k === 'Anggrek'; }).length) + ' di antaranya anggrek') +
        angka('Temuan tumbuhan', n((rk.per_kategori.Flora || 0) + (rk.per_kategori.Anggrek || 0)), n(rk.per_kategori.Anggrek || 0) + ' temuan anggrek') +
        angka('Model habitat tumbuhan', n(model.length), 'paling banyak ' + n(mx.tumpuk.flora.maks) + ' jenis bertumpuk di satu sel') +
        angka('Jenis asing atau invasif', n(asing.length), 'tercatat di dalam kawasan') + '</div>' +
        '<div class="peta-wadah" style="margin-top:16px"><div class="peta" id="tbPeta" role="region" aria-label="Peta jumlah jenis tumbuhan dengan habitat sesuai"></div><div class="legenda" id="tbLg"></div></div>' +
        '<div class="kisi-2" style="margin-top:16px"><div class="kotak"><h3>Tumbuhan paling sering dijumpai</h3><p class="ket">Jumlah temuan ' + rk.periode[0] + '–' + rk.periode[1] + ', semua sumber</p>' +
        batang(atas.map(function (x) { return [(x.n ? x.n + ' · ' : '') + x.i, x.nr, n(x.nr), 'tumbuhan']; }), 'temuan') + '</div>' +
        '<div class="kotak"><h3>Jenis asing dan invasif</h3><p class="ket">Menurut daftar induk kehati; klik untuk melihat sebarannya</p>' +
        (asing.length ? '<ul class="poin">' + asing.sort(function (a, b) { return b.nr - a.nr; }).map(function (x) { return '<li><a href="#/sebaran/' + encodeURIComponent(x.tid) + '">' + namaJenis(x) + '</a>' + (x.n ? ' <span class="redup">' + esc(x.n) + '</span>' : '') + ' <span class="redup">· ' + n(x.nr) + ' temuan</span></li>'; }).join('') + '</ul>' : '<p class="redup">Belum ada.</p>') + '</div></div>' +
        '<h2 class="sub">Tumbuhan dominan per resor</h2><p class="sub-ket">Dari patroli SMART ' + an.periode.tahun_awal + ' yang dianalisis di tab Resor Pengelolaan (wilayah kerja resor hasil kajian 2026).</p><div class="kisi-3">' +
        an.resor.map(function (r) {
          return '<div class="kotak"><h3><a href="' + RESOR + '#/' + esc(r.id) + '">Resor ' + esc(r.nama) + '</a></h3><p class="ket">' + n(r.tumbuhan.rekaman) + ' rekaman, ' + n(r.tumbuhan.S) + ' jenis</p>' +
            (r.tumbuhan.teratas.length ? batang(r.tumbuhan.teratas.map(function (t) { return [t.nama, t.n, n(t.n), 'tumbuhan']; }), 'rekaman') : '<p class="redup">Belum ada rekaman tumbuhan.</p>') +
            (r.invasif && r.invasif.length ? '<p class="catatan">Invasif: ' + esc(r.invasif.join(', ')) + '</p>' : '') + '</div>';
        }).join('') + '</div>' +
        '<h2 class="sub">Model habitat per jenis tumbuhan</h2><p class="sub-ket">Klik nama jenis untuk melihat titik temuan dan peta habitatnya.</p><div id="tbTabel"></div>';
      petaTumpuk(document.getElementById('tbPeta'), document.getElementById('tbLg'), batas, mx, 'flora', 'Jumlah jenis tumbuhan');
      tabelModel(document.getElementById('tbTabel'), model, TX, mx.luas_kawasan_ha);
      kakiData('Model MaxEnt ' + tgl(mx.dibuat) + ' · data kehati ' + tgl(rk.dibuat) + ' · analisis SMART ' + tgl(an.diperbarui));
    }).catch(galat);
  }

  /* ================= DAFTAR JENIS TERVERIFIKASI ================= */
  function jenis() {
    memuat('Memuat daftar jenis…');
    semua(['kehati/taksa.json', 'kehati/ringkasan.json']).then(function (h) {
      var taksa = h[0], rk = h[1];
      var daftar = taksa.filter(function (x) { return x.t === 'jenis' && x.nr > 0; });
      function hit(f) { return daftar.filter(f).length; }
      isi.innerHTML = judul('Profil kawasan · keanekaragaman hayati', 'Daftar jenis terverifikasi',
        'Jenis yang tercatat di kawasan dan namanya sudah dicocokkan ke tingkat jenis dengan daftar induk kehati Balai TN Tambora, data model SMART, atau sumber taksonomi (WCVP, GBIF). Nama lokal dan salah eja sudah diarahkan ke nama ilmiahnya. Status perlindungan mengikuti Permen LHK P.106/2018, Daftar Merah IUCN, dan CITES.',
        [['Kamus jenis bergambar', KEHATI + '#/jenis'], ['Nama yang masih perlu ditinjau', KEHATI + '#/data']]) +
        '<div class="angka-deret">' + angka('Jenis terverifikasi', n(daftar.length), 'dari ' + n(taksa.filter(function (x) { return x.nr > 0; }).length) + ' takson tercatat') +
        angka('Burung', n(hit(function (x) { return x.k === 'Aves'; })), 'jenis') + angka('Mamalia dan fauna lain', n(hit(function (x) { return kelDari(x.k) === 'satwa'; })), 'jenis') +
        angka('Tumbuhan dan anggrek', n(hit(function (x) { return kelDari(x.k) === 'tumbuhan'; })), n(hit(function (x) { return x.k === 'Anggrek'; })) + ' anggrek') +
        angka('Dilindungi', n(hit(function (x) { return x.p106 === 'Dilindungi'; })), 'Permen LHK P.106/2018') + angka('Terancam IUCN', n(hit(function (x) { return !!IUCN[x.iucn]; })), 'CR, EN, VU, atau NT') + '</div>' +
        '<div class="kendali" style="margin-top:18px"><label class="isian isian--lebar">' + IKON.cari + '<span class="sr">Cari jenis</span><input type="search" id="jsCari" placeholder="Cari nama ilmiah, Indonesia, lokal, atau famili" autocomplete="off" spellcheck="false"></label>' +
        '<label class="isian"><span class="sr">Kelompok</span><select id="jsKel"><option value="">Semua kelompok</option><option value="burung">Burung</option><option value="satwa">Mamalia dan fauna lain</option><option value="tumbuhan">Tumbuhan dan anggrek</option></select></label>' +
        '<label class="isian"><span class="sr">Status</span><select id="jsSt"><option value="">Semua status</option><option value="lindung">Dilindungi</option><option value="iucn">Terancam IUCN</option><option value="endemik">Endemik</option><option value="asing">Asing atau invasif</option></select></label>' +
        '<button class="tombol tombol--hantu" type="button" id="jsUnduh">' + IKON.unduh + 'Unduh CSV</button></div>' +
        '<p class="redup" id="jsJml" style="font-size:13px;margin:0 0 8px"></p><div id="jsTabel"></div>';
      var tb = tabel(document.getElementById('jsTabel'), {
        label: 'Daftar jenis terverifikasi', baris: daftar, urut: { id: 'nr', turun: true }, perHal: 30,
        kolom: [
          { id: 'nama', judul: 'Jenis', nilai: function (x) { return x.i.toLowerCase(); }, isi: function (x) { return '<a href="' + tautKehati(x.tid) + '">' + namaJenis(x) + '</a>' + (namaKecil(x) || (x.l && x.l.length) ? '<small>' + esc([x.n].concat(x.l || []).filter(Boolean).join(', ')) + '</small>' : ''); } },
          { id: 'f', judul: 'Famili', nilai: function (x) { return x.f || ''; }, isi: function (x) { return esc(x.f || '-'); } },
          { id: 'k', judul: 'Kelompok', nilai: function (x) { return x.k; }, isi: function (x) { return esc(x.k === 'Aves' ? 'Burung' : x.k); } },
          { id: 'st', judul: 'Status', nilai: function (x) { return -((x.p106 === 'Dilindungi' ? 8 : 0) + ({ CR: 6, EN: 5, VU: 4, NT: 3 }[x.iucn] || 0) + (x.h === 'Endemik' ? 2 : 0)); }, isi: lencana },
          { id: 'nr', judul: 'Temuan', n: true, nilai: function (x) { return x.nr; }, isi: function (x) { return '<a href="#/sebaran/' + encodeURIComponent(x.tid) + '" title="Lihat sebaran">' + n(x.nr) + '</a>'; } },
          { id: 'th', judul: 'Tahun', nilai: function (x) { return x.th ? x.th[1] : 0; }, isi: function (x) { return rentang(x.th); } },
          { id: 'res', judul: 'Resor', n: true, nilai: function (x) { return (x.res || []).length; }, isi: function (x) { return '<span title="' + esc((x.res || []).join(', ')) + '">' + n((x.res || []).length) + '</span>'; } },
          { id: 'smb', judul: 'Sumber', nilai: function (x) { return (x.smb || []).join(); }, isi: function (x) { return esc((x.smb || []).join(' + ')); } }
        ]
      });
      var cari = document.getElementById('jsCari'), kel = document.getElementById('jsKel'), st = document.getElementById('jsSt'), saring = daftar;
      function ubah() {
        var q = cari.value.trim().toLowerCase();
        saring = daftar.filter(function (x) {
          if (kel.value && kelDari(x.k) !== kel.value) return false;
          if (st.value === 'lindung' && x.p106 !== 'Dilindungi') return false;
          if (st.value === 'iucn' && !IUCN[x.iucn]) return false;
          if (st.value === 'endemik' && x.h !== 'Endemik') return false;
          if (st.value === 'asing' && !(x.inv || x.sb === 'Introduced' || x.h === 'Introduksi')) return false;
          return !q || [x.i, x.n, x.e, x.f].concat(x.l || []).join(' ').toLowerCase().indexOf(q) >= 0;
        });
        document.getElementById('jsJml').textContent = n(saring.length) + ' jenis tampil. Klik nama untuk membuka kamus jenis, klik angka temuan untuk melihat sebarannya.';
        tb.ganti(saring);
      }
      cari.addEventListener('input', ubah); kel.addEventListener('change', ubah); st.addEventListener('change', ubah);
      document.getElementById('jsUnduh').addEventListener('click', function () {
        unduhCsv('jenis_terverifikasi_tn_tambora.csv', [
          ['nama_ilmiah', function (x) { return x.i; }], ['nama_indonesia', function (x) { return x.n; }], ['nama_lokal', function (x) { return (x.l || []).join('; '); }], ['nama_inggris', function (x) { return x.e; }],
          ['famili', function (x) { return x.f; }], ['kelompok', function (x) { return x.k; }], ['p106', function (x) { return x.p106; }], ['iucn', function (x) { return x.iucn; }], ['cites', function (x) { return x.cites; }], ['keterangan', function (x) { return x.h; }],
          ['temuan', function (x) { return x.nr; }], ['lokasi_unik', function (x) { return x.nl; }], ['tahun_pertama', function (x) { return x.th && x.th[0]; }], ['tahun_terakhir', function (x) { return x.th && x.th[1]; }], ['resor', function (x) { return (x.res || []).join('; '); }], ['sumber', function (x) { return (x.smb || []).join('; '); }]
        ], saring);
      });
      ubah();
      kakiData('Daftar takson tab Keanekaragaman Hayati, diperbarui ' + tgl(rk.dibuat));
    }).catch(galat);
  }

  /* ================= DESA BINAAN ================= */
  var URUT_STATUS = ['aktif', 'kurang aktif', 'baru dibentuk', 'tidak aktif', 'tidak disebut'];
  function kelasStatus(s) { return s === 'aktif' ? 'aktif' : s === 'kurang aktif' ? 'kurang' : s === 'tidak aktif' ? 'tidak' : s === 'baru dibentuk' ? 'baru' : ''; }
  function desa() {
    memuat('Memuat desa binaan dan kelompok…');
    semua(['resor/kajian_2026.json', 'penyuluhan/kelompok.csv', 'penyuluhan/penyuluhan.csv']).then(function (h) {
      var kj = h[0], kel = h[1], py = h[2], kw = kj.kawasan;
      var D = {}; // kunci desa -> data
      function ambilDesa(nama, kec) {
        var k = kunci(nama); if (!k) return null;
        var d = D[k] || (D[k] = { nama: nama, kec: kec || '', resor: [], kel: [], keg: 0, peserta: 0, tahun: {} });
        if (kec && !d.kec) d.kec = kec;
        return d;
      }
      kw.desa_penyangga.forEach(function (k) { k.desa.forEach(function (d) { ambilDesa(d, k.kecamatan).penyangga = true; }); });
      kj.resor.forEach(function (r) { r.desa.forEach(function (d) { var o = ambilDesa(d); if (o.resor.indexOf(r.nama) < 0) o.resor.push(r.nama); }); });
      kel.forEach(function (k) { var o = ambilDesa(k.desa); if (o) o.kel.push(k); });
      py.forEach(function (p) { String(p.desa || '').split(';').forEach(function (d) { var o = ambilDesa(d.trim()); if (o) { o.keg++; o.peserta += +p.peserta || 0; if (p.tahun) o.tahun[p.tahun] = 1; } }); });
      var penyangga = Object.keys(D).map(function (k) { return D[k]; }).filter(function (d) { return d.penyangga; });
      var lain = Object.keys(D).map(function (k) { return D[k]; }).filter(function (d) { return !d.penyangga && (d.kel.length || d.resor.length || d.keg >= 2); }).sort(function (a, b) { return b.keg - a.keg; });
      var stHit = {}; kel.forEach(function (k) { stHit[k.status_terakhir] = (stHit[k.status_terakhir] || 0) + 1; });
      var dijangkau = Object.keys(D).filter(function (k) { return D[k].keg > 0; }).length;
      var thPy = py.map(function (p) { return +p.tahun; }).filter(Boolean);
      function kartuDesa(d) {
        var st = {}; d.kel.forEach(function (k) { st[k.status_terakhir] = (st[k.status_terakhir] || 0) + 1; });
        return '<div class="desa"><div class="desa-kepala"><b>' + esc(d.nama) + '</b><span>' + (d.resor.length ? 'Binaan Resor ' + esc(d.resor.join(', ')) : '<span class="redup">belum tercantum sebagai desa binaan resor</span>') + '</span></div>' +
          '<div class="chip-deret"><span class="chip"><b>' + n(d.kel.length) + '</b> kelompok</span><span class="chip"><b>' + n(d.keg) + '</b> kegiatan penyuluhan</span>' +
          URUT_STATUS.filter(function (s) { return st[s]; }).map(function (s) { return '<span class="status status--' + kelasStatus(s) + '">' + n(st[s]) + ' ' + esc(s) + '</span>'; }).join('') + '</div>' +
          (d.kel.length ? '<ul>' + d.kel.map(function (k) { return '<li><span>' + esc(k.nama) + ' <span class="redup">· ' + esc(k.usaha || k.jenis) + '</span></span><span class="status status--' + kelasStatus(k.status_terakhir) + '">' + esc(k.status_terakhir) + (k.tahun_terakhir ? ' ' + esc(k.tahun_terakhir) : '') + '</span></li>'; }).join('') + '</ul>' : '') + '</div>';
      }
      isi.innerHTML = judul('Profil kawasan · masyarakat', 'Desa binaan',
        'Desa penyangga menurut Laporan Kajian Wilayah Kerja Resor 2026, desa binaan tiap resor, dan kelompok binaan beserta kondisi terakhirnya dari laporan penyuluhan dan pemberdayaan masyarakat.',
        [['Dashboard Penyuluhan', PENYULUHAN], ['Kondisi kelompok binaan dari tahun ke tahun', PENYULUHAN + '#kelompok']]) +
        '<div class="angka-deret">' + angka('Desa penyangga', n(penyangga.length), 'di ' + n(kw.desa_penyangga.length) + ' kecamatan') +
        angka('Kelompok binaan', n(kel.length), n(stHit.aktif || 0) + ' aktif, ' + n(stHit['kurang aktif'] || 0) + ' kurang aktif') +
        angka('Kegiatan penyuluhan', n(py.length), (thPy.length ? Math.min.apply(null, thPy) + '–' + Math.max.apply(null, thPy) : '')) +
        angka('Desa dijangkau penyuluhan', n(dijangkau), 'termasuk desa di luar daftar penyangga') + '</div>' +
        '<div class="kisi-2" style="margin-top:16px"><div class="kotak"><h3>Kondisi kelompok binaan</h3><p class="ket">Status pada laporan terakhir tiap kelompok</p>' +
        batang(URUT_STATUS.filter(function (s) { return stHit[s]; }).map(function (s) { return [s, stHit[s], n(stHit[s]) + ' kelompok']; }), 'kelompok') + '</div>' +
        '<div class="kotak"><h3>Mata pencaharian masyarakat penyangga</h3><p class="ket">Laporan Kajian Wilayah Kerja Resor 2026</p><ul class="poin">' + kw.mata_pencaharian.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div></div>' +
        '<h2 class="sub">Desa penyangga per kecamatan</h2><p class="sub-ket">Resor pembina mengikuti wilayah kerja resor hasil kajian 2026. Jumlah kegiatan dihitung dari laporan penyuluhan yang menyebut desa itu.</p>' +
        '<div class="kisi-2">' + kw.desa_penyangga.map(function (k) {
          var ds = penyangga.filter(function (d) { return d.kec === k.kecamatan; });
          return '<div class="kec"><h3>Kecamatan ' + esc(k.kecamatan) + '<small>' + n(ds.length) + ' desa</small></h3>' + ds.map(kartuDesa).join('') + '</div>';
        }).join('') + '</div>' +
        (lain.length ? '<h2 class="sub">Desa lain dengan kelompok atau kegiatan penyuluhan</h2><p class="sub-ket">Desa yang tidak ada di daftar desa penyangga kajian, tetapi punya kelompok binaan, disebut sebagai desa binaan resor, atau disebut di sedikitnya dua laporan penyuluhan.</p><div class="kec">' + lain.map(kartuDesa).join('') + '</div>' : '');
      kakiData('Kajian Wilayah Kerja Resor ' + tgl(kj.sumber.tanggal) + ' · ' + n(kel.length) + ' kelompok dan ' + n(py.length) + ' laporan dari tab Penyuluhan');
    }).catch(galat);
  }

  /* ================= AKSESIBILITAS ================= */
  function akses() {
    memuat('Memuat aksesibilitas dan cakupan patroli…');
    semua(['resor/kajian_2026.json', 'resor/analisis.json', 'resor/peta.geojson', 'kehati/batas.json']).then(function (h) {
      var kj = h[0], an = h[1], gj = h[2], batas = h[3], kw = kj.kawasan;
      var AN = {}; an.resor.forEach(function (r) { AN[r.id] = r; });
      var k4 = kj.metode.kriteria.filter(function (k) { return k.id === 'akses'; })[0];
      var sel = gj.features.filter(function (f) { return f.properties.lapisan === 'sel_patroli'; });
      var jalurPendakian = (kw.wisata.filter(function (w) { return /pendakian/i.test(w.ket); })[0] || {}).ket || '';
      isi.innerHTML = judul('Profil kawasan · akses', 'Aksesibilitas ke dalam kawasan',
        'Jalan masuk dan moda akses tiap resor dari Laporan Kajian Wilayah Kerja Resor 2026, ditambah bukti lapangan: jalur patroli SMART ' + an.periode.tahun_awal + ' yang sudah menembus kawasan dan sel 1 km yang sudah dijangkau.',
        [['Profil Resor Pengelolaan', RESOR + '#/'], ['Metode kajian wilayah kerja resor', RESOR + '#/metode']]) +
        '<div class="angka-deret">' + angka('Jalur patroli di dalam kawasan', nd(an.sumber.jalur.km_dalam, 1) + '<small>km</small>', 'dari ' + nd(an.sumber.jalur.km_total, 0) + ' km terekam, ' + n(an.sumber.jalur.leg) + ' leg') +
        angka('Hari patroli', n(an.tn.hari_patroli), tgl(an.periode.awal) + ' – ' + tgl(an.periode.akhir)) +
        angka('Sel 1 km terjangkau', nd(an.tn.cakupan_pct, 1) + '<small>%</small>', n(an.tn.sel_terjamah) + ' dari ' + n(an.tn.sel) + ' sel') +
        angka('Jalur pendakian', '4', '2 jalan kaki, 2 berkendara') + '</div>' +
        '<div class="peta-wadah" style="margin-top:16px"><div class="peta" id="akPeta" role="region" aria-label="Peta sel 1 km yang dijangkau patroli"></div><div class="legenda"><span><i class="kotak-k" style="background:#6cc4ff"></i>Sel dilalui jalur patroli dan ada temuan</span><span><i class="kotak-k" style="background:rgba(108,196,255,.35);border:1px solid #6cc4ff"></i>Sel dilalui jalur patroli tanpa temuan</span><span><i class="garis"></i>Batas kawasan</span></div></div>' +
        sumberKecil('Sel patroli dari tab Resor Pengelolaan. Bagian kawasan yang belum terjangkau umumnya lereng atas dan kaldera yang hanya bisa dicapai jalan kaki.') +
        '<h2 class="sub">Akses ke wilayah kerja tiap resor</h2><p class="sub-ket">Bobot aksesibilitas adalah sumbangan kriteria ' + esc(k4 ? k4.kode + ' ' + k4.nama.toLowerCase() : 'aksesibilitas') + ' terhadap nilai resor bila termasuk empat parameter utamanya' + (k4 ? ' (' + esc(k4.data) + ')' : '') + '.</p><div id="akTabel"></div>' +
        '<div class="kisi-2" style="margin-top:16px"><div class="kotak"><h3>Jalur pendakian dan objek wisata</h3><p class="ket">' + esc(jalurPendakian) + '</p><ul class="poin">' + kw.wisata.map(function (w) { return '<li><b>' + esc(w.nama) + '</b><br><span class="redup">' + esc(w.ket) + '</span></li>'; }).join('') + '</ul></div>' +
        '<div class="kotak"><h3>Jangkauan patroli per resor</h3><p class="ket">Persentase sel 1 km di wilayah kerja resor yang dilalui jalur patroli SMART ' + an.periode.tahun_awal + '</p>' +
        batang(an.resor.map(function (r) { return ['Resor ' + r.nama, r.upaya.cakupan_pct, nd(r.upaya.cakupan_pct, 1) + '%']; }).sort(function (a, b) { return b[1] - a[1]; }), '% sel', 100) + '</div></div>';
      tabel(document.getElementById('akTabel'), {
        label: 'Akses tiap resor', baris: kj.resor, perHal: 10,
        kolom: [
          { id: 'nama', judul: 'Resor', nilai: function (r) { return r.kode; }, isi: function (r) { return '<a href="' + RESOR + '#/' + esc(r.id) + '">' + esc(r.nama) + '</a><small>SPTN Wilayah ' + esc(r.sptn) + '</small>'; } },
          { id: 'kantor', judul: 'Kantor atau pos', isi: function (r) { return esc(r.kantor); } },
          { id: 'akses', judul: 'Moda akses', isi: function (r) { return esc(r.akses); } },
          { id: 'bobot', judul: 'Bobot aksesibilitas', n: true, nilai: function (r) { var p = r.parameter_utama.filter(function (x) { return x[0] === 'Aksesibilitas'; })[0]; return p ? p[1] : null; }, isi: function (r) { var p = r.parameter_utama.filter(function (x) { return x[0] === 'Aksesibilitas'; })[0]; return p ? nd(p[1], 1) + '%' : '<span class="redup">bukan parameter utama</span>'; } },
          { id: 'km', judul: 'Jalur patroli', n: true, nilai: function (r) { return AN[r.id] ? AN[r.id].upaya.km_jalur : null; }, isi: function (r) { var a = AN[r.id]; return a ? nd(a.upaya.km_jalur, 1) + ' km<small>' + n(a.upaya.hari_patroli) + ' hari</small>' : '-'; } },
          { id: 'cak', judul: 'Sel terjangkau', n: true, nilai: function (r) { return AN[r.id] ? AN[r.id].upaya.cakupan_pct : null; }, isi: function (r) { var a = AN[r.id]; return a ? nd(a.upaya.cakupan_pct, 1) + '%<small>' + n(a.upaya.sel_terjamah) + ' dari ' + n(a.upaya.sel) + ' sel</small>' : '-'; } }
        ]
      });
      var p = peta(document.getElementById('akPeta'), batas, { resor: false, dasar: 'Topografi' });
      if (p) {
        var L = window.L;
        var lp = L.geoJSON({ type: 'FeatureCollection', features: sel }, {
          style: function (f) { var ada = f.properties.observasi > 0; return { color: '#6cc4ff', weight: 0.8, opacity: 0.9, fillColor: '#6cc4ff', fillOpacity: ada ? 0.7 : 0.25 }; },
          onEachFeature: function (f, l) { l.bindTooltip(n(f.properties.observasi) + ' temuan SMART di sel ini', { sticky: true }); }
        }).addTo(p.map);
        p.kendali.addOverlay(lp, 'Sel terjangkau patroli');
      }
      kakiData('Kajian Wilayah Kerja Resor ' + tgl(kj.sumber.tanggal) + ' · analisis SMART ' + tgl(an.diperbarui));
    }).catch(galat);
  }

  /* ================= KONDISI FISIK ================= */
  var WARNA_ZONA = { 'Zona Inti': '#a20711', 'Zona Rimba': '#199e70', 'Zona Pemanfaatan': '#3987e5', 'Zona Tradisional': '#e9c46d', 'Zona Rehabilitasi': '#d95926', 'Zona Khusus': '#b07cc6' };
  function fisik() {
    memuat('Memuat kondisi fisik kawasan…');
    semua(['resor/kajian_2026.json', 'resor/analisis.json', 'kehati/maxent.json', 'kehati/batas.json', 'tenurial/zonasi.geojson']).then(function (h) {
      var kj = h[0], an = h[1], mx = h[2], batas = h[3], zn = h[4], kw = kj.kawasan, fs = kw.fisik;
      var zona = {}; zn.features.forEach(function (f) { var z = f.properties.zona; zona[z] = (zona[z] || 0) + luasGeom(f.geometry); });
      var zBaris = Object.keys(zona).map(function (z) { return [z, zona[z]]; }).sort(function (a, b) { return b[1] - a[1]; }), zTot = zBaris.reduce(function (t, z) { return t + z[1]; }, 0);
      var eko = kw.ekosistem.slice().sort(function (a, b) { return b.ha - a.ha; });
      var tut = Object.keys(mx.luas_kelas_ha).filter(function (k) { return mx.luas_kelas_ha[k] > 0; }).map(function (k) { return [mx.kelas_tutupan[k] || k, mx.luas_kelas_ha[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
      var gunung = fs.gunung.slice().sort(function (a, b) { return b[1] - a[1]; });
      isi.innerHTML = judul('Profil kawasan · fisik', 'Kondisi fisik kawasan',
        'Topografi, geologi, dan tanah dari Laporan Kajian Wilayah Kerja Resor 2026; rentang elevasi, lereng, dan tutupan lahan dari lapisan model MaxEnt di tab Keanekaragaman Hayati; zonasi dari tab Konflik Tenurial; areal terbakar dan indeks kondisi fisik dari tab Resor Pengelolaan.',
        [['Profil Resor Pengelolaan', RESOR + '#/'], ['Konflik Tenurial (zonasi dan bidang garapan)', TENURIAL]]) +
        '<div class="angka-deret">' + angka('Puncak Tambora', n(fs.puncak_mdpl) + '<small>mdpl</small>', 'kaldera hasil letusan 1815') +
        angka('Rentang elevasi', n(mx.rentang.elev[0]) + '–' + n(mx.rentang.elev[1]) + '<small>m</small>', 'DEM sel 50 m') +
        angka('Kemiringan lereng', esc(fs.lereng.split(',')[0]),'paling curam ' + nd(mx.rentang.lereng[1], 0) + '° menurut DEM') +
        angka('Mata air', n(kw.air.mata_air), n(kw.air.dimanfaatkan) + ' dimanfaatkan masyarakat') +
        angka('Areal terbakar 2026', nd(an.tn.terbakar.ha, 0) + '<small>ha</small>', nd(an.tn.terbakar.pct, 1) + '% kawasan sejak ' + tgl(an.sumber.terbakar.awal_musim)) + '</div>' +
        '<div class="kisi-3" style="margin-top:16px">' +
        '<div class="kotak"><h3>Gunung dan perbukitan</h3><p class="ket">Ketinggian puncak (mdpl)</p>' + batang(gunung.map(function (g) { return [g[0], g[1], n(g[1])]; }), 'mdpl') + '</div>' +
        '<div class="kotak"><h3>Geologi dan tanah</h3><p class="ket">Laporan Kajian 2026</p><ul class="poin"><li><b>Geologi:</b> ' + esc(fs.geologi) + '</li><li><b>Tanah:</b> ' + esc(fs.tanah) + '</li><li><b>Lereng:</b> ' + esc(fs.lereng) + '</li></ul></div>' +
        '<div class="kotak"><h3>Sungai dan air</h3><p class="ket">Daerah tangkapan air Semenanjung Sanggar</p><div class="chip-deret">' + fs.sungai.map(function (s) { return '<span class="chip">' + esc(s) + '</span>'; }).join('') + '</div>' +
        '<p class="catatan">' + n(kw.air.mata_air) + ' mata air, ' + n(kw.air.dimanfaatkan) + ' dimanfaatkan oleh ' + esc(kw.air.pemanfaat) + '.</p>' +
        '<p class="catatan">Jasa lingkungan: ' + esc(kw.jasa_lingkungan.join('; ')) + '.</p></div></div>' +
        '<div class="kisi-2" style="margin-top:14px"><div class="kotak"><h3>Tipe ekosistem</h3><p class="ket">Luas menurut Laporan Kajian 2026 (ha)</p>' + batang(eko.map(function (e) { return [e.nama, e.ha, nd(e.ha, 0) + ' ha']; }), 'ha') + '</div>' +
        '<div class="kotak"><h3>Tutupan lahan</h3><p class="ket">Kelas tutupan pada lapisan model MaxEnt (ha)</p>' + batang(tut.map(function (t) { return [t[0], t[1], nd(t[1], 0) + ' ha']; }), 'ha') + '</div></div>' +
        '<h2 class="sub">Zonasi kawasan</h2><p class="sub-ket">Luas dihitung dari poligon zonasi di tab Konflik Tenurial, jadi bisa sedikit berbeda dengan angka di dokumen zonasi.' + (zTot < kw.luas_sk_ha * 0.95 ? ' Poligon itu baru mencakup ' + nd(zTot, 0) + ' ha dari ' + nd(kw.luas_sk_ha, 0) + ' ha luas kawasan, jadi zonasi di bagian lain belum tergambar.' : '') + '</p>' +
        '<div class="kisi-2"><div class="peta-wadah peta-kecil"><div class="peta" id="fsPeta" role="region" aria-label="Peta zonasi"></div><div class="legenda">' + zBaris.map(function (z) { return '<span><i class="kotak-k" style="background:' + (WARNA_ZONA[z[0]] || '#929381') + '"></i>' + esc(z[0]) + '</span>'; }).join('') + '</div></div>' +
        '<div class="kotak"><h3>Luas per zona</h3><p class="ket">Total ' + nd(zTot, 0) + ' ha</p>' + batang(zBaris.map(function (z) { return [z[0], z[1], nd(z[1], 0) + ' ha · ' + nd(z[1] / zTot * 100, 1) + '%']; }), 'ha') + '</div></div>' +
        '<h2 class="sub">Kondisi fisik dan kebakaran per resor</h2><p class="sub-ket">Indeks lokasi (LQ) kondisi fisik membandingkan bagian lereng curam dan elevasi tinggi di resor dengan rata-rata kawasan: di atas 1 berarti resor itu lebih penting untuk tata air dan pencegahan erosi. Areal terbakar dari delineasi musim ' + an.periode.tahun_awal + '.</p><div id="fsTabel"></div>';
      tabel(document.getElementById('fsTabel'), {
        label: 'Kondisi fisik per resor', baris: an.resor, urut: { id: 'lq', turun: true }, perHal: 10,
        kolom: [
          { id: 'nama', judul: 'Resor', nilai: function (r) { return r.nama; }, isi: function (r) { return '<a href="' + RESOR + '#/' + esc(r.id) + '">' + esc(r.nama) + '</a><small>SPTN Wilayah ' + esc(r.sptn) + '</small>'; } },
          { id: 'luas', judul: 'Luas', n: true, nilai: function (r) { return r.luas_ha; }, isi: function (r) { return nd(r.luas_ha, 0) + ' ha'; } },
          { id: 'lq', judul: 'LQ fisik', n: true, nilai: function (r) { return r.lq.fisik; }, isi: function (r) { return '<b style="color:' + (r.lq.fisik >= 1 ? 'var(--aksen-2)' : 'var(--teks-2)') + '">' + nd(r.lq.fisik, 2) + '</b>'; } },
          { id: 'eko', judul: 'Ekosistem dominan (temuan SMART)', isi: function (r) { return esc((r.ekosistem || []).slice(0, 2).map(function (e) { return e[0]; }).join(', ') || '-'); } },
          { id: 'fit', judul: 'Fitur alami', isi: function (r) { return esc((r.fitur_alami || []).map(function (e) { return e[0] + (e[1] > 1 ? ' (' + e[1] + ')' : ''); }).join(', ') || '-'); } },
          { id: 'bakar', judul: 'Terbakar', n: true, nilai: function (r) { return r.terbakar ? r.terbakar.pct : null; }, isi: function (r) { return r.terbakar ? nd(r.terbakar.ha, 0) + ' ha<small>' + nd(r.terbakar.pct, 1) + '% resor</small>' : '-'; } }
        ]
      });
      var p = peta(document.getElementById('fsPeta'), batas, { resor: false });
      if (p) {
        var lp = window.L.geoJSON(zn, {
          style: function (f) { var w = WARNA_ZONA[f.properties.zona] || '#929381'; return { color: w, weight: 1, fillColor: w, fillOpacity: 0.45 }; },
          onEachFeature: function (f, l) { l.bindTooltip(esc(f.properties.zona), { sticky: true }); }
        }).addTo(p.map);
        p.kendali.addOverlay(lp, 'Zonasi');
      }
      kakiData('Kajian Wilayah Kerja Resor ' + tgl(kj.sumber.tanggal) + ' · lapisan model ' + tgl(mx.dibuat) + ' · delineasi terbakar ' + tgl(an.sumber.terbakar.tanggal));
    }).catch(galat);
  }

  /* ================= rute ================= */
  var RUTE = {
    '': { judul: 'Ringkasan', muat: ringkasan },
    sebaran: { judul: 'Sebaran per jenis', muat: sebaran, ubah: function (arg) { if (SB && document.getElementById('sbProfil') && arg[0]) { profilJenis(arg[0]); return true; } return false; } },
    satwa: { judul: 'Distribusi habitat satwa liar', muat: satwa },
    tumbuhan: { judul: 'Distribusi tumbuhan', muat: tumbuhan },
    jenis: { judul: 'Daftar jenis terverifikasi', muat: jenis },
    desa: { judul: 'Desa binaan', muat: desa },
    akses: { judul: 'Aksesibilitas ke dalam kawasan', muat: akses },
    fisik: { judul: 'Kondisi fisik kawasan', muat: fisik }
  };
  var aktif = null;
  function kakiData(t) { var k = document.getElementById('kakiData'); if (k) k.textContent = t ? 'Sumber data: ' + t + '.' : ''; }
  function arah() {
    var p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
    var nama = p[0] || '', arg = p.slice(1), r = RUTE[nama];
    tip.hidden = true;
    Array.prototype.forEach.call(document.querySelectorAll('#tab a'), function (a) {
      if (a.getAttribute('data-rute') === nama) { a.setAttribute('aria-current', 'page'); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      else a.removeAttribute('aria-current');
    });
    if (!r) {
      lepas(); aktif = null;
      document.title = 'Halaman tidak ditemukan · Profil Kawasan';
      isi.innerHTML = '<div class="galat"><h2>Halaman tidak ditemukan</h2><p>Alamat <code>' + esc(location.hash) + '</code> tidak ada di Profil Kawasan.</p><p style="margin-top:14px"><a class="tombol" href="#/">Buka ringkasan</a></p></div>';
      return;
    }
    document.title = r.judul + ' · Profil Kawasan · TN Gunung Tambora';
    if (aktif === nama && r.ubah && r.ubah(arg)) return;
    lepas(); aktif = nama; SB = null;
    kakiData('');
    window.scrollTo(0, 0);
    r.muat(arg);
    isi.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', arah);
  arah();
})();
