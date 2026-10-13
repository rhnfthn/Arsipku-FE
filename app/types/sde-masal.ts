/**
 * Type data untuk fitur SDE Masal (Surat Dinas Eksternal Massal).
 */

export interface SdeMasalConcept {
  id?: string;
  judul?: string;
  tanggalKonsep: string;
  klasifikasiId: string;
  klasifikasiName: string;
  pengirimId: string;
  pengirimName: string;
  sifat?: string;
  perihal?: string;
  defaultTertuju?: string;
  parentNaskahId?: string;
  atasNama?: string | null;
  atasNamaPositionId?: string | null;
}

export interface SdeMasalFolder {
  id: string;
  judul: string;
  parentNaskahId: string | null;
  tanggal: string | null;
  klasifikasi: string | null;
  klasifikasiText: string | null;
  pengirimId: string | null;
  pengirimName: string | null;
  sifat: string | null;
  recipientType?: 'EXTERNAL' | 'INTERNAL';
  atasNama: string | null;
  atasNamaPositionId: string | null;
  kontenTemplate: string | null;
  dynamicVariables: string[];
  originalFileUrl: string | null;
  signOption: 'digsig' | 'qr_only' | 'ttd_basah' | null;
  status:
    | 'DRAFT'
    | 'MENUNGGU_PENGIRIM'
    | 'DIKEMBALIKAN'
    | 'DIFINALISASI'
    | 'MENUNGGU_VERIFIKASI'
    | 'SEBAGIAN_TERKIRIM'
    | 'SIAP_KIRIM'
    | 'TERKIRIM'
    | 'DITOLAK';
  createdBy?: string | null;
  createdByName?: string | null;
  createdByPositionText?: string | null;
  /** Penandatangan akhir saat folder sudah masuk tahap pengiriman. */
  finalSenderName?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SdeMasalFolderItem {
  id: string;
  folderId: string;
  naskahId: string | null;
  nomor: string | null;
  perihal: string;
  penerima: string;
  emailTertuju?: string | null;
  emailCc?: string | null;
  emailBcc?: string | null;
  status: string;
  statusVerifikasi?: string;
  verifikators?: SdeMasalVerifikator[] | null;
  submittedAt?: string | null;
  recipient?: Record<string, any> | null;
  finalPdf: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface SdeMasalAttachmentRef {
  fileName: string;
  key: string;
  sha256?: string;
  size?: number;
  url?: string;
}

export interface SdeMasalPenerima {
  id?: string;
  variables?: Record<string, string>;
  no?: number;
  persnum?: string;
  recipientType?: 'EXTERNAL' | 'INTERNAL';
  employeeIdInput?: string;
  employeeId?: string;
  employeePersnum?: string;
  employeePositionId?: string;
  employeeName?: string;
  employeePositionText?: string;
  employeeOrganizationText?: string;
  employeeEmail?: string | null;
  nama?: string;
  jabatan?: string;
  tertuju: string;
  alamat: string | null;
  kota: string | null;
  kodePos: string | null;
  jabatanPenerima?: string | null;
  keterangan: string | null;
  // Field data ASE
  perihal?: string;
  idTertuju?: string;
  email?: string;
  tembusan?: string;
  tembusanInternal?: string;
  tembusanEksternal?: string;
  isRevision?: number | boolean;
  emailTertuju?: string;
  emailCc?: string;
  emailBcc?: string;
  // Field skema keuangan / tagihan PINP
  jumlahTagihanIdr?: string;
  jumlahTagihanUsd?: string;
  namaCro?: string;
  emailCro?: string;
  jabatanSigner?: string;
  namaSigner?: string;
  // Field skema umum / tagihan PJNP
  jumlahLampiran?: string;
  alamatPenerima?: string | null;
  panggilanPenerima?: string | null;
  nominalRupiah?: string | null;
  nominalDolar?: string | null;
  tembusan1?: string | null;
  tembusan2?: string | null;
  statusVerifikasi?: string;
  // String tetap didukung untuk kompatibilitas upload lampiran per-item lama.
  lampiran?: string | SdeMasalAttachmentRef[] | null;
  lampiranKey?: string | null;
  isValid: boolean;
  validationMessage?: string;
}

export interface SdeMasalTemplate {
  skema: string;
  versi: string;
  konten: string;
}

export interface SdeMasalVerifikator {
  urutan: number;
  persnum: string;
  position: string;
  nama: string;
  jabatan: string;
  status: 'pending' | 'waiting' | 'verified' | 'rejected';
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  catatan?: string | null;
}

export interface SdeMasalItem {
  id: string;
  folderId: string | null;
  recipientData: string | null;
  statusVerifikasi:
    | 'MENUNGGU'
    | 'MENUNGGU_VERIFIKASI'
    | 'TERKIRIM'
    | 'TERVERIFIKASI'
    | 'DITOLAK'
    | 'GAGAL';
  naskahId: string | null;
  errorMessage: string | null;
  verifikators?: SdeMasalVerifikator[] | null;
  currentVerifikatorUrutan?: number | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Field turunan (dari enrichment backend: folder + recipient)
  folder?: SdeMasalFolder | null;
  recipient?: Record<string, any> | null;
  perihal?: string;
  tertuju?: string;
  klasifikasiName?: string | null;
  klasifikasiId?: string | null;
  pengirimName?: string | null;
  tanggalKonsep?: string | null;
}

export interface SdeMasalFilter {
  search?: string;
  statusVerifikasi?: string;
  klasifikasiId?: string;
  folderId?: string;
  tahun?: string;
  jenisTemplate?: string;
  page?: number;
  limit?: number;
}

export interface SdeMasalSummary {
  total: number;
  menunggu: number;
  terkirim: number;
  terverifikasi: number;
  ditolak: number;
  gagal: number;
}

export interface SdeMasalWizardState {
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  currentStep: number;
}
