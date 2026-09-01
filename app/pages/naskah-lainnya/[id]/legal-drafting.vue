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
        :stage-upload="true"
        staged-success-description="Revisi siap dikirim bersama approval legal"
        divided
        v-model="catatanLegal"
        @preview="previewNaskah"
        @download="downloadNaskah"
        @preview-pendukung="previewPendukung"
        @stage-revisi="onStageRevisi"
      />

      <!-- Pemberi Persetujuan Legal (recipients khusus unit legal) -->
      <div class="px-5 py-4">
        <div class="mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-users" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Pemberi Persetujuan Legal
          </h3>
          <span class="text-xs text-gray-400">(berjenjang — dari unit legal)</span>
        </div>

        <!-- Naskah ditolak pemberi persetujuan legal → tampilkan alasan agar drafter
             legal tahu apa yang direvisi sebelum kirim ulang (tolak → kembali ke legal drafting). -->
        <div
          v-if="hasRejectedLegalRows && !hasWaitingLegalRows"
          class="mb-3 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-3"
        >
          <div class="flex items-center gap-2 mb-2">
            <UIcon
              name="i-lucide-circle-x"
              class="w-4 h-4 text-red-600 dark:text-red-400 shrink-0"
            />
            <p class="text-sm font-semibold text-red-700 dark:text-red-300">
              Naskah Ditolak Pemberi Persetujuan Legal
            </p>
          </div>
          <p class="text-xs text-red-600/80 dark:text-red-400/80 mb-2">
            Perbaiki naskah di area kerja, lalu kirim ulang approval. Alasan penolakan:
          </p>
          <div class="space-y-1.5">
            <div
              v-for="r in rejectedLegalRows"
              :key="r.id"
              class="rounded-md bg-white/60 dark:bg-gray-800/60 px-2.5 py-1.5"
            >
              <div class="flex items-center gap-2">
                <span
                  class="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold shrink-0"
                  >{{ r.urutan }}</span
                >
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                  {{ r.nama }}
                </p>
                <StatusBadge status="rejected" />
              </div>
              <p v-if="r.catatan" class="mt-1 text-xs text-gray-600 dark:text-gray-300 italic pl-7">
                &ldquo;{{ r.catatan }}&rdquo;
              </p>
            </div>
          </div>
        </div>

        <!-- Status menunggu approver (berjenjang — read-only kecuali baris aktif milik user) -->
        <div v-if="hasWaitingLegalRows" class="space-y-2">
          <div
            v-for="r in visibleLegalApprovalRows"
            :key="r.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5"
            :class="
              r.status === 'waiting'
                ? 'border-primary-300 bg-primary-50/60 ring-1 ring-primary-200 dark:border-primary-800 dark:bg-primary-900/20 dark:ring-primary-900/50'
                : r.status === 'verified'
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
            "
          >
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              :class="
                r.status === 'verified'
                  ? 'bg-green-500 text-white'
                  : r.status === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
              "
            >
              <UIcon v-if="r.status === 'verified'" name="i-lucide-check" class="size-3" />
              <UIcon v-else-if="r.status === 'rejected'" name="i-lucide-x" class="size-3" />
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
              <UIcon name="i-lucide-check" class="size-3" />Disetujui
            </span>
            <span
              v-else-if="r.status === 'waiting'"
              class="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
            >
              <UIcon name="i-lucide-clock" class="size-3" />Menunggu
            </span>
            <StatusBadge v-else :status="r.status" />
          </div>
          <p v-if="pendingAfterCount > 0" class="text-xs text-gray-400 pl-1">
            Dan {{ pendingAfterCount }} pemberi persetujuan lain menunggu giliran.
          </p>
        </div>

        <!-- Form pilih approver (editable saat tidak ada baris waiting) -->
        <div v-else>
          <USelectMenu
            v-if="eligibleRecipients.length"
            :items="approverOptions"
            :model-value="selectedApproverItems"
            multiple
            :filter-fields="['label', 'jabatan']"
            placeholder="Pilih pemberi persetujuan legal…"
            class="w-full"
          >
            <template #default>
              <div class="flex flex-col gap-1.5 w-full">
                <div
                  v-for="(v, idx) in legalApprovers"
                  :key="v.positionId"
                  class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-primary-300 bg-primary-50/60 px-3 py-2.5 ring-1 ring-primary-200 dark:border-primary-800 dark:bg-primary-900/20 dark:ring-primary-900/50"
                >
                  <span
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                  >
                    {{ idx + 1 }}
                  </span>
                  <div class="flex-1 min-w-40">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ legalRecipientName(v) }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ v.jabatan }}</p>
                  </div>
                  <button
                    type="button"
                    class="text-gray-400 hover:text-red-500 shrink-0"
                    @click.stop="removeApprover(v.positionId)"
                    aria-label="Hapus approver"
                  >
                    <UIcon name="i-lucide-x" class="w-4 h-4" />
                  </button>
                </div>
                <span
                  v-if="!legalApprovers.length"
                  class="text-sm text-gray-400 dark:text-gray-500 py-1"
                >
                  Pilih pemberi persetujuan legal…
                </span>
              </div>
            </template>

            <template #item="{ item }">
              <div
                class="flex items-center gap-2 w-full py-1 cursor-pointer"
                @click.stop.prevent="toggleApprover(item)"
              >
                <UCheckbox
                  :model-value="isApproverSelected(item)"
                  class="pointer-events-none shrink-0"
                  :ui="{ base: 'w-4 h-4' }"
                />
                <div class="flex-1 min-w-0">
                  <span class="block text-sm text-left truncate text-gray-900 dark:text-white">{{
                    item.label
                  }}</span>
                  <span class="block text-xs text-left truncate text-gray-400">{{
                    item.jabatan || ''
                  }}</span>
                </div>
              </div>
            </template>
          </USelectMenu>

          <UAlert
            v-else
            icon="i-lucide-info"
            color="neutral"
            variant="soft"
            title="Tidak ada kandidat"
            description="Tidak ada anggota unit legal aktif lain yang dapat dipilih."
          />

          <p class="mt-2 text-xs text-gray-400">
            Pilih pemberi persetujuan dari unit legal. Urutan pilihan = urutan persetujuan.
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
              <h3 class="font-semibold text-gray-900 dark:text-white">Kirim Approval Legal</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{
                  hasWaitingLegalRows
                    ? 'Naskah sudah dikirim. Menunggu persetujuan berjenjang.'
                    : 'Kirim naskah ke pemberi persetujuan legal untuk persetujuan berjenjang.'
                }}
              </p>
            </div>
          </div>
          <UButton
            color="primary"
            icon="i-lucide-send"
            size="lg"
            class="w-full font-semibold shadow-lg shadow-primary-500/20 sm:w-auto"
            :loading="sendingApproval"
            :disabled="hasWaitingLegalRows || legalApprovers.length === 0"
            @click="showKirimModal = true"
            >Kirim Approval Legal</UButton
          >
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

    <!-- Kirim Approval Legal Modal (item #8: popup alasan sebelum kirim) -->
    <VerifyActionModal
      v-model="showKirimModal"
      variant="approve"
      title="Kirim Approval Legal"
      description="Naskah dikirim ke pemberi persetujuan legal untuk persetujuan berjenjang. Catatan legal akan disimpan."
      :require-note="false"
      note-placeholder="Tuliskan alasan kirim approval legal (opsional)…"
      confirm-label="Kirim Approval"
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

// ── Pemberi Persetujuan Legal (recipients dari unit legal saja) ──
const legalApprovers = ref([]);

const legalApprovalRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'legal_drafting')
);
const hasWaitingLegalRows = computed(() =>
  legalApprovalRows.value.some((r) => r.status === 'waiting')
);

// ── Berjenjang: hanya baris sudah diproses (verified/rejected) + baris waiting
// urutan terendah (giliran aktif) yang ditampilkan. Baris waiting urutan lebih
// tinggi disembunyikan — baru muncul setelah giliran sebelumnya selesai (lihat
// applyApproval lowerWaiting check di BE: urutan 2 tidak bisa diproses sebelum
// urutan 1 verified).
const sortedLegalRows = computed(() =>
  [...legalApprovalRows.value].sort((a, b) => a.urutan - b.urutan)
);
const lowestWaitingUrutan = computed(() => {
  const ws = sortedLegalRows.value.filter((r) => r.status === 'waiting').map((r) => r.urutan);
  return ws.length ? Math.min(...ws) : null;
});
const visibleLegalApprovalRows = computed(() =>
  sortedLegalRows.value.filter(
    (r) => r.status !== 'waiting' || r.urutan === lowestWaitingUrutan.value
  )
);
const pendingAfterCount = computed(
  () =>
    sortedLegalRows.value.filter(
      (r) =>
        r.status === 'waiting' &&
        lowestWaitingUrutan.value != null &&
        r.urutan > lowestWaitingUrutan.value
    ).length
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
  () => visibleLegalApprovalRows.value.find((r) => r.status === 'waiting') ?? null
);

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

// Eligible: aktif, bukan user sendiri (urutan pemilihan = urutan persetujuan).
const legalRecipientName = (recipient) =>
  recipient.isDelegasi && recipient.positionStatus
    ? `${recipient.positionStatus}. ${recipient.nama}`
    : recipient.nama;

const eligibleRecipients = computed(() => {
  const myPosId = String(user.value?.position ?? user.value?.positionId ?? '');
  const myPersnum = user.value?.persnum;
  return legalRecipients.value.filter(
    (v) => v.isActive && v.positionId !== myPosId && !(myPersnum != null && v.persnum === myPersnum)
  );
});

// Opsi dropdown — item object shape sesuai pola USelectMenu (lihat InputPenerima).
const approverOptions = computed(() =>
  eligibleRecipients.value.map((v) => ({
    value: v.positionId,
    label: legalRecipientName(v),
    jabatan: v.jabatan || v.unitName || '',
  }))
);

// Model satu arah ke USelectMenu: array of object (selected).
const selectedApproverItems = computed(() =>
  legalApprovers.value.map((v) => ({
    value: v.positionId,
    label: legalRecipientName(v),
    jabatan: v.jabatan || v.unitName || '',
  }))
);

function isApproverSelected(item) {
  return legalApprovers.value.some((a) => a.positionId === item.value);
}
function toggleApprover(item) {
  const posId = item.value;
  if (legalApprovers.value.some((a) => a.positionId === posId)) {
    legalApprovers.value = legalApprovers.value.filter((a) => a.positionId !== posId);
  } else {
    const v = legalRecipients.value.find((x) => x.positionId === posId);
    if (v) legalApprovers.value.push(v);
  }
}
function removeApprover(positionId) {
  legalApprovers.value = legalApprovers.value.filter((v) => v.positionId !== positionId);
}

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

async function kirimApproval(note) {
  if (hasWaitingLegalRows.value) return;
  if (hasIncompleteRevisionPair()) return;
  if (legalApprovers.value.length === 0) {
    toast.add({ title: 'Pilih pemberi persetujuan legal', color: 'warning' });
    return;
  }
  sendingApproval.value = true;
  try {
    const approvers = legalApprovers.value.map((v) => ({
      positionId: v.positionId,
      // Simpan label aktor PT/PH/PS pada approval agar seluruh halaman detail
      // naskah menampilkan konteks aktor, bukan hanya dropdown pemilihan.
      nama: legalRecipientName(v),
      jabatan: v.jabatan,
    }));
    // Simpan pasangan revisi sebelum pekerjaan berpindah ke approver agar preview
    // PDF selalu menunjuk versi yang sama dengan DOCX terbaru.
    if (stagedRevisi.value.docx && stagedRevisi.value.pdf) {
      await uploadRevisiDokumen(id.value, stagedRevisi.value);
    }
    await kirimApprovalLegal(id.value, approvers, note, catatanLegal.value);
    toast.add({ title: 'Approval legal dikirim', color: 'success' });
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
