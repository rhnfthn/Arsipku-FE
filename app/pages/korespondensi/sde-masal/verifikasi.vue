<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900">
    <PageHeader title="Verifikasi SDE Massal" :items="breadcrumbs" />

    <div class="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <!-- Filter Bar -->
      <div class="flex flex-row items-center gap-2 border-b border-gray-300 p-4 dark:border-gray-700">
        <USelectMenu
          v-model="f.limit"
          :items="pageSizeOptions"
          :search-input="false"
          class="w-20 shrink-0"
          :ui="{ base: 'h-10 w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200' }"
          aria-label="Jumlah data per halaman"
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
          :items="klasifikasiFilterOptions"
          value-key="value"
          label-key="label"
          placeholder="Semua Klasifikasi"
          searchable
          :search-attributes="['searchText']"
          :search-input="{ placeholder: 'Cari klasifikasi...' }"
          :content="({ class: 'max-h-[380px]' } as any)"
          class="w-48 shrink-0"
          :ui="{ base: 'h-10 w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200' }"
          aria-label="Filter Klasifikasi"
        />
        <div class="relative min-w-0 flex-1">
          <UIcon name="i-lucide-search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input v-model="f.search" type="text" placeholder="Cari Perihal..." class="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary-400 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
        </div>
        <button @click="exportData" :disabled="exporting" class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary dark:bg-primary-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-800 dark:hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"><UIcon :name="exporting ? 'i-lucide-loader-2' : 'i-lucide-download'" :class="['size-4', exporting && 'animate-spin']" />Export</button>
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
              <td
                class="px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 max-w-[220px] truncate"
                :class="isNewVerificationFolder(folder) ? 'font-bold' : 'font-medium'"
                :title="folder.judul"
              >{{ folder.judul || '-' }}</td>
              <td
                class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[220px] truncate"
                :class="isNewVerificationFolder(folder) ? 'font-bold' : ''"
                :title="folder.pengirimName || ''"
              >{{ folder.pengirimName || '-' }}</td>
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

      <!-- Pagination menggunakan komponen bersama -->
      <Pagination
        v-if="filteredRows.length > 0"
        :current-page="page"
        :total-pages="totalPages"
        :total-items="filteredRows.length"
        :rows-per-page="f.limit"
        @update:page="page = $event"
      />
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
import { useNotifications } from '~/composables/useNotifications';
import { sdeMasalStatusBadge, sdeMasalStatusLabel } from '~/utils/sde-masal-status';

definePageMeta({ middleware: ['auth'] });

const toast = useToast();
const { user, getProfile } = useAuth();
const { fetchVerificationFolders } = useSdeMasal();
const { getKlasifikasiList } = useKlasifikasi();
const { notifications, fetchNotifications } = useNotifications();

const rows = ref<any[]>([]);
const loading = ref(false);
const klasifikasiOptions = ref<Klasifikasi[]>([]);
const exporting = ref(false);
const page = ref(1);
const pageSizeOptions = [10, 25, 50];
const statusOptions = [
  { label: 'Semua Status', value: '__ALL__' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Menunggu Verifikasi', value: 'MENUNGGU_VERIFIKASI' },
  { label: 'Menunggu Pengirim', value: 'MENUNGGU_PENGIRIM' },
  { label: 'Sebagian Terkirim', value: 'SEBAGIAN_TERKIRIM' },
  { label: 'Dikembalikan', value: 'DIKEMBALIKAN' },
  { label: 'Selesai', value: 'TERKIRIM' },
  { label: 'Ditolak', value: 'DITOLAK' },
];

const f = reactive({
  search: '',
  status: '',
  klasifikasiId: '',
  limit: 10,
});

const klasifikasiFilterOptions = computed(() => [
  { label: 'Semua Klasifikasi', value: '__ALL__', searchText: 'Semua Klasifikasi' },
  ...klasifikasiOptions.value.map((klasifikasi) => ({
    label: `${klasifikasi.klasifikasi} - ${klasifikasi.klasifikasi_text}`,
    value: klasifikasi.id,
    searchText: klasifikasi.search_text || [
      klasifikasi.klasifikasi,
      klasifikasi.klasifikasi_text,
      klasifikasi.deskripsi,
    ].filter(Boolean).join(' '),
  })),
]);

const selectedStatusFilter = computed({
  get: () => f.status || '__ALL__',
  set: (value: string) => {
    f.status = value === '__ALL__' ? '' : value;
  },
});

const selectedKlasifikasiFilter = computed({
  get: () => f.klasifikasiId || '__ALL__',
  set: (value: string) => {
    f.klasifikasiId = value === '__ALL__' ? '' : value;
  },
});

const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'SDE Massal', to: '/korespondensi/sde-masal/verifikasi' },
  { label: 'Verifikasi SDE Massal', to: '#' },
];

const filteredRows = computed(() => {
  let result = [...rows.value].sort((a, b) => {
    // Bold/unread dan status workflow hanya untuk tampilan/filter. Posisi
    // folder selalu ditentukan oleh aktivitas terbaru.
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (bTime !== aTime) return bTime - aTime;
    return String(b.id || '').localeCompare(String(a.id || ''));
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
  new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

const statusLabel = sdeMasalStatusLabel;

const displayStatus = (folder: any) =>
  folder?.status || folder?.myVerificationStatus || '';

const statusBadge = sdeMasalStatusBadge;

const isNewVerificationFolder = (folder: any) => {
  if (
    Number(folder?.waitingCount || 0) <= 0
  ) {
    return false;
  }

  const expectedAction = folder?.workflowRole === 'VERIFIKATOR'
    ? 'OPEN_SDE_MASAL_VERIFIKASI'
    : folder?.workflowRole === 'PENGIRIM_AKHIR'
      ? 'OPEN_SDE_MASAL_FOLDER'
      : null;
  if (!expectedAction) return false;

  return notifications.value.some((notification) => {
    if (
      notification.isRead ||
      notification.data?.category !== 'SDE_MASAL' ||
      notification.data?.action !== expectedAction
    ) return false;
    const notificationFolderId =
      notification.data?.folderId || notification.data?.folder_id;
    return String(notificationFolderId || '') === String(folder?.id || '');
  });
};

onMounted(async () => {
  if (!user.value) await getProfile();
  await loadData();
  // Pastikan status unread folder tersedia walaupun halaman dibuka langsung
  // sebelum daftar notifikasi global selesai dimuat.
  await fetchNotifications(1, 100, true);
  getKlasifikasiList().then((data) => { klasifikasiOptions.value = data; });
});
</script>
