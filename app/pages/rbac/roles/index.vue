<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <PageHeader :title="t('rbac_roles_title')" :items="items" />
    </div>

    <!-- Card Table (tanpa toolbar & pagination) -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <DataTable
        :columns="columns"
        :rows="roles"
        :loading="loading"
        :skeleton-rows="3"
        :empty-message="t('rbac_roles_empty')"
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
  { key: 'name', label: t('rbac_roles_col_name'), sortable: false, class: 'px-7' },
  { key: 'description', label: t('rbac_roles_col_description') },
  {
    key: 'permissionCount',
    label: t('rbac_roles_col_permission_count'),
    headerClass: 'text-center',
    class: 'text-center',
  },
  { key: 'aksi', label: t('rbac_col_aksi'), headerClass: 'text-center', class: 'text-center' },
]);

const roleIcon = (name: string) =>
  name === 'SUPERADMIN' ? 'i-lucide-shield-check' : name === 'ADMIN' ? 'i-lucide-shield' : 'i-lucide-user';

const roleColor = (name: string) =>
  name === 'SUPERADMIN'
    ? 'text-purple-600'
    : name === 'ADMIN'
      ? 'text-blue-600'
      : 'text-gray-500';

const goToDetail = (role: RbacRole) => {
  navigateTo(`/rbac/roles/${role.id}`);
};

const goToEditPermission = (role: RbacRole) => {
  navigateTo(`/rbac/roles/${role.id}/permissions`);
};

onMounted(() => {
  fetchRoles();
});
</script>