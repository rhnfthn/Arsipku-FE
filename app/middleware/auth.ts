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
})
