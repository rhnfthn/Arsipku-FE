<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <PageHeader title="Penandatanganan" :items="breadcrumbItems" />

    <div class="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <DataToolbar
        v-model="perPage"
        v-model:search="searchQuery"
        search-placeholder="Cari nomor usulan, nomor berkas, perihal..."
        :show-refresh="false"
        export-label="Export"
        @export="openExportModal"
      >
        <template #before-search>
          <select
            v-model="statusFilter"
            class="h-8 min-w-[150px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            aria-label="Filter status"
          >
            <option value="">Semua Status</option>
            <option value="MENUNGGU_TTD">Menunggu TTD</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </template>
      </DataToolbar>

      <DataTable
        :columns="columns"
        :rows="paginatedRows"
        :loading="loading"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        header-class="bg-primary dark:bg-primary-700 text-white text-left"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        empty-message="Tidak ada BAC untuk ditampilkan."
        @sort="handleSort"
      >
        <template #cell-nomorUsulan="{ row }">
          <span class="whitespace-nowrap font-medium text-gray-800 dark:text-gray-100">{{ row.nomorUsulan }}</span>
        </template>

        <template #cell-arsipKode="{ row }">
          <span class="whitespace-nowrap text-gray-700 dark:text-gray-200">{{ row.arsipKode || '-' }}</span>
        </template>

        <template #cell-arsipPerihal="{ row }">
          <span class="block max-w-xs truncate text-gray-600 dark:text-gray-300" :title="row.arsipPerihal">
            {{ row.arsipPerihal || '-' }}
          </span>
        </template>

        <template #cell-beritaAcaraNomor="{ row }">
          <span class="whitespace-nowrap text-gray-600 dark:text-gray-300">{{ row.beritaAcaraNomor || '-' }}</span>
        </template>

        <template #cell-tanggalUsulan="{ row }">
          <span class="whitespace-nowrap text-gray-600 dark:text-gray-300">{{ formatDate(row.tanggalUsulan) }}</span>
        </template>

        <template #cell-status="{ row }">
          <span
            class="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
            :class="row.bacSignedAt
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'"
          >
            {{ displayStatus(row) }}
          </span>
        </template>

        <template #cell-aksi="{ row }">
          <div class="flex items-center justify-center">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              :class="row.bacSignedAt
                ? 'text-gray-900 hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300'
                : 'bg-primary text-white hover:bg-primary-700'"
              :title="row.bacSignedAt ? 'Lihat detail BAC' : 'Tanda Tangani BAC'"
              :aria-label="row.bacSignedAt ? 'Lihat detail BAC' : 'Tanda Tangani BAC'"
              @click="navigateTo(`/maintenance/transfer-active-to-inactive-file/${row.id}?from=penandatanganan`)"
            >
              <UIcon :name="row.bacSignedAt ? 'i-lucide-eye' : 'i-lucide-pen-tool'" class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>

      <DataPagination
        v-if="filteredRows.length > 0"
        :current-page="currentPage"
        :total-items="filteredRows.length"
        :per-page="perPage"
        @update:current-page="currentPage = $event"
      />
    </div>

    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="filteredRows.length"
      title="Pilih Kolom Export Penandatanganan BAC"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DataTable from '~/components/DataTable.vue';
import DataToolbar from '~/components/DataToolbar.vue';
import DataPagination from '~/components/DataPagination.vue';
import ExportColumnModal from '~/components/ExportColumnModal.vue';
import { useApi } from '~/composables/useApi';
import { formatDate } from '~/utils/transfer-status';

definePageMeta({ middleware: ['auth', 'evp-or-above'] });

interface SigningRow {
  id: string;
  nomorUsulan: string;
  arsipPerihal: string;
  arsipKode: string | null;
  tanggalUsulan: string;
  status: string;
  beritaAcaraNomor: string | null;
  beritaAcaraUrl: string | null;
  bacPihakPertamaName: string | null;
  bacPihakPertamaJabatan: string | null;
  bacTembusanCount: number;
  bacSignedAt?: string | null;
  bacSignedBy?: number | null;
  bacStatus?: string | null;
}

const { apiGet } = useApi();
const toast = useToast();

const rows = ref<SigningRow[]>([]);
const loading = ref(false);
const showExportModal = ref(false);
const isExporting = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const sortKey = ref('tanggalUsulan');
const sortDir = ref<'asc' | 'desc'>('desc');

const breadcrumbItems = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/penandatanganan' },
  { label: 'Penandatanganan', to: '/maintenance/penandatanganan' },
];

const columns = [
  { key: 'nomorUsulan', label: 'Nomor Usulan', sortable: true },
  { key: 'arsipKode', label: 'Nomor Berkas', sortable: true },
  { key: 'arsipPerihal', label: 'Perihal', sortable: true },
  { key: 'beritaAcaraNomor', label: 'Nomor BAC', sortable: true },
  { key: 'tanggalUsulan', label: 'Tanggal', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'aksi', label: 'Aksi', sortable: false, headerClass: 'text-center' },
];

const displayStatus = (row: SigningRow) => {
  return row.bacSignedAt || row.bacStatus === 'SELESAI' ? 'Selesai' : 'Menunggu TTD';
};

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return rows.value.filter((row) => {
    if (statusFilter.value === 'MENUNGGU_TTD' && row.bacSignedAt) return false;
    if (statusFilter.value === 'SELESAI' && !row.bacSignedAt) return false;
    if (!query) return true;
    return [row.nomorUsulan, row.arsipKode, row.arsipPerihal, row.beritaAcaraNomor]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
});

const sortedRows = computed(() => {
  const result = [...filteredRows.value];
  if (!sortKey.value) return result;
  result.sort((a: any, b: any) => {
    const left = a[sortKey.value] ?? '';
    const right = b[sortKey.value] ?? '';
    const comparison = String(left).localeCompare(String(right), 'id', {
      numeric: true,
      sensitivity: 'base',
    });
    return sortDir.value === 'asc' ? comparison : -comparison;
  });
  return result;
});

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return sortedRows.value.slice(start, start + perPage.value);
});

const exportColumns = [
  { key: 'nomorUsulan', label: 'Nomor Usulan', desc: 'Nomor usulan pemindahan' },
  { key: 'arsipKode', label: 'Nomor Berkas', desc: 'Nomor/kode berkas' },
  { key: 'arsipPerihal', label: 'Perihal', desc: 'Perihal arsip' },
  { key: 'beritaAcaraNomor', label: 'Nomor BAC', desc: 'Nomor berita acara' },
  { key: 'tanggalUsulan', label: 'Tanggal', desc: 'Tanggal usulan' },
  { key: 'status', label: 'Status', desc: 'Status tanda tangan' },
];

watch([searchQuery, statusFilter, perPage], () => {
  currentPage.value = 1;
});

watch(filteredRows, () => {
  const maxPage = Math.max(1, Math.ceil(filteredRows.value.length / perPage.value));
  if (currentPage.value > maxPage) currentPage.value = maxPage;
});

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
};

const loadRows = async () => {
  loading.value = true;
  try {
    const res: any = await apiGet('/transfer-active-to-inactive/signing-list', {}, { skipCache: true });
    rows.value = Array.isArray(res?.data) ? res.data : [];
  } catch (error) {
    console.error('Gagal memuat BAC untuk penandatanganan:', error);
    rows.value = [];
    toast.add({ title: 'Gagal memuat data', description: 'Daftar BAC tidak dapat dimuat.', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const openExportModal = () => {
  if (filteredRows.value.length === 0) {
    toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diekspor.', color: 'warning' });
    return;
  }
  showExportModal.value = true;
};

const handleExportConfirm = (selectedKeys: string[]) => {
  if (filteredRows.value.length === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const excelData = sortedRows.value.map((row) => {
      const data: Record<string, any> = {};
      if (selectedKeys.includes('nomorUsulan')) data['Nomor Usulan'] = row.nomorUsulan || '-';
      if (selectedKeys.includes('arsipKode')) data['Nomor Berkas'] = row.arsipKode || '-';
      if (selectedKeys.includes('arsipPerihal')) data.Perihal = row.arsipPerihal || '-';
      if (selectedKeys.includes('beritaAcaraNomor')) data['Nomor BAC'] = row.beritaAcaraNomor || '-';
      if (selectedKeys.includes('tanggalUsulan')) data.Tanggal = formatDate(row.tanggalUsulan);
      if (selectedKeys.includes('status')) data.Status = displayStatus(row);
      return data;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penandatanganan BAC');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `penandatanganan-bac-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    showExportModal.value = false;
  } catch (error) {
    console.error('Gagal export daftar BAC:', error);
    toast.add({ title: 'Export gagal', description: 'Daftar BAC tidak dapat diekspor.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

onMounted(loadRows);

</script>
