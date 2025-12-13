// export const useAuth = () => {
//   const { apiGet, apiPost } = useApi();

//   const user = useState("user", () => null);

//   const setUser = (data) => {
//     user.value = data;
//   };

//   const getProfile = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) return null;

//       const res = await apiGet("/auth/profile", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const profile = res?.data?.user || res?.user || res;

//       if (profile) setUser(profile);

//       return profile;
//     } catch (error) {
//       console.error("[AUTH] Error getProfile:", error);
//       return null;
//     }
//   };
//   const getSSORedirectUrl = async () => {
//     try {
//       const res = await apiGet("/auth/sso-redirect-local");
//       return res?.url ?? null;
//     } catch (error) {
//       console.error("[AUTH] getSSORedirectUrl error:", error);
//       return null;
//     }
//   };

//   const verifyToken = async (token: string) => {
//     try {
//       const res = await apiPost("/auth/verify-token", { token });
//       return res;
//     } catch (error) {
//       console.error("[AUTH] Error verifyToken:", error);
//       throw error;
//     }
//   };

//   const logout = async () => {
//     try {
//       const sessionId = localStorage.getItem("sessionId");
//       const token = localStorage.getItem("token");

//       await apiGet(`/auth/logout?sessionId=${sessionId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//         validateStatus: (status) => status < 400,
//       });
//     } catch (error) {
//       console.warn("[AUTH] Logout redirect normal:", error);
//     }

//     localStorage.removeItem("token");
//     localStorage.removeItem("sessionId");
//     user.value = null;

//     return true;
//   };

//   return {
//     user,
//     setUser,
//     getProfile,
//     getSSORedirectUrl,
//     verifyToken,
//     logout,
//   };
// };

export const useAuth = () => {
  const { apiGet } = useApi();
  const user = useState<any | null>("user", () => null);

  const getProfile = async () => {
    try {
      // ✅ pastikan hanya jalan di client
      if (process.server) return null;

      const token = localStorage.getItem("token");
      if (!token) return null;

      const res = await apiGet("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ PASTIIN STRUKTUR
      const profile = res?.data?.user;

      if (profile) {
        user.value = profile;
      }

      return profile;
    } catch (err) {
      console.error("[AUTH] getProfile failed:", err);
      user.value = null;
      return null;
    }
  };

  const logout = async () => {
    if (process.client) {
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
    }
    user.value = null;
    return true;
  };

  return {
    user,
    getProfile,
    logout,
  };
};
