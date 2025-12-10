// types/inbox.ts

export interface Pengirim {
  position_id: string;
  position_text: string;
  organization_text: string;
  nama: string;
}

export interface InboxItem {
  id_sirkulasi: string;
  id_naskah: string;
  jenis: string; // 'DI', 'ND', etc
  jenis_label: string;
  nomor: string;
  tanggal: string; // ISO Date string
  perihal: string;
  sifat: string;
  status: string;
  lampiran: string;
  pengirim: Pengirim;
  status_baca: 'terbaca' | 'belum_terbaca';
  read_time: string | null;
  is_favorit: boolean;
  is_arsip: boolean;
  is_note: boolean;
}

export interface InboxSummary {
  total_semua: number;
  total_belum_dibaca: number;
  total_per_jenis: {
    ND: number;
    SDI: number;
    SDE: number;
    DI: number;
    KA: number;
    [key: string]: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface InboxData {
  items: InboxItem[];
  summary: InboxSummary;
}
