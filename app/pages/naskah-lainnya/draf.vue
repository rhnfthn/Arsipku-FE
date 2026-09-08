<template>
  <AccessDenied v-if="!canAccessPage()" />
  <template v-else>
  <PageHeader title="Draft Naskah Lainnya" :items="breadcrumbs" />
  <div class="w-full flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-lg shadow-sm glass-blue">

    <!-- Toolbar -->
    <div
      class="h-14 border-b flex items-center border-gray-200 dark:border-gray-700 justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors">

      <div class="flex items-center gap-1 shrink-0 relative">
        <UTooltip text="Pilih semua">
          <div class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
            @click="toggleSelectAll">
            <div
              class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
              :class="{ 'bg-primary border-primary': isAllSelected, 'group-hover:border-gray-600 dark:group-hover:border-gray-300': !isAllSelected }">
              <Check v-if="isAllSelected" class="w-3 h-3 text-white" stroke-width="3" />
            </div>
          </div>
        </UTooltip>

        <UTooltip text="Muat ulang">
          <button @click="load()"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            :disabled="pending">
            <RotateCw class="w-4 h-4 transition-transform duration-300" :class="{ 'animate-spin': pending }" />
          </button>
        </UTooltip>

        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block" />
          <div class="flex items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200">
            <UTooltip text="Hapus">
              <button @click="confirmBulkDelete"
                class="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </UTooltip>
            <span class="text-xs text-neutral-500 dark:text-gray-400 ms-2">{{ selectedIds.size }} dipilih</span>
          </div>
        </template>
      </div>

      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">
        <!-- Sort -->
        <div class="relative">
          <UTooltip text="Urutkan">
            <button @click="showSortMenu = !showSortMenu"
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
              <ArrowUpDown class="w-4 h-4" />
            </button>
          </UTooltip>
          <div v-if="showSortMenu" @click="showSortMenu = false" class="fixed inset-0 z-40 bg-transparent" />
          <div v-if="showSortMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
            <button v-for="opt in sortOptions" :key="opt" @click="selectSortOption(opt)"
              class="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              :class="{ 'text-primary font-semibold': activeSortLabel === opt }">
              {{ opt }}
              <Check v-if="activeSortLabel === opt" class="w-3 h-3 text-primary" />
            </button>
          </div>
        </div>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

        <!-- Page size -->
        <div class="flex items-center gap-1">
          <div class="relative">
            <UTooltip text="Item per halaman">
              <button @click="showPageMenu = !showPageMenu"
                class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors">
                <Layers class="w-4 h-4" />
              </button>
            </UTooltip>
            <div v-if="showPageMenu" @click="showPageMenu = false" class="fixed inset-0 z-40 bg-transparent" />
            <div v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button v-for="size in pageOptions" :key="size" @click="selectPageSize(size)"
                class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors"
                :class="{ 'text-primary font-semibold bg-gray-50 dark:bg-gray-700': itemsPerPage === size }">
                {{ size }} item
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex items-center gap-1 text-caption1 text-neutral-600 dark:text-gray-400 shrink-0 h-[34px]">
          <span
            class="mx-1 font-medium hidden sm:inline whitespace-nowrap text-[12px] text-neutral-500 dark:text-gray-400">
            {{ totalItems === 0 ? "0-0" : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)}` }} dari {{ totalItems }}
          </span>
          <UTooltip text="Sebelumnya">
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 transition-colors"
              @click="prevPage" :disabled="currentPage === 1">
              <ChevronLeft class="w-4 h-4" />
            </button>
          </UTooltip>
          <UTooltip text="Berikutnya">
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 transition-colors"
              @click="nextPage" :disabled="currentPage >= totalPages">
              <ChevronRight class="w-4 h-4" />
            </button>
          </UTooltip>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden relative w-full">
      <div
        class="flex flex-col bg-white dark:bg-gray-800 transition-all duration-300 overflow-y-auto overflow-x-hidden flex-1 w-full">

        <!-- Tabs by jenis -->
        <div
          class="py-2.5 border-b border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 sticky top-0 z-10 w-full overflow-hidden">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full py-1">
            <UButton v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" color="primary"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 first:ms-2 last:me-2"
              :class="activeTab === tab.value
                ? 'bg-primary dark:bg-primary-600 text-white border-primary dark:border-primary-600'
                : 'bg-white dark:bg-gray-800 text-primary dark:text-primary-400 border-neutral-200/50 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30'">
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
              <span v-if="getTabCount(tab.value) > 0" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                :class="activeTab === tab.value ? 'bg-white text-primary' : 'bg-primary-50 dark:bg-primary-900/50 text-primary dark:text-primary-300'">
                {{ getTabCount(tab.value) }}
              </span>
            </UButton>
          </div>
        </div>

        <!-- Search (mobile) -->
        <div class="lg:hidden px-3 py-2 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div class="relative flex items-center">
            <Search class="absolute left-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input v-model="searchQuery" type="text" placeholder="Cari naskah..."
              class="w-full pl-8 pr-8 py-1.5 text-[13px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all" />
            <button v-if="searchQuery" @click="searchQuery = ''"
              class="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 pb-10 w-full relative min-h-[200px]">
          <div v-if="pending"
            class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800 z-20">
            <Loader2 class="w-8 h-8 text-primary animate-spin" />
          </div>

          <div v-else-if="pagedItems.length === 0"
            class="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-gray-500 mt-10">
            <Inbox class="w-12 h-12 mb-2 opacity-50" />
            <span class="text-sm">Belum ada draft naskah lainnya</span>
          </div>

          <div v-else>
            <div v-for="item in pagedItems" :key="item.id"
              class="group flex gap-2 items-start md:items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:shadow-sm transition-colors relative w-full h-auto min-h-[54px] hover:bg-gray-50 dark:hover:bg-gray-800/50">

              <!-- Checkbox -->
              <div class="flex items-center gap-3 pr-2 shrink-0 mt-1.5 md:mt-0">
                <div
                  class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors cursor-pointer"
                  :class="selectedIds.has(item.id) ? 'bg-primary border-primary' : 'bg-white dark:bg-gray-800'"
                  @click="toggleSelection(item.id)">
                  <Check v-if="selectedIds.has(item.id)" class="w-3 h-3 text-white" />
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3 overflow-hidden">
                <div class="flex md:hidden w-full mb-0.5">
                  <span class="text-neutral-500 dark:text-gray-400 text-[10px]">
                    {{ formatShortDate(item.tanggal) }}
                  </span>
                </div>

                <span class="block w-full md:w-48 xl:w-64 truncate text-[13px] shrink-0 font-semibold text-neutral-900 dark:text-gray-100">
                  {{ item.nomor || 'Tanpa Nomor' }}
                </span>

                <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 shrink-0">
                    {{ item.jenis }}
                  </span>
                  <div class="text-[13px] text-neutral-900 dark:text-gray-100 truncate flex-1 min-w-[120px]">
                    {{ item.perihal || 'Tanpa Perihal' }}
                  </div>
                </div>
              </div>

              <!-- Date -->
              <div class="hidden md:flex pl-2 shrink-0 justify-end w-[130px]">
                <span class="text-neutral-500 dark:text-gray-400 text-[12px] truncate">
                  {{ formatShortDate(item.tanggal) }}
                </span>
              </div>

              <!-- Actions -->
              <div class="pl-2 shrink-0 flex justify-end gap-1">
                <UTooltip text="Edit">
                  <button
                    class="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg text-orange-500 dark:text-orange-400 transition-colors"
                    @click.stop="handleEdit(item)">
                    <Pencil class="w-4 h-4" />
                  </button>
                </UTooltip>
                <UTooltip text="Hapus">
                  <button
                    class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 transition-colors"
                    @click.stop="confirmDeleteModal(item)">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </UTooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-5 text-center border border-gray-100 dark:border-gray-700">
          <div
            class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Hapus Draft</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Yakin ingin menghapus draft ini? Tindakan ini tidak dapat dibatalkan.</p>
          <div class="flex gap-3 justify-center">
            <button @click="showDeleteModal = false" :disabled="isDeleting"
              class="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
              Batal
            </button>
            <button @click="handleDelete" :disabled="isDeleting"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 flex items-center gap-2 transition-colors">
              <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
              {{ isDeleting ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import {
  Inbox, FileText, RotateCw, Check, Trash2, Pencil,
  ArrowUpDown, Layers, ChevronLeft, ChevronRight,
  Search, X, AlertTriangle, Loader2,
} from "lucide-vue-next";
import { useNaskahLainnya } from "~/composables/useNaskahLainnya";
import { formatNaskahDate } from "~/utils/naskah-lainnya-date";

definePageMeta({ layout: "default", middleware: ["auth"] });

const { canAccessPage } = useFeatureAccess();
const { t } = useI18n();
const { items, pending, fetchList, deleteDraft } = useNaskahLainnya();
const toast = useToast();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: "/beranda" },
  { label: t('draft'), to: "#" },
  { label: "Naskah Lainnya", to: "#" },
]);

// ── State ──────────────────────────────────────────────────────────
const selectedIds = ref(new Set());
const searchQuery = ref("");
const activeTab = ref("ALL");
const showSortMenu = ref(false);
const showPageMenu = ref(false);
const activeSortLabel = ref("Terbaru");
const itemsPerPage = ref(10);
const currentPage = ref(1);

const sortOptions = ["Terbaru", "Terlama"];
const pageOptions = [10, 25, 50];

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Peraturan", value: "PER", icon: FileText },
  { label: "Keputusan", value: "KEP", icon: FileText },
  { label: "Instruksi", value: "INS", icon: FileText },
  { label: "PKS", value: "PKS", icon: FileText },
  { label: "Berita Acara", value: "BAC", icon: FileText },
];

// ── Computed ───────────────────────────────────────────────────────
const filteredByTab = computed(() => {
  const all = items.value;
  if (activeTab.value === "ALL") return all;
  return all.filter((r) => r.jenis === activeTab.value);
});

const filteredBySearch = computed(() => {
  if (!searchQuery.value) return filteredByTab.value;
  const q = searchQuery.value.toLowerCase();
  return filteredByTab.value.filter(
    (r) =>
      (r.nomor ?? "").toLowerCase().includes(q) ||
      (r.perihal ?? "").toLowerCase().includes(q) ||
      (r.jenis ?? "").toLowerCase().includes(q),
  );
});

const sortedItems = computed(() => {
  const arr = [...filteredBySearch.value];
  if (activeSortLabel.value === "Terlama") {
    arr.sort((a, b) => new Date(a.terakhirDiubah).getTime() - new Date(b.terakhirDiubah).getTime());
  } else {
    arr.sort((a, b) => new Date(b.terakhirDiubah).getTime() - new Date(a.terakhirDiubah).getTime());
  }
  return arr;
});

const totalItems = computed(() => sortedItems.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)));

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return sortedItems.value.slice(start, start + itemsPerPage.value);
});

const isAllSelected = computed(() => pagedItems.value.length > 0 && pagedItems.value.every((r) => selectedIds.value.has(r.id)));

const getTabCount = (tabValue) => {
  if (tabValue === "ALL") return items.value.length;
  return items.value.filter((r) => r.jenis === tabValue).length;
};

// ── Helpers ────────────────────────────────────────────────────────
const formatShortDate = (dateString) => {
  return formatNaskahDate(dateString, "-");
};

// ── Actions ────────────────────────────────────────────────────────
function load() {
  return fetchList({ tab: "mine", tahapan: "konsep" });
}

function handleEdit(item) {
  navigateTo(`/naskah-lainnya/tulis?draft_id=${item.id}`);
}

// Delete
const showDeleteModal = ref(false);
const itemToDelete = ref<any>(null);
const isDeleting = ref(false);

const confirmDeleteModal = (item) => { itemToDelete.value = item; showDeleteModal.value = true; };
const confirmBulkDelete = () => { itemToDelete.value = null; showDeleteModal.value = true; };

const handleDelete = async () => {
  isDeleting.value = true;
  try {
    if (itemToDelete.value) {
      await deleteDraft(itemToDelete.value.id);
      selectedIds.value.delete(itemToDelete.value.id);
    } else {
      const idsArray = Array.from(selectedIds.value);
      for (const id of idsArray) {
        await deleteDraft(String(id));
      }
      selectedIds.value.clear();
    }
    showDeleteModal.value = false;
    toast.add({ title: "Draft berhasil dihapus", color: "success" });
    await load();
  } catch (e) {
    const errMsg = e?.response?.data?.message || e?.message || "Gagal menghapus draft";
    const msg = Array.isArray(errMsg) ? errMsg[0] : errMsg;
    toast.add({ title: "Gagal menghapus", description: msg, color: "error" });
  } finally {
    isDeleting.value = false;
    itemToDelete.value = null;
  }
};

// Selection
const toggleSelection = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    pagedItems.value.forEach((r) => selectedIds.value.delete(r.id));
  } else {
    pagedItems.value.forEach((r) => selectedIds.value.add(r.id));
  }
};

// Sort / Page
const selectSortOption = (opt) => { activeSortLabel.value = opt; showSortMenu.value = false; currentPage.value = 1; };
const selectPageSize = (size) => { itemsPerPage.value = size; showPageMenu.value = false; currentPage.value = 1; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

// ── Watchers ───────────────────────────────────────────────────────
watch([activeTab, searchQuery], () => { currentPage.value = 1; });

// Search debounce
let searchTimeout;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage.value = 1; }, 300);
});

// ── Init ───────────────────────────────────────────────────────────
onMounted(() => {
  load();
});
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
