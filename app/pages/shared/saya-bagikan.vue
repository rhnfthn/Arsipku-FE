<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { RotateCw, ArrowUpDown, Search, X } from 'lucide-vue-next';
import SharedByMeTab from '~/components/shared/SharedByMeTab.vue';

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

const sortOptions = [
  { label: 'Terbaru', value: 'Terbaru' },
  { label: 'Terlama', value: 'Terlama' },
];
const pageOptions = [10, 25, 50, 100];

// ── Modals ───────────────────────────────────────────────────────────────────
const showShareModal = ref(false);
const shareModalNaskahId = ref('');
const shareModalNaskahPerihal = ref('');
const shareModalNaskahNomor = ref('');

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

const handleRevoke = (payload: { share: any; recipientId: string; recipientName: string }) => {
  revokeShareId.value = payload.share.id;
  revokeSharePerihal.value = payload.share.naskahPerihal;
  revokeRecipientId.value = payload.recipientId;
  revokeRecipientName.value = payload.recipientName;
  showRevokeModal.value = true;
};

const handleViewDetail = (share: any) => {
  detailShare.value = share;
  showDetailModal.value = true;
};

const handleRevoked = () => loadData();

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
      class="w-full flex flex-col bg-transparent dark:bg-gray-900 overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue transition-colors"
    >
      <!-- ── TOOLBAR ─────────────────────────────────────────────────────── -->
      <div
        class="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors"
      >
        <!-- LEFT: Refresh -->
        <div class="flex items-center gap-2 shrink-0 min-w-0">
          <UTooltip text="Muat ulang">
            <button
              @click="handleRefresh"
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
            >
              <RotateCw
                class="w-4 h-4 transition-transform duration-300"
                :class="{ 'animate-spin': isRefreshing }"
              />
            </button>
          </UTooltip>
        </div>

        <!-- RIGHT: Search + Sort + Page Size -->
        <div class="flex items-center gap-1 shrink-0 min-w-0">
          <!-- Search -->
          <div class="relative">
            <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari perihal atau nomor..."
              class="pl-8 pr-8 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary w-48 sm:w-56 transition-colors"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block" />

          <!-- Sort -->
          <div class="relative">
            <UTooltip text="Urutkan">
              <button
                @click="showSortMenu = !showSortMenu"
                class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
              >
                <ArrowUpDown class="w-4 h-4" />
              </button>
            </UTooltip>
            <div v-if="showSortMenu" @click="showSortMenu = false" class="fixed inset-0 z-40 bg-transparent" />
            <div
              v-if="showSortMenu"
              class="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <button
                v-for="opt in sortOptions"
                :key="opt.value"
                @click="selectSortOption(opt.value)"
                class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
              >
                <span :class="activeSortLabel === opt.value ? 'font-semibold text-primary' : ''">{{ opt.label }}</span>
                <svg v-if="activeSortLabel === opt.value" class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          </div>

          <!-- Page Size -->
          <div class="relative">
            <UTooltip text="Item per halaman">
              <button
                @click="showPageMenu = !showPageMenu"
                class="flex items-center gap-1 p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors text-xs"
              >
                {{ itemsPerPage }}
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
            </UTooltip>
            <div v-if="showPageMenu" @click="showPageMenu = false" class="fixed inset-0 z-40 bg-transparent" />
            <div
              v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-20 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <button
                v-for="opt in pageOptions"
                :key="opt"
                @click="selectPageSize(opt)"
                class="w-full text-center px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                :class="itemsPerPage === opt ? 'font-semibold text-primary' : ''"
              >
                {{ opt }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── CONTENT ─────────────────────────────────────────────────────── -->
      <div class="bg-white dark:bg-gray-900">
        <SharedByMeTab
          :shares="sharedByMe"
          :loading="pending"
          :total="pagination.total"
          :page="currentPage"
          :limit="itemsPerPage"
          @update:page="currentPage = $event"
          @view="handleViewDetail"
          @open-pdf="handleOpenPdf"
          @refresh="handleRefresh"
        />
      </div>
    </div>

    <!-- Revoke Modal -->
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
