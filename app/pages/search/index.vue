<template>
  <div class="min-h-screen bg-gray-50/50 dark:bg-gray-900">
    <div class="mx-auto space-y-6">
      <div class="flex flex-col gap-1 mb-5">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Hasil Pencarian
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          Ditemukan
          <span class="font-semibold text-gray-900 dark:text-white">{{
            pagination?.total || 0
          }}</span>
          data untuk:
          <span
            v-if="searchFilters.length === 0"
            class="font-semibold text-gray-900 dark:text-white"
            >"Semua"</span
          >
          <span v-else class="inline-flex flex-wrap gap-1">
            <span v-for="(filter, index) in searchFilters" :key="index">
              <span v-if="index > 0" class="text-gray-500 mr-1">,</span>
              <span v-if="filter.label" class="font-normal text-gray-500 dark:text-gray-400">
                {{ filter.label }}:
              </span>
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ filter.value }}
              </span>
            </span>
          </span>
        </p>
      </div>
      <div
        v-if="isLoading"
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800"
      >
        <div
          class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center"
        >
          <div class="h-5 w-1/3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
          <div class="h-8 w-1/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="i in 5" :key="i" class="p-6 animate-pulse flex flex-col md:flex-row gap-4">
            <div class="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full shrink-0"></div>
            <div class="w-1/4 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div class="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div class="w-20 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
      <div
        v-else-if="!results || results.length === 0"
        class="text-center py-20 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 border-dashed"
      >
        <UIcon
          name="i-heroicons-document-magnifying-glass"
          class="w-16 h-16 text-gray-300 mx-auto mb-4"
        />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Tidak ada dokumen ditemukan
        </h3>
        <p class="text-gray-500 text-sm mt-1">Coba ubah kata kunci atau filter pencarian Anda.</p>
      </div>
      <div
        v-else
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800"
      >
        <div class="border-b border-gray-100 dark:border-gray-800">
          <div v-if="pagination.total > 0" class="w-full">
            <Pagination
              class="w-full flex justify-between items-center"
              :current-page="page"
              :total-pages="pagination.totalPages"
              :total-items="pagination.total"
              :rows-per-page="limit"
              :rows-options="rowsOptions"
              @update:page="handlePageChange"
              @update:rowsPerPage="handleLimitChange"
            />
          </div>
        </div>
        <ul class="divide-y divide-gray-100 dark:divide-gray-800">
          <li
            v-for="item in results"
            :key="item.id"
            class="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer first:rounded-t-none last:rounded-b-xl"
            @click="openDetail(item)"
          >
            <div class="flex flex-col md:flex-row items-start gap-3 md:gap-4 px-6 py-4">
              <div class="shrink-0 flex items-center justify-center pt-1 md:pt-0">
                <UTooltip :text="getSourceConfig(item).label" :popper="{ placement: 'right' }">
                  <UIcon
                    :name="getSourceConfig(item).icon"
                    class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                  />
                </UTooltip>
              </div>
              <div class="w-full md:w-[28%] shrink-0 min-w-0">
                <div class="flex items-center gap-2">
                  <UTooltip :popper="{ placement: 'top' }" class="max-w-full">
                    <h4
                      class="font-bold text-gray-700 dark:text-gray-200 uppercase truncate text-sm md:text-[13px] tracking-wide hover:text-primary-600 transition-colors cursor-help"
                    >
                      {{ item.pengirim?.jabatan || item.pengirim?.nama || 'TANPA JABATAN' }}
                    </h4>
                    <template #text>
                      <span class="font-medium">{{ item.pengirim?.nama || 'Tanpa Nama' }}</span>
                    </template>
                  </UTooltip>
                </div>
                <div class="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
                  <span class="text-xs text-gray-400">Kepada:</span>
                  <span v-if="item.penerima?.length > 0" class="flex-1 min-w-0">
                    <UTooltip :popper="{ placement: 'bottom-start' }" class="block w-full">
                      <div class="flex items-center w-full cursor-help">
                        <span
                          class="hover:text-gray-600 dark:hover:text-gray-200 transition-colors truncate font-medium text-gray-500 block max-w-full"
                        >
                          {{ item.penerima[0].jabatan || item.penerima[0].nama }}
                        </span>
                        <span
                          v-if="item.penerima.length > 1"
                          class="font-bold text-primary-600 ml-1 shrink-0 text-[10px]"
                        >
                          +{{ item.penerima.length - 1 }}
                        </span>
                      </div>
                      <template #text>
                        <div
                          class="flex flex-col gap-2 py-1 text-left min-w-[200px] max-h-[300px] overflow-y-auto"
                        >
                          <div
                            v-for="(p, idx) in item.penerima"
                            :key="idx"
                            class="border-b border-gray-500/30 pb-1 last:border-0 last:pb-0"
                          >
                            <div class="font-semibold text-xs text-white">
                              {{ p.jabatan || 'Tanpa Jabatan' }}
                            </div>
                            <div class="text-[10px] text-gray-300">{{ p.nama }}</div>
                          </div>
                        </div>
                      </template>
                    </UTooltip>
                  </span>
                  <span v-else>-</span>
                </div>
              </div>
              <div class="flex-1 min-w-0 w-full pl-2">
                <p
                  class="text-gray-600 dark:text-gray-300 text-sm leading-snug line-clamp-2 md:line-clamp-1 group-hover:text-primary-600 transition-colors font-medium"
                >
                  {{ item.perihal || '(Tanpa Perihal)' }}
                </p>
                <div class="flex items-center gap-2 mt-1.5">
                  <span
                    class="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700"
                  >
                    {{ item.nomor }}
                  </span>
                  <UIcon
                    v-if="item.hasAttachment"
                    name="i-heroicons-paper-clip"
                    class="w-3.5 h-3.5 text-gray-400"
                  />
                </div>
              </div>
              <div
                class="w-full md:w-auto shrink-0 flex flex-row md:items-center justify-between md:justify-end gap-4 mt-2 md:mt-0"
              >
                <div class="flex items-center gap-1.5">
                  <span
                    class="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border border-transparent min-w-[60px] text-center"
                    :class="getCategoryStyle(item.jenis)"
                  >
                    {{ getCategoryLabel(item.jenis) }}
                  </span>
                  <span
                    v-if="item.priority"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800"
                  >
                    PRIORITAS
                  </span>
                </div>

                <span
                  class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium min-w-[90px] text-right"
                >
                  {{ formatDate(item.tanggal) }}
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const { fetchSearch, results, pagination, isLoading } = useSearch();

definePageMeta({
  middleware: 'auth'
});

// --- STATE ---
const page = ref(1);
const limit = ref(10);

const rowsOptions = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 }
];

// --- COMPUTED: LABEL PENCARIAN DINAMIS ---
const displaySearchLabel = computed(() => {
  const q = route.query;

  // 1. Jika ada keyword global, tampilkan itu prioritas
  if (q.keyword) return q.keyword;

  // 2. Jika tidak ada keyword, cek parameter filter lainnya
  const ignoredKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'keyword', 'scope']; // ← tambah 'scope'

  // Tambahkan sebelum Object.entries loop
  if (q.scope === 'priority') {
    activeFilters.unshift('Prioritas');
  }
  const keyMap: Record<string, string> = {
    jenis: 'Jenis',
    sifat: 'Sifat',
    status: 'Status',
    from: 'Pengirim',
    to: 'Penerima',
    dateFrom: 'Dari',
    dateTo: 'Sampai',
    nomor: 'No. Surat',
    perihal: 'Perihal',
    hasWords: 'Berisi',
    doesntHave: 'Kecuali'
  };

  // Buat array string "Key: Value"
  const activeFilters = Object.entries(q)
    .filter(([key, value]) => !ignoredKeys.includes(key) && value)
    .map(([key, value]) => {
      const label = keyMap[key] || key;
      if (key === 'hasAttachment') {
        return value === 'true' ? 'Ada Lampiran' : 'Tanpa Lampiran';
      }
      return `${label}: ${value}`;
    });

  // ← setelah deklarasi, baru boleh unshift
  if (q.scope === 'priority') {
    activeFilters.unshift('Prioritas');
  }

  // 3. Gabungkan hasilnya
  if (activeFilters.length > 0) {
    return activeFilters.join(', ');
  }

  // 4. Default jika kosong
  return 'Semua';
});

// --- HELPERS ---

// [FIXED] Consolidated getSourceConfig: now returns icon, label AND route in one place
const getSourceConfig = (item: any) => {
  // Cek field penentu, sesuaikan 'folder' atau 'source' atau 'status' sesuai API Anda
  const type = (item.folder || item.source || item.status || '').toLowerCase();

  // Logika Keluar (Sent)
  if (['sent', 'keluar', 'outbox'].some((k) => type.includes(k))) {
    return {
      icon: 'i-lucide-send',
      label: 'Kotak Keluar',
      route: 'terkirim' // Added route
    };
  }

  // Logika Draft (Konsep)
  if (['draft', 'konsep'].some((k) => type.includes(k))) {
    return {
      icon: 'i-lucide-file-text',
      label: 'Draft',
      route: 'draf' // Added route
    };
  }

  // Default: Masuk (Inbox)
  return {
    icon: 'i-lucide-inbox',
    label: 'Kotak Masuk',
    route: 'kotak-masuk' // Added route
  };
};

// [FIXED] Linking now uses the unified config
const openDetail = (item: any) => {
  if (!item?.id) return;

  const config = getSourceConfig(item);

  navigateTo(`/korespondensi/${config.route}/${item.id}?jenis=${item.jenis || ''}`);
};

const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS'].includes(c))
    return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  if (['DI', 'DISPOSISI'].includes(c))
    return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c))
    return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
  if (['SDE', 'SURAT DINAS EKSTERNAL'].includes(c))
    return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
  if (['KAJIAN', 'KA'].includes(c))
    return 'bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800';

  return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
};

const getCategoryLabel = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['KA', 'KAJIAN'].includes(c)) return 'KA';
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c)) return 'SDI';
  if (['SDE', 'EXTERNAL', 'EKSTERNAL', 'SURAT DINAS EKSTERNAL'].includes(c)) return 'SDE';
  if (['ND', 'NOTA DINAS'].includes(c)) return 'ND';
  if (['DI', 'DISPOSISI'].includes(c)) return 'DI';
  return c || 'UMUM';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// --- ACTIONS ---
// [REMOVED DUPLICATE getSourceConfig HERE]

const handlePageChange = (newPage: number) => {
  page.value = newPage;
  router.push({
    query: { ...route.query, page: newPage }
  });
};

const handleLimitChange = (newLimit: number) => {
  limit.value = newLimit;
  page.value = 1;
  router.push({
    query: { ...route.query, page: 1, limit: newLimit }
  });
};

// --- WATCHER ---
watch(
  () => route.query,
  async (newQuery) => {
    page.value = parseInt((newQuery.page as string) || '1');
    limit.value = parseInt((newQuery.limit as string) || '10');

    await fetchSearch({
      ...newQuery, // Spread semua filter (jenis, sifat, status, dll)
      page: page.value,
      limit: limit.value,
      sortBy: (newQuery.sortBy as string) || 'tanggal',
      sortOrder: (newQuery.sortOrder as string) || 'DESC'
    });
  },
  { immediate: true }
);

// --- COMPUTED: FILTER LIST (ARRAY) ---
const searchFilters = computed(() => {
  const q = route.query;
  const result: { label: string | null; value: string }[] = [];

  if (q.keyword) {
    return [{ label: null, value: `"${q.keyword}"` }];
  }

  // ← tambah 'scope' di sini
  const ignoredKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'keyword', 'scope'];
  const keyMap: Record<string, string> = {
    jenis: 'Jenis',
    sifat: 'Sifat',
    status: 'Status',
    from: 'Pengirim',
    to: 'Penerima',
    dateFrom: 'Dari',
    dateTo: 'Sampai',
    nomor: 'No. Surat',
    perihal: 'Perihal',
    hasWords: 'Berisi',
    doesntHave: 'Kecuali'
  };

  // ← tangani scope=priority di sini
  if (q.scope === 'priority') {
    result.push({ label: null, value: 'Prioritas' });
  }

  Object.entries(q).forEach(([key, value]) => {
    if (ignoredKeys.includes(key) || !value) return;

    let label = keyMap[key] || key;
    let valText = value as string;

    if (key === 'hasAttachment') {
      label = '';
      valText = value === 'true' ? 'Ada Lampiran' : 'Tanpa Lampiran';
    }

    result.push({ label: label || null, value: valText });
  });

  return result;
});
</script>
