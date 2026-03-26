<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-gray-100">
          {{ $t('pernom_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <!-- CARD -->
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl w-full">
      <!-- TOP BAR -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 mb-4 pr-3">
        <div class="flex items-center gap-2 px-4">
          <!-- ROWS PER PAGE -->
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
                class="text-left bg-primary dark:bg-primary-800 text-white px-5 py-3 cursor-default"
              >
                <span>{{ $t('usl_col_status') }}</span>
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
                  />
                </td>
                <td class="px-5 py-3">
                  <div class="h-6 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
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
                @click="showModal(row)"
              >
                <td class="px-5 py-4 dark:text-gray-300 whitespace-nowrap">{{ row.jenis }}</td>
                <td class="px-5 py-4 dark:text-gray-300 whitespace-nowrap">{{ row.tanggal }}</td>
                <td class="px-5 py-4">
                  <p
                    class="whitespace-normal break-words line-clamp-3 dark:text-gray-300 max-w-[350px]"
                  >
                    {{ row.perihal || '-' }}
                  </p>
                </td>
                <td class="px-5 py-4 dark:text-gray-300">{{ row.jumlah }}</td>
                <td class="px-5 py-4 dark:text-gray-300 whitespace-nowrap">{{ row.pengusul }}</td>
                <td class="px-5 py-4 dark:text-gray-300 whitespace-nowrap">{{ row.tglUsulan }}</td>
                <td @click.stop class="px-5 py-3">
                  <button
                    @click="showModal(row)"
                    class="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition whitespace-nowrap"
                  >
                    {{ $t('usl_status_draft') || 'Menunggu Persetujuan' }}
                  </button>
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
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary hover:bg-primary-50'
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
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 hover:text-primary transition-all"
            >
              1
            </button>
            <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400 text-sm">...</span>
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="handlePageChange(page)"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 hover:text-primary'
              ]"
            >
              {{ page }}
            </button>
            <span
              v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
              class="px-2 text-gray-400 text-sm"
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
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary hover:bg-primary-50'
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

  <!-- ================================================================
       MODAL PERSETUJUAN
       ================================================================ -->
  <Teleport to="body">
    <Modal
      v-model="openModal"
      :hideDefaultFooter="true"
      size="xl"
      :ui="{ overlay: 'z-[100]', content: 'z-[110]' }"
    >
      <template #title>
        <div class="flex items-center justify-between w-full px-6 pt-4 pb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight pt-2">
            {{ selectedRow?.perihal || '-' }}
          </h2>
        </div>
      </template>

      <div v-if="selectedRow" class="px-3 pb-3 space-y-5 overflow-y-auto max-h-[70vh]">
        <!-- Meta info -->
        <div class="space-y-0">
          <div class="py-3 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">{{ $t('ver_modal_tanggal') }}</p>
            <p class="mt-1 dark:text-gray-200 text-sm font-medium">{{ selectedRow.tanggal }}</p>
          </div>
          <div class="py-3 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t('ver_modal_klasifikasi') }}
            </p>
            <p class="text-sm font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.klasifikasi || '-' }}
            </p>
          </div>
          <div class="py-3 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t('ver_modal_jenis_naskah') }}
            </p>
            <p class="text-sm font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.jenis || '-' }}
            </p>
          </div>
          <div class="py-3 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">{{ $t('ver_col_pengusul') }}</p>
            <p class="text-sm font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.pengusul || '-' }}
            </p>
          </div>
        </div>

        <!-- ── NOMOR SURAT ── -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
              {{ $t('ver_nomor_surat') }} ({{ selectedRow?.jumlah ?? 0 }}
              {{ $t('ver_nomor_suffix') }})
            </label>
            <div class="flex gap-2 items-center">
              <span
                v-if="selectedRow.is_single_file"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full"
              >
                <svg
                  class="w-3.5 h-3.5 text-blue-500 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-xs text-blue-700 dark:text-blue-400 font-medium">{{
                  $t('ver_single_file_label')
                }}</span>
              </span>

              <!-- Toggle Tolak Semua -->
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <div class="relative">
                  <input
                    type="checkbox"
                    v-model="uncheckAll"
                    @change="toggleUncheckAll"
                    class="sr-only peer"
                  />
                  <div
                    class="w-9 h-5 rounded-full transition-colors duration-200 peer-checked:bg-red-500 bg-gray-300 dark:bg-gray-600"
                  />
                  <div
                    class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4"
                  />
                </div>
                <span
                  :class="[
                    'text-xs font-medium transition-colors duration-200 whitespace-nowrap',
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

          <!-- Warning sebagian -->
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
            <p class="text-xs text-orange-800 dark:text-orange-300">
              <strong>{{ uncheckedCount }} nomor</strong> akan ditolak. Isi keterangan di bawah lalu
              tekan <strong>Setujui</strong>.
            </p>
          </div>

          <!-- Warning semua ditolak -->
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
            <p class="text-xs text-red-800 dark:text-red-300">
              Semua <strong>{{ validDetails.length }} nomor</strong> akan <strong>ditolak</strong>.
            </p>
          </div>

          <!-- Single file shared block -->
          <div v-if="selectedRow.is_single_file" class="mb-3">
            <div
              v-if="sharedFileDetail"
              class="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 cursor-pointer hover:opacity-80 transition"
              @click="openPreviewFile(sharedFileDetail)"
            >
              <div class="flex items-center gap-3">
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
                <div>
                  <p
                    class="text-sm font-medium text-primary dark:text-blue-400 underline break-all"
                  >
                    {{ sharedFileDetail.file_name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ $t('usl_file_klik_preview') }} · {{ $t('usl_file_berlaku_semua') }}
                  </p>
                </div>
              </div>
            </div>
            <div
              v-else
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
              <span class="text-xs text-yellow-700 dark:text-yellow-400">{{
                $t('ver_file_belum_ada')
              }}</span>
            </div>
          </div>

          <!-- ── NOMOR CARDS ── -->
          <div class="space-y-3">
            <!-- SINGLE FILE -->
            <template v-if="selectedRow.is_single_file">
              <div
                class="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
              >
                <div class="space-y-2">
                  <div
                    v-for="(detail, idx) in validDetails"
                    :key="detail.id || idx"
                    :class="[
                      'flex items-center gap-2 rounded-md px-3 py-2 border',
                      detail.status === 'hangus'
                        ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                        : !detail.checked
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                    ]"
                  >
                    <input
                      type="checkbox"
                      v-model="detail.checked"
                      :disabled="detail.status === 'hangus' || isProcessing"
                      class="w-5 h-5 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0"
                    />
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-medium flex-shrink-0"
                      >{{ idx + 1 }}.</span
                    >
                    <span
                      :class="[
                        'flex-1 min-w-0 text-sm font-mono',
                        detail.status === 'hangus'
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : !detail.checked
                            ? 'text-red-500 dark:text-red-400 line-through'
                            : 'dark:text-gray-200'
                      ]"
                    >
                      {{ selectedRow.template_nomor || '-' }}
                    </span>
                    <span
                      v-if="detail.status"
                      :class="[
                        'px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0',
                        detailStatusClass(detail.status)
                      ]"
                    >
                      {{ getDetailStatusLabel(detail.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </template>

            <!-- MULTI FILE -->
            <template v-else>
              <div
                v-for="(detail, idx) in validDetails"
                :key="detail.id || idx"
                :class="[
                  'border rounded-lg p-4 transition',
                  detail.status === 'hangus'
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 opacity-60'
                    : !detail.checked
                      ? 'border-red-200 dark:border-red-800/50 bg-red-50/40 dark:bg-red-900/10'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                ]"
              >
                <div class="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    v-model="detail.checked"
                    :disabled="detail.status === 'hangus' || isProcessing"
                    class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0"
                  />
                  <div
                    :class="[
                      'flex flex-1 min-w-0 items-center gap-2 border rounded-md px-3 py-2',
                      detail.status === 'hangus'
                        ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        : !detail.checked
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                    ]"
                  >
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-medium"
                      >{{ idx + 1 }}.</span
                    >
                    <span
                      :class="[
                        'flex-1 min-w-0 text-sm font-mono',
                        detail.status === 'hangus'
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : !detail.checked
                            ? 'text-red-500 dark:text-red-400 line-through'
                            : 'dark:text-gray-200'
                      ]"
                    >
                      {{ selectedRow.template_nomor || '-' }}
                    </span>
                    <span
                      v-if="detail.status"
                      :class="[
                        'px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0',
                        detailStatusClass(detail.status)
                      ]"
                    >
                      {{ getDetailStatusLabel(detail.status) }}
                    </span>
                  </div>
                </div>

                <template v-if="detail.status === 'hangus'">
                  <div
                    class="flex items-center gap-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 rounded-md p-3"
                  >
                    <svg
                      class="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{
                      $t('usl_nomor_sudah_hangus')
                    }}</span>
                  </div>
                </template>

                <template v-else>
                  <div
                    v-if="detail.file_url || detail.file_name"
                    class="flex items-start border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 cursor-pointer hover:opacity-80 transition"
                    @click="openPreviewFile(detail)"
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
                        {{ detail.file_name || $t('ver_file_lampiran') }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ $t('ver_file_klik_preview') }}
                      </p>
                    </div>
                  </div>
                  <div
                    v-else
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
                    <span class="text-xs text-yellow-700 dark:text-yellow-400">{{
                      $t('ver_file_belum_ada')
                    }}</span>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </div>

        <!-- Keterangan Penolakan -->
        <div v-if="hasUnchecked || allUnchecked" class="pt-2">
          <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {{ $t('ver_keterangan_tolak_label') }}
            <span class="text-red-500">*</span>
            <span
              v-if="!allUnchecked"
              class="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1"
            >
              {{ $t('ver_keterangan_tolak_suffix') }}
            </span>
          </label>
          <textarea
            ref="keteranganRef"
            v-model="keterangan_ditolak"
            rows="4"
            :class="[
              'w-full border rounded-lg px-4 py-3 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none resize-none transition',
              showKeteranganWarning && !keterangan_ditolak.trim()
                ? 'border-red-400 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            ]"
            :placeholder="$t('ver_keterangan_tolak_placeholder')"
          />
          <p
            v-if="showKeteranganWarning && !keterangan_ditolak.trim()"
            class="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1"
          >
            <svg
              class="w-3 h-3 flex-shrink-0"
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
            {{ $t('ver_keterangan_tolak_wajib') }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="confirmApproval"
            :disabled="isProcessing || !hasAnyChecked"
            class="flex-1 px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <svg
              v-if="isProcessing && processingAction !== 'reject'"
              class="animate-spin h-4 w-4"
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
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{{
              isProcessing && processingAction !== 'reject'
                ? $t('ver_btn_memproses')
                : `${$t('ver_btn_setujui')} (${checkedCount})`
            }}</span>
          </button>

          <button
            @click="confirmRejection"
            :disabled="isProcessing || !allUnchecked"
            class="flex-1 px-5 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <svg
              v-if="isProcessing && processingAction === 'reject'"
              class="animate-spin h-4 w-4"
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
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{{
              isProcessing && processingAction === 'reject'
                ? $t('ver_btn_memproses')
                : $t('ver_btn_tolak')
            }}</span>
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
      :ui="{ overlay: 'z-[200]', content: 'z-[210] h-screen max-h-screen', body: 'p-0' }"
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
            <span class="text-gray-500 dark:text-gray-400 text-sm">{{
              $t('ver_memuat_pratinjau')
            }}</span>
          </div>
        </div>
      </template>
    </USlideover>
  </Teleport>

  <!-- CONFIRM SETUJUI -->
  <ConfirmPopup
    v-model="showConfirmApprove"
    :title="$t('ver_confirm_setujui_title')"
    :message="$t('ver_confirm_message')"
    :description="`Setujui ${checkedCount} nomor${uncheckedCount > 0 ? ` dan tolak ${uncheckedCount} nomor` : ''}?`"
    :confirmText="$t('ver_confirm_setujui_ya')"
    :cancelText="$t('ver_confirm_batal')"
    @confirm="processApproval"
  />

  <!-- CONFIRM TOLAK SEMUA -->
  <ConfirmPopup
    v-model="showConfirmReject"
    type="danger"
    :title="$t('ver_confirm_tolak_title')"
    :message="$t('ver_reject_message')"
    :description="`Tolak semua ${uncheckedCount} nomor dari ${selectedRow?.pengusul ?? ''}?`"
    :confirmText="$t('ver_confirm_tolak_ya')"
    :cancelText="$t('ver_confirm_batal')"
    @confirm="processRejection"
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
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, ArrowUpDown, ChevronDown } from 'lucide-vue-next'
import Heading from '~/components/Heading.vue'
import PageHeader from '~/components/PageHeader.vue'
import { Modal } from '#components'
import ConfirmPopup from '~/components/ConfirmPopup.vue'
import { usePenomoran } from '~/composables/usePenomoran'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const {
  getListPendingApproval,
  approvePenandatangan,
  rejectPenandatangan,
  approvePenandatanganBulk,
  showToastFileNotFound,
  showToastKeteranganRequired,
  showToastApprovalSuccess,
  showToastTidakAdaNomor
} = usePenomoran()

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('pernom_title'), to: '/persetujuan-penomoran' }
])

const headers = computed(() => [
  { label: t('ver_col_jenis'), key: 'jenis', sortable: true },
  { label: t('ver_col_tanggal'), key: 'tanggal', sortable: true },
  { label: t('ver_col_perihal'), key: 'perihal', sortable: false },
  { label: t('ver_col_jumlah'), key: 'jumlah', sortable: false },
  { label: t('ver_col_pengusul'), key: 'pengusul', sortable: false },
  { label: t('ver_col_tgl_usulan'), key: 'tanggal_usulan', sortable: true }
])

const getDetailStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    draft: t('ver_status_detail_draft'),
    booking: t('ver_status_detail_booking'),
    terpakai: t('ver_status_detail_terpakai'),
    terpakai_final: t('ver_status_detail_final'),
    ditolak: t('ver_status_detail_ditolak'),
    hangus: t('ver_status_detail_hangus')
  }
  return map[status] ?? status
}

const detailStatusClass = (status: string) => ({
  'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400':
    status === 'draft' || status === 'booking',
  'bg-blue-100 dark:bg-blue-900/30 text-primary-800 dark:text-primary-400': status === 'terpakai',
  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400':
    status === 'terpakai_final',
  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': status === 'ditolak',
  'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400': status === 'hangus'
})

// ─── State ────────────────────────────────────────────────────────────────────
const openModal = ref(false)
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
const keteranganRef = ref<HTMLTextAreaElement | null>(null)
const isProcessing = ref(false)
const processingAction = ref<'approve' | 'reject' | null>(null)
const showConfirmApprove = ref(false)
const showConfirmReject = ref(false)
const sortBy = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('desc')
const rows = ref<any[]>([])
const pagination = ref<any>(null)
const loading = ref(false)
const uncheckAll = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Rows per page ────────────────────────────────────────────────────────────
const selectRowsPerPage = (n: number) => {
  rowsPerPage.value = n
  showRowsDropdown.value = false
  currentPage.value = 1
  fetchData()
}

// ─── Click outside ────────────────────────────────────────────────────────────
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (rowsRef.value && !rowsRef.value.contains(target)) showRowsDropdown.value = false
}

// ─── validDetails ─────────────────────────────────────────────────────────────
const validDetails = computed<any[]>(() =>
  (selectedRow.value?.details ?? []).filter(
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

const sharedFileDetail = computed(() => {
  if (!selectedRow.value?.is_single_file) return null
  return (selectedRow.value?.details ?? []).find((d: any) => d.file_name || d.file_url) ?? null
})

const toggleUncheckAll = () => {
  if (!selectedRow.value?.details) return
  validDetails.value.forEach((d: any) => {
    d.checked = !uncheckAll.value
  })
}

watch(
  () => selectedRow.value?.details,
  (details) => {
    if (!details) return
    const valid = details.filter((d: any) => d.status !== 'hangus')
    uncheckAll.value = valid.length > 0 && valid.every((d: any) => !d.checked)
  },
  { deep: true }
)

// ─── Fetch ────────────────────────────────────────────────────────────────────
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      search: search.value || undefined,
      page: currentPage.value,
      limit: rowsPerPage.value,
      sort_by: sortBy.value || undefined,
      sort_order: sortOrder.value || undefined
    }
    const res = await getListPendingApproval(params)
    const data = res.data || []
    pagination.value = res.pagination || null
    if (!Array.isArray(data)) {
      rows.value = []
      return
    }

    rows.value = data.map((item: any) => {
      const td = new Date(item.tanggal)
      const formattedTanggal = `${String(td.getUTCDate()).padStart(2, '0')}/${String(td.getUTCMonth() + 1).padStart(2, '0')}/${td.getUTCFullYear()}`
      const cd = new Date(item.created_at.replace('Z', '').replace('+00:00', ''))
      const tglUsulan = `${String(cd.getDate()).padStart(2, '0')}/${String(cd.getMonth() + 1).padStart(2, '0')}/${String(cd.getFullYear()).slice(-2)} ${String(cd.getHours()).padStart(2, '0')}:${String(cd.getMinutes()).padStart(2, '0')}`
      return {
        id: item.id,
        jenis: item.jenis,
        tanggal: formattedTanggal,
        perihal: item.perihal || '-',
        jumlah: item.jumlah,
        pengusul: item.nama || '-',
        tglUsulan,
        klasifikasi: item.klasifikasi,
        is_single_file: !!item.is_single_file,
        template_nomor: item.template_nomor || null,
        details: Array.isArray(item.details)
          ? item.details.map((d: any) => ({
              id: d.id,
              status: d.status || 'draft',
              file_name: d.file_name || null,
              file_url: d.file_url || null,
              checked: d.status !== 'hangus'
            }))
          : []
      }
    })
  } catch (e) {
    console.error('❌ Error fetch pending approval:', e)
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
const handleSort = (col: string) => {
  sortBy.value === col
    ? (sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc')
    : ((sortBy.value = col), (sortOrder.value = 'desc'))
  currentPage.value = 1
  fetchData()
}
const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchData()
}

const totalPages = computed(() => pagination.value?.totalPages || 1)
const paginationPages = computed(() => {
  const total = totalPages.value,
    current = currentPage.value,
    pages: number[] = []
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 2) pages.push(1, 2, 3, 4, 5)
  else if (current >= total - 1) pages.push(total - 2, total - 1, total)
  else pages.push(current - 1, current, current + 1)
  return pages
})

// ─── Show modal ───────────────────────────────────────────────────────────────
const showModal = (row: any) => {
  const detailsWithChecked = (row.details ?? []).map((d: any) => ({
    ...d,
    checked: d.status !== 'hangus'
  }))
  selectedRow.value = { ...row, details: detailsWithChecked }
  keterangan_ditolak.value = ''
  showKeteranganWarning.value = false
  uncheckAll.value = false
  openModal.value = true
}

// ─── Preview file ─────────────────────────────────────────────────────────────
const openPreviewFile = (detail: any) => {
  if (!detail?.file_url) {
    showToastFileNotFound()
    return
  }
  pdfUrl.value = detail.file_url
  isOpenPreview.value = true
}

// ─── Validasi keterangan ─────────────────────────────────────────────────────
const validateKeterangan = async (): Promise<boolean> => {
  if (!hasUnchecked.value) return true
  if (keterangan_ditolak.value.trim()) return true
  showKeteranganWarning.value = true
  showToastKeteranganRequired()
  await nextTick()
  keteranganRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  keteranganRef.value?.focus()
  return false
}

// ─── Approve ──────────────────────────────────────────────────────────────────
const confirmApproval = async () => {
  if (!hasAnyChecked.value) return

  if (hasUnchecked.value && !keterangan_ditolak.value.trim()) {
    showKeteranganWarning.value = true
    showToastKeteranganRequired(uncheckedCount.value)
    await nextTick()
    keteranganRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    keteranganRef.value?.focus()
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
  processingAction.value = 'approve'
  try {
    // 1. Approve yang dicentang
    await approvePenandatanganBulk(approvedDetails.map((d: any) => d.id))

    // 2. Reject yang tidak dicentang (jika ada + keterangan terisi)
    if (rejectedDetails.length > 0 && keterangan_ditolak.value.trim()) {
      await rejectPenandatangan(
        selectedRow.value.id,
        keterangan_ditolak.value,
        rejectedDetails.map((d: any) => d.id)
      )
    }

    showToastApprovalSuccess(approvedDetails.length, rejectedDetails.length)
    openModal.value = false
    await fetchData()
  } catch (e) {
    console.error('❌ Error approval:', e)
  } finally {
    isProcessing.value = false
    processingAction.value = null
  }
}
// ─── Tolak semua ──────────────────────────────────────────────────────────────
const confirmRejection = async () => {
  if (!allUnchecked.value) return
  const valid = await validateKeterangan()
  if (!valid) return
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
  processingAction.value = 'reject'
  try {
    await rejectPenandatangan(
      selectedRow.value.id,
      keterangan_ditolak.value,
      rejectedDetails.map((d: any) => d.id)
    )
    openModal.value = false
    await fetchData()
  } catch (e) {
    console.error('❌ Error rejection:', e)
  } finally {
    isProcessing.value = false
    processingAction.value = null
  }
}

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(keterangan_ditolak, (v) => {
  if (v.trim()) showKeteranganWarning.value = false
})
watch(openModal, (open) => {
  if (!open) {
    selectedRow.value = null
    uncheckAll.value = false
    keterangan_ditolak.value = ''
    showKeteranganWarning.value = false
  }
})
watch(isOpenPreview, (open) => {
  if (!open) pdfUrl.value = null
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchData()
  document.addEventListener('click', handleDocumentClick)
})
onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
  pdfUrl.value = null
  document.removeEventListener('click', handleDocumentClick)
})

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
</style>
