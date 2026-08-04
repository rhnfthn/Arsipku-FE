<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Penataan Arsip Inaktif</Heading>
        <PageHeader :items="breadcrumbs" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Daftar arsip inaktif yang sudah diterima dan siap ditata.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <div class="relative flex-1">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input v-model="searchInput" type="text" placeholder="Cari nomor/perihal/sekretaris..."
            class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            @input="onSearchInput" />
        </div>
        <select v-model="filterStatus" class="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" @change="fetchData">
          <option value="">Semua Status</option>
          <option value="ARSIP_INAKTIF_DITERIMA">Diterima</option>
          <option value="SELESAI">Selesai</option>
        </select>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
              <tr>
                <th class="px-3 py-3 text-left font-medium">No</th>
                <th class="px-3 py-3 text-left font-medium">Nomor Usulan</th>
                <th class="px-3 py-3 text-left font-medium">Sekretaris</th>
                <th class="px-3 py-3 text-left font-medium">Arsip</th>
                <th class="px-3 py-3 text-left font-medium">Lokasi</th>
                <th class="px-3 py-3 text-left font-medium">Status</th>
                <th class="px-3 py-3 text-left font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="isLoading">
                <td colspan="7" class="px-3 py-10 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
              <tr v-else-if="list.length === 0">
                <td colspan="7" class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">Belum ada arsip untuk ditata.</td>
              </tr>
              <tr v-for="(item, index) in list" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="px-3 py-3">{{ (page - 1) * limit + index + 1 }}</td>
                <td class="px-3 py-3 font-medium text-gray-800 dark:text-white">{{ item.nomorUsulan }}</td>
                <td class="px-3 py-3">{{ item.sekretarisName }}</td>
                <td class="px-3 py-3">{{ item.arsipPerihal }}</td>
                <td class="px-3 py-3">{{ item.lokasiPenataan || '-' }}</td>
                <td class="px-3 py-3">
                  <UBadge :color="item.status === 'SELESAI' ? 'success' : 'primary'" variant="soft">
                    {{ item.status === 'SELESAI' ? 'Selesai' : 'Diterima' }}
                  </UBadge>
                </td>
                <td class="px-3 py-3">
                  <NuxtLink :to="`/maintenance/penataan-arsip-inaktif/${item.id}`"
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-800 transition-colors">
                    <UIcon name="i-lucide-eye" class="w-3.5 h-3.5" /> Detail
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4">
        <Pagination :current-page="page" :total-pages="totalPages" :total-items="total" :rows-per-page="limit"
          :rows-options="[10, 20, 50]" @update:page="onPageChange" @update:rows-per-page="onLimitChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import type { TuUsulanItem } from '~/types/tu-verifikasi'

definePageMeta({ middleware: ['auth'] })

const { fetchPenataanList } = useTuVerifikasi()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penataan Arsip Inaktif', to: '/maintenance/penataan-arsip-inaktif' },
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
  searchDebounce = setTimeout(() => { page.value = 1; fetchData() }, 400)
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await fetchPenataanList({
      search: searchInput.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value, limit: limit.value,
    })
    const payload = res?.data ?? res
    list.value = payload?.data || []
    total.value = payload?.meta?.total || 0
    totalPages.value = payload?.meta?.totalPages || 1
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: 'Gagal mengambil data.', color: 'error' })
  } finally { isLoading.value = false }
}

const onPageChange = (p: number) => { page.value = p; fetchData() }
const onLimitChange = (l: number) => { limit.value = l; page.value = 1; fetchData() }

onMounted(() => fetchData())
</script>