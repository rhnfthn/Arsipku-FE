export default defineNuxtRouteMiddleware(async (to) => {
  const { user, getProfile, refreshPermissions } = useAuth();
  if (!user.value) await getProfile().catch(() => null);
  if (!user.value) return;

  // Permission dapat dicabut ketika sesi user masih aktif. Selalu ambil
  // permission terbaru sebelum membuka workspace Penyusutan.
  if (process.client) await refreshPermissions();

  const { canAccessPage } = useFeatureAccess();
  if (!canAccessPage(to.path, to.query)) {
    return navigateTo(`/access-denied?from=${encodeURIComponent(to.fullPath)}`);
  }

  // Verifikasi bukan hak semua user yang memiliki permission RBAC. User juga
  // harus terdaftar sebagai atasan Unit Dokumen/Sekretaris TU pada pengajuan.
  if (
    process.client &&
    to.path.startsWith('/maintenance/penyusutan/verifikasi-penyusutan')
  ) {
    try {
      const { apiGet } = useApi();
      const response: any = await apiGet('/penyusutan/is-atasan', {}, { skipCache: true });
      const isAtasan = response?.data?.isAtasan ?? response?.isAtasan ?? false;
      if (!isAtasan) {
        return navigateTo(`/access-denied?from=${encodeURIComponent(to.fullPath)}`);
      }
    } catch {
      return navigateTo(`/access-denied?from=${encodeURIComponent(to.fullPath)}`);
    }
  }
});
