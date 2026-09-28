<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <!-- Left Section - Title & Breadcrumb -->
      <PageHeader :title="$t('tertuju')" :items="items" />
      <button
        v-if="canCreateTertuju && activeTab === 'eksternal'"
        @click="openAddModal"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors"
      >
        <Plus class="w-4 h-4" />
        {{ $t('nm_button') }}
      </button>
    </div>

    <!-- Tab Bar: Tertuju Eksternal / Tertuju Internal -->
    <div class="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1.5 gap-2 w-fit mb-5">
      <button
        @click="activeTab = 'eksternal'"
        :class="[
          'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'eksternal'
            ? 'bg-primary text-white shadow-lg'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
        ]"
      >
        <UIcon name="i-lucide-building-2" class="w-4 h-4" />
        Tertuju Eksternal
      </button>
      <button
        @click="activeTab = 'internal'"
        :class="[
          'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'internal'
            ? 'bg-primary text-white shadow-lg'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
        ]"
      >
        <UIcon name="i-lucide-users" class="w-4 h-4" />
        Tertuju Internal
      </button>
    </div>

    <div
      v-if="activeTab === 'eksternal'"
      class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Top Bar -->
      <div class="flex flex-nowrap items-center gap-2 overflow-x-auto p-3">
        <!-- Rows per page (custom dropdown) -->
        <div class="relative">
          <button
            type="button"
            @click="openRowsDropdown = !openRowsDropdown"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
          >
            <span>{{ rowsPerPage }}</span>
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
                  rowsPerPage = n;
                  openRowsDropdown = false;
                "
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                  rowsPerPage === n
                    ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ n }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Status -->
        <USelectMenu
          v-model="filters.status"
          :items="externalStatusOptions"
          value-key="value"
          label-key="label"
          placeholder="Status"
          :search-input="false"
          class="w-36 shrink-0"
          :ui="{
            base: 'h-8 w-full bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-white',
          }"
          aria-label="Filter Status"
        />

        <!-- Search -->
        <div class="relative min-w-[220px] flex-1">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="filters.search"
            :placeholder="$t('cari')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>

        <!-- Reset Filter -->
        <button
          type="button"
          @click.stop="resetExternalFilters"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary bg-primary text-white transition-colors hover:bg-primary-700 hover:text-white dark:border-primary-500 dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700"
          title="Reset Filter"
          aria-label="Reset Filter"
        >
          <RotateCcw class="h-4 w-4" />
        </button>

        <!-- Export -->
        <button
          v-if="canExportTertuju"
          @click="onExport"
          class="flex shrink-0 items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap"
        >
          Export
        </button>
      </div>

      <!-- Table -->
      <table class="min-w-full text-sm">
        <thead class="text-left bg-primary-400 dark:bg-primary-700 text-white">
          <tr>
            <th @click="handleSort('kode')" class="cursor-pointer px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              <div class="flex items-center gap-2">
                <span>ID</span>
                <ArrowUpDown
                  class="w-4 h-4 origin-center transition-transform duration-300"
                  :class="[
                    sortColumn === 'kode'
                      ? sortDirection === 'desc'
                        ? 'rotate-180'
                        : 'rotate-0'
                      : 'opacity-50'
                  ]"
                />
              </div>
            </th>

            <th
              @click="handleSort('nama')"
              class="cursor-pointer px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold"
            >
              <div class="flex items-center gap-2">
                <span>{{ $t('te_nama') }}</span>
                <ArrowUpDown
                  class="w-4 h-4 origin-center transition-transform duration-300"
                  :class="[
                    sortColumn === 'nama'
                      ? sortDirection === 'desc'
                        ? 'rotate-180'
                        : 'rotate-0'
                      : 'opacity-50'
                  ]"
                />
              </div>
            </th>

            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              {{ $t('te_alamat') }}
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              {{ $t('te_telepon') }}
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              Email
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              Status
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              {{ $t('te_pengusul') }}
            </th>
            <th v-if="isSuperadmin" class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              {{ $t('aksi') }}
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Loading - Skeleton -->
          <tr v-if="loading">
            <td :colspan="isSuperadmin ? 8 : 7" class="px-4 py-6">
              <div class="space-y-4 animate-pulse">
                <div
                  v-for="n in skeletonRows"
                  :key="'skeleton-' + n"
                  class="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-700"
                />
              </div>
            </td>
          </tr>

          <!-- Data rows -->
          <tr
            v-else
            v-for="(item, idx) in paginatedData"
            :key="item.id"
            :class="[
              'hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-b-gray-200 dark:border-b-gray-700',
              idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
            ]"
          >
            <td
              class="px-4 py-3 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              <div class="flex items-center gap-2">
                <span>{{ item.kode || '-' }}</span>
                <button
                  v-if="item.kode"
                  type="button"
                  @click="copyKode(item.kode)"
                  class="shrink-0 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:text-primary-400 transition-colors"
                  :title="$t('te_copy_id') || 'Salin ID'"
                >
                  <Check v-if="copiedKode === item.kode" class="w-4 h-4 text-green-500" />
                  <Copy v-else class="w-4 h-4" />
                </button>
              </div>
            </td>

            <td
              class="px-4 py-3 font-medium text-gray-900 dark:text-white uppercase"
              v-html="highlight(item.nama, filters.search)"
            ></td>

            <td
              class="px-4 py-3 text-gray-700 dark:text-gray-300"
              v-html="highlight(item.alamat, filters.search)"
            ></td>

            <td
              class="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300"
              v-html="highlight(item.telepon, filters.search)"
            ></td>

            <td
              class="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300"
            >
              <div class="flex items-center gap-2">
                <span v-html="highlight(item.email || '-', filters.search)"></span>
                <button
                  v-if="item.email"
                  type="button"
                  @click="copyEmail(item.email)"
                  class="shrink-0 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:text-primary-400 transition-colors"
                  :title="$t('te_copy_email') || 'Salin Email'"
                >
                  <Check v-if="copiedEmail === item.email" class="w-4 h-4 text-green-500" />
                  <Copy v-else class="w-4 h-4" />
                </button>
              </div>
            </td>

            <td class="px-4 py-3">
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="
                  item.aktif
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
                "
              >
                {{ item.aktif ? $t('te_aktif') : $t('te_tidak_aktif') }}
              </span>
            </td>

            <td
              class="px-4 py-3 text-gray-700 dark:text-gray-300"
              v-html="highlight(item.nama_pembuat, filters.search)"
            ></td>

            <td v-if="isSuperadmin" class="px-4 py-3 text-center flex justify-center gap-3">
              <button
                v-if="canUpdateTertuju"
                @click="openEdit(item)"
                class="inline-flex h-8 w-8 items-center justify-center p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors group"
              >
                <Pencil
                  class="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600"
                />
              </button>

              <button
                v-if="canDeleteTertuju"
                class="inline-flex h-8 w-8 items-center justify-center p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                @click="handleDelete(item.id)"
              >
                <Trash2 class="w-4 h-4 text-red-600 dark:text-red-500 group-hover:text-red-600" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="filteredData.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ $t('menampilkan') }} {{ paginatedData.length }} {{ $t('dari') }}
          {{ filteredData.length }} {{ $t('data') }}
        </div>

        <div class="flex items-center gap-2">
          <!-- Back Button -->
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

          <!-- Page Numbers -->
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

          <!-- Next Button -->
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

    <!-- ===== TAB: TERTUJU INTERNAL (position dari org_data) ===== -->
    <div
      v-else
      class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Top Bar -->
      <div class="flex flex-nowrap items-center gap-2 overflow-x-auto p-3">
        <!-- Rows per page (custom dropdown) -->
        <div class="relative">
          <button
            type="button"
            @click="openInternalRowsDropdown = !openInternalRowsDropdown"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
          >
            <span>{{ internalPerPage }}</span>
            <ChevronDown
              class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': openInternalRowsDropdown }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openInternalRowsDropdown"
              class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                v-for="n in rowsChoices"
                :key="n"
                type="button"
                @click="
                  internalPerPage = n;
                  internalPage = 1;
                  openInternalRowsDropdown = false;
                "
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                  internalPerPage === n
                    ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ n }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Unit Organisasi -->
        <USelectMenu
          v-model="internalOrganizationFilter"
          :items="internalOrganizationOptions"
          placeholder="Unit Organisasi"
          searchable
          :search-input="{ placeholder: 'Cari unit organisasi...' }"
          :content="({ class: 'max-h-[380px]' } as any)"
          class="w-44 shrink-0"
          :ui="{
            base: 'h-8 w-full bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-white',
          }"
          aria-label="Filter Unit Organisasi"
        />

        <!-- Area -->
        <USelectMenu
          v-model="internalAreaFilter"
          :items="internalAreaOptions"
          placeholder="Area"
          searchable
          :search-input="{ placeholder: 'Cari area...' }"
          :content="({ class: 'max-h-[380px]' } as any)"
          class="w-36 shrink-0"
          :ui="{
            base: 'h-8 w-full bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-white',
          }"
          aria-label="Filter Area"
        />

        <!-- Search -->
        <div class="relative min-w-[220px] flex-1">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="internalSearch"
            placeholder="Cari jabatan atau nama..."
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>

        <!-- Reset Filter -->
        <button
          type="button"
          @click.stop="resetInternalFilters"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary bg-primary text-white transition-colors hover:bg-primary-700 hover:text-white dark:border-primary-500 dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700"
          title="Reset Filter"
          aria-label="Reset Filter"
        >
          <RotateCcw class="h-4 w-4" />
        </button>

        <!-- Export -->
        <button
          @click="onExportInternal"
          class="flex shrink-0 items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap"
        >
          Export
        </button>
      </div>

      <table class="min-w-full text-sm">
        <thead class="text-left bg-primary-400 dark:bg-primary-700 text-white">
          <tr>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              Position ID
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              Jabatan
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              Pejabat
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              Unit Organisasi
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              Area
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="internalLoading">
            <td colspan="5" class="px-4 py-6">
              <div class="space-y-4 animate-pulse">
                <div v-for="n in 5" :key="'sk-int-' + n" class="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
              </div>
            </td>
          </tr>
          <tr
            v-else-if="filteredInternal.length === 0"
          >
            <td colspan="5" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              Tidak ada data posisi internal.
            </td>
          </tr>
          <tr
            v-else
            v-for="(item, idx) in paginatedInternal"
            :key="item.position"
            class="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-b-gray-200 dark:border-b-gray-700"
          >
            <td class="px-4 py-3 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <span>{{ item.position || '-' }}</span>
                <button
                  v-if="item.position"
                  type="button"
                  @click="copyKode(String(item.position))"
                  class="shrink-0 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:text-primary-400 transition-colors"
                  title="Salin Position ID"
                >
                  <Check v-if="copiedKode === String(item.position)" class="w-4 h-4 text-green-500" />
                  <Copy v-else class="w-4 h-4" />
                </button>
              </div>
            </td>
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
              {{ item.position_text || '-' }}
            </td>
            <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
              {{ item.persnum_person_text || '-' }}
            </td>
            <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
              {{ item.organization_text || '-' }}
            </td>
            <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
              {{ formatArea(item.area_text) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination internal: gunakan komponen pagination bersama -->
      <Pagination
        v-if="filteredInternal.length > 0"
        :current-page="internalPage"
        :total-pages="internalTotalPages"
        :total-items="filteredInternal.length"
        :rows-per-page="internalPerPage"
        @update:page="internalPage = $event"
      />
    </div>

    <Teleport to="body">
      <Modal
        v-model="showModal"
        :saving="isSavingForm"
        @save="handleSave"
        size="xl"
        @close="resetForm"
      >
        <template #title>
          <Heading
            variant="heading9b"
            class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white"
          >
            {{ editId ? $t('te_modal_edit') : $t('te_modal_add') }}
          </Heading>
        </template>

        <div class="space-y-5 p-1">
          <!-- FIELD KODE (readonly) -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              ID
            </Heading>
            <div class="flex items-center gap-2 mt-1">
              <input
                :value="form.kode"
                type="text"
                readonly
                class="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-default"
              />
              <button
                v-if="form.kode"
                type="button"
                @click="copyKode(form.kode)"
                class="shrink-0 p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-400 transition-colors flex items-center justify-center"
                :title="$t('te_copy_id') || 'Salin ID'"
              >
                <Check v-if="copiedKode === form.kode" class="w-4 h-4 text-green-500" />
                <Copy v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- FIELD NAMA -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ $t('te_nama') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="form.nama"
              type="text"
              :placeholder="$t('te_nama_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.nama
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.nama = false; form.nama = form.nama.toUpperCase()"
            />
            <p v-if="formErrors.nama" class="text-xs text-red-500 mt-1">
              {{ $t('te_nama') }}
            </p>
          </div>

          <!-- FIELD ALAMAT -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ $t('te_alamat') }} <span class="text-red-500">*</span>
            </Heading>
            <textarea
              v-model="form.alamat"
              rows="3"
              :placeholder="$t('te_alamat_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.alamat
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.alamat = false"
            />
            <p v-if="formErrors.alamat" class="text-xs text-red-500 mt-1">
              {{ $t('te_alamat') }}
            </p>
          </div>

          <!-- FIELD TELEPON -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ $t('te_telepon') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="form.telephone"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="15"
              @keydown="onPhoneKeydown"
              @input="onPhoneInput"
              @paste="onPhonePaste"
              :placeholder="$t('te_telepon_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.telephone
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
            />
            <p v-if="formErrors.telephone" class="text-xs text-red-500 mt-1">
              {{ $t('te_telepon') }}
            </p>
          </div>

          <!-- FIELD EMAIL -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              Email <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="form.email"
              type="email"
              placeholder="email@example.com"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.email
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.email = false"
            />
            <p v-if="formErrors.email" class="text-xs text-red-500 mt-1">Email</p>
          </div>

          <!-- FIELD STATUS -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              Status <span class="text-red-500">*</span>
            </Heading>
            <select
              v-model="form.aktif"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-gray-200',
                formErrors.aktif
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @change="formErrors.aktif = false"
            >
              <option value="" disabled>{{ $t('te_status_placeholder') }}</option>
              <option :value="true">{{ $t('te_aktif') }}</option>
              <option :value="false">{{ $t('te_tidak_aktif') }}</option>
            </select>
            <p v-if="formErrors.aktif" class="text-xs text-red-500 mt-1">Status</p>
          </div>

          <!-- TANGGAL DIBUAT (hanya saat edit) -->
          <p v-if="editId && form.created_at" class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatDate(form.created_at) }}
          </p>
        </div>
      </Modal>
    </Teleport>

    <ConfirmPopup
      v-model="showConfirmDelete"
      type="danger"
      :title="$t('te_pop_title')"
      :message="$t('te_pop_desc')"
      :confirm-text="$t('popup_hapus')"
      :cancel-text="$t('popup_batal')"
      :is-loading="isDeleting"
      :require-confirmation="true"
      confirmation-text="KONFIRMASI HAPUS DATA"
      @confirm="confirmDelete"
      @cancel="showConfirmDelete = false"
    />
    <!-- POPUP PERINGATAN / TIDAK BISA DIHAPUS -->
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
              {{ $t('pilih_kolom_export') }}
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
              {{ allExportSelected ? 'Batal Pilih Semua' : $t('pilih_semua') }}
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
            <span>Total: <span class="font-semibold text-gray-700 dark:text-gray-200">{{ sortedData.length }} baris</span></span>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 flex-shrink-0 gap-3 px-5 py-3 mt-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
            <button
              type="button"
              @click="showExportModal = false"
              class="px-4 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            >
              {{ $t('batal') }}
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
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import {
  Search,
  FileDown,
  RotateCcw,
  Trash2,
  Pencil,
  Plus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Copy,
  Check
} from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useTertujuEksternal } from '~/composables/useTertujuEksternal';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import Modal from '@/components/Modal.vue';
import ConfirmPopup from '@/components/ConfirmPopup.vue';
import { useToast } from '#imports';

definePageMeta({
  middleware: 'auth',
  alias: [
    '/administrasi/datamaster/tertuju',
    '/administrasi/tertuju',
    '/utilitas/tertuju',
  ],
});

const { t } = useI18n();

const toast = useToast();

const showToast = (
  title: string,
  message: string,
  color: 'success' | 'error' | 'warning' | 'primary' = 'success'
) => {
  toast.add({
    title,
    description: message,
    color,
    icon:
      color === 'success'
        ? 'i-lucide-check-circle'
        : color === 'error'
          ? 'i-lucide-x-circle'
          : 'i-lucide-info'
  });
};

const route = useRoute();
const currentTertujuPath = computed(() => {
  const allowedPaths = [
    '/administrasi/datamaster/tertuju',
    '/administrasi/tertuju',
    '/utilitas/tertuju',
    '/master/tertuju-eksternal',
  ];

  return allowedPaths.includes(route.path) ? route.path : '/master/tertuju-eksternal';
});

const items = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('tertuju'), to: currentTertujuPath.value }
]);

const auth = useAuth();
const user = auth.user;
const { hasPermission, isSuperadmin } = auth;
// Master data Tertuju hanya dapat diubah oleh Super Admin.
// Admin/User tetap dapat membuka halaman dan melihat data.
const canCreateTertuju = computed(() => isSuperadmin.value);
const canUpdateTertuju = computed(() => isSuperadmin.value);
const canDeleteTertuju = computed(() => isSuperadmin.value);
const canExportTertuju = computed(
  () => isSuperadmin.value || hasPermission('master-data', 'export-tertuju')
);


const {
  data,
  loading,
  fetchTertujuEksternal,
  createTertujuEksternal,
  deleteTertujuEksternal,
  checkTertujuEksternalUsage,
  updateTertujuEksternal,
  generateKode
} = useTertujuEksternal();

// ===== Tab state =====
const activeTab = ref<'eksternal' | 'internal'>('eksternal');

// ===== Tertuju Internal (position dari org_data) =====
const { apiGet } = useApi();
const internalData = ref<any[]>([]);
const internalLoading = ref(false);
const internalSearch = ref('');
const internalPage = ref(1);
const internalPerPage = ref(10);
const openInternalRowsDropdown = ref(false);
const internalOrganizationFilter = ref<string | undefined>();
const internalAreaFilter = ref<string | undefined>();

const externalStatusOptions = computed(() => [
  { label: t('te_aktif'), value: 'aktif' },
  { label: t('te_tidak_aktif'), value: 'tidak_aktif' },
]);

const fetchInternal = async () => {
  internalLoading.value = true;
  try {
    const result: any = await apiGet(
      `/org-data/getdata?tgl=${new Date().toISOString().slice(0, 10)}`,
      {},
      { skipCache: true }
    );
    const rows = result?.data?.barisData || result?.barisData || [];
    internalData.value = rows;
  } catch (err) {
    console.error('Gagal memuat posisi internal:', err);
    internalData.value = [];
  } finally {
    internalLoading.value = false;
  }
};

const hasInternalOfficer = (item: any) => {
  const officer = String(item?.persnum_person_text ?? '').trim();
  return officer !== '' && officer !== '-';
};

const formatArea = (value: unknown) => {
  const area = String(value ?? '').trim();
  if (!area) return '-';
  return area.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
};

const internalRowsWithOfficer = computed(() => internalData.value.filter(hasInternalOfficer));

const internalOrganizationOptions = computed(() =>
  Array.from(
    new Set(
      internalRowsWithOfficer.value
        .map((item) => String(item.organization_text ?? '').trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'id'))
);

const internalAreaOptions = computed(() =>
  Array.from(
    new Set(
      internalRowsWithOfficer.value
        .map((item) => formatArea(item.area_text))
        .filter((area) => area !== '-')
    )
  ).sort((a, b) => a.localeCompare(b, 'id'))
);

const filteredInternal = computed(() => {
  const q = internalSearch.value.trim().toLowerCase();
  const organization = (internalOrganizationFilter.value ?? '').trim().toLowerCase();
  const area = (internalAreaFilter.value ?? '').trim().toLowerCase();

  return internalRowsWithOfficer.value.filter((item) => {
    const searchableText = [
      String(item.position ?? ''),
      item.position_text,
      item.persnum_person_text,
      item.organization_text,
      item.area_text,
    ]
      .join(' ')
      .toLowerCase();
    const itemOrganization = String(item.organization_text ?? '').trim().toLowerCase();
    const itemArea = formatArea(item.area_text).toLowerCase();

    return (
      (!q || searchableText.includes(q)) &&
      (!organization || itemOrganization === organization) &&
      (!area || itemArea === area)
    );
  });
});

const internalTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredInternal.value.length / internalPerPage.value))
);

const paginatedInternal = computed(() => {
  const start = (internalPage.value - 1) * internalPerPage.value;
  return filteredInternal.value.slice(start, start + internalPerPage.value);
});

const resetInternalFilters = () => {
  internalOrganizationFilter.value = undefined;
  internalAreaFilter.value = undefined;
  internalSearch.value = '';
  internalPage.value = 1;
  openInternalRowsDropdown.value = false;
};

const onExportInternal = () => {
  const exportData = filteredInternal.value.map((item, idx) => ({
    No: idx + 1,
    'Position ID': item.position ?? '-',
    Jabatan: item.position_text ?? '-',
    Pejabat: item.persnum_person_text ?? '-',
    'Unit Organisasi': item.organization_text ?? '-',
    Area: formatArea(item.area_text),
  }));

  if (exportData.length === 0) {
    showToast('Info', 'Tidak ada data untuk diekspor.', 'warning');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 40 },
    { wch: 30 },
    { wch: 30 },
    { wch: 25 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tertuju Internal');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `tertuju_internal_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

watch(activeTab, (tab) => {
  if (tab === 'internal' && internalData.value.length === 0) {
    fetchInternal();
  }
});

watch(internalSearch, () => {
  internalPage.value = 1;
});

watch([internalOrganizationFilter, internalAreaFilter], () => {
  internalPage.value = 1;
});

const handleSort = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
};

const form = ref({
  kode: '',
  nama: '',
  alamat: '',
  telephone: '',
  email: '',
  aktif: '' as boolean | '',
  created_at: '',
  updated_at: ''
});

const formErrors = ref({
  nama: false,
  alamat: false,
  telephone: false,
  email: false,
  aktif: false
});

onMounted(async () => {
  loading.value = true;
  await fetchTertujuEksternal();
  loading.value = false;
});

const showModal = ref(false);
const editId = ref<string | null>(null);
const isSavingForm = ref(false);

// Copy ID
const copiedKode = ref<string | null>(null);
const copyKode = async (kode: string) => {
  try {
    await navigator.clipboard.writeText(kode);
    copiedKode.value = kode;
    showToast('Berhasil', `ID ${kode} disalin.`, 'success');
    setTimeout(() => {
      if (copiedKode.value === kode) copiedKode.value = null;
    }, 2000);
  } catch {
    showToast('Gagal', 'Gagal menyalin ID.', 'error');
  }
};

// Copy Email
const copiedEmail = ref<string | null>(null);
const copyEmail = async (email: string) => {
  try {
    await navigator.clipboard.writeText(email);
    copiedEmail.value = email;
    showToast('Berhasil', `Email ${email} disalin.`, 'success');
    setTimeout(() => {
      if (copiedEmail.value === email) copiedEmail.value = null;
    }, 2000);
  } catch {
    showToast('Gagal', 'Gagal menyalin email.', 'error');
  }
};

// Format tanggal dibuat
const formatDate = (value: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('id-ID', { month: 'long' });
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} pukul ${hour}.${minute}`;
};

const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const currentPage = ref<number>(1);
const openRowsDropdown = ref(false);

// Default sort: data terbaru di atas (BE sudah urutkan created_at DESC,
// tapi FE sort ulang by nama — ubah ke created_at DESC).
const sortColumn = ref<string>('created_at');
const sortDirection = ref<'asc' | 'desc'>('desc');
const sortKey = ref('');
const sortOrder = ref('desc');

const onPhoneKeydown = (e: KeyboardEvent) => {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'];
  if (allowedKeys.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};

const onPhoneInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const digitsOnly = input.value.replace(/\D/g, '');
  if (input.value !== digitsOnly) {
    const cursorPos = (input.selectionStart ?? 0) - (input.value.length - digitsOnly.length);
    input.value = digitsOnly;
    input.setSelectionRange(cursorPos, cursorPos);
  }
  form.value.telephone = digitsOnly;
  formErrors.value.telephone = false;
};

const onPhonePaste = (e: ClipboardEvent) => {
  e.preventDefault();
  const pasted = e.clipboardData?.getData('text') ?? '';
  const digitsOnly = pasted.replace(/\D/g, '');
  const input = e.target as HTMLInputElement;
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? 0;
  const current = form.value.telephone;
  const newVal = current.slice(0, start) + digitsOnly + current.slice(end);
  form.value.telephone = newVal;
  const newCursor = start + digitsOnly.length;
  nextTick(() => {
    input.setSelectionRange(newCursor, newCursor);
  });
};

const handleSave = async () => {
  if (isSavingForm.value) return;

  formErrors.value.nama = !form.value.nama.trim();
  formErrors.value.alamat = !form.value.alamat.trim();
  formErrors.value.telephone = !form.value.telephone.trim();
  formErrors.value.email = !form.value.email.trim();
  formErrors.value.aktif = form.value.aktif === '';

  const emptyFields: string[] = [];
  if (formErrors.value.nama) emptyFields.push(t('te_nama') || 'Nama');
  if (formErrors.value.alamat) emptyFields.push(t('te_alamat') || 'Alamat');
  if (formErrors.value.telephone) emptyFields.push(t('te_telepon') || 'Telepon');
  if (formErrors.value.email) emptyFields.push('Email');
  if (formErrors.value.aktif) emptyFields.push('Status');

  if (emptyFields.length > 0) {
    showToast(t('gagal'), `${emptyFields.join(', ')} wajib diisi`, 'error');
    return;
  }

  isSavingForm.value = true;

  try {
    if (editId.value) {
      await updateTertujuEksternal(editId.value, {
        nama: form.value.nama,
        alamat: form.value.alamat,
        telepon: form.value.telephone,
        email: form.value.email,
        aktif: form.value.aktif as boolean
      });
      showToast('Berhasil', 'Data berhasil diperbarui.', 'success');
    } else {
      await createTertujuEksternal({
        id_position_pembuat: user.value?.position,
        company: 'MN',
        area: 'Regional 1',
        nama: form.value.nama,
        alamat: form.value.alamat,
        telepon: form.value.telephone,
        email: form.value.email,
        aktif: form.value.aktif as boolean
      });
      showToast('Berhasil', 'Data berhasil ditambahkan.', 'success');
    }

    await fetchTertujuEksternal();

    showModal.value = false;
    editId.value = null;

    form.value = {
      kode: '',
      nama: '',
      alamat: '',
      telephone: '',
      email: '',
      aktif: '',
      created_at: '',
      updated_at: ''
    };
  } catch (err: any) {
    const response = err?.response?.data ?? err?.data;
    console.error('Gagal menyimpan data:', response || err);
    showToast('Gagal', response?.message || 'Gagal menyimpan data.', 'error');
    return;
  } finally {
    isSavingForm.value = false;
  }
};

const showConfirmDelete = ref(false);
const showBlockedDeletePopup = ref(false);
const blockedDeleteMessage = ref('');
const deleteTargetId = ref<string | null>(null);
const isDeleting = ref(false);
const isCheckingDelete = ref(false);

const resetForm = () => {
  editId.value = null;
  form.value = {
    kode: '',
    nama: '',
    alamat: '',
    telephone: '',
    email: '',
    aktif: '',
    created_at: '',
    updated_at: ''
  };
  formErrors.value = {
    nama: false,
    alamat: false,
    telephone: false,
    email: false,
    aktif: false
  };
};

const openAddModal = async () => {
  resetForm();
  // Generate kode ID langsung saat modal dibuka
  try {
    form.value.kode = await generateKode();
  } catch {
    form.value.kode = '';
  }
  showModal.value = true;
};

const handleDelete = (id: string) => {
  deleteTargetId.value = id;
  showConfirmDelete.value = true;
};

const confirmDelete = async () => {
  if (!deleteTargetId.value) return;
  try {
    isDeleting.value = true;
    await deleteTertujuEksternal(deleteTargetId.value);
    showToast('Berhasil', 'Data berhasil dinonaktifkan.', 'success');
    showConfirmDelete.value = false;
  } catch (err: any) {
    const response = err?.response?.data ?? err?.data;
    console.error('Gagal menghapus data:', response || err);
    showToast('Gagal', response?.message || 'Gagal menghapus data.', 'error');
  } finally {
    isDeleting.value = false;
    deleteTargetId.value = null;
  }
};

const openEdit = (item: any) => {
  editId.value = item.id;
  form.value = {
    kode: item.kode || '',
    nama: item.nama,
    alamat: item.alamat,
    telephone: item.telepon,
    email: item.email || '',
    aktif: item.aktif,
    created_at: item.created_at || '',
    updated_at: item.updated_at || ''
  };
  showModal.value = true;
};

const filters = ref({
  jenis: '',
  lokasi: '',
  status: '',
  tahun: '',
  search: ''
});

const filteredData = computed(() => {
  const keyword = filters.value.search.toLowerCase();
  const status = filters.value.status;
  return data.value.filter((item) => {
    const matchesStatus =
      !status || (status === 'aktif' ? item.aktif : !item.aktif);
    const matchesSearch = [
      item.company,
      item.area,
      item.nama,
      item.alamat,
      item.telepon,
      item.email,
      item.kontak,
      item.nama_pembuat,
    ]
      .join(' ')
      .toLowerCase()
      .includes(keyword);

    return matchesStatus && matchesSearch;
  });
});

const sortedData = computed(() => {
  const sorted = [...filteredData.value];
  // created_at: handle sebagai Date ISO string
  if (sortColumn.value === 'created_at') {
    sorted.sort((a, b) => {
      const aT = new Date((a as any).created_at || 0).getTime();
      const bT = new Date((b as any).created_at || 0).getTime();
      return sortDirection.value === 'asc' ? aT - bT : bT - aT;
    });
    return sorted;
  }
  sorted.sort((a, b) => {
    const aVal = String((a as any)[sortColumn.value] || '').toLowerCase();
    const bVal = String((b as any)[sortColumn.value] || '').toLowerCase();
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedData.value.length / rowsPerPage.value))
);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedData.value.slice(start, start + rowsPerPage.value);
});

const skeletonRows = computed(() => rowsPerPage.value);

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

const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
};

watch([() => filters.value.search, () => filters.value.status, rowsPerPage], () => {
  currentPage.value = 1;
});

const resetExternalFilters = () => {
  filters.value = {
    jenis: '',
    lokasi: '',
    status: '',
    tahun: '',
    search: ''
  };
  currentPage.value = 1;
  openRowsDropdown.value = false;
};

const onExport = () => {
  if (sortedData.value.length === 0) {
    showToast(t('te_gagal') || 'Info', 'Tidak ada data untuk diekspor.', 'warning');
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

// Kolom yang bisa dipilih untuk export
const exportColumns = computed(() => [
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'ID', label: 'ID', desc: 'Kode identifikasi unik' },
  { key: 'nama', label: t('te_nama'), desc: 'Nama instansi / entitas' },
  { key: 'alamat', label: t('te_alamat'), desc: 'Lokasi alamat lengkap' },
  { key: 'telepon', label: t('te_telepon'), desc: 'Nomor kontak telepon' },
  { key: 'email', label: 'Email', desc: 'Alamat surat elektronik' },
  { key: 'status', label: 'Status', desc: 'Status keaktifan tertuju' },
  { key: 'pengusul', label: t('te_pengusul'), desc: 'Pejabat pembuat data' },
  { key: 'tgl_dibuat', label: 'Tanggal Dibuat', desc: 'Tanggal pembuatan data' }
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
  const exportData = sortedData.value.map((item, idx) => {
    const row: Record<string, any> = {};
    if (selectedKeys.includes('No')) row['No'] = idx + 1;
    if (selectedKeys.includes('ID')) row['ID'] = item.kode || '-';
    if (selectedKeys.includes('nama')) row[t('te_nama')] = item.nama;
    if (selectedKeys.includes('alamat')) row[t('te_alamat')] = item.alamat;
    if (selectedKeys.includes('telepon')) row[t('te_telepon')] = item.telepon || '-';
    if (selectedKeys.includes('email')) row['Email'] = item.email || '-';
    if (selectedKeys.includes('status')) row['Status'] = item.aktif ? t('te_aktif') : t('te_tidak_aktif');
    if (selectedKeys.includes('pengusul')) row[t('te_pengusul')] = item.nama_pembuat || '-';
    if (selectedKeys.includes('tgl_dibuat')) row['Tanggal Dibuat'] = formatDateDot(item.created_at);
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t('tertuju'));
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `tertuju_eksternal_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast(t('te_berhasil') || 'Berhasil', 'Export berhasil.', 'success');
  showExportModal.value = false;
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

.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.15s ease;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.sort-animate {
  animation: sortPulse 0.25s ease;
}

@keyframes sortPulse {
  0% {
    transform: scale(0.7) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
    opacity: 0.9;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

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
</style>
