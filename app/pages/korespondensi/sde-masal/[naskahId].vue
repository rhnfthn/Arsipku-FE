<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-[#457fb6]" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-2xl mx-auto text-center py-20">
      <UIcon name="i-lucide-file-x" class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Surat tidak ditemukan</p>
      <p class="text-xs text-gray-400 mt-1">{{ error }}</p>
      <UButton label="Kembali ke Dashboard" color="primary" variant="soft" icon="i-lucide-arrow-left" class="mt-4" @click="$router.push('/korespondensi/sde-masal')" />
    </div>

    <!-- Detail Content -->
    <div v-else-if="naskah" class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <PageHeader title="Detail Surat Dinas Eksternal" :items="breadcrumbs" />
      </div>

      <!-- Badges -->
      <div class="flex items-center gap-2 mb-4">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#457fb6] text-white">SDE</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
          SDE Eksternal
        </span>
        <span v-if="naskah.sdeMasal" class="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
          SDE Masal
        </span>
        <span :class="statusBadge(naskah.status)">{{ statusLabel(naskah.status) }}</span>
      </div>

      <!-- Info Surat Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Nomor Surat -->
          <div>
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Nomor Surat</label>
            <p class="text-sm font-mono text-gray-900 dark:text-white mt-0.5">{{ naskah.nomor || '-' }}</p>
          </div>
          <!-- Tanggal -->
          <div>
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal</label>
            <p class="text-sm text-gray-900 dark:text-white mt-0.5">{{ formatDate(naskah.tanggal) }}</p>
          </div>
          <!-- Sifat -->
          <div>
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Sifat</label>
            <p class="text-sm capitalize text-gray-900 dark:text-white mt-0.5">{{ naskah.sifat || '-' }}</p>
          </div>
          <!-- Klasifikasi -->
          <div v-if="naskah.sdeMasal?.klasifikasiName">
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Klasifikasi</label>
            <p class="text-sm text-gray-900 dark:text-white mt-0.5">{{ naskah.sdeMasal.klasifikasiName }}</p>
          </div>
        </div>

        <!-- Perihal -->
        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Perihal</label>
          <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ naskah.perihal || '-' }}</p>
        </div>
      </div>

      <!-- Pengirim Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-user" class="w-4 h-4 text-[#457fb6]" />
          Pengirim
        </h3>
        <div v-if="naskah.pengirim" class="space-y-1">
          <p class="text-sm text-gray-900 dark:text-white font-medium">{{ naskah.pengirim.namaSirkuler || '-' }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ naskah.pengirim.positionText || '-' }}</p>
          <p v-if="naskah.pengirim.organizationText" class="text-xs text-gray-500 dark:text-gray-400">{{ naskah.pengirim.organizationText }}</p>
          <p v-if="naskah.pengirim.areaText" class="text-xs text-gray-500 dark:text-gray-400">{{ naskah.pengirim.areaText }}</p>
        </div>
        <p v-else class="text-sm text-gray-400">Data pengirim tidak tersedia</p>
      </div>

      <!-- Penerima Eksternal Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-building" class="w-4 h-4 text-[#457fb6]" />
          Penerima Eksternal
        </h3>
        <div v-if="naskah.penerima && naskah.penerima.length > 0" class="space-y-3">
          <div v-for="(p, idx) in naskah.penerima" :key="idx" class="border-l-2 border-[#457fb6] pl-3">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ p.nama || '-' }}</p>
            <p v-if="p.jabatan" class="text-xs text-gray-500 dark:text-gray-400">{{ p.jabatan }}</p>
            <p v-if="p.alamat" class="text-xs text-gray-500 dark:text-gray-400">{{ p.alamat }}</p>
            <p v-if="p.telepon" class="text-xs text-gray-500 dark:text-gray-400">Telp: {{ p.telepon }}</p>
            <p v-if="p.email" class="text-xs text-gray-500 dark:text-gray-400">Email: {{ p.email }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400">Data penerima tidak tersedia</p>
      </div>

      <!-- Isi Surat Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-file-text" class="w-4 h-4 text-[#457fb6]" />
          Isi Surat
        </h3>
        <div v-if="naskah.konten" class="prose prose-sm max-w-none text-gray-900 dark:text-gray-100" v-html="naskah.konten" />
        <p v-else class="text-sm text-gray-400">Konten surat tidak tersedia</p>
      </div>

      <!-- Tombol Aksi -->
      <div class="flex flex-wrap items-center gap-3 mb-8">
        <UButton
          label="Kembali ke SDE Masal"
          color="primary"
          variant="soft"
          icon="i-lucide-arrow-left"
          @click="$router.push('/korespondensi/sde-masal')"
        />
        <UButton
          v-if="naskah.final_pdf"
          label="Preview PDF"
          color="neutral"
          variant="outline"
          icon="i-lucide-eye"
          @click="previewPdf"
        />
        <UButton
          v-if="naskah.final_pdf"
          label="Download PDF"
          color="neutral"
          variant="outline"
          icon="i-lucide-download"
          @click="downloadPdf"
        />
        <UButton
          v-if="naskah.sdeMasal?.parentNaskahId"
          label="Lihat Naskah Induk"
          color="neutral"
          variant="outline"
          icon="i-lucide-link"
          :to="`/korespondensi/kotak-masuk/${naskah.sdeMasal.parentNaskahId}?jenis=DI`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSdeMasal } from '~/composables/useSdeMasal';

definePageMeta({ middleware: ['auth', 'sde-masal-bod'] });

const route = useRoute();
const { fetchNaskahDetail } = useSdeMasal();

const naskah = ref<any | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Korespondensi', to: '/korespondensi/kotak-masuk' },
  { label: 'SDE Masal', to: '/korespondensi/sde-masal' },
  { label: 'Detail Naskah', to: '#' },
];

const formatDate = (date: string | Date) => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
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
    pending: 'px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    final: 'px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    final_tte: 'px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  };
  return m[s] || m.draf;
};

// --- PDF Preview & Download ---
const { api } = useApi();

const buildPdfUrl = (pdfPath: string): string => {
  if (!pdfPath) return '';
  if (pdfPath.startsWith('http')) return pdfPath;
  const base = api?.defaults?.baseURL || '';
  return `${base}/${pdfPath.replace(/^\//, '')}`;
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

onMounted(async () => {
  const naskahId = route.params.naskahId as string;
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
    }
  } catch (e: any) {
    console.error('Gagal memuat detail naskah:', e);
    error.value = e?.message || 'Gagal memuat data';
  } finally {
    loading.value = false;
  }
});
</script>
