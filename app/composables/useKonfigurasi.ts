// composables/useKonfigurasi.ts
import { ref } from 'vue'
import type {
  KonfigurasiDigsigItem,
  KonfigurasiDigsigResponse,
  ToggleKonfigurasiDigsigResponse,
  KonfigurasiMessageItem,
  KonfigurasiMessageResponse,
  KonfigurasiMessageSingleResponse,
  CreateMessagePayload,
  UpdateMessagePayload
} from '@/types/konfigurasi'
import { useApi } from '@/composables/useApi'

// Dibuat di luar fungsi agar reaktif secara global (shared state)
const messageList = ref<KonfigurasiMessageItem[]>([])

export const useKonfigurasi = () => {
  const { apiGet, apiPost, apiPatch, apiPut, apiDelete } = useApi()

  // ==========================================
  //   DIGSIG (tidak diubah)
  // ==========================================
  const digsigList = ref<KonfigurasiDigsigItem[]>([])
  const isLoading = ref(false)
  const isToggling = ref<string | null>(null)

  const fetchDigsig = async () => {
    try {
      isLoading.value = true
      const res = await apiGet<KonfigurasiDigsigResponse>('/admin/config/digsig')
      if (res.success) {
        digsigList.value = res.data
      }
    } catch (error) {
      console.error('Fetch digsig error:', error)
      useToast().add({
        title: 'Gagal',
        description: 'Gagal mengambil konfigurasi DigSig.',
        color: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }

  const toggleDigsig = async (
    jenisNaskah: string,
    payload: {
      digsig: boolean
      ttd_qr: boolean
      ttd_basah: boolean
    }
  ) => {
    isToggling.value = jenisNaskah
    try {
      await apiPut('/admin/config/digsig', {
        jenis_naskah: jenisNaskah,
        digsig: payload.digsig,
        ttd_qr: payload.ttd_qr,
        ttd_basah: payload.ttd_basah
      })
    } finally {
      isToggling.value = null
    }
  }

  // ==========================================
  //   PENGUMUMAN / MESSAGE
  // ==========================================
  const isLoadingMessage = ref(false)
  const isCreatingMessage = ref(false)
  const isUpdatingMessage = ref(false)
  const isDeletingMessage = ref(false)
  const isTogglingBanner = ref<string | null>(null)

  // GET semua pengumuman
  // adminMode: true → /admin/config/message (CRUD page)
  // adminMode: false → /config/message (layout banner, semua role)
  const fetchMessages = async (adminMode = false) => {
    try {
      isLoadingMessage.value = true
      const endpoint = adminMode ? '/admin/config/message' : '/config/message'
      const res = await apiGet<KonfigurasiMessageResponse>(endpoint)
      if (res.success) {
        messageList.value = res.data
      }
    } catch (error: any) {
      // 403 = role user — silent fail, tidak tampilkan toast
      if (error?.statusCode === 403 || error?.status === 403) {
        console.warn('fetchMessages: akses ditolak (role user).')
        return
      }
      console.error('Fetch message error:', error)
      useToast().add({
        title: 'Gagal',
        description: 'Gagal mengambil data pengumuman.',
        color: 'error'
      })
    } finally {
      isLoadingMessage.value = false
    }
  }

  // POST buat pengumuman baru — append ke BAWAH (push)
  const createMessage = async (payload: CreateMessagePayload) => {
    try {
      isCreatingMessage.value = true
      const res = await apiPost<KonfigurasiMessageSingleResponse>('/admin/config/message', payload)
      if (res.success) {
        // push ke bawah agar urutan nomor bertambah di bawah
        messageList.value.push(res.data)
        useToast().add({
          title: 'Berhasil',
          description: 'Pengumuman berhasil dibuat.',
          color: 'success'
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Create message error:', error)
      useToast().add({
        title: 'Gagal',
        description: 'Gagal membuat pengumuman.',
        color: 'error'
      })
      return false
    } finally {
      isCreatingMessage.value = false
    }
  }

  // PUT edit pengumuman
  const updateMessage = async (id: string, payload: UpdateMessagePayload) => {
    try {
      isUpdatingMessage.value = true
      const res = await apiPut<KonfigurasiMessageSingleResponse>(
        `/admin/config/message/${id}`,
        payload
      )
      if (res.success) {
        const index = messageList.value.findIndex((m) => m.id === id)
        if (index !== -1) {
          messageList.value[index] = res.data
        }
        useToast().add({
          title: 'Berhasil',
          description: 'Pengumuman berhasil diperbarui.',
          color: 'success'
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Update message error:', error)
      useToast().add({
        title: 'Gagal',
        description: 'Gagal memperbarui pengumuman.',
        color: 'error'
      })
      return false
    } finally {
      isUpdatingMessage.value = false
    }
  }

  // PATCH toggle banner on/off — langsung update messageList reaktif
  // sehingga AnnouncementBanner muncul/hilang tanpa refresh
  const toggleBanner = async (id: string) => {
    try {
      isTogglingBanner.value = id
      const res = await apiPatch<KonfigurasiMessageSingleResponse>(
        `/admin/config/message/${id}/banner`
      )
      if (res.success) {
        const index = messageList.value.findIndex((m) => m.id === id)
        if (index !== -1) {
          // Update langsung di shared ref — semua komponen yang pakai messageList ikut update
          messageList.value[index] = { ...res.data }
        }
      }
    } catch (error) {
      console.error('Toggle banner error:', error)
      useToast().add({
        title: 'Gagal',
        description: 'Gagal mengubah status banner.',
        color: 'error'
      })
    } finally {
      isTogglingBanner.value = null
    }
  }

  // DELETE hapus pengumuman
  const deleteMessage = async (id: string) => {
    try {
      isDeletingMessage.value = true
      const res = await apiDelete<{
        success: boolean
        data: { message: string }
      }>(`/admin/config/message/${id}`)
      if (res.success) {
        messageList.value = messageList.value.filter((m) => m.id !== id)
        useToast().add({
          title: 'Berhasil',
          description: 'Pengumuman berhasil dihapus.',
          color: 'error'
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Delete message error:', error)
      useToast().add({
        title: 'Gagal',
        description: 'Gagal menghapus pengumuman.',
        color: 'error'
      })
      return false
    } finally {
      isDeletingMessage.value = false
    }
  }

  // ==========================================
  //   TOAST HELPERS — UI LEVEL
  // ==========================================
  const showToastSaveDigsig = () => {
    useToast().add({
      title: 'Berhasil',
      description: 'Konfigurasi DigSig berhasil disimpan.',
      color: 'success'
    })
  }

  return {
    // digsig
    digsigList,
    isLoading,
    isToggling,
    fetchDigsig,
    toggleDigsig,

    // message/pengumuman
    messageList,
    isLoadingMessage,
    isCreatingMessage,
    isUpdatingMessage,
    isDeletingMessage,
    isTogglingBanner,
    fetchMessages,
    createMessage,
    updateMessage,
    toggleBanner,
    deleteMessage,

    // toast helpers
    showToastSaveDigsig
  }
}
