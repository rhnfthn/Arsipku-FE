export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/autharsipku', '/auth/callback', '/access-denied', '/error', '/'];
  // Root `/` harus exact-match. Jika memakai startsWith('/') maka seluruh
  // halaman dianggap public dan permission route tidak pernah diperiksa.
  const isPublicRoute = publicRoutes.some((r) =>
    r === '/' ? to.path === '/' : to.path === r || to.path.startsWith(`${r}/`),
  );
  if (isPublicRoute) return;

  const { user, getProfile, refreshPermissions } = useAuth();
  if (!user.value) {
    await getProfile().catch(() => {});
  }
  if (!user.value) return;

  // Permission role dapat berubah saat sesi user masih aktif (misalnya
  // checkbox Read Penyusutan dicabut dari halaman RBAC). Jangan memakai
  // activePermissions lama dari JWT/state untuk route Penyusutan; ambil
  // permission terbaru sebelum memutuskan akses halaman.
  if (process.client && to.path.startsWith('/maintenance/penyusutan')) {
    await refreshPermissions();
  }

  const { canAccessPage } = useFeatureAccess();
  if (!canAccessPage(to.path, to.query)) {
    return navigateTo(`/access-denied?from=${encodeURIComponent(to.fullPath)}`);
  }
});
