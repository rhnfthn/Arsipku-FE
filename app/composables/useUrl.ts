export type ShortUrlItem = {
  id: number
  tanggal: string
  LUrl: string
  SUrl: string
  keterangan: string
  alias: string
  backhalf: string
  clicked: number
}

export type ShortUrlParams = {
  page: number
  size: number
  orderby: string
  sortby: 'asc' | 'desc'
  cari: string
}

export const useUrl = () => {
  const { apiPost, apiPut, api } = useApi()

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<ShortUrlItem[]>([])
  const total = ref(0)

  // ── FETCH LIST ────────────────────────────────────────────────
  const fetchShortUrls = async (params: ShortUrlParams) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiPost<{
        success: boolean
        data: {
          responStatus: number
          data: any[]
          totaldatawithfilter: number
          totaldata: number
        }
      }>('/short-url/data', params)

      if (response?.success && Array.isArray(response.data?.data)) {
        data.value = response.data.data.map((item) => ({
          id: item.id,
          tanggal: item.udate,
          LUrl: item.url,
          SUrl: item.short_url,
          keterangan: item.keterangan ?? '',
          alias: item.alias ?? '',
          backhalf: item.backhalf ?? '',
          clicked: item.clicked ?? 0,
        }))
        total.value =
          response.data.totaldatawithfilter ??
          response.data.totaldata ??
          data.value.length
      } else {
        data.value = []
        total.value = 0
      }
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? err?.message ?? 'Gagal memuat data'
      data.value = []
    } finally {
      isLoading.value = false
    }
  }

  // ── CREATE ────────────────────────────────────────────────────
  const createShortUrl = async (payload: { url: string; keterangan: string; alias: string }) => {
    return await apiPost('/short-url/submit', payload)
  }

  // ── UPDATE ────────────────────────────────────────────────────
  const updateShortUrl = async (payload: {
    id: number
    url: string
    keterangan: string
    alias: string
  }) => {
    return await apiPut('/short-url', payload)
  }

  // ── DELETE (with request body) ────────────────────────────────
  const deleteShortUrl = async (id: number) => {
    const response = await api.delete('/short-url', { data: { id } })
    return response.data
  }

  return {
    data,
    total,
    isLoading,
    error,
    fetchShortUrls,
    createShortUrl,
    updateShortUrl,
    deleteShortUrl,
  }
}
