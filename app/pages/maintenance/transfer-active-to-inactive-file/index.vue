<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Page Header -->
    <div class="mb-5">
      <PageHeader
        title="Pemindahan Arsip Aktif ke Inaktif"
        :items="items"
      />
    </div>

    <!-- Filter Bar (1 baris: Search + Status + Export + Usul Pindah Arsip) -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <!-- Items per page (custom dropdown — di kiri search) -->
      <div ref="pageSizeRef" class="relative shrink-0 z-30">
        <button
          @click="pageSizeOpen = !pageSizeOpen"
          class="h-10 w-[80px] px-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
        >
          <span>{{ itemsPerPage }}</span>
          <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400" :class="{ 'rotate-180': pageSizeOpen }" />
        </button>
        <div
          v-if="pageSizeOpen"
          class="absolute top-full left-0 mt-1.5 z-50 min-w-[80px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
        >
          <button
            v-for="size in [10, 30, 50]"
            :key="size"
            @click="itemsPerPage = size; currentPage = 1; pageSizeOpen = false"
            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            :class="itemsPerPage === size ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
          >
            {{ size }}
          </button>
        </div>
      </div>
      <!-- Search -->
      <div class="relative flex-1 min-w-[200px]">
        <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="filter.search"
          type="text"
          placeholder="Cari kode berkas, nama berkas, atasan..."
          @input="reload"
          class="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
        />
      </div>
      <!-- Status Filter (custom dropdown) -->
      <div ref="statusRef" class="relative shrink-0 z-30">
        <button
          @click="statusOpen = !statusOpen"
          class="h-10 w-[180px] px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
        >
          <span class="truncate">{{ statusOptions.find(o => o.value === filter.status)?.label ?? 'Semua Status' }}</span>
          <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" :class="{ 'rotate-180': statusOpen }" />
        </button>
        <div
          v-if="statusOpen"
          class="absolute top-full left-0 mt-1.5 z-50 min-w-[180px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden max-h-[300px] overflow-y-auto"
        >
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            @click="filter.status = opt.value; reload(); statusOpen = false"
            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
            :class="filter.status === opt.value ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <!-- Export -->
      <button
        @click="onExport"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap shrink-0"
      >
        <UIcon name="i-lucide-download" class="w-4 h-4" /> Export
      </button>
      <!-- Usul Pindah Arsip -->
      <button
        v-if="isSekretaris"
        @click="openCreateModal"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap shadow-sm shrink-0"
      >
        <UIcon name="i-lucide-plus" class="w-4 h-4" /> Usul Pindah Arsip
      </button>
    </div>

    <!-- Tabel Gabungan -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-[13px] table-fixed">
          <thead class="bg-[#457fb6] text-white text-left">
            <tr>
              <th class="px-3 py-2.5 font-semibold w-[5%]">No</th>
              <th class="px-3 py-2.5 font-semibold w-[15%]">Kode / No. Usulan</th>
              <th class="px-3 py-2.5 font-semibold w-[24%]">Nama Berkas / Perihal</th>
              <th class="px-3 py-2.5 font-semibold w-[14%] hidden lg:table-cell">Klasifikasi</th>
              <th class="px-3 py-2.5 font-semibold w-[12%]">Retensi Habis</th>
              <th class="px-3 py-2.5 font-semibold w-[12%]">Status</th>
              <th class="px-3 py-2.5 font-semibold w-[10%] hidden xl:table-cell">Tanggal</th>
              <th class="px-3 py-2.5 font-semibold text-center w-[8%]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading -->
            <tr v-if="loading">
              <td colspan="8" class="px-3 py-6 text-center text-sm text-gray-400">
                <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin inline mr-1" /> Memuat data...
              </td>
            </tr>
            <!-- Empty -->
            <tr v-else-if="gabunganList.length === 0">
              <td colspan="8" class="px-3 py-10 text-center text-sm text-gray-400">
                <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data</p>
                <p class="text-xs mt-1">Arsip Tertutup dengan retensi habis dan usulan pemindahan akan muncul di sini.</p>
              </td>
            </tr>
            <!-- Rows -->
            <tr
              v-for="(row, idx) in paginatedList"
              :key="row.id"
              class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              @click="openDetail(row)"
            >
                <td class="px-3 py-2 text-gray-500">{{ (currentPage - 1) * itemsPerPage + idx + 1 }}</td>
                <td class="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">
                  <div class="truncate" :title="row.kodeBerkas ?? '-'">{{ row.kodeBerkas ?? '-' }}</div>
                  <div v-if="row.isUsulan" class="text-[11px] text-gray-400 truncate">{{ row.nomorUsulan }}</div>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-300">
                  <div class="truncate" :title="row.perihal">{{ row.perihal }}</div>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                  <div class="truncate" :title="row.klasifikasi ?? '-'">{{ row.klasifikasi ?? '-' }}</div>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatDate(row.tanggalRetensiAktifHabis) }}</td>
                <td class="px-3 py-2">
                  <span :class="statusBadgeClass(row.status as any)" class="text-[11px]">{{ statusLabel(row.status as any) }}</span>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap hidden xl:table-cell">{{ formatDate(row.tanggal) }}</td>
                <td class="px-3 py-2 text-center" @click.stop>
                  <!-- Arsip belum jadi usulan → tombol Pindahkan -->
                  <button
                    v-if="!row.isUsulan && isSekretaris"
                    @click="openCreateModalWithArsip(row)"
                    title="Pindahkan"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors"
                  >
                    <UIcon name="i-lucide-file-up" class="w-4 h-4" />
                  </button>
                  <!-- Usulan DRAFT → tombol Kirim Usulan -->
                  <button
                    v-else-if="row.isUsulan && row.status === 'DRAFT' && isSekretaris"
                    @click="onSendUsulan(row)"
                    title="Kirim ke Atasan Managerial"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors"
                  >
                    <UIcon name="i-lucide-send" class="w-4 h-4" />
                  </button>
                  <!-- Usulan sudah dibuat → tombol Detail -->
                  <button
                    v-else-if="row.isUsulan"
                    @click="openDetail(row)"
                    title="Detail"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors"
                  >
                    <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                  </button>
                </td>
              </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && gabunganList.length > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm">
        <div class="text-gray-500 dark:text-gray-400">
          Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }}–{{ Math.min(currentPage * itemsPerPage, gabunganList.length) }} dari {{ gabunganList.length }} data
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
          </button>
          <span class="text-gray-600 dark:text-gray-300 px-2">
            Hal {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Wizard -->
    <CreateTransferModal
      v-if="isSekretaris"
      v-model="isCreateModalOpen"
      :edit-data="selectedTransfer"
      :preselected-arsip="preselectedArsip"
      :prefill-atasan="prefillAtasan"
      @created="onTransferCreated"
      @updated="onTransferUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useApi } from '~/composables/useApi';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import { useAuth } from '~/composables/useAuth';
import CreateTransferModal from '~/components/transfer-active-to-inactive/CreateTransferModal.vue';
import { formatDate, statusBadgeClass, statusLabel } from '~/utils/transfer-status';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';

definePageMeta({ middleware: ['auth'] });

const { apiGet } = useApi();
const { send, fetchDetail } = useTransferActiveToInactive();
const { user, isSuperadmin, isAdmin } = useAuth();


/** Baris gabungan (arsip belum usulan + usulan sudah dibuat). */
interface GabunganRow {
  id: string;
  isUsulan: boolean;
  nomorUsulan?: string;
  kodeBerkas: string | null;
  perihal: string;
  klasifikasi: string | null;
  tanggalRetensiAktifHabis: string | null;
  atasanName: string | null;
  status: string;
  tanggal: string | null;
}

const gabunganList = ref<GabunganRow[]>([]);
const loading = ref(false);
const preselectedArsip = ref<any | null>(null);
const expandedId = ref<string | null>(null);
/** Pre-fill atasan di CreateTransferModal? false saat buka dari tombol Kirim (Draft). */
const prefillAtasan = ref(true);

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const onSendUsulan = async (row: GabunganRow) => {
  // Buka CreateTransferModal (mode edit) — arsip terisi otomatis, atasan KOSONG
  try {
    selectedTransfer.value = await fetchDetail(row.id);
  } catch (e) {
    console.error('Gagal memuat detail usulan:', e);
    alert('Gagal memuat detail usulan.');
    return;
  }
  preselectedArsip.value = null;
  prefillAtasan.value = false;
  isCreateModalOpen.value = true;
};

const isCreateModalOpen = ref(false);
const selectedTransfer = ref<TransferActiveToInactive | null>(null);

const filter = reactive({
  search: '',
  status: '',
});

// Pagination (client-side)
const currentPage = ref(1);
const itemsPerPage = ref(10);
const pageSizeOpen = ref(false);
const pageSizeRef = ref<HTMLElement | null>(null);
const statusOpen = ref(false);
const statusRef = ref<HTMLElement | null>(null);

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'MENUNGGU_VERIFIKASI_ATASAN', label: 'Menunggu Persetujuan' },
  { value: 'MENUNGGU_VERIFIKASI_TERAKHIR', label: 'Menunggu Verifikasi' },
  { value: 'DIKIRIM', label: 'Menunggu Penerimaan' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DITOLAK_ATASAN', label: 'Ditolak' },
];

const onClickOutsidePageSize = (e: MouseEvent) => {
  if (pageSizeRef.value && !pageSizeRef.value.contains(e.target as Node)) {
    pageSizeOpen.value = false;
  }
  if (statusRef.value && !statusRef.value.contains(e.target as Node)) {
    statusOpen.value = false;
  }
};

const totalPages = computed(() => Math.max(1, Math.ceil(gabunganList.value.length / itemsPerPage.value)));

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return gabunganList.value.slice(start, start + itemsPerPage.value);
});

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const isSekretaris = computed(() => {
  const role = (user.value?.activeRole?.name ?? user.value?.role ?? '').toUpperCase();
  return role === 'USER' || isAdmin.value || isSuperadmin.value;
});

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/transfer-active-to-inactive-file' },
  { label: 'Pemindahan Arsip Aktif ke Inaktif', to: '/maintenance/transfer-active-to-inactive-file' },
];

const loadGabungan = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {};
    if (filter.search) params.search = filter.search;
    if (filter.status) params.status = filter.status;
    const res: any = await apiGet('/transfer-active-to-inactive/gabungan', { params }, { skipCache: true });
    gabunganList.value = res?.data ?? [];
  } catch (e) {
    console.error('Gagal memuat data gabungan:', e);
    gabunganList.value = [];
  } finally {
    loading.value = false;
  }
};

const reload = () => {
  currentPage.value = 1;
  loadGabungan();
};

const onExport = () => {
  if (gabunganList.value.length === 0) {
    alert('Tidak ada data untuk diexport');
    return;
  }
  const headers = ['Kode Berkas', 'Nama Berkas', 'Klasifikasi', 'Retensi Habis', 'Atasan', 'Status', 'Tanggal'];
  const rows = gabunganList.value.map((r) => [
    r.kodeBerkas ?? '',
    r.perihal ?? '',
    r.klasifikasi ?? '',
    r.tanggalRetensiAktifHabis ?? '',
    r.atasanName ?? '',
    r.status ?? '',
    r.tanggal ?? '',
  ]);
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pemindahan-arsip-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const openCreateModal = () => {
  selectedTransfer.value = null;
  preselectedArsip.value = null;
  prefillAtasan.value = true;
  isCreateModalOpen.value = true;
};

const openCreateModalWithArsip = (row: GabunganRow) => {
  selectedTransfer.value = null;
  prefillAtasan.value = true;
  preselectedArsip.value = {
    id: row.id,
    perihal: row.perihal,
    kodeBerkas: row.kodeBerkas,
    tanggalRetensiAktifHabis: row.tanggalRetensiAktifHabis,
    klasifikasi: row.klasifikasi,
  };
  isCreateModalOpen.value = true;
};

const openDetail = (row: GabunganRow) => {
  if (!row.isUsulan) return;
  navigateTo(`/maintenance/transfer-active-to-inactive-file/${row.id}`);
};

const onTransferCreated = async () => {
  await loadGabungan();
};

const onTransferUpdated = async () => {
  await loadGabungan();
};

onMounted(() => {
  document.addEventListener('click', onClickOutsidePageSize);
  loadGabungan();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutsidePageSize);
});
</script>