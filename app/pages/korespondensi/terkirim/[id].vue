<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from "vue";
import { useRoute, useRouter } from 'vue-router';
import {
  Loader2, X, CheckCircle, XCircle, AlertCircle,
  Users, FileText, Building2, ChevronRight, ArrowDown,
  PanelRightOpen, PanelRightClose, List, ArrowUpDown,
  Mail, Send, Save
} from "lucide-vue-next";
import { pickKorespondensiListQuery } from "~/utils/korespondensi-list-state";

// Import Component Baru
// Jika Anda pakai DetailNaskah, import DetailNaskah seperti sebelumnya:
import DetailNaskah from '@/components/DetailNaskah.vue';

definePageMeta({ middleware: "auth" });

// --- SETUP & COMPOSABLES ---
const route = useRoute();
const router = useRouter();
const { user, hasPermission } = useAuth();
const canView = computed(() => hasPermission('naskah-dinas', 'read'))
const positionId = computed(() => user.value?.position?.id || user.value?.position_id);

const { fetchInboxDetail, fetchKonsepDetail, toggleFlag } = useInbox();
const { rejectKonsep } = useKonsep();
const { fetchSentNavigation } = useSirkulasi();
const { apiPost, apiGet } = useApi();

const id = route.params.id as string;
const jenisQuery = route.query.jenis as string;
const returnListQuery = computed(() => pickKorespondensiListQuery(route.query));
const returnPath = computed(() => {
  const value = route.query.return_path;
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')
    ? raw
    : '/korespondensi/terkirim';
});
const returnPathQuery = computed(() => ({
  ...(returnPath.value !== '/korespondensi/terkirim' ? { return_path: returnPath.value } : {}),
}));

// --- DEFINISI VARIABEL YANG HILANG (FIX ERROR DISINI) ---
const targetHighlightId = computed(() => {
  return (route.query.highlight_id as string) || (route.query.ref_id as string) || (route.params.id as string);
});

// --- STATE ---
const details = ref<any[]>([]);
const selected = ref<any>(null);
const isLoading = ref(true);
const isKonsepData = ref(false);

// --- NAVIGATION (previous/next dari terkirim) ---
const navPrev = ref<any>(null);
const navNext = ref<any>(null);
const isLoadingNav = ref(false);

// Collapse management
const collapsedIndices = ref<Set<number>>(new Set());
const viewMode = ref<'all' | 'first-only'>('all');

// Sidebar TOC state
const showSidebar = ref(false);
const activeSuratIndex = ref(0);

const toggleSidebar = () => { showSidebar.value = !showSidebar.value; };

const navigateToSurat = (index: number) => {
  const detail = details.value[index];
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
  details.value.forEach((detail, i) => {
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

// Kirim Email Modal State
const showKirimEmailModal = ref(false);
const kirimEmailTarget = ref<any>(null);
const kirimEmailForm = ref({
  to: '',
  cc: '',
  bcc: '',
  from_as: 'ARSIPKU',
});
const kirimEmailLoading = ref(false);
const kirimEmailError = ref('');
const kirimEmailSuccess = ref('');

// --- EMAIL VALIDATION HELPERS ---
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parse comma-separated email string → trimmed array */
const parseEmails = (raw: string): string[] =>
  raw.split(',').map(s => s.trim()).filter(Boolean);

/** Validasi format + duplikat antar To/CC/BCC */
const validateEmailFields = (): string | null => {
  const to = parseEmails(kirimEmailForm.value.to);
  const cc = parseEmails(kirimEmailForm.value.cc);
  const bcc = parseEmails(kirimEmailForm.value.bcc);

  if (to.length === 0) return 'Alamat email tujuan (To) wajib diisi';

  // Cek format semua email
  const all = [...to, ...cc, ...bcc];
  for (const email of all) {
    if (!EMAIL_REGEX.test(email)) return `Format email tidak valid: ${email}`;
  }

  // Cek duplikat antar field (case-insensitive)
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const email of all) {
    const lower = email.toLowerCase();
    if (seen.has(lower)) {
      dupes.push(email);
    } else {
      seen.add(lower);
    }
  }
  if (dupes.length > 0) {
    return `Email duplikat tidak diperbolehkan: ${dupes.join(', ')}`;
  }

  return null;
};

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
const processGrouping = (individuals: any[], groups: any[], senderPositionId?: string) => {
  if (!Array.isArray(individuals) || individuals.length === 0) return [];
  if (!Array.isArray(groups) || groups.length === 0) return individuals;

  const individualIds = new Set(individuals.map(item => String(item.position_id || item.id)));
  const matchedIds = new Set();
  const result: any[] = [];

  // Kumpulkan semua ID yang "tidak perlu ada" di individualIds:
  // - myPosId (user login)
  // - senderPositionId (pengirim flow, yang tidak menerima surat sendiri)
  const myPosId = String(
    user.value?.position?.id || user.value?.position_id || user.value?.position || ''
  );
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
// --- DATA FETCHING ---
const loadData = async () => {
  if (!id) return;
  isLoading.value = true;
  details.value = [];
  selected.value = null;

  navPrev.value = null;
  navNext.value = null;

  try {
    // Fetch navigation (prev/next) untuk pesan terkirim
    isLoadingNav.value = true;
    try {
      const nav = await fetchSentNavigation(id, jenisQuery);
      navPrev.value = nav.previous;
      navNext.value = nav.next;
    } catch (navErr) {
      console.error('[Detail Terkirim] fetchSentNavigation failed:', navErr);
    } finally {
      isLoadingNav.value = false;
    }

    if (jenisQuery === 'K') {
      // === KONSEP === (di halaman terkirim)
      isKonsepData.value = true;
      const response = await fetchKonsepDetail(id);
      const rawData: any = (response as any)?.data || response;
      const konsepTo = rawData?.to_konsep || null;

      // Handle kedua format: array langsung ATAU object dengan .flow
      let rawFlows: any[] = [];
      if (rawData && Array.isArray(rawData.flow)) {
        rawFlows = rawData.flow;
      } else if (Array.isArray(rawData)) {
        rawFlows = rawData;
      } else if (rawData) {
        rawFlows = [rawData];
      }

      if (rawFlows.length === 0) return;

      const sortedFlows = [...rawFlows].sort((a: any, b: any) => {
        const aJenis = String(a?.jenis || '').toUpperCase();
        const bJenis = String(b?.jenis || '').toUpperCase();
        if (aJenis === 'KN' && bJenis !== 'KN') return -1;
        if (bJenis === 'KN' && aJenis !== 'KN') return 1;
        return new Date(b.created_at || b.tanggal).getTime() - new Date(a.created_at || a.tanggal).getTime();
      });

      const lastFlow = sortedFlows[0];
      selected.value = lastFlow;
      initFlagState();

      // showFinalize & showEdit tidak relevan di terkirim, tapi tetap set
      showFinalizeActions.value = false;
      showEditAction.value = false;

      const hasNewer = Boolean(navNext.value);
      const hasOlder = Boolean(navPrev.value);

      details.value = sortedFlows.map((flow: any, index: number) => {
        const aksi = flow.detail?.aksi || flow.aksi || 'read';

        // Ambil position_id pengirim flow ini (yang tidak muncul di naskah_penerima)
        const senderPosId = String(
          flow.detail?.naskah_pengirim?.position_id ||
          flow.pengirim?.position_id ||
          ''
        );

        const rawPenerima: any[] = flow.detail?.naskah_penerima || flow.penerima || [];
        const penerimaGrup = flow.penerima_grup || flow.detail?.penerima_grup || [];
        const processedPenerima = processGrouping(rawPenerima, penerimaGrup, senderPosId); // ← pass senderPosId

        const rawTembusan: any[] = flow.detail?.naskah_tembusan || flow.tembusan || [];
        const tembusanGrup = flow.tembusan_grup || flow.detail?.tembusan_grup || [];
        const processedTembusan = processGrouping(rawTembusan, tembusanGrup, senderPosId);

        return {
          id: flow.id,
          sifat: flow.sifat,
          urutan: sortedFlows.length - index,
          aksi,
          jenis: flow.jenis || 'K',
          jenis_label: flow.jenis_label || 'Konsep',
          nomor: flow.nomor || '-',
          tanggal: flow.tanggal || flow.created_at || flow.createdAt || flow.detail?.created_at,
          created_at: flow.created_at || flow.createdAt || flow.detail?.created_at || flow.detail?.createdAt,
          pengirim: flow.detail?.naskah_pengirim || flow.pengirim,
          from: flow.pengirim,
          to_konsep: flow.penerima[0] || {},
          penerima: processedPenerima,
          to: processedPenerima,
          cc: processedTembusan,
          rich_content: flow.konten || '',
          catatan: flow.detail?.catatan || flow.catatan || '',
          attachments: flow.lampiran_files || [],
          pdf_snapshot: flow.final_pdf_url || flow.final_pdf || '',
          _ui: { showAllRecipients: false, showAllCC: false, isContentExpanded: false, showReadMoreButton: false },
          _hasNewer: index === 0 ? hasNewer : false,
          _hasOlder: index === 0 ? hasOlder : false,
        };
      });

    } else {
      // === SURAT MASUK / KELUAR ===
      isKonsepData.value = false;
      const response = await fetchInboxDetail(id, jenisQuery);

      const rawData: any = (response as any)?.data || response;
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
        rawFlows = (inboxData.flow && inboxData.flow.length > 0) ? inboxData.flow : [inboxData];
      }

      if (inboxData && rawFlows.length > 0) {
        selected.value = inboxData;
        initFlagState();

        const hasNewer = Boolean(navNext.value);
        const hasOlder = Boolean(navPrev.value);

        details.value = rawFlows.map((item: any, index: number) => {
          // Robust checking untuk penerima
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

          // Robust checking untuk tembusan
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
            ttd: item.ttd,
            sifat: item.sifat,
            dikirim_oleh: inboxData.dikirim_oleh || null,
            aksi: item.status || 'read',
            jenis: item.jenis || inboxData.jenis || 'SM',
            jenis_label: item.jenis_label || inboxData.jenis_label || 'SURAT MASUK',
            perihal: item.perihal || inboxData.perihal,
            nomor: item.nomor || inboxData.nomor || '-',
            tanggal: item.tanggal || inboxData.tanggal,
            created_at: item.created_at || item.createdAt || item.detail?.created_at || item.detail?.createdAt || item.raw?.created_at || item.raw?.createdAt || inboxData.created_at || inboxData.createdAt || item.tanggal,
            pengirim: item.pengirim || item.from || inboxData.pengirim,
            to: listPenerima,
            cc: listTembusan,
            mainDisplayContentHtml: item.konten || item.isi || '',
            catatan: item.catatan || inboxData.detail?.catatan || inboxData.disposisi_content?.catatan || '',
            disposisi: item.disposisi || item.instruksi || inboxData.disposisi_content?.disposisi,
            lampiran_files: item.lampiran_files || item.attachments || [],
            final_pdf_url: item.final_pdf_url || item.file_url || inboxData.final_pdf_url,
            _ui: { showAllRecipients: false, showAllCC: false, isContentExpanded: false, showReadMoreButton: false },
            _hasNewer: index === 0 ? hasNewer : false,
            _hasOlder: index === 0 ? hasOlder : false,
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
  },
);

// --- NAVIGATION HANDLERS (prev/next pesan terkirim) ---
const goToNav = (target: any) => {
  if (!target?.id_naskah) return;
  const targetJenis = target.jenis || jenisQuery || 'ND';
  router.push({
    path: `/korespondensi/terkirim/${target.id_naskah}`,
    query: { ...returnListQuery.value, ...returnPathQuery.value, jenis: targetJenis },
  });
};

const goToNewer = () => goToNav(navNext.value);
const goToOlder = () => goToNav(navPrev.value);

// --- ACTION HANDLERS (Sama seperti sebelumnya) ---
const goBack = () => router.push({
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

const handleToggleFlag = async (
  type: "favorit" | "tindak_lanjut" | "lock" | "note",
  noteText?: string,
) => {
  const s = selected.value;
  if (!s) return;
  const idSirkulasi = s.sirkulasiId || s.user_sirkulasi?.id_sirkulasi || s.raw?.user_sirkulasi?.id_sirkulasi;
  if (!idSirkulasi) {
    useToast().add({ title: 'Error', description: 'ID Sirkulasi tidak ditemukan.', color: 'error' });
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
    useToast().add({ title: 'Berhasil', description: isNowActive ? 'Catatan disimpan' : 'Catatan dihapus', color: 'success' });
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
  useToast().add({ title: 'Berhasil', description: descMap[type][isNowActive ? 0 : 1], color: 'success' });

  try {
    const mailObj = { sirkulasiId: idSirkulasi, ...flagState.value };
    await toggleFlag(mailObj, type);
  } catch {
    (flagState.value as any)[flagKey] = !(flagState.value as any)[flagKey];
    useToast().add({ title: 'Gagal', description: 'Gagal memperbarui status.', color: 'error' });
  }
};

// Floating scroll FAB state
const isAtBottom = ref(false);
const checkScrollPosition = () => {
  const threshold = 120;
  isAtBottom.value = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;
};

const scrollToEdge = () => {
  if (isAtBottom.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }
};

const goToFirstSurat = () => {
  if (details.value.length === 0) return;
  const firstIdx = details.value.length - 1;
  collapsedIndices.value = new Set(
    details.value.map((_, i) => i).filter(i => i !== firstIdx)
  );
  viewMode.value = 'first-only';
  nextTick(() => {
    const firstSurat = details.value[firstIdx];
    const element = document.getElementById(`card-${firstSurat.id || firstSurat.urutan}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
};

const goToLatestSurat = () => {
  collapsedIndices.value = new Set();
  viewMode.value = 'all';
  nextTick(() => {
    const latest = details.value[0];
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

// === KIRIM VIA EMAIL ===
const openKirimEmailModal = (detail: any) => {
  kirimEmailTarget.value = detail;
  // Auto-fill 'to' dari email penerima (tertuju) surat SDE
  const emails = (detail.penerima || detail.to || [])
    .map((p: any) => p.email)
    .filter(Boolean);
  kirimEmailForm.value = {
    to: emails.join(', '),
    cc: '',
    bcc: '',
    from_as: 'ARSIPKU',
  };
  kirimEmailError.value = '';
  kirimEmailSuccess.value = '';
  showKirimEmailModal.value = true;
};

const submitKirimEmail = async (mode: 'send' | 'draft' = 'send') => {
  if (!kirimEmailTarget.value?.id) return;

  // Validasi format + duplikat To/CC/BCC
  const validationError = validateEmailFields();
  if (validationError) {
    kirimEmailError.value = validationError;
    return;
  }

  kirimEmailLoading.value = true;
  kirimEmailError.value = '';
  kirimEmailSuccess.value = '';

  const endpoint = mode === 'draft'
    ? `/SDE/${kirimEmailTarget.value.id}/save-email-draft`
    : `/SDE/${kirimEmailTarget.value.id}/send-email`;

  try {
    const res = await apiPost(endpoint, {
      to: kirimEmailForm.value.to,
      cc: kirimEmailForm.value.cc || undefined,
      bcc: kirimEmailForm.value.bcc || undefined,
      from_as: kirimEmailForm.value.from_as || 'ARSIPKU',
    });
    kirimEmailSuccess.value = res?.message || (mode === 'draft' ? 'Draft email berhasil disimpan' : 'Email berhasil dikirim');
    if (mode === 'send') {
      setTimeout(() => {
        showKirimEmailModal.value = false;
        navigateTo('/layanan-email/log');
      }, 1500);
    }
  } catch (err: any) {
    kirimEmailError.value = err?.response?.data?.message || err?.message || (mode === 'draft' ? 'Gagal menyimpan draft email' : 'Gagal mengirim email');
  } finally {
    kirimEmailLoading.value = false;
  }
};
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
  <div v-if="!canView" class="flex flex-col items-center justify-center py-20 text-center">
    <UIcon name="i-lucide-lock" class="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
    <p class="text-sm text-gray-400">{{ $t('akses_ditolak') }}</p>
  </div>
  <template v-else>
  <PageHeader title="Detail Surat" :items="breadcrumbs" />

  <div class="w-full flex gap-4 pt-4 relative">

    <!-- Main content -->
    <div class="flex-1 flex flex-col gap-6 min-w-0">

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
        :id="`card-${detail.id || detail.urutan}`" class="relative transition-all duration-500 scroll-mt-24 mb-3 last:mb-0"
        :class="{ 'ring-2 ring-primary-200 rounded-xl': details.length > 1 && isHighlighted(detail) }">

        <div>
          <DetailNaskah context="sent" :data="detail" :is-head="index === 0"
            :is-starred="flagState.isStarred" :is-tinjut="flagState.isTinjut" :is-locked="flagState.isLocked" :is-note="flagState.isNote"
            :collapsed="isCardCollapsed(index)"
            :show-finalize="isKonsepData && index === 0 && showFinalizeActions"
            :show-edit="isKonsepData && index === 0 && showEditAction"
            :show-footer-actions="!isKonsepData && index === 0 && !isTerkirim" :allowed-actions="allowedActions"
            :user-position-id="positionId" :is-jenis-d-i="isJenisDI" @back="goBack"
            @preview="(url) => openDocumentPreview(url, detail.perihal)" @preview-file="openPreviewFile"
            @finalize="handleFinalize" @reject="handleReject" @edit="handleEditKonsep"
            @lanjut-nota="handleLanjutNotaDinas" @lanjut-disposisi="handleLanjutDisposisi"
            @lanjut-konsep="isOpenKonsepModal = true"
            @kirim-email="openKirimEmailModal(detail)"
            @nav-newer="goToNewer"
            @nav-older="goToOlder"
            @favorite="handleToggleFlag('favorit')"
            @tindak-lanjut="handleToggleFlag('tindak_lanjut')"
            @lock="handleToggleFlag('lock')"
            @catatan="(text) => handleToggleFlag('note', text)"
            @toggle-collapse="toggleCardCollapse(index)" />
        </div>
      </div>
    </template>

    <!-- KIRIM VIA EMAIL MODAL -->
    <ClientOnly>
      <Teleport to="body">
      <UModal v-model:open="showKirimEmailModal" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
        <template #header>
          <div class="w-full flex justify-between items-center">
            <div class="flex items-center gap-2 px-1">
              <Mail class="w-5 h-5 text-indigo-600" />
              <span class="text-sm font-semibold text-gray-800 dark:text-white">Kirim via Email</span>
            </div>
            <button
              @click="showKirimEmailModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </template>
        <template #body>
          <div class="flex flex-col gap-3 px-1">
            <!-- Info surat -->
            <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <p class="text-xs text-gray-600 dark:text-gray-300">
                <span class="font-medium">Surat:</span> {{ kirimEmailTarget?.nomor || '-' }}
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-300">
                <span class="font-medium">Perihal:</span> {{ kirimEmailTarget?.perihal || '-' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PDF final + lampiran akan dikirim sebagai attachment.
              </p>
            </div>

            <!-- To -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700 dark:text-gray-200">
                To <span class="text-red-500">*</span>
              </label>
              <input
                v-model="kirimEmailForm.to"
                type="text"
                placeholder="email@example.com (pisahkan koma untuk multiple)"
                class="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p v-if="kirimEmailTarget?.penerima?.length" class="text-xs text-gray-400">
                Email penerima dari naskah: {{ kirimEmailTarget.penerima.map((p: any) => p.email).filter(Boolean).join(', ') || '(tidak ada email)' }}
              </p>
            </div>

            <!-- CC -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700 dark:text-gray-200">CC</label>
              <input
                v-model="kirimEmailForm.cc"
                type="text"
                placeholder="cc@example.com"
                class="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <!-- BCC -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700 dark:text-gray-200">BCC</label>
              <input
                v-model="kirimEmailForm.bcc"
                type="text"
                placeholder="bcc@example.com"
                class="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <!-- From As -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-700 dark:text-gray-200">From As</label>
              <input
                v-model="kirimEmailForm.from_as"
                type="text"
                placeholder="ARSIPKU"
                class="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <!-- Error -->
            <div v-if="kirimEmailError" class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p class="text-xs text-red-600 dark:text-red-400">{{ kirimEmailError }}</p>
            </div>

            <!-- Success -->
            <div v-if="kirimEmailSuccess" class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p class="text-xs text-green-600 dark:text-green-400">{{ kirimEmailSuccess }}</p>
            </div>
          </div>
        </template>
        <template #footer>
          <div v-if="hasPermission('naskah-dinas', 'create')" class="flex justify-end gap-2 w-full">
            <button
              @click="submitKirimEmail('draft')"
              :disabled="kirimEmailLoading"
              class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Loader2 v-if="kirimEmailLoading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              Simpan Draft
            </button>
            <button
              @click="submitKirimEmail('send')"
              :disabled="kirimEmailLoading"
              class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Loader2 v-if="kirimEmailLoading" class="w-4 h-4 animate-spin" />
              <Send v-else class="w-4 h-4" />
              Kirim Email
            </button>
          </div>
        </template>
      </UModal>
      </Teleport>
    </ClientOnly>

    </div><!-- end main content -->

    <!-- Floating scroll FAB -->
    <button v-if="!isLoading && details.length > 1"
      @click="scrollToEdge"
      class="fixed right-4 bottom-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 hover:bg-primary-700 active:scale-95 transition-all duration-200"
      :aria-label="isAtBottom ? 'Ke atas' : 'Ke bawah'">
      <ArrowUpDown class="w-4 h-4 transition-transform duration-300" :class="isAtBottom ? 'rotate-180' : ''" />
      <span class="text-xs font-semibold">{{ isAtBottom ? 'Ke Atas' : 'Ke Bawah' }}</span>
    </button>

    <!-- Toggle sidebar button (Daftar Surat) -->
    <button v-if="!showSidebar && !isLoading && details.length > 1"
      @click="toggleSidebar"
      class="fixed right-4 bottom-20 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-primary-500 hover:text-white hover:border-primary-500 active:scale-95 transition-all duration-200">
      <PanelRightOpen class="w-4 h-4" />
      <span>Daftar Surat</span>
    </button>

    <!-- Sidebar TOC Panel (right side) -->
    <AnimatePresence>
      <Motion v-if="showSidebar && !isLoading && details.length > 1"
        :initial="{ opacity: 0, x: 50 }"
        :animate="{ opacity: 1, x: 0 }"
        :exit="{ opacity: 0, x: 50 }"
        :transition="{ duration: 0.3, ease: 'easeInOut' }"
        class="hidden lg:flex flex-col w-64 shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)]"
        tag="div">
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div class="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <List class="w-4 h-4 text-primary-500" />
              Daftar Surat
            </div>
            <button @click="toggleSidebar"
              class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <PanelRightClose class="w-4 h-4" />
            </button>
          </div>
          <div class="overflow-y-auto flex-1 p-2 space-y-1">
            <button v-for="(detail, index) in details" :key="detail.id || detail.urutan || index"
              @click="navigateToSurat(index)"
              class="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group"
              :class="activeSuratIndex === index
                ? 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-primary-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-2 border-transparent'">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  :class="index === 0 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'">
                  {{ details.length - index }}
                </span>
                <span class="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 truncate">
                  {{ detail.jenis_label || detail.jenis || '-' }}
                </span>
              </div>
              <p class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate"
                :class="activeSuratIndex === index ? 'text-primary-700 dark:text-primary-300' : ''">
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
</template>
