// composables/useAuth.ts
import type { UserProfile, ActivePermission } from '~/types/auth';
import { useDark } from '@vueuse/core';

// ── Inflight guard untuk getProfile — mencegah duplicate /auth/profile calls ──
let inflightProfile: Promise<UserProfile | null> | null = null;
let lastProfileFetchAt = 0;
const PROFILE_DEDUP_MS = 5_000; // 5 detik — jangan fetch ulang jika baru saja

const sanitizeReturnTo = (value?: string): string => {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/auth') ||
    value.includes('\\')
  ) {
    return '/beranda';
  }
  return value;
};

export const useAuth = () => {
  const { apiGet, apiPost, clearApiCache } = useApi();
  // useI18n() hanya boleh dipanggil di dalam setup component. useAuth()
  // dipanggil juga dari middleware/route guard, sehingga memanggil useI18n()
  // di sini melempar "Must be called at the top of a setup function" (500).
  // Ambil instance i18n global secara lazy hanya saat applyLoginDefaults()
  // dijalankan di client (setelah login sukses).
  const isDark = useDark();
  const tokenCookie = useCookie<string | null>('token', {
    sameSite: 'lax',
    path: '/',
  });
  const roleCookie = useCookie<string | null>('auth_role', {
    sameSite: 'lax',
    path: '/',
  });
  const sessionCookie = useCookie<string | null>('sessionId', {
    sameSite: 'lax',
    path: '/',
  });
  const user = useState<UserProfile | null>('user', () => null);
  const setUser = (data: UserProfile | null) => {
    user.value = data;
  };

  // Setiap login baru dimulai dengan bahasa Indonesia dan mode terang.
  // Simpan juga ke storage agar Navbar tidak mengembalikan preferensi lama
  // ketika halaman beranda selesai dimuat.
  const applyLoginDefaults = () => {
    if (!process.client) return;

    // Lazy: hanya akses i18n saat benar-benar dipakai (client-side).
    const i18n = useNuxtApp().$i18n;
    if (i18n?.locale) {
      i18n.locale.value = 'id';
    }
    localStorage.setItem('arsipku_locale', 'id');
    isDark.value = false;
  };

  const getProfile = async (force = false): Promise<UserProfile | null> => {
    // Inflight guard — jika getProfile sedang berjalan, tunggu itu saja
    if (inflightProfile && !force) return inflightProfile;

    // Stale guard — jika profile sudah ada dan baru saja fetch, return cached
    if (!force && user.value && Date.now() - lastProfileFetchAt < PROFILE_DEDUP_MS) {
      return user.value;
    }

    const token = process.client ? localStorage.getItem('token') : tokenCookie.value;
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
          '/auth/profile',
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
        const isLegalRoleData = res?.data?.isLegalRole ?? res?.isLegalRole ?? false;

        if (profileData) {
          // 3. GABUNGKAN: Masukkan alamatInfo dan delegations ke dalam profileData
          profileData = {
            ...profileData,
            alamatInfo: alamatData || profileData.alamatInfo,
            delegations: delegationsData || profileData.delegations,
            isLegalRole: isLegalRoleData,
          };

          // Casting ke UserProfile
          const normalizedProfile = profileData as UserProfile;

          // Sinkronkan active_profile dari localStorage (pola sama dgn delegasi).
          // Ini memastikan profile aktif tetap konsisten setelah reload, meski
          // JWT round-trip belum selesai.
          if (process.client) {
            const storedProfile = localStorage.getItem('arsipku_active_profile');
            if (
              storedProfile &&
              (storedProfile === 'akun_asli' || storedProfile === 'sekretaris')
            ) {
              normalizedProfile.active_profile = storedProfile as 'akun_asli' | 'sekretaris';
            }
          }

          // Simpan ke state global
          setUser(normalizedProfile);
          roleCookie.value = normalizedProfile.role ?? null;
          lastProfileFetchAt = Date.now();

          return normalizedProfile;
        }

        return null;
      } catch (error) {
        console.error('[AUTH] getProfile error:', error);
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

  const getSSORedirectUrl = async (returnTo = '/beranda') => {
    const baseUrl = String(useRuntimeConfig().public.apiBaseUrl || '').replace(/\/$/, '');
    const params = new URLSearchParams({
      redirect: sanitizeReturnTo(returnTo),
    });
    if (process.client) params.set('origin', window.location.origin);
    return `${baseUrl}/auth/login?${params.toString()}`;
  };

  /**
   * Tukar cookie HttpOnly hasil callback menjadi JWT aplikasi ArsipKu.
   * Access/refresh token milik AirNav Auth tetap berada di backend.
   */
  const restoreSession = async (): Promise<UserProfile | null> => {
    try {
      const response: any = await apiGet(
        '/auth/session',
        { withCredentials: true },
        { skipCache: true }
      );
      const data = response?.data ?? response;
      if (!data?.accessToken || !data?.sessionId || !data?.user) return null;

      if (process.client) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('sessionId', data.sessionId);
      }
      tokenCookie.value = data.accessToken;
      sessionCookie.value = data.sessionId;
      roleCookie.value = data.user.role ?? null;
      setUser(data.user as UserProfile);
      lastProfileFetchAt = Date.now();
      clearApiCache();
      return (await getProfile(true)) ?? (data.user as UserProfile);
    } catch {
      return null;
    }
  };

  const verifyToken = async (token: string) => {
    try {
      return await apiPost('/auth/verify-token', { token });
    } catch (error) {
      console.error('[AUTH] verifyToken error:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Bersihkan JWT aplikasi lebih dulu; backend tetap menerima cookie sesi
    // HttpOnly untuk merevoke token provider secara server-to-server.
    if (process.client) {
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('arsipku_active_profile');
    }
    tokenCookie.value = null;
    sessionCookie.value = null;
    roleCookie.value = null;
    user.value = null;
    lastProfileFetchAt = 0;
    clearApiCache();

    // Navigasi penuh diperlukan agar redirect backend dan Set-Cookie logout
    // diproses browser tanpa mengekspos token provider.
    if (process.client) {
      const baseUrl = String(useRuntimeConfig().public.apiBaseUrl || '').replace(/\/$/, '');
      // Kirim origin frontend saat ini agar backend redirect balik ke sini
      // setelah logout (mis. QA 172.x), bukan ke AUTH_FRONTEND_URL default.
      const logoutUrl = new URL(`${baseUrl}/auth/logout`);
      logoutUrl.searchParams.set('origin', window.location.origin);
      window.location.href = logoutUrl.toString();
    }

    return true;
  };

  const refreshToken = async () => {
    if (!process.client) return null;
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) throw new Error('No sessionId');
    const currentToken = localStorage.getItem('token');

    const res: any = await apiPost(
      '/auth/refresh',
      {},
      {
        withCredentials: true,
        headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : undefined,
      }
    );

    const data = res?.data ?? res;
    const newAccessToken = data?.accessToken;
    if (!newAccessToken) throw new Error('Refresh token failed');

    localStorage.setItem('token', newAccessToken);
    if (data?.sessionId) localStorage.setItem('sessionId', data.sessionId);
    tokenCookie.value = newAccessToken;
    if (data?.user) setUser(data.user as UserProfile);
    clearApiCache();
    return newAccessToken as string;
  };

  // ============================================================
  // RBAC helpers (permission-based)
  // ============================================================

  const hasPermission = (resource: string, action: string): boolean => {
    // Superadmin bypass — punya semua permission
    const role = (user.value?.activeRole?.name ?? user.value?.role ?? '')
      .toUpperCase()
      .replace(/[\s_-]/g, '');
    if (role === 'SUPERADMIN') return true;
    const perms = user.value?.activePermissions || [];
    return perms.some((p: ActivePermission) => {
      // Match: exact, parent→child (user punya parent, FE cek child),
      // atau child→parent (user punya child, FE cek parent)
      const resourceMatch =
        p.resource === resource ||
        resource.startsWith(p.resource + '.') || // parent mencakup child
        p.resource.startsWith(resource + '.'); // child mencakup parent
      return resourceMatch && p.actions.includes(action);
    });
  };

  const hasAnyPermission = (resource: string, actions: string[]): boolean =>
    actions.some((a) => hasPermission(resource, a));

  const hasRole = (roleName: string): boolean => {
    const active = user.value?.activeRole?.name;
    const normalizeRole = (role: string) => role.toUpperCase().replace(/[\s_-]/g, '');
    if (active && normalizeRole(active) === normalizeRole(roleName)) return true;
    const fallback = user.value?.role;
    return !!fallback && normalizeRole(fallback) === normalizeRole(roleName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => roleNames.some(hasRole);

  const isSuperadmin = computed(() => hasRole('SUPERADMIN'));
  const isAdmin = computed(() => hasRole('ADMIN'));
  const isLegalRole = computed(() => !!user.value?.isLegalRole);

  const switchRole = async (roleId: string) => {
    if (!process.client) return;
    const token = localStorage.getItem('token');
    const res: any = await apiPost(
      '/rbac/switch-role',
      { roleId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = res?.data ?? res;
    const newToken = data?.accessToken;
    if (newToken) {
      localStorage.setItem('token', newToken);
      tokenCookie.value = newToken;
      clearApiCache();
    }
    if (data?.activeRole) {
      const updated: UserProfile = {
        ...(user.value as UserProfile),
        activeRole: data.activeRole,
        activePermissions: data.activePermissions || user.value?.activePermissions,
        role: (data.activeRole.name || '').toLowerCase() || user.value?.role || 'user',
      };
      setUser(updated);
      roleCookie.value = updated.role ?? null;
    }
  };

  /**
   * Ganti profile aktif user antara 'akun_asli' dan 'sekretaris' (delegasi sekretaris).
   * Endpoint backend re-sign JWT baru dengan active_profile terbaru.
   */
  const switchProfile = async (profile: 'akun_asli' | 'sekretaris') => {
    if (!process.client) return;
    const token = localStorage.getItem('token');
    const res: any = await apiPost(
      '/auth/switch-profile',
      { profile },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = res?.data ?? res;
    const newToken = data?.accessToken;
    if (newToken) {
      localStorage.setItem('token', newToken);
      tokenCookie.value = newToken;
      clearApiCache();
    }
    if (data?.active_profile) {
      const updated: UserProfile = {
        ...(user.value as UserProfile),
        active_profile: data.active_profile,
        has_secretary_delegation:
          data.has_secretary_delegation ?? user.value?.has_secretary_delegation,
        available_profiles: data.available_profiles ?? user.value?.available_profiles,
      };
      setUser(updated);
      // Persist ke localStorage agar konsisten setelah reload (pola sama dgn delegasi).
      if (process.client) {
        localStorage.setItem('arsipku_active_profile', data.active_profile);
        // Beri tahu sidebar agar update tanpa reload manual.
        window.dispatchEvent(new Event('profile-changed'));
      }
    }
    return res;
  };

  const refreshPermissions = async (): Promise<void> => {
    try {
      const token = process.client ? localStorage.getItem('token') : null;
      if (!token) return;

      clearApiCache();
      const res: any = await apiGet(
        '/auth/refresh-permissions',
        { headers: { Authorization: `Bearer ${token}` } },
        { skipCache: true }
      );
      const data = res?.data ?? res;
      const newToken = data?.accessToken;
      if (newToken) {
        localStorage.setItem('token', newToken);
        tokenCookie.value = newToken;
      }
      if (data?.activePermissions) {
        const updated: UserProfile = {
          ...(user.value as UserProfile),
          activePermissions: Array.isArray(data.activePermissions)
            ? [...data.activePermissions]
            : [],
          activeRole: data.activeRole ?? user.value?.activeRole,
          role: data.role ?? user.value?.role,
        };
        setUser(updated);
        roleCookie.value = updated.role ?? null;
      }
    } catch (error) {
      console.error('[AUTH] refreshPermissions error:', error);
    }
  };

  return {
    user,
    setUser,
    applyLoginDefaults,
    getProfile,
    getSSORedirectUrl,
    restoreSession,
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
    isLegalRole,
    switchRole,
    switchProfile,
  };
};
