import { ref, readonly } from 'vue';
import type {
  ArsipPenyusutan,
  BackupArsip,
  StatusPenyusutan,
  JenisPenyusutan,
  VerifikatorPenyusutan,
} from '~/types/penyusutan';

/**
 * Composable untuk fitur Penyusutan (mockup dengan dummy data).
 * Data dimuat dari JSON file di /public/dummy/ dan dimanipulasi in-memory.
 */
export const usePenyusutan = () => {
  const list = ref<ArsipPenyusutan[]>([]);
  const backupList = ref<BackupArsip[]>([]);
  const loading = ref(false);

  /** Load dummy data dari JSON files */
  const loadData = async () => {
    loading.value = true;
    try {
      const [arsipRes, backupRes] = await Promise.all([
        $fetch<ArsipPenyusutan[]>('/dummy/arsip-penyusutan.json'),
        $fetch<BackupArsip[]>('/dummy/backup-arsip.json'),
      ]);
      list.value = arsipRes ?? [];
      backupList.value = backupRes ?? [];
    } catch (e) {
      console.error('Gagal memuat data penyusutan:', e);
    } finally {
      loading.value = false;
    }
  };

  /** Daftar arsip dengan retensi habis yang belum diajukan (untuk halaman Daftar Retensi Habis) */
  const retensiHabisList = computed(() =>
    list.value.filter(
      (a) => a.status === 'diajukan' && a.atasan_managerial.length === 0 && !a.tanggal_pengajuan
    )
  );

  /** Daftar arsip yang sudah diajukan (untuk halaman Pengajuan Penyusutan) */
  const pengajuanList = computed(() =>
    list.value.filter((a) => a.tanggal_pengajuan && a.status !== 'selesai')
  );

  /** Daftar arsip untuk verifikasi atasan managerial TU */
  const verifikasiList = computed(() =>
    list.value.filter((a) => a.status === 'diajukan' && a.atasan_managerial.length > 0)
  );

  /** Daftar arsip yang sudah diterima (untuk Penataan/Pemusnahan) */
  const penataanList = computed(() =>
    list.value.filter((a) => a.status === 'diterima' || a.status === 'selesai')
  );

  /** Ajukan penyusutan */
  const ajukanPenyusutan = (
    id: string,
    jenis: JenisPenyusutan,
    verifikators: { persnum: string; name: string; jabatan: string }[],
    catatan: string
  ) => {
    const item = list.value.find((a) => a.id === id);
    if (!item) return;
    item.jenis_penyusutan = jenis;
    item.catatan = catatan;
    item.status = 'diajukan';
    item.tanggal_pengajuan = new Date().toISOString().split('T')[0];
    item.atasan_managerial = verifikators.map((v, i) => ({
      ...v,
      urutan: i + 1,
      status: 'menunggu' as const,
      verifiedAt: null,
      catatan: null,
    }));
    item.current_verifikator_urutan = 1;
  };

  /** Verifikasi penyusutan oleh atasan (setuju/tolak) */
  const verifyPenyusutan = (id: string, persnum: string, disetujui: boolean, catatan?: string) => {
    const item = list.value.find((a) => a.id === id);
    if (!item) return;
    const verifikator = item.atasan_managerial.find((v) => v.persnum === persnum);
    if (!verifikator) return;

    verifikator.status = disetujui ? 'disetujui' : 'ditolak';
    verifikator.verifiedAt = new Date().toISOString();
    verifikator.catatan = catatan ?? null;

    if (!disetujui) {
      item.status = 'ditolak';
      return;
    }

    // Cek apakah semua verifikator sudah setuju
    const allApproved = item.atasan_managerial.every((v) => v.status === 'disetujui');
    if (allApproved) {
      item.status = 'diterima';
    } else {
      // Lanjut ke verifikator berikutnya
      item.current_verifikator_urutan = Math.min(
        item.current_verifikator_urutan + 1,
        item.atasan_managerial.length
      );
    }
  };

  /** Simpan penataan arsip permanen */
  const simpanPenataan = (id: string, lokasiSimpan: string, beritaAcara: string) => {
    const item = list.value.find((a) => a.id === id);
    if (!item) return;
    item.lokasi_simpan = lokasiSimpan;
    item.berita_acara = beritaAcara;
    item.status = 'selesai';
  };

  /** Pemusnahan arsip — pindahkan ke backup */
  const pemusnahan = (id: string, beritaAcara: string) => {
    const item = list.value.find((a) => a.id === id);
    if (!item) return;
    item.berita_acara = beritaAcara;
    item.status = 'selesai';

    // Insert ke backup table (dummy)
    backupList.value.push({
      id: String(backupList.value.length + 1),
      arsip_id: item.id,
      no_usulan: item.no_usulan,
      kode_berkas: item.kode_berkas,
      nama_berkas: item.nama_berkas,
      tanggal_backup: new Date().toISOString().split('T')[0],
      berita_acara: beritaAcara,
    });
  };

  /** Get single item by id */
  const getById = (id: string) => list.value.find((a) => a.id === id) ?? null;

  /** Get backup by arsip id */
  const getBackupByArsipId = (arsipId: string) =>
    backupList.value.find((b) => b.arsip_id === arsipId) ?? null;

  return {
    list: readonly(list),
    backupList: readonly(backupList),
    loading: readonly(loading),
    loadData,
    retensiHabisList,
    pengajuanList,
    verifikasiList,
    penataanList,
    ajukanPenyusutan,
    verifyPenyusutan,
    simpanPenataan,
    pemusnahan,
    getById,
    getBackupByArsipId,
  };
};
