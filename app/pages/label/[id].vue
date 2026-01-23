<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import {
  Inbox, FileText, Send, Building, Building2, FilePen,
  Check, X, RotateCw, Eye, Loader2, BookOpen, Trash2,
  ChevronLeft, ChevronRight, Tag
} from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';
import { useLabel } from '~/composables/useLabel';
import { useSirkulasi } from '@/composables/useTerkirim';
import { useInbox } from '@/composables/useInbox'; // [BARU]
import { useDraft } from '@/composables/useDraft'; // [BARU]

// --- TYPE DEFINITIONS ---
interface UIMailItem {
  id: string;
  from: string;
  email: string;
  subject: string;
  body: string;
  category: string;
  date: string;
  fullDate: string;
  initial: string;
  color: string;
  viewCount: number;
  isRead: boolean;
  isFlagged: boolean;
  isLocked: boolean;
  isArchived: boolean;
  recipient: string;
  note: any;
  originalData: any;
  sourceType: 'inbox' | 'sent' | 'draft'; // [BARU] Untuk debugging/styling
}

const route = useRoute();
const toast = useToast();
const { user } = useAuth();

// Destructure composables
const { fetchNaskahByLabel, naskahByLabel } = useLabel();
const { fetchSentBox } = useSirkulasi();
const { fetchInbox } = useInbox();
const { fetchDrafts } = useDraft();

// --- STATE ---
const labelId = computed(() => route.params.id as string);
const labelName = ref("Label View");
const isLoading = ref(false);
const emails = ref<UIMailItem[]>([]);

// --- LOGIC UTAMA: LOAD DATA ---
const loadData = async () => {
  if (!labelId.value) return;
  if (!user.value) return;

  const userPositionId = user.value?.position;
  if (!userPositionId) {
    toast.add({ title: 'Error', description: 'Posisi user tidak ditemukan', color: 'error' });
    return;
  }

  isLoading.value = true;
  emails.value = [];

  try {
    // ----------------------------------------------------------------
    // 1. Ambil Data Label (Daftar ID & Source)
    // ----------------------------------------------------------------
    console.log("1. Fetching Label Data...");
    await fetchNaskahByLabel(labelId.value);

    // Struktur data label berdasarkan JSON Anda:
    // { namaLabel: "Penting", naskah: [{ naskahId: "...", source: "inbox" }, ...] }
    const labelData = naskahByLabel.value;

    if (!labelData) {
      isLoading.value = false;
      return;
    }

    // Set Nama Label
    labelName.value = labelData.namaLabel || labelData.name || "Label View";

    const labeledItems = Array.isArray(labelData.naskah) ? labelData.naskah : [];

    if (labeledItems.length === 0) {
      console.log("Label kosong.");
      isLoading.value = false;
      return;
    }

    // ----------------------------------------------------------------
    // 2. Kelompokkan ID berdasarkan Source
    // ----------------------------------------------------------------
    const inboxIds = new Set<string>();
    const sentIds = new Set<string>();
    const draftIds = new Set<string>();

    labeledItems.forEach((item: any) => {
      const src = (item.source || '').toLowerCase();
      if (src === 'inbox') inboxIds.add(item.naskahId);
      else if (src === 'sent' || src === 'terkirim') sentIds.add(item.naskahId);
      else if (src === 'draft' || src === 'konsep') draftIds.add(item.naskahId);
    });

    console.log(`Source Distribution -> Inbox: ${inboxIds.size}, Sent: ${sentIds.size}, Draft: ${draftIds.size}`);

    // ----------------------------------------------------------------
    // 3. Fetch Data secara Paralel (hanya jika diperlukan)
    // ----------------------------------------------------------------
    const promises = [];

    // Fetch Inbox jika ada ID inbox
    if (inboxIds.size > 0) {
      promises.push(fetchInbox(userPositionId).then((res: any) => ({ type: 'inbox', data: res?.data?.items || [] })));
    } else {
      promises.push(Promise.resolve({ type: 'inbox', data: [] }));
    }

    // Fetch Sent jika ada ID sent
    if (sentIds.size > 0) {
      promises.push(fetchSentBox(userPositionId).then((res: any) => ({ type: 'sent', data: res }))); // Perhatikan fetchSentBox mungkin me-return array langsung atau object wrapper, sesuaikan dengan composable Anda
    } else {
      promises.push(Promise.resolve({ type: 'sent', data: [] }));
    }

    // Fetch Draft jika ada ID draft
    if (draftIds.size > 0) {
      promises.push(fetchDraft(userPositionId).then((res: any) => ({ type: 'draft', data: res?.data?.items || [] })));
    } else {
      promises.push(Promise.resolve({ type: 'draft', data: [] }));
    }

    const results = await Promise.all(promises);

    // ----------------------------------------------------------------
    // 4. Filter & Mapping Data
    // ----------------------------------------------------------------
    let combinedEmails: UIMailItem[] = [];

    for (const result of results) {
      if (result.type === 'inbox') {
        const filtered = result.data.filter((item: any) => inboxIds.has(item.id_naskah));
        combinedEmails.push(...filtered.map(mapInboxToUI));
      }
      else if (result.type === 'sent') {
        // Handle jika structure sent box berbeda (kadang array langsung, kadang .data.items)
        const sentItems = Array.isArray(result.data) ? result.data : (result.data?.data?.items || []);
        const filtered = sentItems.filter((item: any) => sentIds.has(item.id_naskah));
        combinedEmails.push(...filtered.map(mapSentToUI));
      }
      else if (result.type === 'draft') {
        const filtered = result.data.filter((item: any) => draftIds.has(item.id_naskah));
        combinedEmails.push(...filtered.map(mapDraftToUI));
      }
    }

    // ----------------------------------------------------------------
    // 5. Sorting (Terbaru di atas)
    // ----------------------------------------------------------------
    combinedEmails.sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime());

    emails.value = combinedEmails;

  } catch (e: any) {
    console.error("ERROR LOAD DATA:", e);
    toast.add({ title: 'Error', description: 'Gagal memuat data label', color: 'error' });
  } finally {
    isLoading.value = false;
  }
};

// --- MAPPING FUNCTIONS (SESUAI STRUKTUR JSON) ---

// 1. MAPPING INBOX
const mapInboxToUI = (item: any): UIMailItem => {
  // Inbox biasanya punya object 'pengirim'
  const senderName = item.pengirim?.nama || item.pengirim?.position_text || "Tanpa Nama";
  const senderPos = item.pengirim?.organization_text || item.pengirim?.position_text || "";

  return {
    id: item.id_naskah,
    from: senderName,
    email: senderPos,
    subject: item.perihal || "Tanpa Perihal",
    body: item.nomor || '-', // Tampilkan Nomor Surat di body preview
    category: item.jenis || 'ND',
    date: formatDate(item.created_at || item.tanggal),
    fullDate: item.created_at || item.tanggal,
    initial: getInitials(senderName),
    color: getCategoryStyle(item.jenis).split(' ')[0] + ' text-white',
    viewCount: 0, // Inbox jarang ada view count diri sendiri
    isRead: item.status_baca === 'terbaca',
    isFlagged: ['rahasia', 'penting', 'segera'].includes((item.sifat || '').toLowerCase()),
    isLocked: false,
    isArchived: item.is_arsip,
    recipient: "Saya", // Inbox ditujukan ke user
    note: item.sifat,
    originalData: item,
    sourceType: 'inbox'
  };
};

// 2. MAPPING SENT (KOTAK KELUAR)
const mapSentToUI = (item: any): UIMailItem => {
  // Logic penerima seperti kode sebelumnya
  const daftarPenerima = Array.isArray(item.penerima) ? item.penerima : (item.penerima ? [item.penerima] : []);
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

  return {
    id: item.id_naskah,
    from: `Ke: ${displayRecipient}`, // Bedakan tampilan sent
    email: firstRecipientTitle,
    subject: item.perihal || "Tanpa Perihal",
    body: item.nomor || '-',
    category: item.jenis || 'ND',
    date: formatDate(item.created_at || item.tanggal),
    fullDate: item.created_at || item.tanggal,
    initial: getInitials(displayRecipient.replace('Ke: ', '')),
    color: getCategoryStyle(item.jenis).split(' ')[0] + ' text-white',
    viewCount: item.summary_baca?.terbaca || 0,
    isRead: true, // Sent item dianggap read oleh pengirim
    isFlagged: ['rahasia', 'penting', 'segera'].includes((item.sifat || '').toLowerCase()),
    isLocked: item.status === 'final_tte' || item.status === 'final',
    isArchived: item.arsip,
    recipient: daftarPenerima.map((p: any) => p.position_text || p.nama).join(', '),
    note: item.sifat,
    originalData: item,
    sourceType: 'sent'
  };
};

// 3. MAPPING DRAFT (KONSEP)
const mapDraftToUI = (item: any): UIMailItem => {
  // Draft struktur JSON-nya agak beda (isi_pesan, jenis_text)
  const daftarPenerima = item.penerima || [];
  let displayTo = "Draft Kosong";

  if (daftarPenerima.length > 0) {
    displayTo = `${daftarPenerima[0].nama || daftarPenerima[0].position_text}`;
    if (item.penerima_count > 1) displayTo += ` +${item.penerima_count - 1}`;
  }

  return {
    id: item.id_naskah,
    from: "Draft / Konsep",
    email: `Kepada: ${displayTo}`,
    subject: item.isi_pesan || item.perihal || "(Tanpa Judul)", // Draft kadang pakai isi_pesan
    body: "Belum dikirim",
    category: item.jenis || 'KONSEP',
    date: formatDate(item.tanggal || item.waktu),
    fullDate: item.tanggal, // Draft pakai tanggal/waktu
    initial: 'D',
    color: 'bg-gray-400 text-white',
    viewCount: 0,
    isRead: true,
    isFlagged: false,
    isLocked: false,
    isArchived: false,
    recipient: daftarPenerima.map((p: any) => p.nama).join(', '),
    note: 'Konsep',
    originalData: item,
    sourceType: 'draft'
  };
};

// --- HELPER FUNCTIONS ---
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const dateObj = new Date(dateString);
  return dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

watch(
  [() => user.value, labelId],
  ([newUser, newLabelId]) => {
    if (newUser && newLabelId) {
      loadData();
    }
  },
  { immediate: true }
);

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS'].includes(c)) return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300';
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c)) return 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300';
  if (['SDE', 'EKSTERNAL', 'SURAT DINAS EKSTERNAL'].includes(c)) return 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300';
  if (['KAJIAN', 'KA'].includes(c)) return 'bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300';
  return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
};

const getCategoryLabel = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['KA'].includes(c)) return 'KA';
  if (['SDI', 'INTERNAL'].includes(c)) return 'SDI';
  if (['SDE', 'EKSTERNAL'].includes(c)) return 'SDE';
  if (['ND', 'NOTA DINAS'].includes(c)) return 'ND';
  if (['DI', 'DISPOSISI'].includes(c)) return 'DI';
  return 'K';
};

// --- UI LOGIC (Filter, Sort, dll - TETAP SAMA) ---
const selected = ref<UIMailItem | null>(null);
const selectedIds = ref(new Set<string>());
const activeTab = ref("ALL");
const searchQuery = ref("");
const itemsPerPage = ref(10);
const currentPage = ref(1);

const filteredEmails = computed(() => {
  let result = emails.value;
  if (activeTab.value !== "ALL") {
    const tab = activeTab.value;
    let targetCats = [tab];
    if (tab === 'SDI') targetCats = ['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'];
    else if (tab === 'SDE') targetCats = ['SDE', 'EKSTERNAL', 'SURAT DINAS EKSTERNAL'];
    else if (tab === 'DI') targetCats = ['DI', 'DISPOSISI'];
    else if (tab === 'ND') targetCats = ['ND', 'NOTA DINAS'];
    else if (tab === 'KONSEP') targetCats = ['KONSEP']; // Tambahan untuk tab konsep

    // Filter khusus jika tab KONSEP dipilih, cek sourceType
    if (tab === 'KONSEP') {
      result = result.filter(mail => mail.sourceType === 'draft');
    } else {
      result = result.filter(mail => targetCats.includes((mail.category || '').toUpperCase()));
    }
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(mail =>
      mail.subject.toLowerCase().includes(q) ||
      mail.from.toLowerCase().includes(q) ||
      mail.body.toLowerCase().includes(q)
    );
  }
  return result;
});

const paginatedEmails = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredEmails.value.slice(start, start + itemsPerPage.value);
});

const totalItems = computed(() => filteredEmails.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value) || 1);
const paginationInfo = computed(() => {
  if (totalItems.value === 0) return "0-0 Dari 0";
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(start + itemsPerPage.value - 1, totalItems.value);
  return `${start}-${end} Dari ${totalItems.value}`;
});

const refreshData = () => { loadData(); selectedIds.value.clear(); };
const selectMail = (mail: UIMailItem) => { selected.value = mail; };
const closeDetail = () => { selected.value = null; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const toggleSelectAll = () => { if (selectedIds.value.size === paginatedEmails.value.length) selectedIds.value.clear(); else paginatedEmails.value.forEach(m => selectedIds.value.add(m.id)); };
const isAllSelected = computed(() => paginatedEmails.value.length > 0 && selectedIds.value.size === paginatedEmails.value.length);
const toggleSelection = (id: string) => { if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id); };

// Modal logic (Reader)
const showReaderModal = ref(false);
const currentReaderData = ref({ subject: '', readList: [] as any[], unreadList: [] as any[] });
const openReaderModal = (mail: UIMailItem) => {
  const item = mail.originalData;
  const penerima = item.penerima || [];

  // Handle perbedaan struktur Draft vs Sent/Inbox
  const listPenerima = Array.isArray(penerima) ? penerima : [penerima];

  const read = listPenerima.filter((p: any) => p.status_baca === 'terbaca').map((p: any) => ({
    name: p.nama, position: p.position_text, date: '-', initial: (p.nama || '?').substring(0, 1), bg: 'bg-blue-500'
  }));
  const unread = listPenerima.filter((p: any) => p.status_baca !== 'terbaca').map((p: any) => ({
    name: p.nama, position: p.position_text, status: 'Belum', initial: (p.nama || '?').substring(0, 1), bg: 'bg-gray-400'
  }));

  currentReaderData.value = {
    subject: mail.subject,
    readList: read,
    unreadList: unread
  };
  showReaderModal.value = true;
};

const tabs = [
  { label: "Semua", value: "ALL", icon: Inbox },
  { label: "Nota Dinas", value: "ND", icon: FileText },
  { label: "Disposisi", value: "DI", icon: Send },
  { label: "Internal", value: "SDI", icon: Building },
  { label: "Eksternal", value: "SDE", icon: Building2 },
  { label: "Konsep", value: "KONSEP", icon: FilePen },
];

const getDetailRoute = (item: UIMailItem) => {
  // Routing dinamis berdasarkan source
  if (item.sourceType === 'draft') {
    return { path: `/korespondensi/konsep/${item.id}` }; // Asumsi route draft
  }
  if (item.sourceType === 'inbox') {
    return { path: `/korespondensi/surat-masuk/${item.id}`, query: { jenis: item.category } };
  }
  // Sent
  return { path: `/korespondensi/terkirim/${item.id}`, query: { jenis: item.category } };
};
</script>

<template>
  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue">

    <div
      class="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors">
      <div class="flex items-center gap-2">
        <div
          class="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg border border-primary-100 dark:border-primary-800">
          <Tag class="w-4 h-4" />

          <span class="font-bold text-sm">{{ labelName }}</span>

        </div>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-2"></div>

        <div class="p-1.5 rounded hover:bg-gray-100 cursor-pointer group" @click="toggleSelectAll">
          <div class="w-3.5 h-3.5 border-[1.5px] border-gray-400 rounded-sm flex items-center justify-center"
            :class="{ 'bg-primary border-primary': isAllSelected }">
            <Check v-if="isAllSelected" class="w-3 h-3 text-white" />
          </div>
        </div>

        <button @click="refreshData" class="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Muat Ulang">
          <RotateCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>

        <button v-if="selectedIds.size > 0" class="p-1.5 text-red-500 hover:bg-red-50 rounded">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative">
          <input v-model="searchQuery" placeholder="Cari..."
            class="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary w-40 transition-all focus:w-60" />
          <Eye class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
        </div>
        <div class="flex items-center gap-1">
          <button class="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30" @click="prevPage"
            :disabled="currentPage === 1">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-xs text-gray-500">{{ paginationInfo }}</span>
          <button class="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30" @click="nextPage"
            :disabled="currentPage === totalPages">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden relative w-full">
      <div
        class="flex flex-col bg-white dark:bg-gray-900 transition-all duration-300 border-r border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden"
        :class="selected ? 'hidden lg:flex lg:w-5/12 xl:w-[450px] shrink-0' : 'flex-1 w-full'">

        <div
          class="py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 sticky top-0 z-10 w-full overflow-hidden">
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full px-2">
            <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
              class="px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
              :class="activeTab === tab.value ? 'bg-primary-50 text-primary-600 border-primary-200' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'">
              <component :is="tab.icon" class="w-3 h-3" />{{ tab.label }}
            </button>
          </div>
        </div>

        <div class="flex-1 w-full relative">
          <div v-if="isLoading" class="p-10 text-center text-gray-400 flex flex-col items-center">
            <Loader2 class="w-8 h-8 animate-spin mb-2" />
            <span class="text-sm">Memuat data label...</span>
          </div>

          <div v-else-if="paginatedEmails.length === 0"
            class="flex flex-col items-center justify-center h-64 text-gray-500">
            <Tag class="w-10 h-10 mb-2 opacity-20" />
            <span class="text-sm">Label ini kosong</span>
          </div>

          <div v-else v-for="mail in paginatedEmails" :key="mail.id" @click="selectMail(mail)"
            class="group flex gap-3 items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:shadow-sm cursor-pointer transition-colors relative w-full"
            :class="selected?.id === mail.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'">

            <div class="flex items-center shrink-0" @click.stop>
              <div
                class="w-3.5 h-3.5 border-[1.5px] border-gray-400 rounded-sm flex items-center justify-center cursor-pointer"
                :class="selectedIds.has(mail.id) ? 'bg-primary border-primary' : 'bg-white'"
                @click="toggleSelection(mail.id)">
                <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
              </div>
            </div>

            <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4 overflow-hidden">
              <div class="flex items-center sm:basis-[35%] sm:min-w-[180px] shrink-0">
                <div class="text-[13px] text-gray-600 font-bold truncate" :title="mail.from">{{ mail.from }}</div>
              </div>
              <div class="text-[13px] text-gray-900 truncate flex-1">{{ mail.subject }}</div>

              <div class="hidden xl:flex shrink-0">
                <span class="px-2 py-0.5 rounded text-[10px] font-medium" :class="getCategoryStyle(mail.category)">
                  {{ getCategoryLabel(mail.category) }}
                </span>
              </div>
            </div>

            <div class="pl-2 shrink-0 text-right w-20 text-[11px] text-gray-400">
              {{ mail.date }}
            </div>

            <div class="ml-2 p-1 rounded hover:bg-gray-200 cursor-pointer text-gray-400 flex items-center gap-1"
              @click.stop="openReaderModal(mail)">
              <Eye class="w-3.5 h-3.5" />
              <span class="text-[10px]">{{ mail.viewCount }}</span>
            </div>

          </div>
        </div>
      </div>

      <div v-if="selected"
        class="flex flex-col bg-white dark:bg-gray-900 absolute inset-0 z-40 lg:static lg:flex-1 lg:z-0 animate-in slide-in-from-right-8 duration-200 border-l border-gray-200 dark:border-gray-800">
        <div class="flex items-start justify-between px-6 pt-5 pb-2">
          <h2 class="text-xl text-gray-800 leading-tight pr-4 font-normal">{{ selected.subject }}</h2>
          <button class="p-1.5 hover:bg-gray-100 rounded text-gray-500" @click="closeDetail">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="px-6 pb-4 pt-2 border-b border-gray-100">
          <div class="flex gap-3 items-center">
            <div class="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
              {{ getInitials(selected.originalData.pengirim.nama) }}
            </div>
            <div>
              <div class="text-sm font-bold text-gray-900">{{ selected.originalData.pengirim.nama }}</div>
              <div class="text-xs text-gray-500">{{ selected.originalData.pengirim.position_text }}</div>
            </div>
          </div>
          <div class="mt-3">
            <span class="px-3 py-1 rounded-full text-xs font-medium" :class="getCategoryStyle(selected.category)">
              {{ getCategoryLabel(selected.category) }}
            </span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6">
          <div class="space-y-4">
            <div>
              <div class="text-xs text-gray-500">Nomor Surat</div>
              <div class="text-sm text-gray-900">{{ selected.body }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Penerima</div>
              <div class="text-sm text-gray-900">{{ selected.recipient }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Sifat</div>
              <div class="text-sm text-gray-900 capitalize">{{ selected.note }}</div>
            </div>
          </div>
        </div>

        <div class="p-6 pt-4 border-t border-gray-100">
          <NuxtLink :to="getDetailRoute(selected)"
            class="flex items-center justify-center w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary-600 transition-colors">
            Lihat Detail Lengkap
          </NuxtLink>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showReaderModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div class="flex justify-between p-4 border-b">
            <h3 class="font-bold">Status Baca</h3>
            <button @click="showReaderModal = false">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-4 max-h-[60vh] overflow-y-auto">
            <div v-for="(u, i) in currentReaderData.unreadList" :key="'u' + i" class="flex gap-3 mb-3 items-center">
              <div
                class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
                {{ u.initial }}</div>
              <div>
                <div class="text-sm font-bold">{{ u.position }}</div>
                <div class="text-xs text-gray-500">{{ u.name }}</div>
              </div>
              <span class="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">Belum</span>
            </div>
            <div v-for="(r, i) in currentReaderData.readList" :key="'r' + i" class="flex gap-3 mb-3 items-center">
              <div
                class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                {{ r.initial }}</div>
              <div>
                <div class="text-sm font-bold">{{ r.position }}</div>
                <div class="text-xs text-gray-500">{{ r.name }}</div>
              </div>
              <span class="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Dibaca</span>
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
