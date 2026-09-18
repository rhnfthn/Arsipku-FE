<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="mb-5">
      <PageHeader :title="t('rbac_roles_title')" :items="items" />
    </div>

    <div class="rounded-lg border border-gray-200 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <DataTable
        :columns="columns"
        :rows="roles"
        :loading="loading"
        :skeleton-rows="3"
        :empty-message="t('rbac_roles_empty')"
      >
        <template #cell-name="{ row }">
          <span class="font-semibold text-gray-800 dark:text-white">{{ row.name }}</span>
        </template>

        <template #cell-description="{ row }">
          <span class="text-gray-600 dark:text-gray-300">{{ row.description || '-' }}</span>
        </template>

        <template #cell-permissionCount="{ row }">
          <span class="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {{ row.permissionCount ?? row.permissions?.length ?? 0 }}
          </span>
        </template>

        <template #cell-aksi="{ row }">
          <div class="flex justify-center">
            <button
              type="button"
              class="rounded-lg p-2 transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/30"
              :title="t('rbac_detail')"
              @click="goToDetail(row)"
            >
              <UIcon name="i-lucide-eye" class="h-4 w-4 text-primary" />
            </button>
            <button
              type="button"
              class="rounded-lg p-2 transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
              :title="t('rbac_edit_permission')"
              @click="goToEditPermission(row)"
            >
              <UIcon name="i-lucide-pencil" class="h-4 w-4 text-yellow-500" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRbac, type RbacRole } from '~/composables/useRbac';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();
const { roles, loading, fetchRoles } = useRbac();

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title'), to: '/rbac/roles' },
  { label: t('rbac_roles'), to: '/rbac/roles' },
]);

const columns = computed(() => [
  { key: 'name', label: t('rbac_roles_col_name'), class: 'px-7' },
  { key: 'description', label: t('rbac_roles_col_description') },
  {
    key: 'permissionCount',
    label: t('rbac_roles_col_permission_count'),
    headerClass: 'text-center',
    class: 'text-center',
  },
  { key: 'aksi', label: t('rbac_col_aksi'), headerClass: 'text-center', class: 'text-center' },
]);

const goToDetail = (role: RbacRole) => navigateTo(`/rbac/roles/${role.id}`);
const goToEditPermission = (role: RbacRole) => navigateTo(`/rbac/roles/${role.id}/permissions`);

onMounted(() => fetchRoles());
</script>
