// types/sdi.ts
import { z } from 'zod'

// ── Schema ────────────────────────────────────────────────────────────────────

const groupIdArray = z
  .array(z.union([z.string(), z.number()]).transform(String))
  .default([])

export const SDIPayloadSchema = z
  .object({
    id_naskah: z.string().nullable().optional(),

    pengirim: z.string().min(1, 'Pengirim wajib diisi'),

    tertuju: z.array(z.string()).default([]),
    tembusan: z.array(z.string()).default([]),

    penerima_grup: groupIdArray,
    tembusan_grup: groupIdArray,

    klasifikasi: z.string().min(1, 'Klasifikasi wajib dipilih'),
    klasifikasi_text: z.string().optional(),

    sifat: z.string().min(1, 'Sifat surat wajib dipilih'),
    perihal: z.string().min(1, 'Perihal wajib diisi').max(200, 'Perihal maksimal 200 karakter'),
    konten: z.string().min(1, 'Isi surat tidak boleh kosong'),
    english: z.boolean().default(false),

    lampiran: z.string().optional().default(''),
    nama_tempat: z.string().optional(),
    nama_jabatan: z.string().optional(),
    nama_lengkap: z.string().optional(),

    tgl: z
      .string()
      .min(1, 'Tanggal wajib diisi')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal salah (YYYY-MM-DD)'),
    tanggal: z.string().min(1, 'Tanggal wajib diisi'),

    lampiran_temp_ids: z.array(z.string()).default([]),
  })
  .refine((data) => data.tertuju.length > 0 || data.penerima_grup.length > 0, {
    message: 'Minimal pilih satu tertuju (individu atau grup)',
    path: ['tertuju'],
  })
  .refine((data) => data.tembusan.length > 0 || data.tembusan_grup.length > 0, {
    message: 'Minimal pilih satu tembusan (individu atau grup)',
    path: ['tembusan'],
  })

// ── Types ─────────────────────────────────────────────────────────────────────

export type SDIPayloadInput = z.input<typeof SDIPayloadSchema> & {
  penerima_grup?: (string | number)[]
  tembusan_grup?: (string | number)[]
}

export type SDIPayload = z.infer<typeof SDIPayloadSchema>

// ── Validator ─────────────────────────────────────────────────────────────────

export const validateSDIPayload = (
  data: unknown
): {
  isValid: boolean
  errors: Record<string, string>
} => {
  const result = SDIPayloadSchema.safeParse(data)

  if (!result.success) {
    const firstIssue =
      result.error.issues && result.error.issues.length > 0 ? result.error.issues[0] : null

    const errorMessage = firstIssue ? firstIssue.message : 'Validasi gagal'
    const errorPath =
      firstIssue && firstIssue.path.length > 0 ? (firstIssue.path[0] as string) : 'unknown'

    return { isValid: false, errors: { [errorPath]: errorMessage } }
  }

  return { isValid: true, errors: {} }
}
