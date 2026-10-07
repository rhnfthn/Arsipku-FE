<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Detail Verifikasi — ${item?.no_usulan ?? ''}`" :items="breadcrumbs" />
      <NuxtLink to="/maintenance/penyusutan/verifikasi-penyusutan"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="itemLoading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
      <p class="text-gray-500 dark:text-gray-400 mt-2">Memuat data...</p>
    </div>

    <div v-else-if="!item" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
      <p class="text-gray-500 dark:text-gray-400">Pengajuan tidak ditemukan.</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Kolom Kiri: Informasi -->
        <div class="lg:col-span-2 space-y-5">
          <!-- Informasi Arsip -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Arsip</h3>
              <span :class="statusBadgeClass(item.status)" class="text-xs">{{ statusLabel(item.status) }}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span><p class="text-gray-900 dark:text-white font-medium">{{ item.no_usulan }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span><p class="text-gray-900 dark:text-white font-medium">{{ item.kode_berkas ?? '-' }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Nama Berkas</span><p class="text-gray-900 dark:text-white font-medium">{{ item.nama_berkas }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span><p class="text-gray-900 dark:text-white font-medium">{{ item.klasifikasiText || item.klasifikasi_text || item.klasifikasi || '-' }}<span v-if="item.klasifikasi" class="text-xs ml-1 text-gray-400">({{ item.klasifikasi }})</span></p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul (Unit Dokumen)</span><p class="text-gray-900 dark:text-white font-medium">{{ item.sekretaris }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Pengajuan</span><p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggal_pengajuan) }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span><p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggal_retensi_habis) }}</p></div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Jenis Penyusutan</span>
                <p class="mt-0.5">
                  <span :class="item.jenis_penyusutan === 'permanen' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'" class="px-2 py-0.5 rounded-full text-[11px] font-medium">
                    {{ item.jenis_penyusutan === 'permanen' ? 'Permanen' : 'Musnah' }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Catatan Pengusul -->
            <div v-if="item.catatan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Catatan Pengusul</h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
                {{ item.catatan }}
              </p>
            </div>
          </div>

          <!-- Verifikator Berjenjang -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-users" class="w-4 h-4 text-primary-500" /> Atasan Managerial Berjenjang
            </h3>
            <div class="space-y-2">
              <div
                v-for="(v, i) in item.atasan_managerial"
                :key="i"
                class="flex items-center justify-between rounded-lg p-3"
                :class="v.status === 'DISETUJUI' || v.status === 'disetujui' ? 'bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800' : v.status === 'DITOLAK' || v.status === 'ditolak' ? 'bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200 dark:ring-red-800' : 'bg-gray-50 dark:bg-gray-700/50'"
              >
                <div class="flex items-center gap-3">
                  <span
                    :class="v.status === 'DISETUJUI' || v.status === 'disetujui' ? 'bg-green-500' : v.status === 'DITOLAK' || v.status === 'ditolak' ? 'bg-red-500' : 'bg-[#457fb6]'"
                    class="w-7 h-7 rounded-full text-white text-xs flex items-center justify-center font-medium"
                  >{{ v.urutan }}</span>
                  <div>
                    <p class="text-sm font-medium text-gray-800 dark:text-white">{{ v.name }}</p>
                    <p class="text-xs text-gray-500">{{ v.jabatan || v.positionText || '-' }}</p>
                  </div>
                </div>
                <span :class="verifikatorBadgeClass(v.status)" class="text-[11px]">{{ verifikatorLabel(v.status) }}</span>
              </div>
              <div v-if="!item.atasan_managerial?.length" class="text-sm text-gray-400 italic py-2">
                Tidak ada verifikator
              </div>
            </div>
          </div>

          <!-- Daftar Arsip (Berkas) -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              Daftar Arsip
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ item.daftar_arsip?.length ?? 0 }}</span>
            </h3>
            <div v-if="item.daftar_arsip?.length" class="space-y-1.5">
              <div
                v-for="(a, idx) in item.daftar_arsip"
                :key="a.id || idx"
                class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <span class="text-xs font-semibold text-gray-400">{{ idx + 1 }}.</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900 dark:text-white truncate">
                    <span v-if="a.kode" class="font-mono text-xs text-gray-500">{{ a.kode }}</span>
                    <span v-if="a.kode"> — </span>
                    {{ a.nama }}
                  </p>
                </div>
                <NuxtLink
                  :to="`/maintenance/preview-berkas/${a.id}?from=penyusutan`"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200 transition-colors shrink-0"
                  title="Lihat detail berkas"
                >
                  <UIcon name="i-lucide-eye" class="w-4 h-4" />
                </NuxtLink>
              </div>
            </div>
            <div v-else class="text-sm text-gray-400 italic py-2">
              Tidak ada arsip
            </div>
          </div>
        </div>

        <!-- Kolom Kanan: Timeline Penyusutan -->
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5 h-fit">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-history" class="w-4 h-4 text-primary-500" /> Timeline Penyusutan
            <span :class="statusBadgeClass(item.status)" class="text-[11px]">{{ statusLabel(item.status) }}</span>
          </h3>
          <div class="space-y-1">
            <div
              v-for="(step, i) in reversedSteps"
              :key="step.key"
              class="flex gap-3"
              :class="i < reversedSteps.length - 1 ? 'pb-4' : ''"
            >
              <div class="flex flex-col items-center">
                <div :class="stepDotClass(step.step)" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  <UIcon v-if="stepIndex >= step.step" name="i-lucide-check" class="w-4 h-4" />
                  <span v-else class="text-xs font-semibold">{{ step.step + 1 }}</span>
                </div>
                <div v-if="i < reversedSteps.length - 1" class="w-0.5 flex-1 mt-1 bg-green-300 dark:bg-green-700"></div>
              </div>
              <div class="flex-1 min-w-0">
                <p :class="stepTextClass(step.step)" class="text-sm font-medium">{{ step.label }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Aksi -->
      <div class="flex items-center gap-3 mt-5">
        <button
          v-if="item.status === 'diajukan' && isCurrentVerifikator && canReject"
          @click="openRejectModal"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" /> Tolak
        </button>
        <button
          v-if="item.status === 'diajukan' && isCurrentVerifikator && canApprove"
          @click="openTindakLanjutiModal"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors"
        >
          <UIcon name="i-lucide-file-check-2" class="w-4 h-4" /> Tindak Lanjuti
        </button>
        <NuxtLink
          v-if="item.status === 'diterima' && isFirstVerifikator && !handedOver"
          :to="`/maintenance/penyusutan/verifikasi-penyusutan`"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Batal
        </NuxtLink>
        <button
          v-if="item.status === 'diterima' && isFirstVerifikator && !handedOver"
          @click="openHandoverModal"
          :class="item.jenis_penyusutan === 'permanen' ? 'bg-[#457fb6] hover:bg-[#3a6d9c]' : 'bg-red-500 hover:bg-red-600'"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg text-white transition-colors"
        >
          <UIcon :name="item.jenis_penyusutan === 'permanen' ? 'i-lucide-archive' : 'i-lucide-trash-2'" class="w-4 h-4" />
          {{ item.jenis_penyusutan === 'permanen' ? 'Penataan' : 'Musnah' }}
        </button>
      </div>
    </template>

    <!-- Modal Konfirmasi Serah Terima ke Unit Dokumen -->
    <Teleport to="body">
      <div v-if="showHandoverModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="showHandoverModal = false" />
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full z-10">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Serah Terima</h3>
            <button @click="showHandoverModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              Apakah Anda yakin ingin menyerahkan pengajuan ini ke Unit Dokumen untuk
              {{ item?.jenis_penyusutan === 'permanen' ? 'penataan' : 'pemusnahan' }}?
            </p>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Catatan <span class="text-gray-400 font-normal">(opsional)</span>
              </label>
              <textarea
                v-model="handoverCatatan"
                rows="3"
                placeholder="Catatan untuk Unit Dokumen..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
            </div>
          </div>
          <div class="flex justify-start gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button
              @click="showHandoverModal = false"
              class="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >Batal</button>
            <button
              @click="submitHandover"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Ya, Serahkan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Konfirmasi Tindak Lanjuti -->
    <Teleport to="body">
      <div v-if="showTindakLanjutiModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="showTindakLanjutiModal = false" />
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full z-10">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Tindak Lanjuti</h3>
            <button @click="showTindakLanjutiModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              Apakah Anda yakin ingin menindaklanjuti pengajuan penyusutan ini?
            </p>
          </div>
          <div class="flex justify-start gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button
              @click="showTindakLanjutiModal = false"
              class="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >Batal</button>
            <NuxtLink
              :to="`/maintenance/penyusutan/verifikasi-penyusutan/tindak-lanjuti/${item?.id}`"
              class="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors"
            >
              Ya, Lanjutkan
            </NuxtLink>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Konfirmasi Penolakan -->
    <Teleport to="body">
      <div v-if="showRejectModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="showRejectModal = false" />
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full z-10">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Penolakan</h3>
            <button @click="showRejectModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              Apakah Anda yakin ingin menolak pengajuan penyusutan ini? Pengajuan akan dikembalikan ke Unit Dokumen dengan status ditolak.
            </p>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Alasan Penolakan <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="rejectCatatan"
                rows="3"
                placeholder="Alasan penolakan..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
            </div>
          </div>
          <div class="flex justify-start gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button
              @click="showRejectModal = false"
              class="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >Batal</button>
            <button
              @click="submitReject"
              :disabled="submitting || !rejectCatatan.trim()"
              class="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Ya, Tolak
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePenyusutan } from '~/composables/usePenyusutan'
import { usePenyusutanPermission } from '~/composables/usePenyusutanPermission'
import { useAuth } from '~/composables/useAuth'
import type { ArsipPenyusutan } from '~/types/penyusutan'

definePageMeta({ middleware: ['auth', 'penyusutan-access'] })

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { fetchById, verifyPenyusutan } = usePenyusutan()
const { canApprove, canReject } = usePenyusutanPermission()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Verifikasi Penyusutan', to: '/maintenance/penyusutan/verifikasi-penyusutan' },
  { label: 'Detail', to: `/maintenance/penyusutan/verifikasi-penyusutan/detail/${route.params.id}` },
])

const item = ref<ArsipPenyusutan | null>(null)
const itemLoading = ref(false)
const submitting = ref(false)
const showTindakLanjutiModal = ref(false)
const showRejectModal = ref(false)
const rejectCatatan = ref('')
const showHandoverModal = ref(false)
const handedOver = ref(false)
const handoverCatatan = ref('')

/** Buka modal konfirmasi serah terima ke Unit Dokumen. */
const openHandoverModal = () => {
  handoverCatatan.value = ''
  showHandoverModal.value = true
}

/** Konfirmasi serah terima — tandai sudah diserahkan, tombol aksi hilang. */
const submitHandover = async () => {
  if (!item.value) return
  submitting.value = true
  try {
    // Tandai sudah diserahkan ke Unit Dokumen (persist per item).
    const key = `penyusutan_handed_over_${item.value.id}`
    localStorage.setItem(key, '1')
    handedOver.value = true
    showHandoverModal.value = false
    useToast().add({
      title: 'Berhasil',
      description: `Pengajuan diserahkan ke Unit Dokumen untuk ${item.value.jenis_penyusutan === 'permanen' ? 'penataan' : 'pemusnahan'}.`,
      color: 'success',
    })
  } catch (e: any) {
    useToast().add({
      title: 'Gagal',
      description: e?.message || 'Gagal menyerahkan pengajuan',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

/** True jika user login adalah verifikator yang sedang giliran (urutan = current_verifikator_urutan). */
const isCurrentVerifikator = computed(() => {
  if (!item.value || !user.value) return false
  const userPersnum = Number(user.value.persnum)
  const currentUrutan = item.value.current_verifikator_urutan ?? item.value.currentVerifikatorUrutan ?? 1
  const level = (item.value.atasan_managerial ?? []).find((v) => v.urutan === currentUrutan)
  if (!level) return false
  return Number(level.persnum) === userPersnum
})

/** True jika user login adalah verifikator pertama (urutan 1). */
const isFirstVerifikator = computed(() => {
  if (!item.value || !user.value) return false
  const userPersnum = Number(user.value.persnum)
  const first = (item.value.atasan_managerial ?? []).find((v) => v.urutan === 1)
  if (!first) return false
  return Number(first.persnum) === userPersnum
})

/** Buka modal konfirmasi tindak lanjuti. */
const openTindakLanjutiModal = () => {
  showTindakLanjutiModal.value = true
}

/** Buka modal konfirmasi penolakan. */
const openRejectModal = () => {
  rejectCatatan.value = ''
  showRejectModal.value = true
}

/** Kirim penolakan ke backend. */
const submitReject = async () => {
  if (!item.value) return
  if (!rejectCatatan.value.trim()) return
  submitting.value = true
  try {
    await verifyPenyusutan(item.value.id, false, {
      catatan: rejectCatatan.value.trim(),
    })
    showRejectModal.value = false
    useToast().add({
      title: 'Berhasil',
      description: 'Pengajuan ditolak dan dikembalikan ke Unit Dokumen.',
      color: 'success',
    })
    router.push('/maintenance/penyusutan/verifikasi-penyusutan')
  } catch (e: any) {
    useToast().add({
      title: 'Gagal',
      description: e?.message || 'Gagal menolak pengajuan penyusutan',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

/** Mapping status → index step (0-3). */
const stepIndex = computed(() => {
  const s = item.value?.status ?? 'draft'
  if (s === 'draft') return 0
  if (s === 'diajukan') return 1
  if (s === 'diterima') return 2
  if (s === 'selesai') return 3
  if (s === 'ditolak') return 1
  return 0
})

const steps = computed(() => {
  const jenis = item.value?.jenis_penyusutan ?? 'permanen'
  return [
    { key: 'draft', step: 0, label: 'Draft', desc: 'Arsip inaktif dan retensi habis' },
    { key: 'diajukan', step: 1, label: 'Menunggu Persetujuan', desc: 'Telah diajukan ke Atasan Managerial Unit Dokumen' },
    { key: 'diterima', step: 2, label: 'Disetujui', desc: 'Atasan Managerial Unit Dokumen menyetujui penyusutan' },
    { key: 'selesai', step: 3, label: 'Selesai', desc: jenis === 'permanen' ? 'Arsip telah disimpan (dipermanenkan)' : 'Arsip telah dimusnahkan' },
  ]
})

const reversedSteps = computed(() => [...steps.value].reverse())

const stepDotClass = (step: number): string => {
  if (step < stepIndex.value) return 'bg-green-500 text-white'
  if (step === stepIndex.value) return 'bg-[#457fb6] text-white ring-4 ring-[#457fb6]/20'
  return 'bg-gray-200 dark:bg-gray-600 text-gray-400'
}

const stepTextClass = (step: number): string => {
  if (step < stepIndex.value) return 'text-gray-900 dark:text-white'
  if (step === stepIndex.value) return 'text-[#457fb6] dark:text-[#5a9ad6] font-semibold'
  return 'text-gray-400'
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { draft: 'Draft', diajukan: 'Menunggu Persetujuan', diterima: 'Disetujui', ditolak: 'Ditolak', selesai: 'Selesai' }
  return map[status] ?? status
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    draft: 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    diajukan: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    diterima: 'px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    ditolak: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    selesai: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  }
  return map[status] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const verifikatorLabel = (status: string) => {
  const map: Record<string, string> = { MENUNGGU: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak' }
  return map[status] ?? status
}

const verifikatorBadgeClass = (status: string) => {
  const s = (status ?? '').toUpperCase()
  const map: Record<string, string> = {
    MENUNGGU: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DISETUJUI: 'px-2 py-0.5 rounded-full font-medium bg-green-500 text-white',
    DITOLAK: 'px-2 py-0.5 rounded-full font-medium bg-red-500 text-white',
  }
  return map[s] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

onMounted(async () => {
  itemLoading.value = true
  try {
    item.value = await fetchById(route.params.id as string)
    if (item.value) {
      const key = `penyusutan_handed_over_${item.value.id}`
      handedOver.value = localStorage.getItem(key) === '1'
    }
  } finally {
    itemLoading.value = false
  }
})
</script>
