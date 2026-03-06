<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-gray-100">
          {{ $t('nom_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
      <button
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        {{ $t('nom_btn_tambah') }}
      </button>
    </div>

    <!-- CARD -->
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl w-full">
      <!-- TOP BAR -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 mb-4 pr-3">
        <div class="flex items-center gap-2 px-4">
          <select
            v-model="limit"
            @change="handleLimitChange"
            class="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </div>
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="searchQuery"
            @input="handleSearchInput"
            :placeholder="$t('nom_cari_placeholder')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs pl-9 pr-3 py-1.5 rounded-lg dark:text-gray-200 dark:placeholder-gray-400"
          />
        </div>
      </div>

      <!-- TABLE BODY (skeleton / empty / data) -->
      <div class="overflow-x-auto relative">
        <table class="w-full bg-white dark:bg-gray-800 text-sm">
          <thead class="bg-primary dark:bg-primary-800 text-white text-[15px] sticky top-1 z-10">
            <tr>
              <th
                v-for="col in headers"
                :key="col.key"
                @click="col.sortable && handleSort(col.key)"
                :class="[
                  'px-5 py-3 text-left font-semibold tracking-wide whitespace-nowrap bg-primary dark:bg-primary-800',
                  col.sortable
                    ? 'cursor-pointer select-none hover:bg-primary-700 dark:hover:bg-primary-900'
                    : 'cursor-default'
                ]"
              >
                <div class="flex items-center gap-2">
                  <span>{{ col.label }}</span>
                  <span class="w-4 h-4 inline-flex items-center justify-center">
                    <ArrowUpDown
                      v-if="col.sortable"
                      :class="[
                        'w-4 h-4 transition-all',
                        sortBy === col.key ? 'opacity-100 text-gray-300' : 'opacity-50',
                        sortBy === col.key && sortOrder === 'desc' ? 'rotate-180' : 'rotate-0'
                      ]"
                    />
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- SKELETON -->
            <template v-if="loading">
              <tr
                v-for="i in limit"
                :key="`sk-${i}`"
                class="border-b border-gray-200 dark:border-gray-700"
              >
                <td v-for="j in headers.length" :key="j" class="px-5 py-4">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
                    :style="{ width: `${50 + (j % 4) * 12}%` }"
                  ></div>
                </td>
              </tr>
            </template>

            <!-- EMPTY -->
            <template v-else-if="rows.length === 0">
              <tr>
                <td
                  :colspan="headers.length"
                  class="py-20 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  {{ $t('nom_empty') }}
                </td>
              </tr>
            </template>

            <!-- DATA ROWS -->
            <template v-else>
              <tr
                v-for="row in rows"
                :key="row.id_request"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition dark:text-gray-200"
                @mousemove="onRowMouseMove($event, $t('nom_tooltip_detail'))"
                @mouseleave="onRowMouseLeave"
                @click="openRowModal(row)"
              >
                <td class="px-5 py-4">{{ row.jenis }}</td>
                <td class="px-5 py-4">{{ row.jabatan }}</td>
                <td class="px-5 py-4">
                  <div class="relative group max-w-[250px]">
                    <p class="whitespace-normal break-words line-clamp-3">
                      {{ row.perihal }}
                    </p>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <div class="flex flex-col gap-0.5">
                    <div class="text-sm font-medium">{{ row.tanggal }}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-200 font-mono">
                      <div v-for="(nomor, idx) in row.nomor_list.slice(0, 3)" :key="idx">
                        {{ nomor }}
                      </div>
                      <div v-if="row.nomor_list.length > 3" class="text-primary font-medium">
                        +{{ row.nomor_list.length - 3 }}
                        {{ $t('nom_nomor_lainnya') }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <div class="relative group max-w-[300px]">
                    <p class="whitespace-normal break-words line-clamp-3">
                      {{ row.pengusul }}
                    </p>
                  </div>
                </td>
                <td class="px-5 py-4">{{ row.waktu }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="pagination && pagination.total > 0 && rows.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ $t('menampilkan') }} {{ paginationStart }} - {{ paginationEnd }} {{ $t('dari') }}
          {{ pagination.total }} {{ $t('data') }}
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="goToPage((pagination.current_page || pagination.page) - 1)"
            :disabled="(pagination.current_page || pagination.page) === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              (pagination.current_page || pagination.page) === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
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
            {{ $t('sebelumnya') }}
          </button>
          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages.length > 0 && paginationPages[0] > 1"
              @click="goToPage(1)"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all dark:text-gray-200"
            >
              1
            </button>
            <span
              v-if="paginationPages.length > 0 && paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                (pagination.current_page || pagination.page) === page
                  ? 'bg-primary dark:bg-primary-700 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400'
              ]"
            >
              {{ page }}
            </button>
            <span
              v-if="
                paginationPages.length > 0 &&
                paginationPages[paginationPages.length - 1] <
                  (pagination.total_pages || pagination.totalPages) - 1
              "
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >
            <button
              v-if="
                paginationPages.length > 0 &&
                paginationPages[paginationPages.length - 1] <
                  (pagination.total_pages || pagination.totalPages)
              "
              @click="goToPage(pagination.total_pages || pagination.totalPages)"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all dark:text-gray-200"
            >
              {{ pagination.total_pages || pagination.totalPages }}
            </button>
          </div>
          <button
            @click="goToPage((pagination.current_page || pagination.page) + 1)"
            :disabled="
              (pagination.current_page || pagination.page) ===
              (pagination.total_pages || pagination.totalPages)
            "
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              (pagination.current_page || pagination.page) ===
              (pagination.total_pages || pagination.totalPages)
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
            ]"
          >
            {{ $t('selanjutnya') }}
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
    </div>

    <Teleport to="body">
      <AddUsulan v-model="openAdd" @submit="handleSubmitFromModal" />
    </Teleport>
  </div>

  <!-- FILE PREVIEW SLIDEOVER -->
  <Teleport to="body">
    <USlideover
      v-model:open="isOpenPreviewFile"
      :title="$t('nom_pratinjau_dokumen')"
      side="bottom"
      :dismissible="true"
      :ui="{ content: 'h-screen max-h-screen', body: 'p-0 h-full' }"
      class="z-[9999]"
    >
      <template #body>
        <div class="h-full w-full bg-gray-100">
          <iframe
            v-if="previewPdfUrl"
            :key="previewPdfUrl"
            :src="previewPdfUrl"
            allowfullscreen
            class="w-full h-full border-0"
          />
        </div>
      </template>
    </USlideover>
  </Teleport>

  <!-- MODAL DETAIL -->
  <Teleport to="body">
    <Modal v-model="openPreview" :hideDefaultFooter="true" size="xl" class="z-[8000]">
      <template #title>
        <div class="flex items-center justify-between w-full">
          <h2 class="p-3 ml-1 text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ $t('nom_modal_title') }}
          </h2>
        </div>
      </template>

      <div class="px-3 pb-6">
        <!-- Loading skeleton -->
        <div v-if="loadingDetail" class="space-y-3">
          <div class="w-full h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
          <div class="w-full h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
          <div class="w-full h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
        </div>

        <template v-else-if="detailData">
          <div class="gap-4 mb-2 space-y-6 overflow-y-auto text-sm">
            <!-- Perihal / Edit Title -->
            <div class="md:col-span-2">
              <template v-if="!isEditingTitle">
                <div class="flex items-start justify-between gap-4 mb-2">
                  <p class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                    {{ detailData.perihal }}
                  </p>
                  <button
                    @click="startEditTitle"
                    class="text-primary dark:text-primary-400 text-sm flex items-center gap-1 hover:underline flex-shrink-0"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    {{ $t('nom_edit') }}
                  </button>
                </div>
              </template>
              <template v-else>
                <div class="flex gap-2">
                  <input
                    v-model="editedTitle"
                    class="flex-1 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                  />
                  <button
                    @click="saveTitle"
                    class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-800 transition text-sm"
                  >
                    {{ $t('nom_btn_simpan') }}
                  </button>
                  <button
                    @click="cancelEditTitle"
                    class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
                  >
                    {{ $t('nom_btn_batal') }}
                  </button>
                </div>
              </template>
            </div>

            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                {{ $t('nom_modal_tanggal') }}
              </p>
              <p class="font-medium mt-1 dark:text-gray-200">
                {{ formatTanggalWIB(detailData.tanggal) }}
              </p>
            </div>
            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                {{ $t('nom_modal_penandatangan') }}
              </p>
              <p class="font-medium mt-1 dark:text-gray-200">
                {{ detailData.jabatan }}
              </p>
            </div>
            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                {{ $t('nom_modal_klasifikasi') }}
              </p>
              <p class="font-medium mt-1 dark:text-gray-200">
                {{ detailData.klasifikasiDisplay || detailData.klasifikasi }}
              </p>
            </div>
            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                {{ $t('nom_modal_jenis_naskah') }}
              </p>
              <p class="font-medium mt-1 dark:text-gray-200">
                {{ detailData.jenis }}
              </p>
            </div>
          </div>

          <!-- NOMOR SURAT SECTION -->
          <div class="pt-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-l font-semibold text-gray-900 dark:text-gray-100">
                {{ $t('nom_nomor_surat') }}
                <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({{ detailData.nomor_list?.length || 0 }} {{ $t('nom_nomor_suffix') }})
                </span>
              </h4>
            </div>

            <div v-if="detailData.nomor_list && detailData.nomor_list.length > 0" class="space-y-4">
              <div
                v-for="(item, idx) in detailData.nomor_list"
                :key="item.id || `nomor-${idx}`"
                :class="[
                  'border rounded-lg p-4 hover:shadow-md transition',
                  item.status === 'hangus'
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 opacity-60'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                ]"
              >
                <!-- Nomor + Status + Copy -->
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-4 py-2"
                  >
                    <div class="flex justify-between items-center">
                      <span
                        :class="[
                          'font-mono text-sm',
                          item.status === 'hangus'
                            ? 'line-through text-gray-400'
                            : 'dark:text-gray-200'
                        ]"
                      >
                        {{ idx + 1 }}. {{ item.nomor }}
                      </span>
                      <span
                        :class="[
                          'px-3 py-1 rounded-full text-xs font-medium',
                          getStatusClass(item)
                        ]"
                      >
                        {{ getStatusLabel(item) }}
                      </span>
                    </div>
                  </div>
                  <button
                    v-if="item.status !== 'hangus'"
                    @click="handleCopy(item.nomor)"
                    class="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Copy class="w-4 h-4 dark:text-gray-300" />
                  </button>
                </div>

                <!-- File preview -->
                <div
                  v-if="item.file_name && !fileStates[item.id]?.isReplacing"
                  :class="[
                    'flex items-start border rounded-md p-3 transition',
                    item.status === 'hangus'
                      ? 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 opacity-70'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  ]"
                  @click="previewFile(item)"
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
                  <div class="flex-1 min-w-0 ml-3">
                    <p
                      :class="[
                        'text-sm font-medium truncate',
                        item.status === 'hangus'
                          ? 'text-gray-500 dark:text-gray-400 underline'
                          : 'text-primary dark:text-blue-400 underline'
                      ]"
                    >
                      {{ item.file_name }}
                    </p>
                    <p
                      class="text-xs mt-0.5"
                      :class="
                        item.status === 'hangus'
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-500 dark:text-gray-400'
                      "
                    >
                      {{ $t('nom_file_klik_preview') }}
                    </p>
                  </div>
                </div>

                <!-- Upload/replace input -->
                <div
                  v-if="fileStates[item.id]?.isReplacing"
                  class="border border-dashed border-primary/40 dark:border-primary/30 rounded-md p-3 bg-blue-50/50 dark:bg-blue-900/10"
                >
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                    {{
                      item.file_name ? $t('nom_file_pilih_pengganti') : $t('nom_file_pilih_upload')
                    }}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    @change="handleFileSelect(item.id, $event)"
                    class="block w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 dark:text-gray-200 cursor-pointer"
                  />
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    {{ $t('nom_file_max_size') }}
                  </p>
                </div>

                <!-- Action buttons -->
                <div class="flex gap-2 mt-3">
                  <!-- Upload button -->
                  <button
                    v-if="
                      !item.file_name &&
                      item.status !== 'hangus' &&
                      (item.status === 'terpakai' || item.status === 'booking') &&
                      !fileStates[item.id]?.isReplacing
                    "
                    @click="startUploadFile(item.id)"
                    class="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition text-sm"
                  >
                    {{ $t('nom_btn_upload_file') }}
                  </button>

                  <!-- Ganti File button -->
                  <button
                    v-if="
                      item.file_name &&
                      item.status !== 'hangus' &&
                      (item.status === 'terpakai' || item.status === 'terpakai_final') &&
                      !fileStates[item.id]?.isReplacing
                    "
                    @click="startReplacingFile(item.id)"
                    class="flex-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm"
                  >
                    {{ $t('nom_btn_ganti_file') }}
                  </button>

                  <!-- Simpan & Batal (saat isReplacing) -->
                  <template v-if="fileStates[item.id]?.isReplacing">
                    <button
                      @click="saveFile(item.id)"
                      :disabled="!fileStates[item.id]?.file || fileStates[item.id]?.isUploading"
                      :class="[
                        'flex-1 px-4 py-2 rounded-lg transition text-sm',
                        !fileStates[item.id]?.file || fileStates[item.id]?.isUploading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      ]"
                    >
                      {{
                        fileStates[item.id]?.isUploading
                          ? $t('nom_btn_uploading')
                          : $t('nom_btn_simpan_file')
                      }}
                    </button>
                    <button
                      @click="cancelReplacing(item.id)"
                      :disabled="fileStates[item.id]?.isUploading"
                      class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 text-sm"
                    >
                      {{ $t('nom_btn_batal') }}
                    </button>
                  </template>

                  <!-- Hangus button -->
                  <button
                    v-if="
                      item.status !== 'hangus' &&
                      (item.status === 'terpakai' || item.status === 'terpakai_final') &&
                      !fileStates[item.id]?.isReplacing
                    "
                    @click.stop="confirmHangusNomor(item.id)"
                    class="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                  >
                    {{ $t('nom_btn_hangus') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </Modal>
  </Teleport>

  <!-- CONFIRM HANGUS -->
  <ConfirmPopup
    v-model="openConfirmHangus"
    type="danger"
    :title="$t('nom_confirm_hangus_title')"
    :message="$t('nom_confirm_hangus_message')"
    :confirm-text="$t('nom_confirm_hangus_ya')"
    :cancel-text="$t('nom_confirm_hangus_batal')"
    :is-loading="isHangusing"
    @confirm="executeHangusNomor"
    class="z-[8500]"
  />

  <!-- TOOLTIP -->
  <Teleport to="body">
    <div
      v-if="tooltip.show"
      class="fixed z-[9999] pointer-events-none bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      {{ tooltip.text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, ArrowUpDown, Plus, Copy } from 'lucide-vue-next'
import AddUsulan from '~/components/AddUsulan.vue'
import Heading from '~/components/Heading.vue'
import PageHeader from '~/components/PageHeader.vue'
import { Modal } from '#components'
import ConfirmPopup from '~/components/ConfirmPopup.vue'
import { usePenomoran } from '~/composables/usePenomoran'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const config = useRuntimeConfig()

const {
  createPenomoranFinal,
  getDetailNomor,
  uploadDetailFile,
  hangusDetailNomor,
  getListNomor,
  refreshTrigger,
  showToastFileNotFound,
  showToastGagalPreview,
  showToastFileTooLargeAdmin,
  showToastPilihFile,
  showToastSaveTitle,
  showToastPenomoranSuccess,
  showToastCopied
} = usePenomoran()

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref<boolean>(true)
const loadingDetail = ref<boolean>(false)
const openAdd = ref<boolean>(false)
const openPreview = ref(false)
const openConfirmHangus = ref(false)
const isHangusing = ref(false)
const selectedRow = ref(null)
const detailData = ref(null)
const rows = ref<any[]>([])
const pagination = ref<any>(null)
const selectedDetailId = ref<string | null>(null)
const fileStates = ref<Record<string, any>>({})
const isEditingTitle = ref(false)
const editedTitle = ref('')

const searchQuery = ref<string>('')
const limit = ref<number>(10)
const currentPage = ref<number>(1)
const sortBy = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('desc')
const rowsChoices = [5, 10, 20, 50]

const getFileUrl = (filePath: string) => `${config.public.apiBaseUrl}/${filePath}`

// ─── Computed breadcrumbs & headers (locale-reactive) ─────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('nom_title'), to: '/penomoran/nomor' }
])

const headers = computed(() => [
  { label: t('nom_col_jenis'), key: 'jenis', sortable: true },
  { label: t('nom_col_penandatangan'), key: 'jabatan', sortable: false },
  { label: t('nom_col_perihal'), key: 'perihal', sortable: false },
  { label: t('nom_col_tanggal_nomor'), key: 'tanggal', sortable: true },
  { label: t('nom_col_pengusul'), key: 'pengusul', sortable: false },
  { label: t('nom_col_waktu'), key: 'waktu', sortable: true }
])

// ─── Status helpers ────────────────────────────────────────────────────────────
const getStatusLabel = (item: any): string => {
  if (item.status === 'hangus') return t('nom_status_hangus')
  if (item.status === 'terpakai_final') return t('nom_status_final')
  if (item.status === 'terpakai') return t('nom_status_terpakai')
  return t('nom_status_booking')
}

const getStatusClass = (item: any): string => {
  if (item.status === 'hangus') return 'bg-red-100 text-red-800'
  if (item.status === 'terpakai_final') return 'bg-green-100 text-green-800'
  if (item.status === 'terpakai') return 'bg-blue-100 text-blue-800'
  return 'bg-yellow-100 text-yellow-800'
}

// ─── Date helpers ──────────────────────────────────────────────────────────────
function toLocal(dateStr: string) {
  return new Date(dateStr.replace('Z', '').replace('+00:00', ''))
}
function formatTanggalWIB(dateStr: string) {
  if (!dateStr) return '-'
  const d = toLocal(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function formatWaktuWIB(dateStr: string) {
  if (!dateStr) return '-'
  const d = toLocal(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ─── Preview file ─────────────────────────────────────────────────────────────
const isOpenPreviewFile = ref(false)
const previewPdfUrl = ref<string | null>(null)

const previewFile = async (item: any) => {
  const fileUrl = item.file_url || (item.file_text ? getFileUrl(item.file_text) : null)
  if (!fileUrl) {
    showToastFileNotFound()
    return
  }
  try {
    previewPdfUrl.value = null
    previewPdfUrl.value = fileUrl
    isOpenPreviewFile.value = true
  } catch (err) {
    console.error('❌ Error preview file:', err)
    showToastGagalPreview()
  }
}

// ─── File actions ──────────────────────────────────────────────────────────────
const startUploadFile = (detailId: string) => {
  fileStates.value[detailId] = {
    isReplacing: true,
    isUploading: false,
    file: null
  }
}
const startReplacingFile = (detailId: string) => {
  fileStates.value[detailId] = {
    isReplacing: true,
    isUploading: false,
    file: null
  }
}
const handleFileSelect = (detailId: string, event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      showToastFileTooLargeAdmin()
      return
    }
    fileStates.value[detailId].file = file
  }
}
const saveFile = async (detailId: string) => {
  const state = fileStates.value[detailId]
  if (!state?.file) {
    showToastPilihFile()
    return
  }
  state.isUploading = true
  try {
    const result = await uploadDetailFile(detailId, state.file)
    const target = detailData.value?.nomor_list?.find((n: any) => n.id === detailId)
    if (target) {
      target.file_name = result?.file_name || state.file.name
      target.file_text = result?.file_text || null
      target.file_url = result?.file_url || null
      target.status = result?.status || 'terpakai_final'
    }
    delete fileStates.value[detailId]
  } catch (error: any) {
    console.error('❌ Error upload file:', error)
  } finally {
    state.isUploading = false
  }
}
const cancelReplacing = (detailId: string) => {
  delete fileStates.value[detailId]
}

// ─── Hangus ────────────────────────────────────────────────────────────────────
const confirmHangusNomor = (detailId: string) => {
  selectedDetailId.value = detailId
  openConfirmHangus.value = true
}
const executeHangusNomor = async () => {
  if (!selectedDetailId.value) return
  isHangusing.value = true
  try {
    await hangusDetailNomor(selectedDetailId.value)
    const target = detailData.value?.nomor_list?.find((n: any) => n.id === selectedDetailId.value)
    if (target) target.status = 'hangus'
    openConfirmHangus.value = false
    selectedDetailId.value = null
  } catch (error: any) {
    console.error('❌ Error hangus nomor:', error)
  } finally {
    isHangusing.value = false
  }
}

// ─── Edit title ────────────────────────────────────────────────────────────────
function startEditTitle() {
  if (!detailData.value) return
  editedTitle.value = detailData.value.perihal
  isEditingTitle.value = true
}
function cancelEditTitle() {
  isEditingTitle.value = false
  editedTitle.value = ''
}
function saveTitle() {
  if (!detailData.value) return
  detailData.value.perihal = editedTitle.value
  isEditingTitle.value = false
  showToastSaveTitle()
}

// ─── Copy ──────────────────────────────────────────────────────────────────────
const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value)
  showToastCopied(value)
}

// ─── Sort & search ─────────────────────────────────────────────────────────────
const handleSort = (col: string) => {
  const columnMapping: Record<string, string> = {
    jenis: 'jenis',
    tanggal: 'tanggal',
    waktu: 'waktu'
  }
  const backendColumn = columnMapping[col] || col
  if (sortBy.value === backendColumn) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = backendColumn
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
  fetchData()
}
const handleLimitChange = () => {
  currentPage.value = 1
  fetchData()
}

let searchTimeout: any = null
const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 500)
}

const goToPage = (page: number) => {
  if (!pagination.value) return
  const totalPages = pagination.value.total_pages || pagination.value.totalPages || 1
  if (page < 1 || page > totalPages) return
  currentPage.value = page
  fetchData()
}

// ─── Pagination computed ──────────────────────────────────────────────────────
const paginationStart = computed(() => {
  if (!pagination.value || !pagination.value.total || rows.value.length === 0) return 0
  const page = pagination.value.current_page || pagination.value.page || 1
  const perPage = pagination.value.limit || limit.value || 10
  return (page - 1) * perPage + 1
})
const paginationEnd = computed(() => {
  if (!pagination.value || !pagination.value.total || rows.value.length === 0) return 0
  const page = pagination.value.current_page || pagination.value.page || 1
  const perPage = pagination.value.limit || limit.value || 10
  return Math.min(page * perPage, pagination.value.total)
})
const paginationPages = computed(() => {
  if (!pagination.value) return []
  const total = pagination.value.total_pages || pagination.value.totalPages || 0
  const current = pagination.value.current_page || pagination.value.page || 1
  if (total === 0) return []
  const pages: number[] = []
  if (total <= 9) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    let start = Math.max(2, current - 3)
    let end = Math.min(total - 1, current + 3)
    if (current <= 4) end = 7
    if (current >= total - 3) start = total - 6
    for (let i = start; i <= end; i++) pages.push(i)
  }
  return pages
})

// ─── Fetch data ────────────────────────────────────────────────────────────────
function groupDuplicateRows(dataArray) {
  const grouped = new Map()
  dataArray.forEach((item) => {
    const key = item.id_request
    if (grouped.has(key)) {
      grouped.get(key).nomor_list.push(item.nomor)
    } else {
      grouped.set(key, {
        id_request: item.id_request,
        jenis: item.jenis,
        jabatan: item.jabatan || '-',
        perihal: item.perihal || '-',
        pengusul: item.nama_pengirim || '-',
        klasifikasi: item.klasifikasi || '-',
        klasifikasiDisplay: item.klasifikasi || '-',
        nomor_list: [item.nomor],
        tanggal: formatTanggalWIB(item.tanggal),
        waktu: formatWaktuWIB(item.waktu)
      })
    }
  })
  return Array.from(grouped.values())
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, limit: limit.value }
    if (searchQuery.value) params.search = searchQuery.value
    if (sortBy.value) {
      params.sort_by = sortBy.value
      params.sort_order = sortOrder.value
    }

    const response = await getListNomor(params)
    if (response?.data && Array.isArray(response.data)) {
      rows.value = groupDuplicateRows(response.data)
      pagination.value = response.pagination || null
    } else {
      rows.value = []
      pagination.value = null
    }
  } catch (error) {
    console.error('❌ Error fetch data:', error)
    rows.value = []
    pagination.value = null
  } finally {
    loading.value = false
  }
}

const openRowModal = async (row) => {
  selectedRow.value = row
  openPreview.value = true
  loadingDetail.value = true
  detailData.value = null
  fileStates.value = {}

  try {
    const detail = await getDetailNomor(row.id_request)
    if (!detail) throw new Error('Detail tidak ditemukan')
    const nomorList = (detail?.nomor_list || []).map((item, idx) => ({
      id: item.id || `${row.id_request}-${idx}`,
      nomor: item.nomor,
      status: item.status || 'terpakai',
      file_name: item.file_name ?? null,
      file_text: item.file_text ?? null,
      file_url: item.file_url ?? null
    }))
    detailData.value = {
      ...detail,
      perihal: detail.perihal || row.perihal || '-',
      jabatan: detail.jabatan || row.jabatan || '-',
      jenis: detail.jenis || row.jenis || '-',
      klasifikasiDisplay: detail.klasifikasi || row.klasifikasi || '-',
      tanggal: detail.tanggal || row.tanggal,
      nomor_list: nomorList
    }
  } catch (err) {
    console.error('❌ Error loading detail:', err)
    detailData.value = {
      ...row,
      klasifikasiDisplay: row.klasifikasi,
      nomor_list: (row.nomor_list || []).map((nomor, idx) => ({
        id: `${row.id_request}-${idx}`,
        nomor: typeof nomor === 'string' ? nomor : nomor.nomor,
        status: typeof nomor === 'string' ? 'terpakai' : nomor.status || 'terpakai',
        file_name: null,
        file_text: null,
        file_url: null
      }))
    }
  } finally {
    loadingDetail.value = false
  }
}

const handleSubmitFromModal = async (payload) => {
  try {
    const response = await createPenomoranFinal(payload)
    currentPage.value = 1
    sortBy.value = 'waktu'
    sortOrder.value = 'desc'
    searchQuery.value = ''
    await fetchData()
    showToastPenomoranSuccess(response?.data?.nomor_list?.length || payload.jumlah)
  } catch (error) {
    console.error('❌ Error di handleSubmitFromModal:', error)
  }
}

watch(refreshTrigger, () => {
  fetchData()
  if (openPreview.value && selectedRow.value) openRowModal(selectedRow.value)
})

watch(isOpenPreviewFile, (open) => {
  if (!open) previewPdfUrl.value = null
})

onMounted(async () => {
  loading.value = true
  sortBy.value = 'waktu'
  sortOrder.value = 'desc'
  await fetchData()
  loading.value = false
})

// ─── Tooltip ───────────────────────────────────────────────────────────────────
const tooltip = ref({ show: false, text: '', x: 0, y: 0 })
const onRowMouseMove = (e: MouseEvent, text: string) => {
  tooltip.value = {
    show: true,
    text,
    x: Math.min(e.clientX + 12, window.innerWidth - 200),
    y: Math.min(e.clientY + 12, window.innerHeight - 40)
  }
}
const onRowMouseLeave = () => {
  tooltip.value.show = false
}
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
thead th:last-child {
  z-index: 11;
}
tbody tr:hover td:last-child {
  background-color: rgb(249 250 251);
}
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
