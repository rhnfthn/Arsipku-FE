<template>
  <div class="space-y-5">
    <PageHeader :items="breadcrumbs" :back-to="`/naskah-lainnya/${id}`">
      <template #title>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {{ detail?.perihal || 'Memuat…' }}
        </h1>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <template v-else>
      <!-- LoadingOverlay for async actions (preview, kirim, paraf, tolak) -->
      <LoadingOverlay :loading="busy" :message="busyMessage" />

      <!-- Banner mode: susun lembar (edit) vs menunggu paraf direksi (read-only) -->
      <div
        class="flex items-start gap-3 rounded-xl border px-4 py-3.5"
        :class="
          canEditSheet
            ? 'border-primary-200 bg-primary-50 dark:border-primary-900/50 dark:bg-primary-950/30'
            : 'border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30'
        "
      >
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          :class="canEditSheet ? 'bg-primary-500' : 'bg-violet-500'"
        >
          <UIcon
            :name="canEditSheet ? 'i-lucide-file-pen-line' : 'i-lucide-stamp'"
            class="size-5"
          />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-gray-900 dark:text-white">
            {{ canEditSheet ? 'Susun Lembar Persetujuan Direksi' : 'Menunggu Paraf Direksi' }}
          </p>
          <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {{
              canEditSheet
                ? 'Lengkapi data lembar di bawah, tinjau pratinjau PDF, lalu kirim ke direksi untuk diparaf.'
                : `${parafDone}/${pdDirectors.length} direksi telah memaraf${nextDirector ? ' — giliran ' + nextDirector.nama + '.' : '.'}`
            }}
          </p>
        </div>
      </div>

      <UCard
        variant="soft"
        :ui="{
          root: 'rounded-xl ring-0 shadow-sm bg-white dark:bg-gray-800 print:hidden transition-colors',
        }"
      >
        <div class="flex-1 overflow-y-auto space-y-1">
          <!-- ── Form fields (editable mode only) ── -->
          <div v-if="canEditSheet" class="pd-form">
            <TulisInputTanggal v-model="formDate" label="Tanggal Lembar" />

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
                  v-model="sheet.diusulkanOleh"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Nama pemrakarsa"
                />
              </div>
            </div>

            <div class="py-3 border-b border-gray-200 dark:border-gray-600">
              <DirectorOrderSelector
                v-model="sheet.ditetapkanOleh"
                label="Ditetapkan/Disahkan Oleh"
                hint="nama bisa diganti bila delegasi"
                placeholder="Pilih direksi penetap"
                :recipients="selectableDirectors"
              />
            </div>

            <div class="py-3 border-b border-gray-200 dark:border-gray-600">
              <DirectorOrderSelector
                v-model="sheet.diketahuiOleh"
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
                  v-model="sheet.jabatanDiusulkan"
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
                  v-model="sheet.perihal"
                  :maxlength="maxPerihal"
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
                  v-model="sheet.referensiDari"
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
                  v-model="sheet.referensiNomor"
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
                  v-model="sheet.klasifikasi"
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
                  v-model="sheet.lampiran"
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
                  >Catatan</span
                >
                <textarea
                  v-model="catatan"
                  rows="2"
                  class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 resize-none"
                  placeholder="Catatan untuk lembar persetujuan direksi…"
                />
              </div>
            </div>
          </div>

          <!-- ── Inline paper preview ── -->
          <ClientOnly>
            <div class="mt-6 overflow-x-auto">
              <LembarPersetujuanDireksiTemplate
                v-model="sheet"
                :directors="bodDirectors"
                :read-only="!canEditSheet"
              />
            </div>
          </ClientOnly>

          <!-- ── Read-only mode: Progress Persetujuan Direksi ── -->
          <template v-if="!canEditSheet && pdDirectors.length > 0">
            <div class="pt-4 border-t border-gray-100 dark:border-gray-800">
              <div class="flex items-center gap-2 mb-3">
                <UIcon
                  name="i-lucide-users"
                  class="size-4 text-primary-600 dark:text-primary-400"
                />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Progress Persetujuan Direksi
                </h3>
              </div>
              <div class="space-y-4">
                <div v-if="pdDitetapkanDirectors.length" class="space-y-2">
                  <h4
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Ditetapkan/Disahkan Oleh
                  </h4>
                  <DireksiApprovalProgress
                    :directors="pdDitetapkanDirectors"
                    :is-current-user-approver="isCurrentUserApprover"
                    :can-approve="canApprove"
                    :busy="busy"
                    @paraf="openParafModal"
                    @tolak="openTolakModal"
                  />
                </div>
                <div v-if="pdDiketahuiDirectors.length" class="space-y-2">
                  <h4
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Diketahui Oleh
                  </h4>
                  <DireksiApprovalProgress
                    :directors="pdDiketahuiDirectors"
                    :is-current-user-approver="isCurrentUserApprover"
                    :can-approve="canApprove"
                    :busy="busy"
                    @paraf="openParafModal"
                    @tolak="openTolakModal"
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
                canEditSheet
                  ? 'Tinjau pratinjau PDF terlebih dahulu, lalu kirim lembar ke direksi untuk diparaf.'
                  : 'Lembar sedang menunggu proses paraf direksi.'
              }}
            </p>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <UButton
                label="Preview PDF"
                color="primary"
                size="lg"
                icon="i-lucide-eye"
                :loading="busy"
                @click="previewPdf"
              />
            </div>
          </div>
        </div>
      </UCard>

      <!-- ── Preview PDF Slideover (bottom) ── -->
      <USlideover
        v-model:open="pdfModalOpen"
        title="Pratinjau"
        description="Pratinjau lembar persetujuan direksi"
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
          <div class="flex gap-4 w-full">
            <UButton
              v-if="canEditSheet"
              label="Kirim Lembar Persetujuan Direksi"
              color="primary"
              size="lg"
              icon="i-heroicons-paper-airplane"
              class="px-8 font-bold"
              :loading="busy"
              @click="kirimSheet"
            />
          </div>
        </template>
      </USlideover>

      <!-- ── Paraf Modal ── -->
      <VerifyActionModal
        v-model="parafModalOpen"
        variant="approve"
        title="Paraf Lembar Persetujuan Direksi"
        description="Anda akan memberikan paraf lembar persetujuan direksi atas nama pejabat berikut."
        note-placeholder="Catatan opsional…"
        confirm-label="Paraf"
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

      <!-- ── Tolak Modal ── -->
      <VerifyActionModal
        v-model="tolakModalOpen"
        variant="reject"
        title="Tolak Lembar Persetujuan Direksi"
        description="Berikan alasan penolakan. Naskah akan dikembalikan ke legal drafting."
        warning="Penolakan akan mengembalikan naskah ke tahap legal drafting untuk direvisi."
        note-placeholder="Alasan penolakan (minimal 5 karakter)…"
        confirm-label="Tolak"
        :saving="busy"
        :require-note="true"
        :min-note-length="5"
        @confirm="confirmTolak"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { CalendarDate } from '@internationalized/date';
import LembarPersetujuanDireksiTemplate from '~/components/NaskahLainnya/LembarPersetujuanDireksiTemplate.vue';
import DirectorOrderSelector from '~/components/NaskahLainnya/DirectorOrderSelector.vue';
import DireksiApprovalProgress from '~/components/NaskahLainnya/DireksiApprovalProgress.vue';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';
import type { SheetFormModel, DirectorApprovalItem, ApprovalRow } from '~/types/naskah-lainnya';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const id = computed(() => route.params.id as string);
const { user } = useAuth();
const toast = useToast();
const { t } = useI18n();

const {
  detail,
  fetchDetail,
  fetchBodDirectors,
  previewLembarPersetujuanDireksi,
  kirimLembarPersetujuanDireksi,
  parafLembarPersetujuanDireksi,
  tolakLembarPersetujuanDireksi,
} = useNaskahLainnya();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: `/naskah-lainnya/${id.value}` },
  { label: 'Persetujuan Direksi', to: '#' },
]);

const maxPerihal = 200;

const loading = ref(true);
const busy = ref(false);
const busyMessage = ref('');
const catatan = ref('');
const bodDirectors = ref<DirectorApprovalItem[]>([]);

const pdfModalOpen = ref(false);
const pdfUrl = ref('');

const parafModalOpen = ref(false);
const tolakModalOpen = ref(false);
const activeDirector = ref<DirectorApprovalItem | null>(null);

const sheet = ref<SheetFormModel>({
  lampiran: '1 (satu) berkas',
  bodyHtml:
    '<p>Dengan hormat,</p><p>Bersama ini disampaikan usulan persetujuan direksi terkait hal tersebut di atas.</p>',
});

// CalendarDate for TulisInputTanggal (synced with sheet.tanggal string)
const today = new Date();
const formDate = ref<CalendarDate>(
  new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
);

// Sync formDate → sheet.tanggal (YYYY-MM-DD)
watch(
  formDate,
  (d) => {
    if (d) {
      sheet.value.tanggal = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    }
  },
  { immediate: true }
);

// Referensi Tanggal: CalendarDate (TulisInputTanggal) ↔ sheet.referensiTanggal (YYYY-MM-DD)
const refDate = ref<CalendarDate | null>(null);
watch(refDate, (d) => {
  sheet.value.referensiTanggal = d
    ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
    : '';
});

// Sync catatan → sheet.catatan (agar tampil di preview inline, konsisten dgn PDF)
watch(catatan, (v) => {
  sheet.value.catatan = v;
});

const isEvaluasi = computed(() => detail.value?.tahapan === 'evaluasi');
const isPd = computed(() => detail.value?.tahapan === 'persetujuan_direksi');
const pdRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'persetujuan_direksi')
);
const pdDitetapkanRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'persetujuan_direksi_ditetapkan')
);
// Editable saat evaluasi (alur normal: kirim = transisi ke PD) atau saat sudah di
// persetujuan_direksi tapi baris BOD belum ada (recovery naskah yang masuk PD tanpa lembar).
const canEditSheet = computed(() => isEvaluasi.value || (isPd.value && pdRows.value.length === 0));

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

const pdDitetapkanDirectors = computed<DirectorApprovalItem[]>(() =>
  pdDitetapkanRows.value.map((a, idx) => mapApprovalDirector(a, idx, 'Ditetapkan/Disahkan Oleh'))
);
const pdDiketahuiDirectors = computed<DirectorApprovalItem[]>(() =>
  pdRows.value.map((a, idx) => mapApprovalDirector(a, idx, 'Diketahui Oleh'))
);
const pdDirectors = computed<DirectorApprovalItem[]>(() => [
  ...pdDitetapkanDirectors.value,
  ...pdDiketahuiDirectors.value,
]);
const selectableDirectors = computed(() => bodDirectors.value.filter((d) => d.nama || d.jabatan));

const parafDone = computed(() => pdDirectors.value.filter((d) => d.status === 'verified').length);
const nextDirector = computed(() => pdDirectors.value.find((d) => d.status === 'waiting') ?? null);

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

function cleanSheetPayload(): SheetFormModel {
  const cleanDirector = (director: DirectorApprovalItem) => ({
    nama: director.nama,
    jabatan: director.jabatan,
    positionId: director.positionId,
    persnum: director.persnum,
  });
  return {
    ...sheet.value,
    ditetapkanOleh: sheet.value.ditetapkanOleh?.map(cleanDirector),
    diketahuiOleh: sheet.value.diketahuiOleh?.map(cleanDirector),
  };
}

function latestPemrakarsaApproval() {
  const rows = (detail.value?.riwayat ?? [])
    .filter((row) => row.tahap === 'persetujuan' && row.aksi !== 'tolak')
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0));
  return rows[0] ?? null;
}

function initDirectorSelection() {
  if (!canEditSheet.value && (pdDirectors.value.length || pdDitetapkanRows.value.length)) {
    sheet.value.diketahuiOleh = pdRows.value.map((a, idx) =>
      compactDirector({
        index: a.urutan ?? idx + 1,
        nama: a.nama,
        jabatan: a.jabatan,
        positionId: a.positionId,
        persnum: a.persnum,
      })
    );
    if (pdDitetapkanRows.value.length) {
      sheet.value.ditetapkanOleh = pdDitetapkanRows.value.map((a, idx) =>
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
  if (!Array.isArray(sheet.value.ditetapkanOleh)) {
    const dirut = selectableDirectors.value.find(isDirut);
    sheet.value.ditetapkanOleh = [compactDirector(dirut ?? selectableDirectors.value[0])];
  }
  if (!Array.isArray(sheet.value.diketahuiOleh)) {
    const nonDirut = selectableDirectors.value.filter((d) => !isDirut(d));
    sheet.value.diketahuiOleh = (nonDirut.length ? nonDirut : selectableDirectors.value).map(
      compactDirector
    );
  }
}

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
  [...pdRows.value, ...pdDitetapkanRows.value].some(isUserApprover)
);
const canApprove = computed(() => isCurrentUserApprover.value);

function initSheet() {
  const d = detail.value;
  if (!d) return;
  const pemrakarsaApproval = latestPemrakarsaApproval();
  const pemrakarsaNama = pemrakarsaApproval?.aktor || d.pemrakarsa?.nama || '';
  const pemrakarsaJabatan = pemrakarsaApproval?.jabatan || d.pemrakarsa?.jabatan || '';
  if (d.tanggal) {
    sheet.value.tanggal = d.tanggal;
    const parts = d.tanggal.split('-');
    if (parts.length === 3) {
      formDate.value = new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]));
    }
  }
  sheet.value.perihal = d.perihal || sheet.value.perihal;
  sheet.value.diusulkanOleh = pemrakarsaNama || sheet.value.diusulkanOleh;
  sheet.value.jabatanDiusulkan = pemrakarsaJabatan || sheet.value.jabatanDiusulkan;
  sheet.value.klasifikasi = d.klasifikasi || sheet.value.klasifikasi;
  sheet.value.referensiDari = sheet.value.referensiDari || pemrakarsaNama;
  sheet.value.alamatInfo = user.value?.alamatInfo || sheet.value.alamatInfo;
}

async function loadDetail() {
  loading.value = true;
  try {
    await fetchDetail(id.value);
    initSheet();
    initDirectorSelection();
  } catch {
    toast.add({ title: 'Gagal memuat detail naskah', color: 'error' });
  } finally {
    loading.value = false;
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

async function previewPdf() {
  if (!sheet.value.diketahuiOleh?.length) {
    toast.add({
      title: 'Pilih minimal satu direksi pada Diketahui Oleh',
      color: 'warning',
    });
    return;
  }
  busy.value = true;
  busyMessage.value = 'Memproses pratinjau…';
  try {
    pdfUrl.value = await previewLembarPersetujuanDireksi(
      id.value,
      cleanSheetPayload(),
      catatan.value
    );
    pdfModalOpen.value = true;
  } catch (e) {
    toast.add({
      title: 'Gagal membuat preview PDF',
      description: apiErrorMessage(e),
      color: 'error',
    });
  } finally {
    busy.value = false;
    busyMessage.value = '';
  }
}

async function kirimSheet() {
  if (!sheet.value.diketahuiOleh?.length) {
    toast.add({
      title: 'Pilih minimal satu direksi pada Diketahui Oleh',
      color: 'warning',
    });
    return;
  }
  busy.value = true;
  busyMessage.value = 'Mengirim lembar persetujuan direksi…';
  try {
    await kirimLembarPersetujuanDireksi(id.value, cleanSheetPayload(), catatan.value);
    toast.add({ title: 'Lembar persetujuan direksi dikirim', color: 'success' });
    pdfModalOpen.value = false;
    await navigateTo('/naskah-lainnya/legal-drafting?status=menunggu');
  } catch (e) {
    toast.add({
      title: 'Gagal mengirim lembar persetujuan direksi',
      description: apiErrorMessage(e),
      color: 'error',
    });
  } finally {
    busy.value = false;
    busyMessage.value = '';
  }
}

function openParafModal(item: DirectorApprovalItem) {
  activeDirector.value = item;
  parafModalOpen.value = true;
}

function openTolakModal(item: DirectorApprovalItem) {
  activeDirector.value = item;
  tolakModalOpen.value = true;
}

async function confirmParaf(note) {
  if (!activeDirector.value) return;
  busy.value = true;
  busyMessage.value = 'Mencatat paraf…';
  try {
    await parafLembarPersetujuanDireksi(id.value, cleanSheetPayload(), note ?? '');
    toast.add({ title: 'Paraf tercatat', color: 'success' });
    parafModalOpen.value = false;
    activeDirector.value = null;
    await loadDetail();
    if (detail.value?.tahapan === 'blanko_verbal') {
      navigateTo(`/naskah-lainnya/${id.value}/blanko-verbal`);
    }
  } catch (e) {
    toast.add({ title: 'Gagal mencatat paraf', description: apiErrorMessage(e), color: 'error' });
  } finally {
    busy.value = false;
    busyMessage.value = '';
  }
}

async function confirmTolak(note) {
  busy.value = true;
  busyMessage.value = 'Menolak lembar persetujuan…';
  try {
    await tolakLembarPersetujuanDireksi(id.value, (note ?? '').trim());
    toast.add({ title: 'Lembar persetujuan ditolak', color: 'success' });
    tolakModalOpen.value = false;
    activeDirector.value = null;
    navigateTo(`/naskah-lainnya/${id.value}/legal-drafting`);
  } catch (e) {
    toast.add({
      title: 'Gagal menolak lembar persetujuan',
      description: apiErrorMessage(e),
      color: 'error',
    });
  } finally {
    busy.value = false;
    busyMessage.value = '';
  }
}

onMounted(() => {
  loadDetail();
  loadBod();
});
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}

/* Input inline ala kertas: tetap tanpa border, tapi ada ring saat fokus */
.pd-form input:focus,
.pd-form textarea:focus {
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
