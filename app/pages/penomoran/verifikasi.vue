<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pb-10">
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
        class="flex flex-col md:flex-row justify-between items-center gap-4 pt-3 mb-4 pr-3"
      >
        <!-- Rows dropdown -->
        <div class="flex items-center gap-2 px-4 py-2">
          <select
            v-model="rowsPerPage"
            @change="handleLimitChange"
            class="border text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md px-2 py-1"
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
                    ? 'cursor-pointer select-none '
                    : 'cursor-default',
                ]"
              >
                <div class="flex items-center gap-2">
                  <span>{{ col.label }}</span>
                  <UIcon
                    v-if="col.sortable"
                    :name="getSortIcon(col.key)"
                    class="w-4 h-4"
                    :class="sortBy === col.key ? 'opacity-100' : 'opacity-50'"
                  />
                </div>
              </th>

              <th
                @click="handleSort('status')"
                class="sticky right-0 z-30 bg-primary text-white px-5 py-3 border-l border-gray-200 shadow-[inset_1px_0_1px_-1px_rgba(0,0,0,9)] cursor-pointer select-none"
              >
                <div class="flex items-center gap-2">
                  <span>Status</span>
                  <UIcon
                    :name="getSortIcon('status')"
                    class="w-4 h-4"
                    :class="sortBy === 'status' ? 'opacity-100' : 'opacity-50'"
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
                    {{ row.perihal }}
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
          <!-- Back Button -->
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
            Back
          </button>

          <!-- Page Numbers -->
          <div class="flex items-center gap-1">
            <!-- First page -->
            <button
              v-if="paginationPages[0] > 1"
              @click="handlePageChange(1)"
              class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all"
            >
              1
            </button>

            <!-- Left ellipsis -->
            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- Visible pages -->
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

            <!-- Right ellipsis -->
            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- Last page -->
            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="handlePageChange(totalPages)"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <!-- Next Button -->
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
            Next
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
            {{ selectedRow?.perihal }}
          </h2>
          <button
            @click="openPreview = false"
            class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          ></button>

          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDateTime(new Date()) }}
          </span>
        </div>
      </template>

      <!-- BODY -->
      <div
        v-if="selectedRow"
        class="px-5 pb-3 space-y-5 overflow-y-auto max-h-[70vh]"
      >
        <!-- Detail Info -->
        <div class="space-y-4 text-base">
          <!-- Tanggal -->
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">Tanggal</p>
            <p class="font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.tanggal }}
            </p>
          </div>

          <!-- Pengirim -->
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">
              Penandatangan
            </p>
            <p class="font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.penandatangan }}
            </p>
          </div>

          <!-- Klasifikasi -->
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</p>
            <p class="font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.klasifikasi }}
            </p>
          </div>

          <!-- Jenis Naskah -->
          <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 text-xs">Jenis Naskah</p>
            <p class="font-medium mt-1 dark:text-gray-200">
              {{ selectedRow.jenis }}
            </p>
          </div>
        </div>

        <!-- File Lampiran Utama (dari request) -->
        <div v-if="selectedRow.file_path" class="pt-2">
          <label
            class="block text-base font-medium text-gray-900 dark:text-gray-100 mb-2"
            >File Lampiran Pengusul</label
          >
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

        <!-- Nomor Surat Section dengan Upload File -->
        <div class="mt-4">
          <label
            class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 break-words"
          >
            Nomor Surat ({{ selectedRow?.jumlah ?? 0 }} nomor)</label
          >

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
              <div
                class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
              >
                <!-- Row: Checkbox + Nomor + Status + Copy -->
                <div class="flex items-center gap-2 mb-3">
                  <!-- Checkbox -->
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
                      class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-mono dark:text-gray-200"
                      readonly
                    />
                    <!-- Copy Button -->
                    <button
                      v-if="detail.nomor && detail.status === 'terpakai'"
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
                            detail.status === 'menunggu',
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400':
                            detail.status === 'booking',
                          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400':
                            detail.status === 'terpakai',
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400':
                            detail.status === 'ditolak',
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300':
                            detail.status === 'hangus',
                        },
                      ]"
                    >
                      {{ detail.status }}
                    </span>
                  </div>
                </div>

                <!-- File Upload/Replace Section -->
                <div class="relative">
                  <!-- Show existing file if available -->
                  <div v-if="detail.file_name && !fileStates[idx]?.isReplacing">
                    <div
                      class="border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg p-3 cursor-pointer"
                      @click="previewFile(detail)"
                    >
                      <div class="flex items-start gap-3">
                        <div class="flex-1">
                          <p
                            class="text-sm font-medium text-green-700 dark:text-green-400 underline"
                          >
                            📄 {{ detail.file_name }}
                          </p>
                          <p class="text-xs text-gray-600 dark:text-gray-400">
                            Klik untuk preview
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Upload/Replace form -->
                  <div v-else class="space-y-2">
                    <label
                      class="w-full flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md px-4 py-3 text-sm hover:bg-white dark:hover:bg-gray-800 hover:border-primary dark:hover:border-primary-600 transition-all group"
                    >
                      <svg
                        class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-primary-400 transition-colors"
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
                        >
                          {{
                            fileStates[idx]?.file?.name ||
                            files[idx]?.name ||
                            "Pilih file untuk diupload (Opsional)"
                          }}
                        </span>
                        <span
                          class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block"
                        >
                          PDF, DOC, DOCX (Max 5MB)
                        </span>
                      </div>

                      <input
                        type="file"
                        class="hidden"
                        accept=".pdf,.doc,.docx"
                        @change="handleFile(idx, $event, detail)"
                        :disabled="fileStates[idx]?.isUploading"
                      />
                    </label>

                    <!-- File info if selected -->
                    <div
                      v-if="fileStates[idx]?.file || files[idx]"
                      class="flex items-center justify-between bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-md px-3 py-2"
                    >
                      <div class="flex items-center gap-2">
                        <svg
                          class="w-4 h-4 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span class="text-xs text-gray-700 dark:text-gray-300">
                          {{
                            fileStates[idx]?.file?.name ||
                            files[idx]?.name ||
                            "File baru"
                          }}
                          ({{
                            formatFileSize(
                              fileStates[idx]?.file?.size ||
                                files[idx]?.size ||
                                0,
                            )
                          }})
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <!-- Upload button (for replace) -->
                        <button
                          v-if="
                            fileStates[idx]?.isReplacing &&
                            fileStates[idx]?.file
                          "
                          @click.prevent="uploadReplaceFile(idx, detail)"
                          :disabled="fileStates[idx]?.isUploading"
                          class="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {{
                            fileStates[idx]?.isUploading
                              ? "Uploading..."
                              : "Upload"
                          }}
                        </button>
                        <button
                          @click.prevent="
                            fileStates[idx]?.isReplacing
                              ? cancelReplace(idx, detail)
                              : removeFile(idx)
                          "
                          :disabled="fileStates[idx]?.isUploading"
                          class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs disabled:opacity-50"
                        >
                          {{ fileStates[idx]?.isReplacing ? "Batal" : "Hapus" }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Keterangan Jika Ada yang Tidak Di-check (Ditolak) -->
        <div v-if="hasUnchecked" class="pt-2">
          <label
            class="block text-base font-medium text-gray-900 dark:text-gray-100 mb-2"
            >Keterangan Penolakan <span class="text-red-500">*</span></label
          >

          <textarea
            v-model="keterangan_ditolak"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm min-h-[120px] bg-gray-50 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
            placeholder="Masukkan keterangan mengapa nomor ditolak..."
          ></textarea>
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
  <!-- PREVIEW SLIDEOVER -->
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
    message="Apakah Anda yakin ingin menyetujui nomor yang dipilih?"
    :description="`Apakah Anda yakin ingin menyetujui ${checkedCount} nomor yang dipilih?`"
    confirmText="Ya, Setujui"
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
      :style="{
        left: tooltip.x + 'px',
        top: tooltip.y + 'px',
      }"
    >
      {{ tooltip.text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Search, Copy } from "lucide-vue-next";
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

// Composable
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

/* TABLE CONFIG */
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
const isProcessing = ref(false);
const showConfirmApprove = ref(false);
const showConfirmReject = ref(false);

// Sorting State
const sortBy = ref<string>("");
const sortOrder = ref<"asc" | "desc">("desc");

// Filter Status State
const filterStatus = ref<string>("Menunggu Verifikasi");
const openFilterStatus = ref<boolean>(false);

// Modal control
const openPreview = ref(false);

// Data rows & pagination
const rows = ref<any[]>([]);
const pagination = ref(null);
const loading = ref(false);

// Files state
const files = ref<any[]>([]);

// File states untuk tracking replace
interface FileState {
  isReplacing: boolean;
  isUploading: boolean;
  file: File | null;
  originalFileName: string | null;
}

const fileStates = ref<Record<number, FileState>>({});

// Debounce timeout
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// ✅ FETCH DATA dengan backend pagination, search, filter & sorting
const fetchData = async () => {
  loading.value = true;

  try {
    // Build params object sesuai dokumentasi API
    const params = {
      search: search.value || undefined,
      page: currentPage.value,
      limit: rowsPerPage.value,
      status: filterStatus.value !== "Semua" ? filterStatus.value : undefined,
      sort_by: sortBy.value || undefined,
      sort_order: sortOrder.value || undefined,
    };

    console.log("📤 Fetching verification data with params:", params);

    const res = await getListSubmitted(params);

    console.log("📥 Backend response:", res);

    const data = res.data || [];
    pagination.value = res.pagination || null;

    if (!Array.isArray(data)) {
      rows.value = [];
      return;
    }

    rows.value = data.map((item: any) => {
      // ✅ Data pengusul dan penandatangan sudah ada di response API
      // Tidak perlu lookup ke personMap lagi

      // Format tanggal: DD/MM/YYYY (UTC)
      const tanggalDate = new Date(item.tanggal);
      const formattedTanggal = `${String(tanggalDate.getUTCDate()).padStart(2, "0")}/${String(tanggalDate.getUTCMonth() + 1).padStart(2, "0")}/${tanggalDate.getUTCFullYear()}`;

      // Format tgl usulan: DD/MM/YY HH:MM (WIB = UTC+7)
      const createdDate = new Date(item.created_at);
      const wibTime = new Date(createdDate.getTime() + 7 * 60 * 60 * 1000);
      const day = String(wibTime.getDate()).padStart(2, "0");
      const month = String(wibTime.getMonth() + 1).padStart(2, "0");
      const year = String(wibTime.getFullYear()).slice(-2);
      const hours = String(wibTime.getHours()).padStart(2, "0");
      const minutes = String(wibTime.getMinutes()).padStart(2, "0");
      const formattedTglUsulan = `${day}/${month}/${year} ${hours}:${minutes}`;

      return {
        id: item.id,
        jenis: item.jenis,
        tanggal: formattedTanggal,
        perihal: item.perihal,
        penandatangan: item.penandatangan || "-",
        jumlah: item.jumlah,
        pengusul: item.nama || "-", // Nama pengusul dari API
        tglUsulan: formattedTglUsulan,
        status: item.status,
        klasifikasi: item.klasifikasi,
        file_path: item.file_path,
      };
    });

    console.log("✅ Data verifikasi loaded:", rows.value.length, "rows");
    console.log("📊 Pagination:", pagination.value);
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

// Handle search input with debounce
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    currentPage.value = 1; // Reset to first page on search
    fetchData();
  }, 500); // 500ms debounce
};

// Handle sorting
const handleSort = (column: string) => {
  if (sortBy.value === column) {
    // Toggle sort order
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    // New column, default to desc
    sortBy.value = column;
    sortOrder.value = "desc";
  }

  currentPage.value = 1; // Reset to first page
  fetchData();
};

// Get sort icon for column
const getSortIcon = (column: string) => {
  if (sortBy.value !== column) {
    return "i-lucide-arrow-up-down"; // Default unsorted icon
  }
  return sortOrder.value === "asc"
    ? "i-lucide-arrow-up"
    : "i-lucide-arrow-down";
};

// Handle page change
const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchData();
};

// Handle limit change
const handleLimitChange = () => {
  currentPage.value = 1; // Reset to first page
  fetchData();
};

// Select filter status
const selectFilterStatus = (val: string) => {
  filterStatus.value = val;
  openFilterStatus.value = false;
  currentPage.value = 1; // Reset to first page
  fetchData();
};

// Computed total pages from backend pagination
const totalPages = computed(() => {
  return pagination.value?.totalPages || 1;
});

// Computed pagination pages for display
const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
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

/* Show Preview Modal */
const showPreview = async (row: any) => {
  try {
    const detailData = await getDetailVerifikasiRequest(row.id);

    if (!detailData) {
      return;
    }

    selectedRow.value = {
      ...row,
      ...detailData,
    };

    files.value = Array(detailData.jumlah || 0).fill(null);
    fileStates.value = {};

    keterangan_ditolak.value = "";
    openPreview.value = true;

    console.log("✅ Detail loaded:", detailData);
  } catch (error) {
    console.error("❌ Error fetch detail:", error);
  }
};

/* Preview file */
const previewFile = async (detail: NomorDetail) => {
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

  pdfUrl.value = null;
  isOpenPreview.value = false;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/pdf",
      },
    });

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(
      new Blob([blob], { type: "application/pdf" }),
    );

    pdfUrl.value = blobUrl;
    isOpenPreview.value = true;
  } catch (e) {
    toast.add({
      title: "Gagal memuat file",
      description: "Tidak dapat menampilkan pratinjau dokumen",
      color: "red",
    });
  }
};

/* Start replacing file */
const startReplacingFile = (idx: number) => {
  const detail = selectedRow.value.details[idx];
  fileStates.value[idx] = {
    isReplacing: true,
    isUploading: false,
    file: null,
    originalFileName: detail.file_name,
  };
};

/* Cancel replace */
const cancelReplace = (idx: number, detail: any) => {
  delete fileStates.value[idx];
};

/* Handle File Upload */
const handleFile = (idx: number, event: Event, detail: any) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Validate file size (5MB)
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

  console.log(`📎 File selected for index ${idx}:`, file.name);
};

/* Upload replace file */
const uploadReplaceFile = async (idx: number, detail: any) => {
  if (!detail.id) {
    toast.add({
      title: "Gagal",
      description: "Detail ID tidak ditemukan",
      color: "red",
    });
    return;
  }

  const fileState = fileStates.value[idx];
  if (!fileState || !fileState.file) {
    toast.add({
      title: "Peringatan",
      description: "Pilih file terlebih dahulu",
      color: "yellow",
    });
    return;
  }

  fileState.isUploading = true;

  try {
    const result = await uploadDetailFile(detail.id, fileState.file);

    if (result) {
      detail.file_name = result.file_name;
      detail.file_text = result.file_text;
      detail.file_url = result.file_url;

      delete fileStates.value[idx];
    }
  } catch (error: any) {
    console.error("❌ Error replace file:", error);
  } finally {
    fileState.isUploading = false;
  }
};

/* Remove file */
const removeFile = (idx: number) => {
  files.value[idx] = null;
};

/* Display nomor */
const displayNomor = (detail: any) => {
  if (detail.status === "terpakai" && detail.nomor) {
    return detail.nomor;
  }
  if (detail.template_nomor) {
    return detail.template_nomor;
  }
  if (selectedRow.value?.template_nomor) {
    return selectedRow.value.template_nomor;
  }
  return "-";
};

/* Handle Copy */
const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
    icon: "i-lucide-copy",
  });
};

/* Get filename from path */
const getFileName = (path: string) => {
  if (!path) return "-";
  return path.split("/").pop() || path;
};

/* Format file size */
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Computed untuk validasi dan counting
const hasAnyChecked = computed(() => {
  return (
    selectedRow.value?.details?.some(
      (d: any) => d.checked && d.id && d.id !== null && d.id !== "null",
    ) || false
  );
});

const hasUnchecked = computed(() => {
  return (
    selectedRow.value?.details?.some(
      (d: any) => !d.checked && d.id && d.id !== null && d.id !== "null",
    ) || false
  );
});

const checkedCount = computed(() => {
  return (
    selectedRow.value?.details?.filter(
      (d: any) => d.checked && d.id && d.id !== null && d.id !== "null",
    ).length || 0
  );
});

const uncheckedCount = computed(() => {
  return (
    selectedRow.value?.details?.filter(
      (d: any) => !d.checked && d.id && d.id !== null && d.id !== "null",
    ).length || 0
  );
});

/* KONFIRMASI APPROVAL */
const confirmApproval = () => {
  if (!hasAnyChecked.value) {
    toast.add({
      title: "Peringatan",
      description: "Pilih minimal 1 nomor untuk disetujui!",
      color: "yellow",
    });
    return;
  }
  showConfirmApprove.value = true;
};

/* PROSES APPROVAL */
const processApproval = async () => {
  showConfirmApprove.value = false;
  if (!selectedRow.value) return;

  const approvedDetails = selectedRow.value.details.filter(
    (d) =>
      d.checked &&
      d.id &&
      d.id !== null &&
      d.id !== "null" &&
      d.id !== undefined,
  );

  if (approvedDetails.length === 0) {
    toast.add({
      title: "Peringatan",
      description:
        "Tidak ada nomor yang dapat disetujui. Pastikan nomor memiliki ID yang valid.",
      color: "yellow",
    });
    return;
  }

  isProcessing.value = true;

  try {
    const detailIds = approvedDetails.map((d) => d.id);
    await approveBulkNomor(detailIds);

    openPreview.value = false;
    await fetchData();
  } catch (error: any) {
    console.error("❌ Error approval:", error);
  } finally {
    isProcessing.value = false;
  }
};

/* KONFIRMASI REJECTION */
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
    toast.add({
      title: "Peringatan",
      description: "Keterangan penolakan harus diisi!",
      color: "yellow",
    });
    return;
  }

  showConfirmReject.value = true;
};

/* PROSES REJECTION */
const processRejection = async () => {
  showConfirmReject.value = false;

  if (!selectedRow.value) return;

  const rejectedDetails = selectedRow.value.details.filter(
    (d: any) =>
      !d.checked &&
      d.id &&
      d.id !== null &&
      d.id !== "null" &&
      d.id !== undefined,
  );

  if (rejectedDetails.length === 0) {
    toast.add({
      title: "Peringatan",
      description:
        "Tidak ada nomor yang dapat ditolak. Pastikan nomor memiliki ID yang valid.",
      color: "yellow",
    });
    return;
  }

  if (!keterangan_ditolak.value.trim()) {
    toast.add({
      title: "Peringatan",
      description: "Keterangan penolakan harus diisi!",
      color: "yellow",
    });
    return;
  }

  isProcessing.value = true;

  try {
    const detailIds = rejectedDetails.map((d) => d.id);
    await rejectNomorRequest(
      selectedRow.value.id,
      detailIds,
      keterangan_ditolak.value,
    );

    openPreview.value = false;
    await fetchData();
  } catch (error: any) {
    console.error("❌ Error rejection:", error);
  } finally {
    isProcessing.value = false;
  }
};

/* Format helpers */
function formatDateTime(dateStr: string | Date) {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return `${date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} ${date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/* Close dropdown when click outside */
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) return;
  }
  openFilterStatus.value = false;
}

/* Load data on mount */
onMounted(async () => {
  // ✅ REMOVED: fetchPersonMap - Person data (nama, penandatangan) already included in API response
  // The getListSubmitted endpoint returns all necessary user/person data
  await fetchData();
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);

  // Clear search timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Clean up blob URLs
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
});

const tooltip = ref({
  show: false,
  text: "",
  x: 0,
  y: 0,
});

const onRowMouseMove = (e: MouseEvent, text: string) => {
  const offset = 12;
  const maxX = window.innerWidth - 200;
  const maxY = window.innerHeight - 40;

  tooltip.value = {
    show: true,
    text,
    x: Math.min(e.clientX + offset, maxX),
    y: Math.min(e.clientY + offset, maxY),
  };
};

const onRowMouseLeave = () => {
  tooltip.value.show = false;
};

watch(isOpenPreview, (open) => {
  if (open) {
    openPreview.value = false;
  } else if (selectedRow.value) {
    openPreview.value = true;
  }
});

watch(isOpenPreview, (open) => {
  if (!open && pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = null;
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

/* Dark mode scrollbar */
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
