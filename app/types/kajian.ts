import { z } from 'zod'

export const KajianSchema = z.object({
  id_naskah: z.string().nullable().optional(),

  pengirim: z.number().positive('Posisi pengirim tidak valid'),

  penerima: z.array(z.number()).min(1, 'Pilih minimal satu penerima'),

  tgl: z.string().min(1, 'Tanggal wajib diisi'),

  klasifikasi: z.string().min(1, 'Klasifikasi wajib dipilih'),
  klasifikasi_text: z.string().optional(),
  sifat: z.string().default('biasa'),

  perihal: z.string()
    .min(5, 'Perihal terlalu pendek (min 5 karakter)')
    .max(200, 'Perihal maksimal 200 karakter'),

  konten: z.string().refine(
    val => val.replace(/<[^>]*>/g, '').trim().length > 0,
    { message: 'Isi kajian tidak boleh kosong' }
  ),

  lampiran_temp_ids: z.array(z.string()).optional(),
  lampiran: z.string().optional()
})

export type KajianPayload = z.infer<typeof KajianSchema> & {
  positionText?: string;
  namaLengkap?: string;
}

// Tambahkan wrapper function seperti pola disposisi
export const validateKajianPayload = (data: any): {
  isValid: boolean
  errors?: Record<string, string>
  data?: any
} => {
  const result = KajianSchema.safeParse(data)

  if (!result.success) {
    const firstIssue = result.error.issues?.[0] ?? null
    const errorMessage = firstIssue?.message ?? 'Validasi gagal'
    const errorPath = firstIssue?.path?.[0] ? String(firstIssue.path[0]) : 'unknown'

    return {
      isValid: false,
      errors: { [errorPath]: errorMessage }
    }
  }

  return { isValid: true, data: result.data }
}

export interface KajianDetail {
  id: string
  nomor: string | null
  tanggal: string
  klasifikasi: string
  klasifikasi_text: string
  sifat: string
  perihal: string
  konten: string
  pengirim: {
    position_id: number
    nama: string
    position_text: string
  }
  penerima: Array<{
    id: string | number
    nama: string
    position_text?: string
  }>
  lampiran_files?: Array<{
    id: string
    file_name?: string
    file_path?: string
    fileName?: string
    filePath?: string
    fileUrl?: string
    file_size?: number
  }>
}
