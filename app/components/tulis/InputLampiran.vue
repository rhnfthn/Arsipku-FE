<template>
  <div class="flex flex-col py-3 gap-2 mt-4">
    <label class="text-sm font-medium text-gray-700">Lampiran File</label>

    <!-- Upload file -->
    <FileUpload v-model="uploadedFiles" accept="application/pdf" :multiple="true"
      description="Klik atau drag & drop untuk upload file PDF" />

    <!-- Lampiran tersimpan -->
    <div v-if="existingFiles && existingFiles.length > 0" class="mt-3 space-y-2">
      <p class="text-sm font-medium text-gray-700">Lampiran Tersimpan</p>

      <div v-for="(file, idx) in existingFiles" :key="file.id || idx"
        class="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md">
        <!-- kiri -->
        <div class="flex items-center gap-2 overflow-hidden">
          <UIcon name="i-lucide-file-text" class="w-4 h-4 text-red-500 shrink-0" />

          <div class="flex flex-col min-w-0">
            <a :href="file.filePath" target="_blank" class="text-sm text-gray-700 truncate font-medium hover:underline">
              {{ file.fileName }}
            </a>
            <span class="text-xs text-gray-400">
              {{ formatFileSize(file.fileSize || file.size) }}
            </span>
          </div>
        </div>

        <!-- kanan -->
        <UButton icon="i-lucide-trash-2" size="2xs" color="red" variant="ghost" @click="removeExisting(idx)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const uploadedFiles = defineModel<File[]>('uploaded', { default: () => [] })

const props = defineProps<{ existingFiles: any[] }>()
const emit = defineEmits(['update:existingFiles'])

const removeExisting = (index: number) => {
  const newArr = [...props.existingFiles]
  newArr.splice(index, 1)
  emit('update:existingFiles', newArr)
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
</script>
