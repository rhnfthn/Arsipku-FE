// types/klasifikasi.ts
export interface Klasifikasi {
  id: string;
  company: string;
  klasifikasi: string; // Kode Klasifikasi (misal: "AUD")
  klasifikasi_text: string; // Nama Klasifikasi (misal: "AUDIT")
  nama?: string; // Alias untuk klasifikasi_text
  deskripsi: string | null; // Deskripsi tambahan
  id_parent: string;
  active: number;
  is_select: number;
  retensi_aktif_tahun: number | null;
  retensi_inaktif_tahun: number | null;
  penyusutan: string | null;
  keamanan: string | null;
  hak_akses: string | null;
  // Alias/indeks pencarian yang ditambahkan di frontend agar seluruh pemakai
  // GET klasifikasi memakai kontrak pencarian yang konsisten.
  code?: string;
  display?: string;
  search_text?: string;
}

export interface KlasifikasiResponse {
  success: boolean;
  data: Klasifikasi[];
}
