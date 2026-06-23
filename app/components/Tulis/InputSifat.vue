<template>
  <div
    class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
    <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
      Sifat
    </span>
    <div class="flex flex-wrap gap-1 w-full items-center">
      <USelectMenu v-model="selected" :items="sifatOptions" placeholder="Pilih sifat ..." class="w-full p-0"
        variant="none" :search="false" value-attribute="value">
        <template #default="{ label }: any">
          <div class="flex items-center gap-1.5 min-h-[28px] pr-10 w-full cursor-pointer">
            <span v-if="selected" class="text-sm text-left truncate text-gray-900 dark:text-white">
              {{ getLabel(selected) }}
            </span>
            <span v-else class="text-sm text-gray-400">Pilih sifat</span>
          </div>
        </template>
      </USelectMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Object, String, null] as any,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const sifatOptions = [
  { label: "Biasa / Terbuka", value: "biasa" },
  { label: "Terbatas", value: "terbatas" },
  { label: "Rahasia", value: "rahasia" },
  { label: "Sangat Rahasia", value: "sangat rahasia" }
]

// Helper untuk mendapatkan label dari value jika v-model isinya string
const getLabel = (val: any) => {
  if (typeof val === 'string') {
    return sifatOptions.find(opt => opt.value === val)?.label || val
  }
  return val?.label || val
}

const selected = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

onMounted(() => {
  if (!props.modelValue) {
    // Set default string 'biasa' agar sinkron dengan getBasePayload
    emit('update:modelValue', 'biasa')
  }
})
</script>
