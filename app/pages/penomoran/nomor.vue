<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-gray-100">
          {{ $t('nom_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
      <button
        v-if="hasPermission('penomoran', 'create-penomoran')"
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        {{ $t('nom_btn_tambah') }}
      </button>
    </div>

    <!-- CARD -->
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl w-full">
      <!-- TOP BAR -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 p-3.5">
        <div class="flex items-center gap-2">
          <div class="relative" ref="rowsRef">
            <button
              type="button"
              @click.stop="showRowsDropdown = !showRowsDropdown"
              class="h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
            >
              <span>{{ limit }}</span>
              <ChevronDown
                class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': showRowsDropdown }"
              />
            </button>
            <Transition name="rows-dd">
              <div
                v-if="showRowsDropdown"
                class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  v-for="n in rowsChoices"
                  :key="n"
                  type="button"
                  @click.stop="selectLimit(n)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                    limit === n
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
        <!-- SEARCH + EXPORT -->
        <div class="flex items-center gap-2 flex-1 w-full md:w-auto pr-0 md:pr-0 px-4 md:px-0">
          <div class="relative flex-1 w-full md:w-56">
            <Search
              class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="searchQuery"
              @input="handleSearchInput"
              :placeholder="$t('nom_cari_placeholder')"
              class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm pl-9 pr-3 py-1.5 rounded-lg dark:text-gray-200 dark:placeholder-gray-400"
            />
          </div>
          <!-- EXPORT BUTTON -->
          <button
            v-if="hasPermission('penomoran', 'export-penomoran')"
            type="button"
            @click="handleExport"
            :disabled="isExporting || rows.length === 0"
            class="flex items-center gap-2 h-9 px-4 text-sm font-medium bg-primary hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-900 text-white rounded-lg transition whitespace-nowrap"
          >
            <span>{{
              isExporting
                ? $t('ver_btn_mengekspor') || 'Mengekspor...'
                : $t('ver_btn_export') || 'Export'
            }}</span>
          </button>
        </div>
      </div>
      <!-- TABLE BODY (skeleton / empty / data) -->
      <div class="overflow-x-auto relative">
        <table class="w-full bg-white dark:bg-gray-800 text-sm">
          <thead class="bg-primary dark:bg-primary-800 text-white text-[15px] sticky top-1 z-10">
            <tr>
              <th
                v-for="col in headers"
                :key="col.key"
                @click="col.sortable && handleSort(col.key)"
                :class="[
                  'px-5 py-3 text-left font-semibold tracking-wide whitespace-nowrap bg-primary dark:bg-primary-800',
                  col.sortable
                    ? 'cursor-pointer select-none hover:bg-primary-700 dark:hover:bg-primary-900'
                    : 'cursor-default'
                ]"
              >
                <div class="flex items-center gap-2">
                  <span>{{ col.label }}</span>
                  <span class="w-4 h-4 inline-flex items-center justify-center">
                    <ArrowUpDown
                      v-if="col.sortable"
                      :class="[
                        'w-4 h-4 transition-all',
                        sortBy === col.key ? 'opacity-100 text-gray-300' : 'opacity-50',
                        sortBy === col.key && sortOrder === 'desc' ? 'rotate-180' : 'rotate-0'
                      ]"
                    />
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- SKELETON -->
            <template v-if="loading">
              <tr
                v-for="i in limit"
                :key="`sk-${i}`"
                class="border-b border-gray-200 dark:border-gray-700"
              >
                <td v-for="j in headers.length" :key="j" class="px-5 py-4">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
                    :style="{ width: `${50 + (j % 4) * 12}%` }"
                  ></div>
                </td>
              </tr>
            </template>

            <!-- EMPTY -->
            <template v-else-if="rows.length === 0">
              <tr>
                <td
                  :colspan="headers.length"
                  class="py-20 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  {{ $t('nom_empty') }}
                </td>
              </tr>
            </template>

            <!-- DATA ROWS -->
            <template v-else>
              <tr
                v-for="row in rows"
                :key="row.id_request"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition dark:text-gray-200"
                @mousemove="onRowMouseMove($event, $t('nom_tooltip_detail'))"
                @mouseleave="onRowMouseLeave"
                @click="openRowModal(row)"
              >
                <td class="px-5 py-4" v-html="highlight(row.jenis, searchQuery)"></td>
                <td class="px-5 py-4" v-html="highlight(row.jabatan, searchQuery)"></td>
                <td class="px-5 py-4">
                  <div class="relative group max-w-[250px]">
                    <p
                      class="whitespace-normal break-words line-clamp-3"
                      v-html="highlight(row.perihal, searchQuery)"
                    ></p>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <div class="flex flex-col gap-0.5">
                    <div
                      class="text-sm font-medium"
                      v-html="highlight(row.tanggal, searchQuery)"
                    ></div>
                    <div class="text-xs text-gray-600 dark:text-gray-200 font-mono">
                      <div v-for="(nomor, idx) in row.nomor_list.slice(0, 3)" :key="idx">
                        <span v-html="highlight(nomor, searchQuery)"></span>
                      </div>
                      <div v-if="row.nomor_list.length > 3" class="text-primary font-medium">
                        +{{ row.nomor_list.length - 3 }} {{ $t('nom_nomor_lainnya') }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <div class="relative group max-w-[300px]">
                    <p
                      class="whitespace-normal break-words line-clamp-3"
                      v-html="highlight(row.pengusul, searchQuery)"
                    ></p>
                  </div>
                </td>
                <td class="px-5 py-4" v-html="highlight(row.waktu, searchQuery)"></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="pagination && pagination.total > 0 && rows.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ $t('menampilkan') }} {{ paginationStart }} - {{ paginationEnd }} {{ $t('dari') }}
          {{ pagination.total }} {{ $t('data') }}
        </div>
        <div class="flex items-center gap-2">
          <!-- Prev -->
          <button
            @click="goToPage((pagination.current_page || pagination.page) - 1)"
            :disabled="(pagination.current_page || pagination.page) === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              (pagination.current_page || pagination.page) === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
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
              v-if="paginationPages.length > 0 && paginationPages[0] > 1"
              @click="goToPage(1)"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                (pagination.current_page || pagination.page) === 1
                  ? 'bg-primary dark:bg-primary-700 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400'
              ]"
            >
              1
            </button>

            <span
              v-if="paginationPages.length > 0 && paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >

            <button
              v-for="page in paginationPages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                (pagination.current_page || pagination.page) === page
                  ? 'bg-primary dark:bg-primary-700 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400'
              ]"
            >
              {{ page }}
            </button>

            <span
              v-if="
                paginationPages.length > 0 &&
                paginationPages[paginationPages.length - 1] <
                  (pagination.total_pages || pagination.totalPages) - 1
              "
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >

            <button
              v-if="
                paginationPages.length > 0 &&
                paginationPages[paginationPages.length - 1] <
                  (pagination.total_pages || pagination.totalPages)
              "
              @click="goToPage(pagination.total_pages || pagination.totalPages)"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                (pagination.current_page || pagination.page) ===
                (pagination.total_pages || pagination.totalPages)
                  ? 'bg-primary dark:bg-primary-700 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400'
              ]"
            >
              {{ pagination.total_pages || pagination.totalPages }}
            </button>
          </div>

          <!-- Next -->
          <button
            @click="goToPage((pagination.current_page || pagination.page) + 1)"
            :disabled="
              (pagination.current_page || pagination.page) ===
              (pagination.total_pages || pagination.totalPages)
            "
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              (pagination.current_page || pagination.page) ===
              (pagination.total_pages || pagination.totalPages)
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
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

    <Teleport to="body">
      <AddUsulan v-model="openAdd" @submit="handleSubmitFromModal" />
    </Teleport>
  </div>

  <!-- FILE PREVIEW SLIDEOVER -->
  <Teleport to="body">
    <USlideover
      v-model:open="isOpenPreviewFile"
      :title="$t('nom_pratinjau_dokumen')"
      side="bottom"
      :dismissible="true"
      :ui="{ content: 'h-screen max-h-screen', body: 'p-0 h-full' }"
      class="z-[9999]"
    >
      <template #body>
        <div class="h-full w-full bg-gray-100">
          <iframe
            v-if="previewPdfUrl"
            :key="previewPdfUrl"
            :src="previewPdfUrl"
            allowfullscreen
            class="w-full h-full border-0"
          />
        </div>
      </template>
    </USlideover>
  </Teleport>

  <!-- MODAL DETAIL -->
  <Teleport to="body">
    <Modal v-model="openPreview" :hideDefaultFooter="true" size="xl" class="z-[8000]">
      <template #title>
        <div class="flex items-center justify-between w-full">
          <h2 class="p-3 ml-1 text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ $t('nom_modal_title') }}
          </h2>
        </div>
      </template>

      <div class="px-3 pb-6">
        <!-- Loading skeleton -->
        <div v-if="loadingDetail" class="space-y-3">
          <div class="w-full h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
          <div class="w-full h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
          <div class="w-full h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
        </div>

        <template v-else-if="detailData">
          <div class="gap-4 mb-2 space-y-6 overflow-y-auto text-sm">
            <!-- Perihal / Edit Title -->
            <div class="md:col-span-2">
              <template v-if="!isEditingTitle">
                <div class="flex items-start justify-between gap-4 mb-2">
                  <p class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                    {{ detailData.perihal }}
                  </p>
                  <button
                    @click="startEditTitle"
                    class="text-primary dark:text-primary-400 text-sm flex items-center gap-1 hover:underline flex-shrink-0"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    {{ $t('nom_edit') }}
                  </button>
                </div>
              </template>
              <template v-else>
                <div class="flex gap-2">
                  <input
                    v-model="editedTitle"
                    class="flex-1 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                  />
                  <button
                    @click="saveTitle"
                    class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-800 transition text-sm"
                  >
                    {{ $t('nom_btn_simpan') }}
                  </button>
                  <button
                    @click="cancelEditTitle"
                    class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
                  >
                    {{ $t('nom_btn_batal') }}
                  </button>
                </div>
              </template>
            </div>

            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">{{ $t('nom_modal_tanggal') }}</p>
              <p class="font-medium mt-1 dark:text-gray-200">
                {{ formatTanggalWIB(detailData.tanggal) }}
              </p>
            </div>
            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                {{ $t('nom_modal_penandatangan') }}
              </p>
              <p class="font-medium mt-1 dark:text-gray-200">{{ detailData.jabatan }}</p>
            </div>
            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                {{ $t('nom_modal_klasifikasi') }}
              </p>
              <p class="font-medium mt-1 dark:text-gray-200">
                {{ detailData.klasifikasiDisplay || detailData.klasifikasi }}
              </p>
            </div>
            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                {{ $t('nom_modal_jenis_naskah') }}
              </p>
              <p class="font-medium mt-1 dark:text-gray-200">{{ detailData.jenis }}</p>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- NOMOR SURAT SECTION                                           -->
          <!-- ============================================================ -->
          <div class="pt-6">
            <!-- Header row -->
            <div class="flex items-center justify-between mb-4">
              <h4
                class="text-l font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"
              >
                {{ $t('nom_nomor_surat') }}
                <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({{
                    detailData.is_single_file
                      ? detailData.jumlah
                      : detailData.nomor_list?.length || 0
                  }}
                  {{ $t('nom_nomor_suffix') }})
                </span>
              </h4>
              <!-- Single File badge -->
              <span
                v-if="detailData.is_single_file"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-primary/30 bg-primary/5 text-blue-700 dark:text-blue-400 dark:bg-primary/10 dark:border-primary/20"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
                  />
                </svg>
                Single File
              </span>
            </div>

            <!-- ============================================================ -->
            <!-- MODE: SINGLE FILE                                             -->
            <!-- ============================================================ -->
            <template v-if="detailData.is_single_file">
              <!-- Shared file card -->
              <div
                class="mb-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800"
              >
                <!-- File preview — selalu tampil jika ada file (termasuk saat semua hangus) -->
                <div
                  v-if="singleFileData.file_name && !singleFileState.isReplacing"
                  :class="[
                    'flex items-start gap-3 p-4 cursor-pointer transition border-b',
                    allNomorHangus
                      ? 'bg-gray-50/80 dark:bg-gray-800/60 hover:bg-gray-100/80 dark:hover:bg-gray-700/40 border-gray-200 dark:border-gray-700 opacity-80'
                      : 'bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-100/60 dark:hover:bg-blue-900/20 border-blue-100 dark:border-blue-900/30'
                  ]"
                  @click="previewSharedFile"
                >
                  <div
                    :class="[
                      'flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg',
                      allNomorHangus
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : 'bg-blue-100 dark:bg-blue-900/40'
                    ]"
                  >
                    <svg
                      :class="[
                        'w-5 h-5',
                        allNomorHangus
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-primary dark:text-blue-400'
                      ]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p
                      :class="[
                        'text-sm font-semibold underline truncate',
                        allNomorHangus
                          ? 'text-gray-500 dark:text-gray-400 line-through'
                          : 'text-primary dark:text-blue-400'
                      ]"
                    >
                      {{ singleFileData.file_name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {{ $t('nom_file_klik_preview') }} ·
                      <span
                        :class="allNomorHangus ? 'text-red-500 dark:text-red-400 font-medium' : ''"
                      >
                        {{
                          allNomorHangus ? 'Semua nomor telah hangus' : 'Berlaku untuk semua nomor'
                        }}
                      </span>
                    </p>
                  </div>
                </div>

                <!-- No file yet placeholder — hanya tampil jika belum ada file DAN belum hangus semua -->
                <div
                  v-else-if="
                    !singleFileData.file_name && !singleFileState.isReplacing && !allNomorHangus
                  "
                  class="p-4 border-b border-gray-100 dark:border-gray-700"
                >
                  <p class="text-sm text-gray-400 dark:text-gray-500 italic text-center py-1">
                    Belum ada file yang diupload
                  </p>
                </div>

                <!-- File input (shown when isReplacing) -->
                <div
                  v-if="singleFileState.isReplacing"
                  class="p-4 border-b border-dashed border-primary/40 dark:border-primary/30 bg-blue-50/50 dark:bg-blue-900/10"
                >
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                    {{
                      singleFileData.file_name
                        ? $t('nom_file_pilih_pengganti')
                        : $t('nom_file_pilih_upload')
                    }}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    @change="handleSingleFileSelect"
                    class="block w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 dark:text-gray-200 cursor-pointer"
                  />
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    {{ $t('nom_file_max_size') }}
                  </p>
                </div>

                <!-- ── Action buttons ── -->
                <!-- Hidden entirely when all nomor are hangus -->
                <div v-if="!allNomorHangus" class="flex gap-2 p-3">
                  <!-- State A: no file, idle → Upload File -->
                  <button
                    v-if="!singleFileData.file_name && !singleFileState.isReplacing"
                    @click="singleFileState.isReplacing = true"
                    class="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                  >
                    {{ $t('nom_btn_upload_file') }}
                  </button>

                  <!-- State B: file exists, idle → [Ganti File] [Batal/hangus] -->
                  <template v-if="singleFileData.file_name && !singleFileState.isReplacing">
                    <button
                      @click="singleFileState.isReplacing = true"
                      class="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
                    >
                      {{ $t('nom_btn_ganti_file') }}
                    </button>
                    <!-- Batal = hangus semua nomor aktif -->
                    <button
                      @click="confirmHangusSharedFile"
                      class="flex-1 px-3 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition text-sm font-medium"
                    >
                      {{ $t('nom_btn_batal') }}
                    </button>
                  </template>

                  <!-- State C: isReplacing → [Simpan File] [Batal cancel] -->
                  <template v-if="singleFileState.isReplacing">
                    <button
                      @click="saveSingleFile"
                      :disabled="!singleFileState.file || singleFileState.isUploading"
                      :class="[
                        'flex-1 px-4 py-2 rounded-lg transition text-sm font-medium',
                        !singleFileState.file || singleFileState.isUploading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      ]"
                    >
                      {{
                        singleFileState.isUploading
                          ? $t('nom_btn_uploading')
                          : $t('nom_btn_simpan_file')
                      }}
                    </button>
                    <button
                      @click="
                        ((singleFileState.isReplacing = false), (singleFileState.file = null))
                      "
                      :disabled="singleFileState.isUploading"
                      class="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 text-sm font-medium"
                    >
                      {{ $t('nom_btn_batal') }}
                    </button>
                  </template>
                </div>
              </div>

              <!-- Compact nomor list -->
              <div
                v-if="detailData.nomor_list && detailData.nomor_list.length > 0"
                class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                <div
                  v-for="(item, idx) in detailData.nomor_list"
                  :key="item.id || `nomor-${idx}`"
                  :class="[
                    'flex items-center gap-3 px-4 py-3 transition',
                    Number(idx) < detailData.nomor_list.length - 1
                      ? 'border-b border-gray-100 dark:border-gray-700'
                      : '',
                    item.status === 'hangus'
                      ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  ]"
                >
                  <span
                    class="text-xs text-gray-400 dark:text-gray-500 w-5 text-right flex-shrink-0"
                  >
                    {{ Number(idx) + 1 }}.
                  </span>
                  <span
                    :class="[
                      'flex-1 font-mono text-sm',
                      item.status === 'hangus'
                        ? 'line-through text-gray-400'
                        : 'text-gray-800 dark:text-gray-200'
                    ]"
                  >
                    {{ item.nomor }}
                  </span>
                  <button
                    v-if="item.status !== 'hangus'"
                    @click="handleCopy(item.nomor)"
                    class="p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition flex-shrink-0"
                  >
                    <Copy class="w-3.5 h-3.5 text-gray-500 dark:text-gray-300" />
                  </button>
                  <span
                    :class="[
                      'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
                      getStatusClass(item)
                    ]"
                  >
                    {{ getStatusLabel(item) }}
                  </span>
                </div>
              </div>
            </template>
            <!-- ── end single file ── -->

            <!-- ============================================================ -->
            <!-- MODE: MULTI FILE (original per-nomor cards)                  -->
            <!-- ============================================================ -->
            <template v-else>
              <div
                v-if="detailData.nomor_list && detailData.nomor_list.length > 0"
                class="space-y-4"
              >
                <div
                  v-for="(item, idx) in detailData.nomor_list"
                  :key="item.id || `nomor-${idx}`"
                  :class="[
                    'border rounded-lg p-4 hover:shadow-md transition',
                    item.status === 'hangus'
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 opacity-60'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                  ]"
                >
                  <div class="flex items-center gap-3 mb-3">
                    <div
                      class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-4 py-2"
                    >
                      <div class="flex justify-between items-center">
                        <span
                          :class="[
                            'font-mono text-sm',
                            item.status === 'hangus'
                              ? 'line-through text-gray-400'
                              : 'dark:text-gray-200'
                          ]"
                        >
                          {{ Number(idx) + 1 }}. {{ item.nomor }}
                        </span>
                        <span
                          :class="[
                            'px-3 py-1 rounded-full text-xs font-medium',
                            getStatusClass(item)
                          ]"
                        >
                          {{ getStatusLabel(item) }}
                        </span>
                      </div>
                    </div>
                    <button
                      v-if="item.status !== 'hangus'"
                      @click="handleCopy(item.nomor)"
                      class="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Copy class="w-4 h-4 dark:text-gray-300" />
                    </button>
                  </div>

                  <div
                    v-if="item.file_name && !fileStates[item.id]?.isReplacing"
                    :class="[
                      'flex items-start border rounded-md p-3 transition',
                      item.status === 'hangus'
                        ? 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 opacity-70'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    ]"
                    @click="previewFile(item)"
                  >
                    <svg
                      class="w-6 h-6 text-primary dark:text-blue-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div class="flex-1 min-w-0 ml-3">
                      <p
                        :class="[
                          'text-sm font-medium truncate',
                          item.status === 'hangus'
                            ? 'text-gray-500 dark:text-gray-400 underline'
                            : 'text-primary dark:text-blue-400 underline'
                        ]"
                      >
                        {{ item.file_name }}
                      </p>
                      <p
                        :class="[
                          'text-xs mt-0.5',
                          item.status === 'hangus'
                            ? 'text-gray-400 dark:text-gray-500'
                            : 'text-gray-500 dark:text-gray-400'
                        ]"
                      >
                        {{ $t('nom_file_klik_preview') }}
                      </p>
                    </div>
                  </div>

                  <div
                    v-if="fileStates[item.id]?.isReplacing"
                    class="border border-dashed border-primary/40 dark:border-primary/30 rounded-md p-3 bg-blue-50/50 dark:bg-blue-900/10"
                  >
                    <p class="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                      {{
                        item.file_name
                          ? $t('nom_file_pilih_pengganti')
                          : $t('nom_file_pilih_upload')
                      }}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      @change="handleFileSelect(item.id, $event)"
                      class="block w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 dark:text-gray-200 cursor-pointer"
                    />
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                      {{ $t('nom_file_max_size') }}
                    </p>
                  </div>

                  <div class="flex gap-2 mt-3">
                    <button
                      v-if="
                        !item.file_name &&
                        item.status !== 'hangus' &&
                        (item.status === 'terpakai' || item.status === 'booking') &&
                        !fileStates[item.id]?.isReplacing
                      "
                      @click="startUploadFile(item.id)"
                      class="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition text-sm"
                    >
                      {{ $t('nom_btn_upload_file') }}
                    </button>
                    <button
                      v-if="
                        item.file_name &&
                        item.status !== 'hangus' &&
                        (item.status === 'terpakai' || item.status === 'terpakai_final') &&
                        !fileStates[item.id]?.isReplacing
                      "
                      @click="startReplacingFile(item.id)"
                      class="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm"
                    >
                      {{ $t('nom_btn_ganti_file') }}
                    </button>
                    <template v-if="fileStates[item.id]?.isReplacing">
                      <button
                        @click="saveFile(item.id)"
                        :disabled="!fileStates[item.id]?.file || fileStates[item.id]?.isUploading"
                        :class="[
                          'flex-1 px-4 py-2 rounded-lg transition text-sm',
                          !fileStates[item.id]?.file || fileStates[item.id]?.isUploading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        ]"
                      >
                        {{
                          fileStates[item.id]?.isUploading
                            ? $t('nom_btn_uploading')
                            : $t('nom_btn_simpan_file')
                        }}
                      </button>
                      <button
                        @click="cancelReplacing(item.id)"
                        :disabled="fileStates[item.id]?.isUploading"
                        class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 text-sm"
                      >
                        {{ $t('nom_btn_batal') }}
                      </button>
                    </template>
                    <button
                      v-if="
                        item.status !== 'hangus' &&
                        (item.status === 'terpakai' || item.status === 'terpakai_final') &&
                        !fileStates[item.id]?.isReplacing
                      "
                      @click.stop="confirmHangusNomor(item.id)"
                      class="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                    >
                      {{ $t('nom_btn_hangus') }}
                    </button>
                  </div>
                </div>
              </div>
            </template>
            <!-- ── end multi file ── -->
          </div>
        </template>
      </div>
    </Modal>
  </Teleport>

  <!-- CONFIRM HANGUS -->
  <ConfirmPopup
    v-model="openConfirmHangus"
    type="danger"
    :title="$t('nom_confirm_hangus_title')"
    :message="$t('nom_confirm_hangus_message')"
    :confirm-text="$t('nom_confirm_hangus_ya')"
    :cancel-text="$t('nom_confirm_hangus_batal')"
    :is-loading="isHangusing"
    @confirm="executeHangusNomor"
    class="z-[8500]"
  />

  <!-- TOOLTIP -->
  <Teleport to="body">
    <div
      v-if="tooltip.show"
      class="fixed z-[9999] pointer-events-none bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      {{ tooltip.text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, ArrowUpDown, Plus, Copy, ChevronDown } from 'lucide-vue-next'
import AddUsulan from '~/components/AddUsulan.vue'
import Heading from '~/components/Heading.vue'
import PageHeader from '~/components/PageHeader.vue'
import { Modal } from '#components'
import ConfirmPopup from '~/components/ConfirmPopup.vue'
import { usePenomoran } from '~/composables/usePenomoran'
import * as XLSX from 'xlsx'
import { formatDateSlash as formatTanggalWIB, formatTimeShort as formatWaktuWIB } from '~/utils/mail-helpers'
definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const { canAccessPage } = useFeatureAccess()
const { hasPermission } = useAuth()
const config = useRuntimeConfig()

const {
  createPenomoranFinal,
  getDetailNomor,
  uploadDetailFile,
  hangusDetailNomor,
  getListNomor,
  refreshTrigger,
  showToastFileNotFound,
  showToastGagalPreview,
  showToastFileTooLargeAdmin,
  showToastPilihFile,
  showToastSaveTitle,
  showToastPenomoranSuccess,
  showToastCopied
} = usePenomoran()

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref<boolean>(true)
const loadingDetail = ref<boolean>(false)
const openAdd = ref<boolean>(false)
const openPreview = ref(false)
const openConfirmHangus = ref(false)
const isHangusing = ref(false)
const selectedRow = ref<any>(null)
const detailData = ref<any>(null)
const rows = ref<any[]>([])
const pagination = ref<any>(null)

// ✅ Array untuk menampung semua id yang akan di-hangus (single atau multi)
const selectedDetailIds = ref<string[]>([])

const fileStates = ref<Record<string, any>>({})
const isEditingTitle = ref(false)
const editedTitle = ref('')

const searchQuery = ref<string>('')
const limit = ref<number>(10)
const currentPage = ref<number>(1)
const sortBy = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('desc')
const rowsChoices = [10, 25, 50, 100]
const showRowsDropdown = ref<boolean>(false)
const isExporting = ref(false)
const rowsRef = ref<HTMLElement | null>(null)

const getFileUrl = (filePath: string) => `${config.public.apiBaseUrl}/${filePath}`

// ─── Single-file mode state ───────────────────────────────────────────────────
const singleFileData = reactive({
  file_name: null as string | null,
  file_url: null as string | null,
  file_text: null as string | null
})
const singleFileState = reactive({
  isReplacing: false,
  isUploading: false,
  file: null as File | null
})

const resetSingleFile = () => {
  singleFileData.file_name = null
  singleFileData.file_url = null
  singleFileData.file_text = null
  singleFileState.isReplacing = false
  singleFileState.isUploading = false
  singleFileState.file = null
}

// ─── Computed: apakah SEMUA nomor sudah hangus (single file mode) ─────────────
const allNomorHangus = computed(() => {
  if (!detailData.value?.is_single_file) return false
  const list = detailData.value?.nomor_list ?? []
  return list.length > 0 && list.every((n: any) => n.status === 'hangus')
})

const handleSingleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    showToastFileTooLargeAdmin()
    return
  }
  singleFileState.file = file
}

const saveSingleFile = async () => {
  if (!singleFileState.file) {
    showToastPilihFile()
    return
  }
  // Cari nomor pertama yang belum hangus sebagai target upload
  const firstActiveItem = detailData.value?.nomor_list?.find((n: any) => n.status !== 'hangus')
  if (!firstActiveItem) return

  singleFileState.isUploading = true
  try {
    const result = await uploadDetailFile(firstActiveItem.id, singleFileState.file)
    singleFileData.file_name = result?.file_name || singleFileState.file.name
    singleFileData.file_url = result?.file_url || null
    singleFileData.file_text = result?.file_text || null

    // Mirror onto all nomor items that are not hangus
    detailData.value?.nomor_list.forEach((n: any) => {
      if (n.status !== 'hangus') {
        n.file_name = singleFileData.file_name
        n.file_text = singleFileData.file_text
        n.file_url = singleFileData.file_url
        n.status = result?.status || 'terpakai_final'
      }
    })

    singleFileState.isReplacing = false
    singleFileState.file = null
  } catch (err) {
    console.error('❌ saveSingleFile error:', err)
  } finally {
    singleFileState.isUploading = false
  }
}

const previewSharedFile = () => {
  const url =
    singleFileData.file_url ||
    (singleFileData.file_text ? getFileUrl(singleFileData.file_text) : null)
  if (!url) {
    showToastFileNotFound()
    return
  }
  previewPdfUrl.value = url
  isOpenPreviewFile.value = true
}

// ─── Hangus ────────────────────────────────────────────────────────────────────

// Single file: hangus semua nomor yang masih aktif
const confirmHangusSharedFile = () => {
  const activeItems = detailData.value?.nomor_list?.filter((n: any) => n.status !== 'hangus')
  if (!activeItems?.length) return
  selectedDetailIds.value = activeItems.map((n: any) => n.id)
  openConfirmHangus.value = true
}

// Multi file: hangus 1 nomor
const confirmHangusNomor = (detailId: string) => {
  selectedDetailIds.value = [detailId]
  openConfirmHangus.value = true
}

const executeHangusNomor = async () => {
  if (!selectedDetailIds.value?.length) return
  isHangusing.value = true
  try {
    // Hit endpoint hangus untuk setiap id secara paralel
    await Promise.all(selectedDetailIds.value.map((id) => hangusDetailNomor(id)))

    // Update status lokal
    selectedDetailIds.value.forEach((id) => {
      const target = detailData.value?.nomor_list?.find((n: any) => n.id === id)
      if (target) target.status = 'hangus'
    })

    // Jika single file dan semua sudah hangus → reset shared file card
    if (detailData.value?.is_single_file) {
      resetSingleFile()
    }

    openConfirmHangus.value = false
    selectedDetailIds.value = []
  } catch (error: any) {
    console.error('❌ Error hangus nomor:', error)
  } finally {
    isHangusing.value = false
  }
}

// ─── Computed breadcrumbs & headers ──────────────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('nom_title'), to: '/penomoran/nomor' }
])
const headers = computed(() => [
  { label: t('nom_col_jenis'), key: 'jenis', sortable: true },
  { label: t('nom_col_penandatangan'), key: 'jabatan', sortable: false },
  { label: t('nom_col_perihal'), key: 'perihal', sortable: false },
  { label: t('nom_col_tanggal_nomor'), key: 'tanggal', sortable: true },
  { label: t('nom_col_pengusul'), key: 'pengusul', sortable: false },
  { label: t('nom_col_waktu'), key: 'waktu', sortable: true }
])

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const highlight = (text: string | number | null | undefined, keyword: string) => {
  const safeText = escapeHtml(String(text ?? '-'))
  const q = keyword.trim()
  if (!q) return safeText

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')

  return safeText.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">$1</mark>'
  )
}

// ─── Status helpers ────────────────────────────────────────────────────────────
const getStatusLabel = (item: any): string => {
  if (item.status === 'hangus') return t('nom_status_hangus')
  if (item.status === 'terpakai_final') return t('nom_status_final')
  if (item.status === 'terpakai') return t('nom_status_terpakai')
  return t('nom_status_booking')
}
const getStatusClass = (item: any): string => {
  if (item.status === 'hangus') return 'bg-red-100 text-red-800'
  if (item.status === 'terpakai_final') return 'bg-green-100 text-green-800'
  if (item.status === 'terpakai') return 'bg-blue-100 text-blue-800'
  return 'bg-yellow-100 text-yellow-800'
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

// ─── Preview file ─────────────────────────────────────────────────────────────
const isOpenPreviewFile = ref(false)
const previewPdfUrl = ref<string | null>(null)
const previewFile = async (item: any) => {
  const fileUrl = item.file_url || (item.file_text ? getFileUrl(item.file_text) : null)
  if (!fileUrl) {
    showToastFileNotFound()
    return
  }
  try {
    previewPdfUrl.value = null
    previewPdfUrl.value = fileUrl
    isOpenPreviewFile.value = true
  } catch (err) {
    console.error('❌ Error preview file:', err)
    showToastGagalPreview()
  }
}

// ─── Multi-file actions ────────────────────────────────────────────────────────
const startUploadFile = (detailId: string) => {
  fileStates.value[detailId] = { isReplacing: true, isUploading: false, file: null }
}
const startReplacingFile = (detailId: string) => {
  fileStates.value[detailId] = { isReplacing: true, isUploading: false, file: null }
}
const handleFileSelect = (detailId: string, event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      showToastFileTooLargeAdmin()
      return
    }
    fileStates.value[detailId].file = file
  }
}
const saveFile = async (detailId: string) => {
  const state = fileStates.value[detailId]
  if (!state?.file) {
    showToastPilihFile()
    return
  }
  state.isUploading = true
  try {
    const result = await uploadDetailFile(detailId, state.file)
    const target = detailData.value?.nomor_list?.find((n: any) => n.id === detailId)
    if (target) {
      target.file_name = result?.file_name || state.file.name
      target.file_text = result?.file_text || null
      target.file_url = result?.file_url || null
      target.status = result?.status || 'terpakai_final'
    }
    delete fileStates.value[detailId]
  } catch (error: any) {
    console.error('❌ Error upload file:', error)
  } finally {
    state.isUploading = false
  }
}
const cancelReplacing = (detailId: string) => {
  delete fileStates.value[detailId]
}

// ─── Edit title ────────────────────────────────────────────────────────────────
function startEditTitle() {
  if (!detailData.value) return
  editedTitle.value = detailData.value.perihal
  isEditingTitle.value = true
}
function cancelEditTitle() {
  isEditingTitle.value = false
  editedTitle.value = ''
}
function saveTitle() {
  if (!detailData.value) return
  detailData.value.perihal = editedTitle.value
  isEditingTitle.value = false
  showToastSaveTitle()
}

// ─── Copy ──────────────────────────────────────────────────────────────────────
const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value)
  showToastCopied(value)
}

// ─── Sort & search ─────────────────────────────────────────────────────────────
const handleSort = (col: string) => {
  const columnMapping: Record<string, string> = {
    jenis: 'jenis',
    tanggal: 'tanggal',
    waktu: 'waktu'
  }
  const backendColumn = columnMapping[col] || col
  if (sortBy.value === backendColumn) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = backendColumn
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
  fetchData()
}
const handleLimitChange = () => {
  currentPage.value = 1
  fetchData()
}
let searchTimeout: any = null
const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 500)
}
const goToPage = (page: number) => {
  if (!pagination.value) return
  const totalPages = pagination.value.total_pages || pagination.value.totalPages || 1
  if (page < 1 || page > totalPages) return
  currentPage.value = page
  fetchData()
}

// ─── Export Excel ──────────────────────────────────────────────────────────────
const handleExport = async () => {
  if (isExporting.value || rows.value.length === 0) return
  isExporting.value = true
  try {
    let exportRows = rows.value

    if (pagination.value && pagination.value.total > limit.value) {
      const res = await getListNomor({
        page: 1,
        limit: pagination.value.total,
        search: searchQuery.value || undefined,
        sort_by: sortBy.value || undefined,
        sort_order: sortOrder.value || undefined
      })
      if (res?.data && Array.isArray(res.data)) {
        exportRows = groupDuplicateRows(res.data)
      }
    }

    const sheetData = exportRows.map((row: any, idx: number) => ({
      No: idx + 1,
      'Jenis Naskah': row.jenis,
      Penandatangan: row.jabatan,
      Perihal: row.perihal,
      'Nomor Surat': row.nomor_list?.join(', ') || '-',
      Tanggal: row.tanggal,
      Pengusul: row.pengusul,
      Waktu: row.waktu
    }))

    if (!sheetData.length) return

    const ws = XLSX.utils.json_to_sheet(sheetData)
    const colWidths = Object.keys(sheetData[0]).map((key) => ({
      wch: Math.max(key.length, ...sheetData.map((r: any) => String(r[key] ?? '').length)) + 2
    }))
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Nomor Surat')

    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    XLSX.writeFile(wb, `NomorSurat_${dateStr}.xlsx`)

    toast.add({
      title: t('nom_export_success_title') || 'Export Berhasil',
      description: `${sheetData.length} data berhasil diexport`,
      color: 'success'
    })
  } catch (e) {
    console.error('❌ Error export:', e)
    toast.add({
      title: t('nom_export_error_title') || 'Export Gagal',
      description: 'Terjadi kesalahan saat export data',
      color: 'error'
    })
  } finally {
    isExporting.value = false
  }
}
const toast = useToast()
// ─── Pagination computed ──────────────────────────────────────────────────────
const paginationStart = computed(() => {
  if (!pagination.value || !pagination.value.total || rows.value.length === 0) return 0
  const page = pagination.value.current_page || pagination.value.page || 1
  return (page - 1) * (pagination.value.limit || limit.value || 10) + 1
})
const paginationEnd = computed(() => {
  if (!pagination.value || !pagination.value.total || rows.value.length === 0) return 0
  const page = pagination.value.current_page || pagination.value.page || 1
  return Math.min(page * (pagination.value.limit || limit.value || 10), pagination.value.total)
})
const paginationPages = computed(() => {
  if (!pagination.value) return []
  const total = pagination.value.total_pages || pagination.value.totalPages || 0
  const current = pagination.value.current_page || pagination.value.page || 1
  if (total === 0) return []
  const pages: number[] = []
  if (total <= 9) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    let start = Math.max(2, current - 3),
      end = Math.min(total - 1, current + 3)
    if (current <= 4) end = 7
    if (current >= total - 3) start = total - 6
    for (let i = start; i <= end; i++) pages.push(i)
  }
  return pages
})

// ─── Fetch data ────────────────────────────────────────────────────────────────
function groupDuplicateRows(dataArray: any[]) {
  const grouped = new Map()
  dataArray.forEach((item: any) => {
    const key = item.id_request
    if (grouped.has(key)) {
      grouped.get(key).nomor_list.push(item.nomor)
    } else {
      grouped.set(key, {
        id_request: item.id_request,
        jenis: item.jenis,
        jabatan: item.jabatan || '-',
        perihal: item.perihal || '-',
        pengusul: item.nama_pengirim || '-',
        klasifikasi: item.klasifikasi || '-',
        klasifikasiDisplay: item.klasifikasi || '-',
        nomor_list: [item.nomor],
        tanggal: formatTanggalWIB(item.tanggal),
        waktu: formatWaktuWIB(item.waktu)
      })
    }
  })
  return Array.from(grouped.values())
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, limit: limit.value }
    if (searchQuery.value) params.search = searchQuery.value
    if (sortBy.value) {
      params.sort_by = sortBy.value
      params.sort_order = sortOrder.value
    }
    const response = await getListNomor(params)
    if (response?.data && Array.isArray(response.data)) {
      rows.value = groupDuplicateRows(response.data)
      pagination.value = response.pagination || null
    } else {
      rows.value = []
      pagination.value = null
    }
  } catch (error) {
    console.error('❌ Error fetch data:', error)
    rows.value = []
    pagination.value = null
  } finally {
    loading.value = false
  }
}

const openRowModal = async (row: any) => {
  selectedRow.value = row
  openPreview.value = true
  loadingDetail.value = true
  detailData.value = null
  fileStates.value = {}
  resetSingleFile()
  try {
    const detail = await getDetailNomor(row.id_request)
    if (!detail) throw new Error('Detail tidak ditemukan')
    const nomorList = (detail?.nomor_list || []).map((item: any, idx: any) => ({
      id: item.id || `${row.id_request}-${idx}`,
      nomor: item.nomor,
      status: item.status || 'terpakai',
      file_name: item.file_name ?? null,
      file_text: item.file_text ?? null,
      file_url: item.file_url ?? null
    }))
    detailData.value = {
      ...detail,
      perihal: detail.perihal || row.perihal || '-',
      jabatan: detail.jabatan || row.jabatan || '-',
      jenis: detail.jenis || row.jenis || '-',
      klasifikasiDisplay: detail.klasifikasi || row.klasifikasi || '-',
      tanggal: detail.tanggal || row.tanggal,
      jumlah: detail.is_single_file ? detail.jumlah : nomorList.length,
      is_single_file: !!detail.is_single_file,
      nomor_list: nomorList
    }
    // Populate shared file for single-file mode
    // Cari dari nomor yang masih aktif (belum hangus) dulu, kalau semua hangus pakai nomor pertama
    const activeNomor = nomorList.find((n: any) => n.status !== 'hangus')
    const sourceNomor = activeNomor || nomorList[0]
    if (detail.is_single_file && sourceNomor?.file_name) {
      singleFileData.file_name = sourceNomor.file_name
      singleFileData.file_url = sourceNomor.file_url
      singleFileData.file_text = sourceNomor.file_text
    }
  } catch (err) {
    console.error('❌ Error loading detail:', err)
    detailData.value = {
      ...row,
      klasifikasiDisplay: row.klasifikasi,
      jumlah: row.nomor_list?.length || 0,
      is_single_file: false,
      nomor_list: (row.nomor_list || []).map((nomor: any, idx: any) => ({
        id: `${row.id_request}-${idx}`,
        nomor: typeof nomor === 'string' ? nomor : nomor.nomor,
        status: typeof nomor === 'string' ? 'terpakai' : nomor.status || 'terpakai',
        file_name: null,
        file_text: null,
        file_url: null
      }))
    }
  } finally {
    loadingDetail.value = false
  }
}

const handleSubmitFromModal = async (payload: any) => {
  try {
    const response = await createPenomoranFinal(payload)
    currentPage.value = 1
    sortBy.value = 'waktu'
    sortOrder.value = 'desc'
    searchQuery.value = ''
    await fetchData()
    showToastPenomoranSuccess(response?.data?.nomor_list?.length || payload.jumlah)
  } catch (error) {
    console.error('❌ Error di handleSubmitFromModal:', error)
  }
}

watch(refreshTrigger, () => {
  fetchData()
  if (openPreview.value && selectedRow.value) openRowModal(selectedRow.value)
})
watch(isOpenPreviewFile, (open) => {
  if (!open) previewPdfUrl.value = null
})

const selectLimit = (n: number) => {
  limit.value = n
  showRowsDropdown.value = false
  handleLimitChange()
}
const handleClickOutside = (e: MouseEvent) => {
  if (rowsRef.value && !rowsRef.value.contains(e.target as HTMLElement))
    showRowsDropdown.value = false
}
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
onMounted(async () => {
  if (!canAccessPage()) return;
  document.addEventListener('click', handleClickOutside)
  loading.value = true
  sortBy.value = 'waktu'
  sortOrder.value = 'desc'
  await fetchData()
  loading.value = false
})

const tooltip = ref({ show: false, text: '', x: 0, y: 0 })
const onRowMouseMove = (e: MouseEvent, text: string) => {
  tooltip.value = {
    show: true,
    text,
    x: Math.min(e.clientX + 12, window.innerWidth - 200),
    y: Math.min(e.clientY + 12, window.innerHeight - 40)
  }
}
const onRowMouseLeave = () => {
  tooltip.value.show = false
}
</script>

<style scoped>
.rows-dd-enter-active,
.rows-dd-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}
.rows-dd-enter-from,
.rows-dd-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-4px);
}
.rows-dd-enter-to,
.rows-dd-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.15s ease-out;
}
thead th:last-child {
  z-index: 11;
}
tbody tr:hover td:last-child {
  background-color: rgb(249 250 251);
}
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
