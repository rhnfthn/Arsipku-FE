/**
 * Middleware: halaman /rbac/* HANYA untuk SUPERADMIN.
 */
export default defineNuxtRouteMiddleware(() => {
  const { hasRole, user } = useAuth();
  // Cek cepat via user state; jika belum loaded, getProfile sudah jalan di middleware auth
  const role = user.value?.activeRole?.name || user.value?.role;
  const ok = hasRole('SUPERADMIN') || role === 'superadmin' || role === 'SUPERADMIN';
  if (!ok) {
    return navigateTo('/beranda', { replace: true });
  }
});