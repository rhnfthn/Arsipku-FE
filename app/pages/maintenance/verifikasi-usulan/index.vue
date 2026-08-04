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

    <!-- Filter Bar -->
    <VerifikasiFilterBar
      v-model="filter"
      @apply="reload"
      @export="onExport"
    />

    <!-- Table -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
      <VerifikasiTable
        :data="list"
        :loading="loading"
        @detail="openDetail"
      />

      <!-- Pagination -->
      <div
        v-if="meta && meta.total > 0"
        class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm"
      >
        <div class="text-gray-500 dark:text-gray-400">
          Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }} dari {{ meta.total }} usulan
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="goPage(meta.page - 1)"
            :disabled="meta.page <= 1"
            class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
          </button>
          <span class="text-gray-600 dark:text-gray-300 px-2">
            Hal {{ meta.page }} / {{ meta.totalPages }}
          </span>
          <button
            @click="goPage(meta.page + 1)"
            :disabled="meta.page >= meta.totalPages"
            class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
          </button>
        </div>
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

const goPage = (p: number) => {
  filter.value.page = p;
  loadData();
};

const onExport = () => {
  if (!list.value || list.value.length === 0) {
    alert('Tidak ada data untuk diexport');
    return;
  }
  const headers = ['Nomor Usulan', 'Perihal Arsip', 'Sekretaris', 'Status', 'Tanggal'];
  const rows = list.value.map((r: any) => [
    r.nomorUsulan ?? '',
    r.arsipPerihal ?? '',
    r.sekretarisName ?? '',
    r.status ?? '',
    r.tanggalUsulan ?? '',
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

onMounted(() => loadData());
</script>