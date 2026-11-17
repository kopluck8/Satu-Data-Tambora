/* Penyuluhan & Pemberdayaan Masyarakat · Satu Data Tambora. Vanilla JS, tanpa pustaka luar.
   Data: ../data/penyuluhan/dashboard.json, dibangun oleh scripts/build_data.py di repo Penyuluh_BTNT. */
(() => {
  "use strict";

  // ---------- util ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => (n == null ? "–" : Number(n).toLocaleString("id-ID"));
  const sum = (a) => a.reduce((x, y) => x + (y || 0), 0);
  const uniq = (a) => [...new Set(a)];
  const count = (arr) => arr.reduce((m, k) => m.set(k, (m.get(k) || 0) + 1), new Map());
  const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

  const STATUS = {
    "aktif": { cls: "st-good", kode: "A", label: "Aktif" },
    "kurang aktif": { cls: "st-warning", kode: "K", label: "Kurang aktif" },
    "tidak aktif": { cls: "st-critical", kode: "T", label: "Tidak aktif" },
    "baru dibentuk": { cls: "st-new", kode: "B", label: "Baru dibentuk" },
    "tidak disebut": { cls: "st-unknown", kode: "?", label: "Disebut, kondisi tidak dijelaskan" },
  };
  const stBadge = (st) => `<span class="st-badge ${STATUS[st].cls}">${STATUS[st].kode} · ${esc(STATUS[st].label)}</span>`;
  const stIcon = (st) => `<i class="st ${STATUS[st].cls}" aria-hidden="true">${STATUS[st].kode}</i>`;

  // ---------- tooltip ----------
  const tipEl = $("#tooltip");
  const tip = {
    show(ev, html) {
      tipEl.innerHTML = html;
      tipEl.classList.add("show");
      tip.move(ev);
    },
    move(ev) {
      const pad = 14, w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      let x = ev.clientX + pad, y = ev.clientY + pad;
      if (x + w > innerWidth - 8) x = ev.clientX - w - pad;
      if (y + h > innerHeight - 8) y = ev.clientY - h - pad;
      tipEl.style.left = Math.max(8, x) + "px";
      tipEl.style.top = Math.max(8, y) + "px";
    },
    hide() { tipEl.classList.remove("show"); },
  };
  const tipRow = (label, val, color) =>
    `<div class="row"><span>${color ? `<i style="background:${color}"></i>` : ""}${esc(label)}</span><span>${val}</span></div>`;
  function bindTip(node, html) {
    node.addEventListener("pointerenter", (e) => tip.show(e, typeof html === "function" ? html() : html));
    node.addEventListener("pointermove", (e) => tip.move(e));
    node.addEventListener("pointerleave", tip.hide);
  }

  function tableView(el, head, rows) {
    const d = document.createElement("details");
    d.className = "table-view";
    d.innerHTML = `<summary>Lihat tabel</summary><div class="tbl-wrap"><table class="data"><thead><tr>${head
      .map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${typeof c === "number" ? fmt(c) : esc(c ?? "–")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    el.appendChild(d);
  }
  const legend = (items) =>
    `<ul class="legend">${items.map((i) => `<li><i class="${i.cls || ""}" style="${i.color ? `background:${i.color}` : ""}">${i.kode || ""}</i>${esc(i.label)}</li>`).join("")}</ul>`;

  // ---------- grafik: batang bertumpuk vertikal ----------
  const SVG = "http://www.w3.org/2000/svg";
  const charts = [];
  const register = (fn) => { charts.push(fn); fn(); };

  // batas atas sumbu yang habis dibagi 4 dengan langkah bulat
  function niceMax(v) {
    const raw = Math.max(1, v) / 4;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 5, 10].map((m) => m * p).find((x) => x >= raw);
    return Math.max(4, Math.ceil(step) * 4);
  }

  function topRounded(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }

  /* opts: el, cats, series [{key,label,color}], get(cat,key), unit, height, showTotal */
  function stackedBars(opts) {
    const { el, cats, series, get, unit = "laporan", height = 240 } = opts;
    const host = typeof el === "string" ? $(el) : el;
    host.innerHTML = "";
    host.classList.add("chart");
    if (series.length > 1) host.insertAdjacentHTML("beforeend", legend(series));
    const W = Math.max(280, host.clientWidth), H = height;
    const m = { t: 18, r: 8, b: 26, l: 34 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const totals = cats.map((c) => sum(series.map((s) => get(c, s.key))));
    const max = niceMax(Math.max(1, ...totals));
    const step = iw / cats.length, bw = Math.min(46, step * 0.62);
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", opts.aria || "Grafik batang");
    let g = "";
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i, y = m.t + ih - (v / max) * ih;
      g += `<line class="${i ? "grid-line" : "axis-line"}" x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}"/>`;
      g += `<text x="${m.l - 6}" y="${y + 4}" text-anchor="end">${fmt(Math.round(v))}</text>`;
    }
    cats.forEach((c, i) => {
      const cx = m.l + step * i + step / 2, x = cx - bw / 2;
      g += `<rect class="hover-col" data-i="${i}" x="${m.l + step * i}" y="${m.t}" width="${step}" height="${ih}"/>`;
      let y = m.t + ih;
      const segs = series.map((s) => ({ s, v: get(c, s.key) || 0 })).filter((d) => d.v > 0);
      segs.forEach((d, j) => {
        const h = (d.v / max) * ih;
        const gap = j < segs.length - 1 ? 2 : 0;
        const hh = Math.max(0.5, h - gap);
        y -= h;
        const top = j === segs.length - 1;
        g += top
          ? `<path d="${topRounded(x, y + gap, bw, hh, 4)}" style="fill:${d.s.color}"/>`
          : `<rect x="${x}" y="${y + gap}" width="${bw}" height="${hh}" style="fill:${d.s.color}"/>`;
      });
      if (totals[i] > 0 && opts.showTotal !== false)
        g += `<text class="val" x="${cx}" y="${y - 5}" text-anchor="middle">${fmt(totals[i])}</text>`;
      g += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${esc(c)}</text>`;
      g += `<rect class="hit" data-i="${i}" x="${m.l + step * i}" y="${m.t}" width="${step}" height="${ih + m.b}"/>`;
    });
    svg.innerHTML = g;
    host.appendChild(svg);
    svg.querySelectorAll(".hit").forEach((r) => {
      const i = +r.dataset.i, c = cats[i], col = svg.querySelector(`.hover-col[data-i="${i}"]`);
      bindTip(r, () => `<b>${esc(c)}</b>` + series.filter((s) => get(c, s.key)).slice().reverse()
        .map((s) => tipRow(s.label, fmt(get(c, s.key)), s.color)).join("") +
        (series.length > 1 ? tipRow("Total", `<b>${fmt(totals[i])}</b>`) : "") + (unit ? `<div style="color:var(--text-muted);margin-top:4px">${esc(unit)}</div>` : ""));
      r.addEventListener("pointerenter", () => col.classList.add("on"));
      r.addEventListener("pointerleave", () => col.classList.remove("on"));
    });
    tableView(host, [opts.catLabel || "Tahun", ...(series.length > 1 ? series.map((s) => s.label) : []), series.length > 1 ? "Total" : (opts.valLabel || "Jumlah")],
      cats.map((c, i) => [c, ...(series.length > 1 ? series.map((s) => get(c, s.key) || 0) : []), totals[i]]));
  }

  // ---------- grafik: batang horizontal ----------
  function hbars(el, items, opts = {}) {
    const host = typeof el === "string" ? $(el) : el;
    if (!items.length) { host.innerHTML = `<p class="sub">Tidak ada data untuk pilihan ini.</p>`; return; }
    const max = Math.max(...items.map((d) => d.value));
    host.innerHTML = `<div class="hbars">${items.map((d, i) => `<div class="hbar" data-i="${i}"><span class="lb" title="${esc(d.label)}">${esc(d.label)}</span><span class="tr"><i style="width:${(d.value / max) * 100}%;${opts.color ? `background:${opts.color}` : ""}"></i></span><span class="v">${fmt(d.value)}</span></div>`).join("")}</div>`;
    host.querySelectorAll(".hbar").forEach((r) => {
      const d = items[+r.dataset.i];
      bindTip(r, () => `<b>${esc(d.label)}</b>${tipRow(opts.unit || "Jumlah", fmt(d.value))}${d.note ? `<div style="color:var(--text-muted);margin-top:4px">${esc(d.note)}</div>` : ""}`);
    });
    tableView(host, [opts.labelHead || "Kategori", opts.unit || "Jumlah"], items.map((d) => [d.label, d.value]));
  }

  // ---------- grafik: heatmap sebagai tabel ----------
  function heatmap(el, rows, cols, get, opts = {}) {
    const host = $(el);
    const max = Math.max(1, ...rows.flatMap((r) => cols.map((c) => get(r, c))));
    const lvl = (v) => (v ? Math.min(6, 1 + Math.floor((v / max) * 5.999)) : 0);
    let t = `<div class="heat-wrap"><table class="heat"><thead><tr><th></th>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>`;
    rows.forEach((r) => {
      t += `<tr><th class="rl" scope="row">${opts.rowClick ? `<button type="button" data-row="${esc(r)}">${esc(r)}</button>` : esc(r)}</th>`;
      cols.forEach((c) => {
        const v = get(r, c), l = lvl(v);
        t += `<td class="${v ? (l >= 4 ? "hi" : "") : "z"}" style="background:var(--seq-${l})" data-r="${esc(r)}" data-c="${esc(c)}" data-v="${v}">${v || "·"}</td>`;
      });
      t += "</tr>";
    });
    host.innerHTML = t + "</tbody></table></div>" +
      `<ul class="legend" style="margin-top:10px"><li>Sedikit</li>${[1, 2, 3, 4, 5, 6].map((l) => `<li><i style="background:var(--seq-${l})"></i></li>`).join("")}<li>Banyak</li></ul>`;
    if (opts.rowClick) host.querySelectorAll("th.rl button").forEach((b) => b.addEventListener("click", () => opts.rowClick(b.dataset.row)));
    host.querySelectorAll("td").forEach((td) =>
      bindTip(td, () => `<b>${esc(td.dataset.r)} · ${esc(td.dataset.c)}</b>${tipRow(opts.unit || "Kegiatan", fmt(+td.dataset.v))}`));
  }

  // ---------- grafik: titik (elang) ----------
  function dotChart(el, data) {
    const host = $(el);
    host.innerHTML = "";
    host.classList.add("chart");
    host.insertAdjacentHTML("beforeend", legend([{ label: "Teramati langsung", color: "var(--series-1)", cls: "disc" }, { label: "Dugaan atau estimasi", cls: "ring" }]));
    const W = Math.max(280, host.clientWidth), H = 230, m = { t: 12, r: 12, b: 26, l: 30 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const years = uniq(data.map((d) => d.tahun)).sort();
    const y0 = years[0], y1 = years[years.length - 1] + 1;
    const max = niceMax(Math.max(...data.map((d) => d.nilai)));
    const X = (d) => m.l + ((d.tahun + ((d.bulan || 6) - 0.5) / 12 - y0) / (y1 - y0)) * iw;
    const Y = (v) => m.t + ih - (v / max) * ih;
    let g = "";
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i;
      g += `<line class="${i ? "grid-line" : "axis-line"}" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
    }
    for (let y = y0; y <= y1; y++) {
      const x = m.l + ((y - y0) / (y1 - y0)) * iw;
      if (y < y1) g += `<text x="${x + iw / (y1 - y0) / 2}" y="${H - 8}" text-anchor="middle">${y}</text>`;
      g += `<line class="grid-line" x1="${x}" x2="${x}" y1="${m.t}" y2="${m.t + ih}"/>`;
    }
    data.forEach((d, i) => {
      const lang = d.jenis_angka === "teramati langsung";
      g += `<circle cx="${X(d)}" cy="${Y(d.nilai)}" r="5" style="fill:${lang ? "var(--series-1)" : "var(--bg-surface)"};stroke:${lang ? "var(--bg-surface)" : "var(--text-secondary)"};stroke-width:2"/>`;
      g += `<circle class="hit" data-i="${i}" cx="${X(d)}" cy="${Y(d.nilai)}" r="11"/>`;
    });
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Individu elang flores per laporan monitoring");
    svg.innerHTML = g;
    host.appendChild(svg);
    svg.querySelectorAll(".hit").forEach((c) => {
      const d = data[+c.dataset.i];
      bindTip(c, `<b>${esc(d.resort)} · ${BULAN[d.bulan] || ""} ${d.tahun}</b>${tipRow(d.indikator, `${fmt(d.nilai)} ${esc(d.satuan || "")}`)}<div style="color:var(--text-muted);margin-top:4px">${esc(d.jenis_angka)}</div>`);
    });
    tableView(host, ["Tahun", "Bulan", "Resort", "Nilai", "Indikator", "Jenis angka"], data.map((d) => [d.tahun, BULAN[d.bulan] || "", d.resort, d.nilai, d.indikator, d.jenis_angka]));
  }

  // ---------- grafik: garis + pita (rusa) ----------
  function lineBand(el, data) {
    const host = $(el);
    host.innerHTML = "";
    host.classList.add("chart");
    host.insertAdjacentHTML("beforeend", legend([{ label: "Terlihat langsung", color: "var(--series-1)" }, { label: "Taksiran dari jejak (min–maks)", color: "color-mix(in srgb, var(--series-1) 22%, transparent)" }]));
    const W = Math.max(280, host.clientWidth), H = 240, m = { t: 14, r: 16, b: 26, l: 30 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const max = niceMax(Math.max(...data.map((d) => Math.max(d.perjumpaan_langsung || 0, d.jejak_maks || 0))));
    const X = (i) => m.l + (iw / (data.length - 1 || 1)) * i;
    const Y = (v) => m.t + ih - (v / max) * ih;
    let g = "";
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i;
      g += `<line class="${i ? "grid-line" : "axis-line"}" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
    }
    const band = data.map((d, i) => ({ d, i })).filter((p) => p.d.jejak_maks != null);
    if (band.length > 1) {
      const up = band.map((p) => `${X(p.i)},${Y(p.d.jejak_maks)}`).join(" L");
      const dn = band.slice().reverse().map((p) => `${X(p.i)},${Y(p.d.jejak_min)}`).join(" L");
      g += `<path d="M${up} L${dn}Z" style="fill:color-mix(in srgb, var(--series-1) 22%, transparent)"/>`;
    }
    g += `<path d="M${data.map((d, i) => `${X(i)},${Y(d.perjumpaan_langsung)}`).join(" L")}" style="fill:none;stroke:var(--series-1);stroke-width:2"/>`;
    data.forEach((d, i) => {
      g += `<circle cx="${X(i)}" cy="${Y(d.perjumpaan_langsung)}" r="5" style="fill:var(--series-1);stroke:var(--bg-surface);stroke-width:2"/>`;
      g += `<text class="val" x="${X(i)}" y="${Y(d.perjumpaan_langsung) - 10}" text-anchor="middle">${d.perjumpaan_langsung}</text>`;
      g += `<text x="${X(i)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}">${esc(d.periode)}</text>`;
      g += `<rect class="hit" data-i="${i}" x="${X(i) - iw / data.length / 2}" y="${m.t}" width="${iw / data.length}" height="${ih}"/>`;
    });
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Rusa timor di Doro Ncanga: perjumpaan langsung dan taksiran jejak");
    svg.innerHTML = g;
    host.prepend(svg);
    host.prepend(host.querySelector(".legend"));
    svg.querySelectorAll(".hit").forEach((r) => {
      const d = data[+r.dataset.i];
      bindTip(r, `<b>${esc(d.periode)}</b>${tipRow("Terlihat langsung", fmt(d.perjumpaan_langsung), "var(--series-1)")}${d.jejak_maks != null ? tipRow("Taksiran jejak", `${d.jejak_min}–${d.jejak_maks}`) : ""}`);
    });
    tableView(host, ["Periode", "Terlihat langsung", "Jejak minimum", "Jejak maksimum"], data.map((d) => [d.periode, d.perjumpaan_langsung, d.jejak_min, d.jejak_maks]));
  }

  // ---------- dialog detail ----------
  const dlg = $("#detail");
  $("#detail-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  const list = (title, arr) => (arr && arr.length ? `<h4>${esc(title)}</h4><ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  const chip = (t, cls = "") => `<span class="chip ${cls}">${esc(t)}</span>`;
  function openDialog(meta, title, body) {
    $("#detail-meta").innerHTML = meta;
    $("#detail-title").textContent = title;
    $("#detail-body").innerHTML = body;
    $("#detail-body").scrollTop = 0;
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
  }

  // ---------- main ----------
  let D;
  fetch("../data/penyuluhan/dashboard.json")
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => { D = d; init(); })
    .catch((e) => {
      $("#app").insertAdjacentHTML("afterbegin", `<div class="wrap loading">Data gagal dimuat (${esc(e.message)}). Muat ulang halaman, atau buka data mentah di repo.</div>`);
    });

  function init() {
    const P = D.penyuluhan, KL = D.kelompok;
    const GRUP = D.grup_penyuluhan, RESORT = D.resort_urut;
    const grupColor = (g) => SERIES[GRUP.indexOf(g)];
    const keg = new Map(P.map((k) => [k.id, k]));
    const kel = new Map(KL.map((g) => [g.id, g]));
    const YEARS = uniq(P.map((k) => k.tahun).filter(Boolean)).sort();
    const YL = YEARS.map(String);
    const lastRated = (g) => {
      const ys = Object.keys(g.riwayat).filter((y) => g.riwayat[y].status !== "tidak disebut").sort();
      return ys.length ? { tahun: ys[ys.length - 1], status: g.riwayat[ys[ys.length - 1]].status } : { tahun: null, status: "tidak disebut" };
    };
    KL.forEach((g) => (g._last = lastRated(g)));
    const nLaporan = (g) => sum(Object.values(g.riwayat).map((r) => r.kegiatan.length));

    // hero + kpi
    const desaAll = uniq(P.flatMap((k) => k.desa));
    const peserta = sum(P.map((k) => k.peserta));
    $("#hero-strip").innerHTML = [
      [fmt(P.length), "laporan dikurasi"],
      [fmt(KL.length), "kelompok binaan"],
      [fmt(desaAll.length), "desa dijangkau"],
      [`${YEARS[0]}–${YEARS[YEARS.length - 1]}`, "rentang tahun"],
    ].map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join("");

    const tile = (label, value, note) => `<div class="card stat"><span class="label">${label}</span><span class="value">${value}</span><span class="note">${note}</span></div>`;
    $("#kpi").innerHTML = [
      tile("Laporan penyuluhan", fmt(P.length), "pendampingan, monev, edukasi, sosialisasi"),
      tile("Jenis program", fmt(D.program.length), "dari pendampingan sampai sosialisasi"),
      tile("Kelompok binaan", fmt(KL.length), "dengan riwayat kondisi per tahun"),
      tile("Desa dijangkau", fmt(desaAll.length), "di sekitar kawasan TN Tambora"),
      tile("Peserta tercatat", fmt(peserta), `dari ${P.filter((k) => k.peserta).length} laporan yang menyebut jumlah`),
    ].join("");

    // ---- ringkasan: penyuluhan per tahun ----
    const byYG = new Map();
    P.forEach((k) => { if (k.tahun) byYG.set(`${k.tahun}|${k.kelompok_kegiatan}`, (byYG.get(`${k.tahun}|${k.kelompok_kegiatan}`) || 0) + 1); });
    register(() => stackedBars({
      el: "#ch-penyuluhan-tahun", cats: YL, aria: "Laporan penyuluhan per tahun menurut jenis",
      series: GRUP.map((g) => ({ key: g, label: g, color: grupColor(g) })),
      get: (y, g) => byYG.get(`${y}|${g}`) || 0, unit: "laporan kegiatan", height: 260,
    }));

    const resCount = (arr, r, y) => arr.filter((k) => k.tahun == y && k.resort.includes(r)).length;
    heatmap("#ch-resort-tahun", RESORT, YL, (r, y) => resCount(P, r, y));
    const rankR = RESORT.map((r) => ({ r, p: P.filter((k) => k.resort.includes(r)).length }))
      .sort((a, b) => b.p - a.p);
    $("#rank-resort").innerHTML = rankR.map((d, i) =>
      `<li><span class="n">${i + 1}</span><span class="t"><b>${esc(d.r)}</b><span>${esc(D.wilayah[d.r])}</span></span><span class="v">${d.p}</span></li>`).join("");

    // ---- kelompok ----
    const fk = { resort: $("#fk-resort"), jenis: $("#fk-jenis"), status: $("#fk-status"), q: $("#fk-q") };
    const opt = (sel, vals, lab = (v) => v) => sel.insertAdjacentHTML("beforeend", vals.map((v) => `<option value="${esc(v)}">${esc(lab(v))}</option>`).join(""));
    opt(fk.resort, [...RESORT, "Tidak disebut"].filter((r) => KL.some((g) => g.resort === r)));
    opt(fk.jenis, uniq(KL.map((g) => g.jenis)).sort());
    opt(fk.status, Object.keys(STATUS), (s) => STATUS[s].label);
    const kyears = uniq(KL.flatMap((g) => Object.keys(g.riwayat))).sort();

    function kelFiltered() {
      const q = fk.q.value.trim().toLowerCase();
      return KL.filter((g) =>
        (!fk.resort.value || g.resort === fk.resort.value) &&
        (!fk.jenis.value || g.jenis === fk.jenis.value) &&
        (!fk.status.value || g._last.status === fk.status.value) &&
        (!q || `${g.nama} ${g.desa || ""} ${g.usaha}`.toLowerCase().includes(q)));
    }

    function renderKelompok() {
      const L = kelFiltered();
      const tileSt = (st, n) => `<div class="card stat"><span class="label">${stIcon(st)}${esc(STATUS[st].label)}</span><span class="value">${fmt(n)}</span><span class="note">kelompok, menurut penilaian terakhir</span></div>`;
      const c = count(L.map((g) => g._last.status));
      $("#kpi-kelompok").innerHTML =
        `<div class="card stat"><span class="label">Kelompok ditampilkan</span><span class="value">${fmt(L.length)}<small>/ ${KL.length}</small></span><span class="note">${fmt(sum(L.map(nLaporan)))} catatan dari laporan</span></div>` +
        ["aktif", "kurang aktif", "tidak aktif"].map((s) => tileSt(s, c.get(s) || 0)).join("") +
        `<div class="card stat"><span class="label">${stIcon("tidak disebut")}Belum pernah dinilai</span><span class="value">${fmt((c.get("tidak disebut") || 0) + (c.get("baru dibentuk") || 0))}</span><span class="note">hanya disebut atau baru dibentuk</span></div>`;
      $("#kelompok-count").textContent = `${L.length} kelompok. Klik nama kelompok untuk membaca riwayat lengkapnya. Huruf di kotak: A aktif, K kurang aktif, T tidak aktif, B baru dibentuk, ? disebut tanpa penjelasan kondisi.`;

      // matriks
      const sorted = L.slice().sort((a, b) => a.resort.localeCompare(b.resort) || nLaporan(b) - nLaporan(a));
      const m = $("#ch-status-matrix");
      m.innerHTML = legend(Object.keys(STATUS).map((s) => ({ label: STATUS[s].label, cls: `st ${STATUS[s].cls}`, kode: STATUS[s].kode })).concat([{ label: "Tidak ada laporan tahun itu", cls: "st", kode: "" }])) +
        `<div class="matrix-wrap"><table class="matrix"><thead><tr><th class="name" scope="col">Kelompok</th>${kyears.map((y) => `<th scope="col">${y}</th>`).join("")}</tr></thead><tbody>${sorted.map((g) =>
          `<tr><td class="name"><button type="button" data-k="${g.id}"><b>${esc(g.nama)}</b><span>${esc(g.desa || "-")} · ${esc(g.resort)}</span></button></td>${kyears.map((y) => {
            const r = g.riwayat[y];
            return r ? `<td class="cell ${STATUS[r.status].cls}" data-k="${g.id}" data-y="${y}">${STATUS[r.status].kode}</td>` : `<td class="cell none" aria-label="tidak ada laporan"></td>`;
          }).join("")}</tr>`).join("") || `<tr><td class="name">Tidak ada kelompok yang cocok.</td></tr>`}</tbody></table></div>`;
      const lastLegend = m.querySelector(".legend li:last-child i");
      if (lastLegend) lastLegend.style.cssText = "border:1px dashed var(--border-strong);background:transparent";
      m.querySelectorAll("button[data-k]").forEach((b) => b.addEventListener("click", () => openKelompok(b.dataset.k)));
      m.querySelectorAll("td.cell[data-k]").forEach((td) => {
        const g = kel.get(td.dataset.k), r = g.riwayat[td.dataset.y];
        td.style.cursor = "pointer";
        td.addEventListener("click", () => openKelompok(g.id));
        bindTip(td, () => `<b>${esc(g.nama)} · ${td.dataset.y}</b>${tipRow("Kondisi", esc(STATUS[r.status].label))}${r.anggota ? tipRow("Anggota", fmt(r.anggota)) : ""}${tipRow("Laporan", fmt(r.kegiatan.length))}${r.kondisi ? `<div style="color:var(--text-secondary);margin-top:6px">${esc(r.kondisi)}</div>` : ""}`);
      });

      // status per tahun
      const ST = Object.keys(STATUS);
      stackedBars({
        el: "#ch-status-tahun", cats: kyears, aria: "Kondisi kelompok per tahun",
        series: ST.map((s) => ({ key: s, label: STATUS[s].label, color: `var(--${STATUS[s].cls})`, cls: `st ${STATUS[s].cls}`, kode: STATUS[s].kode })),
        get: (y, s) => L.filter((g) => g.riwayat[y] && g.riwayat[y].status === s).length, unit: "kelompok", height: 250,
      });

      hbars("#ch-usaha", [...count(L.map((g) => g.usaha))].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
        { unit: "Kelompok", labelHead: "Bidang usaha" });

      const kt = count(L.flatMap((g) => Object.values(g.riwayat).flatMap((r) => r.tema_kendala)));
      hbars("#ch-kendala", D.kendala_urut.map((k) => ({ label: k, value: kt.get(k) || 0 })).filter((d) => d.value).sort((a, b) => b.value - a.value),
        { unit: "Catatan kelompok-tahun", labelHead: "Tema kendala", color: "var(--series-2)" });

      const top = L.slice().sort((a, b) => nLaporan(b) - nLaporan(a)).slice(0, 8);
      $("#rank-kelompok").innerHTML = top.map((g, i) =>
        `<li><span class="n">${i + 1}</span><span class="t"><b><button class="linkbtn" data-k="${g.id}">${esc(g.nama)}</button></b><span>${esc(g.desa || "-")} · ${esc(g.usaha)} · terakhir ${esc(STATUS[g._last.status].label.toLowerCase())}${g._last.tahun ? ` (${g._last.tahun})` : ""}</span></span><span class="v">${nLaporan(g)}</span></li>`).join("");
      $("#rank-kelompok").querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => openKelompok(b.dataset.k)));
    }
    Object.values(fk).forEach((x) => x.addEventListener(x.tagName === "INPUT" ? "input" : "change", renderKelompok));
    $("#fk-reset").addEventListener("click", () => { Object.values(fk).forEach((x) => (x.value = "")); renderKelompok(); });
    register(renderKelompok);

    function openKelompok(id) {
      const g = kel.get(id);
      const body = `<div class="kv">
        <div><span>Desa</span>${esc(g.desa || "Tidak disebut")}</div>
        <div><span>Resort</span>${esc(g.resort)}${g.wilayah !== "Tidak disebut" ? ` · ${esc(g.wilayah)}` : ""}</div>
        <div><span>Jenis</span>${esc(g.jenis)}</div>
        <div><span>Usaha</span>${esc(g.usaha)}</div>
        <div><span>Dibentuk</span>${esc(g.dibentuk || "Tidak disebut")}</div>
        ${g.ketua ? `<div><span>Ketua</span>${esc(g.ketua)}</div>` : ""}
      </div>
      ${g.dasar_pembentukan ? `<h4>Dasar pembentukan</h4><p>${esc(g.dasar_pembentukan)}</p>` : ""}
      <h4>Riwayat per tahun</h4>
      <div class="hist">${Object.entries(g.riwayat).sort().reverse().map(([y, r]) => `<div><span class="y">${y}</span><div>
        <div class="row-head">${stBadge(r.status)}${r.anggota ? chip(`${r.anggota} anggota${r.anggota_perempuan ? `, ${r.anggota_perempuan} perempuan` : ""}`) : ""}</div>
        ${r.kondisi ? `<p>${esc(r.kondisi)}</p>` : ""}
        <ul>
          ${r.penilaian.length ? `<li><b>Penilaian:</b> ${esc(r.penilaian.join("; "))}</li>` : ""}
          ${r.kendala.length ? `<li><b>Kendala:</b> ${esc(r.kendala.join("; "))}</li>` : ""}
          ${r.kebutuhan.length ? `<li><b>Kebutuhan:</b> ${esc(r.kebutuhan.join("; "))}</li>` : ""}
          ${r.bantuan.length ? `<li><b>Bantuan tercatat:</b> ${esc(r.bantuan.join("; "))}</li>` : ""}
          ${r.produk.length ? `<li><b>Produk/usaha:</b> ${esc(r.produk.join("; "))}</li>` : ""}
          ${r.pendapatan ? `<li><b>Pendapatan:</b> Rp${fmt(r.pendapatan[0])}${r.pendapatan[1] ? ` (${esc(r.pendapatan[1])})` : ""}</li>` : ""}
          ${r.kegiatan.length ? `<li><b>Laporan (${r.kegiatan.length}):</b><ul>${r.kegiatan.filter((i) => keg.has(i)).map((i) => `<li><button class="linkbtn" data-p="${i}">${esc(keg.get(i).judul)}</button></li>`).join("")}</ul></li>` : ""}
        </ul></div></div>`).join("")}</div>`;
      openDialog(`${stBadge(g._last.status)} ${chip(g.jenis)}`, g.nama, body);
      $("#detail-body").querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => openKegiatan(b.dataset.p)));
    }

    // ---- program: semua jenis kegiatan ----
    const PROG = D.program;
    heatmap("#ch-jenis-tahun", PROG.map((x) => x.jenis), YL,
      (j, y) => P.filter((k) => k.jenis_kegiatan === j && String(k.tahun) === y).length,
      { unit: "Laporan", rowClick: (j) => { selectProgram(j); $("#program").scrollIntoView({ behavior: "smooth", block: "start" }); } });
    const tabs = $("#prog-tabs");
    tabs.innerHTML = PROG.map((x) => `<button class="ptab" role="tab" type="button" aria-selected="false" data-j="${esc(x.jenis)}"><span class="tema-dot" style="background:${grupColor(x.kelompok_kegiatan)}" aria-hidden="true"></span>${esc(x.jenis)} <b>${x.jumlah_laporan}</b></button>`).join("");
    tabs.querySelectorAll(".ptab").forEach((b) => b.addEventListener("click", () => selectProgram(b.dataset.j)));
    let progSel = null;
    function selectProgram(j) {
      progSel = PROG.find((x) => x.jenis === j) || PROG[0];
      tabs.querySelectorAll(".ptab").forEach((b) => b.setAttribute("aria-selected", b.dataset.j === progSel.jenis));
      renderProgram();
    }
    function renderProgram() {
      const x = progSel, th = Object.keys(x.per_tahun);
      const ks = x.kegiatan.map((i) => keg.get(i)).filter(Boolean).sort((a, b) => (b.tahun || 0) - (a.tahun || 0) || (b.bulan || 0) - (a.bulan || 0));
      const kelLink = ["Pendampingan kelompok binaan", "Monitoring & evaluasi kelompok", "Pembentukan kelompok", "Penyusunan RPP/RKT/RPM", "Bantuan ekonomi produktif"].includes(x.jenis);
      $("#prog-panel").innerHTML = `<div class="prog-head"><div><h3>${esc(x.jenis)}</h3><p>${esc(x.tujuan)}</p></div>${chip(x.kelompok_kegiatan)}</div>
        <div class="kv prog-kv">
          <div><span>Laporan</span><b>${fmt(x.jumlah_laporan)}</b></div>
          <div><span>Tahun</span><b>${th.length ? (th[0] === th[th.length - 1] ? th[0] : `${th[0]}–${th[th.length - 1]}`) : "–"}</b></div>
          <div><span>Desa dijangkau</span><b>${fmt(x.desa.length)}</b></div>
          <div><span>Peserta tercatat</span><b>${x.peserta_tercatat ? fmt(x.peserta_tercatat) : "–"}</b>${x.peserta_tercatat ? `<span>dari ${x.laporan_dengan_peserta} laporan</span>` : ""}</div>
        </div>
        <div class="prog-grid">
          <div><h4>Isi laporan</h4><ul class="poin">${x.poin.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
            ${kelLink ? `<p style="margin-top:12px"><a href="#kelompok">Lihat kondisi tiap kelompok di bagian Kelompok binaan</a></p>` : ""}
            ${x.desa.length ? `<h4 style="margin-top:18px">Desa</h4><div class="chips">${x.desa.map((d) => chip(d)).join("")}</div>` : ""}</div>
          <div><h4>Laporan per tahun</h4><div id="prog-bars"></div></div>
        </div>
        <h4 style="margin:18px 0 0;font-size:13px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.06em">Semua laporan (${ks.length})</h4>
        <div class="klist">${ks.map((k) => `<button type="button" data-p="${k.id}"><span class="y">${k.tahun || "–"}</span><span>${esc(k.judul)}<span>${esc([k.bulan ? BULAN[k.bulan] : "", k.desa.join(", ") || k.resort.join(", ")].filter(Boolean).join(" · ") || "Lokasi tidak disebut")}${k.peserta ? ` · ${fmt(k.peserta)} peserta` : ""}</span></span></button>`).join("")}</div>`;
      stackedBars({
        el: "#prog-bars", cats: YL, series: [{ key: "n", label: x.jenis, color: grupColor(x.kelompok_kegiatan) }],
        get: (y) => x.per_tahun[y] || 0, unit: "laporan", valLabel: "Laporan", height: 200, aria: `Laporan ${x.jenis} per tahun`,
      });
      $("#prog-panel").querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => openKegiatan(b.dataset.p)));
    }
    selectProgram("Tambora Goes To School");
    register(() => progSel && renderProgram());

    // ---- penyuluhan ----
    const pesertaY = YL.map((y) => sum(P.filter((k) => String(k.tahun) === y).map((k) => k.peserta)));
    register(() => stackedBars({
      el: "#ch-peserta", cats: YL, series: [{ key: "p", label: "Peserta", color: "var(--series-1)" }],
      get: (y) => pesertaY[YL.indexOf(y)], unit: "peserta tercatat", valLabel: "Peserta", aria: "Peserta tercatat per tahun",
    }));
    hbars("#ch-desa", [...count(P.flatMap((k) => k.desa))].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 12),
      { unit: "Kegiatan", labelHead: "Desa" });

    const gts = new Map();
    P.forEach((k) => k.sekolah.forEach((s) => {
      const e = gts.get(s.nama) || { nama: s.nama, jenjang: s.jenjang, tahun: new Set(), siswa: 0, desa: new Set() };
      if (k.tahun) e.tahun.add(k.tahun);
      e.siswa += s.peserta || 0;
      k.desa.forEach((d) => e.desa.add(d));
      gts.set(s.nama, e);
    }));
    const sekolah = [...gts.values()].sort((a, b) => Math.min(...a.tahun) - Math.min(...b.tahun) || a.nama.localeCompare(b.nama));
    const nGts = P.filter((k) => k.jenis_kegiatan === "Tambora Goes To School").length;
    $("#gts-sub").textContent = `${sekolah.length} sekolah dan pesantren disebut namanya di ${nGts} laporan Tambora Goes To School dan kegiatan kader. Diurutkan menurut tahun kunjungan pertama.`;
    $("#gts-list").innerHTML = `<div class="school-list">${sekolah.map((s) =>
      `<div><b>${esc(s.nama)}</b><span>${[...s.tahun].sort().join(", ") || "tahun tidak tercantum"}${s.desa.size ? ` · ${esc([...s.desa].slice(0, 2).join(", "))}` : ""}</span></div>`).join("")}</div>`;

    // timeline per tahun
    $("#timeline-masyarakat").innerHTML = YEARS.map((y) => {
      const ks = P.filter((k) => k.tahun === y);
      const jk = [...count(ks.map((k) => k.jenis_kegiatan))].sort((a, b) => b[1] - a[1]);
      const kd = KL.filter((g) => g.riwayat[y]);
      const c = count(kd.map((g) => g.riwayat[y].status));
      const desa = uniq(ks.flatMap((k) => k.desa));
      const top = jk.slice(0, 3).map(([j, n]) => `${j} (${n})`).join(", ");
      return `<div class="tl-item"><div class="tl-year">${y}</div><div><h3>${ks.length} kegiatan penyuluhan dan pemberdayaan</h3><p>Terbanyak: ${esc(top)}.${kd.length ? ` ${kd.length} kelompok dibahas: ${c.get("aktif") || 0} aktif, ${c.get("kurang aktif") || 0} kurang aktif, ${c.get("tidak aktif") || 0} tidak aktif.` : ""}</p>
        <div class="tl-figs"><span>${fmt(desa.length)} desa</span><span>${fmt(sum(ks.map((k) => k.peserta)))} peserta tercatat</span><span>${fmt(uniq(kd.map((g) => g.id)).length)} kelompok dibahas</span></div></div></div>`;
    }).join("");

    // ---- laporan (kartu) ----
    const ALL = [
      ...P.map((k) => ({ src: "penyuluhan", id: k.id, judul: k.judul, tahun: k.tahun, bulan: k.bulan, resort: k.resort, jenis: k.jenis_kegiatan, grup: k.kelompok_kegiatan, ringkasan: k.ringkasan, cari: `${k.judul} ${k.desa.join(" ")} ${k.kelompok.join(" ")} ${k.sekolah.map((s) => s.nama).join(" ")} ${k.ringkasan}`.toLowerCase() })),
    ].sort((a, b) => (b.tahun || 0) - (a.tahun || 0) || (b.bulan || 0) - (a.bulan || 0));
    const fl = { tahun: $("#fl-tahun"), resort: $("#fl-resort"), jenis: $("#fl-jenis"), q: $("#fl-q") };
    opt(fl.tahun, YL.slice().reverse());
    opt(fl.resort, RESORT);
    function fillJenis() {
      const v = fl.jenis.value;
      const js = uniq(ALL.map((k) => k.jenis)).sort();
      fl.jenis.innerHTML = `<option value="">Semua jenis</option>` + js.map((j) => `<option>${esc(j)}</option>`).join("");
      if (js.includes(v)) fl.jenis.value = v;
    }
    fillJenis();
    let shown = 24;
    function renderCards(reset) {
      if (reset) shown = 24;
      const q = fl.q.value.trim().toLowerCase();
      const L = ALL.filter((k) =>
        (!fl.tahun.value || String(k.tahun) === fl.tahun.value) &&
        (!fl.resort.value || k.resort.includes(fl.resort.value)) &&
        (!fl.jenis.value || k.jenis === fl.jenis.value) &&
        (!q || q.split(/\s+/).every((w) => k.cari.includes(w))));
      $("#fl-count").textContent = `${fmt(L.length)} laporan${L.length > shown ? `, menampilkan ${shown} pertama` : ""}.`;
      $("#cards").innerHTML = L.slice(0, shown).map((k) => `<button class="kcard" type="button" data-src="${k.src}" data-id="${esc(k.id)}">
        <span class="meta"><span class="tema-dot" style="background:${grupColor(k.grup)}" aria-hidden="true"></span>${chip(k.jenis)}</span>
        <h3>${esc(k.judul)}</h3><p>${esc(k.ringkasan)}</p>
        <span class="foot"><span>${k.bulan ? BULAN[k.bulan] + " " : ""}${k.tahun || "Tahun tidak tercantum"}</span><span>${esc(k.resort.join(", ") || "Resort tidak disebut")}</span></span></button>`).join("") ||
        `<p class="sub">Tidak ada laporan yang cocok. Coba hapus salah satu saringan.</p>`;
      $("#more-btn").style.display = L.length > shown ? "" : "none";
      $("#cards").querySelectorAll(".kcard").forEach((c) => c.addEventListener("click", () =>
        openKegiatan(c.dataset.id)));
    }
    [fl.tahun, fl.resort, fl.jenis].forEach((x) => x.addEventListener("change", () => renderCards(true)));
    fl.q.addEventListener("input", () => renderCards(true));
    $("#fl-reset").addEventListener("click", () => { Object.values(fl).forEach((x) => (x.value = "")); fillJenis(); renderCards(true); });
    $("#more-btn").addEventListener("click", () => { shown += 24; renderCards(); });
    renderCards(true);

    function openKegiatan(id) {
      const k = keg.get(id);
      const waktu = k.tanggal || [BULAN[k.bulan], k.tahun].filter(Boolean).join(" ") || "Tidak tercantum";
      const body = `<div class="kv">
        <div><span>Waktu</span>${esc(waktu)}</div>
        <div><span>Resort</span>${esc(k.resort.join(", ") || "Tidak disebut")}</div>
        <div><span>Desa</span>${esc(k.desa.join(", ") || "Tidak disebut")}</div>
        <div><span>Peserta</span>${k.peserta ? fmt(k.peserta) : "Tidak disebut"}</div>
      </div>
      <h4>Ringkasan</h4><p>${esc(k.ringkasan)}</p>
      ${k.kelompok_id.length ? `<h4>Kelompok yang dibahas</h4><p>${k.kelompok_id.filter((i) => kel.has(i)).map((i) => `<button class="linkbtn" data-k="${i}">${esc(kel.get(i).nama)}</button>`).join(" · ")}</p>` : ""}
      ${k.sekolah.length ? list("Sekolah", k.sekolah.map((s) => s.nama + (s.peserta ? ` (${s.peserta} siswa)` : ""))) : ""}
      ${list("Temuan", k.temuan)}${list("Kendala", k.kendala)}${list("Rekomendasi", k.rekomendasi)}
      ${k.url ? `<a class="btn btn-primary" href="${esc(k.url)}" target="_blank" rel="noopener">Buka berkas asli di Google Drive</a>` : ""}`;
      openDialog(`${chip(k.jenis_kegiatan)}${chip(k.kelompok_kegiatan)}`, k.judul, body);
      $("#detail-body").querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => openKelompok(b.dataset.k)));
    }

    // ---- footer ----
    $("#footer-sources").innerHTML =
      `<li><a href="${esc(D.folder_drive_penyuluhan)}" target="_blank" rel="noopener">Drive: penyuluhan &amp; pemberdayaan (${D.katalog_penyuluhan.length} berkas)</a></li>`;

    // buka kelompok dari hash, misal #kelompok/k03
    const fromHash = () => { const m = location.hash.match(/^#kelompok\/(k\d+)$/); if (m && kel.has(m[1])) openKelompok(m[1]); };
    fromHash();
    addEventListener("hashchange", fromHash);
  }

  // ---------- resize ----------
  let rt;
  let lastW = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    clearTimeout(rt);
    rt = setTimeout(() => charts.forEach((f) => f()), 150);
  });

  // ---------- nav, menu, tema ----------
  const nav = $("#nav"), menuBtn = $("#menu-btn");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  $("#nav-links").addEventListener("click", (e) => {
    if (e.target.tagName === "A") { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
  });
  const links = [...document.querySelectorAll("#nav-links a")];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("section.block").forEach((s) => io.observe(s));

})();
