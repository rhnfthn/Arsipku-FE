<template>
  <div class="mt-4">
    <h4 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
      Preview Data Penerima
    </h4>
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              class="whitespace-nowrap border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
            >
              No
            </th>
            <th
              v-for="column in columns"
              :key="column"
              class="whitespace-nowrap border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
            >
              {{ column }}
            </th>
            <th
              class="border-b border-gray-200 px-3 py-2 text-center font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
            >
              Status
            </th>
            <th
              class="border-b border-gray-200 px-3 py-2 text-center font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
            >
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, idx) in paginatedItems"
            :key="item.no"
            class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
            :class="{ 'bg-red-50 dark:bg-red-950/20': !item.isValid }"
          >
            <td
              class="border-b border-gray-100 px-3 py-2 text-gray-500 dark:border-gray-700 dark:text-gray-400"
            >
              {{ item.no }}
            </td>
            <td
              v-for="column in columns"
              :key="`${item.no}-${column}`"
              class="max-w-64 border-b border-gray-100 px-3 py-2 text-gray-700 dark:border-gray-700 dark:text-gray-300"
              :class="{ 'font-medium text-gray-900 dark:text-white': column === 'perihal' }"
            >
              {{ getValue(item, column) || '-' }}
            </td>
            <td class="border-b border-gray-100 px-3 py-2 text-center dark:border-gray-700">
              <span
                v-if="item.isValid"
                class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300"
                ><UIcon name="i-lucide-check-circle" class="size-3" />Valid</span
              >
              <span
                v-else
                class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
                :title="item.validationMessage"
                ><UIcon name="i-lucide-x-circle" class="size-3" />Invalid</span
              >
            </td>
            <td class="border-b border-gray-100 px-3 py-2 text-center dark:border-gray-700">
              <UButton
                icon="i-lucide-file-text"
                color="primary"
                variant="soft"
                size="xs"
                label="Preview"
                :loading="isLoadingPdf && previewIdx === paginatedOffset + idx"
                @click="openPreview(paginatedOffset + idx)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination (badge Total/Valid/Invalid di samping info "Menampilkan ...") -->
    <Pagination
      v-if="items.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="items.length"
      :rows-per-page="perPage"
      :rows-options="[10, 25, 50, 100]"
      @update:page="currentPage = $event"
      @update:rows-per-page="perPage = $event"
    >
      <template #info>
        <span class="ml-2 flex items-center gap-3">
          <span>
            Total: <span class="font-semibold text-gray-900 dark:text-white">{{ items.length }}</span>
          </span>
          <span class="text-green-600 dark:text-green-400">
            Valid: <span class="font-semibold">{{ validCount }}</span>
          </span>
          <span v-if="invalidCount > 0" class="text-red-600 dark:text-red-400">
            Invalid: <span class="font-semibold">{{ invalidCount }}</span>
          </span>
        </span>
      </template>
    </Pagination>

    <!-- Full-screen Preview PDF (native PDF viewer browser, seragam dengan preview-berkas) -->
    <Teleport to="body">
      <div
        v-if="previewIdx !== null"
        class="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950"
      >
        <!-- Top Bar -->
        <div
          class="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0"
        >
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              Preview Surat — Penerima {{ previewIdx + 1 }}
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewIdx <= 0 || isLoadingPdf"
              @click="gotoPreview(previewIdx - 1)"
            />
            <span class="min-w-14 text-center text-xs text-gray-500 dark:text-gray-400"
              >{{ previewIdx + 1 }} / {{ items.length }}</span
            >
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewIdx >= items.length - 1 || isLoadingPdf"
              @click="gotoPreview(previewIdx + 1)"
            />
            <div class="mx-2 h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <button
              class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Tutup"
              @click="closePreview"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <!-- PDF Content (object tag lebih reliable dari iframe untuk blob PDF) -->
        <div class="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-0">
          <div v-if="isLoadingPdf" class="absolute inset-0 flex items-center justify-center z-10">
            <div
              class="flex flex-col items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg"
            >
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Memuat dokumen…</p>
            </div>
          </div>
          <iframe v-if="pdfUrl" :key="pdfUrl" :src="pdfUrl" class="w-full h-full border-none" />
          <div
            v-else-if="pdfError"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2"
          >
            <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-red-300" />
            <span class="text-sm text-red-500">{{ pdfError }}</span>
          </div>
          <div
            v-else-if="!isLoadingPdf"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2"
          >
            <UIcon name="i-lucide-file-text" class="w-12 h-12 opacity-30" />
            <span class="text-sm">PDF tidak tersedia.</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SdeMasalPenerima, SdeMasalConcept, SdeMasalTemplate } from '~/types/sde-masal';
import Pagination from '~/components/Pagination.vue';
import {
  renderSdeMasalKonten,
  setTertujuEksternalLookup,
  setInternalPositionLookup,
} from '~/utils/sde-masal-render';
import { useApi } from '~/composables/useApi';
import { useTertujuEksternal } from '~/composables/useTertujuEksternal';

const props = defineProps<{
  items: SdeMasalPenerima[];
  columns: string[];
  konsep?: SdeMasalConcept | null;
  template?: SdeMasalTemplate | null;
}>();

const { api } = useApi();
const { data: tertujuEksternal, fetchTertujuEksternal } = useTertujuEksternal();
const { user } = useAuth();

/**
 * Muat data posisi internal (org-data) untuk resolve position ID tembusan
 * internal menjadi jabatan. Dipanggil sekali per generate PDF.
 */
const ensureInternalPositionLookup = async () => {
  if (internalPositionLookupLoaded) return;
  internalPositionLookupLoaded = true;
  try {
    const { apiGet } = useApi();
    const result: any = await apiGet(
      `/org-data/getdata?tgl=${new Date().toISOString().slice(0, 10)}`
    );
    const rows = result?.data?.barisData || result?.barisData || [];
    setInternalPositionLookup(rows);
  } catch {
    /* gagal load → fallback tampilkan kode position */
  }
};
let internalPositionLookupLoaded = false;

const previewIdx = ref<number | null>(null);
const isLoadingPdf = ref(false);
const pdfUrl = ref<string | null>(null);
const pdfError = ref<string | null>(null);
let currentBlobUrl: string | null = null;

// Pagination
const perPage = ref(10);
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(props.items.length / perPage.value)));
const paginatedOffset = computed(() => (currentPage.value - 1) * perPage.value);
const paginatedItems = computed(() =>
  props.items.slice(paginatedOffset.value, paginatedOffset.value + perPage.value)
);

// Summary validasi
const validCount = computed(() => props.items.filter((p) => p.isValid).length);
const invalidCount = computed(() => props.items.filter((p) => !p.isValid).length);

const findTertujuEksternal = (value: string | number | null | undefined) => {
  const raw = String(value ?? '').trim();
  const code = raw.split(/\s*(?:—|-)\s*/)[0].padStart(3, '0');
  return (
    tertujuEksternal.value.find(
      (item) =>
        String(item.kode ?? '')
          .trim()
          .padStart(3, '0') === code
    ) || null
  );
};

const getRecipientCompanyName = (item: SdeMasalPenerima) =>
  findTertujuEksternal(item.idTertuju || item.tertuju)?.nama || null;

const openPreview = async (idx: number) => {
  previewIdx.value = idx;
  await generatePdfFor(idx);
};

const gotoPreview = async (idx: number) => {
  if (idx < 0 || idx >= props.items.length) return;
  previewIdx.value = idx;
  await generatePdfFor(idx);
};

const closePreview = () => {
  previewIdx.value = null;
  revokePdf();
};

const revokePdf = () => {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  pdfUrl.value = null;
};

/**
 * Generate PDF asli via POST /SDE/preview-pdf (Puppeteer di backend),
 * lalu tampilkan via iframe → native PDF viewer browser.
 * Hasil PDF identik dengan surat final yang dikirim ke penerima.
 */
const generatePdfFor = async (idx: number) => {
  const item = props.items[idx];
  if (!item || !props.template) return;

  isLoadingPdf.value = true;
  revokePdf();
  try {
    // Pastikan master tertuju eksternal sudah dimuat (untuk nama perusahaan)
    if (!tertujuEksternal.value.length) {
      await fetchTertujuEksternal().catch(() => {});
    }
    setTertujuEksternalLookup(tertujuEksternal.value);
    await ensureInternalPositionLookup();

    const konten = renderSdeMasalKonten(
      props.template.konten,
      item,
      props.konsep ?? null,
      getRecipientCompanyName(item)
    );

    const formData = new FormData();
    formData.append('htmlContent', konten);
    formData.append('konten', konten);
    formData.append('klasifikasi', props.konsep?.klasifikasiName?.split(' - ')[0] || '');
    formData.append('perihal', item.perihal || props.konsep?.perihal || '');
    formData.append('sifat', props.konsep?.sifat || 'biasa');
    formData.append(
      'penerima',
      JSON.stringify([getRecipientCompanyName(item) || item.tertuju || item.idTertuju || ''])
    );
    // Tembusan: kirim kode eksternal & internal untuk di-resolve backend
    // (urutan: eksternal dulu, lalu internal) → di-hardcode di kanvas PDF.
    // tembusan legacy dikirim sebagai fallback bila kolom baru kosong.
    formData.append('tembusan_eksternal', item.tembusanEksternal || '');
    formData.append('tembusan_internal', item.tembusanInternal || '');
    formData.append('tembusan', JSON.stringify(item.tembusan ? [item.tembusan] : []));
    formData.append(
      'nama_tempat',
      user.value?.areaText?.replace('Kantor', '').trim() || 'Tangerang'
    );
    formData.append('nama_jabatan', user.value?.positionText || '');
    formData.append('nama_lengkap', user.value?.nama || '');
    if (props.konsep?.tanggalKonsep) {
      formData.append('tgl', props.konsep.tanggalKonsep);
    }

    const response = await api.post('/sde-masal/preview-pdf', formData, {
      responseType: 'blob',
    });

    // Validasi: pastikan response benar-benar PDF (bukan JSON error)
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('application/json')) {
      const text = await (response.data as Blob).text();
      const errJson = JSON.parse(text);
      throw new Error(errJson?.message?.[0] || errJson?.message || 'Gagal generate PDF');
    }

    const blob = new Blob([response.data], { type: 'application/pdf' });
    if (blob.size === 0) throw new Error('PDF kosong dari server');
    currentBlobUrl = URL.createObjectURL(blob);
    pdfUrl.value = currentBlobUrl;
  } catch (e: any) {
    console.error('Gagal generate preview PDF SDE Masal:', e);
    // Coba baca error dari blob response (backend mengembalikan JSON error)
    let detail = e?.message || 'Gagal generate PDF';
    if (e?.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text();
        const errJson = JSON.parse(text);
        detail = errJson?.message?.[0] || errJson?.message || detail;
      } catch {
        /* bukan JSON, pakai pesan default */
      }
    }
    pdfError.value = detail;
    useToast().add({ title: 'Gagal membuat preview', description: detail, color: 'error' });
    pdfUrl.value = null;
  } finally {
    isLoadingPdf.value = false;
  }
};

const getValue = (item: SdeMasalPenerima, column: string) => {
  if (column === 'perihal') return item.perihal || '';
  if (column === 'tertuju') return item.tertuju || item.idTertuju || '';
  if (column === 'tembusan') return item.tembusan || item.variables?.tembusan || '';
  const key = column.toLowerCase();
  // Cek variables dulu (key lowercase dari Excel), lalu field langsung di item
  return item.variables?.[key]
    || (item as any)[key]
    || (item as any)[column]
    || '';
};
</script>
