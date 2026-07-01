<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="mb-5">
      <PageHeader title="Daftar Permission" :items="items" />
      <p class="text-sm text-gray-500 dark:text-gray-400 -mt-3">
        Semua resource & aksi yang tersedia di sistem. Read-only.
      </p>
    </div>

    <div class="space-y-4">
      <div
        v-for="resource in resources"
        :key="resource.id"
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
      >
        <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <UIcon name="i-lucide-box" class="w-4 h-4 text-primary" />
          <h4 class="text-sm font-bold text-gray-800 dark:text-white">{{ resource.name }}</h4>
          <span class="text-xs text-gray-400">{{ resource.description }}</span>
          <span class="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {{ resource.permissions.length }} permission
          </span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
          <div
            v-for="perm in resource.permissions"
            :key="perm.id"
            class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2"
          >
            <div>
              <p class="font-mono text-xs text-gray-800 dark:text-white">{{ perm.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ perm.description }}</p>
            </div>
            <span class="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary font-medium">{{ perm.action }}</span>
          </div>
        </div>
      </div>
      <div v-if="resources.length === 0 && !loading" class="text-center py-10 text-gray-400">
        Belum ada data. Jalankan seeder RBAC di backend.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRbac } from '~/composables/useRbac';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();
const { resources, fetchResources, loading } = useRbac();

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: 'Manajemen RBAC', to: '/rbac' },
  { label: 'Permission', to: '/rbac/permissions' },
]);

onMounted(() => {
  fetchResources();
});
</script>