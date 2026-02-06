<template>
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
                  <!-- <div
                    class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                    <span class="text-xs font-bold">{{ index + 1 }}</span>
                  </div> -->
                  <h2 class="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                    {{ detail.jenis_label || 'Riwayat Disposisi' }}
                  </h2>
                </div>
              </template>
            </div>

            <div class="flex items-center gap-1 shrink-0 pl-2">
              <UTooltip text="Pratinjau PDF">
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
                  {{ detail.perihal || detail.kop_judul || (detail.jenis_label || 'Detail Surat') }}
                </h2>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
            <div class="flex items-center gap-1">
              <Hash class="w-3.5 h-3.5" />
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">
                {{ detail.nomor || 'Tanpa Nomor' }}
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
              :class="getCategoryStyle(detail.jenis_label || detail.jenis)">
              <Tag class="w-3 h-3" />
              {{ detail.jenis_label || detail.jenis }}
            </div>
          </div>

          <div v-if="(detail.jenis === 'KA' || detail.jenis === 'KAJIAN') && detail.konsep"
            class="mt-5 p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-x-6 gap-y-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Notebook class="w-3.5 h-3.5" /> ID Konsep:
              </span>
              <span class="font-mono font-medium text-gray-900 dark:text-gray-200 select-all">
                {{ detail.konsep.id }}
              </span>
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
                  {{ detail.pengirim?.position_text || detail.pengirim?.positionText || detail.pengirim?.nama }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  {{ detail.pengirim?.nama }}
                </span>
              </div>

              <div class="grid grid-cols-1 gap-6">
                <div class="flex flex-col md:flex-row">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-2 mt-0.5">Kepada
                  </div>
                  <div class="flex flex-col w-full">
                    <div v-for="(penerima, pIdx) in getVisiblePenerima(detail)" :key="pIdx"
                      class="flex items-start gap-2 text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm mb-1">
                      <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-4 shrink-0">{{ pIdx + 1 }}.</span>
                      <div class="break-words">
                        <span class="font-medium">
                          {{ penerima.position_text || penerima.positionText || penerima.nama }}
                        </span>
                        <span v-if="penerima.position_text || penerima.positionText"
                          class="text-gray-500 font-normal text-xs ml-1">
                          ({{ penerima.nama }})
                        </span>
                      </div>
                    </div>
                    <button v-if="getRemainingRecipientCount(detail) > 0"
                      @click="detail._ui.showAllRecipients = !detail._ui.showAllRecipients"
                      class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1 w-fit">
                      {{ detail._ui.showAllRecipients ? 'Sembunyikan' : `+${getRemainingRecipientCount(detail)} lainnya`
                      }}
                    </button>
                  </div>
                </div>

                <div class="flex flex-col md:flex-row" v-if="detail.tembusan && detail.tembusan.length > 0">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-2 mt-0.5">Tembusan
                  </div>
                  <div class="flex flex-col w-full">
                    <div v-for="(cc, cIdx) in getVisibleTembusan(detail)" :key="cIdx"
                      class="flex items-start gap-2 text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm mb-1">
                      <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-4 shrink-0">{{ cIdx + 1 }}.</span>
                      <div class="break-words">
                        <span class="font-medium">
                          {{ cc.position_text || cc.positionText || cc.nama }}
                        </span>
                        <span v-if="cc.position_text || cc.positionText" class="text-gray-500 font-normal text-xs ml-1">
                          ({{ cc.nama }})
                        </span>
                      </div>
                    </div>
                    <button v-if="getRemainingCCCount(detail) > 0" @click="detail._ui.showAllCC = !detail._ui.showAllCC"
                      class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1 w-fit">
                      {{ detail._ui.showAllCC ? 'Sembunyikan' : `+${getRemainingCCCount(detail)} lainnya` }}
                    </button>
                  </div>
                </div>

                <div class="flex flex-col md:flex-row" v-if="getDispositionData(detail)">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-2 mt-0.5">Instruksi
                  </div>
                  <div class="flex flex-col">
                    <div class="text-gray-800 dark:text-gray-200 leading-snug text-xs sm:text-sm">
                      <span class="font-medium">
                        {{ (getDispositionData(detail).instruksi || '').replace(/\n/g, ', ') }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-5 sm:p-8 min-h-[150px] bg-white dark:bg-gray-900">
          <div class="relative overflow-hidden transition-all duration-500 ease-in-out"
            :class="[(detail._ui.showReadMoreButton && !detail._ui.isContentExpanded) ? 'max-h-[300px]' : 'max-h-full pb-6']">

            <div
              class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-25 mb-3 flex items-center gap-2">
              {{ (detail.jenis === 'DI' || detail.jenis === 'DISPOSISI') ? 'Catatan' : 'Isi Naskah' }}
            </div>

            <div v-if="!getContentToDisplay(detail)" class="text-gray-400 text-sm italic text-center py-4">
              Tidak ada konten teks.
            </div>

            <iframe v-else :ref="(el) => setIframeRef(el, index)" :srcdoc="getContentToDisplay(detail)"
              class="w-full bg-transparent block" style="border: none;" scrolling="no" @load="resizeIframe(index)">
            </iframe>

            <div v-show="detail._ui.showReadMoreButton && !detail._ui.isContentExpanded"
              class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 z-10 pointer-events-none flex items-end justify-center pb-2">
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

      </div>
    </template>

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

<script setup lang="ts">
// --- IMPORTS ---
import { onMounted, onUnmounted, ref, onBeforeUpdate, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft, Printer, Paperclip, Loader2, FileText,
  MoreHorizontal, ChevronUp, Calendar, Hash, Tag,
  Notebook
} from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Terkirim", to: "/korespondensi/terkirim" },
  { label: "Detail Surat", to: "#" },
];

const route = useRoute();
const router = useRouter();
const { get } = useApi();

// --- STATE ---
// Ubah detail (object) menjadi details (array)
const details = ref<any[]>([]);
const isLoading = ref(false);
const showPdfModal = ref(false);
const previewTitle = ref('Preview Dokumen');
const activePdfUrl = ref<string | null>(null);
const isLocalPdfLoading = ref(false);

// Constants
const LIMIT_DISPLAY = 2;
const MAX_CONTENT_HEIGHT = 300;

// Ref untuk iframes (array)
const iframeRefs = ref<HTMLIFrameElement[]>([]);
const setIframeRef = (el: any, index: number) => {
  if (el) iframeRefs.value[index] = el;
};

// Pastikan ref di-reset sebelum update agar index sinkron
onBeforeUpdate(() => {
  iframeRefs.value = [];
});

const idNaskah = route.params.id as string;
// const currentJenis = computed(() => ... ) -> diganti logic di dalam fetch/render

// --- FETCH DATA ---
const fetchDetail = async (id: string) => {
  isLoading.value = true;
  details.value = [];

  try {
    const endpoint = `/persuratan/naskah/${id}`;
    const response = await get(endpoint);

    if (response.success && response.data && Array.isArray(response.data)) {
      // Map semua data dari array response
      details.value = response.data.map((rawData: any) => {
        return {
          ...rawData,
          ...(rawData.detail || {}), // Merge detail object ke root untuk akses mudah
          penerima: rawData.penerima || [],
          tembusan: rawData.tembusan || [],
          lampiran_files: rawData.lampiran_files || [],
          // Tambahkan local UI state untuk setiap item
          _ui: {
            showAllRecipients: false,
            showAllCC: false,
            isContentExpanded: false,
            showReadMoreButton: false
          }
        };
      });
    }
  } catch (error) {
    console.error(`Gagal mengambil detail:`, error);
  } finally {
    isLoading.value = false;
  }
};

// --- HELPER FUNCTIONS (Pengganti Computed Global) ---

const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS'].includes(c)) return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300';
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c)) return 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300';
  if (['SDE', 'SURAT DINAS EKSTERNAL'].includes(c)) return 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300';
  if (['KAJIAN', 'KA'].includes(c)) return 'bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300';
  return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
};

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

// --- LOGIC PENERIMA & TEMBUSAN PER ITEM ---

const getVisiblePenerima = (item: any) => {
  const type = (item.jenis || '').toUpperCase();
  let list = [];

  // Jika External dan ada string 'kepada_yth' dipisah titik koma
  if (['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(type) && item.kepada_yth) {
    list = item.kepada_yth.split(';').map((nama: string) => ({
      nama: nama.trim(),
      positionText: ''
    })).filter((i: any) => i.nama);
  } else {
    list = item.penerima || [];
  }

  return item._ui.showAllRecipients ? list : list.slice(0, LIMIT_DISPLAY);
};

const getRemainingRecipientCount = (item: any) => {
  const type = (item.jenis || '').toUpperCase();
  let total = 0;
  if (['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(type) && item.kepada_yth) {
    total = item.kepada_yth.split(';').filter((s: string) => s.trim()).length;
  } else {
    total = item.penerima?.length || 0;
  }
  return Math.max(0, total - LIMIT_DISPLAY);
};

const getVisibleTembusan = (item: any) => {
  const list = item.tembusan || [];
  return item._ui.showAllCC ? list : list.slice(0, LIMIT_DISPLAY);
};

const getRemainingCCCount = (item: any) => {
  return Math.max(0, (item.tembusan?.length || 0) - LIMIT_DISPLAY);
};

// --- LOGIC KONTEN & DISPOSISI ---

const getDispositionData = (item: any) => {
  const type = (item.jenis || '').toUpperCase();
  if (type === 'DI' || type === 'DISPOSISI') {
    if (item.disposisi) return { instruksi: item.disposisi };
    // Handle struktur nested jika ada
    if (item.detail && item.detail.disposisi) return { instruksi: item.detail.disposisi };
  }
  return null;
};

const getContentToDisplay = (item: any) => {
  const type = (item.jenis || '').toUpperCase();
  // Prioritaskan Catatan untuk Disposisi
  if (type === 'DI' || type === 'DISPOSISI') {
    return item.catatan || (item.detail ? item.detail.catatan : '') || '';
  }
  return item.konten || '';
};

// --- IFRAME RESIZE ---

const resizeIframe = (index: number) => {
  const iframeEl = iframeRefs.value[index];
  if (!iframeEl || !details.value[index]) return;

  const adjust = () => {
    const iWindow = iframeEl.contentWindow;
    if (!iWindow) return;

    const doc = iWindow.document;
    iframeEl.style.height = 'auto'; // Reset dulu

    const contentHeight = Math.max(
      doc.body.scrollHeight, doc.documentElement.scrollHeight,
      doc.body.offsetHeight, doc.documentElement.offsetHeight
    );

    iframeEl.style.height = (contentHeight + 20) + 'px';

    // Update state di item spesifik
    if (contentHeight > MAX_CONTENT_HEIGHT) {
      details.value[index]._ui.showReadMoreButton = true;
    } else {
      details.value[index]._ui.showReadMoreButton = false;
      details.value[index]._ui.isContentExpanded = true;
    }
  };

  // Trigger beberapa kali untuk memastikan render font/gambar selesai
  setTimeout(adjust, 100);
  setTimeout(adjust, 500);
};

// --- ACTIONS ---

const goBack = () => router.back();

const openPdfPreview = (item: any) => {
  if (item?.final_pdf_url) {
    const filename = item.final_pdf_name ||
      (item.final_pdf_url.split('?')[0].split('/').pop() || 'document.pdf');
    openDocumentPreview(item.final_pdf_url, `Pratinjau: ${item.jenis_label || 'Dokumen'}`, filename);
  } else {
    alert('Dokumen PDF belum tersedia');
  }
};

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
    else if (['jpg', 'jpeg'].includes(ext)) mime = 'image/jpeg';
    else if (ext === 'png') mime = 'image/png';
    else if (ext === 'txt') mime = 'text/plain';

    const blob = new Blob([buffer], { type: mime });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    console.error("Gagal memuat dokumen blob:", error);
    activePdfUrl.value = url; // Fallback ke URL asli
  } finally {
    isLocalPdfLoading.value = false;
  }
};

onUnmounted(() => {
  if (activePdfUrl.value && activePdfUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(activePdfUrl.value);
  }
});

onMounted(async () => {
  if (idNaskah) {
    await fetchDetail(idNaskah);
  }
});
</script>
