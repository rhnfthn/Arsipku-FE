<template>
  <div class="mx-auto w-full max-w-none rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Berita Acara</h3>
      <span
          v-if="transfer.bacSignedAt"
          class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
        >
          <UIcon name="i-lucide-badge-check" class="h-3.5 w-3.5" /> Ditandatangani
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="openPreview"
          class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
          title="Preview Berita Acara"
          aria-label="Preview Berita Acara"
        >
          <UIcon :name="props.previewIcon === 'eye' ? 'i-lucide-eye' : 'i-lucide-printer'" class="h-5 w-5" />
        </button>
        <button
          type="button"
          @click="open = !open"
          :aria-expanded="open"
          class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
          :title="open ? 'Lipat Berita Acara' : 'Buka Berita Acara'"
        >
          <UIcon :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div v-show="open" class="overflow-x-auto">
      <div id="transfer-berita-acara-print" class="mx-auto w-full max-w-[794px] bg-white p-8 text-sm leading-relaxed text-black shadow-sm ring-1 ring-gray-200" style="font-family: 'Times New Roman', serif;">
        <div class="mb-6 text-center">
          <p class="m-0 underline">BERITA ACARA</p>
          <p class="m-0">TENTANG</p>
          <p class="m-0 uppercase">PEMINDAHAN ARSIP INAKTIF TAHUN {{ year }} - UNIT KERJA {{ unitKerjaPengusul }}</p>
          <p class="mt-2">Nomor : {{ transfer.beritaAcaraNomor ?? `BA/${transfer.nomorUsulan ?? '-'}` }}</p>
        </div>

        <p class="mb-5 text-justify">
          Pada hari ini {{ formatBaDay(transfer.tanggalUsulan) }} tanggal {{ formatBaDate(transfer.tanggalUsulan) }}, dilaksanakan pemindahan arsip inaktif dari Unit Kerja {{ unitKerjaPengusul }} ke Unit Kerja {{ unitKerjaTu }} yang melibatkan:
        </p>

        <table class="mb-3 w-[calc(100%-42px)] border-0 border-collapse ml-[42px]">
          <tbody>
            <tr><td class="w-[42px] p-0 align-top">1.</td><td class="w-[92px] p-0 align-top">Nama</td><td class="w-[22px] p-0 align-top">:</td><td class="p-0 align-top">{{ transfer.bacPihakPertamaName ?? '-' }}</td></tr>
            <tr><td class="p-0" /><td class="p-0 align-top">e-NIK</td><td class="p-0 align-top">:</td><td class="p-0 align-top">{{ transfer.bacPihakPertamaPersnum ?? '-' }}</td></tr>
            <tr><td class="p-0" /><td class="p-0 align-top">Jabatan</td><td class="p-0 align-top">:</td><td class="p-0 align-top">{{ transfer.bacPihakPertamaJabatan ?? '-' }}</td></tr>
          </tbody>
        </table>
        <p class="mb-5 ml-[42px] text-justify">Dalam hal ini bertindak atas nama pimpinan Unit Kerja {{ unitKerjaPihakPertama }} yang selanjutnya disebut PIHAK PERTAMA.</p>

        <table class="mb-3 w-[calc(100%-42px)] border-0 border-collapse ml-[42px]">
          <tbody>
            <tr><td class="w-[42px] p-0 align-top">2.</td><td class="w-[92px] p-0 align-top">Nama</td><td class="w-[22px] p-0 align-top">:</td><td class="p-0 align-top">{{ data?.pihakKedua?.nama || transfer.bacPihakKeduaName || '-' }}</td></tr>
            <tr><td class="p-0" /><td class="p-0 align-top">e-NIK</td><td class="p-0 align-top">:</td><td class="p-0 align-top">{{ data?.pihakKedua?.enik || transfer.bacPihakKeduaPersnum || '-' }}</td></tr>
            <tr><td class="p-0" /><td class="p-0 align-top">Jabatan</td><td class="p-0 align-top">:</td><td class="p-0 align-top">{{ data?.pihakKedua?.jabatan || transfer.bacPihakKeduaJabatan || '-' }}</td></tr>
          </tbody>
        </table>
        <p class="mb-6 ml-[42px] text-justify">Dalam hal ini bertindak atas nama pimpinan Unit Kerja {{ unitKerjaPihakKedua }} yang selanjutnya disebut PIHAK KEDUA.</p>

        <p class="mb-5 text-justify">Menyatakan telah melaksanakan serah terima pemindahan arsip inaktif seperti tercantum pada daftar arsip terlampir.</p>
        <p class="mb-1">Daftar arsip:</p>
        <p v-if="arsip.length === 1" class="mb-6 pl-5">{{ arsip[0].kode ?? '-' }} — {{ arsip[0].perihal ?? '-' }}</p>
        <ol v-else class="mb-6 pl-10">
          <li v-for="(row, index) in arsip" :key="index">{{ row.kode ?? '-' }} — {{ row.perihal ?? '-' }}</li>
        </ol>

        <p class="mb-14 text-justify">Demikian Berita Acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
        <table class="w-full border-0">
          <tbody><tr>
            <td class="w-1/2 align-top"><p class="mb-5">Pihak Pertama</p><div v-if="transfer.bacSignedAt && transfer.bacSignatureQr" class="mb-2 h-[92px]"><img :src="transfer.bacSignatureQr" alt="QR tanda tangan Pihak Pertama" class="block h-[82px] w-[82px] object-contain" /></div><p v-else class="mb-[78px]">Ttd</p><p>({{ transfer.bacPihakPertamaJabatan ?? 'Jabatan' }})</p></td>
            <td class="w-1/2 align-top"><p class="mb-5">Pihak Kedua</p><div v-if="transfer.bacPihakKeduaSignedAt && transfer.bacPihakKeduaSignatureQr" class="mb-2 h-[92px]"><img :src="transfer.bacPihakKeduaSignatureQr" alt="QR tanda tangan Pihak Kedua" class="block h-[82px] w-[82px] object-contain" /></div><p v-else class="mb-[78px]">Ttd</p><p>({{ transfer.bacPihakKeduaJabatan ?? 'Jabatan' }})</p></td>
          </tr></tbody>
        </table>
      </div>
    </div>

    <SharedSharePdfViewer
      v-model="bacPreviewOpen"
      :url="bacPreviewUrl"
      :title="bacPreviewTitle"
      :loading="bacPreviewLoading"
      @close="closeBacPreview"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  transfer: any
  beritaAcaraData?: any
  previewIcon?: 'eye' | 'printer'
}>()
const open = ref(true)
const {
  bacPreviewOpen,
  bacPreviewLoading,
  bacPreviewUrl,
  bacPreviewTitle,
  openBacPreview,
  closeBacPreview,
} = useBacPdfPreview()
const openPreview = () => openBacPreview(
  String(props.transfer.id),
  props.transfer.beritaAcaraNomor || props.transfer.nomorUsulan,
)
const data = computed(() => props.beritaAcaraData ?? {})
const arsip = computed(() => {
  const fromBeritaAcara = data.value?.daftarArsip
  if (Array.isArray(fromBeritaAcara) && fromBeritaAcara.length > 0) return fromBeritaAcara
  return Array.isArray(props.transfer?.arsipIds) ? props.transfer.arsipIds : []
})
const unitKerjaPengusul = computed(() => data.value?.unitKerjaPengusul || props.transfer?.divisiName || '.........')
const unitKerjaTu = computed(() => data.value?.unitKerjaTu || 'UC')
const unitKerjaPihakPertama = computed(() => data.value?.pihakPertama?.unitKerja || unitKerjaPengusul.value)
// Pihak kedua baru dipilih Unit Dokumen, sehingga tetap kosong sebelum tahap tersebut.
const unitKerjaPihakKedua = computed(() => data.value?.pihakKedua?.unitKerja || '')
const year = computed(() => props.transfer?.tanggalUsulan ? new Date(props.transfer.tanggalUsulan).getFullYear() : new Date().getFullYear())

const formatBaDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const formatBaDay = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date(dateStr).getDay()]
}
</script>
