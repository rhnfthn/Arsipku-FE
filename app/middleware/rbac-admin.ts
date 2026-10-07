/**
 * Middleware: halaman /rbac/* membutuhkan permission `role.read`.
 * Halaman edit permission juga dilindungi lagi oleh backend dengan
 * `role.assign-permission` saat menyimpan.
 */
export default defineNuxtRouteMiddleware(() => {
  const { hasRole, hasPermission } = useAuth();
  const ok =
    hasRole('SUPERADMIN') ||
    hasPermission('role', 'read') ||
    hasPermission('role', 'assign-permission');
  if (!ok) {
    throw createError({ statusCode: 403, statusMessage: 'Akses Ditolak', fatal: true });
  }
});
