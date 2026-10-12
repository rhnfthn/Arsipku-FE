<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Page Header -->
    <div class="mb-5">
      <PageHeader
        title="Pemindahan"
        :items="items"
      />
    </div>

    <!-- Peringatan multi-role -->
    <div
      v-if="isMultiRole"
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4"
    >
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
        <div>
          <h3 class="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Perhatian</h3>
          <p class="text-sm text-yellow-600 dark:text-yellow-400">Anda memiliki role Sekretaris dan Atasan Managerial. Pastikan tidak memverifikasi usulan yang Anda buat sendiri.</p>
        </div>
      </div>
    </div>

    <!-- Table Card (filter + table + pagination in one card) -->
    <div class="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors overflow-hidden">
      <!-- Filter Bar -->
      <VerifikasiFilterBar
        v-model="filter"
        @apply="reload"
        @export="onExport"
      />

      <!-- Table -->
      <VerifikasiTable
        :data="list"
        :loading="loading"
        @detail="openDetail"
      />

    </div>

    <!-- Export Column Modal -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="meta?.total || list.length"
      title="Pilih Kolom Export Pemindahan"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useVerifikasiUsulan } from '~/composables/useVerifikasiUsulan';
import { useAuth } from '~/composables/useAuth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';
import VerifikasiFilterBar from '~/components/verifikasi-usulan/VerifikasiFilterBar.vue';
import VerifikasiTable from '~/components/verifikasi-usulan/VerifikasiTable.vue';
import type {
  VerifikasiFilter,
  VerifikasiUsulanItem,
} from '~/types/verifikasi-usulan';

definePageMeta({ middleware: ['auth', 'atasan-managerial-secretary-only'] });

const showExportModal = ref(false);
const isExporting = ref(false);

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut' },
  { key: 'arsipPerihal', label: 'Nama Berkas', desc: 'Perihal atau nama berkas arsip' },
  { key: 'arsipKode', label: 'Kode Berkas', desc: 'Kode berkas arsip' },
  { key: 'nomorUsulan', label: 'No. Usulan', desc: 'Nomor usulan pemindahan/pemusnahan' },
  { key: 'arsipKlasifikasi', label: 'Klasifikasi', desc: 'Kode klasifikasi arsip' },
  { key: 'status', label: 'Status', desc: 'Status verifikasi usulan' }
]);

const route = useRoute();
const { user } = useAuth();

if (route.path === '/maintenance/verifikasi-usulan') {
  await navigateTo('/pemeliharaan/pemindahan', { replace: true });
}
const {
  fetchList,
  fetchSummary,
  list,
  summary,
  loading,
  meta,
} = useVerifikasiUsulan();

/** Deteksi user multi-role (punya role USER/Sekretaris DAN ADMIN/Atasan Managerial). */
const isMultiRole = computed(() => {
  if (!user.value) return false;
  const activeRole = (user.value?.activeRole?.name ?? user.value?.role ?? '').toUpperCase();
  const allRoles = user.value?.roles?.map(r => r.name.toUpperCase()) ?? [];
  const hasSekretaris = activeRole === 'USER' || allRoles.includes('USER');
  const hasAtasan = activeRole === 'ADMIN' || allRoles.includes('ADMIN');
  return hasSekretaris && hasAtasan;
});

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/pemeliharaan/pemindahan' },
  { label: 'Pemindahan', to: '/pemeliharaan/pemindahan' },
];

const filter = ref<VerifikasiFilter>({
  jenis: '',
  status: '',
  search: '',
  klasifikasi: '',
  startDate: '',
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
});

/** Load data dari backend. */
const loadData = async () => {
  try {
    await Promise.all([
      fetchList({ ...filter.value }),
      fetchSummary(),
    ]);
  } catch (e) {
    console.error('Gagal memuat data:', e);
  }
};

const reload = () => {
  filter.value.page = 1;
  loadData();
};

const onExport = () => {
  if (!list.value || list.value.length === 0) {
    useToast().add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  showExportModal.value = true;
};

const handleExportConfirm = (selectedKeys: string[]) => {
  if (!list.value || list.value.length === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const data = list.value.map((r: any, idx: number) => {
      const row: Record<string, any> = {};
      if (selectedKeys.includes('No')) row['No'] = idx + 1;
      if (selectedKeys.includes('arsipPerihal')) row['Nama Berkas'] = r.arsipPerihal || '-';
      if (selectedKeys.includes('arsipKode')) row['Kode Berkas'] = r.arsipKode || '-';
      if (selectedKeys.includes('nomorUsulan')) row['No. Usulan'] = r.nomorUsulan || '-';
      if (selectedKeys.includes('arsipKlasifikasi')) row['Klasifikasi'] = r.arsipKlasifikasi || '-';
      if (selectedKeys.includes('status')) row['Status'] = r.status || '-';
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemindahan');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `verifikasi_usulan_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showExportModal.value = false;
    useToast().add({ title: 'Berhasil', description: `${data.length} data berhasil diexport`, color: 'success' });
  } catch (err) {
    console.error('Export verifikasi usulan error:', err);
    useToast().add({ title: 'Gagal export', description: 'Terjadi kesalahan saat export.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

const openDetail = (row: VerifikasiUsulanItem) => {
  navigateTo(`/pemeliharaan/pemindahan/${row.id}?jenis=${row.jenis}`);
};

onMounted(() => loadData());
</script>
