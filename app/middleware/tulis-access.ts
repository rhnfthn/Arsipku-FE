export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const { user, getProfile } = useAuth()
  if (!user.value) await getProfile()

  const bodTag = user.value?.bodTag ?? ''
  const path = to.path

  if (bodTag === 'BOD' || bodTag === 'BOD-1') return

  if (bodTag === 'BOD-2' || bodTag === 'BOD-3') {
    const allowed = [
      '/korespondensi/tulis/nota-dinas',
      '/korespondensi/tulis/disposisi',
    ]
    if (!allowed.some((p) => path === p || path.startsWith(p + '/'))) {
      return navigateTo('/beranda')
    }
    return
  }

  if (bodTag === '') {
    const allowed = ['/korespondensi/tulis/kajian']
    if (!allowed.some((p) => path === p || path.startsWith(p + '/'))) {
      return navigateTo('/beranda')
    }
    return
  }

  // bodTag tidak dikenal → redirect
  return navigateTo('/beranda')
})
