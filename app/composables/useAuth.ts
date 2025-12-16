export const useAuth = () => {

  const { apiGet, apiPost } = useApi();


  // Global state user
  const user = useState("user", () => null)

  const setUser = (data: any) => {
    user.value = data
  }

  // Ambil profil dari backend
  const getProfile = async () => {
    try {

      const token = localStorage.getItem("token");
      if (!token) return null;
      const res = await apiGet("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Normalisasi struktur respons
      const profile =
        res?.data?.user ||   // case: { data: { user: {...} } }
        res?.user ||         // case: { user: {...} }
        res || null          // case: langsung {persnum, role, ...}

      if (profile) setUser(profile)

      return profile
    } catch (error) {
      console.error("[AUTH] getProfile error:", error)
      return null
    }
  }

  // Ambil URL SSO Redirect
  const getSSORedirectUrl = async () => {
    try {
      // const res = await apiGet("/auth/sso-redirect-local")
      const res = await apiGet("/auth/sso-redirect")
      return res?.url ?? null
    } catch (error) {
      console.error("[AUTH] getSSORedirectUrl error:", error)
      return null
    }
  }

  // Verifikasi token SSO
  const verifyToken = async (token: string) => {
    try {
      return await apiPost("/auth/verify-token", { token })
    } catch (error) {
      console.error("[AUTH] verifyToken error:", error)
      throw error
    }
  }

  // Logout
  const logout = async () => {
    try {
      const sessionId = localStorage.getItem("sessionId")
      const token = localStorage.getItem("token")

      await apiGet(`/auth/logout?sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: (s) => s < 400
      })
    } catch (error) {
      console.warn("[AUTH] logout error (ignored):", error)
    }

    // Bersihkan localStorage & state
    localStorage.removeItem("token")
    localStorage.removeItem("sessionId")
    user.value = null

    return true
  }

  const refreshToken = async () => {
    const sessionId = localStorage.getItem("sessionId")
    if (!sessionId) throw new Error("No sessionId")

    const res = await apiPost("/auth/refresh-token", {
      sessionId
    })

    const newAccessToken = res?.data?.accessToken
    if (!newAccessToken) throw new Error("Refresh token failed")

    localStorage.setItem("token", newAccessToken)
    return newAccessToken
  }

  return {
    user,
    setUser,
    getProfile,
    getSSORedirectUrl,
    verifyToken,
    logout,
    refreshToken

  };
};

// export const useAuth = () => {
//   const { apiGet } = useApi();
//   const user = useState<any | null>("user", () => null);

//   const getProfile = async () => {
//     try {

//       if (process.server) return null;

//       const token = localStorage.getItem("token");
//       if (!token) return null;

//       const res = await apiGet("/auth/profile", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const profile = res?.data?.user;

//       if (profile) {
//         user.value = profile;
//       }

//       return profile;
//     } catch (err) {
//       console.error("[AUTH] getProfile failed:", err);
//       user.value = null;
//       return null;
//     }
//   };

//   const logout = async () => {
//     if (process.client) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("sessionId");
//     }
//     user.value = null;
//     return true;
//   };

//   return {
//     user,
//     getProfile,
//     logout,
//   };
// };

