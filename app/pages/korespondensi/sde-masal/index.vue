<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Dashboard SDE Masal" :items="items" />
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-[#457fb6]/10">
            <UIcon name="i-lucide-file-stack" class="w-5 h-5 text-[#457fb6]" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p class="text-2xl font-bold text-[#457fb6]">{{ summary?.total ?? 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <UIcon name="i-lucide-clock" class="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Menunggu</p>
            <p class="text-2xl font-bold text-yellow-500">{{ summary?.menunggu ?? 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <UIcon name="i-lucide-send" class="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Terkirim</p>
            <p class="text-2xl font-bold text-blue-500">{{ summary?.terkirim ?? 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Terverifikasi</p>
            <p class="text-2xl font-bold text-emerald-500">{{ summary?.terverifikasi ?? 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Gagal/Ditolak</p>
            <p class="text-2xl font-bold text-red-500">{{ (summary?.ditolak ?? 0) + (summary?.gagal ?? 0) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tombol Kirim Naskah Massal (untuk item MENUNGGU) -->
    <div v-if="(summary?.menunggu ?? 0) > 0" class="mb-4 flex items-center gap-3">
      <button
        @click="handleGenerateNaskah"
        :disabled="generatingNaskah"
        class="h-10 px-5 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        <UIcon v-if="generatingNaskah" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
        <UIcon v-else name="i-lucide-send" class="w-4 h-4" />
        Kirim Naskah Massal ({{ summary?.menunggu }} item)
      </button>
      <span class="text-xs text-gray-400">Buat naskah SDE individual untuk semua item menunggu</span>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <!-- Search -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pencarian</label>
          <div class="relative">
            <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              v-model="f.search"
              type="text"
              placeholder="Cari perihal, tertuju..."
              class="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
              @keydown.enter="reload"
            />
          </div>
        </div>
        <!-- Status -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status Verifikasi</label>
          <select
            v-model="f.statusVerifikasi"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          >
            <option value="">Semua Status</option>
            <option value="MENUNGGU">Menunggu</option>
            <option value="TERVERIFIKASI">Terverifikasi</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>
        <!-- Buttons -->
        <div class="flex items-end gap-2">
          <button
            @click="reload"
            class="h-10 flex-1 px-4 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            <UIcon name="i-lucide-search" class="w-4 h-4" />
            Tampilkan
          </button>
          <button
            @click="resetFilter"
            class="h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <UIcon name="i-lucide-rotate-ccw" class="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-10">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-[#457fb6]" />
      </div>

      <!-- Empty -->
      <div v-else-if="!sdeItems || sdeItems.length === 0" class="text-center py-10">
        <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p class="text-sm text-gray-400">Belum ada data SDE Masal</p>
      </div>

      <!-- Table Content -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">No</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Perihal</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Tertuju</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Status</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Naskah</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Template</th>
              <th class="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, idx) in sdeItems"
              :key="item.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <td class="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{{ (meta?.page ?? 1) * (f.limit ?? 10) - (f.limit ?? 10) + idx + 1 }}</td>
              <td class="px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 max-w-[200px] truncate" :title="item.perihal">{{ item.perihal || '-' }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[150px] truncate" :title="item.tertuju">{{ item.tertuju || '-' }}</td>
              <td class="px-4 py-2.5">
                <span :class="statusBadge(item.statusVerifikasi)">{{ statusLabel(item.statusVerifikasi) }}</span>
              </td>
              <td class="px-4 py-2.5 text-xs whitespace-nowrap">
                <NuxtLink
                  v-if="item.naskahId"
                  :to="`/korespondensi/sde-masal/${item.naskahId}`"
                  class="text-[#457fb6] hover:underline flex items-center gap-1"
                >
                  <UIcon name="i-lucide-file-text" class="w-3.5 h-3.5" />
                  Detail Surat
                </NuxtLink>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatTemplate(item) }}</td>
              <td class="px-4 py-2.5">
                <div class="flex items-center justify-center gap-1">
                  <button @click="showDetail(item)" class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-[#457fb6] transition-colors" title="Lihat Detail">
                    <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                  </button>
                  <button @click="showEdit(item)" class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-[#457fb6] transition-colors" title="Edit Data">
                    <UIcon name="i-lucide-pencil" class="w-4 h-4" />
                  </button>
                  <button @click="showUploadLampiran(item)" class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-[#457fb6] transition-colors" title="Upload Lampiran">
                    <UIcon name="i-lucide-paperclip" class="w-4 h-4" />
                  </button>
                  <button @click="confirmDelete(item)" class="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-500 transition-colors" title="Hapus Data">
                    <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="meta && meta.total > 0"
        class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-3"
      >
        <!-- Info + Rows per page -->
        <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>
            Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }}
            dari <span class="font-medium text-gray-700 dark:text-gray-300">{{ meta.total }}</span> SDE Masal
          </span>
          <div class="flex items-center gap-1.5">
            <span class="text-xs">Baris:</span>
            <select
              v-model="f.limit"
              @change="reload"
              class="h-8 px-2 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-[#457fb6]"
            >
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>
        <!-- Page buttons -->
        <div v-if="meta.totalPages > 1" class="flex items-center gap-1">
          <button
            :disabled="meta.page <= 1"
            @click="goPage(meta.page - 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" /> Prev
          </button>
          <span class="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ meta.page }} / {{ meta.totalPages }}
          </span>
          <button
            :disabled="meta.page >= meta.totalPages"
            @click="goPage(meta.page + 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="detailModal && selectedItem" class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-10 sm:pt-20" @click.self="detailModal = false">
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
          <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Detail SDE Masal</h3>
            <button @click="detailModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="overflow-y-auto px-5 py-4 space-y-3 flex-1">
            <div v-for="(value, key) in detailFields" :key="key" class="text-sm border-b border-gray-100 dark:border-gray-700/50 pb-2">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{{ value.label }}</label>
              <p class="text-gray-900 dark:text-white break-words">{{ value.value ?? '-' }}</p>
            </div>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex justify-end">
            <button @click="detailModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Tutup</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="editModal && selectedItem" class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-10 sm:pt-20" @click.self="editModal = false">
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
          <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit SDE Masal</h3>
            <button @click="editModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="overflow-y-auto px-5 py-4 space-y-4 flex-1">
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Perihal</label>
              <input v-model="editForm.perihal" type="text" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] outline-none" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tertuju</label>
              <input v-model="editForm.tertuju" type="text" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] outline-none" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jenis Template</label>
              <select v-model="editForm.jenisTemplate" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] outline-none">
                <option value="SDE-STANDAR">SDE Standar</option>
                <option value="SDE-KHUSUS">SDE Khusus</option>
              </select>
            </div>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex justify-end gap-2">
            <button @click="editModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button @click="submitEdit" :disabled="editSubmitting" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 flex items-center gap-1.5">
              <UIcon v-if="editSubmitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Simpan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Upload Lampiran Modal -->
    <Teleport to="body">
      <div v-if="lampiranModal && selectedItem" class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-10 sm:pt-20" @click.self="lampiranModal = false">
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
          <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Upload Lampiran</h3>
            <button @click="lampiranModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="overflow-y-auto px-5 py-4 space-y-3 flex-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">Unggah file lampiran untuk: <strong class="text-gray-700 dark:text-gray-200">{{ selectedItem.tertuju }}</strong></p>
            <div
              @click="lampiranInput?.click()"
              class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer border-gray-300 dark:border-gray-600 hover:border-[#457fb6] transition-colors"
            >
              <input ref="lampiranInput" type="file" class="hidden" @change="onLampiranSelect" />
              <UIcon name="i-lucide-upload" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p v-if="!lampiranFile" class="text-sm text-gray-500">Klik untuk pilih file lampiran</p>
              <p v-else class="text-sm text-[#457fb6] font-medium">{{ lampiranFile.name }} ({{ (lampiranFile.size / 1024).toFixed(1) }} KB)</p>
            </div>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex justify-end gap-2">
            <button @click="lampiranModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button @click="submitLampiran" :disabled="!lampiranFile || lampiranUploading" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 flex items-center gap-1.5">
              <UIcon v-if="lampiranUploading" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Upload
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <div v-if="deleteModal && selectedItem" class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-10 sm:pt-20" @click.self="deleteModal = false">
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col">
          <div class="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <div class="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Hapus</h3>
          </div>
          <div class="px-5 py-4">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              Yakin ingin menghapus data SDE Masal untuk <strong class="text-gray-900 dark:text-white">{{ selectedItem.tertuju }}</strong>?
            </p>
            <p class="text-xs text-gray-400 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex justify-end gap-2">
            <button @click="deleteModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button @click="submitDelete" :disabled="deleteSubmitting" class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 flex items-center gap-1.5">
              <UIcon v-if="deleteSubmitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useSdeMasal } from '~/composables/useSdeMasal';
import { useToast } from '#imports';
import type { SdeMasalItem, SdeMasalFilter } from '~/types/sde-masal';

definePageMeta({ middleware: ['auth'] });

const toast = useToast();
const { items: sdeItems, summary, loading, meta, fetchList, fetchSummary, updateItem, deleteItem, uploadLampiran, generateNaskah } = useSdeMasal();

const items = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Korespondensi', to: '/korespondensi/kotak-masuk' },
  { label: 'SDE Masal', to: '/korespondensi/sde-masal' },
];

const f = reactive<SdeMasalFilter>({
  search: '',
  statusVerifikasi: '',
  jenisTemplate: '',
  page: 1,
  limit: 10,
});

const selectedItem = ref<SdeMasalItem | null>(null);
const detailModal = ref(false);
const editModal = ref(false);
const lampiranModal = ref(false);
const deleteModal = ref(false);
const lampiranFile = ref<File | null>(null);
const lampiranUploading = ref(false);
const lampiranInput = ref<HTMLInputElement | null>(null);
const editSubmitting = ref(false);
const deleteSubmitting = ref(false);
const generatingNaskah = ref(false);

const editForm = reactive({
  perihal: '',
  tertuju: '',
  jenisTemplate: '',
});

// --- Helpers ---
const formatTemplate = (item: SdeMasalItem): string => {
  // Handle object, string, or null for jenisTemplate/skemaTemplate
  const getVal = (v: any): string => {
    if (!v) return '-';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return v.label || v.name || v.value || '-';
    return String(v);
  };
  const skema = getVal(item.skemaTemplate || item.jenisTemplate);
  const versi = getVal(item.versiTemplate);
  if (skema === '-' && versi === '-') return '-';
  if (versi === '-') return skema;
  return `${skema} / ${versi}`;
};

const detailFields = computed(() => {
  if (!selectedItem.value) return [];
  const s = selectedItem.value;
  return [
    { label: 'Perihal', value: s.perihal },
    { label: 'Tertuju', value: s.tertuju },
    { label: 'Alamat', value: s.alamat },
    { label: 'Kota', value: s.kota },
    { label: 'Kode Pos', value: s.kodePos },
    { label: 'Jabatan Penerima', value: s.jabatanPenerima },
    { label: 'Isi Ringkasan', value: s.isiRingkasan },
    { label: 'Template', value: formatTemplate(s) },
    { label: 'Status', value: statusLabel(s.statusVerifikasi) },
    { label: 'Nomor Surat', value: s.nomorSurat },
    { label: 'Naskah ID', value: s.naskahId },
    { label: 'Error', value: s.errorMessage },
    { label: 'Pengirim', value: s.pengirimName },
    { label: 'Klasifikasi', value: s.klasifikasiName },
    { label: 'Lampiran', value: s.lampiranUrl },
    { label: 'Dibuat', value: s.createdAt ? new Date(s.createdAt).toLocaleString('id-ID') : null },
  ];
});

// --- Data loading ---
const loadData = async () => {
  await Promise.all([fetchList({ ...f }), fetchSummary()]);
};

const reload = () => {
  f.page = 1;
  loadData();
};

const resetFilter = () => {
  f.search = '';
  f.statusVerifikasi = '';
  f.jenisTemplate = '';
  f.page = 1;
  loadData();
};

const goPage = (page: number) => {
  f.page = page;
  loadData();
};

// --- Actions ---
const showDetail = (item: SdeMasalItem) => {
  selectedItem.value = item;
  detailModal.value = true;
};

const showEdit = (item: SdeMasalItem) => {
  selectedItem.value = item;
  editForm.perihal = item.perihal;
  editForm.tertuju = item.tertuju;
  editForm.jenisTemplate = typeof item.jenisTemplate === 'string' ? item.jenisTemplate : (item.jenisTemplate?.value || '');
  editModal.value = true;
};

const submitEdit = async () => {
  if (!selectedItem.value) return;
  editSubmitting.value = true;
  try {
    await updateItem(selectedItem.value.id, { ...editForm });
    editModal.value = false;
    toast.add({ title: 'Berhasil', description: 'Data berhasil diperbarui', color: 'success' });
    loadData();
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal mengupdate data', color: 'error' });
  } finally {
    editSubmitting.value = false;
  }
};

const showUploadLampiran = (item: SdeMasalItem) => {
  selectedItem.value = item;
  lampiranFile.value = null;
  lampiranModal.value = true;
};

const onLampiranSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    lampiranFile.value = target.files[0];
  }
};

const submitLampiran = async () => {
  if (!selectedItem.value || !lampiranFile.value) return;
  lampiranUploading.value = true;
  try {
    await uploadLampiran(selectedItem.value.id, lampiranFile.value);
    lampiranModal.value = false;
    toast.add({ title: 'Berhasil', description: 'Lampiran berhasil diupload', color: 'success' });
    loadData();
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal upload lampiran', color: 'error' });
  } finally {
    lampiranUploading.value = false;
  }
};

const confirmDelete = (item: SdeMasalItem) => {
  selectedItem.value = item;
  deleteModal.value = true;
};

const submitDelete = async () => {
  if (!selectedItem.value) return;
  deleteSubmitting.value = true;
  try {
    await deleteItem(selectedItem.value.id);
    deleteModal.value = false;
    toast.add({ title: 'Berhasil', description: 'Data berhasil dihapus', color: 'success' });
    loadData();
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal menghapus data', color: 'error' });
  } finally {
    deleteSubmitting.value = false;
  }
};

const statusLabel = (s: string) => {
  const m: Record<string, string> = { MENUNGGU: 'Menunggu', TERKIRIM: 'Terkirim', TERVERIFIKASI: 'Terverifikasi', DITOLAK: 'Ditolak', GAGAL: 'Gagal' };
  return m[s] || s || '-';
};

const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    MENUNGGU: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 font-medium whitespace-nowrap',
    TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap',
    TERVERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium whitespace-nowrap',
    DITOLAK: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium whitespace-nowrap',
    GAGAL: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium whitespace-nowrap',
  };
  return m[s] || m.MENUNGGU;
};

onMounted(() => {
  loadData();
});

// --- Generate Naskah Massal ---
const handleGenerateNaskah = async () => {
  generatingNaskah.value = true;
  try {
    const result = await generateNaskah();
    toast.add({
      title: 'Berhasil',
      description: `${result?.success ?? 0} naskah SDE berhasil dibuat, ${result?.failed ?? 0} gagal`,
      color: 'success',
    });
    loadData();
  } catch (e: any) {
    toast.add({
      title: 'Gagal',
      description: e?.message || 'Gagal generate naskah',
      color: 'error',
    });
  } finally {
    generatingNaskah.value = false;
  }
};
</script>