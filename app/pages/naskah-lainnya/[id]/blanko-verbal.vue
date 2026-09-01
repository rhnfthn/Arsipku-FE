<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { CalendarDate } from '@internationalized/date';
import BlankoVerbalTemplate from '~/components/NaskahLainnya/BlankoVerbalTemplate.vue';
import DirectorOrderSelector from '~/components/NaskahLainnya/DirectorOrderSelector.vue';
import DireksiApprovalProgress from '~/components/NaskahLainnya/DireksiApprovalProgress.vue';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';

import type { SheetFormModel, DirectorApprovalItem, ApprovalRow } from '~/types/naskah-lainnya';

definePageMeta({ layout: 'default', middleware: ['auth'] });
useHead({ title: 'Blanko Verbal Persetujuan Direksi' });

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
  kirimBlankoVerbal,
  parafBlankoVerbal,
  tolakBlankoVerbal,
} = useNaskahLainnya();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: `/naskah-lainnya/${id.value}` },
  { label: 'Blanko Verbal Persetujuan Direksi', to: '#' },
]);

const isLoadingData = ref(true);
const loadingMessage = ref('');
const busy = ref(false);
const catatan = ref('');
const bodDirectors = ref<DirectorApprovalItem[]>([]);

const showKirimModal = ref(false);

const parafModalOpen = ref(false);
const tolakModalOpen = ref(false);
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
// Pejabat yang sudah memaraf → stamp visible digsig langsung muncul di preview inline.
const bvSignedDirectors = computed(() =>
  bvDirectors.value.filter((d) => d.status === 'verified')
);
const selectableDirectors = computed(() => bodDirectors.value.filter((d) => d.nama || d.jabatan));

const allBvVerified = computed(() => {
  const rows = [...bvRows.value, ...bvDitetapkanRows.value];
  return rows.length > 0 && rows.every((r) => r.status === 'verified');
});

const isCompleted = computed(() => allBvVerified.value);
const isEditable = computed(() =>
  Boolean(detail.value?.availableActions?.includes('kirim-approval-blanko'))
);

const bvDone = computed(() => bvDirectors.value.filter((d) => d.status === 'verified').length);

const bvBanner = computed(() => {
  if (isEditable.value) {
    return {
      icon: 'i-lucide-file-pen-line',
      card: 'border-primary-200 bg-primary-50 dark:border-primary-900/50 dark:bg-primary-950/30',
      wrap: 'bg-primary-500',
      title: 'Susun Blanko Verbal Persetujuan Direksi',
      desc: 'Lengkapi satu blanko, lalu kirim ke kelompok Diketahui Oleh untuk approval pertama.',
    };
  }
  if (isCompleted.value) {
    return {
      icon: 'i-lucide-circle-check-big',
      card: 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30',
      wrap: 'bg-green-500',
      title: 'Blanko Verbal Persetujuan Direksi Selesai',
      desc: 'Seluruh approval selesai. Blanko verbal dan naskah final telah ditandatangani.',
    };
  }
  const nextD = bvDirectors.value.find((d) => d.status === 'waiting');
  if (bvDirectors.value.length > 0) {
    return {
      icon: 'i-lucide-stamp',
      card: 'border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30',
      wrap: 'bg-violet-500',
      title: 'Menunggu Persetujuan Direksi',
      desc: `${bvDone.value}/${bvDirectors.value.length} approval selesai${nextD ? ' — aktif pada ' + nextD.nama + '.' : '.'}`,
    };
  }
  return {
    icon: 'i-lucide-info',
    card: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60',
    wrap: 'bg-gray-400 dark:bg-gray-500',
    title: 'Blanko Verbal Persetujuan Direksi',
    desc: 'Blanko gabungan akan disusun oleh Unit Legal.',
  };
});

// Aksi section (selaras dgn action bar legal-drafting: ikon bulat + judul + desc).
const aksiBlanko = computed(() => {
  if (isEditable.value) {
    return {
      icon: 'i-lucide-send',
      title: 'Kirim Blanko Verbal Persetujuan Direksi',
      desc: 'Tinjau blanko, lalu kirim ke kelompok Diketahui Oleh.',
    };
  }
  if (isCompleted.value) {
    return {
      icon: 'i-lucide-circle-check-big',
      title: 'Blanko Verbal Persetujuan Direksi Selesai',
      desc: 'Seluruh approval dan tanda tangan final telah selesai.',
    };
  }
  return {
    icon: 'i-lucide-stamp',
    title: 'Menunggu Persetujuan Direksi',
    desc: 'Approval berjalan berurutan: Diketahui Oleh, lalu Ditetapkan/Disahkan Oleh.',
  };
});

const rejectedPersetujuanDireksiRow = computed(() => {
  const r = detail.value?.riwayat ?? [];
  const last = r.length ? r[r.length - 1] : null;
  return last?.aksi === 'tolak' && last?.tahap === 'blanko_verbal' ? last : null;
});

function isUserApprover(row: ApprovalRow) {
  if (row.status !== 'waiting') return false;
  const u = user.value;
  if (!u) return false;
  const uid = String(u.persnum ?? '').trim();
  const pos = String(u.position_id ?? u.position ?? '').trim();
  const nama = (u.nama ?? '').trim().toLowerCase();
  return Boolean(
    (row.persnum && String(row.persnum) === uid) ||
      (row.positionId && String(row.positionId) === pos) ||
      (row.nama && row.nama.trim().toLowerCase() === nama)
  );
}

const isCurrentUserApprover = computed(() =>
  [...bvRows.value, ...bvDitetapkanRows.value].some(isUserApprover)
);
const canApprove = computed(() => isCurrentUserApprover.value);
const canApproveDirector = (director: DirectorApprovalItem) =>
  isUserApprover(director as ApprovalRow);

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

function openKirim() {
  if (!form.value.ditetapkanOleh?.length) {
    toast.add({
      title: 'Pilih minimal satu pejabat pada Ditetapkan/Disahkan Oleh',
      color: 'warning',
    });
    return;
  }
  if (!form.value.diketahuiOleh?.length) {
    toast.add({
      title: 'Pilih minimal satu direksi pada Diketahui Oleh',
      color: 'warning',
    });
    return;
  }
  showKirimModal.value = true;
}

async function kirim() {
  busy.value = true;
  loadingMessage.value = 'Mengirim blanko verbal…';
  try {
    await kirimBlankoVerbal(id.value, cleanFormPayload(), catatan.value);
    toast.add({ title: 'Blanko verbal dikirim', color: 'success' });
    showKirimModal.value = false;
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
    toast.add({
      title:
        activeDirector.value?.roleLabel === 'Ditetapkan/Disahkan Oleh'
          ? 'Persetujuan dan tanda tangan tercatat'
          : 'Persetujuan tercatat',
      color: 'success',
    });
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
    <PageHeader :items="breadcrumbs" :back-to="`/naskah-lainnya/${id}`">
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
                Blanko Verbal Persetujuan Direksi Ditolak
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
                :signed-directors="bvSignedDirectors"
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
                  Progress Blanko Verbal Persetujuan Direksi
                </h3>
              </div>
              <div class="space-y-4">
                <div v-if="bvDiketahuiDirectors.length" class="space-y-2">
                  <h4
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    1. Diketahui Oleh
                  </h4>
                  <DireksiApprovalProgress
                    :directors="bvDiketahuiDirectors"
                    :is-current-user-approver="isCurrentUserApprover"
                    :can-approve="canApprove"
                    :can-approve-item="canApproveDirector"
                    :busy="busy"
                    @paraf="paraf"
                    @tolak="tolak"
                  />
                </div>
                <div v-if="bvDitetapkanDirectors.length" class="space-y-2">
                  <h4
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    2. Ditetapkan/Disahkan Oleh
                  </h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Aktif setelah seluruh Diketahui Oleh menyetujui. Persetujuan sekaligus
                    menandatangani blanko verbal dan naskah final.
                  </p>
                  <DireksiApprovalProgress
                    :directors="bvDitetapkanDirectors"
                    :is-current-user-approver="isCurrentUserApprover"
                    :can-approve="canApprove"
                    :can-approve-item="canApproveDirector"
                    :busy="busy"
                    paraf-label="Paraf & Tanda Tangan Naskah"
                    @paraf="paraf"
                    @tolak="tolak"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- ── Aksi (selaras dgn action bar legal-drafting) ── -->
          <div class="mt-2 rounded-xl bg-primary-50/50 px-4 py-4 dark:bg-primary-900/10 sm:px-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-start gap-3">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 shadow-sm dark:bg-primary-900/40 dark:text-primary-400"
                >
                  <UIcon :name="aksiBlanko.icon" class="size-5" />
                </span>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ aksiBlanko.title }}</h3>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ aksiBlanko.desc }}</p>
                </div>
              </div>
              <UButton
                v-if="isEditable"
                color="primary"
                icon="i-lucide-send"
                size="lg"
                class="w-full font-semibold shadow-lg shadow-primary-500/20 sm:w-auto"
                :loading="busy"
                @click="openKirim"
                >Kirim Blanko Verbal Persetujuan Direksi</UButton
              >
            </div>
          </div>
        </div>
      </UCard>

      <!-- Kirim Blanko Verbal Modal (selaras dgn modal Kirim Approval Legal) -->
      <VerifyActionModal
        v-model="showKirimModal"
        variant="approve"
        title="Kirim Blanko Verbal Persetujuan Direksi"
        description="Blanko verbal akan dikirim ke kelompok Diketahui Oleh untuk approval berurutan."
        :require-note="false"
        note-placeholder="Catatan opsional…"
        confirm-label="Kirim Blanko Verbal"
        :saving="busy"
        @confirm="kirim"
      />

      <!-- Paraf Modal -->
      <VerifyActionModal
        v-model="parafModalOpen"
        variant="approve"
        :title="
          activeDirector?.roleLabel === 'Ditetapkan/Disahkan Oleh'
            ? 'Paraf & Tanda Tangan Naskah'
            : 'Setujui sebagai Diketahui Oleh'
        "
        :description="
          activeDirector?.roleLabel === 'Ditetapkan/Disahkan Oleh'
            ? 'Persetujuan Anda sekaligus menandatangani blanko verbal dan naskah final.'
            : 'Anda akan memberikan persetujuan terhadap blanko verbal ini sebagai pengetahuan.'
        "
        note-placeholder="Catatan opsional…"
        :confirm-label="
          activeDirector?.roleLabel === 'Ditetapkan/Disahkan Oleh'
            ? 'Paraf & Tanda Tangan Naskah'
            : 'Setujui'
        "
        :saving="busy"
        @confirm="confirmParaf"
      >
        <template #highlight>
          <div
            class="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 dark:border-primary-800 dark:bg-primary-900/20"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm"
            >
              <UIcon name="i-lucide-user-check" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p
                class="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400"
              >
                {{ activeDirector?.roleLabel || 'Penandatangan' }}
              </p>
              <p class="truncate text-base font-bold text-gray-950 dark:text-white">
                {{ activeDirector?.nama || '-' }}
              </p>
              <p class="truncate text-sm font-medium text-gray-600 dark:text-gray-300">
                {{ activeDirector?.jabatan || '-' }}
              </p>
            </div>
          </div>
        </template>
      </VerifyActionModal>

      <!-- Tolak Modal -->
      <VerifyActionModal
        v-model="tolakModalOpen"
        variant="reject"
        title="Tolak Blanko Verbal Persetujuan Direksi"
        description="Berikan alasan penolakan. Naskah akan dikembalikan ke legal drafting."
        warning="Penolakan akan mengembalikan naskah ke tahap legal drafting untuk direvisi."
        note-placeholder="Alasan penolakan…"
        confirm-label="Tolak"
        :saving="busy"
        :require-note="true"
        :min-note-length="5"
        @confirm="confirmTolak"
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
