<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search } from 'lucide-vue-next';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';

const props = defineProps<{
  naskahId?: string;
  naskahPerihal?: string;
  naskahNomor?: string;
  // Multi-naskah: array of { naskahId, perihal, nomor }
  naskahItems?: Array<{ naskahId: string; perihal?: string; nomor?: string }>;
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

const accessType = ref<'RENTANG_WAKTU' | 'SEKALI_LIHAT'>('RENTANG_WAKTU');
const durationDays = ref(7);

const durationOptions = [
  { label: '2 hari', value: 2 },
  { label: '7 hari', value: 7 },
  { label: '14 hari', value: 14 },
  { label: '30 hari', value: 30 },
];

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

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
  // Resolve naskah list: multi (naskahItems) atau single (naskahId)
  const items = props.naskahItems?.length
    ? props.naskahItems
    : props.naskahId
      ? [{ naskahId: props.naskahId, perihal: props.naskahPerihal, nomor: props.naskahNomor }]
      : [];

  if (items.length === 0) {
    errorMsg.value = 'ID Naskah tidak valid';
    return;
  }
  if (selectedRecipients.value.length === 0) {
    errorMsg.value = 'Pilih minimal 1 penerima';
    return;
  }
  isSubmitting.value = true;
  errorMsg.value = '';
  try {
    await createShare(
      items[0].naskahId,
      selectedRecipients.value.map((r) => r.id),
      catatan.value || undefined,
      accessType.value,
      accessType.value === 'RENTANG_WAKTU' ? durationDays.value : undefined,
      items.length > 1 ? items.map((i) => i.naskahId) : undefined,
    );
    useToast().add({
      title: 'Berhasil',
      description: `${items.length} naskah berhasil dibagikan ke ${selectedRecipients.value.length} penerima`,
      color: 'success',
    });
    emit('shared');
    isOpen.value = false;
  } catch (err: any) {
    const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
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
  <Teleport to="body">
    <Modal v-model="isOpen" :hideDefaultFooter="true" size="xl">
      <template #title>
        <div class="mt-5 ml-5 mb-3">
          <Heading variant="heading9b" class="font-bold text-sm dark:text-white">
            Bagikan Naskah
          </Heading>
        </div>
      </template>

      <div class="p-1 mt-1 max-h-[calc(100vh-180px)] overflow-y-auto">
        <div class="space-y-4">
          <!-- Info Naskah -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">
              Naskah <span v-if="naskahItems?.length" class="text-gray-400 font-normal">({{ naskahItems.length }} dipilih)</span>
            </Heading>
            <!-- Multi-naskah -->
            <div v-if="naskahItems?.length" class="mt-2 space-y-1.5">
              <div
                v-for="(item, idx) in naskahItems"
                :key="item.naskahId"
                class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md text-sm"
              >
                <p class="font-medium text-gray-900 dark:text-white">
                  <span class="text-gray-400 mr-1.5">{{ idx + 1 }}.</span>{{ item.perihal || '(Tanpa perihal)' }}
                </p>
                <p v-if="item.nomor" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                  {{ item.nomor }}
                </p>
              </div>
            </div>
            <!-- Single naskah -->
            <div v-else class="mt-2 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md text-sm">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ naskahPerihal || '(Tanpa perihal)' }}
              </p>
              <p v-if="naskahNomor" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                {{ naskahNomor }}
              </p>
            </div>
          </div>

          <!-- Jenis Akses -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">
              Jenis Akses <span class="text-red-500">*</span>
            </Heading>
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
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <template v-if="accessType === 'SEKALI_LIHAT'">
                Penerima hanya dapat membuka naskah satu kali.
              </template>
              <template v-else>
                Penerima dapat membuka naskah selama rentang waktu yang dipilih.
              </template>
            </p>

            <!-- Duration picker -->
            <div v-if="accessType === 'RENTANG_WAKTU'" class="mt-3">
              <Heading variant="body2m" class="dark:text-gray-200">
                Durasi Akses
              </Heading>
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

          <!-- Search Penerima -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">
              Penerima <span class="text-red-500">*</span>
            </Heading>
            <div class="relative mt-2">
              <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Ketik nama atau persnum..."
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-9 pr-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <!-- Search Results -->
            <div
              v-if="filteredResults.length > 0"
              class="mt-1 border border-gray-300 dark:border-gray-700 rounded-md max-h-48 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg"
            >
              <div
                v-for="user in filteredResults"
                :key="user.id"
                @click="addRecipient(user)"
                class="px-3 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <p class="font-medium">{{ user.nama }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ user.positionText }}</p>
              </div>
            </div>
          </div>

          <!-- Selected Recipients -->
          <div v-if="selectedRecipients.length > 0">
            <Heading variant="body2m" class="dark:text-gray-200 mb-2">
              Penerima Dipilih ({{ selectedRecipients.length }})
            </Heading>
            <div class="space-y-2">
              <div
                v-for="recipient in selectedRecipients"
                :key="recipient.id"
                class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3"
              >
                <div class="flex-1">
                  <p class="font-medium text-sm text-gray-900 dark:text-white">{{ recipient.nama }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ recipient.positionText }}</p>
                </div>
                <button
                  type="button"
                  @click="removeRecipient(recipient.id)"
                  class="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 ml-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Catatan -->
          <div>
            <Heading variant="body2m" class="dark:text-gray-200">
              Catatan <span class="text-gray-400 font-normal">(opsional)</span>
            </Heading>
            <textarea
              v-model="catatan"
              placeholder="Tambahkan catatan untuk penerima..."
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
          :disabled="isSubmitting"
          class="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          :disabled="isSubmitting || selectedRecipients.length === 0"
          class="flex-1 px-6 py-2 bg-primary dark:bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 dark:hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Menyimpan...' : 'Bagikan' }}
        </button>
      </div>
    </Modal>
  </Teleport>
</template>
