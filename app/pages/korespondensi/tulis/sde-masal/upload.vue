<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Upload Excel SDE Masal" :items="items" />
    </div>

    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 -mt-2">
      Upload file Excel berisi data SDE yang akan dikirim secara masal.
    </p>

    <!-- Info Pengirim -->
    <div class="bg-[#457fb6]/10 dark:bg-[#457fb6]/20 rounded-lg p-4 mb-4 max-w-2xl">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-user" class="w-5 h-5 text-[#457fb6]" />
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Pengirim</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ concept?.pengirimName || '-' }}</p>
        </div>
      </div>
    </div>

    <!-- Upload Form -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
      <div class="space-y-5">
        <!-- Versi Template -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Versi Template <span class="text-red-500">*</span></label>
          <select
            v-model="form.versiTemplate"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          >
            <option value="">Pilih versi...</option>
            <option value="v1">v1</option>
            <option value="v2">v2</option>
          </select>
        </div>

        <!-- Upload File -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">File Excel <span class="text-red-500">*</span></label>
          <div
            @click="$refs.fileInput.click()"
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
            <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileSelect" />
            <UIcon name="i-lucide-upload" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p v-if="!selectedFile" class="text-sm text-gray-500 dark:text-gray-400">
              Klik atau drag file Excel ke sini (.xlsx, max 5MB)
            </p>
            <p v-else class="text-sm text-[#457fb6] font-medium">
              {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
            </p>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex items-center gap-3 pt-2">
          <button
            @click="submit"
            :disabled="submitting || !selectedFile || !form.versiTemplate"
            class="h-10 px-5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50"
          >
            <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
            Submit Upload
          </button>
          <button
            @click="downloadTemplate('KEUANGAN')"
            class="h-10 px-5 text-sm font-medium rounded-lg border border-[#457fb6] text-[#457fb6] hover:bg-[#457fb6]/10 dark:hover:bg-[#457fb6]/20 transition-colors"
          >
            <UIcon name="i-lucide-download" class="w-4 h-4 mr-1 inline" />
            Download Template
          </button>
          <button
            @click="$router.push('/korespondensi/tulis/sde-masal')"
            class="h-10 px-5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSdeMasal } from '~/composables/useSdeMasal';
import type { SdeMasalConcept } from '~/types/sde-masal';

definePageMeta({ middleware: ['auth'] });

const router = useRouter();
const { uploadExcel, downloadTemplate } = useSdeMasal();

const items = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Korespondensi', to: '/korespondensi/kotak-masuk' },
  { label: 'SDE Masal', to: '/korespondensi/tulis/sde-masal' },
  { label: 'Upload', to: '/korespondensi/tulis/sde-masal/upload' },
];

const concept = ref<SdeMasalConcept | null>(null);
const selectedFile = ref<File | null>(null);
const dragOver = ref(false);
const submitting = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const form = reactive({
  versiTemplate: '',
});

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

const validateAndSetFile = (file: File) => {
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    alert('File harus berformat .xlsx atau .xls');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('Ukuran file maksimal 5MB');
    return;
  }
  selectedFile.value = file;
};

const submit = async () => {
  if (!selectedFile.value || !form.versiTemplate) {
    alert('Semua field wajib diisi');
    return;
  }
  if (!concept.value?.id) {
    alert('Konsep tidak ditemukan. Silakan ulangi dari Form 1.');
    router.push('/korespondensi/tulis/sde-masal');
    return;
  }

  submitting.value = true;
  try {
    const result = await uploadExcel(
      selectedFile.value,
      concept.value.id,
      'KEUANGAN',
      form.versiTemplate,
    );

    if (result) {
      alert(`Upload berhasil! Total: ${result.total}, Sukses: ${result.success}, Gagal: ${result.failed}`);
      localStorage.removeItem('sde_masal_concept');
      router.push('/korespondensi/sde-masal');
    }
  } catch (e) {
    console.error('Gagal upload:', e);
    alert('Gagal mengupload file');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  const stored = localStorage.getItem('sde_masal_concept');
  if (stored) {
    concept.value = JSON.parse(stored);
  } else {
    router.push('/korespondensi/tulis/sde-masal');
  }
});
</script>