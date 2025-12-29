// types/sdi.ts
import { z } from "zod";

// 1. Schema Validasi Payload
export const SDIPayloadSchema = z.object({
  id_naskah: z.string().nullable().optional(),

  pengirim: z.string().min(1, "Pengirim (User ID) tidak boleh kosong"),

  // Array string (ID Posisi)
  tertuju: z
    .array(z.string())
    .min(1, "Penerima (Tertuju) harus dipilih minimal satu"),
  tembusan: z.array(z.string()).optional().default([]),

  // Format YYYY-MM-DD
  tgl: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal salah (YYYY-MM-DD)"),

  klasifikasi: z.string().min(1, "Klasifikasi harus dipilih"),
  klasifikasi_text: z.string().optional(),

  sifat: z.string().min(1, "Sifat surat harus dipilih"),
  perihal: z
    .string()
    .min(1, "Perihal wajib diisi")
    .max(200, "Perihal maksimal 200 karakter"),

  konten: z.string().min(1, "Isi surat tidak boleh kosong"),
  english: z.boolean().default(false),

  nama_tempat: z.string().optional(),
  nama_jabatan: z.string().optional(),
  nama_lengkap: z.string().optional(),

  // Array UUID lampiran sementara
  lampiran_temp_ids: z.array(z.string()).optional().default([]),

  // UI Helper (Tidak dikirim ke backend JSON, tapi butuh validasi di frontend)
  tanggal: z.string().optional(), // Format DD/MM/YYYY untuk display
});

export type SDIPayload = z.infer<typeof SDIPayloadSchema>;

// Helper untuk memvalidasi
export const validateSDIPayload = (data: SDIPayload) => {
  const result = SDIPayloadSchema.safeParse(data);
  if (!result.success) {
    // Format error message menjadi key-value simple
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) errors[err.path[0].toString()] = err.message;
    });
    return { isValid: false, errors };
  }
  return { isValid: true, errors: {} };
};

// export interface SdiRecipientRaw {
//   position: number | string;
//   position_text: string;
//   position_abbreviation: string;
//   persnum_person: number | string;
//   persnum_person_text: string;
//   organization_text?: string;
//   group?: string; // Tambahan dari hasil normalize
// }

// export interface SdiApiResponse {
//   sender: SdiRecipientRaw;
//   recipients: {
//     [key: string]: SdiRecipientRaw[]; // "REKAN": [...], "BAWAHAN": [...]
//   };
// }

// export interface SdiPayload {
//   id_naskah?: string | null;
//   pengirim: string | number;
//   penerima: (string | number)[];
//   tembusan: (string | number)[];
//   klasifikasi: string;
//   klasifikasi_text: string;
//   sifat: string;
//   perihal: string;
//   konten: string;
//   english: boolean;
//   nama_tempat: string;
//   nama_jabatan: string;
//   tanda_tangan: string;
//   nama_lengkap: string;
//   tgl: string;
//   lampiran: string;
//   final_pdf?: Blob | File | null;
// }

// export interface ValidationResult {
//   isValid: boolean;
//   errors: Record<string, string>;
// }

// export const validateSdiPayload = (payload: SdiPayload): ValidationResult => {
//   const errors: Record<string, string> = {};
//   if (!payload.perihal?.trim()) errors.perihal = "Perihal wajib diisi.";
//   if (!payload.penerima?.length) errors.penerima = "Penerima wajib dipilih.";
//   if (!payload.konten?.trim()) errors.konten = "Konten surat wajib diisi.";
//   if (!payload.klasifikasi) errors.klasifikasi = "Klasifikasi wajib dipilih.";
//   return { isValid: Object.keys(errors).length === 0, errors };
// };
