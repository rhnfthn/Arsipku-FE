import { z } from "zod";

// --- SCHEMAS ---

export const KonsepBaseSchema = z.object({
  jenis: z.string().min(1, "Jenis naskah harus dipilih"),
  from_position_id: z.number(),
  to_position_id: z.number().optional(), // Bisa null saat finalize jika auto
  pengirim_position_id: z.number(),
  penerima_position_ids: z.array(z.number()).min(1, "Penerima harus dipilih"),
  tembusan_position_ids: z.union([z.number(), z.array(z.number())]).optional(),
  tgl: z.string(),
  klasifikasi: z.string().min(1, "Klasifikasi harus dipilih"),
  klasifikasi_text: z.string(),
  sifat: z.string(),
  perihal: z.string().min(5, "Perihal terlalu pendek"),
  konten: z.string().min(1, "Konten surat tidak boleh kosong"),
  nama_tempat: z.string().optional(),
  nama_jabatan: z.string().optional(),
  nama_lengkap: z.string().optional(),
  lampiran_temp_ids: z.array(z.string()).optional(),
  catatan: z.string().optional(),
});

export const RejectSchema = z.object({
  from_position_id: z.number(),
  catatan: z.string().min(5, "Alasan penolakan wajib diisi"),
});

// --- TYPES ---

export type KonsepPayload = z.infer<typeof KonsepBaseSchema>;
export type RejectPayload = z.infer<typeof RejectSchema>;

export interface KonsepDetail {
  konsep: {
    id: string;
    status: string;
    perihal: string;
  };
  naskah: {
    id: string;
    jenis: string;
    nomor: string;
    tanggal: string; // YYYY-MM-DD
    perihal: string;
    konten: string;
    klasifikasi: string;
    klasifikasi_text: string;
    sifat: string;
    content?: {
      namaTempat?: string;
      namaJabatan?: string;
      namaLengkap?: string;
    };
  };
  current_workflow: {
    pengirim: {
      position_id: number;
      nama: string;
      position_text: string;
    };
    penerima: {
      position_id: number;
    };
  };
  lampiran: any[]; // Sesuaikan dengan struktur file
  penerima: any[];
  tembusan: any[];
}
