/** Tipe data untuk modul Pemindahan Arsip Aktif ke Inaktif. */

export type TransferActiveToInactiveStatus =
  | 'DRAFT'
  | 'MENUNGGU_VERIFIKASI_ATASAN'
  | 'DITOLAK_ATASAN'
  | 'DISETUJUI_ATASAN'
  | 'MENUNGGU_VERIFIKASI_TERAKHIR'
  | 'DITOLAK_VERIFIKASI_TERAKHIR'
  | 'DISETUJUI_VERIFIKASI_TERAKHIR'
  | 'USUL_PINDAH_DIKIRIM'
  | 'SIAPKAN_BERKAS_FISIK'
  | 'DIKIRIM'
  | 'MENUNGGU_VERIFIKASI_BERKAS_FISIK'
  | 'BERKAS_FISIK_TIDAK_SESUAI'
  | 'BERKAS_FISIK_SESUAI'
  | 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU'
  | 'DITOLAK_PERSETUJUAN_TU'
  | 'DISETUJUI_PERSETUJUAN_TU'
  | 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU'
  | 'DITOLAK_PERSETUJUAN_TERAKHIR_TU'
  | 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU'
  | 'ARSIP_INAKTIF_DITERIMA'
  | 'PENATAAN_ARSIP_INAKTIF'
  | 'SELESAI';

export interface TransferActiveToInactive {
  id: string;
  nomorUsulan: string;
  tanggalUsulan: string;
  sekretarisPersnum: number;
  sekretarisName: string;
  divisiId: number | null;
  divisiName: string | null;
  atasanPersnum: number;
  atasanName: string;
  atasanPositionId: number | null;
  tuPersnum: number | null;
  tuName: string | null;
  atasanTuPersnum: number | null;
  atasanTuName: string | null;
  arsipId: string;
  arsipPerihal: string;
  arsipKode: string | null;
  tanggalRetensiAktifHabis: string | null;
  keterangan: string | null;
  status: TransferActiveToInactiveStatus;
  rejectedNote: string | null;
  verifyNote: string | null;
  approvedBy: number | null;
  approvedAt: string | null;
  finalVerifiedBy: number | null;
  finalVerifiedAt: string | null;
  finalVerifyNote: string | null;
  beritaAcaraUrl: string | null;
  beritaAcaraNomor: string | null;
  tanggalDikirim: string | null;
  physicalChecklist: Record<string, boolean> | null;
  physicalVerifiedBy: number | null;
  physicalVerifiedAt: string | null;
  physicalVerificationNote: string | null;
  tuApprovedBy: number | null;
  tuApprovedAt: string | null;
  tuFinalApprovedBy: number | null;
  tuFinalApprovedAt: string | null;
  receivedAt: string | null;
  arrangedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransferFilter {
  page?: number;
  limit?: number;
  status?: TransferActiveToInactiveStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface TransferSummary {
  total: number;
  menungguVerifikasi: number;
  disetujui: number;
  dikirim: number;
  selesai: number;
  menungguFinal?: number;
  menungguBerkas?: number;
  berkasSesuai?: number;
  diterima?: number;
  menungguTU?: number;
  menungguFinalTU?: number;
  disetujuiTU?: number;
}

export interface CreateTransferPayload {
  tanggalUsulan?: string;
  atasanPersnum: number;
  atasanName?: string;
  atasanPositionId?: number;
  arsipId: string;
  arsipPerihal?: string;
  arsipKode?: string;
  tanggalRetensiAktifHabis?: string;
  keterangan?: string;
  submit?: boolean;
}

export interface UpdateTransferPayload {
  atasanPersnum?: number;
  atasanName?: string;
  atasanPositionId?: number;
  arsipId?: string;
  arsipPerihal?: string;
  arsipKode?: string;
  tanggalRetensiAktifHabis?: string;
  keterangan?: string;
}

export interface ApproveTransferPayload {
  verifyNote?: string;
  needFinalVerification?: boolean;
}

export interface RejectTransferPayload {
  rejectedNote: string;
}

export interface FinalVerifyTransferPayload {
  finalVerifyNote?: string;
}

export interface VerifyPhysicalPayload {
  checklist?: Record<string, boolean>;
  physicalVerificationNote?: string;
  sesuai: boolean;
}

export interface TuApprovePayload {
  note?: string;
}

export interface FinalApprovalTuPayload {
  note?: string;
}

/** Opsi atasan managerial dari endpoint /org-data/pengirim/managerial. */
export interface AtasanManagerialOption {
  position: number;
  persnum: number;
  name: string;
  positionText: string;
}

/** Opsi arsip dengan retensi aktif habis. */
export interface ArsipRetensiHabisOption {
  id: string;
  judulBerkas: string;
  kodeBerkas: string | null;
  tanggalRetensiAktifBerakhir: string | null;
  kategoriBerkas: string | null;
}