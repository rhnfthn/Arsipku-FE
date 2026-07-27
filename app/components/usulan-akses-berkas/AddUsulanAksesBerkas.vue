<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Modal from '~/components/Modal.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { JenisBerkas, DurasiPreset, JenisAkses, type LevelJabatan } from '~/types/usulan-akses-berkas';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [];
}>();

const { fetchVerifikator, verifikatorList, createUsulan, pending } = useUsulanAksesBerkas();
const { apiGet } = useApi();
const toast = useToast();

// ── Divisi list ───────────────────────────────────
interface DivisiOption {
  organization: number;
  shortText: string | null;
  longText: string | null;
  abbreviation: string | null;
}
const divisiList = ref<DivisiOption[]>([]);
const divisiLoading = ref(false);
const divisiSearch = ref('');

const filteredDivisi = computed(() => {
  if (!divisiSearch.value.trim()) return divisiList.value;
  const q = divisiSearch.value.toLowerCase();
  return divisiList.value.filter((d) =>
    (d.shortText || '').toLowerCase().includes(q) ||
    (d.longText || '').toLowerCase().includes(q) ||
    (d.abbreviation || '').toLowerCase().includes(q) ||
    String(d.organization).includes(q)
  );
});

const selectedDivisiLabel = computed(() => {
  if (!divisiPemberiId.value) return '';
  const d = divisiList.value.find((x) => x.organization === divisiPemberiId.value);
  if (!d) return String(divisiPemberiId.value);
  return d.shortText || d.longText || d.abbreviation || String(d.organization);
});

const fetchDivisiList = async () => {
  divisiLoading.value = true;
  try {
    const res = await apiGet<DivisiOption[]>('/organization');
    divisiList.value = (res?.data || res || []).filter((d: any) => d.organization != null);
  } catch (err) {
    console.error('[AddUsulanAksesBerkas] fetchDivisiList error:', err);
    divisiList.value = [];
  } finally {
    divisiLoading.value = false;
  }
};

const showDivisiDropdown = ref(false);
const selectDivisi = (org: number) => {
  divisiPemberiId.value = org;
  showDivisiDropdown.value = false;
  divisiSearch.value = '';
};

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// ── Form state ───────────────────────────────────
const jenisBerkas = ref<JenisBerkas>(JenisBerkas.AKTIF);
const divisiPemberiId = ref<number | null>(null);
const tujuanAkses = ref('');
const durasiAkses = ref<DurasiPreset>(DurasiPreset.EMPAT_BELAS_HARI);
const customTanggalSelesai = ref('');
const jenisAksesSelected = ref<JenisAkses[]>([JenisAkses.LIHAT]);
const suratUsulanFileId = ref('');
const penerimaAksesTambahan = ref<number[]>([]);
const penerimaInput = ref('');
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

const isINAKTIF = computed(() => jenisBerkas.value === JenisBerkas.INAKTIF);

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

const availableVerifikator = computed(() => {
  return verifikatorList.value.filter(
    (v) => !selectedVerifikatorPersnums.value.includes(v.persnum),
  );
});

const onVerifikatorSelect = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const persnum = Number(target.value);
  if (persnum && !isNaN(persnum)) {
    toggleVerifikator(persnum);
    target.value = '';
  }
};

const addPenerima = () => {
  const persnum = Number(String(penerimaInput.value).trim());
  if (!persnum || isNaN(persnum)) {
    toast.add({ title: 'Persnum tidak valid', color: 'error' });
    return;
  }
  if (penerimaAksesTambahan.value.includes(persnum)) {
    toast.add({ title: 'Persnum sudah ada di daftar', color: 'error' });
    return;
  }
  penerimaAksesTambahan.value.push(persnum);
  penerimaInput.value = '';
};

const removePenerima = (persnum: number) => {
  const idx = penerimaAksesTambahan.value.indexOf(persnum);
  if (idx >= 0) penerimaAksesTambahan.value.splice(idx, 1);
};

const resetForm = () => {
  jenisBerkas.value = JenisBerkas.AKTIF;
  divisiPemberiId.value = null;
  tujuanAkses.value = '';
  durasiAkses.value = DurasiPreset.EMPAT_BELAS_HARI;
  customTanggalSelesai.value = '';
  jenisAksesSelected.value = [JenisAkses.LIHAT];
  suratUsulanFileId.value = '';
  penerimaAksesTambahan.value = [];
  penerimaInput.value = '';
  selectedVerifikatorPersnums.value = [];
};

const canSubmit = computed(() => {
  if (tujuanAkses.value.trim().length < 30) return false;
  if (jenisAksesSelected.value.length === 0) return false;
  if (selectedVerifikatorPersnums.value.length === 0) return false;
  if (!isINAKTIF.value && !divisiPemberiId.value) return false;
  if (durasiAkses.value === DurasiPreset.CUSTOM && !customTanggalSelesai.value) return false;
  return true;
});

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
      suratUsulanFileId: suratUsulanFileId.value || undefined,
      verifikatorPengusul,
      penerimaAksesTambahan:
        penerimaAksesTambahan.value.length > 0
          ? penerimaAksesTambahan.value
          : undefined,
    });
    resetForm();
    emit('created');
  } catch (err: any) {
    toast.add({
      title: 'Gagal membuat usulan',
      description: err?.message || 'Terjadi kesalahan',
      color: 'error',
    });
  }
};

watch(isOpen, (val) => {
  if (val) {
    fetchVerifikator();
    fetchDivisiList();
  }
});

onMounted(() => {
  if (isOpen.value) {
    fetchVerifikator();
    fetchDivisiList();
  }
});
</script>

<template>
  <Modal v-model="isOpen" :hideDefaultFooter="true" size="2xl">
    <template #title>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        Buat Usulan Akses Berkas
      </h2>
    </template>

    <div class="space-y-5 max-h-[70vh] overflow-y-auto p-1">
      <!-- Jenis Berkas -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Jenis Berkas <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-3">
          <label
            class="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors"
            :class="jenisBerkas === JenisBerkas.AKTIF
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-300 dark:border-gray-600'"
          >
            <input
              v-model="jenisBerkas"
              type="radio"
              :value="JenisBerkas.AKTIF"
              class="hidden"
            />
            <span>Aktif</span>
          </label>
          <label
            class="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors"
            :class="jenisBerkas === JenisBerkas.INAKTIF
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-300 dark:border-gray-600'"
          >
            <input
              v-model="jenisBerkas"
              type="radio"
              :value="JenisBerkas.INAKTIF"
              class="hidden"
            />
            <span>Inaktif</span>
          </label>
        </div>
        <p v-if="isINAKTIF" class="mt-1 text-xs text-blue-600 dark:text-blue-400">
          Untuk berkas inaktif, divisi pemberi otomatis di-set ke Corporate Secretary Division.
        </p>
      </div>

      <!-- Divisi Pemberi (hanya AKTIF) -->
      <div v-if="!isINAKTIF">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Divisi Pemberi <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <button
            type="button"
            @click="showDivisiDropdown = !showDivisiDropdown"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary text-left flex items-center justify-between"
          >
            <span :class="divisiPemberiId ? 'text-gray-900 dark:text-white' : 'text-gray-400'">
              {{ divisiPemberiId ? selectedDivisiLabel : 'Pilih divisi pemberi...' }}
            </span>
            <svg class="w-4 h-4 text-gray-400" :class="{ 'rotate-180': showDivisiDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-if="showDivisiDropdown"
            class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-hidden"
          >
            <div class="p-2 border-b border-gray-100 dark:border-gray-700">
              <input
                v-model="divisiSearch"
                type="text"
                placeholder="Cari divisi..."
                class="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-primary"
              />
            </div>
            <div class="max-h-48 overflow-y-auto">
              <div v-if="divisiLoading" class="px-3 py-4 text-sm text-gray-400 text-center">Memuat...</div>
              <div v-else-if="filteredDivisi.length === 0" class="px-3 py-4 text-sm text-gray-400 text-center">Tidak ada divisi ditemukan</div>
              <button
                v-for="d in filteredDivisi"
                :key="d.organization"
                type="button"
                @click="selectDivisi(d.organization)"
                class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                :class="divisiPemberiId === d.organization ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700 dark:text-gray-300'"
              >
                <div>{{ d.shortText || d.longText || d.abbreviation || '-' }}</div>
                <div class="text-xs text-gray-400">Org ID: {{ d.organization }}{{ d.abbreviation ? ' · ' + d.abbreviation : '' }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tujuan Akses -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tujuan Akses <span class="text-red-500">*</span>
          <span class="ml-1 text-xs text-gray-400">({{ tujuanAkses.length }} / 1000 karakter)</span>
        </label>
        <textarea
          v-model="tujuanAkses"
          rows="3"
          maxlength="1000"
          placeholder="Jelaskan tujuan peminjaman akses berkas (minimal 30 karakter)..."
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary"
        ></textarea>
      </div>

      <!-- Durasi Akses -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Durasi Akses <span class="text-red-500">*</span>
        </label>
        <select
          v-model="durasiAkses"
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary"
        >
          <option v-for="opt in durasiOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <input
          v-if="durasiAkses === DurasiPreset.CUSTOM"
          v-model="customTanggalSelesai"
          type="date"
          class="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary"
        />
      </div>

      <!-- Jenis Akses -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Jenis Akses <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-3">
          <label
            v-for="opt in jenisAksesOptions"
            :key="opt.value"
            class="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors"
            :class="jenisAksesSelected.includes(opt.value)
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-300 dark:border-gray-600'"
          >
            <input
              type="checkbox"
              :checked="jenisAksesSelected.includes(opt.value)"
              @change="toggleJenisAkses(opt.value)"
              class="hidden"
            />
            <span>{{ opt.label }}</span>
          </label>
        </div>
      </div>

      <!-- Verifikator Pengusul -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Verifikator Pengusul <span class="text-red-500">*</span>
          <span class="ml-1 text-xs text-gray-400">(pilih 1-3 managerial di divisi Anda)</span>
        </label>

        <!-- Selected verifikator chips -->
        <div v-if="selectedVerifikatorPersnums.length > 0" class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="(persnum, idx) in selectedVerifikatorPersnums"
            :key="persnum"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="{
                'bg-blue-500': getVerifikator(persnum)?.levelJabatan === 'AVP',
                'bg-purple-500': getVerifikator(persnum)?.levelJabatan === 'VP',
                'bg-red-500': getVerifikator(persnum)?.levelJabatan === 'EVP',
              }"
            ></span>
            <span>{{ idx + 1 }}. {{ getVerifikator(persnum)?.nama || `Persnum ${persnum}` }}</span>
            <span class="text-gray-400">·</span>
            <span class="text-gray-500">{{ getVerifikator(persnum)?.levelJabatan }}</span>
            <button
              type="button"
              @click="toggleVerifikator(persnum)"
              class="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>

        <!-- Dropdown select -->
        <div v-if="verifikatorList.length === 0" class="text-sm text-gray-400 py-2">
          Tidak ada data managerial. Pastikan Anda memiliki akses.
        </div>
        <div v-else-if="selectedVerifikatorPersnums.length < 3" class="relative">
          <select
            @change="onVerifikatorSelect($event)"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary"
          >
            <option value="">+ Pilih verifikator ({{ selectedVerifikatorPersnums.length }}/3)...</option>
            <option
              v-for="v in availableVerifikator"
              :key="v.persnum"
              :value="v.persnum"
            >
              {{ v.nama || `Persnum ${v.persnum}` }} — {{ v.jabatan || v.levelJabatan }} ({{ v.levelJabatan }})
            </option>
          </select>
        </div>
        <p v-else class="text-xs text-amber-600 dark:text-amber-400">
          Maksimal 3 verifikator terpilih. Hapus salah satu untuk menambah yang baru.
        </p>
      </div>

      <!-- Penerima Akses Tambahan -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Penerima Akses Tambahan (opsional)
        </label>
        <div class="flex gap-2">
          <input
            v-model="penerimaInput"
            type="number"
            placeholder="Masukkan persnum..."
            class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary"
            @keyup.enter="addPenerima"
          />
          <button
            @click="addPenerima"
            type="button"
            class="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Tambah
          </button>
        </div>
        <div v-if="penerimaAksesTambahan.length > 0" class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="p in penerimaAksesTambahan"
            :key="p"
            class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
          >
            {{ p }}
            <button @click="removePenerima(p)" type="button" class="text-red-500 hover:text-red-700">
              ×
            </button>
          </span>
        </div>
      </div>

      <!-- Surat Usulan File ID -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Surat Usulan File ID (opsional)
        </label>
        <input
          v-model="suratUsulanFileId"
          type="text"
          placeholder="S3 file ID surat usulan..."
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        @click="isOpen = false"
        type="button"
        class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        Batal
      </button>
      <button
        @click="handleSubmit"
        :disabled="!canSubmit || pending"
        type="button"
        class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ pending ? 'Menyimpan...' : 'Kirim Usulan' }}
      </button>
    </div>
  </Modal>
</template>