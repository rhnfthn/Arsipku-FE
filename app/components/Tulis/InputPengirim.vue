<template>
  <div
    class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
    <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
      {{ label }}
    </span>
    <div class="flex flex-wrap gap-1 w-full items-center">
      <USelectMenu v-model="model" :items="items" :placeholder="placeholder" by="value" option-attribute="label"
        class="w-full p-0" variant="none" :ui="{
          base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
          wrapper: 'w-full',
          input: 'w-full',
          trigger: { base: 'px-0 py-1 w-full text-left' },
        }">
        <template #item="{ item, selected }">
          <div class="flex items-start gap-3 w-full py-1 overflow-hidden">
            <img v-if="item.image" :src="item.image" :alt="item.label"
              class="w-7 h-7 rounded-full object-cover shrink-0" />
            <div class="flex-1 min-w-0">
              <span class="block text-sm text-left truncate w-full"
                :class="{ 'font-semibold text-primary-600': selected }">
                {{ item.label }}
              </span>
              <span class="block text-xs text-gray-500 truncate w-full">
                {{ item.labelJob || 'No Job Title' }}
              </span>
            </div>
            <UIcon v-if="selected" name="i-lucide-check" class="w-4 h-4 text-primary-500 ml-auto" />
          </div>
        </template>

        <template #default="{ open }">
          <div class="flex items-center justify-between w-full min-h-[28px] dark:bg-gray-800 cursor-pointer group">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <template v-if="model">
                <UBadge color="primary" variant="soft" size="md"
                  class="gap-1.5 pl-2 pr-2 flex items-center justify-start rounded-md max-w-full pointer-events-none">
                  <img v-if="model.image" :src="model.image" :alt="model.label"
                    class="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                  <span class="text-xs font-medium text-left truncate">
                    {{ model.label }}
                  </span>
                </UBadge>
              </template>
              <span v-else class="text-sm text-gray-400 dark:text-gray-500 group-hover:text-gray-600">
                {{ placeholder }}
              </span>
            </div>

            <!-- <UIcon name="i-heroicons-chevron-down-20-solid"
              class="w-5 h-5 text-gray-400 transition-transform duration-200"
              :class="[open && 'transform rotate-180']" /> -->
          </div>
        </template>
      </USelectMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  placeholder?: string;
  items: any[];
}>();

// Menggunakan object tunggal (bukan array)
const model = defineModel<any>();
</script>
