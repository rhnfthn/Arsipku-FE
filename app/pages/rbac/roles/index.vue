<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <PageHeader :title="t('rbac_roles_title')" :items="items" />
    </div>

    <!-- Card Table -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <DataToolbar
        v-model="perPage"
        v-model:search="searchQuery"
        :search-placeholder="t('rbac_roles_search')"
        @refresh="refreshData"
        @export="onExport"
      />

      <DataTable
        :columns="columns"
        :rows="paginatedData"
        :loading="loading"
        :skeleton-rows="perPage"
        :empty-message="t('rbac_roles_empty')"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        @sort="onSort"
      >
        <template #cell-name="{ row }">
          <NuxtLink
            :to="`/rbac/roles/${row.id}`"
            class="inline-flex items-center gap-2 font-semibold text-gray-800 dark:text-white hover:text-primary"
          >
            <UIcon :name="roleIcon(row.name)" class="w-4 h-4" :class="roleColor(row.name)" />
            {{ row.name }}
          </NuxtLink>
        </template>

        <template #cell-description="{ row }">
          <span class="text-gray-600 dark:text-gray-300">{{ row.description || '-' }}</span>
        </template>

        <template #cell-permissionCount="{ row }">
          <span class="px-2.5 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
            {{ row.permissionCount ?? row.permissions?.length ?? 0 }}
          </span>
        </template>

        <template #cell-aksi="{ row }">
          <div class="flex justify-center gap-2">
            <button
              @click="goToDetail(row)"
              class="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
              :title="t('rbac_detail')"
            >
              <UIcon name="i-lucide-eye" class="w-4 h-4 text-primary group-hover:text-primary-700" />
            </button>
            <button
              @click="goToEditPermission(row)"
              class="p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors group"
              :title="t('rbac_edit')"
            >
              <UIcon name="i-lucide-pencil" class="w-4 h-4 text-yellow-500 group-hover:text-yellow-600" />
            </button>
            <button
              v-if="!protectedRoles.includes(row.name)"
              @click="openDelete(row)"
              class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
              :title="t('rbac_delete')"
            >
              <UIcon name="i-lucide-trash-2" class="w-4 h-4 text-red-600 group-hover:text-red-700" />
            </button>
          </div>
        </template>
      </DataTable>

      <DataPagination
        v-model:current-page="currentPage"
        :total-items="filteredData.length"
        :per-page="perPage"
      />
    </div>

    <!-- Confirm Delete -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      :title="t('rbac_roles_delete_title')"
      :message="t('rbac_roles_delete_message')"
      :confirm-text="t('rbac_delete')"
      :cancel-text="t('rbac_cancel')"
      @confirm="deleteNow"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRbac, type RbacRole } from '~/composables/useRbac';
import { useToast } from '#imports';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();
const toast = useToast();
const { roles, loading, fetchRoles, deleteRole } = useRbac();

const protectedRoles = ['SUPERADMIN', 'ADMIN', 'USER'];

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title') || 'Manajemen RBAC', to: '/rbac' },
  { label: t('rbac_roles') || 'Role', to: '/rbac/roles' },
]);

const columns = computed(() => [
  { key: 'name', label: t('rbac_roles_col_name') || 'Role', sortable: true, class: 'px-7' },
  { key: 'description', label: t('rbac_roles_col_description') || 'Deskripsi' },
  {
    key: 'permissionCount',
    label: t('rbac_roles_col_permission_count') || 'Jumlah Permission',
    sortable: true,
    headerClass: 'text-center',
    class: 'text-center',
  },
  { key: 'aksi', label: t('rbac_col_aksi') || 'Aksi', headerClass: 'text-center', class: 'text-center' },
]);

const searchQuery = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const sortKey = ref('name');
const sortDir = ref<'asc' | 'desc'>('asc');

const confirmDeleteOpen = ref(false);
const itemToDelete = ref<RbacRole | null>(null);

const roleIcon = (name: string) =>
  name === 'SUPERADMIN' ? 'i-lucide-shield-check' : name === 'ADMIN' ? 'i-lucide-shield' : 'i-lucide-user';

const roleColor = (name: string) =>
  name === 'SUPERADMIN'
    ? 'text-purple-600'
    : name === 'ADMIN'
      ? 'text-blue-600'
      : 'text-gray-500';

const filteredData = computed(() => {
  const kw = searchQuery.value.trim().toLowerCase();
  let result = roles.value;
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
  await fetchRoles();
  currentPage.value = 1;
};

const goToDetail = (role: RbacRole) => {
  navigateTo(`/rbac/roles/${role.id}`);
};

const goToEditPermission = (role: RbacRole) => {
  navigateTo(`/rbac/roles/${role.id}/permissions`);
};

const openDelete = (role: RbacRole) => {
  itemToDelete.value = role;
  confirmDeleteOpen.value = true;
};

const deleteNow = async () => {
  if (!itemToDelete.value) return;
  try {
    await deleteRole(itemToDelete.value.id);
    toast.add({
      title: t('rbac_success') || 'Sukses',
      description: t('rbac_roles_deleted') || 'Role dihapus',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    confirmDeleteOpen.value = false;
    itemToDelete.value = null;
    await fetchRoles();
  } catch (e: any) {
    toast.add({
      title: t('rbac_fail') || 'Gagal',
      description: e?.message || (t('rbac_roles_delete_fail') || 'Gagal menghapus role'),
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
  }
};

const onExport = () => {
  const data = filteredData.value.map((r, idx) => ({
    No: idx + 1,
    Role: r.name,
    Deskripsi: r.description || '-',
    Permission: r.permissionCount ?? r.permissions?.length ?? 0,
  }));
  if (data.length === 0) {
    toast.add({
      title: t('rbac_fail') || 'Gagal',
      description: 'Tidak ada data untuk diekspor.',
      color: 'warning',
      icon: 'i-lucide-info',
    });
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 40 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'RBAC Roles');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `rbac_roles_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
  toast.add({
    title: t('rbac_success') || 'Sukses',
    description: 'Export berhasil.',
    color: 'success',
    icon: 'i-lucide-check-circle',
  });
};

onMounted(() => {
  fetchRoles();
});
</script>