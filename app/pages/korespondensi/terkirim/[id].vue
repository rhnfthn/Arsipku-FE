<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import {
  Loader2, X, CheckCircle, XCircle, AlertCircle,
  Users, FileText, Building2 // Pastikan icon ini diimport agar tidak error ReferenceError
} from "lucide-vue-next";

// Import Component Baru
import CardSuratDetail from '@/components/CardSuratDetail.vue';

// --- SETUP & COMPOSABLES ---
const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const positionId = computed(() => user.value?.position?.id || user.value?.position_id);

const { fetchInboxDetail, fetchKonsepDetail } = useInbox(null);
const { rejectKonsep } = useKonsep();

const id = route.params.id as string;
const jenisQuery = route.query.jenis as string;

// --- COMPUTED: Deteksi Halaman Terkirim ---
const isTerkirim = computed(() => {
  // Cek apakah URL mengandung kata 'terkirim' atau query jenis adalah 'SK' (Surat Keluar)
  const path = route.path.toLowerCase();
  const jenis = (jenisQuery || '').toUpperCase();
  return path.includes('terkirim') || path.includes('keluar') || jenis === 'SK';
});

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: isTerkirim.value ? "Surat Keluar" : "Kotak Masuk", to: isTerkirim.value ? "/korespondensi/surat-keluar" : "/korespondensi/kotak-masuk" },
  { label: "Detail Surat", to: "#" },
];

// --- STATE ---
const details = ref<any[]>([]);
const selected = ref<any>(null);
const isLoading = ref(true);
const isKonsepData = ref(false);

// Actions State
const showEditAction = ref(false);
const showFinalizeActions = ref(false);
const isOpenKonsepModal = ref(false);

// Modals State
const showFinalizeOptionsModal = ref(false);
const showRejectModal = ref(false);
const rejectNote = ref("");
const isRejecting = ref(false);

// Preview State
const isPreviewOpen = ref(false);
const previewTitle = ref("Preview Dokumen");
const activePdfUrl = ref<string | null>(null);
const isLocalPdfLoading = ref(false);

const isJenisDI = computed(() => {
  const j = selected.value?.jenis || '';
  const l = selected.value?.jenis_label || '';
  return j.toUpperCase() === "DI" || l.toUpperCase().includes("DISPOSISI");
});

const isHighlighted = (detail: any) => {
  const targetId = route.query.ref_id || route.query.highlight_id || route.params.id;
  // Cek apakah ID detail cocok, atau jika ini kartu 'create' dan ID params cocok dengan Konsep ID
  return String(detail.id) === String(targetId) ||
    (detail.aksi === 'create' && String(targetId) === String(selected.value?.konsep?.id || id));
};

const scrollToTarget = async () => {
  await nextTick(); // Tunggu DOM selesai dirender ulang

  // 1. Tentukan ID mana yang dicari
  // Prioritas: Query Param (ref_id) -> URL Param (id utama)
  const targetId = route.query.ref_id || route.query.highlight_id || route.params.id;

  if (!targetId) return;

  // 2. Cari data yang cocok di array 'details'
  const foundDetail = details.value.find((d: any) => {
    // a. Cek exact match pada ID flow
    if (String(d.id) === String(targetId)) return true;

    // b. LOGIKA KHUSUS: Jika target adalah ID Konsep (dari URL utama),
    // maka arahkan ke kartu 'create' (karena itu akar dari ID tersebut)
    if (d.aksi === 'create' && String(targetId) === String(id)) return true;

    return false;
  });

  // 3. Jika ketemu, cari elemen HTML-nya dan scroll
  if (foundDetail) {
    const elementId = `card-${foundDetail.id || foundDetail.urutan}`;
    const el = document.getElementById(elementId);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Opsional: Hapus highlight setelah beberapa detik
      // setTimeout(() => router.replace({ query: { ...route.query, ref_id: undefined } }), 2000);
    }
  }
};

// --- DATA FETCHING ---
const loadData = async () => {
  if (!id) return;
  isLoading.value = true;
  details.value = [];
  selected.value = null;

  try {
    if (jenisQuery === 'K') {
      // === LOGIC KONSEP ===
      isKonsepData.value = true;
      const response = await fetchKonsepDetail(id);
      const konsepData = response?.data || response;

      if (konsepData) {
        selected.value = konsepData;
        const rawFlows = konsepData.flow || [];
        const sortedFlows = [...rawFlows].sort((a: any, b: any) => b.urutan - a.urutan);
        const lastFlow = sortedFlows.length > 0 ? sortedFlows[0] : null;

        // Logic Actions
        if (lastFlow) {
          showEditAction.value = (lastFlow.aksi === 'reject' && String(lastFlow.from?.position_id) !== String(positionId.value));

          let lastTargetId = null;
          if (Array.isArray(lastFlow.to)) {
            const found = lastFlow.to.find((t: any) => String(t.position_id) === String(positionId.value));
            if (found) lastTargetId = positionId.value;
          } else {
            lastTargetId = lastFlow.to?.position_id;
          }

          showFinalizeActions.value = (String(lastTargetId) === String(positionId.value));
        }

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

          let flowId = flow.id;
          if (!flowId) {
            flowId = flow.aksi === 'create' ? konsepData.konsep?.id : `flow-${flow.urutan}`;
          }

          return {
            id: flowId,
            urutan: flow.urutan,
            aksi: flow.aksi,
            jenis: flow.aksi === 'kirim_disposisi' ? 'DI' : 'ND',
            jenis_label: flow.aksi === 'create' ? 'KONSEP AWAL' : (flow.aksi === 'kirim_disposisi' ? 'DISPOSISI' : flow.aksi.toUpperCase()),
            perihal: flow.subject || konsepData.perihal,
            nomor: konsepData.nomor || '-',
            tanggal: flow.created_at || flow.tanggal,
            pengirim: (flow.aksi === 'create') ? konsepData.pengirim : flow.from,
            from: flow.from,
            to: penerimaList,
            cc: tembusanList,
            rich_content: kontenText,
            catatan: flow.catatan || flow.disposisi_content?.catatan,
            disposisi_content: flow.disposisi_content,
            attachments: flow.attachments || [],
            pdf_snapshot: flow.pdf_snapshot || konsepData.final_pdf_url,
            _ui: { showAllRecipients: false, showAllCC: false, isContentExpanded: false, showReadMoreButton: false }
          };
        });
      }
    } else {
      // === LOGIC SURAT MASUK/DISPOSISI/TERKIRIM ===
      isKonsepData.value = false;
      const response = await fetchInboxDetail(id, jenisQuery);
      const rawData = response?.data || response;
      const inboxData = Array.isArray(rawData) ? rawData[0] : rawData;

      if (inboxData) {
        selected.value = inboxData;
        const rawFlows = (inboxData.flow && inboxData.flow.length > 0) ? inboxData.flow : [inboxData];

        details.value = rawFlows.map((item: any) => {
          let listPenerima: any[] = [];
          if (Array.isArray(item.penerima) && item.penerima.length > 0) listPenerima = item.penerima;
          else if (Array.isArray(item.kepada) && item.kepada.length > 0) listPenerima = item.kepada;
          else if (Array.isArray(item.to)) listPenerima = item.to;
          else if (item.to && typeof item.to === 'object') listPenerima = [item.to];

          if (listPenerima.length === 0) {
            if (Array.isArray(inboxData.penerima)) listPenerima = inboxData.penerima;
            else if (Array.isArray(inboxData.kepada)) listPenerima = inboxData.kepada;
          }

          if (listPenerima.length === 0 && item.detail?.kepada_yth) {
            listPenerima = item.detail.kepada_yth.split(';').map((n: string) => ({ nama: n.trim(), position_text: n.trim() })).filter((x: any) => x.nama);
          }

          let listTembusan: any[] = [];
          if (Array.isArray(item.tembusan)) listTembusan = item.tembusan;
          else if (Array.isArray(item.cc)) listTembusan = item.cc;

          if (listTembusan.length === 0) {
            if (Array.isArray(inboxData.tembusan)) listTembusan = inboxData.tembusan;
            else if (Array.isArray(inboxData.cc)) listTembusan = inboxData.cc;
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
            to: listPenerima,
            cc: listTembusan,
            mainDisplayContentHtml: item.konten || item.isi || '',
            catatan: item.catatan,
            disposisi: item.disposisi || item.instruksi,
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
    scrollToTarget();
  }
};

onMounted(() => { loadData(); });

// --- ACTIONS HANDLERS ---
const goBack = () => router.back();

const handleFinalize = () => { showFinalizeOptionsModal.value = true; };
const handleReject = () => { rejectNote.value = ""; showRejectModal.value = true; };

const handleFinalizeAndRedirect = () => {
  showFinalizeOptionsModal.value = false;
  if (selected.value?.id) {
    router.push({
      path: '/korespondensi/tulis/finalisasi/nota-dinas',
      query: { ref_id: selected.value.id, action: 'finalize' }
    });
  }
};

const handleConfirmReject = async () => {
  if (!rejectNote.value.trim()) return alert("Mohon isi catatan penolakan.");
  isRejecting.value = true;
  try {
    const payload = {
      from_position_id: selected.value?.pengirim?.position_id,
      catatan: rejectNote.value
    };
    const res = await rejectKonsep(selected.value.id, payload);
    if (res && res.success) {
      showRejectModal.value = false;
      alert("Konsep berhasil ditolak.");
      loadData();
    } else {
      alert(res?.message || "Gagal menolak konsep.");
    }
  } catch (error) {
    console.error("Gagal menolak:", error);
    alert("Terjadi kesalahan.");
  } finally {
    isRejecting.value = false;
  }
};

const handleEditKonsep = () => {
  if (selected.value?.id) {
    router.push({ path: '/korespondensi/tulis/konsep/nota-dinas', query: { ref_id: selected.value.id, action: 'edit' } });
  }
};

const handleLanjutNotaDinas = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/lanjut/nota-dinas', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'tindak_lanjut' } }); };
const handleLanjutDisposisi = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/disposisi', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'disposisi' } }); };
const selectKonsep = (opt: any) => { isOpenKonsepModal.value = false; if (selected.value?.id) router.push({ path: opt.path, query: { ref_id: selected.value.id, workflow: 'konsep', ref_jenis: selected.value.jenis } }); };

// Preview Handlers
const openDocumentPreview = async (url: string, title = "Dokumen") => {
  if (!url) { alert("URL tidak valid."); return; }
  previewTitle.value = title;
  isPreviewOpen.value = true;
  isLocalPdfLoading.value = true;
  activePdfUrl.value = null;
  try {
    const response = await fetch(url);
    const blob = new Blob([await response.arrayBuffer()], { type: 'application/pdf' });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    activePdfUrl.value = url;
  } finally {
    isLocalPdfLoading.value = false;
  }
};
const openPreviewFile = (file: any) => openDocumentPreview(file.file_url || file.fileUrl || file.file_path, file.file_name || file.fileName);

// Options Data
const konsepOptions = [
  { type: 'ND', label: 'Nota Dinas', desc: 'Komunikasi internal', path: '/korespondensi/tulis/konsep/nota-dinas', icon: FileText, colorClass: 'bg-blue-100 text-blue-600' },
  { type: 'SDI', label: 'Surat Internal', desc: 'Resmi internal', path: '/korespondensi/tulis/konsep/surat-dinas-internal', icon: Users, colorClass: 'bg-green-100 text-green-600' },
  { type: 'SDE', label: 'Surat Eksternal', desc: 'Pihak luar', path: '/korespondensi/tulis/konsep/surat-dinas-eksternal', icon: Building2, colorClass: 'bg-orange-100 text-orange-600' }
];
</script>

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
        :id="`card-${detail.id || detail.urutan || index}`" class="transition-all duration-500 scroll-mt-24"
        :class="{ 'ring-2 ring-primary-200 rounded-xl mt-5': isHighlighted(detail) }">

        <DetailNaskah context="sent" :data="detail" :is-head="index === 0"
          :show-finalize="isKonsepData && index === 0 && showFinalizeActions"
          :show-edit="isKonsepData && index === 0 && showEditAction"
          :show-footer-actions="!isKonsepData && index === 0 && !isTerkirim" :is-jenis-d-i="isJenisDI" @back="goBack"
          @preview="(url) => openDocumentPreview(url, detail.perihal)" @preview-file="openPreviewFile"
          @finalize="handleFinalize" @reject="handleReject" @edit="handleEditKonsep"
          @lanjut-nota="handleLanjutNotaDinas" @lanjut-disposisi="handleLanjutDisposisi"
          @lanjut-konsep="isOpenKonsepModal = true" />

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

    <UModal v-model:open="showFinalizeOptionsModal" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header>
        <div class="w-full flex justify-between items-start">
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">Finalisasi Konsep</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Apakah Anda yakin ingin memfinalisasi konsep ini?
            </p>
          </div>
          <button @click="showFinalizeOptionsModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
      </template>
      <template #body>
        <div class="flex justify-end gap-3">
          <button @click="showFinalizeOptionsModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700">Batal</button>
          <button @click="handleFinalizeAndRedirect"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
            <CheckCircle class="w-4 h-4" /> Ya, Finalisasi
          </button>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showRejectModal" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header>
        <div class="w-full flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="p-2 bg-red-100 rounded-full">
              <AlertCircle class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">Tolak Konsep</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Berikan alasan penolakan konsep ini.</p>
            </div>
          </div>
          <button @click="showRejectModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
      </template>
      <template #body>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Catatan Penolakan <span
                class="text-red-500">*</span></label>
            <textarea v-model="rejectNote" rows="4"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-gray-400 dark:text-white mt-2"
              placeholder="Contoh: Perihal kurang jelas..."></textarea>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showRejectModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700">Batal</button>
          <button @click="handleConfirmReject" :disabled="isRejecting || !rejectNote.trim()"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
            <Loader2 v-if="isRejecting" class="w-4 h-4 animate-spin" /> {{ isRejecting ? 'Memproses...' : 'Tolak Konsep'
            }}
          </button>
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
