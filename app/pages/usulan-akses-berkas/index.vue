<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronDown } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import UsulanAksesBerkasBadge from '~/components/usulan-akses-berkas/UsulanAksesBerkasBadge.vue';
import AddUsulanAksesBerkas from '~/components/usulan-akses-berkas/AddUsulanAksesBerkas.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { useUsulanAksesBerkasCounts } from '~/composables/useUsulanAksesBerkasCounts';
import { useAuth } from '~/composables/useAuth';
import { useUsulanAksesBerkasViewed } from '~/composables/useUsulanAksesBerkasViewed';
import { StatusUsulan, Keputusan } from '~/types/usulan-akses-berkas';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';

definePageMeta({ middleware: 'auth' });

// ── Route & query param (deklarasi awal agar bisa dipakai di useHead/breadcrumb) ──
const route = useRoute();
const queryTab = route.query.tab as string | undefined;

useHead({
  title:
    queryTab === 'mine' ? 'Permintaan Usulan Akses Berkas'
    : queryTab === 'verify-pemberi' ? 'Usulan Masuk Divisi Pemberi'
    : queryTab === 'verify-me' ? 'Verifikasi Usulan Akses Berkas'
    : 'Usulan Akses Berkas',
});

const { t } = useI18n();
const { usulanList, pending, pagination, fetchList, verifikasiPengusul, verifikasiPemberi, persetujuanPemberi } = useUsulanAksesBerkas();
const { clearVerifikasiBadge, clearPilihBerkasBadge, fetchCounts } = useUsulanAksesBerkasCounts();
const { user } = useAuth();
const toast = useToast();
const { isViewed, markViewed } = useUsulanAksesBerkasViewed();

// Helper: extract error message dari AxiosError (BE return { message: [...] | string })
const extractErrorMessage = (err: any): string => {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) {
    return beMessage.join(', ');
  }
  if (typeof beMessage === 'string' && beMessage.trim()) {
    return beMessage;
  }
  return err?.message || 'Terjadi kesalahan';
};

// Hanya Sekretaris yang didelegasikan (position_status = 'SE') yang dapat
// membuat usulan peminjaman berkas.
const isDelegatedSekretaris = computed(() => {
  return user.value?.position_status === 'SE';
});

const openAdd = ref(false);
const searchQuery = ref('');
const filterStatus = ref<string>('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

// ── Tab navigasi ─────────────────────────────────
// SE pengusul: default "Usulan Saya" (usulan yang dia buat)
// SE pemberi: default "Perlu Verifikasi Pemberi" (usulan masuk ke divisinya)
// Managerial: default "Perlu Verifikasi Saya" (usulan yang harus diverifikasi)
type TabValue = 'all' | 'mine' | 'verify-pemberi' | 'verify-me';
const activeTab = ref<TabValue>(
  queryTab === 'mine' || queryTab === 'verify-pemberi' || queryTab === 'verify-me' || queryTab === 'all'
    ? queryTab as TabValue
    : 'all',
);

const tabs = computed(() => {
  const ps = user.value?.position_status;
  const isSE = ps === 'SE' || ps === 'PS';
  const isMgr = !isSE && (() => {
    const pos = (user.value?.positionText || '').toUpperCase();
    const hasBod = pos.includes('BOD');
    const hasLegacy = pos.includes('EVP') || pos.includes('AVP') || pos.includes(' VP ') || pos.startsWith('VP ') || pos === 'VP';
    return hasBod || hasLegacy;
  })();

  const list: { label: string; value: TabValue }[] = [
    { label: 'Semua', value: 'all' },
  ];

  if (isSE) {
    list.push({ label: 'Usulan Saya', value: 'mine' });
    list.push({ label: 'Perlu Verifikasi Pemberi', value: 'verify-pemberi' });
  }

  if (isMgr) {
    list.push({ label: 'Perlu Verifikasi Saya', value: 'verify-me' });
  }

  return list;
});

// Auto-select default tab berdasarkan peran (hanya jika tidak ada query param tab)
watchEffect(() => {
  if (activeTab.value === 'all' && !queryTab && tabs.value.length > 1) {
    const ps = user.value?.position_status;
    if (ps === 'SE' || ps === 'PS') {
      // SE delegasi: default ke "Perlu Verifikasi Pemberi" (usulan yang masuk ke divisinya)
      activeTab.value = 'verify-pemberi';
    } else {
      const pos = (user.value?.positionText || '').toUpperCase();
      const hasBod = pos.includes('BOD');
      const hasLegacy = pos.includes('EVP') || pos.includes('AVP') || pos.includes(' VP ') || pos.startsWith('VP ') || pos === 'VP';
      if (hasBod || hasLegacy) {
        activeTab.value = 'verify-me';
      }
    }
  }
});

// Status filter otomatis berdasarkan tab
const tabStatusFilter = computed(() => {
  switch (activeTab.value) {
    case 'verify-pemberi':
      // SE pemberi: semua usulan yang masuk ke divisinya (semua status)
      // BE sudah filter via scope=verify-pemberi (divisiPemberiId = userOrgId)
      return undefined;
    case 'verify-me':
      return undefined; // Managerial: semua usulan yang dia verifikator (BE sudah filter via findAll scope)
    case 'mine':
      return undefined; // SE pengusul: usulan yang dia buat (BE filter via pengusulPersnum)
    default:
      return undefined;
  }
});

const breadcrumbs = computed(() => {
  const secondLabel =
    queryTab === 'mine' ? 'Permintaan'
    : queryTab === 'verify-pemberi' ? 'Pemberian'
    : queryTab === 'verify-me' ? 'Persetujuan'
    : 'Kelola';
  return [
    { label: t('beranda') || 'Beranda', to: '/beranda' },
    { label: secondLabel, to: '#' },
    { label: 'Usulan Akses Berkas', to: '/usulan-akses-berkas' },
  ];
});

const statusOptions = [
  { label: 'Semua', value: '' },
  { label: 'Menunggu Verifikasi Pengusul', value: StatusUsulan.MENUNGGU_VERIFIKASI_PENGUSUL },
  { label: 'Ditolak Verifikasi Pengusul', value: StatusUsulan.REVISI_PENGUSUL },
  { label: 'Menunggu Verifikasi Pemberi', value: StatusUsulan.TERKIRIM_KE_PEMBERI },
  { label: 'Ditolak Verifikasi Pemberi', value: StatusUsulan.REVISI_PEMBERI },
  { label: 'Menunggu Persetujuan Pemberi', value: StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI },
  { label: 'Ditolak Persetujuan Pemberi', value: StatusUsulan.DITOLAK_PEMBERI },
  { label: 'Akses Diberikan', value: StatusUsulan.AKSES_DITERBITKAN },
];

const totalPages = computed(() =>
  Math.ceil(pagination.total / itemsPerPage.value) || 1,
);

const loadData = async () => {
  try {
    // Tab filter override status filter (kecuali "Semua" yang pakai filterStatus manual)
    const status = activeTab.value === 'all'
      ? (filterStatus.value || undefined)
      : (tabStatusFilter.value || undefined);
    // Map tab ke scope BE
    const scopeMap: Record<string, string> = {
      mine: 'mine',
      'verify-pemberi': 'verify-pemberi',
      'verify-me': 'verify-me',
    };
    await fetchList({
      status,
      scope: scopeMap[activeTab.value],
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
      sortBy: sortKey.value || undefined,
      sortDir: sortDir.value,
    });
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: extractErrorMessage(err),
      color: 'error',
    });
  }
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadData();
  }, 400);
});

watch(currentPage, () => loadData());
watch(filterStatus, () => {
  currentPage.value = 1;
  loadData();
});
watch(activeTab, () => {
  currentPage.value = 1;
  loadData();
});

const handleCreated = () => {
  openAdd.value = false;
  currentPage.value = 1;
  loadData();
  toast.add({
    title: 'Berhasil',
    description: 'Usulan akses berkas berhasil dibuat',
    color: 'success',
  });
};

const goToDetail = (id: string) => {
  markViewed(id);
  navigateTo(`/usulan-akses-berkas/${id}`);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format durasi akses: CUSTOM tampilkan tanggal, lainnya tampilkan label
function formatDurasiLabel(preset: string | undefined | null, customDate?: string | null): string {
  if (!preset) return '-';
  if (preset === 'CUSTOM' && customDate) {
    const tgl = new Date(customDate);
    return tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return preset.replace('_', ' ');
}

// ── Custom dropdown for rows per page (pemberkasan style) ───────
const openRowsPerPage = ref(false);
function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
}
function selectRowsPerPage(n: number) {
  itemsPerPage.value = n;
  openRowsPerPage.value = false;
  currentPage.value = 1;
  loadData();
}

// ── Custom dropdown for scope/tab filter (pemberkasan style) ─────
const openScopeFilter = ref(false);
function toggleScopeFilter() {
  openScopeFilter.value = !openScopeFilter.value;
}
function selectScopeFilter(value: TabValue) {
  activeTab.value = value;
  openScopeFilter.value = false;
}
const scopeLabel = computed(() => {
  return tabs.value.find((t) => t.value === activeTab.value)?.label || 'Semua';
});

// ── Custom dropdown for status filter (pemberkasan style) ────────
const openFilterStatus = ref(false);
function toggleFilterStatus() {
  openFilterStatus.value = !openFilterStatus.value;
}
function selectFilterStatus(value: string) {
  filterStatus.value = value;
  openFilterStatus.value = false;
  currentPage.value = 1;
  loadData();
}
const statusLabel = computed(() => {
  return statusOptions.find((s) => s.value === filterStatus.value)?.label || 'Semua';
});

function resetFilters() {
  filterStatus.value = '';
  searchQuery.value = '';
  activeTab.value = tabs.value.length > 1 ? tabs.value[1].value : 'all';
  currentPage.value = 1;
  loadData();
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
  openScopeFilter.value = false;
}

// ── DataTable columns (pemberkasan style) ───────────────────────
const columns = [
  { key: 'nomorUsulan', label: 'Nomor Usulan', sortable: true },
  { key: 'jenisBerkas', label: 'Jenis Berkas', sortable: true },
  { key: 'durasiAkses', label: 'Durasi', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'progress', label: 'Progress', sortable: false },
  { key: 'createdAt', label: 'Dibuat', sortable: true },
  { key: 'aksi', label: 'Aksi' },
];

// ── Progress bar: durasi akses yang sudah diterbitkan ────────────
// Bar merepresentasikan waktu yang sudah berlalu dari tanggalMulai ke tanggalSelesai.
// 0% = baru mulai, 100% = sudah habis.
// Warna: hijau (0-50%), kuning (50-80%), merah (80-100%)
const getProgressPercent = (row: any): number => {
  if (row.status !== StatusUsulan.AKSES_DITERBITKAN && row.status !== StatusUsulan.SELESAI) return 0;
  if (!row.tanggalMulai || !row.tanggalSelesai) return 0;
  const mulai = new Date(row.tanggalMulai).getTime();
  const selesai = new Date(row.tanggalSelesai).getTime();
  const now = Date.now();
  if (now <= mulai) return 0;
  if (now >= selesai) return 100;
  return Math.round(((now - mulai) / (selesai - mulai)) * 100);
};

const getProgressBarClass = (percent: number): string => {
  if (percent < 50) return 'bg-green-500';
  if (percent < 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getProgressLabel = (row: any): string => {
  if (row.status !== StatusUsulan.AKSES_DITERBITKAN && row.status !== StatusUsulan.SELESAI) return '-';
  const percent = getProgressPercent(row);
  if (percent >= 100) return 'Habis';
  if (!row.tanggalSelesai) return '-';
  const sisa = Math.ceil((new Date(row.tanggalSelesai).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (sisa <= 0) return 'Habis';
  return `${sisa} hari lagi`;
};

// ── Cek apakah user bisa verifikasi usulan ini ──
const menungguStatuses = [
  StatusUsulan.MENUNGGU_VERIFIKASI_PENGUSUL,
  StatusUsulan.MENUNGGU_VERIFIKASI_AKHIR_PENGUSUL,
  StatusUsulan.MENUNGGU_VERIFIKASI_EVP_PENGUSUL,
  StatusUsulan.MENUNGGU_VERIFIKASI_PEMBERI,
  StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI,
  StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI,
  StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI,
];

const canVerifyRow = (row: any): boolean => {
  const userPersnum = Number(user.value?.persnum);
  // Tentukan urutan aktif berdasarkan status (hanya urutan yang sedang menunggu)
  let expectedUrutanPengusul: number | null = null;
  let expectedUrutanPemberi: number | null = null;
  switch (row.status) {
    case StatusUsulan.MENUNGGU_VERIFIKASI_PENGUSUL: expectedUrutanPengusul = 1; break;
    case StatusUsulan.MENUNGGU_VERIFIKASI_AKHIR_PENGUSUL: expectedUrutanPengusul = 2; break;
    case StatusUsulan.MENUNGGU_VERIFIKASI_EVP_PENGUSUL: expectedUrutanPengusul = 3; break;
    case StatusUsulan.MENUNGGU_VERIFIKASI_PEMBERI: expectedUrutanPemberi = 0; break;
    case StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI: expectedUrutanPemberi = 1; break;
    case StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI: expectedUrutanPemberi = 2; break;
    case StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI: expectedUrutanPemberi = 3; break;
    default: return false;
  }
  // Cek verifikatorPengusul — hanya urutan aktif yang boleh approve
  if (expectedUrutanPengusul !== null) {
    return row.verifikatorPengusul?.some(
      (v: any) => v.persnum === userPersnum && v.urutan === expectedUrutanPengusul,
    ) ?? false;
  }
  // Cek verifikatorPemberi — hanya urutan aktif (SE=0, AVP=1, VP=2, EVP=3)
  if (expectedUrutanPemberi !== null) {
    return row.verifikatorPemberi?.some(
      (v: any) => v.persnum === userPersnum && v.urutan === expectedUrutanPemberi,
    ) ?? false;
  }
  return false;
};

const canRejectRow = (row: any): boolean => {
  return canVerifyRow(row);
};

// Filter list: saat tab verify-me, hanya tampilkan usulan yang sudah giliran user untuk approve
const displayList = computed(() => {
  if (activeTab.value === 'verify-me') {
    return usulanList.value.filter((row: any) => canVerifyRow(row));
  }
  return usulanList.value;
});

// ── Modal Setuju/Tolak (standarisasi) ──────────────
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const actionRow = ref<any>(null);
const actionNote = ref('');
const savingAction = ref(false);

const openApproveModal = (row: any) => {
  actionRow.value = row;
  actionNote.value = '';
  showApproveModal.value = true;
};

const openRejectModal = (row: any) => {
  actionRow.value = row;
  actionNote.value = '';
  showRejectModal.value = true;
};

// Tentukan jenis verifikasi berdasarkan status & verifikator
const getVerificationType = (row: any): 'pengusul' | 'pemberi' | 'persetujuan-pemberi' | null => {
  const userPersnum = Number(user.value?.persnum);
  const isPengusulVerifier = row.verifikatorPengusul?.some((v: any) => v.persnum === userPersnum);
  const isPemberiVerifier = row.verifikatorPemberi?.some((v: any) => v.persnum === userPersnum);

  if (isPengusulVerifier) {
    if ([StatusUsulan.MENUNGGU_VERIFIKASI_PENGUSUL, StatusUsulan.MENUNGGU_VERIFIKASI_AKHIR_PENGUSUL, StatusUsulan.MENUNGGU_VERIFIKASI_EVP_PENGUSUL].includes(row.status)) {
      return 'pengusul';
    }
  }
  if (isPemberiVerifier) {
    if (row.status === StatusUsulan.MENUNGGU_VERIFIKASI_PEMBERI) return 'pemberi';
    if ([StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI, StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI, StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI].includes(row.status)) {
      return 'persetujuan-pemberi';
    }
  }
  return null;
};

const handleApprove = async (note: string) => {
  if (!actionRow.value) return;
  savingAction.value = true;
  try {
    const row = actionRow.value;
    const userPersnum = Number(user.value?.persnum);
    const type = getVerificationType(row);

    if (type === 'pengusul') {
      const verifikator = row.verifikatorPengusul.find((v: any) => v.persnum === userPersnum);
      const jenjang = verifikator?.urutan as 1 | 2 | 3;
      await verifikasiPengusul(row.id, jenjang, {
        catatan: note,
        catatanRevisi: '',
        keputusan: Keputusan.SETUJU,
      });
    } else if (type === 'pemberi') {
      await verifikasiPemberi(row.id, {
        durasiAksesDisetujui: row.durasiAkses,
        catatanPerubahanDurasi: '',
        catatan: note,
        keputusan: Keputusan.LANJUT,
      });
    } else if (type === 'persetujuan-pemberi') {
      const verifikator = row.verifikatorPemberi.find((v: any) => v.persnum === userPersnum);
      const jenjang = verifikator?.urutan as 1 | 2 | 3;
      await persetujuanPemberi(row.id, jenjang, {
        catatan: note,
        catatanRevisi: '',
        keputusan: Keputusan.SETUJU,
        durasiAksesDisetujui: undefined,
        catatanPerubahanDurasi: '',
      });
    }

    toast.add({ title: 'Berhasil', description: 'Verifikasi terkirim', color: 'success' });
    showApproveModal.value = false;
    await loadData();
    fetchCounts(true);
  } catch (err: any) {
    toast.add({ title: 'Gagal Verifikasi', description: extractErrorMessage(err), color: 'error' });
  } finally {
    savingAction.value = false;
  }
};

const handleReject = async (note: string) => {
  if (!actionRow.value) return;
  if (!note.trim() || note.trim().length < 5) {
    toast.add({ title: 'Alasan penolakan wajib diisi (minimal 5 karakter)', color: 'error' });
    return;
  }
  savingAction.value = true;
  try {
    const row = actionRow.value;
    const userPersnum = Number(user.value?.persnum);
    const type = getVerificationType(row);

    if (type === 'pengusul') {
      const verifikator = row.verifikatorPengusul.find((v: any) => v.persnum === userPersnum);
      const jenjang = verifikator?.urutan as 1 | 2 | 3;
      await verifikasiPengusul(row.id, jenjang, {
        catatan: note,
        catatanRevisi: '',
        keputusan: Keputusan.TOLAK,
      });
    } else if (type === 'pemberi') {
      await verifikasiPemberi(row.id, {
        durasiAksesDisetujui: row.durasiAkses,
        catatanPerubahanDurasi: '',
        catatan: note,
        keputusan: Keputusan.TOLAK,
      });
    } else if (type === 'persetujuan-pemberi') {
      const verifikator = row.verifikatorPemberi.find((v: any) => v.persnum === userPersnum);
      const jenjang = verifikator?.urutan as 1 | 2 | 3;
      await persetujuanPemberi(row.id, jenjang, {
        catatan: note,
        catatanRevisi: '',
        keputusan: Keputusan.TOLAK,
        durasiAksesDisetujui: undefined,
        catatanPerubahanDurasi: '',
      });
    }

    toast.add({ title: 'Berhasil', description: 'Penolakan terkirim', color: 'success' });
    showRejectModal.value = false;
    await loadData();
    fetchCounts(true);
  } catch (err: any) {
    toast.add({ title: 'Gagal Tolak', description: extractErrorMessage(err), color: 'error' });
  } finally {
    savingAction.value = false;
  }
};

// ── Sort ────────────────────────────────────────────────────────
const sortKey = ref('createdAt');
const sortDir = ref<'asc' | 'desc'>('desc');

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
  currentPage.value = 1;
  loadData();
};

// ── Export ──────────────────────────────────────────────────────
const isExporting = ref(false);

const exportData = async () => {
  if (pagination.total === 0) {
    toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  isExporting.value = true;
  try {
    const status = activeTab.value === 'all'
      ? (filterStatus.value || undefined)
      : (tabStatusFilter.value || undefined);
    const scopeMap: Record<string, string> = {
      mine: 'mine',
      'verify-pemberi': 'verify-pemberi',
      'verify-me': 'verify-me',
    };
    await fetchList({
      status,
      scope: scopeMap[activeTab.value],
      page: 1,
      limit: pagination.total || 9999,
      search: searchQuery.value || undefined,
      sortBy: sortKey.value || undefined,
      sortDir: sortDir.value,
    });
    const rows = usulanList.value;
    if (!rows.length) {
      toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
      return;
    }
    const headers = ['Nomor Usulan', 'Jenis Berkas', 'Durasi', 'Status', 'Dibuat'];
    const csvRows = rows.map((r: any) => [
      r.nomorUsulan,
      r.jenisBerkas,
      formatDurasiLabel(r.durasiAkses, r.customTanggalSelesai),
      r.status,
      formatDate(r.createdAt),
    ]);
    downloadCsv(`usulan-akses-berkas_${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows);
    toast.add({ title: 'Berhasil', description: `${rows.length} data berhasil diexport`, color: 'success' });
    // Reload current page
    await loadData();
  } catch (e) {
    console.error('Gagal export:', e);
    toast.add({ title: 'Gagal export', description: 'Silakan coba kembali.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  loadData();
  // Clear badge verifikasi & pilih berkas saat halaman dibuka
  clearVerifikasiBadge();
  clearPilihBerkasBadge();
  // Re-fetch counts untuk update badge di sidebar
  fetchCounts(true);
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <!-- Header: title kiri + button kanan (pemberkasan style) -->
    <div class="mb-5">
      <PageHeader :items="breadcrumbs">
        <template #title>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {{
              queryTab === 'mine' ? 'Permintaan Usulan Akses Berkas'
              : queryTab === 'verify-pemberi' ? 'Usulan Masuk Divisi Pemberi'
              : queryTab === 'verify-me' ? 'Verifikasi Usulan Akses Berkas'
              : 'Usulan Akses Berkas'
            }}
          </h1>
        </template>
      </PageHeader>
    </div>

    <!-- Button Buat Usulan (di atas tabel, di luar card) -->
    <div v-if="isDelegatedSekretaris" class="mb-4 flex justify-end">
      <UButton
        icon="i-lucide-plus"
        color="primary"
        size="md"
        @click="openAdd = true"
      >
        Buat Usulan Akses
      </UButton>
    </div>

    <!-- Main Card -->
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <!-- Toolbar (pemberkasan style: border-gray-300, custom dropdowns, reset) -->
      <div class="flex w-full items-center gap-3 border-b border-gray-300 p-4 dark:border-gray-700">
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <!-- Rows per page dropdown -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleRowsPerPage"
              class="flex min-w-[70px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none transition-all hover:border-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <span>{{ itemsPerPage }}</span>
              <ChevronDown
                class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': openRowsPerPage }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openRowsPerPage"
                class="absolute left-0 top-full z-50 mt-1.5 min-w-[80px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  v-for="n in [10, 25, 50]"
                  :key="n"
                  type="button"
                  @click.stop="selectRowsPerPage(n)"
                  :class="[
                    'w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700',
                    itemsPerPage === n
                      ? 'bg-primary/5 font-medium text-primary dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700'
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Scope filter custom dropdown (only when tabs > 1) -->
          <div v-if="tabs.length > 1" class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleScopeFilter"
              class="flex min-w-[130px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none transition-all hover:border-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <span class="truncate">{{ scopeLabel }}</span>
              <ChevronDown
                class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': openScopeFilter }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openScopeFilter"
                class="absolute left-0 top-full z-50 mt-1.5 min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  v-for="tab in tabs"
                  :key="tab.value"
                  type="button"
                  @click.stop="selectScopeFilter(tab.value)"
                  :class="[
                    'w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700',
                    activeTab === tab.value
                      ? 'bg-primary/5 font-medium text-primary dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700'
                  ]"
                >
                  {{ tab.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Status filter custom dropdown (only on "all" tab) -->
          <div v-if="activeTab === 'all'" class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterStatus"
              class="flex min-w-[130px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none transition-all hover:border-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <span class="truncate">{{ statusLabel }}</span>
              <ChevronDown
                class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterStatus }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterStatus"
                class="absolute left-0 top-full z-50 mt-1.5 min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  type="button"
                  @click.stop="selectFilterStatus(opt.value)"
                  :class="[
                    'w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700',
                    filterStatus === opt.value
                      ? 'bg-primary/5 font-medium text-primary dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Reset filter -->
          <UButton
            type="button"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="resetFilters"
            title="Reset Filter"
            aria-label="Reset Filter"
          />

          <!-- Search -->
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Cari nomor usulan…"
            class="min-w-[180px] flex-1"
          />
        </div>
        <!-- Action buttons -->
        <div class="flex shrink-0 items-center gap-2">
          <!-- Refresh button -->
          <button
            @click="loadData"
            :disabled="pending"
            class="shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            title="Refresh"
            aria-label="Refresh"
          >
            <UIcon
              name="i-lucide-rotate-cw"
              class="w-3.5 h-3.5"
              :class="{ 'animate-spin': pending }"
            />
            Refresh
          </button>
          <!-- Export button -->
          <button
            @click="exportData"
            :disabled="isExporting"
            class="shrink-0 flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-primary dark:bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
          <UIcon
            v-if="isExporting"
            name="i-lucide-loader-circle"
            class="w-3.5 h-3.5 animate-spin"
          />
          <UIcon v-else name="i-lucide-download" class="w-3.5 h-3.5" />
          Export
        </button>
        </div>
      </div>

      <!-- DataTable (pemberkasan style) -->
      <DataTable
        :columns="columns"
        :rows="displayList"
        :loading="pending"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        header-class="bg-primary dark:bg-primary-700 text-white text-left"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        empty-message="Belum ada usulan akses berkas."
        @sort="handleSort"
      >
        <template #cell-nomorUsulan="{ row }">
          <span class="font-mono text-xs text-gray-800 dark:text-gray-200">{{ row.nomorUsulan }}</span>
        </template>
        <template #cell-jenisBerkas="{ row }">
          <span
            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
            :class="row.jenisBerkas === 'AKTIF'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'"
          >
            {{ row.jenisBerkas }}
          </span>
        </template>
        <template #cell-durasiAkses="{ row }">
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDurasiLabel(row.durasiAkses, row.customTanggalSelesai) }}</span>
        </template>
        <template #cell-status="{ row }">
          <UsulanAksesBerkasBadge :status="row.status" />
        </template>
        <template #cell-progress="{ row }">
          <div v-if="row.status === 'AKSES_DITERBITKAN' || row.status === 'SELESAI'" class="flex items-center gap-2 min-w-[140px]">
            <div class="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="getProgressBarClass(getProgressPercent(row))"
                :style="{ width: `${getProgressPercent(row)}%` }"
              />
            </div>
            <span class="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ getProgressLabel(row) }}</span>
          </div>
          <span v-else class="text-xs text-gray-400">-</span>
        </template>
        <template #cell-createdAt="{ row }">
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #cell-aksi="{ row }">
          <div class="flex items-center justify-center gap-1.5">
            <NuxtLink
              :to="`/usulan-akses-berkas/${row.id}`"
              :class="[
                'relative inline-flex rounded-md p-1.5 transition-colors',
                isViewed(row)
                  ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300'
                  : 'hover:bg-[#457FB6]/10'
              ]"
              :style="!isViewed(row) ? { color: '#457FB6' } : {}"
              :title="isViewed(row) ? 'Sudah dilihat' : 'Lihat Detail'"
              @click="markViewed(row.id)"
            >
              <UIcon name="i-lucide-eye" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </template>
      </DataTable>

      <!-- Pagination (pemberkasan style) -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="pagination.total"
        :per-page="itemsPerPage"
      />
    </div>

    <!-- Add Modal -->
    <Teleport to="body">
      <AddUsulanAksesBerkas v-model="openAdd" @created="handleCreated" />
    </Teleport>

    <!-- Modal Setuju (standarisasi) -->
    <VerifyActionModal
      v-model="showApproveModal"
      variant="approve"
      title="Setujui Usulan Akses Berkas"
      description="Pastikan usulan sudah sesuai sebelum disetujui."
      note-placeholder="Keterangan opsional"
      confirm-label="Setuju"
      :saving="savingAction"
      @confirm="handleApprove"
    />

    <!-- Modal Tolak (standarisasi) -->
    <VerifyActionModal
      v-model="showRejectModal"
      variant="reject"
      title="Tolak Usulan Akses Berkas"
      description="Penolakan akan menghentikan alur verifikasi usulan ini."
      note-placeholder="Masukkan alasan penolakan"
      confirm-label="Tolak"
      :saving="savingAction"
      :require-note="true"
      :min-note-length="5"
      @confirm="handleReject"
    />
  </div>
</template>