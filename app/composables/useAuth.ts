// composers/useAuth.ts
import type { UserProfile } from "~/types/auth";

export const useAuth = () => {
  const { apiGet, apiPost } = useApi();
  const user = useState<UserProfile | null>("user", () => null);
  const setUser = (data: UserProfile | null) => {
    user.value = data;
  };

  const getProfile = async (): Promise<UserProfile | null> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const res: any = await apiGet("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Normalisasi struktur respons
      const profileData =
        res?.data?.user || // case: { data: { user: {...} } }
        res?.user || // case: { user: {...} }
        res || // case: langsung {persnum, role, ...}
        null;

      if (profileData) {
        // Casting ke UserProfile agar TS yakin strukturnya cocok
        const normalizedProfile = profileData as UserProfile;
        setUser(normalizedProfile);
        return normalizedProfile;
      }

      return null;
    } catch (error) {
      console.error("[AUTH] getProfile error:", error);
      return null;
    }
  };


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


  const verifyToken = async (token: string) => {
    try {
      return await apiPost("/auth/verify-token", { token });
    } catch (error) {
      console.error("[AUTH] verifyToken error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      const token = localStorage.getItem("token");

      if (sessionId && token) {
        await apiGet(`/auth/logout?sessionId=${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (s: number) => s < 400,
        });
      }
    } catch (error) {
      console.warn("[AUTH] logout error (ignored):", error);
    }

    // Bersihkan localStorage & state
    if (process.client) {
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
    }
    user.value = null; // Type aman karena null diizinkan

    return true;
  };

  const refreshToken = async () => {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) throw new Error("No sessionId");

    const res: any = await apiPost("/auth/refresh-token", {
      sessionId,
    });

    const newAccessToken = res?.data?.accessToken;
    if (!newAccessToken) throw new Error("Refresh token failed");

    localStorage.setItem("token", newAccessToken);
    return newAccessToken as string;
  };

  return {
    user,
    setUser,
    getProfile,
    getSSORedirectUrl,
    verifyToken,
    logout,
    refreshToken,
  };
};
