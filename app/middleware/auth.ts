export default defineNuxtRouteMiddleware(async (to) => {
  const tokenCookie = useCookie<string | null>('token', { sameSite: 'lax', path: '/' })
  const roleCookie = useCookie<string | null>('auth_role', { sameSite: 'lax', path: '/' })

  const token = process.client ? localStorage.getItem('token') || tokenCookie.value : tokenCookie.value
  const path = to.path

  const superadminOnlyPrefixes = ['/rbac', '/konfigurasi-sistem']

  const isPathMatchPrefix = (prefixes: string[]) =>
    prefixes.some((prefix) => path === prefix || path.startsWith(prefix + '/'))

  const isSuperadminOnlyPath = isPathMatchPrefix(superadminOnlyPrefixes)

  // Redirect as early as possible using cached role to avoid unauthorized page flashes.
  if (isSuperadminOnlyPath && roleCookie.value && roleCookie.value !== 'superadmin') {
    throw createError({ statusCode: 403, statusMessage: 'Akses Ditolak', fatal: true })
  }

  if (process.server && isSuperadminOnlyPath && roleCookie.value !== 'superadmin') {
    throw createError({ statusCode: 403, statusMessage: 'Akses Ditolak', fatal: true })
  }

  if (!token) {
    if (process.server) return navigateTo('/')

    const { getSSORedirectUrl } = useAuth()
    const ssoUrl = await getSSORedirectUrl()

    if (ssoUrl) {
      return navigateTo(ssoUrl, { external: true })
    }

    return navigateTo('/', { replace: true })
  }

  if (process.client && tokenCookie.value !== token) {
    tokenCookie.value = token
  }

  const { user, getProfile } = useAuth()
  if (!user.value) {
    await getProfile()
  }

  const role = user.value?.role ?? roleCookie.value ?? null

  if (process.client && user.value?.role && roleCookie.value !== user.value.role) {
    roleCookie.value = user.value.role
  }

  if (role === 'superadmin') return

  if (role === 'admin') {
    // Admin boleh akses /master/* (read-only), tapi tidak /rbac dan /konfigurasi-sistem
    if (isSuperadminOnlyPath) {
      return navigateTo('/beranda', { replace: true })
    }
    return
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
    '/search',
    '/label',
    '/berkas',
    '/lampiran',
    '/switch',
    '/faq/menu',
    '/pedoman/menu',
    '/persetujuan-penomoran'
  ]

  if (role === 'user') {
    const allowed = userAllowedPrefixes.some(
      (prefix) => path === prefix || path.startsWith(prefix + '/')
    )
    if (!allowed) {
      return navigateTo('/beranda', { replace: true })
    }
    return
  }

  return navigateTo('/beranda', { replace: true })
})
