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

    <div class="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <div class="space-y-4 animate-pulse">
          <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <template v-else-if="role">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
          <!-- Navigation kategori dibuat satu baris penuh agar tab tidak terhimpit tombol aksi. -->
          <div class="border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-1 overflow-x-auto no-scrollbar px-3 sm:px-5">
              <button
                v-for="section in allSections"
                :key="section.key"
                @click="selectTab(section.key)"
                class="px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
                :class="activeTab === section.key
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
              >
                {{ section.tree?.label === 'FAQ & Pedoman' ? 'FAQ' : (section.tree?.label ?? section.key) }}
              </button>
            </div>
            <div class="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800 px-3 sm:px-5 py-2">
              <button type="button" @click="allExpanded ? collapseAll() : expandAll()"
                class="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">
                {{ allExpanded ? t('rbac_collapse_all') : t('rbac_expand_all') }}
              </button>
              <button type="button" @click="toggleCheckAll"
                class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                :class="currentTabAllChecked
                  ? 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  : 'bg-primary text-white hover:bg-primary-700'">
                {{ currentTabAllChecked ? t('rbac_uncheck_all_btn') : t('rbac_check_all_btn') }}
              </button>
            </div>
          </div>

          <!-- Active section content -->
          <div class="p-3 sm:p-5 max-h-[65vh] overflow-y-auto">
            <div v-if="!currentTree" class="text-center py-10 text-gray-400">
              {{ t('rbac_resources_empty') }}
            </div>

            <div v-else class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div class="divide-y divide-gray-100 dark:divide-gray-800">
                <div v-for="menu in currentTree.menus" :key="`${activeTab}-${menu.key}`">
                  <button
                    class="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left bg-gray-50/70 dark:bg-gray-800/40 hover:bg-gray-100/80 dark:hover:bg-gray-800/70 transition-colors"
                    @click="toggle(`${activeTab}-${menu.key}`)"
                  >
                    <UIcon
                      :name="isOpen(`${activeTab}-${menu.key}`) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                      class="w-4 h-4 text-gray-400 dark:text-gray-500"
                    />
                    <Paragraph variant="body2b" class="text-gray-900 dark:text-white">{{ menu.label }}</Paragraph>
                  </button>

                  <div v-show="isOpen(`${activeTab}-${menu.key}`)" class="divide-y divide-gray-100 dark:divide-gray-800/60">
                    <div
                      v-for="subMenu in menu.subMenus"
                      :key="`${activeTab}-${menu.key}-${subMenu.key}`"
                      class="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-3 lg:gap-6 px-4 sm:px-6 py-4"
                    >
                      <Paragraph variant="body3m" class="text-gray-700 dark:text-gray-300 pt-0.5">
                        {{ subMenu.label }}
                      </Paragraph>

                      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-5 gap-y-4 min-w-0">
                        <template v-for="fitur in subMenu.fiturs" :key="`${activeTab}-${menu.key}-${subMenu.key}-${fitur.key}`">
                          <label
                            v-for="perm in fitur.permissions"
                            :key="perm.permissionId || perm.permissionName"
                            v-show="!(isUserRole && ['template.create', 'template.update', 'template.delete'].includes(perm.permissionName))"
                            class="flex min-w-0 items-start gap-2 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              :checked="selectedIds.includes(perm.permissionId)"
                              :disabled="!perm.permissionId"
                              class="w-4 h-4 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary flex-shrink-0"
                              @change="togglePermission(perm.permissionId, $event.target.checked)"
                            />
                              <span class="min-w-0 flex-1 break-words text-sm text-gray-600 dark:text-gray-400 leading-5">
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
const {
  roles,
  permissions,
  fetchRoles,
  fetchPermissions,
  fetchMatrixUtama,
  fetchMatrixUtilitas,
  fetchMatrixAdministrasi,
  fetchMatrixLaporan,
  fetchMatrixFaq,
  fetchMatrixKelola,
  fetchMatrixTugas,
  assignPermissions,
} = useRbac();
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
const kelolaTree = ref<any>(null);
const tugasTree = ref<any>(null);
const selectedIds = ref<string[]>([]);
const initialIds = ref<string[]>(new Set<string>());
const openKeys = ref<Set<string>>(new Set());
const activeTab = ref<'utama' | 'kelola' | 'utilitas' | 'tugas' | 'administrasi' | 'laporan' | 'faq'>('utama');

const tabs = computed(() => {
  const all = [
    { key: 'utama' as const, label: 'Utama' },
    { key: 'kelola' as const, label: 'Kelola' },
    { key: 'utilitas' as const, label: 'Utilitas' },
    { key: 'tugas' as const, label: 'Tugas' },
    { key: 'administrasi' as const, label: 'Administrasi' },
    { key: 'laporan' as const, label: 'Laporan' },
    { key: 'faq' as const, label: 'FAQ' },
  ];
  const roleName = (role.value?.name || '').toUpperCase();
  // USER tetap melihat kategori operasional yang dipakai pada sidebar.
  if (roleName === 'USER') {
    return all.filter(t => ['utama', 'kelola', 'utilitas', 'tugas', 'faq'].includes(t.key));
  }
  return all;
});

const treeMap: Record<string, Ref<any>> = {
  utama: utamaTree,
  utilitas: utilitasTree,
  administrasi: administrasiTree,
  laporan: laporanTree,
  faq: faqTree,
  kelola: kelolaTree,
  tugas: tugasTree,
};

// Satu permission backend hanya boleh tampil sekali di matrix. Ini menjadi
// guard tambahan untuk response lama/cache yang masih mengulang action Read
// pada beberapa submenu Penggunaan.
function dedupeTreePermissions(tree: any) {
  const seen = new Set<string>();
  return {
    ...tree,
    menus: (tree.menus ?? []).map((menu: any) => ({
      ...menu,
      subMenus: (menu.subMenus ?? []).map((subMenu: any) => ({
        ...subMenu,
        fiturs: (subMenu.fiturs ?? []).map((fitur: any) => ({
          ...fitur,
          permissions: (fitur.permissions ?? []).filter((permission: any) => {
            const key = permission.permissionId || `${permission.resource}.${permission.action}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }),
        })),
      })),
    })),
  };
}

// Sidebar ADMIN menampilkan Tertuju sebagai menu Administrasi tersendiri,
// bukan seluruh Data Master. Bentuk matrix mengikuti menu yang benar-benar
// tersedia pada role tersebut, tanpa menggandakan permission ID.
function administrasiTreeForRole(tree: any, roleName: string) {
  if (!tree || tree.key !== 'administrasi' || roleName === 'SUPERADMIN') return tree;

  const dataMaster = (tree.menus ?? []).find((menu: any) => menu.key === 'data-master');
  let tertujuSubMenu = (dataMaster?.subMenus ?? []).find(
    (subMenu: any) => subMenu.key === 'tertuju',
  );
  const menus = (tree.menus ?? []).filter(
    (menu: any) => !['data-master', 'konfigurasi', 'audit'].includes(menu.key),
  );

  if (tertujuSubMenu) {
    // Admin hanya memiliki akses halaman/read. Action pengelolaan Tertuju
    // tetap ditampilkan untuk SUPERADMIN, tetapi tidak menjadi opsi Admin.
    if (roleName === 'ADMIN') {
      tertujuSubMenu = {
        ...tertujuSubMenu,
        fiturs: (tertujuSubMenu.fiturs ?? [])
          .map((fitur: any) => ({
            ...fitur,
            permissions: (fitur.permissions ?? []).filter(
              (permission: any) =>
                permission.permissionName === 'master-data.read-tertuju' ||
                (permission.resource === 'master-data' && permission.action === 'read-tertuju'),
            ),
          }))
          .filter((fitur: any) => fitur.permissions.length > 0),
      };
    }
    menus.push({
      key: 'tertuju',
      label: tertujuSubMenu.label || 'Tertuju',
      subMenus: [tertujuSubMenu],
    });
  }

  return { ...tree, menus };
}

// Matrix lama/cache tertentu bisa mengirim permissionId kosong walaupun
// permission sudah ada di database. Resolve ulang dari katalog permission
// agar checkbox tetap dapat dipilih dan disimpan.
function hydratePermissionIds(tree: any, permissionIdsByName: Map<string, string>) {
  if (!tree) return tree;
  return {
    ...tree,
    menus: (tree.menus ?? []).map((menu: any) => ({
      ...menu,
      subMenus: (menu.subMenus ?? []).map((subMenu: any) => ({
        ...subMenu,
        fiturs: (subMenu.fiturs ?? []).map((fitur: any) => ({
          ...fitur,
          permissions: (fitur.permissions ?? []).map((permission: any) => ({
            ...permission,
            permissionId:
              permission.permissionId ??
              permissionIdsByName.get(
                permission.permissionName ?? `${permission.resource}.${permission.action}`,
              ) ??
              null,
          })),
        })),
      })),
    })),
  };
}

function utamaTreeForUser(tree: any) {
  // Semua permission SDE Massal (read, read-detail, create, update, finalize,
  // delete, read-verification, verify, reject) kini tampil utuh untuk role
  // USER agar superadmin dapat mengatur akses verifikator/konseptor SDE
  // Massal melalui RBAC matrix (fix: sebelumnya hanya read yang tampil).
  return tree;
}

function kelolaTreeForUser(tree: any) {
  if (!tree || tree.key !== 'kelola') return tree;
  return {
    ...tree,
    menus: (tree.menus ?? []).map((menu: any) => ({
      ...menu,
      subMenus: (menu.subMenus ?? [])
        .filter((subMenu: any) =>
          menu.key !== 'penggunaan' || !['verifikasi-usulan', 'pemberian'].includes(subMenu.key),
        )
        .map((subMenu: any) => ({
          ...subMenu,
          fiturs: (subMenu.fiturs ?? [])
            .map((fitur: any) => ({
              ...fitur,
              permissions: (fitur.permissions ?? []).filter(
                (permission: any) =>
                  permission.action === 'read' || permission.action.startsWith('read-'),
              ),
            }))
            .filter((fitur: any) => fitur.permissions.length > 0),
        }))
        .filter((subMenu: any) => subMenu.fiturs.length > 0),
    })),
  };
}

function readOnlyMenu(menu: any, label?: string) {
  return {
    ...menu,
    ...(label ? { label } : {}),
    subMenus: (menu.subMenus ?? [])
      .map((subMenu: any) => ({
        ...subMenu,
        fiturs: (subMenu.fiturs ?? [])
          .map((fitur: any) => ({
            ...fitur,
            permissions: (fitur.permissions ?? []).filter(
              (permission: any) =>
                permission.action === 'read' || permission.action.startsWith('read-'),
            ),
          }))
          .filter((fitur: any) => fitur.permissions.length > 0),
      }))
      .filter((subMenu: any) => subMenu.fiturs.length > 0),
  };
}

function utilitasTreeForUser(tree: any, administrasiTree: any) {
  if (!tree || tree.key !== 'utilitas') return tree;

  const menus = (tree.menus ?? [])
    .filter((menu: any) => menu.key !== 'template')
    .map((menu: any) => {
      if (menu.key !== 'ttd-digital') return menu;
      return {
        ...menu,
        subMenus: (menu.subMenus ?? []).filter((subMenu: any) => subMenu.key !== 'log-disdig'),
      };
    });

  const administrasiMenus = administrasiTree?.menus ?? [];
  const titelatur = administrasiMenus.find((menu: any) => menu.key === 'titelatur');
  const dataMaster = administrasiMenus.find((menu: any) => menu.key === 'data-master');
  const tertuju = (dataMaster?.subMenus ?? []).find(
    (subMenu: any) => subMenu.key === 'tertuju',
  );
  const penomoran = administrasiMenus.find((menu: any) => menu.key === 'penomoran');

  if (titelatur) menus.push(titelatur);
  if (tertuju) {
    menus.push(
      readOnlyMenu(
        {
          key: 'tertuju',
          label: 'Tertuju',
          subMenus: [tertuju],
        },
        'Tertuju',
      ),
    );
  }
  if (penomoran) menus.push(readOnlyMenu(penomoran, 'Usulan Penomoran'));

  return { ...tree, menus };
}

function tugasTreeForUser(tree: any) {
  return tree;
}

function isAllowedUserUtilitasPermission(name?: string) {
  if (!name) return true;
  if (
    name === 'digsig.read-log-disdig' ||
    name === 'digsig.create-log-disdig-alert' ||
    name.startsWith('template.')
  ) {
    return false;
  }
  if (name.startsWith('master-data.')) return name === 'master-data.read-tertuju';
  if (name.startsWith('penomoran.')) {
    const action = name.split('.').pop() || '';
    return action === 'read' || action.startsWith('read-');
  }
  return true;
}

  const currentTree = computed(() => {
    const source = treeMap[activeTab.value]?.value ?? null;
    const roleName = (role.value?.name || '').toUpperCase();
    const rawSource = roleName === 'USER'
      ? (source?.key === 'utama'
        ? utamaTreeForUser(source)
        : source?.key === 'kelola'
          ? kelolaTreeForUser(source)
          : source?.key === 'tugas'
            ? tugasTreeForUser(source)
            : source)
      : source;
    const raw = rawSource?.key === 'kelola' ? dedupeTreePermissions(rawSource) : rawSource;
    if (!raw) return null;
    if (roleName === 'USER' && raw.key === 'utilitas') {
      return utilitasTreeForUser(raw, administrasiTree.value);
    }
    if (roleName === 'USER' && raw.key === 'faq') {
      const userHidden = ['manajemen-faq', 'manajemen-pedoman'];
      return { ...raw, menus: raw.menus.filter((m: any) => !userHidden.includes(m.key)) };
    }
    if (raw.key === 'administrasi') {
      return administrasiTreeForRole(raw, roleName);
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
  const skipKeys = roleName === 'USER' ? ['administrasi', 'laporan'] : [];
  for (const tree of [utamaTree.value, kelolaTree.value, utilitasTree.value, tugasTree.value, administrasiTree.value, laporanTree.value, faqTree.value]) {
    if (!tree) continue;
    if (skipKeys.includes(tree.key)) continue;
    let menus = tree.menus ?? [];
    if (tree.key === 'administrasi') {
      menus = administrasiTreeForRole({ ...tree, menus }, roleName)?.menus ?? [];
    }
    if (tree.key === 'utilitas' && roleName === 'USER' && administrasiTree.value) {
      const extraMenus = (administrasiTree.value.menus ?? []).filter((m: any) =>
        ['titelatur', 'penomoran'].includes(m.key)
      );
      const dataMaster = (administrasiTree.value.menus ?? []).find(
        (m: any) => m.key === 'data-master',
      );
      const tertuju = (dataMaster?.subMenus ?? []).find(
        (subMenu: any) => subMenu.key === 'tertuju',
      );
      menus = [...menus, ...extraMenus];
      if (tertuju) {
        menus.push({ key: 'tertuju', label: 'Tertuju', subMenus: [tertuju] });
      }
    }
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

/**
 * Permission IDs hanya untuk tab/kategori yang sedang aktif.
 * Dipakai oleh tombol "Centang Semua" agar hanya memengaruhi tab aktif,
 * bukan semua kategori sekaligus.
 */
const currentTabPermissionIds = computed<string[]>(() => {
  const ids: string[] = [];
  const tree = currentTree.value;
  if (!tree) return ids;
  const roleName = (role.value?.name || '').toUpperCase();
  const isUserRole = roleName === 'USER';
  for (const menu of tree.menus ?? []) {
    for (const sub of menu.subMenus ?? []) {
      for (const fitur of sub.fiturs ?? []) {
        for (const perm of fitur.permissions ?? []) {
          if (perm.permissionId) ids.push(perm.permissionId);
        }
      }
    }
  }
  return ids;
});

/**
 * Apakah semua permission di tab aktif sudah tercentang.
 */
const currentTabAllChecked = computed(
  () => currentTabPermissionIds.value.length > 0 &&
        currentTabPermissionIds.value.every((id) => selectedIds.value.includes(id)),
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
function selectTab(key: typeof activeTab.value) {
  activeTab.value = key;
  const set = new Set(openKeys.value);
  set.add(key);
  if (key === 'kelola') {
    set.add('kelola-pemeliharaan');
    set.delete('kelola-penggunaan');
  }
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
    { key: 'kelola', tree: kelolaTree.value },
    { key: 'utilitas', tree: utilitasTree.value },
    { key: 'tugas', tree: tugasTree.value },
    { key: 'administrasi', tree: administrasiTree.value },
    { key: 'laporan', tree: laporanTree.value },
    { key: 'faq', tree: faqTree.value },
  ];
  if (roleName === 'USER') {
    return sections.filter(s => ['utama', 'kelola', 'utilitas', 'tugas', 'faq'].includes(s.key));
  }
  return sections;
});

function toggleCheckAll() {
  if (currentTabAllChecked.value) {
    // Hapus hanya permission di tab aktif, pertahankan centang tab lain
    const remove = new Set(currentTabPermissionIds.value);
    selectedIds.value = selectedIds.value.filter((id) => !remove.has(id));
  } else {
    // Tambah semua permission di tab aktif, pertahankan centang tab lain
    const set = new Set(selectedIds.value);
    currentTabPermissionIds.value.forEach((id) => set.add(id));
    selectedIds.value = Array.from(set);
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
      description: t('rbac_permission_saved'),
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
      await fetchPermissions();
      const permissionIdsByName = new Map(
        permissions.value.map((permission) => [permission.name, permission.id]),
      );
      const [utama, utilitas, administrasi, laporan, faq, kelola, tugas] = await Promise.all([
        fetchMatrixUtama(role.value.id),
        fetchMatrixUtilitas(role.value.id),
        fetchMatrixAdministrasi(role.value.id),
        fetchMatrixLaporan(role.value.id),
        fetchMatrixFaq(role.value.id),
        fetchMatrixKelola(role.value.id),
        fetchMatrixTugas(role.value.id),
      ]);
      utamaTree.value = hydratePermissionIds(utama.tree, permissionIdsByName);
      utilitasTree.value = hydratePermissionIds(utilitas.tree, permissionIdsByName);
      administrasiTree.value = hydratePermissionIds(administrasi.tree, permissionIdsByName);
      laporanTree.value = hydratePermissionIds(laporan.tree, permissionIdsByName);
      faqTree.value = hydratePermissionIds(faq.tree, permissionIdsByName);
      kelolaTree.value = hydratePermissionIds(kelola.tree, permissionIdsByName);
      tugasTree.value = hydratePermissionIds(tugas.tree, permissionIdsByName);
      const ids = new Set<string>((utama.assignedPermissionIds ?? []).filter(Boolean));
      (utilitas.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      (administrasi.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      (laporan.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      (faq.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      (kelola.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      (tugas.assignedPermissionIds ?? []).forEach((id: string) => ids.add(id));
      const permissionNameById = new Map(
        permissions.value.map((permission) => [permission.id, permission.name]),
      );
      selectedIds.value = Array.from(ids).filter((id) => {
        if ((role.value?.name || '').toUpperCase() !== 'USER') return true;
        const name = permissionNameById.get(id);
        if (
          name?.startsWith('digsig.') ||
          name?.startsWith('template.') ||
          name?.startsWith('master-data.') ||
          name?.startsWith('penomoran.')
        ) {
          return isAllowedUserUtilitasPermission(name);
        }
        if (name?.startsWith('sde-masal.')) {
          // Semua permission SDE Massal valid untuk role USER (verifikator/
          // konseptor). Jangan buang centangan read-detail/verify/reject.
          return true;
        }
        if (name?.startsWith('tugas.')) {
          return true;
        }
        const isKelolaPermission = [
          'pemeliharaan.pemberkasan.',
          'pemeliharaan.verifikasi.',
          'usulan-akses-berkas.',
        ].some((prefix) => name?.startsWith(prefix));
        if (isKelolaPermission) {
          if ([
            'usulan-akses-berkas.read-verifikasi',
            'usulan-akses-berkas.verify-pengusul',
            'usulan-akses-berkas.read-pemberian',
            'usulan-akses-berkas.verify-pemberi',
            'usulan-akses-berkas.approve-pemberi',
          ].includes(name || '')) return false;
          const action = name?.split('.').pop() || '';
          return action === 'read' || action.startsWith('read-');
        }
        return true;
      });
      initialIds.value = new Set(selectedIds.value);
      // Default: expand tab aktif (Utama) + menu di dalamnya
      expandAll();
    }
  } catch (e: any) {
    const status = e?.response?.status || e?.statusCode;
    if (status !== 403) {
      console.warn('[RBAC permissions] Failed to load:', e?.message || e);
    }
  } finally {
    loading.value = false;
  }
});
</script>
