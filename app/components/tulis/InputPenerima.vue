<template>
  <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
    <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
      {{ label }}
    </span>
    <div class="flex flex-wrap gap-1 w-full items-center">
      <USelectMenu
        v-model="model"
        :items="processedItems"
        :placeholder="placeholder"
        class="w-full p-0"
        variant="none"
        :ui="{
          base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
          wrapper: 'pr-10 w-full',
          input: 'pr-10 w-full',
          value: 'p-0 w-full',
          trigger: { base: 'px-0 py-1 w-full' },
        }"
      >
        <template #item="{ item, selected }">
          <div
            class="flex items-start gap-3 w-full py-1 overflow-hidden"
            :class="{ 'opacity-50 cursor-not-allowed': item.disabled }"
          >
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.label"
              class="w-7 h-7 rounded-full object-cover shrink-0"
              :class="{ 'ring-2 ring-primary-500': selected }"
            />
            <div class="flex-1 min-w-0">
              <span class="block text-sm text-left truncate w-full" :class="{ 'font-semibold text-primary-500': selected }">
                {{ item.label }}
              </span>
              <span v-if="item.disabled" class="text-xs text-red-500 italic">
                {{ disabledMessage }}
              </span>
            </div>
          </div>
        </template>

        <template #default>
          <div class="flex items-center justify-between w-full min-h-[28px] pr-2 dark:bg-gray-800">

            <div v-if="model" class="flex items-center gap-2 overflow-hidden">
              <img
                v-if="model.image"
                :src="model.image"
                :alt="model.label"
                class="w-5 h-5 rounded-full object-cover shrink-0"
              />
              <span class="text-sm text-gray-900 dark:text-gray-100 truncate">
                {{ model.label }}
              </span>
            </div>

            <span v-else class="text-sm text-gray-400 dark:text-gray-500">
              {{ placeholder }}
            </span>

            <UButton
              v-if="model"
              icon="i-lucide-x"
              size="2xs"
              color="gray"
              variant="ghost"
              :padded="false"
              class="w-5 h-5 ml-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
              @click.stop="clearSelection"
            />
          </div>
        </template>
      </USelectMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props definition
const props = defineProps<{
  label: string;
  placeholder?: string;
  items: any[]; // Data Master (Semua Pegawai)
  excludeItems?: any[]; // Data yang sudah dipilih di field LAWAN (misal: di Tembusan)
  disabledMessage?: string;
}>();

// Vue 3.4+ defineModel (Auto handle update:modelValue)
const model = defineModel<any[]>({ default: [] });

// Computed untuk memproses item (menambah flag disabled jika ada di excludeItems)
const processedItems = computed(() => {
  return props.items.map((item) => ({
    ...item,
    disabled: props.excludeItems?.some((ex) => ex.value === item.value) || false,
  }));
});

// Helper functions
const isSelected = (item: any) => model.value.some((s) => s.value === item.value);

const removeItem = (item: any) => {
  const index = model.value.findIndex((s) => s.value === item.value);
  if (index > -1) model.value.splice(index, 1);
};
</script>
