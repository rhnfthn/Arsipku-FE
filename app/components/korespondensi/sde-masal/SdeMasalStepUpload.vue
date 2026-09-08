<template>
  <div class="flex-1 overflow-y-auto space-y-5">
    <!-- Template Excel dinamis dari variabel konten -->
    <div class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div>
          <p class="text-sm font-semibold text-blue-900 dark:text-blue-200">Kolom Template dari Konten Surat</p>
        </div>
        <UButton label="Download Template Excel" color="primary" icon="i-lucide-download" size="sm" @click="handleDownloadDynamicTemplate" />
      </div>
      <div class="overflow-x-auto rounded-lg border border-blue-200 dark:border-blue-900/60">
        <table class="min-w-full border-collapse text-sm">
          <thead>
            <tr class="bg-blue-100 dark:bg-blue-950/50">
              <th
                v-for="column in templateColumns"
                :key="column"
                class="border border-blue-200 px-3 py-2 text-left font-semibold text-blue-900 whitespace-nowrap dark:border-blue-900/60 dark:text-blue-200"
              >
                {{ column }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="bg-white dark:bg-gray-800">
              <td
                v-for="column in templateColumns"
                :key="column"
                class="border border-blue-100 px-3 py-2 text-gray-400 dark:border-blue-900/40 dark:text-gray-500"
              >
                &nbsp;
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Card: Upload Excel -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden">
      <div class="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <UIcon name="i-lucide-upload" class="w-4 h-4 text-[#457fb6]" />
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Upload File Excel <span class="text-red-500">*</span></span>
      </div>
      <div class="p-4">
        <div
          v-if="!selectedFile"
          @click="triggerFileInput"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="onDrop"
          :class="[
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            dragOver
              ? 'border-[#457fb6] bg-[#457fb6]/5'
              : 'border-gray-300 dark:border-gray-600 hover:border-[#457fb6]',
          ]"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            class="hidden"
            @change="onFileSelect"
          />
          <UIcon name="i-lucide-file-spreadsheet" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p class="text-sm text-gray-500 dark:text-gray-400">Klik atau drag file Excel ke sini (.xlsx, max 5MB)</p>
        </div>

        <div
          v-if="selectedFile"
          class="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/50"
        >
          <UIcon name="i-lucide-file-spreadsheet" class="h-5 w-5 shrink-0 text-primary-500" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{{ selectedFile.name }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
          </div>
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            aria-label="Hapus file"
            @click="removeSelectedFile"
          />
        </div>

        <!-- Parsing indicator -->
        <div v-if="parsing" class="flex items-center gap-2 text-sm text-gray-400 mt-3">
          <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
          Memproses file Excel...
        </div>

        <!-- Error -->
        <div v-if="parseError" class="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {{ parseError }}
        </div>
      </div>
    </div>

    <!-- Card: Upload ZIP lampiran massal -->
    <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 overflow-hidden">
      <div class="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
        <UIcon name="i-lucide-files" class="h-4 w-4 text-[#457fb6]" />
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Lampiran Massal (opsional)</span>
      </div>
      <div class="space-y-3 p-4">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Isi kolom <span class="font-medium">lampiran</span> pada Excel dengan nama file PDF, pisahkan dengan titik koma (;), lalu unggah satu ZIP berisi PDF tersebut.
        </p>
        <div
          v-if="!selectedAttachmentZip"
          class="cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-colors"
          :class="attachmentDragOver ? 'border-[#457fb6] bg-[#457fb6]/5' : 'border-gray-300 hover:border-[#457fb6] dark:border-gray-600'"
          @click="triggerAttachmentInput"
          @dragover.prevent="attachmentDragOver = true"
          @dragleave.prevent="attachmentDragOver = false"
          @drop.prevent="onAttachmentDrop"
        >
          <input ref="attachmentInput" type="file" accept=".zip" class="hidden" @change="onAttachmentSelect" />
          <UIcon name="i-lucide-file-archive" class="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p class="text-sm text-gray-500 dark:text-gray-400">Klik atau drag ZIP ke sini (maks. 50MB)</p>
        </div>
        <div v-else class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/50">
          <UIcon name="i-lucide-file-archive" class="h-5 w-5 shrink-0 text-primary-500" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{{ selectedAttachmentZip.name }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ (selectedAttachmentZip.size / 1024 / 1024).toFixed(2) }} MB</p>
          </div>
          <UButton color="neutral" variant="soft" size="sm" :loading="attachmentPreparing" label="Cek File" @click="prepareAttachments" />
          <UButton color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus ZIP" @click="removeAttachmentZip" />
        </div>
        <div v-if="attachmentPreparing" class="flex items-center gap-2 text-sm text-gray-400">
          <UIcon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" /> Memeriksa dan mengunggah PDF unik...
        </div>
        <div v-if="attachmentError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {{ attachmentError }}
        </div>
        <div v-if="attachmentPreview" class="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-200">Preview Mapping</div>
          <div v-if="attachmentPreview.missing.length" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            File tidak ditemukan: {{ attachmentPreview.missing.join(', ') }}
          </div>
          <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table class="min-w-full text-xs">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="border-b border-gray-200 px-3 py-2 text-left dark:border-gray-700">No</th>
                  <th class="border-b border-gray-200 px-3 py-2 text-left dark:border-gray-700">Lampiran Excel</th>
                  <th class="border-b border-gray-200 px-3 py-2 text-left dark:border-gray-700">Status</th>
                  <th class="border-b border-gray-200 px-3 py-2 text-left dark:border-gray-700">Preview</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in attachmentMappingRows" :key="row.no">
                  <td class="border-b border-gray-100 px-3 py-2 dark:border-gray-700">{{ row.no }}</td>
                  <td class="border-b border-gray-100 px-3 py-2 dark:border-gray-700">{{ row.names.join('; ') || '—' }}</td>
                  <td class="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                    <span :class="row.found ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">{{ row.found ? 'Valid' : 'Invalid' }}</span>
                  </td>
                  <td class="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                    <div v-if="mappedAttachmentsFor(row).length" class="flex flex-wrap gap-1.5">
                      <UButton
                        v-for="attachment in mappedAttachmentsFor(row)"
                        :key="`${row.no}-${attachment.key}`"
                        :label="attachment.fileName"
                        icon="i-lucide-eye"
                        color="primary"
                        variant="soft"
                        size="xs"
                        @click="openAttachmentPreview(attachment)"
                      />
                    </div>
                    <span v-else class="text-gray-300 dark:text-gray-600">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex w-full flex-wrap items-center justify-between gap-3 text-sm">
            <span class="text-gray-500 dark:text-gray-400">
              {{ validAttachmentCount }} PDF <span class="font-semibold text-green-700 dark:text-green-300">valid</span>
              <span v-if="invalidAttachmentCount > 0">
                · {{ invalidAttachmentCount }} PDF <span class="font-semibold text-red-700 dark:text-red-300">invalid</span>
              </span>
            </span>
            <UButton
              v-if="!attachmentPreview.missing.length && !attachmentConfirmed"
              label="Konfirmasi"
              color="primary"
              size="sm"
              icon="i-lucide-check"
              @click="confirmAttachments"
            />
            <span v-else-if="!attachmentPreview.missing.length" class="text-green-700 dark:text-green-300">Semua nama file berhasil ditempatkan.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview PDF lampiran menggunakan viewer yang sama dengan preview penerima -->
    <Teleport to="body">
      <div v-if="attachmentPreviewUrl" class="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950">
        <div class="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex min-w-0 items-center gap-2">
            <UIcon name="i-lucide-file-text" class="h-4 w-4 shrink-0 text-primary-500" />
            <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ attachmentPreviewName }}</p>
          </div>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" title="Tutup" @click="closeAttachmentPreview" />
        </div>
        <div class="min-h-0 flex-1 bg-gray-100 dark:bg-gray-900">
          <iframe :src="attachmentPreviewUrl" class="h-full w-full border-none" :title="attachmentPreviewName" />
        </div>
      </div>
    </Teleport>

    <!-- Preview Excel -->
    <SdeMasalExcelPreview v-if="penerimaList.length > 0" :items="penerimaList" :columns="templateColumns" :konsep="konsep" :template="template" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSdeMasal } from '~/composables/useSdeMasal';
import type {
  SdeMasalAttachmentRef,
  SdeMasalPenerima,
  SdeMasalConcept,
  SdeMasalTemplate,
} from '~/types/sde-masal';
import SdeMasalExcelPreview from './SdeMasalExcelPreview.vue';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  dynamicVariables?: string[];
  defaultPerihal?: string;
  defaultTertuju?: string;
  template?: SdeMasalTemplate | null;
  folderId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'attachments-confirmed'): void;
}>();

const model = defineModel<SdeMasalPenerima[]>({ default: () => [] });

const { downloadTemplate, parseExcelLocal, prepareMassAttachments } = useSdeMasal();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const dragOver = ref(false);
const parsing = ref(false);
const parseError = ref<string | null>(null);
const attachmentInput = ref<HTMLInputElement | null>(null);
const selectedAttachmentZip = ref<File | null>(null);
const attachmentDragOver = ref(false);
const attachmentPreparing = ref(false);
const attachmentError = ref<string | null>(null);
const attachmentPreview = ref<{
  files: SdeMasalAttachmentRef[];
  matched: Record<string, SdeMasalAttachmentRef>;
  missing: string[];
  totalRequested: number;
} | null>(null);
const attachmentConfirmed = ref(false);
const attachmentPreviewUrl = ref<string | null>(null);
const attachmentPreviewName = ref('Preview Lampiran');

const templateColumns = computed(() => {
  return [
    'perihal',
    'tertuju',
    'tembusan_internal',
    'tembusan_eksternal',
    'email_tertuju',
    'email_cc',
    'email_bcc',
    'lampiran',
    ...(props.dynamicVariables || []).filter(
      (value) =>
        ![
          'perihal',
          'tertuju',
          'tembusan',
          'tembusan_internal',
          'tembusan_eksternal',
          'email_tertuju',
          'email_cc',
          'email_bcc',
        ].includes(value)
    ),
  ];
});

const penerimaList = computed(() => model.value || []);
const validCount = computed(() => penerimaList.value.filter((p) => p.isValid).length);
const invalidCount = computed(() => penerimaList.value.filter((p) => !p.isValid).length);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const validateAndSetFile = (file: File) => {
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    parseError.value = 'File harus berformat .xlsx atau .xls';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    parseError.value = 'Ukuran file maksimal 5MB';
    return;
  }
  parseError.value = null;
  selectedFile.value = file;
  parseFile(file);
};

const onFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    validateAndSetFile(target.files[0]);
  }
};

const onDrop = (e: DragEvent) => {
  dragOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    validateAndSetFile(e.dataTransfer.files[0]);
  }
};

const removeSelectedFile = () => {
  selectedFile.value = null;
  model.value = [];
  parseError.value = null;
  attachmentPreview.value = null;
  attachmentConfirmed.value = false;
  if (fileInput.value) fileInput.value.value = '';
};

const parseFile = async (file: File) => {
  parsing.value = true;
  parseError.value = null;
  try {
    const result = await parseExcelLocal(file, templateColumns.value);
    model.value = result.map((item) => {
      const perihal = item.perihal || props.defaultPerihal || '';
      const tertuju = item.tertuju || props.defaultTertuju || '';
      return {
        ...item,
        perihal,
        tertuju,
        isValid: Boolean(perihal && tertuju) && !item.validationMessage?.startsWith('Template Excel tidak sesuai'),
        validationMessage: Boolean(perihal && tertuju) ? undefined : 'Perihal dan tertuju wajib diisi',
      };
    });
    attachmentPreview.value = null;
    attachmentConfirmed.value = false;
    if (result.some((item) => !item.isValid && item.validationMessage?.startsWith('Template Excel tidak sesuai'))) {
      parseError.value = 'Template Excel tidak sesuai dengan template yang dipilih. Periksa baris berstatus X.';
    }
  } catch (e: any) {
    console.error('Gagal parse Excel:', e);
    parseError.value = e?.message || 'Gagal memproses file Excel';
    model.value = [];
  } finally {
    parsing.value = false;
  }
};

const normalizeAttachmentName = (value: unknown) => String(value ?? '').trim().toLowerCase();

const attachmentNamesFor = (item: SdeMasalPenerima): string[] => {
  if (Array.isArray(item.lampiran)) return item.lampiran.map((ref) => ref.fileName);
  if (typeof item.lampiran !== 'string') return [];
  return item.lampiran
    .split(';')
    .map((name) => name.trim())
    .filter(Boolean);
};

const requestedAttachmentNames = computed(() =>
  Array.from(
    new Set(
      penerimaList.value.flatMap((item) => attachmentNamesFor(item)).map(normalizeAttachmentName)
    )
  )
);

const validAttachmentCount = computed(() =>
  requestedAttachmentNames.value.filter((name) => Boolean(attachmentPreview.value?.matched[normalizeAttachmentName(name)])).length
);

const invalidAttachmentCount = computed(() =>
  Math.max(requestedAttachmentNames.value.length - validAttachmentCount.value, 0)
);

const attachmentMappingRows = computed(() =>
  penerimaList.value.map((item, index) => {
    const names = attachmentNamesFor(item);
    return {
      no: index + 1,
      names,
      found: names.every((name) => Boolean(attachmentPreview.value?.matched[normalizeAttachmentName(name)])),
    };
  })
);

const mappedAttachmentsFor = (row: { names: string[] }) =>
  row.names
    .map((name) => attachmentPreview.value?.matched[normalizeAttachmentName(name)])
    .filter(Boolean) as SdeMasalAttachmentRef[];

const openAttachmentPreview = (attachment: SdeMasalAttachmentRef) => {
  if (!attachment.url) {
    attachmentError.value = `Preview tidak tersedia untuk ${attachment.fileName}`;
    return;
  }
  attachmentPreviewName.value = attachment.fileName;
  attachmentPreviewUrl.value = attachment.url;
};

const closeAttachmentPreview = () => {
  attachmentPreviewUrl.value = null;
  attachmentPreviewName.value = 'Preview Lampiran';
};

const triggerAttachmentInput = () => attachmentInput.value?.click();

const validateAttachmentZip = (file: File) => {
  if (!/\.zip$/i.test(file.name)) {
    attachmentError.value = 'File lampiran massal harus berformat .zip';
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    attachmentError.value = 'Ukuran ZIP maksimal 50MB';
    return;
  }
  selectedAttachmentZip.value = file;
  attachmentPreview.value = null;
  attachmentConfirmed.value = false;
  attachmentError.value = null;
};

const onAttachmentSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) validateAttachmentZip(file);
};

const onAttachmentDrop = (event: DragEvent) => {
  attachmentDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) validateAttachmentZip(file);
};

const removeAttachmentZip = () => {
  selectedAttachmentZip.value = null;
  attachmentPreview.value = null;
  attachmentConfirmed.value = false;
  attachmentError.value = null;
  if (attachmentInput.value) attachmentInput.value.value = '';
};

const prepareAttachments = async () => {
  if (!selectedAttachmentZip.value) return;
  if (!props.folderId) {
    attachmentError.value = 'Folder belum tersimpan. Klik Selanjutnya pada konsep surat terlebih dahulu.';
    return;
  }
  if (requestedAttachmentNames.value.length === 0) {
    attachmentError.value = 'Isi kolom lampiran pada Excel terlebih dahulu.';
    return;
  }

  attachmentPreparing.value = true;
  attachmentError.value = null;
  try {
    const result = await prepareMassAttachments(
      props.folderId,
      selectedAttachmentZip.value,
      requestedAttachmentNames.value
    );
    attachmentPreview.value = {
      files: result?.files || [],
      matched: result?.matched || {},
      missing: result?.missing || [],
      totalRequested: requestedAttachmentNames.value.length,
    };
  } catch (error: any) {
    attachmentError.value = error?.response?.data?.message || error?.message || 'Gagal memproses ZIP lampiran';
    attachmentPreview.value = null;
  } finally {
    attachmentPreparing.value = false;
  }
};

const confirmAttachments = () => {
  if (!attachmentPreview.value || attachmentPreview.value.missing.length > 0) return;
  model.value = model.value.map((item) => {
    const refs = attachmentNamesFor(item)
      .map((name) => attachmentPreview.value?.matched[normalizeAttachmentName(name)])
      .filter(Boolean) as SdeMasalAttachmentRef[];
    return { ...item, lampiran: refs };
  });
  attachmentConfirmed.value = true;
  emit('attachments-confirmed');
};

const handleDownloadTemplate = () => {
  downloadTemplate();
};

const handleDownloadDynamicTemplate = async () => {
  const XLSX = await import('xlsx');
  const columns = templateColumns.value;
  const workbook = XLSX.utils.book_new();
  const defaults = columns.map((column) => column === 'perihal'
    ? props.defaultPerihal || ''
    : column === 'tertuju'
      ? props.defaultTertuju || ''
      : '');
  const dataSheet = XLSX.utils.aoa_to_sheet([columns, defaults]);
  const mappingSheet = XLSX.utils.aoa_to_sheet([
    ['Kolom Excel', 'Variabel Konten'],
    ...columns.map((column) => [column, `{{${column}}}`]),
  ]);
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data Penerima');
  XLSX.utils.book_append_sheet(workbook, mappingSheet, 'Mapping Variabel');
  XLSX.writeFile(workbook, 'template-sde-masal-dinamis.xlsx');
};
</script>
