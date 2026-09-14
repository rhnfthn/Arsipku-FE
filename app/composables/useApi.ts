  import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";

const isDev = process.dev;

const redactLogValue = (value: unknown): unknown => {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redactLogValue);

  const sensitiveKey = /token|authorization|password|secret|verifier|code/i;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      sensitiveKey.test(key) ? '[REDACTED]' : redactLogValue(entry),
    ])
  );
};

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 100;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 menit

let lastAuthCacheScope = "anonymous";
let refreshTokenRequest: Promise<string | null> | null = null;
let handledExpiredToken: string | null = null;

interface ApiGetOptions {
  ttlMs?: number;
  skipCache?: boolean;
}

const FRESH_GET_URL_PATTERNS: RegExp[] = [
  /^\/auth\/profile(?:[/?#]|$)/,
  /^\/auth\/refresh-permissions(?:[/?#]|$)/,
  /^\/dashboard(?:[/?#]|$)/,
  /^\/notifications(?:[/?#]|$)/,
  /^\/naskah_sirkulasi\/(?:inbox-count|inbox|sent|tertunda)(?:[/?#]|$)/,
  /^\/draft\/list(?:[/?#]|$)/,
  /^\/labels\/(?:counts|[^/]+\/naskah)(?:[/?#]|$)/,
  /^\/naskah-lainnya(?:[/?#]|$)/,
  /^\/(?:admin\/)?nomor-request(?:[/?#-]|$)/,
  /^\/digsig(?:[/?#]|$)/,
  /^\/naskah-dinas(?:[/?#]|$)/,
  /^\/search\/v3(?:[/?#]|$)/,
  /^\/mail-service\/logs(?:[/?#]|$)/,
  /^\/arsip-dinamis(?:[/?#]|$)/,
];

const normalizeApiUrl = (url: string): string => {
  try {
    if (/^https?:\/\//i.test(url)) {
      const parsed = new URL(url);
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Keep original URL if parsing fails.
  }

  return url.startsWith("/") ? url : `/${url}`;
};

const shouldBypassCache = (url: string, options: ApiGetOptions = {}): boolean => {
  if (options.skipCache) return true;
  const normalizedUrl = normalizeApiUrl(url);
  return FRESH_GET_URL_PATTERNS.some((pattern) => pattern.test(normalizedUrl));
};

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const getHeaderValue = (
  headers: AxiosRequestConfig["headers"] | undefined,
  name: string
): string | undefined => {
  const rawHeaders = headers as any;
  if (!rawHeaders) return undefined;
  return rawHeaders[name] || rawHeaders[name.toLowerCase()] || rawHeaders.get?.(name);
};

const getAuthCacheScope = (config?: AxiosRequestConfig): string => {
  const authHeader = getHeaderValue(config?.headers, "Authorization");
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const storedToken = process.client ? localStorage.getItem("token") : null;
  const token = headerToken || storedToken;
  const scope = token ? `auth:${hashString(token)}` : "anonymous";

  if (scope !== lastAuthCacheScope) {
    cache.clear();
    lastAuthCacheScope = scope;
  }

  return scope;
};

const buildCacheKey = (
  url: string,
  config?: AxiosRequestConfig,
  authScope = "anonymous"
): string => {
  const params = config?.params ? JSON.stringify(config.params) : "";
  return `${authScope}:${url}?${params}`;
};

const getCached = <T>(key: string): T | undefined => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
};

const setCached = (key: string, data: any, ttlMs = DEFAULT_TTL_MS): void => {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
};

const buildInvalidationPrefixes = (url: string): string[] => {
  const normalizedUrl = normalizeApiUrl(url).split("?")[0] || "/";
  const segments = normalizedUrl.split("/").filter(Boolean);
  const prefixes = new Set<string>([normalizedUrl]);

  if (segments.length > 0) {
    prefixes.add(`/${segments[0]}`);
  }

  if (segments.length > 1) {
    prefixes.add(`/${segments[0]}/${segments[1]}`);
  }

  return Array.from(prefixes);
};

const invalidateCache = (urlPrefix: string): void => {
  const prefixes = buildInvalidationPrefixes(urlPrefix);
  for (const key of cache.keys()) {
    if (prefixes.some((prefix) => key.includes(`:${prefix}`))) cache.delete(key);
  }
};

export const useApi = () => {
  const config = useRuntimeConfig();
  const toast = useToast();
  const tokenCookie = useCookie<string | null>("token", { sameSite: "lax", path: "/" });
  const sessionCookie = useCookie<string | null>("sessionId", { sameSite: "lax", path: "/" });
  const roleCookie = useCookie<string | null>("auth_role", { sameSite: "lax", path: "/" });
  const user = useState<any>("user", () => null);
  const api = axios.create({
    baseURL: config.public.apiBaseUrl,
  });

  const clearExpiredSession = async (expiredToken: string): Promise<void> => {
    if (!process.client || handledExpiredToken === expiredToken) return;
    handledExpiredToken = expiredToken;

    localStorage.removeItem("token");
    localStorage.removeItem("sessionId");
    localStorage.removeItem("arsipku_active_profile");
    tokenCookie.value = null;
    sessionCookie.value = null;
    roleCookie.value = null;
    user.value = null;
    cache.clear();
    lastAuthCacheScope = "anonymous";

    toast.add({
      title: "Sesi Anda telah berakhir",
      description: "Silakan login kembali untuk melanjutkan.",
      color: "warning",
      icon: "i-lucide-log-in",
      duration: 6000,
    });
    await navigateTo("/", { replace: true });
  };

  const refreshAccessToken = (): Promise<string | null> => {
    if (!process.client) return Promise.resolve(null);
    if (refreshTokenRequest) return refreshTokenRequest;

    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) return Promise.resolve(null);

    refreshTokenRequest = axios
      .post(
        "/auth/refresh-token",
        { sessionId },
        { baseURL: String(config.public.apiBaseUrl || "") }
      )
      .then((response) => {
        const newToken = response.data?.data?.accessToken;
        if (!newToken) return null;
        localStorage.setItem("token", newToken);
        tokenCookie.value = newToken;
        handledExpiredToken = null;
        cache.clear();
        return String(newToken);
      })
      .catch(() => null)
      .finally(() => {
        refreshTokenRequest = null;
      });

    return refreshTokenRequest;
  };

  api.interceptors.request.use((config) => {
    const token = process.client ? localStorage.getItem("token") : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // JIKA FormData → JANGAN SET CONTENT-TYPE
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers?.["Content-Type"];
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const originalConfig = error?.config as
        | (AxiosRequestConfig & { _authRetry?: boolean })
        | undefined;
      const requestUrl = String(originalConfig?.url ?? "");
      const currentToken = process.client ? localStorage.getItem("token") : null;
      const isRefreshRequest = requestUrl.includes("/auth/refresh-token");
      const requestAuthHeader = getHeaderValue(originalConfig?.headers, "Authorization");
      const requestToken = requestAuthHeader?.startsWith("Bearer ")
        ? requestAuthHeader.slice(7)
        : requestAuthHeader;

      if (process.client && status === 401 && currentToken) {
        if (!isRefreshRequest && originalConfig && !originalConfig._authRetry) {
          originalConfig._authRetry = true;
          // Respons lama bisa tiba setelah request lain selesai memperbarui token.
          // Ulangi dengan token terbaru tanpa memulai refresh kedua.
          if (requestToken && requestToken !== currentToken) {
            originalConfig.headers = originalConfig.headers || {};
            (originalConfig.headers as any).Authorization = `Bearer ${currentToken}`;
            return api.request(originalConfig);
          }
          const newToken = await refreshAccessToken();
          if (newToken) {
            originalConfig.headers = originalConfig.headers || {};
            (originalConfig.headers as any).Authorization = `Bearer ${newToken}`;
            return api.request(originalConfig);
          }
        }

        await clearExpiredSession(currentToken);
      }

      // Silent: tidak ada toast untuk 403 (AccessDenied component handle di page)
      // dan tidak ada toast untuk 404 (endpoint tidak ditemukan)
      return Promise.reject(error);
    }
  );

  const apiGet = async <T = any>(
    url: string,
    axiosConfig: AxiosRequestConfig = {},
    options: ApiGetOptions = {}
  ): Promise<T> => {
    const baseUrl = api.defaults.baseURL || "";
    const fullUrl = `${baseUrl}${url}`;
    const cacheKey = buildCacheKey(url, axiosConfig, getAuthCacheScope(axiosConfig));
    const skipCache = shouldBypassCache(url, options);

    if (!skipCache) {
      const cached = getCached<T>(cacheKey);
      if (cached !== undefined) {
        if (isDev) console.log("[api] GET cache hit ->", fullUrl);
        return cached;
      }
    }

    try {
      if (isDev) console.log("[api] GET ->", fullUrl, redactLogValue(axiosConfig));
      const res = await api.get(url, axiosConfig);
      if (isDev) console.log("[api] GET response <-", fullUrl, res.status);
      if (!skipCache) setCached(cacheKey, res.data, options.ttlMs);
      return res.data;
    } catch (err) {
      if (isDev) console.error("[api] GET error ->", url, err);
      throw err;
    }
  };

  const apiGetFresh = async <T = any>(
    url: string,
    axiosConfig: AxiosRequestConfig = {}
  ): Promise<T> => apiGet<T>(url, axiosConfig, { skipCache: true });

  const apiPost = async <T = any>(url: string, data?: any, axiosConfig: AxiosRequestConfig = {}): Promise<T> => {
    try {
      const fullUrl = `${api.defaults.baseURL || ""}${url}`;
      if (isDev) console.log("[api] POST ->", fullUrl, redactLogValue(data));
      const res = await api.post(url, data, axiosConfig);
      if (isDev) console.log("[api] POST response <-", fullUrl, res.status);
      invalidateCache(url.split("?")[0]);
      return res.data;
    } catch (err) {
      if (isDev) console.error("[api] POST error ->", url, err);
      throw err;
    }
  };

  const apiPut = async <T = any>(url: string, data?: any, axiosConfig: AxiosRequestConfig = {}): Promise<T> => {
    try {
      const fullUrl = `${api.defaults.baseURL || ""}${url}`;
      if (isDev) console.log("[api] PUT ->", fullUrl, redactLogValue(data));
      const res = await api.put(url, data, axiosConfig);
      if (isDev) console.log("[api] PUT response <-", fullUrl, res.status);
      invalidateCache(url.split("?")[0]);
      return res.data;
    } catch (err) {
      if (isDev) console.error("[api] PUT error ->", url, err);
      throw err;
    }
  };

  const apiPatch = async <T = any>(url: string, data?: any, axiosConfig: AxiosRequestConfig = {}): Promise<T> => {
    try {
      const fullUrl = `${api.defaults.baseURL || ""}${url}`;
      if (isDev) console.log("[api] PATCH ->", fullUrl, redactLogValue(data));
      const res = await api.patch(url, data, axiosConfig);
      if (isDev) console.log("[api] PATCH response <-", fullUrl, res.status);
      invalidateCache(url.split("?")[0]);
      return res.data as T;
    } catch (err) {
      if (isDev) console.error("[api] PATCH error ->", url, err);
      throw err;
    }
  };

  const apiDelete = async <T = any>(url: string): Promise<T> => {
    const res = await api.delete(url);
    invalidateCache(url.split("?")[0]);
    return res.data;
  };

  const clearApiCache = (): void => {
    cache.clear();
  };

  return {
    apiGet,
    apiPost,
    apiPut,
    apiPatch,
    apiDelete,
    get: apiGet,
    getFresh: apiGetFresh,
    apiGetFresh,
    post: apiPost,
    put: apiPut,
    patch: apiPatch,
    del: apiDelete,
    api,
    clearApiCache,
  };
};
