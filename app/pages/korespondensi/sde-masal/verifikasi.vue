<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900">
    <PageHeader title="Verifikasi SDE Massal" :items="breadcrumbs" />

    <div class="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <!-- Filter Bar -->
      <div class="flex flex-row items-center gap-2 border-b border-gray-300 p-4 dark:border-gray-700">
        <select v-model="f.limit" class="h-10 w-20 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition-colors focus:border-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
        <select v-model="f.status" class="h-10 w-40 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition-colors focus:border-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
          <option value="MENUNGGU_PENGIRIM">Menunggu Pengirim</option>
          <option value="SEBAGIAN_TERKIRIM">Sebagian Terkirim</option>
          <option value="DIKEMBALIKAN">Dikembalikan</option>
          <option value="TERKIRIM">Selesai</option>
          <option value="DITOLAK">Ditolak</option>
        </select>
        <select v-model="f.klasifikasiId" class="h-10 w-48 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition-colors focus:border-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
          <option value="">Semua Klasifikasi</option>
          <option v-for="klasifikasi in klasifikasiOptions" :key="klasifikasi.id" :value="klasifikasi.id">{{ klasifikasi.klasifikasi }} - {{ klasifikasi.klasifikasi_text }}</option>
        </select>
        <div class="relative min-w-0 flex-1">
          <UIcon name="i-lucide-search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input v-model="f.search" type="text" placeholder="Cari Perihal..." class="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary-400 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
        </div>
        <button @click="exportData" :disabled="exporting" class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-400 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"><UIcon :name="exporting ? 'i-lucide-loader-2' : 'i-lucide-download'" :class="['size-4', exporting && 'animate-spin']" />Export</button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-primary text-left text-white dark:bg-primary-700">
            <tr>
              <th class="px-4 py-3 font-semibold whitespace-nowrap">Judul Folder</th>
              <th class="px-4 py-3 font-semibold whitespace-nowrap">Pengirim</th>
              <th class="px-4 py-3 font-semibold whitespace-nowrap">Klasifikasi</th>
              <th class="px-4 py-3 text-center font-semibold whitespace-nowrap">Status</th>
              <th class="px-4 py-3 font-semibold whitespace-nowrap">Tanggal</th>
              <th class="px-4 py-3 text-center font-semibold whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" v-for="i in 4" :key="i" class="border-b border-gray-100 dark:border-gray-700">
              <td v-for="j in 6" :key="j" class="px-4 py-3">
                <div class="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                Tidak ada SDE Massal untuk diverifikasi.
              </td>
            </tr>
            <tr v-else v-for="folder in paginatedRows" :key="folder.id" class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 max-w-[220px] truncate" :title="folder.judul">{{ folder.judul || '-' }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[220px] truncate" :title="folder.pengirimName || ''">{{ folder.pengirimName || '-' }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[180px] truncate" :title="folder.klasifikasi || ''">
                {{ folder.klasifikasi || '-' }}
                <span v-if="folder.klasifikasiText" class="text-gray-400"> · {{ folder.klasifikasiText }}</span>
              </td>
              <td class="px-4 py-2.5 text-center">
                <span :class="statusBadge(displayStatus(folder))">{{ statusLabel(displayStatus(folder)) }}</span>
              </td>
              <td class="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {{ formatDate(folder.tanggal || folder.createdAt) }}
              </td>
              <td class="px-4 py-2.5">
                <div class="flex items-center justify-center">
                  <NuxtLink
                    :to="`/korespondensi/sde-masal/folder/${folder.id}`"
                    class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                    title="Lihat naskah dalam folder"
                  >
                    <UIcon name="i-lucide-eye" class="size-4" />
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="filteredRows.length > 0"
        class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-3"
      >
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            Menampilkan {{ (page - 1) * f.limit + 1 }}–{{ Math.min(page * f.limit, filteredRows.length) }}
            dari <span class="font-medium text-gray-700 dark:text-gray-300">{{ filteredRows.length }}</span> folder
          </span>
        </div>
        <div v-if="totalPages > 1" class="flex items-center gap-1">
          <button
            :disabled="page <= 1"
            @click="page--"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" /> Prev
          </button>
          <span class="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ page }} / {{ totalPages }}
          </span>
          <button
            :disabled="page >= totalPages"
            @click="page++"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { SdeMasalItem } from '~/types/sde-masal';
import type { Klasifikasi } from '~/types/klasifikasi';
import { useSdeMasal } from '~/composables/useSdeMasal';
import { useKlasifikasi } from '~/composables/useKlasifikasi';
import { useAuth } from '~/composables/useAuth';
import { sdeMasalStatusBadge, sdeMasalStatusLabel } from '~/utils/sde-masal-status';

definePageMeta({ middleware: ['auth'] });

const toast = useToast();
const { user, getProfile } = useAuth();
const { fetchVerificationFolders } = useSdeMasal();
const { getKlasifikasiList } = useKlasifikasi();

const rows = ref<any[]>([]);
const loading = ref(false);
const klasifikasiOptions = ref<Klasifikasi[]>([]);
const exporting = ref(false);
const page = ref(1);

const f = reactive({
  search: '',
  status: '',
  klasifikasiId: '',
  limit: 10,
});

const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'SDE Massal', to: '/korespondensi/sde-masal/verifikasi' },
  { label: 'Verifikasi SDE Massal', to: '#' },
];

const filteredRows = computed(() => {
  let result = [...rows.value].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  if (f.status) {
    result = result.filter((folder) => folder.status === f.status);
  }
  if (f.klasifikasiId) {
    result = result.filter((folder) => folder.klasifikasi === f.klasifikasiId);
  }
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    result = result.filter((folder) =>
      (folder.judul || '').toLowerCase().includes(q) ||
      (folder.pengirimName || '').toLowerCase().includes(q),
    );
  }
  return result;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / f.limit)));
const paginatedRows = computed(() => {
  const start = (page.value - 1) * f.limit;
  return filteredRows.value.slice(start, start + f.limit);
});

watch([() => f.status, () => f.klasifikasiId, () => f.search, () => f.limit], () => {
  page.value = 1;
});

const resetFilter = () => {
  f.search = '';
  f.status = '';
  f.klasifikasiId = '';
  f.limit = 10;
  page.value = 1;
};

const exportData = async () => {
  exporting.value = true;
  try {
    const records = filteredRows.value;
    if (!records.length) {
      toast.add({ title: 'Tidak ada data', description: 'Tidak ada SDE Massal untuk diekspor.', color: 'warning' });
      return;
    }
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(records.map((folder) => ({
      'Judul Folder': folder.judul || '-',
      Pengirim: folder.pengirimName || '-',
      Klasifikasi: folder.klasifikasi || '-',
      Status: statusLabel(displayStatus(folder)),
      Tanggal: formatDate(folder.tanggal || folder.createdAt),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verifikasi SDE Massal');
    XLSX.writeFile(workbook, 'verifikasi-sde-massal.xlsx');
  } catch (error: any) {
    toast.add({ title: 'Gagal export', description: error?.message || 'Data tidak dapat diekspor.', color: 'error' });
  } finally {
    exporting.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    rows.value = await fetchVerificationFolders();
  } catch (error: any) {
    toast.add({ title: 'Gagal memuat data', description: error?.message || 'Coba lagi.', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const statusLabel = sdeMasalStatusLabel;

const displayStatus = (folder: any) =>
  folder?.status || folder?.myVerificationStatus || '';

const statusBadge = sdeMasalStatusBadge;

onMounted(async () => {
  if (!user.value) await getProfile();
  await loadData();
  getKlasifikasiList().then((data) => { klasifikasiOptions.value = data; });
});
</script>
