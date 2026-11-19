/* Keanekaragaman Hayati · inti: pembantu, pemuat data, rute, penulis rumus, tabel, unduhan, dan peta dasar.
   Data dibaca dari ../data/kehati/ (hasil kurasi LPK teknis PEH dan temuan SMART Patrol). */
(function () {
  'use strict';

  var DASAR = '../data/kehati/';
  var K = window.KEHATI = { rute: {}, simpan: {}, DASAR: DASAR };
  var isi = document.getElementById('isi');
  var tip = document.getElementById('tip');

  /* ---------- teks dan angka ---------- */
  K.esc = function (s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var nf = {};
  K.n = function (x, d) {
    if (x === null || x === undefined || x === '' || !isFinite(x)) return '-';
    d = d || 0;
    if (!nf[d]) nf[d] = new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
    return nf[d].format(x);
  };
  /* angka dengan desimal seperlunya (paling banyak d) */
  K.nd = function (x, d) {
    if (x === null || x === undefined || x === '' || !isFinite(x)) return '-';
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: d === undefined ? 2 : d }).format(x);
  };
  K.tgl = function (s) {
    if (!s) return '';
    var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(s);
    if (!m) return s;
    var b = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][+m[2] - 1];
    return (m[3] ? +m[3] + ' ' : '') + b + ' ' + m[1];
  };
  /* tahun temuan SMART Patrol yang ada di data, dibaca dari ringkasan.json: '2026', '2025 dan 2026', atau '2024 sampai 2026' */
  K.smartTahun = function (r) {
    var th = ((r && r.smart) || []).map(function (s) { return s.tahun; });
    if (!th.length) return '';
    if (th.length === 1) return String(th[0]);
    if (th.length === 2) return th[0] + ' dan ' + th[1];
    return th[0] + ' sampai ' + th[th.length - 1];
  };
  /* tinggi kepala halaman yang menempel di atas, untuk jarak saat menggulir ke suatu bagian */
  K.tinggiAtas = function () { var t = document.querySelector('.topbar'); return t ? t.offsetHeight : 0; };
  K.el = function (html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  K.ikon = {
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/></svg>',
    unduh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 19.5h14"/></svg>',
    luar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18.5 14v4.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5H10"/></svg>',
    hitung: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12.5h.01M12 12.5h.01M15.5 12.5h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/></svg>',
    peta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/></svg>',
    tabel: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M3 14.5h18M9 9.5V20"/></svg>',
    grafik: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20h17"/><path d="M6.5 20v-7M12 20V5M17.5 20v-10"/></svg>',
    daun: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 6.8 10.6h2.8L5.8 16.6h12.4l-3.8-6h2.8z"/><path d="M12 16.6v3.9"/></svg>',
    buku: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    kembali: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12h-15M10.5 6l-6 6 6 6"/></svg>'
  };

  /* ---------- pemuat data dengan keadaan memuat dan galat ---------- */
  K.ambil = function (nama) {
    if (!K.simpan[nama]) {
      K.simpan[nama] = fetch(DASAR + nama, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) { var e = new Error('Server menjawab ' + r.status + ' saat mengambil data/kehati/' + nama + '.'); e.kode = r.status; throw e; }
        return r.json().catch(function () { throw new Error('Isi data/kehati/' + nama + ' bukan JSON yang utuh. Berkas mungkin terpotong saat diunggah.'); });
      }).catch(function (e) {
        delete K.simpan[nama];
        if (e instanceof TypeError) e = new Error('Sambungan terputus saat mengambil data/kehati/' + nama + '.');
        e.berkas = nama;
        throw e;
      });
    }
    return K.simpan[nama];
  };
  K.semua = function (daftar) { return Promise.all(daftar.map(K.ambil)); };
  K.memuat = function (wadah, teks) {
    wadah.innerHTML = '<div class="memuat" role="status"><span class="memuat-cincin" aria-hidden="true"></span>' + K.esc(teks) + '</div>';
  };
  K.galat = function (wadah, e, ulang) {
    var saran = e && e.kode === 404
      ? 'Berkas itu belum ada di repo. Periksa folder data/kehati lalu muat ulang halaman.'
      : 'Periksa sambungan internet lalu coba lagi. Bila tetap gagal, buka data/kehati di repo dan pastikan berkasnya terunggah utuh.';
    wadah.innerHTML = '<div class="galat" role="alert"><h2>Data tidak bisa dimuat</h2><p>' + K.esc(e && e.message ? e.message : 'Terjadi kesalahan saat mengolah data.') + '</p>' +
      '<p class="redup" style="margin-top:8px">' + saran + '</p>' +
      (ulang ? '<p style="margin-top:14px"><button class="tombol" type="button" data-ulang>Coba muat lagi</button></p>' : '') + '</div>';
    var b = wadah.querySelector('[data-ulang]');
    if (b) b.addEventListener('click', ulang);
    if (window.console) console.error(e);
  };

  /* ---------- data temuan: kolom per kolom, dibungkus agar mudah dipakai ---------- */
  K.siapTemuan = function () {
    if (K._temuan) return K._temuan;
    K._temuan = K.semua(['temuan.json', 'taksa.json', 'kegiatan.json']).then(function (h) {
      var t = h[0], taksa = h[1], keg = h[2], C = t.kolom, Q = t.kamus, i;
      var kegId = {}; keg.forEach(function (k) { kegId[k.id] = k; });
      var tid = {}; taksa.forEach(function (x, j) { x._i = j; tid[x.tid] = x; });
      var perTakson = {};
      for (i = 0; i < t.n; i++) { var ti = C.t[i]; if (ti >= 0) (perTakson[ti] || (perTakson[ti] = [])).push(i); }
      return K.T = { n: t.n, C: C, Q: Q, taksa: taksa, tid: tid, keg: keg, kegId: kegId, perTakson: perTakson, dibuat: t.dibuat };
    });
    return K._temuan;
  };
  /* nama tampil satu takson */
  K.namaTakson = function (x) {
    if (!x) return '';
    if (x.t === 'jenis' || x.t === 'marga') return '<span class="ilmiah">' + K.esc(x.i) + (x.t === 'marga' ? ' sp.' : '') + '</span>';
    return K.esc(x.n || x.i || x.tid);
  };
  K.lencanaStatus = function (x) {
    var h = '';
    if (x.p106 === 'Dilindungi') h += '<span class="status status--lindung" title="Dilindungi menurut Permen LHK P.106/2018">Dilindungi</span>';
    if (x.iucn && x.iucn !== 'LC' && x.iucn !== 'NE') h += '<span class="status status--' + K.esc(x.iucn) + '" title="Daftar Merah IUCN: ' + K.esc(K.IUCN[x.iucn] || x.iucn) + '">' + K.esc(x.iucn) + '</span>';
    if (x.cites === 'Appendix I' || x.cites === 'Appendix II') h += '<span class="status" title="CITES ' + K.esc(x.cites) + '">CITES ' + (x.cites === 'Appendix I' ? 'I' : 'II') + '</span>';
    if (x.inv) h += '<span class="status status--asing" title="Tercatat sebagai jenis asing invasif di daftar induk">Invasif</span>';
    else if (x.sb === 'Introduced') h += '<span class="status status--asing" title="Jenis asing (introduksi) menurut daftar induk">Asing</span>';
    if (x.h === 'Endemik') h += '<span class="status" title="Endemik menurut daftar induk">Endemik</span>';
    return h;
  };
  K.IUCN = { CR: 'Kritis', EN: 'Genting', VU: 'Rentan', NT: 'Hampir terancam', LC: 'Risiko rendah', DD: 'Kurang data', NE: 'Belum dinilai' };
  /* kelompok warna peta: tiga warna yang lolos uji buta warna, tipe ekosistem dibedakan lewat bentuk */
  K.KELOMPOK = [
    { id: 'burung', nama: 'Burung', warna: '#3987e5', kategori: ['Aves'] },
    { id: 'satwa', nama: 'Mamalia dan fauna lain', warna: '#d95926', kategori: ['Mamalia', 'Fauna lain'] },
    { id: 'tumbuhan', nama: 'Tumbuhan dan anggrek', warna: '#199e70', kategori: ['Flora', 'Anggrek'] },
    { id: 'eko', nama: 'Tipe ekosistem', warna: '#eee8d5', kategori: ['Tipe Ekosistem'], kotak: true },
    { id: 'lain', nama: 'Belum terkelompok', warna: '#929381', kategori: ['Belum terkelompok'] }
  ];
  K.kelompokDari = {};
  K.KELOMPOK.forEach(function (g) { g.kategori.forEach(function (k) { K.kelompokDari[k] = g; }); });
  K.NAMA_KAT = { 'Aves': 'Burung (Aves)', 'Mamalia': 'Mamalia', 'Flora': 'Flora', 'Anggrek': 'Anggrek', 'Tipe Ekosistem': 'Tipe ekosistem', 'Fauna lain': 'Fauna lain', 'Belum terkelompok': 'Belum terkelompok' };

  /* ---------- penulis rumus: subset TeX ke MathML ---------- */
  var HURUF = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', lambda: 'λ', mu: 'μ', pi: 'π', rho: 'ρ', sigma: 'σ', theta: 'θ', psi: 'ψ', Psi: 'Ψ', tau: 'τ', phi: 'φ', omega: 'ω', Delta: 'Δ' };
  var OPR = { times: '×', cdot: '·', le: '≤', ge: '≥', approx: '≈', ne: '≠', pm: '±', infty: '∞', ldots: '…', propto: '∝' };
  var FUNGSI = { ln: 1, log: 1, exp: 1, min: 1, max: 1 };
  K.tex = function (src, blok) {
    var s = src, i = 0;
    function lewati() { while (s[i] === ' ') i++; }
    function grup() { /* isi {...} sebagai mrow */
      i++; var isiG = deret('}'); i++; return '<mrow>' + isiG + '</mrow>';
    }
    function teksKurung() { var a = s.indexOf('}', i); var t = s.slice(i + 1, a); i = a + 1; return t; }
    function satu() {
      lewati();
      var c = s[i];
      if (c === undefined) return '';
      if (c === '{') return grup();
      if (c === '"') { var a = s.indexOf('"', i + 1), t = s.slice(i + 1, a); i = a + 1; return /\s/.test(t) ? '<mtext>' + K.esc(t) + '</mtext>' : '<mi mathvariant="normal">' + K.esc(t) + '</mi>'; }
      if (c === '\\') {
        var m = /^\\([A-Za-z]+|[,%\\ ])/.exec(s.slice(i));
        var p = m[1]; i += m[0].length;
        if (p === 'frac') { lewati(); var a1 = grup(); lewati(); var b1 = grup(); return '<mfrac>' + a1 + b1 + '</mfrac>'; }
        if (p === 'sqrt') { lewati(); return '<msqrt>' + grup() + '</msqrt>'; }
        if (p === 'text') { lewati(); return '<mtext>' + K.esc(teksKurung()) + '</mtext>'; }
        if (p === 'hat') { lewati(); return '<mover accent="true">' + satu() + '<mo>^</mo></mover>'; }
        if (p === 'bar') { lewati(); return '<mover accent="true">' + satu() + '<mo>‾</mo></mover>'; }
        if (p === 'sum') return '<mo>∑</mo>';
        if (p === 'prod') return '<mo>∏</mo>';
        if (p === 'left' || p === 'right') return satu();
        if (p === ',') return '<mspace width="0.2em"></mspace>';
        if (p === ' ') return '<mspace width="0.4em"></mspace>';
        if (p === '%') return '<mo>%</mo>';
        if (HURUF[p]) return '<mi>' + HURUF[p] + '</mi>';
        if (OPR[p]) return '<mo>' + OPR[p] + '</mo>';
        if (FUNGSI[p]) return '<mi>' + p + '</mi><mo>&#x2061;</mo>';
        return '<mtext>' + K.esc(p) + '</mtext>';
      }
      var md = /^\d+(?:[.,]\d+)*/.exec(s.slice(i));
      if (md) { i += md[0].length; return '<mn>' + md[0] + '</mn>'; }
      i++;
      if (/[A-Za-z]/.test(c)) return '<mi>' + c + '</mi>';
      if (c === '-') return '<mo>−</mo>';
      if (c === '*') return '<mo>×</mo>';
      if (c === '<') return '<mo>&lt;</mo>';
      if (c === '>') return '<mo>&gt;</mo>';
      if (c === '(' || c === ')' || c === '[' || c === ']' || c === '|') return '<mo>' + c + '</mo>';
      return '<mo>' + K.esc(c) + '</mo>';
    }
    function deret(henti) {
      var out = '';
      for (;;) {
        lewati();
        if (i >= s.length || s[i] === henti) break;
        var besar = /^\\(sum|prod)/.test(s.slice(i));
        var d = satu(), bawah = null, atas = null;
        for (;;) {
          lewati();
          if (s[i] === '_') { i++; bawah = satu(); }
          else if (s[i] === '^') { i++; atas = satu(); }
          else if (s[i] === "'") { i++; atas = '<mo>′</mo>'; }
          else break;
        }
        if (bawah !== null && atas !== null) d = besar && blok ? '<munderover>' + d + bawah + atas + '</munderover>' : '<msubsup>' + d + bawah + atas + '</msubsup>';
        else if (bawah !== null) d = besar && blok ? '<munder>' + d + bawah + '</munder>' : '<msub>' + d + bawah + '</msub>';
        else if (atas !== null) d = '<msup>' + d + atas + '</msup>';
        out += d;
      }
      return out;
    }
    var badan;
    try { badan = deret(); } catch (e) { return '<code>' + K.esc(src) + '</code>'; }
    return '<math xmlns="http://www.w3.org/1998/Math/MathML"' + (blok ? ' display="block"' : '') + '>' + badan + '</math>';
  };
  K.rumus = function (src) { return '<div class="rumus" tabindex="0" role="group" aria-label="Rumus">' + K.tex(src, true) + '</div>'; };

  /* ---------- tabel: urut per kolom dan halaman ---------- */
  K.tabel = function (o) {
    var keadaan = { hal: 0, urut: o.urut ? o.urut.id : null, turun: o.urut ? !!o.urut.turun : false, baris: o.baris || [] };
    var per = o.perHal || 25;
    // nama wilayah tabel diawali "Tabel" agar tidak sama dengan judul bagian yang memuatnya
    var lbl = o.label || 'Tabel';
    if (!/^tabel/i.test(lbl)) lbl = 'Tabel ' + (/^[A-Z][a-z]/.test(lbl) ? lbl.charAt(0).toLowerCase() + lbl.slice(1) : lbl);
    var wadah = K.el('<div class="tabel-kom"><div class="tabel-wadah" tabindex="0" role="region" aria-label="' + K.esc(lbl) + '"><table><thead><tr></tr></thead><tbody></tbody></table></div><div class="tabel-kaki"></div></div>');
    var trh = wadah.querySelector('thead tr'), tb = wadah.querySelector('tbody'), kaki = wadah.querySelector('.tabel-kaki');
    o.kolom.forEach(function (k) {
      var th = document.createElement('th');
      th.scope = 'col';
      if (k.n) th.className = 'n';
      if (k.nilai) {
        th.innerHTML = '<button type="button" class="urut" data-k="' + k.id + '">' + K.esc(k.judul) + '<span class="urut-tanda" aria-hidden="true"></span></button>';
      } else th.textContent = k.judul;
      if (k.tip) th.title = k.tip;
      trh.appendChild(th);
    });
    function terurut() {
      var b = keadaan.baris;
      if (!keadaan.urut) return b;
      var k = o.kolom.filter(function (x) { return x.id === keadaan.urut; })[0];
      if (!k) return b;
      var arah = keadaan.turun ? -1 : 1;
      return b.slice().sort(function (p, q) {
        var a = k.nilai(p), c = k.nilai(q);
        var ka = a === null || a === undefined || a === '', kc = c === null || c === undefined || c === '';
        if (ka && kc) return 0; if (ka) return 1; if (kc) return -1;
        if (typeof a === 'number' && typeof c === 'number') return (a - c) * arah;
        return String(a).localeCompare(String(c), 'id') * arah;
      });
    }
    function gambar() {
      var b = terurut(), nHal = Math.max(1, Math.ceil(b.length / per));
      if (keadaan.hal >= nHal) keadaan.hal = nHal - 1;
      var awal = keadaan.hal * per, potong = b.slice(awal, awal + per);
      Array.prototype.forEach.call(trh.children, function (th, j) {
        var k = o.kolom[j];
        if (!k.nilai) return;
        th.setAttribute('aria-sort', keadaan.urut === k.id ? (keadaan.turun ? 'descending' : 'ascending') : 'none');
      });
      if (!potong.length) {
        tb.innerHTML = '<tr><td class="kosong" colspan="' + o.kolom.length + '">' + (o.kosong || 'Tidak ada baris yang cocok dengan saringan. Longgarkan saringan untuk melihat data.') + '</td></tr>';
      } else {
        tb.innerHTML = potong.map(function (r) {
          return '<tr>' + o.kolom.map(function (k, j) {
            var v = k.isi(r);
            return (j === 0 && o.kepalaBaris ? '<th scope="row"' : '<td') + (k.n ? ' class="n"' : (k.kelas ? ' class="' + k.kelas + '"' : '')) + '>' + (v === null || v === undefined ? '' : v) + (j === 0 && o.kepalaBaris ? '</th>' : '</td>');
          }).join('') + '</tr>';
        }).join('');
      }
      kaki.innerHTML = '<span>' + (b.length ? 'Baris ' + K.n(awal + 1) + ' sampai ' + K.n(Math.min(b.length, awal + per)) + ' dari ' + K.n(b.length) : '0 baris') + '</span>' +
        (nHal > 1 ? '<span class="tabel-hal"><button type="button" class="tombol tombol--hantu" data-h="-1"' + (keadaan.hal === 0 ? ' disabled' : '') + '>Sebelumnya</button>' +
          '<span aria-live="polite">Halaman ' + K.n(keadaan.hal + 1) + ' dari ' + K.n(nHal) + '</span>' +
          '<button type="button" class="tombol tombol--hantu" data-h="1"' + (keadaan.hal >= nHal - 1 ? ' disabled' : '') + '>Berikutnya</button></span>' : '');
      if (o.sesudah) o.sesudah(b);
    }
    trh.addEventListener('click', function (e) {
      var b = e.target.closest('button.urut'); if (!b) return;
      var id = b.getAttribute('data-k');
      if (keadaan.urut === id) keadaan.turun = !keadaan.turun; else { keadaan.urut = id; var k = o.kolom.filter(function (x) { return x.id === id; })[0]; keadaan.turun = !!(k && k.n); }
      keadaan.hal = 0; gambar();
    });
    kaki.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-h]'); if (!b) return;
      keadaan.hal += +b.getAttribute('data-h'); gambar();
      wadah.querySelector('.tabel-wadah').scrollTop = 0;
    });
    gambar();
    return { el: wadah, setel: function (baris) { keadaan.baris = baris; keadaan.hal = 0; gambar(); }, baris: function () { return terurut(); } };
  };

  /* ---------- unduhan CSV: dua format karena Excel berbahasa Indonesia memakai titik koma dan koma desimal ---------- */
  K.csv = function (kolom, baris, excel) {
    var pisah = excel ? ';' : ',';
    function sel(v) {
      if (v === null || v === undefined) return '';
      if (typeof v === 'number') { v = String(v); if (excel) v = v.replace('.', ','); return v; }
      v = String(v);
      return /[";,\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }
    var out = [kolom.map(function (k) { return sel(k.judul); }).join(pisah)];
    baris.forEach(function (r) { out.push(kolom.map(function (k) { return sel(k.nilai(r)); }).join(pisah)); });
    /* tanda urutan bait hanya untuk Excel; R dan pandas membacanya sebagai bagian dari nama kolom pertama */
    return (excel ? '\uFEFF' : '') + out.join('\r\n');
  };
  K.simpanBerkas = function (nama, teks, tipe) {
    var blob = new Blob([teks], { type: tipe || 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  };
  /* tombol unduh dengan pilihan format; ambil() mengembalikan {kolom, baris} saat tombol ditekan */
  K.unduhan = function (label, nama, ambil) {
    var id = 'fmt-' + Math.random().toString(36).slice(2, 8);
    var w = K.el('<div class="unduhan"><label class="kecil redup" for="' + id + '">Format</label>' +
      '<select id="' + id + '"><option value="excel">Excel Indonesia (titik koma, desimal koma)</option><option value="umum">QGIS, R, atau SMART (koma, desimal titik)</option></select>' +
      '<button type="button" class="tombol">' + K.ikon.unduh + '<span>' + K.esc(label) + '</span></button><span class="unduhan-hasil kecil redup" role="status"></span></div>');
    w.querySelector('button').addEventListener('click', function () {
      var d = ambil(), excel = w.querySelector('select').value === 'excel';
      if (!d.baris.length) { w.querySelector('.unduhan-hasil').textContent = 'Tidak ada baris untuk diunduh. Longgarkan saringan dulu.'; return; }
      K.simpanBerkas(nama + '.csv', K.csv(d.kolom, d.baris, excel));
      w.querySelector('.unduhan-hasil').textContent = K.n(d.baris.length) + ' baris diunduh.';
    });
    return w;
  };

  /* ---------- membaca teks tempel atau berkas CSV (termasuk ekspor kueri SMART) ---------- */
  K.uraiTabel = function (teks) {
    teks = String(teks || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    var baris1 = teks.split('\n').filter(function (x) { return x.trim(); })[0] || '';
    var hit = { '\t': (baris1.match(/\t/g) || []).length, ';': (baris1.match(/;/g) || []).length, ',': (baris1.match(/,/g) || []).length };
    /* titik koma didahulukan dari koma, karena koma sering dipakai sebagai tanda desimal */
    var pisah = hit['\t'] ? '\t' : (hit[';'] ? ';' : (hit[','] ? ',' : '\t'));
    var out = [], sel = '', baris = [], kutip = false, c, i;
    for (i = 0; i < teks.length; i++) {
      c = teks[i];
      if (kutip) { if (c === '"') { if (teks[i + 1] === '"') { sel += '"'; i++; } else kutip = false; } else sel += c; }
      else if (c === '"' && sel === '') kutip = true;
      else if (c === pisah) { baris.push(sel.trim()); sel = ''; }
      else if (c === '\n') { baris.push(sel.trim()); sel = ''; if (baris.some(function (x) { return x !== ''; })) out.push(baris); baris = []; }
      else sel += c;
    }
    baris.push(sel.trim()); if (baris.some(function (x) { return x !== ''; })) out.push(baris);
    return { baris: out, pisah: pisah };
  };
  /* angka dari teks: menerima koma atau titik desimal */
  K.angka = function (v) {
    if (typeof v === 'number') return v;
    v = String(v === null || v === undefined ? '' : v).trim().replace(/[\s\u00a0]/g, '');
    if (!v) return NaN;
    /* satu titik atau satu koma dibaca sebagai tanda desimal (117.969050 adalah bujur, bukan seratus juta);
       tanda yang berulang, atau titik dan koma bersama-sama, dibaca sebagai pemisah ribuan */
    var nt = (v.match(/\./g) || []).length, nk = (v.match(/,/g) || []).length;
    if (nt && nk) { if (v.lastIndexOf(',') > v.lastIndexOf('.')) v = v.replace(/\./g, '').replace(',', '.'); else v = v.replace(/,/g, ''); }
    else if (nt > 1) v = v.replace(/\./g, '');
    else if (nk > 1) v = v.replace(/,/g, '');
    else if (nk === 1) v = v.replace(',', '.');
    return /^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(v) ? parseFloat(v) : NaN;
  };

  /* ---------- petunjuk melayang ---------- */
  /* menu kiri hanya butuh petunjuk saat menyempit jadi deretan ikon; di lebar lain namanya sudah terbaca */
  var modeIkon = window.matchMedia('(min-width: 761px) and (max-width: 1099px)');
  function cariTip(e) {
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (el && el.closest('.pustaka') && !modeIkon.matches) return null;
    return el;
  }
  function tampilTip(el, x, y) {
    var t = el.getAttribute('data-tip'); if (!t) return;
    var p = t.split('|');
    tip.innerHTML = (p.length > 1 ? '<b>' + K.esc(p[0]) + '</b>' + K.esc(p.slice(1).join('|')) : K.esc(t));
    tip.hidden = false;
    var r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, kiri, atas;
    if (el.closest('.pustaka')) {
      /* di deretan ikon, petunjuk muncul di kanan ikon seperti nama daftar putar di Spotify */
      kiri = r.right + 10; atas = Math.max(8, r.top + r.height / 2 - h / 2);
    } else {
      if (x === undefined) { x = r.left + r.width / 2; y = r.top; }
      kiri = Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2)); atas = y - h - 12;
      if (atas < 8) atas = y + 18;
    }
    tip.style.left = kiri + 'px'; tip.style.top = atas + 'px';
  }
  document.addEventListener('mousemove', function (e) { var el = cariTip(e); if (el) tampilTip(el, e.clientX, e.clientY); else tip.hidden = true; });
  document.addEventListener('focusin', function (e) { var el = cariTip(e); if (el) tampilTip(el); });
  document.addEventListener('focusout', function () { tip.hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tip.hidden = true; });

  /* ---------- peta dasar ---------- */
  /* koordinat ditulis dengan arah mata angin, karena koma sudah dipakai sebagai tanda desimal */
  K.koord = function (lat, lon) {
    return K.n(Math.abs(lat), 5) + '° ' + (lat < 0 ? 'LS' : 'LU') + ' · ' + K.n(Math.abs(lon), 5) + '° ' + (lon < 0 ? 'BB' : 'BT');
  };
  K.petaAda = function () { return !!window.L; };
  K.petaGalat = function (el) {
    el.innerHTML = '<div class="galat" role="alert" style="margin:24px"><h2>Peta tidak bisa ditampilkan</h2><p>Pustaka peta Leaflet dari cdnjs.cloudflare.com tidak termuat, biasanya karena sambungan internet terputus atau alamat itu diblokir jaringan kantor.</p><p class="redup" style="margin-top:8px">Tabel dan angka di halaman ini tetap bisa dipakai. Untuk melihat peta, periksa sambungan lalu muat ulang halaman.</p></div>';
  };
  K.peta = function (el, o) {
    o = o || {};
    var L = window.L;
    var map = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.25, preferCanvas: true, attributionControl: true });
    var dasar = {
      'Citra satelit': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, maxNativeZoom: 17, attribution: 'Citra © Esri, Maxar, Earthstar Geographics' }),
      'Topografi': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, maxNativeZoom: 17, attribution: 'Peta © Esri' }),
      'OpenStreetMap': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' })
    };
    dasar[o.dasar || 'Citra satelit'].addTo(map);
    map.createPane('raster'); map.getPane('raster').style.zIndex = 350;
    map.createPane('batas'); map.getPane('batas').style.zIndex = 420; map.getPane('batas').style.pointerEvents = 'none';
    var hasil = { map: map, dasar: dasar, lapis: {} };
    var b = o.batas;
    if (b) {
      var kawasan = L.polygon(b.kawasan, { pane: 'batas', color: '#f0cf7e', weight: 2, fill: false, interactive: false });
      var resor = L.layerGroup(b.resor.map(function (r) {
        var p = L.polygon(r.cincin, { pane: 'batas', color: '#eee8d5', weight: 1, opacity: .75, dashArray: '5 5', fill: false, interactive: false });
        return p;
      }));
      var label = L.layerGroup(b.resor.map(function (r) {
        var p = L.polygon(r.cincin);
        return L.marker(p.getBounds().getCenter(), { interactive: false, keyboard: false, icon: L.divIcon({ className: 'label-resor', html: K.esc(r.nama), iconSize: [120, 16] }) });
      }));
      kawasan.addTo(map); resor.addTo(map);
      if (o.labelResor !== false) label.addTo(map);
      hasil.lapis.kawasan = kawasan; hasil.lapis.resor = resor; hasil.lapis.label = label;
      hasil.batasKawasan = kawasan.getBounds();
      map.fitBounds(hasil.batasKawasan, { padding: [12, 12] });
    } else map.setView([-8.25, 117.99], 10.5);
    hasil.kontrol = L.control.layers(dasar, b ? { 'Batas kawasan': hasil.lapis.kawasan, 'Batas resor': hasil.lapis.resor, 'Nama resor': hasil.lapis.label } : {}, { collapsed: true }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    /* roda gulir baru menggeser peta setelah peta diklik, supaya gulir halaman tidak tersangkut */
    map.on('click', function () { map.scrollWheelZoom.enable(); });
    map.on('mouseout', function () { map.scrollWheelZoom.disable(); });
    return hasil;
  };
  /* penanda kotak di kanvas, untuk tipe ekosistem */
  K.kotak = function () {
    var L = window.L;
    if (!K._Kotak) K._Kotak = L.CircleMarker.extend({
      _updatePath: function () {
        var r = this._renderer, ctx = r._ctx, p = this._point, s = this._radius;
        if (!r._drawing || this._empty()) return;
        ctx.beginPath(); ctx.rect(p.x - s, p.y - s, 2 * s, 2 * s); r._fillStroke(ctx, this);
      }
    });
    return K._Kotak;
  };

  /* ---------- raster MaxEnt: WebP tanpa susut dibaca pikselnya lalu diwarnai di browser ---------- */
  /* jenjang warna model: hijau untuk 0, kuning di tengah, merah untuk 1. Ujung merah dibuat lebih gelap daripada ujung hijau
     supaya nilai rendah dan tinggi tetap terbedakan lewat terang-gelapnya oleh pembaca buta warna merah-hijau */
  K.JENJANG = ['#3fa84e', '#73bf49', '#aad347', '#dcdd40', '#fede23', '#f9a726', '#e16c10', '#c43512', '#a20711'];
  K.warnaJenjang = function (t) {
    var J = K.JENJANG, x = Math.max(0, Math.min(1, t)) * (J.length - 1), a = Math.floor(x), b = Math.min(J.length - 1, a + 1), f = x - a;
    function h(c, k) { return parseInt(c.substr(1 + k * 2, 2), 16); }
    return [0, 1, 2].map(function (k) { return Math.round(h(J[a], k) + (h(J[b], k) - h(J[a], k)) * f); });
  };
  K.bacaRaster = function (url) {
    return new Promise(function (ok, gagal) {
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
          var ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
          var d = ctx.getImageData(0, 0, c.width, c.height).data, v = new Uint8Array(c.width * c.height);
          for (var i = 0; i < v.length; i++) v[i] = d[i * 4];
          ok({ w: c.width, h: c.height, v: v });
        } catch (e) { gagal(new Error('Browser menolak membaca piksel peta model ' + url + '.')); }
      };
      img.onerror = function () { gagal(new Error('Peta model ' + url.replace(/^.*\//, '') + ' tidak bisa diambil. Periksa sambungan lalu pilih lagi jenisnya.')); };
      img.src = url;
    });
  };
  /* warnai(v) mengembalikan [r, g, b, a] atau null untuk piksel kosong */
  K.gambarRaster = function (r, warnai) {
    var c = document.createElement('canvas'); c.width = r.w; c.height = r.h;
    var ctx = c.getContext('2d'), im = ctx.createImageData(r.w, r.h), d = im.data, tabel = {}, i, w;
    for (i = 0; i < r.v.length; i++) {
      var v = r.v[i]; if (!v) continue;
      w = tabel[v]; if (w === undefined) w = tabel[v] = warnai(v);
      if (!w) continue;
      d[i * 4] = w[0]; d[i * 4 + 1] = w[1]; d[i * 4 + 2] = w[2]; d[i * 4 + 3] = w[3];
    }
    ctx.putImageData(im, 0, 0);
    return c.toDataURL('image/png');
  };

  /* ---------- rute ---------- */
  var aktif = null;
  // Naik setiap kali alamat berganti. Pemuat halaman menyimpan nilainya dan berhenti bila alamat sudah berganti
  // sebelum data selesai dimuat, supaya halaman lama tidak menimpa halaman baru.
  K.giliran = 0;
  function urai() { return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } }); }
  function arah() {
    K.giliran++;
    var p = urai(), nama = p[0] || 'potensi', arg = p.slice(1);
    var r = K.rute[nama];
    /* menu kiri, tombol beranda di kepala, dan navigasi bawah ponsel ditandai bersama */
    Array.prototype.forEach.call(document.querySelectorAll('a[data-rute]'), function (a) {
      if (a.getAttribute('data-rute') === nama) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.body.setAttribute('data-rute', r ? nama : 'galat');
    document.body.removeAttribute('data-kel');
    tutupLaci(false);
    tip.hidden = true;
    var jaga = K.jagaFokus; K.jagaFokus = false;
    if (!r) {
      aktif = null;
      document.title = 'Halaman tidak ditemukan · Keanekaragaman Hayati';
      isi.innerHTML = '<div class="galat"><h1 style="font-size:24px;margin-bottom:8px">Halaman tidak ditemukan</h1><p>Alamat <code>' + K.esc(location.hash) + '</code> tidak ada di tab Keanekaragaman Hayati. Tautan mungkin salah ketik atau sudah berganti nama.</p><p style="margin-top:14px"><a class="tombol" href="#/">Buka Potensi kehati</a></p></div>';
      return;
    }
    document.title = r.judul + ' · Keanekaragaman Hayati · TN Gunung Tambora';
    if (aktif === nama && r.ubah) { r.ubah(arg, jaga); return; }
    if (aktif && K.rute[aktif] && K.rute[aktif].lepas) K.rute[aktif].lepas();
    aktif = nama;
    window.scrollTo(0, 0);
    r.muat(isi, arg);
    /* saat pindah karena mengetik di kotak cari, fokus tetap di kotak cari */
    if (!jaga) isi.focus({ preventScroll: true });
  }

  /* ---------- laci menu di ponsel ---------- */
  var tombolMenu = document.getElementById('tabMenu'), tampilan = document.querySelector('.tampilan');
  var modePonsel = window.matchMedia('(max-width: 760px)');
  function bukaLaci() {
    document.body.classList.add('laci-buka');
    if (tombolMenu) tombolMenu.setAttribute('aria-expanded', 'true');
    /* isi halaman tertutup laci, jadi dibuat tidak bisa difokus supaya Tab tidak tersesat ke baliknya */
    if (tampilan) tampilan.inert = true;
    var a = document.querySelector('#tab a[aria-current="page"]') || document.querySelector('#tab a');
    if (a) a.focus();
  }
  function tutupLaci(kembalikan) {
    if (!document.body.classList.contains('laci-buka')) return;
    document.body.classList.remove('laci-buka');
    if (tombolMenu) tombolMenu.setAttribute('aria-expanded', 'false');
    if (tampilan) tampilan.inert = false;
    if (kembalikan && tombolMenu) tombolMenu.focus();
  }
  if (tombolMenu) tombolMenu.addEventListener('click', function () { if (document.body.classList.contains('laci-buka')) tutupLaci(true); else bukaLaci(); });
  var tombolTutup = document.getElementById('pustakaTutup');
  if (tombolTutup) tombolTutup.addEventListener('click', function () { tutupLaci(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('laci-buka')) tutupLaci(true); });
  var gantiMode = function () { if (!modePonsel.matches) tutupLaci(false); };
  if (modePonsel.addEventListener) modePonsel.addEventListener('change', gantiMode); else if (modePonsel.addListener) modePonsel.addListener(gantiMode);

  /* ---------- kotak cari jenis di kepala halaman ---------- */
  var formCari = document.getElementById('cariForm'), kotakCari = document.getElementById('cariJenis');
  K.cari = '';
  function keKamus() {
    K.cari = kotakCari.value;
    var di = urai();
    if (di[0] === 'jenis' && !di[1] && aktif === 'jenis' && K.rute.jenis && K.rute.jenis.cari) K.rute.jenis.cari(K.cari);
    else { K.jagaFokus = true; location.hash = '#/jenis'; }
  }
  if (formCari && kotakCari) {
    formCari.addEventListener('submit', function (e) {
      e.preventDefault(); keKamus();
      /* Enter memindahkan fokus ke hasil pertama supaya bisa langsung dibuka */
      setTimeout(function () { var a = document.querySelector('.kj-kisi a'); if (a) a.focus(); }, 0);
    });
    kotakCari.addEventListener('input', keKamus);
  }
  var tombolCari = document.getElementById('tabCari');
  if (tombolCari && kotakCari) tombolCari.addEventListener('click', function () {
    tutupLaci(false);
    var di = urai();
    if (!(di[0] === 'jenis' && !di[1])) { K.jagaFokus = true; location.hash = '#/jenis'; }
    kotakCari.focus();
  });
  K.muatUlang = function () { var n = aktif; aktif = null; if (n && K.rute[n] && K.rute[n].lepas) K.rute[n].lepas(); arah(); };
  K.kepala = function (r) {
    var kd = document.getElementById('kepalaData'), kk = document.getElementById('kakiData');
    var t = 'Data LPK ' + r.periode[0] + ' sampai ' + r.periode[1] + ' dan SMART Patrol per ' + K.tgl(r.smart_lembar || r.smart_per);
    if (kd) kd.innerHTML = K.esc(t) + '<br>Diolah ' + K.esc(K.tgl(r.dibuat));
    if (kk) kk.textContent = t + '. Diolah ' + K.tgl(r.dibuat) + '.';
  };
  K.mulai = function () {
    window.addEventListener('hashchange', arah);
    K.ambil('ringkasan.json').then(K.kepala).catch(function () { /* keadaan galat ditangani tiap halaman */ });
    arah();
  };
  document.addEventListener('DOMContentLoaded', K.mulai);
})();
