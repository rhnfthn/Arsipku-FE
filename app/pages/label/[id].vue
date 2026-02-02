<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import {
  Inbox, FileText, Send, Building, Building2, FilePen,
  Check, X, RotateCw, MoreVertical, History, Layers, Download,
  Archive, Trash2, ChevronLeft, ChevronRight, Eye, Loader2, BookOpen,
  ArrowUpDown, Calendar as CalendarIcon, AlertTriangle, Tag, ChevronDown
} from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';
import { useLabel } from '~/composables/useLabel';
import * as XLSX from 'xlsx';

// --- TYPE DEFINITIONS ---
interface UIMailItem {
  id: string;
  from: string;
  fullRecipients: string;
  position: string;
  subject: string;
  number: string;
  category: string;
  categoryLabel: string;
  date: string;
  time: string;
  fullDate: string;
  initial: string;
  color: string;
  viewCount: number;
  isRead: boolean;
  labels: string[];
  recipient: string;
  sourceType: string;
  originalData: any;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { user } = useAuth();
const { fetchNaskahByLabel, naskahByLabel, removeNaskahFromLabel } = useLabel();

// --- STATE UTAMA ---
const labelId = computed(() => route.params.id as string);
const labelName = ref("Label View");
const isLoading = ref(false);
const emails = ref<UIMailItem[]>([]);

// --- STATE UI & FILTER ---
const breadcrumbs = computed(() => [
  { label: "Beranda", to: "/beranda" },
  { label: "Label", to: "#" },
  { label: labelName.value, to: "#" },
]);

const activeTab = ref("ALL");
const searchQuery = ref("");
const selectedIds = ref(new Set<string>());

// Date Filter State
const showDateMenu = ref(false);
const activeDateLabel = ref("Semua");
const dateOptions = ["Hari ini", "7 Hari Terakhir", "30 Hari Terakhir", "Bulan Ini", "Tahun Ini", "Semua"];
const isCustomDate = ref(false);
const startDate = ref();
const endDate = ref();

// Sort & Filter Menu State
const showSortMenu = ref(false);
const activeSortLabel = ref("Terbaru");
const sortOptions = ["Terbaru", "Terlama"];
const showFilterMenu = ref(false);
const activeFilterType = ref("Semua");

// Source Filter State (FIXED: Added missing ref)
const showSourceMenu = ref(false);
const activeSourceLabel = ref("Semua");
const activeSourceValue = ref("ALL");
const sourceOptions = [
  { label: "Semua", value: "ALL", icon: Tag },
  { label: "Inbox", value: "inbox", icon: Inbox },
  { label: "Draft", value: "draft", icon: FileText },
  { label: "Sent", value: "sent", icon: Send },
];

// Pagination State
const showPageMenu = ref(false);
const itemsPerPage = ref(10);
const pageOptions = [10, 25, 50, 100];
const currentPage = ref(1);

// Modal States
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const showReaderModal = ref(false);
const currentReaderData = ref({ subject: '', readList: [] as any[], unreadList: [] as any[] });

// --- LOGIC LOAD DATA ---
const loadData = async () => {
  if (!labelId.value) return;
  isLoading.value = true;
  selectedIds.value.clear();
  try {
    await fetchNaskahByLabel(labelId.value);
    const data = naskahByLabel.value;
    if (data) {
      labelName.value = data.namaLabel || "Label";
      if (data.items && Array.isArray(data.items)) {
        emails.value = data.items.map(mapJsonToUI);
      } else {
        emails.value = [];
      }
    }
  } catch (e: any) {
    console.error("ERROR LOAD DATA:", e);
    toast.add({ title: 'Error', description: 'Gagal memuat data label', color: 'error' });
  } finally {
    isLoading.value = false;
  }
};

// --- MAPPING FUNCTION ---
// --- MAPPING FUNCTION ---
const mapJsonToUI = (item: any): UIMailItem => {
  const senderName = item.pengirim?.nama || "Tanpa Nama";
  const senderPos = item.pengirim?.position_text || item.pengirim?.organization_text || "";

  // Logic untuk Recipient Display (Singkat) dan Full Recipients (Detail)
  let recipientDisplay = "-";
  let fullRecipientList = "Tanpa Penerima";

  const listPenerima = item.penerima || item.kepada || [];

  if (Array.isArray(listPenerima) && listPenerima.length > 0) {
    const isSDE = ['SDE', 'EXTERNAL', 'EKSTERNAL'].includes((item.jenis || '').toUpperCase());

    // 1. Ambil Nama/Jabatan Penerima Pertama
    const first = listPenerima[0];
    const primaryName = isSDE ? first.nama : (first.position_text || first.nama);

    // 2. Set Display Singkat (untuk baris tabel)
    recipientDisplay = listPenerima.length > 1
      ? `${primaryName} & ${listPenerima.length - 1} lainnya`
      : primaryName;

    // 3. Set Daftar Lengkap (untuk tooltip/detail)
    fullRecipientList = listPenerima
      .map((p: any, index: number) => {
        const pName = isSDE ? p.nama : (p.position_text || p.nama);
        return `${index + 1}. ${pName}`;
      })
      .join("\n");
  }

  const isRead = item.summary_baca?.belum_terbaca === 0;

  return {
    id: item.id_naskah,
    from: senderName,
    position: senderPos,
    subject: item.perihal || "(Tanpa Perihal)",
    number: item.nomor || "-",
    category: item.jenis || "UM",
    categoryLabel: item.jenis_label || item.jenis,
    date: formatDate(item.created_at || item.tanggal),
    time: formatTime(item.created_at || item.tanggal),
    fullDate: item.created_at || item.tanggal,
    initial: getInitials(senderName),
    color: getCategoryStyle(item.jenis),
    viewCount: item.summary_baca?.terbaca || 0,
    isRead: isRead,
    labels: item.labels || [],
    recipient: recipientDisplay,
    fullRecipients: fullRecipientList, // <-- Tambahkan ini
    sourceType: item.source || 'inbox',
    originalData: item
  };
};

// --- HELPER FUNCTIONS ---
const getSourceIcon = (sourceType) => {
  const type = sourceType?.toLowerCase()
  switch (type) {
    case 'inbox':
    case 'masuk':
      return 'i-heroicons-inbox-arrow-down'
    case 'sent':
    case 'terkirim':
      return 'i-heroicons-paper-airplane'
    case 'draft':
    case 'konsep':
      return 'i-heroicons-document-text'
    case 'archive':
    case 'arsip':
      return 'i-heroicons-archive-box'
    default:
      return 'i-heroicons-envelope'
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatTime = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS'].includes(c)) return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300';
  if (['SDI', 'INTERNAL'].includes(c)) return 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300';
  if (['SDE', 'EKSTERNAL'].includes(c)) return 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300';
  if (['KA', 'KAJIAN'].includes(c)) return 'bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300';
  return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
};

const getCategoryLabelShort = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['KA', 'KAJIAN'].includes(c)) return 'KA';
  if (['SDI', 'INTERNAL'].includes(c)) return 'SDI';
  if (['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(c)) return 'SDE';
  if (['ND', 'NOTA DINAS'].includes(c)) return 'ND';
  if (['DI', 'DISPOSISI'].includes(c)) return 'DI';
  return 'UM';
};

const getSourceStyle = (source: string) => {
  const s = (source || '').toLowerCase();
  if (s === 'inbox') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200';
  if (s === 'draft') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200';
  if (s === 'sent') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
};

// const getSourceIcon = (source: string) => {
//   const s = (source || '').toLowerCase();
//   if (s === 'inbox') return Inbox;
//   if (s === 'draft') return FilePen;
//   if (s === 'sent') return Send;
//   return FileText;
// };

// --- FILTER & UI LOGIC ---
const selectSourceFilter = (opt: any) => {
  activeSourceLabel.value = opt.label;
  activeSourceValue.value = opt.value;
  showSourceMenu.value = false;
  currentPage.value = 1;
};

const getActiveSourceIcon = computed(() => {
  const found = sourceOptions.find(o => o.value === activeSourceValue.value);
  return found ? found.icon : Tag;
});

const filteredEmails = computed(() => {
  let result = emails.value;

  // 1. Filter Tab (Category)
  if (activeTab.value !== "ALL") {
    const tab = activeTab.value;
    let targetCats = [tab];
    if (tab === 'SDI') targetCats = ['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'];
    else if (tab === 'KA') targetCats = ['KA', 'KAJIAN'];
    else if (tab === 'SDE') targetCats = ['SDE', 'EXTERNAL', 'EKSTERNAL'];
    else if (tab === 'DI') targetCats = ['DI', 'DISPOSISI'];
    else if (tab === 'ND') targetCats = ['ND', 'NOTA DINAS'];
    result = result.filter(mail => targetCats.includes((mail.category || '').toUpperCase()));
  }

  // 2. Filter Source (Fixed Logic)
  if (activeSourceValue.value !== "ALL") {
    result = result.filter(mail =>
      mail.sourceType?.toLowerCase() === activeSourceValue.value.toLowerCase()
    );
  }

  // 3. Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(mail =>
      mail.subject.toLowerCase().includes(q) ||
      mail.from.toLowerCase().includes(q) ||
      mail.number.toLowerCase().includes(q)
    );
  }

  // 4. Filter Menu (Read Status)
  switch (activeFilterType.value) {
    case "Sudah Dibaca": result = result.filter(mail => mail.isRead || mail.viewCount > 0); break;
    case "Belum Dibaca": result = result.filter(mail => !mail.isRead && mail.viewCount === 0); break;
  }

  // 5. Date Filter
  if (activeDateLabel.value === "Custom" && startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate.value);
    end.setHours(23, 59, 59, 999);
    result = result.filter(mail => {
      const d = new Date(mail.fullDate);
      return d >= start && d <= end;
    });
  } else if (activeDateLabel.value !== "Semua" && activeDateLabel.value !== "Custom") {
    const now = new Date();
    let start = new Date();
    start.setHours(0, 0, 0, 0);
    if (activeDateLabel.value === "Hari ini") { }
    else if (activeDateLabel.value === "7 Hari Terakhir") start.setDate(now.getDate() - 7);
    else if (activeDateLabel.value === "30 Hari Terakhir") start.setDate(now.getDate() - 30);
    else if (activeDateLabel.value === "Bulan Ini") start.setDate(1);
    else if (activeDateLabel.value === "Tahun Ini") { start.setMonth(0); start.setDate(1); }
    result = result.filter(mail => new Date(mail.fullDate) >= start);
  }

  // 6. Sorting
  if (activeSortLabel.value === 'Terbaru') {
    result.sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime());
  } else {
    result.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }
  return result;
});

// Pagination Logic
watch([activeTab, searchQuery, activeFilterType, activeDateLabel, activeSourceValue], () => { currentPage.value = 1; });
const totalItems = computed(() => filteredEmails.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value) || 1);
const paginatedEmails = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredEmails.value.slice(start, start + itemsPerPage.value);
});
const paginationInfo = computed(() => {
  if (totalItems.value === 0) return "0-0 Dari 0";
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(start + itemsPerPage.value - 1, totalItems.value);
  return `${start}-${end} Dari ${totalItems.value}`;
});

// --- UI EVENT HANDLERS ---
const refreshData = () => { loadData(); };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const toggleSelection = (id: string) => { if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id); };
const toggleSelectAll = () => {
  if (selectedIds.value.size === paginatedEmails.value.length) selectedIds.value.clear();
  else paginatedEmails.value.forEach(m => selectedIds.value.add(m.id));
};
const isAllSelected = computed(() => paginatedEmails.value.length > 0 && selectedIds.value.size === paginatedEmails.value.length);
const selectSortOption = (opt: string) => { activeSortLabel.value = opt; showSortMenu.value = false; };
const selectPageSize = (size: number) => { itemsPerPage.value = size; currentPage.value = 1; showPageMenu.value = false; };
const applyFilter = (filterName: string) => { activeFilterType.value = filterName; showFilterMenu.value = false; };
const selectDateFilter = (opt: string) => { isCustomDate.value = false; activeDateLabel.value = opt; showDateMenu.value = false; };
const applyCustomDate = () => { if (startDate.value && endDate.value) { isCustomDate.value = true; activeDateLabel.value = "Custom"; showDateMenu.value = false; } };

const navigateToDetail = (mail: UIMailItem) => {
  const source = (mail.sourceType || '').toLowerCase();

  if (source === 'draft' || source === 'konsep') {
    // Jika draft, gunakan fungsi handleEdit yang sudah Anda buat
    handleEdit(mail);
  } else if (source === 'sent' || source === 'terkirim') {
    // Jika sent, arahkan ke folder terkirim
    router.push({ path: `/korespondensi/terkirim/${mail.id}`, query: { jenis: mail.category } });
  } else {
    // Default (inbox/masuk), arahkan ke kotak-masuk
    router.push({ path: `/korespondensi/kotak-masuk/${mail.id}`, query: { jenis: mail.category } });
  }
};

const handleEdit = (mail: UIMailItem) => {
  const jenis = (mail.category || '').trim().toUpperCase();
  const routes: Record<string, string> = {
    'ND': '/korespondensi/tulis/nota-dinas',
    'NOTA DINAS': '/korespondensi/tulis/nota-dinas',
    'DI': '/korespondensi/tulis/disposisi',
    'DISPOSISI': '/korespondensi/tulis/disposisi',
    'SDI': '/korespondensi/tulis/surat-dinas-internal',
    'INTERNAL': '/korespondensi/tulis/surat-dinas-internal',
    'SDE': '/korespondensi/tulis/surat-dinas-eksternal',
    'EXTERNAL': '/korespondensi/tulis/surat-dinas-eksternal',
    'KA': '/korespondensi/tulis/kajian',
    'KAJIAN': '/korespondensi/tulis/kajian'
  };

  const path = routes[jenis] || '/korespondensi/tulis/nota-dinas';
  router.push({ path, query: { draft_id: mail.id, mode: 'edit' } });
};

const confirmBulkDelete = () => { if (selectedIds.value.size === 0) return; showDeleteModal.value = true; }

const handleBulkDeleteExecute = async () => {
  isDeleting.value = true;
  try {
    // Ambil ID label dari route params
    const currentLabelId = labelId.value;

    // Jalankan penghapusan untuk semua naskah yang dipilih secara paralel
    const deletePromises = Array.from(selectedIds.value).map(id =>
      removeNaskahFromLabel(id, currentLabelId)
    );

    await Promise.all(deletePromises);

    toast.add({
      title: 'Berhasil',
      description: `${selectedIds.value.size} item berhasil dihapus dari label`,
      color: 'success'
    });

    // Reset state
    selectedIds.value.clear();
    showDeleteModal.value = false;

    // Refresh data agar list terupdate
    await loadData();

  } catch (e: any) {
    console.error("Gagal menghapus naskah dari label:", e);
    toast.add({
      title: 'Gagal',
      description: 'Terjadi kesalahan saat menghapus item',
      color: 'error'
    });
  } finally {
    isDeleting.value = false;
  }
};

const openReaderModal = (mail: UIMailItem) => {
  const item = mail.originalData;
  const penerima = item.penerima || [];
  const read = penerima.filter((p: any) => p.status_baca === 'terbaca').map((p: any) => ({
    name: p.nama,
    position: p.position_text || p.nama,
    date: p.read_time ? formatDate(p.read_time) : '-',
    initial: getInitials(p.nama),
    bg: 'bg-blue-500'
  }));
  const unread = penerima.filter((p: any) => p.status_baca !== 'terbaca').map((p: any) => ({
    name: p.nama,
    position: p.position_text || p.nama,
    status: 'Belum membaca',
    initial: getInitials(p.nama),
    bg: 'bg-gray-400'
  }));
  currentReaderData.value = { subject: mail.subject, readList: read, unreadList: unread };
  showReaderModal.value = true;
};

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Kajian", value: "KA", icon: BookOpen },
];

watch([() => user.value, labelId], ([newUser, newLabelId]) => {
  if (newUser && newLabelId) loadData();
}, { immediate: true });
</script>

<template>
  <PageHeader :title="labelName" :items="breadcrumbs" />

  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue">
    <div
      class="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors">

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
          title="Muat Ulang">
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>

        <div class="relative">
          <button @click="showSourceMenu = !showSourceMenu"
            class="flex items-center p-1.5 text-neutral-500 hover:bg-gray-100 rounded relative">
            <component :is="getActiveSourceIcon" class="w-4 h-4 shrink-0" />
            <span v-if="activeSourceValue !== 'ALL'"
              class="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-1 ring-white"></span>
          </button>
          <div v-if="showSourceMenu" @click="showSourceMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showSourceMenu"
            class="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in sourceOptions" :key="opt.value" @click="selectSourceFilter(opt)"
              class="w-full text-left px-3 py-2 text-[13px] transition-colors flex items-center gap-3 group"
              :class="activeSourceLabel === opt.label ? 'bg-blue-50 dark:bg-blue-900/20 text-primary font-medium' : 'text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'">
              <component :is="opt.icon" class="w-4 h-4 opacity-70 group-hover:opacity-100" />
              <span>{{ opt.label }}</span>
              <Check v-if="activeSourceLabel === opt.label" class="w-3.5 h-3.5 ml-auto text-primary" />
            </button>
          </div>
        </div>

        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
          <div class="flex items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200">
            <button @click="confirmBulkDelete" class="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Hapus dari Label">
              <Trash2 class="w-4 h-4" />
            </button>
            <span class="text-xs text-neutral-500 ms-2">{{ selectedIds.size }} dipilih</span>
          </div>
        </template>
      </div>

      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">
        <div class="relative">
          <button @click="showDateMenu = !showDateMenu" title="Periode Data"
            class="flex items-center gap-1 p-1.5 text-neutral-500 hover:bg-gray-100 rounded relative">
            <History class="w-4 h-4 shrink-0" />
            <span v-if="activeDateLabel !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white"></span>
          </button>
          <div v-if="showDateMenu" @click="showDateMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showDateMenu"
            class="absolute top-full right-0 mt-1 w-[480px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex text-black">
            <div class="w-7/12 p-4 border-r border-gray-100 bg-gray-50/50">
              <div class="text-[13px] font-semibold mb-4 flex items-center justify-between">
                <span>Pilih Tanggal</span>
                <Check v-if="activeDateLabel === 'Custom'" class="w-3.5 h-3.5 text-primary" />
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase">Mulai</label>
                  <input type="date" v-model="startDate"
                    class="w-full text-sm border rounded p-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase">Sampai</label>
                  <input type="date" v-model="endDate"
                    class="w-full text-sm border rounded p-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                </div>
                <button @click="applyCustomDate"
                  class="w-full mt-2 bg-primary text-white text-[12px] font-medium py-2 rounded-md hover:bg-primary-600">Terapkan
                  Range</button>
              </div>
            </div>
            <div class="w-5/12 py-2 overflow-y-auto max-h-[300px] dark:bg-gray-800">
              <div class="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Preset</div>
              <button v-for="opt in dateOptions" :key="opt" @click="selectDateFilter(opt)"
                class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-primary flex items-center justify-between group">
                <span>{{ opt }}</span>
                <Check v-if="activeDateLabel === opt && !isCustomDate" class="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          </div>
        </div>

        <div class="relative">
          <button @click="showSortMenu = !showSortMenu"
            class="p-1.5 text-neutral-500 hover:bg-gray-100 rounded transition-colors flex items-center gap-1">
            <ArrowUpDown class="w-4 h-4" />
          </button>
          <div v-if="showSortMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button v-for="opt in sortOptions" :key="opt" @click="selectSortOption(opt)"
              class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 hover:bg-gray-50 hover:text-primary transition-colors"
              :class="{ 'text-primary font-semibold bg-gray-50': activeSortLabel === opt }">
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

        <div class="flex items-center gap-1">
          <div class="relative">
            <button @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 hover:bg-gray-100 rounded transition-colors flex items-center gap-1">
              <Layers class="w-4 h-4" />
            </button>
            <div v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-24 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button v-for="size in pageOptions" :key="size" @click="selectPageSize(size)"
                class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 hover:bg-gray-50 hover:text-primary transition-colors"
                :class="{ 'text-primary font-semibold bg-gray-50': itemsPerPage === size }">
                {{ size }} Item
              </button>
            </div>
          </div>
          <div class="flex items-center gap-1 text-neutral-600 dark:text-gray-400 shrink-0 h-[34px]">
            <span class="mx-1 font-medium hidden sm:inline text-[12px] whitespace-nowrap">{{ paginationInfo }}</span>
            <button class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30" @click="prevPage"
              :disabled="currentPage === 1">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30" @click="nextPage"
              :disabled="currentPage === totalPages">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden relative w-full">
      <div
        class="flex flex-col bg-white dark:bg-gray-900 transition-all duration-300 border-r border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden flex-1 w-full">
        <div
          class="py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 sticky top-0 z-10 w-full">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full px-2">
            <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
              :class="activeTab === tab.value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 hover:bg-gray-50'">
              <component :is="tab.icon" class="w-4 h-4" />{{ tab.label }}
            </button>
          </div>
        </div>

        <div class="flex-1 w-full relative">
          <div v-if="isLoading" class="flex flex-col w-full">
            <div v-for="i in 5" :key="i" class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 w-full">
              <div class="flex flex-col md:flex-row items-start gap-3 md:gap-4 w-full">
                <div class="shrink-0 flex items-center gap-3 pt-1 md:pt-0">
                  <USkeleton class="h-4 w-4" />
                  <USkeleton class="h-5 w-5 rounded-full" />
                </div>

                <div class="w-full md:w-[28%] shrink-0 space-y-2">
                  <USkeleton class="h-4 w-3/4" />
                  <USkeleton class="h-3 w-1/2" />
                </div>

                <div class="flex-1 space-y-2 w-full">
                  <USkeleton class="h-4 w-full" />
                  <div class="flex gap-2">
                    <USkeleton class="h-3 w-32" />
                    <USkeleton class="h-3 w-8" />
                  </div>
                </div>

                <div class="w-full md:w-auto shrink-0 flex md:flex-col items-center md:items-end justify-between gap-2">
                  <USkeleton class="h-6 w-16 rounded-full" />
                  <USkeleton class="h-3 w-20" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="paginatedEmails.length === 0"
            class="flex flex-col items-center justify-center h-64 text-gray-500">
            <Inbox class="w-10 h-10 mb-2 opacity-20" />
            <span class="text-sm">Tidak ada data ditemukan</span>
          </div>

          <div v-else v-for="mail in paginatedEmails" :key="mail.id" @click="navigateToDetail(mail)"
            class="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer border-b border-gray-100 dark:border-gray-800 relative w-full"
            :class="!mail.isRead ? 'bg-blue-50/10' : ''">

            <div class="flex flex-col md:flex-row items-start gap-3 md:gap-4 px-6 py-4">
              <div class="shrink-0 flex items-center gap-3 pt-1 md:pt-0">
                <div @click.stop class="flex items-center">
                  <div
                    class="w-4 h-4 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
                    :class="selectedIds.has(mail.id) ? 'bg-primary-500 border-primary-500' : 'bg-white dark:bg-gray-800'"
                    @click="toggleSelection(mail.id)">
                    <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" stroke-width="4" />
                  </div>
                </div>

                <UTooltip :text="mail.sourceType.toUpperCase()" :popper="{ placement: 'right' }">
                  <UIcon :name="getSourceIcon(mail.sourceType)"
                    class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors" />
                </UTooltip>
              </div>

              <div class="w-full md:w-[28%] shrink-0 min-w-0">
                <div class="flex items-center gap-2">
                  <UTooltip :popper="{ placement: 'top' }" class="max-w-full">
                    <h4
                      class="font-bold text-gray-700 dark:text-gray-200 uppercase truncate text-sm md:text-[13px] tracking-wide group-hover:text-primary-600 transition-colors">
                      {{ mail.from }}
                    </h4>
                    <template #text>
                      <span class="font-medium">{{ mail.position }}</span>
                    </template>
                  </UTooltip>
                </div>

                <div class="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
                  <span class="text-xs opacity-70">Kepada:</span>
                  <UTooltip :text="mail.fullRecipients" :popper="{ placement: 'top' }" class="max-w-xs">
                    <span
                      class="truncate font-medium text-gray-500 hover:text-primary-600 transition-colors cursor-help">
                      {{ mail.recipient }}
                    </span>
                  </UTooltip>
                </div>

              </div>

              <div class="flex-1 min-w-0 w-full">
                <p class="text-sm leading-snug line-clamp-2 md:line-clamp-1 transition-colors font-medium"
                  :class="!mail.isRead ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'">
                  {{ mail.subject }}
                </p>
                <div class="flex items-center gap-2 mt-1.5">
                  <span
                    class="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 uppercase">
                    {{ mail.number }}
                  </span>

                  <UIcon v-if="mail.originalData.hasAttachment" name="i-heroicons-paper-clip"
                    class="w-3.5 h-3.5 text-gray-400" />

                  <template v-if="['inbox', 'masuk'].includes(mail.sourceType.toLowerCase())">
                    <div v-if="['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(mail.category.toUpperCase())"
                      class="flex items-center gap-1 ml-2 opacity-30 cursor-not-allowed"
                      title="Status pembaca tidak tersedia untuk surat eksternal">
                      <Eye class="w-3.5 h-3.5 text-gray-400" />
                      <span class="text-[11px] font-medium text-gray-400">-</span>
                    </div>

                    <div v-else
                      class="flex items-center gap-1 ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-help"
                      @click.stop="openReaderModal(mail)">
                      <Eye class="w-3.5 h-3.5" :class="mail.viewCount > 0 ? 'text-primary-500' : 'text-gray-400'" />
                      <span class="text-[11px] font-medium"
                        :class="mail.viewCount > 0 ? 'text-primary-500' : 'text-gray-400'">
                        {{ mail.viewCount }}
                      </span>
                    </div>
                  </template>
                </div>
              </div>

              <div
                class="w-full md:w-auto shrink-0 flex flex-row md:items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                <span
                  class="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border border-transparent min-w-[60px] text-center"
                  :class="mail.color">
                  {{ getCategoryLabelShort(mail.category) }}
                </span>

                <span class="text-xs whitespace-nowrap font-medium min-w-[90px] text-right"
                  :class="!mail.isRead ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-gray-500'">
                  {{ mail.date.split(',')[0] }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showReaderModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
        <div
          class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="flex items-start justify-between p-5 pb-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">Status Pembaca Pesan</h3>
              <p class="text-sm text-gray-500 mt-1 line-clamp-1">{{ currentReaderData.subject }}</p>
            </div>
            <button @click="showReaderModal = false" class="text-gray-400 hover:text-gray-600 p-1">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-5 pt-2 flex-1 overflow-y-auto max-h-[60vh]">
            <div v-if="currentReaderData.readList.length > 0" class="mb-4">
              <div class="flex items-center gap-2 mb-3 mt-2">
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
                <span class="text-[15px] font-medium text-gray-800 dark:text-gray-200">Sudah Membaca ({{
                  currentReaderData.readList.length }})</span>
              </div>
              <div class="space-y-2">
                <div v-for="(reader, idx) in currentReaderData.readList" :key="idx"
                  class="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                      {{ reader.initial }}</div>
                    <div>
                      <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ reader.position }}</div>
                      <div class="text-xs text-gray-500">{{ reader.name }}</div>
                      <div class="text-xs text-gray-400">Dibaca: {{ reader.date }}</div>
                    </div>
                  </div>
                  <div class="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                </div>
              </div>
            </div>
            <div v-if="currentReaderData.unreadList.length > 0">
              <div class="flex items-center gap-2 mb-3 mt-2">
                <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                <span class="text-[15px] font-medium text-gray-800 dark:text-gray-200">Belum Membaca ({{
                  currentReaderData.unreadList.length }})</span>
              </div>
              <div class="space-y-2">
                <div v-for="(reader, idx) in currentReaderData.unreadList" :key="idx"
                  class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-xs">
                      {{ reader.initial }}</div>
                    <div>
                      <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ reader.position }}</div>
                      <div class="text-xs text-gray-500">{{ reader.name }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4 border-t border-gray-100 dark:border-gray-800">
            <button @click="showReaderModal = false"
              class="w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Tutup</button>
          </div>
        </div>
      </div>

      <div v-if="showDeleteModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          class="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
          <div class="p-5 text-center text-black">
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle class="w-6 h-6 text-red-600" />
            </div>
            <h3 class="text-lg font-bold mb-2 dark:text-white">Hapus Item dari Label?</h3>
            <div class="text-sm text-gray-500 mb-6">Apakah Anda yakin ingin menghapus {{ selectedIds.size }} item
              terpilih
              dari label ini?</div>
            <div class="flex gap-3 justify-center">
              <button @click="showDeleteModal = false" :disabled="isDeleting"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button @click="handleBulkDeleteExecute" :disabled="isDeleting"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2">
                <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
                {{ isDeleting ? 'Memproses...' : 'Hapus' }}
              </button>
            </div>
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
