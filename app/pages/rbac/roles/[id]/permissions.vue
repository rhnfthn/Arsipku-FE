<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5 px-4 sm:px-6 lg:px-8">
      <PageHeader :title="editTitle" :items="items" />
      <div class="flex items-center gap-2">
        <NuxtLink
          :to="`/rbac/roles/${route.params.id}`"
          class="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          {{ t('rbac_back') }}
        </NuxtLink>
      </div>
    </div>

    <div class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <div class="space-y-4 animate-pulse">
          <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <template v-else-if="role">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
          <!-- Toolbar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 class="text-sm font-bold text-gray-800 dark:text-white">
                {{ t('rbac_edit_permission_for') }} {{ role.name }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('rbac_permission_matrix_desc') }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" @click="expandAll"
                class="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                {{ t('rbac_expand_all') }}
              </button>
              <button type="button" @click="collapseAll"
                class="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                {{ t('rbac_collapse_all') }}
              </button>
              <button type="button" @click="toggleCheckAll"
                class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                :class="allChecked
                  ? 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  : 'bg-primary text-white hover:bg-primary-700'">
                {{ allChecked ? t('rbac_uncheck_all_btn') : t('rbac_check_all_btn') }}
              </button>
            </div>
          </div>

          <!-- Tabs Utama / Utilitas -->
          <div class="flex border-b border-gray-200 dark:border-gray-700 px-5 gap-1">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
              :class="activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Matrix tree -->
          <div class="p-5 max-h-[65vh] overflow-y-auto">
            <div v-if="!currentTree" class="text-center py-10 text-gray-400">
              {{ t('rbac_resources_empty') }}
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="halaman in [currentTree]"
                :key="halaman.key"
                class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                <button
                  class="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  @click="toggle(halaman.key)"
                >
                  <UIcon
                    :name="isOpen(halaman.key) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                    class="w-5 h-5 text-gray-500 dark:text-gray-400"
                  />
                  <Heading variant="heading9b" as="h3">{{ halaman.label }}</Heading>
                </button>

                <div v-show="isOpen(halaman.key)" class="divide-y divide-gray-100 dark:divide-gray-800">
                  <div v-for="menu in halaman.menus" :key="`${halaman.key}-${menu.key}`" class="pl-4">
                    <button
                      class="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      @click="toggle(`${halaman.key}-${menu.key}`)"
                    >
                      <UIcon
                        :name="isOpen(`${halaman.key}-${menu.key}`) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                        class="w-4 h-4 text-gray-400 dark:text-gray-500"
                      />
                      <Paragraph variant="body2b">{{ menu.label }}</Paragraph>
                    </button>

                    <div v-show="isOpen(`${halaman.key}-${menu.key}`)" class="pl-6 divide-y divide-gray-50 dark:divide-gray-800/60">
                      <div v-for="subMenu in menu.subMenus" :key="`${halaman.key}-${menu.key}-${subMenu.key}`">
                        <div v-if="subMenu.label !== menu.label" class="px-4 py-2">
                          <Paragraph variant="body3m" class="text-gray-600 dark:text-gray-300">{{ subMenu.label }}</Paragraph>
                        </div>

                        <div class="pl-8 pr-4 py-2">
                          <div
                            v-for="fitur in subMenu.fiturs"
                            :key="`${halaman.key}-${menu.key}-${subMenu.key}-${fitur.key}`"
                            class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-gray-50 dark:border-gray-800/40 last:border-0"
                          >
                            <Paragraph variant="body3m" class="text-gray-700 dark:text-gray-300 min-w-[200px]">
                              {{ fitur.label }}
                            </Paragraph>
                            <div class="flex flex-wrap items-center gap-4">
                              <label
                                v-for="perm in fitur.permissions"
                                :key="perm.permissionId || perm.permissionName"
                                class="inline-flex items-center gap-2 cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  :checked="selectedIds.has(perm.permissionId)"
                                  :disabled="!perm.permissionId"
                                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                  @change="togglePermission(perm.permissionId, $event.target.checked)"
                                />
                                <span class="text-xs text-gray-600 dark:text-gray-400">
                                  {{ perm.label }} — {{ perm.description }}
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRbac, type RbacRole } from '~/composables/useRbac';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '#imports';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const { roles, fetchRoles, fetchMatrixUtama, fetchMatrixUtilitas, assignPermissions } = useRbac();
const { getProfile, refreshPermissions } = useAuth();

const loading = ref(true);
const saving = ref(false);
const role = ref<RbacRole | null>(null);
const utamaTree = ref<any>(null);
const utilitasTree = ref<any>(null);
const selectedIds = ref<Set<string>>(new Set());
const initialIds = ref<Set<string>>(new Set());
const openKeys = ref<Set<string>>(new Set());
const activeTab = ref<'utama' | 'utilitas'>('utama');

const tabs = [
  { key: 'utama' as const, label: 'Utama' },
  { key: 'utilitas' as const, label: 'Utilitas' },
];

const currentTree = computed(() => (activeTab.value === 'utama' ? utamaTree.value : utilitasTree.value));

const selectedPermIds = computed(() => Array.from(selectedIds.value));

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title'), to: '/rbac/roles' },
  { label: t('rbac_roles'), to: '/rbac/roles' },
  { label: role.value?.name || t('rbac_detail_label'), to: `/rbac/roles/${route.params.id}` },
  { label: t('rbac_edit_permission') },
]);

const editTitle = computed(() => `${t('rbac_edit_permission')}: ${role.value?.name ?? ''}`);

const allPermissionIds = computed<string[]>(() => {
  const ids: string[] = [];
  for (const tree of [utamaTree.value, utilitasTree.value]) {
    if (!tree) continue;
    for (const menu of tree.menus ?? []) {
      for (const sub of menu.subMenus ?? []) {
        for (const fitur of sub.fiturs ?? []) {
          for (const perm of fitur.permissions ?? []) {
            if (perm.permissionId) ids.push(perm.permissionId);
          }
        }
      }
    }
  }
  return ids;
});

const allChecked = computed(
  () => allPermissionIds.value.length > 0 && allPermissionIds.value.every((id) => selectedIds.value.has(id)),
);

function isOpen(key: string): boolean {
  return openKeys.value.has(key);
}
function toggle(key: string) {
  const set = new Set(openKeys.value);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  openKeys.value = set;
}
function expandAll() {
  if (!currentTree.value) return;
  const set = new Set(openKeys.value);
  set.add(currentTree.value.key);
  for (const menu of currentTree.value.menus ?? []) {
    set.add(`${currentTree.value.key}-${menu.key}`);
  }
  openKeys.value = set;
}
function collapseAll() {
  openKeys.value = new Set();
}
function toggleCheckAll() {
  if (allChecked.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(allPermissionIds.value);
  }
}
function togglePermission(id: string | null | undefined, checked: boolean) {
  if (!id) return;
  const set = new Set(selectedIds.value);
  if (checked) set.add(id);
  else set.delete(id);
  selectedIds.value = set;
}

const savePermissions = async () => {
  if (!role.value) return;
  saving.value = true;
  try {
    await assignPermissions(role.value.id, Array.from(selectedIds.value));
    toast.add({
      title: t('rbac_success'),
      description: t('rbac_permission_saved_notice'),
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    await fetchRoles();
    await refreshPermissions();
    await getProfile().catch(() => {});
    initialIds.value = new Set(selectedIds.value);
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
    await fetchRoles();
    role.value = roles.value.find((r) => r.id === route.params.id) ?? null;
    if (role.value) {
      const [utama, utilitas] = await Promise.all([
        fetchMatrixUtama(role.value.id),
        fetchMatrixUtilitas(role.value.id),
      ]);
      utamaTree.value = utama.tree;
      utilitasTree.value = utilitas.tree;
      // Merge assigned permission IDs from both (they're the same — role's full set)
      const ids = new Set<string>((utama.assignedPermissionIds ?? []).filter(Boolean));
      (utilitas.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      selectedIds.value = ids;
      initialIds.value = new Set(ids);
      expandAll();
    }
  } finally {
    loading.value = false;
  }
});
</script>