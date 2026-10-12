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
          v-model="classificationFilter"
          :items="classificationFilterOptions"
          value-key="value"
          label-key="label"
          placeholder="Semua Klasifikasi"
          :search-input="false"
          class="w-[220px] shrink-0"
          :ui="{
            base: 'h-10 w-full bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200',
          }"
          aria-label="Filter klasifikasi"
        />
        <div class="relative min-w-[220px] flex-1">
          <UIcon
            name="i-lucide-search"
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari di semua kolom..."
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

      <div class="overflow-hidden">
        <table class="w-full table-fixed border-collapse text-sm">
          <thead class="bg-[#457fb6] text-white">
            <tr>
              <th class="w-[29%] whitespace-nowrap px-3 py-4 text-left font-semibold">Nama Berkas</th>
              <th class="w-[17%] whitespace-nowrap px-3 py-4 text-left font-semibold">Kode Berkas</th>
              <th class="w-[30%] whitespace-nowrap px-3 py-4 text-left font-semibold">Klasifikasi</th>
              <th class="w-[14%] whitespace-nowrap px-3 py-4 text-left font-semibold">Tanggal</th>
              <th class="w-[10%] whitespace-nowrap px-3 py-4 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="px-3 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                <span class="inline-flex items-center gap-2">
                  <UIcon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
                  Memuat data...
                </span>
              </td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="5" class="px-3 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                Belum ada BAC yang diterima sebagai tembusan.
              </td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td colspan="5" class="px-3 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                Tidak ada data yang cocok dengan pencarian.
              </td>
            </tr>
            <tr
              v-for="row in paginatedRows"
              :key="row.id"
              class="border-b border-gray-200 last:border-0 odd:bg-white even:bg-gray-50/70 hover:bg-blue-50 dark:border-gray-700 dark:odd:bg-gray-800 dark:even:bg-gray-700/30 dark:hover:bg-gray-700/50"
              :class="rowClass(row)"
            >
              <td class="break-words px-3 py-4 font-medium text-gray-800 dark:text-gray-100">
                {{ row.arsipPerihal || '-' }}
              </td>
              <td class="break-words px-3 py-4 text-gray-600 dark:text-gray-300">
                {{ row.arsipKode || '-' }}
              </td>
              <td class="break-words px-3 py-4 text-gray-600 dark:text-gray-300">
                <div class="font-medium text-gray-800 dark:text-gray-100">
                  {{ row.arsipKlasifikasiKode || '-' }}
                </div>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ row.arsipKlasifikasi || '-' }}
                </div>
              </td>
              <td class="break-words px-3 py-4 text-gray-600 dark:text-gray-300">
                {{ row.bacSignedAt ? formatDate(row.bacSignedAt) : '-' }}
              </td>
              <td class="px-3 py-4 text-center">
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
import { useKlasifikasi } from '~/composables/useKlasifikasi';
import type { BacTembusanListItem } from '~/types/transfer-active-to-inactive';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

definePageMeta({
  middleware: ['auth', 'evp-or-above'],
  alias: ['/pemeliharaan/tembusan-bac'],
});

const { apiGet } = useApi();
const { rowClass, markViewed } = useViewedRows('tembusan-bac');
const toast = useToast();
const rows = ref<BacTembusanListItem[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const classificationFilter = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [10, 25, 50];
const classificationOptions = ref<{ klasifikasi: string; klasifikasi_text: string }[]>([]);
const { getKlasifikasiList } = useKlasifikasi();
const classificationFilterOptions = computed(() => {
  return [
    { label: 'Semua Klasifikasi', value: 'all' },
    ...classificationOptions.value.map((option) => ({
      label: `${option.klasifikasi} — ${option.klasifikasi_text}`,
      value: option.klasifikasi,
    })),
  ];
});
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
    (classificationFilter.value === 'all' || row.arsipKlasifikasiKode === classificationFilter.value) &&
    (!query ||
      Object.values(row as unknown as Record<string, unknown>)
        .concat(bacStatusLabel(row.bacStatus))
        .concat(formatDate(row.bacSignedAt))
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

watch([searchQuery, classificationFilter, pageSize], () => {
  currentPage.value = 1;
});

const breadcrumbItems = [
  { label: 'Kelola', to: '/kelola' },
  { label: 'Pemeliharaan', to: '/pemeliharaan/tembusan-bac' },
  { label: 'Tembusan Berita Acara', to: '/pemeliharaan/tembusan-bac' },
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

const loadKlasifikasi = async () => {
  try {
    const list = await getKlasifikasiList();
    classificationOptions.value = (list ?? []).map((item) => ({
      klasifikasi: item.klasifikasi,
      klasifikasi_text: item.klasifikasi_text ?? item.nama ?? item.klasifikasi,
    }));
  } catch (error) {
    console.error('Gagal memuat klasifikasi:', error);
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

onMounted(() => {
  loadRows();
  loadKlasifikasi();
});
</script>
