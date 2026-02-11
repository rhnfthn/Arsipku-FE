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

      // 1. Ambil data User utama
      let profileData = res?.data?.user || res?.user || res || null;

      // 2. Ambil data AlamatInfo (biasanya ada di res.data.alamatInfo)
      const alamatData = res?.data?.alamatInfo || res?.alamatInfo || null;

      if (profileData) {
        // 3. GABUNGKAN: Jika alamatData ditemukan, masukkan ke dalam profileData
        if (alamatData) {
          profileData = {
            ...profileData,
            alamatInfo: alamatData,
          };
        }

        // Casting ke UserProfile
        const normalizedProfile = profileData as UserProfile;

        // Simpan ke state global (Pinia/useState)
        setUser(normalizedProfile);

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
      const res: any = await apiGet("/auth/sso-redirect-local");
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
      const sessionId = localStorage.getItem("sessionId");
      const token = localStorage.getItem("token");

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
      // logout internal gagal TIDAK BOLEH menghalangi logout user
      console.warn("[AUTH] logout-v2 error (ignored):", error);
    }

    // 2️⃣ Bersihkan state lokal
    if (process.client) {
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
    }
    user.value = null;

    // 3️⃣ Redirect ke SSO AirNav
    if (process.client) {
      const redirectTarget = "http://localhost:3000/autharsipku";
      const encodedRedirect = btoa(redirectTarget);

      window.location.href = `https://auth.airnavindonesia.co.id/user/logout?redirect_uri=${encodedRedirect}`;
    }

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