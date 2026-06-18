<template>
  <div class="flex flex-col py-3 gap-2 mt-4">
    <div class="flex justify-between items-center">
      <label class="text-sm text-gray-500 dark:text-gray-400 font-medium">Lampiran</label>

      <span v-if="isProcessing" class="text-xs text-primary font-medium flex items-center gap-1">
        <UIcon name="i-lucide-loader-2" class="animate-spin" />
        {{ processMessage }}
      </span>
    </div>

    <UProgress v-if="isUploading" :value="uploadProgress" color="primary" size="xs"
      class="mb-2 transition-all duration-300" />

    <FileUpload v-model="selectedFiles" accept="application/pdf" :multiple="true" :disabled="isProcessing"
      description="Klik atau drag & drop untuk upload file PDF (Maks 10MB)" />

    <div v-if="existingFiles && existingFiles.length > 0" class="mt-3 space-y-2">
      <p class="text-sm font-medium text-gray-700">Lampiran Tersimpan</p>

      <div v-for="(file, idx) in existingFiles" :key="file.id || idx"
        class="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md transition-colors hover:bg-gray-50">

        <div class="flex items-center gap-2 overflow-hidden cursor-pointer group flex-1" @click="handlePreview(file)">
          <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
          <div class="flex flex-col min-w-0">
            <span class="text-sm text-gray-700 truncate font-medium group-hover:text-primary group-hover:underline">
              {{ file.fileName || file.name }}
            </span>
          </div>
        </div>

        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :disabled="isProcessing"
          @click="handleRemove(idx, file)" />
      </div>
    </div>

    <USlideover v-model:open="showPdfModal" :title="previewTitle" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">

          <iframe v-if="activePdfUrl && !isLocalPdfLoading" :src="activePdfUrl" class="w-full h-full border-none" />

          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">Memuat Pratinjau...</span>
          </div>

        </div>
      </template>

      <template #footer>
        <div class="flex gap-4 w-full justify-end">
          <UButton label="Tutup" color="primary" variant="ghost" size="lg" class="px-8" @click="showPdfModal = false" />
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue';
import { useLampiran } from '@/composables/useLampiran';
import { Alert } from '@/composables/useAlert';

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
const previewTitle = ref('Pratinjau');

// Composables
const { uploadLampiran, deleteLampiran } = useLampiran();
const toast = useToast();

// Computed Status
const isProcessing = computed(() => isUploading.value || isDeleting.value);
const processMessage = computed(() => {
  if (isUploading.value) return `Mengupload ${uploadProgress.value}%`;
  if (isDeleting.value) return 'Menghapus file...';
  return '';
});

// --- LOGIC PREVIEW PDF (UPDATED) ---

const getFileUrlString = (file: any): string => {
  if (!file) return '';

  // 1. File mentah (baru dipilih dari komputer, belum upload) -> Blob Local
  if (file instanceof File) {
    return URL.createObjectURL(file);
  }

  // 2. File dari server (Sudah punya ID) -> Gunakan Link Preview Server
  if (file.id) {
    const config = useRuntimeConfig();
    const previewBase = config.public.previewFileUrl || "http://172.20.16.115:3011";
    return `${previewBase}/preview-file/${file.id}`;
  }

  // 3. Fallback (Jika data lama ada filePath tapi tidak ada ID)
  if (file.filePath) {
    if (file.filePath.startsWith('http')) return file.filePath;
    return `/storage/${file.filePath}`;
  }

  return '';
};

const handlePreview = async (file: any) => {
  const url = getFileUrlString(file);
  const title = file.fileName || file.name || 'Dokumen';

  if (!url) {
    toast.add({ title: 'Gagal', description: 'URL dokumen tidak valid', color: 'error' });
    return;
  }

  previewTitle.value = title;
  showPdfModal.value = true;
  isLocalPdfLoading.value = true;
  activePdfUrl.value = null;

  try {
    // Jika URL adalah Blob (Local File), langsung pakai
    if (url.startsWith('blob:')) {
      activePdfUrl.value = url;
    } else {
      // Jika URL adalah Link Server (http...), langsung set ke iframe
      // Browser akan menangani loadingnya
      activePdfUrl.value = url;
    }
  } catch (error) {
    console.error("Gagal memuat dokumen:", error);
    activePdfUrl.value = url;
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
      title: 'File Terlalu Besar',
      description: `${invalidFiles.length} file melebihi ${MAX_SIZE_MB}MB.`,
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
      toast.add({ title: 'Berhasil upload lampiran', color: 'success' });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    toast.add({ title: 'Gagal upload', description: 'Cek koneksi atau server', color: 'error' });
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
    'Hapus lampiran?',
    'Lampiran yang dihapus tidak dapat dikembalikan.',
    'Ya, Hapus',
    'Batal',
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
    toast.add({ title: 'File berhasil dihapus', color: 'success' });
  } catch (error) {
    toast.add({ title: 'Gagal menghapus file', color: 'error' });
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
