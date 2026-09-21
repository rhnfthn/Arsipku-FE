export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/autharsipku', '/auth/callback', '/access-denied', '/error', '/'];
  if (publicRoutes.some((r) => to.path.startsWith(r))) return;

  const { user, getProfile } = useAuth();
  if (!user.value) {
    await getProfile().catch(() => {});
  }
  if (!user.value) return;

  const { canAccessPage } = useFeatureAccess();
  if (!canAccessPage(to.path, to.query)) {
    return navigateTo(`/access-denied?from=${encodeURIComponent(to.fullPath)}`);
  }
});
