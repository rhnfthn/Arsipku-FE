<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Loader2,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  FileText,
  Building2,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowDown,
  ArrowUpDown,
  PanelRightOpen,
  PanelRightClose,
  List,
} from 'lucide-vue-next';
import { pickKorespondensiListQuery } from '~/utils/korespondensi-list-state';

import DetailNaskah from '@/components/DetailNaskah.vue';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { user, hasPermission } = useAuth();
const { canAccessPage } = useFeatureAccess();

const { fetchInboxDetail, fetchKonsepDetail, fetchInboxNavigation, toggleFlag, markNaskahAsRead } =
  useInbox();
const { rejectKonsep, forwardKonsep } = useKonsep();

const id = computed(() => route.params.id as string);
const jenisQuery = computed(() => (route.query.jenis as string) || '');
const returnListQuery = computed(() => pickKorespondensiListQuery(route.query));
const returnPath = computed(() => {
  const value = route.query.return_path;
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')
    ? raw
    : '/korespondensi/kotak-masuk';
});
const returnPathQuery = computed(() => ({
  ...(returnPath.value !== '/korespondensi/kotak-masuk' ? { return_path: returnPath.value } : {}),
}));

const targetHighlightId = computed(() => (route.query.highlight_id as string) || null);

const isSingleData = computed(() => !details.value || details.value.length <= 1);

const isHighlighted = (detail: any) => {
  if (isSingleData.value) return false;
  const target = targetHighlightId.value;
  if (!target) return false;
  if (String(detail.id) === String(target) || String(detail.urutan) === String(target)) return true;
  if (String(target) === String(id.value) && detail.aksi === 'create') return true;
  return false;
};

const scrollToTarget = async () => {
  await nextTick();
  if (details.value.length <= 1) return;
  setTimeout(() => {
    const targetId = route.query.highlight_id as string;
    let targetDetail: any = targetId
      ? details.value.find(
          (d: any) => String(d.id) === String(targetId) || String(d.urutan) === String(targetId)
        )
      : details.value[0];
    if (!targetDetail) return;
    const element = document.getElementById(`card-${targetDetail.id || targetDetail.urutan}`);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (targetId) {
      element.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2');
      setTimeout(
        () => element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2'),
        2000
      );
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

// ponytail: route edit/revisi konsep existing ke halaman sesuai jenis-asli (ND/SDI/SDE),
// bukan hardcoded nota-dinas. Jenis-asli dari field jenis_naskah_konsep flow.
const resolveKonsepEditPath = (sel: any): string => {
  const rawKind = String(
    sel?.jenis_naskah_konsep ||
    sel?.detail?.jenis_naskah_konsep ||
    sel?.jenis ||
    'ND',
  ).trim().toUpperCase();
  const seg = konsepRouteMap[rawKind] ?? 'nota-dinas';
  return `/korespondensi/tulis/konsep/${seg}`;
};

const handleLanjutKonsep = () => {
  if (!ensureCanCreateFollowUpAction()) return;

  if (isKonsepData.value && selected.value?.id) {
    router.push({
      path: resolveKonsepEditPath(selected.value),
      query: { ref_id: selected.value.id, action: 'edit' },
    });
    return;
  }
  isOpenKonsepModal.value = true;
};

const isTerkirim = computed(() => {
  const path = route.path.toLowerCase();
  const jenis = (jenisQuery.value || '').toUpperCase();
  return path.includes('terkirim') || path.includes('keluar') || jenis === 'SK';
});

const getPermissions = (bodTag: string | null | undefined, surat: string) => {
  const suratNorm = surat?.toUpperCase();
  if (!bodTag) {
    return {
      create: ['KO'],
      forward: [],
      reject: ['KO', 'K'].includes(suratNorm) ? ['Perbaiki'] : [],
      finalize: [],
    };
  }
  if (bodTag === 'BOD' || bodTag === 'BOD-1') {
    if (['KO', 'K'].includes(suratNorm)) {
      return {
        create: ['Setujui', 'Tolak'],
        forward: ['Setujui', 'Tolak'],
        reject: [],
        finalize: ['Setujui', 'Tolak'],
      };
    }
    const create = suratNorm === 'KA' ? ['DI', 'ND'] : ['DI', 'ND', 'SDI', 'SDE'];
    return { create, forward: [], reject: [], finalize: [] };
  }
  if (bodTag === 'BOD-2' || bodTag === 'BOD-3') {
    if (['KO', 'K'].includes(suratNorm)) {
      return {
        create: ['Setujui', 'Tolak'],
        forward: ['Setujui', 'Tolak'],
        reject: [],
        finalize: ['Setujui', 'Tolak'],
      };
    }
    const create = suratNorm === 'DI' ? ['DI', 'ND', 'KO'] : ['DI', 'ND'];
    return { create, forward: [], reject: [], finalize: [] };
  }
  return { create: [], forward: [], reject: [], finalize: [] };
};

const allowedActions = computed(() => {
  if (isTerkirim.value) return [];
  // Disable all lanjut actions if the user already did a tindak lanjut from this
  // naskah (prevents double-send / creating a second follow-up naskah).
  const firstFlow = details.value[0];
  const sudahLanjut =
    firstFlow?.is_tindak_lanjut ??
    firstFlow?.user_sirkulasi?.is_tindak_lanjut ??
    firstFlow?.raw?.user_sirkulasi?.is_tindak_lanjut ??
    false;
  if (sudahLanjut) return [];
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
  { label: 'Beranda', to: '/beranda' },
  {
    label: isTerkirim.value ? 'Terkirim' : 'Kotak Masuk',
    to: isTerkirim.value ? '/korespondensi/surat-keluar' : '/korespondensi/kotak-masuk',
  },
  { label: 'Detail Surat', to: '#' },
];

const visibleDetails = computed(() => {
  const myPosId = String(
    user.value?.position?.id || user.value?.position_id || user.value?.position || ''
  );
  return details.value.filter(
    (d: any) =>
      d._rawStatus !== 'draf' &&
      !(isKonsepData.value && String(d?.jenis || '').toUpperCase() === 'KN') &&
      // kotak-masuk: exclude nodes where the current user is the pengirim (sender) —
      // those are "sent" items (belong in terkirim), not received. terkirim keeps all.
      // Pengecualian untuk konsep (isKonsepData): node pengirim sendiri TETAP masuk
      // jika bukan aksi approval review (forward/reject/finalize) — supaya genealogi
      // root (disposisi) tetap utuh. Aksi approval/forward sendiri di-cut (milik
      // terkirim), chain di-cut sampai konseptor terakhir sebelum approval/reject.
      // Catatan: `d.from` = forwarder aktual (flow.pengirim); `d.pengirim` di node
      // konsep = naskah_pengirim (signer), bukan forwarder — jadi cek `from` dulu.
      (isTerkirim.value ||
        myPosId === '' ||
        String(d?.from?.position_id || d?.pengirim?.position_id || '') !== myPosId ||
        (isKonsepData.value &&
          !['forward', 'reject', 'finalize'].includes(
            String(d?.aksi || '').toLowerCase(),
          )))
  );
});

// --- STATE ---
const details = ref<any[]>([]);
const selected = ref<any>(null);
const rawKonsepResponse = ref<any>(null); // Raw API response for riwayat lookup
const isLoading = ref(true);
const isKonsepData = ref(false);

const konsepNaskahDetail = computed(() => {
  if (!isKonsepData.value) return null;
  return details.value.find((d: any) => String(d?.jenis || '').toUpperCase() === 'KN') ?? null;
});

const resolveKonsepFlowJenis = (flow: any, aksi: string) => {
  const rawJenis = String(flow?.jenis || flow?.jenis_kode || '').toUpperCase();
  const rawLabel = String(flow?.jenis_label || '').toUpperCase();

  if (rawJenis === 'DI' || aksi === 'disposisi' || rawLabel.includes('DISPOSISI')) {
    return 'DI';
  }
  if (rawJenis === 'KN') return 'KN';
  if (['ND', 'SDI', 'SDE', 'KA'].includes(rawJenis)) return rawJenis;
  return rawJenis || 'K';
};

const resolveKonsepFlowLabel = (flow: any, jenis: string) => {
  if (jenis === 'DI') return 'DISPOSISI';
  if (jenis === 'KN') return 'KONSEP NASKAH';
  if (jenis === 'K') return flow?.jenis_label || 'Konsep';
  return flow?.jenis_label || jenis;
};

// --- NAVIGATION (previous/next dari kotak masuk) ---
const navPrev = ref<any>(null);
const navNext = ref<any>(null);
const isLoadingNav = ref(false);

// Collapse management
const collapsedIndices = ref<Set<number>>(new Set());
const viewMode = ref<'all' | 'first-only'>('all');

// Sidebar TOC state
const showSidebar = ref(false);
const activeSuratIndex = ref(0);

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
};

const navigateToSurat = (index: number) => {
  const detail = visibleDetails.value[index];
  if (!detail) return;
  if (collapsedIndices.value.has(index)) {
    toggleCardCollapse(index);
  }
  nextTick(() => {
    const element = document.getElementById(`card-${detail.id || detail.urutan}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

const updateActiveSurat = () => {
  let bestIndex = 0;
  let bestTop = Infinity;
  visibleDetails.value.forEach((detail, i) => {
    const el = document.getElementById(`card-${detail.id || detail.urutan}`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top - 120);
      if (rect.top < window.innerHeight && dist < bestTop) {
        bestTop = dist;
        bestIndex = i;
      }
    }
  });
  activeSuratIndex.value = bestIndex;
};

const handleScroll = () => {
  if (showSidebar.value) updateActiveSurat();
  checkScrollPosition();
};

const showEditAction = ref(false);
const showFinalizeActions = ref(false);
const isOpenKonsepModal = ref(false);

const showFinalizeOptionsModal = ref(false);
const showRejectModal = ref(false);
const rejectNote = ref('');
const isRejecting = ref(false);

const isPreviewOpen = ref(false);
const previewTitle = ref('Preview Dokumen');
const activePdfUrl = ref<string | null>(null);
const isLocalPdfLoading = ref(false);
const sessionDebug = ref<any>(null);

const isJenisDI = computed(() => {
  const j = selected.value?.jenis || '';
  const l = selected.value?.jenis_label || '';
  return j.toUpperCase() === 'DI' || l.toUpperCase().includes('DISPOSISI');
});

// --- GROUPING HELPER ---
const processGrouping = (individuals: any[], groups: any[], senderPositionId?: string) => {
  if (!Array.isArray(individuals) || individuals.length === 0) return [];
  if (!Array.isArray(groups) || groups.length === 0) return individuals;

  const individualIds = new Set(individuals.map((item) => String(item.position_id || item.id)));
  const matchedIds = new Set();
  const result: any[] = [];

  const myPosId = String(user.value?.position || '');

  const excludedIds = new Set([myPosId, senderPositionId].filter(Boolean));

  for (const group of groups) {
    const reqIds = (group.position_ids || []).map(String);
    const isComplete =
      reqIds.length > 0 &&
      reqIds.every((strId: string) => {
        return individualIds.has(strId) || excludedIds.has(strId);
      });

    if (isComplete) {
      result.push({
        id: group.id || `group-${group.nama}`,
        nama: group.nama,
        position_text: group.nama,
        organization_text: 'Grup Penerima',
        is_group: true,
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
  if (!id.value) return;
  isLoading.value = true;
  details.value = [];
  selected.value = null;

  navPrev.value = null;
  navNext.value = null;

  try {
    isLoadingNav.value = true;
    try {
      const nav = await fetchInboxNavigation(id.value, jenisQuery.value);
      navPrev.value = nav.previous;
      navNext.value = nav.next;
    } catch (navErr) {
      console.error('[Detail] fetchInboxNavigation failed:', navErr);
    } finally {
      isLoadingNav.value = false;
    }
    if (jenisQuery.value === 'K') {
      isKonsepData.value = true;
      const response = await fetchKonsepDetail(id.value);
      rawKonsepResponse.value = response; // Store raw for turunkan lookup
      const rawData: any = response;
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
          new Date(b.created_at || b.tanggal).getTime() -
          new Date(a.created_at || a.tanggal).getTime()
      );

      const sortedFlows = (() => {
        const konsepNaskah = baseSortedFlows.find(
          (f: any) => String(f?.jenis || '').toUpperCase() === 'KN'
        );
        const workflowFlows = baseSortedFlows.filter(
          (f: any) => String(f?.jenis || '').toUpperCase() !== 'KN'
        );

        if (!workflowFlows.length) return baseSortedFlows;
        return konsepNaskah ? [...workflowFlows, konsepNaskah] : workflowFlows;
      })();

      if (sortedFlows.length > 0) {
        const lastFlow = sortedFlows[0];
        selected.value = lastFlow;
        initFlagState();

        const hasNewer = Boolean(navNext.value);
        const hasOlder = Boolean(navPrev.value);

        const authUser = user.value || JSON.parse(localStorage.getItem('user_data') || '{}');
        const myPosId = String(
          authUser?.position?.id || authUser?.position_id || authUser?.position || ''
        );
        const lastAksi = lastFlow.detail?.aksi || lastFlow.aksi || '';

        const isInPenerima = Array.isArray(lastFlow.penerima)
          ? lastFlow.penerima.some((t: any) => String(t.position_id || t.id || '') === myPosId)
          : false;

        showFinalizeActions.value =
          isInPenerima && (lastAksi === 'create' || lastAksi === 'forward');

        const pengirimId = String(lastFlow.pengirim?.position_id || '');
        showEditAction.value =
          lastAksi === 'reject' && myPosId !== '' && pengirimId !== '' && myPosId === pengirimId;

        details.value = sortedFlows.map((flow: any, index: number) => {
          const aksi = flow.detail?.aksi || flow.aksi || 'read';
          const jenis = resolveKonsepFlowJenis(flow, aksi);
          const jenisLabel = resolveKonsepFlowLabel(flow, jenis);
          const jenisNaskahKonsep = ['K', 'KO', 'KN'].includes(jenis)
            ? flow.jenis_naskah_konsep ||
              flow.detail?.jenis_naskah_konsep ||
              (jenis === 'K' ? flow.jenis_label : '') ||
              ''
            : '';

          const senderPosId = String(
            flow.detail?.naskah_pengirim?.position_id || flow.pengirim?.position_id || ''
          );

          // Untuk K (workflow): penerima = flow.penerima (K penerima = yang berhak aksi).
          // Untuk KN/ND (naskah asli): penerima = naskah_penerima (penerima naskah final).
          const rawPenerima: any[] = jenis === 'K'
            ? (flow.penerima || [])
            : (flow.detail?.naskah_penerima || flow.penerima || []);
          const penerimaGrup =
            (flow.detail?.penerima_grup?.length ? flow.detail.penerima_grup : null) ||
            (flow.penerima_grup?.length ? flow.penerima_grup : null) ||
            [];
          const processedPenerima = processGrouping(rawPenerima, penerimaGrup, senderPosId);

          const rawTembusan: any[] = flow.detail?.naskah_tembusan || flow.tembusan || [];
          const tembusanGrup =
            (flow.detail?.tembusan_grup?.length ? flow.detail.tembusan_grup : null) ||
            (flow.tembusan_grup?.length ? flow.tembusan_grup : null) ||
            [];
          const processedTembusan = processGrouping(rawTembusan, tembusanGrup, senderPosId);

          return {
            id: flow.id,
            _rawStatus: flow.status || '',
            urutan: sortedFlows.length - index,
            sifat: flow.sifat,
            aksi,
            jenis,
            jenis_label: jenisLabel,
            jenis_naskah_konsep: jenisNaskahKonsep,
            perihal: flow.perihal || '-',
            nomor: flow.nomor || '-',
            tanggal: flow.tanggal || flow.created_at,
            created_at: flow.created_at,
            sirkulasiId:
              flow.sirkulasiId ||
              flow.id_sirkulasi ||
              flow.user_sirkulasi?.id_sirkulasi ||
              flow.raw?.user_sirkulasi?.id_sirkulasi ||
              null,
            user_sirkulasi: flow.user_sirkulasi || flow.raw?.user_sirkulasi || null,
            isTinjut:
              flow.isTinjut ??
              flow.is_tindak_lanjut ??
              flow.user_sirkulasi?.is_tindak_lanjut ??
              flow.raw?.user_sirkulasi?.is_tindak_lanjut ??
              false,
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
            _ui: {
              showAllRecipients: false,
              showAllCC: false,
              isContentExpanded: false,
              showReadMoreButton: false,
            },
            _hasNewer: index === 0 ? hasNewer : false,
            _hasOlder: index === 0 ? hasOlder : false,
          };
        });

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
      const response = await fetchInboxDetail(id.value, jenisQuery.value);
      const rawData = response?.data || response;

      let rawFlows: any[] = [];
      let inboxData: any = null;

      if (Array.isArray(rawData)) {
        if (rawData.length > 0 && Array.isArray(rawData[0].flow) && rawData[0].flow.length > 0) {
          inboxData = rawData[0];
          rawFlows = inboxData.flow;
        } else {
          rawFlows = rawData;
          inboxData = rawData[0];
        }
      } else if (rawData) {
        inboxData = rawData;
        rawFlows = inboxData.flow && inboxData.flow.length > 0 ? inboxData.flow : [inboxData];
      }

      if (inboxData && rawFlows.length > 0) {
        selected.value = inboxData;
        initFlagState();

        const hasNewer = Boolean(navNext.value);
        const hasOlder = Boolean(navPrev.value);

        details.value = rawFlows.map((item: any, index: number) => {
          let listPenerima: any[] = [];
          if (Array.isArray(item.penerima) && item.penerima.length > 0)
            listPenerima = item.penerima;
          else if (Array.isArray(item.kepada) && item.kepada.length > 0) listPenerima = item.kepada;
          else if (Array.isArray(item.to)) listPenerima = item.to;
          else if (item.to && typeof item.to === 'object') listPenerima = [item.to];
          if (listPenerima.length === 0 && inboxData) {
            if (Array.isArray(inboxData.penerima)) listPenerima = inboxData.penerima;
            else if (Array.isArray(inboxData.kepada)) listPenerima = inboxData.kepada;
          }
          const penerimaGrup =
            item.penerima_grup || inboxData?.penerima_grup || inboxData?.raw?.penerima_grup || [];
          listPenerima = processGrouping(listPenerima, penerimaGrup);

          let listTembusan: any[] = [];
          if (Array.isArray(item.tembusan)) listTembusan = item.tembusan;
          else if (Array.isArray(item.cc)) listTembusan = item.cc;
          if (listTembusan.length === 0 && inboxData) {
            if (Array.isArray(inboxData.tembusan)) listTembusan = inboxData.tembusan;
            else if (Array.isArray(inboxData.cc)) listTembusan = inboxData.cc;
          }
          const tembusanGrup =
            item.tembusan_grup || inboxData?.tembusan_grup || inboxData?.raw?.tembusan_grup || [];
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
            sirkulasiId:
              item.sirkulasiId ||
              item.id_sirkulasi ||
              item.user_sirkulasi?.id_sirkulasi ||
              item.raw?.user_sirkulasi?.id_sirkulasi ||
              null,
            user_sirkulasi: item.user_sirkulasi || item.raw?.user_sirkulasi || null,
            isTinjut:
              item.isTinjut ??
              item.is_tindak_lanjut ??
              item.user_sirkulasi?.is_tindak_lanjut ??
              item.raw?.user_sirkulasi?.is_tindak_lanjut ??
              false,
            pengirim: item.pengirim || item.from || inboxData.pengirim,
            to: listPenerima,
            cc: listTembusan,
            mainDisplayContentHtml:
              item.konten ||
              item.isi ||
              inboxData?.konten ||
              inboxData?.isi ||
              inboxData?.raw?.konten ||
              '',
            catatan: item.catatan || inboxData?.catatan,
            disposisi: item.disposisi || item.instruksi || inboxData?.disposisi,
            lampiran_files:
              item.lampiran_files || item.attachments || inboxData?.lampiran_files || [],
            final_pdf_url: item.final_pdf_url || item.file_url || inboxData.final_pdf_url,
            _ui: {
              showAllRecipients: false,
              showAllCC: false,
              isContentExpanded: false,
              showReadMoreButton: false,
            },
            _hasNewer: index === 0 ? hasNewer : false,
            _hasOlder: index === 0 ? hasOlder : false,
          };
        });
      }
    }
  } catch (e) {
    console.error('❌ Error loading data', e);
  } finally {
    isLoading.value = false;
    scrollToTarget();
    if (id.value && user.value?.position && jenisQuery.value !== 'K') {
      markNaskahAsRead(id.value, user.value.position);
    }
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
  window.addEventListener('scroll', handleScroll, { passive: true });
  checkScrollPosition();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) loadData();
  }
);

// --- ACTIONS HANDLERS ---
const goBack = () =>
  router.push({
    path: returnPath.value,
    query: returnListQuery.value,
  });

// --- FLAG TOGGLE (favorit, tindak_lanjut, lock, note) ---
const flagState = ref({
  isStarred: false,
  isTinjut: false,
  isLocked: false,
  isNote: false,
  noteText: '' as string,
});

const initFlagState = () => {
  const s = selected.value;
  flagState.value = {
    isStarred: s?.isStarred ?? s?.user_sirkulasi?.is_favorit ?? false,
    isTinjut: s?.isTinjut ?? s?.user_sirkulasi?.is_tindak_lanjut ?? false,
    isLocked: s?.isLocked ?? s?.user_sirkulasi?.is_locked ?? false,
    isNote: s?.isNote ?? s?.user_sirkulasi?.is_note ?? false,
    noteText: s?.noteText ?? s?.user_sirkulasi?.note_text ?? '',
  };
};

const canCreateFollowUpAction = computed(() => !flagState.value.isTinjut);

const ensureCanCreateFollowUpAction = () => {
  if (isKonsepData.value || canCreateFollowUpAction.value) return true;

  useToast().add({
    title: 'Tidak bisa membuat tindak lanjut',
    description: 'Naskah ini sudah ditindaklanjuti.',
    color: 'warning',
  });
  return false;
};

const getDetailFlagState = (detail: any, index: number) => {
  if (index === 0) {
    return flagState.value;
  }

  const sirkulasi = detail?.user_sirkulasi || detail?.raw?.user_sirkulasi || {};
  return {
    isStarred: detail?.isStarred ?? detail?.is_favorit ?? sirkulasi?.is_favorit ?? false,
    isTinjut: detail?.isTinjut ?? detail?.is_tindak_lanjut ?? sirkulasi?.is_tindak_lanjut ?? false,
    isLocked: detail?.isLocked ?? detail?.is_locked ?? sirkulasi?.is_locked ?? false,
    isNote: detail?.isNote ?? detail?.is_note ?? sirkulasi?.is_note ?? false,
    noteText: detail?.noteText ?? detail?.note_text ?? sirkulasi?.note_text ?? '',
  };
};

const handleToggleFlag = async (
  type: 'favorit' | 'tindak_lanjut' | 'lock' | 'note',
  noteText?: string
) => {
  const s = selected.value;
  if (!s) return;
  const idSirkulasi =
    s.sirkulasiId || s.user_sirkulasi?.id_sirkulasi || s.raw?.user_sirkulasi?.id_sirkulasi;
  if (!idSirkulasi) {
    useToast().add({
      title: 'Error',
      description: 'ID Sirkulasi tidak ditemukan.',
      color: 'error',
    });
    return;
  }

  const flagKeyMap: Record<string, keyof typeof flagState.value> = {
    favorit: 'isStarred',
    tindak_lanjut: 'isTinjut',
    lock: 'isLocked',
    note: 'isNote',
  };
  const flagKey = flagKeyMap[type];

  // For note: if noteText is empty string, remove flag; otherwise set it
  if (type === 'note') {
    const hasText = noteText && noteText.trim().length > 0;
    (flagState.value as any)[flagKey] = hasText;
    flagState.value.noteText = hasText ? noteText : '';
    const isNowActive = hasText;
    useToast().add({
      title: 'Berhasil',
      description: isNowActive ? 'Catatan disimpan' : 'Catatan dihapus',
      color: 'success',
    });
    try {
      const mailObj = { sirkulasiId: idSirkulasi, ...flagState.value };
      await toggleFlag(mailObj, type, noteText);
      // Sync to selected.value so DetailNaskah picks up updated noteText
      if (selected.value) {
        selected.value.noteText = hasText ? noteText : '';
        selected.value.isNote = hasText;
      }
    } catch {
      (flagState.value as any)[flagKey] = !(flagState.value as any)[flagKey];
      flagState.value.noteText = !hasText ? noteText : '';
      useToast().add({ title: 'Gagal', description: 'Gagal memperbarui status.', color: 'error' });
    }
    return;
  }

  (flagState.value as any)[flagKey] = !(flagState.value as any)[flagKey];
  const isNowActive = (flagState.value as any)[flagKey];

  const descMap: Record<string, [string, string]> = {
    favorit: ['Ditambahkan ke Favorit', 'Dihapus dari Favorit'],
    tindak_lanjut: ['Ditandai tindak lanjut', 'Tindak lanjut selesai'],
    lock: ['Pesan dikunci', 'Kunci pesan dibuka'],
    note: ['Note ditandai', 'Tanda note dihapus'],
  };
  useToast().add({
    title: 'Berhasil',
    description: descMap[type][isNowActive ? 0 : 1],
    color: 'success',
  });

  try {
    const mailObj = { sirkulasiId: idSirkulasi, ...flagState.value };
    await toggleFlag(mailObj, type);
  } catch {
    (flagState.value as any)[flagKey] = !(flagState.value as any)[flagKey];
    useToast().add({ title: 'Gagal', description: 'Gagal memperbarui status.', color: 'error' });
  }
};

const goToNav = (target: any) => {
  if (!target?.id_naskah) return;
  const targetJenis = target.jenis || jenisQuery.value || 'ND';
  router.push({
    path: `/korespondensi/kotak-masuk/${target.id_naskah}`,
    query: { ...returnListQuery.value, ...returnPathQuery.value, jenis: targetJenis },
  });
};

const goToNewer = () => goToNav(navNext.value);
const goToOlder = () => goToNav(navPrev.value);

// Floating scroll FAB state
const isAtBottom = ref(false);
const checkScrollPosition = () => {
  const threshold = 120;
  isAtBottom.value =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;
};

const scrollToEdge = () => {
  if (isAtBottom.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }
};

const goToFirstSurat = () => {
  if (visibleDetails.value.length === 0) return;
  const firstIdx = visibleDetails.value.length - 1;
  collapsedIndices.value = new Set(
    visibleDetails.value.map((_, i) => i).filter((i) => i !== firstIdx)
  );
  viewMode.value = 'first-only';
  nextTick(() => {
    const firstSurat = visibleDetails.value[firstIdx];
    const element = document.getElementById(`card-${firstSurat.id || firstSurat.urutan}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
};

const goToLatestSurat = () => {
  collapsedIndices.value = new Set();
  viewMode.value = 'all';
  nextTick(() => {
    const latest = visibleDetails.value[0];
    const element = document.getElementById(`card-${latest.id || latest.urutan}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

const toggleCardCollapse = (index: number) => {
  const newSet = new Set(collapsedIndices.value);
  if (newSet.has(index)) newSet.delete(index);
  else newSet.add(index);
  collapsedIndices.value = newSet;
  viewMode.value = newSet.size === 0 ? 'all' : 'first-only';
};

const isCardCollapsed = (index: number) => collapsedIndices.value.has(index);

const handleFinalize = () => {
  showFinalizeOptionsModal.value = true;
};
const handleReject = () => {
  rejectNote.value = '';
  showRejectModal.value = true;
};

const handleFinalizeAndRedirect = () => {
  showFinalizeOptionsModal.value = false;
  if (selected.value?.id) {
    const rawKind =
      selected.value?.jenis_naskah_konsep ||
      selected.value?.detail?.jenis_naskah_konsep ||
      selected.value?.jenis ||
      'ND';
    const upperKind = String(rawKind).trim().toUpperCase();

    let pathSeg = 'nota-dinas';
    if (konsepRouteMap[upperKind]) {
      pathSeg = konsepRouteMap[upperKind];
    } else if (upperKind.includes('INTERNAL') || upperKind === 'SDI') {
      pathSeg = 'surat-dinas-internal';
    } else if (
      upperKind.includes('EKSTERNAL') ||
      upperKind.includes('EXTERNAL') ||
      upperKind === 'SDE'
    ) {
      pathSeg = 'surat-dinas-eksternal';
    } else if (upperKind.includes('KAJIAN') || upperKind === 'KA') {
      pathSeg = 'kajian';
    } else if (upperKind.includes('DISPOSISI') || upperKind === 'DI') {
      pathSeg = 'disposisi';
    }

    router.push({
      path: `/korespondensi/tulis/${pathSeg}`,
      query: { draft_id: selected.value.id_naskah_asli, action: 'finalize' },
    });
  }
};

const isPengirimKonsep = computed(() => {
  if (!isKonsepData.value) return false;

  const myPosId = String(user.value?.position || '');
  if (!myPosId || myPosId === 'undefined') return false;

  const latestFlow = details.value[0];
  if (!latestFlow || latestFlow.aksi !== 'reject') return false;

  const rawPenerima = selected.value?.penerima || [];
  const isInPenerima = rawPenerima.some((p: any) => String(p.position_id || '') === myPosId);

  return isInPenerima;
});

// canTurunkanLagi: true jika masih ada bawahan yang bisa diturunkan (riwayat K
// di mana user adalah penerima + aksi create/forward = bawahan naikkan konsep ke user).
// Mentok (tidak ada bawahan) → false → hanya opsi Perbaiki Sendiri.
const canTurunkanLagi = computed(() => {
  if (!isKonsepData.value) return false;
  const myPosId = String(user.value?.position || '');
  if (!myPosId || myPosId === 'undefined') return false;
  const raw = rawKonsepResponse.value;
  const flows = Array.isArray(raw?.flow) ? raw.flow : [];
  return flows.some((flow: any) => {
    if (String(flow?.jenis || '').toUpperCase() !== 'K') return false;
    const penerimaList = flow?.penerima || [];
    const isRecipient = penerimaList.some((p: any) => String(p.position_id) === myPosId);
    const aksi = String(flow?.detail?.aksi || flow?.aksi || '').toLowerCase();
    return isRecipient && ['forward', 'create'].includes(aksi);
  });
});

const draftItem = computed(() => {
  return details.value.find((d: any) => d._rawStatus === 'draf') ?? null;
});

const handleConfirmReject = async () => {
  if (!rejectNote.value.trim()) {
    useToast().add({
      title: 'Peringatan',
      description: 'Mohon isi catatan penolakan.',
      color: 'warning',
    });
    return;
  }
  isRejecting.value = true;
  try {
    const payload = {
      from_position_id:
        selected.value?.detail?.naskah_pengirim?.position_id ||
        selected.value?.pengirim?.position_id,
      catatan: rejectNote.value,
    };
    const res = await rejectKonsep(selected.value.id, payload);
    if (res && res.success) {
      showRejectModal.value = false;
      useToast().add({
        title: 'Berhasil',
        description: 'Konsep berhasil ditolak.',
        color: 'success',
      });
      loadData();
    } else {
      useToast().add({
        title: 'Gagal',
        description: res?.message || 'Gagal menolak konsep.',
        color: 'error',
      });
    }
  } catch (error) {
    console.error('Gagal menolak:', error);
    useToast().add({ title: 'Error', description: 'Terjadi kesalahan.', color: 'error' });
  } finally {
    isRejecting.value = false;
  }
};

const handleEditKonsep = () => {
  if (selected.value?.id) {
    router.push({
      path: resolveKonsepEditPath(selected.value),
      query: { ref_id: selected.value.id, action: 'edit' },
    });
  }
};

const isTurunkanLoading = ref(false);

const handleTurunkanKonsep = () => {
  if (!selected.value?.id || !user.value?.position) return;

  const myPosId = String(user.value.position);
  const raw = rawKonsepResponse.value;

  // DEBUG
  const riwayat = raw?.riwayat || raw?.data?.riwayat || [];
  console.log('🐛 [Turunkan] riwayat:', riwayat);
  console.log('🐛 [Turunkan] myPosId:', myPosId);
  console.log('🐛 [Turunkan] raw keys:', raw ? Object.keys(raw) : 'null');

  let turunkanPositionId = '';
  let turunkanNama = '';
  let turunkanPersonNama = '';

  // STRATEGI 1: Cari dari riwayat — ambil entry yang MENGIRIM ke user saat ini
  if (riwayat.length > 0) {
    const myEntry = riwayat.find((r: any) => String(r.toPositionId) === myPosId);
    if (myEntry) {
      turunkanPositionId = String(myEntry.fromPositionId || '');
      turunkanNama = myEntry.fromPositionText || myEntry.from_nama || '';
      console.log('🐛 [Turunkan] STRAT 1 riwayat:', turunkanPositionId, turunkanNama);
    }
  }

  // STRATEGI 2: Cari dari raw.flow — K workflow entry yang penerimanya user saat ini
  // dan aksi-nya forward/create (= bawahan yang menaikkan konsep ke user).
  // Pilih entry dengan created_at TERTUA (bawahan pertama yang naikkan ke saya),
  // bukan first-in-DESC, agar tak salah ambil atasan yang menurunkan (aksi turunkan
  // diexclude; forward lama bisa ambigu tapi tertua = bawahan asli).
  if (!turunkanPositionId) {
    const rawFlows = Array.isArray(raw?.flow) ? raw.flow : (Array.isArray(raw?.data) ? raw.data : []);
    console.log('🐛 [Turunkan] rawFlows count:', rawFlows.length);
    let best: { flow: any; ts: number } | null = null;
    for (const flow of rawFlows) {
      // Hanya entri K (workflow), bukan KN (naskah asli) / DI
      if (String(flow?.jenis || '').toUpperCase() !== 'K') continue;
      const penerimaList = flow?.penerima || [];
      const isRecipient = penerimaList.some((p: any) => String(p.position_id) === myPosId);
      const fromId = String(flow?.pengirim?.position_id || '');
      const aksi = String(flow?.detail?.aksi || flow?.aksi || '').toLowerCase();
      if (isRecipient && fromId && fromId !== myPosId && ['forward', 'create'].includes(aksi)) {
        const ts = new Date(flow?.created_at || flow?.tanggal || 0).getTime() || 0;
        if (!best || ts < best.ts) {
          best = { flow, ts };
        }
      }
    }
    if (best) {
      turunkanPositionId = String(best.flow?.pengirim?.position_id || '');
      turunkanNama = best.flow?.pengirim?.position_text || '';
      turunkanPersonNama = best.flow?.pengirim?.nama || '';
      console.log('🐛 [Turunkan] STRAT 2 raw flow (tertua):', turunkanPositionId, turunkanNama, 'aksi:', String(best.flow?.detail?.aksi || best.flow?.aksi || ''), 'ts:', best.ts);
    }
  }

  // STRATEGI 3: Cari dari details.value (processed)
  if (!turunkanPositionId) {
    const allDetails = details.value || [];
    for (const d of allDetails) {
      const penerimaList = d.penerima || [];
      console.log('🐛 [Turunkan] checking detail:', d.id, d.aksi, 'penerima:', penerimaList.map((p: any) => ({ id: p.id, pos: p.position_id, label: p.label })));
      const isRecipient = penerimaList.some((p: any) =>
        String(p.position_id) === myPosId || String(p.id) === myPosId
      );
      const fromId = String(d.from?.position_id || '');
      if (isRecipient && fromId && fromId !== myPosId && ['forward', 'disposisi', 'create'].includes(d.aksi || '')) {
        turunkanPositionId = fromId;
        turunkanNama = d.from?.position_text || '';
        console.log('🐛 [Turunkan] STRAT 3 details:', turunkanPositionId, turunkanNama);
        break;
      }
    }
  }

  console.log('🐛 [Turunkan] RESULT:', { turunkanPositionId, turunkanNama });

  if (!turunkanPositionId) {
    useToast().add({
      title: t('km_gagal'),
      description: 'Posisi pembuat konsep tidak ditemukan.',
      color: 'error',
    });
    return;
  }

  // Navigasi ke form edit konsep dengan query turunkan_position_id
  router.push({
    path: resolveKonsepEditPath(selected.value),
    query: {
      ref_id: selected.value.id,
      action: 'edit',
      turunkan_position_id: String(turunkanPositionId),
      turunkan_nama: turunkanNama,
      turunkan_person_nama: turunkanPersonNama,
    },
  });
};

const handleLanjutNotaDinas = () => {
  if (!ensureCanCreateFollowUpAction()) return;

  if (selected.value?.id)
    router.push({
      path: '/korespondensi/tulis/lanjut/nota-dinas',
      query: {
        ref_id: selected.value.id,
        ref_jenis: selected.value.jenis,
        action: 'tindak_lanjut',
      },
    });
};
const handleLanjutSDI = () => {
  if (!ensureCanCreateFollowUpAction()) return;

  if (selected.value?.id)
    router.push({
      path: '/korespondensi/tulis/lanjut/surat-dinas-internal',
      query: {
        ref_id: selected.value.id,
        ref_jenis: selected.value.jenis,
        action: 'tindak_lanjut',
      },
    });
};
const handleLanjutSDE = () => {
  if (!ensureCanCreateFollowUpAction()) return;

  if (selected.value?.id)
    router.push({
      path: '/korespondensi/tulis/lanjut/surat-dinas-eksternal',
      query: {
        ref_id: selected.value.id,
        ref_jenis: selected.value.jenis,
        action: 'tindak_lanjut',
      },
    });
};
const handleLanjutDisposisi = () => {
  if (!ensureCanCreateFollowUpAction()) return;

  if (selected.value?.id)
    router.push({
      path: '/korespondensi/tulis/lanjut/disposisi',
      query: { ref_id: selected.value.id, ref_jenis: selected.value.jenis, action: 'disposisi' },
    });
};
const selectKonsep = (opt: any) => {
  if (!ensureCanCreateFollowUpAction()) return;

  if (draftItem.value && opt.type !== draftItem.value.jenis) return;

  isOpenKonsepModal.value = false;
  if (!selected.value?.id) return;

  if (draftItem.value && opt.type === draftItem.value.jenis) {
    router.push({
      path: opt.path,
      query: { draft_id: draftItem.value.id },
    });
    return;
  }

  router.push({
    path: opt.path,
    query: { ref_id: selected.value.id, workflow: 'konsep', ref_jenis: selected.value.jenis },
  });
};

const openDocumentPreview = async (url: string, title = 'Dokumen') => {
  if (!url) {
    alert('URL tidak valid.');
    return;
  }
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
const openPreviewFile = (file: any) =>
  openDocumentPreview(
    file.file_url || file.fileUrl || file.file_path,
    file.file_name || file.fileName
  );

const konsepOptions = computed(() => [
  {
    type: 'ND',
    label: 'Nota Dinas',
    path: '/korespondensi/tulis/konsep/nota-dinas',
    icon: FileText,
    colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    type: 'SDI',
    label: 'Surat Dinas Internal',
    path: '/korespondensi/tulis/konsep/surat-dinas-internal',
    icon: Users,
    colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    type: 'SDE',
    label: 'Surat Dinas Eksternal',
    path: '/korespondensi/tulis/konsep/surat-dinas-eksternal',
    icon: Building2,
    colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
]);
</script>

<template>
  <AccessDenied v-if="!canAccessPage()" />
  <template v-else>
  <PageHeader title="Detail Surat" :items="breadcrumbs" />

  <div class="w-full flex gap-4 pt-4 relative">
    <!-- Main content -->
    <div class="flex-1 flex flex-col gap-6 min-w-0">
      <div
        v-if="isLoading"
        class="w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse shadow-sm border border-gray-200 dark:border-gray-800"
      >
        <div
          class="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 bg-gray-50 dark:bg-gray-900/50"
        >
          <div class="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
        </div>
        <div class="p-8 space-y-4">
          <div class="h-8 w-1/2 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div class="h-32 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>

      <div v-else-if="visibleDetails && visibleDetails.length > 0" class="flex flex-col gap-3">
        <div
          v-for="(detail, index) in visibleDetails"
          :key="detail.id || detail.urutan || index"
          :id="`card-${detail.id || detail.urutan}`"
          class="relative transition-all duration-500 scroll-mt-24 mb-3 last:mb-0"
          :class="{
            'ring-2 ring-primary-200 rounded-xl': (details.length > 1 && isHighlighted(detail)) || (isKonsepData && index === 0),
          }"
        >
          <!-- Card content -->
          <div>
            <DetailNaskah
              context="inbox"
              :data="detail"
              :is-head="index === 0"
              :is-starred="getDetailFlagState(detail, index).isStarred"
              :is-tinjut="getDetailFlagState(detail, index).isTinjut"
              :is-locked="getDetailFlagState(detail, index).isLocked"
              :is-note="getDetailFlagState(detail, index).isNote"
              :collapsed="isCardCollapsed(index)"
              :show-finalize="isKonsepData && index === 0 && showFinalizeActions"
              :show-edit="isKonsepData && index === 0 && showEditAction"
              :is-pengirim-konsep="isPengirimKonsep"
              :can-turunkan-lagi="canTurunkanLagi"
              :show-footer-actions="
                !isKonsepData && index === 0 && !isTerkirim && canCreateFollowUpAction
              "
              :allowed-actions="allowedActions"
              :konsep-naskah="isKonsepData && index === 0 ? konsepNaskahDetail : null"
              :user-position-id="user?.position"
              @back="goBack"
              @preview="(url) => openDocumentPreview(url, detail.perihal)"
              @preview-file="openPreviewFile"
              @finalize="handleFinalize"
              @reject="handleReject"
              @edit="handleEditKonsep"
              @turunkan-konsep="handleTurunkanKonsep"
              @lanjut-nota="handleLanjutNotaDinas"
              @lanjut-sdi="handleLanjutSDI"
              @lanjut-sde="handleLanjutSDE"
              @lanjut-disposisi="handleLanjutDisposisi"
              :draft="
                index === 0 && draftItem ? { id: draftItem.id, jenis: draftItem.jenis } : null
              "
              @lanjut-konsep="handleLanjutKonsep"
              @nav-newer="goToNewer"
              @nav-older="goToOlder"
              @favorite="handleToggleFlag('favorit')"
              @tindak-lanjut="handleToggleFlag('tindak_lanjut')"
              @lock="handleToggleFlag('lock')"
              @catatan="(text) => handleToggleFlag('note', text)"
              @toggle-collapse="toggleCardCollapse(index)"
            />
          </div>
        </div>
      </div>
      <div v-else class="w-full text-center py-12 text-sm text-gray-400 dark:text-gray-500">
        Surat tidak ditemukan atau tidak dapat ditampilkan.
      </div>
    </div>
    <!-- end main content -->

    <!-- Floating scroll FAB -->
    <button
      v-if="!isLoading && visibleDetails.length > 1"
      @click="scrollToEdge"
      class="fixed right-4 bottom-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 hover:bg-primary-700 active:scale-95 transition-all duration-200"
      :aria-label="isAtBottom ? 'Ke atas' : 'Ke bawah'"
    >
      <ArrowUpDown
        class="w-4 h-4 transition-transform duration-300"
        :class="isAtBottom ? 'rotate-180' : ''"
      />
      <span class="text-xs font-semibold">{{ isAtBottom ? 'Ke Atas' : 'Ke Bawah' }}</span>
    </button>

    <!-- Toggle sidebar button (Daftar Surat) -->
    <button
      v-if="!showSidebar && !isLoading && visibleDetails.length > 1"
      @click="toggleSidebar"
      class="fixed right-4 bottom-20 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-primary-500 hover:text-white hover:border-primary-500 active:scale-95 transition-all duration-200"
    >
      <PanelRightOpen class="w-4 h-4" />
      <span>Daftar Surat</span>
    </button>

    <!-- Sidebar TOC Panel (right side) -->
    <AnimatePresence>
      <Motion
        v-if="showSidebar && !isLoading && visibleDetails.length > 1"
        :initial="{ opacity: 0, x: 50 }"
        :animate="{ opacity: 1, x: 0 }"
        :exit="{ opacity: 0, x: 50 }"
        :transition="{ duration: 0.3, ease: 'easeInOut' }"
        class="hidden lg:flex flex-col w-64 shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)]"
        tag="div"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
          >
            <div
              class="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              <List class="w-4 h-4 text-primary-500" />
              Daftar Surat
            </div>
            <button
              @click="toggleSidebar"
              class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <PanelRightClose class="w-4 h-4" />
            </button>
          </div>
          <div class="overflow-y-auto flex-1 p-2 space-y-1">
            <button
              v-for="(detail, index) in visibleDetails"
              :key="detail.id || detail.urutan || index"
              @click="navigateToSurat(index)"
              class="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group"
              :class="
                activeSuratIndex === index
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-primary-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-2 border-transparent'
              "
            >
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  :class="
                    index === 0
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  "
                >
                  {{ visibleDetails.length - index }}
                </span>
                <span
                  class="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 truncate"
                >
                  {{ detail.jenis_label || detail.jenis || '-' }}
                </span>
              </div>
              <p
                class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate"
                :class="activeSuratIndex === index ? 'text-primary-700 dark:text-primary-300' : ''"
              >
                {{ detail.perihal || detail.subject || '(Tidak ada perihal)' }}
              </p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                {{ detail.pengirim?.position_text || detail.from?.position_text || '-' }}
              </p>
            </button>
          </div>
        </div>
      </Motion>
    </AnimatePresence>

    <UModal
      v-model:open="isOpenKonsepModal"
      :dismissible="false"
      :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }"
    >
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
          <button
            @click="isOpenKonsepModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </template>
      <template #body>
        <div class="space-y-3">
          <div
            v-for="(opt, idx) in konsepOptions"
            :key="idx"
            @click="selectKonsep(opt)"
            class="group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200"
            :class="
              draftItem
                ? opt.type === draftItem.jenis
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600 cursor-pointer'
                  : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 opacity-40 cursor-not-allowed'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-500 cursor-pointer'
            "
          >
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              :class="[
                opt.colorClass,
                draftItem && opt.type !== draftItem.jenis
                  ? ''
                  : 'transition-transform group-hover:scale-110',
              ]"
            >
              <component :is="opt.icon" class="w-6 h-6" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4
                  class="text-base font-bold text-gray-900 dark:text-white"
                  :class="
                    draftItem && opt.type !== draftItem.jenis
                      ? ''
                      : 'group-hover:text-primary-600 transition-colors'
                  "
                >
                  {{ opt.label }}
                </h4>
                <span
                  v-if="draftItem && opt.type === draftItem.jenis"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-white uppercase tracking-wide"
                >
                  Draft Tersimpan
                </span>
                <span
                  v-else-if="draftItem && opt.type !== draftItem.jenis"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-300 dark:bg-gray-600 text-white uppercase tracking-wide"
                >
                  Tidak Tersedia
                </span>
              </div>
              <p
                v-if="draftItem && opt.type === draftItem.jenis"
                class="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5"
              >
                Klik untuk melanjutkan draft yang sudah ada
              </p>
              <p
                v-else-if="draftItem && opt.type !== draftItem.jenis"
                class="text-xs text-gray-400 dark:text-gray-500 mt-0.5"
              >
                Selesaikan draft yang ada terlebih dahulu
              </p>
            </div>
            <ChevronRight
              class="w-5 h-5 transition-colors"
              :class="
                draftItem && opt.type !== draftItem.jenis
                  ? 'text-gray-200 dark:text-gray-700'
                  : 'text-gray-300 group-hover:text-primary-500'
              "
            />
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="showFinalizeOptionsModal"
      :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }"
    >
      <template #header>
        <div class="w-full flex justify-between items-start">
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Finalisasi Konsep
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Apakah Anda yakin ingin memfinalisasi konsep ini?
            </p>
          </div>
          <button
            @click="showFinalizeOptionsModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </template>
      <template #body>
        <div class="flex justify-end gap-3">
          <button
            @click="showFinalizeOptionsModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Batal
          </button>
          <button
            @click="handleFinalizeAndRedirect"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            <CheckCircle class="w-4 h-4" /> Ya, Finalisasi
          </button>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showRejectModal" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header>
        <div class="w-full flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                Tolak Konsep
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Berikan alasan penolakan konsep ini.
              </p>
            </div>
          </div>
          <button
            @click="showRejectModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </template>
      <template #body>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200"
              >Catatan Penolakan <span class="text-red-500">*</span></label
            >
            <textarea
              v-model="rejectNote"
              rows="4"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-gray-400 dark:text-white mt-2"
              placeholder="Contoh: Perihal kurang jelas..."
            ></textarea>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showRejectModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Batal
          </button>
          <button
            @click="handleConfirmReject"
            :disabled="isRejecting || !rejectNote.trim()"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Loader2 v-if="isRejecting" class="w-4 h-4 animate-spin" />
            {{ isRejecting ? 'Memproses...' : 'Tolak Konsep' }}
          </button>
        </div>
      </template>
    </UModal>

    <USlideover
      v-model:open="isPreviewOpen"
      :title="previewTitle"
      :description="previewTitle"
      side="bottom"
      :ui="{
        content: 'h-[90vh] sm:h-screen max-h-screen rounded-t-2xl sm:rounded-none',
        body: 'p-0',
        footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
      }"
    >
      <template #body>
        <div class="w-full h-full relative bg-gray-100 dark:bg-gray-900 flex flex-col">
          <div
            v-if="isLocalPdfLoading"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 z-20"
          >
            <Loader2 class="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400 mb-2" /><span
              class="text-xs text-gray-500 dark:text-gray-400"
              >Memuat Dokumen...</span
            >
          </div>
          <iframe
            v-if="activePdfUrl"
            :src="activePdfUrl"
            class="w-full h-full border-none flex-1"
          />
          <div
            v-else-if="!isLocalPdfLoading"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2"
          >
            <FileText class="w-12 h-12l opacity-30" /><span class="text-sm"
              >Dokumen tidak dapat ditampilkan.</span
            >
          </div>
        </div>
      </template>
    </USlideover>
  </div>
  </template>
</template>
