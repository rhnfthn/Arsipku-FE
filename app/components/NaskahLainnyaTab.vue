<template>
  <div class="p-6">
    <Heading variant="heading9sb" class="text-mobile-md">Naskah Lainnya</Heading>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-7 mt-1">
      Atur default Legal Drafting dan klasifikasi untuk setiap jenis naskah lainnya. Default ini
      langsung terisi di form tulis saat pemrakarsa memilih jenis naskah.
    </p>

    <div v-if="isLoading" class="space-y-3">
      <div
        v-for="i in 4"
        :key="i"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-5 rounded-xl border border-gray-200 dark:border-gray-700"
      >
        <div class="space-y-2">
          <USkeleton class="h-4 w-32 rounded" />
          <USkeleton class="h-3 w-48 rounded" />
        </div>
        <USkeleton class="h-9 w-full sm:w-[380px] rounded-lg shrink-0" />
      </div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="row in rows"
        :key="row.jenisNaskah"
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-4 py-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div class="min-w-0">
          <p class="text-sm font-semibold text-gray-800 dark:text-white">
            {{ row.jenisNaskah }} — {{ jenisLabel(row.jenisNaskah) }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Legal Drafting: {{ row.butuhLegal ? 'Ya' : 'Tidak' }} · Klasifikasi:
            {{ row.defaultKlasifikasi || '-' }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 shrink-0">
          <!-- Legal Drafting Ya/Tidak (pola segmented ala tab Digsig) -->
          <div class="flex bg-[#f3f4f6] dark:bg-gray-800 rounded-lg p-1 gap-1 w-full sm:w-40">
            <button
              v-for="opt in legalOptions"
              :key="String(opt.value)"
              type="button"
              :disabled="isSaving === row.jenisNaskah"
              @click="setButuhLegal(row, opt.value)"
              :class="[
                'flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                row.butuhLegal === opt.value
                  ? 'bg-[#457fb6] text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700',
              ]"
            >
              {{ opt.label }}
            </button>
          </div>

          <!-- Default Klasifikasi (UI menyusul form tulis: parent/child, search, deskripsi) -->
          <USelectMenu
            :model-value="row.defaultKlasifikasi || NO_DEFAULT"
            :items="klasifikasiOptions"
            value-key="value"
            label-key="searchLabel"
            searchable
            :search-attributes="['searchLabel']"
            placeholder="Pilih klasifikasi…"
            :search-input="{ placeholder: 'Cari klasifikasi…' }"
            :content="({ class: 'max-h-[380px]' } as any)"
            class="w-full sm:w-56"
            :disabled="isSaving === row.jenisNaskah"
            :loading="klasifikasiLoading"
            @update:model-value="setKlasifikasi(row, $event)"
          >
            <template #item="{ item }">
              <div v-if="item.isParent" class="w-full py-1 overflow-hidden">
                <span
                  class="text-xs font-bold text-primary-500 dark:text-primary-400 uppercase tracking-widest block w-full truncate"
                >
                  {{ item.klasifikasi }} - {{ item.klasifikasi_text }}
                </span>
              </div>
              <div v-else class="flex flex-col min-w-0 w-full overflow-hidden">
                <span
                  class="text-sm font-medium text-gray-900 dark:text-white block w-full truncate"
                  :class="{ 'italic text-gray-400 dark:text-gray-500': item.value === NO_DEFAULT }"
                >
                  {{ item.value === NO_DEFAULT ? item.label : `${item.klasifikasi} - ${item.klasifikasi_text}` }}
                </span>
                <span
                  v-if="item.deskripsi"
                  class="text-xs text-gray-500 block w-full truncate mt-0.5"
                >
                  {{ item.deskripsi }}
                </span>
              </div>
            </template>

            <template #default>
              <span
                v-if="klasifikasiObj(row.defaultKlasifikasi)"
                class="truncate text-sm block w-full text-left dark:text-white"
              >
                {{ klasifikasiObj(row.defaultKlasifikasi)?.klasifikasi }} -
                {{ klasifikasiObj(row.defaultKlasifikasi)?.klasifikasi_text }}
              </span>
              <span v-else class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left">
                Pilih klasifikasi…
              </span>
            </template>
          </USelectMenu>
        </div>
      </div>
    </div>

    <div
      class="mt-6 flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-100 dark:border-primary-900"
    >
      <UIcon
        name="i-lucide-info"
        class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5"
      />
      <div class="text-sm text-primary-800 dark:text-primary-200 leading-relaxed">
        <span class="font-semibold block mb-1">Informasi</span>
        <p>
          Perubahan langsung tersimpan. Form tulis naskah lainnya akan mengisi Legal Drafting dan
          klasifikasi secara otomatis sesuai jenis yang dipilih; pemrakarsa tetap bisa mengubahnya.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { JENIS_LABELS, type JenisNaskah } from '~/types/naskah-lainnya';
import type { Klasifikasi } from '~/types/klasifikasi';

interface NaskahLainnyaConfigRow {
  jenisNaskah: string;
  butuhLegal: boolean;
  defaultKlasifikasi: string | null;
}

const { apiGet, apiPut } = useApi();
const toast = useToast();
const { getKlasifikasi } = useKlasifikasi();

const rows = ref<NaskahLainnyaConfigRow[]>([]);
const isLoading = ref(true);
const isSaving = ref<string | null>(null);
const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiLoading = ref(false);

const legalOptions = [
  { label: 'Tidak', value: false },
  { label: 'Ya', value: true },
];

// Reka Combobox melarang item value '' (dipakai untuk clear/placeholder),
// jadi opsi "tidak ada default" memakai sentinel non-empty.
const NO_DEFAULT = '__none__';

// Sesuai form tulis (Tulis/InputKlasifikasi): parent = kode tanpa titik (header
// disabled), child = kode anak + deskripsi. Filter kode kosong agar tidak
// menghasilkan ComboboxItem value '' (dilarang Reka).
const klasifikasiOptions = computed(() => {
  const sorted = klasifikasiList.value
    .filter((k) => k.klasifikasi && String(k.klasifikasi).trim())
    .sort((a, b) => a.klasifikasi.localeCompare(b.klasifikasi));
  return [
    {
      label: '— Tidak ada default —',
      value: NO_DEFAULT,
      searchLabel: '— Tidak ada default —',
      isParent: false,
      disabled: false,
    },
    ...sorted.map((k) => {
      const isParent = !k.klasifikasi.includes('.');
      return {
        ...k,
        label: `${k.klasifikasi} - ${k.klasifikasi_text}`,
        value: k.klasifikasi,
        searchLabel: `${k.klasifikasi} - ${k.klasifikasi_text}`,
        isParent,
        disabled: isParent,
      };
    }),
  ];
});

function klasifikasiObj(code: string | null) {
  if (!code) return null;
  return klasifikasiOptions.value.find((o) => o.value === code) ?? null;
}

function jenisLabel(jenis: string) {
  return JENIS_LABELS[jenis as JenisNaskah] ?? jenis;
}

async function fetchRows() {
  isLoading.value = true;
  try {
    const res = await apiGet<{ data: NaskahLainnyaConfigRow[] }>(
      '/admin/config/naskah-lainnya',
      {},
      { skipCache: true }
    );
    rows.value = (res as any)?.data ?? res ?? [];
  } catch {
    toast.add({ title: 'Gagal memuat konfigurasi naskah lainnya', color: 'error' });
  } finally {
    isLoading.value = false;
  }
}

async function save(row: NaskahLainnyaConfigRow, prev: NaskahLainnyaConfigRow) {
  if (isSaving.value) return;
  isSaving.value = row.jenisNaskah;
  try {
    await apiPut(`/admin/config/naskah-lainnya/${row.jenisNaskah}`, {
      butuhLegal: row.butuhLegal,
      defaultKlasifikasi: row.defaultKlasifikasi || null,
    });
    toast.add({
      title: 'Berhasil',
      description: `Konfigurasi ${row.jenisNaskah} diperbarui.`,
      color: 'success',
    });
  } catch {
    row.butuhLegal = prev.butuhLegal;
    row.defaultKlasifikasi = prev.defaultKlasifikasi;
    toast.add({
      title: 'Gagal',
      description: `Konfigurasi ${row.jenisNaskah} gagal disimpan.`,
      color: 'error',
    });
  } finally {
    isSaving.value = null;
  }
}

function setButuhLegal(row: NaskahLainnyaConfigRow, value: boolean) {
  if (isSaving.value) return;
  const prev = { ...row };
  row.butuhLegal = value;
  save(row, prev);
}

function setKlasifikasi(row: NaskahLainnyaConfigRow, value: unknown) {
  if (isSaving.value) return;
  const prev = { ...row };
  if (value === NO_DEFAULT) {
    row.defaultKlasifikasi = null;
  } else {
    row.defaultKlasifikasi = ((value as string) || '').trim() || null;
  }
  save(row, prev);
}

onMounted(async () => {
  fetchRows();
  klasifikasiLoading.value = true;
  try {
    klasifikasiList.value = await getKlasifikasi();
  } catch {
    // dropdown klasifikasi kosong — toggle legal tetap bisa dipakai
  } finally {
    klasifikasiLoading.value = false;
  }
});
</script>
