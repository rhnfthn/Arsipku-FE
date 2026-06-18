<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { parseDate, getLocalTimeZone, today } from '@internationalized/date';
import {
  Inbox, FileText, Send, Building, Building2, FilePen,
  Check, X, RotateCw, History, Layers,
  Trash2, ChevronLeft, ChevronRight, Eye, Loader2, BookOpen, Calendar as CalendarIcon,
  ArrowUpDown, Tag,
} from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';
import { useLabel } from '~/composables/useLabel';
import { getInitials, getCategoryStyle } from '~/utils/mail-helpers';

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
  sourceType: string;
  isDraftKonsep?: boolean;
  jenisAsli?: string;
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
const dateOptions = ["7 Hari", "30 Hari", "60 Hari", "1 Tahun", "Semua"];

// Init kosong supaya SSR & client render identik (hindari hydration mismatch).
const startDateInput = ref('');
const endDateInput = ref('');
const startDateCal = ref<any>(null);
const endDateCal = ref<any>(null);
const openStartDate = ref(false);
const openEndDate = ref(false);
const isCustomDate = computed(() => activeDateLabel.value === "Custom");

watch(startDateCal, (val) => { if (val) startDateInput.value = val.toString(); });
watch(endDateCal, (val) => { if (val) endDateInput.value = val.toString(); });

// Sort Menu State
const showSortMenu = ref(false);
const activeSortLabel = ref("Terbaru");
const sortOptions = ["Terbaru", "Terlama"];
const showFilterMenu = ref(false);
const activeFilterType = ref("Semua");

// Source Filter State
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
const currentReaderData = ref({
  subject: "",
  category: "",
  readList: [] as any[],
  unreadList: [] as any[],
  tembusanReadList: [] as any[],
  tembusanUnreadList: [] as any[],
});

// --- LOGIC LOAD DATA ---
const loadData = async () => {
  if (!labelId.value) return;
  isLoading.value = true;
  selectedIds.value.clear();
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
      jenis: activeTab.value !== 'ALL' ? activeTab.value : undefined,
      source: activeSourceValue.value !== 'ALL' ? activeSourceValue.value : undefined,
      sort: activeSortLabel.value === 'Terlama' ? 'terlama' : 'terbaru',
    };

    if (activeDateLabel.value === "Custom") {
      params.start_date = startDateInput.value;
      params.end_date = endDateInput.value;
    } else if (activeDateLabel.value !== "Semua") {
      const now = new Date();
      const toStr = (d: Date) => d.toISOString().split("T")[0];
      const daysMap: Record<string, number> = { "7 Hari": 7, "30 Hari": 30, "60 Hari": 60, "1 Tahun": 365 };
      const days = daysMap[activeDateLabel.value];
      if (days !== undefined) {
        const from = new Date(now);
        from.setDate(now.getDate() - days);
        params.start_date = toStr(from);
        params.end_date = toStr(now);
      }
    }

    await fetchNaskahByLabel(labelId.value, params);
    const data = naskahByLabel.value;
    if (data) {
      labelName.value = data.namaLabel || "Label";
      emails.value = Array.isArray(data.items) ? data.items.map(mapJsonToUI) : [];
    }
  } catch (e: any) {
    toast.add({ title: 'Error', description: 'Gagal memuat data label', color: 'error' });
  } finally {
    isLoading.value = false;
  }
};

// --- MAPPING FUNCTION ---
const mapJsonToUI = (item: any): UIMailItem => {
  const senderName = item.pengirim?.nama || "Tanpa Nama";
  const senderPos = item.pengirim?.position_text || item.pengirim?.organization_text || "";

  let recipientDisplay = "-";
  let fullRecipientList = "Tanpa Penerima";

  const listPenerima = item.penerima || item.kepada || [];

  if (Array.isArray(listPenerima) && listPenerima.length > 0) {
    const isSDE = ['SDE', 'EXTERNAL', 'EKSTERNAL'].includes((item.jenis || '').toUpperCase());
    const first = listPenerima[0];
    const primaryName = isSDE ? first.nama : (first.position_text || first.nama);

    recipientDisplay = listPenerima.length > 1
      ? `${primaryName} & ${listPenerima.length - 1} lainnya`
      : primaryName;

    fullRecipientList = listPenerima
      .map((p: any, index: number) => {
        const pName = isSDE ? p.nama : (p.position_text || p.nama);
        return `${index + 1}. ${pName}`;
      })
      .join("\n");
  }

  const isRead = item.summary_baca?.belum_terbaca === 0;
  const isDraftKonsep = item.is_draft_konsep === true || item.asal_draft === 'konsep';
  const jenisAsli = (item.jenis || '').toUpperCase();

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
    isRead,
    labels: item.labels || [],
    recipient: recipientDisplay,
    fullRecipients: fullRecipientList,
    sourceType: item.source || 'inbox',
    isDraftKonsep,
    jenisAsli,
    originalData: item,
  };
};

// --- HELPER FUNCTIONS ---
const getSourceIcon = (sourceType: string) => {
  const type = sourceType?.toLowerCase();
  switch (type) {
    case 'inbox':
    case 'masuk':
      return 'i-heroicons-inbox-arrow-down';
    case 'sent':
    case 'terkirim':
      return 'i-heroicons-paper-airplane';
    case 'draft':
    case 'konsep':
      return 'i-heroicons-document-text';
    case 'archive':
    case 'arsip':
      return 'i-heroicons-archive-box';
    default:
      return 'i-heroicons-envelope';
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return (
    date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );
};

const formatTime = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const getCategoryLabelShort = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['KA', 'KAJIAN'].includes(c)) return 'KA';
  if (['SDI', 'INTERNAL'].includes(c)) return 'SDI';
  if (['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(c)) return 'SDE';
  if (['ND', 'NOTA DINAS'].includes(c)) return 'ND';
  if (['DI', 'DISPOSISI'].includes(c)) return 'DI';
  if (['K', 'KO', 'KONSEP'].includes(c)) return 'K';
  return 'UM';
};

const getTabCount = (tabValue: string) => {
  const summary = (naskahByLabel.value as any)?.summary;
  if (!summary) return 0;
  if (tabValue === "ALL") return summary.total_semua || 0;

  const counts = summary.total_per_jenis || {};
  const jenisAliasMap: Record<string, string[]> = {
    "ND": ["ND", "nd", "Nota Dinas", "NOTA DINAS"],
    "DI": ["DI", "di", "Disposisi", "DISPOSISI"],
    "SDI": ["SDI", "sdi", "Internal", "INTERNAL"],
    "SDE": ["SDE", "sde", "External", "EXTERNAL", "Eksternal"],
    "K": ["KO", "ko", "Konsep", "KONSEP", "K", "k"],
    "KA": ["KA", "ka", "Kajian", "KAJIAN"],
  };
  const aliases = jenisAliasMap[tabValue] || [tabValue];
  for (const alias of aliases) {
    if (counts[alias]) return counts[alias];
  }
  return 0;
};

// --- COMPUTED ---
const getActiveSourceIcon = computed(() => {
  const found = sourceOptions.find(o => o.value === activeSourceValue.value);
  return found ? found.icon : Tag;
});

// Server-side pagination: emails sudah berisi slice yang tepat dari API
const paginatedEmails = computed(() => emails.value);

// FIX: Tanda kurung eksplisit agar operator ?? dan || tidak ambigu bagi Vue compiler
const totalItems = computed(() =>
  naskahByLabel.value?.pagination?.total ?? emails.value.length
);
const totalPages = computed(() =>
  (naskahByLabel.value?.pagination?.totalPages ?? Math.ceil(totalItems.value / itemsPerPage.value)) || 1
);

const paginationInfo = computed(() => {
  if (totalItems.value === 0) return "0-0 Dari 0";
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(start + itemsPerPage.value - 1, totalItems.value);
  return `${start}-${end} Dari ${totalItems.value}`;
});

const isAllSelected = computed(() =>
  paginatedEmails.value.length > 0 && selectedIds.value.size === paginatedEmails.value.length
);

// --- WATCHERS ---
watch([activeTab, activeSourceValue, activeSortLabel, itemsPerPage], () => {
  currentPage.value = 1;
  loadData();
});

watch(currentPage, () => loadData());

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadData();
  }, 500);
});

watch([() => user.value, labelId], ([newUser, newLabelId]) => {
  if (newUser && newLabelId) loadData();
}, { immediate: true });

// Inisialisasi tanggal di client (hindari hydration mismatch dari new Date()).
onMounted(() => {
  const todayStr = new Date().toISOString().split('T')[0];
  startDateInput.value = todayStr;
  endDateInput.value = todayStr;
  startDateCal.value = parseDate(todayStr);
  endDateCal.value = parseDate(todayStr);
});

// --- UI EVENT HANDLERS ---
const refreshData = () => loadData();
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

const toggleSelection = (id: string) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};

const toggleSelectAll = () => {
  if (selectedIds.value.size === paginatedEmails.value.length) selectedIds.value.clear();
  else paginatedEmails.value.forEach(m => selectedIds.value.add(m.id));
};

const selectSourceFilter = (opt: { label: string; value: string; icon: any }) => {
  activeSourceLabel.value = opt.label;
  activeSourceValue.value = opt.value;
  showSourceMenu.value = false;
  currentPage.value = 1;
};

const selectSortOption = (opt: string) => {
  activeSortLabel.value = opt;
  showSortMenu.value = false;
};

const selectPageSize = (size: number) => {
  itemsPerPage.value = size;
  currentPage.value = 1;
  showPageMenu.value = false;
};

const selectDateFilter = (opt: string) => {
  activeDateLabel.value = opt;
  showDateMenu.value = false;
  currentPage.value = 1;
  loadData();
};

const applyCustomDate = () => {
  activeDateLabel.value = "Custom";
  showDateMenu.value = false;
  currentPage.value = 1;
  loadData();
};

const navigateToDetail = (mail: UIMailItem) => {
  const source = (mail.sourceType || '').toLowerCase();
  if (source === 'draft' || source === 'konsep') {
    handleEdit(mail);
  } else if (source === 'sent' || source === 'terkirim') {
    router.push({ path: `/korespondensi/terkirim/${mail.id}`, query: { jenis: mail.category } });
  } else {
    router.push({ path: `/korespondensi/kotak-masuk/${mail.id}`, query: { jenis: mail.category } });
  }
};

const handleEdit = (mail: UIMailItem) => {
  const jenis = (mail.category || '').trim().toUpperCase();
  const isDraftKonsep = mail.isDraftKonsep || ['K', 'KO', 'KONSEP'].includes(jenis);
  const jenisAsli = (mail.jenisAsli || jenis).toUpperCase();

  if (isDraftKonsep) {
    const konsepRouteMap: Record<string, string> = {
      ND: '/korespondensi/tulis/konsep/nota-dinas',
      SDI: '/korespondensi/tulis/konsep/surat-dinas-internal',
      SDE: '/korespondensi/tulis/konsep/surat-dinas-eksternal',
    };
    router.push({
      path: konsepRouteMap[jenisAsli] ?? '/korespondensi/tulis/konsep/nota-dinas',
      query: { draft_id: mail.id },
    });
    return;
  }

  const routes: Record<string, string> = {
    ND: '/korespondensi/tulis/nota-dinas',
    DI: '/korespondensi/tulis/disposisi',
    SDI: '/korespondensi/tulis/surat-dinas-internal',
    SDE: '/korespondensi/tulis/surat-dinas-eksternal',
    KA: '/korespondensi/tulis/kajian',
  };
  router.push({
    path: routes[jenis] ?? '/korespondensi/tulis/nota-dinas',
    query: { draft_id: mail.id },
  });
};

const confirmBulkDelete = () => {
  if (selectedIds.value.size === 0) return;
  showDeleteModal.value = true;
};

const handleBulkDeleteExecute = async () => {
  isDeleting.value = true;
  try {
    const currentLabelId = labelId.value;
    await Promise.all(
      Array.from(selectedIds.value).map(id => removeNaskahFromLabel(id, currentLabelId))
    );
    toast.add({
      title: 'Berhasil',
      description: `${selectedIds.value.size} item berhasil dihapus dari label`,
      color: 'success',
    });
    selectedIds.value.clear();
    showDeleteModal.value = false;
    await loadData();
  } catch (e: any) {
    console.error("Gagal menghapus naskah dari label:", e);
    toast.add({ title: 'Gagal', description: 'Terjadi kesalahan saat menghapus item', color: 'error' });
  } finally {
    isDeleting.value = false;
  }
};

const openReaderModal = (mail: UIMailItem) => {
  const item = mail.originalData;
  const penerimaList = item.penerima || [];
  const tembusanList = item.tembusan || [];

  const mapPenerima = (p: any, isRead: boolean) => ({
    name: p.nama,
    position: p.position_text || p.jabatan || p.nama,
    initial: p.nama?.substring(0, 1) || "?",
    bg: isRead ? "bg-primary-500" : "bg-gray-400",
    ...(isRead
      ? {
        date: p.read_time
          ? `${new Date(p.read_time).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })} ${new Date(p.read_time).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
          : "-",
      }
      : {}),
  });

  currentReaderData.value = {
    subject: item.perihal || mail.subject,
    category: (mail.category || '').toUpperCase(),
    readList: penerimaList
      .filter((p: any) => p.status_baca === "terbaca")
      .map((p: any) => mapPenerima(p, true)),
    unreadList: penerimaList
      .filter((p: any) => p.status_baca !== "terbaca")
      .map((p: any) => mapPenerima(p, false)),
    tembusanReadList: tembusanList
      .filter((p: any) => p.status_baca === "terbaca")
      .map((p: any) => mapPenerima(p, true)),
    tembusanUnreadList: tembusanList
      .filter((p: any) => p.status_baca !== "terbaca")
      .map((p: any) => mapPenerima(p, false)),
  };
  showReaderModal.value = true;
};

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Konsep", value: "K", icon: FilePen },
  { label: "Kajian", value: "KA", icon: BookOpen },
];
</script>

<template>
  <PageHeader :title="labelName" :items="breadcrumbs" />

  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue">

    <!-- ===== TOP TOOLBAR ===== -->
    <div
      class="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors">

      <!-- LEFT: select-all, refresh, source filter, bulk actions -->
      <div class="flex items-center gap-1 shrink-0 relative">

        <!-- Select All Checkbox -->
        <div class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
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

        <!-- Refresh -->
        <button @click="refreshData"
          class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Muat Ulang">
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>

        <!-- Source Filter Dropdown -->
        <div class="relative">
          <button @click="showSourceMenu = !showSourceMenu"
            class="flex items-center p-1.5 text-neutral-500 hover:bg-gray-100 rounded relative">
            <component :is="getActiveSourceIcon" class="w-4 h-4 shrink-0" />
            <span v-if="activeSourceValue !== 'ALL'"
              class="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-1 ring-white" />
          </button>
          <div v-if="showSourceMenu" @click="showSourceMenu = false" class="fixed inset-0 z-40 bg-transparent" />
          <div v-if="showSourceMenu"
            class="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <button v-for="opt in sourceOptions" :key="opt.value" @click="selectSourceFilter(opt)"
              class="w-full text-left px-3 py-2 text-[13px] transition-colors flex items-center gap-3 group" :class="activeSourceLabel === opt.label
                ? 'bg-blue-50 dark:bg-blue-900/20 text-primary font-medium'
                : 'text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                ">
              <component :is="opt.icon" class="w-4 h-4 opacity-70 group-hover:opacity-100" />
              <span>{{ opt.label }}</span>
              <Check v-if="activeSourceLabel === opt.label" class="w-3.5 h-3.5 ml-auto text-primary" />
            </button>
          </div>
        </div>

        <!-- Bulk Delete (muncul saat ada item dipilih) -->
        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block" />
          <div class="flex items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200">
            <button @click="confirmBulkDelete" class="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Hapus dari Label">
              <Trash2 class="w-4 h-4" />
            </button>
            <span class="text-xs text-neutral-500 ms-2">{{ selectedIds.size }} dipilih</span>
          </div>
        </template>
      </div>

      <!-- RIGHT: date filter, sort, page size, pagination -->
      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">

        <!-- Date Filter Dropdown -->
        <div class="relative">
          <button @click="showDateMenu = !showDateMenu" title="Periode Data"
            class="flex items-center gap-1 p-1.5 text-neutral-500 hover:bg-gray-100 rounded relative">
            <History class="w-4 h-4 shrink-0" />
            <span v-if="activeDateLabel !== 'Semua'"
              class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white" />
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

        <!-- Sort Dropdown -->
        <div class="relative">
          <button @click="showSortMenu = !showSortMenu"
            class="p-1.5 text-neutral-500 hover:bg-gray-100 rounded transition-colors flex items-center gap-1">
            <ArrowUpDown class="w-4 h-4" />
          </button>
          <div v-if="showSortMenu" @click="showSortMenu = false" class="fixed inset-0 z-40 bg-transparent" />
          <div v-if="showSortMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button v-for="opt in sortOptions" :key="opt" @click="selectSortOption(opt)"
              class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 hover:bg-gray-50 hover:text-primary transition-colors"
              :class="{ 'text-primary font-semibold bg-gray-50': activeSortLabel === opt }">
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

        <!-- Page Size + Pagination -->
        <div class="flex items-center gap-1">
          <!-- Page Size Dropdown -->
          <div class="relative">
            <button @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 hover:bg-gray-100 rounded transition-colors flex items-center gap-1">
              <Layers class="w-4 h-4" />
            </button>
            <div v-if="showPageMenu" @click="showPageMenu = false" class="fixed inset-0 z-40 bg-transparent" />
            <div v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-24 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button v-for="size in pageOptions" :key="size" @click="selectPageSize(size)"
                class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 hover:bg-gray-50 hover:text-primary transition-colors"
                :class="{ 'text-primary font-semibold bg-gray-50': itemsPerPage === size }">
                {{ size }} Item
              </button>
            </div>
          </div>

          <!-- Prev / Next -->
          <div class="flex items-center gap-1 text-neutral-600 dark:text-gray-400 shrink-0 h-[34px]">
            <span class="mx-1 font-medium hidden sm:inline text-[12px] whitespace-nowrap">
              {{ paginationInfo }}
            </span>
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

    <!-- ===== MAIN CONTENT ===== -->
    <div class="flex-1 flex overflow-hidden relative w-full">
      <div
        class="flex flex-col bg-white dark:bg-gray-900 transition-all duration-300 border-r border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden flex-1 w-full">

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

        <!-- List Area -->
        <div class="flex-1 w-full relative">

          <!-- Skeleton Loading -->
          <div v-if="isLoading" class="flex flex-col w-full">
            <div v-for="i in Math.min(itemsPerPage, 10)" :key="i" class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 w-full">
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

          <!-- Empty State -->
          <div v-else-if="paginatedEmails.length === 0"
            class="flex flex-col items-center justify-center h-64 text-gray-500">
            <Inbox class="w-10 h-10 mb-2 opacity-20" />
            <span class="text-sm">Tidak ada data ditemukan</span>
          </div>

          <!-- Mail Rows -->
          <div v-else v-for="mail in paginatedEmails" :key="mail.id" @click="navigateToDetail(mail)"
            v-memo="[mail.id, mail.isRead, mail.isStarred, selectedIds.has(mail.id)]"
            class="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer border-b border-gray-100 dark:border-gray-800 relative w-full"
            :class="!mail.isRead ? 'bg-blue-50/10' : ''">

            <div class="flex flex-col md:flex-row items-start gap-3 md:gap-4 px-6 py-4">

              <!-- Checkbox + Source Icon -->
              <div class="shrink-0 flex items-center gap-3 pt-1 md:pt-0">
                <div @click.stop class="flex items-center">
                  <div
                    class="w-4 h-4 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
                    :class="selectedIds.has(mail.id)
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-white dark:bg-gray-800'
                      " @click="toggleSelection(mail.id)">
                    <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" stroke-width="4" />
                  </div>
                </div>

                <UTooltip :text="mail.sourceType.toUpperCase()" :popper="{ placement: 'right' }">
                  <UIcon :name="getSourceIcon(mail.sourceType)"
                    class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors" />
                </UTooltip>
              </div>

              <!-- Sender + Recipient -->
              <div class="w-full md:w-[28%] shrink-0 min-w-0">
                <UTooltip :popper="{ placement: 'top' }" class="max-w-full">
                  <h4
                    class="font-bold text-gray-700 dark:text-gray-200 uppercase truncate text-sm md:text-[13px] tracking-wide group-hover:text-primary-600 transition-colors">
                    {{ mail.from }}
                  </h4>
                  <template #text>
                    <span class="font-medium">{{ mail.position }}</span>
                  </template>
                </UTooltip>

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

              <!-- Subject + Number + Eye -->
              <div class="flex-1 min-w-0 w-full">
                <p class="text-sm leading-snug line-clamp-2 md:line-clamp-1 transition-colors font-medium" :class="!mail.isRead
                  ? 'text-gray-900 dark:text-white font-bold'
                  : 'text-gray-600 dark:text-gray-400'
                  ">
                  {{ mail.subject }}
                </p>
                <div class="flex items-center gap-2 mt-1.5">
                  <span
                    class="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 uppercase">
                    {{ mail.number }}
                  </span>

                  <UIcon v-if="mail.originalData.hasAttachment" name="i-heroicons-paper-clip"
                    class="w-3.5 h-3.5 text-gray-400" />

                  <!-- Read status: inbox only -->
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

              <!-- Category Badge + Date -->
              <div
                class="w-full md:w-auto shrink-0 flex flex-row md:items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                <div class="flex items-center gap-1.5">
                  <span
                    class="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border border-transparent min-w-[60px] text-center"
                    :class="mail.color">
                    {{ getCategoryLabelShort(mail.category) }}
                  </span>
                  <span v-if="mail.isDraftKonsep"
                    class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
                    title="Draft Konsep">
                    K
                  </span>
                </div>
                <span class="text-xs whitespace-nowrap font-medium min-w-[90px] text-right" :class="!mail.isRead
                  ? 'text-primary-600 dark:text-primary-400 font-bold'
                  : 'text-gray-500'
                  ">
                  {{ mail.date.split(',')[0] }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

  <!-- ===== MODALS (via Teleport) ===== -->
  <Teleport to="body">

    <!-- Modal Status Pembaca -->
    <div v-if="showReaderModal"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
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

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="Hapus Item dari Label?"
      :description="`Apakah Anda yakin ingin menghapus ${selectedIds.size} item terpilih dari label ini?`"
      confirm-text="Hapus"
      cancel-text="Batal"
      variant="danger"
      :loading="isDeleting"
      @confirm="handleBulkDeleteExecute"
      @cancel="showDeleteModal = false"
    />

  </Teleport>
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
