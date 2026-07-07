// types/sirkulasi.ts

export interface Pengirim {
  position_id: string;
  position_text: string;
  organization_text: string;
  nama: string;
}

export interface Penerima {
  position_id: string;
  position_text: string;
  organization_text: string;
  nama: string;
  status_baca: 'terbaca' | 'belum_terbaca';
  read_time: string | null;
  is_tindak_lanjut?: boolean;
}

export interface SummaryBaca {
  total: number;
  terbaca: number;
  belum_terbaca: number;
}

export interface SummaryTindakLanjut {
  total: number;
  sudah: number;
  belum: number;
}

export interface TrackingLog {
  id_sirkulasi: string;
  id_naskah: string;
  jenis: string;
  jenis_label: string;
  nomor: string | null;
  perihal: string | null;
  created_at: string;
  pengirim: Pengirim;
  penerima: Penerima[];
  tembusan: Penerima[];
  summary_baca: SummaryBaca;
  summary_tindak_lanjut: SummaryTindakLanjut;
}

export interface NaskahItem {
  id_naskah: string;
  jenis: string; // 'ND', 'DI', 'SDI', 'SDE', dll
  jenis_label: string;
  nomor: string;
  tanggal: string;
  perihal: string;
  sifat: string;
  status: string;
  lampiran: number;
  pengirim: Pengirim;
  penerima: Penerima[];
  tembusan?: Penerima[];
  tracking_logs?: TrackingLog[];
  summary_baca: SummaryBaca;
}

export interface SirkulasiResponse {
  success: boolean;
  message: string;
  data: {
    items: NaskahItem[];
    summary: {
      total_semua: number;
      total_per_jenis: Record<string, number>;
    };
  };
}

// Interface untuk data yang digunakan di UI (Mapping dari API ke UI)
export interface UIMailItem {
  id: string; // id_naskah
  from: string; // Display Name (Untuk Sent Box = Penerima)
  email: string; // Jabatan / Info tambahan
  subject: string; // Perihal
  body: string; // Nomor Surat / Ringkasan
  category: string; // Jenis
  date: string; // Tanggal format pendek
  fullDate: string; // ISO String for sorting
  initial: string;
  color: string;
  isRead: boolean; // Selalu true untuk sent box, atau logic lain
  viewCount: number; // total terbaca
  isFlagged: boolean;
  isStarred: boolean;
  isLocked: boolean;
  hasNote: boolean;
  isArchived: boolean;
  canOpenTab: boolean;
  recipient: string; // String gabungan penerima
  disposition: string;
  note: string;
  labels?: any[];
  // Raw data untuk modal detail/reader
  originalData: NaskahItem;
}
