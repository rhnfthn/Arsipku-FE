<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-2">
      <div>
        <Heading variant="heading9sb" class="text-mobile-md">
          Unit TU
        </Heading>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola konfigurasi Unit TU (Tata Usaha). Role Sekretaris Delegasi
          dikelola otomatis melalui menu Delegasi.
        </p>
      </div>
      <button
        v-if="canManage"
        @click="openCreateModal"
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-800 text-sm transition"
      >
        <UIcon name="i-lucide-plus" class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <!-- Filter & Search -->
    <div class="flex flex-col sm:flex-row gap-3 mt-5 mb-4">
      <div class="relative flex-1">
        <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="searchInput"
          type="text"
          placeholder="Cari nama user..."
          class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          @input="onSearchInput"
        />
      </div>
      <select
        v-model="filterRole"
        class="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        @change="fetchData"
      >
        <option value="">Semua Role</option>
        <option value="unit_dokumen">Unit Dokumen</option>
        <option value="sekretaris_delegasi">Sekretaris Delegasi</option>
      </select>
      <select
        v-model="filterArea"
        class="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        @change="fetchData"
      >
        <option value="">Semua Area</option>
        <option v-for="a in areaOptions" :key="a.area" :value="a.area">
          {{ a.longText || a.shortText || a.area }}
        </option>
      </select>
      <select
        v-model="filterOrg"
        class="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        @change="fetchData"
      >
        <option value="">Semua Organization</option>
        <option v-for="o in orgOptions" :key="o.organization" :value="String(o.organization)">
          {{ o.longText || o.shortText || String(o.organization) }}
        </option>
      </select>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <DataTable
        :columns="columns"
        :rows="list"
        :loading="isLoading"
        :skeleton-rows="5"
        empty-message="Belum ada data Unit TU."
      >
        <template #cell-no="{ index }">
          {{ (page - 1) * limit + index + 1 }}
        </template>
        <template #cell-user_name="{ row }">
          <span class="font-medium text-gray-800 dark:text-white">
            {{ row.user_name || row.persnum }}
          </span>
        </template>
        <template #cell-role="{ row }">
          <UBadge :color="row.role === 'unit_dokumen' ? 'primary' : 'secondary'">
            {{ roleLabel(row.role) }}
          </UBadge>
        </template>
        <template #cell-area_text="{ row }">
          {{ row.area_text || row.area_id || '-' }}
        </template>
        <template #cell-organization_text="{ row }">
          {{ row.organization_text || row.organization_id || '-' }}
        </template>
        <template #cell-sub_area_text="{ row }">
          {{ row.sub_area_text || row.sub_area_id || '-' }}
        </template>
        <template #cell-valid_from="{ row }">
          {{ formatDate(row.valid_from) }}
        </template>
        <template #cell-valid_to="{ row }">
          {{ row.valid_to ? formatDate(row.valid_to) : '-' }}
        </template>
        <template #cell-status="{ row }">
          <UBadge
            :color="row.is_currently_valid && row.is_active ? 'success' : 'neutral'"
            :variant="row.is_currently_valid && row.is_active ? 'soft' : 'outline'"
          >
            {{ row.is_currently_valid && row.is_active ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
        </template>
        <template #cell-aksi="{ row }">
          <div v-if="canManage" class="flex items-center gap-1">
            <button
              @click="openEditModal(row)"
              class="p-1.5 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950 rounded-md transition-colors"
              title="Edit"
            >
              <UIcon name="i-lucide-pencil" class="w-4 h-4" />
            </button>
            <button
              @click="confirmDelete(row)"
              class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
              title="Hapus"
            >
              <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
            </button>
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>
      </DataTable>
    </div>

    <!-- Pagination -->
    <div class="mt-4">
      <Pagination
        :current-page="page"
        :total-pages="totalPages"
        :total-items="total"
        :rows-per-page="limit"
        :rows-options="[10, 20, 50]"
        @update:page="onPageChange"
        @update:rows-per-page="onLimitChange"
      />
    </div>

    <!-- MODAL CREATE / EDIT -->
    <Teleport to="body">
      <Modal v-model="showModal" size="lg" :saving="isSubmitting" @save="handleSave">
        <template #title>
          <div class="p-3 ml-2 mt-2">
            <h3 class="text-xl font-bold dark:text-white">
              {{ editTarget ? 'Edit Unit TU' : 'Tambah Unit TU' }}
            </h3>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <!-- Pilih User -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pilih User <span class="text-red-500">*</span>
            </label>
            <input
              v-model="userSearch"
              type="text"
              placeholder="Ketik nama user untuk mencari..."
              class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              @input="onUserSearchInput"
            />
            <div v-if="userSearchResults.length > 0" class="mt-1 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
              <button
                v-for="u in userSearchResults"
                :key="u.persnum"
                type="button"
                class="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-0"
                @click="selectUser(u)"
              >
                {{ u.name }} <span class="text-gray-400">({{ u.persnum }})</span>
              </button>
            </div>
            <p v-if="form.persnum && !userSearch" class="mt-1 text-xs text-gray-500">
              Terpilih: <strong>{{ selectedUserName }}</strong> ({{ form.persnum }})
            </p>
          </div>

          <!-- Role (hardcode unit_dokumen) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <div class="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200">
              Unit Dokumen
            </div>
            <p class="mt-1 text-xs text-gray-400">
              Role Sekretaris Delegasi dikelola otomatis melalui menu Delegasi.
            </p>
          </div>

          <!-- Area -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area</label>
            <select
              v-model="form.area_id"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              @change="onAreaChange"
            >
              <option :value="null">- Pilih Area -</option>
              <option v-for="a in areaOptions" :key="a.area" :value="a.area">
                {{ a.longText || a.shortText || a.area }}
              </option>
            </select>
          </div>

          <!-- Valid From & Valid To -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valid From <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.valid_from"
                type="date"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valid To (opsional)</label>
              <input
                v-model="form.valid_to"
                type="date"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <!-- Is Active -->
          <div class="flex items-center gap-2">
            <input
              id="orgtu-active"
              v-model="form.is_active"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-500"
            />
            <label for="orgtu-active" class="text-sm text-gray-700 dark:text-gray-300">Aktif</label>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- CONFIRM DELETE -->
    <ConfirmPopup
      v-model="showDeleteModal"
      type="danger"
      title="Hapus Data Unit TU"
      :message="`Apakah Anda yakin ingin menghapus data Unit TU untuk &quot;${deleteTarget?.user_name || deleteTarget?.persnum}&quot;? Tindakan ini tidak dapat dibatalkan.`"
      confirm-text="Hapus"
      cancel-text="Batal"
      :is-loading="isDeleting"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import Modal from '~/components/Modal.vue'
import ConfirmPopup from '~/components/ConfirmPopup.vue'
import Heading from '~/components/Heading.vue'
import { useOrganizationTu } from '~/composables/useOrganizationTu'
import { useArea } from '~/composables/useArea'
import { useStruktur } from '~/composables/useStruktur'
import { usePerson } from '~/composables/usePerson'
import type {
  OrganizationTuItem,
  OrganizationTuRole,
  CreateOrganizationTuPayload,
  UpdateOrganizationTuPayload,
} from '~/types/organization-tu'

const { hasPermission } = useAuth()
const canManage = computed(() => hasPermission('konfigurasi', 'update') || hasPermission('konfigurasi', 'create'))

const {
  getOrganizationTuList,
  createOrganizationTu,
  updateOrganizationTu,
  deleteOrganizationTu,
} = useOrganizationTu()

const { getAreasByCompany } = useArea()
const { getCompanyTree } = useStruktur()
const { getPersons, searchPersons } = usePerson()

// ─── State list ───
const list = ref<OrganizationTuItem[]>([])
const isLoading = ref(false)
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const totalPages = ref(1)

// Kolom DataTable Unit TU — konsisten dengan tabel lain (header primary).
const columns = [
  { key: 'no', label: 'No' },
  { key: 'user_name', label: 'Nama User' },
  { key: 'role', label: 'Role' },
  { key: 'area_text', label: 'Area' },
  { key: 'organization_text', label: 'Organization' },
  { key: 'sub_area_text', label: 'Sub Area' },
  { key: 'valid_from', label: 'Valid From' },
  { key: 'valid_to', label: 'Valid To' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi' },
]

const searchInput = ref('')
const filterRole = ref<OrganizationTuRole | ''>('')
const filterArea = ref('')
const filterOrg = ref('')

let searchDebounce: any = null
const onSearchInput = () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    fetchData()
  }, 400)
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await getOrganizationTuList({
      search: searchInput.value || undefined,
      role: filterRole.value || undefined,
      area_id: filterArea.value || undefined,
      organization_id: filterOrg.value || undefined,
      page: page.value,
      limit: limit.value,
    })
    // res = { data: [...], meta: {...} } (sudah di-unwrap composable)
    list.value = res?.data || []
    total.value = res?.meta?.total || 0
    totalPages.value = res?.meta?.totalPages || 1
  } catch (error: any) {
    console.error('Fetch organization_tu error:', error)
    useToast().add({ title: 'Gagal', description: 'Gagal mengambil data Unit TU.', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

const onPageChange = (p: number) => { page.value = p; fetchData() }
const onLimitChange = (l: number) => { limit.value = l; page.value = 1; fetchData() }

// ─── Dropdown options (area, org) ───
const areaOptions = ref<any[]>([])
const orgOptions = ref<any[]>([])

const companyId = computed(() => {
  const user = useState<any>('user')
  return user.value?.company || ''
})

const loadAreaOptions = async () => {
  if (!companyId.value) return
  try {
    const res = await getAreasByCompany(String(companyId.value))
    areaOptions.value = res?.data || []
  } catch (e) {
    areaOptions.value = []
  }
}

const loadOrgOptions = async () => {
  if (!companyId.value) return
  try {
    const res = await getCompanyTree(String(companyId.value))
    // Flatten tree untuk dropdown organization (filter list)
    const flat: any[] = []
    const walk = (nodes: any[]) => {
      for (const n of nodes) {
        flat.push(n)
        if (n.children && Array.isArray(n.children)) walk(n.children)
      }
    }
    if (res?.data?.tree) walk(res.data.tree)
    orgOptions.value = flat
  } catch (e) {
    orgOptions.value = []
  }
}

const onAreaChange = () => {
  // Form hanya punya Area sekarang (organization & sub_area dihapus dari form)
}

// ─── User search (personil) ───
const userSearch = ref('')
const userSearchResults = ref<any[]>([])
let userDebounce: any = null

const onUserSearchInput = () => {
  clearTimeout(userDebounce)
  userDebounce = setTimeout(async () => {
    if (!userSearch.value || userSearch.value.length < 2) {
      // Jika kosong/kurang dari 2 char, load daftar default (page 1)
      try {
        const res = await getPersons()
        userSearchResults.value = res?.data?.data || []
      } catch (e) {
        userSearchResults.value = []
      }
      return
    }
    try {
      const res = await searchPersons(userSearch.value)
      userSearchResults.value = res?.data?.data || []
    } catch (e) {
      userSearchResults.value = []
    }
  }, 400)
}

const selectedUserName = computed(() => {
  const found = userSearchResults.value.find((u) => u.persnum === form.persnum)
  return found?.name || ''
})

const selectUser = (u: any) => {
  form.persnum = Number(u.persnum)
  userSearch.value = ''
  userSearchResults.value = []
}

// ─── Modal create/edit ───
const showModal = ref(false)
const isSubmitting = ref(false)
const editTarget = ref<OrganizationTuItem | null>(null)

const form = reactive<{
  persnum: number | null
  role: OrganizationTuRole
  area_id: string | null
  organization_id: string | null
  sub_area_id: string | null
  valid_from: string
  valid_to: string | null
  is_active: boolean
}>({
  persnum: null,
  role: 'unit_dokumen',
  area_id: null,
  organization_id: null,
  sub_area_id: null,
  valid_from: '',
  valid_to: null,
  is_active: true,
})

const resetForm = () => {
  form.persnum = null
  form.role = 'unit_dokumen'
  form.area_id = null
  form.organization_id = null
  form.sub_area_id = null
  form.valid_from = ''
  form.valid_to = null
  form.is_active = true
  userSearch.value = ''
  userSearchResults.value = []
}

const openCreateModal = () => {
  editTarget.value = null
  resetForm()
  showModal.value = true
}

const openEditModal = (item: OrganizationTuItem) => {
  editTarget.value = item
  form.persnum = item.persnum
  // Role tetap unit_dokumen di form (sekretaris_delegasi tidak diedit di sini)
  form.role = 'unit_dokumen'
  form.area_id = item.area_id
  form.organization_id = item.organization_id
  form.sub_area_id = item.sub_area_id
  form.valid_from = item.valid_from
  form.valid_to = item.valid_to
  form.is_active = item.is_active
  userSearch.value = ''
  userSearchResults.value = []
  showModal.value = true
}

const handleSave = async () => {
  if (!form.persnum) {
    useToast().add({ title: 'Validasi', description: 'User wajib dipilih.', color: 'warning' })
    return
  }
  if (!form.valid_from) {
    useToast().add({ title: 'Validasi', description: 'Valid From wajib diisi.', color: 'warning' })
    return
  }
  if (form.valid_to && form.valid_to < form.valid_from) {
    useToast().add({ title: 'Validasi', description: 'Valid To harus setelah Valid From.', color: 'warning' })
    return
  }

  isSubmitting.value = true
  try {
    const payload: CreateOrganizationTuPayload = {
      persnum: form.persnum,
      role: 'unit_dokumen',
      area_id: form.area_id,
      organization_id: form.organization_id,
      sub_area_id: form.sub_area_id,
      valid_from: form.valid_from,
      valid_to: form.valid_to,
      is_active: form.is_active,
    }

    if (editTarget.value) {
      // Untuk record sekretaris_delegasi, jangan ubah role-nya
      if (editTarget.value.role === 'sekretaris_delegasi') {
        delete (payload as any).role
      }
      await updateOrganizationTu(editTarget.value.id, payload as UpdateOrganizationTuPayload)
      useToast().add({ title: 'Berhasil', description: 'Data Unit TU berhasil diperbarui.', color: 'success' })
    } else {
      await createOrganizationTu(payload)
      useToast().add({ title: 'Berhasil', description: 'Data Unit TU berhasil dibuat.', color: 'success' })
    }
    showModal.value = false
    fetchData()
  } catch (error: any) {
    const msg = error?.data?.message || error?.message || 'Gagal menyimpan data.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

// ─── Delete ───
const showDeleteModal = ref(false)
const deleteTarget = ref<OrganizationTuItem | null>(null)
const isDeleting = ref(false)

const confirmDelete = (item: OrganizationTuItem) => {
  deleteTarget.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await deleteOrganizationTu(deleteTarget.value.id)
    useToast().add({ title: 'Berhasil', description: 'Data Unit TU berhasil dihapus.', color: 'success' })
    showDeleteModal.value = false
    deleteTarget.value = null
    fetchData()
  } catch (error: any) {
    useToast().add({ title: 'Gagal', description: 'Gagal menghapus data.', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

// ─── Helpers ───
const roleLabel = (role: OrganizationTuRole) =>
  role === 'unit_dokumen' ? 'Unit Dokumen' : 'Sekretaris Delegasi'

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

// ─── Init ───
onMounted(async () => {
  await Promise.all([loadAreaOptions(), loadOrgOptions()])
  fetchData()
})

// Reload options ketika company berubah
watch(companyId, () => {
  loadAreaOptions()
  loadOrgOptions()
})
</script>
