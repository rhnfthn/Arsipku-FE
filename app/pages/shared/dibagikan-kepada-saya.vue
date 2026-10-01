<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { RotateCcw, ChevronDown, Search } from 'lucide-vue-next';
import SharedToMeTab from '~/components/shared/SharedToMeTab.vue';
import { formatShortDate } from '~/utils/mail-helpers';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

const { t } = useI18n();
useHead({ title: () => t('share_to_me_title') });
const toast = useToast();
const { user } = useAuth();

const showExportModal = ref(false);
const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut' },
  { key: 'perihal', label: 'Perihal', desc: 'Perihal naskah' },
  { key: 'jenis', label: 'Jenis', desc: 'Jenis naskah' },
  { key: 'nomor', label: 'Nomor Naskah', desc: 'Nomor surat / naskah' },
  { key: 'dari', label: 'Dari', desc: 'Nama pengirim / pemberi akses' },
  { key: 'akses', label: 'Akses', desc: 'Tipe akses dan durasi' },
  { key: 'tanggal', label: 'Tanggal', desc: 'Tanggal dibagikan' }
]);

const {
  sharedToMe,
  pending,
  pagination,
  fetchShares,
  openNaskah,
  getShareDetail,
} = useNaskahShare();
const { counts: shareCounts, fetchCounts: fetchShareCounts } = useNaskahShareCounts();

// ── Breadcrumbs (locale-reactive) ────────────────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: t('berbagi'), to: '#' },
  { label: t('share_to_me_title'), to: '#' },
]);

// ── Search & Filter ──────────────────────────────────────────────────────────
const searchQuery = ref('');
const activeSortLabel = ref(t('share_terbaru'));
const itemsPerPage = ref(10);
const currentPage = ref(1);

const showSortMenu = ref(false);
const showPageMenu = ref(false);
const showStatusDropdown = ref(false);

const filterStatus = ref('Semua');
const statusOptions = computed(() => [
  { label: t('share_semua_status'), value: 'Semua' },
  { label: t('share_aktif'), value: 'AKTIF' },
  { label: t('share_berakhir'), value: 'BERAKHIR' },
]);

const filterStatusLabel = computed(() =>
  statusOptions.value.find((s) => s.value === filterStatus.value)?.label ?? t('share_semua_status')
);

const selectStatus = (val: string) => {
  filterStatus.value = val;
  showStatusDropdown.value = false;
  currentPage.value = 1;
  loadData();
};

const sortOptions = computed(() => [
  { label: t('share_terbaru'), value: t('share_terbaru') },
  { label: t('share_terlama'), value: t('share_terlama') },
]);
const pageOptions = [10, 25, 50, 100];

// ── Modals ───────────────────────────────────────────────────────────────────
const showDetailModal = ref(false);
const detailShare = ref<any>(null);

const showPdfViewer = ref(false);
const pdfViewerUrl = ref('');
const pdfViewerTitle = ref('');
const isLoadingPdf = ref(false);

// ── Data Loading ─────────────────────────────────────────────────────────────
const isRefreshing = ref(false);

const loadData = async () => {
  isRefreshing.value = true;
  try {
    await fetchShares({
      tab: 'shared-to-me',
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
      status: filterStatus.value !== 'Semua' ? filterStatus.value : undefined,
      sort: activeSortLabel.value === t('share_terlama') ? 'ASC' : 'DESC',
    });
  } finally {
    isRefreshing.value = false;
  }
};

// ── Watchers ─────────────────────────────────────────────────────────────────
watch(currentPage, () => { loadData(); });
watch(itemsPerPage, () => { currentPage.value = 1; loadData(); });

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage.value = 1; loadData(); }, 400);
});

// ── Handlers ─────────────────────────────────────────────────────────────────
const handleRefresh = () => loadData();

/** Reset semua filter (status, search, sort) lalu muat ulang data. */
const resetFilters = () => {
  filterStatus.value = 'Semua';
  searchQuery.value = '';
  activeSortLabel.value = t('share_terbaru');
  currentPage.value = 1;
  loadData();
};

/** Export all data to CSV (fetch with limit = total, then format). */
const isExporting = ref(false);
const exportData = () => {
  if (pagination.total === 0 && sharedToMe.value.length === 0) {
    toast.add({ title: t('share_tidak_ada_data'), description: t('share_tidak_ada_export'), color: 'warning' });
    return;
  }
  showExportModal.value = true;
};

const handleExportConfirm = async (selectedKeys: string[]) => {
  if ((pagination.total === 0 && sharedToMe.value.length === 0) || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    // Fetch SEMUA data (bukan hanya halaman saat ini) dengan filter yang sama
    await fetchShares({
      tab: 'shared-to-me',
      page: 1,
      limit: pagination.total || 9999,
      search: searchQuery.value || undefined,
      status: filterStatus.value !== 'Semua' ? filterStatus.value : undefined,
      sort: activeSortLabel.value === t('share_terlama') ? 'ASC' : 'DESC',
    });
    const rows = sharedToMe.value;
    if (!rows.length) {
      toast.add({ title: t('share_tidak_ada_data'), description: t('share_tidak_ada_export'), color: 'warning' });
      return;
    }

    const data = rows.map((s: any, idx: number) => {
      const row: Record<string, any> = {};
      if (selectedKeys.includes('No')) row['No'] = idx + 1;
      if (selectedKeys.includes('perihal')) row[t('share_perihal')] = s.naskahPerihal || t('share_tanpa_perihal');
      if (selectedKeys.includes('jenis')) row[t('share_jenis')] = s.naskahJenis || '-';
      if (selectedKeys.includes('nomor')) row[t('share_nomor')] = s.naskahNomor || '-';
      if (selectedKeys.includes('dari')) row[t('share_dari')] = s.pemberiNama || '-';
      if (selectedKeys.includes('akses')) row[t('share_akses')] = s.accessType === 'SEKALI_LIHAT' ? t('share_sekali_lihat') : `${s.durationDays || '-'} ${t('share_hari')}`;
      if (selectedKeys.includes('tanggal')) row[t('share_tanggal')] = formatShortDate(s.createdAt);
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dibagikan Kepada Saya');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `dibagikan_kepada_saya_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showExportModal.value = false;
    toast.add({ title: t('share_berhasil'), description: t('share_berhasil_export', { count: data.length }), color: 'success' });
    // Reload halaman saat ini
    await loadData();
  } catch (e) {
    console.error('Gagal export:', e);
    toast.add({ title: t('share_gagal_export'), description: t('share_coba_lagi'), color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

const selectSortOption = (v: string) => {
  activeSortLabel.value = v;
  showSortMenu.value = false;
  currentPage.value = 1;
  loadData();
};

const selectPageSize = (v: number) => {
  itemsPerPage.value = v;
  showPageMenu.value = false;
};

const handleViewDetail = async (share: any) => {
  try {
    const freshData = await getShareDetail(share.id);
    detailShare.value = freshData || share;
  } catch {
    detailShare.value = share;
  }
  showDetailModal.value = true;
};


const handleOpenPdf = async (share: any) => {
  isLoadingPdf.value = true;
  pdfViewerTitle.value = share.naskahPerihal || t('share_dokumen');
  showPdfViewer.value = true;
  try {
    const res = await openNaskah(share.id);
    if (res.data.pdfUrl) {
      pdfViewerUrl.value = res.data.pdfUrl;
    } else {
      pdfViewerUrl.value = '';
    }
    // Refresh data agar status recipient (SEKALI_LIHAT → BERAKHIR) terupdate di UI
    loadData();
    // Refresh badge unread — berkurang karena recipient sudah DIBACA/BERAKHIR
    fetchShareCounts(true);
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || '';
    pdfViewerUrl.value = '';
    showPdfViewer.value = false;
    toast.add({
      title: t('share_tidak_bisa_buka'),
      description: msg.includes('sekali') || msg.includes('ditutup')
        ? t('share_sekali_lihat_error')
        : msg || t('share_gagal_buka'),
      color: 'error',
    });
    loadData();
  } finally {
    isLoadingPdf.value = false;
  }
};

onMounted(async () => {
  // Badge unread hanya berkurang saat user benar-benar membuka naskah
  // (tombol "Buka" → openNaskah), bukan saat halaman dibuka.
  await loadData();
  fetchShareCounts(true);
});
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <PageHeader :title="t('share_to_me_title')" :items="breadcrumbs">
      <template #title>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {{ t('share_to_me_title') }}
          </h1>
          <span
            v-if="shareCounts.unread > 0"
            class="w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-900"
          />
        </div>
      </template>
    </PageHeader>

    <!-- Main Container -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <!-- TOOLBAR -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 p-3.5">
        <!-- ROWS PER PAGE + STATUS FILTER + SEARCH -->
        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <!-- ROWS PER PAGE DROPDOWN -->
          <div class="flex items-center gap-2">
            <div class="relative">
              <button
                type="button"
                @click.stop="showPageMenu = !showPageMenu"
                class="flex min-w-[70px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none transition-all hover:border-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <span>{{ itemsPerPage }}</span>
                <ChevronDown class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': showPageMenu }" />
              </button>
              <Transition name="filter-dd">
                <div
                  v-if="showPageMenu"
                  class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                >
                  <button
                    v-for="n in pageOptions"
                    :key="n"
                    type="button"
                    @click.stop="selectPageSize(n)"
                    :class="[
                      'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                      itemsPerPage === n
                        ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    ]"
                  >
                    {{ n }}
                  </button>
                </div>
              </Transition>
            </div>
          </div>

          <!-- STATUS FILTER -->
          <div class="relative">
            <button
              type="button"
              @click.stop="showStatusDropdown = !showStatusDropdown"
              class="flex min-w-[130px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none transition-all hover:border-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <span>{{ filterStatusLabel }}</span>
              <ChevronDown class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': showStatusDropdown }" />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="showStatusDropdown"
                class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  type="button"
                  @click.stop="selectStatus(opt.value)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                    filterStatus === opt.value
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- RESET FILTER -->
          <UButton
            type="button"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="resetFilters"
            :title="t('share_reset_filter')"
            :aria-label="t('share_reset_filter')"
          />

          <!-- SEARCH -->
          <div class="relative flex-1">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('share_cari')"
              class="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            />
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        <!-- SORT + REFRESH -->
        <div class="flex items-center gap-2">
          <!-- SORT -->
          <div class="relative">
            <button
              type="button"
              @click.stop="showSortMenu = !showSortMenu"
              class="flex min-w-[100px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none transition-all hover:border-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <span>{{ activeSortLabel }}</span>
              <ChevronDown class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': showSortMenu }" />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="showSortMenu"
                class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  type="button"
                  @click.stop="selectSortOption(opt.value)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                    activeSortLabel === opt.value
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- REFRESH BUTTON -->
          <button
            @click="handleRefresh"
            :disabled="isRefreshing"
            class="flex items-center gap-2 text-white text-sm px-4 py-2.5 rounded-lg font-medium whitespace-nowrap shadow-sm hover:shadow-md bg-primary hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
            {{ t('share_refresh') }}
          </button>

          <!-- EXPORT BUTTON -->
          <button
            @click="exportData"
            :disabled="isExporting"
            class="flex items-center gap-2 text-white text-sm px-4 py-2.5 rounded-lg font-medium whitespace-nowrap shadow-sm hover:shadow-md bg-primary hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon
              v-if="isExporting"
              name="i-lucide-loader-circle"
              class="w-4 h-4 animate-spin"
            />
            <UIcon v-else name="i-lucide-download" class="w-4 h-4" />
            {{ t('share_export') }}
          </button>
        </div>
      </div>

      <!-- ── CONTENT ─────────────────────────────────────────────────────── -->
      <div class="overflow-x-auto">
        <SharedToMeTab
          :shares="sharedToMe"
          :loading="pending"
          :total="pagination.total"
          :page="currentPage"
          :limit="itemsPerPage"
          :user-position="user?.position"
          @update:page="currentPage = $event"
          @view="handleViewDetail"
          @open-pdf="handleOpenPdf"
        />
      </div>
    </div>

    <!-- Detail Modal -->
    <SharedShareDetailModal
      v-if="showDetailModal && detailShare"
      :share="detailShare"
      :user-position="user?.position"
      @close="showDetailModal = false"
    />

    <!-- PDF Viewer Full Page -->
    <Teleport to="body">
      <div
        v-if="showPdfViewer"
        class="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950"
      >
        <!-- Top Bar -->
        <div class="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
          <div class="flex items-center gap-2 min-w-0">
            <Icon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ pdfViewerTitle }}</p>
          </div>
          <button
            @click="showPdfViewer = false; pdfViewerUrl = ''"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors shrink-0"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <!-- PDF Content -->
        <div class="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-0">
          <div v-if="isLoadingPdf" class="absolute inset-0 flex items-center justify-center z-10">
            <div class="flex flex-col items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg">
              <Icon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('share_memuat_dokumen') }}</p>
            </div>
          </div>
          <iframe v-if="pdfViewerUrl" :key="pdfViewerUrl" :src="pdfViewerUrl" class="w-full h-full border-none" />
          <div v-else-if="!isLoadingPdf" class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
            <Icon name="i-lucide-file-text" class="w-12 h-12 opacity-30" />
            <span class="text-sm">{{ t('share_dokumen_error') }}</span>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Export Column Modal -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="pagination.total || sharedToMe.length"
      title="Pilih Kolom Export Dibagikan Kepada Saya"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.2s ease;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-4px);
}
</style>