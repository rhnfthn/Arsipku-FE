// composables/auth.ts
export const useAuth = () => {
  const { apiGet, apiPost } = useApi()

  const getSSORedirectUrl = async () => {
    try {
      const res = await apiGet('/auth/sso-redirect')
      return res?.data?.url || null
    } catch (error) {
      console.error('[AUTH] Error getSSORedirectUrl:', error)
      return null
    }
  }

  const verifyToken = async (token: string) => {
    try {
      const res = await apiPost('/auth/verify-token', { token })
      return res
    } catch (error) {
      console.error('[AUTH] Error verifyToken:', error)
      throw error
    }
  }

const logout = async () => {
  try {
    const sessionId = localStorage.getItem("sessionId")
    const token = localStorage.getItem("token")

    if (!sessionId || !token) {
      console.warn("[AUTH] sessionId atau token tidak ditemukan")
    }

    // Tetap panggil logout ke backend
    await apiGet(`/auth/logout?sessionId=${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
      // Izinkan status 302 sebagai success
      validateStatus: (status) => status < 400
    })

  } catch (error) {
    console.warn("[AUTH] Logout API mengembalikan redirect, tapi ini normal:", error)
  }

  // Hapus data di browser, tetap lakukan logout
  localStorage.removeItem("token")
  localStorage.removeItem("sessionId")

  return true
}

  return {
    getSSORedirectUrl,
    verifyToken,
    logout
  }
}
