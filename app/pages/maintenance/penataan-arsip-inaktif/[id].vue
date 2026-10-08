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
      <div class="w-full space-y-5">
        <TransferDetailCard
          :transfer="sharedTransfer"
          :daftar-berkas="daftarBerkas"
          :daftar-isi="daftarIsiData"
          berkas-layout="penataan"
          :unit-kerja-pihak-pertama="unitKerjaPihakPertama"
          :preview-from="'tu'"
          :collapsible="true"
          :show-bac-signer="false"
          :show-bac-tembusan="false"
          :show-tu-approval-levels="false"
          information-title="Informasi Berkas"
          information-layout="penataan"
          :show-bac-status="false"
        />

        <TransferBeritaAcaraCard
          v-if="canShowBeritaAcara && sharedTransfer"
          :transfer="sharedTransfer"
          :berita-acara-data="beritaAcaraData"
          preview-icon="eye"
        />

        <!-- Penataan Arsip (form) -->
        <div v-if="item.status === 'ARSIP_INAKTIF_DITERIMA' && mode === 'penataan'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Form Penataan Arsip</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Lokasi Penyimpanan</label>
              <input v-model="form.lokasi" type="text" placeholder="Lokasi penyimpanan..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">No. Ruang</label>
              <input v-model="form.rak" type="text" placeholder="Contoh: A1"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">No. Rak</label>
              <input v-model="form.baris" type="text" placeholder="Contoh: 01"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">No. Boks</label>
              <input v-model="form.kolom" type="text" placeholder="Contoh: 0001"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Label</label>
              <input :value="generatedLabel" type="text" readonly aria-describedby="label-penataan-help"
                placeholder="Contoh: A1.01.0001"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/70 text-gray-700 dark:text-gray-200 cursor-not-allowed" />
              <p id="label-penataan-help" class="mt-1 text-xs text-gray-400">Terbentuk otomatis dari No. Ruang, No. Rak, dan No. Boks (contoh: A1.01.0001).</p>
            </div>
          </div>
          <div class="mt-4 max-w-md">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tingkat Perkembangan</label>
            <select v-model="form.tingkatPerkembangan"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Pilih tingkat perkembangan</option>
              <option value="Asli">Asli</option>
              <option value="Salinan">Salinan</option>
              <option value="Asli dan Salinan">Asli dan Salinan</option>
            </select>
          </div>
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Kondisi Arsip</label>
              <textarea v-model="form.kondisi" rows="3" placeholder="Contoh: kondisi arsip baik..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Media Arsip</label>
              <textarea v-model="form.media" rows="3" placeholder="Contoh: kertas, foto, atau media lainnya..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
            </div>
          </div>

          <!-- Foto Lampiran Penataan (Max 5MB) -->
          <div class="mt-4">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Foto Lampiran Penataan <span class="text-gray-400">(Max 5MB, JPEG/PNG/WebP/GIF)</span>
            </label>
            <div v-if="fotoPreview" class="relative inline-block mb-2">
              <img :src="fotoPreview" alt="Foto penataan" class="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600" />
              <button type="button" @click="removeFoto"
                class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
              </button>
            </div>
            <div v-else>
              <label
                class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div class="flex flex-col items-center justify-center pt-4 pb-5">
                  <UIcon name="i-lucide-upload-cloud" class="w-8 h-8 text-gray-400 mb-2" />
                  <p class="text-sm text-gray-500 dark:text-gray-400">Klik untuk upload foto</p>
                  <p class="text-xs text-gray-400 mt-1">Max 5MB</p>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onFotoChange" />
              </label>
            </div>
            <p v-if="fotoError" class="text-xs text-red-500 mt-1">{{ fotoError }}</p>
            <p v-if="uploadingFoto" class="text-xs text-blue-500 mt-1">Mengupload foto...</p>
          </div>

          <div class="mt-4">
            <button @click="onSelesai" :disabled="actionLoading || uploadingFoto"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 transition-colors">
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-check-circle" class="w-4 h-4 mr-1 inline" /> Selesai Penataan
            </button>
          </div>
        </div>

        <!-- Status Selesai — Card Penataan -->
        <div v-if="item.status === 'SELESAI'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
          <!-- Header banner -->
          <div class="bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-700 dark:to-green-800 px-5 py-4 flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm shrink-0">
              <UIcon name="i-lucide-check-circle" class="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Penataan Selesai</h3>
              <p class="text-xs text-emerald-50 dark:text-emerald-100 mt-0.5">Arsip telah berhasil ditata dan disimpan</p>
            </div>
          </div>

          <!-- Body -->
          <div class="p-5">
            <!-- Lokasi Penyimpanan -->
            <div class="mb-5">
              <h4 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <UIcon name="i-lucide-map-pin" class="w-3.5 h-3.5" /> Lokasi Penyimpanan
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <!-- Label boks -->
                <div class="col-span-2 sm:col-span-4 flex flex-col items-center text-center p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                  <UIcon name="i-lucide-tag" class="w-5 h-5 text-primary-500 mb-1.5" />
                  <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Label</span>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ savedGeneratedLabel || item.labelPenataan || '-' }}</p>
                </div>
                <!-- Lokasi -->
                <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary-500 mb-1.5" />
                  <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Lokasi</span>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.lokasiPenataan || '-' }}</p>
                </div>
                <!-- Rak -->
                <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <UIcon name="i-lucide-library" class="w-5 h-5 text-primary-500 mb-1.5" />
                  <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">No. Ruang</span>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.rak || '-' }}</p>
                </div>
                <!-- Baris -->
                <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <UIcon name="i-lucide-rows-3" class="w-5 h-5 text-primary-500 mb-1.5" />
                  <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">No. Rak</span>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.baris || '-' }}</p>
                </div>
                <!-- Kolom -->
                <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <UIcon name="i-lucide-columns-3" class="w-5 h-5 text-primary-500 mb-1.5" />
                  <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">No. Boks</span>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.kolom || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Keterangan -->
            <div v-if="item.keteranganPenataan" class="mb-5">
              <h4 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <UIcon name="i-lucide-sticky-note" class="w-3.5 h-3.5" /> Keterangan
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
                {{ item.keteranganPenataan }}
              </p>
            </div>

            <!-- Foto Penataan -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <UIcon name="i-lucide-camera" class="w-3.5 h-3.5" /> Foto Dokumentasi
                </h4>
                <!-- Button Edit Foto -->
                <button
                  v-if="!isEditingFoto"
                  @click="startEditFoto"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5" /> Edit Foto
                </button>
                <button
                  v-else
                  @click="cancelEditFoto"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <UIcon name="i-lucide-x" class="w-3.5 h-3.5" /> Batal
                </button>
              </div>

              <!-- Mode View (foto ada) -->
              <div v-if="!isEditingFoto && item.fotoPenataan && !fotoLoadError" class="relative group inline-block">
                <a :href="fotoUrl(item.fotoPenataan)" target="_blank" class="block">
                  <img
                    :src="fotoUrl(item.fotoPenataan)"
                    alt="Foto penataan"
                    class="w-full max-w-sm h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-600 transition-shadow group-hover:shadow-lg"
                    @error="onFotoError"
                  />
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
                    <span class="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium flex items-center gap-1.5">
                      <UIcon name="i-lucide-eye" class="w-4 h-4" /> Lihat Foto
                    </span>
                  </div>
                </a>
              </div>

              <!-- Mode View (foto tidak ada) -->
              <div v-else-if="!isEditingFoto" class="flex flex-col items-center justify-center w-full max-w-sm h-48 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
                <UIcon name="i-lucide-image-off" class="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p class="text-sm text-gray-400 dark:text-gray-500">Foto tidak tersedia</p>
              </div>

              <!-- Mode Edit (upload ulang) -->
              <div v-else class="space-y-3">
                <div v-if="fotoPreview" class="relative inline-block">
                  <img :src="fotoPreview" alt="Foto penataan" class="w-full max-w-sm h-48 object-cover rounded-xl border border-gray-300 dark:border-gray-600" />
                  <button type="button" @click="removeFoto"
                    class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                    <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
                  </button>
                </div>
                <label
                  v-else
                  class="flex flex-col items-center justify-center w-full max-w-sm h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div class="flex flex-col items-center justify-center pt-4 pb-5">
                    <UIcon name="i-lucide-upload-cloud" class="w-8 h-8 text-gray-400 mb-2" />
                    <p class="text-sm text-gray-500 dark:text-gray-400">Klik untuk upload foto</p>
                    <p class="text-xs text-gray-400 mt-1">Max 5MB, JPEG/PNG/WebP/GIF</p>
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onFotoChange" />
                </label>
                <p v-if="fotoError" class="text-xs text-red-500">{{ fotoError }}</p>
                <p v-if="uploadingFoto" class="text-xs text-blue-500">Mengupload foto...</p>
                <button
                  v-if="fotoKey"
                  @click="onSaveFoto"
                  :disabled="actionLoading || uploadingFoto"
                  class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 transition-colors"
                >
                  <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
                  <UIcon v-else name="i-lucide-save" class="w-4 h-4 mr-1 inline" /> Simpan Foto
                </button>
              </div>
            </div>
          </div>
        </div>

        <TimelineRiwayat v-if="sharedTransfer" :item="sharedTransfer" />
      </div>
    </template>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">Arsip tidak ditemukan</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import type { TuUsulanItem } from '~/types/tu-verifikasi'
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive'
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue'
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue'
import TransferBeritaAcaraCard from '~/components/transfer-active-to-inactive/TransferBeritaAcaraCard.vue'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { fetchPenataanDetail, selesaiPenataan, uploadFotoPenataan } = useTuVerifikasi()
const { api, apiGet } = useApi()
const config = useRuntimeConfig()

const item = ref<TuUsulanItem | null>(null)
const beritaAcaraData = ref<any>(null)
const daftarBerkasData = ref<any[]>([])
const daftarIsiData = ref<any[]>([])
const loading = ref(true)
const actionLoading = ref(false)
const mode = ref<'detail' | 'penataan'>('detail')
const fromPenataanQuery = route.query.mode === 'penataan'
const sharedTransfer = computed(() =>
  item.value ? (item.value as unknown as TransferActiveToInactive) : null
)
const unitKerjaPihakPertama = computed(() =>
  beritaAcaraData.value?.pihakPertama?.unitKerja
    || beritaAcaraData.value?.pihakPertamaUnitKerja
    || beritaAcaraData.value?.unitKerjaPengusul
    || item.value?.divisiName
    || '................................'
)
const canShowBeritaAcara = computed(() =>
  Boolean(item.value && [
    'DISETUJUI_ATASAN',
    'DISETUJUI_VERIFIKASI_TERAKHIR',
    'USUL_PINDAH_DIKIRIM',
    'SIAPKAN_BERKAS_FISIK',
    'DIKIRIM',
    'MENUNGGU_VERIFIKASI_BERKAS_FISIK',
    'BERKAS_FISIK_SESUAI',
    'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU',
    'DISETUJUI_PERSETUJUAN_TU',
    'MENUNGGU_PERSETUJUAN_TERAKHIR_TU',
    'DISETUJUI_PERSETUJUAN_TERAKHIR_TU',
    'MENUNGGU_TTD_PIHAK_KEDUA',
    'ARSIP_INAKTIF_DITERIMA',
    'PENATAAN_ARSIP_INAKTIF',
    'SELESAI',
  ].includes(item.value.status))
)

// Daftar berkas (dari arsipIds atau fallback ke arsip tunggal)
const daftarBerkas = computed(() => {
  if (!item.value) return []
  // Endpoint berita-acara-data hanya memuat ringkasan arsip. Gunakan endpoint
  // daftar-isi agar seluruh metadata pemberkasan tersedia pada tabel ini.
  if (daftarBerkasData.value.length > 0) return daftarBerkasData.value
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

// Jika ada query ?mode=penataan, langsung buka mode penataan
if (fromPenataanQuery) {
  mode.value = 'penataan'
}

const form = reactive({
  lokasi: '',
  rak: '',
  baris: '',
  kolom: '',
  kondisi: '',
  media: '',
  tingkatPerkembangan: '',
})

const joinPhysicalLabel = (parts: Array<string | null | undefined>) =>
  parts.map((part) => String(part ?? '').trim()).filter(Boolean).join('.')
const generatedLabel = computed(() => joinPhysicalLabel([form.rak, form.baris, form.kolom]))
const savedGeneratedLabel = computed(() =>
  item.value ? joinPhysicalLabel([item.value.rak, item.value.baris, item.value.kolom]) : ''
)
const serializeConditionAndMedia = () => {
  const parts = [
    form.kondisi.trim() ? `Kondisi: ${form.kondisi.trim()}` : '',
    form.media.trim() ? `Media: ${form.media.trim()}` : '',
    form.tingkatPerkembangan ? `Tingkat Perkembangan: ${form.tingkatPerkembangan}` : '',
  ].filter(Boolean)
  return parts.join('\n')
}
const restoreConditionAndMedia = (value: string | null | undefined) => {
  const text = String(value ?? '')
  if (
    !text.startsWith('Kondisi: ') &&
    !text.startsWith('Media: ') &&
    !text.startsWith('Tingkat Perkembangan: ')
  ) {
    form.kondisi = text
    form.media = ''
    form.tingkatPerkembangan = ''
    return
  }
  const readField = (label: string) => {
    const marker = `${label}: `
    const index = text.indexOf(marker)
    if (index < 0) return ''
    const start = index + marker.length
    const nextField = text.slice(start).search(/\n(?:Kondisi|Media|Tingkat Perkembangan): /)
    return text.slice(start, nextField >= 0 ? start + nextField : undefined)
  }
  form.kondisi = readField('Kondisi')
  form.media = readField('Media')
  form.tingkatPerkembangan = readField('Tingkat Perkembangan')
}

// Foto lampiran penataan
const fotoFile = ref<File | null>(null)
const fotoPreview = ref<string | null>(null)
const fotoKey = ref<string | null>(null)
const uploadingFoto = ref(false)
const fotoError = ref('')

/** Base URL API untuk foto penataan (fallback jika fotoPenataan adalah key). */
const apiBaseUrl = api.defaults.baseURL || config.public.apiBaseUrl || ''
const fotoUrl = (key: string) => {
  // Jika sudah URL lengkap (http/https), pakai langsung
  if (key.startsWith('http://') || key.startsWith('https://')) return key
  // Jika masih key (penataan/xxx), gunakan endpoint foto
  return `${apiBaseUrl}/tu/penataan-arsip/foto?key=${encodeURIComponent(key)}`
}

/** Fallback saat foto gagal load (broken image). */
const fotoLoadError = ref(false)
const isEditingFoto = ref(false)
const onFotoError = () => {
  fotoLoadError.value = true
}

const startEditFoto = () => {
  isEditingFoto.value = true
  fotoFile.value = null
  fotoPreview.value = null
  fotoKey.value = null
  fotoError.value = ''
  fotoLoadError.value = false
}

const cancelEditFoto = () => {
  isEditingFoto.value = false
  fotoFile.value = null
  fotoPreview.value = null
  fotoKey.value = null
  fotoError.value = ''
  // Restore foto lama jika ada
  if (item.value?.fotoPenataan) {
    fotoKey.value = item.value.fotoPenataan
    fotoPreview.value = fotoUrl(item.value.fotoPenataan)
  }
}

/** Simpan foto baru ke backend (update fotoPenataan tanpa ubah status). */
const onSaveFoto = async () => {
  if (!item.value || !fotoKey.value) return
  actionLoading.value = true
  try {
    const { apiPatch } = useApi()
    await apiPatch(`/tu/penataan-arsip/${item.value.id}/update-foto`, {
      fotoPenataan: fotoKey.value,
    })
    useToast().add({ title: 'Berhasil', description: 'Foto berhasil diperbarui.', color: 'success' })
    isEditingFoto.value = false
    await loadDetail()
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: e?.data?.message || 'Gagal memperbarui foto.', color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

const onFotoChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  fotoError.value = ''

  // Validasi ukuran (Max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    fotoError.value = 'Ukuran file melebihi 5MB.'
    input.value = ''
    return
  }
  // Validasi tipe
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    fotoError.value = 'Tipe file tidak diizinkan. Hanya JPEG, PNG, WebP, GIF.'
    input.value = ''
    return
  }

  fotoFile.value = file
  fotoPreview.value = URL.createObjectURL(file)

  // Upload langsung ke server
  uploadingFoto.value = true
  try {
    const res: any = await uploadFotoPenataan(file)
    // Backend return { key, url } — simpan key untuk update-foto,
    // dan url untuk preview langsung.
    fotoKey.value = res?.data?.key ?? res?.key ?? null
  } catch (err: any) {
    // Axios error: err.response.data.message; atau err.message
    const msg =
      err?.response?.data?.message ||
      err?.data?.message ||
      err?.message ||
      'Gagal upload foto.'
    fotoError.value = typeof msg === 'string' ? msg : 'Gagal upload foto.'
    fotoFile.value = null
    fotoPreview.value = null
    fotoKey.value = null
  } finally {
    uploadingFoto.value = false
  }
}

const removeFoto = () => {
  fotoFile.value = null
  fotoPreview.value = null
  fotoKey.value = null
  fotoError.value = ''
}

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penataan Arsip Inaktif', to: '/maintenance/penataan-arsip-inaktif' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/penataan-arsip-inaktif/${route.params.id}` },
])

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await fetchPenataanDetail(route.params.id as string)
    item.value = res?.data ?? res
    if (item.value) {
      if (canShowBeritaAcara.value) {
        try {
          const bacResponse: any = await apiGet(
            `/transfer-active-to-inactive/${item.value.id}/berita-acara-data`,
            undefined,
            { skipCache: true },
          )
          beritaAcaraData.value = bacResponse?.data?.data ?? bacResponse?.data ?? bacResponse
        } catch {
          beritaAcaraData.value = null
        }

        try {
          const daftarResponse: any = await apiGet(
            `/transfer-active-to-inactive/${item.value.id}/daftar-isi`,
            undefined,
            { skipCache: true },
          )
          const daftarData = daftarResponse?.data?.data ?? daftarResponse?.data ?? daftarResponse
          daftarBerkasData.value = Array.isArray(daftarData?.daftarBerkas)
            ? daftarData.daftarBerkas
            : []
          daftarIsiData.value = Array.isArray(daftarData?.daftarIsi)
            ? daftarData.daftarIsi
            : []
        } catch {
          daftarBerkasData.value = []
          daftarIsiData.value = []
        }
      }
      form.lokasi = item.value.lokasiPenataan || ''
      form.rak = item.value.rak || ''
      form.baris = item.value.baris || ''
      form.kolom = item.value.kolom || ''
      restoreConditionAndMedia(item.value.keteranganPenataan)
      // Jika sudah ada foto penataan (status SELESAI), tampilkan preview
      fotoLoadError.value = false  // reset error state setiap load
      if (item.value.fotoPenataan) {
        fotoKey.value = item.value.fotoPenataan
        // Gunakan nextTick agar <img> re-render dengan URL baru setelah
        // fotoLoadError di-reset (hindari race condition dengan @error).
        nextTick(() => {
          fotoPreview.value = fotoUrl(item.value.fotoPenataan!)
        })
      } else {
        fotoKey.value = null
        fotoPreview.value = null
      }
    }
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: 'Gagal memuat detail.', color: 'error' })
  } finally { loading.value = false }
}

const onSelesai = async () => {
  if (!item.value) return
  actionLoading.value = true
  try {
    // Pastikan fotoKey terkirim — bisa dari upload baru atau dari foto yang
    // sudah ada (saat edit penataan yang sudah selesai).
    const fotoKeyToSend = fotoKey.value || item.value.fotoPenataan || undefined
    await selesaiPenataan(item.value.id, {
      lokasi: form.lokasi || undefined,
      rak: form.rak || undefined,
      baris: form.baris || undefined,
      kolom: form.kolom || undefined,
      keterangan: serializeConditionAndMedia() || undefined,
      fotoPenataan: fotoKeyToSend,
    })
    useToast().add({ title: 'Berhasil', description: 'Penataan arsip selesai.', color: 'success' })
    await loadDetail()
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: e?.data?.message || 'Gagal menyelesaikan penataan.', color: 'error' })
  } finally { actionLoading.value = false }
}

onMounted(() => loadDetail())
</script>
