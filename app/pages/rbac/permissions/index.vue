<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="mb-5">
      <PageHeader :title="t('rbac_permissions_title')" :items="items" />
    </div>

    <div v-if="loading" class="space-y-4">
      <div
        v-for="item in 3"
        :key="item"
        class="h-36 animate-pulse rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      />
    </div>

    <div v-else-if="orderedRoles.length" class="mx-auto max-w-6xl space-y-3">
      <article
        v-for="role in orderedRoles"
        :key="role.id"
        class="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-colors hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="flex flex-col gap-5 border-l-4 p-5 sm:flex-row sm:items-center sm:gap-6" :class="roleAccent(role.name)">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            :class="roleIconBackground(role.name)"
          >
            <UIcon :name="roleIcon(role.name)" class="h-6 w-6" :class="roleColor(role.name)" />
          </span>

          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-bold tracking-tight text-gray-900 dark:text-white">{{ role.name }}</h2>
            <p class="mt-1 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">{{ role.description || '-' }}</p>
          </div>

          <div class="flex items-center gap-5 border-t border-gray-200 pt-4 sm:border-l sm:border-t-0 sm:py-1 sm:pl-6 dark:border-gray-700">
            <div class="min-w-[72px] text-left sm:text-right">
              <p class="text-2xl font-bold leading-none" :class="roleColor(role.name)">
                {{ role.permissionCount ?? role.permissions?.length ?? 0 }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('rbac_permissions') }}</p>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            @click="goToEditPermission(role)"
          >
            <UIcon name="i-lucide-pencil" class="h-4 w-4" />
            {{ t('rbac_edit_permission') }}
          </button>
        </div>
      </article>
    </div>

    <div v-else class="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800">
      {{ t('rbac_permissions_empty') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRbac } from '~/composables/useRbac';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();
const { roles, loading, fetchRoles } = useRbac();

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title'), to: '/rbac/roles' },
  { label: t('rbac_permissions'), to: '/rbac/permissions' },
]);

const orderedRoles = computed(() => {
  const order = new Map([
    ['SUPERADMIN', 0],
    ['ADMIN', 1],
    ['USER', 2],
  ]);
  return [...roles.value].sort((a, b) => (order.get(a.name) ?? 99) - (order.get(b.name) ?? 99));
});

const roleIcon = (name?: string) => {
  const normalized = (name || '').toUpperCase();
  return normalized === 'SUPERADMIN'
    ? 'i-lucide-shield-check'
    : normalized === 'ADMIN'
      ? 'i-lucide-shield'
      : 'i-lucide-user';
};

const roleColor = (name?: string) => {
  const normalized = (name || '').toUpperCase();
  return normalized === 'SUPERADMIN'
    ? 'text-purple-600 dark:text-purple-400'
    : normalized === 'ADMIN'
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-gray-600 dark:text-gray-300';
};

const roleIconBackground = (name?: string) => {
  const normalized = (name || '').toUpperCase();
  return normalized === 'SUPERADMIN'
    ? 'bg-purple-100 dark:bg-purple-900/30'
    : normalized === 'ADMIN'
      ? 'bg-blue-100 dark:bg-blue-900/30'
      : 'bg-gray-100 dark:bg-gray-700';
};

const roleAccent = (name?: string) => {
  const normalized = (name || '').toUpperCase();
  return normalized === 'SUPERADMIN'
    ? 'border-l-purple-500'
    : normalized === 'ADMIN'
      ? 'border-l-blue-500'
      : 'border-l-gray-400';
};

const goToEditPermission = (role: { id: string }) => navigateTo(`/rbac/roles/${role.id}/permissions`);

onMounted(() => fetchRoles());
</script>
