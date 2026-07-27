<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5 min-h-screen px-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        title="Pemberkasan Arsip Aktif"
        :items="[
          { label: 'Kelola' },
          { label: 'Pemeliharaan' },
          { label: 'Pemberkasan' },
          { label: 'Berkas Saya' },
        ]"
      />
      <button
        @click="openCreateModal"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors shrink-0"
      >
        <Plus class="w-4 h-4" />
        Buat Berkas
      </button>
    </div>

    <!-- Table Card -->
    <div
      class="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Toolbar (delegasi-style: perPage + filters + search + export in one row) -->
      <div class="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center gap-3 w-full">
        <div class="flex items-center gap-3 flex-wrap flex-1">
          <!-- ROWS PER PAGE — custom dropdown -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleRowsPerPage"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[70px] justify-between"
            >
              <span>{{ perPage }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openRowsPerPage }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openRowsPerPage"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[80px]"
              >
                <button
                  v-for="n in [10, 25, 50]"
                  :key="n"
                  type="button"
                  @click.stop="selectRowsPerPage(n)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    perPage === n
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER STATUS -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterStatus"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] justify-between"
            >
              <span class="truncate">{{ statusLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterStatus }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterStatus"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]"
              >
                <button
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  type="button"
                  @click.stop="selectFilterStatus(opt.value)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    filterStatus === opt.value
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER KLASIFIKASI -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterKlasifikasi"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] max-w-[200px] justify-between"
            >
              <span class="truncate">{{ klasifikasiLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterKlasifikasi }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterKlasifikasi"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[180px] max-h-56 overflow-y-auto"
              >
                <button
                  type="button"
                  @click.stop="selectFilterKlasifikasi('')"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700',
                    filterKlasifikasi === ''
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  Semua Klasifikasi
                </button>
                <button
                  v-for="k in klasifikasiList"
                  :key="k.klasifikasi"
                  type="button"
                  @click.stop="selectFilterKlasifikasi(k.klasifikasi)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    filterKlasifikasi === k.klasifikasi
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ k.klasifikasi }} — {{ k.klasifikasi_text || '' }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER TAHUN -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterTahun"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] justify-between"
            >
              <span class="truncate">{{ tahunLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterTahun }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterTahun"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]"
              >
                <button
                  v-for="opt in tahunOptions"
                  :key="opt.value"
                  type="button"
                  @click.stop="selectFilterTahun(opt.value)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    filterTahun === opt.value
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </Transition>
          </div>

          <button
            type="button"
            @click="resetFilters"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            title="Reset Filter"
          >
            <RotateCcw class="w-4 h-4" />
          </button>

          <div class="relative flex-1 min-w-[180px]">
            <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Cari Berkas…"
              class="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
            />
          </div>
        </div>
        <button
          @click="exportData"
          :disabled="isExporting"
          class="shrink-0 flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-primary dark:bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <UIcon v-if="isExporting" name="i-lucide-loader-circle" class="w-3.5 h-3.5 animate-spin" />
          <UIcon v-else name="i-lucide-download" class="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <!-- Table -->
      <DataTable
        :columns="columns"
        :rows="berkasList"
        :loading="pending"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        header-class="bg-primary dark:bg-primary-700 text-white text-left"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        empty-message="Belum ada berkas. Klik 'Buat Berkas' untuk memulai."
        @sort="handleSort"
      >
        <template #cell-kodeBerkas="{ row }">
          <span class="font-mono text-xs">{{ row.kodeBerkas || '-' }}</span>
        </template>
        <template #cell-retensi="{ row }">
          <span class="text-xs">
            {{ row.retensiAktifTahun || 0 }}A / {{ row.retensiInaktifTahun || 0 }}I
          </span>
        </template>
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" />
        </template>
        <template #cell-updatedAt="{ row }">
          <span class="text-xs text-gray-500">{{ formatDate(row.updatedAt) }}</span>
        </template>
        <template #cell-aksi="{ row }">
          <NuxtLink
            :to="`/kelola/pemeliharaan/pemberkasan/${row.id}`"
            class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary transition-colors inline-flex"
            title="Lihat Detail"
          >
            <Eye class="w-4 h-4" />
          </NuxtLink>
        </template>
      </DataTable>

      <!-- Pagination -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="totalItems"
        :per-page="perPage"
      />
    </div>

    <!-- Modal Tambah Berkas -->
    <Teleport to="body">
      <Modal
        v-model="showCreateModal"
        :saving="isSubmitting"
        size="xl"
        :hide-default-footer="true"
      >
        <template #title>
          <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
            Tambah Berkas Arsip Aktif
          </Heading>
        </template>

        <div class="space-y-1">
          <!-- Klasifikasi -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Klasifikasi <span class="text-red-500">*</span>
            </span>
            <div class="flex-1 w-full">
              <select
                v-model="form.klasifikasi"
                @change="onKlasifikasiChange"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full"
              >
                <option value="" disabled>Pilih klasifikasi arsip</option>
                <option v-for="k in klasifikasiList" :key="k.klasifikasi" :value="k.klasifikasi">
                  {{ k.klasifikasi }} — {{ k.klasifikasi_text || '' }}
                </option>
              </select>
              <p v-if="modalErrors.klasifikasi" class="text-xs text-red-500 mt-1">
                Klasifikasi wajib dipilih
              </p>
            </div>
          </div>

          <!-- Nama Berkas -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Nama Berkas <span class="text-red-500">*</span>
            </span>
            <div class="flex-1 w-full">
              <input
                v-model="form.judul_berkas"
                type="text"
                placeholder="Masukkan nama berkas"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                @input="modalErrors.judul_berkas = false"
              />
              <p v-if="modalErrors.judul_berkas" class="text-xs text-red-500 mt-1">
                Nama berkas wajib diisi
              </p>
            </div>
          </div>

          <!-- Retensi Aktif -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Retensi Aktif
            </span>
            <div class="flex-1 w-full">
              <input
                :value="retensiAktifLabel"
                type="text"
                disabled
                placeholder="Otomatis"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full opacity-75 cursor-default"
              />
            </div>
          </div>

          <!-- Retensi Inaktif -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Retensi Inaktif
            </span>
            <div class="flex-1 w-full">
              <input
                :value="retensiInaktifLabel"
                type="text"
                disabled
                placeholder="Otomatis"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full opacity-75 cursor-default"
              />
            </div>
          </div>

          <!-- Kategori Berkas -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Kategori Berkas
            </span>
            <div class="flex-1 w-full">
              <input
                v-model="form.kategori_berkas"
                type="text"
                placeholder="Contoh: Pengadaan IT"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>
          </div>

          <!-- Lokasi Fisik -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Lokasi Fisik <span class="text-red-500">*</span>
            </span>
            <div class="flex-1 w-full">
              <input
                v-model="form.lokasi"
                type="text"
                placeholder="Contoh: Rak A, Baris 2"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                @input="modalErrors.lokasi = false"
              />
              <p v-if="modalErrors.lokasi" class="text-xs text-red-500 mt-1">
                Lokasi fisik wajib diisi
              </p>
            </div>
          </div>

          <!-- Foto Lokasi Fisik -->
          <div class="flex flex-col py-2 border-b border-gray-200 dark:border-gray-600 gap-2">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Foto Lokasi Fisik
            </span>
            <div class="flex-1 w-full">
              <label
                class="group cursor-pointer border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 transition border-gray-300 dark:border-gray-600"
              >
                <ImageIcon
                  class="w-6 h-6 group-hover:text-primary-400 text-gray-400 dark:text-gray-500"
                />
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Seret foto atau
                  <span class="text-primary-500 font-medium">pilih file</span>
                </p>
                <p class="text-[10px] text-gray-400 dark:text-gray-500">JPG/PNG, maks 5MB</p>
                <input
                  type="file"
                  class="hidden"
                  accept="image/jpeg,image/png"
                  @change="onFotoLokasiChange"
                />
              </label>
              <div v-if="form.foto_lokasi_fisik" class="mt-2">
                <span class="text-xs text-gray-600 dark:text-gray-300">{{
                  form.foto_lokasi_fisik.name
                }}</span>
                <button
                  type="button"
                  class="ml-2 text-red-400 hover:text-red-600"
                  @click="form.foto_lokasi_fisik = null"
                >
                  <X class="w-3.5 h-3.5 inline" />
                </button>
              </div>
            </div>
          </div>

          <!-- Nomor Berkas -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Nomor Berkas
            </span>
            <div class="flex-1 w-full">
              <input
                type="text"
                disabled
                placeholder="Otomatis"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full opacity-75 cursor-default"
              />
            </div>
          </div>

          <!-- Penyusutan Akhir -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Penyusutan Akhir <span class="text-red-500">*</span>
            </span>
            <div class="flex-1 w-full">
              <select
                v-model="form.tindakan_penyusutan_akhir"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full"
              >
                <option value="Musnah">Musnah</option>
                <option value="Permanen">Permanen</option>
              </select>
            </div>
          </div>

          <!-- Uraian -->
          <div class="flex flex-col py-2 border-b border-gray-200 dark:border-gray-600 gap-2">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Uraian <span class="text-red-500">*</span>
            </span>
            <div class="flex-1 w-full">
              <textarea
                v-model="form.isi_ringkas"
                rows="3"
                placeholder="Keterangan berkas"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 resize-none"
                @input="modalErrors.isi_ringkas = false"
              />
              <p v-if="modalErrors.isi_ringkas" class="text-xs text-red-500 mt-1">
                Uraian wajib diisi
              </p>
            </div>
          </div>

          <!-- Dokumen Pendukung -->
          <div class="flex flex-col py-2 border-b border-gray-200 dark:border-gray-600 gap-2">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Dokumen Pendukung
            </span>
            <div class="flex-1 w-full">
              <label
                class="group cursor-pointer border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 transition border-gray-300 dark:border-gray-600"
              >
                <Upload
                  class="w-6 h-6 group-hover:text-primary-400 text-gray-400 dark:text-gray-500"
                />
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Seret file atau
                  <span class="text-primary-500 font-medium">pilih file</span>
                </p>
                <p class="text-[10px] text-gray-400 dark:text-gray-500">PDF/JPG/PNG, maks 5MB</p>
                <input
                  type="file"
                  class="hidden"
                  accept=".pdf,image/jpeg,image/png"
                  @change="onDokumenChange"
                />
              </label>
              <div v-if="form.dokumen_pendukung" class="mt-2 space-y-2">
                <div
                  class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2"
                >
                  <div class="flex items-center gap-2">
                    <FileText class="w-4 h-4 text-primary-400" />
                    <div class="flex flex-col">
                      <span class="text-xs font-medium truncate max-w-[220px] dark:text-gray-200">{{
                        form.dokumen_pendukung.name
                      }}</span>
                      <span class="text-[10px] text-gray-400 dark:text-gray-500"
                        >{{ (form.dokumen_pendukung.size / 1024).toFixed(1) }} KB</span
                      >
                    </div>
                  </div>
                  <button
                    type="button"
                    class="text-red-400 hover:text-red-600"
                    @click="form.dokumen_pendukung = null"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div
            class="flex justify-between border-t border-gray-300 dark:border-gray-400 shrink-0 gap-3 px-5 py-2 mt-5"
          >
            <button
              type="button"
              :disabled="isSubmitting"
              class="flex-1 px-5 py-2 mt-2 text-sm border border-primary-500 hover:bg-primary-100 text-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              @click="resetForm(); showCreateModal = false"
            >
              Batal
            </button>

            <button
              type="button"
              :disabled="isSubmitting"
              class="flex-1 px-5 py-2 mt-2 text-sm border border-primary-500 text-primary hover:bg-primary-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              @click="onSubmitBerkas('draft')"
            >
              Simpan Draft
            </button>

            <button
              type="button"
              :disabled="isSubmitting"
              class="flex-1 px-5 py-2 mt-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md disabled:opacity-80 disabled:cursor-not-allowed"
              @click="onSubmitBerkas('aktif')"
            >
              <span v-if="isSubmitting" class="inline-flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="3"
                    class="opacity-25"
                  />
                  <path
                    d="M22 12a10 10 0 0 1-10 10"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    class="opacity-90"
                  />
                </svg>
                Menyimpan...
              </span>
              <span v-else>Simpan & Aktifkan</span>
            </button>
          </div>
        </template>
      </Modal>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from 'vue';
import {
  Plus,
  Eye,
  Upload,
  FileText,
  X,
  RotateCcw,
  Image as ImageIcon,
  ChevronDown,
} from 'lucide-vue-next';

const {
  getBerkasList,
  createBerkas,
  activateBerkas,
  getKlasifikasiDenganRetensi,
} = useArsipDinamis();
const toast = useToast();

// ── State ────────────────────────────────────────────────────────

const search = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const sortKey = ref('updatedAt');
const sortDir = ref<'asc' | 'desc'>('desc');
const showCreateModal = ref(false);
const berkasList = ref<any[]>([]);
const totalItems = ref(0);
const pending = ref(false);
const isSubmitting = ref(false);
const klasifikasiList = ref<any[]>([]);

const filterStatus = ref('');
const filterKlasifikasi = ref('');
const filterTahun = ref('');

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'closed_retensi_aktif', label: 'Closed — Retensi Aktif' },
];
const currentYear = new Date().getFullYear();
const tahunOptions = [
  { value: '', label: 'Semua Tahun' },
  ...Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  })),
];
const resetFilters = () => {
  filterStatus.value = '';
  filterKlasifikasi.value = '';
  filterTahun.value = '';
  currentPage.value = 1;
};

// ── Custom Dropdown Toolbar State (delegasi-style) ────────────────

const openRowsPerPage = ref(false);
const openFilterStatus = ref(false);
const openFilterKlasifikasi = ref(false);
const openFilterTahun = ref(false);

const statusLabel = computed(
  () => statusOptions.find((o) => o.value === filterStatus.value)?.label ?? 'Semua Status'
);
const klasifikasiLabel = computed(() => {
  if (!filterKlasifikasi.value) return 'Semua Klasifikasi';
  const k = klasifikasiList.value.find((x: any) => x.klasifikasi === filterKlasifikasi.value);
  return k ? `${k.klasifikasi} — ${k.klasifikasi_text || ''}` : 'Semua Klasifikasi';
});
const tahunLabel = computed(
  () => tahunOptions.find((o) => o.value === filterTahun.value)?.label ?? 'Semua Tahun'
);

function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
  openFilterStatus.value = false;
  openFilterKlasifikasi.value = false;
  openFilterTahun.value = false;
}
function toggleFilterStatus() {
  openFilterStatus.value = !openFilterStatus.value;
  openRowsPerPage.value = false;
  openFilterKlasifikasi.value = false;
  openFilterTahun.value = false;
}
function toggleFilterKlasifikasi() {
  openFilterKlasifikasi.value = !openFilterKlasifikasi.value;
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
  openFilterTahun.value = false;
}
function toggleFilterTahun() {
  openFilterTahun.value = !openFilterTahun.value;
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
  openFilterKlasifikasi.value = false;
}
function selectRowsPerPage(n: number) {
  perPage.value = n;
  openRowsPerPage.value = false;
}
function selectFilterStatus(val: string) {
  filterStatus.value = val;
  openFilterStatus.value = false;
}
function selectFilterKlasifikasi(val: string) {
  filterKlasifikasi.value = val;
  openFilterKlasifikasi.value = false;
}
function selectFilterTahun(val: string) {
  filterTahun.value = val;
  openFilterTahun.value = false;
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value = openFilterStatus.value = openFilterKlasifikasi.value = openFilterTahun.value = false;
}

// ── Form ─────────────────────────────────────────────────────────

const defaultForm = {
  klasifikasi: '',
  judul_berkas: '',
  tindakan_penyusutan_akhir: 'Musnah',
  lokasi: '',
  isi_ringkas: '',
  kategori_berkas: '',
  dokumen_pendukung: null as File | null,
  foto_lokasi_fisik: null as File | null,
};

const form = reactive({ ...defaultForm });
const modalErrors = reactive({
  klasifikasi: false,
  judul_berkas: false,
  lokasi: false,
  isi_ringkas: false,
});
const selectedRetensiAktif = ref(0);
const selectedRetensiInaktif = ref(0);

const retensiAktifLabel = computed(() =>
  selectedRetensiAktif.value > 0 ? `${selectedRetensiAktif.value} Tahun` : ''
);
const retensiInaktifLabel = computed(() =>
  selectedRetensiInaktif.value > 0 ? `${selectedRetensiInaktif.value} Tahun` : ''
);

// ── Table Columns (TypeORM returns camelCase keys) ───────────────

const columns = [
  { key: 'judulBerkas', label: 'Nama Berkas', sortable: true },
  { key: 'kodeBerkas', label: 'Kode Berkas' },
  { key: 'klasifikasiTeks', label: 'Klasifikasi' },
  { key: 'retensi', label: 'Retensi (A/I)' },
  { key: 'lokasi', label: 'Lokasi Fisik' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Updated', sortable: true },
  { key: 'aksi', label: 'Aksi' },
];

// ── Helpers ──────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
};

const openCreateModal = () => {
  resetForm();
  showCreateModal.value = true;
};

const resetForm = () => {
  Object.assign(form, defaultForm);
  modalErrors.klasifikasi = false;
  modalErrors.judul_berkas = false;
  modalErrors.lokasi = false;
  modalErrors.isi_ringkas = false;
  selectedRetensiAktif.value = 0;
  selectedRetensiInaktif.value = 0;
};

const onKlasifikasiChange = () => {
  const k = klasifikasiList.value.find((item: any) => item.klasifikasi === form.klasifikasi);
  if (k) {
    selectedRetensiAktif.value = k.retensi_aktif_tahun || 0;
    selectedRetensiInaktif.value = k.retensi_inaktif_tahun || 0;
  } else {
    selectedRetensiAktif.value = 0;
    selectedRetensiInaktif.value = 0;
  }
};

const onDokumenChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0] || null;
  form.dokumen_pendukung = file;
};

const onFotoLokasiChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0] || null;
  form.foto_lokasi_fisik = file;
};

// ── Submit ───────────────────────────────────────────────────────

const onSubmitBerkas = async (mode: 'draft' | 'aktif' = 'aktif') => {
  modalErrors.klasifikasi = !form.klasifikasi;
  modalErrors.judul_berkas = !form.judul_berkas;
  modalErrors.lokasi = !form.lokasi;
  modalErrors.isi_ringkas = !form.isi_ringkas;

  if (
    modalErrors.klasifikasi ||
    modalErrors.judul_berkas ||
    modalErrors.lokasi ||
    modalErrors.isi_ringkas
  ) {
    return;
  }

  isSubmitting.value = true;
  try {
    const payload: Record<string, any> = {
      klasifikasi: form.klasifikasi,
      judul_berkas: form.judul_berkas,
      hitung_waktu_retensi_dari: 'Sejak Berkas Ditutup',
      tindakan_penyusutan_akhir: form.tindakan_penyusutan_akhir,
      lokasi: form.lokasi,
      isi_ringkas: form.isi_ringkas,
      kategori_berkas: form.kategori_berkas || undefined,
      // ⚠️ Nama file saja; upload multipart ke storage adalah gap pre-existing (lihat catatan task).
      foto_lokasi_fisik: form.foto_lokasi_fisik?.name || undefined,
      dokumen_pendukung: form.dokumen_pendukung?.name || undefined,
    };

    const result: any = await createBerkas(payload);
    const createdBerkas = result?.data ?? result;

    if (!createdBerkas?.id) {
      throw new Error('ID berkas tidak ditemukan pada respons server.');
    }

    if (mode === 'aktif') {
      await activateBerkas(createdBerkas.id);
      toast.add({ title: 'Berkas berhasil dibuat & diaktifkan', color: 'success' });
    } else {
      toast.add({ title: 'Berkas disimpan sebagai draft', color: 'success' });
    }
    showCreateModal.value = false;
    resetForm();
    await fetchData();
  } catch (e: any) {
    toast.add({ title: e?.message || 'Gagal membuat berkas', color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

// ── Data Fetching ────────────────────────────────────────────────

const normalizePaginatedResponse = (response: any) => {
  // TransformResponseInterceptor membungkus response menjadi
  // { success: true, data: { data: [], meta: {} } }.
  // Tetap dukung response pagination tanpa wrapper agar composable fleksibel.
  const payload =
    response?.data?.data && Array.isArray(response.data.data)
      ? response.data
      : response?.data && Array.isArray(response.data)
        ? response
        : Array.isArray(response)
          ? { data: response, meta: {} }
          : { data: [], meta: {} };

  return {
    data: payload.data,
    meta: payload.meta ?? {},
  };
};

const fetchData = async () => {
  pending.value = true;
  try {
    const list = await getBerkasList({
      search: search.value || undefined,
      status: filterStatus.value || undefined,
      klasifikasi: filterKlasifikasi.value || undefined,
      tahun: filterTahun.value || undefined,
      page: currentPage.value,
      limit: perPage.value,
    });
    const normalizedList = normalizePaginatedResponse(list);
    berkasList.value = normalizedList.data;
    totalItems.value = Number(normalizedList.meta.total ?? normalizedList.data.length);
  } catch (e) {
    console.error('Gagal memuat data berkas:', e);
  } finally {
    pending.value = false;
  }
};

const isExporting = ref(false);

const exportData = async () => {
  if (totalItems.value === 0) {
    toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  isExporting.value = true;
  try {
    const list = await getBerkasList({
      search: search.value || undefined,
      status: filterStatus.value || undefined,
      klasifikasi: filterKlasifikasi.value || undefined,
      tahun: filterTahun.value || undefined,
      page: 1,
      limit: totalItems.value || 9999,
    });
    const rows = normalizePaginatedResponse(list).data;
    if (!rows.length) {
      toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
      return;
    }
    const headers = ['Nama Berkas', 'Kode Berkas', 'Klasifikasi', 'Retensi (A/I)', 'Lokasi Fisik', 'Status', 'Updated'];
    const csvRows = rows.map((b: any) => [
      b.judulBerkas,
      b.kodeBerkas,
      b.klasifikasiTeks,
      `${b.retensiAktifTahun || 0}A/${b.retensiInaktifTahun || 0}I`,
      b.lokasi,
      b.status,
      b.updatedAt,
    ]);
    downloadCsv(`berkas-saya_${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows);
    toast.add({ title: 'Berhasil', description: `${rows.length} data berhasil diexport`, color: 'success' });
  } catch (e) {
    console.error('Gagal export berkas:', e);
    toast.add({ title: 'Gagal export', description: 'Silakan coba kembali.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

const fetchKlasifikasi = async () => {
  try {
    const data: any = await getKlasifikasiDenganRetensi();
    klasifikasiList.value = Array.isArray(data) ? data : (data?.data ?? []);
  } catch (e) {
    console.error('Gagal memuat klasifikasi:', e);
  }
};

// ── Watchers ─────────────────────────────────────────────────────

// Filter changes -> reset to page 1 (the currentPage watcher then fetches;
// if already on page 1, fetch directly so the change still applies).
watch([search, filterStatus, filterKlasifikasi, filterTahun], () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  else fetchData();
});

// Page/perPage changes -> fetch (perPage change resets to page 1 first).
watch([currentPage, perPage], ([, newPerPage], [, oldPerPage]) => {
  if (newPerPage !== oldPerPage && currentPage.value !== 1) {
    currentPage.value = 1;
    return;
  }
  fetchData();
});

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  fetchData();
  fetchKlasifikasi();
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<style scoped>
[data-custom-dropdown] button:focus {
  outline: none;
}
.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-4px);
}
.filter-dd-enter-to,
.filter-dd-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}
</style>
