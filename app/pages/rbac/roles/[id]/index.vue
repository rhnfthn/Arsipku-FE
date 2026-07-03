<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <PageHeader :title="detailTitle" :items="items" />
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/rbac/roles"
          class="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          {{  }}
        </NuxtLink>
        <NuxtLink
          :to="`/rbac/roles/${route.params.id}/permissions`"
          class="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-lg transition-colors"
        >
          <UIcon name="i-lucide-pencil" class="w-4 h-4" />
          {{ t('rbac_edit_permission') }}
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-4 w-72 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-4 w-56 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <template v-else-if="role">
      <!-- Role info card -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-5 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <RoleBadge :role="role.name" />
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{  }}</p>
            <p class="text-sm text-gray-800 dark:text-white">{{ role.description || '-' }}</p>
          </div>
          <div class="ml-auto text-right">
            <p class="text-xs text-gray-500 dark:text-gray-400">{{  }}</p>
            <p class="text-2xl font-bold text-primary">{{ role.permissions?.length ?? 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Permission Matrix -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-bold text-gray-800 dark:text-white">
            {{  }}
          </h3>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ role.permissions?.length ?? 0 }} / {{ totalPermissions }} {{  }}
          </span>
        </div>

        <div v-if="resources.length === 0" class="p-10 text-center text-sm text-gray-400">
          {{  }}
        </div>

        <div v-else class="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-primary-400 dark:bg-primary-700 text-white sticky top-0 z-30">
              <tr>
                <th class="px-4 py-3 text-left font-semibold sticky left-0 bg-primary-400 dark:bg-primary-700 z-30 min-w-[180px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.4)]">
                  {{  }}
                </th>
                <th
                  v-for="action in allActions"
                  :key="action"
                  class="px-4 py-3 text-center font-semibold min-w-[100px] whitespace-nowrap"
                >
                  {{ action }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="resource in resources"
                :key="resource.id"
                class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700"
              >
                <td class="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-20 min-w-[180px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.15)]">
                  <UIcon name="i-lucide-box" class="w-4 h-4 text-primary inline mr-2" />
                  {{ resource.name }}
                </td>
                <td
                  v-for="action in allActions"
                  :key="action"
                  class="px-4 py-3 text-center min-w-[100px]"
                >
                  <span v-if="hasPermission(resource, action)" class="inline-flex">
                    <UIcon name="i-lucide-check" class="w-5 h-5 text-emerald-500" />
                  </span>
                  <span v-else class="text-gray-300 dark:text-gray-600">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      {{  }}
      <NuxtLink to="/rbac/roles" class="block mt-4 text-primary hover:underline">
        {{  }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRbac, type RbacRole, type RbacResource } from '~/composables/useRbac';

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

const allActions = computed(() => {
  const actions = new Set<string>();
  for (const r of resources.value) {
    for (const p of r.permissions ?? []) actions.add(p.action);
  }
  return Array.from(actions).sort();
});

const totalPermissions = computed(() =>
  resources.value.reduce((sum, r) => sum + (r.permissions?.length ?? 0), 0)
);

const assignedPermissionIds = computed(() => new Set((role.value?.permissions ?? []).map((p) => p.id)));

const hasPermission = (resource: RbacResource, action: string) => {
  const perm = resource.permissions?.find((p) => p.action === action);
  return perm ? assignedPermissionIds.value.has(perm.id) : false;
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([fetchRoles(), fetchResources()]);
    role.value = roles.value.find((r) => r.id === route.params.id) ?? null;
  } finally {
    loading.value = false;
  }
});
</script>