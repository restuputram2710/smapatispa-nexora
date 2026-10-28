# Panduan Instalasi SMAPATISPA NEXORA

Aplikasi BK & Kesiswaan SMA PGRI 43 Singaparna terdiri dari **dua bagian**:

| Bagian | Isi | Tempat |
|---|---|---|
| **Server (backend)** | `Kode.gs`, `Akun.gs`, `BK.gs`, `Kesiswaan.gs`, `Surat.gs`, `Setup.gs`, `appsscript.json` | Google Apps Script (akun Google sekolah) |
| **Tampilan (frontend)** | isi ZIP `smapatispa-nexora.zip` (`index.html`, `css/`, `js/`, `assets/`, …) | GitHub Pages |

Data tersimpan di Google Sheets milik akun Google sekolah. Catatan konseling rahasia disimpan di spreadsheet **terpisah** yang hanya dapat dibuka lewat akun Guru BK di aplikasi.

Waktu yang dibutuhkan: ± 45 menit. Ikuti urutannya: **A → B → C → D**.

---

## A. Memasang server di Google Apps Script

> Gunakan akun Google **resmi sekolah** (bukan akun pribadi). Semua data, surat PDF, dan email akan tersimpan/terkirim atas nama akun ini.

1. Buka **https://script.google.com** → klik **Proyek baru**.
2. Klik judul *Proyek tanpa judul* di kiri atas → ganti menjadi **SMAPATISPA NEXORA** → **Ganti nama**.
3. Tampilkan file pengaturan: klik ikon **⚙ Setelan proyek** (kiri) → centang **Tampilkan file manifes "appsscript.json" di editor**.
4. Kembali ke **‹› Editor**. Klik file **appsscript.json** → hapus semua isinya → tempel isi file `appsscript.json` dari paket ini → **Simpan** (Ctrl+S).
5. Klik file **Kode.gs** → hapus isinya → tempel isi `Kode.gs` → Simpan.
6. Buat 5 file skrip lagi. Untuk setiap file: klik **＋** di samping *File* → **Skrip** → ketik nama **tanpa** `.gs` → tempel isinya → Simpan.

   | Nama file di editor | Isi dari |
   |---|---|
   | `Akun` | `Akun.gs` |
   | `BK` | `BK.gs` |
   | `Kesiswaan` | `Kesiswaan.gs` |
   | `Surat` | `Surat.gs` |
   | `Setup` | `Setup.gs` |

   Urutan file tidak berpengaruh.

7. **Jalankan pemasangan otomatis.** Di toolbar atas, pada kotak pilihan fungsi pilih **`setupAwal`** → klik **▶ Jalankan**.
   - Muncul *Otorisasi diperlukan* → **Tinjau izin** → pilih akun sekolah.
   - Jika muncul *Google belum memverifikasi aplikasi ini*: klik **Lanjutan** → **Buka SMAPATISPA NEXORA (tidak aman)** → **Izinkan**. (Ini normal untuk skrip buatan sendiri.)
   - Tunggu ± 1 menit sampai **Log eksekusi** menampilkan **✅ SETUP SELESAI** beserta tautan folder Drive dan dua spreadsheet.

   Yang dibuat otomatis: folder *SMAPATISPA NEXORA* di Drive (logo, bukti, instrumen, surat, cadangan), spreadsheet **NEXORA_DB_UTAMA** dan **NEXORA_DB_BK_RAHASIA**, 16 jenis pelanggaran, 4 ambang surat, templat surat, pemicu otomatis (antrean notifikasi 5 menit, pengingat 06.00, rekap bulanan, cadangan mingguan), akun admin, serta **data contoh** untuk mencoba.

8. **Terbitkan sebagai aplikasi web.** Klik **Terapkan** (kanan atas) → **Penerapan baru** → ikon ⚙ di samping *Pilih jenis* → **Aplikasi web**.
   - Deskripsi: `v1`
   - **Jalankan sebagai: Saya** (akun sekolah)
   - **Yang memiliki akses: Siapa saja**
   - Klik **Terapkan** → **Salin** URL aplikasi web (berakhiran **`/exec`**).

   > "Siapa saja" diperlukan agar halaman di GitHub Pages bisa memanggil server. Data tetap aman: setiap permintaan wajib membawa token masuk yang ditandatangani server, dan hak akses diperiksa per peran.

9. Uji: tempel URL `/exec` di tab baru browser. Jika muncul tulisan seperti `{"success":true,"data":{"pong":true…}}`, server siap.

---

## B. Menghubungkan tampilan dengan server

1. Unduh `smapatispa-nexora.zip` → klik kanan → **Ekstrak Semua…** (*Extract All*) → **Ekstrak**. Windows membuat folder bernama **`smapatispa-nexora`**.
2. Buka folder **`smapatispa-nexora`** → folder **`js`** → klik kanan **`config.js`** → **Buka dengan → Notepad**.
3. Ganti `https://script.google.com/macros/s/XXXX/exec` dengan URL `/exec` dari langkah A-8. Hasilnya seperti:

   ```js
   window.NEXORA_CONFIG = {
     GAS_URL: 'https://script.google.com/macros/s/AKfycb...panjang.../exec'
   };
   ```
4. **Simpan** (Ctrl+S) dan tutup Notepad. Hanya file ini yang perlu diubah.

---

## C. Mengunggah tampilan ke GitHub Pages

> Gunakan **terminal**, jangan fitur *Upload files* di situs GitHub — fitur itu meratakan folder `css/` dan `js/` sehingga tampilan rusak.

**Istilah singkat:** *repository* = folder proyek di GitHub · *commit* = simpan versi · *push* = kirim ke GitHub · *branch* = jalur versi (kita pakai `main`).

### C-1. Pasang Git (sekali saja)
- Windows: unduh dari **https://git-scm.com/download/win**, pasang dengan pilihan bawaan.
- Cek di **PowerShell**: `git --version` → muncul nomor versi.

### C-2. Akun & identitas
1. Daftar di **https://github.com** (username menjadi bagian alamat situs: `username.github.io`).
2. Di PowerShell (sekali seumur komputer):
   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email-akun-github@contoh.com"
   ```

### C-3. Buat repository
GitHub → tombol **＋** → **New repository** → nama misalnya `nexora` → pilih **Public** → **jangan** centang README/.gitignore/license → **Create repository**. Biarkan halamannya terbuka.

### C-4. Masuk ke folder yang BENAR
Folder kerja adalah **`smapatispa-nexora`** hasil ekstrak (yang berisi `index.html`). Cara cepat: buka folder itu di File Explorer → klik address bar → ketik `powershell` → Enter.

Periksa isinya:
```powershell
dir
```
Harus terlihat **`index.html`**, folder **`css`**, **`js`**, **`assets`**. Jika yang terlihat justru satu folder `smapatispa-nexora` lagi, ketik `cd smapatispa-nexora` dan periksa ulang. **Jangan lanjut sebelum `index.html` terlihat.**

### C-5. Kirim ke GitHub (satu per satu)
```bash
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/nexora.git
git push -u origin main
```
- Perhatikan **titik** pada `git add .`
- Ganti `USERNAME` dan `nexora` sesuai milik Anda.
- Saat diminta *Password*, tempel **Personal Access Token** (bukan sandi GitHub). Layar memang **tidak menampilkan apa pun** saat menempel — itu normal, tekan Enter.
- Membuat token: **https://github.com/settings/tokens** → *Generate new token (classic)* → centang **repo** → *Generate* → salin `ghp_...` (hanya tampil sekali).
- Berhasil bila muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### C-6. Aktifkan GitHub Pages
Repository → **Settings** → **Pages** → *Source*: **Deploy from a branch** → Branch: **main** / **(root)** → **Save** → centang **Enforce HTTPS**. Tunggu 1–2 menit, muncul alamat **`https://USERNAME.github.io/nexora/`**. Buka alamat itu — halaman masuk NEXORA tampil.

---

## D. Pengaturan pertama (di aplikasi)

1. Masuk sebagai **Guru & Staf** → NIP/Username **`admin`** → sandi **`Admin#2026`** → ganti kata sandi.
2. Menu **Identitas Aplikasi**:
   - **Alamat aplikasi (URL)** → klik **Pakai alamat ini** (wajib, untuk kode QR verifikasi surat & tautan di WhatsApp).
   - Unggah **logo** (dibuat versi mini otomatis), atur **warna**, **kop surat**, **awal periode poin** → **Simpan Identitas**.
3. **Coba dulu dengan data contoh** memakai akun di bawah. Setelah yakin, **hapus data contoh**: buka editor Apps Script → pilih fungsi **`hapusDataContoh`** → ▶ Jalankan.
4. Menu **Pengguna & Data Induk → Impor Excel**, berurutan: **1. Kelas → 2. Guru & Staf → 3. Siswa**. Unduh templat di jendela impor, isi, lalu unggah. Setelah impor, klik **Lihat akun baru → Unduh Excel** dan bagikan kata sandi awal secara pribadi (hanya tampil sekali; pengguna wajib menggantinya saat masuk pertama).
   - Akun **orang tua** memakai **NISN anak** dengan kata sandi tersendiri.
   - Wali kelas otomatis mendapat peran *Wali Kelas* saat ditetapkan di data kelas. Satu guru boleh memiliki beberapa peran (mis. BK + Wali Kelas) dan bisa berganti peran di aplikasi.
5. Akun **Kepala Sekolah** → menu **Lainnya → Tanda Tangan Elektronik** untuk menggambar/mengunggah tanda tangan (opsional; tanpa itu surat tetap sah dengan kode QR).
6. **WhatsApp (kapan pun, tanpa deploy ulang):** daftar di **https://fonnte.com** → hubungkan nomor WA sekolah → salin **Token**. Di aplikasi (admin) → **WA & Email** → tempel token → nyalakan saklar **WhatsApp** → **Simpan** → **Kirim Uji**. Token disimpan di *Script Properties* server dan tidak pernah tampil utuh di aplikasi.

### Akun data contoh

| Peran | Pilih tab | ID | Kata sandi |
|---|---|---|---|
| Admin | Guru & Staf | `admin` | `Admin#2026` (wajib diganti) |
| Guru BK | Guru & Staf | `bk1` atau `bk2` | `Nexora#2026` |
| Kesiswaan | Guru & Staf | `kesiswaan` | `Nexora#2026` |
| Wali Kelas (+ Piket) | Guru & Staf | `wali1` (dua peran) / `wali2` | `Nexora#2026` |
| Guru Piket | Guru & Staf | `piket` | `Nexora#2026` |
| Kepala Sekolah | Guru & Staf | `kepsek` | `Nexora#2026` |
| Siswa | Siswa | `0081234567` | `Siswa#2026` |
| Orang Tua | Orang Tua | `0081234567` | `Ortu#2026` |

---

## E. Memperbarui aplikasi nanti

**Server (file .gs) berubah:** tempel kode baru di editor → Simpan → **Terapkan → Kelola penerapan** → ikon ✏ **Edit** → *Versi*: **Versi baru** → **Terapkan**. URL `/exec` **tetap sama** (jangan membuat *Penerapan baru*, karena URL-nya akan berganti).

**Tampilan berubah:** salin file baru ke folder `smapatispa-nexora` (jangan ubah lagi `js/config.js` kecuali URL server berganti), lalu di PowerShell dari folder itu:
```bash
git add .
git commit -m "Pembaruan"
git push
```
Tunggu 1–2 menit. Bila tampilan lama masih muncul, tekan **Ctrl+Shift+R** atau tutup-buka aplikasi.

---

## F. Mengatasi masalah

| Yang terlihat | Penyebab | Solusi |
|---|---|---|
| *URL server belum diisi di js/config.js* | `config.js` masih `XXXX` | Lakukan bagian B, lalu `git add .` → `commit` → `push` |
| *Server membalas tidak sesuai* / gagal masuk terus | Akses penerapan bukan "Siapa saja", atau URL salah | Ulangi A-8, pastikan URL berakhiran `/exec` |
| Situs GitHub **404** | `git init` dijalankan di folder yang salah | Lihat C-4: ulangi dari folder yang berisi `index.html`, lalu `git push -u origin main --force` |
| Tampilan polos tanpa warna | File CSS/JS tidak di dalam folder `css/`/`js/` | Jangan pakai *Upload files*; gunakan terminal |
| *Password authentication is not supported* | GitHub butuh token | Buat Personal Access Token (C-5) |
| Akun terkunci 15 menit | 5× salah sandi | Tunggu 15 menit atau admin **Reset sandi** |
| WA tidak terkirim | Token/saklar/kuota Fonnte | Admin → **WA & Email** → lihat *Antrean* & *Galat terakhir* → **Proses sekarang** |
| Email tidak terkirim | Kuota harian Gmail habis | Lihat *Kuota hari ini* di menu WA & Email; antrean dicoba ulang otomatis |
| Surat tanpa PDF | Pembuatan PDF gagal sesaat | Buka surat → **Buat ulang PDF** |
| Ingin memeriksa server | — | Di editor jalankan **`cekKesehatan`** lalu baca log |

---

## G. Catatan keamanan & kinerja

- **Jangan membagikan** kedua spreadsheet maupun folder Drive kepada siapa pun. Semua akses dilakukan lewat aplikasi sesuai peran.
- Catatan konseling hanya dapat dibuka **Guru BK**; setiap pembukaan/penulisan tercatat di spreadsheet rahasia. Admin dan Kepala Sekolah tidak dapat membacanya.
- Laporan **anonim** tidak menyimpan identitas pelapor sama sekali; pelapor memantau lewat **kode lacak**.
- Jadwal konseling yang dilihat siswa hanya menampilkan "Terisi" tanpa nama siswa lain.
- Kata sandi disimpan sebagai hash bergaram; sesi berlaku 12 jam; 5× salah sandi mengunci akun 15 menit.
- Aplikasi dibuat cepat di jaringan 4G: satu panggilan saat masuk langsung membawa data layar pertama, data tersimpan di perangkat sehingga pindah menu instan (tanpa memuat ulang), server memakai cache berlapis, dan pencatatan pelanggaran tampil seketika lalu disinkronkan di latar.
