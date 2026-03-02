<template>
  <UModal :model-value="open" @update:model-value="$emit('update:open', $event)" :dismissible="false">
    <div class="px-4 pb-4 pt-3 border-t border-gray-100">
      <UFormGroup label="Passphrase" required>
        <UInput type="password" v-model="localPassphrase" size="lg" placeholder="Masukkan passphrase TTE Anda"
          class="w-full" autofocus />
      </UFormGroup>
    </div>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Batal" color="secondary" variant="ghost" @click="$emit('update:open', false)" />
        <UButton label="Lanjutkan" color="primary" icon="i-heroicons-paper-airplane" :loading="isLoading"
          @click="handleSubmit" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  signerInfo: { name: string; role: string; label: string };
  isLoading: boolean;
}>();

const emit = defineEmits(['update:open', 'submit']);
const localPassphrase = ref('');

watch(() => props.open, (newVal) => {
  if (newVal) localPassphrase.value = '';
});

const handleSubmit = () => {
  emit('submit', localPassphrase.value);
};
</script>
