/* Keanekaragaman Hayati · kalkulator teknis dan daftar generator RPK dan LPK.
   Semua hitungan berjalan di browser. Rumus dan sumbernya ada di Kamus metode dan rumus (kamus-data.js). */
(function () {
  'use strict';
  var K = window.KEHATI, esc = K.esc;

  /* ---------- pembantu hitung ---------- */
  function jml(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return s; }
  function unik(a) { var m = {}, o = []; a.forEach(function (x) { if (!(x in m)) { m[x] = 1; o.push(x); } }); return o; }
  function kelasH(h, kr) { return kr === 'wilhm' ? (h < 1 ? 'rendah' : (h <= 3 ? 'sedang' : 'tinggi')) : (h <= 2 ? 'rendah' : (h <= 3 ? 'sedang' : 'tinggi')); }
  function shannon(nilai) { var N = jml(nilai), H = 0; nilai.forEach(function (n) { if (n > 0) { var p = n / N; H -= p * Math.log(p); } }); return H; }
  function perlu(v, pesan) { if (!(v > 0)) throw new Error(pesan); return v; }

  /* ---------- pembaca berkas: CSV, TSV, ekspor kueri SMART (CSV), ekspor patroli SMART (XML atau ZIP) ---------- */
  function muatSkrip(src) {
    return new Promise(function (ok, gagal) {
      var s = document.createElement('script'); s.src = src; s.onload = ok;
      s.onerror = function () { gagal(new Error('Pustaka pembaca ZIP dari cdnjs.cloudflare.com tidak termuat. Periksa sambungan, atau ekstrak dulu berkas ZIP lalu pilih berkas XML di dalamnya.')); };
      document.head.appendChild(s);
    });
  }
  function anak(el, nama) { return Array.prototype.filter.call(el.children, function (c) { return c.localName === nama; }); }
  function bacaPatroli(teks, kamus) {
    var doc = new DOMParser().parseFromString(teks, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Isi XML rusak atau terpotong, jadi tidak bisa dibaca.');
    if (doc.documentElement.localName !== 'patrol') throw new Error('Berkas XML ini bukan ekspor patroli SMART karena elemen patrol tidak ditemukan.');
    var baris = [];
    Array.prototype.forEach.call(doc.getElementsByTagNameNS('*', 'days'), function (d) {
      var tanggal = d.getAttribute('date') || '';
      anak(d, 'waypoints').forEach(function (w) {
        Array.prototype.forEach.call(w.getElementsByTagNameNS('*', 'observations'), function (ob) {
          var jenis = '', jumlah = '', rinci = 0, adaRinci = false, jarak = '', plot = '';
          anak(ob, 'attributes').forEach(function (a) {
            var kunci = a.getAttribute('attributeKey') || '';
            var item = anak(a, 'itemKey')[0], dv = anak(a, 'dValue')[0], sv = anak(a, 'sValue')[0];
            if (/^jenis(satwa|tumbuhan)/.test(kunci) && (item || sv)) {
              var k = item ? item.textContent.trim() : '';
              jenis = item ? (kamus[kunci + '|' + k] || kamus[kunci + '|' + k + '.'] || kamus[kunci + '|' + k.replace(/\.$/, '')] || k.split('.').filter(Boolean).pop()) : sv.textContent.trim();
            } else if ((kunci === 'jumlah' || kunci === 'jumlahekor' || kunci === 'jumlahindividu') && dv) jumlah = dv.textContent.trim();
            /* data model Metode Teknis memecah jumlah menjadi dewasa dan anakan: dijumlahkan */
            else if (/^jumlah(dewasa|anakan|jantan|betina|remaja)/.test(kunci) && dv) { var nilai = parseFloat(dv.textContent); if (isFinite(nilai)) { rinci += nilai; adaRinci = true; } }
            else if (kunci === 'jarakkesatwam' && dv) jarak = dv.textContent.trim();
            else if ((kunci === 'noplot' || kunci === 'nopetak' || kunci === 'notitik') && sv) plot = sv.textContent.trim();
          });
          if (jumlah === '' && adaRinci) jumlah = String(rinci);
          if (jenis) baris.push([plot, w.getAttribute('id') || '', tanggal, w.getAttribute('x') || '', w.getAttribute('y') || '', ob.getAttribute('categoryKey') || '', jenis, jumlah, jarak]);
        });
      });
    });
    return baris;
  }
  var KEPALA_SMART = ['No. plot', 'Waypoint ID', 'Waypoint Date', 'X', 'Y', 'Kategori', 'Jenis', 'Jumlah', 'Jarak ke satwa (m)'];
  /* kamus data model SMART: kunci terakhir ke label (ekspor kueri kadang masih memuat kunci), dan label simpul kelompok */
  var BUKAN_JENIS = /^belum ada di list$/i;
  function olahKamus(kamus) {
    var daun = { jenissatwa: {}, jenistumbuhan: {} }, kelompok = {}, kunci = Object.keys(kamus).sort(), i;
    for (i = 0; i < kunci.length; i++) {
      var p = kunci[i].split('|'), ruas = p[1].split('.').filter(Boolean);
      if (daun[p[0]]) daun[p[0]][ruas[ruas.length - 1]] = kamus[kunci[i]];
      if (i + 1 < kunci.length && kunci[i + 1].indexOf(kunci[i]) === 0) kelompok[kamus[kunci[i]].toLowerCase()] = 1;
    }
    return { daun: daun, kelompok: kelompok };
  }
  /* buang isian "Belum ada di list" dan hitung baris yang hanya menyebut kelompok */
  function saringJenis(baris, kol, olah) {
    var lewat = 0, kel = 0, contoh = {}, out = [];
    baris.forEach(function (r) {
      var v = r[kol] || '';
      if (BUKAN_JENIS.test(v)) { lewat++; return; }
      if (v && olah && olah.kelompok[v.toLowerCase()]) { kel++; contoh[v] = 1; }
      out.push(r);
    });
    var c = Object.keys(contoh).slice(0, 3);
    return { baris: out, ket: (lewat ? ' ' + K.n(lewat) + ' baris berisi "Belum ada di list" dilewati.' : '') +
      (kel ? ' ' + K.n(kel) + ' baris hanya menyebut kelompok (' + c.join(', ') + ') dan ikut terhitung sebagai satu jenis; hapus dari kotak data bila tidak diinginkan.' : '') };
  }
  function tabelDariBerkas(file) {
    var nama = file.name.toLowerCase();
    if (/\.(xml|zip)$/.test(nama)) {
      var olah;
      return K.ambil('smart_jenis.json').then(function (km) {
        olah = olahKamus(km.jenis);
        if (/\.xml$/.test(nama)) return file.text().then(function (t) { return bacaPatroli(t, km.jenis); });
        return (window.JSZip ? Promise.resolve() : muatSkrip('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js')).then(function () {
          return window.JSZip.loadAsync(file).catch(function () { throw new Error('Berkas ' + file.name + ' bukan ZIP yang utuh, jadi tidak bisa dibuka. Ekspor ulang patrolinya dari SMART Desktop.'); });
        }).then(function (zip) {
          var xml = Object.keys(zip.files).filter(function (n) { return /\.xml$/i.test(n) && !zip.files[n].dir; });
          return Promise.all(xml.map(function (n) { return zip.file(n).async('string'); })).then(function (isi) {
            var semua = [], ada = 0;
            isi.forEach(function (t) { if (/<(\w+:)?patrol[\s>]/.test(t)) { ada++; semua = semua.concat(bacaPatroli(t, km.jenis)); } });
            if (!ada) throw new Error('Tidak ada XML patroli SMART di dalam ZIP ini. Pilih ZIP hasil ekspor patroli dari SMART Desktop.');
            return semua;
          });
        });
      }).then(function (baris) {
        if (!baris.length) throw new Error('Ekspor patroli ini terbaca, tetapi tidak memuat observasi satwa atau tumbuhan (atribut jenis satwa atau jenis tumbuhan). Periksa apakah patrolinya memang mencatat temuan jenis.');
        var s = saringJenis(baris, 6, olah);
        /* kolom nomor plot hanya ditampilkan bila patrolinya memakainya (data model Metode Teknis) */
        var adaPlot = s.baris.some(function (r) { return r[0]; });
        return { kepala: adaPlot ? KEPALA_SMART : KEPALA_SMART.slice(1), baris: adaPlot ? s.baris : s.baris.map(function (r) { return r.slice(1); }),
          ket: 'Ekspor patroli SMART terbaca: ' + K.n(s.baris.length) + ' observasi satwa dan tumbuhan.' + s.ket };
      });
    }
    if (!/\.(csv|tsv|txt)$/.test(nama)) return Promise.reject(new Error('Jenis berkas ' + file.name + ' belum didukung. Pilih CSV, TSV, atau ekspor patroli SMART (XML atau ZIP).'));
    return file.text().then(function (t) {
      var u = K.uraiTabel(t).baris;
      if (u.length < 2) throw new Error('Berkas ' + file.name + ' tidak berisi baris data di bawah baris judul kolom.');
      var kepala = u[0].slice(), baris = u.slice(1), a = kepala.indexOf('Jenis satwa'), b = kepala.indexOf('Jenis tumbuhan');
      if (a < 0 || b < 0) return { kepala: kepala, baris: baris, ket: 'Berkas terbaca: ' + K.n(baris.length) + ' baris, ' + kepala.length + ' kolom.' };
      /* ekspor kueri SMART: jenis satwa dan tumbuhan ada di dua kolom, dan sebagian isinya masih kunci data model */
      return K.ambil('smart_jenis.json').then(function (km) { return olahKamus(km.jenis); }, function () { return null; }).then(function (olah) {
        function label(v, atr) { return olah && /^[a-z0-9]+$/.test(v) && olah.daun[atr][v] ? olah.daun[atr][v] : v; }
        kepala.push('Jenis (satwa atau tumbuhan)');
        var gabung = baris.map(function (r) { var c = r.slice(); while (c.length < kepala.length - 1) c.push(''); c.push(r[a] ? label(r[a], 'jenissatwa') : (r[b] ? label(r[b], 'jenistumbuhan') : '')); return c; });
        var s = saringJenis(gabung, kepala.length - 1, olah);
        return { kepala: kepala, baris: s.baris, ket: 'Ekspor kueri SMART terbaca: ' + K.n(s.baris.length) + ' baris, ' + kepala.length + ' kolom.' + s.ket };
      });
    });
  }
  var POLA = {
    jenis: /^jenis \(satwa|^jenis$|spesies|species|nama ilmiah|nama jenis|^nama$|jenis satwa|jenis tumbuhan/i,
    jumlah: /^jumlah$|jumlah individu|^individu$|^n$|count|jumlah \(ekor\)/i,
    unit: /petak|plot|^titik|unit|waypoint id|stasiun|^id$/i,
    komunitas: /komunitas|resor|lokasi|habitat|^site$/i,
    diameter: /diameter|dbh|^d \(|^d$|keliling/i,
    jarak: /jarak/i,
    x: /^x$|bujur|^lon/i,
    y: /^y$|lintang|^lat/i,
    tangkap: /tangkap|capture|^c$/i, ulang: /ulang|bertanda|recapt|^r$/i,
    strata: /strata|kelas|tipe/i, luas: /luas|area/i
  };
  function tebakKolom(k, kepala) {
    var p = POLA[k.pola || k.id], i;
    if (p) for (i = kepala.length - 1; i >= 0; i--) if (kepala[i] === 'Jenis (satwa atau tumbuhan)' && (k.pola || k.id) === 'jenis') return i;
    if (p) for (i = 0; i < kepala.length; i++) if (p.test(kepala[i])) return i;
    return -1;
  }

  /* ---------- teks tempel menjadi baris bernama ---------- */
  function bacaBaris(teks, kolom, minBaris) {
    var u = K.uraiTabel(teks).baris;
    if (u.length) {
      var b0 = u[0], angka = kolom.filter(function (k) { return k.angka && !k.opsional && k.bawaan === undefined; });
      var kepala = angka.length ? angka.every(function (k) { var v = b0[kolom.indexOf(k)]; return v !== undefined && v !== '' && isNaN(K.angka(v)); })
        : /^(jenis|spesies|nama|komunitas|unit|petak|plot|strata)\b/i.test(b0[0] || '');
      if (kepala) u = u.slice(1);
    }
    var keluar = [], galat = [];
    u.forEach(function (r, i) {
      var o = {}, salah = null;
      kolom.forEach(function (k, j) {
        var v = r[j] === undefined ? '' : r[j];
        if (k.angka) {
          if (v === '') { if (k.bawaan !== undefined) o[k.id] = k.bawaan; else if (k.opsional) o[k.id] = null; else salah = 'kolom ' + k.label.toLowerCase() + ' kosong'; }
          else { var a = K.angka(v); if (isNaN(a)) salah = 'kolom ' + k.label.toLowerCase() + ' berisi "' + v + '", bukan angka'; else if (a < 0) salah = 'kolom ' + k.label.toLowerCase() + ' bernilai negatif'; else o[k.id] = a; }
        } else { if (v === '' && !k.opsional) salah = 'kolom ' + k.label.toLowerCase() + ' kosong'; else o[k.id] = v; }
      });
      if (salah) galat.push('baris ' + (i + 1) + ': ' + salah); else keluar.push(o);
    });
    if (galat.length) throw new Error('Ada ' + galat.length + ' baris yang tidak bisa dibaca (' + galat.slice(0, 3).join('; ') + (galat.length > 3 ? '; dan lainnya' : '') + '). Perbaiki atau hapus baris itu, lalu hitung lagi. Kolom dipisah dengan tab, titik koma, atau koma.');
    if (keluar.length < (minBaris || 1)) throw new Error('Kotak data masih kosong atau barisnya kurang dari ' + (minBaris || 1) + '. Tempel data, pilih berkas, atau muat dari data terkurasi dulu.');
    return keluar;
  }

  /* ---------- data terkurasi untuk contoh nyata ---------- */
  var GRUP_KAT = { burung: ['Aves'], satwa: ['Mamalia', 'Fauna lain'], tumbuhan: ['Flora', 'Anggrek'] };
  var OPSI_GRUP = [['burung', 'Burung'], ['tumbuhan', 'Tumbuhan dan anggrek'], ['satwa', 'Mamalia dan fauna lain']];
  function namaPolos(T, i) { var t = T.C.t[i]; if (t < 0) return T.C.ns[i] || 'Tanpa nama'; var x = T.taksa[t]; return x.i ? x.i + (x.t === 'marga' ? ' sp.' : '') : (x.n || x.tid); }
  function pilihTemuan(T, f) { var o = [], i; for (i = 0; i < T.n; i++) if (f(i)) o.push(i); return o; }
  function katGrup(T, i, grup) { return GRUP_KAT[grup].indexOf(T.Q.kategori[T.C.kat[i]]) >= 0; }
  function hitungan(T, i) { var jt = T.Q.temuan[T.C.jt[i]]; return jt !== 'daftar jenis laporan' && jt !== 'tipe ekosistem' && jt !== 'tutupan lahan'; }
  function opsiKegiatan(T, syarat) {
    var hit = {};
    for (var i = 0; i < T.n; i++) if (syarat(i)) hit[T.C.k[i]] = (hit[T.C.k[i]] || 0) + 1;
    return Object.keys(hit).map(Number).filter(function (k) { return hit[k] >= 5; }).map(function (k) {
      var id = T.Q.kegiatan[k], kg = T.kegId[id];
      return [String(k), (kg ? kg.judul : id) + ' (' + K.n(hit[k]) + ' baris)', kg ? kg.tahun * 100 + kg.bulan : 0];
    }).sort(function (a, b) { return b[2] - a[2]; });
  }

  /* ---------- daftar kalkulator ---------- */
  var KALK = K.KALK = [];
  var KOL_JJ = [{ id: 'jenis', label: 'Jenis' }, { id: 'jumlah', label: 'Jumlah individu', angka: true, bawaan: 1 }];

  KALK.push({
    id: 'indeks', grup: 'komunitas', nama: 'Indeks komunitas',
    ringkas: 'H′, kemerataan, Simpson, Margalef, Menhinick, Berger-Parker, dan dominansi tiap jenis dari daftar jenis dan jumlah individu.',
    kamus: ['shannon', 'kemerataan', 'simpson', 'dominansi-jenis', 'kelimpahan-relatif', 'margalef', 'menhinick', 'berger-parker'],
    tabel: { kolom: KOL_JJ, petunjuk: 'Satu baris per jenis atau per perjumpaan: nama jenis lalu jumlah individu. Jenis yang berulang dijumlahkan. Jumlah yang kosong dihitung 1.' },
    param: [{ id: 'kriteria', label: 'Kriteria kelas H′', pilih: [['lpk', 'LPK TN Tambora: rendah sampai 2, sedang sampai 3'], ['wilhm', 'Wilhm 1975: rendah di bawah 1, sedang sampai 3']] }],
    terkurasi: function (T) {
      return { kendali: [{ id: 'keg', label: 'Kegiatan', opsi: opsiKegiatan(T, function (i) { return hitungan(T, i) && T.C.t[i] >= 0; }) }, { id: 'grup', label: 'Kelompok', opsi: OPSI_GRUP }],
        muat: function (v) {
          var m = {}, n = 0;
          pilihTemuan(T, function (i) { return String(T.C.k[i]) === v.keg && hitungan(T, i) && T.C.t[i] >= 0 && katGrup(T, i, v.grup); }).forEach(function (i) { var nm = namaPolos(T, i); m[nm] = (m[nm] || 0) + (T.C.j[i] || 1); n++; });
          return { teks: Object.keys(m).sort().map(function (k) { return k + '\t' + m[k]; }).join('\n'), ket: K.n(n) + ' temuan dari kegiatan ini dijumlahkan per jenis. Temuan tanpa angka jumlah dihitung 1 individu.' };
        } };
    },
    hitung: function (b, p) {
      var g = {}; b.forEach(function (r) { g[r.jenis] = (g[r.jenis] || 0) + r.jumlah; });
      var jenis = Object.keys(g).filter(function (k) { return g[k] > 0; });
      if (!jenis.length) throw new Error('Semua jumlah bernilai nol. Isi jumlah individu tiap jenis.');
      var nilai = jenis.map(function (k) { return g[k]; }), N = jml(nilai), S = jenis.length, H = shannon(nilai), D = 0, maks = Math.max.apply(null, nilai);
      nilai.forEach(function (n) { D += (n / N) * (n / N); });
      var E = S > 1 ? H / Math.log(S) : null, R = N > 1 ? (S - 1) / Math.log(N) : null, Ds = 1 - D;
      return {
        angka: [
          { l: 'Jumlah jenis (S)', v: K.n(S) }, { l: 'Jumlah individu (N)', v: K.nd(N, 1) },
          { l: 'Shannon-Wiener (H′)', v: K.n(H, 3), k: 'Keanekaragaman ' + kelasH(H, p.kriteria) },
          { l: 'Kemerataan (E)', v: E === null ? '-' : K.n(E, 3), k: E === null ? 'Perlu paling sedikit 2 jenis' : 'Kemerataan ' + (E > 0.6 ? 'tinggi' : (E >= 0.4 ? 'sedang' : 'rendah')) },
          { l: 'Simpson (Ds)', v: K.n(Ds, 3), k: 'Keanekaragaman ' + (Ds <= 0.3 ? 'rendah' : (Ds <= 0.6 ? 'sedang' : 'tinggi')) + '; dominansi D = ' + K.n(D, 3) },
          { l: 'Margalef (R)', v: R === null ? '-' : K.n(R, 2), k: R === null ? 'Perlu lebih dari 1 individu' : 'Kekayaan ' + (R < 2.5 ? 'rendah' : (R <= 4 ? 'sedang' : 'tinggi')) },
          { l: 'Menhinick', v: K.n(S / Math.sqrt(N), 2) }, { l: 'Berger-Parker (d)', v: K.n(maks / N, 3) }],
        tabel: [{ judul: 'Dominansi dan kelimpahan relatif tiap jenis', berkas: 'indeks-komunitas-per-jenis', urut: 'n',
          kolom: [{ j: 'Jenis' }, { j: 'Jumlah', n: 1, d: 1, id: 'n' }, { j: 'Di atau KR (%)', n: 1, d: 2 }, { j: 'Kelas dominansi' }, { j: 'p ln p', n: 1, d: 4 }],
          baris: jenis.map(function (k) { var pi = g[k] / N; return [k, g[k], pi * 100, pi * 100 > 5 ? 'dominan' : (pi * 100 >= 2 ? 'subdominan' : 'tidak dominan'), pi * Math.log(pi)]; }) }]
      };
    }
  });

  KALK.push({
    id: 'vegetasi', grup: 'vegetasi', nama: 'Analisis vegetasi (INP)',
    ringkas: 'Kerapatan, frekuensi, dominansi, nilai relatifnya, dan indeks nilai penting tiap jenis dari data petak.',
    kamus: ['kerapatan', 'frekuensi', 'dominansi', 'inp', 'shannon'],
    tabel: { kolom: [{ id: 'petak', label: 'Petak', pola: 'unit' }, { id: 'jenis', label: 'Jenis' }, { id: 'jumlah', label: 'Jumlah individu', angka: true, bawaan: 1 }, { id: 'diameter', label: 'Diameter atau keliling (cm)', angka: true, opsional: true }],
      petunjuk: 'Satu baris per batang atau per jenis di tiap petak: nomor petak, jenis, jumlah individu, lalu diameter setinggi dada dalam cm. Hitung satu tingkat tumbuh sekali jalan. Diameter boleh kosong untuk semai dan pancang.' },
    param: [{ id: 'luas', label: 'Luas satu petak (m²)', angka: true, petunjuk: '4 untuk 2 x 2 m, 25 untuk 5 x 5 m, 100 untuk 10 x 10 m, 400 untuk 20 x 20 m' },
      { id: 'npetak', label: 'Jumlah petak seluruhnya', angka: true, opsional: true, petunjuk: 'Isi bila ada petak tanpa individu. Bila kosong, dihitung dari petak yang muncul di data.' },
      { id: 'ukur', label: 'Angka di kolom keempat', pilih: [['diameter', 'Diameter (cm)'], ['keliling', 'Keliling batang (cm)']] }],
    terkurasi: function (T) {
      var veg = function (i) { return T.Q.temuan[T.C.jt[i]] === 'petak vegetasi' && T.C.plot[i]; };
      return { kendali: [{ id: 'keg', label: 'Kegiatan', opsi: opsiKegiatan(T, veg) }, { id: 'tt', label: 'Tingkat tumbuh', opsi: [['pohon', 'Pohon'], ['tiang', 'Tiang'], ['pancang', 'Pancang'], ['semai', 'Semai']] }],
        muat: function (v) {
          var idx = pilihTemuan(T, function (i) { return String(T.C.k[i]) === v.keg && veg(i) && T.C.tt[i] === v.tt; });
          return { teks: idx.map(function (i) { return T.C.plot[i] + '\t' + namaPolos(T, i) + '\t' + (T.C.j[i] || 1) + '\t'; }).join('\n'), param: { luas: { pohon: 400, tiang: 100, pancang: 25, semai: 4 }[v.tt] },
            ket: K.n(idx.length) + ' baris petak tingkat ' + v.tt + '. Data terkurasi menyimpan jumlah per jenis per petak tanpa diameter tiap batang, jadi dominansi tidak dihitung. Luas petak diisi dengan ukuran baku; periksa ukuran yang dipakai di LPK.' };
        } };
    },
    hitung: function (b, p) {
      var luas = perlu(p.luas, 'Luas satu petak belum diisi. Isi dalam meter persegi, misalnya 400 untuk petak 20 x 20 m.');
      var petak = unik(b.map(function (r) { return r.petak; })), P = petak.length;
      if (p.npetak) { if (p.npetak < P) throw new Error('Jumlah petak seluruhnya (' + p.npetak + ') lebih kecil dari jumlah petak di data (' + P + '). Perbesar angkanya atau kosongkan.'); P = p.npetak; }
      var A = P * luas / 10000, adaD = b.every(function (r) { return r.diameter > 0; }), sebagian = b.some(function (r) { return r.diameter > 0; });
      var g = {};
      b.forEach(function (r) {
        var o = g[r.jenis] || (g[r.jenis] = { n: 0, petak: {}, lbds: 0 });
        o.n += r.jumlah; o.petak[r.petak] = 1;
        if (adaD) { var d = (p.ukur === 'keliling' ? r.diameter / Math.PI : r.diameter) / 100; o.lbds += 0.25 * Math.PI * d * d * r.jumlah; }
      });
      var jenis = Object.keys(g), sK = 0, sF = 0, sD = 0;
      jenis.forEach(function (k) { var o = g[k]; o.K = o.n / A; o.F = Object.keys(o.petak).length / P; o.D = o.lbds / A; sK += o.K; sF += o.F; sD += o.D; });
      var baris = jenis.map(function (k) { var o = g[k], KR = o.K / sK * 100, FR = o.F / sF * 100, DR = adaD ? o.D / sD * 100 : null; return [k, o.n, o.K, KR, o.F, FR, adaD ? o.D : null, DR, KR + FR + (adaD ? DR : 0)]; });
      var cat = [];
      if (!adaD) cat.push(sebagian ? 'Sebagian baris tidak punya diameter, jadi dominansi tidak dihitung dan INP = KR + FR (nilai tertinggi 200 %). Lengkapi diameter semua baris untuk INP tiga komponen.' : 'Tanpa diameter, INP dihitung dari KR dan FR (nilai tertinggi 200 %), seperti untuk semai dan pancang.');
      return {
        angka: [{ l: 'Jumlah petak', v: K.n(P) }, { l: 'Luas contoh', v: K.nd(A, 4), k: 'hektare' }, { l: 'Jumlah jenis', v: K.n(jenis.length) },
          { l: 'Kerapatan semua jenis', v: K.nd(sK, 1), k: 'individu per ha' }].concat(adaD ? [{ l: 'Luas bidang dasar', v: K.nd(sD, 2), k: 'm² per ha' }] : []).concat([{ l: 'Shannon-Wiener (H′)', v: K.n(shannon(jenis.map(function (k) { return g[k].n; })), 3) }]),
        tabel: [{ judul: 'Indeks nilai penting tiap jenis', berkas: 'analisis-vegetasi-inp', urut: 'inp',
          kolom: [{ j: 'Jenis' }, { j: 'Jumlah', n: 1, d: 1 }, { j: 'K (ind/ha)', n: 1, d: 1 }, { j: 'KR (%)', n: 1, d: 2 }, { j: 'F', n: 1, d: 3 }, { j: 'FR (%)', n: 1, d: 2 }, { j: 'D (m²/ha)', n: 1, d: 3 }, { j: 'DR (%)', n: 1, d: 2 }, { j: 'INP (%)', n: 1, d: 2, id: 'inp' }],
          baris: baris }],
        catatan: cat
      };
    }
  });

  KALK.push({
    id: 'kesamaan', grup: 'komunitas', nama: 'Kesamaan komunitas',
    ringkas: 'Sørensen, Jaccard, dan Bray-Curtis untuk tiap pasangan komunitas (lokasi, habitat, atau tahun).',
    kamus: ['sorensen-jaccard', 'bray-curtis'],
    tabel: { kolom: [{ id: 'komunitas', label: 'Komunitas' }, { id: 'jenis', label: 'Jenis' }, { id: 'jumlah', label: 'Jumlah individu', angka: true, opsional: true }],
      petunjuk: 'Satu baris per jenis di tiap komunitas: nama komunitas, jenis, lalu jumlah individu. Jumlah boleh kosong; tanpa jumlah hanya Sørensen dan Jaccard yang dihitung.' },
    terkurasi: function (T) {
      return { kendali: [{ id: 'grup', label: 'Kelompok', opsi: OPSI_GRUP }],
        muat: function (v) {
          var m = {};
          pilihTemuan(T, function (i) { return T.C.t[i] >= 0 && T.taksa[T.C.t[i]].t === 'jenis' && katGrup(T, i, v.grup) && T.Q.resor[T.C.res[i]]; }).forEach(function (i) { m[T.Q.resor[T.C.res[i]] + '\t' + namaPolos(T, i)] = 1; });
          return { teks: Object.keys(m).sort().join('\n'), ket: 'Daftar jenis tiap resor dari seluruh data terkurasi (hadir atau tidak). Upaya survei antarresor tidak sama, jadi kesamaan yang rendah bisa berasal dari survei yang belum merata.' };
        } };
    },
    hitung: function (b) {
      var kom = unik(b.map(function (r) { return r.komunitas; }));
      if (kom.length < 2) throw new Error('Baru ada satu komunitas (' + kom[0] + '). Isi paling sedikit dua nama komunitas di kolom pertama.');
      if (kom.length > 15) throw new Error('Ada ' + kom.length + ' komunitas. Batasi sampai 15 komunitas agar tabel pasangan tetap terbaca.');
      var adaN = b.every(function (r) { return r.jumlah !== null; }), d = {};
      b.forEach(function (r) { var o = d[r.komunitas] || (d[r.komunitas] = {}); o[r.jenis] = (o[r.jenis] || 0) + (adaN ? r.jumlah : 1); });
      var baris = [];
      for (var i = 0; i < kom.length; i++) for (var j = i + 1; j < kom.length; j++) {
        var a = d[kom[i]], c = d[kom[j]], ja = Object.keys(a), jc = Object.keys(c), C = ja.filter(function (k) { return k in c; }), W = 0;
        C.forEach(function (k) { W += Math.min(a[k], c[k]); });
        var N1 = jml(ja.map(function (k) { return a[k]; })), N2 = jml(jc.map(function (k) { return c[k]; }));
        baris.push([kom[i], kom[j], ja.length, jc.length, C.length, 2 * C.length / (ja.length + jc.length), C.length / (ja.length + jc.length - C.length), adaN ? 1 - 2 * W / (N1 + N2) : null]);
      }
      return { angka: [{ l: 'Komunitas', v: K.n(kom.length) }, { l: 'Pasangan dibandingkan', v: K.n(baris.length) }],
        tabel: [{ judul: 'Kesamaan tiap pasangan komunitas', berkas: 'kesamaan-komunitas', urut: 'cs',
          kolom: [{ j: 'Komunitas 1' }, { j: 'Komunitas 2' }, { j: 'Jenis 1', n: 1, d: 0 }, { j: 'Jenis 2', n: 1, d: 0 }, { j: 'Jenis bersama', n: 1, d: 0 }, { j: 'Sørensen', n: 1, d: 3, id: 'cs' }, { j: 'Jaccard', n: 1, d: 3 }, { j: 'Bray-Curtis (ketidaksamaan)', n: 1, d: 3 }], baris: baris }],
        catatan: adaN ? [] : ['Kolom jumlah kosong di sebagian baris, jadi Bray-Curtis tidak dihitung.'] };
    }
  });

  KALK.push({
    id: 'penduga', grup: 'kekayaan', nama: 'Penduga kekayaan jenis',
    ringkas: 'Chao2 dan Jackknife orde satu dari daftar jenis per unit contoh, Chao1 bila jumlah individu tersedia, dan tabel akumulasi jenis.',
    kamus: ['chao2', 'jackknife', 'chao1', 'kelengkapan', 'akumulasi'],
    tabel: { kolom: [{ id: 'unit', label: 'Unit contoh' }, { id: 'jenis', label: 'Jenis' }, { id: 'jumlah', label: 'Jumlah individu', angka: true, opsional: true }],
      petunjuk: 'Satu baris per jenis di tiap unit contoh (petak, titik, daftar, hari, atau sel grid): nama unit, jenis, lalu jumlah individu bila ada.' },
    param: [{ id: 'nunit', label: 'Jumlah unit contoh seluruhnya', angka: true, opsional: true, petunjuk: 'Isi bila ada unit yang disurvei tetapi tidak mencatat satu jenis pun.' }],
    terkurasi: function (T) {
      return { kendali: [{ id: 'grup', label: 'Kelompok', opsi: OPSI_GRUP }],
        muat: function (v) {
          var m = {};
          pilihTemuan(T, function (i) { return T.C.g[i] && T.C.t[i] >= 0 && T.taksa[T.C.t[i]].t === 'jenis' && katGrup(T, i, v.grup); }).forEach(function (i) { m['Grid ' + T.C.g[i] + '\t' + namaPolos(T, i)] = 1; });
          return { teks: Object.keys(m).join('\n'), ket: 'Unit contoh adalah sel grid 1 km. Hanya temuan berkoordinat yang teridentifikasi sampai tingkat jenis yang dipakai, sama dengan cabang Perencanaan inventarisasi.' };
        } };
    },
    hitung: function (b, p) {
      var unit = unik(b.map(function (r) { return r.unit; })), m = unit.length;
      if (p.nunit) { if (p.nunit < m) throw new Error('Jumlah unit seluruhnya (' + p.nunit + ') lebih kecil dari jumlah unit di data (' + m + '). Perbesar angkanya atau kosongkan.'); m = p.nunit; }
      if (m < 2) throw new Error('Penduga ini perlu paling sedikit 2 unit contoh. Data baru memuat ' + m + ' unit.');
      var hadir = {}, total = {}, adaN = b.every(function (r) { return r.jumlah !== null; });
      b.forEach(function (r) { (hadir[r.jenis] || (hadir[r.jenis] = {}))[r.unit] = 1; total[r.jenis] = (total[r.jenis] || 0) + (r.jumlah || 0); });
      var jenis = Object.keys(hadir), S = jenis.length, Q1 = 0, Q2 = 0, unikPer = {};
      jenis.forEach(function (k) { var u = Object.keys(hadir[k]); if (u.length === 1) { Q1++; unikPer[u[0]] = (unikPer[u[0]] || 0) + 1; } else if (u.length === 2) Q2++; });
      var f = (m - 1) / m, chao2 = S + f * (Q2 > 0 ? Q1 * Q1 / (2 * Q2) : Q1 * (Q1 - 1) / 2), jack = S + Q1 * f;
      var sj = 0; Object.keys(unikPer).forEach(function (u) { sj += unikPer[u] * unikPer[u]; });
      var se = Math.sqrt(Math.max(0, f * (sj - Q1 * Q1 / m)));
      var angka = [{ l: 'Jenis tercatat', v: K.n(S) }, { l: 'Unit contoh (m)', v: K.n(m) }, { l: 'Jenis di satu unit (Q1)', v: K.n(Q1) }, { l: 'Jenis di dua unit (Q2)', v: K.n(Q2) },
        { l: 'Chao2', v: K.n(chao2, 1), k: 'Kelengkapan ' + K.n(S / chao2 * 100, 1) + ' %' }, { l: 'Jackknife 1', v: K.n(jack, 1), k: 'Galat baku ' + K.n(se, 1) + '; kelengkapan ' + K.n(S / jack * 100, 1) + ' %' }];
      if (adaN) {
        var F1 = 0, F2 = 0; jenis.forEach(function (k) { if (total[k] === 1) F1++; else if (total[k] === 2) F2++; });
        var chao1 = S + (F2 > 0 ? F1 * F1 / (2 * F2) : F1 * (F1 - 1) / 2);
        angka.push({ l: 'Chao1', v: K.n(chao1, 1), k: 'F1 = ' + F1 + ', F2 = ' + F2 });
      }
      var lihat = {}, kum = 0, aku = unit.map(function (u, i) { var baru = 0; b.forEach(function (r) { if (r.unit === u && !lihat[r.jenis]) { lihat[r.jenis] = 1; baru++; } }); kum += baru; return [i + 1, u, baru, kum]; });
      return { angka: angka,
        tabel: [{ judul: 'Akumulasi jenis menurut urutan unit contoh', berkas: 'akumulasi-jenis', kolom: [{ j: 'Urutan', n: 1, d: 0 }, { j: 'Unit contoh' }, { j: 'Jenis baru', n: 1, d: 0 }, { j: 'Jenis kumulatif', n: 1, d: 0 }], baris: aku }],
        catatan: ['Penduga ini batas bawah. Kekayaan sebenarnya bisa lebih tinggi, terutama bila banyak jenis hanya tercatat di satu unit.'].concat(adaN ? [] : ['Kolom jumlah individu kosong di sebagian baris, jadi Chao1 tidak dihitung.']) };
    }
  });

  KALK.push({
    id: 'titik', grup: 'populasi', nama: 'Kepadatan titik hitung',
    ringkas: 'Kepadatan tiap jenis burung dari jumlah individu, jumlah titik, dan radius pengamatan.',
    kamus: ['titik-hitung'],
    tabel: { kolom: KOL_JJ, petunjuk: 'Satu baris per jenis atau per perjumpaan: nama jenis lalu jumlah individu di dalam radius. Jenis yang berulang dijumlahkan.' },
    param: [{ id: 'n', label: 'Jumlah titik hitung', angka: true }, { id: 'r', label: 'Radius atau sisi petak (m)', angka: true },
      { id: 'bentuk', label: 'Bentuk petak amat', pilih: [['lingkaran', 'Lingkaran beradius r'], ['persegi', 'Bujur sangkar bersisi s']] }],
    terkurasi: function (T) {
      var ok = function (i) { return hitungan(T, i) && T.C.t[i] >= 0 && katGrup(T, i, 'burung'); };
      return { kendali: [{ id: 'keg', label: 'Kegiatan', opsi: opsiKegiatan(T, ok) }],
        muat: function (v) {
          var m = {}; pilihTemuan(T, function (i) { return String(T.C.k[i]) === v.keg && ok(i); }).forEach(function (i) { var nm = namaPolos(T, i); m[nm] = (m[nm] || 0) + (T.C.j[i] || 1); });
          return { teks: Object.keys(m).sort().map(function (k) { return k + '\t' + m[k]; }).join('\n'), ket: 'Jumlah individu burung per jenis dari kegiatan ini. Jumlah titik dan radius tidak tersimpan di data terkurasi: isi dari LPK kegiatannya.' };
        } };
    },
    hitung: function (b, p) {
      var n = perlu(p.n, 'Jumlah titik hitung belum diisi.'), r = perlu(p.r, 'Radius atau sisi petak belum diisi (dalam meter).');
      var A = n * (p.bentuk === 'persegi' ? r * r : Math.PI * r * r) / 10000, g = {};
      b.forEach(function (x) { g[x.jenis] = (g[x.jenis] || 0) + x.jumlah; });
      var jenis = Object.keys(g), N = jml(jenis.map(function (k) { return g[k]; }));
      return { angka: [{ l: 'Luas seluruh titik (A)', v: K.nd(A, 2), k: 'hektare' }, { l: 'Jumlah individu (N)', v: K.nd(N, 1) }, { l: 'Kepadatan semua jenis', v: K.nd(N / A, 3), k: 'individu per ha, atau ' + K.nd(N / A * 100, 1) + ' per km²' }],
        tabel: [{ judul: 'Kepadatan tiap jenis', berkas: 'kepadatan-titik-hitung', urut: 'n', kolom: [{ j: 'Jenis' }, { j: 'Jumlah', n: 1, d: 1, id: 'n' }, { j: 'Kepadatan (ind/ha)', n: 1, d: 4 }, { j: 'Kepadatan (ind/km²)', n: 1, d: 2 }],
          baris: jenis.map(function (k) { return [k, g[k], g[k] / A, g[k] / A * 100]; }) }],
        catatan: ['Rumus ini menganggap semua individu di dalam radius terdeteksi. Bila banyak yang terlewat, hasilnya terlalu rendah.'] };
    }
  });

  KALK.push({
    id: 'transek', grup: 'populasi', nama: 'Kepadatan transek (King, Hayne, jalur)',
    ringkas: 'Kepadatan satwa dari transek garis dengan metode King dan penduga Hayne, atau dari jalur berlebar tetap.',
    kamus: ['king', 'hayne', 'transek-jalur'],
    tabel: { kolom: [{ id: 'jumlah', label: 'Jumlah individu', angka: true, bawaan: 1 }, { id: 'jarak', label: 'Jarak ke satwa (m)', angka: true }], opsional: true,
      petunjuk: 'Satu baris per perjumpaan: jumlah individu lalu jarak pengamat ke satwa dalam meter. Bila hanya punya rekapnya, kosongkan kotak ini dan isi jumlah individu serta jarak rata-rata di bawah.' },
    param: [{ id: 'L', label: 'Panjang transek (m)', angka: true }, { id: 'N', label: 'Jumlah individu', angka: true, opsional: true, petunjuk: 'Dipakai bila kotak data kosong.' },
      { id: 'd', label: 'Jarak rata-rata ke satwa (m)', angka: true, opsional: true, petunjuk: 'Dipakai bila kotak data kosong.' },
      { id: 'w', label: 'Setengah lebar jalur (m)', angka: true, opsional: true, petunjuk: 'Isi hanya untuk jalur berlebar tetap.' }],
    contoh: { label: 'Isi contoh LPK Monitoring Rusa Oi Katupa 2022', isi: function () { return { teks: '', param: { L: 10669, N: 5, d: 194.71, w: '' } }; } },
    hitung: function (b, p) {
      var L = perlu(p.L, 'Panjang transek belum diisi (dalam meter).'), N, d, n = b.length, angka = [], cat = [];
      if (n) {
        if (b.some(function (r) { return !(r.jarak > 0); })) throw new Error('Ada jarak bernilai nol. Penduga Hayne memakai kebalikan jarak, jadi isi jarak di atas nol untuk tiap perjumpaan.');
        N = jml(b.map(function (r) { return r.jumlah; })); d = jml(b.map(function (r) { return r.jarak; })) / n;
      } else { N = perlu(p.N, 'Kotak data kosong dan jumlah individu belum diisi. Isi salah satunya.'); d = perlu(p.d, 'Jarak rata-rata ke satwa belum diisi.'); }
      var luas = 2 * L * d / 10000, DK = N / luas;
      angka.push({ l: 'Jumlah individu (N)', v: K.nd(N, 1) }, { l: 'Jarak rata-rata', v: K.nd(d, 2), k: 'meter' }, { l: 'Luas amat metode King', v: K.nd(luas, 1), k: 'hektare' },
        { l: 'Kepadatan King', v: K.nd(DK, 4), k: 'individu per ha, atau 1 individu per ' + K.nd(1 / DK, 2) + ' ha' });
      if (n >= 2) {
        var R = jml(b.map(function (r) { return 1 / r.jarak; })) / n, Dg = n / (2 * L) * R, s2 = jml(b.map(function (r) { return Math.pow(1 / r.jarak - R, 2); }));
        var v = Dg * Dg * (1 / n + s2 / (R * R * n * (n - 1))), kel = N / n;
        angka.push({ l: 'Kepadatan Hayne', v: K.nd(Dg * 10000 * kel, 4), k: 'individu per ha; galat baku ' + K.nd(Math.sqrt(v) * 10000 * kel, 4) });
        cat.push('Penduga Hayne dihitung untuk kelompok (perjumpaan) lalu dikali ukuran kelompok rata-rata ' + K.nd(kel, 2) + '. Galat bakunya belum memasukkan ragam ukuran kelompok.');
      } else if (!n) cat.push('Penduga Hayne perlu jarak tiap perjumpaan, jadi tidak dihitung dari rekap.');
      if (p.w) angka.push({ l: 'Kepadatan jalur berlebar tetap', v: K.nd(N / (2 * p.w * L / 10000), 4), k: 'individu per ha pada jalur selebar ' + K.nd(2 * p.w, 1) + ' m' });
      return { angka: angka, catatan: cat };
    }
  });

  KALK.push({
    id: 'pellet', grup: 'populasi', nama: 'Pellet count',
    ringkas: 'Dugaan populasi rusa dari jumlah onggokan kotoran di petak contoh.',
    kamus: ['pellet'],
    param: [{ id: 'A', label: 'Luas areal penelitian (ha)', angka: true }, { id: 'p', label: 'Jumlah onggokan kotoran', angka: true }, { id: 't', label: 'Selang waktu penumpukan (hari)', angka: true },
      { id: 'd', label: 'Laju defekasi (onggokan per individu per hari)', angka: true, petunjuk: 'Ambil dari pustaka atau pengamatan untuk jenis yang sama.' },
      { id: 'np', label: 'Jumlah petak contoh', angka: true }, { id: 'lp', label: 'Luas satu petak contoh (m²)', angka: true }],
    hitung: function (b, p) {
      var A = perlu(p.A, 'Luas areal penelitian belum diisi.'), on = p.p; if (!(on >= 0) || on === null || on === undefined) throw new Error('Jumlah onggokan kotoran belum diisi.');
      var t = perlu(p.t, 'Selang waktu penumpukan belum diisi.'), d = perlu(p.d, 'Laju defekasi belum diisi. Ambil dari pustaka untuk jenis yang sama.');
      var a = perlu(p.np, 'Jumlah petak contoh belum diisi.') * perlu(p.lp, 'Luas satu petak contoh belum diisi.') / 10000, D = on / (t * d * a);
      return { angka: [{ l: 'Luas seluruh petak (a)', v: K.nd(a, 4), k: 'hektare' }, { l: 'Kepadatan', v: K.nd(D, 4), k: 'individu per ha' + (D > 0 ? ', atau 1 individu per ' + K.nd(1 / D, 1) + ' ha' : '') }, { l: 'Dugaan populasi di areal', v: K.nd(D * A, 1), k: 'individu pada ' + K.nd(A, 1) + ' ha' }] };
    }
  });

  KALK.push({
    id: 'jejak', grup: 'populasi', nama: 'Jejak kaki',
    ringkas: 'Dugaan jumlah minimum dan maksimum rusa dari jumlah jejak kaki terbanyak pertama dan kedua.',
    kamus: ['jejak'],
    param: [{ id: 'nk', label: 'Jumlah jejak terbanyak pertama (Nk)', angka: true }, { id: 'nk1', label: 'Jumlah jejak terbanyak kedua (Nk1)', angka: true }, { id: 'a', label: 'Taraf nyata (a)', angka: true, bawaan: 0.05 }],
    contoh: { label: 'Isi contoh LPK Monitoring Rusa Doro Ncanga Mei 2022', isi: function () { return { param: { nk: 4, nk1: 2, a: 0.05 } }; } },
    hitung: function (b, p) {
      var nk = perlu(p.nk, 'Nk belum diisi.'), nk1 = p.nk1, a = p.a;
      if (nk1 === null || nk1 === undefined || nk1 < 0) throw new Error('Nk1 belum diisi.');
      if (nk1 > nk) throw new Error('Nk1 (' + nk1 + ') lebih besar dari Nk (' + nk + '). Nk adalah jumlah terbanyak pertama, jadi tukar kedua angka.');
      if (!(a > 0 && a < 1)) throw new Error('Taraf nyata harus di antara 0 dan 1, misalnya 0,05.');
      return { angka: [{ l: 'Dugaan minimum (N)', v: K.nd(2 * nk - nk1, 1), k: '2 Nk dikurangi Nk1' }, { l: 'Dugaan maksimum, penulisan LPK', v: K.nd((nk + (1 - a) / a) * (nk - nk1), 1), k: '[Nk + (1 − a)/a] × (Nk − Nk1)' },
        { l: 'Dugaan maksimum, Robson dan Whitlock', v: K.nd(nk + (1 - a) / a * (nk - nk1), 1), k: 'Nk + ((1 − a)/a) × (Nk − Nk1)' }],
        catatan: ['Kedua bentuk batas atas ditampilkan karena penulisan di LPK berbeda dari Robson dan Whitlock (1964). Periksa sumber aslinya sebelum memilih angka untuk laporan.'] };
    }
  });

  KALK.push({
    id: 'tandai', grup: 'populasi', nama: 'Tangkap, tandai, tangkap ulang',
    ringkas: 'Lincoln-Petersen dengan koreksi Chapman untuk dua kesempatan, dan Schnabel untuk lebih dari dua kesempatan.',
    kamus: ['lincoln', 'schnabel'],
    tabel: { kolom: [{ id: 'tangkap', label: 'Tertangkap', angka: true }, { id: 'ulang', label: 'Sudah bertanda', angka: true, bawaan: 0 }],
      petunjuk: 'Satu baris per kesempatan tangkap, berurutan: jumlah tertangkap lalu jumlah yang sudah bertanda. Semua individu tak bertanda yang tertangkap dianggap ditandai lalu dilepas.' },
    hitung: function (b) {
      if (b.length < 2) throw new Error('Perlu paling sedikit 2 kesempatan tangkap. Data baru memuat ' + b.length + '.');
      if (b[0].ulang > 0) throw new Error('Kesempatan pertama tidak mungkin sudah memuat individu bertanda. Isi 0 di baris pertama.');
      var M = 0, sCM = 0, sR = 0, baris = [], salah = null;
      b.forEach(function (r, i) { if (r.ulang > r.tangkap || r.ulang > M) salah = i + 1; baris.push([i + 1, r.tangkap, r.ulang, M]); sCM += r.tangkap * M; sR += r.ulang; M += r.tangkap - r.ulang; });
      if (salah) throw new Error('Baris ' + salah + ': jumlah bertanda melebihi jumlah tertangkap atau melebihi jumlah yang sudah ditandai sebelumnya. Periksa angkanya.');
      if (!sR) throw new Error('Belum ada individu bertanda yang tertangkap lagi, jadi ukuran populasi tidak bisa diduga. Tambah kesempatan tangkap.');
      var angka = [{ l: 'Individu ditandai seluruhnya', v: K.n(M) }];
      if (b.length === 2) {
        var m1 = b[0].tangkap, c = b[1].tangkap, r2 = b[1].ulang, ch = (m1 + 1) * (c + 1) / (r2 + 1) - 1, vr = (m1 + 1) * (c + 1) * (m1 - r2) * (c - r2) / ((r2 + 1) * (r2 + 1) * (r2 + 2)), se = Math.sqrt(vr);
        angka.push({ l: 'Lincoln-Petersen', v: K.nd(m1 * c / r2, 1) }, { l: 'Chapman', v: K.nd(ch, 1), k: 'Selang 95 %: ' + K.nd(Math.max(M, ch - 1.96 * se), 1) + ' sampai ' + K.nd(ch + 1.96 * se, 1) });
      } else angka.push({ l: 'Schnabel', v: K.nd(sCM / sR, 1), k: K.n(b.length) + ' kesempatan, ' + K.n(sR) + ' tangkap ulang' });
      return { angka: angka, tabel: [{ judul: 'Rekap tiap kesempatan', berkas: 'tangkap-tandai', kolom: [{ j: 'Kesempatan', n: 1, d: 0 }, { j: 'Tertangkap (C)', n: 1, d: 0 }, { j: 'Sudah bertanda (R)', n: 1, d: 0 }, { j: 'Bertanda di populasi sebelumnya (M)', n: 1, d: 0 }], baris: baris }],
        catatan: ['Anggapan: populasi tertutup selama survei, tanda tidak hilang, dan semua individu berpeluang sama untuk tertangkap.'] };
    }
  });

  KALK.push({
    id: 'laju', grup: 'populasi', nama: 'Laju perjumpaan, CPUE, dan RAI',
    ringkas: 'Individu per jam, tangkapan per satuan usaha, perjumpaan per kilometer, dan indeks kamera penjebak tiap jenis.',
    kamus: ['laju-perjumpaan', 'rai', 'kelimpahan-relatif'],
    tabel: { kolom: KOL_JJ, petunjuk: 'Satu baris per jenis: nama jenis lalu jumlah individu, tanda, atau foto independen. Jenis yang berulang dijumlahkan.' },
    param: [{ id: 'jam', label: 'Lama pencarian (jam)', angka: true, opsional: true }, { id: 's', label: 'Jumlah pencari', angka: true, opsional: true, petunjuk: 'Kosong berarti 1.' },
      { id: 'km', label: 'Panjang jalur (km)', angka: true, opsional: true }, { id: 'hari', label: 'Hari kamera aktif', angka: true, opsional: true, petunjuk: 'Isi bila angka di kotak data adalah foto independen.' }],
    contoh: { label: 'Isi contoh Panduan Inventarisasi Herpetofauna (Box 2)', isi: function () {
      return { teks: [['Ahaetulla prasina', 4], ['Boiga multomaculatus', 1], ['Bronchocela jubata', 6], ['Cyrtodactylus marmoratus', 5], ['Dasia olivacea', 1], ['Dendrelaphis sp', 1], ['Draco volans', 3], ['Duttaphrynus melanostictus', 5], ['Eutropis multifasciata', 6], ['Hemidactylus frenatus', 3], ['Hylarana chalconota', 1], ['Leptobrachium hasseltii', 3], ['Microhyla achatina', 1], ['Polypedates leucomystax', 3], ['Rhacophorus reinwardtii', 4], ['Sphenomorphus puncticentralis', 2], ['Takydromus sexlineatus', 1], ['Xenodermus javanicus', 1]].map(function (r) { return r.join('\t'); }).join('\n'), param: { jam: 9, s: 1, km: '', hari: '' } }; } },
    hitung: function (b, p) {
      if (!p.jam && !p.km && !p.hari) throw new Error('Belum ada ukuran usaha. Isi lama pencarian, panjang jalur, atau hari kamera.');
      var g = {}; b.forEach(function (x) { g[x.jenis] = (g[x.jenis] || 0) + x.jumlah; });
      var jenis = Object.keys(g), N = jml(jenis.map(function (k) { return g[k]; })), s = p.s || 1;
      var kol = [{ j: 'Jenis' }, { j: 'Jumlah', n: 1, d: 1, id: 'n' }, { j: 'Kelimpahan relatif (%)', n: 1, d: 2 }];
      if (p.jam) kol.push({ j: 'Per jam', n: 1, d: 3 }, { j: 'CPUE', n: 1, d: 3 });
      if (p.km) kol.push({ j: 'Per km', n: 1, d: 3 });
      if (p.hari) kol.push({ j: 'RAI', n: 1, d: 2 });
      return { angka: [{ l: 'Jumlah jenis', v: K.n(jenis.length) }, { l: 'Jumlah seluruhnya', v: K.nd(N, 1) }].concat(p.jam ? [{ l: 'Usaha', v: K.nd(p.jam * s, 1), k: 'jam-orang' }] : []),
        tabel: [{ judul: 'Laju perjumpaan tiap jenis', berkas: 'laju-perjumpaan', urut: 'n', kolom: kol,
          baris: jenis.map(function (k) { var r = [k, g[k], g[k] / N * 100]; if (p.jam) r.push(g[k] / p.jam, g[k] / (p.jam * s)); if (p.km) r.push(g[k] / p.km); if (p.hari) r.push(g[k] / p.hari * 100); return r; }) }],
        catatan: ['Angka ini indeks untuk membandingkan lokasi atau waktu dengan cara survei yang sama. Ia bukan kepadatan.'] };
    }
  });

  KALK.push({
    id: 'dispersi', grup: 'ruang', nama: 'Pola sebaran (indeks dispersi dan Morisita)',
    ringkas: 'Pola sebaran tiap jenis: acak, mengelompok, atau merata, dari jumlah individu per unit contoh.',
    kamus: ['indeks-dispersi', 'morisita'],
    tabel: { kolom: [{ id: 'unit', label: 'Unit contoh' }, { id: 'jenis', label: 'Jenis' }, { id: 'jumlah', label: 'Jumlah individu', angka: true, bawaan: 1 }],
      petunjuk: 'Satu baris per jenis di tiap titik atau plot: nama unit, jenis, lalu jumlah individu. Unit tempat suatu jenis tidak tercatat dihitung nol.' },
    param: [{ id: 'nunit', label: 'Jumlah unit contoh seluruhnya', angka: true, opsional: true, petunjuk: 'Isi bila ada unit yang tidak mencatat satu individu pun.' }],
    terkurasi: function (T) {
      var ok = function (i) { return hitungan(T, i) && T.C.t[i] >= 0 && T.C.plot[i] && (katGrup(T, i, 'burung') || katGrup(T, i, 'satwa')); };
      return { kendali: [{ id: 'keg', label: 'Kegiatan', opsi: opsiKegiatan(T, ok) }],
        muat: function (v) {
          var idx = pilihTemuan(T, function (i) { return String(T.C.k[i]) === v.keg && ok(i); });
          return { teks: idx.map(function (i) { return T.C.plot[i] + '\t' + namaPolos(T, i) + '\t' + (T.C.j[i] || 1); }).join('\n'), ket: K.n(idx.length) + ' temuan satwa dengan nomor titik atau plot dari kegiatan ini. Titik yang tidak mencatat satwa sama sekali tidak ada di data: isi jumlah unit seluruhnya dari LPK.' };
        } };
    },
    hitung: function (b, p) {
      var unit = unik(b.map(function (r) { return r.unit; })), n = unit.length;
      if (p.nunit) { if (p.nunit < n) throw new Error('Jumlah unit seluruhnya (' + p.nunit + ') lebih kecil dari jumlah unit di data (' + n + ').'); n = p.nunit; }
      if (n < 2) throw new Error('Perlu paling sedikit 2 unit contoh. Data baru memuat ' + n + '.');
      var g = {}, semua = {};
      b.forEach(function (r) { var o = g[r.jenis] || (g[r.jenis] = {}); o[r.unit] = (o[r.unit] || 0) + r.jumlah; semua[r.unit] = (semua[r.unit] || 0) + r.jumlah; });
      function satu(nama, o) {
        var x = Object.keys(o).map(function (u) { return o[u]; }), sx = jml(x), sx2 = jml(x.map(function (v) { return v * v; }));
        var rata = sx / n, s2 = (sx2 - sx * sx / n) / (n - 1), id = rata > 0 ? s2 / rata : null, mor = sx > 1 ? n * (sx2 - sx) / (sx * sx - sx) : null;
        return [nama, sx, rata, s2, id, id === null ? '' : (Math.abs(id - 1) < 0.005 ? 'acak' : (id > 1 ? 'mengelompok' : 'merata')), mor];
      }
      var baris = Object.keys(g).map(function (k) { return satu(k, g[k]); });
      baris.push(satu('Semua jenis', semua));
      return { angka: [{ l: 'Unit contoh (n)', v: K.n(n) }, { l: 'Jenis', v: K.n(Object.keys(g).length) }],
        tabel: [{ judul: 'Indeks dispersi tiap jenis', berkas: 'indeks-dispersi', urut: 'n', kolom: [{ j: 'Jenis' }, { j: 'Jumlah', n: 1, d: 1, id: 'n' }, { j: 'Rata-rata per unit', n: 1, d: 3 }, { j: 'Ragam', n: 1, d: 3 }, { j: 'ID', n: 1, d: 3 }, { j: 'Pola' }, { j: 'Morisita', n: 1, d: 3 }], baris: baris }],
        catatan: ['Pola ditentukan dari ID terhadap 1 seperti di LPK. Untuk uji nyata, bandingkan ID × (n − 1) dengan tabel chi-kuadrat pada derajat bebas n − 1 (Ludwig dan Reynolds 1988).'] };
    }
  });

  KALK.push({
    id: 'mcp', grup: 'ruang', nama: 'Wilayah jelajah MCP',
    ringkas: 'Luas poligon cembung terkecil yang memuat semua titik lokasi, dengan poligon yang bisa diunduh untuk QGIS.',
    kamus: ['mcp'],
    tabel: { kolom: [{ id: 'x', label: 'Bujur atau X', angka: true, negatif: true }, { id: 'y', label: 'Lintang atau Y', angka: true, negatif: true }],
      petunjuk: 'Satu baris per titik: bujur lalu lintang dalam derajat desimal, atau X lalu Y dalam meter (UTM).' },
    param: [{ id: 'sistem', label: 'Sistem koordinat', pilih: [['derajat', 'Derajat desimal (WGS 84)'], ['utm', 'Meter (UTM)']] }],
    terkurasi: function (T) {
      var opsi = [];
      T.taksa.forEach(function (x) { if (x.t === 'jenis' && x.nl >= 3 && (x.k === 'Aves' || x.k === 'Mamalia')) opsi.push([x.tid, (x.n ? x.n + ' · ' : '') + x.i + ' (' + x.nl + ' lokasi)', x.nl]); });
      opsi.sort(function (a, b) { return b[2] - a[2]; });
      return { kendali: [{ id: 'tid', label: 'Jenis', opsi: opsi }],
        muat: function (v) {
          var x = T.tid[v.tid], idx = (T.perTakson[x._i] || []).filter(function (i) { return T.C.lon[i] !== null; });
          return { teks: idx.map(function (i) { return T.C.lon[i] + '\t' + T.C.lat[i]; }).join('\n'), param: { sistem: 'derajat' }, ket: K.n(idx.length) + ' temuan berkoordinat ' + x.i + ' dari semua kegiatan. Ini sebaran temuan seluruh individu, bukan wilayah jelajah satu pasangan: untuk wilayah jelajah, pakai titik dari individu atau pasangan yang sama.' };
        } };
    },
    hitung: function (b, p) {
      var titik = b.map(function (r) { return [r.x, r.y]; }), cat = [];
      if (p.sistem === 'derajat') {
        if (titik.every(function (t) { return Math.abs(t[0]) <= 90 && Math.abs(t[1]) > 90; })) { titik = titik.map(function (t) { return [t[1], t[0]]; }); cat.push('Kolom tampak tertukar (lintang dulu, lalu bujur), jadi urutannya dibalik saat menghitung.'); }
        if (titik.some(function (t) { return Math.abs(t[0]) > 180 || Math.abs(t[1]) > 90; })) throw new Error('Ada koordinat di luar rentang derajat (bujur sampai 180, lintang sampai 90). Bila datanya dalam meter, pilih sistem Meter (UTM).');
      }
      var kunci = {}, u = []; titik.forEach(function (t) { var k = t[0] + ',' + t[1]; if (!kunci[k]) { kunci[k] = 1; u.push(t); } });
      if (u.length < 3) throw new Error('MCP perlu paling sedikit 3 titik berbeda. Data baru memuat ' + u.length + ' titik berbeda.');
      var lat0 = jml(u.map(function (t) { return t[1]; })) / u.length, Rb = 6371008.8, rad = Math.PI / 180;
      var m = p.sistem === 'derajat' ? u.map(function (t) { return [Rb * Math.cos(lat0 * rad) * t[0] * rad, Rb * t[1] * rad, t]; }) : u.map(function (t) { return [t[0], t[1], t]; });
      m.sort(function (a, c) { return a[0] - c[0] || a[1] - c[1]; });
      function silang(o, a, c) { return (a[0] - o[0]) * (c[1] - o[1]) - (a[1] - o[1]) * (c[0] - o[0]); }
      var bawah = [], atas = [], i;
      for (i = 0; i < m.length; i++) { while (bawah.length >= 2 && silang(bawah[bawah.length - 2], bawah[bawah.length - 1], m[i]) <= 0) bawah.pop(); bawah.push(m[i]); }
      for (i = m.length - 1; i >= 0; i--) { while (atas.length >= 2 && silang(atas[atas.length - 2], atas[atas.length - 1], m[i]) <= 0) atas.pop(); atas.push(m[i]); }
      var h = bawah.slice(0, -1).concat(atas.slice(0, -1));
      if (h.length < 3) throw new Error('Semua titik terletak pada satu garis lurus, jadi luas poligon nol. Tambah titik lain.');
      var luas = 0, kel = 0;
      for (i = 0; i < h.length; i++) { var q = h[(i + 1) % h.length]; luas += h[i][0] * q[1] - q[0] * h[i][1]; kel += Math.sqrt(Math.pow(q[0] - h[i][0], 2) + Math.pow(q[1] - h[i][1], 2)); }
      luas = Math.abs(luas) / 2;
      var hasil = { angka: [{ l: 'Titik dipakai', v: K.n(titik.length), k: K.n(u.length) + ' titik berbeda' }, { l: 'Luas MCP', v: K.nd(luas / 10000, 1), k: 'hektare, atau ' + K.nd(luas / 1e6, 2) + ' km²' }, { l: 'Keliling', v: K.nd(kel / 1000, 2), k: 'km' }, { l: 'Titik sudut poligon', v: K.n(h.length) }],
        tabel: [{ judul: 'Titik sudut poligon', berkas: 'mcp-titik-sudut', kolom: [{ j: 'Urutan', n: 1, d: 0 }, { j: p.sistem === 'derajat' ? 'Bujur' : 'X (m)', n: 1, d: 6 }, { j: p.sistem === 'derajat' ? 'Lintang' : 'Y (m)', n: 1, d: 6 }], baris: h.map(function (t, j) { return [j + 1, t[2][0], t[2][1]]; }) }],
        catatan: cat.concat(p.sistem === 'derajat' ? ['Luas dihitung pada bidang datar setempat (proyeksi sama jarak di lintang rata-rata). Untuk bentang puluhan kilometer selisihnya terhadap UTM jauh di bawah 1 %.'] : []) };
      if (p.sistem === 'derajat') {
        var cincin = h.map(function (t) { return [t[2][0], t[2][1]]; }); cincin.push(cincin[0]);
        hasil.unduhan = { label: 'Unduh poligon MCP (GeoJSON)', nama: 'mcp.geojson', tipe: 'application/geo+json', isi: JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { luas_ha: Math.round(luas / 100) / 100, jumlah_titik: titik.length }, geometry: { type: 'Polygon', coordinates: [cincin] } }] }) };
      }
      return hasil;
    }
  });

  KALK.push({
    id: 'karbon', grup: 'karbon', nama: 'Karbon tegakan',
    ringkas: 'Volume pohon dari persamaan alometrik LPK stok karbon, lalu biomassa dan karbon atas dan bawah permukaan.',
    kamus: ['volume-pohon', 'karbon-atas', 'karbon-bawah'],
    tabel: { kolom: [{ id: 'jenis', label: 'Jenis' }, { id: 'diameter', label: 'Diameter (cm)', angka: true }],
      petunjuk: 'Satu baris per pohon: nama jenis lalu diameter setinggi dada dalam cm. Duabanga dan Toona sureni (suren) memakai persamaannya sendiri; jenis lain memakai persamaan hutan alam NTB.' },
    param: [{ id: 'luas', label: 'Luas seluruh petak (m²)', angka: true, opsional: true, petunjuk: 'Isi untuk hasil per hektare.' },
      { id: 'bcef', label: 'BCEF (ton biomassa per m³)', angka: true, opsional: true, petunjuk: 'Dari Tabel 4.5 IPCC 2006 sesuai volume tegakan per hektare. Bila kosong, hanya volume yang dihitung.' },
      { id: 'c', label: 'Fraksi karbon', angka: true, bawaan: 0.47 }, { id: 'nap', label: 'Nisbah akar pucuk', angka: true, opsional: true, petunjuk: 'Dari Tabel 4.4 IPCC 2006. Bila kosong, karbon bawah permukaan tidak dihitung.' }],
    hitung: function (b, p) {
      function pers(nm) { return /duabanga/i.test(nm) ? [0.000107, 2.5541, 'Duabanga sp.'] : (/toona|suren/i.test(nm) ? [0.00013, 2.5017, 'Toona sureni'] : [0.000051464, 2.5874, 'Jenis lain']); }
      var g = {}, V = 0;
      b.forEach(function (r) { var e = pers(r.jenis), v = e[0] * Math.pow(r.diameter, e[1]); V += v; var o = g[r.jenis] || (g[r.jenis] = { n: 0, v: 0, e: e[2] }); o.n++; o.v += v; });
      var ha = p.luas ? p.luas / 10000 : null, angka = [{ l: 'Jumlah pohon', v: K.n(b.length) }, { l: 'Volume', v: K.nd(V, 3), k: 'm³' + (ha ? ', atau ' + K.nd(V / ha, 1) + ' m³ per ha' : '') }], cat = [];
      if (p.bcef) {
        var B = V * p.bcef, c = p.c || 0.47;
        angka.push({ l: 'Biomassa atas permukaan', v: K.nd(B, 3), k: 'ton' + (ha ? ', atau ' + K.nd(B / ha, 1) + ' ton per ha' : '') }, { l: 'Karbon atas permukaan', v: K.nd(B * c, 3), k: 'ton C' + (ha ? ', atau ' + K.nd(B * c / ha, 1) + ' ton C per ha' : '') });
        if (p.nap) angka.push({ l: 'Karbon bawah permukaan', v: K.nd(B * p.nap * c, 3), k: 'ton C' + (ha ? ', atau ' + K.nd(B * p.nap * c / ha, 1) + ' ton C per ha' : '') });
        else cat.push('Nisbah akar pucuk kosong, jadi karbon bawah permukaan tidak dihitung.');
      } else cat.push('BCEF kosong, jadi hanya volume yang dihitung. Isi BCEF untuk mendapat biomassa dan karbon.');
      cat.push('Serasah, tumbuhan bawah, kayu mati, dan karbon tanah dihitung terpisah dengan rumus di Kamus.');
      return { angka: angka, tabel: [{ judul: 'Volume tiap jenis', berkas: 'karbon-volume', urut: 'v', kolom: [{ j: 'Jenis' }, { j: 'Persamaan' }, { j: 'Jumlah pohon', n: 1, d: 0 }, { j: 'Volume (m³)', n: 1, d: 3, id: 'v' }],
        baris: Object.keys(g).map(function (k) { return [k, g[k].e, g[k].n, g[k].v]; }) }], catatan: cat };
    }
  });

  KALK.push({
    id: 'sampel', grup: 'rancangan', nama: 'Jumlah petak dan alokasi strata',
    ringkas: 'Jumlah petak untuk intensitas sampling tertentu, jumlah unit contoh untuk ketelitian tertentu, dan pembagiannya ke tiap strata.',
    kamus: ['intensitas', 'ukuran-contoh', 'stratifikasi'],
    tabel: { kolom: [{ id: 'strata', label: 'Strata' }, { id: 'luas', label: 'Luas (ha)', angka: true }], opsional: true,
      petunjuk: 'Opsional. Satu baris per strata: nama strata lalu luasnya dalam hektare. Jumlah unit contoh dibagi sebanding luas.' },
    param: [{ id: 'A', label: 'Luas areal (ha)', angka: true, opsional: true }, { id: 'is', label: 'Intensitas sampling (%)', angka: true, opsional: true },
      { id: 'pj', label: 'Panjang petak (m)', angka: true, opsional: true }, { id: 'lb', label: 'Lebar petak (m)', angka: true, opsional: true },
      { id: 'cv', label: 'Koefisien variasi (%)', angka: true, opsional: true, petunjuk: 'Dari survei pendahuluan atau survei sebelumnya.' }, { id: 'e', label: 'Galat yang diterima (%)', angka: true, opsional: true },
      { id: 't', label: 'Nilai t', angka: true, bawaan: 2 }],
    contoh: { label: 'Isi contoh intensitas 1 % pada 500 ha', isi: function () { return { teks: '', param: { A: 500, is: 1, pj: 20, lb: 20, cv: 40, e: 10, t: 2 } }; } },
    hitung: function (b, p) {
      var angka = [], n1 = null, n2 = null;
      if (p.A && p.is && p.pj && p.lb) { var a = p.pj * p.lb / 10000; n1 = Math.ceil(p.is / 100 * p.A / a - 1e-9); angka.push({ l: 'Petak untuk intensitas ' + K.nd(p.is, 2) + ' %', v: K.n(n1), k: 'petak ' + K.nd(p.pj, 1) + ' x ' + K.nd(p.lb, 1) + ' m, luas contoh ' + K.nd(n1 * a, 2) + ' ha' }); }
      if (p.cv && p.e) { n2 = Math.ceil(p.t * p.t * p.cv * p.cv / (p.e * p.e) - 1e-9); angka.push({ l: 'Unit contoh untuk galat ' + K.nd(p.e, 1) + ' %', v: K.n(n2), k: 'dengan koefisien variasi ' + K.nd(p.cv, 1) + ' % dan t = ' + K.nd(p.t, 2) }); }
      if (n1 === null && n2 === null) throw new Error('Isian belum cukup. Isi luas areal, intensitas, dan ukuran petak; atau koefisien variasi dan galat.');
      var hasil = { angka: angka, catatan: [] };
      if (b.length) {
        var n = n1 !== null ? n1 : n2, sA = jml(b.map(function (r) { return r.luas; }));
        if (!(sA > 0)) throw new Error('Luas strata semuanya nol. Isi luas tiap strata dalam hektare.');
        hasil.tabel = [{ judul: 'Alokasi ' + K.n(n) + ' unit contoh sebanding luas strata', berkas: 'alokasi-strata', kolom: [{ j: 'Strata' }, { j: 'Luas (ha)', n: 1, d: 1 }, { j: 'Bagian luas (%)', n: 1, d: 1 }, { j: 'Unit contoh', n: 1, d: 0 }],
          baris: b.map(function (r) { return [r.strata, r.luas, r.luas / sA * 100, Math.round(n * r.luas / sA)]; }) }];
        hasil.catatan.push('Pembulatan bisa membuat jumlah alokasi berselisih satu atau dua unit dari ' + K.n(n) + '. Strata kecil sebaiknya tetap mendapat paling sedikit dua unit.');
      }
      return hasil;
    }
  });

  var NAMA_GRUP = {}; (window.KAMUS_GRUP || []).forEach(function (g) { NAMA_GRUP[g.id] = g.nama; });
  function cariKalk(id) { return KALK.filter(function (k) { return k.id === id; })[0]; }
  function namaKamus(id) { var x = (window.KAMUS || []).filter(function (k) { return k.id === id; })[0]; return x ? x.nama : id; }

  /* ---------- halaman daftar kalkulator ---------- */
  function daftar(isi) {
    var h = '<section class="bagian bagian--awal"><h1 class="judul-hal">Kalkulator teknis</h1>' +
      '<p class="lede">' + KALK.length + ' kalkulator untuk rumus yang dipakai di LPK dan RPK teknis PEH. Data bisa ditempel dari Excel, dibaca dari CSV, dari ekspor SMART (kueri CSV atau patroli XML dan ZIP), atau dimuat dari data terkurasi tab ini. Semua hitungan berjalan di browser dan tidak ada data yang diunggah.</p></section>';
    h += '<section class="bagian bagian--rapat"><div class="kalk-grup-daftar">';
    (window.KAMUS_GRUP || []).forEach(function (g) {
      var k = KALK.filter(function (x) { return x.grup === g.id; });
      if (!k.length) return;
      h += '<div class="kalk-grup"><h2 class="sub-kepala" id="kk-' + g.id + '">' + esc(g.nama) + '</h2><ul class="kalk-daftar" aria-labelledby="kk-' + g.id + '">' +
        k.map(function (x) { return '<li><a href="#/kalkulator/' + x.id + '"><b>' + esc(x.nama) + '</b><span>' + esc(x.ringkas) + '</span></a></li>'; }).join('') + '</ul></div>';
    });
    isi.innerHTML = h + '</div></section>';
  }

  /* ---------- halaman satu kalkulator ---------- */
  function halaman(isi, k) {
    var idp = 'kalk-' + k.id;
    var h = '<section class="bagian bagian--awal"><p class="remah"><a href="#/kalkulator">' + K.ikon.kembali + '<span>Semua kalkulator</span></a></p>' +
      '<h1 class="judul-hal">' + esc(k.nama) + '</h1><p class="lede">' + esc(k.ringkas) + '</p>' +
      '<p class="kalk-rumus"><span class="redup">Rumus dan sumbernya di Kamus:</span> ' + k.kamus.map(function (id) { return '<a class="chip" href="#/kamus/' + id + '">' + esc(namaKamus(id)) + '</a>'; }).join(' ') + '</p></section>' +
      '<section class="bagian bagian--rapat"><form class="kartu kalk-form" id="' + idp + '" novalidate>';
    if (k.tabel) {
      h += '<div class="isian isian--penuh"><label for="' + idp + '-data">Data' + (k.tabel.opsional ? ' (opsional)' : '') + '</label>' +
        '<p class="isian-petunjuk" id="' + idp + '-pet">' + esc(k.tabel.petunjuk) + ' Urutan kolom: <b>' + k.tabel.kolom.map(function (c) { return esc(c.label.toLowerCase()); }).join('</b>, <b>') + '</b>. Kolom dipisah tab, titik koma, atau koma.</p>' +
        '<textarea id="' + idp + '-data" rows="9" spellcheck="false" aria-describedby="' + idp + '-pet"></textarea></div>' +
        '<div class="kalk-sumber"><div class="isian"><label for="' + idp + '-berkas">Baca dari berkas</label><input type="file" id="' + idp + '-berkas" accept=".csv,.tsv,.txt,.xml,.zip">' +
        '<p class="isian-petunjuk">CSV atau TSV, ekspor kueri observasi SMART (CSV), atau ekspor patroli SMART (XML atau ZIP).</p></div>' +
        '<div class="kalk-peta" id="' + idp + '-peta" hidden></div>' +
        (k.terkurasi ? '<div class="kalk-kurasi" id="' + idp + '-kurasi"><p class="isian-petunjuk" role="status">Memuat pilihan dari data terkurasi…</p></div>' : '') + '</div>';
    }
    if (k.param && k.param.length) {
      h += '<fieldset class="kalk-param"><legend>Parameter</legend>' + k.param.map(function (q) {
        var id = idp + '-p-' + q.id, pt = q.petunjuk ? '<p class="isian-petunjuk" id="' + id + '-pt">' + esc(q.petunjuk) + '</p>' : '';
        if (q.pilih) return '<div class="isian"><label for="' + id + '">' + esc(q.label) + '</label><select id="' + id + '" data-p="' + q.id + '">' + q.pilih.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('') + '</select>' + pt + '</div>';
        return '<div class="isian"><label for="' + id + '">' + esc(q.label) + (q.opsional ? ' <span class="redup">(opsional)</span>' : '') + '</label><input type="text" inputmode="decimal" autocomplete="off" id="' + id + '" data-p="' + q.id + '"' +
          (q.bawaan !== undefined ? ' value="' + String(q.bawaan).replace('.', ',') + '"' : '') + (q.petunjuk ? ' aria-describedby="' + id + '-pt"' : '') + '>' + pt + '</div>';
      }).join('') + '</fieldset>';
    }
    h += '<div class="kalk-aksi"><button type="submit" class="tombol tombol--utama">' + K.ikon.hitung + '<span>Hitung</span></button>' +
      (k.contoh ? '<button type="button" class="tombol" data-contoh>' + esc(k.contoh.label) + '</button>' : '') +
      '<button type="button" class="tombol tombol--hantu" data-kosong>Kosongkan isian</button></div></form>' +
      '<div class="kalk-hasil" id="' + idp + '-hasil" role="region" aria-live="polite" aria-label="Hasil hitung"></div></section>';
    isi.innerHTML = h;

    var form = isi.querySelector('form'), kotak = isi.querySelector('#' + idp + '-data'), hasil = isi.querySelector('#' + idp + '-hasil');
    function setParam(p) { Object.keys(p || {}).forEach(function (id) { var el = form.querySelector('[data-p="' + id + '"]'); if (el) el.value = el.tagName === 'SELECT' ? p[id] : String(p[id]).replace('.', ','); }); }
    function pesan(el, teks, galat) { el.innerHTML = '<p class="isian-petunjuk' + (galat ? ' isian-galat' : '') + '" role="' + (galat ? 'alert' : 'status') + '">' + esc(teks) + '</p>'; }

    /* berkas dan pemetaan kolom */
    if (k.tabel) {
      var peta = isi.querySelector('#' + idp + '-peta'), tabelBerkas = null;
      var terapkan = function () {
        var pilih = k.tabel.kolom.map(function (c) { return +peta.querySelector('[data-kol="' + c.id + '"]').value; }), pakai = 0, lewat = 0, out = [];
        tabelBerkas.baris.forEach(function (r) {
          var sel = pilih.map(function (j) { return j < 0 ? '' : (r[j] || ''); });
          if (k.tabel.kolom.some(function (c, i) { return !c.angka && !c.opsional && !sel[i]; })) { lewat++; return; }
          pakai++; out.push(sel.join('\t'));
        });
        kotak.value = out.join('\n');
        peta.querySelector('.kalk-peta-hasil').textContent = K.n(pakai) + ' baris masuk ke kotak data' + (lewat ? ', ' + K.n(lewat) + ' dilewati karena kolom wajibnya kosong' : '') + '.';
      };
      isi.querySelector('#' + idp + '-berkas').addEventListener('change', function (e) {
        var f = e.target.files[0]; if (!f) return;
        peta.hidden = false; pesan(peta, 'Membaca ' + f.name + '…');
        tabelDariBerkas(f).then(function (t) {
          tabelBerkas = t;
          peta.innerHTML = '<p class="isian-petunjuk" role="status">' + esc(t.ket) + ' Cocokkan kolom berkas dengan kolom kalkulator:</p><div class="kalk-peta-kisi">' + k.tabel.kolom.map(function (c) {
            var tebak = tebakKolom(c, t.kepala), id = idp + '-kol-' + c.id;
            return '<div class="isian"><label for="' + id + '">' + esc(c.label) + '</label><select id="' + id + '" data-kol="' + c.id + '">' + ((c.angka && (c.opsional || c.bawaan !== undefined)) || c.opsional ? '<option value="-1">Tidak dipakai</option>' : '') +
              t.kepala.map(function (nm, j) { return '<option value="' + j + '"' + (j === tebak ? ' selected' : '') + '>' + esc(nm) + '</option>'; }).join('') + '</select></div>';
          }).join('') + '</div><p class="isian-petunjuk kalk-peta-hasil" role="status"></p>';
          Array.prototype.forEach.call(peta.querySelectorAll('select'), function (s) { s.addEventListener('change', terapkan); });
          terapkan();
        }).catch(function (err) { pesan(peta, err.message, true); });
      });
    }
    /* data terkurasi */
    if (k.terkurasi) {
      var wk = isi.querySelector('#' + idp + '-kurasi');
      var pasang = function () {
        K.siapTemuan().then(function (T) {
          var d = k.terkurasi(T);
          if (d.kendali.some(function (c) { return !c.opsi.length; })) { pesan(wk, 'Data terkurasi tidak memuat kegiatan yang cocok untuk kalkulator ini. Tempel data atau pilih berkas.'); return; }
          wk.innerHTML = '<div class="kalk-peta-kisi">' + d.kendali.map(function (c) { var id = idp + '-kur-' + c.id; return '<div class="isian"><label for="' + id + '">' + esc(c.label) + ' dari data terkurasi</label><select id="' + id + '" data-kur="' + c.id + '">' + c.opsi.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select></div>'; }).join('') +
            '</div><p><button type="button" class="tombol" data-muat>Muat ke kotak data</button></p><p class="isian-petunjuk kalk-kurasi-ket" role="status"></p>';
          wk.querySelector('[data-muat]').addEventListener('click', function () {
            var v = {}; Array.prototype.forEach.call(wk.querySelectorAll('[data-kur]'), function (s) { v[s.getAttribute('data-kur')] = s.value; });
            var r = d.muat(v);
            kotak.value = r.teks; setParam(r.param);
            wk.querySelector('.kalk-kurasi-ket').textContent = r.teks ? r.ket : 'Tidak ada temuan yang cocok dengan pilihan ini. Ganti kegiatan atau kelompoknya.';
            hasil.innerHTML = '';
          });
        }).catch(function (err) {
          wk.innerHTML = '<p class="isian-petunjuk isian-galat" role="alert">' + esc(err.message) + ' Kalkulator tetap bisa dipakai dengan data tempel atau berkas.</p><p><button type="button" class="tombol" data-ulang>Coba muat lagi</button></p>';
          wk.querySelector('[data-ulang]').addEventListener('click', function () { pesan(wk, 'Memuat pilihan dari data terkurasi…'); pasang(); });
        });
      };
      pasang();
    }
    if (k.contoh) form.querySelector('[data-contoh]').addEventListener('click', function () { var c = k.contoh.isi(); if (kotak && c.teks !== undefined) kotak.value = c.teks; setParam(c.param); hasil.innerHTML = ''; form.querySelector('button[type="submit"]').focus(); });
    form.querySelector('[data-kosong]').addEventListener('click', function () {
      if (kotak) kotak.value = '';
      (k.param || []).forEach(function (q) { var el = form.querySelector('[data-p="' + q.id + '"]'); if (el && el.tagName !== 'SELECT') el.value = q.bawaan !== undefined ? String(q.bawaan).replace('.', ',') : ''; });
      hasil.innerHTML = ''; (kotak || form.querySelector('input')).focus();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      try {
        var p = {};
        (k.param || []).forEach(function (q) {
          var el = form.querySelector('[data-p="' + q.id + '"]');
          if (q.pilih) { p[q.id] = el.value; return; }
          var v = el.value.trim();
          if (v === '') { p[q.id] = q.bawaan !== undefined ? q.bawaan : null; return; }
          var a = K.angka(v);
          if (isNaN(a)) throw new Error('Isian "' + q.label + '" berisi "' + v + '", bukan angka. Tulis angka saja, misalnya 12,5.');
          if (a < 0) throw new Error('Isian "' + q.label + '" bernilai negatif. Isi angka nol atau lebih.');
          p[q.id] = a;
        });
        var b = [];
        if (k.tabel) {
          var kol = k.tabel.kolom.map(function (c) { return c; });
          if (kotak.value.trim() || !k.tabel.opsional) b = bacaBarisMcp(kotak.value, kol, k);
        }
        tampil(k.hitung(b, p));
      } catch (err) {
        hasil.innerHTML = '<div class="galat galat--dalam" role="alert"><h2>Belum bisa dihitung</h2><p>' + esc(err.message) + '</p></div>';
      }
    });
    /* kolom koordinat boleh negatif (lintang selatan) */
    function bacaBarisMcp(teks, kol, kk) {
      if (!kol.some(function (c) { return c.negatif; })) return bacaBaris(teks, kol, kk.id === 'tandai' ? 2 : 1);
      var u = K.uraiTabel(teks).baris, out = [], galat = [];
      if (u.length && isNaN(K.angka(u[0][0])) && isNaN(K.angka(u[0][1]))) u = u.slice(1);
      u.forEach(function (r, i) { var x = K.angka(r[0]), y = K.angka(r[1]); if (isNaN(x) || isNaN(y)) galat.push('baris ' + (i + 1)); else out.push({ x: x, y: y }); });
      if (galat.length) throw new Error('Ada ' + galat.length + ' baris yang koordinatnya tidak terbaca (' + galat.slice(0, 3).join(', ') + '). Tulis dua angka per baris, misalnya 117,98 lalu -8,25.');
      if (!out.length) throw new Error('Kotak data masih kosong. Tempel koordinat, pilih berkas, atau muat dari data terkurasi dulu.');
      return out;
    }

    function tampil(r) {
      var h2 = '<h2 class="sub-kepala">Hasil</h2>';
      if (r.angka && r.angka.length) h2 += '<div class="fakta-deret">' + r.angka.map(function (a) { return '<div><span>' + esc(a.l) + '</span><b>' + esc(a.v) + '</b>' + (a.k ? '<small>' + esc(a.k) + '</small>' : '') + '</div>'; }).join('') + '</div>';
      if (r.catatan && r.catatan.length) h2 += '<ul class="kalk-catatan">' + r.catatan.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>';
      hasil.innerHTML = h2;
      (r.tabel || []).forEach(function (t) {
        var kolom = t.kolom.map(function (c, j) {
          return { id: c.id || 'c' + j, judul: c.j, n: !!c.n, nilai: function (row) { return row[j]; },
            /* kolom cacah (paling banyak satu desimal) ditulis tanpa ",0" supaya 5 ekor tidak tampil sebagai 5,0 */
            isi: function (row) { var v = row[j]; return v === null || v === undefined ? '' : (c.n ? (c.d !== undefined && c.d <= 1 ? K.nd(v, c.d) : K.n(v, c.d === undefined ? 2 : c.d)) : esc(v)); } };
        });
        var tb = K.tabel({ kolom: kolom, baris: t.baris, perHal: 15, label: t.judul, urut: t.urut ? { id: t.urut, turun: true } : null, kepalaBaris: true });
        var w = K.el('<div class="kalk-tabel"><h3 class="sub-judul">' + esc(t.judul) + '</h3></div>');
        w.appendChild(tb.el);
        w.appendChild(K.unduhan('Unduh tabel ini (CSV)', t.berkas, function () { return { kolom: t.kolom.map(function (c, j) { return { judul: c.j, nilai: function (row) { return row[j]; } }; }), baris: tb.baris() }; }));
        hasil.appendChild(w);
      });
      if (r.unduhan) {
        var bt = K.el('<p><button type="button" class="tombol">' + K.ikon.unduh + '<span>' + esc(r.unduhan.label) + '</span></button></p>');
        bt.querySelector('button').addEventListener('click', function () { K.simpanBerkas(r.unduhan.nama, r.unduhan.isi, r.unduhan.tipe); });
        hasil.appendChild(bt);
      }
      var atas = document.querySelector('.kepala').offsetHeight + 12;
      window.scrollTo({ top: hasil.getBoundingClientRect().top + window.pageYOffset - atas, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  K.rute.kalkulator = {
    judul: 'Kalkulator teknis',
    muat: function (isi, arg) {
      var k = arg[0] ? cariKalk(arg[0]) : null;
      if (arg[0] && !k) { isi.innerHTML = '<div class="galat"><h1 style="font-family:var(--serif);font-size:24px;margin-bottom:8px">Kalkulator tidak ditemukan</h1><p>Tidak ada kalkulator bernama "' + esc(arg[0]) + '". Tautan mungkin salah ketik.</p><p style="margin-top:14px"><a class="tombol" href="#/kalkulator">Lihat semua kalkulator</a></p></div>'; return; }
      if (k) { document.title = k.nama + ' · Kalkulator teknis · Keanekaragaman Hayati'; halaman(isi, k); } else daftar(isi);
    },
    ubah: function (arg) { window.scrollTo(0, 0); this.muat(document.getElementById('isi'), arg); document.getElementById('isi').focus({ preventScroll: true }); }
  };

  /* ---------- generator RPK dan LPK ---------- */
  var KALK_METODE = {
    RAPTOR: ['titik', 'indeks', 'dispersi'], ELFLO: ['titik', 'indeks', 'dispersi', 'mcp', 'vegetasi'], BURUNG: ['titik', 'indeks', 'penduga'], RUSA: ['transek', 'pellet', 'jejak', 'dispersi', 'vegetasi'],
    SATKUN: ['transek', 'titik'], GC: ['vegetasi', 'indeks'], KEHATI: ['vegetasi', 'indeks'], TUMPEN: ['vegetasi', 'indeks'], IAS: ['vegetasi', 'indeks'], ANGGREK: ['indeks', 'penduga'],
    LEPAS: ['indeks', 'penduga', 'vegetasi'], KARBON: ['karbon', 'vegetasi'], UMAANI: ['indeks'], REKAP: ['mcp']
  };
  K.rute.generator = {
    judul: 'Generator RPK dan LPK',
    muat: function (isi) {
      var g = K.giliran;
      K.memuat(isi, 'Memuat daftar kegiatan…');
      K.ambil('kegiatan.json').then(function (keg) {
        if (g !== K.giliran) return;
        var m = {}, urut = [];
        keg.forEach(function (k) { if (k.kode === 'SMART') return; var o = m[k.kode]; if (!o) { o = m[k.kode] = { kode: k.kode, metode: k.metode, n: 0, th: {} }; urut.push(o); } o.n++; o.th[k.tahun] = 1; });
        urut.sort(function (a, b) { return b.n - a.n; });
        isi.innerHTML = '<section class="bagian bagian--awal"><h1 class="judul-hal">Generator RPK dan LPK teknis</h1>' +
          '<p class="lede">Generator menyusun naskah Rencana dan Laporan Pelaksanaan Kegiatan dari data lapangan, lengkap dengan narasi metode, rumus, tabel, dan lampiran. Saat ini tersedia untuk dua jenis kegiatan. Untuk kegiatan lain, hitungannya sudah bisa dikerjakan dengan kalkulator, dan generator naskahnya dibuat bertahap per metode.</p>' +
          '<div class="grid grid-2s gen-ada">' +
          '<a class="kartu gen-kartu" href="https://kopluck8.github.io/PEH-Tambora/" rel="noopener"><span class="gen-judul">Generator LPK inventarisasi dan sebaran raptor' + K.ikon.luar + '</span><span class="gen-ket">Kalkulator analisis data dan penyusun LPK raptor, dari isian tabel atau ekspor patroli SMART dengan kategori Metode Teknis. Dibuka di PEH-Tambora.</span></a>' +
          '<a class="kartu gen-kartu" href="https://kopluck8.github.io/SMART_Report_generator/" rel="noopener"><span class="gen-judul">Generator LPK dan RPK SMART Patrol' + K.ikon.luar + '</span><span class="gen-ket">Penyusun laporan dan rencana patroli dari ekspor SMART, termasuk temuan satwa dan tumbuhan selama patroli.</span></a></div></section>' +
          '<section class="bagian"><div class="bagian-kepala"><span class="bagian-no">01</span><h2>Kegiatan teknis di arsip LPK dan kesiapan alatnya</h2><p>' + K.n(keg.length - 1) + ' kegiatan dari ' + urut.length + ' jenis kegiatan, 2020 sampai 2026. Tautan kalkulator membuka hitungan yang dipakai jenis kegiatan itu.</p></div>' +
          '<div class="tabel-wadah" tabindex="0" role="region" aria-label="Kegiatan teknis dan kesiapan alat"><table><thead><tr><th scope="col">Jenis kegiatan</th><th scope="col" class="n">LPK di arsip</th><th scope="col">Tahun</th><th scope="col">Kalkulator yang dipakai</th><th scope="col">Generator naskah</th></tr></thead><tbody>' +
          urut.map(function (o) {
            var th = Object.keys(o.th).sort();
            return '<tr><th scope="row">' + esc(o.metode) + '</th><td class="n">' + o.n + '</td><td class="sempit">' + (th.length > 1 ? th[0] + ' sampai ' + th[th.length - 1] : th[0]) + '</td><td><span class="chip-deret">' +
              (KALK_METODE[o.kode] || []).map(function (id) { var c = cariKalk(id); return c ? '<a class="chip" href="#/kalkulator/' + id + '">' + esc(c.nama) + '</a>' : ''; }).join('') + '</span></td><td>' +
              (o.kode === 'RAPTOR' ? '<a href="https://kopluck8.github.io/PEH-Tambora/" rel="noopener">Tersedia di PEH-Tambora</a>' : '<span class="redup">Menyusul</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<p class="kartu-catatan">Urutan pembuatan generator berikutnya mengikuti jumlah LPK di arsip, dimulai dari monitoring elang flores dan monitoring rusa timor. Data model SMART untuk kategori Metode Teknis ada di repo PEH-Tambora.</p></section>';
      }).catch(function (e) { if (g === K.giliran) K.galat(isi, e, K.muatUlang); });
    }
  };
})();
