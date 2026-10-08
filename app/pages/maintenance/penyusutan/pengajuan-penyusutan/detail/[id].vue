<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Detail Pengajuan — ${item?.no_usulan ?? ''}`" :items="breadcrumbs" />
      <NuxtLink to="/maintenance/penyusutan/pengajuan-penyusutan"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="!item" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
      <p class="text-gray-500 dark:text-gray-400">Arsip tidak ditemukan.</p>
    </div>

    <template v-else>
      <PenyusutanDetailContent :item="item" :transfer="transferForTables" :daftar-berkas="daftarBerkasRows" :daftar-isi="daftarIsiRows" :berita-acara-data="beritaAcaraData" />
      <div v-if="false" class="w-full space-y-5">
        <!-- Informasi dan card pendukung -->
        <div class="space-y-5">
          <!-- Informasi Arsip -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button type="button" class="mb-4 flex w-full items-center justify-between gap-3 text-left" :aria-expanded="!collapsedInfo" @click="collapsedInfo = !collapsedInfo">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Arsip</h3>
              <UIcon :name="collapsedInfo ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-4 w-4 text-gray-400" />
            </button>
            <div v-if="!collapsedInfo" class="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Nomor Usulan</span><p class="text-gray-900 dark:text-white">{{ item.no_usulan || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Kode Berkas</span><p class="text-gray-900 dark:text-white">{{ item.kode_berkas || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Uraian Informasi Berkas</span><p class="text-gray-900 dark:text-white">{{ item.nama_berkas || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Klasifikasi</span><p class="text-gray-900 dark:text-white">{{ [item.klasifikasi, item.klasifikasiText || item.klasifikasi_text].filter(Boolean).join(' ') || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Kurun Waktu</span><p class="text-gray-900 dark:text-white">{{ item.kurunWaktu || item.kurun_waktu || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Jumlah Berkas</span><p class="text-gray-900 dark:text-white">{{ item.jumlahBerkas ?? item.jumlah_berkas ?? '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Klasifikasi Keamanan</span><p class="text-gray-900 dark:text-white">{{ item.klasifikasiKeamanan || item.klasifikasi_keamanan || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Status</span><p class="mt-1"><span :class="statusBadgeClass(item.status)" class="inline-flex text-xs">{{ statusLabel(item.status) }}</span></p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Lokasi Simpan</span><p class="text-gray-900 dark:text-white">{{ item.lokasi_simpan || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Nasib Akhir</span><p class="text-gray-900 dark:text-white">{{ item.nasibAkhir || (item.jenis_penyusutan === 'musnah' ? 'Musnah' : 'Permanen') }}</p></div>
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400">Lampiran</span>
                <div class="mt-1">
                  <button type="button" :disabled="lampiranLoading" @click="openLampiran" class="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline disabled:cursor-wait disabled:opacity-60 dark:text-primary-300">
                    <UIcon :name="lampiranLoading ? 'i-lucide-loader-2' : 'i-lucide-file-text'" :class="lampiranLoading ? 'animate-spin' : ''" class="h-4 w-4" />
                    Lampiran/{{ item.no_usulan || '-' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Keterangan -->
            <div v-if="item.keterangan || item.catatan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
                {{ item.keterangan || item.catatan }}
              </p>
            </div>
          </div>

          <!-- Atasan Managerial Berjenjang -->
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

          <TransferDetailCard
            v-if="transferForTables"
            :transfer="transferForTables"
            :daftar-berkas="daftarBerkasRows"
            :daftar-isi="daftarIsiRows"
            :collapsible="true"
            :show-information-card="false"
            :show-approval-levels="false"
            :show-bac-signer="false"
            :show-bac-tembusan="false"
            :show-tu-approval-levels="false"
            berkas-layout="penataan"
          />

          <TransferBeritaAcaraCard
            v-if="transferForTables"
            :transfer="transferForTables"
            :berita-acara-data="beritaAcaraData"
            preview-icon="eye"
          />

          <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
              <div class="min-w-0 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">Foto dokumentasi</h3>
                  <button type="button" @click="collapsedFoto = !collapsedFoto" class="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" :aria-expanded="!collapsedFoto" aria-label="Lipat foto dokumentasi">
                    <UIcon :name="collapsedFoto ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-5 w-5" />
                  </button>
                </div>
                <div v-if="!collapsedFoto" class="flex min-h-64 items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900/40">
                  <a v-if="fotoDokumentasiUrl" :href="fotoDokumentasiUrl" target="_blank" rel="noopener noreferrer" class="group relative block h-full w-full">
                    <img :src="fotoDokumentasiUrl" alt="Foto dokumentasi arsip" class="h-64 w-full rounded-lg object-contain" />
                    <span class="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100"><UIcon name="i-lucide-eye" class="mr-1.5 h-4 w-4" />Lihat foto</span>
                  </a>
                  <p v-else class="px-4 py-10 text-sm text-gray-400">Foto dokumentasi belum tersedia.</p>
                </div>
              </div>

              <div class="grid min-w-0 content-start gap-5">
                <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div class="mb-4 flex items-center justify-between gap-3">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Lokasi penyimpanan</h3>
                    <button type="button" @click="collapsedLokasi = !collapsedLokasi" class="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" :aria-expanded="!collapsedLokasi" aria-label="Lipat lokasi penyimpanan">
                      <UIcon :name="collapsedLokasi ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-5 w-5" />
                    </button>
                  </div>
                  <div v-if="!collapsedLokasi" class="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                    <div><span class="text-sm text-gray-500 dark:text-gray-400">Label boks</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.labelPenataan || [item.rak, item.baris, item.kolom].filter(Boolean).join('.') || '-' }}</p></div>
                    <div><span class="text-sm text-gray-500 dark:text-gray-400">Lokasi</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.lokasi_simpan || '-' }}</p></div>
                    <div><span class="text-sm text-gray-500 dark:text-gray-400">No. ruang</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.rak || '-' }}</p></div>
                    <div><span class="text-sm text-gray-500 dark:text-gray-400">No. rak</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.baris || '-' }}</p></div>
                    <div><span class="text-sm text-gray-500 dark:text-gray-400">No. boks</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.kolom || '-' }}</p></div>
                  </div>
                </section>

                <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">Kondisi Arsip</h3>
                  <p class="mt-2 whitespace-pre-line text-base text-gray-600 dark:text-gray-300">{{ item.kondisiArsip || readConditionAndMedia(item.keteranganPenataan || item.keterangan, 'Kondisi') || '-' }}</p>
                  <div class="my-4 border-t border-gray-100 dark:border-gray-700" />
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">Media Arsip</h3>
                  <p class="mt-2 whitespace-pre-line text-base text-gray-600 dark:text-gray-300">{{ item.mediaArsip || readConditionAndMedia(item.keteranganPenataan || item.keterangan, 'Media') || '-' }}</p>
                </section>
              </div>
            </div>
          </section>
        </div>

        <!-- Timeline Penyusutan -->
        <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button type="button" class="flex w-full items-center justify-between gap-3 text-left" :aria-expanded="!collapsedTimeline" @click="collapsedTimeline = !collapsedTimeline">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Timeline Riwayat</h3>
            <UIcon :name="collapsedTimeline ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-4 w-4 text-gray-400" />
          </button>
          <div v-if="!collapsedTimeline" class="mt-4 space-y-1">
            <!-- Steps ditampilkan TERBALIK: paling baru (Selesai) di atas, paling lama (Draft) di bawah -->
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
                <!-- Garis penghubung ke langkah berikutnya (di bawah) -->
                <div v-if="i < reversedSteps.length - 1" class="w-0.5 flex-1 mt-1 bg-green-300 dark:bg-green-700"></div>
              </div>
              <div class="flex-1 min-w-0">
                <p :class="stepTextClass(step.step)" class="text-sm font-medium">{{ step.label }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { usePenyusutan } from '~/composables/usePenyusutan'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import { useApi } from '~/composables/useApi'
import type { ArsipPenyusutan } from '~/types/penyusutan'
import PenyusutanDetailContent from '~/components/penyusutan/PenyusutanDetailContent.vue'
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue'
import TransferBeritaAcaraCard from '~/components/transfer-active-to-inactive/TransferBeritaAcaraCard.vue'

definePageMeta({ middleware: ['auth', 'penyusutan-access'] })

const route = useRoute()
const { fetchById } = usePenyusutan()
const { fetchPenataanDetail } = useTuVerifikasi()
const { api, apiGet } = useApi()
const toast = useToast()
const runtimeConfig = useRuntimeConfig()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Pengajuan Penyusutan', to: '/maintenance/penyusutan/pengajuan-penyusutan' },
  { label: 'Detail Pengajuan', to: `/maintenance/penyusutan/pengajuan-penyusutan/detail/${route.params.id}` },
])

const item = ref<ArsipPenyusutan | null>(null)
const collapsedInfo = ref(false)
const collapsedTimeline = ref(false)
const collapsedFoto = ref(false)
const collapsedLokasi = ref(false)
const daftarBerkasRows = ref<any[]>([])
const daftarIsiRows = ref<any[]>([])
const transferData = ref<any>(null)
const beritaAcaraData = ref<any>(null)
const lampiranPreviewOpen = ref(false)
const lampiranLoading = ref(false)
const lampiranPreviewUrl = ref('')
const lampiranPreviewTitle = ref('Preview Lampiran')

const transferForTables = computed(() => {
  if (!transferData.value) return null
  return {
    ...transferData.value,
    id: transferData.value.id ?? item.value?.transferId,
    status: transferData.value.status ?? 'SELESAI',
    lokasiPenataan: item.value?.lokasi_simpan ?? transferData.value.lokasiPenataan ?? null,
    labelPenataan: item.value?.labelPenataan ?? transferData.value.labelPenataan ?? null,
    rak: item.value?.rak ?? transferData.value.rak ?? null,
    baris: item.value?.baris ?? transferData.value.baris ?? null,
    kolom: item.value?.kolom ?? transferData.value.kolom ?? null,
    arsipIds: transferData.value.arsipIds ?? daftarBerkasRows.value.map((row: any) => ({
      id: row.id,
      kode: row.kode,
      perihal: row.uraianInformasi ?? row.namaBerkas,
    })),
  }
})

const fotoDokumentasiUrl = computed(() => {
  const key = item.value?.foto_dokumentasi || item.value?.fotoDokumentasi || transferData.value?.fotoPenataan || transferData.value?.foto_penataan
  if (!key) return ''
  if (/^https?:\/\//i.test(key)) return key
  const baseUrl = api.defaults.baseURL || runtimeConfig.public.apiBaseUrl || ''
  return `${baseUrl}/tu/penataan-arsip/foto?key=${encodeURIComponent(key)}`
})

const closeLampiranPreview = () => {
  lampiranPreviewOpen.value = false
  if (lampiranPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(lampiranPreviewUrl.value)
  lampiranPreviewUrl.value = ''
}

const openLampiran = async () => {
  const transferId = transferData.value?.id ?? item.value?.transferId
  if (!transferId) {
    toast.add({ title: 'Lampiran tidak tersedia', description: 'Data penataan arsip belum ditemukan.', color: 'warning' })
    return
  }
  closeLampiranPreview()
  lampiranPreviewTitle.value = `Lampiran/${item.value?.no_usulan || ''}`
  lampiranPreviewOpen.value = true
  lampiranLoading.value = true
  try {
    let response: any = await apiGet(`/transfer-active-to-inactive/${transferId}/lampiran-penataan.pdf`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    }, { skipCache: true })
    if (response && typeof response === 'object' && !(response instanceof Blob) && 'data' in response) response = response.data
    const blob = response instanceof Blob
      ? response
      : response instanceof ArrayBuffer
        ? new Blob([response], { type: 'application/pdf' })
        : ArrayBuffer.isView(response)
          ? new Blob([new Uint8Array(response.buffer, response.byteOffset, response.byteLength)], { type: 'application/pdf' })
          : null
    if (!blob || blob.size === 0 || (await blob.slice(0, 5).text()) !== '%PDF-') throw new Error('Lampiran PDF tidak valid.')
    lampiranPreviewUrl.value = URL.createObjectURL(blob)
  } catch (error: any) {
    lampiranPreviewOpen.value = false
    toast.add({ title: 'Lampiran gagal dibuka', description: error?.message || 'Silakan coba kembali.', color: 'error' })
  } finally {
    lampiranLoading.value = false
  }
}

const readConditionAndMedia = (value: string | null | undefined, field: 'Kondisi' | 'Media') => {
  const text = String(value ?? '')
  const marker = `${field}: `
  const startIndex = text.indexOf(marker)
  if (startIndex < 0) return ''
  const remaining = text.slice(startIndex + marker.length)
  const nextFieldIndex = remaining.search(/\n(?:Kondisi|Media|Tingkat Perkembangan): /)
  return remaining.slice(0, nextFieldIndex >= 0 ? nextFieldIndex : undefined).trim()
}

const loadTransferMetadata = async () => {
  if (!item.value) return
  try {
    let transferId = item.value.transferId ?? item.value.transfer_id
    let transferSummary: any = null
    const archiveId = String(item.value.berkasId ?? item.value.daftar_arsip?.[0]?.id ?? item.value.daftarArsip?.[0]?.id ?? '')
    const linkedPenataan = item.value.penataanData
    if (linkedPenataan) {
      transferId = linkedPenataan.transferId ?? transferId
      transferSummary = { id: linkedPenataan.transferId, status: 'SELESAI', lokasiPenataan: linkedPenataan.lokasiPenataan }
      transferData.value = transferSummary
      if (linkedPenataan.daftarBerkas?.length) daftarBerkasRows.value = linkedPenataan.daftarBerkas
      if (linkedPenataan.daftarIsi?.length) daftarIsiRows.value = linkedPenataan.daftarIsi
    }

    if (!transferId) return
    let transfer: any = transferSummary
    if (!linkedPenataan) {
      try {
        const transferResponse: any = await fetchPenataanDetail(String(transferId))
        transfer = transferResponse?.data ?? transferResponse ?? transferSummary
      } catch (error) {
        console.warn('Detail penataan tidak dapat dimuat; memakai ringkasan:', error)
      }
    }
    if (!transfer) return
    transferData.value = transfer

    if (!linkedPenataan) {
      try {
        const daftarResponse: any = await apiGet(`/transfer-active-to-inactive/${transferId}/daftar-isi`, {}, { skipCache: true })
        const daftarData = daftarResponse?.data?.data ?? daftarResponse?.data ?? daftarResponse
        if (Array.isArray(daftarData?.daftarBerkas) && daftarData.daftarBerkas.length) daftarBerkasRows.value = daftarData.daftarBerkas
        if (Array.isArray(daftarData?.daftarIsi) && daftarData.daftarIsi.length) daftarIsiRows.value = daftarData.daftarIsi
      } catch (error) {
        console.error('Gagal memuat daftar arsip penyusutan:', error)
      }
    }

    if (!daftarBerkasRows.value.length) {
      const archiveList = transfer.arsipRows ?? transfer.arsipIds ?? item.value.daftar_arsip ?? item.value.daftarArsip ?? []
      daftarBerkasRows.value = archiveList.map((archive: any, index: number) => ({
        ...archive,
        no: archive.no ?? index + 1,
        id: archive.id,
        kode: archive.kode ?? archive.kodeBerkas,
        namaBerkas: archive.namaBerkas ?? archive.perihal ?? archive.nama,
        uraianInformasi: archive.uraianInformasi ?? archive.namaBerkas ?? archive.perihal ?? archive.nama,
        klasifikasi: archive.klasifikasiTeks ?? archive.klasifikasiText ?? archive.klasifikasi_text ?? (archive.klasifikasi !== item.value.klasifikasi ? archive.klasifikasi : item.value.klasifikasiText),
        kodeKlasifikasi: archive.kodeKlasifikasi ?? archive.kode_klasifikasi ?? archive.klasifikasiKode ?? archive.klasifikasi_kode ?? archive.klasifikasi ?? item.value.klasifikasi ?? '-',
        jumlah: archive.jumlah ?? archive.jumlahBerkas ?? archive.jumlah_berkas ?? item.value.jumlahBerkas,
        jumlahBerkas: archive.jumlahBerkas ?? archive.jumlah_berkas ?? archive.jumlah ?? item.value.jumlahBerkas,
        lokasiSimpan: archive.lokasiSimpan ?? archive.lokasi_simpan ?? transfer.lokasiPenataan ?? transfer.lokasi_penataan ?? item.value.lokasi_simpan,
        klasifikasiKeamanan: archive.klasifikasiKeamanan ?? archive.klasifikasi_keamanan ?? item.value.klasifikasiKeamanan ?? item.value.klasifikasi_keamanan,
      }))
    }

    const selectedArchive = daftarBerkasRows.value.find((archive: any) => String(archive.id) === archiveId)
      ?? daftarBerkasRows.value[0]
    const keteranganPenataan = transfer.keteranganPenataan ?? transfer.keterangan_penataan ?? ''
    item.value = {
      ...item.value,
      transferId: String(transfer.id ?? transferId),
      klasifikasi: selectedArchive?.kodeKlasifikasi ?? item.value.klasifikasi,
      klasifikasiText: selectedArchive?.klasifikasi ?? item.value.klasifikasiText ?? item.value.klasifikasi_text,
      klasifikasiKeamanan: selectedArchive?.klasifikasiKeamanan ?? item.value.klasifikasiKeamanan,
      kurunWaktu: selectedArchive?.kurunWaktu ?? item.value.kurunWaktu,
      jumlahBerkas: selectedArchive?.jumlahBerkas ?? selectedArchive?.jumlah ?? item.value.jumlahBerkas,
      nasibAkhir: selectedArchive?.nasibAkhir ?? item.value.nasibAkhir,
      nama_berkas: selectedArchive?.uraianInformasi ?? selectedArchive?.namaBerkas ?? item.value.nama_berkas,
      lokasi_simpan: selectedArchive?.lokasiSimpan ?? item.value.lokasi_simpan ?? transfer.lokasiPenataan ?? transfer.lokasi_penataan,
      labelPenataan: item.value.labelPenataan ?? transfer.labelPenataan ?? transfer.label_penataan,
      rak: item.value.rak ?? transfer.rak ?? transfer.noRuang ?? transfer.no_ruang,
      baris: item.value.baris ?? transfer.baris ?? transfer.noRak ?? transfer.no_rak,
      kolom: item.value.kolom ?? transfer.kolom ?? transfer.noBoks ?? transfer.no_boks,
      foto_dokumentasi: item.value.foto_dokumentasi ?? transfer.fotoPenataan ?? transfer.foto_penataan,
      keteranganPenataan,
      kondisiArsip: transfer.kondisiArsip ?? transfer.kondisi_arsip ?? readConditionAndMedia(keteranganPenataan, 'Kondisi'),
      mediaArsip: transfer.mediaArsip ?? transfer.media_arsip ?? readConditionAndMedia(keteranganPenataan, 'Media'),
    }

    try {
      const beritaResponse: any = await apiGet(`/transfer-active-to-inactive/${transferId}/berita-acara-data`, {}, { skipCache: true })
      beritaAcaraData.value = beritaResponse?.data?.data ?? beritaResponse?.data ?? beritaResponse
    } catch (error) {
      console.error('Gagal memuat berita acara penyusutan:', error)
    }
  } catch (error) {
    console.error('Gagal memuat data penataan untuk detail penyusutan:', error)
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

/** Daftar langkah urutan lama→baru (index 0 = Draft, 3 = Selesai). */
const steps = computed(() => {
  const jenis = item.value?.jenis_penyusutan ?? 'permanen'
  return [
    {
      key: 'draft',
      step: 0,
      label: 'Draft',
      desc: 'Arsip inaktif dan retensi habis',
    },
    {
      key: 'diajukan',
      step: 1,
      label: 'Menunggu Persetujuan',
      desc: 'Telah diajukan ke Atasan Managerial Unit Dokumen',
    },
    {
      key: 'diterima',
      step: 2,
      label: 'Disetujui',
      desc: 'Atasan Managerial Unit Dokumen menyetujui penyusutan',
    },
    {
      key: 'selesai',
      step: 3,
      label: 'Selesai',
      desc: jenis === 'permanen'
        ? 'Arsip telah disimpan (dipermanenkan)'
        : 'Arsip telah dimusnahkan',
    },
  ]
})

/** Urutan terbalik: paling baru (Selesai) di atas, paling lama (Diajukan) di bawah. */
const reversedSteps = computed(() => [...steps.value].reverse())

const stepDotClass = (step: number): string => {
  if (step < stepIndex.value) {
    return 'bg-green-500 text-white'
  }
  if (step === stepIndex.value) {
    return 'bg-[#457fb6] text-white ring-4 ring-[#457fb6]/20'
  }
  return 'bg-gray-200 dark:bg-gray-600 text-gray-400'
}

const stepTextClass = (step: number): string => {
  if (step < stepIndex.value) {
    return 'text-gray-900 dark:text-white'
  }
  if (step === stepIndex.value) {
    return 'text-[#457fb6] dark:text-[#5a9ad6] font-semibold'
  }
  return 'text-gray-400'
}

const formatDate = (dateStr: string | null | undefined) => {
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
  item.value = await fetchById(route.params.id as string)
  if (item.value) await loadTransferMetadata()
})

onBeforeUnmount(closeLampiranPreview)
</script>
