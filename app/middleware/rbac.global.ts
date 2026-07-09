export default defineNuxtRouteMiddleware((to) => {
  // Skip public routes
  const publicRoutes = ['/login', '/autharsipku', '/access-denied', '/error', '/'];
  if (publicRoutes.some((r) => to.path.startsWith(r))) return;

  // Cek page permission — jika tidak ada akses, redirect ke /access-denied
  const { canAccessPage } = useFeatureAccess();
  if (!canAccessPage(to.path)) {
    return navigateTo(`/access-denied?from=${encodeURIComponent(to.fullPath)}`);
  }
});
