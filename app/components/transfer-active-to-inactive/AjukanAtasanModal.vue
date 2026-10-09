<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-10">
      <div class="fixed inset-0 bg-black/50" @click="close"></div>
      <!-- Modal -->
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[720px] flex flex-col z-10 mb-10 max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 rounded-t-2xl">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ajukan ke Atasan Managerial</h3>
          <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-5 overflow-y-auto">
          <!-- Info arsip yang akan diusulkan (read-only) -->
          <div class="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50 p-4">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <UIcon name="i-lucide-file-text" class="w-4 h-4 text-[#457fb6]" />
              Arsip yang akan diusulkan
            </h4>
            <div class="flex items-start gap-3">
              <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
                <UIcon name="i-lucide-file-text" class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ arsipKode ?? arsipPerihal ?? '-' }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ arsipPerihal ?? '-' }}</p>
                <p v-if="tanggalRetensiHabis" class="text-xs text-gray-400 mt-0.5">Retensi habis: {{ formatDate(tanggalRetensiHabis) }}</p>
              </div>
            </div>
          </div>

          <!-- Atasan Managerial — Alur Verifikasi (max 3) -->
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <div class="flex items-center gap-2">
                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                  <UIcon name="i-lucide-users" class="size-5 text-primary-600 dark:text-primary-400" />
                </span>
                <div>
                  <h2 class="font-semibold text-gray-900 dark:text-white">Atasan Managerial <span class="text-red-500">*</span></h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pilih satu atau lebih atasan. Urutan pemilihan = urutan verifikasi.</p>
                </div>
              </div>
              <UButton
                v-if="selectedAtasanList.length < 3"
                icon="i-lucide-user-round-plus"
                variant="outline"
                size="xs"
                @click="showAtasanInput = true"
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

              <!-- Input pencarian (sembunyi setelah pilih, muncul lagi via tombol Tambah) -->
              <div v-if="selectedAtasanList.length < 3 && showAtasanInput" ref="atasanDropdownRef" class="relative">
                <input
                  v-model="atasanSearch"
                  type="text"
                  :placeholder="atasanLoading ? 'Memuat data atasan...' : 'Ketik nama atau persnum atasan...'"
                  :disabled="atasanLoading"
                  @focus="atasanDropdownOpen = true"
                  @input="atasanDropdownOpen = true"
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

          <!-- Keterangan -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan</label>
            <textarea
              v-model="keterangan"
              rows="3"
              placeholder="Tambahkan keterangan usulan (opsional)..."
              class="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none"
            ></textarea>
          </div>

          <!-- Pejabat Pihak Pertama BAC (pengirim) -->
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-pen-line" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Pejabat Pihak Pertama BAC <span class="text-red-500">*</span></h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pejabat yang menandatangani Berita Acara di sisi pengirim.</p>
              </div>
            </div>
            <div class="px-5 py-4">
              <div v-if="pihakPertama" class="flex items-center justify-between gap-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ pihakPertama.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ pihakPertama.positionText }}</p>
                </div>
                <button
                  type="button"
                  @click="pihakPertama = null"
                  class="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                  title="Ganti pejabat"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                </button>
              </div>
              <div v-else ref="pihakPertamaDropdownRef" class="relative">
                <input
                  v-model="pihakPertamaSearch"
                  type="text"
                  :placeholder="pejabatLoading ? 'Memuat data pejabat...' : 'Ketik nama atau persnum pejabat...'"
                  :disabled="pejabatLoading"
                  @focus="pihakPertamaDropdownOpen = true"
                  @input="pihakPertamaDropdownOpen = true"
                  @keydown.escape="pihakPertamaDropdownOpen = false"
                  class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
                />
                <div
                  v-if="pihakPertamaDropdownOpen && filteredPihakPertama.length > 0"
                  class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-[240px] overflow-y-auto"
                >
                  <button
                    v-for="p in filteredPihakPertama"
                    :key="p.position"
                    type="button"
                    @click="selectPihakPertama(p)"
                    class="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div class="font-medium text-gray-900 dark:text-white">{{ p.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ p.persnum }} — {{ p.positionText }}</div>
                  </button>
                </div>
                <div
                  v-if="pihakPertamaDropdownOpen && filteredPihakPertama.length === 0 && !pejabatLoading"
                  class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 text-center text-sm text-gray-400"
                >
                  Tidak ada pejabat ditemukan
                </div>
              </div>
            </div>
          </div>

          <!-- Tembusan (khusus EVP ke atas) -->
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <div class="flex items-center gap-2">
                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                  <UIcon name="i-lucide-copy" class="size-5 text-primary-600 dark:text-primary-400" />
                </span>
                <div>
                  <h2 class="font-semibold text-gray-900 dark:text-white">Tembusan</h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pejabat tembusan Berita Acara (khusus AVP ke atas).</p>
                </div>
              </div>
              <UButton
                icon="i-lucide-user-round-plus"
                variant="outline"
                size="xs"
                @click="showTembusanInput = true"
              >Tambah</UButton>
            </div>
            <div class="px-5 py-4">
              <div v-if="tembusanList.length > 0" class="mb-3 space-y-2">
                <div
                  v-for="(t, idx) in tembusanList"
                  :key="t.persnum"
                  class="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ t.positionText }}</p>
                  </div>
                  <button
                    type="button"
                    @click="tembusanList.splice(idx, 1)"
                    class="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    title="Hapus tembusan"
                  >
                    <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div v-if="showTembusanInput" ref="tembusanDropdownRef" class="relative">
                <input
                  v-model="tembusanSearch"
                  type="text"
                  :placeholder="pejabatLoading ? 'Memuat data pejabat...' : 'Ketik nama atau persnum pejabat AVP ke atas...'"
                  :disabled="pejabatLoading"
                  @focus="tembusanDropdownOpen = true"
                  @input="tembusanDropdownOpen = true"
                  @keydown.escape="tembusanDropdownOpen = false"
                  class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
                />
                <div
                  v-if="tembusanDropdownOpen && filteredTembusan.length > 0"
                  class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-[240px] overflow-y-auto"
                >
                  <button
                    v-for="p in filteredTembusan"
                    :key="p.position"
                    type="button"
                    @click="toggleTembusan(p)"
                    class="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center justify-between"
                  >
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">{{ p.name }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ p.persnum }} — {{ p.positionText }}</div>
                    </div>
                    <UIcon v-if="isTembusanSelected(p)" name="i-lucide-check-circle" class="w-5 h-5 text-green-500 shrink-0" />
                  </button>
                </div>
                <div
                  v-if="tembusanDropdownOpen && filteredTembusan.length === 0 && !pejabatLoading"
                  class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 text-center text-sm text-gray-400"
                >
                  Tidak ada pejabat AVP ke atas ditemukan
                </div>
              </div>
            </div>
          </div>

          <!-- Preview Ringkasan -->
          <div v-if="selectedAtasanList.length > 0" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Ringkasan Usulan</h4>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              <span class="text-gray-400">Atasan ({{ selectedAtasanList.length }}):</span>
              {{ selectedAtasanList.map(a => a.name).join(' → ') || '-' }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              <span class="text-gray-400">Arsip (1):</span> {{ arsipKode ?? arsipPerihal ?? '-' }}
            </div>
            <div v-if="pihakPertama" class="text-sm text-gray-600 dark:text-gray-300">
              <span class="text-gray-400">Pihak Pertama BAC:</span> {{ pihakPertama.name }}
            </div>
            <div v-if="tembusanList.length > 0" class="text-sm text-gray-600 dark:text-gray-300">
              <span class="text-gray-400">Tembusan ({{ tembusanList.length }}):</span>
              {{ tembusanList.map(t => t.name).join(', ') }}
            </div>
            <div v-if="keterangan" class="text-sm text-gray-600 dark:text-gray-300">
              <span class="text-gray-400">Keterangan:</span> {{ keterangan }}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2 shrink-0 bg-white dark:bg-gray-800 rounded-b-2xl">
          <button @click="close" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Batal
          </button>
          <button
            @click="submit"
            :disabled="submitting || selectedAtasanList.length === 0 || !pihakPertama"
            class="px-5 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50"
          >
            {{ submitting ? 'Mengirim...' : 'Kirim' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';
import { formatDate } from '~/utils/transfer-status';

const props = defineProps<{
  modelValue: boolean;
  /** Usulan existing (mode DRAFT) — PATCH saat submit. */
  usulan?: TransferActiveToInactive | null;
  /** Berkas belum-usulan — POST usulan baru saat submit. */
  berkas?: any | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submitted: [];
}>();

const { apiGet, apiPost, apiPatch } = useApi();
const { user, getProfile } = useAuth();

const submitting = ref(false);
const keterangan = ref('');

// Atasan — multi select
interface AtasanOption {
  position: number;
  persnum: number;
  name: string;
  positionText: string;
}
const atasanOptions = ref<AtasanOption[]>([]);
const atasanLoading = ref(false);
const atasanSearch = ref('');
const atasanDropdownOpen = ref(false);
const selectedAtasanList = ref<AtasanOption[]>([]);
const atasanDropdownRef = ref<HTMLElement | null>(null);
const showAtasanInput = ref(true);

// ── Pejabat Pihak Pertama BAC (pengirim) ──
const pihakPertama = ref<AtasanOption | null>(null);
const pihakPertamaSearch = ref('');
const pihakPertamaDropdownOpen = ref(false);
const pihakPertamaDropdownRef = ref<HTMLElement | null>(null);

// ── Daftar pejabat global untuk pihak pertama dan Tembusan ──
const pejabatOptions = ref<AtasanOption[]>([]);
const pejabatLoading = ref(false);

// ── Tembusan (khusus AVP ke atas) ──
const tembusanList = ref<AtasanOption[]>([]);
const tembusanSearch = ref('');
const tembusanDropdownOpen = ref(false);
const tembusanDropdownRef = ref<HTMLElement | null>(null);
const showTembusanInput = ref(true);

/** Sumber global pejabat managerial (chief=1), terpisah dari rantai atasan pengusul. */
const loadPejabatOptions = async () => {
  pejabatLoading.value = true;
  try {
    const tgl = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const res: any = await apiGet(`/org-data/pengirim/managerial?tgl=${tgl}`, {}, { skipCache: true });
    const data = res?.data?.data ?? res?.data ?? [];
    pejabatOptions.value = Array.isArray(data)
      ? data
          .map((r: any) => ({
            position: Number(r.position ?? r.position_id ?? 0),
            persnum: Number(r.persnum ?? r.persnum_person ?? r.relation_persnum ?? 0),
            name: r.persnum_person_text ?? r.name ?? r.label ?? '-',
            positionText: r.position_text ?? r.positionText ?? r.labelJob ?? '-',
          }))
          .filter((p: AtasanOption) => p.name.trim() !== '' && p.name.trim() !== '-')
      : [];
  } catch (e) {
    console.error('Gagal memuat daftar pejabat managerial:', e);
    pejabatOptions.value = [];
  } finally {
    pejabatLoading.value = false;
  }
};

/** Filter khusus AVP ke atas. */
const isEvpKeAtas = (p: AtasanOption): boolean => {
  const t = (p.positionText || '').toUpperCase();
  return /\bAVP\b|\bVP\b|\bEVP\b|DIREKTUR|CEO|PRESIDEN/.test(t);
};

const filteredPihakPertama = computed(() => {
  const q = pihakPertamaSearch.value.trim().toLowerCase();
  const base = pejabatOptions.value;
  if (!q) return base;
  return base.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      String(p.persnum).includes(q) ||
      p.positionText.toLowerCase().includes(q),
  );
});

const filteredTembusan = computed(() => {
  const q = tembusanSearch.value.trim().toLowerCase();
  const base = pejabatOptions.value.filter(isEvpKeAtas);
  if (!q) return base;
  return base.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      String(p.persnum).includes(q) ||
      p.positionText.toLowerCase().includes(q),
  );
});

const selectPihakPertama = (p: AtasanOption) => {
  pihakPertama.value = p;
  pihakPertamaSearch.value = '';
  pihakPertamaDropdownOpen.value = false;
};

const isTembusanSelected = (p: AtasanOption) =>
  tembusanList.value.some((t) => t.persnum === p.persnum);

const toggleTembusan = (p: AtasanOption) => {
  if (isTembusanSelected(p)) {
    tembusanList.value = tembusanList.value.filter((t) => t.persnum !== p.persnum);
  } else {
    tembusanList.value.push(p);
  }
  tembusanSearch.value = '';
  tembusanDropdownOpen.value = false;
  showTembusanInput.value = tembusanList.value.length < 5;
};

// Info arsip (read-only)
const arsipKode = computed(() => props.usulan?.arsipKode ?? props.berkas?.kodeBerkas ?? null);
const arsipPerihal = computed(() => props.usulan?.arsipPerihal ?? props.berkas?.judulBerkas ?? null);
const tanggalRetensiHabis = computed(
  () => props.usulan?.tanggalRetensiAktifHabis ?? props.berkas?.tanggalRetensiAktifBerakhir ?? null,
);

const filteredAtasan = computed(() => {
  const q = atasanSearch.value.trim().toLowerCase();
  if (!q) return atasanOptions.value;
  return atasanOptions.value.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      String(a.persnum).includes(q) ||
      a.positionText.toLowerCase().includes(q),
  );
});

const isAtasanSelected = (a: AtasanOption) =>
  selectedAtasanList.value.some((s) => s.persnum === a.persnum);

const toggleAtasan = (a: AtasanOption) => {
  if (isAtasanSelected(a)) {
    selectedAtasanList.value = selectedAtasanList.value.filter((s) => s.persnum !== a.persnum);
  } else if (selectedAtasanList.value.length < 3) {
    selectedAtasanList.value.push(a);
  }
  atasanSearch.value = '';
  atasanDropdownOpen.value = false;
  // Setelah memilih (atau membatalkan pilihan) satu nama, tutup input;
  // tambah jenjang berikutnya dilakukan eksplisit lewat tombol Tambah.
  showAtasanInput.value = false;
};

const removeAtasan = (idx: number) => {
  selectedAtasanList.value.splice(idx, 1);
  showAtasanInput.value = true;
};

const close = () => emit('update:modelValue', false);

const loadAtasanManagerial = async () => {
  atasanLoading.value = true;
  try {
    if (!user.value) await getProfile();

    // Pilihan atasan harus mengikuti rantai jabatan pengusul, bukan seluruh
    // pejabat managerial di organisasi. Pada draft, pengusul adalah sekretaris
    // yang tercatat di usulan; saat membuat usulan baru, gunakan pengguna aktif.
    const proposerPersnum = Number(props.usulan?.sekretarisPersnum ?? user.value?.persnum);
    if (!proposerPersnum) {
      atasanOptions.value = [];
      return;
    }

    const myPositionRes: any = await apiGet(
      `/org-data/my-position?persnum=${encodeURIComponent(String(proposerPersnum))}`,
      {},
      { skipCache: true },
    );
    const myPosition = myPositionRes?.data?.data ?? myPositionRes?.data ?? myPositionRes;
    let positionId = Number(myPosition?.position ?? myPosition?.position_id ?? 0);

    // Fallback hanya aman bila pengusul adalah pengguna yang sedang login.
    // Untuk draft milik orang lain, jangan memakai jabatan pengguna saat ini.
    if (!positionId && proposerPersnum === Number(user.value?.persnum)) {
      positionId = Number(user.value?.position ?? user.value?.position_id ?? 0);
    }
    if (!positionId) {
      atasanOptions.value = [];
      console.warn('Posisi pengusul tidak ditemukan; daftar atasan tidak dapat dimuat.');
      return;
    }

    const res: any = await apiGet(
      `/org-data/atasan-managerial/${encodeURIComponent(String(positionId))}`,
      {},
      { skipCache: true },
    );
    const data = res?.data?.data ?? res?.data ?? [];
    if (Array.isArray(data)) {
      atasanOptions.value = data
        .map((r: any) => ({
          position: Number(r.position ?? r.position_id ?? 0),
          persnum: Number(r.persnum ?? r.persnum_person ?? r.relation_persnum ?? 0),
          name: r.persnum_person_text ?? r.name ?? r.label ?? '-',
          positionText: r.position_text ?? r.positionText ?? r.labelJob ?? '-',
        }))
        .filter((a: AtasanOption) => {
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

/** Pre-fill catatan & atasan saat modal dibuka. */
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    keterangan.value = props.usulan?.keterangan ?? '';
    const levels = (props.usulan as any)?.approvalLevels ?? [];
    if (levels.length > 0) {
      selectedAtasanList.value = [...levels]
        .sort((a: any, b: any) => a.urutan - b.urutan)
        .map((l: any) => ({
          position: Number(l.atasanPositionId ?? 0),
          persnum: Number(l.atasanPersnum),
          name: l.atasanName,
          positionText: l.atasanPositionText ?? '-',
        }));
    } else {
      selectedAtasanList.value = [];
    }
    // Draft dengan atasan terpilih hanya menampilkan input setelah tombol Tambah.
    showAtasanInput.value = selectedAtasanList.value.length === 0;
    // Pre-fill pejabat BAC dari usulan existing
    const u: any = props.usulan;
    if (u?.bacPihakPertamaPersnum) {
      pihakPertama.value = {
        position: 0,
        persnum: Number(u.bacPihakPertamaPersnum),
        name: u.bacPihakPertamaName ?? '-',
        positionText: u.bacPihakPertamaJabatan ?? '-',
      };
    } else {
      pihakPertama.value = null;
    }
    tembusanList.value = (u?.bacTembusan ?? []).map((t: any) => ({
      position: 0,
      persnum: Number(t.persnum),
      name: t.name ?? '-',
      positionText: t.jabatan ?? '-',
    }));
    showTembusanInput.value = tembusanList.value.length < 5;
    if (atasanOptions.value.length === 0) loadAtasanManagerial();
    if (pejabatOptions.value.length === 0) loadPejabatOptions();
  },
);

const submit = async () => {
  if (selectedAtasanList.value.length === 0) return;
  if (!pihakPertama.value) return;
  submitting.value = true;
  try {
    const arsipId = props.usulan?.arsipId ?? props.berkas?.id;
    const payload = {
      atasanList: selectedAtasanList.value.map((a) => ({
        persnum: a.persnum,
        name: a.name,
        positionId: a.position,
        positionText: a.positionText,
      })),
      arsipList: [
        {
          id: arsipId,
          perihal: arsipPerihal.value,
          kode: arsipKode.value,
          tanggalRetensiHabis: tanggalRetensiHabis.value,
        },
      ],
      keterangan: keterangan.value || undefined,
      submit: true,
      // Pejabat BAC
      bacPihakPertamaPersnum: pihakPertama.value.persnum,
      bacPihakPertamaName: pihakPertama.value.name,
      bacPihakPertamaJabatan: pihakPertama.value.positionText,
      bacTembusan: tembusanList.value.map((t) => ({
        persnum: t.persnum,
        name: t.name,
        jabatan: t.positionText,
      })),
    };
    if (props.usulan) {
      await apiPatch(`/transfer-active-to-inactive/${props.usulan.id}`, payload);
    } else {
      await apiPost('/transfer-active-to-inactive', payload);
    }
    emit('submitted');
    close();
  } catch (e: any) {
    console.error('Gagal mengajukan usulan:', e);
    throw e;
  } finally {
    submitting.value = false;
  }
};

const onClickOutside = (e: MouseEvent) => {
  if (atasanDropdownRef.value && !atasanDropdownRef.value.contains(e.target as Node)) {
    atasanDropdownOpen.value = false;
  }
  if (pihakPertamaDropdownRef.value && !pihakPertamaDropdownRef.value.contains(e.target as Node)) {
    pihakPertamaDropdownOpen.value = false;
  }
  if (tembusanDropdownRef.value && !tembusanDropdownRef.value.contains(e.target as Node)) {
    tembusanDropdownOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>
