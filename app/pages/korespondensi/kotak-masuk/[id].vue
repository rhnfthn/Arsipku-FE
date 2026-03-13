<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import {
  Loader2, X, CheckCircle, XCircle, AlertCircle,
  Users, FileText, Building2
} from "lucide-vue-next";

// Import Component Baru
import DetailNaskah from '@/components/DetailNaskah.vue';

// --- SETUP & COMPOSABLES ---
const route = useRoute();
const router = useRouter();
const { user } = useAuth();

const { fetchInboxDetail, fetchKonsepDetail } = useInbox(null);
const { rejectKonsep } = useKonsep();

const id = route.params.id as string;
const jenisQuery = route.query.jenis as string;

const targetHighlightId = computed(() => {
  // Jangan fallback ke route.params.id karena itu adalah ID konsep,
  // bukan ID card/flow yang ada di DOM
  return (route.query.highlight_id as string) || null;
});
// --- Cari bagian script ini dan sesuaikan ---

// Tambahkan Computed Property (Opsional tapi bagus untuk readability)
const isSingleData = computed(() => {
  return !details.value || details.value.length <= 1;
});

const isHighlighted = (detail: any) => {
  // Guard di script (cadangan)
  if (isSingleData.value) return false;

  const target = targetHighlightId.value;
  if (!target) return false;

  if (String(detail.id) === String(target) || String(detail.urutan) === String(target)) {
    return true;
  }

  if (String(target) === String(id) && detail.aksi === 'create') {
    return true;
  }

  return false;
};

const scrollToTarget = async () => {
  await nextTick();

  if (details.value.length <= 1) return;

  setTimeout(() => {
    const targetId = route.query.highlight_id as string;
    let targetDetail: any = null;

    if (targetId) {
      // Ada highlight_id → scroll ke card spesifik
      targetDetail = details.value.find((d: any) =>
        String(d.id) === String(targetId) || String(d.urutan) === String(targetId)
      );
    } else {
      // Tidak ada highlight_id → scroll ke card pertama (index 0)
      targetDetail = details.value[0];
    }

    if (!targetDetail) return;

    const domId = targetDetail.id || targetDetail.urutan;
    const element = document.getElementById(`card-${domId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (targetId) {
      // Highlight ring hanya kalau ada highlight_id eksplisit
      element.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2');
      }, 2000);
    }
  }, 500);
};

// --- COMPUTED: Deteksi Halaman Terkirim ---
const isTerkirim = computed(() => {
  const path = route.path.toLowerCase();
  const jenis = (jenisQuery || '').toUpperCase();
  return path.includes('terkirim') || path.includes('keluar') || jenis === 'SK';
});

// --- LOGIC AKSES (NEW) ---
const allowedActions = computed(() => {
  if (isTerkirim.value) return []; // Terkirim tidak ada tombol

  const tag = user.value?.bodTag;
  const surat = selected.value?.jenis;

  if (!tag) { // STAFF (bodTag is empty/null)
    if (surat === 'DI') return ['KO'];
    return [];
  } else if (tag === 'BOD' || tag === 'BOD-1') {
    if (surat === 'KA') return ['DI', 'ND'];
    return ['DI', 'ND', 'SDI', 'SDE'];
  } else if (tag === 'BOD-2' || tag === 'BOD-3') {
    if (surat === 'DI') return ['DI', 'ND', 'KO'];
    return ['DI', 'ND'];
  }

  return []; // Default
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


// --- DATA FETCHING ---
const loadData = async () => {
  if (!id) return;
  isLoading.value = true;
  details.value = [];
  selected.value = null;

  try {
    if (jenisQuery === 'K') {

      isKonsepData.value = true;
      const response = await fetchKonsepDetail(id);
      const rawData = response?.data || response;

      // 1. PERBAIKAN: Deteksi apakah ada array "flow" di dalam rawData
      let rawFlows = [];
      if (rawData && Array.isArray(rawData.flow)) {
        rawFlows = rawData.flow; // Ambil isian dari array flow
      } else if (Array.isArray(rawData)) {
        rawFlows = rawData;
      } else if (rawData) {
        rawFlows = [rawData];
      }

      // 2. Urutkan berdasarkan created_at descending (terbaru di index 0)
      const sortedFlows = [...rawFlows].sort((a: any, b: any) =>
        new Date(b.created_at || b.tanggal).getTime() - new Date(a.created_at || a.tanggal).getTime()
      );

      if (sortedFlows.length > 0) {
        // Ambil elemen pertama sebagai data utama (terbaru)
        const lastFlow = sortedFlows[0];
        selected.value = lastFlow;

        // Ambil ID user saat ini
        const authUser = user.value || JSON.parse(localStorage.getItem('user_data') || '{}');
        const myPosId = String(authUser?.position?.id || authUser?.position_id || '');

        // Ambil aksi terakhir dari objek 'detail'
        const lastAksi = lastFlow.detail?.aksi || lastFlow.aksi || '';

        // LOGIKA TOMBOL EDIT (Reject)
        const rejectorId = String(lastFlow.pengirim?.position_id || lastFlow.pengirim?.id || '');
        showEditAction.value = (lastAksi === 'reject' && rejectorId !== myPosId);

        // LOGIKA TOMBOL SETUJUI/TOLAK (FINALIZE)
        let isTarget = false;
        if (myPosId && Array.isArray(lastFlow.penerima)) {
          isTarget = lastFlow.penerima.some((t: any) => String(t.position_id || t.id || '') == myPosId);
        }
        showFinalizeActions.value = isTarget;

        // Mapping array ke state details
        // Mapping array ke state details
        details.value = sortedFlows.map((flow: any, index: number) => {
          // Ambil properti dari flow
          const aksi = flow.detail?.aksi || flow.aksi || 'read';
          const catatan = flow.detail?.catatan || flow.catatan || '';

          return {
            id: flow.id,
            urutan: sortedFlows.length - index,
            aksi: aksi,
            jenis: flow.jenis || 'K',
            jenis_label: flow.jenis_label || 'Konsep',
            perihal: flow.perihal || '-',
            nomor: flow.nomor || '-',
            tanggal: flow.created_at || flow.tanggal,

            // --- PERUBAHAN ADA DI SINI ---
            // 'from' untuk profil/avatar yang melakukan aksi (Pembuat Draft/Disposisi)
            from: flow.pengirim || {},



            // 'pengirim' untuk data teks Pengirim Surat/Naskah
            pengirim: flow.detail?.naskah_pengirim || flow.pengirim || {},

            penerima: flow.penerima,

            // 'to' untuk data teks Tertuju Surat/Naskah
            to: flow.detail?.naskah_penerima || flow.penerima || [],

            // 'cc' untuk data teks Tembusan Surat/Naskah
            cc: flow.detail?.naskah_tembusan || flow.tembusan || [],
            // -----------------------------

            rich_content: flow.konten || '',
            catatan: catatan,
            attachments: flow.lampiran_files || [],
            pdf_snapshot: flow.final_pdf_url || flow.final_pdf || '',
            _ui: { showAllRecipients: false, showAllCC: false, isContentExpanded: false, showReadMoreButton: false }
          };
        });
      }
    } else {
      // === LOGIC SURAT MASUK/DISPOSISI/TERKIRIM ===
      isKonsepData.value = false;
      const response = await fetchInboxDetail(id, jenisQuery);
      const rawData = response?.data || response;

      // PERBAIKAN: Identifikasi apakah rawData adalah array of flows langsung
      let rawFlows = [];
      let inboxData = null;

      if (Array.isArray(rawData)) {
        if (rawData.length > 0 && rawData[0].flow) {
          // Kasus jika formatnya array dan punya child "flow"
          inboxData = rawData[0];
          rawFlows = inboxData.flow;
        } else {
          // Kasus jika formatnya langsung flat array (seperti source data JSON terbaru)
          rawFlows = rawData;
          inboxData = rawData[0]; // Jadikan item pertama sebagai fallback data utama
        }
      } else if (rawData) {
        // Kasus jika formatnya single object
        inboxData = rawData;
        rawFlows = (inboxData.flow && inboxData.flow.length > 0) ? inboxData.flow : [inboxData];
      }

      if (inboxData && rawFlows.length > 0) {
        selected.value = inboxData;

        details.value = rawFlows.map((item: any) => {
          let listPenerima: any[] = [];
          if (Array.isArray(item.penerima) && item.penerima.length > 0) listPenerima = item.penerima;
          else if (Array.isArray(item.kepada) && item.kepada.length > 0) listPenerima = item.kepada;
          else if (Array.isArray(item.to)) listPenerima = item.to;
          else if (item.to && typeof item.to === 'object') listPenerima = [item.to];

          if (listPenerima.length === 0 && inboxData) {
            if (Array.isArray(inboxData.penerima)) listPenerima = inboxData.penerima;
            else if (Array.isArray(inboxData.kepada)) listPenerima = inboxData.kepada;
          }

          // ---- GRUPING PENERIMA ----
          const penerimaGrup = item.penerima_grup || inboxData?.penerima_grup || inboxData?.raw?.penerima_grup || [];
          listPenerima = processGrouping(listPenerima, penerimaGrup);


          let listTembusan: any[] = [];
          if (Array.isArray(item.tembusan)) listTembusan = item.tembusan;
          else if (Array.isArray(item.cc)) listTembusan = item.cc;

          if (listTembusan.length === 0 && inboxData) {
            if (Array.isArray(inboxData.tembusan)) listTembusan = inboxData.tembusan;
            else if (Array.isArray(inboxData.cc)) listTembusan = inboxData.cc;
          }

          // ---- GRUPING TEMBUSAN ----
          const tembusanGrup = item.tembusan_grup || inboxData?.tembusan_grup || inboxData?.raw?.tembusan_grup || [];
          listTembusan = processGrouping(listTembusan, tembusanGrup);

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

    // await nextTick(); // Tunggu DOM selesai render

    // if (targetHighlightId.value) {
    //   const elementId = `card-${targetHighlightId.value}`;
    //   const element = document.getElementById(elementId);

    //   if (element) {
    //     // Scroll ke elemen
    //     element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    //     // Opsional: Fokuskan element jika perlu aksesibilitas
    //     element.focus();
    //   }
    // }

  } catch (e) {
    console.error("❌ Error loading data", e);
  } finally {
    isLoading.value = false;
    scrollToTarget();
  }
};

// Tambahkan fungsi ini di atas fungsi loadData()
const processGrouping = (individuals: any[], groups: any[]) => {
  if (!Array.isArray(individuals) || individuals.length === 0) return [];
  if (!Array.isArray(groups) || groups.length === 0) return individuals;

  // Pastikan ambil ID dengan fallback yang aman
  const individualIds = new Set(individuals.map(item => String(item.position_id || item.id)));
  const matchedIds = new Set();
  const result: any[] = [];

  // 1. Ambil ID posisi user saat ini untuk dieksklusi (dikecualikan)
  const authUser = user.value || JSON.parse(localStorage.getItem('user_data') || '{}');
  const myPosId = String(authUser?.position?.id || authUser?.position_id || authUser?.position || '');

  for (const group of groups) {
    const reqIds = group.position_ids || [];

    // 2. Cek apakah setiap ID ada di individualIds, ATAU ID tersebut adalah milik user saat ini
    const isComplete = reqIds.length > 0 && reqIds.every((id: any) => {
      const strId = String(id);
      return individualIds.has(strId) || strId === myPosId;
    });

    if (isComplete) {
      result.push({
        nama: group.nama,
        position_text: group.nama,
        is_group: true
      });
      // Tandai semua ID dalam grup ini sebagai sudah di-grouping
      reqIds.forEach((id: any) => matchedIds.add(String(id)));
    }
  }

  // 3. Masukkan sisa individu yang tidak tergabung ke dalam grup manapun yang valid
  for (const indiv of individuals) {
    if (!matchedIds.has(String(indiv.position_id || indiv.id))) {
      result.push(indiv);
    }
  }

  return result;
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
      // PERBAIKAN: Ambil id dari dalam object detail.naskah_pengirim
      from_position_id: selected.value?.detail?.naskah_pengirim?.position_id || selected.value?.pengirim?.position_id,
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

// HANDLER ROUTING YANG BARU UNTUK 4 TOMBOL
const handleLanjutNotaDinas = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/lanjut/nota-dinas', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'tindak_lanjut' } }); };
const handleLanjutSDI = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/lanjut/surat-dinas-internal', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'tindak_lanjut' } }); };
const handleLanjutSDE = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/lanjut/surat-dinas-eksternal', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'tindak_lanjut' } }); };
const handleLanjutDisposisi = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/lanjut/disposisi', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'disposisi' } }); };
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
      <div v-for="(detail, index) in details" :key="detail.id || detail.urutan || index"
        :id="`card-${detail.id || detail.urutan}`" class="transition-all duration-500 scroll-mt-24" :class="{
          'ring-2 ring-primary-200 rounded-xl mt-5': details.length > 1 && isHighlighted(detail)
        }">
        <DetailNaskah context="inbox" :data="detail" :is-head="index === 0"
          :show-finalize="isKonsepData && index === 0 && showFinalizeActions"
          :show-edit="isKonsepData && index === 0 && showEditAction"
          :show-footer-actions="!isKonsepData && index === 0 && !isTerkirim" :allowed-actions="allowedActions"
          :user-position-id="user.position" @back="goBack" @preview="(url) => openDocumentPreview(url, detail.perihal)"
          @preview-file="openPreviewFile" @finalize="handleFinalize" @reject="handleReject" @edit="handleEditKonsep"
          @lanjut-nota="handleLanjutNotaDinas" @lanjut-sdi="handleLanjutSDI" @lanjut-sde="handleLanjutSDE"
          @lanjut-disposisi="handleLanjutDisposisi" @lanjut-konsep="isOpenKonsepModal = true" />

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
              <!-- <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{{ opt.desc }}</p> -->
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
            <!-- <div class="p-2 bg-red-100 rounded-full">
              <AlertCircle class="w-5 h-5 text-red-600" />
            </div> -->
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
