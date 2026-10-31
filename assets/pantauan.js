/* Angka terkini dari aplikasi lain di kopluck8.github.io: capaian RBM, observasi SMART Patrol,
   dan estimasi bekas terbakar. Tiap sumber boleh gagal; dashboard tetap tampil tanpa angka itu. */
(function () {
  'use strict';

  var PAGES = 'https://kopluck8.github.io/';
  var ALAMAT = {
    rbm: PAGES + 'RBM_TNGunungTambora/',
    smart: PAGES + 'Dashboard_SMART_TNGunungTambora/',
    karhut: PAGES + 'Simulasi-API-Tambora/'
  };

  function muatSkrip(src) {
    return new Promise(function (ok, gagal) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { ok(); };
      s.onerror = function () { gagal(new Error('Gagal memuat ' + src)); };
      document.head.appendChild(s);
    });
  }

  function ambil(url, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 12000) : null;
    return fetch(url, { cache: 'no-cache', signal: ctrl ? ctrl.signal : undefined }).then(function (r) {
      if (t) clearTimeout(t);
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r;
    }, function (e) { if (t) clearTimeout(t); throw e; });
  }

  /* ---------- RBM: memakai logika hitung yang sama dengan dashboard RBM ---------- */
  function rbm() {
    return muatSkrip(ALAMAT.rbm + 'assets/config.js').then(function () {
      var cfg = window.RBM_CONFIG;
      if (!cfg || !cfg.API_URL) throw new Error('RBM belum tersambung ke Apps Script');
      cfg.RENCANA_URL = new URL(cfg.RENCANA_URL, ALAMAT.rbm + 'dashboard/').href;
      return muatSkrip(ALAMAT.rbm + 'assets/rbm.js');
    }).then(function () {
      var R = window.RBM;
      return R.muatRencana().then(function (rencana) {
        return R.muatLaporan(rencana).then(function (data) {
          if (data.contoh) throw new Error('RBM masih mode contoh');
          var keg = R.hitung(rencana, data.laporan);
          var capD = function (k) { return k.capD; };
          return {
            tahun: rencana.tahun,
            capaian: R.rata(keg.map(capD)),
            tercapai: keg.filter(function (k) { return k.status === 'tercapai'; }).length,
            kegiatan: keg.length,
            menunggu: data.laporan.filter(function (l) { return l.status === 'Menunggu'; }).length,
            diperbarui: data.diperbarui,
            perResor: rencana.resor.map(function (r) {
              return {
                nama: String(r.nama).replace(/^Resor\s+/i, ''),
                nilai: R.rata(keg.filter(function (k) { return k.resor === r.id; }).map(capD))
              };
            })
          };
        });
      });
    });
  }

  /* ---------- SMART: hitung observasi tahun berjalan dari CSV yang sama dengan dashboard SMART ---------- */
  function barisCsv(teks) {
    var baris = [], sel = [], s = '', kutip = false;
    for (var i = 0; i < teks.length; i++) {
      var c = teks[i];
      if (kutip) {
        if (c === '"') { if (teks[i + 1] === '"') { s += '"'; i++; } else kutip = false; }
        else s += c;
      } else if (c === '"') kutip = true;
      else if (c === ',') { sel.push(s); s = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && teks[i + 1] === '\n') i++;
        sel.push(s); baris.push(sel); sel = []; s = '';
      } else s += c;
    }
    if (s !== '' || sel.length) { sel.push(s); baris.push(sel); }
    return baris;
  }

  function hitungSmart(teks, tahun) {
    var baris = barisCsv(teks);
    var kunci = function (h) { return String(h || '').toLowerCase().replace(/[^a-z0-9]/g, ''); };
    var hi = -1;
    for (var i = 0; i < Math.min(15, baris.length); i++) {
      if (baris[i].some(function (c) { return kunci(c) === 'observationcategory0'; })) { hi = i; break; }
    }
    if (hi < 0) throw new Error('Kolom SMART tidak dikenali');
    var kepala = baris[hi].map(kunci);
    var iKat = kepala.indexOf('observationcategory0'), iTgl = kepala.indexOf('waypointdate');
    var iGrup = kepala.indexOf('observationgroup'), iWp = kepala.indexOf('waypointid');
    var observasi = 0, titik = {}, nTitik = 0, kat = {};
    baris.slice(hi + 1).forEach(function (b) {
      var k = String(b[iKat] || '').trim();
      if (!k) return;
      var m = /(\d{4})/.exec(b[iTgl] || '');
      if (!m || +m[1] !== tahun) return;
      observasi++;
      var g = (iGrup >= 0 && b[iGrup]) || (b[iWp] + '|' + b[iTgl]);
      if (!titik[g]) { titik[g] = 1; nTitik++; }
      kat[k] = (kat[k] || 0) + 1;
    });
    return {
      tahun: tahun,
      observasi: observasi,
      titik: nTitik,
      kategori: Object.keys(kat).map(function (n) { return { nama: n, nilai: kat[n] }; })
        .sort(function (a, b) { return b.nilai - a.nilai; })
    };
  }

  function smart() {
    return muatSkrip(ALAMAT.smart + 'assets/config.js').then(function () {
      var c = window.SMART_CONFIG || {};
      var tahun = c.TAHUN_AWAL || new Date().getFullYear();
      var cadangan = function () {
        return ambil(ALAMAT.smart + (c.FALLBACK_CSV || 'data/data.csv'), 20000)
          .then(function (r) { return r.text(); })
          .then(function (t) { return hitungSmart(t, tahun); });
      };
      if (!c.SHEET_CSV_URL) return cadangan();
      return ambil(c.SHEET_CSV_URL, 20000)
        .then(function (r) { return r.text(); })
        .then(function (t) { return hitungSmart(t, tahun); })
        .catch(cadangan);
    });
  }

  /* ---------- Karhut: delineasi manual areal terbakar (bila ada), kalau tidak estimasi Sentinel-2 ---------- */
  function namaResor(n) { return String(n).replace(/^Resor?t?\s+/i, ''); }

  function karhutDelineasi() {
    return ambil(ALAMAT.karhut + 'status/areal_terbakar.json', 12000).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.jumlah_delineasi) throw new Error('Belum ada delineasi');
      return {
        sumber: 'delineasi',
        tanggal: d.tanggal,
        awalMusim: d.awal_musim || null,
        terbakar: Number(d.terbakar_ha),
        cakupan: 'kawasan',
        luasKawasan: Number(d.luas_kawasan_ha) || null,
        jumlah: d.jumlah_delineasi,
        riwayat: (d.riwayat || []).map(function (x) { return { tanggal: x.tanggal, baru: Number(x.baru_ha) || 0, kumulatif: Number(x.kumulatif_ha) || 0 }; }),
        perResor: (d.resort || []).map(function (r) {
          return { nama: namaResor(r.nama), nilai: Number(r.terbakar_ha) || 0, luas: Number(r.luas_ha) || 0 };
        })
      };
    });
  }

  function karhutSentinel() {
    return ambil(ALAMAT.karhut + 'status/landscape_terbaru.json', 12000).then(function (r) { return r.json(); }).then(function (d) {
      var kw = d.kawasan && d.kawasan.total;
      var luas = kw ? Number(kw.terbakar_musim_ha) : Number(d.bekas_terbakar_musim_ha);
      if (!isFinite(luas)) throw new Error('Angka bekas terbakar tidak ada');
      return {
        sumber: 'sentinel',
        tanggal: d.tanggal,
        citra: d.citra_terakhir || null,
        awalMusim: d.awal_musim || null,
        terbakar: luas,
        cakupan: kw ? 'kawasan' : 'aoi',
        luasKawasan: kw ? Number(kw.luas_ha) : null,
        perResor: ((d.kawasan && d.kawasan.resort) || []).map(function (r) {
          return { nama: namaResor(r.nama), nilai: Number(r.terbakar_musim_ha) || 0, luas: Number(r.luas_ha) || 0 };
        })
      };
    });
  }

  function karhut() { return karhutDelineasi().catch(karhutSentinel); }

  var SUMBER = { rbm: rbm, smart: smart, karhut: karhut };
  var janji = {};

  window.PANTAUAN = {
    ada: function (nama) { return !!SUMBER[nama]; },
    ambil: function (nama) {
      if (!SUMBER[nama]) return Promise.reject(new Error('Tidak ada pantauan ' + nama));
      if (!janji[nama]) {
        janji[nama] = SUMBER[nama]().catch(function (e) {
          console.warn('Pantauan ' + nama + ' tidak tersedia:', e && e.message ? e.message : e);
          throw e;
        });
      }
      return janji[nama];
    }
  };
})();
