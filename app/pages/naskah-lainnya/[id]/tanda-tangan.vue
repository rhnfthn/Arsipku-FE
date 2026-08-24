<template>
  <div class="space-y-6">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ detail?.perihal || 'Memuat…' }}</h1>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <div v-else class="space-y-6">
      <!-- Info penandatangan aktif (tanda-tangan-specific; legal-drafting memakai kartu
           pemberi persetujuan di posisi ini — konteks siapa menandatangani saat ini). -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-3 p-4">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
            <UIcon name="i-lucide-pen-tool" class="h-5 w-5" />
          </span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ penandatanganNama }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ penandatanganJabatan }}</p>
          </div>
          <UBadge color="primary" size="sm" icon="i-lucide-pen-tool">{{ signerProgress || 'Tanda Tangan' }}</UBadge>
        </div>
      </div>

      <NaskahDraftWorkspace
        :detail="detail"
        :dokumen-pendukung="dokumenPendukung"
        area-title="Tinjauan Penandatangan"
        area-description="Revisi naskah di luar aplikasi: download draf, lengkapi di Microsoft Word, lalu upload kembali. Noted: Jangan menghapus parameter dikarenakan sistem membaca isi dan parameter di dalamnya."
        catatan-title="Catatan Penandatangan"
        catatan-placeholder="Tuliskan catatan hasil tinjauan…"
        :show-actions="false"
        :docx-url="`/naskah-lainnya/${id}/file`"
        :show-draf-download="false"
        :catatan-rich="true"
        :stage-upload="true"
        v-model="catatan"
        @preview="previewNaskah"
        @download="downloadNaskah"
        @preview-pendukung="previewPendukung"
        @stage-revisi="onStageRevisi"
      />

      <!-- Aksi (highlighted — selaraskan dengan action toolbar legal-drafting) -->
      <div class="overflow-hidden rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white shadow-sm ring-1 ring-primary-100 dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800 dark:ring-primary-900/30">
        <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
              <UIcon name="i-lucide-pen-tool" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ actionToolbarTitle }}</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ actionToolbarDesc }}</p>
            </div>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <!-- Digital (qr_only): inject QR + advance -->
            <UButton
              v-if="signOption === 'qr_only'"
              color="primary"
              icon="i-lucide-pen-tool"
              size="lg"
              class="w-full font-semibold shadow-lg shadow-primary-500/20 sm:w-auto"
              :loading="busy"
              @click="showSignModal = true"
            >Tandatangani Naskah</UButton>

            <!-- Fisik (ttd_basah): unduh + unggah hasil ttd basah -->
            <template v-else-if="signOption === 'ttd_basah'">
              <UButton color="neutral" variant="outline" icon="i-lucide-download" size="lg" class="w-full sm:w-auto" @click="downloadNaskah(naskahFileName(detail))">
                Unduh Naskah
              </UButton>
              <label class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 sm:w-auto">
                <UIcon name="i-lucide-upload" class="size-4" />
                Unggah Naskah Ditandatangani
                <input type="file" class="hidden" accept=".docx,.pdf,image/*" @change="onUnggahTtdFisik" />
              </label>
            </template>

            <UButton
              v-if="canKembalikan"
              color="error"
              variant="outline"
              icon="i-lucide-undo-2"
              size="lg"
              class="w-full sm:w-auto"
              @click="showKembalikanModal = true"
            >
              Kembalikan
            </UButton>
          </div>
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

    <!-- Tandatangani Modal (catatan/konfirmasi sebelum sign — selaraskan dgn legal-drafting) -->
    <VerifyActionModal
      v-model="showSignModal"
      variant="approve"
      title="Tandatangani Naskah"
      description="Naskah akan ditandatangani secara digital (QR). Revisi yang di-stage akan diunggah bersamaan dengan tandatangan."
      :require-note="false"
      confirm-label="Tandatangani"
      :saving="busy"
      @confirm="tandaTanganConfirm"
    />

    <!-- Kembalikan Modal -->
    <VerifyActionModal
      v-model="showKembalikanModal"
      variant="reject"
      title="Kembalikan Naskah"
      description="Naskah akan dikembalikan ke step sebelumnya."
      :require-note="true"
      note-placeholder="Tuliskan alasan pengembalian…"
      confirm-label="Kembalikan"
      :saving="sendingKembalikan"
      @confirm="kembalikan"
    />
  </div>
</template>

<script setup>
import { renderAsync } from 'docx-preview';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';

const route = useRoute();
const id = computed(() => route.params.id);
const { apiGet } = useApi();
const { detail, fetchDetail, uploadDokumen, tandaTangan, unggahTtdFisik } = useNaskahLainnya();
const toast = useToast();
const { t } = useI18n();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: `/naskah-lainnya/${id.value}` },
  { label: 'Tanda Tangan', to: '#' },
]);

const loading = ref(true);
const busy = ref(false);
const catatan = ref('');
const dokumenPendukung = ref([]);
const showSignModal = ref(false);
const showKembalikanModal = ref(false);
const sendingKembalikan = ref(false);
// ── Popup preview dokumen pendukung (PDF iframe / DOCX renderAsync) ──
const previewOpen = ref(false);
const previewUrl = ref(null);
const previewDocxBuffer = ref(null);
const previewDocxContainer = ref(null);
const previewLoading = ref(false);
// Revisi di-stage di FE (preview lokal). Baru di-commit ke naskah saat user klik
// "Tandatangani Naskah" (qr_only) atau "Unggah Naskah Ditandatangani" (ttd_basah) —
// bukan saat unggah — agar naskah tidak menumpuk versi sebelum sign benar-benar jalan.
const stagedRevisi = ref(null);

const tahapan = computed(() => detail.value?.tahapan ?? '');
const signOption = computed(() => detail.value?.signOption ?? 'qr_only');

const canKembalikan = computed(() =>
  tahapan.value === 'tanda_tangan_legal'
  || tahapan.value === 'tanda_tangan_pemrakarsa');

const actionToolbarTitle = computed(() =>
  signOption.value === 'ttd_basah' ? 'Tanda Tangan Basah' : 'Tanda Tangan Digital',
);
const actionToolbarDesc = computed(() =>
  stagedRevisi.value
    ? 'Revisi di-stage akan diunggah bersama tandatangan.'
    : (signOption.value === 'ttd_basah'
      ? 'Unduh naskah, tandatangani secara fisik, lalu unggah hasilnya.'
      : 'Klik Tandatangani untuk menyuntuh QR dan menyelesaikan naskah.'),
);

// BE getDetail mengirim rantai penandatangan sebagai `penandatangan` (array),
// bukan `penandatanganList`. `penandatanganList` dipakai sebagai sumber sekunder
// bila BE kelak mengirimnya; `penandatangan` adalah yang otoritatif (sama dengan [id].vue).
const signerChain = computed(() => {
  const d = detail.value;
  if (!d) return [];
  const pl = d.penandatanganList;
  if (Array.isArray(pl) && pl.length) return pl;
  const pen = d.penandatangan;
  if (Array.isArray(pen) && pen.length) return pen;
  if (pen && !Array.isArray(pen) && pen.nama) return [pen];
  return [];
});
const currentSigner = computed(() => {
  const idx = detail.value?.signingIndex ?? 1;
  return signerChain.value[idx - 1] ?? null;
});
const penandatanganNama = computed(() => currentSigner.value?.nama ?? '—');
const penandatanganJabatan = computed(() => currentSigner.value?.jabatan ?? '');
const signerProgress = computed(() => {
  const idx = detail.value?.signingIndex ?? 1;
  const total = detail.value?.signerCount ?? 0;
  return total > 0 ? `Penandatangan ke-${idx} dari ${total}` : '';
});

async function loadDetail() {
  loading.value = true;
  try {
    await fetchDetail(id.value);
    dokumenPendukung.value = (detail.value?.dokumen || []).filter((d) => d.tipe === 'pendukung');
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

// Commit revisi yang di-stage ke naskah (1 versi per sign sukses). Dipanggil
// BERSAMA tindakan sign — bukan saat unggah — agar sign gagal tidak meninggalkan
// versi naskah yang numpuk (sama dengan pola legal-drafting).
async function commitStagedRevisi() {
  if (!stagedRevisi.value) return;
  try {
    await uploadDokumen(id.value, stagedRevisi.value);
  } catch {
    toast.add({ title: 'Revisi gagal diunggah, melanjutkan sign', color: 'warning' });
  }
  stagedRevisi.value = null;
}

async function afterSignNavigate() {
  await fetchDetail(id.value);
  const tahap = detail.value?.tahapan;
  if (tahap === 'selesai') {
    navigateTo(`/naskah-lainnya/${id.value}/selesai`);
  } else {
    navigateTo(`/naskah-lainnya/${id.value}/tanda-tangan`);
  }
}

async function tandaTanganConfirm() {
  busy.value = true;
  try {
    await commitStagedRevisi();
    await tandaTangan(id.value);
    toast.add({ title: 'Naskah ditandatangani', color: 'success' });
    showSignModal.value = false;
    await afterSignNavigate();
  } catch (e) {
    const rawMsg = e?.response?.data?.message || e?.message;
    const errMsg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
    toast.add({ title: 'Gagal menandatangani naskah', description: errMsg || '', color: 'error' });
  } finally {
    busy.value = false;
  }
}

async function onUnggahTtdFisik(ev) {
  const input = ev.target;
  const file = input.files?.[0];
  if (!file) return;
  busy.value = true;
  try {
    await commitStagedRevisi();
    await unggahTtdFisik(id.value, file);
    toast.add({ title: 'Naskah ditandatangani (fisik) diunggah', color: 'success' });
    await afterSignNavigate();
  } catch (e) {
    toast.add({ title: e?.response?.data?.message ?? 'Gagal mengunggah naskah ditandatangani', color: 'error' });
  } finally {
    busy.value = false;
    input.value = '';
  }
}

async function kembalikan(catatanText) {
  sendingKembalikan.value = true;
  try {
    // TODO: BE endpoint untuk kembalikan dari tanda tangan
    toast.add({ title: 'Naskah dikembalikan', color: 'warning' });
    showKembalikanModal.value = false;
    navigateTo(`/naskah-lainnya/${id.value}`);
  } catch {
    toast.add({ title: 'Gagal mengembalikan naskah', color: 'error' });
  } finally {
    sendingKembalikan.value = false;
  }
}

onMounted(loadDetail);
</script>

<style scoped>
:deep(.docx-preview-container) { padding: 16px; }
:deep(.docx-wrapper) { background: #fff !important; padding: 0 !important; }
:deep(.docx-wrapper > section.docx) {
  border: none !important;
  margin: 0 auto !important;
}
</style>