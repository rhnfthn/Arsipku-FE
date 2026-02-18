<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Daftar Verifikasi Penomoran
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <!-- CARD -->
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl w-full">
      <!-- TOP BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 mb-4 pr-3"
      >
        <!-- Rows dropdown -->
        <div class="flex items-center gap-2 px-4">
          <select
            v-model="rowsPerPage"
            @change="handleLimitChange"
            class="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </div>

        <!-- Filter button + dropdown -->
        <div class="relative inline-block">
          <button
            data-custom-dropdown
            class="flex items-center justify-between gap-2 bg-gray-100 dark:bg-gray-700 text-xs px-3 py-1 rounded-lg min-w-[100px]"
            @click.stop="openFilterStatus = !openFilterStatus"
          >
            <span class="text-sm dark:text-gray-200">
              {{ filterStatus || "Semua" }}
            </span>
            <svg
              :class="[
                'w-4 h-4 transition-transform duration-200 dark:text-gray-300',
                openFilterStatus ? 'rotate-180' : 'rotate-0',
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

          <!-- Dropdown -->
          <div
            v-if="openFilterStatus"
            data-custom-dropdown
            class="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in"
          >
            <button
              v-for="item in filterOptions"
              :key="item"
              class="w-full text-left px-4 py-2 text-sm dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              @click.prevent="selectFilterStatus(item)"
            >
              {{ item }}
            </button>
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
            placeholder="Cari..."
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs dark:text-gray-200 pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      </div>

      <!-- LOADING (SHIMMER) -->
      <div v-if="loading" class="space-y-3 p-4">
        <div
          v-for="i in 5"
          :key="i"
          class="w-full h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"
        ></div>
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="rows.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400"
      >
        <p class="text-sm font-medium">Data tidak ditemukan</p>
      </div>

      <!-- TABLE -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-max bg-white dark:bg-gray-800 text-sm w-full">
          <thead class="bg-primary text-white text-[15px]">
            <tr>
              <th
                v-for="col in headers"
                :key="col.key"
                @click="col.sortable && handleSort(col.key)"
                :class="[
                  'px-5 py-3 text-left font-semibold tracking-wide whitespace-nowrap',
                  col.sortable
                    ? 'cursor-pointer select-none hover:bg-primary-600 dark:hover:bg-primary-800 transition'
                    : 'cursor-default',
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
                class="sticky right-0 z-30 bg-primary text-white px-5 py-3 border-l border-gray-200 shadow-[inset_1px_0_1px_-1px_rgba(0,0,0,9)] cursor-pointer select-none hover:bg-primary-600 dark:hover:bg-primary-800 transition"
              >
                <div class="flex items-center gap-2">
                  <span>Status</span>
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
            <tr
              v-for="row in rows"
              :key="row.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition"
              @mousemove="onRowMouseMove($event, 'Klik untuk lihat detail')"
              @mouseleave="onRowMouseLeave"
              @click="showPreview(row)"
            >
              <td class="px-5 py-4 dark:text-gray-300">{{ row.jenis }}</td>
              <td class="px-5 py-4 dark:text-gray-300">{{ row.tanggal }}</td>
              <td class="px-5 py-4">
                <div class="relative group max-w-[350px]">
                  <p
                    class="whitespace-normal break-words line-clamp-3 dark:text-gray-300"
                  >
                    {{ row.perihal || "-" }}
                  </p>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="relative group max-w-[300px]">
                  <p
                    class="whitespace-normal break-words line-clamp-3 dark:text-gray-300"
                  >
                    {{ row.penandatangan }}
                  </p>
                </div>
              </td>
              <td class="px-5 py-4 dark:text-gray-300">{{ row.jumlah }}</td>
              <td class="px-5 py-4 dark:text-gray-300">{{ row.pengusul }}</td>
              <td class="px-5 py-4 dark:text-gray-300">{{ row.tglUsulan }}</td>

              <td
                class="sticky right-0 z-20 bg-white dark:bg-gray-800 px-5 py-3 border-l border-gray-200 dark:border-gray-700 shadow-[inset_1px_0_1px_-1px_rgba(0,0,0,9)]"
              >
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                    {
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':
                        row.status === 'Menunggu Verifikasi',
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400':
                        row.status === 'Disetujui',
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400':
                        row.status === 'Ditolak',
                    },
                  ]"
                >
                  {{ row.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="rows.length > 0 && pagination"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Menampilkan {{ rows.length }} dari {{ pagination.total }} data
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
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
            Sebelumnya
          </button>

          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="handlePageChange(1)"
              class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all"
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
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400',
              ]"
            >
              {{ page }}
            </button>
            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >
            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="handlePageChange(totalPages)"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all"
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
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
            ]"
          >
            Selanjutnya
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

  <!-- MODAL VERIFIKASI -->
  <Teleport to="body">
    <Modal v-model="openPreview" :hideDefaultFooter="true" size="xl">
      <!-- HEADER -->
      <template #title>
        <div class="flex items-center justify-between w-full px-6 pt-4 pb-4">
          <h2
            class="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight pt-2"
          >
            {{ selectedRow?.perihal || "-" }}
          </h2>
          <!-- <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDateTime(new Date()) }}
          </span> -->
        </div>
      </template>

      <!-- BODY -->
      <div
        v-if="selectedRow"
        class="px-5 pb-3 space-y-5 overflow-y-auto max-h-[70vh]"
      >
        <!-- Detail Info -->
        <div class="space-y-4 text-base">
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">Tanggal</p>
            <p class="mt-1 dark:text-gray-200 text-sm font-medium">
              {{ selectedRow.tanggal }}
            </p>
          </div>
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">
              Penandatangan
            </p>
            <p class="text-sm font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.penandatangan }}
            </p>
          </div>
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</p>
            <p class="text-sm font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.klasifikasi }}
            </p>
          </div>
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">Jenis Naskah</p>
            <p class="text-sm font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.jenis }}
            </p>
          </div>
        </div>

        <!-- File Lampiran Utama -->
        <div v-if="selectedRow.file_path" class="pt-2">
          <label
            class="block text-base font-medium text-gray-900 dark:text-gray-100 mb-2"
          >
            File Lampiran Pengusul
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
                Dokumen lampiran
              </p>
            </div>
          </div>
        </div>

        <!-- Nomor Surat Section -->
        <div class="mt-4">
          <label
            class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 break-words"
          >
            Nomor Surat ({{ selectedRow?.jumlah ?? 0 }} nomor)
          </label>

          <!-- Warning jika ada nomor tanpa ID -->
          <div
            v-if="selectedRow.details.some((d) => !d.id || d.id === null)"
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
              <p
                class="text-sm font-medium text-yellow-800 dark:text-yellow-400"
              >
                Peringatan
              </p>
              <p class="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                Beberapa nomor belum memiliki ID (status pending). Nomor
                tersebut tidak dapat diproses sampai memiliki ID yang valid.
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="(detail, idx) in selectedRow.details"
              :key="detail.id || idx"
              class="space-y-2"
            >
              <!-- ✅ Card: abu-abu + opacity jika hangus -->
              <div
                :class="[
                  'border rounded-lg p-4 mt-2 transition',
                  detail.status === 'hangus'
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 opacity-60'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50',
                ]"
              >
                <!-- Row: Checkbox + Nomor + Status + Copy -->
                <div class="flex items-center gap-2 mb-3">
                  <!-- ✅ Checkbox: disabled jika hangus -->
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

                  <!-- Nomor Container -->
                  <div class="relative flex flex-1 items-center gap-2">
                    <span
                      class="text-sm text-gray-600 dark:text-gray-400 font-medium"
                      >{{ idx + 1 }}</span
                    >

                    <input
                      type="text"
                      :value="displayNomor(detail)"
                      :class="[
                        'flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-mono',
                        detail.status === 'hangus'
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : 'dark:text-gray-200',
                      ]"
                      readonly
                    />

                    <!-- ✅ Copy button: sembunyikan jika hangus -->
                    <button
                      v-if="
                        detail.nomor &&
                        detail.status === 'terpakai' &&
                        detail.status !== 'hangus'
                      "
                      @click="handleCopy(detail.nomor)"
                      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition flex items-center justify-center flex-shrink-0"
                    >
                      <Copy class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div v-else class="w-[44px]"></div>

                    <!-- Status Badge -->
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
                            detail.status === 'hangus',
                        },
                      ]"
                    >
                      {{ getStatusLabel(detail.status) }}
                    </span>
                  </div>
                </div>

                <!-- ✅ FILE SECTION -->
                <div class="relative">
                  <!-- ✅ HANGUS: tampilkan file jika ada (read-only, greyed), atau indikator hangus -->
                  <template v-if="detail.status === 'hangus'">
                    <!-- Ada file → tampil tapi greyed out + strikethrough, tidak bisa diklik -->
                    <div
                      v-if="hasExistingFile(detail)"
                      class="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 rounded-lg p-3"
                    >
                      <div class="flex items-start gap-3">
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
                        <div class="flex-1 min-w-0">
                          <p
                            class="text-sm font-medium text-gray-400 dark:text-gray-500 line-through"
                          >
                            {{ getDisplayFileName(detail) }}
                          </p>
                          <p
                            class="text-xs text-gray-400 dark:text-gray-500 mt-0.5"
                          >
                            Nomor telah dihanguskan
                          </p>
                        </div>
                      </div>
                    </div>
                    <!-- Tidak ada file → indikator hangus -->
                    <div
                      v-else
                      class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3"
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
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        <span class="text-xs text-gray-400 dark:text-gray-500">
                          Nomor telah dihanguskan
                        </span>
                      </div>
                    </div>
                  </template>

                  <!-- ✅ Ada file (bukan hangus) & tidak sedang replace → tampilkan file clickable -->
                  <div
                    v-else-if="
                      hasExistingFile(detail) && !fileStates[idx]?.isReplacing
                    "
                  >
                    <div
                      class="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <div
                          class="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition"
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
                          <div class="flex-1">
                            <p
                              class="text-sm font-medium text-primary dark:text-blue-400 underline"
                            >
                              {{ getDisplayFileName(detail) }}
                            </p>
                            <p
                              class="text-xs text-gray-600 dark:text-gray-400 mt-0.5"
                            >
                              Klik untuk preview
                            </p>
                          </div>
                        </div>
                        <button
                          @click.prevent="startReplacingFile(idx)"
                          class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
                        >
                          <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
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
                  </div>

                  <!-- ✅ File baru dipilih (local, belum upload) & tidak replacing -->
                  <div
                    v-else-if="
                      (fileStates[idx]?.file || files[idx]) &&
                      !fileStates[idx]?.isReplacing
                    "
                  >
                    <div
                      class="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 flex-1">
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
                          <div class="flex-1">
                            <p
                              class="text-sm font-medium text-primary dark:text-blue-400"
                            >
                              {{
                                fileStates[idx]?.file?.name || files[idx]?.name
                              }}
                            </p>
                            <p
                              class="text-xs text-gray-600 dark:text-gray-400 mt-0.5"
                            >
                              {{
                                formatFileSize(
                                  fileStates[idx]?.file?.size ||
                                    files[idx]?.size ||
                                    0,
                                )
                              }}
                            </p>
                          </div>
                        </div>
                        <button
                          @click.prevent="removeFile(idx)"
                          class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
                        >
                          <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
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
                  </div>

                  <!-- ✅ Upload form (tidak ada file / sedang replacing) -->
                  <div v-else>
                    <label
                      class="w-full flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm hover:bg-white dark:hover:bg-gray-800 hover:border-primary dark:hover:border-primary-600 transition-all group"
                    >
                      <svg
                        class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-primary-400 transition-colors flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <div class="flex-1">
                        <span
                          class="text-gray-700 dark:text-gray-300 font-medium block"
                          >Pilih file (Opsional)</span
                        >
                        <span
                          class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block"
                          >PDF, DOC, DOCX (Max 5MB)</span
                        >
                      </div>
                      <input
                        type="file"
                        class="hidden"
                        accept=".pdf,.doc,.docx"
                        @change="handleFile(idx, $event, detail)"
                        :disabled="fileStates[idx]?.isUploading"
                      />
                    </label>
                    <button
                      v-if="fileStates[idx]?.isReplacing"
                      @click.prevent="cancelReplace(idx, detail)"
                      class="mt-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                    >
                      Batal mengganti file
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ Keterangan Penolakan: muncul jika ada yang tidak di-check -->
        <div v-if="hasUnchecked" class="pt-2">
          <label
            class="block text-base font-medium text-gray-900 dark:text-gray-100 mb-2"
          >
            Keterangan Penolakan <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="keterangan_ditolak"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm min-h-[120px] bg-gray-50 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
            placeholder="Masukkan keterangan mengapa nomor ditolak..."
          ></textarea>
          <p
            v-if="!keterangan_ditolak.trim() && showKeteranganWarning"
            class="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1"
          >
            <svg
              class="w-3 h-3"
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
            Keterangan penolakan wajib diisi sebelum menyetujui atau menolak
          </p>
        </div>
      </div>

      <!-- FOOTER -->
      <template #footer>
        <div
          class="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <!-- Tombol Disetujui -->
          <button
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
            {{ isProcessing ? "Memproses..." : "Nomor Disetujui" }}
          </button>

          <!-- Tombol Ditolak -->
          <button
            @click="confirmRejection"
            :disabled="isProcessing || !hasUnchecked"
            class="flex-1 px-5 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Nomor Ditolak
          </button>
        </div>
      </template>
    </Modal>
  </Teleport>

  <!-- ✅ PREVIEW SLIDEOVER - pakai file_url langsung (pre-signed S3) -->
  <USlideover
    v-model:open="isOpenPreview"
    title="Pratinjau"
    side="bottom"
    :dismissible="true"
    :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }"
  >
    <template #body>
      <div
        class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900"
      >
        <iframe
          v-if="pdfUrl"
          :key="pdfUrl"
          :src="pdfUrl"
          allowfullscreen
          class="w-full h-full rounded-lg shadow-lg border border-gray-200"
        />
        <div v-else class="flex flex-col items-center gap-2">
          <UIcon
            name="i-lucide-loader-2"
            class="animate-spin w-8 h-8 text-primary-500"
          />
          <span class="text-gray-500">Memuat Pratinjau...</span>
        </div>
      </div>
    </template>
  </USlideover>

  <!-- CONFIRM MODAL APPROVE -->
  <ConfirmPopup
    v-model="showConfirmApprove"
    title="Konfirmasi Verifikasi"
    :description="`Setujui ${checkedCount} nomor${uncheckedCount > 0 ? ` dan tolak ${uncheckedCount} nomor` : ''}?`"
    confirmText="Ya, Proses"
    cancelText="Batal"
    @confirm="processApproval"
  />

  <!-- CONFIRM MODAL REJECT -->
  <ConfirmPopup
    v-model="showConfirmReject"
    title="Konfirmasi Penolakan"
    :description="`Apakah Anda yakin ingin menolak ${uncheckedCount} nomor yang tidak dipilih?`"
    confirmText="Ya, Tolak"
    cancelText="Batal"
    @confirm="processRejection"
  />

  <!-- TOOLTIP -->
  <Teleport to="body">
    <div
      v-if="tooltip.show"
      class="fixed z-[9999] pointer-events-none bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-md shadow-lg transition-opacity"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      {{ tooltip.text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Search, Copy, ArrowUpDown } from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { Modal } from "#components";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
import { useToast } from "#imports";
import { usePenomoran } from "~/composables/usePenomoran";
import type { NomorDetail } from "~/types/penomoran";

const toast = useToast();
const config = useRuntimeConfig();
const apiBaseUrl = config.public.apiBaseUrl;

const {
  approveBulkNomor,
  rejectNomorRequest,
  getListSubmitted,
  getDetailVerifikasiRequest,
  uploadDetailFile,
} = usePenomoran();

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Verifikasi", to: "/penomoran/verifikasi" },
];

const headers = [
  { label: "Jenis", key: "jenis", sortable: true },
  { label: "Tanggal", key: "tanggal", sortable: true },
  { label: "Perihal", key: "perihal", sortable: false },
  { label: "Penandatangan", key: "penandatangan", sortable: false },
  { label: "Jumlah", key: "jumlah", sortable: false },
  { label: "Pengusul", key: "pengusul", sortable: false },
  { label: "Tgl Usulan", key: "tanggal_usulan", sortable: true },
];

const filterOptions = ["Semua", "Menunggu Verifikasi", "Disetujui", "Ditolak"];

// State
const isOpenPreview = ref(false);
const pdfUrl = ref<string | null>(null);
const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const currentPage = ref<number>(1);
const search = ref<string>("");
const selectedRow = ref<any>(null);
const keterangan_ditolak = ref("");
const showKeteranganWarning = ref(false);
const isProcessing = ref(false);
const showConfirmApprove = ref(false);
const showConfirmReject = ref(false);

const sortBy = ref<string>("");
const sortOrder = ref<"asc" | "desc">("desc");
const filterStatus = ref<string>("Menunggu Verifikasi");
const openFilterStatus = ref<boolean>(false);
const openPreview = ref(false);

const rows = ref<any[]>([]);
const pagination = ref(null);
const loading = ref(false);
const files = ref<any[]>([]);

interface FileState {
  isReplacing: boolean;
  isUploading: boolean;
  file: File | null;
  originalFileName: string | null;
}
const fileStates = ref<Record<number, FileState>>({});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

/* ===========================
 * FETCH DATA
 * =========================== */
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      search: search.value || undefined,
      page: currentPage.value,
      limit: rowsPerPage.value,
      status: filterStatus.value !== "Semua" ? filterStatus.value : undefined,
      sort_by: sortBy.value || undefined,
      sort_order: sortOrder.value || undefined,
    };

    const res = await getListSubmitted(params);
    const data = res.data || [];
    pagination.value = res.pagination || null;

    if (!Array.isArray(data)) {
      rows.value = [];
      return;
    }

    rows.value = data.map((item: any) => {
      const tanggalDate = new Date(item.tanggal);
      const formattedTanggal = `${String(tanggalDate.getUTCDate()).padStart(2, "0")}/${String(tanggalDate.getUTCMonth() + 1).padStart(2, "0")}/${tanggalDate.getUTCFullYear()}`;

      const createdDate = new Date(item.created_at);
      const wibTime = new Date(createdDate.getTime() + 7 * 60 * 60 * 1000);
      const day = String(wibTime.getDate()).padStart(2, "0");
      const month = String(wibTime.getMonth() + 1).padStart(2, "0");
      const year = String(wibTime.getFullYear()).slice(-2);
      const hours = String(wibTime.getHours()).padStart(2, "0");
      const minutes = String(wibTime.getMinutes()).padStart(2, "0");

      return {
        id: item.id,
        jenis: item.jenis,
        tanggal: formattedTanggal,
        perihal: item.perihal || "-",
        penandatangan: item.penandatangan || "-",
        jumlah: item.jumlah,
        pengusul: item.nama || "-",
        tglUsulan: `${day}/${month}/${year} ${hours}:${minutes}`,
        status: item.status,
        klasifikasi: item.klasifikasi,
        file_path: item.file_path,
      };
    });
  } catch (error) {
    console.error("❌ Error fetch data verifikasi:", error);
    toast.add({
      title: "Gagal memuat data",
      description: "Tidak dapat mengambil data verifikasi",
      color: "red",
    });
    rows.value = [];
    pagination.value = null;
  } finally {
    loading.value = false;
  }
};

const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchData();
  }, 500);
};

const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = column;
    sortOrder.value = "desc";
  }
  currentPage.value = 1;
  fetchData();
};

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchData();
};

const handleLimitChange = () => {
  currentPage.value = 1;
  fetchData();
};

const selectFilterStatus = (val: string) => {
  filterStatus.value = val;
  openFilterStatus.value = false;
  currentPage.value = 1;
  fetchData();
};

const totalPages = computed(() => pagination.value?.totalPages || 1);

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 2) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 1) {
      pages.push(total - 2, total - 1, total);
    } else {
      pages.push(current - 1, current, current + 1);
    }
  }
  return pages;
});

/* ===========================
 * SHOW PREVIEW MODAL
 * =========================== */
const showPreview = async (row: any) => {
  try {
    const detailData = await getDetailVerifikasiRequest(row.id);
    if (!detailData) return;

    selectedRow.value = { ...row, ...detailData };
    files.value = Array(detailData.jumlah || 0).fill(null);
    fileStates.value = {};
    keterangan_ditolak.value = "";
    showKeteranganWarning.value = false;
    openPreview.value = true;
  } catch (error) {
    console.error("❌ Error fetch detail:", error);
  }
};

/* ===========================
 * PREVIEW FILE
 * ✅ Langsung pakai file_url (pre-signed S3), tidak perlu fetch/blob
 * =========================== */
const previewFile = (detail: any) => {
  const url =
    detail.file_url ||
    (detail.file_text ? `${apiBaseUrl}/${detail.file_text}` : null);

  if (!url) {
    toast.add({
      title: "File tidak ditemukan",
      description: "File tidak tersedia untuk ditampilkan",
      color: "yellow",
    });
    return;
  }

  // ✅ Langsung set URL, tidak perlu fetch/blob
  pdfUrl.value = url;
  isOpenPreview.value = true;
};

/* ===========================
 * FILE HANDLERS
 * =========================== */
const startReplacingFile = (idx: number) => {
  const detail = selectedRow.value.details[idx];
  fileStates.value[idx] = {
    isReplacing: true,
    isUploading: false,
    file: null,
    originalFileName: detail.file_name,
  };
};

const cancelReplace = (idx: number, detail: any) => {
  delete fileStates.value[idx];
};

const handleFile = (idx: number, event: Event, detail: any) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: "File terlalu besar",
      description: "Ukuran file maksimal 5MB",
      color: "red",
    });
    return;
  }

  if (fileStates.value[idx]?.isReplacing) {
    fileStates.value[idx].file = file;
  } else {
    files.value[idx] = file;
  }
};

const removeFile = (idx: number) => {
  files.value[idx] = null;
};

/* ===========================
 * HELPERS
 * =========================== */
const displayNomor = (detail: any) => {
  if (detail.status === "terpakai" && detail.nomor) return detail.nomor;
  if (detail.template_nomor) return detail.template_nomor;
  if (selectedRow.value?.template_nomor)
    return selectedRow.value.template_nomor;
  return "-";
};

/* ✅ Status label: terpakai_final → "Final" */
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "Pending",
    menunggu: "Menunggu",
    booking: "Booking",
    terpakai: "Terpakai",
    terpakai_final: "Final",
    ditolak: "Ditolak",
    hangus: "Hangus",
  };
  return statusMap[status] || status;
};

const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
    icon: "i-lucide-copy",
  });
};

const getFileName = (path: string) => {
  if (!path) return "-";
  return path.split("/").pop() || path;
};

const hasExistingFile = (detail: any) => {
  return !!(detail.file_name || detail.file_text || detail.file_url);
};

const getDisplayFileName = (detail: any) => {
  if (detail.file_name) return detail.file_name;
  if (detail.file_text) return getFileName(detail.file_text);
  if (detail.file_url) return getFileName(detail.file_url);
  return "File Terlampir";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/* ===========================
 * COMPUTED - VALIDASI
 * =========================== */
const validDetails = computed(() => {
  return (selectedRow.value?.details || []).filter(
    (d: any) =>
      d.id &&
      d.id !== null &&
      d.id !== "null" &&
      d.id !== undefined &&
      d.status !== "hangus",
  );
});

const hasAnyChecked = computed(() =>
  validDetails.value.some((d: any) => d.checked),
);
const hasUnchecked = computed(() =>
  validDetails.value.some((d: any) => !d.checked),
);

const checkedCount = computed(
  () => validDetails.value.filter((d: any) => d.checked).length,
);
const uncheckedCount = computed(
  () => validDetails.value.filter((d: any) => !d.checked).length,
);

/* ===========================
 * CONFIRM APPROVAL
 * ✅ Blok jika ada unchecked tapi keterangan belum diisi
 * =========================== */
const confirmApproval = () => {
  if (!hasAnyChecked.value) {
    toast.add({
      title: "Peringatan",
      description: "Pilih minimal 1 nomor untuk disetujui!",
      color: "yellow",
    });
    return;
  }

  // ✅ Jika ada yang unchecked (akan ditolak), keterangan WAJIB diisi dulu
  if (hasUnchecked.value && !keterangan_ditolak.value.trim()) {
    showKeteranganWarning.value = true;
    toast.add({
      title: "Keterangan Penolakan Wajib Diisi",
      description: `Ada ${uncheckedCount.value} nomor yang tidak dicentang. Isi keterangan penolakan terlebih dahulu.`,
      color: "red",
    });
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.focus();
      textarea.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  showKeteranganWarning.value = false;
  showConfirmApprove.value = true;
};

/* ===========================
 * PROCESS APPROVAL
 * ✅ Toast menampilkan jumlah approved + rejected
 * =========================== */
const processApproval = async () => {
  showConfirmApprove.value = false;
  if (!selectedRow.value) return;

  const approvedDetails = validDetails.value.filter((d: any) => d.checked);
  const rejectedDetails = validDetails.value.filter((d: any) => !d.checked);

  if (approvedDetails.length === 0) {
    toast.add({
      title: "Peringatan",
      description: "Tidak ada nomor yang dapat disetujui.",
      color: "yellow",
    });
    return;
  }

  isProcessing.value = true;

  try {
    // Approve yang dicentang
    const detailIds = approvedDetails.map((d: any) => d.id);
    await approveBulkNomor(detailIds);

    // ✅ Jika ada yang unchecked, tolak juga sekaligus
    if (rejectedDetails.length > 0 && keterangan_ditolak.value.trim()) {
      const rejectedIds = rejectedDetails.map((d: any) => d.id);
      await rejectNomorRequest(
        selectedRow.value.id,
        rejectedIds,
        keterangan_ditolak.value,
      );
    }

    // ✅ Toast yang benar: tampilkan approved + rejected
    const approvedCount = approvedDetails.length;
    const rejectedCount = rejectedDetails.length;

    if (rejectedCount > 0) {
      toast.add({
        title: "Berhasil",
        description: `${approvedCount} nomor disetujui, ${rejectedCount} nomor ditolak`,
        color: "green",
      });
    } else {
      toast.add({
        title: "Berhasil",
        description: `${approvedCount} nomor berhasil disetujui`,
        color: "green",
      });
    }

    openPreview.value = false;
    await fetchData();
  } catch (error: any) {
    console.error("❌ Error approval:", error);
    toast.add({
      title: "Gagal",
      description:
        error?.response?.data?.message || "Terjadi kesalahan saat memproses",
      color: "red",
    });
  } finally {
    isProcessing.value = false;
  }
};

/* ===========================
 * CONFIRM REJECTION
 * =========================== */
const confirmRejection = () => {
  if (!hasUnchecked.value) {
    toast.add({
      title: "Peringatan",
      description: "Tidak ada nomor yang akan ditolak!",
      color: "yellow",
    });
    return;
  }

  if (!keterangan_ditolak.value.trim()) {
    showKeteranganWarning.value = true;
    toast.add({
      title: "Keterangan Penolakan Wajib Diisi",
      description: "Silakan isi keterangan penolakan terlebih dahulu!",
      color: "red",
      timeout: 3000,
    });
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.focus();
      textarea.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  showKeteranganWarning.value = false;
  showConfirmReject.value = true;
};

/* ===========================
 * PROCESS REJECTION
 * =========================== */
const processRejection = async () => {
  showConfirmReject.value = false;
  if (!selectedRow.value) return;

  const rejectedDetails = validDetails.value.filter((d: any) => !d.checked);

  if (rejectedDetails.length === 0) {
    toast.add({
      title: "Peringatan",
      description: "Tidak ada nomor yang dapat ditolak.",
      color: "yellow",
    });
    return;
  }

  if (!keterangan_ditolak.value.trim()) {
    showKeteranganWarning.value = true;
    toast.add({
      title: "Keterangan Penolakan Wajib Diisi",
      description: "Silakan isi keterangan penolakan!",
      color: "red",
    });
    return;
  }

  isProcessing.value = true;

  try {
    const detailIds = rejectedDetails.map((d: any) => d.id);
    await rejectNomorRequest(
      selectedRow.value.id,
      detailIds,
      keterangan_ditolak.value,
    );

    toast.add({
      title: "Berhasil",
      description: `${rejectedDetails.length} nomor berhasil ditolak`,
      color: "green",
    });

    openPreview.value = false;
    await fetchData();
  } catch (error: any) {
    console.error("❌ Error rejection:", error);
    toast.add({
      title: "Gagal",
      description:
        error?.response?.data?.message || "Terjadi kesalahan saat menolak",
      color: "red",
    });
  } finally {
    isProcessing.value = false;
  }
};

function formatDateTime(dateStr: string | Date) {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return `${date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })} ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) return;
  }
  openFilterStatus.value = false;
}

onMounted(async () => {
  await fetchData();
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  if (searchTimeout) clearTimeout(searchTimeout);
  // ✅ Tidak perlu revokeObjectURL karena pdfUrl adalah pre-signed S3 URL
  pdfUrl.value = null;
});

const tooltip = ref({ show: false, text: "", x: 0, y: 0 });

const onRowMouseMove = (e: MouseEvent, text: string) => {
  tooltip.value = {
    show: true,
    text,
    x: Math.min(e.clientX + 12, window.innerWidth - 200),
    y: Math.min(e.clientY + 12, window.innerHeight - 40),
  };
};

const onRowMouseLeave = () => {
  tooltip.value.show = false;
};

watch(keterangan_ditolak, (newValue) => {
  if (newValue.trim()) showKeteranganWarning.value = false;
});

// ✅ Saat slideover dibuka, tutup modal detail
// Saat slideover ditutup, buka kembali modal detail
watch(isOpenPreview, (open) => {
  if (open) {
    openPreview.value = false;
  } else {
    // ✅ Tidak perlu revokeObjectURL karena bukan blob URL
    pdfUrl.value = null;
    if (selectedRow.value) {
      openPreview.value = true;
    }
  }
});
</script>

<style scoped>
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
