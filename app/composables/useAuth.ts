// composables/useAuth.ts
import type { UserProfile, ActivePermission } from '~/types/auth';
import type { AuthMode } from '~/utils/auth-storage';
import { useDark } from '@vueuse/core';
import {
  clearStoredAuthSession,
  getStoredAccessToken,
  getStoredAuthMode,
  getStoredSessionId,
  replaceStoredAccessToken,
  setStoredAuthSession,
} from '~/utils/auth-storage';

// ── Inflight guard untuk getProfile — mencegah duplicate /auth/profile calls ──
let inflightProfile: Promise<UserProfile | null> | null = null;
let lastProfileFetchAt = 0;
const PROFILE_DEDUP_MS = 5_000; // 5 detik — jangan fetch ulang jika baru saja

export const useAuth = () => {
  const { apiGet, apiPost, clearApiCache } = useApi();
  const { setLocale } = useI18n();
  const isDark = useDark();
  const runtimeConfig = useRuntimeConfig();
  const { createAuthorizeUrl, consumeTransaction, clearTransaction } = useOidcPkce();
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

  // Setiap login baru dimulai dari tampilan awal aplikasi yang konsisten.
  // Nilai ini sengaja disimpan agar Navbar tidak mengembalikan preferensi sesi
  // sebelumnya saat komponen dashboard selesai dimuat.
  const applyLoginDefaults = () => {
    if (!process.client) return;

    setLocale('id');
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

    const token = process.client ? getStoredAccessToken() : tokenCookie.value;
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

  const configuredAuthMode = (): AuthMode =>
    String(runtimeConfig.public.authMode) === 'oidc-pkce' ? 'oidc-pkce' : 'legacy';

  const getSSORedirectUrl = async (returnTo = '/beranda') => {
    try {
      if (configuredAuthMode() === 'oidc-pkce') {
        return await createAuthorizeUrl(returnTo);
      }

      // Gunakan sso-redirect-local saat development (localhost) agar redirect ke localhost:3000/autharsipku
      const isLocal =
        process.client &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const endpoint = isLocal ? '/auth/sso-redirect-local' : '/auth/sso-redirect';
      const res: any = await apiGet(endpoint);
      return (res?.url as string) ?? null;
    } catch (error) {
      console.error('[AUTH] getSSORedirectUrl error:', error);
      return null;
    }
  };

  const exchangeOidcCode = async (code: string, state: string) => {
    const transaction = consumeTransaction(state);
    const result: any = await apiPost('/auth/oidc/exchange', {
      code,
      codeVerifier: transaction.codeVerifier,
    });
    const data = result?.data ?? result;
    if (!data?.accessToken || !data?.sessionId) {
      throw new Error('Backend tidak mengembalikan sesi ArsipKu yang valid');
    }

    setStoredAuthSession(data.accessToken, data.sessionId, 'oidc-pkce');
    tokenCookie.value = data.accessToken;
    sessionCookie.value = data.sessionId;
    roleCookie.value = data.user?.role ?? null;
    clearApiCache();
    return { ...data, returnTo: transaction.returnTo };
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
    const activeMode = getStoredAuthMode();
    try {
      const sessionId = getStoredSessionId();
      const token = getStoredAccessToken();

      // 1️⃣ Logout internal (hapus sessionId)
      if (sessionId && token) {
        if (activeMode === 'oidc-pkce') {
          await apiPost(
            '/auth/oidc/logout',
            { sessionId },
            {
              headers: { Authorization: `Bearer ${token}` },
              validateStatus: (s: number) => s < 400,
            }
          );
        } else {
          await apiGet(`/auth/logout-v2?sessionId=${encodeURIComponent(sessionId)}`, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: (s: number) => s < 400,
          });
        }
      }
    } catch (error) {
      console.warn('[AUTH] provider logout gagal; sesi lokal tetap dibersihkan:', error);
    }

    // 2️⃣ Bersihkan state lokal
    if (process.client) {
      clearStoredAuthSession();
      clearTransaction();
    }
    tokenCookie.value = null;
    sessionCookie.value = null;
    roleCookie.value = null;
    user.value = null;
    lastProfileFetchAt = 0;
    clearApiCache();

    // 3️⃣ Redirect ke SSO AirNav
    if (process.client) {
      if (activeMode === 'oidc-pkce') {
        await navigateTo('/', { replace: true });
        return true;
      }
      const redirectTarget = window.location.origin + '/autharsipku'; // Lebih dinamis
      const encodedRedirect = btoa(redirectTarget);

      // Pastikan URL logout sesuai environment
      const ssoLogoutUrl = 'https://auth.airnavindonesia.co.id/user/logout';
      window.location.href = `${ssoLogoutUrl}?redirect_uri=${encodedRedirect}`;
    }

    return true;
  };

  const refreshToken = async () => {
    if (!process.client) return null;
    const sessionId = getStoredSessionId();
    if (!sessionId) throw new Error('No sessionId');

    const isOidc = getStoredAuthMode() === 'oidc-pkce';
    const token = getStoredAccessToken();

    const res: any = await apiPost(
      isOidc ? '/auth/oidc/refresh' : '/auth/refresh-token',
      { sessionId },
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );

    const refreshData = res?.data?.data ?? res?.data ?? res;
    const newAccessToken = refreshData?.accessToken;
    if (!newAccessToken) throw new Error('Refresh token failed');

    replaceStoredAccessToken(newAccessToken);
    tokenCookie.value = newAccessToken;
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
    return perms.some(
      (p: ActivePermission) => {
        // Match: exact, parent→child (user punya parent, FE cek child),
        // atau child→parent (user punya child, FE cek parent)
        const resourceMatch =
          p.resource === resource ||
          resource.startsWith(p.resource + '.') ||  // parent mencakup child
          p.resource.startsWith(resource + '.');     // child mencakup parent
        return resourceMatch && p.actions.includes(action);
      }
    );
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
    const token = getStoredAccessToken();
    const res: any = await apiPost(
      '/rbac/switch-role',
      { roleId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = res?.data ?? res;
    const newToken = data?.accessToken;
    if (newToken) {
      replaceStoredAccessToken(newToken);
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
    const token = getStoredAccessToken();
    const res: any = await apiPost(
      '/auth/switch-profile',
      { profile },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = res?.data ?? res;
    const newToken = data?.accessToken;
    if (newToken) {
      replaceStoredAccessToken(newToken);
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
      const token = getStoredAccessToken();
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
        replaceStoredAccessToken(newToken);
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
    exchangeOidcCode,
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
