<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
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

const { createShare, searchUsers, searchResults, clearSearchResults } = useNaskahShare();
const { t } = useI18n();

const isOpen = ref(true);
const catatan = ref('');
const selectedRecipients = ref<Array<{ id: string; nama: string; positionText: string; organizationText: string }>>([]);
const searchQuery = ref('');
const isSubmitting = ref(false);
const errorMsg = ref('');
const errors = ref<Record<string, string>>({});
const triedSubmit = ref(false);

const accessType = ref<'RENTANG_WAKTU' | 'SEKALI_LIHAT'>('RENTANG_WAKTU');
const durationDays = ref<number | 'CUSTOM'>(7);
const customTanggalSelesai = ref('');
// Tanggal hari ini dalam timezone lokal (bukan UTC) untuk `min` date picker.
const todayStr = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

// Metode berbagi naskah: via ArsipKu, Email, atau WhatsApp
const shareMethod = ref<'ARSIPKU' | 'EMAIL' | 'WHATSAPP'>('ARSIPKU');
const shareMethodOptions = [
  { value: 'ARSIPKU', label: 'ArsipKu', icon: 'i-lucide-folder-open' },
  { value: 'EMAIL', label: 'Email', icon: 'i-lucide-mail' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: 'i-lucide-message-circle' },
];
// Dropdown custom (gaya verifikator berjenjang)
const showShareMethodDropdown = ref(false);
const shareMethodDropdownRef = ref<HTMLElement | null>(null);
const shareMethodLabel = computed(
  () => shareMethodOptions.find((o) => o.value === shareMethod.value)?.label || 'ArsipKu',
);
// Fitur selain ArsipKu belum tersedia
const isShareMethodComingSoon = computed(() => shareMethod.value !== 'ARSIPKU');

/** Duration options for RENTANG_WAKTU. 'Custom' shows date picker. */
const durationOptions = computed(() => [
  { label: `2 ${t('share_hari')}`, value: 2 },
  { label: `7 ${t('share_hari')}`, value: 7 },
  { label: `14 ${t('share_hari')}`, value: 14 },
  { label: `30 ${t('share_hari')}`, value: 30 },
  { label: 'Custom', value: 'CUSTOM' as const },
]);

const formatTanggalID = (tgl: string) => {
  if (!tgl) return '';
  const d = new Date(tgl);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Calculate end date: preset = today + N days, custom = manual date. */
const tanggalSelesaiStr = computed(() => {
  if (durationDays.value === 'CUSTOM') return customTanggalSelesai.value || '';
  const hari = durationDays.value;
  if (!hari) return '';
  const d = new Date();
  d.setDate(d.getDate() + hari);
  return d.toISOString().split('T')[0];
});

/** Debounce search 300ms, min 2 chars before API query. */
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

/** Filter out already-selected recipients from search results. */
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

  // Clear error when recipient selected
watch(selectedRecipients, () => {
  if (errors.value.recipients && selectedRecipients.value.length > 0) delete errors.value.recipients;
}, { deep: true });

// Clear error when custom date changed
watch(customTanggalSelesai, () => {
  if (errors.value.customTanggal) delete errors.value.customTanggal;
});

/** Validate fields on submit. Errors show inline, button stays active. */
const handleSubmit = async () => {
  // Resolve naskah list: multi (naskahItems) or single (naskahId)
  const items = props.naskahItems?.length
    ? props.naskahItems
    : props.naskahId
      ? [{ naskahId: props.naskahId, perihal: props.naskahPerihal, nomor: props.naskahNomor }]
      : [];

  triedSubmit.value = true;
  errors.value = {};

  if (items.length === 0) {
    errorMsg.value = t('share_id_invalid');
    return;
  }
  if (selectedRecipients.value.length === 0) {
    errors.value.recipients = t('share_pilih_penerima');
  }
  if (accessType.value === 'RENTANG_WAKTU' && durationDays.value === 'CUSTOM' && !customTanggalSelesai.value) {
    errors.value.customTanggal = t('share_tanggal_wajib');
  }
  if (Object.keys(errors.value).length > 0) return;

  isSubmitting.value = true;
  errorMsg.value = '';
  try {
    // Hitung durasi efektif: preset langsung, custom = selisih hari dari hari ini.
    let effectiveDurationDays: number | undefined;
    if (accessType.value === 'RENTANG_WAKTU') {
      if (durationDays.value === 'CUSTOM') {
        const end = new Date(customTanggalSelesai.value);
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        effectiveDurationDays = diff > 0 ? diff : undefined;
      } else {
        effectiveDurationDays = durationDays.value;
      }
    }

    await createShare(
      items[0].naskahId,
      selectedRecipients.value.map((r) => r.id),
      catatan.value || undefined,
      accessType.value,
      effectiveDurationDays,
      items.length > 1 ? items.map((i) => i.naskahId) : undefined,
    );
    useToast().add({
      title: t('share_berhasil'),
      description: t('share_berhasil_dibagikan', { count: items.length, recipients: selectedRecipients.value.length }),
      color: 'success',
    });
    emit('shared');
    isOpen.value = false;
  } catch (err: any) {
    const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
    errorMsg.value = serverMsg || err?.message || t('share_gagal_dibagikan');
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

// Tutup dropdown share method saat klik di luar
const handleDocumentClick = (e: MouseEvent) => {
  if (shareMethodDropdownRef.value && !shareMethodDropdownRef.value.contains(e.target as Node)) {
    showShareMethodDropdown.value = false;
  }
};
onMounted(() => document.addEventListener('click', handleDocumentClick));
onUnmounted(() => document.removeEventListener('click', handleDocumentClick));
</script>

<template>
  <Teleport to="body">
  <Modal v-model="isOpen" :hideDefaultFooter="true" size="xl">
    <template #title>
      <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
        {{ t('share_modal_title') }}
      </Heading>
    </template>

    <div class="space-y-1 p-1 max-h-[calc(100vh-180px)] overflow-y-auto">
      <!-- Info Naskah -->
      <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
        <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
          {{ t('share_naskah') }}
          <span v-if="naskahItems?.length" class="text-gray-400 font-normal">({{ naskahItems.length }} {{ t('share_dipilih') }})</span>
        </span>
        <div class="flex-1">
          <!-- Multi-naskah -->
          <div v-if="naskahItems?.length" class="space-y-1.5">
            <div
              v-for="(item, idx) in naskahItems"
              :key="item.naskahId"
              class="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-lg text-sm"
            >
              <p class="font-medium text-gray-900 dark:text-white">
                <span class="text-gray-400 mr-1.5">{{ idx + 1 }}.</span>{{ item.perihal || t('share_tanpa_perihal') }}
              </p>
              <p v-if="item.nomor" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                {{ item.nomor }}
              </p>
            </div>
          </div>
          <!-- Single naskah -->
          <div v-else class="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-lg text-sm">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ naskahPerihal || t('share_tanpa_perihal') }}
            </p>
            <p v-if="naskahNomor" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
              {{ naskahNomor }}
            </p>
          </div>
        </div>
      </div>

      <!-- Tipe Berbagi (metode bagi naskah) -->
      <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
        <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
          {{ t('share_tipe_berbagi') }} <span class="text-red-500">*</span>
        </span>
        <div class="flex-1">
          <div class="relative" ref="shareMethodDropdownRef">
            <button
              type="button"
              @click.stop="showShareMethodDropdown = !showShareMethodDropdown"
              class="w-full flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition hover:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              :class="showShareMethodDropdown ? 'border-primary' : 'border-gray-200'"
            >
              <span>{{ shareMethodLabel }}</span>
              <UIcon name="i-lucide-chevron-down" class="size-4 shrink-0 text-gray-400 transition-transform" :class="{ 'rotate-180': showShareMethodDropdown }" />
            </button>
            <div
              v-if="showShareMethodDropdown"
              class="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
            >
              <div class="max-h-[200px] overflow-y-auto">
                <button
                  v-for="opt in shareMethodOptions"
                  :key="opt.value"
                  type="button"
                  @click="shareMethod = opt.value; showShareMethodDropdown = false"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 dark:hover:bg-gray-700"
                  :class="shareMethod === opt.value ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'"
                >
                  <UIcon :name="opt.icon" class="size-4 shrink-0" />
                  <span class="font-medium">{{ opt.label }}</span>
                </button>
              </div>
            </div>
          </div>
          <!-- Coming soon untuk metode selain ArsipKu -->
          <div v-if="isShareMethodComingSoon" class="mt-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-center dark:border-gray-600 dark:bg-gray-700/30">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('share_coming_soon') }}
            </p>
            <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {{ t('share_metode_segera', { method: shareMethodLabel }) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Jenis Akses -->
      <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
        <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
          {{ t('share_jenis_akses') }} <span class="text-red-500">*</span>
        </span>
        <div class="flex-1">
          <div class="flex flex-1 gap-2">
            <button
              type="button"
              @click="accessType = 'RENTANG_WAKTU'"
              class="flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition"
              :class="accessType === 'RENTANG_WAKTU'
                ? 'border-primary bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/20 dark:text-primary-400'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'"
            >
              <UIcon name="i-lucide-calendar" class="w-4 h-4 inline mr-1.5" />
              {{ t('share_rentang_waktu') }}
            </button>
            <button
              type="button"
              @click="accessType = 'SEKALI_LIHAT'"
              class="flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition"
              :class="accessType === 'SEKALI_LIHAT'
                ? 'border-primary bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/20 dark:text-primary-400'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'"
            >
              <UIcon name="i-lucide-eye" class="w-4 h-4 inline mr-1.5" />
              {{ t('share_sekali_lihat') }}
            </button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            <template v-if="accessType === 'SEKALI_LIHAT'">
              {{ t('share_sekali_lihat_desc') }}
            </template>
            <template v-else>
              {{ t('share_rentang_waktu_desc') }}
            </template>
          </p>

          <!-- Duration picker -->
          <div v-if="accessType === 'RENTANG_WAKTU'" class="mt-3">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in durationOptions"
                :key="opt.value"
                type="button"
                class="px-4 py-2 text-xs font-medium rounded-lg border transition"
                :class="durationDays === opt.value
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'"
                @click="durationDays = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>

            <!-- Custom: date picker + tanggal berakhir -->
            <div v-if="durationDays === 'CUSTOM'" class="mt-2 flex items-center gap-2">
              <UInput
                v-model="customTanggalSelesai"
                type="date"
                :min="todayStr"
                class="flex-1"
                :ui="{ base: 'rounded-lg border-gray-200 dark:border-gray-600' }"
              />
              <div v-if="customTanggalSelesai" class="flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700/40">
                <UIcon name="i-lucide-calendar-days" class="w-4 h-4 shrink-0 text-gray-500" />
                <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ formatTanggalID(customTanggalSelesai) }}</span>
              </div>
            </div>
            <p v-if="errors.customTanggal" class="mt-1 text-xs text-red-500">{{ errors.customTanggal }}</p>

            <!-- Preset: tanggal berakhir -->
            <div v-else-if="tanggalSelesaiStr" class="mt-2 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700/40">
              <UIcon name="i-lucide-calendar-days" class="w-4 h-4 shrink-0 text-gray-500" />
              <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ t('share_berakhir_pada') }} {{ formatTanggalID(tanggalSelesaiStr) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Penerima -->
      <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
        <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
          {{ t('share_penerima') }} <span class="text-red-500">*</span>
        </span>
        <div class="flex-1">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('share_cari_penerima')"
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-9 text-sm text-gray-900 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <!-- Search Results -->
          <div
            v-if="filteredResults.length > 0"
            class="mt-1 rounded-lg border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg"
          >
            <div
              v-for="user in filteredResults"
              :key="user.id"
              @click="addRecipient(user)"
              class="px-3 py-3 hover:bg-primary-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <p class="font-medium">{{ user.nama }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ user.positionText }}</p>
            </div>
          </div>

          <!-- Selected Recipients -->
          <div v-if="selectedRecipients.length > 0" class="mt-2 space-y-1.5">
            <div
              v-for="recipient in selectedRecipients"
              :key="recipient.id"
              class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg p-2"
            >
              <div class="flex-1">
                <p class="font-medium text-sm text-gray-900 dark:text-white">{{ recipient.nama }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ recipient.positionText }}</p>
              </div>
              <button
                type="button"
                @click="removeRecipient(recipient.id)"
                class="ml-2 text-gray-400 transition-colors hover:text-red-500"
              >
                <UIcon name="i-lucide-x" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p v-if="errors.recipients" class="mt-1 text-xs text-red-500">{{ errors.recipients }}</p>
        </div>
      </div>

      <!-- Catatan -->
      <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
        <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
          {{ t('share_catatan') }}
          <span class="text-xs font-normal text-gray-400">{{ t('share_opsional') }}</span>
        </span>
        <div class="flex-1">
          <textarea
            v-model="catatan"
            rows="3"
            maxlength="2000"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            :placeholder="t('share_catatan_placeholder')"
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
        :disabled="isSubmitting"
        @click="handleClose"
      >
        {{ t('share_batal') }}
      </button>
      <button
        class="flex-1 px-6 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 hover:opacity-90 dark:hover:opacity-90 bg-primary dark:bg-primary-600"
        :disabled="isSubmitting || isShareMethodComingSoon"
        @click="handleSubmit"
      >
        {{ isSubmitting ? t('share_memproses') : t('share_bagikan') }}
      </button>
    </div>
  </Modal>
  </Teleport>
</template>
