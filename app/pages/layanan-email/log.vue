<template>
  <div class="pt-5 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-4">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white">
          Log Email
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
      <button
        @click="fetchLogs"
        class="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition"
      >
        <RotateCcw class="w-4 h-4" />
        Refresh
      </button>
    </div>

    <!-- FILTER -->
    <div class="flex flex-wrap gap-2 mb-3">
      <select
        v-model="filterStatus"
        @change="fetchLogs"
        class="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="">Semua Status</option>
        <option value="success">Success</option>
        <option value="failed">Failed</option>
      </select>
    </div>

    <!-- TABLE -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Waktu</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Pengirim</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Subjek</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">To</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Surat</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Lampiran</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">Memuat data...</td>
            </tr>
            <tr v-else-if="logs.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">Tidak ada log email</td>
            </tr>
            <tr
              v-else
              v-for="log in logs"
              :key="log.id"
              class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <!-- Waktu -->
              <td class="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                {{ formatDateTime(log.created_at) }}
              </td>

              <!-- Pengirim -->
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                <div class="flex flex-col">
                  <span class="font-medium">{{ log.sender_nama || log.sender_persnum || '-' }}</span>
                  <span class="text-xs text-gray-400">{{ log.from_as }}</span>
                </div>
              </td>

              <!-- Subjek -->
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="log.subjek">
                {{ log.subjek }}
              </td>

              <!-- To -->
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="log.to">
                {{ log.to }}
              </td>

              <!-- Surat -->
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                <div class="flex flex-col">
                  <span class="text-xs font-medium">{{ log.nomor_surat || '-' }}</span>
                  <span class="text-xs text-gray-400 max-w-xs truncate" :title="log.perihal">{{ log.perihal || '-' }}</span>
                </div>
              </td>

              <!-- Lampiran -->
              <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                {{ log.lampiran_count || 0 }}
              </td>

              <!-- Status -->
              <td class="px-4 py-3">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="log.status === 'success'
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'"
                >
                  {{ log.status === 'success' ? 'Terkirim' : 'Gagal' }}
                </span>
                <p v-if="log.status === 'failed' && log.error_message" class="text-xs text-red-400 mt-1 max-w-xs truncate" :title="log.error_message">
                  {{ log.error_message }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          Hal {{ pagination.page }} dari {{ pagination.totalPages }} — Total {{ pagination.total }} log
        </span>
        <div class="flex gap-1">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page <= 1"
            class="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Prev
          </button>
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.totalPages"
            class="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import Heading from '~/components/Heading.vue'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { apiGet } = useApi()

const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Log Email', to: '/layanan-email/log' },
]

const logs = ref<any[]>([])
const loading = ref(false)
const filterStatus = ref('')
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
})

const formatDateTime = (dt: string) => {
  if (!dt) return '-'
  const d = new Date(dt)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(pagination.value.page))
    params.set('limit', String(pagination.value.limit))
    if (filterStatus.value) params.set('status', filterStatus.value)

    const res = await apiGet(`/mail-service/logs?${params.toString()}`)
    logs.value = res?.data || []
    if (res?.pagination) pagination.value = res.pagination
  } catch (err) {
    logs.value = []
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  if (page < 1 || page > pagination.value.totalPages) return
  pagination.value.page = page
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})
</script>
