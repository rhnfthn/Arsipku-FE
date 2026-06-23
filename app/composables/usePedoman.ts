export type PedomanJenis = 'Peraturan Direksi' | 'Keputusan Direksi' | 'SOP Kearsipan'

export const PEDOMAN_JENIS_OPTIONS: { label: string; value: PedomanJenis }[] = [
  { label: 'Peraturan Direksi', value: 'Peraturan Direksi' },
  { label: 'Keputusan Direksi', value: 'Keputusan Direksi' },
  { label: 'SOP Kearsipan', value: 'SOP Kearsipan' },
]

export interface Pedoman {
  id: string
  judul: string
  deskripsi: string
  jenis: PedomanJenis
  nomorDokumen: string
  tanggalBerlaku: string
  fileUrl?: string
  lampiranUrl?: string
  lampiranName?: string
  isActive: boolean
  created_at: string
  updated_at: string
}

export interface PedomanPayload {
  judul: string
  deskripsi: string
  jenis: PedomanJenis
  nomorDokumen: string
  tanggalBerlaku: string
  fileUrl?: string
  lampiranUrl?: string
  lampiranName?: string
  isActive?: boolean
}

// ── Raw shape dari API (snake_case / camelCase) ─────────────────
interface PedomanRaw {
  id: string
  judul: string
  deskripsi: string
  jenis: PedomanJenis
  nomorDokumen?: string
  nomor_dokumen?: string
  tanggalBerlaku?: string
  tanggal_berlaku?: string
  fileUrl?: string
  file_url?: string
  lampiranUrl?: string
  lampiran_url?: string
  lampiranName?: string
  lampiran_name?: string
  isActive?: boolean
  is_active?: boolean
  created_at: string
  updated_at?: string
  updatedAt?: string
}

interface PedomanApiResponse {
  success: boolean
  message: string
  data: PedomanRaw[] | PedomanRaw
}

const mapPedoman = (raw: PedomanRaw): Pedoman => ({
  id: raw.id,
  judul: raw.judul,
  deskripsi: raw.deskripsi,
  jenis: raw.jenis,
  nomorDokumen: raw.nomorDokumen ?? raw.nomor_dokumen ?? '',
  tanggalBerlaku: raw.tanggalBerlaku ?? raw.tanggal_berlaku ?? '',
  fileUrl: raw.fileUrl ?? raw.file_url,
  lampiranUrl: raw.lampiranUrl ?? raw.lampiran_url,
  lampiranName: raw.lampiranName ?? raw.lampiran_name,
  isActive: raw.isActive ?? raw.is_active ?? true,
  created_at: raw.created_at,
  updated_at: raw.updated_at ?? raw.updatedAt ?? raw.created_at,
})

const extractArray = (res: any): any[] => {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data?.items)) return res.data.items
  if (Array.isArray(res?.items)) return res.items
  return []
}

export const usePedoman = () => {
  const { apiGet, apiPost, apiPatch, apiDelete } = useApi()

  const pedomanList = ref<Pedoman[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── GET ALL ──────────────────────────────────────────────────
  const fetchPedoman = async (options?: {
    jenis?: string
    search?: string
    includeInactive?: boolean
  }) => {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, string> = {}
      if (options?.jenis) params.jenis = options.jenis
      if (options?.search) params.search = options.search
      if (options?.includeInactive) params.includeInactive = 'true'

      const res = await apiGet<PedomanApiResponse | any>('/pedoman',
        Object.keys(params).length ? { params } : {}
      )
      const list = extractArray(res)
      pedomanList.value = list.map(mapPedoman)
    } catch (err) {
      error.value = 'Gagal memuat data pedoman'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // ── GET BY ID ────────────────────────────────────────────────
  const fetchById = async (id: string): Promise<Pedoman | null> => {
    try {
      const res = await apiGet<PedomanApiResponse | any>(`/pedoman/${id}`)
      const raw = res?.data ?? res
      return mapPedoman(raw)
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // ── CREATE ───────────────────────────────────────────────────
  const createPedoman = async (payload: PedomanPayload): Promise<Pedoman | null> => {
    try {
      const res = await apiPost<PedomanApiResponse | any>('/pedoman', payload)
      const raw = res?.data ?? res
      return mapPedoman(raw)
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // ── UPDATE ───────────────────────────────────────────────────
  const updatePedoman = async (id: string, payload: Partial<PedomanPayload>): Promise<Pedoman | null> => {
    try {
      const res = await apiPatch<PedomanApiResponse | any>(`/pedoman/${id}`, payload)
      const raw = res?.data ?? res
      return mapPedoman(raw)
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // ── DELETE ───────────────────────────────────────────────────
  const deletePedoman = async (id: string): Promise<boolean> => {
    try {
      await apiDelete<PedomanApiResponse | any>(`/pedoman/${id}`)
      return true
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // ── UPLOAD LAMPIRAN ──────────────────────────────────────────
  const uploadLampiran = async (file: File): Promise<{
    lampiranUrl: string
    lampiranName: string
    previewUrl: string
  }> => {
    const formData = new FormData()
    formData.append('lampiran', file)

    const res = await apiPost<{ success: boolean; data: any }>('/pedoman/upload-lampiran', formData)
    return res.data
  }

  return {
    pedomanList,
    loading,
    error,
    fetchPedoman,
    fetchById,
    createPedoman,
    updatePedoman,
    deletePedoman,
    uploadLampiran,
  }
}