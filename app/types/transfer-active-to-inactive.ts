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
  | 'MENUNGGU_TTD_PIHAK_KEDUA'
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
  atasanPositionText?: string | null;
  currentApprovalLevel: number;
  totalApprovalLevels: number;
  tuPersnum: number | null;
  tuName: string | null;
  atasanTuPersnum: number | null;
  atasanTuName: string | null;
  arsipId: string;
  arsipPerihal: string;
  arsipKode: string | null;
  arsipKlasifikasi?: string | null;
  arsipTindakanPenyusutan?: string | null;
  tanggalRetensiAktifHabis: string | null;
  arsipIds: Array<{
    id: string;
    perihal: string;
    kode: string | null;
    tanggalRetensiHabis: string | null;
  }> | null;
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
  bacPihakPertamaPersnum?: number | null;
  bacPihakPertamaName?: string | null;
  bacPihakPertamaJabatan?: string | null;
  bacPihakKeduaPersnum?: number | null;
  bacPihakKeduaName?: string | null;
  bacPihakKeduaJabatan?: string | null;
  bacTembusan?: Array<{
    persnum: number;
    name: string;
    jabatan: string;
  }> | null;
  bacSignedAt?: string | null;
  bacSignedBy?: number | null;
  bacSignatureQr?: string | null;
  bacPihakKeduaSignedAt?: string | null;
  bacPihakKeduaSignedBy?: number | null;
  bacPihakKeduaSignatureQr?: string | null;
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
  /** Daftar level approval (dari GET /:id). */
  approvalLevels?: ApprovalLevel[];
  /** Daftar level approval TU berjenjang (kolom JSON di entity). */
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

export interface BacTembusanListItem {
  id: string;
  nomorUsulan: string;
  arsipPerihal: string;
  arsipKode: string | null;
  tanggalUsulan: string;
  status: TransferActiveToInactiveStatus;
  beritaAcaraNomor: string | null;
  bacPihakPertamaName: string | null;
  bacPihakPertamaJabatan: string | null;
  bacPihakKeduaName: string | null;
  bacPihakKeduaJabatan: string | null;
  bacPihakKeduaSignedAt: string | null;
  bacSignedAt: string | null;
  bacStatus: 'MENUNGGU_TANDA_TANGAN' | 'SUDAH_DITANDATANGANI';
  beritaAcaraUrl: string | null;
}

/** Level approval berjenjang. */
export interface ApprovalLevel {
  id: string;
  transferId: string;
  atasanPersnum: number;
  atasanName: string;
  atasanPositionId: number | null;
  atasanPositionText: string | null;
  urutan: number;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
  verifiedAt: string | null;
  catatan: string | null;
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

/** Item atasan untuk multi-select. */
export interface AtasanItemPayload {
  persnum: number;
  name?: string;
  positionId?: number;
  positionText?: string;
}

/** Item arsip untuk multi-select. */
export interface ArsipItemPayload {
  id: string;
  perihal?: string;
  kode?: string;
  tanggalRetensiHabis?: string;
}

export interface CreateTransferPayload {
  tanggalUsulan?: string;
  atasanList: AtasanItemPayload[];
  arsipList: ArsipItemPayload[];
  keterangan?: string;
  submit?: boolean;
}

export interface UpdateTransferPayload {
  atasanList?: AtasanItemPayload[];
  arsipList?: ArsipItemPayload[];
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
