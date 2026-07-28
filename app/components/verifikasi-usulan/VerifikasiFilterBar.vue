<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
        <select
          :value="modelValue.status"
          @change="updateField('status', ($event.target as HTMLSelectElement).value)"
          class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
        >
          <option value="">Semua</option>
          <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Dari Tanggal</label>
        <input
          :value="modelValue.startDate"
          @input="updateField('startDate', ($event.target as HTMLInputElement).value)"
          type="date"
          class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pencarian</label>
        <div class="relative">
          <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            :value="modelValue.search"
            @input="updateField('search', ($event.target as HTMLInputElement).value)"
            @keydown.enter="$emit('apply')"
            type="text"
            placeholder="Cari nomor, perihal, sekretaris..."
            class="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
          />
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="$emit('apply')" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors">Tampilkan</button>
        <button @click="$emit('reset')" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Reset</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VerifikasiFilter, VerifikasiStatus } from '~/types/verifikasi-usulan';

const props = defineProps<{ modelValue: VerifikasiFilter }>();
const emit = defineEmits<{ 'update:modelValue': [v: VerifikasiFilter]; apply: []; reset: [] }>();

const statusOptions: { value: VerifikasiStatus; label: string }[] = [
  { value: 'MENUNGGU_VERIFIKASI_ATASAN', label: 'Menunggu Verifikasi' },
  { value: 'DISETUJUI_ATASAN', label: 'Disetujui Atasan' },
  { value: 'MENUNGGU_VERIFIKASI_TERAKHIR', label: 'Menunggu Verifikasi Terakhir' },
  { value: 'DISETUJUI_VERIFIKASI_TERAKHIR', label: 'Disetujui Verifikasi Terakhir' },
  { value: 'DITOLAK_ATASAN', label: 'Ditolak' },
  { value: 'DIKIRIM', label: 'Dikirim' },
  { value: 'SELESAI', label: 'Selesai' },
];

const updateField = (field: keyof VerifikasiFilter, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
};
</script>