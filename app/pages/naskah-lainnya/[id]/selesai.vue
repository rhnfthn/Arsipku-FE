<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <NuxtLink to="/naskah-lainnya" class="hover:text-primary">Naskah Lainnya</NuxtLink>
          <span>/</span>
          <NuxtLink :to="`/naskah-lainnya/${id}`" class="hover:text-primary">Detail</NuxtLink>
          <span>/</span>
          <span class="text-gray-700 dark:text-gray-300">Selesai</span>
        </div>
        <h1 class="mt-2 text-xl font-bold text-gray-900 dark:text-white">{{ detail?.nomor || 'Memuat…' }}</h1>
      </div>
      <UButton :to="`/naskah-lainnya/${id}`" variant="ghost" icon="i-lucide-arrow-left" color="neutral">
        Kembali ke Detail
      </UButton>
    </div>

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
          <p class="text-sm text-green-700 dark:text-green-400">Nomor: {{ detail.nomor }} · {{ detail.perihal }}</p>
        </div>
      </div>

      <!-- Informasi Naskah -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">Informasi Naskah</h3>
        </div>
        <div class="p-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
          <div><span class="text-gray-500">Nomor:</span> <b class="text-gray-900 dark:text-white">{{ detail.nomor }}</b></div>
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
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">Naskah.docx</p>
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
            <span class="text-2xl">{{ doc.tipe === 'pendukung' ? '📎' : '📋' }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ doc.nama }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ doc.tipe === 'pendukung' ? 'PDF · Dokumen Pendukung' : 'Blanko Verbal' }}</p>
            </div>
            <UButton size="xs" variant="ghost" icon="i-lucide-eye" @click="previewDokumen(doc)">Preview</UButton>
            <UButton size="xs" variant="outline" icon="i-lucide-download" @click="downloadDokumen(doc)">Unduh</UButton>
          </div>
        </div>
      </div>

      <!-- Aksi -->
      <div class="flex flex-wrap gap-3">
        <UButton color="primary" icon="i-lucide-eye" @click="navigateTo(`/naskah-lainnya/${id}`)">Lihat Detail</UButton>
        <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="navigateTo('/naskah-lainnya')">Kembali ke Daftar</UButton>
      </div>
    </div>

    <!-- Preview Modal -->
    <UModal v-model="previewUrl" :ui="{ content: 'max-w-4xl' }">
      <template #content>
        <div class="flex h-[85vh] flex-col">
          <div class="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Preview Dokumen</h3>
            <UButton size="sm" variant="ghost" icon="i-lucide-x" @click="previewUrl = null" />
          </div>
          <iframe :src="previewUrl" class="flex-1 w-full" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
const route = useRoute();
const id = computed(() => route.params.id);
const { apiGet } = useApi();
const { detail, fetchDetail } = useNaskahLainnya();
const toast = useToast();

const loading = ref(true);
const previewUrl = ref(null);

const JENIS_LABELS = {
  PER: 'Peraturan (PER)', KEP: 'Keputusan (KEP)', INS: 'Instruksi (INS)',
  PKS: 'Perjanjian Kerja Sama (PKS)', UND: 'Undangan (UND)', BA: 'Berita Acara (BA)',
};
const jenisLabel = (j) => JENIS_LABELS[j] || j;

const penandatanganNama = computed(() => {
  const list = detail.value?.penandatanganList ?? [];
  if (list.length > 0) return list.map((p) => p.nama).join(', ');
  return detail.value?.penandatangan?.nama ?? '—';
});

const allDokumen = computed(() => (detail.value?.dokumen ?? []).filter((d) => d.tipe !== 'naskah'));

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
    a.download = 'naskah.docx';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.add({ title: 'Gagal mengunduh naskah', color: 'error' });
  }
}

async function previewNaskah() {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file`, { responseType: 'blob' });
    window.open(window.URL.createObjectURL(blob), '_blank');
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  }
}

async function previewDokumen(doc) {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/dokumen/${doc.id}/download`, { responseType: 'blob' });
    previewUrl.value = window.URL.createObjectURL(blob);
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
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