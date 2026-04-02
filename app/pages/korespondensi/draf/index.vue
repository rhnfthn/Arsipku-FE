<script setup>
import { useRouter, useRoute } from "vue-router";
import { ref, computed, watch, onMounted } from "vue";
import {
  Inbox, FileText, Send, Building, Building2, FilePen, Trash2,
  ChevronLeft, ChevronRight, RotateCw, Check, Pencil, History,
  ArrowUpDown, Loader2, AlertTriangle, BookOpen, Tag,
  Calendar as CalendarIcon, Layers, Download, Search, X
} from "lucide-vue-next";
import * as XLSX from "xlsx";
import { useDraft } from "@/composables/useDraft";
import { useLabel } from "~/composables/useLabel";

definePageMeta({ middleware: "auth" });

// ── Auth & Toast ──────────────────────────────────────────────────────────────
const { user, getProfile } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// ── Composables ───────────────────────────────────────────────────────────────
const { items, pagination, pending, summary, fetchDrafts, deleteDraft, bulkDeleteDrafts } = useDraft();
const { addNaskahToLabel: _addNaskahToLabel } = useLabel();

// ── UI State ──────────────────────────────────────────────────────────────────
const selectedIds = ref(new Set());
const searchQuery = ref("");
const isLabelProcessing = ref(false);
const showLabelAssignModal = ref(false);

// ── Delete Modal ──────────────────────────────────────────────────────────────
const showDeleteModal = ref(false);
const itemToDelete = ref(null);
const isDeleting = ref(false);

// ── Filter & Sort ─────────────────────────────────────────────────────────────
const activeTab = ref("ALL");
const showDateMenu = ref(false);
const showSortMenu = ref(false);
const showPageMenu = ref(false);
const activeDateLabel = ref("30 Hari Terakhir");
const activeSortLabel = ref("Terbaru");

// ── Date Filter State ─────────────────────────────────────────────────────────
const startDate = ref(new Date());
const endDate = ref(new Date());
const openStart = ref(false);
const openEnd = ref(false);
const isCustomDate = computed(() => activeDateLabel.value === "Custom");

// ── Static Config ─────────────────────────────────────────────────────────────
const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Draf", to: "#" },
];

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Konsep", value: "K", icon: FilePen },
  { label: "Kajian", value: "KA", icon: BookOpen },
];

const dateOptions = [
  "Hari ini",
  "7 Hari Terakhir",
  "30 Hari Terakhir",
  "Bulan Ini",
  "Tahun Ini",
  "Semua",
];
const sortOptions = ["Terbaru", "Terlama"];
const pageOptions = [10, 25, 50, 100];

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDateForApi = (date) => {
  const d = new Date(date);
  const month = "" + (d.getMonth() + 1);
  const day = "" + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, "0"), day.padStart(2, "0")].join("-");
};

const formatShortDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  const time = `${date.getHours().toString().padStart(2, "0")}.${date.getMinutes().toString().padStart(2, "0")}`;
  const day = date.getDate();
  const month = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date);

  if (isToday) return time;
  if (isThisYear) return `${day} ${month} ${time}`;
  return `${day} ${month} ${date.getFullYear()} ${time}`;
};

const getTabCount = (tabValue) => {
  if (!summary.value) return 0;
  if (tabValue === "ALL") return summary.value.total_semua || 0;
  const counts = summary.value.total_per_jenis || {};
  return counts[tabValue] || counts[tabValue.toUpperCase()] || counts[tabValue.toLowerCase()] || 0;
};

const getCategoryStyle = (cat) => {
  const styles = {
    ND: "bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-300",
    DI: "bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-300",
    SDI: "bg-green-50 dark:bg-green-900/30 text-green-500 dark:text-green-300",
    SDE: "bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-300",
    KA: "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500 dark:text-cyan-300",
  };
  return styles[(cat || "").toUpperCase()] || "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300";
};

// ── Core: Fetch Data ──────────────────────────────────────────────────────────
const refreshData = async () => {
  const params = {};

  // Pagination
  params.page = pagination.value?.page || 1;
  params.limit = pagination.value?.limit || 10;

  // Tab & Search
  if (activeTab.value && activeTab.value !== "ALL") params.jenis = activeTab.value;
  if (searchQuery.value) params.search = searchQuery.value;

  // Sort
  params.sort = activeSortLabel.value === "Terlama" ? "terlama" : "terbaru";

  // Date filter
  let startStr = undefined;
  let endStr = undefined;
  const now = new Date();
  let calculatedStart = new Date();

  if (activeDateLabel.value === "Custom") {
    if (startDate.value && endDate.value) {
      startStr = formatDateForApi(startDate.value);
      endStr = formatDateForApi(endDate.value);
    }
  } else if (activeDateLabel.value !== "Semua") {
    endStr = formatDateForApi(now);
    if (activeDateLabel.value === "Hari ini") calculatedStart = now;
    else if (activeDateLabel.value === "7 Hari Terakhir") calculatedStart.setDate(now.getDate() - 7);
    else if (activeDateLabel.value === "30 Hari Terakhir") calculatedStart.setDate(now.getDate() - 30);
    else if (activeDateLabel.value === "Bulan Ini") calculatedStart = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (activeDateLabel.value === "Tahun Ini") calculatedStart = new Date(now.getFullYear(), 0, 1);
    startStr = formatDateForApi(calculatedStart);
  }

  params.start_date = startStr;
  params.end_date = endStr;

  await fetchDrafts(params);
  selectedIds.value.clear();
};

// ── Edit Draft ────────────────────────────────────────────────────────────────
const handleEdit = (mail) => {
  const jenis = (mail.category || "").trim().toUpperCase();
  const routes = {
    ND: "/korespondensi/tulis/nota-dinas",
    "NOTA DINAS": "/korespondensi/tulis/nota-dinas",
    DI: "/korespondensi/tulis/disposisi",
    DISPOSISI: "/korespondensi/tulis/disposisi",
    SDI: "/korespondensi/tulis/surat-dinas-internal",
    INTERNAL: "/korespondensi/tulis/surat-dinas-internal",
    SDE: "/korespondensi/tulis/surat-dinas-eksternal",
    EXTERNAL: "/korespondensi/tulis/surat-dinas-eksternal",
    KA: "/korespondensi/tulis/kajian",
    KAJIAN: "/korespondensi/tulis/kajian",
  };
  router.push({ path: routes[jenis] || "/korespondensi/tulis/nota-dinas", query: { draft_id: mail.id, mode: "edit" } });
};

// ── Delete ────────────────────────────────────────────────────────────────────
const confirmDeleteModal = (mail) => { itemToDelete.value = mail; showDeleteModal.value = true; };
const confirmBulkDelete = () => { itemToDelete.value = null; showDeleteModal.value = true; };

const handleDelete = async () => {
  isDeleting.value = true;
  try {
    if (itemToDelete.value) {
      await deleteDraft(itemToDelete.value.id);
      selectedIds.value.delete(itemToDelete.value.id);
    } else {
      const idsArray = Array.from(selectedIds.value);
      if (idsArray.length > 0) {
        await bulkDeleteDrafts(idsArray, Number(user.value?.position));
        selectedIds.value.clear();
      }
    }
    // Mundur satu halaman jika halaman kosong setelah hapus
    items.value.length === 0 && pagination.value.page > 1
      ? pagination.value.page--
      : await refreshData();
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    isDeleting.value = false;
    itemToDelete.value = null;
  }
};

// ── Label ─────────────────────────────────────────────────────────────────────
const addNaskahToLabel = async (naskahId, labelId) =>
  await _addNaskahToLabel(naskahId, labelId, "draft");

const assignLabelToSelected = async (labelId, labelName) => {
  if (selectedIds.value.size === 0) return;
  isLabelProcessing.value = true;
  try {
    const promises = Array.from(selectedIds.value).map((id) => {
      const item = items.value.find((e) => e.id === id);
      return addNaskahToLabel(item?.naskahId || id, labelId);
    });
    await Promise.all(promises);
    toast.add({ title: "Berhasil", description: `Label "${labelName}" ditambahkan ke draf.`, color: "success" });
    showLabelAssignModal.value = false;
    selectedIds.value.clear();
    await refreshData();
  } catch (error) {
    console.error("Gagal assign label:", error);
    toast.add({ title: "Gagal", description: "Gagal menambahkan label.", color: "error" });
  } finally {
    isLabelProcessing.value = false;
  }
};

const openLabelAssignModal = () => { showLabelAssignModal.value = true; };

// ── Selection ─────────────────────────────────────────────────────────────────
const toggleSelection = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};
const toggleSelectAll = () => {
  if (selectedIds.value.size === items.value.length) selectedIds.value.clear();
  else items.value.forEach((mail) => selectedIds.value.add(mail.id));
};
const isAllSelected = computed(() => items.value.length > 0 && selectedIds.value.size === items.value.length);

// ── Filter / Sort / Pagination UI Actions ─────────────────────────────────────
const selectSortOption = (opt) => { activeSortLabel.value = opt; showSortMenu.value = false; refreshData(); };
const selectDateFilter = (opt) => {
  activeDateLabel.value = opt;
  showDateMenu.value = false;
  pagination.value.page = 1;
  refreshData();
};
const applyCustomDate = () => {
  activeDateLabel.value = "Custom";
  showDateMenu.value = false;
  pagination.value.page = 1;
  refreshData();
};

// ── FUNGSI BARU: Select Limit Pagination ──
const selectPageSize = (size) => {
  pagination.value.limit = size;
  pagination.value.page = 1;
  showPageMenu.value = false;
  refreshData();
};

const nextPage = () => { if (pagination.value.page < pagination.value.totalPages) { pagination.value.page++; refreshData(); } };
const prevPage = () => { if (pagination.value.page > 1) { pagination.value.page--; refreshData(); } };

// ── EXPORT EXCEL ──────────────────────────────────────────────────────────────
const downloadExcel = () => {
  if (items.value.length === 0) return;
  const tableData = items.value.map((mail, index) => ({
    No: index + 1,
    Nomor: mail.nomor || "-",
    Perihal: mail.subject || "-",
    Penerima: mail.from || "-",
    Kategori: mail.category_text || mail.category || "-",
    Tanggal: formatShortDate(mail.created_at || mail.date),
  }));
  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Draf");
  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `draf_${today}.xlsx`);
};

// ── Watchers ──────────────────────────────────────────────────────────────────
// Tab berubah → reset ke halaman 1
watch([activeTab], () => {
  pagination.value.page = 1;
  refreshData();
});

// Search debounce
let searchTimeout;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    refreshData();
  }, 500);
});

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(refreshData);
</script>

<template>
  <PageHeader title="Draf" :items="breadcrumbs" />
  <div class="w-full flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-lg shadow-sm glass-blue">

    <div
      class="h-14 border-b flex items-center border-gray-200 dark:border-gray-700 justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors">

      <div class="flex items-center gap-1 shrink-0 relative">

        <div class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
          @click="toggleSelectAll">
          <div
            class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
            :class="{ 'bg-primary border-primary': isAllSelected, 'group-hover:border-gray-600 dark:group-hover:border-gray-300': !isAllSelected }">
            <Check v-if="isAllSelected" class="w-3 h-3 text-white" stroke-width="3" />
          </div>
        </div>

        <button @click="refreshData"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          :disabled="pending">
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': pending }" />
        </button>

        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block" />
          <div class="flex items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200">
            <button @click="confirmBulkDelete"
              class="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Hapus">
              <Trash2 class="w-4 h-4" />
            </button>
            <button @click="openLabelAssignModal"
              class="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary rounded transition-colors"
              title="Beri Label">
              <Tag class="w-4 h-4" />
            </button>
            <span class="text-xs text-neutral-500 dark:text-gray-400 ms-2">{{ selectedIds.size }} dipilih</span>
          </div>
        </template>
      </div>

      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">

        <div class="relative">
          <button @click="showDateMenu = !showDateMenu"
            class="flex items-center gap-1 p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative">
            <History class="w-4 h-4 shrink-0" />
            <span v-if="activeDateLabel !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-900"></span>
          </button>
          <div v-if="showDateMenu" @click="showDateMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showDateMenu"
            class="absolute top-full right-0 mt-1 w-[480px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex">
            <div class="w-7/12 p-4 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
              <div
                class="text-[13px] font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center justify-between">
                <span>Pilih Tanggal</span>
                <Check v-if="activeDateLabel === 'Custom'" class="w-3.5 h-3.5 text-primary" />
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Mulai</label>
                  <ClientOnly>
                    <UPopover v-model:open="openStart" :content="{ placement: 'bottom-start' }">
                      <UButton color="white" variant="outline" block class="justify-start">
                        <div class="flex items-center gap-2 w-full">
                          <span class="flex-1 text-left text-sm text-gray-700 dark:text-gray-200">
                            {{ startDate ? startDate.toLocaleDateString("id-ID") : "Pilih" }}
                          </span>
                          <CalendarIcon class="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </UButton>
                      <template #panel>
                        <div class="p-2">
                          <UCalendar v-model="startDate" @close="openStart = false" />
                        </div>
                      </template>
                    </UPopover>
                  </ClientOnly>
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sampai</label>
                  <ClientOnly>
                    <UPopover v-model:open="openEnd" :content="{ placement: 'bottom-start' }">
                      <UButton color="white" variant="outline" block class="justify-start">
                        <div class="flex items-center gap-2 w-full">
                          <span class="flex-1 text-left text-sm text-gray-700 dark:text-gray-200">
                            {{ endDate ? endDate.toLocaleDateString("id-ID") : "Pilih" }}
                          </span>
                          <CalendarIcon class="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </UButton>
                      <template #panel>
                        <div class="p-2">
                          <UCalendar v-model="endDate" @close="openEnd = false" />
                        </div>
                      </template>
                    </UPopover>
                  </ClientOnly>
                </div>
                <button @click="applyCustomDate"
                  class="w-full mt-2 bg-primary text-white text-[12px] font-medium py-2 rounded-md hover:bg-primary-600 transition-colors shadow-sm">
                  Terapkan Range
                </button>
              </div>
            </div>
            <div class="w-5/12 py-2 overflow-y-auto max-h-[300px]">
              <div class="px-4 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Preset
              </div>
              <button v-for="opt in dateOptions" :key="opt" @click="selectDateFilter(opt)"
                class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-primary flex items-center justify-between group transition-colors">
                <span>{{ opt }}</span>
                <Check v-if="activeDateLabel === opt && !isCustomDate" class="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          </div>
        </div>

        <div class="relative">
          <button @click="showSortMenu = !showSortMenu"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="Urutkan">
            <ArrowUpDown class="w-4 h-4" />
          </button>
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

        <button @click="downloadExcel"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Download Excel">
          <Download class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

        <div class="flex items-center gap-1">
          <div class="relative">
            <button @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors">
              <Layers class="w-4 h-4" />
            </button>
            <div v-if="showPageMenu" @click="showPageMenu = false" class="fixed inset-0 z-40 bg-transparent" />
            <div v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button v-for="size in pageOptions" :key="size" @click="selectPageSize(size)"
                class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors"
                :class="{ 'text-primary font-semibold bg-gray-50 dark:bg-gray-700': pagination.limit === size }">
                {{ size }} Item
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1 text-caption1 text-neutral-600 dark:text-gray-400 shrink-0 h-[34px]">
          <span
            class="mx-1 font-medium hidden sm:inline whitespace-nowrap text-[12px] text-neutral-500 dark:text-gray-400">
            {{ pagination.total === 0 ? "0-0" : `${pagination.from}-${pagination.to}` }} Dari {{ pagination.total }}
          </span>
          <button
            class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 transition-colors"
            @click="prevPage" :disabled="pagination.page === 1">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 transition-colors"
            @click="nextPage" :disabled="pagination.page >= pagination.totalPages">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden relative w-full">
      <div
        class="flex flex-col bg-white dark:bg-gray-800 transition-all duration-300 overflow-y-auto overflow-x-hidden flex-1 w-full">

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

        <div class="lg:hidden px-3 py-2 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div class="relative flex items-center">
            <Search class="absolute left-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input v-model="searchQuery" type="text" placeholder="Cari perihal, nomor..."
              class="w-full pl-8 pr-8 py-1.5 text-[13px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all" />
            <button v-if="searchQuery" @click="searchQuery = ''"
              class="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div class="flex-1 pb-10 w-full relative min-h-[200px]">

          <div v-if="pending"
            class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800 z-20">
            <Loader2 class="w-8 h-8 text-primary animate-spin" />
          </div>

          <div v-else-if="items.length === 0"
            class="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-gray-500 mt-10">
            <Inbox class="w-12 h-12 mb-2 opacity-50" />
            <span class="text-sm">Tidak ada draft ditemukan</span>
          </div>

          <div v-else>
            <div v-for="mail in items" :key="mail.id"
              class="group flex gap-2 items-start md:items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:shadow-sm transition-colors relative w-full h-auto min-h-[54px] hover:bg-gray-50 dark:hover:bg-gray-800/50">

              <div class="flex items-center gap-3 pr-2 shrink-0 mt-1.5 md:mt-0">
                <div
                  class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors cursor-pointer"
                  :class="selectedIds.has(mail.id) ? 'bg-primary border-primary' : 'bg-white dark:bg-gray-800'"
                  @click="toggleSelection(mail.id)">
                  <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
                </div>
              </div>

              <div class="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3 overflow-hidden">
                <div class="flex md:hidden w-full mb-0.5">
                  <span class="text-neutral-500 dark:text-gray-400 text-[10px]">
                    {{ formatShortDate(mail.created_at || mail.date) }}
                  </span>
                </div>

                <UTooltip :text="mail.fullRecipients"
                  :ui="{ content: 'h-auto py-2 px-3 max-w-xs', text: 'whitespace-pre-line text-left' }"
                  class="min-w-0 truncate">
                  <span
                    class="block w-full md:w-48 xl:w-64 truncate text-[13px] text-neutral-900 dark:text-gray-100 shrink-0 font-semibold cursor-help">
                    {{ mail.from }}
                  </span>
                </UTooltip>

                <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                  <div v-if="mail.category_label && mail.category_label.length > 0"
                    class="flex flex-wrap gap-1 shrink-0">
                    <span v-for="lbl in mail.category_label" :key="lbl" :title="lbl"
                      class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 max-w-[80px] truncate cursor-help">
                      {{ lbl }}
                    </span>
                  </div>
                  <div class="text-[13px] text-neutral-900 dark:text-gray-100 truncate flex-1 min-w-[120px]">
                    {{ mail.subject }}
                  </div>
                </div>

                <div class="hidden xl:flex shrink-0 w-[100px] justify-start items-center">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-medium truncate"
                    :class="getCategoryStyle(mail.category)">
                    {{ mail.category }}
                  </span>
                </div>
              </div>

              <div class="hidden md:flex pl-2 shrink-0 justify-end w-[130px]">
                <span class="text-neutral-500 dark:text-gray-400 text-[12px] truncate">
                  {{ formatShortDate(mail.created_at || mail.date) }}
                </span>
              </div>

              <div class="pl-2 shrink-0 flex justify-end gap-1">
                <button
                  class="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg text-orange-500 dark:text-orange-400 transition-colors"
                  @click.stop="handleEdit(mail)" title="Edit">
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 transition-colors"
                  @click.stop="confirmDeleteModal(mail)">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LabelAssignModal v-model="showLabelAssignModal" :selected-ids="selectedIds" source="draft"
      @assign="assignLabelToSelected" @success="selectedIds.clear()" />

    <Teleport to="body">
      <div v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-5 text-center border border-gray-100 dark:border-gray-700">
          <div
            class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Hapus Draf?</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Apakah Anda yakin ingin menghapus data ini?</p>
          <div class="flex gap-3 justify-center">
            <button @click="showDeleteModal = false" :disabled="isDeleting"
              class="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
              Batal
            </button>
            <button @click="handleDelete" :disabled="isDeleting"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 flex items-center gap-2 transition-colors">
              <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
              {{ isDeleting ? "Menghapus..." : "Hapus" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
