<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import {
  Inbox,
  FileText,
  Send,
  Building,
  Building2,
  FilePen,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  MoreVertical,
  History,
  ArrowUpDown,
  Layers,
  StickyNote,
  RotateCw,
  Download,
  Lock,
  Tag,
  Loader2,
  AlertTriangle,
  BookOpen,
  Calendar as CalendarIcon,
  LockOpen,
  Search,
  X,
} from "lucide-vue-next";
import * as XLSX from "xlsx";
import { useInbox } from "~/composables/useInbox";
import { useLabel } from "~/composables/useLabel";

const { user, getProfile } = useAuth();
const toast = useToast();

// --- STATE MANAGEMENT ---
const {
  items,
  pagination,
  summary,
  pending,
  fetchInbox,
  markAsRead,
  toggleFlag,
} = useInbox();

const {
  labels,
  fetchLabels,
  createLabel,
  addNaskahToLabel: _addNaskahToLabel,
} = useLabel();

const isLoading = ref(false);
const selected = ref(null);
const selectedIds = ref(new Set());
const searchQuery = ref("");
const isLabelProcessing = ref(false);

// Filter & Pagination State
const activeTab = ref("ALL");
const showFilterMenu = ref(false);
const activeFilterType = ref("Semua");
const showSortMenu = ref(false);
const activeSortLabel = ref("Terbaru");
const showPageMenu = ref(false);
const itemsPerPage = ref(10);
const currentPage = ref(1);

// Date Filter State
const showDateMenu = ref(false);
const activeDateLabel = ref("Semua");
const startDateInput = ref(new Date().toISOString().split('T')[0]);
const endDateInput = ref(new Date().toISOString().split('T')[0]);
const isCustomDate = computed(() => activeDateLabel.value === "Custom");

// Bulk Action State
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const currentBulkAction = ref("delete");
const showLabelAssignModal = ref(false);

// --- CONFIGURATION ---
const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Konsep", value: "K", icon: FilePen },
  { label: "Kajian", value: "KA", icon: BookOpen },
];

const filterMenuOptions = [
  { label: "Semua", value: "Semua" },
  { label: "Prioritas", value: "Prioritas" },
  { label: "Favorite", value: "Favorite" },
  { label: "Sudah Tinjut", value: "Sudah Tinjut" },
  { label: "Belum Tinjut", value: "Belum Tinjut" },
  { label: "Lock", value: "Lock" },
  { label: "Note", value: "Note" },
  { label: "Arsip", value: "Arsip" },
  { label: "Sudah Dibaca", value: "Sudah Dibaca" },
  { label: "Belum Dibaca", value: "Belum Dibaca" },
];

// Calendar Popover State
const openStartDate = ref(false)
const openEndDate = ref(false)

// CalendarDate object untuk UCalendar (Nuxt UI v3 pakai @internationalized/date)
import { parseDate, today, getLocalTimeZone } from '@internationalized/date'

const todayDate = today(getLocalTimeZone())

// Sync dua arah: UCalendar ↔ startDateInput (string YYYY-MM-DD)
const startDateCal = ref(parseDate(startDateInput.value))
const endDateCal = ref(parseDate(endDateInput.value))

watch(startDateCal, (val) => {
  if (val) startDateInput.value = val.toString()
})
watch(endDateCal, (val) => {
  if (val) endDateInput.value = val.toString()
})

const dateOptions = ["7 Hari", "30 Hari", "60 Hari", "1 Tahun", "Semua"];
const sortOptions = ["Terbaru", "Terlama"];
const pageOptions = [10, 25, 50, 100];

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Kotak Masuk", to: "#" },
];

// --- HELPERS ---
const formatShortDate = (dateString: string | null) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const time = `${hours}.${minutes}`;
  const day = date.getUTCDate();

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const month = monthNames[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  const now = new Date();
  const isToday =
    day === now.getDate() &&
    date.getUTCMonth() === now.getMonth() &&
    year === now.getFullYear();
  const isThisYear = year === now.getFullYear();

  if (isToday) return time;
  if (isThisYear) return `${day} ${month} ${time}`;
  return `${day} ${month} ${year} ${time}`;
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
  if (["DI", "DISPOSISI"].includes(c))
    return "bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300";
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
  if (["DI", "DISPOSISI"].includes(c)) return "DI";
  return "K";
};

// --- CORE LOGIC ---
const refreshData = async () => {
  if (isLoading.value && pending.value) return;
  isLoading.value = true;

  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
    };

    // Tab → jenis param
    if (activeTab.value !== "ALL" && activeTab.value !== "Semua") {
      params.jenis = activeTab.value;
    }

    // ✅ Date filter — selalu pakai start_date & end_date, tidak pakai preset
    const today = new Date();
    const toDateStr = (d: Date) => d.toISOString().split("T")[0];

    if (activeDateLabel.value === "Custom") {
      // ✅ Baca langsung dari startDateInput / endDateInput (sudah string YYYY-MM-DD)
      params.start_date = startDateInput.value;
      params.end_date = endDateInput.value;
    } else if (activeDateLabel.value !== "Semua") {
      const daysMap: Record<string, number> = {
        "7 Hari": 7,
        "30 Hari": 30,
        "60 Hari": 60,
        "1 Tahun": 365,
      };
      const days = daysMap[activeDateLabel.value];
      if (days) {
        const from = new Date(today);
        from.setDate(today.getDate() - days);
        params.start_date = toDateStr(from);
        params.end_date = toDateStr(today);
      }
    }
    // Jika "Semua" → tidak kirim start_date / end_date

    // Sort
    if (activeSortLabel.value === "Terlama") {
      params.sort = "asc";
    }

    // Mapping activeFilterType → param API
    switch (activeFilterType.value) {
      case "Sudah Dibaca":
        params.status_baca = "terbaca";
        break;
      case "Belum Dibaca":
        params.status_baca = "belum_terbaca";
        break;
      case "Favorite":
        params.favorite = true;
        break;
      case "Sudah Tinjut":
        params.tinjut = "sudah_tinjut";
        break;
      case "Belum Tinjut":
        params.tinjut = "belum_tinjut";
        break;
      case "Lock":
        params.lock = true;
        break;
      case "Note":
        params.note = true;
        break;
      case "Arsip":
        params.arsip = true;
        break;
      case "Prioritas":
        params.priority = true;
        break;
    }

    await fetchInbox(params);
  } catch (err) {
    console.error("Gagal refresh data inbox:", err);
  } finally {
    isLoading.value = false;
  }
};

const addNaskahToLabel = async (naskahId: string, labelId: string) => {
  return await _addNaskahToLabel(naskahId, labelId, "inbox");
};

const selectedNaskahIds = computed(() => {
  const result = new Set<string>();
  selectedIds.value.forEach((sirkulasiId) => {
    const mailItem = items.value.find((e) => e.id === sirkulasiId);
    if (mailItem?.naskahId) result.add(mailItem.naskahId);
  });
  return result;
});

const assignLabelToSelected = async (labelId: string, labelName: string) => {
  if (selectedIds.value.size === 0) return;
  isLabelProcessing.value = true;

  try {
    const promises = Array.from(selectedIds.value)
      .map((selectedId) => {
        const mailItem = items.value.find((e) => e.id === selectedId);
        const realNaskahId = mailItem?.naskahId;
        if (!realNaskahId) {
          console.warn(`Naskah ID tidak ditemukan untuk item: ${selectedId}`);
          return null;
        }
        return addNaskahToLabel(realNaskahId, labelId);
      })
      .filter((p) => p !== null);

    await Promise.all(promises);

    toast.add({
      title: "Berhasil",
      description: `Label "${labelName}" berhasil ditambahkan ke ${promises.length} item.`,
      color: "success",
    });

    showLabelAssignModal.value = false;
    selectedIds.value.clear();
    refreshData();
  } catch (error) {
    console.error("Gagal assign label:", error);
    toast.add({
      title: "Gagal",
      description: "Gagal menambahkan label.",
      color: "error",
    });
  } finally {
    isLabelProcessing.value = false;
  }
};

const displayItems = computed(() => items.value || []);

// --- UI ACTIONS ---
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

// ✅ applyCustomDate: set label jadi Custom lalu langsung refresh
const applyCustomDate = () => {
  activeDateLabel.value = "Custom";
  showDateMenu.value = false;
  currentPage.value = 1;
  refreshData();
};

const applyFilter = (filterName: string) => {
  activeFilterType.value = filterName;
  showFilterMenu.value = false;
  // watcher akan trigger refreshData
};

const selectPageSize = (size: number) => {
  itemsPerPage.value = size;
  showPageMenu.value = false;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

// Selection Logic
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value.clear();
  } else {
    displayItems.value.forEach((mail) => selectedIds.value.add(mail.id));
  }
};

const toggleSelection = (id: string) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};

const selectMail = (mail: any) => {
  selected.value = mail;
  const posId = user.value?.position;
  if (posId) markAsRead(mail, posId);
  navigateTo(
    `/korespondensi/kotak-masuk/${mail.naskahId}?jenis=${mail.category}`,
  );
};

// Bulk Actions
const confirmAction = (action: string) => {
  if (selectedIds.value.size === 0) return;
  currentBulkAction.value = action;
  showDeleteModal.value = true;
};

const handleToggleFlag = async (
  mail: any,
  type: "favorit" | "arsip" | "note" | "tindak_lanjut" | "lock",
) => {
  try {
    const item = items.value.find((i) => i.id === mail.id);
    if (!item) return;

    let description = "";

    if (type === "favorit") {
      item.isStarred = !item.isStarred;
      description = item.isStarred ? "Ditambahkan ke Favorit" : "Dihapus dari Favorit";
    } else if (type === "tindak_lanjut") {
      item.isTinjut = !item.isTinjut;
      description = item.isTinjut ? "Ditandai tindak lanjut" : "Tindak lanjut selesai";
    } else if (type === "note") {
      item.isNote = !item.isNote;
      description = item.isNote ? "Note ditandai" : "Tanda note dihapus";
    } else if (type === "lock") {
      item.isLocked = !item.isLocked;
      description = item.isLocked ? "Pesan dikunci" : "Kunci pesan dibuka";
    } else if (type === "arsip") {
      item.isArsip = !item.isArsip;
      description = item.isArsip ? "Pesan diarsipkan" : "Pesan dikembalikan dari arsip";

      const currentFilterIsArsip = activeFilterType.value === "Arsip";
      if (!currentFilterIsArsip && item.isArsip === true) {
        items.value = items.value.filter((i) => i.id !== mail.id);
      }
      if (currentFilterIsArsip && item.isArsip === false) {
        items.value = items.value.filter((i) => i.id !== mail.id);
      }
    }

    toast.add({ title: "Berhasil", description, color: "success", timeout: 2000 });
    await toggleFlag(item, type);
  } catch (error) {
    console.error(error);
    toast.add({ title: "Gagal", description: "Gagal memperbarui status.", color: "error" });
    refreshData();
  }
};

const handleBulkExecute = async () => {
  if (!user.value?.position) return;
  isDeleting.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.add({
      title: "Berhasil",
      description: `Item berhasil di-${currentBulkAction.value === "archive" ? "arsipkan" : "hapus"}.`,
      color: "success",
    });
    selectedIds.value.clear();
    showDeleteModal.value = false;
    await refreshData();
  } catch (error) {
    toast.add({ title: "Gagal", description: "Terjadi kesalahan.", color: "error" });
  } finally {
    isDeleting.value = false;
  }
};

const openLabelAssignModal = () => {
  showLabelAssignModal.value = true;
};

const downloadExcel = () => {
  if (displayItems.value.length === 0) return;
  const totalTerbaca = displayItems.value.filter((mail) => mail.isRead).length;
  const totalBelumDibaca = displayItems.value.filter((mail) => !mail.isRead).length;

  const tableData = displayItems.value.map((mail, index) => ({
    No: index + 1,
    Nomor: mail.nomor || "-",
    Perihal: mail.subject || "-",
    Pengirim: mail.from || "-",
    Kategori: mail.category_label || mail.category || "-",
    Tanggal: formatShortDate(mail.raw?.created_at),
    Status_Baca: mail.isRead ? "Sudah Dibaca" : "Belum Dibaca",
  }));

  const worksheet = XLSX.utils.aoa_to_sheet([
    ["RINGKASAN KOTAK MASUK (Halaman Ini)"],
    ["Total Terbaca", totalTerbaca],
    ["Total Belum Dibaca", totalBelumDibaca],
    [],
  ]);
  XLSX.utils.sheet_add_json(worksheet, tableData, { origin: "A5" });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Kotak Masuk");
  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `kotak_masuk_${today}.xlsx`);
};

// Computed
const totalItems = computed(() => pagination.value.total);
const totalPages = computed(() => pagination.value.totalPages);
const isAllSelected = computed(
  () =>
    displayItems.value.length > 0 &&
    selectedIds.value.size === displayItems.value.length,
);
const firstSelectedItem = computed(() => {
  if (selectedIds.value.size === 0) return null;
  const firstId = [...selectedIds.value][0];
  return displayItems.value.find((e) => e.id === firstId);
});
const modalTitle = computed(() =>
  currentBulkAction.value === "archive" ? "Arsipkan Surat?" : "Hapus Surat?",
);
const actionLabel = computed(() =>
  currentBulkAction.value === "archive" ? "Arsipkan" : "Hapus",
);
const paginationInfo = computed(() => {
  if (pagination.value.total === 0) return "0-0 Dari 0";
  const start = (pagination.value.page - 1) * pagination.value.limit + 1;
  const end = Math.min(start + pagination.value.limit - 1, pagination.value.total);
  return `${start}-${end} Dari ${pagination.value.total}`;
});

const activeFilterBadge = computed(() => {
  if (activeFilterType.value !== "Semua") return activeFilterType.value;
  if (activeDateLabel.value !== "30 Hari") return activeDateLabel.value;
  return null;
});

// ✅ Single watcher — tidak duplikat, activeDateLabel tidak perlu di-watch
// karena selectDateFilter & applyCustomDate sudah memanggil refreshData() langsung
watch([activeTab, itemsPerPage, activeFilterType], () => {
  currentPage.value = 1;
  refreshData();
});
watch(currentPage, () => refreshData());

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    refreshData();
  }, 500);
});

onMounted(async () => {
  if (!user.value) await getProfile();
  refreshData();
});
</script>

<template>
  <PageHeader title="Kotak Masuk" :items="breadcrumbs" />
  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent dark:bg-gray-900 overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue transition-colors">
    <!-- ══════════════════════════════════════════════════════
         TOOLBAR BAR
    ══════════════════════════════════════════════════════ -->
    <div
      class="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors">
      <!-- LEFT: Checkbox + Filter + Refresh + Bulk Actions -->
      <div class="flex items-center gap-1 shrink-0 relative">
        <!-- Select All Checkbox -->
        <div class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
          @click="toggleSelectAll">
          <div
            class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
            :class="{
              'bg-primary border-primary': isAllSelected,
              'group-hover:border-gray-600 dark:group-hover:border-gray-300': !isAllSelected,
            }">
            <Check v-if="isAllSelected" class="w-3 h-3 text-white" stroke-width="3" />
          </div>
        </div>

        <!-- Filter Dropdown -->
        <div class="relative">
          <button @click="showFilterMenu = !showFilterMenu"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative"
            :class="{ 'bg-gray-100 dark:bg-gray-700 text-neutral-900 dark:text-gray-200': showFilterMenu }"
            title="Opsi Filter">
            <MoreVertical class="w-4 h-4" />
            <span v-if="activeFilterType !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-800">
            </span>
          </button>
          <div v-if="showFilterMenu" @click="showFilterMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showFilterMenu"
            class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in filterMenuOptions" :key="opt.value" @click="applyFilter(opt.value)"
              class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group transition-colors">
              <span :class="activeFilterType === opt.value ? 'font-semibold text-primary' : ''">
                {{ opt.label }}
              </span>
              <Check v-if="activeFilterType === opt.value" class="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
        </div>

        <!-- Refresh -->
        <button @click="refreshData"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Muat Ulang">
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': pending || isLoading }" />
        </button>

        <!-- Bulk Actions (tampil saat ada item dipilih) -->
        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
          <div class="flex items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200">
            <button @click="confirmAction('archive')"
              class="p-1.5 text-primary dark:text-primary-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-primary rounded hidden sm:block transition-colors"
              title="Arsipkan">
              <Archive class="w-4 h-4" />
            </button>
            <button @click="openLabelAssignModal"
              class="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary rounded transition-colors"
              title="Label">
              <Tag class="w-4 h-4" />
            </button>
            <span class="text-xs text-neutral-500 dark:text-gray-400 ms-2">
              {{ selectedIds.size }} dipilih
            </span>
          </div>
        </template>

        <!-- Active Filter Badge -->
        <template v-if="activeFilterType !== 'Semua' && selectedIds.size === 0">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
          <span
            class="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 border border-primary-200 dark:border-primary-700 rounded-full font-medium animate-in fade-in duration-200">
            {{ activeFilterType }}
            <button @click="applyFilter('Semua')" class="hover:text-primary-800 ml-0.5">
              <X class="w-3 h-3" />
            </button>
          </span>
        </template>
      </div>

      <!-- RIGHT: Search + Date + Sort + Download + Pagination -->
      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">

        <!-- Date Filter -->
        <div class="relative">
          <button @click="showDateMenu = !showDateMenu" title="Periode Data"
            class="flex items-center gap-1 p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative">
            <History class="w-4 h-4 shrink-0" />
            <span v-if="activeDateLabel !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-800">
            </span>
          </button>

          <div v-if="showDateMenu" @click="showDateMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>

          <div v-if="showDateMenu"
            class="absolute top-full right-0 mt-2 w-[480px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden flex animate-in fade-in slide-in-from-top-2 duration-150">

            <!-- Custom Date Range -->
            <div class="w-7/12 p-4 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <div
                class="text-[13px] font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center justify-between">
                <span>Rentang Tanggal</span>
                <Check v-if="isCustomDate" class="w-3.5 h-3.5 text-primary" />
              </div>

              <div class="space-y-4">
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

            <!-- Preset Options -->
            <div class="w-5/12 py-2 bg-white dark:bg-gray-800">
              <div class="px-4 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Preset
              </div>
              <button v-for="opt in dateOptions" :key="opt" @click="selectDateFilter(opt)"
                class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-primary flex items-center justify-between group transition-colors">
                <span>{{ opt }}</span>
                <Check v-if="activeDateLabel === opt" class="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          </div>
        </div>

        <!-- Sort -->
        <div class="relative">
          <button @click="showSortMenu = !showSortMenu"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
            title="Urutkan">
            <ArrowUpDown class="w-4 h-4" />
          </button>
          <div v-if="showSortMenu" @click="showSortMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showSortMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in sortOptions" :key="opt" @click="selectSortOption(opt)"
              class="w-full text-left px-3 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors">
              <span>{{ opt }}</span>
              <Check v-if="activeSortLabel === opt" class="w-3 h-3 text-primary" />
            </button>
          </div>
        </div>

        <!-- Download Excel -->
        <button @click="downloadExcel"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Download Excel">
          <Download class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

        <!-- Page Size + Pagination -->
        <div class="flex items-center gap-1">
          <div class="relative">
            <button @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors flex items-center gap-1">
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
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
              @click="prevPage" :disabled="currentPage === 1">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
              @click="nextPage" :disabled="currentPage === totalPages">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         MAIN CONTENT
    ══════════════════════════════════════════════════════ -->
    <div class="flex-1 flex overflow-hidden relative w-full">
      <div
        class="flex flex-col bg-white dark:bg-gray-800 transition-all duration-300 border-r border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden flex-1 w-full">
        <!-- Tab Bar -->
        <div
          class="py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 sticky top-0 z-10 w-full overflow-hidden">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full py-1">
            <UButton v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" color="primary"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 first:ms-2 last:me-2"
              :class="activeTab === tab.value
                ? 'bg-primary-400 text-white border-primary-400'
                : 'bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 border-neutral-200/50 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                ">
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
              <span v-if="getTabCount(tab.value) > 0" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                :class="activeTab === tab.value
                  ? 'bg-white text-primary-500'
                  : 'bg-primary-50 text-primary-500 dark:bg-primary-900/50 dark:text-primary-300'
                  ">
                {{ getTabCount(tab.value) }}
              </span>
            </UButton>
          </div>
        </div>

        <!-- Search Bar (mobile) -->
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

        <!-- Empty State -->
        <div v-if="displayItems.length === 0 && !pending && !isLoading"
          class="flex flex-col items-center justify-center py-16 text-neutral-400 dark:text-gray-500 w-full">
          <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <Inbox class="w-8 h-8 opacity-50" />
          </div>
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Tidak ada data</span>
          <span class="text-xs text-gray-400 dark:text-gray-500 mt-1">
            <template v-if="activeFilterType !== 'Semua'">
              Filter "{{ activeFilterType }}" tidak menghasilkan data.
              <button @click="applyFilter('Semua')" class="text-primary hover:underline ml-1">Reset filter</button>
            </template>
            <template v-else>Kotak masuk kosong.</template>
          </span>
        </div>

        <!-- List -->
        <div v-else class="w-full overflow-x-auto pb-2">
          <div class="w-full min-w-full md:min-w-[800px]">
            <!-- Skeleton Loading -->
            <div v-if="pending || isLoading" class="w-full">
              <div v-for="n in itemsPerPage > 10 ? 10 : itemsPerPage" :key="n"
                class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 items-center w-full min-h-[50px]">
                <div class="flex items-center shrink-0 gap-2 w-full md:w-auto">
                  <div class="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div class="md:hidden h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ml-2"></div>
                </div>
                <div class="flex-1 w-full flex flex-col md:flex-row md:items-center md:gap-4">
                  <div class="md:w-44 lg:w-52 shrink-0 flex flex-col gap-1.5 mb-1 md:mb-0">
                    <div class="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div class="h-2.5 w-1/2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                  </div>
                  <div class="flex-1 flex flex-wrap items-center gap-2 w-full">
                    <div class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div class="h-3 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div class="hidden md:flex shrink-0 w-[50px] justify-start">
                    <div class="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  </div>
                  <div class="shrink-0 w-full md:w-[130px] md:text-right mt-1 md:mt-0">
                    <div class="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse md:ml-auto"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mail Items -->
            <div v-else class="w-full">
              <div v-for="mail in displayItems" :key="mail.id" @click="selectMail(mail)"
                class="group flex flex-col md:flex-row gap-3 items-start py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors relative w-full min-h-[50px]"
                :class="[
                  mail.is_priority
                    ? 'bg-red-50/60 dark:bg-red-900/20 hover:bg-red-100/60 dark:hover:bg-red-900/30 border-l-4 border-l-red-500 pl-3'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-l-transparent pl-4',
                ]">
                <!-- Left controls -->
                <div class="flex items-center shrink-0 pt-1 gap-2 w-full md:w-auto" @click.stop>
                  <div
                    class="w-3.5 h-3.5 border-[1.5px] border-neutral-300 dark:border-gray-600 rounded-sm flex items-center justify-center transition-colors"
                    :class="selectedIds.has(mail.id) ? 'bg-primary border-primary' : 'bg-white dark:bg-gray-800'"
                    @click="toggleSelection(mail.id)">
                    <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
                  </div>

                  <Star class="w-4 h-4 transition-colors hover:text-yellow-400 cursor-pointer"
                    :class="mail.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300 dark:text-gray-600'"
                    @click.stop="handleToggleFlag(mail, 'favorit')" />

                  <Tag class="w-4 h-4 -rotate-45 transition-colors hover:text-primary-300 cursor-pointer"
                    :class="mail.isTinjut ? 'text-primary-500 fill-primary-500' : 'text-neutral-300 dark:text-gray-600'"
                    @click.stop="handleToggleFlag(mail, 'tindak_lanjut')" />

                  <span
                    class="md:hidden ml-auto sm:ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    :class="getCategoryStyle(mail.category)">
                    {{ getCategoryLabel(mail.category) }}
                  </span>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-4 w-full">
                  <div class="flex items-center md:w-44 lg:w-65 shrink-0 mb-1 md:mb-0">
                    <div v-if="!mail.isRead" class="w-2 h-2 rounded-full bg-blue-600 shrink-0 mr-2"
                      title="Belum Dibaca">
                    </div>

                    <div class="flex flex-col min-w-0">
                      <UTooltip :text="mail.fullRecipients"
                        :ui="{ content: 'h-auto py-2 px-3', text: 'whitespace-pre-line text-left' }"
                        class="min-w-0 truncate">
                        <span
                          class="block w-full md:w-48 xl:w-64 truncate text-[13px] text-neutral-900 dark:text-white shrink-0 font-semibold cursor-help">
                          {{ mail.from }}
                        </span>
                      </UTooltip>

                      <div class="text-[11px] text-neutral-400 dark:text-gray-500 flex items-center gap-2 mt-0.5">
                        <span class="font-mono truncate">{{ mail.nomor }}</span>
                        <span v-if="mail.is_priority"
                          class="flex items-center gap-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border border-red-200 dark:border-red-800 transition-colors">
                          <AlertTriangle class="w-3 h-3" />
                          PRIORITAS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    <div v-if="mail.labels && mail.labels.length > 0" class="flex flex-wrap gap-1 shrink-0">
                      <span v-for="lbl in mail.labels" :key="lbl" :title="lbl"
                        class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 max-w-[80px] truncate cursor-help">
                        {{ lbl }}
                      </span>
                    </div>
                    <div class="text-[13px] text-neutral-900 dark:text-white truncate flex-1 min-w-[120px]"
                      :class="!mail.isRead ? 'font-bold' : 'font-normal'">
                      {{ mail.subject }}
                    </div>
                  </div>

                  <div class="hidden md:flex shrink-0 w-[50px] justify-start items-center">
                    <span
                      class="w-32 block text-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap truncate"
                      :class="getCategoryStyle(mail.category)">
                      {{ getCategoryLabel(mail.category) }}
                    </span>
                  </div>

                  <div class="shrink-0 pt-0.5 w-full md:w-[130px] md:text-right text-left md:pe-2 mt-1 md:mt-0">
                    <span class="text-caption2b text-neutral-500 dark:text-gray-400 text-[12px] whitespace-nowrap">
                      {{ formatShortDate(mail.raw?.created_at) }}
                    </span>
                  </div>
                </div>

                <!-- Hover Quick Actions -->
                <div
                  class="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 rounded-md px-2 py-1.5 z-10 animate-in fade-in duration-200">
                  <div class="flex items-center gap-2 p-1">
                    <StickyNote class="w-4 h-4 transition-colors hover:text-orange-500 cursor-pointer"
                      :class="mail.isNote ? 'text-orange-600 fill-orange-100' : 'text-neutral-300 dark:text-gray-600'"
                      @click.stop="handleToggleFlag(mail, 'note')" />

                    <Lock v-if="mail.isLocked"
                      class="w-4 h-4 transition-colors text-red-600 fill-red-100 hover:text-red-600 cursor-pointer"
                      @click.stop="handleToggleFlag(mail, 'lock')" />
                    <LockOpen v-else
                      class="w-4 h-4 transition-colors text-neutral-300 dark:text-gray-600 hover:text-red-500 cursor-pointer"
                      @click.stop="handleToggleFlag(mail, 'lock')" />

                    <Archive class="w-4 h-4 transition-colors hover:text-green-600 cursor-pointer"
                      :class="mail.isArsip ? 'text-green-700 fill-green-100' : 'text-neutral-300 dark:text-gray-600'"
                      @click.stop="handleToggleFlag(mail, 'arsip')" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         MODALS
    ══════════════════════════════════════════════════════ -->

    <LabelAssignModal v-model="showLabelAssignModal" :selected-ids="selectedNaskahIds" source="inbox"
      @success="selectedIds.clear()" />

    <Teleport to="body">
      <div v-if="showDeleteModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800 transition-colors">
          <div class="p-5 text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              :class="currentBulkAction === 'delete' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'">
              <AlertTriangle class="w-6 h-6"
                :class="currentBulkAction === 'delete' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{{ modalTitle }}</h3>
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <div v-if="selectedIds.size === 1 && firstSelectedItem">
                Apakah Anda yakin ingin {{ actionLabel.toLowerCase() }} <br />
                <span class="font-semibold text-gray-700 dark:text-gray-200">"{{ firstSelectedItem.subject }}"</span>?
              </div>
              <div v-else>
                Apakah Anda yakin ingin {{ actionLabel.toLowerCase() }} <br />
                <span class="font-bold text-gray-800 dark:text-gray-200">{{ selectedIds.size }} item terpilih</span>?
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
                {{ isDeleting ? "Memproses..." : actionLabel }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
