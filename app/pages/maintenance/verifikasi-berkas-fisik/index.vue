<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Verifikasi Berkas Fisik</Heading>
        <PageHeader :items="breadcrumbs" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Verifikasi kecocokan berkas fisik dengan usulan pindah arsip.
        </p>
      </div>

      <!-- Filter & Search -->
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <div class="relative flex-1">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Cari nomor/perihal/sekretaris..."
            class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            @input="onSearchInput"
          />
        </div>
        <select
          v-model="filterStatus"
          class="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          @change="fetchData"
        >
          <option value="">Semua Status</option>
          <option value="DIKIRIM">Belum Diverifikasi</option>
          <option value="BERKAS_FISIK_SESUAI">Sesuai</option>
          <option value="BERKAS_FISIK_TIDAK_SESUAI">Tidak Sesuai</option>
          <option value="MENUNGGU_VERIFIKASI_PERSETUJUAN_TU">Diajukan ke Atasan TU</option>
        </select>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
              <tr>
                <th class="px-3 py-3 text-left font-medium">No</th>
                <th class="px-3 py-3 text-left font-medium">Nomor Usulan</th>
                <th class="px-3 py-3 text-left font-medium">Sekretaris</th>
                <th class="px-3 py-3 text-left font-medium">Arsip</th>
                <th class="px-3 py-3 text-left font-medium">Status Berkas</th>
                <th class="px-3 py-3 text-left font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="isLoading">
                <td colspan="6" class="px-3 py-10 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
              <tr v-else-if="list.length === 0">
                <td colspan="6" class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
                  Belum ada berkas untuk diverifikasi.
                </td>
              </tr>
              <tr
                v-for="(item, index) in list"
                :key="item.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <td class="px-3 py-3">{{ (page - 1) * limit + index + 1 }}</td>
                <td class="px-3 py-3 font-medium text-gray-800 dark:text-white">{{ item.nomorUsulan }}</td>
                <td class="px-3 py-3">{{ item.sekretarisName }}</td>
                <td class="px-3 py-3">{{ item.arsipPerihal }}</td>
                <td class="px-3 py-3">
                  <UBadge :color="berkasStatusColor(item)" variant="soft">
                    {{ berkasStatusLabel(item) }}
                  </UBadge>
                </td>
                <td class="px-3 py-3">
                  <NuxtLink
                    :to="`/maintenance/verifikasi-berkas-fisik/${item.id}`"
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-800 transition-colors"
                  >
                    <UIcon name="i-lucide-eye" class="w-3.5 h-3.5" /> Verifikasi
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import type { TuUsulanItem } from '~/types/tu-verifikasi'

definePageMeta({ middleware: ['auth'] })

const { fetchNotifikasiList } = useTuVerifikasi()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Verifikasi Berkas Fisik', to: '/maintenance/verifikasi-berkas-fisik' },
])

const list = ref<TuUsulanItem[]>([])
const isLoading = ref(false)
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const totalPages = ref(1)

const searchInput = ref('')
const filterStatus = ref('')

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
    const res = await fetchNotifikasiList({
      search: searchInput.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value,
      limit: limit.value,
    })
    const payload = res?.data ?? res
    list.value = payload?.data || []
    total.value = payload?.meta?.total || 0
    totalPages.value = payload?.meta?.totalPages || 1
  } catch (error: any) {
    console.error('Fetch verifikasi berkas error:', error)
    useToast().add({ title: 'Gagal', description: 'Gagal mengambil data.', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

const onPageChange = (p: number) => { page.value = p; fetchData() }
const onLimitChange = (l: number) => { limit.value = l; page.value = 1; fetchData() }

const berkasStatusLabel = (item: TuUsulanItem) => {
  if (item.status === 'BERKAS_FISIK_SESUAI') return 'Sesuai'
  if (item.status === 'BERKAS_FISIK_TIDAK_SESUAI') return 'Tidak Sesuai'
  if (item.status === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU') return 'Diajukan ke Atasan TU'
  if (item.physicalVerifiedAt) return 'Sudah Diverifikasi'
  return 'Belum Verifikasi'
}

const berkasStatusColor = (item: TuUsulanItem) => {
  if (item.status === 'BERKAS_FISIK_SESUAI') return 'success'
  if (item.status === 'BERKAS_FISIK_TIDAK_SESUAI') return 'error'
  if (item.status === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU') return 'primary'
  if (item.physicalVerifiedAt) return 'neutral'
  return 'warning'
}

onMounted(() => fetchData())
</script>