<template>
  <div class="space-y-6">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ detail?.perihal || 'Memuat…' }}</h1>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <div v-else class="space-y-6">
      <!-- Success banner -->
      <div class="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-950/40">
        <UIcon name="i-lucide-circle-check-big" class="h-6 w-6 shrink-0 text-green-600" />
        <div>
          <p class="font-semibold text-green-800 dark:text-green-300">Naskah berhasil diselesaikan</p>
          <p class="text-sm text-green-700 dark:text-green-400">Nomor: {{ detail.nomor || '—' }} · {{ detail.perihal }}</p>
        </div>
      </div>

      <!-- Informasi Naskah -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">Informasi Naskah</h3>
        </div>
        <div class="p-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
          <div><span class="text-gray-500">Nomor:</span> <b class="text-gray-900 dark:text-white">{{ detail.nomor || '—' }}</b></div>
          <div><span class="text-gray-500">Jenis:</span> <b class="text-gray-900 dark:text-white">{{ jenisLabel(detail.jenis) }}</b></div>
          <div><span class="text-gray-500">Perihal:</span> <b class="text-gray-900 dark:text-white">{{ detail.perihal }}</b></div>
          <div><span class="text-gray-500">Tanggal:</span> <b class="text-gray-900 dark:text-white">{{ fmtDate(detail.tanggal) }}</b></div>
          <div><span class="text-gray-500">Penandatangan:</span> <b class="text-gray-900 dark:text-white">{{ penandatanganNama }}</b></div>
          <div><span class="text-gray-500">Status:</span> <UBadge color="success" size="sm" icon="i-lucide-check">Selesai</UBadge></div>
        </div>
      </div>

      <!-- Dokumen Final -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">Dokumen Final</h3>
        </div>
        <div class="p-5 space-y-3">
          <div v-if="detail.fileUrl" class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <span class="text-2xl">📄</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ naskahFileName(detail) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">DOCX · Naskah final</p>
            </div>
            <UButton size="xs" variant="ghost" icon="i-lucide-eye" @click="previewNaskah">Preview</UButton>
            <UButton size="xs" variant="outline" icon="i-lucide-download" @click="downloadNaskah">Unduh</UButton>
          </div>
          <div
            v-for="doc in allDokumen"
            :key="doc.id"
            class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
          >
            <span class="text-2xl">{{ docMeta(doc).icon }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ doc.nama }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ docMeta(doc).label }}</p>
            </div>
            <UButton size="xs" variant="ghost" icon="i-lucide-eye" @click="previewDokumen(doc)">Preview</UButton>
            <UButton size="xs" variant="outline" icon="i-lucide-download" @click="downloadDokumen(doc)">Unduh</UButton>
          </div>
        </div>
      </div>

      <!-- Aksi (highlighted) -->
      <div class="overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white shadow-sm ring-1 ring-green-100 dark:border-green-900/40 dark:from-green-900/20 dark:to-gray-800 dark:ring-green-900/30">
        <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
              <UIcon name="i-lucide-circle-check-big" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Naskah Selesai</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Naskah telah diselesaikan. Unduh dokumen final atau lihat detail lengkap.</p>
            </div>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UButton color="primary" icon="i-lucide-eye" size="lg" class="w-full font-semibold shadow-lg shadow-primary-500/20 sm:w-auto" @click="navigateTo(`/naskah-lainnya/${id}`)">Lihat Detail</UButton>
            <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="lg" class="w-full sm:w-auto" @click="navigateTo('/naskah-lainnya')">Kembali ke Daftar</UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal (PDF iframe / DOCX renderAsync) -->
    <UModal v-model:open="previewOpen" :ui="{ content: 'max-w-4xl' }">
      <template #content>
        <div class="flex h-[85vh] flex-col">
          <div class="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Preview Dokumen</h3>
            <UButton size="sm" variant="ghost" icon="i-lucide-x" @click="closePreview" />
          </div>
          <div class="flex-1 overflow-hidden relative bg-gray-100 dark:bg-gray-900">
            <div v-if="previewLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
              <UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6 text-primary-500" />
            </div>
            <iframe v-if="previewUrl" :src="previewUrl" class="w-full h-full border-0 bg-white" />
            <div v-else ref="previewDocxContainer" class="docx-preview-container w-full h-full overflow-auto"></div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
import { renderAsync } from 'docx-preview';
import { JENIS_LABELS } from '~/types/naskah-lainnya';

const route = useRoute();
const id = computed(() => route.params.id);
const { apiGet } = useApi();
const { detail, fetchDetail } = useNaskahLainnya();
const toast = useToast();
const { t } = useI18n();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: `/naskah-lainnya/${id.value}` },
  { label: 'Selesai', to: '#' },
]);

const loading = ref(true);
// ── Popup preview dokumen (PDF iframe / DOCX renderAsync) ──
const previewOpen = ref(false);
const previewUrl = ref(null);
const previewDocxBuffer = ref(null);
const previewDocxContainer = ref(null);
const previewLoading = ref(false);

const jenisLabel = (j) => JENIS_LABELS[j] ?? j;

const penandatanganNama = computed(() => {
  const list = detail.value?.penandatanganList ?? [];
  if (list.length > 0) return list.map((p) => p.nama).join(', ');
  return detail.value?.penandatangan?.nama ?? '—';
});

const allDokumen = computed(() => (detail.value?.dokumen ?? []).filter((d) => d.tipe !== 'naskah'));

// Ikon & label per tipe dokumen. Sebelumnya semua tipe selain 'pendukung' dilabeli
// "Blanko Verbal" — salah untuk Lembar Persetujuan Direksi & Naskah Fisik.
function docMeta(doc) {
  switch (doc.tipe) {
    case 'pendukung': return { icon: '📎', label: 'PDF · Dokumen Pendukung' };
    case 'lembar_persetujuan_direksi_pdf': return { icon: '📋', label: 'PDF · Lembar Persetujuan Direksi' };
    case 'blanko_verbal_pdf': return { icon: '📋', label: 'PDF · Blanko Verbal' };
    case 'blanko_verbal': return { icon: '📋', label: 'DOCX · Blanko Verbal' };
    case 'naskah_fisik': return { icon: '📄', label: 'Naskah Fisik' };
    default: return { icon: '📋', label: doc.nama };
  }
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function loadDetail() {
  loading.value = true;
  try {
    await fetchDetail(id.value);
  } catch {
    toast.add({ title: 'Gagal memuat detail naskah', color: 'error' });
  } finally {
    loading.value = false;
  }
}

async function downloadNaskah() {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = naskahFileName(detail.value);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.add({ title: 'Gagal mengunduh naskah', color: 'error' });
  }
}

async function renderDocxPreview() {
  if (!previewDocxBuffer.value || !previewDocxContainer.value) return;
  previewDocxContainer.value.innerHTML = '';
  await renderAsync(previewDocxBuffer.value, previewDocxContainer.value, undefined, {
    className: 'docx',
    inWrapper: true,
    ignoreWidth: false,
    ignoreHeight: false,
    breakPages: true,
  });
}

// Buka popup preview dari blob sesuai tipe file (PDF → iframe, DOCX → renderAsync).
async function openPreviewFromBlob(blob, nama) {
  const lower = String(nama ?? '').toLowerCase();
  const isPdf = lower.endsWith('.pdf') || blob.type === 'application/pdf';
  const isDocx = lower.endsWith('.docx');
  if (previewUrl.value) { window.URL.revokeObjectURL(previewUrl.value); previewUrl.value = null; }
  previewDocxBuffer.value = null;
  if (isPdf) {
    previewUrl.value = window.URL.createObjectURL(blob);
    previewOpen.value = true;
  } else if (isDocx) {
    previewDocxBuffer.value = await blob.arrayBuffer();
    previewOpen.value = true;
    await nextTick();
    await renderDocxPreview();
  } else {
    // tipe lain (gambar/dll) — buka tab baru
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  }
}

function closePreview() {
  previewOpen.value = false;
  if (previewUrl.value) { window.URL.revokeObjectURL(previewUrl.value); previewUrl.value = null; }
  previewDocxBuffer.value = null;
}

watch(previewOpen, (open) => { if (!open) closePreview(); });

async function previewNaskah() {
  previewLoading.value = true;
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file`, { responseType: 'blob' });
    await openPreviewFromBlob(blob, naskahFileName(detail.value));
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
}

async function previewDokumen(doc) {
  previewLoading.value = true;
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/dokumen/${doc.id}/download`, { responseType: 'blob' });
    await openPreviewFromBlob(blob, doc.nama);
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
}

async function downloadDokumen(doc) {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/dokumen/${doc.id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = doc.nama;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.add({ title: 'Gagal mengunduh dokumen', color: 'error' });
  }
}

onMounted(loadDetail);
</script>

<style scoped>
:deep(.docx-preview-container) { padding: 16px; }
:deep(.docx-wrapper) { background: #fff !important; padding: 0 !important; }
:deep(.docx-wrapper > section.docx) {
  border: none !important;
  margin: 0 auto !important;
}
</style>