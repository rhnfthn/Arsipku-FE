<script setup lang="ts">
// Pemberian — list akses berkas yang sudah diberikan (entitlements)
// Tampilan persis seperti halaman Permintaan (/usulan-akses-berkas?tab=mine)
// Data dari endpoint /my-entitlements (akses yang diterima user)
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronDown, RotateCw } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import UsulanAksesBerkasBadge from '~/components/usulan-akses-berkas/UsulanAksesBerkasBadge.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { useUsulanAksesBerkasCounts } from '~/composables/useUsulanAksesBerkasCounts';
import { downloadCsv } from '~/utils/csv-export';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Pemberian Akses Berkas' });

const { t } = useI18n();
const { fetchMyEntitlements, markBerkasRead } = useUsulanAksesBerkas();
const { fetchCounts } = useUsulanAksesBerkasCounts();
const toast = useToast();

const extractErrorMessage = (err: any): string => {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) return beMessage.join(', ');
  if (typeof beMessage === 'string' && beMessage.trim()) return beMessage;
  return err?.message || 'Terjadi kesalahan';
};

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const filterStatus = ref('Semua');
const sortKey = ref('tanggalMulai');
const sortDir = ref<'asc' | 'desc'>('desc');
const isRefreshing = ref(false);
const isExporting = ref(false);

const breadcrumbs = computed(() => [
  { label: 'Kelola', to: '#' },
  { label: 'Penggunaan', to: '#' },
  { label: 'Pemberian', to: '/kelola/penggunaan/pemberian' },
]);

// Data dari my-entitlements — list akses yang diterima user
const entitlementList = ref<any[]>([]);
const loading = ref(false);

// Filter: tampilkan berkas yang masih berjalan ATAU sudah habis (tidak menampilkan yang belum mulai)
const activeEntitlements = computed(() => {
  const now = Date.now();
  return entitlementList.value.filter((e: any) => {
    // Harus punya tanggal mulai (sudah dimulai)
    if (!e.tanggalMulai) return false;
    if (new Date(e.tanggalMulai).getTime() > now) return false; // belum mulai
    return true; // sudah mulai (baik masih berjalan atau sudah habis)
  });
});

// Filter status: Semua / Aktif / Habis
const filteredEntitlements = computed(() => {
  let rows = activeEntitlements.value;
  if (filterStatus.value === 'Aktif') {
    rows = rows.filter((e: any) => getProgressPercent(e) < 100);
  } else if (filterStatus.value === 'Habis') {
    rows = rows.filter((e: any) => getProgressPercent(e) >= 100);
  }
  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    rows = rows.filter(
      (e: any) =>
        (e.judulUsulan || '').toLowerCase().includes(q) ||
        (e.nomorUsulanTerbaru || '').toLowerCase().includes(q) ||
        (e.divisiPemberiNama || '').toLowerCase().includes(q) ||
        (e.judulBerkas || '').toLowerCase().includes(q),
    );
  }
  // Sort
  const dir = sortDir.value === 'asc' ? 1 : -1;
  rows = [...rows].sort((a: any, b: any) => {
    if (sortKey.value === 'judulUsulan') {
      return (a.judulUsulan || '').localeCompare(b.judulUsulan || '') * dir;
    }
    if (sortKey.value === 'jenisBerkas') {
      return (a.jenisBerkas || '').localeCompare(b.jenisBerkas || '') * dir;
    }
    if (sortKey.value === 'nomorUsulan') {
      return (a.nomorUsulanTerbaru || '').localeCompare(b.nomorUsulanTerbaru || '') * dir;
    }
    if (sortKey.value === 'divisiPemberi') {
      return (a.divisiPemberiNama || '').localeCompare(b.divisiPemberiNama || '') * dir;
    }
    if (sortKey.value === 'tanggalMulai') {
      const ta = new Date(a.tanggalMulai || 0).getTime();
      const tb = new Date(b.tanggalMulai || 0).getTime();
      return (ta - tb) * dir;
    }
    // default: tanggalSelesai
    const ta = new Date(a.tanggalSelesai || 0).getTime();
    const tb = new Date(b.tanggalSelesai || 0).getTime();
    return (ta - tb) * dir;
  });
  return rows;
});

const totalPages = computed(() =>
  Math.ceil(filteredEntitlements.value.length / itemsPerPage.value) || 1,
);

// Paginated rows
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredEntitlements.value.slice(start, start + itemsPerPage.value);
});

const loadData = async () => {
  loading.value = true;
  try {
    const data = await fetchMyEntitlements();
    entitlementList.value = Array.isArray(data) ? data : (data?.data || []);
  } catch (err: any) {
    toast.add({ title: 'Error', description: extractErrorMessage(err), color: 'error' });
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async () => {
  isRefreshing.value = true;
  try {
    await loadData();
  } finally {
    isRefreshing.value = false;
  }
};

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
  currentPage.value = 1;
};

const exportData = async () => {
  if (filteredEntitlements.value.length === 0) {
    toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  isExporting.value = true;
  try {
    const headers = ['Tanggal', 'Nomor Usulan', 'Divisi Pemberi', 'Jenis Berkas', 'Judul Usulan', 'Progress', 'Status'];
    const csvRows = filteredEntitlements.value.map((r: any) => [
      formatDate(r.tanggalMulai),
      r.nomorUsulanTerbaru || '-',
      r.divisiPemberiNama || r.divisiPemberiId || '-',
      r.jenisBerkas === 'AKTIF' ? 'Aktif' : 'Inaktif',
      r.judulUsulan || '-',
      getProgressPercent(r) >= 100 ? 'Habis' : `${getProgressPercent(r)}%`,
      getProgressPercent(r) >= 100 ? 'Habis' : 'Aktif',
    ]);
    downloadCsv(`pemberian-akses-berkas_${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows);
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
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
  }, 400);
});
watch(filterStatus, () => { currentPage.value = 1; });
watch(itemsPerPage, () => { currentPage.value = 1; });

const goToDetail = (row: any) => {
  // Ambil usulanId pertama dari daftar usulan yang terkait berkas ini
  const usulanId = row?.usulanIds?.[0];
  if (!usulanId) {
    toast.add({ title: 'Error', description: 'Usulan tidak ditemukan untuk berkas ini', color: 'error' });
    return;
  }
  // Tandai berkas sebagai sudah dibaca (isRead=true) + update badge sidebar
  if (row?.berkasId && !row?.isRead) {
    row.isRead = true; // optimistic UI
    markBerkasRead(row.berkasId);
    fetchCounts(true);
  }
  // Langsung ke halaman berkas (table naskah), bukan usulan detail
  navigateTo(`/kelola/penggunaan/pemberian/${usulanId}/berkas`);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format durasi akses
function formatDurasiLabel(preset: string | undefined | null, customDate?: string | null): string {
  if (!preset) return '-';
  if (preset === 'CUSTOM' && customDate) {
    const tgl = new Date(customDate);
    return tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return preset.replace('_', ' ');
}

// ── Custom dropdown for rows per page ───────
const openRowsPerPage = ref(false);
const openStatusFilter = ref(false);
function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
}
function selectRowsPerPage(n: number) {
  itemsPerPage.value = n;
  openRowsPerPage.value = false;
  currentPage.value = 1;
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value = false;
  openStatusFilter.value = false;
}

// ── Progress bar ──
const getProgressPercent = (row: any): number => {
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
  if (!row.tanggalSelesai) return '-';
  const sisa = Math.ceil((new Date(row.tanggalSelesai).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (sisa <= 0) return 'Habis';
  return `${sisa} hari`;
};

// ── Columns ──
// Urutan: Tanggal, Nomor Usulan, Divisi Pemberi, Jenis Berkas, Judul Usulan, Progress, Aksi
const columns = [
  { key: 'tanggalMulai', label: 'Tanggal', sortable: true },
  { key: 'nomorUsulan', label: 'Nomor Usulan', sortable: true },
  { key: 'divisiPemberi', label: 'Divisi Pemberi', sortable: true },
  { key: 'jenisBerkas', label: 'Jenis Berkas', sortable: true, headerClass: 'text-center', class: 'text-center' },
  { key: 'judulUsulan', label: 'Judul Usulan', sortable: true },
  { key: 'progress', label: 'Progress' },
  { key: 'aksi', label: 'Aksi' },
];

onMounted(() => {
  loadData();
  fetchCounts(true);
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <!-- Header -->
    <div class="mb-5">
      <PageHeader :items="breadcrumbs">
        <template #title>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Pemberian Akses Berkas
          </h1>
        </template>
      </PageHeader>
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

          <!-- Search -->
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Cari judul berkas atau nomor usulan…"
            class="min-w-[180px] flex-1"
          />

          <!-- Status filter -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="openStatusFilter = !openStatusFilter"
              class="flex min-w-[110px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none transition-all hover:border-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <span>{{ filterStatus }}</span>
              <ChevronDown
                class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': openStatusFilter }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openStatusFilter"
                class="absolute left-0 top-full z-50 mt-1.5 min-w-[110px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  v-for="opt in ['Semua', 'Aktif', 'Habis']"
                  :key="opt"
                  type="button"
                  @click.stop="filterStatus = opt; openStatusFilter = false"
                  :class="[
                    'w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700',
                    filterStatus === opt
                      ? 'bg-primary/5 font-medium text-primary dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700'
                  ]"
                >
                  {{ opt }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
        <!-- Action buttons -->
        <div class="flex shrink-0 items-center gap-2">
          <!-- Refresh -->
          <button
            @click="handleRefresh"
            :disabled="isRefreshing"
            class="shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            title="Refresh"
            aria-label="Refresh"
          >
            <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
            Refresh
          </button>
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

      <!-- DataTable -->
      <DataTable
        :columns="columns"
        :rows="paginatedRows"
        :loading="loading"
        header-class="bg-primary dark:bg-primary-700 text-left text-white"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        empty-message="Belum ada akses berkas yang diberikan kepada Anda."
        @sort="handleSort"
      >
        <template #cell-tanggalMulai="{ row }">
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.tanggalMulai) }}</span>
        </template>
        <template #cell-nomorUsulan="{ row }">
          <span class="font-mono text-xs text-gray-800 dark:text-gray-200">{{ row.nomorUsulanTerbaru || '-' }}</span>
        </template>
        <template #cell-divisiPemberi="{ row }">
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ row.divisiPemberiNama || row.divisiPemberiId || '-' }}</span>
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
        <template #cell-judulUsulan="{ row }">
          <div class="max-w-[260px]">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ row.judulUsulan || '-' }}</p>
          </div>
        </template>
        <template #cell-tanggalSelesai="{ row }">
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.tanggalSelesai) }}</span>
        </template>
        <template #cell-progress="{ row }">
          <div class="flex items-center gap-2 min-w-[140px]">
            <div class="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="getProgressBarClass(getProgressPercent(row))"
                :style="{ width: `${getProgressPercent(row)}%` }"
              />
            </div>
            <span class="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ getProgressLabel(row) }}</span>
          </div>
        </template>
        <template #cell-aksi="{ row }">
          <div class="flex items-center justify-center gap-1.5">
            <button
              type="button"
              @click="goToDetail(row)"
              :class="[
                'relative inline-flex rounded-md p-1.5 transition-colors',
                row.isRead
                  ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300'
                  : 'hover:bg-[#457FB6]/10'
              ]"
              :style="!row.isRead ? { color: '#457FB6' } : {}"
              :title="row.isRead ? 'Sudah dibaca' : 'Lihat Naskah'"
            >
              <UIcon name="i-lucide-eye" class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>

      <!-- Pagination -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="filteredEntitlements.length"
        :per-page="itemsPerPage"
      />
    </div>
  </div>
</template>