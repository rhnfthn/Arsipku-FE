<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- AKSES DITOLAK -->
    <AccessDenied v-if="!canAccessPage()" />
    <!-- KONTEN -->
    <div v-else>
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          {{ $t('ver_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <!-- CARD -->
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl w-full">
      <!-- TOP BAR -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 p-3.5">
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
            <Transition name="rows-dd">
              <div
                v-if="showRowsDropdown"
                class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  v-for="n in rowsChoices"
                  :key="n"
                  type="button"
                  @click.stop="selectRowsPerPage(n)"
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
        <div class="relative" data-custom-dropdown>
          <button
            type="button"
            @click.stop="openFilterStatus = !openFilterStatus"
            class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[180px] justify-between"
          >
            <span class="truncate">{{ currentFilterLabel }}</span>
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
                  filterStatus === item.value
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
            @input="handleSearchInput"
            :placeholder="$t('ver_cari_placeholder')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm dark:text-gray-200 pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>

        <!-- EXPORT BUTTON -->
        <button
          v-if="hasPermission('penomoran', 'export-verifikasi')"
          type="button"
          @click="openExportModal"
          :disabled="isExporting || sortedRows.length === 0"
          class="flex items-center gap-2 h-9 px-4 text-sm font-medium bg-primary hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-900 text-white rounded-lg transition whitespace-nowrap"
        >
          <span>{{
            isExporting
              ? $t('ver_btn_mengekspor') || 'Mengekspor...'
              : $t('ver_btn_export') || 'Export'
          }}</span>
        </button>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="min-w-max bg-white dark:bg-gray-800 text-sm w-full">
          <thead class="bg-primary dark:bg-primary-800 text-white text-[15px]">
            <tr>
              <th
                v-for="col in headers"
                :key="col.key"
                @click="col.sortable && handleSort(col.key)"
                :class="[
                  'px-5 py-3 text-left font-semibold tracking-wide whitespace-nowrap',
                  col.sortable
                    ? 'cursor-pointer select-none hover:bg-primary-600 dark:hover:bg-primary-800 transition'
                    : 'cursor-default'
                ]"
              >
                <div class="flex items-center gap-2">
                  <span>{{ col.label }}</span>
                  <ArrowUpDown
                    v-if="col.sortable"
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortBy === col.key
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>
              <th
                @click="handleSort('status')"
                class="sticky right-0 z-30 bg-primary dark:bg-primary-800 text-white px-5 py-3 border-l border-gray-200 shadow-[inset_1px_0_1px_-1px_rgba(0,0,0,9)] cursor-pointer select-none hover:bg-primary-600 dark:hover:bg-primary-800 transition"
              >
                <div class="flex items-center gap-2">
                  <span>{{ $t('ver_col_status') }}</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortBy === 'status'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- SKELETON -->
            <template v-if="loading">
              <tr
                v-for="i in rowsPerPage"
                :key="`sk-${i}`"
                class="border-b border-gray-200 dark:border-gray-700"
              >
                <td v-for="j in headers.length" :key="j" class="px-5 py-4">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
                    :style="{ width: `${55 + (j % 4) * 10}%` }"
                  ></div>
                </td>
                <td
                  class="sticky right-0 z-20 bg-white dark:bg-gray-800 px-5 py-3 border-l border-gray-200 dark:border-gray-700 shadow-[inset_1px_0_1px_-1px_rgba(0,0,0,9)]"
                >
                  <div
                    class="h-6 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"
                  ></div>
                </td>
              </tr>
            </template>

            <!-- EMPTY -->
            <template v-else-if="rows.length === 0">
              <tr>
                <td
                  :colspan="headers.length + 1"
                  class="py-20 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  {{ $t('ver_empty') }}
                </td>
              </tr>
            </template>

            <!-- DATA ROWS -->
            <template v-else>
              <tr
                v-for="row in rows"
                :key="row.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition"
                @mousemove="onRowMouseMove($event, $t('ver_tooltip_detail'))"
                @mouseleave="onRowMouseLeave"
                @click="showPreview(row)"
              >
                <td class="px-5 py-4 dark:text-gray-300" v-html="highlight(row.jenis, search)"></td>
                <td
                  class="px-5 py-4 dark:text-gray-300"
                  v-html="highlight(row.tanggal, search)"
                ></td>
                <td class="px-5 py-4">
                  <div class="relative group max-w-[350px]">
                    <p
                      class="whitespace-normal break-words line-clamp-3 dark:text-gray-300"
                      v-html="highlight(row.perihal || '-', search)"
                    ></p>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <div class="relative group max-w-[300px]">
                    <p
                      class="whitespace-normal break-words line-clamp-3 dark:text-gray-300"
                      v-html="highlight(row.penandatangan, search)"
                    ></p>
                  </div>
                </td>
                <td
                  class="px-5 py-4 dark:text-gray-300"
                  v-html="highlight(row.jumlah, search)"
                ></td>
                <td
                  class="px-5 py-4 dark:text-gray-300"
                  v-html="highlight(row.pengusul, search)"
                ></td>
                <td
                  class="px-5 py-4 dark:text-gray-300"
                  v-html="highlight(row.tglUsulan, search)"
                ></td>
                <td
                  class="sticky right-0 z-20 bg-white dark:bg-gray-800 px-5 py-3 border-l border-gray-200 dark:border-gray-700 shadow-[inset_1px_0_1px_-1px_rgba(0,0,0,9)]"
                >
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                      {
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':
                          row.status === 'Menunggu Verifikasi',
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400':
                          row.status === 'Disetujui',
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400':
                          row.status === 'Ditolak'
                      }
                    ]"
                  >
                    <span v-html="highlight(getRowStatusLabel(row.status), search)"></span>
                  </span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="rows.length > 0 && pagination"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ $t('menampilkan') }} {{ rows.length }} {{ $t('dari') }} {{ pagination.total }}
          {{ $t('data') }}
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
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
              v-if="paginationPages[0] > 1"
              @click="handlePageChange(1)"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary transition-all"
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
              @click="handlePageChange(page)"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary'
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
              @click="handlePageChange(totalPages)"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
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
  </div>

  <!-- MODAL VERIFIKASI -->
  <Teleport to="body">
    <Modal v-model="openPreview" :hideDefaultFooter="true" size="xl">
      <template #title>
        <div class="flex items-center justify-between w-full px-6 pt-4 pb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight pt-2">
            {{ selectedRow?.perihal || '-' }}
          </h2>
        </div>
      </template>

      <div v-if="selectedRow" class="px-3 pb-3 space-y-5 overflow-y-auto max-h-[70vh]">
        <div class="space-y-4 text-base">
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">{{ $t('ver_modal_tanggal') }}</p>
            <p class="mt-1 dark:text-gray-200 text-sm font-medium">{{ selectedRow.tanggal }}</p>
          </div>
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t('ver_modal_penandatangan') }}
            </p>
            <p class="text-sm font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.penandatangan }}
            </p>
          </div>
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t('ver_modal_klasifikasi') }}
            </p>
            <p class="text-sm font-medium mt-1 dark:text-gray-200">{{ selectedRow.klasifikasi }}</p>
          </div>
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t('ver_modal_jenis_naskah') }}
            </p>
            <p class="text-sm font-medium mt-1 dark:text-gray-200">{{ selectedRow.jenis }}</p>
          </div>
        </div>

        <!-- File Lampiran -->
        <div v-if="selectedRow.file_path" class="pt-2">
          <label class="block text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
            {{ $t('ver_file_lampiran') }}
          </label>
          <div
            class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            <svg
              class="w-8 h-8 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ getFileName(selectedRow.file_path) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ $t('ver_file_dok_lampiran') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Nomor Surat Section -->
        <div class="mt-4">
          <div class="flex items-center justify-between mb-3">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 break-words">
              {{ $t('ver_nomor_surat') }} ({{ selectedRow?.jumlah ?? 0 }}
              {{ $t('ver_nomor_suffix') }})
            </label>
            <div class="flex items-center gap-2">
              <!-- Badge Single File -->
              <span
                v-if="selectedRow.is_single_file"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-primary/30 bg-primary/5 text-blue-700 dark:text-blue-400"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Single File
              </span>
              <label class="flex items-center gap-2 cursor-pointer select-none group">
                <div class="relative">
                  <input
                    type="checkbox"
                    v-model="uncheckAll"
                    @change="toggleUncheckAll"
                    class="sr-only peer"
                  />
                  <div
                    class="w-9 h-5 rounded-full transition-colors duration-200 peer-checked:bg-red-500 bg-gray-300 dark:bg-gray-600"
                  ></div>
                  <div
                    class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4"
                  ></div>
                </div>
                <span
                  :class="[
                    'text-xs font-medium transition-colors duration-200',
                    uncheckAll
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                  ]"
                >
                  {{ $t('ver_tolak_semua') }}
                </span>
              </label>
            </div>
          </div>

          <!-- Warning: sebagian tidak dicentang -->
          <div
            v-if="hasUnchecked && !allUnchecked"
            class="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-2"
          >
            <svg
              class="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div class="text-xs text-orange-800 dark:text-orange-300">
              <p class="font-medium">{{ uncheckedCount }} {{ $t('ver_warning_sebagian_title') }}</p>
              <p class="mt-0.5 text-orange-700 dark:text-orange-400">
                {{ $t('ver_warning_sebagian_desc') }}
                <strong>{{ $t('ver_warning_sebagian_booking') }}</strong
                >. {{ $t('ver_warning_sebagian_hint') }}
              </p>
            </div>
          </div>

          <!-- Warning: semua ditolak -->
          <div
            v-if="allUnchecked && validDetails.length > 0"
            class="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2"
          >
            <svg
              class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div class="text-xs text-red-800 dark:text-red-300">
              <p class="font-medium">{{ $t('ver_warning_semua_title') }}</p>
              <p class="mt-0.5 text-red-700 dark:text-red-400">
                {{ $t('ver_warning_semua_desc') }} {{ validDetails.length }}
                {{ $t('ver_warning_semua_suffix') }}
                <strong>{{ $t('ver_warning_semua_ditolak') }}</strong
                >. {{ $t('ver_warning_semua_hint') }}
              </p>
            </div>
          </div>

          <!-- Warning: ada nomor pending -->
          <div
            v-if="selectedRow.details.some((d: any) => !d.id || d.id === null)"
            class="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2"
          >
            <svg
              class="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                {{ $t('ver_warning_pending_title') }}
              </p>
              <p class="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                {{ $t('ver_warning_pending_desc') }}
              </p>
            </div>
          </div>

          <!-- ─── NOMOR CARDS ─────────────────────────────────────────────── -->
          <div class="space-y-3">
            <!-- ══ SINGLE FILE: file card di atas + compact nomor list bawah ══ -->
            <template v-if="selectedRow.is_single_file">
              <!-- ── Shared file card (same layout as nomor page) ── -->
              <div
                class="mb-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800"
              >
                <!-- File preview row — click to open -->
                <div
                  v-if="
                    selectedRow.details &&
                    selectedRow.details.length > 0 &&
                    hasExistingFile(selectedRow.details[0])
                  "
                  class="flex items-start gap-3 p-4 cursor-pointer bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-100/60 dark:hover:bg-blue-900/20 transition border-b border-blue-100 dark:border-blue-900/30"
                  @click="previewFile(selectedRow.details[0])"
                >
                  <div
                    class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40"
                  >
                    <svg
                      class="w-5 h-5 text-primary dark:text-blue-400"
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
                      class="text-sm font-semibold text-primary dark:text-blue-400 underline truncate"
                    >
                      {{ getDisplayFileName(selectedRow.details[0]) }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {{ $t('ver_file_klik_preview') }} · Berlaku untuk semua nomor
                    </p>
                  </div>
                </div>

                <!-- No file yet -->
                <div v-else class="p-4 border-b border-gray-100 dark:border-gray-700">
                  <p class="text-sm text-gray-400 dark:text-gray-500 italic text-center py-1">
                    {{ $t('ver_file_belum_ada') }}
                  </p>
                </div>
              </div>
              <!-- ── end shared file card ── -->

              <!-- ── Compact nomor list with checkboxes (preserved) ── -->
              <div
                v-if="selectedRow.details && selectedRow.details.length > 0"
                class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                <div
                  v-for="(detail, idx) in selectedRow.details"
                  :key="detail.id || idx"
                  :class="[
                    'flex items-center gap-3 px-4 py-3 transition',
                    Number(idx) < selectedRow.details.length - 1
                      ? 'border-b border-gray-100 dark:border-gray-700'
                      : '',
                    detail.status === 'hangus'
                      ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  ]"
                >
                  <!-- Checkbox (preserved) -->
                  <input
                    type="checkbox"
                    v-model="detail.checked"
                    :disabled="
                      detail.status === 'terpakai' ||
                      detail.status === 'ditolak' ||
                      detail.status === 'hangus' ||
                      isProcessing
                    "
                    class="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0"
                  />

                  <!-- Index -->
                  <span
                    class="text-xs text-gray-400 dark:text-gray-500 w-5 text-right flex-shrink-0"
                  >
                    {{ Number(idx) + 1 }}.
                  </span>

                  <!-- Nomor -->
                  <span
                    :class="[
                      'flex-1 font-mono text-sm',
                      detail.status === 'hangus'
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-800 dark:text-gray-200'
                    ]"
                  >
                    {{ displayNomor(detail) }}
                  </span>

                  <!-- Copy button -->
                  <button
                    v-if="
                      detail.nomor && detail.status === 'terpakai' && detail.status !== 'hangus'
                    "
                    @click="handleCopy(detail.nomor)"
                    class="p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition flex-shrink-0"
                  >
                    <Copy class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </button>
                  <div v-else class="w-[30px] flex-shrink-0"></div>

                  <!-- Status badge -->
                  <span
                    v-if="detail.status"
                    :class="[
                      'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
                      {
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':
                          detail.status === 'pending' ||
                          detail.status === 'menunggu' ||
                          detail.status === 'booking',
                        'bg-blue-100 dark:bg-blue-900/30 text-primary-800 dark:text-primary-400':
                          detail.status === 'terpakai',
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400':
                          detail.status === 'terpakai_final',
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400':
                          detail.status === 'ditolak',
                        'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400':
                          detail.status === 'hangus'
                      }
                    ]"
                  >
                    {{ getDetailStatusLabel(detail.status) }}
                  </span>
                </div>
              </div>
            </template>

            <!-- ══ MULTIPLE FILE: card terpisah per nomor (behaviour lama) ══ -->
            <template v-else>
              <div
                v-for="(detail, idx) in selectedRow.details"
                :key="detail.id || idx"
                class="space-y-2"
              >
                <div
                  :class="[
                    'border rounded-lg p-4 mt-2 transition',
                    detail.status === 'hangus'
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 opacity-60'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                  ]"
                >
                  <div class="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      v-model="detail.checked"
                      :disabled="
                        detail.status === 'terpakai' ||
                        detail.status === 'ditolak' ||
                        detail.status === 'hangus' ||
                        isProcessing
                      "
                      class="w-5 h-5 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0"
                    />
                    <div
                      class="relative flex flex-1 min-w-0 items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2"
                    >
                      <span class="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {{ Number(idx) + 1 }}.
                      </span>
                      <input
                        type="text"
                        :value="displayNomor(detail)"
                        :class="[
                          'flex-1 min-w-0 text-sm font-mono',
                          detail.status === 'hangus'
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'dark:text-gray-200'
                        ]"
                        readonly
                      />
                      <button
                        v-if="
                          detail.nomor && detail.status === 'terpakai' && detail.status !== 'hangus'
                        "
                        @click="handleCopy(detail.nomor)"
                        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition flex items-center justify-center flex-shrink-0"
                      >
                        <Copy class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <div v-else class="w-[44px]"></div>
                      <span
                        v-if="detail.status"
                        :class="[
                          'px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0',
                          {
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':
                              detail.status === 'pending' ||
                              detail.status === 'menunggu' ||
                              detail.status === 'booking',
                            'bg-blue-100 dark:bg-blue-900/30 text-primary-800 dark:text-primary-400':
                              detail.status === 'terpakai',
                            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400':
                              detail.status === 'terpakai_final',
                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400':
                              detail.status === 'ditolak',
                            'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400':
                              detail.status === 'hangus'
                          }
                        ]"
                      >
                        {{ getDetailStatusLabel(detail.status) }}
                      </span>
                    </div>
                  </div>

                  <!-- File per-nomor -->
                  <!-- No file -->
                  <div
                    v-if="!hasExistingFile(detail) && detail.status !== 'hangus'"
                    class="flex items-center gap-2 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2.5"
                  >
                    <svg
                      class="w-4 h-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span class="text-xs text-yellow-700 dark:text-yellow-400">
                      {{ $t('ver_file_belum_ada') }}
                    </span>
                  </div>
                  <!-- Has file -->
                  <template v-if="hasExistingFile(detail)">
                    <div
                      v-if="detail.status === 'hangus'"
                      class="flex items-start border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition opacity-70"
                      @click="previewFile(detail)"
                    >
                      <svg
                        class="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <div class="flex-1 min-w-0 ml-3">
                        <p
                          class="text-sm font-medium text-gray-500 dark:text-gray-400 underline truncate"
                        >
                          {{ getDisplayFileName(detail) }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {{ $t('ver_file_klik_preview') }}
                        </p>
                      </div>
                    </div>
                    <div
                      v-else
                      class="flex items-start border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                      @click="previewFile(detail)"
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
                          class="text-sm font-medium text-primary dark:text-blue-400 underline truncate"
                        >
                          {{ getDisplayFileName(detail) }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {{ $t('ver_file_klik_preview') }}
                        </p>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
          <!-- ─── END NOMOR CARDS ─────────────────────────────────────────── -->
        </div>

        <!-- Keterangan Penolakan -->
        <div v-if="allUnchecked || hasUnchecked" class="pt-2">
          <label class="block text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
            {{ $t('ver_keterangan_tolak_label') }} <span class="text-red-500">*</span>
            <span
              v-if="!allUnchecked"
              class="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1"
              >{{ $t('ver_keterangan_tolak_suffix') }}</span
            >
          </label>
          <textarea
            v-model="keterangan_ditolak"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm min-h-[120px] bg-gray-50 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
            :placeholder="$t('ver_keterangan_tolak_placeholder')"
          ></textarea>
          <p
            v-if="!keterangan_ditolak.trim() && showKeteranganWarning"
            class="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {{ $t('ver_keterangan_tolak_wajib') }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            v-if="hasPermission('penomoran', 'verify')"
            @click="confirmApproval"
            :disabled="isProcessing || !hasAnyChecked"
            class="flex-1 px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <svg
              v-if="isProcessing"
              class="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isProcessing ? $t('ver_btn_memproses') : $t('ver_btn_setujui') }}
          </button>
          <button
            v-if="hasPermission('penomoran', 'verify')"
            @click="confirmRejection"
            :disabled="isProcessing || !allUnchecked"
            class="flex-1 px-5 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ $t('ver_btn_tolak') }}
          </button>
        </div>
      </template>
    </Modal>
  </Teleport>

  <!-- PREVIEW SLIDEOVER -->
  <Teleport to="body">
    <USlideover
      v-model:open="isOpenPreview"
      :title="$t('ver_pratinjau')"
      side="bottom"
      :dismissible="true"
      :ui="{
        content: 'h-screen max-h-screen',
        body: 'p-0',
        footer: 'p-4 border-t border-gray-200 dark:border-gray-800'
      }"
      class="z-[9999]"
    >
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <iframe
            v-if="pdfUrl"
            :key="pdfUrl"
            :src="pdfUrl"
            allowfullscreen
            class="w-full h-full rounded-lg shadow-lg border border-gray-200"
          />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">{{ $t('ver_memuat_pratinjau') }}</span>
          </div>
        </div>
      </template>
    </USlideover>
  </Teleport>

  <!-- CONFIRM APPROVE -->
  <ConfirmPopup
    v-model="showConfirmApprove"
    :title="$t('ver_confirm_setujui_title')"
    :message="$t('ver_confirm_message')"
    :description="`Setujui ${checkedCount} nomor${uncheckedCount > 0 ? ` dan tolak ${uncheckedCount} nomor` : ''}?`"
    :confirmText="$t('ver_confirm_setujui_ya')"
    :cancelText="$t('ver_confirm_batal')"
    @confirm="processApproval"
  />

  <!-- CONFIRM REJECT -->
  <ConfirmPopup
    v-model="showConfirmReject"
    type="danger"
    :title="$t('ver_confirm_tolak_title')"
    :message="$t('ver_reject_message')"
    :description="`Apakah Anda yakin ingin menolak semua ${uncheckedCount} nomor?`"
    :confirmText="$t('ver_confirm_tolak_ya')"
    :cancelText="$t('ver_confirm_batal')"
    @confirm="processRejection"
  />

  <!-- EXPORT COLUMN MODAL -->
  <ExportColumnModal
    v-model="showExportModal"
    :columns="exportColumns"
    :total-rows="pagination?.total || sortedRows.length"
    title="Pilih Kolom Export Verifikasi Penomoran"
    :is-exporting="isExporting"
    @confirm="handleExportConfirm"
  />

  <!-- TOOLTIP -->
  <Teleport to="body">
    <div
      v-if="tooltip.show"
      class="fixed z-[9999] pointer-events-none bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-md shadow-lg"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      {{ tooltip.text }}
    </div>
  </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Copy, ArrowUpDown, ChevronDown } from 'lucide-vue-next'
import Heading from '~/components/Heading.vue'
import PageHeader from '~/components/PageHeader.vue'
import { Modal } from '#components'
import ExportColumnModal from '~/components/ExportColumnModal.vue'
import ConfirmPopup from '~/components/ConfirmPopup.vue'
import { usePenomoran } from '~/composables/usePenomoran'
import * as XLSX from 'xlsx'

const { hasPermission } = useAuth();
const { canAccessPage } = useFeatureAccess();

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl

const {
  approveBulkNomor,
  rejectNomorRequest,
  getListSubmitted,
  getDetailVerifikasiRequest,
  showToastFileNotFound,
  showToastCopied,
  showToastNomorMinimal,
  showToastKeteranganRequired,
  showToastApprovalSuccess,
  showToastTidakAdaNomor
} = usePenomoran()

// ─── Breadcrumbs & headers ────────────────────────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('ver_title'), to: '/penomoran/verifikasi' }
])

const headers = computed(() => [
  { label: t('ver_col_jenis'), key: 'jenis', sortable: true },
  { label: t('ver_col_tanggal'), key: 'tanggal', sortable: true },
  { label: t('ver_col_perihal'), key: 'perihal', sortable: false },
  { label: t('ver_col_penandatangan'), key: 'penandatangan', sortable: false },
  { label: t('ver_col_jumlah'), key: 'jumlah', sortable: false },
  { label: t('ver_col_pengusul'), key: 'pengusul', sortable: false },
  { label: t('ver_col_tgl_usulan'), key: 'tanggal_usulan', sortable: true }
])

const filterOptions = computed(() => [
  { label: t('ver_filter_semua'), value: 'Semua' },
  { label: t('ver_filter_menunggu'), value: 'Menunggu Verifikasi' },
  { label: t('ver_filter_disetujui'), value: 'Disetujui' },
  { label: t('ver_filter_ditolak'), value: 'Ditolak' }
])

const currentFilterLabel = computed(
  () =>
    filterOptions.value.find((o) => o.value === filterStatus.value)?.label ?? t('ver_filter_semua')
)

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

// ─── Export Excel dengan Pemilihan Kolom ──────────────────────────────────────
const showExportModal = ref(false)
const isExporting = ref(false)

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut baris data' },
  { key: 'jenis', label: 'Jenis Naskah', desc: 'Jenis naskah surat' },
  { key: 'tanggal', label: 'Tanggal', desc: 'Tanggal surat dibuat' },
  { key: 'perihal', label: 'Perihal', desc: 'Perihal naskah surat' },
  { key: 'penandatangan', label: 'Penandatangan', desc: 'Pejabat penandatangan surat' },
  { key: 'jumlah', label: 'Jumlah Nomor', desc: 'Jumlah nomor yang diajukan' },
  { key: 'pengusul', label: 'Pengusul', desc: 'Nama pegawai pengusul' },
  { key: 'tglUsulan', label: 'Tanggal Usulan', desc: 'Waktu usulan diajukan' },
  { key: 'status', label: 'Status', desc: 'Status verifikasi usulan' }
])

const openExportModal = () => {
  if (!hasPermission('penomoran', 'export-verifikasi') && !hasPermission('penomoran', 'report')) {
    toast.add({
      title: t('akses_ditolak') || 'Akses Ditolak',
      description: t('akses_export_ditolak') || 'Anda tidak memiliki izin untuk export laporan.',
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
    return
  }
  showExportModal.value = true
}

const handleExportConfirm = async (selectedKeys: string[]) => {
  if (isExporting.value || sortedRows.value.length === 0 || selectedKeys.length === 0) return
  isExporting.value = true

  try {
    let exportRows = sortedRows.value

    if (pagination.value && pagination.value.total > rowsPerPage.value) {
      const res = await getListSubmitted({
        search: search.value || undefined,
        page: 1,
        limit: pagination.value.total,
        sort_by: sortBy.value || undefined,
        sort_order: sortOrder.value || undefined,
        status: filterStatus.value !== 'Semua' ? filterStatus.value : undefined
      })
      const data = res.data || []
      exportRows = data.map((item: any) => {
        const tanggalDate = new Date(item.tanggal)
        const formattedTanggal = `${String(tanggalDate.getUTCDate()).padStart(2, '0')}/${String(tanggalDate.getUTCMonth() + 1).padStart(2, '0')}/${tanggalDate.getUTCFullYear()}`
        const localCreated = item.created_at.replace('Z', '').replace('+00:00', '')
        const createdDate = new Date(localCreated)
        const tglUsulan = `${String(createdDate.getDate()).padStart(2, '0')}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${String(createdDate.getFullYear()).slice(-2)} ${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')}`
        return {
          jenis: item.jenis,
          tanggal: formattedTanggal,
          perihal: item.perihal || '-',
          penandatangan: item.penandatangan || '-',
          jumlah: item.jumlah,
          pengusul: item.nama || '-',
          tglUsulan,
          status: item.status
        }
      })
    }

    const sheetData = exportRows.map((row: any, idx: number) => {
      const r: Record<string, any> = {}
      if (selectedKeys.includes('No')) r['No'] = idx + 1
      if (selectedKeys.includes('jenis')) r['Jenis Naskah'] = row.jenis || '-'
      if (selectedKeys.includes('tanggal')) r['Tanggal'] = row.tanggal || '-'
      if (selectedKeys.includes('perihal')) r['Perihal'] = row.perihal || '-'
      if (selectedKeys.includes('penandatangan')) r['Penandatangan'] = row.penandatangan || '-'
      if (selectedKeys.includes('jumlah')) r['Jumlah Nomor'] = row.jumlah ?? '-'
      if (selectedKeys.includes('pengusul')) r['Pengusul'] = row.pengusul || '-'
      if (selectedKeys.includes('tglUsulan')) r['Tanggal Usulan'] = row.tglUsulan || '-'
      if (selectedKeys.includes('status')) r['Status'] = getRowStatusLabel(row.status)
      return r
    })

    if (!sheetData.length) {
      toast.add({
        title: 'Tidak ada data',
        description: 'Tidak ada data untuk diexport',
        color: 'warning'
      })
      return
    }

    const ws = XLSX.utils.json_to_sheet(sheetData)
    const colWidths = Object.keys(sheetData[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...sheetData.map((r: any) => String(r[key] ?? '').length)) + 2
    }))
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Verifikasi')

    const statusLabel =
      filterOptions.value.find((o) => o.value === filterStatus.value)?.label || 'Semua'
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    XLSX.writeFile(wb, `Verifikasi_${statusLabel}_${dateStr}.xlsx`)

    toast.add({
      title: t('ver_btn_export') || 'Export Berhasil',
      description: `${sheetData.length} data berhasil diexport`,
      color: 'success'
    })
    showExportModal.value = false
  } catch (e) {
    console.error('❌ Error export:', e)
    toast.add({
      title: 'Export Gagal',
      description: 'Terjadi kesalahan saat export data',
      color: 'error'
    })
  } finally {
    isExporting.value = false
  }
}
const sortedRows = computed<any[]>(() => {
  if (!sortBy.value || rows.value.length === 0) return rows.value
  const key = sortBy.value as keyof (typeof rows.value)[0]
  const dir = sortOrder.value === 'asc' ? 1 : -1
  return [...rows.value].sort((a, b) => {
    const av = a[key] ?? ''
    const bv = b[key] ?? ''
    return String(av).localeCompare(String(bv), 'id', { sensitivity: 'base' }) * dir
  })
})
const toast = useToast()
// ─── Status labels ────────────────────────────────────────────────────────────
const getRowStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    'Menunggu Verifikasi': t('ver_status_menunggu'),
    Disetujui: t('ver_status_disetujui'),
    Ditolak: t('ver_status_ditolak')
  }
  return map[status] ?? status
}

const getDetailStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: t('ver_status_detail_pending'),
    menunggu: t('ver_status_detail_menunggu'),
    booking: t('ver_status_detail_booking'),
    terpakai: t('ver_status_detail_terpakai'),
    terpakai_final: t('ver_status_detail_final'),
    ditolak: t('ver_status_detail_ditolak'),
    hangus: t('ver_status_detail_hangus')
  }
  return map[status] ?? status
}

// ─── State ────────────────────────────────────────────────────────────────────
const isOpenPreview = ref(false)
const pdfUrl = ref<string | null>(null)
const rowsPerPage = ref<number>(10)
const rowsChoices = [10, 25, 50, 100]
const showRowsDropdown = ref(false)
const rowsRef = ref<HTMLElement | null>(null)
const currentPage = ref<number>(1)
const search = ref<string>('')
const selectedRow = ref<any>(null)
const keterangan_ditolak = ref('')
const showKeteranganWarning = ref(false)
const isProcessing = ref(false)
const showConfirmApprove = ref(false)
const showConfirmReject = ref(false)
const sortBy = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('desc')
const filterStatus = ref<string>('Menunggu Verifikasi')
const openFilterStatus = ref<boolean>(false)
const openPreview = ref(false)
const rows = ref<any[]>([])
const pagination = ref<any>(null)
const loading = ref(false)
const uncheckAll = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Rows per page ────────────────────────────────────────────────────────────
const selectRowsPerPage = (n: number) => {
  rowsPerPage.value = n
  showRowsDropdown.value = false
  handleLimitChange()
}

// ─── Fetch data ───────────────────────────────────────────────────────────────
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      search: search.value || undefined,
      page: currentPage.value,
      limit: rowsPerPage.value,
      status: filterStatus.value !== 'Semua' ? filterStatus.value : undefined,
      sort_by: sortBy.value || undefined,
      sort_order: sortOrder.value || undefined
    }
    const res = await getListSubmitted(params)
    const data = res.data || []
    pagination.value = res.pagination || null
    if (!Array.isArray(data)) {
      rows.value = []
      return
    }
    rows.value = data.map((item: any) => {
      const tanggalDate = new Date(item.tanggal)
      const formattedTanggal = `${String(tanggalDate.getUTCDate()).padStart(2, '0')}/${String(tanggalDate.getUTCMonth() + 1).padStart(2, '0')}/${tanggalDate.getUTCFullYear()}`
      const localCreated = item.created_at.replace('Z', '').replace('+00:00', '')
      const createdDate = new Date(localCreated)
      const tglUsulan = `${String(createdDate.getDate()).padStart(2, '0')}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${String(createdDate.getFullYear()).slice(-2)} ${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')}`
      return {
        id: item.id,
        jenis: item.jenis,
        tanggal: formattedTanggal,
        perihal: item.perihal || '-',
        penandatangan: item.penandatangan || '-',
        jumlah: item.jumlah,
        pengusul: item.nama || '-',
        tglUsulan,
        status: item.status,
        klasifikasi: item.klasifikasi,
        file_path: item.file_path
      }
    })
  } catch (error) {
    console.error('❌ Error fetch data verifikasi:', error)
    rows.value = []
    pagination.value = null
  } finally {
    loading.value = false
  }
}

const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 500)
}
const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'desc'
  }
  currentPage.value = 1
  fetchData()
}
const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchData()
}
const handleLimitChange = () => {
  currentPage.value = 1
  fetchData()
}
const selectFilterStatus = (item: { label: string; value: string }) => {
  filterStatus.value = item.value
  openFilterStatus.value = false
  currentPage.value = 1
  fetchData()
}

const totalPages = computed(() => pagination.value?.totalPages || 1)
const paginationPages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: number[] = []
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 2) {
    pages.push(1, 2, 3, 4, 5)
  } else if (current >= total - 1) {
    pages.push(total - 2, total - 1, total)
  } else {
    pages.push(current - 1, current, current + 1)
  }
  return pages
})

// ─── Show preview modal ───────────────────────────────────────────────────────
const showPreview = async (row: any) => {
  try {
    const detailData = await getDetailVerifikasiRequest(row.id)
    if (!detailData) return
    selectedRow.value = { ...row, ...detailData }
    keterangan_ditolak.value = ''
    showKeteranganWarning.value = false
    uncheckAll.value = false
    openPreview.value = true
  } catch (error) {
    console.error('❌ Error fetch detail:', error)
  }
}

// ─── Toggle uncheck all ───────────────────────────────────────────────────────
const toggleUncheckAll = () => {
  if (!selectedRow.value?.details) return
  selectedRow.value.details.forEach((d: any) => {
    if (
      d.status !== 'hangus' &&
      d.status !== 'terpakai' &&
      d.status !== 'terpakai_final' &&
      d.status !== 'ditolak'
    ) {
      d.checked = !uncheckAll.value
    }
  })
}

watch(
  () => selectedRow.value?.details,
  (details) => {
    if (!details) return
    const valid = details.filter(
      (d: any) =>
        d.status !== 'hangus' &&
        d.status !== 'terpakai' &&
        d.status !== 'terpakai_final' &&
        d.status !== 'ditolak'
    )
    uncheckAll.value = valid.length > 0 && valid.every((d: any) => !d.checked)
  },
  { deep: true }
)

// ─── Preview file ─────────────────────────────────────────────────────────────
const previewFile = (detail: any) => {
  const url = detail.file_url || (detail.file_text ? `${apiBaseUrl}/${detail.file_text}` : null)
  if (!url) {
    showToastFileNotFound()
    return
  }
  pdfUrl.value = url
  isOpenPreview.value = true
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const displayNomor = (detail: any) => {
  if (detail.status === 'terpakai' && detail.nomor) return detail.nomor
  if (detail.template_nomor) return detail.template_nomor
  if (selectedRow.value?.template_nomor) return selectedRow.value.template_nomor
  return '-'
}
const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value)
  showToastCopied(value)
}
const getFileName = (path: string) => (path ? path.split('/').pop() || path : '-')
const hasExistingFile = (detail: any) => !!(detail.file_name || detail.file_text || detail.file_url)
const getDisplayFileName = (detail: any) => {
  if (detail.file_name) return detail.file_name
  if (detail.file_text) return getFileName(detail.file_text)
  if (detail.file_url) return getFileName(detail.file_url)
  return 'File Terlampir'
}

// ─── Computed validasi ────────────────────────────────────────────────────────
const validDetails = computed(() =>
  (selectedRow.value?.details || []).filter(
    (d: any) => d.id && d.id !== null && d.id !== 'null' && d.status !== 'hangus'
  )
)
const hasAnyChecked = computed(() => validDetails.value.some((d: any) => d.checked))
const hasUnchecked = computed(() => validDetails.value.some((d: any) => !d.checked))
const allUnchecked = computed(
  () => validDetails.value.length > 0 && validDetails.value.every((d: any) => !d.checked)
)
const checkedCount = computed(() => validDetails.value.filter((d: any) => d.checked).length)
const uncheckedCount = computed(() => validDetails.value.filter((d: any) => !d.checked).length)

// ─── Approval ─────────────────────────────────────────────────────────────────
const confirmApproval = () => {
  if (!hasAnyChecked.value) {
    showToastNomorMinimal()
    return
  }
  if (hasUnchecked.value && !keterangan_ditolak.value.trim()) {
    showKeteranganWarning.value = true
    showToastKeteranganRequired(uncheckedCount.value)
    document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  showKeteranganWarning.value = false
  showConfirmApprove.value = true
}
const processApproval = async () => {
  showConfirmApprove.value = false
  if (!selectedRow.value) return
  const approvedDetails = validDetails.value.filter((d: any) => d.checked)
  const rejectedDetails = validDetails.value.filter((d: any) => !d.checked)
  if (approvedDetails.length === 0) {
    showToastTidakAdaNomor('disetujui')
    return
  }
  isProcessing.value = true
  try {
    await approveBulkNomor(approvedDetails.map((d: any) => d.id))
    if (rejectedDetails.length > 0 && keterangan_ditolak.value.trim()) {
      await rejectNomorRequest(
        selectedRow.value.id,
        rejectedDetails.map((d: any) => d.id),
        keterangan_ditolak.value
      )
    }
    showToastApprovalSuccess(approvedDetails.length, rejectedDetails.length)
    openPreview.value = false
    await fetchData()
  } catch (error) {
    console.error('❌ Error approval:', error)
  } finally {
    isProcessing.value = false
  }
}

// ─── Rejection ────────────────────────────────────────────────────────────────
const confirmRejection = () => {
  if (!allUnchecked.value) return
  if (!keterangan_ditolak.value.trim()) {
    showKeteranganWarning.value = true
    showToastKeteranganRequired()
    document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  showKeteranganWarning.value = false
  showConfirmReject.value = true
}
const processRejection = async () => {
  showConfirmReject.value = false
  if (!selectedRow.value) return
  const rejectedDetails = validDetails.value.filter((d: any) => !d.checked)
  if (rejectedDetails.length === 0) {
    showToastTidakAdaNomor('ditolak')
    return
  }
  if (!keterangan_ditolak.value.trim()) {
    showKeteranganWarning.value = true
    showToastKeteranganRequired()
    return
  }
  isProcessing.value = true
  try {
    await rejectNomorRequest(
      selectedRow.value.id,
      rejectedDetails.map((d: any) => d.id),
      keterangan_ditolak.value
    )
    openPreview.value = false
    await fetchData()
  } catch (error) {
    console.error('❌ Error rejection:', error)
  } finally {
    isProcessing.value = false
  }
}

// ─── Click outside ────────────────────────────────────────────────────────────
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (rowsRef.value && !rowsRef.value.contains(target)) showRowsDropdown.value = false
  for (const el of Array.from(document.querySelectorAll('[data-custom-dropdown]'))) {
    if (el.contains(target)) return
  }
  openFilterStatus.value = false
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
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

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!canAccessPage()) return;
  await fetchData()
  document.addEventListener('click', handleDocumentClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (searchTimeout) clearTimeout(searchTimeout)
  pdfUrl.value = null
})

watch(keterangan_ditolak, (v) => {
  if (v.trim()) showKeteranganWarning.value = false
})
watch(isOpenPreview, (open) => {
  if (open) {
    openPreview.value = false
  } else {
    pdfUrl.value = null
    if (selectedRow.value) openPreview.value = true
  }
})
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
