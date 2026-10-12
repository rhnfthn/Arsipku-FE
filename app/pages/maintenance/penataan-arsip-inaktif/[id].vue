<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Penataan Arsip Inaktif — ${item?.nomorUsulan ?? ''}`" :items="breadcrumbs" />
      <NuxtLink to="/kelola/pemeliharaan/penataan-arsip-inaktif"
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
          :show-atasan-managerial="false"
          :show-information-card="true"
          information-title="Informasi Berkas"
          information-layout="penataan"
          :show-bac-status="false"
        />

        <TransferBeritaAcaraCard
          v-if="canShowBeritaAcara && sharedTransfer"
          :transfer="sharedTransfer"
          :berita-acara-data="beritaAcaraData"
          preview-icon="printer"
        />

        <!-- Penataan Arsip (form) -->
        <div v-if="item.status === 'ARSIP_INAKTIF_DITERIMA' && mode === 'penataan'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Form Penataan Arsip</h3>
            <button
              type="button"
              class="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              :aria-expanded="formPenataanOpen"
              :aria-label="formPenataanOpen ? 'Lipat Form Penataan Arsip' : 'Buka Form Penataan Arsip'"
              @click="formPenataanOpen = !formPenataanOpen"
            >
              <UIcon :name="formPenataanOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-5 w-5" />
            </button>
          </div>
          <div v-show="formPenataanOpen">
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
          <div class="mt-4 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
            <!-- Foto Lampiran Penataan (Max 5MB) -->
            <div class="flex flex-col">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Foto Lampiran Penataan <span class="text-gray-400">(Max 5MB, JPEG/PNG/WebP/GIF)</span>
              </label>
              <div v-if="fotoPreview" class="relative inline-block">
                <img :src="fotoPreview" alt="Foto penataan" class="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600" />
                <button type="button" @click="removeFoto"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                  <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
                </button>
              </div>
              <label v-else
                class="flex min-h-32 w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                <UIcon name="i-lucide-upload-cloud" class="mb-2 h-8 w-8 text-gray-400" />
                <p class="text-sm text-gray-500 dark:text-gray-400">Klik untuk upload foto</p>
                <p class="mt-1 text-xs text-gray-400">Max 5MB</p>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onFotoChange" />
              </label>
              <p v-if="fotoError" class="mt-1 text-xs text-red-500">{{ fotoError }}</p>
              <p v-if="uploadingFoto" class="mt-1 text-xs text-blue-500">Mengupload foto...</p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Kondisi Arsip</label>
                <input v-model="form.kondisi" type="text" placeholder="Contoh: kondisi arsip baik..."
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Media Arsip</label>
                <input v-model="form.media" type="text" placeholder="Contoh: kertas, foto, atau media lainnya..."
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div class="pt-1">
                <button @click="onSelesai" :disabled="actionLoading || uploadingFoto"
                  class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 transition-colors">
                  <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
                  <UIcon v-else name="i-lucide-check-circle" class="w-4 h-4 mr-1 inline" /> Selesai Penataan
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Status Selesai — Card Penataan -->
        <div v-if="item.status === 'SELESAI'" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="grid grid-cols-1 items-stretch gap-5 p-5 lg:grid-cols-2">
            <section class="min-w-0 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div class="mb-3 flex items-center justify-between gap-3">
                <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Foto dokumentasi</h4>
                <button
                  v-if="!isEditingFoto"
                  @click="startEditFoto"
                  class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" /> Edit Foto
                </button>
                <button
                  v-else
                  @click="cancelEditFoto"
                  class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <UIcon name="i-lucide-x" class="h-3.5 w-3.5" /> Batal
                </button>
              </div>

              <div v-if="!isEditingFoto && item.fotoPenataan && !fotoLoadError" class="group relative">
                <a :href="fotoUrl(item.fotoPenataan)" target="_blank" rel="noopener noreferrer" class="block h-64 overflow-hidden rounded-md bg-gray-50 dark:bg-gray-900/30">
                  <img
                    :src="fotoUrl(item.fotoPenataan)"
                    alt="Foto penataan"
                    class="h-full w-full object-contain"
                    @error="onFotoError"
                  />
                  <span class="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                    <UIcon name="i-lucide-eye" class="mr-1 h-4 w-4" /> Lihat foto
                  </span>
                </a>
              </div>

              <div v-else-if="!isEditingFoto" class="flex h-64 flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-gray-600 dark:bg-gray-700/30">
                <UIcon name="i-lucide-image-off" class="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p class="text-sm">Foto tidak tersedia</p>
              </div>

              <div v-else class="space-y-3">
                <div v-if="fotoPreview" class="relative">
                  <img :src="fotoPreview" alt="Foto penataan" class="h-64 w-full rounded-md border border-gray-300 object-contain dark:border-gray-600" />
                  <button type="button" @click="removeFoto" class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
                    <UIcon name="i-lucide-x" class="h-4 w-4" />
                  </button>
                </div>
                <label v-else class="flex h-64 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                  <UIcon name="i-lucide-upload-cloud" class="mb-2 h-8 w-8 text-gray-400" />
                  <p class="text-sm text-gray-500 dark:text-gray-400">Klik untuk upload foto</p>
                  <p class="mt-1 text-xs text-gray-400">Max 5MB, JPEG/PNG/WebP/GIF</p>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onFotoChange" />
                </label>
                <p v-if="fotoError" class="text-xs text-red-500">{{ fotoError }}</p>
                <p v-if="uploadingFoto" class="text-xs text-blue-500">Mengupload foto...</p>
                <button
                  v-if="fotoKey"
                  @click="onSaveFoto"
                  :disabled="actionLoading || uploadingFoto"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
                >
                  <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="mr-1 inline h-4 w-4 animate-spin" />
                  <UIcon v-else name="i-lucide-save" class="mr-1 inline h-4 w-4" /> Simpan Foto
                </button>
              </div>
            </section>

            <div class="grid min-w-0 content-start gap-5">
              <section class="min-w-0 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 class="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Lokasi penyimpanan</h4>
                <dl class="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                  <div class="min-w-0">
                    <dt class="text-xs text-gray-500 dark:text-gray-400">Label boks</dt>
                    <dd class="mt-1 break-words text-sm font-medium text-gray-900 dark:text-white">{{ savedGeneratedLabel || item.labelPenataan || '-' }}</dd>
                  </div>
                  <div class="min-w-0">
                    <dt class="text-xs text-gray-500 dark:text-gray-400">Lokasi</dt>
                    <dd class="mt-1 break-words text-sm font-medium text-gray-800 dark:text-gray-200">{{ item.lokasiPenataan || '-' }}</dd>
                  </div>
                  <div class="min-w-0">
                    <dt class="text-xs text-gray-500 dark:text-gray-400">No. ruang</dt>
                    <dd class="mt-1 break-words text-sm font-medium text-gray-800 dark:text-gray-200">{{ item.rak || '-' }}</dd>
                  </div>
                  <div class="min-w-0">
                    <dt class="text-xs text-gray-500 dark:text-gray-400">No. rak</dt>
                    <dd class="mt-1 break-words text-sm font-medium text-gray-800 dark:text-gray-200">{{ item.baris || '-' }}</dd>
                  </div>
                  <div class="min-w-0">
                    <dt class="text-xs text-gray-500 dark:text-gray-400">No. boks</dt>
                    <dd class="mt-1 break-words text-sm font-medium text-gray-800 dark:text-gray-200">{{ item.kolom || '-' }}</dd>
                  </div>
                </dl>
              </section>

              <section class="min-w-0 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div>
                  <h4 class="mb-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200">Kondisi Arsip</h4>
                  <p class="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700 dark:text-gray-300">{{ form.kondisi || '-' }}</p>
                </div>
                <div class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <h4 class="mb-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200">Media Arsip</h4>
                  <p class="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700 dark:text-gray-300">{{ form.media || '-' }}</p>
                </div>
              </section>
            </div>
          </div>
        </div>

        <TimelineRiwayat v-if="sharedTransfer" :item="sharedTransfer" />
      </div>
    </template>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">Arsip tidak ditemukan</div>

    <div v-if="item?.status === 'SELESAI' && eligibleArchives.length" class="mt-5 flex justify-start gap-3">
      <NuxtLink
        to="/kelola/pemeliharaan/penataan-arsip-inaktif"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" /> Batal
      </NuxtLink>
      <button
        type="button"
        @click="openPenyusutanModal"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-800"
      >
        <UIcon name="i-lucide-send" class="h-4 w-4" /> Penyusutan
      </button>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPenyusutanModal" class="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <button type="button" class="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Tutup dialog" @click="closePenyusutanModal" />
          <section class="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800" role="dialog" aria-modal="true" aria-labelledby="penyusutan-modal-title">
            <header class="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
              <h3 id="penyusutan-modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">Pindahkan ke Pengajuan Penyusutan</h3>
            </header>

            <div class="space-y-5 p-6">
              <p class="text-sm leading-6 text-gray-500 dark:text-gray-400">Berkas akan disimpan sebagai draft dan dapat dilengkapi sebelum diajukan.</p>

              <div v-if="eligibleArchives.length > 1">
                <label for="penyusutan-archive" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Berkas</label>
                <select id="penyusutan-archive" v-model="selectedArchiveId" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option v-for="archive in eligibleArchives" :key="archive.id" :value="archive.id">{{ archive.kode }} — {{ archive.nama }}</option>
                </select>
              </div>
              <div v-else class="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-gray-700/60 dark:text-gray-200">
                {{ eligibleArchives[0]?.kode }} — {{ eligibleArchives[0]?.nama }}
              </div>

            </div>

            <footer class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <button type="button" @click="closePenyusutanModal" :disabled="creatingPenyusutanDraft" class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Batal</button>
              <button type="button" @click="createPenyusutanDraft" :disabled="creatingPenyusutanDraft || !selectedArchive" class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50">
                <UIcon v-if="creatingPenyusutanDraft" name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
                <UIcon v-else name="i-lucide-send" class="h-4 w-4" /> Penyusutan
              </button>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import type { TuUsulanItem } from '~/types/tu-verifikasi'
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive'
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue'
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue'
import TransferBeritaAcaraCard from '~/components/transfer-active-to-inactive/TransferBeritaAcaraCard.vue'

definePageMeta({
  middleware: ['auth'],
  alias: [
    '/kelola/penataan-arsip-inaktif/:id',
    '/kelola/pemeliharaan/penataan-arsip-inaktif/:id',
  ],
})

const route = useRoute()
if (
  route.path.startsWith('/maintenance/penataan-arsip-inaktif/') ||
  route.path.startsWith('/kelola/penataan-arsip-inaktif/') ||
  route.path.startsWith('/pemeliharaan/penataan-arsip-inaktif/')
) {
  await navigateTo({
    path: `/kelola/pemeliharaan/penataan-arsip-inaktif/${route.params.id}`,
    query: route.query,
  }, { replace: true })
}
const { fetchPenataanDetail, selesaiPenataan, uploadFotoPenataan } = useTuVerifikasi()
const { api, apiGet, apiPost } = useApi()
const config = useRuntimeConfig()

const item = ref<TuUsulanItem | null>(null)
const beritaAcaraData = ref<any>(null)
const daftarBerkasData = ref<any[]>([])
const daftarIsiData = ref<any[]>([])
const loading = ref(true)
const actionLoading = ref(false)
const mode = ref<'detail' | 'penataan'>('detail')
const formPenataanOpen = ref(true)
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
  let archives: any[]
  // Endpoint berita-acara-data hanya memuat ringkasan arsip. Gunakan endpoint
  // daftar-isi agar seluruh metadata pemberkasan tersedia pada tabel ini.
  if (daftarBerkasData.value.length > 0) {
    archives = daftarBerkasData.value
  } else if (item.value.arsipIds && Array.isArray(item.value.arsipIds)) {
    archives = item.value.arsipIds
  } else {
    archives = [{
      id: item.value.arsipId,
      perihal: item.value.arsipPerihal,
      kode: item.value.arsipKode,
      tanggalRetensiHabis: null,
    }]
  }
  return archives.map((archive: any) => ({
    ...archive,
    penyusutanSudahDiajukan: penyusutanBerkasIds.value.has(String(archive.id)),
  }))
})

const isRetentionExpired = (date: string | null | undefined) => {
  if (!date) return false
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const dateKey = String(date).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && dateKey <= today
}
const penyusutanBerkasIds = ref<Set<string>>(new Set())
const eligibleArchives = computed(() => daftarBerkas.value
  .filter((archive: any) => archive?.id
    && isRetentionExpired(archive.tanggalRetensiInaktifBerakhir)
    && !penyusutanBerkasIds.value.has(String(archive.id)))
  .map((archive: any) => ({
    ...archive,
    kode: archive.kodeBerkas ?? archive.kode ?? '',
    nama: archive.perihal ?? archive.namaBerkas ?? archive.uraianInformasi ?? '-',
  })))
const showPenyusutanModal = ref(false)
const selectedArchiveId = ref('')
const creatingPenyusutanDraft = ref(false)
const selectedArchive = computed(() => eligibleArchives.value.find((archive: any) => archive.id === selectedArchiveId.value) ?? null)
const openPenyusutanModal = () => {
  selectedArchiveId.value = eligibleArchives.value[0]?.id ?? ''
  showPenyusutanModal.value = true
}
const closePenyusutanModal = () => {
  if (creatingPenyusutanDraft.value) return
  showPenyusutanModal.value = false
}
const createPenyusutanDraft = async () => {
  if (!item.value || !selectedArchive.value || creatingPenyusutanDraft.value) return
  creatingPenyusutanDraft.value = true
  try {
    const archive: any = selectedArchive.value
    const berkasId = String(archive.id)
    await apiPost('/penyusutan/draft', {
      berkasId,
      kodeBerkas: archive.kode || undefined,
      namaBerkas: archive.nama || undefined,
      klasifikasi: archive.kodeKlasifikasi ?? archive.klasifikasiKode ?? undefined,
      klasifikasiText: archive.klasifikasi ?? archive.klasifikasiTeks ?? undefined,
      tanggalRetensiHabis: String(archive.tanggalRetensiInaktifBerakhir).slice(0, 10),
      jenisPenyusutan: archive.nasibAkhir?.toLowerCase() === 'musnah' ? 'musnah' : 'permanen',
      daftarArsip: [{ id: berkasId, nama: archive.nama || '-', kode: archive.kode || '' }],
    })
    penyusutanBerkasIds.value = new Set([...penyusutanBerkasIds.value, berkasId])
    useToast().add({ title: 'Berhasil', description: 'Berkas dipindahkan ke Pengajuan Penyusutan dengan status draft.', color: 'success' })
    showPenyusutanModal.value = false
    await navigateTo('/kelola/penyusutan/pengajuan-penyusutan')
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: e?.data?.message || e?.message || 'Gagal menyimpan draft penyusutan.', color: 'error' })
  } finally {
    creatingPenyusutanDraft.value = false
  }
}

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
}

// Foto lampiran penataan
const fotoFile = ref<File | null>(null)
const fotoPreview = ref<string | null>(null)
const fotoKey = ref<string | null>(null)
const uploadingFoto = ref(false)
const fotoError = ref('')
const penataanDraftReady = ref(false)

type PenataanDraft = {
  lokasi: string
  rak: string
  baris: string
  kolom: string
  kondisi: string
  media: string
  fotoKey: string | null
}

const penataanDraftStorageKey = (id: string) => `arsipku:penataan-arsip-draft:${id}`
const readPenataanDraft = (id: string): PenataanDraft | null => {
  if (!import.meta.client) return null
  try {
    const value = localStorage.getItem(penataanDraftStorageKey(id))
    return value ? JSON.parse(value) as PenataanDraft : null
  } catch {
    return null
  }
}
const clearPenataanDraft = (id: string) => {
  if (!import.meta.client) return
  try { localStorage.removeItem(penataanDraftStorageKey(id)) } catch { /* storage may be unavailable */ }
}

watch(
  () => [form.lokasi, form.rak, form.baris, form.kolom, form.kondisi, form.media, fotoKey.value],
  () => {
    if (!import.meta.client || !penataanDraftReady.value || !item.value || item.value.status !== 'ARSIP_INAKTIF_DITERIMA') return
    const draft: PenataanDraft = {
      lokasi: form.lokasi,
      rak: form.rak,
      baris: form.baris,
      kolom: form.kolom,
      kondisi: form.kondisi,
      media: form.media,
      fotoKey: fotoKey.value,
    }
    try { localStorage.setItem(penataanDraftStorageKey(item.value.id), JSON.stringify(draft)) } catch { /* storage may be unavailable */ }
  },
)

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
  { label: 'Kelola', to: '/kelola' },
  { label: 'Pemeliharaan', to: '/pemeliharaan' },
  { label: 'Penataan Arsip Inaktif', to: '/kelola/pemeliharaan/penataan-arsip-inaktif' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/kelola/pemeliharaan/penataan-arsip-inaktif/${route.params.id}` },
])

const loadDetail = async () => {
  loading.value = true
  penataanDraftReady.value = false
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
      if (item.value.status === 'SELESAI') {
        try {
          const penyusutanResponse: any = await apiGet('/penyusutan/pengajuan', {}, { skipCache: true })
          const penyusutanItems = Array.isArray(penyusutanResponse?.data)
            ? penyusutanResponse.data
            : Array.isArray(penyusutanResponse)
              ? penyusutanResponse
              : []
          penyusutanBerkasIds.value = new Set(
            penyusutanItems
              .map((row: any) => row.berkasId ?? row.berkas_id)
              .filter(Boolean)
              .map((id: string) => String(id)),
          )
        } catch {
          // Daftar penyusutan mungkin tidak dapat dibaca oleh peran ini;
          // endpoint penyimpanan draft tetap mencegah pengajuan duplikat.
          penyusutanBerkasIds.value = new Set()
        }
      }
      form.lokasi = item.value.lokasiPenataan || ''
      form.rak = item.value.rak || ''
      form.baris = item.value.baris || ''
      form.kolom = item.value.kolom || ''
      restoreConditionAndMedia(item.value.keteranganPenataan)
      const draft = readPenataanDraft(item.value.id)
      if (draft) {
        form.lokasi = draft.lokasi ?? ''
        form.rak = draft.rak ?? ''
        form.baris = draft.baris ?? ''
        form.kolom = draft.kolom ?? ''
        form.kondisi = draft.kondisi ?? ''
        form.media = draft.media ?? ''
      }
      // Jika sudah ada foto penataan (status SELESAI), tampilkan preview
      fotoLoadError.value = false  // reset error state setiap load
      const restoredFotoKey = draft ? draft.fotoKey : item.value.fotoPenataan
      if (restoredFotoKey) {
        fotoKey.value = restoredFotoKey
        // Gunakan nextTick agar <img> re-render dengan URL baru setelah
        // fotoLoadError di-reset (hindari race condition dengan @error).
        nextTick(() => {
          fotoPreview.value = fotoUrl(restoredFotoKey)
        })
      } else {
        fotoKey.value = null
        fotoPreview.value = null
      }
      penataanDraftReady.value = true
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
    clearPenataanDraft(item.value.id)
    penataanDraftReady.value = false
    useToast().add({ title: 'Berhasil', description: 'Penataan arsip selesai.', color: 'success' })
    await loadDetail()
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: e?.data?.message || 'Gagal menyelesaikan penataan.', color: 'error' })
  } finally { actionLoading.value = false }
}

onMounted(() => loadDetail())
</script>
