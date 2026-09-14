export default defineNuxtRouteMiddleware(async (to) => {
  // Skip public routes
  const publicRoutes = ['/login', '/auth/', '/autharsipku', '/access-denied', '/error', '/'];
  if (publicRoutes.some((r) => to.path.startsWith(r))) return;

  // Pastikan user.value sudah terisi sebelum cek permission
  const { user, getProfile } = useAuth();
  if (!user.value) {
    await getProfile().catch(() => {});
  }
  // Jika masih null (no token / error), skip — auth.ts akan handle
  if (!user.value) return;

  // Cek page permission — jika tidak ada akses, redirect ke /access-denied
  const { canAccessPage } = useFeatureAccess();
  if (!canAccessPage(to.path)) {
    return navigateTo(`/access-denied?from=${encodeURIComponent(to.fullPath)}`);
  }
});
