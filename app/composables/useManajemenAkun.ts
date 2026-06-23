import { ref } from 'vue'
import { useApi } from './useApi'

export interface Account {
  persnum: number
  name: string
  username?: string
  email: string | null
  role: string
  status: string
  positionText: string
}

export const useManajemenAkun = () => {
  const { apiGet, apiPost, apiDelete } = useApi()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const accounts = ref<Account[]>([])

  const fetchAccounts = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await apiGet('/superadmin/users')
      const users = response.data.users || []

      accounts.value = users.map((u: any) => ({
        persnum: u.persnum,
        name: u.name,
        email: u.email ?? null,
        role: u.role,
        status: u.status,
        positionText: u.position_text || ''
      }))

    } catch (err: any) {
      console.error(err)
      error.value = err.message || "Gagal memuat data"
    } finally {
      loading.value = false
    }
  }

  const addAccount = async (persnum: string | number, role: string) => {
    try {
      const res = await apiPost(`/superadmin/users/${persnum}/role`, {
        role: role
      })

      // Refresh table
      await fetchAccounts()

      return res

    } catch (err) {
      console.error("Gagal assign role:", err)
      throw err
    }
  }

const deleteAccount = async (persnum: number) => {
  try {
    const res = await apiDelete(`/superadmin/users/${persnum}/role`)

    // Refresh data setelah hapus role
    await fetchAccounts()

    return res
  } catch (err) {
    console.error("Gagal menghapus role:", err)
    throw err
  }
}

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    addAccount  ,
    deleteAccount   
  }
}
