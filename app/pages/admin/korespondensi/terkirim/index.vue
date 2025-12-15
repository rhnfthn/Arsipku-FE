<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import {
  Inbox, FileText, Send, Building, Building2, FilePen,
  Check, X, RotateCcw, MoreVertical, History, ArrowUpDown, Layers, Download,
  Archive, Trash2, ChevronLeft, ChevronRight, Eye, Loader2
} from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';
import { useSirkulasi } from '@/composables/useTerkirim';
import type { NaskahItem, UIMailItem } from '~/types/terkirim';
import * as XLSX from 'xlsx'; // Import library xlsx

// --- COMPOSABLES ---
const { user } = useAuth();
const { fetchSentBox, isLoading } = useSirkulasi();

// --- STATE ---
const selected = ref<UIMailItem | null>(null);
const selectedIds = ref(new Set<string>());

// State Filter & Toolbar
const activeTab = ref("ALL");
const searchQuery = ref("");

// Date Filter
const showDateMenu = ref(false);
const activeDateLabel = ref("30 Hari");
const dateOptions = ["7 Hari", "30 Hari", "60 Hari", "1 Tahun", "Semua"];

// Sorting
const showSortMenu = ref(false);
const activeSortLabel = ref("Terbaru");
const sortOptions = ["Terbaru", "Terlama"];

// Paging
const showPageMenu = ref(false);
const itemsPerPage = ref(10);
const pageOptions = [10, 25, 50, 100];
const currentPage = ref(1);

// Filter Menu
const showFilterMenu = ref(false);
const activeFilterType = ref("Semua");
const filterMenuOptions = [
  { label: "Semua", value: "Semua" },
  { label: "Sudah Dibaca", value: "Sudah Dibaca" },
  { label: "Belum Dibaca", value: "Belum Dibaca" },
];

// Data Holder
const emails = ref<UIMailItem[]>([]);

// --- MODAL READER STATE ---
const showReaderModal = ref(false);
const currentReaderData = ref({
  subject: '',
  readList: [] as any[],
  unreadList: [] as any[]
});

// --- HELPER: COLOR MAPPING ---
const getCategoryStyle = (cat: string) => {
  switch (cat) {
    case 'ND': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    case 'DI':
    case 'DISPOSISI': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
    case 'INTERNAL': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300';
    case 'EXTERNAL': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300';
    case 'KONSEP': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
};

const getCategoryLabel = (cat: string) => {
  if (cat === 'INTERNAL') return 'Surat Dinas Internal';
  if (cat === 'EXTERNAL') return 'Surat Dinas Eksternal';
  if (cat === 'ND') return 'Nota Dinas';
  if (cat === 'DI' || cat === 'DISPOSISI') return 'Disposisi';
  return cat;
};

// --- API FETCH & MAPPING ---
const loadData = async () => {
  const posId = user.value?.position;
  const rawData = await fetchSentBox(posId);

  emails.value = rawData.map((item: NaskahItem) => {
    const firstPenerima = item.penerima[0];

    const displayJobTitle = firstPenerima?.position_text || 'Tanpa Jabatan';
    const displayName = firstPenerima?.nama || 'Tanpa Nama';
    const initial = firstPenerima?.nama?.substring(0, 2).toUpperCase() || 'NA';

    const dateObj = new Date(item.tanggal);
    const dateStr = dateObj.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    return {
      id: item.id_naskah,
      from: displayJobTitle,
      email: displayName,
      subject: item.perihal,
      body: item.nomor || '-',
      category: item.jenis === 'DI' ? 'DISPOSISI' : item.jenis,
      date: dateStr,
      fullDate: item.tanggal,
      initial: initial,
      color: getCategoryStyle(item.jenis === 'DI' ? 'DISPOSISI' : item.jenis).split(' ')[0] + ' text-white',
      isRead: true,
      viewCount: item.summary_baca?.terbaca || 0,
      isFlagged: item.sifat === 'penting' || item.sifat === 'segera',
      isStarred: false,
      isLocked: item.status === 'final',
      hasNote: false,
      isArchived: false,
      canOpenTab: true,
      recipient: item.penerima.map(p => p.nama).join(', '),
      disposition: item.jenis_label,
      note: item.sifat,
      originalData: item
    };
  });
};

// --- FILTERING LOGIC ---
const filteredEmails = computed(() => {
  let result = emails.value;
  if (activeTab.value !== "ALL") {
    const searchCat = activeTab.value === 'DISPOSISI' ? ['DISPOSISI', 'DI'] : [activeTab.value];
    result = result.filter(mail => searchCat.includes(mail.category));
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(mail =>
      mail.subject.toLowerCase().includes(q) ||
      mail.recipient.toLowerCase().includes(q) ||
      mail.from.toLowerCase().includes(q) ||
      mail.body.toLowerCase().includes(q)
    );
  }
  switch (activeFilterType.value) {
    case "Sudah Dibaca": result = result.filter(mail => mail.viewCount > 0); break;
    case "Belum Dibaca": result = result.filter(mail => mail.viewCount === 0); break;
  }
  if (activeDateLabel.value !== "Semua") {
    const now = new Date();
    let days = 30;
    if (activeDateLabel.value === "7 Hari") days = 7;
    else if (activeDateLabel.value === "60 Hari") days = 60;
    else if (activeDateLabel.value === "1 Tahun") days = 365;
    const pastDate = new Date(now.setDate(now.getDate() - days));
    result = result.filter(mail => new Date(mail.fullDate) >= pastDate);
  }
  if (activeSortLabel.value === 'Terbaru') {
    result.sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime());
  } else {
    result.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }
  return result;
});

watch([activeTab, searchQuery, activeFilterType, activeDateLabel], () => { currentPage.value = 1; });

const totalItems = computed(() => filteredEmails.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value) || 1);
const paginatedEmails = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredEmails.value.slice(start, end);
});
const paginationInfo = computed(() => {
  if (totalItems.value === 0) return "0-0 Dari 0";
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(start + itemsPerPage.value - 1, totalItems.value);
  return `${start}-${end} Dari ${totalItems.value}`;
});

const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const applyFilter = (filterName: string) => { activeFilterType.value = filterName; showFilterMenu.value = false; };
const selectDateFilter = (opt: string) => { activeDateLabel.value = opt; showDateMenu.value = false; };
const selectSortOption = (opt: string) => { activeSortLabel.value = opt; showSortMenu.value = false; };
const selectPageSize = (size: number) => { itemsPerPage.value = size; currentPage.value = 1; showPageMenu.value = false; };

const toggleSelection = (id: string) => { if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id); };
const toggleSelectAll = () => { if (selectedIds.value.size === paginatedEmails.value.length) selectedIds.value.clear(); else paginatedEmails.value.forEach(mail => selectedIds.value.add(mail.id)); };
const isAllSelected = computed(() => paginatedEmails.value.length > 0 && selectedIds.value.size === paginatedEmails.value.length);
const selectMail = (mail: UIMailItem) => { selected.value = mail; };
const closeDetail = () => { selected.value = null; };

const openReaderModal = (mail: UIMailItem) => {
  const item = mail.originalData;
  const read = item.penerima.filter(p => p.status_baca === 'terbaca').map(p => ({
    name: p.nama,
    date: p.read_time ? new Date(p.read_time).toLocaleString('id-ID') : '-',
    initial: p.nama.substring(0, 1),
    bg: 'bg-blue-500'
  }));
  const unread = item.penerima.filter(p => p.status_baca !== 'terbaca').map(p => ({
    name: p.nama,
    status: 'Belum membaca',
    initial: p.nama.substring(0, 1),
    bg: 'bg-gray-400'
  }));
  currentReaderData.value = { subject: item.perihal, readList: read, unreadList: unread };
  showReaderModal.value = true;
};

const refreshData = () => { loadData(); selectedIds.value.clear(); };

const downloadExcel = () => {
  if (filteredEmails.value.length === 0) return;

  // Mapping data untuk Excel
  const excelData = filteredEmails.value.map(mail => {
    const item = mail.originalData;
    return {
      'Nomor Surat': item.nomor,
      'Jenis Naskah': item.jenis_label,
      'Perihal': item.perihal,
      'Sifat': item.sifat,
      'Status': item.status,
      'Tanggal Kirim': new Date(item.tanggal).toLocaleString('id-ID'),
      'Pengirim Nama': item.pengirim.nama,
      'Pengirim Jabatan': item.pengirim.position_text,
      'Pengirim Divisi': item.pengirim.organization_text,
      'Penerima (List)': item.penerima.map(p => `${p.nama} (${p.position_text})`).join('; '),
      'Total Penerima': item.summary_baca.total,
      'Sudah Dibaca': item.summary_baca.terbaca,
      'Belum Dibaca': item.summary_baca.belum_terbaca
    };
  });

  // Buat Worksheet & Workbook
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Kotak Keluar");

  // Download File
  XLSX.writeFile(wb, `Laporan_Terkirim_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DISPOSISI", icon: Send },
  { label: "Surat Dinas Internal", value: "INTERNAL", icon: Building },
  { label: "Surat Dinas Eksternal", value: "EXTERNAL", icon: Building2 },
  { label: "Konsep", value: "KONSEP", icon: FilePen },
];

onMounted(() => { loadData(); });
</script>

<template>
  <div class="w-full h-screen flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-lg"
    :class="['glass-blue']">

    <div
      class="h-14 border-b border-transparent flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 dark:border-gray-800 transition-colors">
      <div class="flex items-center gap-1 shrink-0 relative">
        <div class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
          @click="toggleSelectAll">
          <div
            class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
            :class="{ 'bg-primary border-primary': isAllSelected, 'group-hover:border-gray-600 dark:group-hover:border-gray-300': !isAllSelected }">
            <Check v-if="isAllSelected" class="w-3 h-3 text-white" stroke-width="3" />
          </div>
        </div>

        <div class="relative">
          <button @click="showFilterMenu = !showFilterMenu"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
            :class="{ 'bg-gray-100 dark:bg-gray-800 text-neutral-900 dark:text-gray-200': showFilterMenu }"
            title="Opsi Filter">
            <MoreVertical class="w-4 h-4" />
          </button>
          <div v-if="showFilterMenu" @click="showFilterMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showFilterMenu"
            class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in filterMenuOptions" :key="opt.value" @click="applyFilter(opt.value)"
              class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group transition-colors">
              <span :class="activeFilterType === opt.value ? 'font-semibold text-primary' : ''">{{ opt.label }}</span>
              <Check v-if="activeFilterType === opt.value" class="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
        </div>

        <button @click="refreshData"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Muat Ulang">
          <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>

        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
          <div class="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
            <button
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-error rounded">
              <Trash2 class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-primary rounded hidden sm:block">
              <Archive class="w-4 h-4" />
            </button>
          </div>
        </template>
      </div>

      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">
        <div class="relative">
          <button @click="showDateMenu = !showDateMenu" title="Periode Data"
            class="flex items-center gap-1 p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors">
            <History class="w-4 h-4 shrink-0" />
            <span class="text-xs hidden lg:inline truncate">{{ activeDateLabel }}</span>
          </button>

          <div v-if="showDateMenu" @click="showDateMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showDateMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in dateOptions" :key="opt" @click="selectDateFilter(opt)"
              class="w-full text-left px-3 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between">
              <span>{{ opt }}</span>
              <Check v-if="activeDateLabel === opt" class="w-3 h-3 text-primary" />
            </button>
          </div>
        </div>

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

        <button @click="downloadExcel"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Download Excel">
          <Download class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

        <div class="flex items-center gap-1">
          <div class="relative">
            <button @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
              title="Jumlah per halaman">
              <Layers class="w-4 h-4" />
            </button>
            <div v-if="showPageMenu" @click="showPageMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
            <div v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-20 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <button v-for="size in pageOptions" :key="size" @click="selectPageSize(size)"
                class="w-full text-center px-3 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                <span :class="itemsPerPage === size ? 'font-bold text-primary' : ''">{{ size }}</span>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-1 text-caption1 text-neutral-600 dark:text-gray-400 shrink-0 h-[34px]">
            <span
              class="mx-1 font-medium hidden sm:inline whitespace-nowrap text-[12px] text-neutral-500 dark:text-gray-400">{{
                paginationInfo }}</span>
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
              @click="prevPage" :disabled="currentPage === 1">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
              @click="nextPage" :disabled="currentPage === totalPages">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden relative w-full">

      <div
        class="flex flex-col bg-white dark:bg-gray-900 transition-all duration-300 border-r border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden"
        :class="selected ? 'hidden lg:flex lg:w-5/12 xl:w-[450px] shrink-0' : 'flex-1 w-full'">

        <div
          class="px-3 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 sticky top-0 z-10 w-full overflow-hidden">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full">
            <UButton v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" color="primary"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
              :class="activeTab === tab.value
                ? 'bg-primary-400 text-white border-primary-400'
                : 'bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 border-neutral-200/50 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30'">
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </UButton>
          </div>
        </div>

        <div class="flex-1 pb-10 w-full relative">
          <div v-if="isLoading"
            class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-20">
            <Loader2 class="w-8 h-8 text-primary animate-spin" />
          </div>

          <div v-else-if="paginatedEmails.length === 0"
            class="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <Inbox class="w-10 h-10 mb-2 opacity-20" />
            <span class="text-sm">Tidak ada data ditemukan</span>
          </div>

          <div v-else v-for="mail in paginatedEmails" :key="mail.id" @click="selectMail(mail)"
            class="group flex gap-3 items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:shadow-sm cursor-pointer transition-colors relative w-full"
            :class="selected?.id === mail.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'">

            <div class="flex items-center shrink-0" @click.stop>
              <div
                class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
                :class="selectedIds.has(mail.id) ? 'bg-primary border-primary' : 'bg-white dark:bg-gray-800'"
                @click="toggleSelection(mail.id)">
                <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
              </div>
            </div>

            <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4 overflow-hidden">
              <div class="flex items-center sm:w-44 lg:w-52 shrink-0">
                <div class="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {{ mail.from }}
                </div>
              </div>

              <div class="text-[13px] text-gray-900 dark:text-gray-100 truncate flex-1">
                {{ mail.subject }}
              </div>

              <div class="hidden xl:flex shrink-0 w-[150px] justify-start items-center">
                <span class="px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap truncate max-w-full"
                  :class="getCategoryStyle(mail.category)">
                  {{ getCategoryLabel(mail.category) }}
                </span>
              </div>
            </div>

            <div class="pl-2 shrink-0 text-right w-24">
              <span class="text-caption2b text-neutral-500 dark:text-gray-400 text-[12px] whitespace-nowrap">
                {{ mail.date }}
              </span>
            </div>

            <div
              class="min-w-10 pl-2 shrink-0 text-right w-8 flex items-center gap-1 text-neutral-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
              @click.stop="openReaderModal(mail)">
              <Eye class="w-3.5 h-3.5 text-primary" />
              <span class="text-[12px] font-medium text-primary">{{ mail.viewCount }}</span>
            </div>

          </div>
        </div>
      </div>

      <div v-if="selected"
        class="flex flex-col bg-white dark:bg-gray-900 absolute inset-0 z-40 lg:static lg:flex-1 lg:z-0 animate-in slide-in-from-right-8 duration-200 overflow-hidden border-l border-gray-200 dark:border-gray-800">

        <div class="flex flex-col bg-white dark:bg-gray-900 z-20 shrink-0">

          <div class="flex items-start justify-between px-6 pt-5 pb-2">
            <h2 class="text-xl text-gray-800 dark:text-gray-100 leading-tight pr-4 font-normal">
              {{ selected.subject }}
            </h2>
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 transition-colors"
              @click="closeDetail">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="px-6 pb-4 pt-2">
            <div class="flex gap-4 items-start">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium text-white shrink-0 mt-1"
                :class="selected.color.replace('text-white', '')">
                {{ selected.initial }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex flex-col leading-tight">
                  <div class="font-bold text-gray-900 dark:text-white text-[14px] whitespace-normal break-words">
                    {{ selected.from }}
                  </div>
                  <div class="text-gray-500 dark:text-gray-400 font-normal text-[13px]">
                    {{ selected.email }}
                  </div>
                </div>
                <div class="text-[13px] text-gray-500 dark:text-gray-500 mt-1">kepada (Lihat Penerima)</div>
              </div>
            </div>

            <div class="mt-4">
              <span
                class="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1 rounded text-[13px] font-medium inline-block">
                {{ getCategoryLabel(selected.category) }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6 bg-white dark:bg-gray-900">
          <div class="space-y-4 mb-8">
            <div>
              <div class="text-[13px] text-gray-500 dark:text-gray-400 mb-0.5">Nomor Surat</div>
              <div class="text-[15px] text-gray-900 dark:text-gray-200">{{ selected.body || '-' }}</div>
            </div>
            <div>
              <div class="text-[13px] text-gray-500 dark:text-gray-400 mb-0.5">Penerima</div>
              <div class="text-[15px] text-gray-900 dark:text-gray-200">{{ selected.recipient || '-' }}</div>
            </div>
            <div v-if="selected.disposition">
              <div class="text-[13px] text-gray-500 dark:text-gray-400 mb-0.5">Disposisi</div>
              <div class="text-[15px] text-gray-900 dark:text-gray-200">{{ selected.disposition }}</div>
            </div>
            <div v-if="selected.note">
              <div class="text-[13px] text-gray-500 dark:text-gray-400 mb-0.5">Sifat</div>
              <div class="text-[15px] text-gray-900 dark:text-gray-200 capitalize">{{ selected.note }}</div>
            </div>
          </div>
          <div class="text-gray-800 dark:text-gray-300 leading-relaxed text-[15px] whitespace-pre-wrap">
            Perihal: {{ selected.subject }}
          </div>
        </div>

        <div
          class="p-6 pt-0 mt-auto bg-white dark:bg-gray-900 shrink-0 border-t border-gray-100 dark:border-gray-800 pt-4">
          <NuxtLink :to="`/admin/korespondensi/terkirim/${selected.id}`"
            class="flex items-center justify-center w-full bg-primary text-white font-medium py-3 rounded-lg shadow-sm transition-colors text-[14px]">
            Lihat Detail Lengkap
          </NuxtLink>
        </div>
      </div>

    </div>

    <div v-if="showReaderModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
      <div
        class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="flex items-start justify-between p-5 pb-2">
          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">Status Pembaca Pesan</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{{ currentReaderData.subject }}</p>
          </div>
          <button @click="showReaderModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-5 pt-2 flex-1 overflow-y-auto max-h-[60vh]">
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              <span class="text-[15px] font-medium text-gray-800 dark:text-gray-200">Sudah Membaca ({{
                currentReaderData.readList.length }})</span>
            </div>
            <div class="space-y-2">
              <div v-for="(reader, idx) in currentReaderData.readList" :key="idx"
                class="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                    :class="reader.bg">{{ reader.initial }}</div>
                  <div>
                    <div class="text-sm font-semibold text-gray-900 dark:text-gray-200">{{ reader.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">Dibaca pada: {{ reader.date }}</div>
                  </div>
                </div>
                <div class="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
              </div>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-2 h-2 rounded-full bg-gray-400"></div>
              <span class="text-[15px] font-medium text-gray-800 dark:text-gray-200">Belum Membaca ({{
                currentReaderData.unreadList.length }})</span>
            </div>
            <div class="space-y-2">
              <div v-for="(reader, idx) in currentReaderData.unreadList" :key="idx"
                class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                    :class="reader.bg">{{ reader.initial }}</div>
                  <div>
                    <div class="text-sm font-semibold text-gray-900 dark:text-gray-200">{{ reader.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ reader.status }}</div>
                  </div>
                </div>
                <div class="w-2 h-2 rounded-full bg-gray-400 shrink-0"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-100 dark:border-gray-800">
          <button @click="showReaderModal = false"
            class="w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Tutup
          </button>
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
