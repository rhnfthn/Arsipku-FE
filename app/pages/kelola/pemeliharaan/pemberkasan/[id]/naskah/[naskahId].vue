<template>
  <div class="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
    <!-- Header (tetap untuk navigasi kembali) -->
    <div class="shrink-0 px-4 pb-3 pt-5 sm:px-5">
      <PageHeader
        :title="pageTitle"
        :items="[
          { label: 'Kelola' },
          { label: 'Pemeliharaan' },
          { label: 'Pemberkasan', to: '/kelola/pemeliharaan/pemberkasan/berkas-saya' },
          { label: 'Detail Naskah' },
        ]"
      />
    </div>

    <!-- Viewer PDF (isi halaman = PDF saja) -->
    <div class="relative min-h-0 flex-1">
      <div
        v-if="isPdfLoading"
        class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90"
      >
        <UIcon name="i-lucide-loader-circle" class="mb-2 size-10 animate-spin text-primary-500" />
        <span class="text-xs text-gray-500 dark:text-gray-400">Memuat Dokumen...</span>
      </div>
      <iframe
        v-if="activePdfUrl"
        :src="activePdfUrl"
        class="h-full w-full border-none"
        title="Preview dokumen"
      />
      <div
        v-else-if="!isPdfLoading"
        class="flex h-full flex-col items-center justify-center gap-2 text-gray-500"
      >
        <UIcon name="i-lucide-file-text" class="size-12 opacity-30" />
        <span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const { getNaskahDetailInBerkas } = useArsipDinamis();
const toast = useToast();

const berkasId = computed(() => String(route.params.id || ''));
const naskahIdParam = computed(() => String(route.params.naskahId || ''));

const pageTitle = computed(() => 'Detail Naskah');

const isPdfLoading = ref(true);
const activePdfUrl = ref<string | null>(null);

// Ambil PDF final naskah (blob via fetch agar auth ikut; fallback ke URL asli
// bila CORS/redirect tidak memungkinkan).
async function openDocumentPreview(url: string) {
  if (!url) {
    isPdfLoading.value = false;
    return;
  }
  isPdfLoading.value = true;
  try {
    const res = await fetch(url);
    const blob = new Blob([await res.arrayBuffer()], { type: 'application/pdf' });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch {
    activePdfUrl.value = url;
  } finally {
    isPdfLoading.value = false;
  }
}

onMounted(async () => {
  if (!berkasId.value || !naskahIdParam.value) {
    isPdfLoading.value = false;
    return;
  }
  try {
    const response = await getNaskahDetailInBerkas(berkasId.value, naskahIdParam.value);
    const rawData: any = response?.data ?? response;
    let flow: any[] = [];
    if (Array.isArray(rawData)) flow = rawData;
    else if (rawData && Array.isArray(rawData.flow)) flow = rawData.flow;
    else if (rawData) flow = [rawData];
    const first = flow[0];
    await openDocumentPreview(first?.final_pdf_url || first?.final_pdf || '');
  } catch (error: any) {
    isPdfLoading.value = false;
    toast.add({
      title: 'Detail naskah gagal dimuat',
      description: error?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  }
});
</script>
