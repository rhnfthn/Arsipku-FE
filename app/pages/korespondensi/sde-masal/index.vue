<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900">
    <PageHeader title="SDE Masal" :items="breadcrumbs" />

    <div class="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <!-- Filter Bar -->
      <div class="flex flex-row items-center gap-2 border-b border-gray-300 p-4 dark:border-gray-700">
        <select v-model="filter.limit" class="h-10 w-20 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition-colors focus:border-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" @change="reload">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
        <select v-model="filter.status" @change="reload" class="h-10 w-40 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition-colors focus:border-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
          <option value="MENUNGGU_PENGIRIM">Menunggu Pengirim</option>
          <option value="SEBAGIAN_TERKIRIM">Sebagian Terkirim</option>
          <option value="DIKEMBALIKAN">Dikembalikan</option>
          <option value="TERKIRIM">Terkirim</option>
          <option value="DITOLAK">Ditolak</option>
        </select>
        <select v-model="filter.klasifikasi" @change="reload" class="h-10 w-48 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition-colors focus:border-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
          <option value="">Semua Klasifikasi</option>
          <option v-for="k in klasifikasiList" :key="k.id" :value="k.klasifikasi">{{ k.klasifikasi }} - {{ k.klasifikasi_text }}</option>
        </select>
        <div class="relative min-w-0 flex-1">
          <UIcon name="i-lucide-search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input v-model="filter.search" type="text" placeholder="Cari judul folder atau pengirim..." class="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary-400 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" @keyup.enter="reload" />
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
            <tr v-if="loading" v-for="i in 5" :key="i" class="border-b border-gray-100 dark:border-gray-700">
              <td v-for="j in 6" :key="j" class="px-4 py-3">
                <div class="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </td>
            </tr>
            <tr v-else-if="folders.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                Tidak ada folder yang ditemukan.
              </td>
            </tr>
            <tr v-else v-for="folder in folders" :key="folder.id" class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 max-w-[220px] truncate" :title="folder.judul">
                {{ folder.judul }}
              </td>
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[200px] truncate" :title="folder.pengirimName || ''">{{ folder.pengirimName || '-' }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[180px] truncate" :title="folder.klasifikasi || ''">
                {{ folder.klasifikasi || '-' }}
                <span v-if="folder.klasifikasiText" class="text-gray-400"> · {{ folder.klasifikasiText }}</span>
              </td>
              <td class="px-4 py-2.5 text-center">
                <span :class="statusBadge(folder.status)">{{ statusLabel(folder.status) }}</span>
              </td>
              <td class="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDate(folder.tanggal || folder.createdAt) }}</td>
              <td class="px-4 py-2.5 text-center">
                <NuxtLink
                  v-if="folder.status === 'DRAFT' || folder.status === 'DIKEMBALIKAN'"
                  :to="`/korespondensi/tulis/sde-masal?folderId=${folder.id}`"
                  class="inline-flex items-center justify-center rounded-lg p-2 text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  title="Lanjutkan pembuatan SDE Masal"
                >
                  <UIcon name="i-lucide-pencil" class="size-4" />
                </NuxtLink>
                <NuxtLink
                  v-else
                  :to="`/korespondensi/sde-masal/folder/${folder.id}`"
                  class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                  title="Lihat detail"
                >
                  <UIcon name="i-lucide-eye" class="size-4" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="meta.total > 0"
        class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-3"
      >
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            Menampilkan {{ (meta.page - 1) * filter.limit + 1 }}–{{ Math.min(meta.page * filter.limit, meta.total) }}
            dari <span class="font-medium text-gray-700 dark:text-gray-300">{{ meta.total }}</span> folder
          </span>
        </div>
        <div class="flex items-center gap-1">
          <button
            :disabled="meta.page <= 1"
            @click="changePage(meta.page - 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" /> Sebelumnya
          </button>
          <span class="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ meta.page }}
          </span>
          <button
            :disabled="meta.page >= meta.totalPages"
            @click="changePage(meta.page + 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Selanjutnya <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SdeMasalFolder } from '~/types/sde-masal';
import type { Klasifikasi } from '~/types/klasifikasi';

// Daftar tetap dibatasi oleh scope creator dari API; staff dapat melihat
// folder yang memang dibuatnya dari disposisi.
definePageMeta({ middleware: ['auth'] });

const { fetchFolders } = useSdeMasal();
const { getKlasifikasiList } = useKlasifikasi();
const folders = ref<SdeMasalFolder[]>([]);
const klasifikasiList = ref<Klasifikasi[]>([]);
const loading = ref(true);
const exporting = ref(false);
const meta = reactive({ page: 1, limit: 10, total: 0, totalPages: 0 });
const filter = reactive({
  search: '',
  status: '',
  klasifikasi: '',
  page: 1,
  limit: 10,
});
const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Korespondensi', to: '/korespondensi/kotak-masuk' },
  { label: 'SDE Masal', to: '/korespondensi/sde-masal' },
];
const statusOptions = [
  { label: 'Semua Status', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Menunggu Verifikasi', value: 'MENUNGGU_VERIFIKASI' },
  { label: 'Terkirim', value: 'TERKIRIM' },
  { label: 'Ditolak', value: 'DITOLAK' },
];
const klasifikasiOptions = computed(() => [
  { label: 'Semua Klasifikasi', value: '' },
  ...klasifikasiList.value.map((k) => ({
    label: `${k.klasifikasi} - ${k.klasifikasi_text}`,
    value: k.klasifikasi,
  })),
]);

const loadFolders = async () => {
  loading.value = true;
  try {
    const response: any = await fetchFolders({ ...filter, scope: 'creator' });
    folders.value = response?.data || [];
    Object.assign(
      meta,
      response?.meta || { page: 1, limit: filter.limit, total: 0, totalPages: 0 }
    );
  } catch (error: any) {
    console.error('Gagal memuat folder SDE Masal:', error);
    folders.value = [];
  } finally {
    loading.value = false;
  }
};
const reload = () => {
  filter.page = 1;
  loadFolders();
};
const resetFilter = () => {
  Object.assign(filter, {
    search: '',
    status: '',
    klasifikasi: '',
    page: 1,
    limit: 10,
  });
  loadFolders();
};
const changePage = (page: number) => {
  filter.page = page;
  loadFolders();
};
const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const statusLabel = (status: string) =>
  ({
    DRAFT: 'Draft',
    MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
    MENUNGGU_PENGIRIM: 'Menunggu Pengirim',
    SEBAGIAN_TERKIRIM: 'Sebagian Terkirim',
    DIKEMBALIKAN: 'Dikembalikan',
    TERKIRIM: 'Terkirim',
    DITOLAK: 'Ditolak',
  })[status] || status;
const statusBadge = (status: string) => ({
  DRAFT: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap dark:bg-gray-700 dark:text-gray-300',
  MENUNGGU_VERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium whitespace-nowrap dark:bg-indigo-900/40 dark:text-indigo-300',
  MENUNGGU_PENGIRIM: 'px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium whitespace-nowrap dark:bg-amber-900/40 dark:text-amber-300',
  SEBAGIAN_TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium whitespace-nowrap dark:bg-blue-900/40 dark:text-blue-300',
  DIKEMBALIKAN: 'px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-medium whitespace-nowrap dark:bg-orange-900/40 dark:text-orange-300',
  TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  DITOLAK: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
}[status] || 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap');

const exportData = async () => {
  exporting.value = true;
  try {
    if (!folders.value.length) return;
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(folders.value.map((f) => ({
      'Judul Folder': f.judul || '-',
      'Pengirim': f.pengirimName || '-',
      'Klasifikasi': f.klasifikasi || '-',
      'Status': statusLabel(f.status),
      'Tanggal': formatDate(f.tanggal || f.createdAt),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SDE Masal');
    XLSX.writeFile(workbook, 'sde-masal-folders.xlsx');
  } catch (e: any) {
    console.error('Gagal export:', e);
  } finally {
    exporting.value = false;
  }
};

onMounted(async () => {
  try {
    const [classifications] = await Promise.all([
      getKlasifikasiList().catch(() => []),
      loadFolders(),
    ]);
    klasifikasiList.value = classifications;
  } catch (error) {
    console.error('Gagal memuat data SDE Masal:', error);
  }
});
</script>
