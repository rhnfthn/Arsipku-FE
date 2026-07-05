// types/sde.ts
import { z } from 'zod';

export const SDEPayloadSchema = z
  .object({
    id_naskah: z.string().nullable().optional(),
    id_referensi_naskah: z.string().nullable().optional(),

    pengirim: z.union([z.string(), z.number()], {
      error: () => ({ message: 'Pengirim (Position ID) wajib ada' })
    }),

    penerima: z.array(z.any()).min(1, 'Minimal harus ada satu penerima eksternal'),
    tembusan: z.array(z.string()).default([]),

    tgl: z
      .string()
      .min(1, 'Tanggal wajib diisi')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal salah (YYYY-MM-DD)'),
    tanggal: z.string().min(1, 'Tanggal wajib diisi'), // ← hapus duplikat

    klasifikasi: z.string().min(1, 'Klasifikasi wajib dipilih'),
    klasifikasi_text: z.string().optional(),

    sifat: z.string().min(1, 'Sifat surat wajib dipilih'),
    perihal: z.string().min(1, 'Perihal wajib diisi').max(200, 'Perihal maksimal 200 karakter'),
    konten: z.string().optional(), // validasi konten dilakukan manual di page karena perlu strip HTML
    english: z.boolean().default(false),

    nama_tempat: z.string().optional(),
    nama_jabatan: z.string().optional(),
    nama_lengkap: z.string().optional(),

    lampiran_temp_ids: z.array(z.string()).default([])
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

export interface ExternalRecipient {
  id?: string | number
  persuratan_eksternal_id?: string | number
  value?: string | number
  nama?: string
  name?: string
  alamat?: string
  telepon?: string
  email?: string
  kontak?: string
  [key: string]: any
}

export interface SdeRecipientApiResponse {
  success: boolean;
  data: {
    sender: SdeSenderRaw;
    recipients?: Record<string, any[]> | any[];
    tembusan?: any[];
  };
}

export interface SdeActionResponse {
  success?: boolean;
  message?: string;
  data: {
    id: string;
    jenis: 'SDE';
    nomor: string;
    tanggal: string;
    status: 'draf' | 'final';
    perihal: string;
    pengirim: SdeSenderRaw;
    penerima: ExternalRecipient[];
    tembusan?: any[];
    tertuju?: ExternalRecipient[];
    lampiran?: string;
    lampiran_files?: any[];
    konten?: string;
    english?: boolean;
    klasifikasi?: string;
    klasifikasi_text?: string;
    sifat?: string;
    tgl?: string;
  };
}
