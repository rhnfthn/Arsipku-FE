  import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";

const isDev = process.dev;

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 100;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 menit

const buildCacheKey = (url: string, config?: AxiosRequestConfig): string => {
  const params = config?.params ? JSON.stringify(config.params) : "";
  return `${url}?${params}`;
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

const invalidateCache = (urlPrefix: string): void => {
  for (const key of cache.keys()) {
    if (key.startsWith(urlPrefix)) cache.delete(key);
  }
};

export const useApi = () => {
  const config = useRuntimeConfig();
  const api = axios.create({
    baseURL: config.public.apiBaseUrl,
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // JIKA FormData → JANGAN SET CONTENT-TYPE
    if (config.data instanceof FormData) {
      delete config.headers?.["Content-Type"];
    }

    return config;
  });

  const apiGet = async <T = any>(
    url: string,
    axiosConfig: AxiosRequestConfig = {},
    options: { ttlMs?: number; skipCache?: boolean } = {}
  ): Promise<T> => {
      const baseUrl = api.defaults.baseURL || "";
      const fullUrl = `${baseUrl}${url}`;
      const cacheKey = buildCacheKey(url, axiosConfig);

      if (!options.skipCache) {
        const cached = getCached<T>(cacheKey);
        if (cached !== undefined) {
          if (isDev) console.log("[api] GET cache hit ->", fullUrl);
          return cached;
        }
      }

      try {
        if (isDev) console.log("[api] GET ->", fullUrl, axiosConfig);
      const res = await api.get(url, axiosConfig);
      if (isDev) console.log("[api] GET response <-", fullUrl, res.status);
      setCached(cacheKey, res.data, options.ttlMs);
      return res.data;
    } catch (err) {
      if (isDev) console.error("[api] GET error ->", url, err);
      throw err;
    }
  };

  const apiPost = async <T = any>(url: string, data?: any, axiosConfig: AxiosRequestConfig = {}): Promise<T> => {
    try {
      const fullUrl = `${api.defaults.baseURL || ""}${url}`;
      if (isDev) console.log("[api] POST ->", fullUrl, data);
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
      if (isDev) console.log("[api] PUT ->", fullUrl, data);
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
      if (isDev) console.log("[api] PATCH ->", fullUrl, data);
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
    post: apiPost,
    put: apiPut,
    patch: apiPatch,
    del: apiDelete,
    api,
    clearApiCache,
  };
};
