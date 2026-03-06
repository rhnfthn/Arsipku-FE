<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <div>
        <PageHeader title="Manajemen FAQ" :items="items" />
      </div>

      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors"
      >
        <Plus class="w-4 h-4" />
        Tambah FAQ
      </button>
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <!-- Top Bar -->
      <div class="flex flex-wrap gap-4 items-center p-3">
        <select
          v-model="rowsPerPage"
          class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option v-for="n in rowsChoices" :key="n" :value="n">{{ n }}</option>
        </select>

        <button
          @click="refreshData"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <div class="relative flex-1 w-full px-2">
          <Search class="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            v-model="filters.search"
            placeholder="Cari pertanyaan..."
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>

        <button class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-9 px-6 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors">
          <FileDown class="w-4 h-4" />
          Export
        </button>
      </div>

      <!-- Table -->
      <table class="min-w-full border-collapse text-sm">
        <thead class="bg-primary-400 dark:bg-primary-700 text-white text-left">
          <tr>
            <th class="px-4 py-3 w-10">
              <input
                type="checkbox"
                @change="toggleSelectAll"
                :checked="isAllSelected"
                class="rounded border-gray-300"
              />
            </th>
            <th class="px-4 py-3 font-semibold cursor-pointer select-none" @click="toggleSort('pertanyaan')">
              <div class="flex items-center gap-1">
                Pertanyaan
              </div>
            </th>
            <th class="px-4 py-3 font-semibold cursor-pointer select-none" @click="toggleSort('kategori')">
              <div class="flex items-center gap-1">
                Kategori
              </div>
            </th>
            <th class="px-4 py-3 font-semibold">Terakhir Update</th>
            <th class="px-4 py-3 font-semibold text-center">Puas</th>
            <th class="px-4 py-3 font-semibold text-center">Tidak Puas</th>
            <th class="px-4 py-3 font-semibold text-center">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-if="!loading"
            v-for="(faq, idx) in paginatedFaqs"
            :key="faq.id"
            class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :value="faq.id"
                v-model="selectedIds"
                class="rounded border-gray-300"
              />
            </td>

            <td class="px-4 py-3">
              <p class="font-semibold text-gray-700 dark:text-white truncate max-w-xs">{{ faq.pertanyaan }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{{ faq.deskripsi }}</p>
            </td>

            <td class="px-4 py-3">
              <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">{{ faq.kategori }}</span>
            </td>

            <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {{ formatDate(faq.updatedAt) }}
            </td>

            <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-200">
              {{ faq.puas.toLocaleString('id-ID') }}
            </td>

            <td class="px-4 py-3 text-center text-gray-700 dark:text-gray-200">
              {{ faq.tidakPuas.toLocaleString('id-ID') }}
            </td>

            <td class="px-4 py-3 text-center">
              <div class="flex justify-center gap-3">
                <button
                  class="p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors group"
                  @click="openEdit(faq)"
                >
                  <Pencil class="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600" />
                </button>

                <button
                  class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                  @click="openDelete(faq)"
                >
                  <Trash2 class="w-4 h-4 text-red-600 dark:text-red-500 group-hover:text-red-600" />
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="loading">
            <td colspan="7" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
              <div class="flex justify-center">
                <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </td>
          </tr>
          <tr v-else-if="paginatedFaqs.length === 0">
            <td colspan="7" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
              Tidak ada data FAQ ditemukan.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="filteredFaqs.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Menampilkan {{ paginatedFaqs.length }} dari {{ filteredFaqs.length }} data
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900',
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Sebelumnya
          </button>

          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >1</button>

            <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400 dark:text-gray-500 text-sm">...</span>

            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary',
              ]"
            >{{ page }}</button>

            <span v-if="paginationPages[paginationPages.length - 1] < totalPages - 1" class="px-2 text-gray-400 dark:text-gray-500 text-sm">...</span>

            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >{{ totalPages }}</button>
          </div>

          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900',
            ]"
          >
            Selanjutnya
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Tambah / Edit -->
  <Teleport to="body">
    <Modal v-model="showModal" @save="saveFaq">
      <template #title>
        <Heading variant="heading9b" class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white">
          {{ isEditMode ? 'Edit FAQ' : 'Tambah FAQ' }}
        </Heading>
      </template>

      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">Pertanyaan</label>
        <input
          v-model="form.pertanyaan"
          type="text"
          placeholder="Masukkan pertanyaan..."
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">Deskripsi / Jawaban</label>
        <textarea
          v-model="form.deskripsi"
          rows="4"
          placeholder="Masukkan jawaban atau deskripsi..."
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 resize-none"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">Kategori</label>
        <div class="flex gap-2">
          <select
            v-model="form.kategori"
            class="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
          >
            <option value="" disabled>Pilih kategori...</option>
            <option v-for="cat in kategoriOptions" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <input
            v-if="showNewKategori"
            v-model="newKategori"
            type="text"
            placeholder="Nama kategori baru..."
            class="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>
    </Modal>
  </Teleport>

  <!-- Confirm Delete -->
  <ConfirmPopup
    v-model="confirmDeleteOpen"
    type="danger"
    title="Hapus FAQ"
    message="Apakah Anda yakin ingin menghapus FAQ ini? Tindakan ini tidak dapat dibatalkan."
    confirm-text="Hapus"
    cancel-text="Batal"
    @confirm="deleteNow"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Trash2, RotateCcw, FileDown, Search, Plus, Pencil } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import type { Faq } from '@/composables/useFaq'

definePageMeta({ middleware: 'auth' })

const toast = useToast()
const { faqs, loading, fetchFaqs, fetchCategories, createFaq, updateFaq, deleteFaq } = useFaq()

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Manajemen FAQ', to: '/faq/manajemen' },
]

// ─── Categories (from API) ───────────────────────────────────────────────────
const kategoriOptions = ref<string[]>([])
const loadCategories = async () => {
  kategoriOptions.value = await fetchCategories()
}

// ─── Filter & Sort ────────────────────────────────────────────────────────────
const filters = ref({ search: '' })
const sortKey = ref<'pertanyaan' | 'kategori' | null>(null)
const sortAsc = ref(true)

const toggleSort = (key: 'pertanyaan' | 'kategori') => {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────
const rowsPerPage = ref<number>(10)
const rowsChoices = [5, 10, 20, 50]
const currentPage = ref<number>(1)

// ─── Checkbox ─────────────────────────────────────────────────────────────────
const selectedIds = ref<number[]>([])

const isAllSelected = computed(
  () => paginatedFaqs.value.length > 0 && paginatedFaqs.value.every(f => selectedIds.value.includes(f.id))
)

const toggleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedIds.value = paginatedFaqs.value.map(f => f.id)
  } else {
    selectedIds.value = []
  }
}

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredFaqs = computed(() => {
  const q = filters.value.search.toLowerCase()
  let list = faqs.value.filter(f =>
    !q || `${f.pertanyaan} ${f.deskripsi} ${f.kategori}`.toLowerCase().includes(q)
  )
  if (sortKey.value) {
    const key = sortKey.value
    list = [...list].sort((a, b) => {
      const cmp = a[key].localeCompare(b[key], 'id')
      return sortAsc.value ? cmp : -cmp
    })
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredFaqs.value.length / rowsPerPage.value)))

const paginatedFaqs = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return filteredFaqs.value.slice(start, start + rowsPerPage.value)
})

const paginationPages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: number[] = []
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 2) {
    pages.push(1, 2, 3, 4, 5)
  } else if (current >= total - 1) {
    pages.push(total - 2, total - 1, total)
  } else {
    pages.push(current - 1, current, current + 1)
  }
  return pages
})

watch([() => filters.value.search, rowsPerPage], () => { currentPage.value = 1 })

// ─── Modal ────────────────────────────────────────────────────────────────────
const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)
const isSaving = ref(false)

const showNewKategori = ref(false)
const newKategori = ref('')


const form = ref({ pertanyaan: '', deskripsi: '', kategori: '' })

const openAdd = () => {
  isEditMode.value = false
  editingId.value = null
  form.value = { pertanyaan: '', deskripsi: '', kategori: '' }
  showModal.value = true
}

const openEdit = (faq: Faq) => {
  isEditMode.value = true
  editingId.value = faq.id
  form.value = { pertanyaan: faq.pertanyaan, deskripsi: faq.deskripsi, kategori: faq.kategori }
  showModal.value = true
}

const saveFaq = async () => {
  const finalKategori = showNewKategori.value && newKategori.value.trim()
    ? newKategori.value.trim()
    : form.value.kategori

  if (!form.value.pertanyaan || !finalKategori) {
    showToast('Validasi', 'Pertanyaan dan kategori wajib diisi.', 'warning')
    return
  }

  isSaving.value = true
  try {
    const payload = {
      pertanyaan: form.value.pertanyaan,
      deskripsi: form.value.deskripsi,
      kategori: finalKategori,
    }

    if (isEditMode.value && editingId.value !== null) {
      await updateFaq(editingId.value, payload)
      showToast('Berhasil', 'FAQ berhasil diperbarui.', 'success')
    } else {
      await createFaq(payload)
      showToast('Berhasil', 'FAQ berhasil ditambahkan.', 'success')
    }

    showModal.value = false
    await Promise.all([fetchFaqs(), loadCategories()])
  } catch {
    showToast('Gagal', 'Terjadi kesalahan saat menyimpan FAQ.', 'error')
  } finally {
    isSaving.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
const confirmDeleteOpen = ref(false)
const itemToDelete = ref<Faq | null>(null)

const openDelete = (faq: Faq) => {
  itemToDelete.value = faq
  confirmDeleteOpen.value = true
}

const deleteNow = async () => {
  if (!itemToDelete.value) return
  try {
    await deleteFaq(itemToDelete.value.id)
    showToast('Berhasil', 'FAQ berhasil dihapus.', 'success')
    await Promise.all([fetchFaqs(), loadCategories()])
  } catch {
    showToast('Gagal', 'Terjadi kesalahan saat menghapus FAQ.', 'error')
  } finally {
    confirmDeleteOpen.value = false
    itemToDelete.value = null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const refreshData = async () => {
  currentPage.value = 1
  await fetchFaqs()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) {
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return dateStr
  }
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const showToast = (title: string, message: string, color: 'success' | 'error' | 'warning' | 'primary' = 'success') => {
  toast.add({
    title,
    description: message,
    color,
    icon: color === 'success' ? 'i-lucide-check-circle' : color === 'error' ? 'i-lucide-x-circle' : 'i-lucide-info',
  })
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchFaqs(), loadCategories()])
})
</script>

<style scoped>
* {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { border-radius: 10px; }
::-webkit-scrollbar-thumb { border-radius: 10px; }
</style>