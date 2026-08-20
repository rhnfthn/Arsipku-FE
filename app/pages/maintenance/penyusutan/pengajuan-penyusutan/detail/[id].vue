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
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span><p class="text-gray-900 dark:text-white font-medium">{{ item.kode_berkas }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Nama Berkas</span><p class="text-gray-900 dark:text-white font-medium">{{ item.nama_berkas }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span><p class="text-gray-900 dark:text-white font-medium">{{ item.klasifikasi }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span><p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggal_retensi_habis) }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Jenis</span><p class="text-gray-900 dark:text-white font-medium">
                <span :class="item.jenis_penyusutan === 'musnah' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'" class="inline-block px-2 py-0.5 rounded-full text-xs font-medium">{{ item.jenis_penyusutan === 'musnah' ? 'Musnah' : 'Permanen' }}</span>
              </p></div>
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

          <!-- Daftar Arsip (Naskah) -->
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

          <!-- Lokasi Penyimpanan -->
          <div v-if="item.lokasi_simpan || item.rak || item.baris || item.kolom" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h4 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <UIcon name="i-lucide-map-pin" class="w-3.5 h-3.5" /> Lokasi Penyimpanan Arsip Inaktif
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary-500 mb-1.5" />
                <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Lokasi</span>
                <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.lokasi_simpan || '-' }}</p>
              </div>
              <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <UIcon name="i-lucide-library" class="w-5 h-5 text-primary-500 mb-1.5" />
                <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Rak</span>
                <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.rak || '-' }}</p>
              </div>
              <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <UIcon name="i-lucide-rows-3" class="w-5 h-5 text-primary-500 mb-1.5" />
                <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Baris</span>
                <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.baris || '-' }}</p>
              </div>
              <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <UIcon name="i-lucide-columns-3" class="w-5 h-5 text-primary-500 mb-1.5" />
                <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Kolom</span>
                <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ item.kolom || '-' }}</p>
              </div>
            </div>
          </div>

          <!-- Foto Dokumentasi -->
          <div v-if="item.foto_dokumentasi" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h4 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <UIcon name="i-lucide-camera" class="w-3.5 h-3.5" /> Foto Dokumentasi Arsip Inaktif
            </h4>
            <div class="relative group inline-block">
              <a :href="item.foto_dokumentasi" target="_blank" class="block">
                <img
                  :src="item.foto_dokumentasi"
                  alt="Foto dokumentasi"
                  class="w-full max-w-sm h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-600 transition-shadow group-hover:shadow-lg"
                />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
                  <span class="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium flex items-center gap-1.5">
                    <UIcon name="i-lucide-eye" class="w-4 h-4" /> Lihat Foto
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>

        <!-- Kolom Kanan: Timeline Penyusutan -->
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5 h-fit">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-history" class="w-4 h-4 text-primary-500" /> Timeline Penyusutan
          </h3>
          <div class="space-y-1">
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
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePenyusutan } from '~/composables/usePenyusutan'
import type { ArsipPenyusutan } from '~/types/penyusutan'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { fetchById } = usePenyusutan()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Pengajuan Penyusutan', to: '/maintenance/penyusutan/pengajuan-penyusutan' },
  { label: 'Detail Pengajuan', to: `/maintenance/penyusutan/pengajuan-penyusutan/detail/${route.params.id}` },
])

const item = ref<ArsipPenyusutan | null>(null)

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
})
</script>