<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="mb-5">
      <PageHeader title="Assign Role ke User" :items="items" />
      <p class="text-sm text-gray-500 dark:text-gray-400 -mt-3">
        Cari user berdasarkan nama/persnum, lalu tetapkan role SUPERADMIN / ADMIN / USER.
      </p>
    </div>

    <!-- Search -->
    <div
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-4"
    >
      <div class="relative max-w-xl">
        <UIcon name="i-lucide-search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama / persnum..."
          class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          @input="onSearch"
        />
        <div
          v-if="suggestions.length > 0 && showSuggestions"
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
              :class="roleBadge(roleMap.get(Number(person.persnum)) || 'USER')"
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
            <option value="" disabled>Pilih Role</option>
            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <button
            @click="assignRole"
            :disabled="!selectedRoleId || assigning"
            class="px-4 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md disabled:opacity-50"
          >
            {{ assigning ? 'Menyimpan...' : 'Assign Role' }}
          </button>
        </div>
      </div>

      <!-- Current roles -->
      <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Role Saat Ini:</p>
        <div v-if="userRoles.length === 0" class="text-xs text-gray-400 italic">Belum punya role (default USER)</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="ur in userRoles"
            :key="ur.id"
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            :class="roleBadge(ur.roleName)"
          >
            <UIcon name="i-lucide-shield" class="w-3 h-3" />
            {{ ur.roleName }}
            <button
              v-if="canRemove(ur)"
              @click="removeRole(ur)"
              class="ml-1 text-red-500 hover:text-red-700"
              title="Hapus role"
            >
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
          </span>
        </div>
      </div>
    </div>

    <div v-else class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-10 text-center text-gray-400">
      Cari user untuk mulai assign role.
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRbac, type RbacRole, type RbacUserRoleRow } from '~/composables/useRbac';
import { usePerson, type PersonSuggestion } from '~/composables/usePerson';
import { useToast } from '#imports';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();
const toast = useToast();
const { roles, fetchRoles, fetchUserRoles, assignRoleToUser, removeRoleFromUser, getRolesBatch } = useRbac();
const { searchPersons } = usePerson();

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: 'Manajemen RBAC', to: '/rbac' },
  { label: 'Assign Role User', to: '/rbac/users' },
]);

const searchQuery = ref('');
const suggestions = ref<PersonSuggestion[]>([]);
const showSuggestions = ref(false);
const selectedPerson = ref<PersonSuggestion | null>(null);
const selectedRoleId = ref('');
const userRoles = ref<RbacUserRoleRow[]>([]);
const assigning = ref(false);
const roleMap = ref<Map<number, string>>(new Map());
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const { user: authUser } = useAuth();

const onSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  if (!searchQuery.value.trim()) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  searchTimer = setTimeout(async () => {
    try {
      const res: any = await searchPersons(searchQuery.value);
      suggestions.value = res?.data?.data ?? [];
      showSuggestions.value = suggestions.value.length > 0;
      // Fetch role batch untuk semua persnum di suggestions
      if (suggestions.value.length > 0) {
        try {
          const map = await getRolesBatch(suggestions.value.map((s) => s.persnum));
          roleMap.value = map;
        } catch {
          roleMap.value = new Map();
        }
      }
    } catch {
      suggestions.value = [];
      showSuggestions.value = false;
    }
  }, 300);
};

const selectPerson = async (person: PersonSuggestion) => {
  selectedPerson.value = person;
  showSuggestions.value = false;
  searchQuery.value = `${person.name} - ${person.persnum}`;
  await loadUserRoles(person.persnum);
};

const loadUserRoles = async (persnum: number) => {
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
    await assignRoleToUser(selectedPerson.value.persnum, selectedRoleId.value);
    toast.add({ title: 'Sukses', description: 'Role berhasil di-assign', color: 'success', icon: 'i-lucide-check-circle' });
    await loadUserRoles(selectedPerson.value.persnum);
    selectedRoleId.value = '';
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal assign role', color: 'error', icon: 'i-lucide-x-circle' });
  } finally {
    assigning.value = false;
  }
};

const canRemove = (ur: RbacUserRoleRow) => {
  // Jangan biarkan superadmin menghapus role diri sendiri
  if (ur.roleName === 'SUPERADMIN' && authUser.value?.persnum === selectedPerson.value?.persnum) {
    return false;
  }
  return true;
};

const removeRole = async (ur: RbacUserRoleRow) => {
  if (!selectedPerson.value) return;
  if (!confirm(`Hapus role "${ur.roleName}" dari user ini?`)) return;
  try {
    await removeRoleFromUser(selectedPerson.value.persnum, ur.roleId);
    toast.add({ title: 'Sukses', description: 'Role dihapus', color: 'success', icon: 'i-lucide-check-circle' });
    await loadUserRoles(selectedPerson.value.persnum);
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal hapus role', color: 'error', icon: 'i-lucide-x-circle' });
  }
};

const roleBadge = (name?: string) =>
  name === 'SUPERADMIN'
    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
    : name === 'ADMIN'
      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

const hideSuggestions = () => setTimeout(() => (showSuggestions.value = false), 150);

onMounted(() => {
  fetchRoles();
});
</script>