/* Satu Data Tambora: memuat isi dari Google Sheets (cadangan: data/isi/*.csv), lalu menyusun halaman.
   Isi dashboard diubah di spreadsheet, bukan di file ini. */
(function () {
  "use strict";

  var TAB = ["Pengaturan", "Halaman", "Isi", "Aplikasi"];
  var KOLOM_WAJIB = { Pengaturan: ["kunci", "nilai"], Halaman: ["menu", "halaman", "judul"], Isi: ["menu", "halaman", "jenis"], Aplikasi: ["id", "nama", "url"] };
  var BATAS_WAKTU = 8000;

  var $isi = document.getElementById("isi");
  var $nav = document.getElementById("nav");
  var $cari = document.getElementById("cari");
  var SITUS = {}, MENU = [], ISI = {}, APLIKASI = [], ASAL = "";

  /* ---------- Ikon ---------- */
  var IKON = {
    beranda: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    gunung: '<path d="M2 20l7-12 4 6 3-4 6 10z"/><path d="M8 10l1.5 1.5L11 10"/>',
    patroli: '<circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="3"/>',
    resor: '<path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-6h6v6"/>',
    api: '<path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5 1-1 1-3 0-9z"/>',
    laporan: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    perisai: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    evaluasi: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    katalog: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    luar: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    github: '<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M4 9h16M4 15h16M10 3v18"/>',
    slides: '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M12 17v4M8 21h8"/>',
    drive: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    pdf: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 15h6"/>',
    peta: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    panah: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  function ikon(nama, ukuran) {
    var s = ukuran || 20;
    return '<svg class="ikon" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (IKON[nama] || IKON.web) + "</svg>";
  }

  /* ---------- Utilitas ---------- */
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function teksHtml(t) { return esc(t).replace(/\r?\n/g, "<br>"); }
  function bersih(v) { return String(v == null ? "" : v).trim(); }
  function aman(url) { url = bersih(url); return /^(https?:\/\/|#)/i.test(url) ? url : ""; }
  function tampil(r) { return bersih(r.tampil).toLowerCase() !== "tidak"; }

  // CSV RFC 4180 (tanda kutip, koma, dan baris baru di dalam sel)
  function bacaCsv(teks) {
    var baris = [], sel = "", row = [], kutip = false, i, c;
    teks = teks.replace(/^﻿/, "");
    for (i = 0; i < teks.length; i++) {
      c = teks[i];
      if (kutip) {
        if (c === '"') { if (teks[i + 1] === '"') { sel += '"'; i++; } else kutip = false; }
        else sel += c;
      } else if (c === '"') kutip = true;
      else if (c === ",") { row.push(sel); sel = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && teks[i + 1] === "\n") i++;
        row.push(sel); baris.push(row); row = []; sel = "";
      } else sel += c;
    }
    if (sel !== "" || row.length) { row.push(sel); baris.push(row); }
    if (!baris.length) return [];
    var kepala = baris[0].map(function (h) { return bersih(h).toLowerCase(); });
    return baris.slice(1).filter(function (r) { return r.some(function (v) { return bersih(v) !== ""; }); }).map(function (r) {
      var o = {};
      kepala.forEach(function (h, j) { if (h) o[h] = bersih(r[j]); });
      return o;
    });
  }

  function idSheet(link) {
    var m = bersih(link).match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    return /^[a-zA-Z0-9_-]{20,}$/.test(bersih(link)) ? bersih(link) : "";
  }
  function idDrive(url) {
    var m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)([a-zA-Z0-9_-]{10,})/);
    return m ? m[1] : "";
  }
  // Link file Google Drive -> gambar yang bisa ditampilkan
  function srcGambar(url) {
    url = aman(url);
    var id = idDrive(url);
    return id ? "https://drive.google.com/thumbnail?id=" + id + "&sz=w2000" : url;
  }
  // Link Slides/Drive -> versi yang bisa disematkan
  function srcSematan(url) {
    url = aman(url);
    var m = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return "https://docs.google.com/presentation/d/" + m[1] + "/embed?start=false&loop=false&delayms=5000";
    var id = idDrive(url);
    if (id && !/drive\.google\.com\/drive\/folders/.test(url)) return "https://drive.google.com/file/d/" + id + "/preview";
    return url;
  }
  function tipeTautan(url) {
    if (/docs\.google\.com\/spreadsheets/.test(url)) return "sheet";
    if (/docs\.google\.com\/presentation/.test(url)) return "slides";
    if (/\.pdf($|\?)/i.test(url)) return "pdf";
    if (/drive\.google\.com/.test(url)) return "drive";
    if (/google\.com\/maps/.test(url)) return "peta";
    return "web";
  }
  var LABEL_TIPE = { sheet: "Google Sheets", slides: "Google Slides", drive: "Google Drive", pdf: "PDF", peta: "Peta", web: "Situs web" };

  /* ---------- Memuat isi ---------- */
  function ambil(url) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, BATAS_WAKTU);
    return fetch(url, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined }).then(function (res) {
      clearTimeout(t);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    });
  }
  function muatDari(fnUrl) {
    return Promise.all(TAB.map(function (tab) {
      return ambil(fnUrl(tab)).then(function (txt) {
        var rows = bacaCsv(txt);
        var kolom = rows.length ? Object.keys(rows[0]) : [];
        var kurang = KOLOM_WAJIB[tab].filter(function (k) { return kolom.indexOf(k) < 0; });
        if (!rows.length || kurang.length) throw new Error("Tab " + tab + " tidak terbaca");
        return rows;
      });
    }));
  }
  function muat() {
    var id = idSheet((window.SUMBER || {}).GOOGLE_SHEETS);
    var cadangan = function () {
      return muatDari(function (tab) { return "data/isi/" + tab + ".csv"; }).then(function (d) { ASAL = id ? "cadangan-gagal" : "cadangan"; return d; });
    };
    if (!id) return cadangan();
    return muatDari(function (tab) {
      return "https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv&headers=1&sheet=" + encodeURIComponent(tab);
    }).then(function (d) { ASAL = "sheets"; return d; }).catch(function (e) {
      if (window.console) console.warn("Google Sheets tidak bisa dibaca, memakai cadangan:", e);
      return cadangan();
    });
  }

  function susun(data) {
    data[0].forEach(function (r) { if (r.kunci) SITUS[r.kunci.toLowerCase()] = r.nilai; });
    var peta = {};
    data[1].filter(tampil).forEach(function (r) {
      var mid = r.menu; if (!mid) return;
      if (!r.halaman) {
        if (!peta[mid]) { peta[mid] = { id: mid, halaman: [] }; MENU.push(peta[mid]); }
        peta[mid].judul = r.judul; peta[mid].ikon = r.ikon; peta[mid].ringkas = r.ringkas;
      } else {
        if (!peta[mid]) { peta[mid] = { id: mid, judul: mid, halaman: [] }; MENU.push(peta[mid]); }
        peta[mid].halaman.push({ id: r.halaman, judul: r.judul || r.halaman, induk: r.induk || "" });
      }
    });
    data[2].filter(tampil).forEach(function (r) {
      var k = r.menu + "/" + (r.halaman || "");
      (ISI[k] = ISI[k] || []).push(r);
    });
    APLIKASI = data[3].filter(tampil).map(function (r) {
      return {
        id: r.id, nama: r.nama, ringkas: r.ringkas, kelompok: r.kelompok, repo: r.repo, url: aman(r.url),
        status: r.status || "aktif", pengguna: r.pengguna,
        fitur: (r.fitur || "").split(";").map(bersih).filter(Boolean),
        halaman: (r.halaman_aplikasi || "").split(";").map(function (s) {
          var p = s.split("="); return p.length > 1 ? { label: bersih(p[0]), path: bersih(p.slice(1).join("=")) } : null;
        }).filter(Boolean)
      };
    });
  }

  /* ---------- Pencarian data ---------- */
  function cariMenu(id) { return MENU.filter(function (m) { return m.id === id; })[0]; }
  function cariHal(m, id) { return m.halaman.filter(function (p) { return p.id === id; })[0]; }
  function cariApp(id) { return APLIKASI.filter(function (a) { return a.id === id; })[0]; }
  function appDiMenu(id) { return APLIKASI.filter(function (a) { return a.kelompok === id; }); }
  function urlRepo(a) { return "https://github.com/" + (bersih(SITUS.github).split("/")[0] || "kopluck8") + "/" + a.repo; }
  function hrefInternal(url, menuId) {
    url = bersih(url);
    if (!url) return "";
    if (/^(https?:\/\/|#)/i.test(url)) return url;
    return "#/" + (url.indexOf("/") >= 0 ? url : menuId + "/" + url);
  }
  function luar(href) { return /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : ""; }

  /* ---------- Navigasi samping ---------- */
  function navItem(href, label, ikonNama, aktif, kelas) {
    return '<a class="nav-link' + (aktif ? " aktif" : "") + (kelas ? " " + kelas : "") + '" href="' + href + '"' + (aktif ? ' aria-current="page"' : "") + ">" +
      (ikonNama ? ikon(ikonNama, 18) : "") + "<span>" + esc(label) + "</span></a>";
  }
  function gambarNav(rute) {
    var h = navItem("#/", "Beranda", "beranda", !rute.menu && !rute.khusus);
    MENU.forEach(function (m) {
      var buka = rute.menu === m.id;
      h += navItem("#/" + m.id, m.judul, m.ikon || "web", buka && !rute.halaman);
      if (buka) m.halaman.forEach(function (p) {
        h += navItem("#/" + m.id + "/" + p.id, p.judul, null, rute.halaman === p.id, p.induk ? "sub sub2" : "sub");
      });
    });
    h += '<div class="nav-sep"></div>' + navItem("#/katalog", "Katalog Aplikasi", "katalog", rute.khusus === "katalog");
    $nav.innerHTML = h;
  }

  /* ---------- Kartu ---------- */
  function lencana(status) {
    var s = (status || "aktif").toLowerCase();
    var kelas = s === "aktif" ? "baik" : s === "uji coba" ? "uji" : "kembang";
    return '<span class="lencana ' + kelas + '">' + esc(status || "aktif") + "</span>";
  }
  function kartuApp(a) {
    var m = cariMenu(a.kelompok);
    var halaman = a.halaman.map(function (p) {
      return '<a href="' + esc(aman(a.url + p.path)) + '" target="_blank" rel="noopener">' + esc(p.label) + "</a>";
    }).join("");
    return '<article class="kartu app">' +
      '<div class="kartu-atas">' + lencana(a.status) + (m ? '<span class="kelompok">' + esc(m.judul) + "</span>" : "") + "</div>" +
      "<h3>" + esc(a.nama) + "</h3>" +
      '<p class="redup">' + esc(a.ringkas) + "</p>" +
      (a.fitur.length ? '<ul class="fitur">' + a.fitur.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "") +
      (a.pengguna ? '<p class="pengguna"><strong>Pengguna:</strong> ' + esc(a.pengguna) + "</p>" : "") +
      (halaman ? '<div class="sublink">' + halaman + "</div>" : "") +
      '<div class="aksi">' +
        (a.url ? '<a class="tombol utama" href="' + esc(a.url) + '" target="_blank" rel="noopener">Buka aplikasi ' + ikon("luar", 16) + "</a>" : "") +
        (a.repo ? '<a class="tombol" href="' + esc(urlRepo(a)) + '" target="_blank" rel="noopener">' + ikon("github", 16) + " Repo</a>" : "") +
      "</div></article>";
  }
  function kartuMenu(m) {
    var jApp = appDiMenu(m.id).length;
    var info = [m.halaman.length ? m.halaman.length + " halaman" : null, jApp ? jApp + " aplikasi" : null].filter(Boolean).join(" · ");
    return '<a class="kartu menu" href="#/' + esc(m.id) + '">' +
      '<span class="ikon-bulat">' + ikon(m.ikon || "web", 24) + "</span>" +
      "<h3>" + esc(m.judul) + "</h3>" +
      (m.ringkas ? '<p class="redup">' + esc(m.ringkas) + "</p>" : "") +
      '<span class="info">' + esc(info || "Buka") + ikon("panah", 16) + "</span></a>";
  }

  /* ---------- Elemen isi ---------- */
  function elemen(r, menuId) {
    var url = aman(r.url);
    switch ((r.jenis || "").toLowerCase()) {
      case "subjudul":
        return "<h3>" + esc(r.judul || r.teks) + "</h3>";
      case "teks":
        return "<p>" + teksHtml(r.teks || r.judul) + "</p>";
      case "catatan":
        return '<div class="catatan">' + (r.judul ? "<strong>" + esc(r.judul) + "</strong> " : "") + teksHtml(r.teks) + "</div>";
      case "gambar":
        var src = srcGambar(r.gambar || r.url);
        if (!src) return "";
        var img = '<img loading="lazy" src="' + esc(src) + '" alt="' + esc(r.teks || r.judul || "") + '" onerror="this.closest(\'figure\').classList.add(\'gagal\')">';
        var link = r.gambar && url ? hrefInternal(r.url, menuId) : "";
        return '<figure class="gambar">' + (link ? '<a href="' + esc(link) + '"' + luar(link) + ">" + img + "</a>" : img) +
          (r.teks || r.judul ? "<figcaption>" + esc(r.teks || r.judul) + "</figcaption>" : "") +
          '<span class="gambar-gagal">Gambar tidak bisa dimuat. Periksa link di kolom gambar.</span></figure>';
      case "tautan":
        if (!url) return '<span class="tautan kosong">' + ikon("pdf", 22) + "<span>" + esc(r.judul) + "<small>Link belum diisi</small></span></span>";
        var tipe = tipeTautan(url);
        return '<a class="tautan" href="' + esc(url) + '" target="_blank" rel="noopener">' + ikon(tipe, 22) +
          "<span>" + esc(r.judul || url) + "<small>" + esc(r.teks || LABEL_TIPE[tipe]) + "</small></span>" + ikon("luar", 16) + "</a>";
      case "kartu":
        var href = hrefInternal(r.url, menuId);
        var gb = srcGambar(r.gambar);
        return '<a class="kartu-isi' + (gb ? " bergambar" : "") + '" href="' + esc(href || "#") + '"' + luar(href) + ">" +
          (gb ? '<img loading="lazy" src="' + esc(gb) + '" alt="">' : "") +
          "<span><strong>" + esc(r.judul) + "</strong>" + (r.teks ? "<small>" + esc(r.teks) + "</small>" : "") + "</span>" + ikon(luar(href) ? "luar" : "panah", 16) + "</a>";
      case "aplikasi":
        return (r.teks || "").split(",").map(bersih).map(cariApp).filter(Boolean).map(kartuApp).join("");
      case "sematan":
        var s = srcSematan(r.url);
        if (!s) return "";
        var t = parseInt(r.tinggi, 10) || 600;
        return '<div class="sematan">' +
          '<div class="sematan-kepala"><span>' + esc(r.judul) + "</span>" +
          '<a href="' + esc(url) + '" target="_blank" rel="noopener">Buka di tab baru ' + ikon("luar", 14) + "</a></div>" +
          '<iframe loading="lazy" src="' + esc(s) + '" title="' + esc(r.judul || "Sematan") + '" style="height:' + t + 'px" allow="fullscreen; geolocation" allowfullscreen></iframe></div>';
    }
    return "";
  }
  // Baris berurutan dengan jenis sama (gambar, tautan, kartu, aplikasi) dijadikan satu grid.
  var KELOMPOK = { gambar: "grid-gambar", tautan: "daftar-tautan", kartu: "grid-kartu", aplikasi: "grid app-grid" };
  function susunIsi(rows, menuId) {
    var bagian = [], cur = { judul: "", isi: [] }, grup = null;
    function tutupGrup() {
      if (grup) { cur.isi.push('<div class="' + KELOMPOK[grup.jenis] + (grup.jenis === "gambar" && grup.html.length === 1 ? " tunggal" : "") + '">' + grup.html.join("") + "</div>"); grup = null; }
    }
    function tutupBagian() { tutupGrup(); if (cur.judul || cur.isi.length) bagian.push(cur); }
    rows.forEach(function (r) {
      var j = (r.jenis || "").toLowerCase();
      if (j === "judul") { tutupBagian(); cur = { judul: r.judul || r.teks, isi: [] }; return; }
      var html = elemen(r, menuId);
      if (!html) return;
      if (KELOMPOK[j]) {
        if (!grup || grup.jenis !== j) { tutupGrup(); grup = { jenis: j, html: [] }; }
        grup.html.push(html);
      } else { tutupGrup(); cur.isi.push(html); }
    });
    tutupBagian();
    return bagian.map(function (b) {
      return '<section class="blok">' + (b.judul ? "<h2>" + esc(b.judul) + "</h2>" : "") + b.isi.join("") + "</section>";
    }).join("");
  }

  /* ---------- Halaman ---------- */
  function hBeranda() {
    var jHal = MENU.reduce(function (s, m) { return s + m.halaman.length; }, 0);
    return '<section class="hero">' +
      '<img src="assets/img/logo.png" alt="" width="150" height="77">' +
      '<p class="eyebrow">' + esc(SITUS.sambutan || "Selamat datang") + "</p>" +
      "<h1>" + esc(SITUS.judul || "Satu Data Tambora") + (SITUS.subjudul ? "<span>" + esc(SITUS.subjudul) + "</span>" : "") + "</h1>" +
      (SITUS.pengantar ? '<p class="hero-lead">' + esc(SITUS.pengantar) + "</p>" : "") +
      '<dl class="angka"><div><dt>Menu</dt><dd>' + MENU.length + "</dd></div><div><dt>Halaman</dt><dd>" + jHal + "</dd></div><div><dt>Aplikasi</dt><dd>" + APLIKASI.length + "</dd></div></dl>" +
      "</section>" +
      '<h2 class="judul-bagian">Menu</h2><div class="grid menu-grid">' + MENU.map(kartuMenu).join("") + "</div>" +
      (APLIKASI.length ? '<h2 class="judul-bagian">Akses cepat aplikasi</h2><div class="cepat">' + APLIKASI.map(function (a) {
        return '<a href="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(a.nama) + ikon("luar", 14) + "</a>";
      }).join("") + "</div>" : "");
  }

  function kosong() { return '<section class="blok"><div class="catatan">Belum ada isi untuk halaman ini. Tambahkan baris di tab <strong>Isi</strong> pada spreadsheet.</div></section>'; }

  function hMenu(m) {
    var rows = ISI[m.id + "/"] || [];
    var apps = appDiMenu(m.id);
    var punyaKartu = rows.some(function (r) { return (r.jenis || "").toLowerCase() === "kartu"; });
    var html = '<nav class="remah"><a href="#/">Beranda</a></nav>' +
      '<header class="kepala"><span class="ikon-bulat">' + ikon(m.ikon || "web", 26) + "</span><div><h1>" + esc(m.judul) + "</h1>" +
      (m.ringkas ? "<p>" + esc(m.ringkas) + "</p>" : "") + "</div></header>" +
      susunIsi(rows, m.id);
    if (!punyaKartu && m.halaman.length) {
      html += '<h2 class="judul-bagian">Halaman</h2><div class="grid hal-grid">' + m.halaman.map(function (p) {
        return '<a class="kartu hal" href="#/' + esc(m.id + "/" + p.id) + '"><span>' + esc(p.judul) + "</span>" + ikon("panah", 16) + "</a>";
      }).join("") + "</div>";
    }
    if (apps.length) html += '<h2 class="judul-bagian">Aplikasi</h2><div class="grid app-grid">' + apps.map(kartuApp).join("") + "</div>";
    if (!rows.length && !m.halaman.length && !apps.length) html += kosong();
    return html;
  }

  function hHalaman(m, p) {
    var i = m.halaman.indexOf(p), seb = m.halaman[i - 1], ber = m.halaman[i + 1];
    var induk = p.induk ? cariHal(m, p.induk) : null;
    var rows = ISI[m.id + "/" + p.id] || [];
    var anak = m.halaman.filter(function (x) { return x.induk === p.id; });
    var punyaKartu = rows.some(function (r) { return (r.jenis || "").toLowerCase() === "kartu"; });
    var html = '<nav class="remah"><a href="#/">Beranda</a><span>/</span><a href="#/' + esc(m.id) + '">' + esc(m.judul) + "</a>" +
      (induk ? '<span>/</span><a href="#/' + esc(m.id + "/" + induk.id) + '">' + esc(induk.judul) + "</a>" : "") + "</nav>" +
      '<header class="kepala ringan"><h1>' + esc(p.judul) + "</h1></header>" +
      (rows.length ? susunIsi(rows, m.id) : (anak.length ? "" : kosong()));
    if (anak.length && !punyaKartu) {
      html += '<div class="grid hal-grid">' + anak.map(function (x) {
        return '<a class="kartu hal" href="#/' + esc(m.id + "/" + x.id) + '"><span>' + esc(x.judul) + "</span>" + ikon("panah", 16) + "</a>";
      }).join("") + "</div>";
    }
    return html + '<nav class="seb-ber">' +
        (seb ? '<a href="#/' + esc(m.id + "/" + seb.id) + '"><small>Sebelumnya</small>' + esc(seb.judul) + "</a>" : "<span></span>") +
        (ber ? '<a class="ber" href="#/' + esc(m.id + "/" + ber.id) + '"><small>Berikutnya</small>' + esc(ber.judul) + "</a>" : "<span></span>") +
      "</nav>";
  }

  function hKatalog(q) {
    q = (q || "").trim().toLowerCase();
    var cocok = APLIKASI.filter(function (a) {
      return !q || [a.nama, a.ringkas, a.repo, a.pengguna, a.fitur.join(" ")].join(" ").toLowerCase().indexOf(q) >= 0;
    });
    var halCocok = [];
    if (q) MENU.forEach(function (m) {
      [{ id: "", judul: m.judul }].concat(m.halaman).forEach(function (p) {
        var teks = [m.judul, p.judul].concat((ISI[m.id + "/" + p.id] || []).map(function (r) { return (r.judul || "") + " " + (r.teks || ""); })).join(" ");
        if (teks.toLowerCase().indexOf(q) >= 0) halCocok.push({ m: m, p: p.id ? p : null });
      });
    });
    var isi = '<nav class="remah"><a href="#/">Beranda</a></nav>' +
      '<header class="kepala"><span class="ikon-bulat">' + ikon("katalog", 26) + "</span><div><h1>" + (q ? "Hasil pencarian" : "Katalog Aplikasi") + "</h1>" +
      "<p>" + (q ? 'Kata kunci: "' + esc(q) + '"' : "Semua aplikasi yang terdaftar, dikelompokkan menurut menu.") + "</p></div></header>";
    if (halCocok.length) {
      isi += '<h2 class="judul-bagian">Halaman</h2><div class="grid hal-grid">' + halCocok.map(function (x) {
        var href = "#/" + x.m.id + (x.p ? "/" + x.p.id : "");
        return '<a class="kartu hal" href="' + esc(href) + '"><span>' + esc(x.p ? x.m.judul + " · " + x.p.judul : x.m.judul) + "</span>" + ikon("panah", 16) + "</a>";
      }).join("") + "</div>";
    }
    MENU.forEach(function (m) {
      var apps = cocok.filter(function (a) { return a.kelompok === m.id; });
      if (apps.length) isi += '<h2 class="judul-bagian">' + esc(m.judul) + '</h2><div class="grid app-grid">' + apps.map(kartuApp).join("") + "</div>";
    });
    var yatim = cocok.filter(function (a) { return !cariMenu(a.kelompok); });
    if (yatim.length) isi += '<h2 class="judul-bagian">Lainnya</h2><div class="grid app-grid">' + yatim.map(kartuApp).join("") + "</div>";
    if (!cocok.length && !halCocok.length) isi += '<section class="blok"><div class="catatan">Tidak ada yang cocok.</div></section>';
    return isi;
  }

  function hTakAda() {
    return '<header class="kepala ringan"><h1>Halaman tidak ditemukan</h1></header><p><a href="#/">Kembali ke beranda</a></p>';
  }

  /* ---------- Router ---------- */
  function bacaRute() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    var q = "", iq = h.indexOf("?");
    if (iq >= 0) { q = new URLSearchParams(h.slice(iq + 1)).get("q") || ""; h = h.slice(0, iq); }
    var bag = h.split("/").filter(Boolean);
    if (!bag.length) return {};
    if (bag[0] === "katalog") return { khusus: "katalog", q: q };
    return { menu: bag[0], halaman: bag[1] };
  }

  function tampilkan() {
    var r = bacaRute(), html, judul = SITUS.judul || "Satu Data Tambora", nama = judul;
    if (r.khusus === "katalog") { html = hKatalog(r.q); judul = "Katalog Aplikasi · " + nama; }
    else if (!r.menu) html = hBeranda();
    else {
      var m = cariMenu(r.menu);
      if (!m) html = hTakAda();
      else if (!r.halaman) { html = hMenu(m); judul = m.judul + " · " + nama; }
      else {
        var p = cariHal(m, r.halaman);
        if (p) { html = hHalaman(m, p); judul = p.judul + " · " + nama; }
        else html = hTakAda();
      }
    }
    $isi.innerHTML = html;
    document.title = judul;
    gambarNav(r);
    tutupMenu();
    window.scrollTo(0, 0);
  }

  /* ---------- Menu mobile & pencarian ---------- */
  var $side = document.getElementById("sidebar"), $scrim = document.getElementById("scrim"), $btn = document.getElementById("menuBtn");
  function bukaMenu() { $side.classList.add("buka"); $scrim.hidden = false; $btn.setAttribute("aria-expanded", "true"); }
  function tutupMenu() { $side.classList.remove("buka"); $scrim.hidden = true; $btn.setAttribute("aria-expanded", "false"); }
  $btn.addEventListener("click", function () { $side.classList.contains("buka") ? tutupMenu() : bukaMenu(); });
  $scrim.addEventListener("click", tutupMenu);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") tutupMenu(); });

  var tunda;
  $cari.addEventListener("input", function () {
    clearTimeout(tunda);
    tunda = setTimeout(function () {
      var q = $cari.value.trim();
      var tujuan = q ? "#/katalog?q=" + encodeURIComponent(q) : "#/katalog";
      if (location.hash !== tujuan) history.replaceState(null, "", tujuan);
      var r = bacaRute();
      $isi.innerHTML = hKatalog(r.q);
      gambarNav(r);
    }, 150);
  });

  function gambarFooter() {
    var asal = {
      sheets: "Isi dimuat langsung dari Google Sheets.",
      cadangan: "Isi dimuat dari salinan cadangan (data/isi). Google Sheets belum disambungkan.",
      "cadangan-gagal": "Google Sheets tidak bisa dibaca (periksa link dan pengaturan berbagi), isi dimuat dari salinan cadangan."
    }[ASAL] || "";
    var gh = bersih(SITUS.github);
    document.getElementById("footer").innerHTML =
      "<p>" + esc(SITUS.pengelola || "") + "</p>" +
      '<p class="redup">' + esc(asal) + (gh ? ' Kode: <a href="https://github.com/' + esc(gh) + '" target="_blank" rel="noopener">github.com/' + esc(gh) + "</a>" : "") + "</p>";
    var brand = document.querySelector(".brand strong");
    if (brand && SITUS.judul) brand.textContent = SITUS.judul;
    var sub = document.querySelector(".brand small");
    if (sub && SITUS.subjudul) sub.textContent = SITUS.subjudul;
    var tb = document.querySelector(".topbar-title");
    if (tb && SITUS.judul) tb.textContent = SITUS.judul;
  }

  $isi.innerHTML = '<p class="memuat">Memuat isi…</p>';
  muat().then(function (data) {
    susun(data);
    gambarFooter();
    window.addEventListener("hashchange", tampilkan);
    tampilkan();
  }).catch(function (e) {
    $isi.innerHTML = '<section class="blok"><div class="catatan">Isi dashboard gagal dimuat. Coba muat ulang halaman.</div></section>';
    if (window.console) console.error(e);
  });
})();
