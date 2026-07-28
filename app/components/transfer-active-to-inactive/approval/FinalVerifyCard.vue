<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
    <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">Verifikasi Terakhir</h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Usulan telah disetujui dalam verifikasi awal. Lakukan verifikasi terakhir sebelum usulan diserahkan ke Sekretaris untuk proses lebih lanjut.
    </p>

    <div class="space-y-2 mb-4">
      <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Checklist Verifikasi Terakhir:</p>
      <label v-for="c in checklistItems" :key="c.key" class="flex items-center gap-2 cursor-pointer">
        <input v-model="checklist[c.key]" type="checkbox" class="w-4 h-4 text-[#457fb6] border-gray-300 rounded focus:ring-[#457fb6]" />
        <span class="text-sm text-gray-700 dark:text-gray-300">{{ c.label }}</span>
      </label>
    </div>

    <div class="mb-4">
      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan Verifikasi Terakhir</label>
      <textarea v-model="form.catatanVerifikasi" rows="3" placeholder="Catatan verifikasi terakhir (opsional)..." class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none"></textarea>
    </div>

    <div class="flex justify-end gap-2">
      <button @click="$emit('reject')" class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">
        <UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" /> Tolak
      </button>
      <button @click="onFinalApprove" :disabled="!allChecked || submitting" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 transition-colors">
        <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
        <UIcon v-else name="i-lucide-check" class="w-4 h-4 mr-1 inline" /> Setujui Verifikasi Terakhir
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';

const props = defineProps<{ submitting?: boolean }>();
const emit = defineEmits<{ approve: [catatan: string]; reject: [] }>();

const checklistItems = [
  { key: 'sudahDicek', label: 'Semua berkas dan data sudah dicek' },
  { key: 'beritaAcaraSiap', label: 'Berita Acara Serah Terima sudah siap' },
];

const checklist = reactive<Record<string, boolean>>({
  sudahDicek: false,
  beritaAcaraSiap: false,
});

const form = reactive({ catatanVerifikasi: '' });

const allChecked = computed(() => Object.values(checklist).every(Boolean));

const onFinalApprove = () => {
  if (!allChecked.value) return;
  emit('approve', form.catatanVerifikasi);
};
</script>