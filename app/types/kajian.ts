import { z } from "zod";

export const KajianSchema = z.object({
  id_naskah: z.string().nullable().optional(),

  pengirim: z.number({
    required_error: "Posisi pengirim tidak valid",
  }),

  penerima: z
    .array(z.number())
    .min(1, "Pilih minimal satu penerima (Kepada)"),

  // Tembusan DIHAPUS

  tanggal: z.string().min(1, "Tanggal wajib diisi"),

  klasifikasi: z.string().min(1, "Klasifikasi wajib dipilih"),
  klasifikasi_text: z.string().optional(),

  sifat: z.string().default("biasa"),

  perihal: z
    .string()
    .min(5, "Perihal terlalu pendek")
    .max(200, "Perihal maksimal 200 karakter"),

  konten: z.string().min(1, "Isi kajian tidak boleh kosong"),

  lampiran_temp_ids: z.array(z.string()).optional(),
  lampiran_text: z.string().optional(),
});

export type KajianPayload = z.infer<typeof KajianSchema>;

export interface KajianDetail {
  id: string;
  nomor: string | null;
  tanggal: string;
  klasifikasi: string;
  klasifikasi_text: string;
  sifat: string;
  perihal: string;
  konten: string;
  pengirim: {
    position_id: number;
    nama: string;
    position_text: string;
  };
  // Struktur response detail penerima biasanya array object
  penerima: Array<{
    id: string | number; // ID table atau Position ID
    nama: string;
    position_text?: string;
  }>;
  lampiran_files?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size?: number;
  }>;
}
