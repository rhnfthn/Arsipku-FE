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
  arsipKlasifikasi?: string | null;
  /** Lokasi fisik asli yang disimpan pada tahap pemberkasan. */
  lokasiAwal?: string | null;
  arsipTindakanPenyusutan?: string | null;
  tanggalRetensiAktifHabis: string | null;
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
  approvedAt: string | null;
  tuApprovedAt: string | null;
  tuFinalApprovedAt: string | null;
  receivedAt: string | null;
  arrangedAt: string | null;
  beritaAcaraUrl: string | null;
  beritaAcaraNomor?: string | null;
  bacPihakPertamaPersnum?: number | null;
  bacPihakPertamaName?: string | null;
  bacPihakPertamaJabatan?: string | null;
  bacPihakKeduaPersnum?: number | null;
  bacPihakKeduaName?: string | null;
  bacPihakKeduaJabatan?: string | null;
  bacSignedAt?: string | null;
  bacPihakKeduaSignedAt?: string | null;
  lokasiPenataan: string | null;
  rak: string | null;
  baris: string | null;
  kolom: string | null;
  labelPenataan: string | null;
  keteranganPenataan: string | null;
  fotoPenataan: string | null;
  createdAt: string;
  updatedAt: string;
  currentApprovalLevel?: number;
  totalApprovalLevels?: number;
  approvalLevels?: Array<{
    id: string;
    atasanPersnum: number;
    atasanName: string;
    atasanPositionText: string | null;
    urutan: number;
    status: string;
    verifiedAt: string | null;
    catatan: string | null;
  }>;
  tuApprovalLevels?: Array<{
    persnum: number;
    name: string;
    jabatan: string;
    urutan: number;
    status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
    verifiedAt: string | null;
    catatan: string | null;
  }>;
  currentTuApprovalLevel?: number;
  totalTuApprovalLevels?: number;
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
  klasifikasi?: string;
  page?: number;
  limit?: number;
}

export interface VerifikasiBerkasPayload {
  sesuai: boolean;
  catatan?: string;
}

export interface AjukanAtasanTuPayload {
  atasanTuPersnum?: string;
  atasanTuList?: Array<{
    persnum: string;
    name: string;
    jabatan: string;
  }>;
  bacPihakKeduaPersnum: string;
  bacPihakKeduaName: string;
  bacPihakKeduaJabatan: string;
  bacTembusan?: Array<{
    persnum: string;
    name: string;
    jabatan: string;
  }>;
}

export interface KembalikanPayload {
  alasan: string;
}

// ─── Atasan TU ───
export interface SetujuiPenerimaanPayload {
  catatanVerifikasi?: string;
}

export interface TolakPenerimaanPayload {
  alasanPenolakan: string;
}

export interface SetujuiTerakhirPayload {
  catatanVerifikasi?: string;
}

// ─── Penataan Arsip ───
export interface SelesaiPenataanPayload {
  lokasi?: string;
  rak?: string;
  baris?: string;
  kolom?: string;
  keterangan?: string;
  fotoPenataan?: string;
}
