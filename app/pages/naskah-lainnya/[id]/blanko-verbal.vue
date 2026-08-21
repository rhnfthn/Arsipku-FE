<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { renderAsync } from 'docx-preview';
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';
import BlankoVerbalTemplate from '~/components/NaskahLainnya/BlankoVerbalTemplate.vue';
import DireksiApprovalProgress from '~/components/NaskahLainnya/DireksiApprovalProgress.vue';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';

import type {
  SheetFormModel, DirectorApprovalItem, ApprovalRow, DokumenFile, JenisNaskah, RiwayatRow,
} from '~/types/naskah-lainnya';
import { JENIS_LABELS } from '~/types/naskah-lainnya';

definePageMeta({ layout: 'default', middleware: ['auth'] });
useHead({ title: 'Blanko Verbal' });

const route = useRoute();
const id = computed(() => route.params.id as string);
const { t } = useI18n();
const toast = useToast();
const { user, getProfile } = useAuth();
const { canAccessPage } = useFeatureAccess();
const { apiGet } = useApi();

const {
  detail, fetchDetail,
  fetchBodDirectors, previewBlankoVerbal,
  kirimBlankoVerbal, parafBlankoVerbal,
  tolakBlankoVerbal, kirimApprovalBlanko,
  deleteDokumenTambahan,
} = useNaskahLainnya();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: `/naskah-lainnya/${id.value}` },
  { label: 'Blanko Verbal', to: '#' },
]);

const isLoadingData = ref(true);
const loadingMessage = ref('');
const busy = ref(false);
const catatan = ref('');
const bodDirectors = ref<DirectorApprovalItem[]>([]);
const dokumenPendukung = ref<DokumenFile[]>([]);

const pdfModalOpen = ref(false);
const pdfUrl = ref('');

const previewSlideOpen = ref(false);

const parafModalOpen = ref(false);
const tolakModalOpen = ref(false);
const advanceModalOpen = ref(false);
const parafCatatan = ref('');
const tolakCatatan = ref('');
const activeDirector = ref<DirectorApprovalItem | null>(null);


const form = ref<SheetFormModel>({
  lampiran: '1 (satu) berkas',
  bodyHtml: '<p>Dengan hormat,</p><p>Bersama ini disampaikan blanko verbal terkait hal tersebut di atas.</p>',
});

const tinyMceInit = computed(() => ({
  base_url: '/tinymce',
  suffix: '.min',
  height: 320,
  menubar: false,
  branding: false,
  promotion: false,
  plugins: 'lists advlist link code table',
  toolbar:
    'undo redo | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | code',
  content_style: 'body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; }',
  readonly: !isEditable.value,
}));

const isBlankoVerbal = computed(() => detail.value?.tahapan === 'blanko_verbal');

const bvRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'blanko_verbal'),
);

const bvDirectors = computed(() =>
  bvRows.value.map((a, idx) => ({
    index: a.urutan ?? idx + 1,
    nama: a.nama,
    jabatan: a.jabatan,
    status: a.status,
    positionId: a.positionId,
    persnum: a.persnum,
    catatan: a.catatan,
  })),
);

const allBvVerified = computed(() =>
  bvRows.value.length > 0 && bvRows.value.every((r) => r.status === 'verified'),
);

const isCompleted = computed(() => allBvVerified.value);
const isEditable = computed(() => isBlankoVerbal.value && !isCompleted.value);

const rejectedPersetujuanDireksiRow = computed(() => {
  const r = detail.value?.riwayat ?? [];
  const last = r.length ? r[r.length - 1] : null;
  return last?.aksi === 'tolak' && last?.tahap === 'persetujuan_direksi' ? last : null;
});

function isUserApprover(row: ApprovalRow) {
  if (row.status !== 'waiting') return false;
  const u = user.value;
  if (!u) return false;
  const uid = String(u.persnum ?? '').trim();
  const pos = String(u.position_id ?? u.position ?? '').trim();
  const nama = (u.nama ?? '').trim().toLowerCase();
  return (
    (row.persnum && String(row.persnum) === uid) ||
    (row.positionId && String(row.positionId) === pos) ||
    (row.nama && row.nama.trim().toLowerCase() === nama)
  );
}

function directorCanAct(director: DirectorApprovalItem) {
  if (director.status !== 'waiting') return false;
  const u = user.value;
  if (!u) return false;
  const uid = String(u.persnum ?? '').trim();
  const pos = String(u.position_id ?? u.position ?? '').trim();
  const nama = (u.nama ?? '').trim().toLowerCase();
  return (
    (director.persnum && String(director.persnum) === uid) ||
    (director.positionId && String(director.positionId) === pos) ||
    (director.nama && director.nama.trim().toLowerCase() === nama)
  );
}

const isCurrentUserApprover = computed(() => bvRows.value.some(isUserApprover));
const canApprove = computed(() => isCurrentUserApprover.value);

function buildInitialForm() {
  const d = detail.value;
  const u = user.value;
  if (!d) return;
  form.value.tanggal = form.value.tanggal ?? d.tanggal;
  form.value.nomor = form.value.nomor ?? d.nomor ?? '';
  form.value.perihal = form.value.perihal ?? d.perihal ?? '';
  form.value.diusulkanOleh = form.value.diusulkanOleh ?? d.pemrakarsa?.nama ?? '';
  form.value.jabatanDiusulkan = form.value.jabatanDiusulkan ?? d.pemrakarsa?.jabatan ?? '';
  form.value.klasifikasi = form.value.klasifikasi ?? d.klasifikasi ?? '';
  form.value.referensiDari = form.value.referensiDari ?? d.pemrakarsa?.nama ?? '';
  form.value.alamatInfo = form.value.alamatInfo ?? u?.alamatInfo;
  form.value.lampiran = form.value.lampiran ?? '1 (satu) berkas';
  form.value.bodyHtml = form.value.bodyHtml ?? '<p>Dengan hormat,</p><p>Bersama ini disampaikan blanko verbal terkait hal tersebut di atas.</p>';
}

async function fetchCurrentUserInfo() {
  if (!user.value) {
    try {
      await getProfile();
    } catch {
      // best-effort; auth middleware will redirect if needed
    }
  }
}

async function loadDetail() {
  isLoadingData.value = true;
  loadingMessage.value = '';
  try {
    await fetchDetail(id.value);
    dokumenPendukung.value = (detail.value?.dokumen ?? []).filter((d) => d.tipe === 'pendukung');
    buildInitialForm();
  } catch {
    toast.add({ title: 'Gagal memuat detail naskah', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
}

async function loadBod() {
  try {
    bodDirectors.value = await fetchBodDirectors();
  } catch {
    toast.add({ title: 'Gagal memuat daftar direksi', color: 'error' });
  }
}

function jenisLabel(j) {
  return JENIS_LABELS[j] || j;
}

function apiErrorMessage(e) {
  const raw = e?.response?.data?.message || e?.message;
  return Array.isArray(raw) ? raw[0] : raw || '';
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const SIFAT_LABELS = {
  sangat_rahasia: 'Sangat Rahasia',
  rahasia: 'Rahasia',
  terbatas: 'Terbatas',
  biasa: 'Biasa',
  terbuka: 'Terbuka',
};
const sifatLabel = computed(() => detail.value ? (SIFAT_LABELS[detail.value.sifat] ?? detail.value.sifat) : '—');

const firstPenandatangan = computed(() => {
  const p = detail.value?.penandatangan;
  if (Array.isArray(p) && p.length) return p[0];
  if (p && !Array.isArray(p) && p.nama) return p;
  return null;
});

// TinyMCE style — scoped override for blanko verbal page
const tinyMceStyle = `body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; border: none !important; }`;

async function generatePreviewPdf() {
  busy.value = true;
  loadingMessage.value = t('kj_memproses_pratinjau');
  isLoadingData.value = true;
  try {
    pdfUrl.value = await previewBlankoVerbal(id.value, form.value, catatan.value);
    pdfModalOpen.value = true;
  } catch (e) {
    toast.add({ title: 'Gagal membuat preview PDF', description: apiErrorMessage(e), color: 'error' });
  } finally {
    busy.value = false;
    isLoadingData.value = false;
    loadingMessage.value = '';
  }
}

async function kirim() {
  busy.value = true;
  loadingMessage.value = 'Mengirim blanko verbal…';
  isLoadingData.value = true;
  try {
    await kirimBlankoVerbal(id.value, form.value, catatan.value);
    toast.add({ title: 'Blanko verbal dikirim', color: 'success' });
    await loadDetail();
  } catch (e) {
    toast.add({ title: 'Gagal mengirim blanko verbal', description: apiErrorMessage(e), color: 'error' });
  } finally {
    busy.value = false;
    isLoadingData.value = false;
    loadingMessage.value = '';
  }
}

async function lanjutTandaTangan() {
  busy.value = true;
  loadingMessage.value = 'Meneruskan ke tanda tangan…';
  isLoadingData.value = true;
  try {
    await kirimApprovalBlanko(id.value);
    toast.add({ title: 'Naskah diteruskan ke tanda tangan', color: 'success' });
    advanceModalOpen.value = false;
    navigateTo(`/naskah-lainnya/${id.value}/tanda-tangan`);
  } catch (e) {
    toast.add({ title: 'Gagal meneruskan ke tanda tangan', description: apiErrorMessage(e), color: 'error' });
  } finally {
    busy.value = false;
    isLoadingData.value = false;
    loadingMessage.value = '';
  }
}

function paraf(item: DirectorApprovalItem) {
  activeDirector.value = item;
  parafCatatan.value = '';
  parafModalOpen.value = true;
}

function tolak(item: DirectorApprovalItem) {
  activeDirector.value = item;
  tolakCatatan.value = '';
  tolakModalOpen.value = true;
}

async function confirmParaf(note: string) {
  busy.value = true;
  loadingMessage.value = 'Menyimpan paraf…';
  isLoadingData.value = true;
  try {
    await parafBlankoVerbal(id.value, form.value, note || undefined);
    toast.add({ title: 'Paraf tercatat', color: 'success' });
    parafModalOpen.value = false;
    parafCatatan.value = '';
    activeDirector.value = null;
    await loadDetail();
  } catch (e) {
    toast.add({ title: 'Gagal mencatat paraf', description: apiErrorMessage(e), color: 'error' });
  } finally {
    busy.value = false;
    isLoadingData.value = false;
    loadingMessage.value = '';
  }
}

async function confirmTolak(note: string) {
  if (!note.trim()) {
    toast.add({ title: 'Alasan penolakan wajib diisi', color: 'warning' });
    return;
  }
  busy.value = true;
  loadingMessage.value = 'Menolak blanko verbal…';
  isLoadingData.value = true;
  try {
    await tolakBlankoVerbal(id.value, note.trim());
    toast.add({ title: 'Blanko verbal ditolak', color: 'success' });
    tolakModalOpen.value = false;
    tolakCatatan.value = '';
    activeDirector.value = null;
    navigateTo(`/naskah-lainnya/${id.value}/legal-drafting`);
  } catch (e) {
    toast.add({ title: 'Gagal menolak blanko verbal', description: apiErrorMessage(e), color: 'error' });
  } finally {
    busy.value = false;
    isLoadingData.value = false;
    loadingMessage.value = '';
  }
}

// ── Dokumen pendukung preview helpers ──
const previewOpen = ref(false);
const previewUrl = ref(null);
const previewDocxBuffer = ref(null);
const previewDocxContainer = ref(null);
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

async function openPreviewFromBlob(blob, nama) {
  const lower = nama.toLowerCase();
  const isPdf = lower.endsWith('.pdf') || blob.type === 'application/pdf';
  const isDocx = lower.endsWith('.docx');
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
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  }
}

function closePreview() {
  previewOpen.value = false;
  if (previewUrl.value) { window.URL.revokeObjectURL(previewUrl.value); previewUrl.value = null; }
  previewDocxBuffer.value = null;
}

watch(previewOpen, (open) => { if (!open) closePreview(); });

async function previewPendukung(doc) {
  previewLoading.value = true;
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/dokumen/${doc.id}/download`, { responseType: 'blob' });
    await openPreviewFromBlob(blob, doc.nama);
  } catch {
    toast.add({ title: 'Gagal memuat preview dokumen', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
}

async function deletePendukung(doc) {
  if (!confirm(`Hapus dokumen "${doc.nama}"?`)) return;
  busy.value = true;
  try {
    await deleteDokumenTambahan(id.value, doc.id);
    toast.add({ title: 'Dokumen dihapus', color: 'success' });
    await loadDetail();
  } catch (e) {
    toast.add({ title: 'Gagal menghapus dokumen', description: apiErrorMessage(e), color: 'error' });
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  await fetchCurrentUserInfo();
  await Promise.all([loadDetail(), loadBod()]);
});
</script>

<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="relative">
    <!-- Loading overlay (kajian style) -->
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== ''" :message="loadingMessage" />

    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ detail?.perihal || 'Memuat…' }}</h1>
      </template>
      <template #subtitle>
        <div class="flex flex-wrap gap-2">
          <StatusBadge status="blanko_verbal" />
          <UBadge v-if="detail?.jenis" color="neutral" size="sm">{{ jenisLabel(detail.jenis) }}</UBadge>
        </div>
      </template>
    </PageHeader>

    <div v-if="isLoadingData && !detail" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <template v-else>
      <UCard
        variant="soft"
        :ui="{
          root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
        }"
      >
        <!-- Banner: ditolak dari persetujuan direksi -->
        <div
          v-if="rejectedPersetujuanDireksiRow"
          class="mb-5 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4"
        >
          <div class="flex items-center gap-2 mb-1.5">
            <UIcon name="i-lucide-circle-x" class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <p class="text-sm font-semibold text-red-700 dark:text-red-300">Ditolak dari Persetujuan Direksi</p>
          </div>
          <p class="text-sm text-red-600/80 dark:text-red-400/80 mb-1">
            Naskah ditolak saat persetujuan direksi. Perbaiki dan kirim ulang sesuai alasan penolakan:
          </p>
          <p v-if="rejectedPersetujuanDireksiRow.catatan" class="text-sm text-gray-800 dark:text-gray-100 italic">
            &ldquo;{{ rejectedPersetujuanDireksiRow.catatan }}&rdquo;
          </p>
        </div>

        <!-- Skeleton loading -->
        <div v-if="isLoadingData && loadingMessage === ''" class="animate-pulse px-2 space-y-3">
          <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
            <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
            <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
          </div>
          <div
            class="border border-gray-200 dark:border-gray-700 rounded-lg h-[400px] p-6 space-y-5 bg-white dark:bg-gray-800">
            <div class="flex gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
              <USkeleton class="h-12 w-12 rounded-full" />
              <div class="flex-1 space-y-2 pt-1">
                <USkeleton class="h-3 w-1/2" />
                <USkeleton class="h-3 w-1/3" />
              </div>
            </div>
            <div class="space-y-3 px-4">
              <USkeleton v-for="j in 4" :key="j" class="h-3 w-full" />
            </div>
          </div>
          <USkeleton class="h-30 w-full rounded-md" />
          <div class="pt-6 border-t border-gray-100 dark:border-gray-800">
            <USkeleton class="h-10 w-32 rounded-lg" />
          </div>
        </div>

        <!-- Main content -->
        <div v-else class="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <!-- LEFT COLUMN -->
          <div class="space-y-5 xl:col-span-2">
            <!-- Informasi Naskah (read-only) -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <UIcon name="i-lucide-file-text" class="size-4 text-primary-600 dark:text-primary-400" />
                  </span>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Informasi Naskah</h3>
                </div>
              </template>

              <dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <div class="flex items-start gap-3">
                  <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    <UIcon name="i-lucide-message-square" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Perihal</dt>
                    <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ detail.perihal || '—' }}</dd>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    <UIcon name="i-lucide-calendar" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tanggal</dt>
                    <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ fmtDate(detail.tanggal) }}</dd>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    <UIcon name="i-lucide-shield" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Klasifikasi</dt>
                    <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ detail.klasifikasi || '—' }}</dd>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    <UIcon name="i-lucide-lock" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Sifat</dt>
                    <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ sifatLabel }}</dd>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    <UIcon name="i-lucide-file-stack" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Jenis</dt>
                    <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ jenisLabel(detail.jenis) }}</dd>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    <UIcon name="i-lucide-signature" class="h-4 w-4" />
                  </span>
                  <div class="min-w-0">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Penandatangan</dt>
                    <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ firstPenandatangan?.nama || '—' }}</dd>
                    <p v-if="firstPenandatangan?.jabatan" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ firstPenandatangan.jabatan }}</p>
                  </div>
                </div>
              </dl>
            </UCard>

            <!-- Form Blanko Verbal -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <UIcon name="i-lucide-file-check" class="size-4 text-primary-600 dark:text-primary-400" />
                  </span>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Blanko Verbal</h3>
                  <UBadge v-if="isEditable" color="primary" variant="soft" size="xs">Editable</UBadge>
                  <UBadge v-else color="neutral" variant="soft" size="xs">Read-only</UBadge>
                </div>
              </template>

              <div class="space-y-1">
                <!-- Nomor Verbal -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Nomor Verbal</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.nomor" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Nomor blanko verbal" />
                    </div>
                  </div>
                </div>

                <!-- Tanggal -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Tanggal</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="date" v-model="form.tanggal" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                <!-- Diusulkan Oleh -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Diusulkan Oleh</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.diusulkanOleh" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Nama pemrakarsa" />
                    </div>
                  </div>
                </div>

                <!-- Jabatan -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Jabatan</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.jabatanDiusulkan" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Jabatan pemrakarsa" />
                    </div>
                  </div>
                </div>

                <!-- Perihal -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.perihal" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Perihal naskah" />
                    </div>
                  </div>
                </div>

                <!-- Referensi Dari -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Referensi Dari</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.referensiDari" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Asal surat / unit" />
                    </div>
                  </div>
                </div>

                <!-- Referensi Nomor -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Referensi Nomor</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.referensiNomor" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Nomor surat referensi" />
                    </div>
                  </div>
                </div>

                <!-- Referensi Tanggal -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Referensi Tanggal</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="date" v-model="form.referensiTanggal" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                <!-- Klasifikasi -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Klasifikasi</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.klasifikasi" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Klasifikasi" />
                    </div>
                  </div>
                </div>

                <!-- Lampiran -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Lampiran</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.lampiran" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Jumlah / uraian lampiran" />
                    </div>
                  </div>
                </div>

                <!-- Legal Drafter -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Legal Drafter</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.legalDrafter" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Nama legal drafter" />
                    </div>
                  </div>
                </div>

                <!-- Jabatan Legal Drafter -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Jabatan Legal Drafter</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.legalDrafterJabatan" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Jabatan legal drafter" />
                    </div>
                  </div>
                </div>

                <!-- Legal Checker -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Legal Checker</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.legalChecker" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Nama legal checker" />
                    </div>
                  </div>
                </div>

                <!-- Jabatan Legal Checker -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Jabatan Legal Checker</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <input type="text" v-model="form.legalCheckerJabatan" :disabled="!isEditable"
                        class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Jabatan legal checker" />
                    </div>
                  </div>
                </div>

                <!-- Isi -->
                <div class="flex flex-col py-4">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Isi</label>
                  <TinymceEditorAsync
                    api-key="no-api-key"
                    v-model="form.bodyHtml"
                    :init="tinyMceInit"
                    class="min-h-[320px]"
                  />
                </div>

                <!-- Keterangan -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
                  <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Keterangan (opsional)</span>
                    <div class="flex items-center flex-1 w-full gap-2">
                      <UTextarea v-model="catatan" placeholder="Catatan untuk blanko verbal…" rows="2" :disabled="!isEditable" class="w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Dokumen Pendukung -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <UIcon name="i-lucide-paperclip" class="size-4 text-primary-600 dark:text-primary-400" />
                  </span>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Dokumen Pendukung</h3>
                </div>
              </template>

              <div v-if="dokumenPendukung.length === 0" class="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500">
                <UIcon name="i-lucide-inbox" class="size-8" />
                <span class="text-sm">Belum ada dokumen pendukung.</span>
              </div>
              <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div
                  v-for="d in dokumenPendukung"
                  :key="d.id"
                  class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 flex flex-col gap-2"
                >
                  <button
                    class="w-full text-center flex flex-col gap-1 group"
                    @click="previewPendukung(d)"
                  >
                    <div class="h-20 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex flex-col items-center justify-center gap-1 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                      <UIcon name="i-lucide-file-text" class="size-7 text-red-500" />
                      <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ d.nama.split('.').pop()?.toUpperCase() || 'FILE' }}</span>
                    </div>
                    <p class="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-2 break-all leading-tight">{{ d.nama }}</p>
                  </button>
                  <UButton
                    color="error"
                    variant="ghost"
                    size="xs"
                    icon="i-lucide-trash-2"
                    class="w-full justify-center"
                    :loading="busy"
                    @click="deletePendukung(d)"
                  >
                    Hapus
                  </UButton>
                </div>
              </div>
            </UCard>

            <!-- Progress Persetujuan Blanko Verbal -->
            <UCard v-if="isBlankoVerbal && bvDirectors.length">
              <template #header>
                <div class="flex items-center gap-2">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <UIcon name="i-lucide-users" class="size-4 text-primary-600 dark:text-primary-400" />
                  </span>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Progress Persetujuan Blanko Verbal</h3>
                </div>
              </template>

              <DireksiApprovalProgress
                :directors="bvDirectors"
                :is-current-user-approver="isCurrentUserApprover"
                :can-approve="canApprove"
                :busy="busy"
                @paraf="paraf"
                @tolak="tolak"
              />
            </UCard>

            <!-- Action bar (korespondensi style: Preview PDF + Kirim) -->
            <div
              v-if="isEditable"
              class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800"
            >
              <UButton
                color="primary"
                size="lg"
                icon="i-lucide-eye"
                class="px-8 font-bold"
                :loading="busy"
                @click="generatePreviewPdf"
              >
                Preview PDF
              </UButton>
              <UButton
                color="primary"
                size="lg"
                icon="i-lucide-send"
                class="px-8 font-bold"
                :loading="busy"
                @click="kirim"
              >
                Simpan &amp; Kirim Blanko Verbal
              </UButton>
            </div>
          </div>

          <!-- RIGHT COLUMN: Live Preview -->
          <div class="xl:col-span-1">
            <div class="sticky top-4 space-y-4">
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                        <UIcon name="i-lucide-eye" class="size-4 text-primary-600 dark:text-primary-400" />
                      </span>
                      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Pratinjau Live</h3>
                    </div>
                    <UButton
                      size="xs"
                      color="primary"
                      variant="soft"
                      icon="i-lucide-maximize"
                      @click="previewSlideOpen = true"
                    >
                      Perbesar
                    </UButton>
                  </div>
                </template>

                <div class="overflow-x-auto pb-2">
                  <BlankoVerbalTemplate
                    v-model="form"
                    :directors="bodDirectors"
                  />
                </div>
              </UCard>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Manual advance ke tanda tangan -->
      <div
        v-if="allBvVerified && isBlankoVerbal"
        class="overflow-hidden rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white shadow-sm ring-1 ring-primary-100 dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800 dark:ring-primary-900/30"
      >
        <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
              <UIcon name="i-lucide-signature" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Lanjutkan ke Tanda Tangan</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Seluruh direksi telah memberikan paraf. Naskah dapat diteruskan ke tahap tanda tangan.</p>
            </div>
          </div>
          <UButton
            color="primary"
            icon="i-lucide-arrow-right"
            size="lg"
            class="w-full font-semibold shadow-lg shadow-primary-500/20 sm:w-auto"
            :loading="busy"
            @click="advanceModalOpen = true"
          >
            Lanjutkan ke Tanda Tangan
          </UButton>
        </div>
      </div>
    </template>

    <!-- Preview PDF Modal -->
    <UModal v-model:open="pdfModalOpen" :ui="{ content: 'max-w-4xl' }">
      <template #content>
        <div class="flex h-[85vh] flex-col">
          <div class="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Preview PDF</h3>
            <UButton size="sm" variant="ghost" icon="i-lucide-x" @click="pdfModalOpen = false" />
          </div>
          <div class="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
            <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full border-0 bg-white" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Perbesar Live Preview Slideover -->
    <USlideover
      v-model:open="previewSlideOpen"
      side="bottom"
      title="Pratinjau Blanko Verbal"
      description="Tampilan diperbesar sesuai data form"
      :dismissible="true"
      :ui="{
        content: 'h-screen max-h-screen',
        body: 'p-0',
      }"
    >
      <template #body>
        <div class="h-full w-full overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
          <BlankoVerbalTemplate v-model="form" :directors="bodDirectors" />
        </div>
      </template>
    </USlideover>

    <!-- Paraf Modal -->
    <VerifyActionModal
      v-model="parafModalOpen"
      variant="approve"
      title="Paraf Blanko Verbal"
      :description="`Anda akan memberikan paraf sebagai <strong>${activeDirector?.nama || '-'}</strong>.`"
      note-placeholder="Catatan opsional…"
      confirm-label="Paraf"
      :saving="busy"
      @confirm="confirmParaf"
    />

    <!-- Tolak Modal -->
    <VerifyActionModal
      v-model="tolakModalOpen"
      variant="reject"
      title="Tolak Blanko Verbal"
      description="Berikan alasan penolakan. Naskah akan dikembalikan ke legal drafting."
      warning="Penolakan akan mengembalikan naskah ke tahap legal drafting untuk direvisi."
      note-placeholder="Alasan penolakan…"
      confirm-label="Tolak"
      :saving="busy"
      :require-note="true"
      :min-note-length="5"
      @confirm="confirmTolak"
    />

    <!-- Lanjut Tanda Tangan Modal -->
    <VerifyActionModal
      v-model="advanceModalOpen"
      variant="approve"
      title="Lanjutkan ke Tanda Tangan"
      description="Seluruh direksi telah memberikan paraf. Naskah akan diteruskan ke tahap tanda tangan."
      confirm-label="Lanjutkan"
      :saving="busy"
      @confirm="lanjutTandaTangan"
    />

    <!-- Preview Dokumen Pendukung Modal -->
    <UModal v-model:open="previewOpen" :ui="{ content: 'max-w-4xl' }">
      <template #content>
        <div class="flex h-[85vh] flex-col">
          <div class="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Preview Dokumen</h3>
            <UButton size="sm" variant="ghost" icon="i-lucide-x" @click="closePreview" />
          </div>
          <div class="flex-1 overflow-hidden relative bg-gray-100 dark:bg-gray-900">
            <div v-if="previewLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
              <UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6 text-primary-500" />
            </div>
            <iframe v-if="previewUrl" :src="previewUrl" class="w-full h-full border-0 bg-white" />
            <div v-else ref="previewDocxContainer" class="docx-preview-container w-full h-full overflow-auto" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
:deep(.docx-preview-container) { padding: 16px; }
:deep(.docx-wrapper) { background: #fff !important; padding: 0 !important; }
:deep(.docx-wrapper > section.docx) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  margin: 0 auto !important;
}
</style>