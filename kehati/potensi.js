/* Keanekaragaman Hayati · Potensi kehati: ikhtisar, peta temuan, daftar jenis, tipe ekosistem, dan halaman tiap jenis
   dengan model sebaran habitat (MaxEnt). Data dari ../data/kehati/. */
(function () {
  'use strict';
  var K = window.KEHATI, esc = K.esc;
  var bersih = [];
  function lepas() { bersih.forEach(function (f) { try { f(); } catch (e) { /* peta sudah dilepas */ } }); bersih = []; }

  var POSISI = { objek: 'Posisi objek', pengamat: 'Posisi pengamat', petak: 'Titik petak', proyeksi: 'Proyeksi dari pengamat', tanpa: 'Tanpa koordinat' };
  var FITUR = { L: 'linear', LQ: 'linear dan kuadratik', LQH: 'linear, kuadratik, dan hinge' };
  var ANDAL = {
    tinggi: 'AUC uji di atas 0,9. Model membedakan lokasi temuan dari latar dengan baik.',
    berguna: 'AUC uji 0,7 sampai 0,9. Model layak dipakai sebagai petunjuk awal lokasi survei.',
    rendah: 'AUC uji di bawah 0,7. Pola habitatnya belum terbaca dari lokasi yang ada, jadi peta ini jangan dipakai untuk mengambil keputusan.',
    indikatif: 'Model sederhana dari kurang dari 10 lokasi. AUC-nya dihitung dengan meninggalkan satu lokasi bergantian, sehingga angkanya mudah berubah begitu ada lokasi baru. Pakai peta ini sebagai petunjuk awal saja.'
  };
  /* model dari 5 sampai 9 lokasi tidak diberi kelas keandalan dari AUC, karena AUC dari sampel sekecil itu belum bisa dipegang */
  function kelasAndal(m) { return m.m === 'penuh' ? m.andal : 'indikatif'; }
  function lencanaAndal(m, awalan) { var k = kelasAndal(m); return '<span class="andal andal--' + k + '">' + (awalan && k !== 'indikatif' ? awalan + ' ' : '') + k + '</span>'; }
  var TERANCAM = { CR: 1, EN: 1, VU: 1, NT: 1 };
  var rasterSimpan = {};
  function ambilRaster(url) { return rasterSimpan[url] || (rasterSimpan[url] = K.bacaRaster(url).catch(function (e) { delete rasterSimpan[url]; throw e; })); }
  function rentang(th) { return th ? (th[0] === th[1] ? String(th[0]) : th[0] + ' sampai ' + th[1]) : '-'; }
  function asing(x) { return x.inv || x.sb === 'Introduced'; }
  function teksCari(x) { return x._cari || (x._cari = [x.i, x.n, x.e, x.f].concat(x.l || [], x.sin || []).join(' ').toLowerCase()); }
  function namaPolos(x) { return x.i ? x.i + (x.t === 'marga' ? ' sp.' : '') : (x.n || x.tid); }
  function tautJenis(x) {
    var kecil = x.i ? (x.n || (x.l && x.l[0]) || '') : '';
    return '<a href="#/jenis/' + encodeURIComponent(x.tid) + '">' + K.namaTakson(x) + '</a>' + (kecil ? '<small>' + esc(kecil) + '</small>' : '');
  }
  function lencana(x) { var h = K.lencanaStatus(x); return h ? '<span class="status-deret">' + h + '</span>' : ''; }
  function gulirKe(el) {
    el.style.scrollMarginTop = (K.tinggiAtas() + 12) + 'px';
    el.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  /* ---------- grafik batang tegak (bertumpuk bila serinya lebih dari satu) ---------- */
  function langkahRapi(maks) {
    var kasar = maks / 4, p = Math.pow(10, Math.floor(Math.log(kasar) / Math.LN10)), f = kasar / p;
    return Math.max(1, (f <= 1 ? 1 : (f <= 2 ? 2 : (f <= 5 ? 5 : 10))) * p);
  }
  function grafikBatang(o) {
    var W = 720, H = o.tinggi || 250, kiri = 48, kanan = 8, atas = 24, bawah = 30, n = o.kategori.length;
    var total = o.kategori.map(function (_, i) { var s = 0; o.seri.forEach(function (r) { s += r.nilai[i]; }); return s; });
    var maks = Math.max.apply(null, total.concat([1])), langkah = langkahRapi(maks), puncak = Math.ceil(maks / langkah) * langkah;
    var lebar = (W - kiri - kanan) / n, bw = Math.min(44, lebar * 0.58), t, s;
    function y(v) { return atas + (H - atas - bawah) * (1 - v / puncak); }
    s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(o.label) + '">';
    for (t = 0; t <= puncak + 1e-9; t += langkah) {
      s += '<g class="kisi"><line x1="' + kiri + '" x2="' + (W - kanan) + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '"/></g>' +
        '<g class="sumbu"><text x="' + (kiri - 8) + '" y="' + (y(t) + 4).toFixed(1) + '" text-anchor="end">' + K.n(t) + '</text></g>';
    }
    o.kategori.forEach(function (kat, i) {
      var cx = kiri + lebar * (i + 0.5), x0 = cx - bw / 2, x1 = cx + bw / 2, dasar = 0;
      var ada = o.seri.filter(function (r) { return r.nilai[i] > 0; });
      o.seri.forEach(function (r) {
        var v = r.nilai[i]; if (!v) return;
        var yA = y(dasar + v), yB = y(dasar) - (dasar > 0 ? 2 : 0);
        if (yB - yA < 1) yA = yB - 1;
        if (r === ada[ada.length - 1]) {
          var q = Math.min(4, yB - yA, bw / 2);
          s += '<path fill="' + r.warna + '" d="M' + x0.toFixed(1) + ' ' + yB.toFixed(1) + 'V' + (yA + q).toFixed(1) + 'Q' + x0.toFixed(1) + ' ' + yA.toFixed(1) + ' ' + (x0 + q).toFixed(1) + ' ' + yA.toFixed(1) +
            'H' + (x1 - q).toFixed(1) + 'Q' + x1.toFixed(1) + ' ' + yA.toFixed(1) + ' ' + x1.toFixed(1) + ' ' + (yA + q).toFixed(1) + 'V' + yB.toFixed(1) + 'Z"/>';
        } else s += '<rect fill="' + r.warna + '" x="' + x0.toFixed(1) + '" y="' + yA.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (yB - yA).toFixed(1) + '"/>';
        dasar += v;
      });
      var rinci = o.seri.length > 1 ? o.seri.map(function (r) { return r.nama + ' ' + K.n(r.nilai[i]); }).join(', ') + ', jumlah ' + K.n(total[i]) + ' ' + o.satuan : K.n(total[i]) + ' ' + o.satuan;
      s += '<g class="sumbu"><text x="' + cx.toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + esc(kat) + '</text>' +
        (total[i] ? '<text class="nilai" x="' + cx.toFixed(1) + '" y="' + (y(total[i]) - 6).toFixed(1) + '" text-anchor="middle">' + K.n(total[i]) + '</text>' : '') + '</g>' +
        '<rect class="hit" tabindex="0" role="img" aria-label="' + esc(kat + ': ' + rinci) + '" data-tip="' + esc(kat + '|' + rinci) + '" x="' + (cx - lebar / 2).toFixed(1) + '" y="' + atas + '" width="' + lebar.toFixed(1) + '" height="' + (H - atas - bawah) + '"/>';
    });
    s += '</svg>';
    var legenda = o.seri.length > 1 ? '<div class="legenda">' + o.seri.map(function (r) { return '<span><i style="background:' + r.warna + '"></i>' + esc(r.nama) + '</span>'; }).join('') + '</div>' : '';
    var tabel = '<details class="lipat"><summary>Lihat angkanya sebagai tabel</summary><div class="tabel-wadah"><table><thead><tr><th scope="col">' + esc(o.judulKategori) + '</th>' +
      o.seri.map(function (r) { return '<th scope="col" class="n">' + esc(r.nama) + '</th>'; }).join('') + (o.seri.length > 1 ? '<th scope="col" class="n">Jumlah</th>' : '') + '</tr></thead><tbody>' +
      o.kategori.map(function (kat, i) { return '<tr><th scope="row">' + esc(kat) + '</th>' + o.seri.map(function (r) { return '<td class="n">' + K.n(r.nilai[i]) + '</td>'; }).join('') + (o.seri.length > 1 ? '<td class="n">' + K.n(total[i]) + '</td>' : '') + '</tr>'; }).join('') +
      '</tbody></table></div></details>';
    return '<div class="grafik">' + s + '</div>' + legenda + tabel;
  }
  function batangDatar(baris, satuan) {
    var maks = Math.max.apply(null, baris.map(function (b) { return b[1]; }).concat([1]));
    return '<ul class="batang">' + baris.map(function (b) {
      return '<li data-tip="' + esc(b[0] + '|' + K.nd(b[1], 1) + ' ' + satuan) + '"><span class="nm">' + esc(b[0]) + '</span><span class="jalur"><i style="width:' + (b[1] / maks * 100).toFixed(1) + '%"></i></span><span class="nl">' + (b[2] || K.nd(b[1], 1)) + '</span></li>';
    }).join('') + '</ul>';
  }
  /* dipakai juga oleh halaman Perencanaan inventarisasi */
  K.langkahRapi = langkahRapi; K.grafikBatang = grafikBatang; K.batangDatar = batangDatar; K.gulirKe = gulirKe;
  function pitaJenjang(kiri, kanan, tanda) {
    return '<span class="jenjang"><em>' + esc(kiri) + '</em><span class="jenjang-pita" style="background:linear-gradient(90deg,' + K.JENJANG.join(',') + ')">' +
      (tanda !== undefined ? '<i style="left:' + (tanda * 100).toFixed(1) + '%"></i>' : '') + '</span><em>' + esc(kanan) + '</em></span>';
  }

  /* ================= IKHTISAR ================= */
  function ikhtisar(isi) {
    var g = K.giliran;
    K.memuat(isi, 'Memuat temuan, daftar jenis, dan model sebaran…');
    Promise.all([K.siapTemuan(), K.semua(['ringkasan.json', 'batas.json', 'maxent.json'])]).then(function (h) {
      if (g !== K.giliran) return;
      gambarIkhtisar(isi, h[0], h[1][0], h[1][1], h[1][2]);
    }).catch(function (e) { if (g === K.giliran) K.galat(isi, e, K.muatUlang); });
  }

  function gambarIkhtisar(isi, T, R, batas, mx) {
    var C = T.C, Q = T.Q, i;
    var MX = {}; mx.model.forEach(function (m) { MX[m.tid] = m; });
    var tercatat = T.taksa.filter(function (x) { return x.nr > 0; });
    var tahun = []; for (i = R.periode[0]; i <= R.periode[1]; i++) tahun.push(i);
    var J = R.jenis, pk = J.per_kategori;
    var nEko = {}, nTitik = {};
    for (i = 0; i < T.n; i++) { if (C.eko[i]) nEko[C.eko[i]] = 1; if (C.lat[i] !== null) nTitik[C.lat[i].toFixed(5) + ',' + C.lon[i].toFixed(5)] = 1; }
    nEko = Object.keys(nEko).length; nTitik = Object.keys(nTitik).length;
    var hitung = { semua: tercatat.length, lindung: 0, terancam: 0, endemik: 0, asing: 0, model: 0 };
    tercatat.forEach(function (x) { if (x.p106 === 'Dilindungi') hitung.lindung++; if (TERANCAM[x.iucn]) hitung.terancam++; if (x.h === 'Endemik') hitung.endemik++; if (asing(x)) hitung.asing++; if (x.model) hitung.model++; });

    var h = '<section class="bagian bagian--awal"><h1 class="judul-hal">Potensi keanekaragaman hayati TN Gunung Tambora</h1>' +
      '<p class="lede"><b>' + K.n(R.lolos) + ' temuan</b> terkurasi dari ' + K.n(R.kegiatan.berdata) + ' laporan kegiatan teknis PEH (LPK) tahun ' + R.periode[0] + ' sampai ' + R.periode[1] +
      ' dan dari SMART Patrol 2026. Dari temuan itu, <b>' + K.n(J.total) + ' jenis</b> teridentifikasi sampai tingkat jenis, dan <b>' + K.n(R.model.jumlah) + ' jenis</b> punya cukup lokasi untuk dimodelkan sebaran habitatnya dengan MaxEnt.</p>' +
      '<div class="angka-deret">' +
      angka('Jenis teridentifikasi', K.n(J.total), K.n(pk.Aves) + ' burung, ' + K.n(pk.Mamalia) + ' mamalia, ' + K.n(pk.Flora) + ' flora, ' + K.n(pk.Anggrek) + ' anggrek, ' + K.n(pk['Fauna lain']) + ' fauna lain') +
      angka('Jenis dilindungi', K.n(J.dilindungi), 'Permen LHK P.106 tahun 2018') +
      angka('Jenis terancam', K.n(J.terancam), 'IUCN rentan atau genting, ditambah ' + K.n(J.hampir_terancam) + ' hampir terancam') +
      angka('Jenis asing invasif', K.n(J.invasif), 'dari ' + K.n(J.asing) + ' jenis asing yang tercatat') +
      angka('Tipe ekosistem', K.n(nEko), 'hasil ground check 2023 dan 2024') +
      angka('Model sebaran habitat', K.n(R.model.jumlah), K.n(R.model.penuh) + ' model penuh, ' + K.n(R.model.sederhana) + ' indikatif') +
      '</div></section>';

    /* 01 peta */
    h += '<section class="bagian" id="petaTemuan" aria-labelledby="j-peta"><div class="bagian-kepala"><span class="bagian-no">01</span><h2 id="j-peta">Peta temuan</h2>' +
      '<p>' + K.n(R.berkoordinat) + ' temuan punya koordinat dan jatuh di ' + K.n(nTitik) + ' titik. ' + K.n(R.tanpa_koordinat) + ' temuan lain berasal dari daftar jenis di laporan yang tidak mencantumkan koordinat, jadi hanya muncul di tabel. Klik sebuah titik untuk melihat jenis yang tercatat di sana.</p></div>' +
      '<form class="saring" id="pfSaring" aria-label="Saring peta temuan">' +
      '<fieldset class="pilih-deret"><legend>Kelompok</legend>' + K.KELOMPOK.map(function (g) {
        return '<label class="pilih"><input type="checkbox" name="g" value="' + g.id + '" checked><span class="tanda ' + (g.kotak ? 'tanda--kotak' : 'tanda--' + g.id) + '"></span>' + esc(g.nama) + '</label>';
      }).join('') + '</fieldset>' +
      '<div class="isian isian--lebar"><label for="pfCari">Cari jenis</label><input id="pfCari" type="search" autocomplete="off" placeholder="Misalnya elang flores atau Nisaetus"></div>' +
      '<div class="isian"><label for="pfSumber">Sumber</label><select id="pfSumber"><option value="">Semua sumber</option><option value="LPK">LPK saja</option><option value="SMART">SMART Patrol saja</option></select></div>' +
      '<div class="isian isian--sempit"><label for="pfDari">Tahun dari</label><select id="pfDari">' + tahun.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="isian isian--sempit"><label for="pfSampai">Sampai</label><select id="pfSampai">' + tahun.map(function (t, j) { return '<option' + (j === tahun.length - 1 ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="isian"><label for="pfResor">Resor</label><select id="pfResor"><option value="">Semua resor</option>' + mx.resor.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></div>' +
      '<div class="isian"><label for="pfStatus">Status jenis</label><select id="pfStatus"><option value="">Semua status</option><option value="lindung">Dilindungi</option><option value="terancam">Terancam atau hampir terancam</option><option value="endemik">Endemik</option><option value="asing">Asing atau invasif</option></select></div>' +
      '<div class="isian"><label for="pfModel">Lapisan model</label><select id="pfModel"><option value="">Tanpa lapisan model</option>' +
      '<option value="semua">Jumlah jenis menurut model: semua (' + mx.tumpuk.semua.n_model + ' model)</option><option value="fauna">Jumlah jenis menurut model: fauna (' + mx.tumpuk.fauna.n_model + ')</option><option value="flora">Jumlah jenis menurut model: flora (' + mx.tumpuk.flora.n_model + ')</option></select></div>' +
      '<div class="isian isian--sempit"><label for="pfOpa">Kepekatan lapisan</label><input id="pfOpa" type="range" min="20" max="100" step="5" value="80"></div>' +
      '<div class="saring-aksi"><button type="button" class="tombol tombol--hantu" id="pfReset">Hapus saringan</button></div>' +
      '<p class="saring-hasil" id="pfHasil" role="status"></p></form>' +
      '<div class="peta-wadah"><div class="peta peta--besar" id="pfPeta" role="application" aria-label="Peta temuan keanekaragaman hayati"></div><div class="peta-legenda" id="pfLegenda"></div></div>' +
      '<p class="peta-catatan">Besar titik mengikuti jumlah temuan di titik itu. Koordinat sebagian temuan satwa adalah posisi pengamat, bukan posisi satwa. Titik sampai 1 km di luar batas kawasan tetap ditampilkan sesuai aturan kurasi.</p></section>';

    /* 02 daftar jenis */
    h += '<section class="bagian" id="daftarJenis" aria-labelledby="j-jenis"><div class="bagian-kepala"><span class="bagian-no">02</span><h2 id="j-jenis">Daftar jenis</h2>' +
      '<p>' + K.n(tercatat.length) + ' takson tercatat: ' + K.n(J.total) + ' sampai tingkat jenis, ' + K.n(R.takson_lain.marga) + ' sampai marga, ' + K.n(R.takson_lain.nama_lokal) + ' baru bernama lokal, dan ' + K.n(R.takson_lain.kelompok) + ' berupa kelompok. Status perlindungan dan Daftar Merah IUCN diketahui untuk ' + K.n(J.status_diketahui) + ' jenis yang ada di daftar induk kehati. Klik nama jenis untuk melihat peta, model, dan semua temuannya.</p></div>' +
      '<form class="saring" id="djSaring" aria-label="Saring daftar jenis">' +
      '<fieldset class="pilih-deret"><legend>Tampilkan</legend>' +
      [['semua', 'Semua yang tercatat'], ['lindung', 'Dilindungi'], ['terancam', 'Terancam atau hampir terancam'], ['endemik', 'Endemik'], ['asing', 'Asing atau invasif'], ['model', 'Punya model']].map(function (p, j) {
        return '<label class="pilih"><input type="radio" name="st" value="' + p[0] + '"' + (j === 0 ? ' checked' : '') + '>' + p[1] + ' <b>' + K.n(hitung[p[0]]) + '</b></label>';
      }).join('') + '</fieldset>' +
      '<div class="isian isian--lebar"><label for="djCari">Cari nama ilmiah, Indonesia, lokal, atau famili</label><input id="djCari" type="search" autocomplete="off" placeholder="Misalnya Ficus, nuri, atau Accipitridae"></div>' +
      '<div class="isian"><label for="djKat">Kelompok</label><select id="djKat"><option value="">Semua kelompok</option>' + ['Aves', 'Mamalia', 'Fauna lain', 'Flora', 'Anggrek', 'Belum terkelompok'].map(function (k) { return '<option value="' + k + '">' + esc(K.NAMA_KAT[k]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="isian"><label for="djTingkat">Tingkat identifikasi</label><select id="djTingkat"><option value="">Semua tingkat</option><option value="jenis">Jenis</option><option value="marga">Marga</option><option value="nama lokal">Nama lokal</option><option value="kelompok">Kelompok</option></select></div>' +
      '<p class="saring-hasil" id="djHasil" role="status"></p></form><div id="djTabel"></div><div class="tabel-alat" id="djAlat"></div></section>';

    /* 03 waktu, kelompok, resor */
    h += '<section class="bagian" aria-labelledby="j-waktu"><div class="bagian-kepala"><span class="bagian-no">03</span><h2 id="j-waktu">Temuan menurut tahun, kelompok, dan resor</h2>' +
      '<p>Jumlah temuan mengikuti jumlah kegiatan pada tahun itu, bukan naik turunnya satwa atau tumbuhan. Tahun 2026 melonjak karena data SMART Patrol baru masuk mulai Februari 2026.</p></div>' +
      '<div class="grid grid-2"><div class="kartu"><h3 class="kartu-judul">' + K.ikon.grafik + 'Temuan per tahun menurut sumber</h3><div id="grTahun"></div></div>' +
      '<div class="kartu"><h3 class="kartu-judul">' + K.ikon.daun + 'Jenis teridentifikasi per kelompok</h3><div id="grKat"></div><p class="kartu-catatan">Hanya takson yang teridentifikasi sampai tingkat jenis. Mamalia baru tiga jenis karena kegiatan yang ada berfokus pada rusa timor, dan belum ada survei khusus mamalia kecil, kelelawar, reptil, atau amfibi.</p>' +
      '<h4 class="sub-judul">Takson tercatat menurut tingkat identifikasi</h4><div id="grTingkat"></div><p class="kartu-catatan">Nama lokal dan marga yang belum dipastikan jenisnya ada di <a href="#/data/nama">Data masuk</a> supaya bisa ditinjau.</p></div></div>' +
      '<div class="kartu kartu--blok"><h3 class="kartu-judul">' + K.ikon.tabel + 'Temuan dan jenis per resor</h3><div id="tbResor"></div><p class="kartu-catatan">Resor di sini enam resor operasional yang dipakai dashboard SMART Patrol. Jumlah jenis per resor ikut dipengaruhi banyaknya kegiatan di resor itu.</p></div></section>';

    /* 04 ekosistem */
    h += '<section class="bagian" aria-labelledby="j-eko"><div class="bagian-kepala"><span class="bagian-no">04</span><h2 id="j-eko">Tipe ekosistem dan tutupan lahan</h2>' +
      '<p>Titik ground check tutupan lahan dan tipe ekosistem tahun 2023 dan 2024, ditambah catatan tutupan lahan dari SMART Patrol 2026. Penamaan mengikuti isian di lembar kerja sumbernya.</p></div>' +
      '<div class="grid grid-2s"><div><h3 class="sub-judul">Tipe ekosistem (ground check)</h3><div id="tbEko"></div></div><div><h3 class="sub-judul">Tutupan lahan (SMART Patrol dan ground check)</h3><div id="tbTut"></div></div></div></section>';

    /* 05 model */
    var A = { tinggi: 0, berguna: 0, rendah: 0, indikatif: 0 };
    mx.model.forEach(function (m) { A[kelasAndal(m)]++; });
    h += '<section class="bagian" id="modelSebaran" aria-labelledby="j-model"><div class="bagian-kepala"><span class="bagian-no">05</span><h2 id="j-model">Model sebaran habitat</h2>' +
      '<p>MaxEnt menduga seberapa mirip tiap sel 50 m dengan tempat suatu jenis pernah ditemukan, berdasarkan elevasi, lereng, arah lereng, posisi topografi, kanopi, dan tutupan lahan. Jenis dengan 10 lokasi unik atau lebih mendapat model penuh. Jenis dengan 5 sampai 9 lokasi mendapat model sederhana yang hanya indikatif. Jenis dengan kurang dari 5 lokasi hanya ditampilkan titiknya.</p></div>' +
      '<div class="fakta-deret">' +
      '<div><span>Jenis dimodelkan</span><b>' + K.n(R.model.jumlah) + '</b><small>' + K.n(R.model.penuh) + ' penuh, ' + K.n(R.model.sederhana) + ' indikatif</small></div>' +
      '<div><span>Model penuh, keandalan tinggi</span><b>' + K.n(A.tinggi) + '</b><small>AUC uji di atas 0,9</small></div>' +
      '<div><span>Model penuh, keandalan berguna</span><b>' + K.n(A.berguna) + '</b><small>AUC uji 0,7 sampai 0,9</small></div>' +
      '<div><span>Model penuh, keandalan rendah</span><b>' + K.n(A.rendah) + '</b><small>AUC uji di bawah 0,7</small></div>' +
      '<div><span>Model indikatif</span><b>' + K.n(A.indikatif) + '</b><small>dari 5 sampai 9 lokasi, belum diberi kelas keandalan</small></div>' +
      '<div><span>Masuk peta jumlah jenis</span><b>' + K.n(mx.tumpuk.semua.n_model) + '</b><small>model penuh dengan AUC uji 0,7 atau lebih</small></div></div>' +
      '<p class="prosa" style="margin:16px 0 14px">Peta jumlah jenis menumpuk habitat sesuai dari ' + mx.tumpuk.semua.n_model + ' model itu (' + mx.tumpuk.fauna.n_model + ' fauna dan ' + mx.tumpuk.flora.n_model + ' flora). Di dalam kawasan, nilai tengahnya ' + K.nd(mx.tumpuk.semua.median, 0) + ' jenis per sel dan nilai tertingginya ' + mx.tumpuk.semua.maks + ' jenis. ' +
      '<button type="button" class="teks-tautan" id="lihatPotensi">Tampilkan peta jumlah jenis di peta temuan</button>.</p>' +
      '<div id="tbModel"></div><div class="tabel-alat" id="mdAlat"></div></section>';

    /* 06 metode */
    h += '<section class="bagian" aria-labelledby="j-metode"><div class="bagian-kepala"><span class="bagian-no">06</span><h2 id="j-metode">Cara data ini disusun dan batasannya</h2></div>' +
      '<div class="prosa kolom-2">' +
      '<p><b>Sumber.</b> Tabel temuan dan koordinat dibaca dari arsip LPK teknis PEH ' + R.periode[0] + ' sampai ' + R.periode[1] + ' (shapefile, lembar kerja, dan lampiran naskah) dan dari temuan satwa serta tumbuhan di dashboard SMART Patrol per ' + K.tgl(R.smart_per) + '. ' + K.n(R.kegiatan.lpk - R.kegiatan.berdata) + ' dari ' + K.n(R.kegiatan.lpk) + ' LPK tidak punya tabel yang terbaca. Rinciannya ada di <a href="#/data">Data masuk</a>.</p>' +
      '<p><b>Kurasi.</b> Dari ' + K.n(R.masuk) + ' baris yang masuk, ' + K.n(R.lolos) + ' lolos. Temuan dengan koordinat lebih dari 1 km di luar kawasan dibuang, begitu juga temuan ganda (koordinat, jenis, tanggal, dan jumlah yang sama). Temuan berulang pada tanggal berbeda tetap disimpan, tetapi dihitung satu lokasi di peta dan di model.</p>' +
      '<p><b>Nama jenis.</b> Nama di sumber dicocokkan ke daftar induk kehati TN Tambora dan kamus data model SMART. Nama yang belum bisa dipastikan sampai jenis disimpan sebagai marga, nama lokal, atau kelompok, dan tidak ikut dihitung sebagai jenis.</p>' +
      '<p><b>Model.</b> Lapisan lingkungan diturunkan dari data lanskap 10 m (elevasi, lereng, arah lereng, kelas tutupan, tutupan dan tinggi kanopi) lalu dirata-ratakan ke sel 50 m. Titik latar diambil mengikuti kerapatan upaya survei kelompok yang sama supaya model tidak sekadar meniru lokasi yang sering didatangi. Keandalan diuji dengan validasi silang blok ruang. Rumus dan rujukannya ada di Kamus: <a href="#/kamus/maxent">MaxEnt</a>, <a href="#/kamus/auc">AUC</a>, <a href="#/kamus/ambang-p10">ambang P10</a>, dan <a href="#/kamus/potensi-tumpuk">peta jumlah jenis</a>.</p>' +
      '<ul><li>Belum ada lapisan iklim (suhu, hujan) pada resolusi yang memadai. Elevasi mewakilinya secara kasar.</li>' +
      '<li>Kelas tutupan lahan berasal dari peta bahan bakar kebakaran, bukan peta vegetasi.</li>' +
      '<li>Lokasi temuan mengelompok di sekitar jalur dan titik pengamatan, sehingga AUC cenderung sedikit terlalu tinggi dan daerah yang belum disurvei bisa terduga terlalu rendah.</li>' +
      '<li>Model menggambarkan kemiripan habitat, bukan kehadiran. Sel yang sesuai belum tentu dihuni.</li>' +
      '<li>Sekitar 0,5 % kawasan di tepi berada di luar cakupan data lanskap dan tidak punya nilai model.</li></ul></div></section>';

    isi.innerHTML = h;
    function angka(label, nilai, sub) { return '<div class="angka"><div class="angka-label">' + label + '</div><div class="angka-nilai">' + nilai + '</div><div class="angka-sub">' + sub + '</div></div>'; }

    pasangPeta(isi, T, batas, mx);
    pasangDaftar(isi, T, tercatat, MX);
    pasangGrafik(isi, T, R, tahun, mx);
    pasangEko(isi, T);
    pasangModel(isi, T, mx);
  }

  /* ---------- 01 peta temuan ---------- */
  function pasangPeta(isi, T, batas, mx) {
    var C = T.C, Q = T.Q, L = window.L, elPeta = isi.querySelector('#pfPeta'), form = isi.querySelector('#pfSaring'), hasil = isi.querySelector('#pfHasil');
    var peta = null, lapisTitik = null, lapisModel = null, kanvas = null, Kotak = null, galatModel = '';
    if (K.petaAda()) {
      peta = K.peta(elPeta, { batas: batas });
      kanvas = L.canvas({ padding: 0.4, tolerance: 8 });
      lapisTitik = L.layerGroup().addTo(peta.map);
      Kotak = K.kotak();
      bersih.push(function () { peta.map.remove(); });
    } else K.petaGalat(elPeta);

    function baca() {
      var g = {}; Array.prototype.forEach.call(form.querySelectorAll('input[name="g"]'), function (c) { g[c.value] = c.checked; });
      var elDari = form.querySelector('#pfDari'), elSampai = form.querySelector('#pfSampai');
      /* tahun yang terbalik ditukar di isiannya juga, supaya rentang yang tertulis sama dengan yang dipakai */
      if (+elDari.value > +elSampai.value) { var tukar = elDari.value; elDari.value = elSampai.value; elSampai.value = tukar; }
      var dari = +elDari.value, sampai = +elSampai.value;
      return { g: g, q: form.querySelector('#pfCari').value.trim().toLowerCase().split(/\s+/).filter(Boolean), sumber: form.querySelector('#pfSumber').value, dari: dari, sampai: sampai,
        resor: form.querySelector('#pfResor').value, status: form.querySelector('#pfStatus').value };
    }
    function cocok(i, f) {
      var grup = K.kelompokDari[Q.kategori[C.kat[i]]];
      if (!f.g[grup.id]) return false;
      if (f.sumber && Q.sumber[C.s[i]] !== f.sumber) return false;
      if (C.th[i] < f.dari || C.th[i] > f.sampai) return false;
      if (f.resor && Q.resor[C.res[i]] !== f.resor) return false;
      var x = C.t[i] >= 0 ? T.taksa[C.t[i]] : null;
      if (f.status) {
        if (!x) return false;
        if (f.status === 'lindung' && x.p106 !== 'Dilindungi') return false;
        if (f.status === 'terancam' && !TERANCAM[x.iucn]) return false;
        if (f.status === 'endemik' && x.h !== 'Endemik') return false;
        if (f.status === 'asing' && !asing(x)) return false;
      }
      if (f.q.length) {
        var t = (x ? teksCari(x) + ' ' : '') + (C.ns[i] + ' ' + C.eko[i] + ' ' + C.tut[i]).toLowerCase();
        for (var j = 0; j < f.q.length; j++) if (t.indexOf(f.q[j]) < 0) return false;
      }
      return true;
    }
    function isiPop(o) {
      var per = {}, urut = [], luar = 0, resor = Q.resor[C.res[o.idx[0]]];
      o.idx.forEach(function (i) {
        var t = C.t[i], kunci = t >= 0 ? 't' + t : (C.eko[i] ? 'e' + C.eko[i] : (C.tut[i] ? 'u' + C.tut[i] : 'x' + C.ns[i]));
        var p = per[kunci]; if (!p) { p = per[kunci] = { i: i, n: 0, a: C.th[i], b: C.th[i] }; urut.push(p); }
        p.n++; p.a = Math.min(p.a, C.th[i]); p.b = Math.max(p.b, C.th[i]); if (C.jl[i] > luar) luar = C.jl[i];
      });
      urut.sort(function (a, b) { return b.n - a.n; });
      var baris = urut.slice(0, 8).map(function (p) {
        var i = p.i, nama;
        if (C.t[i] >= 0) { var x = T.taksa[C.t[i]]; nama = '<a href="#/jenis/' + encodeURIComponent(x.tid) + '">' + K.namaTakson(x) + '</a>' + (x.i && x.n ? ' <span class="redup">' + esc(x.n) + '</span>' : ''); }
        else if (C.eko[i]) nama = 'Tipe ekosistem: ' + esc(C.eko[i].split(' > ').slice(-2).join(', '));
        else if (C.tut[i]) nama = 'Tutupan lahan: ' + esc(C.tut[i].split(' > ').pop());
        else nama = esc(C.ns[i] || 'Tanpa nama');
        return '<li>' + nama + '<span class="redup"> · ' + K.n(p.n) + ' temuan, ' + rentang([p.a, p.b]) + '</span></li>';
      }).join('');
      return '<b>' + K.n(o.idx.length) + ' temuan di titik ini</b><div class="redup">' + (resor ? 'Resor ' + esc(resor) + ' · ' : '') + K.koord(o.lat, o.lon) + (luar ? ' · ' + K.n(luar) + ' m di luar batas kawasan' : '') + '</div>' +
        '<ul class="pop-daftar">' + baris + '</ul>' + (urut.length > 8 ? '<div class="redup">dan ' + K.n(urut.length - 8) + ' jenis lain di titik ini</div>' : '');
    }
    function gambar() {
      var f = baca(), titik = {}, nT = 0, nTanpa = 0, i;
      for (i = 0; i < T.n; i++) {
        if (!cocok(i, f)) continue;
        if (C.lat[i] === null) { nTanpa++; continue; }
        nT++;
        var kunci = C.lat[i].toFixed(5) + ',' + C.lon[i].toFixed(5), o = titik[kunci] || (titik[kunci] = { lat: C.lat[i], lon: C.lon[i], idx: [], g: {} });
        var gid = K.kelompokDari[Q.kategori[C.kat[i]]].id;
        o.idx.push(i); o.g[gid] = (o.g[gid] || 0) + 1;
      }
      var kunciTitik = Object.keys(titik);
      if (peta) {
        lapisTitik.clearLayers();
        kunciTitik.forEach(function (k) {
          var o = titik[k];
          K.KELOMPOK.forEach(function (g) {
            var n = o.g[g.id]; if (!n) return;
            var m = g.kotak ? new Kotak([o.lat, o.lon], { renderer: kanvas, radius: 4.5, color: g.warna, weight: 2, fillColor: '#0a140f', fillOpacity: 0.4 })
              : L.circleMarker([o.lat, o.lon], { renderer: kanvas, radius: Math.min(9, 3 + Math.sqrt(n)), color: '#0a140f', weight: 1.2, fillColor: g.warna, fillOpacity: 0.92 });
            m.on('click', function () { L.popup({ maxWidth: 320 }).setLatLng([o.lat, o.lon]).setContent(isiPop(o)).openOn(peta.map); });
            lapisTitik.addLayer(m);
          });
        });
      }
      var aktif = f.q.length || f.sumber || f.resor || f.status || f.dari !== T_AWAL || f.sampai !== T_AKHIR || K.KELOMPOK.some(function (g) { return !f.g[g.id]; });
      hasil.innerHTML = (nT ? '<b>' + K.n(nT) + ' temuan</b> di ' + K.n(kunciTitik.length) + ' titik tampil di peta.' : '<b>Tidak ada temuan berkoordinat yang cocok dengan saringan.</b> Longgarkan saringan, atau tekan Hapus saringan.') +
        (nTanpa ? ' ' + K.n(nTanpa) + ' temuan lain yang cocok tidak punya koordinat.' : '') + (galatModel ? ' <span class="isian-galat">' + esc(galatModel) + '</span>' : '');
      form.querySelector('#pfReset').disabled = !aktif && !form.querySelector('#pfModel').value;
    }
    var thn = Array.prototype.map.call(form.querySelector('#pfDari').options, function (o) { return +o.value; }), T_AWAL = thn[0], T_AKHIR = thn[thn.length - 1];

    function legenda() {
      var v = form.querySelector('#pfModel').value, lg = isi.querySelector('#pfLegenda');
      lg.innerHTML = '<div class="lg-grup"><b>Temuan</b>' + K.KELOMPOK.map(function (g) {
        return '<span><i class="' + (g.kotak ? 'kotak' : '') + '" style="' + (g.kotak ? 'background:transparent;border:2px solid ' + g.warna : 'background:' + g.warna) + '"></i>' + esc(g.nama) + '</span>';
      }).join('') + '</div><div class="lg-grup"><b>Batas</b><span><i class="batas" style="border-color:#f0cf7e"></i>Kawasan</span><span><i class="batas putus" style="border-color:#eee8d5"></i>Resor</span></div>' +
        (v && lapisModel ? '<div class="lg-grup"><b>Jumlah jenis menurut model</b>' + pitaJenjang('0', mx.tumpuk[v].maks + ' jenis') + '</div>' : '');
    }
    function setModel() {
      var sel = form.querySelector('#pfModel'), v = sel.value;
      galatModel = '';
      if (lapisModel) { peta.map.removeLayer(lapisModel); lapisModel = null; }
      if (!v || !peta) { legenda(); gambar(); return; }
      hasil.textContent = 'Memuat lapisan model…';
      ambilRaster(K.DASAR + 'maxent/potensi_' + v + '.webp').then(function (r) {
        if (sel.value !== v || !elPeta.isConnected) return;
        var maks = mx.tumpuk[v].maks;
        var url = K.gambarRaster(r, function (p) { var c = K.warnaJenjang((p - 1) / maks); return [c[0], c[1], c[2], 255]; });
        lapisModel = L.imageOverlay(url, mx.batas, { pane: 'raster', opacity: +form.querySelector('#pfOpa').value / 100, className: 'raster-model', interactive: false }).addTo(peta.map);
        legenda(); gambar();
      }).catch(function (e) { if (!elPeta.isConnected) return; sel.value = ''; galatModel = e.message; legenda(); gambar(); });
    }

    var tunda;
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('change', function (e) { if (e.target.id === 'pfModel') setModel(); else if (e.target.id !== 'pfOpa' && e.target.id !== 'pfCari') gambar(); });
    form.querySelector('#pfCari').addEventListener('input', function () { clearTimeout(tunda); tunda = setTimeout(gambar, 180); });
    form.querySelector('#pfOpa').addEventListener('input', function (e) { if (lapisModel) lapisModel.setOpacity(+e.target.value / 100); });
    form.querySelector('#pfReset').addEventListener('click', function () {
      form.reset(); if (lapisModel) { peta.map.removeLayer(lapisModel); lapisModel = null; } galatModel = '';
      if (peta) { peta.map.closePopup(); peta.map.fitBounds(peta.batasKawasan, { padding: [12, 12] }); }
      legenda(); gambar(); form.querySelector('#pfCari').focus();
    });
    if (!peta) { form.querySelector('#pfModel').disabled = true; form.querySelector('#pfOpa').disabled = true; }
    isi.querySelector('#lihatPotensi').addEventListener('click', function () {
      if (!peta) { gulirKe(isi.querySelector('#petaTemuan')); return; }
      form.querySelector('#pfModel').value = 'semua'; setModel(); gulirKe(isi.querySelector('#petaTemuan')); form.querySelector('#pfModel').focus({ preventScroll: true });
    });
    legenda(); gambar();
  }

  /* ---------- 02 daftar jenis ---------- */
  function pasangDaftar(isi, T, tercatat, MX) {
    var form = isi.querySelector('#djSaring'), hasil = isi.querySelector('#djHasil');
    function skor(x) { return (x.p106 === 'Dilindungi' ? 8 : 0) + ({ CR: 6, EN: 5, VU: 4, NT: 3 }[x.iucn] || 0) + (x.h === 'Endemik' ? 2 : 0) + (asing(x) ? 1 : 0); }
    var tb = K.tabel({
      label: 'Daftar jenis', perHal: 20, urut: { id: 'nr', turun: true }, kepalaBaris: true, baris: tercatat,
      kosong: 'Tidak ada takson yang cocok dengan saringan. Coba kata lain atau pilih Semua yang tercatat.',
      kolom: [
        { id: 'nama', judul: 'Jenis', nilai: function (x) { return namaPolos(x).toLowerCase(); }, isi: tautJenis },
        { id: 'kat', judul: 'Kelompok', nilai: function (x) { return K.NAMA_KAT[x.k] || x.k; }, isi: function (x) { return esc(K.NAMA_KAT[x.k] || x.k) + (x.f ? '<small>' + esc(x.f) + '</small>' : ''); } },
        { id: 'tk', judul: 'Tingkat', nilai: function (x) { return x.t; }, isi: function (x) { return esc(x.t); }, kelas: 'sempit' },
        { id: 'st', judul: 'Status', nilai: function (x) { return -skor(x); }, isi: lencana },
        { id: 'nr', judul: 'Temuan', n: true, nilai: function (x) { return x.nr; }, isi: function (x) { return K.n(x.nr); } },
        { id: 'nl', judul: 'Lokasi unik', n: true, tip: 'Jumlah sel 50 m berbeda tempat jenis ini tercatat', nilai: function (x) { return x.nl; }, isi: function (x) { return K.n(x.nl); } },
        { id: 'res', judul: 'Resor', n: true, tip: 'Jumlah resor tempat jenis ini tercatat', nilai: function (x) { return x.res.length; }, isi: function (x) { return x.res.length ? '<span data-tip="' + esc(x.res.join(', ')) + '" tabindex="0">' + x.res.length + '</span>' : '-'; } },
        { id: 'th', judul: 'Tahun', nilai: function (x) { return x.th ? x.th[1] * 10000 + x.th[0] : 0; }, isi: function (x) { return rentang(x.th); }, kelas: 'sempit' },
        { id: 'model', judul: 'Model', tip: 'AUC uji dan keandalan model sebaran habitat', nilai: function (x) { var m = MX[x.tid]; return m ? m.au : null; },
          isi: function (x) { var m = MX[x.tid]; return m ? 'AUC ' + K.n(m.au, 2) + '<small>' + (m.m === 'penuh' ? 'penuh, keandalan ' + m.andal : 'indikatif') + '</small>' : '<span class="redup">' + (x.t === 'jenis' ? 'titik saja' : '-') + '</span>'; } }
      ]
    });
    isi.querySelector('#djTabel').appendChild(tb.el);
    function saring() {
      var st = form.querySelector('input[name="st"]:checked').value, q = form.querySelector('#djCari').value.trim().toLowerCase().split(/\s+/).filter(Boolean), kat = form.querySelector('#djKat').value, tk = form.querySelector('#djTingkat').value;
      var b = tercatat.filter(function (x) {
        if (st === 'lindung' && x.p106 !== 'Dilindungi') return false;
        if (st === 'terancam' && !TERANCAM[x.iucn]) return false;
        if (st === 'endemik' && x.h !== 'Endemik') return false;
        if (st === 'asing' && !asing(x)) return false;
        if (st === 'model' && !x.model) return false;
        if (kat && x.k !== kat) return false;
        if (tk && x.t !== tk) return false;
        if (q.length) { var t = teksCari(x); for (var j = 0; j < q.length; j++) if (t.indexOf(q[j]) < 0) return false; }
        return true;
      });
      tb.setel(b);
      hasil.textContent = K.n(b.length) + ' dari ' + K.n(tercatat.length) + ' takson tampil.';
    }
    var tunda;
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('change', function (e) { if (e.target.id !== 'djCari') saring(); });
    form.querySelector('#djCari').addEventListener('input', function () { clearTimeout(tunda); tunda = setTimeout(saring, 160); });
    saring();
    isi.querySelector('#djAlat').appendChild(K.unduhan('Unduh daftar yang tampil (CSV)', 'daftar-jenis-tn-tambora', function () {
      return { baris: tb.baris(), kolom: [
        { judul: 'Nama ilmiah', nilai: function (x) { return x.i; } }, { judul: 'Nama Indonesia', nilai: function (x) { return x.n; } }, { judul: 'Nama lokal', nilai: function (x) { return (x.l || []).join(', '); } },
        { judul: 'Famili', nilai: function (x) { return x.f; } }, { judul: 'Kelompok', nilai: function (x) { return x.k; } }, { judul: 'Tingkat identifikasi', nilai: function (x) { return x.t; } },
        { judul: 'IUCN', nilai: function (x) { return x.iucn; } }, { judul: 'P.106/2018', nilai: function (x) { return x.p106; } }, { judul: 'CITES', nilai: function (x) { return x.cites; } },
        { judul: 'Habitus atau status hunian', nilai: function (x) { return x.h; } }, { judul: 'Asing invasif', nilai: function (x) { return x.inv ? 'ya' : ''; } },
        { judul: 'Jumlah temuan', nilai: function (x) { return x.nr; } }, { judul: 'Temuan berkoordinat', nilai: function (x) { return x.nk; } }, { judul: 'Lokasi unik', nilai: function (x) { return x.nl; } },
        { judul: 'Tahun pertama', nilai: function (x) { return x.th ? x.th[0] : ''; } }, { judul: 'Tahun terakhir', nilai: function (x) { return x.th ? x.th[1] : ''; } }, { judul: 'Resor', nilai: function (x) { return x.res.join(', '); } },
        { judul: 'Model', nilai: function (x) { var m = MX[x.tid]; return m ? m.m : ''; } }, { judul: 'AUC uji', nilai: function (x) { var m = MX[x.tid]; return m ? m.au : ''; } }
      ] };
    }));
  }

  /* ---------- 03 grafik dan tabel resor ---------- */
  function pasangGrafik(isi, T, R, tahun, mx) {
    var C = T.C, Q = T.Q, i;
    var lpk = tahun.map(function () { return 0; }), smart = lpk.slice();
    for (i = 0; i < T.n; i++) (Q.sumber[C.s[i]] === 'SMART' ? smart : lpk)[C.th[i] - tahun[0]]++;
    isi.querySelector('#grTahun').innerHTML = grafikBatang({ label: 'Jumlah temuan per tahun menurut sumber', judulKategori: 'Tahun', satuan: 'temuan', kategori: tahun.map(String),
      seri: [{ nama: 'LPK', warna: '#3987e5', nilai: lpk }, { nama: 'SMART Patrol', warna: '#d95926', nilai: smart }] });
    var pk = R.jenis.per_kategori;
    isi.querySelector('#grKat').innerHTML = batangDatar(['Flora', 'Aves', 'Anggrek', 'Fauna lain', 'Mamalia'].map(function (k) { return [K.NAMA_KAT[k], pk[k] || 0, K.n(pk[k] || 0)]; }), 'jenis');
    var tl = R.takson_lain;
    isi.querySelector('#grTingkat').innerHTML = batangDatar([['Jenis', R.jenis.total], ['Nama lokal', tl.nama_lokal], ['Marga', tl.marga], ['Kelompok', tl.kelompok]].map(function (b) { return [b[0], b[1], K.n(b[1])]; }), 'takson');

    var per = {}; mx.resor.forEach(function (r) { per[r] = { nama: r, n: 0, keg: {}, burung: {}, satwa: {}, tumbuhan: {}, lindung: {} }; });
    for (i = 0; i < T.n; i++) {
      var o = per[Q.resor[C.res[i]]]; if (!o) continue;
      o.n++; o.keg[C.k[i]] = 1;
      if (C.t[i] < 0) continue;
      var x = T.taksa[C.t[i]]; if (x.t !== 'jenis') continue;
      var g = K.kelompokDari[x.k]; if (g && o[g.id]) o[g.id][x.tid] = 1;
      if (x.p106 === 'Dilindungi') o.lindung[x.tid] = 1;
    }
    function jm(o) { return Object.keys(o).length; }
    var baris = mx.resor.map(function (r) { var o = per[r]; return { nama: r, n: o.n, keg: jm(o.keg), burung: jm(o.burung), satwa: jm(o.satwa), tumbuhan: jm(o.tumbuhan), lindung: jm(o.lindung) }; });
    function kol(id, judul, tip) { return { id: id, judul: judul, n: true, tip: tip, nilai: function (b) { return b[id]; }, isi: function (b) { return K.n(b[id]); } }; }
    var tb = K.tabel({ label: 'Temuan dan jenis per resor', perHal: 10, urut: { id: 'n', turun: true }, kepalaBaris: true, baris: baris, kolom: [
      { id: 'nama', judul: 'Resor', nilai: function (b) { return b.nama; }, isi: function (b) { return esc(b.nama); } },
      kol('n', 'Temuan'), kol('keg', 'Kegiatan', 'Jumlah LPK yang punya temuan di resor ini, ditambah SMART Patrol'), kol('burung', 'Jenis burung'), kol('satwa', 'Jenis mamalia dan fauna lain'), kol('tumbuhan', 'Jenis tumbuhan dan anggrek'), kol('lindung', 'Jenis dilindungi')] });
    isi.querySelector('#tbResor').appendChild(tb.el);
  }

  /* ---------- 04 ekosistem ---------- */
  function pasangEko(isi, T) {
    var C = T.C, Q = T.Q, eko = {}, tut = {}, i;
    function catat(m, kunci, i) { var o = m[kunci] || (m[kunci] = { kunci: kunci, n: 0, res: {}, a: C.th[i], b: C.th[i] }); o.n++; if (Q.resor[C.res[i]]) o.res[Q.resor[C.res[i]]] = 1; o.a = Math.min(o.a, C.th[i]); o.b = Math.max(o.b, C.th[i]); }
    for (i = 0; i < T.n; i++) { if (C.eko[i]) catat(eko, C.eko[i], i); if (C.tut[i]) catat(tut, C.tut[i], i); }
    function tabel(m, label, namaKol, pecah) {
      return K.tabel({ label: label, perHal: 10, urut: { id: 'n', turun: true }, kepalaBaris: true, baris: Object.keys(m).map(function (k) { return m[k]; }), kolom: [
        { id: 'nama', judul: namaKol, nilai: function (o) { return pecah(o.kunci)[0]; }, isi: function (o) { var p = pecah(o.kunci); return esc(p[0]) + (p[1] ? '<small>' + esc(p[1]) + '</small>' : ''); } },
        { id: 'n', judul: 'Titik', n: true, nilai: function (o) { return o.n; }, isi: function (o) { return K.n(o.n); } },
        { id: 'res', judul: 'Resor', nilai: function (o) { return Object.keys(o.res).length; }, isi: function (o) { return esc(Object.keys(o.res).sort().join(', ') || '-'); } },
        { id: 'th', judul: 'Tahun', nilai: function (o) { return o.b; }, isi: function (o) { return rentang([o.a, o.b]); }, kelas: 'sempit' }] }).el;
    }
    isi.querySelector('#tbEko').appendChild(tabel(eko, 'Tipe ekosistem', 'Tipe ekosistem', function (k) { var p = k.split(' > '); return [p[p.length - 1], p.slice(0, -1).join(', ')]; }));
    isi.querySelector('#tbTut').appendChild(tabel(tut, 'Tutupan lahan', 'Tutupan lahan', function (k) { var p = k.split(' > '); return [p.slice(1).join(' > ') || p[0], p.length > 1 ? p[0] : '']; }));
  }

  /* ---------- 05 tabel model ---------- */
  function pasangModel(isi, T, mx) {
    var baris = mx.model.map(function (m) { return { m: m, x: T.tid[m.tid] }; }).filter(function (b) { return b.x; });
    var PERINGKAT = { tinggi: 4, berguna: 3, rendah: 2, indikatif: 1 };
    var tb = K.tabel({ label: 'Model sebaran habitat per jenis', perHal: 15, urut: { id: 'andal', turun: true }, kepalaBaris: true, baris: baris, kolom: [
      { id: 'nama', judul: 'Jenis', nilai: function (b) { return namaPolos(b.x).toLowerCase(); }, isi: function (b) { return tautJenis(b.x); } },
      { id: 'kat', judul: 'Kelompok', nilai: function (b) { return K.NAMA_KAT[b.x.k]; }, isi: function (b) { return esc(K.NAMA_KAT[b.x.k]); } },
      { id: 'n', judul: 'Lokasi unik', n: true, nilai: function (b) { return b.m.n; }, isi: function (b) { return K.n(b.m.n); } },
      { id: 'au', judul: 'AUC uji', n: true, nilai: function (b) { return b.m.au; }, isi: function (b) { return K.n(b.m.au, 2); } },
      { id: 'andal', judul: 'Keandalan', tip: 'Model penuh diurutkan menurut kelas lalu AUC uji. Model indikatif ada di bawahnya.', nilai: function (b) { return PERINGKAT[kelasAndal(b.m)] * 10 + b.m.au; }, isi: function (b) { return lencanaAndal(b.m); } },
      { id: 'luas', judul: 'Habitat sesuai (ha)', n: true, tip: 'Luas sel di dalam kawasan dengan kesesuaian sama atau di atas ambang P10', nilai: function (b) { return b.m.luas; }, isi: function (b) { return K.n(b.m.luas); } },
      { id: 'bag', judul: 'Bagian kawasan', n: true, nilai: function (b) { return b.m.luas / mx.luas_kawasan_ha; }, isi: function (b) { return K.n(b.m.luas / mx.luas_kawasan_ha * 100, 1) + ' %'; } },
      { id: 'pb', judul: 'Peubah terkuat', nilai: function (b) { return mx.peubah[b.m.kon[0][0]]; }, isi: function (b) { return esc(mx.peubah[b.m.kon[0][0]]) + '<small>' + K.n(b.m.kon[0][1], 0) + ' % pengaruh</small>'; } }] });
    isi.querySelector('#tbModel').appendChild(tb.el);
    isi.querySelector('#mdAlat').appendChild(K.unduhan('Unduh ringkasan model (CSV)', 'model-maxent-tn-tambora', function () {
      return { baris: tb.baris(), kolom: [
        { judul: 'Nama ilmiah', nilai: function (b) { return b.x.i; } }, { judul: 'Nama Indonesia', nilai: function (b) { return b.x.n; } }, { judul: 'Kelompok', nilai: function (b) { return b.x.k; } },
        { judul: 'Lokasi unik', nilai: function (b) { return b.m.n; } }, { judul: 'Temuan berkoordinat', nilai: function (b) { return b.m.nr; } }, { judul: 'Model', nilai: function (b) { return b.m.m; } },
        { judul: 'Fitur', nilai: function (b) { return b.m.f; } }, { judul: 'Pengali regularisasi', nilai: function (b) { return b.m.b; } }, { judul: 'AUC latih', nilai: function (b) { return b.m.al; } },
        { judul: 'AUC uji', nilai: function (b) { return b.m.au; } }, { judul: 'Simpangan baku AUC uji', nilai: function (b) { return b.m.sb; } }, { judul: 'Cara uji', nilai: function (b) { return b.m.cu; } },
        { judul: 'Keandalan', nilai: function (b) { return kelasAndal(b.m); } }, { judul: 'Ambang P10', nilai: function (b) { return b.m.p10; } }, { judul: 'Habitat sesuai (ha)', nilai: function (b) { return b.m.luas; } },
        { judul: 'Masuk peta jumlah jenis', nilai: function (b) { return b.m.tumpuk ? 'ya' : 'tidak'; } }] };
    }));
  }

  /* ================= HALAMAN SATU JENIS ================= */
  function halJenis(isi, tid) {
    var g = K.giliran;
    K.memuat(isi, 'Memuat temuan jenis ini…');
    Promise.all([K.siapTemuan(), K.semua(['batas.json', 'maxent.json']), K.siapKamusJenis().catch(function () { return { kamus: null }; })]).then(function (h) {
      if (g !== K.giliran) return;
      var T = h[0], x = T.tid[tid];
      if (!x) {
        document.title = 'Jenis tidak ditemukan · Keanekaragaman Hayati';
        isi.innerHTML = '<div class="galat"><h1 style="font-size:24px;margin-bottom:8px">Jenis tidak ditemukan</h1><p>Tidak ada takson dengan kode "' + esc(tid || '') + '" di data terkurasi. Tautan mungkin salah ketik, atau namanya berubah setelah data diolah ulang.</p><p style="margin-top:14px"><a class="tombol" href="#/jenis">Buka kamus jenis</a></p></div>';
        return;
      }
      var kamus = h[2].kamus;
      gambarJenis(isi, T, x, h[1][0], h[1][1], kamus && kamus.jenis ? kamus.jenis[x.tid] || null : null, (kamus && kamus.pustaka) || {});
    }).catch(function (e) { K.galat(isi, e, K.muatUlang); });
  }

  /* ---------- bagian "Tentang jenis ini": keterangan, foto, dan sumbernya dari kamus jenis ---------- */
  var LISENSI = { 'cc0': 'CC0', 'cc-by': 'CC BY', 'cc-by-sa': 'CC BY-SA', 'cc-by-nc': 'CC BY-NC' };
  function tautLuar(u, teks) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + teks + '</a>'; }
  function sumberJenis(s, pustaka) {
    var p = pustaka[s.k] || {};
    if (p.balai) return '<li><i>' + esc(p.j) + '</i>, ' + esc(p.t) + (s.hl ? ', ' + esc(s.hl) : '') + '</li>';
    return '<li>' + esc(p.j || s.k) + (s.u ? ': ' + tautLuar(s.u, esc(s.j || s.u.replace(/^https?:\/\//, ''))) : '') + '</li>';
  }
  function kreditFoto(f, pustaka) {
    var asal = pustaka[f.a] || {};
    if (asal.balai) return 'Foto dari dokumen Balai TN Tambora: <i>' + esc(asal.j) + '</i>' + (f.hl ? ', ' + esc(f.hl) : '') + '.';
    return 'Foto: ' + esc(f.p || 'pemotret tidak dicantumkan di sumber') + ' · ' + esc(LISENSI[f.l] || f.l) + (f.u ? ' · ' + tautLuar(f.u, esc(asal.j || 'sumber foto')) : '') + (f.ket ? '<br>' + esc(f.ket) : '');
  }
  function tentang(x, kj, pustaka, judul, no) {
    var h = '<section class="bagian" aria-labelledby="j-tentang"><div class="bagian-kepala"><span class="bagian-no">' + no + '</span><h2 id="j-tentang">Tentang jenis ini</h2></div>';
    if (!kj) return h + '<div class="catatan-data">' + K.ikon.info + '<div><p><b>Keterangan dan foto belum termuat.</b></p><p>Berkas data/kehati/kamus_jenis.json tidak terbaca. Muat ulang halaman untuk melihat keterangan dan foto jenis ini.</p></div></div></section>';
    var kiri = '', kanan;
    if (kj.d && kj.d.length) kiri += '<div class="tentang-teks">' + kj.d.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>';
    else kiri += '<div class="catatan-data">' + K.ikon.info + '<div><p><b>Belum ada keterangan untuk jenis ini.</b></p><p>Jenis ini tidak dibahas di dokumen Balai, dan belum ada sumber terbuka yang memuat keterangannya saat kamus ini disusun.</p></div></div>';
    if (kj.c && kj.c.length) kiri += '<div class="catatan-data tentang-catatan">' + K.ikon.info + '<div><p><b>Catatan</b></p><ul>' + kj.c.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div></div>';
    if (kj.sama) kiri += '<p style="margin-top:12px"><a class="chip" href="#/jenis/' + encodeURIComponent(kj.sama) + '">Buka halaman <span class="ilmiah">' + esc(kj.samaNama || kj.sama) + '</span></a></p>';
    if (kj.ds && kj.ds.length) kiri += '<div class="tentang-sumber"><b>Sumber keterangan</b><ul>' + kj.ds.map(function (s) { return sumberJenis(s, pustaka); }).join('') + '</ul></div>';
    if (kj.tl && kj.tl.length) kiri += '<p class="chip-deret" style="margin-top:16px">' + kj.tl.map(function (t) { return '<a class="chip" href="' + esc(t[1]) + '" target="_blank" rel="noopener">' + esc(t[0]) + '</a>'; }).join('') + '</p>';
    var f = kj.f;
    if (f) kanan = '<figure class="foto-jenis"><img src="' + esc(K.DASAR + f.s) + '" alt="Foto ' + esc(x.n ? x.n + ' (' + x.i + ')' : judul) + '" width="' + f.w + '" height="' + f.h + '" fetchpriority="high" decoding="async"><figcaption>' + kreditFoto(f, pustaka) + '</figcaption></figure>';
    else kanan = '<div class="catatan-data">' + K.ikon.info + '<div><p><b>Belum ada foto.</b></p><p>Dokumen Balai belum memuat foto jenis ini, dan belum ditemukan foto berlisensi CC0, CC BY, CC BY-SA, atau CC BY-NC di iNaturalist, GBIF, maupun Wikimedia Commons. Foto dari kegiatan lapangan berikutnya bisa ditambahkan ke kamus.</p></div></div>';
    return h + '<div class="tentang"><div>' + kiri + '</div>' + kanan + '</div></section>';
  }

  function gambarJenis(isi, T, x, batas, mx, kj, pustaka) {
    var C = T.C, Q = T.Q, idx = T.perTakson[x._i] || [], m = null, i;
    mx.model.forEach(function (o) { if (o.tid === x.tid) m = o; });
    var grup = K.kelompokDari[x.k] || K.KELOMPOK[4];
    var judul = x.i ? namaPolos(x) : (x.n || x.tid);
    /* jenis berjudul nama Indonesia seperti kartu di kamus jenis; nama ilmiah di bawahnya */
    var namaUtama = x.t === 'jenis' ? (x.n || (x.l && x.l[0]) || '') : '';
    document.title = (namaUtama || judul) + ' · Kamus jenis · TN Gunung Tambora';
    /* warna kepala halaman mengikuti kelompok jenis */
    var ka = (kj && kj.ka) || x.ka;
    var kel = { Aves: 'burung', Mamalia: 'satwa', Reptil: 'satwa', Serangga: 'satwa', 'Fauna lain': 'satwa', Flora: 'tumbuhan', Anggrek: 'tumbuhan' }[ka || x.k];
    if (kel) document.body.setAttribute('data-kel', kel);
    var labelKel = (K.namaKelJenis && K.namaKelJenis[ka]) || K.NAMA_KAT[x.k] || x.k;
    var no = 0;
    function nomor() { no++; return (no < 10 ? '0' : '') + no; }
    var individu = 0, adaJumlah = 0, perTahun = {}, kegSet = {}, perResor = {}, perTemuan = {};
    idx.forEach(function (i) {
      if (C.j[i] !== null) { individu += C.j[i]; adaJumlah++; }
      perTahun[C.th[i]] = (perTahun[C.th[i]] || 0) + 1; kegSet[C.k[i]] = 1;
      var rs = Q.resor[C.res[i]] || 'Resor tidak tercatat', jt = Q.temuan[C.jt[i]];
      perResor[rs] = (perResor[rs] || 0) + 1; perTemuan[jt] = (perTemuan[jt] || 0) + 1;
    });
    function deretBatang(o) { return Object.keys(o).map(function (k) { return [k.charAt(0).toUpperCase() + k.slice(1), o[k], K.n(o[k])]; }).sort(function (a, b) { return b[1] - a[1]; }); }
    var berkoordinat = idx.filter(function (i) { return C.lat[i] !== null; });
    var namaLain = [x.i ? x.n : '', x.e].concat(x.l || []).filter(function (v, j, a) { return v && v !== judul && a.indexOf(v) === j; });
    var tingkat = { jenis: 'Teridentifikasi sampai jenis', marga: 'Teridentifikasi sampai marga', 'nama lokal': 'Baru bernama lokal, nama ilmiah belum dipastikan', kelompok: 'Tercatat sebagai kelompok, bukan jenis' }[x.t] || x.t;

    var h = '<section class="bagian bagian--awal"><p class="remah"><a href="#/jenis">' + K.ikon.kembali + '<span>Kamus jenis</span></a></p>' +
      '<div class="jenis-kepala">' + (x.t === 'jenis' ? '<figure class="jenis-sampul">' + K.sampulJenis(x, kj, false) + '</figure>' : '') +
      '<div class="jenis-kepala-teks"><p class="jenis-jenis">' + esc([labelKel, x.f].filter(Boolean).join(' · ')) + '</p>' +
      (namaUtama ? '<h1 class="judul-hal">' + esc(namaUtama) + '<small><span class="ilmiah">' + esc(x.i) + '</span>' +
        (namaLain.filter(function (v) { return v !== namaUtama; }).length ? ' · ' + esc(namaLain.filter(function (v) { return v !== namaUtama; }).join(' · ')) : '') + '</small></h1>'
        : '<h1 class="judul-hal">' + K.namaTakson(x) + (namaLain.length ? '<small>' + esc(namaLain.join(' · ')) + '</small>' : '') + '</h1>') +
      '<p class="jenis-status">' + (lencana(x) || '') + '<span class="chip">' + esc(tingkat) + '</span></p></div></div>' +
      '<div class="angka-deret">' +
      kartu('Temuan', K.n(x.nr), K.n(x.nk) + ' berkoordinat') +
      kartu('Lokasi unik', K.n(x.nl), 'sel 50 m berbeda') +
      kartu('Resor', K.n(x.res.length), x.res.length ? esc(x.res.join(', ')) : 'resor tidak tercatat') +
      kartu('Tahun', x.th ? (x.th[0] === x.th[1] ? String(x.th[0]) : x.th[0] + '–' + x.th[1]) : '-', K.n(Object.keys(kegSet).length) + ' kegiatan') +
      (adaJumlah ? kartu('Individu tercatat', K.nd(individu, 0), 'jumlah dari ' + K.n(adaJumlah) + ' temuan yang mencatat angka') : '') +
      '</div></section>';

    if (x.t === 'jenis') h += tentang(x, kj, pustaka, judul, nomor());

    /* peta dan model */
    h += '<section class="bagian" aria-labelledby="j-sebar"><div class="bagian-kepala"><span class="bagian-no">' + nomor() + '</span><h2 id="j-sebar">' + (m ? 'Sebaran temuan dan kesesuaian habitat' : 'Sebaran temuan') + '</h2>' +
      '<p>' + (m ? 'Titik menunjukkan lokasi temuan. Lapisan warna menunjukkan kesesuaian habitat menurut model ' + (m.m === 'penuh' ? 'penuh' : 'sederhana yang hanya indikatif') + ' dari ' + K.n(m.n) + ' lokasi unik.'
        : (berkoordinat.length ? 'Titik menunjukkan lokasi temuan berkoordinat.' : 'Temuan takson ini berasal dari daftar jenis di laporan yang tidak mencantumkan koordinat, jadi tidak ada titik untuk dipetakan.')) + '</p></div>';
    var adaPeta = !!m || berkoordinat.length > 0;
    if (m) {
      h += '<form class="saring saring--baris" id="jsKendali" aria-label="Tampilan lapisan model">' +
        '<fieldset class="pilih-deret"><legend>Lapisan model</legend>' +
        '<label class="pilih"><input type="radio" name="mode" value="kontinu" checked>Kesesuaian 0 sampai 1</label>' +
        '<label class="pilih"><input type="radio" name="mode" value="p10">Habitat sesuai (di atas ambang P10)</label>' +
        '<label class="pilih"><input type="radio" name="mode" value="tanpa">Tanpa lapisan</label>' +
        '<label class="pilih"><input type="checkbox" name="titik" checked><span class="tanda tanda--' + grup.id + '"></span>Titik temuan</label></fieldset>' +
        '<div class="isian isian--sempit"><label for="jsOpa">Kepekatan lapisan</label><input id="jsOpa" type="range" min="20" max="100" step="5" value="80"></div>' +
        '<p class="saring-hasil" id="jsHasil" role="status"></p></form>';
    }
    if (adaPeta) h += '<div class="grid ' + (m ? 'grid-2 jenis-kisi' : '') + '"><div class="peta-wadah"><div class="peta peta--besar" id="jsPeta" role="application" aria-label="Peta sebaran ' + esc(judul) + '"></div><div class="peta-legenda" id="jsLegenda"></div></div>';
    if (m) {
      var bag = m.luas / mx.luas_kawasan_ha * 100;
      h += '<div class="kartu model-kartu"><h3 class="kartu-judul">' + K.ikon.peta + 'Model MaxEnt<span class="kanan">' + lencanaAndal(m, 'keandalan') + '</span></h3>' +
        '<p class="model-andal">' + ANDAL[kelasAndal(m)] + '</p>' +
        '<dl class="fakta">' +
        '<dt>Lokasi unik</dt><dd>' + K.n(m.n) + ' sel 50 m, dari ' + K.n(m.nr) + ' temuan berkoordinat</dd>' +
        '<dt>Pengaturan</dt><dd>Fitur ' + FITUR[m.f] + ', pengali regularisasi ' + K.nd(m.b, 1) + '</dd>' +
        '<dt>AUC latih</dt><dd>' + K.n(m.al, 3) + '</dd>' +
        '<dt>AUC uji</dt><dd>' + K.n(m.au, 3) + (m.sb !== null && m.sb !== undefined ? ' ± ' + K.n(m.sb, 3) : '') + ' <span class="redup">(' + esc(m.cu) + ')</span></dd>' +
        '<dt>Ambang P10</dt><dd>' + K.n(m.p10, 3) + ' <span class="redup">(90 % lokasi temuan berada di atas nilai ini)</span></dd>' +
        '<dt>Habitat sesuai</dt><dd><b>' + K.n(m.luas) + ' ha</b>, ' + K.n(bag, 1) + ' % kawasan' + (m.el ? '<br>Elevasi ' + K.n(m.el[0]) + ' sampai ' + K.n(m.el[2]) + ' m dpl, nilai tengah ' + K.n(m.el[1]) + ' m' : '') + '</dd>' +
        '</dl>' +
        '<h4 class="sub-judul" style="margin-top:16px">Pengaruh peubah lingkungan</h4>' + batangDatar(m.kon.filter(function (k) { return k[1] > 0; }).map(function (k) { return [mx.peubah[k[0]], k[1], K.n(k[1], 0) + ' %']; }), '% pengaruh') +
        '<h4 class="sub-judul" style="margin-top:16px">Habitat sesuai per resor</h4>' + batangDatar(mx.resor.map(function (r) { return [r, m.resor[r] || 0, K.n(m.resor[r] || 0) + ' ha']; }), 'ha') +
        (Object.keys(m.tl || {}).length ? '<h4 class="sub-judul" style="margin-top:16px">Tutupan lahan di habitat sesuai</h4>' + batangDatar(Object.keys(m.tl).map(function (k) { return [mx.kelas_tutupan[k] || k, m.tl[k], K.n(m.tl[k], 0) + ' %']; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5), '% luas habitat sesuai') : '') +
        '<p class="kartu-catatan">Pengaruh peubah diukur dari turunnya AUC saat nilai peubah itu diacak. ' + (m.tumpuk ? 'Model ini ikut dihitung di peta jumlah jenis.' : 'Model ini tidak ikut dihitung di peta jumlah jenis karena ' + (m.m !== 'penuh' ? 'hanya indikatif' : 'keandalannya rendah') + '.') + ' Cara baca selengkapnya ada di <a href="#/kamus/maxent">Kamus</a>.</p></div>';
    }
    if (adaPeta) h += '</div>';
    if (!m) {
      h += '<div class="catatan-data"' + (adaPeta ? ' style="margin-top:16px"' : '') + '>' + K.ikon.info + '<div><p><b>Belum ada model sebaran habitat untuk takson ini.</b></p><p>' +
        (x.t !== 'jenis' ? 'Model hanya dibuat untuk takson yang teridentifikasi sampai tingkat jenis. Takson ini ' + esc(tingkat.toLowerCase()) + '.'
          : (x.nl ? 'Model dibuat mulai 5 lokasi unik, dan jenis ini baru tercatat di ' + K.n(x.nl) + ' lokasi. Tambahan temuan berkoordinat dari kegiatan berikutnya akan membuatnya bisa dimodelkan.'
            : 'Model dibuat mulai 5 lokasi unik, dan jenis ini belum punya satu pun temuan berkoordinat. Catat koordinatnya pada perjumpaan berikutnya supaya bisa dipetakan dan dimodelkan.')) + '</p></div></div>';
    }
    h += '</section>';

    /* temuan */
    var thn = Object.keys(perTahun).map(Number).sort(), deretTahun = [];
    if (thn.length) for (i = thn[0]; i <= thn[thn.length - 1]; i++) deretTahun.push(i);
    h += '<section class="bagian" aria-labelledby="j-temuan"><div class="bagian-kepala"><span class="bagian-no">' + nomor() + '</span><h2 id="j-temuan">Semua temuan</h2>' +
      '<p>' + K.n(idx.length) + ' temuan dari ' + K.n(Object.keys(kegSet).length) + ' kegiatan. Nama di sumber ditampilkan apa adanya supaya bisa dicocokkan kembali dengan laporannya.</p></div>' +
      (idx.length > 1 ? '<div class="grid grid-2" style="margin-bottom:18px">' +
        (deretTahun.length > 1 ? '<div class="kartu"><h3 class="kartu-judul">' + K.ikon.grafik + 'Temuan per tahun</h3>' +
          grafikBatang({ label: 'Jumlah temuan ' + judul + ' per tahun', judulKategori: 'Tahun', satuan: 'temuan', tinggi: 230, kategori: deretTahun.map(String), seri: [{ nama: 'Temuan', warna: grup.warna === '#eee8d5' ? '#929381' : grup.warna, nilai: deretTahun.map(function (t) { return perTahun[t] || 0; }) }] }) +
          '<p class="kartu-catatan">Jumlah temuan mengikuti jumlah kegiatan pada tahun itu, jadi grafik ini bukan tren populasi.</p></div>'
          : '<div class="kartu"><h3 class="kartu-judul">' + K.ikon.grafik + 'Temuan per tahun</h3><p class="model-andal">Semua temuan takson ini tercatat pada tahun ' + (deretTahun[0] || '-') + ', jadi belum ada deret tahun untuk digambar.</p></div>') +
        '<div class="kartu"><h3 class="kartu-judul">' + K.ikon.tabel + 'Temuan per resor dan cara tercatat</h3>' +
        '<h4 class="sub-judul" style="margin-top:0">Resor</h4>' + batangDatar(deretBatang(perResor), 'temuan') +
        '<h4 class="sub-judul">Jenis temuan</h4>' + batangDatar(deretBatang(perTemuan), 'temuan') + '</div></div>' : '') +
      '<div id="jsTabel"></div><div class="tabel-alat" id="jsAlat"></div></section>';

    /* identitas */
    var fakta = [];
    if (x.f) fakta.push(['Famili', esc(x.f)]);
    if (kj && kj.nu) fakta.push(['Nama Inggris', esc(kj.nu)]);
    if (kj && kj.nt) fakta.push(['Nama diterima menurut GBIF', '<span class="ilmiah">' + esc(kj.nt) + '</span>']);
    if (x.l && x.l.length) fakta.push(['Nama lokal', esc(x.l.join(', '))]);
    if (x.sin && x.sin.length) fakta.push(['Nama lain di sumber data', esc(x.sin.join(', '))]);
    if (x.iucn) fakta.push(['Daftar Merah IUCN', esc((K.IUCN[x.iucn] || x.iucn) + ' (' + x.iucn + ')')]);
    if (x.p106) fakta.push(['Permen LHK P.106/2018', esc(x.p106)]);
    if (x.cites) fakta.push(['CITES', esc(x.cites)]);
    if (x.h) fakta.push([x.k === 'Aves' ? 'Status hunian' : 'Habitus', esc(x.h)]);
    if (x.sb) fakta.push(['Sebaran atau asal', esc(x.sb === 'Native' ? 'Asli' : (x.sb === 'Introduced' ? 'Asing (introduksi)' : x.sb))]);
    if (x.inv) fakta.push(['Jenis asing invasif', 'Ya, menurut daftar induk']);
    fakta.push(['Rujukan nama', esc({ 'daftar induk': 'Daftar induk kehati TN Tambora', 'data model SMART': 'Kamus data model SMART Balai TN Tambora', 'sumber data': 'Nama dari sumber data, belum ada di daftar induk' }[x.sn] || x.sn)]);
    if (x.rj) fakta.push(['Rujukan status', /^https?:\/\//.test(x.rj) ? '<a href="' + esc(x.rj) + '" rel="noopener">' + esc(x.rj.replace(/^https?:\/\//, '').split('/')[0]) + '</a>' : esc(x.rj)]);
    h += '<section class="bagian" aria-labelledby="j-id"><div class="bagian-kepala"><span class="bagian-no">' + nomor() + '</span><h2 id="j-id">Identitas dan status</h2></div>' +
      '<dl class="fakta" style="max-width:860px">' + fakta.map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>'; }).join('') + '</dl>' +
      '<p class="kartu-catatan">Status perlindungan dan Daftar Merah diambil dari daftar induk kehati yang disusun Balai. Takson yang tidak ada di daftar induk belum punya status di sini.</p></section>';

    isi.innerHTML = h;
    function kartu(label, nilai, sub) { return '<div class="angka"><div class="angka-label">' + label + '</div><div class="angka-nilai">' + nilai + '</div><div class="angka-sub">' + sub + '</div></div>'; }

    /* tabel temuan */
    function kegiatan(i) { var id = Q.kegiatan[C.k[i]], kg = T.kegId[id]; return kg ? kg.judul : id; }
    var tb = K.tabel({ label: 'Temuan ' + judul, perHal: 15, urut: { id: 'tgl', turun: true }, baris: idx, kolom: [
      { id: 'tgl', judul: 'Tanggal', nilai: function (i) { return C.tgl[i] || String(C.th[i]); }, isi: function (i) { return C.tgl[i] ? esc(K.tgl(C.tgl[i])) : C.th[i]; }, kelas: 'sempit' },
      { id: 'res', judul: 'Resor', nilai: function (i) { return Q.resor[C.res[i]]; }, isi: function (i) { return esc(Q.resor[C.res[i]] || '-'); }, kelas: 'sempit' },
      { id: 'keg', judul: 'Kegiatan', nilai: kegiatan, isi: function (i) { return esc(kegiatan(i)); }, kelas: 'lebar' },
      { id: 'jt', judul: 'Jenis temuan', nilai: function (i) { return Q.temuan[C.jt[i]]; }, isi: function (i) { return esc(Q.temuan[C.jt[i]]) + (C.tt[i] ? '<small>tingkat ' + esc(C.tt[i]) + '</small>' : ''); } },
      { id: 'j', judul: 'Jumlah', n: true, nilai: function (i) { return C.j[i]; }, isi: function (i) { return C.j[i] === null ? '' : K.nd(C.j[i], 1) + (Q.satuan[C.sat[i]] ? ' ' + esc(Q.satuan[C.sat[i]]) : ''); } },
      { id: 'lat', judul: 'Lintang', n: true, nilai: function (i) { return C.lat[i]; }, isi: function (i) { return C.lat[i] === null ? '' : K.n(C.lat[i], 5); } },
      { id: 'lon', judul: 'Bujur', n: true, nilai: function (i) { return C.lon[i]; }, isi: function (i) { return C.lon[i] === null ? '' : K.n(C.lon[i], 5); } },
      { id: 'pos', judul: 'Koordinat', nilai: function (i) { return Q.posisi[C.pos[i]]; }, isi: function (i) { return esc(POSISI[Q.posisi[C.pos[i]]] || ''); } },
      { id: 'ns', judul: 'Nama di sumber', nilai: function (i) { return C.ns[i]; }, isi: function (i) { return esc(C.ns[i]); }, kelas: 'lebar' }] });
    isi.querySelector('#jsTabel').appendChild(tb.el);
    isi.querySelector('#jsAlat').appendChild(K.unduhan('Unduh temuan jenis ini (CSV)', 'temuan-' + x.tid, function () {
      return { baris: tb.baris(), kolom: [
        { judul: 'ID temuan', nilai: function (i) { return C.id[i]; } }, { judul: 'Nama ilmiah', nilai: function () { return x.i; } }, { judul: 'Nama di sumber', nilai: function (i) { return C.ns[i]; } },
        { judul: 'Tanggal', nilai: function (i) { return C.tgl[i]; } }, { judul: 'Tahun', nilai: function (i) { return C.th[i]; } }, { judul: 'Resor', nilai: function (i) { return Q.resor[C.res[i]]; } },
        { judul: 'Kegiatan', nilai: kegiatan }, { judul: 'Sumber', nilai: function (i) { return Q.sumber[C.s[i]]; } }, { judul: 'Jenis temuan', nilai: function (i) { return Q.temuan[C.jt[i]]; } },
        { judul: 'Jumlah', nilai: function (i) { return C.j[i]; } }, { judul: 'Satuan', nilai: function (i) { return Q.satuan[C.sat[i]]; } },
        { judul: 'Bujur', nilai: function (i) { return C.lon[i]; } }, { judul: 'Lintang', nilai: function (i) { return C.lat[i]; } }, { judul: 'Posisi koordinat', nilai: function (i) { return Q.posisi[C.pos[i]]; } },
        { judul: 'Jarak di luar kawasan (m)', nilai: function (i) { return C.jl[i]; } }, { judul: 'Grid 1 km', nilai: function (i) { return C.g[i]; } }, { judul: 'Petak atau titik', nilai: function (i) { return C.plot[i]; } }, { judul: 'Keterangan', nilai: function (i) { return C.atr[i]; } }] };
    }));

    /* peta */
    var elPeta = isi.querySelector('#jsPeta'), lg = isi.querySelector('#jsLegenda');
    if (!elPeta) return;
    if (!K.petaAda()) { K.petaGalat(elPeta); if (m) Array.prototype.forEach.call(isi.querySelectorAll('#jsKendali input'), function (e) { e.disabled = true; }); return; }
    var L = window.L, peta = K.peta(elPeta, { batas: batas }), kanvas = L.canvas({ padding: 0.4, tolerance: 8 }), lapisTitik = L.layerGroup().addTo(peta.map), lapisModel = null, raster = null;
    bersih.push(function () { peta.map.remove(); });
    var titik = {};
    berkoordinat.forEach(function (i) { var k = C.lat[i].toFixed(5) + ',' + C.lon[i].toFixed(5), o = titik[k] || (titik[k] = { lat: C.lat[i], lon: C.lon[i], idx: [] }); o.idx.push(i); });
    Object.keys(titik).forEach(function (k) {
      var o = titik[k];
      var mk = L.circleMarker([o.lat, o.lon], { renderer: kanvas, radius: Math.min(9, 3.5 + Math.sqrt(o.idx.length)), color: '#0a140f', weight: 1.5, fillColor: grup.kotak ? '#929381' : grup.warna, fillOpacity: 0.95 });
      mk.on('click', function () {
        var baris = o.idx.slice().sort(function (a, b) { return (C.tgl[b] || '').localeCompare(C.tgl[a] || ''); }).slice(0, 6).map(function (i) {
          return '<li>' + (C.tgl[i] ? esc(K.tgl(C.tgl[i])) : C.th[i]) + '<span class="redup"> · ' + esc(Q.temuan[C.jt[i]]) + (C.j[i] !== null ? ', ' + K.nd(C.j[i], 1) + (Q.satuan[C.sat[i]] ? ' ' + esc(Q.satuan[C.sat[i]]) : '') : '') + '</span></li>'; }).join('');
        L.popup({ maxWidth: 300 }).setLatLng([o.lat, o.lon]).setContent('<b>' + K.n(o.idx.length) + ' temuan di titik ini</b><div class="redup">' + (Q.resor[C.res[o.idx[0]]] ? 'Resor ' + esc(Q.resor[C.res[o.idx[0]]]) + ' · ' : '') + K.koord(o.lat, o.lon) + '<br>' + esc(POSISI[Q.posisi[C.pos[o.idx[0]]]] || '') + '</div><ul class="pop-daftar">' + baris + '</ul>' + (o.idx.length > 6 ? '<div class="redup">dan ' + K.n(o.idx.length - 6) + ' temuan lain, lihat tabel di bawah</div>' : '')).openOn(peta.map);
      });
      lapisTitik.addLayer(mk);
    });
    function legenda(mode) {
      lg.innerHTML = '<div class="lg-grup"><b>Temuan</b><span><i style="background:' + (grup.kotak ? '#929381' : grup.warna) + '"></i>' + K.n(Object.keys(titik).length) + ' titik</span></div>' +
        '<div class="lg-grup"><b>Batas</b><span><i class="batas" style="border-color:#f0cf7e"></i>Kawasan</span><span><i class="batas putus" style="border-color:#eee8d5"></i>Resor</span></div>' +
        (m && lapisModel ? '<div class="lg-grup"><b>' + (mode === 'p10' ? 'Kesesuaian di atas ambang P10' : 'Kesesuaian habitat') + '</b>' + (mode === 'p10' ? pitaJenjang(K.n(m.p10, 2), '1') : pitaJenjang('0', '1', m.p10)) + (mode === 'p10' ? '' : '<span class="redup">garis: ambang P10 ' + K.n(m.p10, 2) + '</span>') + '</div>' : '');
    }
    if (!m) { legenda(); return; }
    var form = isi.querySelector('#jsKendali'), hasil = isi.querySelector('#jsHasil');
    function pasangModel() {
      var mode = form.querySelector('input[name="mode"]:checked').value;
      if (lapisModel) { peta.map.removeLayer(lapisModel); lapisModel = null; }
      if (mode === 'tanpa' || !raster) { legenda(mode); return; }
      var url = K.gambarRaster(raster, function (v) {
        var t = Math.floor((v - 1) / 2), sesuai = (v - 1) % 2;
        if (mode === 'p10' && !sesuai) return null;
        var c = K.warnaJenjang(t / 24); return [c[0], c[1], c[2], 255];
      });
      lapisModel = L.imageOverlay(url, mx.batas, { pane: 'raster', opacity: +form.querySelector('#jsOpa').value / 100, className: 'raster-model', interactive: false }).addTo(peta.map);
      legenda(mode);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'titik') { if (e.target.checked) lapisTitik.addTo(peta.map); else peta.map.removeLayer(lapisTitik); }
      else if (e.target.name === 'mode') pasangModel();
    });
    form.querySelector('#jsOpa').addEventListener('input', function (e) { if (lapisModel) lapisModel.setOpacity(+e.target.value / 100); });
    function muatRaster() {
      hasil.textContent = 'Memuat peta model…';
      ambilRaster(K.DASAR + 'maxent/' + x.tid + '.webp').then(function (r) {
        if (!elPeta.isConnected) return;
        raster = r; hasil.textContent = ''; pasangModel();
      }).catch(function (e) {
        if (!elPeta.isConnected) return;
        hasil.innerHTML = '<span class="isian-galat">' + esc(e.message) + '</span> <button type="button" class="teks-tautan" id="jsUlang">Coba muat lagi</button>';
        hasil.querySelector('#jsUlang').addEventListener('click', muatRaster);
        legenda();
      });
    }
    legenda(); muatRaster();
  }

  K.potensi = { halJenis: halJenis, lepas: lepas };
  K.rute.potensi = {
    judul: 'Potensi kehati',
    muat: function (isi) { ikhtisar(isi); },
    ubah: function (arg) { var isi = document.getElementById('isi'); lepas(); window.scrollTo(0, 0); this.muat(isi, arg); isi.focus({ preventScroll: true }); },
    lepas: lepas
  };
})();
