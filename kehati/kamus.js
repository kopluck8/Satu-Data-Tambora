/* Keanekaragaman Hayati · Kamus metode dan rumus (isi di kamus-data.js). */
(function () {
  'use strict';
  var K = window.KEHATI, esc = K.esc;
  var wadah, saring = { q: '', grup: '', asal: '' };

  function namaKalk(id) { var k = (K.KALK || []).filter(function (x) { return x.id === id; })[0]; return k ? k.nama : id; }

  function lema(x) {
    var h = '<article class="lema" id="k-' + x.id + '" data-id="' + x.id + '">';
    h += '<header class="lema-kepala"><h3 tabindex="-1">' + esc(x.nama) + '</h3><div class="chip-deret">' +
      x.asal.map(function (a) { return '<span class="chip chip--' + a + '">' + esc(window.KAMUS_ASAL[a]) + '</span>'; }).join('') + '</div></header>';
    h += '<p class="lema-guna">' + esc(x.guna) + '</p>';
    if (x.rumus) {
      h += '<div class="lema-rumus">' + x.rumus.map(function (r) {
        var t = typeof r === 'string' ? r : r.t, k = typeof r === 'string' ? '' : r.k;
        return (k ? '<p class="rumus-ket">' + esc(k) + '</p>' : '') + K.rumus(t);
      }).join('') + '</div>';
    }
    if (x.simbol) {
      h += '<dl class="lema-simbol">' + x.simbol.map(function (s) { return '<div><dt>' + K.tex(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '</dl>';
    }
    if (x.tabel) {
      h += '<div class="tabel-wadah lema-tabel"><table><thead><tr>' + x.tabel.kepala.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        x.tabel.baris.map(function (b) { return '<tr>' + b.map(function (c, j) { return j === 0 ? '<th scope="row">' + esc(c) + '</th>' : '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    }
    if (x.butir) h += '<ul class="lema-butir">' + x.butir.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>';
    h += '<dl class="fakta lema-fakta">';
    if (x.data) h += '<dt>Data yang dibutuhkan</dt><dd>' + esc(x.data) + '</dd>';
    if (x.baca) h += '<dt>Cara membaca</dt><dd>' + esc(x.baca) + '</dd>';
    if (x.pakai) h += '<dt>Dipakai pada</dt><dd>' + esc(x.pakai) + '</dd>';
    if (x.catatan) h += '<dt>Catatan</dt><dd>' + esc(x.catatan) + '</dd>';
    h += '<dt>Sumber</dt><dd><ul class="lema-sumber">' + x.sumber.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></dd></dl>';
    if (x.kalk) h += '<p class="lema-aksi"><a class="tombol" href="#/kalkulator/' + x.kalk + '">' + K.ikon.hitung + '<span>Hitung dengan kalkulator ' + esc(namaKalk(x.kalk).toLowerCase()) + '</span></a></p>';
    return h + '</article>';
  }

  function cocok(x) {
    if (saring.grup && x.grup !== saring.grup) return false;
    if (saring.asal && x.asal.indexOf(saring.asal) < 0) return false;
    if (saring.q) {
      var t = (x.nama + ' ' + x.guna + ' ' + (x.data || '') + ' ' + (x.baca || '') + ' ' + (x.pakai || '') + ' ' + x.sumber.join(' ')).toLowerCase();
      return saring.q.toLowerCase().split(/\s+/).every(function (k) { return t.indexOf(k) >= 0; });
    }
    return true;
  }

  function gambar() {
    var daftar = wadah.querySelector('#kamusDaftar'), n = 0, h = '';
    window.KAMUS_GRUP.forEach(function (g, gi) {
      var isiG = window.KAMUS.filter(function (x) { return x.grup === g.id && cocok(x); });
      if (!isiG.length) return;
      n += isiG.length;
      h += '<section class="bagian kamus-grup" aria-labelledby="kg-' + g.id + '"><div class="bagian-kepala"><span class="bagian-no">' + ('0' + (gi + 1)).slice(-2) + '</span><h2 id="kg-' + g.id + '">' + esc(g.nama) + '</h2></div>' +
        '<div class="lema-daftar">' + isiG.map(lema).join('') + '</div></section>';
    });
    if (!n) {
      h = '<section class="bagian"><div class="catatan-data">' + K.ikon.info + '<div><p><b>Tidak ada metode yang cocok dengan saringan.</b></p><p>Coba kata lain, misalnya kerapatan, Chao, atau transek, atau hapus saringan untuk melihat semua metode.</p><p style="margin-top:10px"><button type="button" class="tombol" id="kamusHapus">Hapus saringan</button></p></div></div></section>';
    }
    daftar.innerHTML = h;
    wadah.querySelector('#kamusJumlah').textContent = K.n(n) + ' dari ' + K.n(window.KAMUS.length) + ' metode';
    var hapus = wadah.querySelector('#kamusHapus');
    if (hapus) hapus.addEventListener('click', function () {
      saring = { q: '', grup: '', asal: '' };
      wadah.querySelector('#kamusCari').value = ''; wadah.querySelector('#kamusGrup').value = ''; wadah.querySelector('#kamusAsal').value = '';
      gambar(); wadah.querySelector('#kamusCari').focus();
    });
  }

  function ke(id) {
    if (!id) return;
    var el = document.getElementById('k-' + id);
    if (!el) {
      /* lema tersembunyi oleh saringan: longgarkan lalu coba lagi */
      if (window.KAMUS.some(function (x) { return x.id === id; }) && (saring.q || saring.grup || saring.asal)) {
        saring = { q: '', grup: '', asal: '' };
        wadah.querySelector('#kamusCari').value = ''; wadah.querySelector('#kamusGrup').value = ''; wadah.querySelector('#kamusAsal').value = '';
        gambar(); el = document.getElementById('k-' + id);
      }
      if (!el) return;
    }
    /* posisi digulir ulang setelah fon termuat, karena tinggi baris berubah saat fon berganti */
    var gulir = function () {
      if (!el.isConnected) return;
      el.style.scrollMarginTop = (K.tinggiAtas() + 12) + 'px';
      try { el.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (e) { el.scrollIntoView(true); }
    };
    gulir();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(gulir);
    el.classList.add('lema--tuju');
    var j = el.querySelector('h3'); if (j) j.focus({ preventScroll: true });
    setTimeout(function () { el.classList.remove('lema--tuju'); }, 2400);
  }

  K.rute.kamus = {
    judul: 'Kamus metode dan rumus',
    muat: function (isi, arg) {
      wadah = isi;
      var A = {}; window.KAMUS.forEach(function (x) { x.asal.forEach(function (a) { A[a] = (A[a] || 0) + 1; }); });
      isi.innerHTML =
        '<section class="bagian bagian--awal"><h1 class="judul-hal">Kamus metode dan rumus</h1>' +
        '<p class="lede">' + K.n(window.KAMUS.length) + ' metode inventarisasi dan perhitungan keanekaragaman hayati dalam ' + window.KAMUS_GRUP.length + ' kelompok. ' +
        K.n(A.lpk) + ' di antaranya dipakai di LPK atau RPK TN Tambora 2020 sampai 2026 dan rumusnya sudah dicocokkan dengan naskah aslinya, ' +
        K.n(A.ksg) + ' ada di buku panduan Kementerian Kehutanan, dan ' + K.n(A.pustaka) + ' berasal dari pustaka baku lain. Satu metode bisa punya lebih dari satu sumber.</p>' +
        '<form class="saring" role="search" aria-label="Saring kamus">' +
        '<div class="isian isian--lebar"><label for="kamusCari">Cari metode</label><input id="kamusCari" type="search" autocomplete="off" placeholder="Misalnya kerapatan, Chao, atau transek"></div>' +
        '<div class="isian"><label for="kamusGrup">Kelompok</label><select id="kamusGrup"><option value="">Semua kelompok</option>' +
        window.KAMUS_GRUP.map(function (g) { return '<option value="' + g.id + '">' + esc(g.nama) + '</option>'; }).join('') + '</select></div>' +
        '<div class="isian"><label for="kamusAsal">Sumber</label><select id="kamusAsal"><option value="">Semua sumber</option>' +
        Object.keys(window.KAMUS_ASAL).map(function (a) { return '<option value="' + a + '">' + esc(window.KAMUS_ASAL[a]) + ' (' + (A[a] || 0) + ')</option>'; }).join('') + '</select></div>' +
        '<p class="saring-hasil" id="kamusJumlah" role="status"></p></form></section><div id="kamusDaftar"></div>';
      var tunda;
      isi.querySelector('form.saring').addEventListener('submit', function (e) { e.preventDefault(); });
      isi.querySelector('#kamusCari').addEventListener('input', function (e) { clearTimeout(tunda); var v = e.target.value.trim(); tunda = setTimeout(function () { saring.q = v; gambar(); }, 140); });
      isi.querySelector('#kamusGrup').addEventListener('change', function (e) { saring.grup = e.target.value; gambar(); });
      isi.querySelector('#kamusAsal').addEventListener('change', function (e) { saring.asal = e.target.value; gambar(); });
      saring = { q: '', grup: '', asal: '' };
      gambar();
      if (arg[0]) setTimeout(function () { ke(arg[0]); }, 60);
    },
    ubah: function (arg) { if (arg[0]) ke(arg[0]); else window.scrollTo(0, 0); }
  };
})();
