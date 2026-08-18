import { ref, readonly, computed } from 'vue';
import { useApi } from './useApi';
import type {
  ArsipPenyusutan,
  BackupArsip,
  StatusPenyusutan,
  JenisPenyusutan,
  VerifikatorPenyusutan,
  AjukanPenyusutanPayload,
  VerifyPenyusutanPayload,
  SimpanPenataanPayload,
  PemusnahanPayload,
} from '~/types/penyusutan';

/**
 * Composable untuk fitur Penyusutan — terhubung ke backend API.
 * Endpoint: /penyusutan
 */
export const usePenyusutan = () => {
  const { apiGet, apiPost, apiPatch } = useApi();

  const list = ref<ArsipPenyusutan[]>([]);
  const verifikasiList = ref<ArsipPenyusutan[]>([]);
  const penataanList = ref<ArsipPenyusutan[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /** Load daftar pengajuan penyusutan untuk Unit Dokumen (TU). */
  const loadData = async (filter?: { status?: string; search?: string }) => {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, any> = { ...filter };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') delete params[k];
      });
      const res: any = await apiGet('/penyusutan/pengajuan', { params }, { skipCache: true });
      list.value = (res?.data ?? []).map(normalizePenyusutan);
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat data penyusutan';
      list.value = [];
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /** Load daftar untuk verifikasi oleh Atasan Managerial TU. */
  const loadVerifikasiList = async (filter?: { status?: string; search?: string }) => {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, any> = { ...filter };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') delete params[k];
      });
      const res: any = await apiGet('/penyusutan/verifikasi', { params }, { skipCache: true });
      verifikasiList.value = (res?.data ?? []).map(normalizePenyusutan);
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat data verifikasi';
      verifikasiList.value = [];
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /** Load daftar untuk penataan/pemusnahan. */
  const loadPenataanList = async (filter?: { search?: string }) => {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, any> = { ...filter };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') delete params[k];
      });
      const res: any = await apiGet('/penyusutan/penataan', { params }, { skipCache: true });
      penataanList.value = (res?.data ?? []).map(normalizePenyusutan);
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat data penataan';
      penataanList.value = [];
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /** Cek apakah user adalah atasan managerial TU. */
  const checkIsAtasan = async (): Promise<boolean> => {
    try {
      const res: any = await apiGet('/penyusutan/is-atasan', {}, { skipCache: true });
      return res?.data?.isAtasan ?? false;
    } catch {
      return false;
    }
  };

  /** Get single item by id (from API). */
  const fetchById = async (id: string): Promise<ArsipPenyusutan | null> => {
    try {
      const res: any = await apiGet(`/penyusutan/${id}`, {}, { skipCache: true });
      return res?.data ? normalizePenyusutan(res.data) : null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat detail';
      return null;
    }
  };

  /** Get single item by id (from local list — sync). */
  const getById = (id: string) => list.value.find((a) => a.id === id) ?? null;

  /** Ajukan penyusutan ke backend. */
  const ajukanPenyusutan = async (payload: AjukanPenyusutanPayload): Promise<ArsipPenyusutan> => {
    const res: any = await apiPost('/penyusutan/ajukan', payload);
    return res?.data;
  };

  /** Verifikasi penyusutan oleh atasan (setuju/tolak). */
  const verifyPenyusutan = async (
    id: string,
    disetujui: boolean,
    payload: VerifyPenyusutanPayload
  ): Promise<ArsipPenyusutan> => {
    const endpoint = disetujui ? `/penyusutan/${id}/approve` : `/penyusutan/${id}/reject`;
    const res: any = await apiPatch(endpoint, payload);
    return res?.data;
  };

  /** Simpan penataan arsip permanen. */
  const simpanPenataan = async (
    id: string,
    payload: SimpanPenataanPayload
  ): Promise<ArsipPenyusutan> => {
    const res: any = await apiPatch(`/penyusutan/${id}/penataan`, payload);
    return res?.data;
  };

  /** Pemusnahan arsip. */
  const pemusnahan = async (id: string, payload: PemusnahanPayload): Promise<ArsipPenyusutan> => {
    const res: any = await apiPatch(`/penyusutan/${id}/pemusnahan`, payload);
    return res?.data;
  };

  /** Update foto dokumentasi (edit setelah penataan selesai). */
  const updateFotoDokumentasi = async (id: string, fotoUrl: string): Promise<ArsipPenyusutan> => {
    const res: any = await apiPatch(`/penyusutan/${id}/foto-dokumentasi`, {
      fotoDokumentasi: fotoUrl,
    });
    return res?.data;
  };

  /** Update berita acara (edit setelah penataan/pemusnahan selesai). */
  const updateBeritaAcara = async (
    id: string,
    beritaAcaraUrl: string
  ): Promise<ArsipPenyusutan> => {
    const res: any = await apiPatch(`/penyusutan/${id}/berita-acara`, {
      beritaAcara: beritaAcaraUrl,
    });
    return res?.data;
  };

  /** Backup data arsip musnah ke DB arsip + hapus master berkas dari DB inti. */
  const backupData = async (id: string, payload: { catatan?: string }): Promise<any> => {
    const res: any = await apiPost(`/penyusutan/${id}/backup-data`, payload);
    return res?.data;
  };

  /** Load daftar arsip yang sudah dibackup (halaman tracking backup). */
  const loadBackupStatus = async (): Promise<any[]> => {
    const res: any = await apiGet('/api/arsip/backup-status', {}, { skipCache: true });
    // Backend: { success, data: { status, data: [...] } }
    return res?.data?.data ?? res?.data ?? [];
  };

  return {
    list: readonly(list),
    verifikasiList: readonly(verifikasiList),
    penataanList: readonly(penataanList),
    loading: readonly(loading),
    error: readonly(error),
    loadData,
    loadVerifikasiList,
    loadPenataanList,
    checkIsAtasan,
    fetchById,
    getById,
    ajukanPenyusutan,
    verifyPenyusutan,
    simpanPenataan,
    pemusnahan,
    updateFotoDokumentasi,
    updateBeritaAcara,
    backupData,
    loadBackupStatus,
  };
};

/** Normalisasi data dari backend (camelCase) ke format yang dipakai FE (snake_case + alias). */
function normalizePenyusutan(item: any): ArsipPenyusutan {
  const verifikators: VerifikatorPenyusutan[] = (
    item.verifikators ??
    item.atasan_managerial ??
    []
  ).map((v: any) => ({
    id: v.id,
    penyusutanId: v.penyusutanId ?? v.penyusutan_id,
    persnum: v.atasanPersnum ?? v.atasan_persnum ?? v.persnum,
    name: v.atasanName ?? v.atasan_name ?? v.name ?? '-',
    atasanPositionId: v.atasanPositionId ?? v.atasan_position_id ?? null,
    atasanPositionText: v.atasanPositionText ?? v.atasan_position_text ?? null,
    positionText: v.atasanPositionText ?? v.atasan_position_text ?? v.positionText ?? null,
    jabatan: v.atasanPositionText ?? v.atasan_position_text ?? v.positionText ?? '',
    urutan: v.urutan,
    status: v.status,
    verifiedAt: v.verifiedAt ?? v.verified_at ?? null,
    catatan: v.catatan ?? null,
  }));

  return {
    id: item.id,
    nomorUsulan: item.nomorUsulan ?? item.nomor_usulan ?? item.no_usulan ?? '',
    no_usulan: item.nomorUsulan ?? item.nomor_usulan ?? item.no_usulan ?? '',
    berkasId: item.berkasId ?? item.berkas_id,
    kodeBerkas: item.kodeBerkas ?? item.kode_berkas ?? null,
    kode_berkas: item.kodeBerkas ?? item.kode_berkas ?? null,
    namaBerkas: item.namaBerkas ?? item.nama_berkas ?? '-',
    nama_berkas: item.namaBerkas ?? item.nama_berkas ?? '-',
    klasifikasi: item.klasifikasi ?? null,
    klasifikasiText: item.klasifikasiText ?? item.klasifikasi_text ?? null,
    klasifikasi_text: item.klasifikasiText ?? item.klasifikasi_text ?? null,
    tuPersnum: item.tuPersnum ?? item.tu_persnum,
    tuName: item.tuName ?? item.tu_name,
    sekretaris: item.tuName ?? item.tu_name ?? '',
    jenisPenyusutan: (item.jenisPenyusutan ??
      item.jenis_penyusutan ??
      'permanen') as JenisPenyusutan,
    jenis_penyusutan: (item.jenisPenyusutan ??
      item.jenis_penyusutan ??
      'permanen') as JenisPenyusutan,
    tanggalRetensiHabis: item.tanggalRetensiHabis ?? item.tanggal_retensi_habis ?? null,
    tanggal_retensi_habis: item.tanggalRetensiHabis ?? item.tanggal_retensi_habis ?? '',
    tanggalUsulan: item.tanggalUsulan ?? item.tgl_usulan ?? null,
    tanggal_pengajuan: item.tanggalUsulan ?? item.tgl_usulan ?? null,
    catatan: item.catatan ?? null,
    lokasiSimpan: item.lokasiSimpan ?? item.lokasi_simpan ?? null,
    lokasi_simpan: item.lokasiSimpan ?? item.lokasi_simpan ?? null,
    beritaAcara: item.beritaAcara ?? item.berita_acara ?? null,
    berita_acara: item.beritaAcara ?? item.berita_acara ?? null,
    fotoDokumentasi: item.fotoDokumentasi ?? item.foto_dokumentasi ?? null,
    foto_dokumentasi: item.fotoDokumentasi ?? item.foto_dokumentasi ?? null,
    daftarArsip: item.daftarArsip ?? item.daftar_arsip ?? [],
    daftar_arsip: item.daftarArsip ?? item.daftar_arsip ?? [],
    status: item.status as StatusPenyusutan,
    currentVerifikatorUrutan: item.currentVerifikatorUrutan ?? item.current_verifikator_urutan ?? 1,
    current_verifikator_urutan:
      item.currentVerifikatorUrutan ?? item.current_verifikator_urutan ?? 1,
    totalVerifikator: item.totalVerifikator ?? item.total_verifikator,
    rejectedNote: item.rejectedNote ?? item.rejected_note ?? null,
    verifikators,
    atasan_managerial: verifikators,
    isBackedUp: item.isBackedUp ?? false,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
}
