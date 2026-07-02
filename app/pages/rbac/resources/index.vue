<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="mb-5">
      <PageHeader :title="t('rbac_resources_title') || 'Daftar Resource'" :items="items" />
      <p class="text-sm text-gray-500 dark:text-gray-400 -mt-3">
        {{ t('rbac_resources_subtitle') || 'Semua resource (modul) yang dilindungi di sistem. Read-only.' }}
      </p>
    </div>

    <!-- Card Table -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <DataToolbar
        v-model="perPage"
        v-model:search="searchQuery"
        :search-placeholder="t('rbac_resources_search') || 'Cari resource...'"
        @refresh="refreshData"
        @export="onExport"
      />

      <DataTable
        :columns="columns"
        :rows="paginatedData"
        :loading="loading"
        :skeleton-rows="perPage"
        :empty-message="t('rbac_resources_empty') || 'Belum ada data.'"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        @sort="onSort"
      >
        <template #cell-name="{ row }">
          <span class="inline-flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
            <UIcon name="i-lucide-box" class="w-4 h-4 text-primary" />
            {{ row.name }}
          </span>
        </template>
        <template #cell-permissionCount="{ row }">
          <span class="px-2.5 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
            {{ row.permissions?.length ?? 0 }}
          </span>
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
const { resources, fetchResources, loading } = useRbac();

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title') || 'Manajemen RBAC', to: '/rbac' },
  { label: t('rbac_resources') || 'Resource', to: '/rbac/resources' },
]);

const columns = computed(() => [
  { key: 'name', label: t('rbac_resource') || 'Resource', sortable: true, class: 'px-7' },
  {
    key: 'permissionCount',
    label: t('rbac_permissions') || 'Permission Count',
    sortable: true,
    headerClass: 'text-center',
    class: 'text-center',
  },
  { key: 'description', label: t('rbac_roles_col_description') || 'Deskripsi' },
]);

const searchQuery = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const sortKey = ref('name');
const sortDir = ref<'asc' | 'desc'>('asc');

const rows = computed(() =>
  resources.value.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    permissions: r.permissions,
    permissionCount: r.permissions?.length ?? 0,
  }))
);

const filteredData = computed(() => {
  const kw = searchQuery.value.trim().toLowerCase();
  let result = rows.value;
  if (kw) {
    result = result.filter((r) =>
      [r.name ?? '', r.description ?? ''].join(' ').toLowerCase().includes(kw)
    );
  }
  const key = sortKey.value;
  const dir = sortDir.value === 'asc' ? 1 : -1;
  return [...result].sort((a, b) => {
    const va = (a as any)[key] ?? '';
    const vb = (b as any)[key] ?? '';
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
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
  await fetchResources();
  currentPage.value = 1;
};

const onExport = () => {
  const data = filteredData.value.map((r, idx) => ({
    No: idx + 1,
    Resource: r.name,
    'Jumlah Permission': r.permissionCount,
    Deskripsi: r.description || '-',
  }));
  if (data.length === 0) {
    toast.add({ title: 'Info', description: 'Tidak ada data untuk diekspor.', color: 'warning', icon: 'i-lucide-info' });
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Resources');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `rbac_resources_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
  toast.add({ title: t('rbac_success') || 'Sukses', description: 'Export berhasil.', color: 'success', icon: 'i-lucide-check-circle' });
};

onMounted(() => {
  fetchResources();
});
</script>