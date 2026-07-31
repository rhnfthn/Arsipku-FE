<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" @click="close"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] max-w-[480px] overflow-hidden z-[10000]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Kirim ke TU</h3>
          <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>
        <!-- Body -->
        <div class="p-6">
          <!-- Card konfirmasi -->
          <div class="bg-[#457fb6]/5 dark:bg-[#457fb6]/10 border border-[#457fb6]/20 dark:border-[#457fb6]/30 rounded-lg p-4 mb-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-help-circle" class="w-5 h-5 text-[#457fb6] mt-0.5 shrink-0" />
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100">
                Apakah Anda yakin dan setuju untuk mengirimkannya ke TU?
              </p>
            </div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Pastikan Berkas Fisik dan Berita Acara Serah Terima sudah disiapkan sebelumnya.
          </p>
          <div class="space-y-3 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div>
              <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
              <p class="text-gray-900 dark:text-white font-medium">{{ usulan?.nomorUsulan ?? '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400 text-xs">Sekretaris</span>
              <p class="text-gray-900 dark:text-white font-medium">{{ usulan?.sekretarisName ?? '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
              <p class="text-gray-900 dark:text-white font-medium">{{ usulan?.atasanName ?? '-' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400 text-xs">Jumlah Arsip</span>
              <p class="text-gray-900 dark:text-white font-medium">{{ jumlahArsip }} berkas</p>
            </div>
          </div>
        </div>
        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button @click="close" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Batal
          </button>
          <button @click="confirm" :disabled="loading" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 transition-colors">
            <UIcon v-if="loading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
            Pindah Usulan
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VerifikasiUsulanItem } from '~/types/verifikasi-usulan';

const props = defineProps<{
  modelValue: boolean;
  usulan: VerifikasiUsulanItem | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  confirm: [];
}>();

const jumlahArsip = computed(() => {
  // Jumlah arsip dari totalApprovalLevels atau default 1
  return props.usulan?.totalApprovalLevels ?? 1;
});

const close = () => emit('update:modelValue', false);
const confirm = () => emit('confirm');
</script>