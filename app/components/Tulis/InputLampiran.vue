<template>
  <div class="flex flex-col py-3 gap-2 mt-4">
    <div class="flex justify-between items-center">
      <label class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ $t('f_lampiran') }}</label>

      <span v-if="isProcessing" class="text-xs text-primary font-medium flex items-center gap-1">
        <UIcon name="i-lucide-loader-2" class="animate-spin" />
        {{ processMessage }}
      </span>
    </div>

    <UProgress v-if="isUploading" :value="uploadProgress" color="primary" size="xs"
      class="mb-2 transition-all duration-300" />

    <FileUpload v-model="selectedFiles" accept="application/pdf" :multiple="true" :disabled="isProcessing"
      :description="$t('lamp_description')" @invalid-files="handleInvalidPdfFiles" />

    <div v-if="existingFiles && existingFiles.length > 0" class="mt-3 space-y-2">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ $t('lamp_tersimpan') }}</p>

      <div v-for="(file, idx) in existingFiles" :key="file.id || idx"
        class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">

        <div class="flex items-center gap-2 overflow-hidden cursor-pointer group flex-1" @click="handlePreview(file)">
          <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
          <div class="flex flex-col min-w-0">
            <span class="text-sm text-gray-700 dark:text-gray-200 truncate font-medium group-hover:text-primary group-hover:underline">
              {{ file.fileName || file.name }}
            </span>
          </div>
        </div>

        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :disabled="isProcessing"
          @click="handleRemove(idx, file)" />
      </div>
    </div>

    <USlideover v-model:open="showPdfModal" :title="previewTitle" :description="previewTitle" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">

          <iframe v-if="activePdfUrl && !isLocalPdfLoading" :src="activePdfUrl" class="w-full h-full border-none" />

          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500 dark:text-gray-400">{{ $t('lamp_memuat_pratinjau') }}</span>
          </div>

        </div>
      </template>

      <template #footer>
        <div class="flex gap-4 w-full justify-end">
          <UButton :label="$t('f_tutup')" color="primary" variant="ghost" size="lg" class="px-8" @click="showPdfModal = false" />
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue';
import { useLampiran } from '@/composables/useLampiran';
import { Alert } from '@/composables/useAlert';

const { t } = useI18n();

// Props & Emits
const props = defineProps<{ existingFiles: any[] }>();
const emit = defineEmits(['update:existingFiles']);

// State Upload
const selectedFiles = ref<File[]>([]);
const isUploading = ref(false);
const isDeleting = ref(false);
const uploadProgress = ref(0);
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// State Preview PDF
const showPdfModal = ref(false);
const activePdfUrl = ref<string | null>(null);
const isLocalPdfLoading = ref(false);
const previewTitle = ref(t('f_pratinjau'));

// Composables
const { uploadLampiran, deleteLampiran, previewLampiran } = useLampiran();
const toast = useToast();

const handleInvalidPdfFiles = (fileNames: string[]) => {
  toast.add({
    title: 'Format lampiran tidak didukung',
    description: `Lampiran harus berformat PDF. File ditolak: ${fileNames.join(', ')}`,
    color: 'warning',
  });
};

// Computed Status
const isProcessing = computed(() => isUploading.value || isDeleting.value);
const processMessage = computed(() => {
  if (isUploading.value) return t('lamp_mengupload', { progress: uploadProgress.value });
  if (isDeleting.value) return t('lamp_menghapus_file');
  return '';
});

// --- LOGIC PREVIEW PDF (UPDATED) ---

const getFileUrlString = (file: any): string => {
  if (!file) return '';

  // 1. File mentah (baru dipilih dari komputer, belum upload) -> Blob Local
  if (file instanceof File) {
    return URL.createObjectURL(file);
  }

  // 2. Fallback (Jika data lama ada filePath tapi tidak ada ID)
  if (file.filePath) {
    if (file.filePath.startsWith('http')) return file.filePath;
    return `/storage/${file.filePath}`;
  }

  return '';
};

const handlePreview = async (file: any) => {
  const directUrl = getFileUrlString(file);
  const title = file.fileName || file.name || t('dokumen');

  if (!file?.id && !directUrl) {
    toast.add({ title: t('f_gagal'), description: t('lamp_gagal_url'), color: 'error' });
    return;
  }

  previewTitle.value = title;
  showPdfModal.value = true;
  isLocalPdfLoading.value = true;
  activePdfUrl.value = null;

  try {
    if (activePdfUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(activePdfUrl.value);
    }

    // File server harus diambil lewat API client agar Authorization header ikut.
    if (file?.id) {
      const blob = await previewLampiran(String(file.id));
      activePdfUrl.value = URL.createObjectURL(blob);
    } else if (directUrl.startsWith('blob:')) {
      activePdfUrl.value = directUrl;
    } else {
      activePdfUrl.value = directUrl;
    }
  } catch (error) {
    console.error("Gagal memuat dokumen:", error);
    showPdfModal.value = false;
    toast.add({ title: t('f_gagal'), description: t('lamp_gagal_url'), color: 'error' });
  } finally {
    isLocalPdfLoading.value = false;
  }
};

onUnmounted(() => {
  // Hanya revoke jika itu blob local, bukan link http server
  if (activePdfUrl.value && activePdfUrl.value.startsWith('blob:') && !activePdfUrl.value.includes('http')) {
    URL.revokeObjectURL(activePdfUrl.value);
  }
});

// --- UPLOAD LOGIC ---

watch(selectedFiles, async (newFiles) => {
  if (newFiles.length > 0) {
    await validateAndUpload(newFiles);
  }
});

const validateAndUpload = async (files: File[]) => {
  const validFiles: File[] = [];
  const invalidFiles: string[] = [];

  files.forEach(f => {
    if (f.size <= MAX_SIZE_BYTES) {
      validFiles.push(f);
    } else {
      invalidFiles.push(f.name);
    }
  });

  if (invalidFiles.length > 0) {
    toast.add({
      title: t('f_file_terlalu_besar'),
      description: t('lamp_file_terlalu_besar_pesan', { count: invalidFiles.length, max: MAX_SIZE_MB }),
      color: 'warning',
    });
    if (validFiles.length === 0) {
      selectedFiles.value = [];
      return;
    }
  }

  isUploading.value = true;
  uploadProgress.value = 0;

  try {
    const res = await uploadLampiran(validFiles, (percent) => {
      uploadProgress.value = percent;
    });

    if (res.success && res.data?.files) {
      const newUploadedFiles = res.data.files.map((f: any, index: number) => {
        const originalFile = validFiles[index];
        return {
          id: f.id,
          fileName: f.file_name,
          filePath: f.file_path,
          fileSize: originalFile ? originalFile.size : 0
        };
      });

      const newExisting = [...props.existingFiles, ...newUploadedFiles];
      emit('update:existingFiles', newExisting);
      toast.add({ title: t('lamp_berhasil_upload'), color: 'success' });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    toast.add({ title: t('lamp_gagal_upload'), description: t('lamp_gagal_upload_pesan'), color: 'error' });
  } finally {
    selectedFiles.value = [];
    setTimeout(() => {
      isUploading.value = false;
      uploadProgress.value = 0;
    }, 500);
  }
};

const handleRemove = async (index: number, file: any) => {
  // 1. Tampilkan Alert Konfirmasi
  const isConfirmed = await Alert.confirm(
    t('lamp_hapus_lampiran'),
    t('lamp_konfirmasi_hapus'),
    t('lamp_ya_hapus'),
    t('batal'),
    true
  );

  if (!isConfirmed) return;

  // KASUS A: Menghapus file lokal
  if (!file.id) {
    removeFromList(index);
    Alert.close();
    return;
  }

  // KASUS B: Menghapus file di server
  isDeleting.value = true;
  try {
    await deleteLampiran(file.id);
    removeFromList(index);
    toast.add({ title: t('lamp_berhasil_hapus'), color: 'success' });
  } catch (error) {
    toast.add({ title: t('lamp_gagal_hapus'), color: 'error' });
  } finally {
    isDeleting.value = false;
    Alert.close();
  }
};

const removeFromList = (index: number) => {
  const newArr = [...props.existingFiles];
  newArr.splice(index, 1);
  emit('update:existingFiles', newArr);
};
</script>
