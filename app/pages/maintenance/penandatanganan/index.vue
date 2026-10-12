<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <PageHeader title="Penandatanganan" :items="breadcrumbItems" />

    <div class="mt-5 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <div class="flex w-full flex-wrap items-center gap-3 border-b border-gray-300 p-4 dark:border-gray-700">
        <div class="relative" data-signing-dropdown>
          <button
            type="button"
            @click.stop="openRowsPerPage = !openRowsPerPage; openFilterStatus = false; openFilterKlasifikasi = false"
            class="flex min-w-[70px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-all hover:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <span>{{ perPage }}</span>
            <UIcon name="i-lucide-chevron-down" class="h-4 w-4 shrink-0 text-gray-400 transition-transform" :class="{ 'rotate-180': openRowsPerPage }" />
          </button>
          <Transition name="filter-dd">
            <div v-if="openRowsPerPage" class="absolute left-0 top-full z-50 mt-1.5 min-w-[80px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                v-for="n in [10, 25, 50]"
                :key="n"
                type="button"
                @click.stop="perPage = n; openRowsPerPage = false"
                :class="['w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700', perPage === n ? 'bg-primary/5 font-medium text-primary dark:text-primary-400' : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700']"
              >{{ n }}</button>
            </div>
          </Transition>
        </div>

        <div class="relative" data-signing-dropdown>
          <button
            type="button"
            @click.stop="openFilterStatus = !openFilterStatus; openRowsPerPage = false; openFilterKlasifikasi = false"
            class="flex min-w-[150px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-all hover:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            aria-label="Filter status"
          >
            <span class="truncate">{{ selectedStatusLabel }}</span>
            <UIcon name="i-lucide-chevron-down" class="h-4 w-4 shrink-0 text-gray-400 transition-transform" :class="{ 'rotate-180': openFilterStatus }" />
          </button>
          <Transition name="filter-dd">
            <div v-if="openFilterStatus" class="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                v-for="option in statusFilterOptions"
                :key="option.value"
                type="button"
                @click.stop="statusFilter = option.value; openFilterStatus = false"
                :class="['w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700', statusFilter === option.value ? 'bg-primary/5 font-medium text-primary dark:text-primary-400' : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700']"
              >{{ option.label }}</button>
            </div>
          </Transition>
        </div>

        <div class="relative" data-signing-dropdown>
          <button
            type="button"
            @click.stop="openFilterKlasifikasi = !openFilterKlasifikasi; openRowsPerPage = false; openFilterStatus = false"
            class="flex min-w-[170px] max-w-[260px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-all hover:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            aria-label="Filter klasifikasi"
          >
            <span class="truncate">{{ selectedKlasifikasiLabel }}</span>
            <UIcon name="i-lucide-chevron-down" class="h-4 w-4 shrink-0 text-gray-400 transition-transform" :class="{ 'rotate-180': openFilterKlasifikasi }" />
          </button>
          <Transition name="filter-dd">
            <div v-if="openFilterKlasifikasi" class="absolute left-0 top-full z-50 mt-1.5 max-h-[280px] min-w-[240px] max-w-[min(420px,80vw)] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                @click.stop="classificationFilter = ''; openFilterKlasifikasi = false"
                :class="['w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors dark:border-gray-700', !classificationFilter ? 'bg-primary/5 font-medium text-primary dark:text-primary-400' : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700']"
              >Semua Klasifikasi</button>
              <button
                v-for="option in classificationOptions"
                :key="option.klasifikasi"
                type="button"
                @click.stop="classificationFilter = option.klasifikasi; openFilterKlasifikasi = false"
                :class="['w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700', classificationFilter === option.klasifikasi ? 'bg-primary/5 font-medium text-primary dark:text-primary-400' : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700']"
              >{{ option.klasifikasi }} — {{ option.klasifikasi_text }}</button>
            </div>
          </Transition>
        </div>

        <div class="relative min-w-[180px] flex-1">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari Berkas..."
            class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-gray-900 transition placeholder:text-gray-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:bg-gray-600"
          />
        </div>

        <button
          type="button"
          @click="openExportModal"
          class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 dark:bg-primary-600"
        >
          <UIcon name="i-lucide-download" class="h-3.5 w-3.5" /> Export
        </button>
      </div>

      <DataTable
        :columns="columns"
        :rows="paginatedRows"
        compact
        :loading="loading"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        header-class="bg-primary dark:bg-primary-700 text-white text-left"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        :row-classes-fn="rowClass"
        empty-message="Tidak ada BAC untuk ditampilkan."
        @sort="handleSort"
      >
        <template #cell-arsipPerihal="{ row }">
          <div
            class="block min-w-0 truncate text-gray-600 dark:text-gray-300"
            :aria-label="row.arsipPerihal || '-'"
            :title="row.arsipPerihal || '-'"
            tabindex="0"
            @mouseenter="showCellTooltip($event, row.arsipPerihal || '-')"
            @mouseleave="hideCellTooltip"
            @focus="showCellTooltip($event, row.arsipPerihal || '-')"
            @blur="hideCellTooltip"
          >
            {{ row.arsipPerihal || '-' }}
          </div>
        </template>
        <template #cell-arsipKode="{ row }">
          <div
            class="block truncate font-medium text-gray-700 dark:text-gray-200"
            :aria-label="row.arsipKode || '-'"
            :title="row.arsipKode || '-'"
            tabindex="0"
            @mouseenter="showCellTooltip($event, row.arsipKode || '-')"
            @mouseleave="hideCellTooltip"
            @focus="showCellTooltip($event, row.arsipKode || '-')"
            @blur="hideCellTooltip"
          >
            {{ row.arsipKode || '-' }}
          </div>
        </template>
        <template #cell-arsipKlasifikasi="{ row }">
          <div
            class="block min-w-0 truncate text-gray-600 dark:text-gray-300"
            :aria-label="row.arsipKlasifikasi || '-'"
            :title="row.arsipKlasifikasi || '-'"
            tabindex="0"
            @mouseenter="showCellTooltip($event, row.arsipKlasifikasi || '-')"
            @mouseleave="hideCellTooltip"
            @focus="showCellTooltip($event, row.arsipKlasifikasi || '-')"
            @blur="hideCellTooltip"
          >
            {{ row.arsipKlasifikasi || '-' }}
          </div>
        </template>
        <template #cell-arsipLokasiFisik="{ row }">
          <span class="block truncate text-gray-600 dark:text-gray-300" :title="row.arsipLokasiFisik || '-'">
            {{ row.arsipLokasiFisik || '-' }}
          </span>
        </template>
        <template #cell-beritaAcaraNomor="{ row }">
          <span class="block truncate text-gray-600 dark:text-gray-300" :title="row.beritaAcaraNomor || '-'">
            {{ row.beritaAcaraNomor || '-' }}
          </span>
        </template>
        <template #cell-tanggalRetensiAktifHabis="{ row }">
          <span class="whitespace-nowrap text-gray-600 dark:text-gray-300">
            {{ row.tanggalRetensiAktifHabis ? formatDate(row.tanggalRetensiAktifHabis) : '-' }}
          </span>
        </template>
        <template #cell-updatedAt="{ row }">
          <span class="whitespace-nowrap text-gray-600 dark:text-gray-300">
            {{ row.updatedAt ? formatDate(row.updatedAt) : '-' }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <span
            class="inline-flex w-fit max-w-full whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium leading-tight"
            :title="displayStatus(row)"
            :class="isSigned(row)
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
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-900 transition-colors hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300"
              :title="isSigned(row) ? 'Lihat detail BAC' : 'Tanda Tangani BAC'"
              :aria-label="isSigned(row) ? 'Lihat detail BAC' : 'Tanda Tangani BAC'"
              @click="openSigningRow(row)"
            >
              <UIcon :name="isSigned(row) ? 'i-lucide-eye' : 'i-lucide-pen-tool'" class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>

      <Teleport to="body">
        <div
          v-if="cellTooltip.visible"
          role="tooltip"
          class="pointer-events-none fixed z-[9999] max-h-[40vh] overflow-y-auto rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-xl"
          :style="{
            top: `${cellTooltip.top}px`,
            left: `${cellTooltip.left}px`,
            maxWidth: 'min(26rem, calc(100vw - 24px))',
          }"
        >
          {{ cellTooltip.text }}
        </div>
      </Teleport>

      <DataPagination
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DataTable from '~/components/DataTable.vue';
import DataPagination from '~/components/DataPagination.vue';
import ExportColumnModal from '~/components/ExportColumnModal.vue';
import { useApi } from '~/composables/useApi';
import { useKlasifikasi } from '~/composables/useKlasifikasi';
import { formatDate } from '~/utils/transfer-status';

definePageMeta({
  middleware: ['auth', 'evp-or-above'],
  alias: ['/pemeliharaan/penandatanganan'],
});

const { rowClass, markViewed } = useViewedRows('penandatanganan');

const openSigningRow = (row: SigningRow) => {
  markViewed(row);
  return navigateTo(`/pemeliharaan/penandatanganan/${row.id}?signer=${row.signerType || 'pihak_pertama'}`);
};

interface SigningRow {
  id: string;
  arsipPerihal: string;
  arsipKode: string | null;
  arsipKlasifikasi?: string | null;
  arsipKlasifikasiKode?: string | null;
  arsipLokasiFisik?: string | null;
  tanggalRetensiAktifHabis?: string | null;
  updatedAt?: string | null;
  nomorUsulan: string;
  tanggalUsulan: string;
  status: string;
  beritaAcaraNomor: string | null;
  beritaAcaraUrl: string | null;
  bacPihakPertamaName: string | null;
  bacPihakPertamaJabatan: string | null;
  bacPihakKeduaName: string | null;
  bacPihakKeduaJabatan: string | null;
  bacTembusanCount: number;
  bacSignedAt?: string | null;
  bacSignedBy?: number | null;
  bacStatus?: string | null;
  signerType?: 'pihak_pertama' | 'pihak_kedua';
  pihakPertamaSignedAt?: string | null;
  pihakKeduaSignedAt?: string | null;
}

const { apiGet } = useApi();
const toast = useToast();

const rows = ref<SigningRow[]>([]);
const loading = ref(false);
const showExportModal = ref(false);
const isExporting = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const classificationFilter = ref('');
const classificationOptions = ref<{ klasifikasi: string; klasifikasi_text: string }[]>([]);
const openRowsPerPage = ref(false);
const openFilterStatus = ref(false);
const openFilterKlasifikasi = ref(false);
const { getKlasifikasiList } = useKlasifikasi();
const statusFilterOptions = [
  { label: 'Semua Status', value: '' },
  { label: 'Menunggu TTD', value: 'MENUNGGU_TTD' },
  { label: 'Ditandatangani', value: 'SELESAI' },
];
const selectedStatusLabel = computed(
  () => statusFilterOptions.find((option) => option.value === statusFilter.value)?.label ?? 'Semua Status',
);
const selectedKlasifikasiLabel = computed(() => {
  if (!classificationFilter.value) return 'Semua Klasifikasi';
  const selected = classificationOptions.value.find((item) => item.klasifikasi === classificationFilter.value);
  return selected ? `${selected.klasifikasi} — ${selected.klasifikasi_text}` : classificationFilter.value;
});
const perPage = ref(10);
const currentPage = ref(1);
const sortKey = ref('updatedAt');
const sortDir = ref<'asc' | 'desc'>('desc');
const cellTooltip = reactive({ visible: false, text: '', top: 0, left: 0 });

const showCellTooltip = (event: MouseEvent | FocusEvent, text: string) => {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement) || target.scrollWidth <= target.clientWidth) return;

  const rect = target.getBoundingClientRect();
  const padding = 12;
  const width = Math.min(416, window.innerWidth - padding * 2);
  const height = Math.min(320, window.innerHeight * 0.4);
  const left = Math.min(Math.max(padding, rect.left), window.innerWidth - width - padding);
  const below = rect.bottom + 8;
  const top = below + height <= window.innerHeight - padding
    ? below
    : Math.max(padding, rect.top - height - 8);

  cellTooltip.text = text;
  cellTooltip.left = left;
  cellTooltip.top = top;
  cellTooltip.visible = true;
};

const hideCellTooltip = () => {
  cellTooltip.visible = false;
};

const breadcrumbItems = [
  { label: 'Kelola', to: '/kelola' },
  { label: 'Pemeliharaan', to: '/pemeliharaan/penandatanganan' },
  { label: 'Penandatanganan', to: '/pemeliharaan/penandatanganan' },
];

const columns = [
  { key: 'arsipPerihal', label: 'Nama Berkas', sortable: true, class: 'w-[15%] max-w-0', headerClass: 'w-[15%]' },
  { key: 'arsipKode', label: 'Kode Berkas', sortable: true, class: 'w-[10%] max-w-0', headerClass: 'w-[10%]' },
  { key: 'arsipKlasifikasi', label: 'Klasifikasi', sortable: true, class: 'w-[11%] max-w-0', headerClass: 'w-[11%]' },
  { key: 'arsipLokasiFisik', label: 'Lokasi Fisik', sortable: true, class: 'w-[9%] max-w-0', headerClass: 'w-[9%]' },
  { key: 'tanggalRetensiAktifHabis', label: 'Retensi Habis', sortable: true, class: 'w-[12%]', headerClass: 'w-[12%]' },
  { key: 'beritaAcaraNomor', label: 'Nomor BAC', sortable: true, class: 'w-[14%] max-w-0', headerClass: 'w-[14%]' },
  { key: 'status', label: 'Status', sortable: true, class: 'w-[13%] max-w-0', headerClass: 'w-[13%]' },
  { key: 'updatedAt', label: 'Updated', sortable: true, class: 'w-[10%]', headerClass: 'w-[10%]' },
  { key: 'aksi', label: 'Aksi', class: 'w-[6%] text-center', headerClass: 'w-[6%] text-center' },
];

const displayStatus = (row: SigningRow) => {
  return isSigned(row) ? 'Ditandatangani' : 'Menunggu TTD';
};

const isSigned = (row: SigningRow) =>
  Boolean(row.bacSignedAt) ||
  row.bacStatus === 'SELESAI' ||
  row.bacStatus === 'SUDAH_DITANDATANGANI';

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return rows.value.filter((row) => {
    if (statusFilter.value === 'MENUNGGU_TTD' && isSigned(row)) return false;
    if (statusFilter.value === 'SELESAI' && !isSigned(row)) return false;
    if (classificationFilter.value && row.arsipKlasifikasiKode !== classificationFilter.value) return false;
    if (!query) return true;
    return [row.nomorUsulan, row.arsipKode, row.arsipKlasifikasi, row.arsipKlasifikasiKode, row.arsipLokasiFisik, row.beritaAcaraNomor]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
});

const sortedRows = computed(() => {
  const result = [...filteredRows.value];
  if (!sortKey.value) return result;
  result.sort((a: any, b: any) => {
    const left = sortKey.value === 'status' ? displayStatus(a) : (a[sortKey.value] ?? '');
    const right = sortKey.value === 'status' ? displayStatus(b) : (b[sortKey.value] ?? '');
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
  { key: 'arsipPerihal', label: 'Nama Berkas', desc: 'Nama/perihal berkas' },
  { key: 'arsipKode', label: 'Kode Berkas', desc: 'Kode berkas' },
  { key: 'arsipKlasifikasi', label: 'Klasifikasi', desc: 'Nama klasifikasi berkas' },
  { key: 'arsipLokasiFisik', label: 'Lokasi Fisik', desc: 'Lokasi fisik berkas' },
  { key: 'tanggalRetensiAktifHabis', label: 'Retensi Habis', desc: 'Tanggal retensi aktif habis' },
  { key: 'beritaAcaraNomor', label: 'Nomor BAC', desc: 'Nomor berita acara' },
  { key: 'status', label: 'Status', desc: 'Status tanda tangan' },
  { key: 'updatedAt', label: 'Updated', desc: 'Tanggal perubahan terakhir' },
];

watch([searchQuery, statusFilter, classificationFilter, perPage], () => {
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
      if (selectedKeys.includes('arsipPerihal')) data['Nama Berkas'] = row.arsipPerihal || '-';
      if (selectedKeys.includes('arsipKode')) data['Kode Berkas'] = row.arsipKode || '-';
      if (selectedKeys.includes('arsipKlasifikasi')) data.Klasifikasi = row.arsipKlasifikasi || '-';
      if (selectedKeys.includes('arsipLokasiFisik')) data['Lokasi Fisik'] = row.arsipLokasiFisik || '-';
      if (selectedKeys.includes('tanggalRetensiAktifHabis')) {
        data['Retensi Habis'] = row.tanggalRetensiAktifHabis
          ? formatDate(row.tanggalRetensiAktifHabis)
          : '-';
      }
      if (selectedKeys.includes('beritaAcaraNomor')) data['Nomor BAC'] = row.beritaAcaraNomor || '-';
      if (selectedKeys.includes('status')) data.Status = displayStatus(row);
      if (selectedKeys.includes('updatedAt')) data.Updated = row.updatedAt ? formatDate(row.updatedAt) : '-';
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

const closeSigningDropdowns = (event: MouseEvent) => {
  if (!(event.target instanceof Element) || !event.target.closest('[data-signing-dropdown]')) {
    openRowsPerPage.value = false;
    openFilterStatus.value = false;
    openFilterKlasifikasi.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeSigningDropdowns);
  loadRows();
  getKlasifikasiList().then((list) => {
    classificationOptions.value = (list ?? []).map((item) => ({
      klasifikasi: item.klasifikasi,
      klasifikasi_text: item.klasifikasi_text ?? item.nama ?? item.klasifikasi,
    }));
  }).catch((error) => console.error('Gagal memuat klasifikasi:', error));
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeSigningDropdowns);
});

</script>

<style scoped>
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
