<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5 min-h-screen px-5">
    <div class="mb-5">
      <PageHeader
        title="Persetujuan Penutupan Berkas"
        :items="[
          { label: 'Kelola' },
          { label: 'Pemeliharaan' },
          { label: 'Persetujuan Pemberkasan' },
        ]"
      />
    </div>

    <div
      class="rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center gap-3 w-full">
        <div class="flex items-center gap-3 flex-wrap flex-1">
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
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <div class="relative flex-1 min-w-[180px]">
            <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Cari nama, kode, atau klasifikasi berkas…"
              class="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
            />
          </div>

          <!-- FILTER STATUS — custom dropdown -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterStatus"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[150px] justify-between"
            >
              <span class="truncate">{{ statusFilterLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterStatus }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterStatus"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[170px]"
              >
                <button
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  type="button"
                  @click.stop="selectFilterStatus(opt.value)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    statusFilter === opt.value
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
        <button
          @click="exportData"
          :disabled="isExporting"
          class="shrink-0 flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-primary dark:bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <UIcon v-if="isExporting" name="i-lucide-loader-circle" class="w-3.5 h-3.5 animate-spin" />
          <UIcon v-else name="i-lucide-download" class="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <DataTable
        :columns="columns"
        :rows="rows"
        :loading="pending"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        @sort="handleSort"
        header-class="bg-primary dark:bg-primary-700 text-white text-left"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        :empty-message="emptyMessage"
      >
        <template #cell-judulBerkas="{ row }">
          <div class="min-w-52">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ row.berkas?.judulBerkas || '-' }}
            </p>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ row.berkas?.klasifikasiTeks || row.berkas?.klasifikasi || '-' }}
            </p>
          </div>
        </template>
        <template #cell-kodeBerkas="{ row }">
          <span class="font-mono text-xs">{{ row.berkas?.kodeBerkas || '-' }}</span>
        </template>
        <template #cell-retensi="{ row }">
          <span class="text-xs"
            >{{ row.berkas?.retensiAktifTahun || 0 }}A /
            {{ row.berkas?.retensiInaktifTahun || 0 }}I</span
          >
        </template>
        <template #cell-actionAt="{ row }">
          <span class="text-xs text-gray-500 dark:text-gray-400">{{
            formatDate(row.actionAt || row.createdAt)
          }}</span>
        </template>
        <template #cell-status="{ row }">
          <span
            v-if="row.status === 'pending'"
            class="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-1 text-xs font-medium text-warning-700 dark:bg-warning-950/40 dark:text-warning-300"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-warning-500" />
            Menunggu Persetujuan Anda
          </span>
          <span
            v-else-if="row.status === 'approved'"
            class="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-1 text-xs font-medium text-success-700 dark:bg-success-950/40 dark:text-success-300"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-success-500" />
            Disetujui
          </span>
          <span
            v-else-if="row.status === 'rejected'"
            class="inline-flex items-center gap-1 rounded-full bg-error-50 px-2 py-1 text-xs font-medium text-error-700 dark:bg-error-950/40 dark:text-error-300"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-error-500" />
            Ditolak
          </span>
          <span v-else class="text-xs text-gray-500 dark:text-gray-400">{{ row.status || '-' }}</span>
        </template>
        <template #cell-catatan="{ row }">
          <span
            class="block max-w-[220px] truncate text-xs text-gray-600 dark:text-gray-300"
            :title="row.catatan || ''"
          >
            {{ row.catatan || '-' }}
          </span>
        </template>
        <template #cell-aksi="{ row }">
          <NuxtLink
            v-if="row.status === 'pending'"
            :to="`/kelola/pemeliharaan/persetujuan-pemberkasan/${row.berkasId || row.berkas?.id}/review`"
            class="inline-flex items-center justify-center rounded-md p-1.5 text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40"
            title="Review Pengajuan"
            aria-label="Review Pengajuan"
          >
            <Eye class="h-4 w-4" />
          </NuxtLink>
          <NuxtLink
            v-else
            :to="`/kelola/pemeliharaan/persetujuan-pemberkasan/${row.berkasId || row.berkas?.id}/review?riwayat=1`"
            class="inline-flex items-center justify-center rounded-md p-1.5 text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40"
            title="Lihat Keputusan"
            aria-label="Lihat Keputusan"
          >
            <Eye class="h-4 w-4" />
          </NuxtLink>
        </template>
      </DataTable>

      <DataPagination
        v-model:current-page="currentPage"
        :total-items="totalItems"
        :per-page="perPage"
      />
    </div>

    <!-- Export Column Modal -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="totalItems || rows.length"
      title="Pilih Kolom Export Persetujuan Pemberkasan"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { ChevronDown, Eye } from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';

const { getPersetujuanSaya } = useArsipDinamis();
const toast = useToast();

const showExportModal = ref(false);
const isExporting = ref(false);

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut' },
  { key: 'nama_berkas', label: 'Nama Berkas', desc: 'Perihal atau nama berkas arsip' },
  { key: 'kode_berkas', label: 'Kode Berkas', desc: 'Kode berkas arsip' },
  { key: 'klasifikasi', label: 'Klasifikasi', desc: 'Kode atau teks klasifikasi arsip' },
  { key: 'retensi', label: 'Retensi (A/I)', desc: 'Masa retensi aktif & inaktif' },
  { key: 'tanggal', label: 'Tanggal', desc: 'Tanggal pengajuan atau tanggal aksi' },
  { key: 'status', label: 'Status', desc: 'Status persetujuan' },
  { key: 'catatan', label: 'Catatan', desc: 'Catatan persetujuan / penolakan' }
]);

const rows = ref<any[]>([]);
const pending = ref(false);
const search = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const totalItems = ref(0);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

// Satu tabel, filter status: Semua / Menunggu Persetujuan Anda (default) / Disetujui / Ditolak.
// Semua = menunggu+approved+rejected. Menunggu Persetujuan Anda = pending & giliran Anda.
// Disetujui/Ditolak = keputusan lampau Anda. Semua via getPersetujuanSaya({status}).
const statusFilter = ref<'all' | 'menunggu' | 'approved' | 'rejected'>('menunggu');

// Sort state (server-side via getPersetujuanSaya sortBy/sortDir). Default = BE default order.
const sortKey = ref('');
const sortDir = ref<'asc' | 'desc'>('desc');

const openRowsPerPage = ref(false);
const openFilterStatus = ref(false);

const statusOptions = [
  { value: 'all', label: 'Semua' },
  { value: 'menunggu', label: 'Menunggu Persetujuan Anda' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
] as const;

const statusFilterLabel = computed(
  () => statusOptions.find((o) => o.value === statusFilter.value)?.label ?? 'Menunggu Persetujuan Anda',
);

function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
  openFilterStatus.value = false;
}

function toggleFilterStatus() {
  openFilterStatus.value = !openFilterStatus.value;
  openRowsPerPage.value = false;
}

function selectRowsPerPage(n: number) {
  perPage.value = n;
  openRowsPerPage.value = false;
}

function selectFilterStatus(val: 'all' | 'menunggu' | 'approved' | 'rejected') {
  statusFilter.value = val;
  openFilterStatus.value = false;
}

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
}

const columns = [
  { key: 'judulBerkas', label: 'Nama Berkas', sortable: true },
  { key: 'kodeBerkas', label: 'Kode Berkas', sortable: true },
  { key: 'retensi', label: 'Retensi (A/I)' },
  { key: 'actionAt', label: 'Tanggal Aksi', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'catatan', label: 'Catatan' },
  { key: 'aksi', label: 'Aksi' },
];

const emptyMessage = computed(() =>
  statusFilter.value === 'menunggu'
    ? 'Tidak ada pengajuan yang menunggu persetujuan Anda.'
    : statusFilter.value === 'approved'
      ? 'Tidak ada berkas yang Anda setujui.'
      : 'Tidak ada berkas yang Anda tolak.'
);

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const statusLabel = (s?: string) =>
  s === 'approved' ? 'Disetujui' : s === 'rejected' ? 'Ditolak' : s === 'pending' ? 'Menunggu Persetujuan Anda' : s || '-';

const isMenunggu = () => statusFilter.value === 'menunggu';

const fetchData = async () => {
  pending.value = true;
  try {
    const response = await getPersetujuanSaya({
      search: search.value || undefined,
      status: statusFilter.value,
      sortBy: sortKey.value || undefined,
      sortDir: sortDir.value,
      page: currentPage.value,
      limit: perPage.value,
    });

    // useApi mengembalikan envelope global `{ success, data }`, sedangkan
    // endpoint ini mengembalikan payload pagination `{ data, meta }`.
    const payload = response?.data?.data ? response.data : response;
    rows.value = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    totalItems.value = Number(payload?.meta?.total ?? rows.value.length);
  } catch (e: any) {
    console.error('Gagal memuat data:', e);
    rows.value = [];
    totalItems.value = 0;
    toast.add({
      title: 'Gagal memuat data',
      description: e?.data?.message || e?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    pending.value = false;
  }
};

// Realtime: auto-refetch saat count "menunggu persetujuan Anda" berubah
// (berkas diajukan/di-approve/di-reject) — tanpa refresh manual.
const route = useRoute();
const { arsipPersetujuanWaitingCount } = useRealtimeSocket();
watch(arsipPersetujuanWaitingCount, () => {
  if (
    route.path.startsWith('/kelola/pemeliharaan/persetujuan-pemberkasan') &&
    !pending.value
  ) {
    fetchData();
  }
});

const exportData = () => {
  if (totalItems.value === 0) {
    toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  showExportModal.value = true;
};

const handleExportConfirm = async (selectedKeys: string[]) => {
  if (totalItems.value === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const response: any = await getPersetujuanSaya({
      search: search.value || undefined,
      status: statusFilter.value,
      page: 1,
      limit: totalItems.value || 9999,
    });
    const payload = response?.data?.data ? response.data : response;
    const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    if (!list.length) {
      toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
      return;
    }

    const data = list.map((r: any, idx: number) => {
      const row: Record<string, any> = {};
      if (selectedKeys.includes('No')) row['No'] = idx + 1;
      if (selectedKeys.includes('nama_berkas')) row['Nama Berkas'] = r.berkas?.judulBerkas || '-';
      if (selectedKeys.includes('kode_berkas')) row['Kode Berkas'] = r.berkas?.kodeBerkas || '-';
      if (selectedKeys.includes('klasifikasi')) row['Klasifikasi'] = r.berkas?.klasifikasiTeks || r.berkas?.klasifikasi || '-';
      if (selectedKeys.includes('retensi')) row['Retensi (A/I)'] = `${r.berkas?.retensiAktifTahun || 0}A/${r.berkas?.retensiInaktifTahun || 0}I`;
      if (selectedKeys.includes('tanggal')) row['Tanggal'] = isMenunggu() ? (r.createdAt || '-') : (r.actionAt || '-');
      if (selectedKeys.includes('status')) row['Status'] = statusLabel(r.status);
      if (selectedKeys.includes('catatan')) row['Catatan'] = r.catatan || '-';
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Persetujuan Pemberkasan');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `persetujuan_pemberkasan_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showExportModal.value = false;
    toast.add({ title: 'Berhasil', description: `${list.length} data berhasil diexport`, color: 'success' });
  } catch (e) {
    console.error('Gagal export:', e);
    toast.add({ title: 'Gagal export', description: 'Silakan coba kembali.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

watch([currentPage, perPage], ([, newPerPage], [, oldPerPage]) => {
  if (newPerPage !== oldPerPage && currentPage.value !== 1) {
    currentPage.value = 1;
    return;
  }
  fetchData();
});

watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (currentPage.value !== 1) currentPage.value = 1;
    else fetchData();
  }, 350);
});

watch(statusFilter, () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else fetchData();
});

watch([sortKey, sortDir], () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else fetchData();
});

onMounted(fetchData);
onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<style scoped>
.filter-dd-enter-active, .filter-dd-leave-active { transition: opacity .15s ease, transform .15s ease; }
.filter-dd-enter-from, .filter-dd-leave-to { opacity: 0; transform: translateY(-4px); }
</style>