<template>
  <div class="min-h-screen pt-5 bg-gray-50 dark:bg-gray-900">
    <EmptyState
      v-if="!canViewMaster"
      icon="i-lucide-lock"
      title="Akses Ditolak"
      description="Anda tidak punya izin melihat master data. Hubungi administrator."
    />
    <div v-else class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('ar_title') }}
          </h1>

          <!-- Breadcrumb -->
          <div class="mb-5">
            <nav class="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <NuxtLink
                to="/beranda"
                class="text-gray-500 dark:text-gray-400 font-medium hover:text-primary dark:hover:text-primary-400 transition-colors text-xs"
              >
                {{ t('beranda') }}
              </NuxtLink>
              <span class="mx-1.5 text-gray-400 dark:text-gray-600 text-xs">/</span>
              <NuxtLink
                to="/master/perusahaan"
                class="text-gray-500 dark:text-gray-400 font-medium hover:text-primary dark:hover:text-primary-400 transition-colors text-xs"
              >
                {{ t('mp_title') }}
              </NuxtLink>
              <span class="mx-1.5 text-gray-400 dark:text-gray-600 text-xs">/</span>
              <NuxtLink
                :to="`/master/perusahaan/${route.params.kode}/struktur`"
                class="text-gray-500 dark:text-gray-400 font-medium hover:text-primary dark:hover:text-primary-400 transition-colors text-xs"
              >
                {{ t('ar_breadcrumb_struktur') }}
              </NuxtLink>
              <span class="mx-1.5 text-gray-400 dark:text-gray-600 text-xs">/</span>
              <span class="text-primary-400 dark:text-primary-300 font-semibold text-xs">
                {{ t('ar_title') }}
              </span>
            </nav>
          </div>

          <!-- Company Info -->
          <div
            class="flex gap-3 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
          >
            <Building2 class="w-4 h-4 text-blue-900 dark:text-blue-300" />
            <p class="text-sm text-blue-900 dark:text-blue-100">
              {{ t('ar_perusahaan_label') }}:
              <span class="font-bold">{{ company?.namaPanjang }}</span>
            </p>
          </div>
        </div>

        <button
          @click="openAddAreaModal"
          class="flex items-center gap-2 bg-primary dark:bg-primary-700 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm transition-all shadow-sm"
        >
          <Plus class="w-4 h-4" />
          {{ activeTab === 'area' ? t('ar_tambah_area') : t('ar_tambah_subarea') }}
        </button>
      </div>

      <!-- Card -->
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl mt-5 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <!-- Tab & Actions -->
        <div
          class="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800"
        >
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <!-- Tabs -->
            <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1.5 gap-2 shrink-0">
              <button
                @click="activeTab = 'area'"
                :class="[
                  'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === 'area'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                ]"
              >
                <MapPin class="w-4 h-4 shrink-0" />
                <span>{{ t('ar_tab_area') }}</span>
              </button>
              <button
                @click="activeTab = 'subArea'"
                :class="[
                  'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === 'subArea'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                ]"
              >
                <Map class="w-4 h-4 shrink-0" />
                <span>{{ t('ar_tab_subarea') }}</span>
              </button>
            </div>

            <!-- Rows per page, Search & Export -->
            <div class="flex items-center gap-2 flex-1 max-w-xl">
              <select
                v-model="rowsPerPage"
                class="h-8 border text-xs border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-2.5 shrink-0"
              >
                <option v-for="n in rowsChoices" :key="n" :value="n">
                  {{ n }}
                </option>
              </select>

              <div class="relative flex-1 min-w-40">
                <Search
                  class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                  v-model="searchQuery"
                  :placeholder="t('ar_cari_placeholder')"
                  class="w-full pl-9 pr-4 py-1.5 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <!-- Export -->
              <button
                @click="onExport"
                class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap shrink-0"
              >
                Export
              </button>
            </div>
          </div>
        </div>

        <!-- AREA TABLE -->
        <div v-if="activeTab === 'area'" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-primary dark:bg-primary-700 text-white">
                <th class="px-6 py-4 text-left text-sm font-semibold w-12"></th>
                <th class="px-0 py-4 text-left text-sm font-semibold">
                  {{ t('ar_col_kode') }}
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  {{ t('ar_col_nama') }}
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  {{ t('ar_col_alamat') }}
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  {{ t('ar_col_tgl_mulai') }}
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  {{ t('ar_col_tgl_berakhir') }}
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  {{ t('ar_col_sub_areas') }}
                </th>
                <th class="px-6 py-4 text-center text-sm font-semibold">
                  {{ t('ar_col_aksi') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-if="filteredAreas.length === 0">
                <tr>
                  <td
                    colspan="8"
                    class="text-center py-10 text-gray-400 dark:text-gray-500 text-sm"
                  >
                    Tidak ada data ditemukan
                  </td>
                </tr>
              </template>
              <template v-else v-for="(area, idx) in paginatedAreas" :key="area.kode">
                <tr
                  :class="[
                    'border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors',
                    idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
                  ]"
                >
                  <td class="px-2 py-4">
                    <button
                      @click="toggleAreaExpand(area.kode)"
                      class="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                    >
                      <ChevronDown
                        v-if="expandedAreas[area.kode]"
                        class="w-5 h-5 text-blue-600 dark:text-blue-400"
                      />
                      <ChevronRight v-else class="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </button>
                  </td>
                  <!-- Kode -->
                  <td class="px-1 py-3">
                    <span
                      class="flex text-nowrap items-center text-sm font-semibold text-gray-900 dark:text-white"
                      v-html="highlightArea(area.kode)"
                    />
                  </td>
                  <!-- Nama -->
                  <td
                    class="px-6 py-4 text-nowrap text-sm font-medium text-gray-900 dark:text-white"
                  >
                    <span v-html="highlightArea(area.nama)" />
                  </td>
                  <!-- Alamat -->
                  <td class="px-6 py-4 text-nowrap text-sm text-gray-700 dark:text-gray-300">
                    <span v-html="highlightArea(area.alamat)" />
                  </td>
                  <!-- Tgl Mulai -->
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <span v-html="highlightArea(formatDateSlash(area.mulai))" />
                  </td>
                  <!-- Tgl Berakhir -->
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <span v-html="highlightArea(formatDateSlash(area.berakhir))" />
                  </td>
                  <!-- Sub Count -->
                  <td class="px-6 py-4">
                    <span
                      class="flex text-nowrap items-center text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {{ area.subCount }}
                      {{ t('ar_tab_subarea').toLowerCase() }}
                    </span>
                  </td>
                  <!-- Aksi -->
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        @click="openEditModal(area)"
                        class="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded-lg transition-colors group"
                      >
                        <Pencil
                          class="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-300"
                        />
                      </button>
                      <button
                        @click="openDeleteConfirm(area)"
                        class="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                      >
                        <Trash2
                          class="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300"
                        />
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Expanded Sub Areas — no highlight in area tab -->
                <tr v-if="expandedAreas[area.kode]">
                  <td colspan="8" class="px-6 py-4 bg-gray-100 dark:bg-gray-900/50">
                    <div class="ml-12">
                      <div class="flex items-center gap-2 mb-3">
                        <Map class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 class="text-sm font-bold text-gray-900 dark:text-white">
                          {{ t('ar_sub_areas_label') }} ({{ getSubAreasForArea(area.kode).length }})
                        </h4>
                      </div>
                      <div class="space-y-2">
                        <div
                          v-for="sub in getSubAreasForArea(area.kode)"
                          :key="sub.kode"
                          class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div class="grid grid-cols-5 gap-4 items-center">
                            <div class="ml-7">
                              <span class="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                {{ t('ar_col_kode') }}
                              </span>
                              <span
                                class="inline-flex items-center px-5 py-2 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
                              >
                                {{ sub.kode }}
                              </span>
                            </div>
                            <div>
                              <span class="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                {{ t('ar_col_nama') }}
                              </span>
                              <span class="text-sm font-semibold text-gray-900 dark:text-white">{{
                                sub.nama
                              }}</span>
                            </div>
                            <div>
                              <span class="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                {{ t('ar_col_alamat') }}
                              </span>
                              <span class="text-sm text-gray-700 dark:text-gray-300">{{
                                sub.alamat
                              }}</span>
                            </div>
                            <div>
                              <span class="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                {{ t('ar_col_tgl_mulai') }}
                              </span>
                              <span class="text-sm text-gray-700 dark:text-gray-300">{{
                                formatDateSlash(sub.mulai)
                              }}</span>
                            </div>
                            <div>
                              <span class="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                {{ t('ar_col_tgl_berakhir') }}
                              </span>
                              <span class="text-sm text-gray-700 dark:text-gray-300">{{
                                formatDateSlash(sub.berakhir)
                              }}</span>
                            </div>
                          </div>
                        </div>
                        <div
                          v-if="getSubAreasForArea(area.kode).length === 0"
                          class="text-xs text-gray-400 dark:text-gray-500 italic py-2"
                        >
                          Tidak ada sub area
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>

          <!-- PAGINATION AREA -->
          <div
            v-if="filteredAreas.length > 0"
            class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div class="text-xs text-gray-600 dark:text-gray-400">
              {{ t('menampilkan') }} {{ paginatedAreas.length }} {{ t('dari') }}
              {{ filteredAreas.length }} {{ t('data') }}
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                :class="[
                  'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                  currentPage === 1
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
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
                {{ t('sebelumnya') }}
              </button>

              <div class="flex items-center gap-1">
                <button
                  v-if="paginationPages[0] > 1"
                  @click="currentPage = 1"
                  class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all"
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
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400'
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
                  class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all"
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
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                ]"
              >
                {{ t('selanjutnya') }}
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

        <!-- SUB AREA TABLE -->
        <div v-if="activeTab === 'subArea'" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-primary dark:bg-primary-700 text-white">
                <th class="px-6 py-4 text-left text-sm font-semibold">{{ t('ar_col_kode') }}</th>
                <th class="px-6 py-4 text-left text-sm font-semibold">{{ t('ar_col_nama') }}</th>
                <th class="px-6 py-4 text-left text-sm font-semibold">{{ t('ar_col_area') }}</th>
                <th class="px-6 py-4 text-left text-sm font-semibold">{{ t('ar_col_alamat') }}</th>
                <th class="px-6 py-4 text-nowrap text-left text-sm font-semibold">
                  {{ t('ar_col_tgl_mulai') }}
                </th>
                <th class="px-6 py-4 text-nowrap text-left text-sm font-semibold">
                  {{ t('ar_col_tgl_berakhir') }}
                </th>
                <th class="px-6 py-4 text-center text-sm font-semibold">{{ t('ar_col_aksi') }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="filteredSubAreas.length === 0">
                <tr>
                  <td
                    colspan="7"
                    class="text-center py-10 text-gray-400 dark:text-gray-500 text-sm"
                  >
                    Tidak ada data ditemukan
                  </td>
                </tr>
              </template>
              <tr
                v-else
                v-for="(sub, idx) in paginatedSubAreas"
                :key="sub.kode"
                :class="[
                  'border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors',
                  idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
                ]"
              >
                <!-- Kode -->
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    <span v-html="highlightSub(sub.kode)" />
                  </span>
                </td>
                <!-- Nama -->
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  <span v-html="highlightSub(sub.nama)" />
                </td>
                <!-- Area -->
                <td class="px-6 py-4">
                  <span
                    class="flex text-nowrap items-center text-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold"
                  >
                    <span v-html="highlightSub(sub.areaName)" />
                  </span>
                </td>
                <!-- Alamat -->
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <span v-html="highlightSub(sub.alamat)" />
                </td>
                <!-- Tgl Mulai -->
                <td class="text-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <span v-html="highlightSub(formatDateSlash(sub.mulai))" />
                </td>
                <!-- Tgl Berakhir -->
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <span v-html="highlightSub(formatDateSlash(sub.berakhir))" />
                </td>
                <!-- Aksi -->
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="openEditModal(sub)"
                      class="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded-lg transition-colors group"
                    >
                      <Pencil
                        class="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-300"
                      />
                    </button>
                    <button
                      @click="openDeleteConfirm(sub)"
                      class="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                    >
                      <Trash2
                        class="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- PAGINATION SUB AREA -->
          <div
            v-if="filteredSubAreas.length > 0"
            class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div class="text-xs text-gray-600 dark:text-gray-400">
              {{ t('menampilkan') }} {{ paginatedSubAreas.length }} {{ t('dari') }}
              {{ filteredSubAreas.length }} {{ t('data') }}
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="currentPageSub = Math.max(1, currentPageSub - 1)"
                :disabled="currentPageSub === 1"
                :class="[
                  'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                  currentPageSub === 1
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
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
                {{ t('sebelumnya') }}
              </button>

              <div class="flex items-center gap-1">
                <button
                  v-if="paginationPagesSub[0] > 1"
                  @click="currentPageSub = 1"
                  class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all"
                >
                  1
                </button>
                <span
                  v-if="paginationPagesSub[0] > 2"
                  class="px-2 text-gray-400 dark:text-gray-500 text-sm"
                  >...</span
                >
                <button
                  v-for="page in paginationPagesSub"
                  :key="page"
                  @click="currentPageSub = page"
                  :class="[
                    'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                    currentPageSub === page
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400'
                  ]"
                >
                  {{ page }}
                </button>
                <span
                  v-if="paginationPagesSub[paginationPagesSub.length - 1] < totalPagesSub - 1"
                  class="px-2 text-gray-400 dark:text-gray-500 text-sm"
                  >...</span
                >
                <button
                  v-if="paginationPagesSub[paginationPagesSub.length - 1] < totalPagesSub"
                  @click="currentPageSub = totalPagesSub"
                  class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all"
                >
                  {{ totalPagesSub }}
                </button>
              </div>

              <button
                @click="currentPageSub = Math.min(totalPagesSub, currentPageSub + 1)"
                :disabled="currentPageSub === totalPagesSub"
                :class="[
                  'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                  currentPageSub === totalPagesSub
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                ]"
              >
                {{ t('selanjutnya') }}
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
      </div>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <Modal v-model="openAddArea" :saving="isSavingArea" size="xl" @save="submitArea">
        <template #title>
          <div class="p-3 ml-2">
            <h3 class="text-xl font-bold dark:text-white">
              {{ modalTitle }}
            </h3>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <!-- Kode -->
          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-300">
              {{ activeTab === 'area' ? t('ar_form_kode_area') : t('ar_form_kode_subarea') }}
              <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formArea.kode"
              type="text"
              :placeholder="t('ar_form_kode_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                formErrors.kode
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.kode = false"
            />
          </div>

          <!-- Nama -->
          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-300">
              {{ activeTab === 'area' ? t('ar_form_nama_area') : t('ar_form_nama_subarea') }}
              <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formArea.nama"
              type="text"
              :placeholder="t('ar_form_nama_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                formErrors.nama
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.nama = false; formArea.nama = formArea.nama.toUpperCase()"
            />
          </div>

          <!-- Area Induk (SubArea only) -->
          <div v-if="activeTab === 'subArea'" class="area-dropdown-container">
            <Heading variant="heading11m" class="text-xs dark:text-gray-300">
              {{ t('ar_form_area_induk') }} <span class="text-red-500">*</span>
            </Heading>

            <div class="relative mt-1">
              <button
                type="button"
                @click="showAreaDropdown = !showAreaDropdown"
                :class="[
                  'w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  formErrors.area ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                ]"
              >
                <span
                  :class="
                    formArea.area
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  "
                >
                  {{ getSelectedAreaText() || t('ar_form_pilih_area') }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>

              <div
                v-if="showAreaDropdown"
                class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
                @click.stop
              >
                <div class="p-2 border-b border-gray-200 dark:border-gray-600">
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    />
                    <input
                      v-model="areaSearchQuery"
                      @input="filterAreasDropdown"
                      :placeholder="t('ar_form_cari_area')"
                      class="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      @click.stop
                    />
                  </div>
                </div>

                <div class="max-h-64 overflow-y-auto">
                  <div
                    v-for="area in filteredAreasForDropdown"
                    :key="area.kode"
                    @click="selectArea(area)"
                    :class="[
                      'px-3 py-2 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors',
                      formArea.area === area.kode
                        ? 'bg-primary-100 dark:bg-primary-900/30 font-medium'
                        : ''
                    ]"
                  >
                    <p class="text-sm text-gray-900 dark:text-white font-medium">{{ area.nama }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ t('ar_col_kode') }}: {{ area.kode }}
                    </p>
                  </div>

                  <div
                    v-if="filteredAreasForDropdown.length === 0"
                    class="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm"
                  >
                    {{ t('ar_form_area_not_found') }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Alamat -->
          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-300">
              {{ t('ar_form_alamat') }} <span class="text-red-500">*</span>
            </Heading>
            <textarea
              v-model="formArea.alamat"
              rows="3"
              :placeholder="t('ar_form_alamat_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                formErrors.alamat
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.alamat = false"
            ></textarea>
          </div>

          <!-- Tanggal -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-300">
                {{ t('ar_form_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="formArea.mulai"
                type="date"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                  formErrors.mulai
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="formErrors.mulai = false"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-300">
                {{ t('ar_form_tgl_berakhir') }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="formArea.berakhir"
                type="date"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                  formErrors.berakhir
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="formErrors.berakhir = false"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Delete Confirm -->
    <ConfirmPopup
      v-model="showDeleteConfirm"
      type="danger"
      :title="t('ar_pop_title')"
      :message="deleteMessage"
      :confirm-text="t('ar_pop_confirm')"
      :cancel-text="t('ar_pop_cancel')"
      :is-loading="isDeleting"
      :require-confirmation="true"
      confirmation-text="KONFIRMASI HAPUS DATA"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Export Column Modal -->
    <Teleport to="body">
      <Modal v-model="showExportModal" size="lg" :hide-default-footer="true">
        <template #title>
          <div class="ml-5 my-3.5">
            <Heading variant="heading8b" class="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
              {{ t('pilih_kolom_export') }}
            </Heading>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sesuaikan kolom data yang akan diekspor ke format Excel (.xlsx)
            </p>
          </div>
        </template>

        <div class="space-y-3.5 py-1">
          <!-- Selection Status Bar & Toggle All -->
          <div class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-750/60 border border-gray-200/80 dark:border-gray-700/80 text-xs">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center justify-center font-semibold px-2.5 py-0.5 rounded-full text-xs transition-colors"
                :class="selectedExportColumns.length > 0
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
              >
                {{ selectedExportColumns.length }} / {{ exportColumns.length }}
              </span>
              <span class="text-gray-600 dark:text-gray-300 font-medium">
                Kolom Terpilih
              </span>
            </div>

            <button
              type="button"
              @click="toggleAllExport"
              class="font-medium px-2.5 py-1 rounded-lg text-xs transition-colors"
              :class="allExportSelected
                ? 'text-primary hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'"
            >
              {{ allExportSelected ? 'Batal Pilih Semua' : t('pilih_semua') }}
            </button>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1 -mr-1">
            <div
              v-for="col in exportColumns"
              :key="col.key"
              @click="toggleColumn(col.key)"
              class="group relative flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-150 select-none"
              :class="selectedExportColumns.includes(col.key)
                ? 'border-primary-500/80 bg-primary-50/60 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100 shadow-sm ring-1 ring-primary-500/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/70 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300'"
            >
              <div class="flex items-center gap-3 min-w-0 w-full">
                <!-- Checkmark Box -->
                <div
                  class="w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 flex-shrink-0"
                  :class="selectedExportColumns.includes(col.key)
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-gray-400'"
                >
                  <Check v-if="selectedExportColumns.includes(col.key)" class="w-3 h-3 stroke-[3]" />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold truncate leading-tight">
                    {{ col.label }}
                  </p>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {{ col.desc }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Notice -->
          <div class="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-1 pt-0.5">
            <span>Format: <span class="font-medium text-gray-700 dark:text-gray-300">Microsoft Excel (.xlsx)</span></span>
            <span>Total: <span class="font-semibold text-gray-700 dark:text-gray-200">{{ activeTab === 'area' ? filteredAreas.length : filteredSubAreas.length }} baris</span></span>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 flex-shrink-0 gap-3 px-5 py-3 mt-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
            <button
              type="button"
              @click="showExportModal = false"
              class="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {{ t('batal') }}
            </button>

            <button
              type="button"
              @click="handleExportConfirm"
              :disabled="selectedExportColumns.length === 0"
              class="flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-lg text-white transition-all shadow-sm"
              :class="selectedExportColumns.length > 0
                ? 'bg-primary hover:bg-primary-700 active:scale-[0.98]'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'"
            >
              Export {{ selectedExportColumns.length > 0 ? `(${selectedExportColumns.length} Kolom)` : '' }}
            </button>
          </div>
        </template>
      </Modal>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Plus,
  MapPin,
  Map,
  Search,
  Pencil,
  Trash2,
  Check
} from 'lucide-vue-next';

definePageMeta({ middleware: 'auth' });

import { useArea } from '~/composables/useArea';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useCompany } from '~/composables/useCompany';
import { useToast } from '#imports';
import { formatDateSlash } from '~/utils/mail-helpers';

const { t, locale } = useI18n();
const route = useRoute();
const companyId = computed(() => route.params.kode as string);

const { hasPermission } = useAuth();

const canViewMaster = computed(() => hasPermission('master-data', 'read-perusahaan-area'));

const {
  getAreasByCompany,
  getSubAreasByCompanyAndArea,
  createAreaByCompany,
  updateAreaByCompany,
  deleteArea,
  getSubAreasByCompany,
  createSubAreaByCompany,
  updateSubAreaByCompany,
  deleteSubArea
} = useArea();

const { getCompanyByCode } = useCompany();
const toast = useToast();

// ─── STATE ───────────────────────────────────
const activeTab = ref<'area' | 'subArea'>('area');
const searchQuery = ref('');
const expandedAreas = ref<Record<string, boolean>>({});
const openAddArea = ref(false);
const showDeleteConfirm = ref(false);
const selectedItem = ref<any>(null);
const isDeleting = ref(false);
const isEditing = ref(false);
const isSavingArea = ref(false);

const showAreaDropdown = ref(false);
const areaSearchQuery = ref('');
const filteredAreasForDropdown = ref<any[]>([]);

const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const currentPage = ref<number>(1);
const currentPageSub = ref<number>(1);

const formArea = ref({
  nama: '',
  kode: '',
  area: '',
  alamat: '',
  mulai: '',
  berakhir: ''
});

const formErrors = ref({
  nama: false,
  kode: false,
  area: false,
  alamat: false,
  mulai: false,
  berakhir: false
});

const company = ref<{ kode: string; namaPanjang: string } | null>(null);
const areas = ref<any[]>([]);
const subAreas = ref<any[]>([]);

// ─── HIGHLIGHT HELPERS ───────────────────────
/**
 * Wraps matching substring in <mark> tag with yellow highlight.
 * Safe: escapes HTML in the value before injecting.
 */
function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Highlight for Area tab columns:
 * Kode, Nama, Alamat, Tanggal Mulai, Tanggal Berakhir
 */
function highlightArea(value: string | number): string {
  const str = String(value ?? '');
  const query = searchQuery.value.trim();
  if (!query) return escapeHtml(str);
  const escaped = escapeHtml(str);
  const escapedQuery = escapeHtml(query);
  // case-insensitive replace, keep original casing
  const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Highlight for Sub Area tab columns:
 * Kode, Nama, Area (areaName), Alamat, Tanggal Mulai, Tanggal Berakhir
 */
function highlightSub(value: string | number): string {
  return highlightArea(value); // same logic, reuse
}

// ─── COMPUTED ────────────────────────────────
const modalTitle = computed(() => {
  if (activeTab.value === 'area') {
    return isEditing.value ? t('ar_modal_edit_area') : t('ar_modal_tambah_area');
  }
  return isEditing.value ? t('ar_modal_edit_subarea') : t('ar_modal_tambah_subarea');
});

const deleteMessage = computed(() => {
  if (!selectedItem.value) return '';
  return locale.value === 'id'
    ? `Apakah Anda yakin ingin menghapus ${selectedItem.value.nama}?`
    : `Are you sure you want to delete ${selectedItem.value.nama}?`;
});

// ─── FILTER & PAGINATION ─────────────────────
const filteredAreas = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return areas.value;
  return areas.value.filter(
    (area) =>
      String(area.kode).toLowerCase().includes(query) ||
      String(area.nama).toLowerCase().includes(query) ||
      String(area.alamat).toLowerCase().includes(query) ||
      String(area.mulai).toLowerCase().includes(query) ||
      String(area.berakhir).toLowerCase().includes(query)
  );
});

const filteredSubAreas = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return subAreas.value;
  return subAreas.value.filter(
    (sub) =>
      String(sub.kode).toLowerCase().includes(query) ||
      String(sub.nama).toLowerCase().includes(query) ||
      String(sub.areaName).toLowerCase().includes(query) ||
      String(sub.alamat).toLowerCase().includes(query) ||
      String(sub.mulai).toLowerCase().includes(query) ||
      String(sub.berakhir).toLowerCase().includes(query)
  );
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredAreas.value.length / rowsPerPage.value))
);

const paginatedAreas = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredAreas.value.slice(start, start + rowsPerPage.value);
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

const totalPagesSub = computed(() =>
  Math.max(1, Math.ceil(filteredSubAreas.value.length / rowsPerPage.value))
);

const paginatedSubAreas = computed(() => {
  const start = (currentPageSub.value - 1) * rowsPerPage.value;
  return filteredSubAreas.value.slice(start, start + rowsPerPage.value);
});

const paginationPagesSub = computed(() => {
  const total = totalPagesSub.value;
  const current = currentPageSub.value;
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

// ─── AUTO-EXPAND WHEN SEARCHING IN AREA TAB ──
/**
 * Watch searchQuery: when in area tab and query is non-empty,
 * auto-expand all matched areas so their sub areas are visible.
 * When query is cleared, collapse all auto-expanded rows.
 */
const autoExpandedBySearch = ref<Set<string>>(new Set());

watch([searchQuery, () => activeTab.value], async ([query, tab]) => {
  currentPage.value = 1;
  currentPageSub.value = 1;

  if (tab !== 'area') return;

  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    // Collapse rows that were auto-expanded by search (not manually expanded)
    for (const kode of autoExpandedBySearch.value) {
      expandedAreas.value[kode] = false;
    }
    autoExpandedBySearch.value.clear();
    return;
  }

  // Find matched areas
  const matched = areas.value.filter(
    (area) =>
      String(area.kode).toLowerCase().includes(trimmed) ||
      String(area.nama).toLowerCase().includes(trimmed) ||
      String(area.alamat).toLowerCase().includes(trimmed) ||
      String(area.mulai).toLowerCase().includes(trimmed) ||
      String(area.berakhir).toLowerCase().includes(trimmed)
  );

  // Auto-expand matched areas and fetch their sub areas if needed
  for (const area of matched) {
    if (!expandedAreas.value[area.kode]) {
      expandedAreas.value[area.kode] = true;
      autoExpandedBySearch.value.add(area.kode);
      // Fetch sub areas if not yet loaded
      const alreadyLoaded = subAreas.value.some((s) => s.area === area.kode);
      if (!alreadyLoaded) {
        await fetchSubAreas(area.kode);
      }
    }
  }

  // Collapse previously auto-expanded areas that no longer match
  for (const kode of [...autoExpandedBySearch.value]) {
    const stillMatched = matched.some((a) => a.kode === kode);
    if (!stillMatched) {
      expandedAreas.value[kode] = false;
      autoExpandedBySearch.value.delete(kode);
    }
  }
});

watch(activeTab, async (tab) => {
  if (tab === 'subArea') {
    subAreas.value = [];
    await fetchAllSubAreas();
  }
  currentPage.value = 1;
  currentPageSub.value = 1;
});

watch(rowsPerPage, () => {
  currentPage.value = 1;
  currentPageSub.value = 1;
});

// ─── CLICK OUTSIDE DROPDOWN ──────────────────
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (showAreaDropdown.value && !target.closest('.area-dropdown-container')) {
    showAreaDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  fetchCompany();
  fetchAreas();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// ─── FETCH ───────────────────────────────────
const fetchAreas = async () => {
  try {
    const res = await getAreasByCompany(companyId.value);
    areas.value = res.data.map((item: any) => ({
      id: item.id,
      kode: item.area,
      nama: item.shortText,
      alamat: item.longText,
      mulai: item.startDate,
      berakhir: item.endDate,
      subCount: item.subAreasCount ?? 0
    }));
    filteredAreasForDropdown.value = areas.value;
  } catch (error) {
    console.error('Gagal mengambil area', error);
  }
};

const fetchSubAreas = async (areaCode: string) => {
  try {
    const res = await getSubAreasByCompanyAndArea(companyId.value, areaCode);
    const mapped = res.data.map((item: any) => ({
      id: item.id,
      kode: String(item.sub_area),
      nama: item.shortText,
      area: item.area,
      areaName: areas.value.find((a) => a.kode === item.area)?.nama || '',
      alamat: item.longText,
      mulai: item.startDate,
      berakhir: item.endDate
    }));
    subAreas.value = [...subAreas.value.filter((s) => s.area !== areaCode), ...mapped];
  } catch (error) {
    console.error('Gagal mengambil sub area', error);
  }
};

const fetchAllSubAreas = async () => {
  try {
    const res = await getSubAreasByCompany(companyId.value);
    subAreas.value = res.data.map((item: any) => ({
      id: item.id,
      kode: String(item.sub_area),
      nama: item.shortText,
      area: item.area,
      areaName: areas.value.find((a) => a.kode === item.area)?.nama || '',
      alamat: item.longText,
      mulai: item.startDate,
      berakhir: item.endDate
    }));
  } catch (error) {
    console.error('Gagal mengambil sub area', error);
  }
};

const fetchCompany = async () => {
  try {
    const data = await getCompanyByCode(companyId.value);
    if (!data) return;
    company.value = { kode: String(data.company), namaPanjang: data.longText };
  } catch (error) {
    console.error('Gagal mengambil data company', error);
  }
};

// ─── DROPDOWN AREA (inside modal) ────────────
const getSelectedAreaText = () => {
  if (!formArea.value.area) return '';
  const selected = areas.value.find((a) => a.kode === formArea.value.area);
  return selected ? `${selected.nama} (${selected.kode})` : '';
};

const filterAreasDropdown = () => {
  const query = areaSearchQuery.value.toLowerCase().trim();
  if (!query) {
    filteredAreasForDropdown.value = areas.value;
    return;
  }
  filteredAreasForDropdown.value = areas.value.filter(
    (area) =>
      String(area.kode).toLowerCase().includes(query) ||
      (area.nama || '').toLowerCase().includes(query)
  );
};

const selectArea = (area: any) => {
  formArea.value.area = area.kode;
  showAreaDropdown.value = false;
  areaSearchQuery.value = '';
  formErrors.value.area = false;
};

// ─── EXPAND ──────────────────────────────────
const toggleAreaExpand = async (areaCode: string) => {
  expandedAreas.value[areaCode] = !expandedAreas.value[areaCode];
  if (expandedAreas.value[areaCode]) {
    await fetchSubAreas(areaCode);
  }
  // If manually expanded, remove from auto-expand tracking so collapse on clear doesn't affect it
  if (expandedAreas.value[areaCode]) {
    autoExpandedBySearch.value.delete(areaCode);
  }
};

const getSubAreasForArea = (areaKode: string) => {
  return subAreas.value.filter((sub) => sub.area === areaKode);
};

// ─── MODAL OPEN ───────────────────────────────
// Generate next area code (A000, A001, ... A999, A1000, ...) per company.
const generateNextAreaCode = () => {
  let max = -1;
  for (const a of areas.value) {
    const m = String(a.kode || '').match(/^A(\d+)$/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return 'A' + String(max + 1).padStart(3, '0');
};

// Generate next sub area code (1001, 1002, ...) per company.
const generateNextSubAreaCode = () => {
  let max = 1000;
  for (const s of subAreas.value) {
    const n = parseInt(String(s.kode), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return String(max + 1);
};

const openAddAreaModal = () => {
  isEditing.value = false;
  formArea.value = {
    nama: '',
    kode:
      activeTab.value === 'area'
        ? generateNextAreaCode()
        : generateNextSubAreaCode(),
    area: '',
    alamat: '',
    mulai: new Date().toISOString().slice(0, 10),
    berakhir: '9999-12-31'
  };
  formErrors.value = {
    nama: false,
    kode: false,
    area: false,
    alamat: false,
    mulai: false,
    berakhir: false
  };
  areaSearchQuery.value = '';
  openAddArea.value = true;
};

const openEditModal = (item: any) => {
  isEditing.value = true;
  selectedItem.value = item;
  formArea.value = {
    nama: item.nama,
    kode: item.kode,
    area: item.area ?? '',
    alamat: item.alamat,
    mulai: item.mulai,
    berakhir: item.berakhir
  };
  formErrors.value = {
    nama: false,
    kode: false,
    area: false,
    alamat: false,
    mulai: false,
    berakhir: false
  };
  areaSearchQuery.value = '';
  openAddArea.value = true;
};

const openDeleteConfirm = (item: any) => {
  selectedItem.value = item;
  showDeleteConfirm.value = true;
};

// ─── VALIDATION ───────────────────────────────
const buildRequiredFieldsMessage = (fields: string[]) => {
  if (fields.length === 0) return '';
  return `${fields.join(', ')} wajib diisi`;
};

const isEndDateInvalid = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return end <= start;
};

const formatDateWarningMessage = () => {
  return locale.value === 'id'
    ? 'Tanggal berakhir tidak boleh sama dengan atau lebih awal dari tanggal mulai'
    : 'The end date cannot be the same as or earlier than the start date.';
};

const validateAreaForm = (): boolean => {
  const emptyFields: string[] = [];

  formErrors.value = {
    nama: false,
    kode: false,
    area: false,
    alamat: false,
    mulai: false,
    berakhir: false
  };

  formErrors.value.nama = !formArea.value.nama.trim();
  formErrors.value.kode = !formArea.value.kode.trim();
  formErrors.value.alamat = !formArea.value.alamat.trim();
  formErrors.value.mulai = !formArea.value.mulai;
  formErrors.value.berakhir = !formArea.value.berakhir;

  if (activeTab.value === 'subArea') {
    formErrors.value.area = !formArea.value.area;
  }

  if (formErrors.value.nama)
    emptyFields.push(activeTab.value === 'area' ? 'Nama Area' : 'Nama Sub Area');
  if (formErrors.value.kode)
    emptyFields.push(activeTab.value === 'area' ? 'Kode Area' : 'Kode Sub Area');
  if (formErrors.value.area && activeTab.value === 'subArea') emptyFields.push('Area Induk');
  if (formErrors.value.alamat) emptyFields.push('Alamat');
  if (formErrors.value.mulai) emptyFields.push('Tanggal Mulai');
  if (formErrors.value.berakhir) emptyFields.push('Tanggal Berakhir');

  if (emptyFields.length > 0) {
    showToast(t('gagal'), buildRequiredFieldsMessage(emptyFields), 'error');
    return false;
  }

  if (isEndDateInvalid(formArea.value.mulai, formArea.value.berakhir)) {
    formErrors.value.berakhir = true;
    showToast(t('gagal'), formatDateWarningMessage(), 'error');
    return false;
  }

  return true;
};

// ─── SUBMIT ───────────────────────────────────
const submitArea = async () => {
  if (isSavingArea.value) return;

  if (!validateAreaForm()) return;

  if (activeTab.value === 'subArea' && isNaN(Number(formArea.value.kode))) {
    toast.add({
      title: t('gagal'),
      description: t('ar_val_kode_angka'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return;
  }

  if (activeTab.value === 'area') {
    const isDuplicate = areas.value.some(
      (item) =>
        item.kode === formArea.value.kode &&
        (!isEditing.value || item.id !== selectedItem.value?.id)
    );
    if (isDuplicate) {
      toast.add({
        title: t('gagal'),
        description:
          locale.value === 'id' ? 'Kode area sudah digunakan' : 'Area code already in use',
        color: 'error',
        icon: 'i-lucide-x-circle'
      });
      return;
    }
  }

  if (activeTab.value === 'subArea') {
    const isDuplicate = subAreas.value.some(
      (item) =>
        item.kode === formArea.value.kode &&
        item.area === formArea.value.area &&
        (!isEditing.value || item.id !== selectedItem.value?.id)
    );
    if (isDuplicate) {
      toast.add({
        title: t('gagal'),
        description:
          locale.value === 'id' ? 'Kode sub area sudah digunakan' : 'Sub area code already in use',
        color: 'error',
        icon: 'i-lucide-x-circle'
      });
      return;
    }
  }

  isSavingArea.value = true;

  try {
    if (activeTab.value === 'area') {
      const payload = {
        area: formArea.value.kode,
        shortText: formArea.value.nama.trim().toUpperCase(),
        longText: formArea.value.alamat,
        startDate: formArea.value.mulai,
        endDate: formArea.value.berakhir
      };
      if (!isEditing.value) {
        await createAreaByCompany(companyId.value, payload);
        showToast(t('berhasil'), t('ar_success_add_area'), 'success');
      } else {
        await updateAreaByCompany(companyId.value, selectedItem.value.id, payload);
        showToast(t('berhasil'), t('ar_success_edit_area'), 'success');
      }
      await fetchAreas();
    }

    if (activeTab.value === 'subArea') {
      const payload = {
        area: formArea.value.area,
        sub_area: Number(formArea.value.kode),
        shortText: formArea.value.nama.trim().toUpperCase(),
        longText: formArea.value.alamat,
        startDate: formArea.value.mulai,
        endDate: formArea.value.berakhir
      };
      if (!isEditing.value) {
        await createSubAreaByCompany(companyId.value, payload);
        showToast(t('berhasil'), t('ar_success_add_subarea'), 'success');
      } else {
        await updateSubAreaByCompany(companyId.value, selectedItem.value.id, payload);
        showToast(t('berhasil'), t('ar_success_edit_subarea'), 'success');
      }
      await fetchAllSubAreas();
    }

    openAddArea.value = false;
    isEditing.value = false;
    selectedItem.value = null;
    formArea.value = { nama: '', kode: '', area: '', alamat: '', mulai: '', berakhir: '' };
    formErrors.value = {
      nama: false,
      kode: false,
      area: false,
      alamat: false,
      mulai: false,
      berakhir: false
    };
  } catch (error) {
    console.error('Gagal menyimpan data', error);
    showToast(t('gagal'), t('ar_err_save'), 'error');
  } finally {
    isSavingArea.value = false;
  }
};

// ─── DELETE ───────────────────────────────────
const handleDelete = async () => {
  try {
    isDeleting.value = true;

    if (activeTab.value === 'area') {
      await deleteArea(selectedItem.value.id);
      await fetchAreas();
      showToast(t('berhasil'), t('ar_success_delete_area'), 'success');
    }

    if (activeTab.value === 'subArea') {
      await deleteSubArea(selectedItem.value.id);
      await fetchAllSubAreas();
      showToast(t('berhasil'), t('ar_success_delete_subarea'), 'success');
    }

    showDeleteConfirm.value = false;
    selectedItem.value = null;
  } catch (error) {
    console.error('Gagal menghapus data', error);
    showToast(t('gagal'), t('ar_err_delete'), 'error');
  } finally {
    isDeleting.value = false;
  }
};

// ─── TOAST ────────────────────────────────────
const showToast = (
  title: string,
  message: string,
  color: 'success' | 'error' | 'warning' | 'primary' = 'success'
) => {
  toast.add({
    title,
    description: message,
    color,
    icon:
      color === 'success'
        ? 'i-lucide-check-circle'
        : color === 'error'
          ? 'i-lucide-x-circle'
          : 'i-lucide-info'
  });
};

// ─── EXPORT ───────────────────────────────────
const showExportModal = ref(false);
const selectedExportColumns = ref<string[]>([]);

const formatDateDot = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

const exportColumns = computed(() => {
  if (activeTab.value === 'area') {
    return [
      { key: 'No', label: 'No', desc: 'Nomor urut data' },
      { key: 'kode', label: t('ar_col_kode'), desc: 'Kode area' },
      { key: 'nama', label: t('ar_col_nama'), desc: 'Nama area' },
      { key: 'alamat', label: t('ar_col_alamat'), desc: 'Alamat area' },
      { key: 'mulai', label: t('ar_col_tgl_mulai'), desc: 'Tanggal mulai berlaku' },
      { key: 'berakhir', label: t('ar_col_tgl_berakhir'), desc: 'Tanggal berakhir berlaku' },
      { key: 'sub_count', label: t('ar_col_sub_areas'), desc: 'Jumlah sub area' }
    ];
  }
  return [
    { key: 'No', label: 'No', desc: 'Nomor urut data' },
    { key: 'kode', label: t('ar_col_kode'), desc: 'Kode sub area' },
    { key: 'nama', label: t('ar_col_nama'), desc: 'Nama sub area' },
    { key: 'area', label: t('ar_col_area'), desc: 'Nama area induk' },
    { key: 'alamat', label: t('ar_col_alamat'), desc: 'Alamat sub area' },
    { key: 'mulai', label: t('ar_col_tgl_mulai'), desc: 'Tanggal mulai berlaku' },
    { key: 'berakhir', label: t('ar_col_tgl_berakhir'), desc: 'Tanggal berakhir berlaku' }
  ];
});

const allExportSelected = computed(
  () =>
    selectedExportColumns.value.length === exportColumns.value.length &&
    exportColumns.value.length > 0
);

const toggleAllExport = () => {
  if (allExportSelected.value) {
    selectedExportColumns.value = [];
  } else {
    selectedExportColumns.value = exportColumns.value.map((c) => c.key);
  }
};

const toggleColumn = (key: string) => {
  const index = selectedExportColumns.value.indexOf(key);
  if (index > -1) {
    selectedExportColumns.value.splice(index, 1);
  } else {
    selectedExportColumns.value.push(key);
  }
};

const onExport = () => {
  const dataLength = activeTab.value === 'area' ? filteredAreas.value.length : filteredSubAreas.value.length;
  if (dataLength === 0) {
    showToast(t('gagal') || 'Info', 'Tidak ada data untuk diekspor.', 'warning');
    return;
  }
  selectedExportColumns.value = exportColumns.value.map((c) => c.key);
  showExportModal.value = true;
};

const handleExportConfirm = () => {
  const selectedKeys = selectedExportColumns.value;
  if (selectedKeys.length === 0) return;

  let data: Record<string, any>[] = [];
  const sheetName = activeTab.value === 'area' ? t('ar_tab_area') : t('ar_tab_subarea');
  const fileName = activeTab.value === 'area'
    ? `area_${companyId.value}_${new Date().toISOString().slice(0, 10)}.xlsx`
    : `sub_area_${companyId.value}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  if (activeTab.value === 'area') {
    data = filteredAreas.value.map((row, idx) => {
      const r: Record<string, any> = {};
      if (selectedKeys.includes('No')) r['No'] = idx + 1;
      if (selectedKeys.includes('kode')) r[t('ar_col_kode')] = row.kode;
      if (selectedKeys.includes('nama')) r[t('ar_col_nama')] = row.nama;
      if (selectedKeys.includes('alamat')) r[t('ar_col_alamat')] = row.alamat;
      if (selectedKeys.includes('mulai')) r[t('ar_col_tgl_mulai')] = formatDateDot(row.mulai);
      if (selectedKeys.includes('berakhir')) r[t('ar_col_tgl_berakhir')] = formatDateDot(row.berakhir);
      if (selectedKeys.includes('sub_count')) r[t('ar_col_sub_areas')] = row.subCount;
      return r;
    });
  } else {
    data = filteredSubAreas.value.map((row, idx) => {
      const r: Record<string, any> = {};
      if (selectedKeys.includes('No')) r['No'] = idx + 1;
      if (selectedKeys.includes('kode')) r[t('ar_col_kode')] = row.kode;
      if (selectedKeys.includes('nama')) r[t('ar_col_nama')] = row.nama;
      if (selectedKeys.includes('area')) r[t('ar_col_area')] = row.areaName;
      if (selectedKeys.includes('alamat')) r[t('ar_col_alamat')] = row.alamat;
      if (selectedKeys.includes('mulai')) r[t('ar_col_tgl_mulai')] = formatDateDot(row.mulai);
      if (selectedKeys.includes('berakhir')) r[t('ar_col_tgl_berakhir')] = formatDateDot(row.berakhir);
      return r;
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, fileName);

  toast.add({
    title: t('berhasil'),
    description: 'Export berhasil.',
    color: 'success',
    icon: 'i-lucide-file-down'
  });
  showExportModal.value = false;
};
</script>

<style scoped>
:deep(mark.search-highlight) {
  background-color: #fef08a; /* yellow-200 */
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}

/* Dark mode highlight */
.dark :deep(mark.search-highlight) {
  background-color: #ca8a04; /* yellow-600 */
  color: #fff;
}
</style>
