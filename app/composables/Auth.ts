export const useAuth = () => {
  const { apiGet, apiPost } = useApi()

  // 🟦 Global user state (tersedia di seluruh aplikasi)
  const user = useState("user", () => null)

  const setUser = (data) => {
    user.value = data
  }

  // 🟩 Ambil profil dari backend
const getProfile = async () => {
  try {
    const token = localStorage.getItem("token")
    if (!token) return null

    const res = await apiGet("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })

    const profile = res?.data?.user || res?.user || res

    if (profile) setUser(profile)

    return profile
  } catch (error) {
    console.error("[AUTH] Error getProfile:", error)
    return null
  }
}

  const getSSORedirectUrl = async () => {
    try {
      const res = await apiGet('/auth/sso-redirect')
      return res?.url || null
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

      await apiGet(`/auth/logout?sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: (status) => status < 400
      })
    } catch (error) {
      console.warn("[AUTH] Logout redirect normal:", error)
    }

    localStorage.removeItem("token")
    localStorage.removeItem("sessionId")
    user.value = null // 🟥 clear user di state

    return true
  }

  return {
    user,
    setUser,
    getProfile,
    getSSORedirectUrl,
    verifyToken,
    logout
  }
}
