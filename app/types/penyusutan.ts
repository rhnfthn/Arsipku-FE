/** Tipe data untuk fitur Penyusutan (mockup) */

export type StatusPenyusutan = 'draft' | 'diajukan' | 'diterima' | 'ditolak' | 'selesai';
export type JenisPenyusutan = 'permanen' | 'musnah';

export interface VerifikatorPenyusutan {
  persnum: string;
  name: string;
  jabatan: string;
  urutan: number;
  status: 'menunggu' | 'disetujui' | 'ditolak';
  verifiedAt: string | null;
  catatan: string | null;
}

export interface ArsipPenyusutan {
  id: string;
  no_usulan: string;
  kode_berkas: string;
  nama_berkas: string;
  klasifikasi: string;
  sekretaris: string;
  atasan_managerial: VerifikatorPenyusutan[];
  status: StatusPenyusutan;
  jenis_penyusutan: JenisPenyusutan;
  lokasi_simpan: string | null;
  rak: string | null;
  baris: string | null;
  kolom: string | null;
  tanggal_retensi_habis: string;
  tanggal_pengajuan: string | null;
  catatan: string;
  keterangan: string | null;
  daftar_arsip: Array<{ id: string; nama: string; kode: string }>;
  foto_dokumentasi: string | null;
  berita_acara: string | null;
  current_verifikator_urutan: number;
}

export interface BackupArsip {
  id: string;
  arsip_id: string;
  no_usulan: string;
  kode_berkas: string;
  nama_berkas: string;
  tanggal_backup: string;
  berita_acara: string;
}
