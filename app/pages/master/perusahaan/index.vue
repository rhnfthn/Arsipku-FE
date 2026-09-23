<template>
  <div class="min-h-screen dark:bg-gray-900 transition-colors pt-5">
    <AccessDenied v-if="!canAccessPage()" />
<div v-else class="max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-3">
        <div>
          <Heading variant="heading6b" class="text-mobile-md dark:text-white">
            {{ t('mp_title') }}
          </Heading>
          <PageHeader :items="breadcrumbs" />
        </div>
        <button
          v-if="hasPermission('master-data', 'create-perusahaan')"
          @click="openAddCompanyModal"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm transition-all shadow-sm"
        >
          <Plus class="w-4 h-4" />
          {{ t('nm_button') }}
        </button>
      </div>

      <!-- Card -->
      <div
        class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
      >
        <!-- TOOLBAR (TIDAK ikut scroll) -->
        <div
          class="rounded-lg shadow-sm sticky left-0 z-40 bg-white dark:bg-gray-800 flex flex-wrap gap-2 items-center p-3 border-b border-gray-200 dark:border-gray-700 transition-colors"
        >
          <!-- Rows per page -->
          <div class="relative">
            <button
              type="button"
              @click="openRowsDropdown = !openRowsDropdown"
              class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
            >
              <span>{{ perPage }}</span>
              <ChevronDown
                class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': openRowsDropdown }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openRowsDropdown"
                class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  v-for="n in rowsChoices"
                  :key="n"
                  type="button"
                  @click="
                    perPage = n;
                    openRowsDropdown = false;
                    currentPage = 1;
                  "
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                    perPage === n
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Refresh -->
          <button
            @click="refreshData"
            class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition-colors"
            title="Refresh"
          >
            <RotateCcw class="w-4 h-4" />
          </button>

          <!-- Search -->
          <div class="relative flex-1 min-w-40">
            <Search
              class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="search"
              :placeholder="t('mp_cari_placeholder')"
              class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
            />
          </div>

          <!-- Export -->
          <button
            v-if="hasPermission('master-data', 'export-perusahaan')"
            @click="onExport"
            class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap"
          >
            Export
          </button>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-primary-400 dark:bg-primary-700 text-white">
              <tr>
                <th
                  @click="toggleSortTanggalMulai"
                  class="px-4 py-3 text-left cursor-pointer select-none flex items-center gap-2"
                >
                  {{ t('mp_col_tgl_mulai') }}
                  <ArrowUpDown
                    class="w-4 h-4 transition-transform duration-300"
                    :class="{
                      'rotate-180': sortBy === 'desc',
                      'rotate-0': sortBy !== 'desc'
                    }"
                  />
                </th>
                <th class="px-4 py-3 text-left">{{ t('mp_col_tgl_berakhir') }}</th>
                <th class="px-4 py-3 text-center">{{ t('mp_col_kode') }}</th>
                <th class="px-4 py-3 text-left">{{ t('mp_col_nama_pendek') }}</th>
                <th class="px-4 py-3 text-left">{{ t('mp_col_nama_panjang') }}</th>
                <th class="px-4 py-3 text-center">{{ t('mp_col_aksi') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in paginatedRows"
                :key="row.kode"
                :class="[
                  'border-b border-b-gray-200 dark:border-b-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors',
                  idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
                ]"
              >
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  <span v-html="highlight(formatDateSlash(row.tanggalMulai), search)"></span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  <span v-html="highlight(formatDateSlash(row.tanggalBerakhir), search)"></span>
                </td>
                <td class="px-4 py-3 items-center">
                  <NuxtLink
                    :to="`/master/perusahaan/${row.kode}/struktur`"
                    class="flex px-3 py-1 rounded-lg bg-blue-100 dark:bg-primary hover:dark:bg-primary-600 hover:bg-primary-700 hover:text-white text-blue-700 dark:text-white transition-colors w-fit"
                  >
                    <div class="flex p-2 rounded-lg transition-colors">
                      <Building2 class="w-5 h-5" />
                    </div>
                    <div class="flex items-center text-sm font-semibold transition-colors">
                      <span v-html="highlight(row.kode, search)"></span>
                    </div>
                  </NuxtLink>
                </td>
                <td
                  class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap uppercase"
                  v-html="highlight(row.namaPendek, search)"
                ></td>
                <td
                  class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 uppercase"
                  v-html="highlight(row.namaPanjang, search)"
                ></td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      v-if="hasPermission('master-data', 'update-perusahaan')"
                      @click="openEditModal(row)"
                      class="inline-flex h-8 w-8 items-center justify-center p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors group"
                    >
                      <Pencil
                        class="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600"
                      />
                    </button>
                    <button
                      v-if="hasPermission('master-data', 'delete-perusahaan')"
                      @click="openDeleteConfirm(row)"
                      class="inline-flex h-8 w-8 items-center justify-center p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                    >
                      <Trash2
                        class="w-4 h-4 text-red-600 dark:text-red-500 group-hover:text-red-600"
                      />
                    </button>
                    <NuxtLink
                      v-if="hasPermission('master-data', 'read-perusahaan-area')"
                      :to="`/master/perusahaan/${row.kode}/area`"
                      class="inline-flex h-8 w-8 items-center justify-center p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group"
                    >
                      <MapPin
                        class="w-4 h-4 text-green-600 dark:text-green-500 group-hover:text-green-600"
                      />
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div
          v-if="totalItems > 0"
          class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            {{ t('menampilkan') }} {{ paginatedRows.length }} {{ t('dari') }}
            {{ totalItems }} {{ t('data') }}
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              :class="[
                'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                currentPage === 1
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
              ]"
            >
              {{ t('sebelumnya') }}
            </button>

            <div class="flex items-center gap-1">
              <button
                v-if="paginationPages[0] > 1"
                @click="currentPage = 1"
                class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
              >
                1
              </button>
              <span
                v-if="paginationPages[0] > 2"
                class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >
                ...
              </span>
              <button
                v-for="page in paginationPages"
                :key="page"
                @click="currentPage = page"
                :class="[
                  'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                  currentPage === page
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'
                ]"
              >
                {{ page }}
              </button>
              <span
                v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
                class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >
                ...
              </span>
              <button
                v-if="paginationPages[paginationPages.length - 1] < totalPages"
                @click="currentPage = totalPages"
                class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
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
                  : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
              ]"
            >
              {{ t('selanjutnya') }}
            </button>
          </div>
        </div>
      </div>

    <!-- Add Company Modal -->
    <Teleport to="body">
      <Modal
        v-model="openAddCompany"
        :saving="isSavingAddCompany"
        size="xl"
        @save="handleSaveCompany"
      >
        <template #title>
          <div class="p-3 ml-2">
            <h3 class="text-xl font-bold dark:text-white">
              {{ t('mp_modal_add') }}
            </h3>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_kode') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formCompany.kode"
              type="text"
              :placeholder="t('mp_kode_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.kode
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.kode = false"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('mp_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="formCompany.tanggalMulai"
                type="date"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                  formErrors.tanggalMulai
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="formErrors.tanggalMulai = false"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('mp_tgl_berakhir') }}
              </Heading>
              <input
                v-model="formCompany.tanggalBerakhir"
                type="date"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_nama_pendek') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formCompany.namaPendek"
              type="text"
              :placeholder="t('mp_nama_pendek_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.namaPendek
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.namaPendek = false; formCompany.namaPendek = formCompany.namaPendek.toUpperCase()"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_nama_panjang') }} <span class="text-red-500">*</span>
            </Heading>
            <textarea
              v-model="formCompany.namaPanjang"
              rows="3"
              :placeholder="t('mp_nama_panjang_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.namaPanjang
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.namaPanjang = false; formCompany.namaPanjang = formCompany.namaPanjang.toUpperCase()"
            ></textarea>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
      <Modal v-model="showEditModal" :saving="isSavingEditCompany" size="xl" @save="handleSaveEdit">
        <template #title>
          <div>
            <h3 class="text-lg font-bold p-3 dark:text-white">
              {{ t('mp_modal_edit') }}
            </h3>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_kode_edit') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="editForm.kode"
              disabled
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('mp_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="editForm.tanggalMulai"
                type="date"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                  editFormErrors.tanggalMulai
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="editFormErrors.tanggalMulai = false"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('mp_tgl_berakhir') }}
              </Heading>
              <input
                v-model="editForm.tanggalBerakhir"
                type="date"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_nama_pendek') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="editForm.namaPendek"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                editFormErrors.namaPendek
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="editFormErrors.namaPendek = false; editForm.namaPendek = editForm.namaPendek.toUpperCase()"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_nama_panjang') }} <span class="text-red-500">*</span>
            </Heading>
            <textarea
              v-model="editForm.namaPanjang"
              rows="3"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                editFormErrors.namaPanjang
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="editFormErrors.namaPanjang = false; editForm.namaPanjang = editForm.namaPanjang.toUpperCase()"
            ></textarea>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <ConfirmPopup
      v-model="showDeleteConfirm"
      type="danger"
      :title="t('mp_pop_title')"
      :message="deleteMessage"
      :confirm-text="t('mp_pop_confirm')"
      :cancel-text="t('mp_pop_cancel')"
      :is-loading="isDeleting"
      :require-confirmation="true"
      confirmation-text="KONFIRMASI HAPUS DATA"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Blocked Delete Modal -->
    <ConfirmPopup
      v-model="showBlockedDeletePopup"
      type="warning"
      title="Data Tidak Dapat Dihapus"
      :message="blockedDeleteMessage"
      confirm-text="Mengerti"
      :is-alert="true"
      @confirm="showBlockedDeletePopup = false"
    />

    <!-- Export Column Modal -->
    <Teleport to="body">
      <Modal v-model="showExportModal" size="lg" :hide-default-footer="true">
        <template #title>
          <div class="ml-5 my-3.5">
            <Heading variant="heading8b" class="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
              {{ t('pilih_kolom_export') }}
            </Heading>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sesuaikan kolom data yang akan diekspor ke format Excel (.xlsx)
            </p>
          </div>
        </template>

        <div class="space-y-3.5 py-1">
          <!-- Selection Status Bar & Toggle All -->
          <div class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-750/60 border border-gray-200/80 dark:border-gray-700/80 text-xs">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center justify-center font-semibold px-2.5 py-0.5 rounded-full text-xs transition-colors"
                :class="selectedExportColumns.length > 0
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
              >
                {{ selectedExportColumns.length }} / {{ exportColumns.length }}
              </span>
              <span class="text-gray-600 dark:text-gray-300 font-medium">
                Kolom Terpilih
              </span>
            </div>

            <button
              type="button"
              @click="toggleAllExport"
              class="font-medium px-2.5 py-1 rounded-lg text-xs transition-colors"
              :class="allExportSelected
                ? 'text-primary hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'"
            >
              {{ allExportSelected ? 'Batal Pilih Semua' : t('pilih_semua') }}
            </button>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1 -mr-1">
            <div
              v-for="col in exportColumns"
              :key="col.key"
              @click="toggleColumn(col.key)"
              class="group relative flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-150 select-none"
              :class="selectedExportColumns.includes(col.key)
                ? 'border-primary-500/80 bg-primary-50/60 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100 shadow-sm ring-1 ring-primary-500/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/70 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300'"
            >
              <div class="flex items-center gap-3 min-w-0 w-full">
                <!-- Checkmark Box -->
                <div
                  class="w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 flex-shrink-0"
                  :class="selectedExportColumns.includes(col.key)
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-gray-400'"
                >
                  <Check v-if="selectedExportColumns.includes(col.key)" class="w-3 h-3 stroke-[3]" />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold truncate leading-tight">
                    {{ col.label }}
                  </p>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {{ col.desc }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Notice -->
          <div class="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-1 pt-0.5">
            <span>Format: <span class="font-medium text-gray-700 dark:text-gray-300">Microsoft Excel (.xlsx)</span></span>
            <span>Total: <span class="font-semibold text-gray-700 dark:text-gray-200">{{ filteredRows.length }} baris</span></span>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 flex-shrink-0 gap-3 px-5 py-3 mt-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
            <button
              type="button"
              @click="showExportModal = false"
              class="px-4 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            >
              {{ t('batal') }}
            </button>
            <button
              type="button"
              @click="handleExportConfirm"
              :disabled="selectedExportColumns.length === 0"
              class="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary-700 active:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-lg shadow-sm shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Export {{ selectedExportColumns.length > 0 ? `(${selectedExportColumns.length} Kolom)` : '' }}
            </button>
          </div>
        </template>
      </Modal>
    </Teleport>
  </div>
  </div>
</template>

<script setup lang="ts">const { canAccessPage } = useFeatureAccess()

import { ref, computed, onMounted, watch } from 'vue';
import { Search, Plus, MapPin, Pencil, Trash2, Building2, ArrowUpDown, ChevronDown, RotateCcw, Check } from 'lucide-vue-next';
import { useCompany } from '~/composables/useCompany';
import { formatDateSlash } from '~/utils/mail-helpers';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

definePageMeta({
  middleware: 'auth'
});

const { t, locale } = useI18n();

const { hasPermission } = useAuth();


const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('mp_title'), to: '/master/perusahaan' }
]);

const { getCompanies, createCompany, updateCompany, deleteCompany, checkCompanyUsage } = useCompany();
const { clearApiCache } = useApi();

import { useToast } from '#imports';
const toast = useToast();

const search = ref('');
const openAddCompany = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const showBlockedDeletePopup = ref(false);
const blockedDeleteMessage = ref('');
const selectedRow = ref<any>(null);
const isDeleting = ref(false);
const isCheckingDelete = ref(false);
const isSavingAddCompany = ref(false);
const isSavingEditCompany = ref(false);

const formCompany = ref({
  tanggalMulai: new Date().toISOString().slice(0, 10),
  tanggalBerakhir: '9999-12-31',
  kode: '',
  namaPendek: '',
  namaPanjang: ''
});

const formErrors = ref({
  kode: false,
  namaPendek: false,
  namaPanjang: false,
  tanggalMulai: false,
  tanggalBerakhir: false
});

// Generate next company code (4 digit, mulai 1000) — max+1 dari data existing.
const generateNextCompanyCode = () => {
  let max = 999;
  for (const r of rows.value) {
    const n = parseInt(String(r.kode), 10);
    if (!isNaN(n) && n >= 1000 && n < 10000 && n > max) max = n;
  }
  return String(max + 1);
};

// Reset form & buka modal tambah (dipanggil setiap kali tombol Tambah diklik,
// sehingga form selalu bersih saat modal dibuka kembali).
const openAddCompanyModal = () => {
  formCompany.value = {
    tanggalMulai: new Date().toISOString().slice(0, 10),
    tanggalBerakhir: '9999-12-31',
    kode: generateNextCompanyCode(),
    namaPendek: '',
    namaPanjang: ''
  };
  formErrors.value = {
    kode: false,
    namaPendek: false,
    namaPanjang: false,
    tanggalMulai: false,
    tanggalBerakhir: false
  };
  openAddCompany.value = true;
};

const deleteMessage = computed(() => {
  if (!selectedRow.value) return '';
  return locale.value === 'id'
    ? `Apakah Anda yakin ingin menghapus perusahaan ${selectedRow.value.namaPendek}?`
    : `Are you sure you want to delete company ${selectedRow.value.namaPendek}?`;
});

const rows = ref<any[]>([]);

const isExpired = (endDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return end <= today;
};

const fetchCompanies = async () => {
  try {
    const res = await getCompanies();
    const validRows: any[] = [];
    for (const item of res.data) {
      // Jangan auto-delete di sini — itu menyebabkan 404 saat fetch ulang
      // (perusahaan sudah dihapus manual tapi masih ada di cache). Cukup
      // sembunyikan yang expired dari tampilan.
      if (isExpired(item.endDate)) {
        continue;
      }
      validRows.push({
        id: item.id,
        tanggalMulai: item.startDate,
        tanggalBerakhir: item.endDate,
        kode: String(item.company),
        namaPendek: item.shortText,
        namaPanjang: item.longText
      });
    }
    rows.value = validRows;
  } catch (error) {
    console.error('Gagal mengambil data company', error);
  }
};

onMounted(fetchCompanies);

const sortBy = ref<'asc' | 'desc' | null>(null);

const filteredRows = computed(() => {
  let result = [...rows.value];

  if (search.value) {
    const s = search.value.toLowerCase();
    result = result.filter(
      (row) =>
        row.kode.toLowerCase().includes(s) ||
        row.namaPendek.toLowerCase().includes(s) ||
        row.namaPanjang.toLowerCase().includes(s)
    );
  }

  if (sortBy.value === 'asc') {
    result.sort((a, b) => new Date(a.tanggalMulai).getTime() - new Date(b.tanggalMulai).getTime());
  } else if (sortBy.value === 'desc') {
    result.sort((a, b) => new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime());
  }

  return result;
});

const toggleSortTanggalMulai = () => {
  if (sortBy.value === null) sortBy.value = 'asc';
  else if (sortBy.value === 'asc') sortBy.value = 'desc';
  else sortBy.value = null;
};

// ─────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────
const currentPage = ref(1);
const perPage = ref(10);
const rowsChoices = [5, 10, 20, 50];
const openRowsDropdown = ref(false);

const totalItems = computed(() => filteredRows.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value));

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredRows.value.slice(start, end);
});

const paginationPages = computed(() => {
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage.value - half);
  let end = Math.min(totalPages.value, start + windowSize - 1);
  if (end - start < windowSize - 1) {
    start = Math.max(1, end - windowSize + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const refreshData = async () => {
  search.value = '';
  currentPage.value = 1;
  await fetchCompanies();
};

// Reset ke halaman 1 saat search / perPage berubah
watch([search, perPage], () => {
  currentPage.value = 1;
});

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
const onExport = () => {
  if (filteredRows.value.length === 0) {
    toast.add({
      title: t('gagal'),
      description: 'Tidak ada data untuk diekspor.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    });
    return;
  }
  selectedExportColumns.value = exportColumns.value.map((c) => c.key);
  showExportModal.value = true;
};

const formatDateDot = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

const exportColumns = computed(() => [
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'kode', label: t('mp_col_kode'), desc: 'Kode identifikasi perusahaan' },
  { key: 'nama_pendek', label: t('mp_col_nama_pendek'), desc: 'Nama singkatan perusahaan' },
  { key: 'nama_panjang', label: t('mp_col_nama_panjang'), desc: 'Nama resmi perusahaan' },
  { key: 'tgl_mulai', label: t('mp_col_tgl_mulai'), desc: 'Tanggal mulai berlaku' },
  { key: 'tgl_berakhir', label: t('mp_col_tgl_berakhir'), desc: 'Tanggal akhir berlaku' }
]);

const showExportModal = ref(false);
const selectedExportColumns = ref<string[]>([]);

const allExportSelected = computed(
  () => selectedExportColumns.value.length === exportColumns.value.length && exportColumns.value.length > 0
);

const toggleAllExport = () => {
  if (allExportSelected.value) {
    selectedExportColumns.value = [];
  } else {
    selectedExportColumns.value = exportColumns.value.map((c) => c.key);
  }
};

const toggleColumn = (key: string) => {
  const index = selectedExportColumns.value.indexOf(key);
  if (index > -1) {
    selectedExportColumns.value.splice(index, 1);
  } else {
    selectedExportColumns.value.push(key);
  }
};

const handleExportConfirm = () => {
  const selectedKeys = selectedExportColumns.value;
  if (selectedKeys.length === 0) return;
  const data = filteredRows.value.map((row, idx) => {
    const r: Record<string, any> = {};
    if (selectedKeys.includes('No')) r['No'] = idx + 1;
    if (selectedKeys.includes('kode')) r[t('mp_col_kode')] = row.kode;
    if (selectedKeys.includes('nama_pendek')) r[t('mp_col_nama_pendek')] = row.namaPendek;
    if (selectedKeys.includes('nama_panjang')) r[t('mp_col_nama_panjang')] = row.namaPanjang;
    if (selectedKeys.includes('tgl_mulai')) r[t('mp_col_tgl_mulai')] = formatDateDot(row.tanggalMulai);
    if (selectedKeys.includes('tgl_berakhir')) r[t('mp_col_tgl_berakhir')] = formatDateDot(row.tanggalBerakhir);
    return r;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t('mp_title'));
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `master_perusahaan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast.add({
    title: t('berhasil'),
    description: 'Export berhasil.',
    color: 'success',
    icon: 'i-lucide-file-down'
  });
  showExportModal.value = false;
};

const isEndDateInvalid = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return end <= start;
};

const formatDateWarningMessage = () => {
  return locale.value === 'id'
    ? 'Tanggal berakhir tidak boleh sama dengan atau lebih awal dari tanggal mulai'
    : 'The end date cannot be the same as or earlier than the start date.';
};

const validateAddForm = (): boolean => {
  formErrors.value.kode = !formCompany.value.kode.trim();
  formErrors.value.namaPendek = !formCompany.value.namaPendek.trim();
  formErrors.value.namaPanjang = !formCompany.value.namaPanjang.trim();
  formErrors.value.tanggalMulai = !formCompany.value.tanggalMulai;

  const emptyFields: string[] = [];

  if (formErrors.value.kode) {
    emptyFields.push(t('mp_kode'));
  }
  if (formErrors.value.namaPendek) {
    emptyFields.push(t('mp_nama_pendek'));
  }
  if (formErrors.value.namaPanjang) {
    emptyFields.push(t('mp_nama_panjang'));
  }
  if (formErrors.value.tanggalMulai) {
    emptyFields.push(t('mp_tgl_mulai'));
  }

  if (emptyFields.length > 0) {
    toast.add({
      title: t('gagal'),
      description: `${emptyFields.join(', ')} wajib diisi`,
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return false;
  }

  return true;
};

const handleSaveCompany = async () => {
  if (isSavingAddCompany.value) return;

  if (!validateAddForm()) return;
  if (isNaN(Number(formCompany.value.kode))) {
    toast.add({
      title: t('gagal'),
      description: t('mp_val_kode_angka'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return;
  }

  isSavingAddCompany.value = true;

  try {
    await createCompany({
      company: Number(formCompany.value.kode),
      shortText: formCompany.value.namaPendek,
      longText: formCompany.value.namaPanjang,
      startDate: formCompany.value.tanggalMulai,
      endDate: formCompany.value.tanggalBerakhir
    });

    // Invalidate cache agar list ter-refresh setelah create
    clearApiCache();
    await fetchCompanies();

    toast.add({
      title: t('berhasil'),
      description: t('mp_success_add'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    });

    openAddCompany.value = false;
    formCompany.value = {
      tanggalMulai: new Date().toISOString().slice(0, 10),
      tanggalBerakhir: '9999-12-31',
      kode: '',
      namaPendek: '',
      namaPanjang: ''
    };
    formErrors.value = {
      kode: false,
      namaPendek: false,
      namaPanjang: false,
      tanggalMulai: false,
      tanggalBerakhir: false
    };
  } catch (error) {
    toast.add({
      title: t('gagal'),
      description: t('mp_err_add'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    console.error(error);
  } finally {
    isSavingAddCompany.value = false;
  }
};

const editForm = ref({
  id: '',
  tanggalMulai: '',
  tanggalBerakhir: '',
  kode: '',
  namaPendek: '',
  namaPanjang: ''
});

const editFormErrors = ref({
  kode: false,
  namaPendek: false,
  namaPanjang: false,
  tanggalMulai: false,
  tanggalBerakhir: false
});

const openEditModal = (row: any) => {
  selectedRow.value = row;
  editForm.value = {
    id: row.id,
    tanggalMulai: row.tanggalMulai,
    tanggalBerakhir: row.tanggalBerakhir,
    kode: row.kode,
    namaPendek: row.namaPendek,
    namaPanjang: row.namaPanjang
  };
  editFormErrors.value = {
    kode: false,
    namaPendek: false,
    namaPanjang: false,
    tanggalMulai: false,
    tanggalBerakhir: false
  };
  showEditModal.value = true;
};

const validateEditForm = (): boolean => {
  editFormErrors.value.namaPendek = !editForm.value.namaPendek.trim();
  editFormErrors.value.namaPanjang = !editForm.value.namaPanjang.trim();
  editFormErrors.value.tanggalMulai = !editForm.value.tanggalMulai;

  const emptyFields: string[] = [];

  if (editFormErrors.value.namaPendek) {
    emptyFields.push(t('mp_nama_pendek'));
  }
  if (editFormErrors.value.namaPanjang) {
    emptyFields.push(t('mp_nama_panjang'));
  }
  if (editFormErrors.value.tanggalMulai) {
    emptyFields.push(t('mp_tgl_mulai'));
  }

  if (emptyFields.length > 0) {
    toast.add({
      title: t('gagal'),
      description: `${emptyFields.join(', ')} wajib diisi`,
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return false;
  }

  return true;
};

const handleSaveEdit = async () => {
  if (isSavingEditCompany.value) return;

  if (!validateEditForm()) return;

  isSavingEditCompany.value = true;

  try {
    await updateCompany(editForm.value.id, {
      shortText: editForm.value.namaPendek,
      longText: editForm.value.namaPanjang,
      startDate: editForm.value.tanggalMulai,
      endDate: editForm.value.tanggalBerakhir
    });

    // Invalidate FE cache + force fresh fetch (BE cache juga sudah 5 detik)
    clearApiCache();
    await fetchCompanies();

    toast.add({
      title: t('berhasil'),
      description: t('mp_success_edit'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    });

    showEditModal.value = false;
  } catch (error) {
    toast.add({
      title: t('gagal'),
      description: t('mp_err_edit'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    console.error(error);
  } finally {
    isSavingEditCompany.value = false;
  }
};

const openDeleteConfirm = (row: any) => {
  selectedRow.value = row;
  showDeleteConfirm.value = true;
};

const handleDelete = async () => {
  if (!selectedRow.value?.id) return;

  try {
    isDeleting.value = true;
    await deleteCompany(selectedRow.value.id);

    // Invalidate FE cache + force fresh fetch (BE cache juga sudah 5 detik)
    clearApiCache();
    await fetchCompanies();

    toast.add({
      title: t('berhasil'),
      description: `${selectedRow.value.namaPendek} ${t('mp_success_delete')}`,
      color: 'success',
      icon: 'i-lucide-trash-2'
    });

    showDeleteConfirm.value = false;
    selectedRow.value = null;
  } catch (error) {
    toast.add({
      title: t('gagal'),
      description: t('mp_err_delete'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    console.error(error);
  } finally {
    isDeleting.value = false;
  }
};



function highlight(text: string, keyword: string): string {
  if (!keyword || !text) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">$1</mark>'
  );
}
</script>

<style scoped>
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}
</style>
