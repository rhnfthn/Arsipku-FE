// types/sde.ts
import { z } from 'zod';

// --- 1. Sub-Schema untuk Penerima Eksternal ---
export const ExternalRecipientSchema = z.object({
  id: z.string().optional(),
  nama: z.string().min(1, 'Nama Instansi/Penerima wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  telepon: z.string().optional().or(z.literal('')),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  kontak: z.string().optional()
});

export type ExternalRecipient = z.infer<typeof ExternalRecipientSchema>;

// --- 2. Schema Utama Payload SDE ---
// types/sde.ts

export const SDEPayloadSchema = z
  .object({
    id_naskah: z.string().nullable().optional(),

    pengirim: z.union([z.string(), z.number()], {
      errorMap: () => ({ message: 'Pengirim (Position ID) wajib ada' })
    }),

    // ✅ terima apapun, asal min 1 item
    penerima: z.array(z.any()).min(1, 'Minimal harus ada satu penerima eksternal'),

    tembusan: z.array(z.string()).default([]),

    tgl: z
      .string()
      .min(1, 'Tanggal wajib diisi')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal salah (YYYY-MM-DD)'),
    tanggal: z.string().min(1, 'Tanggal wajib diisi'),

    klasifikasi: z.string().min(1, 'Klasifikasi wajib dipilih'),
    klasifikasi_text: z.string().optional(),

    sifat: z.string().min(1, 'Sifat surat wajib dipilih'),
    perihal: z.string().min(1, 'Perihal wajib diisi').max(200, 'Perihal maksimal 200 karakter'),
    konten: z.string().min(1, 'Isi surat tidak boleh kosong'),
    english: z.boolean().default(false),

    nama_tempat: z.string().optional(),
    nama_jabatan: z.string().optional(),
    nama_lengkap: z.string().optional(),

    lampiran_temp_ids: z.array(z.string()).default([]),
    tanggal: z.string().min(1, 'Tanggal wajib diisi')
  })
  .refine((data) => data.tembusan.length > 0, {
    message: 'Minimal pilih satu tembusan',
    path: ['tembusan']
  });

export type SDEPayload = z.infer<typeof SDEPayloadSchema>;

// --- 3. Helper Validasi ---
export const validateSDEPayload = (
  data: unknown
): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const result = SDEPayloadSchema.safeParse(data);

  if (!result.success) {
    const firstIssue =
      result.error.issues && result.error.issues.length > 0 ? result.error.issues[0] : null;

    const errorMessage = firstIssue ? firstIssue.message : 'Validasi gagal';
    const errorPath =
      firstIssue && firstIssue.path.length > 0 ? (firstIssue.path[0] as string) : 'unknown';

    return { isValid: false, errors: { [errorPath]: errorMessage } };
  }

  return { isValid: true, errors: {} };
};

// --- 4. Interface Response API ---

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

export interface SdeRecipientApiResponse {
  success: boolean;
  data: {
    sender: SdeSenderRaw;
    recipients?: Record<string, any[]> | any[];
  };
}

export interface SdeActionResponse {
  success: boolean;
  data: {
    id: string;
    jenis: 'SDE';
    nomor: string;
    tanggal: string;
    status: 'draf' | 'final';
    perihal: string;
    pengirim: SdeSenderRaw;
    penerima: ExternalRecipient[];
  };
}
