<script setup lang="ts">
import { ref, watch } from 'vue';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';

const props = defineProps<{
  shareId: string;
  naskahPerihal?: string;
  recipientName?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'approved'): void;
}>();

const { approveReopen } = useNaskahShare();

const isOpen = ref(true);
const isLoading = ref(false);
const errorMsg = ref('');
const accessType = ref<'SEKALI_LIHAT' | 'RENTANG_WAKTU'>('RENTANG_WAKTU');
const durationDays = ref(7);
const catatan = ref('');

const durationOptions = [
  { label: '2 hari', value: 2 },
  { label: '7 hari', value: 7 },
  { label: '14 hari', value: 14 },
  { label: '30 hari', value: 30 },
];

const handleApprove = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    await approveReopen(
      props.shareId,
      accessType.value,
      accessType.value === 'RENTANG_WAKTU' ? durationDays.value : undefined,
      catatan.value || undefined,
    );
    useToast().add({
      title: 'Berhasil',
      description: 'Akses ulang berhasil disetujui',
      color: 'success',
    });
    emit('approved');
    isOpen.value = false;
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || err?.message || 'Gagal menyetujui akses ulang';
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
            Setujui Akses Ulang
          </Heading>
        </div>
      </template>

      <div class="p-1 mt-1">
        <div class="space-y-4">
          <!-- Info Naskah -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">Naskah</Heading>
            <div class="mt-2 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md text-sm">
              <p class="font-medium text-gray-900 dark:text-white">{{ naskahPerihal || '(Tanpa perihal)' }}</p>
            </div>
          </div>

          <!-- Info Penerima -->
          <div v-if="recipientName">
            <Heading variant="body2m" class="dark:text-gray-200">Penerima</Heading>
            <p class="mt-2 text-sm text-gray-900 dark:text-white font-medium">{{ recipientName }}</p>
          </div>

          <!-- Jenis Akses -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">Jenis Akses <span class="text-red-500">*</span></Heading>
            <div class="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                class="border px-3 py-2 rounded-md text-sm transition flex items-center justify-center gap-2"
                :class="accessType === 'SEKALI_LIHAT'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-500'"
                @click="accessType = 'SEKALI_LIHAT'"
              >
                <UIcon name="i-lucide-eye" class="w-4 h-4" />
                <span class="font-medium">Sekali Lihat</span>
              </button>
              <button
                type="button"
                class="border px-3 py-2 rounded-md text-sm transition flex items-center justify-center gap-2"
                :class="accessType === 'RENTANG_WAKTU'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-500'"
                @click="accessType = 'RENTANG_WAKTU'"
              >
                <UIcon name="i-lucide-calendar" class="w-4 h-4" />
                <span class="font-medium">Rentang Waktu</span>
              </button>
            </div>

            <!-- Duration picker -->
            <div v-if="accessType === 'RENTANG_WAKTU'" class="mt-3">
              <Heading variant="body2m" class="dark:text-gray-200">Durasi Akses</Heading>
              <div class="flex gap-2 mt-2">
                <button
                  v-for="opt in durationOptions"
                  :key="opt.value"
                  type="button"
                  class="px-4 py-2 text-xs font-medium rounded-md border transition"
                  :class="durationDays === opt.value
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-500'"
                  @click="durationDays = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Catatan -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">Catatan <span class="text-gray-400 font-normal">(opsional)</span></Heading>
            <textarea
              v-model="catatan"
              placeholder="Tambahkan catatan untuk penerima..."
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mt-2 resize-none"
              rows="2"
            />
          </div>

          <!-- Error -->
          <div v-if="errorMsg" class="text-xs text-red-500 flex items-center gap-1">{{ errorMsg }}</div>
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
          @click="handleApprove"
          :disabled="isLoading"
          class="flex-1 px-6 py-2 bg-primary dark:bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 dark:hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Menyimpan...' : 'Setujui' }}
        </button>
      </div>
    </Modal>
  </Teleport>
</template>
