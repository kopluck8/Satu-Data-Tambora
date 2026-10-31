#!/usr/bin/env python3
"""Analisis potensi dan ancaman per resor untuk tab Resor Pengelolaan (Satu Data Tambora).

Batas yang dipakai adalah data/resor/batas_resor_2026.geojson (7 resor hasil kajian 2026). Batas ini
hanya untuk tab Resor Pengelolaan; dashboard SMART, RBM, dan Simulasi tetap memakai batas lamanya.

Sumber:
  data/resor/kajian_2026.json   ringkasan Laporan Hasil Kajian Wilayah Kerja Resor (13 September 2026)
  repo Dashboard SMART (--smart) file patroli Drive digabung dengan Google Sheets (cadangan data.csv)
                                 persis seperti dashboard SMART, jalur patroli, grid 1 km, status jenis
  delineasi areal terbakar      GeoJSON Simulasi-API-Tambora (--terbakar, path atau URL)

Hasil:
  data/resor/analisis.json      angka dan penilaian per resor
  data/resor/peta.geojson       titik ancaman, sel satwa kunci (disamarkan ke sel 1 km), fitur, sel terpatroli

Metode (rincian di halaman Metode tab Resor Pengelolaan):
  - Ancaman: Miradi Simple Threat Rating (Conservation Standards/CMP 2020) dengan klasifikasi ancaman
    IUCN-CMP (Salafsky dkk. 2008). Lingkup x keparahan -> magnitudo; magnitudo x ketakpulihan ->
    peringkat; peringkat per resor dirangkum dengan aturan 3-5-7 dan 2-prime.
  - Laju temuan: temuan per 10 hari patroli (encounter rate per satuan upaya).
  - Potensi: tiga fungsi konservasi (perlindungan, pengawetan, pemanfaatan; UU 5/1990 jo. UU 32/2024)
    dengan indikator dari Laporan Kajian (indeks lokasi/LQ kriteria Zonation) dan data SMART.

Jalankan:  python tools/resor/olah_resor.py --smart ../Dashboard_SMART_TNGunungTambora
"""
from __future__ import annotations

import argparse
import collections
import csv
import datetime as dt
import io
import json
import math
import re
import sys
import urllib.request
from pathlib import Path

import numpy as np
import shapely
from pyproj import Transformer
from shapely.geometry import shape
from shapely.strtree import STRtree

AKAR = Path(__file__).resolve().parents[2]
SIMULASI_RAW = 'https://raw.githubusercontent.com/kopluck8/Simulasi-API-Tambora/main/docs/'
URL_TERBAKAR = SIMULASI_RAW + 'data/areal_terbakar.geojson'
URL_STATUS_TERBAKAR = SIMULASI_RAW + 'status/areal_terbakar.json'

KE_UTM = Transformer.from_crs(4326, 32750, always_xy=True)  # WGS 84 / UTM 50S
KE_GEO = Transformer.from_crs(32750, 4326, always_xy=True)
WITA = dt.timezone(dt.timedelta(hours=8))

TEPI_M = 500          # titik di luar batas sejauh ini masih dihitung ke resor terdekat
DESA_M = 10000        # kegiatan penyuluhan di desa penyangga: resor terdekat dalam jarak ini
MIN_SEL = 5           # sel terjamah minimum agar lingkup dihitung dari sebaran temuan
JALUR_MIN_M = 50      # panjang jalur minimum dalam satu sel agar sel dihitung terjamah
SEDIKIT_HARI = 10     # di bawah ini penilaian ditandai indikatif
SEDIKIT_CAKUPAN = 15  # persen sel terjamah; di bawah ini penilaian ditandai indikatif

TINGKAT = {0: '', 1: 'Rendah', 2: 'Sedang', 3: 'Tinggi', 4: 'Sangat tinggi'}

# Miradi Simple Threat Rating. Lingkup x keparahan -> magnitudo (simetris).
MAGNITUDO = {4: {4: 4, 3: 3, 2: 2, 1: 1},
             3: {4: 3, 3: 3, 2: 2, 1: 1},
             2: {4: 2, 3: 2, 2: 2, 1: 1},
             1: {4: 1, 3: 1, 2: 1, 1: 1}}
# Magnitudo (baris) x ketakpulihan (kolom) -> peringkat ancaman.
PERINGKAT = {4: {4: 4, 3: 4, 2: 4, 1: 3},
             3: {4: 4, 3: 3, 2: 3, 1: 2},
             2: {4: 3, 3: 2, 2: 2, 1: 1},
             1: {4: 2, 3: 1, 2: 1, 1: 1}}

# Jenis ancaman, kode klasifikasi IUCN-CMP (Salafsky dkk. 2008; v3.2), nilai dasar keparahan dan
# ketakpulihan (1 rendah - 4 sangat tinggi) beserta alasannya.
ANCAMAN = {
    'karhut': dict(nama='Kebakaran hutan dan lahan', iucn='7.1.1',
                   kelas='Peningkatan frekuensi/intensitas kebakaran',
                   keparahan=2, alasan_keparahan='api di savana umumnya membakar rumput dan lapisan bawah',
                   pulih=2, alasan_pulih='savana tumbuh kembali, tetapi kebakaran berulang menghambat suksesi (6–20 tahun)'),
    'rambah': dict(nama='Perambahan untuk ladang/kebun', iucn='2.1',
                   kelas='Tanaman semusim dan tahunan bukan kayu',
                   keparahan=3, alasan_keparahan='tutupan asli hilang seluruhnya di areal garapan',
                   pulih=3, alasan_pulih='pemulihan bekas ladang butuh 21–100 tahun dan biaya besar'),
    'buru': dict(nama='Perburuan satwa', iucn='5.1',
                 kelas='Perburuan dan penangkapan satwa darat',
                 keparahan=2, alasan_keparahan='menurunkan populasi satwa sasaran',
                 pulih=2, alasan_pulih='populasi dapat pulih 6–20 tahun bila perburuan berhenti'),
    'kayu': dict(nama='Pembalakan liar', iucn='5.3', kelas='Pembalakan dan pemanenan kayu',
                 keparahan=2, alasan_keparahan='penebangan pohon secara selektif',
                 pulih=3, alasan_pulih='pohon besar butuh puluhan tahun untuk tumbuh kembali'),
    'ternak': dict(nama='Penggembalaan ternak liar', iucn='2.3', kelas='Peternakan dan penggembalaan',
                   keparahan=2, alasan_keparahan='menekan regenerasi anakan dan bersaing pakan dengan rusa',
                   pulih=2, alasan_pulih='vegetasi pulih 6–20 tahun setelah ternak dikeluarkan'),
    'invasif': dict(nama='Tumbuhan asing invasif', iucn='8.1', kelas='Spesies asing invasif',
                    keparahan=2, alasan_keparahan='menekan tumbuhan asli di areal terbuka',
                    pulih=3, alasan_pulih='sulit diberantas setelah mapan'),
    'tanpaizin': dict(nama='Pendakian/kunjungan tanpa izin', iucn='6.1', kelas='Aktivitas rekreasi',
                      keparahan=1, alasan_keparahan='dampak langsung kecil (sampah, api unggun, gangguan satwa)',
                      pulih=1, alasan_pulih='mudah dipulihkan'),
    'jalan': dict(nama='Pembukaan akses jalan', iucn='4.1', kelas='Jalan dan rel',
                  keparahan=1, alasan_keparahan='membuka akses bagi gangguan lain',
                  pulih=2, alasan_pulih='badan jalan tertutup vegetasi dalam 6–20 tahun'),
    'tambang': dict(nama='Penambangan', iucn='3.2', kelas='Pertambangan dan penggalian',
                    keparahan=3, alasan_keparahan='mengubah bentang lahan',
                    pulih=4, alasan_pulih='bentang lahan tidak dapat dipulihkan'),
}
URUT_ANCAMAN = list(ANCAMAN)
SUB_ANCAMAN = {
    'Kebakaran Hutan dan Lahan': 'karhut', 'Penggunaan Kawasan': 'rambah', 'Pengembalaan Ternak': 'ternak',
    'Perburuan Satwa': 'buru', 'Pembalakan': 'kayu', 'Pembuatan Akses Jalan': 'jalan',
    'Penambangan dan Pengeboran': 'tambang', 'Pengambilan HHBK': 'hhbk',
}
HUTAN = re.compile(r'hutan|cemara|casuarina|edelweis|anaphalis|pegunungan|montan', re.I)
KAYU_BULAT = re.compile(r'kayubulat|kayu bulat|pembalak|balok|papan|gergaji|chainsaw', re.I)
NO_SPECIES = re.compile(r'^belum ada di list$', re.I)

TIPE = {  # kode SMART -> teks
    'masihterbakar': 'masih terbakar', 'jeratsling': 'jerat sling', 'jeratrotan': 'jerat rotan',
    'kayubulatkecil': 'kayu bulat kecil', 'kayubulatbesar': 'kayu bulat besar', 'kayubakar': 'kayu bakar',
    'pengunjungtanpaizinwni': 'pengunjung tanpa izin (WNI)', 'pengunjungtanpaizinwna': 'pengunjung tanpa izin (WNA)',
    'jalanmobil': 'jalan mobil', 'gubukcampbevak': 'gubuk/camp', 'alatkerjalainnya': 'alat kerja lain',
    'pengambilhhbk': 'pengambil HHBK', 'airterjun': 'air terjun', 'tampunganataugenanganair': 'genangan air',
}
EKOSISTEM = {  # Ground Check -> kelas ekosistem
    'savana': 'Savana', 'hutanpamah': 'Hutan pamah', 'pamah': 'Hutan pamah', 'padangrumput': 'Padang rumput',
    'hutanpegununganbawah': 'Hutan pegunungan bawah', 'pegununganbawah': 'Hutan pegunungan bawah',
    'pegununganatas': 'Hutan pegunungan atas', 'hutanpegununganatas': 'Hutan pegunungan atas',
    'subalpin': 'Sub-alpin', 'ladang': 'Ladang', 'sungai': 'Sungai', 'savanapadangrumput': 'Savana/padang rumput',
    'hutanmonsun': 'Hutan monsun', 'hutanhujan': 'Hutan hujan', 'semak': 'Semak', 'belukar': 'Semak',
    'tanamancampuran': 'Tanaman campuran', 'lahanterbukaalamilainnya': 'Lahan terbuka', 'lainnyatulisdikomen': 'Lainnya',
}
NAMA_INVASIF = {'lantanacamara': ('Tembelekan', 'Lantana camara'), 'chromolaenaodorata': ('Kirinyuh', 'Chromolaena odorata')}


# ---------------------------------------------------------------- utilitas
def hkey(s):
    return re.sub(r'[^a-z0-9]', '', str(s or '').lower())


def angka(v):
    try:
        x = float(str(v).strip().replace(',', '.', 1))
    except (TypeError, ValueError):
        return None
    return x if math.isfinite(x) else None


def bulat(x, d=1):
    return None if x is None else round(float(x), d)


def fmt(x, d=0):
    """Angka gaya Indonesia: 1.234,5"""
    s = f'{x:,.{d}f}'
    return s.replace(',', '\0').replace('.', ',').replace('\0', '.')


def tipe_teks(v):
    v = str(v or '').strip()
    return TIPE.get(hkey(v), v[:1].lower() + v[1:] if v[:2] != v[:2].upper() else v)


def baca_json(sumber):
    if re.match(r'^https?://', str(sumber)):
        req = urllib.request.Request(str(sumber), headers={'User-Agent': 'satu-data-tambora'})
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode('utf-8'))
    return json.loads(Path(sumber).read_text(encoding='utf-8'))


def unduh_teks(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'satu-data-tambora'})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read().decode('utf-8-sig')


def ubah(g, tr, desimal=None):
    def f(c):
        x, y = tr.transform(c[:, 0], c[:, 1])
        xy = np.column_stack([x, y])
        return np.round(xy, desimal) if desimal is not None else xy
    return shapely.transform(g, f)


# ---------------------------------------------------------------- data SMART (sama dengan dashboard SMART)
CORE = ['Waypoint ID', 'Waypoint Date', 'Waypoint Time', 'X', 'Y', 'Observation Category 0',
        'Observation Category 1', 'Observation Group']
BULAN_EN = {m: i for i, m in enumerate(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], 1)}
DMY = re.compile(r'^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})')


def baca_config(path):
    teks = '\n'.join(b for b in Path(path).read_text(encoding='utf-8').splitlines() if not b.strip().startswith('//'))
    cfg = {}
    for k in ('SHEET_CSV_URL', 'FALLBACK_CSV', 'DATA_DRIVE', 'JALUR_PATROLI'):
        m = re.search(r'\b' + k + r'\s*:\s*"([^"]*)"', teks)
        cfg[k] = m.group(1) if m else ''
    m = re.search(r'\bTAHUN_AWAL\s*:\s*(\d{4})', teks)
    cfg['TAHUN_AWAL'] = int(m.group(1)) if m else None
    return cfg


def baca_model(path):
    t = Path(path).read_text(encoding='utf-8')
    return json.loads(t[t.index('['):t.rindex(']') + 1])


def kamus_kolom(model):
    nama = list(CORE)
    for c in model:
        nama += c.get('fields', [])
        for s in c.get('subs', []):
            nama += s.get('fields', [])
    return {hkey(h): h for h in nama}


def hms(t):
    m = re.match(r'^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AP])?', str(t or '').strip(), re.I)
    if not m:
        return ''
    h = int(m.group(1)) % (12 if m.group(4) else 24)
    if m.group(4) and m.group(4).upper() == 'P':
        h += 12
    return f'{h:02d}:{m.group(2)}:{m.group(3) or "00"}'


def hari_di_depan(nilai):
    """Urutan tanggal angka ditentukan sekali per kolom, seperti dashboard SMART."""
    hd = bd = 0
    for v in nilai:
        m = DMY.match(str(v or '').strip())
        if m:
            hd += int(m.group(1)) > 12
            bd += int(m.group(2)) > 12
    return hd > bd


def _tgl(y, m, d):
    try:
        return dt.date(y, m, d)
    except ValueError:
        return None


def tanggal(s, hari_dulu=False):
    s = str(s or '').strip()
    m = re.match(r'^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})', s)
    if m and m.group(1).title() in BULAN_EN:
        return _tgl(int(m.group(3)), BULAN_EN[m.group(1).title()], int(m.group(2)))
    m = re.match(r'^(\d{4})-(\d{1,2})-(\d{1,2})', s)
    if m:
        return _tgl(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    m = DMY.match(s)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        dd, mm = (a, b) if hari_dulu else (b, a)
        if mm > 12 >= dd:
            dd, mm = mm, dd
        return _tgl(int(m.group(3)), mm, dd)
    return None


def baca_csv(teks, kamus):
    grid = [b for b in csv.reader(io.StringIO(teks)) if any(c.strip() for c in b)]
    hi = next((i for i, b in enumerate(grid[:15]) if any(hkey(c) == 'observationcategory0' for c in b)), -1)
    if hi < 0:
        raise ValueError('kolom Observation Category 0 tidak ditemukan')
    kepala = []
    for h in grid[hi]:
        h = re.sub(r'\s+', ' ', h.replace('﻿', '')).strip()
        kepala.append(kamus.get(hkey(h), h))
    return [{h: (b[i] if i < len(b) else '') for i, h in enumerate(kepala)} for b in grid[hi + 1:]]


def normalisasi(baris, model, sumber):
    k0 = {hkey(c['name']): c['name'] for c in model}
    k1 = {hkey(s['name']): s['name'] for c in model for s in c.get('subs', [])}
    hd = hari_di_depan(r.get('Waypoint Date') for r in baris)
    out = []
    for r in baris:
        c0 = str(r.get('Observation Category 0') or '').strip()
        if not c0:
            continue
        c1 = str(r.get('Observation Category 1') or '').strip()
        d = tanggal(r.get('Waypoint Date'), hd)
        out.append({'r': r, 'd': d, 'day': d.isoformat() if d else '', 'c0': k0.get(hkey(c0), c0),
                    'c1': k1.get(hkey(c1), c1), 'lon': angka(r.get('X')), 'lat': angka(r.get('Y')), 'sumber': sumber})
    return out


def kunci_wp(o):
    lon = o['lon'] if o['lon'] is not None else 0.0
    lat = o['lat'] if o['lat'] is not None else 0.0
    return f"{o['day']} {hms(o['r'].get('Waypoint Time'))} {lon:.5f} {lat:.5f}"


def muat_smart(akar, pakai_sheet=True, log=print):
    akar = Path(akar)
    cfg = baca_config(akar / 'assets/config.js')
    model = baca_model(akar / 'assets/model.js')
    kamus = kamus_kolom(model)
    drive = []
    if cfg['DATA_DRIVE'] and (akar / cfg['DATA_DRIVE']).is_file():
        drive = normalisasi(baca_csv((akar / cfg['DATA_DRIVE']).read_text(encoding='utf-8-sig'), kamus), model, 'drive')
    sheet, dari = [], ''
    if pakai_sheet and cfg['SHEET_CSV_URL']:
        try:
            sheet, dari = normalisasi(baca_csv(unduh_teks(cfg['SHEET_CSV_URL']), kamus), model, 'sheet'), 'Google Sheets'
        except Exception as e:  # sama seperti dashboard: jatuh ke file cadangan
            log(f'Google Sheets tidak terbaca ({e}); memakai file cadangan')
    if not sheet and cfg['FALLBACK_CSV'] and (akar / cfg['FALLBACK_CSV']).is_file():
        sheet = normalisasi(baca_csv((akar / cfg['FALLBACK_CSV']).read_text(encoding='utf-8-sig'), kamus), model, 'sheet')
        dari = cfg['FALLBACK_CSV']
    lihat = {kunci_wp(o) for o in drive}
    tambahan = [o for o in sheet if kunci_wp(o) not in lihat]
    info = {'drive': len(drive), 'sheet': len(tambahan), 'sheet_dari': dari}
    return drive + tambahan, cfg, info


def muat_status(path):
    t = Path(path).read_text(encoding='utf-8')
    pola = r'"([^"]+)":\s*\{\s*dilindungi:\s*(true|false),\s*iucn:\s*"(\w+)"'
    return {m.group(1): {'dilindungi': m.group(2) == 'true', 'iucn': m.group(3)} for m in re.finditer(pola, t)}


def pisah_jenis(s):
    """Format SMART "Lokal - Indonesia - Ilmiah" (bagian boleh kosong), sama dengan splitSpecies dashboard."""
    p = [x.strip() for x in re.split(r'\s*-\s+', str(s or '').strip())]
    if len(p) >= 3:
        return {'lokal': p[0], 'indo': p[1], 'latin': ' - '.join(p[2:])}
    if len(p) == 2:
        return {'lokal': '', 'indo': p[0], 'latin': p[1]}
    return {'lokal': '', 'indo': str(s or '').strip(), 'latin': ''}


def nama_jenis(sp):
    return sp['indo'] or sp['lokal'] or sp['latin']


# ---------------------------------------------------------------- ruang
class Wilayah:
    def __init__(self, batas, kajian):
        info = {r['kode']: r for r in kajian['resor']}
        self.resor = []
        for f in sorted(batas['features'], key=lambda f: f['properties']['kode']):
            k = info[f['properties']['kode']]
            g = shapely.make_valid(ubah(shape(f['geometry']), KE_UTM))
            shapely.prepare(g)
            self.resor.append({'id': k['id'], 'kode': k['kode'], 'nama': k['nama'], 'sptn': k['sptn'],
                               'luas_ha': k['luas_ha'], 'g': g})
        self.tn = shapely.union_all([r['g'] for r in self.resor])
        shapely.prepare(self.tn)

    def letak(self, p):
        """(id resor, status, jarak m, id resor terdekat); status dalam, tepi (<= TEPI_M), atau luar."""
        for r in self.resor:
            if r['g'].covers(p):
                return r['id'], 'dalam', 0.0, r['id']
        jarak, rid = min((r['g'].distance(p), r['id']) for r in self.resor)
        if jarak <= TEPI_M:
            return rid, 'tepi', jarak, rid
        return None, 'luar', jarak, rid


class Grid:
    def __init__(self, gj, wilayah):
        self.sel = []
        for f in gj['features']:
            g = ubah(shape(f['geometry']), KE_UTM)
            if not g.intersects(wilayah.tn):
                continue
            a, rid = max((g.intersection(r['g']).area, r['id']) for r in wilayah.resor)
            if a > 0:
                self.sel.append({'id': str(f['properties'].get('Grid_ID')), 'g': g, 'resor': rid, 'geo': f['geometry']})
        self.tree = STRtree([s['g'] for s in self.sel])
        self.by_id = {s['id']: s for s in self.sel}

    def di(self, p):
        i = self.tree.query(p, predicate='intersects')
        return self.sel[int(i[0])]['id'] if len(i) else None


def asal_wilayah(wilayah, path_lama):
    """Luas tiap resor baru yang berasal dari resor lama (ha). Batas lama hanya dibaca untuk perbandingan."""
    if not Path(path_lama).is_file():
        return {}
    lama = []
    for f in json.loads(Path(path_lama).read_text(encoding='utf-8')).get('features', []):
        nama = re.sub(r'^Resor?t?\s+', '', str(f['properties'].get('NAME') or f['properties'].get('Nama') or '')).strip()
        nama = {'Doro Ncanga': 'Doroncanga'}.get(nama, nama)
        lama.append((nama, shapely.make_valid(ubah(shape(f['geometry']), KE_UTM))))
    out = {}
    for r in wilayah.resor:
        baris = [[n, round(g.intersection(r['g']).area / 1e4, 1)] for n, g in lama]
        out[r['id']] = sorted([b for b in baris if b[1] >= 1], key=lambda b: -b[1])
    return out


def olah_jalur(gj, wilayah, grid):
    """Panjang jalur per resor (km), sel grid yang dilalui jalur, dan panjang total."""
    km = collections.Counter()
    terjamah = set()
    total = 0.0
    for f in gj.get('features', []):
        if not f.get('geometry'):
            continue
        g = ubah(shape(f['geometry']), KE_UTM)
        total += g.length
        for r in wilayah.resor:
            if r['g'].intersects(g):
                km[r['id']] += g.intersection(r['g']).length / 1000
        for i in grid.tree.query(g, predicate='intersects'):
            s = grid.sel[int(i)]
            if g.intersection(s['g']).length >= JALUR_MIN_M:
                terjamah.add(s['id'])
    return km, terjamah, total / 1000


# ---------------------------------------------------------------- penilaian
def kelas_persen(p):
    """Skala lingkup/keparahan Conservation Standards: 71–100% sangat tinggi, 31–70% tinggi, 11–30% sedang, 1–10% rendah."""
    if not p or p <= 0:
        return 0
    return 4 if p > 70 else 3 if p > 30 else 2 if p > 10 else 1


def rangkum(nilai):
    """Rangkuman peringkat (Miradi): aturan 3-5-7 (3 Tinggi = 1 Sangat tinggi, 5 Sedang = 1 Tinggi, 7 Rendah = 1 Sedang)
    dan aturan 2-prime (butuh dua peringkat setara untuk mencapai satu tingkat; satu peringkat tertinggi = satu tingkat di bawahnya)."""
    nilai = [v for v in nilai if v]
    if not nilai:
        return 0
    c = collections.Counter(nilai)
    c2 = c[2] + c[1] // 7
    c3 = c[3] + c2 // 5
    c4 = c[4] + c3 // 3
    if c4 >= 2:
        terbaik = 4
    elif c[4] + c3 >= 2:
        terbaik = 3
    elif c[4] + c[3] + c2 >= 2:
        terbaik = 2
    else:
        terbaik = 1
    return max(terbaik, max(nilai) - 1, 1)


def skor_lq(v):
    return 4 if v >= 1.2 else 3 if v >= 1.0 else 2 if v >= 0.8 else 1


def tingkat_skor(s):
    return 1 if s < 1.75 else 2 if s < 2.5 else 3 if s < 3.25 else 4


def jenis_kajian(teks):
    t = teks.lower()
    if 'kebakaran' in t:
        return 'karhut'
    if 'buru' in t:
        return 'buru'
    if 'rambah' in t:
        return 'rambah'
    if 'tebang' in t or 'balak' in t:
        return 'kayu'
    if 'pendaki' in t or 'ilegal' in t:
        return 'tanpaizin'
    if 'ternak' in t or 'gembala' in t:
        return 'ternak'
    return None


def jenis_temuan(o):
    """(jenis, indikasi). Indikasi = bukti tidak langsung (camp, alat kerja, pelaku)."""
    c0, c1, r = o['c0'], o['c1'], o['r']
    if c0 == 'Spesies invasif':
        return 'invasif', False
    if c0 != 'Aktivitas Manusia':
        return None, False
    if c1 in SUB_ANCAMAN:
        return SUB_ANCAMAN[c1], False
    teks = f"{r.get('Keterangan', '')} {r.get('Tipe temuan', '')}".lower()
    if c1 == 'Pelaku':
        return ('tanpaizin', False) if re.search(r'pengunjung|pendaki', teks) else ('indikasi', True)
    if c1 == 'Alat Kerja dan Transportasi':
        if re.search(r'pendak|jalur\s+ilegal', teks):
            return 'tanpaizin', True
        if 'pemburu' in teks and 'madu' not in teks:
            return 'buru', True
        return 'indikasi', True
    return 'lain', False


def ya(v):
    return str(v or '').strip().lower() in ('ya', 'y', 'yes', 'true')


def aktif(o):
    r = o['r']
    return hkey(r.get('Keaktifan')) == 'aktif' or hkey(r.get('Tipe temuan')) == 'masihterbakar'


def ha_garapan(t):
    return sum(angka(o['r'].get('Jumlah')) or 0 for o in t
               if hkey(o['r'].get('Satuan')) == 'hektar' and aktif(o) and hkey(o['r'].get('Pelanggaran')) != 'bukan')


def rincian(j, t):
    """Ringkasan isi temuan tanpa nama orang."""
    r = [o['r'] for o in t]
    if not t:
        return ''
    if j == 'karhut':
        api = sum(1 for x in r if hkey(x.get('Tipe temuan')) == 'masihterbakar')
        veg = collections.Counter()
        for x in r:
            v = str(x.get('Vegetasi Terdampak') or '').lower()
            if HUTAN.search(v):
                veg['hutan/pegunungan'] += 1
            elif re.search(r'sa[bv]ana|padang|rumput|alang', v):
                veg['savana/padang rumput'] += 1
        bagian = [f'{api} kejadian masih menyala saat ditemukan'] if api else []
        if veg:
            bagian.append('vegetasi: ' + ', '.join(f'{k} ({n})' for k, n in veg.most_common()))
        manusia = sum(1 for x in r if hkey(x.get('Penyebab Kebakaran')) == 'nonalami')
        if manusia:
            bagian.append(f'{manusia} disebabkan manusia')
        return '; '.join(bagian)
    if j == 'rambah':
        ha = ha_garapan(t)
        modus = collections.Counter(str(x.get('Modus penggunaan kawasan') or '').strip().lower() for x in r)
        modus.pop('', None)
        bagian = [f'{fmt(ha, 1)} ha garapan aktif'] if ha else []
        if modus:
            bagian.append('modus: ' + ', '.join(m for m, _ in modus.most_common(3)))
        return '; '.join(bagian)
    if j == 'buru':
        alat = collections.Counter(tipe_teks(x.get('Tipe temuan')) for x in r if x.get('Tipe temuan'))
        sasaran = collections.Counter(nama_jenis(pisah_jenis(x.get('Jenis satwa'))) for x in r if x.get('Jenis satwa'))
        jerat = sum(angka(x.get('Jumlah')) or 0 for x in r if 'jerat' in hkey(x.get('Tipe temuan')))
        bagian = []
        if jerat:
            bagian.append(f'{fmt(jerat)} jerat dimusnahkan/didata')
        if alat:
            bagian.append('temuan: ' + ', '.join(a for a, _ in alat.most_common(3)))
        if sasaran:
            bagian.append('sasaran: ' + ', '.join(s for s, _ in sasaran.most_common(3)))
        return '; '.join(bagian)
    if j == 'kayu':
        tipe = collections.Counter(tipe_teks(x.get('Tipe temuan')) for x in r if x.get('Tipe temuan'))
        jenis = collections.Counter(nama_jenis(pisah_jenis(x.get('Jenis tumbuhan'))) for x in r if x.get('Jenis tumbuhan'))
        bagian = ['temuan: ' + ', '.join(a for a, _ in tipe.most_common(3))] if tipe else []
        if jenis:
            bagian.append('jenis: ' + ', '.join(s for s, _ in jenis.most_common(3)))
        return '; '.join(bagian)
    if j == 'invasif':
        return 'jenis: ' + ', '.join(sorted({nama_invasif(x.get('Jenis tumbuhan'))[0] for x in r if x.get('Jenis tumbuhan')}))
    if j == 'tanpaizin':
        org = sum(angka(x.get('jumlahpelaku') or x.get('Jumlah')) or 0 for x in r if not re.search(r'gubuk|camp', str(x.get('Tipe temuan')), re.I))
        camp = sum(1 for x in r if re.search(r'gubuk|camp', str(x.get('Tipe temuan')), re.I))
        bagian = [f'{fmt(org)} orang diperiksa'] if org else []
        if camp:
            bagian.append(f'{camp} pos/camp di jalur tidak resmi')
        return '; '.join(bagian)
    if j == 'ternak':
        return f'{len(t)} lokasi ternak dilepas di dalam kawasan'
    if j == 'jalan':
        return ', '.join(sorted({tipe_teks(x.get('Tipe temuan')) for x in r if x.get('Tipe temuan')}))
    return ''


def ringkas(v, n=70):
    v = re.sub(r'\s*[\r\n]+\s*', ', ', str(v or '').strip())
    return v if len(v) <= n else v[:n].rsplit(' ', 1)[0].rstrip(',;') + '…'


def nama_invasif(v):
    k = hkey(v)
    if k in NAMA_INVASIF:
        return NAMA_INVASIF[k]
    sp = pisah_jenis(v)
    return nama_jenis(sp), sp['latin']


def nilai_ancaman(j, t, ctx):
    """Satu baris penilaian Miradi untuk jenis ancaman j di satu resor."""
    a = ANCAMAN[j]
    n = len(t)
    sel = {o['sel'] for o in t if o['sel']}
    hari, jamah = ctx['hari'], ctx['sel_terjamah']
    laju = n / hari * 10 if hari and n else None
    rata = ctx['laju_rata'].get(j)
    rasio = laju / rata if laju is not None and rata else None
    dari_kajian = j in ctx['kajian']
    terbakar = ctx['terbakar_pct'] if j == 'karhut' else None

    # Lingkup: bagian resor yang terdampak dalam 10 tahun.
    pct, dasar = None, ''
    if terbakar:
        pct, dasar = terbakar, f'{fmt(terbakar)}% luas resor terbakar sejak awal musim (delineasi)'
    if n and jamah >= MIN_SEL:
        p2 = 100 * len(sel) / jamah
        if pct is None or p2 > pct:
            pct, dasar = p2, f'temuan di {len(sel)} dari {jamah} sel grid 1 km yang dipatroli'
    lingkup = kelas_persen(pct)
    if n and not lingkup:
        lingkup, dasar = 1, 'ada temuan, tetapi sel yang dipatroli terlalu sedikit untuk menghitung sebaran'
    if dari_kajian and lingkup < 2:
        lingkup = 2
        dasar = (dasar + '; dinaikkan ke Sedang karena' if dasar else 'belum ada temuan pada periode ini; Sedang karena') + \
            ' tercantum sebagai ancaman utama resor dalam Laporan Kajian (data gangguan 2021–2026)'
    if not lingkup:
        return None

    # Keparahan: tingkat kerusakan di areal terdampak.
    kep, alasan = a['keparahan'], [a['alasan_keparahan']]
    pulih, alasan_pulih = a['pulih'], a['alasan_pulih']
    if j == 'kayu' and n and not any(KAYU_BULAT.search(str(o['r'].get('Tipe temuan'))) for o in t):
        kep, alasan = 1, ['temuan berupa kayu bakar']
    if j == 'karhut':
        if terbakar and terbakar >= 30:
            kep += 1
            alasan.append(f'{fmt(terbakar)}% luas resor terbakar musim ini')
        veg = [str(o['r'].get('Vegetasi Terdampak') or '') for o in t]
        hutan = sorted({ringkas(v) for v in veg if HUTAN.search(v)})
        if hutan:
            kep += 1
            alasan.append('api masuk ekosistem hutan/pegunungan (' + '; '.join(hutan[:2]) + ')')
            pulih, alasan_pulih = 3, 'hutan pamah/pegunungan yang terbakar butuh 21–100 tahun untuk pulih'
    if j == 'rambah':
        ha = ha_garapan(t)
        if ha >= 10:
            kep += 1
            alasan.append(f'{fmt(ha, 1)} ha garapan aktif berstatus pelanggaran')
    if j == 'buru':
        sasaran = set()
        for o in t:
            sp = pisah_jenis(o['r'].get('Jenis satwa'))
            st = ctx['status'].get(sp['latin'], {})
            if sp['latin'] in ctx['kunci_latin'] or st.get('dilindungi'):
                sasaran.add(nama_jenis(sp))
        if sasaran:
            kep += 1
            alasan.append('menyasar satwa kunci/dilindungi (' + ', '.join(sorted(sasaran)) + ')')
    if rasio is not None and rasio >= 2 and n >= 3:
        kep += 1
        alasan.append(f'laju temuan {fmt(rasio, 1)}× rata-rata TN')
    if not n:
        alasan = [a['alasan_keparahan'] + ' (nilai bawaan; belum ada temuan SMART pada periode ini)']
    kep = min(kep, 4)

    mag = MAGNITUDO[kep][lingkup]
    sumber = (['SMART'] if n else []) + (['delineasi'] if terbakar else []) + (['Kajian'] if dari_kajian else [])
    return {
        'id': j, 'temuan': n, 'indikasi': sum(1 for o in t if o['indikasi']), 'sel': len(sel),
        'laju': bulat(laju, 2), 'rasio': bulat(rasio, 2),
        'lingkup': {'nilai': lingkup, 'pct': bulat(pct), 'dasar': dasar},
        'keparahan': {'nilai': kep, 'alasan': alasan},
        'ketakpulihan': {'nilai': pulih, 'alasan': alasan_pulih},
        'magnitudo': mag, 'peringkat': PERINGKAT[mag][pulih],
        'sumber': sumber, 'aktif': sum(1 for o in t if aktif(o)),
        'tindak_lanjut': sum(1 for o in t if ya(o['r'].get('Perlu tindak lanjut'))),
        'terakhir': max((o['day'] for o in t), default=''),
        'rincian': rincian(j, t),
    }


def analisis_satwa(obs, status, kunci):
    rek = [o for o in obs if o['c0'] == 'Satwa Liar']
    hitung, info, sel = collections.Counter(), {}, collections.defaultdict(set)
    for o in rek:
        v = str(o['r'].get('Jenis satwa') or '').strip()
        if not v or NO_SPECIES.match(v):
            continue
        sp = pisah_jenis(v)
        k = sp['latin'] or nama_jenis(sp).lower()
        hitung[k] += 1
        info.setdefault(k, sp)
        if o['sel']:
            sel[k].add(o['sel'])
    n, S = sum(hitung.values()), len(hitung)
    H = -sum(c / n * math.log(c / n) for c in hitung.values()) if n else 0.0

    def baris(k):
        st = status.get(k, {})
        return {'nama': nama_jenis(info[k]), 'ilmiah': info[k]['latin'], 'n': hitung[k],
                'dilindungi': bool(st.get('dilindungi')), 'iucn': st.get('iucn', '')}
    urut = sorted(hitung, key=lambda k: (-hitung[k], k))
    penting = [k for k in urut if status.get(k, {}).get('dilindungi') or status.get(k, {}).get('iucn') in ('CR', 'EN', 'VU')]
    return {
        'rekaman': len(rek), 'teridentifikasi': n, 'S': S, 'H': bulat(H, 2),
        'E': bulat(H / math.log(S), 2) if S > 1 else None,
        'teratas': [baris(k) for k in urut[:6]],
        'penting': [baris(k) for k in penting],
        'dilindungi': sum(1 for k in hitung if status.get(k, {}).get('dilindungi')),
        'terancam': sum(1 for k in hitung if status.get(k, {}).get('iucn') in ('CR', 'EN', 'VU')),
        'kunci': [{'nama': x['nama'], 'ilmiah': x['ilmiah'], 'rekaman': hitung.get(x['ilmiah'], 0),
                   'sel': len(sel.get(x['ilmiah'], ()))} for x in kunci],
        'belum_tercatat_status': sorted(info[k]['latin'] for k in hitung if info[k]['latin'] and k not in status),
    }


def analisis_tumbuhan(obs):
    rek = [o for o in obs if o['c0'] == 'Tumbuhan']
    hitung, info = collections.Counter(), {}
    for o in rek:
        v = str(o['r'].get('Jenis tumbuhan') or '').strip()
        if not v or NO_SPECIES.match(v):
            continue
        sp = pisah_jenis(v)
        k = sp['latin'] or nama_jenis(sp).lower()
        hitung[k] += 1
        info.setdefault(k, sp)
    urut = sorted(hitung, key=lambda k: (-hitung[k], k))
    return {'rekaman': len(rek), 'S': len(hitung),
            'teratas': [{'nama': nama_jenis(info[k]), 'ilmiah': info[k]['latin'], 'n': hitung[k]} for k in urut[:6]]}


def analisis_ekosistem(obs, sub):
    """Kelas ekosistem (Tipe Ekosistem) atau tutupan lahan (Tutupan Lahan) dari Ground Check."""
    c = collections.Counter()
    for o in obs:
        if o['c0'] != 'Ground Check' or o['c1'] != sub:
            continue
        r = o['r']
        v = (r.get('Klasifikasi 4') or r.get('Klasifikasi 3')) if sub == 'Tipe Ekosistem' else r.get('Klasifikasi 02')
        v = str(v or '').strip()
        if v:
            c[EKOSISTEM.get(hkey(v), v[:1].upper() + v[1:])] += 1
    c.pop('Lainnya', None)
    return [[k, n] for k, n in c.most_common()]


def fitur_alami(obs):
    out = collections.Counter()
    for o in obs:
        if o['c1'] == 'Fitur Alami':
            r = o['r']
            t = f"{r.get('Tipe temuan', '')} {r.get('Keterangan', '')}".lower()
            if re.search(r'goa|gua', t):
                out['goa'] += 1
            if re.search(r'terjun', t):
                out['air terjun'] += 1
            elif re.search(r'mata air|genangan|tampungan', t):
                out['sumber/genangan air'] += 1
            elif re.search(r'alur|sungai', t):
                out['alur sungai'] += 1
    return out


def kata(teks_list, pola):
    return [t for t in teks_list if re.search(pola, t, re.I)]


def nilai_potensi(res_k, lq, satwa, fitur, hhbk, kunci):
    """Tiga fungsi konservasi. Setiap indikator diberi skor 1–4; tingkat dari rata-rata skor."""
    pot = res_k['potensi']

    def ind(nama, nilai, skor, ket=''):
        return {'nama': nama, 'nilai': nilai, 'skor': skor, 'ket': ket}

    def pilar(indikator):
        s = sum(i['skor'] for i in indikator) / len(indikator)
        return {'skor': round(s, 2), 'tingkat': tingkat_skor(s), 'indikator': indikator}

    def ada(kajian, smart):
        return 4 if kajian and smart else 3 if kajian or smart else 1

    # Pengawetan keanekaragaman hayati
    teks = ' '.join(pot).lower()
    kunci_ada = []
    for x in kunci:
        nama0 = x['nama'].lower()
        di_kajian = nama0 in teks or 'satwa kunci' in teks and nama0 in teks
        rek = next((k['rekaman'] for k in satwa['kunci'] if k['ilmiah'] == x['ilmiah']), 0)
        if di_kajian or rek:
            kunci_ada.append(x['nama'])
    nk = len(kunci_ada)
    npenting = len(satwa['penting'])
    p1 = pilar([
        ind('Indeks lokasi kehati (LQ)', lq['kehati'], skor_lq(lq['kehati']),
            'sebaran areal bernilai konservasi tinggi (MaxEnt) dibanding luas resor'),
        ind('Satwa kunci dengan bukti keberadaan', ', '.join(kunci_ada) or 'belum ada', 4 if nk >= 2 else 3 if nk == 1 else 1,
            'Laporan Kajian atau rekaman SMART'),
        ind('Jenis satwa dilindungi/terancam tercatat', npenting, 4 if npenting >= 5 else 3 if npenting >= 3 else 2 if npenting else 1,
            'Permen LHK P.106/2018 atau IUCN CR/EN/VU, patroli SMART'),
    ])
    # Perlindungan sistem penyangga kehidupan
    air_k = bool(kata(pot, r'sumber air|mata air'))
    air_s = bool(fitur.get('sumber/genangan air') or fitur.get('air terjun') or fitur.get('alur sungai'))
    geo_k = bool(kata(pot, r'geologi|kaldera|puncak'))
    geo_s = bool(fitur.get('goa'))
    p2 = pilar([
        ind('Indeks lokasi kondisi fisik (LQ)', lq['fisik'], skor_lq(lq['fisik']),
            'lereng curam dan elevasi tinggi: fungsi tata air dan pencegah erosi'),
        ind('Sumber air dan alur sungai', 'ada' if air_k or air_s else 'belum tercatat', ada(air_k, air_s),
            'Laporan Kajian dan fitur alami SMART'),
        ind('Fitur geologi dan bentang alam', 'ada' if geo_k or geo_s else 'belum tercatat', ada(geo_k, geo_s),
            'fitur pascaletusan 1815, kaldera, goa'),
    ])
    # Pemanfaatan secara lestari
    wis = kata(pot, r'wisata|pendakian|odtwa|sanctuary|pengamatan burung|air terjun')
    hhbk_k = bool(kata(pot, r'madu|hhbk'))
    p3 = pilar([
        ind('Indeks lokasi pelayanan wisata (LQ)', lq['wisata'], skor_lq(lq['wisata']),
            'jalur pendakian dan ODTWA dibobot jumlah pengunjung'),
        ind('Objek dan jalur wisata alam', len(wis), 4 if len(wis) >= 2 else 3 if wis else 1, 'Laporan Kajian'),
        ind('HHBK dan jasa lingkungan', 'ada' if hhbk_k or hhbk else 'belum tercatat', ada(hhbk_k, bool(hhbk)),
            'madu hutan (Laporan Kajian) dan temuan pengambilan HHBK (SMART)'),
    ])
    total = (p1['skor'] + p2['skor'] + p3['skor']) / 3
    return {'pengawetan': p1, 'perlindungan': p2, 'pemanfaatan': p3,
            'total': {'skor': round(total, 2), 'tingkat': tingkat_skor(total)}}


ARAHAN = {
    'karhut': 'Siaga kebakaran sebelum puncak kemarau (Juli–September): patroli pencegahan dan pemadaman dini di savana, sekat bakar di jalur rawan, dan penguatan MPA desa penyangga.',
    'karhut_hutan': 'Siaga kebakaran sebelum puncak kemarau (Juli–September), terutama di batas hutan pegunungan dan jalur pendakian: pemadaman dini, sekat bakar, dan penguatan MPA desa penyangga.',
    'rambah': 'Tuntaskan garapan aktif{ha} lewat patroli gabungan, penegasan batas, dan penyelesaian konflik tenurial atau kemitraan konservasi.',
    'buru': 'Sapu jerat terjadwal dan awasi jalur masuk pemburu{sasaran}, termasuk patroli malam pada musim berburu.',
    'kayu': 'Amankan jalur angkut kayu dan pohon bernilai tinggi bersama desa penyangga; tindak lanjuti setiap temuan pembalakan.',
    'ternak': 'Data ternak bertanda dan sepakati batas penggembalaan dengan kelompok ternak; cegah pembakaran untuk pakan.',
    'invasif': 'Petakan dan kendalikan tumbuhan invasif{jenis} sebelum menyebar ke savana dan areal pemulihan.',
    'tanpaizin': 'Awasi jalur pendakian tidak resmi serta perkuat layanan SIMAKSI dan sosialisasi kepada pendaki.',
    'jalan': 'Pantau dan tutup akses jalan tidak resmi yang membuka jalan bagi gangguan lain.',
    'tambang': 'Hentikan dan laporkan aktivitas penambangan untuk penegakan hukum.',
}
ARAHAN_KAJIAN = {  # ancaman tercatat di Laporan Kajian tetapi belum ada temuan SMART pada periode ini
    'rambah': 'Verifikasi perambahan yang tercatat di Laporan Kajian dengan patroli terarah (belum ada temuan SMART tahun ini) dan tegaskan batas di titik rawan.',
    'kayu': 'Verifikasi titik rawan pembalakan dari Laporan Kajian dengan patroli terarah (belum ada temuan SMART tahun ini).',
}


def susun_arahan(r):
    out = []
    anc = sorted(r['ancaman'], key=lambda a: (-a['peringkat'], URUT_ANCAMAN.index(a['id'])))

    def teks_ancaman(a):
        hutan = a['id'] == 'karhut' and any('hutan/pegunungan' in x for x in a['keparahan']['alasan'])
        t = ARAHAN['karhut_hutan' if hutan else a['id']]
        if not a['temuan'] and a['id'] in ARAHAN_KAJIAN:
            return ARAHAN_KAJIAN[a['id']]
        if a['id'] == 'buru':
            sasaran = re.search(r'sasaran: ([^;]+)', a['rincian'] or '')
            t = t.replace('{sasaran}', f' (sasaran tercatat: {sasaran.group(1)})' if sasaran else '')
        if a['id'] == 'rambah':
            ha = re.search(r'([\d.,]+) ha garapan', a['rincian'] or '')
            t = t.replace('{ha}', f' ({ha.group(1)} ha)' if ha else '')
        if a['id'] == 'invasif':
            t = t.replace('{jenis}', ' (' + a['rincian'].replace('jenis: ', '') + ')' if a['rincian'] else '')
        return t
    for a in anc:
        if a['peringkat'] >= 3:
            out.append(teks_ancaman(a))
    u = r['upaya']
    if u['cakupan_pct'] < 20 or u['hari_patroli'] < SEDIKIT_HARI:
        out.append(f"Perluas cakupan patroli: baru {fmt(u['cakupan_pct'])}% sel grid resor terjamah dalam "
                   f"{u['hari_patroli']} hari patroli. Utamakan sel yang belum pernah dikunjungi agar penilaian tidak lagi indikatif.")
    for a in anc:
        if a['peringkat'] == 2:
            out.append(teks_ancaman(a))
    pot = r['potensi']
    if pot['pengawetan']['tingkat'] >= 3:
        kunci = pot['pengawetan']['indikator'][1]['nilai']
        out.append(f'Pantau populasi satwa kunci ({kunci}) dengan metode baku, misalnya transek atau titik hitung, sebagai dasar tren.')
    if pot['pemanfaatan']['tingkat'] >= 3:
        ind = pot['pemanfaatan']['indikator']
        bentuk = (['wisata alam'] if ind[1]['skor'] >= 3 else []) + (['madu hutan'] if ind[2]['skor'] >= 3 else [])
        out.append('Kembangkan pemanfaatan lestari' + (f" ({' dan '.join(bentuk)})" if bentuk else '') +
                   ' dengan pengaturan daya dukung dan keterlibatan desa penyangga.')
    return out[:4]


# ---------------------------------------------------------------- olah utama
def olah(args, log=print):
    kajian = json.loads(Path(args.kajian).read_text(encoding='utf-8'))
    batas = json.loads(Path(args.batas).read_text(encoding='utf-8'))
    smart = Path(args.smart)
    wilayah = Wilayah(batas, kajian)
    grid = Grid(json.loads((smart / 'assets/grid.geojson').read_text(encoding='utf-8')), wilayah)
    status = muat_status(smart / 'assets/status-spesies.js')
    asal = asal_wilayah(wilayah, smart / 'assets/resor.geojson')
    kunci = kajian['kawasan']['satwa_kunci']['jenis']
    kunci_latin = {x['ilmiah'] for x in kunci}

    obs, cfg, info_smart = muat_smart(smart, pakai_sheet=not args.tanpa_sheet, log=log)
    tahun = cfg['TAHUN_AWAL'] or dt.date.today().year
    dipakai, tanpa_koordinat, luar = [], 0, 0
    for o in obs:
        if not o['d'] or o['d'].year < tahun:
            continue
        if o['lon'] is None or o['lat'] is None:
            tanpa_koordinat += 1
            continue
        p = shapely.Point(*KE_UTM.transform(o['lon'], o['lat']))
        o['resor'], o['letak'], o['jarak'], o['terdekat'] = wilayah.letak(p)
        o['sel'] = grid.di(p)
        o['jenis'], o['indikasi'] = jenis_temuan(o)
        o['p'] = p
        if o['resor'] is None:
            luar += 1
        dipakai.append(o)

    jalur = baca_json(smart / (cfg['JALUR_PATROLI'] or 'data/jalur-patroli.geojson'))
    km, terjamah_jalur, km_total = olah_jalur(jalur, wilayah, grid)
    terjamah = set(terjamah_jalur) | {o['sel'] for o in dipakai if o['resor'] and o['sel']}

    terbakar, info_terbakar = None, {'tersedia': False}
    try:
        gj = baca_json(args.terbakar)
        geo = [shapely.make_valid(ubah(shape(f['geometry']), KE_UTM)) for f in gj.get('features', []) if f.get('geometry')]
        terbakar = shapely.union_all(geo) if geo else None
        info_terbakar['tersedia'] = terbakar is not None
        try:
            st = baca_json(args.status_terbakar)
            info_terbakar.update({'tanggal': st.get('tanggal'), 'awal_musim': st.get('awal_musim'),
                                  'jumlah_delineasi': st.get('jumlah_delineasi')})
        except Exception as e:
            log(f'Status areal terbakar tidak terbaca: {e}')
    except Exception as e:
        log(f'Areal terbakar tidak terbaca: {e}')

    per = {r['id']: [o for o in dipakai if o['resor'] == r['id']] for r in wilayah.resor}
    hari = {k: len({o['day'] for o in v}) for k, v in per.items()}
    jenis_rated = [j for j in URUT_ANCAMAN]
    total_hari = sum(hari.values())
    laju_rata = {}
    for j in jenis_rated:
        n = sum(1 for v in per.values() for o in v if o['jenis'] == j)
        laju_rata[j] = n / total_hari * 10 if total_hari else None

    sel_resor = collections.defaultdict(set)
    for s in grid.sel:
        sel_resor[s['resor']].add(s['id'])
    kajian_resor = {r['id']: r for r in kajian['resor']}
    zon_total = {k: sum(r['zonation'][k] for r in kajian['resor']) for k in ('kehati', 'fisik', 'wisata', 'gangguan')}
    luas_total = sum(r['luas_ha'] for r in kajian['resor'])

    hasil, fitur_peta = [], []
    bulan_semua = sorted({o['day'][:7] for o in dipakai})
    if bulan_semua:
        y, m = map(int, bulan_semua[0].split('-'))
        y1, m1 = map(int, bulan_semua[-1].split('-'))
        bulan_semua = []
        while (y, m) <= (y1, m1):
            bulan_semua.append(f'{y}-{m:02d}')
            y, m = (y + 1, 1) if m == 12 else (y, m + 1)

    for rw in wilayah.resor:
        rid, k = rw['id'], kajian_resor[rw['id']]
        v = per[rid]
        jamah = len(sel_resor[rid] & terjamah)
        cakupan = 100 * jamah / len(sel_resor[rid]) if sel_resor[rid] else 0
        ha_terbakar = terbakar.intersection(rw['g']).area / 1e4 if terbakar is not None else None
        pct_terbakar = 100 * ha_terbakar / (rw['g'].area / 1e4) if ha_terbakar is not None else None
        temuan = collections.defaultdict(list)
        for o in v:
            if o['jenis']:
                temuan[o['jenis']].append(o)
        ctx = {'hari': hari[rid], 'sel_terjamah': jamah, 'laju_rata': laju_rata,
               'kajian': {j for j in map(jenis_kajian, k['ancaman']) if j}, 'terbakar_pct': pct_terbakar,
               'status': status, 'kunci_latin': kunci_latin}
        ancaman = []
        for j in jenis_rated:
            if j == 'karhut' or temuan.get(j) or j in ctx['kajian']:
                a = nilai_ancaman(j, temuan.get(j, []), ctx)
                if a:
                    ancaman.append(a)
        ancaman.sort(key=lambda a: (-a['peringkat'], -a['magnitudo'], URUT_ANCAMAN.index(a['id'])))
        status_ancaman = rangkum([a['peringkat'] for a in ancaman])

        lq = {c: round((k['zonation'][c] / zon_total[c]) / (k['luas_ha'] / luas_total), 3) for c in zon_total}
        satwa = analisis_satwa(v, status, kunci)
        fit = fitur_alami(v)
        hhbk = len(temuan.get('hhbk', []))
        potensi = nilai_potensi(k, lq, satwa, fit, hhbk, kunci)
        penyuluhan = [o for o in dipakai if o['c0'] == 'Penyuluhan dan Pemberdayaan Masyarakat'
                      and (o['resor'] == rid or (o['resor'] is None and o['terdekat'] == rid and o['jarak'] <= DESA_M))]
        bln = collections.Counter(o['day'][:7] for o in v)
        bln_a = collections.Counter(o['day'][:7] for o in v if o['jenis'] in ANCAMAN)
        terbaru = collections.Counter((o['day'], o['jenis'], tipe_teks(o['r'].get('Tipe temuan')) or o['c1'], aktif(o))
                                      for o in v if o['jenis'] in ANCAMAN)
        terbaru = sorted(terbaru.items(), key=lambda x: (x[0][0], x[1]), reverse=True)[:6]
        upaya = {
            'hari_patroli': hari[rid], 'km_jalur': bulat(km.get(rid, 0)), 'sel': len(sel_resor[rid]),
            'sel_terjamah': jamah, 'cakupan_pct': bulat(cakupan), 'observasi': len(v),
            'observasi_tepi': sum(1 for o in v if o['letak'] == 'tepi'),
            'indikatif': hari[rid] < SEDIKIT_HARI or cakupan < SEDIKIT_CAKUPAN,
        }
        r = {
            'id': rid, 'kode': rw['kode'], 'nama': rw['nama'], 'sptn': rw['sptn'], 'luas_ha': rw['luas_ha'],
            'asal': asal.get(rid, []), 'upaya': upaya,
            'kategori': [[c, n] for c, n in collections.Counter(o['c0'] for o in v).most_common()],
            'bulanan': [[b, bln.get(b, 0), bln_a.get(b, 0)] for b in bulan_semua],
            'terbakar': {'ha': bulat(ha_terbakar), 'pct': bulat(pct_terbakar)} if ha_terbakar is not None else None,
            'ancaman': ancaman, 'status_ancaman': status_ancaman,
            'temuan_terbaru': [{'tanggal': d, 'jenis': j, 'tipe': t, 'aktif': ak, 'n': n}
                               for (d, j, t, ak), n in terbaru],
            'lq': lq, 'satwa': satwa, 'tumbuhan': analisis_tumbuhan(v),
            'ekosistem': analisis_ekosistem(v, 'Tipe Ekosistem'), 'tutupan': analisis_ekosistem(v, 'Tutupan Lahan'),
            'fitur_alami': [[x, n] for x, n in fit.most_common()],
            'invasif': sorted({nama_invasif(o['r'].get('Jenis tumbuhan'))[0] for o in temuan.get('invasif', [])}),
            'hhbk': hhbk, 'indikasi': len(temuan.get('indikasi', [])),
            'masyarakat': {'kegiatan': len(penyuluhan),
                           'jenis': [[c, n] for c, n in collections.Counter(o['c1'] for o in penyuluhan if o['c1']).most_common()]},
            'potensi': potensi,
        }
        puncak = max((a['peringkat'] for a in ancaman), default=0)
        r['ancaman_utama'] = [a['id'] for a in ancaman if a['peringkat'] == puncak and puncak >= 2]
        r['arahan'] = susun_arahan(r)
        hasil.append(r)

        # Peta: titik ancaman, pemanfaatan, fitur alami (tanpa nama orang).
        for o in v:
            props = None
            if o['jenis'] in ANCAMAN or o['jenis'] == 'indikasi':
                jumlah = angka(o['r'].get('Jumlah'))
                satuan = str(o['r'].get('Satuan') or '').strip().lower()
                props = {'lapisan': 'ancaman', 'jenis': o['jenis'], 'tipe': tipe_teks(o['r'].get('Tipe temuan')) or o['c1'],
                         'jumlah': f'{fmt(jumlah, 2).rstrip("0").rstrip(",")} {satuan}'.strip() if jumlah and satuan not in ('', 'lainnya') else '',
                         'aktif': aktif(o), 'indikasi': o['indikasi']}
            elif o['jenis'] == 'hhbk':
                props = {'lapisan': 'pemanfaatan', 'tipe': tipe_teks(o['r'].get('Tipe temuan')) or 'HHBK'}
            elif o['c1'] == 'Fitur Alami':
                props = {'lapisan': 'fitur', 'tipe': tipe_teks(o['r'].get('Tipe temuan')) or 'fitur alami'}
            if props:
                props.update({'tanggal': o['day'], 'resor': rid})
                fitur_peta.append({'type': 'Feature', 'properties': props,
                                   'geometry': {'type': 'Point', 'coordinates': [round(o['lon'], 5), round(o['lat'], 5)]}})

    # Sel satwa kunci (lokasi disamarkan ke sel grid 1 km).
    for x in kunci:
        sel = collections.Counter(o['sel'] for o in dipakai if o['resor'] and o['sel'] and o['c0'] == 'Satwa Liar'
                                  and pisah_jenis(o['r'].get('Jenis satwa'))['latin'] == x['ilmiah'])
        for sid, n in sorted(sel.items()):
            s = grid.by_id[sid]
            g = shape(s['geo'])
            fitur_peta.append({'type': 'Feature', 'properties': {'lapisan': 'satwa_kunci', 'jenis': x['nama'], 'ilmiah': x['ilmiah'],
                                                                 'rekaman': n, 'resor': s['resor']},
                               'geometry': shapely.geometry.mapping(shapely.set_precision(g, 1e-5))})
    fitur_peta.sort(key=lambda f: (f['properties']['lapisan'], f['properties'].get('tanggal', ''), f['properties'].get('jenis', ''),
                                   json.dumps(f['geometry']['coordinates'])))
    # Cakupan patroli: sel grid 1 km yang dilalui jalur atau berisi temuan (pengganti garis jalur yang terlalu berat).
    obs_sel = collections.Counter(o['sel'] for o in dipakai if o['resor'] and o['sel'])
    for sid in sorted(terjamah, key=lambda x: (len(x), x)):
        s = grid.by_id[sid]
        fitur_peta.append({'type': 'Feature', 'properties': {'lapisan': 'sel_patroli', 'resor': s['resor'],
                                                             'observasi': obs_sel.get(sid, 0), 'jalur': sid in terjamah_jalur},
                           'geometry': shapely.geometry.mapping(shapely.set_precision(shape(s['geo']), 1e-5))})

    # Ringkasan kawasan.
    dalam = [o for o in dipakai if o['resor']]
    per_jenis = []
    for j in URUT_ANCAMAN:
        nilai = [a['peringkat'] for r in hasil for a in r['ancaman'] if a['id'] == j]
        if nilai:
            per_jenis.append({'id': j, 'peringkat': rangkum(nilai), 'resor': len(nilai),
                              'temuan': sum(a['temuan'] for r in hasil for a in r['ancaman'] if a['id'] == j)})
    per_jenis.sort(key=lambda a: (-a['peringkat'], URUT_ANCAMAN.index(a['id'])))
    satwa_tn = analisis_satwa(dalam, status, kunci)
    ha_tb = sum((r['terbakar'] or {}).get('ha') or 0 for r in hasil) if terbakar is not None else None
    sel_tn = sum(len(s) for s in sel_resor.values())
    jamah_tn = sum(len(sel_resor[k] & terjamah) for k in sel_resor)
    tn = {
        'luas_ha': round(luas_total, 2), 'observasi': len(dalam), 'hari_patroli': len({o['day'] for o in dalam}),
        'km_jalur': bulat(sum(km.values())), 'sel': sel_tn, 'sel_terjamah': jamah_tn,
        'cakupan_pct': bulat(100 * jamah_tn / sel_tn if sel_tn else 0),
        'terbakar': {'ha': bulat(ha_tb), 'pct': bulat(100 * ha_tb / luas_total)} if ha_tb is not None else None,
        'ancaman': per_jenis, 'status_ancaman': rangkum([a['peringkat'] for a in per_jenis]),
        'laju_rata': {j: bulat(v, 2) for j, v in laju_rata.items() if v},
        'satwa': {k: satwa_tn[k] for k in ('rekaman', 'S', 'H', 'E', 'dilindungi', 'terancam', 'kunci', 'penting')},
        'belum_tercatat_status': satwa_tn['belum_tercatat_status'],
    }
    tanggal_obs = sorted(o['day'] for o in dipakai)
    out = {
        'versi': 1,
        'diperbarui': dt.datetime.now(WITA).isoformat(timespec='minutes'),
        'periode': {'awal': tanggal_obs[0] if tanggal_obs else None, 'akhir': tanggal_obs[-1] if tanggal_obs else None, 'tahun_awal': tahun},
        'sumber': {
            'smart': dict(info_smart, observasi=len(obs), dipakai=len(dipakai), dalam_resor=len(dalam), luar_kawasan=luar,
                          tanpa_koordinat=tanpa_koordinat),
            'jalur': {'leg': len(jalur.get('features', [])), 'km_total': bulat(km_total), 'km_dalam': bulat(sum(km.values()))},
            'terbakar': info_terbakar,
            'kajian': kajian['sumber']['judul'] + ', ' + kajian['sumber']['tanggal'],
        },
        'jenis_ancaman': [{'id': j, 'nama': a['nama'], 'iucn': a['iucn'], 'kelas': a['kelas']} for j, a in ANCAMAN.items()],
        'tn': tn,
        'resor': hasil,
    }
    peta = {'type': 'FeatureCollection', 'name': 'Peta tab Resor Pengelolaan',
            'keterangan': 'Titik ancaman, pemanfaatan, dan fitur alami dari SMART; satwa kunci disamarkan ke sel 1 km; cakupan patroli per sel 1 km.',
            'features': fitur_peta}
    return out, peta


def tulis(path, data, kompak=False, abaikan=('diperbarui',)):
    """Tulis hanya bila isi (tanpa cap waktu) berubah. Kembalikan True bila file ditulis."""
    path = Path(path)
    teks = json.dumps(data, ensure_ascii=False, separators=(',', ':')) if kompak else json.dumps(data, ensure_ascii=False, indent=1)
    if path.exists():
        try:
            lama = json.loads(path.read_text(encoding='utf-8'))
            baru = json.loads(teks)
            if isinstance(lama, dict) and {k: v for k, v in lama.items() if k not in abaikan} == {k: v for k, v in baru.items() if k not in abaikan}:
                return False
        except ValueError:
            pass
    path.write_text(teks + '\n', encoding='utf-8')
    return True


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--smart', required=True, help='folder repo Dashboard_SMART_TNGunungTambora')
    ap.add_argument('--kajian', default=AKAR / 'data/resor/kajian_2026.json')
    ap.add_argument('--batas', default=AKAR / 'data/resor/batas_resor_2026.geojson')
    ap.add_argument('--terbakar', default=URL_TERBAKAR, help='GeoJSON delineasi areal terbakar (path atau URL)')
    ap.add_argument('--status-terbakar', default=URL_STATUS_TERBAKAR, help='status areal terbakar (path atau URL)')
    ap.add_argument('--keluar', default=AKAR / 'data/resor')
    ap.add_argument('--tanpa-sheet', action='store_true', help='jangan unduh Google Sheets; pakai data.csv')
    args = ap.parse_args(argv)
    out, peta = olah(args, log=lambda s: print(s, file=sys.stderr))
    keluar = Path(args.keluar)
    a = tulis(keluar / 'analisis.json', out)
    b = tulis(keluar / 'peta.geojson', peta, kompak=True)
    s = out['sumber']['smart']
    print(f"{s['dipakai']} observasi ({s['drive']} Drive + {s['sheet']} {s['sheet_dari']}), {s['dalam_resor']} di 7 resor; "
          f"periode {out['periode']['awal']} s.d. {out['periode']['akhir']}")
    for r in out['resor']:
        print(f"  {r['nama']:<12} ancaman {TINGKAT[r['status_ancaman']]:<13} potensi {TINGKAT[r['potensi']['total']['tingkat']]:<13} "
              f"hari {r['upaya']['hari_patroli']:>3}  cakupan {r['upaya']['cakupan_pct']:>5}%  "
              + ', '.join(f"{x['id']}={x['peringkat']}" for x in r['ancaman']))
    print('analisis.json', 'diperbarui' if a else 'tidak berubah', '| peta.geojson', 'diperbarui' if b else 'tidak berubah')


if __name__ == '__main__':
    main()
