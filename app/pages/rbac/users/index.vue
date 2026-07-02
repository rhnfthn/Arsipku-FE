<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <div>
        <PageHeader :title="t('rbac_users_title') || 'Manajemen User Role'" :items="items" />
        <p class="text-sm text-gray-500 dark:text-gray-400 -mt-3">
          {{ t('rbac_users_subtitle') || 'Cari user berdasarkan nama/persnum, lalu tetapkan role.' }}
        </p>
      </div>
      <button
        @click="scrollToSearch"
        class="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-lg transition-colors"
      >
        <UIcon name="i-lucide-user-plus" class="w-4 h-4" />
        {{ t('rbac_add_role') || 'Tambah Role User' }}
      </button>
    </div>

    <!-- B6: Tabel list user dengan role -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors mb-4">
      <DataToolbar
        v-model="listLimit"
        v-model:search="listSearch"
        :search-placeholder="t('rbac_users_list_search') || 'Cari nama/persnum...'"
        @refresh="fetchList"
      >
        <template #actions>
          <select
            v-model="listRoleFilter"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg"
            @change="fetchList"
          >
            <option value="">Semua Role</option>
            <option v-for="r in roles" :key="r.id" :value="r.name">{{ r.name }}</option>
          </select>
        </template>
      </DataToolbar>

      <DataTable
        :columns="listColumns"
        :rows="listData"
        :loading="listLoading"
        :skeleton-rows="listLimit"
        :empty-message="t('rbac_users_list_empty') || 'Belum ada user dengan role.'"
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
              :to="`/rbac/users/${row.persnum}/roles`"
              class="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
              :title="t('rbac_detail') || 'Detail'"
            >
              <UIcon name="i-lucide-eye" class="w-4 h-4 text-primary group-hover:text-primary-700" />
            </NuxtLink>
            <NuxtLink
              :to="`/rbac/users/${row.persnum}/roles?action=add`"
              class="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
              :title="t('rbac_add_role') || 'Tambah Role'"
            >
              <UIcon name="i-lucide-user-plus" class="w-4 h-4 text-green-600 group-hover:text-green-700" />
            </NuxtLink>
          </div>
        </template>
      </DataTable>

      <DataPagination
        v-model:current-page="listPage"
        :total-items="listTotal"
        :per-page="listLimit"
      />
    </div>

    <!-- Search box (untuk assign role ke user baru) -->
    <div id="rbac-user-search-box" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-4">
      <div class="relative max-w-xl">
        <UIcon name="i-lucide-search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('rbac_users_search_placeholder') || 'Cari nama / persnum...'"
          class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          @input="onSearch"
          @blur="hideSuggestions"
        />
        <div
          v-if="isSearching"
          class="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div
          v-if="showSuggestions && suggestions.length > 0"
          class="absolute z-30 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          <div
            v-for="person in suggestions"
            :key="person.id"
            @mousedown.prevent="selectPerson(person)"
            class="px-4 py-2 cursor-pointer text-sm hover:bg-primary-50 dark:hover:bg-gray-700 flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <span class="font-medium text-gray-800 dark:text-white">{{ person.name }}</span>
              <span class="text-gray-500 ml-1">- {{ person.persnum }}</span>
              <span v-if="person.position_text" class="block text-xs text-gray-400">{{ person.position_text }}</span>
            </div>
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
              :class="roleBadgeClass(roleMap.get(Number(person.persnum)) || 'USER')"
            >
              <UIcon name="i-lucide-shield" class="w-3 h-3" />
              {{ roleMap.get(Number(person.persnum)) || 'USER' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected user card -->
    <div
      v-if="selectedPerson"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-5 mb-4"
    >
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold uppercase">
            {{ (selectedPerson.name || '?').charAt(0) }}
          </div>
          <div>
            <p class="font-semibold text-gray-800 dark:text-white">{{ selectedPerson.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Persnum: {{ selectedPerson.persnum }}</p>
            <p v-if="selectedPerson.position_text" class="text-xs text-gray-400">{{ selectedPerson.position_text }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select
            v-model="selectedRoleId"
            class="border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600"
          >
            <option value="" disabled>{{ t('rbac_roles_name_placeholder') || 'Pilih Role' }}</option>
            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <input
            v-model="unitKerja"
            type="text"
            :placeholder="t('rbac_unit_kerja_placeholder') || 'Unit Kerja (opsional)'"
            class="border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 w-40"
          />
          <button
            @click="assignRole"
            :disabled="!selectedRoleId || assigning"
            class="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md disabled:opacity-50 transition-colors"
          >
            {{ assigning ? t('rbac_saving') || 'Menyimpan...' : (t('rbac_assign_role') || 'Assign Role') }}
          </button>
        </div>
      </div>

      <!-- Current roles -->
      <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {{ t('rbac_current_roles') || 'Role Saat Ini:' }}
          </p>
          <NuxtLink
            :to="`/rbac/users/${selectedPerson.persnum}/roles`"
            class="text-xs text-primary hover:underline"
          >
            {{ t('rbac_manage_detail') || 'Kelola detail' }}
          </NuxtLink>
        </div>
        <div v-if="userRoles.length === 0" class="text-xs text-gray-400 italic">
          {{ t('rbac_no_role') || 'Belum punya role (default USER)' }}
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="ur in userRoles"
            :key="ur.id"
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            :class="roleBadgeClass(ur.roleName)"
          >
            <UIcon name="i-lucide-shield" class="w-3 h-3" />
            {{ ur.roleName }}
            <span v-if="ur.unitKerja" class="text-xs opacity-70">({{ ur.unitKerja }})</span>
            <StatusBadge :active="ur.active" />
            <button
              v-if="canRemove(ur)"
              @click="removeRole(ur)"
              class="ml-1 text-red-500 hover:text-red-700"
              :title="t('rbac_delete') || 'Hapus role'"
            >
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
          </span>
        </div>
      </div>
    </div>

    <div
      v-else
      class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-10 text-center text-gray-400"
    >
      {{ t('rbac_users_empty_hint') || 'Cari user untuk mulai assign role.' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRbac, type RbacUserRoleRow, type UserRoleListItem } from '~/composables/useRbac';
import { usePerson, type PersonSuggestion } from '~/composables/usePerson';
import { useToast } from '#imports';
import { Alert } from '~/composables/useAlert';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();
const toast = useToast();
const { roles, fetchRoles, fetchUserRoles, fetchAllUserRoles, assignRoleToUser, removeRoleFromUser, getRolesBatch } = useRbac();
const { searchPersons } = usePerson();
const { user: authUser } = useAuth();

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title') || 'Manajemen RBAC', to: '/rbac' },
  { label: t('rbac_users') || 'Assign Role User', to: '/rbac/users' },
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
  { key: 'roleName', label: t('rbac_roles') || 'Role' },
  { key: 'unitKerja', label: t('rbac_unit_kerja') || 'Unit Kerja' },
  { key: 'active', label: t('rbac_status') || 'Status', headerClass: 'text-center', class: 'text-center' },
  { key: 'aksi', label: t('rbac_col_aksi') || 'Aksi', headerClass: 'text-center', class: 'text-center' },
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

const searchQuery = ref('');
const suggestions = ref<PersonSuggestion[]>([]);
const showSuggestions = ref(false);
const isSearching = ref(false);
const selectedPerson = ref<PersonSuggestion | null>(null);
const selectedRoleId = ref('');
const unitKerja = ref('');
const userRoles = ref<RbacUserRoleRow[]>([]);
const assigning = ref(false);
const roleMap = ref<Map<number, string>>(new Map());
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const scrollToSearch = () => {
  const el = document.getElementById('rbac-user-search-box');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = el.querySelector('input');
    if (input) input.focus();
  }
};

const onSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  if (!searchQuery.value.trim()) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  searchTimer = setTimeout(async () => {
    isSearching.value = true;
    try {
      const res: any = await searchPersons(searchQuery.value);
      suggestions.value = res?.data?.data ?? [];
      showSuggestions.value = suggestions.value.length > 0;
      if (suggestions.value.length > 0) {
        try {
          roleMap.value = await getRolesBatch(suggestions.value.map((s) => s.persnum));
        } catch {
          roleMap.value = new Map();
        }
      }
    } catch {
      suggestions.value = [];
      showSuggestions.value = false;
    } finally {
      isSearching.value = false;
    }
  }, 300);
};

const hideSuggestions = () => {
  setTimeout(() => (showSuggestions.value = false), 150);
};

const selectPerson = async (person: PersonSuggestion) => {
  selectedPerson.value = person;
  showSuggestions.value = false;
  searchQuery.value = `${person.name} - ${person.persnum}`;
  await loadUserRoles(person.persnum);
};

const loadUserRoles = async (persnum: number | string) => {
  try {
    userRoles.value = await fetchUserRoles(persnum);
  } catch {
    userRoles.value = [];
  }
};

const assignRole = async () => {
  if (!selectedPerson.value || !selectedRoleId.value) return;
  assigning.value = true;
  try {
    await assignRoleToUser(selectedPerson.value.persnum, selectedRoleId.value, unitKerja.value || null);
    toast.add({
      title: t('rbac_success') || 'Sukses',
      description:
        (t('rbac_role_assigned_notice') ||
          'Role berhasil di-assign. Perubahan berlaku segera (maks ~30 detik) untuk user ini.') +
        ` (${selectedPerson.value.name})`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    await loadUserRoles(selectedPerson.value.persnum);
    selectedRoleId.value = '';
    unitKerja.value = '';
  } catch (e: any) {
    toast.add({
      title: t('rbac_fail') || 'Gagal',
      description: e?.message || (t('rbac_role_assign_fail') || 'Gagal assign role'),
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
  } finally {
    assigning.value = false;
  }
};

const canRemove = (ur: RbacUserRoleRow) => {
  if (ur.roleName === 'SUPERADMIN' && authUser.value?.persnum === selectedPerson.value?.persnum) {
    return false;
  }
  return true;
};

const removeRole = async (ur: RbacUserRoleRow) => {
  if (!selectedPerson.value) return;
  // B9: confirm dialog khusus untuk SUPERADMIN
  const isSuperadmin = ur.roleName === 'SUPERADMIN';
  const title = isSuperadmin
    ? (t('rbac_remove_superadmin_title') || 'Hapus Role SUPERADMIN?')
    : (t('rbac_remove_role_title') || 'Hapus Role?');
  const message = isSuperadmin
    ? (t('rbac_remove_superadmin_desc') ||
      `Anda akan menghapus role SUPERADMIN dari "${selectedPerson.value.name}". User ini akan kehilangan semua akses superadmin. Yakin?`)
    : (t('rbac_remove_role_desc') || `Hapus role "${ur.roleName}" dari user ini?`);
  const ok = await Alert.confirm(
    title,
    message,
    t('rbac_delete') || 'Hapus',
    t('rbac_cancel') || 'Batal',
    true
  );
  if (!ok) return;
  try {
    await removeRoleFromUser(selectedPerson.value.persnum, ur.roleId);
    toast.add({
      title: t('rbac_success') || 'Sukses',
      description:
        (t('rbac_role_removed_notice') ||
          'Role dihapus. Perubahan berlaku segera (maks ~30 detik) untuk user ini.') +
        ` (${selectedPerson.value.name})`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    await loadUserRoles(selectedPerson.value.persnum);
  } catch (e: any) {
    toast.add({
      title: t('rbac_fail') || 'Gagal',
      description: e?.message || (t('rbac_role_remove_fail') || 'Gagal hapus role'),
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

onMounted(() => {
  fetchRoles();
  fetchList();
});
</script>