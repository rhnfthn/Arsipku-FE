<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { resolveSenderTimeZone, formatSenderTimestamp } from '~/utils/sender-timezone';
import { formatDelegatedPosition } from '@/utils/delegation-display';
import {
  Calendar,
  Clock,
  Paperclip,
  FileText,
  ArrowLeft,
  Printer,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
  X,
  Edit3,
  Send,
  Users,
  Mail,
  ChevronLeft,
  ChevronRight,
  Star,
  Lock,
  LockOpen,
  StickyNote,
  Tag,
  Loader2,
  ArrowDownCircle,
  Archive,
  FolderPlus,
  Share2,
} from 'lucide-vue-next';

// Tambah prop
const props = defineProps<{
  data: any;
  isHead?: boolean;
  showFinalize?: boolean;
  showEdit?: boolean;
  showFooterActions?: boolean;
  allowedActions?: string[];
  context?: string;
  userPositionId?: string | number;
  isPengirimKonsep?: boolean;
  canTurunkanLagi?: boolean; // true jika masih ada bawahan untuk diturunkan (turunkan ke bawahan)
  konsepNaskah?: any | null;
  draft?: { id: string; jenis: string } | null;
  collapsed?: boolean;
  isStarred?: boolean;
  isTinjut?: boolean;
  isLocked?: boolean;
  isNote?: boolean;
  isArchived?: boolean;
  // Mode read-only (mis. dilihat sebagai anggota berkas): sembunyikan navigasi
  // pesan & flag pribadi (favorit/tindak lanjut/kunci/catatan). Back & pratinjau
  // dokumen tetap aktif.
  readOnly?: boolean;
}>();

// --- EMITS ---
const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'preview', url: string): void;
  (e: 'preview-file', file: any): void;
  (e: 'finalize'): void;
  (e: 'reject'): void;
  (e: 'edit'): void;
  (e: 'turunkan-konsep'): void;
  (e: 'lanjut-nota'): void;
  (e: 'lanjut-sdi'): void;
  (e: 'lanjut-sde'): void;
  (e: 'lanjut-sde-massal'): void;
  (e: 'lanjut-disposisi'): void;
  (e: 'lanjut-konsep'): void;
  (e: 'kirim-email'): void;
  (e: 'nav-newer'): void;
  (e: 'nav-older'): void;
  (e: 'toggle-collapse'): void;
  (e: 'favorite'): void;
  (e: 'tindak-lanjut'): void;
  (e: 'lock'): void;
  (e: 'catatan', text: string): void;
  (e: 'archive'): void;
  (e: 'share'): void;
  (e: 'add-to-berkas'): void;
}>();

const shouldShowFinalize = computed(() => {
  if (typeof props.showFinalize === 'boolean') {
    return props.showFinalize;
  }

  // Ini menjaga backward compatibility jika komponen dipakai di halaman lain tanpa prop.
  const isInbox = props.context === 'inbox' || props.context === 'kotak-masuk';
  const isPendingConcept = props.data?.aksi === 'create';

  if (isInbox && isPendingConcept) {
    return true;
  }

  return false;
});

const normalizePositionId = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return String(value?.id || value?.position_id || value?.position || '');
  }
  return String(value);
};

const isSamePengirimPosition = computed(() => {
  const userPos = normalizePositionId(props.userPositionId);
  const pengirimPos = normalizePositionId(
    props.data?.pengirim?.position_id ||
      props.data?.pengirim?.position ||
      props.data?.from?.position_id ||
      props.data?.from?.position
  );
  if (!userPos || !pengirimPos) return false;
  return userPos === pengirimPos;
});

// User = penerima K ini (yang berhak tindak lanjut). Dipakai untuk hide button
// setelah user sudah aksi (K hasil aksi user: pengirim=user, penerima=orang lain → false).
const isPenerimaKonsepAktif = computed(() => {
  const userPos = normalizePositionId(props.userPositionId);
  if (!userPos) return false;
  const penerima = props.data?.penerima || [];
  return penerima.some((p: any) => normalizePositionId(p.position_id || p.id || p.position) === userPos);
});

// --- CONSTANTS ---
const LIMIT_DISPLAY = 2;
const MAX_FLOW_HEIGHT = 200;

const recipientPositionText = (recipient: any) =>
  formatDelegatedPosition(
    recipient?.position_text || recipient?.positionText || '',
    recipient?.position_status || recipient?.positionStatus,
  );

// --- HELPERS ---
const displayTimeZone = computed(() =>
  props.context === 'sent'
    ? resolveSenderTimeZone({ ...props.data?.from, ...props.data?.pengirim })
    : 'Asia/Jakarta'
);
const parseWibDate = (v: string): Date | null => {
  if (!v) return null;
  // BE kirim WIB string: "YYYY-MM-DD HH:mm:ss" → parse sebagai WIB (+07:00)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)) {
    return new Date(v.replace(' ', 'T') + '+07:00');
  }
  // ISO UTC string dengan Z
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};
const formatDate = (v: string) => {
  const d = parseWibDate(v);
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: displayTimeZone.value,
  }).format(d);
};
const formatFullDateTime = (v: string) => formatSenderTimestamp(v, displayTimeZone.value, true);
const formatTime = (v: string) => formatSenderTimestamp(v, displayTimeZone.value);
const formatDisposisiInline = (v: any) =>
  Array.isArray(v) ? v.join(', ') : String(v || '').replace(/(\r\n|\n|\r)/gm, ', ');
const getFlowInitials = (n: string) =>
  n
    ? n
        .trim()
        .split(' ')
        .slice(0, 2)
        .map((x: string) => (x[0] ?? '').toUpperCase())
        .join('')
    : '?';

// --- AKSI BADGE (tambahan) ---
// Badge status per langkah riwayat konsep. Tampil di setiap node K workflow
// agar user tahu status konsep (create/forward/turunkan/revisi/reject/approve/finalize)
// tanpa bingung baca riwayat. Label di-uppercase via CSS template.
const aksiConfig: Record<string, { label: string; color: string }> = {
  create:   { label: 'Konsep Baru',  color: 'bg-blue-500' },
  forward:  { label: 'Diteruskan',   color: 'bg-blue-500' },
  turunkan: { label: 'Perlu Revisi', color: 'bg-amber-500' },
  revisi:   { label: 'Direvisi',     color: 'bg-amber-500' },
  reject:   { label: 'Ditolak',      color: 'bg-red-500' },
  approve:  { label: 'Disetujui',    color: 'bg-green-500' },
  finalize: { label: 'Final',        color: 'bg-green-500' },
};

const aksiBadge = computed(() => {
  if (props.context === 'sent' && props.data?.conceptFinalization) {
    const state = sentConceptDocumentStatus(props.data);
    return { label: state.label, color: state.isFinal ? 'bg-green-500' : 'bg-amber-500' };
  }
  if (props.context === 'sent' && props.konsepNaskah) {
    const state = sentConceptDocumentStatus(props.konsepNaskah);
    return { label: state.label, color: state.isFinal ? 'bg-green-500' : 'bg-amber-500' };
  }
  const aksi = props.data?.aksi as string;
  return aksiConfig[aksi as keyof typeof aksiConfig] ?? null; // null = badge tidak ditampilkan
});

// Perihal untuk tampilan. Treat "-", null, "" sebagai kosong. Untuk disposisi
// (DI) tanpa ref perihal, tampilkan pesan jelas agar user tidak bingung lihat "-".
const displayPerihal = computed(() => {
  const p = props.data?.perihal;
  const s = props.data?.subject;
  const val = p && String(p).trim() !== '' && String(p).trim() !== '-'
    ? p
    : s && String(s).trim() !== '' && String(s).trim() !== '-'
      ? s
      : null;
  if (val) return val;
  if (String(props.data?.jenis || '').toUpperCase() === 'DI') {
    return 'Tidak ada ref perihal naskah';
  }
  return '(Tidak ada perihal)';
});

const jenisBadgeClass = computed(() => {
  const isKonsep = props.data?.aksi === 'create' ||
    (['K', 'KO'].includes(String(props.data?.jenis || '').toUpperCase()) && props.data?.jenis_naskah_konsep);
  return isKonsep ? 'bg-indigo-500 dark:bg-indigo-600' : 'bg-primary-500 dark:bg-primary-600';
});

const isKonsepJenis = computed(() => {
  const jenis = String(props.data?.jenis || '').toUpperCase();
  const jenisLabel = String(props.data?.jenis_label || '').toLowerCase();
  return jenis === 'K' || jenisLabel.includes('konsep');
});

const hasPrimaryConceptMessage = computed(
  () =>
    Boolean(props.isHead) &&
    !(props.context === 'sent' && props.konsepNaskah) &&
    isKonsepJenis.value &&
    ['reject', 'create', 'forward'].includes(String(props.data?.aksi || '').toLowerCase())
);



const isKonsepNaskahJenis = computed(() => String(props.data?.jenis || '').toUpperCase() === 'KN');
const konsepNaskahInfo = computed(
  () => props.konsepNaskah || (isKonsepNaskahJenis.value ? props.data : null)
);

const isMergedSentConcept = computed(() => props.context === 'sent' && Boolean(props.konsepNaskah));
const sentDocumentStatus = computed(() => sentConceptDocumentStatus(konsepNaskahInfo.value));

const konsepNaskahStatus = computed(() => {
  if (isMergedSentConcept.value) return sentDocumentStatus.value;
  const nomor = String(konsepNaskahInfo.value?.nomor || '').trim();
  const hasNomor = nomor !== '' && nomor !== '-';
  return {
    label: hasNomor ? 'Terkirim' : 'Pending',
    badgeClass: hasNomor
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  };
});

const isKonsepNaskahTerkirim = computed(() => {
  if (!props.isHead) return false;

  const nomor = String(konsepNaskahInfo.value?.nomor || '').trim();
  return props.data?.isKonsepFinished || (nomor !== '' && nomor !== '-');
});

const conceptActionTitle = computed(() => ({
  create: 'Konsep Awal', forward: 'Konsep Diteruskan', reject: 'Konsep Ditolak',
  revisi: 'Konsep Direvisi', turunkan: 'Permintaan Revisi Konsep',
  approve: 'Konsep Disetujui', finalize: 'Finalisasi Konsep',
} as Record<string, string>)[props.data?.aksi] || '');

const konsepRecipientLabel = computed(() =>
  isKonsepNaskahTerkirim.value ? 'Penerima Naskah' : 'Penerima Konsep'
);

const headerRecipients = computed(() => {
  const src = props.data?.to || props.data?.kepada || props.data?.penerima || [];
  const list = Array.isArray(src) ? src : src ? [src] : [];
  return list.filter(Boolean);
});

// --- IFRAME LOGIC ---
const handleFlowIframeLoad = (e: Event, flow: any) => {
  const iframe = e.target as HTMLIFrameElement;
  if (!iframe || !iframe.contentWindow) return;

  const doc = iframe.contentWindow.document;
  iframe.style.height = '10px';

  const rawHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
  const contentHeight = rawHeight + 10;
  flow.realHeight = contentHeight;

  if (contentHeight > MAX_FLOW_HEIGHT) {
    flow.showReadMore = true;
    flow.iframeHeight = flow.isExpanded ? `${contentHeight}px` : `${MAX_FLOW_HEIGHT}px`;
  } else {
    flow.showReadMore = false;
    flow.iframeHeight = `${contentHeight}px`;
  }
};

const toggleFlowContent = (flow: any) => {
  flow.isExpanded = !flow.isExpanded;
};

/** After content renders, check if it overflows to show "read more" */
const checkContentOverflow = (el: HTMLElement | null, flow: any) => {
  if (!el) return;
  nextTick(() => {
    flow.showReadMore = el.scrollHeight > MAX_FLOW_HEIGHT;
  });
};

// Helper permission
const hasAccess = (codes: string[]) => {
  if (!props.allowedActions) return false;
  return codes.some((code) => props.allowedActions?.includes(code));
};

// Collapse state controlled by parent via prop
const isCollapsed = computed(() => props.collapsed ?? false);

// --- NOTE MODAL STATE ---
const showNoteModal = ref(false);
const noteText = ref('');
const isSavingNote = ref(false);
const showRepairDropdown = ref(false);

const isNoteComputed = computed(() => {
  let existingNote = props.data?.catatan || props.data?.disposisi_content?.catatan || props.data?.noteText || props.data?.note_text || '';
  if (existingNote === '-') existingNote = '';
  return props.data?.isNote || existingNote.length > 0;
});

const openNoteModal = () => {
  let existingNote = props.data?.catatan || props.data?.disposisi_content?.catatan || props.data?.noteText || props.data?.note_text || '';
  if (existingNote === '-') existingNote = '';
  noteText.value = existingNote;
  showNoteModal.value = true;
};

const saveNote = async () => {
  isSavingNote.value = true;
  emit('catatan', noteText.value);
  showNoteModal.value = false;
  isSavingNote.value = false;
};

const removeNote = () => {
  noteText.value = '';
  emit('catatan', '');
  showNoteModal.value = false;
};
</script>

<template>
  <div
    v-if="data.aksi !== 'pending' && data.status !== 'draf'"
    class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md relative transition-colors"
  >
    <div
      class="h-14 flex items-center justify-between px-4 shrink-0 border-b border-gray-100 dark:border-gray-700"
    >
      <div class="flex items-center gap-2 min-w-0 overflow-hidden">
        <template v-if="isHead">
          <button
            @click="emit('back')"
            class="rounded-full text-gray-600 dark:text-gray-300 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 p-1 transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <h1 class="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">
            Kembali
          </h1>
        </template>
        <template v-else>
          <div class="flex items-center gap-2 min-w-0">
            <h2 class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {{
                data.subject ||
                (isKonsepJenis && !isMergedSentConcept ? conceptActionTitle : '') ||
                (data.aksi === 'create'
                  ? 'Konsep Awal'
                  : data.aksi === 'reject'
                    ? 'Konsep Ditolak'
                    : data.aksi === 'forward'
                      ? 'Revisi Konsep'
                      : data.jenis === 'DI'
                        ? 'Disposisi'
                        : isKonsepNaskahJenis || isMergedSentConcept
                          ? 'Konsep Naskah'
                          : 'Riwayat')
              }}
            </h2>
          </div>
        </template>
      </div>
      <!-- {{ data }} -->
      <div class="flex items-center gap-1 shrink-0 pl-2">
        <template v-if="!readOnly">
        <!-- Navigasi pesan lebih baru (<) -->
        <UTooltip v-if="isHead" text="Pesan lebih baru">
          <button
            @click="emit('nav-newer')"
            :disabled="!data._hasNewer"
            class="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :class="
              data._hasNewer
                ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400'
                : 'text-gray-300 dark:text-gray-600'
            "
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
        </UTooltip>

        <!-- Navigasi pesan lebih lama (>) -->
        <UTooltip v-if="isHead" text="Pesan lebih lama">
          <button
            @click="emit('nav-older')"
            :disabled="!data._hasOlder"
            class="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :class="
              data._hasOlder
                ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400'
                : 'text-gray-300 dark:text-gray-600'
            "
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </UTooltip>

        <!-- Divider: navigasi vs aksi -->
        <div v-if="isHead" class="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

        <!-- Favorite -->
        <UTooltip v-if="isHead" :text="isStarred ? 'Favorit (aktif)' : 'Favorit'">
          <button
            @click="emit('favorite')"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Star
              class="w-4 h-4 transition-colors cursor-pointer"
              :class="
                isStarred
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-yellow-400'
              "
            />
          </button>
        </UTooltip>

        <!-- Tindak Lanjut (display only, tidak bisa di-toggle manual) -->
        <UTooltip
          v-if="context !== 'sent'"
          :text="isTinjut ? 'Sudah tindak lanjut' : 'Belum tindak lanjut'"
        >
          <div
            class="p-1.5 rounded-lg"
            :class="!isHead ? 'bg-gray-50 dark:bg-gray-900/40' : ''"
          >
            <Tag
              class="w-4 h-4 -rotate-45 transition-colors"
              :class="
                isTinjut ? 'text-primary-500 fill-primary-500' : 'text-gray-300 dark:text-gray-600'
              "
            />
          </div>
        </UTooltip>

        <!-- Catatan -->
        <UTooltip v-if="isHead" :text="isNote ? 'Catatan (ada)' : 'Catatan'">
          <button
            @click="openNoteModal"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <StickyNote
              class="w-4 h-4 transition-colors cursor-pointer"
              :class="
                isNote
                  ? 'text-orange-600 fill-orange-100'
                  : 'text-gray-400 dark:text-gray-500 hover:text-orange-500'
              "
            />
          </button>
        </UTooltip>

        <!-- Lock (hanya untuk inbox, tidak ada di terkirim) -->
        <UTooltip v-if="isHead && context !== 'sent'" :text="isLocked ? 'Kunci (aktif)' : 'Kunci'">
          <button
            @click="emit('lock')"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Lock
              v-if="isLocked"
              class="w-4 h-4 transition-colors text-red-600 fill-red-100 cursor-pointer"
            />
            <LockOpen
              v-else
              class="w-4 h-4 transition-colors text-gray-400 dark:text-gray-500 hover:text-red-500 cursor-pointer"
            />
          </button>
        </UTooltip>

        <UTooltip v-if="isHead" :text="isArchived ? 'Kembalikan dari arsip' : 'Arsipkan'">
          <button
            @click="emit('archive')"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :aria-label="isArchived ? 'Kembalikan dari arsip' : 'Arsipkan naskah'"
          >
            <Archive
              class="w-4 h-4 transition-colors cursor-pointer"
              :class="isArchived ? 'text-primary-600 fill-primary-100' : 'text-gray-400 dark:text-gray-500 hover:text-primary-500'"
            />
          </button>
        </UTooltip>

        <!-- Masukkan ke Berkas -->
        <UTooltip v-if="isHead" text="Masukkan ke Berkas">
          <button
            @click="emit('add-to-berkas')"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FolderPlus
              class="w-4 h-4 transition-colors cursor-pointer text-gray-400 dark:text-gray-500 hover:text-primary-500"
            />
          </button>
        </UTooltip>

        <!-- Berbagi -->
        <UTooltip v-if="isHead" text="Bagikan">
          <button
            @click="emit('share')"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Share2
              class="w-4 h-4 transition-colors cursor-pointer text-gray-400 dark:text-gray-500 hover:text-blue-500"
            />
          </button>
        </UTooltip>

        <!-- Divider: aksi vs utilitas -->
        <div v-if="isHead" class="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />
        </template>

        <!-- Collapse toggle for non-head cards -->
        <button
          v-if="!isHead"
          @click="emit('toggle-collapse')"
          class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <ChevronDown v-if="isCollapsed" class="w-4 h-4 transition-transform duration-300" />
          <ChevronUp v-else class="w-4 h-4 transition-transform duration-300" />
        </button>
        <UTooltip text="Pratinjau Dokumen">
          <button
            v-if="data.pdf_snapshot || data.naskah?.final_pdf || data.final_pdf_url"
            @click="
              emit('preview', data.pdf_snapshot || data.naskah?.final_pdf || data.final_pdf_url)
            "
            class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Printer class="w-4 h-4" />
          </button>
        </UTooltip>
      </div>
    </div>

    <!-- Collapsed summary (only for non-head when collapsed) -->
    <AnimatePresence>
      <Motion
        v-if="!isHead && isCollapsed"
        :initial="{ opacity: 0, height: 0 }"
        :animate="{ opacity: 1, height: 'auto' }"
        :exit="{ opacity: 0, height: 0 }"
        :transition="{ duration: 0.3, ease: 'easeInOut' }"
        class="overflow-hidden"
        tag="div"
      >
        <div
          class="px-4 py-3 bg-gray-50/30 dark:bg-gray-900/30 border-y border-gray-100 dark:border-gray-700"
        >
          <div class="flex items-center gap-3 min-w-0 flex-wrap">
            <div
              v-if="!isKonsepJenis"
              class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 shrink-0"
            >
              <span class="font-mono font-semibold">{{
                data.nomor || data.naskah?.nomor || '-'
              }}</span>
            </div>
            <span class="opacity-30">•</span>
            <div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 shrink-0">
              <Calendar class="w-3 h-3" />
              <span>{{ formatDate(data.tanggal || data.created_at || data.createdAt) }}</span>
            </div>
            <span class="opacity-30">•</span>
            <div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 shrink-0">
              <Clock class="w-3 h-3" />
              <span>{{ formatTime(data.created_at || data.createdAt) }}</span>
            </div>
            <span class="opacity-30">•</span>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white bg-primary-500 dark:bg-primary-600 shrink-0"
            >
              {{
                data.aksi === 'kirim_disposisi'
                  ? 'DISPOSISI'
                  : data.jenis === 'DI'
                    ? 'DISPOSISI'
                  : data.aksi === 'create' ||
                      (['K', 'KO'].includes(data.jenis) && data.jenis_naskah_konsep)
                    ? data.jenis_naskah_konsep
                      ? 'KONSEP ' + data.jenis_naskah_konsep
                      : 'KONSEP'
                    : data.jenis_label || data.aksi
              }}
            </span>
            <span class="opacity-30">•</span>
            <p class="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0">
              {{ displayPerihal }}
            </p>
            <span class="opacity-30 shrink-0">•</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              {{ data.pengirim?.position_text || data.from?.position_text || '-' }}
            </span>
          </div>
        </div>
      </Motion>
    </AnimatePresence>

    <div
      v-show="isHead || !isCollapsed"
      class="p-5 sm:py-5 sm:px-8 bg-gray-50/30 dark:bg-gray-900/30 border-y border-gray-100 dark:border-gray-700"
    >
      <h2
        v-if="displayPerihal"
        class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3"
      >
        {{ displayPerihal }}
      </h2>
      <h2
        v-else-if="data.jenis_label?.includes('DISPOSISI')"
        class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3"
      >
        Disposisi
      </h2>

      <div
        class="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600 dark:text-gray-400"
      >
        <div v-if="!isKonsepJenis && (data.naskah?.nomor || data.nomor)" class="flex items-center gap-1">
          <span class="font-mono font-semibold text-gray-700 dark:text-gray-300"
            >{{ data.naskah?.nomor || data.nomor }}</span>
        </div>
        <span class="opacity-40">•</span>
        <div
          class="flex items-center gap-1 cursor-help"
          :title="
            'Waktu Kirim: ' + formatFullDateTime(data.created_at || data.createdAt)
          "
        >
          <Calendar class="w-3.5 h-3.5" /><span>{{
            formatDate(data.tanggal || data.created_at || data.createdAt)
          }}</span>
          <span class="opacity-40">•</span>
          <Clock class="w-3.5 h-3.5" /><span>{{
            formatTime(data.created_at || data.createdAt)
          }}</span>
        </div>
        <span class="opacity-40">•</span>
        <div
          class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white bg-primary-300 dark:bg-primary-600"
        >
          {{ data.sifat }}
        </div>
        <span class="opacity-40">•</span>
        <div
          class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white"
          :class="jenisBadgeClass"
        >
          {{
            data.aksi === 'kirim_disposisi'
              ? 'DISPOSISI'
              : data.jenis === 'DI'
                ? 'DISPOSISI'
              : data.aksi === 'create' ||
                  (['K', 'KO'].includes(data.jenis) && data.jenis_naskah_konsep)
                ? data.jenis_naskah_konsep
                  ? 'KONSEP ' + data.jenis_naskah_konsep
                  : 'KONSEP'
                : data.jenis_label || data.aksi
          }}
        </div>
        <!-- Badge aksi: status langkah riwayat konsep (create/forward/turunkan/revisi/reject/approve/finalize) -->
        <template v-if="aksiBadge">
          <span class="opacity-40">•</span>
          <div
            class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white"
            :class="aksiBadge.color"
          >
            {{ aksiBadge.label }}
          </div>
          <!-- <div>{{ data }}</div> -->
        </template>
        <span class="opacity-40" v-if="data.ttd">•</span>
        <div
          v-if="data.ttd"
          class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white bg-amber-500"
        >
          {{ data.ttd }}
        </div>
      </div>
      <div
        class="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-3 gap-1"
        v-if="data?.dikirim_oleh"
      >
        <span>Dikirim oleh :</span>
        <span class="font-medium text-gray-700 dark:text-gray-300">
          {{ data.dikirim_oleh.position_text }}
        </span>
        <span class="text-gray-400 dark:text-gray-500">({{ data.dikirim_oleh.nama }})</span>
      </div>
    </div>

    <Motion
      :animate="{
        opacity: isHead || !isCollapsed ? 1 : 0,
        height: isHead || !isCollapsed ? 'auto' : 0,
      }"
      :transition="{ duration: 0.3, ease: 'easeInOut' }"
      class="overflow-hidden"
      :style="{ visibility: isHead || !isCollapsed ? 'visible' : 'hidden' }"
      tag="div"
    >
      <div class="p-5 sm:p-8">
        <div v-if="context === 'sent' && data.conceptFinalization" class="mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
          <Paragraph variant="body2sb" class="text-gray-900 dark:text-white">Hasil Finalisasi Konsep</Paragraph>
          <Paragraph variant="body3" class="mt-1 text-gray-500 dark:text-gray-400">
            Difinalisasi oleh {{ data.conceptFinalization.pengirim?.nama || '-' }}
            · {{ formatFullDateTime(data.conceptFinalization.created_at) }}
          </Paragraph>
          <Paragraph v-if="data.conceptFinalization.catatan" variant="body2" class="mt-2 whitespace-pre-line text-gray-700 dark:text-gray-300">{{ data.conceptFinalization.catatan }}</Paragraph>
        </div>
        <div
          v-if="!isKonsepNaskahJenis && !isMergedSentConcept"
          class="flex items-center gap-4 mb-5 border-gray-200 dark:border-gray-700/50"
        >
          <ProfileAvatar
            size="md"
            :persnum="data.from?.persnum || data.pengirim?.persnum || data.from?.id_sirkuler || data.pengirim?.id_sirkuler"
            :alt="data.from?.nama || data.pengirim?.nama || ''"
            avatar-class="bg-primary-500 text-white font-semibold"
          >
            {{ getFlowInitials(data.from?.nama || data.pengirim?.nama) }}
          </ProfileAvatar>
          <div>
            <span class="text-sm font-semibold block text-gray-900 dark:text-white">
              {{
                data.from?.position_text ||
                data.pengirim?.positionText ||
                data.pengirim?.position_text ||
                '-'
              }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">{{
              data.from?.nama || data.pengirim?.nama || '-'
            }}</span>
          </div>

          <div
            v-if="
              data.to_konsep &&
              String(data.jenis_label || '')
                .toLowerCase()
                .includes('konsep')
            "
            class="ml-3 pl-3 border-l border-gray-200 dark:border-gray-700 flex items-center gap-3"
          >
            <ProfileAvatar
              size="md"
              :persnum="data.to_konsep.persnum || data.to_konsep.id_sirkuler"
              :alt="data.to_konsep.nama || ''"
              avatar-class="bg-primary-500 text-white font-semibold"
            >
              {{ getFlowInitials(data.to_konsep.nama) }}
            </ProfileAvatar>
            <div class="min-w-0">
              <span
                class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 block"
              >
                {{ konsepRecipientLabel }}
              </span>
              <span class="text-sm font-semibold block text-gray-900 dark:text-white">
                {{ recipientPositionText(data.to_konsep) || '-' }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                {{ data.to_konsep.nama || '-' }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="konsepNaskahInfo && (isKonsepNaskahJenis || isKonsepJenis)"
          class="mb-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Konsep Naskah</h3>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              :class="konsepNaskahStatus.badgeClass"
            >
              {{ konsepNaskahStatus.label }}
            </span>
          </div>

          <div class="grid grid-cols-[6rem_minmax(0,1fr)] sm:grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
            <span class="text-gray-500 dark:text-gray-400">Nomor:</span>
            <span class="min-w-0 font-medium text-gray-900 dark:text-white break-words">{{
              konsepNaskahInfo.nomor || '-'
            }}</span>

            <span class="text-gray-500 dark:text-gray-400">Tanggal:</span>
            <span class="min-w-0 font-medium text-gray-900 dark:text-white">{{
              formatDate(konsepNaskahInfo.tanggal || konsepNaskahInfo.created_at)
            }}</span>

            <span class="text-gray-500 dark:text-gray-400">Pengirim:</span>
            <div class="flex items-center gap-3 min-w-0">
              <ProfileAvatar size="sm" :persnum="konsepNaskahInfo.pengirim?.persnum || konsepNaskahInfo.pengirim?.id_sirkuler" :alt="konsepNaskahInfo.pengirim?.nama || ''" avatar-class="shrink-0">
                {{ getFlowInitials(konsepNaskahInfo.pengirim?.nama) }}
              </ProfileAvatar>
              <span class="min-w-0 font-medium text-gray-900 dark:text-white break-words">
                {{ recipientPositionText(konsepNaskahInfo.pengirim) || '-' }}
                <span class="font-normal text-gray-500 dark:text-gray-400">
                ({{ konsepNaskahInfo.pengirim?.nama || '-' }})
              </span>
              </span>
            </div>

            <span class="text-gray-500 dark:text-gray-400">Tertuju:</span>
            <div class="min-w-0 space-y-2">
              <div v-for="(person, index) in konsepNaskahInfo.to || []" :key="person.position_id || index" class="flex items-center gap-3">
                <ProfileAvatar v-if="!person.isGroup && !person.is_group" size="sm" :persnum="person.persnum || person.id_sirkuler" :alt="person.nama || ''" avatar-class="shrink-0">{{ getFlowInitials(person.nama) }}</ProfileAvatar>
                <span class="min-w-0 font-medium text-gray-900 dark:text-white break-words">{{ recipientPositionText(person) || person.label || '-' }}<span v-if="person.nama" class="font-normal text-gray-500 dark:text-gray-400"> ({{ person.nama }})</span></span>
              </div>
              <span v-if="!konsepNaskahInfo.to?.length">-</span>
            </div>

            <span class="text-gray-500 dark:text-gray-400">Tembusan:</span>
            <span class="min-w-0 font-medium text-gray-900 dark:text-white break-words">{{
              Array.isArray(konsepNaskahInfo.cc) && konsepNaskahInfo.cc.length > 0
                ? konsepNaskahInfo.cc
                    .map((t: any) => `${recipientPositionText(t) || '-'} (${t.nama || '-'})`)
                    .join(', ')
                : '-'
            }}</span>
          </div>
        </div>

        <div
          v-if="
            (!isKonsepJenis || !konsepNaskahInfo) &&
            (data.aksi === 'create' || data.aksi === 'forward' || data.aksi === 'reject')
          "
          class="mb-4 flex flex-col md:flex-row gap-2"
        >
          <div
            class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5"
          >
            Pengirim
          </div>
          <div class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 min-w-0">
            <div class="truncate min-w-0">
              <span class="font-medium">{{ data.pengirim?.position_text }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 ml-1"
                >({{ data.pengirim?.nama }})</span
              >
            </div>
          </div>
        </div>

        <div v-if="!isKonsepJenis || !konsepNaskahInfo" class="mb-4 flex flex-col md:flex-row gap-2">
          <div
            class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5"
          >
            Tertuju
          </div>
          <div class="flex flex-col gap-1 max-w-full min-w-0">
            <div
              v-if="Array.isArray(data.to || data.kepada)"
              class="flex flex-col gap-0.5 w-full min-w-0"
            >
              <div
                v-for="(t, ti) in data.showAllTo
                  ? data.to || data.kepada
                  : (data.to || data.kepada).slice(0, LIMIT_DISPLAY)"
                :key="ti"
                class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 min-w-0"
              >
                <span
                  v-if="(data.to || data.kepada).length > 1"
                  class="text-gray-400 dark:text-gray-500 font-mono text-[10px] pt-0.5 w-3 shrink-0"
                  >{{ Number(ti) + 1 }}.</span
                >

                <div class="truncate min-w-0">
                  <template v-if="data.jenis === 'SDE' || data.jenis === 'sde'">
                    <span class="font-medium">{{ t.nama }}</span>
                  </template>
                  <template v-else>
                    <span class="font-medium">{{ recipientPositionText(t) }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 ml-1"
                      >({{ t.nama }})</span
                    >
                  </template>
                </div>
              </div>

              <button
                v-if="(data.to || data.kepada).length > LIMIT_DISPLAY"
                @click="data.showAllTo = !data.showAllTo"
                class="text-xs font-semibold text-primary hover:text-primary-400 dark:text-primary-400 dark:hover:text-primary-300 mt-1 flex items-center gap-1 text-left w-fit"
              >
                {{
                  data.showAllTo
                    ? 'Sembunyikan'
                    : `+${(data.to || data.kepada).length - LIMIT_DISPLAY} lainnya`
                }}
              </button>
            </div>

            <div
              v-else
              class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 truncate"
            >
              <div class="wrap-break-word">
                <template v-if="data.jenis === 'SDE' || data.jenis === 'sde'">
                  <span class="font-medium">{{ data.to?.nama || data.kepada?.nama }}</span>
                </template>
                <template v-else>
                  <span class="font-medium">{{ recipientPositionText(data.to) }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 ml-1"
                    >({{ data.to?.nama }})</span
                  >
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- debug {{ data }} -->
        <div
          v-if="
            (!isKonsepJenis || !konsepNaskahInfo) && (data.cc || data.tembusan) && (data.cc || data.tembusan).length > 0
          "
          class="mb-6 flex flex-col md:flex-row gap-2"
        >
          <div
            class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5"
          >
            Tembusan
          </div>
          <div class="flex flex-col gap-0.5 w-full min-w-0">
            <div
              v-for="(t, ti) in data.showAllCc
                ? data.cc || data.tembusan
                : (data.cc || data.tembusan).slice(0, LIMIT_DISPLAY)"
              :key="ti"
              class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0"
            >
              <span
                v-if="(data.cc || data.tembusan).length > 1"
                class="text-gray-400 dark:text-gray-500 font-mono text-[10px] pt-0.5 w-3 shrink-0"
                >{{ Number(ti) + 1 }}.</span
              >
              <div class="truncate min-w-0">
                <span class="font-medium">{{ recipientPositionText(t) }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ t.nama }})</span>
              </div>
            </div>
            <button
              v-if="(data.cc || data.tembusan).length > LIMIT_DISPLAY"
              @click="data.showAllCc = !data.showAllCc"
              class="text-xs font-semibold text-primary hover:text-primary-400 dark:text-primary-400 dark:hover:text-primary-300 mt-1 flex items-center gap-1 text-left w-fit"
            >
              {{
                data.showAllCc
                  ? 'Sembunyikan'
                  : `+${(data.cc || data.tembusan).length - LIMIT_DISPLAY} lainnya`
              }}
            </button>
          </div>
        </div>

        <div
          v-if="
            data.disposisi_content?.disposisi ||
            data.disposisi ||
            data.konten ||
            data.jenis === 'DI'
          "
          class="mb-4 flex flex-col md:flex-row gap-2"
        >
          <div
            class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5"
          >
            {{ String(data.jenis || '').toUpperCase() === 'DI' ? 'Disposisi' : 'Instruksi' }}
          </div>
          <div class="flex flex-col gap-1 w-full min-w-0">
            <p
              class="text-sm font-medium text-gray-800 dark:text-gray-200 wrap-break-word whitespace-pre-line"
            >
              {{
                data.disposisi_content?.disposisi
                  ? data.disposisi_content.disposisi.replace(/\n/g, ', ')
                  : data.disposisi
                    ? formatDisposisiInline(data.disposisi)
                    : data.konten
                      ? data.konten
                      : data.mainDisplayContentHtml
                        ? data.mainDisplayContentHtml
                        : (data.rich_content || '').replace(/\n/g, ', ')
              }}
            </p>
          </div>
        </div>

        <div
          v-if="hasPrimaryConceptMessage"
          class="mb-4 flex flex-col md:flex-row gap-2"
        >
          <div
            class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5"
          >
            Pesan
          </div>
          <div class="flex flex-col gap-1 w-full min-w-0">
            <div class="text-sm font-medium text-gray-800 dark:text-gray-200 wrap-break-word">
              {{ data.catatan || '-' }}
            </div>
          </div>
        </div>

        <div v-if="isMergedSentConcept && data.catatan && data.catatan !== '-'" class="mb-4 text-sm text-gray-700 dark:text-gray-300">
          <p class="text-xs font-semibold mb-1">Catatan</p>
          <p class="whitespace-pre-line">{{ data.catatan }}</p>
        </div>

        <!-- Ganti seluruh div bg-gray-50 yang berisi template iframe -->
        <div
          v-if="!hasPrimaryConceptMessage"
          class="bg-gray-50 dark:bg-gray-900 rounded-lg mt-5 p-5 border border-gray-100 dark:border-gray-700 relative"
        >
          <!-- Riwayat konsep (non-head): catatan inline + hint pratinjau, konten full di preview ikon -->
          <template v-if="!isHead && ['K', 'KO'].includes(data.jenis) && !isMergedSentConcept">
            <div class="space-y-3">
              <div v-if="data.catatan && data.catatan !== '-'">
                <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Catatan</span>
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ data.catatan }}</p>
              </div>
              <p v-if="data.pdf_snapshot || data.naskah?.final_pdf || data.final_pdf_url" class="text-xs text-gray-400 dark:text-gray-500 italic">
                Klik ikon pratinjau di pojok kanan atas untuk melihat isi dokumen.
              </p>
            </div>
          </template>

          <template
            v-else-if="
              (String(data.jenis || '').toUpperCase() !== 'K' || isMergedSentConcept) &&
              (!isKonsepJenis || data.rich_content || data.mainDisplayContentHtml)
            "
          >
            <div class="relative w-full">
              <div
                class="relative overflow-hidden transition-all duration-300 ease-in-out content-html-container"
                :class="{ 'max-h-[200px]': data.showReadMore && !data.isExpanded }"
              >
                <div
                  :ref="(el) => checkContentOverflow(el as HTMLElement, data)"
                  class="prose prose-sm max-w-none dark:prose-invert
                    prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                    prose-p:text-gray-700 dark:prose-p:text-gray-300
                    prose-a:text-blue-600 dark:prose-a:text-blue-400
                    prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                    prose-table:border-gray-300 dark:prose-table:border-gray-600
                    prose-th:bg-gray-100 dark:prose-th:bg-gray-800
                    prose-td:border-gray-200 dark:prose-td:border-gray-700
                    prose-hr:border-gray-300 dark:prose-hr:border-gray-600
                    prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600
                    prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400
                    prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800
                    prose-code:text-gray-800 dark:prose-code:text-gray-200"
                  v-html="
                    data.jenis === 'DI'
                      ? data.catatan || '-'
                      : data.rich_content || data.mainDisplayContentHtml || ''
                  "
                ></div>
                <div
                  v-if="data.showReadMore && !data.isExpanded"
                  class="absolute bottom-0 left-0 w-full h-24 bg-linear-to-t from-gray-50 via-gray-50/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 pointer-events-none"
                ></div>
              </div>
              <div v-if="data.showReadMore" class="flex justify-center mt-2 relative z-10">
                <button
                  @click="toggleFlowContent(data)"
                  class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span v-if="!data.isExpanded" class="flex items-center gap-1">
                    <MoreHorizontal class="w-4 h-4" /> BACA SELENGKAPNYA
                  </span>
                  <span v-else class="flex items-center gap-1">
                    <ChevronUp class="w-4 h-4" /> TUTUP KONTEN
                  </span>
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="data.type === 'disposisi'">
            <div>
              <div
                v-if="data.disposisi_content?.catatan && data.disposisi_content.catatan !== '-'"
                class="prose prose-sm prose-blue dark:prose-invert max-w-none text-sm"
                v-html="data.disposisi_content.catatan"
              ></div>
              <p v-else class="text-sm text-gray-400 italic">- Tidak ada catatan disposisi -</p>
            </div>
          </template>

          <template v-else>
            <div>
              <p
                v-if="data.catatan && data.catatan !== '-'"
                class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line"
              >
                {{ data.catatan }}
              </p>
              <p v-else class="text-sm text-gray-400 italic">Tidak ada catatan</p>
            </div>
          </template>
        </div>

        <div class="mt-6">
          <div
            v-if="
              (data.attachments || data.lampiran_files) &&
              (data.attachments || data.lampiran_files).length > 0
            "
            class="mb-3"
          >
            <h3
              class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"
            >
              <Paperclip class="w-3 h-3" /> Lampiran
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <button
                v-for="file in data.attachments || data.lampiran_files"
                :key="file.id"
                @click="emit('preview-file', file)"
                class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-center flex flex-col h-full overflow-hidden group"
              >
                <div class="p-2 w-full">
                  <div
                    class="h-24 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex flex-col items-center justify-center gap-1 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors"
                  >
                    <FileText class="w-8 h-8 text-red-500" stroke-width="1.5" />
                    <span
                      class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                      >PDF</span
                    >
                  </div>
                </div>
                <div class="px-3 pb-3 flex-1 flex items-center justify-center w-full">
                  <UTooltip :text="file.file_name || file.fileName" :popper="{ placement: 'top' }">
                    <p
                      class="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-2 break-all leading-tight"
                    >
                      {{ file.file_name || file.fileName }}
                    </p>
                  </UTooltip>
                </div>
              </button>
            </div>
          </div>

          <!-- {{ data.jenis }} - {{ allowedActions }} - {{ isPengirimKonsep }} - -->
          <!-- debug {{ userPositionId }} -->
          <div class="flex flex-wrap gap-3 mt-8">
            <!-- ===== JENIS KO (Konsep): Setujui / Tolak / Perbaiki ===== -->
            <!-- ponytail: sembunyikan semua action button konsep saat workflow sudah
                 finalize (isKonsepFinished). Sebelumnya ini di-gate oleh override
                 aksi='finish' yang menimpa aksi asli; sekarang aksi asli dipertahankan
                 untuk badge riwayat, jadi gate pakai flag terpisah. -->
            <template v-if="['K'].includes(data.jenis) && !data.isKonsepFinished">
              <!-- aksi create/forward → Setujui + Tolak (untuk BOD) -->
              <template
                v-if="data.aksi === 'create' || data.aksi === 'forward' || data.aksi === 'finalize'"
              >
                <template v-if="hasAccess(['Setujui']) && showFinalize && isSamePengirimPosition">
                  <div
                    @click="isHead ? emit('finalize') : null"
                    class="flex text-white py-2.5 px-6 rounded-lg gap-2 items-center transition-colors shadow-sm bg-emerald-500"
                    :class="
                      isHead
                        ? 'hover:bg-emerald-600 cursor-pointer active:scale-[0.98]'
                        : 'opacity-50 cursor-not-allowed'
                    "
                  >
                    <CheckCircle class="w-4 h-4" />
                    <span class="text-sm font-medium whitespace-nowrap">Lanjut & Review</span>
                  </div>
                  <div
                    @click="isHead ? emit('reject') : null"
                    class="flex text-white py-2.5 px-6 rounded-lg gap-2 items-center transition-colors shadow-sm bg-red-500"
                    :class="
                      isHead
                        ? 'hover:bg-red-600 cursor-pointer active:scale-[0.98]'
                        : 'opacity-50 cursor-not-allowed'
                    "
                  >
                    <XCircle class="w-4 h-4" />
                    <span class="text-sm font-medium whitespace-nowrap">Tolak</span>
                  </div>
                  <!-- <div @click="emit('edit')"
                class="flex bg-amber-300 cursor-not-allowed py-2.5 px-6 rounded-lg text-white gap-2 items-center shadow-sm opacity-50">
                <Edit3 class="w-4 h-4" />
                <span class="text-sm font-medium whitespace-nowrap">Perbaiki Konsep</span>
              </div> -->
                </template>
                <template v-else-if="showFinalize && !isSamePengirimPosition">
                  <div
                    @click="isHead ? emit('lanjut-konsep') : null"
                    class="flex text-white py-2.5 px-6 rounded-lg gap-2 items-center transition-colors shadow-sm bg-yellow-500"
                    :class="
                      isHead
                        ? 'hover:bg-yellow-600 cursor-pointer active:scale-[0.98]'
                        : 'opacity-50 cursor-not-allowed'
                    "
                  >
                    <Edit3 class="w-4 h-4" />
                    <span class="text-sm font-medium whitespace-nowrap">Lanjutkan Konsep</span>
                  </div>
                  <div
                    @click="isHead ? emit('reject') : null"
                    class="flex text-white py-2.5 px-6 rounded-lg gap-2 items-center transition-colors shadow-sm bg-red-500"
                    :class="
                      isHead
                        ? 'hover:bg-red-600 cursor-pointer active:scale-[0.98]'
                        : 'opacity-50 cursor-not-allowed'
                    "
                  >
                    <XCircle class="w-4 h-4" />
                    <span class="text-sm font-medium whitespace-nowrap">Tolak</span>
                  </div>
                </template>
              </template>

              <!-- aksi reject:
       - Jika user adalah PENGIRIM konsep → tampilkan Perbaiki
       - Jika user bukan pengirim (penerima/atasan) → tidak ada tombol
  -->
              <template v-if="data.aksi === 'reject'">
                <!-- Dropdown: hanya kalau masih ada bawahan (canTurunkanLagi) -->
                <div
                  v-if="showEdit && isPengirimKonsep && isHead && canTurunkanLagi"
                  class="relative"
                >
                  <div
                    @click="showRepairDropdown = !showRepairDropdown"
                    class="flex bg-amber-500 hover:bg-amber-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]"
                  >
                    <Edit3 class="w-4 h-4" />
                    <span class="text-sm font-medium whitespace-nowrap">{{ $t('kon_perbaiki_konsep') }}</span>
                    <ChevronDown class="w-3.5 h-3.5 ml-1" />
                  </div>
                  <!-- Dropdown overlay -->
                  <div
                    v-if="showRepairDropdown"
                    class="fixed inset-0 z-40"
                    @click="showRepairDropdown = false"
                  />
                  <!-- Dropdown menu -->
                  <div
                    v-if="showRepairDropdown"
                    class="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
                  >
                    <div class="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                      <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ $t('kon_pilih_aksi_perbaiki') }}</p>
                    </div>
                    <button
                      @click="showRepairDropdown = false; emit('edit')"
                      class="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-3 transition-colors"
                    >
                      <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <Edit3 class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p class="font-semibold text-gray-900 dark:text-white">{{ $t('kon_perbaiki_sendiri') }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ $t('kon_perbaiki_sendiri_desc') }}</p>
                      </div>
                    </button>
                    <button
                      @click="showRepairDropdown = false; emit('turunkan-konsep')"
                      class="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-colors border-t border-gray-100 dark:border-gray-700"
                    >
                      <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <ArrowDownCircle class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p class="font-semibold text-gray-900 dark:text-white">{{ $t('kon_turunkan_ke_bawahan') }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ $t('kon_turunkan_ke_bawahan_desc') }}</p>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Button langsung (tanpa dropdown): kalau tidak ada bawahan -->
                <div
                  v-else-if="showEdit && isPengirimKonsep && isHead"
                  @click="emit('edit')"
                  class="flex bg-amber-500 hover:bg-amber-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]"
                >
                  <Edit3 class="w-4 h-4" />
                  <span class="text-sm font-medium whitespace-nowrap">{{ $t('kon_perbaiki_konsep') }}</span>
                </div>

              </template>

              <!-- aksi turunkan: konsep diturunkan ke saya (bawahan) untuk diperbaiki.
                   Tidak ada Tolak. Perbaiki dropdown: Perbaiki Sendiri / Turunkan ke Bawahan (jika ada bawahan). -->
              <template v-if="data.aksi === 'turunkan'">
                <!-- Dropdown: hanya kalau masih ada bawahan (canTurunkanLagi) -->
                <div
                  v-if="showEdit && isPenerimaKonsepAktif && isHead && canTurunkanLagi"
                  class="relative"
                >
                  <div
                    @click="showRepairDropdown = !showRepairDropdown"
                    class="flex bg-amber-500 hover:bg-amber-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]"
                  >
                    <Edit3 class="w-4 h-4" />
                    <span class="text-sm font-medium whitespace-nowrap">{{ $t('kon_perbaiki_konsep') }}</span>
                    <ChevronDown class="w-3.5 h-3.5 ml-1" />
                  </div>
                  <!-- Dropdown overlay -->
                  <div
                    v-if="showRepairDropdown"
                    class="fixed inset-0 z-40"
                    @click="showRepairDropdown = false"
                  />
                  <!-- Dropdown menu -->
                  <div
                    v-if="showRepairDropdown"
                    class="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
                  >
                    <div class="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                      <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ $t('kon_pilih_aksi_perbaiki') }}</p>
                    </div>
                    <button
                      @click="showRepairDropdown = false; emit('edit')"
                      class="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-3 transition-colors"
                    >
                      <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <Edit3 class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p class="font-semibold text-gray-900 dark:text-white">{{ $t('kon_perbaiki_sendiri') }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ $t('kon_perbaiki_sendiri_desc') }}</p>
                      </div>
                    </button>
                    <button
                      v-if="canTurunkanLagi"
                      @click="showRepairDropdown = false; emit('turunkan-konsep')"
                      class="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-colors border-t border-gray-100 dark:border-gray-700"
                    >
                      <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <ArrowDownCircle class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p class="font-semibold text-gray-900 dark:text-white">{{ $t('kon_turunkan_ke_bawahan') }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ $t('kon_turunkan_ke_bawahan_desc') }}</p>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Button langsung (tanpa dropdown): kalau tidak ada bawahan -->
                <div
                  v-else-if="showEdit && isPenerimaKonsepAktif && isHead"
                  @click="emit('edit')"
                  class="flex bg-amber-500 hover:bg-amber-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]"
                >
                  <Edit3 class="w-4 h-4" />
                  <span class="text-sm font-medium whitespace-nowrap">{{ $t('kon_perbaiki_konsep') }}</span>
                </div>

              </template>
            </template>

            <!-- ===== SURAT MASUK BIASA (non-KO): tombol tindak lanjut ===== -->
            <template v-else-if="showFooterActions">
              <div
                v-if="hasAccess(['ND'])"
                @click="emit('lanjut-nota')"
                class="flex bg-emerald-600 hover:bg-emerald-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <FileText class="w-4 h-4" />
                <span class="text-sm font-medium whitespace-nowrap">Lanjut Nota Dinas</span>
              </div>

              <div
                v-if="hasAccess(['SDI'])"
                @click="emit('lanjut-sdi')"
                class="flex bg-amber-600 hover:bg-amber-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <Users class="w-4 h-4" />
                <span class="text-sm font-medium whitespace-nowrap">Lanjut Surat Internal</span>
              </div>

              <div
                v-if="hasAccess(['DI'])"
                @click="emit('lanjut-disposisi')"
                class="flex bg-cyan-600 hover:bg-cyan-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <Send class="w-4 h-4" />
                <span class="text-sm font-medium whitespace-nowrap">Lanjut Disposisi</span>
              </div>

              <div
                v-if="hasAccess(['KO'])"
                @click="emit('lanjut-konsep')"
                class="flex bg-yellow-500 hover:bg-yellow-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <Edit3 class="w-4 h-4" />
                <span class="text-sm font-medium whitespace-nowrap">Lanjut Konsep</span>
              </div>
            </template>

            <!-- ===== KIRIM VIA EMAIL (SDE terkirim, sudah final) ===== -->
            <template
              v-if="
                isHead &&
                context === 'sent' &&
                (data.jenis === 'SDE' || data.jenis === 'sde') &&
                (data.final_pdf_url || data.final_pdf)
              "
            >
              <div
                @click="emit('kirim-email')"
                class="flex bg-indigo-600 hover:bg-indigo-700 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <Mail class="w-4 h-4" />
                <span class="text-sm font-medium whitespace-nowrap">Kirim via Email</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Motion>
  </div>

  <!-- Note Modal -->
  <UModal v-model:open="showNoteModal" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
    <template #header>
      <div class="w-full flex justify-between items-center">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-orange-100 rounded-full">
            <StickyNote class="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Catatan Surat
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Tambah atau edit catatan untuk surat ini
            </p>
          </div>
        </div>
        <button
          @click="showNoteModal = false"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </template>
    <template #body>
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Isi Catatan</label>
          <textarea
            v-model="noteText"
            rows="5"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 dark:text-white"
            placeholder="Tulis catatan Anda di sini..."
          ></textarea>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-between gap-3 w-full">
        <button
          v-if="isNoteComputed"
          @click="removeNote"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
        >
          <XCircle class="w-4 h-4" /> Hapus Catatan
        </button>
        <div class="flex gap-3 ml-auto">
          <button
            @click="showNoteModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Batal
          </button>
          <button
            @click="saveNote"
            :disabled="isSavingNote"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            <CheckCircle v-if="!isSavingNote" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            {{ isSavingNote ? 'Menyimpan...' : (isNoteComputed ? $t('k_perbarui') : $t('k_simpan')) }}
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Restore list markers — Tailwind preflight strips them, rich-text needs them.
   No !important: lets editor inline styles (list-style-type: lower-alpha etc.) win.
   Nested rules have higher specificity so lower-alpha/roman survive under a decimal ol. */
:deep(.content-html-container) ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
:deep(.content-html-container) ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
:deep(.content-html-container) ol ol { list-style-type: lower-alpha; }
:deep(.content-html-container) ol ol ol { list-style-type: lower-roman; }
:deep(.content-html-container) ul ul { list-style-type: circle; }
:deep(.content-html-container) ul ul ul { list-style-type: square; }
:deep(.content-html-container) ol[type="a"] { list-style-type: lower-latin; }
:deep(.content-html-container) ol[type="A"] { list-style-type: upper-latin; }
:deep(.content-html-container) ol[type="i"] { list-style-type: lower-roman; }
:deep(.content-html-container) ol[type="I"] { list-style-type: upper-roman; }
:deep(.content-html-container) li {
  margin: 0.25rem 0;
}
/* Force visible table borders on rich-text content (editor output has none) */
:deep(.content-html-container) table {
  border-collapse: collapse !important;
  border: 1px solid #d1d5db !important;
  width: 100% !important;
}
:deep(.content-html-container) :is(td, th) {
  border: 1px solid #d1d5db !important;
  padding: 6px 10px !important;
}
/* Override inline styles from rich text editor in dark mode */
:deep(.dark) .content-html-container :is(p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, strong, em, b, i, u, label, a, blockquote, pre, code, figcaption, caption, small, dt, dd) {
  color: #e5e7eb !important;
}
:deep(.dark) .content-html-container :is(table, thead, tbody, tfoot, tr, td, th) {
  border-color: #4b5563 !important;
}
:deep(.dark) .content-html-container th {
  background-color: #1f2937 !important;
  color: #f3f4f6 !important;
}
:deep(.dark) .content-html-container a {
  color: #60a5fa !important;
}
:deep(.dark) .content-html-container :is(pre, code, kbd, samp) {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}
:deep(.dark) .content-html-container blockquote {
  border-left-color: #4b5563 !important;
  background-color: #1f2937 !important;
}
:deep(.dark) .content-html-container hr {
  border-color: #4b5563 !important;
  background-color: #4b5563 !important;
}
:deep(.dark) .content-html-container img {
  opacity: 0.9;
}
:deep(.dark) .content-html-container mark {
  background-color: #854d0e !important;
  color: #fef3c7 !important;
}
:deep(.dark) .content-html-container [style*="background-color"] {
  background-color: transparent !important;
}
:deep(.dark) .content-html-container table [style*="background-color"],
:deep(.dark) .content-html-container th [style*="background-color"],
:deep(.dark) .content-html-container pre [style*="background-color"],
:deep(.dark) .content-html-container code [style*="background-color"] {
  background-color: inherit !important;
}
</style>
