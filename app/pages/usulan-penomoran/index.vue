<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-gray-100">
          {{ $t('usl_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
      <button
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        {{ $t('usl_btn_tambah') }}
      </button>
    </div>

    <!-- CARD -->
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl w-full">
      <!-- TOP BAR -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 mb-4 pr-3">
        <!-- ROWS PER PAGE -->
        <div class="flex items-center gap-2 px-4">
          <select
            v-model="rowsPerPage"
            @change="handleLimitChange"
            class="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>

        <!-- FILTER STATUS -->
        <div class="relative" data-custom-dropdown>
          <button
            type="button"
            @click.stop="openFilterStatus = !openFilterStatus"
            class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[180px] justify-between"
          >
            <span class="truncate">{{ selectedFilterLabel }}</span>
            <svg
              :class="[
                'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200',
                openFilterStatus ? 'rotate-180' : 'rotate-0'
              ]"
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
                @click.stop="selectFilterStatus(item.value)"
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
            :placeholder="$t('usl_cari_placeholder')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs dark:text-gray-200 pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="min-w-max bg-white dark:bg-gray-800 text-sm w-full">
          <thead class="bg-primary dark:bg-primary-800 text-white text-[15px] sticky top-0 z-10">
            <tr>
              <th
                v-for="col in headers"
                :key="col.key"
                @click="col.sortable && handleSort(col.key)"
                :class="[
                  'px-5 py-3 text-left font-semibold tracking-wide whitespace-nowrap',
                  col.sortable
                    ? 'cursor-pointer select-none hover:bg-primary-600 dark:hover:bg-primary-700 transition'
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
                class="sticky right-0 z-30 bg-primary dark:bg-primary-800 text-white px-5 py-3 border-l border-primary-600 dark:border-primary-700 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] cursor-pointer select-none hover:bg-primary-600 dark:hover:bg-primary-700 transition"
              >
                <div class="flex items-center gap-2">
                  <span>{{ $t('usl_col_status') }}</span>
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
                class="border-b border-gray-100 dark:border-gray-700"
              >
                <td class="px-5 py-4">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    :style="{ width: `${50 + (i % 3) * 15}%` }"
                  ></div>
                </td>
                <td class="px-5 py-4">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                </td>
                <td class="px-5 py-4">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    :style="{ width: `${60 + (i % 4) * 10}%` }"
                  ></div>
                </td>
                <td class="px-5 py-4">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    :style="{ width: `${45 + (i % 3) * 12}%` }"
                  ></div>
                </td>
                <td class="px-5 py-4">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                </td>
                <td class="px-5 py-4">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    :style="{ width: `${40 + (i % 4) * 10}%` }"
                  ></div>
                </td>
                <td class="px-5 py-4">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                </td>
                <td
                  class="sticky right-0 z-20 bg-white dark:bg-gray-800 px-5 py-4 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]"
                >
                  <div
                    class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-28"
                  ></div>
                </td>
              </tr>
            </template>

            <!-- EMPTY -->
            <template v-else-if="rows.length === 0">
              <tr>
                <td
                  :colspan="headers.length + 1"
                  class="py-20 text-center text-gray-500 dark:text-gray-400"
                >
                  <p class="text-sm font-medium">{{ $t('usl_empty') }}</p>
                </td>
              </tr>
            </template>

            <!-- DATA ROWS -->
            <template v-else>
              <tr
                v-for="row in rows"
                :key="row.id"
                class="hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition"
                @mousemove="onMouseMove($event, $t('usl_tooltip_detail'))"
                @mouseleave="onMouseLeave"
                @click="openRowModal(row)"
              >
                <td class="px-5 py-4 dark:text-gray-300 whitespace-nowrap">{{ row.jenis }}</td>
                <td class="px-5 py-4 dark:text-gray-300 whitespace-nowrap">{{ row.tanggal }}</td>
                <td class="px-5 py-4">
                  <p
                    class="whitespace-normal break-words line-clamp-3 dark:text-gray-300 max-w-[350px]"
                  >
                    {{ row.perihal }}
                  </p>
                </td>
                <td class="px-5 py-4">
                  <p
                    class="whitespace-normal break-words line-clamp-3 dark:text-gray-300 max-w-[300px]"
                  >
                    {{ row.penandatangan }}
                  </p>
                </td>
                <td class="px-5 py-4 dark:text-gray-300">{{ row.jumlah }}</td>
                <td class="px-5 py-4 dark:text-gray-300 whitespace-nowrap">{{ row.pengusul }}</td>
                <td class="px-5 py-4 dark:text-gray-300 whitespace-nowrap">{{ row.tglUsulan }}</td>
                <td
                  @click.stop
                  class="sticky right-0 z-20 bg-white dark:bg-gray-800 px-5 py-3 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]"
                >
                  <span
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                    :class="rowStatusClass(row.status)"
                  >
                    {{ getRowStatusLabel(row.status) }}
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

      <!-- MODAL TAMBAH -->
      <Teleport to="body">
        <AddUsulan v-model="openAdd" @submit="handleSubmitFromModal" />
      </Teleport>
    </div>
  </div>

  <!-- ================================================================
       MODAL DETAIL ROW
       ================================================================ -->
  <Teleport to="body">
    <Modal
      v-model="openDetail"
      :hideDefaultFooter="true"
      size="xl"
      :ui="{ overlay: 'z-[100]', content: 'z-[110]' }"
    >
      <template #title>
        <div class="flex justify-between items-center w-full px-5 pt-6 pb-3">
          <h2 class="text-lg font-semibold uppercase dark:text-gray-100">
            {{ selectedRow?.jenis_naskah || $t('detail') }}
          </h2>
          <!-- Status badge di header -->
          <!-- <span
            v-if="selectedRow?.status"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
            :class="rowStatusClass(selectedRow.status)"
          >
            {{ getRowStatusLabel(selectedRow.status) }}
          </span> -->
        </div>
      </template>

      <div v-if="selectedRow" class="space-y-4 text-sm px-5 pb-3 max-h-[70vh] overflow-y-auto">
        <!-- Perihal -->
        <p class="text-gray-900 dark:text-gray-100 font-semibold leading-relaxed text-base">
          {{ selectedRow.perihal || '-' }}
        </p>

        <!-- Meta info grid -->
        <div class="grid gap-0">
          <!-- Tanggal -->
          <div class="pb-3 border-b border-gray-200 dark:border-gray-700 pr-4">
            <p class="text-gray-500 dark:text-gray-400 text-xs">{{ $t('usl_detail_tanggal') }}</p>
            <p class="font-medium mt-1 dark:text-gray-200">{{ formatDate(selectedRow.tanggal) }}</p>
          </div>

          <!-- Jumlah -->
          <div class="pb-3 border-b border-gray-200 dark:border-gray-700 pl-4">
            <p class="text-gray-500 dark:text-gray-400 text-xs">{{ $t('usl_col_jumlah') }}</p>
            <p class="font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.jumlah }} {{ $t('usl_nomor_suffix') }}
            </p>
          </div>

          <!-- Penandatangan -->
          <div class="py-3 border-b border-gray-200 dark:border-gray-700 pr-4">
            <p class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t('usl_detail_penandatangan') }}
            </p>
            <p class="font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.penandatangan || '-' }}
            </p>
          </div>

          <!-- Klasifikasi -->
          <div class="py-3 border-b border-gray-200 dark:border-gray-700 pl-4">
            <p class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t('usl_detail_klasifikasi') }}
            </p>
            <p class="font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.klasifikasiDisplay || selectedRow.klasifikasi || '-' }}
            </p>
          </div>

          <!-- Jenis Naskah -->
          <div class="pt-3 col-span-2">
            <p class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t('usl_detail_jenis_naskah') }}
            </p>
            <p class="font-medium mt-1 dark:text-gray-200">{{ selectedRow.jenis_naskah || '-' }}</p>
          </div>
        </div>

        <!-- ── NOMOR SURAT ── -->
        <div class="mt-2">
          <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            {{ $t('usl_nomor_surat') }} ({{ selectedRow?.jumlah ?? 0 }}
            {{ $t('usl_nomor_suffix') }})
          </label>

          <!-- Loading detail -->
          <div v-if="loadingDetail" class="space-y-3">
            <div
              v-for="i in selectedRow?.jumlah ?? 1"
              :key="i"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
            >
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>

          <template v-else>
            <!-- ═══ SINGLE FILE MODE ═══
                 Semua nomor berbagi 1 file yang sama -->
            <div v-if="isSingleFileMode" class="space-y-3">
              <!-- File bersama -->
              <div
                v-if="sharedFile"
                class="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 cursor-pointer hover:opacity-80 transition"
                @click="previewFile(sharedFile)"
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
                      {{ sharedFile.file_name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {{ $t('usl_file_klik_preview') }} · {{ $t('usl_file_berlaku_semua') }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Belum ada file -->
              <div
                v-else
                class="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg px-4 py-6 text-center"
              >
                <svg
                  class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2"
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
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  {{ $t('usl_file_belum_ada') }}
                </p>
              </div>

              <!-- List nomor (tanpa area file per-nomor) -->
              <div
                v-for="(detail, idx) in selectedRow.details"
                :key="detail.id || idx"
                :class="[
                  'border rounded-lg p-3 transition',
                  detail.status === 'hangus'
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 opacity-60'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                ]"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2"
                  >
                    <div class="flex items-center justify-between">
                      <span
                        :class="[
                          'text-sm font-mono',
                          detail.status === 'hangus'
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-gray-700 dark:text-gray-300'
                        ]"
                      >
                        {{ idx + 1 }}. {{ detail.nomor || selectedRow.template_nomor || '-' }}
                      </span>
                      <span
                        v-if="detail.status"
                        class="px-2 py-1 rounded-lg text-xs font-medium"
                        :class="detailStatusClass(detail.status)"
                      >
                        {{ getDetailStatusLabel(detail.status) }}
                      </span>
                    </div>
                  </div>
                  <button
                    v-if="detail.nomor && detail.status !== 'hangus'"
                    @click="handleCopy(detail.nomor)"
                    class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    :title="$t('usl_toast_tersalin')"
                  >
                    <Copy class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <!-- ═══ MULTI FILE MODE ═══
                 Setiap nomor punya file masing-masing -->
            <div v-else class="space-y-4">
              <div
                v-for="(detail, idx) in selectedRow.details"
                :key="detail.id || idx"
                :class="[
                  'border rounded-lg p-4 transition',
                  detail.status === 'hangus'
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 opacity-60'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                ]"
              >
                <!-- Nomor + badge + copy -->
                <div class="flex items-center gap-2 mb-3">
                  <div
                    class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2"
                  >
                    <div class="flex items-center justify-between">
                      <span
                        :class="[
                          'text-sm font-mono',
                          detail.status === 'hangus'
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-gray-700 dark:text-gray-300'
                        ]"
                      >
                        {{ idx + 1 }}. {{ detail.nomor || selectedRow.template_nomor || '-' }}
                      </span>
                      <span
                        v-if="detail.status"
                        class="px-2 py-1 rounded-lg text-xs font-medium"
                        :class="detailStatusClass(detail.status)"
                      >
                        {{ getDetailStatusLabel(detail.status) }}
                      </span>
                    </div>
                  </div>
                  <button
                    v-if="detail.nomor && detail.status !== 'hangus'"
                    @click="handleCopy(detail.nomor)"
                    class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    :title="$t('usl_toast_tersalin')"
                  >
                    <Copy class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <!-- File per nomor — hangus -->
                <template v-if="detail.status === 'hangus'">
                  <div
                    v-if="detail.file_name || detail.file_url"
                    class="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 rounded-md p-3"
                  >
                    <div class="flex items-center gap-2">
                      <svg
                        class="w-4 h-4 text-gray-400 dark:text-gray-500"
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
                      <p class="text-sm text-gray-400 dark:text-gray-500 line-through">
                        {{ detail.file_name || $t('usl_detail_dokumen') }}
                      </p>
                    </div>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {{ $t('usl_nomor_sudah_hangus') }}
                    </p>
                  </div>
                  <div
                    v-else
                    class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3"
                  >
                    <div class="flex items-center gap-2">
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
                  </div>
                </template>

                <!-- File per nomor — ada file -->
                <div
                  v-else-if="detail.file_name || detail.file_url"
                  class="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 cursor-pointer hover:opacity-80 transition"
                  @click="previewFile(detail)"
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
                        {{ detail.file_name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ $t('usl_file_klik_preview') }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Tidak ada file -->
                <div
                  v-else
                  class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
                >
                  <div class="flex items-center gap-2">
                    <svg
                      class="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0"
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
                    <span class="text-xs text-yellow-800 dark:text-yellow-400">{{
                      $t('usl_file_belum_ada')
                    }}</span>
                  </div>
                </div>
              </div>
              <!-- end v-for item -->
            </div>
            <!-- end multi file mode wrapper --> </template
          ><!-- end v-else loadingDetail -->
        </div>
      </div>

      <template #footer>
        <div class="flex w-full gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <!-- footer kosong, bisa ditambah aksi jika diperlukan -->
        </div>
      </template>
    </Modal>
  </Teleport>

  <!-- PREVIEW SLIDEOVER -->
  <USlideover
    v-model:open="isOpenPreview"
    :title="$t('usl_pratinjau')"
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
            $t('usl_memuat_pratinjau')
          }}</span>
        </div>
      </div>
    </template>
  </USlideover>

  <!-- TOOLTIP -->
  <Teleport to="body">
    <div
      v-if="tooltip.show"
      class="fixed z-[9999] pointer-events-none bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md shadow-lg"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      {{ tooltip.text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, ArrowUpDown, Plus, Copy } from 'lucide-vue-next'
import AddUsulan from '~/components/AddUsulan.vue'
import Heading from '~/components/Heading.vue'
import PageHeader from '~/components/PageHeader.vue'
import { Modal } from '#components'
import { usePenomoran } from '~/composables/usePenomoran'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const { user, getProfile } = useAuth()
const { getListUsulan, getDetailUsulan, getPersonWithPosition, getKlasifikasi } = usePenomoran()
const toast = useToast()

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('usl_title'), to: '/usulan-penomoran' }
])

// ─── Table headers ────────────────────────────────────────────────────────────
const headers = computed(() => [
  { label: t('usl_col_jenis'), key: 'jenis', sortable: true },
  { label: t('usl_col_tanggal'), key: 'tanggal', sortable: true },
  { label: t('usl_col_perihal'), key: 'perihal', sortable: false },
  { label: t('usl_col_penandatangan'), key: 'penandatangan', sortable: false },
  { label: t('usl_col_jumlah'), key: 'jumlah', sortable: false },
  { label: t('usl_col_pengusul'), key: 'pengusul', sortable: false },
  { label: t('usl_col_tgl_usulan'), key: 'tanggal_usulan', sortable: true }
])

// ─── Filter options ───────────────────────────────────────────────────────────
const filterOptions = computed(() => [
  { label: t('usl_filter_semua'), value: 'Semua' },
  { label: t('usl_filter_menunggu'), value: 'Menunggu Verifikasi' },
  { label: t('usl_filter_disetujui'), value: 'Disetujui' },
  { label: t('usl_filter_ditolak'), value: 'Ditolak' }
])

const selectedFilterLabel = computed(
  () =>
    filterOptions.value.find((o) => o.value === filterStatus.value)?.label ?? t('usl_filter_semua')
)

// ─── Status helpers ───────────────────────────────────────────────────────────
const rowStatusClass = (status: string) => ({
  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':
    status === 'Menunggu Verifikasi',
  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400': status === 'Disetujui',
  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': status === 'Ditolak',
  'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300': ![
    'Menunggu Verifikasi',
    'Disetujui',
    'Ditolak'
  ].includes(status)
})

const getRowStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    'Menunggu Verifikasi': t('usl_status_menunggu_verifikasi'),
    Disetujui: t('usl_status_disetujui'),
    Ditolak: t('usl_status_ditolak')
  }
  return map[status] || status
}

const getDetailStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    booking: t('usl_status_booking'),
    terpakai: t('usl_status_terpakai'),
    terpakai_final: t('usl_status_final'),
    ditolak: t('usl_status_ditolak'),
    hangus: t('usl_status_hangus')
  }
  return map[status] || status
}

const detailStatusClass = (status: string) => ({
  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400': status === 'booking',
  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400': status === 'terpakai',
  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400':
    status === 'terpakai_final',
  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': status === 'ditolak',
  'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400': status === 'hangus'
})

// ─── State ────────────────────────────────────────────────────────────────────
const openDetail = ref(false)
const loadingDetail = ref(false)
const selectedRow = ref<any>(null)
const rows = ref<any[]>([])
const loading = ref(true)
const pagination = ref<any>(null)

const isOpenPreview = ref(false)
const pdfUrl = ref<string | null>(null)

const openAdd = ref(false)
const personMap = ref(new Map())
const klasifikasiMap = ref(new Map())

const search = ref('')
const currentPage = ref(1)
const rowsPerPage = ref(10)
const rowsChoices = [5, 10, 20, 50]
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('desc')
const filterStatus = ref('Semua')
const openFilterStatus = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Single vs Multi file mode ────────────────────────────────────────────────
const isSingleFileMode = computed(() => {
  const details = selectedRow.value?.details
  if (!details || details.length < 1) return false
  if (details.length === 1) return !!details[0]?.file_text
  const firstFile = details[0]?.file_text
  if (!firstFile) return false
  return details.every((d: any) => d.file_text === firstFile)
})

const sharedFile = computed(() => {
  if (!isSingleFileMode.value) return null
  return selectedRow.value?.details?.find((d: any) => d.file_name) ?? null
})

// ─── Preview ──────────────────────────────────────────────────────────────────
const previewFile = (detail: any) => {
  if (!detail?.file_url) {
    toast.add({
      title: t('usl_toast_file_tidak_ada_title'),
      description: t('usl_toast_file_tidak_ada_desc'),
      color: 'warning'
    })
    return
  }
  pdfUrl.value = detail.file_url
  isOpenPreview.value = true
}

// ─── Data fetching ────────────────────────────────────────────────────────────
const fetchPersonMap = async () => {
  try {
    const response = await getPersonWithPosition()
    const list = Array.isArray(response) ? response : (response.data ?? [])
    list.forEach((item: any) => {
      const displayText = item.sub_area_text
        ? `${item.position_text} - ${item.sub_area_text}`
        : item.position_text || ''
      personMap.value.set(item.persnum, { nama: item.nama, position_text: displayText })
    })
  } catch (e) {
    console.error('❌ Error fetch person map:', e)
  }
}

const fetchKlasifikasiMap = async () => {
  try {
    const list = await getKlasifikasi()
    if (Array.isArray(list))
      list.forEach((item: any) => klasifikasiMap.value.set(item.code, item.display))
  } catch (e) {
    console.error('❌ Error fetch klasifikasi map:', e)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    if (!user.value?.position) {
      rows.value = []
      pagination.value = null
      return
    }

    const positionId =
      typeof user.value.position === 'object' ? user.value.position.id : user.value.position

    const params = {
      search: search.value || undefined,
      page: currentPage.value,
      limit: rowsPerPage.value,
      status: filterStatus.value !== 'Semua' ? filterStatus.value : undefined,
      sort_by: sortBy.value || undefined,
      sort_order: sortOrder.value || undefined
    }

    const response = await getListUsulan(String(positionId), params)
    const data = response.data || []
    pagination.value = response.pagination || null

    if (!Array.isArray(data)) {
      rows.value = []
      return
    }

    rows.value = data.map((item: any) => {
      const pengusulInfo = personMap.value.get(item.persnum) || {}
      const klasifikasiDisplay = klasifikasiMap.value.get(item.klasifikasi) || item.klasifikasi

      let mappedStatus = item.status || 'Menunggu Verifikasi'
      if (!['Menunggu Verifikasi', 'Disetujui', 'Ditolak'].includes(mappedStatus)) {
        mappedStatus = 'Menunggu Verifikasi'
      }

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
        jumlah: item.jumlah,
        penandatangan: item.penandatangan || '-',
        klasifikasi: item.klasifikasi || '-',
        klasifikasiDisplay,
        pengusul: pengusulInfo.nama || item.nama || user.value?.nama || '-',
        tglUsulan,
        status: mappedStatus,
        template_nomor: item.template_nomor || ''
      }
    })
  } catch (err) {
    console.error('❌ Gagal fetch data:', err)
    rows.value = []
    pagination.value = null
  } finally {
    loading.value = false
  }
}

// ─── Open row modal ───────────────────────────────────────────────────────────
const openRowModal = async (row: any) => {
  // Set data dasar dulu agar modal langsung terbuka
  selectedRow.value = {
    id_usulan: row.id,
    jenis: row.jenis,
    jenis_naskah: row.jenis,
    tanggal: row.tanggal,
    perihal: row.perihal || '-',
    jumlah: row.jumlah,
    penandatangan: row.penandatangan || '-',
    klasifikasi: row.klasifikasi || '-',
    klasifikasiDisplay: row.klasifikasiDisplay,
    status: row.status,
    template_nomor: row.template_nomor || '',
    details: []
  }
  openDetail.value = true
  loadingDetail.value = true

  try {
    const detailData = await getDetailUsulan(row.id)
    if (!detailData) return

    const klasifikasiDisplay =
      klasifikasiMap.value.get(detailData.klasifikasi) || detailData.klasifikasi
    const normalizedDetails = normalizeDetails(
      detailData.details || [],
      detailData.jumlah,
      detailData.template_nomor || ''
    )

    selectedRow.value = {
      ...selectedRow.value,
      klasifikasiDisplay,
      status: detailData.status || row.status,
      template_nomor: detailData.template_nomor || '',
      details: normalizedDetails
    }
  } catch (err) {
    console.error('❌ Gagal load detail:', err)
  } finally {
    loadingDetail.value = false
  }
}

const normalizeDetails = (details: any[], jumlah: number, template: string) => {
  const result = []
  for (let i = 0; i < jumlah; i++) {
    const d = details[i]
    result.push(
      d
        ? {
            id: d.id || `temp-${i + 1}`,
            nomor: d.nomor || null,
            status: d.status || 'booking',
            file_name: d.file_name || null,
            file_url: d.file_url || null,
            file_text: d.file_text || null
          }
        : {
            id: `temp-${i + 1}`,
            nomor: null,
            status: 'booking',
            file_name: null,
            file_url: null,
            file_text: null
          }
    )
  }
  return result
}

// ─── Copy ─────────────────────────────────────────────────────────────────────
const handleCopy = (value: string) => {
  if (!value) return
  navigator.clipboard.writeText(value)
  toast.add({
    title: t('usl_toast_tersalin'),
    description: `"${value}" ${t('usl_toast_tersalin_desc')}`,
    color: 'success'
  })
}

// ─── Submit / refresh ─────────────────────────────────────────────────────────
const handleSubmitFromModal = async () => {
  openAdd.value = false
  currentPage.value = 1
  await fetchData()
}

// ─── Pagination & sort & filter ───────────────────────────────────────────────
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

const selectFilterStatus = (val: string) => {
  filterStatus.value = val
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

// ─── Date formatter ───────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const localStr = dateStr.replace('Z', '').replace('+00:00', '')
  return new Date(localStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// ─── Dropdown close on outside click ─────────────────────────────────────────
function handleDocumentClick(e: MouseEvent) {
  const dropdowns = document.querySelectorAll('[data-custom-dropdown]')
  for (const el of Array.from(dropdowns)) {
    if (el.contains(e.target as HTMLElement)) return
  }
  openFilterStatus.value = false
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const tooltip = ref({ show: false, text: '', x: 0, y: 0 })
const onMouseMove = (e: MouseEvent, text: string) => {
  tooltip.value = { show: true, text, x: e.clientX + 12, y: e.clientY + 12 }
}
const onMouseLeave = () => {
  tooltip.value.show = false
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!user.value) await getProfile()
  await Promise.all([fetchPersonMap(), fetchKlasifikasiMap()])
  await fetchData()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (searchTimeout) clearTimeout(searchTimeout)
  pdfUrl.value = null
})

watch(isOpenPreview, (open) => {
  if (!open) pdfUrl.value = null
})

watch(openDetail, (open) => {
  if (!open) {
    selectedRow.value = null
    loadingDetail.value = false
  }
})
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
[data-custom-dropdown] button:focus {
  outline: none;
}
:deep(.dark) {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}
:deep(.dark)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
:deep(.dark)::-webkit-scrollbar-track {
  background: #1f2937;
}
:deep(.dark)::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}
:deep(.dark)::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
