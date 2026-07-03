/**
 * Middleware: halaman /rbac/* HANYA untuk SUPERADMIN.
 * Non-superadmin yang akses paksa → redirect ke halaman 403 (Forbidden).
 */
export default defineNuxtRouteMiddleware(() => {
  const { hasRole, user } = useAuth();
  const role = user.value?.activeRole?.name || user.value?.role;
  const ok = hasRole('SUPERADMIN') || role === 'superadmin' || role === 'SUPERADMIN';
  if (!ok) {
    throw createError({ statusCode: 403, statusMessage: 'Akses Ditolak', fatal: true });
  }
});