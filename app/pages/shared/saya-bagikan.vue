<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { RotateCcw, ChevronDown, Search } from 'lucide-vue-next';
import SharedByMeTab from '~/components/shared/SharedByMeTab.vue';
import { downloadCsv } from '~/utils/csv-export';
import { formatShortDate } from '~/utils/mail-helpers';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useHead({ title: 'Saya Bagikan' });
const { t } = useI18n();

const {
  sharedByMe,
  pending,
  pagination,
  fetchShares,
  openNaskah,
  getShareDetail,
} = useNaskahShare();

// ── Breadcrumbs ──────────────────────────────────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: 'Berbagi', to: '/shared/saya-bagikan' },
  { label: 'Saya Bagikan', to: '#' },
]);

// ── Search & Filter ──────────────────────────────────────────────────────────
const searchQuery = ref('');
const activeSortLabel = ref('Terbaru');
const itemsPerPage = ref(10);
const currentPage = ref(1);

const showSortMenu = ref(false);
const showPageMenu = ref(false);
const showStatusDropdown = ref(false);

const filterStatus = ref('Semua');
const statusOptions = [
  { label: 'Semua Status', value: 'Semua' },
  { label: 'Aktif', value: 'AKTIF' },
  { label: 'Berakhir', value: 'BERAKHIR' },
];

const filterStatusLabel = computed(() =>
  statusOptions.find((s) => s.value === filterStatus.value)?.label ?? 'Semua Status'
);

const selectStatus = (val: string) => {
  filterStatus.value = val;
  showStatusDropdown.value = false;
  currentPage.value = 1;
  loadData();
};

const sortOptions = [
  { label: 'Terbaru', value: 'Terbaru' },
  { label: 'Terlama', value: 'Terlama' },
];
const pageOptions = [10, 25, 50, 100];

// ── Modals ───────────────────────────────────────────────────────────────────
const showRevokeModal = ref(false);
const revokeShareId = ref('');
const revokeRecipientId = ref('');
const revokeRecipientName = ref('');
const revokeSharePerihal = ref('');

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
      tab: 'shared-by-me',
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
      status: filterStatus.value !== 'Semua' ? filterStatus.value : undefined,
      sort: activeSortLabel.value === 'Terlama' ? 'ASC' : 'DESC',
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

const isExporting = ref(false);
const exportData = async () => {
  if (pagination.total === 0) {
    useToast().add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  isExporting.value = true;
  try {
    // Fetch SEMUA data (bukan hanya halaman saat ini) dengan filter yang sama
    await fetchShares({
      tab: 'shared-by-me',
      page: 1,
      limit: pagination.total || 9999,
      search: searchQuery.value || undefined,
      status: filterStatus.value !== 'Semua' ? filterStatus.value : undefined,
      sort: activeSortLabel.value === 'Terlama' ? 'ASC' : 'DESC',
    });
    const rows = sharedByMe.value;
    if (!rows.length) {
      useToast().add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
      return;
    }
    const headers = ['Perihal', 'Jenis', 'Nomor', 'Dibagikan Kepada', 'Akses', 'Status', 'Tanggal'];
    const csvRows = rows.map((s: any) => [
      s.naskahPerihal || '(Tanpa perihal)',
      s.naskahJenis || '-',
      s.naskahNomor || '-',
      s.recipients?.map((r: any) => r.nama).join('; ') || '-',
      s.accessType === 'SEKALI_LIHAT' ? 'Sekali Lihat' : `${s.durationDays || '-'} hari`,
      s.status === 'AKTIF' ? 'Aktif' : 'Berakhir',
      formatShortDate(s.createdAt),
    ]);
    downloadCsv(`saya-bagikan_${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows);
    useToast().add({ title: 'Berhasil', description: `${csvRows.length} data berhasil diexport`, color: 'success' });
    // Reload halaman saat ini
    await loadData();
  } catch (e) {
    console.error('Gagal export:', e);
    useToast().add({ title: 'Gagal export', description: 'Silakan coba kembali.', color: 'error' });
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

const handleRevoked = () => loadData();

const handleRevokeAll = async (share: any) => {
  try {
    const { revokeShare } = useNaskahShare();
    await revokeShare(share.id);
    useToast().add({
      title: 'Berhasil',
      description: 'Semua akses share berhasil diakhiri',
      color: 'success',
    });
    showDetailModal.value = false;
    loadData();
  } catch (err: any) {
    useToast().add({
      title: 'Gagal',
      description: err?.response?.data?.message || err?.message || 'Gagal mencabut akses',
      color: 'error',
    });
  }
};

// ── Reopen (akses ulang) — pemberi ──
const showReopenModal = ref(false);
const reopenShare = ref<any>(null);

const handleApproveReopen = (share: any) => {
  reopenShare.value = share;
  showReopenModal.value = true;
};

const handleReopenApproved = () => {
  showReopenModal.value = false;
  showDetailModal.value = false;
  loadData();
};

const handleRejectReopen = async (share: any) => {
  try {
    const { rejectReopen } = useNaskahShare();
    await rejectReopen(share.id);
    useToast().add({
      title: 'Berhasil',
      description: 'Permintaan akses ulang ditolak',
      color: 'success',
    });
    showDetailModal.value = false;
    loadData();
  } catch (err: any) {
    useToast().add({
      title: 'Gagal',
      description: err?.response?.data?.message || err?.message || 'Gagal menolak permintaan',
      color: 'error',
    });
  }
};

const handleOpenPdf = async (share: any) => {
  isLoadingPdf.value = true;
  pdfViewerTitle.value = share.naskahPerihal || 'Dokumen';
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
    useToast().add({
      title: 'Tidak dapat membuka',
      description: msg.includes('sekali') || msg.includes('ditutup')
        ? 'Anda hanya dapat membuka naskah ini sekali. Akses sudah ditutup.'
        : msg || 'Gagal membuka naskah',
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
    <PageHeader title="Saya Bagikan" :items="breadcrumbs" />

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

          <!-- SEARCH -->
          <div class="relative flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari perihal atau nomor..."
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
            Refresh
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
            Export
          </button>
        </div>
      </div>

      <!-- ── CONTENT ─────────────────────────────────────────────────────── -->
      <div class="overflow-x-auto">
        <SharedByMeTab
          :shares="sharedByMe"
          :loading="pending"
          :total="pagination.total"
          :page="currentPage"
          :limit="itemsPerPage"
          @update:page="currentPage = $event"
          @view="handleViewDetail"
          @open-pdf="handleOpenPdf"
          @revoke="handleRevoke"
          @refresh="handleRefresh"
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
      @revoked="handleRevoked"
    />

    <!-- Detail Modal -->
    <SharedShareDetailModal
      v-if="showDetailModal && detailShare"
      :share="detailShare"
      :is-sender="true"
      @close="showDetailModal = false"
      @revoke-recipient="handleRevoke"
      @revoke-all="handleRevokeAll"
      @approve-reopen="handleApproveReopen"
      @reject-reopen="handleRejectReopen"
    />

    <!-- Reopen Share Modal (pemberi setujui akses ulang) -->
    <SharedReopenShareModal
      v-if="showReopenModal && reopenShare"
      :share-id="reopenShare.id"
      :naskah-perihal="reopenShare.naskahPerihal"
      :recipient-name="reopenShare.recipients?.find((r: any) => r.requestStatus === 'MENUNGGU')?.nama"
      @close="showReopenModal = false"
      @approved="handleReopenApproved"
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
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Memuat dokumen...</p>
            </div>
          </div>
          <iframe v-if="pdfViewerUrl" :key="pdfViewerUrl" :src="pdfViewerUrl" class="w-full h-full border-none" />
          <div v-else-if="!isLoadingPdf" class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
            <Icon name="i-lucide-file-text" class="w-12 h-12 opacity-30" />
            <span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
          </div>
        </div>
      </div>
    </Teleport>
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