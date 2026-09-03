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
                <th class="px-4 py-3 font-semibold whitespace-nowrap">Email</th>
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
                <td class="px-4 py-2.5">
                  <div class="flex flex-col gap-0.5 text-xs text-gray-600 dark:text-gray-300">
                    <span v-if="item.emailTertuju" class="truncate" :title="item.emailTertuju">
                      <span class="text-gray-400 dark:text-gray-500">To:</span> {{ item.emailTertuju }}
                    </span>
                    <span v-if="item.emailCc" class="truncate" :title="item.emailCc">
                      <span class="text-gray-400 dark:text-gray-500">CC:</span> {{ item.emailCc }}
                    </span>
                    <span v-if="item.emailBcc" class="truncate" :title="item.emailBcc">
                      <span class="text-gray-400 dark:text-gray-500">BCC:</span> {{ item.emailBcc }}
                    </span>
                    <span v-if="!item.emailTertuju && !item.emailCc && !item.emailBcc" class="text-gray-300 dark:text-gray-600">-</span>
                  </div>
                </td>
                <td class="px-4 py-2.5 text-center">
                  <span :class="naskahStatusBadge(item.status)">{{ naskahStatusLabel(item.status) }}</span>
                </td>
                <td class="px-4 py-2.5">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                      title="Lihat preview surat"
                      @click="openPreview(item)"
                    >
                      <UIcon name="i-lucide-eye" class="size-4" />
                    </button>
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

      <!-- Timeline Riwayat (full width, di bawah) -->
      <div class="mt-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Timeline Riwayat</h3>
        <div v-if="timelineSteps.length === 0" class="text-sm text-gray-400">
          Belum ada riwayat.
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="(step, idx) in timelineSteps"
            :key="idx"
            class="flex gap-3"
            :class="idx < timelineSteps.length - 1 ? 'pb-4' : ''"
          >
            <!-- Dot + connector -->
            <div class="flex flex-col items-center">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                :class="step.dotClass"
              >
                <UIcon v-if="step.icon === 'check'" name="i-lucide-check" class="w-4 h-4" />
                <UIcon v-else-if="step.icon === 'x'" name="i-lucide-x" class="w-4 h-4" />
                <span v-else>{{ step.number }}</span>
              </div>
              <div
                v-if="idx < timelineSteps.length - 1"
                class="w-0.5 flex-1 mt-1"
                :class="step.done ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-700'"
              />
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium" :class="step.textClass">{{ step.label }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ step.desc }}</p>
              <p v-if="step.date" class="text-xs text-gray-400 mt-0.5">{{ step.date }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Preview Full-screen PDF (native PDF viewer browser, seragam dengan wizard) -->
    <Teleport to="body">
      <div
        v-if="showPreview"
        class="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950"
      >
        <!-- Top Bar -->
        <div
          class="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0"
        >
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              Preview Surat — Penerima {{ previewIndex + 1 }}
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewIndex <= 0 || isLoadingPdf"
              @click="gotoPreview(previewIndex - 1)"
            />
            <span class="min-w-14 text-center text-xs text-gray-500 dark:text-gray-400"
              >{{ previewIndex + 1 }} / {{ items.length }}</span
            >
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewIndex >= items.length - 1 || isLoadingPdf"
              @click="gotoPreview(previewIndex + 1)"
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
        <!-- PDF Content (iframe → native PDF viewer browser) -->
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
import type { SdeMasalFolder, SdeMasalFolderItem, SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';
import { useAuth } from '~/composables/useAuth';
import { useTertujuEksternal } from '~/composables/useTertujuEksternal';
import {
  renderSdeMasalKonten,
  setTertujuEksternalLookup,
  setInternalPositionLookup,
} from '~/utils/sde-masal-render';

definePageMeta({ middleware: ['auth', 'sde-masal-bod'] });
const route = useRoute();
const { api, apiGet } = useApi();
const { findNaskahInFolder } = useSdeMasal();
const { user } = useAuth();
const { data: tertujuEksternal, fetchTertujuEksternal } = useTertujuEksternal();
const folder = ref<SdeMasalFolder | null>(null);
const items = ref<SdeMasalFolderItem[]>([]);
const loading = ref(true);
const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'SDE Masal', to: '/korespondensi/sde-masal' },
  { label: folder.value?.judul || 'Folder', to: '#' },
]);

// Preview PDF (native PDF viewer via iframe, seragam dengan wizard)
const showPreview = ref(false);
const previewIndex = ref(0);
const isLoadingPdf = ref(false);
const pdfUrl = ref<string | null>(null);
const pdfError = ref<string | null>(null);
let currentBlobUrl: string | null = null;

const previewKonsep = computed<SdeMasalConcept | null>(() => {
  const f = folder.value;
  if (!f) return null;
  return {
    tanggalKonsep: f.tanggal ? String(f.tanggal).slice(0, 10) : '',
    klasifikasiId: f.klasifikasi || '',
    klasifikasiName: [f.klasifikasi, f.klasifikasiText].filter(Boolean).join(' - '),
    pengirimId: f.pengirimId || '',
    pengirimName: f.pengirimName || '',
    sifat: f.sifat || 'biasa',
    perihal: items.value[previewIndex.value]?.perihal || '',
    parentNaskahId: f.parentNaskahId || undefined,
  };
});

const previewTemplate = computed<SdeMasalTemplate | null>(() => {
  const f = folder.value;
  if (!f) return null;
  return { skema: 'DINAMIS', versi: 'v1', konten: f.kontenTemplate || '' };
});

const pengirimParts = computed(() =>
  (folder.value?.pengirimName || '').split(' - ').map((p) => p.trim()).filter(Boolean)
);
const pengirimNama = computed(() => pengirimParts.value[0] || '-');
const pengirimJabatan = computed(() => pengirimParts.value.slice(1).join(' - ') || '-');

const findTertujuEksternal = (value: string | number | null | undefined) => {
  const raw = String(value ?? '').trim();
  const code = raw.split(/\s*(?:—|-)\s*/)[0].padStart(3, '0');
  return tertujuEksternal.value.find(
    (item) => String(item.kode ?? '').trim().padStart(3, '0') === code
  );
};

const getRecipientCompanyName = (item: SdeMasalFolderItem) =>
  findTertujuEksternal(item.recipient?.idTertuju || item.recipient?.tertuju)?.nama || null;

let internalPositionLookupLoaded = false;
const ensureInternalPositionLookup = async () => {
  if (internalPositionLookupLoaded) return;
  internalPositionLookupLoaded = true;
  try {
    const result: any = await apiGet(
      `/org-data/getdata?tgl=${new Date().toISOString().slice(0, 10)}`
    );
    const rows = result?.data?.barisData || result?.barisData || [];
    setInternalPositionLookup(rows);
  } catch {
    /* gagal load → fallback tampilkan kode position */
  }
};

const revokePdf = () => {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  pdfUrl.value = null;
};

const closePreview = () => {
  showPreview.value = false;
  revokePdf();
};

const openPreview = async (item: SdeMasalFolderItem) => {
  const idx = items.value.findIndex((i) => i.id === item.id);
  if (idx < 0) return;
  previewIndex.value = idx;
  showPreview.value = true;
  await generatePdfFor(idx);
};

const gotoPreview = async (idx: number) => {
  if (idx < 0 || idx >= items.value.length) return;
  previewIndex.value = idx;
  await generatePdfFor(idx);
};

const generatePdfFor = async (idx: number) => {
  const item = items.value[idx];
  if (!item || !folder.value) return;

  isLoadingPdf.value = true;
  revokePdf();
  try {
    if (!tertujuEksternal.value.length) {
      await fetchTertujuEksternal().catch(() => {});
    }
    setTertujuEksternalLookup(tertujuEksternal.value);
    await ensureInternalPositionLookup();

    const recipient = (item.recipient || {}) as SdeMasalPenerima;
    const konten = renderSdeMasalKonten(
      folder.value.kontenTemplate || '',
      recipient,
      previewKonsep.value,
      getRecipientCompanyName(item)
    );

    const formData = new FormData();
    formData.append('htmlContent', konten);
    formData.append('konten', konten);
    formData.append('klasifikasi', previewKonsep.value?.klasifikasiName?.split(' - ')[0] || '');
    formData.append('perihal', item.perihal || previewKonsep.value?.perihal || '');
    formData.append('sifat', previewKonsep.value?.sifat || 'biasa');
    formData.append(
      'penerima',
      JSON.stringify([getRecipientCompanyName(item) || item.penerima || ''])
    );
    formData.append('tembusan_eksternal', recipient.tembusanEksternal || '');
    formData.append('tembusan_internal', recipient.tembusanInternal || '');
    formData.append('tembusan', JSON.stringify(recipient.tembusan ? [recipient.tembusan] : []));
    formData.append(
      'nama_tempat',
      user.value?.areaText?.replace('Kantor', '').trim() || 'Tangerang'
    );
    formData.append('nama_jabatan', pengirimJabatan.value || user.value?.positionText || '');
    formData.append('nama_lengkap', pengirimNama.value || user.value?.nama || '');
    if (previewKonsep.value?.tanggalKonsep) {
      formData.append('tgl', previewKonsep.value.tanggalKonsep);
    }

    const response = await api.post('/sde-masal/preview-pdf', formData, {
      responseType: 'blob',
    });

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
    toast.add({ title: 'Gagal membuat preview', description: detail, color: 'error' });
    pdfUrl.value = null;
  } finally {
    isLoadingPdf.value = false;
  }
};

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
// Status yang masih dalam alur verifikasi (belum final → link ke verifikasi-detail)
const isVerificationStatus = (status: string) =>
  ['MENUNGGU', 'MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DITOLAK'].includes(status);
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

// Timeline Riwayat: verifikator sama untuk semua naskah dalam satu folder,
// jadi tampilkan sekali saja (dedupe). Urutan terbaru di atas.
const timelineSteps = computed(() => {
  const steps: { number?: number; label: string; desc: string; date?: string; dotClass: string; textClass: string; icon?: string; done: boolean }[] = [];

  // Ambil item pertama yang punya verifikators (semua item share verifikator sama).
  const firstItem = items.value.find((i) => (i.verifikators || []).length > 0) || items.value[0];
  if (!firstItem) return steps;

  const statusVerifikasi = firstItem.statusVerifikasi;
  const verifikators = [...(firstItem.verifikators || [])].reverse();

  // Step: Dikirim
  if (statusVerifikasi === 'TERKIRIM') {
    steps.push({
      label: 'Dikirim',
      desc: 'Naskah SDE Massal telah dikirim ke penerima',
      dotClass: 'bg-green-500 text-white',
      textClass: 'text-green-600 dark:text-green-400 font-semibold',
      icon: 'check',
      done: true,
    });
  }

  // Step: Ditolak
  if (statusVerifikasi === 'DITOLAK') {
    steps.push({
      label: 'Ditolak',
      desc: 'SDE Massal ditolak verifikator',
      dotClass: 'bg-red-500 text-white',
      textClass: 'text-red-600 dark:text-red-400 font-semibold',
      icon: 'x',
      done: true,
    });
  }

  // Step per verifikator (urutan terbalik: terbaru di atas)
  for (const v of verifikators) {
    const urutan = Number(v.urutan);
    if (v.status === 'verified') {
      steps.push({
        number: urutan,
        label: `Disetujui oleh Verifikator ${urutan}`,
        desc: `${v.nama} — ${v.jabatan}`,
        date: v.verifiedAt ? formatDate(v.verifiedAt) : undefined,
        dotClass: 'bg-green-500 text-white',
        textClass: 'text-gray-900 dark:text-white',
        icon: 'check',
        done: true,
      });
    } else if (v.status === 'rejected') {
      steps.push({
        number: urutan,
        label: `Ditolak oleh Verifikator ${urutan}`,
        desc: `${v.nama} — ${v.jabatan}`,
        date: v.rejectedAt ? formatDate(v.rejectedAt) : undefined,
        dotClass: 'bg-red-500 text-white',
        textClass: 'text-red-600 dark:text-red-400 font-semibold',
        icon: 'x',
        done: true,
      });
    } else if (v.status === 'waiting') {
      steps.push({
        number: urutan,
        label: `Menunggu Verifikasi ${urutan}`,
        desc: `${v.nama} — ${v.jabatan}`,
        dotClass: 'bg-[#457fb6] text-white ring-4 ring-[#457fb6]/20',
        textClass: 'text-[#457fb6] dark:text-[#5a9ad6] font-semibold',
        done: false,
      });
    } else {
      steps.push({
        number: urutan,
        label: `Menunggu Giliran Verifikator ${urutan}`,
        desc: `${v.nama} — ${v.jabatan}`,
        dotClass: 'bg-gray-200 dark:bg-gray-600 text-gray-400',
        textClass: 'text-gray-500 dark:text-gray-400',
        done: false,
      });
    }
  }

  // Step: Pengajuan (selalu di bawah)
  steps.push({
    label: 'Pengajuan',
    desc: `${folder.value?.pengirimName || 'Pengirim'} mengajukan SDE Massal`,
    date: formatDate(firstItem.submittedAt || firstItem.createdAt),
    dotClass: 'bg-green-500 text-white',
    textClass: 'text-gray-900 dark:text-white',
    icon: 'check',
    done: true,
  });

  return steps;
});
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
