<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <PageHeader :title="editTitle" :items="items" />
      <div class="flex items-center gap-2">
        <NuxtLink
          :to="`/rbac/roles/${route.params.id}`"
          class="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          {{  }}
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <template v-else-if="role">
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 class="text-sm font-bold text-gray-800 dark:text-white">
              {{ t('rbac_edit_permission_for') }} {{ role.name }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('rbac_permission_matrix_desc') }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="toggleCollapseAll"
              class="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <UIcon
                :name="allCollapsed ? 'i-lucide-chevrons-up-down' : 'i-lucide-chevrons-down-up'"
                class="w-3.5 h-3.5 inline mr-1"
              />
              {{ allCollapsed ? t('rbac_expand_all') : t('rbac_collapse_all') }}
            </button>
            <button
              type="button"
              @click="toggleCheckAll"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="allChecked
                ? 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                : 'bg-primary text-white hover:bg-primary-700'"
            >
              <UIcon
                :name="allChecked ? 'i-lucide-square' : 'i-lucide-check-square'"
                class="w-3.5 h-3.5 inline mr-1"
              />
              {{ allChecked ? t('rbac_uncheck_all_btn') : t('rbac_check_all_btn') }}
            </button>
          </div>
        </div>

        <div class="p-6 max-h-[60vh] overflow-y-auto">
          <div v-if="resources.length === 0" class="text-center py-10 text-gray-400">
            {{ t('rbac_resources_empty') }}
          </div>

          <div v-for="resource in resources" :key="resource.id" class="mb-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/40">
              <button
                type="button"
                @click="toggleCollapse(resource.id)"
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
                :title="isCollapsed(resource.id) ? t('rbac_expand') : t('rbac_collapse')"
              >
                <UIcon
                  :name="isCollapsed(resource.id) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                  class="w-4 h-4 transition-transform"
                />
              </button>
              <UIcon name="i-lucide-box" class="w-4 h-4 text-primary" />
              <h4 class="text-sm font-bold text-gray-800 dark:text-white">{{ resource.name }}</h4>
              <span class="text-xs text-gray-400">{{ resource.description }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">
                ({{ countChecked(resource) }}/{{ resource.permissions?.length ?? 0 }})
              </span>
              <button
                type="button"
                @click="toggleResourceAll(resource)"
                class="ml-auto text-xs text-primary hover:underline"
              >
                {{ isResourceAllChecked(resource) ? t('rbac_uncheck_all') : t('rbac_check_all') }}
              </button>
            </div>
            <div v-show="!isCollapsed(resource.id)" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
              <label
                v-for="perm in resource.permissions"
                :key="perm.id"
                class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 py-1"
              >
                <input
                  type="checkbox"
                  :checked="selectedPermIds.includes(perm.id)"
                  @change="togglePerm(perm.id)"
                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span class="font-mono text-xs">{{ perm.action }}</span>
                <span class="text-gray-400 text-xs">— {{ perm.description }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 px-6 py-3">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedPermIds.length }} {{ t('rbac_selected') }}
          </span>
          <div class="flex gap-3">
            <NuxtLink
              :to="`/rbac/roles/${route.params.id}`"
              class="px-5 py-2 text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white rounded-md transition-colors"
            >
              {{ t('rbac_cancel') }}
            </NuxtLink>
            <button
              @click="savePermissions"
              :disabled="saving"
              class="px-5 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md disabled:opacity-70 transition-colors"
            >
              {{ saving ? t('rbac_saving') : t('rbac_save_permission') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      {{ t('rbac_roles_not_found') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRbac, type RbacRole, type RbacResource } from '~/composables/useRbac';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '#imports';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const { roles, resources, fetchRoles, fetchResources, assignPermissions } = useRbac();
const { getProfile, refreshPermissions } = useAuth();

const loading = ref(true);
const saving = ref(false);
const role = ref<RbacRole | null>(null);
const selectedPermIds = ref<string[]>([]);
const collapsedResources = ref<Set<string>>(new Set());

const isCollapsed = (resourceId: string) => collapsedResources.value.has(resourceId);
const toggleCollapse = (resourceId: string) => {
  const set = new Set(collapsedResources.value);
  if (set.has(resourceId)) set.delete(resourceId);
  else set.add(resourceId);
  collapsedResources.value = set;
};
const allCollapsed = computed(
  () => resources.value.length > 0 && resources.value.every((r) => collapsedResources.value.has(r.id))
);
const toggleCollapseAll = () => {
  collapsedResources.value = allCollapsed.value
    ? new Set()
    : new Set(resources.value.map((r) => r.id));
};
const allChecked = computed(() => {
  const all = resources.value.flatMap((r) => (r.permissions ?? []).map((p) => p.id));
  return all.length > 0 && all.every((id) => selectedPermIds.value.includes(id));
});
const toggleCheckAll = () => {
  if (allChecked.value) {
    selectedPermIds.value = [];
  } else {
    selectedPermIds.value = resources.value.flatMap((r) => (r.permissions ?? []).map((p) => p.id));
  }
};
const countChecked = (resource: RbacResource) =>
  (resource.permissions ?? []).filter((p) => selectedPermIds.value.includes(p.id)).length;

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title'), to: '/rbac/roles' },
  { label: t('rbac_roles'), to: '/rbac/roles' },
  { label: role.value?.name || t('rbac_detail_label'), to: `/rbac/roles/${route.params.id}` },
  { label: t('rbac_edit_permission') },
]);

const editTitle = computed(() => `${t('rbac_edit_permission')}: ${role.value?.name ?? ''}`);

// Flat list semua permission untuk lookup proteksi SUPERADMIN
const allPermissionsFlat = computed(() => {
  const result: { id: string; resource: string; action: string }[] = [];
  for (const r of resources.value) {
    for (const p of r.permissions ?? []) {
      result.push({ id: p.id, resource: r.name, action: p.action });
    }
  }
  return result;
});

const togglePerm = (id: string) => {
  // Proteksi: SUPERADMIN tidak bisa uncentang permission kritis
  if (role.value?.name === 'SUPERADMIN') {
    const perm = allPermissionsFlat.value.find((p) => p.id === id);
    if (perm) {
      const criticalPerms = [
        'role.read', 'role.assign-permission', 'role.create',
        'role.update', 'role.delete', 'user.read', 'user.assign-role',
      ];
      const permKey = `${perm.resource}.${perm.action}`;
      if (criticalPerms.includes(permKey)) {
        // Cek apakah ini permission terakhir yang tercentang untuk resource ini
        const resourcePerms = allPermissionsFlat.value.filter(
          (p) => p.resource === perm.resource && selectedPermIds.value.includes(p.id),
        );
        if (resourcePerms.length <= 1) {
          toast.add({
            title: t('rbac_perm_protected_title'),
            description: t('rbac_perm_protected_desc', { permKey }),
            color: 'warning',
            icon: 'i-lucide-alert-triangle',
          });
          return;
        }
      }
    }
  }
  const idx = selectedPermIds.value.indexOf(id);
  if (idx >= 0) selectedPermIds.value.splice(idx, 1);
  else selectedPermIds.value.push(id);
};

const isResourceAllChecked = (resource: RbacResource) =>
  (resource.permissions ?? []).length > 0 &&
  (resource.permissions ?? []).every((p) => selectedPermIds.value.includes(p.id));

const toggleResourceAll = (resource: RbacResource) => {
  const ids = (resource.permissions ?? []).map((p) => p.id);
  if (isResourceAllChecked(resource)) {
    selectedPermIds.value = selectedPermIds.value.filter((id) => !ids.includes(id));
  } else {
    const set = new Set(selectedPermIds.value);
    ids.forEach((id) => set.add(id));
    selectedPermIds.value = Array.from(set);
  }
};

const savePermissions = async () => {
  if (!role.value) return;
  saving.value = true;
  try {
    await assignPermissions(role.value.id, selectedPermIds.value);
    toast.add({
      title: t('rbac_success'),
      description: t('rbac_permission_saved_notice'),
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    await fetchRoles();
    await refreshPermissions();
    await getProfile().catch(() => {});
    navigateTo(`/rbac/roles/${route.params.id}/permissions`);
  } catch (e: any) {
    toast.add({
      title: t('rbac_fail'),
      description: e?.message || t('rbac_permission_save_fail'),
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([fetchRoles(), fetchResources()]);
    role.value = roles.value.find((r) => r.id === route.params.id) ?? null;
    if (role.value) {
      selectedPermIds.value = (role.value.permissions ?? []).map((p) => p.id);
    }
  } finally {
    loading.value = false;
  }
});
</script>