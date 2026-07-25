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
        <div class="mt-5 ml-5 mb-3">
          <Heading variant="heading9b" class="font-bold text-sm dark:text-white">
            Buka Naskah
          </Heading>
        </div>
      </template>

      <div class="p-1 mt-1">
        <div class="space-y-4">
          <!-- Info Naskah -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">
              Naskah yang Dibagikan
            </Heading>
            <div class="mt-2 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md text-sm">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ naskahPerihal || '(Tanpa perihal)' }}
              </p>
              <p v-if="naskahNomor" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                {{ naskahNomor }}
              </p>
            </div>
          </div>

          <!-- Info Pemberi -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">
              Dibagikan Oleh
            </Heading>
            <p class="mt-2 text-sm text-gray-900 dark:text-white">
              <span class="font-medium">{{ pemberiNama }}</span>
            </p>
          </div>

          <!-- Konfirmasi -->
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Anda akan membuka naskah ini. Apakah Anda yakin ingin melanjutkan?
          </p>

          <!-- Error -->
          <div v-if="errorMsg" class="text-xs text-red-500 flex items-center gap-1">
            {{ errorMsg }}
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex justify-between gap-3 px-0 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="handleClose"
          :disabled="isLoading"
          class="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          @click="handleOpen"
          :disabled="isLoading"
          class="flex-1 px-6 py-2 bg-primary dark:bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 dark:hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Menyimpan...' : 'Buka Naskah' }}
        </button>
      </div>
    </Modal>
  </Teleport>
</template>
