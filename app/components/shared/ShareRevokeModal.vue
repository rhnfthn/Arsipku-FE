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
const { t } = useI18n();

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
    errorMsg.value = err?.response?.data?.message || err?.message || t('share_gagal_akhiri');
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
    <Modal v-model="isOpen" :hideDefaultFooter="true" size="md" z-index="var(--z-confirm)">
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
          {{ t('share_revoke_title') }}
        </Heading>
      </template>

      <div class="space-y-1 p-1">
        <!-- Naskah -->
        <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
          <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
            {{ t('share_naskah') }}
          </span>
          <div class="flex-1">
            <div class="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-lg text-sm">
              <p class="font-medium text-gray-900 dark:text-white">{{ naskahPerihal || t('share_tanpa_perihal') }}</p>
            </div>
          </div>
        </div>

        <!-- Penerima -->
        <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
          <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
            {{ t('share_penerima') }}
          </span>
          <div class="flex-1">
            <div class="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg text-sm">
              <p class="font-medium text-gray-900 dark:text-white">{{ recipientName || '-' }}</p>
              <p class="text-xs text-red-600 dark:text-red-400 mt-1">{{ t('share_revoke_warning') }}</p>
            </div>
          </div>
        </div>

        <!-- Alasan -->
        <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
          <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
            {{ t('share_alasan') }}
            <span class="text-xs font-normal text-gray-400">{{ t('share_opsional') }}</span>
          </span>
          <div class="flex-1">
            <textarea
              v-model="reason"
              rows="3"
              maxlength="2000"
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              :placeholder="t('share_alasan_placeholder')"
            />
          </div>
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
          {{ t('share_batal') }}
        </button>
        <button
          class="flex-1 px-6 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 hover:opacity-90 dark:hover:opacity-90"
          style="background-color: #DC2626"
          :disabled="isLoading"
          @click="handleRevoke"
        >
          {{ isLoading ? t('share_memproses') : t('share_akhiri_akses') }}
        </button>
      </div>
    </Modal>
  </Teleport>
</template>
