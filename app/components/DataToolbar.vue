<template>
  <div class="flex flex-wrap gap-2 items-center p-3">
    <div class="relative">
      <button
        type="button"
        @click="openRows = !openRows"
        class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
      >
        <span>{{ modelValue }}</span>
        <ChevronDown
          class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
          :class="{ 'rotate-180': openRows }"
        />
      </button>
      <Transition name="filter-dd">
        <div
          v-if="openRows"
          class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
        >
          <button
            v-for="n in rowsChoices"
            :key="n"
            type="button"
            @click="$emit('update:modelValue', n); openRows = false"
            :class="[
              'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
              modelValue === n
                ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            {{ n }}
          </button>
        </div>
      </Transition>
    </div>

    <button
      @click="$emit('refresh')"
      class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition-colors"
      :title="refreshLabel"
    >
      <RotateCcw class="w-4 h-4" />
    </button>

    <div class="relative flex-1 min-w-40">
      <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
      <input
        :value="search"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
        :placeholder="searchPlaceholder"
        class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
      />
    </div>

    <button
      v-if="showExport"
      @click="$emit('export')"
      class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap"
    >
      {{ exportLabel }}
    </button>

    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search, RotateCcw, ChevronDown } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    modelValue: number;
    search: string;
    searchPlaceholder?: string;
    rowsChoices?: number[];
    showExport?: boolean;
    exportLabel?: string;
    refreshLabel?: string;
  }>(),
  {
    rowsChoices: () => [5, 10, 25, 50, 100],
    showExport: true,
    exportLabel: 'Export',
    refreshLabel: 'Refresh',
    searchPlaceholder: 'Cari...',
  }
);

defineEmits<{
  'update:modelValue': [value: number];
  'update:search': [value: string];
  refresh: [];
  export: [];
}>();

const openRows = ref(false);
</script>

<style scoped>
.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.15s ease;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>