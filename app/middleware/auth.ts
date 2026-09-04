export default defineNuxtRouteMiddleware(async (to) => {
  const tokenCookie = useCookie<string | null>('token', { sameSite: 'lax', path: '/' });
  const roleCookie = useCookie<string | null>('auth_role', { sameSite: 'lax', path: '/' });

  const token = process.client
    ? localStorage.getItem('token') || tokenCookie.value
    : tokenCookie.value;
  const path = to.path;

  const superadminOnlyPrefixes = ['/rbac', '/konfigurasi-sistem', '/admin/audit'];

  const isPathMatchPrefix = (prefixes: string[]) =>
    prefixes.some((prefix) => path === prefix || path.startsWith(prefix + '/'));

  const isSuperadminOnlyPath = isPathMatchPrefix(superadminOnlyPrefixes);

  // Redirect as early as possible using cached role to avoid unauthorized page flashes.
  if (isSuperadminOnlyPath && roleCookie.value && roleCookie.value !== 'superadmin') {
    throw createError({ statusCode: 403, statusMessage: 'Akses Ditolak', fatal: true });
  }

  if (process.server && isSuperadminOnlyPath && roleCookie.value !== 'superadmin') {
    throw createError({ statusCode: 403, statusMessage: 'Akses Ditolak', fatal: true });
  }

  if (!token) {
    if (process.server) return navigateTo('/');

    const { getSSORedirectUrl } = useAuth();
    const ssoUrl = await getSSORedirectUrl();

    if (ssoUrl) {
      return navigateTo(ssoUrl, { external: true });
    }

    return navigateTo('/', { replace: true });
  }

  if (process.client && tokenCookie.value !== token) {
    tokenCookie.value = token;
  }

  const { user, getProfile } = useAuth();
  if (!user.value) {
    try {
      await getProfile();
    } catch {
      // Jika getProfile gagal (token expired, network error, dll),
      // redirect ke login di client-side.
      if (process.server) return navigateTo('/');
      return navigateTo('/', { replace: true });
    }
  }

  const role = user.value?.role ?? roleCookie.value ?? null;

  if (process.client && user.value?.role && roleCookie.value !== user.value.role) {
    roleCookie.value = user.value.role;
  }

  if (role === 'superadmin') return;

  if (role === 'admin') {
    // Admin TIDAK boleh akses /master/*, /rbac, /konfigurasi-sistem
    if (isSuperadminOnlyPath || path === '/master' || path.startsWith('/master/')) {
      return navigateTo('/beranda', { replace: true });
    }
    return;
  }

  const userAllowedPrefixes = [
    '/beranda',
    '/korespondensi',
    '/penandatangan',
    '/penyingkat-tautan',
    '/template',
    '/titelatur',
    '/usulan-penomoran',
    '/profil',
    '/notifikasi',
    '/search',
    '/label',
    '/berkas',
    '/lampiran',
    '/switch',
    '/faq/menu',
    '/faq/manajemen',
    '/pedoman/menu',
    '/pedoman/manajemen',
    '/persetujuan-penomoran',
    '/digsig',
    '/layanan-email',
    '/naskah-lainnya',
    '/naskah-dinas/verifikator',
    '/kelola/pemeliharaan/pemberkasan',
    '/kelola/pemeliharaan/persetujuan-pemberkasan',
    '/kelola/penggunaan',
    '/kelola/penggunaan/usulan-akses-berkas',
    '/shared',
    '/riwayat-aktivitas',
    '/usulan-pindah',
    '/maintenance/transfer-inactive-file',
    '/maintenance/approval-transfer-inactive-file',
    '/maintenance/verify-physical-inactive-file',
    '/maintenance/final-approval-transfer-inactive-file',
    '/maintenance/transfer-active-to-inactive-file',
    '/maintenance/transfer-active-to-inactive',
    '/maintenance/approval-transfer-active-to-inactive-file',
    '/maintenance/approval-transfer-active-to-inactive',
    '/maintenance/verify-physical-active-to-inactive',
    '/maintenance/final-approval-transfer-active-to-inactive',
    '/maintenance/verifikasi-usulan',
    '/maintenance/verifikasi-persetujuan-tu',
    '/maintenance/penerimaan-usulan',
    '/maintenance/penataan-arsip-inaktif',
    '/maintenance/penyusutan',
    '/maintenance/preview-berkas',
  ];

  if (role === 'user') {
    const allowed = userAllowedPrefixes.some(
      (prefix) => path === prefix || path.startsWith(prefix + '/')
    );
    if (!allowed) {
      return navigateTo('/beranda', { replace: true });
    }
    return;
  }

  return navigateTo('/beranda', { replace: true });
});
