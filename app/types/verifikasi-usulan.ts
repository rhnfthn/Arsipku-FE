/** Tipe data untuk dashboard Verifikasi Usulan (gabungan inaktif + aktif ke inaktif). */

export type JenisUsulan = 'inaktif' | 'aktif_ke_inaktif';

export type VerifikasiStatus =
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

/** Usulan gabungan dengan field jenis untuk membedakan sumber data. */
export interface VerifikasiUsulanItem {
  id: string;
  jenis: JenisUsulan;
  nomorUsulan: string;
  tanggalUsulan: string;
  sekretarisName: string;
  sekretarisPersnum?: number;
  atasanName: string;
  atasanPersnum?: number;
  arsipId: string;
  arsipPerihal: string;
  arsipKode?: string | null;
  arsipKlasifikasi?: string | null;
  arsipKlasifikasiKode?: string | null;
  arsipTindakanPenyusutan?: string | null;
  tanggalRetensiAktifHabis?: string | null;
  keterangan?: string | null;
  status: VerifikasiStatus;
  rejectedNote?: string | null;
  verifyNote?: string | null;
  finalVerifyNote?: string | null;
  beritaAcaraUrl?: string | null;
  beritaAcaraNomor?: string | null;
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
  approvedAt?: string | null;
  finalVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Multi-level approval fields. */
  currentApprovalLevel?: number;
  totalApprovalLevels?: number;
  /** Daftar level approval (dari detail). */
  approvalLevels?: VerifikasiApprovalLevel[];
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
  /** True jika user login sedang giliran verifikasi. */
  isCurrentTurn?: boolean;
}

/** Level approval berjenjang (untuk verifikasi-usulan). */
export interface VerifikasiApprovalLevel {
  id: string;
  atasanPersnum: number;
  atasanName: string;
  atasanPositionText: string | null;
  urutan: number;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
  verifiedAt: string | null;
  catatan: string | null;
}

export interface VerifikasiFilter {
  jenis?: JenisUsulan | '';
  status?: VerifikasiStatus | '';
  search?: string;
  klasifikasi?: string;
  startDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface VerifikasiSummary {
  menungguVerifikasi: number;
  menungguVerifikasiTerakhir: number;
  disetujui: number;
  ditolak: number;
  selesai: number;
  total: number;
}

export interface VerifikasiActionPayload {
  catatanVerifikasi?: string;
}

export interface RejectPayload {
  alasanPenolakan: string;
}
