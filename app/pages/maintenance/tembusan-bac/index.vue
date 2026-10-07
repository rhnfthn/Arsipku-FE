<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900">
    <PageHeader title="Tembusan Berita Acara" :items="breadcrumbItems" />

    <div
      class="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-700">
        <USelectMenu
          v-model="pageSize"
          :items="pageSizeOptions"
          :search-input="false"
          class="w-[76px] shrink-0"
          :ui="{
            base: 'h-10 w-full bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200',
          }"
          aria-label="Jumlah data per halaman"
        />
        <USelectMenu
          v-model="statusFilter"
          :items="statusFilterOptions"
          value-key="value"
          label-key="label"
          placeholder="Semua Status"
          :search-input="false"
          class="w-[176px] shrink-0"
          :ui="{
            base: 'h-10 w-full bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200',
          }"
          aria-label="Filter status BAC"
        />
        <div class="relative min-w-[220px] flex-1">
          <UIcon
            name="i-lucide-search"
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari nomor usulan, arsip, atau nama pihak..."
            class="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#457fb6] focus:ring-2 focus:ring-[#457fb6]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          type="button"
          :disabled="filteredRows.length === 0"
          class="inline-flex h-10 items-center gap-2 rounded-lg bg-[#457fb6] px-4 text-sm font-medium text-white transition hover:bg-[#386d9f] disabled:cursor-not-allowed disabled:opacity-50"
          @click="exportRows"
        >
          <UIcon name="i-lucide-download" class="h-4 w-4" />
          Export
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1200px] border-collapse text-sm">
          <thead class="bg-[#457fb6] text-white">
            <tr>
              <th class="px-5 py-4 text-left font-semibold">Nama Berkas</th>
              <th class="px-5 py-4 text-left font-semibold">Kode Berkas / No. Usulan</th>
              <th class="px-5 py-4 text-left font-semibold">Penandatangan</th>
              <th class="px-5 py-4 text-left font-semibold">Pihak</th>
              <th class="px-5 py-4 text-left font-semibold">Status</th>
              <th class="px-5 py-4 text-left font-semibold">Tanggal</th>
              <th class="px-5 py-4 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                <span class="inline-flex items-center gap-2">
                  <UIcon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
                  Memuat data...
                </span>
              </td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="7" class="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                Belum ada BAC yang diterima sebagai tembusan.
              </td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td colspan="7" class="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                Tidak ada data yang cocok dengan pencarian.
              </td>
            </tr>
            <tr
              v-for="row in paginatedRows"
              :key="row.id"
              class="border-b border-gray-200 last:border-0 odd:bg-white even:bg-gray-50/70 hover:bg-blue-50 dark:border-gray-700 dark:odd:bg-gray-800 dark:even:bg-gray-700/30 dark:hover:bg-gray-700/50"
              :class="rowClass(row)"
            >
              <td class="max-w-md px-5 py-4 font-medium text-gray-800 dark:text-gray-100">
                {{ row.arsipPerihal || '-' }}
              </td>
              <td class="whitespace-nowrap px-5 py-4 text-center text-gray-600 dark:text-gray-300">
                <div class="font-semibold text-gray-800 dark:text-gray-100">
                  {{ row.arsipKode || '-' }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ row.nomorUsulan || '-' }}
                </div>
              </td>
              <td class="px-5 py-4 text-gray-600 dark:text-gray-300">
                <div class="font-medium">{{ signerForRow(row).name || '-' }}</div>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ signerForRow(row).position || '-' }}
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="flex">
                  <span
                    class="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    :class="signerForRow(row).isSecond
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'"
                  >
                    {{ signerForRow(row).isSecond ? 'Kedua' : 'Pertama' }}
                  </span>
                </div>
              </td>
              <td class="whitespace-nowrap px-5 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="
                    isBacSigned(row.bacStatus)
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  "
                >
                  {{
                    bacStatusLabel(row.bacStatus)
                  }}
                </span>
              </td>
              <td class="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-300">
                {{ row.bacSignedAt ? formatDate(row.bacSignedAt) : '-' }}
              </td>
              <td class="px-5 py-4 text-center">
                <button
                  type="button"
                  class="inline-flex items-center justify-center p-1 text-gray-600 transition-colors hover:text-[#457fb6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#457fb6] dark:text-gray-300"
                  :aria-label="`Preview Berita Acara ${row.nomorUsulan}`"
                  title="Preview Berita Acara"
                  @click="openBac(row)"
                >
                  <UIcon name="i-lucide-eye" class="h-5 w-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!loading"
        class="border-t border-gray-200 dark:border-gray-700"
      >
        <Pagination
          :current-page="currentPage"
          :total-pages="pageCount"
          :total-items="filteredRows.length"
          :rows-per-page="pageSize"
          :rows-options="[]"
          @update:page="onPageChange"
        />
      </div>
    </div>

    <SharedSharePdfViewer
      v-model="bacPreviewOpen"
      :url="bacPreviewUrl"
      :title="bacPreviewTitle"
      :loading="bacPreviewLoading"
      @close="closeBacPreview"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useApi } from '~/composables/useApi';
import type { BacTembusanListItem } from '~/types/transfer-active-to-inactive';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

definePageMeta({ middleware: ['auth', 'evp-or-above'] });

const { apiGet } = useApi();
const { rowClass, markViewed } = useViewedRows('tembusan-bac');
const toast = useToast();
const rows = ref<BacTembusanListItem[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref<'all' | 'waiting' | 'signed'>('all');
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [10, 25, 50];
const statusFilterOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Menunggu', value: 'waiting' },
  { label: 'Ditandatangani', value: 'signed' },
];
const {
  bacPreviewOpen,
  bacPreviewLoading,
  bacPreviewUrl,
  bacPreviewTitle,
  openBacPreview,
  closeBacPreview,
} = useBacPdfPreview();

const isBacSigned = (status: string | null | undefined) => {
  const normalized = status?.trim().toLocaleUpperCase('id').replace(/[\s-]+/g, '_');
  return normalized === 'SUDAH_DITANDATANGANI' || normalized === 'SELESAI';
};

const bacStatusLabel = (status: string | null | undefined) =>
  isBacSigned(status) ? 'Ditandatangani' : 'Menunggu ditandatangani';

const signerForRow = (row: BacTembusanListItem) => {
  const isSecond = Boolean(row.bacPihakKeduaSignedAt && row.bacPihakKeduaName);
  return {
    isSecond,
    name: isSecond ? row.bacPihakKeduaName : row.bacPihakPertamaName,
    position: isSecond ? row.bacPihakKeduaJabatan : row.bacPihakPertamaJabatan,
  };
};

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('id');
  return rows.value.filter((row) =>
    (statusFilter.value === 'all' ||
      (statusFilter.value === 'signed' && isBacSigned(row.bacStatus)) ||
      (statusFilter.value === 'waiting' && !isBacSigned(row.bacStatus))) &&
    (!query ||
      [
        row.nomorUsulan,
        row.beritaAcaraNomor,
        row.arsipKode,
        row.arsipPerihal,
        row.bacPihakPertamaName,
        row.bacPihakPertamaJabatan,
        row.bacPihakKeduaName,
        row.bacPihakKeduaJabatan,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('id').includes(query)))
  );
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});
const paginationStart = computed(() => (filteredRows.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0));
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredRows.value.length));

const onPageChange = (page: number) => {
  currentPage.value = Math.min(Math.max(1, page), pageCount.value);
};

watch([searchQuery, statusFilter, pageSize], () => {
  currentPage.value = 1;
});

const breadcrumbItems = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/tembusan-bac' },
  { label: 'Tembusan Berita Acara', to: '/maintenance/tembusan-bac' },
];

const formatDate = (value: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(
    new Date(value)
  );
};

const loadRows = async () => {
  loading.value = true;
  try {
    const res: any = await apiGet(
      '/transfer-active-to-inactive/tembusan-list',
      {},
      { skipCache: true }
    );
    rows.value = Array.isArray(res?.data) ? res.data : [];
  } catch (error: any) {
    rows.value = [];
    toast.add({
      title: 'Gagal memuat tembusan BAC',
      description: error?.response?.data?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const exportRows = () => {
  if (!filteredRows.value.length) return;
  const data = filteredRows.value.map((row) => ({
    'Nomor Usulan': row.nomorUsulan || '-',
    'Nomor Berita Acara': row.beritaAcaraNomor || '-',
    'Kode Arsip': row.arsipKode || '-',
    'Nama Berkas': row.arsipPerihal || '-',
    'Pihak Pertama': row.bacPihakPertamaName || '-',
    'Jabatan Pihak Pertama': row.bacPihakPertamaJabatan || '-',
    'Pihak Kedua': row.bacPihakKeduaName || '-',
    'Jabatan Pihak Kedua': row.bacPihakKeduaJabatan || '-',
    'Penandatangan Ditampilkan': signerForRow(row).name || '-',
    'Pihak Penandatangan': signerForRow(row).isSecond ? 'Kedua' : 'Pertama',
    'Status': bacStatusLabel(row.bacStatus),
    'Tanggal TTE': formatDate(row.bacSignedAt),
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = Object.keys(data[0]).map((key) => ({
    wch: Math.min(
      40,
      Math.max(key.length, ...data.map((row) => String(row[key as keyof typeof row]).length)) + 2
    ),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tembusan BAC');
  const content = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `tembusan_berita_acara_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
};

const openBac = async (row: BacTembusanListItem) => {
  markViewed(row);
  await openBacPreview(row.id, row.beritaAcaraNomor || row.nomorUsulan);
};

onMounted(loadRows);
</script>
