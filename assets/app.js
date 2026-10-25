/* Dashboard TN Tambora: router dan penyusun halaman.
   Isi diambil dari data/menu.js (menu & halaman) dan data/aplikasi.js (daftar aplikasi).
   Biasanya file ini tidak perlu diubah. */
(function () {
  "use strict";

  var SITUS = window.SITUS, MENU = window.MENU, APLIKASI = window.APLIKASI;
  var $isi = document.getElementById("isi");
  var $nav = document.getElementById("nav");
  var $cari = document.getElementById("cari");

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
    peta: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    panah: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  function ikon(nama, ukuran) {
    var s = ukuran || 20;
    return '<svg class="ikon" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (IKON[nama] || IKON.web) + "</svg>";
  }

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cariMenu(id) { return MENU.filter(function (m) { return m.id === id; })[0]; }
  function cariApp(id) { return APLIKASI.filter(function (a) { return a.id === id; })[0]; }
  function appDiMenu(id) { return APLIKASI.filter(function (a) { return a.kelompok === id; }); }
  function urlRepo(a) { return "https://github.com/" + SITUS.githubUser + "/" + a.repo; }
  function urlApp(a, path) { return a.url + (path || ""); }

  /* ---------- Navigasi samping ---------- */
  function navItem(href, label, ikonNama, aktif, sub) {
    return '<a class="nav-link' + (aktif ? " aktif" : "") + (sub ? " sub" : "") + '" href="' + href + '"' + (aktif ? ' aria-current="page"' : "") + ">" +
      (ikonNama ? ikon(ikonNama, 18) : "") + "<span>" + esc(label) + "</span></a>";
  }
  function gambarNav(rute) {
    var h = navItem("#/", "Beranda", "beranda", rute.menu == null && rute.khusus == null);
    MENU.forEach(function (m) {
      var buka = rute.menu === m.id;
      h += navItem("#/" + m.id, m.judul, m.ikon, buka && !rute.halaman);
      if (buka) {
        m.halaman.forEach(function (p) {
          h += navItem("#/" + m.id + "/" + p.id, p.judul, null, rute.halaman === p.id, true);
        });
      }
    });
    h += '<div class="nav-sep"></div>' + navItem("#/katalog", "Katalog Aplikasi", "katalog", rute.khusus === "katalog");
    $nav.innerHTML = h;
  }

  /* ---------- Kartu ---------- */
  function lencana(status) {
    var kelas = status === "aktif" ? "baik" : status === "uji coba" ? "uji" : "kembang";
    return '<span class="lencana ' + kelas + '">' + esc(status || "aktif") + "</span>";
  }
  function kartuApp(a) {
    var m = cariMenu(a.kelompok);
    var halaman = (a.halaman || []).map(function (p) {
      return '<a href="' + esc(urlApp(a, p.path)) + '" target="_blank" rel="noopener">' + esc(p.label) + "</a>";
    }).join("");
    return '<article class="kartu app">' +
      '<div class="kartu-atas">' + lencana(a.status) + (m ? '<span class="kelompok">' + esc(m.judul) + "</span>" : "") + "</div>" +
      "<h3>" + esc(a.nama) + "</h3>" +
      '<p class="redup">' + esc(a.ringkas) + "</p>" +
      (a.fitur && a.fitur.length ? '<ul class="fitur">' + a.fitur.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "") +
      (a.pengguna ? '<p class="pengguna"><strong>Pengguna:</strong> ' + esc(a.pengguna) + "</p>" : "") +
      (halaman ? '<div class="sublink">' + halaman + "</div>" : "") +
      '<div class="aksi">' +
        '<a class="tombol utama" href="' + esc(a.url) + '" target="_blank" rel="noopener">Buka aplikasi ' + ikon("luar", 16) + "</a>" +
        '<a class="tombol" href="' + esc(urlRepo(a)) + '" target="_blank" rel="noopener">' + ikon("github", 16) + " Repo</a>" +
      "</div></article>";
  }
  function kartuMenu(m) {
    var jApp = appDiMenu(m.id).length;
    var info = [m.halaman.length ? m.halaman.length + " halaman" : null, jApp ? jApp + " aplikasi" : null].filter(Boolean).join(" · ");
    return '<a class="kartu menu" href="#/' + m.id + '">' +
      '<span class="ikon-bulat">' + ikon(m.ikon, 24) + "</span>" +
      "<h3>" + esc(m.judul) + "</h3>" +
      '<p class="redup">' + esc(m.ringkas) + "</p>" +
      '<span class="info">' + esc(info) + ikon("panah", 16) + "</span></a>";
  }

  /* ---------- Blok isi ---------- */
  function blok(b) {
    var judul = b.judul ? "<h2>" + esc(b.judul) + "</h2>" : "";
    switch (b.jenis) {
      case "teks":
        return '<section class="blok">' + judul + "<p>" + b.isi + "</p></section>";
      case "poin":
        return '<section class="blok">' + judul + "<ul>" + b.daftar.map(function (d) { return "<li>" + d + "</li>"; }).join("") + "</ul></section>";
      case "catatan":
        return '<section class="blok catatan">' + judul + "<p>" + b.isi + "</p></section>";
      case "gambar":
        return '<figure class="blok gambar">' + judul + '<img loading="lazy" src="' + esc(b.src) + '" alt="' + esc(b.keterangan || b.judul || "") + '">' +
          (b.keterangan ? "<figcaption>" + esc(b.keterangan) + "</figcaption>" : "") + "</figure>";
      case "tautan":
        return '<section class="blok">' + judul + '<div class="daftar-tautan">' + b.daftar.map(function (t) {
          return '<a class="tautan" href="' + esc(t.url) + '" target="_blank" rel="noopener">' + ikon(t.tipe, 22) +
            "<span>" + esc(t.label) + '<small>' + esc(labelTipe(t.tipe)) + "</small></span>" + ikon("luar", 16) + "</a>";
        }).join("") + "</div></section>";
      case "aplikasi":
        return '<div class="grid app-grid">' + b.ids.map(cariApp).filter(Boolean).map(kartuApp).join("") + "</div>";
      case "sematan":
        var url = b.url;
        if (b.app) { var a = cariApp(b.app); if (!a) return ""; url = urlApp(a, b.path); }
        var tinggi = b.tinggi || 600;
        return '<section class="blok sematan">' +
          '<div class="sematan-kepala">' + (b.judul ? "<h2>" + esc(b.judul) + "</h2>" : "<span></span>") +
          '<a href="' + esc(url) + '" target="_blank" rel="noopener">Buka di tab baru ' + ikon("luar", 14) + "</a></div>" +
          '<iframe loading="lazy" src="' + esc(url) + '" title="' + esc(b.judul || "Sematan") + '" style="height:' + tinggi + 'px" allow="fullscreen; geolocation"></iframe>' +
          "</section>";
    }
    return "";
  }
  function labelTipe(t) {
    return { sheet: "Google Sheets", slides: "Google Slides", drive: "Google Drive", peta: "Peta", web: "Situs web" }[t] || "Tautan";
  }

  /* ---------- Halaman ---------- */
  function hBeranda() {
    var jHal = MENU.reduce(function (s, m) { return s + m.halaman.length; }, 0);
    return '<section class="hero">' +
      '<img src="assets/img/logo.png" alt="" width="150" height="77">' +
      '<p class="eyebrow">Selamat datang</p>' +
      "<h1>" + esc(SITUS.judul) + "<span>" + esc(SITUS.subjudul) + "</span></h1>" +
      '<p class="hero-lead">Satu pintu untuk data kawasan, SMART Patrol, Resort Based Management, kebakaran hutan, laporan kejadian, dan semua aplikasi kerja Balai.</p>' +
      '<dl class="angka"><div><dt>Menu</dt><dd>' + MENU.length + "</dd></div><div><dt>Halaman</dt><dd>" + jHal + "</dd></div><div><dt>Aplikasi</dt><dd>" + APLIKASI.length + "</dd></div></dl>" +
      "</section>" +
      '<h2 class="judul-bagian">Menu</h2><div class="grid menu-grid">' + MENU.map(kartuMenu).join("") + "</div>" +
      '<h2 class="judul-bagian">Akses cepat aplikasi</h2><div class="cepat">' + APLIKASI.map(function (a) {
        return '<a href="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(a.nama) + ikon("luar", 14) + "</a>";
      }).join("") + "</div>";
  }

  function hMenu(m) {
    var apps = appDiMenu(m.id);
    return '<nav class="remah"><a href="#/">Beranda</a></nav>' +
      '<header class="kepala"><span class="ikon-bulat">' + ikon(m.ikon, 26) + "</span><div><h1>" + esc(m.judul) + "</h1><p>" + esc(m.ringkas) + "</p>" +
      (m.pengantar ? '<p class="redup">' + esc(m.pengantar) + "</p>" : "") + "</div></header>" +
      (m.halaman.length ? '<h2 class="judul-bagian">Halaman</h2><div class="grid hal-grid">' + m.halaman.map(function (p) {
        return '<a class="kartu hal" href="#/' + m.id + "/" + p.id + '"><span>' + esc(p.judul) + "</span>" + ikon("panah", 16) + "</a>";
      }).join("") + "</div>" : "") +
      (apps.length ? '<h2 class="judul-bagian">Aplikasi</h2><div class="grid app-grid">' + apps.map(kartuApp).join("") + "</div>" :
        "") +
      (!m.halaman.length && !apps.length ? '<section class="blok catatan"><p>Belum ada isi. Tambahkan aplikasi dengan kelompok "' + esc(m.id) + '" di data/aplikasi.js.</p></section>' : "");
  }

  function hHalaman(m, p) {
    var i = m.halaman.indexOf(p), seb = m.halaman[i - 1], ber = m.halaman[i + 1];
    return '<nav class="remah"><a href="#/">Beranda</a><span>/</span><a href="#/' + m.id + '">' + esc(m.judul) + "</a></nav>" +
      '<header class="kepala ringan"><h1>' + esc(p.judul) + "</h1></header>" +
      p.blok.map(blok).join("") +
      '<nav class="seb-ber">' +
        (seb ? '<a href="#/' + m.id + "/" + seb.id + '"><small>Sebelumnya</small>' + esc(seb.judul) + "</a>" : "<span></span>") +
        (ber ? '<a class="ber" href="#/' + m.id + "/" + ber.id + '"><small>Berikutnya</small>' + esc(ber.judul) + "</a>" : "<span></span>") +
      "</nav>";
  }

  function hKatalog(q) {
    q = (q || "").trim().toLowerCase();
    var cocok = APLIKASI.filter(function (a) {
      return !q || [a.nama, a.ringkas, a.repo, a.pengguna, (a.fitur || []).join(" ")].join(" ").toLowerCase().indexOf(q) >= 0;
    });
    var halCocok = [];
    if (q) MENU.forEach(function (m) {
      m.halaman.forEach(function (p) {
        if ((m.judul + " " + p.judul).toLowerCase().indexOf(q) >= 0) halCocok.push({ m: m, p: p });
      });
      if (m.judul.toLowerCase().indexOf(q) >= 0) halCocok.push({ m: m });
    });
    var isi = '<nav class="remah"><a href="#/">Beranda</a></nav>' +
      '<header class="kepala"><span class="ikon-bulat">' + ikon("katalog", 26) + "</span><div><h1>" + (q ? "Hasil pencarian" : "Katalog Aplikasi") + "</h1>" +
      "<p>" + (q ? 'Kata kunci: "' + esc(q) + '"' : "Semua aplikasi yang terdaftar di data/aplikasi.js, dikelompokkan menurut menu.") + "</p></div></header>";
    if (halCocok.length) {
      isi += '<h2 class="judul-bagian">Halaman</h2><div class="grid hal-grid">' + halCocok.map(function (x) {
        var href = "#/" + x.m.id + (x.p ? "/" + x.p.id : "");
        return '<a class="kartu hal" href="' + href + '"><span>' + esc(x.p ? x.m.judul + " · " + x.p.judul : x.m.judul) + "</span>" + ikon("panah", 16) + "</a>";
      }).join("") + "</div>";
    }
    MENU.forEach(function (m) {
      var apps = cocok.filter(function (a) { return a.kelompok === m.id; });
      if (apps.length) isi += '<h2 class="judul-bagian">' + esc(m.judul) + '</h2><div class="grid app-grid">' + apps.map(kartuApp).join("") + "</div>";
    });
    var yatim = cocok.filter(function (a) { return !cariMenu(a.kelompok); });
    if (yatim.length) isi += '<h2 class="judul-bagian">Lainnya</h2><div class="grid app-grid">' + yatim.map(kartuApp).join("") + "</div>";
    if (!cocok.length && !halCocok.length) isi += '<section class="blok catatan"><p>Tidak ada yang cocok.</p></section>';
    return isi;
  }

  function hTakAda() {
    return '<header class="kepala ringan"><h1>Halaman tidak ditemukan</h1></header><p><a href="#/">Kembali ke beranda</a></p>';
  }

  /* ---------- Router ---------- */
  function bacaRute() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    var q = "";
    var iq = h.indexOf("?");
    if (iq >= 0) { q = new URLSearchParams(h.slice(iq + 1)).get("q") || ""; h = h.slice(0, iq); }
    var bag = h.split("/").filter(Boolean);
    if (!bag.length) return {};
    if (bag[0] === "katalog") return { khusus: "katalog", q: q };
    return { menu: bag[0], halaman: bag[1] };
  }

  function tampil() {
    var r = bacaRute(), html, judul = "Dashboard TN Tambora";
    if (r.khusus === "katalog") { html = hKatalog(r.q); judul = "Katalog Aplikasi · " + judul; }
    else if (!r.menu) html = hBeranda();
    else {
      var m = cariMenu(r.menu);
      if (!m) html = hTakAda();
      else if (!r.halaman) { html = hMenu(m); judul = m.judul + " · " + judul; }
      else {
        var p = m.halaman.filter(function (x) { return x.id === r.halaman; })[0];
        if (p) { html = hHalaman(m, p); judul = p.judul + " · " + m.judul; }
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

  document.getElementById("footer").innerHTML =
    "<p>" + esc(SITUS.pengelola) + ", Tahun " + esc(SITUS.tahun) + ".</p>" +
    '<p class="redup">Kode dan daftar aplikasi: <a href="https://github.com/' + esc(SITUS.githubUser) + '/Satu-Data-Tambora" target="_blank" rel="noopener">github.com/' + esc(SITUS.githubUser) + "/Satu-Data-Tambora</a></p>";

  window.addEventListener("hashchange", tampil);
  tampil();
})();
