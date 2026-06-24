// composables/useAuth.ts
import type { UserProfile } from "~/types/auth";

export const useAuth = () => {
  const { apiGet, apiPost } = useApi();
  const tokenCookie = useCookie<string | null>("token", {
    sameSite: "lax",
    path: "/",
  });
  const roleCookie = useCookie<string | null>("auth_role", {
    sameSite: "lax",
    path: "/",
  });
  const sessionCookie = useCookie<string | null>("sessionId", {
    sameSite: "lax",
    path: "/",
  });
  const user = useState<UserProfile | null>("user", () => null);
  const setUser = (data: UserProfile | null) => {
    user.value = data;
  };

  const getProfile = async (): Promise<UserProfile | null> => {
    try {
      const token = process.client ? localStorage.getItem("token") : null;
      if (!token) return null;
      tokenCookie.value = token;

      const res: any = await apiGet("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 1. Ambil data User utama
      let profileData = res?.data?.user || res?.user || res || null;

      // 2. Ambil data tambahan dari root response
      const alamatData = res?.data?.alamatInfo || res?.alamatInfo || null;
      const delegationsData = res?.data?.delegations || res?.delegations || null;

      if (profileData) {
        // 3. GABUNGKAN: Masukkan alamatInfo dan delegations ke dalam profileData
        profileData = {
          ...profileData,
          alamatInfo: alamatData || profileData.alamatInfo,
          delegations: delegationsData || profileData.delegations
        };

        // Casting ke UserProfile
        const normalizedProfile = profileData as UserProfile;

        // Debug: Pastikan position_status terbaca jika dikirim backend
        // console.log("Position Status:", normalizedProfile.position_status);

        // Simpan ke state global
        setUser(normalizedProfile);
        roleCookie.value = normalizedProfile.role ?? null;

        return normalizedProfile;
      }

      return null;
    } catch (error) {
      console.error("[AUTH] getProfile error:", error);
      return null;
    }
  };

  const getSSORedirectUrl = async () => {
    try {
      // Gunakan sso-redirect-local saat development (localhost) agar redirect ke localhost:3000/autharsipku
      const isLocal = process.client && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const endpoint = isLocal ? "/auth/sso-redirect-local" : "/auth/sso-redirect";
      const res: any = await apiGet(endpoint);
      return (res?.url as string) ?? null;
    } catch (error) {
      console.error("[AUTH] getSSORedirectUrl error:", error);
      return null;
    }
  };

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
      const sessionId = process.client ? localStorage.getItem("sessionId") : null;
      const token = process.client ? localStorage.getItem("token") : null;

      // 1️⃣ Logout internal (hapus sessionId)
      if (sessionId && token) {
        await apiGet(`/auth/logout-v2?sessionId=${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          validateStatus: (s: number) => s < 400,
        });
      }
    } catch (error) {
      console.warn("[AUTH] logout-v2 error (ignored):", error);
    }

    // 2️⃣ Bersihkan state lokal
    if (process.client) {
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
    }
    tokenCookie.value = null;
    sessionCookie.value = null;
    roleCookie.value = null;
    user.value = null;

    // 3️⃣ Redirect ke SSO AirNav
    if (process.client) {
      const redirectTarget = window.location.origin + "/autharsipku"; // Lebih dinamis
      const encodedRedirect = btoa(redirectTarget);

      // Pastikan URL logout sesuai environment
      const ssoLogoutUrl = "https://auth.airnavindonesia.co.id/user/logout";
      window.location.href = `${ssoLogoutUrl}?redirect_uri=${encodedRedirect}`;
    }

    return true;
  };

  const refreshToken = async () => {
    if (!process.client) return null;
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) throw new Error("No sessionId");

    const res: any = await apiPost("/auth/refresh-token", {
      sessionId,
    });

    const newAccessToken = res?.data?.accessToken;
    if (!newAccessToken) throw new Error("Refresh token failed");

    localStorage.setItem("token", newAccessToken);
    tokenCookie.value = newAccessToken;
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
