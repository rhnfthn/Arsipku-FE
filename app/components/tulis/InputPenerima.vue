<template>
  <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
    <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1 text-gray-500 font-medium shrink-0">
      {{ label }}
    </span>
    <div class="flex flex-wrap gap-1 w-full items-center">
      <USelectMenu
        v-model="model"
        :items="processedItems"
        multiple
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
        <template #item="{ item }">
          <div
            class="flex items-start gap-3 w-full py-1 overflow-hidden"
            :class="{ 'opacity-50 cursor-not-allowed': item.disabled }"
          >
            <UCheckbox
              :model-value="isSelected(item)"
              class="pointer-events-none shrink-0"
              :checked="isSelected(item)"
              :disabled="item.disabled"
            />
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.label"
              class="w-7 h-7 rounded-full object-cover shrink-0"
            />
            <div class="flex-1 min-w-0">
              <span class="block text-sm text-left truncate w-full">
                {{ item.label }}
              </span>
              <span v-if="item.disabled" class="text-xs text-red-500 italic">
                {{ disabledMessage }}
              </span>
            </div>
          </div>
        </template>

        <template #default>
          <div class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full">
            <UBadge
              v-for="item in model"
              :key="item.value"
              color="primary"
              variant="soft"
              size="md"
              class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full"
            >
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.label"
                class="w-3.5 h-3.5 rounded-full object-cover shrink-0"
              />
              <span class="text-xs font-medium text-left truncate">
                {{ item.label }}
              </span>
              <UButton
                icon="i-lucide-x"
                size="2xs"
                color="gray"
                variant="ghost"
                :padded="false"
                class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                @click.stop="removeItem(item)"
              />
            </UBadge>
            <span v-if="!model.length" class="text-sm text-gray-400 dark:text-gray-500">
              {{ placeholder }}
            </span>
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
