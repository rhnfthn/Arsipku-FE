/**
 * Tipe data untuk modul Usulan Pindah Arsip Inaktif.
 * Backend: arsipku-be/src/modules/usulan-pindah
 */

export type UsulanPindahStatus =
  | 'DRAFT'
  | 'MENUNGGU_VERIFIKASI_ATASAN'
  | 'DITOLAK_ATASAN'
  | 'DISETUJUI_ATASAN'
  | 'MENUNGGU_VERIFIKASI_TERAKHIR'
  | 'DITOLAK_VERIFIKASI_TERAKHIR'
  | 'DISETUJUI_VERIFIKASI_TERAKHIR'
  | 'DIKIRIM'
  | 'BERKAS_FISIK_DIPERSIAPKAN'
  | 'SELESAI';

export interface UsulanPindah {
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
  arsipId: string;
  arsipPerihal: string;
  arsipKode: string | null;
  tanggalRetensiAktifHabis: string | null;
  keterangan: string | null;
  status: UsulanPindahStatus;
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
  physicalPreparedBy: number | null;
  physicalPreparedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsulanPindahFilter {
  page?: number;
  limit?: number;
  status?: UsulanPindahStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  divisiId?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface UsulanPindahSummary {
  total: number;
  menungguVerifikasi: number;
  disetujui: number;
  selesai: number;
}

export interface CreateUsulanPindahPayload {
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

export interface ApproveUsulanPayload {
  verifyNote?: string;
  needFinalVerification?: boolean;
}

export interface RejectUsulanPayload {
  rejectedNote: string;
}

export interface FinalVerifyUsulanPayload {
  finalVerifyNote?: string;
}

export interface PreparePhysicalPayload {
  checklist?: Record<string, boolean>;
}
