/* Temuan Aktivitas Manusia · Perlindungan Kawasan · Satu Data Tambora.
   Angka dibaca dari aplikasi web Mesin Data (aksi "grafik" di apps-script/mesin-data/Unduh.gs): jumlah baris temuan
   di Rekap Temuan Gangguan Kawasan dan Rekap Kejadian Kebakaran Hutan per tahun, kategori, sumber, dan resor.
   File patroli 2027 dan seterusnya yang masuk ke Mesin Data ikut terhitung tanpa mengubah halaman ini.
   Bila arsip laporan kejadian 2016–2025 belum dimuat di Mesin Data, ringkasannya diambil dari
   ../data/perlindungan/temuan_lk.json (kebakaran tahun yang sudah diambil dari rekap karhut dilewati, sama seperti
   di Mesin Data). Login memakai sesi Tanya Data (assets/gerbang.js). Hanya angka, tanpa nama atau isi laporan.
   Alamat aplikasi web: window.SUMBER.UNDUH_DATA, atau baris berkunci "unduh_data" di tab Pengaturan Sheet konten.
   Tautan langsung: #kat=<kode kategori>&resor=<nama resor>&dari=<tahun>&sampai=<tahun>&warna=sumber */
(function () {
  'use strict';

  var SUMBER = window.SUMBER || {};
  var KUNCI_KONTEN = 'sdt-konten-v1';
  var KUNCI_SIMPAN = 'sdt-perlindungan-v1';
  var STATIS = '../data/perlindungan/temuan_lk.json';
  var BATAS_WAKTU = 90000;
  var LABEL_ARSIP = 'Laporan kejadian (arsip terkurasi)';
  var TANPA_RESOR = '(tanpa resor)';
  var LAIN = '_lain';
  var LAIN_SUMBER = '_lainsumber';
  // Warna mengikuti kategori, bukan peringkatnya: urutan tumpukan dari bawah = urutan slot palet (lolos uji buta warna).
  var KATEGORI_TETAP = ['pembalakan', 'kebakaranhutandanlahan', 'penggunaankawasan', 'perburuansatwa',
    'pengembalaanternak', 'pengambilanhhbk', 'alatkerjadantransportasi'];
  var WARNA = ['var(--seri-1)', 'var(--seri-2)', 'var(--seri-3)', 'var(--seri-4)', 'var(--seri-5)', 'var(--seri-6)', 'var(--seri-7)'];
  var WARNA_LAIN = 'var(--seri-lain)';
  var WARNA_TUNGGAL = 'var(--seri-tunggal)';
  var URUT_RESOR = ['Resor Piong', 'Resor Oi Katupa', 'Resor Kawinda Toi', 'Resor Doro Tabe', 'Resor Doroncanga', 'Resor Doropeti', 'Resor Pancasila'];
  var SVGNS = 'http://www.w3.org/2000/svg';
  var IKON = {
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/></svg>',
    awas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4.5M12 17.2v.2"/></svg>',
    centang: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    panah: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
  };

  var S = {
    api: '', live: null, waktuLive: '', dariSimpanan: false, statis: null, D: null,
    status: 'memuat', galat: '', memuat: false, dibangun: false, lebar: {},
    P: { dari: 0, sampai: 0, resor: '', kat: '', warna: 'kategori' }, rentangBawaan: true, sumberUbah: {}
  };
  var main = document.getElementById('isi');

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function angka(n) { return Number(n || 0).toLocaleString('id-ID'); }
  function el(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined && teks !== null) e.textContent = teks;
    return e;
  }
  function daftarTeks(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' dan ' + a[a.length - 1]; }
  function rentang(a, b) { return a === b ? String(a) : a + '–' + b; }
  function dua(n) { return (n < 10 ? '0' : '') + n; }
  function waktuId(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return dua(d.getDate()) + '/' + dua(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + dua(d.getHours()) + '.' + dua(d.getMinutes());
  }
  function tanggalId(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }
  function namaResor(r) { return r === TANPA_RESOR ? 'Tanpa resor' : String(r).replace(/^Resor\s+/i, ''); }

  /* ---------- alamat aplikasi web Mesin Data (sama dengan Unduh Data) ---------- */
  function urlSah(u) { return /^https:\/\/script\.google(usercontent)?\.com\/\S+$/.test(u) || /^https?:\/\/(localhost|127\.0\.0\.1)[:/]\S*$/.test(u); }
  function idSheet(link) {
    var s = String(link || '').trim(), m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    return /^[a-zA-Z0-9_-]{20,}$/.test(s) ? s : '';
  }
  function bacaCsv(teks) {
    var baris = [], sel = '', row = [], kutip = false, i, c;
    teks = String(teks || '').replace(/^﻿/, '');
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
        if (!r.ok) throw new Error('Mesin Data menjawab HTTP ' + r.status + '.');
        return r.text();
      }, function (e) {
        if (t) clearTimeout(t);
        throw new Error(e && e.name === 'AbortError' ? 'Mesin Data terlalu lama menjawab.' : 'Tidak tersambung ke Mesin Data. Periksa koneksi internet.');
      })
      .then(function (teks) {
        var j;
        try { j = JSON.parse(teks); } catch (e) {
          throw new Error(/<html|<!doctype/i.test(teks) ? 'Mesin Data meminta login Google. Admin perlu menerapkan aplikasi web dengan akses "Siapa saja".' : 'Jawaban Mesin Data tidak dikenali.');
        }
        if (j.masukLagi) throw galatMasuk(j.galat);
        if (!j.ok) {
          var g = new Error(j.galat || 'Mesin Data menolak permintaan.');
          if (/aksi tidak dikenal/i.test(j.galat || '')) g.lama = true;
          throw g;
        }
        return j;
      });
  }

  /* ---------- simpanan di browser (angka saja) ---------- */
  function bacaSimpanan() {
    try {
      var o = JSON.parse(localStorage.getItem(KUNCI_SIMPAN));
      if (o && o.data && o.data.ok && Array.isArray(o.data.baris)) return o;
    } catch (e) { /* mode privat atau rusak */ }
    return null;
  }
  function simpan(data) {
    try { localStorage.setItem(KUNCI_SIMPAN, JSON.stringify({ waktu: Date.now(), data: data })); } catch (e) { /* penuh atau diblokir */ }
  }
  function ambilStatis() {
    return fetch(STATIS, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && Array.isArray(j.baris) ? j : null; }).catch(function () { return null; });
  }

  /* ---------- tautan langsung ---------- */
  function bacaAlamat() {
    var o = {};
    String(location.hash || '').replace(/^#/, '').split('&').forEach(function (p) {
      var i = p.indexOf('=');
      if (i > 0) { try { o[decodeURIComponent(p.slice(0, i))] = decodeURIComponent(p.slice(i + 1).replace(/\+/g, ' ')); } catch (e) { /* abaikan */ } }
    });
    return o;
  }
  function terapkanAlamat() {
    var a = bacaAlamat(), P = S.P;
    P.kat = a.kat || '';
    P.resor = a.resor || '';
    P.warna = a.warna === 'sumber' ? 'sumber' : 'kategori';
    P.dari = Number(a.dari) || 0;
    P.sampai = Number(a.sampai) || 0;
    S.rentangBawaan = !P.dari && !P.sampai;
  }
  function tulisAlamat() {
    var P = S.P, D = S.D, a = [];
    if (P.kat) a.push('kat=' + encodeURIComponent(P.kat));
    if (P.resor) a.push('resor=' + encodeURIComponent(P.resor));
    if (D && !S.rentangBawaan) a.push('dari=' + P.dari, 'sampai=' + P.sampai);
    if (P.warna === 'sumber') a.push('warna=sumber');
    var h = a.length ? '#' + a.join('&') : '';
    if ((location.hash || '') !== h) {
      try { history.replaceState(null, '', h || location.pathname + location.search); } catch (e) { /* file:// */ }
    }
  }

  /* ---------- menyatukan data Mesin Data dan salinan arsip ---------- */
  function adaArsip(live) {
    var label = live.arsip || LABEL_ARSIP;
    return (live.sumber || []).some(function (s) { return s && s.label === label && s.n > 0; });
  }
  function peringkatSumber(s) {
    if (s.label === LABEL_ARSIP) return 0;
    if (/laporan kejadian/i.test(s.label)) return 1;
    if (/patroli|smart/i.test(s.label)) return 2;
    if (/kebakaran|karhut/i.test(s.label)) return 3;
    return s.mati ? 5 : 4;
  }
  function susun() {
    var live = S.live, st = S.statis;
    var D = { kat: {}, sumber: {}, urutSumber: [], resor: [], baris: [], pakaiStatis: false, karhutLain: {}, lewat: [], min: 0, max: 0 };
    var resor = {};
    function kat(k, label) {
      if (!D.kat[k]) D.kat[k] = { k: k, label: label || k, slot: KATEGORI_TETAP.indexOf(k) };
      return D.kat[k];
    }
    function sumber(label, mati, asal) {
      return D.sumber[label] || (D.sumber[label] = { label: label, mati: !!mati, asal: asal, n: 0, p: 0 });
    }
    function tambah(th, kt, sb, r, n, p) {
      th = Number(th);
      if (!th || !kt || !kt.k || (!n && !p)) return;
      kat(kt.k, kt.label);
      r = r || TANPA_RESOR;
      resor[r] = true;
      D.baris.push({ th: th, k: kt.k, s: sb.label, r: r, n: n, p: p });
      sb.n += n;
      sb.p += p;
      if (!D.min || th < D.min) D.min = th;
      if (th > D.max) D.max = th;
    }
    if (live) {
      D.karhutLain = live.karhutLain || {};
      (live.baris || []).forEach(function (b) {
        var sb = live.sumber[b[2]] || {};
        tambah(b[0], live.kategori[b[1]], sumber(sb.label || '(tanpa sumber)', sb.mati, 'live'), live.resor[b[3]], +b[4] || 0, +b[5] || 0);
      });
    }
    if (st && (!live || !adaArsip(live))) {
      D.pakaiStatis = true;
      var lewat = Object.keys(D.karhutLain), dilewati = {};
      st.baris.forEach(function (b) {
        var kt = st.kategori[b[1]] || {}, sb = st.sumber[b[2]] || {};
        if (kt.k === 'kebakaranhutandanlahan' && lewat.indexOf(String(b[0])) >= 0) { dilewati[b[0]] = true; return; }
        tambah(b[0], kt, sumber(sb.label || LABEL_ARSIP, false, 'statis'), st.resor[b[3]], +b[4] || 0, +b[5] || 0);
      });
      D.lewat = Object.keys(dilewati);
    }
    D.urutSumber = Object.keys(D.sumber).map(function (k) { return D.sumber[k]; })
      .filter(function (s) { return s.n > 0 || s.p > 0; })
      .sort(function (a, b) { return peringkatSumber(a) - peringkatSumber(b) || b.n - a.n || a.label.localeCompare(b.label, 'id'); });
    D.urutSumber.forEach(function (s, i) { s.slot = i < WARNA.length ? i : -1; });
    D.resor = URUT_RESOR.filter(function (r) { return resor[r]; })
      .concat(Object.keys(resor).filter(function (r) { return URUT_RESOR.indexOf(r) < 0 && r !== TANPA_RESOR; }).sort())
      .concat(resor[TANPA_RESOR] ? [TANPA_RESOR] : []);
    D.urutKat = Object.keys(D.kat).filter(function (k) { return k !== 'pelaku'; }).sort(function (a, b) {
      var sa = D.kat[a].slot, sb = D.kat[b].slot;
      if (sa >= 0 && sb >= 0) return sa - sb;
      if (sa >= 0) return -1;
      if (sb >= 0) return 1;
      return D.kat[a].label.localeCompare(D.kat[b].label, 'id');
    });
    D.katLain = D.urutKat.filter(function (k) { return D.kat[k].slot < 0; });
    return D;
  }

  /* ---------- saringan ---------- */
  function aktif(label) {
    var s = S.D.sumber[label];
    if (!s) return false;
    var u = S.sumberUbah[label];
    return u === undefined ? !s.mati : u;
  }
  function cocokKat(k) {
    var P = S.P;
    if (!P.kat) return true;
    if (P.kat === LAIN) return k !== 'pelaku' && KATEGORI_TETAP.indexOf(k) < 0;
    return k === P.kat;
  }
  function cocok(b, abai) {
    var P = S.P;
    if (abai !== 'sumber' && !aktif(b.s)) return false;
    if (b.th < P.dari || b.th > P.sampai) return false;
    if (abai !== 'resor' && P.resor && b.r !== P.resor) return false;
    if (abai !== 'kat' && !cocokKat(b.k)) return false;
    return true;
  }
  function rapikanPilihan() {
    var P = S.P, D = S.D;
    if (S.rentangBawaan) { P.dari = D.min; P.sampai = D.max; }
    if (!P.dari) P.dari = D.min;
    if (!P.sampai) P.sampai = D.max;
    P.dari = Math.min(Math.max(P.dari, D.min), D.max);
    P.sampai = Math.min(Math.max(P.sampai, D.min), D.max);
    if (P.dari > P.sampai) { var t = P.dari; P.dari = P.sampai; P.sampai = t; }
    if (P.resor && D.resor.indexOf(P.resor) < 0) P.resor = '';
    if (P.kat && P.kat !== LAIN && !D.kat[P.kat]) P.kat = '';
    if (P.kat === LAIN && !D.katLain.length) P.kat = '';
    if (P.kat === 'pelaku') P.kat = '';
  }
  function labelKat(k) {
    if (k === LAIN) return 'Lainnya';
    return S.D.kat[k] ? S.D.kat[k].label : k;
  }
  function warnaKat(k) {
    var i = KATEGORI_TETAP.indexOf(k);
    return i >= 0 ? WARNA[i] : WARNA_LAIN;
  }

  /* ---------- hitungan untuk irisan yang dipilih ---------- */
  function hitung() {
    var D = S.D, P = S.P, tahun = [], th;
    for (th = P.dari; th <= P.sampai; th++) tahun.push(th);
    var modeSumber = P.warna === 'sumber', tunggal = P.kat && P.kat !== LAIN;
    var H = { tahun: tahun, sel: {}, rinci: {}, ada: {}, total: 0, perTh: {}, perKat: {}, perSb: {}, chip: {}, perResor: {}, resorKat: {},
      pelaku: {}, pelakuSb: {}, totalPelaku: 0, adaPelaku: {} };
    tahun.forEach(function (t) { H.sel[t] = {}; H.rinci[t] = {}; H.perTh[t] = 0; H.pelaku[t] = 0; H.pelakuSb[t] = {}; });
    D.baris.forEach(function (b) {
      if (b.n > 0 && b.k !== 'pelaku') {
        if (cocok(b, 'sumber')) H.chip[b.s] = (H.chip[b.s] || 0) + b.n;
        if (cocok(b, 'resor')) {
          H.perResor[b.r] = (H.perResor[b.r] || 0) + b.n;
          var rk = H.resorKat[b.r] || (H.resorKat[b.r] = {});
          rk[b.k] = (rk[b.k] || 0) + b.n;
        }
        if (cocok(b)) {
          var kunci, rinci = '';
          if (modeSumber) {
            var sb = D.sumber[b.s];
            kunci = sb.slot >= 0 ? b.s : LAIN_SUMBER;
            if (kunci === LAIN_SUMBER) rinci = b.s;
          } else if (tunggal) kunci = b.k;
          else {
            kunci = KATEGORI_TETAP.indexOf(b.k) >= 0 ? b.k : LAIN;
            if (kunci === LAIN) rinci = b.k;
          }
          H.sel[b.th][kunci] = (H.sel[b.th][kunci] || 0) + b.n;
          if (rinci) { var r = H.rinci[b.th][kunci] || (H.rinci[b.th][kunci] = {}); r[rinci] = (r[rinci] || 0) + b.n; }
          H.ada[kunci] = true;
          H.total += b.n;
          H.perTh[b.th] += b.n;
          H.perKat[b.k] = (H.perKat[b.k] || 0) + b.n;
          H.perSb[b.s] = (H.perSb[b.s] || 0) + b.n;
        }
      }
      if (b.p > 0 && cocok(b, 'kat')) {
        H.pelaku[b.th] += b.p;
        H.pelakuSb[b.th][b.s] = (H.pelakuSb[b.th][b.s] || 0) + b.p;
        H.totalPelaku += b.p;
        H.adaPelaku[b.s] = true;
      }
    });
    // seri grafik utama
    var seri = [];
    if (modeSumber) {
      D.urutSumber.forEach(function (s) { if (s.slot >= 0 && H.ada[s.label]) seri.push({ key: s.label, label: s.label, warna: WARNA[s.slot] }); });
      if (H.ada[LAIN_SUMBER]) seri.push({ key: LAIN_SUMBER, label: 'Sumber lain', warna: WARNA_LAIN });
    } else if (tunggal) {
      if (H.ada[P.kat]) seri.push({ key: P.kat, label: labelKat(P.kat), warna: warnaKat(P.kat) });
    } else {
      KATEGORI_TETAP.forEach(function (k, i) { if (H.ada[k]) seri.push({ key: k, label: labelKat(k), warna: WARNA[i] }); });
      if (H.ada[LAIN]) seri.push({ key: LAIN, label: 'Lainnya', warna: WARNA_LAIN });
    }
    H.seri = seri;
    H.nilai = function (t, k) { return (H.sel[t] && H.sel[t][k]) || 0; };
    H.totalSeri = {};
    seri.forEach(function (s) { H.totalSeri[s.key] = tahun.reduce(function (a, t) { return a + H.nilai(t, s.key); }, 0); });
    return H;
  }

  /* ---------- tooltip ---------- */
  var tipEl = null, tipAktif = null;
  function tipBaris(nilai, label, warna, kelas) {
    var d = el('div', 'tip-baris' + (kelas ? ' ' + kelas : ''));
    var i = el('i');
    if (warna) i.style.background = warna;
    d.appendChild(i);
    d.appendChild(el('b', '', angka(nilai)));
    d.appendChild(el('span', '', label));
    return d;
  }
  function tampilTip(isi, e, kotak) {
    if (!tipEl) return;
    tipEl.textContent = '';
    tipEl.appendChild(isi);
    tipEl.hidden = false;
    letakkanTip(e, kotak);
  }
  function letakkanTip(e, kotak) {
    if (!tipEl || tipEl.hidden) return;
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight, pad = 14, x, y;
    if (e && e.clientX !== undefined && !kotak) { x = e.clientX + pad; y = e.clientY + pad; if (x + w > innerWidth - 8) x = e.clientX - w - pad; if (y + h > innerHeight - 8) y = e.clientY - h - pad; }
    else if (kotak) { x = kotak.left + kotak.width / 2 - w / 2; y = kotak.top - h - 10; if (y < 8) y = kotak.bottom + 10; }
    else return;
    tipEl.style.left = Math.round(Math.max(8, Math.min(x, innerWidth - w - 8))) + 'px';
    tipEl.style.top = Math.round(Math.max(8, Math.min(y, innerHeight - h - 8))) + 'px';
  }
  function sembunyiTip() {
    if (tipEl) tipEl.hidden = true;
    if (tipAktif) { tipAktif(); tipAktif = null; }
  }
  /** Pasang tooltip pada sasaran (penunjuk, sentuh, dan fokus papan ketik). */
  function pasangTip(sasaran, buat, nyala, padam) {
    function buka(e, kotak) {
      sembunyiTip();
      tampilTip(buat(), e, kotak);
      if (nyala) nyala();
      tipAktif = padam || null;
    }
    sasaran.addEventListener('pointerenter', function (e) { buka(e); });
    sasaran.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') letakkanTip(e); });
    sasaran.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') sembunyiTip(); });
    sasaran.addEventListener('focus', function () { buka(null, sasaran.getBoundingClientRect()); });
    sasaran.addEventListener('blur', sembunyiTip);
  }

  /* ---------- grafik kolom (bertumpuk atau satu seri) ---------- */
  function skala(maks) {
    maks = Math.max(1, maks);
    var kasar = maks / 4, p = Math.pow(10, Math.floor(Math.log(kasar) / Math.LN10)), langkah = p;
    [1, 2, 5, 10].some(function (f) { langkah = f * p; return langkah >= kasar; });
    langkah = Math.max(1, Math.round(langkah));
    return { atas: Math.max(langkah, Math.ceil(maks / langkah) * langkah), langkah: langkah };
  }
  function puncak(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'A' + r + ',' + r + ' 0 0 1 ' + (x + r) + ',' + y + 'H' + (x + w - r) +
      'A' + r + ',' + r + ' 0 0 1 ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
  }
  function bulat(v) { return Math.round(v * 10) / 10; }
  /* o: {tahun, seri:[{key,label,warna}], nilai(th,key), satuan, tinggi, aria, tip(th) -> Node} */
  function kolom(host, o) {
    host.textContent = '';
    var W = Math.max(280, Math.round(host.clientWidth || 640)), H = o.tinggi || 300;
    var total = o.tahun.map(function (t) { return o.seri.reduce(function (a, s) { return a + o.nilai(t, s.key); }, 0); });
    var sk = skala(Math.max.apply(null, total.concat([1])));
    var m = { t: 22, r: 4, b: 28, l: Math.max(30, angka(sk.atas).length * 7.4 + 12) };
    var iw = W - m.l - m.r, ih = H - m.t - m.b, lk = iw / Math.max(1, o.tahun.length);
    var bw = Math.max(6, Math.min(24, Math.floor(lk * 0.6)));
    var penuh = lk >= 40, labelTotal = lk >= 24;
    var g = [], v, y;
    for (v = 0; v <= sk.atas; v += sk.langkah) {
      y = bulat(m.t + ih - v / sk.atas * ih);
      if (v) g.push('<line class="garis-grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y + '" y2="' + y + '"/>');
      g.push('<text x="' + bulat(m.l - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + angka(v) + '</text>');
    }
    o.tahun.forEach(function (t, i) {
      var x0 = bulat(m.l + lk * i), cx = bulat(m.l + lk * i + lk / 2), x = bulat(cx - bw / 2), yy = m.t + ih;
      var ruas = o.seri.map(function (s) { return { s: s, v: o.nilai(t, s.key) }; }).filter(function (d) { return d.v > 0; });
      var isi = ['<g class="kolom" data-i="' + i + '"><rect class="sorot" x="' + x0 + '" y="' + m.t + '" width="' + bulat(lk) + '" height="' + ih + '"/>'];
      ruas.forEach(function (d, j) {
        var h = d.v / sk.atas * ih, atas = j === ruas.length - 1;
        yy -= h;
        var tinggi = Math.max(1, h - (j > 0 ? 2 : 0));
        isi.push(atas ? '<path class="ruas" d="' + puncak(x, bulat(yy), bw, bulat(tinggi), 4) + '" style="fill:' + d.s.warna + '"/>' :
          '<rect class="ruas" x="' + x + '" y="' + bulat(yy) + '" width="' + bw + '" height="' + bulat(tinggi) + '" style="fill:' + d.s.warna + '"/>');
      });
      if (labelTotal) {
        isi.push(total[i] > 0 ? '<text class="nilai" x="' + cx + '" y="' + bulat(yy - 6) + '" text-anchor="middle">' + angka(total[i]) + '</text>' :
          '<text class="nilai-nol" x="' + cx + '" y="' + (m.t + ih - 6) + '" text-anchor="middle">0</text>');
      }
      isi.push('<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + (penuh ? t : '’' + String(t).slice(2)) + '</text>');
      var aria = t + ': ' + angka(total[i]) + ' ' + o.satuan + (o.seri.length > 1 && ruas.length ? '. ' + ruas.slice().reverse().map(function (d) { return d.s.label + ' ' + angka(d.v); }).join(', ') : '');
      isi.push('<rect class="kena" data-i="' + i + '" x="' + x0 + '" y="' + m.t + '" width="' + bulat(lk) + '" height="' + (ih + m.b) + '" tabindex="0" role="img" aria-label="' + esc(aria) + '"/>');
      isi.push('<rect class="cincin-fokus" x="' + (x0 + 1) + '" y="' + (m.t + 1) + '" width="' + bulat(lk - 2) + '" height="' + (ih + m.b - 2) + '" rx="8"/></g>');
      g.push(isi.join(''));
    });
    g.push('<line class="garis-dasar" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + (m.t + ih) + '" y2="' + (m.t + ih) + '"/>');
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', o.aria);
    svg.innerHTML = g.join('');
    host.appendChild(svg);
    svg.querySelectorAll('.kena').forEach(function (r) {
      var i = +r.getAttribute('data-i'), kol = r.parentNode;
      pasangTip(r, function () { return o.tip(o.tahun[i], total[i]); },
        function () { kol.classList.add('on'); host.classList.add('ada-sorot'); },
        function () { kol.classList.remove('on'); host.classList.remove('ada-sorot'); });
    });
    S.lebar[host.id] = W;
  }

  /* ---------- tabel ---------- */
  function tabel(det, kepala, baris, kaki) {
    var bungkus = det.querySelector('.tabel-bungkus'), t = el('table', 'data'), th = el('thead'), tr = el('tr');
    kepala.forEach(function (h) { var c = el('th', '', h); c.scope = 'col'; tr.appendChild(c); });
    th.appendChild(tr);
    t.appendChild(th);
    var tb = el('tbody');
    baris.forEach(function (r) {
      var row = el('tr');
      r.forEach(function (v, i) {
        var c = el(i ? 'td' : 'th', typeof v === 'number' && !v ? 'nol' : '', typeof v === 'number' ? angka(v) : v);
        if (!i) c.scope = 'row';
        row.appendChild(c);
      });
      tb.appendChild(row);
    });
    t.appendChild(tb);
    if (kaki) {
      var tf = el('tfoot'), fr = el('tr');
      kaki.forEach(function (v) { fr.appendChild(el('td', '', typeof v === 'number' ? angka(v) : v)); });
      tf.appendChild(fr);
      t.appendChild(tf);
    }
    bungkus.textContent = '';
    bungkus.appendChild(t);
  }

  /* ---------- kerangka halaman ---------- */
  function bangun() {
    main.innerHTML =
      '<div id="pesanStatus"></div>' +
      '<section class="pembuka"><div><h1 id="judulHalaman">Temuan aktivitas manusia</h1>' +
      '<p>Laporan kejadian dan temuan patroli tentang aktivitas manusia di dalam kawasan TN Tambora, dari data paling awal sampai sekarang. Temuan dari file patroli yang masuk ke Mesin Data ikut terhitung dengan sendirinya.</p></div>' +
      '<div class="pembuka-meta" id="meta"></div></section>' +
      '<div class="saring" role="group" aria-label="Saring grafik">' +
      '<div class="pilihan pilihan--tahun"><span id="lblTahun">Tahun</span><div class="rentang-tahun" role="group" aria-labelledby="lblTahun">' +
      '<select id="pilDari" aria-label="Dari tahun"></select><i aria-hidden="true">–</i><select id="pilSampai" aria-label="Sampai tahun"></select></div></div>' +
      '<label class="pilihan pilihan--resor"><span>Resor</span><select id="pilResor"></select></label>' +
      '<label class="pilihan pilihan--kat"><span>Kategori</span><select id="pilKat"></select></label>' +
      '<div class="pilihan pilihan--warna"><span id="lblWarna">Warnai menurut</span><div class="saklar" role="radiogroup" aria-labelledby="lblWarna">' +
      '<label><input type="radio" name="warna" value="kategori"><span>Kategori</span></label>' +
      '<label><input type="radio" name="warna" value="sumber"><span>Sumber</span></label></div></div>' +
      '<button type="button" class="teks-tombol atur-ulang" id="aturUlang" hidden>Atur ulang saringan</button></div>' +
      '<section class="sumber" aria-labelledby="judulSumber"><div class="sumber-kepala"><h2 id="judulSumber">Sumber data</h2><small>Ketuk untuk menyalakan atau mematikan</small></div>' +
      '<div class="chip-deret" id="chipSumber"></div><p class="saring-catatan" id="catatanSumber" hidden></p></section>' +
      '<section class="angka" id="angka" aria-label="Angka kunci"></section>' +
      '<section class="kotak" aria-labelledby="judulUtama"><div class="kotak-kepala"><h2 id="judulUtama">Temuan per tahun</h2></div>' +
      '<p class="kotak-ket" id="ketUtama"></p>' +
      '<div class="utama"><div class="grafik" id="grafikUtama"></div><ul class="legenda" id="legenda" aria-label="Keterangan warna"></ul></div>' +
      '<p class="catatan" id="catatanUtama"></p>' +
      '<details class="tabel" id="tabelUtama"><summary>' + IKON.panah + 'Lihat tabel</summary><div class="tabel-bungkus"></div></details></section>' +
      '<div class="dua">' +
      '<section class="kotak" aria-labelledby="judulPelaku"><div class="kotak-kepala"><h2 id="judulPelaku">Pelaku tercatat per tahun</h2></div>' +
      '<p class="kotak-ket" id="ketPelaku"></p><div class="grafik" id="grafikPelaku"></div>' +
      '<p class="catatan">Pelaku hanya terhitung bila laporan atau patroli mencatatnya, dan tidak dipilah per kategori. Tahun tanpa batang berarti tidak ada pelaku yang tercatat, belum tentu tidak ada pelaku.</p>' +
      '<details class="tabel" id="tabelPelaku"><summary>' + IKON.panah + 'Lihat tabel</summary><div class="tabel-bungkus"></div></details></section>' +
      '<section class="kotak" aria-labelledby="judulResor"><div class="kotak-kepala"><h2 id="judulResor">Temuan per resor</h2></div>' +
      '<p class="kotak-ket" id="ketResor"></p><div class="palang" id="grafikResor"></div>' +
      '<p class="catatan">Resor dihitung dari koordinat temuan terhadap batas resor 2026, juga untuk laporan sebelum 2026. Tanpa resor berarti titiknya di luar batas resor atau tidak berkoordinat. Ketuk satu resor untuk menyaring semua grafik.</p></section>' +
      '</div>';
    function rentangDiubah() { S.rentangBawaan = S.P.dari === S.D.min && S.P.sampai === S.D.max; ubah(); }
    $('pilDari').addEventListener('change', function () { S.P.dari = +this.value; if (S.P.dari > S.P.sampai) S.P.sampai = S.P.dari; rentangDiubah(); });
    $('pilSampai').addEventListener('change', function () { S.P.sampai = +this.value; if (S.P.sampai < S.P.dari) S.P.dari = S.P.sampai; rentangDiubah(); });
    $('pilResor').addEventListener('change', function () { S.P.resor = this.value; ubah(); });
    $('pilKat').addEventListener('change', function () { S.P.kat = this.value; ubah(); });
    main.querySelectorAll('input[name="warna"]').forEach(function (r) {
      r.addEventListener('change', function () { if (this.checked) { S.P.warna = this.value; ubah(); } });
    });
    $('aturUlang').addEventListener('click', function () {
      S.P.resor = ''; S.P.kat = ''; S.P.warna = 'kategori'; S.rentangBawaan = true; S.sumberUbah = {};
      ubah();
    });
    S.dibangun = true;
  }

  function isiPilihan(sel, opsi, nilai) {
    sel.textContent = '';
    opsi.forEach(function (o) {
      var op = el('option', '', o[1]);
      op.value = o[0];
      if (String(o[0]) === String(nilai)) op.selected = true;
      sel.appendChild(op);
    });
  }

  /* ---------- gambar ulang semua bagian ---------- */
  function ubah() {
    rapikanPilihan();
    tulisAlamat();
    gambar();
  }

  function gambar() {
    if (!S.D) return;
    if (!S.dibangun) bangun();
    sembunyiTip();
    var D = S.D, P = S.P, H = hitung();
    S.H = H;
    $('judulHalaman').textContent = 'Temuan aktivitas manusia ' + rentang(D.min, D.max);
    gambarStatus();
    // saringan
    var th = [];
    for (var t = D.min; t <= D.max; t++) th.push([t, String(t)]);
    isiPilihan($('pilDari'), th, P.dari);
    isiPilihan($('pilSampai'), th, P.sampai);
    isiPilihan($('pilResor'), [['', 'Semua resor']].concat(D.resor.map(function (r) { return [r, r === TANPA_RESOR ? 'Tanpa resor' : r]; })), P.resor);
    var opsiKat = [['', 'Semua kategori']].concat(D.urutKat.map(function (k) { return [k, D.kat[k].label]; }));
    if (D.katLain.length > 1) opsiKat.push([LAIN, 'Lainnya (gabungan)']);
    isiPilihan($('pilKat'), opsiKat, P.kat);
    main.querySelectorAll('input[name="warna"]').forEach(function (r) { r.checked = r.value === P.warna; });
    $('aturUlang').hidden = !(P.resor || P.kat || P.warna !== 'kategori' || !S.rentangBawaan || Object.keys(S.sumberUbah).length);
    gambarSumber(H);
    gambarAngka(H);
    gambarUtama(H);
    gambarPelaku(H);
    gambarResor(H);
    var kaki = [];
    if (S.waktuLive) kaki.push('Mesin Data: ' + waktuId(S.waktuLive) + (S.dariSimpanan ? ' (salinan terakhir di browser ini)' : ''));
    if (D.pakaiStatis && S.statis) kaki.push('salinan arsip hub: ' + tanggalId(S.statis.dibuat));
    $('kakiData').textContent = kaki.length ? 'Data ' + kaki.join(' · ') + '.' : '';
  }

  function pesan(jenis, html) {
    return '<div class="pesan' + (jenis === 'awas' ? ' pesan--peringatan' : '') + '" role="' + (jenis === 'awas' ? 'alert' : 'status') + '">' +
      (jenis === 'awas' ? IKON.awas : IKON.info) + '<p>' + html + '</p></div>';
  }
  function gambarStatus() {
    var D = S.D, h = [], ulang = ' <button type="button" class="teks-tombol" data-ulang>Coba lagi</button>';
    if (S.status === 'tanpa-login') {
      h.push(pesan('info', '<b>Login hub belum aktif,</b> jadi Mesin Data belum bisa dibaca dan yang tampil baru arsip laporan kejadian 2016 sampai 2025 dari salinan hub. Isi TANYA_DATA di data/sumber.js agar temuan patroli ikut terhitung.'));
    } else if (S.status === 'belum-atur') {
      h.push(pesan('info', '<b>Mesin Data belum tersambung.</b> Yang tampil baru arsip laporan kejadian 2016 sampai 2025 dari salinan hub. Temuan patroli muncul setelah alamat aplikasi web Mesin Data diisi di tab Pengaturan Sheet konten (kunci <code>unduh_data</code>).'));
    } else if (S.status === 'lama') {
      h.push(pesan('awas', '<b>Mesin Data belum memakai kode terbaru,</b> jadi temuan patroli belum bisa dihitung di sini. Admin perlu menempel kode Mesin Data terbaru lalu menerapkan versi baru aplikasi webnya. Sementara itu yang tampil ' +
        (S.live ? 'salinan terakhir di browser ini.' : 'arsip laporan kejadian dari salinan hub.') + ulang));
    } else if (S.status === 'galat') {
      h.push(pesan('awas', '<b>Mesin Data belum bisa dibaca.</b> ' + esc(S.galat) + ' Yang tampil ' +
        (S.live ? 'salinan terakhir dari ' + esc(waktuId(S.waktuLive)) + '.' : 'arsip laporan kejadian dari salinan hub.') + ulang));
    } else if (D.pakaiStatis && S.live) {
      h.push(pesan('info', 'Arsip laporan kejadian 2016 sampai 2025 belum dimuat di Mesin Data, jadi bagian itu diambil dari salinan hub dengan angka yang sama.'));
    }
    var wadah = $('pesanStatus'), html = h.join('');
    if (S.pesanTerakhir !== html || !wadah.firstChild !== !html) {
      S.pesanTerakhir = html;
      wadah.innerHTML = html;
      var b = wadah.querySelector('[data-ulang]');
      if (b) b.addEventListener('click', muatLive);
    }
    var meta = [];
    if (S.memuat) meta.push('<span class="lencana"><span class="memuat-cincin kecil" aria-hidden="true"></span>Memperbarui dari Mesin Data…</span>');
    else if (S.waktuLive && S.status === 'ok') meta.push('<span class="lencana">Mesin Data · <b>' + esc(waktuId(S.waktuLive)) + '</b></span>');
    else if (D.pakaiStatis && !S.live) meta.push('<span class="lencana">Salinan arsip hub · <b>' + esc(tanggalId(S.statis && S.statis.dibuat)) + '</b></span>');
    else if (S.waktuLive) meta.push('<span class="lencana">Salinan ' + esc(waktuId(S.waktuLive)) + '</span>');
    $('meta').innerHTML = meta.join('');
    ['grafikUtama', 'grafikPelaku', 'grafikResor'].forEach(function (id) { var g = $(id); if (g) g.classList.toggle('redup', !!S.memuat && !!S.dariSimpanan); });
  }

  function gambarSumber(H) {
    var D = S.D, wadah = $('chipSumber');
    wadah.textContent = '';
    D.urutSumber.forEach(function (s) {
      if (!s.n) return; // sumber yang hanya berisi pelaku tidak bisa dimatikan terpisah
      var b = el('button', 'chip' + (s.asal === 'statis' ? ' chip--statis' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', aktif(s.label) ? 'true' : 'false');
      var c = el('span', 'centang');
      c.innerHTML = IKON.centang;
      b.appendChild(c);
      b.appendChild(el('span', '', s.label));
      b.appendChild(el('small', '', angka(H.chip[s.label] || 0)));
      b.title = (aktif(s.label) ? 'Matikan ' : 'Nyalakan ') + s.label;
      b.addEventListener('click', function () {
        var baru = !aktif(s.label);
        if (baru === !s.mati) delete S.sumberUbah[s.label]; else S.sumberUbah[s.label] = baru;
        ubah();
      });
      wadah.appendChild(b);
    });
    var mati = D.urutSumber.filter(function (s) { return s.mati && s.n; }).map(function (s) { return s.label; });
    var cat = $('catatanSumber');
    cat.hidden = !mati.length;
    cat.textContent = mati.length ? daftarTeks(mati) + ' bawaannya tidak dihitung karena berupa pantauan citra atau pendataan bidang garapan, bukan temuan kejadian. Nyalakan bila perlu.' : '';
  }

  function ubin(label, nilai, ket, teks) {
    return '<div class="ubin"><p class="ubin-label">' + esc(label) + '</p><p class="ubin-nilai' + (teks ? ' ubin-nilai--teks' : '') + '">' + nilai + '</p>' +
      (ket ? '<p class="ubin-ket">' + esc(ket) + '</p>' : '') + '</div>';
  }
  function gambarAngka(H) {
    var P = S.P, puncakTh = 0, nPuncak = 0;
    H.tahun.forEach(function (t) { if (H.perTh[t] > nPuncak) { nPuncak = H.perTh[t]; puncakTh = t; } });
    var nSumber = Object.keys(H.perSb).length;
    var h = ubin('Temuan aktivitas manusia', angka(H.total), rentang(P.dari, P.sampai) + (nSumber ? ', dari ' + nSumber + ' sumber' : ''));
    h += ubin('Tahun terbanyak', puncakTh ? String(puncakTh) : '–', puncakTh ? angka(nPuncak) + ' temuan' : 'belum ada temuan');
    h += ubin('Pelaku tercatat', angka(H.totalPelaku) + ' <small>orang</small>', P.resor ? 'di ' + namaResor(P.resor) : 'dari laporan kejadian dan patroli');
    if (P.kat) {
      var rs = Object.keys(H.perResor).filter(function (r) { return r !== TANPA_RESOR; }).sort(function (a, b) { return H.perResor[b] - H.perResor[a]; })[0];
      h += ubin('Resor terbanyak', rs ? esc(rs) : '–', rs ? angka(H.perResor[rs]) + ' temuan ' + labelKat(P.kat).toLowerCase() : '', true);
    } else {
      var kk = Object.keys(H.perKat).sort(function (a, b) { return H.perKat[b] - H.perKat[a]; })[0];
      h += ubin('Kategori terbanyak', kk ? esc(labelKat(kk)) : '–', kk ? angka(H.perKat[kk]) + ' temuan (' + Math.round(H.perKat[kk] / Math.max(1, H.total) * 100) + '%)' : '', true);
    }
    $('angka').innerHTML = h;
  }

  function ringkasSaring() {
    var P = S.P, a = [];
    a.push(P.resor ? (P.resor === TANPA_RESOR ? 'tanpa resor' : P.resor) : 'semua resor');
    if (P.kat) a.push(labelKat(P.kat).toLowerCase());
    a.push(rentang(P.dari, P.sampai));
    return a.join(' · ');
  }

  function gambarUtama(H) {
    var D = S.D, P = S.P, host = $('grafikUtama'), modeSumber = P.warna === 'sumber';
    $('ketUtama').textContent = 'Jumlah temuan per tahun menurut ' + (modeSumber ? 'sumber data' : (P.kat && P.kat !== LAIN ? 'kategori ' + labelKat(P.kat) : 'kategori')) +
      ', ' + ringkasSaring() + '. Arahkan kursor atau ketuk batang untuk rinciannya.';
    if (!H.total) {
      host.innerHTML = '<p class="kosong">Tidak ada temuan untuk pilihan ini. Coba nyalakan sumber lain atau perluas rentang tahun.</p>';
    } else {
      kolom(host, {
        tahun: H.tahun, seri: H.seri, nilai: H.nilai, satuan: 'temuan', tinggi: innerWidth < 560 ? 260 : 320,
        aria: 'Grafik kolom temuan aktivitas manusia per tahun, ' + ringkasSaring(),
        tip: function (t, tot) {
          var f = document.createDocumentFragment();
          f.appendChild(el('p', 'tip-judul', t + ' · ' + angka(tot) + ' temuan'));
          H.seri.slice().reverse().forEach(function (s) {
            var v = H.nilai(t, s.key);
            if (!v) return;
            f.appendChild(tipBaris(v, s.label, s.warna));
            var r = H.rinci[t][s.key];
            if (r) Object.keys(r).sort(function (a, b) { return r[b] - r[a]; }).forEach(function (k) {
              f.appendChild(tipBaris(r[k], modeSumber ? k : labelKat(k), '', 'tip-baris--sub'));
            });
          });
          if (t === new Date().getFullYear()) f.appendChild(el('p', 'tip-ket', 'Tahun berjalan: angkanya masih bertambah.'));
          return f;
        }
      });
    }
    // legenda: daftar seri dengan jumlahnya; di mode kategori sekaligus jalan pintas memilih kategori
    var leg = $('legenda');
    leg.textContent = '';
    if (H.seri.length > 1 || P.kat || modeSumber) {
      leg.appendChild(el('li', 'legenda-judul', modeSumber ? 'Sumber' : 'Kategori'));
      H.seri.slice().reverse().forEach(function (s) {
        var li = el('li'), b = el('button');
        b.type = 'button';
        var i = el('i');
        i.style.background = s.warna;
        b.appendChild(i);
        var nm = el('span', '', s.label);
        if (s.key === LAIN) {
          var isi = D.katLain.filter(function (k) { return H.perKat[k]; }).map(function (k) { return D.kat[k].label; });
          if (isi.length) b.title = isi.join(', ');
        }
        b.appendChild(nm);
        b.appendChild(el('b', '', angka(H.totalSeri[s.key])));
        if (modeSumber) b.disabled = true;
        else {
          var pilih = P.kat === s.key;
          b.setAttribute('aria-pressed', pilih ? 'true' : 'false');
          b.title = (pilih ? 'Tampilkan semua kategori' : 'Tampilkan hanya ' + s.label) + (b.title ? ' (' + b.title + ')' : '');
          b.addEventListener('click', function () { S.P.kat = S.P.kat === s.key ? '' : s.key; ubah(); });
        }
        li.appendChild(b);
        leg.appendChild(li);
      });
      var tot = el('li', 'total-legenda'), sp = el('span');
      sp.appendChild(el('i'));
      sp.appendChild(el('span', '', 'Total'));
      sp.appendChild(el('b', '', angka(H.total)));
      tot.appendChild(sp);
      leg.appendChild(tot);
      if (P.kat && !modeSumber) {
        var semua = el('li'), bs = el('button', 'teks-tombol', 'Tampilkan semua kategori');
        bs.type = 'button';
        bs.style.cssText = 'display:inline;min-height:32px;padding:4px 8px;';
        bs.addEventListener('click', function () { S.P.kat = ''; ubah(); });
        semua.appendChild(bs);
        leg.appendChild(semua);
      }
    }
    leg.hidden = !leg.children.length;
    // catatan cara membaca
    var cat = [];
    cat.push('<b>Cara membaca.</b> Laporan kejadian menghitung satu kejadian per laporan, sedangkan patroli SMART menghitung setiap temuan di lapangan, jadi satu kejadian bisa tercatat di keduanya dan lonjakan pada tahun patroli SMART mulai masuk sebagian karena cara pencatatan itu. Pilih Warnai menurut Sumber untuk melihat bagiannya.');
    var kosong = H.tahun.filter(function (t) { return !H.perTh[t]; });
    if (kosong.length && !P.resor && !P.kat && kosong.length <= 3) cat.push('Tidak ada temuan tercatat pada ' + daftarTeks(kosong.map(String)) + '.');
    var lain = Object.keys(D.karhutLain || {}).sort();
    if (lain.length) cat.push('Kebakaran tahun ' + daftarTeks(lain) + ' dihitung dari ' + esc(daftarTeks(uniq(lain.map(function (t) { return D.karhutLain[t]; })))) + ', bukan dari arsip laporan kejadian, agar tidak terhitung dua kali.');
    if (P.sampai === new Date().getFullYear()) cat.push('Tahun ' + P.sampai + ' masih berjalan.');
    $('catatanUtama').innerHTML = cat.join(' ');
    // tabel
    var kolomTabel = modeSumber ? D.urutSumber.filter(function (s) { return H.perSb[s.label]; }).map(function (s) { return { key: s.label, label: s.label }; }) :
      D.urutKat.filter(function (k) { return H.perKat[k]; }).map(function (k) { return { key: k, label: D.kat[k].label }; });
    var perKolom = {};
    D.baris.forEach(function (b) {
      if (!(b.n > 0 && b.k !== 'pelaku' && cocok(b))) return;
      var k = modeSumber ? b.s : b.k, r = perKolom[b.th] || (perKolom[b.th] = {});
      r[k] = (r[k] || 0) + b.n;
    });
    tabel($('tabelUtama'), ['Tahun'].concat(kolomTabel.map(function (c) { return c.label; }), ['Total']),
      H.tahun.map(function (t) { return [String(t)].concat(kolomTabel.map(function (c) { return (perKolom[t] && perKolom[t][c.key]) || 0; }), [H.perTh[t]]); }),
      ['Total'].concat(kolomTabel.map(function (c) { return H.tahun.reduce(function (a, t) { return a + ((perKolom[t] && perKolom[t][c.key]) || 0); }, 0); }), [H.total]));
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  function gambarPelaku(H) {
    var P = S.P, host = $('grafikPelaku'), sb = Object.keys(H.adaPelaku);
    $('ketPelaku').textContent = 'Jumlah orang yang tercatat sebagai pelaku, ' + (P.resor ? (P.resor === TANPA_RESOR ? 'tanpa resor' : P.resor) : 'semua resor') + ' · ' + rentang(P.dari, P.sampai) + '.';
    if (!H.totalPelaku) host.innerHTML = '<p class="kosong">Tidak ada pelaku tercatat untuk pilihan ini.</p>';
    else {
      kolom(host, {
        tahun: H.tahun, seri: [{ key: 'p', label: 'Pelaku', warna: WARNA_TUNGGAL }], nilai: function (t) { return H.pelaku[t] || 0; },
        satuan: 'pelaku', tinggi: 220, aria: 'Grafik kolom pelaku tercatat per tahun',
        tip: function (t, tot) {
          var f = document.createDocumentFragment();
          f.appendChild(el('p', 'tip-judul', t + ' · ' + angka(tot) + ' pelaku'));
          var r = H.pelakuSb[t];
          Object.keys(r).sort(function (a, b) { return r[b] - r[a]; }).forEach(function (s) { f.appendChild(tipBaris(r[s], s, '', 'tip-baris--sub')); });
          return f;
        }
      });
    }
    var kep = ['Tahun'].concat(sb.length > 1 ? sb : [], ['Pelaku']);
    tabel($('tabelPelaku'), kep, H.tahun.map(function (t) {
      return [String(t)].concat(sb.length > 1 ? sb.map(function (s) { return H.pelakuSb[t][s] || 0; }) : [], [H.pelaku[t] || 0]);
    }), ['Total'].concat(sb.length > 1 ? sb.map(function (s) { return H.tahun.reduce(function (a, t) { return a + (H.pelakuSb[t][s] || 0); }, 0); }) : [], [H.totalPelaku]));
  }

  function gambarResor(H) {
    var P = S.P, D = S.D, host = $('grafikResor');
    $('ketResor').textContent = 'Jumlah temuan ' + (P.kat ? labelKat(P.kat).toLowerCase() + ' ' : '') + 'per resor, ' + rentang(P.dari, P.sampai) + '.';
    var daftar = Object.keys(H.perResor).filter(function (r) { return r !== TANPA_RESOR; }).sort(function (a, b) { return H.perResor[b] - H.perResor[a] || a.localeCompare(b, 'id'); });
    if (H.perResor[TANPA_RESOR]) daftar.push(TANPA_RESOR);
    host.textContent = '';
    host.classList.toggle('ada-pilih', !!P.resor);
    if (!daftar.length) { host.innerHTML = '<p class="kosong">Tidak ada temuan untuk pilihan ini.</p>'; return; }
    var maks = Math.max.apply(null, daftar.map(function (r) { return H.perResor[r]; }));
    daftar.forEach(function (r) {
      var b = el('button', 'palang-baris' + (r === TANPA_RESOR ? ' palang-baris--tanpa' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', P.resor === r ? 'true' : 'false');
      b.setAttribute('aria-label', (r === TANPA_RESOR ? 'Tanpa resor' : r) + ': ' + angka(H.perResor[r]) + ' temuan. ' + (P.resor === r ? 'Ketuk untuk menampilkan semua resor.' : 'Ketuk untuk menyaring.'));
      b.appendChild(el('span', 'nm', namaResor(r)));
      var jalur = el('span', 'jalur'), i = el('i');
      i.style.width = (H.perResor[r] / maks * 100) + '%';
      jalur.appendChild(i);
      b.appendChild(jalur);
      b.appendChild(el('span', 'v', angka(H.perResor[r])));
      b.addEventListener('click', function () { S.P.resor = S.P.resor === r ? '' : r; ubah(); });
      pasangTip(b, function () {
        var f = document.createDocumentFragment(), rk = H.resorKat[r] || {};
        f.appendChild(el('p', 'tip-judul', (r === TANPA_RESOR ? 'Tanpa resor' : r) + ' · ' + angka(H.perResor[r]) + ' temuan'));
        var kk = Object.keys(rk).sort(function (a, c) { return rk[c] - rk[a]; });
        kk.slice(0, 6).forEach(function (k) { f.appendChild(tipBaris(rk[k], labelKat(k), P.kat ? '' : warnaKat(k))); });
        if (kk.length > 6) f.appendChild(tipBaris(kk.slice(6).reduce(function (a, k) { return a + rk[k]; }, 0), (kk.length - 6) + ' kategori lain', '', 'tip-baris--sub'));
        return f;
      });
      host.appendChild(b);
    });
  }

  /* ---------- muat data ---------- */
  function setelData() {
    S.D = susun();
    if (!S.D.baris.length) {
      main.innerHTML = '<div class="galat" role="alert"><h2>Belum ada temuan untuk ditampilkan</h2><p>' +
        esc(S.status === 'galat' || S.status === 'lama' ? 'Mesin Data belum bisa dibaca: ' + S.galat : 'Mesin Data belum berisi temuan aktivitas manusia.') +
        '</p><p><button type="button" class="tombol" id="ulangiMuat">Coba lagi</button></p></div>';
      S.dibangun = false;
      $('ulangiMuat').addEventListener('click', muatLive);
      return;
    }
    rapikanPilihan();
    tulisAlamat();
    gambar();
  }

  function muatLive() {
    if (S.memuat) return;
    if (!window.SDTGerbang || !window.SDTGerbang.aktif) { S.status = 'tanpa-login'; if (S.statis || S.live) setelData(); return; }
    if (!window.SDTGerbang.sesi()) return; // gerbang menampilkan formulir masuk; sdt-sesi memanggil lagi
    S.memuat = true;
    if (S.D) gambarStatus();
    cariApi().then(function (url) {
      if (!url) { S.status = 'belum-atur'; return null; }
      S.api = url;
      return panggil({ aksi: 'grafik' }).then(function (j) {
        S.live = j;
        S.waktuLive = j.diperbarui || new Date().toISOString();
        S.dariSimpanan = false;
        S.status = 'ok';
        simpan(j);
      });
    }).catch(function (e) {
      if (e.masuk) { S.status = 'masuk'; return; }
      S.status = e.lama ? 'lama' : 'galat';
      S.galat = e.message;
    }).then(function () {
      S.memuat = false;
      if (S.statis || S.live) setelData();
      else if (S.status !== 'masuk') {
        main.innerHTML = '<div class="galat" role="alert"><h2>Grafik belum bisa dimuat</h2><p>' + esc(S.galat || 'Mesin Data belum tersambung dan salinan arsip hub tidak terbaca.') +
          '</p><p><button type="button" class="tombol" id="ulangiMuat">Coba lagi</button></p></div>';
        S.dibangun = false;
        $('ulangiMuat').addEventListener('click', function () { ambilStatis().then(function (st) { S.statis = st; muatLive(); }); });
      }
    });
  }

  function mulai() {
    tipEl = $('tip');
    terapkanAlamat();
    window.addEventListener('hashchange', function () { terapkanAlamat(); if (S.D) ubah(); });
    document.addEventListener('pointerdown', function (e) { if (!e.target.closest || !e.target.closest('.kena, .palang-baris')) sembunyiTip(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') sembunyiTip(); });
    window.addEventListener('scroll', function () { if (tipEl && !tipEl.hidden && document.activeElement && !document.activeElement.classList.contains('kena')) sembunyiTip(); }, { passive: true });
    var tunda = null;
    window.addEventListener('resize', function () {
      clearTimeout(tunda);
      tunda = setTimeout(function () {
        if (!S.H) return;
        var u = $('grafikUtama'), p = $('grafikPelaku');
        if ((u && S.lebar.grafikUtama !== Math.max(280, Math.round(u.clientWidth))) || (p && S.lebar.grafikPelaku !== Math.max(280, Math.round(p.clientWidth)))) gambar();
      }, 150);
    });
    var simpanan = bacaSimpanan();
    if (simpanan) { S.live = simpanan.data; S.waktuLive = simpanan.data.diperbarui || new Date(simpanan.waktu).toISOString(); S.dariSimpanan = true; }
    if (window.SDTGerbang && window.SDTGerbang.aktif) {
      window.addEventListener('sdt-sesi', function (e) { if (e.detail && (S.dariSimpanan || !S.live || S.status !== 'ok')) muatLive(); });
    }
    ambilStatis().then(function (st) {
      S.statis = st;
      if (S.statis || S.live) { S.status = S.live ? 'simpanan' : 'memuat'; setelData(); }
      muatLive();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
