<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-[#457fb6]" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-2xl mx-auto text-center py-20">
      <UIcon
        name="i-lucide-file-x"
        class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
      />
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Surat tidak ditemukan</p>
      <p class="text-xs text-gray-400 mt-1">{{ error }}</p>
      <UButton
        label="Kembali ke Dashboard"
        color="primary"
        variant="soft"
        icon="i-lucide-arrow-left"
        class="mt-4"
        @click="$router.push('/korespondensi/sde-masal')"
      />
    </div>

    <!-- Detail Content -->
    <div v-else-if="naskah" class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <PageHeader title="Detail Surat Dinas Eksternal" :items="breadcrumbs" />
      </div>

      <!-- Badges -->
      <div class="flex items-center gap-2 mb-4">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#457fb6] text-white"
          >SDE</span
        >
        <span
          class="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
        >
          SDE Eksternal
        </span>
        <span
          v-if="naskah.sdeMasal"
          class="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
        >
          SDE Masal
        </span>
        <span :class="statusBadge(naskah.status)">{{ statusLabel(naskah.status) }}</span>
        <!-- Badge jenis TTD: TTE BSrE / QR Code / TTD Basah -->
        <span
          v-if="naskah.label_ttd"
          class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500 text-white"
        >
          {{ naskah.label_ttd }}
        </span>
      </div>

      <!-- Info SDE Masal Card -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-4"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Informasi SDE Massal</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Nomor Surat -->
          <div>
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Nomor Surat</label>
            <p class="text-sm font-mono text-gray-900 dark:text-white mt-0.5">
              {{ naskah.nomor || '-' }}
            </p>
          </div>
          <!-- Tanggal -->
          <div>
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal</label>
            <p class="text-sm text-gray-900 dark:text-white mt-0.5">
              {{ formatDate(naskah.tanggal) }}
            </p>
          </div>
          <!-- Sifat -->
          <div>
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Sifat</label>
            <p class="text-sm capitalize text-gray-900 dark:text-white mt-0.5">
              {{ naskah.sifat || '-' }}
            </p>
          </div>
          <!-- Klasifikasi -->
          <div v-if="naskah.sdeMasal?.klasifikasiName">
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Klasifikasi</label>
            <p class="text-sm text-gray-900 dark:text-white mt-0.5">
              {{ naskah.sdeMasal.klasifikasiName }}
            </p>
          </div>
        </div>

        <!-- Perihal -->
        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Perihal</label>
          <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
            {{ naskah.perihal || '-' }}
          </p>
        </div>

        <!-- Preview (di bawah Perihal) — kembali ke tombol seperti sebelumnya -->
        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Preview</label>
          <UButton
            label="Lihat Surat"
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-eye"
            @click="showPreviewModal = true"
          />
        </div>
      </div>

      <!-- Pengirim Card -->
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5 mb-4"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Pengirim</h3>
        <div
          v-if="naskah.pengirim"
          class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
        >
          <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 text-sm font-bold text-primary-700 dark:text-primary-300 shrink-0">
            {{ (naskah.pengirim.namaSirkuler || '-').charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ naskah.pengirim.namaSirkuler || '-' }}</p>
            <p v-if="naskah.pengirim.positionText" class="text-xs text-gray-500 dark:text-gray-400">{{ naskah.pengirim.positionText }}</p>
            <p v-if="naskah.pengirim.organizationText" class="text-xs text-gray-500 dark:text-gray-400">{{ naskah.pengirim.organizationText }}</p>
            <p v-if="naskah.pengirim.areaText" class="text-xs text-gray-500 dark:text-gray-400">{{ naskah.pengirim.areaText }}</p>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">Pengirim</span>
        </div>
        <p v-else class="text-sm text-gray-400">Data pengirim tidak tersedia</p>
      </div>

      <!-- Penerima Eksternal Card -->
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5 mb-4"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Penerima Eksternal</h3>
        <div v-if="naskah.penerima && naskah.penerima.length > 0" class="space-y-2">
          <div
            v-for="(p, idx) in naskah.penerima"
            :key="idx"
            class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
          >
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 text-sm font-bold text-orange-700 dark:text-orange-300 shrink-0">
              {{ (p.nama || '-').charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-900 dark:text-white">{{ p.nama || '-' }}</p>
              <p v-if="p.jabatan" class="text-xs text-gray-500 dark:text-gray-400">{{ p.jabatan }}</p>
              <p v-if="p.alamat" class="text-xs text-gray-500 dark:text-gray-400">{{ p.alamat }}</p>
              <p v-if="p.telepon" class="text-xs text-gray-500 dark:text-gray-400">Telp: {{ p.telepon }}</p>
              <p v-if="p.email" class="text-xs text-gray-500 dark:text-gray-400">Email: {{ p.email }}</p>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">Penerima</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400">Data penerima tidak tersedia</p>
      </div>

    </div>

    <!-- Full-screen Preview Surat (sama dengan wizard, tanpa tombol Draft/Kirim) -->
    <Teleport to="body">
      <div
        v-if="showPreviewModal"
        class="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950"
      >
        <!-- Top Bar -->
        <div
          class="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0"
        >
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              Preview Surat
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              v-if="naskah.final_pdf"
              label="Download"
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-download"
              @click="downloadPdf"
            />
            <UButton
              v-if="naskah.sdeMasal?.parentNaskahId"
              label="Naskah Induk"
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-link"
              :to="`/korespondensi/kotak-masuk/${naskah.sdeMasal.parentNaskahId}?jenis=DI`"
            />
            <div class="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <button
              class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Tutup"
              @click="showPreviewModal = false"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <!-- PDF Content -->
        <div class="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-0">
          <object v-if="pdfEmbedUrl" :key="pdfEmbedUrl" :data="pdfEmbedUrl" type="application/pdf" class="w-full h-full border-none">
            <iframe :src="pdfEmbedUrl" class="w-full h-full border-none" />
          </object>
          <div v-else-if="naskah?.konten" class="prose prose-sm max-w-none p-6 text-gray-900 dark:text-gray-100 overflow-auto h-full" v-html="naskah.konten" />
          <div v-else class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
            <UIcon name="i-lucide-file-text" class="w-12 h-12 opacity-30" />
            <span class="text-sm">PDF tidak tersedia</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSdeMasal } from '~/composables/useSdeMasal';
import type { SdeMasalFolder, SdeMasalFolderItem } from '~/types/sde-masal';

definePageMeta({ middleware: ['auth', 'sde-masal-bod'] });

const route = useRoute();
const { fetchNaskahDetail } = useSdeMasal();

const naskah = ref<any | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showPreviewModal = ref(false);

const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Korespondensi', to: '/korespondensi/kotak-masuk' },
  { label: 'SDE Massal', to: '/korespondensi/sde-masal' },
  { label: 'Detail Naskah', to: '#' },
];

const formatDate = (date: string | Date) => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(date);
  }
};

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    draf: 'Draft',
    pending: 'Menunggu TTD',
    final: 'Final',
    final_tte: 'Final (TTE)',
  };
  return m[s] || s || '-';
};

const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    draf: 'px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    pending:
      'px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    final:
      'px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    final_tte:
      'px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  };
  return m[s] || m.draf;
};

// --- PDF Preview & Download ---
const { api } = useApi();

const pdfEmbedUrl = ref<string | null>(null);

const buildPdfUrl = (pdfPath: string): string => {
  if (!pdfPath) return '';
  if (pdfPath.startsWith('http')) return pdfPath;
  const base = api?.defaults?.baseURL || '';
  return `${base}/${pdfPath.replace(/^\//, '')}`;
};

const loadPdfEmbed = async () => {
  // Gunakan presigned URL langsung (finalPdfUrl) untuk iframe — paling reliable.
  // Presigned URL MinIO sudah berisi credential di query params, tidak butuh auth header.
  // Fallback: fetch blob jika presigned URL tidak ada (path relatif via API).
  const source = naskah.value?.finalPdfUrl || naskah.value?.final_pdf;
  if (!source) {
    pdfEmbedUrl.value = null;
    return;
  }
  if (source.startsWith('http')) {
    // Presigned URL — pakai langsung di iframe (tanpa fetch, tanpa auth header)
    pdfEmbedUrl.value = source;
    return;
  }
  // Path relatif — fetch sebagai blob dengan auth header via API backend
  try {
    const url = buildPdfUrl(source);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    });
    if (!response.ok) throw new Error('Gagal memuat PDF');
    const blob = await response.blob();
    pdfEmbedUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    console.error('Gagal memuat PDF embed:', e);
    pdfEmbedUrl.value = null;
  }
};

const previewPdf = () => {
  if (!naskah.value?.final_pdf) return;
  const url = buildPdfUrl(naskah.value.final_pdf);
  window.open(url, '_blank');
};

const downloadPdf = async () => {
  if (!naskah.value?.final_pdf) return;
  try {
    const url = buildPdfUrl(naskah.value.final_pdf);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    });
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `SDE-${naskah.value.nomor || naskah.value.id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.error('Gagal download PDF:', e);
  }
};

const loadDetail = async () => {
  loading.value = true;
  error.value = null;
  const naskahId = String(route.params.naskahId || '');
  if (!naskahId) {
    error.value = 'ID naskah tidak valid';
    loading.value = false;
    return;
  }

  try {
    const data = await fetchNaskahDetail(naskahId);
    if (!data) {
      error.value = 'Naskah tidak ditemukan';
    } else {
      naskah.value = data;
      await loadPdfEmbed();
    }
  } catch (e: any) {
    console.error('Gagal memuat detail naskah:', e);
    error.value = e?.message || 'Gagal memuat data';
  } finally {
    loading.value = false;
  }
};

watch(() => route.params.naskahId, loadDetail, { immediate: true });
</script>
