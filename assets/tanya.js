/* Tanya Data: panel chatbot Satu Data Tambora.
   Browser hanya mengirim pertanyaan ke Apps Script (data/sumber.js TANYA_DATA). Kunci API, akun pegawai,
   batas harian, dan pembacaan data semuanya ada di Apps Script (apps-script/TanyaData.gs). */
(function () {
  'use strict';

  var URL_API = ((window.SUMBER || {}).TANYA_DATA || '').trim();
  if (!/^https:\/\/script\.google(usercontent)?\.com\/.+/.test(URL_API) && !/^https?:\/\/localhost[:/]/.test(URL_API)) return;

  var KUNCI_SESI = 'sdt-tanya-sesi';
  var KUNCI_RIWAYAT = 'sdt-tanya-riwayat';
  var XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

  var SARAN = {
    beranda: ['Resor mana yang ancamannya paling tinggi?', 'Berapa luas areal terbakar musim ini per resor?', 'Berapa observasi SMART bulan ini?'],
    smart: ['Berapa observasi dan titik SMART per resor tahun ini?', 'Apa saja temuan perburuan terbaru?', 'Unduh observasi satwa liar Oktober 2026 dalam Excel'],
    rbm: ['Bagaimana capaian RBM per resor?', 'Kegiatan RBM mana yang belum berjalan?', 'Berapa laporan yang menunggu verifikasi?'],
    karhut: ['Berapa luas terbakar per resor?', 'Kapan delineasi areal terbakar terakhir?', 'Unduh peta areal terbakar'],
    resor: ['Bandingkan potensi dan ancaman ketujuh resor', 'Apa ancaman utama Resor Doro Tabe?', 'Resor mana yang data patrolinya masih indikatif?'],
    polhut: ['Ringkas penanganan konflik tenurial Karya Sari', 'Berapa bidang garapan yang terbakar tahun ini?', 'Temuan perambahan SMART per resor tahun ini']
  };

  var IKON = {
    obrolan: '<path d="M4 5.5h16v10H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    tutup: '<path d="M6 6l12 12M18 6 6 18"/>',
    kirim: '<path d="M4 12 20 4l-6 16-3-7z"/><path d="m11 13 9-9"/>',
    unduh: '<path d="M12 4v11M7 10.5l5 5 5-5"/><path d="M4.5 19.5h15"/>',
    buka: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5.5H4.5V6H10"/>',
    keluar: '<path d="M9.5 4.5h-5v15h5"/><path d="M14 8l4 4-4 4M18 12H9"/>'
  };
  function ikon(n) {
    return '<svg class="ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IKON[n] + '</svg>';
  }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function baca(k, tempat) { try { return JSON.parse((tempat || localStorage).getItem(k) || 'null'); } catch (e) { return null; } }
  function simpan(k, v, tempat) { try { (tempat || localStorage).setItem(k, JSON.stringify(v)); } catch (e) { /* mode privat */ } }
  function hapus(k, tempat) { try { (tempat || localStorage).removeItem(k); } catch (e) { /* abaikan */ } }

  /* ---------- markdown ringkas yang aman (teks di-escape dulu) ---------- */
  function sebaris(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  function md(teks) {
    var baris = String(teks || '').replace(/\r/g, '').split('\n');
    var html = '', i = 0;
    while (i < baris.length) {
      var b = baris[i];
      if (/^\s*\|.*\|\s*$/.test(b) && i + 1 < baris.length && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(baris[i + 1])) {
        var sel = function (x) { return x.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); };
        var kepala = sel(b);
        i += 2;
        var isi = [];
        while (i < baris.length && /^\s*\|.*\|\s*$/.test(baris[i])) { isi.push(sel(baris[i])); i++; }
        html += '<div class="tanya-tabel"><table><thead><tr>' + kepala.map(function (c) { return '<th>' + sebaris(c) + '</th>'; }).join('') +
          '</tr></thead><tbody>' + isi.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + sebaris(c) + '</td>'; }).join('') + '</tr>'; }).join('') +
          '</tbody></table></div>';
        continue;
      }
      if (/^\s*([-*•]|\d+[.)])\s+/.test(b)) {
        var bernomor = /^\s*\d+[.)]/.test(b), item = [];
        while (i < baris.length && /^\s*([-*•]|\d+[.)])\s+/.test(baris[i])) { item.push(baris[i].replace(/^\s*([-*•]|\d+[.)])\s+/, '')); i++; }
        html += (bernomor ? '<ol>' : '<ul>') + item.map(function (x) { return '<li>' + sebaris(x) + '</li>'; }).join('') + (bernomor ? '</ol>' : '</ul>');
        continue;
      }
      if (/^#{1,4}\s+/.test(b)) { html += '<p class="tanya-sub">' + sebaris(b.replace(/^#+\s+/, '')) + '</p>'; i++; continue; }
      if (!b.trim()) { i++; continue; }
      var para = [];
      while (i < baris.length && baris[i].trim() && !/^\s*([-*•]|\d+[.)])\s+/.test(baris[i]) && !/^\s*\|/.test(baris[i]) && !/^#{1,4}\s+/.test(baris[i])) { para.push(baris[i]); i++; }
      html += '<p>' + para.map(sebaris).join('<br>') + '</p>';
    }
    return html;
  }

  /* ---------- tampilan ---------- */
  var akar = document.createElement('div');
  akar.className = 'tanya';
  akar.innerHTML =
    '<button type="button" class="tanya-tombol" id="tanyaTombol" aria-expanded="false" aria-controls="tanyaPanel">' + ikon('obrolan') + '<span>Tanya Data</span></button>' +
    '<section class="tanya-panel" id="tanyaPanel" role="dialog" aria-labelledby="tanyaJudul" hidden>' +
      '<header class="tanya-kepala">' +
        '<span class="tanya-logo" aria-hidden="true">' + ikon('obrolan') + '</span>' +
        '<div class="tanya-nama"><strong id="tanyaJudul">Tanya Data</strong><small id="tanyaStatus">Asisten data Satu Data Tambora</small></div>' +
        '<button type="button" class="tanya-ikon" id="tanyaKeluar" title="Keluar" aria-label="Keluar" hidden>' + ikon('keluar') + '</button>' +
        '<button type="button" class="tanya-ikon" id="tanyaTutup" title="Tutup (Esc)" aria-label="Tutup">' + ikon('tutup') + '</button>' +
      '</header>' +
      '<form class="tanya-masuk" id="tanyaMasuk" hidden>' +
        '<p class="tanya-sambut">Masuk dengan akun pegawai Balai TN Tambora untuk bertanya tentang data di dashboard ini.</p>' +
        '<label>Username<input id="tanyaUser" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>' +
        '<label>Password<input id="tanyaPass" name="password" type="password" autocomplete="current-password" required></label>' +
        '<p class="tanya-galat" id="tanyaGalatMasuk" role="alert" hidden></p>' +
        '<button type="submit" class="tanya-utama" id="tanyaMasukTombol">Masuk</button>' +
        '<p class="tanya-kecil">Belum punya akun atau lupa password? Hubungi admin Satu Data Tambora.</p>' +
      '</form>' +
      '<div class="tanya-obrolan" id="tanyaObrolan" hidden>' +
        '<div class="tanya-isi" id="tanyaIsi" aria-live="polite"></div>' +
        '<div class="tanya-saran" id="tanyaSaran"></div>' +
        '<form class="tanya-tulis" id="tanyaTulis">' +
          '<label class="sr" for="tanyaTeks">Pertanyaan</label>' +
          '<textarea id="tanyaTeks" rows="1" maxlength="1500" placeholder="Tanyakan data dashboard…" enterkeyhint="send"></textarea>' +
          '<button type="submit" class="tanya-kirim" id="tanyaKirim" aria-label="Kirim">' + ikon('kirim') + '</button>' +
        '</form>' +
        '<p class="tanya-kecil tanya-kaki" id="tanyaKaki">Jawaban disusun AI dari data dashboard. Periksa angka penting di halaman aslinya.</p>' +
      '</div>' +
    '</section>';
  document.body.appendChild(akar);

  function $(id) { return document.getElementById(id); }
  var tombol = $('tanyaTombol'), panel = $('tanyaPanel'), isi = $('tanyaIsi'), teks = $('tanyaTeks');
  var sesi = baca(KUNCI_SESI);
  var riwayat = baca(KUNCI_RIWAYAT, sessionStorage) || [];
  var sibuk = false;

  function sesiSah() { return sesi && sesi.token && sesi.kedaluwarsa > Date.now(); }

  function kirimApi(badan, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 300000) : null;
    // text/plain agar tidak ada preflight CORS; Apps Script membaca e.postData.contents.
    return fetch(URL_API, { method: 'POST', body: JSON.stringify(badan), redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (t) clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
        function (e) { if (t) clearTimeout(t); throw new Error(e && e.name === 'AbortError' ? 'Server terlalu lama menjawab. Coba lagi.' : 'Tidak tersambung ke server Tanya Data.'); });
  }

  function tampilkanMode() {
    var masuk = sesiSah();
    $('tanyaMasuk').hidden = masuk;
    $('tanyaObrolan').hidden = !masuk;
    $('tanyaKeluar').hidden = !masuk;
    $('tanyaStatus').textContent = masuk ? sesi.nama + (typeof sesi.sisa === 'number' ? ' · sisa ' + sesi.sisa + ' pertanyaan hari ini' : '') : 'Asisten data Satu Data Tambora';
    if (masuk) { gambarRiwayat(); gambarSaran(); }
  }

  function buka() {
    panel.hidden = false;
    tombol.setAttribute('aria-expanded', 'true');
    document.body.classList.add('tanya-terbuka');
    tampilkanMode();
    requestAnimationFrame(function () {
      panel.classList.add('tampil');
      (sesiSah() ? teks : $('tanyaUser')).focus();
    });
  }
  function tutup() {
    panel.classList.remove('tampil');
    panel.hidden = true;
    tombol.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('tanya-terbuka');
    tombol.focus();
  }

  function gambarSaran() {
    var p = window.SDT ? window.SDT.posisi() : { tema: 'beranda' };
    var daftar = SARAN[p.tema] || SARAN.beranda;
    $('tanyaSaran').innerHTML = riwayat.length > 1 ? '' : daftar.map(function (s) { return '<button type="button" class="tanya-chip">' + esc(s) + '</button>'; }).join('');
  }

  function balon(m) {
    var html = '<div class="tanya-pesan tanya-pesan--' + (m.peran === 'user' ? 'user' : 'bot') + (m.galat ? ' tanya-pesan--galat' : '') + '">';
    html += m.peran === 'user' ? '<p>' + esc(m.teks).replace(/\n/g, '<br>') + '</p>' : md(m.teks);
    if (m.aksi && m.aksi.length) {
      html += '<div class="tanya-aksi">' + m.aksi.map(function (a, i) {
        if (a.jenis === 'buka') return '<button type="button" class="tanya-aksi-tombol" data-buka="' + esc(a.tema) + '/' + esc(a.item) + '">' + ikon('buka') + '<span>Buka ' + esc(a.judul) + '</span></button>';
        if (a.jenis === 'unduh') {
          var f = a.format === 'xlsx' ? 'Excel' : a.format.toUpperCase();
          var n = typeof a.jumlah === 'number' ? ' · ' + a.jumlah.toLocaleString('id-ID') + ' baris' : '';
          return '<button type="button" class="tanya-aksi-tombol" data-unduh="' + esc(a.id) + '">' + ikon('unduh') + '<span>Unduh ' + esc(a.judul) + ' <small>' + f + n + '</small></span></button>';
        }
        return '';
      }).join('') + '</div>';
    }
    return html + '</div>';
  }

  function gambarRiwayat() {
    var sambut = { peran: 'bot', teks: 'Halo ' + (sesi && sesi.nama ? sesi.nama.split(' ')[0] : '') + '. Tanyakan apa saja tentang data di Satu Data Tambora: SMART Patrol, RBM, Resor Pengelolaan, areal terbakar, konflik tenurial, atau penerbangan drone. Saya juga bisa menyiapkan unduhan data dan membuka halaman yang relevan.' };
    isi.innerHTML = [sambut].concat(riwayat).map(balon).join('');
    isi.scrollTop = isi.scrollHeight;
  }

  function tambah(m) {
    riwayat.push(m);
    if (riwayat.length > 30) riwayat = riwayat.slice(-30);
    simpan(KUNCI_RIWAYAT, riwayat, sessionStorage);
    isi.insertAdjacentHTML('beforeend', balon(m));
    isi.scrollTop = isi.scrollHeight;
  }

  function perbaruiSisa(n) {
    if (typeof n !== 'number' || !sesi) return;
    sesi.sisa = n;
    simpan(KUNCI_SESI, sesi);
    $('tanyaStatus').textContent = sesi.nama + ' · sisa ' + n + ' pertanyaan hari ini';
  }

  function sesiBerakhir(pesan) {
    sesi = null;
    hapus(KUNCI_SESI);
    tampilkanMode();
    var g = $('tanyaGalatMasuk');
    g.textContent = pesan || 'Sesi berakhir. Silakan masuk lagi.';
    g.hidden = false;
    $('tanyaUser').focus();
  }

  function tanya(pertanyaan) {
    pertanyaan = String(pertanyaan || '').trim();
    if (!pertanyaan || sibuk) return;
    if (!sesiSah()) { sesiBerakhir(); return; }
    sibuk = true;
    $('tanyaKirim').disabled = true;
    $('tanyaSaran').innerHTML = '';
    tambah({ peran: 'user', teks: pertanyaan });
    var tunggu = document.createElement('div');
    tunggu.className = 'tanya-pesan tanya-pesan--bot tanya-tunggu';
    tunggu.innerHTML = '<span class="tanya-titik" aria-hidden="true"><i></i><i></i><i></i></span><span class="tanya-tunggu-teks">Membaca data…</span>';
    isi.appendChild(tunggu);
    isi.scrollTop = isi.scrollHeight;
    var mulai = Date.now();
    var jam = setInterval(function () {
      var d = Math.round((Date.now() - mulai) / 1000);
      tunggu.querySelector('.tanya-tunggu-teks').textContent = d < 8 ? 'Membaca data…' : d < 25 ? 'Menghitung dari data… ' + d + ' dtk' : d < 70 ? 'Masih bekerja, data yang dibaca cukup besar… ' + d + ' dtk' : 'Pertanyaan ini butuh beberapa langkah, mohon tunggu… ' + d + ' dtk';
    }, 1000);
    var pesan = riwayat.filter(function (m) { return !m.galat; }).slice(-8).map(function (m) { return { peran: m.peran, teks: m.teks }; });
    kirimApi({
      aksi: 'tanya', token: sesi.token, pesan: pesan,
      konten: window.SDT ? window.SDT.konten() : [], posisi: window.SDT ? window.SDT.posisi() : null
    }).then(function (j) {
      if (j.masukLagi) { tunggu.remove(); sesiBerakhir(j.galat); return; }
      tunggu.remove();
      if (!j.ok) { tambah({ peran: 'bot', teks: j.galat || 'Maaf, terjadi galat.', galat: true }); perbaruiSisa(j.sisa); return; }
      tambah({ peran: 'bot', teks: j.jawaban, aksi: j.aksi || [] });
      perbaruiSisa(j.sisa);
    }).catch(function (e) {
      tunggu.remove();
      tambah({ peran: 'bot', teks: e.message, galat: true });
    }).then(function () {
      clearInterval(jam);
      sibuk = false;
      $('tanyaKirim').disabled = false;
      teks.focus();
    });
  }

  /* ---------- unduhan ---------- */
  function simpanBerkas(blob, nama) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nama;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  function selCsv(v) {
    var s = String(v === null || v === undefined ? '' : v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function muatXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise(function (ok, gagal) {
      var s = document.createElement('script');
      s.src = XLSX_URL;
      s.onload = function () { window.XLSX ? ok(window.XLSX) : gagal(new Error('XLSX')); };
      s.onerror = function () { gagal(new Error('Pustaka Excel gagal dimuat')); };
      document.head.appendChild(s);
    });
  }
  function unduh(id, el) {
    if (!sesiSah()) { sesiBerakhir(); return; }
    var label = el.querySelector('span').innerHTML;
    el.disabled = true;
    el.querySelector('span').textContent = 'Menyiapkan file…';
    kirimApi({ aksi: 'unduh', token: sesi.token, id: id }, 180000).then(function (j) {
      if (j.masukLagi) { sesiBerakhir(j.galat); return; }
      if (!j.ok) throw new Error(j.galat || 'Unduhan gagal.');
      if (j.format === 'geojson') return simpanBerkas(new Blob([JSON.stringify(j.geojson)], { type: 'application/geo+json' }), j.berkas + '.geojson');
      var csv = function () {
        var t = [j.kolom].concat(j.baris).map(function (r) { return r.map(selCsv).join(','); }).join('\r\n');
        simpanBerkas(new Blob(['﻿' + t], { type: 'text/csv;charset=utf-8' }), j.berkas + '.csv');
      };
      if (j.format === 'csv') return csv();
      return muatXlsx().then(function (X) {
        var wb = X.utils.book_new();
        X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([j.kolom].concat(j.baris)), 'Data');
        X.writeFile(wb, j.berkas + '.xlsx');
      }, function () { csv(); });
    }).catch(function (e) {
      tambah({ peran: 'bot', teks: e.message, galat: true });
    }).then(function () {
      el.disabled = false;
      el.querySelector('span').innerHTML = label;
    });
  }

  /* ---------- peristiwa ---------- */
  tombol.addEventListener('click', function () { panel.hidden ? buka() : tutup(); });
  $('tanyaTutup').addEventListener('click', tutup);
  $('tanyaKeluar').addEventListener('click', function () {
    if (sesi) kirimApi({ aksi: 'keluar', token: sesi.token }, 15000).catch(function () { /* tetap keluar */ });
    sesi = null;
    riwayat = [];
    hapus(KUNCI_SESI);
    hapus(KUNCI_RIWAYAT, sessionStorage);
    $('tanyaGalatMasuk').hidden = true;
    tampilkanMode();
    $('tanyaUser').focus();
  });

  $('tanyaMasuk').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = $('tanyaMasukTombol'), g = $('tanyaGalatMasuk');
    t.disabled = true;
    t.textContent = 'Memeriksa…';
    g.hidden = true;
    kirimApi({ aksi: 'masuk', username: $('tanyaUser').value, password: $('tanyaPass').value }, 30000).then(function (j) {
      if (!j.ok) throw new Error(j.galat || 'Gagal masuk.');
      sesi = { token: j.token, nama: j.nama, peran: j.peran, kedaluwarsa: j.kedaluwarsa, sisa: j.sisa };
      simpan(KUNCI_SESI, sesi);
      $('tanyaPass').value = '';
      tampilkanMode();
      teks.focus();
    }).catch(function (err) {
      g.textContent = err.message;
      g.hidden = false;
    }).then(function () {
      t.disabled = false;
      t.textContent = 'Masuk';
    });
  });

  $('tanyaTulis').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = teks.value;
    teks.value = '';
    teks.style.height = '';
    tanya(v);
  });
  teks.addEventListener('input', function () {
    teks.style.height = '';
    teks.style.height = Math.min(teks.scrollHeight, 140) + 'px';
  });
  teks.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('tanyaTulis').requestSubmit ? $('tanyaTulis').requestSubmit() : $('tanyaKirim').click(); }
  });

  panel.addEventListener('click', function (e) {
    var chip = e.target.closest('.tanya-chip');
    if (chip) { tanya(chip.textContent); return; }
    var b = e.target.closest('[data-buka]');
    if (b) {
      location.hash = '#/' + b.getAttribute('data-buka').split('/').map(encodeURIComponent).join('/');
      if (window.innerWidth < 720) tutup();
      return;
    }
    var u = e.target.closest('[data-unduh]');
    if (u && !u.disabled) unduh(u.getAttribute('data-unduh'), u);
  });

  // Tombol panah, Esc, dan "/" di dalam panel tidak boleh menggerakkan navigasi hub.
  akar.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); tutup(); }
    e.stopPropagation();
  });
})();
