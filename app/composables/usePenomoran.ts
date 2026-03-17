// composables/usePenomoran.ts
import { ref, computed } from 'vue'
import { useApi } from './useApi'
import type { PenomoranPayload, PenomoranResponse } from '~/types/penomoran'

export const usePenomoran = () => {
  const { get, post, del, api } = useApi()
  const toast = useToast()

  const isLoadingPenomoran = ref(false)
  const isLoadingBooking = ref(false)
  const isLoadingList = ref(false)
  const isLoadingSubmitted = ref(false)

  // ✅ Reactive trigger untuk refetch
  const refreshTrigger = ref(0)

  // ✅ Method untuk trigger refetch
  const triggerRefresh = () => {
    refreshTrigger.value++
    console.log('🔄 Refresh triggered:', refreshTrigger.value)
  }

  /* ===========================
   * STATE - PISAHKAN ADMIN & USER
   * =========================== */
  const adminCounts = ref({
    menunggu_verifikasi: 0,
    disetujui: 0,
    ditolak: 0,
    belum_diajukan: 0,
    total: 0
  })

  const userCounts = ref({
    menunggu_verifikasi: 0,
    menunggu_persetujuan: 0,
    disetujui: 0,
    ditolak: 0,
    belum_diajukan: 0,
    total: 0
  })

  // Computed untuk backward compatibility
  const nomorCounts = computed(() => {
    const { user } = useAuth()
    const isAdmin = user.value?.role === 'admin' || user.value?.role === 'superadmin'

    console.log('📊 nomorCounts computed:', {
      role: user.value?.role,
      isAdmin,
      adminCounts: adminCounts.value,
      userCounts: userCounts.value,
      returning: isAdmin ? 'adminCounts' : 'userCounts'
    })

    return isAdmin ? adminCounts.value : userCounts.value
  })

  /* ===========================
   * GET COUNT (ADMIN)
   * endpoint: /admin/nomor-request-count
   * =========================== */
  const getNomorRequestCountAdmin = async () => {
    try {
      const { user } = useAuth()
      const positionId =
        typeof user.value?.position === 'object' ? user.value?.position?.id : user.value?.position

      if (!positionId) {
        console.warn('⚠️ positionId tidak tersedia untuk admin count')
        return adminCounts.value
      }

      const res = await get(`/admin/nomor-request-count/${positionId}`)
      if (res?.success && res?.data) {
        adminCounts.value = {
          menunggu_verifikasi: res.data.menunggu_verifikasi ?? 0,
          disetujui: res.data.disetujui ?? 0,
          ditolak: res.data.ditolak ?? 0,
          belum_diajukan: res.data.belum_diajukan ?? 0,
          total: res.data.total ?? 0
        }
      }
      return adminCounts.value
    } catch (e) {
      console.error('❌ Admin count error:', e)
      return adminCounts.value
    }
  }

  /* ===========================
   * GET COUNT (USER)
   * endpoint: /nomor-request-count/{{position_id}}
   * =========================== */
  const getNomorRequestCountUser = async (positionId: number | string) => {
    try {
      if (!positionId) {
        console.warn('⚠️ Position ID is empty, skipping user count fetch')
        return userCounts.value
      }

      const numericPositionId = Number(positionId)

      if (isNaN(numericPositionId) || numericPositionId <= 0) {
        console.error('❌ Invalid position ID:', positionId, 'Converted:', numericPositionId)
        return userCounts.value
      }

      console.log('📤 Fetching user counts for position:', numericPositionId)

      const endpoint = `/nomor-request-count/${numericPositionId}`
      const res = await get(endpoint)
      userCounts.value = res.data
      console.log('📥 User count response:', res)

      if (res?.success && res?.data) {
        userCounts.value = {
          position_id: res.data.position_id ?? numericPositionId,
          menunggu_verifikasi: res.data.menunggu_verifikasi ?? 0,
          menunggu_persetujuan: res.data.menunggu_persetujuan ?? 0,
          disetujui: res.data.disetujui ?? 0,
          ditolak: res.data.ditolak ?? 0,
          belum_diajukan: res.data.belum_diajukan ?? 0,
          total: res.data.total ?? 0
        }
      }

      return userCounts.value
    } catch (e: any) {
      console.error('❌ User count error:', e)

      if (e.response?.status !== 404) {
        toast.add({
          title: 'Gagal mengambil count',
          description: e.response?.data?.message || 'Silakan refresh halaman',
          color: 'error'
        })
      }

      return userCounts.value
    }
  }

  /* ===========================
   * HELPER UNIVERSAL
   * =========================== */
  const fetchNomorRequestCount = async (payload: {
    role: 'admin' | 'user'
    positionId?: number | string
  }) => {
    if (payload.role === 'admin') {
      return await getNomorRequestCountAdmin()
    }

    if (payload.role === 'user' && payload.positionId) {
      return await getNomorRequestCountUser(payload.positionId)
    }

    return nomorCounts.value
  }

  /** ===========================
   * CREATE PENOMORAN FINAL (ADMIN ONLY)
   * =========================== */
  const createPenomoranFinal = async (payload: PenomoranPayload): Promise<PenomoranResponse> => {
    isLoadingPenomoran.value = true

    try {
      if (!payload.tanggal) throw new Error('Tanggal tidak boleh kosong')

      const formattedPayload = {
        position_id: Number(payload.position_id),
        tanggal:
          payload.tanggal instanceof Date
            ? payload.tanggal.toISOString().split('T')[0]
            : String(payload.tanggal),
        jenis: String(payload.jenis),
        klasifikasi: String(payload.klasifikasi),
        perihal: String(payload.perihal),
        jumlah: Number(payload.jumlah),
        penandatangan: String(payload.penandatangan),
        id_position_penandatangan: Number(payload.id_position_penandatangan)
      }

      console.log('📤 POST to /admin/nomor:', formattedPayload)

      const response = await post('/admin/nomor', formattedPayload)

      console.log('✅ Response from /admin/nomor:', response)

      toast.add({
        title: 'Berhasil',
        description: response?.message || 'Penomoran final berhasil dibuat.',
        color: 'success'
      })

      // ✅ Trigger refetch setelah create berhasil
      triggerRefresh()

      return response
    } catch (error: any) {
      console.error('❌ Error create penomoran:', error)

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Gagal membuat penomoran'

      toast.add({
        title: 'Gagal',
        description: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
        color: 'error'
      })

      throw error
    } finally {
      isLoadingPenomoran.value = false
    }
  }

  /** ===========================
   * CREATE USULAN (DRAFT)
   * =========================== */
  const createUsulanDraft = async (payload: PenomoranPayload): Promise<PenomoranResponse> => {
    isLoadingPenomoran.value = true

    try {
      if (!payload.tanggal) throw new Error('Tanggal tidak boleh kosong')

      const formattedPayload = {
        position_id: Number(payload.position_id),
        tanggal: String(payload.tanggal),
        jenis: String(payload.jenis),
        klasifikasi: String(payload.klasifikasi),
        perihal: String(payload.perihal),
        penandatangan: String(payload.penandatangan),
        id_position_penandatangan: Number(payload.id_position_penandatangan),
        jumlah: Number(payload.jumlah)
      }

      const response = await post('/nomor-request', formattedPayload)

      toast.add({
        title: 'Berhasil',
        description: 'Usulan berhasil disimpan (Belum Diajukan).',
        color: 'success'
      })

      const { user } = useAuth()
      if (user.value?.position?.id) {
        await getNomorRequestCountUser(user.value.position.id)
      }

      return response.data ?? response
    } finally {
      isLoadingPenomoran.value = false
    }
  }

  /** ===========================
   * SUBMIT BOOKING WITH FILES (USER)
   * ✅ UPDATED: Support both user and admin endpoints
   * User endpoint: POST /nomor-request/:id_request/booking
   * Admin endpoint: POST /admin/nomor-request/:id_request/booking
   * =========================== */
  const submitBooking = async (
    id_request: string | number,
    formData: FormData,
    isAdmin: boolean = false
  ) => {
    isLoadingBooking.value = true

    try {
      console.log('📤 Submitting booking for request:', id_request)
      console.log('📍 Mode:', isAdmin ? 'Admin' : 'User')

      // Log FormData content
      console.log('📦 FormData content:')
      for (const pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`)
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`)
        }
      }

      // Determine endpoint based on role
      const endpoint = isAdmin
        ? `/admin/nomor-request/${id_request}/booking`
        : `/nomor-request/${id_request}/booking`

      console.log('📍 Using endpoint:', endpoint)

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('✅ Booking response:', response.data)

      toast.add({
        title: 'Berhasil',
        description:
          response.data?.message ||
          "Usulan berhasil dikirim. Status diperbarui menjadi 'Menunggu Verifikasi'.",
        color: 'success'
      })

      // Refresh count sesuai role
      const { user } = useAuth()
      if (isAdmin || user.value?.role === 'admin' || user.value?.role === 'superadmin') {
        await getNomorRequestCountAdmin()
      } else if (user.value?.position?.id) {
        await getNomorRequestCountUser(user.value.position.id)
      }

      return response.data
    } catch (error: any) {
      console.error('❌ Error submit booking:', error)
      console.error('❌ Error response:', error.response?.data)

      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Gagal mengirim usulan.'

      toast.add({
        title: 'Gagal',
        description: Array.isArray(msg) ? msg.join(', ') : msg,
        color: 'error'
      })

      throw error
    } finally {
      isLoadingBooking.value = false
    }
  }

  /** ===========================
   * SUBMIT BOOKING SINGLE FILE (USER) ← ✅ BARU
   * POST /nomor-request/:id_request/booking-single-file
   * 1 file dipakai untuk semua nomor dalam request
   * =========================== */
  const submitBookingSingleFile = async (id_request: string | number, file: File) => {
    isLoadingBooking.value = true

    try {
      console.log('📤 Submitting single-file booking for request:', id_request)
      console.log('📄 File:', file.name, file.size, 'bytes')

      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post(
        `/nomor-request/${id_request}/booking-single-file`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )

      console.log('✅ Single-file booking response:', response.data)

      toast.add({
        title: 'Berhasil',
        description:
          response.data?.message || 'Usulan berhasil dikirim dengan 1 file untuk semua nomor.',
        color: 'success'
      })

      const { user } = useAuth()
      if (user.value?.position?.id) {
        await getNomorRequestCountUser(user.value.position.id)
      }

      return response.data
    } catch (error: any) {
      console.error('❌ Error submit single-file booking:', error)
      console.error('❌ Error response:', error.response?.data)

      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Gagal mengirim usulan single file.'

      toast.add({
        title: 'Gagal',
        description: Array.isArray(msg) ? msg.join(', ') : msg,
        color: 'error'
      })

      throw error
    } finally {
      isLoadingBooking.value = false
    }
  }

  /** ===========================
   * GET DETAIL NOMOR BY ID (ADMIN)
   * =========================== */
  const getDetailNomor = async (id: string) => {
    try {
      const res = await get(`/nomor/${id}`)

      console.log('✅ Detail nomor loaded:', res)

      if (!res?.success) {
        throw new Error('Gagal mengambil detail nomor')
      }

      return res.data
    } catch (e: any) {
      console.error('❌ Error fetch detail nomor:', e)
      return null
    }
  }

  /** ===========================
   * GET LIST NOMOR (ADMIN)
   * ✅ UPDATED: Support backend pagination, search & sorting
   * endpoint: /nomor?search=&page=1&limit=10&sort_by=&sort_order=
   * =========================== */
  const getListNomor = async (params?: {
    search?: string
    page?: number
    limit?: number
    sort_by?: string
    sort_order?: string
  }) => {
    isLoadingList.value = true
    try {
      // Build query params sesuai dokumentasi API
      const queryParams = new URLSearchParams()
      if (params?.search) {
        queryParams.append('search', params.search)
      }
      if (params?.page) {
        queryParams.append('page', String(params.page))
      }
      if (params?.limit) {
        queryParams.append('limit', String(params.limit))
      }
      if (params?.sort_by) {
        queryParams.append('sort_by', params.sort_by)
      }
      if (params?.sort_order) {
        queryParams.append('sort_order', params.sort_order)
      }

      const queryString = queryParams.toString()
      const endpoint = `/nomor${queryString ? `?${queryString}` : ''}`

      console.log('📤 Fetching nomor data with params:', params)
      console.log('📍 Full endpoint:', endpoint)

      const res = await get(endpoint)
      console.log('✅ Nomor data received:', res)

      return {
        data: res.data ?? [],
        pagination: res.pagination ?? null
      }
    } catch (e: any) {
      console.error('❌ Error ambil list nomor:', e)
      toast.add({
        title: 'Gagal fetch data',
        description: e.message || 'Gagal mengambil daftar nomor',
        color: 'error'
      })
      return { data: [], pagination: null }
    } finally {
      isLoadingList.value = false
    }
  }

  /** ===========================
   * GET LIST USULAN (USER - by position)
   * =========================== */
  const getListUsulanByPosition = async (
    positionId: string | number,
    params?: {
      search?: string
      page?: number
      limit?: number
      status?: string
      sort_by?: string
      sort_order?: string
    }
  ) => {
    isLoadingList.value = true
    try {
      const queryParams = new URLSearchParams()
      if (params?.search) queryParams.append('search', params.search)
      if (params?.page) queryParams.append('page', String(params.page))
      if (params?.limit) queryParams.append('limit', String(params.limit))
      if (params?.status && params.status !== 'Semua') queryParams.append('status', params.status)
      if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params?.sort_order) queryParams.append('sort_order', params.sort_order)

      const queryString = queryParams.toString()
      const endpoint = `/nomor-request/${positionId}${queryString ? `?${queryString}` : ''}`

      console.log('📤 Fetching usulan for position:', positionId, 'with params:', params)

      const res = await get(endpoint)
      console.log('✅ Usulan data received:', res)

      return {
        data: res.data ?? [],
        pagination: res.pagination ?? null
      }
    } catch (e: any) {
      console.error('❌ Error ambil list usulan:', e)
      toast.add({
        title: 'Gagal fetch data',
        description: e.message || 'Gagal mengambil daftar usulan',
        color: 'error'
      })
      return { data: [], pagination: null }
    } finally {
      isLoadingList.value = false
    }
  }

  /** ===========================
   * GET LIST USULAN (ADMIN - by position ID)
   * ✅ FIXED: Support backend pagination, search, filter & sorting dengan parameter yang benar
   * endpoint: /admin/nomor-request-by-position/{{position_id}}?search=&page=1&limit=15&status=&sort_by=&sort_order=
   * =========================== */
  const getListUsulan = async (
    positionId: string | number,
    params?: {
      search?: string
      page?: number
      limit?: number
      status?: string
      sort_by?: string
      sort_order?: string
    }
  ) => {
    isLoadingList.value = true
    try {
      if (!positionId) {
        console.error('❌ Position ID is required')
        return { data: [], pagination: null }
      }

      // Build query params sesuai dokumentasi API
      const queryParams = new URLSearchParams()
      if (params?.search) {
        queryParams.append('search', params.search)
      }
      if (params?.page) {
        queryParams.append('page', String(params.page))
      }
      if (params?.limit) {
        queryParams.append('limit', String(params.limit))
      }
      if (params?.status && params.status !== 'Semua') {
        queryParams.append('status', params.status)
      }
      // ✅ FIX: Gunakan sort_by dan sort_order, BUKAN sortBy
      if (params?.sort_by) {
        queryParams.append('sort_by', params.sort_by)
      }
      if (params?.sort_order) {
        queryParams.append('sort_order', params.sort_order)
      }

      const queryString = queryParams.toString()
      const endpoint = `/admin/nomor-request-by-position/${positionId}${queryString ? `?${queryString}` : ''}`

      console.log('📤 Fetching usulan for position (admin):', positionId, 'with params:', params)
      console.log('📍 Full endpoint:', endpoint)

      const res = await get(endpoint)
      console.log('✅ Admin usulan data received:', res)

      return {
        data: res.data ?? [],
        pagination: res.pagination ?? null
      }
    } catch (e: any) {
      console.error('❌ Error ambil list usulan (admin):', e)
      toast.add({
        title: 'Gagal fetch data',
        description: e.message || 'Gagal mengambil daftar usulan',
        color: 'error'
      })
      return { data: [], pagination: null }
    } finally {
      isLoadingList.value = false
    }
  }

  /** ===========================
   * GET DETAIL USULAN (ADMIN)
   * =========================== */
  const getDetailUsulan = async (id?: string) => {
    if (!id) {
      console.error('❌ getDetailUsulan dipanggil tanpa ID')
      return null
    }

    try {
      console.log('📤 GET DETAIL ID:', id)

      const res = await get(`/admin/nomor-request/${id}`)

      console.log('📥 RAW RESPONSE:', res)

      const data = res?.data

      if (Array.isArray(data)) {
        throw new Error('Endpoint mengembalikan LIST, bukan DETAIL')
      }

      return data
    } catch (e: any) {
      console.error('❌ Error in getDetailUsulan:', e)

      toast.add({
        title: 'Gagal fetch detail',
        description: e.message || 'Gagal memuat detail usulan',
        color: 'error'
      })

      return null
    }
  }

  /** ===========================
   * GET KLASIFIKASI
   * =========================== */
  const getKlasifikasi = async () => {
    try {
      const res = await get('/persuratan/klasifikasi')

      const rawData = res.data ?? res
      const dataArray = Array.isArray(rawData) ? rawData : (rawData.data ?? [])

      return dataArray.map((item: any) => ({
        code: item.klasifikasi,
        text: item.klasifikasi_text,
        display: `${item.klasifikasi} - ${item.klasifikasi_text}`,
        id: item.id
      }))
    } catch (e: any) {
      console.error('❌ Error fetch klasifikasi:', e)
      toast.add({
        title: 'Gagal fetch klasifikasi',
        description: e.message || 'Gagal mengambil klasifikasi',
        color: 'error'
      })
      return []
    }
  }

  /** ===========================
   * GET LIST SUBMITTED (ADMIN)
   * ✅ UPDATED: Support backend pagination, search, filter & sorting
   * endpoint: /admin/nomor-request-submitted?search=&page=1&limit=10&status=&sort_by=&sort_order=
   * =========================== */
  const getListSubmitted = async (params?: {
    search?: string
    page?: number
    limit?: number
    status?: string
    sort_by?: string
    sort_order?: string
  }) => {
    isLoadingSubmitted.value = true
    try {
      // Build query params sesuai dokumentasi API
      const queryParams = new URLSearchParams()
      if (params?.search) {
        queryParams.append('search', params.search)
      }
      if (params?.page) {
        queryParams.append('page', String(params.page))
      }
      if (params?.limit) {
        queryParams.append('limit', String(params.limit))
      }
      if (params?.status && params.status !== 'Semua') {
        queryParams.append('status', params.status)
      }
      if (params?.sort_by) {
        queryParams.append('sort_by', params.sort_by)
      }
      if (params?.sort_order) {
        queryParams.append('sort_order', params.sort_order)
      }

      const queryString = queryParams.toString()
      const endpoint = `/admin/nomor-request-submitted${queryString ? `?${queryString}` : ''}`

      console.log('📤 Fetching submitted data with params:', params)
      console.log('📍 Full endpoint:', endpoint)

      const res = await get(endpoint)
      console.log('✅ Submitted data received:', res)

      return {
        data: res.data ?? [],
        pagination: res.pagination ?? null
      }
    } catch (e: any) {
      console.error('❌ Error ambil list submitted:', e)
      toast.add({
        title: 'Gagal fetch submitted',
        description: e.message || 'Gagal mengambil data submitted',
        color: 'error'
      })
      return { data: [], pagination: null }
    } finally {
      isLoadingSubmitted.value = false
    }
  }

  /** ===========================
   * GET PERSON WITH POSITION
   * =========================== */
  const getPersonWithPosition = async () => {
    try {
      const res = await get('/person/with-position/all')
      return res.data ?? []
    } catch (e: any) {
      console.error('❌ Error fetch person with position:', e)
      toast.add({
        title: 'Gagal fetch person',
        description: e.message || 'Gagal mengambil data person',
        color: 'error'
      })
      return []
    }
  }

  /** ===========================
   * DELETE USULAN (USER - delete by ID)
   * =========================== */
  const deleteUsulanUser = async (id: string) => {
    try {
      const res = await del(`/admin/nomor-request/${id}`)

      console.log('✅ Delete response:', res)

      toast.add({
        title: 'Berhasil',
        description: res?.data?.message || res?.message || 'Usulan berhasil dihapus',
        color: 'error'
      })

      const { user } = useAuth()
      if (user.value?.position?.id) {
        await getNomorRequestCountUser(user.value.position.id)
      }

      return res.data ?? res
    } catch (e: any) {
      console.error('❌ Error delete usulan:', e)

      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        'Gagal menghapus usulan'

      toast.add({
        title: 'Gagal',
        description: errorMsg,
        color: 'error'
      })

      throw e
    }
  }

  /** ===========================
   * DELETE USULAN (ADMIN)
   * =========================== */
  const deleteUsulan = async (id: string) => {
    try {
      const res = await del(`/admin/nomor-request/${id}`)

      console.log('✅ Delete response:', res)

      toast.add({
        title: 'Berhasil',
        description: res?.data?.message || 'Usulan berhasil dihapus',
        color: 'error'
      })

      await getNomorRequestCountAdmin()

      return res.data ?? res
    } catch (e: any) {
      console.error('❌ Error delete usulan:', e)

      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        'Gagal menghapus usulan'

      toast.add({
        title: 'Gagal',
        description: errorMsg,
        color: 'error'
      })

      throw e
    }
  }

  /** ===========================
   * DELETE NOMOR (ADMIN)
   * =========================== */
  const deleteNomor = async (id: string) => {
    try {
      const res = await del(`/admin/nomor/${id}`)

      console.log('✅ Delete nomor response:', res)

      toast.add({
        title: 'Berhasil',
        description: res?.data?.message || 'Nomor berhasil dihapus',
        color: 'error'
      })

      return res.data ?? res
    } catch (e: any) {
      console.error('❌ Error delete nomor:', e)

      const errorMsg =
        e.response?.data?.message || e.response?.data?.error || e.message || 'Gagal menghapus nomor'

      toast.add({
        title: 'Gagal',
        description: errorMsg,
        color: 'error'
      })

      throw e
    }
  }

  /** ===========================
   * APPROVE BULK NOMOR (ADMIN)
   * =========================== */
  const approveBulkNomor = async (detailIds: string[]) => {
    try {
      if (!detailIds || detailIds.length === 0) {
        throw new Error('Detail IDs tidak boleh kosong')
      }

      const validIds = detailIds.filter((id) => id !== null && id !== undefined && id !== '')

      if (validIds.length === 0) {
        throw new Error('Tidak ada detail ID yang valid')
      }

      const response = await post('/admin/nomor-request-detail/approve-bulk', {
        detail_ids: validIds
      })

      await getNomorRequestCountAdmin()

      return response
    } catch (e: any) {
      console.error('❌ Error approve bulk:', e)

      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        'Gagal menyetujui nomor'

      toast.add({
        title: 'Gagal',
        description: errorMsg,
        color: 'error'
      })

      throw e
    }
  }

  /** ===========================
   * REJECT NOMOR REQUEST (ADMIN)
   * =========================== */
  const rejectNomorRequest = async (requestId: string, detailIds: string[], keterangan: string) => {
    try {
      if (!requestId) {
        throw new Error('Request ID tidak boleh kosong')
      }

      if (!keterangan || !keterangan.trim()) {
        throw new Error('Keterangan penolakan harus diisi')
      }

      console.log('📤 Reject nomor request:', {
        requestId,
        detailIds,
        keterangan
      })

      const response = await post(`/admin/nomor-request/${requestId}/reject-nomor`, {
        detail_ids: detailIds,
        keterangan: keterangan
      })

      console.log('✅ Reject response:', response)

      toast.add({
        title: 'Berhasil',
        description: response?.message || 'Nomor berhasil ditolak',
        color: 'error'
      })

      await getNomorRequestCountAdmin()

      return response
    } catch (e: any) {
      console.error('❌ Error reject nomor:', e)

      const errorMsg =
        e.response?.data?.message || e.response?.data?.error || e.message || 'Gagal menolak nomor'
      toast.add({ title: 'Gagal', description: errorMsg, color: 'error' })

      throw e
    }
  }

  /** ===========================
   * GET DETAIL VERIFIKASI REQUEST (ADMIN)
   * =========================== */
  const getDetailVerifikasiRequest = async (requestId: string) => {
    try {
      const mainRes = await get(`/admin/nomor-request/${requestId}`)

      if (!mainRes?.success) {
        toast.add({
          title: 'Gagal',
          description: 'Tidak dapat mengambil detail usulan',
          color: 'error'
        })
        return null
      }

      const mainData = mainRes.data

      const detailRes = await get(`/admin/detail-nomor-request/${requestId}`)
      const existingDetails = detailRes?.success ? detailRes.data?.details || [] : []

      const jumlah = mainData.jumlah || 0
      const template_nomor = mainData.template_nomor || null

      let details = []

      if (existingDetails.length > 0) {
        details = existingDetails.slice(0, jumlah).map((d: any) => ({
          id: d.id,
          nomor: d.nomor || null,
          template_nomor: template_nomor,
          status: d.status || 'booking',
          checked: d.status !== 'ditolak' && d.status !== 'hangus',
          file_name: d.file_name || null,
          file_text: d.file_text || null,
          file_url: d.file_url || null
        }))

        const remaining = jumlah - details.length
        for (let i = 0; i < remaining; i++) {
          details.push({
            id: null,
            nomor: null,
            template_nomor: template_nomor,
            status: 'pending',
            checked: true,
            file_name: null,
            file_text: null,
            file_url: null
          })
        }
      } else {
        for (let i = 0; i < jumlah; i++) {
          details.push({
            id: null,
            nomor: null,
            template_nomor: template_nomor,
            status: 'pending',
            checked: true,
            file_name: null,
            file_text: null,
            file_url: null
          })
        }
      }

      return {
        ...mainData,
        jumlah: jumlah,
        details: details
      }
    } catch (error) {
      console.error('❌ Error fetch detail verifikasi:', error)
      toast.add({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat mengambil detail',
        color: 'error'
      })
      return null
    }
  }

  /** ===========================
   * UPLOAD DETAIL FILE (ADMIN)
   * ✅ UPDATED: Support uploading/replacing files regardless of status + trigger refetch
   * Endpoint: POST /admin/nomor-request-detail/:detail_id/file
   * =========================== */
  const uploadDetailFile = async (detailId: string, file: File) => {
    try {
      console.log('📤 Uploading file for detail ID:', detailId)
      console.log('📄 File:', file.name, file.size, 'bytes')

      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post(`/admin/nomor-request-detail/${detailId}/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('✅ Upload response:', response.data)

      if (response.data?.success) {
        toast.add({
          title: 'Berhasil',
          description: response.data?.message || 'File berhasil diupload, status menjadi final',
          color: 'success'
        })

        // ✅ Trigger refetch setelah upload berhasil
        triggerRefresh()

        return response.data.data
      }

      throw new Error(response.data?.message || 'Gagal upload file')
    } catch (error: any) {
      console.error('❌ Upload file error:', error)
      console.error('❌ Error response:', error.response?.data)

      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Gagal upload file'

      toast.add({
        title: 'Gagal',
        description: errorMsg,
        color: 'error'
      })

      throw error
    }
  }

  /** ===========================
   * UPDATE/GANTI FILE NOMOR (USER)
   * Mengganti file pada nomor yang sudah terpakai → status jadi terpakai_final
   * Endpoint: POST /admin/nomor-request-detail/:detail_id/file
   * =========================== */
  const updateNomorFile = async (detailId: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_name', file.name)
      formData.append('file_text', file.name)

      const response = await api.post(`/admin/nomor-request-detail/${detailId}/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data?.success || response.status === 200 || response.status === 201) {
        toast.add({
          title: 'Berhasil',
          description: response.data?.message || 'File berhasil diperbarui, status menjadi Final',
          color: 'success'
        })
        triggerRefresh()
        return response.data?.data ?? response.data
      }

      throw new Error(response.data?.message || 'Gagal mengganti file')
    } catch (error: any) {
      console.error('❌ updateNomorFile error:', error)
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Gagal mengganti file'
      toast.add({ title: 'Gagal', description: errorMsg, color: 'error' })
      throw error
    }
  }

  /** ===========================
   * HANGUS DETAIL NOMOR (ADMIN)
   * ✅ UPDATED: Add trigger refetch after success
   * Endpoint: POST /admin/nomor-request-detail/:detail_id/hangus
   * =========================== */
  const hangusDetailNomor = async (detailId: string) => {
    try {
      console.log(`🗑️ Hangus nomor for detail ID: ${detailId}`)

      const response = await post(`/admin/nomor-request-detail/${detailId}/hangus`, {})

      console.log('✅ Hangus response:', response)

      if (response?.success) {
        toast.add({
          title: 'Berhasil',
          description: response?.message || 'Status berhasil diubah menjadi hangus',
          color: 'success'
        })

        // ✅ Trigger refetch setelah hangus berhasil
        triggerRefresh()

        return response.data
      } else {
        throw new Error(response?.message || 'Gagal menghanguskan nomor')
      }
    } catch (error: any) {
      console.error('❌ Error hangus nomor:', error)

      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Gagal menghanguskan nomor'

      toast.add({
        title: 'Gagal',
        description: errorMsg,
        color: 'error'
      })

      throw error
    }
  }

  // ============================================================
  // ✅ NEW: PENANDATANGAN APPROVAL FLOW
  // ============================================================

  /** ===========================
   * GET LIST PENDING APPROVAL (PENANDATANGAN)
   * endpoint: GET /nomor-request/pending-approval
   * =========================== */
  const getListPendingApproval = async (params?: {
    search?: string
    page?: number
    limit?: number
    sort_by?: string
    sort_order?: string
  }) => {
    try {
      const queryParams = new URLSearchParams()
      if (params?.search) queryParams.append('search', params.search)
      if (params?.page) queryParams.append('page', String(params.page))
      if (params?.limit) queryParams.append('limit', String(params.limit))
      if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params?.sort_order) queryParams.append('sort_order', params.sort_order)

      const queryString = queryParams.toString()
      const endpoint = `/nomor-request/pending-approval${queryString ? `?${queryString}` : ''}`

      console.log('📤 Fetching pending approval list with params:', params)
      console.log('📍 Full endpoint:', endpoint)

      const res = await get(endpoint)
      console.log('✅ Pending approval data received:', res)

      return {
        data: res.data ?? [],
        pagination: res.pagination ?? null
      }
    } catch (e: any) {
      console.error('❌ Error ambil list pending approval:', e)
      toast.add({
        title: 'Gagal fetch data',
        description: e.message || 'Gagal mengambil daftar usulan menunggu persetujuan',
        color: 'error'
      })
      return { data: [], pagination: null }
    }
  }

  /** ===========================
   * APPROVE PENANDATANGAN
   * endpoint: POST /nomor-request/:id_request/approve-penandatangan
   * =========================== */
  const approvePenandatangan = async (requestId: string, detailIds?: string[]) => {
    try {
      if (!requestId) throw new Error('Request ID tidak boleh kosong')

      console.log('📤 Approve penandatangan for request:', requestId, 'detail_ids:', detailIds)

      const body = detailIds && detailIds.length > 0 ? { detail_ids: detailIds } : {}
      const response = await post(`/nomor-request/${requestId}/approve-penandatangan`, body)

      console.log('✅ Approve penandatangan response:', response)

      toast.add({
        title: 'Berhasil',
        description:
          response?.message ||
          `${response?.data?.approved_count ?? 0} usulan berhasil disetujui dan siap diverifikasi admin`,
        color: 'success'
      })

      return response
    } catch (e: any) {
      console.error('❌ Error approve penandatangan:', e)
      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        'Gagal menyetujui usulan'
      toast.add({ title: 'Gagal', description: errorMsg, color: 'error' })
      throw e
    }
  }

  /** ===========================
   * REJECT PENANDATANGAN
   * endpoint: POST /nomor-request/:id_request/reject-penandatangan
   * Body: { keterangan: string }
   * =========================== */
  const rejectPenandatangan = async (
    requestId: string,
    keterangan: string,
    detailIds?: string[]
  ) => {
    try {
      if (!requestId) throw new Error('Request ID tidak boleh kosong')
      if (!keterangan?.trim()) throw new Error('Keterangan penolakan harus diisi')

      console.log('📤 Reject penandatangan for request:', requestId)

      const body: Record<string, any> = { keterangan }
      if (detailIds && detailIds.length > 0) body.detail_ids = detailIds

      const response = await post(`/nomor-request/${requestId}/reject-penandatangan`, body)

      console.log('✅ Reject penandatangan response:', response)

      toast.add({
        title: 'Ditolak',
        description:
          response?.message || `${response?.data?.rejected_count ?? 0} usulan berhasil ditolak`,
        color: 'error'
      })

      return response
    } catch (e: any) {
      console.error('❌ Error reject penandatangan:', e)
      const errorMsg =
        e.response?.data?.message || e.response?.data?.error || e.message || 'Gagal menolak usulan'
      toast.add({ title: 'Gagal', description: errorMsg, color: 'error' })
      throw e
    }
  }

  /* ===========================
   * TOAST HELPERS — UI LEVEL
   * Dipindah dari component agar semua toast terpusat di composable
   * =========================== */

  const showToastFileNotFound = () => {
    toast.add({
      title: 'File tidak ditemukan',
      description: 'File tidak tersedia untuk ditampilkan',
      color: 'warning'
    })
  }

  const showToastFileTooLarge = () => {
    toast.add({
      title: 'File terlalu besar',
      description: 'Ukuran file maksimal 5MB',
      color: 'warning'
    })
  }

  const showToastCopied = (nomor: string) => {
    toast.add({
      title: 'Tersalin',
      description: `Nomor surat "${nomor}" berhasil disalin.`,
      color: 'success'
    })
  }

  const showToastNomorMinimal = () => {
    toast.add({
      title: 'Peringatan',
      description: 'Pilih minimal 1 nomor untuk disetujui!',
      color: 'warning'
    })
  }

  const showToastKeteranganRequired = (uncheckedCount?: number) => {
    toast.add({
      title: 'Keterangan Penolakan Wajib Diisi',
      description: uncheckedCount
        ? `Ada ${uncheckedCount} nomor yang tidak dicentang. Isi keterangan penolakan terlebih dahulu.`
        : 'Silakan isi keterangan penolakan terlebih dahulu!',
      color: 'error'
    })
  }

  const showToastApprovalSuccess = (approvedCount: number, rejectedCount: number) => {
    if (rejectedCount > 0) {
      toast.add({
        title: 'Berhasil',
        description: `${approvedCount} nomor disetujui, ${rejectedCount} nomor ditolak`,
        color: 'success'
      })
    } else {
      toast.add({
        title: 'Berhasil',
        description: `${approvedCount} nomor berhasil disetujui`,
        color: 'success'
      })
    }
  }

  const showToastTidakAdaYangDitolak = () => {
    toast.add({
      title: 'Peringatan',
      description: 'Tidak ada nomor yang akan ditolak!',
      color: 'warning'
    })
  }

  const showToastTidakAdaNomor = (action: 'disetujui' | 'ditolak') => {
    toast.add({
      title: 'Peringatan',
      description: `Tidak ada nomor yang dapat ${action}.`,
      color: 'warning'
    })
  }

  const showToastGagalPreview = () => {
    toast.add({
      title: 'Gagal membuka file',
      description: 'File tidak dapat dipratinjau',
      color: 'error'
    })
  }

  const showToastFileTooLargeAdmin = () => {
    toast.add({
      title: 'File terlalu besar',
      description: 'Ukuran file maksimal 10MB',
      color: 'warning'
    })
  }

  const showToastPilihFile = () => {
    toast.add({
      title: 'Pilih file',
      description: 'Silakan pilih file terlebih dahulu',
      color: 'warning'
    })
  }

  const showToastSaveTitle = () => {
    toast.add({
      title: 'Berhasil',
      description: 'Judul berhasil diperbarui',
      color: 'success'
    })
  }

  const showToastPenomoranSuccess = (count: number) => {
    toast.add({
      title: 'Berhasil',
      description: `Berhasil menambahkan ${count} nomor baru`,
      color: 'success'
    })
  }

  return {
    // STATE - TERPISAH
    adminCounts,
    userCounts,
    nomorCounts,

    // ✅ REFETCH TRIGGER
    refreshTrigger,
    triggerRefresh,

    // COUNT
    getNomorRequestCountAdmin,
    getNomorRequestCountUser,
    fetchNomorRequestCount,

    // USULAN FLOW (USER)
    createUsulanDraft,
    submitBooking,
    submitBookingSingleFile,
    updateNomorFile,
    getListUsulanByPosition,
    deleteUsulanUser,

    // USULAN FLOW (ADMIN)
    getListUsulan,
    getDetailUsulan,
    deleteUsulan,

    // VERIFIKASI (ADMIN)
    getListSubmitted,
    getDetailVerifikasiRequest,
    approveBulkNomor,
    rejectNomorRequest,
    uploadDetailFile,
    hangusDetailNomor,

    // ✅ NEW: PENANDATANGAN APPROVAL FLOW
    getListPendingApproval,
    approvePenandatangan,
    rejectPenandatangan,

    // PENOMORAN FINAL (ADMIN)
    createPenomoranFinal,
    getListNomor,
    getDetailNomor,
    deleteNomor,

    // MASTER DATA
    getKlasifikasi,
    getPersonWithPosition,

    // LOADING
    isLoadingPenomoran,
    isLoadingBooking,
    isLoadingList,
    isLoadingSubmitted,

    // TOAST HELPERS
    showToastFileNotFound,
    showToastFileTooLarge,
    showToastFileTooLargeAdmin,
    showToastGagalPreview,
    showToastPilihFile,
    showToastSaveTitle,
    showToastPenomoranSuccess,
    showToastCopied,
    showToastNomorMinimal,
    showToastKeteranganRequired,
    showToastApprovalSuccess,
    showToastTidakAdaYangDitolak,
    showToastTidakAdaNomor
  }
}
