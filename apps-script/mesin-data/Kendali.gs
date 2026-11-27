/**
 * Mesin Data Satu Data Tambora - lembar kendali bawaan peta konsep 2027 (dibuat alat/buat_kendali.py; jangan diubah
 * dengan tangan, ubah lembarnya di spreadsheet lalu buat ulang berkas ini).
 *
 * Menu "1. Siapkan tab dan cek pengaturan" memakai isi ini bila Pengaturan VERSI_KENDALI berbeda dari VERSI_KENDALI
 * di bawah, jadi spreadsheet yang sudah terpasang tidak perlu dibuat ulang:
 *   - Rute, Induk, dan Petunjuk ditulis ulang (id_spreadsheet di Induk yang sudah diisi tetap);
 *   - Pengaturan: nilai yang sudah diisi tetap, kunci baru ditambahkan, kunci yang tidak dipakai lagi dihapus;
 *   - Sumber: alamat, aktif, dan akses_unduh yang sudah diisi tetap; nama, tab tujuan, induk, dan catatan diperbarui;
 *     sumber yang tidak dipakai lagi dihapus;
 *   - Label Data Model: label kategori dan atribut yang dihapus dari data model ikut dihapus.
 */

var VERSI_KENDALI = "2026-11-27";

var KENDALI = {
  Rute: [
    ["kategori_hkey", "nama_kategori", "penghubung", "tab_tujuan", "induk", "atribut", "syarat_jenis_kegiatan", "catatan", "atribut_lain"],
    ["aktivitasmanusia.pelaku.", "Aktivitas Manusia > Pelaku", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["aktivitasmanusia.penggunaankawasan.", "Aktivitas Manusia > Penggunaan Kawasan", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["aktivitasmanusia.pembalakan.", "Aktivitas Manusia > Pembalakan", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["aktivitasmanusia.perburuansatwa.", "Aktivitas Manusia > Perburuan Satwa", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["aktivitasmanusia.pengambilanhhbk.", "Aktivitas Manusia > Pengambilan HHBK", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["aktivitasmanusia.pertambangandanpengeboran.", "Aktivitas Manusia > Penambangan dan Pengeboran", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["aktivitasmanusia.alatkerjadantransportasi.", "Aktivitas Manusia > Alat Kerja dan Transportasi", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["aktivitasmanusia.pembuatanaksesjalan.", "Aktivitas Manusia > Pembuatan Akses Jalan", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["aktivitasmanusia.pengembalaanternak.", "Aktivitas Manusia > Penggembalaan Ternak", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["aktivitasmanusia.pencemaran.", "Aktivitas Manusia > Pencemaran", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["konflikmanusiadansatwa.informasidanresponkonflik.", "Konflik Manusia dan Satwa > Informasi dan Respon Konflik", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["konflikmanusiadansatwa.dampakkonflik.", "Konflik Manusia dan Satwa > Dampak Konflik", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["perdagangandankepemilikantsl.", "Perdagangan dan Kepemilikan TSL", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["pengelolaan.penyitaandanpenyerahantsl.", "Pengelolaan > Penyitaan dan Penyerahan TSL", "gangguan", "Rekap Temuan Gangguan Kawasan", "pp", "", "", "Tindakan dan tindak lanjut menjadi kolom di baris temuannya. Pulbaket tenurial = Penggunaan Kawasan (bidang) dan Pelaku (pengguna lahan). Nama pelaku hanya untuk akun admin.", ""],
    ["aktivitasmanusia.kebakaranhutandanlahan.", "Aktivitas Manusia > Kebakaran Hutan dan Lahan", "karhut", "Rekap Kejadian Kebakaran Hutan", "karhut", "", "", "Titik panas dan delineasi areal terbakar dicatat sebagai Kebakaran Hutan dan Lahan (sumber informasi, luas terbakar).", ""],
    ["pengelolaan.penanggulangankebakaran.", "Pengelolaan > Penanggulangan Kebakaran", "karhut", "Rekap Kejadian Kebakaran Hutan", "karhut", "", "", "Titik panas dan delineasi areal terbakar dicatat sebagai Kebakaran Hutan dan Lahan (sumber informasi, luas terbakar).", ""],
    ["satwaliar.perjumpaansatwa.", "Satwa Liar > Perjumpaan Satwa", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["satwaliar.jejaksatwa.", "Satwa Liar > Tanda Satwa", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["satwaliar.satwamati.", "Satwa Liar > Satwa Mati", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["surveykehati.surveyburungtitikhitung.", "Survey Kehati > Burung Metode Titik Hitung", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["surveykehati.surveytranseksatwa.", "Survey Kehati > Transek Satwa", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["surveykehati.cameratrapping.", "Survey Kehati > Camera Trapping", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["surveykehati.surveyherpetofauna.", "Survey Kehati > Survey Herpetofauna", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["surveykehati.surveyburungjalakabut.", "Survey Kehati > Burung Metode Jala Kabut", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["surveykehati.surveyserangga.", "Survey Kehati > Survey Serangga", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["surveykehati.pengamatanmigrasiburung.", "Survey Kehati > Pengamatan Migrasi Burung", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["pengelolaan.pelepasliarandantranslokasisatwaliar.", "Pengelolaan > Pelepasliaran dan Translokasi Satwa Liar", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["pengelolaan.tmbsanctuaryrusatimor.", "Pengelolaan > Pengelolaan Sanctuary Rusa Timor", "satwa", "Rekap Temuan Satwa", "kehati", "", "", "", ""],
    ["tumbuhan.", "Tumbuhan", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "", "", "", ""],
    ["surveykehati.plotvegetasi.semai2x2meter.", "Survey Kehati > Plot Vegetasi > Semai (2 x 2 meter)", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "", "", "", ""],
    ["surveykehati.plotvegetasi.pancang5x5meter.", "Survey Kehati > Plot Vegetasi > Pancang (5 x 5 meter)", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "", "", "", ""],
    ["surveykehati.plotvegetasi.tiang10x10meter.", "Survey Kehati > Plot Vegetasi > Tiang (10 x 10 meter)", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "", "", "", ""],
    ["surveykehati.plotvegetasi.pohon20x20meter.", "Survey Kehati > Plot Vegetasi > Pohon (20 x 20 meter)", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "", "", "", ""],
    ["surveykehati.fenologi.", "Survey Kehati > Fenologi", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "", "", "", ""],
    ["pengelolaan.tmbkoleksipersemaiandemplot.", "Pengelolaan > Koleksi, Persemaian, dan Demplot", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "", "", "", ""],
    ["pengelolaan.rehabilitasihutandanlahan.", "Pengelolaan > Rehabilitasi Hutan dan Lahan", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "", "", "", ""],
    ["pengelolaan.pembinaanhabitat.", "Pengelolaan > Pembinaan Habitat", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "", "", "", ""],
    ["spesiesinvasif.", "Spesies invasif", "invasif", "Rekap Spesies Invasif", "kehati", "", "", "", ""],
    ["metodeteknis.inventarisasijenisinvasif.keinvasifan.", "Survei Kehati Metode Teknis > Inventarisasi Jenis Asing Invasif > Penilaian Keinvasifan", "invasif", "Rekap Spesies Invasif", "kehati", "jenistumbuhan, tmbjenistumbuhan", "", "", "tidak"],
    ["groundcheck.tipeekosis.", "Ground Check > Tipe Ekosistem", "ekosistem", "Rekap Tipe Ekosistem dan Tutupan Lahan", "kehati", "", "", "", ""],
    ["groundcheck.tutupanlahan.", "Ground Check > Tutupan Lahan", "ekosistem", "Rekap Tipe Ekosistem dan Tutupan Lahan", "kehati", "", "", "", ""],
    ["sosialisasidananjangsana.sosialisasi.", "Penyuluhan dan Pemberdayaan Masyarakat > Sosialisasi", "penyuluhan", "Rekap Kegiatan Penyuluhan", "peny", "", "", "Kondisi kelompok binaan per tahun = Monev Kelompok Binaan.", ""],
    ["sosialisasidananjangsana.anjangsana.", "Penyuluhan dan Pemberdayaan Masyarakat > Anjangsana", "penyuluhan", "Rekap Kegiatan Penyuluhan", "peny", "", "", "Kondisi kelompok binaan per tahun = Monev Kelompok Binaan.", ""],
    ["sosialisasidananjangsana.tamboragoestoschool.", "Penyuluhan dan Pemberdayaan Masyarakat > Edukasi Konservasi (Tambora Goes To School dan lainnya)", "penyuluhan", "Rekap Kegiatan Penyuluhan", "peny", "", "", "Kondisi kelompok binaan per tahun = Monev Kelompok Binaan.", ""],
    ["sosialisasidananjangsana.identifikasipotensisosialbudaya.", "Penyuluhan dan Pemberdayaan Masyarakat > Identifikasi Potensi Sosial Budaya", "penyuluhan", "Rekap Kegiatan Penyuluhan", "peny", "", "", "Kondisi kelompok binaan per tahun = Monev Kelompok Binaan.", ""],
    ["sosialisasidananjangsana.pendampingankelompokbinaan.", "Penyuluhan dan Pemberdayaan Masyarakat > Pendampingan Kelompok Binaan", "penyuluhan", "Rekap Kegiatan Penyuluhan", "peny", "", "", "Kondisi kelompok binaan per tahun = Monev Kelompok Binaan.", ""],
    ["sosialisasidananjangsana.monevkelompokbinaan.", "Penyuluhan dan Pemberdayaan Masyarakat > Monev Kelompok Binaan", "penyuluhan", "Rekap Kegiatan Penyuluhan", "peny", "", "", "Kondisi kelompok binaan per tahun = Monev Kelompok Binaan.", ""],
    ["sosialisasidananjangsana.tmbkemitraankonservasi.", "Penyuluhan dan Pemberdayaan Masyarakat > Kemitraan dan Kesepakatan Konservasi", "penyuluhan", "Rekap Kegiatan Penyuluhan", "peny", "", "", "Kondisi kelompok binaan per tahun = Monev Kelompok Binaan.", ""],
    ["sosialisasidananjangsana.tmbpembentukankelompok.", "Penyuluhan dan Pemberdayaan Masyarakat > Pembentukan Kelompok dan Kader Konservasi", "penyuluhan", "Rekap Kegiatan Penyuluhan", "peny", "", "", "Kondisi kelompok binaan per tahun = Monev Kelompok Binaan.", ""],
    ["penjagaanjalurpendakiandanodtwa.pelayananpengunjungwisata.", "Penjagaan Jalur Pendakian dan ODTWA > Pelayanan Pengunjung Wisata", "kunjungan", "Rekap Kunjungan dan Pendakian", "wisata", "", "", "", ""],
    ["penjagaanjalurpendakiandanodtwa.penanganansampahpengunjung.", "Penjagaan Jalur Pendakian dan ODTWA > Penanganan Sampah Pengunjung", "sampah", "Rekap Sampah Pengunjung", "wisata", "", "", "", ""],
    ["fitur.infrastruktursaranaprasarana.", "Fitur > Infrastruktur/ Sarana dan Prasarana", "sarpras", "Rekap Sarana Prasarana, Pal Batas, dan Media Informasi", "fitur", "", "", "", ""],
    ["fitur.palbatas.", "Fitur > Pal Batas", "sarpras", "Rekap Sarana Prasarana, Pal Batas, dan Media Informasi", "fitur", "", "", "", ""],
    ["fitur.mediainformasi.", "Fitur > Media Informasi", "sarpras", "Rekap Sarana Prasarana, Pal Batas, dan Media Informasi", "fitur", "", "", "", ""],
    ["pengelolaan.pengelolaaninfrastruktur.", "Pengelolaan > Pengelolaan Infrastruktur", "sarpras", "Rekap Sarana Prasarana, Pal Batas, dan Media Informasi", "fitur", "", "", "", ""],
    ["pengelolaan.pengelolaanpalbatas.", "Pengelolaan > Pengelolaan Pal Batas", "sarpras", "Rekap Sarana Prasarana, Pal Batas, dan Media Informasi", "fitur", "", "", "", ""],
    ["pengelolaan.pengelolaanmediainformasi.", "Pengelolaan > Pengelolaan Media informasi", "sarpras", "Rekap Sarana Prasarana, Pal Batas, dan Media Informasi", "fitur", "", "", "", ""],
    ["fitur.fituralami.", "Fitur > Fitur Alami", "potensi", "Rekap Fitur Alami dan Potensi Kawasan", "fitur", "", "", "", ""],
    ["pemanfaatan.potensiair.", "Pemanfaatan > Potensi Air", "potensi", "Rekap Fitur Alami dan Potensi Kawasan", "fitur", "", "", "", ""],
    ["pemanfaatan.obyekwisata.", "Pemanfaatan > Obyek Wisata", "potensi", "Rekap Fitur Alami dan Potensi Kawasan", "fitur", "", "", "", ""],
    ["pemanfaatan.pemanfaatanjasalingkungan.", "Pemanfaatan > Pemanfaatan Jasa Lingkungan", "potensi", "Rekap Fitur Alami dan Potensi Kawasan", "fitur", "", "", "", ""],
    ["pemanfaatan.pemanfaatantumbuhandansatwaliar.", "Pemanfaatan > Pemanfaatan Tumbuhan dan Satwa Liar", "potensi", "Rekap Fitur Alami dan Potensi Kawasan", "fitur", "", "", "", ""],
    ["bencanaalam.", "Bencana Alam", "potensi", "Rekap Fitur Alami dan Potensi Kawasan", "fitur", "", "", "", ""],
    ["posisi.", "Posisi", "upaya", "Rekap Upaya Patroli (Titik dan Kegiatan RBM)", "rbm", "", "", "Dua lembar: per leg patroli (Rekap Upaya Patroli) dan per titik (posisi dan Kegiatan RBM). 1 kegiatan RBM = 1 patroli; form RBM 2026 dan register LPK PEH ikut sebagai upaya. Capaian RBM dihitung dari rekap ini terhadap Rencana RBM (lembar acuan).", ""],
    ["tmbkegiatanrbm.", "Kegiatan RBM", "upaya", "Rekap Upaya Patroli (Titik dan Kegiatan RBM)", "rbm", "", "", "Dua lembar: per leg patroli (Rekap Upaya Patroli) dan per titik (posisi dan Kegiatan RBM). 1 kegiatan RBM = 1 patroli; form RBM 2026 dan register LPK PEH ikut sebagai upaya. Capaian RBM dihitung dari rekap ini terhadap Rencana RBM (lembar acuan).", ""],
    ["metodeteknis.inventarisasiraptor.titikpengamatan.", "Survei Kehati Metode Teknis > Inventarisasi dan Sebaran Raptor > Titik Pengamatan (Plot Point Count)", "surveikehati", "Inventarisasi dan Sebaran Raptor - Titik Pengamatan (Plot Point Count)", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.inventarisasiraptor.perjumpaanraptor.", "Survei Kehati Metode Teknis > Inventarisasi dan Sebaran Raptor > Perjumpaan Raptor", "surveikehati", "Inventarisasi dan Sebaran Raptor - Perjumpaan Raptor", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringelangflores.petakvegetasi.", "Survei Kehati Metode Teknis > Monitoring Elang Flores > Petak Vegetasi (petak bersarang)", "surveikehati", "Monitoring Elang Flores - Petak Vegetasi (petak bersarang)", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringelangflores.titikpengamatan.", "Survei Kehati Metode Teknis > Monitoring Elang Flores > Titik Pengamatan", "surveikehati", "Monitoring Elang Flores - Titik Pengamatan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringelangflores.perjumpaansatwa.", "Survei Kehati Metode Teknis > Monitoring Elang Flores > Perjumpaan Satwa", "surveikehati", "Monitoring Elang Flores - Perjumpaan Satwa", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringelangflores.pohonsarang.", "Survei Kehati Metode Teknis > Monitoring Elang Flores > Pohon Sarang", "surveikehati", "Monitoring Elang Flores - Pohon Sarang", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringelangflores.vegetasi.", "Survei Kehati Metode Teknis > Monitoring Elang Flores > Vegetasi", "surveikehati", "Monitoring Elang Flores - Vegetasi", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringrusatimor.petakvegetasi.", "Survei Kehati Metode Teknis > Monitoring Rusa Timor > Petak Vegetasi (petak bersarang)", "surveikehati", "Monitoring Rusa Timor - Petak Vegetasi (petak bersarang)", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringrusatimor.transek.", "Survei Kehati Metode Teknis > Monitoring Rusa Timor > Transek", "surveikehati", "Monitoring Rusa Timor - Transek", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringrusatimor.perjumpaanlangsung.", "Survei Kehati Metode Teknis > Monitoring Rusa Timor > Perjumpaan Langsung", "surveikehati", "Monitoring Rusa Timor - Perjumpaan Langsung", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringrusatimor.tandakeberadaan.", "Survei Kehati Metode Teknis > Monitoring Rusa Timor > Tanda Keberadaan", "surveikehati", "Monitoring Rusa Timor - Tanda Keberadaan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringrusatimor.vegetasi.", "Survei Kehati Metode Teknis > Monitoring Rusa Timor > Vegetasi", "surveikehati", "Monitoring Rusa Timor - Vegetasi", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.groundchecktutupanlahan.titikgroundcheck.", "Survei Kehati Metode Teknis > Ground Check Tutupan Lahan dan Tipe Ekosistem > Titik Ground Check", "surveikehati", "Ground Check Tutupan Lahan dan Tipe Ekosistem - Titik Ground Check", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.groundchecktutupanlahan.vegetasi.", "Survei Kehati Metode Teknis > Ground Check Tutupan Lahan dan Tipe Ekosistem > Vegetasi", "surveikehati", "Ground Check Tutupan Lahan dan Tipe Ekosistem - Vegetasi", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.identifikasianggrek.plotpengamatan.", "Survei Kehati Metode Teknis > Identifikasi Anggrek > Plot Pengamatan", "surveikehati", "Identifikasi Anggrek - Plot Pengamatan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.identifikasianggrek.temuananggrek.", "Survei Kehati Metode Teknis > Identifikasi Anggrek > Temuan Anggrek", "surveikehati", "Identifikasi Anggrek - Temuan Anggrek", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.inventarisasijenisinvasif.petakcontoh.", "Survei Kehati Metode Teknis > Inventarisasi Jenis Asing Invasif > Petak Contoh", "surveikehati", "Inventarisasi Jenis Asing Invasif - Petak Contoh", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.inventarisasijenisinvasif.vegetasi.", "Survei Kehati Metode Teknis > Inventarisasi Jenis Asing Invasif > Vegetasi", "surveikehati", "Inventarisasi Jenis Asing Invasif - Vegetasi", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.inventarisasijenisinvasif.keinvasifan.", "Survei Kehati Metode Teknis > Inventarisasi Jenis Asing Invasif > Penilaian Keinvasifan", "surveikehati", "Inventarisasi Jenis Asing Invasif - Penilaian Keinvasifan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.inventarisasiburung.titikpengamatan.", "Survei Kehati Metode Teknis > Inventarisasi Burung > Titik Pengamatan", "surveikehati", "Inventarisasi Burung - Titik Pengamatan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.inventarisasiburung.perjumpaanburung.", "Survei Kehati Metode Teknis > Inventarisasi Burung > Perjumpaan Burung", "surveikehati", "Inventarisasi Burung - Perjumpaan Burung", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.inventarisasitumbuhanpenting.petakcontoh.", "Survei Kehati Metode Teknis > Inventarisasi Tumbuhan Penting > Petak Contoh", "surveikehati", "Inventarisasi Tumbuhan Penting - Petak Contoh", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.inventarisasitumbuhanpenting.vegetasi.", "Survei Kehati Metode Teknis > Inventarisasi Tumbuhan Penting > Vegetasi", "surveikehati", "Inventarisasi Tumbuhan Penting - Vegetasi", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.inventarisasitumbuhanpenting.statusjenis.", "Survei Kehati Metode Teknis > Inventarisasi Tumbuhan Penting > Status Jenis", "surveikehati", "Inventarisasi Tumbuhan Penting - Status Jenis", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringsatwakunci.jalurpengamatan.", "Survei Kehati Metode Teknis > Monitoring Satwa Kunci > Jalur Pengamatan", "surveikehati", "Monitoring Satwa Kunci - Jalur Pengamatan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.monitoringsatwakunci.temuansatwa.", "Survei Kehati Metode Teknis > Monitoring Satwa Kunci > Temuan Satwa", "surveikehati", "Monitoring Satwa Kunci - Temuan Satwa", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.kajianpelepasliaran.lokasipengamatan.", "Survei Kehati Metode Teknis > Kajian Lokasi Pelepasliaran Satwa > Lokasi Pengamatan", "surveikehati", "Kajian Lokasi Pelepasliaran Satwa - Lokasi Pengamatan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.kajianpelepasliaran.perjumpaanburung.", "Survei Kehati Metode Teknis > Kajian Lokasi Pelepasliaran Satwa > Perjumpaan Burung", "surveikehati", "Kajian Lokasi Pelepasliaran Satwa - Perjumpaan Burung", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.kajianpelepasliaran.fungsipohon.", "Survei Kehati Metode Teknis > Kajian Lokasi Pelepasliaran Satwa > Fungsi Pohon", "surveikehati", "Kajian Lokasi Pelepasliaran Satwa - Fungsi Pohon", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.stokkarbon.plotukur.", "Survei Kehati Metode Teknis > Pengukuran Stok Karbon > Plot Ukur", "surveikehati", "Pengukuran Stok Karbon - Plot Ukur", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.stokkarbon.tegakan.", "Survei Kehati Metode Teknis > Pengukuran Stok Karbon > Tegakan", "surveikehati", "Pengukuran Stok Karbon - Tegakan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.stokkarbon.serasah.", "Survei Kehati Metode Teknis > Pengukuran Stok Karbon > Serasah, Nekromas, dan Tumbuhan Bawah", "surveikehati", "Pengukuran Stok Karbon - Serasah, Nekromas, dan Tumbuhan Bawah", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.stokkarbon.kayumati.", "Survei Kehati Metode Teknis > Pengukuran Stok Karbon > Kayu Mati", "surveikehati", "Pengukuran Stok Karbon - Kayu Mati", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.stokkarbon.contohtanah.", "Survei Kehati Metode Teknis > Pengukuran Stok Karbon > Contoh Tanah", "surveikehati", "Pengukuran Stok Karbon - Contoh Tanah", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.rekapelangflores.perjumpaan.", "Survei Kehati Metode Teknis > Rekap Perjumpaan Elang Flores > Perjumpaan", "surveikehati", "Rekap Perjumpaan Elang Flores - Perjumpaan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.rekapelangflores.sarang.", "Survei Kehati Metode Teknis > Rekap Perjumpaan Elang Flores > Sarang", "surveikehati", "Rekap Perjumpaan Elang Flores - Sarang", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.sebaranumaani.petakvegetasi.", "Survei Kehati Metode Teknis > Sebaran Pohon Sarang Uma Ani > Petak Vegetasi (petak bersarang)", "surveikehati", "Sebaran Pohon Sarang Uma Ani - Petak Vegetasi (petak bersarang)", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.sebaranumaani.pohonsarang.", "Survei Kehati Metode Teknis > Sebaran Pohon Sarang Uma Ani > Pohon Sarang", "surveikehati", "Sebaran Pohon Sarang Uma Ani - Pohon Sarang", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.sebaranumaani.vegetasi.", "Survei Kehati Metode Teknis > Sebaran Pohon Sarang Uma Ani > Vegetasi", "surveikehati", "Sebaran Pohon Sarang Uma Ani - Vegetasi", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.verifikasikehatitinggi.titikgrid.", "Survei Kehati Metode Teknis > Verifikasi Kehati Tinggi > Titik Grid", "surveikehati", "Verifikasi Kehati Tinggi - Titik Grid", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.verifikasikehatitinggi.vegetasi.", "Survei Kehati Metode Teknis > Verifikasi Kehati Tinggi > Vegetasi", "surveikehati", "Verifikasi Kehati Tinggi - Vegetasi", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.verifikasikehatitinggi.perjumpaansatwa.", "Survei Kehati Metode Teknis > Verifikasi Kehati Tinggi > Perjumpaan Satwa", "surveikehati", "Verifikasi Kehati Tinggi - Perjumpaan Satwa", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.kamerajebak.stasiunkamera.", "Survei Kehati Metode Teknis > Kamera Jebak (RAI, REM, okupansi) > Stasiun Kamera", "surveikehati", "Kamera Jebak - Stasiun Kamera", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.kamerajebak.fotosatwa.", "Survei Kehati Metode Teknis > Kamera Jebak (RAI, REM, okupansi) > Foto Satwa", "surveikehati", "Kamera Jebak - Foto Satwa", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.surveiherpetofauna.jalurves.", "Survei Kehati Metode Teknis > Survei Perjumpaan Visual Herpetofauna (VES) > Jalur atau Plot VES", "surveikehati", "Survei Perjumpaan Visual Herpetofauna - Jalur atau Plot VES", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.surveiherpetofauna.perjumpaanherpetofauna.", "Survei Kehati Metode Teknis > Survei Perjumpaan Visual Herpetofauna (VES) > Perjumpaan Herpetofauna", "surveikehati", "Survei Perjumpaan Visual Herpetofauna - Perjumpaan Herpetofauna", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.tangkaptandai.sesipenangkapan.", "Survei Kehati Metode Teknis > Tangkap-Tandai-Tangkap Ulang (Lincoln-Petersen, Schnabel) > Sesi Penangkapan", "surveikehati", "Tangkap-Tandai-Tangkap Ulang - Sesi Penangkapan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.tangkaptandai.individutertangkap.", "Survei Kehati Metode Teknis > Tangkap-Tandai-Tangkap Ulang (Lincoln-Petersen, Schnabel) > Individu Tertangkap", "surveikehati", "Tangkap-Tandai-Tangkap Ulang - Individu Tertangkap", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.distancesampling.unitpengamatan.", "Survei Kehati Metode Teknis > Distance Sampling dan Transek Jalur Satwa > Transek atau Titik", "surveikehati", "Distance Sampling dan Transek Jalur Satwa - Transek atau Titik", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.distancesampling.deteksisatwa.", "Survei Kehati Metode Teknis > Distance Sampling dan Transek Jalur Satwa > Deteksi Satwa", "surveikehati", "Distance Sampling dan Transek Jalur Satwa - Deteksi Satwa", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.kuadranberpusattitik.titikpcq.", "Survei Kehati Metode Teknis > Kuadran Berpusat Titik (PCQ) > Titik PCQ", "surveikehati", "Kuadran Berpusat Titik - Titik PCQ", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.kuadranberpusattitik.pohonkuadran.", "Survei Kehati Metode Teknis > Kuadran Berpusat Titik (PCQ) > Pohon per Kuadran", "surveikehati", "Kuadran Berpusat Titik - Pohon per Kuadran", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.tutupanvegetasi.unittutupan.", "Survei Kehati Metode Teknis > Tutupan Vegetasi (Braun-Blanquet, Transek Garis, Transek Sabuk) > Petak atau Transek", "surveikehati", "Tutupan Vegetasi - Petak atau Transek", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.tutupanvegetasi.tutupanjenis.", "Survei Kehati Metode Teknis > Tutupan Vegetasi (Braun-Blanquet, Transek Garis, Transek Sabuk) > Tutupan per Jenis", "surveikehati", "Tutupan Vegetasi - Tutupan per Jenis", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.kurvaspesiesarea.petakbertingkat.", "Survei Kehati Metode Teknis > Kurva Spesies-Area (Luas Petak Minimum) > Petak Bertingkat", "surveikehati", "Kurva Spesies-Area - Petak Bertingkat", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.kurvaspesiesarea.jenisbaru.", "Survei Kehati Metode Teknis > Kurva Spesies-Area (Luas Petak Minimum) > Jenis Baru", "surveikehati", "Kurva Spesies-Area - Jenis Baru", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.okupansi.kunjunganunit.", "Survei Kehati Metode Teknis > Survei Okupansi (Kunjungan Ulang) > Kunjungan Unit Contoh", "surveikehati", "Survei Okupansi - Kunjungan Unit Contoh", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.okupansi.deteksijenis.", "Survei Kehati Metode Teknis > Survei Okupansi (Kunjungan Ulang) > Deteksi Jenis", "surveikehati", "Survei Okupansi - Deteksi Jenis", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.pengamatanperilaku.sesiperilaku.", "Survei Kehati Metode Teknis > Pengamatan Perilaku Satwa > Sesi Pengamatan", "surveikehati", "Pengamatan Perilaku Satwa - Sesi Pengamatan", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.pengamatanperilaku.catatanperilaku.", "Survei Kehati Metode Teknis > Pengamatan Perilaku Satwa > Catatan Perilaku", "surveikehati", "Pengamatan Perilaku Satwa - Catatan Perilaku", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.analisisvegetasi.petakcontoh.", "Survei Kehati Metode Teknis > Analisis Vegetasi Petak Bersarang (umum) > Petak Contoh", "surveikehati", "Analisis Vegetasi Petak Bersarang - Petak Contoh", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["metodeteknis.analisisvegetasi.vegetasi.", "Survei Kehati Metode Teknis > Analisis Vegetasi Petak Bersarang (umum) > Vegetasi", "surveikehati", "Analisis Vegetasi Petak Bersarang - Vegetasi", "survei", "", "", "Lembar bahan Kalkulator Teknis (bukan rekap, tidak tampil di Unduh Data): satu tab per tabel metode dengan semua parameter teknis. Baris berjenis juga masuk Rekap Temuan Satwa/Tumbuhan/Spesies Invasif, tetapi hanya kolom jenis dan jumlah (tanpa parameter metode).", ""],
    ["@jenissatwa|tmbjenissatwa", "Observasi apa pun yang berisi Jenis satwa atau Jenis satwa Tambora (di luar daftar nasional)", "satwa", "Rekap Temuan Satwa", "kehati", "jenissatwa, tmbjenissatwa, jumlah, satuan, jeniskelaminsatwa, umursatwa", "", "Seperti query atribut SMART. Kategori yang sudah punya rute ke tab ini memakai rute kategorinya.", "tidak"],
    ["@jenistumbuhan|tmbjenistumbuhan|jenistumbuhan1", "Observasi apa pun yang berisi Jenis tumbuhan atau Jenis tumbuhan Tambora (di luar daftar nasional) atau Jenis tumbuhan", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "jenistumbuhan, tmbjenistumbuhan, jenistumbuhan1, jumlah, satuan", "", "Seperti query atribut SMART. Kategori yang sudah punya rute ke tab ini memakai rute kategorinya.", "tidak"],
    ["surveykehati.monitoringrafflesia.", "Survey Kehati > Monitoring Rafflesia", "tumbuhan", "Rekap Temuan Tumbuhan", "kehati", "", "", "Kategori kantor 2026 (tidak dipakai di 2027)", ""]
  ],
  Induk: [
    ["kode", "nama", "warna", "id_spreadsheet"],
    ["pp", "Perlindungan dan Pengamanan", "#C0392B", ""],
    ["karhut", "Kebakaran Hutan dan Lahan", "#D35400", ""],
    ["kehati", "Keanekaragaman Hayati", "#1E8449", ""],
    ["peny", "Penyuluhan dan Pemberdayaan Masyarakat", "#7D3C98", ""],
    ["wisata", "Wisata dan Pelayanan", "#2471A3", ""],
    ["fitur", "Fitur dan Pengelolaan Kawasan", "#7E5109", ""],
    ["rbm", "Patroli, Kegiatan Resor, dan Capaian RBM", "#117A65", ""],
    ["survei", "Survei Kehati Metode Teknis (bahan Kalkulator Teknis)", "#9A7D0A", ""]
  ],
  Petunjuk: [
    ["Mesin Data Satu Data Tambora"],
    [""],
    ["Satu spreadsheet tempat seluruh data Satu Data Tambora berkumpul, tersusun dalam 12 rekap mengikuti peta konsep 2027: Upaya Patroli, Temuan Gangguan Kawasan, Kejadian Kebakaran Hutan, Spesies Invasif, Tipe Ekosistem dan Tutupan Lahan, Temuan Satwa, Temuan Tumbuhan, Sarana Prasarana/Pal Batas/Media Informasi, Fitur Alami dan Potensi Kawasan, Kegiatan Penyuluhan, Sampah Pengunjung, serta Kunjungan dan Pendakian. Rekap berisi data mentah, bukan hasil analisis."],
    ["Data sebelum 2027 diseragamkan ke kategori dan atribut data model 2027 lalu masuk ke rekap yang sama dengan data patroli: patroli SMART 2026, temuan kehati LPK teknis PEH dan SMART 2025, laporan penyuluhan dan kondisi kelompok binaan (Monev Kelompok Binaan), pulbaket tenurial (Penggunaan Kawasan dan Pelaku), titik panas dan delineasi (Kebakaran Hutan dan Lahan), laporan form RBM (Kegiatan RBM), register LPK PEH dan penerbangan drone (upaya). Lembar acuan: Daftar Jenis Kehati, Daftar Kelompok Binaan, Rencana RBM 2026. Tabel Survei Kehati Metode Teknis lengkap dengan parameter metode ada di lembar survei (bahan Kalkulator Teknis); ke Rekap Temuan Satwa/Tumbuhan hanya ikut jenis dan jumlahnya."],
    ["Setelah dipasang, file patroli SMART baru cukup dimasukkan ke folder Drive. Skrip memecah setiap observasi ke tab tema yang sesuai mengikuti peta konsep 2027 (lembar Rute), dan tab Unduh Data di hub membaca semua tab data dari sini."],
    [""],
    ["MEMPERBARUI SPREADSHEET YANG SUDAH TERPASANG: tempel ulang Code.gs, Sumber.gs, Unduh.gs, dan Kendali.gs (berkas baru bernama Kendali), muat ulang spreadsheet, jalankan menu 1 (lembar kendali diperbarui, tab rekap dikosongkan), lalu menu 3 dan menu 2 untuk mengisi ulang rekap. Terakhir Terapkan > Kelola deployment > ikon pensil > Versi baru > Terapkan."],
    [""],
    ["CARA PASANG (sekali saja)"],
    ["1. Unggah file ini ke Google Drive, buka, lalu File > Simpan sebagai Google Spreadsheet. Lanjutkan di spreadsheet hasil konversi."],
    ["2. Ekstensi > Apps Script. Buat empat berkas skrip bernama Code, Sumber, Unduh, dan Kendali, lalu tempel isi Code.gs, Sumber.gs, Unduh.gs, dan Kendali.gs dari paket. Di Setelan proyek (ikon roda gigi) centang \"Tampilkan file manifes \"appsscript.json\" di editor\", lalu ganti isi appsscript.json dengan isi dari paket. Simpan."],
    ["3. Muat ulang spreadsheet. Menu \"Mesin Data\" muncul di samping menu Bantuan. Jalankan \"1. Siapkan tab dan cek pengaturan\". Nama tab yang terpotong menjadi 31 huruf saat lewat Excel dipulihkan otomatis di langkah ini."],
    ["   🔐 Otorisasi Google: muncul kotak \"Otorisasi diperlukan\" > Lanjutkan > pilih akun kantor > bila muncul \"Google belum memverifikasi aplikasi ini\" klik Lanjutan > Buka Mesin Data (tidak aman) > Izinkan. Izin yang diminta: mengelola spreadsheet, membaca Drive (folder file patroli), mengambil data dari internet (hub), dan menjalankan pemicu."],
    ["4. Jalankan \"3. Perbarui data sumber lain sekarang\". Langkah ini mengisi sumber yang hanya bisa dibuka dengan akun Google kantor (lembar Sumber berstatus \"belum\"): rekap laporan kejadian 2026, rekap karhut, dan rekap kunjungan wisata. Laporan form RBM juga dibaca di langkah ini (masuk sebagai Kegiatan RBM di Rekap Upaya Patroli). Bila satu putaran belum selesai, jalankan sekali lagi."],
    ["5. Jalankan \"4. Pasang pemicu otomatis\". File patroli diproses tiap jam (PEMICU_JAM), data sumber lain diperbarui tiap hari sekitar pukul 05.00 (JAM_PERBARUI_SUMBER). 🔐 Bila diminta izin lagi, ulangi langkah otorisasi di atas. Putaran pertama membaca semua file patroli 2026 di FOLDER_PATROLI; titik dan leg yang sudah ada dari Dashboard SMART dilewati, jadi tidak ada baris ganda."],
    ["6. Tab Unduh Data di hub: di Apps Script klik Terapkan > Deployment baru > ikon roda gigi > Aplikasi web. Jalankan sebagai: Saya. Yang memiliki akses: Siapa saja. Klik Terapkan. 🔐 Izinkan bila diminta. Salin URL aplikasi web (berakhiran /exec) ke tab Pengaturan di Sheet konten hub: baris baru dengan kunci unduh_data dan nilai URL itu."],
    ["   Agar akun admin ikut mengunduh kolom data pribadi, perbarui juga Tanya Data ke kode terbaru (aksi \"siapa\"): di proyek Apps Script Tanya Data, Terapkan > Kelola deployment > ikon pensil > Versi: Versi baru > Terapkan. Selama belum diperbarui, semua akun diperlakukan sebagai pegawai."],
    ["7. Jalankan \"Uji Unduh Data (tanpa hub)\" untuk memeriksa katalog, contoh data, dan sambungan ke Tanya Data."],
    ["   Setiap kali skrip diubah, perbarui aplikasi web: Terapkan > Kelola deployment > ikon pensil > Versi: Versi baru > Terapkan. URL /exec tetap sama."],
    [""],
    ["ALUR DATA"],
    ["• File patroli SMART (zip/xml per ST) di FOLDER_PATROLI > kategori observasi dicocokkan ke lembar Rute > baris masuk ke tab rekap tema. Baris Rute berawalan \"@\" adalah rute per atribut, seperti query atribut di SMART: observasi kategori apa pun yang berisi jenis satwa atau jenis tumbuhan ikut masuk ke Rekap Temuan Satwa/Tumbuhan, hanya dengan kolom atribut rute itu (atribut_lain \"tidak\"). Satu observasi boleh masuk ke beberapa tab. Jenis kegiatan dibaca dari mandat (lembar Mandat), nama jenis diseragamkan (Kamus Jenis), ejaan label dibetulkan (Ejaan dan label_baku di Label Data Model)."],
    ["• Data sebelum 2027 dan data tab lain dibaca dari alamat di lembar Sumber dan masuk ke tab yang sama lewat penghubung yang sama (alur \"Sumber sebelum 2027\" di peta konsep). Alamat {HUB} dan {PAGES} diganti dengan URL_HUB dan URL_PAGES."],
    ["• Kolom Sumber di tiap tab mencatat asal baris. Setiap sumber mengganti baris miliknya sendiri saat diperbarui, jadi baris sumber lain tidak tersentuh. Titik patroli yang sama dari dua sumber hanya dicatat sekali (kolom Kunci titik: tanggal, jam, dan koordinat)."],
    ["• Lembar Katalog adalah daftar data untuk tab Unduh Data. Kolom judul, tema, keterangan, akses (pegawai, admin, tidak), kolom_admin, dan tampil boleh diubah; kolom lain dihitung skrip setiap data berubah."],
    ["• Kolom data pribadi (nama pelaku, nama pengguna lahan, dan sejenisnya; lihat UNDUH_KOLOM_ADMIN di Pengaturan) hanya ikut terunduh oleh akun Tanya Data berperan admin. Sumber yang akses_unduh-nya admin di lembar Sumber (rekap laporan kejadian 2026) barisnya hanya terlihat oleh admin, walau satu tab rekap dengan data lain. Setiap unduhan dicatat di Log Unduhan."],
    [""],
    ["BILA ADA YANG PERLU DILENGKAPI"],
    ["• Jenis Belum di Kamus: jenis dari file patroli yang belum ada di Kamus Jenis. Tambahkan barisnya ke Kamus Jenis, lalu jalankan \"Rapikan nama di semua rekap\"."],
    ["• Tanpa Rute: kategori observasi yang belum punya tab tujuan. Tambahkan barisnya ke lembar Rute."],
    ["• Sumber berstatus GAGAL: baca pesannya di kolom status. Spreadsheet berformat .xlsx perlu dibuka lalu File > Simpan sebagai Google Spreadsheet, dan ID barunya ditempel di kolom alamat."],
    ["• Data besar: isi kolom id_spreadsheet di lembar Induk dengan \"baru\" lalu jalankan menu 1. Tab induk itu dipindah ke spreadsheet tersendiri dan ID-nya dicatat otomatis."],
    [""],
    ["Data awal di file ini disusun 27/11/2026 dari salinan data yang dipakai hub Satu Data Tambora."]
  ],
  Pengaturan: [
    ["kunci", "nilai", "keterangan"],
    ["FOLDER_PATROLI", "", "ID atau link folder Drive tempat file patroli SMART (zip/xml per ST) masuk. Boleh beberapa folder dipisah koma, misalnya folder 2026 dan folder 2027. File tidak dipindah atau diubah."],
    ["FOLDER_REKAP", "", "ID folder Drive untuk spreadsheet induk yang dipisah (Induk.id_spreadsheet = \"baru\"). Kosong = Drive Saya."],
    ["URL_BATAS_RESOR", "https://satudatambora.my.id/data/resor/batas_resor_2026.geojson", "Batas tujuh resor hasil kajian 2026, dipakai untuk mengisi kolom Resor dan SPTN dari koordinat."],
    ["URL_HUB", "https://satudatambora.my.id/", "Alamat hub Satu Data Tambora, pengganti {HUB} di lembar Sumber."],
    ["URL_PAGES", "https://kopluck8.github.io/", "Alamat GitHub Pages aplikasi lain (Dashboard SMART, RBM, Flight SMART, Simulasi API), pengganti {PAGES}."],
    ["URL_TANYA_DATA", "https://script.google.com/macros/s/AKfycbxusKvHzNofeX45WZwqt2mmQwIlE8bkxThRwchCGj7gu4Bg7S0oVKdpw8gtzMsJ6P_DHg/exec", "URL /exec aplikasi web Tanya Data. Dipakai Unduh Data untuk memeriksa login pegawai di hub."],
    ["BATAS_WAKTU_DETIK", 240, "Satu putaran berhenti sebelum batas 6 menit Apps Script; sisa file atau sumber lanjut di putaran berikutnya."],
    ["TAB_UPAYA", "Rekap Upaya Patroli", "Tab Rekap Upaya Patroli per leg (juga kegiatan LPK PEH dan penerbangan drone). Titik posisi dan Kegiatan RBM ada di tab Rekap Upaya Patroli (Titik dan Kegiatan RBM)."],
    ["PEMICU_JAM", 1, "Jarak antarputaran otomatis file patroli dalam jam: 1, 2, 4, 6, 8, atau 12."],
    ["JAM_PERBARUI_SUMBER", 5, "Jam (0 sampai 23) data di lembar Sumber diperbarui otomatis setiap hari."],
    ["UNDUH_KOLOM_ADMIN", "Nama pelaku, ID Pelaku, Identitas pelaku, Alamat, Tersangka, Nama informan, Nama pemilik, Nama pengepul, Nama kapten, Nama masyarakat, Nama pewaris, Nama guide, Nama pengguna lahan, Riwayat perolehan lahan, Pihak berpengaruh, NIK, Nomor HP, Telepon", "Kolom yang hanya ikut terunduh oleh akun admin. Nama kolom yang sama atau diawali nama ini (misalnya \"Alamat\" juga menutup \"Alamat pengguna lahan\"). Isi \"-\" untuk mematikan."],
    ["UNDUH_INDUK_TANPA", "survei", "Kode induk yang tidak tampil di Unduh Data: lembar survei metode teknis (bahan Kalkulator Teknis, bukan rekap)."],
    ["UNDUH_KOLOM_SEMBUNYI", "Kunci titik", "Kolom bantu yang tidak ikut diunduh siapa pun."],
    ["VERSI_KENDALI", "2026-11-27", "Versi lembar kendali (Rute, Induk, Petunjuk, Pengaturan, Sumber). Menu 1 memperbarui lembar kendali bila versi di berkas skrip Kendali lebih baru, lalu tab rekap diisi ulang lewat menu 3 dan menu 2."]
  ],
  Sumber: [
    ["kode", "nama", "jenis", "alamat", "tab_tujuan", "induk", "aktif", "akses_unduh", "catatan", "diperbarui", "baris", "status", "sidik"],
    ["smart_dashboard", "Patroli SMART 2026 (Dashboard SMART)", "smart_dashboard", "{PAGES}Dashboard_SMART_TNGunungTambora/data/patroli-observasi.csv | {PAGES}Dashboard_SMART_TNGunungTambora/data/patroli-ringkasan.csv | {PAGES}Dashboard_SMART_TNGunungTambora/data/jalur-patroli.geojson", "(mengikuti Rute)", "", "ya", "", "Observasi, leg, dan jalur patroli 2026 yang sudah diolah Dashboard SMART dari folder file patroli. Observasi masuk ke tab tema mengikuti Rute, leg masuk ke Rekap Upaya Patroli.", "", "", "", ""],
    ["smart_rekap", "Rekap SMART 2026 (spreadsheet)", "smart_rekap", "1VfP1gZb7Ah9Lt0iNAjVvUGbjVN19aZ2b-7XXfjnUNK8 | https://docs.google.com/spreadsheets/d/e/2PACX-1vTZqgHUgDRXs14VKsKvcj45GBZqFA08PC5U_76BVrR0upSuDcIIGISAhgi6M5f5CjPhuw1lWAb6ekao/pub?output=csv", "(mengikuti Rute)", "", "ya", "", "Tabulasi ekspor SMART Desktop. Alamat pertama ID spreadsheet, alamat kedua CSV publikasi sebagai cadangan. Titik yang sudah ada dari sumber lain dilewati.", "", "", "", ""],
    ["lpk_peh", "LPK teknis PEH 2020 sampai 2026", "lpk_peh", "{HUB}data/kehati/temuan.json | {HUB}data/kehati/taksa.json | {HUB}data/kehati/kegiatan.json", "(satwa, tumbuhan, invasif, ekosistem)", "kehati", "ya", "", "Temuan LPK teknis PEH yang sudah dikurasi di Data Masuk Kehati (tab Keanekaragaman Hayati di hub).", "", "", "", ""],
    ["smart_kehati", "Temuan kehati SMART 2025 (Data Masuk Kehati)", "smart_kehati", "{HUB}data/kehati/temuan.json | {HUB}data/kehati/taksa.json | {HUB}data/kehati/kegiatan.json", "(satwa, tumbuhan, invasif, ekosistem)", "kehati", "ya", "", "tahun 2025. Tahun yang sudah dimuat rekap SMART atau Dashboard SMART dilewati agar tidak ganda.", "", "", "", ""],
    ["daftar_jenis", "Daftar jenis kehati", "daftar_jenis", "{HUB}data/kehati/taksa.json", "Daftar Jenis Kehati", "kehati", "ya", "", "Daftar jenis TN Tambora beserta status P.106, IUCN, CITES, dan jumlah temuan.", "", "", "", ""],
    ["register_lpk", "Register kegiatan LPK teknis PEH", "register_lpk", "{HUB}data/kehati/kegiatan.json", "Rekap Upaya Patroli", "rbm", "ya", "", "Satu kegiatan LPK = satu upaya (Rekap Upaya Patroli): metode, resor, tanggal, jumlah temuan.", "", "", "", ""],
    ["penyuluhan", "Laporan penyuluhan dan pemberdayaan", "penyuluhan", "{HUB}data/penyuluhan/penyuluhan.csv", "(mengikuti Rute)", "", "ya", "", "Laporan 2020 sampai 2026, diseragamkan ke kategori Penyuluhan dan Pemberdayaan Masyarakat data model 2027.", "", "", "", ""],
    ["kelompok", "Kondisi kelompok binaan per tahun", "kelompok", "{HUB}data/penyuluhan/kelompok_riwayat.csv | {HUB}data/penyuluhan/kelompok.csv", "(mengikuti Rute)", "", "ya", "", "Status, anggota, kendala, dan kebutuhan tiap kelompok per tahun sebagai Monev Kelompok Binaan.", "", "", "", ""],
    ["daftar_kelompok", "Daftar kelompok binaan", "daftar_kelompok", "{HUB}data/penyuluhan/kelompok.csv", "Daftar Kelompok Binaan", "peny", "ya", "", "Lembar acuan (bukan data temuan).", "", "", "", ""],
    ["pulbaket", "Pulbaket penggunaan lahan (tenurial)", "pulbaket", "{HUB}data/tenurial/bidang.geojson | {HUB}data/tenurial/ringkasan.json", "(mengikuti Rute)", "", "ya", "", "Satu bidang = Aktivitas Manusia > Penggunaan Kawasan; pengguna lahan dan pihak berpengaruh = Pelaku (nama hanya untuk admin).", "", "", "", ""],
    ["titik_panas", "Titik panas (hotspot)", "titik_panas", "{PAGES}Simulasi-API-Tambora/data/asal_api/titik_panas.geojson", "(mengikuti Rute)", "", "ya", "", "Kebakaran Hutan dan Lahan, sumber informasi Hotspot satelit (MODIS dan VIIRS).", "", "", "", ""],
    ["areal_terbakar", "Areal terbakar (delineasi)", "areal_terbakar", "{PAGES}Simulasi-API-Tambora/data/areal_terbakar_bidang.geojson", "(mengikuti Rute)", "", "ya", "", "Kebakaran Hutan dan Lahan: bekas kebakaran dengan luas terbakar hasil delineasi tiap 5 hari.", "", "", "", ""],
    ["rbm", "Rencana dan laporan RBM 2026", "rbm", "{PAGES}RBM_TNGunungTambora/data/rencana_2026.json | {PAGES}RBM_TNGunungTambora/assets/config.js", "Rencana RBM 2026", "rbm", "ya", "", "Rencana = lembar acuan. Laporan form RBM (tanpa nama petugas) = Kegiatan RBM di Rekap Upaya Patroli (titik dan kegiatan).", "", "", "", ""],
    ["drone", "Penerbangan drone (Flight SMART)", "drone", "{PAGES}Flight_SMART/flights/index.json", "Rekap Upaya Patroli", "rbm", "ya", "", "Satu penerbangan = satu upaya (Rekap Upaya Patroli).", "", "", "", ""],
    ["lk_2026", "Rekap laporan kejadian 2026", "spreadsheet", "18qc30ZrKAgXeiqRzeqXh2Vqqhscq1kqVKEL_6mBA6Wc", "(mengikuti Rute)", "", "ya", "admin", "kategori=aktivitasmanusia. Kategori tiap baris dari sel yang sama dengan nama kategori (Pembalakan, Perburuan Satwa, ...) atau dari kata laporan lama di kolom kejadian (perambahan = Penggunaan Kawasan, perburuan = Perburuan Satwa, ...). Memuat identitas pelaku: akses_unduh admin = barisnya di Rekap Temuan Gangguan Kawasan hanya untuk admin. Pilih tab lain dengan menambah \"#Nama tab\" di alamat.", "", "", "", ""],
    ["rekap_karhut", "Rekap kejadian kebakaran hutan", "spreadsheet", "1J0Ys2ccDlIkI8PgLmeTgkfBcpHWz8bWX77mBEXyCCr4", "(mengikuti Rute)", "", "ya", "", "kategori=aktivitasmanusia.kebakaranhutandanlahan.", "", "", "", ""],
    ["kunjungan", "Rekap kunjungan wisata", "spreadsheet", "1EqteU7YyVOZeuMxgtCksg5EgNqoQbRukg4sUGJQgmPs", "(mengikuti Rute)", "", "ya", "", "kategori=penjagaanjalurpendakiandanodtwa.pelayananpengunjungwisata.", "", "", "", ""],
    ["dapoltam", "Database Polhut (DaPolTam)", "spreadsheet", "17O0M1sCb8oUHnNcCWMiPc1gNNSRthOfDw6zhjAP21KA", "(mengikuti Rute)", "", "tidak", "admin", "kategori=aktivitasmanusia. Tidak aktif; aktifkan hanya bila memang perlu ada di sini.", "", "", "", ""]
  ],
  hapusPengaturan: ["TAB_PER_RESOR", "TAB_PER_RESOR_DARI"],
  hapusLabel: [["atribut", "", "tmbkodelahan"], ["atribut", "", "tmbnamapenggunalahan"], ["atribut", "", "tmbriwayatpengguna"], ["atribut", "", "tmbpenjualpenyewa"], ["atribut", "", "tmbtahunmulaiaktif"], ["atribut", "", "tmbpihakberpengaruh"], ["atribut", "", "tmbluasbidangha"], ["kategori", "", "aktivitasmanusia.tmbpulbakettenurial."]]
};

/** Versi lembar kendali yang terpasang (Pengaturan VERSI_KENDALI), kosong bila belum pernah diperbarui. */
function versiKendaliTerpasang_(ss) {
  var atur = ss.getSheetByName('Pengaturan'), versi = '';
  if (atur) atur.getDataRange().getValues().forEach(function (r) { if (String(r[0]).trim() === 'VERSI_KENDALI') versi = String(r[1]).trim(); });
  return versi;
}

function kendaliPerluDiperbarui_(ss) {
  return versiKendaliTerpasang_(ss) !== VERSI_KENDALI;
}

/**
 * Perbarui lembar kendali ke isi KENDALI bila versinya berbeda. Mengembalikan true bila ada yang diperbarui.
 * catatan: larik pesan untuk kabar menu 1.
 */
function perbaruiLembarKendali_(ss, catatan) {
  if (!kendaliPerluDiperbarui_(ss)) return false;
  var atur = ss.getSheetByName('Pengaturan');
  var lama = atur ? atur.getDataRange().getValues() : [['kunci', 'nilai', 'keterangan']];

  // Pengaturan: nilai yang sudah diisi tetap
  var nilaiLama = {};
  lama.slice(1).forEach(function (r) { var k = String(r[0]).trim(); if (k) nilaiLama[k] = r[1]; });
  var baruAtur = [KENDALI.Pengaturan[0]];
  KENDALI.Pengaturan.slice(1).forEach(function (r) {
    var k = r[0], v = k === 'VERSI_KENDALI' ? VERSI_KENDALI : nilaiLama[k];
    baruAtur.push([k, v !== undefined && v !== null && String(v) !== '' ? v : r[1], r[2]]);
  });
  var dikenal = {};
  KENDALI.Pengaturan.forEach(function (r) { dikenal[r[0]] = true; });
  lama.slice(1).forEach(function (r) {
    var k = String(r[0]).trim();
    if (k && !dikenal[k] && k !== 'VERSI_KENDALI' && KENDALI.hapusPengaturan.indexOf(k) < 0) baruAtur.push([k, r[1], r[2] || '']);
  });
  if (!dikenal.VERSI_KENDALI) baruAtur.push(['VERSI_KENDALI', VERSI_KENDALI, 'Versi lembar kendali (Rute, Induk, Petunjuk, ' +
    'Pengaturan, Sumber). Menu 1 memperbarui lembar kendali bila versi di berkas skrip Kendali lebih baru.']);

  // Induk: id_spreadsheet yang sudah diisi tetap
  var idInduk = {};
  bacaLembarMentah_(ss, 'Induk').forEach(function (r) { if (r.kode && r.id_spreadsheet) idInduk[r.kode] = r.id_spreadsheet; });
  var kInduk = KENDALI.Induk[0], iId = kInduk.indexOf('id_spreadsheet');
  var baruInduk = KENDALI.Induk.map(function (r, i) {
    var x = r.slice();
    if (i && iId >= 0 && idInduk[r[0]]) x[iId] = idInduk[r[0]];
    return x;
  });

  // Sumber: alamat, aktif, akses_unduh, dan catatan status yang sudah ada tetap
  var kS = KENDALI.Sumber[0], sLama = {};
  bacaLembarMentah_(ss, 'Sumber').forEach(function (r) { if (r.kode) sLama[r.kode] = r; });
  var baruSumber = KENDALI.Sumber.map(function (r, i) {
    if (!i) return r.slice();
    var o = sLama[r[0]];
    return kS.map(function (k, j) {
      if (!o) return r[j];
      if (k === 'alamat' || k === 'aktif' || k === 'akses_unduh') return o[k] !== undefined && String(o[k]) !== '' ? o[k] : r[j];
      if (k === 'diperbarui' || k === 'baris' || k === 'status') return o[k] !== undefined ? o[k] : '';
      if (k === 'sidik') return ''; // dibaca ulang sekali dengan susunan baru
      return r[j];
    });
  });

  tulisLembarKendali_(ss, 'Pengaturan', baruAtur);
  tulisLembarKendali_(ss, 'Induk', baruInduk);
  tulisLembarKendali_(ss, 'Rute', KENDALI.Rute);
  tulisLembarKendali_(ss, 'Sumber', baruSumber);
  tulisLembarKendali_(ss, 'Petunjuk', KENDALI.Petunjuk);

  // Label Data Model: buang label kategori dan atribut yang sudah dihapus dari data model
  var shL = ss.getSheetByName('Label Data Model'), nHapus = 0;
  if (shL && KENDALI.hapusLabel.length && shL.getLastRow() > 1) {
    var vL = shL.getDataRange().getValues(), hapus = {};
    KENDALI.hapusLabel.forEach(function (h) { hapus[h.join('|')] = true; });
    // hapus baris dari bawah agar nomor baris di atasnya tidak bergeser; sel lain tidak ditulis ulang
    for (var i = vL.length - 1; i >= 1; i--) {
      var r = vL[i];
      if (!hapus[[r[0], r[1], r[2]].map(function (x) { return String(x); }).join('|')]) continue;
      shL.deleteRow(i + 1);
      nHapus++;
    }
  }
  catatan.push('Lembar kendali diperbarui ke peta konsep ' + VERSI_KENDALI + ' (Rute, Induk, Petunjuk, Pengaturan, Sumber' +
    (nHapus ? ', ' + nHapus + ' label data model lama dihapus' : '') + ')');
  return true;
}

function bacaLembarMentah_(ss, nama) {
  var sh = ss.getSheetByName(nama);
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), h = v.shift().map(function (x) { return String(x).trim(); });
  return v.map(function (r) { var o = {}; h.forEach(function (k, i) { if (k) o[k] = r[i]; }); return o; });
}

function tulisLembarKendali_(ss, nama, isi) {
  var sh = ss.getSheetByName(nama) || ss.insertSheet(nama);
  var lebar = isi.reduce(function (m, r) { return Math.max(m, r.length); }, 1);
  var nilai = isi.map(function (r) {
    var x = r.map(function (v) { return typeof v === 'string' && POLA_DIBACA_SHEETS.test(v) ? "'" + v : v; });
    while (x.length < lebar) x.push('');
    return x;
  });
  sh.clearContents();
  sh.getRange(1, 1, nilai.length, lebar).setValues(nilai);
  if (nama !== 'Petunjuk') { sh.getRange(1, 1, 1, lebar).setFontWeight('bold'); sh.setFrozenRows(1); }
}
