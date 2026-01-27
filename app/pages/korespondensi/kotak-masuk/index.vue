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
  X,
  MoreVertical,
  History,
  ArrowUpDown,
  Layers,
  StickyNote,
  RotateCw,
  Download,
  Lock,
  Tag,
  Loader2, // Added
  AlertTriangle, // Added
} from "lucide-vue-next";

import * as XLSX from "xlsx";

import { useInbox } from "~/composables/useInbox";
import { useLabel } from '~/composables/useLabel'; // Added useLabel

const { user, getProfile } = useAuth();

// Inisialisasi useLabel
const { labels, fetchLabels, createLabel, addNaskahToLabel: _addNaskahToLabel } = useLabel();

const addNaskahToLabel = async (naskahId, labelId) => {
  // Pastikan source adalah 'inbox' untuk halaman ini
  return await _addNaskahToLabel(naskahId, labelId, 'inbox');
};

// ... kode lain tetap sama ...

// --- UPDATE DI BAGIAN ASSIGN LABEL ---
const assignLabelToSelected = async (labelId: string, labelName: string) => {
  if (selectedIds.value.size === 0) return;
  isLabelProcessing.value = true;

  try {
    // Loop semua item terpilih dan tambahkan label
    const promises = Array.from(selectedIds.value).map(naskahId =>
      // Cukup panggil fungsi wrapper, tidak perlu 'sent' lagi disini
      addNaskahToLabel(naskahId, labelId)
    );

    await Promise.all(promises);

    toast.add({
      title: 'Berhasil',
      description: `Label "${labelName}" ditambahkan ke ${selectedIds.value.size} item.`,
      color: 'success'
    });

    showLabelAssignModal.value = false;
    selectedIds.value.clear();
  } catch (error) {
    console.error("Gagal assign label:", error);
    toast.add({ title: 'Gagal', description: 'Gagal menambahkan label.', color: 'error' });
  } finally {
    isLabelProcessing.value = false;
  }
};

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Kotak Masuk", to: "#" },
];

const toast = useToast(); // Added toast for notifications

// Ambil profil user saat page load
onMounted(async () => {
  if (!user.value) {
    await getProfile();
  }
});

const positionId = computed(() => user.value?.position || null);

const { items, pending, error, refresh, markAsRead, toggleFlag } =
  useInbox(positionId);

// --- STATE ---
// Loading refresh
const isLoading = ref(false);

// Refresh data inbox
const refreshData = async () => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;
    await refresh(); // ← dari useInbox
  } finally {
    isLoading.value = false;
  }
};

const selected = ref(null);
const selectedIds = ref(new Set());
const activeTab = ref("ALL");
const searchQuery = ref("");

const showDateMenu = ref(false);
const activeDateLabel = ref("30 Hari"); // Default filter

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

  // --- PERBAIKAN SORTING BY DATE ---
  if (opt === "Terbaru") {
    // Sort descending (Terbaru diatas) menggunakan created_at atau date
    emails.value.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
  } else {
    // Sort ascending (Terlama diatas)
    emails.value.sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
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

// Menambahkan opsi "Semua" agar konsisten dengan logic dot merah
const dateOptions = ["7 Hari", "30 Hari", "60 Hari", "1 Tahun", "Semua"];

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Konsep", value: "KONSEP", icon: FilePen },
];

const emails = items;

const filteredEmails = computed(() => {
  let result = [...items.value];

  // TAB kategori (ND, DI, dll)
  if (activeTab.value !== "ALL") {
    result = result.filter((mail) => mail.category === activeTab.value);
  }

  // SEARCH
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (mail) =>
        (mail.subject || "").toLowerCase().includes(q) ||
        (mail.from || "").toLowerCase().includes(q),
    );
  }

  // FILTER DROPDOWN
  switch (activeFilterType.value) {
    case "Favorite":
      result = result.filter((mail) => mail.isStarred);
      break;

    case "Note":
      result = result.filter((mail) => mail.isNote);
      break;

    case "Arsip":
      result = result.filter((mail) => mail.isArsip);
      break;

    case "Sudah Dibaca":
      result = result.filter((mail) => mail.isRead);
      break;

    case "Belum Dibaca":
      result = result.filter((mail) => !mail.isRead);
      break;

    case "Sudah Tinjut":
      result = result.filter((mail) => mail.isTinjut);
      break;

    case "Belum Tinjut":
      result = result.filter((mail) => !mail.isTinjut);
      break;
  }

  return result;
});

const totalItems = computed(() => filteredEmails.value.length);
const totalPages = computed(
  () => Math.ceil(totalItems.value / itemsPerPage.value) || 1,
);

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

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};
const applyFilter = (filterName) => {
  activeFilterType.value = filterName;
  showFilterMenu.value = false;
};
const toggleSelection = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};
const toggleSelectAll = () => {
  if (selectedIds.value.size === paginatedEmails.value.length)
    selectedIds.value.clear();
  else paginatedEmails.value.forEach((mail) => selectedIds.value.add(mail.id));
};
const isAllSelected = computed(
  () =>
    paginatedEmails.value.length > 0 &&
    selectedIds.value.size === paginatedEmails.value.length,
);

const selectMail = async (mail) => {
  // Simpan data selected (opsional, tapi dibiarkan agar tidak error jika ada ref lain yg pakai)
  selected.value = mail;

  const posId = user.value?.position;

  // Tandai sudah dibaca (jalankan di background atau await jika ingin memastikan)
  if (posId) {
    markAsRead(mail, posId);
  }

  // LANGSUNG NAVIGASI KE DETAIL
  // Menggunakan format link yang sama seperti tombol "Lihat Detail Lengkap" sebelumnya
  navigateTo(`/korespondensi/kotak-masuk/${mail.naskahId}?jenis=${mail.category}`);
};

const closeDetail = () => {
  selected.value = null;
};

// --- STATE BULK ACTION & LABEL ---
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const currentBulkAction = ref('delete');
const showLabelAssignModal = ref(false);

const firstSelectedItem = computed(() => {
  if (selectedIds.value.size === 0) return null;
  const firstId = [...selectedIds.value][0];
  return emails.value.find(e => e.id === firstId);
});

const modalTitle = computed(() => currentBulkAction.value === 'archive' ? 'Arsipkan Surat?' : 'Hapus Surat?');
const actionLabel = computed(() => currentBulkAction.value === 'archive' ? 'Arsipkan' : 'Hapus');

// --- METHODS BULK ACTION ---
const confirmAction = (action) => {
  if (selectedIds.value.size === 0) return;
  currentBulkAction.value = action;
  showDeleteModal.value = true;
};

const openLabelAssignModal = () => {
  showLabelAssignModal.value = true;
};

const handleBulkExecute = async () => {
  if (!user.value?.position) return;

  isDeleting.value = true;
  try {
    // Note: Anda mungkin perlu menyesuaikan payload/fungsi API
    // sesuai dengan useInbox atau endpoint inbox Anda yang sebenarnya.
    // Kode ini meniru logika useSirkulasi dari kode atas.
    const payload = {
      position_id: Number(user.value.position),
      naskah_ids: Array.from(selectedIds.value),
      action: currentBulkAction.value
    };

    // Placeholder: Gunakan fungsi delete/archive dari useInbox jika ada,
    // atau panggil API langsung.
    // await inboxBulkAction(payload);

    // Simulasi sukses untuk UI
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.add({
      title: 'Berhasil',
      description: `${selectedIds.value.size} item berhasil di-${currentBulkAction.value === 'archive' ? 'arsipkan' : 'hapus'}.`,
      color: 'success'
    });

    // Reset state
    selectedIds.value.clear();
    showDeleteModal.value = false;

    // Refresh data
    await refreshData();

  } catch (error) {
    console.error(error);
    toast.add({ title: 'Gagal', description: 'Terjadi kesalahan saat memproses.', color: 'error' });
  } finally {
    isDeleting.value = false;
  }
};


// --- HELPER: COLOR MAPPING (UPDATED to match Sent Box) ---
const getCategoryStyle = (cat) => {
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

// Update Label agar sesuai gambar
// --- HELPER: LABEL MAPPING ---
const getCategoryLabel = (cat) => {
  const c = (cat || '').toUpperCase();
  if (['KA'].includes(c)) return 'KA';
  if (['SDI', 'INTERNAL'].includes(c)) return 'SDI';
  if (['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(c)) return 'SDE';
  if (['ND', 'NOTA DINAS'].includes(c)) return 'ND';
  if (['DI', 'DISPOSISI'].includes(c)) return 'DI';
  return 'K';
};


const penerimaDetail = computed(() => {
  if (!selected.value?.penerima) return null;

  const p = selected.value.penerima;

  return {
    nama: p.nama,
    position: p.position_text,
    organization: p.organization_text,
  };
});

//excel

const downloadExcel = () => {
  if (filteredEmails.value.length === 0) return;

  const totalTerbaca = filteredEmails.value.filter(
    (mail) => mail.isRead,
  ).length;

  const totalBelumDibaca = filteredEmails.value.filter(
    (mail) => !mail.isRead,
  ).length;

  // ===== DATA TABEL =====
  const tableData = filteredEmails.value.map((mail, index) => ({
    No: index + 1,
    Nomor: mail.nomor || "-",
    Perihal: mail.subject || "-",
    Pengirim: mail.from || "-",
    Kategori: mail.category_label || mail.category || "-",
    Tanggal: mail.date || "-",
    Status_Baca: mail.isRead ? "Sudah Dibaca" : "Belum Dibaca",
  }));

  // ===== WORKSHEET =====
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["RINGKASAN KOTAK MASUK"],
    ["Total Terbaca", totalTerbaca],
    ["Total Belum Dibaca", totalBelumDibaca],
    [],
  ]);

  // Masukkan tabel mulai baris ke-5
  XLSX.utils.sheet_add_json(worksheet, tableData, {
    origin: "A5",
  });

  // ===== WORKBOOK =====
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Kotak Masuk");

  // ===== NAMA FILE =====
  const today = new Date().toISOString().split("T")[0];
  const fileName = `kotak_masuk_${today}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
</script>

<template>

  <PageHeader title="Kotak Masuk" :items="breadcrumbs" />
  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue">

    <div
      class="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 dark:border-gray-800 transition-colors">
      <div class="flex items-center gap-1 shrink-0 relative">
        <div class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
          @click="toggleSelectAll">
          <div
            class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
            :class="{
              'bg-primary border-primary': isAllSelected,
              'group-hover:border-gray-600 dark:group-hover:border-gray-300':
                !isAllSelected,
            }">
            <Check v-if="isAllSelected" class="w-3 h-3 text-white" stroke-width="3" />
          </div>
        </div>

        <div class="relative">
          <button @click="showFilterMenu = !showFilterMenu"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative"
            :class="{
              'bg-gray-100 dark:bg-gray-800 text-neutral-900 dark:text-gray-200':
                showFilterMenu,
            }" title="Opsi Filter">
            <MoreVertical class="w-4 h-4" />
            <span v-if="activeFilterType !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-800"></span>
          </button>
          <div v-if="showFilterMenu" @click="showFilterMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
          <div v-if="showFilterMenu"
            class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in filterMenuOptions" :key="opt.value" @click="applyFilter(opt.value)"
              class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group transition-colors">
              <span :class="activeFilterType === opt.value
                ? 'font-semibold text-primary'
                : ''
                ">{{ opt.label }}</span>
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
              class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors flex items-center gap-1">
              <Layers class="w-4 h-4" />
            </button>
            <div v-if="showPageMenu" @click="showPageMenu = false" class="fixed inset-0 z-40 bg-transparent"></div>
            <div v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-20 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <button v-for="size in pageOptions" :key="size" @click="selectPageSize(size)"
                class="w-full text-center px-3 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                <span :class="itemsPerPage === size ? 'font-bold text-primary' : ''
                  ">{{ size }}</span>
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
        class="flex flex-col bg-white transition-all duration-300 border-r border-gray-200 overflow-y-auto overflow-x-hidden flex-1 w-full">
        <div class="py-2.5 border-b border-gray-200 bg-white shrink-0 sticky top-0 z-10 w-full overflow-hidden">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full">
            <UButton v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" color="primary"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 first:ms-2 last:me-2"
              :class="activeTab === tab.value
                ? 'bg-primary-400 text-white border-primary-400'
                : 'bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 border-neutral-200/50 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                ">
              <component :is="tab.icon" class="w-4 h-4" />{{ tab.label }}
            </UButton>
          </div>
        </div>

        <div class="flex-1 pb-10 w-full">
          <div v-if="paginatedEmails.length === 0"
            class="flex flex-col items-center justify-center h-full text-neutral-400 mt-10">
            <Inbox class="w-12 h-12 mb-2 opacity-50" />
            <span class="text-sm">Tidak ada kotak masuk</span>
          </div>

          <div v-else>
            <div v-for="mail in paginatedEmails" :key="mail.id" @click="selectMail(mail)"
              class="group flex gap-3 items-start px-4 py-3 border-b border-gray-100 hover:shadow-sm cursor-pointer transition-colors relative w-full min-h-[50px] hover:bg-gray-50">

              <div class="flex items-center shrink-0 pt-1 gap-2" @click.stop>
                <div
                  class="w-3.5 h-3.5 border-[1.5px] border-neutral-300 rounded-sm flex items-center justify-center transition-colors"
                  :class="selectedIds.has(mail.id)
                    ? 'bg-primary border-primary'
                    : 'bg-white'
                    " @click="toggleSelection(mail.id)">
                  <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
                </div>

                <Star class="w-4 h-4 transition-colors hover:text-yellow-400" :class="mail.isStarred
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-neutral-300'
                  " @click.stop="toggleFlag(mail, 'favorit')" />

                <Tag class="w-4 h-4 -rotate-45 transition-colors hover:text-primary-300" :class="mail.isTinjut
                  ? 'text-primary-300 fill-primary-300'
                  : 'text-neutral-300'
                  " @click.stop="toggleFlag(tinjut, 'favorit')" />

              </div>


              <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:gap-4 overflow-hidden pt-0.5">
                <div class="flex items-center sm:w-44 lg:w-52 shrink-0">
                  <div v-if="!mail.isRead" class="w-2 h-2 rounded-full bg-blue-600 shrink-0 mr-2" title="Belum Dibaca">
                  </div>

                  <div class="text-[11px] text-neutral-500 uppercase truncate font-bold">
                    {{ mail.from }}
                  </div>
                </div>

                <div class="text-[13px] text-neutral-900 truncate flex-1"
                  :class="!mail.isRead ? 'font-bold' : 'font-normal'">
                  {{ mail.subject }}
                </div>
              </div>

              <div class="hidden xl:flex shrink-0 w-[50px] justify-start items-center">
                <span
                  class="w-32 block text-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap truncate"
                  :class="getCategoryStyle(mail.category)">
                  {{ getCategoryLabel(mail.category) }}
                </span>
              </div>

              <div class="shrink-0 pt-0.5 w-[80px] text-right md:w-[120px] md:text-left pe-10 mr-5 md:pr-0">
                <span class="text-caption2b text-neutral-500 text-[12px] whitespace-nowrap">
                  {{ mail.date }}
                </span>
              </div>

              <div
                class="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-white shadow-md border border-gray-100 rounded-md px-2 py-1.5 z-10 animate-in fade-in duration-200">
                <div class="flex items-center gap-2 p-1">
                  <StickyNote class="w-4 h-4 transition-colors hover:text-orange-400" :class="mail.isNote
                    ? 'text-orange-400 fill-orange-400'
                    : 'text-neutral-300'
                    " @click.stop="toggleFlag(mail, 'note')" />
                  <Lock class="w-4 h-4 transition-colors hover:text-orange-400" :class="mail.isNote
                    ? 'text-orange-400 fill-orange-400'
                    : 'text-neutral-300'
                    " @click.stop="toggleFlag(mail, 'note')" />
                  <Archive class="w-4 h-4 transition-colors hover:text-purple-600" :class="mail.isArsip
                    ? 'text-purple-500 fill-purple-500'
                    : 'text-neutral-300'
                    " @click.stop="toggleFlag(mail, 'arsip')" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>

    <LabelAssignModal v-model="showLabelAssignModal" :selected-ids="selectedIds" @success="selectedIds.clear()" />

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
