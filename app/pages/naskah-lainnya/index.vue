<template>
  <div class="flex flex-col gap-4">
    <PageHeader title="Naskah Lainnya" :items="breadcrumbs" />

    <!-- Table Card (pola berkas-saya: toolbar + DataTable + DataPagination) -->
    <div
      class="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Toolbar -->
      <div class="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center gap-3 w-full">
        <div class="flex items-center gap-3 flex-wrap flex-1">
          <!-- ROWS PER PAGE -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleRowsPerPage"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[70px] justify-between"
            >
              <span>{{ perPage }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openRowsPerPage }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openRowsPerPage"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[80px]"
              >
                <button
                  v-for="n in [10, 25, 50]"
                  :key="n"
                  type="button"
                  @click.stop="selectRowsPerPage(n)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    perPage === n
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER JENIS -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterJenis"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] justify-between"
            >
              <span class="truncate">{{ jenisLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterJenis }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterJenis"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[280px]"
              >
                <div class="border-b border-gray-100 p-2 dark:border-gray-700">
                  <div class="relative">
                    <UIcon
                      name="i-lucide-search"
                      class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="jenisFilterSearch"
                      type="text"
                      placeholder="Cari jenis naskah…"
                      class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:focus:bg-gray-800"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="max-h-72 overflow-y-auto">
                  <button
                    v-for="opt in filteredJenisOptions"
                    :key="opt.value"
                    type="button"
                    @click.stop="selectFilterJenis(opt.value)"
                    :class="[
                      'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                      filterJenis === opt.value
                        ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                    ]"
                  >
                    {{ opt.label }}
                  </button>
                  <div
                    v-if="filteredJenisOptions.length === 0"
                    class="px-4 py-3 text-sm text-gray-400"
                  >
                    Jenis naskah tidak ditemukan.
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- FILTER TAHAPAN -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterTahapan"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[150px] justify-between"
            >
              <span class="truncate">{{ tahapanLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterTahapan }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterTahapan"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[280px]"
              >
                <div class="border-b border-gray-100 p-2 dark:border-gray-700">
                  <div class="relative">
                    <UIcon
                      name="i-lucide-search"
                      class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="tahapanFilterSearch"
                      type="text"
                      placeholder="Cari tahapan…"
                      class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:focus:bg-gray-800"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="max-h-72 overflow-y-auto">
                  <button
                    v-for="opt in filteredTahapanOptions"
                    :key="opt.value"
                    type="button"
                    @click.stop="selectFilterTahapan(opt.value)"
                    :class="[
                      'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                      filterTahapan === opt.value
                        ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                    ]"
                  >
                    {{ opt.label }}
                  </button>
                  <div
                    v-if="filteredTahapanOptions.length === 0"
                    class="px-4 py-3 text-sm text-gray-400"
                  >
                    Tahapan tidak ditemukan.
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <button
            type="button"
            @click="resetFilters"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            title="Reset Filter"
          >
            <RotateCcw class="w-4 h-4" />
          </button>

          <div class="relative flex-1 min-w-[180px]">
            <UIcon
              name="i-lucide-search"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              v-model="search"
              type="text"
              placeholder="Cari perihal naskah…"
              class="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
            />
          </div>
        </div>
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

      <!-- Table -->
      <DataTable
        :columns="columns"
        :rows="tableRows"
        :loading="pending"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        header-class="bg-primary dark:bg-primary-700 text-white text-left"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        empty-message="Belum ada naskah."
        @sort="handleSort"
      >
        <template #cell-nomor="{ row }">
          <button
            class="font-mono text-xs text-primary-600 hover:underline"
            @click="goDetail(row.id)"
          >
            {{ row.nomor }}
          </button>
        </template>
        <template #cell-perihal="{ row }">
          <span class="block max-w-xs truncate" :title="row.perihal">{{ row.perihal }}</span>
        </template>
        <template #cell-tahapan="{ row }">
          <StatusBadge :status="row.tahapan" />
        </template>
        <template #cell-aksi="{ row }">
          <UButton size="xs" color="primary" variant="soft" @click="goDetail(row.id)"
            >Detail</UButton
          >
        </template>
      </DataTable>

      <!-- Pagination -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="totalItems"
        :per-page="perPage"
      />
    </div>

    <div
      v-if="error"
      class="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
    >
      <UIcon name="i-lucide-circle-alert" class="mt-0.5 h-5 w-5 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { RotateCcw, ChevronDown } from 'lucide-vue-next';
import { useNaskahLainnya } from '~/composables/useNaskahLainnya';
import type { Tahapan } from '~/types/naskah-lainnya';
import { JENIS_LABELS, TAHAPAN_STEP } from '~/types/naskah-lainnya';
import { downloadCsv } from '~/utils/csv-export';
import { formatNaskahDateTime } from '~/utils/naskah-lainnya-date';

definePageMeta({ layout: 'default', middleware: ['auth'] });

const { items, pending, error, fetchList } = useNaskahLainnya();
const toast = useToast();

const search = ref('');
const filterJenis = ref('');
const filterTahapan = ref('');
const jenisFilterSearch = ref('');
const tahapanFilterSearch = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const sortKey = ref('terakhirDiubah');
const sortDir = ref<'asc' | 'desc'>('desc');
const isExporting = ref(false);

const { t } = useI18n();
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: t('daftar_naskah'), to: '#' },
]);

const jenisOptions = [
  { label: 'Semua Naskah', value: '' },
  ...Object.entries(JENIS_LABELS).map(([value, label]) => ({
    label: `${value} — ${label}`,
    value,
  })),
];
const tahapanFilterLabels: Record<Tahapan, string> = {
  konsep: 'Konsep',
  persetujuan: 'Persetujuan',
  legal_drafting: 'Legal Drafting',
  evaluasi: 'Evaluasi',
  persetujuan_lanjutan: 'Persetujuan Lanjutan',
  evaluasi_final: 'Evaluasi Final EVP',
  persetujuan_direksi: 'Persetujuan Direksi',
  tanda_tangan_pemrakarsa: 'TTD Pemrakarsa',
  blanko_verbal: 'Blanko Verbal / Persetujuan Direksi',
  tanda_tangan_legal: 'TTD Legal',
  tanda_tangan_pejabat: 'TTD Pejabat',
  tanda_tangan: 'Menunggu Tanda Tangan',
  selesai: 'Selesai',
  perlu_perbaikan: 'Perlu Perbaikan',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
};
const tahapanOptions = [
  { label: 'Semua Tahapan', value: '' },
  ...Object.keys(TAHAPAN_STEP).map((value) => ({
    label: tahapanFilterLabels[value as Tahapan] ?? value.replace(/_/g, ' '),
    value,
  })),
];
const filterOptionBySearch = (query: string, opt: { label: string; value: string }) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [opt.label, opt.value].some((v) => v.toLowerCase().includes(q));
};
const filteredJenisOptions = computed(() =>
  jenisOptions.filter((opt) => filterOptionBySearch(jenisFilterSearch.value, opt))
);
const filteredTahapanOptions = computed(() =>
  tahapanOptions.filter((opt) => filterOptionBySearch(tahapanFilterSearch.value, opt))
);

const columns = [
  { key: 'nomor', label: 'Nomor', sortable: true },
  { key: 'jenis', label: 'Jenis', sortable: true },
  { key: 'perihal', label: 'Perihal', sortable: true },
  { key: 'pemrakarsa', label: 'Pemrakarsa', sortable: true },
  { key: 'konseptor', label: 'Konseptor', sortable: true },
  { key: 'tahapan', label: 'Tahapan', sortable: true },
  { key: 'terakhirDiubah', label: 'Diubah', sortable: true },
  { key: 'aksi', label: 'Aksi' },
];

// ── Custom Dropdown Toolbar State (pola berkas-saya) ──────────────

const openRowsPerPage = ref(false);
const openFilterJenis = ref(false);
const openFilterTahapan = ref(false);

const jenisLabel = computed(
  () => jenisOptions.find((o) => o.value === filterJenis.value)?.label ?? 'Semua Naskah'
);
const tahapanLabel = computed(
  () => tahapanOptions.find((o) => o.value === filterTahapan.value)?.label ?? 'Semua Tahapan'
);

function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
  openFilterJenis.value = false;
  openFilterTahapan.value = false;
}
function toggleFilterJenis() {
  openFilterJenis.value = !openFilterJenis.value;
  openRowsPerPage.value = false;
  openFilterTahapan.value = false;
}
function toggleFilterTahapan() {
  openFilterTahapan.value = !openFilterTahapan.value;
  openRowsPerPage.value = false;
  openFilterJenis.value = false;
}
function selectRowsPerPage(n: number) {
  perPage.value = n;
  openRowsPerPage.value = false;
}
function selectFilterJenis(val: string) {
  filterJenis.value = val;
  jenisFilterSearch.value = '';
  openFilterJenis.value = false;
}
function selectFilterTahapan(val: string) {
  filterTahapan.value = val;
  tahapanFilterSearch.value = '';
  openFilterTahapan.value = false;
}
function resetFilters() {
  filterJenis.value = '';
  filterTahapan.value = '';
  jenisFilterSearch.value = '';
  tahapanFilterSearch.value = '';
  currentPage.value = 1;
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value = openFilterJenis.value = openFilterTahapan.value = false;
  jenisFilterSearch.value = '';
  tahapanFilterSearch.value = '';
}

// ── Sort + Pagination (client-side; API mengembalikan list penuh) ─

const displayRows = computed(() =>
  items.value.map((r) => ({
    id: r.id,
    nomor: r.nomor ?? '<draft>',
    jenis: r.jenis,
    perihal: r.perihal,
    pemrakarsa: r.pemrakarsaPejabat?.nama ?? r.pemrakarsa.nama,
    konseptor: r.pemrakarsa.nama,
    tahapan:
      r.tahapan === 'selesai' && r.signOption === 'ttd_basah'
        ? r.manualFinalStatus === 'final' || r.documentStatus === 'final'
          ? 'selesai_final'
          : 'selesai_belum_final'
        : r.tahapan,
    terakhirDiubah: r.terakhirDiubah,
  }))
);

const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1;
  return [...displayRows.value].sort((a, b) => {
    const av = (a as any)[sortKey.value];
    const bv = (b as any)[sortKey.value];
    if (av == null) return 1;
    if (bv == null) return -1;
    return String(av).localeCompare(String(bv), 'id') * dir;
  });
});

const totalItems = computed(() => sortedRows.value.length);

const tableRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return sortedRows.value.slice(start, start + perPage.value).map((r) => ({
    ...r,
    terakhirDiubah: formatNaskahDateTime(r.terakhirDiubah),
  }));
});

const errorMessage = computed(
  () => (error.value as any)?.response?.data?.message ?? 'Gagal memuat daftar naskah.'
);

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
}

// ── Data Fetching ─────────────────────────────────────────────────

function load() {
  return fetchList({
    search: search.value,
    jenis: filterJenis.value,
    tahapan: filterTahapan.value,
  });
}
function goDetail(id: string) {
  navigateTo(`/naskah-lainnya/${id}`);
}

// ── Export CSV ───────────────────────────────────────────────────

async function exportData() {
  if (totalItems.value === 0) {
    toast.add({
      title: 'Tidak ada data',
      description: 'Tidak ada data untuk diexport',
      color: 'warning',
    });
    return;
  }
  isExporting.value = true;
  try {
    await load();
    const rows = displayRows.value;
    if (!rows.length) {
      toast.add({
        title: 'Tidak ada data',
        description: 'Tidak ada data untuk diexport',
        color: 'warning',
      });
      return;
    }
    const headers = ['Nomor', 'Jenis', 'Perihal', 'Pemrakarsa', 'Tahapan', 'Diubah'];
    const csvRows = rows.map((r) => [
      r.nomor,
      r.jenis,
      r.perihal,
      r.pemrakarsa,
      r.tahapan,
      r.terakhirDiubah,
    ]);
    downloadCsv(`naskah-lainnya_${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows);
    toast.add({
      title: 'Berhasil',
      description: `${rows.length} data berhasil diexport`,
      color: 'success',
    });
  } catch (e) {
    console.error('Gagal export naskah:', e);
    toast.add({ title: 'Gagal export', description: 'Silakan coba kembali.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
}

// ── Watchers (pola berkas-saya) ──────────────────────────────────

// Filter changes -> reset to page 1 (the currentPage watcher then fetches;
// if already on page 1, fetch directly so the change still applies).
watch([search, filterJenis, filterTahapan], () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else load();
});

// Page/perPage changes -> fetch (perPage change resets to page 1 first).
watch([currentPage, perPage], ([, newPerPage], [, oldPerPage]) => {
  if (newPerPage !== oldPerPage && currentPage.value !== 1) {
    currentPage.value = 1;
    return;
  }
  load();
});

// Sort changes -> reset to page 1 (currentPage watcher fetches; if on page 1, fetch directly).
watch([sortKey, sortDir], () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else load();
});

// ── Init ──────────────────────────────────────────────────────────

onMounted(() => {
  load();
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<style scoped>
[data-custom-dropdown] button:focus {
  outline: none;
}
.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-4px);
}
.filter-dd-enter-to,
.filter-dd-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}
</style>
