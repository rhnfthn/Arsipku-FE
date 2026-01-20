export interface DigsigLog {
  id: string;
  tanggal: string;
  ipAddress: string | null;
  userPersnum: number;
  userName: string;
  apiEndpoint: string;
  idNaskah: string;
  nomorNaskah: string;
  jenisNaskah: string;
  action: string;
  status: "sukses" | "gagal";
  note: string;
  createdAt: string;
}

export interface DigsigLogResponse {
  success: boolean;
  data: {
    data: DigsigLog[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface BsreHealthResponse {
  success: boolean;
  data: {
    isHealthy: boolean;
    recentFailures: number;
    recentSuccesses: number;
    lastFailureNote: string;
  };
}

export interface DigsigLogParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

// Document Types
export interface DigsigSigner {
  id: string;
  idDocument: string;
  urutan: number;
  persnum: number;
  nik: string | null;
  nama: string;
  jabatan: string;
  positionId: string | null;
  status: "waiting" | "pending" | "signed" | "rejected";
  signedAt: string | null;
  signatureId: string | null;
  bsreDocId: string | null;
  bsreNameDoc: string | null;
  rejectedAt: string | null;
  keterangan: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DigsigDocument {
  id: string;
  tanggalDokumen: string;
  klasifikasi: string;
  klasifikasiText: string;
  jenisNaskah: string;
  nomorDokumen: string;
  perihal: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileMimeType?: string;
  filePreviewUrl?: string;
  signedFilePath: string | null;
  signedFileName?: string | null;
  signedFilePreviewUrl?: string | null;
  visibleSign: boolean | number;
  status: "draft" | "on_progress" | "completed" | "rejected";
  currentSignerOrder: number;
  totalSigners: number;
  rejectedBy?: number | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdBy: number;
  createdByName: string;
  createdByPosition: string;
  createdAt: string;
  updatedAt: string;
  signers: DigsigSigner[];
}

export interface DigsigDocumentResponse {
  success: boolean;
  data: {
    data: DigsigDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DigsigDocumentDetailResponse {
  success: boolean;
  data: DigsigDocument;
}

export interface DigsigDocumentParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
}

export interface CreateDocumentPayload {
  tanggalDokumen: string;
  klasifikasi: string;
  jenisNaskah: string;
  nomorDokumen: string;
  perihal: string;
  file: File;
  visibleSign: boolean;
  signers: {
    urutan: number;
    positionId: number;
  }[];
}

export interface UpdateDocumentPayload {
  tanggalDokumen?: string;
  klasifikasi?: string;
  jenisNaskah?: string;
  nomorDokumen?: string;
  perihal?: string;
  file?: File;
  visibleSign?: boolean;
  signers?: {
    urutan: number;
    positionId: number;
  }[];
}

// Klasifikasi
export interface Klasifikasi {
  id: string;
  company: string;
  klasifikasi: string;
  klasifikasi_text: string;
  deskripsi: string | null;
  id_parent: string;
  active: number;
}

export interface KlasifikasiResponse {
  success: boolean;
  data: Klasifikasi[];
}

// Jenis Naskah
export interface JenisNaskah {
  id: string;
  jenis: string;
  jenis_text: string;
  format_penomoran: string;
  file_url: string;
}

export interface JenisNaskahResponse {
  success: boolean;
  message: string;
  data: JenisNaskah[];
}

// Verifikator
export interface Verifikator {
  persnum: number;
  nama: string;
  positionId: number;
  jabatan: string;
  lokasi: string;
  company: number;
  companyText: string;
  area: string;
  areaText: string;
  subArea: number;
  subAreaText: string;
  organization: string | null;
  organizationText: string;
  abbreviation: string | null;
  bodTag: string;
  isChief: boolean;
}

export interface VerifikatorResponse {
  success: boolean;
  data: Verifikator[];
}

export interface SignatureInfo {
  name: string;
  issuer: string;
  algorithm: string;
  signDate: string;
  validFrom: string;
  validUntil: string;
  reason: string;
}

export interface DocumentInfo {
  name: string;
  signatureCount: number;
  description: string;
  status: "VALID" | "INVALID" | "EXPIRED";
}

export interface CekDokumenData {
  document: DocumentInfo;
  signatures: SignatureInfo[];
}

export interface CekDokumenResponse {
  success: boolean;
  message: string;
  data: CekDokumenData;
}

export interface PenandatangananSigner {
  id: string;
  urutan: number;
  persnum: number;
  nama: string | null;
  jabatan: string | null;
  status: "waiting" | "pending" | "signed" | "rejected";
  signedAt: string | null;
}

export interface PenandatangananDocument {
  id: string;
  uuid?: string;
  tanggalDibuat: string;
  tanggalDokumen?: string;
  nomorDokumen: string;
  jenisNaskah: string;
  jenisNaskahText?: string;
  klasifikasi?: string;
  klasifikasiText?: string;
  perihal: string;
  totalPenandatangan: number;
  currentSignerOrder: number;
  status: "pending" | "signed" | "rejected";
  mySignerStatus: "waiting" | "pending" | "signed" | "rejected";
  documentStatus: "draft" | "on_progress" | "completed" | "rejected";
  canSign: boolean;
  canReject: boolean;
  signers: PenandatangananSigner[];
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  filePreviewUrl: string | null;
  signedFileName?: string | null;
  signedFilePreviewUrl: string | null;
  createdBy?: number;
  createdByName: string;
  createdByPosition: string;
  mySignerInfo?: PenandatangananSigner;
}

export interface PenandatangananResponse {
  success: boolean;
  data: {
    data: PenandatangananDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      totalPending: number;
      totalSigned: number;
      totalRejected: number;
    };
  };
}

export interface PenandatangananDetailResponse {
  success: boolean;
  data: PenandatangananDocument;
}

export interface SignDocumentPayload {
  file: File;
  passphrase: string;
}
