export default defineNuxtRouteMiddleware((to) => {
  // Skip public routes
  const publicRoutes = ['/login', '/autharsipku', '/access-denied', '/error', '/'];
  if (publicRoutes.some((r) => to.path.startsWith(r))) return;

  // Tidak redirect — biarkan halaman sendiri yang tampilkan <AccessDenied>.
  // Setiap halaman sudah punya: <AccessDenied v-if="!canAccessPage()" />
  // Menu sidebar selalu tampil, yang berubah hanya konten halaman.
});
