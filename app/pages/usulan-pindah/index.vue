<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Usulan Pindah Arsip Inaktif" subtitle="Pantau dan kelola usulan pemindahan arsip inaktif." :items="items" />
      <NuxtLink
        to="/usulan-pindah/create"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap"
      >
        <UIcon name="i-lucide-plus" class="w-4 h-4" />
        Buat Usulan
      </NuxtLink>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Total Usulan</p>
        <p class="text-2xl font-bold mt-1 text-gray-700 dark:text-white">{{ summary?.total ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Menunggu Verifikasi</p>
        <p class="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{{ summary?.menungguVerifikasi ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Disetujui</p>
        <p class="text-2xl font-bold mt-1 text-[#457fb6]">{{ summary?.disetujui ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Selesai</p>
        <p class="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{{ summary?.selesai ?? 0 }}</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
          <select v-model="filter.status" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" @change="reload">
            <option value="">Semua</option>
            <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Dari Tanggal</label>
          <input v-model="filter.startDate" type="date" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Sampai Tanggal</label>
          <input v-model="filter.endDate" type="date" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pencarian</label>
          <div class="relative">
            <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="filter.search" type="text" placeholder="Cari nomor, perihal, pengusul..." class="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" @keydown.enter="reload" />
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-3">
        <button @click="resetFilter" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Reset</button>
        <button @click="reload" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors">Tampilkan</button>
        <button @click="onExport" class="px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary-700 text-white transition-colors flex items-center gap-1.5">
          <UIcon name="i-lucide-download" class="w-4 h-4" />
          Export
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse text-sm">
          <thead class="bg-[#457fb6] dark:bg-primary-700 text-white text-left">
            <tr>
              <th class="px-4 py-3 font-semibold">No</th>
              <th class="px-4 py-3 font-semibold">Nomor Usulan</th>
              <th class="px-4 py-3 font-semibold">Perihal Arsip</th>
              <th class="px-4 py-3 font-semibold">Pengusul</th>
              <th class="px-4 py-3 font-semibold">Status</th>
              <th class="px-4 py-3 font-semibold">Tanggal</th>
              <th class="px-4 py-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="px-4 py-6">
                <div class="space-y-4 animate-pulse">
                  <div v-for="n in 5" :key="n" class="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
                </div>
              </td>
            </tr>
            <tr v-else-if="usulanList.length === 0">
              <td colspan="7" class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                Tidak ada usulan pindah arsip inaktif
              </td>
            </tr>
            <template v-else>
              <tr
                v-for="(row, idx) in usulanList"
                :key="row.id"
                class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ idx + 1 + ((meta?.page ?? 1) - 1) * (meta?.limit ?? 10) }}</td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium whitespace-nowrap">{{ row.nomorUsulan }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="row.arsipPerihal">{{ row.arsipPerihal }}</td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-200">{{ row.sekretarisName }}</td>
                <td class="px-4 py-3"><span :class="statusBadge(row.status)">{{ statusLabel(row.status) }}</span></td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatDate(row.tanggalUsulan) }}</td>
                <td class="px-4 py-3 text-center">
                  <NuxtLink :to="`/usulan-pindah/${row.id}`" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap">
                    <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
                    Detail
                  </NuxtLink>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.total > 0" class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-3">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }}
          dari <span class="font-medium text-gray-700 dark:text-gray-300">{{ meta.total }}</span> usulan
        </div>
        <div v-if="meta.totalPages > 1" class="flex items-center gap-1">
          <button :disabled="meta.page <= 1" @click="goPage(meta.page - 1)" class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" /> Prev
          </button>
          <button :disabled="meta.page >= meta.totalPages" @click="goPage(meta.page + 1)" class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Next <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Export Column Modal -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="meta?.total || usulanList.length"
      title="Pilih Kolom Export Usulan Pindah"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useUsulanPindah } from '~/composables/useUsulanPindah';
import type { UsulanPindahFilter, UsulanPindahStatus } from '~/types/usulan-pindah';

definePageMeta({ middleware: ['auth'] });

const { fetchUsulanList, fetchSummary, usulanList, summary, loading, meta } = useUsulanPindah();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Usulan Pindah Arsip Inaktif', to: '/usulan-pindah' },
];

const filter = reactive<UsulanPindahFilter>({
  page: 1,
  limit: 10,
  status: undefined,
  search: '',
  startDate: '',
  endDate: '',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
});

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'MENUNGGU_VERIFIKASI_ATASAN', label: 'Menunggu Verifikasi Atasan' },
  { value: 'DITOLAK_ATASAN', label: 'Ditolak Atasan' },
  { value: 'DISETUJUI_ATASAN', label: 'Disetujui Atasan' },
  { value: 'MENUNGGU_VERIFIKASI_TERAKHIR', label: 'Menunggu Verifikasi Terakhir' },
  { value: 'DISETUJUI_VERIFIKASI_TERAKHIR', label: 'Disetujui Verifikasi Terakhir' },
  { value: 'DIKIRIM', label: 'Dikirim' },
  { value: 'BERKAS_FISIK_DIPERSIAPKAN', label: 'Berkas Fisik Disiapkan' },
  { value: 'SELESAI', label: 'Selesai' },
];

const statusBadge = (status: UsulanPindahStatus) => {
  const map: Record<string, string> = {
    DRAFT: 'px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium',
    MENUNGGU_VERIFIKASI_ATASAN: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-medium',
    DITOLAK_ATASAN: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium',
    DISETUJUI_ATASAN: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-medium',
    DITOLAK_VERIFIKASI_TERAKHIR: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium',
    DIKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium',
    BERKAS_FISIK_DIPERSIAPKAN: 'px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium',
    SELESAI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium',
  };
  return map[status] || map.DRAFT;
};

const statusLabel = (status: UsulanPindahStatus) => {
  const map: Record<string, string> = {
    DRAFT: 'Draft',
    MENUNGGU_VERIFIKASI_ATASAN: 'Menunggu Verifikasi',
    DITOLAK_ATASAN: 'Ditolak Atasan',
    DISETUJUI_ATASAN: 'Disetujui Atasan',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'Menunggu Verifikasi Terakhir',
    DITOLAK_VERIFIKASI_TERAKHIR: 'Ditolak Verifikasi Terakhir',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'Disetujui Verifikasi Terakhir',
    DIKIRIM: 'Dikirim',
    BERKAS_FISIK_DIPERSIAPKAN: 'Berkas Disiapkan',
    SELESAI: 'Selesai',
  };
  return map[status] || status;
};

const formatDate = (d: string | Date) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const loadData = async () => {
  try {
    await Promise.all([fetchUsulanList({ ...filter }), fetchSummary()]);
  } catch (e) {
    console.error('Gagal memuat usulan:', e);
  }
};

const reload = () => {
  filter.page = 1;
  loadData();
};

const resetFilter = () => {
  filter.status = undefined;
  filter.search = '';
  filter.startDate = '';
  filter.endDate = '';
  filter.page = 1;
  loadData();
};

const goPage = (page: number) => {
  filter.page = page;
  loadData();
};

// ─── Export Excel dengan Pemilihan Kolom ──────────────────────────────────────
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';

const showExportModal = ref(false);
const isExporting = ref(false);

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'nomorUsulan', label: 'Nomor Usulan', desc: 'Nomor berkas usulan' },
  { key: 'perihal', label: 'Perihal Arsip', desc: 'Perihal / judul arsip' },
  { key: 'pengusul', label: 'Pengusul', desc: 'Nama sekretaris / pengusul' },
  { key: 'status', label: 'Status', desc: 'Status usulan pindah' },
  { key: 'tanggal', label: 'Tanggal Usulan', desc: 'Tanggal pembuatan usulan' }
]);

const onExport = () => {
  if (usulanList.value.length === 0) {
    useToast().add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  showExportModal.value = true;
};

const handleExportConfirm = async (selectedKeys: string[]) => {
  if (usulanList.value.length === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    let allRows = usulanList.value;
    if (meta.value && meta.value.total > (filter.limit ?? 10)) {
      const res = await (useApi() as any).apiGet('/usulan-pindah', {
        params: { ...filter, page: 1, limit: meta.value.total }
      });
      if (res?.data?.data && Array.isArray(res.data.data)) {
        allRows = res.data.data;
      }
    }

    const data = allRows.map((r: any, idx: number) => {
      const row: Record<string, any> = {};
      if (selectedKeys.includes('No')) row['No'] = idx + 1;
      if (selectedKeys.includes('nomorUsulan')) row['Nomor Usulan'] = r.nomorUsulan || '-';
      if (selectedKeys.includes('perihal')) row['Perihal Arsip'] = r.arsipPerihal || '-';
      if (selectedKeys.includes('pengusul')) row['Pengusul'] = r.sekretarisName || '-';
      if (selectedKeys.includes('status')) row['Status'] = statusLabel(r.status);
      if (selectedKeys.includes('tanggal')) row['Tanggal Usulan'] = formatDate(r.tanggalUsulan);
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usulan Pindah');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `usulan_pindah_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showExportModal.value = false;
    useToast().add({ title: 'Berhasil', description: `${data.length} data usulan berhasil diexport`, color: 'success' });
  } catch (err) {
    console.error('Export usulan pindah error:', err);
    useToast().add({ title: 'Gagal export', description: 'Terjadi kesalahan saat export.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>