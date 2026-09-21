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
          <div class="flex items-center gap-3">
            <div class="relative">
              <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('rbac_search_placeholder')"
                class="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary w-48"
              />
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ filteredUserRoles.length }} {{ t('rbac_role_count_suffix') }}
            </span>
            <button
              @click="openExportModal"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary-800 text-white transition-colors"
            >
              <UIcon name="i-lucide-download" class="w-3.5 h-3.5" /> Export
            </button>
          </div>
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
              v-for="ur in filteredUserRoles"
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

    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="filteredUserRoles.length"
      title="Pilih Kolom Export Role User"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRbac, type RbacUserRoleRow } from '~/composables/useRbac';
import { useToast } from '#imports';
import { Alert, useAlertState } from '~/composables/useAlert';
import ExportColumnModal from '~/components/ExportColumnModal.vue';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
const searchQuery = ref('');

const filteredUserRoles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return userRoles.value;
  return userRoles.value.filter(
    (ur) =>
      (ur.roleName || '').toLowerCase().includes(q) ||
      (ur.unitKerja || '').toLowerCase().includes(q)
  );
});

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title'), to: '/rbac/roles' },
  { label: t('rbac_users'), to: '/rbac/users' },
  { label: person.value?.name || t('rbac_detail_label'), to: `/rbac/users/${route.params.persnum}/roles` },
]);

const detailTitle = computed(() =>
  `${t('rbac_role_detail')}: ${person.value?.name ?? ''} (${person.value?.persnum ?? ''})`
);

const availableRoles = computed(() => {
  const existingRoleNames = new Set(
    (userRoles.value ?? []).map((ur) => (ur.roleName || '').toUpperCase()),
  );
  return roles.value.filter((r) => {
    // Jika user sudah punya role ini → tidak perlu ditampilkan (sudah ada)
    if (existingRoleNames.has(r.name.toUpperCase())) return false;
    // Jika user sudah punya ADMIN → SUPERADMIN tidak bisa ditambah
    if (r.name === 'SUPERADMIN' && existingRoleNames.has('ADMIN')) return false;
    // Jika user sudah punya SUPERADMIN → ADMIN tidak bisa ditambah
    if (r.name === 'ADMIN' && existingRoleNames.has('SUPERADMIN')) return false;
    return true;
  });
});

const canRemove = (ur: RbacUserRoleRow) => {
  const name = (ur.roleName || '').toUpperCase();
  if (name === 'USER') return false;
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

  // Validasi: user tidak boleh punya SUPERADMIN + ADMIN sekaligus
  const selectedRoleName = (roles.value.find((r) => r.id === selectedRoleId.value)?.name || '').toUpperCase();
  const existingRoleNames = new Set(
    (userRoles.value ?? []).map((ur) => (ur.roleName || '').toUpperCase()),
  );
  if (selectedRoleName === 'SUPERADMIN' && existingRoleNames.has('ADMIN')) {
    toast.add({
      title: t('rbac_fail'),
      description: 'User sudah memiliki role ADMIN. Tidak bisa menambahkan SUPERADMIN.',
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
    return;
  }
  if (selectedRoleName === 'ADMIN' && existingRoleNames.has('SUPERADMIN')) {
    toast.add({
      title: t('rbac_fail'),
      description: 'User sudah memiliki role SUPERADMIN. Tidak bisa menambahkan ADMIN.',
      color: 'error',
      icon: 'i-lucide-x-circle',
    });
    return;
  }

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
    person.value = await fetchUserProfile(persnum);
    if (person.value) {
      await loadUserRoles(persnum);
    }
  } finally {
    loading.value = false;
  }
});

// ─── Export Excel ──────────────────────────────
const showExportModal = ref(false);
const isExporting = ref(false);

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'role', label: t('rbac_roles'), desc: 'Nama role' },
  { key: 'unitKerja', label: t('rbac_unit_kerja'), desc: 'Unit kerja' },
  { key: 'status', label: t('rbac_status'), desc: 'Status aktif' }
]);

const openExportModal = () => {
  showExportModal.value = true;
};

const handleExportConfirm = (selectedKeys: string[]) => {
  if (filteredUserRoles.value.length === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const excelData = filteredUserRoles.value.map((ur: RbacUserRoleRow, idx: number) => {
      const r: Record<string, any> = {};
      if (selectedKeys.includes('No')) r['No'] = idx + 1;
      if (selectedKeys.includes('role')) r[t('rbac_roles')] = ur.roleName || '-';
      if (selectedKeys.includes('unitKerja')) r[t('rbac_unit_kerja')] = ur.unitKerja || '-';
      if (selectedKeys.includes('status')) r[t('rbac_status')] = ur.active ? 'Aktif' : 'Nonaktif';
      return r;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('rbac_current_roles'));
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `role-user-${new Date().toISOString().slice(0, 10)}.xlsx`);
    showExportModal.value = false;
  } catch (error) {
    console.error('Gagal export role user:', error);
  } finally {
    isExporting.value = false;
  }
};
</script>
