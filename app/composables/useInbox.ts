// composables/useInbox.ts
import type { ApiResponse, InboxData } from '~/types/inbox'

export const useInbox = () => {
  // Config runtime untuk base URL API (jika sudah di setup di nuxt.config)
  const config = useRuntimeConfig()

  // Position ID Statis sesuai request
  const POSITION_ID = "70016581"

  const { data, pending, error, refresh } = useFetch<ApiResponse<InboxData>>(
    `/naskah_sirkulasi/inbox/${POSITION_ID}`,
    {
      // Opsi tambahan jika perlu (headers, dll)
      // baseURL: config.public.apiBase // uncomment jika pakai base url env
      server: false, // Client side fetching (opsional, sesuaikan kebutuhan)
      lazy: true,    // Supaya tidak blocking navigasi
    }
  )

  // Helper untuk mengambil items dengan aman
  const inboxItems = computed(() => data.value?.data?.items || [])

  // Helper untuk mengambil summary
  const inboxSummary = computed(() => data.value?.data?.summary)

  return {
    data,
    inboxItems,
    inboxSummary,
    pending,
    error,
    refresh
  }
}
