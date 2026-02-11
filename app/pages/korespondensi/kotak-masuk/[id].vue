<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from "vue";
import { useRoute, useRouter } from 'vue-router';
import {
  Hash, Calendar, Tag, Paperclip, FileText, Loader2, X, ArrowLeft, Printer, MoreHorizontal, ChevronUp, Users, Building2, ChevronRight, Send, Edit3,
  CheckCircle, XCircle, AlertCircle
} from "lucide-vue-next";

// --- SETUP & COMPOSABLES ---
const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const positionId = computed(() => user.value?.position);
const { fetchInboxDetail, fetchKonsepDetail } = useInbox(null);
const { rejectKonsep } = useKonsep();

const id = route.params.id as string;
const jenis = route.query.jenis as string;

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Kotak Masuk", to: "/korespondensi/kotak-masuk" },
  { label: "Detail Surat", to: "#" },
];

// --- CONSTANTS ---
const LIMIT_DISPLAY = 2;
const MAX_CONTENT_HEIGHT = 300;

// --- STATE ---
const selected = ref<any>(null);
const mainIframe = ref<HTMLIFrameElement | null>(null); // Renamed iframe to mainIframe
const isLoading = ref(true);

// State Konsep Logic
const isKonsepData = ref(false);
const showFinalizeActions = ref(false);
const showEditAction = ref(false);
const showFinalizeOptionsModal = ref(false);

// State Reject
const showRejectModal = ref(false);
const rejectNote = ref("");
const isRejecting = ref(false);
const showRejectOptionsModal = ref(false);

// State UI Logic
const showAllKepada = ref(false);
const showAllTembusan = ref(false);
const isContentExpanded = ref(false); // This is for main content (non-konsep)
const showReadMoreButton = ref(false); // This is for main content (non-konsep)

// Iframe Refs for flows (konsep data)
const iframeRefs = ref<HTMLIFrameElement[]>([]);
const setIframeRef = (el: any, index: number) => { if (el) iframeRefs.value[index] = el; };

// State PDF Preview
const isPreviewOpen = ref(false);
const previewTitle = ref("Preview Dokumen");
const activePdfUrl = ref<string | null>(null);
const isPdfLoading = ref(false);
const isOpenKonsepModal = ref(false);

/* ===============================
   ACTIONS
================================ */
const handleFinalize = () => {
  showFinalizeOptionsModal.value = true;
};

const handleFinalizeAndRedirect = () => {
  showFinalizeOptionsModal.value = false; // Close the options modal
  if (selected.value?.id) {
    // Determine the appropriate path based on selected.value.jenis
    // For now, assuming it's always 'nota-dinas' as per request.
    let finalizationPath = '/korespondensi/tulis/finalisasi/nota-dinas';

    // Additional logic might be needed here to handle different 'jenis'
    // For example:
    // if (selected.value.jenis === 'SDI') {
    //   finalizationPath = '/korespondensi/tulis/finalisasi/surat-dinas-internal';
    // } else if (selected.value.jenis === 'SDE') {
    //   finalizationPath = '/korespondensi/tulis/finalisasi/surat-dinas-eksternal';
    // }

    router.push({
      path: finalizationPath,
      query: {
        ref_id: selected.value.id, // ID konsep untuk finalisasi
        action: 'finalize' // Penanda mode finalisasi
      }
    });
  }
};

const handleReject = () => {
  rejectNote.value = "";
  showRejectModal.value = true;
};

const handleConfirmReject = async () => {
  if (!rejectNote.value.trim()) {
    alert("Mohon isi catatan penolakan.");
    return;
  }

  const currentPosId = selected.value?.pengirim?.position_id;
  if (!currentPosId) {
    alert("Data posisi pengirim tidak ditemukan.");
    return;
  }

  isRejecting.value = true;
  try {
    const payload = {
      from_position_id: currentPosId,
      catatan: rejectNote.value
    };

    const res = await rejectKonsep(selected.value.id, payload);

    if (res && res.success) {
      showRejectModal.value = false;
      alert("Konsep berhasil ditolak.");
      // Reload data agar tampilan berubah menjadi status reject tanpa refresh halaman
      loadData();
    } else {
      alert(res?.message || "Gagal menolak konsep.");
    }

  } catch (error) {
    console.error("Gagal menolak konsep:", error);
    alert("Terjadi kesalahan saat menolak konsep.");
  } finally {
    isRejecting.value = false;
  }
};

// NAVIGASI EDIT KONSEP (BARU)
const handleEditKonsep = () => {
  if (selected.value?.id) {
    router.push({
      path: '/korespondensi/tulis/konsep/nota-dinas',
      query: {
        ref_id: selected.value.id, // Mengirim ID konsep untuk diedit
        action: 'edit' // Penanda mode edit
      }
    });
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

/* ===============================
   MANUAL FETCH DATA
================================ */
const loadData = async () => {
  if (!id) return;
  isLoading.value = true;

  try {
    if (jenis === 'K') {
      const result = await fetchKonsepDetail(id);

      if (result) {
        const d = result;
        const rawFlows = d.flow || [];

        const sortedFlows = [...rawFlows].sort((a: any, b: any) => b.urutan - a.urutan);
        const lastFlow = sortedFlows.length > 0 ? sortedFlows[0] : null;

        // Reset Actions
        showFinalizeActions.value = false;
        showEditAction.value = false;

        // LOGIC TOMBOL EDIT vs SETUJUI
        if (lastFlow) {
          // alert("Last flow action: " + lastFlow.from?.position_id + " vs " + positionId.value);
          if (lastFlow.aksi === 'reject' && lastFlow.from?.position_id != positionId.value) {
            // Jika status terakhir REJECT, tampilkan tombol Edit
            showEditAction.value = true;
          } else if (d.pengirim) {
            // Jika bukan reject, cek apakah giliran user login (Approve/Reject)
            // Note: Idealnya cek ID user login vs ID penerima flow.
            // Disini logika sederhananya dipertahankan dari kode sebelumnya.
            const creatorId = d.pengirim.position_id;
            let lastTargetId = null;
            if (Array.isArray(lastFlow.to)) {
              const found = lastFlow.to.find((t: any) => String(t.position_id) === String(creatorId));
              if (found) lastTargetId = creatorId;
            } else {
              lastTargetId = lastFlow.to?.position_id;
            }

            if (String(lastTargetId) === String(creatorId)) {
              showFinalizeActions.value = true;
            }
          }
        }

        const enrichedFlows = sortedFlows.map((f: any) => {
          const commonProps = {
            ...f,
            showAllTo: false,
            showAllCc: false,
          };

          if (f.aksi === 'create' || f.aksi === 'forward') {
            return {
              ...commonProps,
              to: d.kepada || d.penerima || [],
              cc: d.tembusan || [],
              // rich_content: d.konten,
              rich_content: d.naskah?.konten || d.naskah?.content?.konten || "",
              attachments: d.lampiran_files || [],
              subject: d.perihal,
              nomor: d.nomor
            };
          }

          return {
            ...commonProps,
            rich_content: null,
            attachments: [],
            subject: f.referensi?.perihal || 'Disposisi',
            cc: []
          };
        });

        isKonsepData.value = true;

        selected.value = {
          id: d.id,
          nomor: d.nomor || '-',
          tanggal: d.tanggal,
          perihal: d.perihal,
          jenis: 'K',
          jenis_label: 'KONSEP NOTA DINAS',
          status: d.status,
          flows: enrichedFlows,
          pengirim: d.pengirim,
          final_pdf_url: d.final_pdf_url
        };
      }
    } else {
      isKonsepData.value = false;
      showFinalizeActions.value = false;
      showEditAction.value = false;

      const result = await fetchInboxDetail(id, jenis);
      const rawData = (result && result.data && Array.isArray(result.data)) ? result.data[0] : result;

      if (rawData) {
        const currentIsJenisDI = rawData.jenis.toUpperCase() === "DI" || rawData.jenis_label.toUpperCase().includes("DISPOSISI");
        let mainContent = '';
        let contentTitle = 'Isi Surat';

        if (currentIsJenisDI) {
            mainContent = rawData.detail?.catatan || rawData.catatan || '';
            contentTitle = 'Catatan Disposisi';
        } else {
            mainContent = rawData.konten || '';
            contentTitle = 'Isi Surat';
        }

        selected.value = {
          id: rawData.id,
          nomor: rawData.nomor || '-',
          tanggal: rawData.tanggal,
          perihal: rawData.perihal,
          jenis: rawData.jenis,
          jenis_label: rawData.jenis_label,
          sifat: rawData.sifat,
          status: rawData.status,
          disposisi: rawData.detail?.disposisi || rawData.disposisi,
          catatan: rawData.detail?.catatan || rawData.catatan, // Keep for backward compatibility/other uses
          kepada_yth: rawData.detail?.kepada_yth,
          pengirim: rawData.pengirim,
          kepada: rawData.kepada || [],
          tembusan: rawData.tembusan || [],
          konten: rawData.konten, // Keep for backward compatibility/other uses
          lampiran_files: rawData.lampiran_files || [],
          final_pdf_url: rawData.final_pdf_url,
          mainDisplayContentHtml: mainContent, // New field for consolidated content
          mainDisplayContentTitle: contentTitle // New field for content title
        };
      }
    }
  } catch (e) {
    console.error("Error loading data", e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => { loadData(); });

// --- COMPUTED & HELPERS ---
const formatDate = (v: string) => v ? new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";
const formatDisposisiInline = (v: any) => Array.isArray(v) ? v.join(', ') : String(v || '').replace(/(\r\n|\n|\r)/gm, ", ");
const senderInitials = computed(() => {
  const n = selected.value?.pengirim?.nama || selected.value?.pengirim?.name;
  return n ? n.trim().split(" ").slice(0, 2).map((x: string) => x[0].toUpperCase()).join("") : "?";
});
const getFlowInitials = (n: string) => n ? n.trim().split(" ").slice(0, 2).map((x: string) => x[0].toUpperCase()).join("") : "?";
const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS', 'KONSEP NOTA DINAS'].includes(c) || c.includes('KONSEP')) return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300';
  return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
};
const isJenisDI = computed(() => {
  const j = selected.value?.jenis || '';
  const l = selected.value?.jenis_label || '';
  return j.toUpperCase() === "DI" || l.toUpperCase().includes("DISPOSISI");
});

const displayedKepada = computed(() => showAllKepada.value ? (selected.value?.kepada || []) : (selected.value?.kepada || []).slice(0, LIMIT_DISPLAY));
const hiddenKepadaCount = computed(() => Math.max((selected.value?.kepada || []).length - LIMIT_DISPLAY, 0));

// --- IFRAME RESIZER ---
const resizeMainIframe = () => {
  if (!mainIframe.value) return;
  const iWindow = mainIframe.value?.contentWindow;
  if (!iWindow) return;
  const doc = iWindow.document;

  const performResize = () => {
    mainIframe.value!.style.height = 'auto'; // Reset height before calculating
    const contentHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, doc.body.offsetHeight);
    mainIframe.value!.style.height = (contentHeight + 20) + 'px';
    showReadMoreButton.value = contentHeight > MAX_CONTENT_HEIGHT;
    if (!showReadMoreButton.value) isContentExpanded.value = true;
    else isContentExpanded.value = false; // Reset expand state if new content requires read more
  };

  // Perform resize after a short delay and again after a longer delay for content stability
  setTimeout(performResize, 100);
  setTimeout(performResize, 500);
};
const toggleMainContent = () => isContentExpanded.value = !isContentExpanded.value;
watch(() => selected.value?.mainDisplayContentHtml, async () => { await nextTick(); resizeMainIframe(); }); // Watch mainDisplayContentHtml

// --- PREVIEW ---
const goBack = () => router.back();
const openPreview = async (url: string | null, title = "Dokumen") => {
  if (!url) return;
  previewTitle.value = title; isPreviewOpen.value = true; isPdfLoading.value = true; activePdfUrl.value = null;
  try {
    const res = await fetch(url);
    const blob = new Blob([await res.arrayBuffer()], { type: "application/pdf" });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch { activePdfUrl.value = url; } finally { isPdfLoading.value = false; }
};
const openPreviewFile = (f: any) => openPreview(f.fileUrl || f.file_url || f.file_path, f.fileName || f.file_name);
const openMainPdfPreview = () => {
  if (!selected.value?.final_pdf_url) return alert('File PDF tidak ditemukan.');
  openPreview(selected.value.final_pdf_url, selected.value.perihal);
};
</script>

<template>
  <PageHeader title="Detail Masuk" :items="breadcrumbs" />

  <div class="w-full flex flex-col rounded-xl glass-blue">
    <div class="flex-1">
      <div v-if="isLoading" class="w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse">
        <div class="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4">
          <div class="flex gap-3">
            <div class="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div class="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div class="p-8 h-64"></div>
      </div>

      <div v-else-if="selected" class="w-full">

        <div v-if="isKonsepData" class="space-y-6">
          <div v-for="(flow, index) in selected.flows" :key="index"
            class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md relative">

            <div class="border-b border-gray-100 dark:border-gray-800">
              <div class="h-14 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-gray-900">
                <div class="flex items-center gap-2 min-w-0 overflow-hidden">
                  <template v-if="index === 0">
                    <button @click="goBack"
                      class="rounded-full text-gray-600 focus:outline-none hover:bg-gray-100 p-1 transition-colors">
                      <ArrowLeft class="w-5 h-5" />
                    </button>
                    <h1 class="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">Kembali</h1>
                  </template>
                  <template v-else>
                    <h2 class="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                      {{ flow.subject || (flow.aksi === 'create' ? 'Konsep Awal' : 'Riwayat Disposisi') }}
                    </h2>
                  </template>
                </div>

                <div class="flex items-center gap-2 shrink-0 pl-2">
                  <UTooltip text="Pratinjau Dokumen">
                    <button v-if="flow.pdf_snapshot || flow.naskah?.final_pdf"
                      @click="openPreview(flow.pdf_snapshot || flow.naskah?.final_pdf)"
                      class="p-2 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors">
                      <Printer class="w-4 h-4" />
                    </button>
                  </UTooltip>
                </div>
              </div>

              <div class="p-5 sm:p-8 bg-gray-50/30 dark:bg-gray-800/20">
                <h2 v-if="flow.subject" class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {{ flow.subject }}
                </h2>

                <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600">
                  <div v-if="flow.aksi !== 'create' && flow.aksi !== 'reject'" class="flex items-center gap-1">
                    <Hash class="w-3.5 h-3.5" /><span class="font-mono font-semibold">{{ flow.naskah?.nomor }}</span>
                  </div>
                  <span v-if="flow.aksi !== 'create' && flow.aksi !== 'reject'" class="opacity-40">•</span>
                  <div class="flex items-center gap-1">
                    <Calendar class="w-3.5 h-3.5" /><span>{{ formatDate((flow.aksi === 'create' || flow.aksi ===
                      'reject') ?
                      flow.created_at : flow.tanggal) }}</span>
                  </div>
                  <span class="opacity-40">•</span>
                  <div
                    class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white bg-primary-300">
                    {{ flow.aksi === 'kirim_disposisi' ? 'DISPOSISI' : (flow.aksi === 'create' ? 'KONSEP' : flow.aksi)
                    }}
                  </div>
                </div>
              </div>
            </div>

            <div class="p-5 sm:p-8">
              <div class="flex items-start gap-4 mb-5 border-gray-200 dark:border-gray-700/50">
                <UAvatar size="md" class="bg-primary-500 text-white font-semibold">
                  {{ getFlowInitials(flow.from?.nama) }}
                </UAvatar>
                <div>
                  <span class="text-sm font-semibold block text-gray-900 dark:text-white">
                    {{ flow.from?.position_text || '-' }}
                  </span>
                  <span class="text-xs text-gray-500 block mt-0.5">{{ flow.from?.nama || '-' }}</span>
                </div>
              </div>

              <div v-if="flow.aksi === 'create' || flow.aksi === 'forward'" class="mb-4 flex flex-col md:flex-row gap-2">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Pengirim
                </div>
                <div class="flex flex-col gap-1 w-full min-w-0">
                  <div v-if="selected.pengirim" class="min-w-0">
                    <div class="truncate min-w-0 text-sm text-gray-900 dark:text-white">
                      <span class="font-medium">{{ selected.pengirim.position_text }}</span>
                      <span class="text-xs text-gray-500 ml-1">({{ selected.pengirim.nama }})</span>
                    </div>
                  </div>
                  <span v-else class="text-gray-400 italic text-xs">(Data pengirim tidak tersedia)</span>
                </div>
              </div>

              <div class="mb-4 flex flex-col md:flex-row gap-2">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Tertuju
                </div>
                <div class="flex flex-col gap-1 max-w-full min-w-0">
                  <div v-if="Array.isArray(flow.to)" class="flex flex-col gap-1 w-full min-w-0">
                    <div v-for="(t, ti) in (flow.showAllTo ? flow.to : flow.to.slice(0, LIMIT_DISPLAY))" :key="ti"
                      class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 min-w-0">
                      <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ ti + 1 }}.</span>
                      <div class="truncate min-w-0">
                        <span class="font-medium">{{ t.position_text }}</span>
                        <span class="text-xs text-gray-500 ml-1">({{ t.nama }})</span>
                      </div>
                    </div>
                    <button v-if="flow.to.length > LIMIT_DISPLAY" @click="flow.showAllTo = !flow.showAllTo"
                      class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1 text-left w-fit">
                      {{ flow.showAllTo ? 'Sembunyikan' : `+${flow.to.length - LIMIT_DISPLAY} lainnya` }}
                    </button>
                  </div>
                  <div v-else class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 truncate">
                    <div class="break-words">
                      <span class="font-medium">{{ flow.to?.position_text }}</span>
                      <span class="text-xs text-gray-500 ml-1">({{ flow.to?.nama }})</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="flow.cc && flow.cc.length > 0" class="mb-6 flex flex-col md:flex-row gap-2">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Tembusan
                </div>
                <div class="flex flex-col gap-1 w-full min-w-0">
                  <div v-for="(t, ti) in (flow.showAllCc ? flow.cc : flow.cc.slice(0, LIMIT_DISPLAY))" :key="ti"
                    class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0">
                    <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ ti + 1 }}.</span>
                    <div class="truncate min-w-0">
                      <span class="font-medium">{{ t.position_text }}</span>
                      <span class="text-xs text-gray-500 ml-1">({{ t.nama }})</span>
                    </div>
                  </div>
                  <button v-if="flow.cc.length > LIMIT_DISPLAY" @click="flow.showAllCc = !flow.showAllCc"
                    class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1 text-left w-fit">
                    {{ flow.showAllCc ? 'Sembunyikan' : `+${flow.cc.length - LIMIT_DISPLAY} lainnya` }}
                  </button>
                </div>
              </div>

              <div v-if="flow.disposisi_content?.disposisi" class="mb-4 flex flex-col md:flex-row gap-2">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Instruksi
                </div>
                <div class="flex flex-col gap-1 w-full min-w-0">
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
                    {{ flow.disposisi_content.disposisi ? flow.disposisi_content.disposisi.replace(/\n/g, ', ') : '-' }}
                  </p>
                </div>
              </div>

              <div v-if="flow.aksi === 'reject' || flow.aksi === 'create' || flow.aksi === 'forward'"
                class="mb-4 flex flex-col md:flex-row gap-2">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Pesan
                </div>
                <div class="flex flex-col gap-1 w-full min-w-0">
                  <div class="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
                    {{ flow.catatan || '-' }}
                  </div>
                </div>
              </div>

              <div
                class="bg-gray-50 dark:bg-gray-950/50 rounded-lg p-5 border border-gray-100 dark:border-gray-800 relative">
                <template v-if="flow.rich_content">
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-full">
                    Isi Naskah</div>
                  <div class="relative overflow-hidden w-full">
                    <iframe :srcdoc="'<style>body{margin:0;padding:0;}</style>' + flow.rich_content"
                      class="w-full bg-transparent block min-h-[200px]" style="border: none;"
                      onload="this.style.height=(this.contentWindow.document.body.scrollHeight)+'px';">
                    </iframe>
                  </div>
                </template>
                <template v-else-if="flow.type === 'disposisi'">
                  <div>
                    <!-- <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Catatan Disposisi
                    </span> -->

                    <div v-if="flow.disposisi_content?.catatan && flow.disposisi_content.catatan !== '-'"
                      class="prose prose-sm prose-blue max-w-none text-gray-600 dark:text-gray-300 text-sm"
                      v-html="flow.disposisi_content.catatan">
                    </div>

                    <p v-else class="text-sm text-gray-400 italic">
                      - Tidak ada catatan disposisi -
                    </p>
                  </div>
                </template>

                <template v-else>
                  <div>
                    <!-- <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Catatan
                    </span> -->

                    <p v-if="flow.catatan && flow.catatan !== '-'"
                      class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {{ flow.catatan }}
                    </p>

                    <p v-else class="text-sm text-gray-400 italic">
                    Tidak ada catatan
                    </p>
                  </div>
                </template>
              </div>

              <div class="mt-6">
                <div v-if="flow.attachments && flow.attachments.length > 0" class="mb-3">
                  <h3
                    class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Paperclip class="w-3 h-3" /> Lampiran
                  </h3>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <button v-for="file in flow.attachments" :key="file.id" @click="openPreviewFile(file)"
                      class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 transition-all text-center flex flex-col h-full overflow-hidden group">
                      <div class="p-2 w-full">
                        <div
                          class="h-24 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex flex-col items-center justify-center gap-1 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                          <FileText class="w-8 h-8 text-red-500" stroke-width="1.5" />
                          <span
                            class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">PDF</span>
                        </div>
                      </div>
                      <div class="px-3 pb-3 flex-1 flex items-center justify-center w-full">
                        <UTooltip :text="file.file_name || file.fileName" :popper="{ placement: 'top' }">
                          <p
                            class="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-2 break-all leading-tight">
                            {{ file.file_name || file.fileName }}
                          </p>
                        </UTooltip>
                      </div>
                    </button>
                  </div>
                </div>

                <div class="flex gap-3 mt-8" v-if="index === 0">

                  <template v-if="showFinalizeActions">
                    <div @click="handleFinalize"
                      class="flex bg-emerald-600 hover:bg-emerald-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]">
                      <CheckCircle class="w-4 h-4" /><span class="text-sm font-bold whitespace-nowrap">Setujui</span>
                    </div>
                    <div @click="handleReject"
                      class="flex bg-red-600 hover:bg-red-700 text-white cursor-pointer py-2.5 px-6 rounded-lg gap-2 items-center transition-colors shadow-sm active:scale-[0.98]">
                      <XCircle class="w-4 h-4" /><span class="text-sm font-bold whitespace-nowrap">Tolak</span>
                    </div>
                  </template>

                  <div v-if="showEditAction" @click="handleEditKonsep"
                    class="flex bg-amber-500 hover:bg-amber-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]">
                    <Edit3 class="w-4 h-4" /><span class="text-sm font-bold whitespace-nowrap">Perbaiki Konsep</span>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-6">
          <div
            class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden relative">

            <div class="border-y border-gray-100 dark:border-gray-800">
              <div class="border-y border-gray-100 dark:border-gray-800 h-14 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-gray-900">
                <div class="flex items-center gap-2 min-w-0">
                  <button @click="goBack"
                    class="rounded-full text-gray-600 focus:outline-none hover:bg-gray-100 p-1 transition-colors">
                    <ArrowLeft class="w-5 h-5" />
                  </button>
                  <h1 class="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">Kembali</h1>
                </div>

                <div class="flex items-center gap-2 shrink-0 pl-2">
                  <UTooltip text="Pratinjau Dokumen">
                    <button v-if="selected.final_pdf_url" @click="openMainPdfPreview"
                      class="p-2 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors">
                      <Printer class="w-4 h-4" />
                    </button>
                  </UTooltip>
                </div>
              </div>

              <div class="p-5 sm:p-8 bg-gray-50/30 dark:bg-gray-800/20">
                <h2 v-if="!isJenisDI" class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {{ selected.perihal || '(Tidak ada perihal)' }}
                </h2>
                <h2 v-else class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Disposisi
                </h2>

                <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600">
                  <div class="flex items-center gap-1">
                    <Hash class="w-3.5 h-3.5" /><span class="font-mono font-semibold">{{ selected.nomor }}</span>
                  </div>
                  <span class="opacity-40">•</span>
                  <div class="flex items-center gap-1">
                    <Calendar class="w-3.5 h-3.5" /><span>{{ formatDate(selected.tanggal) }}</span>
                  </div>
                  <span class="opacity-40">•</span>
                  <div
                    class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white bg-primary-300">
                    {{ selected.jenis_label }}
                  </div>
                </div>
              </div>
            </div>

            <div class="p-5 sm:p-8">
              <div class="flex items-start gap-4 mb-5 border-gray-200 dark:border-gray-700/50">
                <UAvatar size="md" class="bg-primary-500 text-white font-semibold">{{ senderInitials }}</UAvatar>
                <div>
                  <span class="text-sm font-semibold block text-gray-900 dark:text-white">
                    {{ selected.pengirim?.positionText || selected.pengirim?.position_text || '-' }}
                  </span>
                  <span class="text-xs text-gray-500 block mt-0.5">{{ selected.pengirim?.nama || '-' }}</span>
                </div>
              </div>

              <div class="mb-4 flex flex-col md:flex-row gap-2">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Tertuju
                </div>
                <div class="flex flex-col gap-1 max-w-full min-w-0">
                  <div class="flex flex-col gap-1 w-full min-w-0">
                    <div v-for="(k, idx) in displayedKepada" :key="idx"
                      class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 min-w-0">
                      <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ idx + 1 }}.</span>
                      <div class="truncate min-w-0">
                        <span class="font-medium">{{ k.position_text }}</span>
                        <span class="text-xs text-gray-500 ml-1">({{ k.nama }})</span>
                      </div>
                    </div>
                    <button v-if="hiddenKepadaCount > 0" @click="showAllKepada = !showAllKepada"
                      class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1 text-left w-fit">
                      {{ showAllKepada ? 'Sembunyikan' : `+${hiddenKepadaCount} lainnya` }}
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="selected.tembusan && selected.tembusan.length > 0"
                class="mb-6 flex flex-col md:flex-row gap-2">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Tembusan
                </div>
                <div class="flex flex-col gap-1 w-full min-w-0">
                  <div
                    v-for="(t, idx) in (showAllTembusan ? selected.tembusan : selected.tembusan.slice(0, LIMIT_DISPLAY))"
                    :key="idx" class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0">
                    <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ idx + 1 }}.</span>
                    <div class="truncate min-w-0">
                      <span class="font-medium">{{ t.position_text }}</span>
                      <span class="text-xs text-gray-500 ml-1">({{ t.nama }})</span>
                    </div>
                  </div>
                  <button v-if="selected.tembusan.length > LIMIT_DISPLAY" @click="showAllTembusan = !showAllTembusan"
                    class="text-xs font-semibold text-primary hover:text-primary-400 mt-1 flex items-center gap-1 text-left w-fit">
                    {{ showAllTembusan ? 'Sembunyikan' : `+${selected.tembusan.length - LIMIT_DISPLAY} lainnya` }}
                  </button>
                </div>
              </div>

              <div v-if="selected.disposisi" class="mb-4 flex flex-col md:flex-row gap-2">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] mt-0.5">Instruksi
                </div>
                <div class="flex flex-col gap-1 w-full min-w-0">
                  <div class="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
                    {{ formatDisposisiInline(selected.disposisi) }}
                  </div>
                </div>
              </div>

              <div
                class="bg-gray-50 dark:bg-gray-950/50 rounded-lg p-5 border border-gray-100 dark:border-gray-800 relative">

                <template v-if="selected.mainDisplayContentHtml">
                  <div
                    class="relative overflow-hidden w-full transition-all duration-500 ease-in-out"
                    :class="[(showReadMoreButton && !isContentExpanded) ? 'max-h-[300px]' : 'max-h-full pb-6']">

                    <span
                      class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3 border-b border-gray-200 pb-2">
                      {{ selected.mainDisplayContentTitle }}
                    </span>

                    <iframe :ref="mainIframe"
                      :srcdoc="'<style>body{margin:0;padding:0;font-family:ui-sans-serif, system-ui, sans-serif; color:#374151;}</style>' + selected.mainDisplayContentHtml"
                      class="w-full bg-transparent block" style="border: none;" scrolling="no"
                      @load="resizeMainIframe">
                    </iframe>

                    <div v-show="showReadMoreButton && !isContentExpanded"
                      class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent z-10 pointer-events-none">
                    </div>
                  </div>

                  <div v-if="showReadMoreButton" class="flex justify-center mt-[-20px] relative z-20">
                    <button @click="toggleMainContent"
                      class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-600 hover:bg-gray-50">
                      <span v-if="!isContentExpanded" class="flex items-center gap-1">
                        <MoreHorizontal class="w-4 h-4" /> BACA SELENGKAPNYA
                      </span>
                      <span v-else class="flex items-center gap-1">
                        <ChevronUp class="w-4 h-4" /> TUTUP KONTEN
                      </span>
                    </button>
                  </div>
                </template>
                <template v-else>
                  <p class="text-sm text-gray-400 italic">
                    Tidak ada konten untuk ditampilkan.
                  </p>
                </template>

              </div>

              <div class="mt-6">
                <div v-if="selected.lampiran_files && selected.lampiran_files.length > 0" class="mb-3">
                  <h3
                    class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Paperclip class="w-3 h-3" /> Lampiran
                  </h3>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <button v-for="file in selected.lampiran_files" :key="file.id" @click="openPreviewFile(file)"
                      class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 transition-all text-center flex flex-col h-full overflow-hidden group">
                      <div class="p-2 w-full">
                        <div
                          class="h-24 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex flex-col items-center justify-center gap-1 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                          <FileText class="w-8 h-8 text-red-500" stroke-width="1.5" />
                          <span
                            class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">PDF</span>
                        </div>
                      </div>
                      <div class="px-3 pb-3 flex-1 flex items-center justify-center w-full">
                        <UTooltip :text="file.file_name || file.fileName" :popper="{ placement: 'top' }">
                          <p
                            class="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-2 break-all leading-tight">
                            {{ file.file_name || file.fileName }}
                          </p>
                        </UTooltip>
                      </div>
                    </button>
                  </div>
                </div>

                <div class="flex flex-wrap gap-3 mt-8">
                  <div @click="handleLanjutNotaDinas"
                    class="flex bg-emerald-600 hover:bg-emerald-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]">
                    <FileText class="w-4 h-4" /><span class="text-sm font-bold whitespace-nowrap">Lanjut Nota
                      Dinas</span>
                  </div>
                  <div @click="handleLanjutDisposisi"
                    class="flex bg-sky-600 hover:bg-sky-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]">
                    <Send class="w-4 h-4" /><span class="text-sm font-bold whitespace-nowrap">Lanjut Disposisi</span>
                  </div>
                  <div v-if="isJenisDI" @click="isOpenKonsepModal = true"
                    class="flex bg-amber-500 hover:bg-amber-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]">
                    <Edit3 class="w-4 h-4" /><span class="text-sm font-bold whitespace-nowrap">Lanjut Konsep</span>
                  </div>
                </div>
              </div>
            </div>
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
                {{ opt.label }}
              </h4>
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
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors -mt-1 -mr-1 p-1">
            <X class="w-5 h-5" />
          </button>
        </div>
      </template>
      <template #body>
        <div class="flex justify-end gap-3">
          <button @click="showFinalizeOptionsModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700">
            Batal
          </button>
          <button @click="handleFinalizeAndRedirect"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
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
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors -mt-1 -mr-1 p-1">
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
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-gray-400 mt-2"
              placeholder="Contoh: Perihal kurang jelas, mohon diperbaiki..."></textarea>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showRejectModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700">
            Batal
          </button>
          <button @click="handleConfirmReject" :disabled="isRejecting || !rejectNote.trim()"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
            <Loader2 v-if="isRejecting" class="w-4 h-4 animate-spin" />
            {{ isRejecting ? 'Memproses...' : 'Tolak Konsep' }}
          </button>
        </div>
      </template>
    </UModal>

    <USlideover v-model:open="isPreviewOpen" :title="previewTitle" side="bottom"
      :ui="{ content: 'h-[90vh] sm:h-screen max-h-screen rounded-t-2xl sm:rounded-none', body: 'p-0', footer: 'p-4 border-t border-gray-200 dark:border-gray-800' }">
      <template #body>
        <div class="w-full h-full relative bg-gray-100 dark:bg-gray-900 flex flex-col">
          <div v-if="isPdfLoading"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 z-20">
            <Loader2 class="w-10 h-10 animate-spin text-blue-600 mb-2" /><span class="text-xs text-gray-500">Memuat
              Dokumen...</span>
          </div>
          <iframe v-if="activePdfUrl" :src="activePdfUrl" class="w-full h-full border-none flex-1" />
          <div v-else-if="!isPdfLoading" class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
            <FileText class="w-12 h-12l opacity-30" /><span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
          </div>
        </div>
      </template>
    </USlideover>

  </div>
</template>
