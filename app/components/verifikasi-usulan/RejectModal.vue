<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" @click="close"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] max-w-[560px] overflow-hidden z-[10000]">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tolak Usulan</h3>
          <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Berikan alasan penolakan agar Sekretaris dapat memperbaiki usulan.
          </p>
          <textarea
            v-model="alasan"
            rows="4"
            placeholder="Isi alasan penolakan..."
            class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-red-500 resize-none"
          ></textarea>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button @click="close" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
          <button @click="confirmReject" :disabled="!alasan.trim()" class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors">
            Tolak Usulan
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; confirm: [alasan: string] }>();

const alasan = ref('');

const close = () => emit('update:modelValue', false);

const confirmReject = () => {
  if (!alasan.value.trim()) return;
  emit('confirm', alasan.value.trim());
  alasan.value = '';
  close();
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) alasan.value = '';
  },
);
</script>