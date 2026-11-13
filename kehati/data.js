/* Keanekaragaman Hayati · Data masuk: temuan terkurasi per kategori dalam satu format nama, register kegiatan,
   baris yang dibuang beserta alasannya, dan nama yang perlu ditinjau. Data dari ../data/kehati/. */
(function () {
  'use strict';
  var K = window.KEHATI, esc = K.esc;
  var BUKU = '../data/kehati/Data_Masuk_Kehati_TN_Tambora.xlsx';
  var IKON_TUTUP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var POSISI = { objek: 'posisi objek', pengamat: 'posisi pengamat', petak: 'titik petak', proyeksi: 'diproyeksikan dari posisi pengamat', tanpa: '' };
  var TINGKAT = { jenis: 'jenis', marga: 'marga', 'nama lokal': 'nama lokal', kelompok: 'kelompok' };
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var SUB = [
    { id: 'temuan', url: '#/data', judul: 'Temuan per kategori' },
    { id: 'kegiatan', url: '#/data/kegiatan', judul: 'Register kegiatan' },
    { id: 'dibuang', url: '#/data/dibuang', judul: 'Baris dibuang' },
    { id: 'nama', url: '#/data/nama', judul: 'Nama perlu ditinjau' }
  ];
  /* alasan baris dibuang: awal teks alasan di data, label pendek, dan artinya */
  var ALASAN = [
    ['pengulangan', 'Pengulangan di daftar jenis laporan', 'Daftar jenis di tabel laporan yang tidak punya koordinat dipakai satu kali per kegiatan dan jenis. Baris berikutnya untuk jenis yang sama pada kegiatan yang sama tidak dimasukkan.'],
    ['nama di tabel laporan tidak dikenali', 'Nama tidak dikenali', 'Baris dari daftar jenis laporan tanpa koordinat yang namanya tidak cocok dengan daftar rujukan, biasanya teks PDF yang terpotong atau nama lokal tanpa nama ilmiah.'],
    ['data ganda', 'Data ganda', 'Koordinat, jenis, tanggal, dan jumlahnya sama dengan baris lain. Baris yang pertama terbaca dipakai, sisanya dicatat di sini.'],
    ['koordinat lebih dari 1 km', 'Lebih dari 1 km di luar kawasan', 'Koordinatnya berada lebih dari 1 km di luar batas kawasan. Titik sampai 1 km di luar batas tetap masuk.'],
    ['bukan nama jenis', 'Bukan nama jenis', 'Isi selnya bukan nama jenis, misalnya tulisan kosong, judul kolom, atau beberapa jenis dalam satu sel.'],
    ['sudah terwakili', 'Sudah ada temuan berkoordinat', 'Jenis di daftar jenis laporan yang pada kegiatan yang sama sudah punya temuan berkoordinat, jadi baris tanpa koordinatnya tidak ditambahkan.'],
    ['baris tanpa nama jenis', 'Tanpa nama dan koordinat', 'Baris tanpa nama jenis dan tanpa koordinat.']
  ];
  /* cara penyeragaman nama: label pendek dan artinya. Daftar rujukan = daftar induk kehati, kamus data model SMART, dan pasangan nama di data LPK. */
  var CARA = {
    'persis': ['Cocok persis', 'Nama ilmiah di sumber sama dengan nama di daftar rujukan.'],
    'nama': ['Lewat nama Indonesia atau lokal', 'Nama Indonesia atau nama lokal di sumber cocok dengan nama di daftar rujukan.'],
    'ejaan': ['Ejaan nama ilmiah dibetulkan', 'Nama ilmiah di sumber salah eja atau terpotong, lalu dicocokkan ke nama yang paling mirip di daftar rujukan.'],
    'persis (dalam teks)': ['Nama ilmiah diambil dari teks', 'Nama ilmiah yang dikenal ditemukan di dalam teks yang lebih panjang, misalnya dua nama dalam satu sel.'],
    'persis (nama lokal berbeda)': ['Nama lokal menunjuk jenis lain', 'Nama ilmiahnya cocok, tetapi nama lokalnya menurut daftar rujukan menunjuk jenis lain. Nama ilmiah yang dipakai, dan jenis yang ditunjuk nama lokal dicatat di kolom Catatan.'],
    'ejaan (nama lokal berbeda)': ['Nama lokal menunjuk jenis lain', 'Ejaan nama ilmiahnya dibetulkan, tetapi nama lokalnya menurut daftar rujukan menunjuk jenis lain. Nama ilmiah yang dipakai, dan jenis yang ditunjuk nama lokal dicatat di kolom Catatan.'],
    'nama (ilmiah sumber berbeda)': ['Nama Indonesia menunjuk jenis lain', 'Untuk burung dan mamalia: nama Indonesia di sumber menunjuk jenis lain daripada kolom nama ilmiahnya. Nama Indonesia yang dipakai karena itulah yang dicatat di lapangan, dan nama ilmiah sumber dicatat di kolom Catatan.'],
    'nama (kamus data)': ['Lewat pasangan nama di data', 'Nama lokal dicocokkan lewat pasangan nama lokal dan nama ilmiah yang tercatat bersama di tabel LPK lain. Dipakai bila nama itu muncul paling sedikit 3 kali dan paling sedikit 75 % menunjuk jenis yang sama.'],
    'nama (kamus data) (dirapikan)': ['Lewat pasangan nama di data', 'Tulisan nama di sumber dirapikan dulu, lalu dicocokkan lewat pasangan nama lokal dan nama ilmiah di tabel LPK lain. Bentuk yang dirapikan ada di kolom Catatan.'],
    'nama (dirapikan)': ['Tulisan nama dirapikan', 'Tulisan nama di sumber dirapikan dulu, lalu dicocokkan lewat nama Indonesia atau nama lokal. Bentuk yang dirapikan ada di kolom Catatan.'],
    'nama (ejaan)': ['Ejaan nama lokal dibetulkan', 'Nama Indonesia atau nama lokal salah eja, lalu dicocokkan ke nama yang paling mirip di daftar rujukan.'],
    'nama (marga)': ['Nama lokal untuk satu marga', 'Nama lokal ini dipakai untuk beberapa jenis dalam satu marga, jadi temuannya dicatat sampai marga.'],
    'marga': ['Sampai marga', 'Temuan hanya teridentifikasi sampai marga, misalnya Syzygium sp.'],
    'kelompok': ['Kelompok atau belum teridentifikasi', 'Sumber hanya menulis nama kelompok, misalnya burung atau anggrek, atau menulis belum teridentifikasi.'],
    'sumber': ['Nama ilmiah di luar daftar rujukan', 'Nama ilmiah lengkap yang tidak ada di daftar rujukan. Dipakai sesuai tulisan sumber dan perlu dicek ejaan serta keabsahannya.'],
    'belum baku': ['Nama lokal belum dibakukan', 'Nama lokal yang belum bisa dicocokkan ke nama ilmiah. Disimpan sebagai nama lokal sampai ada identifikasi. Tulisan yang hanya berbeda spasi atau tanda petik dianggap satu nama.'],
    'nama ganda': ['Nama lokal untuk beberapa jenis', 'Nama lokal ini dipakai untuk jenis dari marga yang berbeda, jadi belum bisa dipilih. Disimpan sebagai nama lokal, dan jenis yang mungkin dimaksud ada di kolom Catatan.']
  };

  var akar = null, argAkhir = [], giliran = 0, bersih = [];
  function lepasSub() { bersih.forEach(function (f) { try { f(); } catch (e) { /* sudah dilepas */ } }); bersih = []; }
  function lepas() { giliran++; lepasSub(); tutupRinci(); akar = null; }

  /* ---------- pembantu ---------- */
  function ujung(s) { var p = String(s || '').split(' > '); return p[p.length - 1]; }
  function kata(s) { return String(s || '').trim().toLowerCase().split(/\s+/).filter(Boolean); }
  function cocok(teks, kk) { for (var j = 0; j < kk.length; j++) if (teks.indexOf(kk[j]) < 0) return false; return true; }
  function namaPolos(x) { return x.i ? x.i + (x.t === 'marga' ? ' sp.' : '') : (x.n || x.tid); }
  function rentangTgl(a, b) {
    if (!a) return '';
    if (!b || a === b) return K.tgl(a);
    var A = a.split('-'), B = b.split('-');
    if (A[0] === B[0] && A[1] === B[1]) return +A[2] + ' sampai ' + K.tgl(b);
    if (A[0] === B[0]) return +A[2] + ' ' + BLN[+A[1] - 1] + ' sampai ' + K.tgl(b);
    return K.tgl(a) + ' sampai ' + K.tgl(b);
  }
  function waktuKeg(k) { return k.mulai ? rentangTgl(k.mulai, k.selesai) : (k.bulan ? BLN[k.bulan - 1] + ' ' + k.tahun : String(k.tahun)); }
  function koordHtml(lat, lon) {
    return '<span class="koord">' + K.n(Math.abs(lat), 5) + '° ' + (lat < 0 ? 'LS' : 'LU') + '<br>' + K.n(Math.abs(lon), 5) + '° ' + (lon < 0 ? 'BB' : 'BT') + '</span>';
  }
  function angka(label, nilai, sub) { return '<div class="angka"><div class="angka-label">' + label + '</div><div class="angka-nilai">' + nilai + '</div><div class="angka-sub">' + sub + '</div></div>'; }
  function opsi(v, label, n) { return '<option value="' + esc(v) + '">' + esc(label) + (n !== undefined ? ' (' + K.n(n) + ')' : '') + '</option>'; }
  function kepalaSub(id, judul, isi) { return '<div class="bagian-kepala bagian-kepala--tunggal"><h2 id="' + id + '">' + judul + '</h2>' + isi + '</div>'; }
  function tunda(f, ms) { var t; return function () { clearTimeout(t); t = setTimeout(f, ms); }; }
  function sumberLabel(s) { return s === 'SMART' ? 'SMART Patrol' : s; }

  /* teks pencarian dan kunci urut nama, dihitung sekali */
  function siap() {
    var T = K.T;
    if (T._dm) return T._dm;
    var C = T.C, Q = T.Q, n = T.n, cari = new Array(n), urutNama = new Array(n), i, x;
    for (i = 0; i < n; i++) {
      x = C.t[i] >= 0 ? T.taksa[C.t[i]] : null;
      cari[i] = [C.id[i], C.ns[i], C.nl[i], C.plot[i], Q.lokasi[C.lok[i]], C.eko[i], C.tut[i], Q.kegiatan[C.k[i]],
        x ? [x.i, x.n, x.e].concat(x.l || [], x.sin || []).join(' ') : ''].join(' ').toLowerCase();
      urutNama[i] = (x ? namaPolos(x) : (ujung(C.eko[i]) || ujung(C.tut[i]))).toLowerCase();
    }
    return (T._dm = { cari: cari, urutNama: urutNama });
  }

  /* ================= HALAMAN ================= */
  function muat(isi, arg) {
    var g = ++giliran;
    argAkhir = arg || [];
    K.memuat(isi, 'Memuat temuan, register kegiatan, dan ringkasan kurasi…');
    Promise.all([K.siapTemuan(), K.ambil('ringkasan.json')]).then(function (h) {
      if (g !== giliran) return;
      bingkai(isi, h[1]);
      tampil(argAkhir, false);
    }).catch(function (e) { if (g === giliran) K.galat(isi, e, K.muatUlang); });
  }
  function ubah(arg) {
    argAkhir = arg || [];
    /* saat data masih dimuat, bagian yang diminta dipakai begitu data siap */
    if (akar) tampil(argAkhir, true);
  }

  function bingkai(isi, R) {
    var T = K.T;
    akar = { isi: isi, R: R };
    function al(awal) { var s = 0; Object.keys(R.alasan || {}).forEach(function (k) { if (k.indexOf(awal) === 0) s += R.alasan[k]; }); return s; }
    function ps(k) { return (R.penyesuaian || {})[k] || 0; }
    var aturan = [
      'Titik yang berada lebih dari 1 km di luar batas kawasan dibuang (' + K.n(al('koordinat lebih dari 1 km')) + ' baris). Titik sampai 1 km di luar batas tetap masuk (' + K.n(R.di_luar_sampai_1km) + ' temuan).',
      'Data ganda dibuang bila koordinat, jenis, tanggal, dan jumlahnya sama (' + K.n(al('data ganda')) + ' baris). Pengamatan ulang pada tanggal lain tetap masuk.',
      'Baris per pohon di petak vegetasi digabung per petak, jenis, dan tingkat tumbuh, lalu jumlah individunya dijumlahkan (' + K.n(ps('baris petak digabung')) + ' baris digabung). Ukuran petak yang hanya ditulis di baris pertama diteruskan ke baris berikutnya pada petak yang sama (' + K.n(ps('ukuran petak diteruskan')) + ' baris).',
      'Daftar jenis di tabel laporan yang tidak punya koordinat dipakai satu kali per kegiatan dan jenis, dan hanya bila namanya dikenali. Karena aturan ini ' + K.n(al('pengulangan')) + ' pengulangan, ' + K.n(al('nama di tabel laporan tidak dikenali')) + ' nama yang tidak dikenali, dan ' + K.n(al('sudah terwakili')) + ' jenis yang sudah punya temuan berkoordinat tidak dimasukkan.',
      'Isi sel yang bukan nama jenis, misalnya tulisan kosong atau judul kolom, dibuang (' + K.n(al('bukan nama jenis')) + ' baris).',
      'Temuan tanpa koordinat tetap ada di tabel (' + K.n(R.tanpa_koordinat) + ' temuan), tetapi tidak ikut peta dan model.',
      'Tanggal LPK yang jatuh di luar masa kegiatan diperiksa: ' + K.n(ps('tanggal diperbaiki')) + ' diperbaiki karena tanggal dan bulan tertukar atau tahunnya salah tulis, ' + K.n(ps('tanggal di luar masa kegiatan')) + ' lainnya dibiarkan dengan catatan.',
      'Temuan yang jenisnya belum punya kategori mengikuti kategori terbanyak di tabel sumbernya (' + K.n(ps('kategori dari tabel sumber')) + ' temuan) atau kata pertama namanya, misalnya burung (' + K.n(ps('kategori dari kata pertama nama')) + ' temuan).',
      'Nama petugas, pengamat, dan pemberi keterangan tidak disertakan.'
    ];
    var hit = { temuan: R.lolos, kegiatan: T.keg.length, dibuang: R.dibuang };
    isi.innerHTML = '<section class="bagian bagian--awal"><h1 class="judul-hal">Data masuk</h1>' +
      '<p class="lede">Temuan kehati dari <b>' + K.n(R.kegiatan.lpk) + ' LPK teknis PEH ' + R.periode[0] + ' sampai ' + R.periode[1] + '</b> dan <b>SMART Patrol 2026</b> dalam satu format. Nama jenis diseragamkan dengan daftar induk kehati TN Tambora, dan kategorinya mengikuti daftar itu, dari burung sampai tipe ekosistem. Setiap baris sudah dikurasi: titik yang lebih dari 1 km di luar kawasan dan data ganda tidak dimasukkan.</p>' +
      '<div class="angka-deret">' +
      angka('Baris masuk', K.n(R.masuk), 'dari tabel LPK dan SMART Patrol') +
      angka('Lolos kurasi', K.n(R.lolos), K.n(R.berkoordinat) + ' berkoordinat, ' + K.n(R.tanpa_koordinat) + ' tanpa koordinat') +
      angka('Dibuang', K.n(R.dibuang), 'alasannya dicatat untuk setiap baris') +
      angka('Kegiatan', K.n(R.kegiatan.lpk) + ' LPK', K.n(R.kegiatan.berdata) + ' punya tabel temuan, ditambah SMART Patrol') +
      '</div>' +
      '<div class="buku-unduh"><a class="tombol tombol--utama" href="' + BUKU + '" download>' + K.ikon.unduh + '<span>Unduh buku kerja Excel</span></a>' +
      '<p class="kecil redup">Satu lembar untuk setiap kategori, ditambah daftar jenis, register kegiatan, baris dibuang, nama perlu ditinjau, ringkasan model MaxEnt, dan sel grid 1 km.</p></div>' +
      '<details class="lipat"><summary>Lihat aturan kurasi dan penyesuaian data</summary><ol class="lema-butir aturan-kurasi">' + aturan.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ol></details>' +
      '<nav class="sub-tab" id="dmTab" aria-label="Bagian Data masuk">' + SUB.map(function (s) {
        return '<a href="' + s.url + '" data-sub="' + s.id + '">' + s.judul + ' <b' + (hit[s.id] === undefined ? ' hidden' : '') + '>' + (hit[s.id] === undefined ? '' : K.n(hit[s.id])) + '</b></a>';
      }).join('') + '</nav></section>' +
      '<div id="dmIsi"></div>' +
      '<dialog class="rinci" id="dmRinci" aria-labelledby="dmRinciJudul"><div class="rinci-kepala"><h2 id="dmRinciJudul"></h2>' +
      '<button type="button" class="tombol tombol--hantu tombol--ikon" data-tutup aria-label="Tutup rincian">' + IKON_TUTUP + '</button></div><div class="rinci-isi" id="dmRinciIsi"></div></dialog>';
    /* jumlah nama perlu ditinjau diisi begitu berkasnya termuat; galatnya ditampilkan di bagian itu sendiri */
    K.ambil('nama_tinjau.json').then(function (d) {
      var b = isi.querySelector('#dmTab [data-sub="nama"] b');
      if (b && akar && akar.isi === isi) { b.textContent = K.n(d.baris.length); b.hidden = false; }
    }).catch(function () { /* ditangani di bagian Nama perlu ditinjau */ });
    var dlg = isi.querySelector('#dmRinci');
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('[data-tutup]')) tutupRinci(); });
    dlg.addEventListener('close', function () { var b = akar && akar.kembali; if (b && b.isConnected) b.focus(); });
  }

  function tampil(arg, pindah) {
    if (!akar) return;
    var sub = arg[0] || 'temuan', w = akar.isi.querySelector('#dmIsi');
    lepasSub(); tutupRinci();
    Array.prototype.forEach.call(akar.isi.querySelectorAll('#dmTab a'), function (a) {
      if (a.getAttribute('data-sub') === sub) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var bagian = SUB.filter(function (s) { return s.id === sub; })[0];
    document.title = (bagian && sub !== 'temuan' ? bagian.judul + ' · ' : '') + 'Data masuk · Keanekaragaman Hayati · TN Gunung Tambora';
    var f = { temuan: subTemuan, kegiatan: subKegiatan, dibuang: subDibuang, nama: subNama }[sub];
    if (f) f(w, arg[1]);
    else w.innerHTML = '<section class="bagian bagian--rapat"><div class="galat galat--dalam" role="alert"><h2>Bagian tidak ditemukan</h2><p>Data masuk tidak punya bagian <code>' + esc(sub) + '</code>. Tautan mungkin salah ketik. Pilih salah satu bagian di atas.</p></div></section>';
    if (pindah) {
      var nav = akar.isi.querySelector('#dmTab'), kepala = document.querySelector('.kepala');
      if (nav.getBoundingClientRect().top < (kepala ? kepala.offsetHeight : 0)) K.gulirKe(nav);
      var h2 = w.querySelector('h2');
      if (h2) { h2.tabIndex = -1; h2.focus({ preventScroll: true }); }
    }
  }

  /* ================= RINCIAN SATU TEMUAN ================= */
  function tutupRinci() {
    var d = akar && akar.isi.querySelector('#dmRinci');
    if (d && d.open) d.close();
  }
  function bukaRinci(i, tombol) {
    var T = K.T, C = T.C, Q = T.Q, x = C.t[i] >= 0 ? T.taksa[C.t[i]] : null, kid = Q.kegiatan[C.k[i]], kg = T.kegId[kid];
    var dlg = akar.isi.querySelector('#dmRinci'), cara = Q.cara[C.cn[i]], f = [];
    function tambah(label, isi) { if (isi !== '' && isi !== null && isi !== undefined) f.push([label, isi]); }
    tambah('Sumber', sumberLabel(Q.sumber[C.s[i]]));
    tambah('Kegiatan', esc(kg ? kg.judul : kid) + '<small>' + esc(kid) + '</small>');
    tambah('Tanggal', C.tgl[i] ? esc(K.tgl(C.tgl[i])) : 'Tidak tercatat, tahun ' + C.th[i]);
    tambah('Kategori', esc(K.NAMA_KAT[Q.kategori[C.kat[i]]] || Q.kategori[C.kat[i]]));
    if (x) {
      if (x.i) tambah('Nama ilmiah', '<span class="ilmiah">' + esc(x.i) + '</span>' + (x.t === 'marga' ? ' sp.' : ''));
      tambah('Nama Indonesia', esc(x.n));
      tambah('Tingkat identifikasi', esc(TINGKAT[x.t] || x.t));
      var st = K.lencanaStatus(x);
      if (st) tambah('Status', '<span class="status-deret">' + st + '</span>');
    }
    tambah('Nama di sumber', esc(C.ns[i]));
    tambah('Nama lokal di sumber', esc(C.nl[i]));
    if (cara && CARA[cara]) tambah('Cara penyeragaman nama', esc(CARA[cara][0]) + '<small>' + esc(CARA[cara][1]) + '</small>');
    tambah('Catatan', esc(C.ctn[i]));
    if (C.j[i] !== null) tambah('Jumlah', K.nd(C.j[i], 3) + (Q.satuan[C.sat[i]] ? ' ' + esc(Q.satuan[C.sat[i]]) : ''));
    tambah('Jenis temuan', esc(Q.temuan[C.jt[i]]) + (C.tt[i] ? ', tingkat ' + esc(C.tt[i]) : ''));
    tambah('Tipe ekosistem', esc(C.eko[i]));
    tambah('Tutupan lahan', esc(C.tut[i]));
    if (C.lat[i] !== null) {
      var p = POSISI[Q.posisi[C.pos[i]]] || '';
      tambah('Koordinat', esc(K.koord(C.lat[i], C.lon[i])) + '<small>' + [p, C.jl[i] ? K.n(C.jl[i]) + ' m di luar batas kawasan' : ''].filter(Boolean).join(', ') + '</small>');
    } else tambah('Koordinat', 'Tidak ada. Temuan ini tidak ikut peta dan model.');
    tambah('Resor', esc(Q.resor[C.res[i]] || 'Tidak tercatat'));
    tambah('Sel grid 1 km', C.g[i] ? esc(C.g[i]) : '');
    tambah('Petak atau titik', esc(C.plot[i]));
    tambah('Lokasi', esc(Q.lokasi[C.lok[i]]));
    tambah('Keterangan sumber', esc(C.atr[i]));
    tambah('Berkas sumber', esc(Q.berkas[C.bk[i]]) + '<small>' + esc(Q.lembar[C.lb[i]]) + ', baris ' + C.br[i] + '</small>');
    dlg.querySelector('#dmRinciJudul').innerHTML = esc(C.id[i]) + '<small>' + (x ? (x.i ? '<span class="ilmiah">' + esc(x.i) + '</span>' + (x.t === 'marga' ? ' sp.' : '') + (x.n ? ', ' + esc(x.n) : '') : esc(x.n)) : esc(ujung(C.eko[i]) || ujung(C.tut[i]) || 'Tipe ekosistem')) + '</small>';
    dlg.querySelector('#dmRinciIsi').innerHTML = '<dl class="fakta">' + f.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>' +
      (x ? '<p class="rinci-aksi"><a class="tombol" href="#/jenis/' + encodeURIComponent(x.tid) + '">Buka halaman ' + (x.t === 'jenis' ? 'jenis' : 'takson') + ' ini</a></p>' : '');
    akar.kembali = tombol;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    dlg.querySelector('.rinci-isi').scrollTop = 0;
  }

  /* ================= TEMUAN PER KATEGORI ================= */
  function namaSel(i) {
    var T = K.T, C = T.C, x = C.t[i] >= 0 ? T.taksa[C.t[i]] : null;
    if (!x) {
      var e = ujung(C.eko[i]), t = ujung(C.tut[i]);
      if (!e && !t) return '<span class="redup">-</span>';
      return esc(e || t) + '<small>' + (e ? 'tipe ekosistem' + (t ? ', tutupan ' + esc(t.toLowerCase()) : '') : 'tutupan lahan') + '</small>';
    }
    var kecil = x.t === 'jenis' ? (x.n || (x.l && x.l[0]) || '') : TINGKAT[x.t];
    return '<a href="#/jenis/' + encodeURIComponent(x.tid) + '">' + K.namaTakson(x) + '</a>' + (kecil ? '<small>' + esc(kecil) + '</small>' : '');
  }
  function koordSel(i) {
    var C = K.T.C;
    if (C.lat[i] === null) return '<span class="redup">tanpa koordinat</span>';
    /* jenis posisi (pengamat, objek, petak) ada di rincian dan unduhan supaya baris tabel tetap pendek */
    return koordHtml(C.lat[i], C.lon[i]) + (C.jl[i] ? '<small>' + K.n(C.jl[i]) + ' m di luar batas</small>' : '');
  }
  function kolomCsvTemuan() {
    var T = K.T, C = T.C, Q = T.Q;
    function tk(i) { return C.t[i] >= 0 ? T.taksa[C.t[i]] : null; }
    function k(judul, f) { return { judul: judul, nilai: f }; }
    return [
      k('ID', function (i) { return C.id[i]; }), k('Sumber', function (i) { return Q.sumber[C.s[i]]; }), k('Kegiatan', function (i) { return Q.kegiatan[C.k[i]]; }),
      k('Tanggal', function (i) { return C.tgl[i]; }), k('Tahun', function (i) { return C.th[i]; }), k('Kategori', function (i) { return Q.kategori[C.kat[i]]; }),
      k('Nama ilmiah', function (i) { var x = tk(i); return x && (x.t === 'jenis' || x.t === 'marga') ? x.i + (x.t === 'marga' ? ' sp.' : '') : ''; }),
      k('Nama Indonesia', function (i) { var x = tk(i); return x ? x.n : ''; }), k('Nama lokal', function (i) { return C.nl[i]; }),
      k('Tingkat identifikasi', function (i) { var x = tk(i); return x ? x.t : ''; }), k('Nama di sumber', function (i) { return C.ns[i]; }),
      k('Cara penyeragaman nama', function (i) { return Q.cara[C.cn[i]]; }), k('Catatan', function (i) { return C.ctn[i]; }),
      k('Jumlah', function (i) { return C.j[i]; }), k('Satuan', function (i) { return Q.satuan[C.sat[i]]; }), k('Jenis temuan', function (i) { return Q.temuan[C.jt[i]]; }),
      k('Tingkat tumbuh', function (i) { return C.tt[i]; }), k('Tipe ekosistem', function (i) { return C.eko[i]; }), k('Tutupan lahan', function (i) { return C.tut[i]; }),
      k('Bujur', function (i) { return C.lon[i]; }), k('Lintang', function (i) { return C.lat[i]; }), k('Posisi koordinat', function (i) { return Q.posisi[C.pos[i]]; }),
      k('Jarak di luar kawasan (m)', function (i) { return C.jl[i]; }), k('Resor', function (i) { return Q.resor[C.res[i]]; }), k('Grid 1 km', function (i) { return C.g[i]; }),
      k('Petak atau titik', function (i) { return C.plot[i]; }), k('Lokasi', function (i) { return Q.lokasi[C.lok[i]]; }), k('Keterangan sumber', function (i) { return C.atr[i]; }),
      k('Berkas sumber', function (i) { return Q.berkas[C.bk[i]]; }), k('Lembar atau tabel', function (i) { return Q.lembar[C.lb[i]]; }), k('Baris', function (i) { return C.br[i]; })
    ];
  }

  function subTemuan(w, kegAwal) {
    var T = K.T, C = T.C, Q = T.Q, n = T.n, D = siap(), i;
    var hitKat = {}, adaTahun = {}, hitRes = {}, hitKeg = {};
    for (i = 0; i < n; i++) {
      hitKat[C.kat[i]] = (hitKat[C.kat[i]] || 0) + 1; adaTahun[C.th[i]] = 1;
      hitRes[C.res[i]] = (hitRes[C.res[i]] || 0) + 1; hitKeg[C.k[i]] = (hitKeg[C.k[i]] || 0) + 1;
    }
    var thn = Object.keys(adaTahun).map(Number).filter(Boolean).sort(function (a, b) { return b - a; });
    var resor = Object.keys(hitRes).map(Number).sort(function (a, b) { return (Q.resor[a] ? 0 : 1) - (Q.resor[b] ? 0 : 1) || String(Q.resor[a]).localeCompare(String(Q.resor[b]), 'id'); });
    var perTh = {}, urutTh = [];
    T.keg.forEach(function (k) {
      var j = Q.kegiatan.indexOf(k.id);
      if (j < 0 || !hitKeg[j]) return;
      if (!perTh[k.tahun]) { perTh[k.tahun] = []; urutTh.push(k.tahun); }
      perTh[k.tahun].push(opsi(j, k.judul, hitKeg[j]));
    });
    var kegJ = kegAwal ? Q.kegiatan.indexOf(kegAwal) : -1;
    var kats = Q.kategori.map(function (k, j) { return j; }).filter(function (j) { return hitKat[j]; });

    w.innerHTML = '<section class="bagian bagian--rapat" aria-labelledby="j-dt">' + kepalaSub('j-dt', 'Temuan per kategori',
      '<p>Kategori mengikuti daftar dan register kehati TN Tambora: burung, mamalia, flora, anggrek, dan tipe ekosistem. Reptil, serangga, dan satwa lain masuk Fauna lain. Nama ilmiah dan nama Indonesia sudah diseragamkan, sedangkan nama di sumber ditampilkan apa adanya supaya bisa dicocokkan lagi dengan laporannya. Klik ID temuan untuk melihat seluruh isiannya, termasuk berkas, lembar, dan baris sumbernya.</p>') +
      '<form class="saring" id="dtSaring" aria-label="Saring temuan">' +
      '<fieldset class="pilih-deret"><legend>Kategori</legend><label class="pilih"><input type="radio" name="kat" value="" checked>Semua <b>' + K.n(n) + '</b></label>' +
      kats.map(function (j) { return '<label class="pilih"><input type="radio" name="kat" value="' + j + '">' + esc(K.NAMA_KAT[Q.kategori[j]] || Q.kategori[j]) + ' <b>' + K.n(hitKat[j]) + '</b></label>'; }).join('') + '</fieldset>' +
      '<div class="isian isian--lebar"><label for="dtCari">Cari nama, ID, atau petak</label><input id="dtCari" type="search" autocomplete="off" placeholder="Misalnya Rusa timorensis atau EF 03"></div>' +
      '<div class="isian"><label for="dtSumber">Sumber</label><select id="dtSumber"><option value="">Semua sumber</option>' + Q.sumber.map(function (s, j) { return opsi(j, sumberLabel(s)); }).join('') + '</select></div>' +
      '<div class="isian"><label for="dtTahun">Tahun</label><select id="dtTahun"><option value="">Semua tahun</option>' + thn.map(function (y) { return opsi(y, String(y)); }).join('') + '</select></div>' +
      '<div class="isian"><label for="dtResor">Resor</label><select id="dtResor"><option value="">Semua resor</option>' + resor.map(function (j) { return opsi(j, Q.resor[j] || 'Resor tidak tercatat', hitRes[j]); }).join('') + '</select></div>' +
      '<div class="isian isian--lebar"><label for="dtKeg">Kegiatan</label><select id="dtKeg"><option value="">Semua kegiatan</option>' +
      urutTh.map(function (y) { return '<optgroup label="' + y + '">' + perTh[y].join('') + '</optgroup>'; }).join('') + '</select></div>' +
      '<div class="isian"><label for="dtTingkat">Identifikasi</label><select id="dtTingkat"><option value="">Semua tingkat</option><option value="jenis">Sampai jenis</option><option value="marga">Sampai marga</option><option value="nama lokal">Nama lokal saja</option><option value="kelompok">Kelompok saja</option></select></div>' +
      '<div class="isian"><label for="dtKoord">Koordinat</label><select id="dtKoord"><option value="">Semua temuan</option><option value="ada">Berkoordinat</option><option value="tanpa">Tanpa koordinat</option></select></div>' +
      '<div class="saring-aksi"><button type="button" class="tombol tombol--hantu" id="dtReset">Hapus saringan</button></div>' +
      '<p class="saring-hasil" id="dtHasil" role="status"></p></form>' +
      '<div id="dtTabel"></div><div class="tabel-alat" id="dtAlat"></div></section>';

    var tb = K.tabel({
      label: 'Temuan terkurasi', perHal: 25, urut: { id: 'tgl', turun: true }, baris: [], kolom: [
        { id: 'id', judul: 'ID', nilai: function (i) { return C.id[i]; }, kelas: 'sempit',
          isi: function (i) { return '<button type="button" class="teks-tautan" data-rinci="' + i + '" aria-haspopup="dialog">' + esc(C.id[i]) + '</button><small>' + esc(Q.sumber[C.s[i]] === 'SMART' ? 'SMART Patrol' : Q.kegiatan[C.k[i]]) + '</small>'; } },
        { id: 'tgl', judul: 'Tanggal', nilai: function (i) { return C.tgl[i] || String(C.th[i]); }, kelas: 'sempit',
          isi: function (i) { return C.tgl[i] ? esc(K.tgl(C.tgl[i])) : C.th[i] + '<small>tanggal tidak tercatat</small>'; } },
        { id: 'nama', judul: 'Nama', nilai: function (i) { return D.urutNama[i]; }, isi: namaSel, kelas: 'sedang' },
        { id: 'ns', judul: 'Nama di sumber', nilai: function (i) { return C.ns[i]; }, isi: function (i) { return C.ns[i] ? esc(C.ns[i]) : '<span class="redup">-</span>'; }, kelas: 'sedang' },
        { id: 'j', judul: 'Jumlah', n: true, nilai: function (i) { return C.j[i]; },
          isi: function (i) { return C.j[i] === null ? '' : K.nd(C.j[i], 1) + (Q.satuan[C.sat[i]] ? '<small>' + esc(Q.satuan[C.sat[i]]) + '</small>' : ''); } },
        { id: 'jt', judul: 'Jenis temuan', nilai: function (i) { return Q.temuan[C.jt[i]]; }, isi: function (i) { return esc(Q.temuan[C.jt[i]]) + (C.tt[i] ? '<small>tingkat ' + esc(C.tt[i]) + '</small>' : ''); } },
        { id: 'res', judul: 'Resor dan petak', nilai: function (i) { return Q.resor[C.res[i]]; },
          isi: function (i) { var r = Q.resor[C.res[i]], p = [C.plot[i], Q.lokasi[C.lok[i]]].filter(Boolean).join(' · '); return (r ? esc(r) : '<span class="redup">tidak tercatat</span>') + (p ? '<small>' + esc(p) + '</small>' : ''); } },
        { id: 'lat', judul: 'Koordinat', nilai: function (i) { return C.lat[i]; }, isi: koordSel, kelas: 'sempit' }
      ]
    });
    w.querySelector('#dtTabel').appendChild(tb.el);
    w.querySelector('#dtAlat').appendChild(K.unduhan('Unduh temuan yang tampil (CSV)', 'temuan-kehati-tn-tambora', function () { return { baris: tb.baris(), kolom: kolomCsvTemuan() }; }));

    var form = w.querySelector('#dtSaring'), hasil = w.querySelector('#dtHasil'), elKeg = form.querySelector('#dtKeg'), catatan = '';
    if (kegJ >= 0 && hitKeg[kegJ]) elKeg.value = String(kegJ);
    else if (kegAwal) catatan = 'Kegiatan ' + kegAwal + ' tidak punya temuan yang lolos kurasi, jadi semua temuan ditampilkan. ';
    function v(id) { return form.querySelector(id).value; }
    function terapkan() {
      var kat = form.querySelector('input[name="kat"]:checked').value, s = v('#dtSumber'), th = v('#dtTahun'), r = v('#dtResor'), kg = v('#dtKeg'), tk = v('#dtTingkat'), ko = v('#dtKoord');
      var kk = kata(v('#dtCari')), out = [], tanpa = 0, j;
      var adaSaring = kat !== '' || s !== '' || th || r !== '' || kg !== '' || tk || ko || kk.length;
      for (j = 0; j < n; j++) {
        if (kat !== '' && C.kat[j] !== +kat) continue;
        if (s !== '' && C.s[j] !== +s) continue;
        if (th && C.th[j] !== +th) continue;
        if (r !== '' && C.res[j] !== +r) continue;
        if (kg !== '' && C.k[j] !== +kg) continue;
        if (tk && (C.t[j] < 0 || T.taksa[C.t[j]].t !== tk)) continue;
        if (ko === 'ada' && C.lat[j] === null) continue;
        if (ko === 'tanpa' && C.lat[j] !== null) continue;
        if (kk.length && !cocok(D.cari[j], kk)) continue;
        out.push(j);
        if (C.lat[j] === null) tanpa++;
      }
      tb.setel(out);
      hasil.innerHTML = esc(catatan) + (!out.length ? '<b>Tidak ada temuan yang cocok.</b> Longgarkan saringan atau ubah kata pencarian.'
        : (adaSaring ? '<b>' + K.n(out.length) + ' temuan</b> cocok dengan saringan' : 'Semua <b>' + K.n(out.length) + ' temuan</b> tampil') +
          (tanpa ? ', ' + K.n(tanpa) + ' di antaranya tanpa koordinat.' : '.'));
    }
    var cariTunda = tunda(terapkan, 160);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('input', function (e) { if (e.target.id === 'dtCari') cariTunda(); });
    form.addEventListener('change', function (e) {
      if (e.target.id === 'dtCari') return;
      if (e.target === elKeg) { catatan = ''; history.replaceState(null, '', elKeg.value === '' ? '#/data' : '#/data/temuan/' + encodeURIComponent(Q.kegiatan[+elKeg.value])); }
      terapkan();
    });
    form.querySelector('#dtReset').addEventListener('click', function () {
      form.reset(); catatan = '';
      if (location.hash !== '#/data') history.replaceState(null, '', '#/data');
      terapkan();
    });
    w.querySelector('#dtTabel').addEventListener('click', function (e) { var b = e.target.closest('[data-rinci]'); if (b) bukaRinci(+b.getAttribute('data-rinci'), b); });
    terapkan();
  }

  /* ================= REGISTER KEGIATAN ================= */
  function subKegiatan(w) {
    var T = K.T, R = akar.R, semua = T.keg;
    var lpk = semua.filter(function (k) { return k.kode !== 'SMART'; }), sm = semua.filter(function (k) { return k.kode === 'SMART'; })[0];
    var tanpa = lpk.filter(function (k) { return !k.n; }), perMetode = {}, perTahun = {}, metodeSemua = {}, resorSemua = {}, tahunSemua = {};
    lpk.forEach(function (k) { perMetode[k.metode] = (perMetode[k.metode] || 0) + 1; perTahun[k.tahun] = (perTahun[k.tahun] || 0) + 1; });
    semua.forEach(function (k) { metodeSemua[k.metode] = (metodeSemua[k.metode] || 0) + 1; resorSemua[k.resor || ''] = (resorSemua[k.resor || ''] || 0) + 1; tahunSemua[k.tahun] = 1; });
    var metode = Object.keys(perMetode).sort(function (a, b) { return perMetode[b] - perMetode[a] || a.localeCompare(b, 'id'); });
    var tahun = Object.keys(perTahun).sort();

    w.innerHTML = '<section class="bagian bagian--rapat" aria-labelledby="j-kg">' + kepalaSub('j-kg', 'Register kegiatan',
      '<p>' + K.n(lpk.length) + ' LPK teknis PEH ' + R.periode[0] + ' sampai ' + R.periode[1] + (sm ? ' dan temuan SMART Patrol ' + esc(rentangTgl(sm.mulai, sm.selesai)) : '') +
      '. Kode kegiatan dipakai di tabel temuan, baris dibuang, dan buku kerja. Klik angka di kolom Temuan atau Dibuang untuk membuka barisnya.</p>' +
      (tanpa.length ? '<p>' + K.n(tanpa.length) + ' LPK belum punya tabel temuan yang bisa dibaca, jadi tidak menyumbang temuan: ' + tanpa.map(function (k) { return esc(k.judul); }).join('; ') + '.</p>' : '')) +
      '<div class="kartu"><div class="dua-kolom kegiatan-batang">' +
      '<div><h3 class="kartu-judul">' + K.ikon.buku + 'LPK per metode<span class="kanan">' + K.n(lpk.length) + ' LPK</span></h3>' + K.batangDatar(metode.map(function (m) { return [m, perMetode[m], K.n(perMetode[m])]; }), 'LPK') + '</div>' +
      '<div><h3 class="kartu-judul">' + K.ikon.grafik + 'LPK per tahun</h3>' + K.batangDatar(tahun.map(function (y) { return [y, perTahun[y], K.n(perTahun[y])]; }), 'LPK') +
      '<p class="kartu-catatan">Jumlah LPK yang arsipnya terkumpul di folder Drive kehati, bukan jumlah semua kegiatan PEH pada tahun itu.</p></div>' +
      '</div></div>' +
      '<form class="saring" id="kgSaring" aria-label="Saring register kegiatan">' +
      '<div class="isian isian--lebar"><label for="kgCari">Cari</label><input id="kgCari" type="search" autocomplete="off" placeholder="Judul atau kode kegiatan"></div>' +
      '<div class="isian isian--lebar"><label for="kgMetode">Metode</label><select id="kgMetode"><option value="">Semua metode</option>' +
      Object.keys(metodeSemua).sort(function (a, b) { return a.localeCompare(b, 'id'); }).map(function (m) { return opsi(m, m, metodeSemua[m]); }).join('') + '</select></div>' +
      '<div class="isian"><label for="kgTahun">Tahun</label><select id="kgTahun"><option value="">Semua tahun</option>' +
      Object.keys(tahunSemua).sort().reverse().map(function (y) { return opsi(y, y); }).join('') + '</select></div>' +
      '<div class="isian"><label for="kgResor">Resor</label><select id="kgResor"><option value="">Semua resor</option>' +
      Object.keys(resorSemua).sort(function (a, b) { return a.localeCompare(b, 'id'); }).map(function (r) { return opsi(r, r || 'Resor tidak tercatat', resorSemua[r]); }).join('') + '</select></div>' +
      '<p class="saring-hasil" id="kgHasil" role="status"></p></form>' +
      '<div id="kgTabel" class="tabel-register"></div><div class="tabel-alat" id="kgAlat"></div></section>';

    var tb = K.tabel({
      label: 'Register kegiatan', perHal: 25, urut: { id: 'waktu', turun: true }, kepalaBaris: true, baris: [], kolom: [
        { id: 'judul', judul: 'Kegiatan', nilai: function (k) { return k.judul; }, isi: function (k) { return esc(k.judul) + '<small>' + esc(k.id) + '</small>'; } },
        { id: 'waktu', judul: 'Waktu', nilai: function (k) { return k.mulai || (k.tahun + '-' + (k.bulan ? ('0' + k.bulan).slice(-2) : '00')); }, isi: function (k) { return esc(waktuKeg(k)); }, kelas: 'sempit' },
        { id: 'n', judul: 'Temuan', n: true, tip: 'Temuan yang lolos kurasi', nilai: function (k) { return k.n; },
          isi: function (k) { return k.n ? '<a href="#/data/temuan/' + encodeURIComponent(k.id) + '" aria-label="' + esc(K.n(k.n) + ' temuan ' + k.judul) + '">' + K.n(k.n) + '</a>' : '0'; } },
        { id: 'nk', judul: 'Berkoordinat', n: true, nilai: function (k) { return k.nk; }, isi: function (k) { return K.n(k.nk); } },
        { id: 'nj', judul: 'Jenis', n: true, tip: 'Takson yang teridentifikasi sampai jenis', nilai: function (k) { return k.nj; }, isi: function (k) { return K.n(k.nj); } },
        { id: 'nb', judul: 'Dibuang', n: true, tip: 'Baris yang dibuang saat kurasi', nilai: function (k) { return k.nb; },
          isi: function (k) { return k.nb ? '<a href="#/data/dibuang/' + encodeURIComponent(k.id) + '" aria-label="' + esc(K.n(k.nb) + ' baris dibuang dari ' + k.judul) + '">' + K.n(k.nb) + '</a>' : '0'; } }
      ]
    });
    w.querySelector('#kgTabel').appendChild(tb.el);
    w.querySelector('#kgAlat').appendChild(K.unduhan('Unduh register yang tampil (CSV)', 'register-kegiatan-kehati-tn-tambora', function () {
      return { baris: tb.baris(), kolom: [
        { judul: 'ID kegiatan', nilai: function (k) { return k.id; } }, { judul: 'Tahun', nilai: function (k) { return k.tahun; } }, { judul: 'Bulan', nilai: function (k) { return k.bulan; } },
        { judul: 'Metode', nilai: function (k) { return k.metode; } }, { judul: 'Resor', nilai: function (k) { return k.resor; } }, { judul: 'Mulai', nilai: function (k) { return k.mulai; } },
        { judul: 'Selesai', nilai: function (k) { return k.selesai; } }, { judul: 'Judul', nilai: function (k) { return k.judul; } }, { judul: 'Temuan lolos kurasi', nilai: function (k) { return k.n; } },
        { judul: 'Temuan berkoordinat', nilai: function (k) { return k.nk; } }, { judul: 'Jenis', nilai: function (k) { return k.nj; } }, { judul: 'Baris dibuang', nilai: function (k) { return k.nb; } }] };
    }));
    var form = w.querySelector('#kgSaring'), hasil = w.querySelector('#kgHasil');
    function terapkan() {
      var kk = kata(form.querySelector('#kgCari').value), m = form.querySelector('#kgMetode').value, y = form.querySelector('#kgTahun').value, r = form.querySelector('#kgResor').value;
      var out = semua.filter(function (k) {
        if (m && k.metode !== m) return false;
        if (y && String(k.tahun) !== y) return false;
        if (form.querySelector('#kgResor').selectedIndex > 0 && (k.resor || '') !== r) return false;
        return !kk.length || cocok((k.judul + ' ' + k.id + ' ' + k.metode).toLowerCase(), kk);
      });
      tb.setel(out);
      hasil.innerHTML = out.length ? (out.length === semua.length ? 'Semua <b>' + K.n(out.length) + ' kegiatan</b> tampil.' : '<b>' + K.n(out.length) + ' kegiatan</b> cocok dengan saringan.')
        : '<b>Tidak ada kegiatan yang cocok.</b> Longgarkan saringan atau ubah kata pencarian.';
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('input', tunda(terapkan, 140));
    form.addEventListener('change', terapkan);
    terapkan();
  }

  /* ================= BARIS DIBUANG ================= */
  function alasanKe(teks) {
    for (var j = 0; j < ALASAN.length; j++) if (String(teks || '').indexOf(ALASAN[j][0]) === 0) return j;
    return -1;
  }
  function subDibuang(w, lanjut) {
    var R = akar.R;
    w.innerHTML = '<section class="bagian bagian--rapat" aria-labelledby="j-db">' + kepalaSub('j-db', 'Baris yang dibuang',
      '<p>' + K.n(R.dibuang) + ' dari ' + K.n(R.masuk) + ' baris tidak masuk tabel temuan. Setiap baris dicatat bersama berkas, lembar, dan nomor barisnya, jadi bisa dicek ulang ke sumbernya. Nama orang di kolom nama tidak ditampilkan.</p>') +
      '<div id="dbIsi"></div></section>';
    var el = w.querySelector('#dbIsi');
    K.memuat(el, 'Memuat baris yang dibuang…');
    K.ambil('buang.json').then(function (b) { if (el.isConnected) gambarDibuang(el, b, lanjut); })
      .catch(function (e) { if (el.isConnected) K.galat(el, e, function () { subDibuang(w, lanjut); }); });
  }
  function gambarDibuang(el, b, lanjut) {
    var T = K.T, ix = {}, j;
    b.kolom.forEach(function (k, n) { ix[k] = n; });
    var rows = b.baris.map(function (r, n) {
      var a = alasanKe(r[ix.alasan]);
      return { n: n, r: r, a: a, cari: [r[ix.nama], r[ix.berkas], r[ix.lembar], r[ix.kegiatan]].join(' ').toLowerCase() };
    });
    var hitA = {}, hitK = {}, hitS = {}, lain = {};
    rows.forEach(function (o) {
      var key = o.a >= 0 ? String(o.a) : 'x:' + o.r[ix.alasan];
      hitA[key] = (hitA[key] || 0) + 1; if (o.a < 0) lain[key] = o.r[ix.alasan];
      hitK[o.r[ix.kegiatan]] = (hitK[o.r[ix.kegiatan]] || 0) + 1; hitS[o.r[ix.sumber]] = (hitS[o.r[ix.sumber]] || 0) + 1;
    });
    var kunciA = Object.keys(hitA).sort(function (p, q) { return hitA[q] - hitA[p]; });
    function labelA(key) { return key.indexOf('x:') === 0 ? lain[key] : ALASAN[+key][1]; }
    function artiA(key) { return key.indexOf('x:') === 0 ? '' : ALASAN[+key][2]; }
    var kegs = Object.keys(hitK).sort(function (p, q) { var a = T.kegId[p], c = T.kegId[q]; return ((a && a.mulai) || p).localeCompare((c && c.mulai) || q); });
    var awalA = '', awalK = '';
    if (lanjut && /^alasan-\d+$/.test(lanjut) && hitA[lanjut.slice(7)]) awalA = lanjut.slice(7);
    else if (lanjut && hitK[lanjut]) awalK = lanjut;

    el.innerHTML = '<form class="saring" id="dbSaring" aria-label="Saring baris yang dibuang" style="margin-top:0">' +
      '<fieldset class="pilih-deret"><legend>Alasan</legend><label class="pilih"><input type="radio" name="al" value="" checked>Semua <b>' + K.n(rows.length) + '</b></label>' +
      kunciA.map(function (key) { return '<label class="pilih"><input type="radio" name="al" value="' + esc(key) + '">' + esc(labelA(key)) + ' <b>' + K.n(hitA[key]) + '</b></label>'; }).join('') + '</fieldset>' +
      '<p class="saring-arti" id="dbArti" aria-live="polite" hidden></p>' +
      '<div class="isian isian--lebar"><label for="dbCari">Cari</label><input id="dbCari" type="search" autocomplete="off" placeholder="Nama, berkas, atau kode kegiatan"></div>' +
      '<div class="isian isian--lebar"><label for="dbKeg">Kegiatan</label><select id="dbKeg"><option value="">Semua kegiatan</option>' +
      kegs.map(function (k) { return opsi(k, T.kegId[k] ? T.kegId[k].judul : k, hitK[k]); }).join('') + '</select></div>' +
      (Object.keys(hitS).length > 1 ? '<div class="isian"><label for="dbSumber">Sumber</label><select id="dbSumber"><option value="">Semua sumber</option>' +
        Object.keys(hitS).sort().map(function (s) { return opsi(s, sumberLabel(s), hitS[s]); }).join('') + '</select></div>' : '') +
      '<div class="saring-aksi"><button type="button" class="tombol tombol--hantu" id="dbReset">Hapus saringan</button></div>' +
      '<p class="saring-hasil" id="dbHasil" role="status"></p></form>' +
      '<div id="dbTabel"></div><div class="tabel-alat" id="dbAlat"></div>';

    var tb = K.tabel({
      label: 'Baris yang dibuang', perHal: 25, urut: { id: 'tgl', turun: true }, baris: [], kolom: [
        { id: 'nama', judul: 'Nama di sumber', nilai: function (o) { return o.r[ix.nama]; }, isi: function (o) { return o.r[ix.nama] ? esc(o.r[ix.nama]) : '<span class="redup">kosong</span>'; }, kelas: 'sedang' },
        { id: 'alasan', judul: 'Alasan', nilai: function (o) { return o.a >= 0 ? ALASAN[o.a][1] : o.r[ix.alasan]; }, isi: function (o) { return esc(o.a >= 0 ? ALASAN[o.a][1] : o.r[ix.alasan]); }, kelas: 'sedang' },
        { id: 'keg', judul: 'Kegiatan', nilai: function (o) { return o.r[ix.kegiatan]; }, isi: function (o) { return esc(o.r[ix.kegiatan]) + '<small>' + esc(sumberLabel(o.r[ix.sumber])) + '</small>'; }, kelas: 'sempit' },
        { id: 'tgl', judul: 'Tanggal', nilai: function (o) { return o.r[ix.tanggal]; }, isi: function (o) { return o.r[ix.tanggal] ? esc(K.tgl(o.r[ix.tanggal])) : '<span class="redup">-</span>'; }, kelas: 'sempit' },
        { id: 'koord', judul: 'Koordinat', nilai: function (o) { return o.r[ix.lat]; }, isi: function (o) { return o.r[ix.lat] === null || o.r[ix.lat] === undefined ? '<span class="redup">tanpa koordinat</span>' : koordHtml(o.r[ix.lat], o.r[ix.lon]); }, kelas: 'sempit' },
        { id: 'berkas', judul: 'Berkas sumber', nilai: function (o) { return o.r[ix.berkas]; }, kelas: 'lebar',
          isi: function (o) { var p = String(o.r[ix.berkas] || ''), k = p.lastIndexOf('/'); return '<span class="berkas">' + esc(p.slice(k + 1)) + '</span><small>' + (k > 0 ? esc(p.slice(0, k)) + ' · ' : '') + esc(o.r[ix.lembar] || '') + ', baris ' + esc(o.r[ix.baris]) + '</small>'; } }
      ]
    });
    el.querySelector('#dbTabel').appendChild(tb.el);
    el.querySelector('#dbAlat').appendChild(K.unduhan('Unduh baris yang tampil (CSV)', 'baris-dibuang-kehati-tn-tambora', function () {
      return { baris: tb.baris(), kolom: [['Sumber', 'sumber'], ['Kegiatan', 'kegiatan'], ['Berkas sumber', 'berkas'], ['Lembar atau tabel', 'lembar'], ['Baris', 'baris'], ['Nama di sumber', 'nama'],
        ['Bujur', 'lon'], ['Lintang', 'lat'], ['Tanggal', 'tanggal'], ['Alasan', 'alasan']].map(function (p) { return { judul: p[0], nilai: function (o) { return o.r[ix[p[1]]]; } }; }) };
    }));
    var form = el.querySelector('#dbSaring'), hasil = el.querySelector('#dbHasil'), arti = el.querySelector('#dbArti');
    if (awalA) form.querySelector('input[name="al"][value="' + awalA + '"]').checked = true;
    if (awalK) form.querySelector('#dbKeg').value = awalK;
    function terapkan() {
      var a = form.querySelector('input[name="al"]:checked').value, k = form.querySelector('#dbKeg').value, se = form.querySelector('#dbSumber'), s = se ? se.value : '';
      var kk = kata(form.querySelector('#dbCari').value);
      var out = rows.filter(function (o) {
        if (a && (o.a >= 0 ? String(o.a) : 'x:' + o.r[ix.alasan]) !== a) return false;
        if (k && o.r[ix.kegiatan] !== k) return false;
        if (s && o.r[ix.sumber] !== s) return false;
        return !kk.length || cocok(o.cari, kk);
      });
      tb.setel(out);
      var t = a ? artiA(a) : '';
      arti.hidden = !t; arti.textContent = t;
      hasil.innerHTML = out.length ? (out.length === rows.length ? 'Semua <b>' + K.n(out.length) + ' baris</b> tampil.' : '<b>' + K.n(out.length) + ' baris</b> cocok dengan saringan.')
        : '<b>Tidak ada baris yang cocok.</b> Longgarkan saringan atau ubah kata pencarian.';
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('input', function (e) { if (e.target.id === 'dbCari') cariTunda(); });
    form.addEventListener('change', function (e) {
      if (e.target.id === 'dbCari') return;
      var a = form.querySelector('input[name="al"]:checked').value, k = form.querySelector('#dbKeg').value;
      history.replaceState(null, '', '#/data/dibuang' + (a && a.indexOf('x:') < 0 ? '/alasan-' + a : (k ? '/' + encodeURIComponent(k) : '')));
      terapkan();
    });
    var cariTunda = tunda(terapkan, 160);
    form.querySelector('#dbReset').addEventListener('click', function () { form.reset(); history.replaceState(null, '', '#/data/dibuang'); terapkan(); });
    terapkan();
  }

  /* ================= NAMA PERLU DITINJAU ================= */
  function subNama(w) {
    w.innerHTML = '<section class="bagian bagian--rapat" aria-labelledby="j-nt">' + kepalaSub('j-nt', 'Nama yang perlu ditinjau',
      '<p>Nama di sumber yang tidak cocok persis dengan daftar rujukan, yaitu daftar induk kehati TN Tambora, kamus data model SMART, dan pasangan nama lokal dan nama ilmiah yang tercatat di tabel LPK. Nama itu diseragamkan lewat ejaan, nama lokal, atau marga, atau disimpan apa adanya bila belum bisa dibakukan. Periksa kolom Dipetakan ke. Koreksinya bisa dicatat di lembar Nama perlu tinjau pada buku kerja, lalu dipakai saat data diolah ulang.</p>') +
      '<div id="ntIsi"></div></section>';
    var el = w.querySelector('#ntIsi');
    K.memuat(el, 'Memuat daftar nama yang perlu ditinjau…');
    K.ambil('nama_tinjau.json').then(function (d) { if (el.isConnected) gambarNama(el, d); })
      .catch(function (e) { if (el.isConnected) K.galat(el, e, function () { subNama(w); }); });
  }
  function gambarNama(el, d) {
    var T = K.T, ix = {};
    d.kolom.forEach(function (k, n) { ix[k] = n; });
    var rows = d.baris.map(function (r) {
      var x = T.tid[r[ix.tid]] || null, c = CARA[r[ix.cara]], label = c ? c[0] : r[ix.cara];
      return { r: r, x: x, label: label, tingkat: x ? x.t : 'tidak',
        cari: [r[ix.ilmiah], r[ix.nama], r[ix.lokal], r[ix.catatan], r[ix.contoh], x ? [x.i, x.n].join(' ') : ''].join(' ').toLowerCase() };
    });
    var hitL = {}, artiL = {}, hitT = {};
    rows.forEach(function (o) { hitL[o.label] = (hitL[o.label] || 0) + 1; hitT[o.tingkat] = (hitT[o.tingkat] || 0) + 1; });
    Object.keys(CARA).forEach(function (k) { var c = CARA[k]; if (hitL[c[0]]) (artiL[c[0]] || (artiL[c[0]] = [])).indexOf(c[1]) < 0 && artiL[c[0]].push(c[1]); });
    var labels = Object.keys(hitL).sort(function (p, q) { return hitL[q] - hitL[p] || p.localeCompare(q, 'id'); });
    var TK = [['jenis', 'Ke jenis'], ['marga', 'Ke marga'], ['nama lokal', 'Ke nama lokal'], ['kelompok', 'Ke kelompok'], ['tidak', 'Tidak ada di data terkurasi']];

    el.innerHTML = '<details class="lipat" style="margin-top:0"><summary>Lihat arti setiap cara penyeragaman</summary><dl class="fakta arti-cara">' +
      labels.map(function (l) { return '<dt>' + esc(l) + '</dt><dd>' + (artiL[l] || []).map(esc).join(' ') + '</dd>'; }).join('') + '</dl></details>' +
      '<form class="saring" id="ntSaring" aria-label="Saring nama yang perlu ditinjau">' +
      '<div class="isian isian--lebar"><label for="ntCari">Cari</label><input id="ntCari" type="search" autocomplete="off" placeholder="Tulisan di sumber, nama ilmiah, atau catatan"></div>' +
      '<div class="isian isian--lebar"><label for="ntCara">Cara penyeragaman</label><select id="ntCara"><option value="">Semua cara</option>' +
      labels.map(function (l) { return opsi(l, l, hitL[l]); }).join('') + '</select></div>' +
      '<div class="isian"><label for="ntKe">Dipetakan</label><select id="ntKe"><option value="">Semua hasil</option>' +
      TK.filter(function (t) { return hitT[t[0]]; }).map(function (t) { return opsi(t[0], t[1], hitT[t[0]]); }).join('') + '</select></div>' +
      '<div class="saring-aksi"><button type="button" class="tombol tombol--hantu" id="ntReset">Hapus saringan</button></div>' +
      '<p class="saring-hasil" id="ntHasil" role="status"></p></form>' +
      '<div id="ntTabel"></div><div class="tabel-alat" id="ntAlat"></div>';

    var tb = K.tabel({
      label: 'Nama yang perlu ditinjau', perHal: 25, urut: { id: 'n', turun: true }, baris: [], kolom: [
        { id: 'nama', judul: 'Nama di sumber', nilai: function (o) { return o.r[ix.nama] || o.r[ix.lokal]; }, kelas: 'sedang',
          isi: function (o) { var nm = o.r[ix.nama], lk = o.r[ix.lokal]; return (nm || lk ? esc(nm || lk) : '<span class="redup">-</span>') + (nm && lk ? '<small>nama lokal: ' + esc(lk) + '</small>' : ''); } },
        { id: 'ilmiah', judul: 'Nama ilmiah di sumber', nilai: function (o) { return o.r[ix.ilmiah]; }, kelas: 'sedang',
          isi: function (o) { return o.r[ix.ilmiah] ? '<span class="ilmiah">' + esc(o.r[ix.ilmiah]) + '</span>' : '<span class="redup">-</span>'; } },
        { id: 'ke', judul: 'Dipetakan ke', nilai: function (o) { return o.x ? namaPolos(o.x).toLowerCase() : 'zzz'; }, kelas: 'sedang', tip: 'Takson yang semua barisnya dibuang saat kurasi tidak punya halaman',
          isi: function (o) { return o.x ? '<a href="#/jenis/' + encodeURIComponent(o.x.tid) + '">' + K.namaTakson(o.x) + '</a><small>' + esc(TINGKAT[o.x.t] || o.x.t) + (o.x.t === 'jenis' && o.x.n ? ', ' + esc(o.x.n) : '') + '</small>'
            : '<span class="redup">tidak ada di data terkurasi</span><small>semua barisnya dibuang saat kurasi</small>'; } },
        { id: 'cara', judul: 'Cara penyeragaman', nilai: function (o) { return o.label; }, isi: function (o) { return esc(o.label); }, kelas: 'sedang' },
        { id: 'n', judul: 'Baris di sumber', n: true, tip: 'Jumlah baris sumber yang memakai tulisan ini, dihitung sebelum kurasi', nilai: function (o) { return o.r[ix.n]; }, isi: function (o) { return K.n(o.r[ix.n]); } },
        { id: 'contoh', judul: 'Contoh kegiatan', nilai: function (o) { return o.r[ix.contoh]; }, isi: function (o) { return esc(o.r[ix.contoh]); }, kelas: 'sempit' },
        { id: 'catatan', judul: 'Catatan', nilai: function (o) { return o.r[ix.catatan]; }, isi: function (o) { return o.r[ix.catatan] ? esc(o.r[ix.catatan]) : ''; }, kelas: 'sedang' }
      ]
    });
    el.querySelector('#ntTabel').appendChild(tb.el);
    el.querySelector('#ntAlat').appendChild(K.unduhan('Unduh nama yang tampil (CSV)', 'nama-perlu-ditinjau-kehati-tn-tambora', function () {
      return { baris: tb.baris(), kolom: [
        { judul: 'Cara penyeragaman', nilai: function (o) { return o.r[ix.cara]; } }, { judul: 'Arti', nilai: function (o) { var c = CARA[o.r[ix.cara]]; return c ? c[1] : ''; } },
        { judul: 'Nama ilmiah di sumber', nilai: function (o) { return o.r[ix.ilmiah]; } }, { judul: 'Nama di sumber', nilai: function (o) { return o.r[ix.nama]; } },
        { judul: 'Nama lokal', nilai: function (o) { return o.r[ix.lokal]; } }, { judul: 'Dipetakan ke', nilai: function (o) { return o.x ? namaPolos(o.x) : ''; } },
        { judul: 'Tingkat', nilai: function (o) { return o.x ? o.x.t : ''; } }, { judul: 'Baris di sumber', nilai: function (o) { return o.r[ix.n]; } },
        { judul: 'Contoh kegiatan', nilai: function (o) { return o.r[ix.contoh]; } }, { judul: 'Catatan', nilai: function (o) { return o.r[ix.catatan]; } }] };
    }));
    var form = el.querySelector('#ntSaring'), hasil = el.querySelector('#ntHasil');
    function terapkan() {
      var c = form.querySelector('#ntCara').value, t = form.querySelector('#ntKe').value, kk = kata(form.querySelector('#ntCari').value);
      var out = rows.filter(function (o) { return (!c || o.label === c) && (!t || o.tingkat === t) && (!kk.length || cocok(o.cari, kk)); });
      tb.setel(out);
      hasil.innerHTML = out.length ? (out.length === rows.length ? 'Semua <b>' + K.n(out.length) + ' nama</b> tampil.' : '<b>' + K.n(out.length) + ' nama</b> cocok dengan saringan.')
        : '<b>Tidak ada nama yang cocok.</b> Longgarkan saringan atau ubah kata pencarian.';
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('input', tunda(terapkan, 140));
    form.addEventListener('change', terapkan);
    form.querySelector('#ntReset').addEventListener('click', function () { form.reset(); terapkan(); });
    terapkan();
  }

  K.rute.data = { judul: 'Data masuk', muat: muat, ubah: ubah, lepas: lepas };
})();
