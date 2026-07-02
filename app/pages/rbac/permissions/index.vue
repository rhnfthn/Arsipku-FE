<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="mb-5">
      <PageHeader :title="t('rbac_permissions_title') || 'Daftar Permission'" :items="items" />
      <p class="text-sm text-gray-500 dark:text-gray-400 -mt-3">
        {{ t('rbac_permissions_subtitle') || 'Semua resource & aksi yang tersedia di sistem. Read-only.' }}
      </p>
    </div>

    <!-- Card Table -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <DataToolbar
        v-model="perPage"
        v-model:search="searchQuery"
        :search-placeholder="t('rbac_permissions_search') || 'Cari permission...'"
        @refresh="refreshData"
        @export="onExport"
      />

      <DataTable
        :columns="columns"
        :rows="paginatedData"
        :loading="loading"
        :skeleton-rows="perPage"
        :empty-message="t('rbac_permissions_empty') || 'Belum ada data.'"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        @sort="onSort"
      >
        <template #cell-name="{ row }">
          <span class="font-mono text-xs text-gray-800 dark:text-white">{{ row.name }}</span>
        </template>
        <template #cell-resource="{ row }">
          <span class="text-gray-700 dark:text-gray-300">{{ row.resource || '-' }}</span>
        </template>
        <template #cell-action="{ row }">
          <PermissionBadge :action="row.action" />
        </template>
        <template #cell-description="{ row }">
          <span class="text-gray-500 dark:text-gray-400 text-xs">{{ row.description || '-' }}</span>
        </template>
      </DataTable>

      <DataPagination
        v-model:current-page="currentPage"
        :total-items="filteredData.length"
        :per-page="perPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRbac } from '~/composables/useRbac';
import { useToast } from '#imports';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();
const toast = useToast();
const { permissions, fetchPermissions, loading } = useRbac();

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title') || 'Manajemen RBAC', to: '/rbac' },
  { label: t('rbac_permissions') || 'Permission', to: '/rbac/permissions' },
]);

const columns = computed(() => [
  { key: 'name', label: t('rbac_permissions_col_name') || 'Permission', sortable: true, class: 'px-7' },
  { key: 'resource', label: t('rbac_resource') || 'Resource', sortable: true },
  { key: 'action', label: t('rbac_action') || 'Action', sortable: true, headerClass: 'text-center', class: 'text-center' },
  { key: 'description', label: t('rbac_roles_col_description') || 'Deskripsi' },
]);

const searchQuery = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const sortKey = ref('name');
const sortDir = ref<'asc' | 'desc'>('asc');

const filteredData = computed(() => {
  const kw = searchQuery.value.trim().toLowerCase();
  let result = permissions.value;
  if (kw) {
    result = result.filter((p) =>
      [p.name ?? '', p.resource ?? '', p.action ?? '', p.description ?? '']
        .join(' ')
        .toLowerCase()
        .includes(kw)
    );
  }
  const key = sortKey.value;
  const dir = sortDir.value === 'asc' ? 1 : -1;
  return [...result].sort((a, b) => {
    const va = (a as any)[key] ?? '';
    const vb = (b as any)[key] ?? '';
    return String(va).localeCompare(String(vb)) * dir;
  });
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredData.value.slice(start, start + perPage.value);
});

const onSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
};

watch([searchQuery, perPage], () => {
  currentPage.value = 1;
});

const refreshData = async () => {
  await fetchPermissions();
  currentPage.value = 1;
};

const onExport = () => {
  const data = filteredData.value.map((p, idx) => ({
    No: idx + 1,
    Permission: p.name,
    Resource: p.resource || '-',
    Action: p.action,
    Deskripsi: p.description || '-',
  }));
  if (data.length === 0) {
    toast.add({ title: 'Info', description: 'Tidak ada data untuk diekspor.', color: 'warning', icon: 'i-lucide-info' });
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Permissions');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `rbac_permissions_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
  toast.add({ title: t('rbac_success') || 'Sukses', description: 'Export berhasil.', color: 'success', icon: 'i-lucide-check-circle' });
};

onMounted(() => {
  fetchPermissions();
});
</script>