/**
 * Capability flags modul Arsip Dinamis — Pemberkasan & Persetujuan.
 *
 * Effective-role menentukan siapa yang boleh masuk ke modul, sedangkan
 * permission RBAC menentukan aksi yang boleh dilakukan di dalam modul.
 * Nama & shape flag dipertahankan agar pemanggil (halaman pemberkasan,
 * persetujuan, Kotak Masuk) tidak rusak.
 */
export const useArsipDinamisPermission = () => {
  const { hasPermission, hasRole } = useAuth();
  const { canPemberkasan, canPersetujuan } = usePemeliharaanAccess();

  const admin = computed(() => hasRole('SUPERADMIN') || hasRole('ADMIN'));
  const canPemberkasanAction = (action: string) =>
    computed(
      () =>
        (admin.value || canPemberkasan.value) &&
        hasPermission('pemeliharaan.pemberkasan', action),
    );
  const canPersetujuanAction = (action: string) =>
    computed(
      () =>
        (admin.value || canPersetujuan.value) &&
        hasPermission('pemeliharaan.verifikasi', action),
    );

  return {
    canCreatePemberkasan: canPemberkasanAction('create'),
    canUpdateBerkas: canPemberkasanAction('update'),
    canDeleteBerkas: canPemberkasanAction('delete'),
    canAddNaskah: canPemberkasanAction('add-naskah'),
    canAjukanTutup: canPemberkasanAction('ajukan-tutup'),
    canApprove: canPersetujuanAction('approve'),
    canReject: canPersetujuanAction('reject'),
    canReadBerkasStatus: computed(
      () =>
        (admin.value || canPemberkasan.value || canPersetujuan.value) &&
        (hasPermission('pemeliharaan.pemberkasan', 'read') ||
          hasPermission('pemeliharaan.verifikasi', 'read')),
    ),
  };
};
