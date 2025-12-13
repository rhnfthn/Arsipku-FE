<template>
  <div class="flex flex-col py-3 gap-2 mt-4">
    <label class="text-sm font-medium text-gray-700">Lampiran File</label>

    <div v-if="existingFiles && existingFiles.length > 0" class="mb-3 space-y-2">
      <p class="text-sm font-medium text-gray-700">Lampiran Tersimpan:</p>
      <div v-for="(file, idx) in existingFiles" :key="file.id || idx"
        class="flex items-center justify-between p-2 bg-gray-50 border rounded-md">
        <div class="flex items-center gap-2 overflow-hidden">
          <UIcon name="i-heroicons-paper-clip" class="w-4 h-4 text-gray-400" />
          <a :href="file.filePath" target="_blank" class="text-sm text-primary truncate hover:underline">
            {{ file.fileName }}
          </a>
        </div>
        <UButton icon="i-heroicons-trash" size="2xs" color="red" variant="ghost" @click="removeExisting(idx)" />
      </div>
    </div>

    <FileUpload v-model="uploadedFiles" accept="application/pdf" :multiple="true"
      description="Klik atau drag & drop untuk upload file PDF" />
  </div>
</template>

<script setup lang="ts">
// Model untuk file baru yg diupload
const uploadedFiles = defineModel<File[]>('uploaded', { default: [] })

// Props untuk file lama (2-way binding manual agar bisa splice)
const props = defineProps<{ existingFiles: any[] }>()
const emit = defineEmits(['update:existingFiles'])

const removeExisting = (index: number) => {
  const newArr = [...props.existingFiles]
  newArr.splice(index, 1)
  emit('update:existingFiles', newArr)
}
</script>
