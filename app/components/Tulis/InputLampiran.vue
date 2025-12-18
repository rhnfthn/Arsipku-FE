<template>
  <div class="flex flex-col py-3 gap-2 mt-4">
    <div class="flex justify-between items-center">
      <label class="text-sm font-medium text-gray-700">Lampiran</label>

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

        <div class="flex items-center gap-2 overflow-hidden">
          <UIcon name="i-lucide-file-text" class="w-4 h-4 text-red-500 shrink-0" />
          <div class="flex flex-col min-w-0">
            <a :href="file.filePath || '#'" target="_blank"
              class="text-sm text-gray-700 truncate font-medium hover:underline hover:text-primary">
              {{ file.fileName || file.name }}
            </a>
            <span class="text-xs text-gray-400">
              {{ formatFileSize(file.fileSize || file.size) }}
            </span>
          </div>
        </div>

        <UButton icon="i-lucide-trash-2" size="2xs" color="red" variant="ghost" :disabled="isProcessing"
          @click="handleRemove(idx, file)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useLampiran } from '@/composables/useLampiran';

const props = defineProps<{ existingFiles: any[] }>();
const emit = defineEmits(['update:existingFiles']);

// State
const selectedFiles = ref<File[]>([]);
const isUploading = ref(false);
const isDeleting = ref(false);
const uploadProgress = ref(0);
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Computed Status
const isProcessing = computed(() => isUploading.value || isDeleting.value);
const processMessage = computed(() => {
  if (isUploading.value) return `Mengupload ${uploadProgress.value}%`;
  if (isDeleting.value) return 'Menghapus file...';
  return '';
});

const { uploadLampiran, deleteLampiran } = useLampiran();
const toast = useToast();

// Watcher Upload
watch(selectedFiles, async (newFiles) => {
  if (newFiles.length > 0) {
    await validateAndUpload(newFiles);
  }
});

const validateAndUpload = async (files: File[]) => {
  // 1. Validasi Ukuran (Maks 10MB)
  const validFiles: File[] = [];
  const invalidFiles: string[] = [];

  files.forEach(f => {
    if (f.size <= MAX_SIZE_BYTES) {
      validFiles.push(f);
    } else {
      invalidFiles.push(f.name);
    }
  });

  // Jika ada file invalid, munculkan peringatan tapi tetap upload yang valid
  if (invalidFiles.length > 0) {
    toast.add({
      title: 'Ukuran File Terlalu Besar',
      description: `${invalidFiles.length} file melebihi ${MAX_SIZE_MB}MB dan dilewati.`,
      color: 'orange',
      timeout: 5000
    });
    // Reset input jika tidak ada file valid sama sekali
    if (validFiles.length === 0) {
      selectedFiles.value = [];
      return;
    }
  }

  // 2. Proses Upload File Valid
  isUploading.value = true;
  uploadProgress.value = 0;

  try {
    const res = await uploadLampiran(validFiles, (percent) => {
      uploadProgress.value = percent;
    });

    if (res.success && res.data && Array.isArray(res.data.files)) {

      // 3. Mapping Response + Inject Size dari File Asli
      // Asumsi: Urutan response array SAMA dengan urutan input validFiles
      const newUploadedFiles = res.data.files.map((f: any, index: number) => {
        // Ambil size dari file asli yang diupload
        const originalFile = validFiles[index];

        return {
          id: f.id,
          fileName: f.file_name,
          filePath: f.file_path,
          // Inject size di sini agar UI muncul
          fileSize: originalFile ? originalFile.size : 0
        };
      });

      // Update Parent
      const newExisting = [...props.existingFiles, ...newUploadedFiles];
      emit('update:existingFiles', newExisting);

      toast.add({ title: 'Berhasil upload lampiran', color: 'green' });
    } else {
      throw new Error('Format response tidak sesuai');
    }

  } catch (error) {
    console.error(error);
    toast.add({ title: 'Gagal upload lampiran', description: 'Terjadi kesalahan server', color: 'red' });
  } finally {
    selectedFiles.value = []; // Reset input selalu
    setTimeout(() => {
      isUploading.value = false;
      uploadProgress.value = 0;
    }, 500);
  }
};

// --- Fungsi Hapus dengan API ---
const handleRemove = async (index: number, file: any) => {
  if (!file.id) {
    // Jika entah kenapa tidak ada ID, hapus lokal saja
    removeFromList(index);
    return;
  }

  // Konfirmasi (Opsional, tapi disarankan)
  if (!confirm('Apakah Anda yakin ingin menghapus lampiran ini?')) return;

  isDeleting.value = true;
  try {
    // Panggil API Delete
    await deleteLampiran(file.id);

    // Jika sukses API, hapus dari list UI
    removeFromList(index);
    toast.add({ title: 'File berhasil dihapus', color: 'green' });

  } catch (error) {
    console.error(error);
    toast.add({ title: 'Gagal menghapus file', description: 'Silakan coba lagi', color: 'red' });
  } finally {
    isDeleting.value = false;
  }
};

// Helper Hapus Array Lokal
const removeFromList = (index: number) => {
  const newArr = [...props.existingFiles];
  newArr.splice(index, 1);
  emit('update:existingFiles', newArr);
};

// Formatter Size
const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 B'; // Handle 0 atau undefined
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
</script>
