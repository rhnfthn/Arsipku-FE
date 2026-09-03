<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="folder?.judul || 'Folder SDE Massal'" :items="breadcrumbs" />
      <NuxtLink
        to="/korespondensi/sde-masal"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <template v-else-if="folder">
      <!-- Informasi Folder (full width, di atas) -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Informasi Folder</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Judul Folder</p>
            <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ folder.judul || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <span class="mt-1 inline-block" :class="statusBadge(folder.status)">{{ statusLabel(folder.status) }}</span>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total naskah</p>
            <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ items.length }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Pengirim</p>
            <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white truncate">{{ folder.pengirimName || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Klasifikasi</p>
            <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {{ folder.klasifikasi || '-' }}
              <span v-if="folder.klasifikasiText" class="text-gray-900 dark:text-white"> · {{ folder.klasifikasiText }}</span>
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Sifat</p>
            <p class="mt-1 text-sm font-semibold capitalize text-gray-900 dark:text-white">{{ folder.sifat || 'biasa' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
            <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(folder.tanggal || folder.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Daftar Naskah (full width, di bawah) -->
      <div class="mt-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Daftar Naskah</h3>
        </div>
        <EmptyState
          v-if="items.length === 0"
          icon="i-lucide-file-x"
          title="Belum ada naskah"
          description="Naskah akan tampil setelah data penerima diproses."
        />
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-primary text-left text-white dark:bg-primary-700">
              <tr>
                <th class="px-4 py-3 font-semibold whitespace-nowrap">Nomor</th>
                <th class="px-4 py-3 font-semibold whitespace-nowrap">Perihal</th>
                <th class="px-4 py-3 font-semibold whitespace-nowrap">Penerima</th>
                <th class="px-4 py-3 text-center font-semibold whitespace-nowrap">Status</th>
                <th class="px-4 py-3 text-center font-semibold whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in items"
                :key="item.id"
                class="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td class="px-4 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-300">{{ item.nomor || '-' }}</td>
                <td class="max-w-xs px-4 py-2.5">
                  <p class="truncate text-xs font-medium text-gray-700 dark:text-gray-200" :title="item.perihal || ''">
                    {{ item.perihal || '-' }}
                  </p>
                </td>
                <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[200px] truncate" :title="item.penerima || ''">
                  {{ item.penerima || '-' }}
                </td>
                <td class="px-4 py-2.5 text-center">
                  <span :class="naskahStatusBadge(item.status)">{{ naskahStatusLabel(item.status) }}</span>
                </td>
                <td class="px-4 py-2.5">
                  <div class="flex items-center justify-center gap-1">
                    <NuxtLink
                      v-if="item.naskahId"
                      :to="`/korespondensi/sde-masal/${item.naskahId}`"
                      class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                      title="Lihat detail"
                    >
                      <UIcon name="i-lucide-eye" class="size-4" />
                    </NuxtLink>
                    <button
                      v-if="item.finalPdf"
                      class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                      title="Download PDF"
                      @click="downloadPdf(item)"
                    >
                      <UIcon name="i-lucide-download" class="size-4" />
                    </button>
                    <button
                      v-if="isGagal(item.status)"
                      class="inline-flex items-center justify-center rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      :disabled="retryingId === item.id"
                      :title="retryingId === item.id ? 'Sedang mengirim ulang…' : 'Kirim ulang'"
                      @click="retryItem(item)"
                    >
                      <UIcon
                        :name="retryingId === item.id ? 'i-lucide-loader-2' : 'i-lucide-refresh-cw'"
                        class="size-4"
                        :class="{ 'animate-spin': retryingId === item.id }"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { SdeMasalFolder, SdeMasalFolderItem } from '~/types/sde-masal';

definePageMeta({ middleware: ['auth', 'sde-masal-bod'] });
const route = useRoute();
const { api } = useApi();
const { findNaskahInFolder } = useSdeMasal();
const folder = ref<SdeMasalFolder | null>(null);
const items = ref<SdeMasalFolderItem[]>([]);
const loading = ref(true);
const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'SDE Masal', to: '/korespondensi/sde-masal' },
  { label: folder.value?.judul || 'Folder', to: '#' },
]);

const loadData = async () => {
  loading.value = true;
  try {
    const data = await findNaskahInFolder(String(route.params.folderId));
    folder.value = data?.folder || null;
    items.value = data?.items || [];
  } finally {
    loading.value = false;
  }
};

// Kirim ulang naskah yang gagal
const retryingId = ref<string | null>(null);
const toast = useToast();
const isGagal = (status: string) =>
  ['GAGAL', 'Gagal'].includes(status) || status?.toLowerCase() === 'gagal';
const retryItem = async (item: SdeMasalFolderItem) => {
  if (retryingId.value === item.id) return;
  retryingId.value = item.id;
  try {
    await api.post(`/sde-masal/${item.id}/retry`);
    toast.add({
      title: 'Kirim ulang berhasil',
      description: `Naskah "${item.perihal || '-'}" berhasil dikirim.`,
      color: 'success',
    });
    await loadData();
  } catch (e: any) {
    let detail = e?.response?.data?.message || e?.message || 'Gagal mengirim ulang naskah';
    if (Array.isArray(detail)) detail = detail[0];
    toast.add({ title: 'Kirim ulang gagal', description: String(detail), color: 'error' });
  } finally {
    retryingId.value = null;
  }
};
const downloadPdf = (item: SdeMasalFolderItem) => {
  if (!item.finalPdf) return;
  const base = api?.defaults?.baseURL || '';
  window.open(
    item.finalPdf.startsWith('http')
      ? item.finalPdf
      : `${base}/${item.finalPdf.replace(/^\//, '')}`,
    '_blank'
  );
};
const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const statusLabel = (status: string) =>
  ({
    DRAFT: 'Draft',
    MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
    TERKIRIM: 'Terkirim',
    DITOLAK: 'Ditolak',
  })[status] || status;
const statusBadge = (status: string) => ({
  DRAFT: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap dark:bg-gray-700 dark:text-gray-300',
  MENUNGGU_VERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium whitespace-nowrap dark:bg-indigo-900/40 dark:text-indigo-300',
  TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  DITOLAK: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
}[status] || 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap');
const naskahStatusLabel = (status: string) =>
  ({
    draf: 'Draft',
    pending: 'Menunggu TTD',
    final: 'Final',
    final_tte: 'Final (TTE)',
    MENUNGGU: 'Menunggu',
    MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
    TERVERIFIKASI: 'Disetujui',
    TERKIRIM: 'Terkirim',
    DITOLAK: 'Ditolak',
    GAGAL: 'Gagal',
  })[status] || status;
const naskahStatusBadge = (status: string) => ({
  draf: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap dark:bg-gray-700 dark:text-gray-300',
  pending: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium whitespace-nowrap dark:bg-yellow-900/40 dark:text-yellow-300',
  final: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  final_tte: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium whitespace-nowrap dark:bg-blue-900/40 dark:text-blue-300',
  MENUNGGU: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium whitespace-nowrap dark:bg-yellow-900/40 dark:text-yellow-300',
  MENUNGGU_VERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium whitespace-nowrap dark:bg-indigo-900/40 dark:text-indigo-300',
  TERVERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  DITOLAK: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
  GAGAL: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
}[status] || 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap');
onMounted(loadData);
</script>
