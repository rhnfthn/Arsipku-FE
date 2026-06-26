<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft, Printer, Hash, Calendar, Paperclip,
  FileText, Upload, X, Loader2, Send, CheckCircle,
  ChevronLeft, ChevronRight,
} from "lucide-vue-next";
import { useTertunda } from "~/composables/useTertunda";
import { formatShortDate, getInitials } from "~/utils/mail-helpers";

definePageMeta({ middleware: "auth" });

// --- SETUP ---
const route = useRoute();
const router = useRouter();
const { fetchTertundaDetail, fetchTertundaNavigation, validateTtdFile, finalizePending, MAX_FILE_SIZE_MB } = useTertunda();

const id = route.params.id as string;
const jenisQuery = (route.query.jenis as string) || "ND";

// --- STATE ---
const isLoading = ref(true);
const isSending = ref(false);
const naskah = ref<any>(null);

// --- NAVIGATION (previous/next dari tertunda) ---
const navPrev = ref<any>(null);
const navNext = ref<any>(null);
const isLoadingNav = ref(false);

const goToNav = (target: any) => {
  if (!target?.id_naskah) return;
  const targetJenis = target.jenis || jenisQuery || "ND";
  router.push({
    path: `/korespondensi/tertunda/${target.id_naskah}`,
    query: { jenis: targetJenis },
  });
};
const goToNewer = () => goToNav(navNext.value);
const goToOlder = () => goToNav(navPrev.value);

const uploadedFile = ref<File | null>(null);
const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadError = ref("");

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Tertunda", to: "/korespondensi/tertunda" },
  { label: "Detail Naskah Tertunda", to: "#" },
];

// --- HELPERS ---
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LIMIT_DISPLAY = 2;
const showAllTo = ref(false);
const showAllCc = ref(false);

const penerimaList = computed(() => naskah.value?.penerima || []);
const tembusanList = computed(() => naskah.value?.tembusan || []);
const lampiranList = computed(() => naskah.value?.lampiran_files || naskah.value?.attachments || []);

const getSifatStyle = (sifat: string) => {
  const s = (sifat || "").toLowerCase();
  if (s === "rahasia") return "bg-red-500 text-white";
  if (s === "penting") return "bg-yellow-500 text-white";
  return "bg-primary-500 text-white";
};

const getCategoryLabelLong = (jenis: string) => {
  const map: Record<string, string> = {
    ND: "NOTA DINAS", SDI: "SURAT INTERNAL", SDE: "SURAT EKSTERNAL",
    KA: "KAJIAN", DI: "DISPOSISI",
    // URS poin 6
    PER: "PERATURAN DIREKSI", KEP: "KEPUTUSAN DIREKSI", INS: "INSTRUKSI",
    SPR: "SURAT PERINTAH", SOP: "STANDAR OPERASIONAL PROSEDUR", SE: "SURAT EDARAN",
    NK: "NOTA KESEPAHAMAN", PKS: "PERJANJIAN KERJA SAMA", LOA: "LETTER OF AGREEMENT",
    LOCA: "LETTER OF COORDINATION AGREEMENT", KTR: "KONTRAK PENGADAAN", PLN: "PERJANJIAN LAINNYA",
    ADN: "ADENDUM PERJANJIAN", SPK: "SURAT PERINTAH KERJA", ASP: "ADENDUM SPK",
    SK: "SURAT KUASA", BA: "BERITA ACARA", UND: "SURAT UNDANGAN",
    KET: "SURAT KETERANGAN", PGN: "SURAT PENGANTAR", RIS: "RISALAH RAPAT",
    PUM: "PENGUMUMAN", SRT: "SERTIFIKAT", PGA: "PIAGAM", LAP: "LAPORAN", BVB: "BLANKO VERBAL",
  };
  return map[jenis?.toUpperCase()] || (jenis ? jenis.toUpperCase() : "SURAT");
};

// --- FILE HANDLERS ---
const setFile = (file: File) => {
  uploadError.value = "";
  const err = validateTtdFile(file);
  if (err) { uploadError.value = err; uploadedFile.value = null; return; }
  uploadedFile.value = file;
};

const triggerFileInput = () => fileInputRef.value?.click();
const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) setFile(file);
};
const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) setFile(file);
};
const removeFile = () => {
  uploadedFile.value = null;
  uploadError.value = "";
  if (fileInputRef.value) fileInputRef.value.value = "";
};

// --- DATA ---
const loadData = async () => {
  isLoading.value = true;
  navPrev.value = null;
  navNext.value = null;

  // Fetch navigation (prev/next) untuk daftar tertunda
  isLoadingNav.value = true;
  try {
    const nav = await fetchTertundaNavigation(id, jenisQuery);
    navPrev.value = nav.previous;
    navNext.value = nav.next;
  } catch (navErr) {
    console.error('[Detail Tertunda] fetchTertundaNavigation failed:', navErr);
  } finally {
    isLoadingNav.value = false;
  }

  try {
    naskah.value = await fetchTertundaDetail(id, jenisQuery);
  } catch (e) {
    console.error("Error loading detail tertunda:", e);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) loadData();
  },
);

// --- SEND ---
const handleKirim = async () => {
  if (!uploadedFile.value) return;
  isSending.value = true;
  try {
    const res = await finalizePending(id, uploadedFile.value);
    if (res?.success) router.push("/korespondensi/terkirim");
  } catch (e) {
    console.error("Error kirim:", e);
  } finally {
    isSending.value = false;
  }
};

// --- PREVIEW ---
const isPreviewOpen = ref(false);
const activePdfUrl = ref<string | null>(null);
const isPreviewLoading = ref(false);

const openPreview = async (url: string) => {
  if (!url) return;
  isPreviewOpen.value = true;
  isPreviewLoading.value = true;
  activePdfUrl.value = null;
  try {
    const response = await fetch(url);
    const blob = new Blob([await response.arrayBuffer()], { type: "application/pdf" });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch {
    activePdfUrl.value = url;
  } finally {
    isPreviewLoading.value = false;
  }
};

onMounted(loadData);
</script>

<template>
  <PageHeader title="Surat Tertunda" :items="breadcrumbs" />

  <div class="w-full flex flex-col gap-6 pt-4">

    <!-- Skeleton -->
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

    <!-- Main Card -->
    <div v-else
      class="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

      <!-- Header -->
      <div class="h-14 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div class="flex items-center gap-2">
          <button @click="router.back()"
            class="p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <span class="text-base font-semibold text-gray-900 dark:text-white">Kembali</span>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <!-- Navigasi pesan lebih baru (<) -->
          <UTooltip text="Pesan lebih baru">
            <button
              @click="goToNewer"
              :disabled="!navNext || isLoadingNav"
              class="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              :class="navNext ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400' : 'text-gray-300 dark:text-gray-600'"
            >
              <Loader2 v-if="isLoadingNav" class="w-4 h-4 animate-spin" />
              <ChevronLeft v-else class="w-4 h-4" />
            </button>
          </UTooltip>

          <!-- Navigasi pesan lebih lama (>) -->
          <UTooltip text="Pesan lebih lama">
            <button
              @click="goToOlder"
              :disabled="!navPrev || isLoadingNav"
              class="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              :class="navPrev ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400' : 'text-gray-300 dark:text-gray-600'"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </UTooltip>

          <div class="w-px h-5 bg-gray-200 dark:border-gray-600 mx-1" />

          <button v-if="naskah?.final_pdf_url || naskah?.file_url"
            @click="openPreview(naskah.final_pdf_url || naskah.file_url)"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 transition-colors">
            <Printer class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Meta -->
      <div class="px-8 py-6 bg-gray-50/30 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {{ naskah?.perihal || "(Tidak ada perihal)" }}
        </h2>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
          <div v-if="naskah?.nomor" class="flex items-center gap-1">
            <Hash class="w-3.5 h-3.5" />
            <span class="font-mono font-semibold text-gray-700 dark:text-gray-300">{{ naskah.nomor }}</span>
          </div>
          <span class="opacity-40">•</span>
          <div class="flex items-center gap-1">
            <Calendar class="w-3.5 h-3.5" />
            <span>{{ formatShortDate(naskah?.tanggal || naskah?.created_at) }}</span>
          </div>
          <template v-if="naskah?.sifat">
            <span class="opacity-40">•</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary-300 text-white">
              {{ naskah.sifat }}
            </span>
          </template>
          <span class="opacity-40">•</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary-500 text-white">
            {{ getCategoryLabelLong(naskah?.jenis || jenisQuery) }}
          </span>
          <span class="opacity-40">•</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-white">TTD
            BASAH</span>
        </div>
        <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-3 gap-1" v-if="naskah?.dikirim_oleh">
          <span>Dikirim oleh :</span>
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {{ naskah.dikirim_oleh.position_text }}
          </span>
          <span class="text-gray-400 dark:text-gray-500">({{ naskah.dikirim_oleh.nama }})</span>
        </div>
      </div>

      <!-- Body -->
      <div class="p-8 space-y-6">

        <!-- Pengirim -->
        <div class="flex items-center gap-4">
          <UAvatar size="md" class="bg-primary-500 text-white font-semibold shrink-0">
            {{ getInitials(naskah?.pengirim?.nama || "") }}
          </UAvatar>
          <div>
            <span class="text-sm font-semibold block text-gray-900 dark:text-white">
              {{ naskah?.pengirim?.position_text || naskah?.pengirim?.positionText || "-" }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              {{ naskah?.pengirim?.nama || "-" }}
            </span>
          </div>
        </div>

        <!-- Tertuju -->
        <div v-if="penerimaList.length > 0" class="flex flex-col md:flex-row gap-2">
          <div
            class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5">
            Tertuju
          </div>
          <div class="flex flex-col gap-0.5 min-w-0 flex-1">
            <div v-for="(t, ti) in (showAllTo ? penerimaList : penerimaList.slice(0, LIMIT_DISPLAY))" :key="ti"
              class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 min-w-0">
              <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ Number(ti) + 1 }}.</span>
              <div class="truncate min-w-0">
                <span class="font-medium">{{ t.position_text || t.positionText || t.nama }}</span>
                <span v-if="t.nama && (t.position_text || t.positionText)"
                  class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ t.nama }})</span>
              </div>
            </div>
            <button v-if="penerimaList.length > LIMIT_DISPLAY" @click="showAllTo = !showAllTo"
              class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 text-left w-fit">
              {{ showAllTo ? "Sembunyikan" : `+${penerimaList.length - LIMIT_DISPLAY} lainnya` }}
            </button>
          </div>
        </div>

        <!-- Tembusan -->
        <div v-if="tembusanList.length > 0" class="flex flex-col md:flex-row gap-2">
          <div
            class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5">
            Tembusan
          </div>
          <div class="flex flex-col gap-0.5 min-w-0 flex-1">
            <div v-for="(t, ti) in (showAllCc ? tembusanList : tembusanList.slice(0, LIMIT_DISPLAY))" :key="ti"
              class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0">
              <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ Number(ti) + 1 }}.</span>
              <div class="truncate min-w-0">
                <span class="font-medium">{{ t.position_text || t.positionText || t.nama }}</span>
                <span v-if="t.nama && (t.position_text || t.positionText)"
                  class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ t.nama }})</span>
              </div>
            </div>
            <button v-if="tembusanList.length > LIMIT_DISPLAY" @click="showAllCc = !showAllCc"
              class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 text-left w-fit">
              {{ showAllCc ? "Sembunyikan" : `+${tembusanList.length - LIMIT_DISPLAY} lainnya` }}
            </button>
          </div>
        </div>

        <!-- Upload TTD Basah -->
        <div class="flex flex-col gap-2">

          <!-- Drop zone (kosong) -->
          <div v-if="!uploadedFile" @click="triggerFileInput" @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop"
            class="w-full rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-10 gap-3 select-none"
            :class="uploadError
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
              : isDragging
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'">
            <div class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="uploadError ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary-50 dark:bg-primary-900/30'">
              <Upload class="w-6 h-6" :class="uploadError ? 'text-red-500' : 'text-primary-500'" />
            </div>
            <div class="text-center">
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">Unggah Scan Tanda Tangan Basah</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                Mohon cetak dokumen di atas, berikan tanda tangan basah, pindai (scan) kembali, dan unggah hasilnya di
                sini.
              </p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide font-medium">
                FORMAT: PDF (Max. {{ MAX_FILE_SIZE_MB }} MB)
              </p>
            </div>
          </div>

          <!-- Error -->
          <div v-if="uploadError" class="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 px-1">
            <X class="w-3.5 h-3.5 shrink-0" />
            <span>{{ uploadError }}</span>
          </div>

          <!-- File terpilih -->
          <div v-if="uploadedFile"
            class="w-full rounded-xl border-2 border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 p-4 flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 shadow-sm">
              <FileText class="w-6 h-6 text-red-500" stroke-width="1.5" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ uploadedFile.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ formatFileSize(uploadedFile.size) }}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <div class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <CheckCircle class="w-4 h-4" />
                <span class="hidden sm:inline">Siap dikirim</span>
              </div>
              <button @click="removeFile"
                class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <input ref="fileInputRef" type="file" accept="application/pdf" class="hidden" @change="handleFileChange" />
        </div>

        <!-- Lampiran -->
        <div v-if="lampiranList.length > 0">
          <h3
            class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Paperclip class="w-3 h-3" /> Lampiran
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button v-for="file in lampiranList" :key="file.id"
              @click="openPreview(file.file_url || file.fileUrl || file.file_path)"
              class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 dark:hover:border-primary-500 transition-all text-center flex flex-col overflow-hidden group">
              <div class="p-2">
                <div
                  class="h-24 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex flex-col items-center justify-center gap-1 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                  <FileText class="w-8 h-8 text-red-500" stroke-width="1.5" />
                  <span
                    class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">PDF</span>
                </div>
              </div>
              <div class="px-3 pb-3 flex-1 flex items-center justify-center">
                <p class="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-2 break-all leading-tight">
                  {{ file.file_name || file.fileName }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <!-- Tombol Kirim -->
        <div class="pt-2">
          <button @click="handleKirim" :disabled="!uploadedFile || isSending"
            class="flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-primary-600 hover:bg-primary-700 active:scale-[0.98] shadow-sm">
            <Loader2 v-if="isSending" class="w-4 h-4 animate-spin" />
            <Send v-else class="w-4 h-4" />
            {{ isSending ? "Mengirim..." : "Kirim" }}
          </button>
        </div>

      </div>
    </div>

    <!-- PDF Preview Slideover -->
    <USlideover v-model:open="isPreviewOpen" title="Preview Dokumen" side="bottom"
      :ui="{ content: 'h-[90vh] sm:h-screen max-h-screen rounded-t-2xl sm:rounded-none', body: 'p-0' }">
      <template #body>
        <div class="w-full h-full relative bg-gray-100 dark:bg-gray-900 flex flex-col">
          <div v-if="isPreviewLoading"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 z-20">
            <Loader2 class="w-10 h-10 animate-spin text-primary-600 mb-2" />
            <span class="text-xs text-gray-500">Memuat Dokumen...</span>
          </div>
          <iframe v-if="activePdfUrl" :src="activePdfUrl" class="w-full h-full border-none flex-1" />
          <div v-else-if="!isPreviewLoading"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
            <FileText class="w-12 h-12 opacity-30" />
            <span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
          </div>
        </div>
      </template>
    </USlideover>

  </div>
</template>
