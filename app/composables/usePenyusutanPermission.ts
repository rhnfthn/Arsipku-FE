import { computed } from 'vue';

/** Permission flags untuk menu dan aksi Penyusutan pada RBAC Kelola. */
export const usePenyusutanPermission = () => {
  const { hasPermission } = useAuth();
  const pengajuan = 'pemeliharaan.penyusutan.pengajuan';
  const penataan = 'pemeliharaan.penyusutan.penataan-pemusnahan';
  const verifikasi = 'pemeliharaan.penyusutan.verifikasi';
  const has = (resource: string, action: string) => hasPermission(resource, action);

  const canRead = computed(
    () => has(pengajuan, 'read') || has(penataan, 'read') || has(verifikasi, 'read'),
  );
  const canCreate = computed(() => has(pengajuan, 'create'));
  const canUpdate = computed(() => has(pengajuan, 'update') || has(penataan, 'update'));
  const canApprove = computed(() => has(verifikasi, 'approve'));
  const canReject = computed(() => has(verifikasi, 'reject'));
  const canComplete = computed(() => has(penataan, 'complete'));

  return {
    canRead,
    canCreate,
    canUpdate,
    canApprove,
    canReject,
    canComplete,
    canReadPengajuan: computed(() => has(pengajuan, 'read')),
    canReadPenataan: computed(() => has(penataan, 'read')),
    canReadVerifikasi: computed(() => has(verifikasi, 'read')),
  };
};
