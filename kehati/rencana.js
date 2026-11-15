/* Keanekaragaman Hayati · Perencanaan inventarisasi: sel grid 1 km yang belum terjamah dan urutan prioritasnya, jenis yang habitatnya
   sesuai di tiap sel menurut model, keterwakilan strata habitat, dugaan jumlah jenis yang belum tercatat (Chao2 dan Jackknife),
   dan jenis di daftar induk yang belum punya temuan. Data dari ../data/kehati/celah.json. */
(function () {
  'use strict';
  var K = window.KEHATI, esc = K.esc;
  var bersih = [];
  function lepas() { bersih.forEach(function (f) { try { f(); } catch (e) { /* peta sudah dilepas */ } }); bersih = []; }

  /* prioritas: satu rona emas, makin terang makin didahulukan (lolos uji jenjang pada latar gelap) */
  var PRIO = {
    1: { warna: '#f9eac6', alasan: 'Potensi model tinggi dan strata kurang terwakili' },
    2: { warna: '#d1b471', alasan: 'Potensi model tinggi' },
    3: { warna: '#ae7d00', alasan: 'Strata kurang terwakili' },
    4: { warna: '#7a4f00', alasan: 'Belum terjamah, tanpa alasan khusus' }
  };
  /* jumlah jenis (potensi model dan jenis tercatat): satu rona hijau, makin terang makin banyak */
  var HIJAU = ['#3a5e48', '#4a8a61', '#6fb980', '#b3e3af'];
  /* status survei: dua warna kategori yang lolos uji buta warna; sel yang belum pernah didatangi hanya bergaris */
  var STATUS = { terjamah: '#199e70', patroli: '#d95926' };
  var GARIS_KOSONG = '#eee8d5';
  var BATAS_TERCATAT = [1, 5, 15, 30];
  var SERI = { aves: { nama: 'Burung', warna: '#3987e5' }, flora: { nama: 'Tumbuhan', warna: '#199e70' } };
  var NAMA_GRUP = { aves: 'Burung', flora: 'Tumbuhan', mamalia: 'Mamalia', lain: 'Fauna lain' };
  var NAMA_KAT_INDUK = { Flora: 'Flora', Aves: 'Burung', Mamalia: 'Mamalia', Anggrek: 'Anggrek', Reptil: 'Reptil', Serangga: 'Serangga', Amfibi: 'Amfibi' };

  function gerakKurang() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function persentil(urut, p) {
    if (!urut.length) return null;
    var x = (urut.length - 1) * p, a = Math.floor(x), b = Math.ceil(x);
    return urut[a] + (urut[b] - urut[a]) * (x - a);
  }
  function hitungKat(daftar) { var m = {}; daftar.forEach(function (t) { m[t.kategori] = (m[t.kategori] || 0) + 1; }); return m; }
  function urutKat(m) { return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }); }
  function namaKat(k) { return NAMA_KAT_INDUK[k] || k; }
  function hurufBesar(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  /* ---------- data grid: baris dibuka menjadi objek, ditambah titik tengah dan daftar jenis yang sesuai ---------- */
  function siapkan(c, taksa) {
    var tid = {}; taksa.forEach(function (x) { tid[x.tid] = x; });
    var model = c.model_sesuai.map(function (t) { return tid[t] || { tid: t, i: t, t: 'jenis', k: '' }; });
    var indeks = {};
    var sel = c.grid.baris.map(function (b) {
      var o = {};
      c.grid.kolom.forEach(function (n, i) { o[n] = b[i]; });
      var lon = 0, lat = 0;
      o.ring.forEach(function (p) { lon += p[0]; lat += p[1]; });
      o.lon = lon / o.ring.length; o.lat = lat / o.ring.length;
      o.layak = o.luas_dalam_ha >= 25;
      o.jenis = o.aves + o.mamalia + o.flora + o.lain;
      o.sesuai = (o.sesuai || []).map(function (s) { return { x: model[s[0]], p: s[1] }; });
      o.cari = o.sesuai.map(function (s) { return [s.x.i, s.x.n, s.x.e].concat(s.x.l || []).join(' '); }).join(' ').toLowerCase();
      indeks[o.id] = o;
      return o;
    });
    var pot = sel.filter(function (o) { return o.layak && o.pot !== null; }).map(function (o) { return o.pot; }).sort(function (a, b) { return a - b; });
    /* kuartil atas diambil dari hasil olahan supaya sama persis dengan aturan prioritas */
    var kuartil = [persentil(pot, 0.25), persentil(pot, 0.5), c.ringkas.kuartil_atas_potensi];
    var nFlora = model.filter(function (x) { return x.k === 'Flora' || x.k === 'Anggrek'; }).length;
    return { sel: sel, indeks: indeks, kuartil: kuartil, model: model, nFlora: nFlora, nFauna: model.length - nFlora };
  }
  function namaStrata(c, o) {
    if (o.strata === null || o.strata === undefined) return '-';
    return c.nama_tutupan[o.strata % 10] + ' pada ' + c.nama_pita[Math.floor(o.strata / 10)];
  }
  function namaPendek(x) { return x.t === 'jenis' || x.t === 'marga' ? '<span class="ilmiah">' + esc(x.i) + '</span>' : esc(x.n || x.tid); }
  function tautTakson(x) { return '<a href="#/jenis/' + encodeURIComponent(x.tid) + '">' + K.namaTakson(x) + '</a>'; }

  /* ================= HALAMAN ================= */
  function muat(isi) {
    var g = K.giliran;
    K.memuat(isi, 'Memuat grid 1 km, potensi model, dan penduga jumlah jenis…');
    K.semua(['celah.json', 'batas.json', 'taksa.json']).then(function (h) {
      if (g !== K.giliran) return;
      gambar(isi, h[0], h[1], h[2]);
    }).catch(function (e) { if (g === K.giliran) K.galat(isi, e, K.muatUlang); });
  }

  function gambar(isi, c, batas, taksa) {
    var D = siapkan(c, taksa), rk = c.ringkas;
    var kaw = {}; c.penduga.forEach(function (p) { if (p.wilayah === 'Seluruh kawasan') kaw[p.grup] = p; });
    var luasDihitung = rk.luas_terjamah_ha + rk.luas_belum_ha;
    var strataPakai = c.strata.filter(function (s) { return s.bagian_luas >= 1; });
    var tk = c.taksa, katInduk = hitungKat(tk.induk_tanpa_temuan);
    function angka(label, nilai, sub) { return '<div class="angka"><div class="angka-label">' + label + '</div><div class="angka-nilai">' + nilai + '</div><div class="angka-sub">' + sub + '</div></div>'; }
    function dugaBelum(g) { var p = kaw[g]; return p && p.chao2 !== null ? Math.max(0, Math.round(p.chao2 - p.s_obs)) : null; }
    var resorOpsi = c.per_resor.map(function (r) { return '<option>' + esc(r.resor) + '</option>'; }).join('');
    var p12 = (+rk.prioritas['1'] || 0) + (+rk.prioritas['2'] || 0);

    var h = '<section class="bagian bagian--awal"><h1 class="judul-hal">Perencanaan inventarisasi potensi kawasan</h1>' +
      '<p class="lede">Kawasan dibagi menjadi <b>' + K.n(rk.sel) + ' sel grid 1 km</b>. Sebuah sel dihitung terjamah bila memuat paling sedikit satu temuan kehati berkoordinat atau dilewati jejak survei LPK. Dari ' + K.n(rk.sel_layak) +
      ' sel yang luasnya di dalam kawasan paling sedikit 25 ha, <b>' + K.n(rk.belum) + ' sel belum terjamah</b>. Halaman ini mengurutkan sel itu menurut potensi jenis dari model MaxEnt dan keterwakilan strata habitatnya, lalu menduga berapa jenis yang belum tercatat.</p>' +
      '<div class="angka-deret">' +
      angka('Sel belum terjamah', K.n(rk.belum), K.n(rk.luas_belum_ha) + ' ha, ' + K.n(100 * rk.luas_belum_ha / luasDihitung) + ' % dari luas sel yang dihitung') +
      angka('Sel prioritas 1 dan 2', K.n(p12), 'potensi jenis menurut model di kuartil atas, ' + K.n(+rk.prioritas['1'] || 0) + ' di antaranya juga di strata kurang terwakili') +
      angka('Strata kurang terwakili', K.n(rk.strata_kurang.length), 'dari ' + K.n(strataPakai.length) + ' strata elevasi dan tutupan seluas 1 % kawasan atau lebih') +
      (dugaBelum('aves') !== null ? angka('Jenis burung yang diduga belum tercatat', K.n(dugaBelum('aves')), 'dugaan Chao2 ' + K.n(kaw.aves.chao2) + ' jenis, ' + K.n(kaw.aves.s_obs) + ' tercatat berkoordinat') : '') +
      (dugaBelum('flora') !== null ? angka('Jenis tumbuhan yang diduga belum tercatat', K.n(dugaBelum('flora')), 'dugaan Chao2 ' + K.n(kaw.flora.chao2) + ' jenis, ' + K.n(kaw.flora.s_obs) + ' tercatat berkoordinat') : '') +
      angka('Jenis daftar induk tanpa temuan', K.n(tk.induk_tanpa_temuan.length), urutKat(katInduk).map(function (k) { return K.n(katInduk[k]) + ' ' + namaKat(k).toLowerCase(); }).join(', ')) +
      '</div></section>';

    /* 01 peta */
    var nJejak = D.sel.filter(function (o) { return o.layak && o.jejak && !o.n; }).length;
    h += '<section class="bagian" id="petaCelah" aria-labelledby="j-peta"><div class="bagian-kepala"><span class="bagian-no">01</span><h2 id="j-peta">Peta sel grid 1 km</h2>' +
      '<p>Pilih cara mewarnai sel. Klik sebuah sel untuk melihat elevasi, strata, potensi model, temuan, patroli, dan jenis yang habitatnya sesuai di sel itu. Sel yang luasnya di dalam kawasan kurang dari 25 ha tidak digambar.</p></div>' +
      '<form class="saring saring--baris" id="gcSaring" aria-label="Atur peta sel grid">' +
      '<fieldset class="pilih-deret"><legend>Warnai sel menurut</legend>' +
      [['prioritas', 'Prioritas survei'], ['status', 'Status survei'], ['potensi', 'Potensi jenis menurut model'], ['tercatat', 'Jenis tercatat']].map(function (p, j) {
        return '<label class="pilih"><input type="radio" name="mode" value="' + p[0] + '"' + (j === 0 ? ' checked' : '') + '>' + p[1] + '</label>';
      }).join('') + '</fieldset>' +
      '<div class="isian"><label for="gcResor">Resor</label><select id="gcResor"><option value="">Semua resor</option>' + resorOpsi + '</select></div>' +
      '<div class="isian isian--sempit"><label for="gcOpa">Kepekatan warna</label><input id="gcOpa" type="range" min="20" max="100" step="5" value="75"></div>' +
      '<p class="saring-hasil" id="gcHasil" role="status"></p></form>' +
      '<div class="peta-wadah"><div class="peta peta--besar" id="gcPeta" role="application" aria-label="Peta sel grid 1 km. Daftar sel yang sama ada di tabel bagian 02."></div><div class="peta-legenda" id="gcLegenda"></div></div>' +
      '<p class="peta-catatan">Sebanyak ' + K.n(nJejak) + ' sel terhitung terjamah karena dilewati jejak survei LPK walaupun belum punya temuan berkoordinat. Jalur patroli SMART ' + esc(K.tgl(rk.patroli_smart.dari)) + ' sampai ' + esc(K.tgl(rk.patroli_smart.sampai)) +
      ' tidak dihitung sebagai survei kehati, tetapi tampil pada pewarnaan Status survei.</p>' +
      '<h3 class="sub-kepala" style="margin-top:30px">Sel per resor</h3><div id="gcResorTabel"></div><p class="peta-catatan">Resor sebuah sel ditentukan dari titik tengahnya. Bagian belum terjamah dihitung dari luas sel di dalam kawasan.</p></section>';

    /* 02 daftar sel */
    h += '<section class="bagian" id="daftarSel" aria-labelledby="j-sel"><div class="bagian-kepala"><span class="bagian-no">02</span><h2 id="j-sel">Sel yang belum terjamah</h2>' +
      '<p>' + K.n(rk.belum) + ' sel diurutkan menurut prioritas, lalu menurut potensi jenis. Isi Jenis target untuk mencari sel yang habitatnya sesuai bagi jenis tertentu menurut ' + K.n(D.model.length) +
      ' model yang cukup andal. Jarak adalah jarak ke sel terjamah terdekat. Klik nomor sel untuk melihatnya di peta. Unduhan CSV memuat koordinat titik tengah untuk GPS, dan unduhan GeoJSON memuat batas sel untuk QGIS.</p></div>' +
      '<form class="saring" id="dsSaring" aria-label="Saring sel yang belum terjamah">' +
      '<fieldset class="pilih-deret"><legend>Prioritas</legend>' + [1, 2, 3, 4].map(function (p) {
        return '<label class="pilih"><input type="checkbox" name="p" value="' + p + '" checked><span class="tanda tanda--sel" style="background:' + PRIO[p].warna + '"></span>Prioritas ' + p + ' <b>' + K.n(+rk.prioritas[String(p)] || 0) + '</b></label>';
      }).join('') + '</fieldset>' +
      '<div class="isian isian--lebar"><label for="dsCari">Jenis target</label><input id="dsCari" type="search" autocomplete="off" list="dsJenis" placeholder="Misalnya Rusa timorensis atau Ficus">' +
      '<datalist id="dsJenis">' + D.model.slice().sort(function (a, b) { return String(a.i).localeCompare(String(b.i)); }).map(function (x) { return '<option value="' + esc(x.i) + '">' + esc(x.n || '') + '</option>'; }).join('') + '</datalist></div>' +
      '<div class="isian"><label for="dsResor">Resor</label><select id="dsResor"><option value="">Semua resor</option>' + resorOpsi + '</select></div>' +
      '<div class="isian"><label for="dsPatroli">Patroli SMART 2026</label><select id="dsPatroli"><option value="">Semua sel</option><option value="tanpa">Belum pernah dilewati patroli</option><option value="ada">Pernah dilewati patroli</option></select></div>' +
      '<div class="saring-aksi"><button type="button" class="tombol tombol--hantu" id="dsReset">Hapus saringan</button></div>' +
      '<p class="saring-hasil" id="dsHasil" role="status"></p></form><div id="dsTabel"></div><div class="tabel-alat" id="dsAlat"></div></section>';

    /* 03 strata */
    h += '<section class="bagian" id="strata" aria-labelledby="j-strata"><div class="bagian-kepala"><span class="bagian-no">03</span><h2 id="j-strata">Keterwakilan strata habitat</h2>' +
      '<p>Strata adalah gabungan pita elevasi dan kelompok tutupan lahan. Bila bagian upaya survei di suatu strata kurang dari setengah bagian luasnya, strata itu kurang terwakili dan sel belum terjamah di dalamnya naik prioritasnya. Upaya survei dihitung dari ' +
      K.n(rk.sel_upaya_50m) + ' sel 50 m yang memuat temuan berkoordinat.</p></div>' +
      '<div class="kartu strata">' + gambarStrata(c, strataPakai) + '</div></section>';

    /* 04 penduga */
    h += '<section class="bagian" id="penduga" aria-labelledby="j-penduga"><div class="bagian-kepala"><span class="bagian-no">04</span><h2 id="j-penduga">Jenis yang diduga belum tercatat</h2>' +
      '<p>Chao2 dan Jackknife orde satu menduga jumlah jenis dari banyaknya jenis yang hanya muncul di satu atau dua sel grid. Selisih dugaan dengan jumlah tercatat adalah perkiraan jenis yang belum tercatat. Kedua penduga ini batas bawah, jadi jumlah sebenarnya bisa lebih banyak. Yang dihitung hanya temuan berkoordinat yang teridentifikasi sampai jenis.</p></div>' +
      '<div class="fakta-deret">' + ['aves', 'flora', 'mamalia', 'lain'].map(function (g) {
        var p = kaw[g];
        if (!p) return '';
        if (p.s_obs < 10 || p.chao2 === null) return '<div><span>' + NAMA_GRUP[g] + '</span><b>' + K.n(p.s_obs) + ' <i>jenis tercatat</i></b><small>Terlalu sedikit jenis untuk diduga. Kelompok ini belum punya survei khusus.</small></div>';
        return '<div><span>' + NAMA_GRUP[g] + '</span><b>' + K.n(p.chao2) + ' <i>jenis menurut Chao2</i></b><small>' + K.n(p.s_obs) + ' tercatat, Jackknife ' + K.n(p.jack1) + ', kelengkapan ' + K.n(p.lengkap) + ' %</small></div>';
      }).join('') + '</div>' +
      '<div class="grid grid-2" style="margin-top:18px"><div class="kartu"><h3 class="kartu-judul">' + K.ikon.grafik + 'Kelengkapan inventarisasi per resor</h3>' +
      '<fieldset class="pilih-deret" id="pdGrup" style="margin-bottom:14px"><legend>Kelompok</legend>' + ['aves', 'flora'].map(function (g, j) {
        return '<label class="pilih"><input type="radio" name="pdg" value="' + g + '"' + (j === 0 ? ' checked' : '') + '>' + SERI[g].nama + '</label>';
      }).join('') + '</fieldset><div id="pdBatang" aria-live="polite"></div>' +
      '<p class="kartu-catatan">Kelengkapan adalah jumlah jenis tercatat dibagi dugaan Chao2. Resor dengan kelengkapan rendah paling mungkin memberi jenis baru bila disurvei lagi. Dugaan dari sedikit sel, misalnya kurang dari 15 sel, mudah berubah.</p></div>' +
      '<div class="kartu"><h3 class="kartu-judul">' + K.ikon.grafik + 'Jenis tercatat dari tahun ke tahun</h3><div id="pdAkumulasi"></div></div></div>' +
      '<details class="lipat"><summary>Lihat semua angka penduga per kelompok dan resor</summary><div id="pdTabel"></div></details></section>';

    /* 05 celah taksonomi */
    var lk5 = tk.lokasi_kurang_dari_5;
    h += '<section class="bagian" id="celahTakson" aria-labelledby="j-takson"><div class="bagian-kepala"><span class="bagian-no">05</span><h2 id="j-takson">Jenis yang perlu dicari atau ditambah lokasinya</h2>' +
      '<p>Daftar induk kehati TN Tambora memuat jenis yang pernah dilaporkan dari kawasan. Jenis yang belum punya temuan, yang tercatat tanpa koordinat, dan yang lokasinya kurang dari lima belum bisa dipetakan atau dimodelkan.</p></div>' +
      '<div class="grid grid-2">' +
      '<div class="kartu"><h3 class="kartu-judul">' + K.ikon.daun + 'Di daftar induk, belum punya temuan<span class="kanan">' + K.n(tk.induk_tanpa_temuan.length) + ' jenis</span></h3>' +
      K.batangDatar(urutKat(katInduk).map(function (k) { return [namaKat(k), katInduk[k], K.n(katInduk[k])]; }), 'jenis') +
      '<p class="kartu-catatan">Daftarnya ada di tabel di bawah. Jenis ini layak menjadi target pencarian pada survei berikutnya.</p></div>' +
      '<div class="kartu"><h3 class="kartu-judul">' + K.ikon.buku + 'Temuan yang teridentifikasi sampai jenis</h3><div id="ctTingkat"></div>' +
      '<p class="kartu-catatan">Temuan yang baru sampai marga, nama lokal, atau kelompok tidak ikut dihitung sebagai jenis dan tidak dimodelkan. Daftar namanya ada di <a href="#/data/nama">Data masuk</a> untuk ditinjau.</p></div>' +
      '<div class="kartu"><h3 class="kartu-judul">' + K.ikon.peta + 'Tercatat di kurang dari 5 lokasi<span class="kanan">' + K.n(lk5.jumlah) + ' jenis</span></h3>' +
      K.batangDatar(urutKat(lk5.per_kategori).map(function (k) { return [namaKat(k), lk5.per_kategori[k], K.n(lk5.per_kategori[k])]; }), 'jenis') +
      (lk5.penting.length ? '<h4 class="sub-judul">Dilindungi atau terancam</h4><ul class="daftar-takson">' + lk5.penting.map(function (t) {
        var xx = { tid: t.tid, i: t.ilmiah, t: 'jenis', p106: t.p106, iucn: t.iucn };
        return '<li>' + tautTakson(xx) + (t.nama ? ' <span class="redup">' + esc(t.nama) + '</span>' : '') + ' <span class="status-deret">' + K.lencanaStatus(xx) + '</span><span class="redup"> · ' + K.n(t.n_lokasi) + ' lokasi</span></li>';
      }).join('') + '</ul>' : '') +
      '<p class="kartu-catatan">Model sebaran baru dibuat mulai 5 lokasi unik. Mencatat koordinat setiap perjumpaan jenis ini akan membuatnya bisa dimodelkan.</p></div>' +
      '<div class="kartu"><h3 class="kartu-judul">' + K.ikon.info + 'Tercatat tanpa koordinat<span class="kanan">' + K.n(tk.induk_tanpa_koordinat.length) + ' jenis</span></h3>' +
      '<ul class="daftar-takson">' + tk.induk_tanpa_koordinat.map(function (t) {
        return '<li>' + tautTakson({ tid: t.tid, i: t.ilmiah, t: 'jenis' }) + (t.nama ? ' <span class="redup">' + esc(t.nama) + '</span>' : '') + '<span class="redup"> · ' + esc(namaKat(t.kategori)) + '</span></li>';
      }).join('') + '</ul><p class="kartu-catatan">Jenis dari daftar induk ini hanya muncul di daftar jenis laporan tanpa titik. Lokasinya perlu dicari ulang supaya bisa dipetakan.</p></div>' +
      '</div>' +
      '<h3 class="sub-kepala" style="margin-top:34px">Jenis di daftar induk yang belum punya temuan</h3>' +
      '<form class="saring" id="ctSaring" aria-label="Saring jenis daftar induk tanpa temuan" style="margin-top:0">' +
      '<div class="isian isian--lebar"><label for="ctCari">Cari nama ilmiah atau Indonesia</label><input id="ctCari" type="search" autocomplete="off" placeholder="Misalnya Dendrobium atau elang"></div>' +
      '<div class="isian"><label for="ctKat">Kelompok</label><select id="ctKat"><option value="">Semua kelompok</option>' + urutKat(katInduk).map(function (k) { return '<option value="' + esc(k) + '">' + esc(namaKat(k)) + '</option>'; }).join('') + '</select></div>' +
      '<p class="saring-hasil" id="ctHasil" role="status"></p></form><div id="ctTabel"></div><div class="tabel-alat" id="ctAlat"></div></section>';

    /* 06 metode */
    h += '<section class="bagian" aria-labelledby="j-metode"><div class="bagian-kepala"><span class="bagian-no">06</span><h2 id="j-metode">Cara menghitung dan batasannya</h2></div>' +
      '<div class="prosa kolom-2">' +
      '<p><b>Grid.</b> Grid 1 km diambil dari dashboard SMART Patrol (' + K.n(rk.sel) + ' sel). ' + K.n(rk.sel - rk.sel_layak) + ' sel yang luasnya di dalam kawasan kurang dari 25 ha tidak ikut dihitung.</p>' +
      '<p><b>Terjamah.</b> ' + esc(hurufBesar(c.aturan.terjamah)) + '. Sel yang hanya dilewati jalur patroli SMART tanpa temuan kehati tidak dihitung terjamah, karena patroli tidak bertujuan mencatat semua jenis yang dijumpai.</p>' +
      '<p><b>Potensi model.</b> Untuk tiap sel 50 m dihitung jumlah jenis yang habitatnya sesuai (di atas ambang P10) menurut ' + K.n(D.model.length) + ' model penuh dengan AUC uji 0,7 atau lebih. Potensi sel 1 km adalah rata-rata nilai itu. Daftar jenis di tiap sel memuat jenis yang habitatnya sesuai di paling sedikit separuh luas sel. Rujukan: <a href="#/kamus/potensi-tumpuk">peta jumlah jenis</a> dan <a href="#/kamus/ambang-p10">ambang P10</a>.</p>' +
      '<p><b>Prioritas.</b> Prioritas 1: potensi di kuartil atas (' + K.n(D.kuartil[2], 1) + ' jenis atau lebih) dan strata kurang terwakili. Prioritas 2: potensi di kuartil atas saja. Prioritas 3: strata kurang terwakili saja. Prioritas 4: sel belum terjamah lainnya. Rujukan: <a href="#/kamus/celah-survei">analisis celah survei</a>.</p>' +
      '<p><b>Penduga jenis.</b> Chao2 dan Jackknife orde satu memakai sel grid 1 km sebagai unit contoh. Rujukan: <a href="#/kamus/chao2">Chao2</a>, <a href="#/kamus/jackknife">Jackknife</a>, <a href="#/kamus/kelengkapan">kelengkapan inventarisasi</a>, dan <a href="#/kamus/akumulasi">kurva akumulasi jenis</a>.</p>' +
      '<ul><li>Jejak survei hanya tersedia untuk LPK yang menyertakan shapefile jalur. Sel yang pernah disurvei tanpa jejak dan tanpa temuan berkoordinat masih terhitung belum terjamah.</li>' +
      '<li>' + K.n(rk.temuan_di_luar_grid) + ' temuan berada di luar grid dan ' + K.n(rk.temuan_di_luar_raster) + ' temuan di luar cakupan data lanskap, sehingga tidak ikut dihitung di grid atau strata.</li>' +
      '<li>Potensi model hanya mewakili ' + K.n(D.model.length) + ' jenis yang modelnya cukup andal (' + K.n(D.nFlora) + ' tumbuhan dan ' + K.n(D.nFauna) + ' satwa). Sel dengan potensi rendah belum tentu miskin jenis.</li>' +
      '<li>Penduga jenis tidak bisa menduga kelompok yang belum pernah disurvei, misalnya kelelawar, reptil, amfibi, dan serangga.</li>' +
      '<li>Tutupan lahan berasal dari peta bahan bakar kebakaran, sehingga kelas hutan dan savana di sini tidak sama dengan peta vegetasi.</li></ul></div></section>';

    isi.innerHTML = h;
    var api = pasangPeta(isi, c, D, batas);
    pasangResor(isi, c);
    pasangDaftar(isi, c, D, api);
    pasangPenduga(isi, c);
    pasangTakson(isi, c);
  }

  /* ---------- 01 peta sel ---------- */
  function pasangPeta(isi, c, D, batas) {
    var elPeta = isi.querySelector('#gcPeta'), form = isi.querySelector('#gcSaring'), hasil = isi.querySelector('#gcHasil'), lg = isi.querySelector('#gcLegenda');
    var api = { tunjuk: function () { K.gulirKe(isi.querySelector('#petaCelah')); } };
    var layak = D.sel.filter(function (o) { return o.layak; });
    var mode = 'prioritas', resor = '', opa = 0.75;
    function kelasPot(v) { return v >= D.kuartil[2] ? 3 : (v >= D.kuartil[1] ? 2 : (v >= D.kuartil[0] ? 1 : 0)); }
    function kelasCatat(n) { for (var i = BATAS_TERCATAT.length - 1; i >= 0; i--) if (n >= BATAS_TERCATAT[i]) return i; return -1; }

    function ringkasHasil() {
      var s = resor ? layak.filter(function (o) { return o.resor === resor; }) : layak, awal = resor ? 'Resor ' + resor + ': ' : '';
      var tj = s.filter(function (o) { return o.terjamah; }).length, bl = s.length - tj;
      if (mode === 'prioritas') {
        var p = { 1: 0, 2: 0, 3: 0, 4: 0 }; s.forEach(function (o) { if (o.prioritas) p[o.prioritas]++; });
        return awal + K.n(bl) + ' sel belum terjamah diwarnai menurut prioritas (' + [1, 2, 3, 4].map(function (k) { return K.n(p[k]) + ' prioritas ' + k; }).join(', ') + '). ' + K.n(tj) + ' sel sudah terjamah hanya bergaris.';
      }
      if (mode === 'status') {
        var pt = s.filter(function (o) { return !o.terjamah && o.patroli_km > 0; }).length;
        return awal + K.n(tj) + ' sel terjamah, ' + K.n(pt) + ' sel belum terjamah tetapi pernah dilewati patroli SMART, dan ' + K.n(bl - pt) + ' sel belum pernah didatangi.';
      }
      if (mode === 'potensi') return awal + 'Nilai sel adalah rata-rata jumlah jenis yang habitatnya sesuai menurut ' + K.n(D.model.length) + ' model. Kuartil atas mulai ' + K.n(D.kuartil[2], 1) + ' jenis.';
      var ada = s.filter(function (o) { return o.jenis > 0; }), maks = ada.reduce(function (m, o) { return !m || o.jenis > m.jenis ? o : m; }, null);
      return awal + K.n(ada.length) + ' dari ' + K.n(s.length) + ' sel punya temuan yang teridentifikasi sampai jenis' + (maks ? '. Terbanyak ' + K.n(maks.jenis) + ' jenis di sel ' + esc(maks.id) + '.' : '.');
    }
    function legenda() {
      function kotak(w, t) { return '<span><i class="sel" style="background:' + w + '"></i>' + t + '</span>'; }
      function kosong(t) { return '<span><i class="sel sel-kosong"></i>' + t + '</span>'; }
      var x = '';
      if (mode === 'prioritas') x = '<div class="lg-grup"><b>Prioritas survei</b>' + [1, 2, 3, 4].map(function (p) { return kotak(PRIO[p].warna, p + ': ' + PRIO[p].alasan.toLowerCase()); }).join('') + kosong('sudah terjamah') + '</div>';
      else if (mode === 'status') x = '<div class="lg-grup"><b>Status survei</b>' + kotak(STATUS.terjamah, 'terjamah') + kotak(STATUS.patroli, 'belum terjamah, pernah dilewati patroli SMART') + kosong('belum pernah didatangi') + '</div>';
      else if (mode === 'potensi') {
        var q = D.kuartil;
        x = '<div class="lg-grup"><b>Potensi menurut model, jenis per sel</b>' + kotak(HIJAU[0], 'di bawah ' + K.n(q[0], 1)) + kotak(HIJAU[1], K.n(q[0], 1) + ' sampai ' + K.n(q[1], 1)) + kotak(HIJAU[2], K.n(q[1], 1) + ' sampai ' + K.n(q[2], 1)) + kotak(HIJAU[3], K.n(q[2], 1) + ' atau lebih (kuartil atas)') + '</div>';
      } else x = '<div class="lg-grup"><b>Jenis tercatat</b>' + kotak(HIJAU[0], '1 sampai 4') + kotak(HIJAU[1], '5 sampai 14') + kotak(HIJAU[2], '15 sampai 29') + kotak(HIJAU[3], '30 atau lebih') + kosong('belum ada temuan sampai jenis') + '</div>';
      lg.innerHTML = x + '<div class="lg-grup"><b>Batas</b><span><i class="batas" style="border-color:#f0cf7e"></i>Kawasan</span><span><i class="batas putus" style="border-color:#eee8d5"></i>Resor</span></div>';
    }
    function gaya(o) {
      var s = { color: '#0a140f', weight: 0.6, opacity: 0.6, fill: true, fillColor: '#000000', fillOpacity: 0 }, w = null;
      if (mode === 'prioritas') w = o.prioritas ? PRIO[o.prioritas].warna : null;
      else if (mode === 'status') w = o.terjamah ? STATUS.terjamah : (o.patroli_km > 0 ? STATUS.patroli : null);
      else if (mode === 'potensi') w = o.pot === null ? null : HIJAU[kelasPot(o.pot)];
      else { var k = kelasCatat(o.jenis); w = k < 0 ? null : HIJAU[k]; }
      if (w) { s.fillColor = w; s.fillOpacity = opa; }
      else if (mode !== 'potensi') { s.color = GARIS_KOSONG; s.opacity = 0.42; s.weight = 0.8; }
      if (resor && o.resor !== resor) { s.fillOpacity *= 0.18; s.opacity *= 0.3; }
      return s;
    }
    function isiPop(o) {
      function dd(a, b) { return '<dt>' + a + '</dt><dd>' + b + '</dd>'; }
      var status = o.terjamah ? 'Sudah terjamah' + (o.n ? '' : ' (dilewati jejak survei LPK, belum ada temuan berkoordinat)') : 'Belum terjamah, prioritas ' + o.prioritas + ': ' + PRIO[o.prioritas].alasan.toLowerCase();
      var h = '<b>Sel ' + esc(o.id) + '</b><div class="redup">' + (o.resor ? 'Resor ' + esc(o.resor) + ' · ' : '') + K.koord(o.lat, o.lon) + '</div>' +
        '<p class="pop-status">' + esc(status) + '</p><dl class="pop-fakta">' +
        dd('Di dalam kawasan', K.n(o.luas_dalam_ha) + ' ha') +
        dd('Elevasi rata-rata', o.elev === null ? '-' : K.n(o.elev) + ' m dpl') +
        dd('Strata', esc(namaStrata(c, o)) + (o.strata_kurang ? ', kurang terwakili' : '')) +
        dd('Tutupan kanopi', o.kanopi === null ? '-' : K.n(o.kanopi) + ' %') +
        dd('Potensi model', o.pot === null ? 'di luar cakupan model' : K.n(o.pot, 1) + ' jenis (satwa ' + K.n(o.pot_fauna, 1) + ', tumbuhan ' + K.n(o.pot_flora, 1) + ')') +
        (o.n ? dd('Temuan', K.n(o.n) + ' temuan dari ' + K.n(o.keg) + ' kegiatan, terakhir ' + (o.tahun_akhir || '-')) + dd('Jenis tercatat', K.n(o.jenis) + ' (burung ' + K.n(o.aves) + ', tumbuhan ' + K.n(o.flora) + ', mamalia ' + K.n(o.mamalia) + ', lain ' + K.n(o.lain) + ')') : '') +
        (o.terjamah ? '' : dd('Jarak ke sel terjamah', K.n(o.jarak_km, 1) + ' km')) +
        dd('Patroli SMART 2026', o.patroli_km > 0 ? K.n(o.patroli_km, 1) + ' km dalam ' + K.n(o.patroli_hari) + ' patroli' : 'tidak dilewati') + '</dl>';
      if (o.sesuai.length) {
        h += '<div class="pop-sub">Habitat sesuai menurut model: ' + K.n(o.sesuai.length) + ' jenis</div><ul class="pop-daftar pop-gulir" tabindex="0" aria-label="Jenis yang habitatnya sesuai di sel ' + esc(o.id) + '">' + o.sesuai.map(function (s) {
          return '<li>' + tautTakson(s.x) + (s.x.n ? ' <span class="redup">' + esc(s.x.n) + '</span>' : '') + '<span class="redup"> · ' + K.n(s.p) + ' % luas sel</span></li>';
        }).join('') + '</ul>';
      } else if (o.pot !== null) h += '<div class="pop-sub">Belum ada jenis yang habitatnya sesuai di separuh luas sel ini menurut model.</div>';
      return h;
    }

    if (!K.petaAda()) {
      K.petaGalat(elPeta);
      Array.prototype.forEach.call(form.querySelectorAll('input, select'), function (e) { e.disabled = true; });
      hasil.textContent = 'Peta tidak tersedia. Daftar sel ada di tabel bagian 02.';
      return api;
    }
    var L = window.L, peta = K.peta(elPeta, { batas: batas }), kanvas = L.canvas({ padding: 0.3, tolerance: 0 }), pilih = null;
    bersih.push(function () { peta.map.remove(); });
    var lapis = L.layerGroup().addTo(peta.map);
    layak.forEach(function (o) {
      var p = L.polygon(o.ring.map(function (q) { return [q[1], q[0]]; }), Object.assign({ renderer: kanvas }, gaya(o)));
      p.on('mouseover', function () { if (p !== pilih) p.setStyle({ color: '#ffffff', weight: 2, opacity: 1 }); });
      p.on('mouseout', function () { if (p !== pilih) p.setStyle(gaya(o)); });
      p.on('click', function (e) { buka(o, e.latlng); });
      o.p = p; lapis.addLayer(p);
    });
    function buka(o, latlng) {
      if (pilih && pilih !== o.p) pilih.setStyle(gaya(pilih.o));
      pilih = o.p; pilih.o = o;
      pilih.setStyle({ color: '#ffffff', weight: 3, opacity: 1 }); pilih.bringToFront();
      L.popup({ maxWidth: 340, minWidth: 260 }).setLatLng(latlng || [o.lat, o.lon]).setContent(isiPop(o)).openOn(peta.map);
    }
    peta.map.on('popupclose', function () { if (pilih) { var p = pilih; pilih = null; p.setStyle(gaya(p.o)); } });
    function gambarUlang() { layak.forEach(function (o) { if (o.p !== pilih) o.p.setStyle(gaya(o)); }); legenda(); hasil.textContent = ringkasHasil(); }
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'mode') { mode = e.target.value; gambarUlang(); }
      else if (e.target.id === 'gcResor') {
        resor = e.target.value; gambarUlang();
        var b = L.latLngBounds([]);
        layak.forEach(function (o) { if (!resor || o.resor === resor) b.extend(o.p.getBounds()); });
        if (b.isValid()) peta.map.fitBounds(b, { padding: [16, 16], animate: !gerakKurang() });
      }
    });
    form.querySelector('#gcOpa').addEventListener('input', function (e) { opa = +e.target.value / 100; gambarUlang(); });
    gambarUlang();
    api.tunjuk = function (id) {
      var o = D.indeks[id]; if (!o || !o.p) return;
      K.gulirKe(isi.querySelector('#petaCelah'));
      peta.map.setView([o.lat, o.lon], Math.max(peta.map.getZoom(), 13), { animate: !gerakKurang() });
      buka(o);
      elPeta.focus({ preventScroll: true });
    };
    return api;
  }

  /* ---------- tabel per resor ---------- */
  function pasangResor(isi, c) {
    function kol(id, judul, tip) { return { id: id, judul: judul, n: true, tip: tip, nilai: function (r) { return r[id]; }, isi: function (r) { return K.n(r[id]); } }; }
    var tb = K.tabel({ label: 'Sel per resor', perHal: 10, urut: { id: 'bag', turun: true }, kepalaBaris: true, baris: c.per_resor, kolom: [
      { id: 'resor', judul: 'Resor', nilai: function (r) { return r.resor; }, isi: function (r) { return esc(r.resor); } },
      kol('sel', 'Sel dihitung', 'Sel dengan paling sedikit 25 ha di dalam kawasan'), kol('terjamah', 'Terjamah'), kol('belum', 'Belum terjamah'),
      kol('p1', 'Prioritas 1'), kol('p2', 'Prioritas 2'), kol('p3', 'Prioritas 3'), kol('p4', 'Prioritas 4'),
      { id: 'luas_belum_ha', judul: 'Luas belum (ha)', n: true, nilai: function (r) { return r.luas_belum_ha; }, isi: function (r) { return K.n(r.luas_belum_ha); } },
      { id: 'bag', judul: 'Bagian belum', n: true, tip: 'Luas sel belum terjamah dibagi luas semua sel yang dihitung di resor ini', nilai: function (r) { return r.luas_ha ? r.luas_belum_ha / r.luas_ha : null; }, isi: function (r) { return r.luas_ha ? K.n(100 * r.luas_belum_ha / r.luas_ha) + ' %' : '-'; } }] });
    isi.querySelector('#gcResorTabel').appendChild(tb.el);
  }

  /* ---------- 02 daftar sel belum terjamah ---------- */
  function pasangDaftar(isi, c, D, api) {
    var form = isi.querySelector('#dsSaring'), hasil = isi.querySelector('#dsHasil'), cari = form.querySelector('#dsCari');
    var belum = D.sel.filter(function (o) { return o.layak && !o.terjamah && o.prioritas > 0; });
    var tb = K.tabel({ label: 'Sel yang belum terjamah', perHal: 15, urut: { id: 'pr', turun: false }, kepalaBaris: true, baris: belum,
      kosong: 'Tidak ada sel yang cocok dengan saringan. Jenis target hanya dicari di antara ' + K.n(D.model.length) + ' jenis yang modelnya cukup andal. Centang prioritas lain, ganti jenisnya, atau tekan Hapus saringan.',
      kolom: [
        { id: 'id', judul: 'Sel', nilai: function (o) { return +o.id; }, isi: function (o) { return '<button type="button" class="teks-tautan" data-sel="' + esc(o.id) + '" aria-label="Tampilkan sel ' + esc(o.id) + ' di peta">Sel ' + esc(o.id) + '</button><small>' + esc(o.resor || '-') + '</small>'; } },
        { id: 'pr', judul: 'Prioritas', tip: 'Diurutkan menurut prioritas, lalu potensi jenis', nilai: function (o) { return o.prioritas * 100 - (o.pot || 0); },
          isi: function (o) { return '<span class="prio"><i style="background:' + PRIO[o.prioritas].warna + '"></i>' + o.prioritas + '</span><small>' + esc(PRIO[o.prioritas].alasan) + '</small>'; }, kelas: 'sedang' },
        { id: 'pot', judul: 'Potensi (jenis)', n: true, tip: 'Rata-rata jumlah jenis yang habitatnya sesuai menurut model', nilai: function (o) { return o.pot; }, isi: function (o) { return o.pot === null ? '-' : K.n(o.pot, 1); } },
        { id: 'js', judul: 'Jenis dengan habitat sesuai', nilai: function (o) { return o.sesuai.length; }, kelas: 'sedang',
          isi: function (o) { return o.sesuai.length ? K.n(o.sesuai.length) + ' jenis<small>' + o.sesuai.slice(0, 3).map(function (s) { return namaPendek(s.x); }).join(', ') + (o.sesuai.length > 3 ? ', dan lainnya' : '') + '</small>' : '<span class="redup">-</span>'; } },
        { id: 'st', judul: 'Strata', nilai: function (o) { return o.strata; }, isi: function (o) { return o.strata === null ? '-' : esc(c.nama_tutupan[o.strata % 10]) + '<small>' + esc(c.nama_pita[Math.floor(o.strata / 10)]) + (o.strata_kurang ? ', kurang terwakili' : '') + '</small>'; }, kelas: 'sedang' },
        { id: 'el', judul: 'Elevasi (m)', n: true, nilai: function (o) { return o.elev; }, isi: function (o) { return o.elev === null ? '-' : K.n(o.elev); } },
        { id: 'jr', judul: 'Jarak (km)', n: true, tip: 'Jarak titik tengah sel ke titik tengah sel terjamah terdekat', nilai: function (o) { return o.jarak_km; }, isi: function (o) { return K.n(o.jarak_km, 1); } },
        { id: 'pk', judul: 'Patroli SMART (km)', n: true, nilai: function (o) { return o.patroli_km; }, isi: function (o) { return o.patroli_km > 0 ? K.n(o.patroli_km, 1) : '-'; } }
      ] });
    isi.querySelector('#dsTabel').appendChild(tb.el);
    tb.el.addEventListener('click', function (e) { var b = e.target.closest('button[data-sel]'); if (b) api.tunjuk(b.getAttribute('data-sel')); });
    function baca() {
      var p = {}; Array.prototype.forEach.call(form.querySelectorAll('input[name="p"]'), function (x) { p[x.value] = x.checked; });
      return { p: p, q: cari.value.trim().toLowerCase().split(/\s+/).filter(Boolean), resor: form.querySelector('#dsResor').value, patroli: form.querySelector('#dsPatroli').value };
    }
    function saring() {
      var f = baca();
      var b = belum.filter(function (o) {
        if (!f.p[o.prioritas]) return false;
        if (f.resor && o.resor !== f.resor) return false;
        if (f.patroli === 'tanpa' && o.patroli_km > 0) return false;
        if (f.patroli === 'ada' && !(o.patroli_km > 0)) return false;
        for (var j = 0; j < f.q.length; j++) if (o.cari.indexOf(f.q[j]) < 0) return false;
        return true;
      });
      tb.setel(b);
      hasil.textContent = K.n(b.length) + ' dari ' + K.n(belum.length) + ' sel belum terjamah tampil.';
      form.querySelector('#dsReset').disabled = !(f.q.length || f.resor || f.patroli || [1, 2, 3, 4].some(function (k) { return !f.p[k]; }));
    }
    var tunda;
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('change', function (e) { if (e.target !== cari) saring(); });
    cari.addEventListener('input', function () { clearTimeout(tunda); tunda = setTimeout(saring, 180); });
    form.querySelector('#dsReset').addEventListener('click', function () { form.reset(); saring(); cari.focus(); });
    saring();

    function teksSesuai(o) { return o.sesuai.map(function (s) { return (s.x.i || s.x.n) + ' (' + s.p + ' %)'; }).join(', '); }
    var KOLOM = [
      { judul: 'Sel', nilai: function (o) { return o.id; } }, { judul: 'Resor', nilai: function (o) { return o.resor; } },
      { judul: 'Prioritas', nilai: function (o) { return o.prioritas; } }, { judul: 'Alasan prioritas', nilai: function (o) { return PRIO[o.prioritas].alasan; } },
      { judul: 'Lintang tengah', nilai: function (o) { return +o.lat.toFixed(5); } }, { judul: 'Bujur tengah', nilai: function (o) { return +o.lon.toFixed(5); } },
      { judul: 'Potensi jenis model', nilai: function (o) { return o.pot; } }, { judul: 'Potensi satwa', nilai: function (o) { return o.pot_fauna; } }, { judul: 'Potensi tumbuhan', nilai: function (o) { return o.pot_flora; } },
      { judul: 'Jenis dengan habitat sesuai (bagian luas sel)', nilai: teksSesuai },
      { judul: 'Elevasi rata-rata (m)', nilai: function (o) { return o.elev; } }, { judul: 'Tutupan kanopi (%)', nilai: function (o) { return o.kanopi; } },
      { judul: 'Strata', nilai: function (o) { return namaStrata(c, o); } }, { judul: 'Strata kurang terwakili', nilai: function (o) { return o.strata_kurang ? 'ya' : 'tidak'; } },
      { judul: 'Luas di dalam kawasan (ha)', nilai: function (o) { return o.luas_dalam_ha; } }, { judul: 'Jarak ke sel terjamah (km)', nilai: function (o) { return o.jarak_km; } },
      { judul: 'Patroli SMART 2026 (km)', nilai: function (o) { return o.patroli_km; } }, { judul: 'Jumlah patroli SMART 2026', nilai: function (o) { return o.patroli_hari; } }
    ];
    var alat = isi.querySelector('#dsAlat');
    alat.appendChild(K.unduhan('Unduh sel yang tampil (CSV)', 'sel-belum-terjamah-tn-tambora', function () { return { baris: tb.baris(), kolom: KOLOM }; }));
    var gj = K.el('<div class="unduhan"><button type="button" class="tombol tombol--hantu">' + K.ikon.unduh + '<span>Unduh sel yang tampil (GeoJSON)</span></button><span class="unduhan-hasil kecil redup" role="status"></span></div>');
    gj.querySelector('button').addEventListener('click', function () {
      var b = tb.baris(), st = gj.querySelector('.unduhan-hasil');
      if (!b.length) { st.textContent = 'Tidak ada sel untuk diunduh. Longgarkan saringan dulu.'; return; }
      var fc = { type: 'FeatureCollection', features: b.map(function (o) {
        var cincin = o.ring.map(function (p) { return [p[0], p[1]]; }); cincin.push(cincin[0].slice());
        var sifat = {}; KOLOM.forEach(function (k) { sifat[k.judul] = k.nilai(o); });
        return { type: 'Feature', properties: sifat, geometry: { type: 'Polygon', coordinates: [cincin] } };
      }) };
      K.simpanBerkas('sel-belum-terjamah-tn-tambora.geojson', JSON.stringify(fc), 'application/geo+json');
      st.textContent = K.n(b.length) + ' sel diunduh.';
    });
    alat.appendChild(gj);
  }

  /* ---------- 03 strata: titik bagian luas dan bagian upaya pada satu sumbu ---------- */
  function gambarStrata(c, pakai) {
    var maks = Math.ceil(Math.max.apply(null, pakai.map(function (s) { return Math.max(s.bagian_luas, s.bagian_upaya); }).concat([5])) / 5) * 5;
    function x(v) { return Math.min(100, v / maks * 100); }
    var h = '<div class="legenda" style="margin:0 0 6px"><span><i class="bulat" style="background:var(--teks-3)"></i>Bagian luas kawasan</span><span><i class="bulat" style="background:var(--emas)"></i>Bagian upaya survei</span><span>Angka di kanan: upaya dibagi luas</span></div>';
    c.nama_pita.forEach(function (pita, i) {
      var baris = pakai.filter(function (s) { return Math.floor(s.kode / 10) === i; });
      if (!baris.length) return;
      h += '<h3 class="sub-judul">Elevasi ' + esc(pita) + '</h3><ul class="dumbel">' + baris.map(function (s) {
        var a = Math.min(x(s.bagian_luas), x(s.bagian_upaya)), b = Math.max(x(s.bagian_luas), x(s.bagian_upaya));
        var rinci = 'luas ' + K.n(s.bagian_luas, 1) + ' % kawasan (' + K.n(s.luas_ha) + ' ha), upaya ' + K.n(s.bagian_upaya, 1) + ' % (' + K.n(s.sel_upaya) + ' sel 50 m), rasio ' + K.n(s.rasio, 2);
        return '<li class="dumbel-baris" data-tip="' + esc(s.tutupan + ' pada ' + pita + '|' + rinci) + '"><span class="nm">' + esc(s.tutupan) + '</span>' +
          '<span class="dumbel-jalur" aria-hidden="true"><span class="rentang" style="left:' + a.toFixed(2) + '%;width:' + (b - a).toFixed(2) + '%"></span>' +
          '<span class="t t--lama" style="left:' + x(s.bagian_luas).toFixed(2) + '%"></span><span class="t t--baru" style="left:' + x(s.bagian_upaya).toFixed(2) + '%"></span></span>' +
          '<span class="nl"><span class="sr">Rasio </span>' + K.n(s.rasio, 2) + (s.kurang ? '<em>kurang terwakili</em>' : '') + '</span></li>';
      }).join('') + '</ul>';
    });
    /* di layar sempit hanya kelipatan 10 yang ditulis supaya label sumbu tidak bertumpuk */
    var tik = []; for (var t = 0; t <= maks; t += 5) tik.push('<span' + (t % 10 ? ' class="minor"' : '') + ' style="left:' + x(t).toFixed(2) + '%">' + t + ' %</span>');
    h += '<div class="dumbel-sumbu" aria-hidden="true"><span></span><div>' + tik.join('') + '</div><span></span></div>';
    h += '<p class="kartu-catatan">Strata yang luasnya kurang dari 1 % kawasan tidak digambar karena terlalu kecil untuk dinilai, tetapi tetap ada di tabel.</p>' +
      '<details class="lipat"><summary>Lihat angkanya sebagai tabel</summary><div class="tabel-wadah"><table><thead><tr><th scope="col">Elevasi</th><th scope="col">Tutupan lahan</th><th scope="col" class="n">Luas (ha)</th><th scope="col" class="n">Bagian luas</th><th scope="col" class="n">Sel 50 m bertemuan</th><th scope="col" class="n">Bagian upaya</th><th scope="col" class="n">Rasio</th><th scope="col">Keterangan</th></tr></thead><tbody>' +
      c.strata.map(function (s) {
        return '<tr><td>' + esc(s.pita) + '</td><th scope="row">' + esc(s.tutupan) + '</th><td class="n">' + K.n(s.luas_ha) + '</td><td class="n">' + K.n(s.bagian_luas, 1) + ' %</td><td class="n">' + K.n(s.sel_upaya) + '</td><td class="n">' + K.n(s.bagian_upaya, 1) + ' %</td><td class="n">' + (s.rasio === null ? '-' : K.n(s.rasio, 2)) + '</td><td>' +
          (s.kurang ? 'kurang terwakili' : (s.bagian_luas < 1 ? 'kurang dari 1 % kawasan' : '')) + '</td></tr>';
      }).join('') + '</tbody></table></div></details>';
    return h;
  }

  /* ---------- 04 penduga dan kurva akumulasi ---------- */
  /* lebar gambar mengikuti lebar wadah supaya huruf sumbu tidak ikut mengecil di kartu yang sempit */
  function grafikGaris(o) {
    var W = Math.max(280, Math.round(o.lebar || 720)), H = o.tinggi || 260, n = o.kategori.length, t, s;
    /* di kartu sempit label ujung garis diganti legenda saja, dan label tahun ditulis selang satu */
    var sempit = W < 440, kiri = 40, kanan = sempit ? 18 : 104, atas = 18, bawah = 30;
    var maks = Math.max.apply(null, o.seri.map(function (r) { return Math.max.apply(null, r.nilai); }).concat([1]));
    var langkah = K.langkahRapi(maks), puncak = Math.ceil(maks / langkah) * langkah, lebar = (W - kiri - kanan) / Math.max(1, n - 1);
    function x(i) { return kiri + lebar * i; }
    function y(v) { return atas + (H - atas - bawah) * (1 - v / puncak); }
    s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(o.label) + '">';
    for (t = 0; t <= puncak + 1e-9; t += langkah) {
      s += '<g class="kisi"><line x1="' + kiri + '" x2="' + (W - kanan + 12) + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '"/></g>' +
        '<g class="sumbu"><text x="' + (kiri - 8) + '" y="' + (y(t) + 4).toFixed(1) + '" text-anchor="end">' + K.n(t) + '</text></g>';
    }
    var selang = lebar < 38 ? 2 : 1;
    o.kategori.forEach(function (k, i) { if (i % selang && i !== n - 1) return; s += '<g class="sumbu"><text x="' + x(i).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + esc(k) + '</text></g>'; });
    /* label ujung digeser bila dua garis berakhir terlalu dekat */
    var ujung = o.seri.map(function (r) { return { r: r, y: y(r.nilai[n - 1]) }; }).sort(function (a, b) { return a.y - b.y; });
    for (var j = 1; j < ujung.length; j++) if (ujung[j].y - ujung[j - 1].y < 16) ujung[j].y = ujung[j - 1].y + 16;
    o.seri.forEach(function (r) {
      s += '<path class="garis-seri" style="stroke:' + r.warna + '" d="' + r.nilai.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join('') + '"/>';
      r.nilai.forEach(function (v, i) { s += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="4" fill="' + r.warna + '"/>'; });
    });
    if (!sempit) ujung.forEach(function (u) { s += '<text class="label-seri" x="' + (x(n - 1) + 12).toFixed(1) + '" y="' + (u.y + 4).toFixed(1) + '">' + esc(u.r.nama) + ' ' + K.n(u.r.nilai[n - 1]) + '</text>'; });
    o.kategori.forEach(function (k, i) {
      var rinci = o.seri.map(function (r) { return r.nama + ' ' + K.n(r.nilai[i]) + (r.baru ? ' (' + K.n(r.baru[i]) + ' baru)' : ''); }).join(', ');
      var x0 = Math.max(kiri - 20, x(i) - lebar / 2), x1 = Math.min(W - kanan + 20, x(i) + lebar / 2);
      s += '<g class="titik-th"><line class="silang" x1="' + x(i).toFixed(1) + '" x2="' + x(i).toFixed(1) + '" y1="' + atas + '" y2="' + (H - bawah) + '"/>' +
        '<rect class="hit" tabindex="0" role="img" aria-label="' + esc(k + ': ' + rinci) + '" data-tip="' + esc(k + '|' + rinci) + '" x="' + x0.toFixed(1) + '" y="' + atas + '" width="' + (x1 - x0).toFixed(1) + '" height="' + (H - atas - bawah) + '"/></g>';
    });
    s += '</svg>';
    var legenda = '<div class="legenda">' + o.seri.map(function (r) { return '<span><i class="garis-datar" style="background:' + r.warna + '"></i>' + esc(r.nama) + (sempit ? ' ' + K.n(r.nilai[n - 1]) : '') + '</span>'; }).join('') + '</div>';
    return '<div class="grafik">' + s + '</div>' + legenda;
  }

  function pasangPenduga(isi, c) {
    var form = isi.querySelector('#pdGrup'), wadah = isi.querySelector('#pdBatang');
    function batang() {
      var g = form.querySelector('input:checked').value;
      var baris = c.penduga.filter(function (p) { return p.grup === g && p.wilayah !== 'Seluruh kawasan'; }).sort(function (a, b) {
        return (a.lengkap === null ? 999 : a.lengkap) - (b.lengkap === null ? 999 : b.lengkap);
      });
      wadah.innerHTML = K.batangDatar(baris.map(function (p) {
        return [p.wilayah, p.lengkap || 0, p.lengkap === null ? 'belum bisa diduga' : K.n(p.lengkap) + ' %'];
      }), '% kelengkapan, ' + SERI[g].nama.toLowerCase()) +
        '<p class="kartu-catatan">' + baris.map(function (p) { return esc(p.wilayah) + ' ' + K.n(p.s_obs) + ' dari dugaan ' + (p.chao2 === null ? '-' : K.n(p.chao2)) + ' jenis (' + K.n(p.m) + ' sel)'; }).join('; ') + '.</p>';
    }
    form.addEventListener('change', batang);
    batang();

    var ak = c.akumulasi, th = ak.aves.map(function (r) { return r[0]; });
    function deret(g) { return ak[g].map(function (r) { return r[1]; }); }
    function baru(g) { return ak[g].map(function (r) { return r[2]; }); }
    var akhir = th[th.length - 1], elAk = isi.querySelector('#pdAkumulasi');
    function puncak(g) { var m = ak[g].reduce(function (a, r) { return r[2] > a[2] ? r : a; }, ak[g][0]); return m; }
    function garis() {
      return grafikGaris({ label: 'Jumlah jenis kumulatif per tahun, burung dan tumbuhan', kategori: th.map(String), tinggi: 250, lebar: elAk.clientWidth,
        seri: ['flora', 'aves'].map(function (g) { return { nama: SERI[g].nama, warna: SERI[g].warna, nilai: deret(g), baru: baru(g) }; }) });
    }
    elAk.innerHTML = '<div class="garis-wadah">' + garis() + '</div>' +
      '<details class="lipat"><summary>Lihat angkanya sebagai tabel</summary><div class="tabel-wadah"><table><thead><tr><th scope="col">Tahun</th>' +
      ['aves', 'flora', 'mamalia', 'lain'].map(function (g) { return '<th scope="col" class="n">' + NAMA_GRUP[g] + '</th><th scope="col" class="n">baru</th>'; }).join('') + '</tr></thead><tbody>' +
      th.map(function (t, i) { return '<tr><th scope="row">' + t + '</th>' + ['aves', 'flora', 'mamalia', 'lain'].map(function (g) { return '<td class="n">' + K.n(ak[g][i][1]) + '</td><td class="n">' + K.n(ak[g][i][2]) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div></details>' +
      '<p class="kartu-catatan">Semua temuan sampai tingkat jenis ikut dihitung, termasuk yang tanpa koordinat. Pada ' + akhir + ' masih tercatat ' + K.n(baru('aves')[th.length - 1]) + ' jenis burung baru dan ' + K.n(baru('flora')[th.length - 1]) +
      ' jenis tumbuhan baru. Kurva yang masih naik berarti masih ada jenis yang belum tercatat. Lonjakan terbesar terjadi pada ' + puncak('aves')[0] + ' untuk burung dan ' + puncak('flora')[0] + ' untuk tumbuhan, mengikuti tahun dengan banyak kegiatan inventarisasi.</p>';
    /* gambar ulang bila lebar kartu berubah cukup jauh, misalnya saat layar diputar */
    if (window.ResizeObserver) {
      var lebarLama = elAk.clientWidth, ro = new ResizeObserver(function () {
        if (Math.abs(elAk.clientWidth - lebarLama) < 40) return;
        lebarLama = elAk.clientWidth; elAk.querySelector('.garis-wadah').innerHTML = garis();
      });
      ro.observe(elAk); bersih.push(function () { ro.disconnect(); });
    }

    var tb = K.tabel({ label: 'Penduga jumlah jenis per kelompok dan resor', perHal: 40, kepalaBaris: true, baris: c.penduga, kolom: [
      { id: 'g', judul: 'Kelompok', nilai: function (p) { return p.nama_grup; }, isi: function (p) { return esc(p.nama_grup); } },
      { id: 'w', judul: 'Wilayah', nilai: function (p) { return p.wilayah; }, isi: function (p) { return esc(p.wilayah); } },
      { id: 's', judul: 'Jenis tercatat', n: true, nilai: function (p) { return p.s_obs; }, isi: function (p) { return K.n(p.s_obs); } },
      { id: 'm', judul: 'Sel bertemuan (m)', n: true, nilai: function (p) { return p.m; }, isi: function (p) { return K.n(p.m); } },
      { id: 'q1', judul: 'Jenis di 1 sel (Q1)', n: true, nilai: function (p) { return p.q1; }, isi: function (p) { return K.n(p.q1); } },
      { id: 'q2', judul: 'Jenis di 2 sel (Q2)', n: true, nilai: function (p) { return p.q2; }, isi: function (p) { return K.n(p.q2); } },
      { id: 'c2', judul: 'Chao2', n: true, nilai: function (p) { return p.chao2; }, isi: function (p) { return p.chao2 === null ? '-' : K.n(p.chao2, 1); } },
      { id: 'j1', judul: 'Jackknife 1', n: true, nilai: function (p) { return p.jack1; }, isi: function (p) { return p.jack1 === null ? '-' : K.n(p.jack1, 1); } },
      { id: 'bl', judul: 'Diduga belum tercatat', n: true, nilai: function (p) { return p.chao2 === null ? null : p.chao2 - p.s_obs; }, isi: function (p) { return p.chao2 === null ? '-' : K.n(Math.max(0, p.chao2 - p.s_obs)); } },
      { id: 'lk', judul: 'Kelengkapan', n: true, nilai: function (p) { return p.lengkap; }, isi: function (p) { return p.lengkap === null ? '-' : K.n(p.lengkap) + ' %'; } }] });
    isi.querySelector('#pdTabel').appendChild(tb.el);
  }

  /* ---------- 05 celah taksonomi ---------- */
  function pasangTakson(isi, c) {
    var tk = c.taksa;
    var per = {}; tk.tingkat_identifikasi.forEach(function (r) { var o = per[r.grup] || (per[r.grup] = { jenis: 0, semua: 0 }); o.semua += r.n; if (r.tingkat === 'jenis') o.jenis += r.n; });
    isi.querySelector('#ctTingkat').innerHTML = K.batangDatar(['aves', 'flora', 'mamalia', 'lain'].filter(function (g) { return per[g]; }).map(function (g) {
      var o = per[g], v = 100 * o.jenis / o.semua; return [NAMA_GRUP[g], v, K.n(v) + ' %'];
    }), '% temuan sampai jenis') +
      '<p class="kartu-catatan">' + ['aves', 'flora', 'mamalia', 'lain'].filter(function (g) { return per[g]; }).map(function (g) { return NAMA_GRUP[g] + ' ' + K.n(per[g].jenis) + ' dari ' + K.n(per[g].semua) + ' temuan'; }).join('; ') + '.</p>';

    var form = isi.querySelector('#ctSaring'), hasil = isi.querySelector('#ctHasil'), daftar = tk.induk_tanpa_temuan;
    var tb = K.tabel({ label: 'Jenis di daftar induk yang belum punya temuan', perHal: 15, urut: { id: 'nama', turun: false }, kepalaBaris: true, baris: daftar,
      kosong: 'Tidak ada jenis yang cocok dengan saringan. Coba kata lain atau pilih Semua kelompok.',
      kolom: [
        { id: 'nama', judul: 'Jenis', nilai: function (t) { return t.ilmiah.toLowerCase(); }, isi: function (t) { return '<span class="ilmiah">' + esc(t.ilmiah) + '</span>' + (t.nama ? '<small>' + esc(t.nama) + '</small>' : ''); } },
        { id: 'kat', judul: 'Kelompok', nilai: function (t) { return namaKat(t.kategori); }, isi: function (t) { return esc(namaKat(t.kategori)); } },
        { id: 'iucn', judul: 'Daftar Merah IUCN', nilai: function (t) { return t.iucn; }, isi: function (t) { return t.iucn ? esc(t.iucn) + '<small>' + esc(K.IUCN[t.iucn] || '') + '</small>' : '<span class="redup">belum ada data</span>'; } },
        { id: 'p106', judul: 'P.106/2018', nilai: function (t) { return t.p106; }, isi: function (t) { return t.p106 ? esc(t.p106) : '<span class="redup">belum ada data</span>'; } }] });
    isi.querySelector('#ctTabel').appendChild(tb.el);
    function saring() {
      var q = form.querySelector('#ctCari').value.trim().toLowerCase().split(/\s+/).filter(Boolean), k = form.querySelector('#ctKat').value;
      var b = daftar.filter(function (t) {
        if (k && t.kategori !== k) return false;
        var s = (t.ilmiah + ' ' + (t.nama || '')).toLowerCase();
        for (var j = 0; j < q.length; j++) if (s.indexOf(q[j]) < 0) return false;
        return true;
      });
      tb.setel(b);
      hasil.textContent = K.n(b.length) + ' dari ' + K.n(daftar.length) + ' jenis tampil.';
    }
    var tunda;
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('change', function (e) { if (e.target.id !== 'ctCari') saring(); });
    form.querySelector('#ctCari').addEventListener('input', function () { clearTimeout(tunda); tunda = setTimeout(saring, 160); });
    saring();
    isi.querySelector('#ctAlat').appendChild(K.unduhan('Unduh daftar yang tampil (CSV)', 'jenis-induk-tanpa-temuan-tn-tambora', function () {
      return { baris: tb.baris(), kolom: [
        { judul: 'Nama ilmiah', nilai: function (t) { return t.ilmiah; } }, { judul: 'Nama Indonesia', nilai: function (t) { return t.nama; } },
        { judul: 'Kelompok', nilai: function (t) { return t.kategori; } }, { judul: 'IUCN', nilai: function (t) { return t.iucn; } }, { judul: 'P.106/2018', nilai: function (t) { return t.p106; } }] };
    }));
  }

  K.rute.perencanaan = { judul: 'Perencanaan inventarisasi', muat: muat, lepas: lepas };
})();
