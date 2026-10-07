<script setup>
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { computed } from "vue";

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  totalItems: { type: Number, required: true },
  rowsPerPage: { type: Number, required: true },
  rowsOptions: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:page", "update:rowsPerPage"]);

const selectedRows = computed({
  get() {
    return props.rowsPerPage;
  },
  set(val) {
    emit("update:rowsPerPage", Number(val));
    emit("update:page", 1);
  },
});

const pageNumbers = computed(() => {
  const current = props.currentPage;
  const total = props.totalPages;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  if (current > 3) pages.push("...");

  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);

  if (current <= 3) end = 4;
  if (current >= total - 2) start = total - 3;

  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
});

// Displayed count
const displayedCount = computed(() => {
  if (props.totalItems === 0) return { start: 0, end: 0 };
  const start = (props.currentPage - 1) * props.rowsPerPage + 1;
  const end = Math.min(props.currentPage * props.rowsPerPage, props.totalItems);
  return { start, end };
});
</script>

<template>
  <div
    class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
  >
    <!-- LEFT: rows per page + info -->
    <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
      <!-- ROWS PER PAGE dropdown -->
      <div v-if="rowsOptions.length > 0" class="relative">
        <USelectMenu
          v-model="selectedRows"
          :items="rowsOptions"
          :search-input="false"
          class="w-16"
          :ui="{
            base: 'h-8 w-full bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200',
          }"
          aria-label="Jumlah data per halaman"
        />
      </div>
      <span>
        Menampilkan {{ displayedCount.start }}–{{ displayedCount.end }} dari
        <span class="font-semibold">{{ totalItems }}</span> data
      </span>
      <!-- Slot opsional: badge tambahan di samping info "Menampilkan ..." -->
      <slot name="info" />
    </div>

    <!-- RIGHT: pagination -->
    <div class="flex items-center gap-2">
      <!-- PREV -->
      <button
        @click="emit('update:page', currentPage - 1)"
        :disabled="currentPage === 1"
        :class="[
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
          currentPage === 1
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600',
        ]"
      >
        <ChevronLeft class="w-4 h-4" />
        Sebelumnya
      </button>

      <!-- PAGE NUMBERS -->
      <div class="flex items-center gap-1">
        <template v-for="(p, i) in pageNumbers" :key="i">
          <span
            v-if="p === '...'"
            class="px-2 text-gray-400 dark:text-gray-500 text-sm"
          >
            ...
          </span>
          <button
            v-else
            @click="emit('update:page', p)"
            :class="[
              'w-8 h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
              currentPage === p
                ? 'bg-primary dark:bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400',
            ]"
          >
            {{ p }}
          </button>
        </template>
      </div>

      <!-- NEXT -->
      <button
        @click="emit('update:page', currentPage + 1)"
        :disabled="currentPage === totalPages"
        :class="[
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
          currentPage === totalPages
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600',
        ]"
      >
        Selanjutnya
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
