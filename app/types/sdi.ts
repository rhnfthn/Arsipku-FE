export interface SdiRecipientRaw {
  position: number | string;
  position_text: string;
  position_abbreviation: string;
  persnum_person: number | string;
  persnum_person_text: string;
  organization_text?: string;
  group?: string; // Tambahan dari hasil normalize
}

export interface SdiApiResponse {
  sender: SdiRecipientRaw;
  recipients: {
    [key: string]: SdiRecipientRaw[]; // "REKAN": [...], "BAWAHAN": [...]
  };
}

export interface SdiPayload {
  id_naskah?: string | null;
  pengirim: string | number;
  penerima: (string | number)[];
  tembusan: (string | number)[];
  klasifikasi: string;
  klasifikasi_text: string;
  sifat: string;
  perihal: string;
  konten: string;
  english: boolean;
  nama_tempat: string;
  nama_jabatan: string;
  tanda_tangan: string;
  nama_lengkap: string;
  tgl: string;
  lampiran: string;
  final_pdf?: Blob | File | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateSdiPayload = (payload: SdiPayload): ValidationResult => {
  const errors: Record<string, string> = {};
  if (!payload.perihal?.trim()) errors.perihal = "Perihal wajib diisi.";
  if (!payload.penerima?.length) errors.penerima = "Penerima wajib dipilih.";
  if (!payload.konten?.trim()) errors.konten = "Konten surat wajib diisi.";
  if (!payload.klasifikasi) errors.klasifikasi = "Klasifikasi wajib dipilih.";
  return { isValid: Object.keys(errors).length === 0, errors };
};
