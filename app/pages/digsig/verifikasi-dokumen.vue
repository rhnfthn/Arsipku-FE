<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white">
          {{ $t('vd_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        @click="openAddModal"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        {{ $t('nm_button') }}
      </button>
    </div>

    <div
      class="bg-white mt-2 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full"
    >
      <!-- TOP ACTION BAR -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 p-3.5">
        <!-- STATUS FILTER -->
        <div class="relative" data-custom-dropdown>
          <button
            type="button"
            @click.stop="openFilterStatus = !openFilterStatus"
            class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[180px] justify-between"
          >
            <span class="truncate">{{ filterStatusLabel }}</span>
            <ChevronDown
              :class="[
                'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200',
                openFilterStatus ? 'rotate-180' : 'rotate-0'
              ]"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openFilterStatus"
              class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[200px]"
            >
              <button
                v-for="item in filterOptions"
                :key="item.value"
                type="button"
                @click.stop="selectFilterStatus(item)"
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                  statusFilter === item.value
                    ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ item.label }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- SEARCH -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            @input="handleSearch"
            :placeholder="$t('vd_cari')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <!-- LOADING (SKELETON) -->
      <div v-if="loading" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-primary dark:bg-primary-700 text-white">
            <tr>
              <th class="px-4 py-3 text-left">Tanggal Dibuat</th>
              <th class="px-4 py-3 text-left">No Dokumen</th>
              <th class="px-4 py-3 text-left">Perihal</th>
              <th class="px-4 py-3 text-center">Penanda Tangan</th>
              <th class="px-4 py-3 text-center">Dokumen</th>
              <th class="px-4 py-3 text-center">Status</th>
              <th class="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 5" :key="i" class="border-b border-gray-100 dark:border-gray-700">
              <td class="p-4">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-28"></div>
              </td>
              <td class="p-4">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
              </td>
              <td class="p-4">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48"></div>
              </td>
              <td class="p-4 text-center">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8 mx-auto"
                ></div>
              </td>
              <td class="p-4 text-center">
                <div
                  class="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-16 mx-auto"
                ></div>
              </td>
              <td class="p-4 text-center">
                <div
                  class="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-24 mx-auto"
                ></div>
              </td>
              <td class="p-4">
                <div class="flex items-center justify-center gap-4">
                  <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="documents.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400"
      >
        <p class="text-sm font-medium">Data tidak ditemukan</p>
      </div>

      <!-- TABLE -->
      <div v-else class="overflow-x-auto">
        <table class="w-full bg-white dark:bg-gray-800 text-sm">
          <thead class="bg-primary dark:bg-primary-700 text-white text-sm">
            <tr>
              <th
                @click="handleSort('tanggalDokumen')"
                class="cursor-pointer hover:bg-primary-600 dark:hover:bg-primary-800 transition"
              >
                <div class="flex items-center gap-2 px-4 py-3">
                  <span>{{ $t('tanggal') }}</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortKey === 'tanggalDokumen'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>

              <th
                @click="handleSort('nomorDokumen')"
                class="cursor-pointer hover:bg-primary-600 dark:hover:bg-primary-800 transition"
              >
                <div class="flex items-center gap-2 px-4 py-3">
                  <span>{{ $t('nodokumen') }}</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortKey === 'nomorDokumen'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>

              <th
                @click="handleSort('perihal')"
                class="cursor-pointer hover:bg-primary-600 dark:hover:bg-primary-800 transition"
              >
                <div class="flex items-center gap-2 px-4 py-3">
                  <span>{{ $t('perihal') }}</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortKey === 'perihal'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>
              <th class="px-4 py-3 text-center">{{ $t('sign') }}</th>
              <th class="px-4 py-3 text-center">{{ $t('dokumen') }}</th>
              <th
                @click="handleSort('status')"
                class="cursor-pointer hover:bg-primary-600 dark:hover:bg-primary-800 transition"
              >
                <div class="flex items-center gap-2 px-4 py-3">
                  <span>Status</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortKey === 'status'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>

              <th class="px-4 py-3 text-center">{{ $t('aksi') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="doc in paginatedRows"
              :key="doc.id"
              class="border-b border-gray-100 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition"
            >
              <td class="p-4 text-gray-900 dark:text-white">
                {{ formatDate(doc.createdAt) }}
              </td>
              <td class="p-4">
                <div class="font-medium text-gray-900 dark:text-white">
                  <span v-html="highlight(doc.nomorDokumen, search)"></span>
                </div>
              </td>
              <td class="p-4">
                <div class="text-gray-700 dark:text-gray-300 text-sm">
                  <span v-html="highlight(doc.perihal, search)"></span>
                </div>
              </td>
              <td class="p-4 text-center text-gray-900 dark:text-white">
                {{ doc.totalSigners }}
              </td>
              <td class="p-4 text-center">
                <button
                  @click="viewDocument(doc)"
                  class="flex items-center gap-2 mx-auto bg-blue-100 dark:bg-blue-900 text-primary-600 dark:text-blue-300 px-3 py-1 text-xs font-medium rounded-lg hover:bg-primary-300 dark:hover:bg-primary transition"
                >
                  <FileCheck class="w-4 h-4" />
                  Lihat <ChevronRight class="w-4 h-4" />
                </button>
              </td>
              <td class="p-4 text-center">
                <span
                  class="px-3 py-1 rounded-full text-center text-xs font-medium"
                  :class="getStatusClass(doc.status)"
                >
                  {{ getStatusLabel(doc.status) }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex items-center justify-center gap-3">
                  <button
                    @click="openDetailModal(doc.id)"
                    class="p-1 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition"
                    title="Lihat Detail"
                  >
                    <Eye class="w-4.5 h-4.5" />
                  </button>
                  <button
                    @click="openEditModal(doc.id)"
                    class="p-1 text-yellow-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition"
                    title="Lihat Detail"
                  >
                    <Pencil class="w-4.5 h-4.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="filteredRows.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ $t('menampilkan') }} {{ paginatedRows.length }} {{ $t('dari') }}
          {{ filteredRows.length }} data
        </div>

        <div class="flex items-center gap-2">
          <!-- Back Button -->
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
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
            {{ $t('sebelumnya') }}
          </button>

          <!-- Page Numbers -->
          <div class="flex items-center gap-1">
            <!-- First page -->
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
            >
              1
            </button>

            <!-- Left ellipsis -->
            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- Visible pages -->
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary dark:bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400'
              ]"
            >
              {{ page }}
            </button>

            <!-- Right ellipsis -->
            <span
              v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- Last page -->
            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <!-- Next Button -->
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
            ]"
          >
            {{ $t('selanjutnya') }}
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

    <!-- MODAL ADD/EDIT DOKUMEN -->
    <Teleport to="body">
      <Modal v-model="openAdd" :hideDefaultFooter="true" size="xl">
        <template #title>
          <div class="mt-5 ml-5 mb-3">
            <Heading variant="heading9b" class="font-bold text-sm dark:text-white">
              {{ isEditMode ? 'Edit Dokumen' : 'Tambah Dokumen' }}
            </Heading>
          </div>
        </template>

        <div class="p-1 mt-1 max-h-[calc(100vh-180px)] overflow-y-auto">
          <!-- FORM FIELDS -->
          <div class="space-y-4">
            <div>
              <Heading variant="body2m" class="dark:text-gray-200">
                Tanggal Dokumen <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="addForm.tanggal"
                type="date"
                @change="formErrors.tanggal = false"
                :class="[
                  'w-full border dark:bg-gray-700 dark:text-white px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 text-sm mt-2',
                  formErrors.tanggal
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                ]"
              />
              <p
                v-if="formErrors.tanggal"
                class="mt-1 text-xs text-red-500 flex items-center gap-1"
              >
                {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
              </p>
            </div>

            <div>
              <Heading variant="body2m" class="dark:text-gray-200">
                Klasifikasi <span class="text-red-500">*</span>
              </Heading>
              <div class="relative mt-2" ref="klasifikasiDropdownRef">
                <div
                  @click="toggleKlasifikasiDropdown"
                  :class="[
                    'w-full border dark:bg-gray-700 px-3 py-2 rounded-md text-sm cursor-pointer flex items-center justify-between',
                    formErrors.klasifikasi
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  ]"
                >
                  <span v-if="addForm.klasifikasi" class="text-gray-900 dark:text-white">
                    {{ getSelectedKlasifikasiLabel() }}
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400">
                    {{ loadingKlasifikasi ? 'Loading...' : 'Pilih Klasifikasi' }}
                  </span>
                  <svg
                    class="w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform"
                    :class="{ 'rotate-180': showKlasifikasiDropdown }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <p
                  v-if="formErrors.klasifikasi"
                  class="mt-1 text-xs text-red-500 flex items-center gap-1"
                >
                  {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
                </p>
                <!-- Dropdown Menu -->
                <div
                  v-if="showKlasifikasiDropdown"
                  class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-80 overflow-hidden"
                >
                  <!-- Search Input -->
                  <div
                    class="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800"
                  >
                    <div class="relative">
                      <Search
                        class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                      />
                      <input
                        v-model="klasifikasiSearchQuery"
                        type="text"
                        placeholder="Cari klasifikasi..."
                        class="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        @click.stop
                      />
                    </div>
                  </div>

                  <!-- Options List -->
                  <div class="overflow-y-auto max-h-64">
                    <div
                      v-for="k in filteredKlasifikasiList"
                      :key="k.id"
                      @click="selectKlasifikasi(k)"
                      class="px-3 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      :class="{
                        'bg-blue-50 dark:bg-gray-700': addForm.klasifikasi === k.klasifikasi
                      }"
                    >
                      <p class="font-medium">{{ k.klasifikasi }} - {{ k.klasifikasi_text }}</p>
                    </div>

                    <div
                      v-if="filteredKlasifikasiList.length === 0"
                      class="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm"
                    >
                      Tidak ada data ditemukan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Heading variant="body2m" class="dark:text-gray-200">
                Jenis Naskah <span class="text-red-500">*</span>
              </Heading>
              <div class="relative mt-2" ref="jenisNaskahDropdownRef">
                <div
                  @click="toggleJenisNaskahDropdown"
                  :class="[
                    'w-full border dark:bg-gray-700 px-3 py-2 rounded-md text-sm cursor-pointer flex items-center justify-between',
                    formErrors.jenisNaskah
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  ]"
                >
                  <span v-if="addForm.jenisNaskah" class="text-gray-900 dark:text-white">
                    {{ getSelectedJenisNaskahLabel() }}
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400">
                    {{ loadingJenisNaskah ? 'Loading...' : 'Pilih Jenis Naskah' }}
                  </span>
                  <svg
                    class="w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform"
                    :class="{ 'rotate-180': showJenisNaskahDropdown }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                <!-- Dropdown Menu -->
                <div
                  v-if="showJenisNaskahDropdown"
                  class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-80 overflow-hidden"
                >
                  <!-- Search Input -->
                  <div
                    class="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800"
                  >
                    <div class="relative">
                      <Search
                        class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                      />
                      <input
                        v-model="jenisNaskahSearchQuery"
                        type="text"
                        placeholder="Cari jenis naskah..."
                        class="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        @click.stop
                      />
                    </div>
                  </div>

                  <!-- Options List -->
                  <div class="overflow-y-auto max-h-64">
                    <div
                      v-for="j in filteredJenisNaskahList"
                      :key="j.id"
                      @click="selectJenisNaskah(j)"
                      class="px-3 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      :class="{
                        'bg-blue-50 dark:bg-gray-700': addForm.jenisNaskah === j.jenis
                      }"
                    >
                      <p class="font-medium">{{ j.jenis }} - {{ j.jenis_text }}</p>
                    </div>

                    <div
                      v-if="filteredJenisNaskahList.length === 0"
                      class="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm"
                    >
                      Tidak ada data ditemukan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Heading variant="body2m" class="dark:text-gray-200">
                Nomor Dokumen <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="addForm.nomorDokumen"
                @input="formErrors.nomorDokumen = false"
                placeholder="Masukkan Nomor Dokumen"
                :class="[
                  'w-full border dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 text-sm mt-2',
                  formErrors.nomorDokumen
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                ]"
              />
              <p
                v-if="formErrors.nomorDokumen"
                class="mt-1 text-xs text-red-500 flex items-center gap-1"
              >
                {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
              </p>
            </div>

            <div>
              <Heading variant="body2m" class="dark:text-gray-200">
                Perihal <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="addForm.perihal"
                @input="formErrors.perihal = false"
                placeholder="Masukkan Perihal Dokumen"
                :class="[
                  'w-full border dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 text-sm mt-2',
                  formErrors.perihal
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                ]"
              />
              <p
                v-if="formErrors.perihal"
                class="mt-1 text-xs text-red-500 flex items-center gap-1"
              >
                {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
              </p>
            </div>

            <!-- File Attachment - Compact -->
            <div>
              <Heading variant="body2m" class="mb-2 dark:text-gray-200">
                Lampiran Berkas <span class="text-red-500">*</span>
              </Heading>
              <div class="flex items-center gap-3">
                <button
                  @click="triggerFileUpload"
                  :class="[
                    'px-4 py-2 border rounded-md text-sm font-medium transition flex items-center gap-2 dark:text-white',
                    formErrors.file
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-600'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  ]"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Pilih File
                </button>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  class="hidden"
                  @change="handleFileUpload"
                />
                <div class="flex items-center gap-2 flex-1">
                  <p
                    v-if="addForm.fileName"
                    class="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2"
                  >
                    <FileCheck class="w-4 h-4" />
                    {{ addForm.fileName }}
                  </p>
                  <p v-else class="text-xs text-gray-400 dark:text-gray-500">
                    PDF, DOC, DOCX (Max. 10MB)
                  </p>
                  <button
                    v-if="previewUrl || (isEditMode && !addForm.file)"
                    @click="previewFileInModal"
                    class="ml-auto px-3 py-1 bg-blue-50 dark:bg-blue-900 text-primary dark:text-blue-300 text-xs font-medium rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 transition flex items-center gap-1"
                  >
                    <Eye class="w-3 h-3" />
                    Preview
                  </button>
                </div>
              </div>
              <p v-if="formErrors.file" class="mt-1 text-xs text-red-500 flex items-center gap-1">
                {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
              </p>
            </div>

            <!-- Visible Sign -->
            <div class="flex items-center justify-between mt-1 mb-2">
              <div>
                <Heading variant="body2m" class="dark:text-gray-200">Visible Sign</Heading>
                <p class="text-xs text-red-500 mt-1">
                  *Visible Sign hanya berlaku pada penanda tangan terakhir
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="addForm.visibleSign" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                ></div>
              </label>
            </div>

            <!-- Penanda Tangan -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <Heading variant="body2m" class="dark:text-gray-200">
                  Penanda Tangan <span class="text-red-500">*</span>
                </Heading>
              </div>

              <!-- Selected Signers Display -->
              <div v-if="addForm.selectedSigners.length > 0" class="mb-4 space-y-2">
                <div
                  v-for="(signer, index) in addForm.selectedSigners"
                  :key="index"
                  class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                >
                  <div class="flex-1">
                    <p class="font-medium text-sm text-gray-900 dark:text-white">
                      {{ index + 1 }}. {{ signer.jabatan }} - {{ signer.lokasi }} -
                      {{ signer.nama }}
                    </p>
                  </div>
                  <button
                    type="button"
                    @click="removeSelectedSigner(index)"
                    class="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 ml-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Dropdown with Search -->
              <div class="relative" ref="dropdownRef">
                <div
                  @click="toggleSignerDropdown"
                  :class="[
                    'w-full border dark:bg-gray-700 px-3 py-2 rounded-md text-sm cursor-pointer flex items-center justify-between',
                    formErrors.signers ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  ]"
                >
                  <span class="text-gray-500 dark:text-gray-400">{{
                    loadingVerifikator ? 'Loading...' : 'Pilih Jabatan'
                  }}</span>
                  <svg
                    class="w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform"
                    :class="{ 'rotate-180': showSignerDropdown }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <p
                  v-if="formErrors.signers"
                  class="mt-1 text-xs text-red-500 flex items-center gap-1"
                >
                  {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
                </p>
                <!-- Dropdown Menu -->
                <div
                  v-if="showSignerDropdown"
                  class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-80 overflow-hidden"
                >
                  <!-- Search Input -->
                  <div
                    class="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-gray-100 dark:bg-gray-800"
                  >
                    <div class="relative">
                      <Search
                        class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                      />
                      <input
                        v-model="signerSearchQuery"
                        type="text"
                        placeholder="Cari jabatan, nama, atau lokasi..."
                        class="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        @click.stop
                      />
                    </div>
                  </div>

                  <!-- Options List -->
                  <div class="overflow-y-auto max-h-64">
                    <div
                      v-for="v in filteredVerifikatorList"
                      :key="v.persnum"
                      @click="selectSigner(v)"
                      class="px-3 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      :class="{
                        'bg-blue-50 dark:bg-gray-700':
                          addForm.selectedSigners.findIndex((s) => s.persnum === v.persnum) !== -1
                      }"
                    >
                      <p class="font-reguler">{{ v.jabatan }} - {{ v.nama }} - {{ v.lokasi }}</p>
                    </div>

                    <div
                      v-if="filteredVerifikatorList.length === 0"
                      class="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm"
                    >
                      Tidak ada data ditemukan
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div
          class="flex justify-between gap-3 px-0 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            @click="closeModal"
            class="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Batal
          </button>
          <button
            @click="saveDokumen"
            :disabled="loading"
            class="flex-1 px-6 py-2 bg-primary dark:bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 dark:hover:bg-primary-700 transition disabled:opacity-50"
          >
            {{ loading ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </Modal>
    </Teleport>

    <!-- MODAL DETAIL -->
    <Teleport to="body">
      <Modal v-model="openDetail" :hideDefaultFooter="true" size="xl">
        <template #title>
          <Heading variant="heading9b" class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white">
            Detail Dokumen
          </Heading>
        </template>

        <div class="px-3 max-h-[calc(100vh-150px)] overflow-y-auto">
          <div v-if="loadingDetail" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>

          <div
            v-else-if="documentDetail"
            class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-2"
          >
            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">No Dokumen</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ documentDetail.nomorDokumen }}
              </p>
            </div>

            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">Tanggal</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatDate(documentDetail.tanggalDokumen) }}
              </p>
            </div>

            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">Jenis Naskah</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ documentDetail.jenisNaskah }}
              </p>
            </div>

            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">Klasifikasi</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{
                  documentDetail.klasifikasiText ||
                  (documentDetail.klasifikasi ? `${documentDetail.klasifikasi}` : '-')
                }}
              </p>
            </div>

            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">Perihal</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ documentDetail.perihal }}
              </p>
            </div>

            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">Status</p>
              <span
                class="px-3 py-1 rounded-lg text-xs font-medium inline-block"
                :class="getStatusClass(documentDetail.status)"
              >
                {{ getStatusLabel(documentDetail.status) }}
              </span>
            </div>

            <div class="md:col-span-2">
              <p class="text-gray-500 dark:text-gray-400 mb-2">Dokumen</p>
              <button
                @click="viewDocumentFromDetail"
                class="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-primary dark:text-blue-300 px-4 py-2 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition"
              >
                <FileCheck class="w-4 h-4" />
                Lihat Preview Dokumen
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- TABLE SIGNERS -->
          <div
            v-if="documentDetail && documentDetail.signers && documentDetail.signers.length > 0"
            class="mt-6 mb-5 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
          >
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead
                  class="bg-primary dark:bg-primary-700 border-b border-gray-200 dark:border-gray-700"
                >
                  <tr>
                    <th class="p-3 text-left text-white font-semibold">NO</th>
                    <th class="p-3 text-left font-semibold text-white">E-NIK</th>
                    <th class="p-3 text-left font-semibold text-white">NAMA / JABATAN</th>
                    <th class="p-3 text-center font-semibold text-white">STATUS</th>
                    <th class="p-3 text-center font-semibold text-white">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(s, i) in documentDetail.signers"
                    :key="i"
                    class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td class="p-3">
                      <span
                        class="inline-flex items-center justify-center text-xs font-semibold text-gray-900 dark:text-white"
                      >
                        {{ s.urutan }}
                      </span>
                    </td>
                    <td class="p-3 font-mono text-gray-700 dark:text-gray-300">
                      {{ s.persnum || '-' }}
                    </td>
                    <td class="p-3">
                      <div class="font-semibold text-gray-900 dark:text-white">
                        {{ s.nama || '-' }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {{ s.jabatan || '-' }}
                      </div>
                    </td>
                    <td class="p-3 text-center">
                      <span
                        class="px-3 py-1 rounded-lg text-xs font-semibold"
                        :class="getSignerStatusClass(s.status)"
                      >
                        {{ getSignerStatusLabel(s.status) }}
                      </span>
                    </td>
                    <td class="p-3 font-mono text-center text-gray-700 dark:text-gray-300">
                      {{ s.keterangan || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="
              documentDetail && (!documentDetail.signers || documentDetail.signers.length === 0)
            "
            class="mt-6 mb-5 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center"
          >
            <p class="text-gray-500 dark:text-gray-400 text-sm">
              Belum ada penandatangan yang ditambahkan
            </p>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- DOCUMENT VIEWER SLIDEOVER -->
    <USlideover
      v-model:open="isOpenPreview"
      title="Pratinjau Dokumen"
      side="bottom"
      :dismissible="true"
      :ui="{
        content: 'h-screen max-h-screen',
        body: 'p-0',
        footer: 'p-4 border-t border-gray-200 dark:border-gray-800'
      }"
    >
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <iframe
            v-if="pdfUrl"
            :key="pdfUrl"
            :src="pdfUrl"
            allowfullscreen
            class="w-full h-full rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          />

          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500 dark:text-gray-400">Memuat Pratinjau...</span>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';

import {
  Plus,
  Search,
  Pencil,
  FileCheck,
  Eye,
  ChevronDown,
  ArrowUpDown,
  ChevronRight
} from 'lucide-vue-next';

import { useDigsig } from '~/composables/useDigsig';
import type { Verifikator } from '~/types/digsig';
definePageMeta({
  middleware: 'auth'
});

const { t } = useI18n();
const {
  documents,
  documentDetail,
  meta,
  loading,
  loadingDetail,
  klasifikasiList,
  klasifikasiDetail,
  jenisNaskahList,
  verifikatorList,
  loadingKlasifikasi,
  loadingJenisNaskah,
  loadingVerifikator,
  fetchDocuments,
  fetchDocumentDetail,
  createDocument,
  updateDocument,
  fetchKlasifikasi,
  fetchKlasifikasiDetail,
  fetchJenisNaskah,
  fetchVerifikator,
  showToastSignerAdded,
  showToastSignerRemoved,
  showToastFileTooLarge,
  showToastFileSelected,
  showToastFileNotAvailable,
  showToastGagalPreview,
  showToastValidasiForm,
  showToastDokumenCreated,
  showToastDokumenUpdated
} = useDigsig();

const isOpenPreview = ref(false);
const pdfUrl = ref<string | null>(null);
const previewUrl = ref<string | null>(null);

// Track which modal to return to after closing preview
const returnToModal = ref<'detail' | 'form' | null>(null);

const openDetail = ref(false);
const openAdd = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const klasifikasiDropdownRef = ref<HTMLElement | null>(null);
const jenisNaskahDropdownRef = ref<HTMLElement | null>(null);

const selectedKlasifikasiDetail = ref<any>(null);

// Dropdown states
const showSignerDropdown = ref(false);
const showKlasifikasiDropdown = ref(false);
const showJenisNaskahDropdown = ref(false);

// Search queries
const signerSearchQuery = ref('');
const klasifikasiSearchQuery = ref('');
const jenisNaskahSearchQuery = ref('');

// Filter + Search
const statusFilter = ref('');
const openFilterStatus = ref(false);
const sortKey = ref('');
const sortOrder = ref('asc');

// Track if dropdown data has been loaded
const dropdownDataLoaded = ref({
  klasifikasi: false,
  jenisNaskah: false,
  verifikator: false
});

function handleSort(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
}

const search = ref('');
const currentPage = ref(1);
const limit = ref(10);
const rowsPerPage = ref(10);

const addForm = ref({
  tanggal: '',
  klasifikasi: '',
  jenisNaskah: '',
  nomorDokumen: '',
  perihal: '',
  fileName: '',
  file: null as File | null,
  visibleSign: false,
  signers: [] as { urutan: number; persnum: number }[],
  selectedSigners: [] as Verifikator[]
});
const formErrors = ref({
  tanggal: false,
  klasifikasi: false,
  jenisNaskah: false,
  nomorDokumen: false,
  perihal: false,
  file: false,
  signers: false
});
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('verifikasi'), to: '/digsig/verifikasi-dokumen' }
]);

const filterOptions = [
  { label: 'Semua', value: '' },
  { label: 'Diproses', value: 'on_progress' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Ditolak', value: 'rejected' }
];

const filterStatusLabel = computed(() => {
  const found = filterOptions.find((opt) => opt.value === statusFilter.value);
  return found?.label || 'Semua Status';
});

const filteredRows = computed(() => {
  const s = search.value.toLowerCase();
  const fs = statusFilter.value;

  return documents.value.filter((r) => {
    if (!r) return false;

    const matchSearch =
      r.nomorDokumen?.toLowerCase().includes(s) || r.perihal?.toLowerCase().includes(s);

    const matchStatus = !fs || r.status === fs;
    return matchSearch && matchStatus;
  });
});

const sortedRows = computed(() => {
  if (!sortKey.value) return filteredRows.value;

  return [...filteredRows.value].sort((a, b) => {
    let A = a[sortKey.value];
    let B = b[sortKey.value];

    if (sortKey.value.toLowerCase().includes('tanggal')) {
      A = new Date(A).getTime();
      B = new Date(B).getTime();
      return sortOrder.value === 'asc' ? A - B : B - A;
    }

    A = String(A ?? '').toLowerCase();
    B = String(B ?? '').toLowerCase();

    if (A < B) return sortOrder.value === 'asc' ? -1 : 1;
    if (A > B) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function highlight(text: string | null | undefined, keyword: string): string {
  const safeText = escapeHtml(String(text ?? '-'));
  const q = keyword.trim();
  if (!q) return safeText;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');

  return safeText.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">$1</mark>'
  );
}

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedRows.value.slice(start, start + rowsPerPage.value);
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedRows.value.length / rowsPerPage.value))
);

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 2) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(current - 1, current, current + 1);
    }
  }

  return pages;
});

// ✅ LAZY LOAD: Fetch dropdown data hanya saat modal dibuka
const ensureDropdownData = async () => {
  const promises: Promise<void>[] = [];

  if (!dropdownDataLoaded.value.klasifikasi) {
    promises.push(
      fetchKlasifikasi().then(() => {
        dropdownDataLoaded.value.klasifikasi = true;
      })
    );
  }

  if (!dropdownDataLoaded.value.jenisNaskah) {
    promises.push(
      fetchJenisNaskah().then(() => {
        dropdownDataLoaded.value.jenisNaskah = true;
      })
    );
  }

  if (!dropdownDataLoaded.value.verifikator) {
    promises.push(
      fetchVerifikator().then(() => {
        dropdownDataLoaded.value.verifikator = true;
      })
    );
  }

  if (promises.length > 0) {
    await Promise.all(promises);
    console.log('✅ Dropdown data loaded');
  }
};

onMounted(() => {
  // ✅ HANYA FETCH DOCUMENTS SAAT LOAD
  loadDocuments();
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('click', handleDropdownClickOutside);
  document.addEventListener('click', handleKlasifikasiDropdownClickOutside);
  document.addEventListener('click', handleJenisNaskahDropdownClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('click', handleDropdownClickOutside);
  document.removeEventListener('click', handleKlasifikasiDropdownClickOutside);
  document.removeEventListener('click', handleJenisNaskahDropdownClickOutside);
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  if (pdfUrl.value && !pdfUrl.value.startsWith('http')) {
    URL.revokeObjectURL(pdfUrl.value);
  }
});

const filteredVerifikatorList = computed(() => {
  if (!signerSearchQuery.value) return verifikatorList.value;

  const q = signerSearchQuery.value.toLowerCase();

  return verifikatorList.value.filter(
    (v) =>
      v.jabatan?.toLowerCase().includes(q) ||
      v.nama?.toLowerCase().includes(q) ||
      v.lokasi?.toLowerCase().includes(q)
  );
});

const filteredKlasifikasiList = computed(() => {
  if (!klasifikasiSearchQuery.value) return klasifikasiList.value;

  const q = klasifikasiSearchQuery.value.toLowerCase();

  return klasifikasiList.value.filter(
    (k) => k.klasifikasi?.toLowerCase().includes(q) || k.klasifikasi_text?.toLowerCase().includes(q)
  );
});

const filteredJenisNaskahList = computed(() => {
  if (!jenisNaskahSearchQuery.value) return jenisNaskahList.value;

  const q = jenisNaskahSearchQuery.value.toLowerCase();

  return jenisNaskahList.value.filter(
    (j) => j.jenis?.toLowerCase().includes(q) || j.jenis_text?.toLowerCase().includes(q)
  );
});

const loadDocuments = async () => {
  await fetchDocuments({
    page: currentPage.value,
    limit: limit.value,
    search: search.value,
    status: statusFilter.value,
    sortBy: sortKey.value,
    sortOrder: sortOrder.value
  });
};

watch(search, () => {
  loadDocuments();
});

const handleSearch = () => {
  currentPage.value = 1;
};

const selectFilterStatus = (item) => {
  statusFilter.value = item.value;
  openFilterStatus.value = false;
  currentPage.value = 1;
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('[data-custom-dropdown]')) {
    openFilterStatus.value = false;
  }
};

const handleDropdownClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showSignerDropdown.value = false;
  }
};

const handleKlasifikasiDropdownClickOutside = (e: MouseEvent) => {
  if (klasifikasiDropdownRef.value && !klasifikasiDropdownRef.value.contains(e.target as Node)) {
    showKlasifikasiDropdown.value = false;
  }
};

const handleJenisNaskahDropdownClickOutside = (e: MouseEvent) => {
  if (jenisNaskahDropdownRef.value && !jenisNaskahDropdownRef.value.contains(e.target as Node)) {
    showJenisNaskahDropdown.value = false;
  }
};

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';

  const localString = dateString.replace('Z', '').replace('+00:00', '');
  const date = new Date(localString);

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusClass = (status: string) => {
  const statusMap = {
    on_progress: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
    completed: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
  };
  return statusMap[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
};

const getStatusLabel = (status: string) => {
  const statusMap = {
    on_progress: 'Diproses',
    completed: 'Selesai',
    rejected: 'Ditolak',
    draft: 'Draft'
  };
  return statusMap[status] || status;
};

const getSignerStatusClass = (status: string) => {
  const statusMap = {
    waiting: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300',
    pending: 'bg-gray-200 dark:bg-gray-300 text-gray-600 dark:text-white-300',
    signed: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
  };
  return statusMap[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
};

const getSignerStatusLabel = (status: string) => {
  const statusMap = {
    waiting: 'Menunggu',
    pending: 'Pending',
    signed: 'Sudah TTD',
    rejected: 'Ditolak'
  };
  return statusMap[status] || status;
};

const getKlasifikasiText = (kode: string, text: string | null) => {
  if (text) return text;

  const klasifikasi = klasifikasiList.value.find((k) => k.klasifikasi === kode);
  if (klasifikasi) {
    return `${klasifikasi.klasifikasi} - ${klasifikasi.klasifikasi_text}`;
  }

  return kode || '-';
};

const getSelectedKlasifikasiLabel = () => {
  if (!addForm.value.klasifikasi) return '';

  const selected = klasifikasiList.value.find((k) => k.klasifikasi === addForm.value.klasifikasi);

  return selected
    ? `${selected.klasifikasi} - ${selected.klasifikasi_text}`
    : addForm.value.klasifikasi;
};

const getSelectedJenisNaskahLabel = () => {
  if (!addForm.value.jenisNaskah) return '';

  const selected = jenisNaskahList.value.find((j) => j.jenis === addForm.value.jenisNaskah);

  return selected ? `${selected.jenis} - ${selected.jenis_text}` : addForm.value.jenisNaskah;
};

const toggleKlasifikasiDropdown = async () => {
  showKlasifikasiDropdown.value = !showKlasifikasiDropdown.value;
  if (showKlasifikasiDropdown.value) {
    klasifikasiSearchQuery.value = '';
    // ✅ LAZY LOAD: Fetch klasifikasi saat dropdown dibuka
    if (!dropdownDataLoaded.value.klasifikasi) {
      await fetchKlasifikasi();
      dropdownDataLoaded.value.klasifikasi = true;
    }
  }
};

const toggleJenisNaskahDropdown = async () => {
  showJenisNaskahDropdown.value = !showJenisNaskahDropdown.value;
  if (showJenisNaskahDropdown.value) {
    jenisNaskahSearchQuery.value = '';
    // ✅ LAZY LOAD: Fetch jenis naskah saat dropdown dibuka
    if (!dropdownDataLoaded.value.jenisNaskah) {
      await fetchJenisNaskah();
      dropdownDataLoaded.value.jenisNaskah = true;
    }
  }
};

const selectKlasifikasi = async (klasifikasi: any) => {
  addForm.value.klasifikasi = klasifikasi.klasifikasi;
  formErrors.value.klasifikasi = false;
  showKlasifikasiDropdown.value = false;
  klasifikasiSearchQuery.value = '';

  // Trigger klasifikasi change handler — toast error sudah dihandle di fetchKlasifikasiDetail
  await fetchKlasifikasiDetail(klasifikasi.id);
  selectedKlasifikasiDetail.value = klasifikasiDetail.value;
};

const selectJenisNaskah = (jenisNaskah: any) => {
  addForm.value.jenisNaskah = jenisNaskah.jenis;
  formErrors.value.jenisNaskah = false;
  showJenisNaskahDropdown.value = false;
  jenisNaskahSearchQuery.value = '';
};

const onKlasifikasiChange = async () => {
  if (addForm.value.klasifikasi) {
    const selected = klasifikasiList.value.find((k) => k.klasifikasi === addForm.value.klasifikasi);
    if (selected) {
      // Toast error sudah dihandle di fetchKlasifikasiDetail
      await fetchKlasifikasiDetail(selected.id);
      selectedKlasifikasiDetail.value = klasifikasiDetail.value;
    }
  } else {
    selectedKlasifikasiDetail.value = null;
  }
};

const toggleSignerDropdown = async () => {
  showSignerDropdown.value = !showSignerDropdown.value;
  if (showSignerDropdown.value) {
    signerSearchQuery.value = '';
    // ✅ LAZY LOAD: Fetch verifikator saat dropdown dibuka
    if (!dropdownDataLoaded.value.verifikator) {
      await fetchVerifikator();
      dropdownDataLoaded.value.verifikator = true;
    }
  }
};

const selectSigner = (verifikator: Verifikator) => {
  const exists = addForm.value.selectedSigners.findIndex((s) => s.persnum === verifikator.persnum);
  formErrors.value.signers = false;
  if (exists === -1) {
    addForm.value.selectedSigners.push(verifikator);
    showToastSignerAdded(verifikator.nama);
  }

  showSignerDropdown.value = false;
  signerSearchQuery.value = '';
};

const removeSelectedSigner = (index: number) => {
  const signer = addForm.value.selectedSigners[index];
  addForm.value.selectedSigners.splice(index, 1);
  showToastSignerRemoved(signer.nama);
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToastFileTooLarge();
      return;
    }

    addForm.value.fileName = file.name;
    addForm.value.file = file;
    formErrors.value.file = false;
    // Create preview URL
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = URL.createObjectURL(file);

    showToastFileSelected(file.name);
  }
};

// ✅ LAZY LOAD: Fetch dropdown data saat modal add dibuka
const openAddModal = async () => {
  isEditMode.value = false;
  editingId.value = null;
  resetForm();

  // Fetch dropdown data sebelum membuka modal
  await ensureDropdownData();

  openAdd.value = true;
};

// ✅ LAZY LOAD: Fetch dropdown data saat modal edit dibuka
const openEditModal = async (id: string) => {
  isEditMode.value = true;
  editingId.value = id;
  resetForm();
  // Fetch dropdown data terlebih dahulu
  await ensureDropdownData();

  // fetchDocumentDetail — toast error sudah dihandle di composable
  const doc = await fetchDocumentDetail(id);
  if (doc) {
    const mappedSigners: Verifikator[] = [];

    if (doc.signers && doc.signers.length > 0) {
      for (const s of doc.signers) {
        const verifikator = verifikatorList.value.find((v) => v.persnum === Number(s.persnum));

        if (verifikator) {
          mappedSigners.push(verifikator);
        } else {
          mappedSigners.push({
            positionId: Number(s.positionId) || 0,
            persnum: Number(s.persnum) || 0,
            nama: s.nama || '',
            jabatan: s.jabatan || '',
            lokasi: s.lokasi || '',
            areaText: '',
            companyText: ''
          });
        }
      }
    }

    addForm.value = {
      tanggal: doc.tanggalDokumen.split('T')[0],
      klasifikasi: doc.klasifikasi,
      jenisNaskah: doc.jenisNaskah,
      nomorDokumen: doc.nomorDokumen,
      perihal: doc.perihal,
      fileName: doc.fileName || '',
      file: null,
      visibleSign: Boolean(doc.visibleSign),
      signers: [],
      selectedSigners: mappedSigners
    };

    // Load klasifikasi detail — toast error sudah dihandle di composable
    if (doc.klasifikasi) {
      const selected = klasifikasiList.value.find((k) => k.klasifikasi === doc.klasifikasi);
      if (selected) {
        await fetchKlasifikasiDetail(selected.id);
        selectedKlasifikasiDetail.value = klasifikasiDetail.value;
      }
    }

    openAdd.value = true;
  }
};

const openDetailModal = async (id: string) => {
  loadingDetail.value = true;

  try {
    // Ensure klasifikasi list is loaded
    if (klasifikasiList.value.length === 0) {
      await fetchKlasifikasi();
      dropdownDataLoaded.value.klasifikasi = true;
    }

    // fetchDocumentDetail — toast error sudah dihandle di composable
    const res = await fetchDocumentDetail(id);
    if (res) {
      // Load klasifikasi detail if klasifikasiText is null
      if (!res.klasifikasiText && res.klasifikasi) {
        const klasifikasi = klasifikasiList.value.find((k) => k.klasifikasi === res.klasifikasi);

        if (klasifikasi) {
          if (documentDetail.value) {
            documentDetail.value.klasifikasiText = `${klasifikasi.klasifikasi} - ${klasifikasi.klasifikasi_text}`;
          }
        } else {
          if (documentDetail.value) {
            documentDetail.value.klasifikasiText = res.klasifikasi;
          }
        }
      }
      openDetail.value = true;
    }
  } catch (err: any) {
    console.error('❌ Error openDetailModal:', err);
  }
};

// FIXED: View document from detail modal - closes modal and opens slideover
const viewDocumentFromDetail = async () => {
  if (!documentDetail.value) return;

  // Use fileUrl from API response (this is the correct field name)
  const url = documentDetail.value.fileUrl;

  if (!url) {
    showToastFileNotAvailable();
    return;
  }

  // Set return modal
  returnToModal.value = 'detail';

  // IMPORTANT: Close modal detail first
  openDetail.value = false;

  // Reset preview state
  isOpenPreview.value = false;
  if (pdfUrl.value && !pdfUrl.value.startsWith('http')) {
    URL.revokeObjectURL(pdfUrl.value);
  }
  pdfUrl.value = null;

  try {
    // Directly use the signed URL from API
    pdfUrl.value = url;
    isOpenPreview.value = true;
  } catch (err) {
    showToastGagalPreview();
  }
};

const closeModal = () => {
  openAdd.value = false;
  resetForm();
};

const resetForm = () => {
  addForm.value = {
    tanggal: '',
    klasifikasi: '',
    jenisNaskah: '',
    nomorDokumen: '',
    perihal: '',
    fileName: '',
    file: null,
    visibleSign: false,
    signers: [],
    selectedSigners: []
  };
  formErrors.value = {
    tanggal: false,
    klasifikasi: false,
    jenisNaskah: false,
    nomorDokumen: false,
    perihal: false,
    file: false,
    signers: false
  };
  selectedKlasifikasiDetail.value = null;
  showSignerDropdown.value = false;
  showKlasifikasiDropdown.value = false;
  showJenisNaskahDropdown.value = false;
  signerSearchQuery.value = '';
  klasifikasiSearchQuery.value = '';
  jenisNaskahSearchQuery.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
};

// FIXED: View document from table - opens slideover directly
const viewDocument = async (doc: any) => {
  // Use filePreviewUrl from document in table
  const url = doc.filePreviewUrl;

  if (!url) {
    showToastFileNotAvailable();
    return;
  }

  // No return modal (opened from table, not from modal)
  returnToModal.value = null;

  // Reset preview state
  isOpenPreview.value = false;
  if (pdfUrl.value && !pdfUrl.value.startsWith('http')) {
    URL.revokeObjectURL(pdfUrl.value);
  }
  pdfUrl.value = null;

  try {
    // Directly use the signed URL from API
    pdfUrl.value = url;
    isOpenPreview.value = true;
  } catch (err) {
    showToastGagalPreview();
  }
};

// FIXED: Preview file from form modal - closes modal and opens slideover
const previewFileInModal = async () => {
  // Set return modal
  returnToModal.value = 'form';

  // IMPORTANT: Close modal first
  openAdd.value = false;

  if (previewUrl.value) {
    // For newly uploaded file
    pdfUrl.value = previewUrl.value;
    isOpenPreview.value = true;
  } else if (isEditMode.value && documentDetail.value) {
    // For existing file in edit mode - use fileUrl
    const url = documentDetail.value.fileUrl;
    if (url) {
      pdfUrl.value = url;
      isOpenPreview.value = true;
    }
  }
};

const saveDokumen = async () => {
  formErrors.value = {
    tanggal: false,
    klasifikasi: false,
    jenisNaskah: false,
    nomorDokumen: false,
    perihal: false,
    file: false,
    signers: false
  };

  let hasError = false;
  if (!addForm.value.tanggal) {
    formErrors.value.tanggal = true;
    hasError = true;
  }
  if (!addForm.value.klasifikasi) {
    formErrors.value.klasifikasi = true;
    hasError = true;
  }
  if (!addForm.value.jenisNaskah) {
    formErrors.value.jenisNaskah = true;
    hasError = true;
  }
  if (!addForm.value.nomorDokumen) {
    formErrors.value.nomorDokumen = true;
    hasError = true;
  }
  if (!addForm.value.perihal) {
    formErrors.value.perihal = true;
    hasError = true;
  }
  if (!isEditMode.value && !addForm.value.file) {
    formErrors.value.file = true;
    hasError = true;
  }
  if (addForm.value.selectedSigners.length === 0) {
    formErrors.value.signers = true;
    hasError = true;
  }

  if (hasError) {
    showToastValidasiForm('Mohon lengkapi semua field yang wajib diisi');
    return;
  }

  try {
    const signersPayload = addForm.value.selectedSigners.map((s, idx) => ({
      urutan: idx + 1,
      persnum: s.persnum
    }));

    if (isEditMode.value && editingId.value) {
      const payload: any = {
        tanggalDokumen: addForm.value.tanggal,
        klasifikasi: addForm.value.klasifikasi,
        jenisNaskah: addForm.value.jenisNaskah,
        nomorDokumen: addForm.value.nomorDokumen,
        perihal: addForm.value.perihal,
        visibleSign: addForm.value.visibleSign,
        signers: signersPayload
      };
      if (addForm.value.file) payload.file = addForm.value.file;
      await updateDocument(editingId.value, payload);
      showToastDokumenUpdated();
    } else {
      if (!addForm.value.file) {
        formErrors.value.file = true;
        showToastValidasiForm('File harus diupload untuk dokumen baru');
        return;
      }
      const payload = {
        tanggalDokumen: addForm.value.tanggal,
        klasifikasi: addForm.value.klasifikasi,
        jenisNaskah: addForm.value.jenisNaskah,
        nomorDokumen: addForm.value.nomorDokumen,
        perihal: addForm.value.perihal,
        file: addForm.value.file,
        visibleSign: addForm.value.visibleSign,
        signers: signersPayload
      };
      await createDocument(payload);
      showToastDokumenCreated();
    }
    closeModal();
    await loadDocuments();
  } catch (err: any) {
    console.error('❌ Save error:', err);
  }
};

watch(isOpenPreview, (open) => {
  if (!open) {
    // When slideover closes
    if (pdfUrl.value && !pdfUrl.value.startsWith('http')) {
      URL.revokeObjectURL(pdfUrl.value);
    }
    pdfUrl.value = null;

    // Reopen the modal that was previously open
    if (returnToModal.value === 'detail') {
      openDetail.value = true;
      returnToModal.value = null;
    } else if (returnToModal.value === 'form') {
      openAdd.value = true;
      returnToModal.value = null;
    }
  }
});
</script>
<style scoped>
/* Animasi dropdown filter — sama dengan halaman Delegasi */
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

[data-custom-dropdown] button:focus {
  outline: none;
}
</style>
