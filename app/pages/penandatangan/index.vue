<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5">
    <div class="">
      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <Heading variant="heading6b" class="text-mobile-md dark:text-white">
            {{ $t('sign_title') }}
          </Heading>
          <PageHeader :items="breadcrumbs" />
        </div>
      </div>

      <!-- TABLE CONTAINER -->
      <div
        class="bg-white mt-2 dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow-sm border border-gray-200"
      >
        <!-- TOP BAR -->
        <div
          class="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700"
        >
          <!-- ROWS PER PAGE -->
          <div class="flex items-center gap-2">
            <div class="relative" ref="rowsRef">
              <button
                type="button"
                @click.stop="showRowsDropdown = !showRowsDropdown"
                class="h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
              >
                <span>{{ rowsPerPage }}</span>
                <ChevronDown
                  class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                  :class="{ 'rotate-180': showRowsDropdown }"
                />
              </button>
              <Transition name="filter-dd">
                <div
                  v-if="showRowsDropdown"
                  class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                >
                  <button
                    v-for="n in rowsChoices"
                    :key="n"
                    type="button"
                    @click.stop="
                      rowsPerPage = n;
                      showRowsDropdown = false;
                    "
                    :class="[
                      'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                      rowsPerPage === n
                        ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    ]"
                  >
                    {{ n }}
                  </button>
                </div>
              </Transition>
            </div>
          </div>

          <!-- FILTER STATUS -->
          <div class="relative" ref="filterStatusRef">
            <button
              type="button"
              class="h-9 flex items-center justify-between gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white text-sm px-3 rounded-lg min-w-[160px] hover:border-primary transition-all"
              @click.stop="openFilterStatus = !openFilterStatus"
            >
              <span>{{ filterStatusLabel }}</span>
              <ChevronDown
                :class="[
                  'w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200',
                  openFilterStatus ? 'rotate-180' : ''
                ]"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterStatus"
                class="absolute left-0 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden"
              >
                <button
                  v-for="item in filterOptions"
                  :key="item.value"
                  class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors"
                  :class="
                    filterStatus === item.value
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  @click.stop="selectFilterStatus(item)"
                >
                  {{ item.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- SEARCH -->
          <div class="relative w-full justify-between">
            <Search
              class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="search"
              :placeholder="$t('sign_cari_placeholder')"
              class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
            />
          </div>
        </div>

        <!-- TABLE -->
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-primary dark:bg-primary-700 text-white text-sm">
              <tr>
                <th
                  @click="handleSort('tanggalDibuat')"
                  class="cursor-pointer hover:bg-primary-600 dark:hover:bg-primary-800 transition select-none"
                >
                  <div class="flex items-center gap-2 px-4 py-3">
                    <span>{{ $t('sign_tanggal_dibuat') }}</span>
                    <ArrowUpDown
                      class="w-4 h-4 origin-center transition-transform duration-200"
                      :class="
                        sortKey === 'tanggalDibuat'
                          ? sortOrder === 'desc'
                            ? 'rotate-180'
                            : 'rotate-0'
                          : 'opacity-50'
                      "
                    />
                  </div>
                </th>
                <th class="px-4 py-3 font-semibold text-sm">
                  {{ $t('nodokumen') }}
                </th>
                <th class="px-4 py-3 font-semibold text-sm">
                  {{ $t('perihal') }}
                </th>
                <th class="px-4 py-3 font-semibold text-sm text-center">
                  {{ $t('sign_penanda_tangan') }}
                </th>
                <th class="px-4 py-3 font-semibold text-sm text-center">
                  {{ $t('dokumen') }}
                </th>
                <th
                  @click="handleSort('status')"
                  class="cursor-pointer hover:bg-primary-600 dark:hover:bg-primary-800 transition select-none"
                >
                  <div class="flex items-center gap-2 ml-5 px-4 py-3">
                    <span>{{ $t('sign_status') }}</span>
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
                <th class="px-4 py-3 font-semibold text-sm text-center">
                  {{ $t('aksi') }}
                </th>
              </tr>
            </thead>

            <tbody>
              <!-- LOADING (SKELETON) -->
              <tr
                v-if="loading"
                v-for="i in 5"
                :key="i"
                class="border-b border-gray-100 dark:border-gray-700"
              >
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-28"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48"></div>
                </td>
                <td class="px-4 py-3 text-center">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8 mx-auto"
                  ></div>
                </td>
                <td class="px-4 py-3 text-center">
                  <div
                    class="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-16 mx-auto"
                  ></div>
                </td>
                <td class="px-4 py-3">
                  <div
                    class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-24 mx-auto"
                  ></div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <div
                      class="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                    ></div>
                    <div
                      class="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                    ></div>
                    <div
                      class="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                    ></div>
                  </div>
                </td>
              </tr>

              <!-- EMPTY -->
              <tr v-else-if="paginatedRows.length === 0">
                <td colspan="7" class="p-12 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <FileX class="w-12 h-12 text-gray-400 dark:text-gray-600" />
                    <p class="text-gray-500 dark:text-gray-400 font-medium">
                      {{ $t('sign_tidak_ada_data') }}
                    </p>
                    <p class="text-sm text-gray-400 dark:text-gray-500">
                      {{ $t('sign_belum_ada_dokumen') }}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- DATA -->
              <tr
                v-else
                v-for="row in paginatedRows"
                :key="row.id"
                class="border-b border-gray-100 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition"
              >
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-white">
                  {{ formatDate(row.tanggalDibuat) }}
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  <span v-html="highlight(row.nomorDokumen, search)"></span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  <span v-html="highlight(row.perihal, search)"></span>
                </td>
                <td class="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                  {{ row.totalPenandatangan }}
                </td>

                <!-- KOLOM DOKUMEN -->
                <td class="px-4 py-3 text-center">
                  <button
                    @click="viewDocumentFromTable(row)"
                    :disabled="!row.filePreviewUrl && !row.signedFilePreviewUrl"
                    class="flex items-center gap-2 mx-auto px-3 py-1 text-xs font-medium rounded-lg transition"
                    :class="
                      row.filePreviewUrl || row.signedFilePreviewUrl
                        ? 'bg-blue-100 dark:bg-blue-900 text-primary-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    "
                  >
                    <FileCheck class="w-4 h-4" />
                    {{ $t('sign_lihat') }}
                    <ChevronRight class="w-4 h-4" />
                  </button>
                </td>

                <!-- STATUS -->
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="row.mySignerStatus === 'waiting'"
                    class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                    >{{ $t('sign_status_menunggu') }}</span
                  >
                  <span
                    v-else-if="row.mySignerStatus === 'signed'"
                    class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    >{{ $t('sign_status_sudah_ttd') }}</span
                  >
                  <span
                    v-else-if="row.mySignerStatus === 'rejected'"
                    class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                    >{{ $t('sign_status_ditolak') }}</span
                  >
                  <span
                    v-else
                    class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >{{ row.mySignerStatus }}</span
                  >
                </td>

                <!-- AKSI -->
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="handleViewDetail(row)"
                      class="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition"
                      :title="$t('sign_lihat_detail')"
                    >
                      <Eye class="w-4.5 h-4.5" />
                    </button>
                    <button
                      @click="row.canSign ? handleOpenSign(row) : null"
                      :disabled="!row.canSign"
                      :class="[
                        'p-2 rounded-lg transition',
                        row.canSign
                          ? 'text-primary dark:text-primary-400 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer'
                          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      ]"
                      :title="row.canSign ? $t('sign_tanda_tangani') : $t('sign_tidak_bisa_ttd')"
                    >
                      <Signature class="w-4.5 h-4.5" />
                    </button>
                    <button
                      @click="row.canReject ? handleReject(row) : null"
                      :disabled="!row.canReject"
                      :class="[
                        'p-2 rounded-lg transition',
                        row.canReject
                          ? 'text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 cursor-pointer'
                          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      ]"
                      :title="row.canReject ? $t('sign_tolak') : $t('sign_tidak_bisa_tolak')"
                    >
                      <X class="w-4.5 h-4.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div
          class="flex flex-col md:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-4"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            {{ $t('menampilkan') }} {{ startRow }} - {{ endRow }} {{ $t('dari') }} {{ totalRows }}
            {{ $t('data') }}
          </div>
          <div class="flex gap-2">
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

            <div class="flex items-center gap-1">
              <button
                v-if="paginationPages[0] > 1"
                @click="currentPage = 1"
                class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
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
                    ? 'bg-primary dark:bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400'
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
                class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
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

      <!-- MODAL DETAIL -->
      <Teleport to="body">
        <Modal v-model="openDetail" :hideDefaultFooter="true" size="xl">
          <template #title>
            <h2 class="text-xl font-semibold ml-5 mt-5 mb-4 dark:text-white">
              {{ $t('sign_detail_dokumen') }}
            </h2>
          </template>
          <div v-if="loadingDetail" class="p-12 text-center">
            <div class="flex flex-col items-center gap-3">
              <div
                class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
              ></div>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                {{ $t('sign_memuat_detail') }}
              </p>
            </div>
          </div>
          <div
            v-else-if="penandatanganDetail"
            class="px-6 pb-6 space-y-6 max-h-[calc(100vh-150px)] overflow-y-auto"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p class="text-gray-500 dark:text-gray-400 mb-1">
                  {{ $t('sign_no_dokumen_label') }}
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ penandatanganDetail.nomorDokumen }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 dark:text-gray-400 mb-1">
                  {{ $t('sign_tanggal_dokumen') }}
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ formatDate(penandatanganDetail.tanggalDokumen) }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 dark:text-gray-400 mb-1">
                  {{ $t('sign_jenis_naskah') }}
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ penandatanganDetail.jenisNaskahText || penandatanganDetail.jenisNaskah }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 dark:text-gray-400 mb-1">
                  {{ $t('klasifikasi') }}
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ penandatanganDetail.klasifikasiText || penandatanganDetail.klasifikasi }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 dark:text-gray-400 mb-1">
                  {{ $t('perihal') }}
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ penandatanganDetail.perihal }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 dark:text-gray-400 mb-1">
                  {{ $t('sign_status_dokumen') }}
                </p>
                <span
                  class="px-3 py-1 rounded-lg text-xs font-medium inline-block"
                  :class="getDocStatusClass(penandatanganDetail.documentStatus)"
                >
                  {{ getDocStatusLabel(penandatanganDetail.documentStatus) }}
                </span>
              </div>
              <div class="md:col-span-2">
                <p class="text-gray-500 dark:text-gray-400 mb-2">
                  {{ $t('dokumen') }}
                </p>
                <button
                  @click="viewDocumentFromDetail"
                  class="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-primary dark:text-blue-300 px-4 py-2 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition"
                >
                  <FileCheck class="w-4 h-4" />
                  {{ $t('sign_lihat_preview') }}
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-primary dark:bg-primary-700 text-white">
                  <tr>
                    <th class="p-3 text-left font-semibold">
                      {{ $t('sign_col_no') }}
                    </th>
                    <th class="p-3 text-left font-semibold">
                      {{ $t('sign_col_enik') }}
                    </th>
                    <th class="p-3 text-left font-semibold">
                      {{ $t('sign_col_nama_jabatan') }}
                    </th>
                    <th class="p-3 text-center font-semibold">
                      {{ $t('sign_status') }}
                    </th>
                    <th class="p-3 text-left font-semibold">
                      {{ $t('sign_col_keterangan') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="signer in penandatanganDetail.signers"
                    :key="signer.id"
                    class="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td class="p-3 text-gray-900 dark:text-white">
                      {{ signer.urutan }}
                    </td>
                    <td class="p-3 font-mono text-gray-900 dark:text-white">
                      {{ signer.persnum }}
                    </td>
                    <td class="p-3">
                      <div class="font-semibold text-gray-900 dark:text-white">
                        {{ signer.nama }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ signer.jabatan }}
                      </div>
                    </td>
                    <td class="p-3 text-center">
                      <span
                        class="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                        :class="getSignerStatusClass(signer.status)"
                      >
                        {{ getSignerStatusLabel(signer.status) }}
                      </span>
                    </td>
                    <td class="p-3">
                      <div v-if="signer.status === 'signed' && signer.signedAt">
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ $t('sign_ditandatangani_pada') }}
                        </p>
                        <p class="font-medium text-gray-900 dark:text-white">
                          {{ formatDate(signer.signedAt) }}
                        </p>
                        <p
                          v-if="signer.keterangan"
                          class="text-xs text-gray-500 dark:text-gray-400 mt-1"
                        >
                          {{ signer.keterangan }}
                        </p>
                      </div>
                      <div v-else-if="signer.status === 'rejected' && signer.rejectedAt">
                        <p
                          v-if="signer.keterangan"
                          class="text-xs mt-1 text-center text-gray-900 dark:text-white font-mono"
                        >
                          {{ signer.keterangan }}
                        </p>
                      </div>
                      <div v-else>
                        <p class="text-gray-400 dark:text-gray-500">-</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      </Teleport>

      <!-- MODAL SIGNATURE -->
      <Teleport to="body">
        <Modal v-model="openSign" :hideDefaultFooter="true" size="xl">
          <template #title>
            <h2 class="text-lg font-semibold ml-5 mt-5 mb-3 dark:text-white">
              {{ $t('sign_tanda_tangan_digital') }}
            </h2>
          </template>
          <div class="px-6 pb-6 space-y-5">
            <div
              v-if="selectedDoc"
              class="border rounded-xl p-4 flex gap-4 items-start bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
            >
              <div
                class="w-12 h-12 rounded-full bg-primary dark:bg-primary-600 flex items-center justify-center flex-shrink-0"
              >
                <User class="w-6 h-6 text-white" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {{ $t('sign_ditandatangani_oleh') }}
                </p>
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ selectedDoc.mySignerInfo?.nama }}
                </p>
                <p class="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                  {{ selectedDoc.mySignerInfo?.jabatan }}
                </p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('sign_passphrase') }} <span class="text-red-500">*</span>
              </label>
              <input
                v-model="passphrase"
                type="password"
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                :placeholder="$t('sign_passphrase_placeholder')"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ $t('sign_passphrase_hint') }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('sign_keterangan') }}
                <span class="text-gray-400 text-xs">({{ $t('sign_keterangan_opsional') }})</span>
              </label>
              <textarea
                v-model="keterangan"
                rows="3"
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                :placeholder="$t('sign_keterangan_placeholder')"
              ></textarea>
            </div>
            <button
              @click="handleSign"
              :disabled="!passphrase || loadingSign"
              :class="[
                'w-full rounded-lg py-3 font-semibold text-sm transition',
                passphrase && !loadingSign
                  ? 'bg-primary hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-500 cursor-not-allowed'
              ]"
            >
              <span v-if="loadingSign" class="flex items-center justify-center gap-2">
                <div
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></div>
                {{ $t('sign_memproses') }}
              </span>
              <span v-else>{{ $t('sign_proses_tanda_tangan') }}</span>
            </button>
          </div>
        </Modal>
      </Teleport>

      <!-- MODAL REJECT -->
      <Teleport to="body">
        <Modal v-model="confirmRejectOpen" :hideDefaultFooter="true" size="xl">
          <template #title>
            <h2 class="text-lg font-semibold ml-5 mt-5 mb-3 text-gray-900 dark:text-white">
              {{ $t('sign_tolak_dokumen') }}
            </h2>
          </template>
          <div class="px-6 pb-6 space-y-4">
            <div
              class="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-red-800 dark:text-red-400">
                  {{ $t('sign_peringatan') }}
                </p>
                <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                  {{ $t('sign_konfirmasi_tolak') }}
                </p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('sign_alasan_penolakan') }}
                <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="rejectReason"
                rows="3"
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                :placeholder="$t('sign_alasan_placeholder')"
              ></textarea>
            </div>
            <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                @click="confirmRejectOpen = false"
                class="flex-1 px-6 py-2 text-sm font-medium border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-900 dark:text-white"
              >
                {{ $t('sign_batal') }}
              </button>
              <button
                @click="rejectNow"
                :disabled="!rejectReason || loadingReject"
                class="flex-1 px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loadingReject">{{ $t('sign_memproses') }}</span>
                <span v-else>{{ $t('sign_tolak_dokumen') }}</span>
              </button>
            </div>
          </div>
        </Modal>
      </Teleport>

      <!-- DOCUMENT PREVIEW SLIDEOVER -->
      <USlideover
        v-model:open="isOpenPreview"
        :title="$t('sign_pratinjau_dokumen')"
        side="bottom"
        :dismissible="true"
        :ui="{ content: 'h-screen max-h-screen', body: 'p-0' }"
      >
        <template #body>
          <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div v-if="loadingPreview" class="flex flex-col items-center gap-3">
              <div
                class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
              ></div>
              <span class="text-gray-500 dark:text-gray-400 text-sm">{{
                $t('sign_memuat_pratinjau')
              }}</span>
            </div>
            <iframe
              v-else-if="pdfUrl"
              :key="pdfUrl"
              :src="pdfUrl"
              class="w-full h-full border-0"
              allowfullscreen
            />
            <div v-else class="flex flex-col items-center gap-3">
              <FileX class="w-12 h-12 text-gray-400 dark:text-gray-600" />
              <span class="text-gray-500 dark:text-gray-400 text-sm">{{
                $t('sign_gagal_memuat')
              }}</span>
            </div>
          </div>
        </template>
      </USlideover>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Search,
  Eye,
  X,
  Signature,
  User,
  ChevronDown,
  FileX,
  FileCheck,
  AlertTriangle,
  ArrowUpDown,
  ChevronRight
} from 'lucide-vue-next';
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '~/components/Modal.vue';
import { useDigsig } from '~/composables/useDigsig';
import type { PenandatangananDocument } from '~/types/digsig';

const { t } = useI18n();
const toast = useToast();

const {
  penandatanganDocuments,
  penandatanganDetail,
  penandatanganMeta,
  penandatanganSummary,
  loading,
  loadingDetail,
  fetchPenandatanganDocuments,
  fetchPenandatanganDetail,
  signDocument,
  rejectDocument
} = useDigsig();

// ─── Modal states ─────────────────────────────
const openDetail = ref(false);
const openSign = ref(false);
const confirmRejectOpen = ref(false);
const selectedDoc = ref<PenandatangananDocument | null>(null);

// ─── Preview Slideover ────────────────────────
const isOpenPreview = ref(false);
const pdfUrl = ref<string | null>(null);
const loadingPreview = ref(false);
const previewSource = ref<'detail' | null>(null);

// ─── Form state ───────────────────────────────
const passphrase = ref('');
const keterangan = ref('');
const rejectReason = ref('');
const loadingSign = ref(false);
const loadingReject = ref(false);
const itemToReject = ref<PenandatangananDocument | null>(null);

// ─── Filter & Pagination ──────────────────────
const search = ref('');
const filterStatus = ref('');
const openFilterStatus = ref(false);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsChoices = [10, 25, 50, 100];
const showRowsDropdown = ref(false);
const sortKey = ref('');
const sortOrder = ref('asc');

// ─── Refs for click-outside ───────────────────
const rowsRef = ref<HTMLElement | null>(null);
const filterStatusRef = ref<HTMLElement | null>(null);

// ─── Breadcrumbs (reactive to locale) ────────
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('sign_title'), to: '/admin/digsig/penandatanganan' }
]);

// ─── Filter options (reactive to locale) ─────
const filterOptions = computed(() => [
  { label: t('sign_filter_semua'), value: '' },
  { label: t('sign_filter_menunggu'), value: 'waiting' },
  { label: t('sign_filter_sudah_ttd'), value: 'signed' },
  { label: t('sign_filter_ditolak'), value: 'rejected' }
]);

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
}

const filterStatusLabel = computed(() => {
  const found = filterOptions.value.find((opt) => opt.value === filterStatus.value);
  return found?.label || t('sign_filter_semua');
});

const filteredRows = computed(() => {
  let filtered = penandatanganDocuments.value || [];
  if (search.value) {
    const s = search.value.toLowerCase();
    filtered = filtered.filter(
      (doc) => doc.nomorDokumen?.toLowerCase().includes(s) || doc.perihal?.toLowerCase().includes(s)
    );
  }
  if (filterStatus.value) {
    filtered = filtered.filter((doc) => doc.mySignerStatus === filterStatus.value);
  }
  return filtered;
});

const totalRows = computed(() => filteredRows.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / rowsPerPage.value)));
const startRow = computed(() =>
  totalRows.value === 0 ? 0 : (currentPage.value - 1) * rowsPerPage.value + 1
);
const endRow = computed(() => Math.min(currentPage.value * rowsPerPage.value, totalRows.value));

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredRows.value.slice(start, start + rowsPerPage.value);
});

const paginationPages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

// ─── Helpers ──────────────────────────────────
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

const getSignerStatusClass = (status: string) => {
  const map: Record<string, string> = {
    waiting: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    pending: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
    signed: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
  };
  return map[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
};

const getSignerStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    waiting: t('sign_status_menunggu'),
    pending: t('sign_status_pending'),
    signed: t('sign_status_sudah_ttd'),
    rejected: t('sign_status_ditolak')
  };
  return map[status] || status;
};

const getDocStatusClass = (status: string) => {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    on_progress: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
    completed: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
  };
  return map[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
};

const getDocStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    on_progress: t('sign_status_on_progress'),
    completed: t('sign_status_selesai'),
    rejected: t('sign_status_ditolak'),
    draft: t('sign_status_draft')
  };
  return map[status] || status;
};

const selectFilterStatus = (item: { label: string; value: string }) => {
  filterStatus.value = item.value;
  openFilterStatus.value = false;
  currentPage.value = 1;
};

// ─── Preview logic ────────────────────────────
const viewDocumentFromTable = (row: PenandatangananDocument) => {
  const url = row.signedFilePreviewUrl || row.filePreviewUrl;
  if (!url) {
    toast.add({
      title: 'Gagal',
      description: t('sign_toast_gagal_preview'),
      color: 'red'
    });
    return;
  }
  previewSource.value = null;
  pdfUrl.value = url;
  isOpenPreview.value = true;
};

const viewDocumentFromDetail = () => {
  if (!penandatanganDetail.value) return;
  const url =
    penandatanganDetail.value.signedFilePreviewUrl || penandatanganDetail.value.filePreviewUrl;
  if (!url) {
    toast.add({
      title: 'Gagal',
      description: t('sign_toast_gagal_preview'),
      color: 'red'
    });
    return;
  }
  previewSource.value = 'detail';
  openDetail.value = false;
  pdfUrl.value = url;
  isOpenPreview.value = true;
};

// ─── Watch: ketika slideover ditutup ──────────
watch(isOpenPreview, (isOpen) => {
  if (!isOpen) {
    if (pdfUrl.value && !pdfUrl.value.startsWith('http')) {
      URL.revokeObjectURL(pdfUrl.value);
    }
    pdfUrl.value = null;
    if (previewSource.value === 'detail') {
      openDetail.value = true;
      previewSource.value = null;
    }
  }
});

// ─── Detail ───────────────────────────────────
const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const handleViewDetail = async (doc: PenandatangananDocument) => {
  if (!isUUID(doc.id)) {
    toast.add({
      title: 'Gagal',
      description: t('sign_toast_data_tidak_valid'),
      color: 'red'
    });
    return;
  }
  openDetail.value = true;
  await fetchPenandatanganDetail(doc.id);
};

// ─── Sign ─────────────────────────────────────
const handleOpenSign = (doc: PenandatangananDocument) => {
  selectedDoc.value = doc;
  openSign.value = true;
  passphrase.value = '';
  keterangan.value = '';
};

const handleSign = async () => {
  if (!passphrase.value || !selectedDoc.value) return;
  loadingSign.value = true;
  try {
    const payload: any = { passphrase: passphrase.value };
    if (keterangan.value.trim()) payload.keterangan = keterangan.value.trim();
    await signDocument(selectedDoc.value.id, payload);
    toast.add({
      title: 'Berhasil',
      description: t('sign_toast_berhasil_ttd'),
      color: 'green'
    });
    openSign.value = false;
    passphrase.value = '';
    keterangan.value = '';
    await fetchPenandatanganDocuments({ page: 1, limit: 10000 });
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || t('sign_toast_gagal_ttd');
    toast.add({ title: 'Gagal', description: msg, color: 'red' });
  } finally {
    loadingSign.value = false;
  }
};

// ─── Reject ───────────────────────────────────
const handleReject = (doc: PenandatangananDocument) => {
  itemToReject.value = doc;
  rejectReason.value = '';
  confirmRejectOpen.value = true;
};

const rejectNow = async () => {
  if (!itemToReject.value || !rejectReason.value.trim()) return;
  loadingReject.value = true;
  try {
    await rejectDocument(itemToReject.value.id, rejectReason.value.trim());
    toast.add({
      title: 'Berhasil',
      description: t('sign_toast_berhasil_tolak'),
      color: 'green'
    });
    confirmRejectOpen.value = false;
    rejectReason.value = '';
    await fetchPenandatanganDocuments({ page: 1, limit: 10000 });
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || t('sign_toast_gagal_tolak');
    toast.add({ title: 'Gagal', description: msg, color: 'red' });
  } finally {
    loadingReject.value = false;
  }
};

// ─── Click outside ────────────────────────────
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (rowsRef.value && !rowsRef.value.contains(target)) {
    showRowsDropdown.value = false;
  }
  if (filterStatusRef.value && !filterStatusRef.value.contains(target)) {
    openFilterStatus.value = false;
  }
};

// ─── Lifecycle ────────────────────────────────
onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  await fetchPenandatanganDocuments({ page: 1, limit: 10000 });
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch([search, filterStatus, rowsPerPage], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
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
