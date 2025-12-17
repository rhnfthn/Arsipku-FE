export interface DashboardSummary {
  total_pesan_masuk: number;
  pesan_baru: number;
  surat_terkirim: number;
  disposisi_masuk: number;
  draft_tersimpan: number;
}

export interface SuratMasukTerbaru {
  id: string;
  id_sirkulasi: string;
  jenis: "ND" | "DI" | "SK" | string;
  pengirim_nama: string;
  pengirim_organization: string;
  perihal: string;
  tanggal: string;
  waktu_relatif: string;
  sudah_dibaca: boolean;
  flag_favorit: boolean;
  flag_note: boolean;
  flag_arsip: boolean;
}

export interface StatistikBulan {
  bulan: string;
  bulan_number: number;
  tahun: number;
  surat_masuk: number;
  surat_terkirim: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  surat_masuk_terbaru: SuratMasukTerbaru[];
  statistik: StatistikBulan[];
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

export interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  bgSolid: string;
  borderColor: string;
  iconColor: string;
}
