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
import { StatusUsulan } from '~/types/usulan-akses-berkas';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Persetujuan Usulan Akses Berkas' });

const { t } = useI18n();
const { usulanList, pending, pagination, fetchList } = useUsulanAksesBerkas();
const { clearVerifikasiBadge, clearPilihBerkasBadge, fetchCounts } = useUsulanAksesBerkasCounts();
const { user } = useAuth();
const toast = useToast();

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
const activeTab = ref<TabValue>('all');

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

// Auto-select default tab berdasarkan peran
watchEffect(() => {
  if (activeTab.value === 'all' && tabs.value.length > 1) {
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

const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: 'Persetujuan', to: '#' },
  { label: 'Usulan Akses Berkas', to: '/usulan-akses-berkas' },
]);

const statusOptions = [
  { label: 'Semua', value: '' },
  { label: 'Menunggu Verifikasi Pengusul', value: StatusUsulan.MENUNGGU_VERIFIKASI_PENGUSUL },
  { label: 'Revisi Pengusul', value: StatusUsulan.REVISI_PENGUSUL },
  { label: 'Terkirim ke Pemberi', value: StatusUsulan.TERKIRIM_KE_PEMBERI },
  { label: 'Pemilihan Berkas', value: StatusUsulan.PEMILIHAN_BERKAS },
  { label: 'Menunggu Persetujuan Pemberi', value: StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI },
  { label: 'Akses Diterbitkan', value: StatusUsulan.AKSES_DITERBITKAN },
  { label: 'Ditolak', value: StatusUsulan.DITOLAK_PENGUSUL },
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
  { key: 'createdAt', label: 'Dibuat', sortable: true },
  { key: 'aksi', label: 'Aksi' },
];

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
      r.durasiAkses?.replace('_', ' '),
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
            Persetujuan Usulan Akses Berkas
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
        :rows="usulanList"
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
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ row.durasiAkses?.replace('_', ' ') }}</span>
        </template>
        <template #cell-status="{ row }">
          <UsulanAksesBerkasBadge :status="row.status" />
        </template>
        <template #cell-createdAt="{ row }">
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #cell-aksi="{ row }">
          <NuxtLink
            :to="`/usulan-akses-berkas/${row.id}`"
            class="inline-flex rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400"
            title="Lihat Detail"
          >
            <UIcon name="i-lucide-eye" class="h-4 w-4" />
          </NuxtLink>
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
  </div>
</template>