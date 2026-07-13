<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { parseDate } from '@internationalized/date';
import {
  Inbox,
  FileText,
  Building,
  Building2,
  History,
  ArrowUpDown,
  Layers,
  RotateCw,
  Tag,
  Loader2,
  AlertTriangle,
  BookOpen,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Send,
  FilePen,
  Download,
  Search,
  X,
  Star,
  StickyNote,
  Lock,
  LockOpen,
  Archive,
  MoreVertical,
} from "lucide-vue-next";
import * as XLSX from "xlsx";
import { useTertunda } from "~/composables/useTertunda";
import { useLabel } from "~/composables/useLabel";
import { applyKorespondensiListQuery, replaceCurrentKorespondensiListQuery } from "~/utils/korespondensi-list-state";

definePageMeta({ middleware: "auth" });

const { user, getProfile, hasPermission } = useAuth();
const { canAccessPage } = useFeatureAccess()
const toast = useToast();
const route = useRoute();
const router = useRouter();

// --- STATE MANAGEMENT ---
const {
  items,
  pagination,
  summary,
  isLoading: pending,
  fetchTertunda,
  toggleFlag,
} = useTertunda();

const {
  labels,
  fetchLabels,
  createLabel,
  addNaskahToLabel: _addNaskahToLabel,
} = useLabel();

const searchQuery = ref("");
const isLabelProcessing = ref(false);
const isRefreshing = ref(false);
const activeFilterType = ref("Semua");
const showFilterMenu = ref(false);
const filterMenuOptions = [
  { label: "Semua", value: "Semua" },
  { label: "Favorit", value: "Favorit" },
  { label: "Prioritas", value: "Prioritas" },
  { label: "Catatan", value: "Catatan" },
  { label: "Lock", value: "Lock" },
  { label: "Arsip", value: "Arsip" },
];
const selectedIds = ref(new Set<string>());

// --- FLAG TOGGLE (favorit, arsip, lock, note) ---
const handleToggleFlag = async (
  mail: any,
  type: 'favorit' | 'arsip' | 'lock' | 'note',
) => {
  if (type === 'note') {
    noteModalMail.value = mail;
    noteModalText.value = mail.noteText || '';
    showNoteModal.value = true;
    return;
  }
  try {
    const item = items.value.find((i) => i.id === mail.id);
    if (!item) return;
    if (type === 'favorit') item.isStarred = !item.isStarred;
    if (type === 'arsip') item.isArsip = !item.isArsip;
    if (type === 'lock') item.isLocked = !item.isLocked;
    const isNowActive =
      type === 'favorit' ? item.isStarred : type === 'arsip' ? item.isArsip : item.isLocked;
    const descMap: Record<string, [string, string]> = {
      favorit: ['Ditambahkan ke Favorit', 'Dihapus dari Favorit'],
      arsip: ['Pesan diarsipkan', 'Pesan dikembalikan dari arsip'],
      lock: ['Pesan dikunci', 'Kunci pesan dibuka'],
    };
    toast.add({
      title: 'Berhasil',
      description: descMap[type][isNowActive ? 0 : 1],
      color: 'success',
    } as any);
    if (type === 'arsip' && isNowActive) {
      items.value = items.value.filter((i) => i.id !== mail.id);
    }
    await toggleFlag(item, type);
  } catch {
    toast.add({ title: 'Gagal', description: 'Gagal memperbarui status.', color: 'error' });
    refreshData();
  }
};

// --- NOTE MODAL ---
const showNoteModal = ref(false);
const noteModalMail = ref<any>(null);
const noteModalText = ref('');
const isSavingNote = ref(false);

const saveNoteFromList = async () => {
  const mail = noteModalMail.value;
  if (!mail) return;
  isSavingNote.value = true;
  try {
    const item = items.value.find((i) => i.id === mail.id);
    const hasText = noteModalText.value && noteModalText.value.trim().length > 0;
    if (item) {
      item.isNote = hasText;
      item.noteText = hasText ? noteModalText.value : '';
    }
    toast.add({
      title: 'Berhasil',
      description: hasText ? 'Catatan disimpan' : 'Catatan dihapus',
      color: 'success',
    } as any);
    await toggleFlag(item || mail, 'note', noteModalText.value);
    showNoteModal.value = false;
  } catch {
    toast.add({ title: 'Gagal', description: 'Gagal menyimpan catatan.', color: 'error' });
    refreshData();
  } finally {
    isSavingNote.value = false;
  }
};

const removeNoteFromList = async () => {
  noteModalText.value = '';
  await saveNoteFromList();
};

// --- BULK ARCHIVE ---
const showArchiveModal = ref(false);
const isArchiving = ref(false);

const handleBulkArchive = async () => {
  isArchiving.value = true;
  try {
    const mailItems = Array.from(selectedIds.value)
      .map((id) => items.value.find((e) => e.id === id))
      .filter((m): m is NonNullable<typeof m> => !!m);
    mailItems.forEach((m) => { m.isArsip = true; });
    await Promise.all(mailItems.map((m) => toggleFlag(m, 'arsip')));
    toast.add({
      title: 'Berhasil',
      description: `${mailItems.length} item berhasil diarsipkan.`,
      color: 'success',
    });
    selectedIds.value.clear();
    showArchiveModal.value = false;
    await refreshData();
  } catch {
    toast.add({ title: 'Gagal', description: 'Terjadi kesalahan saat mengarsipkan.', color: 'error' });
    await refreshData();
  } finally {
    isArchiving.value = false;
  }
};

// --- SELECTION ---
const toggleSelection = (id: string) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};
const toggleSelectAll = () => {
  if (isAllSelected.value) selectedIds.value.clear();
  else items.value.forEach((m) => selectedIds.value.add(m.id));
};
const isAllSelected = computed(
  () => items.value.length > 0 && selectedIds.value.size === items.value.length,
);

// Filter & Pagination State
const activeTab = ref("ALL");
const showDateMenu = ref(false);
const showSortMenu = ref(false);
const showPageMenu = ref(false);
const activeDateLabel = ref("Semua");
const activeSortLabel = ref("Terbaru");
const itemsPerPage = ref(10);
const currentPage = ref(1);

// Date Filter State (sama persis dengan kotak-masuk)
// Init kosong supaya SSR & client render identik (hindari hydration mismatch).
const startDateInput = ref('');
const endDateInput = ref('');
const startDateCal = ref<any>(null);
const endDateCal = ref<any>(null);
const openStartDate = ref(false);
const openEndDate = ref(false);
const isCustomDate = computed(() => activeDateLabel.value === "Custom");

// Sync CalendarDate ↔ string YYYY-MM-DD
watch(startDateCal, (val) => { if (val) startDateInput.value = val.toString(); });
watch(endDateCal, (val) => { if (val) endDateInput.value = val.toString(); });

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Tertunda", to: "#" },
];

// --- CONFIGURATION ---

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Kajian", value: "KA", icon: BookOpen },
];
const dateOptions = ["7 Hari", "30 Hari", "60 Hari", "1 Tahun", "Semua"];
const sortOptions = ["Terbaru", "Terlama"];
const pageOptions = [10, 25, 50, 100];

// --- HELPERS UI ---
import { formatShortDate, getCategoryStyle, getCategoryLabel } from "~/utils/mail-helpers";

const getTabCount = (tabValue: string) => {
  if (!summary.value?.total_per_jenis) return 0;
  if (tabValue === "ALL") return summary.value.total_semua || 0;
  return summary.value.total_per_jenis[tabValue] || 0;
};

const getSifatStyle = (sifat: string) => {
  const s = (sifat || "").toLowerCase();
  if (s === "rahasia") return "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-300";
  if (s === "penting") return "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500";
};

// --- LOGIC ---
const refreshData = async () => {
  isRefreshing.value = true;
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
    };

    // Tab → jenis
    if (activeTab.value !== "ALL" && activeTab.value !== "Semua") {
      params.jenis = activeTab.value;
    }

    // Sort
    params.sort = activeSortLabel.value === "Terlama" ? "terlama" : "terbaru";

    // Date filter (sama persis dengan kotak-masuk)
    const now = new Date();
    const toStr = (d: Date) => d.toISOString().split("T")[0];
    if (activeDateLabel.value === "Custom") {
      params.start_date = startDateInput.value;
      params.end_date = endDateInput.value;
    } else if (activeDateLabel.value !== "Semua") {
      const daysMap: Record<string, number> = { "7 Hari": 7, "30 Hari": 30, "60 Hari": 60, "1 Tahun": 365 };
      const days = daysMap[activeDateLabel.value];
      if (days) {
        const from = new Date(now);
        from.setDate(now.getDate() - days);
        params.start_date = toStr(from);
        params.end_date = toStr(now);
      }
    }

    // Filter type → API param
    const filterMap: Record<string, Record<string, any>> = {
      Favorit: { favorite: true },
      Prioritas: { priority: true },
      Catatan: { note: true },
      Lock: { lock: true },
      Arsip: { arsip: true },
    };
    Object.assign(params, filterMap[activeFilterType.value] || {});

    await fetchTertunda(params);
  } catch (err) {
    console.error("Gagal refresh data tertunda:", err);
  } finally {
    isRefreshing.value = false;
  }
};

const applyFilter = (v: string) => {
  activeFilterType.value = v;
  showFilterMenu.value = false;
  currentPage.value = 1;
  refreshData();
};

const selectSortOption = (opt: string) => {
  activeSortLabel.value = opt;
  showSortMenu.value = false;
  currentPage.value = 1;
  refreshData();
};

const selectDateFilter = (opt: string) => {
  activeDateLabel.value = opt;
  showDateMenu.value = false;
  currentPage.value = 1;
  refreshData();
};

const applyCustomDate = () => {
  activeDateLabel.value = "Custom";
  showDateMenu.value = false;
  currentPage.value = 1;
  refreshData();
};

const selectPageSize = (size: number) => {
  itemsPerPage.value = size;
  showPageMenu.value = false;
};

const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

const getListState = () => ({
  activeTab: activeTab.value,
  activeSortLabel: activeSortLabel.value,
  activeDateLabel: activeDateLabel.value,
  currentPage: currentPage.value,
  itemsPerPage: itemsPerPage.value,
  searchQuery: searchQuery.value,
  startDateInput: startDateInput.value,
  endDateInput: endDateInput.value,
});

const selectMail = async (mail: any) => {
  const listQuery = await replaceCurrentKorespondensiListQuery(router, route, getListState());
  navigateTo({
    path: `/korespondensi/tertunda/${mail.naskahId}`,
    query: { ...listQuery, jenis: mail.category },
  });
};

const downloadExcel = () => {
  if (items.value.length === 0) return;
  const tableData = items.value.map((mail, index) => ({
    No: index + 1,
    Nomor: mail.nomor || "-",
    Perihal: mail.subject || "-",
    Penerima: mail.from || "-",
    Pengirim: mail.originalData?.pengirim?.position_text || "-",
    Kategori: mail.category_label || mail.category || "-",
    Sifat: mail.sifat || "-",
    Status: mail.status || "-",
    Tanggal: formatShortDate(mail.fullDate),
  }));
  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tertunda");
  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `tertunda_${today}.xlsx`);
};

const totalPages = computed(() => pagination.value.totalPages);
const paginationInfo = computed(() => {
  if (pagination.value.total === 0) return "0-0 Dari 0";
  const start = (pagination.value.page - 1) * pagination.value.limit + 1;
  const end = Math.min(start + pagination.value.limit - 1, pagination.value.total);
  return `${start}-${end} Dari ${pagination.value.total}`;
});

watch([activeTab, itemsPerPage], () => { currentPage.value = 1; refreshData(); });
watch(activeFilterType, () => { currentPage.value = 1; refreshData(); });
watch(currentPage, () => refreshData());

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage.value = 1; refreshData(); }, 500);
});

onMounted(async () => {
  // Inisialisasi tanggal di client (hindari hydration mismatch dari new Date()).
  const today = new Date().toISOString().split('T')[0];
  startDateInput.value = today;
  endDateInput.value = today;
  startDateCal.value = parseDate(today);
  endDateCal.value = parseDate(today);

  if (!user.value) await getProfile();
  await fetchLabels();
  applyKorespondensiListQuery(route.query, {
    activeTab,
    activeSortLabel,
    activeDateLabel,
    currentPage,
    itemsPerPage,
    searchQuery,
    startDateInput,
    endDateInput,
  }, {
    tabs: tabs.map((t) => t.value),
    sorts: sortOptions,
    dates: dateOptions,
    pageSizes: pageOptions,
  });
  refreshData();
});
</script>

<template>
  <AccessDenied v-if="!canAccessPage()" />
  <template v-else>
  <PageHeader title="Tertunda" :items="breadcrumbs" />
  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue">
    <!-- Toolbar -->
    <div
      class="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors">
      <!-- Left actions -->
      <div class="flex items-center gap-1 shrink-0 relative">
        <!-- Select All -->
        <div class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
          title="Pilih Semua"
          @click="toggleSelectAll">
          <div
            class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
            :class="{ 'bg-primary border-primary': isAllSelected, 'group-hover:border-gray-600 dark:group-hover:border-gray-300': !isAllSelected }">
            <Check v-if="isAllSelected" class="w-3 h-3 text-white" stroke-width="3" />
          </div>
        </div>

        <!-- Filter Dropdown -->
        <div class="relative">
          <button @click="showFilterMenu = !showFilterMenu"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative"
            :class="{ 'bg-gray-100 dark:bg-gray-800 text-neutral-900 dark:text-gray-200': showFilterMenu }"
            title="Opsi Filter">
            <MoreVertical class="w-4 h-4" />
            <span v-if="activeFilterType !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-900" />
          </button>
          <div v-if="showFilterMenu" @click="showFilterMenu = false" class="fixed inset-0 z-40 bg-transparent" />
          <div v-if="showFilterMenu"
            class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in filterMenuOptions" :key="opt.value" @click="applyFilter(opt.value)"
              class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors">
              <span :class="activeFilterType === opt.value ? 'font-semibold text-primary' : ''">{{ opt.label }}</span>
              <Check v-if="activeFilterType === opt.value" class="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
        </div>

        <!-- Bulk Archive (muncul saat ada item dipilih) -->
        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block" />
          <div class="flex items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200">
            <button @click="showArchiveModal = true"
              class="p-1.5 text-primary dark:text-primary-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Arsipkan">
              <Archive class="w-4 h-4" />
            </button>
            <span class="text-xs text-neutral-500 dark:text-gray-400 ms-2">{{ selectedIds.size }} dipilih</span>
          </div>
        </template>

        <!-- Badge filter aktif -->
        <div
          v-if="activeFilterType !== 'Semua' && selectedIds.size === 0"
          class="flex items-center"
        >
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block" />
          <span
            class="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 border border-primary-200 dark:border-primary-700 rounded-full font-medium animate-in fade-in duration-200"
          >
            {{ activeFilterType }}
            <button @click="applyFilter('Semua')" class="hover:text-primary-800 ml-0.5">
              <X class="w-3 h-3" />
            </button>
          </span>
        </div>

        <button @click="refreshData"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Muat Ulang">
          <RotateCw class="w-4 h-4 transition-transform duration-300" :class="{ 'animate-spin': isRefreshing }" />
        </button>
      </div>

      <!-- Right controls -->
      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">
        <!-- Date filter -->
        <div class="relative">
          <button @click="showDateMenu = !showDateMenu" title="Periode Data"
            class="flex items-center gap-1 p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative">
            <History class="w-4 h-4 shrink-0" />
            <span v-if="activeDateLabel !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-900" />
          </button>
          <div v-if="showDateMenu" @click="showDateMenu = false" class="fixed inset-0 z-40 bg-transparent" />

          <div v-if="showDateMenu"
            class="absolute top-full right-0 mt-2 w-[480px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden flex animate-in fade-in slide-in-from-top-2 duration-150">

            <!-- Custom range -->
            <div class="w-7/12 p-4 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <div
                class="text-[13px] font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center justify-between">
                <span>Rentang Tanggal</span>
                <Check v-if="isCustomDate" class="w-3.5 h-3.5 text-primary" />
              </div>
              <div class="space-y-4">
                <!-- Mulai -->
                <div>
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Mulai</label>
                  <ClientOnly>
                    <UPopover v-model:open="openStartDate" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
                      <div
                        class="flex items-center gap-2 cursor-pointer w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md"
                        @click="openStartDate = true">
                        <UInputDate locale="id-ID" v-model="startDateCal" variant="none" size="sm" format="DD MMMM YYYY"
                          class="flex-1"
                          :ui="{ base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-5' }" />
                        <CalendarIcon class="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                      <template #content>
                        <UCalendar v-model="startDateCal" class="p-2" @update:model-value="openStartDate = false" />
                      </template>
                    </UPopover>
                  </ClientOnly>
                </div>
                <!-- Sampai -->
                <div>
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sampai</label>
                  <ClientOnly>
                    <UPopover v-model:open="openEndDate" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
                      <div
                        class="flex items-center gap-2 cursor-pointer w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md"
                        @click="openEndDate = true">
                        <UInputDate locale="id-ID" v-model="endDateCal" variant="none" size="sm" format="DD MMMM YYYY"
                          class="flex-1"
                          :ui="{ base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-5' }" />
                        <CalendarIcon class="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                      <template #content>
                        <UCalendar v-model="endDateCal" class="p-2" @update:model-value="openEndDate = false" />
                      </template>
                    </UPopover>
                  </ClientOnly>
                </div>
                <button @click="applyCustomDate"
                  class="w-full mt-2 bg-primary text-white text-[12px] font-medium py-2.5 rounded-md hover:bg-primary-600 transition-colors shadow-sm active:scale-[0.98]">
                  Terapkan Filter
                </button>
              </div>
            </div>

            <!-- Preset -->
            <div class="w-5/12 py-2 bg-white dark:bg-gray-800">
              <div class="px-4 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Preset
              </div>
              <button v-for="opt in dateOptions" :key="opt" @click="selectDateFilter(opt)"
                class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-primary flex items-center justify-between transition-colors">
                <span>{{ opt }}</span>
                <Check v-if="activeDateLabel === opt" class="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          </div>
        </div>

        <!-- Sort -->
        <div class="relative">
          <button @click="showSortMenu = !showSortMenu"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
            title="Urutkan">
            <ArrowUpDown class="w-4 h-4" />
          </button>
          <div v-if="showSortMenu" @click="showSortMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showSortMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in sortOptions" :key="opt" @click="selectSortOption(opt)"
              class="w-full text-left px-3 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between">
              <span>{{ opt }}</span>
              <Check v-if="activeSortLabel === opt" class="w-3 h-3 text-primary" />
            </button>
          </div>
        </div>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

        <!-- Page size + pagination -->
        <div class="flex items-center gap-1">
          <div class="relative">
            <button @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors flex items-center gap-1"
              title="Item per Halaman">
              <Layers class="w-4 h-4" />
            </button>
            <div v-if="showPageMenu" @click="showPageMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
            <div v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button v-for="size in pageOptions" :key="size" @click="selectPageSize(size)"
                class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors"
                :class="{ 'text-primary font-semibold bg-gray-50 dark:bg-gray-700': itemsPerPage === size }">
                {{ size }} Item
              </button>
            </div>
          </div>
          <div class="flex items-center gap-1 text-caption1 text-neutral-600 dark:text-gray-400 shrink-0 h-[34px]">
            <span
              class="mx-1 font-medium hidden sm:inline whitespace-nowrap text-[12px] text-neutral-500 dark:text-gray-400">
              {{ paginationInfo }}
            </span>
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Sebelumnya"
              @click="prevPage" :disabled="currentPage === 1">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Berikutnya"
              @click="nextPage" :disabled="currentPage === totalPages">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex overflow-hidden relative w-full">
      <div
        class="flex flex-col bg-white dark:bg-gray-800 transition-all duration-300 border-r border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden flex-1 w-full">

        <!-- Tabs -->
        <div
          class="py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 sticky top-0 z-10 w-full overflow-hidden">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full py-1">
            <UButton v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" color="primary"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 first:ms-2 last:me-2"
              :class="activeTab === tab.value
                  ? 'bg-primary dark:bg-primary-600 text-white border-primary dark:border-primary-600'
                  : 'bg-white dark:bg-gray-800 text-primary dark:text-primary-400 border-neutral-200/50 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                ">
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
              <span v-if="getTabCount(tab.value) > 0" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                :class="activeTab === tab.value
                    ? 'bg-white text-primary dark:bg-gray-800 dark:text-primary-400'
                    : 'bg-primary-50 dark:bg-primary-900/50 text-primary dark:text-primary-300'
                  ">
                {{ getTabCount(tab.value) }}
              </span>
            </UButton>
          </div>
        </div>

        <!-- List -->
        <div class="w-full overflow-x-auto pb-2">
          <div class="w-full min-w-full md:min-w-[800px]">

            <!-- Empty state -->
            <div v-if="items.length === 0 && !pending"
              class="flex flex-col items-center justify-center py-10 text-neutral-400 dark:text-gray-500 w-full">
              <Inbox class="w-12 h-12 mb-2 opacity-50" />
              <span class="text-sm">Tidak ada surat tertunda</span>
            </div>

            <!-- Skeleton -->
            <div v-else-if="pending" class="w-full">
              <div v-for="n in 10" :key="n"
                class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3 items-center w-full min-h-[50px]">
                <div class="flex-1 w-full flex flex-col md:flex-row md:items-center md:gap-4">
                  <div class="md:w-44 lg:w-52 shrink-0 flex flex-col gap-1.5 mb-1 md:mb-0">
                    <div class="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div class="h-2.5 w-1/2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                  </div>
                  <div class="flex-1 flex flex-wrap items-center gap-2 w-full">
                    <div class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div class="h-3 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div class="shrink-0 w-full md:w-[130px] md:text-right mt-1 md:mt-0">
                    <div class="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse md:ml-auto"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mail rows -->
            <div v-else class="w-full">
              <div v-for="mail in items" :key="mail.id" @click="selectMail(mail)"
                class="group flex flex-col md:flex-row gap-3 items-start px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:shadow-sm cursor-pointer transition-colors relative w-full min-h-[50px] hover:bg-gray-50 dark:hover:bg-gray-800/50">

                <!-- Left Controls -->
                <div class="flex items-center shrink-0 pt-1 gap-2 w-full md:w-auto" @click.stop>
                  <div
                    class="w-3.5 h-3.5 border-[1.5px] border-neutral-300 dark:border-gray-600 rounded-sm flex items-center justify-center transition-colors"
                    :class="selectedIds.has(mail.id) ? 'bg-primary border-primary' : 'bg-white dark:bg-gray-800'"
                    @click="toggleSelection(mail.id)">
                    <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
                  </div>
                  <Star
                    class="w-4 h-4 transition-colors hover:text-yellow-400 cursor-pointer"
                    :class="mail.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300 dark:text-gray-600'"
                    :title="mail.isStarred ? 'Favorit (aktif)' : 'Favorit'"
                    @click.stop="handleToggleFlag(mail, 'favorit')"
                  />
                  <span class="md:hidden ml-auto sm:ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    :class="getCategoryStyle(mail.category)">
                    {{ getCategoryLabel(mail.category) }}
                  </span>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-4 w-full">
                  <!-- Recipient -->
                  <div class="flex items-center md:w-44 lg:w-65 shrink-0 mb-1 md:mb-0">
                    <div class="flex flex-col min-w-0">
                      <UTooltip :text="mail.fullRecipients"
                        :ui="{ content: 'h-auto py-2 px-3', text: 'whitespace-pre-line text-left' }"
                        class="min-w-0 truncate">
                        <span
                          class="block w-full md:w-48 xl:w-64 truncate text-[13px] text-neutral-900 dark:text-gray-100 shrink-0 font-semibold cursor-help">
                          {{ mail.from }}
                        </span>
                      </UTooltip>
                      <div class="text-[11px] font-mono text-neutral-400 dark:text-gray-500 truncate">
                        {{ mail.nomor }}
                      </div>
                    </div>
                  </div>

                  <!-- Subject + labels -->
                  <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    <div v-if="mail.labels && mail.labels.length > 0" class="flex flex-wrap gap-1 shrink-0">
                      <span v-for="lbl in mail.labels" :key="lbl" :title="lbl"
                        class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 max-w-[80px] truncate cursor-help">
                        {{ lbl }}
                      </span>
                    </div>
                    <span v-if="mail.sifat && mail.sifat !== 'biasa'"
                      class="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize shrink-0"
                      :class="getSifatStyle(mail.sifat)">
                      {{ mail.sifat }}
                    </span>
                    <div
                      class="text-[13px] text-neutral-900 dark:text-gray-100 truncate flex-1 min-w-[120px] font-normal">
                      {{ mail.subject }}
                    </div>
                  </div>

                  <!-- Category badge desktop -->
                  <div class="hidden md:flex shrink-0 w-[50px] justify-start items-center">
                    <span
                      class="w-32 block text-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap truncate"
                      :class="getCategoryStyle(mail.category)">
                      {{ getCategoryLabel(mail.category) }}
                    </span>
                  </div>

                  <!-- Date + status -->
                  <div
                    class="shrink-0 w-full md:w-[160px] flex flex-row items-center justify-between md:justify-end gap-3 mt-1 md:mt-0 pt-0.5">
                    <span class="text-caption2b text-neutral-500 dark:text-gray-400 text-[12px] whitespace-nowrap order-1">
                      {{ formatShortDate(mail.fullDate) }}
                    </span>
                    <span
                      class="text-[10px] px-2 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300 order-2 capitalize">
                      {{ mail.status }}
                    </span>
                  </div>
                </div>

                <!-- Hover Quick Actions -->
                <div
                  class="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 rounded-md px-2 py-1.5 z-10 animate-in fade-in duration-200"
                >
                  <div class="flex items-center gap-2 p-1">
                    <StickyNote
                      class="w-4 h-4 transition-colors hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer"
                      :class="mail.isNote ? 'text-orange-600 fill-orange-100 dark:text-orange-400 dark:fill-orange-900/40' : 'text-neutral-300 dark:text-gray-600'"
                      :title="mail.isNote ? 'Catatan (ada)' : 'Catatan'"
                      @click.stop="handleToggleFlag(mail, 'note')"
                    />
                    <Lock
                      v-if="mail.isLocked"
                      class="w-4 h-4 transition-colors text-red-600 fill-red-100 hover:text-red-600 dark:text-red-400 dark:fill-red-900/40 dark:hover:text-red-400 cursor-pointer"
                      title="Kunci (aktif)"
                      @click.stop="handleToggleFlag(mail, 'lock')"
                    />
                    <LockOpen
                      v-else
                      class="w-4 h-4 transition-colors text-neutral-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                      title="Kunci"
                      @click.stop="handleToggleFlag(mail, 'lock')"
                    />
                    <Archive
                      class="w-4 h-4 transition-colors hover:text-green-600 dark:hover:text-green-400 cursor-pointer"
                      :class="mail.isArsip ? 'text-green-700 fill-green-100 dark:text-green-400 dark:fill-green-900/40' : 'text-neutral-300 dark:text-gray-600'"
                      :title="mail.isArsip ? 'Arsip (aktif)' : 'Arsip'"
                      @click.stop="handleToggleFlag(mail, 'arsip')"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    <!-- Note Modal -->
    <Teleport to="body">
      <div
        v-if="showNoteModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800"
        >
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700"
          >
            <div class="flex items-center gap-2">
              <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <StickyNote class="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white">Catatan Surat</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">Tambah atau edit catatan</p>
              </div>
            </div>
            <button
              @click="showNoteModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-5">
            <textarea
              v-model="noteModalText"
              rows="5"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 dark:text-white"
              placeholder="Tulis catatan Anda di sini..."
            ></textarea>
          </div>
          <div
            class="flex justify-between gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-700"
          >
            <button
              v-if="noteModalMail?.isNote"
              @click="removeNoteFromList"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 transition-colors"
            >
              Hapus Catatan
            </button>
            <div class="flex gap-3 ml-auto">
              <button
                @click="showNoteModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
              <button
                @click="saveNoteFromList"
                :disabled="isSavingNote"
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                <Loader2 v-if="isSavingNote" class="w-4 h-4 animate-spin" />
                {{ isSavingNote ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Archive Confirm Modal -->
    <Teleport to="body">
      <div
        v-if="showArchiveModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800"
        >
          <div class="p-5 text-center">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30"
            >
              <Archive class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Arsipkan Surat?</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Apakah Anda yakin ingin mengarsipkan <br />
              <span class="font-bold text-gray-800 dark:text-gray-200">{{ selectedIds.size }} item terpilih</span>?
            </p>
            <div class="flex gap-3 justify-center">
              <button
                @click="showArchiveModal = false"
                :disabled="isArchiving"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                @click="handleBulkArchive"
                :disabled="isArchiving"
                class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="isArchiving" class="w-4 h-4 animate-spin" />
                {{ isArchiving ? 'Memproses...' : 'Arsipkan' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    </div>
  </div>
  </template>
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
