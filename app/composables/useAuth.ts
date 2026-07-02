// composables/useAuth.ts
import type { UserProfile, ActivePermission } from "~/types/auth";

// ── Inflight guard untuk getProfile — mencegah duplicate /auth/profile calls ──
let inflightProfile: Promise<UserProfile | null> | null = null;
let lastProfileFetchAt = 0;
const PROFILE_DEDUP_MS = 5_000; // 5 detik — jangan fetch ulang jika baru saja

export const useAuth = () => {
  const { apiGet, apiPost, clearApiCache } = useApi();
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

  const getProfile = async (force = false): Promise<UserProfile | null> => {
    // Inflight guard — jika getProfile sedang berjalan, tunggu itu saja
    if (inflightProfile && !force) return inflightProfile;

    // Stale guard — jika profile sudah ada dan baru saja fetch, return cached
    if (!force && user.value && Date.now() - lastProfileFetchAt < PROFILE_DEDUP_MS) {
      return user.value;
    }

    const token = process.client ? localStorage.getItem("token") : tokenCookie.value;
    if (!token) {
      if (force) {
        setUser(null);
        roleCookie.value = null;
        lastProfileFetchAt = 0;
      }
      return null;
    }

    const request = (async () => {
      try {
        tokenCookie.value = token;

        const res: any = await apiGet(
          "/auth/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
          { skipCache: true }
        );

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

          // Simpan ke state global
          setUser(normalizedProfile);
          roleCookie.value = normalizedProfile.role ?? null;
          lastProfileFetchAt = Date.now();

          return normalizedProfile;
        }

        return null;
      } catch (error) {
        console.error("[AUTH] getProfile error:", error);
        return null;
      }
    })();

    inflightProfile = request;

    try {
      return await request;
    } finally {
      if (inflightProfile === request) {
        inflightProfile = null;
      }
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
    lastProfileFetchAt = 0;
    clearApiCache();

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
    clearApiCache();
    return newAccessToken as string;
  };

  // ============================================================
  // RBAC helpers (permission-based)
  // ============================================================

  const hasPermission = (resource: string, action: string): boolean => {
    const perms = user.value?.activePermissions || [];
    return perms.some(
      (p: ActivePermission) => p.resource === resource && p.actions.includes(action)
    );
  };

  const hasAnyPermission = (resource: string, actions: string[]): boolean =>
    actions.some((a) => hasPermission(resource, a));

  const hasRole = (roleName: string): boolean => {
    const active = user.value?.activeRole?.name;
    if (active && active.toUpperCase() === roleName.toUpperCase()) return true;
    const fallback = user.value?.role;
    return !!fallback && fallback.toLowerCase() === roleName.toLowerCase();
  };

  const hasAnyRole = (roleNames: string[]): boolean => roleNames.some(hasRole);

  const isSuperadmin = computed(() => hasRole("SUPERADMIN"));
  const isAdmin = computed(() => hasRole("ADMIN"));

  const switchRole = async (roleId: string) => {
    if (!process.client) return;
    const token = localStorage.getItem("token");
    const res: any = await apiPost(
      "/rbac/switch-role",
      { roleId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = res?.data ?? res;
    const newToken = data?.accessToken;
    if (newToken) {
      localStorage.setItem("token", newToken);
      tokenCookie.value = newToken;
      clearApiCache();
    }
    if (data?.activeRole) {
      const updated: UserProfile = {
        ...(user.value as UserProfile),
        activeRole: data.activeRole,
        activePermissions: data.activePermissions || user.value?.activePermissions,
        role: (data.activeRole.name || "").toLowerCase() || user.value?.role || "user",
      };
      setUser(updated);
      roleCookie.value = updated.role ?? null;
    }
  };

  const refreshPermissions = async (): Promise<void> => {
    try {
      const token = process.client ? localStorage.getItem("token") : null;
      if (!token) return;

      const res: any = await apiGet("/auth/refresh-permissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res?.data ?? res;
      const newToken = data?.accessToken;
      if (newToken) {
        localStorage.setItem("token", newToken);
        tokenCookie.value = newToken;
      }
      if (data?.activePermissions) {
        const updated: UserProfile = {
          ...(user.value as UserProfile),
          activePermissions: data.activePermissions,
          activeRole: data.activeRole ?? user.value?.activeRole,
          role: data.role ?? user.value?.role,
        };
        setUser(updated);
        roleCookie.value = updated.role ?? null;
      }
    } catch (error) {
      console.error("[AUTH] refreshPermissions error:", error);
    }
  };

  return {
    user,
    setUser,
    getProfile,
    getSSORedirectUrl,
    verifyToken,
    logout,
    refreshToken,
    refreshPermissions,
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    isSuperadmin,
    isAdmin,
    switchRole,
  };
};
