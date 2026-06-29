import { ref } from 'vue';
import { useApi } from './useApi';

export interface RbacRole {
  id: string;
  name: string;
  description?: string | null;
  permissionCount?: number;
  permissions?: { id: string; name?: string }[];
}

export interface RbacResource {
  id: string;
  name: string;
  description?: string | null;
  permissions: { id: string; name: string; action: string; description?: string | null }[];
}

export interface RbacPermission {
  id: string;
  name: string;
  action: string;
  description?: string | null;
  resource?: string;
  resourceId: string;
}

export interface RbacUserRoleRow {
  id: string;
  roleId: string;
  roleName?: string;
  unitKerja?: string | null;
  active: boolean;
  createdAt?: string;
}

export const useRbac = () => {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();

  const roles = ref<RbacRole[]>([]);
  const resources = ref<RbacResource[]>([]);
  const permissions = ref<RbacPermission[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchRoles = async () => {
    loading.value = true;
    try {
      const res: any = await apiGet('/rbac/roles', {}, { skipCache: true });
      roles.value = res?.data ?? [];
    } catch (e: any) {
      error.value = e.message || 'Gagal memuat role';
    } finally {
      loading.value = false;
    }
  };

  const fetchResources = async () => {
    try {
      const res: any = await apiGet('/rbac/resources', {}, { skipCache: true });
      resources.value = res?.data ?? [];
    } catch (e: any) {
      error.value = e.message || 'Gagal memuat resource';
    }
  };

  const fetchPermissions = async () => {
    try {
      const res: any = await apiGet('/rbac/permissions', {}, { skipCache: true });
      permissions.value = res?.data ?? [];
    } catch (e: any) {
      error.value = e.message || 'Gagal memuat permission';
    }
  };

  const createRole = async (name: string, description?: string) => {
    return apiPost('/rbac/roles', { name, description });
  };

  const updateRole = async (id: string, data: { name?: string; description?: string | null }) => {
    return apiPut(`/rbac/roles/${id}`, data).catch(() => apiPost(`/rbac/roles/${id}`, data));
  };

  // PATCH tidak ada helper; pakai apiPost workaround? Use axios directly via useApi patch
  const patchRole = async (id: string, data: { name?: string; description?: string | null }) => {
    const { apiPatch } = useApi();
    return apiPatch(`/rbac/roles/${id}`, data);
  };

  const deleteRole = async (id: string) => {
    return apiDelete(`/rbac/roles/${id}`);
  };

  const assignPermissions = async (roleId: string, permissionIds: string[]) => {
    return apiPut(`/rbac/roles/${roleId}/permissions`, { permissionIds });
  };

  // User-role
  const fetchUserRoles = async (persnum: number | string) => {
    const res: any = await apiGet(`/rbac/users/${persnum}/roles`, {}, { skipCache: true });
    return (res?.data ?? []) as RbacUserRoleRow[];
  };

  const assignRoleToUser = async (persnum: number | string, roleId: string, unitKerja?: string | null) => {
    return apiPost(`/rbac/users/${persnum}/roles`, { roleId, unitKerja: unitKerja ?? null });
  };

  const removeRoleFromUser = async (persnum: number | string, roleId: string) => {
    return apiDelete(`/rbac/users/${persnum}/roles/${roleId}`);
  };

  /**
   * Ambil role prioritas (default USER) untuk list persnum secara batch.
   * Return Map persnum -> roleName.
   */
  const getRolesBatch = async (persnums: (number | string)[]): Promise<Map<number, string>> => {
    if (persnums.length === 0) return new Map();
    const nums = persnums.map((p) => Number(p)).filter((n) => !isNaN(n));
    const res: any = await apiPost('/rbac/users/roles-batch', { persnums: nums });
    const list: { persnum: number; role: string }[] = res?.data ?? [];
    const map = new Map<number, string>();
    for (const item of list) map.set(Number(item.persnum), item.role);
    return map;
  };

  return {
    roles,
    resources,
    permissions,
    loading,
    error,
    fetchRoles,
    fetchResources,
    fetchPermissions,
    createRole,
    updateRole,
    patchRole,
    deleteRole,
    assignPermissions,
    fetchUserRoles,
    assignRoleToUser,
    removeRoleFromUser,
    getRolesBatch,
  };
};