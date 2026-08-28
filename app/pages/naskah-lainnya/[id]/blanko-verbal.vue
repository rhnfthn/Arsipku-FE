<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { CalendarDate } from '@internationalized/date';
import BlankoVerbalTemplate from '~/components/NaskahLainnya/BlankoVerbalTemplate.vue';
import DirectorOrderSelector from '~/components/NaskahLainnya/DirectorOrderSelector.vue';
import DireksiApprovalProgress from '~/components/NaskahLainnya/DireksiApprovalProgress.vue';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';

import type { SheetFormModel, DirectorApprovalItem, ApprovalRow } from '~/types/naskah-lainnya';

definePageMeta({ layout: 'default', middleware: ['auth'] });
useHead({ title: 'Blanko Verbal' });

const route = useRoute();
const id = computed(() => route.params.id as string);
const { t } = useI18n();
const toast = useToast();
const { user, getProfile } = useAuth();
const { canAccessPage } = useFeatureAccess();

const {
  detail,
  fetchDetail,
  fetchBodDirectors,
  previewBlankoVerbal,
  kirimBlankoVerbal,
  parafBlankoVerbal,
  tolakBlankoVerbal,
  kirimApprovalBlanko,
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

const pdfModalOpen = ref(false);
const pdfUrl = ref('');

const parafModalOpen = ref(false);
const tolakModalOpen = ref(false);
const advanceModalOpen = ref(false);
const parafCatatan = ref('');
const tolakCatatan = ref('');
const activeDirector = ref<DirectorApprovalItem | null>(null);

const form = ref<SheetFormModel>({
  lampiran: '1 (satu) berkas',
});

// Sync catatan → form.catatan (agar tampil di preview inline, konsisten dgn PDF)
watch(catatan, (v) => {
  form.value.catatan = v;
});

// CalendarDate for TulisInputTanggal (synced with form.tanggal string)
const _today = new Date();
const formDate = ref<CalendarDate>(
  new CalendarDate(_today.getFullYear(), _today.getMonth() + 1, _today.getDate())
);
watch(
  formDate,
  (d) => {
    if (d) {
      form.value.tanggal = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    }
  },
  { immediate: true }
);

// Referensi Tanggal: CalendarDate (TulisInputTanggal) ↔ form.referensiTanggal (YYYY-MM-DD)
const refDate = ref<CalendarDate | null>(null);
watch(refDate, (d) => {
  form.value.referensiTanggal = d
    ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
    : '';
});

const isBlankoVerbal = computed(() => detail.value?.tahapan === 'blanko_verbal');

const bvRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'blanko_verbal')
);
const bvDitetapkanRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'blanko_verbal_ditetapkan')
);

const mapApprovalDirector = (
  a: ApprovalRow,
  idx: number,
  roleLabel: string
): DirectorApprovalItem => ({
  index: idx + 1,
  nama: a.nama,
  jabatan: a.jabatan,
  status: a.status,
  positionId: a.positionId,
  persnum: a.persnum,
  catatan: a.catatan,
  roleLabel,
});

const bvDitetapkanDirectors = computed<DirectorApprovalItem[]>(() =>
  bvDitetapkanRows.value.map((a, idx) => mapApprovalDirector(a, idx, 'Ditetapkan/Disahkan Oleh'))
);
const bvDiketahuiDirectors = computed<DirectorApprovalItem[]>(() =>
  bvRows.value.map((a, idx) => mapApprovalDirector(a, idx, 'Diketahui Oleh'))
);
const bvDirectors = computed<DirectorApprovalItem[]>(() => [
  ...bvDitetapkanDirectors.value,
  ...bvDiketahuiDirectors.value,
]);
const selectableDirectors = computed(() => bodDirectors.value.filter((d) => d.nama || d.jabatan));

const allBvVerified = computed(() => {
  const rows = [...bvRows.value, ...bvDitetapkanRows.value];
  return rows.length > 0 && rows.every((r) => r.status === 'verified');
});

const isCompleted = computed(() => allBvVerified.value);
const isEditable = computed(() => isBlankoVerbal.value && !isCompleted.value);

const bvDone = computed(() => bvDirectors.value.filter((d) => d.status === 'verified').length);

const bvBanner = computed(() => {
  if (isEditable.value) {
    return {
      icon: 'i-lucide-file-pen-line',
      card: 'border-primary-200 bg-primary-50 dark:border-primary-900/50 dark:bg-primary-950/30',
      wrap: 'bg-primary-500',
      title: 'Susun Blanko Verbal',
      desc: 'Lengkapi data blanko di bawah, tinjau pratinjau PDF, lalu kirim ke direksi untuk diparaf.',
    };
  }
  if (isCompleted.value) {
    return {
      icon: 'i-lucide-circle-check-big',
      card: 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30',
      wrap: 'bg-green-500',
      title: 'Blanko Verbal Selesai',
      desc: 'Seluruh direksi telah memberikan paraf. Naskah siap diteruskan ke tahap tanda tangan.',
    };
  }
  const nextD = bvDirectors.value.find((d) => d.status === 'waiting');
  if (bvDirectors.value.length > 0) {
    return {
      icon: 'i-lucide-stamp',
      card: 'border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30',
      wrap: 'bg-violet-500',
      title: 'Menunggu Paraf Direksi',
      desc: `${bvDone.value}/${bvDirectors.value.length} direksi telah memaraf${nextD ? ' — giliran ' + nextD.nama + '.' : '.'}`,
    };
  }
  return {
    icon: 'i-lucide-info',
    card: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60',
    wrap: 'bg-gray-400 dark:bg-gray-500',
    title: 'Blanko Verbal',
    desc: 'Blanko verbal akan aktif setelah tahap persetujuan direksi selesai.',
  };
});

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

const isCurrentUserApprover = computed(() =>
  [...bvRows.value, ...bvDitetapkanRows.value].some(isUserApprover)
);
const canApprove = computed(() => isCurrentUserApprover.value);

function isDirut(director: DirectorApprovalItem) {
  return /direktur\s*utama/i.test(director.jabatan || '');
}

function compactDirector(director: DirectorApprovalItem): DirectorApprovalItem {
  return {
    nama: director.nama,
    jabatan: director.jabatan,
    positionId: director.positionId,
    persnum: director.persnum,
  };
}

function cleanFormPayload(): SheetFormModel {
  const cleanDirector = (director: DirectorApprovalItem) => ({
    nama: director.nama,
    jabatan: director.jabatan,
    positionId: director.positionId,
    persnum: director.persnum,
  });
  return {
    ...form.value,
    ditetapkanOleh: form.value.ditetapkanOleh?.map(cleanDirector),
    diketahuiOleh: form.value.diketahuiOleh?.map(cleanDirector),
  };
}

function latestPemrakarsaApproval() {
  const rows = (detail.value?.riwayat ?? [])
    .filter((row) => row.tahap === 'persetujuan' && row.aksi !== 'tolak')
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0));
  return rows[0] ?? null;
}

function initDirectorSelection() {
  if (!isEditable.value && (bvDirectors.value.length || bvDitetapkanRows.value.length)) {
    form.value.diketahuiOleh = bvRows.value.map((a, idx) =>
      compactDirector({
        index: a.urutan ?? idx + 1,
        nama: a.nama,
        jabatan: a.jabatan,
        positionId: a.positionId,
        persnum: a.persnum,
      })
    );
    if (bvDitetapkanRows.value.length) {
      form.value.ditetapkanOleh = bvDitetapkanRows.value.map((a, idx) =>
        compactDirector({
          index: a.urutan ?? idx + 1,
          nama: a.nama,
          jabatan: a.jabatan,
          positionId: a.positionId,
          persnum: a.persnum,
        })
      );
    }
    return;
  }
  if (!selectableDirectors.value.length) return;
  if (!Array.isArray(form.value.ditetapkanOleh)) {
    const dirut = selectableDirectors.value.find(isDirut);
    form.value.ditetapkanOleh = [compactDirector(dirut ?? selectableDirectors.value[0])];
  }
  if (!Array.isArray(form.value.diketahuiOleh)) {
    const nonDirut = selectableDirectors.value.filter((d) => !isDirut(d));
    form.value.diketahuiOleh = (nonDirut.length ? nonDirut : selectableDirectors.value).map(
      compactDirector
    );
  }
}

function buildInitialForm() {
  const d = detail.value;
  const u = user.value;
  if (!d) return;
  const pemrakarsaApproval = latestPemrakarsaApproval();
  const pemrakarsaNama = pemrakarsaApproval?.aktor || d.pemrakarsa?.nama || '';
  const pemrakarsaJabatan = pemrakarsaApproval?.jabatan || d.pemrakarsa?.jabatan || '';
  if (d.tanggal) {
    form.value.tanggal = d.tanggal;
    const parts = d.tanggal.split('-');
    if (parts.length === 3) {
      formDate.value = new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]));
    }
  }
  form.value.nomor = form.value.nomor ?? d.nomor ?? '';
  form.value.perihal = form.value.perihal ?? d.perihal ?? '';
  form.value.diusulkanOleh = form.value.diusulkanOleh ?? pemrakarsaNama;
  form.value.jabatanDiusulkan = form.value.jabatanDiusulkan ?? pemrakarsaJabatan;
  form.value.klasifikasi = form.value.klasifikasi ?? d.klasifikasi ?? '';
  form.value.referensiDari = form.value.referensiDari ?? pemrakarsaNama;
  form.value.alamatInfo = form.value.alamatInfo ?? u?.alamatInfo;
  form.value.lampiran = form.value.lampiran ?? '1 (satu) berkas';

  // Auto-fill Legal Drafter (Dikerjakan oleh) dari unit legal yang memproses legal
  // drafting — aktor aksi 'kirim-approval-legal' terbaru di fase legal_drafting
  // (legal officer yg men-draft & mengirim ke pemberi persetujuan legal).
  const drafterRow = [...(d.riwayat ?? [])]
    .filter((r) => r.tahap === 'legal_drafting' && r.aksi === 'kirim-approval-legal')
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0))[0];
  form.value.legalDrafter = form.value.legalDrafter ?? drafterRow?.aktor ?? '';
  form.value.legalDrafterJabatan = form.value.legalDrafterJabatan ?? drafterRow?.jabatan ?? '';

  // Auto-fill Legal Checker (Diperiksa Oleh) — pemberi persetujuan legal berjenjang
  // tertinggi yang sudah verified di fase legal_drafting (satu tingkat di bawah
  // Direksi yg membidangi hukum).
  const checkerRow = (d.approval ?? [])
    .filter((a) => a.tahap === 'legal_drafting' && a.status === 'verified')
    .sort((a, b) => b.urutan - a.urutan)[0];
  form.value.legalChecker = form.value.legalChecker ?? checkerRow?.nama ?? '';
  form.value.legalCheckerJabatan = form.value.legalCheckerJabatan ?? checkerRow?.jabatan ?? '';
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
    buildInitialForm();
    initDirectorSelection();
  } catch {
    toast.add({ title: 'Gagal memuat detail naskah', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
}

async function loadBod() {
  try {
    bodDirectors.value = await fetchBodDirectors();
    initDirectorSelection();
  } catch {
    toast.add({ title: 'Gagal memuat daftar direksi', color: 'error' });
  }
}

function apiErrorMessage(e) {
  const raw = e?.response?.data?.message || e?.message;
  return Array.isArray(raw) ? raw[0] : raw || '';
}

async function generatePreviewPdf() {
  if (!form.value.diketahuiOleh?.length) {
    toast.add({
      title: 'Pilih minimal satu direksi pada Diketahui Oleh',
      color: 'warning',
    });
    return;
  }
  busy.value = true;
  loadingMessage.value = t('kj_memproses_pratinjau');
  try {
    pdfUrl.value = await previewBlankoVerbal(id.value, cleanFormPayload(), catatan.value);
    pdfModalOpen.value = true;
  } catch (e) {
    toast.add({
      title: 'Gagal membuat preview PDF',
      description: apiErrorMessage(e),
      color: 'error',
    });
  } finally {
    busy.value = false;
    loadingMessage.value = '';
  }
}

async function kirim() {
  if (!form.value.diketahuiOleh?.length) {
    toast.add({
      title: 'Pilih minimal satu direksi pada Diketahui Oleh',
      color: 'warning',
    });
    return;
  }
  busy.value = true;
  loadingMessage.value = 'Mengirim blanko verbal…';
  try {
    await kirimBlankoVerbal(id.value, cleanFormPayload(), catatan.value);
    toast.add({ title: 'Blanko verbal dikirim', color: 'success' });
    pdfModalOpen.value = false;
    await navigateTo('/naskah-lainnya/legal-drafting?status=menunggu');
  } catch (e) {
    toast.add({
      title: 'Gagal mengirim blanko verbal',
      description: apiErrorMessage(e),
      color: 'error',
    });
  } finally {
    busy.value = false;
    loadingMessage.value = '';
  }
}

async function lanjutTandaTangan() {
  busy.value = true;
  loadingMessage.value = 'Meneruskan ke tanda tangan…';
  try {
    await kirimApprovalBlanko(id.value);
    toast.add({ title: 'Naskah diteruskan ke tanda tangan', color: 'success' });
    advanceModalOpen.value = false;
    navigateTo(`/naskah-lainnya/${id.value}/tanda-tangan`);
  } catch (e) {
    toast.add({
      title: 'Gagal meneruskan ke tanda tangan',
      description: apiErrorMessage(e),
      color: 'error',
    });
  } finally {
    busy.value = false;
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
  try {
    await parafBlankoVerbal(id.value, cleanFormPayload(), note || undefined);
    toast.add({ title: 'Paraf tercatat', color: 'success' });
    parafModalOpen.value = false;
    parafCatatan.value = '';
    activeDirector.value = null;
    await loadDetail();
  } catch (e) {
    toast.add({ title: 'Gagal mencatat paraf', description: apiErrorMessage(e), color: 'error' });
  } finally {
    busy.value = false;
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
  try {
    await tolakBlankoVerbal(id.value, note.trim());
    toast.add({ title: 'Blanko verbal ditolak', color: 'success' });
    tolakModalOpen.value = false;
    tolakCatatan.value = '';
    activeDirector.value = null;
    navigateTo(`/naskah-lainnya/${id.value}/legal-drafting`);
  } catch (e) {
    toast.add({
      title: 'Gagal menolak blanko verbal',
      description: apiErrorMessage(e),
      color: 'error',
    });
  } finally {
    busy.value = false;
    loadingMessage.value = '';
  }
}

onMounted(async () => {
  await fetchCurrentUserInfo();
  await Promise.all([loadDetail(), loadBod()]);
});
</script>

<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="space-y-5">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {{ detail?.perihal || 'Memuat…' }}
        </h1>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="isLoadingData && !detail" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <template v-else>
      <!-- LoadingOverlay for async actions (preview, kirim, paraf, tolak) -->
      <LoadingOverlay :loading="busy" :message="loadingMessage" />

      <!-- Banner mode: susun blanko / menunggu paraf / selesai -->
      <div class="flex items-start gap-3 rounded-xl border px-4 py-3.5" :class="bvBanner.card">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          :class="bvBanner.wrap"
        >
          <UIcon :name="bvBanner.icon" class="size-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-gray-900 dark:text-white">{{ bvBanner.title }}</p>
          <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{{ bvBanner.desc }}</p>
        </div>
      </div>

      <UCard
        variant="soft"
        :ui="{
          root: 'rounded-xl ring-0 shadow-sm bg-white dark:bg-gray-800 print:hidden transition-colors',
        }"
      >
        <div class="flex-1 overflow-y-auto space-y-1">
          <!-- Banner: ditolak dari persetujuan direksi -->
          <div
            v-if="rejectedPersetujuanDireksiRow"
            class="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 dark:border-red-900/50 dark:bg-red-950/30"
          >
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
            >
              <UIcon name="i-lucide-circle-x" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-red-700 dark:text-red-300">
                Ditolak dari Persetujuan Direksi
              </p>
              <p class="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">
                Perbaiki naskah sesuai alasan penolakan, lalu kirim ulang blanko verbal:
              </p>
              <p
                v-if="rejectedPersetujuanDireksiRow.catatan"
                class="mt-1 text-sm italic text-gray-800 dark:text-gray-100"
              >
                &ldquo;{{ rejectedPersetujuanDireksiRow.catatan }}&rdquo;
              </p>
            </div>
          </div>

          <!-- ── Form fields (editable mode only) ── -->
          <div v-if="isEditable" class="bv-form">
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Nomor</span
                >
                <input
                  type="text"
                  v-model="form.nomor"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Nomor blanko verbal"
                />
              </div>
            </div>

            <TulisInputTanggal v-model="formDate" label="Tanggal" />

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Diusulkan Oleh</span
                >
                <input
                  type="text"
                  v-model="form.diusulkanOleh"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Nama pemrakarsa"
                />
              </div>
            </div>

            <div class="py-3 border-b border-gray-200 dark:border-gray-600">
              <DirectorOrderSelector
                v-model="form.ditetapkanOleh"
                label="Ditetapkan/Disahkan Oleh"
                hint="nama bisa diganti bila delegasi"
                placeholder="Pilih direksi penetap"
                :recipients="selectableDirectors"
              />
            </div>

            <div class="py-3 border-b border-gray-200 dark:border-gray-600">
              <DirectorOrderSelector
                v-model="form.diketahuiOleh"
                label="Diketahui Oleh"
                hint="urutan paraf direksi"
                placeholder="Pilih direksi paraf"
                :recipients="selectableDirectors"
              />
            </div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Jabatan</span
                >
                <input
                  type="text"
                  v-model="form.jabatanDiusulkan"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Jabatan pemrakarsa"
                />
              </div>
            </div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Perihal</span
                >
                <input
                  type="text"
                  v-model="form.perihal"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Perihal naskah"
                />
              </div>
            </div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Referensi Dari</span
                >
                <input
                  type="text"
                  v-model="form.referensiDari"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Asal surat / unit"
                />
              </div>
            </div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Referensi Nomor</span
                >
                <input
                  type="text"
                  v-model="form.referensiNomor"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Nomor surat referensi"
                />
              </div>
            </div>

            <TulisInputTanggal v-model="refDate" label="Referensi Tanggal" />

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Klasifikasi</span
                >
                <input
                  type="text"
                  v-model="form.klasifikasi"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Klasifikasi"
                />
              </div>
            </div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Lampiran</span
                >
                <input
                  type="text"
                  v-model="form.lampiran"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Jumlah / uraian lampiran"
                />
              </div>
            </div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Legal Drafter</span
                >
                <input
                  type="text"
                  v-model="form.legalDrafter"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Nama legal drafter"
                />
              </div>
            </div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Legal Checker</span
                >
                <input
                  type="text"
                  v-model="form.legalChecker"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Nama legal checker"
                />
              </div>
            </div>

            <!-- Catatan -->
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
            >
              <div class="flex flex-col sm:flex-row sm:items-center w-full">
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                  >Catatan</span
                >
                <textarea
                  v-model="catatan"
                  rows="2"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 resize-none"
                  placeholder="Catatan untuk blanko verbal…"
                />
              </div>
            </div>
          </div>

          <!-- ── Inline paper preview ── -->
          <ClientOnly>
            <div class="mt-6 overflow-x-auto">
              <BlankoVerbalTemplate
                v-model="form"
                :directors="bodDirectors"
                :read-only="!isEditable"
              />
            </div>
          </ClientOnly>

          <!-- ── Read-only mode: Progress Persetujuan Blanko Verbal ── -->
          <template v-if="!isEditable && bvDirectors.length > 0">
            <div class="pt-4 border-t border-gray-100 dark:border-gray-800">
              <div class="flex items-center gap-2 mb-3">
                <UIcon
                  name="i-lucide-users"
                  class="size-4 text-primary-600 dark:text-primary-400"
                />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Progress Persetujuan Blanko Verbal
                </h3>
              </div>
              <div class="space-y-4">
                <div v-if="bvDitetapkanDirectors.length" class="space-y-2">
                  <h4
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Ditetapkan/Disahkan Oleh
                  </h4>
                  <DireksiApprovalProgress
                    :directors="bvDitetapkanDirectors"
                    :is-current-user-approver="isCurrentUserApprover"
                    :can-approve="canApprove"
                    :busy="busy"
                    @paraf="paraf"
                    @tolak="tolak"
                  />
                </div>
                <div v-if="bvDiketahuiDirectors.length" class="space-y-2">
                  <h4
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Diketahui Oleh
                  </h4>
                  <DireksiApprovalProgress
                    :directors="bvDiketahuiDirectors"
                    :is-current-user-approver="isCurrentUserApprover"
                    :can-approve="canApprove"
                    :busy="busy"
                    @paraf="paraf"
                    @tolak="tolak"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- ── Action bar ── -->
          <div
            class="flex flex-col gap-3 border-t border-gray-100 py-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{
                isEditable
                  ? 'Tinjau pratinjau PDF terlebih dahulu, lalu kirim blanko ke direksi untuk diparaf.'
                  : isCompleted
                    ? 'Seluruh direksi telah memaraf. Teruskan naskah ke tahap tanda tangan.'
                    : 'Blanko verbal sedang menunggu proses paraf direksi.'
              }}
            </p>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <UButton
                label="Preview PDF"
                color="primary"
                size="lg"
                icon="i-lucide-eye"
                :loading="busy"
                @click="generatePreviewPdf"
              />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Lanjutkan ke Tanda Tangan -->
      <div
        v-if="allBvVerified && isBlankoVerbal"
        class="overflow-hidden rounded-xl border border-primary-200 bg-linear-to-br from-primary-50 to-white shadow-sm ring-1 ring-primary-100 dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800 dark:ring-primary-900/30"
      >
        <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400"
            >
              <UIcon name="i-lucide-signature" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Lanjutkan ke Tanda Tangan</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Seluruh direksi telah memberikan paraf. Naskah dapat diteruskan ke tahap tanda
                tangan.
              </p>
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

      <!-- ── Preview PDF Slideover (bottom) ── -->
      <USlideover
        v-model:open="pdfModalOpen"
        title="Pratinjau"
        description="Pratinjau blanko verbal"
        side="bottom"
        :dismissible="true"
        :ui="{
          content: 'h-screen max-h-screen',
          body: 'p-0',
          footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
          wrapper: 'z-50',
        }"
      >
        <template #body>
          <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <iframe
              v-if="pdfUrl"
              :src="pdfUrl"
              class="w-full h-full rounded-lg shadow-lg border border-gray-200"
            />
            <div v-else class="flex flex-col items-center gap-2">
              <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
              <span class="text-gray-500">Memuat pratinjau…</span>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end">
            <UButton
              v-if="isEditable"
              label="Simpan & Kirim Blanko Verbal"
              color="primary"
              size="lg"
              icon="i-lucide-send"
              class="font-semibold"
              :loading="busy"
              @click="kirim"
            />
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
    </template>
  </div>
</template>

<style scoped>
/* Input inline ala kertas: tetap tanpa border, tapi ada ring saat fokus */
.bv-form input:focus,
.bv-form textarea:focus {
  outline: none;
  border-radius: 6px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
  box-shadow: 0 0 0 1px var(--ui-primary, #155dfc);
  background: var(--ui-bg-elevated, rgba(0, 0, 0, 0.03));
}
</style>
