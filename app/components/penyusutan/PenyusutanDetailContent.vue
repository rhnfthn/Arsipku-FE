<template>
  <div class="w-full space-y-5">
    <section class="space-y-5">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <button type="button" class="mb-4 flex w-full items-center justify-between gap-3 text-left" :aria-expanded="!collapsed.info" @click="collapsed.info = !collapsed.info">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Arsip</h3>
          <UIcon :name="collapsed.info ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-4 w-4 text-gray-400" />
        </button>
        <div v-if="!collapsed.info" class="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
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
          <div class="min-w-0"><span class="block text-xs text-gray-500 dark:text-gray-400">Lampiran</span><button type="button" :disabled="lampiranLoading" @click="openLampiran" class="mt-1 flex min-w-0 items-center gap-2 text-base font-medium text-primary-800 hover:underline disabled:opacity-60 dark:text-primary-300"><UIcon :name="lampiranLoading ? 'i-lucide-loader-2' : 'i-lucide-file-text'" :class="lampiranLoading ? 'animate-spin' : ''" class="h-5 w-5 shrink-0" /><span class="break-all">Lampiran/{{ item.no_usulan || '-' }}</span></button></div>
        </div>
        <div v-if="!collapsed.info && (item.keterangan || item.catatan)" class="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h4 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Keterangan</h4>
          <p class="rounded-lg bg-gray-50 p-3 text-sm italic text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">{{ item.keterangan || item.catatan }}</p>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white"><UIcon name="i-lucide-users" class="h-4 w-4 text-primary-500" />Atasan Managerial Berjenjang</h3>
        <div class="space-y-2">
          <div v-for="(v, i) in item.atasan_managerial" :key="i" class="flex items-center justify-between rounded-lg p-3" :class="verifikatorRowClass(v.status)">
            <div class="flex items-center gap-3"><span :class="verifikatorDotClass(v.status)" class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white">{{ v.urutan }}</span><div><p class="text-sm font-medium text-gray-800 dark:text-white">{{ v.name }}</p><p class="text-xs text-gray-500">{{ v.jabatan || v.positionText || '-' }}</p></div></div>
            <span :class="verifikatorBadgeClass(v.status)" class="text-[11px]">{{ verifikatorLabel(v.status) }}</span>
          </div>
          <div v-if="!item.atasan_managerial?.length" class="py-2 text-sm italic text-gray-400">Tidak ada verifikator</div>
        </div>
      </div>

      <TransferDetailCard :transfer="normalizedTransfer" :daftar-berkas="archiveRows" :daftar-isi="daftarIsi" :collapsible="true" :show-information-card="false" :show-approval-levels="false" :show-bac-signer="false" :show-bac-tembusan="false" :show-tu-approval-levels="false" berkas-layout="penataan" />
      <TransferBeritaAcaraCard :transfer="normalizedTransfer" :berita-acara-data="beritaAcaraData" preview-icon="eye" />

      <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
          <div class="min-w-0 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div class="mb-4 flex items-center justify-between gap-3"><h3 class="text-base font-semibold text-gray-900 dark:text-white">Foto dokumentasi</h3><button type="button" @click="collapsed.foto = !collapsed.foto" class="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" :aria-expanded="!collapsed.foto" aria-label="Lipat foto dokumentasi"><UIcon :name="collapsed.foto ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-5 w-5" /></button></div>
            <div v-if="!collapsed.foto" class="flex min-h-64 items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900/40"><a v-if="fotoDokumentasiUrl" :href="fotoDokumentasiUrl" target="_blank" rel="noopener noreferrer" class="group relative block h-full w-full"><img :src="fotoDokumentasiUrl" alt="Foto dokumentasi arsip" class="h-64 w-full rounded-lg object-contain" /><span class="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100"><UIcon name="i-lucide-eye" class="mr-1.5 h-4 w-4" />Lihat foto</span></a><p v-else class="px-4 py-10 text-sm text-gray-400">Foto dokumentasi belum tersedia.</p></div>
          </div>
          <div class="grid min-w-0 content-start gap-5">
            <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><div class="mb-4 flex items-center justify-between gap-3"><h3 class="text-base font-semibold text-gray-900 dark:text-white">Lokasi penyimpanan</h3><button type="button" @click="collapsed.lokasi = !collapsed.lokasi" class="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" :aria-expanded="!collapsed.lokasi" aria-label="Lipat lokasi penyimpanan"><UIcon :name="collapsed.lokasi ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-5 w-5" /></button></div><div v-if="!collapsed.lokasi" class="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3"><div><span class="text-sm text-gray-500 dark:text-gray-400">Label boks</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.labelPenataan || [item.rak, item.baris, item.kolom].filter(Boolean).join('.') || '-' }}</p></div><div><span class="text-sm text-gray-500 dark:text-gray-400">Lokasi</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.lokasi_simpan || '-' }}</p></div><div><span class="text-sm text-gray-500 dark:text-gray-400">No. ruang</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.rak || '-' }}</p></div><div><span class="text-sm text-gray-500 dark:text-gray-400">No. rak</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.baris || '-' }}</p></div><div><span class="text-sm text-gray-500 dark:text-gray-400">No. boks</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.kolom || '-' }}</p></div></div></section>
            <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><h3 class="text-base font-semibold text-gray-900 dark:text-white">Kondisi Arsip</h3><p class="mt-2 whitespace-pre-line text-base text-gray-600 dark:text-gray-300">{{ item.kondisiArsip || readConditionAndMedia(item.keteranganPenataan || item.keterangan || item.catatan, 'Kondisi') || '-' }}</p><div class="my-4 border-t border-gray-100 dark:border-gray-700" /><h3 class="text-base font-semibold text-gray-900 dark:text-white">Media Arsip</h3><p class="mt-2 whitespace-pre-line text-base text-gray-600 dark:text-gray-300">{{ item.mediaArsip || readConditionAndMedia(item.keteranganPenataan || item.keterangan || item.catatan, 'Media') || '-' }}</p></section>
          </div>
        </div>
      </section>
    </section>

    <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <button type="button" class="flex w-full items-center justify-between gap-3 text-left" :aria-expanded="!collapsed.timeline" @click="collapsed.timeline = !collapsed.timeline"><h3 class="text-base font-semibold text-gray-900 dark:text-white">Timeline Riwayat</h3><UIcon :name="collapsed.timeline ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-4 w-4 text-gray-400" /></button>
      <div v-if="!collapsed.timeline" class="mt-4 space-y-1"><div v-for="(step, i) in reversedSteps" :key="step.key" class="flex gap-3" :class="i < reversedSteps.length - 1 ? 'pb-4' : ''"><div class="flex flex-col items-center"><div :class="stepDotClass(step.step)" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"><UIcon v-if="stepIndex >= step.step" name="i-lucide-check" class="h-4 w-4" /><span v-else class="text-xs font-semibold">{{ step.step + 1 }}</span></div><div v-if="i < reversedSteps.length - 1" class="mt-1 w-0.5 flex-1 bg-green-300 dark:bg-green-700" /></div><div class="min-w-0 flex-1"><p :class="stepTextClass(step.step)" class="text-sm font-medium">{{ step.label }}</p><p class="mt-0.5 text-xs text-gray-400">{{ step.desc }}</p></div></div></div>
    </section>
    <SharedSharePdfViewer v-model="lampiranPreviewOpen" :url="lampiranPreviewUrl" :title="lampiranPreviewTitle" :loading="lampiranLoading" @close="closeLampiranPreview" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import type { ArsipPenyusutan } from '~/types/penyusutan'
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue'
import TransferBeritaAcaraCard from '~/components/transfer-active-to-inactive/TransferBeritaAcaraCard.vue'

const props = defineProps<{
  item: ArsipPenyusutan
  transfer?: any
  daftarBerkas?: any[]
  daftarIsi?: any[]
  beritaAcaraData?: any
}>()

const { api, apiGet } = useApi()
const toast = useToast()
const runtimeConfig = useRuntimeConfig()
const collapsed = reactive({ info: false, foto: false, lokasi: false, timeline: false })
const lampiranPreviewOpen = ref(false)
const lampiranLoading = ref(false)
const lampiranPreviewUrl = ref('')
const lampiranPreviewTitle = ref('Preview Lampiran')
const firstValue = (...values: any[]) => values.find((value) => value !== undefined && value !== null && value !== '' && value !== '-')

const archiveRows = computed(() => {
  const archives = props.daftarBerkas?.length
    ? props.daftarBerkas
    : props.item.daftar_arsip ?? props.item.daftarArsip ?? []

  return archives.map((archive: any, index: number) => ({
    ...archive,
    no: archive.no ?? index + 1,
    id: archive.id,
    kode: archive.kode ?? archive.kodeBerkas ?? archive.kode_berkas ?? props.item.kode_berkas,
    namaBerkas: archive.namaBerkas ?? archive.nama_berkas ?? archive.nama ?? archive.perihal ?? props.item.nama_berkas,
    uraianInformasi: archive.uraianInformasi ?? archive.uraian_informasi ?? archive.namaBerkas ?? archive.nama_berkas ?? archive.perihal ?? archive.nama ?? props.item.nama_berkas,
    klasifikasi: firstValue(archive.klasifikasiText, archive.klasifikasiTeks, archive.klasifikasi_text, archive.namaKlasifikasi, archive.nama_klasifikasi, archive.klasifikasi !== props.item.klasifikasi ? archive.klasifikasi : null, props.item.klasifikasiText, props.item.klasifikasi_text),
    kodeKlasifikasi: firstValue(archive.kodeKlasifikasi, archive.kode_klasifikasi, archive.klasifikasiKode, archive.klasifikasi_kode, archive.klasifikasi === props.item.klasifikasi ? archive.klasifikasi : null, props.item.klasifikasi),
    kurunWaktu: archive.kurunWaktu ?? archive.kurun_waktu ?? archive.tanggalDibuat ?? archive.tanggal_dibuat ?? props.item.kurunWaktu ?? props.item.kurun_waktu,
    jumlahBerkas: archive.jumlahBerkas ?? archive.jumlah_berkas ?? archive.jumlah ?? props.item.jumlahBerkas ?? props.item.jumlah_berkas,
    jumlah: archive.jumlah ?? archive.jumlahBerkas ?? archive.jumlah_berkas ?? props.item.jumlahBerkas ?? props.item.jumlah_berkas,
    lokasiSimpan: archive.lokasiSimpan ?? archive.lokasi_simpan ?? props.item.lokasi_simpan,
    klasifikasiKeamanan: archive.klasifikasiKeamanan ?? archive.klasifikasi_keamanan ?? props.item.klasifikasiKeamanan ?? props.item.klasifikasi_keamanan,
    tanggalRetensiInaktifBerakhir: archive.tanggalRetensiInaktifBerakhir ?? archive.tanggal_retensi_inaktif_berakhir,
  }))
})

const normalizedTransfer = computed(() => {
  const transfer = props.transfer ?? {}
  return {
    ...transfer,
    id: transfer.id ?? props.item.transferId ?? props.item.transfer_id ?? props.item.id,
    status: transfer.status ?? 'SELESAI',
    nomorUsulan: transfer.nomorUsulan ?? props.item.no_usulan,
    arsipKode: transfer.arsipKode ?? props.item.kode_berkas,
    arsipPerihal: transfer.arsipPerihal ?? props.item.nama_berkas,
    arsipIds: transfer.arsipIds ?? archiveRows.value.map((row: any) => ({
      id: row.id,
      kode: row.kode,
      perihal: row.uraianInformasi ?? row.namaBerkas,
    })),
    lokasiPenataan: props.item.lokasi_simpan ?? transfer.lokasiPenataan ?? null,
    labelPenataan: props.item.labelPenataan ?? transfer.labelPenataan ?? null,
    rak: props.item.rak ?? transfer.rak ?? null,
    baris: props.item.baris ?? transfer.baris ?? null,
    kolom: props.item.kolom ?? transfer.kolom ?? null,
  }
})

const fotoDokumentasiUrl = computed(() => {
  const key = props.item.foto_dokumentasi || props.item.fotoDokumentasi || props.transfer?.fotoPenataan || props.transfer?.foto_penataan
  if (!key) return ''
  if (/^https?:\/\//i.test(key)) return key
  const baseUrl = api.defaults.baseURL || runtimeConfig.public.apiBaseUrl || ''
  return `${baseUrl}/tu/penataan-arsip/foto?key=${encodeURIComponent(key)}`
})

const statusLabel = (status: string) => ({ draft: 'Draft', diajukan: 'Menunggu Persetujuan', diterima: 'Disetujui', ditolak: 'Ditolak', selesai: 'Selesai' } as Record<string, string>)[status] ?? status
const statusBadgeClass = (status: string) => {
  const styles: Record<string, string> = {
    draft: 'rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    diajukan: 'rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    diterima: 'rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900 dark:text-green-300',
    ditolak: 'rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-900 dark:text-red-300',
    selesai: 'rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  }
  return styles[status] ?? styles.draft
}

const verifikatorLabel = (status: string) => ({ MENUNGGU: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak' } as Record<string, string>)[status] ?? status
const verifikatorBadgeClass = (status: string) => {
  const normalized = status?.toUpperCase()
  if (normalized === 'DISETUJUI') return 'rounded-full bg-green-500 px-2 py-0.5 font-medium text-white'
  if (normalized === 'DITOLAK') return 'rounded-full bg-red-500 px-2 py-0.5 font-medium text-white'
  if (normalized === 'MENUNGGU') return 'rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  return 'rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}
const verifikatorRowClass = (status: string) => {
  const normalized = status?.toUpperCase()
  if (normalized === 'DISETUJUI') return 'bg-green-50 ring-1 ring-green-200 dark:bg-green-900/20 dark:ring-green-800'
  if (normalized === 'DITOLAK') return 'bg-red-50 ring-1 ring-red-200 dark:bg-red-900/20 dark:ring-red-800'
  return 'bg-gray-50 dark:bg-gray-700/50'
}
const verifikatorDotClass = (status: string) => status?.toUpperCase() === 'DISETUJUI' ? 'bg-green-500' : status?.toUpperCase() === 'DITOLAK' ? 'bg-red-500' : 'bg-[#457fb6]'

const stepIndex = computed(() => {
  const status = props.item.status
  if (status === 'diajukan' || status === 'ditolak') return 1
  if (status === 'diterima') return 2
  if (status === 'selesai') return 3
  return 0
})
const reversedSteps = computed(() => {
  const finalDescription = props.item.jenis_penyusutan === 'permanen' ? 'Arsip telah disimpan (dipermanenkan)' : 'Arsip telah dimusnahkan'
  return [
    { key: 'selesai', step: 3, label: 'Selesai', desc: finalDescription },
    { key: 'diterima', step: 2, label: 'Disetujui', desc: 'Atasan Managerial Unit Dokumen menyetujui penyusutan' },
    { key: 'diajukan', step: 1, label: 'Menunggu Persetujuan', desc: 'Telah diajukan ke Atasan Managerial Unit Dokumen' },
    { key: 'draft', step: 0, label: 'Draft', desc: 'Arsip inaktif dan retensi habis' },
  ]
})
const stepDotClass = (step: number) => step < stepIndex.value ? 'bg-green-500 text-white' : step === stepIndex.value ? 'bg-[#457fb6] text-white ring-4 ring-[#457fb6]/20' : 'bg-gray-200 text-gray-400 dark:bg-gray-600'
const stepTextClass = (step: number) => step < stepIndex.value ? 'text-gray-900 dark:text-white' : step === stepIndex.value ? 'font-semibold text-[#457fb6] dark:text-[#5a9ad6]' : 'text-gray-400'

const readConditionAndMedia = (value: string | null | undefined, field: 'Kondisi' | 'Media') => {
  const text = String(value ?? '')
  const start = text.indexOf(`${field}: `)
  if (start < 0) return ''
  const remaining = text.slice(start + field.length + 2)
  const nextField = remaining.search(/\n(?:Kondisi|Media|Tingkat Perkembangan): /)
  return remaining.slice(0, nextField >= 0 ? nextField : undefined).trim()
}

const closeLampiranPreview = () => {
  lampiranPreviewOpen.value = false
  if (lampiranPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(lampiranPreviewUrl.value)
  lampiranPreviewUrl.value = ''
}
const openLampiran = async () => {
  const transferId = props.transfer?.id ?? props.item.transferId ?? props.item.transfer_id
  if (!transferId) {
    toast.add({ title: 'Lampiran tidak tersedia', description: 'Data penataan arsip belum ditemukan.', color: 'warning' })
    return
  }
  closeLampiranPreview()
  lampiranPreviewTitle.value = `Lampiran/${props.item.no_usulan || ''}`
  lampiranPreviewOpen.value = true
  lampiranLoading.value = true
  try {
    let response: any = await apiGet(`/transfer-active-to-inactive/${transferId}/lampiran-penataan.pdf`, { responseType: 'blob', headers: { Accept: 'application/pdf' } }, { skipCache: true })
    if (response && typeof response === 'object' && !(response instanceof Blob) && 'data' in response) response = response.data
    const blob = response instanceof Blob ? response : response instanceof ArrayBuffer ? new Blob([response], { type: 'application/pdf' }) : ArrayBuffer.isView(response) ? new Blob([new Uint8Array(response.buffer, response.byteOffset, response.byteLength)], { type: 'application/pdf' }) : null
    if (!blob || blob.size === 0 || (await blob.slice(0, 5).text()) !== '%PDF-') throw new Error('Lampiran PDF tidak valid.')
    lampiranPreviewUrl.value = URL.createObjectURL(blob)
  } catch (error: any) {
    lampiranPreviewOpen.value = false
    toast.add({ title: 'Lampiran gagal dibuka', description: error?.message || 'Silakan coba kembali.', color: 'error' })
  } finally {
    lampiranLoading.value = false
  }
}

onBeforeUnmount(closeLampiranPreview)
</script>
