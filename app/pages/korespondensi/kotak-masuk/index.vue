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
  unsetPriority,
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
const activeDateLabel = ref("30 Hari");
const startDate = ref(new Date());
const endDate = ref(new Date());
const openStart = ref(false);
const openEnd = ref(false);
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
  { label: "Favorite", value: "Favorite" },
  { label: "Sudah Tinjut", value: "Sudah Tinjut" },
  { label: "Belum Tinjut", value: "Belum Tinjut" },
  { label: "Lock", value: "Lock" },
  { label: "Note", value: "Note" },
  { label: "Arsip", value: "Arsip" },
  { label: "Sudah Dibaca", value: "Sudah Dibaca" },
  { label: "Belum Dibaca", value: "Belum Dibaca" },
];

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
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
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

// --- LOGIC ---
const refreshData = async () => {
  if (isLoading.value && pending.value) return;
  isLoading.value = true;

  try {
    let jenisParam = undefined;
    if (activeTab.value !== "ALL" && activeTab.value !== "Semua") {
      jenisParam = activeTab.value;
    }

    let statusBacaParam = undefined;
    if (activeFilterType.value === "Sudah Dibaca") statusBacaParam = "terbaca";
    if (activeFilterType.value === "Belum Dibaca")
      statusBacaParam = "belum_terbaca";

    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      jenis: jenisParam,
      status_baca: statusBacaParam,
      search: searchQuery.value || undefined,
    };

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

const assignLabelToSelected = async (labelId: string, labelName: string) => {
  if (selectedIds.value.size === 0) return;
  isLabelProcessing.value = true;

  try {
    const promises = Array.from(selectedIds.value)
      .map((selectedId) => {
        const mailItem = items.value.find(
          (e) => e.id === selectedId || e.naskahId === selectedId,
        );
        const realNaskahId = mailItem?.naskahId;

        if (!realNaskahId) {
          console.warn(
            `Naskah ID tidak ditemukan untuk item dengan ID: ${selectedId}`,
          );
          return null;
        }

        return addNaskahToLabel(realNaskahId, labelId, "inbox");
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

// --- UI ACTIONS ---
const selectSortOption = (opt: string) => {
  activeSortLabel.value = opt;
  showSortMenu.value = false;
  if (opt === "Terbaru") {
    items.value.sort(
      (a, b) =>
        new Date(b.raw?.created_at || b.date).getTime() -
        new Date(a.raw?.created_at || a.date).getTime(),
    );
  } else {
    items.value.sort(
      (a, b) =>
        new Date(a.raw?.created_at || a.date).getTime() -
        new Date(b.raw?.created_at || b.date).getTime(),
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

const applyFilter = (filterName: string) => {
  activeFilterType.value = filterName;
  showFilterMenu.value = false;
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
    items.value.forEach((mail) => selectedIds.value.add(mail.id));
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

  if (mail.is_priority) {
    handleUnsetPriority(mail);
  }

  navigateTo(
    `/korespondensi/kotak-masuk/${mail.naskahId}?jenis=${mail.category}`,
  );
};

// Bulk Actions Logic
const confirmAction = (action: string) => {
  if (selectedIds.value.size === 0) return;
  currentBulkAction.value = action;
  showDeleteModal.value = true;
};

const handleUnsetPriority = async (mail: any) => {
  if (!mail.is_priority) return;

  const previousState = mail.is_priority;
  mail.is_priority = false;

  try {
    await unsetPriority(mail);
  } catch (error) {
    mail.is_priority = previousState;
    console.error("Gagal auto-unset priority:", error);
  }
};

const handleToggleFlag = async (
  mail: any,
  type: "favorit" | "arsip" | "note" | "tindak_lanjut" | "lock",
) => {
  try {
    const oldState = { ...mail };

    if (type === "favorit") mail.isStarred = !mail.isStarred;
    if (type === "tindak_lanjut") mail.isTinjut = !mail.isTinjut;
    if (type === "note") mail.isNote = !mail.isNote;
    if (type === "lock") mail.isLocked = !mail.isLocked;

    if (type === "arsip") {
      const newStateArsip = !mail.isArsip;
      mail.isArsip = newStateArsip;
      const currentFilterIsArsip = activeFilterType.value === "Arsip";

      if (!currentFilterIsArsip && newStateArsip === true) {
        items.value = items.value.filter((item) => item.id !== mail.id);
      }
      if (currentFilterIsArsip && newStateArsip === false) {
        items.value = items.value.filter((item) => item.id !== mail.id);
      }
    }

    await toggleFlag(mail, type);

    let title = "Berhasil";
    let description = "";

    if (type === "favorit")
      description = mail.isStarred
        ? "Ditambahkan ke Favorit"
        : "Dihapus dari Favorit";
    else if (type === "arsip")
      description = mail.isArsip
        ? "Pesan diarsipkan"
        : "Pesan dikembalikan dari arsip";
    else if (type === "note")
      description = mail.isNote ? "Note ditandai" : "Tanda note dihapus";
    else if (type === "lock")
      description = mail.isLocked ? "Pesan dikunci" : "Kunci pesan dibuka";
    else if (type === "tindak_lanjut")
      description = mail.isTinjut
        ? "Ditandai tindak lanjut"
        : "Tindak lanjut selesai";

    toast.add({ title, description, color: "success", timeout: 2000 });
  } catch (error) {
    console.error(error);
    toast.add({
      title: "Gagal",
      description: "Gagal memperbarui status.",
      color: "error",
    });
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
    toast.add({
      title: "Gagal",
      description: "Terjadi kesalahan.",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

const openLabelAssignModal = () => {
  showLabelAssignModal.value = true;
};

const downloadExcel = () => {
  if (items.value.length === 0) return;
  const totalTerbaca = items.value.filter((mail) => mail.isRead).length;
  const totalBelumDibaca = items.value.filter((mail) => !mail.isRead).length;

  const tableData = items.value.map((mail, index) => ({
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
  () => items.value.length > 0 && selectedIds.value.size === items.value.length,
);
const firstSelectedItem = computed(() => {
  if (selectedIds.value.size === 0) return null;
  const firstId = [...selectedIds.value][0];
  return items.value.find((e) => e.id === firstId);
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
  const end = Math.min(
    start + pagination.value.limit - 1,
    pagination.value.total,
  );
  return `${start}-${end} Dari ${pagination.value.total}`;
});

// Watchers
watch([activeTab, itemsPerPage, activeFilterType], () => {
  currentPage.value = 1;
  refreshData();
});
watch(currentPage, () => refreshData());

let searchTimeout: NodeJS.Timeout;
watch(searchQuery, (newVal) => {
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
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent dark:bg-gray-900 overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue transition-colors"
  >
    <div
      class="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors"
    >
      <div class="flex items-center gap-1 shrink-0 relative">
        <div
          class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
          @click="toggleSelectAll"
        >
          <div
            class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
            :class="{
              'bg-primary border-primary': isAllSelected,
              'group-hover:border-gray-600 dark:group-hover:border-gray-300':
                !isAllSelected,
            }"
          >
            <Check
              v-if="isAllSelected"
              class="w-3 h-3 text-white"
              stroke-width="3"
            />
          </div>
        </div>

        <div class="relative">
          <button
            @click="showFilterMenu = !showFilterMenu"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative"
            :class="{
              'bg-gray-100 dark:bg-gray-700 text-neutral-900 dark:text-gray-200':
                showFilterMenu,
            }"
            title="Opsi Filter"
          >
            <MoreVertical class="w-4 h-4" />
            <span
              v-if="activeFilterType !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-800"
            ></span>
          </button>
          <div
            v-if="showFilterMenu"
            @click="showFilterMenu = false"
            class="fixed inset-0 z-40 bg-transparent"
          ></div>
          <div
            v-if="showFilterMenu"
            class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <button
              v-for="opt in filterMenuOptions"
              :key="opt.value"
              @click="applyFilter(opt.value)"
              class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group transition-colors"
            >
              <span
                :class="
                  activeFilterType === opt.value
                    ? 'font-semibold text-primary'
                    : ''
                "
                >{{ opt.label }}</span
              >
              <Check
                v-if="activeFilterType === opt.value"
                class="w-3.5 h-3.5 text-primary"
              />
            </button>
          </div>
        </div>

        <button
          @click="refreshData"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Muat Ulang"
        >
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': pending }" />
        </button>

        <template v-if="selectedIds.size > 0">
          <div
            class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"
          ></div>
          <div
            class="flex items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200"
          >
            <button
              @click="confirmAction('delete')"
              class="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-error rounded transition-colors"
              title="Hapus"
            >
              <Trash2 class="w-4 h-4" />
            </button>
            <button
              @click="confirmAction('archive')"
              class="p-1.5 text-primary dark:text-primary-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-primary rounded hidden sm:block transition-colors"
              title="Arsipkan"
            >
              <Archive class="w-4 h-4" />
            </button>
            <button
              @click="openLabelAssignModal"
              class="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary rounded transition-colors"
              title="Label"
            >
              <Tag class="w-4 h-4" />
            </button>
            <span class="text-xs text-neutral-500 dark:text-gray-400 ms-2"
              >{{ selectedIds.size }} dipilih</span
            >
          </div>
        </template>
      </div>

      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">
        <div class="relative">
          <button
            @click="showDateMenu = !showDateMenu"
            title="Periode Data"
            class="flex items-center gap-1 p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative"
          >
            <History class="w-4 h-4 shrink-0" />
            <span
              v-if="activeDateLabel !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-800"
            ></span>
          </button>
          <div
            v-if="showDateMenu"
            @click="showDateMenu = false"
            class="fixed inset-0 z-40 bg-transparent"
          ></div>

          <div
            v-if="showDateMenu"
            class="absolute top-full right-0 mt-1 w-[480px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex"
          >
            <div
              class="w-7/12 p-4 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30"
            >
              <div
                class="text-[13px] font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center justify-between"
              >
                <span>Pilih Tanggal</span>
                <Check v-if="isCustomDate" class="w-3.5 h-3.5 text-primary" />
              </div>

              <div class="space-y-4">
                <div>
                  <label
                    class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5"
                    >Mulai Tanggal</label
                  >
                  <ClientOnly>
                    <UPopover
                      v-model:open="openStart"
                      :content="{ placement: 'bottom-start' }"
                    >
                      <UButton
                        color="white"
                        variant="outline"
                        block
                        class="justify-start"
                      >
                        <div class="flex items-center gap-2 w-full">
                          <span
                            class="flex-1 text-left text-sm text-gray-700 dark:text-gray-200"
                          >
                            {{
                              startDate
                                ? startDate.toLocaleDateString("id-ID")
                                : "Pilih tanggal"
                            }}
                          </span>
                          <CalendarIcon
                            class="w-4 h-4 text-gray-400 shrink-0"
                          />
                        </div>
                      </UButton>
                      <template #panel>
                        <div class="p-2">
                          <UCalendar
                            v-model="startDate"
                            @close="openStart = false"
                          />
                        </div>
                      </template>
                    </UPopover>
                  </ClientOnly>
                </div>

                <div>
                  <label
                    class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5"
                    >Sampai Tanggal</label
                  >
                  <ClientOnly>
                    <UPopover
                      v-model:open="openEnd"
                      :content="{ placement: 'bottom-start' }"
                    >
                      <UButton
                        color="white"
                        variant="outline"
                        block
                        class="justify-start"
                      >
                        <div class="flex items-center gap-2 w-full">
                          <span
                            class="flex-1 text-left text-sm text-gray-700 dark:text-gray-200"
                          >
                            {{
                              endDate
                                ? endDate.toLocaleDateString("id-ID")
                                : "Pilih tanggal"
                            }}
                          </span>
                          <CalendarIcon
                            class="w-4 h-4 text-gray-400 shrink-0"
                          />
                        </div>
                      </UButton>
                      <template #panel>
                        <div class="p-2">
                          <UCalendar
                            v-model="endDate"
                            @close="openEnd = false"
                          />
                        </div>
                      </template>
                    </UPopover>
                  </ClientOnly>
                </div>

                <button
                  @click="applyCustomDate"
                  class="w-full mt-2 bg-primary text-white text-[12px] font-medium py-2 rounded-md hover:bg-primary-600 transition-colors shadow-sm"
                >
                  Terapkan Range
                </button>
              </div>
            </div>

            <div class="w-5/12 py-2 overflow-y-auto max-h-[300px]">
              <div
                class="px-4 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
              >
                Preset
              </div>
              <button
                v-for="opt in dateOptions"
                :key="opt"
                @click="selectDateFilter(opt)"
                class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-primary flex items-center justify-between group transition-colors"
              >
                <span>{{ opt }}</span>
                <Check
                  v-if="activeDateLabel === opt && !isCustomDate"
                  class="w-3.5 h-3.5 text-primary"
                />
              </button>
            </div>
          </div>
        </div>

        <div class="relative">
          <button
            @click="showSortMenu = !showSortMenu"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
            title="Urutkan"
          >
            <ArrowUpDown class="w-4 h-4" />
          </button>
          <div
            v-if="showSortMenu"
            @click="showSortMenu = false"
            class="fixed inset-0 z-40 bg-transparent"
          ></div>
          <div
            v-if="showSortMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <button
              v-for="opt in sortOptions"
              :key="opt"
              @click="selectSortOption(opt)"
              class="w-full text-left px-3 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
            >
              <span>{{ opt }}</span>
              <Check
                v-if="activeSortLabel === opt"
                class="w-3 h-3 text-primary"
              />
            </button>
          </div>
        </div>

        <button
          @click="downloadExcel"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Download Excel"
        >
          <Download class="w-3.5 h-3.5" />
        </button>

        <div
          class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"
        ></div>

        <div class="flex items-center gap-1">
          <div class="relative">
            <button
              @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors flex items-center gap-1"
            >
              <Layers class="w-4 h-4" />
            </button>
            <div
              v-if="showPageMenu"
              @click="showPageMenu = false"
              class="fixed inset-0 z-40 bg-transparent"
            ></div>
            <div
              v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                v-for="size in pageOptions"
                :key="size"
                @click="selectPageSize(size)"
                class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors"
                :class="{
                  'text-primary font-semibold bg-gray-50 dark:bg-gray-700':
                    itemsPerPage === size,
                }"
              >
                {{ size }} Item
              </button>
            </div>
          </div>

          <div
            class="flex items-center gap-1 text-caption1 text-neutral-600 dark:text-gray-400 shrink-0 h-[34px]"
          >
            <span
              class="mx-1 font-medium hidden sm:inline whitespace-nowrap text-[12px] text-neutral-500 dark:text-gray-400"
            >
              {{ paginationInfo }}
            </span>
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
              @click="prevPage"
              :disabled="currentPage === 1"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
              @click="nextPage"
              :disabled="currentPage === totalPages"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden relative w-full">
      <div
        class="flex flex-col bg-white dark:bg-gray-800 transition-all duration-300 border-r border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden flex-1 w-full"
      >
        <div
          class="py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 sticky top-0 z-10 w-full overflow-hidden"
        >
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full py-1">
            <UButton
              v-for="tab in tabs"
              :key="tab.value"
              @click="activeTab = tab.value"
              color="primary"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 first:ms-2 last:me-2"
              :class="
                activeTab === tab.value
                  ? 'bg-primary-400 text-white border-primary-400'
                  : 'bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 border-neutral-200/50 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30'
              "
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
              <span
                v-if="getTabCount(tab.value) > 0"
                class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                :class="
                  activeTab === tab.value
                    ? 'bg-white text-primary-500'
                    : 'bg-primary-50 text-primary-500 dark:bg-primary-900/50 dark:text-primary-300'
                "
              >
                {{ getTabCount(tab.value) }}
              </span>
            </UButton>
          </div>
        </div>

        <div
          v-if="items.length === 0 && !pending"
          class="flex flex-col items-center justify-center py-10 text-neutral-400 dark:text-gray-500 w-full"
        >
          <Inbox class="w-12 h-12 mb-2 opacity-50" />
          <span class="text-sm">Tidak ada data</span>
        </div>

        <div v-else class="w-full overflow-x-auto pb-2">
          <div class="w-full min-w-full md:min-w-[800px]">
            <div v-if="pending" class="w-full">
              <div
                v-for="n in 10"
                :key="n"
                class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 items-center w-full min-h-[50px]"
              >
                <div class="flex items-center shrink-0 gap-2 w-full md:w-auto">
                  <div
                    class="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  ></div>
                  <div
                    class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                  ></div>
                  <div
                    class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                  ></div>
                  <div
                    class="md:hidden h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ml-2"
                  ></div>
                </div>

                <div
                  class="flex-1 w-full flex flex-col md:flex-row md:items-center md:gap-4"
                >
                  <div
                    class="md:w-44 lg:w-52 shrink-0 flex flex-col gap-1.5 mb-1 md:mb-0"
                  >
                    <div
                      class="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    ></div>
                    <div
                      class="h-2.5 w-1/2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
                    ></div>
                  </div>
                  <div class="flex-1 flex flex-wrap items-center gap-2 w-full">
                    <div
                      class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    ></div>
                    <div
                      class="h-3 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    ></div>
                  </div>
                  <div class="hidden md:flex shrink-0 w-[50px] justify-start">
                    <div
                      class="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                    ></div>
                  </div>
                  <div
                    class="shrink-0 w-full md:w-[130px] md:text-right mt-1 md:mt-0"
                  >
                    <div
                      class="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse md:ml-auto"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="w-full">
              <div
                v-for="mail in items"
                :key="mail.id"
                @click="selectMail(mail)"
                class="group flex flex-col md:flex-row gap-3 items-start py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors relative w-full min-h-[50px]"
                :class="[
                  mail.is_priority
                    ? 'bg-red-50/60 dark:bg-red-900/20 hover:bg-red-100/60 dark:hover:bg-red-900/30 border-l-4 border-l-red-500 pl-3'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-l-transparent pl-4',
                ]"
              >
                <div
                  class="flex items-center shrink-0 pt-1 gap-2 w-full md:w-auto"
                  @click.stop
                >
                  <div
                    class="w-3.5 h-3.5 border-[1.5px] border-neutral-300 dark:border-gray-600 rounded-sm flex items-center justify-center transition-colors"
                    :class="
                      selectedIds.has(mail.id)
                        ? 'bg-primary border-primary'
                        : 'bg-white dark:bg-gray-800'
                    "
                    @click="toggleSelection(mail.id)"
                  >
                    <Check
                      v-if="selectedIds.has(mail.id)"
                      class="w-3 h-3 text-white"
                    />
                  </div>

                  <Star
                    class="w-4 h-4 transition-colors hover:text-yellow-400 cursor-pointer"
                    :class="
                      mail.isStarred
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-neutral-300 dark:text-gray-600'
                    "
                    @click.stop="handleToggleFlag(mail, 'favorit')"
                  />

                  <Tag
                    class="w-4 h-4 -rotate-45 transition-colors hover:text-primary-300 cursor-pointer"
                    :class="
                      mail.isTinjut
                        ? 'text-primary-500 fill-primary-500'
                        : 'text-neutral-300 dark:text-gray-600'
                    "
                    @click.stop="handleToggleFlag(mail, 'tindak_lanjut')"
                  />

                  <span
                    class="md:hidden ml-auto sm:ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    :class="getCategoryStyle(mail.category)"
                  >
                    {{ getCategoryLabel(mail.category) }}
                  </span>
                </div>

                <div
                  class="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-4 w-full"
                >
                  <div
                    class="flex items-center md:w-44 lg:w-65 shrink-0 mb-1 md:mb-0"
                  >
                    <div
                      v-if="!mail.isRead"
                      class="w-2 h-2 rounded-full bg-blue-600 shrink-0 mr-2"
                      title="Belum Dibaca"
                    ></div>

                    <div class="flex flex-col min-w-0">
                      <UTooltip
                        :text="mail.fullRecipients"
                        :ui="{
                          content: 'h-auto py-2 px-3',
                          text: 'whitespace-pre-line text-left',
                        }"
                        class="min-w-0 truncate"
                      >
                        <span
                          class="block w-full md:w-48 xl:w-64 truncate text-[13px] text-neutral-900 dark:text-white shrink-0 font-semibold cursor-help"
                        >
                          {{ mail.from }}
                        </span>
                      </UTooltip>

                      <div
                        class="text-[11px] text-neutral-400 dark:text-gray-500 flex items-center gap-2 mt-0.5"
                      >
                        <span class="truncate">{{ mail.nomor }}</span>

                        <span
                          v-if="mail.is_priority"
                          @click.stop="handleUnsetPriority(mail)"
                          class="flex items-center gap-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <AlertTriangle class="w-3 h-3" />
                          PRIORITAS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0"
                  >
                    <div
                      v-if="mail.labels && mail.labels.length > 0"
                      class="flex flex-wrap gap-1 shrink-0"
                    >
                      <span
                        v-for="lbl in mail.labels"
                        :key="lbl"
                        :title="lbl"
                        class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 max-w-[80px] truncate cursor-help"
                      >
                        {{ lbl }}
                      </span>
                    </div>
                    <div
                      class="text-[13px] text-neutral-900 dark:text-white truncate flex-1 min-w-[120px]"
                      :class="!mail.isRead ? 'font-bold' : 'font-normal'"
                    >
                      {{ mail.subject }}
                    </div>
                  </div>

                  <div
                    class="hidden md:flex shrink-0 w-[50px] justify-start items-center"
                  >
                    <span
                      class="w-32 block text-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap truncate"
                      :class="getCategoryStyle(mail.category)"
                    >
                      {{ getCategoryLabel(mail.category) }}
                    </span>
                  </div>

                  <div
                    class="shrink-0 pt-0.5 w-full md:w-[130px] md:text-right text-left md:pe-2 mt-1 md:mt-0"
                  >
                    <span
                      class="text-caption2b text-neutral-500 dark:text-gray-400 text-[12px] whitespace-nowrap"
                    >
                      {{ formatShortDate(mail.raw?.created_at) }}
                    </span>
                  </div>
                </div>

                <div
                  class="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 rounded-md px-2 py-1.5 z-10 animate-in fade-in duration-200"
                >
                  <div class="flex items-center gap-2 p-1">
                    <StickyNote
                      class="w-4 h-4 transition-colors hover:text-orange-500 cursor-pointer"
                      :class="
                        mail.isNote
                          ? 'text-orange-600 fill-orange-100'
                          : 'text-neutral-300 dark:text-gray-600'
                      "
                      @click.stop="handleToggleFlag(mail, 'note')"
                    />

                    <Lock
                      v-if="mail.isLocked"
                      class="w-4 h-4 transition-colors text-red-600 fill-red-100 hover:text-red-600 cursor-pointer"
                      @click.stop="handleToggleFlag(mail, 'lock')"
                    />

                    <LockOpen
                      v-else
                      class="w-4 h-4 transition-colors text-neutral-300 dark:text-gray-600 hover:text-red-500 cursor-pointer"
                      @click.stop="handleToggleFlag(mail, 'lock')"
                    />

                    <Archive
                      class="w-4 h-4 transition-colors hover:text-green-600 cursor-pointer"
                      :class="
                        mail.isArsip
                          ? 'text-green-700 fill-green-100'
                          : 'text-neutral-300 dark:text-gray-600'
                      "
                      @click.stop="handleToggleFlag(mail, 'arsip')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LabelAssignModal
      v-model="showLabelAssignModal"
      :selected-ids="selectedIds"
      source="inbox"
      @assign="assignLabelToSelected"
      @success="selectedIds.clear()"
    />

    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800 transition-colors"
        >
          <div class="p-5 text-center">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              :class="
                currentBulkAction === 'delete'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-blue-100 dark:bg-blue-900/30'
              "
            >
              <AlertTriangle
                class="w-6 h-6"
                :class="
                  currentBulkAction === 'delete'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
                "
              />
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {{ modalTitle }}
            </h3>
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <div v-if="selectedIds.size === 1 && firstSelectedItem">
                Apakah Anda yakin ingin {{ actionLabel.toLowerCase() }} <br />
                <span class="font-semibold text-gray-700 dark:text-gray-200"
                  >"{{ firstSelectedItem.subject }}"</span
                >?
              </div>
              <div v-else>
                Apakah Anda yakin ingin {{ actionLabel.toLowerCase() }} <br />
                <span class="font-bold text-gray-800 dark:text-gray-200"
                  >{{ selectedIds.size }} item terpilih</span
                >?
              </div>
            </div>
            <div class="flex gap-3 justify-center">
              <button
                @click="showDeleteModal = false"
                :disabled="isDeleting"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                @click="handleBulkExecute"
                :disabled="isDeleting"
                class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="
                  currentBulkAction === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-primary hover:bg-primary-600'
                "
              >
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
