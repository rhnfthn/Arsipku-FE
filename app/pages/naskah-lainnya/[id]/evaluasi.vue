<template>
  <div class="space-y-6">
    <PageHeader :items="breadcrumbs" :back-to="`/naskah-lainnya/${id}`">
      <template #title>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ detail?.perihal || 'Memuat…' }}
        </h1>
      </template>
    </PageHeader>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Gagal memuat naskah"
      :description="errorMessage"
    />

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <div
      v-else-if="canDecideEvaluation || canProcessContinuation"
      class="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="flex items-start gap-3 bg-primary-50 px-5 py-4 dark:bg-primary-900/20">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50"
        >
          <UIcon name="i-lucide-user-check" class="size-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div class="min-w-0">
          <h2 class="font-semibold text-primary-900 dark:text-primary-100">
            {{ workspaceBannerTitle }}
          </h2>
          <p class="mt-0.5 text-sm text-primary-700 dark:text-primary-300">
            {{ workspaceBannerDescription }}
          </p>
        </div>
      </div>

      <NaskahDraftWorkspace
        v-model="catatan"
        :detail="detail"
        :dokumen-pendukung="supportingDocuments"
        :area-title="workspaceAreaTitle"
        :area-description="workspaceAreaDescription"
        :catatan-title="workspaceNoteTitle"
        :catatan-placeholder="workspaceNotePlaceholder"
        :show-catatan="!canDecideEvaluation"
        :show-actions="false"
        :docx-url="detail.filePreviewUrl || `/naskah-lainnya/${id}/file`"
        :show-draf-download="false"
        :stage-upload="true"
        staged-success-description="Revisi siap dikirim bersama tindakan persetujuan lanjutan"
        :divided="true"
        @download="downloadDocument"
        @stage-revisi="stagedRevision = $event"
      />

      <!-- Dokumen pelengkap: Blanko Verbal / Lembar Persetujuan Direksi (PDF sheet)
           agar approver melihat dokumen pendukung keputusan sebelum menyetujui. -->
      <div v-if="sheetDokumen.length" class="px-5 py-4">
        <div class="mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-file-check-2" class="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Dokumen Sheet</h3>
          <span class="text-xs text-gray-400">(Blanko Verbal / Lembar Persetujuan Direksi)</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="doc in sheetDokumen"
            :key="doc.id"
            class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
          >
            <span class="text-2xl">📑</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ sheetDokumenLabel(doc) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                PDF · {{ sheetDokumenTipeLabel(doc.tipe) }}
              </p>
            </div>
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-eye"
              @click="previewSheetDokumen(doc)"
              >Preview</UButton
            >
          </div>
        </div>
      </div>

      <div v-if="showRecipientSelector" class="px-5 py-4">
        <div class="mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-users" class="size-5 text-gray-500" />
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ recipientSectionTitle }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Opsional, hanya penerima dalam unit yang sama
            </p>
          </div>
        </div>

        <div v-if="loadingCandidates || recipientOptions.length" class="flex items-center gap-2">
          <USelectMenu
            v-model="selectedRecipientId"
            :items="recipientOptions"
            :loading="loadingCandidates"
            :disabled="isBusy"
            value-key="value"
            searchable
            :filter-fields="['label', 'jabatan']"
            :placeholder="recipientPlaceholder"
            class="min-w-0 flex-1"
            :content="{ side: 'bottom', align: 'start', collisionPadding: 8 }"
          >
            <template #default>
              <div
                v-if="selectedRecipient"
                class="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30"
                >
                  <UIcon
                    name="i-lucide-user"
                    class="size-4 text-primary-600 dark:text-primary-400"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {{ selectedRecipient.label }}
                  </div>
                  <div class="truncate text-xs text-gray-500 dark:text-gray-400">
                    {{ selectedRecipient.jabatan }}
                  </div>
                </div>
              </div>
              <span v-else class="text-gray-500">{{ recipientPlaceholder }}</span>
            </template>

            <template #item="{ item }">
              <div class="min-w-0 py-0.5">
                <div class="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {{ item.label }}
                </div>
                <div class="truncate text-xs text-gray-500 dark:text-gray-400">
                  {{ item.jabatan }}
                </div>
              </div>
            </template>
          </USelectMenu>

          <!-- Hapus pilihan penerima (kembali ke tanpa penerima). -->
          <UButton
            v-if="selectedRecipientId"
            color="error"
            variant="outline"
            icon="i-lucide-trash-2"
            size="sm"
            :disabled="isBusy"
            aria-label="Hapus penerima"
            @click="clearSelectedRecipient"
          />
        </div>

        <UAlert
          v-else
          color="neutral"
          variant="subtle"
          icon="i-lucide-user-x"
          title="Tidak ada penerima lain"
          :description="emptyRecipientDescription"
        />
      </div>

      <div class="bg-primary-50/50 px-5 py-4 dark:bg-primary-900/10">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-3">
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40"
            >
              <UIcon name="i-lucide-send" class="size-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ actionSectionTitle }}
              </h3>
              <p class="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                {{ actionDescription }}
              </p>
            </div>
          </div>

          <div
            v-if="canProcessContinuation"
            class="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
          >
            <UButton
              color="primary"
              variant="outline"
              size="lg"
              icon="i-lucide-forward"
              class="w-full justify-center font-semibold sm:w-auto"
              :loading="activeAction === 'forward'"
              :disabled="isBusy || !selectedRecipientId"
              @click="forwardContinuation"
            >
              Teruskan
            </UButton>
            <UButton
              color="success"
              size="lg"
              icon="i-lucide-circle-check-big"
              class="w-full justify-center font-semibold shadow-sm sm:w-auto"
              :loading="activeAction === 'finish'"
              :disabled="isBusy"
              @click="finishContinuation"
            >
              Selesai — Kembalikan ke EVP
            </UButton>
          </div>

          <div v-else class="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <UButton
              color="warning"
              variant="outline"
              size="lg"
              icon="i-lucide-rotate-ccw"
              class="w-full justify-center font-semibold sm:w-auto"
              :disabled="isBusy"
              @click="openRejection('legal_drafting_ulang')"
            >
              Legal Drafting Ulang
            </UButton>
            <UButton
              color="error"
              variant="outline"
              size="lg"
              icon="i-lucide-ban"
              class="w-full justify-center font-semibold sm:w-auto"
              :disabled="isBusy"
              @click="openRejection('batalkan')"
            >
              Batalkan
            </UButton>
            <UButton
              color="primary"
              size="lg"
              icon="i-lucide-arrow-right"
              trailing
              class="w-full justify-center font-semibold shadow-sm sm:w-auto"
              :loading="activeAction === 'decision'"
              :disabled="isBusy"
              @click="openContinueConfirmation"
            >
              Lanjut Persetujuan
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <UAlert
      v-else
      color="neutral"
      variant="subtle"
      icon="i-lucide-clock-3"
      title="Menunggu proses evaluasi"
      description="Tidak ada tindakan persetujuan lanjutan yang perlu Anda kerjakan saat ini."
    />

    <Teleport to="body">
      <Modal
        v-model="showEvaluationRejectOptions"
        :hide-default-footer="true"
        :saving="isBusy"
        size="lg"
      >
        <template #title>
          <Heading
            variant="heading9b"
            class="ml-5 mt-5 mb-2 text-sm font-bold"
            :class="
              pendingDecision === 'batalkan'
                ? 'text-red-600 dark:text-red-400'
                : 'text-amber-600 dark:text-amber-400'
            "
          >
            {{ rejectionModalTitle }}
          </Heading>
        </template>

        <div class="space-y-4 px-6 pb-6">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ rejectionModalDescription }}
          </p>

          <UFormField label="Alasan" required>
            <UTextarea
              v-model="rejectionReason"
              :rows="4"
              autoresize
              placeholder="Tuliskan alasan keputusan Anda…"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <div
            class="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 sm:flex-row sm:justify-end"
          >
            <UButton
              color="neutral"
              variant="ghost"
              size="lg"
              :disabled="isBusy"
              @click="showEvaluationRejectOptions = false"
            >
              Batal
            </UButton>
            <UButton
              size="lg"
              :color="pendingDecision === 'batalkan' ? 'error' : 'warning'"
              :icon="pendingDecision === 'batalkan' ? 'i-lucide-ban' : 'i-lucide-rotate-ccw'"
              :loading="
                pendingDecision === 'batalkan'
                  ? activeAction === 'reject-cancel'
                  : activeAction === 'reject-legal'
              "
              :disabled="isBusy || !rejectionReason.trim()"
              @click="submitPendingDecision"
            >
              {{ rejectionModalTitle }}
            </UButton>
          </div>
        </div>
      </Modal>
    </Teleport>

    <VerifyActionModal
      v-model="showContinueConfirmation"
      variant="approve"
      title="Lanjut Persetujuan"
      :description="continueConfirmationDescription"
      note-placeholder="Catatan persetujuan (opsional)"
      confirm-label="Lanjut Persetujuan"
      :saving="activeAction === 'decision'"
      @confirm="submitContinueDecision"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';
import type { ApprovalItem, RevisionFilePair } from '~/types/naskah-lainnya';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { t } = useI18n();
const { apiGet } = useApi();
const id = computed(() => String(route.params.id));

const {
  detail,
  error,
  fetchDetail,
  fetchKandidatPersetujuan,
  keputusanEvaluasi,
  teruskanPersetujuan,
  selesaiPersetujuan,
  uploadRevisiDokumen,
} = useNaskahLainnya();

type RecipientOption = ApprovalItem & {
  value: string;
  label: string;
  jabatan: string;
};

const catatan = ref('');
const loading = ref(true);
const activeAction = ref<
  'forward' | 'finish' | 'decision' | 'reject-legal' | 'reject-cancel' | null
>(null);
const loadingCandidates = ref(false);
const candidates = ref<ApprovalItem[]>([]);
const selectedRecipientId = ref<string | null>(null);
const stagedRevision = ref<RevisionFilePair>({ docx: null });
const showEvaluationRejectOptions = ref(false);
const showContinueConfirmation = ref(false);
const continueNote = ref('');
const rejectionReason = ref('');
const pendingDecision = ref<'legal_drafting_ulang' | 'batalkan' | null>(null);

const actions = computed(() => detail.value?.availableActions ?? []);
const supportingDocuments = computed(() =>
  (detail.value?.dokumen ?? []).filter((document) => document.tipe === 'pendukung')
);

// Dokumen sheet (Blanko Verbal / Lembar Persetujuan Direksi) yang sudah
// tersimpan — PDF hasil render BE, dipreview via endpoint dokumen download.
const sheetDokumen = computed(() =>
  (detail.value?.dokumen ?? []).filter((document) =>
    ['blanko_verbal_pdf', 'lembar_persetujuan_direksi_pdf'].includes(document.tipe)
  )
);

function sheetDokumenTipeLabel(tipe: string) {
  if (tipe === 'blanko_verbal_pdf') return 'Blanko Verbal';
  if (tipe === 'lembar_persetujuan_direksi_pdf') return 'Lembar Persetujuan Direksi';
  return tipe;
}

function sheetDokumenLabel(doc: any) {
  return doc.nama || sheetDokumenTipeLabel(doc.tipe);
}

async function previewSheetDokumen(doc: any) {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/dokumen/${doc.id}/download?inline=1`, {
      responseType: 'blob',
    });
    const pdf = new Blob([await blob.arrayBuffer()], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(pdf);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  }
}
const errorMessage = computed(() => getErrorMessage(error.value, 'Gagal memuat detail naskah.'));

const breadcrumbs = computed(() => [
  { label: t('naskahLainnya.title'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: `/naskah-lainnya/${id.value}` },
  { label: canDecideEvaluation.value ? 'Evaluasi EVP' : 'Persetujuan Lanjutan' },
]);

const canDecideEvaluation = computed(() =>
  ['lanjut-persetujuan', 'legal-drafting-ulang', 'batalkan-evaluasi'].some((action) =>
    actions.value.includes(action as (typeof actions.value)[number])
  )
);
const canProcessContinuation = computed(() =>
  ['teruskan-persetujuan', 'selesai-persetujuan'].some((action) =>
    actions.value.includes(action as (typeof actions.value)[number])
  )
);
const isFinalEvaluation = computed(() => detail.value?.tahapan === 'evaluasi_final');
const showRecipientSelector = computed(() => canProcessContinuation.value);
const isBusy = computed(() => activeAction.value !== null);

const currentContinuation = computed(
  () =>
    (detail.value?.approval ?? [])
      .filter((item) => item.tahap === 'persetujuan_lanjutan' && item.status === 'waiting')
      .sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0))[0]
);

const continuationDescription = computed(() => {
  const recipient = currentContinuation.value;
  if (!recipient) {
    return 'Tinjau naskah, lakukan revisi bila diperlukan, lalu tentukan tindakan selanjutnya.';
  }

  const position = recipient.jabatan ? ` (${recipient.jabatan})` : '';
  return `Penerima aktif: ${recipient.nama}${position}. Tinjau naskah lalu tentukan tindakan selanjutnya.`;
});

const workspaceBannerTitle = computed(() =>
  canDecideEvaluation.value
    ? isFinalEvaluation.value
      ? 'Keputusan Final EVP'
      : 'Evaluasi EVP Aktif'
    : 'Persetujuan Lanjutan Aktif'
);
const workspaceBannerDescription = computed(() => {
  if (canDecideEvaluation.value) {
    return isFinalEvaluation.value
      ? 'Hasil persetujuan lanjutan telah kembali. Tinjau naskah dan tentukan keputusan final EVP.'
      : 'Tinjau naskah, unggah revisi bila diperlukan, lalu tentukan keputusan evaluasi.';
  }
  return continuationDescription.value;
});
const workspaceAreaTitle = computed(() =>
  canDecideEvaluation.value ? 'Evaluasi EVP' : 'Persetujuan Lanjutan'
);
const workspaceAreaDescription = computed(() =>
  canDecideEvaluation.value
    ? 'Tinjau naskah sebagai EVP. Bila diperlukan, unggah revisi DOCX; PDF pratinjau dibuat otomatis sebelum memberikan keputusan.'
    : 'Tinjau naskah, unggah revisi DOCX bila diperlukan, lalu teruskan atau selesaikan pekerjaan.'
);
const workspaceNoteTitle = computed(() =>
  canDecideEvaluation.value ? 'Catatan Evaluasi EVP' : 'Catatan Penerima'
);
const workspaceNotePlaceholder = computed(() =>
  canDecideEvaluation.value
    ? 'Tambahkan catatan hasil evaluasi EVP...'
    : 'Tambahkan catatan untuk proses persetujuan lanjutan...'
);
const recipientSectionTitle = computed(() => 'Penerima Selanjutnya');
const recipientPlaceholder = computed(() => 'Pilih penerima selanjutnya');
const emptyRecipientDescription = computed(
  () =>
    'Tidak ditemukan verifikator lain dalam unit yang sama. Anda tetap dapat menyelesaikan pekerjaan dan mengembalikannya ke EVP.'
);
const actionSectionTitle = computed(() =>
  canDecideEvaluation.value ? 'Keputusan Evaluasi' : 'Tindakan Persetujuan'
);

const toOption = (item: ApprovalItem): RecipientOption => ({
  ...item,
  value: String(item.positionId ?? item.persnum ?? item.nama),
  label: item.nama || item.persnum || 'Penerima',
  jabatan: item.jabatan || 'Jabatan tidak tersedia',
});

const normalizeCandidates = (payload: unknown): ApprovalItem[] => {
  const value = payload as { data?: unknown } | ApprovalItem[] | null;
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data as ApprovalItem[];
  return [];
};

const recipientOptions = computed<RecipientOption[]>(() => candidates.value.map(toOption));
const selectedRecipient = computed(
  () => recipientOptions.value.find((item) => item.value === selectedRecipientId.value) ?? null
);

// Hapus pilihan penerima — kembali ke "tanpa penerima" (opsional).
const clearSelectedRecipient = () => {
  if (isBusy.value) return;
  selectedRecipientId.value = null;
};

const actionDescription = computed(() => {
  if (canDecideEvaluation.value) {
    if (isFinalEvaluation.value) {
      return 'Lanjutkan ke tahap berikutnya, atau tolak untuk Legal Drafting Ulang maupun pembatalan.';
    }
    return 'Lanjut Persetujuan akan mengarahkan naskah ke Blanko Verbal Persetujuan Direksi.';
  }
  if (selectedRecipient.value) {
    return `Teruskan kepada ${selectedRecipient.value.label}, atau selesaikan pekerjaan untuk dikembalikan ke EVP.`;
  }
  return 'Pilih penerima untuk meneruskan, atau selesaikan pekerjaan untuk dikembalikan ke EVP.';
});

const getErrorMessage = (err: unknown, fallback: string) => {
  const response = err as { data?: { message?: string | string[] }; message?: string };
  const message = response?.data?.message ?? response?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
};

const rejectionModalTitle = computed(() =>
  pendingDecision.value === 'batalkan' ? 'Batalkan Naskah' : 'Legal Drafting Ulang'
);
const rejectionModalDescription = computed(() =>
  pendingDecision.value === 'batalkan'
    ? 'Naskah akan dibatalkan dan tidak dilanjutkan. Tuliskan alasan pembatalan.'
    : 'Naskah dikembalikan ke konseptor pemrakarsa untuk menyunting ulang form awal. Tuliskan alasan pengembalian.'
);

const continueConfirmationDescription = computed(() =>
  isFinalEvaluation.value
    ? 'Pastikan naskah dan dokumen revisi sudah sesuai sebelum melanjutkan ke tahap berikutnya.'
    : 'Naskah akan dilanjutkan ke step Blanko Verbal Persetujuan Direksi. Pastikan naskah dan dokumen revisi sudah sesuai.'
);

const openContinueConfirmation = () => {
  if (!canDecideEvaluation.value || isBusy.value) return;
  showContinueConfirmation.value = true;
};

const submitContinueDecision = (note: string) => {
  continueNote.value = note;
  submitEvaluationDecision('lanjut_persetujuan');
};

const openRejection = (decision: 'legal_drafting_ulang' | 'batalkan') => {
  if (isBusy.value) return;
  pendingDecision.value = decision;
  rejectionReason.value = '';
  showEvaluationRejectOptions.value = true;
};

const submitPendingDecision = () => {
  if (!pendingDecision.value) return;
  submitEvaluationDecision(pendingDecision.value);
};

const submitEvaluationDecision = async (
  decision: 'lanjut_persetujuan' | 'legal_drafting_ulang' | 'batalkan'
) => {
  if (!canDecideEvaluation.value || isBusy.value) return;
  if (decision !== 'lanjut_persetujuan' && !rejectionReason.value.trim()) {
    toast.add({
      title: 'Alasan penolakan wajib diisi',
      description: 'Tuliskan alasan untuk Legal Drafting Ulang atau pembatalan.',
      color: 'warning',
    });
    return;
  }

  activeAction.value =
    decision === 'lanjut_persetujuan'
      ? 'decision'
      : decision === 'legal_drafting_ulang'
        ? 'reject-legal'
        : 'reject-cancel';
  try {
    if (!(await commitRevision())) return;
    await keputusanEvaluasi(id.value, {
      keputusan: decision,
      catatan:
        decision === 'lanjut_persetujuan'
          ? continueNote.value.trim() || undefined
          : rejectionReason.value.trim(),
    });
    toast.add({ title: 'Keputusan evaluasi berhasil disimpan', color: 'success' });
    showEvaluationRejectOptions.value = false;
    showContinueConfirmation.value = false;
    await router.push(`/naskah-lainnya/${id.value}`);
  } catch (err) {
    toast.add({
      title: 'Gagal menyimpan keputusan evaluasi',
      description: getErrorMessage(err, 'Keputusan evaluasi tidak dapat disimpan.'),
      color: 'error',
    });
  } finally {
    activeAction.value = null;
  }
};

const loadContinuationCandidates = async () => {
  loadingCandidates.value = true;
  try {
    const response = await fetchKandidatPersetujuan(id.value);
    candidates.value = normalizeCandidates(response);
  } catch (err) {
    candidates.value = [];
    toast.add({
      title: 'Gagal memuat penerima',
      description: getErrorMessage(err, 'Daftar penerima lanjutan tidak dapat dimuat.'),
      color: 'error',
    });
  } finally {
    loadingCandidates.value = false;
  }
};

const commitRevision = async (): Promise<boolean> => {
  const hasDocx = Boolean(stagedRevision.value.docx);
  if (!hasDocx) return true;

  await uploadRevisiDokumen(id.value, stagedRevision.value);
  stagedRevision.value = { docx: null };
  return true;
};

const forwardContinuation = async () => {
  const recipient = selectedRecipient.value;
  if (!recipient || isBusy.value) return;

  activeAction.value = 'forward';
  try {
    if (!(await commitRevision())) return;
    await teruskanPersetujuan(id.value, recipient, catatan.value || undefined);
    toast.add({
      title: 'Naskah diteruskan',
      description: `Diteruskan kepada ${recipient.label}.`,
      color: 'success',
    });
    await router.push(`/naskah-lainnya/${id.value}`);
  } catch (err) {
    toast.add({
      title: 'Gagal meneruskan naskah',
      description: getErrorMessage(err, 'Naskah tidak dapat diteruskan.'),
      color: 'error',
    });
  } finally {
    activeAction.value = null;
  }
};

const finishContinuation = async () => {
  if (isBusy.value) return;

  activeAction.value = 'finish';
  try {
    if (!(await commitRevision())) return;
    await selesaiPersetujuan(id.value, catatan.value || undefined);
    toast.add({
      title: 'Dikembalikan ke EVP',
      description: 'Pekerjaan selesai dan naskah telah dikembalikan ke EVP untuk keputusan final.',
      color: 'success',
    });
    await router.push(`/naskah-lainnya/${id.value}`);
  } catch (err) {
    toast.add({
      title: 'Gagal menyelesaikan pekerjaan',
      description: getErrorMessage(err, 'Naskah tidak dapat dikembalikan ke EVP.'),
      color: 'error',
    });
  } finally {
    activeAction.value = null;
  }
};

const downloadDocument = async (filename?: string) => {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    // Artifact signed bisa berupa PDF — ekstensi mengikuti tipe blob aktual.
    anchor.download = filename || naskahFileName(detail.value, naskahFileExtFromBlob(blob));
    anchor.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    toast.add({
      title: 'Gagal mengunduh dokumen',
      description: getErrorMessage(err, 'Dokumen tidak dapat diunduh.'),
      color: 'error',
    });
  }
};

onMounted(async () => {
  try {
    await fetchDetail(id.value);
  } catch {
    loading.value = false;
    return;
  }

  loading.value = false;

  if (canProcessContinuation.value) {
    await loadContinuationCandidates();
  }
});
</script>
