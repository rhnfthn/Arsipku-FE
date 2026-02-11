<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5"
    >
      <div>
        <PageHeader title="Jenis" :items="items" />
      </div>

      <button
        @click="openAddModal"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-6 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-xs transition-colors"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <!-- Card Table -->
    <div
      class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Toolbar -->
      <div class="flex flex-wrap gap-4 items-center p-3 justify-between">
        <div class="flex items-center gap-3">
          <button
            @click="fetchJenis()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            title="Refresh"
          >
            <RotateCcw class="w-4 h-4" />
          </button>

          <!-- Rows per page -->
          <select
            v-model="perPage"
            class="border text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md px-2 py-1"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
          </select>

          <!-- Search -->
          <div class="relative flex-1 w-full md:w-200">
            <Search
              class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="search"
              type="text"
              placeholder="Cari kode / nama / format..."
              class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs pl-9 pr-3 py-1.5 rounded-lg dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <button
          class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-6 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors"
          @click="onExport"
        >
          <FileDown class="w-4 h-4" />
          Export
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse text-sm">
          <thead
            class="text-left bg-primary-400 dark:bg-primary-700 text-white"
          >
            <tr>
              <th
                @click="sortBy('jenis')"
                class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700 font-semibold whitespace-nowrap cursor-pointer select-none hover:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
              >
                <div class="flex items-center gap-2">
                  <span>Kode Jenis</span>
                  <span class="w-4 h-4 inline-flex items-center justify-center">
                    <ArrowUpDown
                      v-if="sortColumn !== 'jenis'"
                      class="w-3 h-3 opacity-70"
                    />
                    <ChevronUp
                      v-else-if="sortDirection === 'asc'"
                      class="w-4 h-4"
                    />
                    <ChevronDown v-else class="w-4 h-4" />
                  </span>
                </div>
              </th>
              <th
                class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700 font-semibold"
              >
                Nama Jenis
              </th>
              <th
                class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700 font-semibold"
              >
                Perihal
              </th>
              <th
                class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700 font-semibold"
              ></th>
              <th
                class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700 font-semibold"
              >
                Format Penomoran
              </th>
              <th
                class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700 font-semibold text-center"
              >
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading -->
            <tr v-if="loading">
              <td
                colspan="6"
                class="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
              >
                Memuat data...
              </td>
            </tr>

            <!-- Empty -->
            <tr v-else-if="filteredJenis.length === 0">
              <td
                colspan="6"
                class="px-4 py-10 text-center text-gray-500 dark:text-gray-400"
              >
                Data tidak ditemukan
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-else
              v-for="(row, idx) in paginatedJenis"
              :key="row.id"
              :class="[
                'hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-b-gray-200 dark:border-b-gray-700 capitalize',
                idx % 2 === 0
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-white dark:bg-gray-800',
              ]"
            >
              <!-- KODE -->
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-xs whitespace-nowrap"
                >
                  {{ row.jenis }}
                </span>
              </td>

              <!-- NAMA -->
              <td
                class="px-4 py-3 font-medium text-nowrap text-gray-900 dark:text-white normal-case"
              >
                {{ row.jenis_text }}
              </td>

              <!-- PERIHAL -->
              <td
                class="px-4 py-3 text-gray-900 dark:text-gray-200 text-nowrap normal-case"
              >
                <span class="text-sm">
                  {{ row.jenis_text }}
                </span>
              </td>

              <!-- Download -->
              <td class="px-4 py-3">
                <button
                  v-if="row.file_url"
                  @click="downloadFile(row.file_url)"
                  class="text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                  title="Download format"
                >
                  <Download class="w-4 h-4" />
                </button>
                <span v-else class="text-gray-300 dark:text-gray-600">-</span>
              </td>

              <!-- FORMAT -->
              <td
                class="px-4 py-3 font-mono text-gray-700 dark:text-gray-300 normal-case whitespace-nowrap"
              >
                {{ row.format_penomoran }}
              </td>

              <!-- AKSI -->
              <td class="px-4 py-3">
                <div class="flex justify-center gap-2">
                  <button
                    class="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors group"
                    title="Detail"
                    @click="onView(row)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <button
                    class="text-yellow-500 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 p-2 rounded-lg transition-colors group"
                    title="Edit"
                    @click="onEdit(row)"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>

                  <button
                    class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group text-red-600 dark:text-red-500"
                    title="Delete"
                    @click="onDelete(row)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- MODAL DETAIL JENIS -->
        <Teleport to="body">
          <div
            v-if="showDetailModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <div
              class="relative bg-white dark:bg-gray-800 rounded-2xl p-1 w-[630px] max-w-[90vw] max-h-[690px] transition-colors"
            >
              <!-- HEADER -->
              <div
                class="flex justify-between items-start mb-4 border-b border-gray-300 dark:border-gray-700"
              >
                <div class="p-4">
                  <Heading variant="heading9sb" class="dark:text-white">
                    Detail Jenis <span class="text-red-500">*</span>
                  </Heading>
                </div>

                <button
                  @click="showDetailModal = false"
                  class="mt-5 mr-5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <!-- BODY -->
              <div
                class="flex flex-col gap-5 ml-5 mr-5 max-h-[67vh] overflow-y-auto"
              >
                <div
                  v-if="detailLoading"
                  class="py-10 text-center text-gray-500 dark:text-gray-400 text-sm"
                >
                  Memuat detail...
                </div>

                <div
                  v-else-if="!detailJenis"
                  class="py-10 text-center text-gray-500 dark:text-gray-400 text-sm"
                >
                  Detail tidak ditemukan
                </div>

                <div v-else class="space-y-6 pb-2">
                  <!-- KODE JENIS -->
                  <div class="flex gap-3 items-start">
                    <Hash
                      class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1"
                    />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Kode Jenis
                      </p>
                      <div class="mt-2">
                        <span
                          class="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm"
                        >
                          {{ detailJenis.jenis }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- NAMA JENIS -->
                  <div class="flex gap-3 items-start">
                    <FileText
                      class="w-5 h-5 text-green-600 dark:text-green-400 mt-1"
                    />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Nama Jenis
                      </p>
                      <p
                        class="mt-2 text-sm font-medium text-black dark:text-white"
                      >
                        {{ detailJenis.jenis_text }}
                      </p>
                    </div>
                  </div>

                  <!-- PERIHAL -->
                  <div class="flex gap-3 items-start">
                    <ChartNoAxesGantt
                      class="w-5 h-5 text-orange-500 dark:text-orange-400 mt-1"
                    />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Perihal
                      </p>
                      <p
                        class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200 uppercase"
                      >
                        {{ detailJenis.file_text || detailJenis.jenis_text }}
                      </p>
                    </div>
                  </div>

                  <!-- FORMAT PENOMORAN -->
                  <div class="flex gap-3 items-start">
                    <Hash
                      class="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1"
                    />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Format Penomoran
                      </p>
                      <p
                        class="mt-2 text-sm font-mono text-gray-900 dark:text-gray-200 whitespace-pre-line"
                      >
                        {{ detailJenis.format_penomoran }}
                      </p>
                    </div>
                  </div>

                  <!-- FILE TEMPLATE -->
                  <div class="flex gap-3 items-start">
                    <FileText
                      class="w-5 h-5 text-pink-500 dark:text-pink-400 mt-1"
                    />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        File Template
                      </p>

                      <div
                        class="mt-3 flex items-center justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 bg-gray-50 dark:bg-gray-700"
                      >
                        <div class="flex items-center gap-3 min-w-0">
                          <FileText
                            class="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0"
                          />
                          <p
                            class="text-sm text-gray-800 dark:text-gray-200 truncate"
                          >
                            {{ getTemplateName(detailJenis) }}
                          </p>
                        </div>

                        <button
                          v-if="detailJenis.file_url"
                          @click="downloadFile(detailJenis.file_url)"
                          class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Download class="w-3 h-3" />
                          Unduh
                        </button>

                        <span
                          v-else
                          class="text-xs text-gray-400 dark:text-gray-500"
                          >Tidak ada file</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- TANGGAL DIBUAT -->
                  <div class="flex gap-3 items-start">
                    <Calendar
                      class="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-1"
                    />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Tanggal Dibuat
                      </p>
                      <p class="mt-2 text-sm text-gray-900 dark:text-gray-200">
                        {{
                          detailJenis.created_at ? detailJenis.created_at : "-"
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- FOOTER (custom) -->
              <div
                class="border-t border-gray-300 dark:border-gray-700 mt-7 mb-1 gap-3 px-5 py-2"
              >
                <button
                  @click="showDetailModal = false"
                  class="w-full px-3 py-2 rounded-lg bg-primary hover:bg-primary-700 text-white font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </Teleport>

        <!-- MODAL TAMBAH JENIS -->
        <Teleport to="body">
          <Modal v-model="showAddModal" size="xl" @save="submitAddJenis">
            <template #title>
              <Heading
                variant="heading9b"
                class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white"
              >
                Tambah Jenis
              </Heading>
            </template>

            <div class="space-y-5 p-1">
              <!-- Kode Jenis -->
              <div class="flex flex-col gap-1">
                <Heading
                  variant="heading11m"
                  class="text-xs dark:text-gray-200"
                >
                  Kode Jenis <span class="text-red-500">*</span>
                </Heading>
                <input
                  v-model="addForm.jenis"
                  type="text"
                  placeholder="PER"
                  class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                <p v-if="addErrors.jenis" class="text-xs text-red-500">
                  {{ addErrors.jenis }}
                </p>
              </div>

              <!-- Nama Jenis -->
              <div class="flex flex-col gap-1">
                <Heading
                  variant="heading11m"
                  class="text-xs dark:text-gray-200"
                >
                  Nama Jenis <span class="text-red-500">*</span>
                </Heading>
                <input
                  v-model="addForm.jenis_text"
                  type="text"
                  placeholder="Peraturan Direksi"
                  class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                <p v-if="addErrors.jenis_text" class="text-xs text-red-500">
                  {{ addErrors.jenis_text }}
                </p>
              </div>

              <!-- Perihal -->
              <div class="flex flex-col gap-1">
                <Heading
                  variant="heading11m"
                  class="text-xs dark:text-gray-200"
                >
                  Perihal <span class="text-red-500">*</span>
                </Heading>
                <input
                  v-model="addForm.file_text"
                  type="text"
                  placeholder="PERATURAN DIREKSI"
                  class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                <p v-if="addErrors.file_text" class="text-xs text-red-500">
                  {{ addErrors.file_text }}
                </p>
              </div>

              <!-- Format Penomoran -->
              <div class="flex flex-col gap-1">
                <Heading
                  variant="heading11m"
                  class="text-xs dark:text-gray-200"
                >
                  Format Penomoran <span class="text-red-500">*</span>
                </Heading>
                <input
                  v-model="addForm.format_penomoran"
                  type="text"
                  placeholder="{TIPE}.{NO_URUT}/{INSTANSI}/{BULAN}/{TAHUN}"
                  class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                <p
                  v-if="addErrors.format_penomoran"
                  class="text-xs text-red-500"
                >
                  {{ addErrors.format_penomoran }}
                </p>
              </div>

              <!-- Upload File Template -->
              <div class="flex flex-col gap-1">
                <Heading
                  variant="heading11m"
                  class="text-xs dark:text-gray-200"
                >
                  Upload File Template <span class="text-red-500">*</span>
                </Heading>

                <label
                  class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                >
                  <span class="text-gray-600 dark:text-gray-300 truncate">
                    {{
                      addForm.file ? addForm.file.name : "Pilih file template"
                    }}
                  </span>

                  <input
                    type="file"
                    class="hidden"
                    accept=".doc,.docx,.pdf"
                    @change="onPickFileAdd"
                  />
                </label>

                <p v-if="addErrors.file" class="text-xs text-red-500">
                  {{ addErrors.file }}
                </p>

                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Format: .doc, .docx, .pdf
                </p>
              </div>
            </div>
          </Modal>
        </Teleport>

        <Teleport to="body">
          <Modal v-model="showEditModal" size="xl" @save="submitEditJenis">
            <template #title>
              <Heading
                variant="heading9b"
                class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white"
              >
                Edit Jenis
              </Heading>
            </template>

            <div class="space-y-5">
              <!-- Kode Jenis -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700 dark:text-gray-300">
                  Kode Jenis <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.jenis"
                  type="text"
                  placeholder="PER"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <!-- Nama Jenis -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700 dark:text-gray-300">
                  Nama Jenis <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.jenis_text"
                  type="text"
                  placeholder="Peraturan Direksi"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <!-- Perihal -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700 dark:text-gray-300">
                  Perihal <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.file_text"
                  type="text"
                  placeholder="PERATURAN DIREKSI"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <!-- Format Penomoran -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700 dark:text-gray-300">
                  Format Penomoran <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.format_penomoran"
                  type="text"
                  placeholder="{TIPE}.{NO_URUT}/{INSTANSI}/{BULAN}/{TAHUN}"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <!-- Upload File Template -->
              <label class="text-sm text-gray-700 dark:text-gray-300">
                Upload File Template <span class="text-red-500">*</span>
              </label>

              <label
                class="flex items-center gap-3 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:bg-gray-700"
              >
                <span class="text-gray-600 dark:text-gray-300 truncate">
                  {{
                    editForm.file
                      ? editForm.file.name
                      : editForm.file_name
                        ? editForm.file_name
                        : "Upload file"
                  }}
                </span>

                <input
                  type="file"
                  class="hidden"
                  accept=".doc,.docx,.pdf"
                  @change="onPickFileEdit"
                />
              </label>

              <p v-if="editErrors.file" class="text-xs text-red-500">
                {{ editErrors.file }}
              </p>
            </div>
          </Modal>
        </Teleport>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="totalItems > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Menampilkan {{ paginatedJenis.length }} dari {{ totalItems }} data
        </div>

        <div class="flex items-center gap-2">
          <!-- BACK -->
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900',
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

          <!-- PAGE NUMBERS -->
          <div class="flex items-center gap-1">
            <!-- FIRST -->
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              1
            </button>

            <!-- DOTS LEFT -->
            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- WINDOW -->
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary',
              ]"
            >
              {{ page }}
            </button>

            <!-- DOTS RIGHT -->
            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- LAST -->
            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <!-- NEXT -->
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900',
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
    <ConfirmDialog
      v-model="showDeleteModal"
      type="danger"
      title="Hapus Data Jenis"
      :message="
        deleteTarget
          ? `Apakah kamu yakin ingin menghapus jenis '${deleteTarget.jenis}'?`
          : ''
      "
      confirm-text="Hapus"
      cancel-text="Batal"
      :is-loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  RotateCcw,
  FileDown,
  FileText,
  Hash,
  ChartNoAxesGantt,
  Calendar,
  Upload,
  Save,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-vue-next";

import type { BreadcrumbItem } from "~/types/breadcrumb";
import { useJenis, type JenisItem } from "~/composables/useJenis";
import Modal from "@/components/Modal.vue";
import ConfirmDialog from "@/components/ConfirmPopup.vue";

const items = [
  { label: "Beranda", to: "/beranda" },
  { label: "Jenis", to: "/master/jenis" },
] satisfies BreadcrumbItem[];

//toast
import { useToast } from "#imports";

const toast = useToast();

const showToast = (opt: {
  title: string;
  message?: string;
  color?: "primary" | "neutral" | "secondary" | "warning" | "error" | "success";
  icon?: string;
}) => {
  toast.add({
    title: opt.title,
    description: opt.message,
    color: opt.color ?? "primary",
    icon: opt.icon ?? "i-lucide-info",
  });
};

const { getJenisList, getJenisDetail, deleteJenis, createJenis, updateJenis } =
  useJenis();

const loading = ref(false);
const deletingId = ref<string | null>(null);

const search = ref("");
const jenisList = ref<JenisItem[]>([]);

// Pagination & Sorting
const currentPage = ref(1);
const perPage = ref(10);
const rowsChoices = [5, 10, 20, 50];
const sortColumn = ref<string>("jenis");
const sortDirection = ref<"asc" | "desc">("asc");

const fetchJenis = async () => {
  try {
    loading.value = true;
    const res = await getJenisList();
    jenisList.value = res.data || [];
    currentPage.value = 1;
  } catch (e) {
    console.error("Gagal ambil data jenis:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchJenis);

const filteredJenis = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return jenisList.value;

  return jenisList.value.filter((x) => {
    return (
      x.jenis.toLowerCase().includes(q) ||
      x.jenis_text.toLowerCase().includes(q) ||
      x.format_penomoran.toLowerCase().includes(q)
    );
  });
});

// Sorted data
const sortedJenis = computed(() => {
  const sorted = [...filteredJenis.value];

  sorted.sort((a, b) => {
    const aVal = String(a[sortColumn.value] || "").toLowerCase();
    const bVal = String(b[sortColumn.value] || "").toLowerCase();

    if (aVal < bVal) return sortDirection.value === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection.value === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
});

const totalItems = computed(() => sortedJenis.value.length);

const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value));

const paginatedJenis = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return sortedJenis.value.slice(start, start + perPage.value);
});

// window page number
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

// Sorting function
const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortColumn.value = column;
    sortDirection.value = "asc";
  }
};

// Watch for changes
watch([search, perPage], () => {
  currentPage.value = 1;
});

const router = useRouter();

const getFileName = (url: string) => {
  try {
    const cleanUrl = url.split("?")[0]; // hapus query panjang
    const parts = cleanUrl.split("/");
    return parts[parts.length - 1] || "file";
  } catch {
    return "file";
  }
};

const downloadFile = (url: string) => {
  window.open(url, "_blank");
};

const onView = async (row: JenisItem) => {
  try {
    showDetailModal.value = true;
    detailLoading.value = true;
    detailJenis.value = null;

    const res = await getJenisDetail(row.id);
    detailJenis.value = res.data;
  } catch (e) {
    console.error("Gagal ambil detail jenis:", e);
  } finally {
    detailLoading.value = false;
  }
};

//delete
const showDeleteModal = ref(false);
const deleteTarget = ref<JenisItem | null>(null);
const deleteLoading = ref(false);

const onDelete = (row: JenisItem) => {
  deleteTarget.value = row;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!deleteTarget.value) return;

  try {
    deleteLoading.value = true;

    await deleteJenis(deleteTarget.value.id);

    jenisList.value = jenisList.value.filter(
      (x) => x.id !== deleteTarget.value!.id,
    );

    showDeleteModal.value = false;

    showToast({
      title: "Berhasil",
      message: `Data jenis berhasil dihapus`,
      color: "error",
      icon: "i-lucide-check-circle",
    });

    deleteTarget.value = null;
  } catch (e) {
    console.error("Gagal hapus jenis:", e);

    showToast({
      title: "Gagal",
      message: "Data jenis gagal dihapus ",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    deleteLoading.value = false;
  }
};

//create
const showAddModal = ref(false);
const savingAdd = ref(false);

const addForm = ref({
  jenis: "",
  jenis_text: "",
  file_text: "",
  format_penomoran: "",
  file: null as File | null,
});

const openAddModal = () => {
  addErrors.value = {};
  addForm.value = {
    jenis: "",
    jenis_text: "",
    file_text: "",
    format_penomoran: "",
    file: null,
  };
  showAddModal.value = true;
};

const validateAdd = () => {
  const err: Record<string, string> = {};

  if (!addForm.value.jenis.trim()) err.jenis = "Kode Jenis wajib diisi";
  if (!addForm.value.jenis_text.trim())
    err.jenis_text = "Nama Jenis wajib diisi";
  if (!addForm.value.file_text.trim()) err.file_text = "Perihal wajib diisi";
  if (!addForm.value.format_penomoran.trim())
    err.format_penomoran = "Format Penomoran wajib diisi";

  addErrors.value = err;
  return Object.keys(err).length === 0;
};

const submitAddJenis = async () => {
  if (!validateAdd()) return;

  try {
    savingAdd.value = true;

    await createJenis({
      jenis: addForm.value.jenis,
      jenis_text: addForm.value.jenis_text,
      file_text: addForm.value.file_text,
      format_penomoran: addForm.value.format_penomoran,
      file: addForm.value.file,
    });

    showAddModal.value = false;
    await fetchJenis();

    showToast({
      title: "Berhasil",
      message: "Data jenis berhasil ditambahkan",
      color: "success",
      icon: "i-lucide-check-circle",
    });
  } catch (e) {
    console.error("Gagal tambah jenis:", e);

    showToast({
      title: "Gagal",
      message: "Data jenis gagal ditambahkan",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    savingAdd.value = false;
  }
};

const onPickFileAdd = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;
  addForm.value.file = file;
};

const addErrors = ref<Record<string, string>>({});

//edit
const showEditModal = ref(false);
const savingEdit = ref(false);
const editId = ref<string | null>(null);

const editForm = ref({
  jenis: "",
  jenis_text: "",
  file_text: "",
  format_penomoran: "",
  file: null as File | null,

  file_name: "" as string,
  file_url: "" as string,
});

const onEdit = async (row: JenisItem) => {
  try {
    showEditModal.value = true;
    editId.value = row.id;
    savingEdit.value = false;
    editErrors.value = {};

    const res = await getJenisDetail(row.id);
    const data = res.data;

    editForm.value.jenis = data.jenis;
    editForm.value.jenis_text = data.jenis_text;
    editForm.value.file_text = data.file_text || "";
    editForm.value.format_penomoran = data.format_penomoran;

    editForm.value.file = null;

    editForm.value.file_name = data.file_name || "";
    editForm.value.file_url = data.file_url || "";
  } catch (e) {
    console.error("Gagal ambil data edit:", e);
    alert("Gagal memuat data");
    showEditModal.value = false;
  }
};

const submitEditJenis = async () => {
  if (!editId.value) return;

  if (!validateEdit()) return;

  try {
    savingEdit.value = true;

    await updateJenis(editId.value, {
      jenis: editForm.value.jenis,
      jenis_text: editForm.value.jenis_text,
      file_text: editForm.value.file_text,
      format_penomoran: editForm.value.format_penomoran,
      file: editForm.value.file,
    });

    showEditModal.value = false;
    await fetchJenis();

    showToast({
      title: "Berhasil",
      message: "Data jenis berhasil diperbarui",
      color: "success",
      icon: "i-lucide-check-circle",
    });
  } catch (e) {
    console.error("Gagal update jenis:", e);

    showToast({
      title: "Gagal",
      message: "Data jenis gagal diperbarui",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    savingEdit.value = false;
  }
};

const onPickFileEdit = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;
  editForm.value.file = file;
};

const validateEdit = () => {
  const err: Record<string, string> = {};

  if (!editForm.value.jenis.trim()) err.jenis = "Kode Jenis wajib diisi";
  if (!editForm.value.jenis_text.trim())
    err.jenis_text = "Nama Jenis wajib diisi";
  if (!editForm.value.file_text.trim()) err.file_text = "Perihal wajib diisi";
  if (!editForm.value.format_penomoran.trim())
    err.format_penomoran = "Format Penomoran wajib diisi";

  const hasExistingFile = !!editForm.value.file_url;
  const hasNewFile = !!editForm.value.file;

  if (!hasExistingFile && !hasNewFile) {
    err.file = "File template wajib diupload saat edit";
  }

  editErrors.value = err;
  return Object.keys(err).length === 0;
};

const editErrors = ref<Record<string, string>>({});

//detail
const showDetailModal = ref(false);
const detailLoading = ref(false);
const detailJenis = ref<any>(null);

const getTemplateName = (data: any) => {
  if (data?.file_name) return data.file_name;
  if (data?.file_url) return getFileName(data.file_url);
  return "-";
};

//export
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const onExport = () => {
  const data = sortedJenis.value.map((row, index) => ({
    No: index + 1,
    "Kode Jenis": row.jenis,
    "Nama Jenis": row.jenis_text,
    Perihal: row.file_text || row.jenis_text,
    "Format Penomoran": row.format_penomoran,
    "Tanggal Dibuat": row.created_at || "-",
  }));

  if (data.length === 0) {
    showToast({
      title: "Tidak ada data",
      message: "Tidak ada data untuk diexport.",
      color: "warning",
      icon: "i-lucide-alert-triangle",
    });
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 30 },
    { wch: 30 },
    { wch: 40 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Jenis");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const date = new Date().toISOString().slice(0, 10);
  saveAs(blob, `master_jenis_${date}.xlsx`);

  showToast({
    title: "Export berhasil",
    message: `Data jenis berhasil diexport`,
    color: "success",
    icon: "i-lucide-file-down",
  });
};
</script>

<style scoped>
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
}
</style>
