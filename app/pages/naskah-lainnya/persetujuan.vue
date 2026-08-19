<template>
  <div class="flex flex-col gap-4">
    <PageHeader title="Persetujuan" :items="breadcrumbs" />

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

          <!-- FILTER STATUS (Menunggu / Disetujui / Ditolak) -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterStatus"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[190px] justify-between"
            >
              <span class="flex items-center gap-1.5 truncate">
                <UIcon name="i-lucide-list-filter" class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span class="truncate">{{ currentFilterLabel }}</span>
              </span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterStatus }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterStatus"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[210px]"
              >
                <button
                  v-for="tab in filterTabs"
                  :key="tab.value"
                  type="button"
                  @click.stop="selectFilterStatus(tab.value)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    filterStatus === tab.value
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ tab.label }}
                </button>
              </div>
            </Transition>
          </div>

          <div class="relative flex-1 min-w-[180px]">
            <UIcon
              name="i-lucide-search"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              v-model="search"
              type="text"
              placeholder="Cari perihal, nomor, atau pemrakarsa…"
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
        empty-message="Tidak ada antrian persetujuan."
        @sort="handleSort"
      >
        <template #cell-nomor="{ row }">
          <button class="font-mono text-xs text-primary-600 hover:underline" @click="openAction(row)">{{ row.nomor }}</button>
        </template>
        <template #cell-jenis="{ row }">
          <span class="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{{ row.jenis }}</span>
        </template>
        <template #cell-perihal="{ row }">
          <div class="text-sm text-gray-700 dark:text-gray-300">{{ row.perihal }}</div>
          <div v-if="row.tahapanRaw === 'perlu_perbaikan'" class="text-xs text-orange-500">Perlu revisi — lihat detail naskah.</div>
        </template>
        <template #cell-tahapan="{ row }">
          <StatusBadge :status="row.tahapan" />
        </template>
        <template #cell-status="{ row }">
          <StatusBadge :status="row.tahapan === 'perlu_perbaikan' ? 'perlu_perbaikan' : 'waiting'" />
        </template>
        <template #cell-aksi="{ row }">
          <UButton size="xs" color="primary" variant="soft" @click="openAction(row)">Proses</UButton>
        </template>
      </DataTable>

      <!-- Pagination -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="totalItems"
        :per-page="perPage"
      />
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</div>

    <!-- Modal Setujui -->
    <Modal v-model="modalOpen" :hide-default-footer="true">
      <template #title>Setujui — {{ selected?.nomor ?? '' }}</template>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-gray-500">{{ selected?.perihal }}</p>
        <UInput v-model="catatan" placeholder="Catatan (opsional)" />
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex gap-2">
            <UButton size="xs" color="error" variant="soft" icon="i-lucide-x" @click="tolakOpen = true">Tolak</UButton>
            <UButton size="xs" color="warning" variant="soft" icon="i-lucide-undo-2" @click="kembaliOpen = true">Kembalikan</UButton>
          </div>
          <div class="flex gap-2">
            <UButton color="neutral" variant="ghost" @click="modalOpen = false">Batal</UButton>
            <UButton color="success" icon="i-lucide-check" :loading="busy" @click="doSetuju">Setujui</UButton>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Modal Tolak -->
    <Modal v-model="tolakOpen" :hide-default-footer="true">
      <template #title>Tolak — {{ selected?.nomor ?? '' }}</template>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-gray-500">Alasan penolakan wajib diisi.</p>
        <UTextarea v-model="alasan" placeholder="Alasan…" />
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="tolakOpen = false">Batal</UButton>
          <UButton color="error" icon="i-lucide-x" :loading="busy" :disabled="!alasan" @click="doTolak">Tolak</UButton>
        </div>
      </div>
    </Modal>

    <!-- Modal Kembalikan -->
    <Modal v-model="kembaliOpen" :hide-default-footer="true">
      <template #title>Kembalikan — {{ selected?.nomor ?? '' }}</template>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-gray-500">Alasan wajib diisi; sertakan dokumen revisi bila ada.</p>
        <UTextarea v-model="alasan" placeholder="Alasan…" />
        <FileUpload v-model="revisiFiles" :multiple="false" accept=".docx" label="+ Dokumen Revisi (opsional)" />
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="kembaliOpen = false">Batal</UButton>
          <UButton color="warning" icon="i-lucide-undo-2" :loading="busy" :disabled="!alasan" @click="doKembali">Kembalikan</UButton>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import { useNaskahLainnya } from '~/composables/useNaskahLainnya';
import { downloadCsv } from '~/utils/csv-export';
import type { NaskahListItem } from '~/types/naskah-lainnya';

definePageMeta({ layout: 'default', middleware: ['auth'] });

const { persetujuan, detail, pending, error, fetchPersetujuan, fetchDetail, setuju, tolak, kembalikan } = useNaskahLainnya();
const { t } = useI18n();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: t('persetujuan'), to: '#' },
]);

const selected = ref<NaskahListItem | null>(null);
const modalOpen = ref(false);
const tolakOpen = ref(false);
const kembaliOpen = ref(false);
const catatan = ref('');
const alasan = ref('');
const busy = ref(false);
const revisiFiles = ref<File[]>([]);

const search = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const sortKey = ref('nomor');
const sortDir = ref<'asc' | 'desc'>('asc');
const isExporting = ref(false);

// Filter status persetujuan (menunggu / disetujui / ditolak).
const filterStatus = ref<'menunggu' | 'disetujui' | 'ditolak'>('menunggu');
const filterTabs: { value: 'menunggu' | 'disetujui' | 'ditolak'; label: string }[] = [
  { value: 'menunggu', label: 'Menunggu Persetujuan Anda' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
];

const columns = [
  { key: 'nomor', label: 'Nomor', sortable: true },
  { key: 'jenis', label: 'Jenis', sortable: true },
  { key: 'pemrakarsa', label: 'Pemrakarsa', sortable: true },
  { key: 'perihal', label: 'Perihal', sortable: true },
  { key: 'tahapan', label: 'Tahapan', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'aksi', label: '' },
];

// ── Custom Dropdown Toolbar State (pola berkas-saya) ──────────────

const openRowsPerPage = ref(false);
const openFilterStatus = ref(false);

function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
}
function selectRowsPerPage(n: number) {
  perPage.value = n;
  openRowsPerPage.value = false;
}

function toggleFilterStatus() {
  openFilterStatus.value = !openFilterStatus.value;
}
function selectFilterStatus(v: 'menunggu' | 'disetujui' | 'ditolak') {
  filterStatus.value = v;
  openFilterStatus.value = false;
}
const currentFilterLabel = computed(
  () => filterTabs.find((t) => t.value === filterStatus.value)?.label ?? 'Filter',
);

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
}

// ── Search + Sort + Pagination (client-side; API mengembalikan list penuh) ─

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return persetujuan.value;
  return persetujuan.value.filter((r) =>
    [r.nomor, r.perihal, r.pemrakarsa.nama].some((v) => String(v ?? '').toLowerCase().includes(q))
  );
});

const displayRows = computed(() =>
  filteredRows.value.map((r) => ({
    id: r.id,
    nomor: r.nomor ?? '<draft>',
    jenis: r.jenis,
    pemrakarsa: r.pemrakarsa.nama,
    perihal: r.perihal,
    tahapan: r.tahapan.replace(/_/g, ' '),
    tahapanRaw: r.tahapan,
    status: r.tahapan === 'perlu_perbaikan' ? 'Perlu Perbaikan' : 'Menunggu',
  })),
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
  return sortedRows.value.slice(start, start + perPage.value);
});

const errorMessage = computed(() => (error.value as any)?.response?.data?.message ?? 'Gagal memuat antrian persetujuan.');

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
}

// ── Aksi ──────────────────────────────────────────────────────────

function openAction(row: any) {
  const n = persetujuan.value.find((i) => i.id === row.id);
  if (!n) return;
  // Selalu redirect ke halaman detail — approve/tolak dilakukan di halaman detail
  navigateTo(`/naskah-lainnya/${n.id}`);
}

async function doSetuju() {
  if (!selected.value) return;
  busy.value = true;
  try {
    const approvalId = await firstWaitingId();
    await setuju(selected.value.id, approvalId, catatan.value || undefined);
    await fetchPersetujuan(filterStatus.value);
    modalOpen.value = false;
  } finally { busy.value = false; }
}

async function doTolak() {
  if (!selected.value) return;
  busy.value = true;
  try {
    const approvalId = await firstWaitingId();
    await tolak(selected.value.id, approvalId, alasan.value);
    await fetchPersetujuan(filterStatus.value);
    tolakOpen.value = false;
    modalOpen.value = false;
  } finally { busy.value = false; }
}

async function doKembali() {
  if (!selected.value) return;
  busy.value = true;
  try {
    const approvalId = await firstWaitingId();
    await kembalikan(selected.value.id, approvalId, alasan.value);
    await fetchPersetujuan(filterStatus.value);
    kembaliOpen.value = false;
    modalOpen.value = false;
  } finally { busy.value = false; }
}

async function firstWaitingId(): Promise<string> {
  await fetchDetail(selected.value!.id);
  return (detail.value?.approval.find((a) => a.status === 'waiting')?.id) ?? '';
}

// ── Export CSV ───────────────────────────────────────────────────

async function exportData() {
  if (totalItems.value === 0) {
    toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  isExporting.value = true;
  try {
    const rows = displayRows.value;
    if (!rows.length) {
      toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
      return;
    }
    const headers = ['Naskah', 'Pemrakarsa', 'Perihal', 'Tahapan', 'Status'];
    const csvRows = rows.map((r) => [r.nomor, r.pemrakarsa, r.perihal, r.tahapan, r.status]);
    downloadCsv(`persetujuan_${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows);
    toast.add({ title: 'Berhasil', description: `${rows.length} data berhasil diexport`, color: 'success' });
  } catch (e) {
    console.error('Gagal export persetujuan:', e);
    toast.add({ title: 'Gagal export', description: 'Silakan coba kembali.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
}

// ── Watchers (pola berkas-saya) ──────────────────────────────────

// Search change -> reset to page 1 (the currentPage watcher then fetches;
// if already on page 1, fetch directly so the change still applies).
watch(search, () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else fetchPersetujuan(filterStatus.value);
});

// Page/perPage changes -> fetch (perPage change resets to page 1 first).
watch([currentPage, perPage], ([, newPerPage], [, oldPerPage]) => {
  if (newPerPage !== oldPerPage && currentPage.value !== 1) {
    currentPage.value = 1;
    return;
  }
  fetchPersetujuan(filterStatus.value);
});

// Sort changes -> reset to page 1 (currentPage watcher fetches; if on page 1, fetch directly).
watch([sortKey, sortDir], () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else fetchPersetujuan(filterStatus.value);
});

// Filter tab change -> reset to page 1 (currentPage watcher fetches; if on page 1, fetch directly).
watch(filterStatus, () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else fetchPersetujuan(filterStatus.value);
});

// ── Init ──────────────────────────────────────────────────────────

onMounted(() => {
  fetchPersetujuan(filterStatus.value);
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
