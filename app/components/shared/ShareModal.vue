<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  naskahId: string;
  naskahPerihal?: string;
  naskahNomor?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'shared'): void;
}>();

const { createShare, searchUsers, searchResults, searchPending, clearSearchResults } = useNaskahShare();

const isOpen = ref(true);
const catatan = ref('');
const selectedRecipients = ref<Array<{ id: string; nama: string; positionText: string; organizationText: string }>>([]);
const searchQuery = ref('');
const isSubmitting = ref(false);
const errorMsg = ref('');

// Access type state
const accessType = ref<'RENTANG_WAKTU' | 'SEKALI_LIHAT'>('RENTANG_WAKTU');
const durationDays = ref(7);

const durationOptions = [
  { label: '2 hari', value: 2 },
  { label: '7 hari', value: 7 },
  { label: '14 hari', value: 14 },
  { label: '30 hari', value: 30 },
];

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Debounced search
watch(searchQuery, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (!val || val.length < 2) {
    clearSearchResults();
    return;
  }
  searchTimeout = setTimeout(() => {
    searchUsers(val);
  }, 300);
});

const filteredResults = computed(() => {
  const selectedIds = selectedRecipients.value.map((r) => r.id);
  return searchResults.value.filter((r) => !selectedIds.includes(r.id));
});

const addRecipient = (recipient: any) => {
  if (!selectedRecipients.value.find((r) => r.id === recipient.id)) {
    selectedRecipients.value.push(recipient);
  }
  searchQuery.value = '';
  clearSearchResults();
};

const removeRecipient = (id: string) => {
  selectedRecipients.value = selectedRecipients.value.filter((r) => r.id !== id);
};

const handleSubmit = async () => {
  if (!props.naskahId) {
    errorMsg.value = 'ID Naskah tidak valid';
    console.error('[ShareModal] naskahId is empty or undefined');
    return;
  }

  if (selectedRecipients.value.length === 0) {
    errorMsg.value = 'Pilih minimal 1 penerima';
    return;
  }

  isSubmitting.value = true;
  errorMsg.value = '';

  try {
    console.log('[ShareModal] Submitting share:', {
      naskahId: props.naskahId,
      recipientIds: selectedRecipients.value.map((r) => r.id),
      catatan: catatan.value || undefined,
      accessType: accessType.value,
      durationDays: accessType.value === 'RENTANG_WAKTU' ? durationDays.value : undefined,
    });
    await createShare(
      props.naskahId,
      selectedRecipients.value.map((r) => r.id),
      catatan.value || undefined,
      accessType.value,
      accessType.value === 'RENTANG_WAKTU' ? durationDays.value : undefined,
    );
    useToast().add({
      title: 'Berhasil',
      description: `Naskah berhasil dibagikan ke ${selectedRecipients.value.length} penerima`,
      color: 'success',
    });
    emit('shared');
    isOpen.value = false;
  } catch (err: any) {
    const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
    console.error('[ShareModal] createShare error:', err?.response?.data || err);
    errorMsg.value = serverMsg || err?.message || 'Gagal membagikan naskah';
  } finally {
    isSubmitting.value = false;
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
    title="Bagikan Naskah"
    description="Bagikan naskah ke penerima yang dipilih"
    :ui="{ width: 'w-full sm:max-w-lg' }"
    @close="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-arrow-top-right-on-square" class="text-primary-500 w-5 h-5" />
        <h3 class="text-lg font-semibold">Bagikan Naskah</h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4 p-1">
        <!-- Info Naskah -->
        <div class="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
          <p class="text-xs text-neutral-500 dark:text-neutral-400">Naskah</p>
          <p class="text-sm font-medium text-neutral-900 dark:text-white">
            {{ naskahPerihal || '(Tanpa perihal)' }}
          </p>
          <p v-if="naskahNomor" class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {{ naskahNomor }}
          </p>
        </div>

        <!-- Jenis Akses -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Jenis Akses
          </label>
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm transition-all"
              :class="accessType === 'SEKALI_LIHAT'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-700'"
              @click="accessType = 'SEKALI_LIHAT'"
            >
              <UIcon name="i-lucide-eye" class="w-4 h-4" />
              <span class="font-medium">Sekali Lihat</span>
            </button>
            <button
              type="button"
              class="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm transition-all"
              :class="accessType === 'RENTANG_WAKTU'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-700'"
              @click="accessType = 'RENTANG_WAKTU'"
            >
              <UIcon name="i-lucide-calendar" class="w-4 h-4" />
              <span class="font-medium">Rentang Waktu</span>
            </button>
          </div>
          <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
            <template v-if="accessType === 'SEKALI_LIHAT'">
              Penerima hanya dapat membuka naskah satu kali. Setelah ditutup, akses ditutup permanen.
            </template>
            <template v-else>
              Penerima dapat membuka naskah selama rentang waktu yang dipilih.
            </template>
          </p>

          <!-- Duration picker (only for RENTANG_WAKTU) -->
          <div v-if="accessType === 'RENTANG_WAKTU'" class="mt-3">
            <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Durasi Akses
            </label>
            <div class="flex gap-2">
              <button
                v-for="opt in durationOptions"
                :key="opt.value"
                type="button"
                class="px-3 py-1.5 text-xs font-medium rounded-full border transition-all"
                :class="durationDays === opt.value
                  ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-primary-300'"
                @click="durationDays = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Search Penerima -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Penerima
          </label>
          <UInput
            v-model="searchQuery"
            placeholder="Ketik nama atau persnum..."
            icon="i-lucide-search"
            :loading="searchPending"
          />

          <!-- Search Results Dropdown -->
          <div
            v-if="filteredResults.length > 0"
            class="mt-1 border border-neutral-200 dark:border-neutral-700 rounded-lg max-h-48 overflow-y-auto bg-white dark:bg-neutral-900 shadow-lg"
          >
            <button
              v-for="user in filteredResults"
              :key="user.id"
              class="w-full flex items-start gap-3 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors"
              @click="addRecipient(user)"
            >
              <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {{ user.nama?.charAt(0)?.toUpperCase() }}
                </span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-neutral-900 dark:text-white truncate">{{ user.nama }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate">{{ user.positionText }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Selected Recipients -->
        <div v-if="selectedRecipients.length > 0" class="space-y-2">
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            {{ selectedRecipients.length }} penerima dipilih:
          </p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="recipient in selectedRecipients"
              :key="recipient.id"
              class="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-full px-3 py-1"
            >
              <div class="w-5 h-5 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center">
                <span class="text-[10px] font-semibold text-primary-700 dark:text-primary-300">
                  {{ recipient.nama?.charAt(0)?.toUpperCase() }}
                </span>
              </div>
              <span class="text-xs font-medium text-primary-700 dark:text-primary-300">{{ recipient.nama }}</span>
              <button
                class="text-primary-400 hover:text-primary-600 dark:hover:text-primary-200"
                @click="removeRecipient(recipient.id)"
              >
                <UIcon name="i-lucide-x" class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <!-- Catatan (optional) -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Catatan <span class="text-neutral-400 font-normal">(opsional)</span>
          </label>
          <UTextarea
            v-model="catatan"
            placeholder="Tambahkan catatan untuk penerima..."
            :rows="2"
            resize
          />
        </div>

        <!-- Error message -->
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
          label="Bagikan"
          icon="i-heroicons-arrow-top-right-on-square"
          :loading="isSubmitting"
          :disabled="selectedRecipients.length === 0"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
