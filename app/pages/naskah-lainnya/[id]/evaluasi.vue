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
        :show-actions="false"
        :docx-url="detail.filePreviewUrl || `/naskah-lainnya/${id}/file`"
        :show-draf-download="false"
        :stage-upload="true"
        staged-success-description="Revisi siap dikirim bersama tindakan persetujuan lanjutan"
        :divided="true"
        @download="downloadDocument"
        @stage-revisi="stagedRevision = $event"
      />

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

        <USelectMenu
          v-if="loadingCandidates || recipientOptions.length"
          v-model="selectedRecipientId"
          :items="recipientOptions"
          :loading="loadingCandidates"
          :disabled="isBusy"
          value-key="value"
          searchable
          :filter-fields="['label', 'jabatan']"
          :placeholder="recipientPlaceholder"
          class="w-full"
          :content="{ side: 'bottom', align: 'start', collisionPadding: 8 }"
        >
          <template #default>
            <div v-if="selectedRecipient" class="flex min-w-0 flex-1 items-center gap-3 text-left">
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30"
              >
                <UIcon name="i-lucide-user" class="size-4 text-primary-600 dark:text-primary-400" />
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
              color="error"
              variant="outline"
              size="lg"
              icon="i-lucide-x"
              class="w-full justify-center font-semibold sm:w-auto"
              :disabled="isBusy"
              @click="openEvaluationRejection"
            >
              Tolak
            </UButton>
            <UButton
              color="primary"
              size="lg"
              icon="i-lucide-arrow-right"
              trailing
              class="w-full justify-center font-semibold shadow-sm sm:w-auto"
              :loading="activeAction === 'decision'"
              :disabled="isBusy || loadingCandidates"
              @click="submitEvaluationDecision('lanjut_persetujuan')"
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
            class="ml-5 mt-5 mb-2 text-sm font-bold text-red-600 dark:text-red-400"
          >
            Tolak Evaluasi
          </Heading>
        </template>

        <div class="space-y-4 px-6 pb-6">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Isi alasan penolakan, kemudian tentukan apakah naskah dikembalikan untuk Legal Drafting
            Ulang atau dibatalkan.
          </p>

          <UFormField label="Alasan Penolakan" required>
            <UTextarea
              v-model="rejectionReason"
              :rows="4"
              autoresize
              placeholder="Tuliskan alasan penolakan…"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <div class="grid gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 sm:grid-cols-2">
            <UButton
              block
              size="lg"
              color="warning"
              variant="soft"
              icon="i-lucide-rotate-ccw"
              :loading="activeAction === 'reject-legal'"
              :disabled="isBusy || !rejectionReason.trim()"
              @click="submitEvaluationDecision('legal_drafting_ulang')"
            >
              Legal Drafting Ulang
            </UButton>
            <UButton
              block
              size="lg"
              color="error"
              icon="i-lucide-ban"
              :loading="activeAction === 'reject-cancel'"
              :disabled="isBusy || !rejectionReason.trim()"
              @click="submitEvaluationDecision('batalkan')"
            >
              Batalkan Naskah
            </UButton>
          </div>
        </div>
      </Modal>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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
const stagedRevision = ref<RevisionFilePair>({ docx: null, pdf: null });
const showEvaluationRejectOptions = ref(false);
const rejectionReason = ref('');

const actions = computed(() => detail.value?.availableActions ?? []);
const supportingDocuments = computed(() =>
  (detail.value?.dokumen ?? []).filter((document) => document.tipe === 'pendukung')
);
const errorMessage = computed(() => getErrorMessage(error.value, 'Gagal memuat detail naskah.'));

const breadcrumbs = computed(() => [
  { label: t('naskahLainnya.title'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: `/naskah-lainnya/${id.value}` },
  { label: canDecideEvaluation.value ? 'Evaluasi EVP' : 'Persetujuan Lanjutan' },
]);

const canSendEvaluation = computed(() => actions.value.includes('kirim-evaluasi'));
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
const showRecipientSelector = computed(
  () => canProcessContinuation.value || (canDecideEvaluation.value && !isFinalEvaluation.value)
);
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
    ? 'Tinjau naskah sebagai EVP. Bila diperlukan, unggah revisi DOCX dan PDF dengan isi yang sama sebelum memberikan keputusan.'
    : 'Tinjau naskah, unggah revisi DOCX dan PDF bila diperlukan, lalu teruskan atau selesaikan pekerjaan.'
);
const workspaceNoteTitle = computed(() =>
  canDecideEvaluation.value ? 'Catatan Evaluasi EVP' : 'Catatan Penerima'
);
const workspaceNotePlaceholder = computed(() =>
  canDecideEvaluation.value
    ? 'Tambahkan catatan hasil evaluasi EVP...'
    : 'Tambahkan catatan untuk proses persetujuan lanjutan...'
);
const recipientSectionTitle = computed(() =>
  canDecideEvaluation.value ? 'Penerima Pertama' : 'Penerima Selanjutnya'
);
const recipientPlaceholder = computed(() =>
  canDecideEvaluation.value ? 'Pilih penerima pertama (opsional)' : 'Pilih penerima selanjutnya'
);
const emptyRecipientDescription = computed(() =>
  canDecideEvaluation.value
    ? 'Tidak ditemukan verifikator lain dalam unit EVP. Lanjut Persetujuan tanpa penerima akan mengarahkan naskah ke Blanko Verbal Persetujuan Direksi.'
    : 'Tidak ditemukan verifikator lain dalam unit yang sama. Anda tetap dapat menyelesaikan pekerjaan dan mengembalikannya ke EVP.'
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

const actionDescription = computed(() => {
  if (canDecideEvaluation.value) {
    if (isFinalEvaluation.value) {
      return 'Lanjutkan ke tahap berikutnya, atau tolak untuk Legal Drafting Ulang maupun pembatalan.';
    }
    if (selectedRecipient.value) {
      return `Lanjutkan kepada ${selectedRecipient.value.label}, atau tolak hasil evaluasi.`;
    }
    return 'Tanpa penerima, Lanjut Persetujuan akan mengarahkan naskah ke Blanko Verbal Persetujuan Direksi.';
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

const openEvaluationRejection = () => {
  rejectionReason.value = '';
  showEvaluationRejectOptions.value = true;
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
      penerimaPertama:
        decision === 'lanjut_persetujuan' && !isFinalEvaluation.value
          ? (selectedRecipient.value ?? undefined)
          : undefined,
      catatan:
        decision === 'lanjut_persetujuan'
          ? catatan.value.trim() || undefined
          : rejectionReason.value.trim(),
    });
    toast.add({ title: 'Keputusan evaluasi berhasil disimpan', color: 'success' });
    showEvaluationRejectOptions.value = false;
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
  const hasPdf = Boolean(stagedRevision.value.pdf);
  if (!hasDocx && !hasPdf) return true;

  if (!hasDocx || !hasPdf) {
    toast.add({
      title: 'Pasangan file belum lengkap',
      description: 'Unggah file DOCX dan PDF dengan isi yang sama.',
      color: 'warning',
    });
    return false;
  }

  await uploadRevisiDokumen(id.value, stagedRevision.value);
  stagedRevision.value = { docx: null, pdf: null };
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
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file?preview=1`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'naskah.docx';
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

  if (canSendEvaluation.value) {
    await router.replace(`/naskah-lainnya/${id.value}`);
    return;
  }

  if (canProcessContinuation.value || (canDecideEvaluation.value && !isFinalEvaluation.value)) {
    await loadContinuationCandidates();
  }
});
</script>
