<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import {
  Loader2, X, CheckCircle, XCircle, AlertCircle,
  Users, FileText, Building2
} from "lucide-vue-next";

// Import Component Baru
// Jika Anda pakai DetailNaskah, import DetailNaskah seperti sebelumnya:
import DetailNaskah from '@/components/DetailNaskah.vue';

definePageMeta({ middleware: "auth" });

// --- SETUP & COMPOSABLES ---
const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const positionId = computed(() => user.value?.position?.id || user.value?.position_id);

const { fetchInboxDetail, fetchKonsepDetail } = useInbox(null);
const { rejectKonsep } = useKonsep();

const id = route.params.id as string;
const jenisQuery = route.query.jenis as string;

// --- DEFINISI VARIABEL YANG HILANG (FIX ERROR DISINI) ---
const targetHighlightId = computed(() => {
  return (route.query.highlight_id as string) || (route.query.ref_id as string) || (route.params.id as string);
});

// --- STATE ---
const details = ref<any[]>([]);
const selected = ref<any>(null);
const isLoading = ref(true);
const isKonsepData = ref(false);

// Helper Computed: Cek apakah data tunggal (untuk mematikan highlight)
const isSingleData = computed(() => {
  return !details.value || details.value.length <= 1;
});

// --- COMPUTED: Deteksi Halaman Terkirim ---
const isTerkirim = computed(() => {
  const path = route.path.toLowerCase();
  const jenis = (jenisQuery || '').toUpperCase();
  return path.includes('terkirim') || path.includes('keluar') || jenis === 'SK';
});

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: isTerkirim.value ? "Terkirim" : "Kotak Masuk", to: isTerkirim.value ? "/korespondensi/terkirim" : "/korespondensi/kotak-masuk" },
  { label: "Detail Surat", to: "#" },
];

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

// --- HELPER FUNCTION UNTUK GROUPING ---
const processGrouping = (individuals: any[], groups: any[]) => {
  if (!Array.isArray(individuals) || individuals.length === 0) return [];
  if (!Array.isArray(groups) || groups.length === 0) return individuals;

  // 1. Kumpulkan semua ID yang benar-benar ada di list penerima/tembusan
  const individualIds = new Set(individuals.map(item => String(item.position_id || item.id)));
  const matchedIds = new Set();
  const result: any[] = [];

  // 2. Ambil ID user saat ini (Pengirim yang dikecualikan)
  const myPosId = String(user.value?.position?.id || user.value?.position_id || user.value?.position || '');

  // 3. Evaluasi setiap grup
  for (const group of groups) {
    const reqIds = group.position_ids || [];

    // Cek apakah semua ID grup terpenuhi (Ada di list ATAU merupakan si pengirim)
    const isComplete = reqIds.length > 0 && reqIds.every((id: any) => {
      const strId = String(id);
      return individualIds.has(strId) || strId === myPosId;
    });

    if (isComplete) {
      // Masukkan representasi Grup
      result.push({
        id: group.id || `group-${Math.random()}`,
        nama: group.nama,
        position_text: group.nama,
        organization_text: 'Grup Penerima',
        is_group: true
      });
      // Tandai ID yang sudah masuk ke grup ini
      reqIds.forEach((id: any) => matchedIds.add(String(id)));
    }
  }

  // 4. Masukkan sisa individu yang tidak tergabung ke dalam grup manapun
  for (const indiv of individuals) {
    const indivId = String(indiv.position_id || indiv.id);
    if (!matchedIds.has(indivId)) {
      result.push(indiv);
    }
  }

  return result;
};

// --- LOGIC HIGHLIGHT (Fixed) ---
const isHighlighted = (detail: any) => {
  // 1. Guard: Jika data cuma satu, matikan highlight
  if (isSingleData.value) return false;

  const target = targetHighlightId.value;
  if (!target) return false;

  // 2. Cek ID Flow / Urutan
  if (String(detail.id) === String(target) || String(detail.urutan) === String(target)) {
    return true;
  }

  // 3. Cek ID Konsep Utama (Highlight card 'create')
  if (String(target) === String(id) && detail.aksi === 'create') {
    return true;
  }

  return false;
};

// --- LOGIC SCROLL (Fixed) ---
const scrollToTarget = async () => {
  await nextTick();

  // 1. Guard: Jangan scroll jika data cuma 1
  if (details.value.length <= 1) {
    return;
  }

  const targetId = targetHighlightId.value;
  if (!targetId) return;

  setTimeout(() => {
    const foundDetail = details.value.find((d: any) => {
      if (d.id && String(d.id) === String(targetId)) return true;
      if (d.urutan && String(d.urutan) === String(targetId)) return true;
      if (d.aksi === 'create' && String(targetId) === String(id)) return true;
      return false;
    });

    if (foundDetail) {
      const domId = foundDetail.id || foundDetail.urutan;
      const element = document.getElementById(`card-${domId}`);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Efek ring manual via JS (Double protection)
        if (details.value.length > 1) {
          element.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2');
          }, 2000);
        }
      }
    }
  }, 500);
};

// --- LOGIC AKSES (NEW) ---
const allowedActions = computed(() => {
  if (isTerkirim.value) return [];

  const tag = user.value?.bodTag;
  const surat = selected.value?.jenis;

  if (!tag) {
    if (surat === 'DI') return ['KO'];
    return [];
  } else if (tag === 'BOD' || tag === 'BOD-1') {
    if (surat === 'KA') return ['DI', 'ND'];
    return ['DI', 'ND', 'SDI', 'SDE'];
  } else if (tag === 'BOD-2' || tag === 'BOD-3') {
    if (surat === 'DI') return ['DI', 'ND', 'KO'];
    return ['DI', 'ND'];
  }

  return [];
});

// --- DATA FETCHING ---
// --- DATA FETCHING ---
const loadData = async () => {
  if (!id) return;
  isLoading.value = true;
  details.value = [];
  selected.value = null;

  try {
    if (jenisQuery === 'K') {
      // === KONSEP ===
      isKonsepData.value = true;
      const response = await fetchKonsepDetail(id);
      const konsepData = response?.data || response;

      if (konsepData) {
        selected.value = konsepData;
        const rawFlows = konsepData.flow || [];

        const sortedFlows = [...rawFlows].sort((a: any, b: any) =>
          new Date(b.created_at || b.tanggal).getTime() - new Date(a.created_at || a.tanggal).getTime()
        );

        const lastFlow = sortedFlows.length > 0 ? sortedFlows[0] : null;

        if (lastFlow) {
          const authUser = user.value || JSON.parse(localStorage.getItem('user_data') || '{}');
          const myPosId = String(authUser?.position?.id || authUser?.position_id || '');

          // Rejector adalah aktor root pengirim dari flow terakhir
          const rejectorId = String(lastFlow.pengirim?.position_id || lastFlow.pengirim?.id || '');
          const lastAction = lastFlow.detail?.aksi;

          showEditAction.value = (lastAction === 'reject' && rejectorId !== myPosId);

          let isTarget = false;
          // Cek akses menggunakan penerima flow root (siapa yang dituju oleh forward/reject)
          if (myPosId && Array.isArray(lastFlow.penerima)) {
            isTarget = lastFlow.penerima.some((t: any) => String(t.position_id || t.id || '') === myPosId);
          }
          showFinalizeActions.value = isTarget;
        }

        // --- MAP DATA UNTUK UI COMPONENT DETAIL ---
        details.value = sortedFlows.map((flow: any, index: number) => {
          const aksi = flow.detail?.aksi || 'read';
          const flowId = flow.id;

          return {
            id: flowId,
            sifat: flow.sifat,
            urutan: sortedFlows.length - index,
            aksi: aksi,
            jenis: flow.jenis || 'K',
            jenis_label: flow.jenis_label || (aksi === 'create' ? 'KONSEP AWAL' : aksi.toUpperCase()),
            perihal: flow.perihal || konsepData.perihal,
            nomor: flow.nomor || '-',
            tanggal: flow.created_at || flow.tanggal,

            // Pengirim dokumen di-header utama vs aktor flow
            pengirim: flow.detail?.naskah_pengirim || flow.pengirim,
            from: flow.pengirim, // Aktor alur (Yusak meneruskan ke Suryadi, from = Yusak)

            // Jika aksi 'create', tampilkan target asli surat. Jika alur biasa, tampilkan tujuan alur
            to: aksi === 'create' ? (flow.detail?.naskah_penerima || flow.penerima || []) : (flow.penerima || []),
            cc: aksi === 'create' ? (flow.detail?.naskah_tembusan || flow.tembusan || []) : (flow.tembusan || []),

            rich_content: flow.konten || '',
            catatan: flow.detail?.catatan,
            attachments: flow.lampiran_files || [],
            pdf_snapshot: flow.final_pdf_url,
            _ui: { showAllRecipients: false, showAllCC: false, isContentExpanded: false, showReadMoreButton: false }
          };
        });
      }
    } else {
      // === SURAT MASUK / KELUAR ===
      isKonsepData.value = false;
      const response = await fetchInboxDetail(id, jenisQuery);

      const dataArray: any[] = Array.isArray(response) ? response : (response ? [response] : []);
      const firstItem = dataArray[0]?.raw || dataArray[0];

      if (firstItem) {
        selected.value = firstItem;

        details.value = dataArray.map((item: any) => {
          const d = item.raw || item;

          let listPenerima: any[] = [];
          if (Array.isArray(d.penerima) && d.penerima.length > 0) listPenerima = d.penerima;
          else if (Array.isArray(d.kepada) && d.kepada.length > 0) listPenerima = d.kepada;
          if (listPenerima.length === 0 && d.detail?.kepada_yth) {
            listPenerima = d.detail.kepada_yth.split(';').map((n: string) => ({ nama: n.trim(), position_text: n.trim() })).filter((x: any) => x.nama);
          }

          let listTembusan: any[] = [];
          if (Array.isArray(d.tembusan)) listTembusan = d.tembusan;
          else if (Array.isArray(d.cc)) listTembusan = d.cc;

          // ==========================================
          // EKSEKUSI GROUPING DI SINI
          // ==========================================
          const penerimaGrup = d.penerima_grup || [];
          const tembusanGrup = d.tembusan_grup || [];

          const finalPenerima = processGrouping(listPenerima, penerimaGrup);
          const finalTembusan = processGrouping(listTembusan, tembusanGrup);

          return {
            id: d.id,
            ttd: item.ttd,
            sifat: item.sifat,
            dikirim_oleh: d.dikirim_oleh || null,  // ← hanya satu
            aksi: d.status || 'read',
            jenis: d.jenis || 'SM',
            jenis_label: d.jenis_label || 'SURAT MASUK',
            perihal: d.perihal,
            nomor: d.nomor || '-',
            tanggal: d.tanggal || d.created_at,
            pengirim: d.pengirim,
            to: finalPenerima,
            cc: finalTembusan,
            mainDisplayContentHtml: d.konten || '',
            catatan: d.detail?.catatan || d.disposisi_content?.catatan || '',  // ← optional chaining
            disposisi: d.disposisi || d.instruksi || d.disposisi_content?.disposisi,
            lampiran_files: d.lampiran_files || d.attachments || [],
            final_pdf_url: d.final_pdf_url || d.file_url,
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

// --- ACTION HANDLERS (Sama seperti sebelumnya) ---
const goBack = () => router.back();
const handleFinalize = () => { showFinalizeOptionsModal.value = true; };
const handleReject = () => { rejectNote.value = ""; showRejectModal.value = true; };
const handleFinalizeAndRedirect = () => {
  showFinalizeOptionsModal.value = false;
  if (selected.value?.id) {
    router.push({ path: '/korespondensi/tulis/finalisasi/nota-dinas', query: { ref_id: selected.value.id, action: 'finalize' } });
  }
};
const handleConfirmReject = async () => {
  if (!rejectNote.value.trim()) return alert("Mohon isi catatan penolakan.");
  isRejecting.value = true;
  try {
    const payload = { from_position_id: selected.value?.pengirim?.position_id, catatan: rejectNote.value };
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
const handleEditKonsep = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/konsep/nota-dinas', query: { ref_id: selected.value.id, action: 'edit' } }); };
const handleLanjutNotaDinas = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/lanjut/nota-dinas', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'tindak_lanjut' } }); };
const handleLanjutSDI = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/konsep/surat-dinas-internal', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'tindak_lanjut' } }); };
const handleLanjutSDE = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/konsep/surat-dinas-eksternal', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'tindak_lanjut' } }); };
const handleLanjutDisposisi = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/disposisi', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'disposisi' } }); };
const selectKonsep = (opt: any) => { isOpenKonsepModal.value = false; if (selected.value?.id) router.push({ path: opt.path, query: { ref_id: selected.value.id, workflow: 'konsep', ref_jenis: selected.value.jenis } }); };
const openDocumentPreview = async (url: string, title = "Dokumen") => {
  if (!url) { alert("URL tidak valid."); return; }
  previewTitle.value = title; isPreviewOpen.value = true; isLocalPdfLoading.value = true; activePdfUrl.value = null;
  try {
    const response = await fetch(url); const blob = new Blob([await response.arrayBuffer()], { type: 'application/pdf' }); activePdfUrl.value = URL.createObjectURL(blob);
  } catch (error) { activePdfUrl.value = url; } finally { isLocalPdfLoading.value = false; }
};
const openPreviewFile = (file: any) => openDocumentPreview(file.file_url || file.fileUrl || file.file_path, file.file_name || file.fileName);
const konsepOptions = [
  { type: 'ND', label: 'Nota Dinas', desc: 'Komunikasi internal', path: '/korespondensi/tulis/konsep/nota-dinas', icon: FileText, colorClass: 'bg-blue-100 text-blue-600' },
  { type: 'SDI', label: 'Surat Internal', desc: 'Resmi internal', path: '/korespondensi/tulis/konsep/surat-dinas-internal', icon: Users, colorClass: 'bg-green-100 text-green-600' },
  { type: 'SDE', label: 'Surat Eksternal', desc: 'Pihak luar', path: '/korespondensi/tulis/konsep/surat-dinas-eksternal', icon: Building2, colorClass: 'bg-orange-100 text-orange-600' }
];
</script>

<template>
  <PageHeader title="Detail Surat" :items="breadcrumbs" />

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

        <DetailNaskah context="sent" :data="detail" :is-head="index === 0"
          :show-finalize="isKonsepData && index === 0 && showFinalizeActions"
          :show-edit="isKonsepData && index === 0 && showEditAction"
          :show-footer-actions="!isKonsepData && index === 0 && !isTerkirim" :allowed-actions="allowedActions"
          :user-position-id="positionId" :is-jenis-d-i="isJenisDI" @back="goBack"
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
