<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900">
    <PageHeader title="SDE Massal" :items="breadcrumbs" />

    <div class="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <!-- Filter Bar -->
      <div class="flex flex-row items-center gap-2 border-b border-gray-300 p-4 dark:border-gray-700">
        <USelectMenu
          v-model="filter.limit"
          :items="pageSizeOptions"
          :search-input="false"
          class="w-20 shrink-0"
          :ui="{ base: 'h-10 w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200' }"
          aria-label="Jumlah data per halaman"
          @update:model-value="reload"
        />
        <USelectMenu
          v-model="selectedStatusFilter"
          :items="statusOptions"
          value-key="value"
          label-key="label"
          placeholder="Semua Status"
          :search-input="false"
          class="w-40 shrink-0"
          :ui="{ base: 'h-10 w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200' }"
          aria-label="Filter Status"
        />
        <USelectMenu
          v-model="selectedKlasifikasiFilter"
          :items="klasifikasiOptions"
          value-key="value"
          label-key="label"
          placeholder="Semua Klasifikasi"
          searchable
          :search-input="{ placeholder: 'Cari klasifikasi...' }"
          :content="({ class: 'max-h-[380px]' } as any)"
          class="w-48 shrink-0"
          :ui="{ base: 'h-10 w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200' }"
          aria-label="Filter Klasifikasi"
        />
        <div class="relative min-w-0 flex-1">
          <UIcon name="i-lucide-search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input v-model="filter.search" type="text" placeholder="Cari judul folder atau pengirim..." class="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary-400 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" @input="scheduleSearch" @keyup.enter="reload" />
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
            <tr v-else v-for="folder in sortedFolders" :key="folder.id" class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td
                class="px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 max-w-[220px] truncate"
                :class="isChangedFolder(folder) ? 'font-bold' : 'font-medium'"
                :title="folder.judul"
              >
                {{ folder.judul }}
              </td>
              <td
                class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[200px] truncate"
                :class="isChangedFolder(folder) ? 'font-bold' : ''"
                :title="folder.pengirimName || ''"
              >{{ folder.pengirimName || '-' }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[180px] truncate" :title="folder.klasifikasi || ''">
                {{ folder.klasifikasi || '-' }}
                <span v-if="folder.klasifikasiText" class="text-gray-400"> · {{ folder.klasifikasiText }}</span>
              </td>
              <td class="px-4 py-2.5 text-center" :class="isChangedFolder(folder) ? 'font-bold' : ''">
                <span :class="statusBadge(folder.status)">{{ statusLabel(folder.status) }}</span>
              </td>
              <td class="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDate(folder.tanggal || folder.createdAt) }}</td>
              <td class="px-4 py-2.5 text-center">
                <button
                  v-if="folder.status === 'DRAFT' || folder.status === 'DIKEMBALIKAN'"
                  type="button"
                  class="inline-flex items-center justify-center rounded-lg p-2 text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  title="Edit naskah di kanvas SDE Massal"
                  @click.stop="openFolderEditor(folder.id)"
                >
                  <UIcon name="i-lucide-pencil" class="size-4" />
                </button>
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

      <!-- Pagination menggunakan komponen bersama -->
      <Pagination
        v-if="meta.total > 0"
        :current-page="meta.page"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :rows-per-page="filter.limit"
        @update:page="changePage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import type { SdeMasalFolder } from '~/types/sde-masal';
import type { Klasifikasi } from '~/types/klasifikasi';
import { sdeMasalStatusBadge, sdeMasalStatusLabel } from '~/utils/sde-masal-status';

// Daftar tetap dibatasi oleh scope creator dari API; staff dapat melihat
// folder yang memang dibuatnya dari disposisi.
definePageMeta({ middleware: ['auth'] });

const { fetchFolders } = useSdeMasal();
const { getKlasifikasiList } = useKlasifikasi();
const {
  notifications,
  fetchNotifications,
  markSdeMasalFolderNotificationsAsRead,
} = useNotifications();
const folders = ref<SdeMasalFolder[]>([]);
const klasifikasiList = ref<Klasifikasi[]>([]);
const loading = ref(true);
const exporting = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
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
  { label: 'SDE Massal', to: '/korespondensi/sde-masal' },
];
const statusOptions = [
  { label: 'Semua Status', value: '__ALL__' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Menunggu Verifikasi', value: 'MENUNGGU_VERIFIKASI' },
  { label: 'Selesai', value: 'TERKIRIM' },
  { label: 'Ditolak', value: 'DITOLAK' },
];
const pageSizeOptions = [10, 25, 50];
const klasifikasiOptions = computed(() => [
  { label: 'Semua Klasifikasi', value: '__ALL__' },
  ...klasifikasiList.value.map((k) => ({
    label: `${k.klasifikasi} - ${k.klasifikasi_text}`,
    value: k.klasifikasi,
  })),
]);
const selectedStatusFilter = computed({
  get: () => filter.status || '__ALL__',
  set: (value: string) => {
    filter.status = value === '__ALL__' ? '' : value;
    reload();
  },
});
const selectedKlasifikasiFilter = computed({
  get: () => filter.klasifikasi || '__ALL__',
  set: (value: string) => {
    filter.klasifikasi = value === '__ALL__' ? '' : value;
    reload();
  },
});

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
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
  filter.page = 1;
  loadFolders();
};
const scheduleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchTimeout = null;
    reload();
  }, 400);
};
onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});
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
const openFolderEditor = (folderId: string) => {
  if (!folderId) return;
  return markSdeMasalFolderNotificationsAsRead(folderId).finally(() =>
    navigateTo({
      path: '/korespondensi/tulis/sde-masal',
      query: { folderId: String(folderId) },
    }),
  );
};
const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
const statusLabel = sdeMasalStatusLabel;
const statusBadge = sdeMasalStatusBadge;

const isChangedFolder = (folder: SdeMasalFolder) =>
  notifications.value.some((notification) => {
    const data = notification.data;
    return Boolean(
      !notification.isRead &&
      data?.category === 'SDE_MASAL' &&
      data?.action === 'OPEN_SDE_MASAL_FOLDER' &&
      String(data?.folderId || data?.folder_id || '') === String(folder.id),
    );
  });

const sortedFolders = computed(() =>
  [...folders.value].sort((a, b) => {
    // Bold/unread hanya indikator visual. Posisi daftar selalu ditentukan
    // oleh waktu perubahan terakhir, sehingga item terbaru tetap teratas
    // meskipun item lain masih unread/bold.
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (bTime !== aTime) return bTime - aTime;
    return String(b.id || '').localeCompare(String(a.id || ''));
  }),
);

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
      fetchNotifications(1, 100, true),
    ]);
    klasifikasiList.value = classifications;
  } catch (error) {
    console.error('Gagal memuat data SDE Masal:', error);
  }
});
</script>
