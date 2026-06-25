export interface Faq {
  id: string
  pertanyaan: string
  deskripsi: string
  kategori: string
  kategoriId?: string
  updatedAt: string
  puas: number
  tidakPuas: number
}

export interface FaqPayload {
  pertanyaan: string
  deskripsi: string
  kategoriId: string
}

export interface FaqKategori {
  id: string
  nama: string
  deskripsi?: string
}

// ── Raw shape dari API (snake_case) ───────────────────────────
interface FaqRaw {
  id: string
  pertanyaan: string
  deskripsi: string
  kategori: string | { id?: string | number; nama?: string; name?: string }
  kategori_id?: string
  kategoriId?: string | number
  id_kategori?: string | number
  kategoriNama?: string
  kategori_nama?: string
  puas?: number
  tidak_puas?: number
  tidakPuas?: number
  created_at: string
  updated_at?: string
  updatedAt?: string
}

// ── Response wrapper dari API ─────────────────────────────────
interface FaqApiResponse {
  success: boolean
  message: string
  data: FaqRaw[]
}

// ── Response wrapper untuk endpoint /faq-kategori ─────────────
interface KategoriApiResponse {
  success: boolean
  message: string
  data: Array<{ id: string; nama: string; deskripsi?: string }> | string[]
}

// ── Helper mapper snake_case → camelCase ──────────────────────
const mapFaq = (raw: FaqRaw): Faq => {
  const kat = raw.kategori
  const kategoriNama =
    typeof kat === 'string'
      ? kat
      : (
          kat?.nama ??
          kat?.name ??
          raw.kategoriNama ??
          raw.kategori_nama ??
          (raw as any).nama_kategori ??
          (raw as any).category_name ??
          ''
        )
  const kategoriIdRaw =
    typeof kat === 'object'
      ? kat?.id
      : raw.kategori_id ?? raw.kategoriId ?? raw.id_kategori ?? (raw as any).category_id
  const kategoriId = kategoriIdRaw != null ? String(kategoriIdRaw) : undefined
  return {
    id: raw.id,
    pertanyaan: raw.pertanyaan,
    deskripsi: raw.deskripsi,
    kategori: kategoriNama,
    kategoriId,
    puas: Number(raw.puas ?? (raw as any).puas_count ?? 0),
    tidakPuas: Number(raw.tidak_puas ?? raw.tidakPuas ?? (raw as any).tidak_puas_count ?? 0),
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
  }
}

export const useFaq = () => {
  const { apiGet, apiPost, apiPatch, apiDelete } = useApi()

  const faqs = ref<Faq[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const extractArray = (res: any): any[] => {
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.data?.data)) return res.data.data
    if (Array.isArray(res?.data?.items)) return res.data.items
    if (Array.isArray(res?.items)) return res.items
    if (Array.isArray(res?.result)) return res.result
    if (Array.isArray(res?.data?.result)) return res.data.result
    return []
  }

  const pickCategoryRows = (res: any): any[] => {
    const direct = extractArray(res)
    if (direct.length > 0) return direct

    const bag = [res, res?.data, res?.data?.data, res?.result, res?.payload]
    for (const src of bag) {
      if (!src || typeof src !== 'object') continue
      const candidates = [
        (src as any).kategori,
        (src as any).categories,
        (src as any).category,
        (src as any).rows,
        (src as any).items,
        (src as any).list
      ]
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate
      }
    }

    return []
  }

  // ── GET ALL ──────────────────────────────────────────────────
  const fetchFaqs = async (options?: { kategoriId?: string; search?: string }) => {
    loading.value = true
    error.value = null
    try {
      const query: Record<string, string> = {}
      if (options?.kategoriId) query.kategoriId = options.kategoriId
      if (options?.search) query.search = options.search
      const res = await apiGet<FaqApiResponse | { data?: any[] } | any[]>('/faq',
        Object.keys(query).length ? { params: query } : {}, { skipCache: true }
      )
      const list = extractArray(res)
      faqs.value = list.map(mapFaq)
    } catch (err) {
      error.value = 'Gagal memuat data FAQ'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // ── GET ALL CATEGORIES from dedicated endpoint ───────────────
  const fetchCategories = async (): Promise<FaqKategori[]> => {
    try {
      const res = await apiGet<KategoriApiResponse | any[]>('/faq-kategori', {}, { skipCache: true })
      const raw = pickCategoryRows(res)
      if (!Array.isArray(raw) || raw.length === 0) return []
      if (typeof raw[0] === 'string') {
        // Fallback: plain string array, no IDs available
        return (raw as string[]).map((nama, i) => ({ id: String(i), nama }))
      }
      return (raw as Array<{
        id?: string | number
        kategori_id?: string | number
        id_kategori?: string | number
        nama?: string
        name?: string
        kategori?: string
        kategoriNama?: string
        kategori_nama?: string
        categoryName?: string
        deskripsi?: string
      }>).
        map((item, i) => ({
          id: item.id != null
            ? String(item.id)
            : item.kategori_id != null
              ? String(item.kategori_id)
              : item.id_kategori != null
                ? String(item.id_kategori)
                : String(i),
          nama:
            item.nama ||
            item.name ||
            item.kategori ||
            item.kategoriNama ||
            item.kategori_nama ||
            item.categoryName ||
            '',
          deskripsi: item.deskripsi,
        })).filter((item) => item.nama)
    } catch {
      return []
    }
  }

  // ── CREATE KATEGORI ───────────────────────────────────────────
  const createKategori = async (payload: { nama: string; deskripsi?: string }): Promise<FaqKategori> => {
    const res = await apiPost<any>('/faq-kategori', payload)
    const data = res?.data ?? res
    return { id: data?.id ?? '', nama: payload.nama, deskripsi: payload.deskripsi }
  }

  // ── Helper to extract a single FaqRaw from various possible response shapes
  const extractRawFaq = (res: any): FaqRaw | null => {
    if (!res) return null
    // If API wrapper with `data`
    if (res && typeof res === 'object' && 'data' in res) {
      const d = res.data
      if (Array.isArray(d)) return (d[0] as FaqRaw) || null
      if (d && typeof d === 'object') return d as FaqRaw
    }
    // If response is array directly
    if (Array.isArray(res)) return (res[0] as FaqRaw) || null
    // If response is object representing the created/updated item
    if (res && typeof res === 'object') return res as FaqRaw
    return null
  }

  // ── CREATE ───────────────────────────────────────────────────
  const createFaq = async (payload: FaqPayload): Promise<Faq> => {
    const res = await apiPost<any>('/faq', payload)
    const raw = extractRawFaq(res)
    if (!raw) throw new Error('Unexpected response shape from create FAQ')
    return mapFaq(raw)
  }

  // ── UPDATE (PATCH) ───────────────────────────────────────────
  const updateFaq = async (id: string, payload: Partial<FaqPayload>): Promise<Faq> => {
    const res = await apiPatch<any>(`/faq/${id}`, payload)
    const raw = extractRawFaq(res)
    if (!raw) throw new Error('Unexpected response shape from update FAQ')
    return mapFaq(raw)
  }

  // ── DELETE ───────────────────────────────────────────────────
  const deleteFaq = async (id: string): Promise<void> => {
    await apiDelete(`/faq/${id}`)
  }

  // ── DELETE KATEGORI ───────────────────────────────────────────
  const deleteKategori = async (id: string): Promise<void> => {
    await apiDelete(`/faq-kategori/${id}`)
  }

  // ── VOTE PUAS ─────────────────────────────────────────────────
  const votePuas = async (id: string): Promise<Faq> => {
    const res = await apiPost<any>(`/faq/${id}/puas`, {})
    const raw = extractRawFaq(res)
    if (!raw) throw new Error('Unexpected response shape from vote puas')
    return mapFaq(raw)
  }

  // ── VOTE TIDAK PUAS ───────────────────────────────────────────
  const voteTidakPuas = async (id: string): Promise<Faq> => {
    const res = await apiPost<any>(`/faq/${id}/tidak-puas`, {})
    const raw = extractRawFaq(res)
    if (!raw) throw new Error('Unexpected response shape from vote tidak puas')
    return mapFaq(raw)
  }

  return {
    faqs,
    loading,
    error,
    fetchFaqs,
    fetchCategories,
    createFaq,
    updateFaq,
    deleteFaq,
    votePuas,
    voteTidakPuas,
    createKategori,
    deleteKategori,
  }
}
