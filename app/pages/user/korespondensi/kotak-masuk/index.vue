  <script setup>
  import { ref, computed } from "vue";
  import {
    Inbox, FileText, Send, Building, Building2, FilePen,
    Search, Archive, Trash2, ChevronLeft, ChevronRight,
    RotateCcw, Star, Check, X, Calendar,
    Printer, Mail, AlertCircle, SquareArrowOutUpRight, Clock
  } from 'lucide-vue-next';

  // --- STATE ---
  const selected = ref(null);
  const selectedIds = ref(new Set());
  const showDateFilter = ref(false);
  const dateFilterLabel = ref("30 Hari");
  const activeTab = ref("ALL");
  const searchQuery = ref("");

  // Options
  const dateOptions = ["7 Hari", "30 Hari", "60 Hari", "1 Tahun"];
  const tabs = [
    { label: "All", value: "ALL", icon: Inbox },
    { label: "Nota Dinas", value: "ND", icon: FileText },
    { label: "Disposisi", value: "DISPOSISI", icon: Send },
    { label: "Internal", value: "INTERNAL", icon: Building },
    { label: "Eksternal", value: "EXTERNAL", icon: Building2 },
    { label: "Konsep", value: "KONSEP", icon: FilePen },
  ];

  // --- DATA DUMMY ---
  const emails = ref([
    {
      id: 2,
      from: "Siti Rahma",
      email: "siti.rahma@email.com",
      subject: "Undangan Rapat Koordinasi",
      body: "Disposisi Surat Undangan Rapat Koordinasi Mingguan",
      category: "DISPOSISI",
      date: "11-21",
      fullDate: "2025-11-21 11:00",
      initial: "SR",
      color: "bg-sky-100 text-sky-600",
      isRead: true,
      isStarred: false,
      recipient: "Seluruh Staff",
      disposition: "-",
      note: "-"
    },
    {
      id: 3,
      from: "Ahmad Hidayat",
      email: "ahmad.h@email.com",
      subject: "Laporan Kegiatan",
      body: "Laporan Kegiatan Bulan November",
      category: "INTERNAL",
      date: "11-20",
      fullDate: "2025-11-20 09:00",
      initial: "AH",
      color: "bg-emerald-100 text-emerald-600",
      isRead: true,
      isStarred: false,
      recipient: "IT Manager",
      disposition: "Arsipkan",
      note: "Server aman."
    },
    {
      id: 1,
      from: "Budi Santoso",
      email: "budi.santoso@email.com",
      subject: "Pengajuan Anggaran Q1 2025",
      body: "Berikut terlampir draft pengajuan anggaran untuk kuartal pertama tahun 2025.",
      category: "ND",
      date: "11-21",
      fullDate: "2025-11-21 14:36",
      initial: "BS",
      color: "bg-purple-100 text-purple-600",
      isRead: false,
      isStarred: false,
      recipient: "Kepala Divisi Keuangan",
      disposition: "Mohon analisa kelayakan",
      note: "Segera proses sebelum akhir bulan."
    },
    {
      id: 4,
      from: "PT. Mitra Sejahtera",
      email: "info@mitrasejahtera.com",
      subject: "Penawaran Kerjasama Distribusi Logistik",
      body: "PT. Mitra Sejahtera bermaksud menawarkan kerjasama strategis dalam bidang distribusi.",
      category: "EXTERNAL",
      date: "11-20",
      fullDate: "2025-11-20 14:20",
      initial: "MS",
      color: "bg-indigo-600 text-white",
      isRead: false,
      isStarred: true,
      recipient: "Direktur Utama",
      disposition: "Mohon ditinjau",
      note: "Penawaran menarik untuk dipertimbangkan"
    },
  ]);

  // --- LOGIC ---
  const filteredEmails = computed(() => {
    let result = emails.value;
    if (activeTab.value !== "ALL") {
      result = result.filter(mail => mail.category === activeTab.value);
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      result = result.filter(mail =>
        mail.subject.toLowerCase().includes(q) ||
        mail.from.toLowerCase().includes(q)
      );
    }
    return result;
  });

  const toggleSelection = (id) => {
    if (selectedIds.value.has(id)) selectedIds.value.delete(id);
    else selectedIds.value.add(id);
  };

  const toggleSelectAll = () => {
    if (selectedIds.value.size === filteredEmails.value.length) selectedIds.value.clear();
    else filteredEmails.value.forEach(mail => selectedIds.value.add(mail.id));
  };

  const isAllSelected = computed(() => filteredEmails.value.length > 0 && selectedIds.value.size === filteredEmails.value.length);

  const selectMail = (mail) => {
    selected.value = mail;
    if (!mail.isRead) mail.isRead = true;
  };

  const closeDetail = () => {
    selected.value = null;
  };

  // Helpers Style
  const getCategoryStyle = (cat) => {
    switch (cat) {
      case 'ND': return 'bg-blue-100 text-blue-700';
      case 'DISPOSISI': return 'bg-purple-100 text-purple-700';
      case 'INTERNAL': return 'bg-blue-100 text-blue-700';
      case 'EXTERNAL': return 'bg-indigo-100 text-indigo-700';
      case 'KONSEP': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getCategoryLabel = (cat) => {
    if (cat === 'INTERNAL') return 'SDI';
    if (cat === 'EXTERNAL') return 'SDE';
    return cat;
  }
</script>

  <template>
    <div
      class="w-full h-screen flex flex-col bg-white overflow-hidden max-w-full font-sans rounded-xl shadow-lg border-gray-100">

      <div class="h-14 border-b border-gray-200 flex items-center justify-between px-3 shrink-0 z-30 min-w-0">

        <div class="flex items-center gap-1 shrink-0">
          <div class="p-1.5 rounded hover:bg-gray-100 cursor-pointer transition-colors group" @click="toggleSelectAll">
            <div
              class="w-3.5 h-3.5 border-[1.5px] border-gray-400 rounded-sm flex items-center justify-center transition-colors"
              :class="{ 'bg-primary border-primary': isAllSelected, 'group-hover:border-gray-600': !isAllSelected }">
              <Check v-if="isAllSelected" class="w-3 h-3 text-white" stroke-width="3" />
            </div>
          </div>

          <button class="p-1.5 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 rounded transition-colors"
            title="Muat Ulang">
            <RotateCcw class="w-4 h-4" />
          </button>

          <template v-if="selectedIds.size > 0">
            <div class="w-px h-5 bg-gray-200 mx-1 hidden md:block"></div>
            <div class="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
              <button class="p-1.5 text-neutral-500 hover:bg-red-50 hover:text-error rounded">
                <Trash2 class="w-4 h-4" />
              </button>
              <button class="p-1.5 text-neutral-500 hover:bg-blue-50 hover:text-primary rounded hidden sm:block">
                <Archive class="w-4 h-4" />
              </button>
            </div>
          </template>
        </div>

        <div class="flex items-center gap-2 shrink-0 min-w-0">
          <div class="relative hidden md:block group">
            <Search
              class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary" />
            <input v-model="searchQuery" type="text" placeholder="Cari..."
              class="pl-8 pr-3 py-1.5 text-caption1 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-primary transition-all w-32 lg:w-56 placeholder:text-neutral-400">
          </div>

          <div class="relative shrink-0">
            <button @click="showDateFilter = !showDateFilter"
              class="flex items-center gap-2 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md text-caption1m text-neutral-700 transition-colors border border-transparent hover:border-gray-200">
              <Calendar class="w-3.5 h-3.5 text-neutral-500" />
              <span class="hidden sm:inline whitespace-nowrap">{{ dateFilterLabel }}</span>
            </button>
          </div>

          <div class="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

          <div class="flex items-center gap-1 text-caption1 text-neutral-500 shrink-0">
            <button class="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span class="mx-1 font-medium hidden sm:inline">1-5</span>
            <button class="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden relative w-full">

        <div
          class="flex flex-col bg-white transition-all duration-300 border-r border-gray-200 overflow-y-auto overflow-x-hidden"
          :class="selected ? 'hidden lg:flex lg:w-5/12 xl:w-[450px] shrink-0' : 'flex-1 w-full'">

          <div class="px-3 py-2.5 border-b border-gray-200 bg-white shrink-0 sticky top-0 z-10 w-full overflow-hidden">
            <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full">
              <UButton v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" color="primary" class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0
                active:bg-primary-100 active:text-primary-500" :class="activeTab === tab.value
                  ? 'bg-primary-400 text-white border-primary-400'
                  : 'bg-white text-primary-500 border-neutral-200/50 hover:bg-primary-50'">
                <component :is="tab.icon" class="w-4 h-4" />
                {{ tab.label }}
              </UButton>
            </div>
          </div>

          <div class="flex-1 pb-10 w-full">
            <div v-for="mail in filteredEmails" :key="mail.id" @click="selectMail(mail)"
              class="group flex gap-2 items-center px-4 py-3 border-b border-gray-100 hover:shadow-sm cursor-pointer transition-colors relative w-full h-[48px]"
              :class="selected?.id === mail.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'">
              <div class="flex items-center gap-3 pr-2 shrink-0" @click.stop>
                <div
                  class="w-3.5 h-3.5 border-[1.5px] border-gray-400 rounded-sm flex items-center justify-center transition-colors"
                  :class="selectedIds.has(mail.id) ? 'bg-primary border-primary' : 'bg-white'"
                  @click="toggleSelection(mail.id)">
                  <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
                </div>
                <Star class="w-4 h-4 cursor-pointer transition-colors"
                  :class="mail.isStarred ? 'fill-warning text-warning' : 'text-gray-400 hover:text-warning'"
                  @click="mail.isStarred = !mail.isStarred" />
              </div>
              <div class="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">

                <span class="w-28 md:w-40 xl:w-44 truncate text-[13px] text-neutral-900 shrink-0"
                  :class="!mail.isRead ? 'font-bold' : 'font-semibold'">
                  {{ mail.from }}
                </span>

                <div class="flex-1 min-w-0 flex items-center text-caption1 text-neutral-500 overflow-hidden">
                  <span class="text-neutral-900 truncate mr-1 max-w-[60%] md:max-w-none text-[13px]"
                    :class="!mail.isRead ? 'font-bold' : 'font-medium'">
                    {{ mail.subject }}
                  </span>
                </div>

                <div class="hidden xl:flex shrink-0">
                  <span class="px-2 py-[1px] rounded-full text-[11px] font-semibold whitespace-nowrap"
                    :class="getCategoryStyle(mail.category)">
                    {{ getCategoryLabel(mail.category) }}
                  </span>
                </div>
              </div>

              <div class="pl-2 shrink-0 flex justify-end w-[65px] md:w-[75px]">

                <span class="text-caption2b text-neutral-500 text-[12px] group-hover:hidden whitespace-nowrap">
                  {{ mail.date }}
                </span>

                <div class="hidden group-hover:flex items-center gap-2 bg-white/90 backdrop-blur-sm pl-2 justify-end">
                  <button class="text-neutral-500 hover:text-primary transition-colors" title="Arsip">
                    <Archive class="w-3.5 h-3.5" />
                  </button>
                  <button class="text-neutral-500 hover:text-error transition-colors" title="Hapus">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                  <button class="text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:block"
                    title="Tandai">
                    <Mail class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div v-if="selected"
          class="flex flex-col bg-white absolute inset-0 z-40 lg:static lg:flex-1 lg:z-0 animate-in slide-in-from-right-8 duration-200 overflow-hidden border-l border-gray-200">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
            <button class="lg:hidden mr-2 p-1.5 hover:bg-gray-100 rounded-full" @click="closeDetail">
              <ChevronLeft class="w-5 h-5" />
            </button>

            <h2 class="text-body1b text-neutral-900 truncate flex-1 pr-4">
              {{ selected.subject }}
            </h2>

            <div class="flex items-center gap-1 text-neutral-500 shrink-0">
              <button class="p-1.5 hover:bg-gray-100 rounded hidden sm:block">
                <Printer class="w-4 h-4" />
              </button>
              <button class="p-1.5 hover:bg-gray-100 rounded" @click="closeDetail">
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-5 scroll-smooth">
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-3 overflow-hidden">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center text-body1b text-white shadow-sm shrink-0"
                  :class="selected.color.split(' ')[0]">
                  {{ selected.initial }}
                </div>
                <div class="min-w-0">
                  <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <span class="text-body2b text-neutral-900 truncate">{{ selected.from }}</span>
                    <!-- <span class="text-caption1 text-neutral-500 truncate">&lt;{{ selected.email }}&gt;</span> -->
                  </div>
                  <div class="text-caption2 text-neutral-400">kepada saya</div>
                </div>
              </div>
              <div
                class="text-caption2 text-neutral-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 shrink-0 whitespace-nowrap ml-2">
                {{ selected.fullDate }}
              </div>
            </div>

            <div class="bg-gray-50/50 border border-gray-100 rounded-lg p-4 mb-6 space-y-3">
              <div class="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-2 items-center">
                <span class="text-caption2b text-neutral-400 uppercase tracking-wider">Kategori</span>
                <div>
                  <span class="px-2 py-0.5 rounded text-caption2b border inline-block"
                    :class="getCategoryStyle(selected.category)">
                    {{ getCategoryLabel(selected.category) }}
                  </span>
                </div>
              </div>
              <div class="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-2 items-start">
                <span class="text-caption2b text-neutral-400 uppercase tracking-wider pt-0.5">Catatan</span>
                <p class="text-caption1 text-neutral-600 italic leading-relaxed break-words">"{{ selected.note }}"</p>
              </div>
            </div>

            <div class="prose max-w-none text-body2 text-neutral-800 leading-6 break-words">
              <p>{{ selected.body }}</p>
            </div>
          </div>

          <div class="p-4 border-t border-gray-200 bg-white shrink-0">
            <NuxtLink :to="`/user/kotak-masuk/${selected.id}`"
              class="flex justify-center w-full bg-primary hover:bg-blue-700 text-white text-body2sb py-2.5 rounded-lg shadow-sm transition-all active:scale-[0.98]">
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