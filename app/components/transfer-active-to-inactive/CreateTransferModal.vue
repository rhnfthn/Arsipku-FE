<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-10">
      <div class="fixed inset-0 bg-black/50" @click="close"></div>
      <!-- Modal -->
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[720px] flex flex-col z-10 mb-10 max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 rounded-t-2xl">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ editData ? 'Edit Usulan' : 'Usul Pindah Arsip ke Inaktif' }}
          </h3>
          <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-5 overflow-y-auto">
          <!-- Atasan Managerial — Alur Verifikasi (max 3) -->
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <div class="flex items-center gap-2">
                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                  <UIcon name="i-lucide-users" class="size-5 text-primary-600 dark:text-primary-400" />
                </span>
                <div>
                  <h2 class="font-semibold text-gray-900 dark:text-white">Atasan Managerial <span class="text-red-500">*</span></h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pilih satu atau lebih atasan. Urutan pemilihan = urutan verifikasi (berjenjang).</p>
                </div>
              </div>
              <UButton
                v-if="selectedAtasanList.length < 3"
                icon="i-lucide-user-round-plus"
                variant="outline"
                size="xs"
                @click="openAtasanInput"
              >Tambah</UButton>
            </div>
            <div class="px-5 py-5">
              <!-- Timeline daftar atasan yang sudah dipilih -->
              <div v-if="selectedAtasanList.length > 0" class="mb-4">
                <div
                  v-for="(a, idx) in selectedAtasanList"
                  :key="a.persnum"
                  class="relative flex gap-3 pb-4 last:pb-0"
                >
                  <div
                    v-if="idx < selectedAtasanList.length - 1"
                    class="absolute left-4 top-8 h-[calc(100%-1.5rem)] w-px bg-primary-200 dark:bg-primary-900/40"
                  />
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white shadow-sm">
                    {{ idx + 1 }}
                  </div>
                  <div class="min-w-0 flex-1 flex items-start justify-between gap-2 pt-1">
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ a.name }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ a.positionText }}</p>
                    </div>
                    <button
                      type="button"
                      @click="removeAtasan(idx)"
                      class="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                      title="Hapus atasan"
                    >
                      <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Input pencarian di bawah daftar (sembunyi setelah pilih, muncul lagi via tombol Tambah) -->
              <div v-if="selectedAtasanList.length < 3 && showAtasanInput" ref="atasanDropdownRef" class="relative">
                <input
                  v-model="atasanSearch"
                  type="text"
                  :placeholder="atasanLoading ? 'Memuat data atasan...' : 'Ketik nama atau persnum atasan...'"
                  :disabled="atasanLoading"
                  @focus="openAtasanDropdown"
                  @input="onAtasanSearchInput"
                  @keydown.escape="atasanDropdownOpen = false"
                  class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
                />
                <div
                  v-if="atasanDropdownOpen && filteredAtasan.length > 0"
                  class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-[240px] overflow-y-auto"
                >
                  <button
                    v-for="a in filteredAtasan"
                    :key="a.position"
                    type="button"
                    @click="toggleAtasan(a)"
                    class="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center justify-between"
                  >
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">{{ a.name }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ a.persnum }} — {{ a.positionText }}</div>
                    </div>
                    <UIcon v-if="isAtasanSelected(a)" name="i-lucide-check-circle" class="w-5 h-5 text-green-500 shrink-0" />
                  </button>
                </div>
                <div
                  v-if="atasanDropdownOpen && filteredAtasan.length === 0 && !atasanLoading"
                  class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 text-center text-sm text-gray-400"
                >
                  Tidak ada atasan ditemukan
                </div>
                <div
                  v-if="atasanDropdownOpen && atasanLoading"
                  class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 text-center text-sm text-gray-400"
                >
                  <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin inline mr-1" /> Memuat...
                </div>
              </div>
              <p v-if="selectedAtasanList.length > 0" class="text-xs text-gray-500 mt-2">
                {{ selectedAtasanList.length }} atasan dipilih. Verifikasi: {{ selectedAtasanList.map(a => a.name).join(' → ') }}
              </p>
            </div>
          </div>

          <!-- Arsip Aktif — Multi Select -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Arsip Aktif <span class="text-red-500">*</span>
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Pilih arsip dengan retensi aktif habis. Bisa pilih lebih dari satu.
            </p>

            <!-- Timeline daftar arsip yang dipilih -->
            <div v-if="selectedArsipList.length > 0" class="mb-3">
              <div
                v-for="(a, idx) in selectedArsipList"
                :key="a.id"
                class="relative flex gap-3 pb-3 last:pb-0"
              >
                <!-- Garis penghubung -->
                <div
                  v-if="idx < selectedArsipList.length - 1"
                  class="absolute left-4 top-8 h-[calc(100%-1.5rem)] w-px bg-green-600/30"
                />
                <!-- Icon arsip (bukan angka) -->
                <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
                  <UIcon name="i-lucide-file-text" class="w-4 h-4" />
                </div>
                <!-- Konten arsip -->
                <div class="min-w-0 flex-1 flex items-start justify-between gap-2 pt-1">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ a.kodeBerkas ?? a.judulBerkas }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ a.judulBerkas }}</p>
                    <p v-if="a.tanggalRetensiAktifBerakhir" class="text-xs text-gray-400 mt-0.5">Retensi habis: {{ formatDate(a.tanggalRetensiAktifBerakhir) }}</p>
                  </div>
                  <button
                    type="button"
                    @click="removeArsip(idx)"
                    class="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    title="Hapus arsip"
                  >
                    <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div ref="arsipDropdownRef" class="relative">
              <div class="flex gap-2">
                <input
                  v-model="arsipSearch"
                  type="text"
                  :placeholder="arsipLoading ? 'Memuat data arsip...' : 'Ketik judul atau kode berkas...'"
                  :disabled="arsipLoading"
                  @focus="openArsipDropdown"
                  @input="arsipDropdownOpen = true"
                  @keydown.escape="arsipDropdownOpen = false"
                  class="flex-1 h-11 px-4 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
                />
                <button
                  type="button"
                  @click="loadArsipRetensiHabis"
                  :disabled="arsipLoading"
                  class="px-4 h-11 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <UIcon name="i-lucide-refresh-cw" class="w-4 h-4" :class="arsipLoading ? 'animate-spin' : ''" />
                </button>
              </div>
              <div
                v-if="arsipDropdownOpen && filteredArsip.length > 0"
                class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-[240px] overflow-y-auto"
              >
                <button
                  v-for="a in filteredArsip"
                  :key="a.id"
                  type="button"
                  @click="toggleArsip(a)"
                  class="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center justify-between"
                >
                  <div class="min-w-0">
                    <div class="font-medium text-gray-900 dark:text-white truncate">{{ a.kodeBerkas ?? '-' }} — {{ a.judulBerkas }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Retensi habis: {{ formatDate(a.tanggalRetensiAktifBerakhir) }}</div>
                  </div>
                  <UIcon v-if="isArsipSelected(a)" name="i-lucide-check-circle" class="w-5 h-5 text-green-500 shrink-0" />
                </button>
              </div>
              <div
                v-if="arsipDropdownOpen && arsipOptions.length === 0 && !arsipLoading"
                class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 text-center text-sm text-gray-400"
              >
                Tidak ada arsip dengan retensi aktif habis
              </div>
            </div>
          </div>

          <!-- Keterangan -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan</label>
            <textarea
              v-model="form.keterangan"
              rows="3"
              placeholder="Tambahkan keterangan usulan (opsional)..."
              class="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none"
            ></textarea>
          </div>

          <!-- File Arsip Terpilih -->
          <div v-if="selectedArsipList.length > 0" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-files" class="w-4 h-4" />
                File Arsip Terpilih ({{ totalFileCount }})
              </h4>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-gray-700 max-h-[200px] overflow-y-auto">
              <div v-for="a in selectedArsipList" :key="a.id" class="px-4 py-2">
                <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{{ a.kodeBerkas ?? '-' }} — {{ a.judulBerkas }}</div>
                <div v-if="a.files && a.files.length > 0" class="space-y-1">
                  <div
                    v-for="(f, fidx) in a.files"
                    :key="fidx"
                    class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <UIcon name="i-lucide-file-text" class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate flex-1">{{ f.nama ?? f.naskahId }}</span>
                    <button
                      v-if="f.url"
                      type="button"
                      @click="previewFile(f)"
                      class="text-[#457fb6] hover:underline shrink-0"
                    >Lihat</button>
                  </div>
                </div>
                <div v-else class="text-xs text-gray-400 italic">Tidak ada file lampiran</div>
              </div>
            </div>
          </div>

          <!-- Preview Ringkasan -->
          <div v-if="selectedAtasanList.length > 0 || selectedArsipList.length > 0" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Ringkasan Usulan</h4>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              <span class="text-gray-400">Atasan ({{ selectedAtasanList.length }}):</span>
              {{ selectedAtasanList.map(a => a.name).join(' → ') || '-' }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              <span class="text-gray-400">Arsip ({{ selectedArsipList.length }}):</span>
              {{ selectedArsipList.map(a => a.kodeBerkas ?? a.judulBerkas).join(', ') || '-' }}
            </div>
            <div v-if="form.keterangan" class="text-sm text-gray-600 dark:text-gray-300">
              <span class="text-gray-400">Keterangan:</span> {{ form.keterangan }}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2 shrink-0 bg-white dark:bg-gray-800 rounded-b-2xl">
          <button @click="close" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Batal
          </button>
          <button
            @click="submit(true)"
            :disabled="submitting || !canSubmit"
            class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {{ submitting ? 'Menyimpan...' : 'Simpan Draft' }}
          </button>
          <button
            @click="submit(false)"
            :disabled="submitting || !canSubmit"
            class="px-5 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50"
          >
            {{ submitting ? 'Mengirim...' : 'Simpan & Kirim ke Atasan' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useApi } from '~/composables/useApi';
import { useArsipDinamis } from '~/composables/useArsipDinamis';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import type {
  TransferActiveToInactive,
  AtasanManagerialOption,
  ArsipRetensiHabisOption,
} from '~/types/transfer-active-to-inactive';
import { formatDate } from '~/utils/transfer-status';

const props = defineProps<{
  modelValue: boolean;
  editData?: TransferActiveToInactive | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [];
  updated: [];
}>();

const { apiGet } = useApi();
const { create, update } = useTransferActiveToInactive();
const { getDaftarNaskah } = useArsipDinamis();

const submitting = ref(false);
const form = reactive({ keterangan: '' });

// Atasan — multi select
const atasanOptions = ref<AtasanManagerialOption[]>([]);
const atasanLoading = ref(false);
const atasanSearch = ref('');
const atasanDropdownOpen = ref(false);
const selectedAtasanList = ref<AtasanManagerialOption[]>([]);
const atasanDropdownRef = ref<HTMLElement | null>(null);
const showAtasanInput = ref(true);

// Arsip — multi select
const arsipOptions = ref<ArsipRetensiHabisOption[]>([]);
const arsipLoading = ref(false);
const arsipSearch = ref('');
const arsipDropdownOpen = ref(false);
const selectedArsipList = ref<(ArsipRetensiHabisOption & { files?: any[] })[]>([]);
const arsipDropdownRef = ref<HTMLElement | null>(null);

const filteredAtasan = computed(() => {
  const q = atasanSearch.value.trim().toLowerCase();
  if (!q) return atasanOptions.value.slice(0, 50);
  return atasanOptions.value
    .filter((a) =>
      String(a.name ?? '').toLowerCase().includes(q) ||
      String(a.persnum ?? '').includes(q) ||
      String(a.positionText ?? '').toLowerCase().includes(q)
    )
    .slice(0, 50);
});

const filteredArsip = computed(() => {
  const q = arsipSearch.value.trim().toLowerCase();
  if (!q) return arsipOptions.value.slice(0, 50);
  return arsipOptions.value
    .filter((a) => a.judulBerkas.toLowerCase().includes(q) || (a.kodeBerkas ?? '').toLowerCase().includes(q))
    .slice(0, 50);
});

const totalFileCount = computed(() =>
  selectedArsipList.value.reduce((sum, a) => sum + (a.files?.length ?? 0), 0),
);

const canSubmit = computed(() => selectedAtasanList.value.length > 0 && selectedArsipList.value.length > 0);

const close = () => emit('update:modelValue', false);

const openAtasanDropdown = () => {
  atasanDropdownOpen.value = true;
};

const openAtasanInput = () => {
  showAtasanInput.value = true;
  atasanDropdownOpen.value = true;
  nextTick(() => {
    const input = atasanDropdownRef.value?.querySelector('input');
    if (input) input.focus();
  });
};

const openArsipDropdown = () => {
  arsipDropdownOpen.value = true;
  if (arsipOptions.value.length === 0 && !arsipLoading.value) loadArsipRetensiHabis();
};

const onAtasanSearchInput = () => {
  atasanDropdownOpen.value = true;
};

const isAtasanSelected = (a: AtasanManagerialOption) =>
  selectedAtasanList.value.some((s) => s.persnum === a.persnum);

const isArsipSelected = (a: ArsipRetensiHabisOption) =>
  selectedArsipList.value.some((s) => s.id === a.id);

const toggleAtasan = (a: AtasanManagerialOption) => {
  const idx = selectedAtasanList.value.findIndex((s) => s.persnum === a.persnum);
  if (idx >= 0) {
    selectedAtasanList.value.splice(idx, 1);
  } else {
    // Batasi maksimal 3 atasan
    if (selectedAtasanList.value.length >= 3) return;
    selectedAtasanList.value.push({ ...a });
  }
  atasanSearch.value = '';
  atasanDropdownOpen.value = false;
  // Sembunyikan dropdown setelah memilih; user tekan tombol Tambah untuk atasan berikutnya
  if (idx < 0) showAtasanInput.value = false;
};

const toggleArsip = async (a: ArsipRetensiHabisOption) => {
  const idx = selectedArsipList.value.findIndex((s) => s.id === a.id);
  if (idx >= 0) {
    selectedArsipList.value.splice(idx, 1);
  } else {
    const item = { ...a, files: [] as any[] };
    selectedArsipList.value.push(item);
    loadArsipFiles(item);
  }
  arsipSearch.value = '';
  arsipDropdownOpen.value = true;
};

const removeAtasan = (idx: number) => {
  selectedAtasanList.value.splice(idx, 1);
  // Jika tidak ada atasan tersisa, tampilkan kembali dropdown input
  if (selectedAtasanList.value.length === 0) showAtasanInput.value = true;
};

const removeArsip = (idx: number) => {
  selectedArsipList.value.splice(idx, 1);
};

/** Load naskah/files untuk arsip terpilih. */
const loadArsipFiles = async (arsip: ArsipRetensiHabisOption & { files?: any[] }) => {
  try {
    const res: any = await getDaftarNaskah(arsip.id, { limit: 50 });
    const data = res?.data?.data ?? res?.data ?? [];
    arsip.files = (Array.isArray(data) ? data : []).map((n: any) => ({
      naskahId: n.naskahId ?? n.naskah_id ?? n.id,
      nama: n.perihal ?? n.nomorSurat ?? n.nomor_surat ?? n.naskahId,
      url: n.finalPdf ?? n.final_pdf ?? null,
    }));
  } catch (e) {
    console.error('Gagal memuat file arsip:', e);
    arsip.files = [];
  }
};

const previewFile = (f: any) => {
  if (f.url) {
    window.open(f.url, '_blank');
  } else {
    alert('File tidak tersedia untuk dilihat.');
  }
};

const loadAtasanManagerial = async () => {
  atasanLoading.value = true;
  try {
    const tgl = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const res: any = await apiGet(`/org-data/pengirim/managerial?tgl=${tgl}`, {}, { skipCache: true });
    const data = res?.data?.data ?? res?.data ?? [];
    if (res?.success && Array.isArray(data)) {
      atasanOptions.value = data.map((r: any) => ({
        position: Number(r.position ?? r.position_id ?? 0),
        persnum: Number(r.persnum ?? r.persnum_person ?? r.relation_persnum ?? 0),
        name: r.persnum_person_text ?? r.name ?? r.label ?? '-',
        positionText: r.position_text ?? r.positionText ?? r.labelJob ?? '-',
      }));
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

const loadArsipRetensiHabis = async () => {
  arsipLoading.value = true;
  try {
    // Sumber data: arsip-tersedia (query langsung ke DB) — bukan list berkas,
    // karena berkas tertutup sudah tidak tampil di list berkas user biasa.
    const res: any = await apiGet(
      '/transfer-active-to-inactive/arsip-tersedia',
      {},
      { skipCache: true }
    );
    const data = res?.data ?? res ?? [];
    let arsipList = Array.isArray(data) ? data : [];

    // Ambil daftar arsip yang sudah ada usulan transfer (semua status kecuali DITOLAK)
    // agar arsip yang sudah diusulkan tidak bisa dipilih lagi.
    try {
      const gabunganRes: any = await apiGet('/transfer-active-to-inactive/gabungan', {}, { skipCache: true });
      const gabunganRows = gabunganRes?.data ?? [];
      // Kumpulkan arsip ID dari usulan yang sudah dibuat (isUsulan=true, status bukan DITOLAK)
      const arsipSudahUsulan = new Set<string>();
      for (const row of gabunganRows) {
        if (row.isUsulan && row.status !== 'DITOLAK_ATASAN') {
          // row.id adalah usulan ID, bukan arsip ID — perlu cek arsipIds
          // Tapi gabungan tidak return arsipId langsung, jadi kita exclude by kodeBerkas
          if (row.kodeBerkas) arsipSudahUsulan.add(row.kodeBerkas);
        }
      }
      arsipList = arsipList.filter((b: any) => {
        const kode = b.kodeBerkas ?? b.kode_berkas ?? null;
        return !kode || !arsipSudahUsulan.has(kode);
      });
    } catch (e) {
      console.warn('Gagal memuat data usulan existing, menampilkan semua arsip:', e);
    }

    arsipOptions.value = arsipList.map((b: any) => ({
      id: b.id,
      judulBerkas: b.perihal ?? b.judulBerkas ?? b.judul_berkas ?? '-',
      kodeBerkas: b.kodeBerkas ?? b.kode_berkas ?? null,
      tanggalRetensiAktifBerakhir:
        b.tanggalRetensiAktifHabis ??
        b.tanggalRetensiAktifBerakhir ??
        b.tanggal_retensi_aktif_berakhir ??
        null,
      kategoriBerkas: b.kategoriBerkas ?? b.kategori_berkas ?? null,
    }));
  } catch (e) {
    console.error('Gagal memuat arsip retensi habis:', e);
    arsipOptions.value = [];
  } finally {
    arsipLoading.value = false;
  }
};

const resetForm = () => {
  form.keterangan = '';
  selectedAtasanList.value = [];
  atasanSearch.value = '';
  showAtasanInput.value = true;
  selectedArsipList.value = [];
  arsipSearch.value = '';
  atasanDropdownOpen.value = false;
  arsipDropdownOpen.value = false;
};

const fillFromEdit = (data: TransferActiveToInactive) => {
  // Atasan: reconstruct from approvalLevels if available, else from legacy fields
  if (data.approvalLevels && data.approvalLevels.length > 0) {
    selectedAtasanList.value = data.approvalLevels.map((l) => ({
      position: l.atasanPositionId ?? 0,
      persnum: l.atasanPersnum,
      name: l.atasanName,
      positionText: l.atasanPositionText ?? '',
    }));
  } else {
    const hasLegacyAtasan =
      Number(data.atasanPersnum) > 0 &&
      String(data.atasanName ?? '').trim() !== '' &&
      String(data.atasanName ?? '').trim() !== '-';

    selectedAtasanList.value = hasLegacyAtasan
      ? [{
          position: data.atasanPositionId ?? 0,
          persnum: data.atasanPersnum,
          name: data.atasanName,
          positionText: '',
        }]
      : [];
  }
  showAtasanInput.value = selectedAtasanList.value.length === 0;
  // Arsip: reconstruct from arsipIds if available, else from legacy fields
  if (data.arsipIds && data.arsipIds.length > 0) {
    selectedArsipList.value = data.arsipIds.map((a) => ({
      id: a.id,
      judulBerkas: a.perihal,
      kodeBerkas: a.kode,
      tanggalRetensiAktifBerakhir: a.tanggalRetensiHabis,
      kategoriBerkas: null,
      files: [],
    }));
    selectedArsipList.value.forEach((item) => loadArsipFiles(item));
  } else {
    selectedArsipList.value = [{
      id: data.arsipId,
      judulBerkas: data.arsipPerihal,
      kodeBerkas: data.arsipKode,
      tanggalRetensiAktifBerakhir: data.tanggalRetensiAktifHabis,
      kategoriBerkas: null,
      files: [],
    }];
    loadArsipFiles(selectedArsipList.value[0]);
  }
  form.keterangan = data.keterangan ?? '';
};

const submit = async (asDraft: boolean) => {
  if (selectedAtasanList.value.length === 0 || selectedArsipList.value.length === 0) return;
  submitting.value = true;
  try {
    const payload = {
      atasanList: selectedAtasanList.value.map((a) => ({
        persnum: a.persnum,
        name: a.name,
        positionId: a.position,
        positionText: a.positionText,
      })),
      arsipList: selectedArsipList.value.map((a) => ({
        id: a.id,
        perihal: a.judulBerkas,
        kode: a.kodeBerkas ?? undefined,
        tanggalRetensiHabis: a.tanggalRetensiAktifBerakhir
          ? String(a.tanggalRetensiAktifBerakhir).split('T')[0]
          : undefined,
      })),
      keterangan: form.keterangan || undefined,
      submit: !asDraft,
    };

    if (props.editData) {
      await update(props.editData.id, payload);
      emit('updated');
    } else {
      await create(payload);
      emit('created');
    }
    close();
  } catch (e: any) {
    console.error('Gagal menyimpan usulan:', e);
    const msg = e?.data?.message ?? e?.message ?? 'Gagal menyimpan usulan. Silakan coba lagi.';
    alert(msg);
  } finally {
    submitting.value = false;
  }
};

const onClickOutside = (e: MouseEvent) => {
  if (atasanDropdownRef.value && !atasanDropdownRef.value.contains(e.target as Node)) {
    atasanDropdownOpen.value = false;
  }
  if (arsipDropdownRef.value && !arsipDropdownRef.value.contains(e.target as Node)) {
    arsipDropdownOpen.value = false;
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (atasanDropdownOpen.value) { atasanDropdownOpen.value = false; return; }
    if (arsipDropdownOpen.value) { arsipDropdownOpen.value = false; return; }
    close();
  }
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm();
      loadAtasanManagerial();
      loadArsipRetensiHabis();
      if (props.editData) fillFromEdit(props.editData);
      document.addEventListener('keydown', onKeydown);
    } else {
      document.removeEventListener('keydown', onKeydown);
    }
  },
);

onMounted(() => {
  document.addEventListener('click', onClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside);
  document.removeEventListener('keydown', onKeydown);
});
</script>