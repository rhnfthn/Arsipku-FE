<script setup lang="ts">
// Detail berkas yang diberikan — style seperti pemberkasan detail
// Fetch usulan detail untuk dapat selectedBerkas, lalu fetch berkas detail + naskah
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ChevronDown, ChevronLeft, Eye, FileText, Folder, Clock, Building2, User, Key, RotateCw } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { downloadCsv } from '~/utils/csv-export';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Berkas yang Diberikan' });

const route = useRoute();
const { t } = useI18n();
const { usulanDetail, pending, fetchDetail, fetchBerkasDetail, fetchNaskahByBerkas } = useUsulanAksesBerkas();
const toast = useToast();

const extractErrorMessage = (err: any): string => {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) return beMessage.join(', ');
  if (typeof beMessage === 'string' && beMessage.trim()) return beMessage;
  return err?.message || 'Terjadi kesalahan';
};

const usulanId = computed(() => route.params.usulanId as string);

const berkasDetail = ref<any>(null);
const naskahList = ref<any[]>([]);
const naskahLoading = ref(false);
const search = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const total = ref(0);

// Multiple berkas support
const berkasItems = ref<any[]>([]);
const activeBerkasId = ref<string | null>(null);

const openRowsPerPage = ref(false);
const isRefreshing = ref(false);
const isExporting = ref(false);
function toggleRowsPerPage() { openRowsPerPage.value = !openRowsPerPage.value; }
function selectRowsPerPage(n: number) { perPage.value = n; openRowsPerPage.value = false; currentPage.value = 1; }
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) { if (el.contains(target)) return; }
  openRowsPerPage.value = false;
}

const handleRefresh = async () => {
  isRefreshing.value = true;
  try {
    await loadAll();
  } finally {
    isRefreshing.value = false;
  }
};

const exportData = () => {
  if (filteredNaskah.value.length === 0) {
    toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  isExporting.value = true;
  try {
    const headers = ['Perihal', 'Tipe', 'Nomor Surat', 'Tanggal'];
    const csvRows = filteredNaskah.value.map((n: any) => [
      n.perihal || '(Tanpa perihal)',
      n.naskahTipe || '-',
      n.nomorSurat || '-',
      formatDate(n.tanggalNaskah),
    ]);
    downloadCsv(`naskah-berkas_${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows);
    toast.add({ title: 'Berhasil', description: `${csvRows.length} data berhasil diexport`, color: 'success' });
  } catch (e) {
    console.error('Gagal export:', e);
    toast.add({ title: 'Gagal export', description: 'Silakan coba kembali.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: 'Penggunaan', to: '#' },
  { label: 'Pemberian', to: '/penggunaan/pemberian' },
  { label: berkasDetail.value?.judulBerkas || 'Berkas', to: '#' },
]);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const columns = [
  { key: 'perihal', label: 'Perihal' },
  { key: 'naskahTipe', label: 'Tipe' },
  { key: 'nomorSurat', label: 'Nomor Surat' },
  { key: 'tanggalNaskah', label: 'Tanggal' },
  { key: 'aksi', label: '' },
];

const loadAll = async () => {
  try {
    // 1. Fetch usulan detail untuk dapat selectedBerkas
    await fetchDetail(usulanId.value);
    const items = (usulanDetail.value as any)?.selectedBerkas || [];
    if (items.length === 0) {
      toast.add({ title: 'Tidak Ada Berkas', description: 'Usulan ini belum memiliki berkas.', color: 'error' });
      return;
    }

    // 2. Simpan semua berkas items untuk selector
    berkasItems.value = items;
    activeBerkasId.value = items[0].berkasId;

    // 3. Fetch detail berkas pertama
    berkasDetail.value = await fetchBerkasDetail(items[0].berkasId);

    // 4. Load naskah di dalam berkas
    await loadNaskah(items[0].berkasId);
  } catch (err: any) {
    toast.add({ title: 'Error', description: extractErrorMessage(err), color: 'error' });
  }
};

const switchBerkas = async (berkasId: string) => {
  activeBerkasId.value = berkasId;
  currentPage.value = 1;
  search.value = '';
  naskahLoading.value = true;
  try {
    berkasDetail.value = await fetchBerkasDetail(berkasId);
    await loadNaskah(berkasId);
  } catch (err: any) {
    toast.add({ title: 'Error', description: extractErrorMessage(err), color: 'error' });
  } finally {
    naskahLoading.value = false;
  }
};

const loadNaskah = async (berkasId?: string) => {
  const bid = berkasId || berkasDetail.value?.id;
  if (!bid) return;
  naskahLoading.value = true;
  try {
    naskahList.value = await fetchNaskahByBerkas(bid);
    total.value = naskahList.value.length;
  } catch (err: any) {
    toast.add({ title: 'Error', description: extractErrorMessage(err), color: 'error' });
  } finally {
    naskahLoading.value = false;
  }
};

const openNaskah = (row: any) => {
  navigateTo(`/penggunaan/pemberian/${usulanId.value}/naskah/${row.naskahId}`);
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const filteredNaskah = computed(() => {
  if (!search.value.trim()) return naskahList.value;
  const q = search.value.toLowerCase();
  return naskahList.value.filter(
    (n) => (n.perihal || '').toLowerCase().includes(q) || (n.nomorSurat || '').toLowerCase().includes(q),
  );
});

// Pagination: slice filteredNaskah berdasarkan currentPage dan perPage
const totalPages = computed(() => Math.ceil(filteredNaskah.value.length / perPage.value) || 1);

const paginatedNaskah = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredNaskah.value.slice(start, start + perPage.value);
});

watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage.value = 1; }, 400);
});

onMounted(() => {
  loadAll();
  document.addEventListener('click', handleDocumentClick);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5 min-h-screen px-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="berkasDetail?.judulBerkas || 'Berkas yang Diberikan'"
        :items="breadcrumbs"
      />
      <button
        @click="$router.back()"
        class="flex items-center gap-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors shrink-0"
      >
        <ChevronLeft class="w-4 h-4" /> Kembali
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending && !berkasDetail" class="space-y-5" aria-busy="true">
      <div class="h-56 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
      <div class="h-72 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>

    <template v-else-if="berkasDetail">
      <!-- Informasi Pengusul -->
      <div class="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <User class="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </span>
          <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Pengusul</h2>
        </div>
        <dl class="grid grid-cols-1 gap-x-8 px-5 sm:grid-cols-2">
          <div class="flex items-start gap-3 border-b border-gray-100 py-4 dark:border-gray-700">
            <User class="mt-0.5 h-4 w-4 text-gray-500" />
            <div><dt class="text-xs font-medium uppercase text-gray-500">Pengusul</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ berkasDetail.pengusulInfo?.nama || '-' }}</dd></div>
          </div>
          <div class="flex items-start gap-3 border-b border-gray-100 py-4 dark:border-gray-700">
            <Building2 class="mt-0.5 h-4 w-4 text-gray-500" />
            <div><dt class="text-xs font-medium uppercase text-gray-500">Divisi Pengusul</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ berkasDetail.divisiPengusulNama || '-' }}</dd></div>
          </div>
          <div class="flex items-start gap-3 border-b border-gray-100 py-4 dark:border-gray-700">
            <FileText class="mt-0.5 h-4 w-4 text-gray-500" />
            <div><dt class="text-xs font-medium uppercase text-gray-500">Judul Usulan</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ berkasDetail.judulUsulan || '-' }}</dd></div>
          </div>
          <div class="flex items-start gap-3 border-b border-gray-100 py-4 dark:border-gray-700">
            <Folder class="mt-0.5 h-4 w-4 text-gray-500" />
            <div><dt class="text-xs font-medium uppercase text-gray-500">Jenis Berkas</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ berkasDetail.jenisBerkas === 'AKTIF' ? 'Aktif' : 'Inaktif' }}</dd></div>
          </div>
        </dl>
      </div>

      <!-- Berkas Selector (jika ada multiple berkas) -->
      <div v-if="berkasItems.length > 1" class="mt-5 flex items-center gap-3">
        <span class="text-xs font-medium uppercase text-gray-500">Berkas:</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="b in berkasItems"
            :key="b.berkasId"
            type="button"
            @click="switchBerkas(b.berkasId)"
            :class="[
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border',
              activeBerkasId === b.berkasId
                ? 'border-primary bg-primary/10 text-primary dark:text-primary-400'
                : 'border-gray-200 bg-white text-gray-600 hover:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400'
            ]"
          >
            {{ b.judulBerkas || b.berkasId }}
          </button>
        </div>
      </div>

      <!-- Info Berkas Section -->
      <div class="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <Folder class="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </span>
          <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Berkas</h2>
        </div>
        <dl class="grid grid-cols-1 gap-x-8 px-5 sm:grid-cols-2">
          <div class="flex items-start gap-3 border-b border-gray-100 py-4 dark:border-gray-700">
            <FileText class="mt-0.5 h-4 w-4 text-gray-500" />
            <div><dt class="text-xs font-medium uppercase text-gray-500">Judul Berkas</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ berkasDetail.judulBerkas }}</dd></div>
          </div>
          <div class="flex items-start gap-3 border-b border-gray-100 py-4 dark:border-gray-700">
            <Folder class="mt-0.5 h-4 w-4 text-gray-500" />
            <div><dt class="text-xs font-medium uppercase text-gray-500">Kode/Klasifikasi</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ berkasDetail.klasifikasi }} — {{ berkasDetail.klasifikasiTeks }}</dd></div>
          </div>
          <div class="flex items-start gap-3 border-b border-gray-100 py-4 dark:border-gray-700">
            <Building2 class="mt-0.5 h-4 w-4 text-gray-500" />
            <div><dt class="text-xs font-medium uppercase text-gray-500">Divisi Pemberi</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ berkasDetail.divisiPemberiNama }}</dd></div>
          </div>
          <div class="flex items-start gap-3 border-b border-gray-100 py-4 dark:border-gray-700">
            <User class="mt-0.5 h-4 w-4 text-gray-500" />
            <div><dt class="text-xs font-medium uppercase text-gray-500">EVP Pemberi</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ berkasDetail.evpPemberiNama }}</dd></div>
          </div>
          <div class="flex items-start gap-3 border-b border-gray-100 py-4 dark:border-gray-700">
            <Key class="mt-0.5 h-4 w-4 text-gray-500" />
            <div><dt class="text-xs font-medium uppercase text-gray-500">Jenis Akses</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ berkasDetail.permissions?.join(', ') }}</dd></div>
          </div>
          <div class="flex items-start gap-3 border-b border-gray-100 py-4 dark:border-gray-700">
            <Clock class="mt-0.5 h-4 w-4 text-gray-500" />
            <div><dt class="text-xs font-medium uppercase text-gray-500">Periode Akses</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(berkasDetail.tanggalMulai) }} — {{ formatDate(berkasDetail.tanggalSelesai) }}</dd></div>
          </div>
        </dl>
        <div v-if="berkasDetail.tujuanAkses" class="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <p class="mb-1 text-xs font-medium uppercase text-gray-500">Tujuan Akses</p>
          <p class="text-sm text-gray-800 dark:text-gray-200">{{ berkasDetail.tujuanAkses }}</p>
        </div>
      </div>

      <!-- Daftar Naskah -->
      <div class="mt-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
        <!-- Toolbar -->
        <div class="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center gap-3 w-full">
          <div class="flex items-center gap-3 flex-wrap flex-1">
            <div class="relative" data-custom-dropdown>
              <button type="button" @click.stop="toggleRowsPerPage"
                class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[70px] justify-between">
                <span>{{ perPage }}</span>
                <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200" :class="{ 'rotate-180': openRowsPerPage }" />
              </button>
              <Transition name="filter-dd">
                <div v-if="openRowsPerPage" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[80px]">
                  <button v-for="n in [10, 25, 50]" :key="n" type="button" @click.stop="selectRowsPerPage(n)"
                    :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                      perPage === n ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']">
                    {{ n }}
                  </button>
                </div>
              </Transition>
            </div>
            <div class="relative flex-1 min-w-[180px]">
              <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input v-model="search" type="text" placeholder="Cari Naskah…"
                class="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition" />
            </div>
          </div>
          <!-- Action buttons -->
          <div class="flex shrink-0 items-center gap-2">
            <!-- Refresh -->
            <button
              @click="handleRefresh"
              :disabled="isRefreshing"
              class="shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              title="Refresh"
              aria-label="Refresh"
            >
              <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
              Refresh
            </button>
            <!-- Export -->
            <button
              @click="exportData"
              :disabled="isExporting"
              class="shrink-0 flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-primary dark:bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <UIcon
                v-if="isExporting"
                name="i-lucide-loader-circle"
                class="w-3.5 h-3.5 animate-spin"
              />
              <UIcon v-else name="i-lucide-download" class="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        <DataTable :columns="columns" :rows="paginatedNaskah" :loading="naskahLoading"
          header-class="bg-primary dark:bg-primary-700 text-white text-left"
          body-class="divide-y divide-gray-100 dark:divide-gray-700"
          row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          empty-message="Belum ada naskah di dalam berkas ini.">
          <template #cell-perihal="{ row }">
            <div class="flex items-start gap-2">
              <FileText class="mt-0.5 size-4 shrink-0 text-gray-400" />
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ row.perihal || '(Tanpa perihal)' }}</span>
            </div>
          </template>
          <template #cell-naskahTipe="{ row }">
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">{{ row.naskahTipe }}</span>
          </template>
          <template #cell-nomorSurat="{ row }">
            <span class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ row.nomorSurat || '-' }}</span>
          </template>
          <template #cell-tanggalNaskah="{ row }">
            <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.tanggalNaskah) }}</span>
          </template>
          <template #cell-aksi="{ row }">
            <button @click="openNaskah(row)"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40"
              title="Lihat Naskah">
              <Eye class="size-4" /> Lihat Naskah
            </button>
          </template>
        </DataTable>

        <!-- Pagination -->
        <DataPagination
          v-model:current-page="currentPage"
          :total-items="filteredNaskah.length"
          :per-page="perPage"
        />
      </div>
    </template>
  </div>
</template>