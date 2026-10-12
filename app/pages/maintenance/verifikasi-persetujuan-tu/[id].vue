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
      <div class="w-full space-y-5">
          <!-- Card 1: Informasi Usulan + Keterangan -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.nomorUsulan }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Diajukan ke TU</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggalDikirim) }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.arsipKode ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.atasanName || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Jenis</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.arsipTindakanPenyusutan ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Status</span>
                <p class="mt-1"><span :class="statusBadgeClass(item.status)" class="text-xs">{{ statusLabel(item.status) }}</span></p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">TU Pengirim</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.tuName || '-' }}</p>
              </div>
              <div class="md:col-span-2">
                <span class="text-gray-500 dark:text-gray-400 text-xs">Perihal Arsip</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.arsipPerihal }}</p>
              </div>
            </div>

            <!-- Keterangan -->
            <div v-if="item.keterangan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
                {{ item.keterangan }}
              </p>
            </div>

          </div>

          <!-- Gunakan card bersama agar tabel, kontrol lipat, dan preview cetak konsisten. -->
          <TransferDetailCard
            v-if="item"
            :transfer="item as any"
            :daftar-berkas="daftarBerkasDisplay"
            :daftar-isi="daftarIsiDetail"
            :unit-kerja-pihak-pertama="unitKerjaPengusul"
            :collapsible="true"
            :fit-berkas-table="true"
            information-layout="usul"
            :show-information-card="false"
            :show-approval-levels="false"
            :show-bac-signer="true"
            :show-bac-tembusan="false"
            :show-tu-approval-levels="false"
            preview-from="tu"
          />

          <!-- Card 4: Daftar Atasan Verifikasi -->
          <div
            v-if="item.tuApprovalLevels && item.tuApprovalLevels.length > 0"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
          >
            <div class="mb-4 flex items-center justify-between gap-3">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Daftar Atasan Verifikasi</h3>
              <button
                type="button"
                class="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                :aria-expanded="!collapsedAtasanTuVerifikasi"
                :aria-label="collapsedAtasanTuVerifikasi ? 'Buka Daftar Atasan Verifikasi' : 'Lipat Daftar Atasan Verifikasi'"
                @click="collapsedAtasanTuVerifikasi = !collapsedAtasanTuVerifikasi"
              >
                <UIcon :name="collapsedAtasanTuVerifikasi ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-4 w-4" />
              </button>
            </div>
            <div v-if="!collapsedAtasanTuVerifikasi" class="space-y-2">
              <div
                v-for="level in item.tuApprovalLevels"
                :key="level.urutan"
                class="flex items-center gap-3 p-3 rounded-lg border"
                :class="levelStatusClass(level.status)"
              >
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                  {{ level.urutan }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gray-900 dark:text-white">{{ level.name }}</p>
                  <p v-if="level.jabatan" class="text-xs text-gray-500 dark:text-gray-400">{{ level.jabatan }}</p>
                </div>
                <span :class="levelBadgeClass(level.status)" class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                  {{ levelStatusLabel(level.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Berita Acara menggunakan komponen bersama agar preview dan tampilannya seragam. -->
          <TransferBeritaAcaraCard
            :transfer="item"
            :berita-acara-data="beritaAcaraData"
            preview-icon="eye"
          />

          <TimelineRiwayat :item="item as any" />

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

          <div
            v-if="item.status === 'MENUNGGU_TTD_PIHAK_KEDUA'"
            class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-pen-line" class="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Menunggu Tanda Tangan Pihak Kedua</h3>
                <p class="text-sm text-amber-700 dark:text-amber-400">Seluruh verifikasi telah selesai. Setelah Berita Acara ditandatangani, usulan akan kembali ke TU untuk penataan arsip inaktif.</p>
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
              <UIcon v-else name="i-lucide-check-check" class="w-4 h-4 mr-1 inline" /> Setujui
            </button>
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
              Apakah Anda yakin ingin menyetujui penerimaan arsip ini?
            </p>
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
              Apakah Anda yakin ingin menyetujui penerimaan arsip ini secara final?
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
              Setujui
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
import { useAuth } from '~/composables/useAuth'
import type { TuUsulanItem } from '~/types/tu-verifikasi'
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue'
import TransferBeritaAcaraCard from '~/components/transfer-active-to-inactive/TransferBeritaAcaraCard.vue'
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { user } = useAuth()
const { fetchAtasanTuDetail, setujuiPenerimaan, tolakPenerimaan, setujuiTerakhir } = useTuVerifikasi()

const item = ref<TuUsulanItem | null>(null)
const loading = ref(true)
const actionLoading = ref(false)
const collapsedAtasanTuVerifikasi = ref(false)
const daftarBerkasDetail = ref<any[]>([])
const daftarIsiDetail = ref<any[]>([])
const beritaAcaraData = ref<any>({ atasan: {}, pengirim: {}, daftarArsip: [] })
const unitKerjaPengusul = computed(() =>
  beritaAcaraData.value?.unitKerjaPengusul
  || beritaAcaraData.value?.pengirim?.divisi
  || beritaAcaraData.value?.pihakPertama?.unitKerja
  || (item.value as any)?.unitKerjaPihakPertama
  || (item.value as any)?.unit_kerja_pihak_pertama
  || (item.value as any)?.divisiName
  || (item.value as any)?.unitKerja
  || '................................',
)
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

const daftarBerkasDisplay = computed(() =>
  daftarBerkasDetail.value.length > 0 ? daftarBerkasDetail.value : daftarBerkas.value,
)

/** True jika user login adalah atasan TU level saat ini (giliran verifikasi). */
const isCurrentTuTurn = computed(() => {
  if (!item.value || !user.value) return false
  const levels = item.value.tuApprovalLevels
  if (!levels || levels.length === 0) return true // Legacy: single atasan
  const currentLevel = item.value.currentTuApprovalLevel ?? 1
  const level = levels.find((l) => l.urutan === currentLevel)
  return level ? level.persnum === Number(user.value.persnum) : false
})

/** True jika user login adalah atasan TU level terakhir (untuk persetujuan terakhir). */
const isTuFinalLevel = computed(() => {
  if (!item.value || !user.value) return false
  const levels = item.value.tuApprovalLevels
  if (!levels || levels.length === 0) return true // Legacy
  const finalLevel = levels.reduce((latest, level) =>
    level.urutan > latest.urutan ? level : latest,
  )
  return finalLevel ? Number(finalLevel.persnum) === Number(user.value.persnum) : false
})

const canAct = computed(() => {
  if (!item.value) return false
  const s = item.value.status
  if (s === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU') {
    return isCurrentTuTurn.value
  }
  if (s === 'DISETUJUI_PERSETUJUAN_TU' || s === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU') {
    return isTuFinalLevel.value
  }
  return false
})

const formatDate = (dateStr: string | Date | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    // Menunggu Penerimaan (Unit Dokumen → Atasan Unit Dokumen)
    DIKIRIM: 'Menunggu Penerimaan',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'Menunggu Penerimaan',
    DISETUJUI_PERSETUJUAN_TU: 'Menunggu Penerimaan',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'Menunggu Penerimaan',
    MENUNGGU_TTD_PIHAK_KEDUA: 'Menunggu Tanda Tangan Pihak Kedua',
    // Selesai
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Menunggu Tanda Tangan Pihak Kedua',
    ARSIP_INAKTIF_DITERIMA: 'Selesai',
    PENATAAN_ARSIP_INAKTIF: 'Selesai',
    SELESAI: 'Selesai',
    // Ditolak
    DITOLAK_PERSETUJUAN_TU: 'Ditolak',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'Ditolak',
  }
  return m[s] || s
}

const statusBadgeClass = (s: string) => {
  const m: Record<string, string> = {
    // Menunggu Penerimaan = ungu
    DIKIRIM: 'px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    DISETUJUI_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    MENUNGGU_TTD_PIHAK_KEDUA: 'px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
    // Selesai = hijau
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
    ARSIP_INAKTIF_DITERIMA: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    PENATAAN_ARSIP_INAKTIF: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    SELESAI: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    // Ditolak = merah
    DITOLAK_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  }
  return m[s] || 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const levelStatusClass = (status: string): string => {
  if (status === 'DISETUJUI') return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  if (status === 'DITOLAK') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
}

const levelBadgeClass = (status: string): string => {
  if (status === 'DISETUJUI') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
  if (status === 'DITOLAK') return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
}

const levelStatusLabel = (status: string): string => {
  if (status === 'DISETUJUI') return 'Disetujui'
  if (status === 'DITOLAK') return 'Ditolak'
  return 'Menunggu'
}

const loadDaftarIsi = async () => {
  try {
    const { apiGet } = useApi()
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/daftar-isi`, {}, { skipCache: true })
    const data = res?.data?.data ?? res?.data ?? res
    daftarBerkasDetail.value = Array.isArray(data?.daftarBerkas) ? data.daftarBerkas : []
    daftarIsiDetail.value = Array.isArray(data?.daftarIsi) ? data.daftarIsi : []
  } catch {
    daftarBerkasDetail.value = []
    daftarIsiDetail.value = []
  }
}

const loadBeritaAcaraData = async () => {
  try {
    const { apiGet } = useApi()
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/berita-acara-data`, {}, { skipCache: true })
    beritaAcaraData.value = res?.data?.data ?? res?.data ?? res ?? { atasan: {}, pengirim: {}, daftarArsip: [] }
  } catch {
    beritaAcaraData.value = { atasan: {}, pengirim: {}, daftarArsip: [] }
  }
}

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await fetchAtasanTuDetail(route.params.id as string)
    item.value = res?.data ?? res
    catatanVerifikasi.value = item.value?.physicalVerificationNote ?? ''
    await Promise.all([loadDaftarIsi(), loadBeritaAcaraData()])
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
    await navigateTo(`/kelola/pemeliharaan/pemindahan-arsip/${item.value.id}`)
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
    await navigateTo(`/kelola/pemeliharaan/pemindahan-arsip/${item.value.id}`)
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal menyetujui terakhir.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => loadDetail())
</script>
