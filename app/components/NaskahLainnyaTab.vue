<template>
  <div class="p-6">
    <Heading variant="heading9sb" class="text-mobile-md">Naskah Lainnya</Heading>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-7 mt-1">
      Atur Legal Drafting, klasifikasi, dan izin penyebarluasan untuk setiap jenis naskah lainnya.
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
            {{ row.defaultKlasifikasi || '-' }} · Boleh Dibagikan:
            {{ row.shareEnabled ? 'Ya' : 'Tidak' }}
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

          <!-- Izin penyebarluasan naskah final -->
          <button
            type="button"
            :disabled="isSaving === row.jenisNaskah"
            class="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition sm:w-44"
            :class="row.shareEnabled
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
              : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-400 hover:text-emerald-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'"
            @click="setShareEnabled(row, !row.shareEnabled)"
          >
            <UIcon name="i-lucide-share-2" class="size-4" />
            {{ row.shareEnabled ? 'Boleh Dibagikan' : 'Tidak Dibagikan' }}
          </button>

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
            :content="({ class: 'max-h-[380px] w-[min(32rem,calc(100vw-2rem))]' } as any)"
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
              <div v-else class="flex flex-col min-w-0 w-full">
                <span
                  class="text-sm font-medium text-gray-900 dark:text-white block w-full truncate"
                  :class="{ 'italic text-gray-400 dark:text-gray-500': item.value === NO_DEFAULT }"
                >
                  {{ item.value === NO_DEFAULT ? item.label : `${item.klasifikasi} - ${item.klasifikasi_text}` }}
                </span>
                <span v-if="item.deskripsi" class="text-xs text-gray-500 dark:text-gray-400 block w-full mt-0.5 whitespace-normal break-words [overflow-wrap:anywhere] leading-relaxed">
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
          Perubahan langsung tersimpan. Opsi Boleh Dibagikan menentukan apakah tombol
          Sebarluaskan tersedia setelah naskah selesai. Surat Edaran dikirim ke seluruh karyawan;
          jenis lainnya menggunakan penerima yang dipilih.
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
  shareEnabled: boolean;
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

  // Deteksi parent via relasi id_parent (akurat), bukan heuristik titik.
  const childIds = new Set(
    sorted.map((k) => k.id_parent).filter((pid): pid is string => !!pid)
  );

  return [
    {
      label: '— Tidak ada default —',
      value: NO_DEFAULT,
      searchLabel: '— Tidak ada default —',
      isParent: false,
      disabled: false,
    },
    ...sorted.map((k) => {
      const isParent = childIds.has(k.id);
      const selectable = !isParent && Number(k.is_select ?? 1) === 1;
      return {
        ...k,
        label: `${k.klasifikasi} - ${k.klasifikasi_text}`,
        value: k.klasifikasi,
        searchLabel: k.search_text || [
          k.klasifikasi,
          k.klasifikasi_text,
          k.deskripsi,
        ].filter(Boolean).join(' '),
        isParent,
        disabled: !selectable,
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
      shareEnabled: row.shareEnabled,
      defaultKlasifikasi: row.defaultKlasifikasi || null,
    });
    toast.add({
      title: 'Berhasil',
      description: `Konfigurasi ${row.jenisNaskah} diperbarui.`,
      color: 'success',
    });
  } catch {
    row.butuhLegal = prev.butuhLegal;
    row.shareEnabled = prev.shareEnabled;
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

function setShareEnabled(row: NaskahLainnyaConfigRow, value: boolean) {
  if (isSaving.value) return;
  const prev = { ...row };
  row.shareEnabled = value;
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
