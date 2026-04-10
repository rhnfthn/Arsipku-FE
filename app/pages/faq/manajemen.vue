<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <div>
        <PageHeader title="Manajemen FAQ" :items="items" />
      </div>

      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors"
      >
        <Plus class="w-4 h-4" />
        Tambah FAQ
      </button>
    </div>

    <div
      class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Top Bar -->
      <div class="flex flex-wrap gap-2 items-center p-3">
        <!-- Rows per page (custom dropdown) -->
        <div class="relative">
          <button
            type="button"
            @click="openRowsDropdown = !openRowsDropdown"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
          >
            <span>{{ rowsPerPage }}</span>
            <ChevronDown
              class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': openRowsDropdown }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openRowsDropdown"
              class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                v-for="n in rowsChoices"
                :key="n"
                type="button"
                @click="
                  rowsPerPage = n;
                  openRowsDropdown = false;
                "
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                  rowsPerPage === n
                    ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ n }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Refresh -->
        <button
          @click="refreshData"
          class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition-colors"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <!-- Filter Kategori -->
        <div class="relative">
          <button
            type="button"
            @click="openKategoriFilter = !openKategoriFilter"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[120px] justify-between hover:border-primary transition-all"
          >
            <span class="truncate text-xs">{{
              selectedFilterKategoriId
                ? (kategoriOptions.find((k) => k.id === selectedFilterKategoriId)?.nama ?? 'Semua')
                : 'Semua'
            }}</span>
            <ChevronDown
              class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': openKategoriFilter }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openKategoriFilter"
              class="absolute z-30 mt-1 min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
            >
              <button
                type="button"
                @click="
                  selectedFilterKategoriId = '';
                  openKategoriFilter = false;
                "
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 transition-colors',
                  !selectedFilterKategoriId
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                Semua
              </button>
              <button
                v-for="cat in kategoriOptions"
                :key="cat.id"
                type="button"
                @click="
                  selectedFilterKategoriId = cat.id;
                  openKategoriFilter = false;
                "
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors capitalize',
                  selectedFilterKategoriId === cat.id
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ cat.nama }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Search -->
        <div class="relative flex-1 min-w-40">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="filters.search"
            placeholder="Cari pertanyaan..."
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>

        <!-- Export -->
        <button
          @click="onExport"
          class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap"
        >
          Export
        </button>
      </div>

      <!-- Table -->
      <table class="min-w-full border-collapse text-sm">
        <thead class="bg-primary-400 dark:bg-primary-700 text-white text-left">
          <tr>
            <th class="px-4 py-3 w-10">
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  @change="toggleSelectAll"
                  :checked="isAllSelected"
                  class="rounded border-gray-300"
                />
                <button
                  v-if="selectedIds.length > 0"
                  @click="openBulkDelete"
                  class="text-red-200 hover:text-red-400 transition-colors"
                  title="Hapus yang dipilih"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </th>
            <th
              class="px-4 py-3 font-semibold cursor-pointer select-none"
              @click="toggleSort('pertanyaan')"
            >
              <div class="flex items-center gap-1">Pertanyaan</div>
            </th>
            <th
              class="px-4 py-3 font-semibold cursor-pointer select-none"
              @click="toggleSort('kategori')"
            >
              <div class="flex items-center gap-1">Kategori</div>
            </th>
            <th class="px-4 py-3 font-semibold">Terakhir Update</th>
            <th class="px-4 py-3 font-semibold text-center">Puas</th>
            <th class="px-4 py-3 font-semibold text-center">Tidak Puas</th>
            <th class="px-4 py-3 font-semibold text-center">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-if="!loading"
            v-for="(faq, idx) in paginatedFaqs"
            :key="faq.id"
            class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :value="faq.id"
                v-model="selectedIds"
                class="rounded border-gray-300"
              />
            </td>

            <td class="px-4 py-3">
              <p class="font-semibold text-gray-700 dark:text-white truncate max-w-xs">
                {{ faq.pertanyaan }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {{ faq.deskripsi }}
              </p>
            </td>

            <td class="px-4 py-3">
              <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">{{
                faq.kategori
              }}</span>
            </td>

            <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {{ formatDate(faq.updatedAt) }}
            </td>

            <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-200">
              {{ faq.puas.toLocaleString('id-ID') }}
            </td>

            <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-200">
              {{ faq.tidakPuas.toLocaleString('id-ID') }}
            </td>

            <td class="px-4 py-3 text-center">
              <div class="flex justify-center gap-3">
                <button
                  class="p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors group"
                  @click="openEdit(faq)"
                >
                  <Pencil
                    class="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600"
                  />
                </button>

                <button
                  class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                  @click="openDelete(faq)"
                >
                  <Trash2 class="w-4 h-4 text-red-600 dark:text-red-500 group-hover:text-red-600" />
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="loading">
            <td colspan="7" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
              <div class="flex justify-center">
                <div
                  class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"
                />
              </div>
            </td>
          </tr>
          <tr v-else-if="paginatedFaqs.length === 0">
            <td colspan="7" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
              Tidak ada data FAQ ditemukan.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="filteredFaqs.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Menampilkan {{ paginatedFaqs.length }} dari {{ filteredFaqs.length }} data
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Sebelumnya
          </button>

          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              1
            </button>

            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >

            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'
              ]"
            >
              {{ page }}
            </button>

            <span
              v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >

            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
            ]"
          >
            Selanjutnya
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Tambah / Edit -->
  <Teleport to="body" size="xl">
    <Modal v-model="showModal" :saving="isSaving" @save="saveFaq">
      <template #title>
        <Heading variant="heading9b" class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white">
          {{ isEditMode ? 'Edit FAQ' : 'Tambah FAQ' }}
        </Heading>
      </template>

      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">Pertanyaan</label>
        <input
          v-model="form.pertanyaan"
          type="text"
          placeholder="Masukkan pertanyaan..."
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200"
          >Deskripsi / Jawaban</label
        >
        <textarea
          v-model="form.deskripsi"
          rows="4"
          placeholder="Masukkan jawaban atau deskripsi..."
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 resize-none"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">Kategori</label>
        <!-- Custom fake select dropdown -->
        <div class="relative">
          <button
            type="button"
            @click="openKategoriDropdown = !openKategoriDropdown"
            class="w-full h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-left rounded-md flex items-center justify-between hover:border-primary transition-all"
          >
            <span
              :class="
                form.kategoriId
                  ? 'text-gray-800 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              "
            >
              {{
                kategoriOptions.find((k) => k.id === form.kategoriId)?.nama || 'Pilih kategori...'
              }}
            </span>
            <ChevronDown
              class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': openKategoriDropdown }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openKategoriDropdown"
              class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
            >
              <div
                v-for="cat in kategoriOptions"
                :key="cat.id"
                :class="[
                  'group relative flex items-center border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                  form.kategoriId === cat.id
                    ? 'bg-primary/5'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                <button
                  type="button"
                  @click="
                    form.kategoriId = cat.id;
                    openKategoriDropdown = false;
                    showNewKategori = false;
                  "
                  :class="[
                    'flex-1 text-left px-4 py-2.5 text-sm capitalize',
                    form.kategoriId === cat.id
                      ? 'text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white'
                  ]"
                >
                  {{ cat.nama }}
                </button>
                <button
                  type="button"
                  @click.stop="deleteKategoriItem(cat)"
                  class="opacity-0 group-hover:opacity-100 p-1.5 mr-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                  title="Hapus kategori"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                @click="
                  showNewKategori = true;
                  openKategoriDropdown = false;
                "
                class="w-full text-left px-4 py-2.5 text-sm text-primary dark:text-primary-400 hover:bg-primary/5 transition-colors font-medium flex items-center gap-2"
              >
                <Plus class="w-3.5 h-3.5" />
                Lainnya...
              </button>
            </div>
          </Transition>
        </div>

        <!-- New kategori input form (shown when Lainnya is selected) -->
        <div
          v-if="showNewKategori"
          class="space-y-2 p-3 border border-primary/30 rounded-lg bg-primary/5 dark:bg-primary-900/20"
        >
          <input
            v-model="newKategori"
            type="text"
            placeholder="Nama kategori baru..."
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          <input
            v-model="newKategoriDeskripsi"
            type="text"
            placeholder="Deskripsi (opsional)..."
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          <div class="flex gap-2">
            <button
              type="button"
              @click="saveNewKategori"
              :disabled="isSavingKategori"
              class="flex-1 bg-primary text-white px-3 py-1.5 rounded-md text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {{ isSavingKategori ? 'Menyimpan...' : 'Tambah' }}
            </button>
            <button
              type="button"
              @click="
                showNewKategori = false;
                newKategori = '';
                newKategoriDeskripsi = '';
              "
              class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </Modal>
  </Teleport>

  <!-- Confirm Delete -->
  <ConfirmPopup
    v-model="confirmDeleteOpen"
    type="danger"
    title="Hapus FAQ"
    message="Apakah Anda yakin ingin menghapus FAQ ini? Tindakan ini tidak dapat dibatalkan."
    confirm-text="Hapus"
    cancel-text="Batal"
    @confirm="deleteNow"
  />

  <!-- Confirm Bulk Delete -->
  <ConfirmPopup
    v-model="confirmBulkDeleteOpen"
    type="danger"
    title="Hapus FAQ Terpilih"
    :message="`Apakah Anda yakin ingin menghapus ${selectedIds.length} FAQ yang dipilih? Tindakan ini tidak dapat dibatalkan.`"
    confirm-text="Hapus Semua"
    cancel-text="Batal"
    @confirm="bulkDeleteNow"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Trash2, RotateCcw, FileDown, Search, Plus, Pencil, ChevronDown } from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Modal from '@/components/Modal.vue';
import type { Faq, FaqKategori } from '@/composables/useFaq';

definePageMeta({ middleware: 'auth' });

const toast = useToast();
const {
  faqs,
  loading,
  fetchFaqs,
  fetchCategories,
  createFaq,
  updateFaq,
  deleteFaq,
  createKategori,
  deleteKategori
} = useFaq();

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Manajemen FAQ', to: '/faq/manajemen' }
];

// ─── Categories (from API) ───────────────────────────────────────────────────
const kategoriOptions = ref<FaqKategori[]>([]);
const loadCategories = async () => {
  kategoriOptions.value = await fetchCategories();
};

// ─── Filter & Sort ────────────────────────────────────────────────────────────
const filters = ref({ search: '' });
const sortKey = ref<'pertanyaan' | 'kategori' | null>(null);
const sortAsc = ref(true);

const toggleSort = (key: 'pertanyaan' | 'kategori') => {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = true;
  }
};

// ─── Pagination ───────────────────────────────────────────────────────────────
const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const currentPage = ref<number>(1);
const openRowsDropdown = ref(false);
const openKategoriDropdown = ref(false);
const openKategoriFilter = ref(false);
const selectedFilterKategoriId = ref('');
// ─── Checkbox ─────────────────────────────────────────────────────────────────
const selectedIds = ref<string[]>([]);

const isAllSelected = computed(
  () =>
    paginatedFaqs.value.length > 0 &&
    paginatedFaqs.value.every((f) => selectedIds.value.includes(f.id))
);

const toggleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    selectedIds.value = paginatedFaqs.value.map((f) => f.id);
  } else {
    selectedIds.value = [];
  }
};

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredFaqs = computed(() => {
  const q = filters.value.search.toLowerCase();
  const selectedKat = selectedFilterKategoriId.value
    ? kategoriOptions.value.find((k) => k.id === selectedFilterKategoriId.value)
    : null;
  let list = faqs.value.filter((f) => {
    const matchSearch =
      !q || `${f.pertanyaan} ${f.deskripsi} ${f.kategori}`.toLowerCase().includes(q);
    const matchKategori =
      !selectedKat || f.kategoriId === selectedKat.id || f.kategori === selectedKat.nama;
    return matchSearch && matchKategori;
  });
  if (sortKey.value) {
    const key = sortKey.value;
    list = [...list].sort((a, b) => {
      const cmp = a[key].localeCompare(b[key], 'id');
      return sortAsc.value ? cmp : -cmp;
    });
  }
  return list;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredFaqs.value.length / rowsPerPage.value))
);

const paginatedFaqs = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredFaqs.value.slice(start, start + rowsPerPage.value);
});

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else if (current <= 2) {
    pages.push(1, 2, 3, 4, 5);
  } else if (current >= total - 1) {
    pages.push(total - 2, total - 1, total);
  } else {
    pages.push(current - 1, current, current + 1);
  }
  return pages;
});

watch([() => filters.value.search, rowsPerPage, selectedFilterKategoriId], () => {
  currentPage.value = 1;
});

// ─── Modal ────────────────────────────────────────────────────────────────────
const showModal = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);
const isSaving = ref(false);

const showNewKategori = ref(false);
const newKategori = ref('');
const newKategoriDeskripsi = ref('');
const isSavingKategori = ref(false);

const saveNewKategori = async () => {
  if (!newKategori.value.trim()) return;
  isSavingKategori.value = true;
  try {
    const created = await createKategori({
      nama: newKategori.value.trim(),
      deskripsi: newKategoriDeskripsi.value.trim() || undefined
    });
    await loadCategories();
    // Use the returned ID, or find by name as fallback
    const match = kategoriOptions.value.find((k) => k.nama === newKategori.value.trim());
    form.value.kategoriId = match?.id ?? created.id;
    showNewKategori.value = false;
    newKategori.value = '';
    newKategoriDeskripsi.value = '';
    showToast('Berhasil', 'Kategori berhasil ditambahkan.', 'success');
  } catch {
    showToast('Gagal', 'Gagal menambahkan kategori.', 'error');
  } finally {
    isSavingKategori.value = false;
  }
};

const form = ref({ pertanyaan: '', deskripsi: '', kategoriId: '' });

const openAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  form.value = { pertanyaan: '', deskripsi: '', kategoriId: '' };
  showModal.value = true;
};

const openEdit = async (faq: Faq) => {
  if (kategoriOptions.value.length === 0) {
    await loadCategories();
  }

  isEditMode.value = true;
  editingId.value = faq.id;
  const matchingKat = faq.kategoriId
    ? kategoriOptions.value.find((k) => String(k.id) === String(faq.kategoriId))
    : kategoriOptions.value.find((k) => k.nama.toLowerCase() === faq.kategori.toLowerCase());
  form.value = {
    pertanyaan: faq.pertanyaan,
    deskripsi: faq.deskripsi,
    kategoriId: matchingKat?.id ? String(matchingKat.id) : ''
  };
  showModal.value = true;
};

const saveFaq = async () => {
  if (isSaving.value) return;

  if (!form.value.pertanyaan || !form.value.kategoriId) {
    showToast('Validasi', 'Pertanyaan dan kategori wajib diisi.', 'warning');
    return;
  }

  isSaving.value = true;
  try {
    const payload = {
      pertanyaan: form.value.pertanyaan,
      deskripsi: form.value.deskripsi,
      kategoriId: form.value.kategoriId
    };

    if (isEditMode.value && editingId.value !== null) {
      await updateFaq(editingId.value, payload);
      showToast('Berhasil', 'FAQ berhasil diperbarui.', 'success');
    } else {
      await createFaq(payload);
      showToast('Berhasil', 'FAQ berhasil ditambahkan.', 'success');
    }

    showModal.value = false;
    await Promise.all([fetchFaqs(), loadCategories()]);
  } catch {
    showToast('Gagal', 'Terjadi kesalahan saat menyimpan FAQ.', 'error');
  } finally {
    isSaving.value = false;
  }
};

// ─── Delete Kategori ──────────────────────────────────────────────────────────
const deleteKategoriItem = async (kat: FaqKategori) => {
  const hasFaqs = faqs.value.some((f) => f.kategoriId === kat.id || f.kategori === kat.nama);
  if (hasFaqs) {
    showToast('Tidak Dapat Dihapus', `Kategori "${kat.nama}" masih digunakan oleh FAQ.`, 'error');
    return;
  }
  try {
    await deleteKategori(kat.id);
    await loadCategories();
    if (form.value.kategoriId === kat.id) form.value.kategoriId = '';
    if (selectedFilterKategoriId.value === kat.id) selectedFilterKategoriId.value = '';
    showToast('Berhasil', `Kategori "${kat.nama}" berhasil dihapus.`, 'success');
  } catch {
    showToast('Gagal', 'Gagal menghapus kategori.', 'error');
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
const confirmDeleteOpen = ref(false);
const itemToDelete = ref<Faq | null>(null);
const confirmBulkDeleteOpen = ref(false);

const openBulkDelete = () => {
  confirmBulkDeleteOpen.value = true;
};

const bulkDeleteNow = async () => {
  try {
    await Promise.all(selectedIds.value.map((id) => deleteFaq(id)));
    showToast('Berhasil', `${selectedIds.value.length} FAQ berhasil dihapus.`, 'success');
    selectedIds.value = [];
    await Promise.all([fetchFaqs(), loadCategories()]);
  } catch {
    showToast('Gagal', 'Terjadi kesalahan saat menghapus FAQ.', 'error');
  } finally {
    confirmBulkDeleteOpen.value = false;
  }
};

const openDelete = (faq: Faq) => {
  itemToDelete.value = faq;
  confirmDeleteOpen.value = true;
};

const deleteNow = async () => {
  if (!itemToDelete.value) return;
  try {
    await deleteFaq(itemToDelete.value.id);
    showToast('Berhasil', 'FAQ berhasil dihapus.', 'success');
    await Promise.all([fetchFaqs(), loadCategories()]);
  } catch {
    showToast('Gagal', 'Terjadi kesalahan saat menghapus FAQ.', 'error');
  } finally {
    confirmDeleteOpen.value = false;
    itemToDelete.value = null;
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const refreshData = async () => {
  currentPage.value = 1;
  await fetchFaqs();
};
const onExport = () => {
  const data = filteredFaqs.value.map((faq, idx) => ({
    No: idx + 1,
    Pertanyaan: faq.pertanyaan,
    'Deskripsi/Jawaban': faq.deskripsi,
    Kategori: faq.kategori,
    'Terakhir Update': formatDate(faq.updatedAt),
    Puas: faq.puas,
    'Tidak Puas': faq.tidakPuas
  }));

  if (data.length === 0) {
    showToast('Info', 'Tidak ada data untuk diekspor.', 'warning');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 50 },
    { wch: 60 },
    { wch: 20 },
    { wch: 15 },
    { wch: 8 },
    { wch: 10 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Manajemen FAQ');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `manajemen_faq_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast('Berhasil', 'Export berhasil.', 'success');
};
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const showToast = (
  title: string,
  message: string,
  color: 'success' | 'error' | 'warning' | 'primary' = 'success'
) => {
  toast.add({
    title,
    description: message,
    color,
    icon:
      color === 'success'
        ? 'i-lucide-check-circle'
        : color === 'error'
          ? 'i-lucide-x-circle'
          : 'i-lucide-info'
  });
};

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchFaqs(), loadCategories()]);
});
</script>

<style scoped>
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.15s ease;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  border-radius: 10px;
}
::-webkit-scrollbar-thumb {
  border-radius: 10px;
}
</style>
