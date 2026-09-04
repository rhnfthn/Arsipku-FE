<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
    <span
      class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0"
    >
      {{ label }}
      <span v-if="hint" class="block text-xs text-gray-400 font-normal">{{ hint }}</span>
    </span>

    <div class="flex-1 w-full space-y-2">
      <div v-if="model.length" class="space-y-2">
        <div v-for="(director, idx) in model" :key="directorKey(director, idx)" class="space-y-1.5">
          <div class="flex items-start gap-2">
            <span
              class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0 mt-1"
            >
              {{ idx + 1 }}
            </span>
            <div class="grid flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <label class="block min-w-0">
                <span class="mb-1 block text-xs text-gray-400">Nama</span>
                <!-- Dropdown pengganti penandatanga (pola Tulis/InputPenerima):
                     group Direksi (BOD) dan EVP (BOD-1). Jabatan baris tetap
                 jabatan BOD direksi — memilih hanya mengganti nama. -->
                <div
                  class="w-full rounded-lg border border-gray-200 bg-white transition-colors focus-within:border-primary-500 dark:border-gray-700 dark:bg-gray-900"
                >
                  <USelectMenu
                    :model-value="director.nama"
                    :items="namaOptions"
                    value-key="value"
                    variant="none"
                    searchable
                    class="w-full p-0"
                    :content="{ side: 'bottom', sideOffset: 8, class: 'max-h-[380px]' } as any"
                    :search-input="{ placeholder: 'Cari nama...' }"
                    :ui="{
                      base: 'w-full',
                      input: 'w-full',
                      value: 'p-0 w-full',
                      viewport: 'max-h-[380px]',
                    } as any"
                    @update:model-value="pickNama(director, $event)"
                  >
                    <template #item="{ item }">
                      <div v-if="item.type === 'label'" class="header-label">
                        <span class="header-label-text">{{ item.label }}</span>
                      </div>
                      <div v-else class="w-full overflow-hidden py-1">
                        <span
                          class="block truncate text-left text-sm text-gray-900 dark:text-white"
                        >
                          {{ item.label }}
                        </span>
                        <span v-if="item.jabatan" class="block truncate text-left text-xs text-gray-500">
                          {{ item.jabatan }}
                        </span>
                      </div>
                    </template>
                    <template #default>
                      <div class="flex min-h-[36px] w-full items-center px-3">
                        <span
                          class="truncate pr-6 text-sm"
                          :class="director.nama ? 'text-gray-900 dark:text-white' : 'text-gray-400'"
                        >
                          {{ director.nama || 'Pilih BOD / EVP...' }}
                        </span>
                      </div>
                    </template>
                  </USelectMenu>
                </div>
              </label>
              <label class="block min-w-0">
                <span class="mb-1 block text-xs text-gray-400">Jabatan</span>
                <input
                  :value="director.jabatan"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  readonly
                />
              </label>
              <!-- Status delegasi direksi (kolom baru di samping direksi).
                   'ybs' default; PT/PH/PS diprefix di depan nama pengganti
                   di template. Nama pengganti diisi lewat kolom Nama di atas. -->
              <label class="block min-w-0">
                <span class="mb-1 block text-xs text-gray-400"
                  >Delegator/Pengganti (PT, PH, PS)</span
                >
                <select
                  :value="director.delegator || 'ybs'"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  @change="setDelegator(director, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="ybs">ybs</option>
                  <option value="PT">PT</option>
                  <option value="PH">PH</option>
                  <option value="PS">PS</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              class="mt-8 shrink-0 text-gray-400 hover:text-red-500"
              :aria-label="`Hapus ${label}`"
              @click="removeDirector(idx)"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="recipients.length === 0" class="py-1 text-sm text-gray-400">
        {{ emptyText }}
      </div>
      <div v-else-if="availableOptions.length > 0" class="flex items-center gap-2">
        <span
          class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0"
        >
          {{ model.length + 1 }}
        </span>
        <USelectMenu
          v-model="picker"
          :items="availableOptions"
          value-key="value"
          :placeholder="placeholder"
          searchable
          variant="none"
          class="flex-1 w-full"
          :content="{ side: 'bottom', sideOffset: 8, class: 'max-h-[380px]' } as any"
          :search-input="{ placeholder: 'Cari nama atau jabatan direksi...' }"
          :ui="
            {
              base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
              input: 'w-full',
              value: 'w-full',
              viewport: 'max-h-[380px]',
            } as any
          "
        >
          <template #default>
            <div class="flex min-h-[28px] w-full cursor-pointer items-center gap-1.5 pr-10">
              <span class="text-sm text-gray-400">{{ placeholder }}</span>
            </div>
          </template>

          <template #item="{ item }">
            <div class="flex min-w-0 w-full flex-col overflow-hidden">
              <span class="block w-full truncate text-sm font-medium text-gray-900 dark:text-white">
                {{ item.jabatan }}
              </span>
              <span class="mt-0.5 block w-full truncate text-xs text-gray-500">
                {{ item.nama || 'Nama belum tersedia' }}
              </span>
            </div>
          </template>
        </USelectMenu>
      </div>
      <p v-else class="text-xs text-gray-400">Semua direksi tersedia sudah dipilih.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useNaskahLainnya } from '~/composables/useNaskahLainnya';
import type { DirectorApprovalItem } from '~/types/naskah-lainnya';

const model = defineModel<DirectorApprovalItem[]>({ default: () => [] });

const props = withDefaults(
  defineProps<{
    label: string;
    recipients: DirectorApprovalItem[];
    hint?: string;
    placeholder?: string;
    emptyText?: string;
  }>(),
  {
    hint: '',
    placeholder: 'Pilih direksi...',
    emptyText: 'Tidak ada data direksi.',
  }
);

const picker = ref<string | null>(null);

// Opsi nama pengganti penandatanga: BOD & BOD-1 lintas direktorat
// (GET /org-data/bod-bod1), digroup Direksi (BOD) / EVP (BOD-1) —
// pola header-label Tulis/InputPenerima. Jabatan baris tetap jabatan
// BOD direksi — penggantian hanya menimpa nama.
const { fetchBodBod1 } = useNaskahLainnya();
const bodBod1Options = ref<DirectorApprovalItem[]>([]);
onMounted(() => {
  fetchBodBod1()
    .then((list) => {
      bodBod1Options.value = list;
    })
    .catch((err) => {
      console.error('[DirectorOrderSelector] fetchBodBod1 error:', err);
    });
});
const namaOptions = computed(() => {
  const seen = new Set<string>();
  const byTag = (tag: string) =>
    bodBod1Options.value.filter((v) => {
      const nama = (v.nama || '').trim();
      if (!nama || seen.has(nama) || v.bodTag !== tag) return false;
      seen.add(nama);
      return true;
    });
  const person = (v: DirectorApprovalItem) => ({
    label: v.nama,
    jabatan: v.jabatan,
    value: v.nama,
    type: 'person',
  });
  const direksi = byTag('BOD').map(person);
  const evp = byTag('BOD-1').map(person);
  const options: any[] = [];
  if (direksi.length) options.push({ label: 'Direksi', type: 'label' });
  options.push(...direksi);
  if (evp.length) options.push({ label: 'EVP', type: 'label' });
  options.push(...evp);
  return options;
});
// Routing delegasi: selama status ≠ 'ybs', resolve persnum pengganti dari
// nama terpilih dan isi kolom delegasi — approval paraf masuk ke pengganti.
function syncDelegasi(director: DirectorApprovalItem) {
  const status = director.delegator?.trim();
  const opt = bodBod1Options.value.find(
    (v) => (v.nama || '').trim() === (director.nama || '').trim()
  );
  if (!opt?.persnum || !status || status === 'ybs') {
    director.delegatePersnum = undefined;
    director.delegateName = undefined;
    director.delegatePositionStatus = null;
    return;
  }
  director.delegatePersnum = opt.persnum;
  director.delegateName = director.nama;
  director.delegatePositionStatus = status as 'PT' | 'PH' | 'PS';
}

function pickNama(director: DirectorApprovalItem, nama: string) {
  director.nama = nama;
  syncDelegasi(director);
}

function setDelegator(director: DirectorApprovalItem, val: string) {
  director.delegator = val;
  syncDelegasi(director);
}

function keyOf(director: Partial<DirectorApprovalItem>) {
  return String(director.positionId || `${director.jabatan || ''}-${director.nama || ''}`);
}

function directorKey(director: DirectorApprovalItem, idx: number) {
  return `${keyOf(director)}-${idx}`;
}

function compactDirector(director: DirectorApprovalItem): DirectorApprovalItem {
  return {
    index: model.value.length + 1,
    positionId: director.positionId,
    persnum: director.persnum,
    nama: director.nama,
    jabatan: director.jabatan,
    // Default delegator/pengganti: 'ybs' (yang bersangkungan).
    delegator: director.delegator?.trim() || 'ybs',
  };
}

const selectedKeys = computed(() => new Set(model.value.map(keyOf)));

const availableOptions = computed(() =>
  props.recipients
    .filter((director) => !selectedKeys.value.has(keyOf(director)))
    .map((director) => ({
      value: keyOf(director),
      label: `${director.jabatan} — ${director.nama || 'Nama belum tersedia'}`,
      nama: director.nama,
      jabatan: director.jabatan,
      raw: director,
    }))
);

function removeDirector(idx: number) {
  model.value = model.value
    .filter((_, i) => i !== idx)
    .map((item, i) => ({ ...item, index: i + 1 }));
}

watch(picker, (value) => {
  if (!value) return;
  const option = availableOptions.value.find((item) => item.value === value);
  if (option) {
    model.value = [...model.value, compactDirector(option.raw)];
  }
  picker.value = null;
});
</script>

<style scoped>
/* Header label group dropdown (sama dengan Tulis/InputPenerima). */
.header-label {
  width: 100%;
  padding: 0.5rem;
  background-color: rgb(243 244 246);
  text-align: center;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
  margin-top: -0.25rem;
  margin-bottom: 0.25rem;
  pointer-events: none;
}

.dark .header-label {
  background-color: rgb(31 41 55);
}

.header-label-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgb(75 85 99);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
}

.dark .header-label-text {
  color: rgb(156 163 175);
}
</style>
