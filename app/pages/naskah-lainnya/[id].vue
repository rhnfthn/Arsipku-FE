<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { renderAsync } from 'docx-preview';
import { useNaskahLainnya } from '~/composables/useNaskahLainnya';
import type { ApprovalRow, DokumenFile, JenisAksi, NaskahDetail, RiwayatRow, StepperStep } from '~/types/naskah-lainnya';
import { JENIS_LABELS } from '~/types/naskah-lainnya';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';

definePageMeta({ layout: 'default', middleware: ['auth'] });
useHead({ title: 'Detail Naskah Lainnya' });

const route = useRoute();
const { t } = useI18n();
const { detail, pending, error, fetchDetail } = useNaskahLainnya();
const { apiGet } = useApi();
const { user } = useAuth();
const toast = useToast();

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

// ── Approval dikelompokkan per tahap (fase) — pemrakarsa & legal unit terpisah ──
const APPROVAL_TAHAP_ORDER = ['konsep', 'persetujuan', 'legal_drafting', 'evaluasi', 'persetujuan_direksi', 'blanko_verbal', 'tanda_tangan'];
const APPROVAL_TAHAP_LABEL: Record<string, string> = {
  konsep: 'Konsep',
  persetujuan: 'Approval Pemrakarsa',
  legal_drafting: 'Approval Legal Unit',
  evaluasi: 'Evaluasi',
  persetujuan_direksi: 'Persetujuan Direksi',
  blanko_verbal: 'Blanko Verbal',
  tanda_tangan: 'Tanda Tangan',
};
const tahapLabel = (t: string) => APPROVAL_TAHAP_LABEL[t] ?? t;

const approvalGroups = computed<{ tahap: string; label: string; rows: ApprovalRow[] }[]>(() => {
  const byTahap = detail.value?.approvalByTahap;
  let map: Record<string, ApprovalRow[]>;
  if (byTahap) {
    map = byTahap;
  } else {
    // Fallback: kelompokkan flat approval client-side (sebelum BE restart).
    map = {};
    for (const a of detail.value?.approval ?? []) (map[a.tahap] ??= []).push(a);
  }
  const present = Object.keys(map);
  const ordered = APPROVAL_TAHAP_ORDER.filter((k) => present.includes(k));
  const rest = present.filter((k) => !APPROVAL_TAHAP_ORDER.includes(k));
  return [...ordered, ...rest].map((k) => ({ tahap: k, label: tahapLabel(k), rows: map[k] ?? [] }));
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

const approvalStepGroups = computed(() =>
  approvalGroups.value.map((g) => ({
    tahap: g.tahap,
    label: g.label,
    steps: g.rows.map((a, index) => ({
      id: a.id || `${g.tahap}-${index}`,
      label: a.nama || `Verifikator ${index + 1}`,
      status: a.status,
      num: index + 1,
      ...stepStyle(a.status),
    })),
  })),
);

const progressLabel = computed(() => {
  const list = detail.value?.approval ?? [];
  const verified = list.filter((a) => a.status === 'verified').length;
  const total = list.length;
  if (verified === total) return 'Verifikasi selesai';
  const waiting = list.findIndex((a) => a.status === 'waiting');
  return waiting >= 0 ? `Verifikasi Tahap ${waiting + 1} dari ${total}` : `Verifikasi ${verified} dari ${total}`;
});

const isLastApprover = computed(() => {
  // Tahap-aware: hanya bandingkan baris pada tahap naskah saat ini, agar
  // approver legal & pemrakarsa sama-sama akurat (BE sort urutan ASC global →
  // baris persetujuan & legal_drafting interleaved di flat list).
  const tahapNow = detail.value?.tahapan;
  const rows = (detail.value?.approval ?? []).filter((a) => a.tahap === tahapNow);
  const waiting = rows
    .filter((a) => a.status === 'waiting')
    .sort((x, y) => x.urutan - y.urutan);
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
  ['legal_drafting', 'tanda_tangan_pemrakarsa', 'blanko_verbal', 'tanda_tangan_legal', 'tanda_tangan_pejabat'].includes(tahapan.value)
);
const canMulaiLegal = computed(() => tahapan.value === 'legal_drafting' && (detail.value?.availableActions ?? []).includes('kirim-approval-legal'));
const canTandaTangan = computed(() => (detail.value?.availableActions ?? []).includes('tanda-tangan'));
const canBuatBlanko = computed(() => tahapan.value === 'blanko_verbal' && (detail.value?.availableActions ?? []).includes('kirim-approval-blanko'));
// Buat Lembar Persetujuan Direksi: legal menyusun lembar di sub-page. Muncul saat
// evaluasi (alur normal: kirim = transisi ke PD) atau saat sudah di persetujuan_direksi
// tapi lembar belum dibuat (recovery). Gated by availableActions dari BE.
const canBuatLembarPersetujuanDireksi = computed(() => (detail.value?.availableActions ?? []).includes('kirim-lembar-persetujuan-direksi'));

// Approver legal dengan giliran aktif (baris waiting urutan terendah = milik user).
// availableActions=[] saat ada waiting legal rows → toolbar aksi hide, jadi butuh
// jalur sendiri untuk mengarahkan approver ke halaman legal-drafting (setuju/tolak).
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
  return !!(active.nama && user.value.nama && active.nama === user.value.nama);
});

const actionDescription = computed(() => {
  const t = tahapan.value;
  if (t === 'persetujuan') return isLastApprover.value ? 'Setujui untuk melanjutkan ke tahap berikutnya, atau tolak naskah ini.' : 'Setujui untuk meneruskan ke approver berikutnya, atau tolak.';
  if (t === 'legal_drafting') return 'Mulai legal drafting untuk meninjau naskah, atau kembalikan ke pemrakarsa.';
  if (t === 'evaluasi') return canBuatLembarPersetujuanDireksi.value
    ? 'Susun lembar persetujuan direksi, lalu kirim ke para direksi untuk paraf.'
    : 'Evaluasi naskah sebelum ditandatangani.';
  if (t === 'persetujuan_direksi') return canBuatLembarPersetujuanDireksi.value
    ? 'Susun lembar persetujuan direksi, lalu kirim ke para direksi untuk paraf.'
    : 'Menunggu paraf direksi.';
  if (t === 'tanda_tangan_pemrakarsa') return 'Tanda tangani naskah untuk melanjutkan.';
  if (t === 'blanko_verbal') return 'Buat blanko verbal untuk naskah ini.';
  if (t === 'tanda_tangan_legal') return 'Tanda tangani naskah sebagai legal.';
  if (t === 'tanda_tangan_pejabat') return 'Tanda tangani naskah sebagai pejabat.';
  if (t === 'tanda_tangan') return 'Tanda tangani naskah sebagai penandatangan aktif.';
  if (t === 'konsep') return 'Kirim naskah untuk persetujuan.';
  if (t === 'perlu_perbaikan') return 'Revisi naskah, lalu kirim ulang untuk persetujuan.';
  return 'Pilih aksi yang tersedia.';
});

// ── Toggle expand timeline ──
const timelineExpanded = ref(true);
const workflowExpanded = ref(true);

// ── Modal Setuju/Tolak (standarisasi VerifyActionModal) ──
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const showReturnModal = ref(false);
const savingAction = ref(false);
const pendingAction = ref<JenisAksi | null>(null);

// Nomor bersih untuk tampilan: sembunyikan placeholder mentah {{...}} (legacy scrape
// pra-Task-8 menangkap {{nomor}} dari template docx dan menyimpannya sebagai nomor).
// Konsumen beri fallback masing-masing ('—' untuk info row, 'Detail' untuk breadcrumb).
const nomorClean = computed(() => {
  const n = detail.value?.nomor;
  return n && !/\{\{[^}]*\}\}/.test(n) ? n : '';
});

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: '#' },
]);

onMounted(() => fetchDetail(id.value));

const errorMessage = computed(() => (error.value as any)?.response?.data?.message ?? 'Gagal memuat naskah.');

// ── Format helpers ──
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

// ── Dokumen tabs ──
const dokumenTab = ref(0);
const dokumenTabs = [
  { label: 'Naskah', icon: 'i-lucide-file-text' },
  { label: 'Naskah Fisik', icon: 'i-lucide-folder' },
  { label: 'Blanko Verbal', icon: 'i-lucide-file-check' },
  { label: 'Dok. Pendukung', icon: 'i-lucide-paperclip' },
  { label: 'Lembar PD', icon: 'i-lucide-stamp' },
];

const dokumenTerkait = computed<DokumenFile[]>(() => {
  if (!detail.value) return [];
  const all = detail.value.dokumen;
  if (!Array.isArray(all)) return [];
  const t = dokumenTab.value;
  const tipe = ['naskah', 'naskah_fisik', 'blanko_verbal', 'pendukung', 'lembar_persetujuan_direksi_pdf'][t];
  return all.filter((d) => d.tipe === tipe);
});

// Bangun URL proxy file naskah dari BE (`/naskah-lainnya/:id/file`).
// `fileUrl` dari BE adalah path proxy relatif. Fallback: bangun manual bila kosong.
function buildFileUrl(): string {
  const id_ = detail.value?.id || (route.params.id as string);
  const fu = detail.value?.fileUrl;
  if (fu) return fu;
  return `/naskah-lainnya/${id_}/file`;
}

async function fetchFileBlob(): Promise<{ blob: Blob; filename: string } | null> {
  const url = buildFileUrl();
  try {
    const blob = await apiGet(url, { responseType: 'blob' });
    const nama = detail.value?.dokumen.find((d) => d.tipe === 'naskah')?.nama
      || naskahFileName(detail.value);
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
  const isDocx = lower.endsWith('.docx');
  // reset state sebelumnya
  if (previewUrl.value) { window.URL.revokeObjectURL(previewUrl.value); previewUrl.value = null; }
  previewDocxBuffer.value = null;
  if (isPdf) {
    previewUrl.value = window.URL.createObjectURL(blob);
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
      const res = await fetchFileBlob();
      if (!res) { toast.add({ title: 'Gagal memuat pratinjau', color: 'error' }); return; }
      blob = res.blob;
    } else {
      // pendukung / naskah_fisik / blanko — download via BE proxy
      const id_ = detail.value?.id;
      blob = await apiGet(`/naskah-lainnya/${id_}/dokumen/${d.id}/download`, { responseType: 'blob' });
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
watch(previewOpen, (open) => { if (!open) closePreview(); });

async function download(d) {
  try {
    let blob;
    if (d.tipe === 'naskah') {
      const res = await fetchFileBlob();
      if (!res) { toast.add({ title: 'Gagal mengunduh', color: 'error' }); return; }
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
      blob = await apiGet(`/naskah-lainnya/${id_}/dokumen/${d.id}/download`, { responseType: 'blob' });
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
    const blob = await apiGet(`/naskah-lainnya/${id_}/dokumen/${dokumenId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(blob as Blob);
    const a = document.createElement('a');
    a.href = url;
    const d = detail.value?.dokumen.find((x) => x.id === dokumenId);
    a.download = d?.nama ?? 'naskah.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  } catch {
    toast.add({ title: 'Gagal mengunduh', color: 'error' });
  }
}

// ── Action metadata ──
const ACTION_META: Record<JenisAksi, { label: string; icon: string; color: 'primary' | 'success' | 'error' | 'warning' | 'neutral'; to?: string | ((id: string) => string); variant?: 'approve' | 'reject' | 'return' }> = {
  kirim: { label: 'Kirim untuk Approval', icon: 'i-lucide-send', color: 'primary' },
  edit: { label: 'Edit Naskah', icon: 'i-lucide-pencil', color: 'neutral', to: '/naskah-lainnya/tulis' },
  setuju: { label: 'Setujui', icon: 'i-lucide-check', color: 'success', variant: 'approve' },
  tolak: { label: 'Tolak', icon: 'i-lucide-x', color: 'error', variant: 'reject' },
  kembalikan: { label: 'Kembalikan', icon: 'i-lucide-undo-2', color: 'warning', variant: 'return' },
  'mulai-legal': { label: 'Mulai Legal Drafting', icon: 'i-lucide-file-pen', color: 'primary', to: (id: string) => `/naskah-lainnya/${id}/legal-drafting` },
  'kirim-approval-legal': { label: 'Kirim Approval Legal', icon: 'i-lucide-send', color: 'primary', to: (id: string) => `/naskah-lainnya/${id}/legal-drafting` },
  'kembalikan-legal': { label: 'Kembalikan ke Pemrakarsa', icon: 'i-lucide-undo-2', color: 'error', variant: 'return' },
  evaluasi: { label: 'Evaluasi', icon: 'i-lucide-clipboard-check', color: 'primary' },
  'kembalikan-evaluasi': { label: 'Kembalikan ke Legal', icon: 'i-lucide-undo-2', color: 'warning', variant: 'return' },
  'simpan-blanko': { label: 'Buat Blanko Verbal', icon: 'i-lucide-file-check', color: 'primary', to: (id: string) => `/naskah-lainnya/${id}/blanko-verbal` },
  'kirim-approval-blanko': { label: 'Kirim Approval Blanko', icon: 'i-lucide-send', color: 'primary', to: (id: string) => `/naskah-lainnya/${id}/blanko-verbal` },
  'tanda-tangan': { label: 'Tanda Tangani', icon: 'i-lucide-pen-tool', color: 'primary', to: (id: string) => `/naskah-lainnya/${id}/tanda-tangan` },
};

const actionLabel = (a: JenisAksi) => ACTION_META[a]?.label ?? a;
const actionIcon = (a: JenisAksi) => ACTION_META[a]?.icon ?? 'i-lucide-arrow-right';
const actionColor = (a: JenisAksi) => ACTION_META[a]?.color ?? 'primary';
const actionTo = (a: JenisAksi) => { const t = ACTION_META[a]?.to; return typeof t === 'function' ? t(route.params.id as string) : (t ?? undefined); };

// ── Action execution ──
// Baris approval aktif (giliran berjenjang): waiting urutan terendah pada tahap
// naskah saat ini. Dipakai setuju/tolak persetujuan maupun legal_drafting.
function activeApprovalRow() {
  const tahapNow = detail.value?.tahapan;
  return detail.value?.approval
    .filter((ap) => ap.status === 'waiting' && ap.tahap === tahapNow)
    .sort((x, y) => x.urutan - y.urutan)[0];
}

function openActionModal(a: JenisAksi) {
  const meta = ACTION_META[a];
  if (!meta) return;
  if (meta.to) {
    navigateTo(actionTo(a) as string);
    return;
  }
  pendingAction.value = a;
  if (a === 'setuju') {
    showApproveModal.value = true;
  } else if (a === 'tolak') {
    showRejectModal.value = true;
  } else if (a === 'kembalikan' || a === 'kembalikan-legal' || a === 'kembalikan-evaluasi') {
    showReturnModal.value = true;
  } else if (a === 'kirim') {
    showApproveModal.value = true;
  } else if (a === 'evaluasi') {
    showApproveModal.value = true;
  }
}

async function handleApprove(catatan: string) {
  const a = pendingAction.value;
  if (!a) return;
  const naskahId = id.value;
  savingAction.value = true;
  try {
    const nl = useNaskahLainnya();
    if (a === 'setuju') {
      const approval = activeApprovalRow();
      if (approval) await nl.setuju(naskahId, approval.id, catatan || undefined);
    } else if (a === 'kirim') {
      await nl.kirim(naskahId);
    } else if (a === 'evaluasi') {
      await nl.evaluasi(naskahId, { sesuai: true, checklist: [], catatan: catatan || undefined });
    }
    toast.add({ title: 'Berhasil', description: `${actionLabel(a)} berhasil`, color: 'success' });
    showApproveModal.value = false;
    await fetchDetail(naskahId);
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: err?.response?.data?.message ?? err?.message ?? 'Terjadi kesalahan', color: 'error' });
  } finally {
    savingAction.value = false;
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
    if (a === 'tolak') {
      const approval = activeApprovalRow();
      if (approval) await nl.tolak(naskahId, approval.id, catatan);
    } else if (a === 'evaluasi') {
      await nl.evaluasi(naskahId, { sesuai: false, checklist: [], catatan: catatan || undefined });
    }
    toast.add({ title: 'Berhasil', description: `${actionLabel(a)} berhasil`, color: 'success' });
    showRejectModal.value = false;
    await fetchDetail(naskahId);
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: err?.response?.data?.message ?? err?.message ?? 'Terjadi kesalahan', color: 'error' });
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
    toast.add({ title: 'Gagal', description: err?.response?.data?.message ?? err?.message ?? 'Terjadi kesalahan', color: 'error' });
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
  return detail.value.riwayat.map((r: RiwayatRow) => {
    const isPositive = r.aksi === 'kirim' || r.aksi === 'setuju' || r.aksi === 'tanda-tangan' || r.aksi === 'evaluasi';
    const isNegative = r.aksi === 'tolak' || r.aksi === 'kembalikan' || r.aksi === 'kembalikan-legal' || r.aksi === 'kembalikan-evaluasi';
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
  }).reverse();
});

// ── Next action info (status terkini) ──
const nextActionInfo = computed(() => {
  if (!detail.value) return null;
  const tahapan = detail.value.tahapan;
  if (tahapan === 'selesai') return { label: 'Naskah selesai', oleh: '', jabatan: '' };
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

// ── Ikon status terkini (terminal state → check/x, lainnya → clock) ──
const nextActionIcon = computed(() => {
  const t = detail.value?.tahapan;
  if (t === 'selesai') return { icon: 'i-lucide-check', bg: 'bg-green-500 dark:bg-green-600', text: 'text-white' };
  if (t === 'ditolak') return { icon: 'i-lucide-x', bg: 'bg-red-500 dark:bg-red-600', text: 'text-white' };
  if (t === 'dibatalkan') return { icon: 'i-lucide-ban', bg: 'bg-gray-400 dark:bg-gray-500', text: 'text-white' };
  return { icon: 'i-lucide-clock', bg: 'bg-gray-300 dark:bg-gray-600', text: 'text-white' };
});

// ── Stepper: hilangkan step 'skip' (mode tanpa legal) & renumber 1..M ──
// BE buildStepper seharusnya sudah memfilter skip, tapi guard di FE agar UI
// tetap benar walau BE lama masih mengirim status:'skip'.
const visibleStepper = computed(() => {
  if (!detail.value?.stepper) return [];
  return detail.value.stepper
    .filter((s) => s.status !== 'skip')
    .map((s, i) => ({ ...s, step: i + 1 }));
});

// ── Stepper status styling ──
function stepperIconClass(s: StepperStep) {
  if (s.status === 'done') return 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (s.status === 'active') return 'bg-primary-500 border-primary-500 text-white';
  return 'bg-white dark:bg-gray-800 border-gray-300 text-gray-400 dark:border-gray-600';
}

function stepperLabelClass(s: StepperStep) {
  if (s.status === 'done') return 'text-gray-600 dark:text-gray-400';
  if (s.status === 'active') return 'text-primary-600 dark:text-primary-400 font-semibold';
  return 'text-gray-400 dark:text-gray-500';
}

// ── Jenis label ──
const jenisLabel = computed(() => detail.value ? (JENIS_LABELS[detail.value.jenis] ?? detail.value.jenis) : '');

// ── Sifat label ──
const SIFAT_LABELS: Record<string, string> = {
  sangat_rahasia: 'Sangat Rahasia', rahasia: 'Rahasia', terbatas: 'Terbatas',
  biasa: 'Biasa', terbuka: 'Terbuka',
};
const sifatLabel = computed(() => detail.value ? (SIFAT_LABELS[detail.value.sifat] ?? detail.value.sifat) : '');

// ── Sign option label ──
const SIGN_LABELS: Record<string, string> = {
  digsig: 'Tanda Tangan Digital (BSrE)', qr_only: 'QR Code',
  ttd_basah: 'Tanda Tangan Basah', tanpa_ttd: 'Tanpa Tanda Tangan',
};
const signLabel = computed(() => detail.value ? (SIGN_LABELS[detail.value.signOption] ?? detail.value.signOption) : '');
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <template v-if="!isChildRoute">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
            {{ detail?.perihal ?? 'Draf Naskah' }}
          </h1>
          <StatusBadge v-if="detail" :status="detail.tahapan" />
        </div>
      </template>
      <template #subtitle>
        <p v-if="detail" class="text-sm text-gray-500 dark:text-gray-400">{{ detail.perihal }}</p>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="pending && !detail" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="mx-auto max-w-2xl">
      <div class="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 py-12 text-center dark:border-red-500/30 dark:bg-red-500/10">
        <UIcon name="i-lucide-circle-alert" class="size-12 text-red-400" />
        <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        <UButton color="primary" variant="soft" icon="i-lucide-arrow-left" to="/naskah-lainnya">Kembali ke Daftar</UButton>
      </div>
    </div>

    <main v-else-if="detail" class="mx-auto max-w-480 space-y-4">
      <!-- Langkah Verifikasi (stepper horizontal dari approval berjenjang) -->
      <!-- Hanya tampil untuk verifikator/approver, bukan pemrakarsa -->
      <section v-if="approvalStepGroups.length && !isPemrakarsa" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <UIcon name="i-lucide-route" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Langkah Verifikasi</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Progress persetujuan naskah.</p>
          </div>
          <span class="ml-auto inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            {{ progressLabel }}
          </span>
        </div>
        <div class="space-y-4 px-5 py-5">
          <div v-for="group in approvalStepGroups" :key="group.tahap">
            <div class="mb-2 flex items-center gap-2">
              <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ group.label }}</span>
              <span class="text-xs text-gray-400">· {{ group.steps.length }}</span>
              <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
            </div>
            <div class="overflow-x-auto">
              <div class="flex min-w-[400px] items-center px-1 py-2">
                <template v-for="(step, index) in group.steps" :key="step.id">
                  <div class="flex min-w-36 items-center gap-3">
                    <div class="flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold" :class="step.className">
                      <UIcon v-if="step.status === 'verified'" name="i-lucide-check" class="size-5" />
                      <UIcon v-else-if="step.status === 'rejected'" name="i-lucide-x" class="size-5" />
                      <span v-else>{{ step.num }}</span>
                    </div>
                    <span class="text-sm font-semibold" :class="step.textClass">{{ step.label }}</span>
                  </div>
                  <div v-if="index < group.steps.length - 1" class="mx-4 h-0.5 min-w-12 flex-1 bg-gray-300 dark:bg-gray-600" />
                </template>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2-column layout: info kiri, flow/status kanan -->
      <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <!-- KIRI: Informasi Naskah + Dokumen + Approval -->
        <div class="space-y-4 xl:col-span-2">
          <!-- Informasi Naskah -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-file-text" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Naskah</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Detail metadata naskah.</p>
              </div>
            </div>
            <dl class="grid grid-cols-1 gap-x-8 px-5 sm:grid-cols-2">
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-hash" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Nomor</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ nomorClean || '—' }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-file-stack" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Jenis</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ jenisLabel }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700 sm:col-span-2">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-message-square" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Perihal</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ detail.perihal || '—' }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-user" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Pemrakarsa</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ detail.pemrakarsa.nama }}</dd>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ personaMeta(detail.pemrakarsa) }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-calendar" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tanggal</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ fmtDate(detail.tanggal) }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-shield" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Klasifikasi</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ detail.klasifikasi }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-lock" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Sifat</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ sifatLabel }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-scale" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Butuh Legal</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ detail.butuhLegal ? 'Ya' : 'Tidak' }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 py-3">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-signature" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Opsi TTD</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ signLabel }}</dd>
                </div>
              </div>
            </dl>
          </div>

          <!-- Dokumen -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-paperclip" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div class="flex-1">
                <h2 class="font-semibold text-gray-900 dark:text-white">Dokumen</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Dokumen terkait naskah.</p>
              </div>
            </div>
            <!-- Sub-tabs -->
            <div class="flex gap-1 px-4 pt-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
              <button
                v-for="(tab, i) in dokumenTabs"
                :key="tab.label"
                @click="dokumenTab = i"
                class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap"
                :class="dokumenTab === i
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              >
                <UIcon :name="tab.icon" class="size-3.5" />
                {{ tab.label }}
              </button>
            </div>
            <div class="p-4">
              <NaskahVersiTimeline
                v-if="dokumenTab === 0"
                :items="dokumenTerkait"
                @lihat="lihatVersi"
                @unduh="unduhVersi"
              />
              <template v-else>
                <div v-if="dokumenTerkait.length === 0" class="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500">
                  <UIcon name="i-lucide-inbox" class="size-8" />
                  <span class="text-sm">Belum ada dokumen.</span>
                </div>
                <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                  <button
                    v-for="d in dokumenTerkait"
                    :key="d.id"
                    @click="preview(d)"
                    class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 dark:hover:border-primary-500 transition-all text-center flex flex-col overflow-hidden group"
                  >
                    <div class="p-2">
                      <div class="h-24 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex flex-col items-center justify-center gap-1 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                        <UIcon name="i-lucide-file-text" class="size-8 text-red-500" />
                        <span class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ d.tipe === 'naskah' ? 'DOCX' : d.nama.split('.').pop()?.toUpperCase() || 'FILE' }}</span>
                      </div>
                    </div>
                    <div class="px-2 pb-2 flex-1 flex items-center justify-center">
                      <p class="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-2 break-all leading-tight">{{ d.nama }}</p>
                    </div>
                  </button>
                </div>
                <div v-if="dokumenTerkait.length > 0" class="mt-3 flex justify-end">
                  <div class="flex gap-1">
                    <UButton v-for="d in dokumenTerkait" :key="d.id" icon="i-lucide-download" color="neutral" variant="ghost" size="xs" @click="download(d)" />
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Approval Chain -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-users" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Approval</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Daftar approver berjenjang.</p>
              </div>
            </div>
            <div class="px-4 py-3">
              <div v-if="detail.approval.length === 0" class="flex items-center gap-2 py-4 text-sm text-gray-400 dark:text-gray-500">
                <UIcon name="i-lucide-inbox" class="size-4" />
                <span>Belum ada baris approval.</span>
              </div>
              <div v-else class="space-y-4">
                <div v-for="group in approvalGroups" :key="group.tahap" class="space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ group.label }}</span>
                    <span class="text-xs text-gray-400">· {{ group.rows.length }}</span>
                    <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                  </div>
                  <div
                    v-for="(a, i) in group.rows"
                    :key="a.id"
                    class="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-700"
                  >
                    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-300">{{ i + 1 }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ a.nama }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ personaMeta(a) }}</p>
                      <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">urutan {{ a.urutan }} · {{ fmtDateTime(a.tanggal) }}</p>
                      <p v-if="a.catatan" class="mt-1 text-xs italic text-gray-400 dark:text-gray-500">"{{ a.catatan }}"</p>
                    </div>
                    <StatusBadge :status="a.status" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Penandatangan -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-pen-tool" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Penandatangan</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Daftar penandatangan naskah.</p>
              </div>
            </div>
            <div class="px-4 py-3">
              <div v-if="penandatanganList.length === 0" class="flex items-center gap-2 py-4 text-sm text-gray-400 dark:text-gray-500">
                <UIcon name="i-lucide-inbox" class="size-4" />
                <span>Belum ada penandatangan.</span>
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="(p, i) in penandatanganList"
                  :key="i"
                  class="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-700"
                >
                  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-300">{{ i + 1 }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ p.nama }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ personaMeta(p) }}</p>
                  </div>
                  <UIcon name="i-lucide-signature" class="size-4 text-gray-400 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- KANAN: Status Workflow + Timeline -->
        <aside class="space-y-4">
          <!-- Status Workflow (Stepper) -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button type="button" @click="workflowExpanded = !workflowExpanded" class="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-workflow" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div class="flex-1">
                <h2 class="font-semibold text-gray-900 dark:text-white">Status Workflow</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Tahapan naskah.</p>
              </div>
              <UIcon :name="workflowExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-5 shrink-0 text-gray-400" />
            </button>
            <div v-show="workflowExpanded" class="px-5 py-4">
              <!-- Next action info -->
              <div v-if="nextActionInfo" class="mb-4 flex gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-700">
                <div class="flex flex-col items-center">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-800" :class="nextActionIcon.bg">
                    <UIcon :name="nextActionIcon.icon" class="size-3.5" :class="nextActionIcon.text" />
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ nextActionInfo.jabatan ? nextActionInfo.jabatan + ' — ' : '' }}{{ nextActionInfo.oleh || 'Status' }}</p>
                  <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{{ nextActionInfo.label }}</p>
                </div>
              </div>

              <!-- Stepper -->
              <ol class="relative flex flex-col gap-0">
                <li v-for="(s, i) in visibleStepper" :key="s.step" class="flex gap-3">
                  <div class="flex flex-col items-center">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 shrink-0" :class="stepperIconClass(s)">
                      <UIcon v-if="s.status === 'done'" name="i-lucide-check" class="size-3" />
                      <span v-else>{{ s.step }}</span>
                    </div>
                    <div v-if="i < visibleStepper.length - 1" class="w-0.5 flex-1 min-h-4 border-l border-dashed border-gray-300 dark:border-gray-700" :class="s.status === 'done' ? 'border-green-400!' : ''" />
                  </div>
                  <div class="pb-4 text-sm">
                    <span class="font-medium" :class="stepperLabelClass(s)">{{ s.label }}</span>
                    <span v-if="s.status === 'active'" class="ml-2 text-xs text-primary-500">● berjalan</span>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <!-- Timeline Riwayat -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button type="button" @click="timelineExpanded = !timelineExpanded" class="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-route" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div class="flex-1 min-w-0">
                <h2 class="font-semibold text-gray-900 dark:text-white">Timeline Riwayat</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Riwayat alur naskah.</p>
              </div>
              <UIcon :name="timelineExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-5 shrink-0 text-gray-400" />
            </button>
            <div v-show="timelineExpanded" class="px-4 py-3">
              <div v-if="timelineEntries.length === 0" class="flex items-center gap-2 py-4 text-sm text-gray-400 dark:text-gray-500">
                <UIcon name="i-lucide-inbox" class="size-4" />
                <span>Belum ada riwayat.</span>
              </div>
              <ol v-else class="max-h-112 space-y-3 overflow-y-auto pr-1">
                <li v-for="(entry, idx) in timelineEntries" :key="entry.id" class="flex gap-2.5">
                  <div class="flex flex-col items-center">
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-800" :class="entry.iconBg">
                      <UIcon :name="entry.icon" class="size-3.5 text-white" />
                    </span>
                    <span v-if="idx < timelineEntries.length - 1" class="mt-0.5 w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div class="min-w-0 flex-1 pb-2">
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-xs font-semibold text-gray-900 dark:text-white">{{ entry.jabatan ? entry.jabatan + ' — ' : '' }}{{ entry.title }}</p>
                      <span class="shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium" :class="entry.actionColor">{{ entry.action }}</span>
                    </div>
                    <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{{ fmtDateTime(entry.timestamp) }}</p>
                    <p v-if="entry.catatan" class="mt-1 rounded bg-gray-50 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                      <span class="font-medium">Catatan:</span> {{ entry.catatan }}
                    </p>
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
        class="overflow-hidden rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-5 shadow-sm dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
              <UIcon name="i-lucide-file-check-2" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Persetujuan Legal Menunggu Anda</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Tinjau naskah dan berikan persetujuan berjenjang pada giliran Anda.</p>
            </div>
          </div>
          <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <UButton
              color="error"
              variant="outline"
              icon="i-lucide-circle-x"
              size="lg"
              class="w-full sm:w-auto"
              :loading="pendingAction === 'tolak' && savingAction"
              @click="openActionModal('tolak')"
            >Tolak</UButton>
            <UButton
              color="primary"
              icon="i-lucide-check"
              size="lg"
              class="font-semibold w-full sm:w-auto"
              :loading="pendingAction === 'setuju' && savingAction"
              @click="openActionModal('setuju')"
            >Proses Persetujuan Legal</UButton>
          </div>
        </div>
      </section>

      <!-- Selesai toolbar: link kembali ke halaman selesai (naskah sudah final,
           availableActions kosong → pengganti action toolbar). -->
      <section v-if="detail.tahapan === 'selesai'" class="overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm dark:border-green-900/40 dark:from-green-900/20 dark:to-gray-800">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
              <UIcon name="i-lucide-circle-check-big" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Naskah Selesai</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Naskah telah diselesaikan. Lihat dokumen final &amp; ringkasan penandatangan.</p>
            </div>
          </div>
          <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <UButton
              color="primary"
              size="lg"
              icon="i-lucide-eye"
              class="w-full font-semibold shadow-lg shadow-primary-500/20 sm:w-auto"
              :to="`/naskah-lainnya/${detail.id}/selesai`"
            >Lihat Halaman Selesai</UButton>
          </div>
        </div>
      </section>

      <!-- Action toolbar (di paling bawah) -->
      <section v-if="detail.availableActions.length" class="overflow-hidden rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-5 shadow-sm dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
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
            <!-- Approval actions: Tolak + Setujui (untuk persetujuan) -->
            <UButton
              v-if="detail.availableActions.includes('setuju') || detail.availableActions.includes('kembalikan')"
              class="w-full sm:w-auto"
              color="error"
              variant="outline"
              size="lg"
              icon="i-lucide-circle-x"
              :loading="savingAction"
              @click="openActionModal('tolak')"
            >Tolak</UButton>
            <UButton
              v-if="detail.availableActions.includes('setuju')"
              class="w-full sm:w-auto"
              color="primary"
              size="lg"
              icon="i-lucide-arrow-right"
              :loading="savingAction"
              @click="openActionModal('setuju')"
            >Setujui</UButton>

            <!-- Mulai Legal Drafting: aktif di legal_drafting, hide di tahap lain -->
            <UButton
              v-if="canMulaiLegal"
              color="primary"
              icon="i-lucide-file-pen"
              size="lg"
              class="font-semibold w-full sm:w-auto"
              :to="`/naskah-lainnya/${id}/legal-drafting`"
            >Mulai Legal Drafting</UButton>

            <!-- Tanda Tangan: aktif di tanda_tangan_*, tampilkan di tahap tanda tangan -->
            <UButton
              v-if="canTandaTangan"
              color="primary"
              icon="i-lucide-pen-tool"
              size="lg"
              class="font-semibold w-full sm:w-auto"
              :to="`/naskah-lainnya/${id}/tanda-tangan`"
            >Tanda Tangan</UButton>

            <!-- Buat Blanko Verbal: aktif di blanko_verbal, hide di tahap lain -->
            <UButton
              v-if="canBuatBlanko"
              color="primary"
              icon="i-lucide-file-check"
              size="lg"
              class="font-semibold w-full sm:w-auto"
              :to="`/naskah-lainnya/${id}/blanko-verbal`"
            >Buat Blanko Verbal</UButton>

            <!-- Buat Lembar Persetujuan Direksi: legal menyusun lembar saat evaluasi (butuhLegal) -->
            <UButton
              v-if="canBuatLembarPersetujuanDireksi"
              color="primary"
              icon="i-lucide-file-signature"
              size="lg"
              class="font-semibold w-full sm:w-auto"
              :to="`/naskah-lainnya/${id}/persetujuan-direksi`"
            >Buat Lembar Persetujuan Direksi</UButton>

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
            >Kembalikan</UButton>

            <!-- Edit Naskah (perlu_perbaikan — pemrakarsa revisi sebelum kirim ulang) -->
            <UButton
              v-if="tahapan === 'perlu_perbaikan'"
              class="w-full sm:w-auto"
              color="neutral"
              variant="outline"
              size="lg"
              icon="i-lucide-pencil"
              :to="`/naskah-lainnya/tulis?draft_id=${id}`"
            >Edit Naskah</UButton>

            <!-- Kirim (konsep/perlu_perbaikan) -->
            <UButton
              v-if="detail.availableActions.includes('kirim')"
              color="primary"
              icon="i-lucide-send"
              size="lg"
              class="font-semibold w-full sm:w-auto"
              :loading="pendingAction === 'kirim' && savingAction"
              @click="openActionModal('kirim')"
            >Kirim</UButton>

            <!-- Evaluasi -->
            <UButton
              v-if="detail.availableActions.includes('evaluasi')"
              color="primary"
              icon="i-lucide-clipboard-check"
              size="lg"
              class="font-semibold w-full sm:w-auto"
              :loading="pendingAction === 'evaluasi' && savingAction"
              @click="openActionModal('evaluasi')"
            >Evaluasi</UButton>

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
            >Kembalikan ke Legal</UButton>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal Setuju (standarisasi VerifyActionModal) -->
    <VerifyActionModal
      v-model="showApproveModal"
      variant="approve"
      :title="pendingAction === 'evaluasi' ? 'Evaluasi Naskah' : pendingAction === 'kirim' ? 'Kirim Naskah' : 'Setujui Naskah'"
      :description="pendingAction === 'evaluasi'
        ? 'Periksa naskah dan hasil legal drafting (jika ada). Setujui jika naskah sesuai untuk dilanjutkan ke tanda tangan.'
        : pendingAction === 'kirim'
          ? 'Naskah akan dikirim untuk persetujuan.'
          : isLastApprover
            ? 'Anda akan menyetujui naskah ini. Naskah dilanjutkan ke tahap berikutnya setelah seluruh approver menyetujui.'
            : 'Anda akan menyetujui naskah ini dan meneruskannya ke approver berikutnya.'"
      note-placeholder="Tuliskan catatan persetujuan (opsional)…"
      :confirm-label="pendingAction === 'evaluasi' ? 'Ya, Setujui' : pendingAction === 'kirim' ? 'Kirim' : 'Ya, Setujui'"
      :saving="savingAction"
      :require-note="false"
      @confirm="handleApprove"
    />

    <!-- Modal Tolak (standarisasi VerifyActionModal) -->
    <VerifyActionModal
      v-model="showRejectModal"
      variant="reject"
      title="Tolak Naskah"
      description="Penolakan akan mengembalikan naskah ke pemrakarsa untuk diperbaiki."
      warning="Naskah dikembalikan ke pemrakarsa dan dapat direvisi kemudian."
      note-placeholder="Tuliskan alasan penolakan (minimal 5 karakter)…"
      confirm-label="Tolak Naskah"
      :saving="savingAction"
      :require-note="true"
      :min-note-length="5"
      @confirm="handleReject"
    />

    <!-- Modal Kembalikan (standarisasi VerifyActionModal) -->
    <VerifyActionModal
      v-model="showReturnModal"
      variant="reject"
      :title="pendingAction === 'kembalikan-evaluasi' ? 'Kembalikan ke Legal Drafting' : 'Kembalikan Naskah'"
      :description="pendingAction === 'kembalikan-evaluasi'
        ? 'Naskah dikembalikan ke legal drafting agar drafter legal merevisi sesuai alasan Anda.'
        : 'Naskah akan dikembalikan ke pemrakarsa untuk diperbaiki.'"
      :note-placeholder="pendingAction === 'kembalikan-evaluasi'
        ? 'Tuliskan alasan pengembalian ke legal drafting (minimal 5 karakter)…'
        : 'Tuliskan alasan pengembalian (minimal 5 karakter)…'"
      confirm-label="Kembalikan"
      :saving="savingAction"
      :require-note="true"
      :min-note-length="5"
      @confirm="handleReturn"
    />

    <!-- Preview Dokumen (PDF iframe / DOCX renderAsync) -->
    <UModal v-model:open="previewOpen" :ui="{ content: 'max-w-4xl' }">
      <template #content>
        <div class="flex flex-col h-[85vh]">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Pratinjau Dokumen</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="closePreview" />
          </div>
          <div class="flex-1 overflow-hidden relative bg-gray-100 dark:bg-gray-900">
            <div v-if="previewLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
              <UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6 text-primary-500" />
            </div>
            <iframe v-if="previewUrl" :src="previewUrl" class="w-full h-full border-0 bg-white" />
            <div v-else ref="previewDocxContainer" class="docx-preview-container w-full h-full overflow-auto"></div>
          </div>
        </div>
      </template>
    </UModal>
    </template>

    <!-- Nested route outlet (legal-drafting, evaluasi, tanda-tangan, dll) -->
    <NuxtPage />
  </div>
</template>

<style scoped>
:deep(.docx-preview-container) { padding: 16px; }
:deep(.docx-wrapper) { background: #fff !important; padding: 0 !important; }
:deep(.docx-wrapper > section.docx) {
  border: none !important;
  margin: 0 auto !important;
}
</style>

