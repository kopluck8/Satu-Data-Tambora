"""Uji kecil untuk aturan penilaian di olah_resor.py (jalankan: python -m pytest tools/resor)."""
import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import olah_resor as O  # noqa: E402


def test_kelas_persen_skala_conservation_standards():
    assert O.kelas_persen(None) == 0
    assert O.kelas_persen(0) == 0
    assert O.kelas_persen(0.5) == 1
    assert O.kelas_persen(10) == 1
    assert O.kelas_persen(10.1) == 2
    assert O.kelas_persen(30) == 2
    assert O.kelas_persen(55) == 3
    assert O.kelas_persen(70) == 3
    assert O.kelas_persen(71) == 4


def test_tabel_miradi():
    # lingkup x keparahan = nilai terkecil (tabel Miradi)
    for kep in range(1, 5):
        for ling in range(1, 5):
            assert O.MAGNITUDO[kep][ling] == min(kep, ling)
    # ketakpulihan sangat tinggi menaikkan satu tingkat, rendah menurunkan satu tingkat
    assert O.PERINGKAT[3][2] == 3
    assert O.PERINGKAT[3][4] == 4
    assert O.PERINGKAT[3][1] == 2
    assert O.PERINGKAT[1][4] == 2
    assert O.PERINGKAT[4][1] == 3


def test_rangkuman_3_5_7_dan_2_prime():
    assert O.rangkum([]) == 0
    assert O.rangkum([1]) == 1
    assert O.rangkum([4]) == 3          # satu Sangat tinggi -> Tinggi
    assert O.rangkum([4, 4]) == 4       # dua Sangat tinggi -> Sangat tinggi
    assert O.rangkum([3]) == 2
    assert O.rangkum([3, 3]) == 3
    assert O.rangkum([3, 2, 2, 1, 1]) == 2
    assert O.rangkum([3, 3, 3, 4]) == 4  # 3 Tinggi = 1 Sangat tinggi, ditambah satu Sangat tinggi
    assert O.rangkum([2] * 5 + [3]) == 3  # 5 Sedang = 1 Tinggi
    assert O.rangkum([1] * 7 + [2]) == 2  # 7 Rendah = 1 Sedang


def test_tingkat_dan_lq():
    assert O.tingkat_skor(1.0) == 1
    assert O.tingkat_skor(1.75) == 2
    assert O.tingkat_skor(2.5) == 3
    assert O.tingkat_skor(3.25) == 4
    assert [O.skor_lq(x) for x in (0.7, 0.8, 1.0, 1.2)] == [1, 2, 3, 4]


def test_tanggal_dan_jam_seperti_dashboard_smart():
    assert O.tanggal('2026-02-03') == dt.date(2026, 2, 3)
    assert O.tanggal('Feb 19, 2026') == dt.date(2026, 2, 19)
    assert O.tanggal('3/10/2026') == dt.date(2026, 3, 10)           # bulan/hari (lokal AS)
    assert O.tanggal('10/3/2026', hari_dulu=True) == dt.date(2026, 3, 10)
    assert O.tanggal('25/3/2026') == dt.date(2026, 3, 25)           # hari > 12 dibalik otomatis
    assert O.hari_di_depan(['25/3/2026', '1/4/2026']) is True
    assert O.hms('7:05 PM') == '19:05:00'
    assert O.hms('07.05.09') == '07:05:09'
    assert O.hms('') == ''


def test_pisah_jenis_dan_kunci_waypoint():
    assert O.pisah_jenis('Rusa Timor - Rusa timorensis') == {'lokal': '', 'indo': 'Rusa Timor', 'latin': 'Rusa timorensis'}
    assert O.pisah_jenis('Katowi - - Palaquium amboinense')['latin'] == 'Palaquium amboinense'
    assert O.pisah_jenis('Kirik-kirik australia - Merops ornatus')['indo'] == 'Kirik-kirik australia'
    o = {'day': '2026-02-03', 'r': {'Waypoint Time': '7:05 AM'}, 'lon': 118.1, 'lat': -8.25}
    assert O.kunci_wp(o) == '2026-02-03 07:05:00 118.10000 -8.25000'


def test_jenis_temuan():
    def o(c0, c1, **r):
        return {'c0': c0, 'c1': c1, 'r': r}
    assert O.jenis_temuan(o('Aktivitas Manusia', 'Kebakaran Hutan dan Lahan')) == ('karhut', False)
    assert O.jenis_temuan(o('Spesies invasif', '')) == ('invasif', False)
    assert O.jenis_temuan(o('Aktivitas Manusia', 'Pelaku', **{'Tipe temuan': 'pengunjungtanpaizinwni'})) == ('tanpaizin', False)
    assert O.jenis_temuan(o('Aktivitas Manusia', 'Alat Kerja dan Transportasi', Keterangan='Dugaan Camp Pemburu')) == ('buru', True)
    assert O.jenis_temuan(o('Aktivitas Manusia', 'Alat Kerja dan Transportasi', Keterangan='camp pencari madu atau pemburu')) == ('indikasi', True)
    assert O.jenis_temuan(o('Satwa Liar', 'Perjumpaan Satwa')) == (None, False)
    assert O.jenis_kajian('Perambahan kawasan (sekitar Zona Khusus So Tompo)') == 'rambah'
    assert O.jenis_kajian('Pendaki ilegal') == 'tanpaizin'
