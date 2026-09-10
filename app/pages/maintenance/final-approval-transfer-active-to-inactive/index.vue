<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Persetujuan Penerimaan Arsip Inaktif" subtitle="Approval of Inactive File Receipt — Atasan Managerial TU" :items="items" />
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Menunggu Persetujuan</p>
        <p class="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{{ summary?.menungguTU ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Menunggu Persetujuan Terakhir</p>
        <p class="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{{ summary?.menungguFinalTU ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Disetujui</p>
        <p class="text-2xl font-bold mt-1 text-[#457fb6]">{{ summary?.disetujuiTU ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Selesai</p>
        <p class="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{{ summary?.selesai ?? 0 }}</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
          <select v-model="filter.status" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" @change="reload">
            <option value="">Semua</option>
            <option value="BERKAS_FISIK_SESUAI">Berkas Sesuai (Menunggu Persetujuan TU)</option>
            <option value="DISETUJUI_PERSETUJUAN_TU">Disetujui TU (Menunggu Persetujuan Terakhir)</option>
            <option value="DISETUJUI_PERSETUJUAN_TERAKHIR_TU">Disetujui Final TU</option>
            <option value="DITOLAK_PERSETUJUAN_TU">Ditolak TU</option>
            <option value="DITOLAK_PERSETUJUAN_TERAKHIR_TU">Ditolak Final TU</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pencarian</label>
          <div class="relative">
            <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="filter.search" type="text" placeholder="Cari nomor, perihal..." class="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" @keydown.enter="reload" />
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="reload" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors">Tampilkan</button>
          <button @click="resetFilter" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Reset</button>
          <button @click="openExportModal" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors inline-flex items-center justify-center gap-1.5">
            <UIcon name="i-lucide-download" class="w-4 h-4" /> Export
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse text-sm">
          <thead class="bg-[#457fb6] text-white text-left">
            <tr>
              <th class="px-4 py-3 font-semibold">No</th>
              <th class="px-4 py-3 font-semibold">Nomor Usulan</th>
              <th class="px-4 py-3 font-semibold">Perihal Arsip</th>
              <th class="px-4 py-3 font-semibold">Pengusul</th>
              <th class="px-4 py-3 font-semibold">Status</th>
              <th class="px-4 py-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="px-4 py-6"><div class="space-y-4 animate-pulse"><div v-for="n in 5" :key="n" class="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700" /></div></td></tr>
            <tr v-else-if="list.length === 0"><td colspan="6" class="px-4 py-10 text-center text-sm text-gray-400">Tidak ada usulan</td></tr>
            <template v-else>
              <tr v-for="(row, idx) in list" :key="row.id" class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                <td class="px-4 py-3 text-gray-500">{{ idx + 1 + ((meta?.page ?? 1) - 1) * (meta?.limit ?? 10) }}</td>
                <td class="px-4 py-3 font-medium whitespace-nowrap text-gray-700 dark:text-gray-200">{{ row.nomorUsulan }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="row.arsipPerihal">{{ row.arsipPerihal }}</td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-200">{{ row.sekretarisName }}</td>
                <td class="px-4 py-3"><span :class="statusBadge(row.status)">{{ statusLabel(row.status) }}</span></td>
                <td class="px-4 py-3 text-center">
                  <NuxtLink :to="`/maintenance/transfer-active-to-inactive/${row.id}`" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap">
                    <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" /> Verifikasi
                  </NuxtLink>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div v-if="meta && meta.total > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-500">Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }} dari {{ meta.total }}</div>
        <div v-if="meta.totalPages > 1" class="flex gap-1">
          <button :disabled="meta.page <= 1" @click="goPage(meta.page - 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700">Prev</button>
          <button :disabled="meta.page >= meta.totalPages" @click="goPage(meta.page + 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700">Next</button>
        </div>
      </div>
    </div>

    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="list.length"
      title="Pilih Kolom Export Persetujuan Penerimaan"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import type { TransferFilter, TransferActiveToInactiveStatus } from '~/types/transfer-active-to-inactive';
import ExportColumnModal from '~/components/ExportColumnModal.vue';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

definePageMeta({ middleware: ['auth'] });

const { fetchList, fetchSummary, list, summary, loading, meta } = useTransferActiveToInactive();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Persetujuan Penerimaan', to: '/maintenance/final-approval-transfer-active-to-inactive' },
];

const filter = reactive<TransferFilter>({ page: 1, limit: 10, status: undefined, search: '', sortBy: 'createdAt', sortOrder: 'DESC' });

const statusBadge = (s: TransferActiveToInactiveStatus) => {
  const m: Record<string, string> = {
    BERKAS_FISIK_SESUAI: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DISETUJUI_PERSETUJUAN_TU: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    DITOLAK_PERSETUJUAN_TU: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    SELESAI: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  };
  return `px-2 py-0.5 text-xs rounded-full font-medium ${m[s] || 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`;
};

const statusLabel = (s: TransferActiveToInactiveStatus) => {
  const m: Record<string, string> = { BERKAS_FISIK_SESUAI: 'Menunggu Persetujuan TU', DISETUJUI_PERSETUJUAN_TU: 'Disetujui TU', DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Disetujui Final TU', DITOLAK_PERSETUJUAN_TU: 'Ditolak TU', DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'Ditolak Final TU', SELESAI: 'Selesai' };
  return m[s] || s;
};

const loadData = async () => { try { await Promise.all([fetchList({ ...filter }), fetchSummary()]); } catch (e) { console.error('Gagal:', e); } };
const reload = () => { filter.page = 1; loadData(); };
const resetFilter = () => { filter.status = undefined; filter.search = ''; filter.page = 1; loadData(); };
const goPage = (p: number) => { filter.page = p; loadData(); };

// ─── Export Excel ──────────────────────────────
const showExportModal = ref(false);
const isExporting = ref(false);

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'nomor', label: 'Nomor Usulan', desc: 'Nomor usulan pemindahan' },
  { key: 'perihal', label: 'Perihal Arsip', desc: 'Perihal arsip' },
  { key: 'pengusul', label: 'Pengusul', desc: 'Nama pengusul' },
  { key: 'status', label: 'Status', desc: 'Status usulan' }
]);

const openExportModal = () => {
  showExportModal.value = true;
};

const handleExportConfirm = (selectedKeys: string[]) => {
  if (list.value.length === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const excelData = list.value.map((row: any, idx: number) => {
      const r: Record<string, any> = {};
      if (selectedKeys.includes('No')) r['No'] = idx + 1;
      if (selectedKeys.includes('nomor')) r['Nomor Usulan'] = row.nomorUsulan || '-';
      if (selectedKeys.includes('perihal')) r['Perihal Arsip'] = row.arsipPerihal || '-';
      if (selectedKeys.includes('pengusul')) r['Pengusul'] = row.sekretarisName || '-';
      if (selectedKeys.includes('status')) r['Status'] = statusLabel(row.status);
      return r;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Persetujuan Penerimaan');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `persetujuan-penerimaan-${new Date().toISOString().slice(0, 10)}.xlsx`);
    showExportModal.value = false;
  } catch (error) {
    console.error('Gagal export:', error);
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => loadData());
</script>