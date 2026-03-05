<template>
  <UModal v-model:open="isOpen" :dismissible="false" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Tanda Tangan Digital (BSrE)
        </h3>
      </div>
    </template>

    <template #body>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Dokumen ditandatangani secara elektronik resmi (TTE). Masukkan passphrase Anda.
      </p>

      <div class="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="flex items-start gap-4 p-4">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <UIcon name="i-heroicons-user" class="w-6 h-6" />
            </div>
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-gray-500 mb-0.5">{{ signerInfo.label }}</span>
            <span class="text-sm text-gray-700 dark:text-gray-300 leading-tight mb-0.5">{{ signerInfo.role }}</span>
            <span class="text-base font-semibold text-gray-900 dark:text-white">{{ signerInfo.name }}</span>
          </div>
        </div>

        <div class="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <UFormGroup label="Passphrase" required>
            <UInput type="password" v-model="localPassphrase" size="lg" placeholder="Masukkan passphrase TTE Anda"
              class="w-full" autofocus />
          </UFormGroup>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Batal" color="secondary" size="lg" variant="ghost" @click="handleCancel" />
        <UButton label="Lanjutkan" color="primary" size="lg" icon="i-heroicons-paper-airplane" :loading="isLoading"
          @click="handleSubmit" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface SignerInfo {
  name: string
  role: string
  label: string
}

const props = defineProps<{
  open: boolean
  signerInfo: SignerInfo
  isLoading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [passphrase: string]
}>()

// Two-way binding for modal open state
const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

// Local passphrase state, reset when modal opens
const localPassphrase = ref('')

watch(() => props.open, (newVal) => {
  if (newVal) localPassphrase.value = ''
})

const handleCancel = () => {
  emit('update:open', false)
}

const handleSubmit = () => {
  emit('submit', localPassphrase.value)
}
</script>
