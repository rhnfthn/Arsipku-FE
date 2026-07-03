<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <PageHeader :title="detailTitle" :items="items" />
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/rbac/users"
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
        <div class="h-4 w-72 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <template v-else-if="person">
      <!-- User info card -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-5 mb-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold uppercase">
            {{ (person.name || '?').charAt(0) }}
          </div>
          <div>
            <p class="font-semibold text-gray-800 dark:text-white">{{ person.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Persnum: {{ person.persnum }}</p>
            <p v-if="person.positionText" class="text-xs text-gray-400">{{ person.positionText }}</p>
          </div>
        </div>
      </div>

      <!-- Add role form -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-5 mb-6">
        <h3 class="text-sm font-bold text-gray-800 dark:text-white mb-4">
          {{ t('rbac_add_role_to_user') }}
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <select
            v-model="selectedRoleId"
            class="border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600"
          >
            <option value="" disabled>{{ t('rbac_roles_name_placeholder') }}</option>
            <option v-for="r in availableRoles" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <input
            v-model="unitKerja"
            type="text"
            :placeholder="t('rbac_unit_kerja_placeholder')"
            class="border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 w-48"
          />
          <button
            @click="assignRole"
            :disabled="!selectedRoleId || assigning"
            class="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md disabled:opacity-50 transition-colors"
          >
            {{ assigning ? t('rbac_saving') : t('rbac_add') }}
          </button>
        </div>
      </div>

      <!-- Current roles table -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-bold text-gray-800 dark:text-white">
            {{ t('rbac_current_roles') }}
          </h3>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ userRoles.length }} {{ t('rbac_role_count_suffix') }}
          </span>
        </div>

        <div v-if="userRoles.length === 0" class="p-10 text-center text-sm text-gray-400">
          {{ t('rbac_no_role') }}
        </div>

        <table v-else class="min-w-full border-collapse text-sm">
          <thead class="bg-primary-400 dark:bg-primary-700 text-white text-left">
            <tr>
              <th class="px-7 py-3 font-semibold">{{ t('rbac_roles') }}</th>
              <th class="px-4 py-3 font-semibold">{{ t('rbac_unit_kerja') }}</th>
              <th class="px-4 py-3 font-semibold text-center">{{ t('rbac_status') }}</th>
              <th class="px-4 py-3 font-semibold text-center">{{ t('rbac_col_aksi') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ur in userRoles"
              :key="ur.id"
              class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td class="px-7 py-3">
                <RoleBadge :role="ur.roleName || ''" />
              </td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                {{ ur.unitKerja || '-' }}
              </td>
              <td class="px-4 py-3 text-center">
                <StatusBadge :active="ur.active" />
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  v-if="canRemove(ur)"
                  @click="removeRole(ur)"
                  class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                  :title="t('rbac_delete')"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4 text-red-600 group-hover:text-red-700" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      {{ t('rbac_user_not_found') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRbac, type RbacUserRoleRow } from '~/composables/useRbac';
import { useToast } from '#imports';
import { Alert, useAlertState } from '~/composables/useAlert';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const { roles, fetchRoles, fetchUserRoles, fetchUserProfile, assignRoleToUser, removeRoleFromUser } = useRbac();
const { user: authUser } = useAuth();

const loading = ref(true);
const person = ref<{ persnum: number; name: string; positionText: string | null } | null>(null);
const userRoles = ref<RbacUserRoleRow[]>([]);
const selectedRoleId = ref('');
const unitKerja = ref('');
const assigning = ref(false);

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title'), to: '/rbac/roles' },
  { label: t('rbac_users'), to: '/rbac/users' },
  { label: person.value?.name || t('rbac_detail_label'), to: `/rbac/users/${route.params.persnum}/roles` },
]);

const detailTitle = computed(() =>
  `${t('rbac_role_detail')}: ${person.value?.name ?? ''} (${person.value?.persnum ?? ''})`
);

const availableRoles = computed(() => roles.value);

const canRemove = (ur: RbacUserRoleRow) => {
  // Badge USER adalah role default — tidak bisa dihapus, hanya SUPERADMIN & ADMIN yang bisa dihapus.
  const name = (ur.roleName || '').toUpperCase();
  if (name === 'USER') return false;
  // Superadmin tidak boleh menghapus role SUPERADMIN milik dirinya sendiri.
  if (name === 'SUPERADMIN' && authUser.value?.persnum === person.value?.persnum) {
    return false;
  }
  return true;
};

const loadUserRoles = async (persnum: number | string) => {
  try {
    userRoles.value = await fetchUserRoles(persnum);
  } catch {
    userRoles.value = [];
  }
};

const assignRole = async () => {
  if (!person.value || !selectedRoleId.value) return;
  assigning.value = true;
  try {
    await assignRoleToUser(person.value.persnum, selectedRoleId.value, unitKerja.value || null);
    toast.add({
      title: t('rbac_success'),
      description: `${t('rbac_role_assigned_notice')} (${person.value.name})`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    await loadUserRoles(person.value.persnum);
    selectedRoleId.value = '';
    unitKerja.value = '';
  } catch (e: any) {
    toast.add({
      title: t('rbac_fail'),
      description: e?.message || t('rbac_role_assign_fail'),
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
  } finally {
    assigning.value = false;
  }
};

const removeRole = async (ur: RbacUserRoleRow) => {
  if (!person.value) return;
  // B9: confirm dialog khusus untuk SUPERADMIN
  const isSuperadmin = ur.roleName === 'SUPERADMIN';
  const title = isSuperadmin
    ? t('rbac_remove_superadmin_title')
    : t('rbac_remove_role_title');
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
  const alertState = useAlertState();
  alertState.isLoading = true;
  try {
    await removeRoleFromUser(person.value.persnum, ur.roleId);
    Alert.close();
    toast.add({
      title: t('rbac_success'),
      description: `${t('rbac_role_removed_notice')} (${person.value.name})`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    await loadUserRoles(person.value.persnum);
  } catch (e: any) {
    Alert.close();
    toast.add({
      title: t('rbac_fail'),
      description: e?.message || t('rbac_role_remove_fail'),
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
  }
};

onMounted(async () => {
  loading.value = true;
  const persnum = Number(route.params.persnum);
  try {
    await fetchRoles();
    // Bug B7 fix: pakai fetchUserProfile (exact match by persnum), bukan searchPersons (LIKE)
    person.value = await fetchUserProfile(persnum);
    if (person.value) {
      await loadUserRoles(persnum);
    }
  } finally {
    loading.value = false;
  }
});
</script>