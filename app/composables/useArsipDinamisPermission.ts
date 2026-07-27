import type { ComputedRef } from 'vue';

/**
 * Permission composable untuk modul Arsip Dinamis — Pemberkasan.
 *
 * Mengekspos 7 flag `ComputedRef<boolean>` yang dibaca oleh Task 14
 * (Kotak Masuk/Terkirim — kolom Status Berkas dinamis) dan halaman
 * Pemberkasan lainnya.
 *
 * FE permission API yang sebenarnya (Sidebar.vue & useAuth.ts):
 * - composable: `useAuth()`
 * - user: `useState<UserProfile | null>('user')`
 * - permissions: `user.value.activePermissions` berbentuk
 *   `{ resource: string, actions: string[] }[]`
 * - helper bawaan: `hasPermission(resource, action)`
 *
 * Kode ini menggunakan `useAuth().hasPermission(resource, action)` sehingga
 * otomatis reaktif terhadap perubahan `activeRole` / refresh permissions.
 */
export const useArsipDinamisPermission = () => {
  const { hasPermission } = useAuth();

  const can = (resource: string, action: string): ComputedRef<boolean> =>
    computed(() => hasPermission(resource, action));

  return {
    canCreatePemberkasan: can('pemeliharaan.pemberkasan', 'create'),
    canUpdateBerkas: can('pemeliharaan.pemberkasan', 'update'),
    canAddNaskah: can('pemeliharaan.pemberkasan', 'add-naskah'),
    canAjukanTutup: can('pemeliharaan.pemberkasan', 'ajukan-tutup'),
    canApprove: can('pemeliharaan.verifikasi', 'approve'),
    canReject: can('pemeliharaan.verifikasi', 'reject'),
    canReadBerkasStatus: can('pemeliharaan.pemberkasan', 'read'),
  };
};
