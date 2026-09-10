<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5 min-h-screen px-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        title="Pemindahan Arsip Aktif ke Inaktif"
        :items="items"
      />
      <button
        v-if="isSekretaris"
        @click="openCreateModal"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors shrink-0"
      >
        <Plus class="w-4 h-4" />
        Usul Pindah Arsip
      </button>
    </div>

    <!-- Table Card -->
    <div
      class="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Toolbar (berkas-saya-style: perPage + filters + reset + search + export in one row) -->
      <div class="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center gap-3 w-full">
        <div class="flex items-center gap-3 flex-wrap flex-1">
          <!-- ROWS PER PAGE — custom dropdown -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleRowsPerPage"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[70px] justify-between"
            >
              <span>{{ itemsPerPage }}</span>
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
                    itemsPerPage === n
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER STATUS -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterStatus"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] justify-between"
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
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]"
              >
                <button
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  type="button"
                  @click.stop="selectFilterStatus(opt.value)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    filter.status === opt.value
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER KLASIFIKASI -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterKlasifikasi"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] max-w-[200px] justify-between"
            >
              <span class="truncate">{{ klasifikasiLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterKlasifikasi }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterKlasifikasi"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[180px] max-h-56 overflow-y-auto"
              >
                <button
                  type="button"
                  @click.stop="selectFilterKlasifikasi('')"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700',
                    filter.klasifikasi === ''
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  Semua Klasifikasi
                </button>
                <button
                  v-for="k in klasifikasiList"
                  :key="k.klasifikasi"
                  type="button"
                  @click.stop="selectFilterKlasifikasi(k.klasifikasi)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    filter.klasifikasi === k.klasifikasi
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ k.klasifikasi }} — {{ k.klasifikasi_text || '' }}
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
              v-model="filter.search"
              type="text"
              placeholder="Cari Berkas…"
              @input="reload"
              class="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
            />
          </div>
        </div>
        <button
          @click="onExport"
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

      <!-- Tabel Gabungan -->
      <DataTable
        :columns="columns"
        :rows="paginatedList"
        :loading="loading"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        header-class="bg-primary dark:bg-primary-700 text-white text-left"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        empty-message="Arsip Tertutup dengan retensi habis dan usulan pemindahan akan muncul di sini."
        @sort="handleSort"
      >
        <template #cell-perihal="{ row }">
          <div class="truncate" :title="row.perihal">{{ row.perihal }}</div>
        </template>
        <template #cell-kodeBerkas="{ row }">
          <div class="truncate font-medium text-gray-700 dark:text-gray-200" :title="row.kodeBerkas ?? '-'">{{ row.kodeBerkas ?? '-' }}</div>
          <div v-if="row.isUsulan" class="text-[11px] text-gray-400 truncate">{{ row.nomorUsulan }}</div>
        </template>
        <template #cell-klasifikasi="{ row }">
          <div class="truncate" :title="row.klasifikasi ?? '-'">{{ row.klasifikasi ?? '-' }}</div>
        </template>
        <template #cell-tanggalRetensiAktifHabis="{ row }">
          <span class="whitespace-nowrap">{{ formatDate(row.tanggalRetensiAktifHabis) }}</span>
        </template>
        <template #cell-status="{ row }">
          <span :class="statusBadgeClass(row.status as any)" class="text-[11px]">{{ statusLabel(row.status as any) }}</span>
        </template>
        <template #cell-aksi="{ row }">
          <div class="text-center" @click.stop>
            <!-- Arsip belum jadi usulan → tombol Pindahkan -->
            <button
              v-if="!row.isUsulan && isSekretaris"
              @click="openCreateModalWithArsip(row)"
              title="Pindahkan"
              class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary hover:bg-primary-800 text-white transition-colors"
            >
              <UIcon name="i-lucide-file-up" class="w-4 h-4" />
            </button>
            <!-- Usulan DRAFT → tombol Kirim Usulan -->
            <button
              v-else-if="row.isUsulan && row.status === 'DRAFT' && isSekretaris"
              @click="onSendUsulan(row)"
              title="Kirim ke Atasan Managerial"
              class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary hover:bg-primary-800 text-white transition-colors"
            >
              <UIcon name="i-lucide-send" class="w-4 h-4" />
            </button>
            <!-- Usulan sudah dibuat → tombol Detail -->
            <button
              v-else-if="row.isUsulan"
              @click="openDetail(row)"
              title="Detail"
              class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary hover:bg-primary-800 text-white transition-colors"
            >
              <UIcon name="i-heroicons-eye" class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>

      <!-- Pagination -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="gabunganList.length"
        :per-page="itemsPerPage"
      />
    </div>

    <!-- Modal Wizard -->
    <CreateTransferModal
      v-if="isSekretaris"
      v-model="isCreateModalOpen"
      :edit-data="selectedTransfer"
      :preselected-arsip="preselectedArsip"
      :prefill-atasan="prefillAtasan"
      @created="onTransferCreated"
      @updated="onTransferUpdated"
    />

    <!-- Export Column Modal -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="gabunganList.length"
      title="Pilih Kolom Export Pemindahan Arsip Aktif"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { Plus, ChevronDown } from 'lucide-vue-next';
import { useApi } from '~/composables/useApi';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import { useAuth } from '~/composables/useAuth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';
import CreateTransferModal from '~/components/transfer-active-to-inactive/CreateTransferModal.vue';
import DataTable from '~/components/DataTable.vue';
import { formatDate, statusBadgeClass, statusLabel } from '~/utils/transfer-status';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';

definePageMeta({ middleware: ['auth'] });

const showExportModal = ref(false);
const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut' },
  { key: 'kodeBerkas', label: 'Kode Berkas', desc: 'Kode berkas arsip' },
  { key: 'perihal', label: 'Nama Berkas', desc: 'Perihal atau nama berkas' },
  { key: 'klasifikasi', label: 'Klasifikasi', desc: 'Kode klasifikasi arsip' },
  { key: 'tanggalRetensiAktifHabis', label: 'Retensi Habis', desc: 'Tanggal batas retensi aktif habis' },
  { key: 'atasanName', label: 'Atasan', desc: 'Nama atasan penilai' },
  { key: 'status', label: 'Status', desc: 'Status usulan pemindahan' },
  { key: 'tanggal', label: 'Tanggal', desc: 'Tanggal pelaksanaan usulan' }
]);

const { apiGet } = useApi();
const { send, fetchDetail } = useTransferActiveToInactive();
const { user, isSuperadmin, isAdmin } = useAuth();


/** Baris gabungan (arsip belum usulan + usulan sudah dibuat). */
interface GabunganRow {
  id: string;
  isUsulan: boolean;
  nomorUsulan?: string;
  kodeBerkas: string | null;
  perihal: string;
  klasifikasi: string | null;
  tanggalRetensiAktifHabis: string | null;
  atasanName: string | null;
  status: string;
  tanggal: string | null;
}

const gabunganList = ref<GabunganRow[]>([]);
const loading = ref(false);
const preselectedArsip = ref<any | null>(null);
const expandedId = ref<string | null>(null);
/** Pre-fill atasan di CreateTransferModal? false saat buka dari tombol Kirim (Draft). */
const prefillAtasan = ref(true);

// ── Table Columns (dengan sort arrow, menyamakan berkas-saya) ───
const columns = [
  { key: 'perihal', label: 'Nama Berkas', sortable: true },
  { key: 'kodeBerkas', label: 'Kode Berkas / No. Usulan', sortable: true },
  { key: 'klasifikasi', label: 'Klasifikasi', sortable: true },
  { key: 'tanggalRetensiAktifHabis', label: 'Retensi Habis', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'aksi', label: 'Aksi' },
];
const sortKey = ref('');
const sortDir = ref<'asc' | 'desc'>('asc');

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
};

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const onSendUsulan = async (row: GabunganRow) => {
  // Buka CreateTransferModal (mode edit) — arsip terisi otomatis, atasan KOSONG
  try {
    selectedTransfer.value = await fetchDetail(row.id);
  } catch (e) {
    console.error('Gagal memuat detail usulan:', e);
    alert('Gagal memuat detail usulan.');
    return;
  }
  preselectedArsip.value = null;
  prefillAtasan.value = false;
  isCreateModalOpen.value = true;
};

const isCreateModalOpen = ref(false);
const selectedTransfer = ref<TransferActiveToInactive | null>(null);

const filter = reactive({
  search: '',
  status: '',
  klasifikasi: '',
});

// Pagination (client-side)
const currentPage = ref(1);
const itemsPerPage = ref(10);

// ── Klasifikasi list (dari master klasifikasi — sama dengan berkas-saya) ───
const klasifikasiList = ref<any[]>([]);

const fetchKlasifikasi = async () => {
  try {
    const data: any = await apiGet('/arsip-dinamis/klasifikasi', {}, { skipCache: true });
    klasifikasiList.value = Array.isArray(data) ? data : (data?.data ?? []);
  } catch (e) {
    console.error('Gagal memuat klasifikasi:', e);
  }
};

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'MENUNGGU_VERIFIKASI_ATASAN', label: 'Menunggu Persetujuan' },
  { value: 'MENUNGGU_VERIFIKASI_TERAKHIR', label: 'Menunggu Verifikasi' },
  { value: 'DIKIRIM', label: 'Menunggu Penerimaan' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DITOLAK_ATASAN', label: 'Ditolak' },
];

// ── Custom Dropdown Toolbar State (berkas-saya-style) ────────────
const openRowsPerPage = ref(false);
const openFilterStatus = ref(false);
const openFilterKlasifikasi = ref(false);
const statusFilterLabel = computed(
  () => statusOptions.find((o) => o.value === filter.status)?.label ?? 'Semua Status',
);
const klasifikasiLabel = computed(() => {
  if (!filter.klasifikasi) return 'Semua Klasifikasi';
  const k = klasifikasiList.value.find((x: any) => x.klasifikasi === filter.klasifikasi);
  return k ? `${k.klasifikasi} — ${k.klasifikasi_text || ''}` : 'Semua Klasifikasi';
});
function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
  openFilterStatus.value = false;
  openFilterKlasifikasi.value = false;
}
function toggleFilterStatus() {
  openFilterStatus.value = !openFilterStatus.value;
  openRowsPerPage.value = false;
  openFilterKlasifikasi.value = false;
}
function toggleFilterKlasifikasi() {
  openFilterKlasifikasi.value = !openFilterKlasifikasi.value;
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
}
function selectRowsPerPage(n: number) {
  itemsPerPage.value = n;
  currentPage.value = 1;
  openRowsPerPage.value = false;
}
function selectFilterStatus(val: string) {
  filter.status = val;
  openFilterStatus.value = false;
  reload();
}
function selectFilterKlasifikasi(val: string) {
  filter.klasifikasi = val;
  openFilterKlasifikasi.value = false;
  reload();
}
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value =
    openFilterStatus.value =
    openFilterKlasifikasi.value =
      false;
}

const totalPages = computed(() => Math.max(1, Math.ceil(gabunganList.value.length / itemsPerPage.value)));

const paginatedList = computed(() => {
  let list = gabunganList.value;
  if (sortKey.value) {
    const key = sortKey.value as keyof GabunganRow;
    const dir = sortDir.value === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      const va = (a[key] ?? '') as string;
      const vb = (b[key] ?? '') as string;
      return va.localeCompare(vb) * dir;
    });
  }
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return list.slice(start, start + itemsPerPage.value);
});

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const onItemsPerPageChange = (size: number) => {
  itemsPerPage.value = size;
  currentPage.value = 1;
};

const isSekretaris = computed(() => {
  const role = (user.value?.activeRole?.name ?? user.value?.role ?? '').toUpperCase();
  return role === 'USER' || isAdmin.value || isSuperadmin.value;
});

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/transfer-active-to-inactive-file' },
  { label: 'Pemindahan Arsip Aktif ke Inaktif', to: '/maintenance/transfer-active-to-inactive-file' },
];

const loadGabungan = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {};
    if (filter.search) params.search = filter.search;
    if (filter.status) params.status = filter.status;
    if (filter.klasifikasi) params.klasifikasi = filter.klasifikasi;
    const res: any = await apiGet('/transfer-active-to-inactive/gabungan', { params }, { skipCache: true });
    // Normalize ke plain object agar DataTable tidak menerima reactive proxy
    // (menyebabkan warning "_isVue"/"constructor" saat render).
    const raw: any[] = res?.data ?? [];
    gabunganList.value = raw.map((r) => ({
      id: String(r.id ?? ''),
      isUsulan: !!r.isUsulan,
      nomorUsulan: r.nomorUsulan ?? undefined,
      kodeBerkas: r.kodeBerkas ?? null,
      perihal: r.perihal ?? '',
      klasifikasi: r.klasifikasi ?? null,
      tanggalRetensiAktifHabis: r.tanggalRetensiAktifHabis ?? null,
      atasanName: r.atasanName ?? null,
      status: r.status ?? '',
      tanggal: r.tanggal ?? null,
    }));
  } catch (e) {
    console.error('Gagal memuat data gabungan:', e);
    gabunganList.value = [];
  } finally {
    loading.value = false;
  }
};

const reload = () => {
  currentPage.value = 1;
  loadGabungan();
};

const isExporting = ref(false);

const onExport = () => {
  if (gabunganList.value.length === 0) {
    useToast().add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  showExportModal.value = true;
};

const handleExportConfirm = (selectedKeys: string[]) => {
  if (gabunganList.value.length === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const data = gabunganList.value.map((r: any, idx: number) => {
      const row: Record<string, any> = {};
      if (selectedKeys.includes('No')) row['No'] = idx + 1;
      if (selectedKeys.includes('kodeBerkas')) row['Kode Berkas'] = r.kodeBerkas || '-';
      if (selectedKeys.includes('perihal')) row['Nama Berkas'] = r.perihal || '-';
      if (selectedKeys.includes('klasifikasi')) row['Klasifikasi'] = r.klasifikasi || '-';
      if (selectedKeys.includes('tanggalRetensiAktifHabis')) row['Retensi Habis'] = r.tanggalRetensiAktifHabis || '-';
      if (selectedKeys.includes('atasanName')) row['Atasan'] = r.atasanName || '-';
      if (selectedKeys.includes('status')) row['Status'] = r.status || '-';
      if (selectedKeys.includes('tanggal')) row['Tanggal'] = r.tanggal || '-';
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemindahan Arsip');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `pemindahan_arsip_aktif_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showExportModal.value = false;
    useToast().add({ title: 'Berhasil', description: `${data.length} data berhasil diexport`, color: 'success' });
  } catch (err) {
    console.error('Export pemindahan arsip aktif error:', err);
    useToast().add({ title: 'Gagal export', description: 'Terjadi kesalahan saat export.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

const openCreateModal = () => {
  selectedTransfer.value = null;
  preselectedArsip.value = null;
  prefillAtasan.value = true;
  isCreateModalOpen.value = true;
};

const openCreateModalWithArsip = (row: GabunganRow) => {
  selectedTransfer.value = null;
  prefillAtasan.value = true;
  preselectedArsip.value = {
    id: row.id,
    perihal: row.perihal,
    kodeBerkas: row.kodeBerkas,
    tanggalRetensiAktifHabis: row.tanggalRetensiAktifHabis,
    klasifikasi: row.klasifikasi,
  };
  isCreateModalOpen.value = true;
};

const openDetail = (row: GabunganRow) => {
  if (!row.isUsulan) return;
  navigateTo(`/maintenance/transfer-active-to-inactive-file/${row.id}`);
};

const onTransferCreated = async () => {
  await loadGabungan();
};

const onTransferUpdated = async () => {
  await loadGabungan();
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  fetchKlasifikasi();
  loadGabungan();
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