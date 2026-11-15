/* Keanekaragaman Hayati · kamus jenis: foto dan keterangan setiap jenis yang tercatat di data terkurasi.
   Daftar jenis dari ../data/kehati/taksa.json (takson tingkat jenis yang punya temuan),
   foto dan keterangan dari ../data/kehati/kamus_jenis.json. Halaman satu jenis digambar oleh potensi.js. */
(function () {
  'use strict';
  var K = window.KEHATI, esc = K.esc;

  /* kelompok mengikuti kolom ka di taksa.json; hue dipakai untuk sampul jenis yang belum berfoto */
  var KEL = [
    { id: '', nama: 'Semua' },
    { id: 'Aves', nama: 'Burung', hue: 213 },
    { id: 'Flora', nama: 'Tumbuhan', hue: 160 },
    { id: 'Anggrek', nama: 'Anggrek', hue: 160 },
    { id: 'Mamalia', nama: 'Mamalia', hue: 18 },
    { id: 'Reptil', nama: 'Reptil', hue: 18 },
    { id: 'Serangga', nama: 'Serangga', hue: 18 }
  ];
  var namaKel = {}, hueKel = {};
  KEL.forEach(function (k) { namaKel[k.id] = k.nama; hueKel[k.id] = k.hue; });
  K.namaKelJenis = namaKel;

  var URUT = [
    { id: 'temuan', nama: 'Paling sering tercatat' },
    { id: 'nama', nama: 'Nama Indonesia' },
    { id: 'ilmiah', nama: 'Nama ilmiah' }
  ];
  var keadaan = { kel: '', urut: 'temuan' };
  var hal = null; /* elemen halaman daftar yang sedang tampil */

  /* huruf kecil tanpa tanda baca dan diakritik, supaya "elang alap" cocok dengan "Elang-alap" */
  function rata(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  K.siapKamusJenis = function () {
    if (K._kamusJenis) return K._kamusJenis;
    K._kamusJenis = Promise.all([
      K.ambil('taksa.json'),
      /* kamus boleh belum ada: daftar tetap tampil, foto dan keterangan ditandai belum tersedia */
      K.ambil('kamus_jenis.json').catch(function (e) { if (window.console) console.warn(e); return null; })
    ]).then(function (h) {
      var kamus = h[1], isiKamus = (kamus && kamus.jenis) || {};
      var daftar = h[0].filter(function (x) { return x.t === 'jenis' && x.nr > 0; }).map(function (x) {
        var kj = isiKamus[x.tid] || null;
        var cari = rata([x.n, x.i, x.e, x.f, (x.l || []).join(' '), (x.sin || []).join(' '), kj && kj.nu, kj && kj.nt].join(' '));
        return { x: x, kj: kj, cari: cari, tampil: x.n || (x.l && x.l[0]) || x.i, ka: (kj && kj.ka) || x.ka };
      });
      return { daftar: daftar, kamus: kamus };
    }).catch(function (e) { K._kamusJenis = null; throw e; });
    return K._kamusJenis;
  };

  /* sampul: foto bila ada, kalau tidak blok warna kelompok dengan nama marga */
  K.sampulJenis = function (x, kj, kecil) {
    var f = kj && kj.f;
    if (f) {
      var src = K.DASAR + (kecil ? f.k : f.s);
      /* gambar kecil di kisi berdampingan dengan namanya, jadi alt kosong; foto besar di kepala halaman jenis dimuat lebih dulu dan diberi alt */
      if (kecil) return '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async" width="240" height="240">';
      return '<img src="' + esc(src) + '" alt="' + esc('Foto ' + (x.n ? x.n + ' (' + x.i + ')' : x.i)) + '" fetchpriority="high" decoding="async" width="' + f.w + '" height="' + f.h + '">';
    }
    var marga = (x.i || '').split(' ')[0];
    return '<span class="kj-tanpa" style="--kh:' + (hueKel[(kj && kj.ka) || x.ka] || 0) + '"><b>' + esc(marga) + '</b><span>Belum ada foto</span></span>';
  };

  function kartu(o) {
    var x = o.x, sub = [];
    if (x.n || (x.l && x.l.length)) sub.push('<span class="ilmiah">' + esc(x.i) + '</span>');
    sub.push(K.n(x.nr) + ' temuan');
    if (x.p106 === 'Dilindungi') sub.push('dilindungi');
    return '<li><a class="kj-kartu" href="#/jenis/' + encodeURIComponent(x.tid) + '">' +
      '<span class="kj-foto">' + K.sampulJenis(x, o.kj, true) + '</span>' +
      '<span class="kj-t">' + (x.n || (x.l && x.l.length) ? esc(o.tampil) : '<span class="ilmiah">' + esc(x.i) + '</span>') + '</span>' +
      '<span class="kj-s">' + sub.join(' · ') + '</span></a></li>';
  }

  function daftarHal(isi) {
    var g = K.giliran;
    K.memuat(isi, 'Memuat kamus jenis…');
    K.siapKamusJenis().then(function (d) {
      if (g !== K.giliran) return;
      gambarDaftar(isi, d);
    }).catch(function (e) { K.galat(isi, e, K.muatUlang); });
  }

  function gambarDaftar(isi, d) {
    var D = d.daftar, hit = {}, nFoto = 0, nKet = 0, nBuku = 0;
    D.forEach(function (o) {
      hit[o.ka] = (hit[o.ka] || 0) + 1;
      if (o.kj && o.kj.f) nFoto++;
      if (o.kj && o.kj.d && o.kj.d.length) nKet++;
      if (o.kj && o.kj.bk) nBuku++;
    });
    var adaKamus = !!d.kamus;
    var h = '<section class="bagian bagian--awal">' +
      '<h1 class="judul-hal">Kamus jenis</h1>' +
      '<p class="lede">Semua jenis yang sudah teridentifikasi sampai tingkat jenis dan tercatat di data terkurasi, dari LPK teknis PEH 2020 sampai 2026 serta SMART Patrol 2025 dan 2026. ' +
      'Keterangan dan foto diambil dulu dari dokumen Balai TN Tambora. Jenis yang tidak ada di dokumen Balai memakai sumber terbuka, dengan nama pemotret, lisensi, dan tautan sumbernya di halaman jenis.</p>' +
      '<div class="angka-deret">' +
      angka('Jenis tercatat', K.n(D.length), K.n(Object.keys(hit).length) + ' kelompok') +
      (adaKamus ? angka('Berketerangan', K.n(nKet), nKet === D.length ? 'semua jenis' : K.n(D.length - nKet) + ' belum ada sumbernya') +
        angka('Berfoto', K.n(nFoto), nFoto === D.length ? 'semua jenis' : K.n(D.length - nFoto) + ' belum ada foto berlisensi terbuka') +
        angka('Dari dokumen Balai', K.n(nBuku), 'jenis dengan keterangan atau foto dari buku dan presentasi Balai') : '') +
      '</div>' +
      '<fieldset class="pilih-deret kj-chips"><legend class="sr">Kelompok</legend>' + KEL.filter(function (k) { return !k.id || hit[k.id]; }).map(function (k) {
        return '<label class="pilih"><input type="radio" name="kjKel" value="' + k.id + '"' + (keadaan.kel === k.id ? ' checked' : '') + '>' + esc(k.nama) + ' <b>' + K.n(k.id ? hit[k.id] : D.length) + '</b></label>';
      }).join('') + '</fieldset></section>' +
      '<section class="bagian" style="padding-top:8px" aria-label="Daftar jenis">' +
      '<div class="kj-alat"><p class="saring-hasil" id="kjHasil" role="status" aria-live="polite"></p>' +
      '<label class="kj-urut">Urutkan <select id="kjUrut">' + URUT.map(function (u) { return '<option value="' + u.id + '"' + (keadaan.urut === u.id ? ' selected' : '') + '>' + u.nama + '</option>'; }).join('') + '</select></label></div>' +
      (adaKamus ? '' : '<div class="catatan-data" style="margin-bottom:16px">' + K.ikon.info + '<div><p><b>Foto dan keterangan jenis belum termuat.</b></p><p>Berkas data/kehati/kamus_jenis.json tidak terbaca, jadi daftar ini hanya berisi nama. Muat ulang halaman, atau periksa apakah berkas itu sudah ada di repo.</p></div></div>') +
      '<ul class="kj-kisi" id="kjKisi"></ul><div id="kjKosong"></div></section>';
    isi.innerHTML = h;

    /* kartu dibuat sekali; saringan dan urutan hanya menata ulang elemen yang sama supaya foto tidak dimuat ulang */
    var el = {};
    D.forEach(function (o) { el[o.x.tid] = K.el(kartu(o)); });
    var kisi = isi.querySelector('#kjKisi'), hasil = isi.querySelector('#kjHasil'), kosong = isi.querySelector('#kjKosong');
    var kol = new Intl.Collator('id', { sensitivity: 'base' });
    var banding = {
      temuan: function (a, b) { return b.x.nr - a.x.nr || kol.compare(a.tampil, b.tampil); },
      nama: function (a, b) { return kol.compare(a.tampil, b.tampil); },
      ilmiah: function (a, b) { return kol.compare(a.x.i, b.x.i); }
    };
    function saring() {
      var q = rata(K.cari), kata = q ? q.split(' ') : [];
      var cocok = D.filter(function (o) {
        if (keadaan.kel && o.ka !== keadaan.kel) return false;
        for (var i = 0; i < kata.length; i++) if (o.cari.indexOf(kata[i]) < 0) return false;
        return true;
      }).sort(banding[keadaan.urut]);
      kisi.replaceChildren.apply(kisi, cocok.map(function (o) { return el[o.x.tid]; }));
      var kel = keadaan.kel ? namaKel[keadaan.kel].toLowerCase() : '';
      hasil.innerHTML = cocok.length === D.length ? 'Menampilkan semua ' + K.n(D.length) + ' jenis.'
        : 'Menampilkan ' + K.n(cocok.length) + ' dari ' + K.n(D.length) + ' jenis' + (kel ? ' di kelompok ' + esc(kel) : '') + (q ? ' untuk <b>' + esc(K.cari.trim()) + '</b>' : '') + '.';
      if (!cocok.length) {
        kosong.innerHTML = '<div class="kj-kosong"><p><b>Tidak ada jenis yang cocok.</b></p><p style="margin-top:6px">Kamus mencari di nama Indonesia, nama lokal, nama ilmiah, nama Inggris, dan famili. Periksa ejaannya' + (keadaan.kel ? ', atau pilih kelompok Semua' : '') + '.</p>' +
          '<p style="margin-top:14px"><button type="button" class="tombol" id="kjBersih">Hapus pencarian dan saringan</button></p></div>';
        kosong.querySelector('#kjBersih').addEventListener('click', function () {
          keadaan.kel = ''; K.cari = '';
          var kc = document.getElementById('cariJenis'); if (kc) kc.value = '';
          var r = isi.querySelector('input[name="kjKel"][value=""]'); if (r) r.checked = true;
          saring(); var a = kisi.querySelector('a'); if (a) a.focus();
        });
      } else kosong.innerHTML = '';
    }
    isi.querySelector('.kj-chips').addEventListener('change', function (e) { if (e.target.name === 'kjKel') { keadaan.kel = e.target.value; saring(); } });
    isi.querySelector('#kjUrut').addEventListener('change', function (e) { keadaan.urut = e.target.value; saring(); });
    saring();
    hal = { saring: saring };
  }
  function angka(label, nilai, sub) { return '<div class="angka"><div class="angka-label">' + label + '</div><div class="angka-nilai">' + nilai + '</div><div class="angka-sub">' + sub + '</div></div>'; }

  function muat(isi, arg) {
    hal = null;
    if (arg[0]) K.potensi.halJenis(isi, arg[0]);
    else daftarHal(isi);
  }

  K.rute.jenis = {
    judul: 'Kamus jenis',
    muat: muat,
    /* pindah antara daftar dan halaman satu jenis tanpa memuat ulang data */
    ubah: function (arg, jaga) {
      var isi = document.getElementById('isi');
      K.potensi.lepas();
      window.scrollTo(0, 0);
      muat(isi, arg);
      if (!jaga) isi.focus({ preventScroll: true });
    },
    cari: function () { if (hal) hal.saring(); },
    lepas: function () {
      hal = null;
      K.potensi.lepas();
      /* kotak cari hanya berlaku untuk kamus jenis; dikosongkan saat pindah ke menu lain */
      K.cari = '';
      var kc = document.getElementById('cariJenis'); if (kc && document.activeElement !== kc) kc.value = '';
    }
  };
})();
