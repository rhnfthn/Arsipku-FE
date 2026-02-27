<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <div class="max-w-[1400px] mx-auto space-y-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {{ $t("naskah_masuk") }}
        </h1>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Table 1 - Monthly Summary -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div
          class="sticky top-0 z-40 bg-white dark:bg-gray-800 flex flex-wrap justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 gap-3"
        >
          <div class="flex items-center gap-3 flex-wrap">
            <button
              @click="refreshData"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
            >
              <RotateCcw
                class="w-4 h-4"
                :class="{ 'animate-spin': loadingTable1 }"
              />
            </button>

            <div class="relative w-[220px] jenis-dropdown">
              <input
                v-model="jenisSearch"
                @mousedown.stop="toggleJenis"
                @input="jenisOpen = true"
                type="text"
                :placeholder="selectedJenis || $t('semua_jenis')"
                class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-900 dark:placeholder-gray-300 rounded-lg px-4 py-2 text-sm w-full border border-transparent focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />

              <svg
                class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-300"
                :class="jenisOpen ? 'rotate-180' : 'rotate-0'"
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

              <!-- Dropdown -->
              <div
                v-if="jenisOpen"
                class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
              >
                <ul class="max-h-60 overflow-auto text-sm">
                  <li
                    @click="selectJenis('')"
                    class="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {{ $t("semua_jenis") }}
                  </li>

                  <li
                    v-for="jenis in jenisOptions"
                    :key="jenis"
                    @click="selectJenis(jenis)"
                    class="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {{ jenis }}
                  </li>

                  <li
                    v-if="!jenisOptions.length"
                    class="px-4 py-2 text-gray-400 dark:text-gray-500"
                  >
                    Tidak ditemukan
                  </li>
                </ul>
              </div>
            </div>

            <div class="relative w-[180px]">
              <select
                v-model="selectedMonth"
                @mousedown="monthOpen = !monthOpen"
                @change="monthOpen = false"
                class="appearance-none bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 pr-10 text-sm w-full cursor-pointer border border-transparent focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              >
                <option value="">{{ $t("semua_bulan") }}</option>
                <option
                  v-for="bulan in monthOptions"
                  :key="bulan.value"
                  :value="bulan.value"
                >
                  {{ bulan.label }}
                </option>
              </select>

              <!-- ICON -->
              <svg
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-300"
                :class="monthOpen ? 'rotate-180' : 'rotate-0'"
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

            <div class="relative w-[140px]">
              <select
                v-model="selectedYear"
                @mousedown="yearOpen = !yearOpen"
                @change="yearOpen = false"
                class="appearance-none bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 pr-10 text-sm w-full cursor-pointer border border-transparent focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              >
                <option
                  v-for="tahun in yearOptions"
                  :key="tahun"
                  :value="tahun"
                >
                  {{ tahun }}
                </option>
              </select>

              <!-- ICON -->
              <svg
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-300"
                :class="yearOpen ? 'rotate-180' : 'rotate-0'"
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
          </div>

          <button
            class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
            @click="exportTable1"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>
        </div>

        <div class="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table class="w-full text-sm">
            <thead
              class="sticky top-0 z-30 bg-primary dark:bg-primary-700 text-white"
            >
              <tr>
                <th class="px-4 py-3 text-left font-semibold">
                  {{ $t("naskah_tbl") }}
                </th>
                <template v-if="!selectedMonth">
                  <th
                    v-for="bulan in monthOptions"
                    :key="bulan.value"
                    class="px-4 py-3 text-center font-semibold"
                  >
                    {{ bulan.label }}
                  </th>
                </template>
                <template v-else>
                  <th class="px-4 py-3 text-center font-semibold">
                    {{ selectedMonthLabel }}
                  </th>
                </template>
                <th class="px-4 py-3 text-center font-semibold">
                  {{ $t("jumlah") }}
                </th>
              </tr>
            </thead>

            <!-- SKELETON LOADING TABLE 1 -->
            <tbody v-if="loadingTable1">
              <tr
                v-for="i in 5"
                :key="'skeleton-' + i"
                class="animate-pulse border-b border-gray-200 dark:border-gray-700"
              >
                <td class="px-4 py-3">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"
                  ></div>
                </td>
                <template v-if="!selectedMonth">
                  <td
                    v-for="bulan in monthOptions"
                    :key="bulan.value"
                    class="px-4 py-3 text-center"
                  >
                    <div
                      class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"
                    ></div>
                  </td>
                </template>
                <template v-else>
                  <td class="px-4 py-3 text-center">
                    <div
                      class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"
                    ></div>
                  </td>
                </template>
                <td class="px-4 py-3 text-center">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto"
                  ></div>
                </td>
              </tr>
            </tbody>

            <!-- DATA ROWS TABLE 1 -->
            <tbody v-else-if="filteredTableData.length">
              <tr
                v-for="row in paginatedTable1Data"
                :key="row.id"
                class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <td
                  class="px-4 py-3 text-gray-900 dark:text-white font-medium max-w-[350px]"
                >
                  {{ row.naskah }}
                </td>
                <template v-if="!selectedMonth">
                  <td
                    v-for="bulan in monthOptions"
                    :key="bulan.value"
                    class="px-4 py-3 text-center text-gray-600 dark:text-gray-300"
                  >
                    {{ row[bulan.value] || "-" }}
                  </td>
                </template>
                <template v-else>
                  <td
                    class="px-4 py-3 text-center text-gray-600 dark:text-gray-300"
                  >
                    {{ row[selectedMonth] || "-" }}
                  </td>
                </template>
                <td
                  class="px-4 py-3 text-center font-bold text-gray-900 dark:text-white"
                >
                  {{ row.jumlah.toLocaleString() }}
                </td>
              </tr>
            </tbody>

            <!-- EMPTY STATE TABLE 1 -->
            <tbody v-else>
              <tr>
                <td
                  :colspan="monthOptions.length + 2"
                  class="text-center py-6 text-gray-400 dark:text-gray-500"
                >
                  Tidak ada data
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION TABLE 1 -->
        <div
          v-if="totalItemsTable1 > 0"
          class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            {{ $t("menampilkan") }}
            {{
              Math.min(currentPageTable1 * itemsPerPageTable1, totalItemsTable1)
            }}
            {{ $t("dari") }} {{ totalItemsTable1 }} {{ $t("data") }}
          </div>

          <div class="flex items-center gap-2">
            <!-- BACK -->
            <button
              @click="currentPageTable1 = Math.max(1, currentPageTable1 - 1)"
              :disabled="currentPageTable1 === 1"
              :class="[
                'px-4 py-1 text-sm rounded-lg transition',
                currentPageTable1 === 1
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 border border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-blue-50 dark:hover:bg-gray-600',
              ]"
            >
              {{ $t("sebelumnya") }}
            </button>

            <!-- PAGE NUMBER -->
            <button
              v-for="page in paginationPagesTable1"
              :key="page"
              @click="currentPageTable1 = page"
              :class="[
                'w-8 h-8 text-sm rounded-lg transition',
                currentPageTable1 === page
                  ? 'bg-primary dark:bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600',
              ]"
            >
              {{ page }}
            </button>

            <!-- NEXT -->
            <button
              @click="
                currentPageTable1 = Math.min(
                  totalPagesTable1,
                  currentPageTable1 + 1,
                )
              "
              :disabled="currentPageTable1 === totalPagesTable1"
              :class="[
                'px-4 py-1 text-sm rounded-lg transition',
                currentPageTable1 === totalPagesTable1
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 border border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-blue-50 dark:hover:bg-gray-600',
              ]"
            >
              {{ $t("selanjutnya") }}
            </button>
          </div>
        </div>
      </div>

      <!-- Table 2 - Detailed List -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3 flex-wrap">
              <button
                @click="refreshData"
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
              >
                <RotateCcw
                  class="w-4 h-4"
                  :class="{ 'animate-spin': loadingTable2 }"
                />
              </button>
              <select
                v-model="filters.jenis"
                class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 text-sm border border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">{{ $t("semua_jenis") }}</option>
                <option value="ND">Nota Dinas</option>
                <option value="ST">Surat Tugas</option>
              </select>
              <select
                v-model="filters.lokasi"
                class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 text-sm border border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">{{ $t("semua_lokasi") }}</option>
                <option v-for="lok in lokasiOptions" :key="lok" :value="lok">
                  {{ lok }}
                </option>
              </select>
              <select
                v-model="filters.status"
                class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 text-sm border border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">{{ $t("semua_status") }}</option>
                <option value="terpakai_final">Final</option>
                <option value="Terpakai">Terpakai</option>
                <option value="booking">Booking</option>
                <option value="Hangus">Hangus</option>
              </select>
              <select
                v-model="filters.tahun"
                class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 text-sm border border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">Semua Tahun</option>
                <option
                  v-for="tahun in tahunOptions"
                  :key="tahun"
                  :value="tahun"
                >
                  {{ tahun }}
                </option>
              </select>
            </div>
            <button
              class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
              @click="exportTable2"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-primary dark:bg-primary-700 text-white">
              <tr>
                <th
                  v-for="col in table2Columns"
                  :key="col.key"
                  @click="handleSort(col.key)"
                  class="px-4 py-3 text-left font-semibold cursor-pointer transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ col.label }}</span>
                    <div class="flex flex-col">
                      <svg
                        class="w-3 h-3 -mb-1"
                        :class="
                          sortConfig.key === col.key &&
                          sortConfig.direction === 'asc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                        />
                      </svg>
                      <svg
                        class="w-3 h-3"
                        :class="
                          sortConfig.key === col.key &&
                          sortConfig.direction === 'desc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        />
                      </svg>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>

            <!-- SKELETON LOADING TABLE 2 -->
            <tbody
              v-if="loadingTable2"
              class="divide-y divide-gray-200 dark:divide-gray-700"
            >
              <tr v-for="i in 5" :key="'skeleton-2-' + i" class="animate-pulse">
                <td class="px-4 py-3">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"
                  ></div>
                </td>
                <td class="px-4 py-3">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"
                  ></div>
                </td>
                <td class="px-4 py-3">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"
                  ></div>
                </td>
                <td class="px-4 py-3">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"
                  ></div>
                </td>
                <td class="px-4 py-3">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"
                  ></div>
                </td>
                <td class="px-4 py-3">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"
                  ></div>
                </td>
                <td class="px-4 py-3">
                  <div
                    class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"
                  ></div>
                </td>
              </tr>
            </tbody>

            <!-- DATA ROWS TABLE 2 -->
            <tbody v-else class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="item in paginatedData"
                :key="item.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td class="px-4 py-3 text-gray-900 dark:text-white">
                  {{ item.jenis }}
                </td>
                <td
                  class="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono"
                >
                  {{ item.nomor }}
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ item.tanggal }}
                </td>
                <td class="px-4 py-3 text-gray-900 dark:text-white max-w-xs">
                  {{ item.perihal }}
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ item.jabatan }}
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ item.lokasi }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex px-3 py-1 rounded-full text-xs font-medium"
                    :class="getStatusClass(item.status)"
                  >
                    {{ item.status }}
                  </span>
                </td>
              </tr>

              <!-- EMPTY STATE TABLE 2 -->
              <tr v-if="paginatedData.length === 0">
                <td
                  colspan="7"
                  class="text-center py-8 text-gray-400 dark:text-gray-500"
                >
                  Tidak ada data
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION TABLE 2 -->
        <div
          v-if="totalItems > 0"
          class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            {{ $t("menampilkan") }} {{ currentItemsCount }} {{ $t("dari") }}
            {{ totalItems }} {{ $t("data") }}
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              :class="[
                'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
                currentPage === 1
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 border border-primary-600 dark:border-primary-500 hover:bg-blue-50 dark:hover:bg-gray-600',
              ]"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {{ $t("sebelumnya") }}
            </button>
            <div class="flex items-center gap-1">
              <button
                v-if="paginationPages[0] > 1"
                @click="currentPage = 1"
                class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
              >
                1
              </button>
              <span
                v-if="paginationPages[0] > 2"
                class="px-2 text-gray-400 dark:text-gray-500"
                >...</span
              >
              <button
                v-for="page in paginationPages"
                :key="page"
                @click="currentPage = page"
                :class="[
                  'w-8 h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                  currentPage === page
                    ? 'bg-primary dark:bg-primary-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400',
                ]"
              >
                {{ page }}
              </button>
              <span
                v-if="
                  paginationPages[paginationPages.length - 1] < totalPages - 1
                "
                class="px-2 text-gray-400 dark:text-gray-500"
                >...</span
              >
              <button
                v-if="paginationPages[paginationPages.length - 1] < totalPages"
                @click="currentPage = totalPages"
                class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
              >
                {{ totalPages }}
              </button>
            </div>
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              :class="[
                'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
                currentPage === totalPages
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 border border-primary-600 dark:border-primary-500 hover:bg-blue-50 dark:hover:bg-gray-600',
              ]"
            >
              {{ $t("selanjutnya") }}
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { RotateCcw } from "lucide-vue-next";
import { useLaporan } from "~/composables/useLaporan";
import { useToast } from "#imports";
import * as XLSX from "xlsx";

const toast = useToast();
const { t } = useI18n();

const breadcrumbs = [
  { label: t("beranda"), to: "/beranda" },
  { label: t("naskah_masuk"), to: "/admin/laporan/naskah-masuk" },
];

const { getRekapNaskahMasuk, getRekapNaskahMasukDetail } = useLaporan();

const table1Raw = ref<any[]>([]);
const loadingTable1 = ref(false);

const table2Data = ref<any[]>([]);
const loadingTable2 = ref(false);

const toggleJenis = () => {
  jenisOpen.value = !jenisOpen.value;
};

const jenisSearch = ref("");
const selectedJenis = ref("");
const jenisOpen = ref(false);

const monthOpen = ref(false);
const yearOpen = ref(false);

const selectJenis = (jenis: string) => {
  selectedJenis.value = jenis;
  jenisSearch.value = "";
  jenisOpen.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  const el = document.querySelector(".jenis-dropdown");
  if (el && !el.contains(e.target as Node)) {
    jenisOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const selectedType = ref("");
const selectedMonth = ref("");
const selectedYear = ref<number>(new Date().getFullYear());
const filters = ref({
  jenis: "",
  lokasi: "",
  status: "",
  tahun: "",
  search: "",
});
const sortConfig = ref<{ key: string | null; direction: "asc" | "desc" }>({
  key: null,
  direction: "asc",
});
const currentPage = ref(1);
const itemsPerPage = ref(5);

const monthOptions = computed(() => [
  { label: t("jan"), value: "jan" },
  { label: t("feb"), value: "feb" },
  { label: t("mar"), value: "mar" },
  { label: t("apr"), value: "apr" },
  { label: t("mei"), value: "mei" },
  { label: t("juni"), value: "jun" },
  { label: t("juli"), value: "jul" },
  { label: t("agu"), value: "agu" },
  { label: t("sep"), value: "sep" },
  { label: t("okt"), value: "okt" },
  { label: t("nov"), value: "nov" },
  { label: t("des"), value: "des" },
]);

const table2Columns = computed(() => [
  { key: "naskah", label: t("naskah_tbl") },
  { key: "nomor", label: t("nodokumen") },
  { key: "tanggal", label: t("tanggal") },
  { key: "perihal", label: t("perihal") },
  { key: "jabatan", label: t("jabatan") },
  { key: "lokasi", label: t("lokasi") },
  { key: "status", label: "Status" },
]);

const fetchTable1 = async () => {
  loadingTable1.value = true;
  try {
    const res = await getRekapNaskahMasuk({
      tahun: selectedYear.value,
    });

    table1Raw.value = res.data.rekap ?? [];
  } catch (err) {
    console.error("Gagal ambil rekap naskah masuk", err);
  } finally {
    loadingTable1.value = false;
  }
};

const fetchTable2 = async () => {
  loadingTable2.value = true;

  try {
    const params: any = {
      page: currentPage.value,
      limit: itemsPerPage.value,
    };

    if (filters.value.tahun) {
      params.tahun = Number(filters.value.tahun);
    }

    if (filters.value.jenis) {
      params.jenis = filters.value.jenis;
    }

    if (filters.value.status) {
      params.status = filters.value.status.toLowerCase();
    }

    const res = await getRekapNaskahMasukDetail(params);

    table2Data.value = (res.data ?? []).map((item: any) => ({
      id: item.id,
      jenis: item.naskah,
      jenis_text: item.naskah_text,
      nomor: item.nomor,
      tanggal: formatTanggal(item.tanggal),
      perihal: item.perihal ?? "-",
      jabatan: item.jabatan,
      lokasi: item.lokasi,
      status:
        item.status === "terpakai_final" ? "Final" : capitalize(item.status),
    }));

    totalItems.value = res.pagination?.total ?? 0;
  } catch (err) {
    console.error("Gagal ambil detail naskah masuk", err);
    totalItems.value = 0;
  } finally {
    loadingTable2.value = false;
  }
};

const formatTanggal = (date: string) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const capitalize = (text: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : "-";

const filteredTableData = computed(() => {
  return table1Raw.value
    .filter((row) => {
      if (selectedJenis.value && row.jenis_text !== selectedJenis.value) {
        return false;
      }

      if (
        jenisSearch.value &&
        !row.jenis_text?.toLowerCase().includes(jenisSearch.value.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .map((row) => ({
      id: row.jenis,
      naskah: row.jenis_text,
      ...row,
      jumlah: row.total ?? 0,
    }));
});

watch(
  () => ({ ...filters.value }),
  () => {
    currentPage.value = 1;
    fetchTable2();
  },
  { deep: true },
);

onMounted(() => {
  fetchTable1();
  fetchTable2();
});

const jenisOptions = computed(() => {
  const all = [...new Set(table1Raw.value.map((r) => r.jenis_text))];
  if (!jenisSearch.value) return all;
  return all.filter((j) =>
    j.toLowerCase().includes(jenisSearch.value.toLowerCase()),
  );
});

const selectedMonthLabel = computed(
  () =>
    monthOptions.value.find((m) => m.value === selectedMonth.value)?.label ??
    "",
);

watch(selectedYear, () => {
  fetchTable1();
});

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
});

const lokasiOptions = computed(() => [
  ...new Set(table2Data.value.map((d) => d.lokasi)),
]);

const tahunOptions = computed(() =>
  [
    ...new Set(
      table2Data.value.map((d) => d.tanggal?.split("/")?.[2]).filter(Boolean),
    ),
  ].sort((a, b) => Number(b) - Number(a)),
);

const filteredData = computed(() => {
  return table2Data.value.filter((item) => {
    const tahunItem = item.tanggal.split("/")[2];

    return (
      (!filters.value.jenis || item.jenis === filters.value.jenis) &&
      (!filters.value.lokasi || item.lokasi === filters.value.lokasi) &&
      (!filters.value.status || item.status === filters.value.status) &&
      (!filters.value.tahun || tahunItem === filters.value.tahun)
    );
  });
});

const sortedData = computed(() => {
  if (!sortConfig.value.key) return filteredData.value;
  return [...filteredData.value].sort((a, b) => {
    const aVal = a[sortConfig.value.key];
    const bVal = b[sortConfig.value.key];
    if (aVal < bVal) return sortConfig.value.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.value.direction === "asc" ? 1 : -1;
    return 0;
  });
});

// ===== PAGINATION TABLE 1 =====
const currentPageTable1 = ref(1);
const itemsPerPageTable1 = ref(5);

const totalItemsTable1 = computed(() => filteredTableData.value.length);

const totalPagesTable1 = computed(() =>
  Math.ceil(totalItemsTable1.value / itemsPerPageTable1.value),
);

const paginatedTable1Data = computed(() => {
  const start = (currentPageTable1.value - 1) * itemsPerPageTable1.value;

  return filteredTableData.value.slice(start, start + itemsPerPageTable1.value);
});

const paginationPagesTable1 = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;

  let start = Math.max(1, currentPageTable1.value - Math.floor(maxVisible / 2));

  let end = Math.min(totalPagesTable1.value, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) pages.push(i);

  return pages;
});

watch([selectedJenis, jenisSearch, selectedMonth, selectedYear], () => {
  currentPageTable1.value = 1;
});

const totalItems = ref(0);
const totalPages = computed(() =>
  Math.ceil(totalItems.value / itemsPerPage.value),
);
const paginatedData = computed(() => table2Data.value);

const currentItemsCount = computed(() => paginatedData.value.length);

const paginationPages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

watch(
  [() => filters.value, () => sortConfig.value],
  () => {
    currentPage.value = 1;
  },
  { deep: true },
);

watch(totalPages, (val) => {
  if (currentPage.value > val) currentPage.value = val || 1;
});

watch(currentPage, () => {
  fetchTable2();
});

const handleSort = (key: string) => {
  sortConfig.value = {
    key,
    direction:
      sortConfig.value.key === key && sortConfig.value.direction === "asc"
        ? "desc"
        : "asc",
  };
};

const getStatusClass = (status: string) => {
  if (status === "Terpakai")
    return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300";
  if (status === "Final")
    return "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200";
  if (status === "Booking")
    return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300";
  return "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
};

const refreshData = () => {
  selectedMonth.value = "";
  jenisSearch.value = "";
  selectedYear.value = new Date().getFullYear();
  fetchTable1();
  fetchTable2();
};

const exportTable1 = () => {
  if (!filteredTableData.value.length) {
    toast.add({
      title: "Export gagal",
      description: "Tidak ada data untuk diexport",
      color: "warning",
    });
    return;
  }

  try {
    const headers: string[] = [t("naskah_tbl")];

    if (!selectedMonth.value) {
      headers.push(...monthOptions.value.map((m) => m.label));
    } else {
      headers.push(selectedMonthLabel.value);
    }

    headers.push(t("jumlah"));

    const rows = filteredTableData.value.map((row) => {
      const data: (string | number)[] = [row.naskah];

      if (!selectedMonth.value) {
        monthOptions.value.forEach((m) => {
          data.push(Number(row[m.value] ?? 0));
        });
      } else {
        data.push(Number(row[selectedMonth.value] ?? 0));
      }

      data.push(Number(row.jumlah ?? 0));
      return data;
    });

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!cols"] = headers.map(() => ({ wch: 20 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Naskah Masuk");

    XLSX.writeFile(workbook, `naskah-masuk-summary-${selectedYear.value}.xlsx`);

    toast.add({
      title: "Export berhasil",
      description: "File Excel berhasil diunduh",
      color: "success",
    });
  } catch (err) {
    console.error(err);
    toast.add({
      title: "Export gagal",
      description: "Terjadi kesalahan saat membuat file Excel",
      color: "error",
    });
  }
};

const exportTable2 = () => {
  if (!sortedData.value.length) {
    toast.add({
      title: "Export gagal",
      description: "Tidak ada data untuk diexport",
      color: "warning",
    });
    return;
  }

  try {
    const rows = sortedData.value.map((item) => ({
      [t("naskah_tbl")]: item.jenis,
      [t("nodokumen")]: item.nomor,
      [t("tanggal")]: item.tanggal,
      [t("perihal")]: item.perihal,
      [t("jabatan")]: item.jabatan,
      [t("lokasi")]: item.lokasi,
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 35 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Detail Naskah");

    XLSX.writeFile(
      workbook,
      `naskah-masuk-detail-${new Date().getTime()}.xlsx`,
    );

    toast.add({
      title: "Export berhasil",
      description: "File Excel berhasil diunduh",
      color: "success",
    });
  } catch (err) {
    console.error(err);
    toast.add({
      title: "Export gagal",
      description: "Terjadi kesalahan saat membuat file Excel",
      color: "error",
    });
  }
};
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
