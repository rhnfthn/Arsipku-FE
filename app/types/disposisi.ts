import { z } from "zod";

// 1. Schema Validasi Payload
export const DisposisiPayloadSchema = z.object({
  id_naskah: z.string().nullable().optional(),

  pengirim: z.string().min(1, "Pengirim tidak teridentifikasi"),
  tertuju: z
    .array(z.string())
    .min(1, "Tujuan disposisi harus dipilih minimal satu"),

  // Format YYYY-MM-DD
  tanggal_disposisi: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal salah"),

  sifat: z.string().min(1, "Sifat surat harus dipilih"),

  // Default "-" jika kosong
  ref_nomor: z.string().default("-"),
  ref_perihal: z.string().default("-"),

  // Konten Editor
  catatan: z.string().optional(),
  htmlContent: z.string().optional(), // Biasanya mirror dari catatan atau full page

  // Array string (Checklist items)
  disposisi: z.array(z.string()).default([]),

  lampiran_temp_ids: z.array(z.string()).default([]),

  // UI Helper (Tidak dikirim ke backend, akan dihapus di createFormData)
  tanggal_ui: z.string().optional(),
});

export type DisposisiPayload = z.infer<typeof DisposisiPayloadSchema>;

export const validateDisposisiPayload = (data: DisposisiPayload) => {
  const result = DisposisiPayloadSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) errors[err.path[0].toString()] = err.message;
    });
    return { isValid: false, errors };
  }
  return { isValid: true, errors: {} };
};
