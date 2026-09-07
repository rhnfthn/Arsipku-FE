<template>
  <div :class="rootClass">
    <!-- 1. Dokumen Awal -->
    <div :class="cardClass">
      <div :class="headClass">
        <h3 class="font-semibold text-gray-900 dark:text-white">Dokumen Awal</h3>
      </div>
      <div :class="divided ? 'px-5 pb-5 space-y-3' : 'p-5 space-y-3'">
        <div
          v-if="detail?.fileUrl"
          class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
        >
          <span class="text-2xl">📄</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ naskahFilename }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">DOCX · Naskah sebelumnya</p>
          </div>
          <!-- tanda-tangan (tanpa docxUrl): tetap tombol preview new-tab (legacy). -->
          <UButton
            v-if="!docxUrl"
            size="xs"
            variant="ghost"
            icon="i-lucide-eye"
            @click="$emit('preview')"
            >Preview</UButton
          >
          <UButton
            size="xs"
            variant="outline"
            icon="i-lucide-download"
            @click="$emit('download', naskahFilename)"
            >Unduh</UButton
          >
        </div>

        <!-- Pratinjau docx inline collapsible (docxUrl disediakan — legal-drafting). -->
        <div v-if="docxUrl">
          <button
            type="button"
            class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
            @click="toggleAwalPreview"
          >
            <UIcon
              :name="awalPreviewOpen ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="w-4 h-4"
            />
            {{ awalPreviewOpen ? 'Sembunyikan Pratinjau' : 'Tampilkan Pratinjau' }}
          </button>
          <div
            v-show="awalPreviewOpen"
            class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 overflow-auto max-h-[500px] relative mt-2"
          >
            <div
              v-if="awalPreviewLoading"
              class="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 z-10"
            >
              <div class="flex flex-col items-center gap-2">
                <UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6 text-primary-500" />
                <span class="text-sm text-gray-500">Memuat pratinjau...</span>
              </div>
            </div>
            <iframe
              v-if="isPdfPreviewUrl && awalPdfPreviewUrl"
              :src="awalPdfPreviewUrl"
              class="h-[500px] w-full border-0 bg-white"
            />
            <div v-else ref="awalPreviewContainer" class="docx-preview-container"></div>
          </div>
        </div>

        <!-- Sub-heading Dokumen Pendukung — jelas terpisah dari naskah utama -->
        <div
          v-if="dokumenPendukung.length"
          class="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700"
        >
          <UIcon name="i-lucide-paperclip" class="h-4 w-4 text-gray-400" />
          <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Dokumen Pendukung
          </h4>
          <span class="text-xs text-gray-400">({{ dokumenPendukung.length }} file)</span>
        </div>
        <div
          v-for="doc in dokumenPendukung"
          :key="doc.id"
          class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
        >
          <span class="text-2xl">📎</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ doc.nama }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">PDF · Dokumen pendukung</p>
          </div>
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-eye"
            @click="$emit('preview-pendukung', doc)"
            >Preview</UButton
          >
        </div>
      </div>
    </div>

    <!-- 2. Area Kerja — Upload Revisi (gate showAreaKerja; blanko-verbal sembunyikan) -->
    <div v-if="showAreaKerja" :class="cardClass">
      <div :class="headClass">
        <h3 class="font-semibold text-gray-900 dark:text-white">Area Kerja — {{ areaTitle }}</h3>
      </div>
      <div :class="divided ? 'px-5 pb-5 space-y-4' : 'p-5 space-y-4'">
        <UAlert
          icon="i-lucide-info"
          color="primary"
          variant="soft"
          :description="areaDescription"
        />

        <!-- Download draf (item #2: gate via showDrafDownload — legal-drafting sembunyikan) -->
        <div
          v-if="showDrafDownload"
          class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
        >
          <span class="text-2xl">📄</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              Draf Naskah Saat Ini
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              DOCX · versi terbaru dari step sebelumnya
            </p>
          </div>
          <UButton size="sm" variant="outline" icon="i-lucide-download" @click="$emit('download')"
            >Download Draf</UButton
          >
        </div>

        <div>
          <FileUpload
            :model-value="revisiDocx ? [revisiDocx] : []"
            :multiple="false"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            label="Unggah Versi DOCX"
            description="PDF pratinjau akan dibuat otomatis oleh sistem setelah DOCX diunggah"
            @update:model-value="onRevisiDocxFiles"
          />
        </div>

        <!-- Parsing state -->
        <div
          v-if="parsing"
          class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600"
        >
          <UIcon name="i-lucide-loader-2" class="mx-auto h-7 w-7 animate-spin text-primary-500" />
          <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Sistem mengunggah DOCX dan membuat PDF pratinjau…
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Mengekstrak isi dan parameter dari dokumen
          </p>
        </div>

        <!-- Parse result -->
        <div v-if="hasRevision && !parsing" class="space-y-4">
          <div
            class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/40"
          >
            <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-green-600" />
            <div class="flex-1">
              <p class="text-sm font-medium text-green-800 dark:text-green-300">
                {{ revisiDocx.name }}
              </p>
              <p class="text-xs text-green-600 dark:text-green-400">
                {{
                  stageUpload
                    ? stagedSuccessDescription
                    : 'DOCX berhasil diunggah dan PDF pratinjau dibuat otomatis'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Catatan -->
    <div v-if="showCatatan" :class="cardClass">
      <div :class="headClass">
        <h3 class="font-semibold text-gray-900 dark:text-white">{{ catatanTitle }}</h3>
      </div>
      <div :class="divided ? 'px-5 pb-5' : 'p-5'">
        <!-- Item #4: TinyMCE editor bila catatanRich; textarea biasa bila tidak (default, tanda-tangan). -->
        <TinymceEditorAsync
          v-if="catatanRich"
          :model-value="modelValue"
          :init="catatanInit"
          @update:model-value="$emit('update:modelValue', $event)"
        />
        <textarea
          v-else
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          rows="4"
          :placeholder="catatanPlaceholder"
          class="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>

    <!-- 4. Aksi -->
    <div
      v-if="showActions"
      class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div :class="headClass">
        <h3 class="font-semibold text-gray-900 dark:text-white">Aksi</h3>
      </div>
      <div
        :class="
          divided
            ? 'flex flex-col gap-3 px-5 pb-5 sm:flex-row'
            : 'flex flex-col gap-3 p-5 sm:flex-row'
        "
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { renderAsync } from 'docx-preview';
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';

const props = defineProps({
  detail: { type: Object, default: null },
  dokumenPendukung: { type: Array, default: () => [] },
  areaTitle: { type: String, default: 'Revisi Naskah' },
  areaDescription: {
    type: String,
    default:
      'Revisi naskah di luar aplikasi: download draf, lengkapi di Microsoft Word, lalu upload kembali. Noted: Jangan menghapus parameter dikarenakan sistem membaca isi dan parameter di dalamnya.',
  },
  catatanTitle: { type: String, default: 'Catatan' },
  catatanPlaceholder: { type: String, default: 'Tuliskan catatan…' },
  modelValue: { type: String, default: '' },
  showActions: { type: Boolean, default: true },
  // Bila diisi, Section 1 render inline docx-preview collapsible (item #1). tanda-tangan tidak pass → emit preview (lama).
  docxUrl: { type: String, default: '' },
  // item #2: sembunyikan "Draf Naskah Saat Ini" di Section 2. Default true (tanda-tangan tidak berubah).
  showDrafDownload: { type: Boolean, default: true },
  // item #4: pakai TinyMCE editor untuk catatan. Default false (tanda-tangan tetap textarea).
  catatanRich: { type: Boolean, default: false },
  showCatatan: { type: Boolean, default: true },
  // staging: bila true, unggah revisi TIDAK langsung persist ke naskah (legal-drafting).
  // File di-stage di FE (preview lokal), baru di-commit saat user klik "Kirim Approval Legal".
  // Default false → tanda-tangan tetap persist langsung (perilaku lama).
  stageUpload: { type: Boolean, default: false },
  stagedSuccessDescription: {
    type: String,
    default: 'Revisi siap dikirim bersama aksi',
  },
  // sembunyikan Section 2 (Area Kerja — upload revisi). blanko-verbal tidak merevisi
  // naskah (naskah final), upload blanko ditangani halaman terpisah. Default true (tanda-tangan/legal-drafting tidak berubah).
  showAreaKerja: { type: Boolean, default: true },
  // divided: render section sebagai baris terbagi (divide-y) tanpa kartu masing-masing,
  // agar bisa disisipkan di dalam satu kartu induk bersama section lain di halaman.
  divided: { type: Boolean, default: false },
});

const emit = defineEmits([
  'preview',
  'download',
  'preview-pendukung',
  'upload-revisi',
  'stage-revisi',
  'update:modelValue',
]);

// Kelas kondisional mode divided vs kartu mandiri (default).
const rootClass = computed(() =>
  props.divided ? 'divide-y divide-gray-100 dark:divide-gray-700' : 'space-y-6'
);
const cardClass = computed(() =>
  props.divided
    ? ''
    : 'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'
);
const headClass = computed(() =>
  props.divided ? 'px-5 pt-4 pb-2.5' : 'border-b border-gray-100 px-5 py-4 dark:border-gray-700'
);

const { apiGet } = useApi();
const toast = useToast();

const revisiDocx = ref(null);
const parsing = ref(false);
const hasRevision = computed(() => !!revisiDocx.value);

// Nama file naskah kanonik (display + download) — rumus shared di utils/naskah-file-name,
// identik dengan BE agar konsisten di semua halaman + object storage.
const naskahFilename = computed(() => naskahFileName(props.detail));

// ── Section 1: inline docx preview (item #1) ──
const awalPreviewOpen = ref(false);
const awalPreviewLoading = ref(false);
const awalPreviewContainer = ref(null);
const awalPreviewBuffer = ref(null);
const awalPdfPreviewUrl = ref('');
const isPdfPreviewUrl = computed(() => props.docxUrl.includes('preview=1'));

function resetAwalPreview() {
  awalPreviewBuffer.value = null;
  if (awalPdfPreviewUrl.value) {
    URL.revokeObjectURL(awalPdfPreviewUrl.value);
    awalPdfPreviewUrl.value = '';
  }
}

async function toggleAwalPreview() {
  awalPreviewOpen.value = !awalPreviewOpen.value;
  if (!awalPreviewOpen.value) return;
  if (!props.docxUrl) return;
  awalPreviewLoading.value = true;
  await nextTick();
  try {
    if (isPdfPreviewUrl.value) {
      if (!awalPdfPreviewUrl.value) {
        const response = await apiGet(props.docxUrl, { responseType: 'blob' });
        const pdf =
          response instanceof Blob
            ? new Blob([await response.arrayBuffer()], { type: 'application/pdf' })
            : new Blob([response], { type: 'application/pdf' });
        awalPdfPreviewUrl.value = URL.createObjectURL(pdf);
      }
      return;
    }

    if (!awalPreviewBuffer.value) {
      const buf = await apiGet(props.docxUrl, { responseType: 'arraybuffer' });
      awalPreviewBuffer.value = buf;
    }
    const el = awalPreviewContainer.value;
    if (!el) return;
    el.innerHTML = '';
    await renderAsync(awalPreviewBuffer.value, el, undefined, {
      className: 'docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
    });
  } catch {
    toast.add({ title: 'Gagal merender pratinjau dokumen', color: 'error' });
    awalPreviewOpen.value = false;
  } finally {
    awalPreviewLoading.value = false;
  }
}

// ── Section 2: upload revisi via FileUpload (item #9) + collapsible preview (item #3) ──
function emitRevision() {
  emit('stage-revisi', {
    docx: revisiDocx.value,
  });
}

async function onRevisiDocxFiles(files) {
  revisiDocx.value = files?.[files.length - 1] ?? null;
  emitRevision();
  await persistRevisionIfReady();
}

async function persistRevisionIfReady() {
  if (props.stageUpload || !hasRevision.value) return;
  parsing.value = true;
  try {
    await emit('upload-revisi', {
      docx: revisiDocx.value,
    });
  } catch {
    toast.add({ title: 'Gagal mengunggah revisi', color: 'error' });
  } finally {
    parsing.value = false;
  }
}

watch(
  () => props.docxUrl,
  () => {
    awalPreviewOpen.value = false;
    resetAwalPreview();
  }
);

onBeforeUnmount(() => {
  resetAwalPreview();
});

// ── Section 3: TinyMCE init (item #4) — disederhanakan dari layanan-email pattern ──
const catatanInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 240,
  menubar: false,
  promotion: false,
  branding: false,
  placeholder: props.catatanPlaceholder,
  plugins: 'lists advlist link table',
  toolbar:
    'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link table | removeformat',
  content_style: `body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; }`,
};
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  margin: 0 auto !important;
}
</style>
