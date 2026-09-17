<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <PageHeader :title="t('rbac_users_title')" :items="items" />
      </div>
      <button
        v-if="hasPermission('user', 'assign-role')"
        type="button"
        class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-800"
        @click="openAddRoleModal"
      >
        <UIcon name="i-lucide-user-plus" class="h-4 w-4" />
        {{ t('rbac_add') }}
      </button>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <DataToolbar
        v-model="listLimit"
        v-model:search="listSearch"
        :search-placeholder="t('rbac_users_list_search')"
        :show-refresh="false"
        @refresh="fetchList"
        @export="onExport"
      >
        <template #before-search>
          <USelectMenu
            v-model="listRoleFilter"
            :items="roleFilterOptions"
            value-key="value"
            label-key="label"
            :search-input="false"
            class="w-40 shrink-0"
            :ui="{ base: 'h-8 w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200' }"
            :aria-label="t('rbac_role_filter_all')"
          >
          </USelectMenu>
        </template>
      </DataToolbar>

      <DataTable
        :columns="listColumns"
        :rows="listData"
        :loading="listLoading"
        :skeleton-rows="listLimit"
        :empty-message="t('rbac_users_list_empty')"
      >
        <template #cell-name="{ row }">
          <span class="font-semibold text-gray-700 dark:text-white">{{ row.name || '-' }}</span>
        </template>
        <template #cell-persnum="{ row }">
          <span class="text-gray-600 dark:text-gray-300">{{ row.persnum || '-' }}</span>
        </template>
        <template #cell-roleName="{ row }">
          <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="roleBadgeClass(row.roleName)">
            {{ row.roleName }}
          </span>
        </template>
        <template #cell-aksi="{ row }">
          <div class="flex justify-center gap-1">
            <button
              v-if="hasPermission('user', 'assign-role')"
              type="button"
              class="rounded-lg p-2 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
              :title="t('rbac_delete')"
              @click="resetToUser(row)"
            >
              <UIcon name="i-lucide-trash-2" class="h-4 w-4 text-red-600" />
            </button>
          </div>
        </template>
      </DataTable>

      <Pagination
        :current-page="listPage"
        :total-pages="listTotalPages"
        :total-items="listTotal"
        :rows-per-page="listLimit"
        :rows-options="[]"
        @update:page="listPage = $event"
        @update:rows-per-page="listLimit = $event"
      />
    </div>

    <Modal v-model="showAddRoleModal" size="xl" :hide-default-footer="true" :hide-close-button="true">
      <template #title>
        <div class="px-5 pt-5 pb-3">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">{{ t('rbac_add_role_to_user') }}</h2>
        </div>
      </template>

      <div class="space-y-4 pb-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('rbac_modal_search_user_label') }}
          </label>
          <div class="relative">
            <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref="modalSearchInput"
              v-model="modalSearchQuery"
              type="text"
              :placeholder="t('rbac_modal_search_placeholder')"
              class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700"
              @input="modalOnSearch"
              @focus="updateModalSuggestionsPosition"
              @blur="modalHideSuggestions"
            />
            <div v-if="modalIsSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </div>

          <Teleport to="body">
            <div
              v-if="modalShowSuggestions && modalSuggestions.length"
              :style="modalSuggestionsStyle"
              class="fixed z-[var(--z-modal)] max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
              <button
                v-for="person in modalSuggestions"
                :key="person.id"
                type="button"
                class="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-primary-50 dark:hover:bg-gray-700"
                @mousedown.prevent="modalSelectPerson(person)"
              >
                <span>
                  <span class="font-medium text-gray-800 dark:text-white">{{ person.name }}</span>
                  <span class="ml-1 text-gray-500">- {{ person.persnum }}</span>
                </span>
                <span class="rounded-full px-2 py-0.5 text-xs" :class="roleBadgeClass(modalRoleMap.get(Number(person.persnum)) || 'USER')">
                  {{ modalRoleMap.get(Number(person.persnum)) || 'USER' }}
                </span>
              </button>
            </div>
          </Teleport>
        </div>

        <div v-if="modalSelectedPerson" class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div class="mb-4 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-400 font-bold uppercase text-white">
              {{ (modalSelectedPerson.name || '?').charAt(0) }}
            </div>
            <div>
              <p class="font-semibold text-gray-800 dark:text-white">{{ modalSelectedPerson.name }}</p>
              <p class="text-xs text-gray-500">{{ t('rbac_modal_persnum_label') }} {{ modalSelectedPerson.persnum }}</p>
            </div>
          </div>

          <div v-if="canAssignRole" class="mb-4 flex flex-col gap-2 sm:flex-row">
            <USelectMenu
              v-model="modalSelectedRoleId"
              :items="assignableRoleOptions"
              value-key="value"
              label-key="label"
              :search-input="false"
              :placeholder="t('rbac_roles_name_placeholder')"
              class="min-w-0 flex-1"
              :ui="{
                base: 'h-10 w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200',
                content: 'z-[var(--z-toast)]',
              }"
            >
            </USelectMenu>
            <button
              v-if="hasPermission('user', 'assign-role')"
              type="button"
              :disabled="!modalSelectedRoleId || modalAssigning"
              class="rounded-md bg-primary px-4 py-2 text-sm whitespace-nowrap text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
              @click="modalAssignRole"
            >
              {{ modalAssigning ? t('rbac_saving') : t('rbac_assign_role') }}
            </button>
          </div>

          <div>
            <p class="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-300">{{ t('rbac_current_roles') }}</p>
            <div v-if="modalUserRoles.length === 0" class="text-xs italic text-gray-400">{{ t('rbac_no_role') }}</div>
            <div v-else class="flex flex-col gap-2">
              <div
                v-for="userRole in modalUserRoles"
                :key="userRole.id"
                class="flex items-center gap-2"
              >
                <span
                  class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                  :class="roleBadgeClass(userRole.roleName)"
                >
                  {{ userRole.roleName }}
                </span>
                <button
                  v-if="modalCanRemove(userRole) && hasPermission('user', 'assign-role')"
                  type="button"
                  class="rounded-md p-1 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
                  :title="t('rbac_modal_remove_role_title')"
                  :aria-label="t('rbac_delete')"
                  @click="modalRemoveRole(userRole)"
                >
                  <UIcon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="py-8 text-center text-sm text-gray-400">{{ t('rbac_modal_empty_hint') }}</div>
      </div>

      <template #footer>
        <div class="flex justify-end border-t border-gray-300 px-5 py-3 dark:border-gray-700">
          <button
            type="button"
            class="rounded-lg border border-primary-500 px-4 py-2 text-sm text-primary hover:bg-primary-100"
            @click="showAddRoleModal = false"
          >
            {{ t('rbac_modal_close') }}
          </button>
        </div>
      </template>
    </Modal>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRbac, type RbacUserRoleRow, type UserRoleListItem } from '~/composables/useRbac';
import { usePerson, type PersonSuggestion } from '~/composables/usePerson';
import { Alert, useAlertState } from '~/composables/useAlert';
import { useToast } from '#imports';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();
const toast = useToast();
const { roles, fetchRoles, fetchUserRoles, fetchAllUserRoles, assignRoleToUser, removeRoleFromUser, getRolesBatch } = useRbac();
const { searchPersons } = usePerson();
const { user: authUser, hasPermission } = useAuth();

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title'), to: '/rbac/roles' },
  { label: t('rbac_users'), to: '/rbac/users' },
]);

const listSearch = ref('');
const listLimit = ref(10);
const listPage = ref(1);
const listTotal = ref(0);
const listData = ref<UserRoleListItem[]>([]);
const listLoading = ref(false);
const ALL_ROLES = '__all__';
const listRoleFilter = ref(ALL_ROLES);
const listTotalPages = computed(() => Math.max(1, Math.ceil(listTotal.value / listLimit.value)));

const roleFilterOptions = computed(() => [
  { label: t('rbac_role_filter_all'), value: ALL_ROLES },
  { label: 'SUPERADMIN', value: 'SUPERADMIN' },
  { label: 'ADMIN', value: 'ADMIN' },
]);

const listColumns = computed(() => [
  { key: 'name', label: t('namauser') || 'Nama', class: 'px-7' },
  { key: 'persnum', label: t('rbac_personnel_number') },
  { key: 'roleName', label: t('rbac_roles') },
  { key: 'aksi', label: t('rbac_col_aksi'), headerClass: 'text-center', class: 'text-center' },
]);

const fetchList = async () => {
  listLoading.value = true;
  try {
    const result = await fetchAllUserRoles({
      search: listSearch.value.trim() || undefined,
      roleName: listRoleFilter.value === ALL_ROLES ? undefined : listRoleFilter.value,
      page: listPage.value,
      limit: listLimit.value,
    });
    listData.value = result.data.filter((row) => ['ADMIN', 'SUPERADMIN'].includes((row.roleName || '').toUpperCase()));
    listTotal.value = result.total;
  } catch {
    listData.value = [];
    listTotal.value = 0;
  } finally {
    listLoading.value = false;
  }
};

const onExport = () => {
  if (listData.value.length === 0) {
    toast.add({
      title: t('rbac_info'),
      description: t('rbac_export_no_data'),
      color: 'warning',
      icon: 'i-lucide-info',
    });
    return;
  }

  const data = listData.value.map((row, index) => ({
    [t('rbac_export_col_no')]: index + 1,
    [t('namauser') || 'Nama']: row.name || '-',
    [t('rbac_personnel_number')]: row.persnum,
    [t('rbac_roles')]: row.roleName,
    [t('rbac_status')]: row.active ? 'Aktif' : 'Nonaktif',
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'User Role');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `rbac_user_roles_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
  toast.add({
    title: t('rbac_success'),
    description: t('rbac_export_success'),
    color: 'success',
    icon: 'i-lucide-check-circle',
  });
};

watch([listSearch, listLimit, listRoleFilter], () => {
  listPage.value = 1;
  fetchList();
});
watch(listPage, fetchList);

const assignableRoles = computed(() => {
  const existing = new Set(
    modalUserRoles.value
      .filter((role) => role.active)
      .map((role) => (role.roleName || '').toUpperCase()),
  );
  return roles.value.filter((role) => {
    const name = role.name.toUpperCase();
    if (!['ADMIN', 'SUPERADMIN'].includes(name) || existing.has(name)) return false;
    return !(name === 'ADMIN' && existing.has('SUPERADMIN')) && !(name === 'SUPERADMIN' && existing.has('ADMIN'));
  });
});

const assignableRoleOptions = computed(() =>
  assignableRoles.value.map((role) => ({ label: role.name, value: role.id })),
);

const hasAssignedPrivilegedRole = computed(() =>
  modalUserRoles.value.some(
    (role) => role.active && ['ADMIN', 'SUPERADMIN'].includes((role.roleName || '').toUpperCase()),
  ),
);

const canAssignRole = computed(
  () => Boolean(modalSelectedPerson.value) && !hasAssignedPrivilegedRole.value && assignableRoleOptions.value.length > 0,
);

const showAddRoleModal = ref(false);
const modalSearchQuery = ref('');
const modalSuggestions = ref<PersonSuggestion[]>([]);
const modalShowSuggestions = ref(false);
const modalIsSearching = ref(false);
const modalSelectedPerson = ref<PersonSuggestion | null>(null);
const modalSelectedRoleId = ref('');
const modalUserRoles = ref<RbacUserRoleRow[]>([]);
const modalAssigning = ref(false);
const modalRoleMap = ref<Map<number, string>>(new Map());
const modalSearchInput = ref<HTMLInputElement | null>(null);
const modalSuggestionsStyle = ref<Record<string, string>>({});
let modalSearchTimer: ReturnType<typeof setTimeout> | null = null;

const updateModalSuggestionsPosition = () => {
  const input = modalSearchInput.value;
  if (!input) return;
  const rect = input.getBoundingClientRect();
  modalSuggestionsStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
};

const openAddRoleModal = () => {
  showAddRoleModal.value = true;
  modalSearchQuery.value = '';
  modalSuggestions.value = [];
  modalShowSuggestions.value = false;
  modalSelectedPerson.value = null;
  modalSelectedRoleId.value = '';
  modalUserRoles.value = [];
};

const modalOnSearch = () => {
  if (modalSearchTimer) clearTimeout(modalSearchTimer);
  if (!modalSearchQuery.value.trim()) {
    modalSuggestions.value = [];
    modalShowSuggestions.value = false;
    return;
  }
  modalSearchTimer = setTimeout(async () => {
    modalIsSearching.value = true;
    try {
      const response: any = await searchPersons(modalSearchQuery.value.trim());
      modalSuggestions.value = response?.data?.data ?? [];
      modalShowSuggestions.value = modalSuggestions.value.length > 0;
      modalRoleMap.value = await getRolesBatch(modalSuggestions.value.map((person) => person.persnum));
      await nextTick();
      updateModalSuggestionsPosition();
    } catch {
      modalSuggestions.value = [];
      modalShowSuggestions.value = false;
    } finally {
      modalIsSearching.value = false;
    }
  }, 300);
};

const modalHideSuggestions = () => setTimeout(() => (modalShowSuggestions.value = false), 150);

watch(showAddRoleModal, (isOpen) => {
  if (!isOpen) modalShowSuggestions.value = false;
});

const modalSelectPerson = async (person: PersonSuggestion) => {
  modalSelectedPerson.value = person;
  modalShowSuggestions.value = false;
  modalSearchQuery.value = `${person.name} - ${person.persnum}`;
  try {
    modalUserRoles.value = await fetchUserRoles(person.persnum);
  } catch {
    modalUserRoles.value = [];
  }
};

const modalAssignRole = async () => {
  if (!modalSelectedPerson.value || !modalSelectedRoleId.value) return;
  const roleName = roles.value.find((role) => role.id === modalSelectedRoleId.value)?.name?.toUpperCase();
  if (!roleName || !['ADMIN', 'SUPERADMIN'].includes(roleName)) return;

  modalAssigning.value = true;
  try {
    await assignRoleToUser(modalSelectedPerson.value.persnum, modalSelectedRoleId.value, null);
    toast.add({ title: t('rbac_success'), description: t('rbac_role_assigned_to', { name: modalSelectedPerson.value.name }), color: 'success', icon: 'i-lucide-check-circle' });
    modalUserRoles.value = await fetchUserRoles(modalSelectedPerson.value.persnum);
    modalSelectedRoleId.value = '';
    await fetchList();
  } catch (error: any) {
    toast.add({ title: t('rbac_fail'), description: error?.message || t('rbac_role_assign_fail'), color: 'error', icon: 'i-lucide-x-circle' });
  } finally {
    modalAssigning.value = false;
  }
};

const modalCanRemove = (userRole: RbacUserRoleRow) => {
  if (!userRole.active) return false;
  const name = (userRole.roleName || '').toUpperCase();
  return name !== 'USER';
};

const modalRemoveRole = async (userRole: RbacUserRoleRow) => {
  if (!modalSelectedPerson.value) return;
  const confirmed = await Alert.confirm(t('rbac_remove_role_title'), t('rbac_remove_role_desc'), t('rbac_delete'), t('rbac_cancel'), true);
  if (!confirmed) return;
  useAlertState().isLoading = true;
  try {
    await removeRoleFromUser(modalSelectedPerson.value.persnum, userRole.roleId);
    Alert.close();
    modalUserRoles.value = await fetchUserRoles(modalSelectedPerson.value.persnum);
    await fetchList();
    toast.add({ title: t('rbac_success'), description: t('rbac_role_removed_from', { name: modalSelectedPerson.value.name }), color: 'success', icon: 'i-lucide-check-circle' });
  } catch (error: any) {
    Alert.close();
    toast.add({ title: t('rbac_fail'), description: error?.message || t('rbac_role_remove_fail'), color: 'error', icon: 'i-lucide-x-circle' });
  }
};

const roleBadgeClass = (name?: string) => {
  const normalized = (name || '').toUpperCase();
  return normalized === 'SUPERADMIN'
    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    : normalized === 'ADMIN'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

const resetToUser = async (row: UserRoleListItem) => {
  const confirmed = await Alert.confirm(
    t('rbac_reset_to_user_title') || 'Reset ke User?',
    t('rbac_reset_to_user_desc', { name: row.name, role: row.roleName }) || `Role ${row.roleName} akan dihapus dari ${row.name}.`,
    t('rbac_delete'),
    t('rbac_cancel'),
    true,
  );
  if (!confirmed) return;
  useAlertState().isLoading = true;
  try {
    await removeRoleFromUser(row.persnum, row.roleId);
    Alert.close();
    await fetchList();
    toast.add({ title: t('rbac_success'), description: t('rbac_reset_success', { name: row.name }) || t('rbac_role_removed'), color: 'success', icon: 'i-lucide-check-circle' });
  } catch (error: any) {
    Alert.close();
    toast.add({ title: t('rbac_fail'), description: error?.message || t('rbac_role_remove_fail'), color: 'error', icon: 'i-lucide-x-circle' });
  }
};

onMounted(() => {
  fetchRoles();
  fetchList();
});
</script>
