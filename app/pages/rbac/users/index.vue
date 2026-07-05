<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <div>
        <PageHeader :title="`${t('rbac_users_title')} ${t('rbac_superadmin_only')}`" :items="items" />
        <p class="text-sm text-gray-500 dark:text-gray-400 -mt-3">
          {{ t('rbac_users_subtitle') }}
        </p>
      </div>
      <button
        v-if="hasPermission('role', 'create')"
        @click="openAddRoleModal"
        class="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-lg transition-colors"
      >
        <UIcon name="i-lucide-user-plus" class="w-4 h-4" />
        {{ t('rbac_roles_add') }}
      </button>
    </div>

    <!-- B6: Tabel list user dengan role -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <DataToolbar
        v-model="listLimit"
        v-model:search="listSearch"
        :search-placeholder="t('rbac_users_list_search')"
        @refresh="fetchList"
      >
        <template #actions>
          <select
            v-model="listRoleFilter"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg"
            @change="fetchList"
          >
            <option value="">{{ t('rbac_role_filter_all') }}</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </template>
      </DataToolbar>

      <DataTable
        :columns="listColumns"
        :rows="listData"
        :loading="listLoading"
        :skeleton-rows="listLimit"
        :empty-message="t('rbac_users_list_empty')"
      >
        <template #cell-user="{ row }">
          <NuxtLink
            :to="`/rbac/users/${row.persnum}/roles`"
            class="flex items-start space-x-3 ml-3 hover:text-primary"
          >
            <div class="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs font-semibold uppercase">
              {{ (row.name || '?').charAt(0) }}
            </div>
            <div>
              <p class="font-semibold text-gray-700 dark:text-white">{{ row.name || '-' }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.persnum }}</p>
            </div>
          </NuxtLink>
        </template>
        <template #cell-roleName="{ row }">
          <RoleBadge :role="row.roleName" />
        </template>
        <template #cell-unitKerja="{ row }">
          <span class="text-gray-600 dark:text-gray-300">{{ row.unitKerja || '-' }}</span>
        </template>
        <template #cell-active="{ row }">
          <StatusBadge :active="row.active" />
        </template>
        <template #cell-aksi="{ row }">
          <div class="flex justify-center gap-2">
            <NuxtLink
              v-if="hasPermission('role', 'update')"
              :to="`/rbac/users/${row.persnum}/roles`"
              class="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
              :title="t('rbac_detail')"
            >
              <UIcon name="i-lucide-eye" class="w-4 h-4 text-primary group-hover:text-primary-700" />
            </NuxtLink>
            <button
              v-if="hasPermission('role', 'delete') && (row.roleName === 'SUPERADMIN' || row.roleName === 'ADMIN')"
              @click="resetToUser(row)"
              class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
              :title="t('rbac_reset_to_user') || 'Reset ke User'"
            >
              <UIcon name="i-lucide-trash-2" class="w-4 h-4 text-red-600 group-hover:text-red-700" />
            </button>
          </div>
        </template>
      </DataTable>

      <DataPagination
        v-model:current-page="listPage"
        :total-items="listTotal"
        :per-page="listLimit"
      />
    </div>

    <!-- Modal Tambah Role -->
    <div v-if="showAddRoleModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50 transition-opacity" @click="closeAddRoleModal"></div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto relative z-10">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('rbac_modal_add_title') }}</h3>
          <button @click="closeAddRoleModal" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Search user -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('rbac_modal_search_user_label') }}</label>
            <div class="relative">
              <UIcon name="i-lucide-search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                v-model="modalSearchQuery"
                type="text"
                :placeholder="t('rbac_modal_search_placeholder')"
                class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                @input="modalOnSearch"
                @blur="modalHideSuggestions"
              />
              <div v-if="modalIsSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
                <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <div
                v-if="modalShowSuggestions && modalSuggestions.length > 0"
                class="absolute z-30 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                <div
                  v-for="person in modalSuggestions"
                  :key="person.id"
                  @mousedown.prevent="modalSelectPerson(person)"
                  class="px-4 py-2.5 cursor-pointer text-sm hover:bg-primary-50 dark:hover:bg-gray-700 flex items-center justify-between"
                >
                  <div>
                    <span class="font-medium text-gray-800 dark:text-white">{{ person.name }}</span>
                    <span class="text-gray-500 ml-1">- {{ person.persnum }}</span>
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full" :class="roleBadgeClass(modalRoleMap.get(Number(person.persnum)) || 'USER')">
                    {{ modalRoleMap.get(Number(person.persnum)) || 'USER' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected user + assign form -->
          <div v-if="modalSelectedPerson" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold uppercase">
                {{ (modalSelectedPerson.name || '?').charAt(0) }}
              </div>
              <div>
                <p class="font-semibold text-gray-800 dark:text-white">{{ modalSelectedPerson.name }}</p>
                <p class="text-xs text-gray-500">{{ t('rbac_modal_persnum_label') }} {{ modalSelectedPerson.persnum }}</p>
              </div>
            </div>

            <!-- Assign form -->
            <div class="flex items-center gap-2 mb-4 flex-wrap">
              <select v-model="modalSelectedRoleId" class="border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 flex-1 min-w-[140px]">
                <option value="" disabled>{{ t('rbac_roles_name_placeholder') }}</option>
                <option v-for="r in assignableRoles" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
              <button
                v-if="hasPermission('user', 'assign-role')"
                @click="modalAssignRole"
                :disabled="!modalSelectedRoleId || modalAssigning"
                class="px-4 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {{ modalAssigning ? t('rbac_saving') : t('rbac_modal_assign_btn') }}
              </button>
            </div>

            <!-- Current roles -->
            <div>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">{{ t('rbac_modal_current_roles') }}</p>
              <div v-if="modalUserRoles.length === 0" class="text-xs text-gray-400 italic">{{ t('rbac_modal_no_role') }}</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="ur in modalUserRoles" :key="ur.id"
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                  :class="roleBadgeClass(ur.roleName)">
                  <UIcon name="i-lucide-shield" class="w-3 h-3" />
                  {{ ur.roleName }}
                  <StatusBadge :active="ur.active" />
                  <button
                    v-if="modalCanRemove(ur)"
                    @click="modalRemoveRole(ur)"
                    class="ml-1 text-red-500 hover:text-red-700"
                    :title="t('rbac_modal_remove_role_title')">
                    <UIcon name="i-lucide-x" class="w-3 h-3" />
                  </button>
                </span>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-8 text-gray-400 text-sm">
            {{ t('rbac_modal_empty_hint') }}
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button @click="closeAddRoleModal" class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white">
            {{ t('rbac_modal_close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRbac, type RbacUserRoleRow, type UserRoleListItem } from '~/composables/useRbac';
import { usePerson, type PersonSuggestion } from '~/composables/usePerson';
import { useToast } from '#imports';
import { Alert, useAlertState } from '~/composables/useAlert';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();
const toast = useToast();
const { roles, fetchRoles, fetchUserRoles, fetchAllUserRoles, assignRoleToUser, removeRoleFromUser, getRolesBatch } = useRbac();
const { searchPersons } = usePerson();
const { user: authUser, hasPermission } = useAuth();

// Hanya SUPERADMIN & ADMIN yang bisa di-assign (USER adalah default, tidak perlu dipilih)
const assignableRoles = computed(() => roles.value.filter((r) => r.name !== 'USER'));

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title'), to: '/rbac/roles' },
  { label: t('rbac_users'), to: '/rbac/users' },
]);

// ── B6: Tabel list user dengan role ──────────────────────────
const listSearch = ref('');
const listLimit = ref(10);
const listPage = ref(1);
const listTotal = ref(0);
const listData = ref<UserRoleListItem[]>([]);
const listLoading = ref(false);
const listRoleFilter = ref('');

const listColumns = computed(() => [
  { key: 'user', label: t('namauser') || 'User', class: 'px-7' },
  { key: 'roleName', label: t('rbac_roles') },
  { key: 'unitKerja', label: t('rbac_unit_kerja') },
  { key: 'active', label: t('rbac_status'), headerClass: 'text-center', class: 'text-center' },
  { key: 'aksi', label: t('rbac_col_aksi'), headerClass: 'text-center', class: 'text-center' },
]);

const fetchList = async () => {
  listLoading.value = true;
  try {
    const result = await fetchAllUserRoles({
      search: listSearch.value || undefined,
      roleName: listRoleFilter.value || undefined,
      page: listPage.value,
      limit: listLimit.value,
    });
    // Bug fix: jangan filter klien-side ( bikin pagination rusak & total salah).
    // Backend /rbac/users sudah mengembalikan data sesuai filter roleName + pagination.
    listData.value = result.data;
    listTotal.value = result.total;
  } catch {
    listData.value = [];
    listTotal.value = 0;
  } finally {
    listLoading.value = false;
  }
};

watch([listSearch, listLimit, listRoleFilter], () => {
  listPage.value = 1;
  fetchList();
});

watch(listPage, () => fetchList());

// ── Modal state ──────────────────────────────────────────────
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
let modalSearchTimer: ReturnType<typeof setTimeout> | null = null;

const openAddRoleModal = () => {
  showAddRoleModal.value = true;
  modalSearchQuery.value = '';
  modalSuggestions.value = [];
  modalShowSuggestions.value = false;
  modalSelectedPerson.value = null;
  modalSelectedRoleId.value = '';
  modalUserRoles.value = [];
};

const closeAddRoleModal = () => {
  showAddRoleModal.value = false;
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
      const res: any = await searchPersons(modalSearchQuery.value);
      modalSuggestions.value = res?.data?.data ?? [];
      modalShowSuggestions.value = modalSuggestions.value.length > 0;
      if (modalSuggestions.value.length > 0) {
        try {
          modalRoleMap.value = await getRolesBatch(modalSuggestions.value.map((s) => s.persnum));
        } catch {
          modalRoleMap.value = new Map();
        }
      }
    } catch {
      modalSuggestions.value = [];
      modalShowSuggestions.value = false;
    } finally {
      modalIsSearching.value = false;
    }
  }, 300);
};

const modalHideSuggestions = () => {
  setTimeout(() => (modalShowSuggestions.value = false), 150);
};

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
  modalAssigning.value = true;
  // Optimistic update — tambah ke state lokal dulu
  const tempRole: RbacUserRoleRow = {
    id: 'temp-' + Date.now(),
    roleId: modalSelectedRoleId.value,
    roleName: roles.value.find((r) => r.id === modalSelectedRoleId.value)?.name || '',
    unitKerja: null,
    active: true,
    createdAt: new Date().toISOString() as any,
  };
  modalUserRoles.value = [...modalUserRoles.value, tempRole];
  try {
    await assignRoleToUser(modalSelectedPerson.value.persnum, modalSelectedRoleId.value, null);
    toast.add({
      title: t('rbac_success'),
      description: t('rbac_role_assigned_to', { name: modalSelectedPerson.value.name }),
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    modalUserRoles.value = await fetchUserRoles(modalSelectedPerson.value.persnum);
    modalSelectedRoleId.value = '';
    await fetchList();
  } catch (e: any) {
    // Rollback optimistic update
    modalUserRoles.value = modalUserRoles.value.filter((r) => r.id !== tempRole.id);
    toast.add({
      title: t('rbac_fail'),
      description: e?.message || t('rbac_role_assign_fail'),
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
  } finally {
    modalAssigning.value = false;
  }
};

const modalCanRemove = (ur: RbacUserRoleRow) => {
  // Badge USER adalah role default — tidak bisa dihapus, hanya SUPERADMIN & ADMIN yang bisa dihapus.
  const name = (ur.roleName || '').toUpperCase();
  if (name === 'USER') return false;
  if (name === 'SUPERADMIN' && authUser.value?.persnum === modalSelectedPerson.value?.persnum) {
    return false;
  }
  return true;
};

const modalRemoveRole = async (ur: RbacUserRoleRow) => {
  if (!modalSelectedPerson.value) return;
  const isSuperadmin = ur.roleName === 'SUPERADMIN';
  const title = isSuperadmin ? t('rbac_remove_superadmin_title') : t('rbac_remove_role_title');
  const message = isSuperadmin
    ? t('rbac_remove_superadmin_desc')
    : t('rbac_remove_role_desc');
  const ok = await Alert.confirm(
    title,
    message,
    t('rbac_delete'),
    t('rbac_cancel'),
    true
  );
  if (!ok) return;
  // Nyalakan spinner di tombol confirm Alert selama proses hapus berlangsung.
  const alertState = useAlertState();
  alertState.isLoading = true;
  // Optimistic update — hapus dari state lokal dulu
  modalUserRoles.value = modalUserRoles.value.filter((r) => r.id !== ur.id);
  try {
    await removeRoleFromUser(modalSelectedPerson.value.persnum, ur.roleId);
    Alert.close();
    toast.add({
      title: t('rbac_success'),
      description: t('rbac_role_removed_from', { name: modalSelectedPerson.value.name }),
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    modalUserRoles.value = await fetchUserRoles(modalSelectedPerson.value.persnum);
    await fetchList();
  } catch (e: any) {
    // Tutup alert & reset loading
    Alert.close();
    // Rollback
    modalUserRoles.value = await fetchUserRoles(modalSelectedPerson.value.persnum);
    toast.add({
      title: t('rbac_fail'),
      description: e?.message || t('rbac_role_remove_fail'),
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
  }
};

const roleBadgeClass = (name?: string) => {
  const n = (name || '').toUpperCase();
  if (n === 'SUPERADMIN')
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  if (n === 'ADMIN') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

// Reset role user ke default USER (hapus role SUPERADMIN/ADMIN)
const resetToUser = async (row: UserRoleListItem) => {
  const ok = await Alert.confirm(
    t('rbac_reset_to_user_title') || 'Reset ke User?',
    t('rbac_reset_to_user_desc', { name: row.name, role: row.roleName }) || `User "${row.name}" akan direset menjadi User biasa. Role ${row.roleName} akan dihapus. Yakin?`,
    t('rbac_delete') || 'Hapus',
    t('rbac_cancel') || 'Batal',
    true
  );
  if (!ok) return;
  const alertState = useAlertState();
  alertState.isLoading = true;
  try {
    await removeRoleFromUser(row.persnum, row.roleId);
    Alert.close();
    toast.add({
      title: t('rbac_success'),
      description: t('rbac_reset_success', { name: row.name }) || `Role ${row.roleName} dihapus. ${row.name} sekarang User biasa.`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    await fetchList();
  } catch (e: any) {
    Alert.close();
    toast.add({
      title: t('rbac_fail'),
      description: e?.message || (t('rbac_role_remove_fail') || 'Gagal reset role'),
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
  }
};

onMounted(() => {
  fetchRoles();
  fetchList();
});
</script>