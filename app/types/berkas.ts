export interface Berkas {
  id: string;
  klasifikasi: string;
  judulBerkas: string;
  hitungWaktuRetensiDari: string;
  tindakanPenyusutanAkhir: string;
  lokasi: string;
  isiRingkas: string;
  isAktif: boolean;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface BerkasResponse {
  success: boolean;
  data: Berkas[];
}

export interface BerkasCreateInput {
  klasifikasi: string;
  judulBerkas: string;
  hitungWaktuRetensiDari: string;
  tindakanPenyusutanAkhir: string;
  lokasi: string;
  isiRingkas: string;
  isAktif?: boolean;
}

// Menggunakan Partial karena saat update kita mungkin hanya mengubah sebagian field
export interface BerkasUpdateInput extends Partial<BerkasCreateInput> {}
