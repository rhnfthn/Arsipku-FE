<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="`Verifikasi Berkas Fisik — ${item?.nomorUsulan ?? ''}`"
        :items="breadcrumbs"
      />
      <NuxtLink
        to="/maintenance/verifikasi-berkas-fisik"
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
                <span class="text-gray-500 dark:text-gray-400 text-xs">Sekretaris</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.sekretarisName }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.atasanName }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Dikirim ke TU</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggalDikirim) }}</p>
              </div>
            </div>
          </div>

          <!-- Daftar Berkas Fisik -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Daftar Berkas Fisik</h3>
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

          <!-- Tombol Aksi langsung di bawah Daftar Berkas Fisik -->
          <div v-if="!isAlreadyVerified" class="flex gap-2">
            <button
              @click="openKembalikanModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon name="i-lucide-undo-2" class="w-4 h-4 mr-1 inline" /> Kembalikan ke Atasan
            </button>
            <button
              @click="openAjukanModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Ajukan ke Atasan TU
            </button>
          </div>

          <!-- Status info: Sudah diajukan ke Atasan TU -->
          <div
            v-if="item.tuApprovedAt"
            class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Sudah Diajukan ke Atasan TU</h3>
                <p class="text-sm text-blue-600 dark:text-blue-400">Berkas fisik dan berita acara serah terima telah dikonfirmasi cocok. Usulan telah diajukan ke Atasan Managerial TU.</p>
              </div>
            </div>
          </div>

          <!-- Status info: Berkas dikembalikan -->
          <div
            v-if="item.status === 'BERKAS_FISIK_TIDAK_SESUAI'"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Berkas Tidak Sesuai</h3>
                <p class="text-sm text-red-600 dark:text-red-400">{{ item.physicalVerificationNote || 'Berkas dikembalikan ke pengirim.' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      Usulan tidak ditemukan
    </div>

    <!-- Modal Ajukan ke Atasan TU -->
    <Teleport to="body">
      <div v-if="showAjukanModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[8px]" @click="showAjukanModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-[560px] max-h-[80vh] flex flex-col overflow-hidden z-[10000]">
          <!-- Header sticky -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ajukan ke Atasan Managerial TU</h3>
            <button @click="showAjukanModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <!-- Body scrollable -->
          <div class="px-6 py-4 overflow-y-auto flex-1">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Pilih Atasan Managerial TU yang akan memverifikasi penerimaan usulan ini.
            </p>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Atasan Managerial TU *</label>
            <!-- Custom dropdown -->
            <div class="relative">
              <button
                @click="showAtasanDropdown = !showAtasanDropdown"
                class="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between min-h-[48px]"
                :class="{ 'ring-2 ring-[#457fb6] border-[#457fb6]': showAtasanDropdown }"
              >
                <span v-if="!selectedAtasanTu" class="text-gray-400">Pilih atasan TU...</span>
                <span v-else class="font-medium">{{ selectedAtasanTu.name }}</span>
                <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-gray-400 shrink-0" :class="{ 'rotate-180': showAtasanDropdown }" />
              </button>
              <!-- Dropdown items -->
              <div v-if="showAtasanDropdown" class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-[10001] overflow-hidden">
                <button
                  v-for="a in atasanTuList"
                  :key="a.persnum"
                  @click="selectAtasan(a)"
                  class="w-full text-left py-3 px-4 border-b border-gray-100 dark:border-gray-600 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  :class="{ 'bg-[#457fb6]/10': atasanTuInput === a.persnum }"
                >
                  <p class="text-base font-medium text-gray-900 dark:text-white">{{ a.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ a.persnum }} — {{ a.jabatan }}</p>
                </button>
              </div>
            </div>
            <!-- Catatan -->
            <div class="mt-4">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan (opsional)</label>
              <textarea
                v-model="catatanAjuan"
                rows="3"
                placeholder="Catatan..."
                class="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none"
              ></textarea>
            </div>
          </div>
          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 shrink-0">
            <button @click="showAjukanModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button
              @click="onConfirmAjukan"
              :disabled="!atasanTuInput || actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Ajukan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Kembalikan -->
    <Teleport to="body">
      <div v-if="showKembalikanModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]" @click="showKembalikanModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] max-w-[480px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Kembalikan ke Atasan</h3>
            <button @click="showKembalikanModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Apakah Anda yakin ingin mengembalikan usulan ini ke Atasan Managerial Sekretaris?
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
            </div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan Pengembalian (opsional)</label>
            <textarea
              v-model="catatanKembalikan"
              rows="3"
              placeholder="Catatan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-red-500 resize-none"
            ></textarea>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showKembalikanModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button
              @click="onConfirmKembalikan"
              :disabled="actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Kembalikan
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
const { fetchNotifikasiDetail, ajukanAtasanTu, kembalikanKeAtasan } = useTuVerifikasi()

const item = ref<TuUsulanItem | null>(null)
const loading = ref(true)
const actionLoading = ref(false)

const showAjukanModal = ref(false)
const showKembalikanModal = ref(false)
const atasanTuInput = ref('')
const catatanAjuan = ref('')
const catatanKembalikan = ref('')
const showAtasanDropdown = ref(false)

const atasanTuList = [
  { persnum: '10010123', name: 'HERMANA SOEGIJANTORO', jabatan: 'EVP Corporate Secretary' },
  { persnum: '10010970', name: 'PRIYO HUTOMO PUTRA', jabatan: 'VP Corporate Secretary' },
]

const selectedAtasanTu = computed(() => atasanTuList.find((a) => a.persnum === atasanTuInput.value) || null)

const selectAtasan = (a: any) => {
  atasanTuInput.value = a.persnum
  showAtasanDropdown.value = false
}

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Verifikasi Berkas Fisik', to: '/maintenance/verifikasi-berkas-fisik' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/verifikasi-berkas-fisik/${route.params.id}` },
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

const isAlreadyVerified = computed(() => {
  if (!item.value) return false
  return !!item.value.tuApprovedAt || item.value.status === 'BERKAS_FISIK_TIDAK_SESUAI'
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await fetchNotifikasiDetail(route.params.id as string)
    item.value = res?.data ?? res
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

const openAjukanModal = () => {
  atasanTuInput.value = ''
  catatanAjuan.value = ''
  showAtasanDropdown.value = false
  showAjukanModal.value = true
}

const openKembalikanModal = () => {
  catatanKembalikan.value = ''
  showKembalikanModal.value = true
}

const onConfirmAjukan = async () => {
  if (!item.value || !atasanTuInput.value) return
  actionLoading.value = true
  try {
    await ajukanAtasanTu(item.value.id, { atasanTuPersnum: atasanTuInput.value })
    showAjukanModal.value = false
    useToast().add({ title: 'Berhasil', description: 'Usulan diajukan ke Atasan Managerial TU.', color: 'success' })
    await refresh()
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal mengajukan.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

const onConfirmKembalikan = async () => {
  if (!item.value) return
  actionLoading.value = true
  try {
    await kembalikanKeAtasan(item.value.id, { alasan: catatanKembalikan.value.trim() || 'Dikembalikan oleh TU' })
    showKembalikanModal.value = false
    useToast().add({ title: 'Berhasil', description: 'Berkas dikembalikan ke pengirim.', color: 'success' })
    await refresh()
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal mengembalikan.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => loadDetail())
</script>