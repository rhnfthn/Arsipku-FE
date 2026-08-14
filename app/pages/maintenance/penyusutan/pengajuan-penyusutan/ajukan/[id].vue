<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Ajukan Penyusutan — ${item?.no_usulan ?? ''}`" :items="breadcrumbs" />
      <NuxtLink to="/maintenance/penyusutan/pengajuan-penyusutan"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="!item" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
      <p class="text-gray-500 dark:text-gray-400">Arsip tidak ditemukan atau sudah diajukan.</p>
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
            </div>

            <!-- Keterangan -->
            <div v-if="item.keterangan || item.catatan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
                {{ item.keterangan || item.catatan }}
              </p>
            </div>
          </div>

          <!-- Daftar Arsip (Naskah) -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Daftar Arsip (Naskah) ({{ item.daftar_arsip?.length ?? 0 }})
            </h3>
            <div class="space-y-1.5">
              <div
                v-for="(a, idx) in item.daftar_arsip"
                :key="idx"
                class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <span class="text-xs font-semibold text-gray-400">{{ idx + 1 }}.</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900 dark:text-white truncate">
                    <span v-if="a.kode" class="font-mono text-xs text-gray-500">{{ a.kode }}</span>
                    — {{ a.nama }}
                  </p>
                </div>
              </div>
              <div v-if="!item.daftar_arsip?.length" class="text-sm text-gray-400 italic py-2">
                Tidak ada arsip
              </div>
            </div>
          </div>

          <!-- Tombol Aksi -->
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/maintenance/penyusutan/pengajuan-penyusutan"
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >Batal</NuxtLink>
            <button
              @click="showAjukanModal = true"
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors"
            >
              <UIcon name="i-lucide-send" class="w-4 h-4" /> Ajukan Penyusutan
            </button>
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
    </template>

    <!-- Modal Ajukan Penyusutan -->
    <Teleport to="body">
      <div v-if="showAjukanModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="showAjukanModal = false" />
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ajukan Penyusutan</h3>
            <button @click="showAjukanModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Info Arsip -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              <div class="flex justify-between text-sm"><span class="text-gray-500 dark:text-gray-400">Kode Berkas</span><span class="font-medium text-gray-800 dark:text-white">{{ item?.kode_berkas }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500 dark:text-gray-400">No Usulan</span><span class="font-medium text-gray-800 dark:text-white">{{ item?.no_usulan }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500 dark:text-gray-400">Nama Berkas</span><span class="font-medium text-gray-800 dark:text-white">{{ item?.nama_berkas }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500 dark:text-gray-400">Klasifikasi</span><span class="font-medium text-gray-800 dark:text-white">{{ item?.klasifikasi }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500 dark:text-gray-400">Tgl Retensi Habis</span><span class="font-medium text-gray-800 dark:text-white">{{ formatDate(item?.tanggal_retensi_habis ?? '') }}</span></div>
            </div>

            <!-- Jenis Penyusutan -->
            <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                  <UIcon name="i-lucide-archive" class="size-5 text-primary-600 dark:text-primary-400" />
                </span>
                <div>
                  <h2 class="font-semibold text-gray-900 dark:text-white">Jenis Penyusutan <span class="text-red-500">*</span></h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pilih jenis penyusutan untuk arsip ini.</p>
                </div>
              </div>
              <div class="px-5 py-5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    :class="formJenis === 'permanen' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'"
                    class="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all"
                  >
                    <input type="radio" v-model="formJenis" value="permanen" class="text-[#457fb6] focus:ring-[#457fb6]" />
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">Permanen</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Arsip ditata dan disimpan</p>
                    </div>
                  </label>
                  <label
                    :class="formJenis === 'musnah' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'"
                    class="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all"
                  >
                    <input type="radio" v-model="formJenis" value="musnah" class="text-[#457fb6] focus:ring-[#457fb6]" />
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">Musnah</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Arsip dipindahkan ke backup</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Atasan Managerial Berjenjang -->
            <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <div class="flex items-center gap-2">
                  <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <UIcon name="i-lucide-users" class="size-5 text-primary-600 dark:text-primary-400" />
                  </span>
                  <div>
                    <h2 class="font-semibold text-gray-900 dark:text-white">Atasan Managerial Berjenjang <span class="text-red-500">*</span></h2>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pilih satu atau lebih atasan. Urutan pemilihan = urutan verifikasi.</p>
                  </div>
                </div>
                <UButton
                  v-if="selectedAtasanList.length < 3"
                  icon="i-lucide-user-round-plus"
                  variant="outline"
                  size="xs"
                  @click="openAtasanInput"
                >Tambah</UButton>
              </div>
              <div class="px-5 py-5">
                <!-- Timeline daftar atasan yang sudah dipilih -->
                <div v-if="selectedAtasanList.length > 0" class="mb-4">
                  <div
                    v-for="(a, idx) in selectedAtasanList"
                    :key="a.persnum"
                    class="relative flex gap-3 pb-4 last:pb-0"
                  >
                    <div
                      v-if="idx < selectedAtasanList.length - 1"
                      class="absolute left-4 top-8 h-[calc(100%-1.5rem)] w-px bg-primary-200 dark:bg-primary-900/40"
                    />
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white shadow-sm">
                      {{ idx + 1 }}
                    </div>
                    <div class="min-w-0 flex-1 flex items-start justify-between gap-2 pt-1">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ a.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ a.positionText }}</p>
                      </div>
                      <button
                        type="button"
                        @click="removeAtasan(idx)"
                        class="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                        title="Hapus atasan"
                      >
                        <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Input pencarian (muncul saat belum ada atasan, atau setelah klik Tambah) -->
                <div v-if="selectedAtasanList.length < 3 && showAtasanInput" ref="atasanDropdownRef" class="relative">
                  <input
                    v-model="atasanSearch"
                    type="text"
                    placeholder="Ketik nama atau persnum atasan..."
                    @focus="openAtasanDropdown"
                    @input="onAtasanSearchInput"
                    @keydown.escape="atasanDropdownOpen = false"
                    class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
                  />
                  <div
                    v-if="atasanDropdownOpen && filteredAtasan.length > 0"
                    class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-[240px] overflow-y-auto"
                  >
                    <button
                      v-for="a in filteredAtasan"
                      :key="a.id"
                      type="button"
                      @click="toggleAtasan(a)"
                      class="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <div class="font-medium text-gray-900 dark:text-white">{{ a.name }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ a.id }} — {{ a.position }}</div>
                      </div>
                      <UIcon v-if="isAtasanSelected(a)" name="i-lucide-check-circle" class="w-5 h-5 text-green-500 shrink-0" />
                    </button>
                  </div>
                  <div
                    v-if="atasanDropdownOpen && filteredAtasan.length === 0"
                    class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 text-center text-sm text-gray-400"
                  >
                    Tidak ada atasan ditemukan
                  </div>
                </div>
                <p v-if="selectedAtasanList.length > 0" class="text-xs text-gray-500 mt-2">
                  {{ selectedAtasanList.length }} atasan dipilih. Verifikasi: {{ selectedAtasanList.map(a => a.name).join(' → ') }}
                </p>
              </div>
            </div>

            <!-- Catatan -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Catatan (Opsional)</label>
              <textarea
                v-model="formCatatan"
                rows="3"
                placeholder="Tambahkan catatan untuk verifikator..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button @click="showAjukanModal = false" class="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button @click="submitAjukan" :disabled="!canSubmit" class="px-5 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Ajukan</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { usePenyusutan } from '~/composables/usePenyusutan'
import type { JenisPenyusutan } from '~/types/penyusutan'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { list, loading, loadData, ajukanPenyusutan } = usePenyusutan()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Pengajuan Penyusutan', to: '/maintenance/penyusutan/pengajuan-penyusutan' },
  { label: 'Ajukan Penyusutan', to: `/maintenance/penyusutan/pengajuan-penyusutan/ajukan/${route.params.id}` },
])

const item = computed(() => list.value.find((a) => a.id === route.params.id) ?? null)

const showAjukanModal = ref(false)
const formJenis = ref<JenisPenyusutan>('permanen')
const formCatatan = ref('')

// ── Atasan Managerial Berjenjang (dummy) ──
const dummyAtasan = [
  { id: '10010123', name: 'HERMANA SOEGIJANTORO', position: 'EVP of Corporate Secretary' },
  { id: '10010970', name: 'PRIYO HUTOMO PUTRA', position: 'EVP of Operations' },
  { id: '10010444', name: 'SURYADI JOKO WIRATMO', position: 'EVP of Air Navigation Services Planning' },
]

const selectedAtasanList = ref<{ persnum: string; name: string; positionText: string }[]>([])
const showAtasanInput = ref(true)
const atasanSearch = ref('')
const atasanDropdownOpen = ref(false)
const atasanDropdownRef = ref<HTMLElement | null>(null)

const filteredAtasan = computed(() => {
  const q = atasanSearch.value.toLowerCase()
  return dummyAtasan.filter((a) =>
    a.name.toLowerCase().includes(q) || a.id.includes(q)
  )
})

const isAtasanSelected = (a: { id: string }) =>
  selectedAtasanList.value.some((s) => s.persnum === a.id)

const openAtasanInput = () => {
  showAtasanInput.value = true
  atasanSearch.value = ''
  atasanDropdownOpen.value = true
}

const openAtasanDropdown = () => {
  atasanDropdownOpen.value = true
}

const onAtasanSearchInput = () => {
  atasanDropdownOpen.value = true
}

const toggleAtasan = (a: { id: string; name: string; position: string }) => {
  if (isAtasanSelected(a)) {
    selectedAtasanList.value = selectedAtasanList.value.filter((s) => s.persnum !== a.id)
  } else {
    if (selectedAtasanList.value.length >= 3) return
    selectedAtasanList.value.push({ persnum: a.id, name: a.name, positionText: a.position })
  }
  atasanSearch.value = ''
  atasanDropdownOpen.value = false
  showAtasanInput.value = false
}

const removeAtasan = (idx: number) => {
  selectedAtasanList.value.splice(idx, 1)
}

const canSubmit = computed(() => {
  return selectedAtasanList.value.length >= 1 && !!formJenis.value
})

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
    { key: 'draft', step: 0, label: 'Draft', desc: 'Unit Dokumen menyiapkan usulan penyusutan' },
    { key: 'diajukan', step: 1, label: 'Menunggu Persetujuan', desc: 'Telah diajukan ke Atasan Managerial Unit Dokumen' },
    { key: 'diterima', step: 2, label: 'Diterima', desc: 'Atasan Managerial menerima penyusutan' },
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { draft: 'Draft', diajukan: 'Diajukan', diterima: 'Diterima', ditolak: 'Ditolak', selesai: 'Selesai' }
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

const submitAjukan = () => {
  if (!item.value) return
  const filled = selectedAtasanList.value.map((v) => ({
    persnum: v.persnum,
    name: v.name,
    jabatan: v.positionText,
  }))
  ajukanPenyusutan(item.value.id, formJenis.value, filled, formCatatan.value)
  showAjukanModal.value = false
  useToast().add({ title: 'Berhasil', description: 'Pengajuan penyusutan berhasil dikirim.', color: 'success' })
  navigateTo('/maintenance/penyusutan/pengajuan-penyusutan')
}

const onClickOutside = (e: MouseEvent) => {
  if (atasanDropdownRef.value && !atasanDropdownRef.value.contains(e.target as Node)) {
    atasanDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  if (list.value.length === 0) {
    loadData()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>