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
  parentNaskahId?: string;
}

export interface SdeMasalPenerima {
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
  isValid: boolean;
  validationMessage?: string;
}

export interface SdeMasalTemplate {
  skema: string;
  versi: string;
  konten: string;
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
  statusVerifikasi: 'MENUNGGU' | 'TERKIRIM' | 'TERVERIFIKASI' | 'DITOLAK' | 'GAGAL';
  jenisTemplate: string | null;
  lampiranUrl: string | null;
  originalFileUrl: string | null;
  parentNaskahId: string | null;
  naskahId: string | null;
  nomorSurat: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SdeMasalFilter {
  search?: string;
  statusVerifikasi?: string;
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
