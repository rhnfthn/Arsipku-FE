/**
 * Type data untuk fitur SDE Masal (Surat Dinas Eksternal Massal).
 */

export interface SdeMasalConcept {
  id?: string;
  tanggalKonsep: string;
  klasifikasiId: string;
  klasifikasiName: string;
  pengirimId: string;
  pengirimName: string;
  sifat?: string;
  perihal?: string;
  defaultTertuju?: string;
  parentNaskahId?: string;
}

export interface SdeMasalPenerima {
  variables?: Record<string, string>;
  no?: number;
  persnum?: string;
  nama?: string;
  jabatan?: string;
  tertuju: string;
  alamat: string | null;
  kota: string | null;
  kodePos: string | null;
  jabatanPenerima: string | null;
  keterangan: string | null;
  // Field data ASE
  perihal?: string;
  idTertuju?: string;
  email?: string;
  tembusan?: string;
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
  jabatanPenerima?: string;
  alamatPenerima?: string;
  panggilanPenerima?: string;
  nominalRupiah?: string;
  nominalDolar?: string;
  tembusan1?: string;
  tembusan2?: string;
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
  conceptId: string | null;
  tanggalKonsep: string | null;
  klasifikasiId: string | null;
  klasifikasiName: string | null;
  pengirimId: string | null;
  pengirimName: string | null;
  sifatSurat: string | null;
  skemaTemplate: string | null;
  versiTemplate: string | null;
  perihal: string;
  tertuju: string;
  alamat: string | null;
  kota: string | null;
  kodePos: string | null;
  jabatanPenerima: string | null;
  isiRingkasan: string | null;
  statusVerifikasi: 'MENUNGGU' | 'MENUNGGU_VERIFIKASI' | 'TERKIRIM' | 'TERVERIFIKASI' | 'DITOLAK' | 'GAGAL';
  jenisTemplate: string | null;
  lampiranUrl: string | null;
  originalFileUrl: string | null;
  parentNaskahId: string | null;
  naskahId: string | null;
  nomorSurat: string | null;
  errorMessage: string | null;
  verifikators?: SdeMasalVerifikator[] | null;
  currentVerifikatorUrutan?: number | null;
  submittedAt?: string | null;
  // Field data ASE
  idTertuju: string | null;
  email: string | null;
  tembusan: string | null;
  isRevision: number | boolean;
  emailTertuju: string | null;
  emailCc: string | null;
  emailBcc: string | null;
  // Field skema keuangan / tagihan PINP
  jumlahTagihanIdr: string | null;
  jumlahTagihanUsd: string | null;
  namaCro: string | null;
  emailCro: string | null;
  jabatanSigner: string | null;
  namaSigner: string | null;
  // Field skema umum / tagihan PJNP
  jumlahLampiran: string | null;
  jabatanPenerima: string | null;
  alamatPenerima: string | null;
  panggilanPenerima: string | null;
  nominalRupiah: string | null;
  nominalDolar: string | null;
  tembusan1: string | null;
  tembusan2: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SdeMasalFilter {
  search?: string;
  statusVerifikasi?: string;
  klasifikasiId?: string;
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

export interface SdeMasalUploadResult {
  total: number;
  success: number;
  failed: number;
  items: SdeMasalItem[];
}

export interface SdeMasalWizardState {
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  currentStep: number;
}
