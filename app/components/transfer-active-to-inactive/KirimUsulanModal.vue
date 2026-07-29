<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" @click="close"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] max-w-[480px] overflow-hidden z-[10000]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Kirim Usulan ke Atasan Managerial</h3>
          <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>
        <!-- Body -->
        <div class="p-6">
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Apakah Anda yakin ingin mengirim usulan ini ke Atasan Managerial?
          </p>
          <div class="space-y-3 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div v-if="nomorUsulan">
              <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
              <p class="text-gray-900 dark:text-white font-medium">{{ nomorUsulan }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
              <p class="text-gray-900 dark:text-white font-medium">{{ atasanNames }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400 text-xs">Arsip ({{ jumlahArsip }})</span>
              <p class="text-gray-900 dark:text-white font-medium">{{ arsipLabels }}</p>
            </div>
          </div>
        </div>
        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button @click="close" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Batal
          </button>
          <button @click="confirm" :disabled="loading" class="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-colors">
            <UIcon v-if="loading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
            Kirim
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  nomorUsulan?: string;
  atasanList: Array<{ name: string }>;
  arsipList: Array<{ kodeBerkas: string | null; judulBerkas: string }>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  confirm: [];
}>();

const atasanNames = computed(() => props.atasanList.map(a => a.name).join(', ') || '-');
const jumlahArsip = computed(() => props.arsipList.length);
const arsipLabels = computed(() => props.arsipList.map(a => `${a.kodeBerkas ?? '-'} — ${a.judulBerkas}`).join(', ') || '-');

const close = () => emit('update:modelValue', false);
const confirm = () => emit('confirm');
</script>