<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch, onUnmounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import {
  Hash, Calendar, Tag, Paperclip, FileText, Loader2, X, ArrowLeft, Printer, MoreHorizontal, ChevronUp, Info, CheckSquare, Edit3, Users, Building2, ChevronRight, Send, ChevronDown, FileType,
  Archive,
  Star
} from "lucide-vue-next";

// --- SETUP & COMPOSABLES ---
const route = useRoute();
const router = useRouter();
// Asumsi: useInbox sudah di-import secara global atau auto-import oleh Nuxt/Vue
const { fetchInboxDetail } = useInbox(null);

const id = route.params.id as string;
const jenis = route.query.jenis as string;

// --- STATE DROPDOWN MENU ---
const showKonsepMenu = ref(false)

const toggleKonsepMenu = () => {
  showKonsepMenu.value = !showKonsepMenu.value
}

const selectKonsepOption = (option: string) => {
  console.log('Selected option:', option)
  showKonsepMenu.value = false
  // Logika navigasi tambahan bisa ditaruh di sini
  // Misalnya: if (option === 'draft') router.push(...)
}

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
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
   MANUAL FETCH DATA
================================ */
const loadData = async () => {
  if (!jenis) return;
  isLoading.value = true;

  try {
    const result = await fetchInboxDetail(id, jenis);

    if (result && result.raw && result.raw.flow && Array.isArray(result.raw.flow) && result.raw.flow.length > 0) {
      const flowItem = result.raw.flow[0];

      selected.value = {
        id: flowItem.id,
        nomor: flowItem.nomor || '-',
        tanggal: flowItem.tanggal,
        perihal: flowItem.perihal,
        jenis: flowItem.jenis,
        jenis_label: flowItem.jenis === 'DI' ? 'DISPOSISI' : (flowItem.jenis || 'SURAT'),
        sifat: flowItem.sifat,
        status: flowItem.status,
        disposisi: flowItem.disposisi,
        catatan: flowItem.catatan,
        kepada_yth: flowItem.kepada_yth,
        pengirim: flowItem.pengirim,
        kepada: flowItem.penerima || [],
        tembusan: flowItem.tembusan || [],
        konten: flowItem.konten || result.konten,
        lampiran_files: flowItem.lampiran_files || [],
        final_pdf_url: flowItem.final_pdf_url || flowItem.final_pdf
      };

    } else {
      selected.value = result;
    }

  } catch (e) {
    console.error("Error loading data", e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadData();
});

/* ===============================
   COMPUTED HELPERS
================================ */
const formatDate = (value?: string) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch (e) { return value; }
};

// Helper baru untuk format disposisi (ganti enter jadi koma)
const formatDisposisiInline = (val: any) => {
  if (!val) return '';
  if (Array.isArray(val)) return val.join(', ');
  // Ganti semua jenis newline (\n, \r, \r\n) dengan koma dan spasi
  return String(val).replace(/(\r\n|\n|\r)/gm, ", ");
};

const senderInitials = computed(() => {
  const p = selected.value?.pengirim;
  const name = p?.nama || p?.name;
  if (!name) return "?";
  return name.trim().split(" ").filter(Boolean).slice(0, 2)
    .map((n: string) => n.charAt(0).toUpperCase()).join("");
});

const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS'].includes(c)) return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300';
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c)) return 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300';
  if (['SDE', 'SURAT DINAS EKSTERNAL'].includes(c)) return 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300';
  if (['KAJIAN', 'KA'].includes(c)) return 'bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300';
  return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
};

// --- FIX ERROR "Return outside function" DI SINI ---
const isJenisDI = computed(() => {
  const j = selected.value?.jenis || '';
  const l = selected.value?.jenis_label || '';
  return j.toUpperCase() === "DI" || l.toUpperCase().includes("DISPOSISI");
});

/* ===============================
   RECIPIENT LOGIC
================================ */
const kepadaList = computed(() => {
  const list = selected.value?.kepada || [];
  return Array.isArray(list) ? list : [];
});
const tembusanList = computed(() => {
  const list = selected.value?.tembusan || [];
  return Array.isArray(list) ? list : [];
});

const displayedKepada = computed(() => showAllKepada.value ? kepadaList.value : kepadaList.value.slice(0, LIMIT_DISPLAY));
const displayedTembusan = computed(() => showAllTembusan.value ? tembusanList.value : tembusanList.value.slice(0, LIMIT_DISPLAY));
const hiddenKepadaCount = computed(() => Math.max(kepadaList.value.length - LIMIT_DISPLAY, 0));
const hiddenTembusanCount = computed(() => Math.max(tembusanList.value.length - LIMIT_DISPLAY, 0));

/* ===============================
   IFRAME & READ MORE
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
const toggleContent = () => isContentExpanded.value = !isContentExpanded.value;
watch(() => selected.value?.konten, async () => { await nextTick(); setTimeout(resizeIframe, 100); });

/* ===============================
   PREVIEW PDF
================================ */
const goBack = () => router.back();
const openPreview = async (file: any) => {
  previewTitle.value = file.fileName || file.file_name || "Dokumen";
  isPreviewOpen.value = true;
  isPdfLoading.value = true;
  activePdfUrl.value = null;
  const url = file.fileUrl || file.file_url || file.file_path;
  if (!url) { isPdfLoading.value = false; return; }
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const blob = new Blob([buffer], { type: "application/pdf" });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch (err) { activePdfUrl.value = url; }
  finally { isPdfLoading.value = false; }
};
const openMainPdfPreview = async () => {
  const fileUrl = selected.value?.final_pdf_url;
  if (!fileUrl) { alert('File PDF utama tidak ditemukan.'); return; }
  previewTitle.value = selected.value?.perihal || "Preview Dokumen";
  isPreviewOpen.value = true;
  isPdfLoading.value = true;
  try {
    const res = await fetch(fileUrl);
    const buffer = await res.arrayBuffer();
    const blob = new Blob([buffer], { type: "application/pdf" });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch (err) { activePdfUrl.value = fileUrl; }
  finally { isPdfLoading.value = false; }
};
onUnmounted(() => { if (activePdfUrl.value?.startsWith("blob:")) URL.revokeObjectURL(activePdfUrl.value); });

// --- KONSEP MODAL LOGIC (Existing) ---
const isOpenKonsepModal = ref(false);
const konsepOptions = [
  {
    type: 'ND',
    label: 'Nota Dinas',
    desc: 'Untuk komunikasi internal antar unit kerja',
    path: '/korespondensi/tulis/nota-dinas',
    icon: FileText,
    colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  },
  {
    type: 'SDI',
    label: 'Surat Dinas Internal',
    desc: 'Surat resmi untuk keperluan internal organisasi',
    path: '/korespondensi/tulis/surat-dinas-internal',
    icon: Users,
    colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
  },
  {
    type: 'SDE',
    label: 'Surat Dinas Eksternal',
    desc: 'Surat resmi untuk pihak eksternal atau mitra',
    path: '/korespondensi/tulis/surat-dinas-eksternal',
    icon: Building2,
    colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
  }
];
const handleLanjutKonsep = () => { isOpenKonsepModal.value = true; };
const handleLanjutNotaDinas = () => { /* Logic Nota Dinas */ };
const selectKonsep = (option: any) => {
  isOpenKonsepModal.value = false;
  if (!selected.value?.id) return;
  router.push({
    path: option.path,
    query: {
      ref_id: selected.value.id,
      workflow: 'konsep',
      ref_jenis: selected.value.jenis
    }
  });
};
</script>

<template>
  <PageHeader title="Detail Masuk" :items="breadcrumbs" />

  <div class="w-full flex flex-col rounded-xl shadow-sm glass-blue">
    <div class="flex-1">

      <div v-if="isLoading" class="w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse">
        <div class="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4">
          <div class="flex items-center gap-3 min-w-0">
            <button @click="goBack"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-300 shrink-0 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700">
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div class="flex flex-col min-w-0">
              <h1 class="text-base font-semibold text-gray-900 dark:text-white truncate">Kembali</h1>
            </div>
          </div>
          <div class="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <div class="p-5 sm:p-8 border-b border-gray-100 dark:border-gray-800">
          <div class="h-8 w-3/4 sm:w-1/2 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
          <div class="flex gap-2">
            <div class="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            <div class="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            <div class="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
          </div>
        </div>
        <div class="p-5 sm:p-8 bg-gray-50/60 dark:bg-gray-950/40">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0"></div>
            <div class="flex-1 space-y-4">
              <div class="space-y-2">
                <div class="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div class="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
              </div>
              <div class="space-y-2 mt-4">
                <div class="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div class="h-16 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="p-5 sm:p-8 h-64 bg-white dark:bg-gray-900">
          <div class="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
          <div class="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
          <div class="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>

      <div v-else-if="selected"
        class="w-full bg-white dark:bg-gray-900 rounded-xl dark:border-gray-800 overflow-hidden">

        <div
          class="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 z-30 bg-white dark:bg-gray-900 transition-colors">

          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <button @click="goBack"
              class="rounded-full text-gray-600 dark:text-gray-300 shrink-0 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700">
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div class="flex flex-col min-w-0">
              <h1 class="text-base font-semibold text-gray-900 dark:text-white truncate">Kembali</h1>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">

            <UTooltip text="Tandai Favorit">
              <button
                class="p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 transition-colors">
                <Star class="w-4 h-4" />
              </button>
            </UTooltip>

            <UTooltip text="Tindak Lanjut">
              <button
                class="p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 transition-colors">
                <Tag class="w-4 h-4 -rotate-45" />
              </button>
            </UTooltip>

            <UTooltip text="Arsipkan">
              <button
                class="p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 transition-colors">
                <Archive class="w-4 h-4" />
              </button>
            </UTooltip>

            <UTooltip text="Pratinjau Surat">
              <button @click="openMainPdfPreview"
                class="p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 transition-colors">
                <Printer class="w-4 h-4" />
              </button>
            </UTooltip>

          </div>
        </div>

        <div class="p-5 sm:p-8 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">

          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-4 break-words">
            {{ selected.perihal || '(Tidak ada perihal)' }}
          </h2>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600 dark:text-gray-400">

            <div class="flex items-center gap-1 shrink-0">
              <Hash class="w-3.5 h-3.5" />
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">
                {{ selected.nomor || '-' }}
              </span>
            </div>

            <span class="opacity-40 hidden sm:inline">•</span>

            <div class="flex items-center gap-1 shrink-0">
              <Calendar class="w-3.5 h-3.5" />
              <span>{{ formatDate(selected.tanggal) }}</span>
            </div>

            <span class="opacity-40 hidden sm:inline">•</span>

            <div
              class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
              :class="getCategoryStyle(selected.jenis_label)">
              <Tag class="w-3 h-3" />
              {{ selected.jenis_label }}
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
                  {{ selected.pengirim?.positionText || selected.pengirim?.position_text || '-' }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  {{ selected.pengirim?.nama || '-' }}
                </span>
              </div>

              <div class="grid grid-cols-1 gap-6">
                <div class="flex flex-col md:flex-row">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-25 mb-2 mt-0.5">Kepada
                  </div>
                  <div class="flex flex-col">
                    <div v-for="(k, idx) in displayedKepada" :key="idx"
                      class="flex items-start gap-2 text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm">
                      <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ idx + 1 }}.</span>
                      <div class="break-words">
                        <span class="font-medium">{{ k.nama }}</span>
                        <span v-if="k.position_text" class="text-gray-500 font-normal ml-1 text-xs">({{ k.position_text
                        }})</span>
                      </div>
                    </div>
                    <button v-if="hiddenKepadaCount > 0" @click="showAllKepada = !showAllKepada"
                      class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1">
                      {{ showAllKepada ? 'Sembunyikan' : `+${hiddenKepadaCount} lainnya` }}
                    </button>
                  </div>
                </div>

                <div v-if="tembusanList.length > 0" class="flex flex-col md:flex-row">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-25 mb-2 mt-0.5">
                    Tembusan
                  </div>
                  <div class="flex flex-col">
                    <div v-for="(t, idx) in displayedTembusan" :key="idx"
                      class="flex items-start gap-2 text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm">
                      <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ idx + 1 }}.</span>
                      <div class="break-words">
                        <span class="font-medium">{{ t.nama }}</span>
                        <span v-if="t.position_text" class="text-gray-500 font-normal ml-1 text-xs">({{ t.position_text
                        }})</span>
                      </div>
                    </div>
                    <button v-if="hiddenTembusanCount > 0" @click="showAllTembusan = !showAllTembusan"
                      class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1">
                      {{ showAllTembusan ? 'Sembunyikan' : `+${hiddenTembusanCount} lainnya` }}
                    </button>
                  </div>
                </div>

                <div v-if="selected.disposisi" class="flex flex-col md:flex-row">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-25 mb-2 mt-0.5">
                    Disposisi
                  </div>
                  <div class="flex flex-col">
                    <div class="text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm">
                      <span class="font-medium">{{ formatDisposisiInline(selected.disposisi) }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div class="p-5 sm:p-8 min-h-[150px] bg-white dark:bg-gray-900">

          <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-2 mt-0.5">Catatan</div>
          <div class="prose prose-sm prose-blue max-w-none text-gray-800 dark:text-gray-300" v-html="selected.catatan">
          </div>

          <div class="relative overflow-hidden transition-all duration-500 ease-in-out"
            :class="[(showReadMoreButton && !isContentExpanded) ? 'max-h-[300px]' : 'max-h-full pb-6']">

            <div v-if="!selected.konten" class="text-gray-400 italic text-sm py-4">
              Tidak ada konten tambahan.
            </div>

            <iframe v-else ref="iframe" :srcdoc="selected.konten" class="w-full bg-transparent block"
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
                  {{ file.fileName || file.file_name }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <div
          class="p-5 sm:p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 w-full flex flex-col sm:flex-row flex-wrap gap-3">

          <div @click="handleLanjutNotaDinas"
            class="w-full sm:w-auto flex bg-emerald-600 hover:bg-emerald-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 justify-center items-center transition-colors shadow-sm active:scale-[0.98]">
            <FileText class="w-4 h-4" />
            <span class="text-sm font-medium whitespace-nowrap">Lanjut Nota Dinas</span>
          </div>

          <div
            class="w-full sm:w-auto flex bg-sky-600 hover:bg-sky-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 justify-center items-center transition-colors shadow-sm active:scale-[0.98]">
            <Send class="w-4 h-4" />
            <span class="text-sm font-medium whitespace-nowrap">Lanjut Disposisi</span>
          </div>

          <div v-if="isJenisDI" class="relative w-full sm:w-auto">

            <div @click="toggleKonsepMenu"
              class="w-full sm:w-auto flex bg-yellow-500 hover:bg-yellow-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 justify-center items-center transition-colors shadow-sm active:scale-[0.98] select-none">
              <Edit3 class="w-4 h-4" />
              <span class="text-sm font-medium whitespace-nowrap">Lanjut Konsep</span>
              <ChevronDown class="w-4 h-4 transition-transform duration-200 ml-1"
                :class="{ 'rotate-180': showKonsepMenu }" />
            </div>

            <Transition enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0">

              <div v-if="showKonsepMenu"
                class="absolute bottom-full mb-2 left-0 w-full sm:w-auto sm:min-w-[240px] sm:left-auto sm:right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">

                <ul class="py-1 text-sm text-gray-700 dark:text-gray-200">
                  <li>
                    <button @click="selectKonsepOption('draft')"
                      class="flex items-center gap-2 w-full px-4 py-3 sm:py-2 text-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                      Lanjut Nota Dinas
                    </button>
                  </li>
                  <li>
                    <button @click="selectKonsepOption('review')"
                      class="flex items-center gap-2 w-full px-4 py-3 sm:py-2 text-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                      Lanjut Surat Dinas Internal
                    </button>
                  </li>
                  <li>
                    <button @click="selectKonsepOption('review')"
                      class="flex items-center gap-2 w-full px-4 py-3 sm:py-2 text-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                      Lanjut Surat Dinas Eksternal
                    </button>
                  </li>
                </ul>
              </div>
            </Transition>

            <div v-if="showKonsepMenu" @click="showKonsepMenu = false"
              class="fixed inset-0 z-40 bg-transparent cursor-default"></div>

          </div>
        </div>

      </div>
    </div>

    <UModal v-model:open="isOpenKonsepModal" :dismissible="false" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header>
        <div class="w-full flex justify-between items-start">
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">Pilih Jenis Konsep</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Pilih jenis konsep surat yang ingin Anda buat</p>
          </div>
          <button @click="isOpenKonsepModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors -mt-1 -mr-1 p-1">
            <X class="w-5 h-5" />
          </button>
        </div>
      </template>
      <template #body>
        <div class="space-y-3">
          <div v-for="(opt, idx) in konsepOptions" :key="idx" @click="selectKonsep(opt)"
            class="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 cursor-pointer transition-all duration-200">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
              :class="opt.colorClass">
              <component :is="opt.icon" class="w-6 h-6" />
            </div>
            <div class="flex-1 min-w-0">
              <h4
                class="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {{ opt.label }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{{ opt.desc }}</p>
            </div>
            <ChevronRight class="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
          </div>
        </div>
      </template>
    </UModal>

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
            <FileText class="w-12 h-12l opacity-30" />
            <span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
          </div>
        </div>
      </template>
    </USlideover>

  </div>
</template>
