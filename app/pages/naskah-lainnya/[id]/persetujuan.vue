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
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <div
      v-else
      class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700"
    >
      <div class="px-5 py-4" :class="approvalBanner.cardBg">
        <div class="flex items-start gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
            :class="approvalBanner.wrap"
          >
            <UIcon :name="approvalBanner.icon" class="size-5" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ approvalBanner.title }}
            </p>
            <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              {{ approvalBanner.desc }}
            </p>
          </div>
          <span
            v-if="approvalRows.length > 1"
            class="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800/70 dark:text-gray-200"
          >
            <UIcon name="i-lucide-check" class="size-3 text-green-600 dark:text-green-400" />
            {{ verifiedApprovalCount }}/{{ approvalRows.length }} disetujui
          </span>
        </div>
      </div>

      <NaskahDraftWorkspace
        :detail="detail"
        :dokumen-pendukung="dokumenPendukung"
        :area-title="workspaceCopy.areaTitle"
        :area-description="workspaceCopy.areaDescription"
        :show-actions="false"
        :show-catatan="false"
        :docx-url="detail.filePreviewUrl || `/naskah-lainnya/${id}/file`"
        :show-draf-download="false"
        :stage-upload="canProcess"
        staged-success-description="Revisi siap diunggah bersama aksi persetujuan"
        divided
        @preview="previewNaskah"
        @download="downloadNaskah"
        @preview-pendukung="previewPendukung"
        @stage-revisi="onStageRevisi"
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
              @click="previewPendukung(doc)"
              >Preview</UButton
            >
          </div>
        </div>
      </div>

      <div class="px-5 py-4">
        <div class="mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-users" class="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Rantai Persetujuan</h3>
          <span class="text-xs text-gray-400">(berjenjang — sesuai urutan)</span>
        </div>

        <!-- Catatan dari approver tahap sebelumnya (tahap lain yang sudah memberi aksi) -->
        <div
          v-if="previousStageNotes.length"
          class="mb-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900/40"
        >
          <p class="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <UIcon name="i-lucide-message-square-quote" class="size-3.5" />
            Catatan dari Tahap Sebelumnya
          </p>
          <div
            v-for="note in previousStageNotes"
            :key="note.key"
            class="flex flex-col gap-0.5 rounded-md bg-white px-3 py-2 text-xs leading-relaxed shadow-sm dark:bg-gray-800"
          >
            <span class="font-semibold text-gray-800 dark:text-gray-100">
              {{ note.nama }}
              <span class="font-normal text-gray-400">({{ note.tahapLabel }})</span>
            </span>
            <span class="text-gray-600 dark:text-gray-300">{{ note.catatan }}</span>
          </div>
        </div>

        <div
          v-if="approvalRows.length === 0"
          class="flex items-center gap-2 py-2 text-sm text-gray-400"
        >
          <UIcon name="i-lucide-inbox" class="size-4" />
          <span>{{ workspaceCopy.emptyApprover }}</span>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="row in approvalRows"
            :key="row.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5"
            :class="
              row.id === activeApprovalRow?.id
                ? 'border-primary-300 bg-primary-50/60 ring-1 ring-primary-200 dark:border-primary-800 dark:bg-primary-900/20 dark:ring-primary-900/50'
                : 'border-gray-200 dark:border-gray-700'
            "
          >
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              :class="
                row.status === 'verified'
                  ? 'bg-green-500 text-white'
                  : row.status === 'rejected'
                    ? 'bg-red-500 text-white'
                    : row.id === activeApprovalRow?.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
              "
            >
              <UIcon v-if="row.status === 'verified'" name="i-lucide-check" class="size-3" />
              <UIcon v-else-if="row.status === 'rejected'" name="i-lucide-x" class="size-3" />
              <template v-else>{{ row.urutan }}</template>
            </span>
            <div class="min-w-40 flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ row.nama }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.jabatan }}</p>
            </div>
            <span
              class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="approvalStatusClass(row.status, row.id === activeApprovalRow?.id)"
            >
              {{ approvalStatusLabel(row.status, row.id === activeApprovalRow?.id) }}
            </span>
            <!-- Catatan approver (tampil bila sudah memberi aksi: disetujui/ditolak) -->
            <div
              v-if="row.catatan && row.status !== 'waiting' && row.status !== 'pending'"
              class="w-full rounded-md bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-600 dark:bg-gray-700/60 dark:text-gray-300 sm:w-auto sm:flex-[0_0_100%]"
            >
              <span class="font-semibold text-gray-700 dark:text-gray-200">Catatan:</span>
              {{ row.catatan }}
            </div>
          </div>
        </div>
      </div>

      <div class="px-5 py-4">
        <div
          v-if="!canProcess"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
        >
          {{ cannotProcessMessage }}
        </div>

        <div
          v-if="canProcess"
          class="mt-3 flex flex-col gap-3 rounded-xl border border-primary-200 bg-primary-50/70 p-4 shadow-sm ring-1 ring-primary-100 sm:flex-row sm:items-center sm:justify-between dark:border-primary-800 dark:bg-primary-950/25 dark:ring-primary-900/50"
        >
          <div>
            <h3 class="text-sm font-semibold text-primary-900 dark:text-primary-100">
              Aksi Persetujuan
            </h3>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Revisi bersifat opsional. Unggah DOCX dan sistem akan membuat PDF pratinjau secara
              otomatis.
            </p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <UButton
              color="error"
              variant="outline"
              icon="i-lucide-circle-x"
              :disabled="!canProcess || busy"
              @click="showRejectModal = true"
              >Tolak</UButton
            >
            <UButton
              size="lg"
              color="primary"
              icon="i-lucide-send"
              class="min-w-36 justify-center font-bold shadow-lg shadow-primary-500/25 ring-2 ring-primary-300 transition hover:scale-[1.01] dark:ring-primary-700"
              :loading="busy && activeAction === 'setuju'"
              :disabled="!canProcess"
              @click="showApproveModal = true"
              >Submit</UButton
            >
          </div>
        </div>
      </div>
    </div>

    <VerifyActionModal
      v-model="showApproveModal"
      variant="approve"
      :title="workspaceCopy.submitTitle"
      :description="workspaceCopy.submitDescription"
      :note-placeholder="workspaceCopy.submitPlaceholder"
      confirm-label="Submit"
      :saving="busy && activeAction === 'setuju'"
      @confirm="setujui"
    />

    <VerifyActionModal
      v-model="showRejectModal"
      variant="reject"
      title="Tolak Naskah"
      description="Berikan alasan penolakan. Bila ada revisi yang di-stage, revisi tersebut akan diunggah terlebih dahulu."
      note-placeholder="Alasan penolakan"
      confirm-label="Tolak"
      :saving="busy && activeAction === 'tolak'"
      :require-note="true"
      @confirm="tolakNaskah"
    />

    <!-- Preview Dokumen (DOCX renderAsync) — fullscreen, pola USlideover side="bottom" -->
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
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { renderAsync } from 'docx-preview';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';
import type { ApprovalRow, RevisionFilePair, TahapApproval } from '~/types/naskah-lainnya';

definePageMeta({ layout: 'default', middleware: ['auth'] });

const route = useRoute();
const id = computed(() => route.params.id as string);
const { apiGet } = useApi();
const { user, getProfile } = useAuth();
const { detail, fetchDetail, uploadRevisiDokumen, setuju, tolak } = useNaskahLainnya();
const toast = useToast();
const { t } = useI18n();

const loading = ref(true);
const busy = ref(false);
const activeAction = ref<'setuju' | 'tolak' | null>(null);
const dokumenPendukung = ref<any[]>([]);
const stagedRevisi = ref<RevisionFilePair>({ docx: null });
const showApproveModal = ref(false);
const showRejectModal = ref(false);

const previewOpen = ref(false);
const previewUrl = ref<string | null>(null);
const previewDocxBuffer = ref<ArrayBuffer | null>(null);
const previewDocxContainer = ref<HTMLElement | null>(null);
const previewLoading = ref(false);

type ApprovalWorkspaceStage = Extract<TahapApproval, 'persetujuan' | 'legal_drafting'>;

const requestedStage = computed(() => {
  const raw = route.query.tahap ?? route.query.stage;
  return Array.isArray(raw) ? raw[0] : raw;
});

const approvalStage = computed<ApprovalWorkspaceStage>(() => {
  const raw = String(requestedStage.value ?? '').toLowerCase();
  if (raw === 'legal' || raw === 'legal_drafting') return 'legal_drafting';
  if (raw === 'persetujuan') return 'persetujuan';

  const hasLegalApproval = (detail.value?.approval ?? []).some(
    (row) => row.tahap === 'legal_drafting'
  );
  if (detail.value?.tahapan === 'legal_drafting' && hasLegalApproval) return 'legal_drafting';

  return 'persetujuan';
});

const workspaceCopy = computed(() => {
  if (approvalStage.value === 'legal_drafting') {
    return {
      breadcrumbLabel: 'Approval Legal',
      breadcrumbTo: '/naskah-lainnya/legal-drafting',
      stageLabel: 'Approval Legal',
      areaTitle: 'Tinjauan Approval Legal',
      areaDescription:
        'Tinjau naskah legal drafting sebelum memberi approval. Bila ada perbaikan, unggah naskah hasil update secara opsional; bila tidak diunggah, sistem tetap memakai naskah sebelumnya.',
      emptyApprover: 'Belum ada approver pada tahap approval legal.',
      waitingTitle: 'Approval Legal Menunggu Anda',
      waitingQueueTitle: 'Menunggu Giliran Approval Legal',
      doneTitle: 'Tahap Approval Legal Selesai',
      doneDesc: 'Naskah sudah berpindah dari tahap legal drafting.',
      notInStageMessage: 'Naskah ini sudah tidak berada pada tahap Legal Drafting.',
      submitTitle: 'Submit Approval Legal',
      submitDescription:
        'Naskah akan disubmit sebagai approval legal pada giliran Anda. Bila ada revisi yang di-stage, revisi tersebut akan diunggah terlebih dahulu.',
      submitPlaceholder: 'Catatan approval legal (opsional)',
      // Approval legal diselesaikan melalui menu Persetujuan. Setelah setuju,
      // kembali ke daftar approval yang sudah disetujui oleh user tersebut.
      afterActionTo: '/naskah-lainnya/persetujuan?status=disetujui',
    };
  }

  return {
    breadcrumbLabel: 'Persetujuan',
    breadcrumbTo: '/naskah-lainnya/persetujuan',
    stageLabel: 'Persetujuan',
    areaTitle: 'Tinjauan Persetujuan',
    areaDescription:
      'Tinjau naskah sebelum memberi persetujuan. Bila ada perbaikan, unggah naskah hasil update secara opsional; bila tidak diunggah, sistem tetap memakai naskah sebelumnya.',
    emptyApprover: 'Belum ada approver pada tahap persetujuan.',
    waitingTitle: 'Persetujuan Menunggu Anda',
    waitingQueueTitle: 'Menunggu Giliran Persetujuan',
    doneTitle: 'Tahap Persetujuan Selesai',
    doneDesc: 'Naskah sudah berpindah dari tahap persetujuan.',
    notInStageMessage: 'Naskah ini sudah tidak berada pada tahap Persetujuan.',
    submitTitle: 'Submit Persetujuan',
    submitDescription:
      'Naskah akan disubmit sebagai persetujuan pada giliran Anda. Bila ada revisi yang di-stage, revisi tersebut akan diunggah terlebih dahulu.',
    submitPlaceholder: 'Catatan persetujuan (opsional)',
    afterActionTo: '/naskah-lainnya/persetujuan',
  };
});

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: workspaceCopy.value.breadcrumbLabel, to: workspaceCopy.value.breadcrumbTo },
  { label: detail.value?.perihal || 'Detail', to: '#' },
]);

const approvalRows = computed<ApprovalRow[]>(() =>
  (detail.value?.approval ?? [])
    .filter((row) => row.tahap === approvalStage.value)
    .sort((a, b) => a.urutan - b.urutan)
);

const activeApprovalRow = computed(
  () =>
    approvalRows.value
      .filter((row) => row.status === 'waiting')
      .sort((a, b) => a.urutan - b.urutan)[0] ?? null
);

const verifiedApprovalCount = computed(
  () => approvalRows.value.filter((row) => row.status === 'verified').length
);

// Label ramah per tahap approval — untuk penanda catatan tahap sebelumnya.
const TAHAP_LABELS: Record<string, string> = {
  persetujuan: 'Persetujuan',
  persetujuan_lanjutan: 'Persetujuan Lanjutan',
  legal_drafting: 'Legal Drafting',
  evaluasi: 'Evaluasi',
  evaluasi_final: 'Evaluasi Final',
  persetujuan_direksi: 'Persetujuan Direksi',
  blanko_verbal: 'Blanko Verbal',
  tanda_tangan_pemrakarsa: 'TTD Pemrakarsa',
  tanda_tangan_legal: 'TTD Legal',
  tanda_tangan_pejabat: 'TTD Pejabat',
  tanda_tangan: 'Tanda Tangan',
};

// Catatan approver dari tahap lain (bukan tahap aktif) yang sudah memberi
// aksi — supaya approver berikutnya melihat catatan tahap sebelumnya.
const previousStageNotes = computed(() =>
  (detail.value?.approval ?? [])
    .filter(
      (row) =>
        row.tahap !== approvalStage.value &&
        !!row.catatan?.trim() &&
        (row.status === 'verified' || row.status === 'rejected')
    )
    .map((row) => ({
      key: `${row.id}-${row.tahap}`,
      nama: row.nama,
      catatan: row.catatan!.trim(),
      tahapLabel: TAHAP_LABELS[row.tahap] ?? row.tahap,
    }))
);

function isCurrentUserApprover(row: ApprovalRow | null | undefined) {
  if (!row || !user.value) return false;
  const role = String(user.value.role ?? '').toUpperCase();
  const activeRole = String(user.value.activeRole?.name ?? '').toUpperCase();
  if (role === 'SUPERADMIN' || activeRole === 'SUPERADMIN') return true;
  const pos = String(user.value.positionId ?? user.value.position ?? '');
  const rowPositionId = String(row.positionId ?? '');
  // positionId adalah sumber kebenaran. Nama approval bisa menggunakan prefix
  // PH/PT/PS, sehingga tidak boleh dipakai sebagai fallback jika posisi tersedia.
  if (rowPositionId) return !!pos && rowPositionId === pos;
  const nama = String(user.value.nama ?? '')
    .trim()
    .toLowerCase();
  return !!(row.nama && row.nama.trim().toLowerCase() === nama);
}

const canProcess = computed(
  () =>
    detail.value?.tahapan === approvalStage.value &&
    // Backend sudah memvalidasi status waiting, urutan aktif, dan identitas
    // approver. Jangan membuat izin baru dari nama/position di browser.
    detail.value?.availableActions?.includes('setuju') &&
    isCurrentUserApprover(activeApprovalRow.value)
);

const cannotProcessMessage = computed(() => {
  if (detail.value?.tahapan !== approvalStage.value) {
    return workspaceCopy.value.notInStageMessage;
  }
  if (!activeApprovalRow.value) return 'Tidak ada approval yang sedang menunggu.';
  return `Saat ini bukan giliran ${workspaceCopy.value.stageLabel.toLowerCase()} Anda.`;
});

const approvalBanner = computed(() => {
  if (canProcess.value) {
    return {
      icon: 'i-lucide-file-check-2',
      cardBg: 'bg-primary-50 dark:bg-primary-950/30',
      wrap: 'bg-primary-500',
      title: workspaceCopy.value.waitingTitle,
      desc: `${activeApprovalRow.value?.nama ?? 'Approver'} dapat meninjau naskah, memberi catatan, dan mengunggah revisi opsional.`,
    };
  }
  if (detail.value?.tahapan !== approvalStage.value) {
    return {
      icon: 'i-lucide-circle-check',
      cardBg: 'bg-green-50 dark:bg-green-950/30',
      wrap: 'bg-green-500',
      title: workspaceCopy.value.doneTitle,
      desc: workspaceCopy.value.doneDesc,
    };
  }
  return {
    icon: 'i-lucide-clock',
    cardBg: 'bg-amber-50 dark:bg-amber-950/30',
    wrap: 'bg-amber-500',
    title: workspaceCopy.value.waitingQueueTitle,
    desc: activeApprovalRow.value
      ? `Giliran saat ini: ${activeApprovalRow.value.nama} (${activeApprovalRow.value.jabatan}).`
      : 'Belum ada approver aktif.',
  };
});

function approvalStatusLabel(status: string, active: boolean) {
  if (status === 'verified') return 'Disetujui';
  if (status === 'rejected') return 'Ditolak';
  if (active) return 'Giliran aktif';
  return 'Menunggu';
}

function approvalStatusClass(status: string, active: boolean) {
  if (status === 'verified')
    return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'rejected') return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (active) return 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
}

async function loadDetail() {
  loading.value = true;
  try {
    if (!user.value) await getProfile();
    await fetchDetail(id.value);
    dokumenPendukung.value = (detail.value?.dokumen || []).filter(
      (doc) => doc.tipe === 'pendukung'
    );
  } catch {
    toast.add({ title: 'Gagal memuat detail naskah', color: 'error' });
  } finally {
    loading.value = false;
  }
}

// Dokumen sheet (Blanko Verbal / Lembar Persetujuan Direksi) yang sudah
// tersimpan — PDF hasil render BE, dipreview via endpoint dokumen download.
// Tipe 'blanko_verbal' (docx dari blankoRepo) tidak termasuk: tidak punya
// baris di dokumenRepo sehingga tidak bisa diunduh via endpoint dokumen.
const sheetDokumen = computed(() =>
  (detail.value?.dokumen || []).filter((doc: any) =>
    ['blanko_verbal_pdf', 'lembar_persetujuan_direksi_pdf'].includes(doc.tipe)
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

async function downloadNaskah(name?: string) {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file?preview=1`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = name || naskahFileName(detail.value);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.add({ title: 'Gagal mengunduh naskah', color: 'error' });
  }
}

async function previewNaskah() {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file`, { responseType: 'blob' });
    // nama diturunkan dari mimetype agar openPreviewFromBlob memilih jalur yang benar
    // (pdf → viewer bawaan browser dgn toolbar download; docx → docx-preview).
    const nama = blob.type.includes('pdf')
      ? 'naskah.pdf'
      : blob.type.includes('word')
        ? 'naskah.docx'
        : 'naskah';
    await openPreviewFromBlob(blob, nama);
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  }
}

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

async function openPreviewFromBlob(blob: Blob, nama?: string) {
  const lower = String(nama ?? '').toLowerCase();
  const isPdf = lower.endsWith('.pdf') || blob.type === 'application/pdf';
  const isDocx = lower.endsWith('.docx');
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
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  }
}

watch(previewOpen, (open) => {
  if (!open && previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
});

async function previewPendukung(doc: any) {
  previewLoading.value = true;
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/dokumen/${doc.id}/download?inline=1`, {
      responseType: 'blob',
    });
    await openPreviewFromBlob(blob, doc.nama);
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
}

function onStageRevisi(pair: RevisionFilePair) {
  stagedRevisi.value = pair;
}

async function commitStagedRevisi() {
  const { docx } = stagedRevisi.value;
  if (!docx) return;
  await uploadRevisiDokumen(id.value, stagedRevisi.value);
  stagedRevisi.value = { docx: null };
}

async function runApprovalAction(action: 'setuju' | 'tolak', note?: string) {
  if (!canProcess.value) return;
  const row = activeApprovalRow.value;
  if (!row) return;
  busy.value = true;
  activeAction.value = action;
  try {
    await commitStagedRevisi();
    if (action === 'setuju') {
      await setuju(id.value, row.id, note || undefined);
      toast.add({ title: 'Naskah disetujui', color: 'success' });
      showApproveModal.value = false;
    } else if (action === 'tolak') {
      await tolak(id.value, row.id, note || '');
      toast.add({ title: 'Naskah ditolak', color: 'success' });
      showRejectModal.value = false;
    }
    await fetchDetail(id.value);
    // Tahap persetujuan: arahkan ke menu Persetujuan dengan filter sesuai aksi
    // (Disetujui/Ditolak) agar naskah yang baru diproses langsung muncul.
    const to =
      approvalStage.value === 'persetujuan'
        ? `/naskah-lainnya/persetujuan?status=${action === 'setuju' ? 'disetujui' : 'ditolak'}`
        : workspaceCopy.value.afterActionTo;
    navigateTo(to);
  } catch (e: any) {
    const raw = e?.response?.data?.message || e?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    toast.add({
      title: action === 'setuju' ? 'Gagal menyetujui naskah' : 'Gagal menolak naskah',
      description: message || '',
      color: 'error',
    });
  } finally {
    busy.value = false;
    activeAction.value = null;
  }
}

function setujui(note: string) {
  runApprovalAction('setuju', note);
}

function tolakNaskah(note: string) {
  runApprovalAction('tolak', note);
}

onMounted(loadDetail);
</script>

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
</style>
