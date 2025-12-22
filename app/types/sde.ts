// types/sde.ts
import { z } from "zod";

// --- 1. Sub-Schema untuk Penerima Eksternal ---
export const ExternalRecipientSchema = z.object({
  id: z.string().optional(), // Optional karena kalau baru belum ada ID
  nama: z.string().min(1, "Nama Instansi/Penerima wajib diisi"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  telepon: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
  kontak: z.string().optional(), // UP / Contact Person
});

export type ExternalRecipient = z.infer<typeof ExternalRecipientSchema>;

// --- 2. Schema Utama Payload SDE ---
export const SDEPayloadSchema = z.object({
  id_naskah: z.string().nullable().optional(),

  pengirim: z.union([z.string(), z.number()], {
    errorMap: () => ({ message: "Pengirim (Position ID) wajib ada" }),
  }),

  // Perbedaan SDE: Penerima adalah Array Object
  penerima: z
    .array(ExternalRecipientSchema)
    .min(1, "Minimal harus ada satu penerima eksternal"),

  // Tembusan tetap Array String (ID Posisi Internal)
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

  // UI Helper
  tanggal: z.string().optional(),
});

export type SDEPayload = z.infer<typeof SDEPayloadSchema>;

// --- 3. Helper Validasi ---
export const validateSDEPayload = (data: SDEPayload) => {
  const result = SDEPayloadSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      // Handle nested error path (misal: penerima[0].nama)
      const pathKey = err.path.join(".");
      errors[pathKey] = err.message;
    });
    return { isValid: false, errors };
  }
  return { isValid: true, errors: {} };
};

// --- 4. Interface Response API (Sesuai JSON Anda) ---

export interface SdeSenderRaw {
  position: number;
  position_text: string;
  organization_id: number;
  organization_text: string;
  sub_area: number;
  sub_area_text: string;
  area: string;
  area_text: string;
}

// Response GET /SDE/get-recipient/{id}
export interface SdeRecipientApiResponse {
  success: boolean;
  data: {
    sender: SdeSenderRaw;
    // Recipients di SDE mungkin history kontak eksternal atau kosong
    recipients?: Record<string, any[]> | any[];
  };
}

// Response POST save-draft / send-message
export interface SdeActionResponse {
  success: boolean;
  data: {
    id: string;
    jenis: "SDE";
    nomor: string;
    tanggal: string;
    status: "draf" | "final";
    perihal: string;
    pengirim: SdeSenderRaw;
    penerima: ExternalRecipient[];
    // field lain...
  };
}
