<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5 min-h-screen px-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        title="Pemberkasan Arsip Aktif"
        :items="[
          { label: 'Kelola' },
          { label: 'Pemeliharaan' },
          { label: 'Pemberkasan' },
          { label: 'Berkas Saya' },
        ]"
      />
      <button
        @click="openCreateModal"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors shrink-0"
      >
        <Plus class="w-4 h-4" />
        Buat Berkas
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in summaryCards"
        :key="card.key"
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg"
            :class="[card.iconBg, card.iconColor]"
          >
            <component :is="card.icon" class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
            <p class="text-xl font-semibold" :class="card.valueColor">
              {{ statistik?.[card.key] ?? 0 }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <div class="flex flex-col">
        <label class="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Jenis</label>
        <select
          v-model="filterStatus"
          class="w-44 border rounded-lg px-3 py-2 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option v-for="o in statusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <div class="flex flex-col">
        <label class="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Klasifikasi</label>
        <select
          v-model="filterKlasifikasi"
          class="w-56 border rounded-lg px-3 py-2 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Semua Klasifikasi</option>
          <option v-for="k in klasifikasiList" :key="k.klasifikasi" :value="k.klasifikasi">
            {{ k.klasifikasi }} — {{ k.klasifikasi_text || '' }}
          </option>
        </select>
      </div>
      <div class="flex flex-col">
        <label class="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Tahun</label>
        <select
          v-model="filterTahun"
          class="w-32 border rounded-lg px-3 py-2 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option v-for="o in tahunOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        @click="resetFilters"
      >
        <RotateCcw class="h-4 w-4" /> Reset Filter
      </button>
    </div>

    <!-- Table Card -->
    <div
      class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Toolbar -->
      <DataToolbar
        v-model="perPage"
        v-model:search="search"
        search-placeholder="Cari Berkas…"
        :rows-choices="[10, 25, 50]"
        :show-export="false"
        @refresh="fetchData"
      />

      <!-- Table -->
      <DataTable
        :columns="columns"
        :rows="berkasList"
        :loading="pending"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        empty-message="Belum ada berkas. Klik 'Buat Berkas' untuk memulai."
        @sort="handleSort"
      >
        <template #cell-kodeBerkas="{ row }">
          <span class="font-mono text-xs">{{ row.kodeBerkas || '-' }}</span>
        </template>
        <template #cell-retensi="{ row }">
          <span class="text-xs">
            {{ row.retensiAktifTahun || 0 }}A / {{ row.retensiInaktifTahun || 0 }}I
          </span>
        </template>
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" />
        </template>
        <template #cell-updatedAt="{ row }">
          <span class="text-xs text-gray-500">{{ formatDate(row.updatedAt) }}</span>
        </template>
        <template #cell-aksi="{ row }">
          <NuxtLink
            :to="`/kelola/pemeliharaan/pemberkasan/${row.id}`"
            class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary transition-colors inline-flex"
            title="Lihat Detail"
          >
            <Eye class="w-4 h-4" />
          </NuxtLink>
        </template>
      </DataTable>

      <!-- Pagination -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="totalItems"
        :per-page="perPage"
      />
    </div>

    <!-- Modal Tambah Berkas -->
    <Teleport to="body">
      <Modal
        v-model="showCreateModal"
        :saving="isSubmitting"
        size="xl"
        :hide-default-footer="true"
      >
        <template #title>
          <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
            Tambah Berkas Arsip Aktif
          </Heading>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Kiri kolom -->
          <div class="space-y-4">
            <!-- Klasifikasi -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                Klasifikasi <span class="text-red-500">*</span>
              </Heading>
              <select
                v-model="form.klasifikasi"
                @change="onKlasifikasiChange"
                :class="[
                  'mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
                  modalErrors.klasifikasi
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600',
                ]"
              >
                <option value="" disabled>Pilih klasifikasi arsip</option>
                <option v-for="k in klasifikasiList" :key="k.klasifikasi" :value="k.klasifikasi">
                  {{ k.klasifikasi }} — {{ k.klasifikasi_text || '' }}
                </option>
              </select>
              <p v-if="modalErrors.klasifikasi" class="text-xs text-red-500 mt-1">
                Klasifikasi wajib dipilih
              </p>
            </div>

            <!-- Nama Berkas -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                Nama Berkas <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="form.judul_berkas"
                type="text"
                placeholder="Masukkan nama berkas"
                :class="[
                  'mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
                  modalErrors.judul_berkas
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600',
                ]"
                @input="modalErrors.judul_berkas = false"
              />
              <p v-if="modalErrors.judul_berkas" class="text-xs text-red-500 mt-1">
                Nama berkas wajib diisi
              </p>
            </div>

            <!-- Retensi Aktif & Inaktif -->
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col">
                <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200"
                  >Retensi Aktif</Heading
                >
                <input
                  :value="retensiAktifLabel"
                  type="text"
                  disabled
                  placeholder="Otomatis"
                  class="mt-1 w-full text-left border bg-gray-100 border-gray-100 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              <div class="flex flex-col">
                <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200"
                  >Retensi Inaktif</Heading
                >
                <input
                  :value="retensiInaktifLabel"
                  type="text"
                  disabled
                  placeholder="Otomatis"
                  class="mt-1 w-full text-left border bg-gray-100 border-gray-100 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
            </div>

            <!-- Kategori Berkas -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200"
                >Kategori Berkas</Heading
              >
              <input
                v-model="form.kategori_berkas"
                type="text"
                placeholder="Contoh: Pengadaan IT"
                class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              />
            </div>

            <!-- Lokasi Fisik -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                Lokasi Fisik <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="form.lokasi"
                type="text"
                placeholder="Contoh: Rak A, Baris 2"
                :class="[
                  'mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
                  modalErrors.lokasi
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600',
                ]"
                @input="modalErrors.lokasi = false"
              />
              <p v-if="modalErrors.lokasi" class="text-xs text-red-500 mt-1">
                Lokasi fisik wajib diisi
              </p>
            </div>
          </div>

          <!-- Kanan kolom -->
          <div class="space-y-4">
            <!-- Nomor Berkas -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200"
                >Nomor Berkas</Heading
              >
              <input
                value="Auto-generate"
                type="text"
                disabled
                class="mt-1 w-full text-left border bg-gray-100 border-gray-100 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200"
              />
            </div>

            <!-- Penyusutan Akhir -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                Penyusutan Akhir <span class="text-red-500">*</span>
              </Heading>
              <select
                v-model="form.tindakan_penyusutan_akhir"
                class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option value="Musnah">Musnah</option>
                <option value="Permanen">Permanen</option>
              </select>
            </div>

            <!-- Uraian -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                Uraian <span class="text-red-500">*</span>
              </Heading>
              <textarea
                v-model="form.isi_ringkas"
                rows="3"
                placeholder="Keterangan berkas"
                :class="[
                  'mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 resize-none',
                  modalErrors.isi_ringkas
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600',
                ]"
                @input="modalErrors.isi_ringkas = false"
              />
              <p v-if="modalErrors.isi_ringkas" class="text-xs text-red-500 mt-1">
                Uraian wajib diisi
              </p>
            </div>

            <!-- Upload Foto Lokasi Fisik -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200"
                >Foto Lokasi Fisik</Heading
              >
              <label
                class="group cursor-pointer border-2 border-dashed rounded-xl p-5 mt-1 flex flex-col items-center justify-center gap-2 text-center hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 transition border-gray-300 dark:border-gray-600"
              >
                <ImageIcon
                  class="w-6 h-6 group-hover:text-primary-400 text-gray-400 dark:text-gray-500"
                />
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Seret foto atau
                  <span class="text-primary-500 font-medium">pilih file</span>
                </p>
                <p class="text-[10px] text-gray-400 dark:text-gray-500">JPG/PNG, maks 5MB</p>
                <input
                  type="file"
                  class="hidden"
                  accept="image/jpeg,image/png"
                  @change="onFotoLokasiChange"
                />
              </label>
              <div v-if="form.foto_lokasi_fisik" class="mt-2">
                <span class="text-xs text-gray-600 dark:text-gray-300">{{
                  form.foto_lokasi_fisik.name
                }}</span>
                <button
                  type="button"
                  class="ml-2 text-red-400 hover:text-red-600"
                  @click="form.foto_lokasi_fisik = null"
                >
                  <X class="w-3.5 h-3.5 inline" />
                </button>
              </div>
            </div>

            <!-- Dokumen Pendukung (Upload Box) -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200"
                >Dokumen Pendukung</Heading
              >
              <label
                class="group cursor-pointer border-2 border-dashed rounded-xl p-5 mt-1 flex flex-col items-center justify-center gap-2 text-center hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 transition border-gray-300 dark:border-gray-600"
              >
                <Upload
                  class="w-6 h-6 group-hover:text-primary-400 text-gray-400 dark:text-gray-500"
                />
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Seret file atau
                  <span class="text-primary-500 font-medium">pilih file</span>
                </p>
                <p class="text-[10px] text-gray-400 dark:text-gray-500">PDF/JPG/PNG, maks 5MB</p>
                <input
                  type="file"
                  class="hidden"
                  accept=".pdf,image/jpeg,image/png"
                  @change="onDokumenChange"
                />
              </label>
              <!-- File list -->
              <div v-if="form.dokumen_pendukung" class="mt-2 space-y-2">
                <div
                  class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2"
                >
                  <div class="flex items-center gap-2">
                    <FileText class="w-4 h-4 text-primary-400" />
                    <div class="flex flex-col">
                      <span class="text-xs font-medium truncate max-w-[220px] dark:text-gray-200">{{
                        form.dokumen_pendukung.name
                      }}</span>
                      <span class="text-[10px] text-gray-400 dark:text-gray-500"
                        >{{ (form.dokumen_pendukung.size / 1024).toFixed(1) }} KB</span
                      >
                    </div>
                  </div>
                  <button
                    type="button"
                    class="text-red-400 hover:text-red-600"
                    @click="form.dokumen_pendukung = null"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div
            class="flex justify-between border-t border-gray-300 dark:border-gray-400 shrink-0 gap-3 px-5 py-2 mt-5"
          >
            <button
              type="button"
              :disabled="isSubmitting"
              class="flex-1 px-5 py-2 mt-2 text-sm border border-primary-500 hover:bg-primary-100 text-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              @click="resetForm(); showCreateModal = false"
            >
              Batal
            </button>

            <button
              type="button"
              :disabled="isSubmitting"
              class="flex-1 px-5 py-2 mt-2 text-sm border border-primary-500 text-primary hover:bg-primary-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              @click="onSubmitBerkas('draft')"
            >
              Simpan Draft
            </button>

            <button
              type="button"
              :disabled="isSubmitting"
              class="flex-1 px-5 py-2 mt-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md disabled:opacity-80 disabled:cursor-not-allowed"
              @click="onSubmitBerkas('aktif')"
            >
              <span v-if="isSubmitting" class="inline-flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="3"
                    class="opacity-25"
                  />
                  <path
                    d="M22 12a10 10 0 0 1-10 10"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    class="opacity-90"
                  />
                </svg>
                Menyimpan...
              </span>
              <span v-else>Simpan & Aktifkan</span>
            </button>
          </div>
        </template>
      </Modal>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue';
import {
  Plus,
  Eye,
  FileEdit,
  FolderOpen,
  Clock,
  FolderCheck,
  Upload,
  FileText,
  X,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-vue-next';

const {
  getBerkasList,
  getBerkasStatistik,
  createBerkas,
  activateBerkas,
  getKlasifikasiDenganRetensi,
} = useArsipDinamis();
const toast = useToast();

// ── State ────────────────────────────────────────────────────────

const search = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const sortKey = ref('updatedAt');
const sortDir = ref<'asc' | 'desc'>('desc');
const showCreateModal = ref(false);
const statistik = ref<any>(null);
const berkasList = ref<any[]>([]);
const totalItems = ref(0);
const pending = ref(false);
const isSubmitting = ref(false);
const klasifikasiList = ref<any[]>([]);

const filterStatus = ref('');
const filterKlasifikasi = ref('');
const filterTahun = ref('');

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'closed_retensi_aktif', label: 'Closed — Retensi Aktif' },
];
const currentYear = new Date().getFullYear();
const tahunOptions = [
  { value: '', label: 'Semua Tahun' },
  ...Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  })),
];
const resetFilters = () => {
  filterStatus.value = '';
  filterKlasifikasi.value = '';
  filterTahun.value = '';
  currentPage.value = 1;
};

// ── Form ─────────────────────────────────────────────────────────

const defaultForm = {
  klasifikasi: '',
  judul_berkas: '',
  tindakan_penyusutan_akhir: 'Musnah',
  lokasi: '',
  isi_ringkas: '',
  kategori_berkas: '',
  dokumen_pendukung: null as File | null,
  foto_lokasi_fisik: null as File | null,
};

const form = reactive({ ...defaultForm });
const modalErrors = reactive({
  klasifikasi: false,
  judul_berkas: false,
  lokasi: false,
  isi_ringkas: false,
});
const selectedRetensiAktif = ref(0);
const selectedRetensiInaktif = ref(0);

const retensiAktifLabel = computed(() =>
  selectedRetensiAktif.value > 0 ? `${selectedRetensiAktif.value} Tahun` : ''
);
const retensiInaktifLabel = computed(() =>
  selectedRetensiInaktif.value > 0 ? `${selectedRetensiInaktif.value} Tahun` : ''
);

// ── Table Columns (TypeORM returns camelCase keys) ───────────────

const columns = [
  { key: 'judulBerkas', label: 'Nama Berkas', sortable: true },
  { key: 'kodeBerkas', label: 'Kode Berkas' },
  { key: 'klasifikasiTeks', label: 'Klasifikasi' },
  { key: 'retensi', label: 'Retensi (A/I)' },
  { key: 'lokasi', label: 'Lokasi Fisik' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Updated', sortable: true },
  { key: 'aksi', label: 'Aksi' },
];

// ── Summary Cards ────────────────────────────────────────────────

const summaryCards = [
  {
    label: 'Draft',
    key: 'draft',
    icon: FileEdit,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    valueColor: 'text-gray-600',
  },
  {
    label: 'Aktif',
    key: 'aktif',
    icon: FolderOpen,
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
    valueColor: 'text-primary-600',
  },
  {
    label: 'Menunggu Verifikasi',
    key: 'menunggu_verifikasi',
    icon: Clock,
    iconBg: 'bg-warning-50',
    iconColor: 'text-warning-600',
    valueColor: 'text-warning-600',
  },
  {
    label: 'Closed — Retensi Aktif',
    key: 'closed_retensi_aktif',
    icon: FolderCheck,
    iconBg: 'bg-success-50',
    iconColor: 'text-success-600',
    valueColor: 'text-success-600',
  },
];

// ── Helpers ──────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
};

const openCreateModal = () => {
  resetForm();
  showCreateModal.value = true;
};

const resetForm = () => {
  Object.assign(form, defaultForm);
  modalErrors.klasifikasi = false;
  modalErrors.judul_berkas = false;
  modalErrors.lokasi = false;
  modalErrors.isi_ringkas = false;
  selectedRetensiAktif.value = 0;
  selectedRetensiInaktif.value = 0;
};

const onKlasifikasiChange = () => {
  const k = klasifikasiList.value.find((item: any) => item.klasifikasi === form.klasifikasi);
  if (k) {
    selectedRetensiAktif.value = k.retensi_aktif_tahun || 0;
    selectedRetensiInaktif.value = k.retensi_inaktif_tahun || 0;
  } else {
    selectedRetensiAktif.value = 0;
    selectedRetensiInaktif.value = 0;
  }
};

const onDokumenChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0] || null;
  form.dokumen_pendukung = file;
};

const onFotoLokasiChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0] || null;
  form.foto_lokasi_fisik = file;
};

// ── Submit ───────────────────────────────────────────────────────

const onSubmitBerkas = async (mode: 'draft' | 'aktif' = 'aktif') => {
  modalErrors.klasifikasi = !form.klasifikasi;
  modalErrors.judul_berkas = !form.judul_berkas;
  modalErrors.lokasi = !form.lokasi;
  modalErrors.isi_ringkas = !form.isi_ringkas;

  if (
    modalErrors.klasifikasi ||
    modalErrors.judul_berkas ||
    modalErrors.lokasi ||
    modalErrors.isi_ringkas
  ) {
    return;
  }

  isSubmitting.value = true;
  try {
    const payload: Record<string, any> = {
      klasifikasi: form.klasifikasi,
      judul_berkas: form.judul_berkas,
      hitung_waktu_retensi_dari: 'Sejak Berkas Ditutup',
      tindakan_penyusutan_akhir: form.tindakan_penyusutan_akhir,
      lokasi: form.lokasi,
      isi_ringkas: form.isi_ringkas,
      kategori_berkas: form.kategori_berkas || undefined,
      // ⚠️ Nama file saja; upload multipart ke storage adalah gap pre-existing (lihat catatan task).
      foto_lokasi_fisik: form.foto_lokasi_fisik?.name || undefined,
      dokumen_pendukung: form.dokumen_pendukung?.name || undefined,
    };

    const result: any = await createBerkas(payload);
    const createdBerkas = result?.data ?? result;

    if (!createdBerkas?.id) {
      throw new Error('ID berkas tidak ditemukan pada respons server.');
    }

    if (mode === 'aktif') {
      await activateBerkas(createdBerkas.id);
      toast.add({ title: 'Berkas berhasil dibuat & diaktifkan', color: 'success' });
    } else {
      toast.add({ title: 'Berkas disimpan sebagai draft', color: 'success' });
    }
    showCreateModal.value = false;
    resetForm();
    await fetchData();
  } catch (e: any) {
    toast.add({ title: e?.message || 'Gagal membuat berkas', color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

// ── Data Fetching ────────────────────────────────────────────────

const normalizePaginatedResponse = (response: any) => {
  // TransformResponseInterceptor membungkus response menjadi
  // { success: true, data: { data: [], meta: {} } }.
  // Tetap dukung response pagination tanpa wrapper agar composable fleksibel.
  const payload =
    response?.data?.data && Array.isArray(response.data.data)
      ? response.data
      : response?.data && Array.isArray(response.data)
        ? response
        : Array.isArray(response)
          ? { data: response, meta: {} }
          : { data: [], meta: {} };

  return {
    data: payload.data,
    meta: payload.meta ?? {},
  };
};

const fetchData = async () => {
  pending.value = true;
  try {
    const [list, stats] = await Promise.all([
      getBerkasList({
        search: search.value || undefined,
        status: filterStatus.value || undefined,
        klasifikasi: filterKlasifikasi.value || undefined,
        tahun: filterTahun.value || undefined,
        page: currentPage.value,
        limit: perPage.value,
      }),
      getBerkasStatistik(),
    ]);
    const normalizedList = normalizePaginatedResponse(list);
    berkasList.value = normalizedList.data;
    totalItems.value = Number(normalizedList.meta.total ?? normalizedList.data.length);
    statistik.value = stats?.data ?? stats;
  } catch (e) {
    console.error('Gagal memuat data berkas:', e);
  } finally {
    pending.value = false;
  }
};

const fetchKlasifikasi = async () => {
  try {
    const data: any = await getKlasifikasiDenganRetensi();
    klasifikasiList.value = Array.isArray(data) ? data : (data?.data ?? []);
  } catch (e) {
    console.error('Gagal memuat klasifikasi:', e);
  }
};

// ── Watchers ─────────────────────────────────────────────────────

// Filter changes -> reset to page 1 (the currentPage watcher then fetches;
// if already on page 1, fetch directly so the change still applies).
watch([search, filterStatus, filterKlasifikasi, filterTahun], () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else fetchData();
});

// Page/perPage changes -> fetch (perPage change resets to page 1 first).
watch([currentPage, perPage], ([, newPerPage], [, oldPerPage]) => {
  if (newPerPage !== oldPerPage && currentPage.value !== 1) {
    currentPage.value = 1;
    return;
  }
  fetchData();
});

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  fetchData();
  fetchKlasifikasi();
});
</script>
