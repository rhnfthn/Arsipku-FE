<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import {
  Inbox, FileText, Send, Building, Building2, FilePen,
  Check, X, RotateCw, MoreVertical, History, Layers, Download,
  Archive, Trash2, ChevronLeft, ChevronRight, Eye, Loader2, BookOpen,
  ArrowUpDown, Calendar as CalendarIcon, AlertTriangle, Tag, Plus // Tambah Tag & Plus
} from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';
import { useSirkulasi } from '@/composables/useTerkirim';
import { useLabel } from '~/composables/useLabel'; // Import useLabel
import type { NaskahItem, UIMailItem } from '~/types/terkirim';
import * as XLSX from 'xlsx';
// Import CalendarDate untuk type safety (opsional, tergantung setup project)
import { CalendarDate } from '@internationalized/date';

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Terkirim", to: "#" },
];

// --- HELPER: GET INITIALS ---
const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

// --- COMPOSABLES ---
const { user } = useAuth();
const { fetchSentBox, isLoading, bulkActionSent } = useSirkulasi();
// Inisialisasi useLabel
const { labels, fetchLabels, createLabel, addNaskahToLabel } = useLabel();

const route = useRoute();
const toast = useToast();

// --- HELPER: ROUTING ---
const getDetailRoute = (item: UIMailItem) => {
  return {
    path: `/korespondensi/terkirim/${item.id}`,
    query: {
      jenis: item.category
    }
  };
};

// --- STATE ---
const selected = ref<UIMailItem | null>(null);
const selectedIds = ref(new Set<string>());

// State Filter & Toolbar
const activeTab = ref("ALL");
const searchQuery = ref("");

// Date Filter
const showDateMenu = ref(false);
// Default Filter 30 Hari Terakhir
const activeDateLabel = ref("30 Hari Terakhir");
const dateOptions = ["Hari ini", "7 Hari Terakhir", "30 Hari Terakhir", "Bulan Ini", "Tahun Ini", "Semua"];

// Custom Date Range State
const isCustomDate = ref(false);
// Inisialisasi dengan CalendarDate hari ini jika perlu, atau undefined
const startDate = ref();
const endDate = ref();

// State untuk Popover Kalender
const openStart = ref(false);
const openEnd = ref(false);

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
  { label: "Arsip", value: "Arsip" },
];

// Data Holder
const emails = ref<UIMailItem[]>([]);

// --- STATE BULK ACTION ---
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const currentBulkAction = ref<'archive' | 'delete'>('delete');

const firstSelectedItem = computed(() => {
  if (selectedIds.value.size === 0) return null;
  const firstId = [...selectedIds.value][0];
  return emails.value.find(e => e.id === firstId);
});

const modalTitle = computed(() => currentBulkAction.value === 'archive' ? 'Arsipkan Surat?' : 'Hapus Surat?');
const actionLabel = computed(() => currentBulkAction.value === 'archive' ? 'Arsipkan' : 'Hapus');

// --- MODAL READER STATE ---
const showReaderModal = ref(false);
const currentReaderData = ref({
  subject: '',
  readList: [] as any[],
  unreadList: [] as any[]
});

// --- STATE LABEL ASSIGNMENT ---
const showLabelAssignModal = ref(false);

// --- HELPER: COLOR MAPPING ---
const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();

  if (['ND', 'NOTA DINAS'].includes(c))
    return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300';

  if (['DI', 'DISPOSISI'].includes(c))
    return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300';

  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c))
    return 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300';

  if (['SDE', 'SURAT DINAS EKSTERNAL'].includes(c))
    return 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300';

  if (['KAJIAN', 'KA'].includes(c))
    return 'bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300';

  return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
};


// --- HELPER: LABEL MAPPING ---
const getCategoryLabel = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['KA'].includes(c)) return 'KA';
  if (['SDI', 'INTERNAL'].includes(c)) return 'SDI';
  if (['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(c)) return 'SDE';
  if (['ND', 'NOTA DINAS'].includes(c)) return 'ND';
  if (['DI', 'DISPOSISI'].includes(c)) return 'DI';
  return 'K';
};

// --- API FETCH & MAPPING ---
const loadData = async () => {
  const posId = user.value?.position;
  const rawData = await fetchSentBox(posId);

  emails.value = rawData.map((item: any) => {
    const daftarPenerima = item.penerima || [];
    let displayRecipient = "Tanpa Penerima";
    let firstRecipientTitle = "Tanpa Jabatan";

    if (daftarPenerima.length > 0) {
      const firstPerson = daftarPenerima[0];
      const title = firstPerson.position_text || firstPerson.nama;

      firstRecipientTitle = title;

      if (daftarPenerima.length > 1) {
        displayRecipient = `${title} +${daftarPenerima.length - 1} lainnya`;
      } else {
        displayRecipient = title;
      }
    }

    const dateObj = new Date(item.created_at || item.tanggal);
    const wibDate = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
    const dateStr =
      wibDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) +
      ', ' +
      wibDate.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

    return {
      id: item.id_naskah,
      from: displayRecipient,
      email: firstRecipientTitle,
      subject: item.perihal,
      body: item.nomor || '-',
      category: item.jenis,
      date: dateStr,
      fullDate: item.created_at || item.tanggal,
      initial: daftarPenerima[0]?.nama?.substring(0, 1).toUpperCase() || '?',
      color: getCategoryStyle(item.jenis).split(' ')[0] + ' text-white',
      viewCount: item.summary_baca?.terbaca || 0,
      isRead: true,
      isFlagged: ['rahasia', 'penting', 'segera'].includes(item.sifat?.toLowerCase()),
      isLocked: item.status === 'final_tte' || item.status === 'final',
      isArchived: item.arsip,
      recipient: daftarPenerima.map((p: any) => p.position_text || p.nama).join(', '),
      note: item.sifat,
      originalData: item
    };
  });
};

// --- FILTERING LOGIC ---
const filteredEmails = computed(() => {
  let result = emails.value;

  if (activeTab.value !== "ALL") {
    const tab = activeTab.value;
    let targetCats = [tab];
    if (tab === 'SDI') targetCats = ['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'];
    else if (tab === 'KA') targetCats = ['KA'];
    else if (tab === 'SDE') targetCats = ['SDE', 'EXTERNAL', 'EKSTERNAL', 'SURAT DINAS EKSTERNAL'];
    else if (tab === 'DI') targetCats = ['DI', 'DISPOSISI'];
    else if (tab === 'ND') targetCats = ['ND', 'NOTA DINAS'];
    else if (tab === 'KONSEP') targetCats = ['KONSEP'];
    result = result.filter(mail => targetCats.includes((mail.category || '').toUpperCase()));
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
    case "Arsip": result = result.filter(mail => mail.isArchived); break;
  }

  if (activeDateLabel.value === "Custom" && startDate.value && endDate.value) {
    // Handling CalendarDate objects from UCalendar
    const start = new Date(startDate.value.year, startDate.value.month - 1, startDate.value.day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate.value.year, endDate.value.month - 1, endDate.value.day);
    end.setHours(23, 59, 59, 999);

    result = result.filter(mail => {
      const d = new Date(mail.fullDate);
      return d >= start && d <= end;
    });
  } else if (activeDateLabel.value !== "Semua" && activeDateLabel.value !== "Custom") {
    const now = new Date();
    let start = new Date();
    start.setHours(0, 0, 0, 0);

    if (activeDateLabel.value === "Hari ini") { /* start is today */ }
    else if (activeDateLabel.value === "7 Hari Terakhir") start.setDate(now.getDate() - 7);
    else if (activeDateLabel.value === "30 Hari Terakhir") start.setDate(now.getDate() - 30);
    else if (activeDateLabel.value === "Bulan Ini") start.setDate(1);
    else if (activeDateLabel.value === "Tahun Ini") { start.setMonth(0); start.setDate(1); }

    result = result.filter(mail => new Date(mail.fullDate) >= start);
  }

  if (activeSortLabel.value === 'Terbaru') {
    result.sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime());
  } else {
    result.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }
  return result;
});

watch([activeTab, searchQuery, activeFilterType, activeDateLabel, startDate, endDate], () => { currentPage.value = 1; });

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
const selectDateFilter = (opt: string) => {
  isCustomDate.value = false;
  activeDateLabel.value = opt;
  showDateMenu.value = false;
};
const applyCustomDate = () => {
  if (startDate.value && endDate.value) {
    isCustomDate.value = true;
    activeDateLabel.value = "Custom";
    showDateMenu.value = false;
  }
};

const selectSortOption = (opt: string) => { activeSortLabel.value = opt; showSortMenu.value = false; };
const selectPageSize = (size: number) => { itemsPerPage.value = size; currentPage.value = 1; showPageMenu.value = false; };

const toggleSelection = (id: string) => { if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id); };
const toggleSelectAll = () => { if (selectedIds.value.size === paginatedEmails.value.length) selectedIds.value.clear(); else paginatedEmails.value.forEach(mail => selectedIds.value.add(mail.id)); };
const isAllSelected = computed(() => paginatedEmails.value.length > 0 && selectedIds.value.size === paginatedEmails.value.length);
const selectMail = (mail: UIMailItem) => { selected.value = mail; };
const closeDetail = () => { selected.value = null; };

// --- METHODS BULK ACTION ---
const confirmAction = (action: 'archive' | 'delete') => {
  if (selectedIds.value.size === 0) return;
  currentBulkAction.value = action;
  showDeleteModal.value = true;
};

const handleBulkExecute = async () => {
  if (!user.value?.position) return;

  isDeleting.value = true;
  try {
    const payload = {
      position_id: Number(user.value.position),
      naskah_ids: Array.from(selectedIds.value),
      action: currentBulkAction.value
    };

    await bulkActionSent(payload);

    toast.add({
      title: 'Berhasil',
      description: `${selectedIds.value.size} item berhasil di-${currentBulkAction.value === 'archive' ? 'arsipkan' : 'hapus'}.`,
      color: 'success'
    });

    // Reset state
    selectedIds.value.clear();
    showDeleteModal.value = false;

    // Refresh data
    await loadData();

  } catch (error: any) {
    console.error(error);
    toast.add({ title: 'Gagal', description: error.response?.data?.message || 'Terjadi kesalahan', color: 'error' });
  } finally {
    isDeleting.value = false;
  }
};

const openReaderModal = (mail: UIMailItem) => {
  const item = mail.originalData;
  const read = item.penerima.filter(p => p.status_baca === 'terbaca').map(p => ({
    name: p.nama,
    position: p.position_text,
    date: p.read_time ? new Date(p.read_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date(p.read_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-',
    initial: p.nama.substring(0, 1),
    bg: 'bg-blue-500'
  }));
  const unread = item.penerima.filter(p => p.status_baca !== 'terbaca').map(p => ({
    name: p.nama,
    position: p.position_text,
    status: 'Belum membaca',
    initial: p.nama.substring(0, 1),
    bg: 'bg-gray-400'
  }));
  currentReaderData.value = { subject: item.perihal, readList: read, unreadList: unread };
  showReaderModal.value = true;
};

const refreshData = () => { loadData(); selectedIds.value.clear(); };

const downloadExcel = async () => {
  if (filteredEmails.value.length === 0) {
    toast.add({ title: 'Info', description: 'Tidak ada data untuk diunduh', color: 'gray' });
    return;
  }

  const isConfirmed = await Alert.confirm(
    'Unduh Data?',
    'Apakah Anda yakin ingin mengunduh data laporan ini ke Excel?',
    'Ya, Unduh',
    'Batal',
    true
  );

  if (!isConfirmed) return;

  try {
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
        'Penerima (List)': item.penerima.map(p => `${p.nama} (${p.position_text})`).join('; '),
        'Total Penerima': item.summary_baca.total,
        'Sudah Dibaca': item.summary_baca.terbaca,
        'Belum Dibaca': item.summary_baca.belum_terbaca
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kotak Keluar");
    XLSX.writeFile(wb, `Laporan_Terkirim_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast.add({ title: 'Berhasil', description: 'File Excel berhasil diunduh.', color: 'success' });

  } catch (error) {
    console.error('Error Excel:', error);
    toast.add({ title: 'Gagal', description: 'Terjadi kesalahan saat mengunduh.', color: 'error' });
  } finally {
    Alert.close();
  }
};

// --- LABEL METHODS ---
const openLabelAssignModal = () => {
  showLabelAssignModal.value = true;
};

// Terapkan label ke item yang dipilih
const assignLabelToSelected = async (labelId: string, labelName: string) => {
  if (selectedIds.value.size === 0) return;
  isLabelProcessing.value = true;

  try {
    // Loop semua item terpilih dan tambahkan label (API addNaskahToLabel biasanya single item)
    // Kita gunakan Promise.all untuk paralel
    const promises = Array.from(selectedIds.value).map(naskahId =>
      addNaskahToLabel(naskahId, labelId)
    );

    await Promise.all(promises);

    toast.add({
      title: 'Berhasil',
      description: `Label "${labelName}" ditambahkan ke ${selectedIds.value.size} item.`,
      color: 'success'
    });

    showLabelAssignModal.value = false;
    selectedIds.value.clear(); // Opsional: clear selection setelah label
  } catch (error) {
    console.error("Gagal assign label:", error);
    toast.add({ title: 'Gagal', description: 'Gagal menambahkan label.', color: 'error' });
  } finally {
    isLabelProcessing.value = false;
  }
};

// Buat label baru lalu terapkan
const createNewAndAssign = async () => {
  const name = labelSearchQuery.value.trim();
  if (!name) return;
  isLabelProcessing.value = true;

  try {
    // 1. Create Label
    const payload: any = { nama: name };

    if (newLabelParentId.value) {
      // PERBAIKAN: Backend menolak 'parent_id', gunakan 'idParent'
      payload.idParent = newLabelParentId.value;
    }

    const res = await createLabel(payload);

    // Sesuaikan dengan struktur response create backend Anda
    // Biasanya ada di res.data atau res.data.data
    const newLabel = res.data;

    if (newLabel && newLabel.id) {
      // 2. Assign ke item terpilih
      await assignLabelToSelected(newLabel.id, newLabel.nama);
      // Refresh daftar label global
      await fetchLabels();
    }
  } catch (error: any) { // Type any agar bisa baca error response
    console.error("Gagal buat label:", error);
    // Tampilkan pesan error spesifik jika ada
    const msg = error.response?.data?.message || 'Gagal membuat label baru.';
    toast.add({ title: 'Gagal', description: Array.isArray(msg) ? msg.join(', ') : msg, color: 'error' });
    isLabelProcessing.value = false;
  }
};


// --- TABS DEFINITION ---
const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Konsep", value: "KONSEP", icon: FilePen },
  { label: "Kajian", value: "KA", icon: BookOpen },
];

onMounted(() => { loadData(); });

watch(() => route.query.q, (newVal) => {
  searchQuery.value = (newVal as string) || "";
}, { immediate: true });
</script>

<template>
  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue">
    <div
      class="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 dark:border-gray-800 transition-colors">

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
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative"
            :class="{ 'bg-gray-100 dark:bg-gray-800 text-neutral-900 dark:text-gray-200': showFilterMenu }"
            title="Opsi Filter">
            <MoreVertical class="w-4 h-4" />
            <span v-if="activeFilterType !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-800"></span>
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
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>

        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
          <div class="flex items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200">

            <button @click="confirmAction('delete')"
              class="p-1.5 text-red-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-error rounded transition-colors"
              title="Hapus">
              <Trash2 class="w-4 h-4" />
            </button>
            <button @click="confirmAction('archive')"
              class="p-1.5 text-primary dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-primary rounded hidden sm:block transition-colors"
              title="Arsipkan">
              <Archive class="w-4 h-4" />
            </button>
            <button @click="openLabelAssignModal"
              class="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary rounded transition-colors"
              title="Label">
              <Tag class="w-4 h-4" />
            </button>

            <span class="text-xs text-neutral-500 ms-2">{{ selectedIds.size }} dipilih</span>
          </div>
        </template>
      </div>

      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">

        <div class="relative">
          <button @click="showDateMenu = !showDateMenu" title="Periode Data"
            class="flex items-center gap-1 p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative">
            <History class="w-4 h-4 shrink-0" />
            <span v-if="activeDateLabel !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-800"></span>
          </button>

          <div v-if="showDateMenu" @click="showDateMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>

          <div v-if="showDateMenu"
            class="absolute top-full right-0 mt-1 w-[480px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex">

            <div class="w-7/12 p-4 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <div
                class="text-[13px] font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center justify-between">
                <span>Pilih Tanggal</span>
                <Check v-if="activeDateLabel === 'Custom'" class="w-3.5 h-3.5 text-primary" />
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Mulai
                    Tanggal</label>
                  <ClientOnly>
                    <UPopover v-model:open="openStart" :content="{ placement: 'bottom-start' }">
                      <UButton color="neutral" variant="outline" block class="justify-start">
                        <div class="flex items-center gap-2 w-full">
                          <span class="flex-1 text-left text-sm">
                            {{ startDate ? startDate.toString() : 'Pilih tanggal' }}
                          </span>
                          <CalendarIcon class="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </UButton>

                      <template #content="{ close }">
                        <div class="p-2">
                          <UCalendar v-model="startDate" @update:model-value="close" />
                        </div>
                      </template>
                    </UPopover>
                  </ClientOnly>
                </div>

                <div>
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sampai
                    Tanggal</label>
                  <ClientOnly>
                    <UPopover v-model:open="openEnd" :content="{ placement: 'bottom-start' }">
                      <UButton color="neutral" variant="outline" block class="justify-start">
                        <div class="flex items-center gap-2 w-full">
                          <span class="flex-1 text-left text-sm">
                            {{ endDate ? endDate.toString() : 'Pilih tanggal' }}
                          </span>
                          <CalendarIcon class="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </UButton>

                      <template #content="{ close }">
                        <div class="p-2">
                          <UCalendar v-model="endDate" @update:model-value="close" />
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
            class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors flex items-center gap-1">
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

        <button @click="downloadExcel"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Download Excel">
          <Download class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

        <div class="flex items-center gap-1">
          <div class="relative">
            <button @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors flex items-center gap-1">
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
          class="py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 sticky top-0 z-10 w-full overflow-hidden">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full">
            <UButton v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" color="primary"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 first:ms-2 last:me-2"
              :class="activeTab === tab.value ? 'bg-primary-400 text-white border-primary-400' : 'bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 border-neutral-200/50 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30'">
              <component :is="tab.icon" class="w-4 h-4" />{{ tab.label }}
            </UButton>
          </div>
        </div>
        <div class="flex-1 w-full relative">

          <div v-if="isLoading" class="w-full">
            <div v-for="n in 10" :key="n"
              class="flex gap-3 items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 w-full">

              <USkeleton class="w-3.5 h-3.5 rounded-sm shrink-0" />

              <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4 overflow-hidden">
                <div class="sm:basis-[35%] sm:min-w-[180px] lg:min-w-[220px] shrink-0">
                  <USkeleton class="h-3 w-24 sm:w-32" />
                </div>
                <div class="flex-1 mt-2 sm:mt-0">
                  <USkeleton class="h-3 w-full sm:w-3/4" />
                </div>
                <div class="hidden xl:flex shrink-0 w-[150px]">
                  <USkeleton class="h-5 w-20 rounded" />
                </div>
              </div>

              <div class="pl-2 shrink-0 text-right w-24">
                <USkeleton class="h-3 w-16 ml-auto" />
              </div>

              <div class="min-w-10 pl-2 shrink-0 w-8 flex justify-end">
                <USkeleton class="h-3 w-6" />
              </div>
            </div>
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
              <div class="flex items-center sm:basis-[35%] sm:min-w-[180px] lg:min-w-[220px] shrink-0">
                <div class="text-[13px] text-neutral-500 uppercase truncate font-bold" :title="mail.from">
                  {{ mail.from }}
                </div>
              </div>
              <div class="text-[13px] text-gray-900 dark:text-gray-100 truncate flex-1">{{ mail.subject }}</div>
              <div class="hidden xl:flex shrink-0 w-[50px] justify-start items-center">
                <span
                  class="w-32 block text-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap truncate"
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
              class="min-w-10 pl-2 ml-2 shrink-0 text-right w-8 flex items-center gap-1 rounded p-1 text-neutral-500 dark:text-gray-400"
              :class="[mail.category === 'SDE'
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
              ]" @click.stop="mail.category !== 'SDE' && openReaderModal(mail)">
              <Eye class="w-3.5 h-3.5 text-primary" />
              <span class="text-[12px] font-medium text-primary">
                {{ mail.category === 'SDE' ? '-' : mail.viewCount }}
              </span>
            </div>

          </div>
        </div>
      </div>

      <div v-if="selected"
        class="flex flex-col bg-white dark:bg-gray-900 absolute inset-0 z-40 lg:static lg:flex-1 lg:z-0 animate-in slide-in-from-right-8 duration-200 overflow-hidden border-l border-gray-200 dark:border-gray-800">
        <div class="flex flex-col bg-white dark:bg-gray-900 z-20 shrink-0">
          <div class="flex items-start justify-between px-6 pt-5 pb-2">
            <h2 class="text-xl text-gray-800 dark:text-gray-100 leading-tight pr-4 font-normal">{{ selected.subject }}
            </h2>
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 transition-colors"
              @click="closeDetail">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="px-6 pb-4 pt-2">
            <div class="flex gap-3 items-center">
              <UAvatar size="md"
                class="ring-2 ring-transparent group-hover:ring-primary-500/50 transition-all bg-primary-400 text-white font-semibold flex items-center justify-center shrink-0">
                {{ getInitials(selected.originalData.pengirim.nama) }}
              </UAvatar>
              <div class="flex-1 min-w-0">
                <div class="flex flex-col items-start leading-snug">
                  <div class="text-[14px] text-gray-900 dark:text-gray-100"><span class="font-semibold">{{
                    selected.originalData.pengirim.nama }}</span></div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate w-full text-left"
                    :title="selected.originalData.pengirim.position_text">{{
                      selected.originalData.pengirim.position_text }}
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-4">
              <span
                :class="[getCategoryStyle(selected.category), 'px-3 py-1 rounded-full text-[13px] font-medium inline-block']">
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
            <div v-if="selected.note">
              <div class="text-[13px] text-gray-500 dark:text-gray-400 mb-0.5">Sifat</div>
              <div class="text-[15px] text-gray-900 dark:text-gray-200 capitalize">{{ selected.note }}</div>
            </div>
          </div>
        </div>
        <div
          class="p-6 pt-0 mt-auto bg-white dark:bg-gray-900 shrink-0 border-t border-gray-100 dark:border-gray-800 pt-4">
          <NuxtLink :to="getDetailRoute(selected)"
            class="flex items-center justify-center w-full bg-primary text-white font-medium py-3 rounded-lg shadow-sm transition-colors text-[14px] hover:bg-primary-600">
            Lihat Detail Lengkap</NuxtLink>
        </div>
      </div>
    </div>

    <LabelAssignModal v-model="showLabelAssignModal" :selected-ids="selectedIds" @success="selectedIds.clear()" />

    <Teleport to="body">
      <div v-if="showReaderModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px] z-[999]">
        <div
          class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="flex items-start justify-between p-5 pb-2">
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">Status Pembaca Pesan</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{{ currentReaderData.subject }}</p>
            </div><button @click="showReaderModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-5 pt-2 flex-1 overflow-y-auto max-h-[60vh]">
            <div class="mb-4">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-green-500"></div><span
                  class="text-[15px] font-medium text-gray-800 dark:text-gray-200">Sudah Membaca ({{
                    currentReaderData.readList.length }})</span>
              </div>
              <div class="space-y-2">
                <div v-for="(reader, idx) in currentReaderData.readList" :key="idx"
                  class="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                  <div class="flex items-center gap-3">
                    <UAvatar size="md" :ui="{ background: reader.bg }"
                      class="text-white font-semibold flex items-center justify-center shrink-0">
                      {{ getInitials(reader.name) }}
                    </UAvatar>
                    <div>
                      <div class="text-sm font-semibold text-gray-900 dark:text-gray-200">{{ reader.position }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{{ reader.name }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">Dibaca pada: {{ reader.date }}</div>
                    </div>
                  </div>
                  <div class="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                </div>
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-gray-400"></div><span
                  class="text-[15px] font-medium text-gray-800 dark:text-gray-200">Belum Membaca ({{
                    currentReaderData.unreadList.length }})</span>
              </div>
              <div class="space-y-2">
                <div v-for="(reader, idx) in currentReaderData.unreadList" :key="idx"
                  class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div class="flex items-center gap-3">
                    <UAvatar size="md" :ui="{ background: reader.bg }"
                      class="text-white font-semibold flex items-center justify-center shrink-0">
                      {{ getInitials(reader.name) }}
                    </UAvatar>
                    <div>
                      <div class="text-sm font-semibold text-gray-900 dark:text-gray-200">{{ reader.position }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{{ reader.name }}</div>
                    </div>
                  </div>
                  <div class="w-2 h-2 rounded-full bg-gray-400 shrink-0"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4 border-t border-gray-100 dark:border-gray-800"><button @click="showReaderModal = false"
              class="w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Tutup</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showDeleteModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          class="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
          <div class="p-5 text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              :class="currentBulkAction === 'delete' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'">
              <AlertTriangle class="w-6 h-6"
                :class="currentBulkAction === 'delete' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'" />
            </div>

            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{{ modalTitle }}</h3>

            <div class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <div v-if="selectedIds.size === 1 && firstSelectedItem">
                Apakah Anda yakin ingin {{ actionLabel.toLowerCase() }} <br>
                <span class="font-semibold text-gray-700 dark:text-gray-200">"{{ firstSelectedItem.subject }}"</span>?
              </div>
              <div v-else>
                Apakah Anda yakin ingin {{ actionLabel.toLowerCase() }} <br>
                <span class="font-bold text-gray-800 dark:text-gray-200">{{ selectedIds.size }} item terpilih</span>?

                <div v-if="firstSelectedItem"
                  class="mt-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                  Contoh: <span class="italic">"{{ firstSelectedItem.subject }}"</span>
                  <span v-if="selectedIds.size > 1">...dan {{ selectedIds.size - 1 }} lainnya.</span>
                </div>
              </div>
            </div>

            <div class="flex gap-3 justify-center">
              <button @click="showDeleteModal = false" :disabled="isDeleting"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                Batal
              </button>
              <button @click="handleBulkExecute" :disabled="isDeleting"
                class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="currentBulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-600'">
                <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
                {{ isDeleting ? 'Memproses...' : actionLabel }}
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
