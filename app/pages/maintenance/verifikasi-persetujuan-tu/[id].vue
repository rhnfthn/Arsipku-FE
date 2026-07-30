<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Verifikasi Persetujuan — ${item?.nomorUsulan ?? ''}`" :items="breadcrumbs" />
      <NuxtLink to="/maintenance/verifikasi-persetujuan-tu"
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
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span><p class="text-gray-900 dark:text-white font-medium">{{ item.atasanName }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">TU Pengirim</span><p class="text-gray-900 dark:text-white font-medium">{{ item.tuName || '-' }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Arsip</span><p class="text-gray-900 dark:text-white font-medium">{{ item.arsipPerihal }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Diajukan</span><p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tuApprovedAt) }}</p></div>
          </div>
        </div>

        <!-- Verifikasi Penerimaan -->
        <div v-if="item.status === 'DIKIRIM'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Verifikasi Penerimaan</h3>
          <div class="mb-4">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan Verifikasi (opsional)</label>
            <textarea v-model="catatan" rows="3" placeholder="Catatan verifikasi (opsional)..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
          </div>
          <div class="flex gap-2">
            <button @click="showTolakModal = true" :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors">
              <UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" /> Tolak
            </button>
            <button @click="onSetujuiPenerimaan" :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 transition-colors">
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-check" class="w-4 h-4 mr-1 inline" /> Setujui Penerimaan
            </button>
          </div>
        </div>

        <!-- Persetujuan Terakhir -->
        <div v-if="item.status === 'DISETUJUI_PERSETUJUAN_TU'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Persetujuan Terakhir</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Penerimaan telah disetujui. Lanjutkan ke persetujuan terakhir untuk menerima arsip.</p>
          <div class="mb-4">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan (opsional)</label>
            <textarea v-model="catatanTerakhir" rows="3" placeholder="Catatan (opsional)..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
          </div>
          <button @click="onSetujuiTerakhir" :disabled="actionLoading"
            class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 transition-colors">
            <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
            <UIcon v-else name="i-lucide-check-circle" class="w-4 h-4 mr-1 inline" /> Setujui Persetujuan Terakhir
          </button>
        </div>

        <!-- Status info -->
        <div v-if="item.status === 'ARSIP_INAKTIF_DITERIMA'" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Arsip Diterima</h3>
              <p class="text-sm text-blue-600 dark:text-blue-400">Persetujuan terakhir selesai. Arsip dikembalikan ke TU untuk penataan.</p>
            </div>
          </div>
        </div>

        <div v-if="item.status === 'SELESAI'" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl shadow-sm p-5">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <h3 class="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Selesai</h3>
              <p class="text-sm text-green-600 dark:text-green-400">Proses pemindahan arsip selesai.</p>
            </div>
          </div>
        </div>

        <div v-if="item.status === 'DITOLAK_PERSETUJUAN_TU'" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <h3 class="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Ditolak</h3>
              <p class="text-sm text-red-600 dark:text-red-400">{{ item.rejectedNote || 'Usulan ditolak.' }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">Usulan tidak ditemukan</div>

    <!-- Modal Tolak -->
    <Teleport to="body">
      <div v-if="showTolakModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]" @click="showTolakModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] max-w-[480px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tolak Penerimaan</h3>
            <button @click="showTolakModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Alasan Penolakan *</label>
            <textarea v-model="alasanTolak" rows="4" placeholder="Isi alasan penolakan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-red-500 resize-none"></textarea>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showTolakModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button @click="onConfirmTolak" :disabled="!alasanTolak.trim() || actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50">
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" /> Tolak
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import type { TuUsulanItem } from '~/types/tu-verifikasi'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { fetchAtasanTuDetail, setujuiPenerimaan, tolakPenerimaan, setujuiTerakhir } = useTuVerifikasi()

const item = ref<TuUsulanItem | null>(null)
const loading = ref(true)
const actionLoading = ref(false)
const catatan = ref('')
const catatanTerakhir = ref('')
const showTolakModal = ref(false)
const alasanTolak = ref('')

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Verifikasi Persetujuan', to: '/maintenance/verifikasi-persetujuan-tu' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/verifikasi-persetujuan-tu/${route.params.id}` },
])

const formatDate = (d: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await fetchAtasanTuDetail(route.params.id as string)
    item.value = res?.data ?? res
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: 'Gagal memuat detail.', color: 'error' })
  } finally { loading.value = false }
}

const onSetujuiPenerimaan = async () => {
  if (!item.value) return
  actionLoading.value = true
  try {
    await setujuiPenerimaan(item.value.id, { catatanVerifikasi: catatan.value })
    useToast().add({ title: 'Berhasil', description: 'Penerimaan disetujui.', color: 'success' })
    await loadDetail()
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: e?.data?.message || 'Gagal menyetujui.', color: 'error' })
  } finally { actionLoading.value = false }
}

const onConfirmTolak = async () => {
  if (!item.value || !alasanTolak.value.trim()) return
  actionLoading.value = true
  try {
    await tolakPenerimaan(item.value.id, { alasanPenolakan: alasanTolak.value.trim() })
    showTolakModal.value = false
    alasanTolak.value = ''
    useToast().add({ title: 'Berhasil', description: 'Penerimaan ditolak.', color: 'success' })
    await loadDetail()
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: e?.data?.message || 'Gagal menolak.', color: 'error' })
  } finally { actionLoading.value = false }
}

const onSetujuiTerakhir = async () => {
  if (!item.value) return
  actionLoading.value = true
  try {
    await setujuiTerakhir(item.value.id, { catatanVerifikasi: catatanTerakhir.value })
    useToast().add({ title: 'Berhasil', description: 'Persetujuan terakhir selesai. Arsip diterima.', color: 'success' })
    await loadDetail()
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: e?.data?.message || 'Gagal menyetujui terakhir.', color: 'error' })
  } finally { actionLoading.value = false }
}

onMounted(() => loadDetail())
</script>