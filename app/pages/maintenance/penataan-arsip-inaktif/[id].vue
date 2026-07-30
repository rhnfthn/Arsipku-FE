<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Penataan Arsip Inaktif — ${item?.nomorUsulan ?? ''}`" :items="breadcrumbs" />
      <NuxtLink to="/maintenance/penataan-arsip-inaktif"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <template v-else-if="item">
      <div class="max-w-4xl space-y-5">
        <!-- Informasi Usulan -->
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Informasi Usulan</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span><p class="text-gray-900 dark:text-white font-medium">{{ item.nomorUsulan }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Sekretaris</span><p class="text-gray-900 dark:text-white font-medium">{{ item.sekretarisName }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Arsip</span><p class="text-gray-900 dark:text-white font-medium">{{ item.arsipPerihal }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Diterima</span><p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.receivedAt) }}</p></div>
          </div>
        </div>

        <!-- Penataan Arsip -->
        <div v-if="item.status === 'ARSIP_INAKTIF_DITERIMA'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Penataan Arsip</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Lokasi Penyimpanan</label>
              <input v-model="form.lokasi" type="text" placeholder="Lokasi penyimpanan..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Rak</label>
              <input v-model="form.rak" type="text" placeholder="Rak..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Baris</label>
              <input v-model="form.baris" type="text" placeholder="Baris..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Kolom</label>
              <input v-model="form.kolom" type="text" placeholder="Kolom..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Keterangan</label>
            <textarea v-model="form.keterangan" rows="3" placeholder="Keterangan penataan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
          </div>
          <div class="mt-4">
            <button @click="onSelesai" :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 transition-colors">
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-check-circle" class="w-4 h-4 mr-1 inline" /> Selesai Penataan
            </button>
          </div>
        </div>

        <!-- Status Selesai -->
        <div v-if="item.status === 'SELESAI'" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl shadow-sm p-5">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <h3 class="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Penataan Selesai</h3>
              <div class="text-sm text-green-600 dark:text-green-400 space-y-1">
                <p>Lokasi: {{ item.lokasiPenataan || '-' }}</p>
                <p>Rak: {{ item.rak || '-' }} | Baris: {{ item.baris || '-' }} | Kolom: {{ item.kolom || '-' }}</p>
                <p v-if="item.keteranganPenataan">Keterangan: {{ item.keteranganPenataan }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">Arsip tidak ditemukan</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import type { TuUsulanItem } from '~/types/tu-verifikasi'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { fetchPenataanDetail, selesaiPenataan } = useTuVerifikasi()

const item = ref<TuUsulanItem | null>(null)
const loading = ref(true)
const actionLoading = ref(false)

const form = reactive({
  lokasi: '',
  rak: '',
  baris: '',
  kolom: '',
  keterangan: '',
})

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penataan Arsip Inaktif', to: '/maintenance/penataan-arsip-inaktif' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/penataan-arsip-inaktif/${route.params.id}` },
])

const formatDate = (d: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await fetchPenataanDetail(route.params.id as string)
    item.value = res?.data ?? res
    if (item.value) {
      form.lokasi = item.value.lokasiPenataan || ''
      form.rak = item.value.rak || ''
      form.baris = item.value.baris || ''
      form.kolom = item.value.kolom || ''
      form.keterangan = item.value.keteranganPenataan || ''
    }
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: 'Gagal memuat detail.', color: 'error' })
  } finally { loading.value = false }
}

const onSelesai = async () => {
  if (!item.value) return
  actionLoading.value = true
  try {
    await selesaiPenataan(item.value.id, {
      lokasi: form.lokasi || undefined,
      rak: form.rak || undefined,
      baris: form.baris || undefined,
      kolom: form.kolom || undefined,
      keterangan: form.keterangan || undefined,
    })
    useToast().add({ title: 'Berhasil', description: 'Penataan arsip selesai.', color: 'success' })
    await loadDetail()
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: e?.data?.message || 'Gagal menyelesaikan penataan.', color: 'error' })
  } finally { actionLoading.value = false }
}

onMounted(() => loadDetail())
</script>