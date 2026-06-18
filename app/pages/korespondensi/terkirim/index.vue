<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { parseDate, getLocalTimeZone, today } from '@internationalized/date';
import {
  Inbox, FileText, Send, Building, Building2, FilePen, Archive, Trash2,
  ChevronLeft, ChevronRight, Star, Check, MoreVertical, History,
  ArrowUpDown, Layers, StickyNote, RotateCw, Download, Lock, Tag,
  Loader2, AlertTriangle, BookOpen, Calendar as CalendarIcon, Eye, X,
} from "lucide-vue-next";
import * as XLSX from "xlsx";
import { useSirkulasi } from "~/composables/useTerkirim";
import { useLabel } from "~/composables/useLabel";
import { getCategoryStyle, getCategoryLabel } from "~/utils/mail-helpers";

definePageMeta({ middleware: "auth" });

// ── Auth & Toast ──────────────────────────────────────────────────────────────
const { user, getProfile } = useAuth();
const toast = useToast();

// ── Composables ───────────────────────────────────────────────────────────────
const { items, pagination, summary, isLoading: pending, fetchSentBox, bulkActionSent, toggleFlag } = useSirkulasi();
const { addNaskahToLabel: _addNaskahToLabel } = useLabel();

// ── UI State ──────────────────────────────────────────────────────────────────
const selected = ref(null);
const selectedIds = ref(new Set());
const searchQuery = ref("");
const isLabelProcessing = ref(false);
const showLabelAssignModal = ref(false);

// ── Filter & Pagination ───────────────────────────────────────────────────────
const activeTab = ref("ALL");
const activeFilterType = ref("Semua");
const activeSortLabel = ref("Terbaru");
const activeDateLabel = ref("Semua");
const itemsPerPage = ref(10);
const currentPage = ref(1);

// ── Dropdown Visibility ───────────────────────────────────────────────────────
const showFilterMenu = ref(false);
const showSortMenu = ref(false);
const showPageMenu = ref(false);
const showDateMenu = ref(false);

// ── Date Range (Custom) ───────────────────────────────────────────────────────
const startDateInput = ref(new Date().toISOString().split('T')[0]);
const endDateInput = ref(new Date().toISOString().split('T')[0]);
const startDateCal = ref(parseDate(startDateInput.value));
const endDateCal = ref(parseDate(endDateInput.value));
const openStartDate = ref(false);
const openEndDate = ref(false);
const isCustomDate = computed(() => activeDateLabel.value === "Custom");

// Sync CalendarDate ↔ string YYYY-MM-DD
watch(startDateCal, (val) => { if (val) startDateInput.value = val.toString(); });
watch(endDateCal, (val) => { if (val) endDateInput.value = val.toString(); });

// ── Bulk Action Modal ─────────────────────────────────────────────────────────
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const currentBulkAction = ref("delete");

// ── Reader Modal ──────────────────────────────────────────────────────────────
const showReaderModal = ref(false);
const currentReaderData = ref({
  subject: "",
  category: "",        // ← TAMBAHKAN INI
  readList: [] as any[],
  unreadList: [] as any[],
  tembusanReadList: [] as any[],
  tembusanUnreadList: [] as any[],
});

// ── Static Config ─────────────────────────────────────────────────────────────
const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Terkirim", to: "#" },
];

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Konsep", value: "KO", icon: FilePen },
  { label: "Kajian", value: "KA", icon: BookOpen },
];

const filterMenuOptions = [
  { label: "Semua", value: "Semua" },
  { label: "Favorit", value: "Favorit" },
  { label: "Prioritas", value: "Prioritas" },
  { label: "Arsip", value: "Arsip" },
];

const dateOptions = ["7 Hari", "30 Hari", "60 Hari", "1 Tahun", "Semua"];
const sortOptions = ["Terbaru", "Terlama"];
const pageOptions = [10, 25, 50, 100];

// ── Helpers ─────────────────────────────────────────────────────────────────--
import { formatShortDate, getInitials } from "~/utils/mail-helpers";

const jenisAliasMap: Record<string, string[]> = {
  "ALL": [],
  "ND": ["ND", "nd", "Nota Dinas", "NOTA DINAS"],
  "DI": ["DI", "di", "Disposisi", "DISPOSISI"],
  "SDI": ["SDI", "sdi", "Internal", "INTERNAL"],
  "SDE": ["SDE", "sde", "External", "EXTERNAL", "Eksternal"],
  "KO": ["KO", "ko", "Konsep", "KONSEP"],
  "KA": ["KA", "ka", "Kajian", "KAJIAN"],
};

const getTabCount = (tabValue: string) => {
  if (!summary.value) return 0;
  if (tabValue === "ALL") return summary.value.total_semua || 0;
  const counts = summary.value.total_per_jenis || {};
  const aliases = jenisAliasMap[tabValue] || [tabValue];
  for (const alias of aliases) {
    if (counts[alias]) return counts[alias];
  }
  return 0;
};



// ── Core: Fetch Data ──────────────────────────────────────────────────────────
const refreshData = async () => {
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

    // Filter type → status_baca
    const filterMap: Record<string, Record<string, any>> = {
      "Arsip": { arsip: true },
      "Favorit": { favorite: true },
      "Prioritas": { priority: true },
    };
    Object.assign(params, filterMap[activeFilterType.value] || {});

    // Sort
    params.sort = activeSortLabel.value === "Terlama" ? "terlama" : "terbaru";

    // Date filter
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

    await fetchSentBox(params);
  } catch (err) {
    console.error("Gagal refresh data terkirim:", err);
  }
};

// ── Toggle Flag Favorit & Arsip (per-item) ────────────────────────────────────────────
const handleToggleFlag = async (mail: any, type: "favorit" | "arsip") => {
  try {
    const item = items.value.find((i) => i.id === mail.id);
    if (!item) return;

    // 1. Toggle secara optimistik di UI
    if (type === "favorit") item.isStarred = !item.isStarred;
    if (type === "arsip") item.isArchived = !item.isArchived;

    // 2. Tentukan status aktif sekarang
    const isNowActive = type === "favorit" ? item.isStarred : item.isArchived;

    const descMap = {
      favorit: ["Ditambahkan ke Favorit", "Dihapus dari Favorit"],
      arsip: ["Pesan diarsipkan", "Pesan dikembalikan dari arsip"],
    };

    toast.add({ title: "Berhasil", description: descMap[type][isNowActive ? 0 : 1], color: "success", timeout: 2000 });

    // 3. Hapus baris secara instan jika kita sedang di tab filter "Arsip"
    //    dan item di-unarchive, ATAU kita di "Semua" tapi item di-archive
    if (type === "arsip") {
      const filterIsArsip = activeFilterType.value === "Arsip";
      if ((!filterIsArsip && isNowActive) || (filterIsArsip && !isNowActive)) {
        items.value = items.value.filter((i) => i.id !== mail.id);
      }
    }

    // 4. Hit API via composable
    await toggleFlag(item, type);
  } catch {
    toast.add({ title: "Gagal", description: "Gagal memperbarui status.", color: "error" });
    refreshData();
  }
};

// ── Label ─────────────────────────────────────────────────────────────────────
const addNaskahToLabel = async (naskahId: string, labelId: string) =>
  await _addNaskahToLabel(naskahId, labelId, "inbox");

const assignLabelToSelected = async (labelId: string, labelName: string) => {
  if (selectedIds.value.size === 0) return;
  isLabelProcessing.value = true;
  try {
    const promises = Array.from(selectedIds.value).map((selectedId) => {
      const mailItem = items.value.find((e) => e.id === selectedId);
      return addNaskahToLabel(mailItem?.naskahId || selectedId, labelId);
    });
    await Promise.all(promises);
    toast.add({ title: "Berhasil", description: `Label "${labelName}" ditambahkan.`, color: "success" });
    showLabelAssignModal.value = false;
    selectedIds.value.clear();
    refreshData();
  } catch {
    toast.add({ title: "Gagal", description: "Gagal menambahkan label.", color: "error" });
  } finally {
    isLabelProcessing.value = false;
  }
};

// ── Reader Modal ──────────────────────────────────────────────────────────────
const openReaderModal = (mail: any) => {
  const item = mail.originalData || mail;
  const penerimaList = item.penerima || [];
  const tembusanList = item.tembusan || [];

  const mapPenerima = (p: any, isRead: boolean) => ({
    name: p.nama,
    position: p.position_text || p.jabatan,
    initial: p.nama?.substring(0, 1) || "?",
    bg: isRead ? "bg-primary-500" : "bg-gray-400",
    ...(isRead ? {
      date: p.read_time
        ? `${new Date(p.read_time).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} ${new Date(p.read_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
        : "-",
    } : {}),
  });

  currentReaderData.value = {
    subject: item.perihal || item.subject,
    category: (mail.category || '').toUpperCase(),
    readList: penerimaList.filter((p: any) => p.status_baca === "terbaca").map((p: any) => mapPenerima(p, true)),
    unreadList: penerimaList.filter((p: any) => p.status_baca !== "terbaca").map((p: any) => mapPenerima(p, false)),
    tembusanReadList: tembusanList.filter((p: any) => p.status_baca === "terbaca").map((p: any) => mapPenerima(p, true)),
    tembusanUnreadList: tembusanList.filter((p: any) => p.status_baca !== "terbaca").map((p: any) => mapPenerima(p, false)),
  };
  showReaderModal.value = true;
};

// ── Selection ─────────────────────────────────────────────────────────────────
const toggleSelectAll = () => {
  if (isAllSelected.value) selectedIds.value.clear();
  else items.value.forEach((mail) => selectedIds.value.add(mail.id));
};

const toggleSelection = (id: string) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};

const selectMail = (mail: any) => {
  selected.value = mail;
  navigateTo(`/korespondensi/terkirim/${mail.naskahId}?jenis=${mail.category}`);
};

// ── Bulk Action ───────────────────────────────────────────────────────────────
const confirmAction = (action: string) => {
  if (selectedIds.value.size === 0) return;
  currentBulkAction.value = action;
  showDeleteModal.value = true;
};

const handleBulkExecute = async () => {
  isDeleting.value = true;
  try {
    if (currentBulkAction.value === 'archive') {
      const mailItems = Array.from(selectedIds.value)
        .map((selectedId) => items.value.find((e) => e.id === selectedId))
        .filter((mailItem): mailItem is NonNullable<typeof mailItem> => !!mailItem);

      // Cek dulu semua id_sirkulasi tersedia sebelum lanjut
      const missing = mailItems.filter((m) => !m.id_sirkulasi);
      if (missing.length > 0) {
        console.error('Item tanpa id_sirkulasi:', missing);
        toast.add({ title: 'Gagal', description: 'ID sirkulasi tidak ditemukan pada beberapa item.', color: 'error' });
        return;
      }

      // Optimistic toggle
      mailItems.forEach((m) => { m.isArchived = !isUnarchiveMode.value; });

      await Promise.all(mailItems.map((m) => toggleFlag(m, 'arsip')));

      toast.add({
        title: 'Berhasil',
        description: isUnarchiveMode.value
          ? `${mailItems.length} item berhasil dikeluarkan dari arsip.`
          : `${mailItems.length} item berhasil diarsipkan.`,
        color: 'success',
      });
    } else {
      if (!user.value?.position) return;
      await bulkActionSent({
        position_id: Number(user.value.position),
        naskah_ids: Array.from(selectedIds.value),
        action: 'delete',
      });
      toast.add({ title: 'Berhasil', description: 'Item berhasil dihapus.', color: 'success' });
    }

    selectedIds.value.clear();
    showDeleteModal.value = false;
    await refreshData();
  } catch (err) {
    console.error('handleBulkExecute error:', err); // ← lihat error aslinya di sini
    toast.add({ title: 'Gagal', description: 'Terjadi kesalahan saat memproses.', color: 'error' });
  } finally {
    isDeleting.value = false;
  }
};

// ── Filter / Sort / Pagination UI Actions ─────────────────────────────────────
const applyFilter = (v: string) => {
  activeFilterType.value = v;
  showFilterMenu.value = false;
  currentPage.value = 1;
  // watch activeFilterType akan auto-trigger refreshData()
};
const selectSortOption = (v: string) => { activeSortLabel.value = v; showSortMenu.value = false; currentPage.value = 1; refreshData(); };
const selectPageSize = (v: number) => { itemsPerPage.value = v; showPageMenu.value = false; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const openLabelAssignModal = () => { showLabelAssignModal.value = true; };

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

// ── Excel Export ──────────────────────────────────────────────────────────────
const downloadExcel = async () => {
  try {
    // Fetch semua data tanpa pagination — kirim limit besar, tanpa filter halaman
    const exportParams: Record<string, any> = {
      page: 1,
      limit: 9999,
    };

    // Tetap terapkan filter jenis/tab agar kontekstual dengan tab aktif
    // tapi TIDAK filter pagination, date, sort — export semua
    // Hapus baris ini jika ingin export benar-benar semua tanpa filter tab:
    if (activeTab.value !== "ALL" && activeTab.value !== "Semua") {
      exportParams.jenis = activeTab.value;
    }

    // Jalankan fetch sementara ke instance terpisah agar tidak ganggu state utama
    const { apiGet } = useApi();
    const query = new URLSearchParams();
    query.append('page', '1');
    query.append('limit', '9999');
    if (exportParams.jenis) query.append('jenis', exportParams.jenis);

    const res = await apiGet(`/naskah_sirkulasi/sent/?${query.toString()}`);
    const responseBody = res?.data?.pagination ? res.data : res;
    const allData: any[] = Array.isArray(responseBody?.data) ? responseBody.data : [];

    if (allData.length === 0) {
      toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diekspor', color: 'warning' });
      return;
    }

    const tableData = allData.map((item: any, i: number) => {
      const listPenerima = item.penerima || [];
      const isSDE = ['SDE', 'EXTERNAL', 'EKSTERNAL'].includes((item.jenis || '').toUpperCase());
      const penerimaText = listPenerima
        .map((p: any) => isSDE ? p.nama : (p.position_text || p.nama))
        .join('; ');

      const tembusanText = (item.tembusan || [])
        .map((p: any) => p.position_text || p.nama)
        .join('; ');

      return {
        No: i + 1,
        Nomor: item.nomor || "-",
        Jenis: item.jenis_label || item.jenis || "-",
        Perihal: item.perihal || "-",
        Pengirim: item.pengirim?.nama || "-",
        Jabatan_Pengirim: item.pengirim?.position_text || "-",
        Penerima: penerimaText || "-",
        Tembusan: tembusanText || "-",
        Total_Pembaca: item.summary_baca?.total || 0,
        Sudah_Baca: item.summary_baca?.terbaca || 0,
        Belum_Baca: item.summary_baca?.belum_terbaca || 0,
        Sifat: item.sifat || "-",
        Status: item.status || "-",
        Tanggal: item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : "-",
        Dibuat: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-",
      };
    });

    const ws = XLSX.utils.json_to_sheet(tableData);

    // Auto-width kolom
    const colWidths = Object.keys(tableData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...tableData.map(row => String(row[key] || '').length).slice(0, 50))
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Terkirim");
    XLSX.writeFile(wb, `terkirim_semua_${new Date().toISOString().split("T")[0]}.xlsx`);

    toast.add({ title: 'Berhasil', description: `${allData.length} data berhasil diekspor`, color: 'success' });
  } catch (err) {
    console.error('Export error:', err);
    toast.add({ title: 'Gagal', description: 'Terjadi kesalahan saat mengekspor data', color: 'error' });
  }
};

// ── Computed ──────────────────────────────────────────────────────────────────
const totalPages = computed(() => pagination.value.totalPages);
const isAllSelected = computed(() => items.value.length > 0 && selectedIds.value.size === items.value.length);
const firstSelectedItem = computed(() => {
  if (selectedIds.value.size === 0) return null;
  return items.value.find((e) => e.id === [...selectedIds.value][0]);
});
const modalTitle = computed(() => {
  if (currentBulkAction.value === 'archive') {
    return isUnarchiveMode.value ? 'Keluarkan dari Arsip?' : 'Arsipkan Surat?';
  }
  return 'Hapus Surat?';
});

const actionLabel = computed(() => {
  if (currentBulkAction.value === 'archive') {
    return isUnarchiveMode.value ? 'Keluarkan' : 'Arsipkan';
  }
  return 'Hapus';
});
const paginationInfo = computed(() => {
  if (pagination.value.total === 0) return "0-0 Dari 0";
  const start = (pagination.value.page - 1) * pagination.value.limit + 1;
  const end = Math.min(start + pagination.value.limit - 1, pagination.value.total);
  return `${start}-${end} Dari ${pagination.value.total}`;
});
const isUnarchiveMode = computed(() => activeFilterType.value === 'Arsip');

// ── Watchers ──────────────────────────────────────────────────────────────────
// Tab berubah → reset ke halaman 1
watch([activeTab, itemsPerPage, activeFilterType], () => {
  currentPage.value = 1;
  refreshData();
});

// currentPage berubah → refresh otomatis (pagination)
watch(currentPage, () => refreshData());

// Search dengan debounce 500ms
let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage.value = 1; refreshData(); }, 500);
});

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!user.value) await getProfile();
  await refreshData();
  /* log removed */
  /* log removed */
  /* log removed */
});
</script>

<template>
  <PageHeader title="Terkirim" :items="breadcrumbs" />
  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue">

    <!-- ── TOOLBAR ─────────────────────────────────────────────────────────── -->
    <div
      class="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors">

      <!-- LEFT: Checkbox + Filter + Refresh + Bulk Actions -->
      <div class="flex items-center gap-1 shrink-0 relative">

        <!-- Select All -->
        <div class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
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
            <!-- Dot indikator filter aktif -->
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

        <!-- Refresh -->
        <button @click="refreshData"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Muat Ulang">
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': pending }" />
        </button>

        <!-- Bulk Actions (muncul saat ada item dipilih) -->
        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block" />
          <div class="flex items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200">
            <button @click="confirmAction('delete')"
              class="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Hapus">
              <Trash2 class="w-4 h-4" />
            </button>
            <button @click="confirmAction('archive')"
              class="p-1.5 text-primary dark:text-primary-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded hidden sm:block transition-colors"
              title="Arsipkan">
              <Archive class="w-4 h-4" />
            </button>
            <button @click="openLabelAssignModal"
              class="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary rounded transition-colors"
              title="Label">
              <Tag class="w-4 h-4" />
            </button>
            <span class="text-xs text-neutral-500 dark:text-gray-400 ms-2">{{ selectedIds.size }} dipilih</span>
          </div>
        </template>
      </div>

      <!-- RIGHT: Date + Sort + Download + Pagination -->
      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">

        <!-- Date Filter -->
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
          <div v-if="showSortMenu" @click="showSortMenu = false" class="fixed inset-0 z-40 bg-transparent" />
          <div v-if="showSortMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in sortOptions" :key="opt" @click="selectSortOption(opt)"
              class="w-full text-left px-3 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors">
              <span>{{ opt }}</span>
              <Check v-if="activeSortLabel === opt" class="w-3 h-3 text-primary" />
            </button>
          </div>
        </div>

        <!-- Ganti @click="downloadExcel" -->
        <button @click="downloadExcel"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          title="Download Excel (Semua Data)">
          <Download class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

        <!-- Page Size + Pagination -->
        <div class="flex items-center gap-1">
          <div class="relative">
            <button @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors">
              <Layers class="w-4 h-4" />
            </button>
            <div v-if="showPageMenu" @click="showPageMenu = false" class="fixed inset-0 z-40 bg-transparent" />
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

    <!-- ── MAIN CONTENT ───────────────────────────────────────────────────── -->
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

        <div class="w-full overflow-x-auto pb-2">
          <div class="w-full min-w-full md:min-w-[800px]">

            <!-- Empty State -->
            <div v-if="items.length === 0 && !pending"
              class="flex flex-col items-center justify-center py-10 text-neutral-400 dark:text-gray-500 w-full">
              <Inbox class="w-12 h-12 mb-2 opacity-50" />
              <span class="text-sm">Tidak ada data</span>
            </div>

            <!-- Skeleton -->
            <div v-else-if="pending" class="w-full">
              <div v-for="n in Math.min(itemsPerPage, 10)" :key="n"
                class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3 items-center w-full min-h-[50px]">
                <div class="flex items-center shrink-0 gap-2 w-full md:w-auto">
                  <div class="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div class="md:hidden h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ml-2" />
                </div>
                <div class="flex-1 w-full flex flex-col md:flex-row md:items-center md:gap-4">
                  <div class="md:w-44 lg:w-52 shrink-0 flex flex-col gap-1.5 mb-1 md:mb-0">
                    <div class="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div class="h-2.5 w-1/2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                  <div class="flex-1 flex flex-wrap items-center gap-2 w-full">
                    <div class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div class="h-3 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div class="hidden md:flex shrink-0 w-[50px] justify-start">
                    <div class="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </div>
                  <div class="shrink-0 w-full md:w-[130px] md:text-right mt-1 md:mt-0">
                    <div class="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse md:ml-auto" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Mail Items -->
            <div v-else class="w-full">
              <div v-for="mail in items" :key="mail.id" @click="selectMail(mail)"
                v-memo="[mail.id, mail.isRead, mail.isStarred, mail.isTinjut, mail.is_priority, selectedIds.has(mail.id)]"
                class="group flex flex-col md:flex-row gap-3 items-start py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors relative w-full min-h-[50px]"
                :class="[
                  mail.is_priority
                    ? 'bg-red-50/60 dark:bg-red-900/20 hover:bg-red-100/60 dark:hover:bg-red-900/30 border-l-4 border-l-red-500 pl-3'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-l-transparent pl-4',
                ]">

                <!-- Left Controls -->
                <div class="flex items-center shrink-0 pt-1 gap-2 w-full md:w-auto" @click.stop>
                  <div
                    class="w-3.5 h-3.5 border-[1.5px] border-neutral-300 dark:border-gray-600 rounded-sm flex items-center justify-center transition-colors"
                    :class="selectedIds.has(mail.id) ? 'bg-primary border-primary' : 'bg-white dark:bg-gray-800'"
                    @click="toggleSelection(mail.id)">
                    <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
                  </div>

                  <!-- Favorit toggle -->
                  <Star class="w-4 h-4 transition-colors hover:text-yellow-400 cursor-pointer"
                    :class="mail.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300 dark:text-gray-600'"
                    @click.stop="handleToggleFlag(mail, 'favorit')" />

                  <!-- Badge kategori (mobile) -->
                  <span
                    class="md:hidden ml-auto sm:ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    :class="getCategoryStyle(mail.category)">
                    {{ getCategoryLabel(mail.category) }}
                  </span>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-4 w-full">
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
                      <div
                        class="text-[11px] font-mono text-neutral-400 dark:text-gray-500 flex items-center gap-2 truncate">
                        <span class="truncate">{{ mail.body }}</span>
                        <span v-if="mail.is_priority"
                          class="flex items-center gap-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border border-red-200 dark:border-red-800 shrink-0">
                          <AlertTriangle class="w-3 h-3" /> PRIORITAS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    <div v-if="mail.labels?.length > 0" class="flex flex-wrap gap-1 shrink-0">
                      <span v-for="lbl in mail.labels" :key="lbl" :title="lbl"
                        class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 max-w-[80px] truncate cursor-help">
                        {{ lbl }}
                      </span>
                    </div>
                    <div
                      class="text-[13px] text-neutral-900 dark:text-gray-100 truncate flex-1 min-w-[120px] font-normal">
                      {{ mail.subject }}
                    </div>
                  </div>

                  <!-- Badge kategori (desktop) -->
                  <div class="hidden md:flex shrink-0 w-[50px] justify-start items-center">
                    <span
                      class="w-32 block text-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap truncate"
                      :class="getCategoryStyle(mail.category)">
                      {{ getCategoryLabel(mail.category) }}
                    </span>
                  </div>

                  <div
                    class="shrink-0 w-full md:w-[160px] flex flex-row items-center justify-between md:justify-end gap-3 mt-1 md:mt-0 pt-0.5">
                    <span
                      class="text-caption2b text-neutral-500 dark:text-gray-400 text-[12px] whitespace-nowrap order-1">
                      {{ formatShortDate(mail.fullDate) }}
                    </span>
                    <!-- Viewer count — nonaktif untuk SDE -->
                    <div
                      class="flex items-center gap-1 rounded py-0.5 px-1.5 text-neutral-500 dark:text-gray-400 transition-colors w-auto order-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                      @click.stop="openReaderModal(mail)">
                      <Eye class="w-3.5 h-3.5 text-primary dark:text-primary-400" />
                      <span class="text-[12px] font-medium text-primary dark:text-primary-400">
                        {{ mail.viewCount || 0 }}
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

    <!-- ── MODALS ─────────────────────────────────────────────────────────── -->

    <LabelAssignModal v-model="showLabelAssignModal" :selected-ids="selectedIds" source="sent"
      @assign="assignLabelToSelected" @success="selectedIds.clear()" />

    <!-- Modal Status Pembaca -->
    <Teleport to="body">
      <div v-if="showReaderModal"
        class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
          <div class="flex items-start justify-between p-5 pb-2">
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">Status Pembaca Pesan</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{{ currentReaderData.subject }}</p>
            </div>
            <button @click="showReaderModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-5 pt-3 flex-1 overflow-y-auto max-h-[65vh] space-y-6">

            <!-- ── KATEGORI: TERTUJU — disembunyikan untuk SDE ── -->
            <div v-if="currentReaderData.category !== 'SDE'">
              <div class="flex items-center gap-2 mb-3">
                <span
                  class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tertuju</span>
                <div class="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
              </div>

              <!-- Sudah Membaca -->
              <div class="mb-3">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span class="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                    Sudah Membaca ({{ currentReaderData.readList.length }})
                  </span>
                </div>
                <div v-if="currentReaderData.readList.length > 0" class="space-y-2">
                  <div v-for="(reader, idx) in currentReaderData.readList" :key="idx"
                    class="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        :class="reader.bg">
                        {{ reader.initial }}
                      </div>
                      <div>
                        <div class="text-sm font-semibold text-gray-900 dark:text-gray-200">{{ reader.position }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ reader.name }}</div>
                        <div class="text-xs text-gray-400 dark:text-gray-500">Dibaca: {{ reader.date }}</div>
                      </div>
                    </div>
                    <div class="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  </div>
                </div>
                <p v-else class="text-xs text-gray-400 italic pl-4">Belum ada yang membaca</p>
              </div>

              <!-- Belum Membaca -->
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                  <span class="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                    Belum Membaca ({{ currentReaderData.unreadList.length }})
                  </span>
                </div>
                <div v-if="currentReaderData.unreadList.length > 0" class="space-y-2">
                  <div v-for="(reader, idx) in currentReaderData.unreadList" :key="idx"
                    class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        :class="reader.bg">
                        {{ reader.initial }}
                      </div>
                      <div>
                        <div class="text-sm font-semibold text-gray-900 dark:text-gray-200">{{ reader.position }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ reader.name }}</div>
                      </div>
                    </div>
                    <div class="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                  </div>
                </div>
                <p v-else class="text-xs text-gray-400 italic pl-4">Semua sudah membaca</p>
              </div>
            </div>

            <!-- ── KATEGORI: TEMBUSAN — header disembunyikan untuk SDE ── -->
            <div>
              <!-- Label "Tembusan" hanya muncul jika bukan SDE (SDE = hanya tembusan, tidak perlu label pembeda) -->
              <div v-if="currentReaderData.category !== 'SDE'" class="flex items-center gap-2 mb-3">
                <span
                  class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tembusan</span>
                <div class="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
              </div>

              <div
                v-if="currentReaderData.tembusanReadList.length === 0 && currentReaderData.tembusanUnreadList.length === 0"
                class="flex flex-col items-center justify-center py-6 text-gray-300 dark:text-gray-600">
                <span class="text-xs">Tidak ada data tembusan</span>
              </div>

              <template v-else>
                <!-- Sudah Membaca Tembusan -->
                <div class="mb-3">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span class="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                      Sudah Membaca ({{ currentReaderData.tembusanReadList.length }})
                    </span>
                  </div>
                  <div class="space-y-2">
                    <div v-for="(reader, idx) in currentReaderData.tembusanReadList" :key="idx"
                      class="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          :class="reader.bg">
                          {{ reader.initial }}
                        </div>
                        <div>
                          <div class="text-sm font-semibold text-gray-900 dark:text-gray-200">{{ reader.position }}
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">{{ reader.name }}</div>
                          <div class="text-xs text-gray-400 dark:text-gray-500">Dibaca: {{ reader.date }}</div>
                        </div>
                      </div>
                      <div class="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    </div>
                  </div>
                </div>

                <!-- Belum Membaca Tembusan -->
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                    <span class="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                      Belum Membaca ({{ currentReaderData.tembusanUnreadList.length }})
                    </span>
                  </div>
                  <div class="space-y-2">
                    <div v-for="(reader, idx) in currentReaderData.tembusanUnreadList" :key="idx"
                      class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          :class="reader.bg">
                          {{ reader.initial }}
                        </div>
                        <div>
                          <div class="text-sm font-semibold text-gray-900 dark:text-gray-200">{{ reader.position }}
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">{{ reader.name }}</div>
                        </div>
                      </div>
                      <div class="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                    </div>
                  </div>
                </div>
              </template>
            </div>

          </div>

          <div class="p-4 border-t border-gray-100 dark:border-gray-700">
            <button @click="showReaderModal = false"
              class="w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Konfirmasi Bulk Action -->
    <Teleport to="body">
      <div v-if="showDeleteModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          class="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
          <div class="p-5 text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" :class="currentBulkAction === 'delete'
              ? 'bg-red-100 dark:bg-red-900/30'
              : isUnarchiveMode ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'">
              <AlertTriangle v-if="currentBulkAction === 'delete'" class="w-6 h-6 text-red-600 dark:text-red-400" />
              <Archive v-else class="w-6 h-6"
                :class="isUnarchiveMode ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'" />
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
                :class="currentBulkAction === 'delete'
                  ? 'bg-red-600 hover:bg-red-700'
                  : isUnarchiveMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary-600'">
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
