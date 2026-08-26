<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" @click="close"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] max-w-[560px] overflow-hidden z-[10000]">
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

          <!-- Catatan Verifikasi (opsional) -->
          <div class="mt-4">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan Verifikasi</label>
            <textarea
              v-model="catatan"
              rows="3"
              placeholder="Catatan verifikasi (opsional)..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none"
            ></textarea>
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
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { VerifikasiUsulanItem } from '~/types/verifikasi-usulan';

const props = defineProps<{
  modelValue: boolean;
  usulan: VerifikasiUsulanItem | null;
  title?: string;
  confirmLabel?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  confirm: [catatan: string];
}>();

const title = props.title ?? 'Konfirmasi Verifikasi';
const confirmLabel = props.confirmLabel ?? 'Setujui Verifikasi';
const catatan = ref('');

const close = () => emit('update:modelValue', false);
const confirm = () => {
  emit('confirm', catatan.value.trim());
  catatan.value = '';
  close();
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) catatan.value = '';
  },
);
</script>