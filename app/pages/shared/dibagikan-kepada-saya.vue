<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { RotateCcw, ChevronDown, Search } from 'lucide-vue-next';
import SharedToMeTab from '~/components/shared/SharedToMeTab.vue';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useHead({ title: 'Dibagikan Kepada Saya' });
const { t } = useI18n();

const {
  sharedToMe,
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
  { label: 'Dibagikan Kepada Saya', to: '#' },
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

const handleOpenShare = async (share: any) => {
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
  pdfViewerTitle.value = share.naskahPerihal || 'Dokumen';
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
    loadData();
  } finally {
    isLoadingPdf.value = false;
  }
};

onMounted(() => { loadData(); });
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <PageHeader title="Dibagikan Kepada Saya" :items="breadcrumbs" />

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
                class="h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
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
              class="h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[130px] justify-between hover:border-primary transition-all"
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
              class="h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[100px] justify-between hover:border-primary transition-all"
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
          @update:page="currentPage = $event"
          @open="handleOpenShare"
          @view="handleViewDetail"
          @open-pdf="handleOpenPdf"
          @refresh="handleRefresh"
        />
      </div>
    </div>

    <!-- Detail Modal -->
    <SharedShareDetailModal
      v-if="showDetailModal && detailShare"
      :share="detailShare"
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