<script setup lang="ts">
const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Array as () => File[], default: () => [] },
  accept: { type: String, default: 'application/pdf' },
  multiple: { type: Boolean, default: false },
  label: { type: String, default: undefined },
  description: { type: String, default: undefined },
  maxSize: { type: Number, default: null },
})

const effectiveLabel = computed(() => props.label ?? t('fu_label'))
const effectiveDescription = computed(() => props.description ?? t('fu_description'))

const emit = defineEmits(['update:modelValue', 'invalid-files'])

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const triggerFileInput = () => fileInputRef.value?.click()

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    processFiles(input.files)

    // Reset value input agar bisa memilih file yang sama berulang kali
    input.value = ''
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) processFiles(event.dataTransfer.files)
}

const processFiles = (fileList: FileList) => {
  const files = Array.from(fileList)

  // filter berdasarkan accept — support both MIME type and extension matching
  const allowed = props.accept.split(',').map(a => a.trim().toLowerCase())

  const validFiles: File[] = []
  const invalidFiles: string[] = []

  files.forEach(file => {
    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()
    const isAllowed = allowed.some(a => {
      // MIME type match (e.g. "application/pdf", "image/*")
      if (a.includes('/')) {
        if (a.endsWith('/*')) {
          const prefix = a.slice(0, -1) // "image/"
          return fileType.startsWith(prefix)
        }
        return fileType === a
      }
      // Extension match (e.g. ".pdf")
      if (a.startsWith('.')) {
        return fileName.endsWith(a)
      }
      return false
    })

    if (!isAllowed) {
      return
    }

    if (props.maxSize && file.size > props.maxSize) {
      invalidFiles.push(file.name)
      return
    }

    validFiles.push(file)
  })

  const newFiles = props.multiple
    ? [...props.modelValue, ...validFiles]
    : validFiles.slice(0, 1)

  if (invalidFiles.length > 0) {
    emit('invalid-files', invalidFiles)
  }

  if (validFiles.length > 0) {
    emit('update:modelValue', newFiles)
  }
}

const removeFile = (i: number) => {
  const updated = [...props.modelValue]
  updated.splice(i, 1)
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop"
      @click="triggerFileInput"
      class="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-900"
      :class="isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-white dark:hover:bg-gray-800'">
      <UIcon name="i-lucide-cloud-upload" class="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />

      <p class="text-sm text-gray-500 dark:text-gray-300 text-center">
        <span class="font-semibold text-primary-600 dark:text-primary-400">{{ effectiveLabel }}</span>
      </p>

      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ effectiveDescription }}</p>

      <input ref="fileInputRef" type="file" :accept="accept" :multiple="multiple" class="hidden"
        @change="handleFileChange" />
    </div>

    <!-- PREVIEW FILES -->
    <div v-if="modelValue.length > 0" class="flex flex-col gap-2 mt-2">
      <div v-for="(file, index) in modelValue" :key="index"
        class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
        <div class="flex items-center gap-2 overflow-hidden">
          <UIcon name="i-lucide-file-text" class="size-4 text-red-500 shrink-0" />
          <div class="flex flex-col">
            <span class="text-sm text-gray-700 dark:text-gray-200 truncate font-medium">{{ file.name }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ (file.size / 1024).toFixed(1) }} {{ $t('fu_kb') }}</span>
          </div>
        </div>
        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" :padded="false"
          :aria-label="$t('fu_delete')"
          class="w-6 h-6 hover:bg-red-50 dark:hover:bg-red-900/30 rounded shrink-0" @click.stop="removeFile(index)" />
      </div>
    </div>
  </div>
</template>
