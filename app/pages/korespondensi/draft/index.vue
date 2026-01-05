<script setup>
import { useRouter, useRoute } from "vue-router";
import { ref, computed, watch, onMounted } from "vue";
import {
  Inbox, FileText, Send, Building, Building2, FilePen, Trash2, ChevronLeft, ChevronRight, RotateCw, Check, Edit, History, ArrowUpDown, Layers, Loader2, AlertTriangle
} from 'lucide-vue-next';

import { useAuth } from '@/composables/useAuth';
import { useDraft } from '@/composables/useDraft';

const { user } = useAuth();
const { drafts, fetchDrafts, deleteDraft, bulkDeleteDrafts, isLoadingDraft } = useDraft();

const router = useRouter();
const route = useRoute();

const selected = ref(null);
const selectedIds = ref(new Set());
const activeTab = ref("ALL");
const searchQuery = ref("");
const showDeleteModal = ref(false);
const itemToDelete = ref(null);
const isDeleting = ref(false);

const showFilterMenu = ref(false);
const activeFilterType = ref("Semua");
const showDateMenu = ref(false);
const activeDateLabel = ref("30 Hari");
const showSortMenu = ref(false);
const activeSortLabel = ref("Terbaru");
const showPageMenu = ref(false);
const itemsPerPage = ref(10);
const currentPage = ref(1);

const dateOptions = ["7 Hari", "30 Hari", "60 Hari", "1 Tahun", "Semua"];
const sortOptions = ["Terbaru", "Terlama"];
const pageOptions = [5, 10, 25, 50];

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Konsep", value: "KONSEP", icon: FilePen },
];

const getInitial = (name) => name ? name.substring(0, 2).toUpperCase() : 'NA';
const getRandomColor = (id) => {
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-emerald-100 text-emerald-600",
    "bg-indigo-100 text-indigo-600",
    "bg-orange-100 text-orange-600"
  ];
  return colors[id.charCodeAt(0) % colors.length] || colors[0];
};

// Ganti fungsi handleEdit yang lama dengan yang ini
const handleEdit = (mail) => {
  // 1. Bersihkan string (trim spasi) dan uppercase agar validasi akurat
  const jenis = (mail.category || '').trim().toUpperCase();

  console.log("DEBUG EDIT - ID:", mail.id, "Jenis Raw:", mail.category, "Jenis Parsed:", jenis);

  let path = '';

  // 2. Logic Routing yang lebih strict
  if (['ND', 'NOTA DINAS', 'NOTA_DINAS'].includes(jenis)) {
    path = '/korespondensi/tulis/nota-dinas';
  }
  else if (['DI', 'DISPOSISI'].includes(jenis)) {
    path = '/korespondensi/tulis/disposisi';
  }
  else if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL', 'SURAT_DINAS_INTERNAL'].includes(jenis)) {
    path = '/korespondensi/tulis/surat-dinas-internal';
  }
  else if (['SDE', 'EXTERNAL', 'EKSTERNAL', 'SURAT DINAS EKSTERNAL', 'SURAT_DINAS_EKSTERNAL'].includes(jenis)) {
    path = '/korespondensi/tulis/surat-dinas-eksternal';
  }
  else if (['KA', 'KAJIAN'].includes(jenis)) {
    // KA diarahkan ke halaman Kajian (sesuai history sebelumnya)
    path = '/korespondensi/tulis/kajian';
  }
  else {
    // 3. Fallback jika jenis tidak dikenali
    console.warn("Jenis surat tidak dikenali, default ke Nota Dinas. Jenis:", jenis);
    // Opsional: Tetap arahkan ke ND atau tampilkan error
    path = '/korespondensi/tulis/nota-dinas';
  }

  // 4. Eksekusi Router
  if (path) {
    router.push({
      path: path,
      query: {
        draft_id: mail.id,
        mode: 'edit'
      }
    });
  }
};

const formatDateShort = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatFullDate = (isoString, time) => {
  if (!isoString) return '-';
  const date = new Date(isoString);

  const d = date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return `${d} ${time || ''}`;
}

const refreshData = async () => {
  if (user.value?.position) {
    await fetchDrafts(user.value.position || "70016786");
    selectedIds.value.clear(); // Reset selection on refresh
  }
};

onMounted(async () => {
  if (user.value) {
    await refreshData();
  }
});

watch(user, (newUser) => {
  if (newUser?.position) {
    refreshData();
  }
}, { immediate: true });

watch(() => route.query.q, (newVal) => {
  searchQuery.value = (newVal || "").toString();
}, { immediate: true });

// MAPPING DATA
// MAPPING DATA
const mappedEmails = computed(() => {
  if (!drafts.value) return [];

  return drafts.value.map(item => {
    // --- LOGIC DISPLAY PENERIMA ---
    const listPenerima = item.penerima || [];
    let displayRecipient = 'Tanpa Penerima';

    if (listPenerima.length > 0) {
      const firstPerson = listPenerima[0];
      const jenisSurat = (item.jenis || '').toUpperCase();
      const isSDE = ['SDE', 'EXTERNAL', 'EKSTERNAL', 'SURAT DINAS EKSTERNAL'].includes(jenisSurat);

      // Jika SDE: Tampilkan Nama
      // Jika Lainnya: Tampilkan Jabatan (position_text), fallback ke Nama jika jabatan kosong
      let displayName = isSDE
        ? firstPerson.nama
        : (firstPerson.position_text || firstPerson.nama);

      // Safety check jika data kosong/null
      if (!displayName) displayName = 'Tanpa Nama';

      if (listPenerima.length > 1) {
        // Contoh: Direktur Operasi +2 lainnya
        displayRecipient = `${displayName} +${listPenerima.length - 1} lainnya`;
      } else {
        // Contoh: Direktur Operasi
        displayRecipient = displayName;
      }
    }
    // -----------------------------

    return {
      id: item.id_naskah,
      from: displayRecipient, // Hasil logic di atas
      email: 'user@internal.com', // Placeholder jika tidak ada di API
      subject: item.isi_pesan || 'Tanpa Subjek',
      body: item.isi_pesan,
      category: item.jenis || '',
      category_text: item.jenis_text || '',
      date: formatDateShort(item.tanggal),
      fullDate: formatFullDate(item.tanggal, item.waktu),
      rawDate: new Date(item.tanggal),
      initial: getInitial(displayRecipient), // Initial ambil dari displayRecipient
      color: getRandomColor(item.id_naskah),
      isRead: true,
      recipient: item.penerima, // Simpan raw data untuk kebutuhan lain
      originalData: item
    };
  });
});

// FILTER LOGIC
const filteredEmails = computed(() => {
  let result = [...mappedEmails.value];

  if (activeTab.value !== "ALL") {
    if (activeTab.value === 'INTERNAL' && result.some(x => x.category === 'KA')) {
      result = result.filter(mail => mail.category === 'KA' || mail.category === 'INTERNAL');
    } else {
      result = result.filter(mail => mail.category === activeTab.value);
    }
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(mail =>
      mail.subject.toLowerCase().includes(q) ||
      mail.from.toLowerCase().includes(q)
    );
  }

  if (activeDateLabel.value !== "Semua") {
    const now = new Date();
    let days = 30;
    if (activeDateLabel.value === "7 Hari") days = 7;
    if (activeDateLabel.value === "30 Hari") days = 30;
    if (activeDateLabel.value === "60 Hari") days = 60;
    if (activeDateLabel.value === "1 Tahun") days = 365;

    const limitDate = new Date();
    limitDate.setDate(now.getDate() - days);

    result = result.filter(mail => mail.rawDate >= limitDate);
  }

  if (activeSortLabel.value === "Terbaru") {
    result.sort((a, b) => b.rawDate - a.rawDate);
  } else {
    result.sort((a, b) => a.rawDate - b.rawDate);
  }

  return result;
});

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

watch([activeTab, searchQuery, activeFilterType, activeDateLabel, itemsPerPage], () => { currentPage.value = 1; });

const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

const toggleSelection = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};

const toggleSelectAll = () => {
  if (selectedIds.value.size === paginatedEmails.value.length) selectedIds.value.clear();
  else paginatedEmails.value.forEach(mail => selectedIds.value.add(mail.id));
};

const isAllSelected = computed(() => paginatedEmails.value.length > 0 && selectedIds.value.size === paginatedEmails.value.length);
const selectDateFilter = (option) => { activeDateLabel.value = option; showDateMenu.value = false; }
const selectSortOption = (option) => { activeSortLabel.value = option; showSortMenu.value = false; }
const selectPageOption = (option) => { itemsPerPage.value = option; showPageMenu.value = false; }

// LOGIC MODAL & DELETE
const confirmDeleteModal = (mail) => {
  itemToDelete.value = mail; // Jika mail ada, mode single delete
  showDeleteModal.value = true;
};

const confirmBulkDelete = () => {
  itemToDelete.value = null; // null menandakan mode bulk delete
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!user.value?.position) { alert("Gagal menghapus: Data user tidak ditemukan."); return; }

  isDeleting.value = true;
  try {
    if (itemToDelete.value) {
      // Single Delete
      // Tambahkan Number() di sini
      await deleteDraft(itemToDelete.value.id, Number(user.value.position));
      selectedIds.value.delete(itemToDelete.value.id);
    } else {
      // Bulk Delete
      const idsArray = Array.from(selectedIds.value);
      if (idsArray.length > 0) {
        // Tambahkan Number() di sini
        await bulkDeleteDrafts(Number(user.value.position), idsArray);
        selectedIds.value.clear();
      }
    }

    // Refresh opsional karena state local sudah diupdate di useDraft, tapi untuk memastikan sinkronisasi:
    if (drafts.value.length === 0) await refreshData();

    showDeleteModal.value = false;
    itemToDelete.value = null;
  } catch (e) {
    console.error(e);
  } finally {
    isDeleting.value = false;
  }
};

// --- STYLE KATEGORI SESUAI GAMBAR ---
const getCategoryStyle = (cat) => {
  const c = (cat || '').toUpperCase();
  // Nota Dinas (Biru)
  if (['ND'].includes(c)) return 'bg-blue-100 text-blue-600';
  // Disposisi (Ungu)
  if (['DI'].includes(c)) return 'bg-purple-100 text-purple-600';
  // Internal (Hijau)
  if (['SDI'].includes(c)) return 'bg-green-100 text-green-600';
  // Eksternal (Orange/Kuning)
  if (['SDE'].includes(c)) return 'bg-orange-100 text-orange-600';

  // Default/Konsep
  return 'bg-gray-100 text-gray-700';
};
</script>

<template>
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
        <button @click="refreshData"
          class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
          title="Muat Ulang" :disabled="isLoadingDraft">
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': isLoadingDraft }" />
        </button>
        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 mx-1 hidden md:block"></div>
          <div class="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
            <button @click="confirmBulkDelete"
              class="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition-colors"
              title="Hapus Terpilih">
              <Trash2 class="w-4 h-4" />
            </button>
            <span class="text-xs text-neutral-500">{{ selectedIds.size }} dipilih</span>
          </div>
        </template>
      </div>

      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">

        <div class="relative">
          <button @click="showDateMenu = !showDateMenu"
            class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors flex items-center justify-center relative">
            <History class="w-4 h-4" />

            <span v-if="activeDateLabel !== 'Semua'"
              class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white">
            </span>
          </button>

          <div v-if="showDateMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button v-for="opt in dateOptions" :key="opt" @click="selectDateFilter(opt)"
              class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 hover:bg-gray-50 hover:text-primary transition-colors"
              :class="{ 'text-primary font-semibold bg-gray-50': activeDateLabel === opt }">
              {{ opt }}
            </button>
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

        <div class="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

        <div class="flex items-center gap-1">
          <div class="relative">
            <button @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors flex items-center gap-1">
              <Layers class="w-4 h-4" />
            </button>

            <div v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-24 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button v-for="opt in pageOptions" :key="opt" @click="selectPageOption(opt)"
                class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 hover:bg-gray-50 hover:text-primary transition-colors"
                :class="{ 'text-primary font-semibold bg-gray-50': itemsPerPage === opt }">
                {{ opt }} Item
              </button>
            </div>
          </div>

          <div class="flex items-center gap-1 text-caption1 text-neutral-600 shrink-0 h-[34px]">
            <span class="mx-1 font-medium hidden sm:inline whitespace-nowrap text-[12px] text-neutral-500">
              {{ paginationInfo }}
            </span>
            <button class="p-1.5 hover:bg-gray-100 rounded text-neutral-500 disabled:opacity-30" @click="prevPage"
              :disabled="currentPage === 1">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button class="p-1.5 hover:bg-gray-100 rounded text-neutral-500 disabled:opacity-30" @click="nextPage"
              :disabled="currentPage === totalPages">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden relative w-full">

      <div class="flex flex-col bg-white transition-all duration-300 overflow-y-auto overflow-x-hidden flex-1 w-full">

        <div
          class="py-2.5 border-b border-t border-gray-200 bg-white shrink-0 sticky top-0 z-10 w-full overflow-hidden">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full">
            <UButton v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" color="primary" class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0
                active:bg-primary-100 active:text-primary-500 first:ms-2 last:me-2" :class="activeTab === tab.value
                  ? 'bg-primary-400 text-white border-primary-400'
                  : 'bg-white text-primary-500 border-neutral-200/50 hover:bg-primary-50'">
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </UButton>
          </div>
        </div>

        <div class="flex-1 pb-10 w-full relative min-h-[200px]">
          <div v-if="isLoadingDraft" class="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <Loader2 class="w-8 h-8 text-primary animate-spin" />
          </div>

          <div v-else-if="paginatedEmails.length === 0"
            class="flex flex-col items-center justify-center h-full text-neutral-400 mt-10">
            <Inbox class="w-12 h-12 mb-2 opacity-50" />
            <span class="text-sm">Tidak ada draft ditemukan</span>
          </div>

          <div v-else v-for="mail in paginatedEmails" :key="mail.id"
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
                <span class="text-caption2b text-neutral-500 text-[10px] whitespace-nowrap">
                  {{ mail.fullDate }}
                </span>
              </div>

              <div class="flex md:hidden w-full mb-1">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap"
                  :class="getCategoryStyle(mail.category)">
                  {{ mail.category_text }}
                </span>
              </div>

              <span class="w-full md:w-48 xl:w-64 truncate text-[13px] text-neutral-900 shrink-0 font-semibold">
                {{ mail.from }}
              </span>

              <div class="flex-1 min-w-0 flex items-center text-caption1 text-neutral-500 overflow-hidden w-full">
                <span class="text-neutral-900 truncate mr-1 w-full md:w-auto text-[13px] font-medium">
                  {{ mail.subject }}
                </span>
              </div>

              <div class="hidden md:flex shrink-0 w-[140px]">
                <span class="px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap"
                  :class="getCategoryStyle(mail.category)">
                  {{ mail.category_text }}
                </span>
              </div>

            </div>

            <div class="hidden md:flex pl-2 shrink-0 justify-end w-[130px]">
              <span class="text-caption2b text-neutral-500 text-[12px] whitespace-nowrap truncate">
                {{ mail.fullDate }}
              </span>
            </div>

            <div class="pl-2 sm:pl-5 shrink-0 flex justify-end gap-1 sm:gap-2 mt-0.5 md:mt-0">
              <button class="text-primary hover:text-neutral-800 transition-colors p-1" title="Edit"
                @click.stop="handleEdit(mail)">
                <Edit class="w-4 h-4" />
              </button>

              <button class="text-error hover:text-red-800 transition-colors p-1" title="Hapus"
                @click.stop="confirmDeleteModal(mail)">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>


    <Teleport to="body">
      <div v-if="showDeleteModal"
        class="fixed inset-0 z-99 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="p-5 text-center">
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle class="w-6 h-6 text-red-600" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Hapus Draft?</h3>

            <p class="text-sm text-gray-500 mb-6" v-if="itemToDelete">
              Apakah Anda yakin ingin menghapus draft <br>
              <span class="font-semibold text-gray-700">"{{ itemToDelete?.subject }}"</span>? <br>
            </p>
            <p class="text-sm text-gray-500 mb-6" v-else>
              Apakah Anda yakin ingin menghapus <br>
              <span class="font-bold text-gray-800">{{ selectedIds.size }} item terpilih</span>?
            </p>

            <p class="text-xs text-red-500 mb-4 font-medium">Tindakan ini tidak dapat dibatalkan.</p>

            <div class="flex gap-3 justify-center">
              <button @click="showDeleteModal = false" :disabled="isDeleting"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors disabled:opacity-50">
                Batal
              </button>
              <button @click="handleDelete" :disabled="isDeleting"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
                {{ isDeleting ? 'Menghapus...' : 'Hapus' }}
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
