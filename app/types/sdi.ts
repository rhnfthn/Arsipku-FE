// types/sdi.ts
import { z } from 'zod'

// ── Schema ────────────────────────────────────────────────────────────────────

const groupIdArray = z
  .array(z.union([z.string(), z.number()]).transform(String))
  .optional()
  .default([])

export const SDIPayloadSchema = z.object({
  id_naskah: z.string().nullable().optional(),

  pengirim: z.string().min(1, 'Pengirim (User ID) tidak boleh kosong'),

  // Individu — validasi "min 1" ditangani di page karena bisa kosong jika pakai grup
  tertuju: z.array(z.string()).optional().default([]),
  tembusan: z.array(z.string()).optional().default([]),

  // Grup — terima string ATAU number, coerce ke string
  tertuju_grup: groupIdArray,
  tembusan_grup: groupIdArray,

  // Format YYYY-MM-DD
  tgl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal salah (YYYY-MM-DD)'),

  klasifikasi: z.string().min(1, 'Klasifikasi harus dipilih'),
  klasifikasi_text: z.string().optional(),

  sifat: z.string().min(1, 'Sifat surat harus dipilih'),
  perihal: z.string().min(1, 'Perihal wajib diisi').max(200, 'Perihal maksimal 200 karakter'),
  konten: z.string().min(1, 'Isi surat tidak boleh kosong'),
  english: z.boolean().default(false),

  lampiran: z.string().optional().default(''),
  nama_tempat: z.string().optional(),
  nama_jabatan: z.string().optional(),
  nama_lengkap: z.string().optional(),

  lampiran_temp_ids: z.array(z.string()).optional().default([]),

  // UI only — tidak dikirim ke backend
  tanggal: z.string().optional()
})

// ── Types ─────────────────────────────────────────────────────────────────────

// Input type: dipakai saat membuat payload di page (sebelum Zod parse)
// Grup boleh berisi number atau string karena belum di-transform
export type SDIPayloadInput = Omit<
  z.input<typeof SDIPayloadSchema>,
  'tertuju_grup' | 'tembusan_grup'
> & {
  tertuju_grup?: (string | number)[]
  tembusan_grup?: (string | number)[]
}

// Output type: hasil setelah Zod parse — semua field sudah normalized
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
    const errors: Record<string, string> = {}
    result.error.issues.forEach((err) => {
      if (err.path[0] !== undefined) {
        errors[String(err.path[0])] = err.message
      }
    })
    return { isValid: false, errors }
  }
  return { isValid: true, errors: {} }
}
