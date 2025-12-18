// types/klasifikasi.ts

export interface Klasifikasi {
  id: string;
  company: string;
  klasifikasi: string; // Kode Klasifikasi (misal: "AUD")
  klasifikasi_text: string; // Nama Klasifikasi (misal: "AUDIT")
  deskripsi: string | null; // Deskripsi tambahan
  id_parent: string;
  active: number;
}

export interface KlasifikasiResponse {
  success: boolean;
  data: Klasifikasi[];
}
