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
  ChevronUp,
  Info,
  CheckSquare,
  Edit3,
  Users,
  Building2,
} from "lucide-vue-next";

// --- SETUP & COMPOSABLES ---
const route = useRoute();
const router = useRouter();
const { fetchInboxDetail } = useInbox(null);

const id = route.params.id as string;
const jenis = route.query.jenis as string;

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
   MANUAL FETCH DATA (CRITICAL FIX)
================================ */
const loadData = async () => {
  if (!jenis) return;
  isLoading.value = true;

  try {
    // 1. Fetch data menggunakan composable yang ada
    const result = await fetchInboxDetail(id, jenis);

    // 2. LOGIC PERBAIKAN: Cek apakah data ada di dalam 'flow'
    if (result && result.raw && result.raw.flow && Array.isArray(result.raw.flow) && result.raw.flow.length > 0) {
      const flowItem = result.raw.flow[0];

      console.log("Raw Flow Item Ditemukan:", flowItem); // Debugging

      // 3. FORCE MAPPING: Kita timpa semua data dari flowItem agar tidak ada yang null/undefined
      selected.value = {
        id: flowItem.id,

        // Metadata Dasar
        nomor: flowItem.nomor || '-',
        tanggal: flowItem.tanggal,
        perihal: flowItem.perihal,
        jenis: flowItem.jenis,
        jenis_label: flowItem.jenis === 'DI' ? 'DISPOSISI' : (flowItem.jenis || 'SURAT'),

        // Atribut Disposisi
        sifat: flowItem.sifat,
        status: flowItem.status,
        disposisi: flowItem.disposisi,   // Instruksi
        catatan: flowItem.catatan,       // HTML Catatan
        kepada_yth: flowItem.kepada_yth, // String Jabatan Utama

        // Relasi
        pengirim: flowItem.pengirim,
        kepada: flowItem.penerima || [], // Array penerima
        tembusan: flowItem.tembusan || [],

        // Konten & File
        konten: flowItem.konten || result.konten, // Kadang konten tidak ada di flow, ambil dari result
        lampiran_files: flowItem.lampiran_files || [],
        final_pdf_url: flowItem.final_pdf_url || flowItem.final_pdf
      };

    } else {
      // Fallback jika struktur JSON normal (bukan flow)
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
  return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
};

const getSifatColor = (sifat: string) => {
  const s = (sifat || '').toLowerCase();
  if (s.includes('biasa')) return 'bg-green-100 text-green-700 border border-green-200';
  if (s.includes('rahasia')) return 'bg-red-100 text-red-700 border border-red-200';
  if (s.includes('terbatas')) return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (s.includes('segera')) return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  return 'bg-gray-100 text-gray-700 border border-gray-200';
};

const isJenisDI = computed(() => {
  // Pastikan pengecekan case-insensitive dan cek label juga
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
  const url = file.fileUrl || file.file_url || file.file_path; // Handle berbagai kemungkinan key URL
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

const isOpenKonsepModal = ref(false);

// Opsi Menu Konsep (Sesuai Gambar)
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

// Fungsi Buka Modal (Dipanggil tombol Lanjut Konsep)
const handleLanjutKonsep = () => {
  isOpenKonsepModal.value = true;
};

// Fungsi Navigasi saat Opsi Dipilih
const selectKonsep = (option: any) => {
  isOpenKonsepModal.value = false;

  if (!selected.value?.id) return;

  // Arahkan ke halaman tulis dengan membawa ID referensi surat ini
  router.push({
    path: option.path,
    query: {
      ref_id: selected.value.id, // ID Surat Disposisi saat ini
      workflow: 'konsep',        // Penanda alur konsep
      ref_jenis: selected.value.jenis // Jenis asal (misal DI)
    }
  });
};
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
        class="w-full bg-white dark:bg-gray-900 rounded-xl dark:border-gray-800 overflow-hidden">

        <div
          class="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 z-30 bg-white dark:bg-gray-900">
          <div class="flex items-center gap-3">
            <button @click="goBack" class="p-2 hover:bg-gray-100 rounded-full text-gray-600">
              <ArrowLeft class="w-5 h-5" />
            </button>
            <h1 class="text-base font-semibold text-gray-900 dark:text-white">Kembali</h1>
          </div>
          <button class="p-2 hover:bg-gray-100 rounded text-gray-500" @click="openMainPdfPreview">
            <Printer class="w-4 h-4" />
          </button>
        </div>

        <div class="p-5 sm:p-8 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
            {{ selected.perihal || '(Tidak ada perihal)' }}
          </h2>
          <div class="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div class="flex items-center gap-1">
              <Hash class="w-3.5 h-3.5" /><span class="font-mono font-bold">{{ selected.nomor || '-' }}</span>
            </div>
            <span class="opacity-40">•</span>
            <div class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5" /><span>{{ formatDate(selected.tanggal) }}</span>
            </div>
            <span class="opacity-40">•</span>
            <div class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              :class="getCategoryStyle(selected.jenis)">
              {{ selected.jenis_label }}
            </div>

            <template v-if="isJenisDI">
              <span class="opacity-40">•</span>
              <div v-if="selected.sifat" class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
                :class="getSifatColor(selected.sifat)">
                {{ selected.sifat }}
              </div>
              <div v-if="selected.status"
                class="px-2 py-0.5 rounded-md border border-gray-200 text-gray-600 text-[10px] font-bold uppercase">
                {{ selected.status }}
              </div>
            </template>
          </div>
        </div>

        <div class="p-5 sm:p-8 bg-gray-50/60 dark:bg-gray-950/40 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-start gap-4">
            <UAvatar size="md" class="bg-primary-400 text-white font-semibold">{{ senderInitials }}</UAvatar>
            <div class="flex-1 min-w-0 space-y-6">

              <div>
                <span class="text-sm font-semibold text-gray-900 dark:text-white block">
                  {{ selected.pengirim?.position_text || selected.pengirim?.organization_text || '-' }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  {{ selected.pengirim?.nama || '-' }}
                </span>
              </div>

              <div class="grid grid-cols-1 gap-6">
                <div class="flex flex-col md:flex-row gap-6 md:gap-12">
                  <div class="flex-1">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Kepada</div>
                    <div class="flex flex-col">
                      <div v-for="(k, idx) in displayedKepada" :key="idx"
                        class="flex items-start gap-2 text-xs sm:text-sm mb-1 text-gray-800">
                        <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ idx + 1 }}.</span>
                        <div class="break-words font-medium">
                          {{ k.nama }}
                          <span v-if="k.position_text" class="text-gray-500 font-normal">({{ k.position_text
                          }})</span>
                        </div>
                      </div>
                      <button v-if="hiddenKepadaCount > 0" @click="showAllKepada = !showAllKepada"
                        class="text-xs font-semibold text-left text-primary mt-1">
                        {{ showAllKepada ? 'Sembunyikan' : `+${hiddenKepadaCount} lainnya` }}
                      </button>
                    </div>
                  </div>

                  <div v-if="tembusanList.length > 0" class="flex-1">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tembusan</div>
                    <div class="flex flex-col">
                      <div v-for="(t, idx) in displayedTembusan" :key="idx"
                        class="flex items-start gap-2 text-xs sm:text-sm mb-1 text-gray-800">
                        <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ idx + 1 }}.</span>
                        <div class="break-words font-medium">{{ t.nama || t.position_text }}</div>
                      </div>
                      <button v-if="hiddenTembusanCount > 0" @click="showAllTembusan = !showAllTembusan"
                        class="text-xs font-semibold text-primary mt-1">
                        {{ showAllTembusan ? 'Sembunyikan' : `+${hiddenTembusanCount} lainnya` }}
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="isJenisDI" class="border-t border-dashed border-gray-200 pt-4 mt-2">
                  <div class="bg-yellow-50/50 rounded-lg p-3 border border-yellow-100">
                    <div class="flex items-center gap-2 mb-2">
                      <CheckSquare class="w-4 h-4 text-yellow-600" />
                      <span class="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">Instruksi
                        Disposisi</span>
                    </div>
                    <p class="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{{ selected.disposisi ||
                      '(Tidak ada instruksi) ' }}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div class="p-5 sm:p-8 min-h-[150px] bg-white dark:bg-gray-900">

          <div v-if="isJenisDI && selected.catatan" class="mb-6 p-4 bg-blue-50/30 border border-blue-100 rounded-xl">
            <div class="flex items-center gap-2 mb-2 pb-2 border-b border-blue-100/50">
              <Info class="w-4 h-4 text-blue-600" />
              <span class="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Catatan Disposisi</span>
            </div>
            <div class="prose prose-sm prose-blue max-w-none text-gray-800" v-html="selected.catatan"></div>
          </div>

          <div class="relative overflow-hidden transition-all duration-500 ease-in-out"
            :class="[(showReadMoreButton && !isContentExpanded) ? 'max-h-[300px]' : 'max-h-full pb-6']">
            <iframe ref="iframe" :srcdoc="selected.konten || ''" class="w-full bg-transparent block"
              style="border: none;" scrolling="no"></iframe>
            <div v-show="showReadMoreButton && !isContentExpanded"
              class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none">
            </div>
          </div>

          <div v-if="showReadMoreButton" class="flex justify-center mt-[-20px] relative z-20">
            <button @click="toggleContent"
              class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white hover:bg-gray-50 text-xs font-bold text-gray-600 border border-gray-200 shadow-sm transition-all">
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
          class="px-5 sm:px-8 py-6 border-t border-gray-100 bg-gray-50/30">
          <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Paperclip class="w-3.5 h-3.5" /> Lampiran
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
            <button v-for="file in selected.lampiran_files" :key="file.id" @click="openPreview(file)"
              class="w-full rounded-xl border border-gray-200 bg-white hover:border-blue-400 transition-all text-center flex flex-col h-full overflow-hidden group">
              <div class="p-2 w-full">
                <div
                  class="h-24 rounded-lg bg-gray-100 flex flex-col items-center justify-center gap-1 group-hover:bg-blue-50 transition-colors">
                  <FileText class="w-6 h-6 text-red-500" />
                  <span class="text-[10px] font-medium text-gray-500">PDF</span>
                </div>
              </div>
              <div class="px-3 pb-3 flex-1 flex items-center justify-center">
                <p class="text-xs font-medium text-gray-700 leading-snug line-clamp-2 break-all">{{ file.fileName ||
                  file.file_name }}</p>
              </div>
            </button>
          </div>
        </div>

        <div class="p-5 sm:p-8 border-t border-gray-100 bg-white w-full flex flex-wrap gap-3">

          <div @click="handleLanjutNotaDinas"
            class="flex-1 min-w-[200px] flex bg-primary-500 hover:bg-primary-600 cursor-pointer py-2.5 px-4 rounded-lg text-white gap-2 justify-center items-center transition-colors shadow-sm active:scale-[0.98]">
            <FileText class="w-4 h-4" />
            <span class="text-sm font-medium">Lanjut Nota Dinas</span>
          </div>

          <div
            class="flex-1 min-w-[200px] flex bg-purple-500 hover:bg-purple-600 cursor-pointer py-2.5 px-4 rounded-lg text-white gap-2 justify-center items-center transition-colors shadow-sm">
            <FileText class="w-4 h-4" />
            <span class="text-sm font-medium">Lanjut Disposisi</span>
          </div>

          <div v-if="isJenisDI" @click="handleLanjutKonsep"
            class="flex-1 min-w-[200px] flex bg-gray-700 hover:bg-gray-800 cursor-pointer py-2.5 px-4 rounded-lg text-white gap-2 justify-center items-center transition-colors shadow-sm active:scale-[0.98]">
            <Edit3 class="w-4 h-4" />
            <span class="text-sm font-medium">Lanjut Konsep</span>
          </div>
          <UModal v-model:open="isOpenKonsepModal" :dismissible="false"
            :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">


            <template #header>
              <div class="w-full flex justify-between items-start">
                <div>
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    Pilih Jenis Konsep
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Pilih jenis konsep surat yang ingin Anda buat
                  </p>
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
                      {{ opt.label }}
                    </h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {{ opt.desc }}
                    </p>
                  </div>

                  <ChevronRight class="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </div>
            </template>

          </UModal>
        </div>

      </div>
    </div>

    <USlideover v-model:open="isPreviewOpen" :title="previewTitle" side="bottom"
      :ui="{ content: 'h-[90vh] sm:h-screen max-h-screen rounded-t-2xl sm:rounded-none', body: 'p-0', footer: 'p-4 border-t border-gray-200' }">
      <template #body>
        <div class="w-full h-full relative bg-gray-100 flex flex-col">
          <div v-if="isPdfLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
            <Loader2 class="w-10 h-10 animate-spin text-blue-600 mb-2" />
            <span class="text-xs text-gray-500">Memuat Dokumen...</span>
          </div>
          <iframe v-if="activePdfUrl" :src="activePdfUrl" class="w-full h-full border-none flex-1" />
        </div>
      </template>
    </USlideover>

  </div>
</template>
