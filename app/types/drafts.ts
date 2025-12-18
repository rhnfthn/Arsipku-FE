// types/drafts.ts

export interface DraftPayload {
  id_naskah?: string | null;
  pengirim: string | number;
  penerima: (string | number)[]; // Array of persnum
  tembusan: (string | number)[]; // Array of persnum

  klasifikasi: string;
  klasifikasi_text: string;
  sifat: string;
  perihal: string;
  htmlContent: string;
  english: boolean;

  nama_tempat: string;
  nama_jabatan: string;
  tanda_tangan: string;
  nama_lengkap: string;

  tgl: string; // YYYY-MM-DD

  // File objects untuk FormData
  lampiran_files?: File[];
  final_pdf?: Blob | File | null;
}

export interface DraftValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Fungsi Validasi Sederhana
export const validateDraftPayload = (data: DraftPayload): DraftValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.pengirim) errors.pengirim = "Pengirim tidak boleh kosong";
  if (!data.klasifikasi) errors.klasifikasi = "Klasifikasi berkas harus dipilih";
  if (!data.perihal) errors.perihal = "Perihal harus diisi";
  // Tanggal default hari ini sudah diatur di komponen, jadi ini hanya memastikan ada nilainya
  if (!data.tgl) errors.tgl = "Tanggal surat harus diisi";
  if (!data.htmlContent || data.htmlContent === '<p><br></p>') errors.htmlContent = "Isi naskah tidak boleh kosong";

  // Validasi Penerima (Minimal 1)
  if (!data.penerima || data.penerima.length === 0) {
    errors.penerima = "Minimal harus ada 1 tujuan surat (Tertuju)";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
