import axios from 'axios'
import type { AxiosInstance } from 'axios'

export const useApi = () => {
  const config = useRuntimeConfig()
  const api = axios.create({
    baseURL: config.public.apiBaseUrl,
    headers: { 'Content-Type': 'application/json' }
  })

  // ⬇️ Tambahkan ini
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })


const apiGet = async <T = any>(url: string, config: any = {}): Promise<T> => {
  try {
    const fullUrl = `${api.defaults.baseURL}${url}`
    console.log('[api] GET ->', fullUrl, config)
    const res = await api.get(url, config)
    console.log('[api] GET response <-', fullUrl, res.status, res.data)
    return res.data
  } catch (err) {
    console.error('[api] GET error ->', url, err)
    throw err
  }
}


  const apiPost = async <T = any>(url: string, data?: any): Promise<T> => {
    try {
      const fullUrl = `${(api.defaults.baseURL || '')}${url}`
      console.log('[api] POST ->', fullUrl, data)
      const res = await api.post(url, data)
      console.log('[api] POST response <-', fullUrl, res.status, res.data)
      return res.data
    } catch (err) {
      console.error('[api] POST error ->', url, err)
      throw err
    }
  }

  const apiPut = async <T = any>(url: string, data?: any): Promise<T> => {
    try {
      const fullUrl = `${(api.defaults.baseURL || '')}${url}`
      console.log('[api] PUT ->', fullUrl, data)
      const res = await api.put(url, data)
      console.log('[api] PUT response <-', fullUrl, res.status, res.data)
      return res.data
    } catch (err) {
      console.error('[api] PUT error ->', url, err)
      throw err
    }
  }

  const apiPatch = async <T = any>(url: string, data?: any): Promise<T> => {
    try {
      const fullUrl = `${(api.defaults.baseURL || '')}${url}`
      console.log('[api] PATCH ->', fullUrl, data)
      const res = await api.patch(url, data)
      console.log('[api] PATCH response <-', fullUrl, res.status, res.data)
      return res.data as T
    } catch (err) {
      console.error('[api] PATCH error ->', url, err)
      throw err
    }
  }

  const apiDelete = async <T = any>(url: string): Promise<T> => {
    const res = await api.delete(url)
    return res.data
  }

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
    api
  }
}
