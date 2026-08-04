<template>
  <div class="flex flex-wrap items-center gap-3 mb-4">
    <!-- Items per page (custom dropdown) -->
    <div ref="pageSizeRef" class="relative shrink-0 z-30">
      <button
        @click="pageSizeOpen = !pageSizeOpen"
        class="h-10 w-[80px] px-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
      >
        <span>{{ modelValue.limit }}</span>
        <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400" :class="{ 'rotate-180': pageSizeOpen }" />
      </button>
      <div
        v-if="pageSizeOpen"
        class="absolute top-full left-0 mt-1.5 z-50 min-w-[80px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
      >
        <button
          v-for="size in [10, 30, 50]"
          :key="size"
          @click="updateField('limit', size); updateField('page', 1); pageSizeOpen = false; $emit('apply')"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          :class="modelValue.limit === size ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
        >
          {{ size }}
        </button>
      </div>
    </div>
    <!-- Search -->
    <div class="relative flex-1 min-w-[200px]">
      <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        :value="modelValue.search"
        @input="updateField('search', ($event.target as HTMLInputElement).value)"
        @keydown.enter="$emit('apply')"
        type="text"
        placeholder="Cari nomor, perihal, sekretaris..."
        class="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
      />
    </div>
    <!-- Status Filter (custom dropdown) -->
    <div ref="statusRef" class="relative shrink-0 z-30">
      <button
        @click="statusOpen = !statusOpen"
        class="h-10 w-[180px] px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
      >
        <span class="truncate">{{ statusOptions.find(o => o.value === modelValue.status)?.label ?? 'Semua Status' }}</span>
        <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" :class="{ 'rotate-180': statusOpen }" />
      </button>
      <div
        v-if="statusOpen"
        class="absolute top-full left-0 mt-1.5 z-50 min-w-[180px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden max-h-[300px] overflow-y-auto"
      >
        <button
          @click="updateField('status', ''); statusOpen = false; $emit('apply')"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
          :class="modelValue.status === '' ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
        >
          Semua Status
        </button>
        <button
          v-for="opt in statusOptions"
          :key="opt.value"
          @click="updateField('status', opt.value); statusOpen = false; $emit('apply')"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
          :class="modelValue.status === opt.value ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
    <!-- Export -->
    <button
      @click="$emit('export')"
      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap shrink-0"
    >
      <UIcon name="i-lucide-download" class="w-4 h-4" /> Export
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { VerifikasiFilter, VerifikasiStatus } from '~/types/verifikasi-usulan';

const props = defineProps<{ modelValue: VerifikasiFilter }>();
const emit = defineEmits<{ 'update:modelValue': [v: VerifikasiFilter]; apply: []; export: [] }>();

const pageSizeOpen = ref(false);
const pageSizeRef = ref<HTMLElement | null>(null);
const statusOpen = ref(false);
const statusRef = ref<HTMLElement | null>(null);

const statusOptions: { value: VerifikasiStatus; label: string }[] = [
  { value: 'MENUNGGU_VERIFIKASI_ATASAN', label: 'Menunggu Persetujuan' },
  { value: 'DISETUJUI_ATASAN', label: 'Menunggu Verifikasi (Level Berikutnya)' },
  { value: 'MENUNGGU_VERIFIKASI_TERAKHIR', label: 'Menunggu Verifikasi' },
  { value: 'DIKIRIM', label: 'Menunggu Penerimaan' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DITOLAK_ATASAN', label: 'Ditolak' },
];

const updateField = (field: keyof VerifikasiFilter, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const onClickOutside = (e: MouseEvent) => {
  if (pageSizeRef.value && !pageSizeRef.value.contains(e.target as Node)) {
    pageSizeOpen.value = false;
  }
  if (statusRef.value && !statusRef.value.contains(e.target as Node)) {
    statusOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>