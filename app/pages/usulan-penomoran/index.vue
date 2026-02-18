<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-gray-100">
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
        class="flex flex-col md:flex-row justify-between items-center gap-4 pt-3 mb-4 pr-3"
      >
        <div class="flex items-center gap-2 px-4 py-2">
          <select
            v-model="rowsPerPage"
            class="border text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md px-2 py-1"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </div>

        <div class="relative inline-block">
          <button
            data-custom-dropdown
            class="flex items-center justify-between gap-2 bg-gray-100 dark:bg-gray-700 text-xs px-3 py-1 rounded-lg min-w-[100px]"
            @click.stop="openFilterStatus = !openFilterStatus"
          >
            <span class="text-sm dark:text-gray-200">{{
              filterStatus || "Semua"
            }}</span>
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

        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            placeholder="Cari..."
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs dark:text-gray-200 pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="space-y-3 p-4">
        <div
          v-for="i in 5"
          :key="i"
          class="w-full h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"
        ></div>
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="filteredRows.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400"
      >
        <p class="text-sm font-medium">Data tidak ditemukan</p>
      </div>

      <!-- TABLE -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-max bg-white dark:bg-gray-800 text-sm">
          <thead class="bg-primary text-white">
            <tr>
              <th
                v-for="col in headers"
                :key="col.key"
                @click="col.sortable && sort(col.key)"
                :class="[
                  'px-5 py-3 text-left font-semibold tracking-wide whitespace-nowrap',
                  col.sortable
                    ? 'cursor-pointer select-none'
                    : 'cursor-default',
                ]"
              >
                <div class="flex items-center gap-1">
                  <span>{{ col.label }}</span>
                  <ArrowUpDown
                    v-if="col.sortable"
                    class="inline w-3 h-3 opacity-70"
                  />
                </div>
              </th>
              <th
                @click="sortStatus"
                class="sticky right-0 z-30 bg-primary text-white px-5 py-3 text-left font-semibold whitespace-nowrap cursor-pointer select-none"
              >
                <div class="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown class="inline w-3 h-3 opacity-70" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in paginatedRows"
              :key="row.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition"
              @click="openRowModal(row)"
            >
              <td class="px-5 py-4 dark:text-gray-300">{{ row.jenis }}</td>
              <td class="px-5 py-4 dark:text-gray-300">{{ row.tanggal }}</td>
              <td class="px-5 py-4">
                <div class="relative group max-w-[350px]">
                  <p
                    class="whitespace-normal break-words line-clamp-3 cursor-help dark:text-gray-300"
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
                @click.stop
                class="sticky right-0 z-20 bg-white dark:bg-gray-800 px-5 py-3 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]"
              >
                <span
                  class="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  :class="{
                    'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300':
                      row.status === 'Belum Diajukan',
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':
                      row.status === 'Menunggu Verifikasi',
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400':
                      row.status === 'Disetujui',
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400':
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
        v-if="filteredRows.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Menampilkan {{ paginatedRows.length }} dari
          {{ filteredRows.length }} data
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
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
              @click="currentPage = 1"
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
              @click="currentPage = page"
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
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all"
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
      v-if="!isOpenPreview"
      v-model="openDetail"
      :hideDefaultFooter="true"
      size="xl"
    >
      <template #title>
        <div class="flex justify-between items-center w-full px-5 pt-6 pb-3">
          <h2 class="text-lg font-semibold uppercase dark:text-gray-100">
            {{ selectedRow?.jenis_naskah || "Detail" }}
          </h2>
        </div>
      </template>

      <div
        v-if="selectedRow"
        class="space-y-6 text-sm px-5 pb-3 max-h-[70vh] overflow-y-auto"
      >
        <!-- Perihal -->
        <p
          class="text-gray-900 dark:text-gray-100 font-semibold leading-relaxed text-base"
        >
          {{ selectedRow.perihal || "-" }}
        </p>

        <!-- Tanggal -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Tanggal</p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ formatDateTime(selectedRow.tanggal) }}
          </p>
        </div>

        <!-- Penandatangan -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Penandatangan</p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ selectedRow.penandatangan || "-" }}
          </p>
        </div>

        <!-- Klasifikasi -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{
              selectedRow.klasifikasiDisplay || selectedRow.klasifikasi || "-"
            }}
          </p>
        </div>

        <!-- Jenis Naskah -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Jenis Naskah</p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ selectedRow.jenis_naskah || "-" }}
          </p>
        </div>

        <!-- Nomor Surat & File Section -->
        <div class="mt-4">
          <label
            class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 break-words"
          >
            Nomor Surat ({{ selectedRow.jumlah }} nomor)
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
              :class="[
                'border rounded-lg p-4 transition',
                detail.status === 'hangus'
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 opacity-60'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50',
              ]"
            >
              <!-- Nomor surat + status badge -->
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
                          : 'text-gray-700 dark:text-gray-300',
                      ]"
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
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400':
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

                <!-- ✅ Sembunyikan copy button jika hangus -->
                <button
                  v-if="detail.nomor && detail.status !== 'hangus'"
                  @click="handleCopy(detail.nomor)"
                  class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  <Copy class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <!-- ✅ FILE SECTION -->
              <div class="mt-2">
                <!-- ✅ HANGUS: tampilkan file jika ada (read-only, tidak bisa klik preview), atau indikator hangus -->
                <template v-if="detail.status === 'hangus'">
                  <!-- Ada file → tampilkan tapi non-clickable (greyed out) -->
                  <div
                    v-if="detail.file_name || detail.file_url"
                    class="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 rounded-md p-3"
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
                          {{ detail.file_name || "Dokumen" }}
                        </p>
                        <p
                          class="text-xs text-gray-400 dark:text-gray-500 mt-0.5"
                        >
                          Nomor telah dihanguskan
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Tidak ada file → indikator hangus saja -->
                  <div
                    v-else
                    class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3"
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

                <!-- ✅ Ada file (bukan hangus) → bisa di-preview -->
                <div
                  v-else-if="
                    detail.file_name || detail.file_url || filesByIndex[idx]
                  "
                  @click="openPreview(detail, idx)"
                  class="bg-blue-50 mt-2 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-0.5">
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
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p
                        class="text-sm font-medium text-primary dark:text-blue-400 underline"
                      >
                        {{
                          detail.file_name ||
                          filesByIndex[idx]?.name ||
                          "Dokumen"
                        }}
                      </p>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        Klik untuk preview
                      </p>
                    </div>

                    <!-- Remove button hanya untuk local file saat Belum Diajukan -->
                    <button
                      v-if="
                        filesByIndex[idx] &&
                        !detail.file_url &&
                        selectedRow?.status === 'Belum Diajukan'
                      "
                      @click.stop="removeFile(idx)"
                      class="flex-shrink-0 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Hapus file"
                    >
                      <svg
                        class="w-4 h-4 text-red-600 dark:text-red-400"
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

                <!-- ✅ Upload area jika belum ada file dan status Belum Diajukan -->
                <div
                  v-else-if="selectedRow?.status === 'Belum Diajukan'"
                  class="space-y-2"
                >
                  <label
                    class="w-full flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md px-4 py-3 text-sm hover:bg-white dark:hover:bg-gray-800 hover:border-primary dark:hover:border-primary-600 transition-all"
                  >
                    <svg
                      class="w-5 h-5 text-gray-400 dark:text-gray-500"
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
                        class="text-xs text-gray-500 dark:text-gray-400 block"
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

                <!-- ✅ Belum ada file & tidak bisa upload -->
                <div
                  v-else
                  class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-2"
                >
                  <div class="flex items-center gap-2">
                    <svg
                      class="w-3 h-3 text-yellow-600 dark:text-yellow-500"
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

        <!-- Info upload -->
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

        <!-- Upload Progress -->
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

      <template #footer>
        <div
          class="flex justify-between w-full gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            v-if="selectedRow?.status === 'Belum Diajukan'"
            @click="openConfirmSubmit = true"
            :disabled="isLoadingBooking || isDeletingUsulan || isUploadingFiles"
            class="flex-1 px-5 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span v-if="isUploadingFiles">Mengirim...</span>
            <span v-else>Kirim Usulan</span>
          </button>

          <button
            v-if="!isApprovedStatus(selectedRow)"
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

  <!-- CONFIRM SUBMIT -->
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

  <!-- CONFIRM DELETE -->
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

  <!-- ✅ PREVIEW SLIDEOVER -->
  <USlideover
    v-model:open="isOpenPreview"
    title="Pratinjau Dokumen"
    side="bottom"
    :dismissible="true"
    :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
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
          class="w-full h-full border-0"
          allowfullscreen
        />
        <div v-else class="flex flex-col items-center gap-3">
          <svg
            class="w-12 h-12 text-gray-400 dark:text-gray-600"
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
          <span class="text-gray-500 dark:text-gray-400 text-sm"
            >Gagal memuat dokumen</span
          >
        </div>
      </div>
    </template>
  </USlideover>
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
  getListUsulanByPosition,
  getPersonWithPosition,
  submitBooking,
  isLoadingBooking,
  getKlasifikasi,
} = usePenomoran();

const toast = useToast();

const openDetail = ref(false);
const isDeletingUsulan = ref(false);
const isUploadingFiles = ref(false);
const selectedRow = ref(null);
const rows = ref([]);
const loading = ref<boolean>(true);

const filesByIndex = ref<Record<number, File>>({});
const openAdd = ref<boolean>(false);
const openConfirmDelete = ref(false);
const openConfirmSubmit = ref(false);

// ─── Preview Slideover ────────────────────────
const isOpenPreview = ref(false);
const pdfUrl = ref<string | null>(null);
// Track apakah preview dibuka dari modal detail (untuk buka kembali saat ditutup)
const previewSource = ref<"detail" | null>(null);

// Person & Klasifikasi mapping
const personMap = ref(new Map());
const klasifikasiMap = ref(new Map());

// Search + Pagination
const search = ref<string>("");
const currentPage = ref<number>(1);
const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const sortBy = ref<string>("tglUsulan");
const sortDir = ref<"asc" | "desc">("desc");
const filterStatus = ref<string>("Semua");
const openFilterStatus = ref<boolean>(false);

/* ===========================
 * GET STATUS LABEL
 * ✅ terpakai_final → "Final"
 * =========================== */
const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    booking: "Booking",
    terpakai: "Terpakai",
    terpakai_final: "Final",
    ditolak: "Ditolak",
    hangus: "Hangus",
  };
  return map[status] || status;
};

/* ===========================
 * CHECK APPROVED STATUS
 * =========================== */
const isApprovedStatus = (row: any) => {
  if (!row || !Array.isArray(row.details)) return false;
  return row.details.some(
    (d: any) => d.status === "terpakai" || d.status === "terpakai_final",
  );
};

/* ===========================
 * FETCH PERSON MAP
 * =========================== */
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
  } catch (error) {
    console.error("❌ Error fetch person map:", error);
  }
};

/* ===========================
 * FETCH KLASIFIKASI MAP
 * =========================== */
const fetchKlasifikasiMap = async () => {
  try {
    const response = await getKlasifikasi();
    if (Array.isArray(response)) {
      response.forEach((item) => {
        klasifikasiMap.value.set(item.code, item.display);
      });
    }
  } catch (error) {
    console.error("❌ Error fetch klasifikasi map:", error);
  }
};

/* ===========================
 * FETCH DATA
 * =========================== */
const fetchData = async () => {
  loading.value = true;
  try {
    if (!user.value?.position) {
      rows.value = [];
      return;
    }

    const data = await getListUsulanByPosition(String(user.value.position));

    if (!Array.isArray(data)) {
      rows.value = [];
      return;
    }

    rows.value = data.map((item) => {
      const pengusulInfo = personMap.value.get(item.persnum) || {};
      const klasifikasiDisplay =
        klasifikasiMap.value.get(item.klasifikasi) || item.klasifikasi;

      let mappedStatus = "Belum Diajukan";
      if (item.details?.length) {
        if (
          item.details.some(
            (d) => d.status === "terpakai" || d.status === "terpakai_final",
          )
        ) {
          mappedStatus = "Disetujui";
        } else if (item.details.some((d) => d.status === "booking")) {
          mappedStatus = "Menunggu Verifikasi";
        } else if (item.details.some((d) => d.status === "ditolak")) {
          mappedStatus = "Ditolak";
        }
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
        tglUsulan: `${day}/${month}/${year} ${hours}:${minutes}`,
        tglUsulanSort: wibTime.getTime(),
        perihal: item.perihal || "-",
        jumlah: item.jumlah,
        penandatangan: item.penandatangan || "-",
        klasifikasi: item.klasifikasi || "-",
        klasifikasiDisplay,
        pengusul: pengusulInfo.nama || user.value?.nama || "-",
        status: mappedStatus,
        // ✅ Simpan details lengkap termasuk file_url dari API
        details: item.details || [],
        template_nomor: item.template_nomor || "",
      };
    });
  } catch (err) {
    console.error("❌ Gagal fetch data:", err);
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

/* ===========================
 * OPEN ROW MODAL
 * =========================== */
const openRowModal = async (row) => {
  try {
    const klasifikasiDisplay =
      klasifikasiMap.value.get(row.klasifikasi) || row.klasifikasi;
    const normalizedDetails = normalizeDetails(
      row.details || [],
      row.jumlah,
      row.template_nomor || "",
    );

    selectedRow.value = {
      id_usulan: row.id,
      jenis: row.jenis,
      jenis_naskah: row.jenis,
      tanggal: row.tanggal,
      perihal: row.perihal || "-",
      jumlah: row.jumlah,
      penandatangan: row.penandatangan || "-",
      klasifikasi: row.klasifikasi || "-",
      klasifikasiDisplay,
      status: row.status,
      template_nomor: row.template_nomor || "",
      // ✅ details sudah include file_url dari API response
      details: normalizedDetails,
    };

    filesByIndex.value = {};
    openDetail.value = true;
  } catch (err) {
    console.error("❌ Gagal load detail:", err);
    toast.add({
      title: "Gagal memuat detail",
      description: "Silakan coba lagi",
      color: "red",
    });
  }
};

/* ===========================
 * OPEN PREVIEW
 * ✅ Prioritas:
 *   1. Local file (blob URL)
 *   2. file_url dari API (pre-signed S3) — langsung dipakai
 *   3. Tidak ada → toast warning
 * =========================== */
const openPreview = (detail: any, idx: number) => {
  const localFile = filesByIndex.value[idx];
  let url: string | null = null;

  if (localFile instanceof File) {
    // Local file belum diupload → buat blob URL sementara
    url = URL.createObjectURL(localFile);
  } else if (detail.file_url) {
    // ✅ Pre-signed S3 URL dari API — langsung pakai, tidak perlu fetch/blob
    url = detail.file_url;
  } else {
    toast.add({
      title: "File tidak tersedia",
      description: "Tidak ada file untuk ditampilkan",
      color: "yellow",
    });
    return;
  }

  previewSource.value = "detail";
  pdfUrl.value = url;
  openDetail.value = false;
  isOpenPreview.value = true;
};

/* ===========================
 * WATCH: Slideover ditutup
 * =========================== */
watch(isOpenPreview, (isOpen) => {
  if (!isOpen) {
    // ✅ Revoke hanya jika blob URL (local file), bukan S3 URL
    if (pdfUrl.value && pdfUrl.value.startsWith("blob:")) {
      URL.revokeObjectURL(pdfUrl.value);
    }
    pdfUrl.value = null;

    // Buka kembali modal detail
    if (previewSource.value === "detail") {
      openDetail.value = true;
      previewSource.value = null;
    }
  }
});

/* ===========================
 * HELPERS
 * =========================== */
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

const handlePreview = (data: any) => {
  selectedRow.value = data;
  openAdd.value = false;
  openDetail.value = true;
  filesByIndex.value = {};
};

const getConfirmMessage = () => {
  const fileCount = Object.keys(filesByIndex.value).length;
  return fileCount === 0
    ? "Apakah Anda yakin ingin mengirim usulan ini tanpa file? Usulan akan dikirim untuk diverifikasi."
    : `Apakah Anda yakin ingin mengirim usulan ini dengan ${fileCount} file? Usulan akan dikirim untuk diverifikasi.`;
};

const normalizeDetails = (details: any[], jumlah: number, template: string) => {
  const result = [...(details || [])];
  while (result.length < jumlah) {
    result.push({
      id: `temp-${result.length + 1}`,
      nomor: null,
      status: "booking",
      file_name: null,
      file_url: null,
    });
  }
  return result.slice(0, jumlah);
};

const handleFile = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: "File terlalu besar",
      description: "Ukuran file maksimal 5MB",
      color: "red",
    });
    input.value = "";
    return;
  }

  const validTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!validTypes.includes(file.type)) {
    toast.add({
      title: "Tipe file tidak valid",
      description: "Hanya file PDF, DOC, atau DOCX yang diperbolehkan",
      color: "red",
    });
    input.value = "";
    return;
  }

  filesByIndex.value[index] = file;
  toast.add({
    title: "File dipilih",
    description: `File "${file.name}" siap diupload`,
    color: "green",
  });
};

const removeFile = (index: number) => {
  delete filesByIndex.value[index];
  toast.add({
    title: "File dihapus",
    description: "File berhasil dihapus",
    color: "green",
  });
};

/* ===========================
 * CONFIRM SUBMIT
 * =========================== */
const confirmSubmitUsulan = async () => {
  if (!selectedRow.value) return;
  isUploadingFiles.value = true;
  try {
    const formData = new FormData();
    let fileCount = 0;

    Object.keys(filesByIndex.value).forEach((indexStr) => {
      const file = filesByIndex.value[parseInt(indexStr)];
      if (file instanceof File) {
        fileCount++;
        formData.append("file", file);
        formData.append("file_name", file.name);
        formData.append("file_text", file.name);
      }
    });

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

/* ===========================
 * CONFIRM DELETE
 * =========================== */
const confirmDeleteUsulan = async () => {
  if (!selectedRow.value?.id_usulan) return;
  isDeletingUsulan.value = true;
  try {
    await deleteUsulanUser(selectedRow.value.id_usulan);
    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil dihapus",
      color: "green",
    });
    openConfirmDelete.value = false;
    openDetail.value = false;
    await fetchData();
  } catch (error) {
    toast.add({
      title: "Gagal",
      description: "Gagal menghapus usulan. Silakan coba lagi.",
      color: "red",
    });
  } finally {
    isDeletingUsulan.value = false;
  }
};

/* ===========================
 * HANDLE SUBMIT FROM ADD MODAL
 * =========================== */
const isSubmittingUsulan = ref(false);
const handleSubmitFromModal = async (payload: any) => {
  if (isSubmittingUsulan.value) return;
  isSubmittingUsulan.value = true;
  try {
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

    const formattedPayload = {
      position_id: Number(user.value?.position),
      tanggal: new Date(payload.tanggal).toISOString().split("T")[0],
      jenis: String(payload.jenis),
      klasifikasi: String(payload.klasifikasi),
      perihal: String(payload.perihal),
      penandatangan: String(payload.penandatangan),
      id_position_penandatangan: Number(payload.id_position_penandatangan),
      jumlah: Number(payload.jumlah),
    };

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

const formatDateTime = (dateStr: string) => {
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
  if (!user.value) await getProfile();
  await fetchKlasifikasiMap();
  await fetchPersonMap();
  await fetchData();
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  // ✅ Revoke hanya blob URL
  if (pdfUrl.value && pdfUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(pdfUrl.value);
  }
});

/* Breadcrumb */
const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Usulan", to: "/usulan-penomoran" },
];

/* TABLE CONFIG */
const headers = [
  { label: "Jenis", key: "jenis", sortable: true },
  { label: "Tanggal", key: "tanggal", sortable: true },
  { label: "Perihal", key: "perihal", sortable: false },
  { label: "Penandatangan", key: "penandatangan", sortable: false },
  { label: "Jumlah", key: "jumlah", sortable: false },
  { label: "Pengusul", key: "pengusul", sortable: false },
  { label: "Tgl Usulan", key: "tglUsulan", sortable: true },
];

const filterOptions = [
  "Semua",
  "Belum Diajukan",
  "Menunggu Verifikasi",
  "Disetujui",
  "Ditolak",
];

const statusOrder: Record<string, number> = {
  "Belum Diajukan": 1,
  "Menunggu Verifikasi": 2,
  Disetujui: 3,
  Ditolak: 4,
};

const sortStatus = () => {
  if (sortBy.value === "status") {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = "status";
    sortDir.value = "asc";
  }
};

const sort = (col: string) => {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = col;
    sortDir.value = "asc";
  }
};

const selectFilterStatus = (val: string) => {
  filterStatus.value = val;
  openFilterStatus.value = false;
};

const filteredRows = computed(() => {
  const s = search.value.toLowerCase();
  const fs = filterStatus.value;
  return rows.value.filter((r) => {
    if (!r || typeof r !== "object") return false;
    const matchSearch = Object.values(r).some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(s),
    );
    const matchStatus = fs === "Semua" || r.status === fs;
    return matchSearch && matchStatus;
  });
});

const sortedRows = computed(() => {
  return [...filteredRows.value].sort((a, b) => {
    if (sortBy.value === "status") {
      const A = statusOrder[a.status] ?? 99;
      const B = statusOrder[b.status] ?? 99;
      return sortDir.value === "asc" ? A - B : B - A;
    }
    if (sortBy.value === "tglUsulan") {
      const A = a.tglUsulanSort ?? 0;
      const B = b.tglUsulanSort ?? 0;
      return sortDir.value === "asc" ? A - B : B - A;
    }
    const A = String(a[sortBy.value] ?? "").toLowerCase();
    const B = String(b[sortBy.value] ?? "").toLowerCase();
    if (A < B) return sortDir.value === "asc" ? -1 : 1;
    if (A > B) return sortDir.value === "asc" ? 1 : -1;
    return 0;
  });
});

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedRows.value.slice(start, start + rowsPerPage.value);
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedRows.value.length / rowsPerPage.value)),
);

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

watch([search, rowsPerPage, sortBy, sortDir, filterStatus], () => {
  currentPage.value = 1;
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
</style>
