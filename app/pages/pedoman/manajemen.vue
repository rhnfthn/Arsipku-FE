<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <div>
        <PageHeader title="Manajemen Pedoman" :items="items" />
      </div>

      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors"
      >
        <Plus class="w-4 h-4" />
        Tambah Pedoman
      </button>
    </div>

    <div
      class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Top Bar -->
      <div class="flex flex-wrap gap-2 items-center p-3">
        <!-- Rows per page -->
        <div class="relative">
          <button
            type="button"
            @click="openRowsDropdown = !openRowsDropdown"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
          >
            <span>{{ rowsPerPage }}</span>
            <ChevronDown
              class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': openRowsDropdown }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openRowsDropdown"
              class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                v-for="n in rowsChoices"
                :key="n"
                type="button"
                @click="
                  rowsPerPage = n;
                  openRowsDropdown = false;
                "
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                  rowsPerPage === n
                    ? 'bg-primary/5 dark:bg-primary-900/30 text-primary dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ n }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Refresh -->
        <button
          @click="refreshData"
          class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition-colors"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <!-- Filter Jenis -->
        <div class="relative">
          <button
            type="button"
            @click="openJenisFilter = !openJenisFilter"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[140px] justify-between hover:border-primary transition-all"
          >
            <span class="truncate text-xs">{{ selectedFilterJenis || 'Semua' }}</span>
            <ChevronDown
              class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': openJenisFilter }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openJenisFilter"
              class="absolute z-30 mt-1 min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                type="button"
                @click="
                  selectedFilterJenis = '';
                  openJenisFilter = false;
                "
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 transition-colors',
                  !selectedFilterJenis
                    ? 'bg-primary/5 dark:bg-primary-900/30 text-primary dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                Semua
              </button>
              <button
                v-for="opt in jenisOptions"
                :key="opt.value"
                type="button"
                @click="
                  selectedFilterJenis = opt.value;
                  openJenisFilter = false;
                "
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                  selectedFilterJenis === opt.value
                    ? 'bg-primary/5 dark:bg-primary-900/30 text-primary dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Search -->
        <div class="relative flex-1 min-w-40">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="filters.search"
            placeholder="Cari judul atau deskripsi..."
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>
      </div>

      <!-- Table -->
      <table class="min-w-full border-collapse text-sm">
        <thead class="bg-primary-400 dark:bg-primary-700 text-white text-left">
          <tr>
            <th class="px-4 py-3 w-10">
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  @change="toggleSelectAll"
                  :checked="isAllSelected"
                  class="rounded border-gray-300"
                />
                <button
                  v-if="selectedIds.length > 0"
                  @click="openBulkDelete"
                  class="text-red-200 hover:text-red-400 transition-colors"
                  title="Hapus yang dipilih"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </th>
            <th class="px-4 py-3 font-semibold whitespace-nowrap">Judul</th>
            <th class="px-4 py-3 font-semibold whitespace-nowrap min-w-[180px]">Jenis</th>
            <th class="px-4 py-3 font-semibold">No. Dokumen</th>
            <th class="px-4 py-3 font-semibold">Tanggal Berlaku</th>
            <th class="px-4 py-3 font-semibold">Lampiran</th>
            <th class="px-4 py-3 font-semibold text-center">Status</th>
            <th class="px-4 py-3 font-semibold text-center">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-if="!loading"
            v-for="pedoman in paginatedPedoman"
            :key="pedoman.id"
            class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :value="pedoman.id"
                v-model="selectedIds"
                class="rounded border-gray-300"
              />
            </td>

            <td class="px-4 py-3">
              <p class="font-semibold text-gray-700 dark:text-white truncate max-w-xs">
                {{ pedoman.judul }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {{ pedoman.deskripsi }}
              </p>
            </td>

            <td class="px-4 py-3 whitespace-nowrap">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                :class="getJenisBadgeClass(pedoman.jenis)"
              >
                {{ pedoman.jenis }}
              </span>
            </td>

            <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {{ pedoman.nomorDokumen || '-' }}
            </td>

            <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {{ pedoman.tanggalBerlaku ? formatDateSlash(pedoman.tanggalBerlaku) : '-' }}
            </td>

            <td class="px-4 py-3 whitespace-nowrap">
              <div v-if="pedoman.lampirans && pedoman.lampirans.length > 0" class="flex items-center gap-1.5">
                <Paperclip class="w-3.5 h-3.5 text-primary shrink-0" />
                <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  {{ pedoman.lampirans.length }} file
                </span>
              </div>
              <span v-else class="text-xs text-gray-400">-</span>
            </td>

            <td class="px-4 py-3 text-center">
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  pedoman.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                ]"
              >
                {{ pedoman.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>

            <td class="px-4 py-3 text-center">
              <div class="flex justify-center gap-3">
                <button
                  class="p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors group"
                  @click="openEdit(pedoman)"
                  title="Edit Pedoman"
                >
                  <Pencil
                    class="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600"
                  />
                </button>

                <button
                  class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                  @click="openDelete(pedoman)"
                  title="Hapus Pedoman"
                >
                  <Trash2 class="w-4 h-4 text-red-600 dark:text-red-500 group-hover:text-red-600" />
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="loading">
            <td colspan="8" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
              <div class="flex justify-center">
                <div
                  class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"
                />
              </div>
            </td>
          </tr>
          <tr v-else-if="paginatedPedoman.length === 0">
            <td colspan="8" class="px-4 py-10">
              <EmptyState
                :icon="BookOpen"
                title="Tidak ada data pedoman"
                description="Tidak ada pedoman yang cocok dengan pencarian atau filter."
                icon-wrapper-class="bg-primary-50 dark:bg-primary-900/30"
                icon-class="text-primary"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="filteredPedoman.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Menampilkan {{ paginatedPedoman.length }} dari {{ filteredPedoman.length }} data
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Sebelumnya
          </button>

          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              1
            </button>

            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >

            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'
              ]"
            >
              {{ page }}
            </button>

            <span
              v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >

            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
            ]"
          >
            Selanjutnya
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Tambah / Edit -->
  <Teleport to="body" size="xl">
    <Modal v-model="showModal" :saving="isSaving" @save="savePedoman">
      <template #title>
        <Heading variant="heading9b" class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white">
          {{ isEditMode ? 'Edit Pedoman' : 'Tambah Pedoman' }}
        </Heading>
      </template>

      <div class="flex flex-col gap-2" data-field="judul">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">
          Judul <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.judul"
          type="text"
          placeholder="Masukkan judul pedoman..."
          :class="['border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400', errors.judul ? 'border-red-500' : 'border-gray-300 dark:border-gray-600']"
        />
        <p v-if="errors.judul" class="text-xs text-red-500">{{ errors.judul }}</p>
      </div>

      <div class="flex flex-col gap-2" data-field="deskripsi">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">
          Deskripsi <span class="text-red-500">*</span>
        </label>
        <div
          :class="[
            'border rounded-md overflow-hidden dark:bg-gray-700 dark:text-white',
            errors.deskripsi ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          ]"
        >
          <TinymceEditorAsync
            v-model="form.deskripsi"
            api-key="no-api-key"
            :init="tinyMceInit"
          />
        </div>
        <p v-if="errors.deskripsi" class="text-xs text-red-500">{{ errors.deskripsi }}</p>
      </div>

      <div class="flex flex-col gap-2" data-field="jenis">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">
          Jenis Dokumen <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <button
            type="button"
            @click="openJenisDropdown = !openJenisDropdown"
            :class="['border w-full h-9 px-3 text-sm bg-white dark:bg-gray-700 text-left rounded-md flex items-center justify-between hover:border-primary transition-all', errors.jenis ? 'border-red-500' : 'border-gray-300 dark:border-gray-600']"
          >
            <span
              :class="
                form.jenis
                  ? 'text-gray-800 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              "
            >
              {{ form.jenis || 'Pilih jenis...' }}
            </span>
            <ChevronDown
              class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': openJenisDropdown }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openJenisDropdown"
              class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                v-for="opt in jenisOptions"
                :key="opt.value"
                type="button"
                @click="
                  form.jenis = opt.value;
                  openJenisDropdown = false;
                "
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                  form.jenis === opt.value
                    ? 'bg-primary/5 dark:bg-primary-900/30 text-primary dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </Transition>
        </div>
        <p v-if="errors.jenis" class="text-xs text-red-500">{{ errors.jenis }}</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2" data-field="nomorDokumen">
          <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">
            Nomor Dokumen <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.nomorDokumen"
            type="text"
            placeholder="Masukkan nomor dokumen..."
            :class="['border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400', errors.nomorDokumen ? 'border-red-500' : 'border-gray-300 dark:border-gray-600']"
          />
          <p v-if="errors.nomorDokumen" class="text-xs text-red-500">{{ errors.nomorDokumen }}</p>
        </div>

        <div class="flex flex-col gap-2" data-field="tanggalBerlaku">
          <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">
            Tanggal Berlaku <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.tanggalBerlaku"
            type="date"
            :class="['border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white', errors.tanggalBerlaku ? 'border-red-500' : 'border-gray-300 dark:border-gray-600']"
          />
          <p v-if="errors.tanggalBerlaku" class="text-xs text-red-500">{{ errors.tanggalBerlaku }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">URL File Dokumen</label>
        <input
          v-model="form.fileUrl"
          type="url"
          placeholder="https://example.com/dokumen.pdf (opsional)..."
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      <!-- Lampiran (Multiple Files) -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">Lampiran (Gambar/Dokumen) — Bisa multiple</label>
        
        <!-- List of uploaded lampirans -->
        <div v-if="form.lampirans && form.lampirans.length > 0" class="space-y-2">
          <div
            v-for="(lampiran, idx) in form.lampirans"
            :key="idx"
            class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
          >
            <div class="flex-shrink-0 w-8 h-8 rounded bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <ImageIcon v-if="isImageFile(lampiran.name)" class="w-4 h-4 text-primary dark:text-primary-300" />
              <FileText v-else class="w-4 h-4 text-primary dark:text-primary-300" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                {{ lampiran.name }}
              </p>
              <p class="text-[10px] text-gray-400">
                Sudah diunggah
              </p>
            </div>
            <button
              type="button"
              @click="removeLampiran(idx)"
              class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              title="Hapus Lampiran"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Upload file button (always visible, supports multiple) -->
        <label class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-500 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all">
          <div class="flex flex-col items-center justify-center text-center">
            <div v-if="isUploadingLampiran" class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <Upload v-else class="w-6 h-6 text-gray-400 mb-2" />
            <p class="text-xs font-medium text-gray-700 dark:text-gray-300">
              {{ isUploadingLampiran ? 'Mengunggah...' : 'Klik untuk Unggah Lampiran (bisa pilih multiple)' }}
            </p>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              JPG, PNG, GIF, WebP, PDF, DOC, DOCX, XLS, XLSX (Maks. 10MB per file)
            </p>
          </div>
          <input
            type="file"
            class="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            multiple
            @change="handleFileUpload"
            :disabled="isUploadingLampiran"
          />
        </label>
      </div>

      <!-- Status isActive: hidden, default true -->
      <input type="hidden" v-model="form.isActive" />
    </Modal>
  </Teleport>

  <!-- Confirm Delete -->
  <ConfirmPopup
    v-model="confirmDeleteOpen"
    type="danger"
    title="Hapus Pedoman"
    message="Apakah Anda yakin ingin menghapus pedoman ini? Tindakan ini tidak dapat dibatalkan."
    confirm-text="Hapus"
    cancel-text="Batal"
    @confirm="deleteNow"
  />

  <!-- Confirm Bulk Delete -->
  <ConfirmPopup
    v-model="confirmBulkDeleteOpen"
    type="danger"
    title="Hapus Pedoman Terpilih"
    :message="`Apakah Anda yakin ingin menghapus ${selectedIds.length} pedoman yang dipilih? Tindakan ini tidak dapat dibatalkan.`"
    confirm-text="Hapus Semua"
    cancel-text="Batal"
    @confirm="bulkDeleteNow"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, defineAsyncComponent } from 'vue';
import { Trash2, RotateCcw, Search, Plus, Pencil, ChevronDown, BookOpen, Paperclip, Upload, X, ImageIcon, FileText } from 'lucide-vue-next';
import Modal from '@/components/Modal.vue';
import EmptyState from '~/components/EmptyState.vue';
import { usePedoman, PEDOMAN_JENIS_OPTIONS } from '@/composables/usePedoman';
import type { Pedoman, PedomanJenis, PedomanPayload, LampiranItem } from '@/composables/usePedoman';
import { formatDateSlash } from '~/utils/mail-helpers';

const TinymceEditorAsync = defineAsyncComponent(() => import('~/components/TinymceEditorAsync.vue'));

definePageMeta({ middleware: 'auth' });

const toast = useToast();
const { pedomanList, loading, fetchPedoman, createPedoman, updatePedoman, deletePedoman, uploadLampirans } =
  usePedoman();

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Manajemen Pedoman', to: '/pedoman/manajemen' }
];

const jenisOptions = PEDOMAN_JENIS_OPTIONS;

// ─── Filter & Sort ────────────────────────────────────────────────────────────
const filters = ref({ search: '' });
const selectedFilterJenis = ref('');

// ─── Pagination ───────────────────────────────────────────────────────────────
const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const currentPage = ref<number>(1);
const openRowsDropdown = ref(false);
const openJenisFilter = ref(false);
const openJenisDropdown = ref(false);

// ─── Checkbox ─────────────────────────────────────────────────────────────────
const selectedIds = ref<string[]>([]);

const isAllSelected = computed(
  () =>
    paginatedPedoman.value.length > 0 &&
    paginatedPedoman.value.every((p) => selectedIds.value.includes(p.id))
);

const toggleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    selectedIds.value = paginatedPedoman.value.map((p) => p.id);
  } else {
    selectedIds.value = [];
  }
};

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredPedoman = computed(() => {
  const q = filters.value.search.toLowerCase();
  let list = pedomanList.value.filter((p) => {
    const matchSearch =
      !q || `${p.judul} ${p.deskripsi} ${p.jenis}`.toLowerCase().includes(q);
    const matchJenis = !selectedFilterJenis.value || p.jenis === selectedFilterJenis.value;
    return matchSearch && matchJenis;
  });
  return list;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredPedoman.value.length / rowsPerPage.value))
);

const paginatedPedoman = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredPedoman.value.slice(start, start + rowsPerPage.value);
});

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else if (current <= 2) {
    pages.push(1, 2, 3, 4, 5);
  } else if (current >= total - 1) {
    pages.push(total - 2, total - 1, total);
  } else {
    pages.push(current - 1, current, current + 1);
  }
  return pages;
});

watch([() => filters.value.search, rowsPerPage, selectedFilterJenis], () => {
  currentPage.value = 1;
});

const config = useRuntimeConfig();
const isUploadingLampiran = ref(false);

const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
};

const getLampiranPreviewUrl = (lampiranUrl: string): string => {
  if (!lampiranUrl) return '';
  if (lampiranUrl.startsWith('http')) return lampiranUrl;
  return `${config.public.apiBaseUrl}/pedoman/preview-lampiran?path=${encodeURIComponent(lampiranUrl)}`;
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  isUploadingLampiran.value = true;
  try {
    const fileArray = Array.from(files);
    const uploaded = await uploadLampirans(fileArray);
    form.value.lampirans = [...(form.value.lampirans || []), ...uploaded];
    toast.add({ title: `${uploaded.length} lampiran berhasil diunggah`, color: 'success' });
  } catch (err: any) {
    const rawMsg = err?.response?.data?.message;
    const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || 'Gagal mengunggah lampiran');
    toast.add({ title: msg, color: 'error' });
  } finally {
    isUploadingLampiran.value = false;
    // Reset input so same files can be selected again
    target.value = '';
  }
};

const removeLampiran = (idx: number) => {
  if (!form.value.lampirans) return;
  form.value.lampirans = form.value.lampirans.filter((_, i) => i !== idx);
};

const normalizeDate = (dateString: string): string => {
  if (!dateString) return '';
  // Jika sudah YYYY-MM-DD, langsung return
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  // Jika format DD/MM/YYYY, ubah ke YYYY-MM-DD
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  // Jika ISO date, ambil bagian YYYY-MM-DD
  return dateString.split('T')[0];
};

// ─── Modal ────────────────────────────────────────────────────────────────────
const showModal = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);
const isSaving = ref(false);

const defaultForm = (): PedomanPayload & { isActive: boolean } => ({
  judul: '',
  deskripsi: '',
  jenis: 'Peraturan Direksi' as PedomanJenis,
  nomorDokumen: '',
  tanggalBerlaku: '',
  fileUrl: '',
  lampirans: [],
  isActive: true,
});

const form = ref(defaultForm());

const openAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  form.value = defaultForm();
  clearErrors();
  showModal.value = true;
};

const openEdit = (pedoman: Pedoman) => {
  isEditMode.value = true;
  editingId.value = pedoman.id;
  form.value = {
    judul: pedoman.judul,
    deskripsi: pedoman.deskripsi || '',
    jenis: pedoman.jenis,
    nomorDokumen: pedoman.nomorDokumen,
    tanggalBerlaku: pedoman.tanggalBerlaku ? pedoman.tanggalBerlaku.split('T')[0] : '',
    fileUrl: pedoman.fileUrl || '',
    lampirans: pedoman.lampirans || [],
    isActive: pedoman.isActive,
  };
  clearErrors();
  showModal.value = true;
};

const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 200,
  menubar: false,
  promotion: false,
  branding: false,
  statusbar: false,
  placeholder: 'Masukkan deskripsi pedoman...',
  plugins: 'lists',
  toolbar: 'bold italic bullist numlist',
  content_style: `body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.5; padding: 8px 12px; margin: 0; }`,
};

// ─── Validation ───────────────────────────────────────────────────────────────
const errors = ref<Record<string, string>>({});

const clearErrors = () => {
  errors.value = {};
};

const validateForm = (): boolean => {
  clearErrors();
  let firstErrorField: string | null = null;

  if (!form.value.judul.trim()) {
    errors.value.judul = 'Judul harus diisi';
    firstErrorField = firstErrorField || 'judul';
  }
  if (!form.value.deskripsi || form.value.deskripsi.replace(/\u003c[^\u003e]*\u003e/g, '').trim().length === 0) {
    errors.value.deskripsi = 'Deskripsi harus diisi';
    firstErrorField = firstErrorField || 'deskripsi';
  }
  if (!form.value.jenis) {
    errors.value.jenis = 'Jenis dokumen harus dipilih';
    firstErrorField = firstErrorField || 'jenis';
  }
  if (!form.value.nomorDokumen?.trim()) {
    errors.value.nomorDokumen = 'Nomor dokumen harus diisi';
    firstErrorField = firstErrorField || 'nomorDokumen';
  }
  if (!form.value.tanggalBerlaku) {
    errors.value.tanggalBerlaku = 'Tanggal berlaku harus diisi';
    firstErrorField = firstErrorField || 'tanggalBerlaku';
  }

  // Auto-scroll ke field pertama yang error
  if (firstErrorField) {
    nextTick(() => {
      const el = document.querySelector(`[data-field="${firstErrorField}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return false;
  }

  return true;
};

const savePedoman = async () => {
  if (!validateForm()) return;

  isSaving.value = true;
  try {
    const payload: PedomanPayload = {
      judul: form.value.judul.trim(),
      deskripsi: form.value.deskripsi,
      jenis: form.value.jenis,
      nomorDokumen: form.value.nomorDokumen.trim(),
      tanggalBerlaku: normalizeDate(form.value.tanggalBerlaku),
      fileUrl: form.value.fileUrl?.trim() || undefined,
      lampirans: form.value.lampirans && form.value.lampirans.length > 0 ? form.value.lampirans : undefined,
      isActive: form.value.isActive,
    };

    if (isEditMode.value && editingId.value) {
      await updatePedoman(editingId.value, payload);
      toast.add({ title: 'Pedoman berhasil diperbarui', color: 'success' });
    } else {
      await createPedoman(payload);
      toast.add({ title: 'Pedoman berhasil dibuat', color: 'success' });
    }

    showModal.value = false;
    await refreshData();
  } catch (err: any) {
    const rawMsg = err?.response?.data?.message;
    const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || 'Gagal menyimpan pedoman');
    toast.add({ title: msg, color: 'error' });
  } finally {
    isSaving.value = false;
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
const confirmDeleteOpen = ref(false);
const pendingDeleteId = ref<string | null>(null);

const openDelete = (pedoman: Pedoman) => {
  pendingDeleteId.value = pedoman.id;
  confirmDeleteOpen.value = true;
};

const deleteNow = async () => {
  if (!pendingDeleteId.value) return;
  try {
    await deletePedoman(pendingDeleteId.value);
    toast.add({ title: 'Pedoman berhasil dihapus', color: 'success' });
    confirmDeleteOpen.value = false;
    pendingDeleteId.value = null;
    await refreshData();
  } catch (err: any) {
    const rawMsg = err?.response?.data?.message;
    const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || 'Gagal menghapus pedoman');
    toast.add({ title: msg, color: 'error' });
  }
};

// ─── Bulk Delete ─────────────────────────────────────────────────────────────
const confirmBulkDeleteOpen = ref(false);

const openBulkDelete = () => {
  if (selectedIds.value.length === 0) return;
  confirmBulkDeleteOpen.value = true;
};

const bulkDeleteNow = async () => {
  try {
    await Promise.all(selectedIds.value.map((id) => deletePedoman(id)));
    toast.add({ title: `${selectedIds.value.length} pedoman berhasil dihapus`, color: 'success' });
    confirmBulkDeleteOpen.value = false;
    selectedIds.value = [];
    await refreshData();
  } catch (err: any) {
    const rawMsg = err?.response?.data?.message;
    const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || 'Gagal menghapus pedoman terpilih');
    toast.add({ title: msg, color: 'error' });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getJenisBadgeClass = (jenis: PedomanJenis): string => {
  switch (jenis) {
    case 'Peraturan Direksi':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'Keputusan Direksi':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    case 'SOP Kearsipan':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
};

// ─── Data ────────────────────────────────────────────────────────────────────
const refreshData = async () => {
  await fetchPedoman({ includeInactive: true });
};

onMounted(async () => {
  await refreshData();
});
</script>