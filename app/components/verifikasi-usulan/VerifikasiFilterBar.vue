<template>
  <div class="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center gap-3 w-full">
      <div class="flex items-center gap-3 flex-wrap flex-1">
        <!-- ROWS PER PAGE -->
        <div class="relative" data-custom-dropdown>
          <button
            type="button"
            @click.stop="toggleRowsPerPage"
            class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[70px] justify-between"
          >
            <span>{{ modelValue.limit }}</span>
            <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200" :class="{ 'rotate-180': openRowsPerPage }" />
          </button>
          <Transition name="filter-dd">
            <div v-if="openRowsPerPage" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[80px]">
              <button
                v-for="n in [10, 25, 50]"
                :key="n"
                type="button"
                @click.stop="selectRowsPerPage(n)"
                :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', modelValue.limit === n ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
              >{{ n }}</button>
            </div>
          </Transition>
        </div>

        <!-- FILTER STATUS -->
        <div class="relative" data-custom-dropdown>
          <button
            type="button"
            @click.stop="toggleFilterStatus"
            class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] justify-between"
          >
            <span class="truncate">{{ statusLabel }}</span>
            <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200" :class="{ 'rotate-180': openFilterStatus }" />
          </button>
          <Transition name="filter-dd">
            <div v-if="openFilterStatus" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]">
              <button
                type="button"
                @click.stop="selectFilterStatus('')"
                :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700', modelValue.status === '' ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
              >Semua Status</button>
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                type="button"
                @click.stop="selectFilterStatus(opt.value)"
                :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', modelValue.status === opt.value ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
              >{{ opt.label }}</button>
            </div>
          </Transition>
        </div>

        <!-- FILTER KLASIFIKASI -->
        <div class="relative" data-custom-dropdown>
          <button
            type="button"
            @click.stop="toggleFilterKlasifikasi"
            class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] max-w-[200px] justify-between"
          >
            <span class="truncate">{{ klasifikasiLabel }}</span>
            <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200" :class="{ 'rotate-180': openFilterKlasifikasi }" />
          </button>
          <Transition name="filter-dd">
            <div v-if="openFilterKlasifikasi" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[180px] max-h-56 overflow-y-auto">
              <button
                type="button"
                @click.stop="selectFilterKlasifikasi('')"
                :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700', modelValue.klasifikasi === '' ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
              >Semua Klasifikasi</button>
              <button
                v-for="k in klasifikasiList"
                :key="k.klasifikasi"
                type="button"
                @click.stop="selectFilterKlasifikasi(k.klasifikasi)"
                :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', modelValue.klasifikasi === k.klasifikasi ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
              >{{ k.klasifikasi }} — {{ k.klasifikasi_text || '' }}</button>
            </div>
          </Transition>
        </div>

        <!-- SEARCH -->
        <div class="relative flex-1 min-w-[180px]">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            :value="modelValue.search"
            @input="updateField('search', ($event.target as HTMLInputElement).value)"
            @keydown.enter="$emit('apply')"
            type="text"
            placeholder="Cari Berkas…"
            class="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>
      </div>

      <!-- EXPORT -->
      <button
        @click="$emit('export')"
        class="shrink-0 flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-primary dark:bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
      >
        <UIcon name="i-lucide-download" class="w-3.5 h-3.5" /> Export
      </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import { useApi } from '~/composables/useApi';
import type { VerifikasiFilter, VerifikasiStatus } from '~/types/verifikasi-usulan';

const props = defineProps<{ modelValue: VerifikasiFilter }>();
const emit = defineEmits<{ 'update:modelValue': [v: VerifikasiFilter]; apply: []; export: [] }>();

const { apiGet } = useApi();

const openRowsPerPage = ref(false);
const openFilterStatus = ref(false);
const openFilterKlasifikasi = ref(false);

const klasifikasiList = ref<any[]>([]);

const fetchKlasifikasi = async () => {
  try {
    const data: any = await apiGet('/arsip-dinamis/klasifikasi', {}, { skipCache: true });
    klasifikasiList.value = Array.isArray(data) ? data : (data?.data ?? []);
  } catch (e) {
    console.error('Gagal memuat klasifikasi:', e);
  }
};

const klasifikasiLabel = computed(() => {
  if (!props.modelValue.klasifikasi) return 'Semua Klasifikasi';
  const k = klasifikasiList.value.find((x: any) => x.klasifikasi === props.modelValue.klasifikasi);
  return k ? `${k.klasifikasi} — ${k.klasifikasi_text || ''}` : 'Semua Klasifikasi';
});

const statusOptions: { value: VerifikasiStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'MENUNGGU_VERIFIKASI_ATASAN', label: 'Menunggu Persetujuan' },
  { value: 'MENUNGGU_VERIFIKASI_TERAKHIR', label: 'Menunggu Verifikasi' },
  { value: 'DIKIRIM', label: 'Menunggu Penerimaan' },
  { value: 'SELESAI', label: 'Selesai' },
];

const statusLabel = computed(() =>
  statusOptions.find((o) => o.value === props.modelValue.status)?.label ?? 'Semua Status',
);

function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
  openFilterStatus.value = false;
  openFilterKlasifikasi.value = false;
}
function toggleFilterStatus() {
  openFilterStatus.value = !openFilterStatus.value;
  openRowsPerPage.value = false;
  openFilterKlasifikasi.value = false;
}
function toggleFilterKlasifikasi() {
  openFilterKlasifikasi.value = !openFilterKlasifikasi.value;
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
}

function selectRowsPerPage(n: number) {
  updateField('limit', n);
  updateField('page', 1);
  openRowsPerPage.value = false;
  emit('apply');
}
function selectFilterStatus(val: string) {
  updateField('status', val as any);
  openFilterStatus.value = false;
  emit('apply');
}
function selectFilterKlasifikasi(val: string) {
  updateField('klasifikasi', val);
  openFilterKlasifikasi.value = false;
  emit('apply');
}

const updateField = (field: keyof VerifikasiFilter, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
};

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value = openFilterStatus.value = openFilterKlasifikasi.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  fetchKlasifikasi();
});
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick));
</script>

<style scoped>
[data-custom-dropdown] button:focus {
  outline: none;
}
.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-4px);
}
.filter-dd-enter-to,
.filter-dd-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}
</style>