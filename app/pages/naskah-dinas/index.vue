<template>
  <AccessDenied v-if="!canAccessPage()" />
  <template v-else>
  <div class="flex items-center justify-between w-full pt-5">
    <div>
      <Heading variant="heading6b" class="text-mobile-md dark:text-white">
        {{ $t('nm_title') }}
      </Heading>
      <PageHeader :items="items" />
    </div>
    <!-- ADD BUTTON -->
    <button
      v-if="hasPermission('naskah-masuk', 'create')"
      @click="openAddModal"
      class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition"
    >
      <Plus class="w-4 h-4" />
      {{ $t('nm_button') }}
    </button>
  </div>

  <div
    class="mt-5 flex flex-col w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div class="dark:border-gray-700">
      <!-- FILTER BAR -->
      <div class="flex gap-4 p-3 items-center flex-wrap">
        <button
          @click="toggleSort"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
        >
          <ArrowUpDown class="w-4 h-4" />
        </button>

        <button
          @click="refreshData"
          :disabled="pending"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 disabled:opacity-50"
        >
          <RotateCcw class="w-4 h-4" :class="pending ? 'animate-spin' : ''" />
        </button>

        <!-- CUSTOM FILTER DROPDOWN -->
        <div class="relative" data-custom-dropdown>
          <button
            class="flex items-center justify-between gap-2 text-xs px-3 py-1.5 rounded-lg min-w-auto border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            @click.stop="openFilterStatus = !openFilterStatus"
          >
            <span class="text-sm">
              {{ perPage === 'all' ? $t('semua') : ` ${perPage}` }}
            </span>
            <svg
              :class="[
                'w-4 h-4 transition-transform duration-200',
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

          <div
            v-if="openFilterStatus"
            class="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            <button
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
              @click.prevent="setPerPage('all')"
            >
              {{ $t('semua') }}
            </button>
            <button
              v-for="n in [5, 10, 20, 50]"
              :key="n"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
              @click.prevent="setPerPage(n)"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <!-- SEARCH INPUT -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            :placeholder="t('cari')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>

        <!-- Export -->
        <button
          v-if="hasPermission('naskah-masuk', 'export')"
          @click="onExport"
          class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap"
        >
          {{ $t('export') }}
        </button>
      </div>

      <!-- LIST TABLE -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="bg-primary-400 dark:bg-primary-700 text-white whitespace-nowrap text-left">
              <th class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700">
                {{ $t('tanggal') }}
              </th>
              <th class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700">
                {{ $t('asal_naskah') }}
              </th>
              <th class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700">
                {{ $t('Tertuju') }}
              </th>
              <th class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700">
                {{ $t('perihal') }}
              </th>
              <th class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700">
                {{ $t('pembuat') }}
              </th>
              <th class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700">
                Progress Verifikator
              </th>
              <th class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700 text-center">
                Jumlah Verifikator
              </th>
              <th class="px-4 py-3 border-b-2 border-b-gray-100 dark:border-b-gray-700 text-center">
                {{ $t('aksi') }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="pending">
              <td colspan="8" class="px-4 py-6">
                <div class="space-y-4 animate-pulse">
                  <div
                    v-for="n in skeletonRows"
                    :key="'skeleton-' + n"
                    class="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-700"
                  />
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="item in paginatedData"
              :key="item.id"
              class="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
            >
              <!-- TANGGAL -->
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <span v-html="highlight(formatDateSlash(item.tanggal), search)"></span>
              </td>

              <!-- ASAL NASKAH — nama + nomor dapat di-search -->
              <td class="px-4 py-3 text-black dark:text-gray-200 whitespace-nowrap">
                <div class="font-medium" v-html="highlight(item.pengirim?.nama || '-', search)" />
                <div
                  class="text-xs text-gray-500 dark:text-gray-400"
                  v-html="highlight(item.nomor || '-', search)"
                />
              </td>

              <!-- TERTUJU -->
              <td class="px-4 py-3 text-black dark:text-gray-200">
                <div
                  class="font-medium"
                  v-html="
                    highlight(item.penerima?.map((p: any) => p.position_text).join(', ') || '-', search)
                  "
                />
              </td>

              <!-- FILE PREVIEW SLIDEOVER -->
              <USlideover
                v-model:open="isOpenPreviewFile"
                :title="$t('nm_pratinjau_dokumen')"
                side="bottom"
                :dismissible="true"
                :ui="{ content: 'h-screen max-h-screen', body: 'p-0 h-full' }"
                class="z-[9999]"
              >
                <template #body>
                  <iframe
                    v-if="previewFileUrl"
                    :src="previewFileUrl"
                    class="w-full h-full"
                  ></iframe>
                </template>
              </USlideover>

              <!-- PERIHAL -->
              <td class="px-4 py-3 text-black dark:text-gray-200">
                <div class="flex flex-col gap-1">
                  <div class="font-medium" v-html="highlight(item.perihal || '-', search)" />
                  <button
                    v-if="item.final_pdf_url"
                    @click="openFinalPdf(item.final_pdf_url)"
                    class="inline-flex max-w-[220px] items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition cursor-pointer"
                    :title="getFileNameFromUrl(item.final_pdf_url)"
                  >
                    <FileText class="w-3 h-3 shrink-0" />
                    <span class="truncate">
                      {{ truncateFileName(getFileNameFromUrl(item.final_pdf_url), 28) }}
                    </span>
                  </button>
                </div>
              </td>

              <!-- PEMBUAT -->
              <td class="px-4 py-3 text-black dark:text-gray-200 whitespace-nowrap">
                <div
                  class="font-medium"
                  v-html="highlight(item.pembuat?.position_text || '-', search)"
                />
                <div
                  class="text-xs text-gray-500 dark:text-gray-400"
                  v-html="highlight(item.pembuat?.nama || '-', search)"
                />
              </td>

              <!-- PROGRESS VERIFIKATOR -->
              <td class="px-4 py-3 text-black dark:text-gray-200 min-w-[180px]">
                <div class="flex items-center gap-3">
                  <div class="h-2 w-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="getProgressBarClass(item)"
                      :style="{ width: `${getProgressPercent(item)}%` }"
                    />
                  </div>
                  <span class="text-xs font-medium">
                    {{ getProgressLabel(item) }}
                  </span>
                </div>
                <div class="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {{ getProgressStatusLabel(item) }}
                </div>
              </td>

              <!-- JUMLAH VERIFIKATOR -->
              <td class="px-4 py-3 text-center text-black dark:text-gray-200">
                {{ item.totalVerifikator || 0 }}
              </td>

              <!-- AKSI -->
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <button
                    v-if="hasPermission('naskah-masuk', 'read-verifikasi-detail')"
                    type="button"
                    class="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition"
                    title="Lihat"
                    @click="handleViewNaskah(item)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    v-if="canEditNaskah(item) && hasPermission('naskah-masuk', 'update-verifikasi')"
                    type="button"
                    class="p-2 text-primary dark:text-primary-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition"
                    title="Edit"
                    @click="openEditModal(item)"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- EMPTY STATE -->
            <tr v-if="!pending && paginatedData.length === 0">
              <td
                colspan="8"
                class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
              >
                {{ $t('tidak_ditemukan') }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- PAGINATION -->
        <div class="flex items-center justify-between px-4 py-3 dark:border-gray-700">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ $t('menampilkan') }}
            {{ paginatedData.length }}
            {{ $t('dari') }}
            {{ totalItems }}
            {{ $t('data') }}
          </div>

          <div class="flex items-center gap-2">
            <button
              :disabled="currentPage === 1"
              :class="[
                'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                currentPage === 1
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
              ]"
              @click="goToPage(currentPage - 1)"
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
                v-if="
                  paginationPages.length > 0 &&
                  typeof paginationPages[0] === 'number' &&
                  paginationPages[0] > 1
                "
                @click="goToPage(1)"
                class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all dark:text-gray-200"
              >
                1
              </button>

              <span
                v-if="
                  paginationPages.length > 0 &&
                  typeof paginationPages[0] === 'number' &&
                  paginationPages[0] > 2
                "
                class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >
                ...
              </span>

              <button
                v-for="(page, i) in paginationPages"
                :key="i"
                :class="[
                  'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                  page === currentPage
                    ? 'bg-primary text-white shadow-md'
                    : page === '...'
                      ? 'text-gray-400 dark:text-gray-500 cursor-default'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'
                ]"
                :disabled="page === '...'"
                @click="typeof page === 'number' && goToPage(page)"
              >
                {{ page }}
              </button>

              <span
                v-if="
                  paginationPages.length > 0 &&
                  typeof paginationPages[paginationPages.length - 1] === 'number' &&
                  Number(paginationPages[paginationPages.length - 1]) < totalPages - 1
                "
                class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >
                ...
              </span>

              <button
                v-if="
                  paginationPages.length > 0 &&
                  typeof paginationPages[paginationPages.length - 1] === 'number' &&
                  Number(paginationPages[paginationPages.length - 1]) < totalPages
                "
                @click="goToPage(totalPages)"
                class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all dark:text-gray-200"
              >
                {{ totalPages }}
              </button>
            </div>

            <button
              :disabled="currentPage === totalPages"
              :class="[
                'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                currentPage === totalPages
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
              ]"
              @click="goToPage(currentPage + 1)"
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
    </div>
  </div>

  <!-- ======= -->
  <!-- MODAL TAMBAH -->
  <!-- ======= -->
  <Teleport to="body">
    <Modal
      v-model="showAddModal"
      :saving="isSavingDelegasi"
      @save="saveDelegasi"
      @close="resetNewDelegasi"
      size="xl"
    >
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
          {{ isEditMode ? 'Edit Naskah Masuk' : $t('nm_modal_title') }}
        </Heading>
      </template>

      <div class="flex flex-col">
        <div class="flex flex-col gap-4 p-1 pb-4">
          <!-- 1. ASAL NASKAH -->
          <div class="flex flex-col relative z-30">
            <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
              {{ $t('nm_asalnaskah') }} <span class="text-red-500">*</span>
            </Heading>

            <div class="relative mt-1" data-custom-dropdown>
              <button
                :class="[
                  'w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
                  modalErrors.asal_naskah
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                ]"
                @click.stop="openNewAsalNaskah = !openNewAsalNaskah"
              >
                <span
                  :class="
                    newDelegasi.asal_naskah_label
                      ? 'text-gray-700 dark:text-gray-200'
                      : 'text-gray-400 dark:text-gray-500'
                  "
                >
                  {{ newDelegasi.asal_naskah_label || $t('nm_cari_asal_naskah') }}
                </span>
              </button>

              <div
                v-if="openNewAsalNaskah"
                class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
              >
                <div class="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                  <input
                    v-model="searchAsalNaskah"
                    type="text"
                    :placeholder="$t('nm_cari_asal_naskah')"
                    class="w-full px-2 py-1 text-xs border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 outline-none focus:ring-1 focus:ring-primary-500"
                    @click.stop
                  />
                </div>

                <div
                  v-if="loadingAsalNaskah"
                  class="px-3 py-2 text-xs text-gray-400 dark:text-gray-500"
                >
                  {{ $t('memuat_data') }}
                </div>

                <button
                  v-for="item in filteredAsalNaskahList"
                  :key="item.id"
                  class="w-full text-left px-3 py-2 mt-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                  @click.prevent="selectNewAsalNaskah(item)"
                >
                  {{ item.nama }}
                </button>

                <div
                  v-if="!loadingAsalNaskah && filteredAsalNaskahList.length === 0"
                  class="px-3 py-2 text-xs text-gray-400 dark:text-gray-500"
                >
                  {{ $t('tidak_ditemukan') }}
                </div>
              </div>
            </div>
            <p v-if="modalErrors.asal_naskah" class="text-xs text-red-500 mt-1">
              {{ $t('nm_asalnaskah') }}
            </p>
          </div>

          <!-- 2. NOMOR ASAL & TANGGAL SURAT -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20">
            <!-- NOMOR ASAL -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                {{ $t('nm_noasal') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="newDelegasi.nomor_asal"
                type="text"
                :class="[
                  'mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
                  modalErrors.nomor_asal
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                ]"
                :placeholder="$t('nm_masukan_nomor')"
                @input="modalErrors.nomor_asal = false"
              />
              <p v-if="modalErrors.nomor_asal" class="text-xs text-red-500 mt-1">
                {{ $t('nm_noasal') }}
              </p>
            </div>

            <!-- TANGGAL SURAT -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                {{ $t('nm_tanggalsurat') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="newDelegasi.tanggal_surat"
                type="date"
                :class="[
                  'mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
                  modalErrors.tanggal_surat
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                ]"
                @change="modalErrors.tanggal_surat = false"
              />
              <p v-if="modalErrors.tanggal_surat" class="text-xs text-red-500 mt-1">
                {{ $t('nm_tanggalsurat') }}
              </p>
            </div>
          </div>

          <!-- 3. JENIS NASKAH & SIFAT NASKAH -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20">
            <!-- JENIS NASKAH -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                {{ $t('nm_jenisnaskah') }}<span class="text-red-500">*</span>
              </Heading>
              <div class="relative mt-1" data-custom-dropdown>
                <button
                  :class="[
                    'w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
                    modalErrors.jenisnaskah
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  ]"
                  @click.stop="openNewJenisNaskah = !openNewJenisNaskah"
                >
                  <span
                    :class="
                      newDelegasi.jenisnaskah
                        ? 'text-gray-700 dark:text-gray-200'
                        : 'text-gray-400 dark:text-gray-500'
                    "
                  >
                    {{ newDelegasi.jenisnaskah || $t('nm_pilih_jenis_naskah') }}
                  </span>
                </button>

                <div
                  v-if="openNewJenisNaskah"
                  class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
                >
                  <button
                    v-for="p in jenisnaskahList"
                    :key="p.id"
                    class="w-full text-left px-3 py-2 mt-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                    @click.prevent="selectNewJenisNaskah(p.value)"
                  >
                    {{ p.label }}
                  </button>
                </div>
              </div>
              <p v-if="modalErrors.jenisnaskah" class="text-xs text-red-500 mt-1">
                {{ $t('nm_jenisnaskah') }}
              </p>
            </div>

            <!-- SIFAT NASKAH -->
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                {{ $t('nm_sifatnaskah') }} <span class="text-red-500">*</span>
              </Heading>
              <div class="relative mt-1" data-custom-dropdown>
                <button
                  :class="[
                    'w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
                    modalErrors.sifat_naskah
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  ]"
                  @click.stop="openNewSifatNaskah = !openNewSifatNaskah"
                >
                  <span
                    :class="
                      newDelegasi.sifat_naskah
                        ? 'text-gray-700 dark:text-gray-200'
                        : 'text-gray-400 dark:text-gray-500'
                    "
                  >
                    {{ sifatnaskahList.find(s => s.value === newDelegasi.sifat_naskah)?.label || newDelegasi.sifat_naskah || $t('nm_pilih_sifat_naskah') }}
                  </span>
                </button>

                <div
                  v-if="openNewSifatNaskah"
                  class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
                >
                  <button
                    v-for="s in sifatnaskahList"
                    :key="s.id"
                    class="w-full text-left px-3 py-2 mt-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                    @click.prevent="selectNewSifatNaskah(s.value)"
                  >
                    {{ s.label }}
                  </button>
                </div>
              </div>
              <p v-if="modalErrors.sifat_naskah" class="text-xs text-red-500 mt-1">
                {{ $t('nm_sifatnaskah') }}
              </p>
            </div>
          </div>

          <!-- 4. PERIHAL -->
          <div class="flex flex-col relative z-10">
            <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
              {{ $t('nm_perihal') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="newDelegasi.perihal"
              type="text"
              :class="[
                'mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
                modalErrors.perihal
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              ]"
              :placeholder="$t('nm_masukan_perihal')"
              @input="modalErrors.perihal = false"
            />
            <p v-if="modalErrors.perihal" class="text-xs text-red-500 mt-1">
              {{ $t('nm_perihal') }}
            </p>
          </div>

          <!-- 5. TERTUJU -->
          <div class="flex flex-col relative z-10">
            <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
              {{ $t('tertuju') }} <span class="text-red-500">*</span>
            </Heading>

            <div class="relative mt-1 dropdown-input" data-custom-dropdown>
              <div
                :class="[
                  'mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 flex flex-col gap-2',
                  modalErrors.tertuju ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                ]"
                @click.stop="openNewTertuju = true"
              >
                <!-- CHIP CONTAINER -->
                <div v-if="newDelegasi.tertuju.length > 0" class="flex flex-wrap gap-2">
                  <span
                    v-for="t in newDelegasi.tertuju"
                    :key="t.position"
                    class="flex flex-col bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs"
                  >
                    <span class="font-medium text-[13px] text-primary-400 dark:text-primary-300">
                      {{ t.position_text }}
                    </span>
                    <span class="text-[10px] text-gray-800 dark:text-gray-300">
                      {{ t.persnum_person_text }}
                    </span>
                    <span class="text-[9px] text-gray-400 dark:text-gray-500">
                      {{ t.organization_parent_text }}
                    </span>
                    <button
                      type="button"
                      class="text-red-500 text-[10px] self-end"
                      @click.stop="removeTertuju(t.position)"
                    >
                      ✕
                    </button>
                  </span>
                </div>

                <!-- INPUT SEARCH - SELALU DI BAWAH -->
                <input
                  v-model="searchTertuju"
                  @focus="openNewTertuju = true"
                  :placeholder="$t('nm_cari_tertuju')"
                  class="w-full outline-none text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                />
              </div>

              <div
                v-if="openNewTertuju"
                class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-auto"
              >
                <div
                  v-if="loadingTertuju"
                  class="px-3 py-2 text-xs text-gray-400 dark:text-gray-500"
                >
                  {{ $t('memuat_data') }}
                </div>

                <div
                  v-if="!loadingTertuju && filteredTertujuList.length === 0"
                  class="px-3 py-2 text-xs text-gray-400 dark:text-gray-500"
                >
                  {{ $t('tidak_ditemukan') }}
                </div>

                <button
                  v-for="item in filteredTertujuList"
                  :key="item.position"
                  class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
                  @click.prevent="selectNewTertuju(item)"
                >
                  <div class="font-medium text-[13px] text-primary-400 dark:text-primary-300">
                    {{ item.position_text }}
                  </div>
                  <div class="text-[10px] text-gray-800 dark:text-gray-300">
                    {{ item.persnum_person_text }}
                  </div>
                  <div class="text-[9px] text-gray-400 dark:text-gray-500">
                    {{ item.organization_parent_text }}
                  </div>
                </button>
              </div>
            </div>
            <p v-if="modalErrors.tertuju" class="text-xs text-red-500 mt-1">
              {{ $t('tertuju') }}
            </p>
          </div>

          <!-- 6. VERIFIKATOR -->
          <div class="flex flex-col relative z-10">
            <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
              Verifikator <span class="text-xs font-normal text-gray-400 dark:text-gray-400">(Opsional)</span>
            </Heading>

            <div class="relative mt-1 dropdown-input" data-custom-dropdown>
              <div
                class="mt-1 w-full text-left border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 flex flex-col gap-2 cursor-pointer"
                @click.stop="handleFocusVerifikator"
              >
                <!-- CHIP CONTAINER -->
                <div v-if="newDelegasi.verifikator.length > 0" class="flex flex-wrap gap-2">
                  <span
                    v-for="verifikator in newDelegasi.verifikator"
                    :key="verifikator.persnum"
                    class="flex flex-col bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs"
                  >
                    <span class="font-medium text-[13px] text-primary-400 dark:text-primary-300">
                      {{ verifikator.nama || '-' }}
                    </span>
                    <span class="text-[10px] text-gray-800 dark:text-gray-300">
                      {{ verifikator.jabatan || '-' }}
                    </span>
                    <button
                      type="button"
                      class="text-red-500 text-[10px] self-end"
                      @click.stop="removeVerifikator(verifikator.persnum)"
                    >
                      ✕
                    </button>
                  </span>
                </div>

                <!-- INPUT SEARCH -->
                <input
                  v-model="searchVerifikator"
                  @focus="handleFocusVerifikator"
                  placeholder="Cari verifikator"
                  class="w-full outline-none text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                />
              </div>

              <div
                v-if="openNewVerifikator"
                class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-auto"
              >
                <div
                  v-if="loadingVerifikator"
                  class="px-3 py-2 text-xs text-gray-400 dark:text-gray-500"
                >
                  {{ $t('memuat_data') }}
                </div>

                <div
                  v-if="!loadingVerifikator && filteredVerifikatorList.length === 0"
                  class="px-3 py-2 text-xs text-gray-400 dark:text-gray-500"
                >
                  {{ $t('tidak_ditemukan') }}
                </div>

                <button
                  v-for="verifikator in filteredVerifikatorList"
                  :key="verifikator.persnum"
                  class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
                  @click.prevent="selectVerifikator(verifikator)"
                >
                  <div class="font-medium text-[13px] text-primary-400 dark:text-primary-300">
                    {{ verifikator.nama || '-' }}
                  </div>
                  <div class="text-[10px] text-gray-800 dark:text-gray-300">
                    {{ verifikator.jabatan || '-' }}
                  </div>
                  <div class="text-[9px] text-gray-400 dark:text-gray-500">
                    {{ verifikator.lokasi || verifikator.areaText || '-' }}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- 7. LAMPIRAN (FILE UPLOAD) -->
          <div class="flex flex-col gap-2 relative z-0">
            <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
              {{ $t('nm_lampiran') }}
              <span v-if="!isEditMode" class="text-red-500">*</span>
            </Heading>

            <!-- Upload Box -->
            <label
              :class="[
                'group cursor-pointer border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 transition',
                modalErrors.file ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              ]"
            >
              <Upload
                :class="[
                  'w-6 h-6 group-hover:text-primary-400',
                  modalErrors.file ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'
                ]"
              />

              <p class="text-xs text-gray-600 dark:text-gray-400">
                {{ $t('nm_text1') }}
                <span class="text-primary-500 font-medium">{{ $t('nm_text2') }}</span>
              </p>

              <input
                type="file"
                class="hidden"
                @change="handleFileChange"
                accept=".pdf,application/pdf"
              />
            </label>

            <!-- File List -->
            <div
              v-if="isEditMode && selectedNaskah?.final_pdf_url && filesRef.length === 0"
              class="mt-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <FileText class="w-4 h-4 text-primary-400" />
                <span class="text-xs font-medium dark:text-gray-200">
                  File saat ini
                </span>
              </div>
              <button
                type="button"
                class="text-xs text-primary-500 hover:text-primary-700"
                @click="openFinalPdf(selectedNaskah.final_pdf_url, 'edit')"
              >
                Lihat
              </button>
            </div>

            <div v-if="filesRef.length" class="mt-2 space-y-2">
              <div
                v-for="(file, index) in filesRef"
                :key="index"
                class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2"
              >
                <div class="flex items-center gap-2">
                  <FileText class="w-4 h-4 text-primary-400" />
                  <div class="flex flex-col">
                    <span class="text-xs font-medium truncate max-w-[220px] dark:text-gray-200">
                      {{ file.name }}
                    </span>
                    <span class="text-[10px] text-gray-400 dark:text-gray-500">
                      {{ (file.size / 1024).toFixed(1) }} KB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  class="text-red-400 hover:text-red-600"
                  @click="filesRef.splice(index, 1)"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
            <p v-if="modalErrors.file" class="text-xs text-red-500 mt-1">
              {{ $t('nm_lampiran') }} wajib diisi
            </p>
          </div>
        </div>
      </div>
    </Modal>
  </Teleport>

  <!-- MODAL DETAIL -->
  <Teleport to="body">
    <Modal v-model="showDetailModal" :hideDefaultFooter="true" size="xl">
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
          Detail Naskah Masuk
        </Heading>
      </template>

      <div v-if="loadingDetail" class="p-10 text-center">
        <div class="inline-flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {{ $t('memuat_data') }}
        </div>
      </div>

      <div v-else-if="selectedDetail" class="px-5 pb-5 space-y-5 max-h-[75vh] overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-500 dark:text-gray-400 mb-1">{{ $t('nm_noasal') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedDetail.nomor || '-' }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400 mb-1">{{ $t('tanggal') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDateSlash(selectedDetail.tanggal) }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400 mb-1">{{ $t('asal_naskah') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ selectedDetail.pengirim?.nama || '-' }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400 mb-1">{{ $t('pembuat') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ selectedDetail.pembuat?.position_text || '-' }}
            </p>
          </div>
          <div class="md:col-span-2">
            <p class="text-gray-500 dark:text-gray-400 mb-1">{{ $t('perihal') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedDetail.perihal || '-' }}</p>
          </div>
          <div class="md:col-span-2">
            <p class="text-gray-500 dark:text-gray-400 mb-2">{{ $t('Tertuju') }}</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="penerima in selectedDetail.penerima || []"
                :key="penerima.position"
                class="px-2 py-1 text-xs rounded bg-blue-50 dark:bg-blue-900/40 text-primary-600 dark:text-blue-300"
              >
                {{ penerima.position_text }}
              </span>
              <span
                v-if="!selectedDetail.penerima?.length"
                class="text-sm text-gray-400 dark:text-gray-500"
              >
                -
              </span>
            </div>
          </div>
          <div class="md:col-span-2">
            <button
              v-if="selectedDetail.final_pdf_url"
              type="button"
              class="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-primary dark:text-blue-300 px-4 py-2 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition"
              @click="openFinalPdf(selectedDetail.final_pdf_url, 'detail')"
            >
              <FileText class="w-4 h-4" />
              {{ $t('nm_pratinjau_dokumen') }}
            </button>
          </div>
        </div>

        <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div class="px-4 py-3 bg-primary-400 dark:bg-primary-700 text-white text-sm font-semibold">
            Verifikator
          </div>
          <table class="w-full text-sm">
            <tbody>
              <tr v-if="!selectedDetail.verifikators?.length">
                <td class="p-4 text-center text-gray-400 dark:text-gray-500">
                  Tidak ada verifikator
                </td>
              </tr>
              <tr
                v-for="verifikator in selectedDetail.verifikators || []"
                :key="verifikator.id"
                class="border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <td class="p-3 w-12 text-gray-900 dark:text-white">
                  {{ verifikator.urutan }}
                </td>
                <td class="p-3">
                  <div class="font-semibold text-gray-900 dark:text-white">
                    {{ verifikator.nama || '-' }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ verifikator.jabatan || '-' }}
                  </div>
                </td>
                <td class="p-3 text-right">
                  <span
                    class="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                    :class="getVerifierStatusClass(verifikator.status)"
                  >
                    {{ getVerifierStatusLabel(verifikator.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  </Teleport>

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
          <span>Total: <span class="font-semibold text-gray-700 dark:text-gray-200">{{ filteredData.length }} baris</span></span>
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
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import type { BreadcrumbItem } from '@nuxt/ui';
import {
  Search,
  ArrowUpDown,
  RotateCcw,
  Plus,
  FileDown,
  Upload,
  FileText,
  X,
  Eye,
  Pencil,
  Check
} from 'lucide-vue-next';

import Modal from '~/components/Modal.vue';
import ConfirmPopup from '~/components/ConfirmPopup.vue';
import { useNaskahDinas } from '~/composables/useNaskahDinas';
import { useTertujuEksternal } from '~/composables/useTertujuEksternal';
import { useToast } from '#imports';
import { useAuth } from '~/composables/useAuth';
import { formatDateSlash } from '~/utils/mail-helpers';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

definePageMeta({
  middleware: 'auth'
});

const { t } = useI18n();

// ==============================
// STATE
// ==============================
const toast = useToast();
const search = ref('');
const sortDirection = ref<'asc' | 'desc' | null>('desc');
const showAddModal = ref(false);
const showDetailModal = ref(false);
const isEditMode = ref(false);
const selectedNaskah = ref<any | null>(null);
const selectedDetail = ref<any | null>(null);
const isSavingDelegasi = ref(false);
const searchTertuju = ref('');
const searchAsalNaskah = ref('');
const searchVerifikator = ref('');
const skeletonRows = computed(() => {
  if (perPage.value === 'all') return 10;
  return Number(perPage.value);
});

const items = [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_masuk'), to: '/naskah-dinas' }
] satisfies BreadcrumbItem[];

const { user, hasPermission } = useAuth();
const { canAccessPage } = useFeatureAccess();

const {
  items: listDelegasi,
  pending,
  error,
  fetchNaskahDinas,
  recipients: tertujuList,
  loadingRecipients: loadingTertuju,
  fetchRecipients,
  verifikatorList,
  loadingVerifikator,
  fetchVerifikator,
  loadingDetail,
  fetchNaskahDinasDetail,
  sendNaskahDinas,
  updateNaskahDinas
} = useNaskahDinas();

const {
  data: asalNaskahList,
  loading: loadingAsalNaskah,
  fetchTertujuEksternal
} = useTertujuEksternal();

onMounted(() => {
  if (!canAccessPage()) return;
  fetchNaskahDinas();
  fetchTertujuEksternal();
  fetchRecipients();
  fetchVerifikator();
  document.addEventListener('click', handleDocumentClick);
});

const filteredTertujuList = computed(() => {
  const keyword = searchTertuju.value.toLowerCase();
  if (!keyword) return tertujuList.value;
  return tertujuList.value.filter(
    (item) =>
      item.persnum_person_text?.toLowerCase().includes(keyword) ||
      item.position_text?.toLowerCase().includes(keyword) ||
      item.organization_parent_text?.toLowerCase().includes(keyword)
  );
});

const filteredAsalNaskahList = computed(() => {
  const keyword = searchAsalNaskah.value.toLowerCase();
  if (!keyword) return asalNaskahList.value;
  return asalNaskahList.value.filter((item) => item.nama?.toLowerCase().includes(keyword));
});

const filteredVerifikatorList = computed(() => {
  const selectedPersnums = new Set(newDelegasi.value.verifikator.map((item: any) => item.persnum));
  const keyword = searchVerifikator.value.toLowerCase();
  const available = verifikatorList.value.filter((item: any) => !selectedPersnums.has(item.persnum));

  if (!keyword) return available;

  return available.filter((item: any) =>
    `${item.nama || ''} ${item.jabatan || ''} ${item.lokasi || ''}`
      .toLowerCase()
      .includes(keyword)
  );
});

// ==============================
// HIGHLIGHT helper
// Membungkus teks yang cocok dengan <mark> untuk highlight hasil pencarian
// ==============================
function highlight(text: string, keyword: string): string {
  if (!keyword || !text) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">$1</mark>'
  );
}

// ==============================
// SORT & REFRESH
// ==============================
const toggleSort = () => {
  if (!sortDirection.value) sortDirection.value = 'asc';
  else if (sortDirection.value === 'asc') sortDirection.value = 'desc';
  else sortDirection.value = null;
};

const refreshData = async () => {
  search.value = '';
  sortDirection.value = null;
  currentPage.value = 1;
  await fetchNaskahDinas();
};

// ==============================
// FILTERED DATA
// Perbaikan: search mencakup pengirim.nama DAN pengirim.persnum_person_text DAN nomor
// ==============================
const filteredData = computed(() => {
  let data = [...listDelegasi.value];
  const keyword = search.value.toLowerCase().trim();

  if (keyword) {
    data = data.filter((item) => {
      // Kolom Tanggal (formatted Indonesia seperti master data)
      const waktu = formatTanggalJamIndonesia(item.tanggal, item.jam);
      const tanggalFormatted = (waktu.tanggal || '').toLowerCase();
      const tanggalSlash = (formatDateSlash(item.tanggal) || '').toLowerCase();
      const jamFormatted = (waktu.jam || '').toLowerCase();
      // Kolom Asal Naskah — nama pengirim
      const asalNaskahNama = (item.pengirim?.nama || '').toLowerCase();
      // Kolom Asal Naskah — persnum / kode pengirim (fallback)
      const asalNaskahPersnum = (item.pengirim?.persnum_person_text || '').toLowerCase();
      // Kolom Asal Naskah — nomor naskah (sub-baris di bawah nama)
      const nomor = (item.nomor || '').toLowerCase();
      // Kolom Tertuju
      const tertujuText = (item.penerima || [])
        .map((p: any) => `${p.position_text || ''} ${p.persnum_person_text || ''}`)
        .join(' ')
        .toLowerCase();
      // Kolom Perihal
      const perihal = (item.perihal || '').toLowerCase();
      // Kolom Pembuat
      const pembuat =
        `${item.pembuat?.position_text || ''} ${item.pembuat?.nama || ''}`.toLowerCase();
      const verifikatorText = (item.verifikators || [])
        .map((verifikator: any) => `${verifikator.nama || ''} ${verifikator.jabatan || ''}`)
        .join(' ')
        .toLowerCase();

      return (
        tanggalFormatted.includes(keyword) ||
        tanggalSlash.includes(keyword) ||
        jamFormatted.includes(keyword) ||
        asalNaskahNama.includes(keyword) ||
        asalNaskahPersnum.includes(keyword) ||
        nomor.includes(keyword) ||
        tertujuText.includes(keyword) ||
        perihal.includes(keyword) ||
        pembuat.includes(keyword) ||
        verifikatorText.includes(keyword)
      );
    });
  }

  data.sort((a, b) => {
    const dateA = parseUtcTanggalJam(a.tanggal, a.jam)?.getTime() ?? 0;
    const dateB = parseUtcTanggalJam(b.tanggal, b.jam)?.getTime() ?? 0;
    if (sortDirection.value !== 'asc') return dateB - dateA;
    return dateA - dateB;
  });

  return data;
});

// ==============================
// PAGINATION
// ==============================
const currentPage = ref(1);
const perPage = ref<number | 'all'>(10);

const totalItems = computed(() => filteredData.value.length);

const totalPages = computed(() => {
  if (perPage.value === 'all') return 1;
  return Math.ceil(totalItems.value / perPage.value);
});

const paginatedData = computed(() => {
  if (perPage.value === 'all') return filteredData.value;
  const start = (currentPage.value - 1) * perPage.value;
  return filteredData.value.slice(start, start + perPage.value);
});

const paginationPages = computed<(number | string)[]>(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 2) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 1) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(current - 2, current - 1, current, current + 1, current + 2);
    }
  }

  return pages;
});

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

// Reset ke halaman 1 saat search atau perPage berubah
watch([search, perPage], () => {
  currentPage.value = 1;
});

// ==============================
// MODAL ERRORS STATE
// ==============================
const modalErrors = ref({
  jenisnaskah: false,
  tanggal_surat: false,
  sifat_naskah: false,
  nomor_asal: false,
  asal_naskah: false,
  perihal: false,
  tertuju: false,
  verifikator: false,
  file: false
});

// ==============================
// ADD DELEGASI
// ==============================
const filesRef = ref<File[]>([]);

const lampiranText = computed(() => {
  const total = filesRef.value.length;
  if (isEditMode.value && total === 0 && selectedNaskah.value?.lampiran) {
    return selectedNaskah.value.lampiran;
  }
  return `${total} lampiran`;
});

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const newDelegasi = ref({
  jenisnaskah: '',
  tanggal_surat: getTodayDateString(),
  nomor_asal: '',
  sifat_naskah: 'Biasa',
  perihal: '',
  asal_naskah: null as string | null,
  asal_naskah_label: '',
  tertuju: [] as any[],
  tertuju_label: '',
  useVerifikator: false,
  verifikator: [] as any[]
});

const saveDelegasi = async () => {
  if (isSavingDelegasi.value) return;

  modalErrors.value.jenisnaskah = !newDelegasi.value.jenisnaskah;
  modalErrors.value.tanggal_surat = !newDelegasi.value.tanggal_surat;
  modalErrors.value.sifat_naskah = !newDelegasi.value.sifat_naskah;
  modalErrors.value.nomor_asal = !newDelegasi.value.nomor_asal.trim();
  modalErrors.value.asal_naskah = !newDelegasi.value.asal_naskah;
  modalErrors.value.perihal = !newDelegasi.value.perihal.trim();
  modalErrors.value.tertuju = newDelegasi.value.tertuju.length === 0;
  modalErrors.value.verifikator = false;
  modalErrors.value.file = !isEditMode.value && filesRef.value.length === 0;

  const emptyFields: string[] = [];
  if (modalErrors.value.jenisnaskah) emptyFields.push('Jenis Naskah');
  if (modalErrors.value.tanggal_surat) emptyFields.push('Tanggal Surat');
  if (modalErrors.value.sifat_naskah) emptyFields.push('Sifat Naskah');
  if (modalErrors.value.nomor_asal) emptyFields.push('Nomor Asal');
  if (modalErrors.value.asal_naskah) emptyFields.push('Asal Naskah');
  if (modalErrors.value.perihal) emptyFields.push('Perihal');
  if (modalErrors.value.tertuju) emptyFields.push('Tertuju Eksternal');
  if (modalErrors.value.file) emptyFields.push('Lampiran');

  if (emptyFields.length > 0) {
    toast.add({
      title: t('gagal'),
      description: `${emptyFields.join(', ')} wajib diisi`,
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return;
  }

  isSavingDelegasi.value = true;

  try {
    const payload = {
      asal_naskah: String(newDelegasi.value.asal_naskah),
      tertuju: newDelegasi.value.tertuju.map((t) => t.position),
      tanggal_surat: newDelegasi.value.tanggal_surat,
      nomor_asal: newDelegasi.value.nomor_asal,
      sifat_naskah: newDelegasi.value.sifat_naskah,
      perihal: newDelegasi.value.perihal,
      lampiran: lampiranText.value,
      file: filesRef.value,
      pembuat_id: Number(user.value?.position),
      verifikator: (newDelegasi.value.verifikator || []).map((verifikator: any) =>
        Number(verifikator.persnum)
      )
    };

    if (isEditMode.value && selectedNaskah.value?.id) {
      await updateNaskahDinas(selectedNaskah.value.id, payload);
    } else {
      await sendNaskahDinas(payload);
    }

    toast.add({
      title: t('berhasil'),
      description: isEditMode.value ? 'Naskah dinas berhasil diperbarui' : t('nm_berhasil_tambah'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    });

    resetNewDelegasi();
    showAddModal.value = false;
    fetchNaskahDinas();
  } catch (e) {
    console.error('Gagal kirim naskah dinas', e);
    toast.add({
      title: t('gagal'),
      description: t('nm_gagal_simpan'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
  } finally {
    isSavingDelegasi.value = false;
  }
};

// ==============================
// DROPDOWN DATA
// ==============================
const jenisnaskahList = [
  { id: 1, label: 'UND - Surat Undangan', value: 'Surat Undangan' },
  { id: 2, label: 'SDE - Surat Dinas Eksternal', value: 'Surat Dinas Eksternal' }
];

const sifatnaskahList = [
  { id: 1, label: 'Biasa/Terbuka', value: 'Biasa' },
  { id: 2, label: 'Terbatas', value: 'Terbatas' },
  { id: 3, label: 'Rahasia', value: 'Rahasia' },
  { id: 4, label: 'Sangat Rahasia', value: 'Sangat Rahasia' }
];

// ==============================
// DROPDOWN STATES & HANDLERS
// ==============================
const openFilterStatus = ref(false);
const openNewJenisNaskah = ref(false);
const openNewSifatNaskah = ref(false);
const openNewAsalNaskah = ref(false);
const openNewTertuju = ref(false);
const openNewVerifikator = ref(false);

const isOpenPreviewFile = ref(false);
const previewFileUrl = ref<string | null>(null);
const previewReturnTo = ref<'detail' | 'edit' | null>(null);

watch(isOpenPreviewFile, (isOpen) => {
  if (isOpen) return;
  previewFileUrl.value = null;

  if (previewReturnTo.value === 'detail') {
    showDetailModal.value = true;
  }

  if (previewReturnTo.value === 'edit') {
    showAddModal.value = true;
  }

  previewReturnTo.value = null;
});

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownEls = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) return;
  }
  openFilterStatus.value = false;
  openNewJenisNaskah.value = false;
  openNewSifatNaskah.value = false;
  openNewAsalNaskah.value = false;
  openNewTertuju.value = false;
  openNewVerifikator.value = false;
  searchTertuju.value = '';
  searchAsalNaskah.value = '';
  searchVerifikator.value = '';
}

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});

function selectNewJenisNaskah(val: string) {
  newDelegasi.value.jenisnaskah = val;
  modalErrors.value.jenisnaskah = false;
  openNewJenisNaskah.value = false;
}

function selectNewSifatNaskah(val: string) {
  newDelegasi.value.sifat_naskah = val;
  modalErrors.value.sifat_naskah = false;
  openNewSifatNaskah.value = false;
}

function selectNewAsalNaskah(item: { id: number | string; nama: string }) {
  newDelegasi.value.asal_naskah = String(item.id);
  newDelegasi.value.asal_naskah_label = item.nama;
  modalErrors.value.asal_naskah = false;
  openNewAsalNaskah.value = false;
  searchAsalNaskah.value = '';
}

function selectNewTertuju(item: any) {
  const exists = newDelegasi.value.tertuju.some((t) => t.position === item.position);
  if (!exists) {
    newDelegasi.value.tertuju.push(item);
    modalErrors.value.tertuju = false;
  }
  searchTertuju.value = '';
  openNewTertuju.value = false;
}

function removeTertuju(position: number) {
  newDelegasi.value.tertuju = newDelegasi.value.tertuju.filter((t) => t.position !== position);
}

async function handleFocusVerifikator() {
  openNewVerifikator.value = true;
  if (verifikatorList.value.length === 0) {
    await fetchVerifikator();
  }
}

function selectVerifikator(verifikator: any) {
  const exists = newDelegasi.value.verifikator.some(
    (item: any) => Number(item.persnum) === Number(verifikator.persnum)
  );

  if (!exists) {
    newDelegasi.value.verifikator.push(verifikator);
    modalErrors.value.verifikator = false;
  }

  searchVerifikator.value = '';
  openNewVerifikator.value = false;
}

function removeVerifikator(persnum: number) {
  newDelegasi.value.verifikator = newDelegasi.value.verifikator.filter(
    (item: any) => Number(item.persnum) !== Number(persnum)
  );
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];

  if (file.type !== 'application/pdf') {
    toast.add({
      title: t('nm_file_tidak_valid'),
      description: t('nm_file_hanya_pdf'),
      color: 'warning',
      icon: 'i-lucide-alert-circle'
    });
    input.value = '';
    return;
  }

  filesRef.value = [file];
  modalErrors.value.file = false;
  input.value = '';
}

function parseUtcTanggalJam(tanggal?: string, jam?: string) {
  if (!tanggal || !jam) return null;
  return new Date(`${tanggal}T${jam}Z`);
}

function formatTanggalJamIndonesia(tanggal?: string, jam?: string) {
  const date = parseUtcTanggalJam(tanggal, jam);
  if (!date) return { tanggal: '-', jam: '-' };
  return {
    tanggal: formatDateSlash(date.toISOString()),
    jam: date.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

function resetNewDelegasi() {
  newDelegasi.value = {
    jenisnaskah: '',
    tanggal_surat: getTodayDateString(),
    nomor_asal: '',
    sifat_naskah: 'Biasa',
    perihal: '',
    asal_naskah: null,
    asal_naskah_label: '',
    tertuju: [],
    tertuju_label: '',
    useVerifikator: false,
    verifikator: []
  };
  filesRef.value = [];
  searchTertuju.value = '';
  searchAsalNaskah.value = '';
  searchVerifikator.value = '';
  openNewJenisNaskah.value = false;
  openNewSifatNaskah.value = false;
  openNewAsalNaskah.value = false;
  openNewTertuju.value = false;
  openNewVerifikator.value = false;
  selectedNaskah.value = null;
  isEditMode.value = false;

  modalErrors.value = {
    jenisnaskah: false,
    tanggal_surat: false,
    sifat_naskah: false,
    nomor_asal: false,
    asal_naskah: false,
    perihal: false,
    tertuju: false,
    verifikator: false,
    file: false
  };
}

function openAddModal() {
  resetNewDelegasi();
  isEditMode.value = false;
  showAddModal.value = true;
  if (verifikatorList.value.length === 0) {
    fetchVerifikator();
  }
}

function populateFormFromNaskah(data: any) {
  selectedNaskah.value = data;
  newDelegasi.value = {
    jenisnaskah: data.jenis === 'SDE' ? 'Surat Dinas Eksternal' : data.jenis || '',
    tanggal_surat: data.tanggal || getTodayDateString(),
    nomor_asal: data.nomor || '',
    sifat_naskah: data.sifat || data.sifat_naskah || 'Biasa',
    perihal: data.perihal || '',
    asal_naskah: data.pengirim?.id ? String(data.pengirim.id) : null,
    asal_naskah_label: data.pengirim?.nama || '',
    tertuju: data.penerima || [],
    tertuju_label: '',
    useVerifikator: (data.verifikators || []).length > 0,
    verifikator: (data.verifikators || []).map((verifikator: any) => ({
      persnum: verifikator.persnum,
      nama: verifikator.nama,
      jabatan: verifikator.jabatan,
      lokasi: verifikator.lokasi,
      positionId: verifikator.positionId
    }))
  };
  filesRef.value = [];
}

async function openEditModal(item: any) {
  if (!canEditNaskah(item)) {
    toast.add({
      title: 'Tidak bisa diedit',
      description: 'Naskah sudah masuk tahap verifikator',
      color: 'warning',
      icon: 'i-lucide-alert-circle'
    });
    return;
  }

  resetNewDelegasi();
  isEditMode.value = true;
  selectedNaskah.value = item;
  showAddModal.value = true;

  try {
    const detailData = await fetchNaskahDinasDetail(item.id);
    populateFormFromNaskah(detailData || item);
    if (verifikatorList.value.length === 0) {
      await fetchVerifikator();
    }
  } catch (error) {
    populateFormFromNaskah(item);
    toast.add({
      title: t('gagal'),
      description: 'Gagal memuat detail edit, menggunakan data tabel',
      color: 'warning',
      icon: 'i-lucide-alert-circle'
    });
  }
}

async function handleViewNaskah(item: any) {
  selectedDetail.value = null;
  showDetailModal.value = true;

  try {
    selectedDetail.value = await fetchNaskahDinasDetail(item.id);
  } catch (error) {
    showDetailModal.value = false;
    toast.add({
      title: t('gagal'),
      description: 'Gagal memuat detail naskah',
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
  }
}

function getProgress(item: any) {
  return item.verifikatorProgress || {
    verified: 0,
    total: item.totalVerifikator || 0,
    rejected: 0,
    currentOrder: null,
    status: (item.totalVerifikator || 0) > 0 ? 'on_progress' : 'none'
  };
}

function isInVerifikatorStage(item: any) {
  const progress = getProgress(item);
  const totalVerifikator = Number(
    progress.total || item.totalVerifikator || item.verifikators?.length || 0
  );
  const progressStatus = progress.status || item.status_verifikasi || item.statusVerifikasi;

  return totalVerifikator > 0 || (progressStatus && progressStatus !== 'none');
}

function canEditNaskah(item: any) {
  return !isInVerifikatorStage(item);
}

function getProgressPercent(item: any) {
  const progress = getProgress(item);
  if (!progress.total) return 0;
  if (progress.status === 'rejected') return 100;
  return Math.round((progress.verified / progress.total) * 100);
}

function getProgressLabel(item: any) {
  const progress = getProgress(item);
  return `${progress.verified || 0}/${progress.total || 0}`;
}

function getProgressStatusLabel(item: any) {
  const progress = getProgress(item);
  const map: Record<string, string> = {
    none: 'Tanpa verifikator',
    on_progress: 'Berjalan',
    completed: 'Selesai',
    rejected: 'Ditolak'
  };
  return map[progress.status] || '-';
}

function getProgressBarClass(item: any) {
  const progress = getProgress(item);
  if (progress.status === 'rejected') return 'bg-red-500';
  if (progress.status === 'completed') return 'bg-green-500';
  return 'bg-primary-500';
}

function getVerifierStatusClass(status: string) {
  const map: Record<string, string> = {
    waiting: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    pending: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    verified: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  };
  return map[status] || map.pending;
}

function getVerifierStatusLabel(status: string) {
  const map: Record<string, string> = {
    waiting: 'Menunggu',
    pending: 'Pending',
    verified: 'Terverifikasi',
    rejected: 'Ditolak'
  };
  return map[status] || status;
}

function openFinalPdf(url?: string, source?: 'detail' | 'edit') {
  if (!url) return;
  if (source === 'detail' && showDetailModal.value) {
    previewReturnTo.value = 'detail';
    showDetailModal.value = false;
  }
  if (source === 'edit' && showAddModal.value) {
    previewReturnTo.value = 'edit';
    showAddModal.value = false;
  }
  previewFileUrl.value = url;
  isOpenPreviewFile.value = true;
}

function getFileNameFromUrl(url?: string) {
  if (!url) return '';
  try {
    const cleanUrl = url.split('?')[0];
    return decodeURIComponent(cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1));
  } catch {
    return '';
  }
}

function truncateFileName(name: string, maxLength = 25) {
  if (name.length <= maxLength) return name;
  const extIndex = name.lastIndexOf('.');
  if (extIndex === -1) return name.slice(0, maxLength) + '…';
  const ext = name.slice(extIndex);
  const base = name.slice(0, maxLength - ext.length - 1);
  return `${base}…${ext}`;
}

function setPerPage(val: number | 'all') {
  perPage.value = val;
  openFilterStatus.value = false;
}

// ==============================
// EXPORT DATA
// ==============================
const showExportModal = ref(false);
const selectedExportColumns = ref<string[]>([]);

const exportColumns = computed(() => [
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'tanggal', label: t('tanggal'), desc: 'Tanggal surat naskah dinas' },
  { key: 'jam', label: 'Jam', desc: 'Waktu surat dibuat' },
  { key: 'asal_naskah', label: t('asal_naskah'), desc: 'Instansi / nama pengirim' },
  { key: 'nomor_naskah', label: t('nm_noasal'), desc: 'Nomor surat asal naskah' },
  { key: 'tertuju', label: t('tertuju'), desc: 'Penerima naskah internal' },
  { key: 'perihal', label: t('perihal'), desc: 'Perihal / subjek surat' },
  { key: 'pembuat', label: t('pembuat'), desc: 'Nama penginput / pembuat naskah' },
  { key: 'jabatan_pembuat', label: 'Jabatan Pembuat', desc: 'Jabatan penginput / pembuat naskah' },
  { key: 'progress_verifikator', label: 'Progress Verifikator', desc: 'Status verifikasi naskah' },
  { key: 'jumlah_verifikator', label: 'Jumlah Verifikator', desc: 'Total verifikator naskah' },
  { key: 'verifikator', label: 'Verifikator', desc: 'Daftar nama verifikator' },
  { key: 'final_pdf_url', label: 'Link Dokumen PDF', desc: 'URL dokumen final PDF' }
]);

const allExportSelected = computed(
  () =>
    selectedExportColumns.value.length === exportColumns.value.length &&
    exportColumns.value.length > 0
);

const onExport = () => {
  if (filteredData.value.length === 0) {
    toast.add({
      title: t('export_tidak_ada'),
      description: t('export_data_kosong'),
      color: 'warning',
      icon: 'i-lucide-alert-circle'
    });
    return;
  }
  selectedExportColumns.value = exportColumns.value.map((c) => c.key);
  showExportModal.value = true;
};

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

  const excelData = filteredData.value.map((item, index) => {
    const waktu = formatTanggalJamIndonesia(item.tanggal, item.jam);
    const row: Record<string, any> = {};

    if (selectedKeys.includes('No')) row['No'] = index + 1;
    if (selectedKeys.includes('tanggal')) row[t('tanggal')] = formatDateSlash(item.tanggal);
    if (selectedKeys.includes('jam')) row['Jam'] = waktu.jam;
    if (selectedKeys.includes('asal_naskah')) row[t('asal_naskah')] = item.pengirim?.nama || '-';
    if (selectedKeys.includes('nomor_naskah')) row[t('nm_noasal')] = item.nomor || '-';
    if (selectedKeys.includes('tertuju'))
      row[t('tertuju')] = item.penerima?.map((p: any) => p.position_text).join(', ') || '-';
    if (selectedKeys.includes('perihal')) row[t('perihal')] = item.perihal || '-';
    if (selectedKeys.includes('pembuat')) row[t('pembuat')] = item.pembuat?.nama || '-';
    if (selectedKeys.includes('jabatan_pembuat'))
      row['Jabatan Pembuat'] = item.pembuat?.position_text || '-';
    if (selectedKeys.includes('progress_verifikator'))
      row['Progress Verifikator'] = getProgressLabel(item);
    if (selectedKeys.includes('jumlah_verifikator'))
      row['Jumlah Verifikator'] = item.totalVerifikator || 0;
    if (selectedKeys.includes('verifikator'))
      row['Verifikator'] = item.verifikators?.map((v: any) => v.nama).join(', ') || '-';
    if (selectedKeys.includes('final_pdf_url'))
      row['Final PDF URL'] = item.final_pdf_url || '-';

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Naskah Dinas');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const filename = `Naskah_Dinas_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, filename);

  toast.add({
    title: t('export_berhasil'),
    description: t('export_file_berhasil'),
    color: 'success',
    icon: 'i-lucide-check-circle'
  });

  showExportModal.value = false;
};
</script>

<style scoped>
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

[data-custom-dropdown] button:focus {
  outline: none;
  box-shadow: 0 0 0 1px rgb(59 130 246);
}

.modal-form input:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 1px rgb(59 130 246);
}

.dropdown-input input:focus {
  border: none;
  box-shadow: none;
}

.dropdown-input input {
  outline: none;
}

.modal-form input:focus,
.modal-form button:focus {
  outline: none;
}

.modal-form input::placeholder {
  color: rgb(156 163 175);
}

.dark .modal-form input::placeholder {
  color: rgb(107 114 128);
}
</style>
