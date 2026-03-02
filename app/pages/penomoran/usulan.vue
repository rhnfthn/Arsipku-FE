<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          {{ $t("usl_title") }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- ADD BUTTON -->
      <button
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        {{ $t("usl_btn_tambah") }}
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

        <!-- FILTER STATUS -->
        <div class="relative" data-custom-dropdown>
          <button
            type="button"
            @click.stop="openFilterStatus = !openFilterStatus"
            class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[180px] justify-between"
          >
            <span class="truncate">{{ selectedFilterLabel }}</span>
            <svg
              :class="[
                'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200',
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
          <Transition name="filter-dd">
            <div
              v-if="openFilterStatus"
              class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[200px]"
            >
              <button
                v-for="item in filterOptions"
                :key="item.value"
                type="button"
                @click.stop="selectFilterStatus(item.value)"
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                  filterStatus === item.value
                    ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                ]"
              >
                {{ item.label }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- SEARCH -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            @input="handleSearchInput"
            :placeholder="$t('usl_cari_placeholder')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs dark:text-gray-200 pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      </div>

      <!-- TABLE (includes skeleton rows in tbody) -->
      <div class="overflow-x-auto">
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
                  <span>{{ $t("usl_col_status") }}</span>
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
            <!-- ── SKELETON ROWS ── -->
            <tr
              v-if="loading"
              v-for="i in rowsPerPage"
              :key="`sk-${i}`"
              class="border-b border-gray-100 dark:border-gray-700"
            >
              <td class="px-5 py-4">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  :style="{ width: `${50 + (i % 3) * 15}%` }"
                ></div>
              </td>
              <td class="px-5 py-4">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"
                ></div>
              </td>
              <td class="px-5 py-4">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  :style="{ width: `${60 + (i % 4) * 10}%` }"
                ></div>
              </td>
              <td class="px-5 py-4">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  :style="{ width: `${45 + (i % 3) * 12}%` }"
                ></div>
              </td>
              <td class="px-5 py-4">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"
                ></div>
              </td>
              <td class="px-5 py-4">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  :style="{ width: `${40 + (i % 4) * 10}%` }"
                ></div>
              </td>
              <td class="px-5 py-4">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"
                ></div>
              </td>
              <!-- Status sticky -->
              <td
                class="sticky right-0 z-20 bg-white dark:bg-gray-800 px-5 py-4 border-l border-gray-200 dark:border-gray-700 shadow-[inset_1px_0_1px_-1px_rgba(0,0,0,9)]"
              >
                <div
                  class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-28"
                ></div>
              </td>
            </tr>

            <!-- ── EMPTY STATE ── -->
            <tr v-else-if="rows.length === 0">
              <td
                :colspan="headers.length + 1"
                class="py-20 text-center text-gray-500 dark:text-gray-400"
              >
                <p class="text-sm font-medium">{{ $t("usl_empty") }}</p>
              </td>
            </tr>

            <!-- ── DATA ROWS ── -->
            <tr
              v-else
              v-for="row in rows"
              :key="row.id"
              class="group hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition"
              @mousemove="onMouseMove($event, $t('usl_tooltip_detail'))"
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
                  {{ getRowStatusLabel(row.status) }}
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
          {{ $t("menampilkan") }} {{ rows.length }} {{ $t("dari") }}
          {{ pagination.total }} {{ $t("data") }}
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
            {{ $t("sebelumnya") }}
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
            {{ $t("selanjutnya") }}
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
      <template #title>
        <div class="flex justify-between items-center w-full px-5 pt-6 pb-3">
          <h2 class="text-lg font-semibold uppercase dark:text-gray-100">
            {{ selectedRow?.jenis_naskah || $t("detail") }}
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
          <p class="text-gray-500 dark:text-gray-400 text-xs">
            {{ $t("usl_detail_tanggal") }}
          </p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ formatDate(selectedRow.tanggal) }}
          </p>
        </div>

        <!-- Penandatangan -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">
            {{ $t("usl_detail_penandatangan") }}
          </p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ selectedRow.penandatangan || "-" }}
          </p>
        </div>

        <!-- Klasifikasi -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">
            {{ $t("usl_detail_klasifikasi") }}
          </p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{
              selectedRow.klasifikasiDisplay || selectedRow.klasifikasi || "-"
            }}
          </p>
        </div>

        <!-- Jenis Naskah -->
        <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400 text-xs">
            {{ $t("usl_detail_jenis_naskah") }}
          </p>
          <p class="font-medium mt-1 dark:text-gray-200">
            {{ selectedRow.jenis_naskah || "-" }}
          </p>
        </div>

        <!-- Nomor Surat -->
        <div class="mt-4">
          <label
            class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 break-words"
          >
            {{ $t("usl_nomor_surat") }} ({{ selectedRow?.jumlah ?? 0 }}
            {{ $t("usl_nomor_suffix") }})
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
              <!-- Nomor surat dengan status badge -->
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
                          'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400':
                            detail.status === 'hangus',
                          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400':
                            detail.status === 'terpakai_final',
                        },
                      ]"
                    >
                      {{ getDetailStatusLabel(detail.status) }}
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

              <!-- FILE SECTION -->
              <div class="mt-2">
                <!-- File sudah ada -->
                <div
                  v-if="detail.file_name || filesByIndex[idx]"
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
                          {{ detail.file_name || filesByIndex[idx]?.name }}
                        </p>
                        <p
                          class="text-xs text-gray-600 dark:text-gray-400 mt-0.5"
                        >
                          {{
                            filesByIndex[idx]
                              ? formatFileSize(filesByIndex[idx].size)
                              : $t("usl_file_klik_preview")
                          }}
                        </p>
                      </div>
                    </div>
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

                <!-- Upload form (belum ada file, status belum diajukan) -->
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
                        {{ $t("usl_file_pilih") }}
                      </span>
                      <span
                        class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5"
                      >
                        {{ $t("usl_file_format_hint") }}
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
                      {{ $t("usl_file_belum_ada") }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload info banner -->
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
            <p class="font-medium">{{ $t("usl_upload_info_title") }}</p>
            <p class="mt-1 text-blue-700 dark:text-blue-400">
              {{ $t("usl_upload_info_desc") }}
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
                {{ $t("usl_mengirim_usulan") }}
              </p>
              <p class="text-xs text-blue-700 dark:text-blue-400">
                {{ $t("usl_file_uploading") }}
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
          <button
            v-if="selectedRow?.status === 'Belum Diajukan'"
            @click="openConfirmSubmit = true"
            :disabled="isLoadingBooking || isDeletingUsulan || isUploadingFiles"
            class="flex-1 px-5 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span v-if="isUploadingFiles">{{ $t("usl_mengirim") }}</span>
            <span v-else>{{ $t("usl_btn_kirim") }}</span>
          </button>

          <button
            v-if="selectedRow?.status === 'Belum Diajukan'"
            @click="openConfirmDelete = true"
            :disabled="isLoadingBooking || isDeletingUsulan || isUploadingFiles"
            class="flex-1 px-5 py-2 text-sm border border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {{ $t("usl_btn_hapus_usulan") }}
          </button>
        </div>
      </template>
    </Modal>
  </Teleport>

  <!-- PREVIEW SLIDEOVER -->
  <USlideover
    v-model:open="isOpenPreview"
    :title="$t('usl_pratinjau')"
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
          <span class="text-gray-500">{{ $t("usl_memuat_pratinjau") }}</span>
        </div>
      </div>
    </template>
  </USlideover>

  <!-- CONFIRM SUBMIT POPUP -->
  <ConfirmPopup
    v-model="openConfirmSubmit"
    type="question"
    :title="$t('usl_confirm_kirim_title')"
    :message="getConfirmMessage()"
    :confirm-text="$t('usl_confirm_kirim_ya')"
    :cancel-text="$t('usl_batal')"
    :is-loading="isLoadingBooking"
    @confirm="confirmSubmitUsulan"
    @cancel="openConfirmSubmit = false"
  />

  <!-- CONFIRM DELETE POPUP -->
  <ConfirmPopup
    v-model="openConfirmDelete"
    type="danger"
    :title="$t('usl_confirm_hapus_title')"
    :message="$t('usl_confirm_hapus_pesan')"
    :confirm-text="$t('usl_confirm_hapus_ya')"
    :cancel-text="$t('usl_batal')"
    :is-loading="isDeletingUsulan"
    @confirm="confirmDeleteUsulan"
    @cancel="openConfirmDelete = false"
  />

  <!-- TOOLTIP -->
  <Teleport to="body">
    <div
      v-if="tooltip.show"
      class="fixed z-[9999] pointer-events-none bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md shadow-lg transition-opacity"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      {{ tooltip.text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { Search, ArrowUpDown, Plus, Copy } from "lucide-vue-next";
import AddUsulan from "~/components/AddUsulan.vue";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { Modal } from "#components";
import { usePenomoran } from "~/composables/usePenomoran";
import { useAuth } from "~/composables/useAuth";
import ConfirmPopup from "~/components/ConfirmPopup.vue";

definePageMeta({ middleware: "auth" });

const { t } = useI18n();
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

// ─── Breadcrumbs (reactive to locale) ────────
const breadcrumbs = computed(() => [
  { label: t("beranda"), to: "/beranda" },
  { label: t("usl_title"), to: "/penomoran/usulan" },
]);

// ─── Table headers (reactive to locale) ──────
const headers = computed(() => [
  { label: t("usl_col_jenis"), key: "jenis", sortable: true },
  { label: t("usl_col_tanggal"), key: "tanggal", sortable: true },
  { label: t("usl_col_perihal"), key: "perihal", sortable: false },
  { label: t("usl_col_penandatangan"), key: "penandatangan", sortable: false },
  { label: t("usl_col_jumlah"), key: "jumlah", sortable: false },
  { label: t("usl_col_pengusul"), key: "pengusul", sortable: false },
  { label: t("usl_col_tgl_usulan"), key: "tanggal_usulan", sortable: true },
]);

// ─── Filter options (label/value separated) ──
const filterOptions = computed(() => [
  { label: t("usl_filter_semua"), value: "Semua" },
  { label: t("usl_filter_belum_diajukan"), value: "Belum Diajukan" },
  { label: t("usl_filter_menunggu"), value: "Menunggu Verifikasi" },
  { label: t("usl_filter_disetujui"), value: "Disetujui" },
  { label: t("usl_filter_ditolak"), value: "Ditolak" },
]);

// Label currently selected filter (for button display)
const selectedFilterLabel = computed(() => {
  const found = filterOptions.value.find((o) => o.value === filterStatus.value);
  return found?.label ?? t("usl_filter_semua");
});

// ─── Row status display label ─────────────────
const getRowStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    "Belum Diajukan": t("usl_status_belum_diajukan"),
    "Menunggu Verifikasi": t("usl_status_menunggu_verifikasi"),
    Disetujui: t("usl_status_disetujui"),
    Ditolak: t("usl_status_ditolak"),
  };
  return map[status] || status;
};

// ─── Detail status badge label ───────────────
const getDetailStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: t("usl_status_pending"),
    menunggu: t("usl_status_menunggu"),
    booking: t("usl_status_booking"),
    terpakai: t("usl_status_terpakai"),
    terpakai_final: t("usl_status_final"),
    ditolak: t("usl_status_ditolak"),
    hangus: t("usl_status_hangus"),
  };
  return map[status] || status;
};

// State
const openDetail = ref(false);
const isDeletingUsulan = ref(false);
const isUploadingFiles = ref(false);
const selectedRow = ref(null);
const rows = ref([]);
const loading = ref<boolean>(true);
const pagination = ref(null);

const isOpenPreview = ref(false);
const pdfUrl = ref<string | null>(null);
const filesByIndex = ref<Record<number, File>>({});

const openAdd = ref<boolean>(false);
const openConfirmDelete = ref(false);
const openConfirmSubmit = ref(false);

const personMap = ref(new Map());
const klasifikasiMap = ref(new Map());

const search = ref<string>("");
const currentPage = ref<number>(1);
const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];

const sortBy = ref<string>("");
const sortOrder = ref<"asc" | "desc">("desc");
const filterStatus = ref<string>("Semua");
const openFilterStatus = ref<boolean>(false);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

/* ===========================
 * PREVIEW FILE
 * =========================== */
const previewFile = (detail: any) => {
  const url = detail.file_url;
  if (!url) {
    toast.add({
      title: t("usl_toast_file_tidak_ada_title"),
      description: t("usl_toast_file_tidak_ada_desc"),
      color: "warning",
    });
    return;
  }
  pdfUrl.value = url;
  isOpenPreview.value = true;
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
 * FETCH DATA
 * =========================== */
const fetchData = async () => {
  loading.value = true;
  try {
    if (!user.value?.position) {
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

    const response = await getListUsulan(String(user.value.position), params);
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
      if (
        !["Menunggu Verifikasi", "Disetujui", "Ditolak"].includes(mappedStatus)
      ) {
        mappedStatus = "Belum Diajukan";
      }

      const tanggalDate = new Date(item.tanggal);
      const formattedTanggal = `${String(tanggalDate.getUTCDate()).padStart(2, "0")}/${String(tanggalDate.getUTCMonth() + 1).padStart(2, "0")}/${tanggalDate.getUTCFullYear()}`;
      const localCreated = item.created_at
        .replace("Z", "")
        .replace("+00:00", "");
      const createdDate = new Date(localCreated);
      const day = String(createdDate.getDate()).padStart(2, "0");
      const month = String(createdDate.getMonth() + 1).padStart(2, "0");
      const year = String(createdDate.getFullYear()).slice(-2);
      const hours = String(createdDate.getHours()).padStart(2, "0");
      const minutes = String(createdDate.getMinutes()).padStart(2, "0");

      return {
        id: item.id,
        id_usulan: item.id,
        jenis: item.jenis,
        tanggal: formattedTanggal,
        perihal: item.perihal || "-",
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
  } catch (err) {
    console.error("❌ Gagal fetch data:", err);
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
 * OPEN ROW MODAL
 * =========================== */
const openRowModal = async (row) => {
  try {
    const detailData = await getDetailUsulan(row.id);
    if (!detailData) return;

    const klasifikasiDisplay =
      klasifikasiMap.value.get(detailData.klasifikasi) ||
      detailData.klasifikasi;

    const normalizedDetails = normalizeDetails(
      detailData.details || [],
      detailData.jumlah,
      detailData.template_nomor || "",
    );

    selectedRow.value = {
      id_usulan: detailData.id,
      jenis: detailData.jenis,
      jenis_naskah: detailData.jenis,
      tanggal: detailData.tanggal,
      perihal: detailData.perihal || "-",
      jumlah: detailData.jumlah,
      penandatangan: detailData.penandatangan || "-",
      klasifikasi: detailData.klasifikasi || "-",
      klasifikasiDisplay,
      status: detailData.status || row.status,
      template_nomor: detailData.template_nomor || "",
      details: normalizedDetails,
    };

    filesByIndex.value = {};
    openDetail.value = true;
  } catch (err) {
    console.error("❌ Gagal load detail:", err);
  }
};

/* ===========================
 * NORMALIZE DETAILS
 * =========================== */
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
  return result;
};

/* ===========================
 * FILE HANDLERS
 * =========================== */
const handleFile = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: t("usl_toast_file_besar_title"),
      description: t("usl_toast_file_besar_desc"),
      color: "warning",
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
      title: t("usl_toast_tipe_invalid_title"),
      description: t("usl_toast_tipe_invalid_desc"),
      color: "warning",
    });
    input.value = "";
    return;
  }

  filesByIndex.value[index] = file;
  toast.add({
    title: t("usl_toast_file_dipilih_title"),
    description: `"${file.name}" ${t("usl_toast_file_dipilih_desc")}`,
    color: "success",
  });
};

const removeFile = (index: number) => {
  delete filesByIndex.value[index];
  toast.add({
    title: t("usl_toast_file_dihapus_title"),
    description: t("usl_toast_file_dihapus_desc"),
    color: "success",
  });
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const handleCopy = (value: string) => {
  if (!value) return;
  navigator.clipboard.writeText(value);
  toast.add({
    title: t("usl_toast_tersalin"),
    description: `"${value}" ${t("usl_toast_tersalin_desc")}`,
    color: "success",
  });
};

function handlePreview(data: any) {
  selectedRow.value = data;
  openAdd.value = false;
  openDetail.value = true;
  filesByIndex.value = {};
}

const getConfirmMessage = () => {
  const fileCount = Object.keys(filesByIndex.value).length;
  if (fileCount === 0) return t("usl_confirm_kirim_tanpa_file");
  return `${t("usl_confirm_kirim_tanpa_file").replace("tanpa file", `dengan ${fileCount} file`)}`;
};

/* ===========================
 * CONFIRM SUBMIT USULAN
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
      title: t("usl_toast_berhasil"),
      description:
        fileCount > 0
          ? `${t("usl_toast_kirim_tanpa_file").replace("tanpa file", `dengan ${fileCount} file`)}`
          : t("usl_toast_kirim_tanpa_file"),
      color: "success",
    });

    filesByIndex.value = {};
    await fetchData();
  } catch (e) {
    console.error("❌ Submit error:", e);
    openConfirmSubmit.value = false;
    toast.add({
      title: t("usl_toast_gagal"),
      description: e?.response?.data?.message || t("usl_toast_gagal_kirim"),
      color: "error",
    });
  } finally {
    isUploadingFiles.value = false;
  }
};

/* ===========================
 * CONFIRM DELETE USULAN
 * =========================== */
const confirmDeleteUsulan = async () => {
  if (!selectedRow.value?.id_usulan) return;
  isDeletingUsulan.value = true;
  try {
    await deleteUsulanUser(selectedRow.value.id_usulan);
    toast.add({
      title: t("usl_toast_berhasil"),
      description: t("usl_toast_hapus_berhasil"),
      color: "success",
    });
    openConfirmDelete.value = false;
    openDetail.value = false;
    await fetchData();
  } catch (error) {
    console.error("❌ Delete gagal:", error);
    toast.add({
      title: t("usl_toast_gagal"),
      description: t("usl_toast_hapus_gagal"),
      color: "error",
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
        title: t("usl_toast_data_tidak_lengkap"),
        description: t("usl_toast_data_tidak_lengkap_desc"),
        color: "warning",
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

    await createUsulanDraft(formattedPayload);
    toast.add({
      title: t("usl_toast_berhasil"),
      description: t("usl_toast_hapus_berhasil").replace(
        "dihapus",
        "ditambahkan",
      ),
      color: "success",
    });
    openAdd.value = false;
    currentPage.value = 1;
    await fetchData();
  } catch (err) {
    console.error("❌ Error submit modal:", err);
    toast.add({
      title: t("usl_toast_gagal"),
      description:
        err?.response?.data?.message ||
        err?.message ||
        t("usl_toast_gagal_kirim"),
      color: "error",
    });
  } finally {
    isSubmittingUsulan.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const localStr = dateStr.replace("Z", "").replace("+00:00", "");
  return new Date(localStr).toLocaleDateString("id-ID", {
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
  await fetchData();
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  if (searchTimeout) clearTimeout(searchTimeout);
  pdfUrl.value = null;
});

watch(isOpenPreview, (open) => {
  if (!open) pdfUrl.value = null;
});

const tooltip = ref({ show: false, text: "", x: 0, y: 0 });

const onMouseMove = (e: MouseEvent, text: string) => {
  tooltip.value = { show: true, text, x: e.clientX + 12, y: e.clientY + 12 };
};

const onMouseLeave = () => {
  tooltip.value.show = false;
};
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
