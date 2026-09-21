<template>
  <div class="space-y-6 pt-5 dark:bg-gray-900 min-h-screen transition-colors">
    <AccessDenied v-if="!canAccessPage()" />
<div v-else class="min-h-screen">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
        <!-- Left Section - Title & Breadcrumb -->
        <PageHeader :title="t('ka_title')" :items="items" />
        <button
          v-if="hasPermission('master-data', 'create-klasifikasi')"
          @click="openAddModal"
          class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white space-y-6 px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors"
        >
          <Plus class="w-4 h-4" />
          {{ t('nm_button') }}
        </button>
      </div>

      <!-- CARD TABLE -->
      <div
        class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
      >
        <!-- TOOLBAR (TIDAK ikut scroll) -->
        <div
          class="rounded-lg shadow-sm sticky left-0 z-40 bg-white dark:bg-gray-800 flex flex-wrap gap-2 items-center p-3 border-b border-gray-200 dark:border-gray-700 transition-colors"
        >
          <!-- Rows per page (custom dropdown) -->
          <div class="relative">
            <button
              type="button"
              @click="openRowsDropdown = !openRowsDropdown"
              class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
            >
              <span>{{ perPage }}</span>
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
                    perPage = n;
                    openRowsDropdown = false;
                    currentPage = 1;
                  "
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
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

          <!-- Refresh -->
          <button
            @click="fetchKlasifikasi"
            class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition-colors"
            title="Refresh"
          >
            <RotateCcw class="w-4 h-4" />
          </button>

          <!-- Search -->
          <div class="relative flex-1 min-w-40">
            <Search
              class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="search"
              :placeholder="t('ka_cari_placeholder')"
              class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
            />
          </div>

          <!-- Export -->
          <button
            v-if="hasPermission('master-data', 'export-klasifikasi')"
            class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-500 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap"
            @click="onExport"
          >
            Export
          </button>
        </div>

        <!-- TABLE -->
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-primary-400 dark:bg-primary-700 text-white">
              <tr>
                <th
                  @click="toggleSortKlasifikasi"
                  class="px-4 py-3 text-left cursor-pointer select-none flex items-center gap-2"
                >
                  {{ t('ka_kode') }}
                  <ArrowUpDown
                    class="w-4 h-4 transition-transform duration-300"
                    :class="{
                      'rotate-180': sortKlasifikasi === 'desc',
                      'rotate-0': sortKlasifikasi !== 'desc'
                    }"
                  />
                </th>
                <th class="px-4 py-3 text-left">{{ t('ka_nama') }}</th>
                <th class="px-4 py-3 text-left">{{ t('ka_deskripsi') }}</th>
                <th class="px-4 py-3 text-center">{{ t('ka_retensi_aktif') }}</th>
                <th class="px-4 py-3 text-center">{{ t('ka_retensi_inaktif') }}</th>
                <th class="px-4 py-3 text-center">{{ t('ka_penyusutan') }}</th>
                <th class="px-4 py-3 text-center">{{ t('ka_keamanan') }}</th>
                <th class="px-4 py-3 text-center">{{ t('ka_hak_akses') }}</th>
                <th class="px-4 py-3 text-center">{{ t('aksi') }}</th>
              </tr>
            </thead>

            <tbody>
              <!-- LOADING - Skeleton -->
              <tr v-if="loading">
                <td colspan="9" class="px-4 py-6">
                  <div class="space-y-4 animate-pulse">
                    <div
                      v-for="n in skeletonRows"
                      :key="'skeleton-' + n"
                      class="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-700"
                    />
                  </div>
                </td>
              </tr>

              <!-- EMPTY -->
              <tr v-else-if="klasifikasiList.length === 0">
                <td colspan="9" class="py-6 text-center text-gray-500 dark:text-gray-400">
                  {{ t('ka_empty') }}
                </td>
              </tr>

              <!-- ROW -->
              <tr
                v-for="(row, idx) in paginatedKlasifikasi"
                :key="row.id"
                :class="[
                  'border-b border-b-gray-200 dark:border-b-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors',
                  idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
                ]"
              >
                <td class="px-4 py-3 font-semibold">
                  <span
                    class="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs"
                    v-html="highlight(row.klasifikasi, search)"
                  >
                  </span>
                </td>

                <td
                  class="px-4 py-3 text-gray-900 dark:text-white"
                  v-html="highlight(row.klasifikasi_text, search)"
                ></td>

                <td
                  class="px-4 py-3 text-gray-600 dark:text-gray-300"
                >
                  <span
                    class="line-clamp-5"
                    v-html="highlight(row.deskripsi ?? '-', search)"
                  ></span>
                </td>

                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                  {{ row.retensi_aktif_tahun ?? '-' }}
                </td>

                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                  {{ row.retensi_inaktif_tahun ?? '-' }}
                </td>

                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                  {{ row.penyusutan ?? '-' }}
                </td>

                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                  {{ row.keamanan ?? '-' }}
                </td>

                <td class="px-4 py-3 text-center">
                  <span
                    v-if="row.hak_akses"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-700/20 dark:text-red-200"
                  >
                    {{ row.hak_akses }}
                  </span>
                  <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                </td>

                <td class="px-4 py-3">
                  <div class="flex justify-center gap-3">
                    <button
                      v-if="hasPermission('master-data', 'update-klasifikasi')"
                      class="text-yellow-500 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 p-2 rounded-lg transition-colors group"
                      title="Edit"
                      @click="onEdit(row)"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>

                    <button
                      v-if="hasPermission('master-data', 'delete-klasifikasi')"
                      class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group text-red-600 dark:text-red-500"
                      title="Delete"
                      @click="onDelete(row)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div
          v-if="totalItems > 0"
          class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            {{ t('menampilkan') }} {{ paginatedKlasifikasi.length }} {{ t('dari') }}
            {{ totalItems }} {{ t('data') }}
          </div>

          <div class="flex items-center gap-2">
            <!-- BACK -->
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
              {{ t('sebelumnya') }}
            </button>

            <!-- PAGE NUMBERS -->
            <div class="flex items-center gap-1">
              <!-- FIRST -->
              <button
                v-if="paginationPages[0] > 1"
                @click="currentPage = 1"
                class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
              >
                1
              </button>

              <!-- DOTS LEFT -->
              <span
                v-if="paginationPages[0] > 2"
                class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >
                ...
              </span>

              <!-- WINDOW -->
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

              <!-- DOTS RIGHT -->
              <span
                v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
                class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >
                ...
              </span>

              <!-- LAST -->
              <button
                v-if="paginationPages[paginationPages.length - 1] < totalPages"
                @click="currentPage = totalPages"
                class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
              >
                {{ totalPages }}
              </button>
            </div>

            <!-- NEXT -->
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
              {{ t('selanjutnya') }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL DETAIL -->
      <Teleport to="body">
        <div
          v-if="showDetail"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl w-[520px] max-w-[90vw] transition-colors"
          >
            <!-- HEADER -->
            <div
              class="flex justify-between items-center p-4 border-b border-b-gray-200 dark:border-b-gray-700"
            >
              <Heading variant="heading9sb" class="dark:text-white">
                {{ t('ka_modal_detail') }}
              </Heading>
              <button
                @click="showDetail = false"
                class="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- BODY -->
            <div class="p-5 space-y-6 text-sm">
              <!-- KODE KLASIFIKASI -->
              <div class="flex gap-3 items-start">
                <Hash class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                <div class="flex-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('ka_kode') }}
                  </p>
                  <div class="mt-2">
                    <span
                      class="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm"
                    >
                      {{ detail?.klasifikasi }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- NAMA KLASIFIKASI -->
              <div class="flex gap-3 items-start">
                <FileText class="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                <div class="flex-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('ka_nama') }}
                  </p>
                  <p class="mt-2 text-sm font-medium text-black dark:text-white">
                    {{ detail?.klasifikasi_text }}
                  </p>
                </div>
              </div>

              <!-- DESKRIPSI -->
              <div class="flex gap-3 items-start">
                <ChartNoAxesGantt class="w-5 h-5 text-orange-500 dark:text-orange-400 mt-1" />
                <div class="flex-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('ka_deskripsi') }}
                  </p>
                  <p class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                    {{ detail?.deskripsi ?? '-' }}
                  </p>
                </div>
              </div>

              <!-- TANGGAL DIBUAT -->
              <div class="flex gap-3 items-start">
                <Calendar class="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-1" />
                <div class="flex-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('ka_tgl_dibuat') }}
                  </p>
                  <p class="mt-2 text-sm text-gray-900 dark:text-gray-200">-</p>
                </div>
              </div>
            </div>

            <!-- FOOTER -->
            <div class="border-t border-t-gray-200 dark:border-t-gray-700 p-4">
              <button
                @click="showDetail = false"
                class="w-full px-3 py-2 rounded-lg bg-primary hover:bg-primary-700 text-white font-medium transition-colors"
              >
                {{ t('ka_tutup') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- MODAL TAMBAH KLASIFIKASI -->
      <Teleport to="body">
        <Modal
          v-model="showAddModal"
          :saving="savingAdd"
          size="xl"
          @save="submitAddKlasifikasi"
          @close="resetAddForm"
        >
          <template #title>
            <Heading
              variant="heading9b"
              class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white"
            >
              {{ t('ka_modal_add') }}
            </Heading>
          </template>

          <div class="space-y-5 p-1">
            <!-- KODE KLASIFIKASI -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_kode') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="addForm.klasifikasi"
                type="text"
                :placeholder="t('ka_kode_placeholder')"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                  addFormErrors.klasifikasi
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="addFormErrors.klasifikasi = false"
              />
              <p v-if="addFormErrors.klasifikasi" class="text-xs text-red-500 mt-1">
                {{ t('ka_kode') }}
              </p>
            </div>

            <!-- NAMA KLASIFIKASI -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_nama') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="addForm.klasifikasi_text"
                type="text"
                :placeholder="t('ka_nama_placeholder')"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                  addFormErrors.klasifikasi_text
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="addFormErrors.klasifikasi_text = false"
              />
              <p v-if="addFormErrors.klasifikasi_text" class="text-xs text-red-500 mt-1">
                {{ t('ka_nama') }}
              </p>
            </div>

            <!-- DESKRIPSI -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_deskripsi') }}
              </Heading>
              <textarea
                v-model="addForm.deskripsi"
                rows="4"
                :placeholder="t('ka_deskripsi_placeholder')"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('ka_deskripsi_hint') }}
              </p>
            </div>

            <!-- RETENSI AKTIF & INAKTIF -->
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                  {{ t('ka_retensi_aktif') }} <span class="text-red-500">*</span>
                </Heading>
                <input
                  v-model="addForm.retensi_aktif_tahun"
                  type="number"
                  min="0"
                  :placeholder="'0'"
                  :class="[
                    'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                    addFormErrors.retensi_aktif_tahun
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                  ]"
                  @input="addFormErrors.retensi_aktif_tahun = false"
                />
              </div>
              <div class="flex flex-col gap-1">
                <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                  {{ t('ka_retensi_inaktif') }} <span class="text-red-500">*</span>
                </Heading>
                <input
                  v-model="addForm.retensi_inaktif_tahun"
                  type="number"
                  min="0"
                  :placeholder="'0'"
                  :class="[
                    'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                    addFormErrors.retensi_inaktif_tahun
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                  ]"
                  @input="addFormErrors.retensi_inaktif_tahun = false"
                />
              </div>
            </div>

            <!-- PENYUSUTAN -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_penyusutan') }} <span class="text-red-500">*</span>
              </Heading>
              <select
                v-model="addForm.penyusutan"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                  addFormErrors.penyusutan
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @change="addFormErrors.penyusutan = false"
              >
                <option value="Musnah">Musnah</option>
                <option value="Permanen">Permanen</option>
              </select>
            </div>

            <!-- KEAMANAN -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_keamanan') }}
              </Heading>
              <select
                v-model="addForm.keamanan"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              >
                <option value="">{{ t('ka_keamanan_placeholder') }}</option>
                <option value="Biasa / Terbuka">Biasa / Terbuka</option>
                <option value="Terbatas">Terbatas</option>
                <option value="Rahasia">Rahasia</option>
                <option value="Sangat Rahasia">Sangat Rahasia</option>
              </select>
            </div>

            <!-- HAK AKSES -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_hak_akses') }}
              </Heading>
              <select
                v-model="addForm.hak_akses"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              >
                <option value="">{{ t('ka_hak_akses_placeholder') }}</option>
                <option value="BOD-1">BOD-1</option>
                <option value="BOD-2">BOD-2</option>
                <option value="BOD-3">BOD-3</option>
                <option value="Karyawan">Karyawan</option>
                <option value="Karyawan, Publik">Karyawan, Publik</option>
                <option value="Pengawas Internal">Pengawas Internal</option>
                <option value="Karyawan, Publik, Pengawas Eksternal dan Aparat Penegak Hukum">Karyawan, Publik, Pengawas Eksternal dan Aparat Penegak Hukum</option>
              </select>
            </div>

            <!-- LOADING INFO -->
            <p v-if="savingAdd" class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('ka_saving') }}
            </p>
          </div>
        </Modal>
      </Teleport>

      <!-- MODAL EDIT KLASIFIKASI -->
      <Teleport to="body">
        <Modal v-model="showEditModal" :saving="savingEdit" size="xl" @save="submitEditKlasifikasi">
          <template #title>
            <Heading
              variant="heading9b"
              class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white"
            >
              {{ t('ka_modal_edit') }}
            </Heading>
          </template>

          <div class="space-y-5 p-1">
            <!-- KODE -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_kode') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="editForm.klasifikasi"
                type="text"
                :placeholder="t('ka_kode_placeholder')"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                  editFormErrors.klasifikasi
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="editFormErrors.klasifikasi = false"
              />
              <p v-if="editFormErrors.klasifikasi" class="text-xs text-red-500 mt-1">
                {{ t('ka_kode') }}
              </p>
            </div>

            <!-- NAMA -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_nama') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="editForm.klasifikasi_text"
                type="text"
                :placeholder="t('ka_nama_placeholder')"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                  editFormErrors.klasifikasi_text
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="editFormErrors.klasifikasi_text = false"
              />
              <p v-if="editFormErrors.klasifikasi_text" class="text-xs text-red-500 mt-1">
                {{ t('ka_nama') }}
              </p>
            </div>

            <!-- DESKRIPSI -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_deskripsi') }} <span class="text-red-500">*</span>
              </Heading>
              <textarea
                v-model="editForm.deskripsi"
                rows="4"
                :placeholder="t('ka_deskripsi_placeholder')"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('ka_deskripsi_hint') }}
              </p>
            </div>

            <!-- RETENSI AKTIF & INAKTIF -->
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                  {{ t('ka_retensi_aktif') }}
                </Heading>
                <input
                  v-model="editForm.retensi_aktif_tahun"
                  type="number"
                  min="0"
                  :placeholder="'0'"
                  class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div class="flex flex-col gap-1">
                <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                  {{ t('ka_retensi_inaktif') }}
                </Heading>
                <input
                  v-model="editForm.retensi_inaktif_tahun"
                  type="number"
                  min="0"
                  :placeholder="'0'"
                  class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            <!-- PENYUSUTAN -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_penyusutan') }}
              </Heading>
              <select
                v-model="editForm.penyusutan"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              >
                <option value="Musnah">Musnah</option>
                <option value="Permanen">Permanen</option>
              </select>
            </div>

            <!-- KEAMANAN -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_keamanan') }}
              </Heading>
              <select
                v-model="editForm.keamanan"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              >
                <option value="">{{ t('ka_keamanan_placeholder') }}</option>
                <option value="Biasa / Terbuka">Biasa / Terbuka</option>
                <option value="Terbatas">Terbatas</option>
                <option value="Rahasia">Rahasia</option>
                <option value="Sangat Rahasia">Sangat Rahasia</option>
              </select>
            </div>

            <!-- HAK AKSES -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_hak_akses') }}
              </Heading>
              <select
                v-model="editForm.hak_akses"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              >
                <option value="">{{ t('ka_hak_akses_placeholder') }}</option>
                <option value="BOD-1">BOD-1</option>
                <option value="BOD-2">BOD-2</option>
                <option value="BOD-3">BOD-3</option>
                <option value="Karyawan">Karyawan</option>
                <option value="Karyawan, Publik">Karyawan, Publik</option>
                <option value="Pengawas Internal">Pengawas Internal</option>
                <option value="Karyawan, Publik, Pengawas Eksternal dan Aparat Penegak Hukum">Karyawan, Publik, Pengawas Eksternal dan Aparat Penegak Hukum</option>
              </select>
            </div>
          </div>
          <p v-if="savingEdit" class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('ka_saving') }}
          </p>
        </Modal>
      </Teleport>

    <ConfirmDialog
      v-model="showDeletePopup"
      type="danger"
      :title="t('ka_pop_title')"
      :message="deleteMessage"
      :confirm-text="t('popup_hapus')"
      :cancel-text="t('popup_batal')"
      :is-loading="deleting"
      :require-confirmation="true"
      confirmation-text="KONFIRMASI HAPUS DATA"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- POPUP PERINGATAN / TIDAK BISA DIHAPUS -->
    <ConfirmDialog
      v-model="showBlockedDeletePopup"
      type="warning"
      title="Data Tidak Dapat Dihapus"
      :message="blockedDeleteMessage"
      confirm-text="Mengerti"
      :is-alert="true"
      @confirm="showBlockedDeletePopup = false"
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
            <span>Total: <span class="font-semibold text-gray-700 dark:text-gray-200">{{ klasifikasiList.length }} baris</span></span>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 flex-shrink-0 gap-3 px-5 py-3 mt-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
            <button
              type="button"
              @click="showExportModal = false"
              class="px-4 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            >
              {{ t('batal') }}
            </button>
            <button
              type="button"
              @click="handleExportConfirm"
              :disabled="selectedExportColumns.length === 0"
              class="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary-700 active:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-lg shadow-sm shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Export {{ selectedExportColumns.length > 0 ? `(${selectedExportColumns.length} Kolom)` : '' }}
            </button>
          </div>
        </template>
      </Modal>
    </Teleport>
  </div>
  </div>
</template>

<script setup lang="ts">const { canAccessPage } = useFeatureAccess()

import { ref, onMounted, computed, watch } from 'vue';
import {
  Eye,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Plus,
  FileDown,
  FileText,
  Hash,
  ChartNoAxesGantt,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  Check
} from 'lucide-vue-next';
import type { BreadcrumbItem } from '@nuxt/ui';
import type { Klasifikasi } from '~/types/klasifikasi';
import { useKlasifikasi } from '~/composables/useKlasifikasi';
import Modal from '@/components/Modal.vue';
import ConfirmDialog from '@/components/ConfirmPopup.vue';

definePageMeta({
  middleware: 'auth'
});

const { hasPermission } = useAuth();


const { t, locale } = useI18n();

const items = computed<BreadcrumbItem[]>(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('ka_title'), to: '/master/klasifikasi' }
]);

import { useToast } from '#imports';

const toast = useToast();

const showToast = (opt: {
  title: string;
  message?: string;
  color?: 'primary' | 'neutral' | 'secondary' | 'warning' | 'error' | 'success';
  icon?: string;
}) => {
  toast.add({
    title: opt.title,
    description: opt.message,
    color: opt.color ?? 'primary',
    icon: opt.icon ?? 'i-lucide-info'
  });
};

const {
  getKlasifikasi,
  getKlasifikasiDetail,
  createKlasifikasi,
  updateKlasifikasi,
  deleteKlasifikasi,
  checkKlasifikasiUsage
} = useKlasifikasi();


const klasifikasiList = ref<Klasifikasi[]>([]);
const loading = ref(false);
const search = ref('');

const fetchKlasifikasi = async () => {
  loading.value = true;
  try {
    klasifikasiList.value = await getKlasifikasi();
    currentPage.value = 1;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchKlasifikasi);

const showDetail = ref(false);
const detail = ref<Klasifikasi | null>(null);

const onView = async (row: Klasifikasi) => {
  showDetail.value = true;
  detail.value = null;
  try {
    const res = await getKlasifikasiDetail(row.id);
    detail.value = (res as any).data ?? res;
  } catch (e) {
    console.error('Gagal ambil detail', e);
  }
};

const showAddModal = ref(false);
const savingAdd = ref(false);

const addForm = ref({
  klasifikasi: '',
  klasifikasi_text: '',
  deskripsi: '',
  retensi_aktif_tahun: 1 as number | null,
  retensi_inaktif_tahun: 1 as number | null,
  penyusutan: 'Permanen',
  keamanan: '',
  hak_akses: ''
});

const addErrors = ref<Record<string, string>>({});

const addFormErrors = ref({
  klasifikasi: false,
  klasifikasi_text: false,
  retensi_aktif_tahun: false,
  retensi_inaktif_tahun: false,
  penyusutan: false
});

const openAddModal = () => {
  resetAddForm();
  showAddModal.value = true;
};

const resetAddForm = () => {
  addErrors.value = {};
  addForm.value = {
    klasifikasi: '',
    klasifikasi_text: '',
    deskripsi: '',
    retensi_aktif_tahun: 1,
    retensi_inaktif_tahun: 1,
    penyusutan: 'Permanen',
    keamanan: '',
    hak_akses: ''
  };
  addFormErrors.value = {
    klasifikasi: false,
    klasifikasi_text: false,
    retensi_aktif_tahun: false,
    retensi_inaktif_tahun: false,
    penyusutan: false
  };
};

const validateAdd = () => {
  addFormErrors.value.klasifikasi = !addForm.value.klasifikasi.trim();
  addFormErrors.value.klasifikasi_text = !addForm.value.klasifikasi_text.trim();
  addFormErrors.value.retensi_aktif_tahun =
    addForm.value.retensi_aktif_tahun === null ||
    addForm.value.retensi_aktif_tahun === undefined ||
    addForm.value.retensi_aktif_tahun === '';
  addFormErrors.value.retensi_inaktif_tahun =
    addForm.value.retensi_inaktif_tahun === null ||
    addForm.value.retensi_inaktif_tahun === undefined ||
    addForm.value.retensi_inaktif_tahun === '';
  addFormErrors.value.penyusutan = !addForm.value.penyusutan;

  const emptyFields: string[] = [];
  if (addFormErrors.value.klasifikasi) emptyFields.push(t('ka_kode'));
  if (addFormErrors.value.klasifikasi_text) emptyFields.push(t('ka_nama'));
  if (addFormErrors.value.retensi_aktif_tahun) emptyFields.push(t('ka_retensi_aktif'));
  if (addFormErrors.value.retensi_inaktif_tahun) emptyFields.push(t('ka_retensi_inaktif'));
  if (addFormErrors.value.penyusutan) emptyFields.push(t('ka_penyusutan'));

  if (emptyFields.length > 0) {
    showToast({
      title: t('gagal'),
      message: `${emptyFields.join(', ')} wajib diisi`,
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return false;
  }
  return true;
};

const submitAddKlasifikasi = async () => {
  if (savingAdd.value) return;
  if (!validateAdd()) return;
  try {
    savingAdd.value = true;
    await createKlasifikasi({
      company: '10000',
      klasifikasi: addForm.value.klasifikasi,
      klasifikasi_text: addForm.value.klasifikasi_text,
      deskripsi: addForm.value.deskripsi || null,
      retensi_aktif_tahun: addForm.value.retensi_aktif_tahun,
      retensi_inaktif_tahun: addForm.value.retensi_inaktif_tahun,
      penyusutan: addForm.value.penyusutan || 'Permanen',
      keamanan: addForm.value.keamanan || null,
      hak_akses: addForm.value.hak_akses || null
    });
    showAddModal.value = false;
    await fetchKlasifikasi();
    showToast({
      title: t('berhasil'),
      message: t('ka_success_add'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    });
  } catch (e) {
    console.error('Gagal tambah klasifikasi:', e);
    showToast({
      title: t('gagal'),
      message: t('ka_err_add'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  } finally {
    savingAdd.value = false;
  }
};

const showEditModal = ref(false);
const savingEdit = ref(false);
const editId = ref<string | null>(null);

const editForm = ref({
  klasifikasi: '',
  klasifikasi_text: '',
  deskripsi: '',
  retensi_aktif_tahun: null as number | null,
  retensi_inaktif_tahun: null as number | null,
  penyusutan: 'Permanen',
  keamanan: '',
  hak_akses: ''
});

const editErrors = ref<Record<string, string>>({});

const editFormErrors = ref({
  klasifikasi: false,
  klasifikasi_text: false
});

const validateEdit = () => {
  editFormErrors.value.klasifikasi = !editForm.value.klasifikasi.trim();
  editFormErrors.value.klasifikasi_text = !editForm.value.klasifikasi_text.trim();

  const emptyFields: string[] = [];
  if (editFormErrors.value.klasifikasi) emptyFields.push(t('ka_kode'));
  if (editFormErrors.value.klasifikasi_text) emptyFields.push(t('ka_nama'));

  if (emptyFields.length > 0) {
    showToast({
      title: t('gagal'),
      message: `${emptyFields.join(', ')} wajib diisi`,
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return false;
  }
  return true;
};

const onEdit = async (row: Klasifikasi) => {
  try {
    showEditModal.value = true;
    savingEdit.value = false;
    editErrors.value = {};
    editFormErrors.value = { klasifikasi: false, klasifikasi_text: false };
    editId.value = row.id;
    editForm.value = {
      klasifikasi: '',
      klasifikasi_text: '',
      deskripsi: '',
      retensi_aktif_tahun: null,
      retensi_inaktif_tahun: null,
      penyusutan: 'Permanen',
      keamanan: '',
      hak_akses: ''
    };

    const res = await getKlasifikasiDetail(row.id);
    const data = (res as any).data ?? res;
    editForm.value.klasifikasi = data.klasifikasi || '';
    editForm.value.klasifikasi_text = data.klasifikasi_text || '';
    editForm.value.deskripsi = data.deskripsi || '';
    editForm.value.retensi_aktif_tahun = data.retensi_aktif_tahun ?? null;
    editForm.value.retensi_inaktif_tahun = data.retensi_inaktif_tahun ?? null;
    editForm.value.penyusutan = data.penyusutan || 'Permanen';
    editForm.value.keamanan = data.keamanan || '';
    editForm.value.hak_akses = data.hak_akses || '';
  } catch (e) {
    console.error('Gagal ambil data edit klasifikasi:', e);
    alert('Gagal memuat data edit');
    showEditModal.value = false;
  }
};

const submitEditKlasifikasi = async () => {
  if (savingEdit.value) return;
  if (!editId.value) return;
  if (!validateEdit()) return;
  try {
    savingEdit.value = true;
    await updateKlasifikasi(editId.value, {
      company: '10000',
      klasifikasi: editForm.value.klasifikasi,
      klasifikasi_text: editForm.value.klasifikasi_text,
      deskripsi: editForm.value.deskripsi || null,
      retensi_aktif_tahun: editForm.value.retensi_aktif_tahun,
      retensi_inaktif_tahun: editForm.value.retensi_inaktif_tahun,
      penyusutan: editForm.value.penyusutan || 'Permanen',
      keamanan: editForm.value.keamanan || null,
      hak_akses: editForm.value.hak_akses || null
    });
    showEditModal.value = false;
    editId.value = null;
    await fetchKlasifikasi();
    showToast({
      title: t('berhasil'),
      message: t('ka_success_edit'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    });
  } catch (e) {
    console.error('Gagal update klasifikasi:', e);
    showToast({
      title: t('gagal'),
      message: t('ka_err_edit'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  } finally {
    savingEdit.value = false;
  }
};

const showDeletePopup = ref(false);
const showBlockedDeletePopup = ref(false);
const blockedDeleteMessage = ref('');
const deleting = ref(false);
const checkingDelete = ref(false);
const deleteTarget = ref<Klasifikasi | null>(null);

const onDelete = (row: Klasifikasi) => {
  deleteTarget.value = row;
  showDeletePopup.value = true;
};

const confirmDelete = async () => {
  if (!deleteTarget.value) return;
  try {
    deleting.value = true;
    await deleteKlasifikasi(deleteTarget.value.id);
    showDeletePopup.value = false;
    showToast({
      title: t('berhasil'),
      message: t('ka_success_delete'),
      color: 'error',
      icon: 'i-lucide-check-circle'
    });
    deleteTarget.value = null;
    await fetchKlasifikasi();
  } catch (e) {
    console.error('Gagal menghapus klasifikasi:', e);
    showToast({
      title: t('gagal'),
      message: t('ka_err_delete'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  } finally {
    deleting.value = false;
  }
};

const cancelDelete = () => {
  showDeletePopup.value = false;
  deleteTarget.value = null;
};

const deleteMessage = computed(() => {
  if (!deleteTarget.value) return '';
  return locale.value === 'id'
    ? `Yakin ingin menghapus klasifikasi "${deleteTarget.value.klasifikasi_text}"? ${t('ka_pop_desc')}`
    : `Are you sure you want to delete classification "${deleteTarget.value.klasifikasi_text}"? ${t('ka_pop_desc')}`;
});

const currentPage = ref(1);
const perPage = ref(10);
const rowsChoices = [5, 10, 20, 50];
const openRowsDropdown = ref(false);

const totalItems = computed(() => filteredKlasifikasi.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value));

const paginatedKlasifikasi = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredKlasifikasi.value.slice(start, end);
});

const skeletonRows = computed(() => perPage.value);

const paginationPages = computed(() => {
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage.value - half);
  let end = Math.min(totalPages.value, start + windowSize - 1);
  if (end - start < windowSize - 1) {
    start = Math.max(1, end - windowSize + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

watch(klasifikasiList, () => {
  currentPage.value = 1;
});

const sortKlasifikasi = ref<'asc' | 'desc' | null>(null);

const filteredKlasifikasi = computed(() => {
  let data = [...klasifikasiList.value];

  if (search.value.trim()) {
    const s = search.value.toLowerCase();
    data = data.filter(
      (row) =>
        row.klasifikasi.toLowerCase().includes(s) ||
        row.klasifikasi_text.toLowerCase().includes(s) ||
        (row.deskripsi || '').toLowerCase().includes(s)
    );
  }

  if (sortKlasifikasi.value === 'asc') {
    data.sort((a, b) => a.klasifikasi.localeCompare(b.klasifikasi));
  } else if (sortKlasifikasi.value === 'desc') {
    data.sort((a, b) => b.klasifikasi.localeCompare(a.klasifikasi));
  }

  return data;
});

watch(search, () => {
  currentPage.value = 1;
});

const toggleSortKlasifikasi = () => {
  if (sortKlasifikasi.value === null) sortKlasifikasi.value = 'asc';
  else if (sortKlasifikasi.value === 'asc') sortKlasifikasi.value = 'desc';
  else sortKlasifikasi.value = null;
};

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const onExport = () => {
  if (!klasifikasiList.value.length) {
    showToast({
      title: locale.value === 'id' ? 'Tidak ada data' : 'No Data',
      message: t('ka_export_empty'),
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    });
    return;
  }
  selectedExportColumns.value = exportColumns.value.map((c) => c.key);
  showExportModal.value = true;
};

const exportColumns = computed(() => [
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'kode', label: t('ka_kode'), desc: 'Kode klasifikasi arsip' },
  { key: 'nama', label: t('ka_nama'), desc: 'Nama klasifikasi arsip' },
  { key: 'deskripsi', label: t('ka_deskripsi'), desc: 'Penjelasan detail naskah' },
  { key: 'retensi_aktif', label: t('ka_retensi_aktif'), desc: 'Masa simpan aktif (tahun)' },
  { key: 'retensi_inaktif', label: t('ka_retensi_inaktif'), desc: 'Masa simpan inaktif (tahun)' },
  { key: 'penyusutan', label: t('ka_penyusutan'), desc: 'Tindakan penyusutan akhir' },
  { key: 'keamanan', label: t('ka_keamanan'), desc: 'Tingkat keamanan berkas' },
  { key: 'hak_akses', label: t('ka_hak_akses'), desc: 'Tingkat jabatan berhak akses' },
  { key: 'status', label: 'Status', desc: 'Status keaktifan klasifikasi' }
]);

const showExportModal = ref(false);
const selectedExportColumns = ref<string[]>([]);

const allExportSelected = computed(
  () => selectedExportColumns.value.length === exportColumns.value.length && exportColumns.value.length > 0
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

const handleExportConfirm = () => {
  const selectedKeys = selectedExportColumns.value;
  if (selectedKeys.length === 0) return;
  const excelData = klasifikasiList.value.map((item, index) => {
    const row: Record<string, any> = {};
    if (selectedKeys.includes('No')) row['No'] = index + 1;
    if (selectedKeys.includes('kode')) row[t('ka_kode')] = item.klasifikasi;
    if (selectedKeys.includes('nama')) row[t('ka_nama')] = item.klasifikasi_text;
    if (selectedKeys.includes('deskripsi')) row[t('ka_deskripsi')] = item.deskripsi ?? '-';
    if (selectedKeys.includes('retensi_aktif')) row[t('ka_retensi_aktif')] = item.retensi_aktif_tahun ?? '-';
    if (selectedKeys.includes('retensi_inaktif')) row[t('ka_retensi_inaktif')] = item.retensi_inaktif_tahun ?? '-';
    if (selectedKeys.includes('penyusutan')) row[t('ka_penyusutan')] = item.penyusutan ?? '-';
    if (selectedKeys.includes('keamanan')) row[t('ka_keamanan')] = item.keamanan ?? '-';
    if (selectedKeys.includes('hak_akses')) row[t('ka_hak_akses')] = item.hak_akses ?? '-';
    if (selectedKeys.includes('status')) {
      row['Status'] = item.active === 1
        ? locale.value === 'id' ? 'Aktif' : 'Active'
        : locale.value === 'id' ? 'Non Aktif' : 'Inactive';
    }
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t('ka_title'));

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const fileName = `master_klasifikasi_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);

  showToast({
    title: locale.value === 'id' ? 'Export berhasil' : 'Export Successful',
    message: t('ka_export_success'),
    color: 'success',
    icon: 'i-lucide-file-down'
  });
  showExportModal.value = false;
};

function highlight(text: string, keyword: string): string {
  if (!keyword || !text) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">$1</mark>'
  );
}
</script>

<style scoped>
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.15s ease;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
