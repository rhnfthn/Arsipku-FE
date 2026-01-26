<script setup>
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { computed } from "vue";

// Props
const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  totalItems: { type: Number, required: true },
  rowsPerPage: { type: Number, required: true },
  rowsOptions: { type: Array, default: () => [] },
});

// Emit
const emit = defineEmits(["update:page", "update:rowsPerPage"]);

// --- SOLUSI UTAMA: Writable Computed ---
// Ini menjembatani 'v-model' USelect dengan props 'rowsPerPage'
const selectedRows = computed({
  get() {
    return props.rowsPerPage;
  },
  set(val) {
    // Paksa konversi ke Number karena HTML select mengembalikan String
    emit("update:rowsPerPage", Number(val));
    // Reset halaman ke 1 setiap kali jumlah baris berubah (opsional, UX lebih baik)
    emit("update:page", 1);
  },
});

// Logic Pagination Numbers (Tetap sama)
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

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
});
</script>

<template>
  <div
    class="w-full flex flex-col md:flex-row md:justify-between md:items-center gap-4 mt-4"
  >
    <div
      class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
    >
      <span>Menampilkan</span>

      <USelect
        v-model="selectedRows"
        :options="rowsOptions"
        option-attribute="label"
        value-attribute="value"
        class="w-20"
        size="sm"
      />

      <span
        >dari <span class="font-bold">{{ totalItems }}</span> data</span
      >
    </div>

    <nav class="flex items-center gap-1">
      <UButton
        color="gray"
        variant="ghost"
        size="sm"
        :disabled="currentPage === 1"
        @click="emit('update:page', currentPage - 1)"
      >
        <ChevronLeft class="w-4 h-4" />
        <span class="hidden sm:inline">Prev</span>
      </UButton>

      <template v-for="(p, i) in pageNumbers" :key="i">
        <span v-if="p === '...'" class="px-2 text-gray-400">...</span>
        <UButton
          v-else
          :variant="currentPage === p ? 'solid' : 'ghost'"
          :color="currentPage === p ? 'primary' : 'gray'"
          size="sm"
          class="min-w-[32px] justify-center"
          @click="emit('update:page', p)"
        >
          {{ p }}
        </UButton>
      </template>

      <UButton
        color="gray"
        variant="ghost"
        size="sm"
        :disabled="currentPage === totalPages"
        @click="emit('update:page', currentPage + 1)"
      >
        <span class="hidden sm:inline">Next</span>
        <ChevronRight class="w-4 h-4" />
      </UButton>
    </nav>
  </div>
</template>
