# ArsipKu - E-Office & Mail Tracking System

Selamat datang di repositori **ArsipKu**, sebuah sistem persuratan elektronik (e-office) berbasis **Nuxt 4** dan **Vue 3** yang dirancang untuk mengelola siklus hidup naskah dinas, penomoran otomatis, hingga tanda tangan elektronik (TTE/BSrE). 

Dokumen ini ditujukan bagi *Next Developer* untuk memahami struktur dan modul-modul yang ada di dalam proyek ini.

---

## 🏗️ Teknologi Utama

- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3, Composition API)
- **UI Library**: [@nuxt/ui](https://ui.nuxt.com/) (berbasis Tailwind CSS & Headless UI) + [Lucide Vue](https://lucide.dev/) untuk ikon
- **Editor Teks**: [TinyMCE](https://www.tiny.cloud/) (digunakan untuk text-editor surat dinas)
- **Pemrosesan Dokumen**: `jspdf`, `html2pdf.js`, `docx`, dan `xlsx`
- **Tanda Tangan Digital**: Integrasi BSrE (Balai Sertifikasi Elektronik) & QR Code generator
- **Validasi Data**: [Zod](https://zod.dev/)

---

## 📂 Struktur Modul (Routing & Pages)

Aplikasi ArsipKu membagi domain fitur (terutama di dalam `app/pages/`) menjadi beberapa sub-modul besar:

### 1. 🔐 Core & Authentication
- **`autharsipku/`**: Modul autentikasi (Login) dan penanganan *session token*. Terintegrasi dengan middleware untuk RBAC (Role-Based Access Control).
- **`switch/`**: Modul untuk *Role/Organization Switcher*. Digunakan apabila satu akun terkait dengan beberapa jabatan (contoh: PLT/PLH).
- **`profil/`**: Manajemen profil akun yang sedang login.

### 2. 📊 Dashboard & Monitoring
- **`beranda/`**: Halaman utama / *Dashboard* yang menampilkan metrik summary surat (Belum Dibaca, Sedang Diproses, dsb), grafik statistik, serta *quick actions*.

### 3. ✉️ Korespondensi (Modul Utama)
Modul ini adalah jantung dari aplikasi persuratan (`korespondensi/`), menangani seluruh siklus naskah dinas:
- **`tulis/`**: Modul pembuatan berbagai jenis naskah (Tulis Konsep). Terdiri dari:
  - **Surat Dinas Internal (SDI)**
  - **Surat Dinas Eksternal (SDE)**
  - **Nota Dinas**
  - **Kajian**
  - **Disposisi**, dsb.
- **`kotak-masuk/`**: Inbox persuratan (dokumen yang dikirimkan ke *current position*).
- **`terkirim/`**: Daftar log naskah dan dokumen yang berhasil dikirim. Disini dapat melacak riwayat transmisi dokumen.
- **`tertunda/`**: Dokumen yang masih membutuhkan *approval* (persetujuan) atau tanda tangan secara hierarkis sebelum berstatus "Final".
- **`draf/`**: Naskah yang sudah dibuat/diketik tapi belum diselesaikan (disimpan sementara).

### 4. 🔤 Penomoran & Registrasi
Sistem *booking* dan validasi nomor urut surat resmi:
- **`usulan-penomoran/`**: Pengajuan nomor naskah dinas baru.
- **`persetujuan-penomoran/`**: Alur *approval* untuk memberikan nomor unik ke surat yang diajukan.
- **`penomoran/`**: Daftar list dan manajemen master seri nomor naskah.

### 5. ✍️ Digital Signature (Tanda Tangan)
- **`digsig/`**: Pengaturan dan integrasi Tanda Tangan Elektronik.
- **`penandatangan/`**: Konfigurasi siapa dan bagaimana penandatanganan dokumen diatur (Passphrase BSrE, QR Code scan, atau TTD Basah).

### 6. 🗃️ Manajemen Dokumen & Master Data
- **`berkas/`** & **`lampiran/`**: Penanganan berkas historis, file sisipan naskah, dan repositori lokal (storage).
- **`naskah-dinas/`** & **`template/`**: Pengelolaan *template* surat dinas standar perusahaan.
- **`master/`** & **`master-data/`**: Manajemen referensi data statis (Organisasi, Daftar Karyawan, Sifat Surat, Klasifikasi Arsip, dsb).
- **`titelatur/`**: Pengelolaan *Naming Convention* atau struktur nama jabatan/gelar di sistem persuratan.

### 7. ⚙️ Pengaturan & Administrator
- **`konfigurasi-sistem/`**: Master setting aplikasi (maintenance, config SMTP, integrasi, dsb).
- **`delegasi/`**: Pendelegasian wewenang akun (contoh: surat di-forward secara otomatis ke wakil apabila sakit/cuti).
- **`label/`**: Pengelolaan kategori/label kustom untuk menandai surat (seperti tagging di Gmail).

### 8. 🔍 Pencarian & Pelaporan
- **`search/`**: Global Search (Pencarian Naskah) yang melakukan filtering multi-dimensi (No Surat, Perihal, Tgl, Kategori).
- **`laporan/`**: Modul pelaporan (*reporting*) untuk meng-generate rekapitulasi surat ke bentuk PDF/Excel/Chart.

### 9. 🛠️ Utilitas Tambahan
- **`penyingkat-tautan/`**: Internal link shortener (sejenis bit.ly) untuk membagikan tautan naskah yang panjang.
- **`faq/`**: Pusat bantuan dan panduan penggunaan E-Office.

---

## 🛠️ Panduan Development

### Instalasi & Menjalankan Aplikasi Lokal

Pastikan Anda memiliki [Node.js](https://nodejs.org/) (versi LTS terbaru direkomendasikan).

1. Install seluruh *dependencies*:
   ```bash
   npm install
   # atau yarn install / pnpm install
   ```

2. Jalankan server lokal untuk development:
   ```bash
   npm run dev
   ```

3. Server akan berjalan pada `http://localhost:3000`.

### Build untuk Produksi

```bash
npm run build
```
Hasil build akan berada pada target Nuxt default (folder `.output/`). Anda dapat menjalankannya dengan `node .output/server/index.mjs`.

### Peta Arsitektur `Composables` Penting

Project ini sangat mengandalkan Vue Composables (`app/composables/`) untuk *logic abstraction* dan pemanggilan API:
- **`useInbox.ts`**: Menangani logic list & detail kotak masuk, kotak keluar, dan tracking alur persuratan (termasuk mapping *timestamp* dan *flow* persetujuan).
- **`useKajian.ts` / `useSdi.ts`**: Mengatur logic Draf, Validasi, Pembuatan PDF Viewer, & Submit naskah terkait.
- **`useApi.ts` / `useFetch.ts`**: Wrapper utama untuk Axios/ofetch dengan *interceptor* yang menyisipkan JWT Bearer Token secara otomatis.

---

**Selamat Bekerja!**  
Semoga panduan ini mempermudah proses transisi dan navigasi di dalam arsitektur ArsipKu.
