export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const token = localStorage.getItem("token")

  if (!token) {
    const { getSSORedirectUrl } = useAuth()
    const ssoUrl = await getSSORedirectUrl()

    if (ssoUrl) {
      return navigateTo(ssoUrl, { external: true })
    }

    return navigateTo("/")
  }

  const { user, getProfile } = useAuth()
  if (!user.value) {
    await getProfile()
  }

  const role = user.value?.role ?? null
  const path = to.path

  if (role === "superadmin") return

  const adminForbiddenPrefixes = [
    "/master",
    "/master-data",
    "/konfigurasi-sistem",
  ]

  if (role === "admin") {
    const forbidden = adminForbiddenPrefixes.some(
      (prefix) => path === prefix || path.startsWith(prefix + "/")
    )
    if (forbidden) {
      return navigateTo("/beranda")
    }
    return
  }


  const userAllowedPrefixes = [
    "/beranda",
    "/korespondensi",
    "/penandatangan",
    "/penyingkat-tautan",
    "/template",
    "/titelatur",
    "/usulan-penomoran",
    "/profil",
    "/search",
    "/label",
    "/berkas",
    "/lampiran",
    "/switch",
    "/faq/menu",
  ]

  if (role === "user") {
    const allowed = userAllowedPrefixes.some(
      (prefix) => path === prefix || path.startsWith(prefix + "/")
    )
    if (!allowed) {
      return navigateTo("/beranda")
    }
    return
  }

  return navigateTo("/beranda")
})
