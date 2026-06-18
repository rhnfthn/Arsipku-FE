<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import {
  Loader2, X, CheckCircle, XCircle, AlertCircle,
  Users, FileText, Building2
} from "lucide-vue-next";

import DetailNaskah from '@/components/DetailNaskah.vue';

definePageMeta({ middleware: "auth" });

const route = useRoute();
const router = useRouter();
const { user } = useAuth();

const { fetchInboxDetail, fetchKonsepDetail } = useInbox();
const { rejectKonsep } = useKonsep();

const id = route.params.id as string;
const jenisQuery = route.query.jenis as string;

const targetHighlightId = computed(() => (route.query.highlight_id as string) || null);

const isSingleData = computed(() => !details.value || details.value.length <= 1);

const isHighlighted = (detail: any) => {
  if (isSingleData.value) return false;
  const target = targetHighlightId.value;
  if (!target) return false;
  if (String(detail.id) === String(target) || String(detail.urutan) === String(target)) return true;
  if (String(target) === String(id) && detail.aksi === 'create') return true;
  return false;
};

const scrollToTarget = async () => {
  await nextTick();
  if (details.value.length <= 1) return;
  setTimeout(() => {
    const targetId = route.query.highlight_id as string;
    let targetDetail: any = targetId
      ? details.value.find((d: any) => String(d.id) === String(targetId) || String(d.urutan) === String(targetId))
      : details.value[0];
    if (!targetDetail) return;
    const element = document.getElementById(`card-${targetDetail.id || targetDetail.urutan}`);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (targetId) {
      element.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2');
      setTimeout(() => element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2'), 2000);
    }
  }, 500);
};

const konsepRouteMap: Record<string, string> = {
  ND: 'nota-dinas',
  SDI: 'surat-dinas-internal',
  SDE: 'surat-dinas-eksternal',
  DI: 'disposisi',
  KA: 'kajian',
};

const handleLanjutKonsep = () => {
  if (isKonsepData.value && selected.value?.id) {
    router.push({
      path: '/korespondensi/tulis/konsep/nota-dinas',
      query: { ref_id: selected.value.id, action: 'edit' }
    });
    return;
  }
  isOpenKonsepModal.value = true;
};

const isTerkirim = computed(() => {
  const path = route.path.toLowerCase();
  const jenis = (jenisQuery || '').toUpperCase();
  return path.includes('terkirim') || path.includes('keluar') || jenis === 'SK';
});

const getPermissions = (bodTag: string | null | undefined, surat: string) => {
  const suratNorm = surat?.toUpperCase();
  if (!bodTag) {
    return {
      create: ['KO'],  // ← semua jenis surat bisa lanjut konsep untuk non-BOD
      forward: [],
      reject: ['KO', 'K'].includes(suratNorm) ? ['Perbaiki'] : [],
      finalize: []
    };
  }
  if (bodTag === 'BOD' || bodTag === 'BOD-1') {
    if (['KO', 'K'].includes(suratNorm)) {
      return { create: ['Setujui', 'Tolak'], forward: ['Setujui', 'Tolak'], reject: [], finalize: ['Setujui', 'Tolak'] };
    }
    const create = suratNorm === 'KA' ? ['DI', 'ND'] : ['DI', 'ND', 'SDI', 'SDE'];
    return { create, forward: [], reject: [], finalize: [] };
  }
  if (bodTag === 'BOD-2' || bodTag === 'BOD-3') {
    if (['KO', 'K'].includes(suratNorm)) {
      return { create: ['Setujui', 'Tolak'], forward: ['Setujui', 'Tolak'], reject: [], finalize: ['Setujui', 'Tolak'] };
    }
    const create = suratNorm === 'DI' ? ['DI', 'ND', 'KO'] : ['DI', 'ND'];
    return { create, forward: [], reject: [], finalize: [] };
  }
  return { create: [], forward: [], reject: [], finalize: [] };
};

const allowedActions = computed(() => {
  if (isTerkirim.value) return [];
  const tag = user.value?.bodTag;
  const surat = selected.value?.jenis;
  if (!isKonsepData.value) {
    return getPermissions(tag, surat).create;
  }
  const aksi = details.value[0]?.aksi;
  const permissions = getPermissions(tag, surat);
  if (aksi === 'create') return permissions.create;
  if (aksi === 'forward') return permissions.forward;
  if (aksi === 'reject') return permissions.reject;
  if (aksi === 'finalize') return permissions.finalize;
  return [];
});

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: isTerkirim.value ? "Terkirim" : "Kotak Masuk", to: isTerkirim.value ? "/korespondensi/surat-keluar" : "/korespondensi/kotak-masuk" },
  { label: "Detail Surat", to: "#" },
];

const visibleDetails = computed(() =>
  details.value.filter((d: any) => d._rawStatus !== 'draf')
);

// --- STATE ---
const details = ref<any[]>([]);
const selected = ref<any>(null);
const isLoading = ref(true);
const isKonsepData = ref(false);

const showEditAction = ref(false);
const showFinalizeActions = ref(false);
const isOpenKonsepModal = ref(false);

const showFinalizeOptionsModal = ref(false);
const showRejectModal = ref(false);
const rejectNote = ref("");
const isRejecting = ref(false);

const isPreviewOpen = ref(false);
const previewTitle = ref("Preview Dokumen");
const activePdfUrl = ref<string | null>(null);
const isLocalPdfLoading = ref(false);
const sessionDebug = ref<any>(null);

const isJenisDI = computed(() => {
  const j = selected.value?.jenis || '';
  const l = selected.value?.jenis_label || '';
  return j.toUpperCase() === "DI" || l.toUpperCase().includes("DISPOSISI");
});

// --- GROUPING HELPER ---
const processGrouping = (individuals: any[], groups: any[], senderPositionId?: string) => {
  if (!Array.isArray(individuals) || individuals.length === 0) return [];
  if (!Array.isArray(groups) || groups.length === 0) return individuals;

  const individualIds = new Set(individuals.map(item => String(item.position_id || item.id)));
  const matchedIds = new Set();
  const result: any[] = [];

  const myPosId = String(
    user.value?.position?.id || user.value?.position_id || user.value?.position || ''
  );

  // ID yang boleh "tidak hadir" di individualIds: user login + pengirim surat
  const excludedIds = new Set([myPosId, senderPositionId].filter(Boolean));

  for (const group of groups) {
    const reqIds = (group.position_ids || []).map(String);
    const isComplete = reqIds.length > 0 && reqIds.every((strId: string) => {
      return individualIds.has(strId) || excludedIds.has(strId);
    });

    if (isComplete) {
      result.push({
        id: group.id || `group-${group.nama}`,
        nama: group.nama,
        position_text: group.nama,
        organization_text: 'Grup Penerima',
        is_group: true
      });
      reqIds.forEach((strId: string) => matchedIds.add(strId));
    }
  }

  for (const indiv of individuals) {
    const indivId = String(indiv.position_id || indiv.id);
    if (!matchedIds.has(indivId)) {
      result.push(indiv);
    }
  }

  return result;
};

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
      const konsepTo = rawData?.to_konsep || null;

      let rawFlows: any[] = [];
      if (rawData && Array.isArray(rawData.flow)) {
        rawFlows = rawData.flow;
      } else if (Array.isArray(rawData)) {
        rawFlows = rawData;
      } else if (rawData) {
        rawFlows = [rawData];
      }

      const baseSortedFlows = [...rawFlows].sort(
        (a: any, b: any) =>
          new Date(b.created_at || b.tanggal).getTime() - new Date(a.created_at || a.tanggal).getTime(),
      );

      // Khusus kotak masuk:
      // 1) naskah paling baru tetap di urutan pertama
      // 2) sisipkan KN di urutan kedua (jika ada)
      // 3) sisanya lanjut urut terbaru -> terlama
      const sortedFlows = (() => {
        if (baseSortedFlows.length <= 1) return baseSortedFlows;

        const first = baseSortedFlows[0];
        const knIndex = baseSortedFlows.findIndex((f: any, idx: number) =>
          idx > 0 && String(f?.jenis || '').toUpperCase() === 'KN',
        );
        if (knIndex === -1) return baseSortedFlows;

        const knItem = baseSortedFlows[knIndex];
        const rest = baseSortedFlows.filter((_: any, idx: number) => idx !== knIndex && idx !== 0);
        return [first, knItem, ...rest];
      })();

      if (sortedFlows.length > 0) {
        const lastFlow = sortedFlows[0];
        selected.value = lastFlow;

        const authUser = user.value || JSON.parse(localStorage.getItem('user_data') || '{}');
        const myPosId = String(authUser?.position?.id || authUser?.position_id || authUser?.position || '');
        const lastAksi = lastFlow.detail?.aksi || lastFlow.aksi || '';

        // Setujui/Tolak = user ada di penerima flow terbaru (A = yang harus menyetujui)
        const isInPenerima = Array.isArray(lastFlow.penerima)
          ? lastFlow.penerima.some((t: any) => String(t.position_id || t.id || '') === myPosId)
          : false;

        showFinalizeActions.value = (
          isInPenerima &&
          (lastAksi === 'create' || lastAksi === 'forward')
        );

        // Perbaiki = user adalah pengirim (B = yang membuat konsep, konsepnya ditolak)
        const pengirimId = String(lastFlow.pengirim?.position_id || '');
        showEditAction.value = (
          lastAksi === 'reject' &&
          myPosId !== '' &&
          pengirimId !== '' &&
          myPosId === pengirimId
        );

        details.value = sortedFlows.map((flow: any, index: number) => {
          const aksi = flow.detail?.aksi || flow.aksi || 'read';

          // Ambil position_id pengirim flow ini
          const senderPosId = String(
            flow.detail?.naskah_pengirim?.position_id ||
            flow.pengirim?.position_id ||
            ''
          );

          const rawPenerima: any[] = flow.detail?.naskah_penerima || flow.penerima || [];
          const penerimaGrup = (flow.detail?.penerima_grup?.length ? flow.detail.penerima_grup : null)
            || (flow.penerima_grup?.length ? flow.penerima_grup : null)
            || [];
          const processedPenerima = processGrouping(rawPenerima, penerimaGrup, senderPosId);

          const rawTembusan: any[] = flow.detail?.naskah_tembusan || flow.tembusan || [];
          const tembusanGrup = (flow.detail?.tembusan_grup?.length ? flow.detail.tembusan_grup : null)
            || (flow.tembusan_grup?.length ? flow.tembusan_grup : null)
            || [];
          const processedTembusan = processGrouping(rawTembusan, tembusanGrup, senderPosId);

          return {
            id: flow.id,
            _rawStatus: flow.status || '',
            urutan: sortedFlows.length - index,
            sifat: flow.sifat,
            aksi,
            jenis: flow.jenis || 'K',
            jenis_label: flow.jenis_label || 'Konsep',
            jenis_naskah_konsep: flow.jenis_naskah_konsep || flow.detail?.jenis_naskah_konsep || flow.jenis_label || '',
            perihal: flow.perihal || '-',
            nomor: flow.nomor || '-',
            tanggal: flow.tanggal || flow.created_at,
            created_at: flow.created_at,
            from: flow.pengirim || {},
            pengirim: flow.detail?.naskah_pengirim || flow.pengirim || {},
            to_konsep: flow.penerima[0] || {},
            penerima: processedPenerima,
            to: processedPenerima,
            cc: processedTembusan,
            rich_content: flow.konten || '',
            catatan: flow.detail?.catatan || flow.catatan || '',
            attachments: flow.lampiran_files || [],
            pdf_snapshot: flow.final_pdf_url || flow.final_pdf || '',
            _ui: { showAllRecipients: false, showAllCC: false, isContentExpanded: false, showReadMoreButton: false }
          };
        });

        // Jika ada flow KN dengan nomor valid, paksa aksi semua row menjadi finalize
        const hasFinalKonsepNaskah = details.value.some((row: any) => {
          const isKN = String(row?.jenis || '').toUpperCase() === 'KN';
          const nomor = String(row?.nomor || '').trim();
          return isKN && nomor !== '' && nomor !== '-';
        });

        if (hasFinalKonsepNaskah) {
          details.value = details.value.map((row: any) => ({
            ...row,
            aksi: 'finish',
          }));
        }
      }

    } else {
      isKonsepData.value = false;
      const response = await fetchInboxDetail(id, jenisQuery);
      const rawData = response?.data || response;

      let rawFlows: any[] = [];
      let inboxData: any = null;

      if (Array.isArray(rawData)) {
        if (rawData.length > 0 && rawData[0].flow) {
          inboxData = rawData[0];
          rawFlows = inboxData.flow;
        } else {
          rawFlows = rawData;
          inboxData = rawData[0];
        }
      } else if (rawData) {
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
          const penerimaGrup = item.penerima_grup || inboxData?.penerima_grup || inboxData?.raw?.penerima_grup || [];
          listPenerima = processGrouping(listPenerima, penerimaGrup);

          let listTembusan: any[] = [];
          if (Array.isArray(item.tembusan)) listTembusan = item.tembusan;
          else if (Array.isArray(item.cc)) listTembusan = item.cc;
          if (listTembusan.length === 0 && inboxData) {
            if (Array.isArray(inboxData.tembusan)) listTembusan = inboxData.tembusan;
            else if (Array.isArray(inboxData.cc)) listTembusan = inboxData.cc;
          }
          const tembusanGrup = item.tembusan_grup || inboxData?.tembusan_grup || inboxData?.raw?.tembusan_grup || [];
          listTembusan = processGrouping(listTembusan, tembusanGrup);

          return {
            id: item.id,
            _rawStatus: item.status || '',
            ttd: item.ttd,
            sifat: item.sifat,
            aksi: item.status || 'read',
            jenis: item.jenis || inboxData.jenis || 'SM',
            jenis_label: item.jenis_label || inboxData.jenis_label || 'SURAT MASUK',
            perihal: item.perihal || inboxData.perihal,
            nomor: item.nomor || inboxData.nomor || '-',
            tanggal: item.tanggal || inboxData.tanggal,
            created_at: item.created_at || inboxData.created_at || item.tanggal,
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

onMounted(() => {
  if (process.client) {
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('sessionId');
    sessionDebug.value = {
      user: user.value || null,
      sessionId: sessionId || null,
      tokenPreview: token ? `${token.slice(0, 18)}...` : null,
    };
  }
  loadData();
});

// --- ACTIONS HANDLERS ---
const goBack = () => router.back();
const handleFinalize = () => { showFinalizeOptionsModal.value = true; };
const handleReject = () => { rejectNote.value = ""; showRejectModal.value = true; };

const handleFinalizeAndRedirect = () => {
  showFinalizeOptionsModal.value = false;
  if (selected.value?.id) {
    console.log("cek");
    console.log(selected.value);
    const rawKind = selected.value?.jenis_naskah_konsep || selected.value?.detail?.jenis_naskah_konsep || selected.value?.jenis || 'ND';
    const upperKind = String(rawKind).trim().toUpperCase();
    
    let pathSeg = 'nota-dinas';
    if (konsepRouteMap[upperKind]) {
      pathSeg = konsepRouteMap[upperKind];
    } else if (upperKind.includes('INTERNAL') || upperKind === 'SDI') {
      pathSeg = 'surat-dinas-internal';
    } else if (upperKind.includes('EKSTERNAL') || upperKind.includes('EXTERNAL') || upperKind === 'SDE') {
      pathSeg = 'surat-dinas-eksternal';
    } else if (upperKind.includes('KAJIAN') || upperKind === 'KA') {
      pathSeg = 'kajian';
    } else if (upperKind.includes('DISPOSISI') || upperKind === 'DI') {
      pathSeg = 'disposisi';
    }

    router.push({
      // path: `/korespondensi/tulis/finalisasi/${pathSeg}`,
      path: `/korespondensi/tulis/${pathSeg}`,
      query: { draft_id: selected.value.id_naskah_asli, action: 'finalize' }
    });
  }
};

const isPengirimKonsep = computed(() => {
  if (!isKonsepData.value) return false;

  const myPosId = String(user.value?.position || '');
  if (!myPosId || myPosId === 'undefined') return false;

  const latestFlow = details.value[0];
  if (!latestFlow || latestFlow.aksi !== 'reject') return false;

  // Dari JSON: pengirim di root = EVP (70016786) = yang menyuruh & menolak
  // penerima di root = VP (70017054) = yang diminta membuat & harus perbaiki
  // Di mapping details: field 'from' = flow.pengirim (pengirim tiap flow)
  // Flow reject: pengirimnya adalah EVP (yang menolak)
  // Tapi kita butuh VP (yang harus perbaiki) = penerima di flow reject

  // Cek dari raw data sortedFlows lewat selected.value
  // selected.value = lastFlow = KONSEP-004 (flow reject terbaru)
  const rawPenerima = selected.value?.penerima || [];
  const isInPenerima = rawPenerima.some(
    (p: any) => String(p.position_id || '') === myPosId
  );

  console.log('isPengirimKonsep →', { myPosId, rawPenerima, isInPenerima });

  return isInPenerima;
});

const draftItem = computed(() => {
  // Cek di rawFlows via details — kita simpan status asli
  return details.value.find((d: any) => d._rawStatus === 'draf') ?? null;
});

const handleConfirmReject = async () => {
  if (!rejectNote.value.trim()) {
    useToast().add({ title: 'Peringatan', description: 'Mohon isi catatan penolakan.', color: 'warning' });
    return;
  }
  isRejecting.value = true;
  try {
    const payload = {
      from_position_id: selected.value?.detail?.naskah_pengirim?.position_id || selected.value?.pengirim?.position_id,
      catatan: rejectNote.value
    };
    const res = await rejectKonsep(selected.value.id, payload);
    if (res && res.success) {
      showRejectModal.value = false;
      useToast().add({ title: 'Berhasil', description: 'Konsep berhasil ditolak.', color: 'success' });
      loadData();
    } else {
      useToast().add({ title: 'Gagal', description: res?.message || 'Gagal menolak konsep.', color: 'error' });
    }
  } catch (error) {
    console.error("Gagal menolak:", error);
    useToast().add({ title: 'Error', description: 'Terjadi kesalahan.', color: 'error' });
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
const handleLanjutSDI = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/lanjut/surat-dinas-internal', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'tindak_lanjut' } }); };
const handleLanjutSDE = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/lanjut/surat-dinas-eksternal', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'tindak_lanjut' } }); };
const handleLanjutDisposisi = () => { if (selected.value?.id) router.push({ path: '/korespondensi/tulis/lanjut/disposisi', query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'disposisi' } }); };
const selectKonsep = (opt: any) => {
  // Jika ada draft dan opsi ini BUKAN jenis draft → disabled, tidak melakukan apa-apa
  if (draftItem.value && opt.type !== draftItem.value.jenis) return;

  isOpenKonsepModal.value = false;
  if (!selected.value?.id) return;

  // Jika opsi ini adalah jenis yang ada draftnya → lanjut edit draft
  if (draftItem.value && opt.type === draftItem.value.jenis) {
    router.push({
      path: opt.path,
      query: { draft_id: draftItem.value.id }
    });
    return;
  }

  // Tidak ada draft sama sekali → buat konsep baru
  router.push({
    path: opt.path,
    query: { ref_id: selected.value.id, workflow: 'konsep', ref_jenis: selected.value.jenis }
  });
};

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
  } catch {
    activePdfUrl.value = url;
  } finally {
    isLocalPdfLoading.value = false;
  }
};
const openPreviewFile = (file: any) => openDocumentPreview(file.file_url || file.fileUrl || file.file_path, file.file_name || file.fileName);

const konsepOptions = computed(() => [
  {
    type: 'ND',
    label: 'Nota Dinas',
    path: '/korespondensi/tulis/konsep/nota-dinas',
    icon: FileText,
    colorClass: 'bg-blue-100 text-blue-600',
  },
  {
    type: 'SDI',
    label: 'Surat Dinas Internal',
    path: '/korespondensi/tulis/konsep/surat-dinas-internal',
    icon: Users,
    colorClass: 'bg-green-100 text-green-600',
  },
  {
    type: 'SDE',
    label: 'Surat Dinas Eksternal',
    path: '/korespondensi/tulis/konsep/surat-dinas-eksternal',
    icon: Building2,
    colorClass: 'bg-orange-100 text-orange-600',
  },
]);
</script>

<template>
  <PageHeader title="Detail Surat" :items="breadcrumbs" />

  <!-- <div v-if="sessionDebug" class="mt-4 mb-4">
    <UCard :ui="{ root: 'rounded-lg ring-0 shadow-sm bg-white dark:bg-gray-800' }">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Debug User Session</h3>
        <span class="text-[11px] text-gray-500">Mode inspeksi</span>
      </div>
      <pre class="text-[11px] leading-5 overflow-auto max-h-80 bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">{{ JSON.stringify(sessionDebug, null, 2) }}</pre>
    </UCard>
  </div> -->

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


    <template v-else-if="visibleDetails && visibleDetails.length > 0">
      <div v-for="(detail, index) in visibleDetails" :key="detail.id || detail.urutan || index"
        :id="`card-${detail.id || detail.urutan}`" class="transition-all duration-500 scroll-mt-24" :class="{
          'ring-2 ring-primary-200 rounded-xl mt-5': details.length > 1 && isHighlighted(detail)
        }">
<!-- {{ selected }} -->
        <DetailNaskah context="inbox" :data="detail" :is-head="index === 0"
          :show-finalize="isKonsepData && index === 0 && showFinalizeActions"
          :show-edit="isKonsepData && index === 0 && showEditAction" :is-pengirim-konsep="isPengirimKonsep"
          :show-footer-actions="!isKonsepData && index === 0 && !isTerkirim" :allowed-actions="allowedActions"
          :user-position-id="user.position" @back="goBack" @preview="(url) => openDocumentPreview(url, detail.perihal)"
          @preview-file="openPreviewFile" @finalize="handleFinalize" @reject="handleReject" @edit="handleEditKonsep"
          @lanjut-nota="handleLanjutNotaDinas" @lanjut-sdi="handleLanjutSDI" @lanjut-sde="handleLanjutSDE"
          @lanjut-disposisi="handleLanjutDisposisi"
          :draft="index === 0 && draftItem ? { id: draftItem.id, jenis: draftItem.jenis } : null"
          @lanjut-konsep="handleLanjutKonsep" />

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
            class="group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200" :class="draftItem
              ? opt.type === draftItem.jenis
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600 cursor-pointer'
                : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 opacity-40 cursor-not-allowed'
              : 'border-gray-200 dark:border-gray-700 hover:border-primary-500 cursor-pointer'">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              :class="[opt.colorClass, draftItem && opt.type !== draftItem.jenis ? '' : 'transition-transform group-hover:scale-110']">
              <component :is="opt.icon" class="w-6 h-6" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-base font-bold text-gray-900 dark:text-white"
                  :class="draftItem && opt.type !== draftItem.jenis ? '' : 'group-hover:text-primary-600 transition-colors'">
                  {{ opt.label }}
                </h4>
                <span v-if="draftItem && opt.type === draftItem.jenis"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-white uppercase tracking-wide">
                  Draft Tersimpan
                </span>
                <span v-else-if="draftItem && opt.type !== draftItem.jenis"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-300 dark:bg-gray-600 text-white uppercase tracking-wide">
                  Tidak Tersedia
                </span>
              </div>
              <p v-if="draftItem && opt.type === draftItem.jenis"
                class="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                Klik untuk melanjutkan draft yang sudah ada
              </p>
              <p v-else-if="draftItem && opt.type !== draftItem.jenis"
                class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Selesaikan draft yang ada terlebih dahulu
              </p>
            </div>
            <ChevronRight class="w-5 h-5 transition-colors" :class="draftItem && opt.type !== draftItem.jenis
              ? 'text-gray-200 dark:text-gray-700'
              : 'text-gray-300 group-hover:text-primary-500'" />
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
