<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Page Header -->
    <div class="mb-5">
      <PageHeader
        title="Verifikasi Usulan"
        :items="items"
      />
    </div>

    <!-- Peringatan multi-role -->
    <div
      v-if="isMultiRole"
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4"
    >
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
        <div>
          <h3 class="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Perhatian</h3>
          <p class="text-sm text-yellow-600 dark:text-yellow-400">Anda memiliki role Sekretaris dan Atasan Managerial. Pastikan tidak memverifikasi usulan yang Anda buat sendiri.</p>
        </div>
      </div>
    </div>

    <!-- Table Card (filter + table + pagination in one card) -->
    <div class="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors overflow-hidden">
      <!-- Filter Bar -->
      <VerifikasiFilterBar
        v-model="filter"
        @apply="reload"
        @export="onExport"
      />

      <!-- Table -->
      <VerifikasiTable
        :data="list"
        :loading="loading"
        @detail="openDetail"
      />

      <!-- Pagination -->
      <div v-if="meta">
        <DataPagination
          v-model:current-page="currentPage"
          :total-items="meta.total"
          :per-page="filter.limit ?? 10"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useVerifikasiUsulan } from '~/composables/useVerifikasiUsulan';
import { useAuth } from '~/composables/useAuth';
import VerifikasiFilterBar from '~/components/verifikasi-usulan/VerifikasiFilterBar.vue';
import VerifikasiTable from '~/components/verifikasi-usulan/VerifikasiTable.vue';
import type {
  VerifikasiFilter,
  VerifikasiUsulanItem,
} from '~/types/verifikasi-usulan';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const { user } = useAuth();
const {
  fetchList,
  fetchSummary,
  list,
  summary,
  loading,
  meta,
} = useVerifikasiUsulan();

/** Deteksi user multi-role (punya role USER/Sekretaris DAN ADMIN/Atasan Managerial). */
const isMultiRole = computed(() => {
  if (!user.value) return false;
  const activeRole = (user.value?.activeRole?.name ?? user.value?.role ?? '').toUpperCase();
  const allRoles = user.value?.roles?.map(r => r.name.toUpperCase()) ?? [];
  const hasSekretaris = activeRole === 'USER' || allRoles.includes('USER');
  const hasAtasan = activeRole === 'ADMIN' || allRoles.includes('ADMIN');
  return hasSekretaris && hasAtasan;
});

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/verifikasi-usulan' },
  { label: 'Verifikasi Usulan', to: '/maintenance/verifikasi-usulan' },
];

const filter = ref<VerifikasiFilter>({
  jenis: '',
  status: '',
  search: '',
  klasifikasi: '',
  startDate: '',
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
});

/** Load data dari backend. */
const loadData = async () => {
  try {
    await Promise.all([
      fetchList({ ...filter.value }),
      fetchSummary(),
    ]);
  } catch (e) {
    console.error('Gagal memuat data:', e);
  }
};

const reload = () => {
  filter.value.page = 1;
  loadData();
};

const onExport = () => {
  if (!list.value || list.value.length === 0) {
    alert('Tidak ada data untuk diexport');
    return;
  }
  const headers = ['Nama Berkas', 'Kode Berkas', 'No. Usulan', 'Klasifikasi', 'Status'];
  const rows = list.value.map((r: any) => [
    r.arsipPerihal ?? '',
    r.arsipKode ?? '',
    r.nomorUsulan ?? '',
    r.arsipKlasifikasi ?? '',
    r.status ?? '',
  ]);
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `verifikasi-usulan-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const openDetail = (row: VerifikasiUsulanItem) => {
  navigateTo(`/maintenance/verifikasi-usulan/${row.id}?jenis=${row.jenis}`);
};

// DataPagination v-model:current-page → trigger loadData on page change
const currentPage = computed({
  get: () => filter.value.page ?? 1,
  set: (val: number) => { filter.value.page = val; },
});

watch(() => filter.value.page, () => {
  if (filter.value.page) loadData();
});

onMounted(() => loadData());
</script>