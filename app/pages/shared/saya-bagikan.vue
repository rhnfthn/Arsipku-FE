<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { RotateCcw, ChevronDown, Search } from 'lucide-vue-next';
import SharedByMeTab from '~/components/shared/SharedByMeTab.vue';
import { formatShortDate } from '~/utils/mail-helpers';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

const { t } = useI18n();
useHead({ title: () => t('share_title') });
const toast = useToast();

const showExportModal = ref(false);
const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut' },
  { key: 'perihal', label: 'Perihal', desc: 'Perihal naskah yang dibagikan' },
  { key: 'jenis', label: 'Jenis', desc: 'Jenis naskah' },
  { key: 'nomor', label: 'Nomor Naskah', desc: 'Nomor surat/naskah' },
  { key: 'penerima', label: 'Dibagikan Kepada', desc: 'Daftar penerima share' },
  { key: 'akses', label: 'Akses', desc: 'Tipe akses / masa berlaku' },
  { key: 'status', label: 'Status', desc: 'Status aktif atau berakhir' },
  { key: 'tanggal', label: 'Tanggal', desc: 'Tanggal dibagikan' }
]);

const {
  sharedByMe,
  pending,
  pagination,
  fetchShares,
  openNaskah,
  getShareDetail,
  revokeShare,
} = useNaskahShare();

// ── Breadcrumbs (locale-reactive) ────────────────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: t('berbagi'), to: '/shared/saya-bagikan' },
  { label: t('share_title'), to: '#' },
]);

// ── Search & Filter ──────────────────────────────────────────────────────────
const searchQuery = ref('');
const activeSortLabel = ref(t('share_terbaru'));
const itemsPerPage = ref(10);
const currentPage = ref(1);

const showSortMenu = ref(false);
const showPageMenu = ref(false);
const showStatusDropdown = ref(false);

const filterStatus = ref('AKTIF');
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
const showRevokeModal = ref(false);
const revokeShareId = ref('');
const revokeRecipientId = ref('');
const revokeRecipientName = ref('');
const revokeSharePerihal = ref('');

const showDetailModal = ref(false);
const detailShare = ref<any>(null);

// ── Modal konfirmasi cabut semua akses ──
const showRevokeAllModal = ref(false);
const revokeAllShare = ref<any>(null);
const isRevokingAll = ref(false);

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
      tab: 'shared-by-me',
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
  filterStatus.value = 'AKTIF';
  searchQuery.value = '';
  activeSortLabel.value = t('share_terbaru');
  currentPage.value = 1;
  loadData();
};

/** Export all data to CSV (fetch with limit = total, then format). */
const isExporting = ref(false);
const exportData = () => {
  if (pagination.total === 0 && sharedByMe.value.length === 0) {
    toast.add({ title: t('share_tidak_ada_data'), description: t('share_tidak_ada_export'), color: 'warning' });
    return;
  }
  showExportModal.value = true;
};

const handleExportConfirm = async (selectedKeys: string[]) => {
  if ((pagination.total === 0 && sharedByMe.value.length === 0) || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const hasFilter = (searchQuery.value && searchQuery.value.trim() !== '') || (filterStatus.value && filterStatus.value !== 'Semua');
    // Fetch SEMUA data jika tidak difilter. Jika difilter, export data yang tampil (current page).
    await fetchShares({
      tab: 'shared-by-me',
      page: hasFilter ? currentPage.value : 1,
      limit: hasFilter ? itemsPerPage.value : (pagination.total || 9999),
      search: searchQuery.value || undefined,
      status: filterStatus.value !== 'Semua' ? filterStatus.value : undefined,
      sort: activeSortLabel.value === t('share_terlama') ? 'ASC' : 'DESC',
    });
    const rows = sharedByMe.value;
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
      if (selectedKeys.includes('penerima')) row[t('share_dibagikan_kepada')] = s.recipients?.map((r: any) => r.nama).join('; ') || '-';
      if (selectedKeys.includes('akses')) row[t('share_akses')] = s.accessType === 'SEKALI_LIHAT' ? t('share_sekali_lihat') : `${s.durationDays || '-'} ${t('share_hari')}`;
      if (selectedKeys.includes('status')) row[t('share_status')] = s.status === 'AKTIF' ? t('share_aktif') : t('share_berakhir');
      if (selectedKeys.includes('tanggal')) row[t('share_tanggal')] = formatShortDate(s.createdAt);
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Saya Bagikan');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `saya_bagikan_${new Date().toISOString().slice(0, 10)}.xlsx`);

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

const handleRevoke = (payload: { share: any; recipientId: string; recipientName: string }) => {
  revokeShareId.value = payload.share.id;
  revokeSharePerihal.value = payload.share.naskahPerihal;
  revokeRecipientId.value = payload.recipientId;
  revokeRecipientName.value = payload.recipientName;
  showRevokeModal.value = true;
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

const handleRevokeAll = (share: any) => {
  // Selalu tampilkan konfirmasi popup sebelum eksekusi
  revokeAllShare.value = share;
  showRevokeAllModal.value = true;
};

const confirmRevokeAll = async () => {
  if (!revokeAllShare.value) return;
  isRevokingAll.value = true;
  try {
    await revokeShare(revokeAllShare.value.id);
    toast.add({
      title: t('share_berhasil'),
      description: t('share_berhasil_revoke'),
      color: 'success',
    });
    showRevokeAllModal.value = false;
    revokeAllShare.value = null;
    showDetailModal.value = false;
    loadData();
  } catch (err: any) {
    toast.add({
      title: t('share_gagal'),
      description: err?.response?.data?.message || err?.message || t('share_gagal_cabut'),
      color: 'error',
    });
  } finally {
    isRevokingAll.value = false;
  }
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
  } finally {
    isLoadingPdf.value = false;
  }
};

onMounted(() => { loadData(); });
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <PageHeader :title="t('share_title')" :items="breadcrumbs" />

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

      <div class="overflow-x-auto">
        <SharedByMeTab
          :shares="sharedByMe"
          :loading="pending"
          :total="pagination.total"
          :page="currentPage"
          :limit="itemsPerPage"
          :search-query="searchQuery"
          @update:page="currentPage = $event"
          @view="handleViewDetail"
          @open-pdf="handleOpenPdf"
          @revoke-all="handleRevokeAll"
        />
      </div>
    </div>

    <!-- Revoke Single Recipient Modal -->
    <SharedShareRevokeModal
      v-if="showRevokeModal"
      :share-id="revokeShareId"
      :recipient-id="revokeRecipientId"
      :recipient-name="revokeRecipientName"
      :naskah-perihal="revokeSharePerihal"
      @close="showRevokeModal = false"
      @revoked="loadData"
    />

    <!-- Detail Modal -->
    <SharedShareDetailModal
      v-if="showDetailModal && detailShare"
      :share="detailShare"
      :is-sender="true"
      @close="showDetailModal = false"
      @revoke-recipient="handleRevoke"
      @revoke-all="handleRevokeAll"
    />

    <!-- Modal Konfirmasi Cabut Semua Akses -->
    <Teleport to="body">
      <div
        v-if="showRevokeAllModal"
        class="fixed inset-0 z-[var(--z-confirm)] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800"
        >
          <div class="p-5 text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 dark:bg-red-900/30">
              <UIcon name="i-lucide-shield-off" class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {{ t('share_cabut_semua') }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {{ t('share_revoke_all_confirm') }}
            </p>
            <div class="flex gap-3 justify-center">
              <button
                @click="showRevokeAllModal = false; revokeAllShare = null"
                :disabled="isRevokingAll"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {{ t('share_batal') }}
              </button>
              <button
                @click="confirmRevokeAll"
                :disabled="isRevokingAll"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UIcon v-if="isRevokingAll" name="i-lucide-loader-circle" class="w-4 h-4 animate-spin" />
                {{ isRevokingAll ? t('share_memproses') : t('share_akhiri_akses') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

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
      :total-rows="pagination.total || sharedByMe.length"
      title="Pilih Kolom Export Saya Bagikan"
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