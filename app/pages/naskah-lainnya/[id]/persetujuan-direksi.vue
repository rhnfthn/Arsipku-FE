<template>
  <div class="space-y-5">
    <PageHeader :items="breadcrumbs" :back-to="`/naskah-lainnya/${id}`">
      <template #title>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {{ detail?.perihal || 'Memuat…' }}
        </h1>
      </template>
    </PageHeader>

    <TemplateDireksiSelector
      v-if="detail && canEditSheet"
      :model-value="selectedTemplate"
      :disabled="templateLocked"
      @update:model-value="changeTemplate"
    />

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <template v-else>
      <!-- LoadingOverlay for async actions (kirim, paraf, tolak) -->
      <LoadingOverlay :loading="busy" :message="busyMessage" />

      <!-- Banner mode: susun lembar (edit) vs menunggu paraf direksi (read-only) -->
      <div class="flex items-start gap-3 rounded-xl border px-4 py-3.5" :class="pdBanner.card">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          :class="pdBanner.wrap"
        >
          <UIcon :name="pdBanner.icon" class="size-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-gray-900 dark:text-white">
            {{ pdBanner.title }}
          </p>
          <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {{ pdBanner.desc }}
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
            <TulisInputTanggal
              v-model="formDate"
              label="Tanggal Lembar"
              display-format="DD/MM/YYYY"
            />

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

            <TulisInputTanggal
              v-model="refDate"
              label="Referensi Tanggal"
              display-format="DD/MM/YYYY"
            />

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
            <div class="mt-6">
              <div class="flex items-center gap-2 mb-3">
                <UIcon
                  name="i-lucide-file-text"
                  class="size-4 text-primary-600 dark:text-primary-400"
                />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Pratinjau Lembar Persetujuan Direksi
                </h3>
              </div>
              <div
                class="rounded-xl border border-primary-200 bg-primary-50/40 p-4 dark:border-primary-900/50 dark:bg-primary-950/20 overflow-x-auto"
              >
                <LembarPersetujuanDireksiTemplate
                  v-model="sheet"
                  :directors="bodDirectors"
                  :signed-directors="pdSignedDirectors"
                  :read-only="!canEditSheet"
                />
              </div>
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
                    :can-approve-item="canApproveDirector"
                    :busy="busy"
                    paraf-label="Setuju"
                    :is-legal="isLegalRole"
                    @paraf="openParafModal"
                    @tolak="openTolakModal"
                    @add-delegate="openAddDelegate"
                    @edit-delegate="openEditDelegate"
                    @remove-delegate="removeDelegate"
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
                    :can-approve-item="canApproveDirector"
                    :busy="busy"
                    paraf-label="Setuju"
                    :is-legal="isLegalRole"
                    @paraf="openParafModal"
                    @tolak="openTolakModal"
                    @add-delegate="openAddDelegate"
                    @edit-delegate="openEditDelegate"
                    @remove-delegate="removeDelegate"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- ── Aksi (selaras dengan Blanko Verbal) ── -->
          <div class="mt-2 rounded-xl bg-primary-50/50 px-4 py-4 dark:bg-primary-900/10 sm:px-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-start gap-3">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 shadow-sm dark:bg-primary-900/40 dark:text-primary-400"
                >
                  <UIcon :name="aksiLembar.icon" class="size-5" />
                </span>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">
                    {{ aksiLembar.title }}
                  </h3>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ aksiLembar.desc }}
                  </p>
                </div>
              </div>
              <div v-if="canEditSheet" class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <UButton
                  label="Kirim Lembar Persetujuan Direksi"
                  color="primary"
                  size="lg"
                  icon="i-lucide-send"
                  class="w-full justify-center font-semibold shadow-lg shadow-primary-500/20 sm:w-auto"
                  :loading="busy && busyMessage === 'Mengirim lembar persetujuan direksi…'"
                  :disabled="busy"
                  @click="openKirim"
                />
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- ── Kirim Modal (selaras dengan Blanko Verbal) ── -->
      <VerifyActionModal
        v-model="showKirimModal"
        variant="approve"
        title="Kirim Lembar Persetujuan Direksi"
        description="Lembar persetujuan direksi akan dikirim ke kelompok Diketahui Oleh untuk approval berurutan."
        :require-note="false"
        note-placeholder="Catatan opsional…"
        confirm-label="Kirim Lembar Persetujuan Direksi"
        :saving="busy"
        @confirm="kirimSheet"
      />

      <!-- ── Paraf Modal ── -->
      <VerifyActionModal
        v-model="parafModalOpen"
        variant="approve"
        title="Setuju"
        description="Anda akan menyetujui lembar persetujuan direksi atas nama pejabat berikut."
        note-placeholder="Catatan opsional…"
        confirm-label="Setuju"
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
                {{ activeApprovalActorInfo.name }}
              </p>
              <p class="truncate text-sm font-medium text-gray-600 dark:text-gray-300">
                {{ activeApprovalActorInfo.role || '-' }}
              </p>
            </div>
          </div>
        </template>
      </VerifyActionModal>

      <TulisDigsigPassphraseModalAsync
        ref="signMethodModalRef"
        v-model:open="signMethodModalOpen"
        :signer-info="finalSignerInfo"
        :is-loading="busy"
        :hide-basah="true"
        @submit="submitFinalSignature"
      />

      <!-- ── Tolak Modal ── -->
      <VerifyActionModal
        v-model="tolakModalOpen"
        variant="reject"
        title="Tolak"
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

    <DelegateDireksiPickerModal
      v-if="delegasiTarget"
      v-model:open="delegasiModalOpen"
      :naskah-id="id"
      :approval-id="delegasiTarget.approvalId ?? ''"
      :company-id="companyId"
      :mode="delegasiMode"
      :current-delegate-name="delegasiTarget.delegateName"
      :current-delegate-persnum="delegasiTarget.delegatePersnum"
      :current-position-status="delegasiTarget.delegatePositionStatus ?? 'PT'"
      @saved="onDelegasiSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { CalendarDate } from '@internationalized/date';
import LembarPersetujuanDireksiTemplate from '~/components/NaskahLainnya/LembarPersetujuanDireksiTemplate.vue';
import DirectorOrderSelector from '~/components/NaskahLainnya/DirectorOrderSelector.vue';
import DireksiApprovalProgress from '~/components/NaskahLainnya/DireksiApprovalProgress.vue';
import TemplateDireksiSelector from '~/components/NaskahLainnya/TemplateDireksiSelector.vue';
import DelegateDireksiPickerModal from '~/components/NaskahLainnya/DelegateDireksiPickerModal.vue';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';
import type { SheetFormModel, DirectorApprovalItem, ApprovalRow } from '~/types/naskah-lainnya';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const id = computed(() => route.params.id as string);
const { user, isLegalRole } = useAuth();
const toast = useToast();
const { t } = useI18n();

const {
  detail,
  fetchDetail,
  fetchBodDirectors,
  kirimLembarPersetujuanDireksi,
  parafLembarPersetujuanDireksi,
  tolakLembarPersetujuanDireksi,
  removeDelegasiDireksi,
} = useNaskahLainnya();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: `/naskah-lainnya/${id.value}` },
  { label: 'Blanko Verbal', to: '#' },
]);

const maxPerihal = 200;

const loading = ref(true);
const busy = ref(false);
const busyMessage = ref('');
const catatan = ref('');
const bodDirectors = ref<DirectorApprovalItem[]>([]);

const showKirimModal = ref(false);
const selectedTemplate = ref<'blanko_verbal' | 'lembar_persetujuan_direksi'>(
  'lembar_persetujuan_direksi'
);

const parafModalOpen = ref(false);
const tolakModalOpen = ref(false);
const activeDirector = ref<DirectorApprovalItem | null>(null);
const signMethodModalOpen = ref(false);
const pendingParafNote = ref('');
const signMethodModalRef = ref<{ setPassphraseError: (message: string) => void } | null>(null);

const delegasiModalOpen = ref(false);
const delegasiTarget = ref<DirectorApprovalItem | null>(null);
const delegasiMode = ref<'add' | 'edit'>('add');
const companyId = computed(() => detail.value?.companyId ?? '');

function openAddDelegate(d: DirectorApprovalItem) {
  delegasiTarget.value = d;
  delegasiMode.value = 'add';
  delegasiModalOpen.value = true;
}
function openEditDelegate(d: DirectorApprovalItem) {
  delegasiTarget.value = d;
  delegasiMode.value = 'edit';
  delegasiModalOpen.value = true;
}
async function removeDelegate(d: DirectorApprovalItem) {
  if (!d.approvalId) return;
  try {
    await removeDelegasiDireksi(id.value, d.approvalId);
    await fetchDetail(id.value);
    toast.add({ title: 'Delegate dihapus', color: 'success' });
  } catch {
    toast.add({ title: 'Gagal menghapus delegate', color: 'error' });
  }
}
async function onDelegasiSaved() {
  await fetchDetail(id.value);
}

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
const isBlankoStage = computed(() => detail.value?.tahapan === 'blanko_verbal');
const pdRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'persetujuan_direksi')
);
const pdDitetapkanRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'persetujuan_direksi_ditetapkan')
);
const hasActiveBlankoVerbal = computed(() =>
  (detail.value?.approval ?? []).some(
    (a) =>
      (a.tahap === 'blanko_verbal' || a.tahap === 'blanko_verbal_ditetapkan') &&
      (a.status === 'waiting' || a.status === 'pending')
  )
);
const templateLocked = computed(
  () =>
    hasActiveBlankoVerbal.value ||
    [...pdRows.value, ...pdDitetapkanRows.value].some(
      (a) => a.status === 'waiting' || a.status === 'pending'
    )
);
const hasActiveLembarPersetujuan = computed(() =>
  [...pdRows.value, ...pdDitetapkanRows.value].some(
    (a) => a.status === 'waiting' || a.status === 'pending'
  )
);

async function changeTemplate(value: 'blanko_verbal' | 'lembar_persetujuan_direksi') {
  if (templateLocked.value || value === selectedTemplate.value) return;
  selectedTemplate.value = value;
  if (value === 'blanko_verbal') {
    await navigateTo(`/naskah-lainnya/${id.value}/blanko-verbal`);
  }
}
// Editable saat evaluasi (alur normal: kirim = transisi ke PD) atau saat sudah di
// persetujuan_direksi tapi baris BOD belum ada (recovery naskah yang masuk PD tanpa lembar).
const canEditSheet = computed(
  () =>
    isEvaluasi.value ||
    (isPd.value && pdDirectors.value.length === 0 && !hasActiveLembarPersetujuan.value) ||
    (isBlankoStage.value &&
      pdDirectors.value.length === 0 &&
      !hasActiveLembarPersetujuan.value &&
      Boolean(detail.value?.availableActions?.includes('kirim-approval-blanko')))
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
  approvalId: a.id,
  delegatePersnum: a.delegatePersnum,
  delegateName: a.delegateName,
  delegatePositionStatus: a.delegatePositionStatus,
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
// Pejabat yang sudah memaraf → stamp visible digsig langsung muncul di live preview.
const pdSignedDirectors = computed(() => pdDirectors.value.filter((d) => d.status === 'verified'));
const selectableDirectors = computed(() => bodDirectors.value.filter((d) => d.nama || d.jabatan));

const parafDone = computed(() => pdDirectors.value.filter((d) => d.status === 'verified').length);
const nextDirector = computed(() => pdDirectors.value.find((d) => d.status === 'waiting') ?? null);
const allPdVerified = computed(
  () => pdDirectors.value.length > 0 && pdDirectors.value.every((d) => d.status === 'verified')
);

const pdBanner = computed(() => {
  if (canEditSheet.value) {
    return {
      icon: 'i-lucide-file-pen-line',
      card: 'border-primary-200 bg-primary-50 dark:border-primary-900/50 dark:bg-primary-950/30',
      wrap: 'bg-primary-500',
      title: 'Susun Lembar Persetujuan Direksi',
      desc: 'Lengkapi data lembar, lalu kirim ke kelompok Diketahui Oleh untuk approval.',
    };
  }
  if (allPdVerified.value) {
    return {
      icon: 'i-lucide-circle-check-big',
      card: 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30',
      wrap: 'bg-green-500',
      title: 'Persetujuan Direksi Selesai',
      desc: 'Seluruh approval selesai. Lembar dan naskah final telah ditandatangani.',
    };
  }
  return {
    icon: 'i-lucide-stamp',
    card: 'border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30',
    wrap: 'bg-violet-500',
    title: 'Menunggu Paraf Direksi',
    desc: `${parafDone.value}/${pdDirectors.value.length} direksi telah memaraf${nextDirector.value ? ' — giliran ' + nextDirector.value.nama + '.' : '.'}`,
  };
});

const aksiLembar = computed(() => {
  if (canEditSheet.value) {
    return {
      icon: 'i-lucide-send',
      title: 'Kirim Lembar Persetujuan Direksi',
      desc: 'Tinjau live preview lembar, lalu kirim ke kelompok Diketahui Oleh.',
    };
  }
  if (allPdVerified.value) {
    return {
      icon: 'i-lucide-circle-check-big',
      title: 'Persetujuan Direksi Selesai',
      desc: 'Seluruh approval Lembar Persetujuan Direksi telah selesai.',
    };
  }
  return {
    icon: 'i-lucide-stamp',
    title: 'Menunggu Persetujuan Direksi',
    desc: 'Approval berjalan berurutan: Diketahui Oleh, lalu Ditetapkan/Disahkan Oleh.',
  };
});

function isDirut(director: DirectorApprovalItem) {
  return /direktur\s*utama/i.test(director.jabatan || '');
}

function compactDirector(director: DirectorApprovalItem): DirectorApprovalItem {
  return {
    nama: director.nama,
    jabatan: director.jabatan,
    positionId: director.positionId,
    persnum: director.persnum,
    delegator: director.delegator?.trim() || 'ybs',
    // Routing delegasi — ikut round-trip agar restore form tidak hilang.
    delegatePersnum: director.delegatePersnum,
    delegateName: director.delegateName,
    delegatePositionStatus: director.delegatePositionStatus,
  };
}

function cleanSheetPayload(): SheetFormModel {
  const cleanDirector = (director: DirectorApprovalItem) => ({
    nama: director.nama,
    jabatan: director.jabatan,
    positionId: director.positionId,
    persnum: director.persnum,
    delegator: director.delegator?.trim() || 'ybs',
    // Routing delegasi ke pengganti (persnum) — tanpa ini BE tidak bisa
    // mengarahkan paraf ke pengganti saat seeding approval.
    delegatePersnum: director.delegatePersnum,
    delegateName: director.delegateName,
    delegatePositionStatus: director.delegatePositionStatus,
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
    // Baris delegasi: nama approval row adalah ybs direksi — untuk preview
    // template, kembalikan ke nama pengganti + status (prefix PT/PH/PS).
    const fromRow = (a: ApprovalRow, idx: number) =>
      compactDirector({
        index: a.urutan ?? idx + 1,
        nama: a.delegateName?.trim() || a.nama,
        jabatan: a.jabatan,
        positionId: a.positionId,
        persnum: a.persnum,
        delegator: a.delegateName?.trim() ? a.delegatePositionStatus || 'ybs' : 'ybs',
        delegatePersnum: a.delegatePersnum,
        delegateName: a.delegateName,
        delegatePositionStatus: a.delegatePositionStatus,
      });
    sheet.value.diketahuiOleh = pdRows.value.map(fromRow);
    if (pdDitetapkanRows.value.length) {
      sheet.value.ditetapkanOleh = pdDitetapkanRows.value.map(fromRow);
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
    (row.delegatePersnum && String(row.delegatePersnum) === uid) ||
    (row.positionId && String(row.positionId) === pos) ||
    (row.nama && row.nama.trim().toLowerCase() === nama)
  );
}

const isCurrentUserApprover = computed(() =>
  [...pdRows.value, ...pdDitetapkanRows.value].some(isUserApprover)
);
const canApprove = computed(() => isCurrentUserApprover.value);
const canApproveDirector = (director: DirectorApprovalItem) =>
  isUserApprover(director as ApprovalRow);

const activeApprovalActorInfo = computed(() => {
  const signer = activeDirector.value;
  const status = signer?.delegatePositionStatus?.replace(/\.+$/, '');
  return {
    name: signer?.delegateName || signer?.nama || user.value?.nama || 'Penandatangan',
    role: status ? `${status}. ${signer?.jabatan || ''}` : signer?.jabatan || '',
  };
});

const finalSignerInfo = computed(() => {
  return {
    ...activeApprovalActorInfo.value,
    label: 'Ditandatangani secara digital',
  };
});

function requiresFinalSignatureChoice(director: DirectorApprovalItem): boolean {
  const row = (detail.value?.approval ?? []).find(
    (approval) => approval.id === director.approvalId
  );
  if (
    !detail.value?.butuhLegal ||
    !['digsig', 'qr_only'].includes(detail.value?.signOption ?? '') ||
    row?.tahap !== 'persetujuan_direksi_ditetapkan'
  ) {
    return false;
  }
  const sheetRows = (detail.value?.approval ?? []).filter((approval) =>
    ['persetujuan_direksi', 'persetujuan_direksi_ditetapkan'].includes(approval.tahap)
  );
  return (
    sheetRows.length > 0 &&
    sheetRows.every((approval) => approval.id === row.id || approval.status === 'verified')
  );
}

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
    if (isBlankoStage.value && hasActiveBlankoVerbal.value) {
      await navigateTo(`/naskah-lainnya/${id.value}/blanko-verbal`, { replace: true });
      return;
    }
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

function openKirim() {
  if (!sheet.value.ditetapkanOleh?.length) {
    toast.add({
      title: 'Pilih minimal satu pejabat pada Ditetapkan/Disahkan Oleh',
      color: 'warning',
    });
    return;
  }
  if (!sheet.value.diketahuiOleh?.length) {
    toast.add({
      title: 'Pilih minimal satu direksi pada Diketahui Oleh',
      color: 'warning',
    });
    return;
  }
  showKirimModal.value = true;
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
    showKirimModal.value = false;
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
  if (requiresFinalSignatureChoice(activeDirector.value)) {
    pendingParafNote.value = note ?? '';
    parafModalOpen.value = false;
    signMethodModalOpen.value = true;
    return;
  }
  await persistParaf(note ?? '');
}

async function submitFinalSignature(data: { method: string; passphrase?: string }) {
  await persistParaf(pendingParafNote.value, {
    signMethod: data.method as 'qr_only' | 'digsig',
    passphrase: data.passphrase,
  });
}

async function persistParaf(
  note: string,
  signing?: { signMethod: 'qr_only' | 'digsig'; passphrase?: string }
) {
  if (!activeDirector.value) return;
  busy.value = true;
  busyMessage.value = 'Mencatat paraf…';
  try {
    await parafLembarPersetujuanDireksi(
      id.value,
      { ...cleanSheetPayload(), ...signing },
      note,
      activeDirector.value.approvalId
    );
    toast.add({ title: 'Persetujuan tercatat', color: 'success' });
    parafModalOpen.value = false;
    signMethodModalOpen.value = false;
    pendingParafNote.value = '';
    activeDirector.value = null;
    await loadDetail();
    if (detail.value?.tahapan === 'selesai') {
      await navigateTo(`/naskah-lainnya/${id.value}/selesai`, {
        replace: true,
      });
    }
  } catch (e) {
    const message = apiErrorMessage(e);
    if (signing?.signMethod === 'digsig' && /passphrase|bsre/i.test(message)) {
      signMethodModalRef.value?.setPassphraseError(message);
    } else {
      toast.add({ title: 'Gagal mencatat paraf', description: message, color: 'error' });
    }
  } finally {
    busy.value = false;
    busyMessage.value = '';
  }
}

async function confirmTolak(note) {
  busy.value = true;
  busyMessage.value = 'Menolak lembar persetujuan…';
  try {
    await tolakLembarPersetujuanDireksi(
      id.value,
      (note ?? '').trim(),
      activeDirector.value?.approvalId
    );
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
