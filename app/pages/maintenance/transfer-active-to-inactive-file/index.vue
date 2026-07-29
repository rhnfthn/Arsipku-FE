<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Page Header -->
    <div class="mb-5">
      <PageHeader
        title="Pemindahan Arsip Aktif ke Inaktif"
        subtitle="Kelola usulan pemindahan arsip aktif ke inaktif."
        :items="items"
      />
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center justify-end gap-2 mb-4">
      <button
        @click="onExport"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
      >
        <UIcon name="i-lucide-download" class="w-4 h-4" /> Export
      </button>
      <button
        v-if="isSekretaris"
        @click="openCreateModal"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap shadow-sm"
      >
        <UIcon name="i-lucide-plus" class="w-4 h-4" /> Usul Pindah Arsip
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
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
      <!-- Status Filter -->
      <select
        v-model="filter.status"
        @change="reload"
        class="h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
      >
        <option value="">Semua Status</option>
        <option value="DRAFT">Draft</option>
        <option value="MENUNGGU_VERIFIKASI_ATASAN">Menunggu Persetujuan</option>
        <option value="DITOLAK_ATASAN">Tolak</option>
        <option value="DISETUJUI_ATASAN">Menunggu Verifikasi</option>
        <option value="MENUNGGU_VERIFIKASI_TERAKHIR">Menunggu Verifikasi</option>
        <option value="DISETUJUI_VERIFIKASI_TERAKHIR">Menunggu Penerimaan</option>
        <option value="DIKIRIM">Menunggu Penerimaan</option>
        <option value="SELESAI">Selesai</option>
      </select>
      <!-- Refresh -->
      <button
        @click="loadGabungan"
        :disabled="loading"
        class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <UIcon name="i-lucide-refresh-cw" class="w-4 h-4" :class="loading ? 'animate-spin' : ''" />
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
              <th class="px-3 py-2.5 font-semibold w-[14%] hidden md:table-cell">Atasan</th>
              <th class="px-3 py-2.5 font-semibold w-[12%]">Status</th>
              <th class="px-3 py-2.5 font-semibold w-[10%] hidden xl:table-cell">Tanggal</th>
              <th class="px-3 py-2.5 font-semibold text-center w-[8%]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading -->
            <tr v-if="loading">
              <td colspan="9" class="px-3 py-6 text-center text-sm text-gray-400">
                <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin inline mr-1" /> Memuat data...
              </td>
            </tr>
            <!-- Empty -->
            <tr v-else-if="gabunganList.length === 0">
              <td colspan="9" class="px-3 py-10 text-center text-sm text-gray-400">
                <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data</p>
                <p class="text-xs mt-1">Arsip Tertutup dengan retensi habis dan usulan pemindahan akan muncul di sini.</p>
              </td>
            </tr>
            <!-- Rows -->
            <tr
              v-for="(row, idx) in gabunganList"
              :key="row.id"
              class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              @click="openDetail(row)"
            >
                <td class="px-3 py-2 text-gray-500">{{ idx + 1 }}</td>
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
                <td class="px-3 py-2 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                  <div class="truncate" :title="row.atasanName ?? '-'">
                    <template v-if="row.isUsulan && row.status !== 'DRAFT'">{{ row.atasanName ?? '-' }}</template>
                    <template v-else>-</template>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <span :class="statusBadgeClass(row.status)" class="text-[11px]">{{ statusLabel(row.status) }}</span>
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
                    class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
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
import { ref, reactive, computed, onMounted } from 'vue';
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

onMounted(() => loadGabungan());
</script>