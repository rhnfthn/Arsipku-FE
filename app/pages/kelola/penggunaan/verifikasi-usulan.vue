<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import UsulanAksesBerkasBadge from '~/components/usulan-akses-berkas/UsulanAksesBerkasBadge.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { useUsulanAksesBerkasCounts } from '~/composables/useUsulanAksesBerkasCounts';
import { useAuth } from '~/composables/useAuth';
import { useUsulanAksesBerkasViewed } from '~/composables/useUsulanAksesBerkasViewed';
import { StatusUsulan } from '~/types/usulan-akses-berkas';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';
import { downloadCsv } from '~/utils/csv-export';
import { extractErrorMessage } from '~/utils/error-helper';

definePageMeta({ middleware: 'auth' });

useHead({ title: 'Verifikasi Usulan' });

const { t } = useI18n();
const { usulanList, pending, pagination, fetchList, verifikasiPemberi } = useUsulanAksesBerkas();
const { clearVerifikasiBadge, fetchCounts } = useUsulanAksesBerkasCounts();
const { user } = useAuth();
const toast = useToast();
const { isViewed, markViewed } = useUsulanAksesBerkasViewed();

const breadcrumbs = computed(() => [
  { label: 'Kelola', to: '#' },
  { label: 'Penggunaan', to: '#' },
  { label: 'Verifikasi Usulan', to: '#' },
]);

const searchQuery = ref('');
// Default filter: "Menunggu Verifikasi Pemberi" — usulan yang perlu diverifikasi
const filterStatus = ref<string>(StatusUsulan.TERKIRIM_KE_PEMBERI);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isRefreshing = ref(false);
const isExporting = ref(false);
const sortKey = ref('createdAt');
const sortDir = ref<'asc' | 'desc'>('desc');

const statusOptions = [
  { label: 'Semua', value: '' },
  { label: 'Menunggu Verifikasi Pemberi', value: StatusUsulan.TERKIRIM_KE_PEMBERI },
];

const loadData = async () => {
  try {
    await fetchList({
      status: filterStatus.value || undefined,
      scope: 'verify-pemberi',
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
      sortBy: sortKey.value || undefined,
      sortDir: sortDir.value,
    });
  } catch (err: any) {
    toast.add({ title: 'Error', description: extractErrorMessage(err), color: 'error' });
  }
};

const handleRefresh = async () => {
  isRefreshing.value = true;
  try { await loadData(); } finally { isRefreshing.value = false; }
};

const exportData = () => {
  const rows = usulanList.value;
  if (rows.length === 0) {
    toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  isExporting.value = true;
  try {
    const headers = ['Tanggal', 'Nomor Usulan', 'Divisi Pengusul', 'Jenis Berkas', 'Judul Usulan', 'Status'];
    const csvRows = rows.map((r: any) => [
      formatDate(r.createdAt),
      r.nomorUsulan || '-',
      r.divisiPengusulNama || '-',
      r.jenisBerkas || '-',
      r.judulUsulan || '-',
      r.status || '-',
    ]);
    downloadCsv(`verifikasi-usulan_${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows);
    toast.add({ title: 'Berhasil', description: `${csvRows.length} data berhasil diexport`, color: 'success' });
  } catch (e) {
    console.error('Gagal export:', e);
    toast.add({ title: 'Gagal export', description: 'Silakan coba kembali.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage.value = 1; loadData(); }, 400);
});
watch(currentPage, () => loadData());
watch(filterStatus, () => { currentPage.value = 1; loadData(); });

const goToDetail = (id: string) => {
  markViewed(id);
  navigateTo(`/kelola/penggunaan/usulan-akses-berkas/${id}`);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

function formatDurasiLabel(preset: string | undefined | null, customDate?: string | null): string {
  if (!preset) return '-';
  if (preset === 'CUSTOM' && customDate) {
    const tgl = new Date(customDate);
    return tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return preset.replace('_', ' ');
}

// Rows per page dropdown
const openRowsPerPage = ref(false);
function toggleRowsPerPage() { openRowsPerPage.value = !openRowsPerPage.value; }
function selectRowsPerPage(n: number) { itemsPerPage.value = n; openRowsPerPage.value = false; currentPage.value = 1; loadData(); }

// Status filter dropdown
const openFilterStatus = ref(false);
function toggleFilterStatus() { openFilterStatus.value = !openFilterStatus.value; }
function selectFilterStatus(value: string) { filterStatus.value = value; openFilterStatus.value = false; currentPage.value = 1; loadData(); }
const statusLabel = computed(() => statusOptions.find((s) => s.value === filterStatus.value)?.label || 'Semua');

function resetFilters() {
  filterStatus.value = StatusUsulan.TERKIRIM_KE_PEMBERI;
  searchQuery.value = '';
  currentPage.value = 1;
  loadData();
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) { if (el.contains(target)) return; }
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  loadData();
  fetchCounts();
});
onBeforeUnmount(() => { document.removeEventListener('click', handleDocumentClick); });

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
  loadData();
}

// Verify/reject modal
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const savingAction = ref(false);
const selectedUsulan = ref<any>(null);

const canVerifyRow = (row: any): boolean => {
  const userPersnum = Number(user.value?.persnum);
  let expectedUrutan: number | null = null;
  switch (row.status) {
    case StatusUsulan.TERKIRIM_KE_PEMBERI: expectedUrutan = 0; break;
    case StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI: expectedUrutan = 1; break;
    case StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI: expectedUrutan = 2; break;
    case StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI: expectedUrutan = 3; break;
    default: return false;
  }
  return row.verifikatorPemberi?.some((v: any) => v.persnum === userPersnum && v.urutan === expectedUrutan) ?? false;
};

const handleApprove = async (note: string) => {
  if (!selectedUsulan.value) return;
  savingAction.value = true;
  try {
    await verifikasiPemberi(selectedUsulan.value.id, { keputusan: 'DISETUJUI', catatan: note || undefined });
    toast.add({ title: 'Berhasil', description: 'Usulan disetujui', color: 'success' });
    showApproveModal.value = false;
    clearVerifikasiBadge();
    loadData();
    fetchCounts();
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: extractErrorMessage(err), color: 'error' });
  } finally {
    savingAction.value = false;
  }
};

const handleReject = async (note: string) => {
  if (!selectedUsulan.value) return;
  savingAction.value = true;
  try {
    await verifikasiPemberi(selectedUsulan.value.id, { keputusan: 'DITOLAK', catatan: note });
    toast.add({ title: 'Berhasil', description: 'Usulan ditolak', color: 'success' });
    showRejectModal.value = false;
    clearVerifikasiBadge();
    loadData();
    fetchCounts();
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: extractErrorMessage(err), color: 'error' });
  } finally {
    savingAction.value = false;
  }
};

const columns = [
  { key: 'createdAt', label: 'Tanggal', sortable: true },
  { key: 'nomorUsulan', label: 'Nomor Usulan', sortable: true },
  { key: 'divisiPengusulNama', label: 'Divisi Pengusul', sortable: true },
  { key: 'jenisBerkas', label: 'Jenis Berkas', sortable: true },
  { key: 'judulUsulan', label: 'Judul Usulan', sortable: true },
  { key: 'progress', label: 'Progress', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'aksi', label: 'Aksi' },
];

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
  return `${sisa} hari`;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <div class="mb-5">
      <PageHeader title="Verifikasi Usulan" :items="breadcrumbs" />
    </div>

    <!-- Main Card -->
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <!-- Toolbar -->
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
              <ChevronDown class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': openRowsPerPage }" />
            </button>
            <Transition name="filter-dd">
              <div v-if="openRowsPerPage" class="absolute left-0 top-full z-50 mt-1.5 min-w-[80px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button v-for="n in [10, 25, 50]" :key="n" type="button" @click.stop="selectRowsPerPage(n)"
                  :class="['w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700', itemsPerPage === n ? 'bg-primary/5 font-medium text-primary dark:text-primary-400' : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700']">
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Status filter dropdown -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterStatus"
              class="flex min-w-[130px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none transition-all hover:border-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <span>{{ statusLabel }}</span>
              <ChevronDown class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': openFilterStatus }" />
            </button>
            <Transition name="filter-dd">
              <div v-if="openFilterStatus" class="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button v-for="opt in statusOptions" :key="opt.value" type="button" @click.stop="selectFilterStatus(opt.value)"
                  :class="['w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700', filterStatus === opt.value ? 'bg-primary/5 font-medium text-primary dark:text-primary-400' : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700']">
                  {{ opt.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Reset filter (kiri search) -->
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
          <div class="relative flex-1 min-w-[180px]">
            <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nomor usulan…"
              class="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
            />
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex shrink-0 items-center gap-2">
          <!-- Export -->
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

      <!-- Table -->
      <div class="overflow-x-auto">
        <DataTable
          :columns="columns"
          :rows="usulanList"
          :loading="pending"
          header-class="bg-primary dark:bg-primary-700 text-white text-left"
          body-class="divide-y divide-gray-100 dark:divide-gray-700"
          row-class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          empty-message="Belum ada usulan masuk."
          @sort="handleSort"
        >
          <template #cell-createdAt="{ row }">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.createdAt) }}</span>
          </template>
          <template #cell-nomorUsulan="{ row }">
            <span class="font-mono text-xs text-gray-800 dark:text-gray-200">{{ row.nomorUsulan }}</span>
          </template>
          <template #cell-divisiPengusulNama="{ row }">
            <span class="text-xs text-gray-600 dark:text-gray-400">{{ row.divisiPengusulNama || '-' }}</span>
          </template>
          <template #cell-jenisBerkas="{ row }">
            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
              :class="row.jenisBerkas === 'AKTIF' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'">
              {{ row.jenisBerkas }}
            </span>
          </template>
          <template #cell-judulUsulan="{ row }">
            <span class="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px] block">{{ row.judulUsulan || '-' }}</span>
          </template>
          <template #cell-status="{ row }">
            <UsulanAksesBerkasBadge :status="row.status" />
          </template>
          <template #cell-progress="{ row }">
            <div v-if="row.status === 'AKSES_DITERBITKAN' || row.status === 'SELESAI'" class="flex items-center gap-2 min-w-[140px]">
              <div class="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div class="h-full rounded-full transition-all" :class="getProgressBarClass(getProgressPercent(row))" :style="{ width: `${getProgressPercent(row)}%` }" />
              </div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ getProgressLabel(row) }}</span>
            </div>
            <span v-else class="text-xs text-gray-400">-</span>
          </template>
          <template #cell-aksi="{ row }">
            <div class="flex items-center justify-center gap-1.5">
              <NuxtLink :to="`/kelola/penggunaan/usulan-akses-berkas/${row.id}`"
                :class="['relative inline-flex rounded-md p-1.5 transition-colors', isViewed(row) ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300' : 'hover:bg-[#457FB6]/10']"
                :style="!isViewed(row) ? { color: '#457FB6' } : {}"
                :title="isViewed(row) ? 'Sudah dilihat' : 'Lihat Detail'"
                @click="markViewed(row.id)">
                <UIcon name="i-lucide-eye" class="h-4 w-4" />
              </NuxtLink>
              <button v-if="canVerifyRow(row)" @click="selectedUsulan = row; showApproveModal = true"
                class="inline-flex rounded-md p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20" title="Setujui">
                <UIcon name="i-lucide-check" class="h-4 w-4" />
              </button>
              <button v-if="canVerifyRow(row)" @click="selectedUsulan = row; showRejectModal = true"
                class="inline-flex rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" title="Tolak">
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>
          </template>
        </DataTable>

        <!-- Pagination -->
        <DataPagination v-model:current-page="currentPage" :total-items="pagination.total" :per-page="itemsPerPage" />
      </div>
    </div>

    <!-- Modal Setuju -->
    <VerifyActionModal v-model="showApproveModal" variant="approve" title="Setujui Usulan Akses Berkas"
      description="Pastikan usulan sudah sesuai sebelum disetujui." note-placeholder="Keterangan opsional" confirm-label="Setuju"
      :saving="savingAction" @confirm="handleApprove" />

    <!-- Modal Tolak -->
    <VerifyActionModal v-model="showRejectModal" variant="reject" title="Tolak Usulan Akses Berkas"
      description="Penolakan akan menghentikan alur verifikasi usulan ini." note-placeholder="Masukkan alasan penolakan" confirm-label="Tolak"
      :saving="savingAction" :require-note="true" :min-note-length="5" @confirm="handleReject" />
  </div>
</template>