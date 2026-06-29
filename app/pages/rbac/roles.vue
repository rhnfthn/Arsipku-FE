<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <PageHeader title="Role & Permission" :items="items" />
    </div>

    <div
      class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800"
    >
      <table class="min-w-full border-collapse text-sm">
        <thead class="bg-primary-400 dark:bg-primary-700 text-white text-left">
          <tr>
            <th class="px-7 py-3 border-primary-600 font-semibold">Role</th>
            <th class="px-4 py-3 border-primary-600 font-semibold">Deskripsi</th>
            <th class="px-4 py-3 border-primary-600 font-semibold text-center">Jumlah Permission</th>
            <th class="px-4 py-3 border-primary-600 font-semibold text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="px-4 py-10 text-center text-gray-400">Memuat data...</td>
          </tr>
          <tr v-else-if="roles.length === 0">
            <td colspan="4" class="px-4 py-10 text-center text-sm text-gray-400">
              Belum ada role. Jalankan seeder RBAC di backend.
            </td>
          </tr>
          <tr
            v-else
            v-for="role in roles"
            :key="role.id"
            class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
          >
            <td class="px-7 py-3">
              <span class="inline-flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
                <UIcon :name="roleIcon(role.name)" class="w-4 h-4" :class="roleColor(role.name)" />
                {{ role.name }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ role.description || '-' }}</td>
            <td class="px-4 py-3 text-center">
              <span class="px-2.5 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                {{ role.permissionCount ?? role.permissions?.length ?? 0 }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <div class="flex justify-center gap-2">
                <button
                  @click="openEdit(role)"
                  class="p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors group"
                  title="Edit Permission"
                >
                  <UIcon name="i-lucide-pencil" class="w-4 h-4 text-yellow-500 group-hover:text-yellow-600" />
                </button>
                <button
                  v-if="!['SUPERADMIN', 'ADMIN', 'USER'].includes(role.name)"
                  @click="confirmDelete(role)"
                  class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                  title="Hapus Role"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4 text-red-600 group-hover:text-red-700" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL: Edit Permission Matrix -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div class="fixed inset-0 bg-black/50" @click="showEditModal = false"></div>
        <div class="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[900px] max-w-[90vw] max-h-[90vh] flex flex-col">
          <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Permission — {{ editingRole?.name }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Centang permission yang dimiliki role ini. Perubahan akan menggantikan seluruh assignment.
              </p>
            </div>
            <button @click="showEditModal = false" class="text-gray-500 hover:text-gray-800 dark:hover:text-white">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div v-for="resource in resources" :key="resource.id" class="mb-5">
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="i-lucide-box" class="w-4 h-4 text-primary" />
                <h4 class="text-sm font-bold text-gray-800 dark:text-white">{{ resource.name }}</h4>
                <span class="text-xs text-gray-400">{{ resource.description }}</span>
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

          <div class="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
            <button
              @click="showEditModal = false"
              :disabled="saving"
              class="px-5 py-2 text-sm border border-primary-500 hover:bg-primary-100 text-primary rounded-md disabled:opacity-50"
            >
              Batal
            </button>
            <button
              @click="savePermissions"
              :disabled="saving"
              class="px-5 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md disabled:opacity-70"
            >
              {{ saving ? 'Menyimpan...' : 'Simpan Permission' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useRbac, type RbacRole } from '~/composables/useRbac';
import { useToast } from '#imports';

definePageMeta({ middleware: ['auth', 'rbac-admin'] });

const { t } = useI18n();
const toast = useToast();
const {
  roles,
  resources,
  loading,
  fetchRoles,
  fetchResources,
  assignPermissions,
  deleteRole,
} = useRbac();

const items = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/' },
  { label: 'Manajemen RBAC', to: '/rbac' },
  { label: 'Role & Permission', to: '/rbac/roles' },
]);

const showEditModal = ref(false);
const editingRole = ref<RbacRole | null>(null);
const selectedPermIds = ref<string[]>([]);
const saving = ref(false);

const roleIcon = (name: string) =>
  name === 'SUPERADMIN' ? 'i-lucide-shield-check' : name === 'ADMIN' ? 'i-lucide-shield' : 'i-lucide-user';
const roleColor = (name: string) =>
  name === 'SUPERADMIN'
    ? 'text-purple-600'
    : name === 'ADMIN'
      ? 'text-blue-600'
      : 'text-gray-500';

const openEdit = async (role: RbacRole) => {
  editingRole.value = role;
  selectedPermIds.value = (role.permissions ?? []).map((p) => p.id);
  showEditModal.value = true;
};

const togglePerm = (id: string) => {
  const idx = selectedPermIds.value.indexOf(id);
  if (idx >= 0) selectedPermIds.value.splice(idx, 1);
  else selectedPermIds.value.push(id);
};

const savePermissions = async () => {
  if (!editingRole.value) return;
  saving.value = true;
  try {
    await assignPermissions(editingRole.value.id, selectedPermIds.value);
    toast.add({ title: 'Sukses', description: 'Permission role diperbarui', color: 'success', icon: 'i-lucide-check-circle' });
    showEditModal.value = false;
    await fetchRoles();
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal menyimpan permission', color: 'error', icon: 'i-lucide-x-circle' });
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (role: RbacRole) => {
  if (!confirm(`Hapus role "${role.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  try {
    await deleteRole(role.id);
    toast.add({ title: 'Sukses', description: 'Role dihapus', color: 'success', icon: 'i-lucide-check-circle' });
    await fetchRoles();
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal menghapus role', color: 'error', icon: 'i-lucide-x-circle' });
  }
};

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchResources()]);
});
</script>