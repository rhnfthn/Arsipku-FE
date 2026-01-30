<template>
  <div class="space-y-6 min-h-screen dark:bg-gray-900">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Verifikasi Dokumen Digsig
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        @click="openAddModal"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm w-full">
      <!-- TOP ACTION BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 pl-4 mb-4 pt-5 pr-4"
      >
        <!-- STATUS FILTER -->
        <div class="relative">
          <button
            data-custom-dropdown
            class="flex items-center justify-between gap-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 text-sm px-4 py-2 rounded-lg transition"
            @click.stop="openFilterStatus = !openFilterStatus"
          >
            <span>{{ filterStatusLabel }}</span>
            <ChevronDown
              :class="[
                'w-4 h-4 transition-transform duration-200',
                openFilterStatus ? 'rotate-180' : '',
              ]"
            />
          </button>

          <div
            v-if="openFilterStatus"
            data-custom-dropdown
            class="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-700 dark:hover:text-gray-700 border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            <button
              v-for="item in filterOptions"
              :key="item.value"
              class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition"
              @click.prevent="selectFilterStatus(item)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- SEARCH -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            @input="handleSearch"
            placeholder="Cari Dokumen"
            class="w-full bg-gray-50 border dark:bg-gray-700 border-gray-200 dark:border-gray-400 text-sm pl-9 pr-3 py-2 rounded-lg"
          />
        </div>
      </div>

      <!-- LOADING (SHIMMER) -->
      <div v-if="loading" class="space-y-3 p-4">
        <div
          v-for="i in 5"
          :key="i"
          class="w-full h-10 bg-gray-200 animate-pulse rounded-md"
        ></div>
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="documents.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-500"
      >
        <p class="text-sm font-medium">Data tidak ditemukan</p>
      </div>

      <!-- TABLE -->
      <div v-else class="overflow-x-auto">
        <table class="w-full bg-white dark:bg-gray-800 text-sm">
          <thead class="bg-primary dark:bg-primary text-white text-sm">
            <tr>
              <th @click="handleSort('tanggalDokumen')" class="cursor-pointer">
                <div class="flex items-center gap-2 ml-5">
                  <span>Tanggal Dibuat</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortKey === 'tanggalDokumen'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>

              <th @click="handleSort('nomorDokumen')" class="cursor-pointer">
                <div class="flex items-center gap-2">
                  <span>No Dokumen</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortKey === 'nomorDokumen'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>

              <th @click="handleSort('perihal')" class="cursor-pointer">
                <div class="flex items-center gap-2 dark:text-white">
                  <span>Perihal</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortKey === 'perihal'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>
              <th class="px-4 py-3 text-center">Penandatangan</th>
              <th class="px-4 py-3 text-center">Dokumen</th>
              <th @click="handleSort('status')" class="cursor-pointer">
                <div class="flex items-center gap-2">
                  <span>Status</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortKey === 'status'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>

              <th class="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="doc in paginatedRows"
              :key="doc.id"
              class="border-b border-gray-100 dark:border-gray-400 hover:bg-primary-50 dark:hover:bg-gray-700"
            >
              <td class="p-4">{{ formatDate(doc.tanggalDokumen) }}</td>
              <td class="p-4">
                <div class="font-medium">{{ doc.nomorDokumen }}</div>
              </td>
              <td class="p-4">
                <div
                  class="text-gray-700 dark:text-white text-sm dark:hover:text-gray-700"
                >
                  {{ doc.perihal }}
                </div>
              </td>
              <td class="p-4 text-center">{{ doc.totalSigners }}</td>
              <td class="p-4 text-center">
                <button
                  @click="viewDocument(doc)"
                  class="flex items-center gap-2 mx-auto bg-blue-200 text-primary-600 px-3 py-1 text-xs font-medium rounded-lg hover:bg-primary-200"
                >
                  <FileCheck class="w-4 h-4" />
                  Lihat
                </button>
              </td>
              <td class="p-4 text-center">
                <span
                  class="px-3 py-1 rounded-lg text-center text-xs font-medium"
                  :class="getStatusClass(doc.status)"
                >
                  {{ getStatusLabel(doc.status) }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex items-center justify-center gap-4">
                  <Eye
                    class="w-4 h-4 text-gray-600 cursor-pointer hover:text-primary dark:text-white"
                    @click="openDetailModal(doc.id)"
                  />
                  <Pencil
                    class="w-4 h-4 text-yellow-500 cursor-pointer hover:text-yellow-700"
                    @click="openEditModal(doc.id)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="filteredRows.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200"
      >
        <div class="text-xs text-gray-600 dark:text-white">
          Menampilkan {{ paginatedRows.length }} dari
          {{ filteredRows.length }} data
        </div>

        <div class="flex items-center gap-2">
          <!-- Back Button -->
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-primary border border-primary hover:bg-primary-50',
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
              @click="currentPage = 1"
              class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary transition-all"
            >
              1
            </button>

            <!-- Left ellipsis -->
            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 text-sm"
            >
              ...
            </span>

            <!-- Visible pages -->
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary',
              ]"
            >
              {{ page }}
            </button>

            <!-- Right ellipsis -->
            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 text-sm"
            >
              ...
            </span>

            <!-- Last page -->
            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <!-- Next Button -->
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-primary border border-primary hover:bg-primary-50',
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

    <!-- MODAL ADD/EDIT DOKUMEN -->
    <Teleport to="body">
      <Modal v-model="openAdd" :hideDefaultFooter="true" size="xl">
        <template #title>
          <div class="mt-5 ml-5 mb-3">
            <Heading variant="heading9b" class="font-semibold text-sm">
              {{ isEditMode ? "Edit Dokumen" : "Tambah Dokumen" }}
            </Heading>
          </div>
        </template>

        <div class="px-6 mt-1 max-h-[calc(100vh-180px)] overflow-y-auto">
          <!-- FORM FIELDS -->
          <div class="space-y-4">
            <div>
              <Heading variant="body2m">
                Tanggal Dokumen <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="addForm.tanggal"
                type="date"
                class="w-full border border-gray-300 dark:bg-gray-900 dark:border-gray-500 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
              />
            </div>

            <div>
              <Heading variant="body2m">
                Klasifikasi <span class="text-red-500">*</span>
              </Heading>
              <div class="relative mt-2">
                <select
                  v-model="addForm.klasifikasi"
                  @change="onKlasifikasiChange"
                  :disabled="loadingKlasifikasi"
                  class="w-full border border-gray-300 dark:bg-gray-900 dark:border-gray-500 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="">
                    {{
                      loadingKlasifikasi ? "Loading..." : "Pilih Klasifikasi"
                    }}
                  </option>
                  <option
                    v-for="k in klasifikasiList"
                    :key="k.id"
                    :value="k.klasifikasi"
                  >
                    {{ k.klasifikasi }} - {{ k.klasifikasi_text }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <Heading variant="body2m">
                Jenis Naskah <span class="text-red-500">*</span>
              </Heading>
              <select
                v-model="addForm.jenisNaskah"
                :disabled="loadingJenisNaskah"
                class="w-full border border-gray-300 dark:bg-gray-900 dark:border-gray-500 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
              >
                <option value="">
                  {{ loadingJenisNaskah ? "Loading..." : "Pilih Jenis Naskah" }}
                </option>
                <option
                  v-for="j in jenisNaskahList"
                  :key="j.id"
                  :value="j.jenis"
                >
                  {{ j.jenis }} - {{ j.jenis_text }}
                </option>
              </select>
            </div>

            <div>
              <Heading variant="body2m">
                Nomor Dokumen <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="addForm.nomorDokumen"
                placeholder="Masukkan Nomor Dokumen"
                class="w-full border border-gray-300 dark:bg-gray-900 dark:border-gray-500 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
              />
            </div>

            <div>
              <Heading variant="body2m">
                Perihal <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="addForm.perihal"
                placeholder="Masukkan Perihal Dokumen"
                class="w-full border border-gray-300 dark:bg-gray-900 dark:border-gray-500 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
              />
            </div>

            <!-- File Attachment - Compact -->
            <div>
              <Heading variant="body2m" class="mb-2">
                File Attachment <span class="text-red-500">*</span>
              </Heading>
              <div class="flex items-center gap-3">
                <button
                  @click="triggerFileUpload"
                  class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-300 dark:bg-gray-900 dark:border-gray-500 dark:text-white rounded-md text-sm font-medium transition flex items-center gap-2"
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Pilih File
                </button>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  class="hidden"
                  @change="handleFileUpload"
                />
                <div class="flex items-center gap-2 flex-1">
                  <p
                    v-if="addForm.fileName"
                    class="text-sm text-blue-600 flex items-center gap-2"
                  >
                    <FileCheck class="w-4 h-4" />
                    {{ addForm.fileName }}
                  </p>
                  <p v-else class="text-xs text-gray-400">
                    PDF, DOC, DOCX (Max. 10MB)
                  </p>
                  <button
                    v-if="previewUrl || (isEditMode && !addForm.file)"
                    @click="previewFileInModal"
                    class="ml-auto px-3 py-1 bg-blue-50 text-primary text-xs font-medium rounded-md hover:bg-blue-100 transition flex items-center gap-1"
                  >
                    <Eye class="w-3 h-3" />
                    Preview
                  </button>
                </div>
              </div>
            </div>

            <!-- Visible Sign -->
            <div class="flex items-center justify-between mt-1 mb-2">
              <div>
                <Heading variant="body2m">Visible Sign</Heading>
                <p class="text-xs text-red-500 mt-1">
                  *Visible Sign hanya berlaku pada penanda tangan terakhir
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="addForm.visibleSign"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                ></div>
              </label>
            </div>

            <!-- Penanda Tangan -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <Heading variant="body2m">
                  Penanda Tangan <span class="text-red-500">*</span>
                </Heading>
              </div>

              <!-- Selected Signers Display -->
              <div
                v-if="addForm.selectedSigners.length > 0"
                class="mb-4 space-y-2"
              >
                <div
                  v-for="(signer, index) in addForm.selectedSigners"
                  :key="index"
                  class="flex items-center justify-between dark:border-gray-500 dark:bg-gray-800 dark:hover:bg-gray-600 dark:text-blue-50 bg-gray-50 border border-gray-200 dark:text-gray-700 rounded-lg p-3"
                >
                  <div class="flex-1">
                    <p class="font-medium text-sm dark:text-white">
                      {{ index + 1 }}. {{ signer.jabatan }} -
                      {{ signer.lokasi }} -
                      {{ signer.nama }}
                    </p>
                  </div>
                  <button
                    type="button"
                    @click="removeSelectedSigner(index)"
                    class="text-red-600 hover:text-red-800 ml-2"
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

              <!-- Dropdown with Search -->
              <div class="relative" ref="dropdownRef">
                <div
                  @click="toggleSignerDropdown"
                  class="w-full border border-gray-300 dark:border-gray-500 dark:bg-gray-900 dark:border-gray-500 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm cursor-pointer bg-white dark:bg-gray-700 flex items-center justify-between"
                >
                  <span class="text-gray-500">Pilih Jabatan</span>
                  <svg
                    class="w-4 h-4 text-gray-400 transition-transform"
                    :class="{ 'rotate-180': showSignerDropdown }"
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

                <!-- Dropdown Menu -->
                <div
                  v-if="showSignerDropdown"
                  class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden"
                >
                  <!-- Search Input -->
                  <div
                    class="p-2 border-b border-gray-200 dark:border-gray-500 dark:bg-gray-800 dark:hover:bg-gray-600 dark:text-blue-50 sticky top-0 bg-white"
                  >
                    <div class="relative">
                      <Search
                        class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        v-model="signerSearchQuery"
                        type="text"
                        placeholder="Cari jabatan, nama, atau lokasi..."
                        class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        @click.stop
                      />
                    </div>
                  </div>

                  <!-- Options List -->
                  <div class="overflow-y-auto max-h-64">
                    <div
                      v-for="v in filteredVerifikatorList"
                      :key="v.persnum"
                      @click="selectSigner(v)"
                      class="px-3 py-3 hover:bg-blue-50 dark:border-gray-500 dark:bg-gray-800 dark:hover:bg-gray-600 dark:text-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                      :class="{
                        'bg-blue-50 ':
                          addForm.selectedSigners.findIndex(
                            (s) => s.persnum === v.persnum,
                          ) !== -1,
                      }"
                    >
                      <p class="font-medium">
                        {{ v.jabatan }} - {{ v.nama }} - {{ v.lokasi }}
                      </p>
                    </div>

                    <div
                      v-if="filteredVerifikatorList.length === 0"
                      class="px-3 py-4 text-center text-gray-500 text-sm"
                    >
                      Tidak ada data ditemukan
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div
          class="flex justify-between gap-3 px-6 py-4 border-t border-gray-200"
        >
          <button
            @click="closeModal"
            class="flex-1 px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            Batal
          </button>
          <button
            @click="saveDokumen"
            :disabled="loading"
            class="flex-1 px-6 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-700 transition disabled:opacity-50"
          >
            {{ loading ? "Menyimpan..." : "Simpan Perubahan" }}
          </button>
        </div>
      </Modal>
    </Teleport>

    <!-- MODAL DETAIL -->
    <Teleport to="body">
      <Modal v-model="openDetail" :hideDefaultFooter="true" size="xl">
        <template #title>
          <Heading
            variant="heading9b"
            class="font-semibold text-sm mb-3 mt-5 ml-5"
          >
            Detail Dokumen
          </Heading>
        </template>

        <div class="px-3 max-h-[calc(100vh-150px)] overflow-y-auto">
          <div v-if="loadingDetail" class="text-center py-8">
            <p class="text-gray-500">Loading...</p>
          </div>

          <div
            v-else-if="documentDetail"
            class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-2"
          >
            <div>
              <p class="text-gray-600 mb-1 dark:text-white">No Dokumen</p>
              <p class="font-medium">{{ documentDetail.nomorDokumen }}</p>
            </div>

            <div>
              <p class="text-gray-600 mb-1 dark:text-white">Tanggal</p>
              <p class="font-medium">
                {{ formatDate(documentDetail.tanggalDokumen) }}
              </p>
            </div>

            <div>
              <p class="text-gray-600 mb-1 dark:text-white">Jenis Naskah</p>
              <p class="font-medium">{{ documentDetail.jenisNaskah }}</p>
            </div>

            <div>
              <p class="text-gray-600 mb-1 dark:text-white">Klasifikasi</p>
              <p class="font-medium">
                {{
                  documentDetail.klasifikasiText ||
                  (documentDetail.klasifikasi
                    ? `${documentDetail.klasifikasi}`
                    : "-")
                }}
              </p>
            </div>

            <div>
              <p class="text-gray-600 mb-1 dark:text-white">Perihal</p>
              <p class="font-medium">{{ documentDetail.perihal }}</p>
            </div>

            <div>
              <p class="text-gray-600 mb-1 dark:text-white">Status</p>
              <span
                class="px-3 py-1 rounded-lg text-xs font-medium inline-block"
                :class="getStatusClass(documentDetail.status)"
              >
                {{ getStatusLabel(documentDetail.status) }}
              </span>
            </div>

            <div class="md:col-span-2">
              <p class="text-gray-600 mb-2 dark:text-white">Dokumen</p>
              <button
                @click="viewDocumentFromDetail"
                class="flex items-center gap-2 bg-blue-50 text-primary px-4 py-2 text-sm font-medium rounded-lg hover:bg-blue-100 transition"
              >
                <FileCheck class="w-4 h-4" />
                Lihat Preview Dokumen
              </button>
            </div>
          </div>

          <!-- TABLE SIGNERS -->
          <div
            v-if="
              documentDetail &&
              documentDetail.signers &&
              documentDetail.signers.length > 0
            "
            class="mt-6 mb-5 border border-gray-200 dark:border-gray-400 dark:text-white rounded-xl overflow-hidden"
          >
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead
                  class="bg-primary border-b border-gray-200 dark:border-gray-400"
                >
                  <tr>
                    <th class="p-3 text-left text-white font-semibold">NO</th>
                    <th class="p-3 text-left font-semibold text-white">
                      E-NIK
                    </th>
                    <th class="p-3 text-left font-semibold text-white">
                      NAMA / JABATAN
                    </th>
                    <th class="p-3 text-center font-semibold text-white">
                      STATUS
                    </th>
                    <th class="p-3 text-center font-semibold text-white">
                      KETERANGAN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(s, i) in documentDetail.signers"
                    :key="i"
                    class="border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td class="p-3">
                      <span
                        class="inline-flex items-center justify-center text-xs font-semibold dark:text-white"
                      >
                        {{ s.urutan }}
                      </span>
                    </td>
                    <td class="p-3 font-mono text-gray-700 dark:text-white">
                      {{ s.persnum || "-" }}
                    </td>
                    <td class="p-3">
                      <div class="font-semibold text-gray-900 dark:text-white">
                        {{ s.nama || "-" }}
                      </div>
                      <div class="text-xs text-gray-500 mt-1 dark:text-white">
                        {{ s.jabatan || "-" }}
                      </div>
                    </td>
                    <td class="p-3 text-center">
                      <span
                        class="px-3 py-1 rounded-lg text-xs font-semibold"
                        :class="getSignerStatusClass(s.status)"
                      >
                        {{ getSignerStatusLabel(s.status) }}
                      </span>
                    </td>
                    <td class="p-3 font-mono text-center text-gray-700">
                      {{ s.keterangan || "-" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="
              documentDetail &&
              (!documentDetail.signers || documentDetail.signers.length === 0)
            "
            class="mt-6 mb-5 border border-gray-200 rounded-xl p-8 text-center"
          >
            <p class="text-gray-500 text-sm">
              Belum ada penandatangan yang ditambahkan
            </p>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- DOCUMENT VIEWER SLIDEOVER -->
    <USlideover
      v-model:open="isOpenPreview"
      title="Pratinjau Dokumen"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";

import {
  Plus,
  Search,
  Pencil,
  FileCheck,
  Eye,
  ChevronDown,
  ArrowUpDown,
} from "lucide-vue-next";

import { useDigsig } from "~/composables/useDigsig";
import type { Verifikator } from "~/types/digsig";

const toast = useToast();

const {
  documents,
  documentDetail,
  meta,
  loading,
  loadingDetail,
  klasifikasiList,
  klasifikasiDetail,
  jenisNaskahList,
  verifikatorList,
  loadingKlasifikasi,
  loadingJenisNaskah,
  loadingVerifikator,
  fetchDocuments,
  fetchDocumentDetail,
  createDocument,
  updateDocument,
  fetchKlasifikasi,
  fetchKlasifikasiDetail,
  fetchJenisNaskah,
  fetchVerifikator,
} = useDigsig();

const isOpenPreview = ref(false);
const pdfUrl = ref<string | null>(null);
const previewUrl = ref<string | null>(null);

const openDetail = ref(false);
const openAdd = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

const selectedKlasifikasiDetail = ref<any>(null);

// Filter + Search
const statusFilter = ref("");
const openFilterStatus = ref(false);
const sortKey = ref("");
const sortOrder = ref("asc");

function handleSort(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
}

const search = ref("");
const currentPage = ref(1);
const limit = ref(10);
const rowsPerPage = ref(10);

const addForm = ref({
  tanggal: "",
  klasifikasi: "",
  jenisNaskah: "",
  nomorDokumen: "",
  perihal: "",
  fileName: "",
  file: null as File | null,
  visibleSign: false,
  signers: [] as { urutan: number; persnum: number }[],
  selectedSigners: [] as Verifikator[],
});

const showSignerDropdown = ref(false);
const signerSearchQuery = ref("");

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "verifikasi-dokumen", to: "/admin/digsig/verifikasi-dokumen" },
];

const filterOptions = [
  { label: "Semua", value: "" },
  { label: "Draft", value: "draft" },
  { label: "On Progress", value: "on_progress" },
  { label: "Selesai", value: "completed" },
  { label: "Ditolak", value: "rejected" },
];

const filterStatusLabel = computed(() => {
  const found = filterOptions.find((opt) => opt.value === statusFilter.value);
  return found?.label || "Semua Status";
});

const filteredRows = computed(() => {
  const s = search.value.toLowerCase();
  const fs = statusFilter.value;

  return documents.value.filter((r) => {
    if (!r) return false;

    const matchSearch =
      r.nomorDokumen?.toLowerCase().includes(s) ||
      r.perihal?.toLowerCase().includes(s);

    const matchStatus = !fs || r.status === fs;
    return matchSearch && matchStatus;
  });
});

const sortedRows = computed(() => {
  if (!sortKey.value) return filteredRows.value;

  return [...filteredRows.value].sort((a, b) => {
    let A = a[sortKey.value];
    let B = b[sortKey.value];

    if (sortKey.value.toLowerCase().includes("tanggal")) {
      A = new Date(A).getTime();
      B = new Date(B).getTime();
      return sortOrder.value === "asc" ? A - B : B - A;
    }

    A = String(A ?? "").toLowerCase();
    B = String(B ?? "").toLowerCase();

    if (A < B) return sortOrder.value === "asc" ? -1 : 1;
    if (A > B) return sortOrder.value === "asc" ? 1 : -1;
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
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 2) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(current - 1, current, current + 1);
    }
  }

  return pages;
});

onMounted(() => {
  loadDocuments();
  fetchKlasifikasi();
  fetchJenisNaskah();
  fetchVerifikator();
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("click", handleDropdownClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("click", handleDropdownClickOutside);
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
});

const filteredVerifikatorList = computed(() => {
  if (!signerSearchQuery.value) return verifikatorList.value;

  const q = signerSearchQuery.value.toLowerCase();

  return verifikatorList.value.filter(
    (v) =>
      v.jabatan?.toLowerCase().includes(q) ||
      v.nama?.toLowerCase().includes(q) ||
      v.lokasi?.toLowerCase().includes(q),
  );
});

const loadDocuments = async () => {
  try {
    await fetchDocuments({
      page: currentPage.value,
      limit: limit.value,
      search: search.value,
      status: statusFilter.value,
      sortBy: sortKey.value,
      sortOrder: sortOrder.value,
    });
  } catch (err: any) {
    toast.add({
      title: "Gagal",
      description: err.message || "Gagal memuat dokumen",
      color: "red",
    });
  }
};

watch(search, () => {
  loadDocuments();
});

const handleSearch = () => {
  currentPage.value = 1;
};

const selectFilterStatus = (item) => {
  statusFilter.value = item.value;
  openFilterStatus.value = false;
  currentPage.value = 1;
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest("[data-custom-dropdown]")) {
    openFilterStatus.value = false;
  }
};

const handleDropdownClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showSignerDropdown.value = false;
  }
};

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
};

const getStatusClass = (status: string) => {
  const statusMap = {
    draft: "bg-gray-100 text-gray-600",
    on_progress: "bg-blue-100 text-blue-600",
    completed: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
  };
  return statusMap[status] || "bg-gray-100 text-gray-600";
};

const getStatusLabel = (status: string) => {
  const statusMap = {
    on_progress: "On Progress",
    completed: "Selesai",
    rejected: "Ditolak",
    draft: "Draft",
  };
  return statusMap[status] || status;
};

const getSignerStatusClass = (status: string) => {
  const statusMap = {
    waiting: "bg-yellow-100 text-yellow-600",
    pending: "bg-blue-100 text-blue-600",
    signed: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
  };
  return statusMap[status] || "bg-gray-100 text-gray-600";
};

const getSignerStatusLabel = (status: string) => {
  const statusMap = {
    waiting: "Waiting",
    pending: "Pending",
    signed: "Sudah TTD",
    rejected: "Ditolak",
  };
  return statusMap[status] || status;
};

const getKlasifikasiText = (kode: string, text: string | null) => {
  if (text) return text;

  const klasifikasi = klasifikasiList.value.find((k) => k.klasifikasi === kode);
  if (klasifikasi) {
    return `${klasifikasi.klasifikasi} - ${klasifikasi.klasifikasi_text}`;
  }

  return kode || "-";
};

const onKlasifikasiChange = async () => {
  if (addForm.value.klasifikasi) {
    const selected = klasifikasiList.value.find(
      (k) => k.klasifikasi === addForm.value.klasifikasi,
    );
    if (selected) {
      try {
        const detail = await fetchKlasifikasiDetail(selected.id);
        selectedKlasifikasiDetail.value = detail;
      } catch (err: any) {
        toast.add({
          title: "Gagal",
          description: err.message || "Gagal memuat detail klasifikasi",
          color: "red",
        });
      }
    }
  } else {
    selectedKlasifikasiDetail.value = null;
  }
};

const toggleSignerDropdown = () => {
  showSignerDropdown.value = !showSignerDropdown.value;
  if (showSignerDropdown.value) {
    signerSearchQuery.value = "";
  }
};

const selectSigner = (verifikator: Verifikator) => {
  const exists = addForm.value.selectedSigners.findIndex(
    (s) => s.persnum === verifikator.persnum,
  );

  if (exists === -1) {
    addForm.value.selectedSigners.push(verifikator);
    toast.add({
      title: "Berhasil",
      description: `${verifikator.nama} ditambahkan sebagai penandatangan`,
      color: "green",
    });
  }

  showSignerDropdown.value = false;
  signerSearchQuery.value = "";
};

const removeSelectedSigner = (index: number) => {
  const signer = addForm.value.selectedSigners[index];
  addForm.value.selectedSigners.splice(index, 1);
  toast.add({
    title: "Info",
    description: `${signer.nama} dihapus dari daftar penandatangan`,
    color: "blue",
  });
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.add({
        title: "Gagal",
        description: "Ukuran file maksimal 10MB",
        color: "red",
      });
      return;
    }

    addForm.value.fileName = file.name;
    addForm.value.file = file;

    // Create preview URL
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = URL.createObjectURL(file);

    toast.add({
      title: "Berhasil",
      description: `File "${file.name}" berhasil dipilih`,
      color: "green",
    });
  }
};

const openAddModal = () => {
  isEditMode.value = false;
  editingId.value = null;
  resetForm();
  openAdd.value = true;
};

const openEditModal = async (id: string) => {
  isEditMode.value = true;
  editingId.value = id;

  try {
    const doc = await fetchDocumentDetail(id);
    if (doc) {
      const mappedSigners: Verifikator[] = [];

      if (doc.signers && doc.signers.length > 0) {
        for (const s of doc.signers) {
          const verifikator = verifikatorList.value.find(
            (v) => v.persnum === Number(s.persnum),
          );

          if (verifikator) {
            mappedSigners.push(verifikator);
          } else {
            mappedSigners.push({
              positionId: Number(s.positionId) || 0,
              persnum: Number(s.persnum) || 0,
              nama: s.nama || "",
              jabatan: s.jabatan || "",
              lokasi: s.lokasi || "",
              areaText: "",
              companyText: "",
            });
          }
        }
      }

      addForm.value = {
        tanggal: doc.tanggalDokumen.split("T")[0],
        klasifikasi: doc.klasifikasi,
        jenisNaskah: doc.jenisNaskah,
        nomorDokumen: doc.nomorDokumen,
        perihal: doc.perihal,
        fileName: doc.fileName || "",
        file: null,
        visibleSign: Boolean(doc.visibleSign),
        signers: [],
        selectedSigners: mappedSigners,
      };

      // Load klasifikasi detail
      if (doc.klasifikasi) {
        const selected = klasifikasiList.value.find(
          (k) => k.klasifikasi === doc.klasifikasi,
        );
        if (selected) {
          const detail = await fetchKlasifikasiDetail(selected.id);
          selectedKlasifikasiDetail.value = detail;
        }
      }

      openAdd.value = true;
    }
  } catch (err: any) {
    toast.add({
      title: "Gagal",
      description: err.message || "Gagal memuat data dokumen",
      color: "red",
    });
  }
};

const openDetailModal = async (id: string) => {
  loadingDetail.value = true;

  try {
    // Ensure klasifikasi list is loaded
    if (klasifikasiList.value.length === 0) {
      await fetchKlasifikasi();
    }

    const res = await fetchDocumentDetail(id);
    if (res) {
      // Load klasifikasi detail if klasifikasiText is null
      if (!res.klasifikasiText && res.klasifikasi) {
        const klasifikasi = klasifikasiList.value.find(
          (k) => k.klasifikasi === res.klasifikasi,
        );

        if (klasifikasi) {
          if (documentDetail.value) {
            documentDetail.value.klasifikasiText = `${klasifikasi.klasifikasi} - ${klasifikasi.klasifikasi_text}`;
          }
        } else {
          if (documentDetail.value) {
            documentDetail.value.klasifikasiText = res.klasifikasi;
          }
        }
      }
      openDetail.value = true;
    } else {
      toast.add({
        title: "Gagal",
        description: "Gagal memuat detail dokumen",
        color: "red",
      });
    }
  } catch (err: any) {
    toast.add({
      title: "Gagal",
      description: err.message || "Gagal memuat detail dokumen",
      color: "red",
    });
  }
};

const viewDocumentFromDetail = async () => {
  if (!documentDetail.value) return;

  const url =
    documentDetail.value.signedFilePreviewUrl ||
    documentDetail.value.filePreviewUrl;

  if (!url) {
    toast.add({
      title: "Gagal",
      description: "File pratinjau tidak tersedia",
      color: "red",
    });
    return;
  }

  isOpenPreview.value = false;
  pdfUrl.value = null;

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
  } catch (err) {
    toast.add({
      title: "Gagal",
      description: "Gagal memuat pratinjau dokumen",
      color: "red",
    });
  }
};

const closeModal = () => {
  openAdd.value = false;
  resetForm();
};

const resetForm = () => {
  addForm.value = {
    tanggal: "",
    klasifikasi: "",
    jenisNaskah: "",
    nomorDokumen: "",
    perihal: "",
    fileName: "",
    file: null,
    visibleSign: false,
    signers: [],
    selectedSigners: [],
  };
  selectedKlasifikasiDetail.value = null;
  showSignerDropdown.value = false;
  signerSearchQuery.value = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
};

const viewDocument = async (doc: any) => {
  const url = doc.signedFilePreviewUrl || doc.filePreviewUrl;

  if (!url) {
    toast.add({
      title: "Gagal",
      description: "File pratinjau tidak tersedia",
      color: "red",
    });
    return;
  }

  isOpenPreview.value = false;
  pdfUrl.value = null;

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
  } catch (err) {
    toast.add({
      title: "Gagal",
      description: "Gagal memuat pratinjau dokumen",
      color: "red",
    });
  }
};

const previewFileInModal = async () => {
  if (previewUrl.value) {
    pdfUrl.value = previewUrl.value;
    isOpenPreview.value = true;
  } else if (isEditMode.value && documentDetail.value) {
    await viewDocumentFromDetail();
  }
};

const saveDokumen = async () => {
  // Validation
  if (!addForm.value.tanggal) {
    toast.add({
      title: "Gagal",
      description: "Tanggal Dokumen harus diisi",
      color: "red",
    });
    return;
  }
  if (!addForm.value.klasifikasi) {
    toast.add({
      title: "Gagal",
      description: "Klasifikasi harus dipilih",
      color: "red",
    });
    return;
  }
  if (!addForm.value.jenisNaskah) {
    toast.add({
      title: "Gagal",
      description: "Jenis Naskah harus dipilih",
      color: "red",
    });
    return;
  }
  if (!addForm.value.nomorDokumen) {
    toast.add({
      title: "Gagal",
      description: "Nomor Dokumen harus diisi",
      color: "red",
    });
    return;
  }
  if (!addForm.value.perihal) {
    toast.add({
      title: "Gagal",
      description: "Perihal harus diisi",
      color: "red",
    });
    return;
  }
  if (!isEditMode.value && !addForm.value.file) {
    toast.add({
      title: "Gagal",
      description: "File Attachment harus diupload",
      color: "red",
    });
    return;
  }
  if (addForm.value.selectedSigners.length === 0) {
    toast.add({
      title: "Gagal",
      description: "Mohon pilih minimal satu penandatangan",
      color: "red",
    });
    return;
  }

  try {
    const signersPayload = addForm.value.selectedSigners.map((s, idx) => ({
      urutan: idx + 1,
      persnum: s.persnum,
    }));

    if (isEditMode.value && editingId.value) {
      const payload: any = {
        tanggalDokumen: addForm.value.tanggal,
        klasifikasi: addForm.value.klasifikasi,
        jenisNaskah: addForm.value.jenisNaskah,
        nomorDokumen: addForm.value.nomorDokumen,
        perihal: addForm.value.perihal,
        visibleSign: addForm.value.visibleSign,
        signers: signersPayload,
      };

      if (addForm.value.file) {
        payload.file = addForm.value.file;
      }

      await updateDocument(editingId.value, payload);

      toast.add({
        title: "Berhasil",
        description: "Dokumen berhasil diperbarui",
        color: "green",
      });
    } else {
      if (!addForm.value.file) {
        toast.add({
          title: "Gagal",
          description: "File harus diupload untuk dokumen baru",
          color: "red",
        });
        return;
      }

      const payload = {
        tanggalDokumen: addForm.value.tanggal,
        klasifikasi: addForm.value.klasifikasi,
        jenisNaskah: addForm.value.jenisNaskah,
        nomorDokumen: addForm.value.nomorDokumen,
        perihal: addForm.value.perihal,
        file: addForm.value.file,
        visibleSign: addForm.value.visibleSign,
        signers: signersPayload,
      };

      await createDocument(payload);

      toast.add({
        title: "Berhasil",
        description: "Dokumen berhasil dibuat",
        color: "green",
      });
    }

    closeModal();
    await loadDocuments();
  } catch (err: any) {
    console.error("❌ Save error:", err);

    const errorMsg =
      err.response?.data?.message || err.message || "Gagal menyimpan dokumen";

    toast.add({
      title: "Gagal",
      description: errorMsg,
      color: "red",
    });
  }
};

watch(isOpenPreview, (open) => {
  if (!open && pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = null;
  }
});
</script>
