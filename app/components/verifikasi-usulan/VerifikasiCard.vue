<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
    <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Verifikasi Usulan</h3>

    <div class="space-y-2 mb-4 text-sm">
      <p><span class="text-gray-500 dark:text-gray-400">Sekretaris:</span> <span class="font-medium text-gray-900 dark:text-white">{{ usulan.sekretarisName }}</span></p>
      <p><span class="text-gray-500 dark:text-gray-400">Arsip:</span> <span class="font-medium text-gray-900 dark:text-white">{{ usulan.arsipPerihal }}</span></p>
    </div>

    <div class="mb-4">
      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan Verifikasi</label>
      <textarea v-model="form.catatanVerifikasi" rows="3" placeholder="Catatan verifikasi (opsional)..." class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none"></textarea>
    </div>

    <div class="flex justify-end gap-2">
      <button @click="$emit('reject')" class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">
        <UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" /> Tolak
      </button>
      <button @click="onApprove" :disabled="submitting" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 transition-colors">
        <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
        <UIcon v-else name="i-lucide-check" class="w-4 h-4 mr-1 inline" /> Setujui
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { VerifikasiUsulanItem } from '~/types/verifikasi-usulan';

const props = defineProps<{ usulan: VerifikasiUsulanItem; submitting?: boolean }>();
const emit = defineEmits<{ approve: [catatan: string]; reject: [] }>();

const form = reactive({ catatanVerifikasi: '' });

const onApprove = () => {
  emit('approve', form.catatanVerifikasi);
};
</script>