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

const { t } = useI18n();
useHead({ title: () => t('share_title') });
const toast = useToast();

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
  filterStatus.value = 'Semua';
  searchQuery.value = '';
  activeSortLabel.value = t('share_terbaru');
  currentPage.value = 1;
  loadData();
};

/** Export all data to CSV (fetch with limit = total, then format). */
const isExporting = ref(false);
const exportData = async () => {
  if (pagination.total === 0) {
    toast.add({ title: t('share_tidak_ada_data'), description: t('share_tidak_ada_export'), color: 'warning' });
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
      sort: activeSortLabel.value === t('share_terlama') ? 'ASC' : 'DESC',
    });
    const rows = sharedByMe.value;
    if (!rows.length) {
      toast.add({ title: t('share_tidak_ada_data'), description: t('share_tidak_ada_export'), color: 'warning' });
      return;
    }
    const headers = [t('share_perihal'), t('share_jenis'), t('share_nomor'), t('share_dibagikan_kepada'), t('share_akses'), t('share_status'), t('share_tanggal')];
    const csvRows = rows.map((s: any) => [
      s.naskahPerihal || t('share_tanpa_perihal'),
      s.naskahJenis || '-',
      s.naskahNomor || '-',
      s.recipients?.map((r: any) => r.nama).join('; ') || '-',
      s.accessType === 'SEKALI_LIHAT' ? t('share_sekali_lihat') : `${s.durationDays || '-'} ${t('share_hari')}`,
      s.status === 'AKTIF' ? t('share_aktif') : t('share_berakhir'),
      formatShortDate(s.createdAt),
    ]);
    downloadCsv(`saya-bagikan_${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows);
    toast.add({ title: t('share_berhasil'), description: t('share_berhasil_export', { count: csvRows.length }), color: 'success' });
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
        <SharedByMeTab
          :shares="sharedByMe"
          :loading="pending"
          :total="pagination.total"
          :page="currentPage"
          :limit="itemsPerPage"
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
    <ConfirmModal
      v-model="showRevokeAllModal"
      :title="t('share_cabut_semua')"
      :description="t('share_revoke_all_confirm')"
      :confirm-text="t('share_akhiri_akses')"
      :cancel-text="t('share_batal')"
      :loading-text="t('share_memproses')"
      :loading="isRevokingAll"
      variant="danger"
      @confirm="confirmRevokeAll"
      @cancel="revokeAllShare = null"
    />

    <!-- PDF Viewer Full Page -->
    <SharePdfViewer
      v-model="showPdfViewer"
      :url="pdfViewerUrl"
      :title="pdfViewerTitle"
      :loading="isLoadingPdf"
      @close="showPdfViewer = false; pdfViewerUrl = ''"
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