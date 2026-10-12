<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5 min-h-screen px-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Pemindahan Arsip Aktif ke Inaktif" :items="items" />
      <!-- Tombol Usul Pindah Arsip disembunyikan sementara. -->
      <!--
      <button
          v-if="isSekretaris"
          @click="openCreateModal"
          class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors shrink-0"
        >
          <Plus class="w-4 h-4" />
          Usul Pindah Arsip
        </button>
      -->
    </div>

    <!-- Table Card -->
    <div
      class="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <VerifikasiFilterBar
        v-model="filter"
        :status-options="filterStatusOptions"
        :rows-per-page-options="[10, 25, 50]"
        search-placeholder="Cari Berkas…"
        search-on-input
        :is-exporting="isExporting"
        @apply="reload"
        @export="onExport"
      />

      <!-- Tabel Gabungan -->
      <DataTable
        :columns="columns"
        :rows="paginatedList"
        compact
        :loading="loading"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        header-class="bg-primary dark:bg-primary-700 text-white text-left"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        :row-classes-fn="(row: any) => transferRowClass(row)"
        empty-message="Arsip Tertutup dengan retensi habis dan usulan pemindahan akan muncul di sini."
        @sort="handleSort"
      >
        <template #cell-perihal="{ row }">
          <TruncatedText :text="String(row.perihal ?? '-')" />
        </template>
        <template #cell-kodeBerkas="{ row }">
          <TruncatedText
            :text="String(row.kodeBerkas ?? '-')"
            text-class="font-medium text-gray-700 dark:text-gray-200"
          />
        </template>
        <template #cell-klasifikasi="{ row }">
          <TruncatedText :text="String(row.klasifikasi ?? '-')" />
        </template>
        <template #cell-lokasiFisik="{ row }">
          <TruncatedText :text="String(row.lokasiFisik || '-')" />
        </template>
        <template #cell-tanggalRetensiAktifHabis="{ row }">
          <span class="whitespace-nowrap">{{ formatDate(row.tanggalRetensiAktifHabis) }}</span>
        </template>
        <template #cell-updatedAt="{ row }">
          <span class="whitespace-nowrap">{{ formatDate(row.updatedAt) }}</span>
        </template>
        <template #cell-status="{ row }">
          <div class="flex min-w-0 flex-wrap items-center gap-1">
            <span
              :class="displayStatusClass(row)"
              class="inline-flex max-w-full whitespace-normal break-words text-[11px] leading-tight"
              :title="displayStatusLabel(row)"
            >
              {{ displayStatusLabel(row) }}
            </span>
            <span
              v-if="!row.isUsulan && row.berkasStatus === 'retensi_inaktif'"
              class="max-w-full whitespace-normal break-words rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium leading-tight text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              title="Berkas sudah masuk fase retensi inaktif"
              >Retensi Inaktif</span
            >
          </div>
        </template>
        <template #cell-aksi="{ row }">
          <div class="text-center" @click.stop>
            <!-- Arsip belum jadi usulan atau usulan DRAFT → halaman sesuai konteks -->
            <button
              v-if="!row.isUsulan"
              @click="openUsulan(row)"
              title="Usul Pindah Arsip"
              class="inline-flex items-center justify-center text-black transition-colors hover:text-primary dark:text-white dark:hover:text-gray-300"
            >
              <UIcon name="i-lucide-file-up" class="w-4 h-4" />
            </button>
            <!-- Usulan DRAFT → detail usulan utama -->
            <button
              v-else-if="row.isUsulan && row.status === 'DRAFT'"
              @click="openUsulan(row)"
              title="Usul Pindah Arsip"
              class="inline-flex items-center justify-center text-black transition-colors hover:text-primary dark:text-white dark:hover:text-gray-300"
            >
              <UIcon name="i-lucide-file-up" class="w-4 h-4" />
            </button>
            <!-- Usulan sudah dibuat → tombol Detail -->
            <button
              v-else-if="row.isUsulan"
              @click="openDetail(row)"
              title="Detail"
              class="inline-flex items-center justify-center text-black transition-colors hover:text-primary dark:text-white dark:hover:text-gray-300"
            >
              <Eye class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>

      <!-- Pagination -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="gabunganList.length"
        :per-page="filter.limit ?? 10"
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
import { ref, computed, watch, onMounted } from 'vue';
import { Eye, Plus } from 'lucide-vue-next';
import { useApi } from '~/composables/useApi';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import { useAuth } from '~/composables/useAuth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';
import CreateTransferModal from '~/components/transfer-active-to-inactive/CreateTransferModal.vue';
import DataTable from '~/components/DataTable.vue';
import VerifikasiFilterBar from '~/components/verifikasi-usulan/VerifikasiFilterBar.vue';
import TruncatedText from '~/components/TruncatedText.vue';
import { formatDate, statusBadgeClass, statusLabel } from '~/utils/transfer-status';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';
import type { VerifikasiFilter } from '~/types/verifikasi-usulan';

definePageMeta({ middleware: ['auth', 'division-secretary-only'] });

const showExportModal = ref(false);
const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut' },
  { key: 'kodeBerkas', label: 'Kode Berkas', desc: 'Kode berkas arsip' },
  { key: 'perihal', label: 'Nama Berkas', desc: 'Perihal atau nama berkas' },
  { key: 'klasifikasi', label: 'Klasifikasi', desc: 'Kode klasifikasi arsip' },
  {
    key: 'tanggalRetensiAktifHabis',
    label: 'Retensi Habis',
    desc: 'Tanggal batas retensi aktif habis',
  },
  { key: 'atasanName', label: 'Atasan', desc: 'Nama atasan penilai' },
  { key: 'status', label: 'Status', desc: 'Status usulan pemindahan' },
  { key: 'tanggal', label: 'Tanggal', desc: 'Tanggal pelaksanaan usulan' },
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
  lokasiFisik?: string | null;
  tanggalRetensiAktifHabis: string | null;
  atasanName: string | null;
  status: string;
  /** Status asli berkas (untuk baris belum-usulan: closed_retensi_aktif / retensi_inaktif). */
  berkasStatus?: string | null;
  tanggal: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  /** Status BAC presentasi, tanpa mengubah status workflow utama. */
  bacStatus?: 'MENUNGGU_TTD' | 'SUDAH_DITANDATANGANI' | null;
  bacSignedAt?: string | null;
  beritaAcaraUrl?: string | null;
}

const gabunganList = ref<GabunganRow[]>([]);
const loading = ref(false);
const preselectedArsip = ref<any | null>(null);
const expandedId = ref<string | null>(null);

// Baris baru hanya ditebalkan sampai user membuka detail atau menjalankan aksi.
// Disimpan per user agar status sudah dilihat tidak kembali saat halaman dimuat ulang.
const viewedRowIds = ref<Set<string>>(new Set());
const viewedRowsStorageKey = computed(
  () => `transfer-active-to-inactive:viewed:${String(user.value?.persnum ?? user.value?.id ?? 'anonymous')}`,
);

const loadViewedRows = () => {
  if (!import.meta.client) return;
  try {
    const raw = localStorage.getItem(viewedRowsStorageKey.value);
    const ids = raw ? JSON.parse(raw) : [];
    viewedRowIds.value = new Set(
      Array.isArray(ids) ? ids.map((id) => String(id)) : [],
    );
  } catch {
    viewedRowIds.value = new Set();
  }
};

const markRowAsViewed = (row: GabunganRow) => {
  if (!import.meta.client || !row?.id) return;
  const next = new Set(viewedRowIds.value);
  next.add(String(row.id));
  viewedRowIds.value = next;
  try {
    localStorage.setItem(viewedRowsStorageKey.value, JSON.stringify([...next]));
  } catch {
    // Status bold tetap hilang selama halaman aktif meskipun storage penuh/diblokir.
  }
};

const transferRowClass = (row: GabunganRow): string =>
  viewedRowIds.value.has(String(row.id)) ? '' : newRowClass(row);
/** Pre-fill atasan di CreateTransferModal? false saat buka dari tombol Kirim (Draft). */
const prefillAtasan = ref(true);

// ── Table Columns (dengan sort arrow, menyamakan berkas-saya) ───
const columns = [
  {
    key: 'perihal',
    label: 'Nama Berkas',
    sortable: true,
    class: 'w-[18%] max-w-0',
    headerClass: 'w-[18%]',
  },
  {
    key: 'kodeBerkas',
    label: 'Kode Berkas',
    sortable: true,
    class: 'w-[12%] max-w-0',
    headerClass: 'w-[12%]',
  },
  {
    key: 'klasifikasi',
    label: 'Klasifikasi',
    sortable: true,
    class: 'w-[13%] max-w-0',
    headerClass: 'w-[13%]',
  },
  {
    key: 'lokasiFisik',
    label: 'Lokasi Fisik',
    sortable: true,
    class: 'w-[11%] max-w-0',
    headerClass: 'w-[11%]',
  },
  {
    key: 'tanggalRetensiAktifHabis',
    label: 'Retensi Habis',
    sortable: true,
    class: 'w-[13%]',
    headerClass: 'w-[13%]',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    class: 'w-[16%] max-w-0',
    headerClass: 'w-[16%]',
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    sortable: true,
    class: 'w-[11%]',
    headerClass: 'w-[11%]',
  },
  {
    key: 'aksi',
    label: 'Aksi',
    class: 'w-[6%] text-center',
    headerClass: 'w-[6%] text-center',
  },
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
  markRowAsViewed(row);
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

const displayStatusLabel = (row: GabunganRow): string =>
  row.bacStatus === 'MENUNGGU_TTD'
    ? 'Menunggu TTD'
    : row.bacStatus === 'SUDAH_DITANDATANGANI'
      ? 'BAC Ditandatangani'
      : statusLabel(row.status as any);

const displayStatusClass = (row: GabunganRow): string =>
  row.bacStatus === 'MENUNGGU_TTD'
    ? 'px-2 py-0.5 text-xs rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
    : row.bacStatus === 'SUDAH_DITANDATANGANI'
      ? 'px-2 py-0.5 text-xs rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
    : statusBadgeClass(row.status as any);
const selectedTransfer = ref<TransferActiveToInactive | null>(null);

const filter = ref<VerifikasiFilter>({
  search: '',
  status: '',
  klasifikasi: '',
  page: 1,
  limit: 10,
});

// Pagination (client-side)
const currentPage = ref(1);

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'MENUNGGU_VERIFIKASI_ATASAN', label: 'Menunggu Persetujuan' },
  { value: 'MENUNGGU_VERIFIKASI_TERAKHIR', label: 'Menunggu Verifikasi' },
  { value: 'DIKIRIM', label: 'Menunggu Penerimaan' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DITOLAK_ATASAN', label: 'Ditolak' },
];
const filterStatusOptions = computed(() => statusOptions.filter((option) => option.value));

const totalPages = computed(() =>
  Math.max(1, Math.ceil(gabunganList.value.length / (filter.value.limit ?? 10)))
);

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
  const limit = filter.value.limit ?? 10;
  const start = (currentPage.value - 1) * limit;
  return list.slice(start, start + limit);
});

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const isSekretaris = computed(() => {
  const role = (user.value?.activeRole?.name ?? user.value?.role ?? '').toUpperCase();
  return role === 'USER' || isAdmin.value || isSuperadmin.value;
});

const items = [
  { label: 'Kelola', to: '/kelola' },
  { label: 'Pemeliharaan', to: '/kelola/pemeliharaan/pemindahan-arsip' },
  {
    label: 'Pemindahan Arsip',
    to: '/kelola/pemeliharaan/pemindahan-arsip',
  },
];

const loadGabungan = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {};
    if (filter.value.search) params.search = filter.value.search;
    if (filter.value.status) params.status = filter.value.status;
    if (filter.value.klasifikasi) params.klasifikasi = filter.value.klasifikasi;
    const res: any = await apiGet(
      '/transfer-active-to-inactive/gabungan',
      { params },
      { skipCache: true }
    );
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
      // Utamakan lokasi dari pemberkasan; nama alternatif menjaga kompatibilitas
      // dengan respons lama yang memakai snake_case atau objek relasi.
      lokasiFisik:
        r.lokasiFisik ??
        r.lokasi_fisik ??
        r.lokasi ??
        r.lokasiSimpan ??
        r.lokasi_simpan ??
        r.berkas?.lokasi ??
        null,
      tanggalRetensiAktifHabis: r.tanggalRetensiAktifHabis ?? null,
      atasanName: r.atasanName ?? null,
      status: r.status ?? '',
      berkasStatus: r.berkasStatus ?? null,
      tanggal: r.tanggal ?? null,
      // Timestamp untuk deteksi baris terbaru (bold)
      createdAt: r.createdAt ?? null,
      updatedAt: r.updatedAt ?? null,
      bacStatus: r.bacStatus ?? null,
      bacSignedAt: r.bacSignedAt ?? null,
      beritaAcaraUrl: r.beritaAcaraUrl ?? null,
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
  filter.value.page = 1;
  loadGabungan();
};

const isExporting = ref(false);

const onExport = () => {
  if (gabunganList.value.length === 0) {
    useToast().add({
      title: 'Tidak ada data',
      description: 'Tidak ada data untuk diexport',
      color: 'warning',
    });
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
      if (selectedKeys.includes('tanggalRetensiAktifHabis'))
        row['Retensi Habis'] = r.tanggalRetensiAktifHabis || '-';
      if (selectedKeys.includes('atasanName')) row['Atasan'] = r.atasanName || '-';
      if (selectedKeys.includes('status')) row['Status'] = r.status || '-';
      if (selectedKeys.includes('tanggal')) row['Tanggal'] = r.tanggal || '-';
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2,
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemindahan Arsip');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `pemindahan_arsip_aktif_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showExportModal.value = false;
    useToast().add({
      title: 'Berhasil',
      description: `${data.length} data berhasil diexport`,
      color: 'success',
    });
  } catch (err) {
    console.error('Export pemindahan arsip aktif error:', err);
    useToast().add({
      title: 'Gagal export',
      description: 'Terjadi kesalahan saat export.',
      color: 'error',
    });
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
  markRowAsViewed(row);
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
  markRowAsViewed(row);
  navigateTo(`/kelola/pemeliharaan/pemindahan-arsip/${row.id}`);
};

const openUsulan = (row: GabunganRow) => {
  markRowAsViewed(row);
  navigateTo(
    row.isUsulan
      ? `/kelola/pemeliharaan/pemindahan-arsip/${row.id}`
      : `/kelola/pemeliharaan/pemindahan-arsip/ajukan/${row.id}`,
  );
};

const onTransferCreated = async () => {
  await loadGabungan();
};

const onTransferUpdated = async () => {
  await loadGabungan();
};

onMounted(() => {
  loadGabungan();
});

watch(viewedRowsStorageKey, loadViewedRows, { immediate: true });

</script>
