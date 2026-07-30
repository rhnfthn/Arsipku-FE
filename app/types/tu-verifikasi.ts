// ==========================================
//   TU VERIFIKASI (Unit Tata Naskah)
// ==========================================
export interface TuUsulanItem {
  id: string;
  nomorUsulan: string;
  tanggalUsulan: string;
  sekretarisPersnum: number;
  sekretarisName: string;
  atasanPersnum: number;
  atasanName: string;
  arsipId: string;
  arsipPerihal: string;
  arsipKode: string | null;
  arsipIds: Array<{
    id: string;
    perihal: string;
    kode: string | null;
    tanggalRetensiHabis: string | null;
  }> | null;
  status: string;
  keterangan: string | null;
  rejectedNote: string | null;
  physicalVerificationNote: string | null;
  physicalVerifiedBy: number | null;
  physicalVerifiedAt: string | null;
  tuPersnum: number | null;
  tuName: string | null;
  atasanTuPersnum: number | null;
  atasanTuName: string | null;
  tanggalDikirim: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TuUsulanListResponse {
  data: TuUsulanItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TuFilterParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface VerifikasiBerkasPayload {
  sesuai: boolean;
  catatan?: string;
}

export interface AjukanAtasanTuPayload {
  atasanTuPersnum: string;
}

export interface KembalikanPayload {
  alasan: string;
}
