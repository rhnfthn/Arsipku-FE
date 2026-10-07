<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Buat Usulan Pemindahan Arsip Inaktif" :items="items" />
      <NuxtLink to="/maintenance/transfer-inactive-file" class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Batal
      </NuxtLink>
    </div>
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6 max-w-3xl mx-auto">
      <form @submit.prevent="onSubmit(false)" class="space-y-5">
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tanggal Usulan</label>
          <input v-model="form.tanggalUsulan" type="date" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Sekretaris (Pengusul)</label>
          <input :value="userLabel" disabled class="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Divisi</label>
          <input :value="divisiLabel" disabled class="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Atasan Managerial <span class="text-red-500">*</span></label>
          <!-- Searchable Dropdown -->
          <div ref="atasanDropdownRef" class="relative">
            <input
              v-model="atasanSearch"
              type="text"
              :placeholder="atasanLoading ? 'Memuat data atasan...' : 'Ketik nama atau e-NIK atasan...'"
              :disabled="atasanLoading"
              @focus="atasanDropdownOpen = true"
              @input="onAtasanSearchInput"
              class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
            />
            <!-- Selected indicator -->
            <div v-if="selectedAtasan && !atasanDropdownOpen" class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-green-500" />
            </div>
            <!-- Dropdown list -->
            <div
              v-if="atasanDropdownOpen && filteredAtasan.length > 0"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <button
                v-for="a in filteredAtasan"
                :key="a.position"
                type="button"
                @click="selectAtasan(a)"
                class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div class="font-medium text-gray-900 dark:text-white">{{ a.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ a.persnum }} — {{ a.positionText }}</div>
              </button>
            </div>
            <!-- Empty state -->
            <div
              v-if="atasanDropdownOpen && filteredAtasan.length === 0 && !atasanLoading"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-sm text-gray-400"
            >
              Tidak ditemukan atasan dengan "{{ atasanSearch }}"
            </div>
            <!-- Loading -->
            <div
              v-if="atasanDropdownOpen && atasanLoading"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-sm text-gray-400"
            >
              <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin inline mr-1" /> Memuat...
            </div>
          </div>
          <!-- Selected atasan display -->
          <div v-if="selectedAtasan" class="mt-1.5 text-xs text-green-600 dark:text-green-400">
            Terpilih: {{ selectedAtasan.name }} — {{ selectedAtasan.positionText }}
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pilih Arsip (Retensi Aktif Habis) <span class="text-red-500">*</span></label>
          <!-- Searchable Dropdown Arsip -->
          <div ref="arsipDropdownRef" class="relative">
            <div class="flex gap-1">
              <input
                v-model="arsipSearch"
                type="text"
                :placeholder="arsipLoading ? 'Memuat data arsip...' : 'Ketik judul atau kode berkas...'"
                :disabled="arsipLoading"
                @focus="onArsipFocus"
                @input="onArsipSearchInput"
                class="flex-1 h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
              <button
                type="button"
                @click="refreshArsip"
                :disabled="arsipLoading"
                title="Refresh daftar arsip"
                class="px-3 h-10 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <UIcon name="i-lucide-refresh-cw" class="w-4 h-4" :class="arsipLoading ? 'animate-spin' : ''" />
              </button>
            </div>
            <div v-if="selectedArsip && !arsipDropdownOpen" class="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-green-500" />
            </div>
            <!-- Dropdown list -->
            <div
              v-if="arsipDropdownOpen && filteredArsip.length > 0"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <button
                v-for="a in filteredArsip"
                :key="a.id"
                type="button"
                @click="selectArsip(a)"
                class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900 dark:text-white flex-1 truncate">{{ a.judulBerkas }}</span>
                  <span
                    v-if="isUrgent(a)"
                    class="px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 font-medium whitespace-nowrap"
                  >
                    Mendesak
                  </span>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ a.kodeBerkas ?? '-' }} · Jatuh tempo inaktif: {{ formatDate(a.tanggalRetensiInaktifBerakhir) }}
                </div>
              </button>
            </div>
            <!-- Empty: tidak ada arsip sama sekali -->
            <div
              v-if="arsipDropdownOpen && arsipOptions.length === 0 && !arsipLoading"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-sm text-gray-400"
            >
              Tidak ada arsip pada masa retensi inaktif
            </div>
            <!-- Empty: ada arsip tapi filter kosong -->
            <div
              v-if="arsipDropdownOpen && arsipOptions.length > 0 && filteredArsip.length === 0 && !arsipLoading"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-sm text-gray-400"
            >
              Tidak ditemukan arsip dengan "{{ arsipSearch }}"
            </div>
            <!-- Loading -->
            <div
              v-if="arsipDropdownOpen && arsipLoading"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-sm text-gray-400"
            >
              <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin inline mr-1" /> Memuat data arsip...
            </div>
          </div>
          <div v-if="selectedArsip" class="mt-1.5 text-xs text-green-600 dark:text-green-400">
            Terpilih: {{ selectedArsip.judulBerkas }}
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tanggal Retensi Aktif Habis</label>
          <input v-model="form.tanggalRetensiAktifHabis" type="date" disabled class="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Keterangan</label>
          <textarea v-model="form.keterangan" rows="3" placeholder="Keterangan..." class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="onSubmit(true)" :disabled="submitting" class="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">{{ submitting ? 'Menyimpan...' : 'Simpan Draft' }}</button>
          <button type="submit" :disabled="submitting" class="px-5 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50">{{ submitting ? 'Mengirim...' : 'Kirim ke Atasan' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useTransferInactiveFile } from '~/composables/useTransferInactiveFile';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import { useArsipDinamis } from '~/composables/useArsipDinamis';

definePageMeta({ middleware: ['auth'] });

const { create } = useTransferInactiveFile();
const { user } = useAuth();
const { apiGet } = useApi();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemindahan Arsip Inaktif', to: '/maintenance/transfer-inactive-file' },
  { label: 'Buat Usulan', to: '/maintenance/transfer-inactive-file/create' },
];

const userLabel = computed(() => (user.value as any)?.nama ?? (user.value as any)?.persnum ?? '-');
const divisiLabel = computed(() => (user.value as any)?.organizationText ?? '-');

// ─── Atasan Managerial searchable dropdown ─────────────────────────────
interface AtasanOption {
  position: number;
  persnum: number;
  label: string;
  name: string;
  positionText: string;
}
const atasanOptions = ref<AtasanOption[]>([]);
const atasanLoading = ref(false);
const atasanSearch = ref('');
const atasanDropdownOpen = ref(false);
const selectedAtasan = ref<AtasanOption | null>(null);
const atasanDropdownRef = ref<HTMLElement | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Arsip searchable dropdown ─────────────────────────────────────────
interface ArsipOption {
  id: string;
  judulBerkas: string;
  kodeBerkas: string | null;
  tanggalRetensiAktifBerakhir: string | null;
  tanggalRetensiInaktifBerakhir: string | null;
  kategoriBerkas: string | null;
}
const arsipOptions = ref<ArsipOption[]>([]);
const arsipLoading = ref(false);
const arsipSearch = ref('');
const arsipDropdownOpen = ref(false);
const selectedArsip = ref<ArsipOption | null>(null);
const arsipDropdownRef = ref<HTMLElement | null>(null);

const filteredArsip = computed(() => {
  const q = arsipSearch.value.trim().toLowerCase();
  // Jika keyword kosong, tampilkan semua (limit 50)
  if (!q) return arsipOptions.value.slice(0, 50);
  // Jika user mengetik, filter dari data yang sudah dimuat
  return arsipOptions.value
    .filter((a) =>
      a.judulBerkas.toLowerCase().includes(q) ||
      (a.kodeBerkas ?? '').toLowerCase().includes(q) ||
      (a.kategoriBerkas ?? '').toLowerCase().includes(q)
    )
    .slice(0, 50);
});

/** Apakah ada arsip yang masa retensi inaktifnya sudah lewat (mendesa). */
const isUrgent = (a: ArsipOption) => {
  if (!a.tanggalRetensiInaktifBerakhir) return false;
  const d = new Date(a.tanggalRetensiInaktifBerakhir);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

const onArsipSearchInput = () => {
  if (selectedArsip.value && arsipSearch.value !== selectedArsip.value.judulBerkas) {
    selectedArsip.value = null;
    form.arsipId = '';
    form.arsipPerihal = '';
    form.arsipKode = '';
    form.tanggalRetensiAktifHabis = '';
  }
  arsipDropdownOpen.value = true;
};

/** Saat dropdown fokus, fetch data jika belum ada. */
const onArsipFocus = () => {
  arsipDropdownOpen.value = true;
  if (arsipOptions.value.length === 0 && !arsipLoading.value) {
    fetchArsipRetensiHabis();
  }
};

/** Refresh daftar arsip. */
const refreshArsip = () => {
  fetchArsipRetensiHabis();
};

const selectArsip = (a: ArsipOption) => {
  selectedArsip.value = a;
  arsipSearch.value = a.judulBerkas;
  arsipDropdownOpen.value = false;
  form.arsipId = a.id;
  form.arsipPerihal = a.judulBerkas;
  form.arsipKode = a.kodeBerkas ?? '';
  form.tanggalRetensiAktifHabis = a.tanggalRetensiAktifBerakhir
    ? a.tanggalRetensiAktifBerakhir.split('T')[0]
    : '';
};

const formatDate = (d: string | null) => {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Fetch berkas dengan status closed_retensi_aktif (retensi aktif sudah habis). */
const fetchArsipRetensiHabis = async () => {
  arsipLoading.value = true;
  try {
    const { getBerkasList } = useArsipDinamis();
    // Sumber pemindahan inaktif = berkas yang sudah masuk fase retensi inaktif
    // (hasil transfer aktif→inaktif), bukan yang masih closed_retensi_aktif.
    const res: any = await getBerkasList({ status: 'retensi_inaktif', limit: 100 });
    // Backend: { success, data: { data: [...], meta } } | { data: [...] } | [...]
    const data = res?.data?.data ?? res?.data ?? res ?? [];
    arsipOptions.value = (Array.isArray(data) ? data : []).map((b: any) => ({
      id: b.id,
      judulBerkas: b.judulBerkas ?? b.judul_berkas ?? '-',
      kodeBerkas: b.kodeBerkas ?? b.kode_berkas ?? null,
      tanggalRetensiAktifBerakhir: b.tanggalRetensiAktifBerakhir ?? b.tanggal_retensi_aktif_berakhir ?? null,
      tanggalRetensiInaktifBerakhir: b.tanggalRetensiInaktifBerakhir ?? b.tanggal_retensi_inaktif_berakhir ?? null,
      kategoriBerkas: b.kategoriBerkas ?? b.kategori_berkas ?? null,
    }));
  } catch (e) {
    console.error('Gagal memuat arsip retensi habis:', e);
    arsipOptions.value = [];
  } finally {
    arsipLoading.value = false;
  }
};

/** Filtered atasan berdasarkan search (real-time, case-insensitive). */
const filteredAtasan = computed(() => {
  const q = atasanSearch.value.trim().toLowerCase();
  if (!q) return atasanOptions.value.slice(0, 50); // limit 50 saat kosong
  return atasanOptions.value
    .filter((a) =>
      a.name.toLowerCase().includes(q) ||
      String(a.persnum).includes(q) ||
      a.positionText.toLowerCase().includes(q)
    )
    .slice(0, 50);
});

/** Handler saat user mengetik di input search. */
const onAtasanSearchInput = () => {
  // Reset selected jika user mengubah input setelah memilih
  if (selectedAtasan.value && atasanSearch.value !== selectedAtasan.value.name) {
    selectedAtasan.value = null;
    form.atasanPersnum = undefined;
    form.atasanName = '';
    form.atasanPositionId = undefined;
  }
  atasanDropdownOpen.value = true;
};

/** Pilih atasan dari dropdown. */
const selectAtasan = (a: AtasanOption) => {
  selectedAtasan.value = a;
  atasanSearch.value = a.name;
  atasanDropdownOpen.value = false;
  form.atasanPersnum = a.persnum;
  form.atasanName = a.name;
  form.atasanPositionId = a.position;
};

/** Click outside handler untuk tutup dropdown. */
const onClickOutside = (e: MouseEvent) => {
  if (atasanDropdownRef.value && !atasanDropdownRef.value.contains(e.target as Node)) {
    atasanDropdownOpen.value = false;
    if (selectedAtasan.value) {
      atasanSearch.value = selectedAtasan.value.name;
    }
  }
  if (arsipDropdownRef.value && !arsipDropdownRef.value.contains(e.target as Node)) {
    arsipDropdownOpen.value = false;
    if (selectedArsip.value) {
      arsipSearch.value = selectedArsip.value.judulBerkas;
    }
  }
};

/** Fetch semua atasan managerial dari API. */
const fetchAtasanManagerial = async () => {
  atasanLoading.value = true;
  try {
    const tgl = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const res: any = await apiGet(`/org-data/pengirim/managerial?tgl=${tgl}`, {}, { skipCache: true });
    if (res?.success && Array.isArray(res.data)) {
      atasanOptions.value = res.data
        .map((r: any) => ({
          position: Number(r.position),
          persnum: Number(r.persnum ?? r.persnum_person ?? 0),
          label: `${r.persnum_person_text ?? r.name ?? '-'} — ${r.position_text ?? '-'}`,
          name: r.persnum_person_text ?? r.name ?? '-',
          positionText: r.position_text ?? '-',
        }))
        // Buang entri tanpa nama (fallback "-") — hanya tampilkan atasan yang punya nama
        .filter((a: { name: string }) => {
          const n = (a.name ?? '').trim();
          return n !== '' && n !== '-';
        });
    } else {
      atasanOptions.value = [];
    }
  } catch (e) {
    console.error('Gagal memuat atasan managerial:', e);
    atasanOptions.value = [];
  } finally {
    atasanLoading.value = false;
  }
};

onMounted(() => {
  fetchAtasanManagerial();
  fetchArsipRetensiHabis();
  document.addEventListener('click', onClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside);
  if (debounceTimer) clearTimeout(debounceTimer);
});

const form = reactive({
  tanggalUsulan: new Date().toISOString().split('T')[0],
  atasanPersnum: undefined as number | undefined,
  atasanName: '' as string,
  atasanPositionId: undefined as number | undefined,
  arsipId: '',
  arsipPerihal: '',
  arsipKode: '' as string,
  tanggalRetensiAktifHabis: '',
  keterangan: '',
});
const submitting = ref(false);

const onSubmit = async (asDraft: boolean) => {
  if (!form.atasanPersnum || !form.arsipId) return;
  submitting.value = true;
  try {
    await create({ ...form, submit: !asDraft });
    await navigateTo('/maintenance/transfer-inactive-file');
  } catch (e) { console.error('Gagal:', e); alert('Gagal membuat usulan'); }
  finally { submitting.value = false; }
};
</script>