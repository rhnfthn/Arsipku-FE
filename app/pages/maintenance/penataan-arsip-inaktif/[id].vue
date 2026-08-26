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
      <div class="max-w-4xl space-y-5">
        <!-- Informasi Usulan -->
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
            <span :class="statusBadgeClass(item.status)" class="text-xs">{{ statusLabel(item.status) }}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span><p class="text-gray-900 dark:text-white font-medium">{{ item.nomorUsulan }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Sekretaris</span><p class="text-gray-900 dark:text-white font-medium">{{ item.sekretarisName }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span><p class="text-gray-900 dark:text-white font-medium">{{ item.atasanName ?? '-' }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Jenis</span><p class="text-gray-900 dark:text-white font-medium">{{ item.arsipTindakanPenyusutan ?? '-' }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Diterima</span><p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.receivedAt) }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span><p class="text-gray-900 dark:text-white font-medium">{{ item.arsipKode ?? '-' }}</p></div>
            <div><span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span><p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggalRetensiAktifHabis) }}</p></div>
            <div class="sm:col-span-2"><span class="text-gray-500 dark:text-gray-400 text-xs">Perihal Arsip</span><p class="text-gray-900 dark:text-white font-medium">{{ item.arsipPerihal }}</p></div>
          </div>

          <!-- Keterangan -->
          <div v-if="item.keterangan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
            <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
              {{ item.keterangan }}
            </p>
          </div>
        </div>

        <!-- Daftar Arsip yang Akan Dipindahkan -->
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Daftar Arsip({{ daftarBerkas.length }})
          </h3>
          <div class="space-y-1.5">
            <div
              v-for="(berkas, idx) in daftarBerkas"
              :key="idx"
              class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <span class="text-xs font-semibold text-gray-400">{{ idx + 1 }}.</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 dark:text-white truncate">
                  <span v-if="berkas.kode" class="font-mono text-xs text-gray-500">{{ berkas.kode }}</span>
                  — {{ berkas.perihal }}
                </p>
              </div>
              <NuxtLink
                v-if="berkas.id"
                :to="`/maintenance/preview-berkas/${berkas.id}?nomor_usulan=${item.nomorUsulan}&usulan_id=${item.id}&from=tu`"
                class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 shrink-0"
                title="Lihat detail berkas"
              >
                <UIcon name="i-lucide-eye" class="w-4 h-4" />
              </NuxtLink>
            </div>
            <div v-if="daftarBerkas.length === 0" class="text-sm text-gray-400 italic py-2">
              Tidak ada arsip
            </div>
          </div>
        </div>

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
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Rak</label>
              <input v-model="form.rak" type="text" placeholder="Rak..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Baris</label>
              <input v-model="form.baris" type="text" placeholder="Baris..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Kolom</label>
              <input v-model="form.kolom" type="text" placeholder="Kolom..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Keterangan</label>
            <textarea v-model="form.keterangan" rows="3" placeholder="Keterangan penataan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
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
                <!-- Lokasi -->
                <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary-500 mb-1.5" />
                  <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Lokasi</span>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.lokasiPenataan || '-' }}</p>
                </div>
                <!-- Rak -->
                <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <UIcon name="i-lucide-library" class="w-5 h-5 text-primary-500 mb-1.5" />
                  <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Rak</span>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.rak || '-' }}</p>
                </div>
                <!-- Baris -->
                <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <UIcon name="i-lucide-rows-3" class="w-5 h-5 text-primary-500 mb-1.5" />
                  <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Baris</span>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.baris || '-' }}</p>
                </div>
                <!-- Kolom -->
                <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <UIcon name="i-lucide-columns-3" class="w-5 h-5 text-primary-500 mb-1.5" />
                  <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Kolom</span>
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

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { fetchPenataanDetail, selesaiPenataan, uploadFotoPenataan } = useTuVerifikasi()
const { api } = useApi()
const config = useRuntimeConfig()

const item = ref<TuUsulanItem | null>(null)
const loading = ref(true)
const actionLoading = ref(false)
const mode = ref<'detail' | 'penataan'>('detail')
const fromPenataanQuery = route.query.mode === 'penataan'

const statusLabel = (s: string) => {
  if (s === 'SELESAI') return 'Selesai'
  if (s === 'ARSIP_INAKTIF_DITERIMA') return 'Diterima'
  if (s === 'PENATAAN_ARSIP_INAKTIF') return 'Penataan Arsip'
  if (s === 'DIKIRIM') return 'Menunggu Verifikasi'
  if (s === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU') return 'Menunggu Persetujuan'
  if (s === 'DISETUJUI_PERSETUJUAN_TU') return 'Disetujui Persetujuan'
  if (s === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU') return 'Menunggu Persetujuan Terakhir'
  if (s === 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU') return 'Disetujui Persetujuan Terakhir'
  return s
}

const statusBadgeClass = (s: string) => {
  if (s === 'SELESAI') return 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
  if (s === 'ARSIP_INAKTIF_DITERIMA' || s === 'PENATAAN_ARSIP_INAKTIF') return 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
  if (s === 'DISETUJUI_PERSETUJUAN_TU' || s === 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU') return 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
  if (s === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU' || s === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU') return 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
  return 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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

// Daftar berkas (dari arsipIds atau fallback ke arsip tunggal)
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

// Jika ada query ?mode=penataan, langsung buka mode penataan
if (fromPenataanQuery) {
  mode.value = 'penataan'
}

const form = reactive({
  lokasi: '',
  rak: '',
  baris: '',
  kolom: '',
  keterangan: '',
})

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

const formatDate = (d: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await fetchPenataanDetail(route.params.id as string)
    item.value = res?.data ?? res
    if (item.value) {
      form.lokasi = item.value.lokasiPenataan || ''
      form.rak = item.value.rak || ''
      form.baris = item.value.baris || ''
      form.kolom = item.value.kolom || ''
      form.keterangan = item.value.keteranganPenataan || ''
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
      keterangan: form.keterangan || undefined,
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