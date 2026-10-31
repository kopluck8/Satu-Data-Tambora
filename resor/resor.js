/* Resor Pengelolaan: profil potensi dan ancaman tujuh resor TN Gunung Tambora (batas resor 2026).
   Data: ../data/resor/kajian_2026.json (Laporan Kajian), analisis.json dan peta.geojson (diolah harian oleh
   tools/resor/olah_resor.py dari data SMART dan delineasi areal terbakar), foto.json (tempat foto). */
(function () {
  'use strict';

  var DATA = '../data/resor/';
  var SIMULASI = 'https://kopluck8.github.io/Simulasi-API-Tambora/';
  var TINGKAT = ['–', 'Rendah', 'Sedang', 'Tinggi', 'Sangat tinggi'];
  var SINGKAT = {
    karhut: 'Kebakaran', rambah: 'Perambahan', buru: 'Perburuan', kayu: 'Pembalakan', ternak: 'Ternak liar',
    invasif: 'Invasif', tanpaizin: 'Pendakian ilegal', jalan: 'Akses jalan', tambang: 'Tambang'
  };
  var WARNA_ANCAMAN = {
    karhut: '#ff7a45', rambah: '#f2cf4a', buru: '#ff6b8b', kayu: '#c8925e', ternak: '#c7a2ff',
    invasif: '#9be26a', tanpaizin: '#6cc4ff', jalan: '#d6d6d6', tambang: '#9e9e9e', indikasi: '#a9b0a3'
  };
  var SATWA_WARNA = { 'Rusa timorensis': '#f3d28a', 'Nisaetus floris': '#8ad1ff' };
  var SPTN = {
    I: { nama: 'SPTN Wilayah I Kore', warna: '#7ccab6' },
    II: { nama: 'SPTN Wilayah II Pekat', warna: '#e9c46d' }
  };
  var IKON = {
    pohon: '<path d="M12 3.5 6.8 10.6h2.8L5.8 16.6h12.4l-3.8-6h2.8z"/><path d="M12 16.6v3.9"/>',
    kamera: '<path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10.5H4z"/><circle cx="12" cy="13.5" r="3.4"/>',
    air: '<path d="M12 3.5c3.1 4 5.6 7 5.6 10.1a5.6 5.6 0 0 1-11.2 0c0-3.1 2.5-6.1 5.6-10.1z"/>',
    daun: '<path d="M5 19.5c0-8.4 5.3-13.6 14.5-14.5-.9 9.3-6.1 14.5-14.5 14.5z"/><path d="M5 19.5 13.5 11"/>',
    gunung: '<path d="m2.5 19.5 6.5-12 4 6.5 2.5-3.5 6 9z"/>',
    tapak: '<circle cx="7.2" cy="9.4" r="1.7"/><circle cx="10.6" cy="6.4" r="1.7"/><circle cx="14.6" cy="6.6" r="1.7"/><circle cx="17.6" cy="10" r="1.7"/><path d="M8.6 16.2c0-2.7 1.9-4.8 4.2-4.8s4.2 2.1 4.2 4.8c0 1.8-1.2 3-2.8 3-1 0-1.4-.5-2.1-.5-.6 0-1.2.5-2.1.5-1.5 0-2.3-.9-1.4-3z"/>',
    api: '<path d="M12 3c.6 3 4.9 5.2 4.9 10.1a4.9 4.9 0 0 1-9.8 0c0-2.2 1.1-3.8 2.3-4.9.2 1.6.9 2.7 2 3.3-.3-3.2.1-6.2.6-8.5z"/>',
    perisai: '<path d="M12 3 4.5 6v5.6c0 4.4 3.2 7.9 7.5 9.4 4.3-1.5 7.5-5 7.5-9.4V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    orang: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c.6-3.3 2.8-5.2 5.5-5.2s4.9 1.9 5.5 5.2"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.3c2.6-.2 4.5 1.4 4.9 4.4"/>',
    teropong: '<circle cx="6.5" cy="15.5" r="3.5"/><circle cx="17.5" cy="15.5" r="3.5"/><path d="M10 15.5h4M3.5 13 6 5h3.5l.5 7.5M20.5 13 18 5h-3.5l-.5 7.5"/>',
    kompas: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    grafik: '<path d="M3.5 20h17"/><path d="M6.5 20v-7M12 20V5M17.5 20v-10"/>',
    kantor: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/>',
    peta: '<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
    timbang: '<path d="M12 4v16M7 20h10M4.5 7.5h15"/><path d="m4.5 7.5-2.5 6a2.5 2.5 0 0 0 5 0zM19.5 7.5l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
    dokumen: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'
  };
  var PILAR = [
    { id: 'perlindungan', nama: 'Perlindungan sistem penyangga kehidupan', pendek: 'fungsi perlindungan sistem penyangga kehidupan', ikon: 'air', dasar: 'Tata air, pencegah erosi, dan bentang alam' },
    { id: 'pengawetan', nama: 'Pengawetan keanekaragaman hayati', pendek: 'fungsi pengawetan keanekaragaman hayati', ikon: 'tapak', dasar: 'Habitat satwa kunci dan jenis dilindungi' },
    { id: 'pemanfaatan', nama: 'Pemanfaatan secara lestari', pendek: 'fungsi pemanfaatan secara lestari', ikon: 'daun', dasar: 'Wisata alam, HHBK, dan jasa lingkungan' }
  ];
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  var S = { kajian: null, analisis: null, foto: { tn: [], resor: {} }, batas: null, peta: null, terbakar: null, map: null, resor: [], byId: {} };

  /* ---------- utilitas ---------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(x, d) {
    if (x == null || isNaN(x)) return '–';
    return Number(x).toLocaleString('id-ID', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }
  function tgl(iso, panjang) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return '–';
    return +m[3] + ' ' + (panjang ? BULAN_PANJANG : BULAN)[+m[2] - 1] + ' ' + m[1];
  }
  function ikon(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IKON[n] || '') + '</svg>'; }
  function tingkat(t, jenis, besar, label) {
    return '<span class="tingkat' + (besar ? ' tingkat--besar' : '') + '" data-jenis="' + jenis + '" data-t="' + (t || 0) + '">' +
      esc(label || TINGKAT[t || 0]) + '</span>';
  }
  function meter(t, jenis) {
    var s = '';
    for (var i = 1; i <= 4; i++) s += '<i' + (i <= t ? ' class="on"' : '') + '></i>';
    return '<span class="meter4" data-jenis="' + jenis + '" data-t="' + t + '" role="img" aria-label="' + TINGKAT[t] + '">' + s + '</span>';
  }
  function daftar(arr) {
    arr = arr.filter(Boolean);
    if (arr.length < 2) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' dan ' + arr[arr.length - 1];
  }
  function namaAncaman(id) {
    var j = (S.analisis.jenis_ancaman || []).filter(function (x) { return x.id === id; })[0];
    return j ? j.nama : id;
  }
  function jenisAncaman(id) { return (S.analisis.jenis_ancaman || []).filter(function (x) { return x.id === id; })[0] || { nama: id, iucn: '', kelas: '' }; }
  function ambil(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r.json();
    });
  }
  function bagian(no, judul, isi, ket, id) {
    return '<section class="bagian"' + (id ? ' id="' + id + '"' : '') + '><div class="bagian-kepala"><span class="bagian-no">' + no + '</span><h2>' + judul + '</h2>' +
      (ket ? '<p>' + ket + '</p>' : '') + '</div>' + isi + '</section>';
  }
  function kartu(judul, isi, ik, kanan, kelas) {
    return '<div class="kartu ' + (kelas || '') + '"><div class="kartu-judul">' + (ik ? ikon(ik) : '') + '<span>' + judul + '</span>' +
      (kanan ? '<span class="kanan">' + kanan + '</span>' : '') + '</div>' + isi + '</div>';
  }
  function namaResor(r, tautan) {
    var isi = '<span class="nama-resor" data-sptn="' + r.sptn + '"><span class="no">' + r.kode + '</span>' + esc(r.nama) + '</span>';
    return tautan ? '<a href="#/' + r.id + '">' + isi + '</a>' : isi;
  }

  /* ---------- motif garis kontur untuk tempat foto ---------- */
  function pasangKontur() {
    var seed = 7;
    function acak() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var fase = [acak() * 6.28, acak() * 6.28, acak() * 6.28, acak() * 6.28];
    var garis = '';
    for (var i = 1; i <= 18; i++) {
      var r0 = i * 30, titik = [];
      for (var a = 0; a < 360; a += 5) {
        var t = a * Math.PI / 180;
        var r = r0 * (1 + 0.11 * Math.sin(3 * t + fase[0] + i * 0.16) + 0.06 * Math.sin(5 * t + fase[1] - i * 0.1) +
          0.035 * Math.sin(8 * t + fase[2] + i * 0.3) + 0.02 * Math.sin(13 * t + fase[3]));
        titik.push((560 + r * Math.cos(t) * 1.3).toFixed(1) + ' ' + (250 + r * Math.sin(t) * 0.82).toFixed(1));
      }
      garis += '<path d="M' + titik.join('L') + 'Z" stroke-width="' + (i % 5 === 0 ? 1.6 : 0.9) + '" stroke-opacity="' + (i % 5 === 0 ? 0.16 : 0.09) + '"/>';
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="#efe6c6">' + garis + '</g></svg>';
    document.documentElement.style.setProperty('--kontur', 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
  }

  /* ---------- foto ---------- */
  function srcFoto(src, kecil) {
    src = String(src || '').trim();
    if (!src) return '';
    var m = src.match(/drive\.google\.com\/(?:file\/d\/|open\?(?:[^#]*&)?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)([\w-]{10,})/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w' + (kecil ? 900 : 2000);
    if (/^https?:\/\/[^\s"'<>]+$/i.test(src)) return src;
    if (/^[\w-]+(\/[\w.-]+)*\.(jpe?g|png|webp|avif)$/i.test(src) && src.indexOf('..') < 0) {
      var p = '../' + src;
      return kecil && /^assets\/foto\/[^/]+\.(jpe?g|webp)$/i.test(src) ? p.replace(/\.(jpe?g|webp)$/i, '-kecil.$1') : p;
    }
    return '';
  }
  function fotoKosong(f, sampul) {
    return '<div class="foto-kosong">' + (sampul ? '<div class="tanda">' : '') + ikon('kamera') +
      '<b>' + (sampul ? 'Tempat foto sampul' : 'Tempat foto') + '</b><span>' + esc(f.tema) + '</span><em>Foto menyusul</em>' +
      (sampul ? '</div>' : '') + '</div>';
  }
  function htmlFoto(f, kecil) {
    var src = srcFoto(f.src, kecil);
    if (!src) return '<figure class="foto">' + fotoKosong(f) + '</figure>';
    var penuh = srcFoto(f.src, false);
    return '<figure class="foto"><img src="' + esc(src) + '"' + (penuh !== src ? ' data-penuh="' + esc(penuh) + '"' : '') +
      ' alt="' + esc(f.tema) + '" loading="lazy" decoding="async"><figcaption>' + esc(f.tema) +
      (f.kredit ? '<small>Foto: ' + esc(f.kredit) + '</small>' : '') + '</figcaption></figure>';
  }
  function daftarFoto(id) { return (id === 'tn' ? S.foto.tn : (S.foto.resor || {})[id]) || []; }
  function fotoUtama(id) {
    var d = daftarFoto(id);
    return d.filter(function (f) { return f.utama; })[0] || d[0] || { tema: 'Foto sampul', src: '' };
  }
  function galeri(id) {
    var d = daftarFoto(id), u = fotoUtama(id);
    var lain = d.filter(function (f) { return f !== u; });
    var urut = lain.filter(function (f) { return f.src; }).concat(lain.filter(function (f) { return !f.src; }));
    if (!urut.length) return '';
    return '<div class="galeri">' + urut.map(function (f, i) { return htmlFoto(f, i > 0); }).join('') + '</div>';
  }
  function sampul(o) {
    var f = o.foto, src = srcFoto(f.src, false);
    return '<section class="sampul"><div class="sampul-latar">' +
      (src ? '<img src="' + esc(src) + '" alt="' + esc(f.tema) + '" fetchpriority="high">' : fotoKosong(f, true)) + '</div>' +
      '<div class="sampul-isi"><div class="alis">' + o.alis.join('<span class="titik"></span>') + '</div>' +
      '<h1>' + o.judul + '</h1><p class="lede">' + o.lede + '</p>' +
      '<div class="angka-deret">' + o.angka.map(function (a) {
        return '<div class="angka"><div class="angka-label">' + a[0] + '</div><div class="angka-nilai">' + a[1] + '</div>' +
          (a[2] ? '<div class="angka-sub">' + a[2] + '</div>' : '') + '</div>';
      }).join('') + '</div></div>' +
      (src ? '<div class="sampul-kredit">' + esc(f.tema) + (f.kredit ? ' · Foto: ' + esc(f.kredit) : '') + '</div>' : '') + '</section>';
  }

  /* ---------- grafik sederhana ---------- */
  function batang(baris, opsi) {
    opsi = opsi || {};
    var maks = opsi.maks || Math.max.apply(null, baris.map(function (b) { return b.nilai; }).concat([1e-9]));
    return '<ul class="batang">' + baris.map(function (b) {
      var p = Math.max(0, Math.min(100, b.nilai / maks * 100));
      return '<li data-tip="' + esc(b.tip || ('<b>' + esc(b.nama) + '</b>' + esc(b.teks || fmt(b.nilai)))) + '"><span class="nm" title="' + esc(b.nama) + '">' + esc(b.nama) + '</span>' +
        '<span class="jalur"><i style="width:' + p.toFixed(1) + '%;' + (b.warna ? 'background:' + b.warna : '') + '"></i>' +
        (opsi.acuan != null ? '<span class="acuan" style="left:' + (opsi.acuan / maks * 100).toFixed(1) + '%"></span>' : '') + '</span>' +
        '<span class="nl">' + esc(b.teks || fmt(b.nilai)) + '</span></li>';
    }).join('') + '</ul>';
  }
  function angkaBulat(m) {
    if (m <= 5) return 5;
    var p = Math.pow(10, Math.floor(Math.log10(m))), n = m / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  function grafikBulanan(data) {
    var sempit = window.innerWidth < 600;
    var W = sempit ? 340 : 640, H = sempit ? 190 : 210, L = 32, R = 4, T = 10, B = 24, n = data.length;
    if (!n) return '<p class="redup">Belum ada data.</p>';
    var maks = angkaBulat(Math.max.apply(null, data.map(function (d) { return d[1]; }).concat([1])));
    var lebar = (W - L - R) / n, bw = Math.min(34, lebar * 0.62), tinggi = H - T - B;
    var y = function (v) { return T + tinggi - v / maks * tinggi; };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Observasi patroli per bulan dan temuan ancaman">';
    s += '<g class="kisi">' + [0, 0.5, 1].map(function (f) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(maks * f) + '" y2="' + y(maks * f) + '"/>'; }).join('') + '</g>';
    s += '<g class="sumbu">' + [0, 0.5, 1].map(function (f) { return '<text x="' + (L - 6) + '" y="' + (y(maks * f) + 4) + '" text-anchor="end">' + fmt(maks * f) + '</text>'; }).join('');
    data.forEach(function (d, i) {
      var x = L + i * lebar + lebar / 2, m = +d[0].slice(5, 7);
      if (n <= 12 || i % 2 === 0) s += '<text x="' + x + '" y="' + (H - 6) + '" text-anchor="middle">' + BULAN[m - 1] + '</text>';
    });
    s += '</g>';
    data.forEach(function (d, i) {
      var x = L + i * lebar + (lebar - bw) / 2, total = d[1], anc = d[2], lain = total - anc;
      var tip = '<b>' + BULAN_PANJANG[+d[0].slice(5, 7) - 1] + ' ' + d[0].slice(0, 4) + '</b>' + fmt(total) + ' observasi, ' + fmt(anc) + ' temuan ancaman';
      s += '<g class="kolom" data-tip="' + esc(tip) + '">';
      s += '<rect class="hit" x="' + (L + i * lebar) + '" y="' + T + '" width="' + lebar + '" height="' + tinggi + '"/>';
      if (anc) s += '<rect class="anc" x="' + x.toFixed(1) + '" y="' + y(anc).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (y(0) - y(anc)).toFixed(1) + '" rx="1.5"/>';
      if (lain) {
        var atas = y(total), bawah = y(anc) - (anc ? 2 : 0);
        if (bawah - atas > 0.5) s += '<rect class="lain" x="' + x.toFixed(1) + '" y="' + atas.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (bawah - atas).toFixed(1) + '" rx="1.5"/>';
      }
      s += '</g>';
    });
    return s + '</svg>';
  }

  /* ---------- peta ---------- */
  function hapusPeta() { if (S.map) { S.map.remove(); S.map = null; } }
  function muatPeta() {
    if (!S.peta) S.peta = ambil(DATA + 'peta.geojson').catch(function () { return { features: [] }; });
    return S.peta;
  }
  function muatTerbakar() {
    if (!S.terbakar) S.terbakar = ambil(SIMULASI + 'data/areal_terbakar.geojson').catch(function () { return null; });
    return S.terbakar;
  }
  function popupAncaman(p) {
    return '<b>' + esc(namaAncaman(p.jenis === 'indikasi' ? '' : p.jenis) || 'Indikasi aktivitas') + '</b><br>' +
      esc(p.tipe || '') + (p.jumlah ? ' · ' + esc(p.jumlah) : '') + '<br><span class="redup">' + tgl(p.tanggal) +
      (p.aktif ? ' · aktif' : '') + (p.indikasi ? ' · bukti tidak langsung' : '') + '</span>';
  }
  function bangunPeta(el, aktif) {
    if (!window.L || !el) return;
    hapusPeta();
    var map = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.25, attributionControl: true });
    S.map = map;
    var dasar = {
      'Citra satelit': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: 'Citra © Esri, Maxar, Earthstar Geographics' }),
      'Topografi': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: 'Peta © Esri' }),
      'OpenStreetMap': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' })
    };
    dasar['Citra satelit'].addTo(map);
    map.createPane('pBatas'); map.getPane('pBatas').style.zIndex = 420;
    map.createPane('pSel'); map.getPane('pSel').style.zIndex = 405;
    map.createPane('pBakar'); map.getPane('pBakar').style.zIndex = 400;
    var batas = L.geoJSON(S.batas, {
      pane: 'pBatas',
      style: function (f) {
        var p = f.properties, w = SPTN[p.sptn].warna, ini = aktif && S.byId[aktif].kode === p.kode;
        return aktif ? { color: ini ? '#fff' : w, weight: ini ? 3.2 : 1.4, opacity: ini ? 1 : 0.75, dashArray: ini ? null : '4 4', fillColor: w, fillOpacity: ini ? 0.10 : 0.04 }
          : { color: w, weight: 2, opacity: 0.95, fillColor: w, fillOpacity: 0.14 };
      },
      onEachFeature: function (f, l) {
        var r = S.resor.filter(function (x) { return x.kode === f.properties.kode; })[0];
        if (!r) return;
        l.bindTooltip('<span>' + r.kode + '<span class="nm"> · ' + esc(r.nama) + '</span></span><small>' + fmt(r.luas_ha) + ' ha</small>',
          { permanent: true, direction: 'center', className: 'label-resor', interactive: false });
        if (aktif !== r.id) {
          l.on('click', function () { location.hash = '#/' + r.id; });
          l.on('mouseover', function () { l.setStyle({ fillOpacity: aktif ? 0.12 : 0.26 }); });
          l.on('mouseout', function () { batas.resetStyle(l); });
        }
      }
    }).addTo(map);
    var kotak = aktif ? batas.getLayers().filter(function (l) { return l.feature.properties.kode === S.byId[aktif].kode; })[0].getBounds() : batas.getBounds();
    var sedangPas = false, disentuh = false;
    function pas() { sedangPas = true; map.fitBounds(kotak, { padding: [18, 18], animate: false }); sedangPas = false; }
    pas();
    map.on('dragstart zoomstart', function () { if (!sedangPas) disentuh = true; });

    var lapisan = {};
    var kontrol = L.control.layers(dasar, lapisan, { collapsed: !!aktif || innerWidth < 760, position: 'topright' }).addTo(map);
    var legenda = el.parentNode.querySelector('.peta-legenda') || el.parentNode.appendChild(document.createElement('div'));
    legenda.className = 'peta-legenda';
    var adaJenis = {};
    function grup(judul, isi) { return '<div class="lg-grup"><b>' + judul + '</b>' + isi + '</div>'; }
    function isiLegenda() {
      var urutJenis = Object.keys(WARNA_ANCAMAN).filter(function (j) { return adaJenis[j]; });
      legenda.innerHTML = grup('Batas resor', aktif
          ? '<span><i class="batas" style="border-color:#fff"></i>Resor ini</span><span><i class="batas putus" style="border-color:' + SPTN[S.byId[aktif].sptn].warna + '"></i>Resor tetangga</span>'
          : '<span><i class="batas" style="border-color:' + SPTN.I.warna + '"></i>SPTN I Kore</span><span><i class="batas" style="border-color:' + SPTN.II.warna + '"></i>SPTN II Pekat</span>') +
        (S._bakar ? grup('Kebakaran', '<span><i class="kotak" style="background:#ff5a36;border-color:#ff5a36"></i>Areal terbakar 2026</span>') : '') +
        (urutJenis.length ? grup('Temuan ancaman SMART', urutJenis.map(function (j) {
          return '<span><i style="background:' + WARNA_ANCAMAN[j] + '"></i>' + esc(j === 'indikasi' ? 'Indikasi (camp/alat)' : SINGKAT[j] || j) + '</span>';
        }).join('')) : '') +
        grup('Satwa kunci (sel 1 km)', '<span><i class="kotak" style="background:' + SATWA_WARNA['Rusa timorensis'] + '"></i>Rusa timor</span>' +
          '<span><i class="kotak" style="background:' + SATWA_WARNA['Nisaetus floris'] + '"></i>Elang flores</span>');
    }
    isiLegenda();
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        if (S.map !== map) return;
        map.invalidateSize({ animate: false });
        if (!disentuh) pas();
      });
      ro.observe(el);
      map.on('unload', function () { ro.disconnect(); });
    }

    muatTerbakar().then(function (gj) {
      if (!gj || !S.map || S.map !== map) return;
      var l = L.geoJSON(gj, { pane: 'pBakar', style: { stroke: false, fillColor: '#ff5a36', fillOpacity: 0.42 }, interactive: false });
      l.addTo(map);
      kontrol.addOverlay(l, 'Areal terbakar 2026 (delineasi)');
      S._bakar = true; isiLegenda();
    });
    muatPeta().then(function (gj) {
      if (!S.map || S.map !== map) return;
      var f = gj.features || [];
      var pilih = function (lap) { return f.filter(function (x) { return x.properties.lapisan === lap; }); };
      var sel = L.geoJSON({ type: 'FeatureCollection', features: pilih('sel_patroli') }, {
        pane: 'pSel', style: function (x) { var n = x.properties.observasi; return { color: '#f4eed8', weight: 0.6, opacity: 0.45, fillColor: '#f4eed8', fillOpacity: n >= 20 ? 0.24 : n >= 5 ? 0.15 : 0.07 }; },
        onEachFeature: function (x, l) { l.bindTooltip(fmt(x.properties.observasi) + ' observasi' + (x.properties.jalur ? ' · dilalui jalur patroli' : ''), { sticky: true }); }
      });
      kontrol.addOverlay(sel, 'Cakupan patroli (sel 1 km)');
      var satwa = L.geoJSON({ type: 'FeatureCollection', features: pilih('satwa_kunci') }, {
        pane: 'pSel', style: function (x) { var w = SATWA_WARNA[x.properties.ilmiah] || '#fff'; return { color: w, weight: 1.5, fillColor: w, fillOpacity: 0.32 }; },
        onEachFeature: function (x, l) {
          l.bindPopup('<b>' + esc(x.properties.jenis) + '</b> <i>' + esc(x.properties.ilmiah) + '</i><br>' + fmt(x.properties.rekaman) +
            ' rekaman SMART 2026<br><span class="redup">Lokasi disamarkan ke sel grid 1 km</span>');
        }
      }).addTo(map);
      kontrol.addOverlay(satwa, 'Satwa kunci (sel 1 km)');
      var titik = L.geoJSON({ type: 'FeatureCollection', features: pilih('ancaman') }, {
        pointToLayer: function (x, ll) {
          var p = x.properties;
          adaJenis[p.jenis] = 1;
          return L.circleMarker(ll, { radius: p.indikasi ? 4.5 : 6.5, color: '#fff', weight: 1.4, fillColor: WARNA_ANCAMAN[p.jenis] || '#ccc', fillOpacity: p.indikasi ? 0.7 : 0.95 });
        },
        onEachFeature: function (x, l) { l.bindPopup(popupAncaman(x.properties)); }
      }).addTo(map);
      kontrol.addOverlay(titik, 'Temuan ancaman SMART 2026');
      var lain = L.geoJSON({ type: 'FeatureCollection', features: pilih('fitur').concat(pilih('pemanfaatan')) }, {
        pointToLayer: function (x, ll) {
          var hh = x.properties.lapisan === 'pemanfaatan';
          return L.circleMarker(ll, { radius: 5, color: hh ? '#ffe08a' : '#8fe0ff', weight: 2, fillColor: '#0d1a13', fillOpacity: 0.9 });
        },
        onEachFeature: function (x, l) {
          l.bindPopup('<b>' + (x.properties.lapisan === 'pemanfaatan' ? 'Pemanfaatan HHBK' : 'Fitur alami') + '</b><br>' + esc(x.properties.tipe) + '<br><span class="redup">' + tgl(x.properties.tanggal) + '</span>');
        }
      });
      kontrol.addOverlay(lain, 'Fitur alami dan HHBK');
      isiLegenda();
    });
  }

  /* ---------- isi bersama ---------- */
  function sumberData() {
    var A = S.analisis, s = A.sumber.smart, tb = A.sumber.terbakar || {};
    return '<ul class="sumber-daftar">' +
      '<li>' + esc(S.kajian.sumber.judul) + ', ' + esc(S.kajian.sumber.penyusun) + ', ' + tgl(S.kajian.sumber.tanggal, true) + '.</li>' +
      '<li>SMART Patrol ' + A.periode.tahun_awal + ': ' + fmt(s.dipakai) + ' observasi (' + fmt(s.drive) + ' dari file patroli Drive, ' + fmt(s.sheet) + ' tambahan dari ' +
      esc(s.sheet_dari === 'Google Sheets' ? 'Google Sheets' : 'file cadangan') + '), ' + tgl(A.periode.awal) + ' s.d. ' + tgl(A.periode.akhir) + '; ' +
      fmt(s.dalam_resor) + ' berada di dalam atau tepi batas resor 2026.</li>' +
      (tb.tersedia ? '<li>Delineasi manual areal terbakar sejak ' + tgl(tb.awal_musim) + ', terakhir ' + tgl(tb.tanggal) + ' (Simulasi-API-Tambora).</li>' : '') +
      '<li>Batas resor 2026 (SHP kajian). Batas lama tetap dipakai dashboard SMART dan RBM.</li>' +
      '<li>Diolah otomatis ' + tgl(A.diperbarui) + ' pukul ' + esc((A.diperbarui || '').slice(11, 16)) + ' WITA.</li></ul>';
  }
  function catatanIndikatif(a) {
    return '<div class="catatan-data">' + ikon('info') + '<span><b>Penilaian indikatif.</b> Baru ' + fmt(a.upaya.hari_patroli) + ' hari patroli tercatat dan ' +
      fmt(a.upaya.cakupan_pct) + '% sel grid resor yang terjamah, sehingga ancaman yang belum ditemukan patroli bisa saja ada. Nilai akan berubah otomatis begitu data patroli bertambah.</span></div>';
  }

  /* ---------- ikhtisar ---------- */
  function halamanIkhtisar() {
    var K = S.kajian, A = S.analisis, tn = A.tn, tb = A.sumber.terbakar || {};
    var personel = S.resor.reduce(function (s, r) { return s + r.personelTotal; }, 0);
    var html = sampul({
      foto: fotoUtama('tn'),
      alis: ['Profil wilayah kerja resor', '2 SPTN', '7 resor'],
      judul: 'Tujuh Resor Pengelolaan<br>Taman Nasional Gunung Tambora',
      lede: 'Kajian wilayah kerja resor 2026 membagi kawasan seluas <b>' + fmt(K.kawasan.luas_kajian_ha, 2) + ' ha</b> menjadi tujuh resor di dua SPTN, ' +
        'termasuk resor baru <b>Doro Tabe</b>. Profil ini memadukan hasil kajian dengan temuan patroli SMART ' + A.periode.tahun_awal +
        ' untuk memetakan potensi dan ancaman di setiap resor.',
      angka: [
        ['Luas kawasan (kajian)', fmt(K.kawasan.luas_kajian_ha, 0) + '<small>ha</small>', 'SK: ' + fmt(K.kawasan.luas_sk_ha, 2) + ' ha'],
        ['Resor pengelolaan', '7', '3 di SPTN I, 4 di SPTN II'],
        ['Kebutuhan personel resor', fmt(personel) + '<small>orang</small>', 'hasil analisis beban kerja'],
        ['Observasi SMART ' + A.periode.tahun_awal, fmt(tn.observasi), fmt(tn.hari_patroli) + ' hari patroli'],
        ['Areal terbakar ' + A.periode.tahun_awal, tn.terbakar ? fmt(tn.terbakar.ha) + '<small>ha</small>' : '–',
          tn.terbakar ? fmt(tn.terbakar.pct, 1) + '% kawasan' + (tb.awal_musim ? ', sejak ' + tgl(tb.awal_musim) : '') : 'belum tersedia']
      ]
    });

    var kartuResor = S.resor.map(function (r) {
      var a = r.a, f = fotoUtama(r.id), src = srcFoto(f.src, true);
      return '<a class="resor-kartu" href="#/' + r.id + '" data-sptn="' + r.sptn + '">' +
        (r.baru ? '<span class="pita lencana lencana--baru">Resor baru</span>' : '') +
        '<div class="gambar">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<div class="foto-kosong"></div>') + '</div>' +
        '<div class="isi"><h3><span class="no-besar">' + r.kode + '</span>' + esc(r.nama) + '</h3>' +
        '<div class="sub">' + esc(SPTN[r.sptn].nama) + ' · ' + fmt(r.luas_ha, 0) + ' ha</div>' +
        '<div class="baris"><span>Potensi</span>' + tingkat(a.potensi.total.tingkat, 'p') + '</div>' +
        '<div class="baris"><span>Status ancaman</span>' + tingkat(a.status_ancaman, 'a') + '</div>' +
        '<div class="baris"><span>Ancaman utama</span><span>' + esc(a.ancaman_utama.map(function (j) { return SINGKAT[j]; }).join(', ') || '–') + '</span></div>' +
        '<div class="baris"><span>Personel · desa binaan</span><span>' + r.personelTotal + ' · ' + r.desa.length + '</span></div></div></a>';
    }).join('');
    html += bagian('01', 'Peta tujuh resor', '<div class="peta-wadah"><div class="peta peta--besar" id="peta"></div></div>' +
      '<p class="peta-catatan">Klik wilayah resor untuk membuka profilnya. Lapisan areal terbakar, temuan ancaman, satwa kunci, dan cakupan patroli dapat dinyalakan dari tombol lapisan.</p>' +
      '<div class="resor-kisi" style="margin-top:20px">' + kartuResor + '</div>',
      'Batas resor hasil kajian 2026. Warna garis menunjukkan SPTN: hijau toska untuk SPTN I Kore (Bima), kuning savana untuk SPTN II Pekat (Dompu).');

    // matriks ancaman
    var jenis = tn.ancaman.map(function (x) { return x.id; });
    var kepala = '<tr><th>Resor</th>' + jenis.map(function (j) { return '<th class="c" title="' + esc(namaAncaman(j)) + '">' + esc(SINGKAT[j]) + '</th>'; }).join('') +
      '<th class="c">Rangkuman</th></tr>';
    var badan = S.resor.map(function (r) {
      return '<tr><th>' + namaResor(r, true) + '</th>' + jenis.map(function (j) {
        var x = r.a.ancaman.filter(function (y) { return y.id === j; })[0];
        if (!x) return '<td class="kosong">·</td>';
        var tip = '<b>' + esc(r.nama) + ' · ' + esc(namaAncaman(j)) + ': ' + TINGKAT[x.peringkat] + '</b>Lingkup ' + TINGKAT[x.lingkup.nilai].toLowerCase() +
          ', keparahan ' + TINGKAT[x.keparahan.nilai].toLowerCase() + ', ketakpulihan ' + TINGKAT[x.ketakpulihan.nilai].toLowerCase() +
          '<br>' + fmt(x.temuan) + ' temuan SMART · sumber: ' + esc(x.sumber.join(', '));
        return '<td data-tip="' + esc(tip) + '">' + tingkat(x.peringkat, 'a') + '</td>';
      }).join('') + '<td>' + tingkat(r.a.status_ancaman, 'a', false) + '</td></tr>';
    }).join('');
    var kaki = '<tr><th>Kawasan</th>' + jenis.map(function (j) {
      var x = tn.ancaman.filter(function (y) { return y.id === j; })[0];
      return '<td data-tip="' + esc('<b>' + esc(namaAncaman(j)) + '</b>' + fmt(x.temuan) + ' temuan di ' + x.resor + ' resor') + '">' + tingkat(x.peringkat, 'a') + '</td>';
    }).join('') + '<td>' + tingkat(tn.status_ancaman, 'a') + '</td></tr>';
    var tabelAncaman = '<div class="tabel-wadah"><table class="peta-panas"><thead>' + kepala + '</thead><tbody>' + badan + '</tbody><tfoot>' + kaki + '</tfoot></table></div>';

    var tabelPotensi = '<div class="tabel-wadah"><table class="peta-panas"><thead><tr><th>Resor</th>' +
      PILAR.map(function (p) { return '<th class="c">' + esc(p.nama.split(' ')[0]) + '</th>'; }).join('') + '<th class="c">Potensi</th></tr></thead><tbody>' +
      S.resor.map(function (r) {
        return '<tr><th>' + namaResor(r, true) + '</th>' + PILAR.map(function (p) {
          var x = r.a.potensi[p.id];
          return '<td data-tip="' + esc('<b>' + esc(r.nama) + ' · ' + esc(p.nama) + '</b>Skor ' + fmt(x.skor, 2) + ' dari 4: ' +
            x.indikator.map(function (i) { return esc(i.nama) + ' ' + i.skor; }).join('; ')) + '">' + tingkat(x.tingkat, 'p') + '</td>';
        }).join('') + '<td>' + tingkat(r.a.potensi.total.tingkat, 'p', false, TINGKAT[r.a.potensi.total.tingkat] + ' · ' + fmt(r.a.potensi.total.skor, 2)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    var skala = function (jenis, judul) {
      return '<div class="skala"><span class="skala-judul">' + judul + '</span>' + [1, 2, 3, 4].map(function (t) { return tingkat(t, jenis); }).join('') + '</div>';
    };
    html += bagian('02', 'Peta potensi dan ancaman',
      '<div class="skala-deret">' + skala('a', 'Ancaman') + skala('p', 'Potensi') + '<span class="kecil redup">Arahkan kursor atau ketuk sel tabel untuk melihat dasar penilaiannya.</span></div>' +
      '<div class="grid">' + kartu('Peringkat ancaman per resor', tabelAncaman +
        '<p class="kartu-catatan">Peringkat ancaman memakai Miradi (Conservation Standards): lingkup × keparahan × ketakpulihan, dari temuan SMART ' + A.periode.tahun_awal +
        ', delineasi areal terbakar, dan ancaman utama dalam Laporan Kajian. Rangkuman resor dan kawasan memakai aturan 3-5-7 dan 2-prime. Tanda · berarti ancaman itu belum tercatat di resor tersebut. <a href="#/metode">Lihat metode</a>.</p>', 'perisai') +
      kartu('Tingkat potensi per resor', tabelPotensi +
        '<p class="kartu-catatan">Potensi dinilai menurut tiga fungsi kawasan konservasi (UU 5/1990 jo. UU 32/2024). Setiap fungsi punya tiga indikator berskor 1–4; tingkat diambil dari rata-rata skor. Resor dengan potensi tinggi dan ancaman tinggi menjadi prioritas pengamanan; resor dengan sedikit hari patroli ditandai indikatif di halaman profilnya.</p>', 'daun') + '</div>',
      'Ringkasan hasil penilaian untuk semua resor. Klik nama resor untuk membuka profil lengkap.');

    // perbandingan
    var baris = S.resor.map(function (r) {
      var a = r.a, z = r.zonation;
      return '<tr><th>' + namaResor(r, true) + '</th><td class="n">' + fmt(r.luas_ha, 0) + '</td><td class="n">' + fmt(r.luas_ha / K.kawasan.luas_kajian_ha * 100, 1) + '%</td>' +
        '<td class="n">' + fmt(z.wds, 2) + '</td><td class="n">' + fmt(z.wfd, 2) + '</td><td class="n">' + r.personelTotal + '</td><td class="n">' + r.desa.length + '</td>' +
        '<td class="n">' + fmt(a.upaya.hari_patroli) + '</td><td class="n">' + fmt(a.upaya.cakupan_pct, 0) + '%</td>' +
        '<td class="n">' + (a.terbakar ? fmt(a.terbakar.pct, 1) + '%' : '–') + '</td></tr>';
    }).join('');
    var tabelBanding = '<div class="tabel-wadah"><table><thead><tr><th>Resor</th><th class="n">Luas (ha)</th><th class="n">Porsi luas</th><th class="n" title="Workload Distribution Share">WDS</th>' +
      '<th class="n" title="Workload Fair-share Density">WFD</th><th class="n">Personel</th><th class="n">Desa binaan</th><th class="n">Hari patroli</th><th class="n">Sel terjamah</th><th class="n">Terbakar</th></tr></thead><tbody>' +
      baris + '</tbody><tfoot><tr><th>Kawasan</th><td class="n">' + fmt(K.kawasan.luas_kajian_ha, 0) + '</td><td class="n">100%</td><td class="n">1,00</td><td class="n">1,00</td><td class="n">' +
      personel + '</td><td class="n">' + K.kawasan.desa_penyangga.reduce(function (s, x) { return s + x.desa.length; }, 0) + '</td><td class="n">' + fmt(tn.hari_patroli) +
      '</td><td class="n">' + fmt(tn.cakupan_pct, 0) + '%</td><td class="n">' + (tn.terbakar ? fmt(tn.terbakar.pct, 1) + '%' : '–') + '</td></tr></tfoot></table></div>';

    var sh = K.metode.shannon;
    var dumbel = function (nama, lama, baru) {
      var x = function (v) { return ((v - 0.6) / 0.4 * 100).toFixed(1) + '%'; };
      return '<div class="dumbel-baris" data-tip="' + esc('<b>' + nama + '</b>Sebelum ' + fmt(lama, 4) + ' → sesudah ' + fmt(baru, 4)) + '"><span>' + nama + '</span><div class="dumbel-jalur">' +
        '<span class="ambang" style="left:' + x(0.8) + '"></span><span class="ambang" style="left:' + x(0.9) + '"></span>' +
        '<span class="rentang" style="left:' + x(Math.min(lama, baru)) + ';width:calc(' + x(Math.max(lama, baru)) + ' - ' + x(Math.min(lama, baru)) + ')"></span>' +
        '<span class="t t--lama" style="left:' + x(lama) + '"></span><span class="t t--baru" style="left:' + x(baru) + '"></span></div>' +
        '<span class="kecil">' + fmt(lama, 2) + ' → <b>' + fmt(baru, 2) + '</b></span></div>';
    };
    var shannon = '<div class="dumbel">' + dumbel('SPTN I Kore', sh.eksisting.sptn1, sh.usulan.sptn1) + dumbel('SPTN II Pekat', sh.eksisting.sptn2, sh.usulan.sptn2) +
      dumbel('Kawasan', sh.eksisting.tn, sh.usulan.tn) + '<div class="dumbel-sumbu"><span></span><div><span>0,6</span><span>0,8</span><span>0,9</span><span>1,0</span></div><span></span></div></div>' +
      '<div class="legenda"><span><i style="background:var(--teks-3);border-radius:50%"></i>6 resor (sebelum)</span><span><i style="background:var(--emas);border-radius:50%"></i>7 resor (kajian 2026)</span>' +
      '<span><i class="garis" style="border-left:1px dashed var(--garis-2)"></i>batas kelas 0,80 dan 0,90</span></div>' +
      '<p class="kartu-catatan">Indeks kemerataan Shannon (E) beban kerja antarresor: ' + esc(K.metode.kelas_e) + '. Pemekaran Doro Tabe menaikkan kemerataan SPTN II dari timpang menjadi sangat seimbang.</p>';
    var pindah = [];
    S.resor.forEach(function (r) {
      (r.a.asal || []).forEach(function (x) {
        if (x[0] !== r.nama && x[1] >= 100) pindah.push({ r: r, dari: x[0], ha: x[1] });
      });
    });
    pindah.sort(function (p, q) { return q.ha - p.ha; });
    var perubahan = '<ul class="perubahan">' + pindah.map(function (p) {
      return '<li><b>' + esc(p.r.nama) + '</b>' + (p.r.baru ? ' <span class="lencana lencana--baru">baru</span>' : '') + '<span>' +
        (p.r.baru ? 'dibentuk dari ' : 'menerima ') + fmt(p.ha, 0) + ' ha wilayah Resor ' + esc(p.dari) + '</span></li>';
    }).join('') + '</ul>';
    var asal = '<div class="tabel-wadah"><table><thead><tr><th>Resor 2026</th><th>Berasal dari resor lama (ha)</th></tr></thead><tbody>' + S.resor.map(function (r) {
      return '<tr><th>' + namaResor(r, true) + '</th><td>' + (r.a.asal || []).map(function (x) { return '<span class="chip"><b>' + esc(x[0]) + '</b> ' + fmt(x[1], 0) + '</span>'; }).join(' ') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    html += bagian('03', 'Beban kerja dan perubahan batas',
      '<div class="grid">' + tabelBanding + '<div class="grid grid-2s">' + kartu('Kemerataan beban kerja', shannon +
        '<div class="sub-judul" style="margin-top:18px">Perpindahan wilayah terbesar</div>' + perubahan, 'timbang') +
      kartu('Dari 6 menjadi 7 resor', asal + '<p class="kartu-catatan">Luas tumpang susun batas 2026 dengan batas resor lama (dashboard SMART). Batas lama hanya dibaca untuk perbandingan.</p>', 'peta') + '</div></div>',
      'WDS adalah porsi beban kerja resor terhadap kawasan, WFD kepadatan beban kerja per satuan luas (1 = rata-rata kawasan). Hari patroli dan sel terjamah dihitung dari SMART ' + A.periode.tahun_awal + '.');

    html += bagian('04', 'Galeri kawasan', galeri('tn'), 'Foto kawasan dari dokumentasi Balai. Foto per resor ada di halaman profil masing-masing.');
    html += bagian('05', 'Sumber data', sumberData());
    return { html: html, setelah: function () { bangunPeta($('#peta'), null); } };
  }

  /* ---------- profil resor ---------- */
  function halamanResor(r) {
    var K = S.kajian, A = S.analisis, a = r.a, tb = A.sumber.terbakar || {};
    var sp = K.sptn.filter(function (x) { return x.id === r.sptn; })[0] || {};
    var pctLuas = r.luas_ha / K.kawasan.luas_kajian_ha * 100;
    var pilarAtas = PILAR.slice().sort(function (x, y) { return a.potensi[y.id].skor - a.potensi[x.id].skor; })[0];
    var utama = a.ancaman.filter(function (x) { return a.ancaman_utama.indexOf(x.id) >= 0; });

    var lede = (r.baru ? 'Resor baru hasil kajian 2026 yang dimekarkan dari Resor Doroncanga. ' : '') +
      'Resor ' + esc(r.nama) + ' mengelola <b>' + fmt(r.luas_ha, 2) + ' ha</b> (' + fmt(pctLuas, 1) + '% kawasan) di ' + esc(SPTN[r.sptn].nama) +
      ' dengan desa binaan ' + esc(daftar(r.desa)) + '. Potensinya tergolong <b>' + TINGKAT[a.potensi.total.tingkat].toLowerCase() + '</b>, terutama ' + pilarAtas.pendek + '.';
    if (utama.length) {
      lede += ' Ancaman utamanya ' + utama.map(function (x) { return '<b>' + esc(namaAncaman(x.id).toLowerCase()) + '</b>'; }).join(' dan ') +
        ' (' + TINGKAT[utama[0].peringkat].toLowerCase() + ')';
      if (a.terbakar && a.terbakar.pct >= 5 && a.ancaman_utama.indexOf('karhut') >= 0) lede += ': ' + fmt(a.terbakar.pct, 0) + '% luas resor terbakar sejak ' + tgl(tb.awal_musim, true);
      lede += '.';
    }
    var html = sampul({
      foto: fotoUtama(r.id),
      alis: ['Resor ' + r.kode, esc(SPTN[r.sptn].nama)].concat(r.baru ? ['<span class="lencana lencana--baru">Resor baru 2026</span>'] : [])
        .concat(a.upaya.indikatif ? ['<span class="lencana lencana--indikatif">Data patroli terbatas</span>'] : []),
      judul: '<small>Profil Resor</small>' + esc(r.nama),
      lede: lede,
      angka: [
        ['Luas wilayah kerja', fmt(r.luas_ha, 0) + '<small>ha</small>', fmt(pctLuas, 1) + '% kawasan'],
        ['Desa binaan', fmt(r.desa.length), esc(daftar(r.desa))],
        ['Kebutuhan personel', fmt(r.personelTotal) + '<small>orang</small>', 'hasil analisis beban kerja'],
        ['Hari patroli ' + A.periode.tahun_awal, fmt(a.upaya.hari_patroli), fmt(a.upaya.cakupan_pct, 0) + '% sel grid terjamah'],
        ['Areal terbakar ' + A.periode.tahun_awal, a.terbakar ? fmt(a.terbakar.ha, 0) + '<small>ha</small>' : '–', a.terbakar ? fmt(a.terbakar.pct, 1) + '% luas resor' : 'belum tersedia']
      ]
    });

    // 01 identitas + peta
    var param = (r.parameter_utama || []).map(function (p) { return { nama: p[0], nilai: p[1], teks: fmt(p[1], 1) + '%', warna: 'var(--emas)' }; });
    var fakta = '<dl class="fakta">' +
      '<dt>Kode resor</dt><dd>' + r.kode + '</dd>' +
      '<dt>SPTN</dt><dd>' + esc(SPTN[r.sptn].nama) + (sp.kabupaten ? ' (Kabupaten ' + esc(sp.kabupaten) + ')' : '') + '</dd>' +
      '<dt>Luas</dt><dd>' + fmt(r.luas_ha, 2) + ' ha</dd>' +
      '<dt>Kantor resor</dt><dd>' + esc(r.kantor) + '</dd>' +
      '<dt>Desa binaan</dt><dd><div class="chip-deret">' + r.desa.map(function (d) { return '<span class="chip">' + esc(d) + '</span>'; }).join('') + '</div></dd>' +
      '<dt>Aksesibilitas</dt><dd>' + esc(r.akses) + '</dd>' +
      '<dt>Asal wilayah</dt><dd>' + (a.asal || []).map(function (x) { return 'Resor ' + esc(x[0]) + ' ' + fmt(x[1], 0) + ' ha'; }).join(' · ') + '</dd>' +
      '<dt>Fokus pengelolaan</dt><dd><div class="chip-deret">' + r.fokus.map(function (d) { return '<span class="chip chip--emas">' + esc(d) + '</span>'; }).join('') + '</div></dd>' +
      '</dl>';
    var idKartu = kartu('Identitas resor', fakta + '<div style="margin-top:14px"><div class="kartu-judul" style="margin-bottom:8px">' + ikon('grafik') + '<span>Porsi kriteria terbesar (Zonation 5)</span></div>' +
      batang(param, { maks: Math.max(30, Math.max.apply(null, param.map(function (p) { return p.nilai; }))) }) +
      '<p class="kartu-catatan">Bagian nilai tiap kriteria seluruh kawasan yang berada di resor ini, menurut Laporan Kajian.</p></div>', 'kantor');
    html += bagian('01', 'Identitas dan wilayah kerja', '<div class="grid grid-2"><div class="peta-wadah peta-wadah--isi"><div class="peta peta--besar" id="peta"></div></div>' + idKartu + '</div>',
      'Batas resor 2026 hasil kajian. Lapisan peta dapat dinyalakan dari tombol di kanan atas peta.');

    // 02 ringkasan penilaian
    var potKotak = '<div class="kartu nilai-kotak"><div class="label">Potensi resor</div><div class="besar">' + tingkat(a.potensi.total.tingkat, 'p', true) +
      '<span class="skor">skor ' + fmt(a.potensi.total.skor, 2) + ' dari 4</span></div><ul>' + PILAR.map(function (p) {
        return '<li><span>' + esc(p.nama) + '</span>' + meter(a.potensi[p.id].tingkat, 'p') + '</li>';
      }).join('') + '</ul></div>';
    var ancKotak = '<div class="kartu nilai-kotak"><div class="label">Status ancaman</div><div class="besar">' + tingkat(a.status_ancaman, 'a', true) +
      '<span class="skor">rangkuman ' + a.ancaman.length + ' ancaman</span></div><ul>' + a.ancaman.slice(0, 4).map(function (x) {
        return '<li><span>' + esc(namaAncaman(x.id)) + '</span>' + meter(x.peringkat, 'a') + '</li>';
      }).join('') + '</ul></div>';
    var u = a.upaya;
    var upKotak = '<div class="kartu nilai-kotak"><div class="label">Dasar data patroli</div><div class="besar"><span class="tingkat tingkat--besar" data-jenis="p" data-t="' +
      (u.indikatif ? 1 : u.cakupan_pct >= 40 ? 4 : 3) + '">' + (u.indikatif ? 'Terbatas' : u.cakupan_pct >= 40 ? 'Baik' : 'Memadai') + '</span>' +
      '<span class="skor">' + fmt(u.hari_patroli) + ' hari patroli</span></div><ul>' +
      '<li><span>Sel grid 1 km terjamah</span><b>' + fmt(u.sel_terjamah) + ' dari ' + fmt(u.sel) + ' (' + fmt(u.cakupan_pct, 0) + '%)</b></li>' +
      '<li><span>Observasi SMART ' + A.periode.tahun_awal + '</span><b>' + fmt(u.observasi) + '</b></li>' +
      '<li><span>Jalur patroli terekam</span><b>' + fmt(u.km_jalur, 0) + ' km</b></li></ul></div>';
    html += bagian('02', 'Ringkasan penilaian', '<div class="nilai-utama">' + potKotak + ancKotak + upKotak + '</div>' + (u.indikatif ? '<div style="margin-top:14px">' + catatanIndikatif(a) + '</div>' : ''),
      'Potensi menurut tiga fungsi konservasi dan status ancaman menurut penilaian Miradi. Rincian dan dasar setiap nilai ada di bawah.');

    // 03 potensi
    var pilar = '<div class="grid grid-3">' + PILAR.map(function (p) {
      var x = a.potensi[p.id];
      return '<div class="kartu pilar"><div class="pilar-kepala"><span class="pilar-ikon">' + ikon(p.ikon) + '</span><div><h3>' + esc(p.nama) + '</h3>' +
        '<div class="pilar-dasar">' + esc(p.dasar) + '</div></div></div><div>' + tingkat(x.tingkat, 'p', true) + ' <span class="redup kecil">skor ' + fmt(x.skor, 2) + '</span></div>' +
        '<ul class="indikator">' + x.indikator.map(function (i) {
          var nilai = typeof i.nilai === 'number' ? (i.nama.indexOf('LQ') >= 0 ? fmt(i.nilai, 2) : fmt(i.nilai)) : i.nilai;
          return '<li><span class="nm">' + esc(i.nama) + '</span><span class="nl">' + esc(nilai) + ' · ' + esc(i.ket) + '</span><span class="sk">' + meter(i.skor, 'p') + '</span></li>';
        }).join('') + '</ul></div>';
    }).join('') + '</div>';
    var st = a.satwa;
    var kunci = '<div class="satwa-kunci">' + st.kunci.map(function (k) {
      var diKajian = r.potensi.join(' ').toLowerCase().indexOf(k.nama.toLowerCase()) >= 0;
      return '<div><b>' + esc(k.nama) + '</b><span class="ilmiah">' + esc(k.ilmiah) + '</span><div class="bukti">' +
        (k.rekaman ? '<span class="ada">' + fmt(k.rekaman) + ' rekaman SMART</span> di ' + fmt(k.sel) + ' sel' : '<span class="tidak">Belum terekam SMART ' + A.periode.tahun_awal + '</span>') +
        (diKajian ? '<br>Habitat menurut Laporan Kajian' : '') + '</div></div>';
    }).join('') + '</div>';
    var jenisBaris = function (x) {
      return '<li><span>' + esc(x.nama) + (x.dilindungi ? '<span class="status status--lindung" title="Dilindungi Permen LHK P.106/2018">Dilindungi</span>' : '') +
        (x.iucn && x.iucn !== 'LC' && x.iucn !== 'NE' ? '<span class="status status--' + esc(x.iucn) + '" title="Daftar Merah IUCN">' + esc(x.iucn) + '</span>' : '') + '</span>' +
        '<span class="sub ilmiah">' + esc(x.ilmiah) + '</span><span class="n">' + fmt(x.n) + '</span></li>';
    };
    var satwaKartu = kartu('Satwa liar', kunci +
      '<div class="indeks-deret" style="margin-top:14px"><div><b>' + fmt(st.S) + '</b><span>jenis tercatat</span></div><div><b>' + (st.H != null ? fmt(st.H, 2) : '–') + '</b><span>indeks Shannon H′</span></div>' +
      '<div><b>' + (st.E != null ? fmt(st.E, 2) : '–') + '</b><span>kemerataan Pielou E</span></div></div>' +
      (st.penting.length ? '<div class="kartu-judul" style="margin:6px 0 4px;font-size:13.5px">Jenis dilindungi atau terancam</div><ul class="jenis-daftar">' + st.penting.map(jenisBaris).join('') + '</ul>' : '') +
      (st.teratas.length ? '<div class="kartu-judul" style="margin:14px 0 4px;font-size:13.5px">Paling sering dijumpai</div><ul class="jenis-daftar">' + st.teratas.slice(0, 5).map(jenisBaris).join('') + '</ul>' : '') +
      '<p class="kartu-catatan">' + fmt(st.rekaman) + ' rekaman satwa SMART ' + A.periode.tahun_awal + (st.teridentifikasi < st.rekaman ? ', ' + fmt(st.teridentifikasi) + ' di antaranya teridentifikasi sampai jenis' : '') +
        '. Indeks dihitung dari jumlah rekaman per jenis dan bergantung pada upaya patroli. Status mengikuti tabel status jenis Dashboard SMART.</p>', 'tapak', fmt(st.rekaman) + ' rekaman');
    var eko = function (arr) { return arr.length ? '<div class="chip-deret">' + arr.map(function (e) { return '<span class="chip">' + esc(e[0]) + ' <i>' + e[1] + '</i></span>'; }).join('') + '</div>' : '<p class="redup kecil">Belum ada ground check.</p>'; };
    var tum = a.tumbuhan;
    var habitatKartu = kartu('Ekosistem, tumbuhan, dan potensi lain',
      '<div class="kartu-judul" style="font-size:13.5px;margin-bottom:6px">Potensi menurut Laporan Kajian</div><ul class="jenis-daftar">' +
      r.potensi.map(function (p) { return '<li><span>' + esc(p) + '</span></li>'; }).join('') + '</ul>' +
      '<div class="kartu-judul" style="font-size:13.5px;margin:14px 0 6px">Tipe ekosistem (ground check)</div>' + eko(a.ekosistem) +
      '<div class="kartu-judul" style="font-size:13.5px;margin:14px 0 6px">Tutupan lahan (ground check)</div>' + eko(a.tutupan) +
      (tum.teratas.length ? '<div class="kartu-judul" style="font-size:13.5px;margin:14px 0 4px">Tumbuhan paling sering dicatat <span class="kanan">' + fmt(tum.S) + ' jenis</span></div><ul class="jenis-daftar">' +
        tum.teratas.slice(0, 4).map(function (x) { return '<li><span>' + esc(x.nama) + '</span><span class="sub ilmiah">' + esc(x.ilmiah) + '</span><span class="n">' + fmt(x.n) + '</span></li>'; }).join('') + '</ul>' : '') +
      ((a.fitur_alami.length || a.hhbk) ? '<div class="kartu-judul" style="font-size:13.5px;margin:14px 0 6px">Temuan SMART lain</div><div class="chip-deret">' +
        a.fitur_alami.map(function (f) { return '<span class="chip">' + esc(f[0]) + ' <i>' + f[1] + '</i></span>'; }).join('') +
        (a.hhbk ? '<span class="chip">pengambilan HHBK (madu) <i>' + a.hhbk + '</i></span>' : '') + '</div>' : ''), 'daun');
    html += bagian('03', 'Profil potensi', pilar + '<div class="grid grid-2s" style="margin-top:18px">' + satwaKartu + habitatKartu + '</div>',
      'Tiga fungsi konservasi kawasan: perlindungan sistem penyangga kehidupan, pengawetan keanekaragaman hayati, dan pemanfaatan secara lestari. Indikator memadukan hasil kajian (indeks lokasi kriteria Zonation) dengan temuan SMART.');

    // 04 ancaman
    var kartuAncaman = a.ancaman.map(function (x) {
      var j = jenisAncaman(x.id);
      var kr = function (nama, v, ket) {
        return '<div class="kriteria-baris"><span class="k">' + nama + '</span>' + meter(v, 'a') + '<span class="v">' + TINGKAT[v] + (ket ? ' · ' + esc(ket) : '') + '</span></div>';
      };
      return '<div class="kartu ancaman"><div class="a-kepala"><div class="kode">IUCN-CMP ' + esc(j.iucn) + ' · ' + esc(j.kelas) + '</div><h3>' + esc(j.nama) + '</h3></div>' +
        '<div class="a-nilai">' + tingkat(x.peringkat, 'a', true) + '</div>' +
        '<div class="a-isi">' + (x.rincian ? '<p class="rinci">' + esc(x.rincian) + '</p>' : '') +
        '<div class="chip-deret sumber">' + x.sumber.map(function (s) { return '<span class="chip">' + esc(s === 'SMART' ? 'SMART ' + A.periode.tahun_awal : s === 'delineasi' ? 'Delineasi areal terbakar' : 'Laporan Kajian') + '</span>'; }).join('') + '</div></div>' +
        '<div class="kriteria">' + kr('Lingkup', x.lingkup.nilai, x.lingkup.pct != null ? fmt(x.lingkup.pct, 0) + '%' : '') + kr('Keparahan', x.keparahan.nilai) + kr('Ketakpulihan', x.ketakpulihan.nilai) + '</div>' +
        '<div class="laju">' + (x.temuan ? '<b>' + fmt(x.temuan) + '</b> temuan · ' +
          (x.laju != null ? fmt(x.laju, 1) + ' per 10 hari patroli' : '') + (x.rasio ? ' (' + fmt(x.rasio, 1) + '× rata-rata)' : '') : 'Belum ada temuan SMART') +
        (x.terakhir ? '<br>terakhir ' + tgl(x.terakhir) : '') + '</div>' +
        '<details><summary>Dasar penilaian</summary><ul><li><b>Lingkup:</b> ' + esc(x.lingkup.dasar) + '</li><li><b>Keparahan:</b> ' + esc(x.keparahan.alasan.join('; ')) + '</li>' +
        '<li><b>Ketakpulihan:</b> ' + esc(x.ketakpulihan.alasan) + '</li><li><b>Magnitudo</b> (lingkup × keparahan): ' + TINGKAT[x.magnitudo] + '; <b>peringkat</b> (magnitudo × ketakpulihan): ' + TINGKAT[x.peringkat] + '</li>' +
        (x.aktif || x.tindak_lanjut ? '<li>' + fmt(x.aktif) + ' temuan aktif, ' + fmt(x.tindak_lanjut) + ' ditandai perlu tindak lanjut.</li>' : '') + '</ul></details></div>';
    }).join('');
    var terbaru = a.temuan_terbaru.length ? '<ul class="jenis-daftar">' + a.temuan_terbaru.map(function (t) {
      return '<li><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:8px;background:' + (WARNA_ANCAMAN[t.jenis] || '#ccc') + '"></i>' +
        esc(namaAncaman(t.jenis)) + '</span><span class="sub">' + (t.n > 1 ? fmt(t.n) + ' titik · ' : '') + esc(t.tipe) + (t.aktif ? ' · aktif' : '') + '</span><span class="n">' + tgl(t.tanggal) + '</span></li>';
    }).join('') + '</ul>' : '<p class="redup kecil">Belum ada temuan ancaman pada periode ini.</p>';
    var grafik = kartu('Observasi dan temuan ancaman per bulan', '<div class="grafik">' + grafikBulanan(a.bulanan) + '</div>' +
      '<div class="legenda"><span><i style="background:var(--a3)"></i>Temuan ancaman</span><span><i style="background:#4f7a5d"></i>Observasi lain</span></div>', 'grafik', A.periode.tahun_awal);
    var kajianAnc = kartu('Catatan lapangan dan kajian', '<div class="dua-kolom"><div><div class="sub-judul">Temuan ancaman terbaru (SMART)</div>' + terbaru + '</div>' +
      '<div><div class="sub-judul">Ancaman utama menurut Laporan Kajian</div><div class="chip-deret">' +
      r.ancaman.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</div>' +
      '<p class="kecil redup" style="margin-top:8px">Dari data gangguan kawasan 2021–2026 yang dipakai kajian untuk kriteria kerawanan.</p>' +
      (a.invasif.length ? '<div class="sub-judul" style="margin-top:16px">Tumbuhan invasif tercatat</div><div class="chip-deret">' + a.invasif.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</div>' : '') +
      (a.indikasi ? '<div class="sub-judul" style="margin-top:16px">Indikasi aktivitas</div><p class="kecil" style="color:var(--teks-2)">' + fmt(a.indikasi) + ' temuan camp, alat kerja, atau pelaku lain yang belum bisa dikaitkan ke satu jenis ancaman. Temuan ini tetap tampil di peta sebagai titik abu-abu.</p>' : '') +
      '</div></div>', 'dokumen');
    html += bagian('04', 'Profil ancaman', (u.indikatif ? catatanIndikatif(a) + '<div style="height:14px"></div>' : '') +
      '<div class="ancaman-daftar">' + (kartuAncaman || '<p class="redup">Belum ada ancaman yang dinilai.</p>') + '</div>' +
      '<div style="margin-top:18px">' + kajianAnc + '</div>',
      'Setiap ancaman dinilai dengan Miradi (Conservation Standards): lingkup (bagian resor yang terdampak), keparahan (tingkat kerusakan), dan ketakpulihan (lama pemulihan). Laju temuan dihitung per 10 hari patroli dan dibandingkan dengan rata-rata kawasan.');

    // 05 beban kerja dan SDM
    var lq = ['gangguan', 'fisik', 'wisata', 'kehati'].map(function (c) {
      var nama = { gangguan: 'Gangguan/kerawanan', fisik: 'Kondisi fisik', wisata: 'Pelayanan wisata', kehati: 'Potensi kehati' }[c];
      return { nama: nama, nilai: a.lq[c], teks: fmt(a.lq[c], 2), warna: a.lq[c] >= 1 ? 'var(--daun)' : '#5d7464',
        tip: '<b>' + nama + '</b>Porsi kriteria ' + fmt(r.zonation[c] * 100, 1) + '% dibanding porsi luas ' + fmt(pctLuas, 1) + '% → LQ ' + fmt(a.lq[c], 2) };
    });
    var lqKartu = kartu('Indeks lokasi kriteria kajian', batang(lq, { maks: Math.max(2, Math.max.apply(null, lq.map(function (x) { return x.nilai; }))), acuan: 1 }) +
      '<div class="legenda"><span><i class="garis" style="background:var(--emas-2)"></i>LQ = 1: setara rata-rata kawasan</span></div>' +
      '<dl class="fakta" style="margin-top:12px"><dt>WDS</dt><dd>' + fmt(r.zonation.wds, 2) + ' (porsi beban kerja terhadap kawasan)</dd><dt>WFD</dt><dd>' + fmt(r.zonation.wfd, 2) +
      ' (kepadatan beban kerja; 1 = rata-rata)</dd><dt>Prioritas</dt><dd>' + fmt(r.zonation.p_tn * 100, 1) + '% dari total prioritas kawasan</dd></dl>' +
      '<p class="kartu-catatan">LQ = porsi nilai kriteria di resor ÷ porsi luas resor. LQ di atas 1 berarti kriteria itu lebih terkonsentrasi di resor ini dibanding rata-rata kawasan.</p>', 'timbang');
    var sdm = '<ul class="personel">' + r.personel.map(function (p) {
        return '<li><div class="jab"><b>' + esc(p.jabatan) + '</b><span class="orang">' + p.n + ' <small>orang</small></span></div><p>' + esc(p.tugas) + '</p></li>';
      }).join('') + '<li class="jumlah"><div class="jab"><b>Jumlah</b><span class="orang">' + r.personelTotal + ' <small>orang</small></span></div></li></ul>';
    html += bagian('05', 'Beban kerja dan sumber daya manusia', '<div class="grid grid-2">' + kartu('Kebutuhan personel resor', sdm +
      '<p class="kartu-catatan">Formasi hasil analisis beban kerja (ABK) dalam Laporan Kajian.</p>', 'orang') + lqKartu + '</div>',
      'Beban kerja resor menurut pemodelan Zonation 5 dalam Laporan Kajian dan kebutuhan personelnya.');

    // 06 patroli
    var kat = a.kategori.map(function (k) { return { nama: k[0], nilai: k[1] }; });
    var masy = a.masyarakat;
    var upayaDeret = '<div class="fakta-deret">' +
      '<div><span>Hari patroli</span><b>' + fmt(u.hari_patroli) + '</b><small>tanggal dengan observasi di resor ini</small></div>' +
      '<div><span>Sel grid 1 km terjamah</span><b>' + fmt(u.sel_terjamah) + '<i> / ' + fmt(u.sel) + '</i></b><small>' + fmt(u.cakupan_pct, 1) + '% luas resor tersentuh patroli</small></div>' +
      '<div><span>Jalur patroli terekam</span><b>' + fmt(u.km_jalur, 0) + '<i> km</i></b><small>hanya jalur yang terunggah ke Drive</small></div>' +
      '<div><span>Pemberdayaan masyarakat</span><b>' + fmt(masy.kegiatan) + '<i> kegiatan</i></b><small>' + (masy.kegiatan ? esc(masy.jenis.map(function (j) { return j[0].toLowerCase() + ' ' + j[1]; }).join(', ')) : 'belum tercatat di SMART') + '</small></div>' +
      '<div><span>Pengambilan HHBK</span><b>' + fmt(a.hhbk) + '<i> temuan</i></b><small>' + (a.hhbk ? 'madu hutan' : 'belum tercatat') + '</small></div></div>';
    var patroli = kartu('Upaya patroli dan kegiatan', upayaDeret +
        '<p class="kartu-catatan">Kegiatan pemberdayaan di desa penyangga dihitung ke resor terdekat dalam radius 10 km.</p>', 'kompas') +
      '<div class="grid grid-2s" style="margin-top:18px">' + grafik + kartu('Observasi menurut kategori', batang(kat) +
      '<p class="kartu-catatan">' + fmt(u.observasi) + ' observasi di dalam batas resor, termasuk ' + fmt(u.observasi_tepi) + ' titik tepi (hingga 500 m di luar batas).</p>', 'teropong', fmt(u.observasi)) + '</div>';
    html += bagian('06', 'Patroli SMART ' + A.periode.tahun_awal, patroli, 'Rekap data SMART Patrol yang berada di dalam batas resor 2026, periode ' + tgl(A.periode.awal) + ' sampai ' + tgl(A.periode.akhir) + '.');

    // 07 arahan
    html += bagian('07', 'Arahan pengelolaan', '<div class="kartu"><ol class="arahan">' + a.arahan.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
      '<p class="kartu-catatan">Disusun otomatis dari hasil penilaian ancaman, potensi, dan cakupan patroli. Perlu ditelaah dan dilengkapi Kepala Resor dan SPTN sebelum dipakai dalam rencana kerja.</p></div>',
      'Langkah prioritas yang mengikuti ancaman dengan peringkat tertinggi dan potensi utama resor.');

    // 08 galeri
    html += bagian('08', 'Galeri foto', galeri(r.id), 'Tempat foto disiapkan per tema. Foto yang sudah ada langsung tampil; sisanya menunggu dokumentasi resor.');
    html += bagian('09', 'Sumber data', sumberData());
    return { html: html, setelah: function () { bangunPeta($('#peta'), r.id); } };
  }

  /* ---------- metode ---------- */
  function halamanMetode() {
    var K = S.kajian, A = S.analisis;
    var mat = function (judulBaris, judulKolom, fn) {
      var urut = [4, 3, 2, 1];
      return '<table class="matriks"><thead><tr><th class="sudut"><span>' + judulBaris + ' ↓</span><span>' + judulKolom + ' →</span></th>' +
        urut.map(function (k) { return '<th>' + TINGKAT[k] + '</th>'; }).join('') + '</tr></thead><tbody>' +
        urut.map(function (b) {
          return '<tr><th>' + TINGKAT[b] + '</th>' + urut.map(function (k) { var v = fn(b, k); return '<td data-t="' + v + '">' + TINGKAT[v] + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
    };
    var MAG = function (kep, ling) { return Math.min(kep, ling); };
    var PER = function (mag, pul) { var t = { 4: [0, 3, 4, 4, 4], 3: [0, 2, 3, 3, 4], 2: [0, 1, 2, 2, 3], 1: [0, 1, 1, 1, 2] }; return t[mag][pul]; };
    var kriteria = K.metode.kriteria.map(function (k) { return { nama: k.kode + ' ' + k.nama, nilai: k.bobot, teks: fmt(k.bobot * 100, 1) + '%', warna: 'var(--emas)', tip: '<b>' + esc(k.nama) + '</b>' + esc(k.data) }; });
    var rata = A.tn.laju_rata;
    var html = '<section class="sampul" style="min-height:0"><div class="sampul-latar"><div class="foto-kosong"></div></div><div class="sampul-isi" style="padding-top:56px">' +
      '<div class="alis">Metode analisis</div><h1 style="max-width:22ch">Cara potensi dan ancaman resor dinilai</h1>' +
      '<p class="lede">Profil memadukan tiga sumber: Laporan Hasil Kajian Wilayah Kerja Resor 2026, data SMART Patrol, dan delineasi areal terbakar. Semua angka dihitung ulang setiap hari oleh GitHub Actions.</p></div></section>';
    html += bagian('01', 'Sumber data dan batas resor', '<div class="grid grid-2s">' + kartu('Sumber', sumberData(), 'dokumen') +
      kartu('Pembagian data ke resor 2026', '<div class="prosa kecil"><p>Setiap observasi SMART dipetakan ke batas resor 2026 menurut koordinatnya (proyeksi UTM 50S), bukan menurut kolom resor di SMART yang masih memakai batas lama.</p>' +
        '<ul><li>Titik hingga <b>500 m</b> di luar batas dihitung ke resor terdekat (titik tepi, misalnya patroli di jalan batas).</li>' +
        '<li>Kegiatan pemberdayaan di desa penyangga dihitung ke resor terdekat dalam radius <b>10 km</b>.</li>' +
        '<li><b>Hari patroli</b> = jumlah tanggal dengan observasi di resor. Satuan ini dipakai karena jalur patroli yang terunggah belum lengkap (' + fmt(A.sumber.jalur.km_dalam) + ' km di dalam kawasan).</li>' +
        '<li><b>Sel terjamah</b> = sel grid pengelolaan 1 km yang berisi observasi atau dilalui jalur patroli minimal 50 m.</li>' +
        '<li>Lokasi satwa kunci di peta disamarkan ke sel 1 km untuk mencegah penyalahgunaan.</li></ul></div>', 'peta') + '</div>');
    html += bagian('02', 'Penilaian ancaman (Miradi)',
      '<div class="grid">' + kartu('Tiga kriteria', '<div class="prosa kecil kolom-2"><p>Setiap ancaman di setiap resor dinilai dengan <b>Miradi Simple Threat Rating</b> dari Conservation Standards (CMP), dengan klasifikasi ancaman langsung IUCN-CMP.</p>' +
        '<ul><li><b>Lingkup</b>: bagian resor yang terdampak dalam 10 tahun. Sangat tinggi 71–100%, tinggi 31–70%, sedang 11–30%, rendah 1–10%. Dihitung dari porsi areal terbakar (kebakaran) atau porsi sel terjamah yang berisi temuan. Ancaman yang tercantum sebagai ancaman utama resor dalam Laporan Kajian (data gangguan 2021–2026) diberi lingkup minimal sedang.</li>' +
        '<li><b>Keparahan</b>: tingkat kerusakan di areal terdampak. Nilai dasar per jenis ancaman, naik satu tingkat bila: lebih dari 30% resor terbakar, api masuk hutan atau pegunungan, garapan aktif ≥ 10 ha, perburuan menyasar satwa kunci atau dilindungi, atau laju temuan ≥ 2× rata-rata kawasan (minimal 3 temuan). Temuan kayu bakar saja bernilai rendah.</li>' +
        '<li><b>Ketakpulihan</b>: lama dan biaya pemulihan. Rendah 0–5 tahun, sedang 6–20 tahun, tinggi 21–100 tahun, sangat tinggi lebih dari 100 tahun.</li></ul>' +
        '<p>Rangkuman per resor dan per kawasan memakai aturan Miradi: <b>3-5-7</b> (3 tinggi = 1 sangat tinggi, 5 sedang = 1 tinggi, 7 rendah = 1 sedang) dan <b>2-prime</b> (butuh dua peringkat setara untuk mencapai satu tingkat; satu peringkat tertinggi menjadi satu tingkat di bawahnya).</p></div>', 'perisai') +
      '<div class="grid grid-2s">' + kartu('Lingkup × keparahan = magnitudo', '<div class="gulir-x">' + mat('Keparahan', 'Lingkup', MAG) + '</div>', 'grafik') +
      kartu('Magnitudo × ketakpulihan = peringkat', '<div class="gulir-x">' + mat('Magnitudo', 'Ketakpulihan', PER) + '</div>', 'grafik') + '</div></div>' +
      '<div class="tabel-wadah" style="margin-top:18px"><table class="tabel-lipat"><thead><tr><th>Jenis ancaman</th><th>Kode IUCN-CMP</th><th class="n">Laju kawasan<br><small>per 10 hari patroli</small></th></tr></thead><tbody>' +
      A.jenis_ancaman.filter(function (j) { return rata[j.id] != null; }).map(function (j) {
        return '<tr><th>' + esc(j.nama) + '</th><td>' + esc(j.iucn) + ' ' + esc(j.kelas) + '</td><td class="n">' + fmt(rata[j.id], 2) + '</td></tr>';
      }).join('') + '</tbody></table></div>',
      'Metode yang dipakai lembaga konservasi untuk menilai ancaman langsung terhadap target konservasi secara konsisten.');
    html += bagian('03', 'Penilaian potensi', '<div class="grid grid-2s">' + kartu('Tiga fungsi konservasi', '<div class="prosa kecil"><p>Potensi dinilai menurut tiga fungsi kawasan konservasi dalam UU 5/1990 jo. UU 32/2024. Setiap fungsi punya tiga indikator yang diberi skor 1–4; tingkat fungsi diambil dari rata-rata skor (di bawah 1,75 rendah, 1,75–2,49 sedang, 2,50–3,24 tinggi, 3,25 ke atas sangat tinggi). Potensi resor adalah rata-rata ketiga fungsi.</p>' +
      '<ul><li><b>Perlindungan sistem penyangga kehidupan</b>: LQ kondisi fisik (lereng dan elevasi), sumber air dan alur sungai, fitur geologi dan bentang alam.</li>' +
      '<li><b>Pengawetan keanekaragaman hayati</b>: LQ potensi kehati (MaxEnt), bukti keberadaan Rusa timor dan Elang flores, jumlah jenis dilindungi atau terancam yang tercatat patroli.</li>' +
      '<li><b>Pemanfaatan secara lestari</b>: LQ pelayanan wisata, objek dan jalur wisata alam, HHBK dan jasa lingkungan.</li></ul>' +
      '<p><b>Indeks lokasi (LQ)</b> = porsi nilai kriteria Zonation di resor ÷ porsi luas resor. Skor LQ: ≥ 1,2 → 4; 1,0–1,19 → 3; 0,8–0,99 → 2; di bawah 0,8 → 1.</p></div>', 'daun') +
      kartu('Bobot kriteria AHP dalam Laporan Kajian', batang(kriteria, { maks: 0.3 }) +
        '<p class="kartu-catatan">Konsistensi AHP: λmaks ' + fmt(K.metode.ahp.lambda_maks, 4) + ', CI ' + fmt(K.metode.ahp.ci, 4) + ', CR ' + fmt(K.metode.ahp.cr, 4) + ' (≤ 0,10). ' + esc(K.metode.ringkas) + '</p>', 'timbang') + '</div>');
    html += bagian('04', 'Keterbatasan', '<div class="kartu prosa"><ul>' +
      '<li>Data SMART baru mencakup tahun ' + A.periode.tahun_awal + ' dan sebarannya belum merata; resor dengan kurang dari 10 hari patroli atau cakupan sel di bawah 15% ditandai indikatif.</li>' +
      '<li>Ketiadaan temuan belum tentu berarti ketiadaan ancaman. Karena itu ancaman utama dari Laporan Kajian tetap dinilai walau belum ada temuan tahun ini.</li>' +
      '<li>Indeks Shannon dihitung dari jumlah rekaman per jenis, sehingga dipengaruhi upaya dan lokasi patroli.</li>' +
      '<li>Nilai keparahan dan ketakpulihan dasar adalah penilaian pakar yang dapat disesuaikan bersama tim resor di <code>tools/resor/olah_resor.py</code>.</li>' +
      '<li>Status IUCN mengikuti tabel status jenis Dashboard SMART; Laporan Kajian mencatat Elang flores sebagai EN, tabel SMART mencatat CR.</li></ul></div>');
    html += bagian('05', 'Pustaka', '<div class="kartu"><ol class="pustaka">' +
      '<li>Balai TN Tambora. 2026. Laporan Hasil Kajian Wilayah Kerja Resor Taman Nasional Gunung Tambora. Dompu.</li>' +
      '<li>Conservation Measures Partnership. 2020. Open Standards for the Practice of Conservation, Version 4.0.</li>' +
      '<li>Salafsky N, Salzer D, Stattersfield AJ, dkk. 2008. A standard lexicon for biodiversity conservation: unified classifications of threats and actions. Conservation Biology 22(4): 897–911.</li>' +
      '<li>Foundations of Success. 2009. Conceptualizing and Planning Conservation Projects and Programs: A Training Manual (Miradi threat rating).</li>' +
      '<li>Sadikin LA, Ginanjar N, Yuswa R, Anwar. 2020. Panduan Analisis Data SMART: Pembelajaran dari Taman Nasional Berbak dan Sembilang. ZSL Indonesia, Bogor.</li>' +
      '<li>Critchlow R, Plumptre AJ, Driciru M, dkk. 2015. Spatiotemporal trends of illegal activities from ranger-collected data in a Ugandan national park. Conservation Biology 29(5): 1458–1470.</li>' +
      '<li>Magurran AE. 2004. Measuring Biological Diversity. Blackwell, Oxford.</li>' +
      '<li>Undang-Undang Nomor 5 Tahun 1990 jo. Undang-Undang Nomor 32 Tahun 2024 tentang Konservasi Sumber Daya Alam Hayati dan Ekosistemnya.</li>' +
      '<li>Peraturan Menteri Lingkungan Hidup dan Kehutanan Nomor 16 Tahun 2024 tentang Resor pada Unit Pelaksana Teknis Direktorat Jenderal Konservasi Sumber Daya Alam dan Ekosistem.</li></ol></div>');
    return { html: html, setelah: function () {} };
  }

  /* ---------- rute ---------- */
  function isiTab(aktif) {
    var a = function (href, isi, id, sptn) {
      return '<a href="' + href + '"' + (aktif === id ? ' aria-current="page"' : '') + (sptn ? ' data-sptn="' + sptn + '"' : '') + '>' + isi + '</a>';
    };
    var s = a('#/', 'Ikhtisar', 'ikhtisar');
    var sptnLalu = '';
    S.resor.forEach(function (r) {
      if (r.sptn !== sptnLalu) { s += '<span class="tab-pisah" aria-hidden="true"></span>'; sptnLalu = r.sptn; }
      s += a('#/' + r.id, '<span class="no">' + r.kode + '</span>' + esc(r.nama) + (r.baru ? ' <span class="baru">Baru</span>' : ''), r.id, r.sptn);
    });
    s += '<span class="tab-pisah" aria-hidden="true"></span>' + a('#/metode', 'Metode', 'metode');
    $('#tab').innerHTML = s;
    var el = $('#tab [aria-current="page"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function rute() {
    var id = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/')[0];
    var hasil, aktif;
    hapusPeta();
    S._bakar = false;
    if (S.byId[id]) { hasil = halamanResor(S.byId[id]); aktif = id; document.title = 'Resor ' + S.byId[id].nama + ' · Resor Pengelolaan TN Gunung Tambora'; }
    else if (id === 'metode') { hasil = halamanMetode(); aktif = 'metode'; document.title = 'Metode · Resor Pengelolaan TN Gunung Tambora'; }
    else { hasil = halamanIkhtisar(); aktif = 'ikhtisar'; document.title = 'Resor Pengelolaan · TN Gunung Tambora'; }
    isiTab(aktif);
    var isi = $('#isi');
    isi.innerHTML = hasil.html;
    window.scrollTo(0, 0);
    hasil.setelah();
  }

  /* ---------- tooltip ---------- */
  function pasangTip() {
    var tip = $('#tip'), aktif = null;
    document.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) { if (aktif) { tip.hidden = true; aktif = null; } return; }
      if (t !== aktif) { tip.innerHTML = t.getAttribute('data-tip'); tip.hidden = false; aktif = t; }
      var x = e.clientX + 14, y = e.clientY + 16, w = tip.offsetWidth, h = tip.offsetHeight;
      if (x + w > innerWidth - 8) x = e.clientX - w - 12;
      if (y + h > innerHeight - 8) y = e.clientY - h - 12;
      tip.style.left = Math.max(8, x) + 'px';
      tip.style.top = Math.max(8, y) + 'px';
    });
    document.addEventListener('pointerleave', function () { tip.hidden = true; aktif = null; });
    document.addEventListener('scroll', function () { tip.hidden = true; aktif = null; }, { passive: true });
  }

  /* ---------- mulai ---------- */
  function mulai() {
    pasangKontur();
    pasangTip();
    document.addEventListener('error', function (e) {
      var img = e.target;
      if (img && img.tagName === 'IMG' && img.dataset.penuh && img.src.indexOf(img.dataset.penuh) < 0) img.src = img.dataset.penuh;
    }, true);
    $('#tombolCetak').addEventListener('click', function () { window.print(); });
    Promise.all([
      ambil(DATA + 'kajian_2026.json'), ambil(DATA + 'analisis.json'),
      ambil(DATA + 'foto.json').catch(function () { return { tn: [], resor: {} }; }),
      ambil(DATA + 'batas_resor_2026.geojson')
    ]).then(function (d) {
      S.kajian = d[0]; S.analisis = d[1]; S.foto = d[2]; S.batas = d[3];
      S.resor = S.kajian.resor.map(function (k) {
        var r = Object.assign({}, k);
        r.a = S.analisis.resor.filter(function (x) { return x.id === k.id; })[0];
        r.personelTotal = (k.personel || []).reduce(function (s, p) { return s + p.n; }, 0);
        return r;
      }).filter(function (r) { return r.a; });
      S.resor.forEach(function (r) { S.byId[r.id] = r; });
      var A = S.analisis;
      $('#kepalaData').innerHTML = 'Data SMART s.d. ' + tgl(A.periode.akhir) + '<br>diolah ' + tgl(A.diperbarui);
      $('#kakiData').textContent = 'Analisis dihitung ulang otomatis setiap hari pukul 07.40 WITA; hasilnya terakhir berubah pada ' + tgl(A.diperbarui, true) + ' pukul ' + (A.diperbarui || '').slice(11, 16) + ' WITA.';
      window.addEventListener('hashchange', rute);
      rute();
    }).catch(function (e) {
      console.error(e);
      $('#isi').innerHTML = '<div class="galat"><h2>Profil resor belum bisa dimuat</h2><p>Periksa sambungan internet lalu muat ulang halaman. Bila masih gagal, data analisis mungkin sedang diperbarui.</p></div>';
    });
  }
  mulai();
})();
