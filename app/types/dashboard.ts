// types/dashboard.ts

export interface DashboardSummary {
  total_pesan_masuk: number;
  pesan_baru: number;
  surat_terkirim: number;
  draft_tersimpan: number;
  disposisi_masuk: number;
  disposisi_belum_dibaca: number;
  digsig_menunggu_ttd: number;
  digsig_on_progress: number;
  konsep_masuk: number;
  konsep_belum_dibaca: number;
  surat_favorit: number;
  surat_arsip: number;
  perlu_tindak_lanjut: number;
}

export interface SuratMasukTerbaru {
  id: string;
  id_sirkulasi: string;
  jenis: string;
  pengirim_nama: string | null;
  pengirim_organization: string | null;
  perihal: string;
  tanggal: string;
  waktu_relatif: string;
  sudah_dibaca: boolean;
  flag_favorit: boolean;
  flag_note: boolean;
  flag_arsip: boolean;
}

export interface DigSigMenungguTtd {
  id: string;
  id_document: string;
  nomor_dokumen: string;
  perihal: string;
  jenis_naskah: string;
  tanggal_dokumen: string;
  waktu_relatif: string;
  created_by_name: string;
  urutan: number;
  total_signers: number;
}

export interface StatistikBulanan {
  bulan: string;
  bulan_number: number;
  tahun: number;
  surat_masuk: number;
  surat_terkirim: number;
}

export interface StatistikJenisSurat {
  jenis: string;
  jenis_label: string;
  jumlah_masuk: number;
  jumlah_keluar: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  surat_masuk_terbaru: SuratMasukTerbaru[];
  digsig_menunggu_ttd: DigSigMenungguTtd[];
  statistik_bulanan: StatistikBulanan[];
  statistik_jenis_surat: StatistikJenisSurat[];
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

export interface StatCard {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  bgSolid: string;
  borderColor: string;
  iconColor: string;
}
