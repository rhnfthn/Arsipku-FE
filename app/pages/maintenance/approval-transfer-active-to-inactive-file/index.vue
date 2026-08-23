<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="mb-5">
      <PageHeader
        title="Persetujuan Pemindahan Arsip Aktif ke Inaktif"
        :items="items"
      />
    </div>

    <ApprovalSummaryCards :summary="summary" class="mb-4" />

    <ApprovalFilterBar
      :model-value="filter"
      @update:model-value="(v) => Object.assign(filter, v)"
      class="mb-4"
      @apply="reload"
      @reset="resetFilter"
    />

    <ApprovalTable
      :data="list"
      :loading="loading"
      :meta="meta"
      @detail="openDetail"
      @page="goPage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useTransferApproval } from '~/composables/useTransferApproval';
import type { TransferFilter, TransferActiveToInactive } from '~/types/transfer-active-to-inactive';

definePageMeta({ middleware: ['auth'] });

const {
  fetchApprovalList,
  fetchApprovalSummary,
  list,
  summary,
  loading,
  meta,
} = useTransferApproval();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/approval-transfer-active-to-inactive-file' },
  { label: 'Persetujuan Pemindahan Arsip Aktif ke Inaktif', to: '/maintenance/approval-transfer-active-to-inactive-file' },
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

const loadData = async () => {
  try {
    await Promise.all([
      fetchApprovalList({ ...filter }),
      fetchApprovalSummary(),
    ]);
  } catch (e) {
    console.error('Gagal memuat data:', e);
  }
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

const openDetail = (row: TransferActiveToInactive) => {
  navigateTo(`/maintenance/approval-transfer-active-to-inactive-file/${row.id}`);
};

onMounted(() => loadData());
</script>