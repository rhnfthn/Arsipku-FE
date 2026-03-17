<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
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
} from "lucide-vue-next";
import * as XLSX from "xlsx";
import { useTertunda } from "~/composables/useTertunda";
import { useLabel } from "~/composables/useLabel";

const { user, getProfile } = useAuth();
const toast = useToast();

// --- STATE MANAGEMENT ---
const {
  items,
  pagination,
  summary,
  isLoading: pending,
  fetchTertunda,
} = useTertunda();

const {
  labels,
  fetchLabels,
  createLabel,
  addNaskahToLabel: _addNaskahToLabel,
} = useLabel();

const searchQuery = ref("");
const isLabelProcessing = ref(false);

// Filter & Pagination State
const activeTab = ref("ALL");
const showDateMenu = ref(false);
const showSortMenu = ref(false);
const showPageMenu = ref(false);
const activeDateLabel = ref("30 Hari Terakhir");
const activeSortLabel = ref("Terbaru");
const itemsPerPage = ref(10);
const currentPage = ref(1);

// Date Filter State
const startDate = ref(new Date());
const endDate = ref(new Date());
const openStart = ref(false);
const openEnd = ref(false);
const isCustomDate = computed(() => activeDateLabel.value === "Custom");

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Tertunda", to: "#" },
];

// --- CONFIGURATION ---
const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
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

// --- HELPERS UI ---
const formatDateForApi = (date: Date) => {
  const d = new Date(date);
  const month = "" + (d.getMonth() + 1);
  const day = "" + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, "0"), day.padStart(2, "0")].join("-");
};

const formatShortDate = (dateString: string | null) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const isToday =
    date.getUTCDate() === now.getUTCDate() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCFullYear() === now.getUTCFullYear();
  const isThisYear = date.getUTCFullYear() === now.getUTCFullYear();

  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const time = `${hours}.${minutes}`;
  const day = date.getUTCDate();
  const month = new Intl.DateTimeFormat("id-ID", {
    month: "short",
    timeZone: "UTC",
  }).format(date);

  if (isToday) return time;
  if (isThisYear) return `${day} ${month} ${time}`;
  return `${day} ${month} ${date.getUTCFullYear()} ${time}`;
};

const getTabCount = (tabValue: string) => {
  if (!summary.value?.total_per_jenis) return 0;
  if (tabValue === "ALL") return summary.value.total_semua || 0;
  return summary.value.total_per_jenis[tabValue] || 0;
};

const getCategoryStyle = (cat: string) => {
  const c = (cat || "").toUpperCase();
  if (["ND", "NOTA DINAS"].includes(c))
    return "bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300";
  if (["SDI", "INTERNAL"].includes(c))
    return "bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300";
  if (["SDE", "EXTERNAL"].includes(c))
    return "bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300";
  if (["KAJIAN", "KA"].includes(c))
    return "bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300";
  return "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300";
};

const getCategoryLabel = (cat: string) => {
  const c = (cat || "").toUpperCase();
  if (["KA"].includes(c)) return "KA";
  if (["SDI", "INTERNAL"].includes(c)) return "SDI";
  if (["SDE", "EXTERNAL", "EKSTERNAL"].includes(c)) return "SDE";
  if (["ND", "NOTA DINAS"].includes(c)) return "ND";
  return "K";
};

const getSifatStyle = (sifat: string) => {
  const s = (sifat || "").toLowerCase();
  if (s === "rahasia") return "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-300";
  if (s === "penting") return "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500";
};

// --- LOGIC ---
const refreshData = async () => {
  try {
    let jenisParam = undefined;
    if (activeTab.value !== "ALL" && activeTab.value !== "Semua") {
      jenisParam = activeTab.value;
    }

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
      else if (activeDateLabel.value === "7 Hari Terakhir")
        calculatedStart.setDate(now.getDate() - 7);
      else if (activeDateLabel.value === "30 Hari Terakhir")
        calculatedStart.setDate(now.getDate() - 30);
      else if (activeDateLabel.value === "Bulan Ini")
        calculatedStart = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (activeDateLabel.value === "Tahun Ini")
        calculatedStart = new Date(now.getFullYear(), 0, 1);
      startStr = formatDateForApi(calculatedStart);
    }

    await fetchTertunda({
      page: currentPage.value,
      limit: itemsPerPage.value,
      jenis: jenisParam,
      search: searchQuery.value || undefined,
      start_date: startStr,
      end_date: endStr,
    });
  } catch (err) {
    console.error("Gagal refresh data tertunda:", err);
  }
};

const selectSortOption = (opt: string) => {
  activeSortLabel.value = opt;
  showSortMenu.value = false;
  if (opt === "Terbaru") {
    items.value.sort(
      (a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime()
    );
  } else {
    items.value.sort(
      (a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    );
  }
};

const selectDateFilter = (opt: string) => {
  activeDateLabel.value = opt;
  showDateMenu.value = false;
  refreshData();
};

const applyCustomDate = () => {
  activeDateLabel.value = "Custom";
  showDateMenu.value = false;
  refreshData();
};

const selectPageSize = (size: number) => {
  itemsPerPage.value = size;
  showPageMenu.value = false;
  refreshData();
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    refreshData();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    refreshData();
  }
};

const selectMail = (mail: any) => {
  navigateTo(`/korespondensi/tertunda/${mail.naskahId}?jenis=${mail.category}`);
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

watch([activeTab], () => {
  currentPage.value = 1;
  refreshData();
});
let searchTimeout: NodeJS.Timeout;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    refreshData();
  }, 500);
});

onMounted(async () => {
  if (!user.value) await getProfile();
  await fetchLabels();
  refreshData();
});
</script>

<template>
  <PageHeader title="Tertunda" :items="breadcrumbs" />
  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue">
    <!-- Toolbar -->
    <div
      class="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors">
      <!-- Left actions -->
      <div class="flex items-center gap-1 shrink-0 relative">
        <button @click="refreshData"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors">
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': pending }" />
        </button>
      </div>

      <!-- Right controls -->
      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">
        <!-- Date filter -->
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

        <!-- Sort -->
        <div class="relative">
          <button @click="showSortMenu = !showSortMenu"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors">
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
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors flex items-center gap-1">
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
              @click="prevPage" :disabled="currentPage === 1">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
                    ? 'bg-white text-primary'
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

                <!-- Mobile category badge -->
                <div class="flex items-center w-full md:hidden">
                  <span class="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
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
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
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
