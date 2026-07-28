import type { ComputedRef } from 'vue';

/**
 * Capability flags modul Arsip Dinamis — Pemberkasan & Persetujuan.
 *
 * Berbasis effective-role (usePemeliharaanAccess: position_status + bodTag),
 * BUKAN RBAC hasPermission, supaya gating tombol cocok dengan rule akses
 * pemeliharaan (terutama aktor delegated SE/PS/PT/PH dan admin bypass).
 * Nama & shape 7 flag dipertahankan agar pemanggil (halaman pemberkasan,
 * persetujuan, Kotak Masuk) tidak rusak.
 */
export const useArsipDinamisPermission = () => {
  const { hasRole } = useAuth();
  const { canPemberkasan, canPersetujuan } = usePemeliharaanAccess();

  const admin = computed(() => hasRole('SUPERADMIN') || hasRole('ADMIN'));
  const pem = ((): ComputedRef<boolean> => computed(() => admin.value || canPemberkasan.value));
  const per = ((): ComputedRef<boolean> => computed(() => admin.value || canPersetujuan.value));

  return {
    canCreatePemberkasan: pem(),
    canUpdateBerkas: pem(),
    canAddNaskah: pem(),
    canAjukanTutup: pem(),
    canApprove: per(),
    canReject: per(),
    canReadBerkasStatus: computed(() => admin.value || canPemberkasan.value || canPersetujuan.value),
  };
};
