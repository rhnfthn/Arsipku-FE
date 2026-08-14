/** Tipe data untuk fitur Penyusutan (API backend). */

export type StatusPenyusutan = 'draft' | 'diajukan' | 'diterima' | 'ditolak' | 'selesai';
export type JenisPenyusutan = 'permanen' | 'musnah';

export interface VerifikatorPenyusutan {
  id?: string;
  penyusutanId?: string;
  persnum: number | string;
  name: string;
  jabatan?: string;
  atasanPositionId?: number | null;
  atasanPositionText?: string | null;
  positionText?: string;
  urutan: number;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'menunggu' | 'disetujui' | 'ditolak';
  verifiedAt?: string | null;
  catatan?: string | null;
}

export interface ArsipPenyusutan {
  id: string;
  nomorUsulan?: string;
  no_usulan?: string;
  berkasId?: string;
  kodeBerkas?: string | null;
  kode_berkas?: string | null;
  namaBerkas?: string;
  nama_berkas?: string;
  klasifikasi?: string | null;
  klasifikasiText?: string | null;
  klasifikasi_text?: string | null;
  tuPersnum?: number;
  tuName?: string;
  sekretaris?: string;
  jenisPenyusutan?: JenisPenyusutan;
  jenis_penyusutan?: JenisPenyusutan;
  tanggalRetensiHabis?: string | null;
  tanggal_retensi_habis?: string | null;
  tanggalUsulan?: string | null;
  tanggal_pengajuan?: string | null;
  catatan?: string | null;
  lokasiSimpan?: string | null;
  lokasi_simpan?: string | null;
  beritaAcara?: string | null;
  berita_acara?: string | null;
  daftarArsip?: Array<{ id: string; nama: string; kode: string }> | null;
  daftar_arsip?: Array<{ id: string; nama: string; kode: string }> | null;
  status: StatusPenyusutan;
  currentVerifikatorUrutan?: number;
  current_verifikator_urutan?: number;
  totalVerifikator?: number;
  rejectedNote?: string | null;
  verifikators?: VerifikatorPenyusutan[];
  atasan_managerial?: VerifikatorPenyusutan[];
  // Legacy fields (dari data penataan fallback)
  rak?: string | null;
  baris?: string | null;
  kolom?: string | null;
  keterangan?: string | null;
  foto_dokumentasi?: string | null;
  fotoDokumentasi?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

/** Payload untuk ajukan penyusutan. */
export interface AjukanPenyusutanPayload {
  berkasId: string;
  kodeBerkas?: string;
  namaBerkas?: string;
  klasifikasi?: string;
  klasifikasiText?: string;
  tanggalRetensiHabis?: string;
  jenisPenyusutan: JenisPenyusutan;
  atasanList: Array<{
    persnum: number;
    name?: string;
    positionId?: number;
    positionText?: string;
  }>;
  catatan?: string;
  daftarArsip?: Array<{ id: string; nama: string; kode: string }>;
}

/** Payload untuk verifikasi penyusutan. */
export interface VerifyPenyusutanPayload {
  catatan?: string;
}

/** Payload untuk penataan arsip permanen. */
export interface SimpanPenataanPayload {
  lokasiSimpan: string;
  beritaAcara: string;
  fotoDokumentasi?: string;
}

/** Payload untuk pemusnahan arsip. */
export interface PemusnahanPayload {
  beritaAcara: string;
}
