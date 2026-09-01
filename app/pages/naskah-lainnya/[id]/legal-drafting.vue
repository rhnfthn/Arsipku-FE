<template>
  <div class="space-y-6">
    <PageHeader :items="breadcrumbs" :back-to="`/naskah-lainnya/${id}`">
      <template #title>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ detail?.perihal || 'Memuat…' }}
        </h1>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <div
      v-else
      class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700"
    >
      <!-- Banner status (selaras dgn tanda-tangan: cardBg + ikon bulat + judul/desc) -->
      <div class="px-5 py-4" :class="ldBanner.cardBg">
        <div class="flex items-start gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
            :class="ldBanner.wrap"
          >
            <UIcon :name="ldBanner.icon" class="size-5" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ ldBanner.title }}</p>
            <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{{ ldBanner.desc }}</p>
          </div>
          <span
            v-if="hasWaitingLegalRows && legalApprovalRows.length > 1"
            class="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800/70 dark:text-gray-200"
          >
            <UIcon name="i-lucide-check" class="size-3 text-green-600 dark:text-green-400" />
            {{ verifiedLegalCount }}/{{ legalApprovalRows.length }} disetujui
          </span>
        </div>
        <p
          v-if="ldBanner.catatan"
          class="mt-3 border-t border-black/5 pt-3 pl-10 text-sm italic text-gray-800 dark:border-white/10 dark:text-gray-100"
        >
          &ldquo;{{ ldBanner.catatan }}&rdquo;
        </p>
      </div>

      <NaskahDraftWorkspace
        :detail="detail"
        :dokumen-pendukung="dokumenPendukung"
        area-title="Legal Drafting"
        area-description="Revisi naskah di luar aplikasi: download draf, lengkapi di Microsoft Word, lalu upload kembali. Noted: Jangan menghapus parameter dikarenakan sistem membaca isi dan parameter di dalamnya."
        catatan-title="Catatan Legal"
        catatan-placeholder="Catatan hasil pemeriksaan legal…"
        :show-actions="false"
        :docx-url="detail.filePreviewUrl || `/naskah-lainnya/${id}/file`"
        :show-draf-download="false"
        :stage-upload="canActLegalDrafting"
        staged-success-description="Revisi siap dikirim bersama approval legal"
        divided
        v-model="catatanLegal"
        @preview="previewNaskah"
        @download="downloadNaskah"
        @preview-pendukung="previewPendukung"
        @stage-revisi="onStageRevisi"
      />

      <!-- Rantai Legal Drafting dan pejabat pengesah -->
      <div class="px-5 py-4">
        <div class="mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-badge-check"
            class="h-4 w-4 text-primary-600 dark:text-primary-400"
          />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Pejabat yang Mengesahkan
          </h3>
          <span class="text-xs text-red-500">*</span>
        </div>

        <div
          v-if="selectedCertifierFromChain"
          class="rounded-lg border border-primary-200 bg-primary-50/60 px-3 py-2.5 dark:border-primary-800 dark:bg-primary-900/20"
        >
          <p class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ selectedCertifierFromChain.nama }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedCertifierFromChain.jabatan }}
          </p>
        </div>
        <USelectMenu
          v-else
          v-model="selectedCertifierId"
          :items="certifierOptions"
          value-key="value"
          :filter-fields="['label', 'jabatan']"
          placeholder="Pilih pejabat manajerial Unit Legal…"
          class="w-full"
          :disabled="!canActLegalDrafting"
        >
          <template #item="{ item }">
            <div class="min-w-0 py-1">
              <p class="truncate text-sm text-gray-900 dark:text-white">{{ item.label }}</p>
              <p class="truncate text-xs text-gray-400">{{ item.jabatan }}</p>
            </div>
          </template>
        </USelectMenu>
        <p class="mt-2 text-xs text-gray-400">
          Pejabat ini menjadi titik akhir yang mengesahkan dan memfinalkan Legal Drafting.
        </p>

        <div v-if="legalApprovalRows.length" class="mt-5 space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Alur Legal Drafting
          </p>
          <div
            v-for="r in sortedLegalRows"
            :key="r.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5"
            :class="
              r.status === 'waiting'
                ? 'border-primary-300 bg-primary-50/60 ring-1 ring-primary-200 dark:border-primary-800 dark:bg-primary-900/20 dark:ring-primary-900/50'
                : 'border-gray-200 dark:border-gray-700'
            "
          >
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              :class="
                r.status === 'verified'
                  ? 'bg-green-500 text-white'
                  : r.status === 'waiting'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
              "
            >
              <UIcon v-if="r.status === 'verified'" name="i-lucide-check" class="size-3" />
              <template v-else>{{ r.urutan }}</template>
            </span>
            <div class="flex-1 min-w-40">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ r.nama }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ r.jabatan }}</p>
            </div>
            <span
              v-if="r.status === 'verified'"
              class="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              <UIcon name="i-lucide-check" class="size-3" />Selesai
            </span>
            <span
              v-else-if="r.status === 'waiting'"
              class="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
            >
              <UIcon name="i-lucide-pencil-line" class="size-3" />Sedang mengerjakan
            </span>
            <span
              v-else-if="r.status === 'pending'"
              class="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              <UIcon name="i-lucide-clock" class="size-3" />Menunggu alur kembali
            </span>
            <StatusBadge v-else :status="r.status" />
          </div>
        </div>

        <div v-if="canActLegalDrafting" class="mt-5">
          <div class="mb-2 flex items-center justify-between gap-3">
            <label class="block text-sm font-semibold text-gray-900 dark:text-white">
              Teruskan kepada
            </label>
            <UButton
              v-if="selectedForwardRecipient"
              color="neutral"
              variant="link"
              size="xs"
              icon="i-lucide-x"
              class="shrink-0 px-0"
              @click="selectedForwardId = ''"
            >
              Hapus pilihan
            </UButton>
          </div>
          <USelectMenu
            v-model="selectedForwardId"
            :items="forwardOptions"
            value-key="value"
            :filter-fields="['label', 'jabatan']"
            placeholder="Pilih penerima berikutnya di Unit Legal…"
            class="w-full"
          >
            <template #item="{ item }">
              <div class="min-w-0 py-1">
                <p class="truncate text-sm text-gray-900 dark:text-white">{{ item.label }}</p>
                <p class="truncate text-xs text-gray-400">{{ item.jabatan }}</p>
              </div>
            </template>
          </USelectMenu>
          <p
            class="mt-2 text-xs"
            :class="selectedForwardRecipient ? 'font-medium text-primary-600' : 'text-gray-400'"
          >
            {{
              selectedForwardRecipient
                ? `Aksi yang tersedia: teruskan kepada ${selectedForwardRecipient.nama}. Hapus pilihan untuk mengaktifkan aksi Kirim.`
                : 'Opsional. Kosongkan field ini untuk mengirim hasil kembali mengikuti rantai ke pejabat pengesah.'
            }}
          </p>
        </div>
      </div>

      <!-- Aksi (di dalam panel — selaras dgn action toolbar tanda-tangan) -->
      <div class="px-5 py-4 bg-primary-50/50 dark:bg-primary-900/10">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 shadow-sm dark:bg-primary-900/40 dark:text-primary-400"
            >
              <UIcon name="i-lucide-send" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Aksi Legal Drafting</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ legalActionDescription }}
              </p>
            </div>
          </div>
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-forward"
              size="lg"
              class="w-full justify-center font-semibold sm:w-auto"
              :disabled="!canContinueLegalDrafting"
              @click="showTeruskanModal = true"
              >Teruskan</UButton
            >
            <UButton
              color="primary"
              icon="i-lucide-send"
              size="lg"
              class="w-full justify-center font-semibold shadow-lg shadow-primary-500/20 sm:w-auto"
              :disabled="!canSendLegalDrafting"
              @click="showKirimModal = true"
              >Kirim</UButton
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Dokumen (PDF iframe / DOCX renderAsync) — fullscreen, pola USlideover side="bottom" -->
    <USlideover
      v-model:open="previewOpen"
      title="Preview Dokumen"
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

    <VerifyActionModal
      v-model="showTeruskanModal"
      variant="approve"
      title="Teruskan Legal Drafting"
      :description="`Naskah akan diteruskan kepada ${selectedForwardRecipient?.nama || 'penerima terpilih'}.`"
      :require-note="false"
      note-placeholder="Catatan untuk penerima berikutnya (opsional)…"
      confirm-label="Teruskan"
      :saving="sendingApproval"
      @confirm="(note) => continueLegalDrafting(note)"
    />

    <VerifyActionModal
      v-model="showKirimModal"
      variant="approve"
      title="Kirim Legal Drafting"
      :description="sendModalDescription"
      :require-note="false"
      note-placeholder="Catatan pengiriman (opsional)…"
      confirm-label="Kirim"
      :saving="sendingApproval"
      @confirm="(note) => kirimApproval(note)"
    />
  </div>
</template>

<script setup>
import { renderAsync } from 'docx-preview';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';

const route = useRoute();
const id = computed(() => route.params.id);
const { apiGet } = useApi();
const {
  fetchDetail,
  detail,
  uploadRevisiDokumen,
  kirimApprovalLegal,
  teruskanLegalDrafting,
  fetchLegalRecipients,
  legalRecipients,
} = useNaskahLainnya();
const { user } = useAuth();
const toast = useToast();
const { t } = useI18n();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: `/naskah-lainnya/${id.value}` },
  { label: 'Legal Drafting', to: '#' },
]);

const loading = ref(true);
const dokumenPendukung = ref([]);
const catatanLegal = ref('');
const sendingApproval = ref(false);
const showKirimModal = ref(false);
const showTeruskanModal = ref(false);
// ── Popup preview dokumen pendukung (PDF iframe / DOCX renderAsync) ──
const previewOpen = ref(false);
const previewUrl = ref(null);
const previewDocxBuffer = ref(null);
const previewDocxContainer = ref(null);
const previewLoading = ref(false);
// Revisi hasil legal drafting di-stage di FE (preview lokal). Baru di-commit ke
// naskah saat user klik "Kirim Approval Legal" — bukan saat unggah — agar naskah
// tidak menumpuk versi sebelum legal drafting benar-benar dikirim.
const stagedRevisi = ref({ docx: null, pdf: null });

const selectedCertifierId = ref('');
const selectedForwardId = ref('');

const legalApprovalRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'legal_drafting')
);
const hasWaitingLegalRows = computed(() =>
  legalApprovalRows.value.some((r) => r.status === 'waiting')
);

const sortedLegalRows = computed(() =>
  [...legalApprovalRows.value].sort((a, b) => a.urutan - b.urutan)
);

// Naskah ditolak pemberi persetujuan legal → kembali ke step legal drafting (tolak,
// bukan kembalikan). Tampilkan baris rejected + catatan agar drafter legal tahu
// apa yang direvisi sebelum kirim ulang approval (buatApprovalLegalDrafting hapus
// baris lama saat kirim ulang — idempotent).
const rejectedLegalRows = computed(() =>
  sortedLegalRows.value.filter((r) => r.status === 'rejected')
);
const hasRejectedLegalRows = computed(() => rejectedLegalRows.value.length > 0);

// Naskah dikembalikan dari evaluasi oleh pemrakarsa → kembali ke legal drafting.
// Sinyal: baris riwayat TERAKHIR adalah aksi 'kembalikan-evaluasi' (riwayat ASC,
// terakhir = terbaru). Tampilkan alasan agar drafter legal tahu apa yang direvisi.
// Baris approval legal lama sudah dihapus BE → drafter kirim ulang approval.
const evaluasiKembalikanRow = computed(() => {
  const r = detail.value?.riwayat ?? [];
  const last = r.length ? r[r.length - 1] : null;
  return last?.aksi === 'kembalikan-evaluasi' ? last : null;
});

const verifiedLegalCount = computed(
  () => legalApprovalRows.value.filter((r) => r.status === 'verified').length
);
const currentLegalApprover = computed(
  () => sortedLegalRows.value.find((r) => r.status === 'waiting') ?? null
);

const currentPositionId = computed(() =>
  String(user.value?.positionId ?? user.value?.position ?? '')
);
const isCurrentLegalRecipient = computed(() => {
  const active = currentLegalApprover.value;
  if (!active) return false;
  if (active.positionId) return String(active.positionId) === currentPositionId.value;
  return Boolean(
    active.nama &&
    user.value?.nama &&
    active.nama.trim().toLowerCase() === user.value.nama.trim().toLowerCase()
  );
});
const canActLegalDrafting = computed(() => {
  if (detail.value?.tahapan !== 'legal_drafting') return false;
  if (currentLegalApprover.value) return isCurrentLegalRecipient.value;
  return (detail.value?.availableActions ?? []).includes('kirim-approval-legal');
});

// Banner status (selaras dgn ttBanner tanda-tangan: cardBg + ikon bulat + judul/desc).
const ldBanner = computed(() => {
  if (hasWaitingLegalRows.value) {
    const current = currentLegalApprover.value;
    return {
      icon: 'i-lucide-user-check',
      cardBg: 'bg-primary-50 dark:bg-primary-950/30',
      wrap: 'bg-primary-500',
      title: 'Menunggu Persetujuan Legal',
      desc: current
        ? `Pemberi persetujuan ke-${current.urutan} — ${current.nama} (${current.jabatan}).`
        : 'Naskah sudah dikirim ke pemberi persetujuan legal.',
      catatan: null,
    };
  }
  if (hasRejectedLegalRows.value) {
    return {
      icon: 'i-lucide-circle-x',
      cardBg: 'bg-red-50 dark:bg-red-950/30',
      wrap: 'bg-red-500',
      title: 'Naskah Ditolak Pemberi Persetujuan Legal',
      desc: 'Perbaiki naskah sesuai alasan penolakan, lalu kirim ulang approval.',
      catatan: null,
    };
  }
  if (evaluasiKembalikanRow.value) {
    return {
      icon: 'i-lucide-undo-2',
      cardBg: 'bg-amber-50 dark:bg-amber-950/30',
      wrap: 'bg-amber-500',
      title: 'Dikembalikan dari Evaluasi',
      desc: 'Pemrakarsa mengembalikan naskah ke legal drafting untuk direvisi.',
      catatan: evaluasiKembalikanRow.value.catatan || null,
    };
  }
  return {
    icon: 'i-lucide-file-pen-line',
    cardBg: 'bg-primary-50 dark:bg-primary-950/30',
    wrap: 'bg-primary-500',
    title: 'Legal Drafting',
    desc: 'Revisi naskah, isi catatan legal, lalu kirim ke pemberi persetujuan legal.',
    catatan: null,
  };
});

const legalRecipientName = (recipient) =>
  recipient.isDelegasi && recipient.positionStatus
    ? `${recipient.positionStatus}. ${recipient.nama}`
    : recipient.nama;

const certifierOptions = computed(() =>
  legalRecipients.value
    .filter((v) => v.isActive && v.chief)
    .map((v) => ({
      value: v.positionId,
      label: legalRecipientName(v),
      jabatan: v.jabatan || v.unitName || '',
    }))
);
const selectedCertifierFromChain = computed(() =>
  hasWaitingLegalRows.value
    ? (sortedLegalRows.value.filter((row) => row.status !== 'rejected').at(-1) ?? null)
    : null
);
const selectedCertifierRecipient = computed(() =>
  legalRecipients.value.find((v) => String(v.positionId) === String(selectedCertifierId.value))
);
const usedPositionIds = computed(
  () =>
    new Set(
      (hasWaitingLegalRows.value ? sortedLegalRows.value : [])
        .map((row) => String(row.positionId ?? ''))
        .filter(Boolean)
    )
);
const forwardOptions = computed(() =>
  legalRecipients.value
    .filter(
      (v) =>
        v.isActive &&
        String(v.positionId) !== currentPositionId.value &&
        !usedPositionIds.value.has(String(v.positionId))
    )
    .map((v) => ({
      value: v.positionId,
      label: legalRecipientName(v),
      jabatan: v.jabatan || v.unitName || '',
    }))
);
const selectedForwardRecipient = computed(() =>
  legalRecipients.value.find((v) => String(v.positionId) === String(selectedForwardId.value))
);
const nextUpwardRecipient = computed(() => {
  const active = currentLegalApprover.value;
  if (!active) return selectedCertifierRecipient.value ?? null;
  return sortedLegalRows.value.find(
    (row) => row.urutan > active.urutan && row.status === 'pending'
  );
});
const currentIsCertifier = computed(() =>
  Boolean(
    (currentLegalApprover.value &&
      selectedCertifierFromChain.value &&
      currentLegalApprover.value.id === selectedCertifierFromChain.value.id) ||
    (!currentLegalApprover.value &&
      selectedCertifierRecipient.value &&
      String(selectedCertifierRecipient.value.positionId) === currentPositionId.value)
  )
);
const hasSelectedCertifier = computed(() =>
  Boolean(selectedCertifierFromChain.value || selectedCertifierRecipient.value)
);
const canContinueLegalDrafting = computed(
  () =>
    canActLegalDrafting.value &&
    hasSelectedCertifier.value &&
    Boolean(selectedForwardRecipient.value)
);
const canSendLegalDrafting = computed(
  () => canActLegalDrafting.value && hasSelectedCertifier.value && !selectedForwardRecipient.value
);
const legalActionDescription = computed(() => {
  if (!canActLegalDrafting.value) return 'Menunggu penerima aktif menyelesaikan Legal Drafting.';
  if (selectedForwardRecipient.value)
    return `Naskah akan diteruskan kepada ${selectedForwardRecipient.value.nama}. Aksi Kirim dinonaktifkan agar tujuan tidak ambigu.`;
  if (currentIsCertifier.value)
    return 'Kirim akan memfinalkan Legal Drafting dan melanjutkan ke tahap Evaluasi.';
  if (nextUpwardRecipient.value)
    return `Kirim akan mengembalikan hasil kepada ${nextUpwardRecipient.value.nama}.`;
  return 'Pilih pejabat pengesah, lalu kirim hasil atau teruskan pekerjaan ke penerima lain.';
});
const sendModalDescription = computed(() => {
  if (currentIsCertifier.value)
    return 'Anda adalah Pejabat yang Mengesahkan. Naskah akan difinalkan pada tahap Legal Drafting dan dilanjutkan ke Evaluasi.';
  if (nextUpwardRecipient.value)
    return `Hasil Legal Drafting akan dikirim kembali kepada ${nextUpwardRecipient.value.nama}.`;
  return `Hasil Legal Drafting akan dikirim kepada ${selectedCertifierRecipient.value?.nama || 'Pejabat yang Mengesahkan'}.`;
});

async function loadDetail() {
  loading.value = true;
  try {
    await fetchDetail(id.value);
    dokumenPendukung.value = (detail.value?.dokumen || []).filter((d) => d.tipe === 'pendukung');
    // item #4: load catatan legal tersimpan (diisi saat kirim-approval-legal sebelumnya, bila ada).
    catatanLegal.value = detail.value?.catatanLegal ?? '';
  } catch {
    toast.add({ title: 'Gagal memuat detail naskah', color: 'error' });
  } finally {
    loading.value = false;
  }
}

async function downloadNaskah(name) {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file`, { responseType: 'blob' });
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
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file?preview=1`, {
      responseType: 'blob',
    });
    window.open(window.URL.createObjectURL(blob), '_blank');
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

// Buka popup preview dari blob sesuai tipe file (PDF → iframe, DOCX → renderAsync).
async function openPreviewFromBlob(blob, nama) {
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
    // tipe lain (gambar/dll) — buka tab baru
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
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

watch(previewOpen, (open) => {
  if (!open) closePreview();
});

async function previewPendukung(doc) {
  previewLoading.value = true;
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/dokumen/${doc.id}/download`, {
      responseType: 'blob',
    });
    await openPreviewFromBlob(blob, doc.nama);
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
}

function onStageRevisi(file) {
  stagedRevisi.value = file;
}

function hasIncompleteRevisionPair() {
  const { docx, pdf } = stagedRevisi.value;
  if (!!docx === !!pdf) return false;
  toast.add({
    title: 'Lengkapi pasangan file revisi',
    description: 'DOCX dan PDF wajib diunggah bersamaan dengan isi yang sama.',
    color: 'warning',
  });
  return true;
}

async function commitStagedRevision() {
  if (hasIncompleteRevisionPair()) return;
  if (stagedRevisi.value.docx && stagedRevisi.value.pdf) {
    await uploadRevisiDokumen(id.value, stagedRevisi.value);
  }
  return true;
}

function approvalPayload(recipient) {
  if (!recipient) return null;
  return {
    positionId: recipient.positionId,
    nama: legalRecipientName(recipient),
    jabatan: recipient.jabatan || recipient.unitName || '',
  };
}

async function kirimApproval(note) {
  if (!canSendLegalDrafting.value) {
    toast.add({ title: 'Pilih Pejabat yang Mengesahkan', color: 'warning' });
    return;
  }
  sendingApproval.value = true;
  try {
    if (!(await commitStagedRevision())) return;
    const certifier = approvalPayload(selectedCertifierRecipient.value);
    await kirimApprovalLegal(id.value, certifier ? [certifier] : [], note, catatanLegal.value);
    toast.add({
      title: currentIsCertifier.value
        ? 'Legal Drafting selesai dan dilanjutkan ke Evaluasi'
        : 'Hasil Legal Drafting berhasil dikirim',
      color: 'success',
    });
    showKirimModal.value = false;
    stagedRevisi.value = { docx: null, pdf: null };
    await navigateTo('/naskah-lainnya/legal-drafting?status=aksi-saya');
  } catch (e) {
    const rawMsg = e?.response?.data?.message || e?.message;
    const errMsg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
    toast.add({
      title: 'Gagal mengirim approval legal',
      description: errMsg || '',
      color: 'error',
    });
  } finally {
    sendingApproval.value = false;
  }
}

async function continueLegalDrafting(note) {
  if (!canContinueLegalDrafting.value) {
    toast.add({ title: 'Pilih penerima Legal Drafting berikutnya', color: 'warning' });
    return;
  }
  sendingApproval.value = true;
  try {
    if (!(await commitStagedRevision())) return;
    const recipient = approvalPayload(selectedForwardRecipient.value);
    const certifier = approvalPayload(selectedCertifierRecipient.value);
    await teruskanLegalDrafting(
      id.value,
      recipient,
      selectedCertifierFromChain.value ? undefined : certifier,
      note,
      catatanLegal.value
    );
    toast.add({
      title: `Legal Drafting diteruskan kepada ${selectedForwardRecipient.value.nama}`,
      color: 'success',
    });
    showTeruskanModal.value = false;
    stagedRevisi.value = { docx: null, pdf: null };
    await navigateTo('/naskah-lainnya/legal-drafting?status=aksi-saya');
  } catch (e) {
    const rawMsg = e?.response?.data?.message || e?.message;
    toast.add({
      title: 'Gagal meneruskan Legal Drafting',
      description: Array.isArray(rawMsg) ? rawMsg[0] : rawMsg || '',
      color: 'error',
    });
  } finally {
    sendingApproval.value = false;
  }
}

onMounted(() => {
  loadDetail();
  fetchLegalRecipients().catch(() => {
    /* abaikan — dropdown approver kosong */
  });
});
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
