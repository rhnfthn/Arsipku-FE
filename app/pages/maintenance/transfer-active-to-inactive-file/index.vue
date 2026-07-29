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
    <TransferFilterBar
      v-model="filter"
      class="mb-4"
      @apply="reload"
      @reset="resetFilter"
    />

    <!-- Arsip Siap Dipindahkan (dari Berkas Saya) -->
    <div v-if="isSekretaris" class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Arsip Siap Dipindahkan
          <span class="text-sm font-normal text-gray-500">({{ arsipTersedia.length }} arsip)</span>
        </h3>
        <button
          @click="loadArsipTersedia"
          :disabled="arsipLoading"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <UIcon name="i-lucide-refresh-cw" class="w-3.5 h-3.5" :class="arsipLoading ? 'animate-spin' : ''" /> Refresh
        </button>
      </div>

      <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50 text-left">
              <tr>
                <th class="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">No</th>
                <th class="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Kode Berkas</th>
                <th class="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Nama Berkas</th>
                <th class="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Klasifikasi</th>
                <th class="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Retensi Aktif Habis</th>
                <th class="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th class="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Lokasi Fisik</th>
                <th class="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="arsipLoading">
                <td colspan="8" class="px-4 py-6 text-center text-sm text-gray-400">
                  <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin inline mr-1" /> Memuat data arsip...
                </td>
              </tr>
              <tr v-else-if="arsipTersedia.length === 0">
                <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-400">
                  <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada arsip siap dipindahkan</p>
                  <p class="text-xs mt-1">Arsip dengan status Tertutup dan retensi aktif habis akan muncul di sini.</p>
                </td>
              </tr>
              <tr
                v-for="(a, idx) in arsipTersedia"
                :key="a.id"
                class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td class="px-4 py-3 text-gray-500">{{ idx + 1 }}</td>
                <td class="px-4 py-3 font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">{{ a.kodeBerkas ?? '-' }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="a.perihal">{{ a.perihal }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ a.klasifikasi ?? '-' }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatDate(a.tanggalRetensiAktifHabis) }}</td>
                <td class="px-4 py-3">
                  <span v-if="a.sedangDiproses" class="px-2 py-0.5 text-xs rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                    Sedang Diproses
                  </span>
                  <span v-else class="px-2 py-0.5 text-xs rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    Tertutup
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ a.lokasiFisik ?? '-' }}</td>
                <td class="px-4 py-3 text-center">
                  <button
                    v-if="!a.sedangDiproses"
                    @click="openCreateModalWithArsip(a)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap"
                  >
                    <UIcon name="i-lucide-file-up" class="w-3.5 h-3.5" /> Pindahkan
                  </button>
                  <span v-else class="text-xs text-gray-400 italic">Sedang diproses</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Table Usulan -->
    <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Daftar Usulan Pemindahan</h3>
    <TransferTable
      :data="list"
      :loading="loading"
      :meta="meta"
      @detail="openDetail"
      @edit="openEdit"
      @send="onSend"
      @delete="onDelete"
      @page="goPage"
    />

    <!-- Modal Wizard -->
    <CreateTransferModal
      v-if="isSekretaris"
      v-model="isCreateModalOpen"
      :edit-data="selectedTransfer"
      :preselected-arsip="preselectedArsip"
      @created="onTransferCreated"
      @updated="onTransferUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';
import TransferFilterBar from '~/components/transfer-active-to-inactive/TransferFilterBar.vue';
import TransferTable from '~/components/transfer-active-to-inactive/TransferTable.vue';
import CreateTransferModal from '~/components/transfer-active-to-inactive/CreateTransferModal.vue';
import type {
  TransferFilter,
  TransferActiveToInactive,
} from '~/types/transfer-active-to-inactive';
import { formatDate } from '~/utils/transfer-status';

definePageMeta({ middleware: ['auth'] });

const {
  fetchList,
  send,
  remove,
  list,
  loading,
  meta,
} = useTransferActiveToInactive();
const { apiGet } = useApi();
const { user, isSuperadmin, isAdmin } = useAuth();

/** Arsip tersedia dari Berkas Saya (status Tertutup, retensi habis). */
interface ArsipTersedia {
  id: string;
  label: string;
  perihal: string;
  kodeBerkas: string | null;
  klasifikasi: string | null;
  retensiAktif: number | null;
  retensiInaktif: number | null;
  tanggalRetensiAktifHabis: string | null;
  status: string;
  lokasiFisik: string | null;
  fileUrl: string | null;
  sedangDiproses: boolean;
}
const arsipTersedia = ref<ArsipTersedia[]>([]);
const arsipLoading = ref(false);
const preselectedArsip = ref<ArsipTersedia | null>(null);

const loadArsipTersedia = async () => {
  arsipLoading.value = true;
  try {
    const res: any = await apiGet('/transfer-active-to-inactive/arsip-tersedia', {}, { skipCache: true });
    arsipTersedia.value = res?.data ?? [];
  } catch (e) {
    console.error('Gagal memuat arsip tersedia:', e);
    arsipTersedia.value = [];
  } finally {
    arsipLoading.value = false;
  }
};

/** Hanya Sekretaris (role USER) yang boleh membuat usulan. Admin/Superadmin bisa lihat tapi tidak buat. */
const isSekretaris = computed(() => {
  const role = (user.value?.activeRole?.name ?? user.value?.role ?? '').toUpperCase();
  return role === 'USER' || isAdmin.value || isSuperadmin.value;
});

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/transfer-active-to-inactive-file' },
  { label: 'Pemindahan Arsip Aktif ke Inaktif', to: '/maintenance/transfer-active-to-inactive-file' },
];

const filter = reactive<TransferFilter>({
  page: 1,
  limit: 10,
  status: undefined,
  search: '',
  startDate: '',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
});

const isCreateModalOpen = ref(false);
const selectedTransfer = ref<TransferActiveToInactive | null>(null);

const loadData = async () => {
  try {
    await fetchList({ ...filter });
  } catch (e) {
    console.error('Gagal memuat data:', e);
  }
};

const onExport = () => {
  // Export CSV sederhana
  if (!list.value || list.value.length === 0) {
    alert('Tidak ada data untuk diexport');
    return;
  }
  const headers = ['Nomor Usulan', 'Perihal Arsip', 'Atasan', 'Status', 'Tanggal'];
  const rows = list.value.map((r: any) => [
    r.nomorUsulan ?? '',
    r.arsipPerihal ?? '',
    r.atasanName ?? '',
    r.status ?? '',
    r.tanggalUsulan ?? '',
  ]);
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `usulan-pemindahan-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const reload = () => {
  filter.page = 1;
  loadData();
};

const resetFilter = () => {
  filter.status = undefined;
  filter.search = '';
  filter.startDate = '';
  filter.page = 1;
  loadData();
};

const goPage = (p: number) => {
  filter.page = p;
  loadData();
};

const openCreateModal = () => {
  selectedTransfer.value = null;
  preselectedArsip.value = null;
  isCreateModalOpen.value = true;
};

const openCreateModalWithArsip = (arsip: ArsipTersedia) => {
  selectedTransfer.value = null;
  preselectedArsip.value = arsip;
  isCreateModalOpen.value = true;
};

const openDetail = (row: TransferActiveToInactive) => {
  navigateTo(`/maintenance/transfer-active-to-inactive-file/${row.id}`);
};

const openEdit = (row: TransferActiveToInactive) => {
  selectedTransfer.value = row;
  isCreateModalOpen.value = true;
};

const onSend = async (row: TransferActiveToInactive) => {
  if (!confirm(`Kirim usulan ${row.nomorUsulan} ke atasan?`)) return;
  try {
    await send(row.id);
    await loadData();
  } catch (e) {
    console.error('Gagal mengirim usulan:', e);
    alert('Gagal mengirim usulan.');
  }
};

const onDelete = async (row: TransferActiveToInactive) => {
  if (!confirm(`Hapus draft usulan ${row.nomorUsulan}? Tindakan ini tidak dapat dibatalkan.`)) return;
  try {
    await remove(row.id);
    await loadData();
  } catch (e) {
    console.error('Gagal menghapus usulan:', e);
    alert('Gagal menghapus usulan.');
  }
};

const onTransferCreated = async () => {
  await loadData();
  await loadArsipTersedia();
};

const onTransferUpdated = async () => {
  await loadData();
  await loadArsipTersedia();
};

onMounted(() => {
  loadData();
  loadArsipTersedia();
});
</script>