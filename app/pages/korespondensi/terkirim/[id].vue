<template>
  <PageHeader title="Detail Naskah" :items="breadcrumbs" />

  <div class="w-full flex flex-col gap-6 pt-4">
    <div v-if="isLoading"
      class="w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse shadow-sm border border-gray-200 dark:border-gray-800">
      <div
        class="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 bg-gray-50 dark:bg-gray-900/50">
        <div class="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
      </div>
      <div class="p-8 space-y-4">
        <div class="h-8 w-1/2 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div class="h-32 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
    </div>

    <template v-else-if="details && details.length > 0">
      <div v-for="(detail, index) in details" :key="detail.id || index"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md relative transition-all duration-300">

        <div class="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div class="h-14 flex items-center justify-between px-4 shrink-0">
            <div class="flex items-center gap-2 min-w-0 overflow-hidden">
              <template v-if="index === 0">
                <button @click="goBack"
                  class="rounded-full text-gray-600 dark:text-gray-300 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 transition-colors mr-1">
                  <ArrowLeft class="w-5 h-5" />
                </button>
                <div class="flex flex-col">
                  <h1 class="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">Kembali</h1>
                </div>
              </template>
              <template v-else>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                    {{ detail.jenis_label || 'Riwayat' }}
                  </h2>
                </div>
              </template>
            </div>

            <div class="flex items-center gap-1 shrink-0 pl-2">
              <UTooltip text="Pratinjau Dokumen">
                <button v-if="detail.final_pdf_url" @click="openPdfPreview(detail)"
                  class="p-2 hover:bg-blue-50 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors">
                  <Printer class="w-4 h-4" />
                </button>
              </UTooltip>
            </div>
          </div>
        </div>

        <div class="p-5 sm:p-8 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <div class="flex flex-col gap-1 w-full">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {{ detail.jenis_label === 'DISPOSISI' ? detail.catatan || '-' : detail.perihal }}
                </h2>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
            <div v-if="detail.nomor && detail.nomor !== '-'" class="flex items-center gap-1">
              <Hash class="w-3.5 h-3.5" />
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">
                {{ detail.nomor }}
              </span>
            </div>
            <span v-if="detail.nomor && detail.nomor !== '-'" class="opacity-40">•</span>
            <div class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5" />
              <span>{{ formatDate(detail.tanggal) }}</span>
            </div>
            <span class="opacity-40">•</span>
            <div
              class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
              :class="getCategoryStyle(detail.jenis_label)">
              {{ detail.jenis_label }}
            </div>
          </div>
        </div>

        <div class="p-5 sm:p-8 bg-gray-50/60 dark:bg-gray-950/40 border-b border-gray-100 dark:border-gray-800">

          <div class="flex items-start gap-4 mb-5 border-gray-200 dark:border-gray-700/50">
            <UAvatar size="md" class="bg-primary-500 text-white font-semibold">
              {{ getInitials(detail.flow_from?.nama || detail.pengirim?.nama) }}
            </UAvatar>
            <div>
              <span class="text-sm font-semibold block text-gray-900 dark:text-white">
                {{ detail.flow_from?.position_text || detail.pengirim?.position_text || '-' }}
              </span>
              <span class="text-xs text-gray-500 block mt-0.5">{{ detail.flow_from?.nama || detail.pengirim?.nama || '-'
              }}</span>
            </div>
          </div>

          <div v-if="detail.aksi === 'create' || detail.aksi === 'forward'"
            class="mb-4 flex flex-col md:flex-row gap-2">
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Pengirim
            </div>
            <div class="flex flex-col gap-1 w-full min-w-0">
              <div v-if="detail.pengirim" class="min-w-0">
                <div class="truncate min-w-0 text-sm text-gray-900 dark:text-white">
                  <span class="font-medium">{{ detail.pengirim.position_text || detail.pengirim.positionText }}</span>
                  <span class="text-xs text-gray-500 ml-1">({{ detail.pengirim.nama }})</span>
                </div>
              </div>
              <span v-else class="text-gray-400 italic text-xs">(Data pengirim tidak tersedia)</span>
            </div>
          </div>

          <div class="mb-4 flex flex-col md:flex-row gap-2">
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Tertuju</div>
            <div class="flex flex-col gap-1 max-w-full min-w-0">
              <div v-if="detail.penerima && detail.penerima.length > 0" class="flex flex-col gap-1 w-full min-w-0">
                <div v-for="(t, ti) in getVisiblePenerima(detail)" :key="ti"
                  class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 min-w-0">
                  <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ ti + 1 }}.</span>
                  <div class="min-w-0 break-words">
                    <span class="font-medium">{{ t.position_text || t.positionText || t.nama }}</span>
                    <span v-if="t.position_text || t.positionText" class="text-xs text-gray-500 ml-1">({{ t.nama
                    }})</span>
                  </div>
                </div>
                <button v-if="getRemainingRecipientCount(detail) > 0"
                  @click="detail._ui.showAllRecipients = !detail._ui.showAllRecipients"
                  class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1 text-left w-fit">
                  {{ detail._ui.showAllRecipients ? 'Sembunyikan' : `+${getRemainingRecipientCount(detail)} lainnya` }}
                </button>
              </div>
              <div v-else class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 truncate">
                <span class="text-gray-400 italic">- Tidak ada penerima -</span> {{ detail.penerima }}
              </div>
            </div>
          </div>


          <div v-if="detail.tembusan && detail.tembusan.length > 0" class="mb-6 flex flex-col md:flex-row gap-2">
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Tembusan
            </div>
            <div class="flex flex-col gap-1 w-full min-w-0">
              <div v-for="(t, ti) in getVisibleTembusan(detail)" :key="ti"
                class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0">
                <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ ti + 1 }}.</span>
                <div class="min-w-0 break-words">
                  <span class="font-medium">{{ t.position_text || t.positionText || t.nama }}</span>
                  <span v-if="t.position_text || t.positionText" class="text-xs text-gray-500 ml-1">({{ t.nama
                  }})</span>
                </div>
              </div>
              <button v-if="getRemainingCCCount(detail) > 0" @click="detail._ui.showAllCC = !detail._ui.showAllCC"
                class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1 text-left w-fit">
                {{ detail._ui.showAllCC ? 'Sembunyikan' : `+${getRemainingCCCount(detail)} lainnya` }}
              </button>
            </div>
          </div>

          <div v-if="detail.instruksi" class="mb-4 flex flex-col md:flex-row gap-2">
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Instruksi
            </div>
            <div class="flex flex-col gap-1 w-full min-w-0">
              <div class="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
                {{ detail.instruksi.replace(/\n/g, ', ') }}
              </div>
            </div>
          </div>

          <div v-if="detail.aksi === 'reject' || detail.aksi === 'create' || detail.aksi === 'forward'"
            class="mb-4 flex flex-col md:flex-row gap-2">
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Pesan
            </div>
            <div class="flex flex-col gap-1 w-full min-w-0">
              <div class="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
                {{ detail.catatan || '-' }}
              </div>
            </div>
          </div>

        </div>

        <div class="p-5 sm:p-8 min-h-[150px] bg-white dark:bg-gray-900">
          <div class="relative overflow-hidden transition-all duration-500 ease-in-out"
            :class="[(detail._ui.showReadMoreButton && !detail._ui.isContentExpanded) ? 'max-h-[300px]' : 'max-h-full pb-6']">

            <div
              class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-3 flex items-center truncate gap-2">
              {{ (detail.jenis === 'DI' || detail.jenis_label === 'DISPOSISI') ? 'Catatan Disposisi' : 'Isi Naskah' }}
            </div>

            <div v-if="(detail.jenis === 'DI' || detail.jenis_label === 'DISPOSISI') && detail.catatan"
              class="prose prose-sm prose-blue max-w-none text-gray-600 dark:text-gray-300 text-sm"
              v-html="detail.catatan">
            </div>

            <iframe v-else-if="detail.konten" :ref="(el) => setIframeRef(el, index)"
              :srcdoc="'<style>body{margin:0;padding:0;font-family:ui-sans-serif, system-ui, sans-serif; color:#374151;}</style>' + detail.konten"
              class="w-full bg-transparent block" style="border: none;" scrolling="no" @load="resizeIframe(index)">
            </iframe>

            <div v-else class="text-gray-400 text-sm italic text-center py-4">
              - Tidak ada konten teks -
            </div>

            <div v-show="detail._ui.showReadMoreButton && !detail._ui.isContentExpanded"
              class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 z-10 pointer-events-none">
            </div>
          </div>

          <div v-if="detail._ui.showReadMoreButton" class="flex justify-center mt-[-20px] relative z-20">
            <button @click="detail._ui.isContentExpanded = !detail._ui.isContentExpanded"
              class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
              <span v-if="!detail._ui.isContentExpanded" class="flex items-center gap-1">
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
            <button v-for="file in detail.lampiran_files" :key="file.id" @click="openPreviewFile(file)"
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
                  {{ file.file_name || file.fileName }}
                </p>
              </div>
            </button>
          </div>
        </div>
        <!--
        <div v-if="!isKonsepData"
          class="p-5 sm:p-8 pt-0 bg-white dark:bg-gray-900 flex flex-wrap gap-3 mt-4 border-t border-gray-100 dark:border-gray-800 pt-6">
          <div @click="handleLanjutNotaDinas"
            class="flex bg-emerald-600 hover:bg-emerald-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]">
            <FileText class="w-4 h-4" /><span class="text-sm font-bold whitespace-nowrap">Lanjut Nota Dinas</span>
          </div>
          <div @click="handleLanjutDisposisi"
            class="flex bg-sky-600 hover:bg-sky-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]">
            <Send class="w-4 h-4" /><span class="text-sm font-bold whitespace-nowrap">Lanjut Disposisi</span>
          </div>
          <div v-if="isJenisDI" @click="isOpenKonsepModal = true"
            class="flex bg-amber-500 hover:bg-amber-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]">
            <Edit3 class="w-4 h-4" /><span class="text-sm font-bold whitespace-nowrap">Lanjut Konsep</span>
          </div>
        </div> -->

      </div>
    </template>

    <UModal v-model:open="isOpenKonsepModal" :dismissible="false" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header>
        <div class="w-full flex justify-between items-start">
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">Pilih Jenis Konsep</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Pilih jenis konsep surat yang ingin Anda buat</p>
          </div>
          <button @click="isOpenKonsepModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
      </template>
      <template #body>
        <div class="space-y-3">
          <div v-for="(opt, idx) in konsepOptions" :key="idx" @click="selectKonsep(opt)"
            class="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 cursor-pointer transition-all duration-200">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
              :class="opt.colorClass">
              <component :is="opt.icon" class="w-6 h-6" />
            </div>
            <div class="flex-1 min-w-0">
              <h4
                class="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                {{ opt.label }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{{ opt.desc }}</p>
            </div>
            <ChevronRight class="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
          </div>
        </div>
      </template>
    </UModal>

    <USlideover v-model:open="isPreviewOpen" :title="previewTitle" side="bottom"
      :ui="{ content: 'h-[90vh] sm:h-screen max-h-screen rounded-t-2xl sm:rounded-none', body: 'p-0', footer: 'p-4 border-t border-gray-200 dark:border-gray-800' }">
      <template #body>
        <div class="w-full h-full relative bg-gray-100 dark:bg-gray-900 flex flex-col">
          <div v-if="isLocalPdfLoading"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 z-20">
            <Loader2 class="w-10 h-10 animate-spin text-blue-600 mb-2" /><span class="text-xs text-gray-500">Memuat
              Dokumen...</span>
          </div>
          <iframe v-if="activePdfUrl" :src="activePdfUrl" class="w-full h-full border-none flex-1" />
          <div v-else-if="!isLocalPdfLoading"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
            <FileText class="w-12 h-12l opacity-30" /><span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
          </div>
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUpdate, computed } from "vue";
import { useRoute, useRouter } from 'vue-router';
import {
  Hash, Calendar, Tag, Paperclip, FileText, Loader2, X, ArrowLeft, Printer, MoreHorizontal, ChevronUp, Users, Building2, ChevronRight, Send, Edit3,
  CheckCircle, XCircle, AlertCircle
} from "lucide-vue-next";

// --- SETUP & COMPOSABLES ---
const route = useRoute();
const router = useRouter();
const { fetchInboxDetail, fetchKonsepDetail } = useInbox(null);
const { rejectKonsep } = useKonsep();

const id = route.params.id as string;
const jenisQuery = route.query.jenis as string;

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Kotak Masuk", to: "/korespondensi/kotak-masuk" },
  { label: "Detail Surat", to: "#" },
];

// --- CONSTANTS ---
const LIMIT_DISPLAY = 2;
const MAX_CONTENT_HEIGHT = 300;

// --- STATE ---
const details = ref<any[]>([]);
const selected = ref<any>(null);
const isLoading = ref(true);
const isKonsepData = ref(false);

const showEditAction = ref(false);
const isOpenKonsepModal = ref(false);

// State PDF Preview
const isPreviewOpen = ref(false);
const previewTitle = ref("Preview Dokumen");
const activePdfUrl = ref<string | null>(null);
const isLocalPdfLoading = ref(false);

// Iframe Refs
const iframeRefs = ref<HTMLIFrameElement[]>([]);
const setIframeRef = (el: any, index: number) => { if (el) iframeRefs.value[index] = el; };
onBeforeUpdate(() => { iframeRefs.value = []; });

// --- HELPER FUNCTIONS ---

const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS', 'KONSEP NOTA DINAS'].includes(c) || c.includes('KONSEP')) return 'bg-blue-500 text-white';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-500 text-white';
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c)) return 'bg-green-500 text-white';
  if (['SDE', 'SURAT DINAS EKSTERNAL'].includes(c)) return 'bg-orange-500 text-white';
  return 'bg-gray-500 text-white';
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

const isJenisDI = computed(() => {
  const j = selected.value?.jenis || '';
  const l = selected.value?.jenis_label || '';
  return j.toUpperCase() === "DI" || l.toUpperCase().includes("DISPOSISI");
});

const getVisiblePenerima = (item: any) => {
  const list = item.penerima || [];
  return item._ui.showAllRecipients ? list : list.slice(0, LIMIT_DISPLAY);
};

const getRemainingRecipientCount = (item: any) => {
  const list = item.penerima || [];
  return Math.max(0, list.length - LIMIT_DISPLAY);
};

const getVisibleTembusan = (item: any) => {
  const list = item.tembusan || [];
  return item._ui.showAllCC ? list : list.slice(0, LIMIT_DISPLAY);
};

const getRemainingCCCount = (item: any) => {
  const list = item.tembusan || [];
  return Math.max(0, list.length - LIMIT_DISPLAY);
};

const getDispositionData = (item: any) => {
  if (item.instruksi) return { instruksi: item.instruksi };
  const type = (item.jenis || '').toUpperCase();
  if (type === 'DI' || type === 'DISPOSISI') {
    if (item.disposisi) return { instruksi: item.disposisi };
    if (item.detail && item.detail.disposisi) return { instruksi: item.detail.disposisi };
  }
  return null;
};

const getContentToDisplay = (item: any) => {
  const type = (item.jenis || '').toUpperCase();
  if (type === 'DI' || type === 'DISPOSISI') return item.catatan || (item.detail ? item.detail.catatan : '') || '';
  return item.konten || '';
};

// Iframe Resizer
const resizeIframe = (index: number) => {
  const iframeEl = iframeRefs.value[index];
  if (!iframeEl || !details.value[index]) return;

  const adjust = () => {
    const iWindow = iframeEl.contentWindow;
    if (!iWindow) return;
    const doc = iWindow.document;
    iframeEl.style.height = 'auto';
    const contentHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, doc.body.offsetHeight);
    iframeEl.style.height = (contentHeight + 20) + 'px';

    if (contentHeight > MAX_CONTENT_HEIGHT) details.value[index]._ui.showReadMoreButton = true;
    else {
      details.value[index]._ui.showReadMoreButton = false;
      details.value[index]._ui.isContentExpanded = true;
    }
  };
  setTimeout(adjust, 100);
  setTimeout(adjust, 500);
};

// --- DATA FETCHING ---

const loadData = async () => {
  if (!id) return;
  isLoading.value = true;
  details.value = [];
  selected.value = null;

  try {
    if (jenisQuery === 'K') {
      // === LOGIC KONSEP (TIDAK BERUBAH) ===
      isKonsepData.value = true;
      const response = await fetchKonsepDetail(id);
      const konsepData = response?.data || response;

      if (konsepData) {
        selected.value = konsepData;
        const rawFlows = konsepData.flow || [];
        const sortedFlows = [...rawFlows].sort((a: any, b: any) => b.urutan - a.urutan);
        const lastFlow = sortedFlows.length > 0 ? sortedFlows[0] : null;
        showEditAction.value = (lastFlow && lastFlow.aksi === 'reject');

        details.value = sortedFlows.map((flow: any) => {
          let kontenText = flow.rich_content;
          if ((flow.aksi === 'create' || flow.aksi === 'forward') && !kontenText) {
            kontenText = konsepData.naskah?.konten || konsepData.naskah?.content?.konten || "";
          }

          let penerimaList: any[] = [];
          let tembusanList: any[] = [];

          if (flow.aksi === 'create' || flow.aksi === 'forward') {
            penerimaList = Array.isArray(konsepData.penerima) ? konsepData.penerima : (Array.isArray(konsepData.kepada) ? konsepData.kepada : []);
            tembusanList = Array.isArray(konsepData.tembusan) ? konsepData.tembusan : [];
          } else {
            penerimaList = Array.isArray(flow.to) ? flow.to : (flow.to ? [flow.to] : []);
            tembusanList = flow.cc || [];
          }

          return {
            id: flow.id,
            aksi: flow.aksi,
            jenis: flow.aksi === 'kirim_disposisi' ? 'DI' : 'ND',
            jenis_label: flow.aksi === 'create' ? 'KONSEP AWAL' : (flow.aksi === 'kirim_disposisi' ? 'DISPOSISI' : flow.aksi.toUpperCase()),
            perihal: flow.subject || konsepData.perihal,
            nomor: konsepData.nomor || '-',
            tanggal: flow.created_at || flow.tanggal,
            pengirim: (flow.aksi === 'create') ? konsepData.pengirim : flow.from,
            flow_from: flow.from,
            penerima: penerimaList,
            tembusan: tembusanList,
            konten: kontenText,
            catatan: flow.catatan || flow.disposisi_content?.catatan,
            instruksi: flow.disposisi_content?.disposisi,
            lampiran_files: flow.attachments || [],
            final_pdf_url: flow.pdf_snapshot || konsepData.final_pdf_url,
            _ui: { showAllRecipients: false, showAllCC: false, isContentExpanded: false, showReadMoreButton: false }
          };
        });
      }
   } else {
      // === LOGIC NON-KONSEP (ND/SURAT MASUK/DISPOSISI) ===
      const response = await fetchInboxDetail(id, jenisQuery);
      const rawData = response?.data || response;
      const inboxData = Array.isArray(rawData) ? rawData[0] : rawData;

      if (inboxData) {
        selected.value = inboxData;
        const rawFlows = (inboxData.flow && inboxData.flow.length > 0) ? inboxData.flow : [inboxData];

        details.value = rawFlows.map((item: any) => {

          // --- 1. LOGIC PENERIMA (TERTUJU) ---
          let listPenerima: any[] = [];

          // Cek Array di Item Iterasi (Prioritas 1)
          if (Array.isArray(item.penerima) && item.penerima.length > 0) {
            listPenerima = item.penerima;
          } else if (Array.isArray(item.kepada) && item.kepada.length > 0) { // Tambahan: Cek properti 'kepada'
            listPenerima = item.kepada;
          } else if (Array.isArray(item.to)) {
            listPenerima = item.to; // Biasanya array of object di flow
          } else if (item.to && typeof item.to === 'object') {
            listPenerima = [item.to]; // Handle jika 'to' object tunggal
          }

          // Cek Array di Parent / InboxData (Prioritas 2 - FALLBACK UTAMA)
          if (listPenerima.length === 0) {
             if (Array.isArray(inboxData.penerima) && inboxData.penerima.length > 0) {
               listPenerima = inboxData.penerima;
             } else if (Array.isArray(inboxData.kepada) && inboxData.kepada.length > 0) {
               listPenerima = inboxData.kepada;
             }
          }

          // Fallback Parsing String 'kepada_yth' (Prioritas 3)
          if (listPenerima.length === 0) {
            const detailInfo = item.detail || inboxData.detail;
            if (detailInfo && detailInfo.kepada_yth) {
              listPenerima = detailInfo.kepada_yth.split(';').map((namaStr: string) => {
                const cleanName = namaStr.trim();
                return {
                  nama: cleanName,
                  position_text: cleanName,
                  positionText: cleanName
                };
              }).filter((x: any) => x.nama);
            }
          }

          // --- 2. LOGIC TEMBUSAN (CC) ---
          let listTembusan: any[] = [];

          // Cek Array di Item Iterasi (Prioritas 1)
          if (Array.isArray(item.tembusan) && item.tembusan.length > 0) {
            listTembusan = item.tembusan;
          } else if (Array.isArray(item.cc)) {
            listTembusan = item.cc;
          }

          // Cek Array di Parent / InboxData (Prioritas 2 - FALLBACK UTAMA)
          if (listTembusan.length === 0) {
             if (Array.isArray(inboxData.tembusan) && inboxData.tembusan.length > 0) {
               listTembusan = inboxData.tembusan;
             } else if (Array.isArray(inboxData.cc) && inboxData.cc.length > 0) {
               listTembusan = inboxData.cc;
             }
          }

          return {
            id: item.id,
            aksi: item.status || 'read',
            jenis: item.jenis || inboxData.jenis || 'SM',
            jenis_label: item.jenis_label || inboxData.jenis_label || 'SURAT MASUK',
            perihal: item.perihal || inboxData.perihal,
            nomor: item.nomor || inboxData.nomor || '-',
            tanggal: item.tanggal || item.created_at || inboxData.tanggal,
            pengirim: item.pengirim || item.from || inboxData.pengirim,
            flow_from: item.from || item.pengirim || inboxData.pengirim,

            // Assign hasil mapping
            penerima: listPenerima,
            tembusan: listTembusan,

            konten: item.konten || item.isi || '',
            catatan: item.catatan,
            instruksi: item.disposisi || item.instruksi,
            lampiran_files: item.lampiran_files || item.attachments || [],
            final_pdf_url: item.final_pdf_url || item.file_url || inboxData.final_pdf_url,
            _ui: { showAllRecipients: false, showAllCC: false, isContentExpanded: false, showReadMoreButton: false }
          };
        });
      }
    }
  } catch (e) {
    console.error("❌ Error loading data", e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => { loadData(); });

// --- ACTIONS HANDLERS ---
const goBack = () => router.back();

const handleEditKonsep = () => {
  if (selected.value?.id) {
    router.push({ path: '/korespondensi/tulis/konsep/nota-dinas', query: { ref_id: selected.value.id, action: 'edit' } });
  }
};

const handleLanjutNotaDinas = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/lanjut/nota-dinas', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'tindak_lanjut' } }); };
const handleLanjutDisposisi = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/disposisi', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'disposisi' } }); };
const selectKonsep = (opt: any) => { isOpenKonsepModal.value = false; if (selected.value?.id) router.push({ path: opt.path, query: { ref_id: selected.value.id, workflow: 'konsep', ref_jenis: selected.value.jenis } }); };

const konsepOptions = [
  { type: 'ND', label: 'Nota Dinas', desc: 'Komunikasi internal', path: '/korespondensi/tulis/konsep/nota-dinas', icon: FileText, colorClass: 'bg-blue-100 text-blue-600' },
  { type: 'SDI', label: 'Surat Internal', desc: 'Resmi internal', path: '/korespondensi/tulis/konsep/surat-dinas-internal', icon: Users, colorClass: 'bg-green-100 text-green-600' },
  { type: 'SDE', label: 'Surat Eksternal', desc: 'Pihak luar', path: '/korespondensi/tulis/konsep/surat-dinas-eksternal', icon: Building2, colorClass: 'bg-orange-100 text-orange-600' }
];

const openPdfPreview = (item: any) => {
  const url = item?.final_pdf_url;
  if (!url) return alert('File PDF tidak ditemukan.');
  const filename = url.split('?')[0].split('/').pop() || 'document.pdf';
  openDocumentPreview(url, `Pratinjau: ${item.jenis_label || 'Dokumen'}`, filename);
};
const openPreviewFile = (file: any) => openDocumentPreview(file.file_url || file.fileUrl, file.file_name || file.fileName);

const openDocumentPreview = async (url: string, title: string, filename?: string) => {
  if (!url) { alert("URL tidak valid."); return; }
  previewTitle.value = title;
  isPreviewOpen.value = true;
  isLocalPdfLoading.value = true;
  activePdfUrl.value = null;

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const blob = new Blob([await response.arrayBuffer()], { type: 'application/pdf' });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    activePdfUrl.value = url;
  } finally {
    isLocalPdfLoading.value = false;
  }
};
</script>
