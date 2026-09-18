<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <PageHeader :title="detailTitle" :items="items" />
      <NuxtLink
        to="/rbac/roles"
        class="inline-flex items-center gap-2 self-start rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 sm:self-auto"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        {{ t('rbac_back') }}
      </NuxtLink>
    </div>

    <div v-if="loading" class="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-4 w-72 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-4 w-56 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <template v-else-if="role">
      <div class="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex flex-wrap items-center gap-4">
          <RoleBadge :role="role.name" />
          <div class="min-w-0 flex-1">
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('rbac_roles_col_description') }}:</p>
            <p class="mt-1 text-sm text-gray-800 dark:text-white">{{ role.description || '-' }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('rbac_roles_col_permission_count') }}</p>
            <p class="text-2xl font-bold text-primary">{{ role.permissions?.length ?? 0 }}</p>
          </div>
        </div>
      </div>

      <section class="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div>
            <h2 class="text-base font-bold text-gray-800 dark:text-white">Permission {{ role.name }}</h2>
          </div>
        </div>

        <div v-if="resourcePermissionGroups.length" class="divide-y divide-gray-200 dark:divide-gray-700">
          <article
            v-for="group in resourcePermissionGroups"
            :key="group.resource.id"
            class="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 md:flex-row md:items-start"
          >
            <div class="flex min-w-0 items-center gap-2 md:w-56 md:shrink-0">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <UIcon name="i-lucide-box" class="h-4 w-4 text-primary" />
              </span>
              <div class="min-w-0">
                <h3 class="flex items-center gap-2 truncate text-sm font-semibold text-gray-800 dark:text-white">
                  <span class="truncate">{{ group.resource.name }}</span>
                  <span class="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {{ group.permissions.length }}
                  </span>
                </h3>
              </div>
            </div>

            <div class="flex flex-1 flex-wrap items-center gap-2">
              <span
                v-for="permission in group.permissions"
                :key="permission.id"
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                :title="permission.name"
              >
                <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
                {{ permission.action }}
              </span>
            </div>
          </article>
        </div>

        <div v-else class="p-10 text-center text-sm text-gray-400">{{ t('rbac_permissions_empty') }}</div>
      </section>
    </template>

    <div v-else class="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-800">
      {{ t('rbac_roles_not_found') }}
      <NuxtLink to="/rbac/roles" class="mt-4 block text-primary hover:underline">{{ t('rbac_back_to_roles') }}</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRbac, type RbacResource, type RbacRole } from '~/composables/useRbac';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const route = useRoute();
const { t } = useI18n();
const { roles, resources, fetchRoles, fetchResources } = useRbac();

const loading = ref(true);
const role = ref<RbacRole | null>(null);

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title'), to: '/rbac/roles' },
  { label: t('rbac_roles'), to: '/rbac/roles' },
  { label: role.value?.name || t('rbac_detail_label'), to: `/rbac/roles/${route.params.id}` },
]);

const detailTitle = computed(() => `${t('rbac_detail_role')}: ${role.value?.name ?? ''}`);
const assignedPermissionIds = computed(() => new Set((role.value?.permissions ?? []).map((permission) => permission.id)));

const resourcePermissionGroups = computed(() =>
  resources.value
    .map((resource: RbacResource) => ({
      resource,
      permissions: (resource.permissions ?? []).filter((permission) => assignedPermissionIds.value.has(permission.id)),
    }))
    .filter((group) => group.permissions.length > 0),
);

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([fetchRoles(), fetchResources()]);
    role.value = roles.value.find((item) => item.id === route.params.id) ?? null;
  } finally {
    loading.value = false;
  }
});
</script>
