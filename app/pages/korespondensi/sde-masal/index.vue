<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="SDE Masal" :items="items" />
    </div>

    <!-- Tombol Kirim Naskah Massal (untuk item MENUNGGU) -->
    <div v-if="(summary?.menunggu ?? 0) > 0" class="mb-4 flex items-center gap-3">
      <button
        @click="handleGenerateNaskah"
        :disabled="generatingNaskah"
        class="h-10 px-5 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        <UIcon v-if="generatingNaskah" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
        <UIcon v-else name="i-lucide-send" class="w-4 h-4" />
        Kirim Naskah Massal ({{ summary?.menunggu }} item)
      </button>
      <span class="text-xs text-gray-400">Buat naskah SDE individual untuk semua item menunggu</span>
    </div>

    <!-- Daftar SDE Masal: filter, tabel, dan pagination dalam satu card. -->
    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <!-- Filter Bar -->
      <div class="flex flex-row items-center gap-2 border-b border-gray-300 p-4 dark:border-gray-700">
      <select v-model="f.limit" class="h-10 w-20 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition-colors focus:border-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" @change="reload">
        <option :value="10">10</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select>
      <select v-model="f.statusVerifikasi" class="h-10 w-40 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition-colors focus:border-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" @change="reload">
        <option value="">Semua Status</option>
        <option value="MENUNGGU">Menunggu</option>
        <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
        <option value="TERKIRIM">Terkirim</option>
        <option value="TERVERIFIKASI">Terverifikasi</option>
        <option value="DITOLAK">Ditolak</option>
        <option value="GAGAL">Gagal</option>
      </select>
      <select v-model="f.klasifikasiId" class="h-10 w-48 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition-colors focus:border-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" @change="reload">
        <option value="">Semua Klasifikasi</option>
        <option v-for="klasifikasi in klasifikasiOptions" :key="klasifikasi.id" :value="klasifikasi.id">{{ klasifikasi.klasifikasi }} - {{ klasifikasi.klasifikasi_text }}</option>
      </select>
      <select v-model="f.tahun" class="h-10 w-36 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none transition-colors focus:border-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" @change="reload">
        <option value="">Semua Tahun</option>
        <option v-for="tahun in tahunOptions" :key="tahun" :value="tahun">{{ tahun }}</option>
      </select>
      <button @click="resetFilter" class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" title="Reset filter"><UIcon name="i-lucide-rotate-ccw" class="size-5" /></button>
      <div class="relative min-w-0 flex-1">
        <UIcon name="i-lucide-search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input v-model="f.search" type="text" placeholder="Cari Berkas..." class="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary-400 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" @keydown.enter="reload" />
      </div>
      <button @click="exportData" :disabled="exporting" class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-400 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"><UIcon :name="exporting ? 'i-lucide-loader-2' : 'i-lucide-download'" :class="['size-4', exporting && 'animate-spin']" />Export</button>
      </div>

      <!-- Table -->
      <div>
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-10">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-[#457fb6]" />
      </div>

      <!-- Empty -->
      <div v-else-if="!sdeItems || sdeItems.length === 0" class="text-center py-10">
        <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p class="text-sm text-gray-400">Belum ada data SDE Masal</p>
      </div>

      <!-- Table Content -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-primary text-left text-white dark:bg-primary-700">
              <th class="px-4 py-3 font-semibold whitespace-nowrap">Perihal</th>
              <th class="px-4 py-3 font-semibold whitespace-nowrap">Tertuju</th>
              <th class="px-4 py-3 font-semibold whitespace-nowrap">Klasifikasi</th>
              <th class="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
              <th class="px-4 py-3 font-semibold whitespace-nowrap">Naskah</th>
              <th class="px-4 py-3 text-center font-semibold whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in sdeItems"
              :key="item.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <td class="px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 max-w-[200px] truncate" :title="item.perihal">{{ item.perihal || '-' }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[150px] truncate" :title="item.tertuju">{{ item.tertuju || '-' }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[180px] truncate" :title="item.klasifikasiName || ''">{{ item.klasifikasiName || '-' }}</td>
              <td class="px-4 py-2.5">
                <span :class="statusBadge(item.statusVerifikasi)">{{ statusLabel(item.statusVerifikasi) }}</span>
              </td>
              <td class="px-4 py-2.5 text-xs whitespace-nowrap">
                <div class="flex flex-col gap-1">
                  <NuxtLink
                    v-if="item.naskahId"
                    :to="`/korespondensi/sde-masal/${item.naskahId}`"
                    class="text-[#457fb6] hover:underline flex items-center gap-1"
                  >
                    <UIcon name="i-lucide-file-text" class="w-3.5 h-3.5" />
                    Detail Surat
                  </NuxtLink>
                  <NuxtLink
                    v-if="item.parentNaskahId"
                    :to="`/korespondensi/kotak-masuk/${item.parentNaskahId}`"
                    class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <UIcon name="i-lucide-inbox" class="w-3.5 h-3.5" />
                    Detail Disposisi
                  </NuxtLink>
                  <span v-if="!item.naskahId && !item.parentNaskahId" class="text-gray-400">-</span>
                </div>
              </td>
              <td class="px-4 py-2.5">
                <div class="flex items-center justify-center gap-1">
                  <button @click="showDetail(item)" class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-[#457fb6] transition-colors" title="Lihat Detail">
                    <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                  </button>
                  <button @click="showUploadLampiran(item)" class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-[#457fb6] transition-colors" title="Upload Lampiran">
                    <UIcon name="i-lucide-paperclip" class="w-4 h-4" />
                  </button>
                  <button @click="confirmDelete(item)" class="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-500 transition-colors" title="Hapus Data">
                    <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="meta && meta.total > 0"
        class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-3"
      >
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }}
            dari <span class="font-medium text-gray-700 dark:text-gray-300">{{ meta.total }}</span> SDE Masal
          </span>
        </div>
        <!-- Page buttons -->
        <div v-if="meta.totalPages > 1" class="flex items-center gap-1">
          <button
            :disabled="meta.page <= 1"
            @click="goPage(meta.page - 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" /> Prev
          </button>
          <span class="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ meta.page }} / {{ meta.totalPages }}
          </span>
          <button
            :disabled="meta.page >= meta.totalPages"
            @click="goPage(meta.page + 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="detailModal && selectedItem" class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-10 sm:pt-20" @click.self="detailModal = false">
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col">
          <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Detail SDE Masal</h3>
            <button @click="detailModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="overflow-y-auto flex-1 bg-gray-100 dark:bg-gray-900 p-4">
            <div class="mx-auto w-full max-w-[794px] bg-white shadow-sm">
              <SdeMasalLetterPreview
                :konsep="detailKonsep"
                :penerima-list="detailPenerimaList"
                :template="detailTemplate"
                :penerima-index="0"
              />
            </div>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex justify-end">
            <button @click="detailModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Tutup</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Upload Lampiran Modal -->
    <Teleport to="body">
      <div v-if="lampiranModal && selectedItem" class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-10 sm:pt-20" @click.self="lampiranModal = false">
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
          <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Upload Lampiran</h3>
            <button @click="lampiranModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="overflow-y-auto px-5 py-4 space-y-3 flex-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">Unggah file lampiran untuk: <strong class="text-gray-700 dark:text-gray-200">{{ selectedItem.tertuju }}</strong></p>
            <div
              @click="lampiranInput?.click()"
              class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer border-gray-300 dark:border-gray-600 hover:border-[#457fb6] transition-colors"
            >
              <input ref="lampiranInput" type="file" class="hidden" @change="onLampiranSelect" />
              <UIcon name="i-lucide-upload" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p v-if="!lampiranFile" class="text-sm text-gray-500">Klik untuk pilih file lampiran</p>
              <p v-else class="text-sm text-[#457fb6] font-medium">{{ lampiranFile.name }} ({{ (lampiranFile.size / 1024).toFixed(1) }} KB)</p>
            </div>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex justify-end gap-2">
            <button @click="lampiranModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button @click="submitLampiran" :disabled="!lampiranFile || lampiranUploading" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 flex items-center gap-1.5">
              <UIcon v-if="lampiranUploading" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Upload
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <div v-if="deleteModal && selectedItem" class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-10 sm:pt-20" @click.self="deleteModal = false">
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col">
          <div class="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <div class="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Hapus</h3>
          </div>
          <div class="px-5 py-4">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              Yakin ingin menghapus data SDE Masal untuk <strong class="text-gray-900 dark:text-white">{{ selectedItem.tertuju }}</strong>?
            </p>
            <p class="text-xs text-gray-400 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex justify-end gap-2">
            <button @click="deleteModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button @click="submitDelete" :disabled="deleteSubmitting" class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 flex items-center gap-1.5">
              <UIcon v-if="deleteSubmitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useSdeMasal } from '~/composables/useSdeMasal';
import { useToast } from '#imports';
import type { SdeMasalItem, SdeMasalFilter, SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';
import type { Klasifikasi } from '~/types/klasifikasi';
import SdeMasalLetterPreview from '~/components/korespondensi/sde-masal/SdeMasalLetterPreview.vue';

definePageMeta({ middleware: ['auth', 'sde-masal-bod'] });

const toast = useToast();
const route = useRoute();
const router = useRouter();
const { apiGet } = useApi();
const { getKlasifikasiList } = useKlasifikasi();
const { items: sdeItems, summary, loading, meta, fetchList, fetchSummary, deleteItem, uploadLampiran, generateNaskah } = useSdeMasal();

const items = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Korespondensi', to: '/korespondensi/kotak-masuk' },
  { label: 'SDE Masal', to: '/korespondensi/sde-masal' },
];

const f = reactive<SdeMasalFilter>({
  search: '',
  statusVerifikasi: '',
  klasifikasiId: '',
  tahun: '',
  jenisTemplate: '',
  page: 1,
  limit: 10,
});
const klasifikasiOptions = ref<Klasifikasi[]>([]);
const exporting = ref(false);
const tahunOptions = Array.from({ length: 5 }, (_, index) => String(new Date().getFullYear() - index));

const selectedItem = ref<SdeMasalItem | null>(null);
const detailModal = ref(false);
const lampiranModal = ref(false);
const deleteModal = ref(false);
const lampiranFile = ref<File | null>(null);
const lampiranUploading = ref(false);
const lampiranInput = ref<HTMLInputElement | null>(null);
const deleteSubmitting = ref(false);
const generatingNaskah = ref(false);
const detailQueryHandled = ref(false);

// --- Detail preview (SdeMasalLetterPreview) ---
const detailKonsep = computed<SdeMasalConcept | null>(() => {
  const s = selectedItem.value;
  if (!s) return null;
  return {
    tanggalKonsep: s.tanggalKonsep || '',
    klasifikasiId: s.klasifikasiId || '',
    klasifikasiName: s.klasifikasiName || '',
    pengirimId: s.pengirimId || '',
    pengirimName: s.pengirimName || '',
    sifat: s.sifatSurat || 'biasa',
    perihal: s.perihal,
    parentNaskahId: s.parentNaskahId || undefined,
  };
});

const detailPenerimaList = computed<SdeMasalPenerima[]>(() => {
  const s = selectedItem.value;
  if (!s) return [];
  return [{
    no: 1,
    tertuju: s.tertuju,
    alamat: s.alamat,
    kota: s.kota,
    kodePos: s.kodePos,
    jabatanPenerima: s.jabatanPenerima,
    perihal: s.perihal,
    idTertuju: s.idTertuju || undefined,
    email: s.email || undefined,
    tembusan: s.tembusan || undefined,
    emailTertuju: s.emailTertuju || undefined,
    emailCc: s.emailCc || undefined,
    emailBcc: s.emailBcc || undefined,
    jumlahTagihanIdr: s.jumlahTagihanIdr || undefined,
    jumlahTagihanUsd: s.jumlahTagihanUsd || undefined,
    namaCro: s.namaCro || undefined,
    emailCro: s.emailCro || undefined,
    jabatanSigner: s.jabatanSigner || undefined,
    namaSigner: s.namaSigner || undefined,
    jumlahLampiran: s.jumlahLampiran || undefined,
    alamatPenerima: s.alamatPenerima || undefined,
    panggilanPenerima: s.panggilanPenerima || undefined,
    nominalRupiah: s.nominalRupiah || undefined,
    nominalDolar: s.nominalDolar || undefined,
    tembusan1: s.tembusan1 || undefined,
    tembusan2: s.tembusan2 || undefined,
    isValid: true,
  }];
});

const detailTemplate = computed<SdeMasalTemplate | null>(() => {
  const s = selectedItem.value;
  if (!s) return null;
  return {
    skema: s.skemaTemplate || s.jenisTemplate || 'DINAMIS',
    versi: s.versiTemplate || 'v1',
    konten: s.isiRingkasan || '',
  };
});

// --- Data loading ---
const loadData = async () => {
  await Promise.all([fetchList({ ...f }), fetchSummary()]);
  openDetailFromQuery();
};

const reload = () => {
  f.page = 1;
  loadData();
};

const resetFilter = () => {
  f.search = '';
  f.statusVerifikasi = '';
  f.klasifikasiId = '';
  f.tahun = '';
  f.jenisTemplate = '';
  f.page = 1;
  loadData();
};

const goPage = (page: number) => {
  f.page = page;
  loadData();
};

const exportData = async () => {
  exporting.value = true;
  try {
    const response: any = await apiGet('/sde-masal', { params: { ...f, page: 1, limit: 200 } });
    const records: SdeMasalItem[] = response?.data ?? [];
    if (!records.length) {
      toast.add({ title: 'Tidak ada data', description: 'Tidak ada SDE Massal untuk diekspor.', color: 'warning' });
      return;
    }
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(records.map((item) => ({
      Perihal: item.perihal,
      Tertuju: item.tertuju,
      Klasifikasi: item.klasifikasiName || '-',
      Status: statusLabel(item.statusVerifikasi),
      'Nomor Surat': item.nomorSurat || '-',
      Pengirim: item.pengirimName || '-',
      'Tanggal Konsep': item.tanggalKonsep || '-',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SDE Massal');
    XLSX.writeFile(workbook, 'sde-massal.xlsx');
  } catch (error: any) {
    toast.add({ title: 'Gagal export', description: error?.message || 'Data SDE Massal tidak dapat diekspor.', color: 'error' });
  } finally {
    exporting.value = false;
  }
};

// --- Actions ---
const showDetail = (item: SdeMasalItem) => {
  selectedItem.value = item;
  detailModal.value = true;
};

const openDetailFromQuery = () => {
  if (detailQueryHandled.value) return;
  const detailId = Array.isArray(route.query.detail) ? route.query.detail[0] : route.query.detail;
  if (!detailId) return;

  const item = sdeItems.value.find((row) => row.id === detailId || row.naskahId === detailId);
  if (!item) return;

  detailQueryHandled.value = true;
  showDetail(item);
  router.replace({ path: route.path, query: { ...route.query, detail: undefined } });
};

const showUploadLampiran = (item: SdeMasalItem) => {
  selectedItem.value = item;
  lampiranFile.value = null;
  lampiranModal.value = true;
};

const onLampiranSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    lampiranFile.value = target.files[0];
  }
};

const submitLampiran = async () => {
  if (!selectedItem.value || !lampiranFile.value) return;
  lampiranUploading.value = true;
  try {
    await uploadLampiran(selectedItem.value.id, lampiranFile.value);
    lampiranModal.value = false;
    toast.add({ title: 'Berhasil', description: 'Lampiran berhasil diupload', color: 'success' });
    loadData();
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal upload lampiran', color: 'error' });
  } finally {
    lampiranUploading.value = false;
  }
};

const confirmDelete = (item: SdeMasalItem) => {
  selectedItem.value = item;
  deleteModal.value = true;
};

const submitDelete = async () => {
  if (!selectedItem.value) return;
  deleteSubmitting.value = true;
  try {
    await deleteItem(selectedItem.value.id);
    deleteModal.value = false;
    toast.add({ title: 'Berhasil', description: 'Data berhasil dihapus', color: 'success' });
    loadData();
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal menghapus data', color: 'error' });
  } finally {
    deleteSubmitting.value = false;
  }
};

const statusLabel = (s: string) => {
  const m: Record<string, string> = { MENUNGGU: 'Menunggu', MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi', TERKIRIM: 'Terkirim', TERVERIFIKASI: 'Terverifikasi', DITOLAK: 'Ditolak', GAGAL: 'Gagal' };
  return m[s] || s || '-';
};

const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    MENUNGGU: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 font-medium whitespace-nowrap',
    MENUNGGU_VERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium whitespace-nowrap',
    TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap',
    TERVERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium whitespace-nowrap',
    DITOLAK: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium whitespace-nowrap',
    GAGAL: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium whitespace-nowrap',
  };
  return m[s] || m.MENUNGGU;
};

onMounted(() => {
  loadData();
  getKlasifikasiList().then((data) => { klasifikasiOptions.value = data; });
});

// --- Generate Naskah Massal ---
const handleGenerateNaskah = async () => {
  generatingNaskah.value = true;
  try {
    const result = await generateNaskah();
    toast.add({
      title: 'Berhasil',
      description: `${result?.success ?? 0} naskah SDE berhasil dibuat, ${result?.failed ?? 0} gagal`,
      color: 'success',
    });
    loadData();
  } catch (e: any) {
    toast.add({
      title: 'Gagal',
      description: e?.message || 'Gagal generate naskah',
      color: 'error',
    });
  } finally {
    generatingNaskah.value = false;
  }
};
</script>
