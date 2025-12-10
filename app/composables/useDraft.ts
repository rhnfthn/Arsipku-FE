// composables/useDraft.ts
import { useApi } from './useApi'

export const useDraft = () => {
  const { post } = useApi()
  const toast = useToast()
  const isLoadingDraft = ref(false)

  const saveDraft = async (payload: FormData | any) => {
    isLoadingDraft.value = true
    try {
      // ... (Logika Console Log sebelumnya) ...

      const response = await post('/ND/save-draft', payload)

      // 1. Tampilkan Toast Sukses
      toast.add({
        title: 'Berhasil',
        description: 'Draft berhasil disimpan.',
        icon: 'i-heroicons-check-circle',
        color: 'green',
        timeout: 3000
      })

      return response
    } catch (error: any) {
      toast.add({
        title: 'Gagal',
        description: error.response?.data?.message || 'Gagal menyimpan draft.',
        icon: 'i-heroicons-exclamation-circle',
        color: 'red'
      })
      throw error // Lempar error agar component tahu kalau gagal
    } finally {
      isLoadingDraft.value = false
    }
  }

  return {
    saveDraft,
    isLoadingDraft
  }
}
