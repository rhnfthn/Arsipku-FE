<template>
  <div
    v-if="totalPages > 0"
    class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
  >
    <div class="text-xs text-gray-600 dark:text-gray-400">
      {{ showingLabel }} {{ displayStart }}–{{ displayEnd }} {{ ofLabel }}
      <span class="font-semibold">{{ totalItems }}</span> {{ dataLabel }}
    </div>

    <div class="flex items-center gap-2">
      <button
        @click="currentPage > 1 && $emit('update:currentPage', currentPage - 1)"
        :disabled="currentPage === 1"
        :class="[
          'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
          currentPage === 1
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
        ]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ prevLabel }}
      </button>

      <div class="flex items-center gap-1">
        <button
          v-if="paginationPages[0] > 1"
          @click="$emit('update:currentPage', 1)"
          class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
        >
          1
        </button>
        <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400 dark:text-gray-500 text-sm">...</span>

        <button
          v-for="page in paginationPages"
          :key="page"
          @click="$emit('update:currentPage', page)"
          :class="[
            'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
            currentPage === page
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'
          ]"
        >
          {{ page }}
        </button>

        <span
          v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
          class="px-2 text-gray-400 dark:text-gray-500 text-sm"
          >...</span
        >
        <button
          v-if="paginationPages[paginationPages.length - 1] < totalPages"
          @click="$emit('update:currentPage', totalPages)"
          class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
        >
          {{ totalPages }}
        </button>
      </div>

      <button
        @click="currentPage < totalPages && $emit('update:currentPage', currentPage + 1)"
        :disabled="currentPage === totalPages"
        :class="[
          'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
          currentPage === totalPages
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
        ]"
      >
        {{ nextLabel }}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalItems: number;
    perPage: number;
    showingLabel?: string;
    ofLabel?: string;
    dataLabel?: string;
    prevLabel?: string;
    nextLabel?: string;
  }>(),
  {
    showingLabel: 'Menampilkan',
    ofLabel: 'dari',
    dataLabel: 'data',
    prevLabel: 'Sebelumnya',
    nextLabel: 'Selanjutnya',
  }
);

defineEmits<{ 'update:currentPage': [value: number] }>();

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.totalItems / props.perPage))
);

const displayStart = computed(() =>
  props.totalItems === 0 ? 0 : (props.currentPage - 1) * props.perPage + 1
);
const displayEnd = computed(() =>
  Math.min(props.currentPage * props.perPage, props.totalItems)
);

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = props.currentPage;
  const pages: number[] = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else if (current <= 2) {
    pages.push(1, 2, 3, 4, 5);
  } else if (current >= total - 1) {
    pages.push(total - 2, total - 1, total);
  } else {
    pages.push(current - 1, current, current + 1);
  }
  return pages;
});
</script>