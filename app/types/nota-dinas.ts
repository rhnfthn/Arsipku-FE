import { z } from 'zod';

export const NotaDinasSchema = z
  .object({
    id_naskah:           z.string().uuid().nullable().optional(),
    id_referensi_naskah: z.string().nullable().optional(),
    klasifikasi_text:    z.string().optional(),

    pengirim: z.string().min(1, 'Pengirim wajib diisi'),

    penerima:      z.array(z.string()).default([]),
    tembusan:      z.array(z.string()).default([]),
    penerima_grup: z.array(z.string()).default([]),
    tembusan_grup: z.array(z.string()).default([]),
    tertuju:       z.array(z.string()).optional(),

    klasifikasi:  z.string().min(1, 'Klasifikasi wajib dipilih'),
    sifat:        z.string().min(1, 'Sifat surat wajib dipilih'),
    perihal:      z.string().min(1, 'Perihal wajib diisi').max(200),
    konten:       z.string().optional(),
    htmlContent:  z.string().min(1, 'Isi dokumen tidak boleh kosong'),
    english:      z.boolean().default(false),

    nama_tempat:  z.string().min(1),
    nama_jabatan: z.string().min(1),
    nama_lengkap: z.string().min(1),

    tgl:     z.string().min(1, 'Tanggal wajib diisi'),
    tanggal: z.string().min(1, 'Tanggal wajib diisi'),

    lampiran_temp_ids: z.array(z.string().uuid()).default([])
  })
  .refine((data) => data.penerima.length > 0 || data.penerima_grup.length > 0, {
    message: 'Minimal pilih satu tertuju (individu atau grup)',
    path: ['penerima']
  })
  .refine((data) => data.tembusan.length > 0 || data.tembusan_grup.length > 0, {
    message: 'Minimal pilih satu tembusan (individu atau grup)',
    path: ['tembusan']
  });

export type DraftPayload = z.infer<typeof NotaDinasSchema>;

export const validateDraftPayload = (data: any) => {
  const result = NotaDinasSchema.safeParse(data);

  if (!result.success) {
    const firstIssue = result.error.issues?.[0] ?? null;
    const errorMessage = firstIssue?.message ?? 'Validasi gagal';
    const errorPath = firstIssue?.path?.[0] ? String(firstIssue.path[0]) : 'unknown';

    return { isValid: false, errors: { [errorPath]: errorMessage } };
  }

  return { isValid: true, data: result.data };
};
