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
          {{ t('rbac_back') || 'Kembali' }}
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
              {{ t('rbac_edit_permission_for') || 'Edit Permission —' }} {{ role.name }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('rbac_permission_matrix_desc') || 'Centang permission yang dimiliki role. Perubahan akan menggantikan seluruh assignment.' }}
            </p>
          </div>
        </div>

        <div class="p-6 max-h-[60vh] overflow-y-auto">
          <div v-if="resources.length === 0" class="text-center py-10 text-gray-400">
            {{ t('rbac_resources_empty') || 'Belum ada resource.' }}
          </div>

          <div v-for="resource in resources" :key="resource.id" class="mb-5">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-lucide-box" class="w-4 h-4 text-primary" />
              <h4 class="text-sm font-bold text-gray-800 dark:text-white">{{ resource.name }}</h4>
              <span class="text-xs text-gray-400">{{ resource.description }}</span>
              <button
                type="button"
                @click="toggleResourceAll(resource)"
                class="ml-auto text-xs text-primary hover:underline"
              >
                {{ isResourceAllChecked(resource) ? t('rbac_uncheck_all') || 'Hapus centang semua' : t('rbac_check_all') || 'Centang semua' }}
              </button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2 pl-6">
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
            {{ selectedPermIds.length }} {{ t('rbac_selected') || 'terpilih' }}
          </span>
          <div class="flex gap-3">
            <NuxtLink
              :to="`/rbac/roles/${route.params.id}`"
              class="px-5 py-2 text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white rounded-md transition-colors"
            >
              {{ t('rbac_cancel') || 'Batal' }}
            </NuxtLink>
            <button
              @click="savePermissions"
              :disabled="saving"
              class="px-5 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md disabled:opacity-70 transition-colors"
            >
              {{ saving ? t('rbac_saving') || 'Menyimpan...' : t('rbac_save_permission') || 'Simpan Permission' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      {{ t('rbac_roles_not_found') || 'Role tidak ditemukan.' }}
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

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: t('rbac_title') || 'Manajemen RBAC', to: '/rbac' },
  { label: t('rbac_roles') || 'Role', to: '/rbac/roles' },
  { label: role.value?.name || 'Detail', to: `/rbac/roles/${route.params.id}` },
  { label: t('rbac_edit_permission') || 'Edit Permission' },
]);

const editTitle = computed(() => `${t('rbac_edit_permission') || 'Edit Permission'}: ${role.value?.name ?? ''}`);

const togglePerm = (id: string) => {
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
      title: t('rbac_success') || 'Sukses',
      description:
        t('rbac_permission_saved_notice') ||
        'Permission role diperbarui. Perubahan berlaku segera untuk semua user dengan role ini.',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    await fetchRoles();
    await refreshPermissions();
    await getProfile().catch(() => {});
    navigateTo(`/rbac/roles/${route.params.id}`);
  } catch (e: any) {
    toast.add({
      title: t('rbac_fail') || 'Gagal',
      description: e?.message || (t('rbac_permission_save_fail') || 'Gagal menyimpan permission'),
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