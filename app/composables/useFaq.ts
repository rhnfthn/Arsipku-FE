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
  kategori: string | { id: string; nama: string }
  kategori_id?: string
  puas: number
  tidak_puas: number
  created_at: string
  updated_at: string
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
  const kategoriNama = typeof kat === 'string' ? kat : (kat?.nama ?? '')
  const kategoriId = typeof kat === 'object' ? kat?.id : raw.kategori_id
  return {
    id: raw.id,
    pertanyaan: raw.pertanyaan,
    deskripsi: raw.deskripsi,
    kategori: kategoriNama,
    kategoriId,
    puas: raw.puas,
    tidakPuas: raw.tidak_puas,
    updatedAt: raw.updated_at,
  }
}

export const useFaq = () => {
  const { apiGet, apiPost, apiPatch, apiDelete } = useApi()

  const faqs = ref<Faq[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── GET ALL ──────────────────────────────────────────────────
  const fetchFaqs = async (options?: { kategoriId?: string; search?: string }) => {
    loading.value = true
    error.value = null
    try {
      const query: Record<string, string> = {}
      if (options?.kategoriId) query.kategoriId = options.kategoriId
      if (options?.search) query.search = options.search
      const res = await apiGet<FaqApiResponse>('/faq', Object.keys(query).length ? { params: query } : {})
      faqs.value = res.data.map(mapFaq)
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
      const res = await apiGet<KategoriApiResponse>('/faq-kategori')
      const raw = res.data
      if (!Array.isArray(raw) || raw.length === 0) return []
      if (typeof raw[0] === 'string') {
        // Fallback: plain string array, no IDs available
        return (raw as string[]).map((nama, i) => ({ id: String(i), nama }))
      }
      return (raw as Array<{ id: string; nama: string; deskripsi?: string }>).map((item) => ({
        id: item.id,
        nama: item.nama,
        deskripsi: item.deskripsi,
      }))
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
  const votePuas = async (id: string): Promise<void> => {
    await apiPost(`/faq/${id}/puas`)
  }

  // ── VOTE TIDAK PUAS ───────────────────────────────────────────
  const voteTidakPuas = async (id: string): Promise<void> => {
    await apiPost(`/faq/${id}/tidak-puas`)
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