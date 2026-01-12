<script setup lang="ts">
// --- IMPORTS ---
import { onMounted, onUnmounted, ref, watch, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft, Printer, Paperclip, Loader2, FileText,
  MoreHorizontal, ChevronUp, Calendar, Hash, Tag
} from 'lucide-vue-next';
import { useTerkirimDetail } from '@/composables/useTerkirimDetail';

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Terkirim", to: "/korespondensi/terkirim" },
  { label: "Detail Surat", to: "#" },
];

// --- SETUP & COMPOSABLES ---
const route = useRoute();
const router = useRouter();
const {
  detail,
  isLoading,
  fetchDetail,
  showPdfModal
} = useTerkirimDetail();

// --- CONSTANTS & PARAMS ---
const idNaskah = route.params.id as string;

// [FIX] Gunakan computed untuk menangkap query param secara reaktif & normalisasi
const currentJenis = computed(() => {
  const raw = (route.query.jenis as string)?.toUpperCase() || 'ND';
  // Pastikan KAJIAN atau KA dinormalisasi menjadi 'KA' untuk endpoint
  return (raw === 'KAJIAN' || raw === 'KA') ? 'KA' : raw;
});

const LIMIT_DISPLAY = 2;
const MAX_CONTENT_HEIGHT = 300;

// --- LOCAL STATE ---
const iframe = ref<HTMLIFrameElement | null>(null);
const showAllRecipients = ref(false);
const showAllCC = ref(false);
const isContentExpanded = ref(false);
const showReadMoreButton = ref(false);
const activePdfUrl = ref<string | null>(null);
const isLocalPdfLoading = ref(false);
const previewTitle = ref('Preview Dokumen');

// --- COMPUTED PROPERTIES ---
const categoryLabel = computed(() => {
  const j = detail.value?.jenis || currentJenis.value; // Gunakan currentJenis
  const labels: Record<string, string> = {
    'ND': 'Nota Dinas',
    'INTERNAL': 'Surat Dinas Internal',
    'SDI': 'Surat Dinas Internal',
    'EXTERNAL': 'Surat Dinas Eksternal',
    'SDE': 'Surat Dinas Eksternal',
    'DI': 'Disposisi',
    'DISPOSISI': 'Disposisi',
    'KA': 'Kajian',
    'KAJIAN': 'Kajian'
  };
  return labels[j] || j;
});

// LOGIC WARNA LABEL
const categoryStyle = computed(() => {
  const c = (detail.value?.jenis || currentJenis.value || '').toUpperCase();

  if (['ND', 'NOTA DINAS'].includes(c)) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300';

  // [FIX] Hapus 'KA' dari sini agar tidak tertimpa warna hijau
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c)) return 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300';

  if (['SDE', 'EXTERNAL', 'EKSTERNAL', 'SURAT DINAS EKSTERNAL'].includes(c)) return 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300';

  // KA akan masuk ke sini (Cyan)
  if (['KA', 'KAJIAN'].includes(c)) return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-300';

  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
});

// LOGIC TOTAL COUNT (NEW)
const totalRecipientCount = computed(() => {
  if (!detail.value) return 0;
  const type = (detail.value.jenis || currentJenis.value).toUpperCase();
  if (['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(type) && detail.value.kepada_yth) {
    return detail.value.kepada_yth.split(';').filter((s: string) => s.trim()).length;
  }
  return detail.value.penerima?.length || 0;
});

const totalCCCount = computed(() => {
  return detail.value?.tembusan?.length || 0;
});

// LOGIC VISIBLE PENERIMA
const visiblePenerima = computed(() => {
  if (!detail.value) return [];

  const type = (detail.value.jenis || currentJenis.value).toUpperCase();

  // KHUSUS SDE
  if (['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(type) && detail.value.kepada_yth) {
    const list = detail.value.kepada_yth.split(';').map((nama: string) => ({
      nama: nama.trim(),
      positionText: ''
    })).filter((i: any) => i.nama);

    return showAllRecipients.value ? list : list.slice(0, LIMIT_DISPLAY);
  }

  // DEFAULT
  if (!detail.value.penerima) return [];
  return showAllRecipients.value
    ? detail.value.penerima
    : detail.value.penerima.slice(0, LIMIT_DISPLAY);
});

const remainingCount = computed(() => {
  if (!detail.value) return 0;

  const type = (detail.value.jenis || currentJenis.value).toUpperCase();
  if (['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(type) && detail.value.kepada_yth) {
    const total = detail.value.kepada_yth.split(';').filter((s: string) => s.trim()).length;
    return Math.max(0, total - LIMIT_DISPLAY);
  }

  return Math.max(0, (detail.value?.penerima?.length || 0) - LIMIT_DISPLAY);
});

const visibleTembusan = computed(() => {
  if (!detail.value?.tembusan) return [];
  return showAllCC.value
    ? detail.value.tembusan
    : detail.value.tembusan.slice(0, LIMIT_DISPLAY);
});

const remainingCCCount = computed(() =>
  (detail.value?.tembusan?.length || 0) - LIMIT_DISPLAY
);

// --- METHODS: UTILS ---
const goBack = () => router.back();

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

const toggleContent = () => {
  isContentExpanded.value = !isContentExpanded.value;
};

// --- METHODS: DOCUMENT PREVIEW ---
const openDocumentPreview = async (url: string, title: string, filename?: string) => {
  if (!url) {
    alert("URL dokumen tidak valid.");
    return;
  }

  previewTitle.value = title;
  showPdfModal.value = true;
  isLocalPdfLoading.value = true;
  activePdfUrl.value = null;

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    let mime = 'application/pdf';
    const nameSource = (filename || url || '').toString();
    const ext = nameSource.split('?')[0].split('/').pop()?.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') mime = 'application/pdf';
    else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
    else if (ext === 'png') mime = 'image/png';
    else if (ext === 'txt') mime = 'text/plain';

    const blob = new Blob([buffer], { type: mime });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    console.error("Gagal memuat dokumen blob:", error);
    activePdfUrl.value = url;
  } finally {
    isLocalPdfLoading.value = false;
  }
};

const openPdfPreview = () => {
  if (detail.value?.final_pdf_url) {
    const filename = detail.value.final_pdf_name
      || detail.value.final_pdf_filename
      || (detail.value.final_pdf_url.split('?')[0].split('/').pop() || 'document.pdf');
    openDocumentPreview(detail.value.final_pdf_url, 'Pratinjau', filename);
  } else {
    alert('Dokumen PDF belum tersedia');
  }
};

// --- METHODS: IFRAME RESIZING ---
const resizeIframe = () => {
  if (!iframe.value) return;

  const adjust = () => {
    const iWindow = iframe.value?.contentWindow;
    if (!iWindow) return;

    const doc = iWindow.document;
    iframe.value!.style.height = 'auto';
    const contentHeight = Math.max(
      doc.body.scrollHeight, doc.documentElement.scrollHeight,
      doc.body.offsetHeight, doc.documentElement.offsetHeight
    );
    iframe.value!.style.height = (contentHeight + 20) + 'px';

    if (contentHeight > MAX_CONTENT_HEIGHT) {
      showReadMoreButton.value = true;
    } else {
      showReadMoreButton.value = false;
      isContentExpanded.value = true;
    }
  };

  iframe.value.onload = adjust;
  setTimeout(adjust, 100);
  setTimeout(adjust, 500);
};

const contentToDisplay = computed(() => {
  if (!detail.value) return '';
  const type = (detail.value.jenis || currentJenis.value).toUpperCase();

  if (type === 'DI' || type === 'DISPOSISI') {
    return detail.value.catatan || '';
  }
  return detail.value.konten || '';
});

const dispositionData = computed(() => {
  if (!detail.value) return null;
  const type = (detail.value.jenis || currentJenis.value).toUpperCase();

  if (type === 'DI' || type === 'DISPOSISI') {
    if (detail.value.disposisi) {
      return { instruksi: detail.value.disposisi };
    }
    if (detail.value.detail_disposisi) {
      return { instruksi: detail.value.detail_disposisi.disposisi };
    }
  }
  return null;
});

// --- LIFECYCLE ---
watch(contentToDisplay, async () => {
  await nextTick();
  setTimeout(resizeIframe, 100);
});

onUnmounted(() => {
  if (activePdfUrl.value && activePdfUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(activePdfUrl.value);
  }
});

onMounted(async () => {
  if (idNaskah) {
    // [FIX] Mengambil jenis yang benar saat komponen di-mount
    await fetchDetail(idNaskah, currentJenis.value);
  }
});
</script>

<template>
  <PageHeader title="Detail Terkirim" :items="breadcrumbs" />
  <div class="w-full flex flex-col rounded-xl shadow-sm glass-blue">
    <div class="flex-1 ">

      <div v-if="isLoading" class="flex flex-col items-center bg-white rounded-xl justify-center h-full gap-3 py-10">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <span class="text-xs text-gray-500">Memuat data...</span>
      </div>

      <div v-else-if="detail"
        class="max-w-5xl w-full bg-white dark:bg-gray-900 rounded-xl dark:border-gray-800 overflow-hidden">

        <div
          class="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 z-30 bg-white dark:bg-gray-900 transition-colors">
          <div class="flex items-center gap-3 min-w-0">
            <button @click="goBack"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-300 shrink-0 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700">
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

        <div class="p-5 sm:p-8 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
            {{ detail.perihal || '-' }}
          </h2>

          <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div class="flex items-center gap-1">
              <Hash class="w-3.5 h-3.5" />
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">
                {{ detail.nomor }}
              </span>
            </div>

            <span class="opacity-40">•</span>

            <div class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5" />
              <span>{{ formatDate(detail.tanggal) }}</span>
            </div>

            <span class="opacity-40">•</span>

            <div
              class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              :class="categoryStyle">
              <Tag class="w-3 h-3" />
              {{ categoryLabel }}
            </div>
          </div>

        </div>

        <div class="p-5 sm:p-8 bg-gray-50/60 dark:bg-gray-950/40 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-start gap-4">
            <UAvatar size="md"
              class="group-hover:ring-primary-500/50 transition-all bg-primary-400 text-white font-semibold flex items-center justify-center shrink-0">
              {{ getInitials(detail.pengirim?.nama || '') }}
            </UAvatar>

            <div class="flex-1 min-w-0 space-y-6">
              <div>
                <span class="text-sm font-semibold text-gray-900 dark:text-white block">
                  {{ detail.pengirim?.positionText || detail.pengirim?.nama }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  {{ detail.pengirim?.nama }}
                </span>
              </div>

              <div class="grid grid-cols-1 gap-6">
                <div class="flex flex-col md:flex-row">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-2 mt-0.5">Kepada
                  </div>
                  <div class="flex flex-col">
                    <template
                      v-if="['SDE', 'EXTERNAL', 'EKSTERNAL'].includes((detail.jenis || currentJenis).toUpperCase())">
                      <div v-for="(penerima, idx) in visiblePenerima" :key="idx"
                        class="flex items-start gap-2 text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm">
                        <span v-if="totalRecipientCount > 2"
                          class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">
                          {{ idx + 1 }}.
                        </span>
                        <div class="break-words">
                          <span class="font-medium">{{ penerima.nama }}</span>
                        </div>
                      </div>
                      <button v-if="remainingCount > 0" @click="showAllRecipients = !showAllRecipients"
                        class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1">
                        {{ showAllRecipients ? 'Sembunyikan' : `+${remainingCount} lainnya` }}
                      </button>
                    </template>

                    <template v-else>
                      <div v-for="(penerima, idx) in visiblePenerima" :key="idx"
                        class="flex items-start gap-2 text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm">
                        <span v-if="totalRecipientCount > 2"
                          class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">
                          {{ idx + 1 }}.
                        </span>
                        <div class="break-words">
                          <span class="font-medium">{{ penerima.positionText || penerima.nama }}</span>
                          <span v-if="penerima.positionText" class="text-gray-500 font-normal ml-1 text-xs">
                            ({{ penerima.nama }})
                          </span>
                        </div>
                      </div>
                      <button v-if="remainingCount > 0" @click="showAllRecipients = !showAllRecipients"
                        class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1">
                        {{ showAllRecipients ? 'Sembunyikan' : `+${remainingCount} lainnya` }}
                      </button>
                    </template>

                  </div>
                </div>

                <div class="flex flex-col md:flex-row" v-if="detail.tembusan && detail.tembusan.length > 0">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-2 mt-0.5">Tembusan
                  </div>
                  <div class="flex flex-col">
                    <div v-for="(cc, idx) in visibleTembusan" :key="idx"
                      class="flex items-start gap-2 text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm">
                      <span v-if="totalCCCount > 2" class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">
                        {{ idx + 1 }}.
                      </span>
                      <div class="break-words">
                        <span class="font-medium">{{ cc.positionText || cc.nama }}</span>
                        <span v-if="cc.positionText" class="text-gray-500 font-normal ml-1 text-xs">
                          ({{ cc.nama }})
                        </span>
                      </div>
                    </div>
                    <button v-if="remainingCCCount > 0" @click="showAllCC = !showAllCC"
                      class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1">
                      {{ showAllCC ? 'Sembunyikan' : `+${remainingCCCount} lainnya` }}
                    </button>
                  </div>
                </div>

                <div class="flex flex-col md:flex-row" v-if="dispositionData">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-2 mt-0.5">
                    Instruksi
                  </div>
                  <div class="flex flex-col">
                    <div class="text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm whitespace-pre-line">
                      <span class="font-medium">{{ dispositionData.instruksi }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div class="p-5 sm:p-8 min-h-[150px] bg-white dark:bg-gray-900">
          <div class="relative overflow-hidden transition-all duration-500 ease-in-out"
            :class="[(showReadMoreButton && !isContentExpanded) ? 'max-h-[300px]' : 'max-h-full pb-6']">

            <iframe ref="iframe" :srcdoc="contentToDisplay" class="w-full bg-transparent block" style="border: none;"
              scrolling="no">
            </iframe>

            <div v-show="showReadMoreButton && !isContentExpanded"
              class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 z-10 pointer-events-none flex items-end justify-center pb-2">
            </div>
          </div>

          <div v-if="showReadMoreButton" class="flex justify-center mt-[-20px] relative z-20">
            <button @click="toggleContent"
              class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
              <span v-if="!isContentExpanded" class="flex items-center gap-1">
                <MoreHorizontal class="w-4 h-4" /> BACA SELENGKAPNYA
              </span>
              <span v-else class="flex items-center gap-1">
                <ChevronUp class="w-4 h-4" /> TUTUP KONTEN
              </span>
            </button>
          </div>
        </div>

        <div v-if="detail.lampiran_files && detail.lampiran_files.length > 0"
          class="px-5 sm:px-8 py-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/20">
          <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Paperclip class="w-3.5 h-3.5" /> Lampiran
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
            <button v-for="file in detail.lampiran_files" :key="file.id"
              @click="openDocumentPreview(file.fileUrl, file.fileName)"
              class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 transition-all text-center flex flex-col h-full overflow-hidden group">
              <div class="p-2 w-full">
                <div
                  class="h-24 rounded-lg bg-gray-100 dark:bg-gray-700/40 flex flex-col items-center justify-center gap-1 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors">
                  <FileText class="w-6 h-6 text-red-500" />
                  <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400">PDF</span>
                </div>
              </div>
              <div class="px-3 pb-3 flex-1 flex items-center justify-center">
                <p class="text-xs font-medium text-gray-700 dark:text-gray-200 leading-snug line-clamp-2 break-all">
                  {{ file.fileName }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <div v-if="detail.detail_disposisi" class="px-5 sm:px-8 pb-8 pt-4 bg-white dark:bg-gray-900">
          <div class="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-lg p-4">
            <div class="flex gap-3">
              <span class="text-lg pt-0.5">📝</span>
              <div>
                <h4 class="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1">
                  Instruksi Disposisi
                </h4>
                <p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                  {{ detail.detail_disposisi.disposisi }}
                </p>
                <div v-if="detail.detail_disposisi.catatan"
                  class="mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                  <p class="text-xs text-gray-500 italic">"{{ detail.detail_disposisi.catatan }}"</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <USlideover v-model:open="showPdfModal" :title="previewTitle" side="bottom" :ui="{
      content: 'h-[90vh] sm:h-screen max-h-screen rounded-t-2xl sm:rounded-none',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }">
      <template #body>
        <div class="w-full h-full relative bg-gray-100 dark:bg-gray-900 flex flex-col">

          <div v-if="isLocalPdfLoading"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 z-20">
            <Loader2 class="w-10 h-10 animate-spin text-blue-600 mb-2" />
            <span class="text-xs text-gray-500">Memuat Dokumen...</span>
          </div>

          <iframe v-if="activePdfUrl" :src="activePdfUrl" class="w-full h-full border-none flex-1" />

          <div v-else-if="!isLocalPdfLoading"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
            <FileText class="w-12 h-12 opacity-30" />
            <span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
          </div>

        </div>
      </template>
    </USlideover>

  </div>
</template>
