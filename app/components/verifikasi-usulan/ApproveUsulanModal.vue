<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 transition-opacity" @click="close"></div>
    <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-[480px] overflow-hidden z-10">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
        <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <UIcon name="i-lucide-x" class="w-5 h-5" />
        </button>
      </div>
      <!-- Body -->
      <div class="p-6">
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Apakah Anda yakin ingin menyetujui verifikasi usulan ini?
        </p>
        <div class="space-y-2 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ usulan?.nomorUsulan ?? '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Sekretaris</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ usulan?.sekretarisName ?? '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Arsip</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ usulan?.arsipPerihal ?? '-' }}</p>
          </div>
        </div>
      </div>
      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        <button @click="close" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Batal
        </button>
        <button @click="confirm" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VerifikasiUsulanItem } from '~/types/verifikasi-usulan';

const props = defineProps<{
  modelValue: boolean;
  usulan: VerifikasiUsulanItem | null;
  title?: string;
  confirmLabel?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  confirm: [];
}>();

const title = props.title ?? 'Konfirmasi Verifikasi';
const confirmLabel = props.confirmLabel ?? 'Setujui Verifikasi';

const close = () => emit('update:modelValue', false);
const confirm = () => {
  emit('confirm');
  close();
};
</script>