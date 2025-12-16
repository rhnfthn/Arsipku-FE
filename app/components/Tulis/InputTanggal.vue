<template>
  <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 relative gap-1 sm:gap-0">
    <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">
      {{ label }}
    </span>
    <div class="relative w-full">
      <ClientOnly>
        <UPopover v-model:open="open" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
          <div class="flex items-center gap-2 cursor-pointer w-full pr-2" @click="open = true">
            <UInputDate locale="id-ID" v-model="model" variant="none" size="sm" format="DD MMMM YYYY" class="flex-1"
              :ui="{ base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-8' }" />
            <UIcon name="i-lucide-calendar" class="size-4 text-gray-400 shrink-0 mr-0.5" />
          </div>
          <template #content>
            <UCalendar v-model="model" class="p-2" @update:model-value="open = false" />
          </template>
        </UPopover>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  label: {
    type: String,
    default: 'Tanggal Surat'
  }
})

// Model ini akan menerima variable 'date' dari parent (CalendarDate object)
const model = defineModel()
const open = ref(false)
</script>
