<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { renderAsync } from 'docx-preview';
import { useNaskahLainnya } from '~/composables/useNaskahLainnya';
import type {
  ApprovalRow,
  DokumenFile,
  JenisAksi,
  NaskahDetail,
  RiwayatRow,
  StepperStep,
} from '~/types/naskah-lainnya';
import { JENIS_LABELS } from '~/types/naskah-lainnya';
import { formatNaskahDate, formatNaskahDateTime } from '~/utils/naskah-lainnya-date';
import ApprovalNoteEditor from '~/components/ApprovalNoteEditor.vue';
import TulisDigsigPassphraseModal from '~/components/Tulis/DigsigPassphraseModalAsync.vue';
import TugasQuickCreateModal from '~/components/tugas/TugasQuickCreateModal.vue';

definePageMeta({ layout: 'default', middleware: ['auth'] });
useHead({ title: 'Detail Naskah Lainnya' });

const route = useRoute();
const { t } = useI18n();
const {
  detail,
  pending,
  error,
  fetchDetail,
  uploadDokumenFinalManual,
  ubahStatusFinalManual,
  ubahNomorFinalManual,
} = useNaskahLainnya();
const { apiGet } = useApi();
const { user, isLegalRole, hasPermission } = useAuth();
const toast = useToast();
const {
  init: initRealtimeSocket,
  naskahLainnyaUpdate,
  subscribeNaskahLainnya,
  unsubscribeNaskahLainnya,
} = useRealtimeSocket();

const id = computed(() => route.params.id as string);

// Cek apakah ini child route (legal-drafting, evaluasi, tanda-tangan, dll)
// Jika ya, sembunyikan konten detail — hanya tampilkan NuxtPage (child).
const isChildRoute = computed(() => {
  const segments = route.path.split('/').filter(Boolean);
  // /naskah-lainnya/:id → 3 segments (naskah-lainnya, id)
  // /naskah-lainnya/:id/legal-drafting → 4 segments
  return segments.length > 2;
});

// Cek apakah user adalah pemrakarsa (pembuat naskah)
const isPemrakarsa = computed(() => {
  if (!detail.value || !user.value) return false;
  return detail.value.pemrakarsa?.nama === user.value.nama;
});

// Nama Pemrakarsa pada detail adalah pejabat terakhir pada approval awal.
// Identitas konseptor tetap tersedia di `pemrakarsa` untuk pengecekan akses.
const pemrakarsaDisplay = computed(
  () => detail.value?.pemrakarsaPejabat ?? detail.value?.pemrakarsa
);

// Dokumen final fisik baru dapat dikelola setelah seluruh penandatangan
// menyetujui Naskah Draft dan nomor sudah diterbitkan.
const showManualFinalPanel = computed(
  () => detail.value?.signOption === 'ttd_basah' && detail.value?.tahapan === 'selesai'
);
const isPhysicalAwaitingFinal = computed(
  () => showManualFinalPanel.value && detail.value?.manualFinalStatus !== 'final'
);
const canManageManualFinal = computed(() => Boolean(detail.value?.canManageManualFinal));
const isManualFinal = computed(() => detail.value?.manualFinalStatus === 'final');
const detailDisplayStatus = computed(() => {
  if (isPhysicalAwaitingFinal.value) return 'selesai_belum_final';
  if (showManualFinalPanel.value && isManualFinal.value) return 'selesai_final';
  return detail.value?.tahapan ?? '';
});
const manualFinalBusy = ref(false);
const manualFinalInput = ref<HTMLInputElement | null>(null);
const manualFinalNomor = ref('');
watch(
  () => detail.value?.nomor,
  (nomor) => {
    manualFinalNomor.value = nomor ?? '';
  },
  { immediate: true }
);

// ── Approval dikelompokkan per tahap (fase) — pemrakarsa & legal unit terpisah ──
const APPROVAL_TAHAP_ORDER = [
  'konsep',
  'persetujuan',
  'legal_drafting',
  'evaluasi',
  'persetujuan_lanjutan',
  'evaluasi_final',
  'persetujuan_direksi_pemrakarsa',
  'persetujuan_direksi',
  'persetujuan_direksi_ditetapkan',
  'blanko_verbal_pemrakarsa',
  'blanko_verbal',
  'blanko_verbal_ditetapkan',
  'tanda_tangan',
];
const APPROVAL_TAHAP_LABEL: Record<string, string> = {
  konsep: 'Konsep',
  persetujuan: 'Approval Pemrakarsa',
  legal_drafting: 'Approval Legal Unit',
  evaluasi: 'Evaluasi',
  persetujuan_lanjutan: 'Persetujuan Lanjutan',
  evaluasi_final: 'Evaluasi Final EVP',
  persetujuan_direksi_pemrakarsa: 'Direktur Pemrakarsa',
  persetujuan_direksi_ditetapkan: 'Ditetapkan/Disahkan Oleh',
  persetujuan_direksi: 'Diketahui Oleh',
  blanko_verbal_pemrakarsa: 'Direktur Pemrakarsa',
  blanko_verbal_ditetapkan: 'Ditetapkan/Disahkan Oleh',
  blanko_verbal: 'Diketahui Oleh',
  tanda_tangan: 'Tanda Tangan',
};
const tahapLabel = (t: string) => APPROVAL_TAHAP_LABEL[t] ?? t;
const LEGAL_EVALUATION_TAHAPS = new Set(['evaluasi', 'persetujuan_lanjutan', 'evaluasi_final']);
const LEGACY_DIGITAL_LEGAL_TAHAPS = new Set(['persetujuan_lanjutan', 'evaluasi_final']);

const approvalGroups = computed<{ tahap: string; label: string; rows: ApprovalRow[] }[]>(() => {
  const byTahap = detail.value?.approvalByTahap;
  let map: Record<string, ApprovalRow[]>;
  if (byTahap) {
    map = { ...byTahap };
    // approvalByTahap dapat dibatasi sesuai POV, sedangkan flat approval selalu
    // lengkap. Gabungkan per ID agar satu tahap yang sudah memiliki satu baris
    // (mis. Direksi) tetap menerima baris approver lainnya.
    for (const a of detail.value?.approval ?? []) {
      const rows = (map[a.tahap] ??= []);
      if (!rows.some((row) => row.id === a.id)) rows.push(a);
    }
  } else {
    // Fallback: kelompokkan flat approval client-side (sebelum BE restart).
    map = {};
    for (const a of detail.value?.approval ?? []) (map[a.tahap] ??= []).push(a);
  }
  const isDigital = ['qr_only', 'digsig'].includes(detail.value?.signOption ?? '');
  const isDigitalWithoutLegal = isDigital && !detail.value?.butuhLegal;
  const isDigitalWithLegal = isDigital && detail.value?.butuhLegal;
  const present = Object.keys(map).filter(
    (tahap) =>
      (!isDigitalWithoutLegal || !LEGAL_EVALUATION_TAHAPS.has(tahap)) &&
      (!isDigitalWithLegal || !LEGACY_DIGITAL_LEGAL_TAHAPS.has(tahap))
  );
  const ordered = APPROVAL_TAHAP_ORDER.filter((k) => present.includes(k));
  const rest = present.filter((k) => !APPROVAL_TAHAP_ORDER.includes(k));
  return [...ordered, ...rest].map((k) => ({ tahap: k, label: tahapLabel(k), rows: map[k] ?? [] }));
});

type ApprovalDisplayGroup = {
  tahap: string;
  label: string;
  rows: ApprovalRow[];
  children?: { tahap: string; label: string; rows: ApprovalRow[] }[];
};

function approvalDisplayName(approval: ApprovalRow) {
  return approval.delegateName?.trim() || approval.nama || '—';
}

function approvalDisplayPosition(approval: ApprovalRow) {
  const position = approval.jabatan?.trim() || '—';
  const status = approval.delegatePositionStatus?.trim();
  if (!approval.delegateName || !status) return position;
  return new RegExp(`^${status}\\.\\s*`, 'i').test(position) ? position : `${status}. ${position}`;
}

const approvalDisplayGroups = computed<ApprovalDisplayGroup[]>(() => {
  const byTahap = new Map(approvalGroups.value.map((group) => [group.tahap, group]));
  const used = new Set<string>();
  const groups: ApprovalDisplayGroup[] = [];

  function buildComposite(
    tahap: string,
    label: string,
    children: { tahap: string; label: string }[]
  ) {
    const presentChildren = children
      .map((child) => {
        const group = byTahap.get(child.tahap);
        return group ? { tahap: child.tahap, label: child.label, rows: group.rows } : null;
      })
      .filter(Boolean) as { tahap: string; label: string; rows: ApprovalRow[] }[];
    if (!presentChildren.length) return null;
    presentChildren.forEach((child) => used.add(child.tahap));
    return {
      tahap,
      label,
      rows: presentChildren.flatMap((child) => child.rows),
      children: presentChildren,
    };
  }

  for (const group of approvalGroups.value) {
    if (used.has(group.tahap)) continue;
    if (group.tahap.startsWith('persetujuan_direksi')) {
      const composite = buildComposite('persetujuan_direksi', 'Persetujuan Direksi', [
        { tahap: 'persetujuan_direksi_pemrakarsa', label: 'Direktur Pemrakarsa' },
        { tahap: 'persetujuan_direksi', label: 'Diketahui Oleh' },
        { tahap: 'persetujuan_direksi_ditetapkan', label: 'Ditetapkan/Disahkan Oleh' },
      ]);
      if (composite) groups.push(composite);
      continue;
    }
    if (group.tahap.startsWith('blanko_verbal')) {
      const composite = buildComposite('blanko_verbal', 'Blanko Verbal Persetujuan Direksi', [
        { tahap: 'blanko_verbal_pemrakarsa', label: 'Direktur Pemrakarsa' },
        { tahap: 'blanko_verbal', label: 'Diketahui Oleh' },
        { tahap: 'blanko_verbal_ditetapkan', label: 'Ditetapkan/Disahkan Oleh' },
      ]);
      if (composite) groups.push(composite);
      continue;
    }
    groups.push(group);
  }

  return groups;
});

// ── Langkah Verifikasi (stepper dari approval berjenjang, per fase) ──
const stepStyle = (status: string) => ({
  className:
    status === 'verified'
      ? 'bg-success-500 text-white'
      : status === 'rejected'
        ? 'bg-error-500 text-white'
        : status === 'waiting'
          ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/50'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700',
  textClass:
    status === 'verified'
      ? 'text-success-600'
      : status === 'rejected'
        ? 'text-error-600'
        : status === 'waiting'
          ? 'text-primary-700 dark:text-primary-300'
          : 'text-gray-500',
});

// POV Unit Legal: Langkah Verifikasi hanya menampilkan tahap yang relevan
// untuk legal — persetujuan direksi/blanko (ranah direksi) dan approval
// pemrakarsa (sudah selesai sebelum naskah masuk ke legal) disembunyikan.
const LEGAL_HIDDEN_TAHAPS = new Set([
  'persetujuan',
  'persetujuan_direksi_pemrakarsa',
  'persetujuan_direksi',
  'persetujuan_direksi_ditetapkan',
  'blanko_verbal_pemrakarsa',
  'blanko_verbal',
  'blanko_verbal_ditetapkan',
]);

const approvalStepGroups = computed(() => {
  const groups = approvalDisplayGroups.value.map((g) => ({
    tahap: g.tahap,
    label: g.label,
    children: (g.children?.length ? g.children : [g]).map((child) => ({
      tahap: child.tahap,
      label: child.label,
      // Approval direksi/blanko dikirim ke seluruh direksi secara bersamaan;
      // bukan rantai approval berjenjang, sehingga tidak boleh divisualkan
      // dengan nomor dan garis urutan.
      isParallel: [
        'persetujuan_direksi_pemrakarsa',
        'persetujuan_direksi_ditetapkan',
        'persetujuan_direksi',
        'blanko_verbal_pemrakarsa',
        'blanko_verbal_ditetapkan',
        'blanko_verbal',
      ].includes(child.tahap),
      steps: child.rows.map((a, index) => ({
        id: a.id || `${child.tahap}-${index}`,
        label: approvalDisplayName(a) || `Verifikator ${index + 1}`,
        jabatan: approvalDisplayPosition(a),
        status: a.status,
        num: index + 1,
        ...stepStyle(a.status),
      })),
    })),
  }));
  if (!isLegalRole.value) return groups;
  return groups
    .filter((g) => !LEGAL_HIDDEN_TAHAPS.has(g.tahap))
    .map((g) => ({
      ...g,
      children: g.children.filter((child) => !LEGAL_HIDDEN_TAHAPS.has(child.tahap)),
    }))
    .filter((g) => g.children.length > 0);
});

const approvalStatusLabel = (status: string) => {
  if (status === 'verified') return 'Disetujui';
  if (status === 'rejected') return 'Ditolak';
  if (status === 'waiting') return 'Menunggu';
  return 'Belum diproses';
};

const progressLabel = computed(() => {
  const list = detail.value?.approval ?? [];
  const verified = list.filter((a) => a.status === 'verified').length;
  const total = list.length;
  if (verified === total) return 'Verifikasi selesai';
  const waiting = list.findIndex((a) => a.status === 'waiting');
  return waiting >= 0
    ? `Verifikasi Tahap ${waiting + 1} dari ${total}`
    : `Verifikasi ${verified} dari ${total}`;
});

const isLastApprover = computed(() => {
  // Tahap-aware: hanya bandingkan baris pada tahap naskah saat ini, agar
  // approver legal & pemrakarsa sama-sama akurat (BE sort urutan ASC global →
  // baris persetujuan & legal_drafting interleaved di flat list).
  const tahapNow = detail.value?.tahapan;
  const rows = (detail.value?.approval ?? []).filter((a) => a.tahap === tahapNow);
  const waiting = rows.filter((a) => a.status === 'waiting').sort((x, y) => x.urutan - y.urutan);
  if (!waiting.length) return false;
  const active = waiting[0];
  return rows.every((a) => a.urutan <= active.urutan || a.status === 'verified');
});

const nonApprovalActions = computed(() => {
  const approvalActions = ['setuju', 'tolak', 'kembalikan'];
  return (detail.value?.availableActions ?? []).filter((a) => !approvalActions.includes(a));
});

// ── Legal drafting button conditions ──
const tahapan = computed(() => detail.value?.tahapan ?? '');
const showLegalButtons = computed(() =>
  [
    'legal_drafting',
    'tanda_tangan_pemrakarsa',
    'blanko_verbal',
    'tanda_tangan_legal',
    'tanda_tangan_pejabat',
  ].includes(tahapan.value)
);
const canMulaiLegal = computed(
  () =>
    tahapan.value === 'legal_drafting' &&
    (detail.value?.availableActions ?? []).includes('kirim-approval-legal')
);
const canTandaTangan = computed(() =>
  (detail.value?.availableActions ?? []).includes('tanda-tangan')
);
const isPhysicalSigning = computed(() => detail.value?.signOption === 'ttd_basah');
const isDigitalWithoutLegal = computed(
  () => !isPhysicalSigning.value && detail.value?.butuhLegal === false
);
// Penandatangan TERAKHIR? signingIndex 1-based >= total penandatangan.
const isLastSigner = computed(() => {
  const d = detail.value;
  if (!d) return false;
  const total = d.signerCount ?? penandatanganList.value.length;
  const idx = d.signingIndex ?? 1;
  return total > 0 && idx >= total;
});
const canBuatBlanko = computed(
  () =>
    tahapan.value === 'blanko_verbal' &&
    (detail.value?.availableActions ?? []).includes('kirim-approval-blanko')
);
const canBukaBlanko = computed(
  () =>
    tahapan.value === 'blanko_verbal' &&
    (detail.value?.availableActions ?? []).includes('buka-blanko-verbal')
);
// Buat Lembar Persetujuan Direksi: legal menyusun lembar di sub-page. Muncul saat
// evaluasi (alur normal: kirim = transisi ke PD) atau saat sudah di persetujuan_direksi
// tapi lembar belum dibuat (recovery). Gated by availableActions dari BE.
const canBuatLembarPersetujuanDireksi = computed(() =>
  (detail.value?.availableActions ?? []).includes('kirim-lembar-persetujuan-direksi')
);
const canProcessSheetApproval = computed(
  () =>
    ['blanko_verbal', 'persetujuan_direksi'].includes(tahapan.value) &&
    (detail.value?.availableActions ?? []).includes('paraf')
);

// Approver legal dengan giliran aktif (baris waiting urutan terendah = milik user).
// availableActions=[] saat ada waiting legal rows → toolbar aksi hide, jadi butuh
// jalur sendiri untuk mengarahkan approver ke workspace approval legal.
const canProsesLegalApproval = computed(() => {
  if (tahapan.value !== 'legal_drafting' || !user.value) return false;
  const rows = (detail.value?.approval ?? [])
    .filter((a) => a.tahap === 'legal_drafting' && a.status === 'waiting')
    .sort((a, b) => a.urutan - b.urutan);
  if (!rows.length) return false;
  const active = rows[0];
  const r = String(user.value?.role ?? '').toUpperCase();
  const ar = String(user.value?.activeRole?.name ?? '').toUpperCase();
  if (r === 'SUPERADMIN' || ar === 'SUPERADMIN') return true;
  const userPositionId = String(user.value?.positionId ?? user.value?.position ?? '');
  if (active.positionId) return String(active.positionId) === userPositionId;
  return !!(
    active.nama &&
    user.value.nama &&
    active.nama.trim().toLowerCase() === user.value.nama.trim().toLowerCase()
  );
});

function goToLegalApprovalWorkspace() {
  navigateTo(`/naskah-lainnya/${id.value}/legal-drafting`);
}

const actionDescription = computed(() => {
  const t = tahapan.value;
  if (t === 'persetujuan')
    return isLastApprover.value
      ? 'Setujui untuk melanjutkan ke tahap berikutnya, atau tolak naskah ini.'
      : 'Setujui untuk meneruskan ke approver berikutnya, atau tolak.';
  if (t === 'legal_drafting')
    return 'Mulai legal drafting untuk meninjau naskah, atau kembalikan ke pemrakarsa.';
  if (t === 'evaluasi')
    return canBuatLembarPersetujuanDireksi.value
      ? 'Susun lembar persetujuan direksi, lalu kirim ke para direksi untuk paraf.'
      : 'Evaluasi naskah sebelum ditandatangani.';
  if (t === 'persetujuan_lanjutan')
    return 'Lakukan legal drafting sendiri, teruskan dalam unit, atau selesaikan dan kembalikan ke EVP.';
  if (t === 'evaluasi_final') return 'Hasil persetujuan lanjutan menunggu keputusan final EVP.';
  if (t === 'persetujuan_direksi')
    return canBuatLembarPersetujuanDireksi.value
      ? 'Susun lembar persetujuan direksi, lalu kirim ke para direksi untuk paraf.'
      : 'Menunggu paraf direksi.';
  if (t === 'tanda_tangan_pemrakarsa') return 'Tanda tangani naskah untuk melanjutkan.';
  if (t === 'blanko_verbal')
    return 'Selesaikan Diketahui Oleh terlebih dahulu, kemudian Ditetapkan/Disahkan Oleh.';
  if (t === 'tanda_tangan_legal') return 'Tanda tangani naskah sebagai legal.';
  if (t === 'tanda_tangan_pejabat') return 'Tanda tangani naskah sebagai pejabat.';
  if (t === 'tanda_tangan')
    return detail.value?.signOption === 'ttd_basah'
      ? 'Tinjau dan setujui Naskah Draft sebagai penandatangan aktif.'
      : isDigitalWithoutLegal.value
        ? 'Tanda tangani naskah, atau tolak untuk membatalkan dan mengembalikannya kepada pemrakarsa.'
        : 'Tanda tangani naskah sebagai penandatangan aktif.';
  if (t === 'konsep') return 'Kirim naskah untuk persetujuan.';
  if (t === 'perlu_perbaikan') return 'Revisi naskah, lalu kirim ulang untuk persetujuan.';
  return 'Pilih aksi yang tersedia.';
});

// ── Toggle expand timeline ──
const timelineExpanded = ref(false);

// ── Collapse catatan panjang di timeline riwayat ("Lihat selengkapnya") ──
// Catatan approval bisa memuat pasal/batang tubuh yang panjang; di kolom
// timeline yang sempit, konten penuh membuat item timeline jadi sangat tinggi.
// Solusi: konten di-clamp (max-height + fade), tombol "Lihat selengkapnya"
// muncul hanya jika konten benar-benar melebihi batas (dideteksi via pengukuran
// DOM setelah render, akurat terhadap lebar kolom saat itu).
const TIMELINE_NOTE_CLAMP_PX = 72; // tinggi maksimum konten catatan saat ter-clamp (±4,5 baris text-xs)
const expandedTimelineNotes = ref<Set<string>>(new Set());
const longTimelineNotes = ref<Set<string>>(new Set());

const isRejectTimelineAction = (action: string) =>
  action.toLowerCase() === 'tolak' || action.toLowerCase().startsWith('kembalikan');

const toggleTimelineNote = (id: string) => {
  const next = new Set(expandedTimelineNotes.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedTimelineNotes.value = next;
};

/** Ukur tinggi konten tiap catatan timeline; tandai yang melebihi clamp. */
const measureTimelineNotes = async () => {
  await nextTick();
  const container = document.querySelector('[data-timeline-notes]');
  if (!container) return;
  const next = new Set<string>();
  container.querySelectorAll<HTMLElement>('[data-note-id]').forEach((el) => {
    const id = el.dataset.noteId;
    if (!id) return;
    // Ukur tinggi natural konten (tanpa clamp) — reset sementara lalu kembalikan.
    const prevMax = el.style.maxHeight;
    const prevOverflow = el.style.overflow;
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';
    const natural = el.scrollHeight;
    el.style.maxHeight = prevMax;
    el.style.overflow = prevOverflow;
    if (natural > TIMELINE_NOTE_CLAMP_PX + 8) next.add(id);
  });
  longTimelineNotes.value = next;
};

const workflowExpanded = ref(false);
const verificationExpanded = ref(false);
const approvalExpanded = ref(false);
const informationExpanded = ref(false);
const documentExpanded = ref(false);
const signerExpanded = ref(false);

// ── Modal Setuju/Tolak (standarisasi ApprovalNoteEditor) ──
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const showReturnModal = ref(false);
const savingAction = ref(false);
const pendingAction = ref<JenisAksi | null>(null);
// ── Pilihan metode TTD signer TERAKHIR (QR internal vs TTE BSrE) —
//    komponen sama dengan naskah umum: Tulis/DigsigPassphraseModal ──
const showSignMethodModal = ref(false);
const signingBusy = ref(false);
const activeTteMode = ref<'bsre_direct' | 'portal'>('bsre_direct');
const { getTteMode } = useTtePortal();
const signMethodModalRef = ref<{ setPassphraseError: (msg: string) => void } | null>(null);
// Info penandatangan aktif untuk modal (pola nota-dinas: signerInfo)
const signerInfo = computed(() => {
  const d = detail.value;
  const idx = d?.signingIndex ?? 1;
  const chain = d?.penandatangan ?? [];
  const current = chain[idx - 1] ?? ({} as any);
  return {
    name: current?.nama ?? d?.pemrakarsa?.nama ?? 'Penandatangan',
    role: current?.jabatan ?? d?.pemrakarsa?.jabatan ?? '',
    label: 'Ditandatangani secara digital',
  };
});
// Nomor bersih untuk tampilan: sembunyikan placeholder mentah {{...}} (legacy scrape
// pra-Task-8 menangkap {{nomor}} dari template docx dan menyimpannya sebagai nomor).
// Konsumen beri fallback masing-masing ('—' untuk info row, 'Detail' untuk breadcrumb).
const nomorClean = computed(() => {
  const n = detail.value?.nomor;
  return n && !/\{\{[^}]*\}\}/.test(n) ? n : '';
});
const showTugasQuickCreate = ref(false);
const canQuickCreateTugas = computed(
  () => hasPermission('tugas', 'create-task') && Boolean(detail.value)
);
const tugasReferenceLabel = computed(() =>
  [nomorClean.value, detail.value?.perihal || 'Naskah Lainnya'].filter(Boolean).join(' — ')
);

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: '#' },
]);

let realtimeRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeRefreshRunning = false;
let realtimeRefreshQueued = false;

async function refreshDetailFromRealtime() {
  if (realtimeRefreshRunning) {
    realtimeRefreshQueued = true;
    return;
  }
  realtimeRefreshRunning = true;
  try {
    await fetchDetail(id.value, { silent: true });
  } catch (err) {
    console.warn('[NaskahLainnyaDetail] Realtime refresh gagal:', err);
  } finally {
    realtimeRefreshRunning = false;
    if (realtimeRefreshQueued) {
      realtimeRefreshQueued = false;
      scheduleRealtimeRefresh();
    }
  }
}

function scheduleRealtimeRefresh() {
  if (realtimeRefreshTimer) clearTimeout(realtimeRefreshTimer);
  realtimeRefreshTimer = setTimeout(() => {
    realtimeRefreshTimer = null;
    void refreshDetailFromRealtime();
  }, 200);
}

watch(naskahLainnyaUpdate, (update) => {
  if (update?.naskahId === id.value) scheduleRealtimeRefresh();
});

onMounted(async () => {
  subscribeNaskahLainnya(id.value);
  await initRealtimeSocket();
  await fetchDetail(id.value);
});

onBeforeUnmount(() => {
  if (realtimeRefreshTimer) clearTimeout(realtimeRefreshTimer);
  unsubscribeNaskahLainnya(id.value);
});

const errorMessage = computed(
  () => (error.value as any)?.response?.data?.message ?? 'Gagal memuat naskah.'
);

// ── Format helpers ──
function fmtDate(iso: string | null | undefined) {
  return formatNaskahDate(iso);
}

function fmtDateTime(iso: string | null | undefined) {
  return formatNaskahDateTime(iso);
}

// ── Persona meta (jabatan · pos · persnum), fallback '—' ──
function personaMeta(p: { positionId?: string; persnum?: number; jabatan?: string }) {
  return p.jabatan || '—';
}

// ── Penandatangan list (BE baru mengirim array; fallback ke single object) ──
const penandatanganList = computed(() => {
  if (!detail.value) return [];
  // BE return `penandatangan` sebagai array
  const p = detail.value.penandatangan;
  if (Array.isArray(p) && p.length) return p;
  // Fallback: single object
  if (p && !Array.isArray(p) && p.nama) return [p];
  return [];
});

// ── Status per penandatangan (flow baru: signingIndex 1-based; selesai → semua signed).
// 'idle' = di luar fase tanda tangan / flow legacy (tahapan tanda_tangan_*) — status per
// signer tidak bisa diturunkan dengan pasti, jadi tidak ditampilkan chip apapun.
type SignerStatus = 'signed' | 'current' | 'waiting' | 'idle';
function signerStatus(i: number): SignerStatus {
  const d = detail.value;
  if (!d) return 'idle';
  if (d.tahapan === 'selesai') return 'signed';
  if (d.tahapan === 'tanda_tangan' && d.signingIndex != null) {
    if (i + 1 < d.signingIndex) return 'signed';
    if (i + 1 === d.signingIndex) return 'current';
    return 'waiting';
  }
  return 'idle';
}

const signedCount = computed(
  () => penandatanganList.value.filter((_, i) => signerStatus(i) === 'signed').length
);

// ── Ikon & warna kartu dokumen berdasar tipe/ekstensi file ──
function fileMeta(d: DokumenFile) {
  const nama = displayDocumentName(d);
  if (nama.toLowerCase().endsWith('.docx')) {
    return {
      icon: 'i-lucide-file-text',
      iconClass: 'text-blue-600 dark:text-blue-400',
      ext: 'DOCX',
    };
  }
  const ext = (nama.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf')
    return { icon: 'i-lucide-file-text', iconClass: 'text-red-500 dark:text-red-400', ext: 'PDF' };
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext))
    return {
      icon: 'i-lucide-image',
      iconClass: 'text-violet-500 dark:text-violet-400',
      ext: ext.toUpperCase(),
    };
  return {
    icon: 'i-lucide-file',
    iconClass: 'text-gray-400 dark:text-gray-500',
    ext: ext ? ext.toUpperCase() : 'FILE',
  };
}

function displayDocumentName(d: DokumenFile): string {
  return d.hasPdfPreview && d.previewNama ? d.previewNama : d.nama;
}

// ── Dokumen tabs ──
const dokumenTab = ref(0);
const dokumenTabs = [
  { label: 'Naskah', icon: 'i-lucide-file-text' },
  { label: 'Blanko Verbal/ Persetujuan Direksi', icon: 'i-lucide-file-check' },
  { label: 'Dok. Pendukung', icon: 'i-lucide-paperclip' },
];

const dokumenTerkait = computed<DokumenFile[]>(() => {
  if (!detail.value) return [];
  const all = detail.value.dokumen;
  if (!Array.isArray(all)) return [];
  const t = dokumenTab.value;
  const tipe = [
    ['naskah', 'naskah_fisik'],
    ['blanko_verbal', 'blanko_verbal_pdf', 'lembar_persetujuan_direksi_pdf'],
    'pendukung',
  ][t];
  const filtered = all.filter((d) =>
    Array.isArray(tipe) ? tipe.includes(d.tipe) : d.tipe === tipe
  );
  // Dokumen final adalah artefak utama yang harus langsung terlihat. Sisanya
  // tetap diurutkan berdasarkan pembaruan terbaru di bawahnya.
  return filtered.sort((a, b) => {
    const rank = (d: DokumenFile) => (['final', 'dittd'].includes(d.status) ? 0 : 1);
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.tanggal ?? 0).getTime() - new Date(a.tanggal ?? 0).getTime();
  });
});

// Bangun URL proxy file naskah dari BE (`/naskah-lainnya/:id/file`).
// `fileUrl` dari BE adalah path proxy relatif. Fallback: bangun manual bila kosong.
function buildFileUrl(preview = false): string {
  const id_ = detail.value?.id || (route.params.id as string);
  const fu = detail.value?.fileUrl;
  const base = fu || `/naskah-lainnya/${id_}/file`;
  return preview ? `${base}${base.includes('?') ? '&' : '?'}preview=1` : base;
}

async function fetchFileBlob(preview = false): Promise<{ blob: Blob; filename: string } | null> {
  const url = buildFileUrl(preview);
  try {
    const blob = await apiGet(url, { responseType: 'blob' });
    const nama =
      detail.value?.dokumen.find((d) => d.tipe === 'naskah')?.nama || naskahFileName(detail.value);
    return { blob, filename: nama };
  } catch {
    return null;
  }
}

// ── Preview dokumen (modal popup) ──
// PDF → iframe; DOCX → renderAsync (docx-preview) ke container; lainnya → tab baru.
const previewOpen = ref(false);
const previewUrl = ref<string | null>(null);
const previewDocxBuffer = ref<ArrayBuffer | null>(null);
const previewDocxContainer = ref<HTMLElement | null>(null);
const previewLoading = ref(false);

async function renderDocxPreview() {
  if (!previewDocxBuffer.value || !previewDocxContainer.value) return;
  previewDocxContainer.value.innerHTML = '';
  await renderAsync(previewDocxBuffer.value, previewDocxContainer.value, undefined, {
    className: 'docx',
    inWrapper: true,
    ignoreWidth: false,
    ignoreHeight: false,
    breakPages: true,
  });
}

// Buka popup preview dari blob sesuai tipe file.
async function openPreviewFromBlob(blob: Blob, nama: string) {
  const lower = nama.toLowerCase();
  const isPdf = lower.endsWith('.pdf') || blob.type === 'application/pdf';
  const isDocx =
    lower.endsWith('.docx') ||
    blob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  // reset state sebelumnya
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  previewDocxBuffer.value = null;
  if (isPdf) {
    // Re-wrap sebagai application/pdf → viewer bawaan browser (Chromium PDFium)
    // merender toolbar download/print/zoom, sama seperti pratinjau kotak masuk.
    const pdf = new Blob([await blob.arrayBuffer()], { type: 'application/pdf' });
    previewUrl.value = window.URL.createObjectURL(pdf);
    previewOpen.value = true;
  } else if (isDocx) {
    previewDocxBuffer.value = await blob.arrayBuffer();
    previewOpen.value = true;
    await nextTick();
    await renderDocxPreview();
  } else {
    // jenis lain (gambar/dll) — tidak bisa dipratinjau inline, buka tab baru
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  }
}

async function preview(d: DokumenFile) {
  previewLoading.value = true;
  try {
    let blob: Blob;
    if (d.tipe === 'naskah') {
      const res = await fetchFileBlob(true);
      if (!res) {
        toast.add({ title: 'Gagal memuat pratinjau', color: 'error' });
        return;
      }
      blob = res.blob;
    } else {
      // pendukung / naskah_fisik / blanko — download via BE proxy
      const id_ = detail.value?.id;
      blob = await apiGet(`/naskah-lainnya/${id_}/dokumen/${d.id}/download?inline=1`, {
        responseType: 'blob',
      });
    }
    await openPreviewFromBlob(blob, d.nama);
  } catch {
    toast.add({ title: 'Gagal memuat pratinjau', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
}

function closePreview() {
  previewOpen.value = false;
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  previewDocxBuffer.value = null;
}

// Tutup via overlay/backdrop juga harus revoke + bersihkan state.
watch(previewOpen, (open) => {
  if (!open) closePreview();
});

async function download(d) {
  try {
    let blob;
    if (d.tipe === 'naskah') {
      const res = await fetchFileBlob();
      if (!res) {
        toast.add({ title: 'Gagal mengunduh', color: 'error' });
        return;
      }
      const blobUrl = window.URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    } else {
      const id_ = detail.value?.id;
      const { apiGet } = useApi();
      blob = await apiGet(`/naskah-lainnya/${id_}/dokumen/${d.id}/download`, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = d.nama;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    }
  } catch {
    toast.add({ title: 'Gagal mengunduh', color: 'error' });
  }
}

function openManualFinalPicker() {
  if (!canManageManualFinal.value || manualFinalBusy.value) return;
  manualFinalInput.value?.click();
}

async function onManualFinalFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  manualFinalBusy.value = true;
  try {
    await uploadDokumenFinalManual(id.value, file);
    toast.add({
      title: 'Dokumen final berhasil diunggah',
      description: 'Status manual otomatis diubah menjadi Manual Final.',
      color: 'success',
      icon: 'i-lucide-circle-check',
    });
  } catch (e: any) {
    const message = e?.response?.data?.message ?? 'Gagal mengunggah dokumen final.';
    toast.add({ title: 'Unggah gagal', description: message, color: 'error' });
  } finally {
    manualFinalBusy.value = false;
    input.value = '';
  }
}

async function setManualFinalStatus(final: boolean) {
  if (!canManageManualFinal.value || manualFinalBusy.value) return;
  if (final === isManualFinal.value) return;
  manualFinalBusy.value = true;
  try {
    await ubahStatusFinalManual(id.value, final);
    toast.add({
      title: final ? 'Status diubah menjadi Manual Final' : 'Status diubah menjadi Belum Final',
      color: 'success',
    });
  } catch (e: any) {
    const message = e?.response?.data?.message ?? 'Gagal mengubah status manual.';
    toast.add({ title: 'Perubahan status gagal', description: message, color: 'error' });
  } finally {
    manualFinalBusy.value = false;
  }
}

async function saveManualFinalNomor() {
  if (!canManageManualFinal.value || manualFinalBusy.value) return;
  const nomor = manualFinalNomor.value.trim();
  if (!nomor) {
    toast.add({ title: 'Nomor naskah wajib diisi', color: 'warning' });
    return;
  }
  manualFinalBusy.value = true;
  try {
    await ubahNomorFinalManual(id.value, nomor);
    toast.add({ title: 'Nomor naskah fisik diperbarui', color: 'success' });
  } catch (e: any) {
    const message = e?.response?.data?.message ?? 'Gagal mengubah nomor naskah.';
    toast.add({ title: 'Perubahan nomor gagal', description: message, color: 'error' });
  } finally {
    manualFinalBusy.value = false;
  }
}

// ── Aksi per-versi naskah (timeline) — pakai endpoint per dokumenId (tipe-agnostic). ──
async function lihatVersi(dokumenId: string) {
  const id_ = detail.value?.id;
  previewLoading.value = true;
  try {
    const blob = await apiGet(`/naskah-lainnya/${id_}/dokumen/${dokumenId}/download`, {
      params: { inline: '1' },
      responseType: 'blob',
    });
    const d = detail.value?.dokumen.find((x) => x.id === dokumenId);
    await openPreviewFromBlob(blob as Blob, d?.nama ?? 'dokumen.docx');
  } catch {
    toast.add({ title: 'Gagal memuat pratinjau', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
}

async function unduhVersi(dokumenId: string) {
  const id_ = detail.value?.id;
  try {
    const { apiGet } = useApi();
    const d = detail.value?.dokumen.find((x) => x.id === dokumenId);
    const isFinal = d?.status === 'final' || d?.status === 'dittd';
    const blob = await apiGet(`/naskah-lainnya/${id_}/dokumen/${dokumenId}/download`, {
      params: isFinal ? { inline: '1' } : undefined,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(blob as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isFinal
      ? d?.previewNama || naskahFileName(detail.value, 'pdf')
      : d?.nama || 'naskah.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  } catch {
    toast.add({ title: 'Gagal mengunduh', color: 'error' });
  }
}

// ── Action metadata ──
const ACTION_META: Record<
  JenisAksi,
  {
    label: string;
    icon: string;
    color: 'primary' | 'success' | 'error' | 'warning' | 'neutral';
    to?: string | ((id: string) => string);
    variant?: 'approve' | 'reject' | 'return';
  }
> = {
  kirim: { label: 'Kirim untuk Approval', icon: 'i-lucide-send', color: 'primary' },
  edit: {
    label: 'Edit Naskah',
    icon: 'i-lucide-pencil',
    color: 'neutral',
    to: '/naskah-lainnya/tulis',
  },
  setuju: {
    label: 'Setujui',
    icon: 'i-lucide-check',
    color: 'success',
    to: (id: string) => `/naskah-lainnya/${id}/persetujuan`,
  },
  tolak: { label: 'Tolak', icon: 'i-lucide-x', color: 'error', variant: 'reject' },
  kembalikan: { label: 'Kembalikan', icon: 'i-lucide-undo-2', color: 'warning', variant: 'return' },
  'mulai-legal': {
    label: 'Mulai Legal Drafting',
    icon: 'i-lucide-file-pen',
    color: 'primary',
    to: (id: string) => `/naskah-lainnya/${id}/legal-drafting`,
  },
  'kirim-approval-legal': {
    label: 'Kirim Approval Legal',
    icon: 'i-lucide-send',
    color: 'primary',
    to: (id: string) => `/naskah-lainnya/${id}/legal-drafting`,
  },
  'kembalikan-legal': {
    label: 'Kembalikan ke Pemrakarsa',
    icon: 'i-lucide-undo-2',
    color: 'error',
    variant: 'return',
  },
  evaluasi: { label: 'Evaluasi', icon: 'i-lucide-clipboard-check', color: 'primary' },
  'kembalikan-evaluasi': {
    label: 'Kembalikan ke Legal',
    icon: 'i-lucide-undo-2',
    color: 'warning',
    variant: 'return',
  },
  'lanjut-persetujuan': {
    label: 'Evaluasi',
    icon: 'i-lucide-clipboard-check',
    color: 'primary',
  },
  'legal-drafting-ulang': {
    label: 'Legal Drafting Ulang',
    icon: 'i-lucide-rotate-ccw',
    color: 'warning',
  },
  'batalkan-evaluasi': { label: 'Batalkan Naskah', icon: 'i-lucide-ban', color: 'error' },
  'teruskan-persetujuan': {
    label: 'Proses Persetujuan Lanjutan',
    icon: 'i-lucide-forward',
    color: 'primary',
    to: (id: string) => `/naskah-lainnya/${id}/evaluasi`,
  },
  'selesai-persetujuan': {
    label: 'Proses Persetujuan Lanjutan',
    icon: 'i-lucide-check-check',
    color: 'success',
    to: (id: string) => `/naskah-lainnya/${id}/evaluasi`,
  },
  'simpan-blanko': {
    label: 'Buat Lembar Persetujuan',
    icon: 'i-lucide-file-check',
    color: 'primary',
    to: (id: string) => `/naskah-lainnya/${id}/blanko-verbal`,
  },
  'kirim-approval-blanko': {
    label: 'Kirim untuk Disetujui',
    icon: 'i-lucide-send',
    color: 'primary',
    to: (id: string) => `/naskah-lainnya/${id}/blanko-verbal`,
  },
  'buka-blanko-verbal': {
    label: 'Lihat Progres Persetujuan',
    icon: 'i-lucide-file-search',
    color: 'primary',
    to: (id: string) => `/naskah-lainnya/${id}/blanko-verbal`,
  },
  paraf: {
    label: 'Setujui',
    icon: 'i-lucide-file-check-2',
    color: 'primary',
    to: (id: string) => `/naskah-lainnya/${id}/persetujuan-direksi`,
  },
  'tanda-tangan': {
    label: 'Tanda Tangani',
    icon: 'i-lucide-pen-tool',
    color: 'primary',
  },
  'tolak-tanda-tangan': {
    label: 'Tolak ke Unit Legal',
    icon: 'i-lucide-undo-2',
    color: 'error',
    variant: 'reject',
  },
};

const actionLabel = (a: JenisAksi) =>
  a === 'tolak-tanda-tangan' && isPhysicalSigning.value
    ? 'Tolak ke Pemrakarsa'
    : (ACTION_META[a]?.label ?? a);
const actionIcon = (a: JenisAksi) => ACTION_META[a]?.icon ?? 'i-lucide-arrow-right';
const actionColor = (a: JenisAksi) => ACTION_META[a]?.color ?? 'primary';
const actionTo = (a: JenisAksi) => {
  const t = ACTION_META[a]?.to;
  return typeof t === 'function' ? t(route.params.id as string) : (t ?? undefined);
};

// ── Action execution ──
// Baris approval aktif (giliran berjenjang): waiting urutan terendah pada tahap
// naskah saat ini. Dipakai setuju/tolak persetujuan maupun legal_drafting.
function activeApprovalRow() {
  const tahapNow = detail.value?.tahapan;
  const tahaps =
    tahapNow === 'persetujuan_direksi'
      ? ['persetujuan_direksi_pemrakarsa', 'persetujuan_direksi', 'persetujuan_direksi_ditetapkan']
      : tahapNow === 'blanko_verbal'
        ? ['blanko_verbal_pemrakarsa', 'blanko_verbal', 'blanko_verbal_ditetapkan']
        : [tahapNow];
  return detail.value?.approval
    .filter((ap) => ap.status === 'waiting' && tahaps.includes(ap.tahap))
    .sort((x, y) => x.urutan - y.urutan)[0];
}

async function openActionModal(a: JenisAksi) {
  const meta = ACTION_META[a];
  if (!meta) return;
  if (meta.to) {
    navigateTo(actionTo(a) as string);
    return;
  }
  // Signer TERAKHIR dengan opsi digital → langsung modal pilihan metode
  // (komponen sama dengan naskah umum: Tulis/DigsigPassphraseModal).
  if (a === 'tanda-tangan' && isLastSigner.value && !isPhysicalSigning.value) {
    try {
      activeTteMode.value = await getTteMode(detail.value?.jenis || 'NL');
    } catch {
      toastError(
        'Konfigurasi TTE tidak dapat dibaca',
        'Silakan coba lagi. Metode tanda tangan tidak dibuka untuk mencegah passphrase terkirim ke jalur yang salah.'
      );
      return;
    }
    showSignMethodModal.value = true;
    return;
  }
  pendingAction.value = a;
  if (a === 'setuju' || a === 'paraf' || a === 'tanda-tangan') {
    showApproveModal.value = true;
  } else if (a === 'tolak' || a === 'tolak-tanda-tangan') {
    showRejectModal.value = true;
  } else if (a === 'kembalikan' || a === 'kembalikan-legal' || a === 'kembalikan-evaluasi') {
    showReturnModal.value = true;
  } else if (a === 'kirim') {
    showApproveModal.value = true;
  } else if (a === 'evaluasi') {
    showApproveModal.value = true;
  }
}

function buildSheetActionPayload() {
  const rows = detail.value?.approval ?? [];
  const directorPayload = (tahap: string) =>
    rows
      .filter((row) => row.tahap === tahap)
      .map((row) => ({
        nama: row.nama,
        jabatan: row.jabatan,
        positionId: row.positionId,
        persnum: row.persnum,
      }));
  const tahapan = detail.value?.tahapan;
  return {
    tanggal: detail.value?.tanggal,
    nomor: detail.value?.nomor,
    diusulkanOleh: detail.value?.pemrakarsa?.nama,
    jabatanDiusulkan: detail.value?.pemrakarsa?.jabatan,
    perihal: detail.value?.perihal,
    klasifikasi: detail.value?.klasifikasi,
    lampiran: '1 (satu) berkas',
    ditetapkanOleh: directorPayload(
      tahapan === 'blanko_verbal' ? 'blanko_verbal_ditetapkan' : 'persetujuan_direksi_ditetapkan'
    ),
    direkturPemrakarsa: directorPayload(
      tahapan === 'blanko_verbal' ? 'blanko_verbal_pemrakarsa' : 'persetujuan_direksi_pemrakarsa'
    ),
    diketahuiOleh: directorPayload(
      tahapan === 'blanko_verbal' ? 'blanko_verbal' : 'persetujuan_direksi'
    ),
  };
}

async function handleApprove(catatan: string) {
  const a = pendingAction.value;
  if (!a) return;
  const naskahId = id.value;
  savingAction.value = true;
  try {
    const nl = useNaskahLainnya();
    if (a === 'paraf') {
      if (detail.value?.tahapan === 'persetujuan_direksi') {
        await nl.parafLembarPersetujuanDireksi(
          naskahId,
          buildSheetActionPayload(),
          catatan || undefined
        );
      } else if (detail.value?.tahapan === 'blanko_verbal') {
        await nl.parafBlankoVerbal(naskahId, buildSheetActionPayload(), catatan || undefined);
      }
    } else if (a === 'setuju') {
      const approval = activeApprovalRow();
      if (approval) await nl.setuju(naskahId, approval.id, catatan || undefined);
    } else if (a === 'kirim') {
      await nl.kirim(naskahId);
    } else if (a === 'evaluasi') {
      await nl.evaluasi(naskahId, { sesuai: true, checklist: [], catatan: catatan || undefined });
    } else if (a === 'tanda-tangan') {
      // Signer terakhir ditangani openActionModal (langsung modal pilihan metode).
      // Cabang ini hanya untuk signer 1..N-1 (alur visualisasi internal lama).
      await nl.tandaTangan(naskahId, { catatan: catatan || undefined });
    }
    toast.add({ title: 'Berhasil', description: `${actionLabel(a)} berhasil`, color: 'success' });
    showApproveModal.value = false;
    await fetchDetail(naskahId);
    if (
      a === 'tanda-tangan' &&
      detail.value?.tahapan === 'selesai' &&
      !isPhysicalAwaitingFinal.value
    ) {
      await navigateTo(`/naskah-lainnya/${naskahId}/selesai`);
    }
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err?.response?.data?.message ?? err?.message ?? 'Terjadi kesalahan',
      color: 'error',
    });
  } finally {
    savingAction.value = false;
    pendingAction.value = null;
  }
}

// ── Submit dari TulisDigsigPassphraseModal (pola nota-dinas handleSignMethodSubmit) ──
async function handleSignMethodSubmit(data: { method: string; passphrase?: string }) {
  const naskahId = id.value;
  signingBusy.value = true;
  try {
    const nl = useNaskahLainnya();
    if (data.method === 'digsig') {
      // Cek jalur TTE (konfigurasi admin): portal → BE buat signing request
      // dan kembalikan signing_url; passphrase diinput di halaman Portal TTE.
      const tteMode = activeTteMode.value;

      const res = await nl.tandaTangan(naskahId, {
        signMethod: 'digsig',
        passphrase: tteMode === 'portal' ? undefined : data.passphrase || '',
      });

      // Alur Portal TTE: redirect browser ke signing_url
      const redirect = (res as any)?.tte_redirect ?? (res as any)?.data?.tte_redirect;
      if (redirect?.signingUrl) {
        showSignMethodModal.value = false;
        toast.add({
          title: 'Lanjut ke Portal TTE',
          description: 'Selesaikan tanda tangan elektronik di halaman Portal TTE.',
          color: 'info',
        });
        window.location.href = redirect.signingUrl;
        return;
      }

      toast.add({
        title: 'Berhasil',
        description: 'Naskah ditandatangani dengan TTE BSrE',
        color: 'success',
      });
    } else {
      // qr_only — visualisasi internal (alur lama)
      await nl.tandaTangan(naskahId);
      toast.add({ title: 'Berhasil', description: 'Tanda tangani berhasil', color: 'success' });
    }
    showSignMethodModal.value = false;
    await fetchDetail(naskahId);
    if (detail.value?.tahapan === 'selesai') {
      await navigateTo(`/naskah-lainnya/${naskahId}/selesai`);
    }
  } catch (err: any) {
    const rawMsg = err?.response?.data?.message ?? err?.message ?? '';
    const msg = Array.isArray(rawMsg) ? String(rawMsg[0]) : String(rawMsg);
    // Passphrase salah → tetap buka modal, tampilkan error inline (pola nota-dinas)
    if (
      data.method === 'digsig' &&
      (msg.toLowerCase().includes('passphrase') || msg.toLowerCase().includes('salah'))
    ) {
      signMethodModalRef.value?.setPassphraseError(msg);
    } else {
      toast.add({ title: 'Gagal', description: msg || 'Terjadi kesalahan', color: 'error' });
    }
  } finally {
    signingBusy.value = false;
    pendingAction.value = null;
  }
}

async function handleReject(catatan: string) {
  const a = pendingAction.value;
  if (!a) return;
  const naskahId = id.value;
  savingAction.value = true;
  try {
    const nl = useNaskahLainnya();
    if (a === 'tolak-tanda-tangan') {
      await nl.tolakTandaTangan(naskahId, catatan);
    } else if (a === 'tolak' && detail.value?.tahapan === 'persetujuan_direksi') {
      await nl.tolakLembarPersetujuanDireksi(naskahId, catatan);
    } else if (a === 'tolak' && detail.value?.tahapan === 'blanko_verbal') {
      await nl.tolakBlankoVerbal(naskahId, catatan);
    } else if (a === 'tolak') {
      const approval = activeApprovalRow();
      if (approval) await nl.tolak(naskahId, approval.id, catatan);
    } else if (a === 'evaluasi') {
      await nl.evaluasi(naskahId, { sesuai: false, checklist: [], catatan: catatan || undefined });
    }
    toast.add({ title: 'Berhasil', description: `${actionLabel(a)} berhasil`, color: 'success' });
    showRejectModal.value = false;
    await fetchDetail(naskahId);
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err?.response?.data?.message ?? err?.message ?? 'Terjadi kesalahan',
      color: 'error',
    });
  } finally {
    savingAction.value = false;
    pendingAction.value = null;
  }
}

async function handleReturn(catatan: string) {
  const a = pendingAction.value;
  if (!a) return;
  const naskahId = id.value;
  savingAction.value = true;
  try {
    const nl = useNaskahLainnya();
    if (a === 'kembalikan') {
      const approval = activeApprovalRow();
      if (approval) await nl.kembalikan(naskahId, approval.id, catatan);
    } else if (a === 'kembalikan-legal') {
      await nl.kembalikanLegal(naskahId, catatan);
    } else if (a === 'kembalikan-evaluasi') {
      await nl.kembalikanEvaluasi(naskahId, catatan);
    }
    toast.add({ title: 'Berhasil', description: `${actionLabel(a)} berhasil`, color: 'success' });
    showReturnModal.value = false;
    await fetchDetail(naskahId);
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err?.response?.data?.message ?? err?.message ?? 'Terjadi kesalahan',
      color: 'error',
    });
  } finally {
    savingAction.value = false;
    pendingAction.value = null;
  }
}

// ── Timeline entries from riwayat ──
interface TimelineEntry {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  jabatan?: string;
  action: string;
  actionColor: string;
  timestamp: string;
  catatan?: string | null;
}

const timelineEntries = computed<TimelineEntry[]>(() => {
  if (!detail.value?.riwayat) return [];
  return detail.value.riwayat
    .map((r: RiwayatRow) => {
      const isPositive =
        r.aksi === 'kirim' ||
        r.aksi === 'setuju' ||
        r.aksi === 'tanda-tangan' ||
        r.aksi === 'evaluasi';
      const isNegative =
        r.aksi === 'tolak' ||
        r.aksi === 'kembalikan' ||
        r.aksi === 'kembalikan-legal' ||
        r.aksi === 'kembalikan-evaluasi' ||
        r.aksi === 'legal_drafting_ulang';
      return {
        id: r.id,
        icon: isPositive ? 'i-lucide-check' : isNegative ? 'i-lucide-x' : 'i-lucide-circle',
        iconBg: isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-primary-500',
        title: r.aktor,
        jabatan: r.jabatan,
        action: r.aksi.charAt(0).toUpperCase() + r.aksi.slice(1),
        actionColor: isPositive
          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : isNegative
            ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
        timestamp: r.tanggal,
        catatan: r.catatan,
      };
    })
    .reverse();
});

// Deteksi catatan panjang setelah timeline dirender (dan saat timeline dibuka).
watch([timelineEntries, timelineExpanded], () => {
  longTimelineNotes.value = new Set();
  if (timelineExpanded.value) measureTimelineNotes();
});

// ── Next action info (status terkini) ──
const nextActionInfo = computed(() => {
  if (!detail.value) return null;
  const tahapan = detail.value.tahapan;
  if (tahapan === 'selesai') {
    if (detail.value.signOption === 'ttd_basah' && detail.value.manualFinalStatus !== 'final') {
      return {
        label: 'Proses verifikasi selesai. Menunggu dokumen final dari pemrakarsa.',
        oleh: '',
        jabatan: '',
      };
    }
    return { label: 'Naskah selesai', oleh: '', jabatan: '' };
  }
  if (tahapan === 'ditolak') return { label: 'Naskah ditolak', oleh: '', jabatan: '' };
  if (tahapan === 'dibatalkan') return { label: 'Naskah dibatalkan', oleh: '', jabatan: '' };

  const waitingApproval = detail.value.approval.find((a) => a.status === 'waiting');
  if (waitingApproval && tahapan === 'persetujuan') {
    return {
      label: `Menunggu persetujuan dari ${waitingApproval.nama}`,
      oleh: waitingApproval.nama,
      jabatan: waitingApproval.jabatan,
    };
  }

  const tahapanLabels: Record<string, string> = {
    konsep: 'Naskah dalam konsep (draft)',
    persetujuan: 'Menunggu persetujuan',
    legal_drafting: 'Legal drafting sedang berjalan',
    evaluasi: 'Menunggu evaluasi',
    persetujuan_lanjutan: 'Persetujuan lanjutan sedang berjalan',
    evaluasi_final: 'Menunggu keputusan final EVP',
    persetujuan_direksi: 'Menunggu persetujuan direksi',
    tanda_tangan_pemrakarsa: 'Menunggu tanda tangan pemrakarsa',
    blanko_verbal: 'Pembuatan blanko verbal',
    tanda_tangan_legal: 'Menunggu tanda tangan legal',
    tanda_tangan_pejabat: 'Menunggu tanda tangan pejabat',
    tanda_tangan: 'Menunggu tanda tangan penandatangan',
    perlu_perbaikan: 'Naskah perlu perbaikan',
  };
  const label = tahapanLabels[tahapan] ?? tahapan;
  return { label, oleh: '', jabatan: '' };
});

// ── Banner status di card Status Workflow: warna & ikon mengikuti tahapan.
// Warna diselaraskan dengan StatusBadge (tanda_tangan → indigo, dst).
const statusBanner = computed(() => {
  const t = detail.value?.tahapan ?? '';
  const base = {
    icon: 'i-lucide-clock',
    card: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60',
    wrap: 'bg-gray-400 text-white dark:bg-gray-500',
    title: 'Status Naskah',
  };
  if (
    t === 'selesai' &&
    detail.value?.signOption === 'ttd_basah' &&
    detail.value?.manualFinalStatus !== 'final'
  ) {
    return {
      icon: 'i-lucide-file-up',
      card: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30',
      wrap: 'bg-amber-500 text-white',
      title: 'Menunggu Dokumen Final',
    };
  }
  if (t === 'selesai')
    return {
      icon: 'i-lucide-circle-check-big',
      card: 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30',
      wrap: 'bg-green-500 text-white',
      title: 'Naskah Selesai',
    };
  if (t === 'ditolak')
    return {
      icon: 'i-lucide-circle-x',
      card: 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30',
      wrap: 'bg-red-500 text-white',
      title: 'Naskah Ditolak',
    };
  if (t === 'dibatalkan')
    return {
      icon: 'i-lucide-ban',
      card: base.card,
      wrap: 'bg-gray-400 text-white dark:bg-gray-500',
      title: 'Naskah Dibatalkan',
    };
  if (t === 'perlu_perbaikan')
    return {
      icon: 'i-lucide-wrench',
      card: 'border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30',
      wrap: 'bg-orange-500 text-white',
      title: 'Perlu Perbaikan',
    };
  if (t.startsWith('tanda_tangan'))
    return {
      icon: 'i-lucide-signature',
      card: 'border-indigo-200 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/30',
      wrap: 'bg-indigo-500 text-white',
      title: 'Tanda Tangan',
    };
  if (
    [
      'legal_drafting',
      'evaluasi',
      'persetujuan_lanjutan',
      'evaluasi_final',
      'persetujuan_direksi',
      'blanko_verbal',
    ].includes(t)
  )
    return {
      icon: 'i-lucide-scale',
      card: 'border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30',
      wrap: 'bg-violet-500 text-white',
      title: 'Proses Legal',
    };
  if (t === 'persetujuan')
    return {
      icon: 'i-lucide-stamp',
      card: 'border-primary-200 bg-primary-50 dark:border-primary-900/50 dark:bg-primary-950/30',
      wrap: 'bg-primary-500 text-white',
      title: 'Persetujuan',
    };
  return {
    icon: 'i-lucide-file-pen-line',
    card: base.card,
    wrap: base.wrap,
    title: 'Dalam Konsep',
  };
});

// ── Bubble nomor baris approval berwarna sesuai status baris ──
function approvalDotClass(status: string) {
  if (status === 'verified') return 'bg-green-500 text-white';
  if (status === 'rejected') return 'bg-red-500 text-white';
  if (status === 'waiting')
    return 'bg-amber-100 text-amber-700 ring-2 ring-inset ring-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700';
  return 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300';
}

// ── Stepper: hilangkan step 'skip' (mode tanpa legal) & renumber 1..M ──
// BE buildStepper seharusnya sudah memfilter skip, tapi guard di FE agar UI
// tetap benar walau BE lama masih mengirim status:'skip'.
// POV Unit Legal: hanya step Persetujuan (approval pemrakarsa, sudah lewat
// sebelum naskah masuk ke legal) yang disembunyikan. Step Blanko Verbal /
// Persetujuan Direksi TETAP ditampilkan — legal adalah pihak yang membuat
// dan mengirim blanko verbal, serta perlu melihat progres approval direksi
// (termasuk saat naskah ditolak dan kembali ke legal drafting).
const LEGAL_HIDDEN_STEPPER_LABELS = new Set(['Persetujuan']);
const visibleStepper = computed(() => {
  if (!detail.value?.stepper) return [];
  return detail.value.stepper
    .filter((s) => s.status !== 'skip')
    .filter((s) => !isLegalRole.value || !LEGAL_HIDDEN_STEPPER_LABELS.has(s.label))
    .map((s, i) => ({ ...s, step: i + 1 }));
});

// Status Workflow vertikal dibaca bawah→atas: tahap awal di bawah, tahap
// aktif/terbaru di atas (progres "naik").
const stepperBottomUp = computed(() => [...visibleStepper.value].reverse());

// ── Stepper status styling ──
function stepperIconClass(s: StepperStep) {
  if (s.status === 'done')
    return 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (s.status === 'active')
    return 'bg-primary-500 border-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/40';
  return 'bg-white dark:bg-gray-800 border-gray-300 text-gray-400 dark:border-gray-600';
}

function stepperLabelClass(s: StepperStep) {
  if (s.status === 'done') return 'text-gray-600 dark:text-gray-400';
  if (s.status === 'active') return 'text-primary-600 dark:text-primary-400 font-semibold';
  return 'text-gray-400 dark:text-gray-500';
}

// ── Jenis label ──
const jenisLabel = computed(() =>
  detail.value ? (JENIS_LABELS[detail.value.jenis] ?? detail.value.jenis) : ''
);

// ── Sifat label ──
const SIFAT_LABELS: Record<string, string> = {
  sangat_rahasia: 'Sangat Rahasia',
  rahasia: 'Rahasia',
  terbatas: 'Terbatas',
  biasa: 'Biasa',
  terbuka: 'Terbuka',
};
const sifatLabel = computed(() =>
  detail.value ? (SIFAT_LABELS[detail.value.sifat] ?? detail.value.sifat) : ''
);

// ── Sign option label ──
const SIGN_LABELS: Record<string, string> = {
  digsig: 'Digital',
  qr_only: 'Digital',
  ttd_basah: 'Fisik',
  tanpa_ttd: 'Tanpa Tanda Tangan',
};
const signLabel = computed(() =>
  detail.value ? (SIGN_LABELS[detail.value.signOption] ?? detail.value.signOption) : ''
);
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <template v-if="!isChildRoute">
      <PageHeader :items="breadcrumbs">
        <template #title>
          <div class="flex flex-wrap items-center gap-3">
            <h1
              class="text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl"
            >
              {{ detail?.perihal ?? 'Draf Naskah' }}
            </h1>
            <StatusBadge v-if="detail" :status="detailDisplayStatus" />
            <UButton
              v-if="canQuickCreateTugas"
              icon="i-lucide-list-plus"
              color="primary"
              size="sm"
              @click="showTugasQuickCreate = true"
            >
              {{ t('tugas_buat_dari_naskah') }}
            </UButton>
          </div>
        </template>
        <template #subtitle>
          <p
            v-if="detail"
            class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400"
          >
            <span class="font-mono text-xs">{{ nomorClean || 'Draft' }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ jenisLabel }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ fmtDate(detail.tanggal) }}</span>
          </p>
        </template>
      </PageHeader>

      <!-- Loading -->
      <div v-if="pending && !detail" class="flex min-h-96 items-center justify-center">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="mx-auto max-w-2xl">
        <div
          class="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 py-12 text-center dark:border-red-500/30 dark:bg-red-500/10"
        >
          <UIcon name="i-lucide-circle-alert" class="size-12 text-red-400" />
          <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
          <UButton color="primary" variant="soft" icon="i-lucide-arrow-left" to="/naskah-lainnya"
            >Kembali ke Daftar</UButton
          >
        </div>
      </div>

      <main v-else-if="detail" class="mx-auto max-w-480 space-y-4">
        <!-- Langkah Verifikasi (stepper horizontal dari approval berjenjang) -->
        <!-- Hanya tampil untuk verifikator/approver, bukan pemrakarsa -->
        <section
          v-if="approvalStepGroups.length && !isPemrakarsa"
          class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <button
            type="button"
            class="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30"
            @click="verificationExpanded = !verificationExpanded"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
            >
              <UIcon name="i-lucide-route" class="size-5 text-primary-600 dark:text-primary-400" />
            </span>
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-white">Langkah Verifikasi</h2>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Progress persetujuan naskah.
              </p>
            </div>
            <span
              class="ml-auto inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
            >
              {{ progressLabel }}
            </span>
            <UIcon
              :name="verificationExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="size-5 shrink-0 text-gray-400"
            />
          </button>
          <div v-show="verificationExpanded" class="space-y-4 px-5 py-5">
            <div v-for="group in approvalStepGroups" :key="group.tahap">
              <div class="mb-2 flex items-center gap-2">
                <span
                  class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >{{ group.label }}</span
                >
                <span class="text-xs text-gray-400"
                  >·
                  {{ group.children.reduce((total, child) => total + child.steps.length, 0) }}</span
                >
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
              </div>
              <div class="space-y-3">
                <div
                  v-for="child in group.children"
                  :key="child.tahap"
                  class="rounded-xl bg-gray-50/70 px-3 py-2.5 dark:bg-gray-900/30"
                >
                  <div
                    v-if="group.children.length > 1"
                    class="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    <span>{{ child.label }} · {{ child.steps.length }}</span>
                    <UBadge v-if="child.isParallel" color="neutral" variant="soft" size="xs"
                      >Paralel</UBadge
                    >
                  </div>
                  <!-- Direksi & blanko: seluruh pihak menerima approval bersamaan. -->
                  <div v-if="child.isParallel" class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <div
                      v-for="step in child.steps"
                      :key="step.id"
                      class="flex min-w-0 items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <span
                        class="flex size-9 shrink-0 items-center justify-center rounded-full"
                        :class="step.className"
                      >
                        <UIcon
                          v-if="step.status === 'verified'"
                          name="i-lucide-check"
                          class="size-4"
                        />
                        <UIcon
                          v-else-if="step.status === 'rejected'"
                          name="i-lucide-x"
                          class="size-4"
                        />
                        <UIcon v-else name="i-lucide-clock-3" class="size-4" />
                      </span>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {{ step.label }}
                        </p>
                        <p
                          v-if="step.jabatan"
                          class="truncate text-xs text-gray-500 dark:text-gray-400"
                        >
                          {{ step.jabatan }}
                        </p>
                      </div>
                      <span class="shrink-0 text-xs font-medium" :class="step.textClass">
                        {{ approvalStatusLabel(step.status) }}
                      </span>
                    </div>
                    <div
                      v-if="child.steps.length === 0"
                      class="text-sm text-gray-400 dark:text-gray-500"
                    >
                      Belum ada data.
                    </div>
                  </div>
                  <!-- Approval biasa tetap berjenjang. -->
                  <div v-else class="overflow-x-auto">
                    <div class="flex min-w-[400px] items-center px-1 py-2">
                      <template v-for="(step, index) in child.steps" :key="step.id">
                        <div class="flex min-w-36 items-center gap-3">
                          <div
                            class="flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold"
                            :class="step.className"
                          >
                            <UIcon
                              v-if="step.status === 'verified'"
                              name="i-lucide-check"
                              class="size-5"
                            />
                            <UIcon
                              v-else-if="step.status === 'rejected'"
                              name="i-lucide-x"
                              class="size-5"
                            />
                            <span v-else>{{ step.num }}</span>
                          </div>
                          <span class="text-sm font-semibold" :class="step.textClass">{{
                            step.label
                          }}</span>
                        </div>
                        <div
                          v-if="index < child.steps.length - 1"
                          class="mx-4 h-0.5 min-w-12 flex-1 bg-gray-300 dark:bg-gray-600"
                        />
                      </template>
                      <div
                        v-if="child.steps.length === 0"
                        class="text-sm text-gray-400 dark:text-gray-500"
                      >
                        Belum ada data.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 2-column: kiri satu panel gabungan (divider internal); kanan 2 card terpisah — bisa collapse,
           jadi diberi jarak agar batas section-nya tetap jelas. -->
        <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <!-- KIRI: panel gabungan Informasi + Dokumen + Approval + Penandatangan -->
          <div
            class="divide-y divide-gray-200 overflow-hidden self-start rounded-xl border border-gray-200 bg-white shadow-sm dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800 xl:col-span-2"
          >
            <!-- Informasi Naskah -->
            <div>
              <button
                type="button"
                class="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30"
                @click="informationExpanded = !informationExpanded"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
                >
                  <UIcon
                    name="i-lucide-file-text"
                    class="size-5 text-primary-600 dark:text-primary-400"
                  />
                </span>
                <div class="flex-1">
                  <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Naskah</h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Detail metadata naskah.
                  </p>
                </div>
                <UIcon
                  :name="informationExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="size-5 shrink-0 text-gray-400"
                />
              </button>
              <dl v-show="informationExpanded" class="grid grid-cols-1 gap-x-8 px-5 sm:grid-cols-2">
                <div
                  class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700"
                >
                  <span
                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                  >
                    <UIcon name="i-lucide-hash" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Nomor
                    </dt>
                    <dd
                      class="mt-0.5 wrap-break-word text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ nomorClean || '—' }}
                    </dd>
                  </div>
                </div>
                <div
                  class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700"
                >
                  <span
                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                  >
                    <UIcon name="i-lucide-file-stack" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Jenis
                    </dt>
                    <dd
                      class="mt-0.5 wrap-break-word text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ jenisLabel }}
                    </dd>
                  </div>
                </div>
                <div
                  class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700 sm:col-span-2"
                >
                  <span
                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                  >
                    <UIcon name="i-lucide-message-square" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Perihal
                    </dt>
                    <dd
                      class="mt-0.5 wrap-break-word text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ detail.perihal || '—' }}
                    </dd>
                  </div>
                </div>
                <div
                  class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700"
                >
                  <span
                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                  >
                    <UIcon name="i-lucide-user" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Pemrakarsa
                    </dt>
                    <dd
                      class="mt-0.5 wrap-break-word text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ pemrakarsaDisplay?.nama || '—' }}
                    </dd>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {{ pemrakarsaDisplay ? personaMeta(pemrakarsaDisplay) : '—' }}
                    </p>
                  </div>
                </div>
                <div
                  class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700"
                >
                  <span
                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                  >
                    <UIcon name="i-lucide-calendar" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Tanggal
                    </dt>
                    <dd
                      class="mt-0.5 wrap-break-word text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ fmtDate(detail.tanggal) }}
                    </dd>
                  </div>
                </div>
                <div
                  class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700"
                >
                  <span
                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                  >
                    <UIcon name="i-lucide-shield" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Klasifikasi
                    </dt>
                    <dd
                      class="mt-0.5 wrap-break-word text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ detail.klasifikasi }}
                    </dd>
                  </div>
                </div>
                <div
                  class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700"
                >
                  <span
                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                  >
                    <UIcon name="i-lucide-lock" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Sifat
                    </dt>
                    <dd
                      class="mt-0.5 wrap-break-word text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ sifatLabel }}
                    </dd>
                  </div>
                </div>
                <div
                  class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700"
                >
                  <span
                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                  >
                    <UIcon name="i-lucide-scale" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Butuh Legal
                    </dt>
                    <dd
                      class="mt-0.5 wrap-break-word text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ detail.butuhLegal ? 'Ya' : 'Tidak' }}
                    </dd>
                  </div>
                </div>
                <div class="flex items-start gap-3 py-3">
                  <span
                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                  >
                    <UIcon name="i-lucide-signature" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Opsi TTD
                    </dt>
                    <dd
                      class="mt-0.5 wrap-break-word text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ signLabel }}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <!-- Dokumen -->
            <div>
              <button
                type="button"
                class="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30"
                @click="documentExpanded = !documentExpanded"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
                >
                  <UIcon
                    name="i-lucide-paperclip"
                    class="size-5 text-primary-600 dark:text-primary-400"
                  />
                </span>
                <div class="flex-1">
                  <h2 class="font-semibold text-gray-900 dark:text-white">Dokumen</h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Dokumen terkait naskah.
                  </p>
                </div>
                <UIcon
                  :name="documentExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="size-5 shrink-0 text-gray-400"
                />
              </button>
              <!-- Sub-tabs -->
              <div
                v-show="documentExpanded"
                class="flex gap-1 px-4 pt-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto"
              >
                <button
                  v-for="(tab, i) in dokumenTabs"
                  :key="tab.label"
                  @click="dokumenTab = i"
                  class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap"
                  :class="
                    dokumenTab === i
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  "
                >
                  <UIcon :name="tab.icon" class="size-3.5" />
                  {{ tab.label }}
                </button>
              </div>
              <div v-show="documentExpanded" class="p-4">
                <NaskahVersiTimeline
                  v-if="dokumenTab === 0"
                  :items="dokumenTerkait"
                  @lihat="lihatVersi"
                  @unduh="unduhVersi"
                />
                <template v-else>
                  <div
                    v-if="dokumenTerkait.length === 0"
                    class="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500"
                  >
                    <UIcon name="i-lucide-inbox" class="size-8" />
                    <span class="text-sm">Belum ada dokumen.</span>
                  </div>
                  <div v-else class="space-y-2">
                    <div
                      v-for="d in dokumenTerkait"
                      :key="d.id"
                      class="flex flex-col gap-3 rounded-xl border border-gray-200 px-4 py-3 transition hover:border-primary-200 hover:shadow-sm dark:border-gray-700 dark:hover:border-primary-800 sm:flex-row sm:items-center"
                    >
                      <div class="flex min-w-0 flex-1 items-center gap-3">
                        <span
                          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700/60"
                        >
                          <UIcon
                            :name="fileMeta(d).icon"
                            class="size-5"
                            :class="fileMeta(d).iconClass"
                          />
                        </span>
                        <div class="min-w-0 flex-1">
                          <p
                            class="truncate text-sm font-medium text-gray-900 dark:text-white"
                            :title="displayDocumentName(d)"
                          >
                            {{ displayDocumentName(d) }}
                          </p>
                          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {{ fileMeta(d).ext
                            }}<template v-if="d.ukuran"> · {{ d.ukuran }}</template
                            ><template v-if="d.tanggal"> · {{ fmtDate(d.tanggal) }}</template>
                          </p>
                        </div>
                        <span
                          v-if="dokumenStatusMeta(d.status)"
                          class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          :class="dokumenStatusMeta(d.status)!.chip"
                          >{{ dokumenStatusMeta(d.status)!.label }}</span
                        >
                      </div>
                      <div class="flex shrink-0 gap-2">
                        <UButton
                          size="sm"
                          color="neutral"
                          variant="ghost"
                          icon="i-lucide-eye"
                          class="flex-1 sm:flex-initial"
                          @click="preview(d)"
                          >Preview</UButton
                        >
                        <UButton
                          size="sm"
                          color="primary"
                          variant="soft"
                          icon="i-lucide-download"
                          class="flex-1 sm:flex-initial"
                          :aria-label="`Unduh ${d.nama}`"
                          @click="download(d)"
                          >Unduh</UButton
                        >
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Approval Chain -->
            <div>
              <button
                type="button"
                class="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30"
                @click="approvalExpanded = !approvalExpanded"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
                >
                  <UIcon
                    name="i-lucide-users"
                    class="size-5 text-primary-600 dark:text-primary-400"
                  />
                </span>
                <div class="flex-1">
                  <h2 class="font-semibold text-gray-900 dark:text-white">Approval</h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Daftar approver dan status persetujuan.
                  </p>
                </div>
                <UIcon
                  :name="approvalExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="size-5 shrink-0 text-gray-400"
                />
              </button>
              <div v-show="approvalExpanded" class="px-4 py-3">
                <div
                  v-if="approvalDisplayGroups.length === 0"
                  class="flex items-center gap-2 py-4 text-sm text-gray-400 dark:text-gray-500"
                >
                  <UIcon name="i-lucide-inbox" class="size-4" />
                  <span>Belum ada baris approval.</span>
                </div>
                <div v-else class="space-y-4">
                  <div v-for="group in approvalDisplayGroups" :key="group.tahap" class="space-y-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                        >{{ group.label }}</span
                      >
                      <span class="text-xs text-gray-400">· {{ group.rows.length }}</span>
                      <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                    </div>
                    <div
                      v-for="child in group.children?.length ? group.children : [group]"
                      :key="child.tahap"
                      class="space-y-2 rounded-xl bg-gray-50/70 p-3 dark:bg-gray-900/30"
                    >
                      <div
                        v-if="group.children?.length"
                        class="text-[11px] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400"
                      >
                        {{ child.label }} · {{ child.rows.length }}
                      </div>
                      <div
                        v-for="(a, i) in child.rows"
                        :key="a.id"
                        class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <span
                          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          :class="approvalDotClass(a.status)"
                          >{{ i + 1 }}</span
                        >
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ approvalDisplayName(a) }}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {{ approvalDisplayPosition(a) }}
                          </p>
                          <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                            urutan {{ a.urutan }} · {{ fmtDateTime(a.tanggal) }}
                          </p>
                          <div
                            v-if="a.catatan"
                            class="approval-note mt-1 rounded-lg border-l-4 border-primary-400 bg-primary-50/70 px-3 py-1.5 text-xs text-primary-900 dark:border-primary-600 dark:bg-primary-900/20 dark:text-primary-100"
                          >
                            <span
                              class="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-70"
                            >
                              <UIcon name="i-lucide-message-square-text" class="size-3" />
                              Catatan
                            </span>
                            <!-- eslint-disable-next-line vue/no-v-html -->
                            <div class="approval-note-content" v-html="a.catatan"></div>
                          </div>
                        </div>
                        <StatusBadge :status="a.status" />
                      </div>
                      <div
                        v-if="child.rows.length === 0"
                        class="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500"
                      >
                        Belum ada data.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Penandatangan -->
            <div>
              <button
                type="button"
                class="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30"
                @click="signerExpanded = !signerExpanded"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
                >
                  <UIcon
                    name="i-lucide-pen-tool"
                    class="size-5 text-primary-600 dark:text-primary-400"
                  />
                </span>
                <div class="flex-1">
                  <h2 class="font-semibold text-gray-900 dark:text-white">Penandatangan</h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Daftar penandatangan naskah.
                  </p>
                </div>
                <span
                  v-if="signedCount > 0"
                  class="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  <UIcon name="i-lucide-check" class="size-3" />
                  {{ signedCount }}/{{ penandatanganList.length }}
                  {{ detail.signOption === 'ttd_basah' ? 'menyetujui draft' : 'ditandatangani' }}
                </span>
                <UIcon
                  :name="signerExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="size-5 shrink-0 text-gray-400"
                />
              </button>
              <div v-show="signerExpanded" class="px-4 py-3">
                <div
                  v-if="penandatanganList.length === 0"
                  class="flex items-center gap-2 py-4 text-sm text-gray-400 dark:text-gray-500"
                >
                  <UIcon name="i-lucide-inbox" class="size-4" />
                  <span>Belum ada penandatangan.</span>
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="(p, i) in penandatanganList"
                    :key="i"
                    class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5"
                    :class="
                      signerStatus(i) === 'current'
                        ? 'border-primary-300 bg-primary-50/60 ring-1 ring-primary-200 dark:border-primary-800 dark:bg-primary-900/20 dark:ring-primary-900/50'
                        : 'border-gray-200 dark:border-gray-700'
                    "
                  >
                    <span
                      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      :class="
                        signerStatus(i) === 'signed'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      "
                    >
                      <UIcon
                        v-if="signerStatus(i) === 'signed'"
                        name="i-lucide-check"
                        class="size-3"
                      />
                      <template v-else>{{ i + 1 }}</template>
                    </span>
                    <div class="flex-1 min-w-40">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ p.nama }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ personaMeta(p) }}</p>
                    </div>
                    <span
                      v-if="signerStatus(i) === 'signed'"
                      class="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    >
                      <UIcon name="i-lucide-check" class="size-3" />{{
                        detail.signOption === 'ttd_basah' ? 'Draft Disetujui' : 'Ditandatangani'
                      }}
                    </span>
                    <span
                      v-else-if="signerStatus(i) === 'current'"
                      class="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                    >
                      <UIcon name="i-lucide-pen-line" class="size-3" />{{
                        detail.signOption === 'ttd_basah' ? 'Meninjau Draft' : 'Menandatangani'
                      }}
                    </span>
                    <span
                      v-else-if="signerStatus(i) === 'waiting'"
                      class="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    >
                      <UIcon name="i-lucide-clock" class="size-3" />Menunggu
                    </span>
                    <UIcon v-else name="i-lucide-signature" class="size-4 text-gray-400 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- KANAN: Status Workflow + Timeline -->
          <aside class="space-y-4 self-start">
            <!-- Status Workflow (Stepper) -->
            <div
              class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <button
                type="button"
                @click="workflowExpanded = !workflowExpanded"
                class="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
                >
                  <UIcon
                    name="i-lucide-workflow"
                    class="size-5 text-primary-600 dark:text-primary-400"
                  />
                </span>
                <div class="flex-1">
                  <h2 class="font-semibold text-gray-900 dark:text-white">Status Workflow</h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Tahapan naskah.</p>
                </div>
                <UIcon
                  :name="workflowExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="size-5 shrink-0 text-gray-400"
                />
              </button>
              <div v-show="workflowExpanded" class="px-5 py-4">
                <!-- Banner status: warna & ikon mengikuti tahapan; detail dari nextActionInfo -->
                <div
                  v-if="nextActionInfo"
                  class="mb-4 flex items-start gap-3 rounded-xl border px-4 py-3.5"
                  :class="statusBanner.card"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm"
                    :class="statusBanner.wrap"
                  >
                    <UIcon :name="statusBanner.icon" class="size-5" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-bold text-gray-900 dark:text-white">
                      {{ statusBanner.title }}
                    </p>
                    <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                      {{ nextActionInfo.label }}
                    </p>
                  </div>
                </div>

                <!-- Stepper -->
                <ol class="relative flex flex-col gap-0">
                  <li v-for="(s, i) in stepperBottomUp" :key="s.step" class="flex gap-3">
                    <div class="flex flex-col items-center">
                      <div
                        class="h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium border-2 shrink-0"
                        :class="stepperIconClass(s)"
                      >
                        <UIcon v-if="s.status === 'done'" name="i-lucide-check" class="size-3" />
                        <span v-else>{{ s.step }}</span>
                      </div>
                      <!-- Garis mengarah ke step di bawahnya (tahap sebelumnya):
                           hijau bila tahap bawah sudah done agar progres terbaca naik. -->
                      <div
                        v-if="i < stepperBottomUp.length - 1"
                        class="w-0.5 flex-1 min-h-4 border-l"
                        :class="
                          s.status === 'done' || stepperBottomUp[i + 1]?.status === 'done'
                            ? 'border-solid border-green-400 dark:border-green-500'
                            : 'border-dashed border-gray-300 dark:border-gray-700'
                        "
                      />
                    </div>
                    <div class="pb-4 text-sm">
                      <span class="font-medium" :class="stepperLabelClass(s)">{{ s.label }}</span>
                      <span
                        v-if="s.status === 'active'"
                        class="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                        >Berjalan</span
                      >
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            <!-- Timeline Riwayat -->
            <div
              class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <button
                type="button"
                @click="timelineExpanded = !timelineExpanded"
                class="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
                >
                  <UIcon
                    name="i-lucide-route"
                    class="size-5 text-primary-600 dark:text-primary-400"
                  />
                </span>
                <div class="flex-1 min-w-0">
                  <h2 class="font-semibold text-gray-900 dark:text-white">Timeline Riwayat</h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Riwayat alur naskah.
                  </p>
                </div>
                <UIcon
                  :name="timelineExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="size-5 shrink-0 text-gray-400"
                />
              </button>
              <div v-show="timelineExpanded" class="px-4 py-3">
                <div
                  v-if="timelineEntries.length === 0"
                  class="flex items-center gap-2 py-4 text-sm text-gray-400 dark:text-gray-500"
                >
                  <UIcon name="i-lucide-inbox" class="size-4" />
                  <span>Belum ada riwayat.</span>
                </div>
                <ol v-else class="max-h-112 space-y-3 overflow-y-auto pr-1" data-timeline-notes>
                  <li v-for="(entry, idx) in timelineEntries" :key="entry.id" class="flex gap-2.5">
                    <div class="flex flex-col items-center">
                      <span
                        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-800"
                        :class="entry.iconBg"
                      >
                        <UIcon :name="entry.icon" class="size-3.5 text-white" />
                      </span>
                      <span
                        v-if="idx < timelineEntries.length - 1"
                        class="mt-0.5 w-0.5 flex-1 bg-gray-200 dark:bg-gray-700"
                      />
                    </div>
                    <div class="min-w-0 flex-1 pb-2">
                      <div class="flex items-center justify-between gap-2">
                        <p class="text-xs font-semibold text-gray-900 dark:text-white">
                          {{ entry.jabatan ? entry.jabatan + ' — ' : '' }}{{ entry.title }}
                        </p>
                        <span
                          class="shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium"
                          :class="entry.actionColor"
                          >{{ entry.action }}</span
                        >
                      </div>
                      <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {{ fmtDateTime(entry.timestamp) }}
                      </p>
                      <!-- Catatan approval: render HTML dari editor (pasal/batang
                           tubuh) dengan panel highlight agar mudah terlihat.
                           Konten panjang di-clamp dengan tombol "Lihat selengkapnya". -->
                      <div
                        v-if="entry.catatan"
                        class="approval-note mt-1.5 rounded-lg border-l-4 px-3 py-2 text-xs"
                        :class="
                          isRejectTimelineAction(entry.action)
                            ? 'border-red-400 bg-red-50/70 text-red-900 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200'
                            : 'border-primary-400 bg-primary-50/70 text-primary-900 dark:border-primary-600 dark:bg-primary-900/20 dark:text-primary-100'
                        "
                      >
                        <span
                          class="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-70"
                        >
                          <UIcon name="i-lucide-message-square-text" class="size-3" />
                          {{ isRejectTimelineAction(entry.action) ? 'Alasan' : 'Catatan' }}
                        </span>
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <div
                          class="approval-note-content"
                          :class="
                            longTimelineNotes.has(entry.id) && !expandedTimelineNotes.has(entry.id)
                              ? 'note-clamped'
                              : ''
                          "
                          :data-note-id="entry.id"
                          v-html="entry.catatan"
                        ></div>
                        <button
                          v-if="longTimelineNotes.has(entry.id)"
                          type="button"
                          class="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-70 transition-opacity hover:opacity-100"
                          :class="
                            isRejectTimelineAction(entry.action)
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-primary-700 dark:text-primary-300'
                          "
                          @click="toggleTimelineNote(entry.id)"
                        >
                          <UIcon
                            :name="
                              expandedTimelineNotes.has(entry.id)
                                ? 'i-lucide-chevrons-up'
                                : 'i-lucide-chevrons-down'
                            "
                            class="size-3"
                          />
                          {{ expandedTimelineNotes.has(entry.id) ? 'Tutup' : 'Lihat selengkapnya' }}
                        </button>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </aside>
        </section>

        <!-- Proses Persetujuan Legal (approver legal — giliran aktif) -->
        <section
          v-if="canProsesLegalApproval"
          class="overflow-hidden rounded-xl border border-primary-100 bg-linear-to-br from-primary-50 to-white p-5 shadow-sm dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400"
              >
                <UIcon name="i-lucide-file-check-2" class="size-5" />
              </span>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  Persetujuan Legal Menunggu Anda
                </h3>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Tinjau naskah dan berikan persetujuan berjenjang pada giliran Anda.
                </p>
              </div>
            </div>
            <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <UButton
                color="primary"
                icon="i-lucide-check"
                size="lg"
                class="font-semibold w-full sm:w-auto"
                @click="goToLegalApprovalWorkspace"
                >Proses Persetujuan Legal</UButton
              >
            </div>
          </div>
        </section>

        <!-- TTD fisik/manual: tidak ada signing task. Pemrakarsa mengelola satu
           dokumen final dan statusnya langsung dari halaman detail. -->
        <section
          v-if="false && showManualFinalPanel"
          class="overflow-hidden rounded-xl border shadow-sm"
          :class="
            isManualFinal
              ? 'border-green-200 bg-green-50/70 dark:border-green-900/50 dark:bg-green-950/20'
              : 'border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20'
          "
        >
          <div class="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex min-w-0 items-start gap-3">
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                :class="isManualFinal ? 'bg-green-500' : 'bg-amber-500'"
              >
                <UIcon
                  :name="isManualFinal ? 'i-lucide-file-check-2' : 'i-lucide-file-up'"
                  class="size-5"
                />
              </span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-semibold text-gray-900 dark:text-white">
                    Dokumen Final TTD Fisik
                  </h3>
                  <UBadge
                    :color="isManualFinal ? 'success' : 'warning'"
                    variant="subtle"
                    size="sm"
                    :icon="isManualFinal ? 'i-lucide-circle-check' : 'i-lucide-clock-3'"
                    >{{ isManualFinal ? 'Manual Final' : 'Belum Final' }}</UBadge
                  >
                </div>
                <p class="mt-1 max-w-2xl text-xs leading-5 text-gray-600 dark:text-gray-400">
                  Proses verifikasi telah selesai. Pemrakarsa dapat mengunggah dokumen final yang
                  sudah ditandatangani fisik dan mengubah statusnya kapan saja. Status ini tidak
                  mengubah pilihan butuh legal.
                </p>
                <p
                  class="mt-2 flex items-center gap-1.5 text-xs font-medium"
                  :class="
                    detail.manualFinalFileUploaded
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-amber-700 dark:text-amber-400'
                  "
                >
                  <UIcon
                    :name="
                      detail.manualFinalFileUploaded
                        ? 'i-lucide-paperclip-check'
                        : 'i-lucide-file-warning'
                    "
                    class="size-3.5"
                  />
                  {{
                    detail.manualFinalFileUploaded
                      ? 'Dokumen final sudah diunggah dan dapat diganti.'
                      : 'Dokumen final belum diunggah.'
                  }}
                </p>
              </div>
            </div>

            <div v-if="canManageManualFinal" class="flex shrink-0 flex-col gap-3 sm:items-end">
              <div class="flex w-full gap-2 sm:w-auto">
                <input
                  v-model="manualFinalNomor"
                  type="text"
                  class="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-900 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-72"
                  placeholder="Nomor naskah fisik"
                  :disabled="manualFinalBusy"
                />
                <UButton
                  color="primary"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-save"
                  :loading="manualFinalBusy"
                  @click="saveManualFinalNomor"
                  >Simpan Nomor</UButton
                >
              </div>
              <div
                class="flex w-full rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:w-auto"
              >
                <UButton
                  color="warning"
                  size="sm"
                  :variant="isManualFinal ? 'ghost' : 'solid'"
                  icon="i-lucide-clock-3"
                  :disabled="manualFinalBusy"
                  @click="setManualFinalStatus(false)"
                  >Belum Final</UButton
                >
                <UButton
                  color="success"
                  size="sm"
                  :variant="isManualFinal ? 'solid' : 'ghost'"
                  icon="i-lucide-circle-check"
                  :disabled="manualFinalBusy || !detail.manualFinalFileUploaded"
                  @click="setManualFinalStatus(true)"
                  >Manual Final</UButton
                >
              </div>
              <UButton
                color="primary"
                size="lg"
                icon="i-lucide-upload"
                class="w-full justify-center font-semibold sm:w-auto"
                :loading="manualFinalBusy"
                @click="openManualFinalPicker"
                >{{
                  detail.manualFinalFileUploaded ? 'Ganti Dokumen Final' : 'Unggah Dokumen Final'
                }}</UButton
              >
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-pencil-line"
                :to="`/naskah-lainnya/tulis?draft_id=${id}&mode=data-sistem`"
                >Lengkapi Data Penandatangan</UButton
              >
              <input
                ref="manualFinalInput"
                type="file"
                class="hidden"
                accept=".pdf,application/pdf"
                @change="onManualFinalFileChange"
              />
            </div>

            <div
              v-else
              class="shrink-0 rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-400"
            >
              Hanya pemrakarsa yang dapat mengubah status dan dokumen final.
            </div>
          </div>
        </section>

        <!-- Selesai toolbar: link kembali ke halaman selesai (naskah sudah final,
           availableActions kosong → pengganti action toolbar). -->
        <section
          v-if="detail.tahapan === 'selesai'"
          class="overflow-hidden rounded-xl border bg-linear-to-br to-white p-5 shadow-sm dark:to-gray-800"
          :class="
            isPhysicalAwaitingFinal
              ? 'border-amber-200 from-amber-50 dark:border-amber-900/40 dark:from-amber-900/20'
              : 'border-green-200 from-green-50 dark:border-green-900/40 dark:from-green-900/20'
          "
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                :class="
                  isPhysicalAwaitingFinal
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                    : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                "
              >
                <UIcon
                  :name="isPhysicalAwaitingFinal ? 'i-lucide-file-up' : 'i-lucide-circle-check-big'"
                  class="size-5"
                />
              </span>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  {{ isPhysicalAwaitingFinal ? 'Selesai - Belum Final' : 'Naskah Selesai' }}
                </h3>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{
                    isPhysicalAwaitingFinal
                      ? 'Persetujuan draft selesai. Lengkapi data dan unggah dokumen final TTD fisik.'
                      : 'Naskah telah diselesaikan. Lihat dokumen final & ringkasan penandatangan.'
                  }}
                </p>
              </div>
            </div>
            <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <UButton
                v-if="detail.signOption === 'ttd_basah' && canManageManualFinal"
                :color="isPhysicalAwaitingFinal ? 'warning' : 'primary'"
                variant="soft"
                size="lg"
                icon="i-lucide-file-pen-line"
                class="w-full font-semibold sm:w-auto"
                :to="`/naskah-lainnya/tulis?draft_id=${id}&mode=data-sistem`"
                >Lengkapi Data & Dokumen Final</UButton
              >
              <UButton
                v-if="!isPhysicalAwaitingFinal"
                color="primary"
                size="lg"
                icon="i-lucide-eye"
                class="w-full font-semibold shadow-lg shadow-primary-500/20 sm:w-auto"
                :to="`/naskah-lainnya/${detail.id}/selesai`"
                >Lihat Halaman Selesai</UButton
              >
            </div>
          </div>
        </section>

        <!-- Action toolbar (di paling bawah) — disembunyikan saat canProsesLegalApproval
             karena sudah ada panel khusus "Persetujuan Legal Menunggu Anda" (hindari dobel aksi). -->
        <section
          v-if="detail.availableActions.length && !canProsesLegalApproval"
          class="overflow-hidden rounded-xl border border-primary-100 bg-linear-to-br from-primary-50 to-white p-5 shadow-sm dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400"
              >
                <UIcon name="i-lucide-circle-check-big" class="size-5" />
              </span>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Aksi</h3>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ actionDescription }}
                </p>
              </div>
            </div>
            <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <!-- Approval pemrakarsa dari detail hanya diarahkan ke halaman kerja persetujuan.
                   Aksi Tolak disediakan di halaman tersebut agar user review dokumen dulu. -->
              <UButton
                v-if="
                  detail.availableActions.includes('kembalikan') &&
                  !detail.availableActions.includes('setuju')
                "
                class="w-full sm:w-auto"
                color="error"
                variant="outline"
                size="lg"
                icon="i-lucide-circle-x"
                :loading="savingAction"
                @click="openActionModal('tolak')"
                >Tolak</UButton
              >
              <UButton
                v-if="detail.availableActions.includes('setuju')"
                class="w-full sm:w-auto"
                color="primary"
                size="lg"
                icon="i-lucide-arrow-right"
                :loading="savingAction"
                @click="openActionModal('setuju')"
                >Setujui</UButton
              >
              <UButton
                v-if="
                  detail.availableActions.includes('tolak') &&
                  (tahapan === 'persetujuan_direksi' || tahapan === 'blanko_verbal') &&
                  !canProcessSheetApproval
                "
                class="w-full sm:w-auto"
                color="error"
                variant="outline"
                size="lg"
                icon="i-lucide-circle-x"
                :loading="pendingAction === 'tolak' && savingAction"
                @click="
                  tahapan === 'blanko_verbal'
                    ? navigateTo(`/naskah-lainnya/${id}/blanko-verbal`)
                    : openActionModal('tolak')
                "
                >Tolak</UButton
              >
              <UButton
                v-if="detail.availableActions.includes('paraf') && !canProcessSheetApproval"
                class="font-semibold w-full sm:w-auto"
                color="primary"
                size="lg"
                icon="i-lucide-check"
                :loading="pendingAction === 'paraf' && savingAction"
                @click="
                  tahapan === 'blanko_verbal'
                    ? navigateTo(`/naskah-lainnya/${id}/blanko-verbal`)
                    : openActionModal('paraf')
                "
                >Setujui</UButton
              >

              <!-- Approval Blanko/LPD wajib membuka workspace dokumen terlebih dahulu.
                   Aksi Setujui dan Tolak hanya tersedia pada halaman tersebut. -->
              <UButton
                v-if="canProcessSheetApproval"
                color="primary"
                size="lg"
                icon="i-lucide-file-check-2"
                class="w-full font-semibold sm:w-auto"
                :to="`/naskah-lainnya/${id}/persetujuan-direksi`"
                >Setujui</UButton
              >

              <!-- Mulai Legal Drafting: aktif di legal_drafting, hide di tahap lain -->
              <UButton
                v-if="canMulaiLegal"
                color="primary"
                icon="i-lucide-file-pen"
                size="lg"
                class="font-semibold w-full sm:w-auto"
                :to="`/naskah-lainnya/${id}/legal-drafting`"
                >Mulai Legal Drafting</UButton
              >

              <!-- Penandatangan hanya memeriksa lalu tanda tangan/menolak; tanpa workspace upload. -->
              <UButton
                v-if="detail.availableActions.includes('tolak-tanda-tangan')"
                color="error"
                variant="outline"
                :icon="isDigitalWithoutLegal ? 'i-lucide-ban' : 'i-lucide-undo-2'"
                size="lg"
                class="font-semibold w-full sm:w-auto"
                :loading="pendingAction === 'tolak-tanda-tangan' && savingAction"
                @click="openActionModal('tolak-tanda-tangan')"
                >{{
                  isPhysicalSigning
                    ? 'Tolak Naskah Draft'
                    : isDigitalWithoutLegal
                      ? 'Tolak dan Batalkan'
                      : 'Tolak ke Unit Legal'
                }}</UButton
              >
              <UButton
                v-if="canTandaTangan"
                color="primary"
                icon="i-lucide-pen-tool"
                size="lg"
                class="font-semibold w-full sm:w-auto"
                :loading="pendingAction === 'tanda-tangan' && savingAction"
                @click="openActionModal('tanda-tangan')"
                >{{
                  detail.signOption === 'ttd_basah' ? 'Setujui Naskah Draft' : 'Tanda Tangan'
                }}</UButton
              >

              <!-- Unit Legal dapat membuat blanko atau membuka kembali progres approval. -->
              <UButton
                v-if="canBuatBlanko || canBukaBlanko"
                color="primary"
                :icon="canBuatBlanko ? 'i-lucide-file-check' : 'i-lucide-file-search'"
                size="lg"
                class="font-semibold w-full sm:w-auto"
                :to="`/naskah-lainnya/${id}/blanko-verbal`"
                >{{
                  canBuatBlanko ? 'Buat Lembar Persetujuan' : 'Lihat Progres Persetujuan'
                }}</UButton
              >

              <!-- Buat Lembar Persetujuan Direksi: legal menyusun lembar saat evaluasi (butuhLegal) -->
              <UButton
                v-if="canBuatLembarPersetujuanDireksi"
                color="primary"
                icon="i-lucide-file-signature"
                size="lg"
                class="font-semibold w-full sm:w-auto"
                :to="`/naskah-lainnya/${id}/persetujuan-direksi`"
                >Buat Lembar Persetujuan</UButton
              >

              <!-- Kembalikan ke pemrakarsa (legal drafting) -->
              <UButton
                v-if="detail.availableActions.includes('kembalikan-legal')"
                class="w-full sm:w-auto"
                color="error"
                variant="outline"
                size="lg"
                icon="i-lucide-undo-2"
                :loading="savingAction"
                @click="openActionModal('kembalikan-legal')"
                >Kembalikan</UButton
              >

              <!-- Edit Naskah (perlu_perbaikan — pemrakarsa revisi sebelum kirim ulang) -->
              <UButton
                v-if="tahapan === 'perlu_perbaikan'"
                class="w-full sm:w-auto"
                color="neutral"
                variant="outline"
                size="lg"
                icon="i-lucide-pencil"
                :to="`/naskah-lainnya/tulis?draft_id=${id}`"
                >Edit Naskah</UButton
              >

              <!-- Kirim (konsep/perlu_perbaikan) -->
              <UButton
                v-if="detail.availableActions.includes('kirim')"
                color="primary"
                icon="i-lucide-send"
                size="lg"
                class="font-semibold w-full sm:w-auto"
                :loading="pendingAction === 'kirim' && savingAction"
                @click="openActionModal('kirim')"
                >Kirim</UButton
              >

              <!-- Kembalikan ke Legal Drafting (dari step evaluasi, alasan wajib) -->
              <UButton
                v-if="detail.availableActions.includes('kembalikan-evaluasi')"
                color="error"
                variant="outline"
                icon="i-lucide-undo-2"
                size="lg"
                class="w-full sm:w-auto"
                :loading="pendingAction === 'kembalikan-evaluasi' && savingAction"
                @click="openActionModal('kembalikan-evaluasi')"
                >Kembalikan ke Legal</UButton
              >

              <!-- Evaluasi -->
              <UButton
                v-if="detail.availableActions.includes('lanjut-persetujuan')"
                color="primary"
                icon="i-lucide-clipboard-check"
                size="lg"
                class="font-semibold w-full sm:w-auto"
                :to="`/naskah-lainnya/${id}/evaluasi`"
                >Buka Evaluasi</UButton
              >
              <UButton
                v-if="
                  ['teruskan-persetujuan', 'selesai-persetujuan'].some((action) =>
                    detail.availableActions.includes(action)
                  )
                "
                color="primary"
                icon="i-lucide-clipboard-check"
                size="lg"
                class="font-semibold w-full sm:w-auto"
                :to="`/naskah-lainnya/${id}/evaluasi`"
                >Buka Evaluasi</UButton
              >

              <!-- Evaluasi legacy -->
              <UButton
                v-if="detail.availableActions.includes('evaluasi')"
                color="primary"
                icon="i-lucide-clipboard-check"
                size="lg"
                class="font-semibold w-full sm:w-auto"
                :loading="pendingAction === 'evaluasi' && savingAction"
                @click="openActionModal('evaluasi')"
                >Evaluasi</UButton
              >
            </div>
          </div>
        </section>
      </main>

      <!-- Modal Setuju -->
      <ApprovalNoteEditor
        v-model="showApproveModal"
        variant="approve"
        :title="
          pendingAction === 'evaluasi'
            ? 'Evaluasi Naskah'
            : pendingAction === 'tanda-tangan'
              ? detail.signOption === 'ttd_basah'
                ? 'Setujui Naskah Draft'
                : 'Tanda Tangani Naskah'
              : pendingAction === 'kirim'
                ? 'Kirim Naskah'
                : 'Setujui Naskah'
        "
        :description="
          pendingAction === 'evaluasi'
            ? 'Periksa naskah dan hasil legal drafting (jika ada). Setujui jika naskah sesuai untuk dilanjutkan ke tanda tangan.'
            : pendingAction === 'tanda-tangan'
              ? detail.signOption === 'ttd_basah'
                ? 'Pastikan Naskah Draft sudah benar. Nomor akan diterbitkan setelah seluruh penandatangan menyetujui.'
                : 'Pastikan naskah sudah benar. Tanda tangan akan diproses tanpa mengunggah atau merevisi dokumen.'
              : pendingAction === 'kirim'
                ? 'Naskah akan dikirim untuk persetujuan.'
                : isLastApprover
                  ? 'Anda akan menyetujui naskah ini. Naskah dilanjutkan ke tahap berikutnya setelah seluruh approver menyetujui.'
                  : 'Anda akan menyetujui naskah ini dan meneruskannya ke approver berikutnya.'
        "
        note-placeholder="Tuliskan catatan persetujuan (opsional)…"
        :confirm-label="
          pendingAction === 'evaluasi'
            ? 'Ya, Setujui'
            : pendingAction === 'tanda-tangan'
              ? detail.signOption === 'ttd_basah'
                ? 'Ya, Setujui Draft'
                : 'Ya, Tanda Tangani'
              : pendingAction === 'kirim'
                ? 'Kirim'
                : 'Ya, Setujui'
        "
        :saving="savingAction"
        :require-note="false"
        @confirm="handleApprove"
      />

      <!-- Pilihan Metode TTD signer TERAKHIR — komponen sama dengan naskah umum (Tulis/DigsigPassphraseModal).
           Opsi basah disembunyikan: naskah sudah commit ke digital (signOption qr_only/digsig). -->
      <TulisDigsigPassphraseModal
        v-if="!isPhysicalSigning"
        v-model:open="showSignMethodModal"
        :signer-info="signerInfo"
        :is-loading="signingBusy"
        :hide-basah="true"
        :portal-mode="activeTteMode === 'portal'"
        ref="signMethodModalRef"
        @submit="handleSignMethodSubmit"
      />

      <!-- Modal Tolak -->
      <ApprovalNoteEditor
        v-model="showRejectModal"
        variant="reject"
        :title="
          pendingAction === 'tolak-tanda-tangan'
            ? isPhysicalSigning
              ? 'Tolak Naskah Draft'
              : isDigitalWithoutLegal
                ? 'Tolak dan Batalkan Naskah'
                : 'Tolak ke Unit Legal'
            : 'Tolak Naskah'
        "
        :description="
          pendingAction === 'tolak-tanda-tangan'
            ? isPhysicalSigning
              ? 'Penolakan mengembalikan Naskah Draft kepada pemrakarsa untuk direvisi.'
              : isDigitalWithoutLegal
                ? 'Penolakan membatalkan naskah dan mengembalikannya kepada pemrakarsa sebagai naskah yang dibatalkan.'
                : 'Penolakan mengembalikan naskah ke Unit Legal untuk diperbaiki.'
            : 'Penolakan akan mengembalikan naskah ke pemrakarsa untuk diperbaiki.'
        "
        :warning="
          pendingAction === 'tolak-tanda-tangan'
            ? isPhysicalSigning
              ? 'Approval penandatangan dihentikan dan dimulai ulang setelah pemrakarsa mengirim revisi.'
              : isDigitalWithoutLegal
                ? 'Naskah yang dibatalkan tidak dapat diperbaiki atau dilanjutkan kembali.'
                : 'Proses tanda tangan dihentikan dan dimulai ulang setelah revisi legal selesai.'
            : 'Naskah dikembalikan ke pemrakarsa dan dapat direvisi kemudian.'
        "
        note-placeholder="Tuliskan alasan penolakan (minimal 5 karakter)…"
        :confirm-label="
          pendingAction === 'tolak-tanda-tangan'
            ? isPhysicalSigning
              ? 'Tolak dan Kembalikan'
              : isDigitalWithoutLegal
                ? 'Tolak dan Batalkan'
                : 'Tolak ke Unit Legal'
            : 'Tolak Naskah'
        "
        :saving="savingAction"
        :require-note="true"
        :min-note-length="5"
        @confirm="handleReject"
      />

      <!-- Modal Kembalikan -->
      <ApprovalNoteEditor
        v-model="showReturnModal"
        variant="reject"
        :title="
          pendingAction === 'kembalikan-evaluasi'
            ? 'Kembalikan ke Legal Drafting'
            : 'Kembalikan Naskah'
        "
        :description="
          pendingAction === 'kembalikan-evaluasi'
            ? 'Naskah dikembalikan ke legal drafting agar drafter legal merevisi sesuai alasan Anda.'
            : 'Naskah akan dikembalikan ke pemrakarsa untuk diperbaiki.'
        "
        :note-placeholder="
          pendingAction === 'kembalikan-evaluasi'
            ? 'Tuliskan alasan pengembalian ke legal drafting (minimal 5 karakter)…'
            : 'Tuliskan alasan pengembalian (minimal 5 karakter)…'
        "
        confirm-label="Kembalikan"
        :saving="savingAction"
        :require-note="true"
        :min-note-length="5"
        @confirm="handleReturn"
      />

      <!-- Preview Dokumen (PDF iframe / DOCX renderAsync) — fullscreen, pola USlideover side="bottom" -->
      <USlideover
        v-model:open="previewOpen"
        title="Pratinjau Dokumen"
        description="Pratinjau dokumen"
        side="bottom"
        :ui="{
          content: 'h-[90vh] sm:h-screen max-h-screen rounded-t-2xl sm:rounded-none',
          body: 'p-0',
        }"
      >
        <template #body>
          <div class="w-full h-full relative bg-gray-100 dark:bg-gray-900 flex flex-col">
            <div
              v-if="previewLoading"
              class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10"
            >
              <UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6 text-primary-500" />
            </div>
            <iframe v-if="previewUrl" :src="previewUrl" class="w-full h-full border-0 bg-white" />
            <div
              v-else
              ref="previewDocxContainer"
              class="docx-preview-container w-full h-full overflow-auto"
            ></div>
          </div>
        </template>
      </USlideover>
    </template>

    <!-- Nested route outlet (legal-drafting, evaluasi, tanda-tangan, dll) -->
    <NuxtPage />
    <TugasQuickCreateModal
      v-if="!isChildRoute"
      v-model="showTugasQuickCreate"
      reference-type="naskah_lainnya"
      :reference-id="id"
      :reference-label="tugasReferenceLabel"
    />
  </div>
</template>

<style scoped>
:deep(.docx-preview-container) {
  padding: 16px;
}
:deep(.docx-wrapper) {
  background: #fff !important;
  padding: 0 !important;
}
:deep(.docx-wrapper > section.docx) {
  border: none !important;
  margin: 0 auto !important;
}

/* Konten catatan approval (HTML dari TinyMCE — pasal-pasal/batang tubuh) */
/* break-word: kata sangat panjang tanpa spasi tetap wrap di dalam panel,
   tidak meluber keluar section catatan. */
.approval-note-content {
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}
.approval-note-content :deep(p) {
  margin: 0 0 4px 0;
}
.approval-note-content :deep(p:last-child) {
  margin-bottom: 0;
}
.approval-note-content :deep(ol) {
  list-style: decimal;
  padding-left: 18px;
  margin: 2px 0;
}
.approval-note-content :deep(ul) {
  list-style: disc;
  padding-left: 18px;
  margin: 2px 0;
}
.approval-note-content :deep(li) {
  margin: 0 0 2px 0;
}
.approval-note-content :deep(table) {
  border-collapse: collapse;
  margin: 4px 0;
  width: 100%;
}
.approval-note-content :deep(td),
.approval-note-content :deep(th) {
  border: 1px solid rgba(0, 0, 0, 0.15);
  padding: 3px 6px;
}
.approval-note-content :deep(strong) {
  font-weight: 700;
}

/* Catatan timeline terlalu panjang: clamp + fade, tombol "Lihat selengkapnya" */
.note-clamped {
  max-height: 72px;
  overflow: hidden;
  position: relative;
}
.note-clamped::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 28px;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--note-fade-color, rgba(232, 239, 246, 0.95))
  );
  pointer-events: none;
}
.approval-note[class*='border-red'] .note-clamped::after {
  --note-fade-color: rgba(254, 242, 242, 0.95);
}
.dark .approval-note[class*='border-red'] .note-clamped::after {
  --note-fade-color: rgba(12, 22, 38, 0.95);
}
.dark .approval-note .note-clamped::after {
  --note-fade-color: rgba(5, 19, 33, 0.95);
}
</style>
