<script setup lang="ts">
import { ref, watch } from 'vue';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';

const props = defineProps<{
  shareId: string;
  naskahPerihal?: string;
  naskahNomor?: string;
  pemberiNama?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'opened', naskahId: string): void;
}>();

const { openNaskah } = useNaskahShare();

const isOpen = ref(true);
const isLoading = ref(false);
const errorMsg = ref('');

const handleOpen = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const res = await openNaskah(props.shareId);
    emit('opened', res.data.naskahId);
    isOpen.value = false;
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || err?.message || 'Gagal membuka naskah';
  } finally {
    isLoading.value = false;
  }
};

const handleClose = () => {
  isOpen.value = false;
  emit('close');
};

watch(isOpen, (val) => {
  if (!val) handleClose();
});
</script>

<template>
  <Teleport to="body">
    <Modal v-model="isOpen" :hideDefaultFooter="true" size="md">
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
          Buka Naskah
        </Heading>
      </template>

      <div class="space-y-1 p-1">
        <!-- Naskah -->
        <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
          <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
            Naskah yang Dibagikan
          </span>
          <div class="flex-1">
            <div class="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-lg text-sm">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ naskahPerihal || '(Tanpa perihal)' }}
              </p>
              <p v-if="naskahNomor" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                {{ naskahNomor }}
              </p>
            </div>
          </div>
        </div>

        <!-- Dibagikan Oleh -->
        <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-center sm:gap-0">
          <span class="w-full shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
            Dibagikan Oleh
          </span>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ pemberiNama }}</p>
          </div>
        </div>

        <!-- Konfirmasi -->
        <div class="py-2">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Anda akan membuka naskah ini. Apakah Anda yakin ingin melanjutkan?
          </p>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="text-xs text-red-500 flex items-center gap-1 py-2">
          {{ errorMsg }}
        </div>
      </div>

      <!-- Footer -->
      <div class="flex gap-3 px-6 pb-6 pt-2">
        <button
          class="flex-1 px-6 py-2 text-sm font-medium border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-900 dark:text-white disabled:opacity-50"
          :disabled="isLoading"
          @click="handleClose"
        >
          Batal
        </button>
        <button
          class="flex-1 px-6 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 hover:opacity-90 dark:hover:opacity-90"
          style="background-color: #175FA4"
          :disabled="isLoading"
          @click="handleOpen"
        >
          {{ isLoading ? 'Memproses...' : 'Buka Naskah' }}
        </button>
      </div>
    </Modal>
  </Teleport>
</template>
