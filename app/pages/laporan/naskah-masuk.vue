<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <EmptyState
      v-if="!canViewLaporan"
      icon="i-lucide-lock"
      title="Akses Ditolak"
      description="Anda tidak punya izin melihat laporan. Hubungi administrator."
    />
    <div v-else class="max-w-[1400px] mx-auto space-y-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {{ $t('naskah_masuk') }}
        </h1>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Table 1 - Monthly Summary -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div
          class="sticky top-0 z-40 bg-white dark:bg-gray-800 flex flex-wrap justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 gap-3"
        >
          <div class="flex items-center gap-2 flex-nowrap">
            <!-- REFRESH -->
            <button
              @click="refreshData"
              class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400"
            >
              <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': loadingTable1 }" />
            </button>

            <!-- JENIS FILTER -->
            <div class="relative w-[180px] shrink-0">
              <div
                @click="t1Toggle('jenis')"
                class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
              >
                <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                  {{ selectedJenis || $t('semua_jenis') }}
                </span>
                <ChevronDown
                  class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                  :class="{ 'rotate-180': t1Open === 'jenis' }"
                />
              </div>
              <Transition name="filter-dd">
                <div
                  v-if="t1Open === 'jenis'"
                  class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
                >
                  <div class="mb-1">
                    <input
                      v-model="jenisSearch"
                      @click.stop
                      type="text"
                      :placeholder="$t('cari')"
                      class="h-7 w-full rounded-lg px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
                    <button
                      @mousedown.prevent
                      @click="selectJenis('')"
                      class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                      :class="
                        !selectedJenis
                          ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                      "
                    >
                      {{ $t('semua_jenis') }}
                    </button>
                    <button
                      v-for="jenis in jenisOptions"
                      :key="jenis"
                      @mousedown.prevent
                      @click="selectJenis(jenis)"
                      class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                      :class="
                        selectedJenis === jenis
                          ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                      "
                    >
                      {{ jenis }}
                    </button>
                    <div
                      v-if="!jenisOptions.length"
                      class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 italic"
                    >
                      {{ $t('tidak_ditemukan') }}
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- LOKASI FILTER (TABLE 1) -->
            <div v-if="canSeeLocationFilter" class="relative w-[180px] shrink-0">
              <div
                @click="t1Toggle('lokasi')"
                class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
              >
                <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                  {{ selectedLokasi || $t('semua_lokasi') }}
                </span>
                <ChevronDown
                  class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                  :class="{ 'rotate-180': t1Open === 'lokasi' }"
                />
              </div>
              <Transition name="filter-dd">
                <div
                  v-if="t1Open === 'lokasi'"
                  class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
                >
                  <div class="mb-1">
                    <input
                      v-model="lokasiSearch"
                      @click.stop
                      type="text"
                      :placeholder="$t('cari')"
                      class="h-7 w-full rounded-lg px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
                    <button
                      @mousedown.prevent
                      @click="selectLokasi('')"
                      class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                      :class="
                        !selectedLokasi
                          ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                      "
                    >
                      {{ $t('semua_lokasi') }}
                    </button>
                    <button
                      v-for="lokasi in filteredTable1LokasiOptions"
                      :key="lokasi"
                      @mousedown.prevent
                      @click="selectLokasi(lokasi)"
                      class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                      :class="
                        selectedLokasi === lokasi
                          ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                      "
                    >
                      {{ lokasi }}
                    </button>
                    <div
                      v-if="!filteredTable1LokasiOptions.length"
                      class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 italic"
                    >
                      {{ $t('tidak_ditemukan') }}
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- BULAN FILTER -->
            <div class="relative w-[150px] shrink-0">
              <div
                @click="t1Toggle('bulan')"
                class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
              >
                <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                  {{ selectedMonthLabel || $t('semua_bulan') }}
                </span>
                <ChevronDown
                  class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                  :class="{ 'rotate-180': t1Open === 'bulan' }"
                />
              </div>
              <Transition name="filter-dd">
                <div
                  v-if="t1Open === 'bulan'"
                  class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
                >
                  <div class="flex flex-col gap-1 max-h-60 overflow-y-auto">
                    <button
                      @mousedown.prevent
                      @click="
                        selectedMonth = '';
                        t1Open = null;
                      "
                      class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                      :class="
                        !selectedMonth
                          ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                      "
                    >
                      {{ $t('semua_bulan') }}
                    </button>
                    <button
                      v-for="bulan in monthOptions"
                      :key="bulan.value"
                      @mousedown.prevent
                      @click="
                        selectedMonth = bulan.value;
                        t1Open = null;
                      "
                      class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                      :class="
                        selectedMonth === bulan.value
                          ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                      "
                    >
                      {{ bulan.label }}
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- TAHUN FILTER -->
            <div class="relative w-[110px] shrink-0">
              <div
                @click="t1Toggle('tahun')"
                class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
              >
                <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                  {{ selectedYear }}
                </span>
                <ChevronDown
                  class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                  :class="{ 'rotate-180': t1Open === 'tahun' }"
                />
              </div>
              <Transition name="filter-dd">
                <div
                  v-if="t1Open === 'tahun'"
                  class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
                >
                  <div class="flex flex-col gap-1">
                    <button
                      v-for="tahun in yearOptions"
                      :key="tahun"
                      @mousedown.prevent
                      @click="
                        selectedYear = tahun;
                        t1Open = null;
                      "
                      class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                      :class="
                        selectedYear === tahun
                          ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                      "
                    >
                      {{ tahun }}
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- SEARCH FILTER TABLE 1 -->
          <div class="relative flex-1 min-w-[180px] max-w-xs ml-auto">
            <Search
              class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="table1Search"
              @input="handleTable1SearchInput"
              :placeholder="$t('cari') + ' ' + $t('naskah_tbl') + '...'"
              class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm pl-9 pr-3 py-1.5 rounded-lg dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:border-primary"
            />
          </div>

          <button
            v-if="hasPermission('laporan', 'export-naskah-masuk')"
            class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-9 px-6 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
            :disabled="isExportingTable1"
            @click="openExportModalTable1"
          >
            <FileDown class="w-4 h-4" />
            {{ isExportingTable1 ? $t('ver_btn_mengekspor') || 'Mengekspor...' : $t('export') }}
          </button>
        </div>

        <div class="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table class="w-full text-sm">
            <thead class="sticky top-0 z-30 bg-primary dark:bg-primary-700 text-white">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">
                  {{ $t('naskah_tbl') }}
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
                  {{ $t('jumlah') }}
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
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                </td>
                <template v-if="!selectedMonth">
                  <td
                    v-for="bulan in monthOptions"
                    :key="bulan.value"
                    class="px-4 py-3 text-center"
                  >
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
                  </td>
                </template>
                <template v-else>
                  <td class="px-4 py-3 text-center">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
                  </td>
                </template>
                <td class="px-4 py-3 text-center">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto"></div>
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
                <td class="px-4 py-3 text-gray-900 dark:text-white font-medium max-w-[350px]">
                  {{ row.naskah }}
                </td>
                <template v-if="!selectedMonth">
                  <td
                    v-for="bulan in monthOptions"
                    :key="bulan.value"
                    class="px-4 py-3 text-center text-gray-600 dark:text-gray-300"
                  >
                    {{ row[bulan.value] || '-' }}
                  </td>
                </template>
                <template v-else>
                  <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                    {{ row[selectedMonth] || '-' }}
                  </td>
                </template>
                <td class="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">
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
                  {{ $t('tidak_ada_data') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION TABLE 1 -->
        <div
          v-if="totalItemsTable1 > 0"
          class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            {{ $t('menampilkan') }}
            {{ Math.min(currentPageTable1 * itemsPerPageTable1, totalItemsTable1) }}
            {{ $t('dari') }} {{ totalItemsTable1 }} {{ $t('data') }}
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="currentPageTable1 = Math.max(1, currentPageTable1 - 1)"
              :disabled="currentPageTable1 === 1"
              :class="[
                'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                currentPageTable1 === 1
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-primary border border-primary hover:bg-primary-50 dark:hover:bg-gray-700'
              ]"
            >
              {{ $t('sebelumnya') }}
            </button>
            <button
              v-for="page in paginationPagesTable1"
              :key="page"
              @click="currentPageTable1 = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPageTable1 === page
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              ]"
            >
              {{ page }}
            </button>
            <button
              @click="currentPageTable1 = Math.min(totalPagesTable1, currentPageTable1 + 1)"
              :disabled="currentPageTable1 === totalPagesTable1"
              :class="[
                'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                currentPageTable1 === totalPagesTable1
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-primary border border-primary hover:bg-primary-50 dark:hover:bg-gray-700'
              ]"
            >
              {{ $t('selanjutnya') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Table 2 - Detailed List -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="p-3 border-b border-gray-200 dark:border-gray-700">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-nowrap">
              <!-- REFRESH -->
              <button
                @click="refreshData"
                class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400"
              >
                <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': loadingTable2 }" />
              </button>

              <!-- ROWS PER PAGE -->
              <div class="relative">
                <button
                  type="button"
                  @click="t2Toggle('limit')"
                  class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
                >
                  <span>{{ itemsPerPage }}</span>
                  <ChevronDown
                    class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-180': t2Open === 'limit' }"
                  />
                </button>
                <Transition name="filter-dd">
                  <div
                    v-if="t2Open === 'limit'"
                    class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                  >
                    <button
                      v-for="n in [5, 10, 20, 50]"
                      :key="n"
                      type="button"
                      @click="
                        itemsPerPage = n;
                        t2Open = null;
                      "
                      :class="[
                        'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                        itemsPerPage === n
                          ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                          : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                      ]"
                    >
                      {{ n }}
                    </button>
                  </div>
                </Transition>
              </div>

              <!-- JENIS -->
              <div class="relative w-[160px] shrink-0">
                <div
                  @click="t2Toggle('jenis')"
                  class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
                >
                  <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                    {{ table2JenisLabel }}
                  </span>
                  <ChevronDown
                    class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                    :class="{ 'rotate-180': t2Open === 'jenis' }"
                  />
                </div>
                <Transition name="filter-dd">
                  <div
                    v-if="t2Open === 'jenis'"
                    class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
                  >
                    <div class="mb-1">
                      <input
                        v-model="t2JenisKeyword"
                        @click.stop
                        type="text"
                        :placeholder="$t('cari')"
                        class="h-7 w-full rounded-lg px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
                      <button
                        v-for="opt in filteredTable2JenisOptions"
                        :key="opt.value"
                        @mousedown.prevent
                        @click="
                          filters.jenis = opt.value;
                          t2JenisKeyword = '';
                          t2Open = null;
                        "
                        class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                        :class="
                          filters.jenis === opt.value
                            ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                        "
                      >
                        {{ opt.label }}
                      </button>
                      <div
                        v-if="filteredTable2JenisOptions.length === 0"
                        class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 italic"
                      >
                        {{ $t('tidak_ditemukan') }}
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- LOKASI -->
              <div v-if="canSeeLocationFilter" class="relative w-[160px] shrink-0">
                <div
                  @click="t2Toggle('lokasi')"
                  class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
                >
                  <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                    {{ filters.lokasi || $t('semua_lokasi') }}
                  </span>
                  <ChevronDown
                    class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                    :class="{ 'rotate-180': t2Open === 'lokasi' }"
                  />
                </div>
                <Transition name="filter-dd">
                  <div
                    v-if="t2Open === 'lokasi'"
                    class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
                  >
                    <div class="mb-1">
                      <input
                        v-model="t2LokasiKeyword"
                        @click.stop
                        type="text"
                        :placeholder="$t('cari')"
                        class="h-7 w-full rounded-lg px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div class="flex flex-col gap-1 max-h-60 overflow-y-auto">
                      <button
                        @mousedown.prevent
                        @click="
                          filters.lokasi = '';
                          t2LokasiKeyword = '';
                          t2Open = null;
                        "
                        class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                        :class="
                          !filters.lokasi
                            ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                        "
                      >
                        {{ $t('semua_lokasi') }}
                      </button>
                      <button
                        v-for="lok in filteredTable2LokasiOptions"
                        :key="lok"
                        @mousedown.prevent
                        @click="
                          filters.lokasi = lok;
                          t2LokasiKeyword = '';
                          t2Open = null;
                        "
                        class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                        :class="
                          filters.lokasi === lok
                            ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                        "
                      >
                        {{ lok }}
                      </button>
                      <div
                        v-if="filteredTable2LokasiOptions.length === 0"
                        class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 italic"
                      >
                        {{ $t('tidak_ditemukan') }}
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- STATUS -->
              <div class="relative w-[160px] shrink-0">
                <div
                  @click="t2Toggle('status')"
                  class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
                >
                  <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                    {{ t2StatusLabel || $t('semua_status') }}
                  </span>
                  <ChevronDown
                    class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                    :class="{ 'rotate-180': t2Open === 'status' }"
                  />
                </div>
                <Transition name="filter-dd">
                  <div
                    v-if="t2Open === 'status'"
                    class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
                  >
                    <div class="flex flex-col gap-1 max-h-60 overflow-y-auto">
                      <button
                        v-for="opt in ([
                          { label: $t('semua_status'), value: '', color: null },
                          {
                            label: $t('nom_status_final'),
                            value: 'terpakai_final',
                            color: null
                          },
                          {
                            label: $t('nom_status_terpakai'),
                            value: 'Terpakai',
                            color: null
                          },
                          { label: $t('nom_status_booking'), value: 'booking', color: null },
                          { label: 'Draft', value: 'draft', color: null },
                          { label: 'Ditolak', value: 'ditolak', color: null },
                          { label: 'Batal', value: 'Hangus', color: null }
                        ] as any[])"
                        :key="opt.value"
                        @mousedown.prevent
                        @click="
                          filters.status = opt.value;
                          t2Open = null;
                        "
                        class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                        :class="[
                          filters.status === opt.value
                            ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700',
                          filters.status !== opt.value && opt.color ? opt.color : ''
                        ]"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- TAHUN -->
              <div class="relative w-[130px] shrink-0">
                <div
                  @click="t2Toggle('tahun')"
                  class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
                >
                  <span
                    class="flex-1 truncate text-sm"
                    :class="
                      filters.tahun ? 'text-gray-700 dark:text-white' : 'text-black dark:text-white'
                    "
                  >
                    {{ filters.tahun || new Date().getFullYear() }}
                  </span>
                  <ChevronDown
                    class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                    :class="{ 'rotate-180': t2Open === 'tahun' }"
                  />
                </div>
                <Transition name="filter-dd">
                  <div
                    v-if="t2Open === 'tahun'"
                    class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
                  >
                    <div class="flex flex-col gap-1 max-h-60 overflow-y-auto">
                      <button
                        v-for="tahun in tahunOptions"
                        :key="tahun"
                        @mousedown.prevent
                        @click="
                          filters.tahun = tahun;
                          t2Open = null;
                        "
                        class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                        :class="
                          filters.tahun === tahun
                            ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                        "
                      >
                        {{ tahun }}
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- SEARCH FILTER TABLE 2 -->
            <div class="relative flex-1 min-w-[180px] max-w-xs ml-auto">
              <Search
                class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                v-model="filters.search"
                @input="handleTable2SearchInput"
                :placeholder="$t('cari') + '...'"
                class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm pl-9 pr-3 py-1.5 rounded-lg dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>

            <button
              v-if="hasPermission('laporan', 'export-naskah-masuk')"
              class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-9 px-6 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
              :disabled="isExportingTable2"
              @click="openExportModalTable2"
            >
              <FileDown class="w-4 h-4" />
              {{ isExportingTable2 ? $t('ver_btn_mengekspor') || 'Mengekspor...' : $t('export') }}
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
                  class="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-primary-600 dark:hover:bg-primary-600 transition-colors select-none"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ col.label }}</span>
                    <ArrowUpDown
                      class="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                      :class="[
                        sortConfig.key === col.key ? 'opacity-100' : 'opacity-40',
                        sortConfig.key === col.key && sortConfig.direction === 'desc'
                          ? 'rotate-180'
                          : ''
                      ]"
                    />
                  </div>
                </th>
              </tr>
            </thead>

            <!-- SKELETON LOADING TABLE 2 -->
            <tbody v-if="loadingTable2" class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="i in 5" :key="'skeleton-2-' + i" class="animate-pulse">
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
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
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono">
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
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
              </tr>

              <!-- EMPTY STATE TABLE 2 -->
              <tr v-if="paginatedData.length === 0">
                <td colspan="7" class="text-center py-8 text-gray-400 dark:text-gray-500">
                  {{ $t('tidak_ada_data') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION TABLE 2 -->
        <div
          v-if="totalItems > 0"
          class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            {{ $t('menampilkan') }} {{ currentItemsCount }} {{ $t('dari') }} {{ totalItems }}
            {{ $t('data') }}
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              :class="[
                'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                currentPage === 1
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-primary border border-primary hover:bg-primary-50 dark:hover:bg-gray-700'
              ]"
            >
              {{ $t('sebelumnya') }}
            </button>
            <div class="flex items-center gap-1">
              <button
                v-if="paginationPages[0] > 1"
                @click="currentPage = 1"
                class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                1
              </button>
              <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400 dark:text-gray-500"
                >...</span
              >
              <button
                v-for="page in paginationPages"
                :key="page"
                @click="currentPage = page"
                :class="[
                  'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                  currentPage === page
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                ]"
              >
                {{ page }}
              </button>
              <span
                v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
                class="px-2 text-gray-400 dark:text-gray-500"
                >...</span
              >
              <button
                v-if="paginationPages[paginationPages.length - 1] < totalPages"
                @click="currentPage = totalPages"
                class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
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
                  : 'bg-white dark:bg-gray-800 text-primary border border-primary hover:bg-primary-50 dark:hover:bg-gray-700'
              ]"
            >
              {{ $t('selanjutnya') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Export Kolom Table 1 -->
    <ExportColumnModal
      v-model="showExportModalTable1"
      :columns="exportColumnsTable1"
      :total-rows="totalItemsTable1"
      :is-exporting="isExportingTable1"
      @confirm="handleExportTable1Confirm"
    />

    <!-- Modal Export Kolom Table 2 -->
    <ExportColumnModal
      v-model="showExportModalTable2"
      :columns="exportColumnsTable2"
      :total-rows="totalItems"
      :is-exporting="isExportingTable2"
      @confirm="handleExportTable2Confirm"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { RotateCcw, ChevronDown, ArrowUpDown, FileDown, Search } from 'lucide-vue-next';
import { useLaporan } from '~/composables/useLaporan';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '#imports';
import * as XLSX from 'xlsx';
import { formatDateNumeric as formatTanggal } from '~/utils/mail-helpers';

const toast = useToast();
const { t } = useI18n();
const { user, getProfile, hasPermission } = useAuth();
const { canAccessPage } = useFeatureAccess();

const canViewLaporan = computed(() => canAccessPage());

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_masuk'), to: '/laporan/naskah-masuk' }
]);

const { getRekapNaskahMasuk, getRekapNaskahMasukDetail, getAreaList, getJenisList } = useLaporan();

const table1Raw = ref<any[]>([]);
const loadingTable1 = ref(false);

const table2Data = ref<any[]>([]);
const loadingTable2 = ref(false);

// API OPTIONS DATA
const jenisOptionsApi = ref<any[]>([]);
const lokasiOptionsApi = ref<any[]>([]);

//COMPUTED - Check if user can see location filter
const canSeeLocationFilter = computed(() => {
  if (!user.value) return false;
  return user.value.area === 'A000' || user.value.subAreaText === 'Kantor Pusat';
});

// TABLE 1 FILTER STATE
const jenisSearch = ref('');
const selectedJenis = ref('');
const selectedLokasi = ref('');
const lokasiSearch = ref('');
const t1Open = ref<string | null>(null);
const table1Search = ref('');

const handleTable1SearchInput = () => {
  currentPageTable1.value = 1;
};

const selectJenis = (jenis: string) => {
  selectedJenis.value = jenis;
  jenisSearch.value = '';
  t1Open.value = null;
};

const selectLokasi = (lokasi: string) => {
  selectedLokasi.value = lokasi;
  lokasiSearch.value = '';
  t1Open.value = null;
};

const t1Toggle = (key: string) => {
  t1Open.value = t1Open.value === key ? null : key;
};

// TABLE 2 FILTER STATE
const t2Open = ref<string | null>(null);

const t2JenisKeyword = ref('');
const t2LokasiKeyword = ref('');

const t2Toggle = (key: string) => {
  t2Open.value = t2Open.value === key ? null : key;
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative')) {
    t1Open.value = null;
    t2Open.value = null;
  }
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  await getProfile();
  fetchTable1();
  fetchTable2();
  fetchJenis();
  fetchArea();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

const selectedMonth = ref('');
const selectedYear = ref<number>(new Date().getFullYear());
const filters = ref({
  jenis: '',
  lokasi: '',
  status: '',
  tahun: '',
  search: ''
});
const sortConfig = ref<{ key: string | null; direction: 'asc' | 'desc' }>({
  key: null,
  direction: 'asc'
});
const currentPage = ref(1);
const itemsPerPage = ref(10);

const monthOptions = computed(() => [
  { label: t('jan'), value: 'jan' },
  { label: t('feb'), value: 'feb' },
  { label: t('mar'), value: 'mar' },
  { label: t('apr'), value: 'apr' },
  { label: t('mei'), value: 'mei' },
  { label: t('juni'), value: 'jun' },
  { label: t('juli'), value: 'jul' },
  { label: t('agu'), value: 'agu' },
  { label: t('sep'), value: 'sep' },
  { label: t('okt'), value: 'okt' },
  { label: t('nov'), value: 'nov' },
  { label: t('des'), value: 'des' }
]);

const table2Columns = computed(() => [
  { key: 'jenis', label: t('naskah_tbl') },
  { key: 'nomor', label: t('nodokumen') },
  { key: 'tanggal', label: t('tanggal') },
  { key: 'perihal', label: t('perihal') },
  { key: 'jabatan', label: t('jabatan') },
  { key: 'lokasi', label: t('lokasi') },
  { key: 'status', label: t('sign_status') }
]);

const fetchTable1 = async () => {
  loadingTable1.value = true;
  try {
    const params: any = { tahun: selectedYear.value };
    if (selectedLokasi.value) {
      const lokasiObj = lokasiOptionsApi.value.find(
        (item: any) => (item.nama || item.longText) === selectedLokasi.value
      );
      if (lokasiObj) params.area = lokasiObj.kode || lokasiObj.value;
    }
    const res = await getRekapNaskahMasuk(params);
    table1Raw.value = res.data.rekap ?? [];
  } catch (err) {
    console.error('Gagal ambil rekap naskah masuk', err);
  } finally {
    loadingTable1.value = false;
  }
};

const fetchTable2 = async () => {
  loadingTable2.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: itemsPerPage.value
    };
    if (filters.value.tahun) params.tahun = Number(filters.value.tahun);
    if (filters.value.jenis) params.jenis = filters.value.jenis;
    if (filters.value.status) params.status = filters.value.status.toLowerCase();
    if (filters.value.lokasi) {
      const lokasiObj = lokasiOptionsApi.value.find(
        (item: any) => (item.nama || item.longText) === filters.value.lokasi
      );
      if (lokasiObj) params.area = lokasiObj.kode || lokasiObj.value;
    }
    if (filters.value.search) params.search = filters.value.search;

    const res = await getRekapNaskahMasukDetail(params);
    table2Data.value = (res.data ?? []).map((item: any) => ({
      id: item.id,
      jenis: item.naskah,
      jenis_text: item.naskah_text,
      nomor: item.nomor,
      tanggal: formatTanggal(item.tanggal),
      perihal: item.perihal ?? '-',
      jabatan: item.jabatan,
      lokasi: item.lokasi,
      status: item.status === 'terpakai_final' ? 'Final' : capitalize(item.status)
    }));
    totalItems.value = res.pagination?.total ?? 0;
  } catch (err) {
    console.error('Gagal ambil detail naskah masuk', err);
    totalItems.value = 0;
  } finally {
    loadingTable2.value = false;
  }
};

const capitalize = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '-');

const fetchJenis = async () => {
  try {
    const res = await getJenisList();
    jenisOptionsApi.value = res.data || [];
  } catch (err) {
    console.error('Gagal ambil jenis list', err);
    jenisOptionsApi.value = [];
  }
};

const fetchArea = async () => {
  try {
    const res = await getAreaList();
    const raw = res?.data?.data || res?.data || [];
    lokasiOptionsApi.value = raw;
  } catch (err) {
    console.error('Gagal ambil area list', err);
    lokasiOptionsApi.value = [];
  }
};

const filteredTableData = computed(() => {
  return table1Raw.value
    .filter((row) => {
      if (selectedJenis.value && row.jenis_text !== selectedJenis.value) return false;
      if (
        jenisSearch.value &&
        !row.jenis_text?.toLowerCase().includes(jenisSearch.value.toLowerCase())
      )
        return false;
      if (
        table1Search.value &&
        !row.jenis_text?.toLowerCase().includes(table1Search.value.toLowerCase())
      )
        return false;
      if (selectedLokasi.value && row.lokasi !== selectedLokasi.value) return false;
      return true;
    })
    .map((row) => ({
      id: row.jenis,
      naskah: row.jenis_text,
      ...row,
      jumlah: row.total ?? 0
    }));
});

watch(
  () => ({ ...filters.value }),
  () => {
    currentPage.value = 1;
    fetchTable2();
  },
  { deep: true }
);

const jenisOptions = computed(() => {
  const all = jenisOptionsApi.value.map((item: any) => item.jenis_text);
  if (!jenisSearch.value) return all;
  return all.filter((j: string) => j.toLowerCase().includes(jenisSearch.value.toLowerCase()));
});

const selectedMonthLabel = computed(
  () => monthOptions.value.find((m) => m.value === selectedMonth.value)?.label ?? ''
);

watch(selectedYear, () => {
  fetchTable1();
});

watch(selectedLokasi, () => {
  fetchTable1();
});

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
});

const lokasiOptions = computed(() =>
  lokasiOptionsApi.value.map((item: any) => item.nama || item.longText)
);

const filteredTable1LokasiOptions = computed(() => {
  if (!lokasiSearch.value) return lokasiOptions.value;
  return lokasiOptions.value.filter((item: string) =>
    item.toLowerCase().includes(lokasiSearch.value.toLowerCase())
  );
});

const table2JenisOptions = computed(() => {
  return [
    { label: t('semua_jenis'), value: '' },
    ...jenisOptionsApi.value.map((item: any) => ({
      label: item.jenis_text,
      value: item.jenis
    }))
  ];
});

const table2JenisLabel = computed(() => {
  if (!filters.value.jenis) return t('semua_jenis');
  const found = jenisOptionsApi.value.find((item: any) => item.jenis === filters.value.jenis);
  return found?.jenis_text || filters.value.jenis;
});

const filteredTable2JenisOptions = computed(() => {
  if (!t2JenisKeyword.value) return table2JenisOptions.value;
  return table2JenisOptions.value.filter((item: any) =>
    item.label.toLowerCase().includes(t2JenisKeyword.value.toLowerCase())
  );
});

const filteredTable2LokasiOptions = computed(() => {
  if (!t2LokasiKeyword.value) return lokasiOptions.value;
  return lokasiOptions.value.filter((item: string) =>
    item.toLowerCase().includes(t2LokasiKeyword.value.toLowerCase())
  );
});

const t2StatusLabel = computed(() => {
  const map: Record<string, string> = {
    '': t('semua_status'),
    terpakai_final: t('nom_status_final'),
    Terpakai: t('nom_status_terpakai'),
    booking: t('nom_status_booking'),
    Hangus: 'Batal',
    draft: 'Draft',
    ditolak: 'Ditolak'
  };
  return map[filters.value.status] ?? t('semua_status');
});

const tahunOptions = computed(() =>
  [...new Set(table2Data.value.map((d) => d.tanggal?.split('/')?.[2]).filter(Boolean))].sort(
    (a, b) => Number(b) - Number(a)
  )
);

const filteredData = computed(() => {
  return table2Data.value.filter((item) => {
    const tahunItem = item.tanggal.split('/')[2];
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
    const aVal = (a as any)[sortConfig.value.key!];
    const bVal = (b as any)[sortConfig.value.key!];
    if (aVal < bVal) return sortConfig.value.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.value.direction === 'asc' ? 1 : -1;
    return 0;
  });
});

// PAGINATION TABLE 1
const currentPageTable1 = ref(1);
const itemsPerPageTable1 = ref(5);

const totalItemsTable1 = computed(() => filteredTableData.value.length);
const totalPagesTable1 = computed(() =>
  Math.ceil(totalItemsTable1.value / itemsPerPageTable1.value)
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
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

watch([selectedJenis, jenisSearch, selectedMonth, selectedYear], () => {
  currentPageTable1.value = 1;
});

// PAGINATION TABLE 2
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));
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
  { deep: true }
);
watch(totalPages, (val) => {
  if (currentPage.value > val) currentPage.value = val || 1;
});
watch(currentPage, () => {
  fetchTable2();
});
watch(itemsPerPage, () => {
  currentPage.value = 1;
  fetchTable2();
});

const handleSort = (key: string) => {
  sortConfig.value = {
    key,
    direction: sortConfig.value.key === key && sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
  };
};

const getStatusClass = (status: string) => {
  if (status === 'Terpakai') return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300';
  if (status === 'Final')
    return 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200';
  if (status === 'Booking')
    return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
  if (status === 'Draft')
    return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300';
  if (status === 'Ditolak') return 'bg-black dark:bg-white text-white dark:text-black';
  if (status === 'Hangus') return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
  return 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
};

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    Hangus: 'Batal',
    draft: 'Draft',
    ditolak: 'Ditolak',
    Terpakai: t('nom_status_terpakai'),
    Final: t('nom_status_final'),
    Booking: t('nom_status_booking'),
    terpakai_final: t('nom_status_final')
  };
  return statusMap[status] || status;
};

const refreshData = () => {
  selectedMonth.value = '';
  jenisSearch.value = '';
  selectedJenis.value = '';
  selectedYear.value = new Date().getFullYear();
  fetchTable1();
  fetchTable2();
};

// TABLE 2 SEARCH DEBOUNCE
let searchTable2Timeout: ReturnType<typeof setTimeout> | null = null;
const handleTable2SearchInput = () => {
  if (searchTable2Timeout) clearTimeout(searchTable2Timeout);
  searchTable2Timeout = setTimeout(() => {
    currentPage.value = 1;
    fetchTable2();
  }, 400);
};

// ─── Export Modal State Table 1 ──────────────────────────────────────────────
const showExportModalTable1 = ref(false);
const isExportingTable1 = ref(false);
const exportColumnsTable1 = computed(() => {
  const cols = [
    { key: 'naskah', label: t('naskah_tbl') || 'Jenis Naskah', desc: 'Nama / jenis naskah surat' }
  ];
  if (!selectedMonth.value) {
    monthOptions.value.forEach((m) => {
      cols.push({ key: m.value, label: m.label, desc: `Jumlah naskah bulan ${m.label}` });
    });
  } else {
    cols.push({
      key: selectedMonth.value,
      label: selectedMonthLabel.value,
      desc: `Jumlah naskah bulan ${selectedMonthLabel.value}`
    });
  }
  cols.push({ key: 'jumlah', label: t('jumlah') || 'Total', desc: 'Total keseluruhan naskah' });
  return cols;
});

const openExportModalTable1 = () => {
  if (!hasPermission('laporan', 'export-naskah-masuk')) {
    toast.add({
      title: t('akses_ditolak') || 'Akses Ditolak',
      description: t('akses_export_ditolak') || 'Anda tidak memiliki izin untuk export laporan.',
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return;
  }
  showExportModalTable1.value = true;
};

const handleExportTable1Confirm = (selectedKeys: string[]) => {
  if (isExportingTable1.value || selectedKeys.length === 0) return;
  isExportingTable1.value = true;
  try {
    if (!filteredTableData.value.length) {
      toast.add({
        title: t('export_gagal'),
        description: t('export_tidak_ada'),
        color: 'warning'
      });
      return;
    }

    const rows = filteredTableData.value.map((row) => {
      const r: Record<string, any> = {};
      if (selectedKeys.includes('naskah')) r[t('naskah_tbl') || 'Jenis Naskah'] = row.naskah;
      if (!selectedMonth.value) {
        monthOptions.value.forEach((m) => {
          if (selectedKeys.includes(m.value)) {
            r[m.label] = Number(row[m.value] ?? 0);
          }
        });
      } else {
        if (selectedKeys.includes(selectedMonth.value)) {
          r[selectedMonthLabel.value] = Number(row[selectedMonth.value] ?? 0);
        }
      }
      if (selectedKeys.includes('jumlah')) r[t('jumlah') || 'Total'] = Number(row.jumlah ?? 0);
      return r;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Naskah Masuk');
    XLSX.writeFile(workbook, `naskah-masuk-summary-${selectedYear.value}.xlsx`);
    toast.add({
      title: t('export_berhasil'),
      description: t('export_file_berhasil'),
      color: 'success'
    });
  } catch (err) {
    console.error(err);
    toast.add({
      title: t('export_gagal'),
      description: t('export_error'),
      color: 'error'
    });
  } finally {
    isExportingTable1.value = false;
  }
};

// ─── Export Modal State Table 2 ──────────────────────────────────────────────
const showExportModalTable2 = ref(false);
const isExportingTable2 = ref(false);
const exportColumnsTable2 = ref([
  { key: 'jenis', label: 'Jenis Naskah', desc: 'Nama jenis naskah surat' },
  { key: 'nomor', label: 'Nomor Dokumen', desc: 'Nomor register dokumen naskah' },
  { key: 'tanggal', label: 'Tanggal', desc: 'Tanggal pembuatan naskah' },
  { key: 'perihal', label: 'Perihal', desc: 'Perihal surat naskah' },
  { key: 'jabatan', label: 'Jabatan', desc: 'Jabatan pembuat / penandatangan' },
  { key: 'lokasi', label: 'Lokasi', desc: 'Lokasi unit / kantor' },
  { key: 'status', label: 'Status', desc: 'Status naskah masuk' }
]);

const openExportModalTable2 = () => {
  if (!hasPermission('laporan', 'export-naskah-masuk')) {
    toast.add({
      title: t('akses_ditolak') || 'Akses Ditolak',
      description: t('akses_export_ditolak') || 'Anda tidak memiliki izin untuk export laporan.',
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return;
  }
  showExportModalTable2.value = true;
};

const handleExportTable2Confirm = async (selectedKeys: string[]) => {
  if (isExportingTable2.value || selectedKeys.length === 0) return;
  isExportingTable2.value = true;
  try {
    let exportData = sortedData.value;

    // Jika total items di server lebih besar dari limit tampilan, fetch semua data untuk diexport
    if (totalItems.value > itemsPerPage.value) {
      const params: any = {
        page: 1,
        limit: totalItems.value
      };
      if (filters.value.tahun) params.tahun = Number(filters.value.tahun);
      if (filters.value.jenis) params.jenis = filters.value.jenis;
      if (filters.value.status) params.status = filters.value.status.toLowerCase();
      if (filters.value.lokasi) {
        const lokasiObj = lokasiOptionsApi.value.find(
          (item: any) => (item.nama || item.longText) === filters.value.lokasi
        );
        if (lokasiObj) params.area = lokasiObj.kode || lokasiObj.value;
      }
      if (filters.value.search) params.search = filters.value.search;

      const res = await getRekapNaskahMasukDetail(params);
      if (res?.data && Array.isArray(res.data)) {
        exportData = res.data.map((item: any) => ({
          id: item.id,
          jenis: item.naskah,
          jenis_text: item.naskah_text,
          nomor: item.nomor,
          tanggal: formatTanggal(item.tanggal),
          perihal: item.perihal ?? '-',
          jabatan: item.jabatan,
          lokasi: item.lokasi,
          status: item.status === 'terpakai_final' ? 'Final' : capitalize(item.status)
        }));
      }
    }

    if (!exportData.length) {
      toast.add({
        title: t('export_gagal'),
        description: t('export_tidak_ada'),
        color: 'warning'
      });
      return;
    }

    const rows = exportData.map((item) => {
      const r: Record<string, any> = {};
      if (selectedKeys.includes('jenis')) r[t('naskah_tbl') || 'Jenis Naskah'] = item.jenis || '-';
      if (selectedKeys.includes('nomor')) r[t('nodokumen') || 'Nomor Dokumen'] = item.nomor || '-';
      if (selectedKeys.includes('tanggal')) r[t('tanggal') || 'Tanggal'] = item.tanggal || '-';
      if (selectedKeys.includes('perihal')) r[t('perihal') || 'Perihal'] = item.perihal || '-';
      if (selectedKeys.includes('jabatan')) r[t('jabatan') || 'Jabatan'] = item.jabatan || '-';
      if (selectedKeys.includes('lokasi')) r[t('lokasi') || 'Lokasi'] = item.lokasi || '-';
      if (selectedKeys.includes('status')) r[t('sign_status') || 'Status'] = item.status || '-';
      return r;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detail Naskah');
    XLSX.writeFile(workbook, `naskah-masuk-detail-${new Date().getTime()}.xlsx`);
    toast.add({
      title: t('export_berhasil'),
      description: t('export_file_berhasil'),
      color: 'success'
    });
  } catch (err) {
    console.error(err);
    toast.add({
      title: t('export_gagal'),
      description: t('export_error'),
      color: 'error'
    });
  } finally {
    isExportingTable2.value = false;
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
