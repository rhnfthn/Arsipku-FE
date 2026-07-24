<script setup lang="ts">
import { ref, watch } from 'vue';

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
    errorMsg.value = err?.response?.data?.message || err?.message || 'Gagal mencabut akses';
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
  <UModal
    v-model:open="isOpen"
    title="Cabut Akses"
    description="Konfirmasi untuk mencabut akses share naskah"
    :ui="{ width: 'w-full sm:max-w-md' }"
    @close="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-shield-off" class="text-red-500 w-5 h-5" />
        <h3 class="text-lg font-semibold">Cabut Akses Share</h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4 p-1">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-sm font-medium text-red-800 dark:text-red-300">
            Anda akan mencabut akses
            <span v-if="recipientName" class="font-bold">{{ recipientName }}</span>
            dari naskah ini.
          </p>
          <p class="text-sm text-red-600 dark:text-red-400 mt-1">
            Penerima ini tidak akan bisa membuka naskah lagi.
          </p>
        </div>

        <div v-if="naskahPerihal" class="text-sm text-neutral-600 dark:text-neutral-400">
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Naskah</p>
          <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ naskahPerihal }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Alasan pencabutan <span class="text-neutral-400 font-normal">(opsional)</span>
          </label>
          <UTextarea
            v-model="reason"
            placeholder="Berikan alasan pencabutan akses..."
            :rows="2"
            resize
          />
        </div>

        <UAlert
          v-if="errorMsg"
          color="red"
          variant="soft"
          :description="errorMsg"
          icon="i-lucide-alert-circle"
          @close="errorMsg = ''"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Batal"
          variant="outline"
          color="neutral"
          @click="handleClose"
        />
        <UButton
          label="Cabut Akses"
          icon="i-lucide-shield-off"
          color="red"
          :loading="isLoading"
          @click="handleRevoke"
        />
      </div>
    </template>
  </UModal>
</template>
