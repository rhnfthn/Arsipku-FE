<template>
  <div class="pt-5 bg-gray-50 dark:bg-gray-900">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-2">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white">
          {{ t('pt_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        {{ t('pt_add_button') }}
      </button>
    </div>

    <Teleport to="body">
      <Modal v-model="showAddModal" @save="saveAdd" size="xl">
        <template #title>
          <div class="ml-5 mb-3 mt-3">
            <Heading variant="heading9b" class="font-semibold text-sm dark:text-white">
              {{ isEditMode ? t('pt_modal_title_edit') : t('pt_modal_title_add') }}
            </Heading>
          </div>
        </template>

        <div class="flex flex-col gap-1">
          <Heading variant="body2m" class="dark:text-gray-200">
            {{ t('pt_label_long_url') }}<span class="text-red-500">*</span>
          </Heading>
          <UInput
            color="primary"
            :placeholder="t('pt_placeholder_long_url')"
            size="lg"
            v-model="addForm.LUrl"
            class="mb-3"
          />

          <Heading variant="body2m" class="dark:text-gray-200">
            {{ t('pt_label_short_url') }} <span class="text-red-500">*</span>
          </Heading>
          <UInput
            color="primary"
            :placeholder="t('pt_placeholder_short_url')"
            size="lg"
            v-model="addForm.SUrl"
            class="mb-3"
          />

          <Heading variant="body2m" class="dark:text-gray-200">
            {{ t('pt_label_keterangan') }}
          </Heading>
          <UInput
            color="primary"
            :placeholder="t('pt_placeholder_keterangan')"
            size="lg"
            v-model="addForm.keterangan"
            class="mb-3"
          />
        </div>
      </Modal>
    </Teleport>

    <!-- CARD FULL HEIGHT -->
    <div
      class="flex flex-col mt-2 w-full flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div class="flex flex-wrap gap-2 p-3 items-center dark:border-gray-700">
        <button
          @click="toggleSort"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition"
          title="Urutkan"
        >
          <ArrowUpDown class="w-4 h-4" />
        </button>

        <button
          @click="refreshData"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition"
          :disabled="isRefreshing"
          title="Refresh"
        >
          <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
        </button>

        <div class="relative flex-1 w-full justify-between">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            :placeholder="t('pt_search_placeholder')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>
      </div>

      <div class="w-full overflow-auto">
        <table class="min-w-full text-sm border-collapse">
          <thead class="bg-primary dark:bg-primary-700 text-white sticky top-0 z-10">
            <tr class="p-3">
              <th class="px-4 py-3 text-left font-semibold">{{ t('pt_col_tanggal') }}</th>
              <th class="px-4 py-3 text-left font-semibold">{{ t('pt_col_original') }}</th>
              <th class="px-4 py-3 text-left font-semibold">{{ t('pt_col_modified') }}</th>
              <th class="px-4 py-3 text-left font-semibold">{{ t('pt_col_keterangan') }}</th>
              <th class="px-4 py-3 text-center font-semibold">{{ t('pt_col_aksi') }}</th>
            </tr>
          </thead>

          <tbody>
            <!-- SKELETON LOADING -->
            <template v-if="loading">
              <tr
                v-for="i in 5"
                :key="'skeleton-' + i"
                class="animate-pulse border-b border-gray-200 dark:border-gray-700"
              >
                <td class="px-3 py-2">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </td>
                <td class="px-3 py-2">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- DATA ROWS -->
            <template v-else>
              <tr
                v-for="(row, index) in sortedData"
                :key="index"
                class="hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition"
              >
                <!-- Tanggal -->
                <td class="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white">
                  {{
                    new Date(row.tanggal).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  }}
                </td>

                <!-- URL Asli -->
                <td class="px-3 py-2 max-w-[250px]">
                  <a
                    :href="row.LUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary-600 dark:text-primary-400 underline hover:text-primary-800 dark:hover:text-primary-300 break-all transition"
                    :title="row.LUrl"
                  >
                    {{ truncateUrl(row.LUrl, 35) }}
                  </a>
                </td>

                <!-- URL Modifikasi -->
                <td class="px-3 py-2 max-w-[260px] whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-mono text-xs text-gray-900 dark:text-white break-all"
                      :title="row.SUrl"
                    >
                      {{ row.SUrl }}
                    </span>

                    <button
                      class="p-1.5 rounded hover:bg-primary-300 dark:hover:bg-gray-700 transition"
                      @click="
                        () => {
                          copy(row.SUrl)
                          toast.add({
                            title: t('pt_toast_copied'),
                            color: 'success',
                            icon: 'i-lucide-copy'
                          })
                        }
                      "
                    >
                      <Copy class="w-4 h-4 text-gray-600 hover:text-white dark:text-gray-300" />
                    </button>
                  </div>
                </td>

                <!-- Keterangan -->
                <td class="px-3 py-2 max-w-[300px] text-gray-700 dark:text-gray-300">
                  {{ row.keterangan }}
                </td>

                <!-- ACTION -->
                <td class="px-3 py-2 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <!-- EDIT -->
                    <button
                      class="p-2 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
                      @click="openEdit(row, index)"
                      :title="t('tit_tooltip_edit')"
                    >
                      <Pencil class="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </button>

                    <!-- DELETE -->
                    <button
                      class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      @click="openDeleteConfirm(index)"
                      :title="t('popup_hapus')"
                    >
                      <Trash2 class="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>

              <!-- EMPTY STATE -->
              <tr v-if="sortedData.length === 0">
                <td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('pt_empty') }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <ConfirmPopup
          v-model="showDeleteConfirm"
          type="danger"
          :title="t('pt_delete_title')"
          :message="`${t('pt_delete_title').replace('?', '')} ${data[deleteIndex]?.SUrl}?`"
          :confirm-text="t('pt_delete_confirm')"
          :cancel-text="t('pt_delete_cancel')"
          @confirm="confirmDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { ref, computed, watch, onMounted } from 'vue'
import { Search, ArrowUpDown, RotateCcw, Plus, Copy, Trash2, Pencil } from 'lucide-vue-next'
import Heading from '~/components/Heading.vue'
import ConfirmPopup from '@/components/ConfirmPopup.vue'
import { useUrl } from '~/composables/useUrl'
import { useI18n } from 'vue-i18n'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
const toast = useToast()
const { copy } = useClipboard()
const { data, total, isLoading, fetchShortUrls, createShortUrl, updateShortUrl, deleteShortUrl } =
  useUrl()

const generateRandomString = (length = 5) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

type Payment = {
  id?: number
  tanggal: string
  LUrl: string
  SUrl: string
  keterangan: string
}

const loading = computed(() => isLoading.value)
const isRefreshing = ref(false)
const search = ref('')

const showAddModal = ref(false)

const addForm = ref({
  LUrl: '',
  SUrl: '',
  keterangan: ''
})

const saveAdd = async () => {
  if (!addForm.value.LUrl) {
    toast.add({
      title: t('pt_toast_url_empty'),
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
    return
  }

  const alias = addForm.value.SUrl ? addForm.value.SUrl : generateRandomString()

  try {
    if (isEditMode.value && editItemId.value !== null) {
      // EDIT MODE
      await updateShortUrl({
        id: editItemId.value,
        url: addForm.value.LUrl,
        keterangan: addForm.value.keterangan,
        alias
      })
      toast.add({
        title: t('pt_toast_updated'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    } else {
      // ADD MODE
      await createShortUrl({
        url: addForm.value.LUrl,
        keterangan: addForm.value.keterangan,
        alias
      })
      toast.add({
        title: t('pt_toast_added'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }

    await fetchData()
  } catch (err: any) {
    toast.add({
      title: err?.response?.data?.message ?? t('pt_toast_save_failed'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    showAddModal.value = false
    isEditMode.value = false
    editIndex.value = null
    editItemId.value = null
    addForm.value = { LUrl: '', SUrl: '', keterangan: '' }
  }
}

const openAdd = () => {
  isEditMode.value = false
  editIndex.value = null
  editItemId.value = null
  addForm.value = { LUrl: '', SUrl: '', keterangan: '' }
  showAddModal.value = true
}

const sortOrder = ref<'asc' | 'desc'>('desc')

const fetchData = async () => {
  await fetchShortUrls({
    page: 0,
    size: 10,
    orderby: 'udate',
    sortby: sortOrder.value,
    cari: search.value
  })
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  fetchData()
}

const sortedData = computed(() => data.value)

const truncateUrl = (url: string, max = 20) => {
  if (!url) return ''
  return url.length > max ? url.slice(0, max) + '.....' : url
}

const isEditMode = ref(false)
const editIndex = ref<number | null>(null)
const editItemId = ref<number | null>(null)

const openEdit = (row: Payment & { id?: number; alias?: string }, index: number) => {
  isEditMode.value = true
  editIndex.value = index
  editItemId.value = row.id ?? null

  addForm.value = {
    LUrl: row.LUrl,
    SUrl: row.alias ?? '',
    keterangan: row.keterangan
  }

  showAddModal.value = true
}

const showDeleteConfirm = ref(false)
const deleteIndex = ref<number | null>(null)

const openDeleteConfirm = (index: number) => {
  deleteIndex.value = index
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (deleteIndex.value !== null) {
    const item = data.value[deleteIndex.value]
    try {
      await deleteShortUrl(item.id)
      toast.add({ title: t('pt_toast_deleted'), color: 'success', icon: 'i-lucide-circle-check' })
      await fetchData()
    } catch (err: any) {
      toast.add({
        title: err?.response?.data?.message ?? t('pt_toast_delete_failed'),
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
    }
  }

  showDeleteConfirm.value = false
  deleteIndex.value = null
}

const refreshData = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true

  try {
    await fetchData()
  } catch (err) {
    console.error('Gagal refresh data', err)
  } finally {
    isRefreshing.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchData(), 400)
})

onMounted(() => fetchData())

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('pt_title'), to: '/admin/penyingkat-tautan' }
])
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
