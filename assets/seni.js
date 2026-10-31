/* Ikon dan gambar latar buatan (SVG) untuk tema atau kartu yang belum punya foto.
   Gambar dibuat dari "benih" teks, jadi kartu yang sama selalu mendapat gambar yang sama. */
(function () {
  'use strict';

  // Ikon garis 24×24, warna mengikuti currentColor.
  var IKON = {
    beranda: '<path d="M3 19.5h18"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/><path d="M12 7V4.5M6.7 9.7 5 8M17.3 9.7 19 8"/>',
    gunung: '<path d="m2.5 19.5 6.5-12 4 6.5 2.5-3.5 6 9z"/>',
    patroli: '<circle cx="6.5" cy="15.5" r="3.5"/><circle cx="17.5" cy="15.5" r="3.5"/><path d="M10 15.5h4M3.5 13 6 5h3.5l.5 7.5M20.5 13 18 5h-3.5l-.5 7.5"/>',
    resor: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/>',
    pohon: '<path d="M12 3.5 6.8 10.6h2.8L5.8 16.6h12.4l-3.8-6h2.8z"/><path d="M12 16.6v3.9"/>',
    api: '<path d="M12 3c.6 3 4.9 5.2 4.9 10.1a4.9 4.9 0 0 1-9.8 0c0-2.2 1.1-3.8 2.3-4.9.2 1.6.9 2.7 2 3.3-.3-3.2.1-6.2.6-8.5z"/>',
    perisai: '<path d="M12 3 4.5 6v5.6c0 4.4 3.2 7.9 7.5 9.4 4.3-1.5 7.5-5 7.5-9.4V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    wisata: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7 10 4.5h4L15.5 7"/><circle cx="12" cy="13.5" r="3.5"/>',
    aset: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    pustaka: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    aplikasi: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18"/><path d="M6.5 6.5h.01M9 6.5h.01"/>',
    peta: '<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
    grafik: '<path d="M3.5 20h17"/><path d="M6.5 20v-7M12 20V5M17.5 20v-10"/>',
    presentasi: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/><path d="m10.5 8 4 2-4 2z"/>',
    data: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M3 14.5h18M9 9.5V20"/>',
    dokumen: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    folder: '<path d="M3 6.5a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    tautan: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    cari: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    main: '<path d="M7.5 4.8v14.4L19.5 12z" fill="currentColor" stroke="none"/>',
    luar: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18.5 14v4.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5H10"/>',
    lainnya: '<circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
    kembali: '<path d="M19.5 12h-15M10.5 6l-6 6 6 6"/>',
    tutup: '<path d="M6 6l12 12M18 6 6 18"/>',
    salin: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
    kiri: '<path d="m14.5 6-6 6 6 6"/>',
    kanan: '<path d="m9.5 6 6 6-6 6"/>',
    github: '<path fill="currentColor" stroke="none" d="M12 .8a11.2 11.2 0 0 0-3.5 21.8c.6.1.8-.2.8-.5v-2c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.6 1.2 3.3.9.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.2-5.1-5.5 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-3 0 0 .9-.3 3.1 1.2a10.7 10.7 0 0 1 5.6 0c2.1-1.5 3.1-1.2 3.1-1.2.6 1.6.2 2.7.1 3 .7.8 1.1 1.8 1.1 3 0 4.3-2.6 5.2-5.1 5.5.4.3.8 1 .8 2.1v3.1c0 .3.2.7.8.5A11.2 11.2 0 0 0 12 .8z"/>'
  };

  function ikon(nama, kelas) {
    return '<svg class="' + (kelas || 'ikon') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (IKON[nama] || IKON.tautan) + '</svg>';
  }

  /* ---------- angka acak berbenih ---------- */
  function benihDari(teks) {
    var h = 2166136261;
    teks = String(teks || '');
    for (var i = 0; i < teks.length; i++) { h ^= teks.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function acak(benih) {
    var a = benih >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- warna ---------- */
  function keRgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    var n = parseInt(m ? m[1] : '8ab4ff', 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function keHex(rgb) {
    return '#' + rgb.map(function (x) { return ('0' + Math.round(Math.max(0, Math.min(255, x))).toString(16)).slice(-2); }).join('');
  }
  function campur(a, b, t) {
    var x = keRgb(a), y = keRgb(b);
    return keHex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; }));
  }

  var f = function (x) { return Math.round(x * 10) / 10; };

  // Kurva halus tertutup melalui titik-titik (Catmull-Rom ke Bézier).
  function kurvaTertutup(p) {
    var n = p.length, s = 'M' + f(p[0][0]) + ' ' + f(p[0][1]);
    for (var i = 0; i < n; i++) {
      var p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      s += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return s + 'Z';
  }

  // Garis kontur seperti peta topografi.
  function kontur(r, cx, cy, jumlah, rMin, rMaks, titik) {
    var fase = [r() * 6.28, r() * 6.28, r() * 6.28];
    var amp = [0.1 + r() * 0.08, 0.05 + r() * 0.05, 0.025 + r() * 0.03];
    var hasil = [];
    for (var i = 0; i < jumlah; i++) {
      var R = rMin + (rMaks - rMin) * i / Math.max(1, jumlah - 1), p = [];
      for (var k = 0; k < titik; k++) {
        var t = k / titik * Math.PI * 2;
        var d = 1 + amp[0] * Math.sin(2 * t + fase[0] + i * 0.18) + amp[1] * Math.sin(3 * t + fase[1] - i * 0.12) + amp[2] * Math.sin(5 * t + fase[2]);
        p.push([cx + Math.cos(t) * R * d * 1.45, cy + Math.sin(t) * R * d * 0.82]);
      }
      hasil.push(kurvaTertutup(p));
    }
    return hasil;
  }

  function bintangSvg(r, w, batasY, jumlah, warna) {
    var s = '';
    for (var i = 0; i < jumlah; i++) {
      var x = r() * w, y = Math.pow(r(), 1.4) * batasY, rad = 0.5 + Math.pow(r(), 3) * 1.6;
      s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(rad) + '" fill="' + warna + '" opacity="' + f(0.25 + r() * 0.65) + '"/>';
    }
    return s;
  }

  function keDataUrl(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

  // Kurva halus terbuka melalui titik-titik.
  function kurvaTerbuka(p) {
    var s = 'M' + f(p[0][0]) + ' ' + f(p[0][1]);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
      s += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return s;
  }

  // Profil Tambora: lereng landai yang makin curam, puncak terpancung dengan kaldera.
  var PROFIL = [[0, 1], [0.1, 0.93], [0.2, 0.82], [0.28, 0.68], [0.34, 0.53], [0.38, 0.41], [0.41, 0.335],
    [0.45, 0.352], [0.5, 0.362], [0.555, 0.356], [0.6, 0.33], [0.64, 0.385], [0.69, 0.5], [0.76, 0.645],
    [0.85, 0.79], [0.93, 0.91], [1, 1]];
  function siluet(w, h, cx, lebar, puncak, dasar) {
    var titik = PROFIL.map(function (p) { return [cx + (p[0] - 0.5) * lebar, puncak + p[1] * (dasar - puncak)]; });
    return kurvaTerbuka([[-10, dasar]].concat(titik, [[w + 10, dasar]])) + 'L' + (w + 10) + ' ' + h + 'L-10 ' + h + 'Z';
  }
  // Punggungan jauh yang bergelombang pelan.
  function punggungan(r, w, h, y, amp) {
    var titik = [], n = 9, fase = r() * 6.28;
    for (var i = 0; i <= n; i++) titik.push([w * i / n, y + Math.sin(i * 1.3 + fase) * amp + (r() - 0.5) * amp]);
    return kurvaTerbuka(titik) + 'L' + w + ' ' + h + 'L0 ' + h + 'Z';
  }

  /* ---------- motif kartu: gambaran sederhana dari jenis isi ---------- */
  function persegi(x, y, w, h, r, atribut) {
    return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" rx="' + r + '" ' + atribut + '/>';
  }
  var MOTIF = {
    grafik: function (r, c) {
      var n = 9 + Math.floor(r() * 4), x0 = 250, x1 = 600, dasar = 304, lebar = (x1 - x0) / n * 0.56, titik = [];
      var s = '<path d="M' + (x0 - 18) + ' ' + dasar + 'H' + (x1 + 10) + '" stroke="' + c.terang + '" stroke-opacity=".4" stroke-width="2"/>';
      var tinggi = 60 + r() * 60;
      for (var i = 0; i < n; i++) {
        tinggi = Math.max(36, Math.min(200, tinggi + (r() - 0.42) * 70));
        var x = x0 + i * (x1 - x0) / n;
        s += '<path d="M' + f(x) + ' ' + dasar + 'V' + f(dasar - tinggi + 5) + 'Q' + f(x) + ' ' + f(dasar - tinggi) + ' ' + f(x + 5) + ' ' + f(dasar - tinggi) +
          'H' + f(x + lebar - 5) + 'Q' + f(x + lebar) + ' ' + f(dasar - tinggi) + ' ' + f(x + lebar) + ' ' + f(dasar - tinggi + 5) + 'V' + dasar + 'Z" fill="' + c.terang + '" fill-opacity="' + f(0.16 + r() * 0.2) + '"/>';
        titik.push([x + lebar / 2, dasar - tinggi - 22 - r() * 16]);
      }
      var akhir = titik[titik.length - 1];
      return s + '<path d="' + kurvaTerbuka(titik) + '" fill="none" stroke="' + c.lembut + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="' + f(akhir[0]) + '" cy="' + f(akhir[1]) + '" r="7" fill="' + c.lembut + '" stroke="' + c.gelap + '" stroke-width="3"/>';
    },
    peta: function (r, c) {
      var s = '', cx = 400 + r() * 120, cy = 150 + r() * 90;
      kontur(r, cx, cy, 7, 18, 150, 22).forEach(function (d, i) {
        s += '<path d="' + d + '" fill="none" stroke="' + c.terang + '" stroke-width="1.6" opacity="' + f(0.55 - i * 0.05) + '"/>';
      });
      var rute = [], x = 200 + r() * 40, y = 300;
      for (var i = 0; i < 5; i++) { rute.push([x, y]); x += 70 + r() * 30; y -= 20 + r() * 45; }
      s += '<path d="' + kurvaTerbuka(rute) + '" fill="none" stroke="' + c.lembut + '" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>';
      [rute[1], rute[3]].forEach(function (p) { s += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="6" fill="' + c.lembut + '" stroke="' + c.gelap + '" stroke-width="3"/>'; });
      var pin = rute[4];
      return s + '<path transform="translate(' + f(pin[0] - 14) + ' ' + f(pin[1] - 38) + ')" d="M14 0a14 14 0 0 1 14 14c0 10-14 24-14 24S0 24 0 14A14 14 0 0 1 14 0z" fill="' + c.lembut + '"/>' +
        '<circle cx="' + f(pin[0]) + '" cy="' + f(pin[1] - 24) + '" r="5" fill="' + c.gelap + '"/>';
    },
    data: function (r, c) {
      var x = 236, y = 62, w = 370, h = 248, baris = 6, kolom = [0.34, 0.33, 0.33];
      var s = persegi(x, y, w, h, 14, 'fill="' + c.terang + '" fill-opacity=".06" stroke="' + c.terang + '" stroke-opacity=".45" stroke-width="2"');
      s += '<path d="M' + x + ' ' + (y + 44) + 'H' + (x + w) + '" stroke="' + c.terang + '" stroke-opacity=".45" stroke-width="2"/>';
      var cx = x;
      kolom.forEach(function (k, j) {
        var lebar = w * k;
        if (j) s += '<path d="M' + f(cx) + ' ' + y + 'V' + (y + h) + '" stroke="' + c.terang + '" stroke-opacity=".22" stroke-width="1.5"/>';
        s += persegi(cx + 16, y + 17, lebar * (0.4 + r() * 0.3), 10, 5, 'fill="' + c.lembut + '" fill-opacity=".85"');
        for (var i = 0; i < baris - 1; i++) {
          s += persegi(cx + 16, y + 62 + i * 38, Math.max(14, (lebar - 32) * (0.25 + r() * 0.7)), 8, 4, 'fill="' + c.terang + '" fill-opacity="' + f(0.3 + r() * 0.25) + '"');
        }
        cx += lebar;
      });
      for (var i = 1; i < baris - 1; i++) s += '<path d="M' + x + ' ' + (y + 44 + i * 38) + 'H' + (x + w) + '" stroke="' + c.terang + '" stroke-opacity=".14" stroke-width="1.5"/>';
      return s;
    },
    presentasi: function (r, c) {
      var s = '';
      [[300, 60, 0.12], [272, 86, 0.2]].forEach(function (p) {
        s += persegi(p[0], p[1], 300, 176, 14, 'fill="' + c.terang + '" fill-opacity="' + p[2] + '" stroke="' + c.terang + '" stroke-opacity=".35" stroke-width="2"');
      });
      var x = 244, y = 112, w = 300, h = 176;
      s += persegi(x, y, w, h, 14, 'fill="' + c.gelap + '" stroke="' + c.lembut + '" stroke-opacity=".8" stroke-width="2"');
      s += persegi(x + 22, y + 22, 150, 12, 6, 'fill="' + c.lembut + '"') + persegi(x + 22, y + 44, 100, 8, 4, 'fill="' + c.terang + '" fill-opacity=".5"');
      var gx = x + 22, gy = y + h - 22;
      s += '<path d="M' + gx + ' ' + gy + 'L' + (gx + 60) + ' ' + (gy - 50) + 'L' + (gx + 100) + ' ' + (gy - 22) + 'L' + (gx + 150) + ' ' + (gy - 74) + 'L' + (gx + 256) + ' ' + gy + 'Z" fill="' + c.terang + '" fill-opacity=".3"/>';
      return s + '<circle cx="' + (x + w - 52) + '" cy="' + (y + 56) + '" r="24" fill="' + c.lembut + '"/>' +
        '<path d="M' + (x + w - 59) + ' ' + (y + 44) + 'v24l20-12z" fill="' + c.gelap + '"/>';
    },
    aplikasi: function (r, c) {
      var x = 222, y = 56, w = 390, h = 262;
      var s = persegi(x, y, w, h, 16, 'fill="' + c.gelap + '" fill-opacity=".7" stroke="' + c.terang + '" stroke-opacity=".5" stroke-width="2"');
      s += '<path d="M' + x + ' ' + (y + 34) + 'H' + (x + w) + '" stroke="' + c.terang + '" stroke-opacity=".35" stroke-width="2"/>';
      [0, 1, 2].forEach(function (i) { s += '<circle cx="' + (x + 20 + i * 16) + '" cy="' + (y + 17) + '" r="4.5" fill="' + c.terang + '" fill-opacity=".6"/>'; });
      s += persegi(x + 16, y + 50, 74, h - 66, 10, 'fill="' + c.terang + '" fill-opacity=".1"');
      for (var i = 0; i < 5; i++) s += persegi(x + 28, y + 66 + i * 26, 30 + r() * 22, 8, 4, 'fill="' + c.terang + '" fill-opacity="' + (i === 1 ? '.85' : '.35') + '"');
      var kx = x + 104, kw = (w - 120 - 24) / 3;
      for (var j = 0; j < 3; j++) {
        s += persegi(kx + j * (kw + 12), y + 50, kw, 62, 10, 'fill="' + c.terang + '" fill-opacity=".12"');
        s += persegi(kx + j * (kw + 12) + 12, y + 64, kw * 0.45, 7, 3.5, 'fill="' + c.terang + '" fill-opacity=".45"');
        s += persegi(kx + j * (kw + 12) + 12, y + 82, kw * (0.4 + r() * 0.35), 16, 5, 'fill="' + c.lembut + '"');
      }
      var gx = kx, gy = y + h - 20, gw = w - 120, titik = [];
      for (var k = 0; k <= 8; k++) titik.push([gx + gw * k / 8, gy - 20 - r() * 90]);
      return s + '<path d="' + kurvaTerbuka(titik) + 'L' + (gx + gw) + ' ' + gy + 'L' + gx + ' ' + gy + 'Z" fill="' + c.terang + '" fill-opacity=".12"/>' +
        '<path d="' + kurvaTerbuka(titik) + '" fill="none" stroke="' + c.lembut + '" stroke-width="3" stroke-linecap="round"/>';
    },
    dokumen: function (r, c) {
      var s = '';
      [[330, 70, 0.14, -6], [270, 86, 1, 0]].forEach(function (p, i) {
        var x = p[0], y = p[1], w = 210, h = 250, lipat = 44;
        var badan = 'M' + x + ' ' + (y + 12) + 'Q' + x + ' ' + y + ' ' + (x + 12) + ' ' + y + 'H' + (x + w - lipat) + 'L' + (x + w) + ' ' + (y + lipat) + 'V' + (y + h - 12) +
          'Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - 12) + ' ' + (y + h) + 'H' + (x + 12) + 'Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - 12) + 'Z';
        s += '<path transform="rotate(' + p[3] + ' ' + (x + w / 2) + ' ' + (y + h / 2) + ')" d="' + badan + '" fill="' + (i ? c.gelap : c.terang) + '" fill-opacity="' + (i ? '1' : '.14') + '" stroke="' + c.terang + '" stroke-opacity="' + (i ? '.75' : '.3') + '" stroke-width="2"/>';
        if (i) {
          s += '<path d="M' + (x + w - lipat) + ' ' + y + 'V' + (y + lipat) + 'H' + (x + w) + '" fill="none" stroke="' + c.terang + '" stroke-opacity=".75" stroke-width="2"/>';
          s += persegi(x + 24, y + 30, 100, 11, 5.5, 'fill="' + c.lembut + '"');
          for (var k = 0; k < 7; k++) s += persegi(x + 24, y + 66 + k * 24, (w - 48) * (k === 6 ? 0.5 : 0.7 + r() * 0.3), 7, 3.5, 'fill="' + c.terang + '" fill-opacity=".4"');
        }
      });
      return s;
    },
    folder: function (r, c) {
      var x = 236, y = 92, w = 360, h = 220;
      var s = persegi(x + 40, y - 34, 200, 150, 10, 'fill="' + c.terang + '" fill-opacity=".14" stroke="' + c.terang + '" stroke-opacity=".35" stroke-width="2"');
      s += persegi(x + 70, y - 18, 200, 150, 10, 'fill="' + c.terang + '" fill-opacity=".22" stroke="' + c.terang + '" stroke-opacity=".45" stroke-width="2"');
      s += '<path d="M' + x + ' ' + (y + 14) + 'Q' + x + ' ' + y + ' ' + (x + 14) + ' ' + y + 'H' + (x + 110) + 'L' + (x + 134) + ' ' + (y + 26) + 'H' + (x + w - 14) +
        'Q' + (x + w) + ' ' + (y + 26) + ' ' + (x + w) + ' ' + (y + 40) + 'V' + (y + h - 14) + 'Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - 14) + ' ' + (y + h) +
        'H' + (x + 14) + 'Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - 14) + 'Z" fill="' + c.gelap + '" stroke="' + c.lembut + '" stroke-opacity=".8" stroke-width="2"/>';
      return s + persegi(x + 26, y + h - 54, 120, 10, 5, 'fill="' + c.lembut + '"') + persegi(x + 26, y + h - 32, 80, 7, 3.5, 'fill="' + c.terang + '" fill-opacity=".45"');
    },
    tautan: function (r, c) {
      return '<g fill="none" stroke="' + c.lembut + '" stroke-width="16" stroke-linecap="round" transform="translate(300 60) scale(11)" opacity=".85">' +
        '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" stroke-width="1.5"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" stroke-width="1.5"/></g>';
    }
  };

  function keHsl(hex) {
    var c = keRgb(hex).map(function (x) { return x / 255; });
    var maks = Math.max.apply(null, c), min = Math.min.apply(null, c), l = (maks + min) / 2, h = 0, s = 0, d = maks - min;
    if (d) {
      s = l > 0.5 ? d / (2 - maks - min) : d / (maks + min);
      h = maks === c[0] ? (c[1] - c[2]) / d + (c[1] < c[2] ? 6 : 0) : maks === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function dariHsl(h, s, l) {
    h = ((h % 360) + 360) % 360;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var fn = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return keHex([fn(0) * 255, fn(8) * 255, fn(4) * 255]);
  }
  function geserRona(hex, derajat) { var x = keHsl(hex); return dariHsl(x[0] + derajat, x[1], x[2]); }

  /**
   * Gambar latar buatan.
   * opsi.warna : warna aksen (#rrggbb)
   * opsi.benih : teks pembeda (misalnya id kartu)
   * opsi.motif : jenis isi untuk gambar kartu (aplikasi, peta, grafik, presentasi, data, dokumen, folder, tautan)
   * opsi.gaya  : 'tema' (1600×900, langit dan siluet Tambora) atau 'kartu' (640×360, dengan motif)
   */
  function latar(opsi) {
    opsi = opsi || {};
    var kartu = opsi.gaya === 'kartu';
    var w = kartu ? 640 : 1600, h = kartu ? 360 : 900;
    var r = acak(benihDari((opsi.benih || '') + '|' + (opsi.warna || '')));
    var a = kartu ? geserRona(opsi.warna || '#8ab4ff', (r() - 0.5) * 34) : (opsi.warna || '#8ab4ff');
    var c = {
      gelap: campur(a, '#05070d', 0.84),
      terang: campur(a, '#ffffff', 0.18),
      lembut: campur(a, '#ffffff', 0.5)
    };
    var s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice">',
      '<defs><linearGradient id="l" x1="0" y1="0" x2="' + f(0.3 + r() * 0.7) + '" y2="1">' +
      '<stop offset="0" stop-color="' + campur(a, '#03050a', 0.9) + '"/><stop offset="1" stop-color="' + campur(a, '#0b1222', 0.62) + '"/></linearGradient>' +
      '<radialGradient id="c" cx="' + f(0.5 + r() * 0.4) + '" cy="' + f(0.15 + r() * 0.35) + '" r="0.65"><stop offset="0" stop-color="' + c.terang + '" stop-opacity=".42"/>' +
      '<stop offset="1" stop-color="' + c.terang + '" stop-opacity="0"/></radialGradient></defs>',
      '<rect width="' + w + '" height="' + h + '" fill="url(#l)"/><rect width="' + w + '" height="' + h + '" fill="url(#c)"/>'];

    if (kartu) {
      kontur(r, w * (0.15 + r() * 0.3), h * (0.6 + r() * 0.3), 6, 30, 260, 20).forEach(function (d, i) {
        s.push('<path d="' + d + '" fill="none" stroke="' + c.terang + '" stroke-width="1.2" opacity="' + f(0.05 + i * 0.012) + '"/>');
      });
      s.push((MOTIF[opsi.motif] || MOTIF.tautan)(r, c));
    } else {
      s.push(bintangSvg(r, w, h * 0.55, 90, '#ffffff'));
      kontur(r, w * (0.55 + r() * 0.3), h * (0.3 + r() * 0.15), 8, h * 0.06, h * 0.5, 26).forEach(function (d, i) {
        s.push('<path d="' + d + '" fill="none" stroke="' + c.terang + '" stroke-width="1.4" opacity="' + f(0.05 + i * 0.016) + '"/>');
      });
      s.push('<path d="' + punggungan(r, w, h, h * 0.74, h * 0.025) + '" fill="' + campur(a, '#02040a', 0.62) + '" opacity=".8"/>');
      s.push('<path d="' + siluet(w, h, w * (0.58 + r() * 0.12), w * 1.15, h * 0.42, h * 0.98) + '" fill="' + campur(a, '#02040a', 0.8) + '"/>');
      s.push('<path d="' + punggungan(r, w, h, h * 0.93, h * 0.02) + '" fill="' + campur(a, '#02040a', 0.92) + '"/>');
    }
    s.push('</svg>');
    return keDataUrl(s.join(''));
  }

  // Langit malam berbintang untuk latar beranda.
  function langit(benih) {
    var r = acak(benihDari(benih || 'langit')), w = 1600, h = 900;
    return keDataUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice">' +
      bintangSvg(r, w, h * 0.72, 170, '#ffffff') + '</svg>');
  }

  window.SENI = { ikon: ikon, latar: latar, langit: langit, campur: campur, IKON: IKON };
})();
