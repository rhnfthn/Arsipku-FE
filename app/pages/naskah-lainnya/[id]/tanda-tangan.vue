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
      <!-- Banner status (selaras dgn legal-drafting: cardBg + ikon bulat + judul/desc) -->
      <div class="px-5 py-4" :class="ttBanner.cardBg">
        <div class="flex items-start gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
            :class="ttBanner.wrap"
          >
            <UIcon :name="ttBanner.icon" class="size-5" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ ttBanner.title }}</p>
            <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{{ ttBanner.desc }}</p>
          </div>
          <span
            v-if="signerCount > 1"
            class="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800/70 dark:text-gray-200"
          >
            <UIcon name="i-lucide-check" class="size-3 text-green-600 dark:text-green-400" />
            {{ signedCount }}/{{ signerCount }} ditandatangani
          </span>
        </div>
        <p
          v-if="ttBanner.catatan"
          class="mt-3 border-t border-black/5 pt-3 pl-10 text-sm italic text-gray-800 dark:border-white/10 dark:text-gray-100"
        >
          &ldquo;{{ ttBanner.catatan }}&rdquo;
        </p>
      </div>

      <NaskahDraftWorkspace
        :detail="detail"
        :dokumen-pendukung="dokumenPendukung"
        area-title="Tinjauan Penandatangan"
        area-description="Revisi naskah di luar aplikasi: download draf, lengkapi di Microsoft Word, lalu upload kembali. Noted: Jangan menghapus parameter dikarenakan sistem membaca isi dan parameter di dalamnya."
        catatan-title="Catatan Penandatangan"
        catatan-placeholder="Tuliskan catatan hasil tinjauan…"
        :show-actions="false"
        :show-area-kerja="false"
        :docx-url="detail.filePreviewUrl || `/naskah-lainnya/${id}/file`"
        :show-draf-download="false"
        divided
        v-model="catatan"
        @preview="previewNaskah"
        @download="downloadNaskah"
        @preview-pendukung="previewPendukung"
      />

      <!-- Daftar Penandatangan (analog dgn "Pemberi Persetujuan Legal" di legal-drafting) -->
      <div class="px-5 py-4">
        <div class="mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-users" class="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Daftar Penandatangan</h3>
          <span class="text-xs text-gray-400">(berjenjang — sesuai urutan)</span>
        </div>
        <div
          v-if="signerChain.length === 0"
          class="flex items-center gap-2 py-2 text-sm text-gray-400 dark:text-gray-500"
        >
          <UIcon name="i-lucide-inbox" class="size-4" />
          <span>Belum ada penandatangan.</span>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="(p, i) in signerChain"
            :key="p.positionId || p.persnum || i"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5"
            :class="
              signerStatus(i) === 'current'
                ? 'border-primary-300 bg-primary-50/60 ring-1 ring-primary-200 dark:border-primary-800 dark:bg-primary-900/20 dark:ring-primary-900/50'
                : 'border-gray-200 dark:border-gray-700'
            "
          >
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              :class="
                signerStatus(i) === 'signed'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
              "
            >
              <UIcon v-if="signerStatus(i) === 'signed'" name="i-lucide-check" class="size-3" />
              <template v-else>{{ i + 1 }}</template>
            </span>
            <div class="flex-1 min-w-40">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ p.nama }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ p.jabatan }}</p>
            </div>
            <span
              v-if="signerStatus(i) === 'signed'"
              class="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              <UIcon name="i-lucide-check" class="size-3" />Ditandatangani
            </span>
            <span
              v-else-if="signerStatus(i) === 'current'"
              class="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
            >
              <UIcon name="i-lucide-pen-line" class="size-3" />Menandatangani
            </span>
            <span
              v-else-if="signerStatus(i) === 'waiting'"
              class="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            >
              <UIcon name="i-lucide-clock" class="size-3" />Menunggu
            </span>
            <UIcon v-else name="i-lucide-signature" class="size-4 shrink-0 text-gray-400" />
          </div>
        </div>
      </div>

      <!-- Aksi (di dalam panel — selaras dgn action toolbar legal-drafting) -->
      <div class="px-5 py-4 bg-primary-50/50 dark:bg-primary-900/10">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 shadow-sm dark:bg-primary-900/40 dark:text-primary-400"
            >
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
              >Tandatangani Naskah</UButton
            >

            <!-- Fisik (ttd_basah): unduh + unggah hasil ttd basah -->
            <template v-else-if="signOption === 'ttd_basah'">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-download"
                size="lg"
                class="w-full sm:w-auto"
                @click="downloadNaskah(naskahFileName(detail))"
              >
                Unduh Naskah
              </UButton>
              <label
                class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 sm:w-auto"
              >
                <UIcon name="i-lucide-upload" class="size-4" />
                Unggah Naskah Ditandatangani
                <input
                  type="file"
                  class="hidden"
                  accept=".docx,.pdf,image/*"
                  @change="onUnggahTtdFisik"
                />
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
const { detail, fetchDetail, tandaTangan, unggahTtdFisik } = useNaskahLainnya();
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
const tahapan = computed(() => detail.value?.tahapan ?? '');
const signOption = computed(() => detail.value?.signOption ?? 'qr_only');

const canKembalikan = computed(
  () => tahapan.value === 'tanda_tangan_legal' || tahapan.value === 'tanda_tangan_pemrakarsa'
);

const actionToolbarTitle = computed(() =>
  signOption.value === 'ttd_basah' ? 'Tanda Tangan Basah' : 'Tanda Tangan Digital'
);
const actionToolbarDesc = computed(() =>
  signOption.value === 'ttd_basah'
    ? 'Unduh naskah, tandatangani secara fisik, lalu unggah hasilnya.'
    : 'Klik Tandatangani untuk menyuntuh QR dan menyelesaikan naskah.'
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
const signerCount = computed(() => detail.value?.signerCount ?? signerChain.value.length);

// Status per penandatangan (sama dgn [id].vue: signingIndex 1-based; selesai → semua signed).
function signerStatus(i) {
  const d = detail.value;
  if (!d) return 'idle';
  if (d.tahapan === 'selesai') return 'signed';
  if (d.tahapan === 'tanda_tangan' && d.signingIndex != null) {
    if (i + 1 < d.signingIndex) return 'signed';
    if (i + 1 === d.signingIndex) return 'current';
    return 'waiting';
  }
  return 'idle';
}
const signedCount = computed(
  () => signerChain.value.filter((_, i) => signerStatus(i) === 'signed').length
);

// Banner status (selaras dgn ldBanner legal-drafting: cardBg + ikon bulat + judul/desc).
const ttBanner = computed(() => {
  if (tahapan.value === 'selesai') {
    return {
      icon: 'i-lucide-circle-check',
      cardBg: 'bg-green-50 dark:bg-green-950/30',
      wrap: 'bg-green-500',
      title: 'Naskah Selesai',
      desc: 'Seluruh penandatangan telah menandatangani naskah.',
      catatan: null,
    };
  }
  const isFisik = signOption.value === 'ttd_basah';
  return {
    icon: 'i-lucide-pen-tool',
    cardBg: 'bg-primary-50 dark:bg-primary-950/30',
    wrap: 'bg-primary-500',
    title: isFisik ? 'Menunggu Tanda Tangan Basah' : 'Menunggu Tanda Tangan Digital',
    desc: signerProgress.value
      ? `${signerProgress.value} — ${penandatanganNama.value} (${penandatanganJabatan.value}).`
      : `${penandatanganNama.value} (${penandatanganJabatan.value}).`,
    catatan: null,
  };
});

async function loadDetail() {
  loading.value = true;
  try {
    await fetchDetail(id.value);
    // Alur penandatangan modern diproses langsung dari halaman detail: hanya
    // periksa, tanda tangani, atau tolak ke legal tanpa workspace unggah/revisi.
    if (detail.value?.tahapan === 'tanda_tangan' || detail.value?.signOption === 'ttd_basah') {
      await navigateTo(`/naskah-lainnya/${id.value}`, { replace: true });
      return;
    }
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

async function afterSignNavigate() {
  // Setelah menandatangani, naskah menjadi riwayat aksi penandatangan ini.
  // Redirect ke filter Disetujui, baik masih ada penandatangan berikutnya maupun
  // naskah sudah selesai seluruhnya.
  await navigateTo('/naskah-lainnya/persetujuan?status=disetujui');
}

async function tandaTanganConfirm() {
  busy.value = true;
  try {
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
    await unggahTtdFisik(id.value, file);
    toast.add({ title: 'Naskah ditandatangani (fisik) diunggah', color: 'success' });
    await afterSignNavigate();
  } catch (e) {
    toast.add({
      title: e?.response?.data?.message ?? 'Gagal mengunggah naskah ditandatangani',
      color: 'error',
    });
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
