/* Gerbang masuk Satu Data Tambora.
   Halaman hanya tampil setelah pegawai masuk dengan akun Tanya Data (lembar Akun di Apps Script).
   Sesi yang sama dipakai panel Tanya Data (assets/tanya.js), jadi cukup masuk sekali.
   Dipasang di <head> setelah data/sumber.js pada hub, resor/, dan tenurial/.

   Catatan: ini tirai tampilan. File data di repo dan GitHub Pages tetap bisa dibuka langsung
   oleh siapa pun yang tahu alamatnya; lihat README bagian "Login". */
(function () {
  'use strict';

  var KUNCI_SESI = 'sdt-tanya-sesi';
  var KUNCI_RIWAYAT = 'sdt-tanya-riwayat';
  var KUNCI_PEGAWAI = 'sdt-pegawai-v1'; // olahan DE-BORA (assets/pegawai.js)
  var URL_API = ((window.SUMBER || {}).TANYA_DATA || '').trim();
  var aktif = /^https:\/\/script\.google(usercontent)?\.com\/.+/.test(URL_API) || /^https?:\/\/localhost[:/]/.test(URL_API);
  var skrip = document.currentScript;
  var DASAR = skrip && skrip.src ? skrip.src.replace(/assets\/gerbang\.js(\?.*)?$/, '') : '';
  var akar = document.documentElement;
  var gerbang = null;

  function baca() { try { return JSON.parse(localStorage.getItem(KUNCI_SESI) || 'null'); } catch (e) { return null; } }
  function hapus(k, tempat) { try { (tempat || localStorage).removeItem(k); } catch (e) { /* mode privat */ } }
  function sah(s) { return !!(s && s.token && s.kedaluwarsa > Date.now()); }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.SDTGerbang = { aktif: aktif, sesi: function () { var s = baca(); return sah(s) ? s : null; }, kunci: kunci, keluar: keluar };
  if (!aktif) return;

  /* ---------- gaya (disuntik agar sama di semua halaman) ---------- */
  var gaya = document.createElement('style');
  gaya.textContent = [
    'html.sdt-terkunci, html.sdt-terkunci body { overflow: hidden !important; }',
    'html.sdt-terkunci body > *:not(.sdt-gerbang) { visibility: hidden !important; }',
    '.sdt-gerbang { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: center; padding: 24px 16px; overflow-y: auto;',
    '  background: #04060b url("' + DASAR + 'assets/foto/panorama.webp") center / cover no-repeat; color: #f4f6fb;',
    '  font-family: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; -webkit-font-smoothing: antialiased; }',
    '.sdt-gerbang::before { content: ""; position: fixed; inset: 0; background: radial-gradient(120% 90% at 50% 35%, rgba(4,6,11,.35), rgba(4,6,11,.9)); }',
    '.sdt-kartu { position: relative; display: flex; flex-direction: column; gap: 14px; width: min(420px, 100%); padding: 32px 28px 24px; box-sizing: border-box;',
    '  border-radius: 24px; border: 1px solid rgba(255,255,255,.16); background: rgba(12,16,26,.68); backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);',
    '  box-shadow: 0 30px 80px rgba(0,0,0,.55); }',
    '.sdt-kepala { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; margin-bottom: 6px; }',
    '.sdt-logo { width: 76px; height: 76px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 3px rgba(255,255,255,.22); margin-bottom: 12px; }',
    '.sdt-kepala h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -.01em; line-height: 1.2; }',
    '.sdt-kepala small { font-size: 13.5px; font-weight: 600; color: rgba(244,246,251,.62); }',
    '.sdt-ajak { margin: 0 0 4px; font-size: 14.5px; line-height: 1.55; color: rgba(244,246,251,.8); text-align: center; }',
    '.sdt-kartu label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: rgba(244,246,251,.78); }',
    '.sdt-baris-label { display: flex; justify-content: space-between; align-items: baseline; }',
    '.sdt-kartu input { height: 48px; padding: 0 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.07);',
    '  color: #fff; font: inherit; font-size: 16px; font-weight: 500; box-sizing: border-box; width: 100%; }',
    '.sdt-kartu input:focus { outline: 2px solid #9db8ff; outline-offset: 1px; border-color: transparent; }',
    '.sdt-lihat { border: 0; background: none; padding: 0; color: #9db8ff; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; }',
    '.sdt-lihat:focus-visible { outline: 2px solid #fff; outline-offset: 2px; border-radius: 4px; }',
    '.sdt-galat { margin: 0; padding: 10px 12px; border-radius: 10px; background: rgba(255,107,107,.15); color: #ffc2c2; font-size: 13.5px; line-height: 1.45; }',
    '.sdt-galat[hidden] { display: none; }',
    '.sdt-masuk { height: 48px; margin-top: 4px; border-radius: 999px; border: 0; background: #fff; color: #0a0d14; font: inherit; font-size: 15.5px; font-weight: 800; cursor: pointer; }',
    '.sdt-masuk:focus-visible { outline: 3px solid #9db8ff; outline-offset: 3px; }',
    '.sdt-masuk:disabled { opacity: .65; cursor: progress; }',
    '.sdt-kecil { margin: 2px 0 0; font-size: 12.5px; line-height: 1.5; color: rgba(244,246,251,.56); text-align: center; }',
    '@media (max-width: 480px) { .sdt-gerbang { align-items: start; padding-top: max(40px, env(safe-area-inset-top)); } .sdt-kartu { padding: 26px 20px 20px; } }',
    /* tombol akun di kanan atas hub */
    '.sdt-akun { position: relative; }',
    '.sdt-akun-tombol { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; border: 0; cursor: pointer;',
    '  background: linear-gradient(135deg, #b9cbff, #7d9cf5); color: #0a0d14; font: inherit; font-size: 14px; font-weight: 800; letter-spacing: .02em;',
    '  box-shadow: 0 0 0 2px rgba(255,255,255,.25); }',
    '.sdt-akun-tombol:hover, .sdt-akun-tombol[aria-expanded="true"] { box-shadow: 0 0 0 3px #fff; }',
    '.sdt-akun-tombol:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }',
    '.sdt-akun-menu { position: absolute; right: 0; top: calc(100% + 10px); z-index: 90; min-width: 230px; padding: 8px; border-radius: 16px;',
    '  border: 1px solid rgba(255,255,255,.16); background: rgba(14,18,28,.94); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);',
    '  box-shadow: 0 20px 50px rgba(0,0,0,.5); }',
    '.sdt-akun-menu[hidden] { display: none; }',
    '.sdt-akun-menu p { margin: 0; padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 2px; border-bottom: 1px solid rgba(255,255,255,.12); margin-bottom: 6px; }',
    '.sdt-akun-menu strong { font-size: 15px; }',
    '.sdt-akun-menu small { font-size: 12.5px; color: rgba(244,246,251,.6); }',
    '.sdt-akun-menu button { width: 100%; padding: 10px; border: 0; border-radius: 10px; background: none; color: #fff; font: inherit; font-size: 14.5px; font-weight: 600; text-align: left; cursor: pointer; }',
    '.sdt-akun-menu button:hover, .sdt-akun-menu button:focus-visible { background: rgba(255,255,255,.1); outline: none; }',
    '@media (max-width: 600px) { .sdt-akun + .avatar { display: none; } .sdt-akun-tombol { width: 36px; height: 36px; font-size: 13px; } }'
  ].join('\n');
  document.head.appendChild(gaya);

  /* ---------- kunci dan buka ---------- */
  var sesiAwal = baca();
  if (!sah(sesiAwal)) akar.classList.add('sdt-terkunci');

  function apiPost(badan, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ms) : null;
    return fetch(URL_API, { method: 'POST', body: JSON.stringify(badan), redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (t) clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
        function (e) { if (t) clearTimeout(t); throw new Error(e && e.name === 'AbortError' ? 'Server terlalu lama menjawab. Coba lagi.' : 'Tidak tersambung ke server. Periksa koneksi internet.'); });
  }

  function gambarGerbang(pesan) {
    if (gerbang) { tampilGalat(pesan); return; }
    gerbang = document.createElement('div');
    gerbang.className = 'sdt-gerbang';
    gerbang.id = 'sdtGerbang';
    gerbang.setAttribute('role', 'dialog');
    gerbang.setAttribute('aria-modal', 'true');
    gerbang.setAttribute('aria-labelledby', 'sdtJudul');
    gerbang.innerHTML =
      '<form class="sdt-kartu" id="sdtForm" novalidate>' +
        '<div class="sdt-kepala">' +
          '<img class="sdt-logo" src="' + esc(DASAR) + 'assets/img/logo-tntambora.png" alt="" width="76" height="76">' +
          '<h1 id="sdtJudul">Satu Data Tambora</h1>' +
          '<small>Balai Taman Nasional Tambora</small>' +
        '</div>' +
        '<p class="sdt-ajak">Masuk dengan akun pegawai untuk membuka data, peta, dan aplikasi kerja.</p>' +
        '<label for="sdtUser">Username<input id="sdtUser" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required></label>' +
        '<label for="sdtPass"><span class="sdt-baris-label">Password<button type="button" class="sdt-lihat" id="sdtLihat" aria-controls="sdtPass" aria-pressed="false">Lihat</button></span>' +
          '<input id="sdtPass" name="password" type="password" autocomplete="current-password" required></label>' +
        '<p class="sdt-galat" id="sdtGalat" role="alert" hidden></p>' +
        '<button type="submit" class="sdt-masuk" id="sdtMasuk">Masuk</button>' +
        '<p class="sdt-kecil">Belum punya akun atau lupa password? Hubungi admin Satu Data Tambora.</p>' +
      '</form>';
    document.body.appendChild(gerbang);
    // Tombol hub (panah, /, Enter) tidak boleh bekerja di balik gerbang.
    gerbang.addEventListener('keydown', function (e) { e.stopPropagation(); });
    gerbang.querySelector('#sdtLihat').addEventListener('click', function () {
      var p = gerbang.querySelector('#sdtPass'), lihat = p.type === 'password';
      p.type = lihat ? 'text' : 'password';
      this.textContent = lihat ? 'Sembunyikan' : 'Lihat';
      this.setAttribute('aria-pressed', String(lihat));
    });
    gerbang.querySelector('#sdtForm').addEventListener('submit', masuk);
    tampilGalat(pesan);
    setTimeout(function () { var u = gerbang && gerbang.querySelector('#sdtUser'); if (u) u.focus(); }, 30);
  }

  function tampilGalat(pesan) {
    var g = gerbang && gerbang.querySelector('#sdtGalat');
    if (!g) return;
    g.textContent = pesan || '';
    g.hidden = !pesan;
  }

  function masuk(e) {
    e.preventDefault();
    var u = gerbang.querySelector('#sdtUser'), p = gerbang.querySelector('#sdtPass'), t = gerbang.querySelector('#sdtMasuk');
    if (!u.value.trim() || !p.value) { tampilGalat('Isi username dan password.'); (u.value.trim() ? p : u).focus(); return; }
    t.disabled = true;
    t.textContent = 'Memeriksa…';
    tampilGalat('');
    apiPost({ aksi: 'masuk', username: u.value, password: p.value }, 30000).then(function (j) {
      if (!j.ok) throw new Error(j.galat || 'Gagal masuk.');
      var s = { token: j.token, nama: j.nama, peran: j.peran, kedaluwarsa: j.kedaluwarsa, sisa: j.sisa };
      try { localStorage.setItem(KUNCI_SESI, JSON.stringify(s)); } catch (er) { /* mode privat: sesi hanya berlaku di halaman ini */ }
      sesiAwal = s;
      buka(s);
    }).catch(function (err) {
      tampilGalat(err.message);
      p.select();
      p.focus();
    }).then(function () {
      if (!gerbang) return;
      t.disabled = false;
      t.textContent = 'Masuk';
    });
  }

  function buka(s) {
    akar.classList.remove('sdt-terkunci');
    if (gerbang) { gerbang.remove(); gerbang = null; }
    pasangAkun(s);
    window.dispatchEvent(new CustomEvent('sdt-sesi', { detail: s }));
    var f = document.querySelector('.ubin[aria-selected="true"]') || document.querySelector('main, #isi');
    if (f && f.focus) { if (!f.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT)$/.test(f.tagName)) f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); }
  }

  /** Tutup halaman dan minta masuk lagi (sesi habis atau ditolak server). */
  function kunci(pesan) {
    hapus(KUNCI_SESI);
    hapus(KUNCI_PEGAWAI, window.sessionStorage);
    sesiAwal = null;
    akar.classList.add('sdt-terkunci');
    var a = document.querySelector('.sdt-akun');
    if (a) a.remove();
    if (document.body) gambarGerbang(pesan);
    else document.addEventListener('DOMContentLoaded', function () { gambarGerbang(pesan); });
    window.dispatchEvent(new CustomEvent('sdt-sesi', { detail: null }));
  }

  /** Keluar dari seluruh situs: hapus sesi di server dan perangkat, lalu muat ulang. */
  function keluar() {
    var s = baca();
    if (s && s.token) {
      try { fetch(URL_API, { method: 'POST', body: JSON.stringify({ aksi: 'keluar', token: s.token }), keepalive: true }).catch(function () {}); } catch (e) { /* tetap keluar */ }
    }
    hapus(KUNCI_SESI);
    hapus(KUNCI_RIWAYAT, window.sessionStorage);
    hapus(KUNCI_PEGAWAI, window.sessionStorage);
    location.reload();
  }

  /* ---------- tombol akun di hub ---------- */
  function inisial(nama) {
    var k = String(nama || '?').trim().split(/\s+/);
    return ((k[0] || '?').charAt(0) + (k.length > 1 ? k[1].charAt(0) : '')).toUpperCase();
  }
  function pasangAkun(s) {
    var tempat = document.querySelector('.atas-kanan');
    if (!tempat || !s || document.querySelector('.sdt-akun')) return;
    var sampai = new Date(s.kedaluwarsa);
    var jam = ('0' + sampai.getHours()).slice(-2) + '.' + ('0' + sampai.getMinutes()).slice(-2);
    var el = document.createElement('div');
    el.className = 'sdt-akun';
    el.innerHTML =
      '<button type="button" class="sdt-akun-tombol" aria-haspopup="menu" aria-expanded="false" aria-controls="sdtAkunMenu" title="' + esc(s.nama) + '">' +
        '<span aria-hidden="true">' + esc(inisial(s.nama)) + '</span><span class="sr">Akun ' + esc(s.nama) + '</span></button>' +
      '<div class="sdt-akun-menu" id="sdtAkunMenu" role="menu" hidden>' +
        '<p><strong>' + esc(s.nama) + '</strong><small>' + (s.peran === 'admin' ? 'Admin' : 'Pegawai') + ' · masuk sampai ' + jam + '</small></p>' +
        '<button type="button" role="menuitem" id="sdtKeluar">Keluar</button>' +
      '</div>';
    var logo = tempat.querySelector('.avatar');
    tempat.insertBefore(el, logo || null);
    var tombol = el.querySelector('.sdt-akun-tombol'), menu = el.querySelector('.sdt-akun-menu');
    function tutupMenu(fokus) { menu.hidden = true; tombol.setAttribute('aria-expanded', 'false'); if (fokus) tombol.focus(); }
    tombol.addEventListener('click', function () {
      var buka = menu.hidden;
      menu.hidden = !buka;
      tombol.setAttribute('aria-expanded', String(buka));
      if (buka) menu.querySelector('#sdtKeluar').focus();
    });
    el.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape' && !menu.hidden) { e.preventDefault(); tutupMenu(true); }
    });
    document.addEventListener('click', function (e) { if (!menu.hidden && !el.contains(e.target)) tutupMenu(false); });
    menu.querySelector('#sdtKeluar').addEventListener('click', keluar);
  }

  /* ---------- pasang ---------- */
  // Selama terkunci, tombol yang ditekan di luar gerbang tidak diteruskan ke halaman.
  window.addEventListener('keydown', function (e) {
    if (akar.classList.contains('sdt-terkunci') && (!gerbang || !gerbang.contains(e.target))) e.stopImmediatePropagation();
  }, true);

  function siap() {
    var s = baca();
    if (!sah(s)) { gambarGerbang(''); return; }
    pasangAkun(s);
    // Pastikan sesi masih diakui server (bisa hilang lebih awal); sekali per halaman, tidak di dalam iframe hub.
    if (window.top === window) {
      apiPost({ aksi: 'sisa', token: s.token }, 20000).then(function (j) {
        if (j.masukLagi) { kunci(j.galat || 'Sesi berakhir. Silakan masuk lagi.'); return; }
        if (j.ok && typeof j.sisa === 'number') {
          var t = baca();
          if (t && t.token === s.token) { t.sisa = j.sisa; try { localStorage.setItem(KUNCI_SESI, JSON.stringify(t)); } catch (e) { /* biarkan */ } }
        }
      }).catch(function () { /* luring: biarkan, pertanyaan berikutnya akan memeriksa lagi */ });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', siap); else siap();

  // Masa sesi habis saat halaman terbuka.
  setInterval(function () {
    if (!akar.classList.contains('sdt-terkunci') && !sah(baca())) kunci('Sesi berakhir. Silakan masuk lagi.');
  }, 60000);

  // Masuk atau keluar di tab lain (atau di hub saat halaman ini terbuka di penampil).
  window.addEventListener('storage', function (e) {
    if (e.key !== KUNCI_SESI && e.key !== null) return;
    var s = baca();
    if (sah(s) && akar.classList.contains('sdt-terkunci')) buka(s);
    else if (!sah(s) && !akar.classList.contains('sdt-terkunci')) kunci('');
  });
})();
