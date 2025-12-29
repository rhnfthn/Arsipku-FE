<script setup>
import { ref, computed, watch } from "vue";
import {
  Inbox, FileText, Send, Building, Building2, FilePen,
  Search, Archive, Trash2, ChevronLeft, ChevronRight,
  RotateCcw, Star, Check, X, Calendar,
  Printer, Mail, AlertCircle, SquareArrowOutUpRight, Clock,
  MoreVertical, History, ArrowUpDown, Layers, Download,
  Lock, Flag, StickyNote, Eye // Tambah Icon Eye
} from 'lucide-vue-next';

// --- STATE ---
const selected = ref(null);
const selectedIds = ref(new Set());
const showDateFilter = ref(false);
const dateFilterLabel = ref("30 Hari");
const activeTab = ref("ALL");
const searchQuery = ref("");

const showDateMenu = ref(false);
const activeDateLabel = ref("30 Hari");

// Sorting
const showSortMenu = ref(false);
const activeSortLabel = ref("Terbaru");
const sortOptions = ["Terbaru", "Terlama"];

// Paging
const showPageMenu = ref(false);
const itemsPerPage = ref(10);
const pageOptions = [10, 25, 50, 100];
const currentPage = ref(1);

// --- LOGIC ---
const selectDateFilter = (opt) => {
  activeDateLabel.value = opt;
  showDateMenu.value = false;
};

const selectSortOption = (opt) => {
  activeSortLabel.value = opt;
  showSortMenu.value = false;
  if (opt === 'Terbaru') {
    emails.value.sort((a, b) => b.id - a.id);
  } else {
    emails.value.sort((a, b) => a.id - b.id);
  }
};

const selectPageSize = (size) => {
  itemsPerPage.value = size;
  currentPage.value = 1;
  showPageMenu.value = false;
};

// Filter Dropdown
const showFilterMenu = ref(false);
const activeFilterType = ref("Semua");
const filterMenuOptions = [
  { label: "Semua", value: "Semua" },
  { label: "Favorite", value: "Favorite" },
  { label: "Sudah Tinjut", value: "Sudah Tinjut" },
  { label: "Belum Tinjut", value: "Belum Tinjut" },
  { label: "Lock", value: "Lock" },
  { label: "Note", value: "Note" },
  { label: "Arsip", value: "Arsip" },
  { label: "Sudah Dibaca", value: "Sudah Dibaca" },
  { label: "Belum Dibaca", value: "Belum Dibaca" },
];

const dateOptions = ["7 Hari", "30 Hari", "60 Hari", "1 Tahun"];
const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DISPOSISI", icon: Send },
  { label: "Surat Dinas Internal", value: "INTERNAL", icon: Building },
  { label: "Surat Dinas Eksternal", value: "EXTERNAL", icon: Building2 },
  { label: "Konsep", value: "KONSEP", icon: FilePen },
];

// --- DATA DUMMY SESUAI GAMBAR ---
const generateDummy = () => {
  return [
    {
      id: 1,
      from: "Kepada Divisi Keuangan", // Kolom Penerima
      email: "finance@company.com",
      subject: "Laporan Keuangan Triwulan IV", // Kolom Isi Pesan
      body: "Berikut terlampir laporan keuangan untuk periode triwulan IV tahun 2025. Mohon ditinjau.",
      category: "ND", // Nota Dinas
      date: "2025-11-20 14:30",
      fullDate: "2025-11-20 14:30",
      initial: "KD",
      color: "bg-blue-100 text-blue-600",
      isRead: true,
      viewCount: 2, // Kolom Aksi
      isFlagged: false, isStarred: false, isLocked: false, hasNote: false, isArchived: false, canOpenTab: false,
      recipient: "Kepala Divisi Keuangan", disposition: "-", note: "-"
    },
    {
      id: 2,
      from: "Tim Operasional", // Kolom Penerima
      email: "ops@company.com",
      subject: "Pemberitahuan Perubahan Jadwal", // Kolom Isi Pesan
      body: "Diberitahukan adanya perubahan jadwal operasional efektif minggu depan.",
      category: "DISPOSISI", // Disposisi
      date: "2025-11-19 10:15",
      fullDate: "2025-11-19 10:15",
      initial: "TO",
      color: "bg-purple-100 text-purple-600",
      isRead: false,
      viewCount: 3, // Kolom Aksi
      isFlagged: true, isStarred: true, isLocked: false, hasNote: false, isArchived: false, canOpenTab: true,
      recipient: "Tim Operasional", disposition: "Tindak Lanjuti", note: "Penting"
    },
    {
      id: 3,
      from: "Direktur Operasional", // Kolom Penerima
      email: "dirops@company.com",
      subject: "Proposal Pengembangan Sistem", // Kolom Isi Pesan
      body: "Mengajukan proposal pengembangan sistem manajemen aset terintegrasi.",
      category: "INTERNAL", // Surat Dinas Internal
      date: "2025-11-18 16:00",
      fullDate: "2025-11-18 16:00",
      initial: "DO",
      color: "bg-indigo-100 text-indigo-600",
      isRead: true,
      viewCount: 0, // Kolom Aksi
      isFlagged: false, isStarred: false, isLocked: true, hasNote: true, isArchived: false, canOpenTab: false,
      recipient: "Direktur Operasional", disposition: "-", note: "Review Budget"
    },
    {
      id: 4,
      from: "PT. Teknologi Maju", // Kolom Penerima
      email: "contact@tekno.com",
      subject: "Konfirmasi Kerjasama Proyek", // Kolom Isi Pesan
      body: "Kami mengkonfirmasi kesediaan untuk bekerjasama dalam proyek infrastruktur.",
      category: "EXTERNAL", // Surat Dinas Eksternal
      date: "2025-11-17 09:45",
      fullDate: "2025-11-17 09:45",
      initial: "PT",
      color: "bg-teal-100 text-teal-600",
      isRead: true,
      viewCount: 1, // Kolom Aksi
      isFlagged: false, isStarred: false, isLocked: false, hasNote: false, isArchived: false, canOpenTab: false,
      recipient: "PT. Teknologi Maju", disposition: "-", note: "-"
    },
    {
      id: 5,
      from: "Seluruh Staff", // Kolom Penerima
      email: "all@company.com",
      subject: "Pengumuman Kebijakan Baru", // Kolom Isi Pesan
      body: "Terlampir SK Direksi mengenai kebijakan jam kerja fleksibel.",
      category: "ND", // Nota Dinas
      date: "2025-11-16 13:20",
      fullDate: "2025-11-16 13:20",
      initial: "SS",
      color: "bg-blue-100 text-blue-600",
      isRead: true,
      viewCount: 4, // Kolom Aksi
      isFlagged: true, isStarred: false, isLocked: false, hasNote: true, isArchived: false, canOpenTab: true,
      recipient: "Seluruh Staff", disposition: "-", note: "Wajib dibaca"
    },
  ];
}

const emails = ref(generateDummy());

const filteredEmails = computed(() => {
  let result = emails.value;
  if (activeTab.value !== "ALL") result = result.filter(mail => mail.category === activeTab.value);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(mail => mail.subject.toLowerCase().includes(q) || mail.from.toLowerCase().includes(q));
  }
  switch (activeFilterType.value) {
    case "Favorite": result = result.filter(mail => mail.isStarred); break;
    case "Sudah Dibaca": result = result.filter(mail => mail.isRead); break;
    case "Belum Dibaca": result = result.filter(mail => !mail.isRead); break;
    case "Sudah Tinjut": result = result.filter(mail => mail.disposition && mail.disposition !== "-"); break;
    case "Belum Tinjut": result = result.filter(mail => !mail.disposition || mail.disposition === "-"); break;
    case "Note": result = result.filter(mail => mail.note && mail.note !== "-"); break;
    case "Lock": result = result.filter(mail => mail.isLocked); break;
  }
  return result;
});

watch([activeTab, searchQuery, activeFilterType], () => { currentPage.value = 1; });

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
const applyFilter = (filterName) => { activeFilterType.value = filterName; showFilterMenu.value = false; };
const toggleSelection = (id) => { if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id); };
const toggleSelectAll = () => { if (selectedIds.value.size === paginatedEmails.value.length) selectedIds.value.clear(); else paginatedEmails.value.forEach(mail => selectedIds.value.add(mail.id)); };
const isAllSelected = computed(() => paginatedEmails.value.length > 0 && selectedIds.value.size === paginatedEmails.value.length);
const selectMail = (mail) => { selected.value = mail; if (!mail.isRead) mail.isRead = true; };
const closeDetail = () => { selected.value = null; };

const getCategoryStyle = (cat) => {
  switch (cat) {
    case 'ND': return 'bg-blue-100 text-blue-700';
    case 'DISPOSISI': return 'bg-purple-100 text-purple-700';
    case 'INTERNAL': return 'bg-indigo-100 text-indigo-700';
    case 'EXTERNAL': return 'bg-sky-100 text-sky-700';
    case 'KONSEP': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-50 text-gray-600';
  }
};
// Update Label agar sesuai gambar
const getCategoryLabel = (cat) => {
    if (cat === 'INTERNAL') return 'Surat Dinas Internal';
    if (cat === 'EXTERNAL') return 'Surat Dinas Eksternal';
    if (cat === 'ND') return 'Nota Dinas';
    if (cat === 'DISPOSISI') return 'Disposisi';
    return cat;
}
</script>

<template>
  <div class="w-full h-screen flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-lg"
    :class="['glass-blue']">

    <div
      class="h-14 border-b border-transparent flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white">

      <div class="flex items-center gap-1 shrink-0 relative">
        <div class="p-1.5 rounded hover:bg-gray-100 cursor-pointer transition-colors group" @click="toggleSelectAll">
          <div
            class="w-3.5 h-3.5 border-[1.5px] border-gray-400 rounded-sm flex items-center justify-center transition-colors"
            :class="{ 'bg-primary border-primary': isAllSelected, 'group-hover:border-gray-600': !isAllSelected }">
            <Check v-if="isAllSelected" class="w-3 h-3 text-white" stroke-width="3" />
          </div>
        </div>
        <div class="relative">
          <button @click="showFilterMenu = !showFilterMenu"
            class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
            :class="{ 'bg-gray-100 text-neutral-900': showFilterMenu }" title="Opsi Filter">
            <MoreVertical class="w-4 h-4" />
          </button>
          <div v-if="showFilterMenu" @click="showFilterMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showFilterMenu"
            class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in filterMenuOptions" :key="opt.value" @click="applyFilter(opt.value)"
              class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 hover:bg-gray-50 flex items-center justify-between group transition-colors">
              <span :class="activeFilterType === opt.value ? 'font-semibold text-primary' : ''">{{ opt.label }}</span>
              <Check v-if="activeFilterType === opt.value" class="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
        </div>
        <button class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
          title="Muat Ulang">
          <RotateCcw class="w-4 h-4" />
        </button>
        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 mx-1 hidden md:block"></div>
          <div class="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
            <button class="p-1.5 text-neutral-500 hover:bg-red-50 hover:text-error rounded">
              <Trash2 class="w-4 h-4" />
            </button>
            <button class="p-1.5 text-neutral-500 hover:bg-blue-50 hover:text-primary rounded hidden sm:block">
              <Archive class="w-4 h-4" />
            </button>
          </div>
        </template>
      </div>

      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">
        <div class="relative hidden md:block group mr-1">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary" />
          <input v-model="searchQuery" type="text" placeholder="Cari pesan..."
            class="pl-8 pr-3 py-1.5 text-caption1 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-primary transition-all w-32 lg:w-48 placeholder:text-neutral-400">
        </div>
        <div class="relative">
          <button @click="showDateMenu = !showDateMenu"
            class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
            title="Periode Data">
            <History class="w-4 h-4" />
          </button>
          <div v-if="showDateMenu" @click="showDateMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showDateMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in dateOptions" :key="opt" @click="selectDateFilter(opt)"
              class="w-full text-left px-3 py-2 text-[13px] text-neutral-700 hover:bg-gray-50 flex items-center justify-between">
              <span>{{ opt }}</span>
              <Check v-if="activeDateLabel === opt" class="w-3 h-3 text-primary" />
            </button>
          </div>
        </div>
        <div class="relative">
          <button @click="showSortMenu = !showSortMenu"
            class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
            title="Urutkan">
            <ArrowUpDown class="w-4 h-4" />
          </button>
          <div v-if="showSortMenu" @click="showSortMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showSortMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in sortOptions" :key="opt" @click="selectSortOption(opt)"
              class="w-full text-left px-3 py-2 text-[13px] text-neutral-700 hover:bg-gray-50 flex items-center justify-between">
              <span>{{ opt }}</span>
              <Check v-if="activeSortLabel === opt" class="w-3 h-3 text-primary" />
            </button>
          </div>
        </div>

        <button class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors">
           <Download class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>
        <div class="flex items-center gap-1">
          <div class="relative">
            <button @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
              title="Jumlah per halaman">
              <Layers class="w-4 h-4" />
            </button>
            <div v-if="showPageMenu" @click="showPageMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
            <div v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-20 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <button v-for="size in pageOptions" :key="size" @click="selectPageSize(size)"
                class="w-full text-center px-3 py-2 text-[13px] text-neutral-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                <span :class="itemsPerPage === size ? 'font-bold text-primary' : ''">{{ size }}</span>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-1 text-caption1 text-neutral-600 shrink-0 h-[34px]">
            <span class="mx-1 font-medium hidden sm:inline whitespace-nowrap text-[12px] text-neutral-500">{{
              paginationInfo }}</span>
            <button
              class="p-1.5 hover:bg-gray-100 rounded text-neutral-500 disabled:opacity-30 disabled:hover:bg-transparent"
              @click="prevPage" :disabled="currentPage === 1">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 hover:bg-gray-100 rounded text-neutral-500 disabled:opacity-30 disabled:hover:bg-transparent"
              @click="nextPage" :disabled="currentPage === totalPages">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden relative w-full">

      <div
        class="flex flex-col bg-white transition-all duration-300 border-r border-gray-200 overflow-y-auto overflow-x-hidden"
        :class="selected ? 'hidden lg:flex lg:w-5/12 xl:w-[450px] shrink-0' : 'flex-1 w-full'">

        <div class="py-2.5 border-b border-gray-200 bg-white shrink-0 sticky top-0 z-10 w-full overflow-hidden">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full">
            <UButton v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" color="primary" class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0
              active:bg-primary-100 active:text-primary-500" :class="activeTab === tab.value
                ? 'bg-primary-400 text-white border-primary-400'
                : 'bg-white text-primary-500 border-neutral-200/50 hover:bg-primary-50'">
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </UButton>
          </div>
        </div>

        <div class="flex-1 pb-10 w-full">
          <div v-for="mail in paginatedEmails" :key="mail.id" @click="selectMail(mail)"
            class="group flex gap-3 items-center px-4 py-3 border-b border-gray-100 hover:shadow-sm cursor-pointer transition-colors relative w-full"
            :class="selected?.id === mail.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'">

            <div class="flex items-center shrink-0" @click.stop>
              <div
                class="w-3.5 h-3.5 border-[1.5px] border-gray-400 rounded-sm flex items-center justify-center transition-colors"
                :class="selectedIds.has(mail.id) ? 'bg-primary border-primary' : 'bg-white'"
                @click="toggleSelection(mail.id)">
                <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
              </div>
            </div>

            <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4 overflow-hidden">

              <div class="flex items-center sm:w-44 lg:w-52 shrink-0">
                  <div class="text-[13px] font-semibold text-gray-900 truncate">
                    {{ mail.from }}
                  </div>
              </div>

              <div class="text-[13px] text-gray-900 truncate flex-1">
                {{ mail.subject }}
              </div>

              <div class="hidden xl:flex shrink-0 w-32 justify-start">
                 <span class="px-2 py-0.5 rounded text-[11px] font-medium" :class="getCategoryStyle(mail.category)">
                    {{ getCategoryLabel(mail.category) }}
                 </span>
              </div>

            </div>

            <div class="pl-2 shrink-0 text-right w-24">
              <span class="text-caption2b text-neutral-500 text-[12px] whitespace-nowrap">
                {{ mail.date }}
              </span>
            </div>

            <div class="pl-2 shrink-0 text-right w-8 flex items-center justify-end gap-1 text-neutral-500">
               <Eye class="w-3.5 h-3.5 text-primary" />
               <span class="text-[12px] font-medium text-primary">{{ mail.viewCount }}</span>
            </div>

            <div class="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white/95 backdrop-blur-sm pl-2 py-1 shadow-sm rounded-l-md border border-gray-100 z-10">
              <button class="p-1.5 text-neutral-500 hover:text-primary hover:bg-blue-50 rounded transition-colors" title="Arsip">
                <Archive class="w-4 h-4" />
              </button>
              <button class="p-1.5 text-neutral-500 hover:text-error hover:bg-red-50 rounded transition-colors" title="Hapus">
                <Trash2 class="w-4 h-4" />
              </button>
              <!-- <button class="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-gray-100 rounded transition-colors" title="Tandai">
                <Mail class="w-4 h-4" />
              </button> -->
            </div>

          </div>
        </div>
      </div>

      <div v-if="selected"
        class="flex flex-col bg-white absolute inset-0 z-40 lg:static lg:flex-1 lg:z-0 animate-in slide-in-from-right-8 duration-200 overflow-hidden border-l border-gray-200">
        <div class="flex items-start justify-between px-6 py-5 shrink-0">
          <h2 class="text-xl text-gray-800 leading-tight pr-4 font-normal">
            {{ selected.subject }}
          </h2>
          <button class="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors" @click="closeDetail">
             <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 pb-6">
           <div class="flex gap-3 mb-3 items-center">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium text-white shrink-0"
                :class="selected.color">
                {{ selected.initial }}
              </div>
              <div class="leading-tight">
                 <div class="font-bold text-gray-900 text-[14px]">
                    {{ selected.from }}
                    <span class="text-gray-500 font-normal text-[13px]">&lt;{{ selected.email }}&gt;</span>
                 </div>
                 <div class="text-[13px] text-gray-500 mt-0.5">kepada saya</div>
              </div>
           </div>
           <div class="mb-5 ml-[52px]">
              <span class="bg-blue-100 text-blue-600 px-3 py-1 rounded text-[13px] font-medium inline-block">
                 {{ getCategoryLabel(selected.category) }}
              </span>
           </div>
           <hr class="border-gray-100 mb-6">
           <div class="space-y-4 mb-8">
              <div>
                 <div class="text-[13px] text-gray-500 mb-0.5">Kepada</div>
                 <div class="text-[15px] text-gray-900">{{ selected.recipient || '-' }}</div>
              </div>
              <div>
                 <div class="text-[13px] text-gray-500 mb-0.5">Disposisi</div>
                 <div class="text-[15px] text-gray-900">{{ selected.disposition || '-' }}</div>
              </div>
              <div>
                 <div class="text-[13px] text-gray-500 mb-0.5">Catatan</div>
                 <div class="text-[15px] text-gray-900">{{ selected.note || '-' }}</div>
              </div>
           </div>
           <div class="text-gray-800 leading-relaxed text-[15px] whitespace-pre-wrap">
              {{ selected.body }}
           </div>
        </div>

        <div class="p-6 pt-0 mt-auto bg-white shrink-0">
          <NuxtLink :to="`/user/kotak-masuk/${selected.id}`"
            class="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-sm transition-colors text-[14px]">
            Lihat Detail Lengkap
          </NuxtLink>
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
