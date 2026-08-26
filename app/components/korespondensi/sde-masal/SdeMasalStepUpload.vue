<template>
  <div class="flex-1 overflow-y-auto space-y-5">
    <!-- Ringkasan Konsep dari Step 1 -->
    <div class="bg-[#457fb6]/10 dark:bg-[#457fb6]/20 rounded-lg p-4">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Konsep Surat</h4>
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

    <!-- Card: Download Template -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-visible">
      <div class="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 rounded-t-lg">
        <UIcon name="i-lucide-download" class="w-4 h-4 text-[#457fb6]" />
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Download Template Excel</span>
      </div>
      <div class="p-4 space-y-4">
        <!-- Step 1: Pilih Template -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pilih Template <span class="text-red-500">*</span></label>
          <div class="relative">
            <!-- Trigger button -->
            <button
              @click="templateDropdownOpen = !templateDropdownOpen"
              class="w-full h-10 px-3 flex items-center justify-between text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none transition-colors"
            >
              <span v-if="!selectedTemplateSkema" class="text-gray-400 dark:text-gray-500">Pilih template...</span>
              <span v-else class="flex items-center gap-2">
                <UIcon
                  :name="selectedTemplateSkema === 'KEUANGAN' ? 'i-lucide-wallet' : 'i-lucide-file-text'"
                  class="w-4 h-4 text-[#457fb6]"
                />
                {{ selectedTemplateSkema === 'KEUANGAN' ? 'Keuangan (PINP)' : 'Umum' }}
              </span>
              <UIcon
                name="i-lucide-chevron-down"
                class="w-4 h-4 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': templateDropdownOpen }"
              />
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="templateDropdownOpen"
              class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
            >
              <button
                @click="selectTemplate('KEUANGAN')"
                class="w-full flex items-start gap-3 px-3 py-3 hover:bg-[#457fb6]/5 dark:hover:bg-[#457fb6]/10 transition-colors border-b border-gray-100 dark:border-gray-700 text-left"
              >
                <div class="w-9 h-9 rounded-lg bg-[#457fb6]/10 dark:bg-[#457fb6]/20 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-wallet" class="w-4 h-4 text-[#457fb6]" />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">Keuangan (PINP)</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tagihan IDR/USD, CRO, Signer</p>
                </div>
                <UIcon v-if="selectedTemplateSkema === 'KEUANGAN'" name="i-lucide-check" class="w-4 h-4 text-[#457fb6] mt-1" />
              </button>
              <button
                @click="selectTemplate('UMUM')"
                class="w-full flex items-start gap-3 px-3 py-3 hover:bg-[#457fb6]/5 dark:hover:bg-[#457fb6]/10 transition-colors text-left"
              >
                <div class="w-9 h-9 rounded-lg bg-[#457fb6]/10 dark:bg-[#457fb6]/20 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-file-text" class="w-4 h-4 text-[#457fb6]" />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">Umum</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">IDR/USD Amount, Macro, Email</p>
                </div>
                <UIcon v-if="selectedTemplateSkema === 'UMUM'" name="i-lucide-check" class="w-4 h-4 text-[#457fb6] mt-1" />
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Badge kolom (muncul setelah pilih) -->
        <div v-if="selectedTemplateSkema" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
          <p class="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
            Kolom Template: {{ selectedTemplateSkema === 'KEUANGAN' ? 'Keuangan (PINP)' : 'Umum' }}
          </p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="col in templateColumns"
              :key="col"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              <UIcon name="i-lucide-columns-3" class="w-3 h-3 text-[#457fb6]" />
              {{ col }}
            </span>
          </div>
        </div>

        <!-- Step 3: Download button (muncul setelah pilih) -->
        <div v-if="selectedTemplateSkema" class="flex items-center gap-3">
          <UButton
            :label="`Download Template ${selectedTemplateSkema === 'KEUANGAN' ? 'Keuangan' : 'Umum'}`"
            color="primary"
            variant="soft"
            icon="i-lucide-file-down"
            @click="handleDownloadTemplate"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Unduh template Excel dengan format kolom yang sudah disesuaikan
          </p>
        </div>
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
          <p v-if="!selectedFile" class="text-sm text-gray-500 dark:text-gray-400">
            Klik atau drag file Excel ke sini (.xlsx, max 5MB)
          </p>
          <p v-else class="text-sm text-[#457fb6] font-medium">
            {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
          </p>
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
    <SdeMasalExcelPreview v-if="penerimaList.length > 0" :items="penerimaList" :skema="selectedTemplateSkema" />

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
import { ref, computed, watch } from 'vue';
import { useSdeMasal } from '~/composables/useSdeMasal';
import type { SdeMasalPenerima, SdeMasalConcept } from '~/types/sde-masal';
import SdeMasalExcelPreview from './SdeMasalExcelPreview.vue';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
}>();

const emit = defineEmits<{
  'update:skemaTemplate': [value: 'KEUANGAN' | 'UMUM' | null];
}>();

const model = defineModel<SdeMasalPenerima[]>({ default: () => [] });

const { downloadTemplate, parseExcelLocal } = useSdeMasal();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const dragOver = ref(false);
const parsing = ref(false);
const parseError = ref<string | null>(null);
const templateDropdownOpen = ref(false);
const selectedTemplateSkema = ref<'KEUANGAN' | 'UMUM' | null>(null);

const keuanganColumns = [
  'No', 'Perihal', 'id_tertuju', 'jumlah_tagihan_idr', 'jumlah_tagihan_usd',
  'nama_cro', 'email_cro', 'jabatan_signer', 'nama_signer', 'tembusan', 'is_revision',
];

const umumColumns = [
  'No', 'Perihal', 'id_tertuju', 'idramount', 'usdamount', 'namacro',
  'email', 'tembusan', 'is_revision', 'email_tertuju', 'email_cc', 'email_bcc',
];

const templateColumns = computed(() => {
  if (selectedTemplateSkema.value === 'KEUANGAN') return keuanganColumns;
  if (selectedTemplateSkema.value === 'UMUM') return umumColumns;
  return [];
});

const selectTemplate = (skema: 'KEUANGAN' | 'UMUM') => {
  selectedTemplateSkema.value = skema;
  templateDropdownOpen.value = false;
};

// Emit skema ke parent wizard
watch(selectedTemplateSkema, (val) => {
  emit('update:skemaTemplate', val);
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
  if (!selectedTemplateSkema.value) return;
  downloadTemplate(selectedTemplateSkema.value);
};
</script>