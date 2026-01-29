<script setup>
import { useRouter, useRoute } from "vue-router";
import { ref, computed, watch, onMounted } from "vue";
import { Inbox, FileText, Send, Building, Building2, FilePen, Trash2, ChevronLeft, ChevronRight, RotateCw, Check, Edit, History, ArrowUpDown, Loader2, AlertTriangle, BookOpen, Tag } from 'lucide-vue-next';
import { useDraft } from '@/composables/useDraft';
import { useLabel } from '~/composables/useLabel';

const { items, pagination, pending, summary, fetchDrafts, deleteDraft, bulkDeleteDrafts } = useDraft();
const { addNaskahToLabel: _addNaskahToLabel } = useLabel();

const router = useRouter();
const route = useRoute();
const toast = useToast();

const selectedIds = ref(new Set());
const activeTab = ref("ALL");
const searchQuery = ref("");
const showDeleteModal = ref(false);
const itemToDelete = ref(null);
const isDeleting = ref(false);
const showLabelAssignModal = ref(false);
const isLabelProcessing = ref(false);

const showDateMenu = ref(false);
const activeDateLabel = ref("30 Hari");
const showSortMenu = ref(false);
const activeSortLabel = ref("Terbaru");
const showPageMenu = ref(false);

const dateOptions = ["7 Hari", "30 Hari", "60 Hari", "1 Tahun", "Semua"];
const sortOptions = ["Terbaru", "Terlama"];
const pageOptions = [5, 10, 25, 50];

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Draf", to: "#" },
];

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Konsep", value: "KONSEP", icon: FilePen },
  { label: "Kajian", value: "KA", icon: BookOpen },
];

const formatShortDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  const time = `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}`;
  const day = date.getDate();
  const month = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date);

  if (isToday) return time;
  if (isThisYear) return `${day} ${month} ${time}`;
  return `${day} ${month} ${date.getFullYear()} ${time}`;
};

const getTabCount = (tabValue) => {
  if (!summary.value) return 0;
  if (tabValue === 'ALL') return summary.value.total_semua || 0;

  const counts = summary.value.total_per_jenis || {};
  return counts[tabValue] || counts[tabValue.toUpperCase()] || counts[tabValue.toLowerCase()] || 0;
};

const handleEdit = (mail) => {
  const jenis = (mail.category || '').trim().toUpperCase();
  const routes = {
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
const addNaskahToLabel = async (naskahId, labelId) => {
  return await _addNaskahToLabel(naskahId, labelId, 'draft');
};

const assignLabelToSelected = async (labelId, labelName) => {
  if (selectedIds.value.size === 0) return;
  isLabelProcessing.value = true;

  try {
    const promises = Array.from(selectedIds.value).map(id => {
      const item = items.value.find(e => e.id === id);
      return addNaskahToLabel(item?.naskahId || id, labelId);
    });

    await Promise.all(promises);

    toast.add({
      title: 'Berhasil',
      description: `Label "${labelName}" ditambahkan ke draf.`,
      color: 'success'
    });

    showLabelAssignModal.value = false;
    selectedIds.value.clear();
    await refreshData();
  } catch (error) {
    console.error("Gagal assign label:", error);
    toast.add({ title: 'Gagal', description: 'Gagal menambahkan label.', color: 'error' });
  } finally {
    isLabelProcessing.value = false;
  }
};

const openLabelAssignModal = () => {
  showLabelAssignModal.value = true;
};

const refreshData = async () => {
  await fetchDrafts({
    page: pagination.value.page,
    limit: pagination.value.limit,
    jenis: activeTab.value,
    search: searchQuery.value,
    date_filter: activeDateLabel.value,
    sort_by: activeSortLabel.value
  });
  selectedIds.value.clear();
};

watch(() => pagination.value.page, refreshData);
watch(() => pagination.value.limit, () => {
  pagination.value.page = 1;
  refreshData();
});
watch([activeTab, searchQuery, activeDateLabel, activeSortLabel], () => {
  pagination.value.page = 1;
  refreshData();
});

onMounted(refreshData);

const nextPage = () => { if (pagination.value.page < pagination.value.totalPages) pagination.value.page++; };
const prevPage = () => { if (pagination.value.page > 1) pagination.value.page--; };
const selectDateFilter = (opt) => { activeDateLabel.value = opt; showDateMenu.value = false; };
const selectSortOption = (opt) => { activeSortLabel.value = opt; showSortMenu.value = false; };

const toggleSelection = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};
const toggleSelectAll = () => {
  if (selectedIds.value.size === items.value.length) selectedIds.value.clear();
  else items.value.forEach(mail => selectedIds.value.add(mail.id));
};
const isAllSelected = computed(() => items.value.length > 0 && selectedIds.value.size === items.value.length);

const confirmDeleteModal = (mail) => { itemToDelete.value = mail; showDeleteModal.value = true; };
const confirmBulkDelete = () => { itemToDelete.value = null; showDeleteModal.value = true; };

const handleDelete = async () => {
  isDeleting.value = true;
  try {
    if (itemToDelete.value) {
      await deleteDraft(itemToDelete.value.id);
      selectedIds.value.delete(itemToDelete.value.id);
    } else {
      const idsArray = Array.from(selectedIds.value);
      if (idsArray.length > 0) {
        await bulkDeleteDrafts(idsArray);
        selectedIds.value.clear();
      }
    }
    items.value.length === 0 && pagination.value.page > 1 ? pagination.value.page-- : await refreshData();
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    isDeleting.value = false;
    itemToDelete.value = null;
  }
};

const getCategoryStyle = (cat) => {
  const styles = {
    'ND': 'bg-blue-50 text-blue-500',
    'DI': 'bg-purple-50 text-purple-500',
    'SDI': 'bg-green-50 text-green-500',
    'SDE': 'bg-orange-50 text-orange-500',
    'KA': 'bg-cyan-50 text-cyan-500'
  };
  return styles[(cat || '').toUpperCase()] || 'bg-gray-50 text-gray-500';
};
</script>

<template>
  <PageHeader title="Draf" :items="breadcrumbs" />
  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue">

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
        <button @click="refreshData" class="p-1.5 text-neutral-500 hover:bg-gray-100 rounded" :disabled="pending">
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': pending }" />
        </button>
        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 mx-1 hidden md:block"></div>
          <button @click="confirmBulkDelete" class="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Hapus">
            <Trash2 class="w-4 h-4" />
          </button>
          <button @click="openLabelAssignModal" class="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
            title="Beri Label">
            <Tag class="w-4 h-4" />
          </button>
          <span class="text-xs text-neutral-500">{{ selectedIds.size }} dipilih</span>
        </template>
      </div>

      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">
        <div class="relative">
          <button @click="showDateMenu = !showDateMenu"
            class="p-1.5 text-neutral-500 hover:bg-gray-100 rounded relative">
            <History class="w-4 h-4" />
            <span v-if="activeDateLabel !== 'Semua'"
              class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>
          <div v-if="showDateMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
            <button v-for="opt in dateOptions" :key="opt" @click="selectDateFilter(opt)"
              class="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
              :class="{ 'text-primary font-semibold': activeDateLabel === opt }">
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="relative">
          <button @click="showSortMenu = !showSortMenu" class="p-1.5 text-neutral-500 hover:bg-gray-100 rounded">
            <ArrowUpDown class="w-4 h-4" />
          </button>
          <div v-if="showSortMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
            <button v-for="opt in sortOptions" :key="opt" @click="selectSortOption(opt)"
              class="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
              :class="{ 'text-primary font-semibold': activeSortLabel === opt }">
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-1 text-caption1 text-neutral-600 shrink-0 h-[34px]">
          <span class="mx-1 font-medium hidden sm:inline whitespace-nowrap text-[12px] text-neutral-500">
            {{ pagination.total === 0 ? '0-0' : `${pagination.from}-${pagination.to}` }} Dari {{ pagination.total }}
          </span>
          <button class="p-1.5 hover:bg-gray-100 rounded text-neutral-500 disabled:opacity-30" @click="prevPage"
            :disabled="pagination.page === 1">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button class="p-1.5 hover:bg-gray-100 rounded text-neutral-500 disabled:opacity-30" @click="nextPage"
            :disabled="pagination.page >= pagination.totalPages">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden relative w-full">
      <div class="flex flex-col bg-white transition-all duration-300 overflow-y-auto overflow-x-hidden flex-1 w-full">
        <div
          class="py-2.5 border-b border-t border-gray-200 bg-white shrink-0 sticky top-0 z-10 w-full overflow-hidden">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full py-1">
            <UButton v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" color="primary"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 first:ms-2 last:me-2"
              :class="activeTab === tab.value ? 'bg-primary-400 text-white border-primary-400' : 'bg-white text-primary-500 border-neutral-200/50 hover:bg-primary-50'">
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
              <span v-if="getTabCount(tab.value) > 0" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                :class="activeTab === tab.value ? 'bg-white text-primary-500' : 'bg-primary-50 text-primary-500'">
                {{ getTabCount(tab.value) }}
              </span>
            </UButton>
          </div>
        </div>

        <div class="flex-1 pb-10 w-full relative min-h-[200px]">
          <div v-if="pending" class="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <Loader2 class="w-8 h-8 text-primary animate-spin" />
          </div>

          <div v-else-if="items.length === 0"
            class="flex flex-col items-center justify-center h-full text-neutral-400 mt-10">
            <Inbox class="w-12 h-12 mb-2 opacity-50" />
            <span class="text-sm">Tidak ada draft ditemukan</span>
          </div>

          <div v-else v-for="mail in items" :key="mail.id"
            class="group flex gap-2 items-start md:items-center px-4 py-3 border-b border-gray-100 hover:shadow-sm transition-colors relative w-full h-auto min-h-[54px] hover:bg-gray-50">

            <div class="flex items-center gap-3 pr-2 shrink-0 mt-1.5 md:mt-0">
              <div
                class="w-3.5 h-3.5 border-[1.5px] border-gray-400 rounded-sm flex items-center justify-center transition-colors cursor-pointer"
                :class="selectedIds.has(mail.id) ? 'bg-primary border-primary' : 'bg-white'"
                @click="toggleSelection(mail.id)">
                <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
              </div>
            </div>

            <div class="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3 overflow-hidden">
              <div class="flex md:hidden w-full mb-0.5">
                <span class="text-neutral-500 text-[10px]">{{ formatShortDate(mail.created_at || mail.date) }}</span>
              </div>

              <UTooltip :text="mail.fullRecipients"
                :ui="{ content: 'h-auto py-2 px-3 max-w-xs', text: 'whitespace-pre-line text-left' }"
                class="min-w-0 truncate">
                <span
                  class="block w-full md:w-48 xl:w-64 truncate text-[13px] text-neutral-900 shrink-0 font-semibold cursor-help">
                  {{ mail.from }}
                </span>
              </UTooltip>

              <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                <div v-if="mail.category_label && mail.category_label.length > 0" class="flex flex-wrap gap-1 shrink-0">
                  <span v-for="lbl in mail.category_label" :key="lbl" :title="lbl"
                    class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 max-w-[80px] truncate cursor-help">
                    {{ lbl }}
                  </span>
                </div>
                <div class="text-[13px] text-neutral-900 truncate flex-1 min-w-[120px]">
                  {{ mail.subject }}
                </div>
              </div>

              <div class="hidden xl:flex shrink-0 w-[100px] justify-start items-center">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-medium truncate"
                  :class="getCategoryStyle(mail.category)">
                  {{ mail.category }}
                </span>
              </div>
            </div>

            <div class="hidden md:flex pl-2 shrink-0 justify-end w-[130px]">
              <span class="text-neutral-500 text-[12px] truncate">{{ formatShortDate(mail.created_at || mail.date)
              }}</span>
            </div>

            <div class="pl-2 shrink-0 flex justify-end gap-1">
              <button class="text-primary hover:text-neutral-800 p-1" @click.stop="handleEdit(mail)">
                <Edit class="w-4 h-4" />
              </button>
              <button class="text-red-500 hover:text-red-800 p-1" @click.stop="confirmDeleteModal(mail)">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LabelAssignModal v-model="showLabelAssignModal" :selected-ids="selectedIds" source="draft"
      @assign="assignLabelToSelected" @success="selectedIds.clear()" />

    <Teleport to="body">
      <div v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-5 text-center">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle class="w-6 h-6 text-red-600" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Hapus Draf?</h3>
          <p class="text-sm text-gray-500 mb-6">Apakah Anda yakin ingin menghapus data ini?</p>
          <div class="flex gap-3 justify-center">
            <button @click="showDeleteModal = false" :disabled="isDeleting"
              class="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50">Batal</button>
            <button @click="handleDelete" :disabled="isDeleting"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2">
              <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" /> {{ isDeleting ? 'Menghapus...' : 'Hapus' }}
            </button>
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
