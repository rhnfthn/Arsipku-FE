<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="`Verifikasi Persetujuan — ${item?.nomorUsulan ?? ''}`"
        :items="breadcrumbs"
      />
      <NuxtLink
        to="/maintenance/verifikasi-persetujuan-tu"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="item">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Kiri: Informasi Usulan + Daftar Arsip + Berita Acara -->
        <div class="lg:col-span-8 space-y-5">
          <!-- Informasi Usulan -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Informasi Usulan</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.nomorUsulan }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Diajukan ke TU</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggalDikirim) }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Sekretaris</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.sekretarisName }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial Sekretaris</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.atasanName || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">TU Pengirim</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.tuName || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Jumlah Arsip</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ daftarBerkas.length }} berkas</p>
              </div>
            </div>
          </div>

          <!-- Daftar Arsip -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Daftar Arsip</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="border-b-2 border-gray-200 dark:border-gray-600">
                    <th class="text-left py-2 px-2 text-gray-500 w-10">No</th>
                    <th class="text-left py-2 px-2 text-gray-500">Kode Berkas</th>
                    <th class="text-left py-2 px-2 text-gray-500">Nama Berkas</th>
                    <th class="text-left py-2 px-2 text-gray-500">Tanggal Retensi Habis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(berkas, idx) in daftarBerkas"
                    :key="idx"
                    class="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td class="py-2 px-2 text-gray-600 dark:text-gray-300">{{ idx + 1 }}</td>
                    <td class="py-2 px-2 text-gray-700 dark:text-gray-200">{{ berkas.kode || '-' }}</td>
                    <td class="py-2 px-2 text-gray-700 dark:text-gray-200">{{ berkas.perihal }}</td>
                    <td class="py-2 px-2 text-gray-500">{{ formatDate(berkas.tanggalRetensiHabis) }}</td>
                  </tr>
                  <tr v-if="daftarBerkas.length === 0">
                    <td colspan="4" class="py-4 text-center text-gray-400 italic">Tidak ada arsip</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Berita Acara Serah Terima -->
          <div v-if="item.beritaAcaraUrl" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Berita Acara Serah Terima</h3>
            <div class="flex flex-wrap gap-2">
              <a
                :href="item.beritaAcaraUrl"
                target="_blank"
                class="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-800 transition-colors"
              >
                <UIcon name="i-lucide-download" class="w-4 h-4" /> Download PDF
              </a>
              <button
                @click="printBeritaAcara"
                class="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <UIcon name="i-lucide-printer" class="w-4 h-4" /> Print
              </button>
            </div>
          </div>

          <!-- Status: Ditolak -->
          <div
            v-if="item.status === 'DITOLAK_PERSETUJUAN_TU'"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Penerimaan Ditolak</h3>
                <p class="text-sm text-red-600 dark:text-red-400">{{ item.rejectedNote || 'Penerimaan usulan ditolak oleh Atasan TU.' }}</p>
              </div>
            </div>
          </div>

          <!-- Status: Diterima (final) -->
          <div
            v-if="item.status === 'ARSIP_INAKTIF_DITERIMA' || item.status === 'SELESAI'"
            class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Arsip Diterima</h3>
                <p class="text-sm text-emerald-600 dark:text-emerald-400">Usulan telah diterima dan disetujui secara final. TU dapat melanjutkan ke penataan arsip inaktif.</p>
              </div>
            </div>
          </div>

          <!-- Tombol Aksi (di bawah card detail) -->
          <div v-if="canAct" class="flex flex-wrap gap-2">
            <button
              @click="openTolakModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" /> Tolak
            </button>
            <button
              v-if="item.status === 'DIKIRIM' || item.status === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU'"
              @click="openSetujuiModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-check" class="w-4 h-4 mr-1 inline" /> Setujui
            </button>
            <button
              v-if="item.status === 'DISETUJUI_PERSETUJUAN_TU' || item.status === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU'"
              @click="openSetujuiTerakhirModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-check-check" class="w-4 h-4 mr-1 inline" /> Setujui Persetujuan Terakhir
            </button>
          </div>
        </div>

        <!-- Kanan: Timeline Riwayat -->
        <div class="lg:col-span-4 space-y-5">
          <TimelineRiwayat :item="item as any" />
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      Usulan tidak ditemukan
    </div>

    <!-- Modal Setujui Penerimaan -->
    <Teleport to="body">
      <div v-if="showSetujuiModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]" @click="showSetujuiModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-[520px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Persetujuan</h3>
            <button @click="showSetujuiModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Apakah Anda yakin ingin menyetujui penerimaan usulan ini?
            </p>
            <div class="space-y-2 mb-4 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item?.nomorUsulan ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Sekretaris</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item?.sekretarisName ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">TU Pengirim</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item?.tuName ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Jumlah Arsip</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ daftarBerkas.length }} berkas</p>
              </div>
            </div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan Verifikasi (opsional)</label>
            <textarea
              v-model="catatanVerifikasi"
              rows="3"
              placeholder="Catatan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            ></textarea>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showSetujuiModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button
              @click="onConfirmSetujui"
              :disabled="actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Setujui
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Tolak Penerimaan -->
    <Teleport to="body">
      <div v-if="showTolakModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]" @click="showTolakModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-[480px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tolak Persetujuan</h3>
            <button @click="showTolakModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Berikan alasan penolakan penerimaan.
            </p>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Alasan Penolakan *</label>
            <textarea
              v-model="alasanPenolakan"
              rows="4"
              placeholder="Isi alasan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-red-500 resize-none"
            ></textarea>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showTolakModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button
              @click="onConfirmTolak"
              :disabled="!alasanPenolakan.trim() || actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Tolak
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Setujui Persetujuan Terakhir -->
    <Teleport to="body">
      <div v-if="showSetujuiTerakhirModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]" @click="showSetujuiTerakhirModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-[560px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Persetujuan Terakhir</h3>
            <button @click="showSetujuiTerakhirModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Apakah Anda yakin ingin menyetujui penerimaan usulan ini secara final?
              Berita Acara Serah Terima akan digenerate dan usulan akan diterima.
            </p>
            <div class="space-y-2 mb-4 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item?.nomorUsulan ?? '-' }}</p>
              </div>
            </div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan Verifikasi Terakhir (opsional)</label>
            <textarea
              v-model="catatanVerifikasi"
              rows="3"
              placeholder="Catatan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            ></textarea>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showSetujuiTerakhirModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button
              @click="onConfirmSetujuiTerakhir"
              :disabled="actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Setujui Persetujuan Terakhir
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
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { fetchAtasanTuDetail, setujuiPenerimaan, tolakPenerimaan, setujuiTerakhir } = useTuVerifikasi()

const item = ref<TuUsulanItem | null>(null)
const loading = ref(true)
const actionLoading = ref(false)

const showSetujuiModal = ref(false)
const showTolakModal = ref(false)
const showSetujuiTerakhirModal = ref(false)

const catatanVerifikasi = ref('')
const alasanPenolakan = ref('')

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Verifikasi Persetujuan', to: '/maintenance/verifikasi-persetujuan-tu' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/verifikasi-persetujuan-tu/${route.params.id}` },
])

const daftarBerkas = computed(() => {
  if (!item.value) return []
  if (item.value.arsipIds && Array.isArray(item.value.arsipIds)) {
    return item.value.arsipIds
  }
  return [{
    id: item.value.arsipId,
    perihal: item.value.arsipPerihal,
    kode: item.value.arsipKode,
    tanggalRetensiHabis: null,
  }]
})

const canAct = computed(() => {
  if (!item.value) return false
  const s = item.value.status
  return (
    s === 'DIKIRIM' ||
    s === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU' ||
    s === 'DISETUJUI_PERSETUJUAN_TU' ||
    s === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU'
  )
})

const formatDate = (dateStr: string | Date | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await fetchAtasanTuDetail(route.params.id as string)
    item.value = res?.data ?? res
    catatanVerifikasi.value = item.value?.physicalVerificationNote ?? ''
  } catch (e: any) {
    console.error('Gagal memuat detail:', e)
    useToast().add({ title: 'Gagal', description: 'Gagal memuat detail usulan.', color: 'error' })
  } finally {
    loading.value = false
  }
}

const refresh = async () => {
  await loadDetail()
}

const openSetujuiModal = () => {
  showSetujuiModal.value = true
}
const openTolakModal = () => {
  alasanPenolakan.value = ''
  showTolakModal.value = true
}
const openSetujuiTerakhirModal = () => {
  showSetujuiTerakhirModal.value = true
}

const onConfirmSetujui = async () => {
  if (!item.value) return
  actionLoading.value = true
  try {
    await setujuiPenerimaan(item.value.id, {
      catatanVerifikasi: catatanVerifikasi.value.trim() || undefined,
    })
    showSetujuiModal.value = false
    useToast().add({ title: 'Berhasil', description: 'Penerimaan usulan disetujui.', color: 'success' })
    await navigateTo(`/maintenance/transfer-active-to-inactive-file/${item.value.id}`)
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal menyetujui.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

const onConfirmTolak = async () => {
  if (!item.value || !alasanPenolakan.value.trim()) return
  actionLoading.value = true
  try {
    await tolakPenerimaan(item.value.id, { alasanPenolakan: alasanPenolakan.value.trim() })
    showTolakModal.value = false
    useToast().add({ title: 'Berhasil', description: 'Penerimaan usulan ditolak.', color: 'success' })
    await refresh()
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal menolak.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

const onConfirmSetujuiTerakhir = async () => {
  if (!item.value) return
  actionLoading.value = true
  try {
    await setujuiTerakhir(item.value.id, {
      catatanVerifikasi: catatanVerifikasi.value.trim() || undefined,
    })
    showSetujuiTerakhirModal.value = false
    useToast().add({ title: 'Berhasil', description: 'Persetujuan terakhir diberikan. Arsip diterima.', color: 'success' })
    await navigateTo(`/maintenance/transfer-active-to-inactive-file/${item.value.id}`)
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal menyetujui terakhir.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

const printBeritaAcara = () => {
  if (item.value?.beritaAcaraUrl) {
    window.open(item.value.beritaAcaraUrl, '_blank')
  }
}

onMounted(() => loadDetail())
</script>