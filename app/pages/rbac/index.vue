<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <div>
        <PageHeader title="Manajemen RBAC" :items="items" />
        <p class="text-sm text-gray-500 dark:text-gray-400 -mt-3">
          Kelola Role, Permission, dan Assign Role ke User. Hanya Superadmin yang dapat mengakses halaman ini.
        </p>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <NuxtLink
        to="/rbac/roles"
        class="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary transition-all group"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <UIcon name="i-lucide-shield" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Role</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ roles.length }}</p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/rbac/permissions"
        class="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary transition-all group"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
            <UIcon name="i-lucide-key-round" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Permission</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ permissions.length }}</p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/rbac/users"
        class="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary transition-all group"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <UIcon name="i-lucide-users" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Assign Role User</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">Kelola</p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Quick links -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
      >
        <UIcon :name="link.icon" class="w-5 h-5 text-primary" />
        <div>
          <p class="text-sm font-semibold text-gray-800 dark:text-white">{{ link.label }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ link.desc }}</p>
        </div>
        <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-gray-400 ml-auto" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRbac } from '~/composables/useRbac';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: 'Administrasi' },
  { label: 'Manajemen RBAC', to: '/rbac' },
]);

const { roles, permissions, fetchRoles, fetchPermissions } = useRbac();

const quickLinks = [
  { to: '/rbac/roles', label: 'Daftar Role', desc: 'Lihat & edit role', icon: 'i-lucide-shield-check' },
  { to: '/rbac/permissions', label: 'Daftar Permission', desc: 'Resource & aksi', icon: 'i-lucide-key-round' },
  { to: '/rbac/users', label: 'Assign Role User', desc: 'Tetapkan role ke user', icon: 'i-lucide-user-cog' },
];

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchPermissions()]);
});
</script>