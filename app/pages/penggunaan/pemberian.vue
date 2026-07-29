<script setup lang="ts">
// Pemberian — list berkas yang sudah diberikan akses, klik berkas → lihat naskah di dalamnya
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { FileText, Clock, CheckCircle2, XCircle, ChevronLeft, Eye, Download, Folder } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Pemberian Akses Berkas' });

const { t } = useI18n();
const { fetchMyEntitlements, fetchNaskahByBerkas } = useUsulanAksesBerkas();
const toast = useToast();

const extractErrorMessage = (err: any): string => {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) return beMessage.join(', ');
  if (typeof beMessage === 'string' && beMessage.trim()) return beMessage;
  return err?.message || 'Terjadi kesalahan';
};

interface BerkasEntitlement {
  berkasId: string;
  judulBerkas: string;
  klasifikasi: string | null;
  klasifikasiTeks: string | null;
  lokasi: string | null;
  permissions: string[];
  tanggalMulai: string;
  tanggalSelesai: string;
  isExpired: boolean;
  nomorUsulanTerbaru: string | null;
  isPenerimaTambahan: boolean;
  entitlementCount: number;
}

interface NaskahItem {
  id: string;
  naskahId: string;
  berkasId: string;
  naskahTipe: string;
  sumber: string;
  perihal: string | null;
  nomorSurat: string | null;
  tanggalNaskah: string | null;
  urutan: number;
  jenis: string | null;
  sifat: string | null;
  finalPdf: string | null;
  status: string | null;
  permissions: string[];
}

// State
const berkasList = ref<BerkasEntitlement[]>([]);
const loading = ref(false);
const searchQuery = ref('');

// State untuk naskah di dalam berkas
const selectedBerkas = ref<BerkasEntitlement | null>(null);
const naskahList = ref<NaskahItem[]>([]);
const naskahLoading = ref(false);

const breadcrumbs = computed(() => {
  const crumbs = [
    { label: t('beranda') || 'Beranda', to: '/beranda' },
    { label: 'Penggunaan', to: '#' },
    { label: 'Pemberian', to: '/penggunaan/pemberian' },
  ];
  if (selectedBerkas.value) {
    crumbs.push({ label: selectedBerkas.value.judulBerkas, to: '#' });
  }
  return crumbs;
});

const filteredBerkas = computed(() => {
  if (!searchQuery.value.trim()) return berkasList.value;
  const q = searchQuery.value.toLowerCase();
  return berkasList.value.filter(
    (b) =>
      (b.judulBerkas || '').toLowerCase().includes(q) ||
      (b.klasifikasiTeks || '').toLowerCase().includes(q) ||
      (b.klasifikasi || '').toLowerCase().includes(q) ||
      (b.nomorUsulanTerbaru || '').toLowerCase().includes(q),
  );
});

const activeBerkas = computed(() => filteredBerkas.value.filter((b) => !b.isExpired));
const expiredBerkas = computed(() => filteredBerkas.value.filter((b) => b.isExpired));

const loadBerkas = async () => {
  loading.value = true;
  try {
    berkasList.value = await fetchMyEntitlements();
  } catch (err: any) {
    toast.add({ title: 'Error', description: extractErrorMessage(err), color: 'error' });
  } finally {
    loading.value = false;
  }
};

const openBerkas = async (berkas: BerkasEntitlement) => {
  if (berkas.isExpired) {
    toast.add({ title: 'Akses Kadaluarsa', description: 'Akses ke berkas ini sudah berakhir.', color: 'error' });
    return;
  }
  selectedBerkas.value = berkas;
  naskahLoading.value = true;
  naskahList.value = [];
  try {
    naskahList.value = await fetchNaskahByBerkas(berkas.berkasId);
  } catch (err: any) {
    toast.add({ title: 'Gagal Memuat Naskah', description: extractErrorMessage(err), color: 'error' });
  } finally {
    naskahLoading.value = false;
  }
};

const backToBerkas = () => {
  selectedBerkas.value = null;
  naskahList.value = [];
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const hasPermission = (perms: string[], action: string) => {
  return perms.some((p) => p.toUpperCase() === action.toUpperCase());
};

const openNaskahPdf = (naskah: NaskahItem) => {
  if (naskah.finalPdf) {
    window.open(naskah.finalPdf, '_blank');
  } else {
    toast.add({ title: 'PDF Tidak Tersedia', description: 'Naskah ini tidak memiliki file PDF.', color: 'error' });
  }
};

const berkasColumns = [
  { key: 'judulBerkas', label: 'Judul Berkas' },
  { key: 'klasifikasi', label: 'Klasifikasi' },
  { key: 'permissions', label: 'Akses' },
  { key: 'periode', label: 'Periode' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi' },
];

const naskahColumns = [
  { key: 'perihal', label: 'Perihal' },
  { key: 'naskahTipe', label: 'Tipe' },
  { key: 'nomorSurat', label: 'Nomor Surat' },
  { key: 'tanggalNaskah', label: 'Tanggal' },
  { key: 'aksi', label: 'Aksi' },
];

onMounted(() => {
  loadBerkas();
});
</script>

<template>
  <div class="bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5 min-h-screen">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {{ selectedBerkas ? selectedBerkas.judulBerkas : 'Pemberian Akses Berkas' }}
        </h1>
      </template>
    </PageHeader>

    <!-- ════════ VIEW: LIST BERKAS ════════ -->
    <div v-if="!selectedBerkas">
      <!-- Search -->
      <div class="mb-4 flex items-center gap-3">
        <div class="relative min-w-[200px] flex-1">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
          <input v-model="searchQuery" type="text" placeholder="Cari judul berkas, klasifikasi, nomor usulan…"
            class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-500 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400 dark:focus:bg-gray-600" />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
        <span class="ml-3 text-sm text-gray-500">Memuat akses berkas…</span>
      </div>

      <!-- Empty -->
      <div v-else-if="berkasList.length === 0" class="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 dark:border-gray-700 dark:bg-gray-800">
        <span class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
          <UIcon name="i-lucide-folder-check" class="size-8 text-gray-400" />
        </span>
        <h2 class="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Belum Ada Akses Berkas</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
          Akses berkas yang sudah diterbitkan akan muncul di sini.
        </p>
      </div>

      <!-- Active Berkas -->
      <div v-else class="space-y-6">
        <div v-if="activeBerkas.length > 0">
          <div class="mb-3 flex items-center gap-2">
            <CheckCircle2 class="size-5 text-green-600" />
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Akses Aktif ({{ activeBerkas.length }})</h2>
          </div>
          <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <DataTable :columns="berkasColumns" :rows="activeBerkas"
              header-class="bg-primary dark:bg-primary-700 text-left text-white"
              body-class="divide-y divide-gray-100 dark:divide-gray-700"
              row-class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              empty-message="Tidak ada akses aktif.">
              <template #cell-judulBerkas="{ row }">
                <div class="flex items-start gap-2">
                  <Folder class="mt-0.5 size-4 shrink-0 text-primary-500" />
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ row.judulBerkas }}</p>
                    <p v-if="row.nomorUsulanTerbaru" class="font-mono text-xs text-gray-400">{{ row.nomorUsulanTerbaru }}</p>
                    <p v-if="row.isPenerimaTambahan" class="text-xs text-blue-500">Penerima Tambahan</p>
                  </div>
                </div>
              </template>
              <template #cell-klasifikasi="{ row }">
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ row.klasifikasiTeks || row.klasifikasi || '-' }}</span>
              </template>
              <template #cell-permissions="{ row }">
                <div class="flex flex-wrap gap-1">
                  <span v-for="perm in row.permissions" :key="perm"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {{ perm }}
                  </span>
                </div>
              </template>
              <template #cell-periode="{ row }">
                <div class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <Clock class="size-3" />
                  {{ formatDate(row.tanggalMulai) }} — {{ formatDate(row.tanggalSelesai) }}
                </div>
              </template>
              <template #cell-status="{ row }">
                <span class="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 class="size-3" /> Aktif
                </span>
              </template>
              <template #cell-aksi="{ row }">
                <button @click.stop="openBerkas(row)"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40"
                  title="Lihat Naskah di dalam Berkas">
                  <Eye class="size-4" /> Lihat Naskah
                </button>
              </template>
            </DataTable>
          </div>
        </div>

        <!-- Expired Berkas -->
        <div v-if="expiredBerkas.length > 0">
          <div class="mb-3 flex items-center gap-2">
            <XCircle class="size-5 text-gray-400" />
            <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Akses Kadaluarsa ({{ expiredBerkas.length }})</h2>
          </div>
          <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <DataTable :columns="berkasColumns" :rows="expiredBerkas"
              header-class="bg-gray-100 dark:bg-gray-700 text-left text-gray-600 dark:text-gray-300"
              body-class="divide-y divide-gray-100 dark:divide-gray-700"
              row-class="opacity-60"
              empty-message="Tidak ada akses kadaluarsa.">
              <template #cell-judulBerkas="{ row }">
                <div class="flex items-start gap-2">
                  <Folder class="mt-0.5 size-4 shrink-0 text-gray-400" />
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ row.judulBerkas }}</p>
                    <p v-if="row.nomorUsulanTerbaru" class="font-mono text-xs text-gray-400">{{ row.nomorUsulanTerbaru }}</p>
                  </div>
                </div>
              </template>
              <template #cell-klasifikasi="{ row }">
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ row.klasifikasiTeks || row.klasifikasi || '-' }}</span>
              </template>
              <template #cell-permissions="{ row }">
                <div class="flex flex-wrap gap-1">
                  <span v-for="perm in row.permissions" :key="perm"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    {{ perm }}
                  </span>
                </div>
              </template>
              <template #cell-periode="{ row }">
                <div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock class="size-3" />
                  {{ formatDate(row.tanggalMulai) }} — {{ formatDate(row.tanggalSelesai) }}
                </div>
              </template>
              <template #cell-status="{ row }">
                <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  <XCircle class="size-3" /> Kadaluarsa
                </span>
              </template>
              <template #cell-aksi="{ row }">
                <span class="text-xs text-gray-400">Akses berakhir</span>
              </template>
            </DataTable>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════ VIEW: LIST NASKAH DI DALAM BERKAS ════════ -->
    <div v-else class="mt-4">
      <!-- Back button -->
      <button @click="backToBerkas"
        class="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
        <ChevronLeft class="size-4" /> Kembali ke Daftar Berkas
      </button>

      <!-- Berkas info -->
      <div class="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-start gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <Folder class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div class="flex-1">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedBerkas.judulBerkas }}</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ selectedBerkas.klasifikasiTeks || selectedBerkas.klasifikasi }}
              <span v-if="selectedBerkas.lokasi"> · {{ selectedBerkas.lokasi }}</span>
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <div class="flex flex-wrap gap-1">
                <span v-for="perm in selectedBerkas.permissions" :key="perm"
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {{ perm }}
                </span>
              </div>
              <span class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock class="size-3" /> {{ formatDate(selectedBerkas.tanggalMulai) }} — {{ formatDate(selectedBerkas.tanggalSelesai) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading naskah -->
      <div v-if="naskahLoading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-primary-500" />
        <span class="ml-3 text-sm text-gray-500">Memuat naskah…</span>
      </div>

      <!-- Empty naskah -->
      <div v-else-if="naskahList.length === 0" class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 dark:border-gray-700 dark:bg-gray-800">
        <span class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
          <FileText class="size-7 text-gray-400" />
        </span>
        <h2 class="mt-3 text-base font-medium text-gray-700 dark:text-gray-300">Tidak Ada Naskah</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Berkas ini belum berisi naskah.</p>
      </div>

      <!-- List Naskah -->
      <div v-else class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <DataTable :columns="naskahColumns" :rows="naskahList"
          header-class="bg-primary dark:bg-primary-700 text-left text-white"
          body-class="divide-y divide-gray-100 dark:divide-gray-700"
          row-class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          empty-message="Tidak ada naskah.">
          <template #cell-perihal="{ row }">
            <div class="flex items-start gap-2">
              <FileText class="mt-0.5 size-4 shrink-0 text-gray-400" />
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ row.perihal || '(Tanpa perihal)' }}</span>
            </div>
          </template>
          <template #cell-naskahTipe="{ row }">
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              {{ row.naskahTipe }}
            </span>
          </template>
          <template #cell-nomorSurat="{ row }">
            <span class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ row.nomorSurat || '-' }}</span>
          </template>
          <template #cell-tanggalNaskah="{ row }">
            <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(row.tanggalNaskah) }}</span>
          </template>
          <template #cell-aksi="{ row }">
            <div class="flex items-center gap-2">
              <button v-if="row.finalPdf" @click="openNaskahPdf(row)"
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40"
                title="Buka PDF">
                <Eye class="size-4" /> Lihat
              </button>
              <button v-if="row.finalPdf && hasPermission(row.permissions, 'UNDUH')"
                @click="openNaskahPdf(row)"
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Download PDF">
                <Download class="size-4" /> Download
              </button>
              <span v-if="!row.finalPdf" class="text-xs text-gray-400">PDF tidak tersedia</span>
            </div>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>