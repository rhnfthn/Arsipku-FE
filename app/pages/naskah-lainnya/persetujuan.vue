<template>
  <div class="flex flex-col gap-4">
    <PageHeader title="Persetujuan" :items="breadcrumbs" />

    <!-- Table Card (pola berkas-saya: toolbar + DataTable + DataPagination) -->
    <div
      class="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Toolbar -->
      <div class="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center gap-3 w-full">
        <div class="flex items-center gap-3 flex-wrap flex-1">
          <!-- ROWS PER PAGE -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleRowsPerPage"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[70px] justify-between"
            >
              <span>{{ perPage }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openRowsPerPage }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openRowsPerPage"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[80px]"
              >
                <button
                  v-for="n in [10, 25, 50]"
                  :key="n"
                  type="button"
                  @click.stop="selectRowsPerPage(n)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    perPage === n
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER STATUS (Menunggu / Disetujui / Ditolak) -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterStatus"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[190px] justify-between"
            >
              <span class="flex items-center gap-1.5 truncate">
                <UIcon name="i-lucide-list-filter" class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span class="truncate">{{ currentFilterLabel }}</span>
              </span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterStatus }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterStatus"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[210px]"
              >
                <button
                  v-for="tab in filterTabs"
                  :key="tab.value"
                  type="button"
                  @click.stop="selectFilterStatus(tab.value)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    filterStatus === tab.value
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ tab.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER JENIS -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterJenis"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[160px] justify-between"
            >
              <span class="truncate">{{ jenisLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterJenis }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterJenis"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[280px]"
              >
                <div class="border-b border-gray-100 p-2 dark:border-gray-700">
                  <div class="relative">
                    <UIcon
                      name="i-lucide-search"
                      class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="jenisFilterSearch"
                      type="text"
                      placeholder="Cari jenis naskah…"
                      class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:focus:bg-gray-800"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="max-h-72 overflow-y-auto">
                  <button
                    v-for="opt in filteredJenisOptions"
                    :key="opt.value"
                    type="button"
                    @click.stop="selectFilterJenis(opt.value)"
                    :class="[
                      'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                      filterJenis === opt.value
                        ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                    ]"
                  >
                    {{ opt.label }}
                  </button>
                  <div
                    v-if="filteredJenisOptions.length === 0"
                    class="px-4 py-3 text-sm text-gray-400"
                  >
                    Jenis naskah tidak ditemukan.
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- FILTER TAHAPAN -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterTahapan"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[170px] justify-between"
            >
              <span class="truncate">{{ tahapanLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterTahapan }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterTahapan"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[280px]"
              >
                <div class="border-b border-gray-100 p-2 dark:border-gray-700">
                  <div class="relative">
                    <UIcon
                      name="i-lucide-search"
                      class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="tahapanFilterSearch"
                      type="text"
                      placeholder="Cari tahapan…"
                      class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:focus:bg-gray-800"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="max-h-72 overflow-y-auto">
                  <button
                    v-for="opt in filteredTahapanOptions"
                    :key="opt.value"
                    type="button"
                    @click.stop="selectFilterTahapan(opt.value)"
                    :class="[
                      'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                      filterTahapan === opt.value
                        ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                    ]"
                  >
                    {{ opt.label }}
                  </button>
                  <div
                    v-if="filteredTahapanOptions.length === 0"
                    class="px-4 py-3 text-sm text-gray-400"
                  >
                    Tahapan tidak ditemukan.
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <div class="relative flex-1 min-w-[180px]">
            <UIcon
              name="i-lucide-search"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              v-model="search"
              type="text"
              placeholder="Cari perihal, nomor, atau pemrakarsa…"
              class="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
            />
          </div>
        </div>
        <button
          @click="exportData"
          :disabled="isExporting"
          class="shrink-0 flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-primary dark:bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <UIcon
            v-if="isExporting"
            name="i-lucide-loader-circle"
            class="w-3.5 h-3.5 animate-spin"
          />
          <UIcon v-else name="i-lucide-download" class="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <!-- Table -->
      <DataTable
        compact
        :columns="columns"
        :rows="tableRows"
        :loading="pending"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        header-class="bg-primary dark:bg-primary-700 text-white text-left"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        empty-message="Tidak ada antrian persetujuan."
        @sort="handleSort"
      >
        <template #cell-nomor="{ row }">
          <div class="min-w-0">
            <div class="flex min-w-0 items-center gap-1.5">
              <span
                class="shrink-0 rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              >
                {{ row.jenis }}
              </span>
              <button
                class="min-w-0 truncate font-mono text-xs text-primary-600 hover:underline"
                :title="row.nomor"
                @click="goDetail(row)"
              >
                {{ row.nomor }}
              </button>
            </div>
            <div
              class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400"
              :title="row.perihal"
            >
              {{ row.perihal }}
            </div>
            <div
              v-if="row.tahapanRaw === 'perlu_perbaikan'"
              class="truncate text-[11px] text-orange-500"
            >
              Perlu revisi — lihat detail naskah.
            </div>
          </div>
        </template>
        <template #cell-pemrakarsa="{ row }">
          <span class="block truncate text-xs" :title="row.pemrakarsa">{{ row.pemrakarsa }}</span>
        </template>
        <template #cell-konseptor="{ row }">
          <span class="block truncate text-xs" :title="row.konseptor">{{ row.konseptor }}</span>
        </template>
        <template #cell-tahapan="{ row }">
          <StatusBadge
            :status="row.tahapan"
            :title="row.tahapan"
            class="max-w-full overflow-hidden whitespace-nowrap !px-1.5 !text-[11px]"
          />
        </template>
        <template #cell-status="{ row }">
          <StatusBadge
            :status="row.approvalStatus"
            class="max-w-full overflow-hidden whitespace-nowrap !px-1.5 !text-[11px]"
          />
        </template>
        <template #cell-waktu="{ row }">
          <span
            class="block truncate text-xs text-gray-500 dark:text-gray-400"
            :title="row.waktuLabel"
          >
            {{ row.waktuLabel }}
          </span>
        </template>
        <template #cell-aksi="{ row }">
          <UButton size="xs" color="primary" variant="soft" @click="goDetail(row)"
            >Detail</UButton
          >
        </template>
      </DataTable>

      <!-- Pagination -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="totalItems"
        :per-page="perPage"
      />
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      {{ errorMessage }}
    </div>

    <!-- Modal Setujui -->
    <Modal v-model="modalOpen" :hide-default-footer="true">
      <template #title>Setujui — {{ selected?.nomor ?? '' }}</template>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-gray-500">{{ selected?.perihal }}</p>
        <UInput v-model="catatan" placeholder="Catatan (opsional)" />
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex gap-2">
            <UButton
              size="xs"
              color="error"
              variant="soft"
              icon="i-lucide-x"
              @click="tolakOpen = true"
              >Tolak</UButton
            >
            <UButton
              size="xs"
              color="warning"
              variant="soft"
              icon="i-lucide-undo-2"
              @click="kembaliOpen = true"
              >Kembalikan</UButton
            >
          </div>
          <div class="flex gap-2">
            <UButton color="neutral" variant="ghost" @click="modalOpen = false">Batal</UButton>
            <UButton color="success" icon="i-lucide-check" :loading="busy" @click="doSetuju"
              >Setujui</UButton
            >
          </div>
        </div>
      </div>
    </Modal>

    <!-- Modal Tolak -->
    <Modal v-model="tolakOpen" :hide-default-footer="true">
      <template #title>Tolak — {{ selected?.nomor ?? '' }}</template>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-gray-500">Alasan penolakan wajib diisi.</p>
        <UTextarea v-model="alasan" placeholder="Alasan…" />
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="tolakOpen = false">Batal</UButton>
          <UButton
            color="error"
            icon="i-lucide-x"
            :loading="busy"
            :disabled="!alasan"
            @click="doTolak"
            >Tolak</UButton
          >
        </div>
      </div>
    </Modal>

    <!-- Modal Kembalikan -->
    <Modal v-model="kembaliOpen" :hide-default-footer="true">
      <template #title>Kembalikan — {{ selected?.nomor ?? '' }}</template>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-gray-500">Alasan wajib diisi; sertakan dokumen revisi bila ada.</p>
        <UTextarea v-model="alasan" placeholder="Alasan…" />
        <div>
          <FileUpload
            v-model="revisiDocxFiles"
            :multiple="false"
            accept=".docx"
            label="+ Revisi DOCX (opsional)"
            description="PDF pratinjau dibuat otomatis oleh sistem"
          />
        </div>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="kembaliOpen = false">Batal</UButton>
          <UButton
            color="warning"
            icon="i-lucide-undo-2"
            :loading="busy"
            :disabled="!alasan"
            @click="doKembali"
            >Kembalikan</UButton
          >
        </div>
      </div>
    </Modal>

    <!-- Export Column Modal -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="totalItems || persetujuan.length"
      title="Pilih Kolom Export Persetujuan Naskah"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import { useNaskahLainnya } from '~/composables/useNaskahLainnya';
import { JENIS_LABELS, TAHAPAN_STEP } from '~/types/naskah-lainnya';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';

definePageMeta({ layout: 'default', middleware: ['auth'] });

const showExportModal = ref(false);
const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut' },
  { key: 'nomor', label: 'Nomor Naskah', desc: 'Nomor naskah dinas' },
  { key: 'pemrakarsa', label: 'Pemrakarsa', desc: 'Nama pembuat/pemrakarsa' },
  { key: 'perihal', label: 'Perihal', desc: 'Perihal / subjek naskah' },
  { key: 'tahapan', label: 'Tahapan', desc: 'Tahapan persetujuan' },
  { key: 'status', label: 'Status', desc: 'Status persetujuan' }
]);

const {
  persetujuan,
  detail,
  pending,
  error,
  fetchPersetujuan,
  fetchDetail,
  setuju,
  tolak,
  kembalikan,
  uploadRevisiDokumen,
} = useNaskahLainnya();
const { t } = useI18n();
const toast = useToast();
const route = useRoute();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: t('persetujuan'), to: '#' },
]);

const selected = ref<NaskahListItem | null>(null);
const modalOpen = ref(false);
const tolakOpen = ref(false);
const kembaliOpen = ref(false);
const catatan = ref('');
const alasan = ref('');
const busy = ref(false);
const revisiDocxFiles = ref<File[]>([]);

const search = ref('');
const filterJenis = ref('');
const filterTahapan = ref('');
const jenisFilterSearch = ref('');
const tahapanFilterSearch = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const sortKey = ref('nomor');
const sortDir = ref<'asc' | 'desc'>('asc');
const isExporting = ref(false);

// Filter status persetujuan (semua / menunggu / disetujui / ditolak).
// Inisial dari ?status= (redirect pasca-approval membawa disetujui/ditolak).
const queryStatus = route.query.status as string | undefined;
const filterStatus = ref<'semua' | 'menunggu' | 'disetujui' | 'ditolak'>(
  queryStatus === 'semua' ||
    queryStatus === 'menunggu' ||
    queryStatus === 'disetujui' ||
    queryStatus === 'ditolak'
    ? queryStatus
    : 'menunggu'
);
const filterTabs: { value: 'semua' | 'menunggu' | 'disetujui' | 'ditolak'; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'menunggu', label: 'Menunggu Persetujuan Anda' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
];
const jenisOptions = [
  { label: 'Semua Naskah', value: '' },
  ...Object.entries(JENIS_LABELS).map(([value, label]) => ({
    label: `${value} — ${label}`,
    value,
  })),
];
const filteredJenisOptions = computed(() => {
  const q = jenisFilterSearch.value.trim().toLowerCase();
  if (!q) return jenisOptions;
  return jenisOptions.filter((opt) =>
    [opt.label, opt.value].some((v) => v.toLowerCase().includes(q))
  );
});
const tahapanFilterLabels: Record<Tahapan, string> = {
  konsep: 'Konsep',
  persetujuan: 'Persetujuan',
  legal_drafting: 'Legal Drafting',
  evaluasi: 'Evaluasi',
  persetujuan_lanjutan: 'Persetujuan Lanjutan',
  evaluasi_final: 'Evaluasi Final EVP',
  persetujuan_direksi: 'Persetujuan Direksi',
  tanda_tangan_pemrakarsa: 'TTD Pemrakarsa',
  blanko_verbal: 'Blanko Verbal / Persetujuan Direksi',
  tanda_tangan_legal: 'TTD Legal',
  tanda_tangan_pejabat: 'TTD Pejabat',
  tanda_tangan: 'Menunggu Tanda Tangan',
  selesai: 'Selesai',
  perlu_perbaikan: 'Perlu Perbaikan',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
};
const persetujuanTahapanOrder: Tahapan[] = [
  'persetujuan',
  'legal_drafting',
  'evaluasi',
  'persetujuan_direksi',
  'blanko_verbal',
  'tanda_tangan',
  'selesai',
  'perlu_perbaikan',
  'ditolak',
  'dibatalkan',
];
// Menu Persetujuan dapat berisi riwayat naskah yang telah bergerak ke tahap
// berikutnya. Dropdown hanya menampilkan tahapan yang benar-benar ada pada
// hasil filter status user saat ini.
const tahapanOptions = computed(() => {
  const available = new Set(persetujuan.value.map((row) => row.tahapan));
  const ordered = persetujuanTahapanOrder.filter((value) => available.has(value));
  const additional = [...available].filter((value) => !ordered.includes(value));
  return [
    { label: 'Semua Tahapan', value: '' },
    ...[...ordered, ...additional].map((value) => ({
      label: tahapanFilterLabels[value] ?? value.replace(/_/g, ' '),
      value,
    })),
  ];
});
const filteredTahapanOptions = computed(() => {
  const q = tahapanFilterSearch.value.trim().toLowerCase();
  if (!q) return tahapanOptions.value;
  return tahapanOptions.value.filter((opt) =>
    [opt.label, opt.value].some((v) => v.toLowerCase().includes(q))
  );
});

const columns = [
  { key: 'nomor', label: 'Naskah', sortable: true, class: 'w-[27%]', headerClass: 'w-[27%]' },
  {
    key: 'pemrakarsa',
    label: 'Pemrakarsa',
    sortable: true,
    class: 'w-[15%]',
    headerClass: 'w-[15%]',
  },
  {
    key: 'konseptor',
    label: 'Konseptor',
    sortable: true,
    class: 'hidden xl:table-cell w-[13%]',
    headerClass: 'hidden xl:table-cell w-[13%]',
  },
  { key: 'tahapan', label: 'Tahapan', sortable: true, class: 'w-[14%]', headerClass: 'w-[14%]' },
  { key: 'status', label: 'Status', sortable: true, class: 'w-[12%]', headerClass: 'w-[12%]' },
  {
    key: 'waktu',
    label: 'Waktu',
    sortable: true,
    class: 'hidden lg:table-cell w-[12%]',
    headerClass: 'hidden lg:table-cell w-[12%]',
  },
  { key: 'aksi', label: 'Aksi', class: 'w-[7%]', headerClass: 'w-[7%]' },
];

// ── Custom Dropdown Toolbar State (pola berkas-saya) ──────────────

const openRowsPerPage = ref(false);
const openFilterStatus = ref(false);
const openFilterJenis = ref(false);
const openFilterTahapan = ref(false);

function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
  openFilterStatus.value = false;
  openFilterJenis.value = false;
  openFilterTahapan.value = false;
}
function selectRowsPerPage(n: number) {
  perPage.value = n;
  openRowsPerPage.value = false;
}

function toggleFilterStatus() {
  openFilterStatus.value = !openFilterStatus.value;
  openRowsPerPage.value = false;
  openFilterJenis.value = false;
  openFilterTahapan.value = false;
}
function selectFilterStatus(v: 'semua' | 'menunggu' | 'disetujui' | 'ditolak') {
  // Tahapan yang tersedia berbeda untuk setiap status approval.
  filterTahapan.value = '';
  tahapanFilterSearch.value = '';
  filterStatus.value = v;
  openFilterStatus.value = false;
}
const currentFilterLabel = computed(
  () => filterTabs.find((t) => t.value === filterStatus.value)?.label ?? 'Filter'
);
function toggleFilterJenis() {
  openFilterJenis.value = !openFilterJenis.value;
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
  openFilterTahapan.value = false;
}
function selectFilterJenis(value: string) {
  filterJenis.value = value;
  jenisFilterSearch.value = '';
  openFilterJenis.value = false;
}
const jenisLabel = computed(
  () => jenisOptions.find((o) => o.value === filterJenis.value)?.label ?? 'Semua Naskah'
);
function toggleFilterTahapan() {
  openFilterTahapan.value = !openFilterTahapan.value;
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
  openFilterJenis.value = false;
}
function selectFilterTahapan(value: string) {
  filterTahapan.value = value;
  tahapanFilterSearch.value = '';
  openFilterTahapan.value = false;
}
const tahapanLabel = computed(
  () => tahapanOptions.value.find((o) => o.value === filterTahapan.value)?.label ?? 'Semua Tahapan'
);

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
  openFilterJenis.value = false;
  openFilterTahapan.value = false;
  jenisFilterSearch.value = '';
  tahapanFilterSearch.value = '';
}

// ── Search + Sort + Pagination (client-side; API mengembalikan list penuh) ─

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  return persetujuan.value.filter((r) => {
    const matchesJenis = !filterJenis.value || r.jenis === filterJenis.value;
    const matchesTahapan = !filterTahapan.value || r.tahapan === filterTahapan.value;
    const matchesSearch =
      !q ||
      [r.nomor, r.perihal, r.pemrakarsaPejabat?.nama ?? r.pemrakarsa.nama].some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      );
    return matchesJenis && matchesTahapan && matchesSearch;
  });
});

// Status persetujuan dari POV user (badge kolom Status). Sebelumnya hardcoded
// 'waiting' — komparasi row.tahapan (sudah di-spasi-kan) vs 'perlu_perbaikan'
// (underscore) selalu false → naskah selesai pun tampil "Menunggu".
const APPROVAL_STATUS_LABEL: Record<string, string> = {
  waiting: 'Menunggu',
  verified: 'Disetujui',
  rejected: 'Ditolak',
};
function approvalStatusKey(status?: string): string {
  if (status === 'waiting' || status === 'verified' || status === 'rejected') return status;
  // Backward compatibility ketika FE lebih dulu ter-deploy daripada BE.
  if (filterStatus.value === 'disetujui') return 'verified';
  if (filterStatus.value === 'ditolak') return 'rejected';
  return 'waiting';
}

const displayRows = computed(() =>
  filteredRows.value.map((r) => ({
    id: r.id,
    nomor: r.nomor ?? '<draft>',
    jenis: r.jenis,
    pemrakarsa: r.pemrakarsaPejabat?.nama ?? r.pemrakarsa.nama,
    konseptor: r.pemrakarsa.nama,
    perihal: r.perihal,
    tahapan: r.tahapan.replace(/_/g, ' '),
    tahapanRaw: r.tahapan,
    approvalStatus: approvalStatusKey(r.approvalStatus),
    status: APPROVAL_STATUS_LABEL[approvalStatusKey(r.approvalStatus)] ?? 'Menunggu',
    // Timestamp untuk sort paling baru/lama (kolom Waktu).
    waktu: r.terakhirDiubah ? new Date(r.terakhirDiubah).getTime() : null,
    waktuLabel: formatNaskahDateTime(r.terakhirDiubah),
  }))
);

const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1;
  return [...displayRows.value].sort((a, b) => {
    // Kolom waktu di-sort numerik (timestamp) — localeCompare string akan
    // salah urut untuk tanggal (DD/MM/YYYY tidak leksikografis).
    if (sortKey.value === 'waktu') {
      const av = (a as any).waktu;
      const bv = (b as any).waktu;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * dir;
    }
    const av = (a as any)[sortKey.value];
    const bv = (b as any)[sortKey.value];
    if (av == null) return 1;
    if (bv == null) return -1;
    return String(av).localeCompare(String(bv), 'id') * dir;
  });
});

const totalItems = computed(() => sortedRows.value.length);

const tableRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return sortedRows.value.slice(start, start + perPage.value);
});

const errorMessage = computed(
  () => (error.value as any)?.response?.data?.message ?? 'Gagal memuat antrian persetujuan.'
);

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
}

// ── Aksi ──────────────────────────────────────────────────────────

function goDetail(row: any) {
  const n = persetujuan.value.find((i) => i.id === row.id);
  if (!n) return;
  navigateTo(`/naskah-lainnya/${n.id}`);
}

async function doSetuju() {
  if (!selected.value) return;
  busy.value = true;
  try {
    const approvalId = await firstWaitingId();
    await setuju(selected.value.id, approvalId, catatan.value || undefined);
    await fetchPersetujuan(filterStatus.value);
    modalOpen.value = false;
  } finally {
    busy.value = false;
  }
}

async function doTolak() {
  if (!selected.value) return;
  busy.value = true;
  try {
    const approvalId = await firstWaitingId();
    await tolak(selected.value.id, approvalId, alasan.value);
    await fetchPersetujuan(filterStatus.value);
    tolakOpen.value = false;
    modalOpen.value = false;
  } finally {
    busy.value = false;
  }
}

async function doKembali() {
  if (!selected.value) return;
  const docx = revisiDocxFiles.value.at(-1) ?? null;
  busy.value = true;
  try {
    if (docx) {
      await uploadRevisiDokumen(selected.value.id, { docx });
    }
    const approvalId = await firstWaitingId();
    await kembalikan(selected.value.id, approvalId, alasan.value);
    await fetchPersetujuan(filterStatus.value);
    kembaliOpen.value = false;
    modalOpen.value = false;
    revisiDocxFiles.value = [];
  } finally {
    busy.value = false;
  }
}

async function firstWaitingId(): Promise<string> {
  await fetchDetail(selected.value!.id);
  return detail.value?.approval.find((a) => a.status === 'waiting')?.id ?? '';
}

function exportData() {
  if (totalItems.value === 0) {
    toast.add({
      title: 'Tidak ada data',
      description: 'Tidak ada data untuk diexport',
      color: 'warning',
    });
    return;
  }
  showExportModal.value = true;
}

function handleExportConfirm(selectedKeys: string[]) {
  const rows = displayRows.value;
  if (!rows.length || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const data = rows.map((r: any, idx: number) => {
      const row: Record<string, any> = {};
      if (selectedKeys.includes('No')) row['No'] = idx + 1;
      if (selectedKeys.includes('nomor')) row['Nomor Naskah'] = r.nomor || '-';
      if (selectedKeys.includes('pemrakarsa')) row['Pemrakarsa'] = r.pemrakarsa || '-';
      if (selectedKeys.includes('perihal')) row['Perihal'] = r.perihal || '-';
      if (selectedKeys.includes('tahapan')) row['Tahapan'] = r.tahapan || '-';
      if (selectedKeys.includes('status')) row['Status'] = r.status || '-';
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Persetujuan Naskah');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `persetujuan_naskah_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showExportModal.value = false;
    toast.add({
      title: 'Berhasil',
      description: `${data.length} data berhasil diexport`,
      color: 'success',
    });
  } catch (e) {
    console.error('Gagal export persetujuan:', e);
    toast.add({ title: 'Gagal export', description: 'Silakan coba kembali.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
}

// ── Watchers (pola berkas-saya) ──────────────────────────────────

// Search change -> reset to page 1 (the currentPage watcher then fetches;
// if already on page 1, fetch directly so the change still applies).
watch([search, filterJenis, filterTahapan], () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else fetchPersetujuan(filterStatus.value);
});

// Page/perPage changes -> fetch (perPage change resets to page 1 first).
watch([currentPage, perPage], ([, newPerPage], [, oldPerPage]) => {
  if (newPerPage !== oldPerPage && currentPage.value !== 1) {
    currentPage.value = 1;
    return;
  }
  fetchPersetujuan(filterStatus.value);
});

// Sort changes -> reset to page 1 (currentPage watcher fetches; if on page 1, fetch directly).
watch([sortKey, sortDir], () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else fetchPersetujuan(filterStatus.value);
});

// Filter tab change -> reset to page 1 (currentPage watcher fetches; if on page 1, fetch directly).
watch(filterStatus, () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else fetchPersetujuan(filterStatus.value);
});

// ── Init ──────────────────────────────────────────────────────────

onMounted(() => {
  fetchPersetujuan(filterStatus.value);
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
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
