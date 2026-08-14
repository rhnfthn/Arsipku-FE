<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-4xl mx-auto">
      <!-- Breadcrumb -->
      <div class="mb-6">
        <NuxtLink to="/maintenance/penyusutan/penataan-pemusnahan" class="inline-flex items-center gap-1.5 text-sm text-[#457fb6] hover:underline mb-3">
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali ke Penataan / Pemusnahan
        </NuxtLink>
        <Heading variant="heading6b" class="text-mobile-md">Detail Penataan / Pemusnahan</Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <div v-if="!item" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
        <p class="text-gray-500 dark:text-gray-400">Arsip tidak ditemukan.</p>
      </div>

      <div v-else class="space-y-5">
        <!-- Info Arsip -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Arsip</h3>
          </div>
          <div class="p-5 space-y-3">
            <div class="flex justify-between text-sm"><span class="text-gray-500">Kode Berkas</span><span class="font-medium text-gray-800 dark:text-white">{{ item.kode_berkas }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">No Usulan</span><span class="font-medium text-gray-800 dark:text-white">{{ item.no_usulan }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">Nama Berkas</span><span class="font-medium text-gray-800 dark:text-white">{{ item.nama_berkas }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">Sekretaris</span><span class="font-medium text-gray-800 dark:text-white">{{ item.sekretaris }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">Jenis Penyusutan</span>
              <span :class="item.jenis_penyusutan === 'permanen' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'" class="px-2 py-0.5 rounded-full text-[11px] font-medium">
                {{ item.jenis_penyusutan === 'permanen' ? 'Permanen' : 'Musnah' }}
              </span>
            </div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">Status</span>
              <span :class="statusBadgeClass(item.status)" class="text-[11px]">{{ statusLabel(item.status) }}</span>
            </div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">Tgl Pengajuan</span><span class="font-medium text-gray-800 dark:text-white">{{ formatDate(item.tanggal_pengajuan) }}</span></div>
          </div>
        </div>

        <!-- Verifikator Info -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Verifikasi Atasan Managerial</h3>
          </div>
          <div class="p-5 space-y-2">
            <div
              v-for="(v, i) in item.atasan_managerial"
              :key="i"
              class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
            >
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-[#457fb6] text-white text-xs flex items-center justify-center font-medium">{{ v.urutan }}</span>
                <div>
                  <p class="text-sm font-medium text-gray-800 dark:text-white">{{ v.name }}</p>
                  <p class="text-xs text-gray-500">{{ v.jabatan }}</p>
                </div>
              </div>
              <span :class="verifikatorBadgeClass(v.status)" class="text-[11px]">{{ verifikatorLabel(v.status) }}</span>
            </div>
          </div>
        </div>

        <!-- Form Penataan (Permanen) -->
        <div v-if="item.jenis_penyusutan === 'permanen' && item.status === 'diterima'" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Form Penataan Arsip Permanen</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload berita acara dan isi lokasi penyimpanan arsip.</p>
          </div>
          <div class="p-5 space-y-4">
            <!-- Upload Berita Acara -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Berita Acara <span class="text-red-500">*</span></label>
              <div class="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  @change="onFileChange"
                  class="hidden"
                  ref="fileInput"
                />
                <button
                  @click="fileInput?.click()"
                  class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <UIcon name="i-lucide-upload" class="w-4 h-4" /> Pilih File
                </button>
                <span v-if="fileName" class="text-sm text-gray-600 dark:text-gray-300">{{ fileName }}</span>
              </div>
            </div>

            <!-- Lokasi Penyimpanan -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Lokasi Penyimpanan <span class="text-red-500">*</span></label>
              <input
                v-model="lokasiSimpan"
                type="text"
                placeholder="Contoh: Gudang Arsip B-2 / Rak 5 / Baris 3"
                class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
            </div>

            <button
              @click="submitPenataan"
              :disabled="!lokasiSimpan || !fileName"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >Simpan Penataan</button>
          </div>
        </div>

        <!-- Form Pemusnahan (Musnah) -->
        <div v-if="item.jenis_penyusutan === 'musnah' && item.status === 'diterima'" class="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900 overflow-hidden">
          <div class="p-5 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
            <h3 class="text-base font-semibold text-red-700 dark:text-red-300">Form Pemusnahan Arsip</h3>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1">⚠️ Arsip akan dipindahkan ke database backup. Arsip asli tidak akan bisa dilihat lagi, hanya berita acara yang bisa diunduh.</p>
          </div>
          <div class="p-5 space-y-4">
            <!-- Upload Berita Acara Serah Terima -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Berita Acara Serah Terima <span class="text-red-500">*</span></label>
              <div class="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  @change="onFileChange"
                  class="hidden"
                  ref="fileInput"
                />
                <button
                  @click="fileInput?.click()"
                  class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <UIcon name="i-lucide-upload" class="w-4 h-4" /> Pilih File
                </button>
                <span v-if="fileName" class="text-sm text-gray-600 dark:text-gray-300">{{ fileName }}</span>
              </div>
            </div>

            <button
              @click="submitPemusnahan"
              :disabled="!fileName"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >Lanjutkan Pemusnahan</button>
          </div>
        </div>

        <!-- Status Selesai -->
        <div v-if="item.status === 'selesai'" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-500" />
              Proses Selesai
            </h3>
          </div>
          <div class="p-5 space-y-3">
            <div v-if="item.jenis_penyusutan === 'permanen'" class="flex justify-between text-sm">
              <span class="text-gray-500">Lokasi Penyimpanan</span>
              <span class="font-medium text-gray-800 dark:text-white">{{ item.lokasi_simpan ?? '-' }}</span>
            </div>
            <div v-if="item.berita_acara" class="flex justify-between text-sm">
              <span class="text-gray-500">Berita Acara</span>
              <a :href="item.berita_acara" download class="inline-flex items-center gap-1 text-[#457fb6] hover:underline">
                <UIcon name="i-lucide-download" class="w-4 h-4" /> Download
              </a>
            </div>
            <div v-if="item.jenis_penyusutan === 'musnah' && backupData" class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 mt-2">
              <p class="text-sm text-orange-700 dark:text-orange-300">
                <UIcon name="i-lucide-info" class="w-4 h-4 inline mr-1" />
                Arsip telah dipindahkan ke database backup pada {{ formatDate(backupData.tanggal_backup) }}. Arsip asli tidak dapat dilihat lagi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePenyusutan } from '~/composables/usePenyusutan'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { list, loading, loadData, simpanPenataan, pemusnahan, getBackupByArsipId } = usePenyusutan()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penyusutan', to: '/maintenance/penyusutan/daftar-retensi-habis' },
  { label: 'Penataan / Pemusnahan', to: '/maintenance/penyusutan/penataan-pemusnahan' },
  { label: 'Detail', to: `/maintenance/penyusutan/penataan-pemusnahan/${route.params.id}` },
])

const lokasiSimpan = ref('')
const fileName = ref('')
const fileInput = ref<HTMLElement | null>(null)

const item = computed(() => list.value.find((a) => a.id === route.params.id) ?? null)
const backupData = computed(() => item.value ? getBackupByArsipId(item.value.id) : null)

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { diterima: 'Diterima', selesai: 'Selesai', diajukan: 'Diajukan', ditolak: 'Ditolak' }
  return map[status] ?? status
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    diterima: 'px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    selesai: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    diajukan: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    ditolak: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  }
  return map[status] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const verifikatorLabel = (status: string) => {
  const map: Record<string, string> = { menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak' }
  return map[status] ?? status
}

const verifikatorBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    menunggu: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    disetujui: 'px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    ditolak: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  }
  return map[status] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    fileName.value = target.files[0].name
  }
}

const submitPenataan = () => {
  if (!item.value || !lokasiSimpan.value || !fileName.value) return
  const beritaAcaraPath = `/uploads/berita_acara_${item.value.kode_berkas}.pdf`
  simpanPenataan(item.value.id, lokasiSimpan.value, beritaAcaraPath)
  useToast().add({ title: 'Berhasil', description: 'Penataan arsip permanen berhasil disimpan.', color: 'success' })
}

const submitPemusnahan = () => {
  if (!item.value || !fileName.value) return
  const beritaAcaraPath = `/uploads/berita_acara_${item.value.kode_berkas}.pdf`
  pemusnahan(item.value.id, beritaAcaraPath)
  useToast().add({ title: 'Berhasil', description: 'Arsip berhasil dipindahkan ke database backup.', color: 'success' })
}

onMounted(() => {
  if (list.value.length === 0) {
    loadData()
  }
})
</script>