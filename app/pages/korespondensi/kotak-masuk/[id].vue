<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch, onUnmounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import {
  Hash,
  Calendar,
  Tag,
  Paperclip,
  FileText,
  Loader2,
  X,
  ArrowLeft,
  Printer,
  MoreHorizontal,
  ChevronUp
} from "lucide-vue-next";

// --- SETUP & COMPOSABLES ---
const route = useRoute();
const router = useRouter();
const id = route.params.id as string;
const jenis = route.query.jenis as string;
const { fetchInboxDetail } = useInbox(null);

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Kotak Masuk", to: "/korespondensi/kotak-masuk" },
  { label: "Detail Surat", to: "#" },
];

// --- CONSTANTS ---
const LIMIT_DISPLAY = 2;
const MAX_CONTENT_HEIGHT = 300;

// --- STATE ---
const selected = ref<any>(null);
const iframe = ref<HTMLIFrameElement | null>(null);
const isLoading = ref(true);

// State UI Logic
const showAllKepada = ref(false);
const showAllTembusan = ref(false);
const isContentExpanded = ref(false);
const showReadMoreButton = ref(false);

// State PDF Preview
const isPreviewOpen = ref(false);
const previewTitle = ref("Preview Dokumen");
const activePdfUrl = ref<string | null>(null);
const isPdfLoading = ref(false);

/* ===============================
   FETCH DATA
================================ */
onMounted(async () => {
  if (!jenis) {
    console.error("Jenis naskah tidak ditemukan di query");
    return;
  }
  try {
    isLoading.value = true;
    selected.value = await fetchInboxDetail(id, jenis);
  } finally {
    isLoading.value = false;
  }
});

/* ===============================
   COMPUTED HELPERS
================================ */
const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const senderInitials = computed(() => {
  const name = selected.value?.pengirim?.nama;
  if (!name) return "?";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n: string) => n.charAt(0).toUpperCase())
    .join("");
});

const categoryStyle = computed(() => {
  const c = (selected.value?.jenis_label || jenis || '').toUpperCase();
  if (['ND', 'NOTA DINAS'].includes(c)) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300';
  if (['SDI', 'INTERNAL', 'KA', 'SURAT DINAS INTERNAL'].includes(c)) return 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300';
  if (['SDE', 'EXTERNAL', 'EKSTERNAL', 'SURAT DINAS EKSTERNAL'].includes(c)) return 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300';
  if (['KAJIAN'].includes(c)) return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-300';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
});

const isJenisDI = computed(() => selected.value?.jenis === "DI");

/* ===============================
   RECIPIENT LOGIC (Expanded/Collapsed)
================================ */
const kepadaList = computed(() => Array.isArray(selected.value?.kepada) ? selected.value.kepada : []);
const tembusanList = computed(() => Array.isArray(selected.value?.tembusan) ? selected.value.tembusan : []);

const displayedKepada = computed(() => {
  if (showAllKepada.value) return kepadaList.value;
  return kepadaList.value.slice(0, LIMIT_DISPLAY);
});

const displayedTembusan = computed(() => {
  if (showAllTembusan.value) return tembusanList.value;
  return tembusanList.value.slice(0, LIMIT_DISPLAY);
});

const hiddenKepadaCount = computed(() => Math.max(kepadaList.value.length - LIMIT_DISPLAY, 0));
const hiddenTembusanCount = computed(() => Math.max(tembusanList.value.length - LIMIT_DISPLAY, 0));

/* ===============================
   IFRAME & READ MORE LOGIC
================================ */
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

const toggleContent = () => {
  isContentExpanded.value = !isContentExpanded.value;
};

watch(() => selected.value?.konten, async () => {
  await nextTick();
  setTimeout(resizeIframe, 100);
});

/* ===============================
   PREVIEW PDF & UTILS
================================ */
const goBack = () => router.back();

const openPreview = async (file: any) => {
  previewTitle.value = file.fileName;
  isPreviewOpen.value = true;
  isPdfLoading.value = true;
  activePdfUrl.value = null;

  try {
    const res = await fetch(file.fileUrl);
    const buffer = await res.arrayBuffer();
    const blob = new Blob([buffer], { type: "application/pdf" });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch (err) {
    activePdfUrl.value = file.fileUrl;
  } finally {
    isPdfLoading.value = false;
  }
};

const openMainPdfPreview = () => {
  // Logic untuk tombol printer di header (jika ada file utama)
  // Implementasi sederhana: alert jika tidak ada
  alert('Fitur cetak belum tersedia');
};

onUnmounted(() => {
  if (activePdfUrl.value?.startsWith("blob:")) {
    URL.revokeObjectURL(activePdfUrl.value);
  }
});
</script>

<template>
  <PageHeader title="Detail Masuk" :items="breadcrumbs" />

  <div class="w-full flex flex-col rounded-xl shadow-sm glass-blue">
    <div class="flex-1">

      <div v-if="isLoading" class="flex flex-col items-center bg-white rounded-xl justify-center h-full gap-3 py-10">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <span class="text-xs text-gray-500">Memuat data...</span>
      </div>

      <div v-else-if="selected"
        class="max-w-5xl mx-auto w-full bg-white dark:bg-gray-900 rounded-xl dark:border-gray-800 overflow-hidden">

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
              title="Cetak / Preview PDF" @click="openMainPdfPreview">
              <Printer class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="p-5 sm:p-8 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
            {{ selected.perihal || '-' }}
          </h2>
          <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div class="flex items-center gap-1">
              <Hash class="w-3.5 h-3.5" />
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">
                {{ selected.nomor || '-' }}
              </span>
            </div>
            <span class="opacity-40">•</span>
            <div class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5" />
              <span>{{ formatDate(selected.tanggal) }}</span>
            </div>
            <span class="opacity-40">•</span>
            <div
              class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              :class="categoryStyle">
              <Tag class="w-3 h-3" />
              {{ selected.jenis_label || '-' }}
            </div>
          </div>
        </div>

        <div class="p-5 sm:p-8 bg-gray-50/60 dark:bg-gray-950/40 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-start gap-4">
            <UAvatar size="md"
              class="group-hover:ring-primary-500/50 transition-all bg-primary-400 text-white font-semibold flex items-center justify-center shrink-0">
              {{ senderInitials }}
            </UAvatar>
            <div class="flex-1 min-w-0 space-y-6">

              <div>
                <span class="text-sm font-semibold text-gray-900 dark:text-white block">
                  {{ selected.pengirim?.positionText || '-' }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  {{ selected.pengirim?.nama || '-' }}
                </span>
              </div>

              <div class="grid grid-cols-1 gap-6">

                <div class="flex flex-col md:flex-row">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-2 mt-0.5">Kepada
                  </div>
                  <div class="flex flex-col">
                    <div v-for="(k, idx) in displayedKepada" :key="idx"
                      class="flex items-start gap-2 text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm">
                      <span v-if="kepadaList.length > 2"
                        class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">
                        {{ idx + 1 }}.
                      </span>
                      <div class="break-words">
                        <span class="font-medium">{{ k.positionText }}</span>
                        <span class="text-gray-500 font-normal ml-1 text-xs">({{ k.nama }})</span>
                      </div>
                    </div>
                    <button v-if="hiddenKepadaCount > 0" @click="showAllKepada = !showAllKepada"
                      class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1">
                      {{ showAllKepada ? 'Sembunyikan' : `+${hiddenKepadaCount} lainnya` }}
                    </button>
                  </div>
                </div>

                <div v-if="tembusanList.length > 0" class="flex flex-col md:flex-row">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-2 mt-0.5">Tembusan
                  </div>
                  <div class="flex flex-col">
                    <div v-for="(t, idx) in displayedTembusan" :key="idx"
                      class="flex items-start gap-2 text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm">
                      <span v-if="tembusanList.length > 2"
                        class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">
                        {{ idx + 1 }}.
                      </span>
                      <div class="break-words">
                        <span class="font-medium">{{ t.positionText }}</span>
                        <span class="text-gray-500 font-normal ml-1 text-xs">({{ t.nama }})</span>
                      </div>
                    </div>
                    <button v-if="hiddenTembusanCount > 0" @click="showAllTembusan = !showAllTembusan"
                      class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1">
                      {{ showAllTembusan ? 'Sembunyikan' : `+${hiddenTembusanCount} lainnya` }}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div class="p-5 sm:p-8 min-h-[150px] bg-white dark:bg-gray-900">
          <div class="relative overflow-hidden transition-all duration-500 ease-in-out"
            :class="[(showReadMoreButton && !isContentExpanded) ? 'max-h-[300px]' : 'max-h-full pb-6']">
            <iframe ref="iframe" :srcdoc="selected.konten || ''" class="w-full bg-transparent block"
              style="border: none;" scrolling="no"></iframe>

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

        <div v-if="selected.lampiran_files && selected.lampiran_files.length > 0"
          class="px-5 sm:px-8 py-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/20">
          <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Paperclip class="w-3.5 h-3.5" /> Lampiran
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
            <button v-for="file in selected.lampiran_files" :key="file.id" @click="openPreview(file)"
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

        <div
          class="p-5 sm:p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 w-full flex flex-wrap gap-3">
          <div
            class="flex-1 min-w-[200px] flex bg-primary-500 hover:bg-primary-600 cursor-pointer py-2.5 px-4 rounded-lg text-white gap-2 justify-center items-center transition-colors shadow-sm">
            <FileText class="w-4 h-4" />
            <button class="text-sm font-medium">Lanjut Nota Dinas</button>
          </div>
          <div
            class="flex-1 min-w-[200px] flex bg-purple-500 hover:bg-purple-600 cursor-pointer py-2.5 px-4 rounded-lg text-white gap-2 justify-center items-center transition-colors shadow-sm">
            <FileText class="w-4 h-4" />
            <button class="text-sm font-medium">Lanjut Disposisi</button>
          </div>
          <div v-if="isJenisDI"
            class="flex-1 min-w-[200px] flex bg-gray-600 hover:bg-gray-700 cursor-pointer py-2.5 px-4 rounded-lg text-white gap-2 justify-center items-center transition-colors shadow-sm">
            <FileText class="w-4 h-4" />
            <button class="text-sm font-medium">Lanjut Konsep</button>
          </div>
        </div>

      </div>
    </div>

    <USlideover v-model:open="isPreviewOpen" :title="previewTitle" side="bottom" :ui="{
      content: 'h-[90vh] sm:h-screen max-h-screen rounded-t-2xl sm:rounded-none',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }">
      <template #body>
        <div class="w-full h-full relative bg-gray-100 dark:bg-gray-900 flex flex-col">
          <div v-if="isPdfLoading"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 z-20">
            <Loader2 class="w-10 h-10 animate-spin text-blue-600 mb-2" />
            <span class="text-xs text-gray-500">Memuat Dokumen...</span>
          </div>
          <iframe v-if="activePdfUrl" :src="activePdfUrl" class="w-full h-full border-none flex-1" />
          <div v-else-if="!isPdfLoading" class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
            <FileText class="w-12 h-12 opacity-30" />
            <span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
          </div>
        </div>
      </template>
    </USlideover>

  </div>
</template>
