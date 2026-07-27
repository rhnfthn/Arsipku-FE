<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5 min-h-screen px-5">
    <PageHeader
      title="Riwayat & Retensi Aktif"
      :items="[
        { label: 'Kelola' },
        { label: 'Pemeliharaan' },
        { label: 'Riwayat & Retensi' },
      ]"
    />

    <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600"><FolderCheck class="h-5 w-5" /></div>
          <div><p class="text-xs text-gray-500">Closed (halaman ini)</p><p class="text-xl font-semibold text-gray-900 dark:text-white">{{ berkasList.length }}</p></div>
        </div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><Clock3 class="h-5 w-5" /></div>
          <div><p class="text-xs text-gray-500">Retensi Aktif Berjalan</p><p class="text-xl font-semibold text-gray-900 dark:text-white">{{ totalItems }}</p></div>
        </div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-50 text-warning-600"><AlertCircle class="h-5 w-5" /></div>
          <div><p class="text-xs text-gray-500">Akan Berakhir < 6 bln</p><p class="text-xl font-semibold text-gray-900 dark:text-white">{{ akanBerakhir }}</p></div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <DataToolbar v-model="perPage" v-model:search="search" search-placeholder="Cari berkas…" :rows-choices="[10,25,50]" :show-export="false" @refresh="fetchData" />
      <DataTable :columns="columns" :rows="berkasList" :loading="pending" empty-message="Belum ada berkas closed.">
        <template #cell-judulBerkas="{ row }"><p class="font-medium text-gray-900 dark:text-white">{{ row.judulBerkas || '-' }}</p></template>
        <template #cell-kodeBerkas="{ row }"><span class="font-mono text-xs">{{ row.kodeBerkas || '-' }}</span></template>
        <template #cell-tanggalDitutup="{ row }"><span class="text-xs text-gray-500">{{ formatDate(row.tanggalDitutup) }}</span></template>
        <template #cell-retensi="{ row }"><span class="text-xs">{{ row.retensiAktifTahun || 0 }}A / {{ row.retensiInaktifTahun || 0 }}I</span></template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
        <template #cell-aksi="{ row }">
          <NuxtLink :to="`/kelola/pemeliharaan/pemberkasan/${row.id}/retensi`" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Lihat Retensi"><Eye class="w-4 h-4" /></NuxtLink>
        </template>
      </DataTable>
      <DataPagination v-model:current-page="currentPage" :total-items="totalItems" :per-page="perPage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Clock3, Eye, FolderCheck, AlertCircle } from 'lucide-vue-next';

const { getRiwayatRetensi } = useArsipDinamis();
const search = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const berkasList = ref<any[]>([]);
const totalItems = ref(0);
const pending = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

const columns = [
  { key: 'judulBerkas', label: 'Nama Berkas' },
  { key: 'kodeBerkas', label: 'Kode Berkas' },
  { key: 'tanggalDitutup', label: 'Tanggal Closed' },
  { key: 'retensi', label: 'Retensi (A/I)' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi' },
];

const formatDate = (v?: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const akanBerakhir = computed(() => {
  const sixMonths = Date.now() + 180 * 86400000;
  return berkasList.value.filter((b) => {
    const end = b.tanggalRetensiAktifBerakhir ? new Date(b.tanggalRetensiAktifBerakhir).getTime() : 0;
    return end > Date.now() && end <= sixMonths;
  }).length;
});

const fetchData = async () => {
  pending.value = true;
  try {
    const response: any = await getRiwayatRetensi({ search: search.value || undefined, page: currentPage.value, limit: perPage.value });
    const payload = response?.data?.data ? response.data : response;
    berkasList.value = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    totalItems.value = Number(payload?.meta?.total ?? berkasList.value.length);
  } catch {
    berkasList.value = [];
    totalItems.value = 0;
  } finally {
    pending.value = false;
  }
};

watch([currentPage, perPage], () => fetchData());
watch(search, () => { clearTimeout(timer); timer = setTimeout(fetchData, 350); });
onMounted(fetchData);
</script>
