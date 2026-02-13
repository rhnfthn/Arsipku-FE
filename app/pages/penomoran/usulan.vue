<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Daftar Usulan Penomoran
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- ADD BUTTON -->
      <button
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
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
          <thead class="bg-primary text-white">
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
              class="group hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition"
              @mousemove="onMouseMove($event, 'Klik untuk lihat detail')"
              @mouseleave="onMouseLeave"
              @click.capture="openRowModal(row)"
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
                @click.stop
                class="sticky right-0 z-20 bg-white dark:bg-gray-800 px-5 py-3 border-l border-gray-200 dark:border-gray-700 shadow-[inset_1px_0_1px_-1px_rgba(0,0,0,9)]"
              >
                <span
                  class="flex item-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  :class="{
                    'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center':
                      row.status === 'Belum Diajukan',
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':
                      row.status === 'Menunggu Verifikasi',
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-center':
                      row.status === 'Disetujui',
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-center':
                      row.status === 'Ditolak',
                  }"
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
            Sebelumnya
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

      <!-- MODAL TAMBAH -->
      <Teleport to="body">
        <AddUsulan
          v-model="openAdd"
          @submit="handleSubmitFromModal"
          @preview="handlePreview"
        />
      </Teleport>
    </div>
  </div>

  <!-- MODAL ROW DETAIL -->
  <Teleport to="body">
    <Modal
      v-model="openDetail"
      :hideDefaultFooter="true"
      size="xl"
      :ui="{
        overlay: 'z-[100]',
        content: 'z-[110]',
      }"
    >
      <!-- TITLE -->
      <template #title>
        <div class="flex justify-between items-center w-full px-5 pt-6 pb-3">
          <h2 class="text-lg font-semibold uppercase dark:text-gray-100">
            {{ selectedRow?.jenis_naskah || "Detail" }}
          </h2>
        </div>
      </template>

      <!-- BODY -->
      <div
        v-if="selectedRow"
        class="space-y-6 text-sm px-5 pb-3 max-h-[70vh] overflow-y-auto"
      >
        <!-- Judul Besar -->
        <p
          class="text-gray-900 dark:text-gray-100 font-semibold leading-relaxed text-base"
        >
          {{ selectedRow.perihal }}
        </p>

        <!-- Tanggal -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Tanggal</p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ formatDate(selectedRow.tanggal) }}
          </p>
        </div>

        <!-- Penandatangan -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Penandatangan</p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ selectedRow.penandatangan }}
          </p>
        </div>

        <!-- Klasifikasi -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ selectedRow.klasifikasiDisplay || selectedRow.klasifikasi }}
          </p>
        </div>

        <!-- Jenis Naskah -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Jenis Naskah</p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ selectedRow.jenis_naskah }}
          </p>
        </div>

        <!-- Nomor Surat & File Upload Section -->
        <div class="mt-4">
          <label
            class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 break-words"
          >
            Nomor Surat ({{ selectedRow?.jumlah ?? 0 }} nomor)
          </label>

          <div
            v-if="
              Array.isArray(selectedRow.details) &&
              selectedRow.details.length > 0
            "
            class="space-y-4 mt-2"
          >
            <div
              v-for="(detail, idx) in selectedRow.details"
              :key="detail.id || idx"
              class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
            >
              <!-- Nomor surat dengan status badge -->
              <div class="flex items-center gap-2 mb-3">
                <div
                  class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="text-sm font-mono text-gray-700 dark:text-gray-300"
                    >
                      {{ idx + 1 }}.
                      {{ detail.nomor || selectedRow.template_nomor || "-" }}
                    </span>

                    <!-- Status Badge -->
                    <span
                      v-if="detail.status"
                      :class="[
                        'px-2 py-1 rounded-lg text-xs font-medium',
                        {
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':
                            detail.status === 'booking',
                          'bg-blue-100 dark:bg-blue-900/30 text-primary-800 dark:text-blue-400':
                            detail.status === 'terpakai',
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400':
                            detail.status === 'ditolak',
                          'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300':
                            detail.status === 'hangus',
                          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400':
                            detail.status === 'terpakai_final',
                        },
                      ]"
                    >
                      {{ getStatusLabel(detail.status) }}
                    </span>
                  </div>
                </div>

                <!-- Copy -->
                <button
                  v-if="detail.nomor"
                  @click="handleCopy(detail.nomor)"
                  class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  <Copy class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <!-- FILE SECTION - PRIMARY/BLUE COLOR -->
              <div class="mt-2">
                <!-- File sudah ada (backend atau lokal) -->
                <div
                  v-if="detail.file_name || filesByIndex[idx]"
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
                      <div
                        class="flex-1 cursor-pointer hover:underline"
                        @click="previewFile(detail)"
                      >
                        <p
                          class="text-sm font-medium text-primary dark:text-blue-400"
                        >
                          {{ detail.file_name || filesByIndex[idx]?.name }}
                        </p>
                        <p
                          class="text-xs text-gray-600 dark:text-gray-400 mt-0.5"
                        >
                          {{
                            filesByIndex[idx]
                              ? formatFileSize(filesByIndex[idx].size)
                              : "Klik untuk preview"
                          }}
                        </p>
                      </div>
                    </div>

                    <!-- Remove button hanya untuk file lokal -->
                    <button
                      v-if="filesByIndex[idx] && !detail.file_name"
                      @click="removeFile(idx)"
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

                <!-- Upload form (belum ada file & bisa upload) -->
                <div
                  v-else-if="selectedRow?.status === 'Belum Diajukan'"
                  class="space-y-2"
                >
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
                      >
                        Pilih file (Opsional)
                      </span>
                      <span
                        class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5"
                      >
                        PDF, DOC, DOCX (Max 5MB)
                      </span>
                    </div>

                    <input
                      type="file"
                      class="hidden"
                      accept=".pdf,.doc,.docx"
                      @change="handleFile(idx, $event)"
                    />
                  </label>
                </div>

                <!-- Belum ada file & tidak bisa upload -->
                <div
                  v-else
                  class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
                >
                  <div class="flex items-center gap-2">
                    <svg
                      class="w-4 h-4 text-yellow-600 dark:text-yellow-500"
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

                    <span class="text-xs text-yellow-800 dark:text-yellow-400">
                      Belum ada file diupload
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- File upload warning -->
        <div
          v-if="selectedRow?.status === 'Belum Diajukan'"
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2"
        >
          <svg
            class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
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
          <div class="text-xs text-blue-800 dark:text-blue-300">
            <p class="font-medium">Upload file (opsional)</p>
            <p class="mt-1 text-blue-700 dark:text-blue-400">
              File harus dalam format PDF, DOC, atau DOCX. Usulan tetap dapat
              dikirim tanpa file.
            </p>
          </div>
        </div>

        <!-- Upload Progress Indicator -->
        <div
          v-if="isUploadingFiles"
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"
            ></div>
            <div class="flex-1">
              <p class="text-sm font-medium text-blue-900 dark:text-blue-200">
                Mengirim usulan...
              </p>
              <p class="text-xs text-blue-700 dark:text-blue-400">
                File sedang diupload ke server
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <template #footer>
        <div
          class="flex justify-between w-full gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <!-- Show Kirim button only if status is "Belum Diajukan" -->
          <button
            v-if="selectedRow?.status === 'Belum Diajukan'"
            @click="openConfirmSubmit = true"
            :disabled="isLoadingBooking || isDeletingUsulan || isUploadingFiles"
            class="flex-1 px-5 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span v-if="isUploadingFiles">Mengirim...</span>
            <span v-else>Kirim Usulan</span>
          </button>

          <!-- Hapus button hanya muncul jika status "Belum Diajukan" -->
          <button
            v-if="selectedRow?.status === 'Belum Diajukan'"
            @click="openConfirmDelete = true"
            :disabled="isLoadingBooking || isDeletingUsulan || isUploadingFiles"
            class="flex-1 px-5 py-2 text-sm border border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Hapus Usulan
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
      overlay: 'z-[200]',
      content: 'z-[210] h-screen max-h-screen',
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

  <!-- CONFIRM SUBMIT POPUP -->
  <ConfirmPopup
    v-model="openConfirmSubmit"
    type="question"
    title="Kirim Usulan?"
    :message="getConfirmMessage()"
    confirm-text="Ya, Kirim"
    cancel-text="Batal"
    :is-loading="isLoadingBooking"
    @confirm="confirmSubmitUsulan"
    @cancel="openConfirmSubmit = false"
  />

  <!-- CONFIRM DELETE POPUP -->
  <ConfirmPopup
    v-model="openConfirmDelete"
    type="danger"
    title="Hapus Usulan?"
    message="Usulan yang dihapus tidak dapat dikembalikan. Apakah Anda yakin?"
    confirm-text="Ya, Hapus"
    cancel-text="Batal"
    :is-loading="isDeletingUsulan"
    @confirm="confirmDeleteUsulan"
    @cancel="openConfirmDelete = false"
  />

  <!-- TOOLTIP -->
  <Teleport to="body">
    <div
      v-if="tooltip.show"
      class="fixed z-[9999] pointer-events-none bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md shadow-lg transition-opacity"
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
import { Search, ArrowUpDown, Plus, Copy } from "lucide-vue-next";
import AddUsulan from "~/components/AddUsulan.vue";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { Modal } from "#components";
import { usePenomoran } from "~/composables/usePenomoran";
import { useAuth } from "~/composables/useAuth";
import ConfirmPopup from "~/components/ConfirmPopup.vue";

const { user, getProfile } = useAuth();
const {
  createUsulanDraft,
  deleteUsulanUser,
  getListUsulan,
  getDetailUsulan,
  getPersonWithPosition,
  submitBooking,
  isLoadingBooking,
  getKlasifikasi,
} = usePenomoran();

const toast = useToast();
const config = useRuntimeConfig();
const apiBaseUrl = config.public.apiBase;

const openDetail = ref(false);
const isDeletingUsulan = ref(false);
const isUploadingFiles = ref(false);
const selectedRow = ref(null);
const rows = ref([]);
const loading = ref<boolean>(true);
const pagination = ref(null);

const isOpenPreview = ref(false);
const pdfUrl = ref<string | null>(null);

// File mapping dengan INDEX
const filesByIndex = ref<Record<number, File>>({});

const openAdd = ref<boolean>(false);
const openConfirmDelete = ref(false);
const openConfirmSubmit = ref(false);

// Person mapping
const personMap = ref(new Map());
// Klasifikasi mapping untuk display
const klasifikasiMap = ref(new Map());

// Search and Pagination State
const search = ref<string>("");
const currentPage = ref<number>(1);
const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];

// Sorting State
const sortBy = ref<string>("");
const sortOrder = ref<"asc" | "desc">("desc");

// Filter Status State
const filterStatus = ref<string>("Semua");
const openFilterStatus = ref<boolean>(false);

// Debounce timeout
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

/* Get status label - FIXED untuk terpakai_final menjadi "Final" */
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "pending",
    menunggu: "menunggu",
    booking: "booking",
    terpakai: "terpakai",
    terpakai_final: "Final", // ✅ FIXED: terpakai_final jadi "Final"
    ditolak: "ditolak",
    hangus: "hangus",
  };
  return statusMap[status] || status;
};

/* Preview file */
const previewFile = async (detail: any) => {
  const url = detail.file_url;

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
    // Directly use the signed URL from API
    pdfUrl.value = url;
    isOpenPreview.value = true;
  } catch (e) {
    toast.add({
      title: "Gagal memuat file",
      description: "Tidak dapat menampilkan pratinjau dokumen",
      color: "red",
    });
  }
};

const fetchPersonMap = async () => {
  try {
    const response = await getPersonWithPosition();
    const list = Array.isArray(response) ? response : (response.data ?? []);

    list.forEach((item) => {
      const positionText = item.position_text || "";
      const subAreaText = item.sub_area_text || "";
      const displayText = subAreaText
        ? `${positionText} - ${subAreaText}`
        : positionText;

      personMap.value.set(item.persnum, {
        nama: item.nama,
        position_text: displayText,
      });
    });

    console.log("✅ Person map loaded:", personMap.value.size, "items");
  } catch (error) {
    console.error("❌ Error fetch person map:", error);
  }
};

const fetchData = async () => {
  loading.value = true;

  try {
    if (!user.value?.position) {
      console.error("❌ User position not available");
      rows.value = [];
      pagination.value = null;
      return;
    }

    const params = {
      search: search.value || undefined,
      page: currentPage.value,
      limit: rowsPerPage.value,
      status: filterStatus.value !== "Semua" ? filterStatus.value : undefined,
      sort_by: sortBy.value || undefined,
      sort_order: sortOrder.value || undefined,
    };

    console.log("📤 Fetching data with params:", params);

    const response = await getListUsulan(String(user.value.position), params);

    console.log("📥 Backend response:", response);

    const data = response.data || [];
    pagination.value = response.pagination || null;

    if (!Array.isArray(data)) {
      rows.value = [];
      return;
    }

    rows.value = data.map((item) => {
      const pengusulInfo = personMap.value.get(item.persnum) || {};
      const klasifikasiDisplay =
        klasifikasiMap.value.get(item.klasifikasi) || item.klasifikasi;

      let mappedStatus = item.status || "Belum Diajukan";

      if (mappedStatus === "Menunggu Verifikasi") {
        mappedStatus = "Menunggu Verifikasi";
      } else if (mappedStatus === "Disetujui") {
        mappedStatus = "Disetujui";
      } else if (mappedStatus === "Ditolak") {
        mappedStatus = "Ditolak";
      } else {
        mappedStatus = "Belum Diajukan";
      }

      const tanggalDate = new Date(item.tanggal);
      const formattedTanggal = `${String(tanggalDate.getUTCDate()).padStart(2, "0")}/${String(tanggalDate.getUTCMonth() + 1).padStart(2, "0")}/${tanggalDate.getUTCFullYear()}`;

      const createdDate = new Date(item.created_at);
      const wibTime = new Date(createdDate.getTime() + 7 * 60 * 60 * 1000);

      const day = String(wibTime.getUTCDate()).padStart(2, "0");
      const month = String(wibTime.getUTCMonth() + 1).padStart(2, "0");
      const year = String(wibTime.getUTCFullYear()).slice(-2);
      const hours = String(wibTime.getUTCHours()).padStart(2, "0");
      const minutes = String(wibTime.getUTCMinutes()).padStart(2, "0");

      return {
        id: item.id,
        id_usulan: item.id,
        jenis: item.jenis,
        tanggal: formattedTanggal,
        perihal: item.perihal,
        jumlah: item.jumlah,
        penandatangan: item.penandatangan || "-",
        klasifikasi: item.klasifikasi || "-",
        klasifikasiDisplay,
        pengusul: pengusulInfo.nama || item.nama || user.value?.nama || "-",
        tglUsulan: `${day}/${month}/${year} ${hours}:${minutes}`,
        status: mappedStatus,
        details: item.details || [],
        template_nomor: item.template_nomor || "",
      };
    });

    console.log("✅ Data loaded:", rows.value.length, "rows");
    console.log("📊 Pagination:", pagination.value);
  } catch (err) {
    console.error("❌ Gagal fetch data:", err);
    rows.value = [];
    pagination.value = null;
  } finally {
    loading.value = false;
  }
};

const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

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

const totalPages = computed(() => {
  return pagination.value?.totalPages || 1;
});

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

const openRowModal = async (row) => {
  try {
    console.log("🔍 Opening row modal for:", row.id);

    const detailData = await getDetailUsulan(row.id);

    if (!detailData) {
      toast.add({
        title: "Gagal memuat detail",
        description: "Data detail tidak ditemukan",
        color: "red",
      });
      return;
    }

    console.log("📥 Detail data received:", detailData);

    const klasifikasiDisplay =
      klasifikasiMap.value.get(detailData.klasifikasi) ||
      detailData.klasifikasi;

    const normalizedDetails = normalizeDetails(
      detailData.details || [],
      detailData.jumlah,
      detailData.template_nomor || "",
    );

    console.log("📋 Normalized details:", normalizedDetails);

    selectedRow.value = {
      id_usulan: detailData.id,
      jenis: detailData.jenis,
      jenis_naskah: detailData.jenis,
      tanggal: detailData.tanggal,
      perihal: detailData.perihal,
      jumlah: detailData.jumlah,
      penandatangan: detailData.penandatangan || "-",
      klasifikasi: detailData.klasifikasi || "-",
      klasifikasiDisplay,
      status: detailData.status || row.status,
      template_nomor: detailData.template_nomor || "",
      details: normalizedDetails,
    };

    // Reset file mapping
    filesByIndex.value = {};

    openDetail.value = true;
    console.log("✅ Modal opened with status:", selectedRow.value.status);
    console.log("📊 Total details:", selectedRow.value.details.length);
  } catch (err) {
    console.error("❌ Gagal load detail:", err);
    toast.add({
      title: "Gagal memuat detail",
      description: "Silakan coba lagi",
      color: "red",
    });
  }
};

// Handle file upload
const handleFile = (index: number, event: Event) => {
  console.log("📎 Handle file at index:", index);

  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    console.log("❌ No file selected");
    return;
  }

  console.log("📄 File selected:", file.name, file.type, file.size);

  // Validasi ukuran file
  if (file.size > 5 * 1024 * 1024) {
    console.error("❌ File too large:", file.size);
    toast.add({
      title: "File terlalu besar",
      description: "Ukuran file maksimal 5MB",
      color: "red",
    });
    input.value = "";
    return;
  }

  // Validasi tipe file
  const validTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!validTypes.includes(file.type)) {
    console.error("❌ Invalid file type:", file.type);
    toast.add({
      title: "Tipe file tidak valid",
      description: "Hanya file PDF, DOC, atau DOCX yang diperbolehkan",
      color: "red",
    });
    input.value = "";
    return;
  }

  // Save file to filesByIndex
  filesByIndex.value[index] = file;

  console.log("✅ File saved to index:", index);
  console.log("📊 filesByIndex:", filesByIndex.value);

  toast.add({
    title: "File dipilih",
    description: `File "${file.name}" siap diupload`,
    color: "green",
  });
};

// Remove file
const removeFile = (index: number) => {
  console.log("🗑️ Removing file at index:", index);

  delete filesByIndex.value[index];

  toast.add({
    title: "File dihapus",
    description: "File berhasil dihapus dari daftar upload",
    color: "green",
  });

  console.log("✅ File removed");
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const normalizeDetails = (details: any[], jumlah: number, template: string) => {
  const result = [];

  for (let i = 0; i < jumlah; i++) {
    const backendDetail = details && details[i];

    if (backendDetail) {
      result.push({
        id: backendDetail.id || `temp-${i + 1}`,
        nomor: backendDetail.nomor || null,
        status: backendDetail.status || "booking",
        file_name: backendDetail.file_name || null,
        file_url: backendDetail.file_url || null,
        file_text: backendDetail.file_text || null,
      });
    } else {
      result.push({
        id: `temp-${i + 1}`,
        nomor: null,
        status: "booking",
        file_name: null,
        file_url: null,
        file_text: null,
      });
    }
  }

  console.log("🔄 Normalized details:", {
    input: details?.length || 0,
    jumlah,
    output: result.length,
    details: result,
  });

  return result;
};

const handleCopy = (value: string) => {
  if (!value) return;

  navigator.clipboard.writeText(value);

  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
    icon: "i-lucide-copy",
  });
};

function handlePreview(data: any) {
  selectedRow.value = data;
  openAdd.value = false;
  openDetail.value = true;

  // Reset file mapping
  filesByIndex.value = {};
}

const getConfirmMessage = () => {
  const fileCount = Object.keys(filesByIndex.value).length;

  if (fileCount === 0) {
    return "Apakah Anda yakin ingin mengirim usulan ini tanpa file? Usulan akan dikirim untuk diverifikasi.";
  }

  return `Apakah Anda yakin ingin mengirim usulan ini dengan ${fileCount} file? Usulan akan dikirim untuk diverifikasi.`;
};

const confirmSubmitUsulan = async () => {
  if (!selectedRow.value) return;

  isUploadingFiles.value = true;

  try {
    const formData = new FormData();
    let fileCount = 0;

    Object.keys(filesByIndex.value).forEach((indexStr) => {
      const index = parseInt(indexStr);
      const file = filesByIndex.value[index];

      if (file instanceof File) {
        fileCount++;

        formData.append("file", file);
        formData.append("file_name", file.name);
        formData.append("file_text", file.name);

        console.log(`📎 Appending file at index ${index}:`, file.name);
      }
    });

    console.log("📦 Total files to upload:", fileCount);

    await submitBooking(selectedRow.value.id_usulan, formData);

    openConfirmSubmit.value = false;
    openDetail.value = false;

    toast.add({
      title: "Berhasil",
      description:
        fileCount > 0
          ? `Usulan dikirim dengan ${fileCount} file`
          : "Usulan dikirim tanpa file",
      color: "green",
    });

    filesByIndex.value = {};
    await fetchData();
  } catch (e) {
    console.error("❌ Submit error:", e);
    openConfirmSubmit.value = false;

    toast.add({
      title: "Gagal",
      description: e?.response?.data?.message || "Gagal mengirim usulan",
      color: "red",
    });
  } finally {
    isUploadingFiles.value = false;
  }
};

const confirmDeleteUsulan = async () => {
  if (!selectedRow.value?.id_usulan) return;

  const idToDelete = selectedRow.value.id_usulan;
  isDeletingUsulan.value = true;

  try {
    await deleteUsulanUser(idToDelete);

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil dihapus",
      color: "green",
    });

    openConfirmDelete.value = false;
    openDetail.value = false;

    await fetchData();
  } catch (error) {
    console.error("❌ Delete gagal:", error);
    toast.add({
      title: "Gagal",
      description: "Gagal menghapus usulan. Silakan coba lagi.",
      color: "red",
    });
  } finally {
    isDeletingUsulan.value = false;
  }
};

const isSubmittingUsulan = ref(false);
const handleSubmitFromModal = async (payload: any) => {
  if (isSubmittingUsulan.value) return;
  isSubmittingUsulan.value = true;

  try {
    console.log("📤 Payload diterima dari modal:", payload);

    if (
      !payload.tanggal ||
      !payload.jenis ||
      !payload.klasifikasi ||
      !payload.perihal ||
      !payload.jumlah
    ) {
      toast.add({
        title: "Data Tidak Lengkap",
        description: "Pastikan semua field terisi",
        color: "yellow",
      });
      return;
    }

    const dateObj = new Date(payload.tanggal);
    const formattedDate = dateObj.toISOString().split("T")[0];

    const formattedPayload = {
      position_id: Number(user.value?.position),
      tanggal: formattedDate,
      jenis: String(payload.jenis),
      klasifikasi: String(payload.klasifikasi),
      perihal: String(payload.perihal),
      penandatangan: String(payload.penandatangan),
      id_position_penandatangan: Number(payload.id_position_penandatangan),
      jumlah: Number(payload.jumlah),
    };

    console.log("📦 Formatted payload:", formattedPayload);

    await createUsulanDraft(formattedPayload);

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil ditambahkan",
      color: "green",
    });

    openAdd.value = false;

    currentPage.value = 1;
    await fetchData();
  } catch (err) {
    console.error("❌ Error submit modal:", err);

    toast.add({
      title: "Gagal",
      description:
        err?.response?.data?.message || err?.message || "Usulan gagal dikirim",
      color: "red",
    });
  } finally {
    isSubmittingUsulan.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) return;
  }
  openFilterStatus.value = false;
}

onMounted(async () => {
  loading.value = true;

  if (!user.value) {
    await getProfile();
  }

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

watch(isOpenPreview, (open) => {
  if (!open && pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = null;
  }
});

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Usulan", to: "/penomoran/usulan" },
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

const filterOptions = [
  "Semua",
  "Belum Diajukan",
  "Menunggu Verifikasi",
  "Disetujui",
  "Ditolak",
];

const tooltip = ref({
  show: false,
  text: "",
  x: 0,
  y: 0,
});
const onMouseMove = (e: MouseEvent, text: string) => {
  tooltip.value = {
    show: true,
    text,
    x: e.clientX + 12,
    y: e.clientY + 12,
  };
};

const onMouseLeave = () => {
  tooltip.value.show = false;
};
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
