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

    <!-- Preview Excel -->
    <SdeMasalExcelPreview v-if="penerimaList.length > 0" :items="penerimaList" :columns="templateColumns" :konsep="konsep" :template="template" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSdeMasal } from '~/composables/useSdeMasal';
import type { SdeMasalPenerima, SdeMasalConcept, SdeMasalTemplate } from '~/types/sde-masal';
import SdeMasalExcelPreview from './SdeMasalExcelPreview.vue';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  dynamicVariables?: string[];
  defaultPerihal?: string;
  defaultTertuju?: string;
  template?: SdeMasalTemplate | null;
}>();

const model = defineModel<SdeMasalPenerima[]>({ default: () => [] });

const { downloadTemplate, parseExcelLocal } = useSdeMasal();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const dragOver = ref(false);
const parsing = ref(false);
const parseError = ref<string | null>(null);

const templateColumns = computed(() => {
  return [
    'perihal',
    'tertuju',
    'tembusan_internal',
    'tembusan_eksternal',
    'email_tertuju',
    'email_cc',
    'email_bcc',
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
