<script setup>
import { ref, computed, watch } from "vue";
import {
  Inbox,
  FileText,
  Send,
  Building,
  Building2,
  FilePen,
  Search,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Star,
  Check,
  X,
  Calendar,
  Printer,
  Mail,
  AlertCircle,
  SquareArrowOutUpRight,
  Clock,
  MoreVertical,
  History,
  ArrowUpDown,
  Layers,
  Lock,
  Flag,
  StickyNote,
} from "lucide-vue-next";

import { useInbox } from "~/composables/useInbox";

const { user, getProfile } = useAuth()

// Ambil profil user saat page load
onMounted(async () => {
  if (!user.value) {
    await getProfile()              
  }
})

const positionId = computed(() => user.value?.position || null)

const { items, pending, error, refresh } = useInbox(positionId)

// --- STATE ---
const selected = ref(null);
const selectedIds = ref(new Set());
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
  if (opt === "Terbaru") {
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
  { label: "All", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Konsep", value: "KONSEP", icon: FilePen },
];

const emails = items;

const filteredEmails = computed(() => {
  let result = items.value;

  if (activeTab.value !== "ALL")
    result = result.filter((mail) => mail.category === activeTab.value);

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (mail) =>
        (mail.subject || "").toLowerCase().includes(q) ||
        (mail.from || "").toLowerCase().includes(q)
    );
  }

  // filter tambahan...
  if (activeFilterType.value === "Favorite")
    result = result.filter((a) => a.isStarred);

  return result;
});
const totalItems = computed(() => filteredEmails.value.length);
const totalPages = computed(
  () => Math.ceil(totalItems.value / itemsPerPage.value) || 1
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
const selectMail = (mail) => {
  selected.value = mail;
  if (!mail.isRead) mail.isRead = true;
};
const closeDetail = () => {
  selected.value = null;
};

const getCategoryStyle = (cat) => {
  switch (cat) {
    case "ND":
      return "bg-blue-100 text-blue-700";
    case "DISPOSISI":
      return "bg-purple-100 text-purple-700";
    case "INTERNAL":
      return "bg-blue-100 text-blue-700";
    case "EXTERNAL":
      return "bg-indigo-100 text-indigo-700";
    case "KONSEP":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-50 text-gray-600";
  }
};
// Update Label agar sesuai gambar (Opsional, tapi visual jadi lebih pas)
const getCategoryLabel = (cat) => {
  if (cat === "INTERNAL") return "SDI";
  if (cat === "EXTERNAL") return "SDE";
  if (cat === "ND") return "Nota Dinas"; // Update label ND
  return cat;
};
</script>

<template>
  <div
    class="w-full h-screen flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-lg"
    :class="['glass-blue']"
  >
    <div
      class="h-14 border-b border-transparent flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white"
    >
      <div class="flex items-center gap-1 shrink-0 relative">
        <div
          class="p-1.5 rounded hover:bg-gray-100 cursor-pointer transition-colors group"
          @click="toggleSelectAll"
        >
          <div
            class="w-3.5 h-3.5 border-[1.5px] border-gray-400 rounded-sm flex items-center justify-center transition-colors"
            :class="{
              'bg-primary border-primary': isAllSelected,
              'group-hover:border-gray-600': !isAllSelected,
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
            class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
            :class="{ 'bg-gray-100 text-neutral-900': showFilterMenu }"
            title="Opsi Filter"
          >
            <MoreVertical class="w-4 h-4" />
          </button>
          <div
            v-if="showFilterMenu"
            @click="showFilterMenu = false"
            class="fixed inset-0 z-40 bg-transparent"
          ></div>
          <div
            v-if="showFilterMenu"
            class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <button
              v-for="opt in filterMenuOptions"
              :key="opt.value"
              @click="applyFilter(opt.value)"
              class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 hover:bg-gray-50 flex items-center justify-between group transition-colors"
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
          class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
          title="Muat Ulang"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
        <template v-if="selectedIds.size > 0">
          <div class="w-px h-5 bg-gray-200 mx-1 hidden md:block"></div>
          <div
            class="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200"
          >
            <button
              class="p-1.5 text-neutral-500 hover:bg-red-50 hover:text-error rounded"
            >
              <Trash2 class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 text-neutral-500 hover:bg-blue-50 hover:text-primary rounded hidden sm:block"
            >
              <Archive class="w-4 h-4" />
            </button>
          </div>
        </template>
      </div>

      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">
        <!-- <div class="relative hidden md:block group mr-1">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari..."
            class="pl-8 pr-3 py-1.5 text-caption1 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-primary transition-all w-32 lg:w-48 placeholder:text-neutral-400"
          />
        </div>
=======
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary" />
          <input v-model="searchQuery" type="text" placeholder="Cari..."
            class="pl-8 pr-3 py-1.5 text-caption1 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-primary transition-all w-32 lg:w-48 placeholder:text-neutral-400">
        </div> -->
        <div class="relative">
          <button
            @click="showDateMenu = !showDateMenu"
            class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
            title="Periode Data"
          >
            <History class="w-4 h-4" />
          </button>
          <div
            v-if="showDateMenu"
            @click="showDateMenu = false"
            class="fixed inset-0 z-40 bg-transparent"
          ></div>
          <div
            v-if="showDateMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <button
              v-for="opt in dateOptions"
              :key="opt"
              @click="selectDateFilter(opt)"
              class="w-full text-left px-3 py-2 text-[13px] text-neutral-700 hover:bg-gray-100 flex items-center justify-between"
            >
              <span>{{ opt }}</span>
              <Check
                v-if="activeDateLabel === opt"
                class="w-3 h-3 text-primary"
              />
            </button>
          </div>
        </div>
        <div class="relative">
          <button
            @click="showSortMenu = !showSortMenu"
            class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
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
            class="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <button
              v-for="opt in sortOptions"
              :key="opt"
              @click="selectSortOption(opt)"
              class="w-full text-left px-3 py-2 text-[13px] text-neutral-700 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{{ opt }}</span>
              <Check
                v-if="activeSortLabel === opt"
                class="w-3 h-3 text-primary"
              />
            </button>
          </div>
        </div>
        <div class="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>
        <div class="flex items-center gap-1">
          <div class="relative">
            <button
              @click="showPageMenu = !showPageMenu"
              class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
              title="Jumlah per halaman"
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
              class="absolute top-full right-0 mt-1 w-20 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <button
                v-for="size in pageOptions"
                :key="size"
                @click="selectPageSize(size)"
                class="w-full text-center px-3 py-2 text-[13px] text-neutral-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <span
                  :class="itemsPerPage === size ? 'font-bold text-primary' : ''"
                  >{{ size }}</span
                >
              </button>
            </div>
          </div>
          <div
            class="flex items-center gap-1 text-caption1 text-neutral-600 shrink-0 h-[34px]"
          >
            <span
              class="mx-1 font-medium hidden sm:inline whitespace-nowrap text-[12px] text-neutral-500"
              >{{ paginationInfo }}</span
            >
            <button
              class="p-1.5 hover:bg-gray-100 rounded text-neutral-500 disabled:opacity-30 disabled:hover:bg-transparent"
              @click="prevPage"
              :disabled="currentPage === 1"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 hover:bg-gray-100 rounded text-neutral-500 disabled:opacity-30 disabled:hover:bg-transparent"
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
        class="flex flex-col bg-white transition-all duration-300 border-r border-gray-200 overflow-y-auto overflow-x-hidden"
        :class="
          selected
            ? 'hidden lg:flex lg:w-5/12 xl:w-[450px] shrink-0'
            : 'flex-1 w-full'
        "
      >
        <div
          class="px-3 py-2.5 border-b border-gray-200 bg-white shrink-0 sticky top-0 z-10 w-full overflow-hidden"
        >
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full">
            <UButton
              v-for="tab in tabs"
              :key="tab.value"
              @click="activeTab = tab.value"
              color="primary"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 active:bg-primary-100 active:text-primary-500"
              :class="
                activeTab === tab.value
                  ? 'bg-primary-400 text-white border-primary-400'
                  : 'bg-white text-primary-500 border-neutral-200/50 hover:bg-primary-50'
              "
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </UButton>
          </div>
        </div>

        <div class="flex-1 pb-10 w-full">
          <div
            v-for="mail in paginatedEmails"
            :key="mail.id"
            @click="selectMail(mail)"
            class="group flex gap-3 items-start px-4 py-3 border-b border-gray-100 hover:shadow-sm cursor-pointer transition-colors relative w-full min-h-[50px]"
            :class="
              selected?.id === mail.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'
            "
          >
            <div class="flex items-center shrink-0 pt-1 gap-2" @click.stop>
              <div
                class="w-3.5 h-3.5 border-[1.5px] border-gray-400 rounded-sm flex items-center justify-center transition-colors"
                :class="
                  selectedIds.has(mail.id)
                    ? 'bg-primary border-primary'
                    : 'bg-white'
                "
                @click="toggleSelection(mail.id)"
              >
                <Check
                  v-if="selectedIds.has(mail.id)"
                  class="w-3 h-3 text-white"
                />
              </div>
              <Star
                class="w-4 h-4 transition-colors hover:text-yellow-400"
                :class="
                  mail.isStarred
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-neutral-300'
                "
                @click.stop="toggleFavorit(mail.id)"
                title="Favorite"
              />
            </div>

            <div
              class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:gap-4 overflow-hidden pt-0.5"
            >
              <div class="flex items-center sm:w-44 lg:w-52 shrink-0">
                <div
                  v-if="!mail.isRead"
                  class="w-2 h-2 rounded-full bg-blue-600 shrink-0 mr-2"
                  title="Belum Dibaca"
                ></div>

                <div
                  class="text-[11px] text-neutral-500 uppercase truncate font-bold"
                >
                  {{ mail.from }}
                </div>
              </div>

              <div
                class="text-[13px] text-neutral-900 truncate flex-1"
                :class="!mail.isRead ? 'font-bold' : 'font-normal'"
              >
                {{ mail.subject }}
              </div>
            </div>

            <div class="pl-2 shrink-0 pt-0.5 text-right">
              <span
                class="text-caption2b text-neutral-500 text-[12px] whitespace-nowrap"
              >
                {{ mail.date }}
              </span>
            </div>

            <div
              class="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-white shadow-md border border-gray-100 rounded-md px-2 py-1.5 z-10 animate-in fade-in duration-200"
            >
              <div class="flex items-center gap-2 p-1">
                <SquareArrowOutUpRight
                  class="w-4 h-4 transition-colors hover:text-emerald-600"
                  :class="
                    mail.canOpenTab ? 'text-emerald-500' : 'text-neutral-300'
                  "
                  title="Open Tab"
                />
                <Flag
                  class="w-4 h-4 transition-colors hover:text-blue-600"
                  :class="
                    mail.isFlagged
                      ? 'text-blue-500 fill-blue-500'
                      : 'text-neutral-300'
                  "
                  title="Tindak Lanjut"
                />
              <Star
                class="w-4 h-4 transition-colors hover:text-yellow-400"
                :class="
                  mail.isStarred
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-neutral-300'
                "
                @click.stop="toggleFavorit(mail.id)"
                title="Favorite"
              />
                <Lock
                  class="w-4 h-4 transition-colors hover:text-neutral-600"
                  :class="
                    mail.isLocked ? 'text-neutral-500' : 'text-neutral-300'
                  "
                  title="Lock"
                />
                <StickyNote
                  class="w-4 h-4 transition-colors hover:text-amber-500"
                  :class="mail.hasNote ? 'text-amber-500' : 'text-neutral-300'"
                  title="Note"
                />
                <Archive
                  class="w-4 h-4 transition-colors hover:text-purple-600"
                  :class="
                    mail.isArchived ? 'text-purple-500 fill-purple-500' : 'text-neutral-300'
                  "
                  @click.stop="toggleArsip(mail.id)"
                  title="Arsip Flag"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="selected"
        class="flex flex-col bg-white absolute inset-0 z-40 lg:static lg:flex-1 lg:z-0 animate-in slide-in-from-right-8 duration-200 overflow-hidden border-l border-gray-200"
      >
        <div
          class="flex items-start justify-between px-6 py-5 border-b border-transparent shrink-0"
        >
          <h2 class="text-xl font-bold text-gray-900 leading-tight pr-4">
            {{ selected.subject }}
          </h2>
          <button
            class="p-1 hover:bg-gray-100 rounded text-gray-400"
            @click="closeDetail"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 pb-6">
          <div class="flex gap-4 mb-5">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-sm shrink-0"
              :class="selected.color"
            >
              {{ selected.initial }}
            </div>
            <div>
              <div class="font-bold text-gray-900">{{ selected.from }}</div>
              <div class="text-sm text-gray-500">
                &lt;{{ selected.email }}&gt;
              </div>
              <div class="text-xs text-gray-400 mt-0.5">kepada saya</div>
            </div>
          </div>

          <div class="mb-6">
            <span
              class="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm font-medium inline-block"
            >
              {{ getCategoryLabel(selected.category) }}
            </span>
          </div>

          <div class="space-y-4 mb-8">
            <div>
              <div class="text-sm text-gray-500 mb-0.5">Kepada</div>
              <div class="text-base text-gray-900">
                {{ selected.recipient || "-" }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-0.5">Disposisi</div>
              <div class="text-base text-gray-900">
                {{ selected.disposition || "-" }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-0.5">Catatan</div>
              <div class="text-base text-gray-900">
                {{ selected.note || "-" }}
              </div>
            </div>
          </div>

          <div
            class="text-gray-800 leading-relaxed text-[15px] whitespace-pre-wrap"
          >
            {{ selected.body }}
          </div>
        </div>

        <div class="p-6 pt-0 mt-auto bg-white shrink-0">
          <NuxtLink
            :to="`/admin/korespondensi/kotak-masuk/${selected.id}`"
            class="flex items-center justify-center w-full bg-primary hover:bg-primary-600 text-white font-medium py-2 rounded-lg shadow-sm transition-colors"
          >
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
