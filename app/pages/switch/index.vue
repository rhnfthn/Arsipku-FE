<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <div>
        <PageHeader title="Pindah Perusahaan" :items="items" />
      </div>

      <button
        class="px-4 py-2 rounded-lg text-sm text-white bg-gray-600 hover:bg-gray-700 transition disabled:opacity-50"
        :disabled="loading"
        @click="onResetCompany"
      >
        Perusahaan Default
      </button>

      <button
        class="px-4 py-2 rounded-lg text-sm text-white bg-primary hover:bg-primary-800 transition inline-flex items-center gap-1.5"
        @click="openExportModal"
      >
        <UIcon name="i-lucide-download" class="w-4 h-4" /> Export
      </button>
    </div>

    <!-- Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
      <!-- Search -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="relative max-w-sm">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari perusahaan atau kode..."
            class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-primary-400 dark:bg-primary-600 text-white">
            <tr>
              <th class="px-6 py-4 text-left font-semibold">Perusahaan</th>
              <th class="px-6 py-4 text-left font-semibold">Kode</th>
              <th class="px-6 py-4 text-left font-semibold">Masa Berlaku</th>
              <th class="px-6 py-4 text-center font-semibold">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in filteredCompanies"
              :key="item.relationSpId"
              class="border-b border-b-gray-200 dark:border-b-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <!-- Company Text -->
              <td class="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                {{ item.companyText }}
              </td>

              <!-- Company Code -->
              <td class="px-6 py-4 text-gray-700 dark:text-gray-300">
                {{ item.company }}
              </td>

              <!-- Masa Berlaku -->
              <td class="px-6 py-4 text-gray-600 dark:text-gray-400">
                {{ formatDate(item.startDate) }} –
                {{ formatDate(item.endDate) }}
              </td>

              <!-- Aksi -->
              <td class="px-6 py-4 text-center">
                <button
                  class="px-4 py-2 rounded-lg text-white bg-primary-400 dark:bg-primary-600 hover:bg-primary-500 dark:hover:bg-primary-700 transition disabled:opacity-50"
                  :disabled="item.isCurrentCompany || switchingId === item.relationSpId"
                  @click="onSwitch(item)"
                >
                  <span v-if="switchingId === item.relationSpId"> Memindahkan... </span>
                  <span v-else>
                    {{ item.isCurrentCompany ? 'Aktif' : 'Pindah' }}
                  </span>
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="!loading && filteredCompanies.length === 0">
              <td colspan="4" class="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                Tidak ada perusahaan tersedia
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-6 text-center text-gray-500 dark:text-gray-400">Memuat data...</div>
    </div>

    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="filteredCompanies.length"
      title="Pilih Kolom Export Perusahaan"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import type { BreadcrumbItem } from '@nuxt/ui';
import { useSwitch } from '@/composables/useSwitch';
import { useToast } from '#imports';
import ExportColumnModal from '~/components/ExportColumnModal.vue';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const toast = useToast();
const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pindah Perusahaan', to: '/switch' }
] satisfies BreadcrumbItem[];

const { companies, loading, switchingId, getAvailableCompanies, switchCompany, resetCompany } =
  useSwitch();

const searchQuery = ref('');

const filteredCompanies = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return companies.value;
  return companies.value.filter(
    (item: any) =>
      (item.companyText || '').toLowerCase().includes(q) ||
      (item.company || '').toLowerCase().includes(q)
  );
});

// ✅ Deteksi apakah sedang dalam mode delegasi
const isInDelegasiMode = computed(() => {
  if (!process.client) return false;
  return !!localStorage.getItem('delegasi_origin_token');
});

onMounted(() => {
  getAvailableCompanies();
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('id-ID');
};

const onSwitch = async (item: any) => {
  if (item.isCurrentCompany) return;

  const res = await switchCompany(item.relationSpId);

  toast.add({
    title: 'Berhasil',
    description: `Berhasil pindah ke perusahaan ${res.data.activeCompany.companyText}`,
    color: 'success',
    icon: 'i-lucide-check-circle'
  });

  setTimeout(() => {
    window.location.href = '/beranda';
  }, 800);
};

const onResetCompany = async () => {
  const res = await resetCompany();

  const companyText =
    res?.data?.activeCompany?.companyText ?? res?.data?.user?.companyText ?? 'Perusahaan Default';

  toast.add({
    title: 'Berhasil',
    // ✅ Pesan lebih jelas sesuai context
    description: isInDelegasiMode.value
      ? `Kembali ke perusahaan default akun yang didelegasikan (${companyText})`
      : `Berhasil kembali ke perusahaan default (${companyText})`,
    color: 'success',
    icon: 'i-lucide-check-circle'
  });

  setTimeout(() => {
    window.location.reload();
  }, 800);
};

definePageMeta({
  middleware: 'auth'
});

// ─── Export Excel ──────────────────────────────
const showExportModal = ref(false);
const isExporting = ref(false);

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'perusahaan', label: 'Perusahaan', desc: 'Nama perusahaan' },
  { key: 'kode', label: 'Kode', desc: 'Kode perusahaan' },
  { key: 'masaBerlaku', label: 'Masa Berlaku', desc: 'Periode masa berlaku' }
]);

const openExportModal = () => {
  showExportModal.value = true;
};

const handleExportConfirm = (selectedKeys: string[]) => {
  if (filteredCompanies.value.length === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const excelData = filteredCompanies.value.map((item: any, idx: number) => {
      const r: Record<string, any> = {};
      if (selectedKeys.includes('No')) r['No'] = idx + 1;
      if (selectedKeys.includes('perusahaan')) r['Perusahaan'] = item.companyText || '-';
      if (selectedKeys.includes('kode')) r['Kode'] = item.company || '-';
      if (selectedKeys.includes('masaBerlaku'))
        r['Masa Berlaku'] = `${formatDate(item.startDate)} – ${formatDate(item.endDate)}`;
      return r;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pindah Perusahaan');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `perusahaan-${new Date().toISOString().slice(0, 10)}.xlsx`);
    showExportModal.value = false;
  } catch (error) {
    console.error('Gagal export perusahaan:', error);
  } finally {
    isExporting.value = false;
  }
};
</script>
