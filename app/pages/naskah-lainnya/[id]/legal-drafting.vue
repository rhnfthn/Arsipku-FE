<template>
  <div class="space-y-6">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ detail?.perihal || 'Memuat…' }}</h1>
      </template>
      <template #subtitle>
        <div class="flex flex-wrap gap-2">
          <StatusBadge status="legal_drafting" />
          <UBadge v-if="detail?.jenis" color="neutral" size="sm">{{ jenisLabel(detail.jenis) }}</UBadge>
        </div>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <div v-else class="space-y-6">
      <!-- Naskah dikembalikan dari evaluasi oleh pemrakarsa → banner paling atas
           agar drafter legal langsung melihat alasan sebelum merevisi. -->
      <div
        v-if="evaluasiKembalikanRow"
        class="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4"
      >
        <div class="flex items-center gap-2 mb-1.5">
          <UIcon name="i-lucide-undo-2" class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p class="text-sm font-semibold text-amber-800 dark:text-amber-300">Dikembalikan dari Evaluasi</p>
        </div>
        <p class="text-sm text-amber-700/90 dark:text-amber-400/80 mb-1">
          Pemrakarsa mengembalikan naskah ke legal drafting untuk direvisi. Perbaiki naskah di area kerja, lalu kirim ulang approval. Alasan:
        </p>
        <p v-if="evaluasiKembalikanRow.catatan" class="text-sm text-gray-800 dark:text-gray-100 italic">&ldquo;{{ evaluasiKembalikanRow.catatan }}&rdquo;</p>
      </div>

      <NaskahDraftWorkspace
        :detail="detail"
        :dokumen-pendukung="dokumenPendukung"
        area-title="Legal Drafting"
        area-description="Revisi naskah di luar aplikasi: download draf, lengkapi di Microsoft Word, lalu upload kembali. Noted: Jangan menghapus parameter dikarenakan sistem membaca isi dan parameter di dalamnya."
        catatan-title="Catatan Legal"
        catatan-placeholder="Catatan hasil pemeriksaan legal…"
        :show-actions="false"
        :docx-url="`/naskah-lainnya/${id}/file`"
        :show-draf-download="false"
        :catatan-rich="true"
        :stage-upload="true"
        v-model="catatanLegal"
        @preview="previewNaskah"
        @download="downloadNaskah"
        @preview-pendukung="previewPendukung"
        @stage-revisi="onStageRevisi"
      />

      <!-- Pemberi Persetujuan Legal (recipients khusus unit legal) -->
      <div
        class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5"
      >
        <div class="flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-users" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Pemberi Persetujuan Legal</h3>
          <span class="text-xs text-gray-400">(berjenjang — dari unit legal)</span>
        </div>

        <!-- Naskah ditolak pemberi persetujuan legal → tampilkan alasan agar drafter
             legal tahu apa yang direvisi sebelum kirim ulang (tolak → kembali ke legal drafting). -->
        <div
          v-if="hasRejectedLegalRows && !hasWaitingLegalRows"
          class="mb-3 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-3"
        >
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-lucide-circle-x" class="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p class="text-sm font-semibold text-red-700 dark:text-red-300">Naskah Ditolak Pemberi Persetujuan Legal</p>
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
                <span class="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold shrink-0">{{ r.urutan }}</span>
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{{ r.nama }}</p>
                <StatusBadge status="rejected" />
              </div>
              <p v-if="r.catatan" class="mt-1 text-xs text-gray-600 dark:text-gray-300 italic pl-7">&ldquo;{{ r.catatan }}&rdquo;</p>
            </div>
          </div>
        </div>

        <!-- Status menunggu approver (berjenjang — read-only kecuali baris aktif milik user) -->
        <div v-if="hasWaitingLegalRows" class="space-y-2">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Naskah sudah dikirim ke pemberi persetujuan legal. Menunggu persetujuan berjenjang.
          </p>
          <div
            v-for="r in visibleLegalApprovalRows"
            :key="r.id"
            class="flex items-center gap-2 rounded-lg border px-3 py-2"
            :class="r.status === 'waiting'
              ? 'border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
              : r.status === 'verified'
                ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'"
          >
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0">
              {{ r.urutan }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ r.nama }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ r.jabatan }}</p>
            </div>
            <StatusBadge :status="r.status" />
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
                  class="flex items-center gap-2 rounded-lg border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 px-3 py-2"
                >
                  <span class="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0">
                    {{ idx + 1 }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ v.nama }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ v.jabatan }}</p>
                  </div>
                  <button type="button" class="text-gray-400 hover:text-red-500 shrink-0" @click.stop="removeApprover(v.positionId)" aria-label="Hapus approver">
                    <UIcon name="i-lucide-x" class="w-4 h-4" />
                  </button>
                </div>
                <span v-if="!legalApprovers.length" class="text-sm text-gray-400 dark:text-gray-500 py-1">
                  Pilih pemberi persetujuan legal…
                </span>
              </div>
            </template>

            <template #item="{ item }">
              <div
                class="flex items-center gap-2 w-full py-1 cursor-pointer"
                @click.stop.prevent="toggleApprover(item)"
              >
                <UCheckbox :model-value="isApproverSelected(item)" class="pointer-events-none shrink-0" :ui="{ base: 'w-4 h-4' }" />
                <div class="flex-1 min-w-0">
                  <span class="block text-sm text-left truncate text-gray-900 dark:text-white">{{ item.label }}</span>
                  <span class="block text-xs text-left truncate text-gray-400">{{ item.jabatan || '' }}</span>
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

          <p class="mt-2 text-xs text-gray-400">Pilih pemberi persetujuan dari unit legal. Urutan pilihan = urutan persetujuan.</p>
        </div>
      </div>

      <!-- Aksi (highlighted — selaraskan dengan action toolbar [id].vue) -->
      <div class="overflow-hidden rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white shadow-sm ring-1 ring-primary-100 dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800 dark:ring-primary-900/30">
        <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
              <UIcon name="i-lucide-send" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Kirim Approval Legal</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ hasWaitingLegalRows
                  ? 'Naskah sudah dikirim. Menunggu persetujuan berjenjang.'
                  : 'Kirim naskah ke pemberi persetujuan legal untuk persetujuan berjenjang.' }}
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
          >Kirim Approval Legal</UButton>
        </div>
      </div>
    </div>

    <!-- Preview Modal (PDF iframe / DOCX renderAsync) -->
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
            <div v-else ref="previewDocxContainer" class="docx-preview-container w-full h-full overflow-auto"></div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Kirim Approval Legal Modal (item #8: popup alasan sebelum kirim) -->
    <VerifyActionModal
      v-model="showKirimModal"
      variant="approve"
      title="Kirim Approval Legal"
      description="Naskah dikirim ke pemberi persetujuan legal untuk persetujuan berjenjang. Catatan legal akan disimpan."
      :require-note="true"
      note-placeholder="Tuliskan alasan kirim approval legal…"
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
const { fetchDetail, detail, uploadDokumen, kirimApprovalLegal, fetchLegalRecipients, legalRecipients } = useNaskahLainnya();
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
const stagedRevisi = ref(null);

// ── Pemberi Persetujuan Legal (recipients dari unit legal saja) ──
const legalApprovers = ref([]);

const legalApprovalRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'legal_drafting'),
);
const hasWaitingLegalRows = computed(() =>
  legalApprovalRows.value.some((r) => r.status === 'waiting'),
);

// ── Berjenjang: hanya baris sudah diproses (verified/rejected) + baris waiting
// urutan terendah (giliran aktif) yang ditampilkan. Baris waiting urutan lebih
// tinggi disembunyikan — baru muncul setelah giliran sebelumnya selesai (lihat
// applyApproval lowerWaiting check di BE: urutan 2 tidak bisa diproses sebelum
// urutan 1 verified).
const sortedLegalRows = computed(() =>
  [...legalApprovalRows.value].sort((a, b) => a.urutan - b.urutan),
);
const lowestWaitingUrutan = computed(() => {
  const ws = sortedLegalRows.value
    .filter((r) => r.status === 'waiting')
    .map((r) => r.urutan);
  return ws.length ? Math.min(...ws) : null;
});
const visibleLegalApprovalRows = computed(() =>
  sortedLegalRows.value.filter(
    (r) => r.status !== 'waiting' || r.urutan === lowestWaitingUrutan.value,
  ),
);
const pendingAfterCount = computed(
  () =>
    sortedLegalRows.value.filter(
      (r) =>
        r.status === 'waiting' &&
        lowestWaitingUrutan.value != null &&
        r.urutan > lowestWaitingUrutan.value,
    ).length,
);

// Naskah ditolak pemberi persetujuan legal → kembali ke step legal drafting (tolak,
// bukan kembalikan). Tampilkan baris rejected + catatan agar drafter legal tahu
// apa yang direvisi sebelum kirim ulang approval (buatApprovalLegalDrafting hapus
// baris lama saat kirim ulang — idempotent).
const rejectedLegalRows = computed(() =>
  sortedLegalRows.value.filter((r) => r.status === 'rejected'),
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

// Eligible: aktif, bukan user sendiri (urutan pemilihan = urutan persetujuan).
const eligibleRecipients = computed(() => {
  const myPosId = String(user.value?.position ?? user.value?.positionId ?? '');
  const myPersnum = user.value?.persnum;
  return legalRecipients.value.filter((v) =>
    v.isActive
    && v.positionId !== myPosId
    && !(myPersnum != null && v.persnum === myPersnum),
  );
});

// Opsi dropdown — item object shape sesuai pola USelectMenu (lihat InputPenerima).
const approverOptions = computed(() =>
  eligibleRecipients.value.map((v) => ({
    value: v.positionId,
    label: v.nama,
    jabatan: v.jabatan || v.unitName || '',
  })),
);

// Model satu arah ke USelectMenu: array of object (selected).
const selectedApproverItems = computed(() =>
  legalApprovers.value.map((v) => ({
    value: v.positionId,
    label: v.nama,
    jabatan: v.jabatan || v.unitName || '',
  })),
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

const JENIS_LABELS = {
  PER: 'Peraturan (PER)', KEP: 'Keputusan (KEP)', INS: 'Instruksi (INS)',
  PKS: 'Perjanjian Kerja Sama (PKS)', UND: 'Undangan (UND)', BA: 'Berita Acara (BA)',
};
const jenisLabel = (j) => JENIS_LABELS[j] || j;

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
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file`, { responseType: 'blob' });
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
    // tipe lain (gambar/dll) — buka tab baru
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
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
}

function onStageRevisi(file) {
  stagedRevisi.value = file;
}

async function kirimApproval(note) {
  if (hasWaitingLegalRows.value) return;
  if (legalApprovers.value.length === 0) {
    toast.add({ title: 'Pilih pemberi persetujuan legal', color: 'warning' });
    return;
  }
  sendingApproval.value = true;
  try {
    const approvers = legalApprovers.value.map((v) => ({
      positionId: v.positionId, nama: v.nama, jabatan: v.jabatan,
    }));
    // catatan = alasan kirim (→ riwayat, item #8); catatanLegal = catatan legal persist (item #4).
    // Kirim approval DULU. Bila gagal (validasi BE), revisi TIDAK di-commit ke
    // storage → tidak ada versi naskah yang masuk. User bebas unggah/hapus/unggah
    // ulang lalu kirim lagi sampai berhasil, tanpa versi numpuk dari kirim gagal.
    await kirimApprovalLegal(id.value, approvers, note, catatanLegal.value);
    // Setelah approval terkirim → commit revisi (1 versi per kirim sukses).
    if (stagedRevisi.value) {
      try {
        await uploadDokumen(id.value, stagedRevisi.value);
      } catch {
        toast.add({ title: 'Approval terkirim, tapi revisi gagal diunggah', color: 'warning' });
      }
    }
    toast.add({ title: 'Approval legal dikirim', color: 'success' });
    showKirimModal.value = false;
    stagedRevisi.value = null;
    await loadDetail(); // tetap di halaman → tampilkan status menunggu approver + catatan legal ter-load
  } catch (e) {
    const rawMsg = e?.response?.data?.message || e?.message;
    const errMsg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
    toast.add({ title: 'Gagal mengirim approval legal', description: errMsg || '', color: 'error' });
  } finally {
    sendingApproval.value = false;
  }
}

onMounted(() => {
  loadDetail();
  fetchLegalRecipients().catch(() => { /* abaikan — dropdown approver kosong */ });
});
</script>

<style scoped>
:deep(.docx-preview-container) { padding: 16px; }
:deep(.docx-wrapper) { background: #fff !important; padding: 0 !important; }
:deep(.docx-wrapper > section.docx) {
  border: none !important;
  margin: 0 auto !important;
}
</style>
