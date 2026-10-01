export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const { user, getProfile } = useAuth()
  const { canCreateSdi, fetchCapabilities } = useCorrespondenceRoutingAccess()
  if (!user.value) await getProfile()

  const bodTag = user.value?.bodTag ?? ''
  const path = to.path

  // Kajian hanya untuk fungsional/staf (chief=0). Pada snapshot org-data,
  // posisi managerial ditandai dengan bodTag (BOD/BOD-1/BOD-2/BOD-3).
  if (path === '/korespondensi/tulis/kajian' && bodTag !== '') {
    return navigateTo('/beranda')
  }

  if (bodTag === 'BOD' || bodTag === 'BOD-1') return

  if (bodTag === 'BOD-2' || bodTag === 'BOD-3') {
    await fetchCapabilities()
    const allowed = [
      '/korespondensi/tulis/nota-dinas',
      '/korespondensi/tulis/disposisi',
      ...(canCreateSdi.value
        ? [
            '/korespondensi/tulis/surat-dinas-internal',
            '/korespondensi/tulis/lanjut/surat-dinas-internal',
          ]
        : []),
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
