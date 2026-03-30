// types/disposisi.ts
import { z } from "zod";

export const DisposisiPayloadSchema = z.object({
  id_naskah: z.string().nullable().optional(),
  pengirim: z.string().min(1, "Pengirim tidak teridentifikasi"),
  tertuju: z
    .array(z.string())
    .min(1, "Penerima tertuju wajib dipilih minimal satu"),
  tanggal_disposisi: z
    .string()
    .min(1, "Tanggal disposisi wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal salah"),
  sifat: z.string().min(1, "Sifat surat wajib dipilih"),
  ref_nomor: z.string().default("-"),
  ref_perihal: z.string().default("-"),
  catatan: z.string().optional(),
  htmlContent: z.string().optional(),
  disposisi: z
    .array(z.string())
    .min(1, "Pilih minimal satu instruksi / disposisi"),
  lampiran_temp_ids: z.array(z.string()).default([]),
  is_priority: z.boolean().optional(),
  tanggal_ui: z.string().optional(),
});

export type DisposisiPayload = z.infer<typeof DisposisiPayloadSchema>;

export const validateDisposisiPayload = (data: any) => {
  const result = DisposisiPayloadSchema.safeParse(data);

  if (!result.success) {
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
