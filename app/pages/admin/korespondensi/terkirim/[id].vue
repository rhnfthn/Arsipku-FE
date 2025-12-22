<script setup lang="ts">
import { onMounted, ref, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft, Printer,
  Paperclip, Loader2, FileText
} from 'lucide-vue-next';
import { useTerkirimDetail } from '@/composables/useTerkirimDetail';

// --- STATE & COMPOSABLES ---
const route = useRoute();
const router = useRouter();

// 1. Ambil ID dan Jenis dari URL
const idNaskah = route.params.id as string;
// Default ke 'ND' jika tidak ada parameter jenis
const jenisNaskah = (route.query.jenis as string)?.toUpperCase() || 'ND';

const {
  detail,
  isLoading,
  fetchDetail,
  openPdfPreview,
  pdfUrl,
  isPdfLoading,
  showPdfModal
} = useTerkirimDetail();

// --- STATE LOKAL ---
const iframe = ref<HTMLIFrameElement | null>(null);
const showAllRecipients = ref(false);
const LIMIT = 2;

// --- COMPUTED PROPERTIES ---

// Logic Label Kategori (ND, SDI, SDE, Disposisi)
const categoryLabel = computed(() => {
  const j = detail.value?.jenis || jenisNaskah;
  if (j === 'ND') return 'Nota Dinas';
  if (j === 'INTERNAL' || j === 'SDI') return 'Surat Dinas Internal';
  if (j === 'EXTERNAL' || j === 'SDE') return 'Surat Dinas Eksternal';
  if (j === 'DI' || j === 'DISPOSISI') return 'Disposisi';
  return j;
});

const visiblePenerima = computed(() => {
  if (!detail.value?.penerima) return [];
  if (showAllRecipients.value) {
    return detail.value.penerima;
  } else {
    return detail.value.penerima.slice(0, LIMIT);
  }
});

const remainingCount = computed(() => {
  if (!detail.value?.penerima) return 0;
  return detail.value.penerima.length - LIMIT;
});

// --- METHODS ---
const goBack = () => router.back();

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const getInitial = (name: string) => {
  if (!name) return 'NA';
  return name.substring(0, 2).toUpperCase();
};

const getSifatColor = (sifat: string) => {
  switch (sifat?.toLowerCase()) {
    case 'rahasia': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'segera': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  }
};

// --- IFRAME RESIZING ---
function resizeIframe() {
  if (!iframe.value) return;
  const adjust = () => {
    if (!iframe.value?.contentWindow) return;
    const doc = iframe.value.contentWindow.document;
    const height = doc.body.scrollHeight;
    if (height > 0) {
      iframe.value.style.height = height + 'px';
    }
  };
  iframe.value.onload = adjust;
  adjust();
}

watch(() => detail.value?.konten, async () => {
  await nextTick();
  resizeIframe();
});

// --- LIFECYCLE ---
onMounted(async () => {
  if (idNaskah) {
    // LOGIC UTAMA: Panggil fetchDetail dengan parameter jenis
    // Composable akan menangani endpoint yang berbeda (SDI/SDE/ND)
    await fetchDetail(idNaskah, jenisNaskah);
  }
});
</script>

<template>
  <div
    class="w-full h-screen flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-lg glass-blue">

    <div
      class="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 z-30 bg-white dark:bg-gray-900 transition-colors">
      <div class="flex items-center gap-3 min-w-0">
        <button @click="goBack"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-300 shrink-0">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="flex flex-col min-w-0">
          <h1 class="text-base font-semibold text-gray-900 dark:text-white truncate">Kembali</h1>
        </div>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400"
          title="Cetak / Preview PDF" @click="openPdfPreview">
          <Printer class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto bg-white dark:bg-gray-900 p-0 relative scroll-smooth font-sans">

      <div v-if="isLoading" class="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <span class="text-sm text-gray-500 font-medium">Memuat data...</span>
      </div>

      <div v-else-if="detail" class="max-w-5xl mx-auto w-full p-6 md:p-10">

        <div class="mb-6 space-y-3">
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white leading-snug tracking-tight">
            {{ detail.perihal }}
          </h1>

          <div class="flex flex-wrap items-center gap-2">
            <span
              class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600/20">
              {{ categoryLabel }}
            </span>

            <span class="px-2 py-0.5 rounded-md text-[11px] font-medium ring-1 ring-inset ring-current/20 capitalize"
              :class="getSifatColor(detail.sifat).replace('bg-', 'bg-opacity-10 text-')">
              {{ detail.sifat }}
            </span>
          </div>
        </div>

        <div class="flex items-start gap-4 mb-8">
          <UAvatar :alt="detail.pengirim?.nama || 'Unknown'" size="md"
            class="mt-1 ring-1 ring-gray-200 dark:ring-gray-700"
            :ui="{ background: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300', text: 'font-medium text-sm' }">
            {{ getInitial(detail.pengirim?.nama || '') }}
          </UAvatar>

          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-baseline">
              <span class="text-base font-semibold text-gray-900 dark:text-white">
                {{ detail.pengirim?.positionText || detail.pengirim?.position_text || 'Pengirim' }}
              </span>
              <div class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4 font-medium">
                {{ formatDate(detail.tanggal) }}
                <span class="hidden sm:inline text-gray-300 mx-1">|</span>
                <span class="hidden sm:inline font-mono text-[10pt] text-gray-400">{{ detail.nomor }}</span>
              </div>
            </div>

            <div class="text-xs text-gray-500 dark:text-gray-400 -mt-0.5 mb-1">
              {{ detail.pengirim?.nama }}
            </div>

            <div class="mt-3">
              <span class="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2 select-none">
                Kepada:
              </span>

              <div class="flex flex-col gap-1">
                <div v-for="(penerima, index) in visiblePenerima" :key="penerima.id || index"
                  class="flex items-start gap-2.5 text-sm leading-snug">

                  <span v-if="detail.penerima && detail.penerima.length > 1"
                    class="text-xs text-gray-400 mt-0.5 select-none w-4 text-right shrink-0">
                    {{ index + 1 }}.
                  </span>

                  <div class="flex items-center">
                    <span class="font-medium text-gray-800 dark:text-gray-200 pe-2">
                      {{ penerima.positionText || penerima.position_text || penerima.nama }}
                    </span>
                    <span v-if="penerima.positionText || penerima.position_text"
                      class="text-gray-500 text-xs font-normal">
                      ({{ penerima.nama }})
                    </span>
                  </div>
                </div>

                <div v-if="detail.penerima && detail.penerima.length > LIMIT" class="ml-[26px] mt-1">
                  <button @click="showAllRecipients = !showAllRecipients"
                    class="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1 outline-none rounded">
                    <span v-if="!showAllRecipients">
                      +{{ remainingCount }} lebih banyak
                    </span>
                    <span v-else>
                      Sembunyikan
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-6">

          <div class="w-full">
            <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Berita</h3>
            <div class="dark:border-gray-800">
              <iframe ref="iframe" :srcdoc="detail.konten" class="w-full" style="border: none; overflow: hidden;"
                scrolling="no"></iframe>
            </div>
          </div>

          <div v-if="detail.lampiran_files && detail.lampiran_files.length > 0">
            <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Lampiran</h3>
            <div class="flex flex-wrap gap-2">
              <a v-for="file in detail.lampiran_files" :key="file.id" :href="file.fileUrl" target="_blank"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div
                  class="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 shrink-0">
                  <Paperclip class="w-3 h-3" />
                </div>
                <span
                  class="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                  {{ file.fileName }}
                </span>
              </a>
            </div>
          </div>

          <div v-if="detail.detail_disposisi" class="pt-4">
            <div class="pl-4 border-l-[3px] border-gray-200 dark:border-gray-700">
              <span class="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Disposisi</span>
              <p class="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                {{ detail.detail_disposisi.disposisi }}
              </p>
              <div v-if="detail.detail_disposisi.catatan" class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400 italic">
                  &mdash; "{{ detail.detail_disposisi.catatan }}"
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

    <USlideover v-model:open="showPdfModal" title="Preview Dokumen" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }">
      <template #body>
        <div class="flex flex-col h-full bg-white dark:bg-gray-900">
          <div class="flex-1 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
            <div v-if="isPdfLoading"
              class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <Loader2 class="w-10 h-10 text-blue-600 animate-spin mb-3" />
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Memuat Preview PDF...</span>
            </div>

            <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full border-none" />

            <div v-else-if="!isPdfLoading && !pdfUrl"
              class="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <FileText class="w-16 h-16 mb-2 opacity-50" />
              <span class="text-sm">Gagal memuat dokumen</span>
              <UButton label="Coba Lagi" color="primary" variant="soft" size="xs" class="mt-4"
                @click="openPdfPreview" />
            </div>
          </div>
        </div>
      </template>
    </USlideover>

  </div>
</template>

<style scoped>
/* Scrollbar halus */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8);
}

.glass-blue {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

.dark .glass-blue {
  background: rgba(17, 24, 39, 0.7);
}
</style>
