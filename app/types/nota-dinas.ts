// types/nota-dinas.ts
import { z } from "zod";

export const NotaDinasSchema = z.object({
  id_naskah: z.string().uuid().nullable().optional(),
  pengirim: z.string().min(1, "Pengirim wajib diisi"),
  penerima: z.array(z.string()).min(1, "Minimal pilih satu penerima"),
  tembusan: z.array(z.string()).optional(),
  tertuju: z.array(z.string()).optional(),
  klasifikasi: z.string().nullable(),
  klasifikasi_text: z.string().nullable(),
  sifat: z.string().min(1, "Sifat surat wajib dipilih"),
  perihal: z.string().min(1, "Perihal wajib diisi").max(200),
  konten: z.string().optional(),
  htmlContent: z.string().min(1, "Isi dokumen tidak boleh kosong"),
  english: z.boolean().default(false),
  nama_tempat: z.string().min(1),
  nama_jabatan: z.string().min(1),
  nama_lengkap: z.string().min(1),
  // tanda_tangan: z.string().default("vsydc526d728g29uwedhwidciwdcbhbddy2"),
  tgl: z.string().min(1, "Tanggal wajib diisi"),
  tanggal: z.string().optional(),
  lampiran_temp_ids: z.array(z.string().uuid()).default([]),
});

export type DraftPayload = z.infer<typeof NotaDinasSchema>;

export const validateDraftPayload = (data: any) => {
  const result = NotaDinasSchema.safeParse(data);

  if (!result.success) {
    // FIX: Ambil error pertama dengan pengecekan array yang aman
    const firstIssue =
      result.error.issues && result.error.issues.length > 0
        ? result.error.issues[0]
        : null;

    const errorMessage = firstIssue ? firstIssue.message : "Validasi gagal";
    const errorPath =
      firstIssue && firstIssue.path.length > 0
        ? (firstIssue.path[0] as string)
        : "unknown";

    return {
      isValid: false,
      errors: { [errorPath]: errorMessage },
    };
  }

  return { isValid: true, data: result.data };
};
