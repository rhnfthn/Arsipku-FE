<template>
  <div class="flex-1 overflow-y-auto space-y-4">
    <!-- Card Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-[#457fb6]/10">
            <UIcon name="i-lucide-file-stack" class="w-5 h-5 text-[#457fb6]" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total Surat</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ penerimaList.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <UIcon name="i-lucide-user" class="w-5 h-5 text-blue-500" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-500 dark:text-gray-400">Pengirim</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ pengirimNama }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ pengirimJabatan }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <UIcon name="i-lucide-tag" class="w-5 h-5 text-amber-500" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-500 dark:text-gray-400">Klasifikasi</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ konsep?.klasifikasiName || '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Daftar Penerima -->
    <div>
      <div class="mb-2 flex items-center justify-between gap-3">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Daftar Penerima ({{ penerimaList.length }})</h4>
        <UButton label="Lihat Preview" color="primary" variant="soft" icon="i-lucide-eye" size="sm" @click="showPreview = true" />
      </div>
      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-[300px] overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">No</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Tertuju</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Alamat</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">No. Telepon</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Email</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in penerimaList" :key="item.no" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-3 py-2 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{{ item.no }}</td>
              <td class="px-3 py-2 text-gray-900 dark:text-white font-medium border-b border-gray-100 dark:border-gray-700">{{ getPenerimaName(item) }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ getTertujuEksternal(item)?.alamat || item.alamatPenerima || item.alamat || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ getTertujuEksternal(item)?.telepon || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ getTertujuEksternal(item)?.email || item.emailTertuju || item.email || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showVerifierModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showVerifierModal = false" />
        <div class="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
          <div class="p-6"><div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"><div class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"><div class="flex items-center gap-3"><span class="flex size-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"><UIcon name="i-lucide-users" class="size-5 text-primary-600 dark:text-primary-400" /></span><div><h2 class="text-lg font-semibold text-gray-900 dark:text-white">Atasan Managerial Berjenjang <span class="text-red-500">*</span></h2><p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Pilih satu atau lebih atasan. Urutan pemilihan = urutan verifikasi.</p></div></div><UButton v-if="selectedVerifiers.length < 3" label="Tambah" icon="i-lucide-user-round-plus" color="neutral" variant="outline" size="sm" @click="showVerifierInput = true" /></div><div class="space-y-5 px-5 py-5"><div v-if="selectedVerifiers.length < 3 && showVerifierInput"><input v-model="verifierSearch" type="text" placeholder="Ketik nama atau persnum atasan..." class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white" @focus="showVerifierInput = true" /><div v-if="verifierLoading" class="py-5 text-center text-sm text-gray-400">Memuat data atasan...</div><div v-else-if="verifierSearch.trim()" class="mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700"><button v-for="person in filteredVerifiers" :key="person.position" type="button" class="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700" @click="toggleVerifier(person)"><span><span class="block text-sm font-medium text-gray-900 dark:text-white">{{ person.nama }}</span><span class="block text-xs text-gray-500">{{ person.jabatan }}</span></span><UIcon v-if="isVerifierSelected(person)" name="i-lucide-check-circle" class="size-5 text-green-500" /></button><p v-if="!filteredVerifiers.length" class="p-4 text-center text-sm text-gray-400">Verifikator tidak ditemukan.</p></div></div><div v-if="selectedVerifiers.length" class="space-y-4"><div v-for="(person, index) in selectedVerifiers" :key="person.position" class="flex items-center gap-4"><span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-md">{{ index + 1 }}</span><div class="min-w-0 flex-1"><p class="truncate text-base font-bold uppercase tracking-normal text-gray-900 dark:text-white">{{ person.nama }}</p><p class="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{{ person.jabatan }}</p></div><UButton color="error" variant="ghost" icon="i-lucide-trash-2" size="sm" @click="toggleVerifier(person)" /></div></div><p v-if="selectedVerifiers.length" class="text-sm text-gray-500">{{ selectedVerifiers.length }} atasan dipilih. Verifikasi: {{ selectedVerifiers.map((person) => person.nama).join(' → ') }}</p></div></div></div>
          <div class="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-700"><UButton label="Batal" color="neutral" variant="outline" @click="showVerifierModal = false" /><UButton label="Ajukan Verifikasi" color="primary" :loading="generating" :disabled="!selectedVerifiers.length || generating" @click="submitVerifiers" /></div>
        </div>
      </div>
    </Teleport>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div v-if="showPreview" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPreview = false" />
        <div class="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Preview Perwakilan Surat</h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="showPreview = false" />
          </div>
          <div class="p-4 overflow-y-auto">
            <div class="mb-4">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Preview untuk penerima
              </label>
              <select
                v-model.number="previewIndex"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option v-for="option in previewOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <SdeMasalLetterPreview
              :konsep="konsep"
              :penerima-list="penerimaList"
              :template="template"
              :penerima-index="previewIndex"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Lanjut ke verifikasi -->
    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <UButton
          label="Lanjut ke Verifikasi"
          color="primary"
          size="lg"
          icon="i-lucide-shield-check"
          class="font-bold"
          :loading="generating"
          @click="openVerificationSelection"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import SdeMasalLetterPreview from './SdeMasalLetterPreview.vue';
import type { SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';
import { useTertujuEksternal } from '~/composables/useTertujuEksternal';
import { useApi } from '~/composables/useApi';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  generating: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit-verification', verifikators: any[]): void;
}>();

const showPreview = ref(false);
const previewIndex = ref<number>(0);
const showVerifierModal = ref(false);
const showVerifierInput = ref(false);
const verifierLoading = ref(false);
const verifierSearch = ref('');
const selectedVerifiers = ref<any[]>([]);
const verifierList = ref<any[]>([]);
const { apiGet } = useApi();
const toast = useToast();
const { data: tertujuEksternal, fetchTertujuEksternal } = useTertujuEksternal();

// PengirimName format: "Nama - Jabatan" (dipisah " - ")
const pengirimParts = computed(() =>
  (props.konsep?.pengirimName || '').split(' - ').map((part) => part.trim()).filter(Boolean),
);
const pengirimNama = computed(() => pengirimParts.value[0] || '-');
const pengirimJabatan = computed(() => pengirimParts.value.slice(1).join(' - ') || '-');

onMounted(() => {
  fetchTertujuEksternal().catch((error) => {
    console.warn('Gagal memuat master tertuju eksternal untuk daftar penerima SDE Masal', error);
  });
});

const getTertujuEksternal = (penerima: SdeMasalPenerima) => {
  const raw = String(penerima.idTertuju || penerima.tertuju || '').trim();
  const kode = raw.split(/\s*(?:—|-)\s*/)[0].padStart(3, '0');
  return tertujuEksternal.value.find((item) => String(item.kode ?? '').trim().padStart(3, '0') === kode);
};

const getPenerimaName = (penerima: SdeMasalPenerima) =>
  getTertujuEksternal(penerima)?.nama || penerima.tertuju || penerima.idTertuju || '-';

const filteredVerifiers = computed(() => {
  const query = verifierSearch.value.toLowerCase().trim();
  return !query ? verifierList.value : verifierList.value.filter((person) => `${person.nama} ${person.jabatan}`.toLowerCase().includes(query));
});
const isVerifierSelected = (person: any) => selectedVerifiers.value.some((item) => item.position === person.position);
const toggleVerifier = (person: any) => {
  const index = selectedVerifiers.value.findIndex((item) => item.position === person.position);
  if (index >= 0) return selectedVerifiers.value.splice(index, 1);
  if (selectedVerifiers.value.length >= 3) return toast.add({ title: 'Maksimal 3 verifikator', color: 'error' });
  selectedVerifiers.value.push(person);
  verifierSearch.value = '';
  showVerifierInput.value = false;
};
const openVerificationSelection = async () => {
  showVerifierModal.value = true;
  const storageKey = `sde-masal-wizard:${props.konsep?.parentNaskahId || 'new'}`;
  const draft = JSON.parse(localStorage.getItem(storageKey) || '{}');
  selectedVerifiers.value = Array.isArray(draft.verifikators) ? draft.verifikators : [];
  showVerifierInput.value = selectedVerifiers.value.length === 0;
  if (verifierList.value.length) return;
  verifierLoading.value = true;
  try {
    const result: any = await apiGet(`/org-data/getdata?tgl=${new Date().toISOString().slice(0, 10)}`);
    const rows = result?.data?.barisData || result?.barisData || [];
    verifierList.value = rows.filter((row: any) => row.persnum_person || row.persnum).map((row: any) => ({ persnum: String(row.persnum_person || row.persnum), position: String(row.position), nama: row.persnum_person_text || row.nama || '-', jabatan: row.position_text || '-' })).filter((person: any) => person.persnum && person.nama !== '-');
  } catch { toast.add({ title: 'Gagal memuat verifikator', color: 'error' }); } finally { verifierLoading.value = false; }
};
const saveVerifiers = () => {
  const storageKey = `sde-masal-wizard:${props.konsep?.parentNaskahId || 'new'}`;
  const draft = JSON.parse(localStorage.getItem(storageKey) || '{}');
  localStorage.setItem(storageKey, JSON.stringify({ ...draft, verifikators: selectedVerifiers.value }));
  showVerifierModal.value = false;
  toast.add({ title: 'Verifikator tersimpan', description: `${selectedVerifiers.value.length} verifikator dipilih.`, color: 'success' });
};
const submitVerifiers = () => {
  saveVerifiers();
  emit('submit-verification', selectedVerifiers.value);
};

const previewOptions = computed(() =>
  props.penerimaList.map((p, idx) => ({
    label: `${p.no || idx + 1}. ${getPenerimaName(p)}`,
    value: idx,
  })),
);
</script>
