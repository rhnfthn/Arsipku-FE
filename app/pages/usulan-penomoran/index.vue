<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-2">
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
    <div class="bg-white dark:bg-gray-800 shadow-sm rounded-xl w-full">
      <!-- TOP BAR -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 pt-3 mb-4 pr-3">
        <div class="flex items-center gap-2 px-4 py-2">
          <select
            v-model="rowsPerPage"
            class="border text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md px-3 py-1.5"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>

        <!-- FILTER STATUS -->
        <div class="relative" data-custom-dropdown>
          <button
            type="button"
            @click.stop="openFilterStatus = !openFilterStatus"
            class="flex items-center gap-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[180px] justify-between"
          >
            <span class="truncate">{{ filterStatus || 'Semua' }}</span>
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
                :key="item"
                type="button"
                @click.stop="selectFilterStatus(item)"
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                  filterStatus === item
                    ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ item }}
              </button>
            </div>
          </Transition>
        </div>

        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            placeholder="Cari"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm dark:text-gray-200 pl-9 pr-3 py-1.5 rounded-lg"
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
          <thead class="bg-primary dark:bg-primary-800 text-white">
            <tr>
              <th
                v-for="col in headers"
                :key="col.key"
                @click="col.sortable && sort(col.key)"
                :class="[
                  'px-5 py-3 text-left font-semibold tracking-wide whitespace-nowrap',
                  col.sortable ? 'cursor-pointer select-none' : 'cursor-default'
                ]"
              >
                <div class="flex items-center gap-1">
                  <span>{{ col.label }}</span>
                  <ArrowUpDown v-if="col.sortable" class="inline w-3 h-3 opacity-70" />
                </div>
              </th>
              <th
                @click="sortStatus"
                class="sticky right-0 z-30 bg-primary dark:bg-primary-800 text-white px-5 py-3 text-left font-semibold whitespace-nowrap cursor-pointer select-none"
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
                    {{ row.perihal || '-' }}
                  </p>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="relative group max-w-[300px]">
                  <p class="whitespace-normal break-words line-clamp-3 dark:text-gray-300">
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
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':
                      row.status === 'Menunggu Verifikasi',
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400':
                      row.status === 'Disetujui',
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400':
                      row.status === 'Final',
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400':
                      row.status === 'Ditolak',
                    'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400': ![
                      'Menunggu Verifikasi',
                      'Disetujui',
                      'Final',
                      'Ditolak'
                    ].includes(row.status)
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
          Menampilkan {{ paginatedRows.length }} dari {{ filteredRows.length }} data
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
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
            Sebelumnya
          </button>
          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 hover:text-primary transition-all"
            >
              1
            </button>
            <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400 text-sm">...</span>
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
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
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 hover:text-primary transition-all"
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
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary hover:bg-primary-50'
            ]"
          >
            Selanjutnya
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
        <AddUsulan v-model="openAdd" @submit="handleSubmitFromModal" @preview="handlePreview" />
      </Teleport>
    </div>
  </div>

  <!-- ===================================================
       MODAL ROW DETAIL
       =================================================== -->
  <Teleport to="body">
    <Modal v-model="openDetail" :hideDefaultFooter="true" size="xl">
      <template #title>
        <div class="flex justify-between items-center w-full px-5 pt-6 pb-3">
          <h2 class="text-lg font-semibold uppercase dark:text-gray-100">
            {{ selectedRow?.jenis_naskah || 'Detail' }}
          </h2>
        </div>
      </template>

      <div v-if="selectedRow" class="space-y-6 text-sm px-5 pb-3 max-h-[70vh] overflow-y-auto">
        <p class="text-gray-900 dark:text-gray-100 font-semibold leading-relaxed text-base">
          {{ selectedRow.perihal || '-' }}
        </p>

        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Tanggal</p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ formatDate(selectedRow.tanggal) }}
          </p>
        </div>

        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Penandatangan</p>
          <p class="font-medium mt-1 dark:text-gray-200">{{ selectedRow.penandatangan || '-' }}</p>
        </div>

        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ selectedRow.klasifikasiDisplay || selectedRow.klasifikasi || '-' }}
          </p>
        </div>

        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">Jenis Naskah</p>
          <p class="font-medium mt-1 dark:text-gray-200">{{ selectedRow.jenis_naskah || '-' }}</p>
        </div>

        <!-- NOMOR SURAT LIST -->
        <div class="mt-4">
          <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 break-words">
            Nomor Surat ({{ selectedRow.jumlah }} nomor)
          </label>

          <div
            v-if="Array.isArray(selectedRow.details) && selectedRow.details.length > 0"
            class="space-y-4 mt-2"
          >
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
                            detail.status === 'hangus'
                        }
                      ]"
                    >
                      {{ getStatusLabel(detail.status) }}
                    </span>
                  </div>
                </div>
                <button
                  v-if="detail.nomor && detail.status !== 'hangus'"
                  @click="handleCopy(detail.nomor)"
                  class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  <Copy class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <!-- File section -->
              <div class="mt-2">
                <!-- HANGUS: tampilkan file dengan strikethrough jika ada -->
                <template v-if="detail.status === 'hangus'">
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
                          {{ detail.file_name || 'Dokumen' }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Nomor telah dihanguskan
                        </p>
                      </div>
                    </div>
                  </div>
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
                      <span class="text-xs text-gray-400 dark:text-gray-500"
                        >Nomor telah dihanguskan</span
                      >
                    </div>
                  </div>
                </template>

                <!-- TERPAKAI: tampilkan file + tombol Ganti File (dua langkah) -->
                <template v-else-if="detail.status === 'terpakai'">
                  <!-- File card (klik preview) — hanya tampil saat tidak sedang replacing -->
                  <div
                    v-if="
                      (detail.file_name || detail.file_url) && !fileStates[detail.id]?.isReplacing
                    "
                    @click="openPreview(detail, idx)"
                    class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                  >
                    <div class="flex items-start gap-3">
                      <svg
                        class="w-5 h-5 text-primary dark:text-blue-400 flex-shrink-0 mt-0.5"
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
                        <p class="text-sm font-medium text-primary dark:text-blue-400 underline">
                          {{ detail.file_name || 'Dokumen' }}
                        </p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">Klik untuk preview</p>
                      </div>
                    </div>
                  </div>
                  <!-- Jika belum ada file dan tidak sedang replacing -->
                  <div
                    v-else-if="
                      !detail.file_name && !detail.file_url && !fileStates[detail.id]?.isReplacing
                    "
                    class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-2"
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
                      <span class="text-xs text-yellow-800 dark:text-yellow-400"
                        >Belum ada file diupload</span
                      >
                    </div>
                  </div>

                  <!-- Area pilih file pengganti (muncul saat isReplacing) -->
                  <div
                    v-if="fileStates[detail.id]?.isReplacing"
                    class="border border-dashed border-primary/40 dark:border-primary/30 rounded-md p-3 bg-blue-50/50 dark:bg-blue-900/10"
                  >
                    <p class="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                      {{ detail.file_name ? 'Pilih file pengganti:' : 'Pilih file:' }}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      @change="handleFileSelect(detail.id, $event)"
                      class="block w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 dark:text-gray-200 cursor-pointer"
                    />
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                      Maks 5MB — PDF, DOC, DOCX
                    </p>
                  </div>

                  <!-- Action buttons -->
                  <div class="flex gap-2 mt-2">
                    <!-- Tombol Ganti File (sebelum isReplacing) -->
                    <button
                      v-if="!fileStates[detail.id]?.isReplacing"
                      @click="startReplacingFile(detail.id)"
                      class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition"
                    >
                      Ganti File
                    </button>

                    <!-- Simpan & Batal (saat isReplacing) -->
                    <template v-if="fileStates[detail.id]?.isReplacing">
                      <button
                        @click="saveGantiFile(detail.id)"
                        :disabled="
                          !fileStates[detail.id]?.file || fileStates[detail.id]?.isUploading
                        "
                        :class="[
                          'flex-1 px-4 py-2.5 rounded-lg transition text-sm font-medium',
                          !fileStates[detail.id]?.file || fileStates[detail.id]?.isUploading
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        ]"
                      >
                        <span
                          v-if="fileStates[detail.id]?.isUploading"
                          class="flex items-center justify-center gap-2"
                        >
                          <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle
                              class="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              stroke-width="4"
                            />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Mengunggah...
                        </span>
                        <span v-else>Simpan</span>
                      </button>
                      <button
                        @click="cancelReplacingFile(detail.id)"
                        :disabled="fileStates[detail.id]?.isUploading"
                        class="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                      >
                        Batal
                      </button>
                    </template>
                  </div>
                </template>

                <!-- TERPAKAI_FINAL / BOOKING / DITOLAK: tampilkan file saja -->
                <div
                  v-else-if="detail.file_name || detail.file_url"
                  @click="openPreview(detail, idx)"
                  class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                >
                  <div class="flex items-start gap-3">
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
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-primary dark:text-blue-400 underline">
                        {{ detail.file_name || 'Dokumen' }}
                      </p>
                      <p class="text-xs text-gray-600 dark:text-gray-400">Klik untuk preview</p>
                    </div>
                  </div>
                </div>

                <!-- Tidak ada file (status selain hangus & terpakai) -->
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
                    <span class="text-xs text-yellow-800 dark:text-yellow-400"
                      >Belum ada file diupload</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div
          class="flex justify-between w-full gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <!-- Footer kosong — aksi sudah di dalam tiap card -->
        </div>
      </template>
    </Modal>
  </Teleport>

  <!-- PREVIEW SLIDEOVER -->
  <USlideover
    v-model:open="isOpenPreview"
    title="Pratinjau Dokumen"
    side="bottom"
    :dismissible="true"
    :ui="{ content: 'h-screen max-h-screen', body: 'p-0' }"
  >
    <template #body>
      <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
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
          <span class="text-gray-500 dark:text-gray-400 text-sm">Gagal memuat dokumen</span>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Search, ArrowUpDown, Plus, Copy } from 'lucide-vue-next'
import AddUsulan from '~/components/AddUsulan.vue'
import Heading from '~/components/Heading.vue'
import PageHeader from '~/components/PageHeader.vue'
import { Modal } from '#components'
import { usePenomoran } from '~/composables/usePenomoran'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ middleware: 'auth' })

const { user, getProfile } = useAuth()
const {
  deleteUsulanUser,
  getListUsulanByPosition,
  getPersonWithPosition,
  submitBooking,
  isLoadingBooking,
  getKlasifikasi,
  updateNomorFile // ✅ untuk ganti file pada status terpakai
} = usePenomoran()

const toast = useToast()

// ─── State ────────────────────────────────────────────────────────
const openDetail = ref(false)
const selectedRow = ref<any>(null)
const rows = ref<any[]>([])
const loading = ref<boolean>(true)

// State "Ganti File" per detail — key: detail.id
// { isReplacing, isUploading, file }
const fileStates = ref<Record<string, any>>({})

const openAdd = ref<boolean>(false)
const isOpenPreview = ref(false)
const pdfUrl = ref<string | null>(null)
const previewSource = ref<'detail' | null>(null)

const personMap = ref(new Map())
const klasifikasiMap = ref(new Map())

const search = ref<string>('')
const currentPage = ref<number>(1)
const rowsPerPage = ref<number>(10)
const rowsChoices = [5, 10, 20, 50]
const sortBy = ref<string>('tglUsulan')
const sortDir = ref<'asc' | 'desc'>('desc')
const filterStatus = ref<string>('Semua')
const openFilterStatus = ref<boolean>(false)

// ─── Helpers ──────────────────────────────────────────────────────
const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    booking: 'Booking',
    terpakai: 'Terpakai',
    terpakai_final: 'Final',
    ditolak: 'Ditolak',
    hangus: 'Hangus'
  }
  return map[status] || status
}

// ─── Fetch Person Map ─────────────────────────────────────────────
const fetchPersonMap = async () => {
  try {
    const response = await getPersonWithPosition()
    const list = Array.isArray(response) ? response : (response.data ?? [])
    list.forEach((item: any) => {
      const positionText = item.position_text || ''
      const subAreaText = item.sub_area_text || ''
      const displayText = subAreaText ? `${positionText} - ${subAreaText}` : positionText
      personMap.value.set(item.persnum, { nama: item.nama, position_text: displayText })
    })
  } catch (error) {
    console.error('❌ Error fetch person map:', error)
  }
}

// ─── Fetch Klasifikasi Map ────────────────────────────────────────
const fetchKlasifikasiMap = async () => {
  try {
    const response = await getKlasifikasi()
    if (Array.isArray(response)) {
      response.forEach((item: any) => {
        klasifikasiMap.value.set(item.code, item.display)
      })
    }
  } catch (error) {
    console.error('❌ Error fetch klasifikasi map:', error)
  }
}

// ─── Map row status for table badge ──────────────────────────────
const mapRowStatus = (details: any[]): string => {
  if (!details?.length) return 'Menunggu Verifikasi'
  // Jika semua detail final → Final
  if (details.every((d: any) => d.status === 'terpakai_final')) return 'Final'
  // Ada yg terpakai_final → Disetujui (sebagian)
  if (details.some((d: any) => d.status === 'terpakai_final')) return 'Disetujui'
  if (details.some((d: any) => d.status === 'terpakai')) return 'Disetujui'
  if (details.some((d: any) => d.status === 'booking')) return 'Menunggu Verifikasi'
  if (details.some((d: any) => d.status === 'ditolak')) return 'Ditolak'
  return 'Menunggu Verifikasi'
}

// ─── Fetch Data ───────────────────────────────────────────────────
const fetchData = async () => {
  loading.value = true
  try {
    const positionId =
      typeof user.value?.position === 'object' ? user.value?.position?.id : user.value?.position

    if (!positionId) {
      rows.value = []
      return
    }

    const data = await getListUsulanByPosition(String(positionId))
    if (!Array.isArray(data)) {
      rows.value = []
      return
    }

    rows.value = data.map((item: any) => {
      const pengusulInfo = personMap.value.get(item.persnum) || {}
      const klasifikasiDisplay = klasifikasiMap.value.get(item.klasifikasi) || item.klasifikasi

      const mappedStatus = mapRowStatus(item.details || [])

      const tanggalDate = new Date(item.tanggal)
      const formattedTanggal = `${String(tanggalDate.getUTCDate()).padStart(2, '0')}/${String(tanggalDate.getUTCMonth() + 1).padStart(2, '0')}/${tanggalDate.getUTCFullYear()}`
      const localCreated = item.created_at.replace('Z', '').replace('+00:00', '')
      const createdDate = new Date(localCreated)

      const wibFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      const parts = wibFormatter.formatToParts(createdDate)
      const getPart = (type: string) => parts.find((p: any) => p.type === type)?.value ?? '00'

      return {
        id: item.id,
        id_usulan: item.id,
        jenis: item.jenis,
        tanggal: formattedTanggal,
        tglUsulan: `${getPart('day')}/${getPart('month')}/${getPart('year')} ${getPart('hour')}:${getPart('minute')}`,
        tglUsulanSort: createdDate.getTime(),
        perihal: item.perihal || '-',
        jumlah: item.jumlah,
        penandatangan: item.penandatangan || '-',
        klasifikasi: item.klasifikasi || '-',
        klasifikasiDisplay,
        pengusul: pengusulInfo.nama || user.value?.nama || '-',
        status: mappedStatus,
        details: item.details || [],
        template_nomor: item.template_nomor || ''
      }
    })
  } catch (err) {
    console.error('❌ Gagal fetch data:', err)
    rows.value = []
  } finally {
    loading.value = false
  }
}

// ─── Open Row Modal ───────────────────────────────────────────────
const openRowModal = async (row: any) => {
  try {
    const klasifikasiDisplay = klasifikasiMap.value.get(row.klasifikasi) || row.klasifikasi
    const normalizedDetails = normalizeDetails(
      row.details || [],
      row.jumlah,
      row.template_nomor || ''
    )
    selectedRow.value = {
      id_usulan: row.id,
      jenis: row.jenis,
      jenis_naskah: row.jenis,
      tanggal: row.tanggal,
      perihal: row.perihal || '-',
      jumlah: row.jumlah,
      penandatangan: row.penandatangan || '-',
      klasifikasi: row.klasifikasi || '-',
      klasifikasiDisplay,
      status: row.status,
      template_nomor: row.template_nomor || '',
      details: normalizedDetails
    }
    fileStates.value = {}
    openDetail.value = true
  } catch (err) {
    console.error('❌ Gagal load detail:', err)
  }
}

// ─── Open Preview ─────────────────────────────────────────────────
const openPreview = (detail: any, idx: number) => {
  const url = detail.file_url || null
  if (!url) {
    toast.add({
      title: 'File tidak tersedia',
      description: 'Tidak ada file untuk ditampilkan',
      color: 'yellow'
    })
    return
  }
  previewSource.value = 'detail'
  pdfUrl.value = url
  openDetail.value = false
  isOpenPreview.value = true
}

watch(isOpenPreview, (isOpen) => {
  if (!isOpen) {
    if (pdfUrl.value && pdfUrl.value.startsWith('blob:')) URL.revokeObjectURL(pdfUrl.value)
    pdfUrl.value = null
    if (previewSource.value === 'detail') {
      openDetail.value = true
      previewSource.value = null
    }
  }
})

// Reset state saat modal ditutup
watch(openDetail, (open) => {
  if (!open) fileStates.value = {}
})

// ─── Ganti File — dua langkah (pilih → Simpan/Batal) ────────────

// Buka mode replace untuk detail tertentu
const startReplacingFile = (detailId: string) => {
  fileStates.value[detailId] = { isReplacing: true, isUploading: false, file: null }
}

// Batal, hapus state
const cancelReplacingFile = (detailId: string) => {
  delete fileStates.value[detailId]
}

// Handle saat file dipilih dari input — hanya simpan ke state, belum upload
const handleFileSelect = (detailId: string, event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: 'File terlalu besar',
      description: 'Ukuran file maksimal 5MB',
      color: 'yellow'
    })
    return
  }
  const validTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  if (!validTypes.includes(file.type)) {
    toast.add({
      title: 'Tipe file tidak valid',
      description: 'Hanya PDF, DOC, atau DOCX yang diperbolehkan',
      color: 'yellow'
    })
    return
  }

  if (fileStates.value[detailId]) {
    fileStates.value[detailId].file = file
  }
}

// Tombol Simpan — baru upload ke API
const saveGantiFile = async (detailId: string) => {
  const state = fileStates.value[detailId]
  if (!state?.file) {
    toast.add({
      title: 'Pilih file',
      description: 'Silakan pilih file terlebih dahulu',
      color: 'yellow'
    })
    return
  }

  state.isUploading = true
  try {
    const result = await updateNomorFile(detailId, state.file)

    // Patch detail dari response API tanpa tutup modal
    if (result && selectedRow.value?.details) {
      const idx = selectedRow.value.details.findIndex((d: any) => d.id === detailId)
      if (idx !== -1) {
        selectedRow.value.details[idx] = {
          ...selectedRow.value.details[idx],
          status: result.status ?? 'terpakai_final',
          file_name: result.file_name ?? selectedRow.value.details[idx].file_name,
          file_text: result.file_text ?? selectedRow.value.details[idx].file_text,
          file_url: result.file_url ?? selectedRow.value.details[idx].file_url
        }
      }
      // Update badge status row jika semua detail sudah final
      const allFinal = selectedRow.value.details.every((d: any) => d.status === 'terpakai_final')
      if (allFinal) selectedRow.value.status = 'Final'
    }

    // Hapus state ganti file setelah berhasil
    delete fileStates.value[detailId]

    // Refresh tabel di background
    await fetchData()
  } catch (e) {
    // error sudah ditangani di composable
  } finally {
    if (fileStates.value[detailId]) {
      fileStates.value[detailId].isUploading = false
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────
const handleCopy = (value: string) => {
  if (!value) return
  navigator.clipboard.writeText(value)
  toast.add({ title: 'Tersalin', description: `"${value}" berhasil disalin.`, color: 'success' })
}

const handlePreview = (data: any) => {
  selectedRow.value = data
  openAdd.value = false
  openDetail.value = true
}

const normalizeDetails = (details: any[], jumlah: number, template: string) => {
  const result = [...(details || [])]
  while (result.length < jumlah) {
    result.push({
      id: `temp-${result.length + 1}`,
      nomor: null,
      status: 'booking',
      file_name: null,
      file_url: null
    })
  }
  return result.slice(0, jumlah)
}

// ─── Handle Submit from Add Modal ────────────────────────────────
const handleSubmitFromModal = async (_payload: any) => {
  // AddUsulan sudah memanggil createUsulanDraft + submitBooking secara internal
  // di sini cukup tutup modal dan refresh tabel
  openAdd.value = false
  currentPage.value = 1
  await fetchData()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const localStr = dateStr.replace('Z', '').replace('+00:00', '')
  return new Date(localStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const dropdownEls = document.querySelectorAll('[data-custom-dropdown]')
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) return
  }
  openFilterStatus.value = false
}

onMounted(async () => {
  loading.value = true
  if (!user.value) await getProfile()
  await fetchKlasifikasiMap()
  await fetchPersonMap()
  await fetchData()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (pdfUrl.value && pdfUrl.value.startsWith('blob:')) URL.revokeObjectURL(pdfUrl.value)
})

// ─── Table config ─────────────────────────────────────────────────
const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Usulan', to: '/usulan-penomoran' }
]

const headers = [
  { label: 'Jenis', key: 'jenis', sortable: true },
  { label: 'Tanggal', key: 'tanggal', sortable: true },
  { label: 'Perihal', key: 'perihal', sortable: false },
  { label: 'Penandatangan', key: 'penandatangan', sortable: false },
  { label: 'Jumlah', key: 'jumlah', sortable: false },
  { label: 'Pengusul', key: 'pengusul', sortable: false },
  { label: 'Tgl Usulan', key: 'tglUsulan', sortable: true }
]

const filterOptions = ['Semua', 'Menunggu Verifikasi', 'Disetujui', 'Final', 'Ditolak']

const statusOrder: Record<string, number> = {
  'Menunggu Verifikasi': 1,
  Disetujui: 2,
  Final: 3,
  Ditolak: 4
}

const sortStatus = () => {
  if (sortBy.value === 'status') {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = 'status'
    sortDir.value = 'asc'
  }
}

const sort = (col: string) => {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = col
    sortDir.value = 'asc'
  }
}

const selectFilterStatus = (val: string) => {
  filterStatus.value = val
  openFilterStatus.value = false
}

const filteredRows = computed(() => {
  const s = search.value.toLowerCase()
  const fs = filterStatus.value
  return rows.value.filter((r: any) => {
    const matchSearch = Object.values(r).some((v) =>
      String(v ?? '')
        .toLowerCase()
        .includes(s)
    )
    const matchStatus = fs === 'Semua' || r.status === fs
    return matchSearch && matchStatus
  })
})

const sortedRows = computed(() => {
  return [...filteredRows.value].sort((a: any, b: any) => {
    if (sortBy.value === 'status') {
      const A = statusOrder[a.status] ?? 99
      const B = statusOrder[b.status] ?? 99
      return sortDir.value === 'asc' ? A - B : B - A
    }
    if (sortBy.value === 'tglUsulan') {
      const A = a.tglUsulanSort ?? 0
      const B = b.tglUsulanSort ?? 0
      return sortDir.value === 'asc' ? A - B : B - A
    }
    const A = String(a[sortBy.value] ?? '').toLowerCase()
    const B = String(b[sortBy.value] ?? '').toLowerCase()
    if (A < B) return sortDir.value === 'asc' ? -1 : 1
    if (A > B) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return sortedRows.value.slice(start, start + rowsPerPage.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedRows.value.length / rowsPerPage.value))
)

const paginationPages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: number[] = []
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 2) pages.push(1, 2, 3, 4, 5)
    else if (current >= total - 1) pages.push(total - 2, total - 1, total)
    else pages.push(current - 1, current, current + 1)
  }
  return pages
})

watch([search, rowsPerPage, sortBy, sortDir, filterStatus], () => {
  currentPage.value = 1
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
</style>
