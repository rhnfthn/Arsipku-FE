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

    <!-- Table -->
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
      @created="onTransferCreated"
      @updated="onTransferUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import { useAuth } from '~/composables/useAuth';
import TransferFilterBar from '~/components/transfer-active-to-inactive/TransferFilterBar.vue';
import TransferTable from '~/components/transfer-active-to-inactive/TransferTable.vue';
import CreateTransferModal from '~/components/transfer-active-to-inactive/CreateTransferModal.vue';
import type {
  TransferFilter,
  TransferActiveToInactive,
} from '~/types/transfer-active-to-inactive';

definePageMeta({ middleware: ['auth'] });

const {
  fetchList,
  send,
  remove,
  list,
  loading,
  meta,
} = useTransferActiveToInactive();
const { user, isSuperadmin, isAdmin } = useAuth();

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
};

const onTransferUpdated = async () => {
  await loadData();
};

onMounted(() => loadData());
</script>