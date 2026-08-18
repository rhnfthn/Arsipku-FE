<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Ajukan Penyusutan — ${item?.no_usulan ?? ''}`" :items="breadcrumbs" />
      <NuxtLink to="/maintenance/penyusutan/pengajuan-penyusutan"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="itemLoading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
      <p class="text-gray-500 dark:text-gray-400 mt-2">Memuat data arsip...</p>
    </div>

    <div v-else-if="!item" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
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
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span><p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggal_retensi_habis ?? '') }}</p></div>
            </div>

            <!-- Keterangan -->
            <div v-if="item.keterangan || item.catatan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
                {{ item.keterangan || item.catatan }}
              </p>
            </div>
          </div>

          <!-- Daftar Arsip (Berkas) -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              Daftar Arsip
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ daftarArsipList.length }}</span>
            </h3>
            <!-- Loading -->
            <div v-if="itemLoading" class="py-6 text-center">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 text-primary animate-spin mx-auto" />
            </div>
            <!-- Daftar Berkas -->
            <div v-else-if="daftarArsipList.length > 0" class="space-y-1.5">
              <div
                v-for="(a, idx) in daftarArsipList"
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
            <!-- Empty -->
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

      <!-- Tombol Aksi (di bawah halaman) -->
      <div class="flex items-center gap-3 mt-5">
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
                      :key="a.persnum"
                      type="button"
                      @click="toggleAtasan(a)"
                      class="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <div class="font-medium text-gray-900 dark:text-white">{{ a.name }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ a.positionText }}</div>
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
            <button @click="submitAjukan" :disabled="!canSubmit" class="px-5 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
              <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Ajukan
            </button>
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
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import { useArsipDinamis } from '~/composables/useArsipDinamis'
import { useApi } from '~/composables/useApi'
import type { JenisPenyusutan, ArsipPenyusutan } from '~/types/penyusutan'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const toast = useToast()
const { ajukanPenyusutan, fetchById } = usePenyusutan()
const { fetchPenataanDetail } = useTuVerifikasi()
const { apiGet } = useApi()
const { getBerkasById } = useArsipDinamis()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Pengajuan Penyusutan', to: '/maintenance/penyusutan/pengajuan-penyusutan' },
  { label: 'Ajukan Penyusutan', to: `/maintenance/penyusutan/pengajuan-penyusutan/ajukan/${route.params.id}` },
])

const item = ref<ArsipPenyusutan | null>(null)
const itemLoading = ref(false)

/** Load detail item — coba dari API penyusutan dulu, fallback ke penataan. */
const loadItem = async () => {
  itemLoading.value = true
  try {
    const id = route.params.id as string

    // 1. Coba fetch dari API penyusutan (data sudah ada di tabel penyusutan)
    const penyusutanItem = await fetchById(id)
    if (penyusutanItem) {
      item.value = penyusutanItem as any
      return
    }

    // 2. Fallback: fetch dari penataan (arsip yang belum diajukan penyusutan)
    const res: any = await fetchPenataanDetail(id)
    const d = res?.data ?? res
    if (d) {
      // Ambil berkasId untuk lookup klasifikasi dari tabel berkas
      const berkasId = d.arsipIds?.[0]?.id ?? d.arsipId ?? d.id

      // Fetch detail berkas untuk mendapatkan klasifikasi & klasifikasiText
      // (API penataan detail tidak menyertakan klasifikasi)
      let berkasKlasifikasi = d.arsipKlasifikasiKode ?? ''
      let berkasKlasifikasiText = d.arsipKlasifikasi ?? ''
      try {
        const berkasRes: any = await getBerkasById(berkasId)
        const berkasData = berkasRes?.data ?? berkasRes
        if (berkasData) {
          berkasKlasifikasi = berkasData.klasifikasi ?? berkasKlasifikasi
          berkasKlasifikasiText = berkasData.klasifikasiTeks ?? berkasData.klasifikasi_text ?? berkasKlasifikasiText
        }
      } catch (e) {
        console.error('Gagal memuat klasifikasi berkas:', e)
      }

      item.value = {
        id: d.id,
        no_usulan: d.nomorUsulan ?? '',
        kode_berkas: d.arsipKode ?? '',
        nama_berkas: d.arsipPerihal ?? '',
        klasifikasi: berkasKlasifikasi,
        klasifikasiText: berkasKlasifikasiText,
        sekretaris: d.sekretarisName ?? '',
        atasan_managerial: [],
        status: 'draft' as any,
        jenis_penyusutan: 'permanen' as JenisPenyusutan,
        lokasi_simpan: d.lokasiPenataan ?? null,
        rak: null,
        baris: null,
        kolom: null,
        tanggal_retensi_habis: d.tanggalRetensiAktifHabis ?? '',
        tanggal_pengajuan: null,
        catatan: d.keterangan ?? '',
        keterangan: d.keterangan ?? null,
        daftar_arsip: (d.arsipIds && Array.isArray(d.arsipIds) ? d.arsipIds : []).map((a: any) => ({
          id: a.id ?? '',
          nama: a.perihal ?? '',
          kode: a.kode ?? '',
        })),
        foto_dokumentasi: d.fotoPenataan ?? null,
        berita_acara: d.beritaAcaraUrl ?? null,
        current_verifikator_urutan: 1,
        // Simpan berkasId untuk submit
        berkasId,
      } as any
    }
  } catch (e) {
    console.error('Gagal memuat detail arsip:', e)
  } finally {
    itemLoading.value = false
  }
}

const showAjukanModal = ref(false)
const formJenis = ref<JenisPenyusutan>('permanen')
const formCatatan = ref('')
const submitting = ref(false)

// ── Daftar Arsip (Berkas) ──
// Tampilkan daftar berkas dari daftar_arsip di DB.
// Jika kosong, buat dummy dari berkas_id utama agar selalu ada isinya.
const daftarArsipList = computed(() => {
  if (!item.value) return []
  const daftar = (item.value as any).daftar_arsip ?? (item.value as any).daftarArsip
  if (daftar && Array.isArray(daftar) && daftar.length > 0) {
    return daftar
  }
  // Dummy: jika daftar_arsip kosong, tampilkan berkas utama
  const berkasId = (item.value as any).berkasId ?? item.value.id
  return [
    {
      id: berkasId,
      nama: item.value.nama_berkas ?? item.value.namaBerkas ?? '-',
      kode: item.value.kode_berkas ?? item.value.kodeBerkas ?? '',
    },
  ]
})

// ── Atasan Managerial Berjenjang (dari API org-data) ──
const atasanOptions = ref<Array<{ position: number; persnum: number; name: string; positionText: string }>>([])
const atasanLoading = ref(false)
const selectedAtasanList = ref<{ persnum: number; name: string; positionText: string; positionId?: number }[]>([])
const showAtasanInput = ref(true)
const atasanSearch = ref('')
const atasanDropdownOpen = ref(false)
const atasanDropdownRef = ref<HTMLElement | null>(null)

const loadAtasanManagerial = async () => {
  atasanLoading.value = true
  try {
    const tgl = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const res: any = await apiGet(`/org-data/pengirim/managerial?tgl=${tgl}`, {}, { skipCache: true })
    const data = res?.data?.data ?? res?.data ?? []
    if (Array.isArray(data)) {
      atasanOptions.value = data.map((r: any) => ({
        position: Number(r.position ?? r.position_id ?? 0),
        persnum: Number(r.persnum ?? r.persnum_person ?? r.relation_persnum ?? 0),
        name: r.persnum_person_text ?? r.name ?? r.label ?? '-',
        positionText: r.position_text ?? r.positionText ?? r.labelJob ?? '-',
      }))
    }
  } catch (e) {
    console.error('Gagal memuat atasan managerial:', e)
    atasanOptions.value = []
  } finally {
    atasanLoading.value = false
  }
}

const filteredAtasan = computed(() => {
  const q = atasanSearch.value.trim().toLowerCase()
  if (!q) return atasanOptions.value.slice(0, 50)
  return atasanOptions.value
    .filter((a) =>
      a.name.toLowerCase().includes(q) ||
      String(a.persnum).includes(q) ||
      a.positionText.toLowerCase().includes(q)
    )
    .slice(0, 50)
})

const isAtasanSelected = (a: { persnum: number }) =>
  selectedAtasanList.value.some((s) => s.persnum === a.persnum)

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

const toggleAtasan = (a: { persnum: number; name: string; positionText: string; position: number }) => {
  if (isAtasanSelected(a)) {
    selectedAtasanList.value = selectedAtasanList.value.filter((s) => s.persnum !== a.persnum)
  } else {
    if (selectedAtasanList.value.length >= 3) return
    selectedAtasanList.value.push({ persnum: a.persnum, name: a.name, positionText: a.positionText, positionId: a.position })
  }
  atasanSearch.value = ''
  atasanDropdownOpen.value = false
  showAtasanInput.value = false
}

const removeAtasan = (idx: number) => {
  selectedAtasanList.value.splice(idx, 1)
}

const canSubmit = computed(() => {
  return selectedAtasanList.value.length >= 1 && !!formJenis.value && !submitting.value
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

const submitAjukan = async () => {
  if (!item.value) return
  submitting.value = true
  try {
    await ajukanPenyusutan({
      berkasId: (item.value as any).berkasId ?? item.value.id,
      kodeBerkas: item.value.kode_berkas || undefined,
      namaBerkas: item.value.nama_berkas || undefined,
      klasifikasi: item.value.klasifikasi || undefined,
      klasifikasiText: (item.value as any).klasifikasiText || (item.value as any).klasifikasi_text || undefined,
      tanggalRetensiHabis: item.value.tanggal_retensi_habis || undefined,
      jenisPenyusutan: formJenis.value,
      atasanList: selectedAtasanList.value.map((v) => ({
        persnum: v.persnum,
        name: v.name,
        ...(v.positionId ? { positionId: v.positionId } : {}),
        positionText: v.positionText,
      })),
      catatan: formCatatan.value || undefined,
      daftarArsip: (item.value as any).daftar_arsip ?? (item.value as any).daftarArsip ?? undefined,
    })
    showAjukanModal.value = false
    toast.add({ title: 'Berhasil', description: 'Pengajuan penyusutan berhasil dikirim ke atasan managerial.', color: 'success' })
    navigateTo('/maintenance/penyusutan/pengajuan-penyusutan')
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal mengajukan penyusutan', color: 'error' })
  } finally {
    submitting.value = false
  }
}

const onClickOutside = (e: MouseEvent) => {
  if (atasanDropdownRef.value && !atasanDropdownRef.value.contains(e.target as Node)) {
    atasanDropdownOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onClickOutside)
  await loadItem()
  loadAtasanManagerial()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>