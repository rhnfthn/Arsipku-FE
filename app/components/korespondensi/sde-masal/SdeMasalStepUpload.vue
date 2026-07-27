<template>
  <div class="flex-1 overflow-y-auto space-y-4">
    <!-- Ringkasan Konsep dari Step 1 -->
    <div class="bg-[#457fb6]/10 dark:bg-[#457fb6]/20 rounded-lg p-4">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Ringkasan Konsep Surat</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="w-4 h-4 text-[#457fb6] shrink-0" />
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ konsep?.tanggalKonsep || '-' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-tag" class="w-4 h-4 text-[#457fb6] shrink-0" />
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Klasifikasi</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ konsep?.klasifikasiName || '-' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user" class="w-4 h-4 text-[#457fb6] shrink-0" />
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Pengirim</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ konsep?.pengirimName || '-' }}</p>
          </div>
        </div>
        <div v-if="konsep?.perihal" class="flex items-center gap-2">
          <UIcon name="i-lucide-file-text" class="w-4 h-4 text-[#457fb6] shrink-0" />
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Perihal</p>
            <p class="font-medium text-gray-900 dark:text-white truncate">{{ konsep.perihal }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Download Template -->
    <div class="flex items-center gap-3">
      <UButton
        label="Download Template Excel"
        color="primary"
        variant="soft"
        icon="i-lucide-download"
        @click="handleDownloadTemplate"
      />
      <span class="text-xs text-gray-500 dark:text-gray-400">
        Format kolom: No, Persnum, Nama, Jabatan, Keterangan
      </span>
    </div>

    <!-- Upload Area -->
    <div>
      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        Upload File Excel <span class="text-red-500">*</span>
      </label>
      <div
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
        <UIcon name="i-lucide-upload" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p v-if="!selectedFile" class="text-sm text-gray-500 dark:text-gray-400">
          Klik atau drag file Excel ke sini (.xlsx, max 5MB)
        </p>
        <p v-else class="text-sm text-[#457fb6] font-medium">
          {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
        </p>
      </div>
    </div>

    <!-- Parsing indicator -->
    <div v-if="parsing" class="flex items-center gap-2 text-sm text-gray-400">
      <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
      Memproses file Excel...
    </div>

    <!-- Error -->
    <div v-if="parseError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
      {{ parseError }}
    </div>

    <!-- Preview Excel -->
    <SdeMasalExcelPreview v-if="penerimaList.length > 0" :items="penerimaList" />

    <!-- Validasi summary -->
    <div v-if="penerimaList.length > 0" class="flex items-center gap-4 text-sm">
      <span class="text-gray-500 dark:text-gray-400">
        Total: <strong class="text-gray-900 dark:text-white">{{ penerimaList.length }}</strong>
      </span>
      <span class="text-green-600 dark:text-green-400">
        Valid: <strong>{{ validCount }}</strong>
      </span>
      <span v-if="invalidCount > 0" class="text-red-600 dark:text-red-400">
        Invalid: <strong>{{ invalidCount }}</strong>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSdeMasal } from '~/composables/useSdeMasal';
import type { SdeMasalPenerima, SdeMasalConcept } from '~/types/sde-masal';
import SdeMasalExcelPreview from './SdeMasalExcelPreview.vue';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
}>();

const model = defineModel<SdeMasalPenerima[]>({ default: () => [] });

const { downloadTemplate, parseExcelLocal } = useSdeMasal();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const dragOver = ref(false);
const parsing = ref(false);
const parseError = ref<string | null>(null);

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

const parseFile = async (file: File) => {
  parsing.value = true;
  parseError.value = null;
  try {
    const result = await parseExcelLocal(file);
    model.value = result;
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
</script>