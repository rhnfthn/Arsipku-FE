<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';
import { useApi } from '~/composables/useApi';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { JenisBerkas, DurasiPreset, JenisAkses, type LevelJabatan } from '~/types/usulan-akses-berkas';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [];
}>();

const { fetchVerifikatorBod, verifikatorList, createUsulan, pending } = useUsulanAksesBerkas();
const { apiGet } = useApi();
const toast = useToast();

// Helper: extract error message dari AxiosError (BE return { message: [...] | string })
const extractErrorMessage = (err: any): string => {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) {
    return beMessage.join(', ');
  }
  if (typeof beMessage === 'string' && beMessage.trim()) {
    return beMessage;
  }
  return err?.message || 'Terjadi kesalahan';
};

// ── Divisi list ───────────────────────────────────
interface DivisiOption {
  organization: number;
  shortText: string | null;
  longText: string | null;
  abbreviation: string | null;
}
const divisiList = ref<DivisiOption[]>([]);
const divisiLoading = ref(false);

const fetchDivisiList = async () => {
  divisiLoading.value = true;
  try {
    const res = await apiGet<{ data: DivisiOption[] }>('/organization');
    divisiList.value = (res?.data || []).filter((d: any) => d.organization != null);
  } catch (err) {
    console.error('[AddUsulanAksesBerkas] fetchDivisiList error:', err);
    divisiList.value = [];
  } finally {
    divisiLoading.value = false;
  }
};

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// ── Form state ───────────────────────────────────
const jenisBerkas = ref<JenisBerkas>(JenisBerkas.AKTIF);
const divisiPemberiId = ref<number | null>(null);
const tujuanAkses = ref('');
const durasiAkses = ref<DurasiPreset>(DurasiPreset.SATU_TAHUN);
const customTanggalSelesai = ref('');
const CORPORATE_SECRETARY_ORG_ID = 10002098;
const todayStr = new Date().toISOString().split('T')[0];
const jenisAksesSelected = ref<JenisAkses[]>([JenisAkses.LIHAT, JenisAkses.CETAK]);
const selectedVerifikatorPersnums = ref<number[]>([]);

const durasiOptions = [
  { label: '7 Hari', value: DurasiPreset.TUJUH_HARI },
  { label: '14 Hari', value: DurasiPreset.EMPAT_BELAS_HARI },
  { label: '1 Bulan', value: DurasiPreset.SATU_BULAN },
  { label: '2 Bulan', value: DurasiPreset.DUA_BULAN },
  { label: '3 Bulan', value: DurasiPreset.TIGA_BULAN },
  { label: '6 Bulan', value: DurasiPreset.ENAM_BULAN },
  { label: '1 Tahun', value: DurasiPreset.SATU_TAHUN },
  { label: 'Custom', value: DurasiPreset.CUSTOM },
];

const jenisAksesOptions = [
  { label: 'Lihat', value: JenisAkses.LIHAT },
  { label: 'Unduh', value: JenisAkses.UNDUH },
  { label: 'Cetak', value: JenisAkses.CETAK },
];

// Hitung tanggal selesai berdasarkan durasi preset
const durasiHariMap: Record<string, number> = {
  '7_HARI': 7,
  '14_HARI': 14,
  '1_BULAN': 30,
  '2_BULAN': 60,
  '3_BULAN': 90,
  '6_BULAN': 180,
  '1_TAHUN': 365,
};

const tanggalMulaiStr = computed(() => todayStr);

const tanggalSelesaiStr = computed(() => {
  if (durasiAkses.value === DurasiPreset.CUSTOM) {
    return customTanggalSelesai.value || '';
  }
  const hari = durasiHariMap[durasiAkses.value];
  if (!hari) return '';
  const d = new Date();
  d.setDate(d.getDate() + hari);
  return d.toISOString().split('T')[0];
});

const formatTanggalID = (tgl: string) => {
  if (!tgl) return '';
  const d = new Date(tgl);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const isINAKTIF = computed(() => jenisBerkas.value === JenisBerkas.INAKTIF);

// Saat Inaktif dipilih, divisi pemberi otomatis Corporate Secretary
watch(isINAKTIF, (inaktif) => {
  if (inaktif) {
    divisiPemberiId.value = CORPORATE_SECRETARY_ORG_ID;
  } else {
    divisiPemberiId.value = null;
  }
});

const toggleJenisAkses = (val: JenisAkses) => {
  const idx = jenisAksesSelected.value.indexOf(val);
  if (idx >= 0) {
    jenisAksesSelected.value.splice(idx, 1);
  } else {
    jenisAksesSelected.value.push(val);
  }
};

const toggleVerifikator = (persnum: number) => {
  const idx = selectedVerifikatorPersnums.value.indexOf(persnum);
  if (idx >= 0) {
    selectedVerifikatorPersnums.value.splice(idx, 1);
  } else {
    if (selectedVerifikatorPersnums.value.length >= 3) {
      toast.add({ title: 'Maksimal 3 verifikator', color: 'error' });
      return;
    }
    selectedVerifikatorPersnums.value.push(persnum);
  }
};

const getVerifikator = (persnum: number) => {
  return verifikatorList.value.find((x) => x.persnum === persnum);
};

// Normalize levelJabatan: BOD-1/2/3 → BOD untuk tampilan
const normalizeLevelJabatan = (level?: string | null): string => {
  if (!level) return '';
  if (level.startsWith('BOD')) return 'BOD';
  return level;
};

// Sort order: EVP (highest) → VP → AVP → BOD
const LEVEL_ORDER: Record<string, number> = {
  EVP: 1,
  VP: 2,
  AVP: 3,
  BOD: 4,
  'BOD-1': 4,
  'BOD-2': 4,
  'BOD-3': 4,
};

const availableVerifikator = computed(() => {
  // Ambil levelJabatan yang sudah dipilih
  const selectedLevels = new Set(
    selectedVerifikatorPersnums.value
      .map((p) => getVerifikator(p)?.levelJabatan)
      .filter(Boolean) as string[],
  );
  return verifikatorList.value
    .filter(
      (v) =>
        !selectedVerifikatorPersnums.value.includes(v.persnum) &&
        !selectedLevels.has(v.levelJabatan),
    )
    .sort((a, b) => (LEVEL_ORDER[a.levelJabatan] ?? 99) - (LEVEL_ORDER[b.levelJabatan] ?? 99));
});

// Chips verifikator yang sudah dipilih, diurutkan dari tertinggi (EVP) ke terendah
const sortedSelectedVerifikator = computed(() => {
  return [...selectedVerifikatorPersnums.value].sort((a, b) => {
    const va = getVerifikator(a);
    const vb = getVerifikator(b);
    const la = va?.levelJabatan ?? '';
    const lb = vb?.levelJabatan ?? '';
    // Normalize BOD-1/2/3 → BOD untuk sorting
    const na = la.startsWith('BOD') ? 'BOD' : la;
    const nb = lb.startsWith('BOD') ? 'BOD' : lb;
    return (LEVEL_ORDER[na] ?? 99) - (LEVEL_ORDER[nb] ?? 99);
  });
});

const onVerifikatorSelectFromUSelect = (value: any) => {
  const persnum = Number(value);
  if (persnum && !isNaN(persnum)) {
    toggleVerifikator(persnum);
  }
};

const resetForm = () => {
  jenisBerkas.value = JenisBerkas.AKTIF;
  divisiPemberiId.value = null;
  tujuanAkses.value = '';
  durasiAkses.value = DurasiPreset.SATU_TAHUN;
  customTanggalSelesai.value = '';
  jenisAksesSelected.value = [JenisAkses.LIHAT, JenisAkses.CETAK];
  selectedVerifikatorPersnums.value = [];
};

const canSubmit = computed(() => {
  if (tujuanAkses.value.trim().length === 0) return false;
  if (jenisAksesSelected.value.length === 0) return false;
  if (selectedVerifikatorPersnums.value.length === 0) return false;
  if (!isINAKTIF.value && !divisiPemberiId.value) return false;
  if (durasiAkses.value === DurasiPreset.CUSTOM && !customTanggalSelesai.value) return false;
  return true;
});

// Debug: tampilkan kondisi yang belum terpenuhi (sudah dihapus, lihat revisi UI)
const handleSubmit = async () => {
  if (!canSubmit.value) {
    toast.add({ title: 'Lengkapi semua field wajib', color: 'error' });
    return;
  }

  const verifikatorPengusul = selectedVerifikatorPersnums.value
    .map((persnum) => {
      const v = verifikatorList.value.find((x) => x.persnum === persnum);
      if (!v) return null;
      return { persnum: v.persnum, levelJabatan: v.levelJabatan as LevelJabatan };
    })
    .filter(Boolean) as { persnum: number; levelJabatan: LevelJabatan }[];

  try {
    await createUsulan({
      jenisBerkas: jenisBerkas.value,
      divisiPemberiId: isINAKTIF.value ? undefined : Number(divisiPemberiId.value),
      tujuanAkses: tujuanAkses.value.trim(),
      durasiAkses: durasiAkses.value,
      customTanggalSelesai:
        durasiAkses.value === DurasiPreset.CUSTOM
          ? customTanggalSelesai.value
          : undefined,
      jenisAkses: jenisAksesSelected.value,
      verifikatorPengusul,
    });
    resetForm();
    emit('created');
  } catch (err: any) {
    toast.add({
      title: 'Gagal membuat usulan',
      description: extractErrorMessage(err),
      color: 'error',
    });
  }
};

watch(isOpen, (val) => {
  if (val) {
    fetchVerifikatorBod().catch((err) => {
      console.error('[AddUsulanAksesBerkas] fetchVerifikatorBod failed:', err);
      toast.add({
        title: 'Gagal memuat verifikator',
        description: extractErrorMessage(err),
        color: 'error',
      });
    });
    fetchDivisiList();
  }
});

onMounted(() => {
  if (isOpen.value) {
    fetchVerifikatorBod().catch((err) => {
      console.error('[AddUsulanAksesBerkas] fetchVerifikatorBod failed:', err);
      toast.add({
        title: 'Gagal memuat verifikator',
        description: extractErrorMessage(err),
        color: 'error',
      });
    });
    fetchDivisiList();
  }
});
</script>

<template>
  <Modal v-model="isOpen" :hideDefaultFooter="true" size="xl">
    <template #title>
      <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
        Buat Usulan Akses Berkas
      </Heading>
    </template>

    <div class="space-y-1 p-1">
      <!-- Jenis Berkas -->
      <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-center sm:gap-0">
        <span class="w-full shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
          Jenis Berkas <span class="text-red-500">*</span>
        </span>
        <div class="flex-1">
          <URadioGroup v-model="jenisBerkas" :items="[
            { label: 'Berkas Aktif', value: JenisBerkas.AKTIF },
            { label: 'Berkas Inaktif', value: JenisBerkas.INAKTIF },
          ]" orientation="horizontal" />
        </div>
      </div>

      <!-- Divisi Pemberi -->
      <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-center sm:gap-0">
        <span class="w-full shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
          Divisi Pemberi <span class="text-red-500">*</span>
        </span>
        <!-- Inaktif: read-only, menampilkan Corporate Secretary Division -->
        <div v-if="isINAKTIF" class="flex-1">
          <div class="flex w-full items-center rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400">
            <UIcon name="i-lucide-building-2" class="mr-2 size-4 shrink-0" />
            <span>Corporate Secretary Division</span>
          </div>
        </div>
        <!-- Aktif: dropdown bisa dipilih -->
        <div v-else class="flex-1">
          <USelectMenu
            v-model="divisiPemberiId"
            :items="divisiList"
            value-key="organization"
            searchable
            :search-attributes="['shortText', 'longText', 'abbreviation', 'organization']"
            placeholder="Pilih divisi pemberi..."
            :search-input="{ placeholder: 'Cari divisi...' }"
            class="w-full"
            :content="{ style: { zIndex: 60 } } as any"
            :ui="{ base: 'w-full' } as any"
          >
            <template #item="{ item }">
              <div class="flex flex-col">
                <span class="text-sm">{{ item.shortText || item.longText || item.abbreviation || '-' }}</span>
                <span class="text-xs text-gray-400">Org ID: {{ item.organization }}{{ item.abbreviation ? ' · ' + item.abbreviation : '' }}</span>
              </div>
            </template>
          </USelectMenu>
        </div>
      </div>

      <!-- Tujuan Akses -->
      <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
        <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
          Tujuan Akses <span class="text-red-500">*</span>
        </span>
        <div class="flex-1">
          <UTextarea
            v-model="tujuanAkses"
            :rows="3"
            :maxlength="2000"
            autoresize
            :maxrows="8"
            class="w-full"
            placeholder="Jelaskan tujuan peminjaman akses berkas..."
          />
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {{ tujuanAkses.length }} / 2000 karakter
          </p>
        </div>
      </div>

      <!-- Durasi Akses -->
      <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-center sm:gap-0">
        <span class="w-full shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
          Durasi Akses <span class="text-red-500">*</span>
        </span>
        <div class="flex-1">
          <USelect v-model="durasiAkses" :items="durasiOptions" value-key="value" class="w-full" :content="{ style: { zIndex: 60 } } as any" />
          <!-- Custom: date picker + tanggal berakhir di kanan -->
          <div v-if="durasiAkses === DurasiPreset.CUSTOM" class="mt-2 flex items-center gap-2">
            <UInput
              v-model="customTanggalSelesai"
              type="date"
              :min="todayStr"
              class="flex-1"
            />
            <div v-if="customTanggalSelesai" class="flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700/40">
              <UIcon name="i-lucide-calendar-days" class="size-4 shrink-0 text-gray-500" />
              <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ formatTanggalID(customTanggalSelesai) }}</span>
            </div>
          </div>
          <!-- Preset: tanggal berakhir di bawah -->
          <div v-else-if="tanggalSelesaiStr" class="mt-2 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700/40">
            <UIcon name="i-lucide-calendar-days" class="size-4 shrink-0 text-gray-500" />
            <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ formatTanggalID(tanggalSelesaiStr) }}</span>
          </div>
        </div>
      </div>

      <!-- Verifikator Pengusul -->
      <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
        <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
          Verifikator Pengusul <span class="text-red-500">*</span>
          <span class="ml-1 text-xs text-gray-400">(pilih 1-3)</span>
        </span>
        <div class="flex-1">
          <!-- Selected verifikator chips -->
          <div v-if="selectedVerifikatorPersnums.length > 0" class="mb-2 flex flex-col gap-1.5">
            <div
              v-for="(persnum, idx) in sortedSelectedVerifikator"
              :key="persnum"
              class="flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-1.5 py-1 dark:border-gray-600 dark:bg-gray-700/30"
            >
              <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                {{ idx + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="truncate text-xs font-medium text-gray-800 dark:text-gray-200">
                  {{ getVerifikator(persnum)?.nama || `Persnum ${persnum}` }}
                </div>
                <div class="truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {{ getVerifikator(persnum)?.jabatan || getVerifikator(persnum)?.levelJabatan || '' }}
                </div>
              </div>
              <button
                type="button"
                @click="toggleVerifikator(persnum)"
                class="ml-0.5 shrink-0 text-gray-400 transition-colors hover:text-red-500"
                aria-label="Hapus verifikator"
              >
                <UIcon name="i-lucide-trash-2" class="size-3.5" />
              </button>
            </div>
          </div>

          <div v-if="verifikatorList.length === 0" class="py-2 text-sm text-gray-400">
            Tidak ada data managerial. Pastikan Anda memiliki akses.
          </div>
          <div v-else-if="availableVerifikator.length > 0" class="relative">
            <USelect
              :model-value="undefined"
              :items="availableVerifikator.map((v) => ({
                label: `${v.nama || `Persnum ${v.persnum}`} — ${v.jabatan || v.levelJabatan}`,
                value: String(v.persnum),
              }))"
              value-key="value"
              :placeholder="`+ Pilih verifikator (${selectedVerifikatorPersnums.length}/3)`"
              class="w-full"
              :content="{ style: { zIndex: 60 } } as any"
              @update:model-value="onVerifikatorSelectFromUSelect"
            />
          </div>
          <p v-else-if="selectedVerifikatorPersnums.length >= 3" class="text-xs text-gray-400">
            Maksimal 3 verifikator. Hapus salah satu untuk mengganti.
          </p>
          <p v-else class="text-xs text-gray-400">
            Semua verifikator tersedia sudah dipilih.
          </p>
        </div>
      </div>


    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
      <UButton variant="ghost" color="neutral" size="lg" :disabled="pending" @click="isOpen = false">Batal</UButton>
      <UButton
        color="primary"
        size="lg"
        :loading="pending"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        Kirim Usulan
      </UButton>
    </div>
  </Modal>
</template>