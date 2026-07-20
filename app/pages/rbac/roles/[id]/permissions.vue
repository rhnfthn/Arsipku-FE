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
          <!-- Tabs + Action buttons in one row -->
          <div class="flex items-center justify-between gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-5">
            <div class="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0">
              <button
                v-for="section in allSections"
                :key="section.key"
                @click="activeTab = section.key"
                class="px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
                :class="activeTab === section.key
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
              >
                {{ section.tree?.label ?? section.key }}
              </button>
            </div>
            <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button type="button" @click="allExpanded ? collapseAll() : expandAll()"
                class="px-2 sm:px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">
                {{ allExpanded ? t('rbac_collapse_all') : t('rbac_expand_all') }}
              </button>
              <button type="button" @click="toggleCheckAll"
                class="px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                :class="allChecked
                  ? 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  : 'bg-primary text-white hover:bg-primary-700'">
                {{ allChecked ? t('rbac_uncheck_all_btn') : t('rbac_check_all_btn') }}
              </button>
            </div>
          </div>

          <!-- Active section content -->
          <div class="p-5 max-h-[65vh] overflow-y-auto">
            <div v-if="!currentTree" class="text-center py-10 text-gray-400">
              {{ t('rbac_resources_empty') }}
            </div>

            <div v-else class="space-y-2">
              <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div class="divide-y divide-gray-100 dark:divide-gray-800">
                  <div v-for="menu in currentTree.menus" :key="`${activeTab}-${menu.key}`" class="pl-4">
                    <button
                      class="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      @click="toggle(`${activeTab}-${menu.key}`)"
                    >
                      <UIcon
                        :name="isOpen(`${activeTab}-${menu.key}`) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                        class="w-4 h-4 text-gray-400 dark:text-gray-500"
                      />
                      <Paragraph variant="body2b">{{ menu.label }}</Paragraph>
                    </button>

                    <div v-show="isOpen(`${activeTab}-${menu.key}`)" class="pl-6 divide-y divide-gray-50 dark:divide-gray-800/60">
                      <div
                        v-for="subMenu in menu.subMenus"
                        :key="`${activeTab}-${menu.key}-${subMenu.key}`"
                        class="flex flex-col sm:flex-row sm:items-start gap-2 px-4 py-3 border-b border-gray-50 dark:border-gray-800/40 last:border-0"
                      >
                        <Paragraph variant="body3m" class="text-gray-700 dark:text-gray-300 min-w-[180px] sm:min-w-[220px] flex-shrink-0 pt-0.5">
                          {{ subMenu.label }}
                        </Paragraph>

                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
                          <template v-for="fitur in subMenu.fiturs" :key="`${activeTab}-${menu.key}-${subMenu.key}-${fitur.key}`">
                            <label
                              v-for="perm in fitur.permissions"
                              :key="perm.permissionId || perm.permissionName"
                              v-show="!(isUserRole && ['template.create', 'template.update', 'template.delete'].includes(perm.permissionName))"
                              class="inline-flex items-start gap-2 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                :checked="selectedIds.includes(perm.permissionId)"
                                :disabled="!perm.permissionId"
                                class="w-4 h-4 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary flex-shrink-0"
                                @change="togglePermission(perm.permissionId, $event.target.checked)"
                              />
                              <span class="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                                {{ perm.label }} — {{ perm.description }}
                              </span>
                            </label>
                          </template>
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
const { roles, fetchRoles, fetchMatrixUtama, fetchMatrixUtilitas, fetchMatrixAdministrasi, fetchMatrixLaporan, fetchMatrixFaq, assignPermissions } = useRbac();
const { refreshPermissions } = useAuth();

const loading = ref(true);
const saving = ref(false);
const role = ref<RbacRole | null>(null);
const isUserRole = computed(() => (role.value?.name || '').toUpperCase() === 'USER');
const utamaTree = ref<any>(null);
const utilitasTree = ref<any>(null);
const administrasiTree = ref<any>(null);
const laporanTree = ref<any>(null);
const faqTree = ref<any>(null);
const selectedIds = ref<string[]>([]);
const initialIds = ref<string[]>(new Set<string>());
const openKeys = ref<Set<string>>(new Set());
const activeTab = ref<'utama' | 'utilitas' | 'administrasi' | 'laporan' | 'faq'>('utama');

const tabs = computed(() => {
  const all = [
    { key: 'utama' as const, label: 'Utama' },
    { key: 'utilitas' as const, label: 'Utilitas' },
    { key: 'administrasi' as const, label: 'Administrasi' },
    { key: 'laporan' as const, label: 'Laporan' },
    { key: 'faq' as const, label: 'FAQ' },
  ];
  const roleName = (role.value?.name || '').toUpperCase();
  // USER: hanya Utama, Utilitas (dengan Titelatur & Penomoran digabung), FAQ
  if (roleName === 'USER') {
    return all.filter(t => ['utama', 'utilitas', 'faq'].includes(t.key));
  }
  return all;
});

const treeMap: Record<string, Ref<any>> = {
  utama: utamaTree,
  utilitas: utilitasTree,
  administrasi: administrasiTree,
  laporan: laporanTree,
  faq: faqTree,
};
  const currentTree = computed(() => {
    const raw = treeMap[activeTab.value]?.value ?? null;
    if (!raw) return null;
    const roleName = (role.value?.name || '').toUpperCase();
    // USER: gabung Titelatur & Penomoran dari Administrasi ke Utilitas
    if (roleName === 'USER' && raw.key === 'utilitas' && administrasiTree.value) {
      const extraMenus = (administrasiTree.value.menus ?? []).filter((m: any) =>
        ['titelatur', 'penomoran'].includes(m.key)
      );
      return { ...raw, menus: [...(raw.menus ?? []), ...extraMenus] };
    }
    // USER: hide Manajemen FAQ & Manajemen Pedoman di tab FAQ
    if (roleName === 'USER' && raw.key === 'faq') {
      const userHidden = ['manajemen-faq', 'manajemen-pedoman'];
      return { ...raw, menus: raw.menus.filter((m: any) => !userHidden.includes(m.key)) };
    }
    if (raw.key === 'administrasi') {
      if (roleName !== 'SUPERADMIN') {
        const adminHidden = ['data-master', 'konfigurasi'];
        return { ...raw, menus: raw.menus.filter((m: any) => !adminHidden.includes(m.key)) };
      }
    }
    return raw;
  });

const selectedPermIds = computed(() => selectedIds.value.slice());

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
  const roleName = (role.value?.name || '').toUpperCase();
  // USER: skip Administrasi & Laporan tree (Titelatur & Penomoran sudah digabung ke Utilitas)
  const skipKeys = roleName === 'USER' ? ['administrasi', 'laporan'] : [];
  for (const tree of [utamaTree.value, utilitasTree.value, administrasiTree.value, laporanTree.value, faqTree.value]) {
    if (!tree) continue;
    if (skipKeys.includes(tree.key)) continue;
    let menus = tree.menus ?? [];
    if (tree.key === 'administrasi' && roleName !== 'SUPERADMIN' && roleName !== 'USER') {
      const adminHidden = ['data-master', 'konfigurasi'];
      menus = menus.filter((m: any) => !adminHidden.includes(m.key));
    }
    // USER: tambah Titelatur & Penomoran dari administrasiTree ke utilitas
    if (tree.key === 'utilitas' && roleName === 'USER' && administrasiTree.value) {
      const extraMenus = (administrasiTree.value.menus ?? []).filter((m: any) =>
        ['titelatur', 'penomoran'].includes(m.key)
      );
      menus = [...menus, ...extraMenus];
    }
    // USER: hide Manajemen FAQ & Manajemen Pedoman di tab FAQ
    if (tree.key === 'faq' && roleName === 'USER') {
      const userHidden = ['manajemen-faq', 'manajemen-pedoman'];
      menus = menus.filter((m: any) => !userHidden.includes(m.key));
    }
    for (const menu of menus) {
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
  () => allPermissionIds.value.length > 0 && allPermissionIds.value.every((id) => selectedIds.value.includes(id)),
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
  set.add(activeTab.value);
  for (const menu of currentTree.value.menus ?? []) {
    set.add(`${activeTab.value}-${menu.key}`);
  }
  openKeys.value = set;
}
function collapseAll() {
  const set = new Set(openKeys.value);
  set.delete(activeTab.value);
  if (currentTree.value) {
    for (const menu of currentTree.value.menus ?? []) {
      set.delete(`${activeTab.value}-${menu.key}`);
    }
  }
  openKeys.value = set;
}
const allExpanded = computed(() => {
  if (!currentTree.value) return false;
  if (!openKeys.value.has(activeTab.value)) return false;
  for (const menu of currentTree.value.menus ?? []) {
    if (!openKeys.value.has(`${activeTab.value}-${menu.key}`)) return false;
  }
  return true;
});

const allSections = computed(() => {
  const roleName = (role.value?.name || '').toUpperCase();
  const sections = [
    { key: 'utama', tree: utamaTree.value },
    { key: 'utilitas', tree: utilitasTree.value },
    { key: 'administrasi', tree: administrasiTree.value },
    { key: 'laporan', tree: laporanTree.value },
    { key: 'faq', tree: faqTree.value },
  ];
  if (roleName === 'USER') {
    return sections.filter(s => ['utama', 'utilitas', 'faq'].includes(s.key));
  }
  return sections;
});

function toggleCheckAll() {
  if (allChecked.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = [...allPermissionIds.value];
  }
}
function togglePermission(id: string | null | undefined, checked: boolean) {
  if (!id) return;
  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value = [...selectedIds.value, id];
    }
  } else {
    selectedIds.value = selectedIds.value.filter((x) => x !== id);
  }
}

const savePermissions = async () => {
  if (!role.value) return;
  saving.value = true;
  try {
    await assignPermissions(role.value.id, selectedIds.value.slice(), allPermissionIds.value);
    toast.add({
      title: t('rbac_success'),
      description: t('rbac_permission_saved_notice'),
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    await fetchRoles();
    await refreshPermissions();
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
      const [utama, utilitas, administrasi, laporan, faq] = await Promise.all([
        fetchMatrixUtama(role.value.id),
        fetchMatrixUtilitas(role.value.id),
        fetchMatrixAdministrasi(role.value.id),
        fetchMatrixLaporan(role.value.id),
        fetchMatrixFaq(role.value.id),
      ]);
      utamaTree.value = utama.tree;
      utilitasTree.value = utilitas.tree;
      administrasiTree.value = administrasi.tree;
      laporanTree.value = laporan.tree;
      faqTree.value = faq.tree;
      // Merge assigned permission IDs from all (they're the same — role's full set)
      const ids = new Set<string>((utama.assignedPermissionIds ?? []).filter(Boolean));
      (utilitas.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      (administrasi.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      (laporan.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      (faq.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      selectedIds.value = Array.from(ids);
      initialIds.value = new Set(ids);
      // Default: expand tab aktif (Utama) + menu di dalamnya
      expandAll();
    }
  } catch (e: any) {
    // Silent: jika 403 (no access) jangan tampilkan toast error
    // User tanpa permission akan melihat AccessDenied component
    const status = e?.response?.status || e?.statusCode;
    if (status !== 403) {
      console.warn('[RBAC permissions] Failed to load:', e?.message || e);
    }
  } finally {
    loading.value = false;
  }
});
</script>