<script setup lang="ts">
import { ref, watch } from 'vue';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';

const props = defineProps<{
  shareId: string;
  recipientId: string;
  recipientName?: string;
  naskahPerihal?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'revoked'): void;
}>();

const { revokeRecipient } = useNaskahShare();

const isOpen = ref(true);
const isLoading = ref(false);
const errorMsg = ref('');
const reason = ref('');

const handleRevoke = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    await revokeRecipient(props.shareId, props.recipientId, reason.value || undefined);
    emit('revoked');
    isOpen.value = false;
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || err?.message || 'Gagal mengakhiri akses';
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
            Akhiri Akses
          </Heading>
        </div>
      </template>

      <div class="p-1 mt-1">
        <div class="space-y-4">
          <!-- Info Naskah -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">
              Naskah
            </Heading>
            <div class="mt-2 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md text-sm">
              <p class="font-medium text-gray-900 dark:text-white">{{ naskahPerihal || '(Tanpa perihal)' }}</p>
            </div>
          </div>

          <!-- Info Penerima -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">
              Penerima
            </Heading>
            <div class="mt-2 w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-md text-sm">
              <p class="font-medium text-gray-900 dark:text-white">{{ recipientName || '-' }}</p>
              <p class="text-xs text-red-600 dark:text-red-400 mt-1">Penerima ini tidak akan bisa membuka naskah lagi.</p>
            </div>
          </div>

          <!-- Alasan -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">
              Alasan <span class="text-gray-400 font-normal">(opsional)</span>
            </Heading>
            <textarea
              v-model="reason"
              placeholder="Berikan alasan pengakhiran akses..."
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mt-2 resize-none"
              rows="2"
            />
          </div>

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
          @click="handleRevoke"
          :disabled="isLoading"
          class="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Menyimpan...' : 'Akhiri Akses' }}
        </button>
      </div>
    </Modal>
  </Teleport>
</template>
