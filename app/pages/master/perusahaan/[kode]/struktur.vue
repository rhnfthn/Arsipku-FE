<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <EmptyState
      v-if="!canViewMaster"
      icon="i-lucide-lock"
      title="Akses Ditolak"
      description="Anda tidak punya izin melihat master data. Hubungi administrator."
    />
    <div v-else class="max-w-7xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ $t('stu_title') }}
          </h1>
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <NuxtLink
              to="/beranda"
              class="text-gray-500 dark:text-gray-400 font-medium hover:text-primary dark:hover:text-primary-400 transition-colors text-xs"
            >
              {{ $t('beranda') }}
            </NuxtLink>
            <span class="mx-1.5 text-gray-400 dark:text-gray-500 text-xs">/</span>
            <NuxtLink
              to="/master/perusahaan"
              class="text-gray-500 dark:text-gray-400 font-medium hover:text-primary dark:hover:text-primary-400 transition-colors text-xs"
            >
              {{ $t('stu_breadcrumb_master') }}
            </NuxtLink>
            <span class="mx-1.5 text-gray-400 dark:text-gray-500 text-xs">/</span>
            <span class="text-primary-400 dark:text-primary-300 font-semibold text-xs">
              {{ $t('stu_title') }}
            </span>
          </nav>
        </div>
        <NuxtLink
          :to="`/master/perusahaan/${route.params.kode}/area`"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
        >
          <MapPin class="w-4 h-4" />
          {{ $t('stu_kelola_area') }}
        </NuxtLink>
      </div>

      <!-- Search Bar -->
      <div class="mb-6">
        <div class="max-w-6xl search-suggestion-container">
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400"
              >Cari berdasarkan:</span
            >
            <button
              type="button"
              @click="setSearchScope('organization')"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                searchScope === 'organization'
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300'
              ]"
            >
              Unit
            </button>
            <button
              type="button"
              @click="setSearchScope('position')"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                searchScope === 'position'
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300'
              ]"
            >
              Posisi
            </button>
            <button
              type="button"
              @click="setSearchScope('person')"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                searchScope === 'person'
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300'
              ]"
            >
              Nama
            </button>
          </div>

          <div class="relative">
            <Search
              class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="searchQuery"
              @input="handleSearch"
              @focus="onSearchFocus"
              @blur="hideSearchSuggestions"
              @keydown.enter.prevent="selectFirstSuggestion"
              @keydown.escape="showSearchSuggestions = false"
              :disabled="!searchScope"
              :placeholder="getSearchPlaceholder()"
              :class="[
                'w-full pl-12 pr-12 py-4 border-2 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                searchScope
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              ]"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X class="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>

            <!-- Search Suggestions -->
            <div
              v-if="showSearchSuggestions && searchQuery.trim().length >= SEARCH_MIN_LENGTH"
              class="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
            >
              <div v-if="searchSuggestions.length > 0" class="max-h-80 overflow-y-auto">
                <button
                  v-for="item in searchSuggestions"
                  :key="item.key"
                  type="button"
                  @mousedown.prevent="selectSearchSuggestion(item)"
                  class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div class="flex items-start gap-3">
                    <component
                      :is="getSuggestionIcon(item.type)"
                      class="w-4 h-4 mt-0.5 text-gray-500 dark:text-gray-400"
                    />
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {{ item.title }}
                      </p>
                      <div class="mt-1 flex items-center gap-2">
                        <span
                          :class="[
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize',
                            getSuggestionBadgeClass(item.type)
                          ]"
                        >
                          {{ getSuggestionTypeLabel(item.type) }}
                        </span>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {{ item.subtitle }}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div
                v-else-if="!loadingSearch"
                class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
              >
                Tidak ada suggestion untuk "{{ searchQuery }}"
              </div>
            </div>
          </div>
        </div>

        <!-- Search Results Info -->
        <div v-if="searchQuery && !loadingSearch && !loadingExpand" class="mt-4 space-y-2">
          <!-- Summary -->
          <div class="flex flex-wrap items-center gap-4">
            <div
              v-if="searchResults.organizations.length > 0"
              class="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary border border-primary-200 dark:border-primary-800 rounded-lg"
            >
              <Building class="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span class="text-sm">
                <span class="font-semibold text-primary-700 dark:text-primary-300">
                  {{ searchResults.organizations.length }}
                </span>
                <span class="text-primary-600 dark:text-primary-400">
                  {{ $t('stu_label_unit') }}
                </span>
              </span>
            </div>

            <div
              v-if="searchResults.positions.length > 0"
              class="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
            >
              <User class="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span class="text-sm">
                <span class="font-semibold text-orange-700 dark:text-orange-300">
                  {{ searchResults.positions.length }}
                </span>
                <span class="text-orange-600 dark:text-orange-400">
                  {{ $t('stu_label_posisi') }}
                </span>
              </span>
            </div>

            <div
              v-if="searchResults.persons.length > 0"
              class="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <Users class="w-4 h-4 text-green-600 dark:text-green-400" />
              <span class="text-sm">
                <span class="font-semibold text-green-700 dark:text-green-300">
                  {{ searchResults.persons.length }}
                </span>
                <span class="text-green-600 dark:text-green-400">
                  {{ $t('stu_label_anggota') }}
                </span>
              </span>
            </div>

            <p v-if="totalResults > 0" class="text-sm text-gray-600 dark:text-gray-400 ml-auto">
              {{ $t('stu_total_hasil') }}
              <span class="font-semibold text-primary-600 dark:text-primary-400">
                {{ totalResults }}
              </span>
              {{ $t('stu_hasil_untuk') }} " <span class="font-medium">{{ searchQuery }}</span
              >"
            </p>
          </div>

          <!-- No Results -->
          <div
            v-if="totalResults === 0"
            class="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <AlertCircle class="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('stu_tidak_ada_hasil') }} "{{ searchQuery }}"
            </p>
          </div>
        </div>

        <div v-if="loadingSearch || loadingExpand" class="mt-3 flex items-center gap-2">
          <div
            class="w-4 h-4 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"
          ></div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ loadingSearch ? $t('stu_loading_search') : $t('stu_loading_expand') }}
          </p>
        </div>
      </div>

      <!-- Organization Tree Card -->
      <div
        class="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden"
      >
        <!-- Company Header -->
        <div
          class="bg-gradient-to-r from-primary to-primary-600 dark:from-primary-700 dark:to-primary-800 text-white px-6 py-5"
          v-if="company"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button
                @click="companyExpanded = !companyExpanded"
                class="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronDown v-if="companyExpanded" class="w-5 h-5 text-white" />
                <ChevronRight v-else class="w-5 h-5 text-white" />
              </button>
              <Building2 class="w-6 h-6" />
              <div>
                <h2 class="text-xl font-bold">{{ company.namaPanjang }}</h2>
                <p class="text-primary-100 text-sm mt-1">
                  {{ formatDate(company.tanggalMulai) }} -
                  {{ formatDate(company.tanggalBerakhir) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="openAddUnitModal(null, 'company')"
                class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/90 rounded-lg transition-colors text-primary-600 text-sm font-medium shadow-sm"
              >
                <Plus class="w-4 h-4" />
                {{ $t('stu_tambah_unit') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Organization Tree -->
        <div v-if="companyExpanded" class="p-8" ref="treeContainer">
          <div v-if="displayTree.length === 0" class="text-center py-12">
            <Building class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400 text-lg">
              {{ $t('stu_belum_ada_struktur') }}
            </p>
            <button
              @click="openAddUnitModal(null, 'company')"
              class="mt-4 flex items-center gap-2 mx-auto px-6 py-3 bg-primary hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus class="w-4 h-4" />
              {{ $t('stu_tambah_unit_pertama') }}
            </button>
          </div>

          <Organization
            v-for="(node, idx) in displayTree"
            :key="node.id"
            :node="node"
            :level="0"
            :is-last="idx === displayTree.length - 1"
            :expanded-nodes="expandedNodes"
            :hovered-node="hoveredNode"
            :search-query="searchQuery"
            :search-results="searchResultsMap"
            :highlight-node-id="highlightNodeId"
            @toggle-node="toggleNode"
            @set-hovered="setHoveredNode"
            @open-edit="openEditModal"
            @open-delete="openDelete"
            @open-add-unit="openAddUnitModal"
            @open-add-position="openAddPositionModal"
            @open-add-member="openAddMemberModal"
          />
        </div>
      </div>
      </div>

    <!-- ==================== ADD UNIT MODAL ==================== -->
    <Teleport to="body">
      <Modal v-model="showAddUnitModal" :saving="isSavingAddUnit" size="xl" @save="handleSaveUnit">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">
            {{ $t('stu_modal_add_unit') }}
          </h3>
        </template>

        <div class="space-y-4 p-1">
          <!-- ID Unit -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_id_unit') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.idUnit"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                unitErrors.idUnit
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
              ]"
              :placeholder="$t('stu_form_id_unit_placeholder')"
              @input="unitErrors.idUnit = false"
            />
            <p v-if="unitErrors.idUnit" class="text-xs text-red-500 mt-1">
              {{ $t('stu_form_id_unit') }}
            </p>
          </div>

          <!-- Nama Unit -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_nama_unit') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.namaUnit"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                unitErrors.namaUnit
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
              ]"
              :placeholder="$t('stu_form_nama_unit_placeholder')"
              @input="unitErrors.namaUnit = false; formUnit.namaUnit = formUnit.namaUnit.toUpperCase()"
            />
            <p v-if="unitErrors.namaUnit" class="text-xs text-red-500 mt-1">
              {{ $t('stu_form_nama_unit') }}
            </p>
          </div>

          <!-- Nama Pendek -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_nama_pendek') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.titelatur"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                unitErrors.titelatur
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
              ]"
              :placeholder="$t('stu_form_nama_pendek_placeholder')"
              @input="unitErrors.titelatur = false; formUnit.titelatur = formUnit.titelatur.toUpperCase()"
            />
            <p v-if="unitErrors.titelatur" class="text-xs text-red-500 mt-1">
              {{ $t('stu_form_nama_pendek') }}
            </p>
          </div>

          <!-- Sub Area Dropdown -->
          <div class="sub-area-dropdown-container">
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_sub_area') }} <span class="text-red-500">*</span>
            </Heading>

            <div class="relative mt-1">
              <button
                type="button"
                @click="toggleSubAreaDropdown"
                :class="[
                  'w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  unitErrors.idsubArea ? 'border-red-500' : 'border-gray-300'
                ]"
              >
                <span :class="formUnit.idsubArea ? 'text-gray-900' : 'text-gray-400'">
                  {{ getSelectedSubAreaText() || $t('stu_form_pilih_sub_area') }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400" />
              </button>
              <p v-if="unitErrors.idsubArea" class="text-xs text-red-500 mt-1">
                {{ $t('stu_form_sub_area') }}
              </p>

              <div
                v-if="showSubAreaDropdown"
                class="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg"
                @click.stop
              >
                <div class="p-2 border-b border-gray-200">
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="subAreaSearchQuery"
                      @input="filterSubAreas"
                      :placeholder="$t('stu_form_cari_sub_area')"
                      class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div class="max-h-64 overflow-y-auto">
                  <div
                    v-for="sub in filteredSubAreas"
                    :key="sub.sub_area"
                    @click="selectSubArea(sub)"
                    :class="[
                      'px-3 py-2 cursor-pointer hover:bg-primary-50 transition-colors',
                      formUnit.idsubArea === sub.sub_area ? 'bg-primary-100 font-medium' : ''
                    ]"
                  >
                    <p class="text-sm">{{ sub.sub_area }} - {{ sub.shortText || sub.longText }}</p>
                  </div>

                  <div
                    v-if="filteredSubAreas.length === 0"
                    class="px-3 py-4 text-center text-gray-500 text-sm"
                  >
                    {{ $t('stu_form_sub_area_not_found') }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tanggal -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formUnit.mulai"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                  unitErrors.mulai
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                ]"
                @change="unitErrors.mulai = false"
              />
              <p v-if="unitErrors.mulai" class="text-xs text-red-500 mt-1">
                {{ $t('stu_form_tgl_mulai') }}
              </p>
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_berakhir') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formUnit.berakhir"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                  unitErrors.berakhir
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                ]"
                @change="unitErrors.berakhir = false"
              />
              <p v-if="unitErrors.berakhir" class="text-xs text-red-500 mt-1">
                {{ $t('stu_form_tgl_berakhir') }}
              </p>
            </div>
          </div>
          <p v-if="isUnitDateRangeInvalid" class="text-xs text-red-500">
            {{ $t('stu_form_tgl_warning') }}
          </p>
        </div>
      </Modal>
    </Teleport>

    <!-- ==================== ADD POSITION MODAL ==================== -->
    <Teleport to="body">
      <Modal
        v-model="showAddPositionModal"
        :saving="isSavingAddPosition"
        size="xl"
        @save="handleSavePosition"
      >
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">
            {{ $t('stu_modal_add_posisi') }}
          </h3>
        </template>

        <div class="space-y-4 p-1">
          <!-- ID Posisi (auto-generated, editable) -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_id_posisi') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.idPos"
              type="text"
              inputmode="numeric"
              maxlength="8"
              :placeholder="$t('stu_form_id_posisi_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                positionErrors.idPos
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
              ]"
              @input="positionErrors.idPos = false"
            />
            <p v-if="positionErrors.idPos" class="text-xs text-red-500 mt-1">
              {{ $t('stu_form_id_posisi') }}
            </p>
          </div>

          <!-- Nama Posisi -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_nama_posisi') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.namaPos"
              :placeholder="$t('stu_form_nama_posisi_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                positionErrors.namaPos
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
              ]"
              @input="positionErrors.namaPos = false; formPosition.namaPos = formPosition.namaPos.toUpperCase()"
            />
            <p v-if="positionErrors.namaPos" class="text-xs text-red-500 mt-1">
              {{ $t('stu_form_nama_posisi') }}
            </p>
          </div>

          <!-- Nama Pendek / Titelatur -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_titelatur') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.titelatur"
              :placeholder="$t('stu_form_titelatur_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                positionErrors.titelatur
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
              ]"
              @input="positionErrors.titelatur = false"
            />
            <p v-if="positionErrors.titelatur" class="text-xs text-red-500 mt-1">
              {{ $t('stu_form_titelatur') }}
            </p>
          </div>

          <!-- Chief Checkbox -->
          <div>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="formPosition.chief"
                :disabled="parentHasChief"
                class="w-4 h-4 rounded disabled:opacity-50"
              />
              <span class="text-sm font-medium" :class="{ 'text-gray-400': parentHasChief }">
                {{ $t('stu_form_chief') }}
              </span>
            </label>
            <p v-if="parentHasChief" class="text-xs text-red-500 mt-1">
              {{ $t('stu_form_chief_sudah_ada') }}
            </p>
          </div>

          <!-- Level Chief -->
          <div v-if="formPosition.chief">
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_level_chief') }} <span class="text-red-500">*</span>
            </Heading>
            <select
              v-model="formPosition.chiefLevel"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm',
                positionErrors.chiefLevel
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
              ]"
              @change="positionErrors.chiefLevel = false"
            >
              <option value="">{{ $t('stu_form_pilih_level') }}</option>
              <option v-for="opt in chiefOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <p v-if="positionErrors.chiefLevel" class="text-xs text-red-500 mt-1">
              {{ $t('stu_form_level_chief') }}
            </p>
          </div>

          <!-- Tanggal -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formPosition.mulai"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                  positionErrors.mulai
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                ]"
                @change="positionErrors.mulai = false"
              />
              <p v-if="positionErrors.mulai" class="text-xs text-red-500 mt-1">
                {{ $t('stu_form_tgl_mulai') }}
              </p>
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_berakhir') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formPosition.berakhir"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                  positionErrors.berakhir
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                ]"
                @change="positionErrors.berakhir = false"
              />
              <p v-if="positionErrors.berakhir" class="text-xs text-red-500 mt-1">
                {{ $t('stu_form_tgl_berakhir') }}
              </p>
            </div>
          </div>
          <p v-if="isPositionDateRangeInvalid" class="text-xs text-red-500">
            {{ $t('stu_form_tgl_warning') }}
          </p>
        </div>
      </Modal>
    </Teleport>

    <!-- ==================== ADD MEMBER MODAL ==================== -->
    <Teleport to="body">
      <Modal
        v-model="showAddMemberModal"
        :saving="isSavingAddMember"
        size="xl"
        @save="handleSaveMember"
      >
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">
            {{ $t('stu_modal_add_anggota') }}
          </h3>
        </template>

        <div class="space-y-4 p-1">
          <!-- Person Search -->
          <div class="mt-4">
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_nama_anggota') }} <span class="text-red-500">*</span>
            </Heading>

            <div class="relative mt-1">
              <input
                v-model="personSearchQuery"
                type="text"
                :placeholder="$t('stu_form_cari_anggota')"
                :class="[
                  'w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                  memberErrors.personId
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                ]"
                @input="onPersonSearchAndClearError"
                @focus="personSuggestions.length > 0 && (showPersonSuggestions = true)"
                @blur="hidePersonSuggestions"
                @keydown.escape="showPersonSuggestions = false"
                autocomplete="off"
              />
              <div v-if="isSearchingPerson" class="absolute right-3 top-1/2 -translate-y-1/2">
                <div
                  class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
                />
              </div>
              <div
                v-if="showPersonSuggestions && personSuggestions.length > 0"
                class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                <div
                  v-for="person in personSuggestions"
                  :key="person.id"
                  @mousedown.prevent="selectPersonSuggestion(person)"
                  class="px-4 py-2 cursor-pointer text-sm hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span class="font-medium text-gray-800 dark:text-white">{{ person.name }}</span>
                  <span class="text-gray-500 dark:text-gray-400 ml-1">- {{ person.persnum }}</span>
                </div>
              </div>
            </div>
            <p v-if="memberErrors.personId" class="text-xs text-red-500 mt-1">
              {{ $t('stu_form_nama_anggota') }}
            </p>
          </div>

          <!-- Tanggal -->
          <div class="grid grid-cols-2 gap-4 mt-7 mb-8">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.mulai"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                  memberErrors.mulai
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                ]"
                @change="memberErrors.mulai = false"
              />
              <p v-if="memberErrors.mulai" class="text-xs text-red-500 mt-1">
                {{ $t('stu_form_tgl_mulai') }}
              </p>
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_berakhir') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.berakhir"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100',
                  memberErrors.berakhir
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                ]"
                @change="memberErrors.berakhir = false"
              />
              <p v-if="memberErrors.berakhir" class="text-xs text-red-500 mt-1">
                {{ $t('stu_form_tgl_berakhir') }}
              </p>
            </div>
          </div>
          <p v-if="isMemberDateRangeInvalid" class="text-xs text-red-500">
            {{ $t('stu_form_tgl_warning') }}
          </p>
        </div>
      </Modal>
    </Teleport>

    <!-- ==================== EDIT MODAL ==================== -->
    <Teleport to="body">
      <Modal v-model="showEditModal" :saving="isSavingEdit" size="xl" @save="handleSaveEdit">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-5 ml-5">
            {{ editTypeLabel }}
          </h3>
        </template>

        <!-- EDIT UNIT -->
        <div v-if="editType === 'Unit'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_kode_unit') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.idUnit"
              disabled
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_nama_unit') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.namaUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              @input="formUnit.namaUnit = formUnit.namaUnit.toUpperCase()"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formUnit.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_berakhir') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formUnit.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
          <p v-if="isUnitDateRangeInvalid" class="text-xs text-red-500">
            {{ $t('stu_form_tgl_warning') }}
          </p>
        </div>

        <!-- EDIT POSISI -->
        <div v-if="editType === 'Posisi'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_kode_posisi') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.idPos"
              disabled
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_nama_posisi') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.namaPos"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              @input="formPosition.namaPos = formPosition.namaPos.toUpperCase()"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formPosition.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_berakhir') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formPosition.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
          <p v-if="isPositionDateRangeInvalid" class="text-xs text-red-500">
            {{ $t('stu_form_tgl_warning') }}
          </p>
        </div>

        <!-- EDIT ANGGOTA -->
        <div v-if="editType === 'Anggota'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_nama_anggota') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formMember.nama"
              disabled
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t('stu_form_personal_number') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formMember.personId"
              disabled
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t('stu_form_tgl_berakhir') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
          <p v-if="isMemberDateRangeInvalid" class="text-xs text-red-500">
            {{ $t('stu_form_tgl_warning') }}
          </p>
        </div>
      </Modal>
    </Teleport>

    <!-- ==================== DELETE CONFIRM POPUP ==================== -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      :title="$t('stu_pop_title')"
      :message="$t('stu_pop_desc')"
      :confirmText="$t('stu_pop_confirm')"
      :cancelText="$t('stu_pop_cancel')"
      cancelColor="primary"
      :require-confirmation="true"
      confirmation-text="KONFIRMASI HAPUS DATA"
      @confirm="deleteNow"
      @cancel="confirmDeleteOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Building2,
  Building,
  Search,
  X,
  User,
  Users,
  AlertCircle
} from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth'
})

import { useStruktur } from '~/composables/useStruktur'
import { useCompany } from '~/composables/useCompany'
import { useArea } from '~/composables/useArea'
import { useToast } from '#imports'
import { usePerson } from '~/composables/usePerson'
import { formatDateSlash as formatDate } from '~/utils/mail-helpers'

// ─── i18n ────────────────────────────────────────────────────────────────────
const { t } = useI18n()

const { hasPermission } = useAuth();

const canViewMaster = computed(() => hasPermission('master-data', 'read-perusahaan'));

// ─── Composables ─────────────────────────────────────────────────────────────
const { searchPersons } = usePerson()

const {
  getCompanyTree,
  searchOrganization,
  searchPosition,
  searchPerson,
  getPositionsByOrganization,
  createPosition,
  deletePosition,
  updatePosition,
  getPersonsByPosition,
  assignPersonToPosition,
  deletePerson,
  updateAssignPerson,
  createOrganization,
  deleteOrganization,
  updateOrganization
} = useStruktur()

const { getCompanyByCode } = useCompany()
const { getSubAreasByCompany } = useArea()
const toast = useToast()
const route = useRoute()

// ─── State ───────────────────────────────────────────────────────────────────
const confirmDeleteOpen = ref(false)
const itemToDelete = ref<any>(null)

const companyExpanded = ref(true)
const expandedNodes = ref<Record<string, boolean>>({})
const previousExpandedState = ref<Record<string, boolean>>({})
const hoveredNode = ref<string | null>(null)
const editingNode = ref<any>(null)
const highlightNodeId = ref<string | null>(null)
const treeContainer = ref<HTMLElement | null>(null)

const searchQuery = ref('')
const searchResults = ref<{
  organizations: any[]
  positions: any[]
  persons: any[]
}>({
  organizations: [],
  positions: [],
  persons: []
})
const loadingSearch = ref(false)
const loadingExpand = ref(false)

type SearchSuggestionType = 'organization' | 'position' | 'person'
type SearchScope = SearchSuggestionType | ''

interface SearchSuggestionItem {
  key: string
  type: SearchSuggestionType
  title: string
  subtitle: string
  organizationId?: string
  organizationCode?: string
  positionId?: string
  positionCode?: string
  personId?: string
  persnum?: string
}

interface CachedSearchResult {
  organizations: any[]
  positions: any[]
  persons: any[]
  suggestions: SearchSuggestionItem[]
}

const SEARCH_MIN_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 450
const SEARCH_SUGGESTION_LIMIT = 8

const searchScope = ref<SearchScope>('')
const searchSuggestions = ref<SearchSuggestionItem[]>([])
const showSearchSuggestions = ref(false)
const searchCache = ref<Record<string, CachedSearchResult>>({})
const activeSearchRequestId = ref(0)

// Modal search states
const subAreaSearchQuery = ref('')
const personSearchQuery = ref('')
const filteredSubAreas = ref<any[]>([])
const showSubAreaDropdown = ref(false)

// Person search-as-you-type state
const personSuggestions = ref<any[]>([])
const isSearchingPerson = ref(false)
const showPersonSuggestions = ref(false)
const selectedPersonForMember = ref<any>(null)
let personSearchTimeout: any = null

// Modals
const showAddUnitModal = ref(false)
const showAddPositionModal = ref(false)
const showAddMemberModal = ref(false)
const showEditModal = ref(false)
const editType = ref<string | null>(null)
const isSavingAddUnit = ref(false)
const isSavingAddPosition = ref(false)
const isSavingAddMember = ref(false)
const isSavingEdit = ref(false)

// ─── Validation Error States ──────────────────────────────────────────────────
const unitErrors = ref({
  namaUnit: false,
  titelatur: false,
  idUnit: false,
  idsubArea: false,
  mulai: false,
  berakhir: false
})

const positionErrors = ref({
  namaPos: false,
  titelatur: false,
  idPos: false,
  chiefLevel: false,
  mulai: false,
  berakhir: false
})

const memberErrors = ref({
  personId: false,
  mulai: false,
  berakhir: false
})

// Forms
const formUnit = ref({
  namaUnit: '',
  idUnit: '',
  titelatur: '',
  idsubArea: '',
  subarea: '',
  deskripsi: '',
  mulai: '',
  berakhir: ''
})

const formPosition = ref({
  namaPos: '',
  idPos: '',
  titelatur: '',
  chief: false,
  chiefLevel: '',
  mulai: '',
  berakhir: ''
})

const formMember = ref({
  personId: '',
  nama: '',
  mulai: '',
  berakhir: ''
})

// Data
const company = ref<any>(null)
const organizationTree = ref<any[]>([])
const subAreaOptions = ref<any[]>([])
const loadingSubArea = ref(false)
const parentHasChief = ref(false)
const selectedParentNode = ref<any>(null)

const chiefOptions = [
  { label: 'BOD', value: 'BOD' },
  { label: 'BOD-1', value: 'BOD-1' },
  { label: 'BOD-2', value: 'BOD-2' },
  { label: 'BOD-3', value: 'BOD-3' }
]

const bodOrder: Record<string, number> = {
  BOD: 1,
  'BOD-1': 2,
  'BOD-2': 3,
  'BOD-3': 4
}

// ─── Computed ─────────────────────────────────────────────────────────────────
const editTypeLabel = computed(() => {
  if (editType.value === 'Unit') return t('stu_modal_edit_unit')
  if (editType.value === 'Posisi') return t('stu_modal_edit_posisi')
  if (editType.value === 'Anggota') return t('stu_modal_edit_anggota')
  return ''
})

const totalResults = computed(
  () =>
    searchResults.value.organizations.length +
    searchResults.value.positions.length +
    searchResults.value.persons.length
)

const searchResultsMap = computed(() => {
  const map: Record<string, string> = {}
  searchResults.value.organizations.forEach((org) => {
    map[org.id] = 'organization'
  })
  searchResults.value.positions.forEach((pos) => {
    map[pos.id] = 'position'
  })
  searchResults.value.persons.forEach((person) => {
    map[person.id] = 'person'
  })
  return map
})

const displayTree = computed(() => organizationTree.value)

// ─── Toast helpers ────────────────────────────────────────────────────────────
const showSuccessToast = (message: string) => {
  toast.add({
    title: t('berhasil'),
    description: message,
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}

const showErrorToast = (description: string) => {
  toast.add({
    title: t('gagal'),
    description,
    color: 'error',
    icon: 'i-lucide-x-circle'
  })
}

const buildRequiredFieldsMessage = (fields: string[]) => {
  if (fields.length === 0) return ''
  return `${fields.join(', ')} wajib diisi`
}

const isEndDateInvalid = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return false

  const start = new Date(startDate)
  const end = new Date(endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  return end <= start
}

const formatDateWarningMessage = () => t('stu_form_tgl_warning').replace(/^\*\s*/, '')

const isUnitDateRangeInvalid = computed(() =>
  isEndDateInvalid(formUnit.value.mulai, formUnit.value.berakhir)
)

const isPositionDateRangeInvalid = computed(() =>
  isEndDateInvalid(formPosition.value.mulai, formPosition.value.berakhir)
)

const isMemberDateRangeInvalid = computed(() =>
  isEndDateInvalid(formMember.value.mulai, formMember.value.berakhir)
)

// ─── Validation helpers ───────────────────────────────────────────────────────

/**
 * Validate Add Unit form.
 * Returns true if valid, false if there are errors.
 * Also triggers toast listing all empty required fields.
 */
const validateUnitForm = (): boolean => {
  const emptyFields: string[] = []

  unitErrors.value.namaUnit = !formUnit.value.namaUnit.trim()
  unitErrors.value.titelatur = !formUnit.value.titelatur.trim()
  unitErrors.value.idUnit = !formUnit.value.idUnit.trim()
  unitErrors.value.idsubArea = !formUnit.value.idsubArea
  unitErrors.value.mulai = !formUnit.value.mulai
  unitErrors.value.berakhir = !formUnit.value.berakhir

  if (unitErrors.value.namaUnit) emptyFields.push(t('stu_form_nama_unit'))
  if (unitErrors.value.titelatur) emptyFields.push(t('stu_form_nama_pendek'))
  if (unitErrors.value.idUnit) emptyFields.push(t('stu_form_id_unit'))
  if (unitErrors.value.idsubArea) emptyFields.push(t('stu_form_sub_area'))
  if (unitErrors.value.mulai) emptyFields.push(t('stu_form_tgl_mulai'))
  if (unitErrors.value.berakhir) emptyFields.push(t('stu_form_tgl_berakhir'))

  if (emptyFields.length > 0) {
    showErrorToast(buildRequiredFieldsMessage(emptyFields))
    return false
  }

  if (isEndDateInvalid(formUnit.value.mulai, formUnit.value.berakhir)) {
    unitErrors.value.berakhir = true
    showErrorToast(formatDateWarningMessage())
    return false
  }
  return true
}

/**
 * Validate Add Position form.
 * Returns true if valid, false if there are errors.
 */
const validatePositionForm = (): boolean => {
  const emptyFields: string[] = []

  positionErrors.value.namaPos = !formPosition.value.namaPos.trim()
  positionErrors.value.titelatur = !formPosition.value.titelatur.trim()
  positionErrors.value.idPos = !formPosition.value.idPos.trim()
  positionErrors.value.chiefLevel = formPosition.value.chief && !formPosition.value.chiefLevel
  positionErrors.value.mulai = !formPosition.value.mulai
  positionErrors.value.berakhir = !formPosition.value.berakhir

  if (positionErrors.value.namaPos) emptyFields.push(t('stu_form_nama_posisi'))
  if (positionErrors.value.titelatur) emptyFields.push(t('stu_form_titelatur'))
  if (positionErrors.value.idPos) emptyFields.push(t('stu_form_id_posisi'))
  if (positionErrors.value.chiefLevel) emptyFields.push(t('stu_form_level_chief'))
  if (positionErrors.value.mulai) emptyFields.push(t('stu_form_tgl_mulai'))
  if (positionErrors.value.berakhir) emptyFields.push(t('stu_form_tgl_berakhir'))

  if (emptyFields.length > 0) {
    showErrorToast(buildRequiredFieldsMessage(emptyFields))
    return false
  }

  if (isEndDateInvalid(formPosition.value.mulai, formPosition.value.berakhir)) {
    positionErrors.value.berakhir = true
    showErrorToast(formatDateWarningMessage())
    return false
  }
  return true
}

/**
 * Validate Add Member form.
 * Returns true if valid, false if there are errors.
 */
const validateMemberForm = (): boolean => {
  const emptyFields: string[] = []

  memberErrors.value.personId = !selectedPersonForMember.value
  memberErrors.value.mulai = !formMember.value.mulai
  memberErrors.value.berakhir = !formMember.value.berakhir

  if (memberErrors.value.personId) emptyFields.push(t('stu_form_nama_anggota'))
  if (memberErrors.value.mulai) emptyFields.push(t('stu_form_tgl_mulai'))
  if (memberErrors.value.berakhir) emptyFields.push(t('stu_form_tgl_berakhir'))

  if (emptyFields.length > 0) {
    showErrorToast(buildRequiredFieldsMessage(emptyFields))
    return false
  }

  if (isEndDateInvalid(formMember.value.mulai, formMember.value.berakhir)) {
    memberErrors.value.berakhir = true
    showErrorToast(formatDateWarningMessage())
    return false
  }
  return true
}

// ─── Click-outside handler ────────────────────────────────────────────────────
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (showSubAreaDropdown.value) {
    const isClickInside = target.closest('.sub-area-dropdown-container')
    if (!isClickInside) showSubAreaDropdown.value = false
  }

  if (showSearchSuggestions.value) {
    const isClickInsideSearch = target.closest('.search-suggestion-container')
    if (!isClickInsideSearch) showSearchSuggestions.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

// ─── Search ───────────────────────────────────────────────────────────────────
let searchTimeout: any = null
let searchAbortController: AbortController | null = null

const toText = (value: unknown) => (value == null ? '' : String(value))
const normalizeText = (value: unknown) => toText(value).trim().toLowerCase()

const emptySearchResults = () => ({
  organizations: [],
  positions: [],
  persons: []
})

const getSearchPlaceholder = () => {
  if (!searchScope.value) return 'Pilih Unit / Posisi / Nama terlebih dahulu'
  if (searchScope.value === 'organization') return 'Cari unit...'
  if (searchScope.value === 'position') return 'Cari posisi...'
  return 'Cari nama anggota...'
}

const setSearchScope = (scope: SearchSuggestionType) => {
  if (searchScope.value === scope) return
  searchScope.value = scope
  clearSearch()
}

const extractOrganizationCode = (raw: any) =>
  toText(
    raw?.organizationCode ??
      raw?.organization?.organization ??
      raw?.organization?.organizationCode ??
      raw?.organization?.code ??
      raw?.organization ??
      raw?.organization_id ??
      raw?.organizationId ??
      raw?.organizationData?.organization ??
      raw?.organizationData?.organizationCode ??
      raw?.organizationData?.code
  )

const extractOrganizationId = (raw: any) =>
  toText(raw?.organizationId ?? raw?.organization_id ?? raw?.organizationData?.id)

const extractPositionCode = (raw: any) =>
  toText(
    raw?.positionCode ??
      raw?.position?.position ??
      raw?.position?.positionCode ??
      raw?.position?.code ??
      raw?.position ??
      raw?.position_id ??
      raw?.positionId ??
      raw?.positionData?.position ??
      raw?.positionData?.positionCode ??
      raw?.positionData?.code
  )

const extractPositionId = (raw: any) =>
  toText(
    raw?.positionId ?? raw?.position_id ?? raw?.id_position ?? raw?.positionData?.id ?? raw?.id
  )

const getSuggestionIcon = (type: SearchSuggestionType) => {
  if (type === 'organization') return Building
  if (type === 'position') return User
  return Users
}

const getSuggestionBadgeClass = (type: SearchSuggestionType) => {
  if (type === 'organization') {
    return 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
  }
  if (type === 'position') {
    return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
  }
  return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
}

const getSuggestionTypeLabel = (type: SearchSuggestionType) => {
  if (type === 'organization') return 'Unit'
  if (type === 'position') return 'Posisi'
  return 'Nama'
}

const onSearchFocus = () => {
  if (!searchScope.value) return
  if (searchSuggestions.value.length > 0) {
    showSearchSuggestions.value = true
  }
}

const hideSearchSuggestions = () => {
  setTimeout(() => {
    showSearchSuggestions.value = false
  }, 120)
}

const buildSearchSuggestions = (
  organizations: any[],
  positions: any[],
  persons: any[]
): SearchSuggestionItem[] => {
  const suggestions: SearchSuggestionItem[] = []
  const seen = new Set<string>()

  const pushSuggestion = (item: SearchSuggestionItem) => {
    if (!item.title || seen.has(item.key)) return
    seen.add(item.key)
    suggestions.push(item)
  }

  for (const person of persons) {
    const personId = toText(
      person.id || person.id_relation_sp || person.person_id || person.personId
    )
    const persnum = toText(person.persnum || person.person_number || person.personNumber)
    const organizationCode = extractOrganizationCode(person)
    const organizationId = extractOrganizationId(person)
    const positionCode = extractPositionCode(person)
    const positionId = extractPositionId(person)

    pushSuggestion({
      key: `person:${personId || persnum}`,
      type: 'person',
      title: person.name || '-',
      subtitle: persnum ? `Persnum ${persnum}` : 'Anggota',
      personId,
      persnum,
      organizationId,
      organizationCode,
      positionId,
      positionCode
    })
  }

  for (const position of positions) {
    const positionId = extractPositionId(position)
    const positionCode = extractPositionCode(position)
    const organizationCode = extractOrganizationCode(position)
    const organizationId = extractOrganizationId(position)

    pushSuggestion({
      key: `position:${positionId || `${organizationCode}:${positionCode}`}`,
      type: 'position',
      title:
        position.long_text ||
        position.longText ||
        position.short_text ||
        position.shortText ||
        position.name ||
        '-',
      subtitle: organizationCode ? `Unit ${organizationCode}` : 'Posisi',
      positionId,
      positionCode,
      organizationId,
      organizationCode
    })
  }

  for (const organization of organizations) {
    const organizationId = toText(
      organization.id || organization.organization_id || organization.organizationId
    )
    const organizationCode = extractOrganizationCode(organization)
    pushSuggestion({
      key: `organization:${organizationId || organizationCode}`,
      type: 'organization',
      title:
        organization.longText ||
        organization.long_text ||
        organization.shortText ||
        organization.short_text ||
        '-',
      subtitle: organizationCode ? `Kode ${organizationCode}` : 'Unit',
      organizationId,
      organizationCode
    })
  }

  return suggestions.slice(0, SEARCH_SUGGESTION_LIMIT)
}

const performSearch = async (queryOverride?: string) => {
  const query = (queryOverride ?? searchQuery.value).trim()
  if (!company.value?.kode || query.length < SEARCH_MIN_LENGTH || !searchScope.value) {
    searchResults.value = emptySearchResults()
    searchSuggestions.value = []
    showSearchSuggestions.value = false
    return
  }

  if (Object.keys(previousExpandedState.value).length === 0) {
    previousExpandedState.value = { ...expandedNodes.value }
  }

  const cacheKey = `${searchScope.value}:${query.toLowerCase()}`
  const cached = searchCache.value[cacheKey]
  if (cached) {
    searchResults.value = {
      organizations: cached.organizations,
      positions: cached.positions,
      persons: cached.persons
    }
    searchSuggestions.value = cached.suggestions
    showSearchSuggestions.value = true
    return
  }

  const requestId = ++activeSearchRequestId.value
  if (searchAbortController) {
    searchAbortController.abort()
  }
  const controller = new AbortController()
  searchAbortController = controller

  loadingSearch.value = true

  try {
    let organizations: any[] = []
    let positions: any[] = []
    let persons: any[] = []

    if (searchScope.value === 'organization') {
      const orgRes = await searchOrganization(String(company.value.kode), query, controller.signal)
      organizations = orgRes.data || []
    } else if (searchScope.value === 'position') {
      const posRes = await searchPosition(String(company.value.kode), query, controller.signal)
      positions = posRes.data || []
    } else if (searchScope.value === 'person') {
      const personRes = await searchPerson(String(company.value.kode), query, controller.signal)
      persons = personRes.data || []
    }

    if (requestId !== activeSearchRequestId.value) return

    const suggestions = buildSearchSuggestions(organizations, positions, persons)

    searchCache.value[cacheKey] = {
      organizations,
      positions,
      persons,
      suggestions
    }

    searchResults.value = {
      organizations,
      positions,
      persons
    }
    searchSuggestions.value = suggestions
    showSearchSuggestions.value = true
  } catch (err) {
    if (requestId !== activeSearchRequestId.value) return
    if ((err as any)?.name === 'CanceledError' || (err as any)?.code === 'ERR_CANCELED') return
    console.error('❌ Search error:', err)
    searchResults.value = emptySearchResults()
    searchSuggestions.value = []
    showSearchSuggestions.value = true
  } finally {
    if (requestId === activeSearchRequestId.value) {
      loadingSearch.value = false
      if (searchAbortController === controller) {
        searchAbortController = null
      }
    }
  }
}

const handleSearch = async () => {
  const trimmed = searchQuery.value.trim()

  if (!searchScope.value) {
    showSearchSuggestions.value = false
    searchResults.value = emptySearchResults()
    return
  }

  if (!trimmed) {
    clearSearch()
    return
  }

  clearTimeout(searchTimeout)

  if (trimmed.length < SEARCH_MIN_LENGTH) {
    searchResults.value = emptySearchResults()
    searchSuggestions.value = []
    showSearchSuggestions.value = false
    loadingSearch.value = false
    return
  }

  searchTimeout = setTimeout(async () => {
    await performSearch(trimmed)
  }, SEARCH_DEBOUNCE_MS)
}

const clearSearch = () => {
  searchQuery.value = ''
  clearTimeout(searchTimeout)
  if (searchAbortController) {
    searchAbortController.abort()
    searchAbortController = null
  }
  activeSearchRequestId.value += 1

  if (Object.keys(previousExpandedState.value).length > 0) {
    expandedNodes.value = { ...previousExpandedState.value }
    companyExpanded.value = true
  } else {
    expandedNodes.value = {}
    companyExpanded.value = true
  }

  previousExpandedState.value = {}
  highlightNodeId.value = null
  loadingSearch.value = false
  loadingExpand.value = false
  searchResults.value = emptySearchResults()
  searchSuggestions.value = []
  showSearchSuggestions.value = false
}

const expandParentChain = (nodes: any[], targetId: string): boolean => {
  for (const node of nodes) {
    if (toText(node.id) === toText(targetId)) {
      expandedNodes.value[node.id] = true
      return true
    }
    if (node.children?.length) {
      const found = expandParentChain(node.children, targetId)
      if (found) {
        expandedNodes.value[node.id] = true
        return true
      }
    }
  }
  return false
}

const scrollToNodeById = async (targetNodeId: string) => {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 300))

  highlightNodeId.value = targetNodeId

  const scrollTo = (el: Element) => {
    const offset = 200
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    setTimeout(() => {
      if (highlightNodeId.value === targetNodeId) {
        highlightNodeId.value = null
      }
    }, 3000)
  }

  const element = document.querySelector(`[data-node-id="${targetNodeId}"]`)
  if (element) {
    scrollTo(element)
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 400))
  const retry = document.querySelector(`[data-node-id="${targetNodeId}"]`)
  if (retry) {
    scrollTo(retry)
  }
}

const isPositionMatch = (positionNode: any, item: SearchSuggestionItem) => {
  const byId = Boolean(item.positionId) && toText(positionNode.id) === toText(item.positionId)
  const byCode =
    Boolean(item.positionCode) && toText(positionNode.positionCode) === toText(item.positionCode)
  const byName =
    normalizeText(item.title).length > 0 &&
    normalizeText(positionNode.name || positionNode.longText || positionNode.shortText).includes(
      normalizeText(item.title)
    )
  return byId || byCode || byName
}

const findPositionNodeBySuggestion = async (item: SearchSuggestionItem): Promise<any | null> => {
  const walk = async (nodes: any[]): Promise<any | null> => {
    for (const node of nodes) {
      if (node.type !== 'unit' && node.type !== 'direktorat') continue

      if (!node._positionsLoaded) await loadPositions(node)
      expandedNodes.value[node.id] = true

      const positionNode = (node.children || []).find(
        (child: any) => child.type === 'position' && isPositionMatch(child, item)
      )

      if (positionNode) {
        expandParentChain(organizationTree.value, node.id)
        expandedNodes.value[positionNode.id] = true
        return positionNode
      }

      const childUnits = (node.children || []).filter(
        (child: any) => child.type === 'unit' || child.type === 'direktorat'
      )

      if (childUnits.length > 0) {
        const foundInChildren = await walk(childUnits)
        if (foundInChildren) return foundInChildren
      }
    }

    return null
  }

  return walk(organizationTree.value)
}

const findPersonNodeByPersnum = async (targetPersnum: string): Promise<any | null> => {
  const walk = async (nodes: any[]): Promise<any | null> => {
    for (const node of nodes) {
      if (node.type !== 'unit' && node.type !== 'direktorat') continue

      if (!node._positionsLoaded) await loadPositions(node)
      expandedNodes.value[node.id] = true

      const positions = (node.children || []).filter((child: any) => child.type === 'position')
      for (const positionNode of positions) {
        if (!positionNode._personsLoaded) await loadPersons(positionNode)

        const personNode = (positionNode.children || []).find(
          (child: any) => child.type === 'member' && toText(child.persnum) === toText(targetPersnum)
        )

        if (personNode) {
          expandParentChain(organizationTree.value, node.id)
          expandedNodes.value[positionNode.id] = true
          return personNode
        }
      }

      const childUnits = (node.children || []).filter(
        (child: any) => child.type === 'unit' || child.type === 'direktorat'
      )
      if (childUnits.length > 0) {
        const foundInChildren = await walk(childUnits)
        if (foundInChildren) return foundInChildren
      }
    }

    return null
  }

  return walk(organizationTree.value)
}

const focusSearchSuggestion = async (item: SearchSuggestionItem) => {
  if (!company.value?.kode) return

  if (Object.keys(previousExpandedState.value).length === 0) {
    previousExpandedState.value = { ...expandedNodes.value }
  }

  loadingExpand.value = true
  companyExpanded.value = true

  try {
    let targetNode: any | null = null

    const organizationNode = findNodeInTree(organizationTree.value, (node) => {
      const matchOrganizationId =
        Boolean(item.organizationId) && toText(node.id) === toText(item.organizationId)
      const matchOrganizationCode =
        Boolean(item.organizationCode) &&
        toText(node.organizationCode) === toText(item.organizationCode)

      return (
        (node.type === 'unit' || node.type === 'direktorat') &&
        (matchOrganizationId || matchOrganizationCode)
      )
    })

    if (item.type === 'organization') {
      if (organizationNode) {
        expandParentChain(organizationTree.value, organizationNode.id)
        targetNode = organizationNode
      }
    }

    if (item.type === 'position') {
      if (organizationNode) {
        expandParentChain(organizationTree.value, organizationNode.id)
        expandedNodes.value[organizationNode.id] = true
        if (!organizationNode._positionsLoaded) await loadPositions(organizationNode)

        targetNode = (organizationNode.children || []).find(
          (node: any) => node.type === 'position' && isPositionMatch(node, item)
        )

        if (targetNode) {
          expandedNodes.value[targetNode.id] = true
        }
      }

      if (!targetNode) {
        targetNode = await findPositionNodeBySuggestion(item)
      }
    }

    if (item.type === 'person') {
      const targetPersnum = toText(item.persnum)
      if (organizationNode) {
        expandParentChain(organizationTree.value, organizationNode.id)
        expandedNodes.value[organizationNode.id] = true
        if (!organizationNode._positionsLoaded) await loadPositions(organizationNode)

        const positions = (organizationNode.children || []).filter(
          (node: any) => node.type === 'position'
        )

        const preferredPosition = positions.find(
          (node: any) =>
            (item.positionId && toText(node.id) === toText(item.positionId)) ||
            (item.positionCode && toText(node.positionCode) === toText(item.positionCode))
        )

        const positionsToScan = preferredPosition ? [preferredPosition] : positions

        for (const positionNode of positionsToScan) {
          expandedNodes.value[positionNode.id] = true
          if (!positionNode._personsLoaded) await loadPersons(positionNode)

          targetNode = (positionNode.children || []).find(
            (node: any) => node.type === 'member' && toText(node.persnum) === targetPersnum
          )

          if (targetNode) break
        }
      }

      if (!targetNode && targetPersnum) {
        targetNode = await findPersonNodeByPersnum(targetPersnum)
      }
    }

    if (targetNode?.id) {
      await scrollToNodeById(targetNode.id)
    }
  } catch (err) {
    console.error('❌ Focus search result error:', err)
  } finally {
    loadingExpand.value = false
  }
}

const selectSearchSuggestion = async (item: SearchSuggestionItem) => {
  showSearchSuggestions.value = false
  await focusSearchSuggestion(item)
}

const selectFirstSuggestion = async () => {
  const firstSuggestion = searchSuggestions.value[0]
  if (!firstSuggestion) return
  await selectSearchSuggestion(firstSuggestion)
}

const autoExpandSearchResults = async () => {
  // Step 1: Organizations
  for (const org of searchResults.value.organizations) {
    const orgNode = findNodeInTree(
      organizationTree.value,
      (n) => n.id === org.id || n.organizationCode === org.organization
    )
    if (orgNode) {
      expandedNodes.value[orgNode.id] = true
      if (!orgNode._positionsLoaded) await loadPositions(orgNode)
      await expandParentNodes(orgNode.id)
    }
  }

  // Step 2: Positions
  for (const pos of searchResults.value.positions) {
    const orgNode = findNodeInTree(
      organizationTree.value,
      (n) =>
        (n.type === 'unit' || n.type === 'direktorat') && n.organizationCode === pos.organization
    )
    if (orgNode) {
      expandedNodes.value[orgNode.id] = true
      if (!orgNode._positionsLoaded) await loadPositions(orgNode)

      const posNode = findNodeInTree(
        orgNode.children,
        (n) => n.type === 'position' && n.positionCode === pos.position
      )
      if (posNode) {
        expandedNodes.value[posNode.id] = true
        if (!posNode._personsLoaded) await loadPersons(posNode)
      }
      await expandParentNodes(orgNode.id)
    }
  }

  // Step 3: Persons
  for (const person of searchResults.value.persons) {
    const searchAndExpandForPerson = async (nodes: any[]): Promise<boolean> => {
      for (const node of nodes) {
        if (node.type === 'unit' || node.type === 'direktorat') {
          if (!node._positionsLoaded) await loadPositions(node)

          for (const posNode of node.children.filter((c: any) => c.type === 'position')) {
            if (!posNode._personsLoaded) await loadPersons(posNode)

            const personNode = posNode.children.find(
              (p: any) => p.type === 'member' && p.persnum === person.persnum
            )

            if (personNode) {
              expandedNodes.value[node.id] = true
              expandedNodes.value[posNode.id] = true
              expandedNodes.value[personNode.id] = true
              await expandParentNodes(node.id)
              return true
            }
          }

          const childUnits = node.children.filter(
            (c: any) => c.type === 'unit' || c.type === 'direktorat'
          )
          if (childUnits.length > 0) {
            const found = await searchAndExpandForPerson(childUnits)
            if (found) {
              expandedNodes.value[node.id] = true
              return true
            }
          }
        }
      }
      return false
    }
    await searchAndExpandForPerson(organizationTree.value)
  }
}

const findNodeInTree = (nodes: any[], predicate: (node: any) => boolean): any => {
  for (const node of nodes) {
    if (predicate(node)) return node
    if (node.children?.length) {
      const found = findNodeInTree(node.children, predicate)
      if (found) return found
    }
  }
  return null
}

const expandParentNodes = async (nodeId: string) => {
  const findAndExpand = async (nodes: any[], targetId: string): Promise<boolean> => {
    for (const node of nodes) {
      if (node.id === targetId) {
        expandedNodes.value[node.id] = true
        if ((node.type === 'unit' || node.type === 'direktorat') && !node._positionsLoaded)
          await loadPositions(node)
        if (node.type === 'position' && !node._personsLoaded) await loadPersons(node)
        return true
      }
      if (node.children?.length) {
        const found = await findAndExpand(node.children, targetId)
        if (found) {
          expandedNodes.value[node.id] = true
          if ((node.type === 'unit' || node.type === 'direktorat') && !node._positionsLoaded)
            await loadPositions(node)
          if (node.type === 'position' && !node._personsLoaded) await loadPersons(node)
          return true
        }
      }
    }
    return false
  }
  await findAndExpand(organizationTree.value, nodeId)
}

// ─── Data Fetching ────────────────────────────────────────────────────────────
const fetchData = async (kode: string | number) => {
  try {
    const companyRes = await getCompanyByCode(String(kode))
    if (!companyRes) return

    company.value = {
      kode: companyRes.company,
      namaPendek: companyRes.shortText,
      namaPanjang: companyRes.longText,
      tanggalMulai: companyRes.startDate,
      tanggalBerakhir: companyRes.endDate
    }

    const res = await getCompanyTree(String(kode))
    organizationTree.value = await mapCompanyTree(res.data.tree)
  } catch (err) {
    console.error('❌ fetchData error:', err)
  }
}

const mapCompanyTree = async (nodes: any[], level = 0): Promise<any[]> => {
  const result = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      organizationCode: node.organization,
      type: level === 0 ? 'direktorat' : 'unit',
      level,
      shortText: node.shortText,
      longText: node.longText,
      name: node.longText || node.shortText,
      startDate: node.startDate,
      endDate: node.endDate,
      children: node.children ? await mapCompanyTree(node.children, level + 1) : [],
      _positionsLoaded: false
    })
  }
  return result
}

const mapPositionToNode = (pos: any) => ({
  id: pos.id,
  positionCode: pos.position,
  organizationCode: pos.organization,
  type: 'position',
  longText: pos.long_text,
  shortText: pos.short_text,
  bodTag: pos.bod_tag,
  name: pos.long_text || pos.short_text || '-',
  startDate: pos.start_date,
  endDate: pos.end_date,
  children: [],
  _personsLoaded: false
})

const mapPersonToNode = (person: any, positionCode: number) => ({
  id: person.id_relation_sp,
  type: 'member',
  name: person.name,
  persnum: person.persnum,
  positionCode,
  startDate: person.start_date,
  endDate: person.end_date,
  children: []
})

const isExpired = (endDate?: string) => {
  if (!endDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return end <= today
}

const loadPositions = async (node: any) => {
  if (node._positionsLoaded) return
  const res = await getPositionsByOrganization(
    String(node.organizationCode),
    company.value?.kode
  )
  const validPositions: any[] = []
  for (const pos of res.data) {
    validPositions.push(mapPositionToNode(pos))
  }
  const sortedPositions = sortPositionsByBod(validPositions)
  node.children = [
    ...sortedPositions,
    ...(node.children || []).filter((c: any) => c.type !== 'position')
  ]
  node._positionsLoaded = true
}

const loadPersons = async (node: any) => {
  if (node._personsLoaded) return
  if (!node.positionCode) return
  try {
    const res = await getPersonsByPosition(node.positionCode, company.value?.kode)
    const validPersons: any[] = []
    for (const p of res.data) {
      validPersons.push(mapPersonToNode(p, node.positionCode))
    }
    node.children = validPersons
    node._personsLoaded = true
  } catch (err) {
    console.error('❌ gagal load person:', err)
  }
}

const sortPositionsByBod = (positions: any[]) =>
  [...positions].sort((a, b) => {
    const aOrder = bodOrder[a.bodTag ?? ''] ?? 99
    const bOrder = bodOrder[b.bodTag ?? ''] ?? 99
    return aOrder - bOrder
  })

const toDateOnly = (val?: string) => (val ? val.split('T')[0] : null)

// ─── Dropdown helpers ─────────────────────────────────────────────────────────
const getSelectedSubAreaText = () => {
  if (!formUnit.value.idsubArea) return ''
  const selected = subAreaOptions.value.find((sub) => sub.sub_area === formUnit.value.idsubArea)
  return selected ? `${selected.sub_area} - ${selected.shortText || selected.longText}` : ''
}

const onPersonSearchAndClearError = () => {
  onPersonSearch()
  memberErrors.value.personId = false
}

const onPersonSearch = () => {
  selectedPersonForMember.value = null
  formMember.value.personId = ''
  if (personSearchTimeout) clearTimeout(personSearchTimeout)
  if (!personSearchQuery.value.trim()) {
    personSuggestions.value = []
    showPersonSuggestions.value = false
    return
  }
  personSearchTimeout = setTimeout(async () => {
    isSearchingPerson.value = true
    try {
      const res = await searchPersons(personSearchQuery.value)
      personSuggestions.value = res.data?.data || []
      showPersonSuggestions.value = personSuggestions.value.length > 0
    } catch {
      personSuggestions.value = []
      showPersonSuggestions.value = false
    } finally {
      isSearchingPerson.value = false
    }
  }, 300)
}

const selectPersonSuggestion = (person: any) => {
  selectedPersonForMember.value = person
  formMember.value.personId = person.id
  personSearchQuery.value = `${person.name} - ${person.persnum}`
  showPersonSuggestions.value = false
  memberErrors.value.personId = false
}

const hidePersonSuggestions = () => {
  setTimeout(() => {
    showPersonSuggestions.value = false
  }, 150)
}

const filterSubAreas = () => {
  const query = subAreaSearchQuery.value.toLowerCase().trim()
  filteredSubAreas.value = !query
    ? subAreaOptions.value
    : subAreaOptions.value.filter(
        (sub) =>
          String(sub.sub_area).toLowerCase().includes(query) ||
          (sub.shortText || '').toLowerCase().includes(query) ||
          (sub.longText || '').toLowerCase().includes(query)
      )
}

const toggleSubAreaDropdown = () => {
  showSubAreaDropdown.value = !showSubAreaDropdown.value
  unitErrors.value.idsubArea = false
}

const selectSubArea = (sub: any) => {
  formUnit.value.idsubArea = sub.sub_area
  formUnit.value.subarea = sub.shortText || sub.longText || ''
  showSubAreaDropdown.value = false
  subAreaSearchQuery.value = ''
  unitErrors.value.idsubArea = false
}

// ─── Form resets ──────────────────────────────────────────────────────────────
// Generate next unit ID (8 digit, mulai 10000000) — reset per company.
const generateNextUnitId = () => {
  let max = 9999999
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      const code = Number(n.organizationCode)
      if (!isNaN(code) && code >= 10000000 && code > max) max = code
      if (n.children?.length) walk(n.children)
    }
  }
  walk(organizationTree.value)
  return String(max + 1)
}

const resetUnitForm = () => {
  formUnit.value = {
    namaUnit: '',
    idUnit: generateNextUnitId(),
    titelatur: '',
    idsubArea: '',
    subarea: '',
    deskripsi: '',
    mulai: new Date().toISOString().slice(0, 10),
    berakhir: '9999-12-31'
  }
  unitErrors.value = {
    namaUnit: false,
    titelatur: false,
    idUnit: false,
    idsubArea: false,
    mulai: false,
    berakhir: false
  }
  subAreaSearchQuery.value = ''
}

// Generate next position ID (8 digit, mulai 70000000) — reset per company.
const generateNextPositionId = () => {
  let max = 69999999
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.type === 'position') {
        const code = Number(n.positionCode)
        if (!isNaN(code) && code >= 70000000 && code > max) max = code
      }
      if (n.children?.length) walk(n.children)
    }
  }
  walk(organizationTree.value)
  return String(max + 1)
}

const resetPositionForm = () => {
  formPosition.value = {
    namaPos: '',
    idPos: generateNextPositionId(),
    titelatur: '',
    chief: false,
    chiefLevel: '',
    mulai: new Date().toISOString().slice(0, 10),
    berakhir: '9999-12-31'
  }
  positionErrors.value = {
    namaPos: false,
    titelatur: false,
    idPos: false,
    chiefLevel: false,
    mulai: false,
    berakhir: false
  }
}

const resetMemberForm = () => {
  formMember.value = {
    personId: '',
    nama: '',
    mulai: new Date().toISOString().slice(0, 10),
    berakhir: '9999-12-31'
  }
  memberErrors.value = { personId: false, mulai: false, berakhir: false }
  personSearchQuery.value = ''
  personSuggestions.value = []
  showPersonSuggestions.value = false
  selectedPersonForMember.value = null
}

// ─── Node interaction ─────────────────────────────────────────────────────────
const toggleNode = async (node: any) => {
  const isExpanded = expandedNodes.value[node.id] ?? false
  expandedNodes.value[node.id] = !isExpanded
  if (isExpanded) return
  if ((node.type === 'unit' || node.type === 'direktorat') && !node._positionsLoaded)
    await loadPositions(node)
  if (node.type === 'position') await loadPersons(node)
}

const setHoveredNode = (id: string | null) => {
  hoveredNode.value = id
}

const hasChildren = (node: any) => Array.isArray(node.children) && node.children.length > 0

// ─── Modal openers ────────────────────────────────────────────────────────────
const openEditModal = (item: any) => {
  editingNode.value = item

  if (item.type === 'unit' || item.type === 'direktorat') {
    editType.value = 'Unit'
    formUnit.value = {
      namaUnit: item.longText || item.shortText,
      idUnit: item.organizationCode,
      titelatur: item.shortText,
      idsubArea: item.subArea,
      subarea: item.subAreaText,
      deskripsi: '',
      mulai: toDateOnly(item.startDate) ?? '',
      berakhir: toDateOnly(item.endDate) ?? ''
    }
  }

  if (item.type === 'position') {
    editType.value = 'Posisi'
    formPosition.value = {
      namaPos: item.longText,
      idPos: item.positionCode,
      titelatur: item.shortText,
      chief: !!item.bodTag,
      chiefLevel: item.bodTag ?? '',
      mulai: toDateOnly(item.startDate) ?? '',
      berakhir: toDateOnly(item.endDate) ?? ''
    }
  }

  if (item.type === 'member') {
    editType.value = 'Anggota'
    formMember.value = {
      nama: item.name,
      personId: item.persnum,
      mulai: toDateOnly(item.startDate) ?? '',
      berakhir: toDateOnly(item.endDate) ?? ''
    }
  }

  showEditModal.value = true
}

const openDelete = (item: any) => {
  if (hasChildren(item)) {
    alert(t('stu_err_has_children'))
    return
  }
  itemToDelete.value = item
  confirmDeleteOpen.value = true
}

const openAddUnitModal = async (parent: any, type: string) => {
  resetUnitForm()
  selectedParentNode.value = parent
  showAddUnitModal.value = true
  if (!company.value?.kode) return
  const res = await getSubAreasByCompany(String(company.value.kode))
  subAreaOptions.value = res.data || []
  filteredSubAreas.value = res.data || []
}

const openAddPositionModal = async (parent: any) => {
  selectedParentNode.value = parent
  if (!parent._positionsLoaded) await loadPositions(parent)
  parentHasChief.value = checkParentHasChief(parent)
  if (parentHasChief.value) {
    formPosition.value.chief = false
    formPosition.value.chiefLevel = ''
  }
  resetPositionForm()
  showAddPositionModal.value = true
}

const openAddMemberModal = (parent: any) => {
  resetMemberForm()
  selectedParentNode.value = parent
  showAddMemberModal.value = true
}

const checkParentHasChief = (parent: any) => {
  if (!parent?.children) return false
  return parent.children.some((c: any) => c.type === 'position' && !!c.bodTag)
}

// ─── CRUD handlers ────────────────────────────────────────────────────────────
const removeNodeById = (nodes: any[], id: string): boolean => {
  const index = nodes.findIndex((n) => n.id === id)
  if (index !== -1) {
    nodes.splice(index, 1)
    return true
  }
  for (const node of nodes) {
    if (node.children?.length && removeNodeById(node.children, id)) return true
  }
  return false
}

const deleteNow = async () => {
  if (!itemToDelete.value) return
  try {
    const item = itemToDelete.value
    if (hasChildren(item)) {
      alert(t('stu_err_has_children'))
      return
    }

    if (item.type === 'member') {
      await deletePerson(item.id)
      removeNodeById(organizationTree.value, item.id)
      showSuccessToast(t('stu_success_delete_anggota'))
    } else if (item.type === 'position') {
      await deletePosition(item.id)
      removeNodeById(organizationTree.value, item.id)
      showSuccessToast(t('stu_success_delete_posisi'))
    } else {
      await deleteOrganization(item.id)
      await fetchData(route.params.kode as string)
      showSuccessToast(t('stu_success_delete_unit'))
    }

    confirmDeleteOpen.value = false
  } catch (error) {
    console.error('❌ Error deleting item:', error)
  } finally {
    itemToDelete.value = null
  }
}

const handleSaveUnit = async () => {
  if (isSavingAddUnit.value) return

  // Run validation first
  if (!validateUnitForm()) return

  isSavingAddUnit.value = true

  try {
    if (isNaN(Number(formUnit.value.idUnit))) {
      showErrorToast(t('stu_err_id_unit_angka'))
      return
    }
    if (!company.value?.kode) return

    const payload = {
      company: Number(company.value.kode),
      organization: Number(formUnit.value.idUnit),
      shortText: formUnit.value.titelatur,
      longText: formUnit.value.namaUnit,
      abbreviation: formUnit.value.namaUnit,
      subArea: Number(formUnit.value.idsubArea),
      subAreaText: formUnit.value.subarea,
      parentOrganization: selectedParentNode.value?.organizationCode ?? null,
      startDate: formUnit.value.mulai,
      endDate: formUnit.value.berakhir
    }

    await createOrganization(payload)
    await fetchData(route.params.kode as string)
    showSuccessToast(t('stu_success_add_unit'))
    showAddUnitModal.value = false
    resetUnitForm()
  } catch (err) {
    console.error('❌ gagal create organization:', err)
  } finally {
    isSavingAddUnit.value = false
  }
}

const handleSavePosition = async () => {
  if (isSavingAddPosition.value) return

  // Run validation first
  if (!validatePositionForm()) return

  isSavingAddPosition.value = true

  try {
    if (isNaN(Number(formPosition.value.idPos))) {
      showErrorToast(t('stu_err_id_posisi_angka'))
      return
    }
    if (!company.value?.kode || !selectedParentNode.value) return

    const payload = {
      company: Number(company.value.kode),
      position: Number(formPosition.value.idPos),
      shortText: formPosition.value.titelatur ? formPosition.value.titelatur.trim().toUpperCase() : formPosition.value.titelatur,
      longText: formPosition.value.namaPos.trim().toUpperCase(),
      abbreviation: formPosition.value.namaPos.trim().toUpperCase(),
      organization: Number(selectedParentNode.value.organizationCode),
      bodTag: formPosition.value.chief ? formPosition.value.chiefLevel : null,
      startDate: formPosition.value.mulai,
      endDate: formPosition.value.berakhir
    }

    await createPosition(payload)
    selectedParentNode.value._positionsLoaded = false
    await loadPositions(selectedParentNode.value)
    showSuccessToast(t('stu_success_add_posisi'))
    showAddPositionModal.value = false
    resetPositionForm()
  } catch (err) {
    console.error('❌ gagal create position:', err)
  } finally {
    isSavingAddPosition.value = false
  }
}

const handleSaveMember = async () => {
  if (isSavingAddMember.value) return

  // Run validation first
  if (!validateMemberForm()) return

  isSavingAddMember.value = true

  try {
    if (!company.value?.kode || !selectedParentNode.value) return
    const selectedPerson = selectedPersonForMember.value
    if (!selectedPerson) return

    const payload = {
      persnum: Number(selectedPerson.persnum),
      company: Number(company.value.kode),
      position: Number(selectedParentNode.value.positionCode),
      startDate: formMember.value.mulai,
      endDate: formMember.value.berakhir
    }

    await assignPersonToPosition(payload)
    selectedParentNode.value._personsLoaded = false
    await loadPersons(selectedParentNode.value)
    showSuccessToast(t('stu_success_add_anggota'))
    showAddMemberModal.value = false
    resetMemberForm()
  } catch (err) {
    console.error('❌ gagal assign person:', err)
  } finally {
    isSavingAddMember.value = false
  }
}

const handleSaveEdit = async () => {
  if (isSavingEdit.value) return
  if (!editingNode.value) return

  isSavingEdit.value = true

  try {
    if (editType.value === 'Unit') {
      const payload = {
        shortText: formUnit.value.titelatur ? formUnit.value.titelatur.trim().toUpperCase() : formUnit.value.titelatur,
        longText: formUnit.value.namaUnit.trim().toUpperCase(),
        abbreviation: formUnit.value.namaUnit.trim().toUpperCase(),
        subArea: Number(formUnit.value.idsubArea),
        subAreaText: formUnit.value.subarea,
        startDate: formUnit.value.mulai,
        endDate: formUnit.value.berakhir
      }
      await updateOrganization(editingNode.value.id, payload)
      showSuccessToast(t('stu_success_edit_unit'))
    }

    if (editType.value === 'Posisi') {
      const payload = {
        longText: formPosition.value.namaPos.trim().toUpperCase(),
        abbreviation: formPosition.value.namaPos.trim().toUpperCase(),
        bodTag: formPosition.value.chief ? formPosition.value.chiefLevel : null,
        startDate: toDateOnly(formPosition.value.mulai),
        endDate: toDateOnly(formPosition.value.berakhir)
      }
      await updatePosition(editingNode.value.id, payload as any)
      showSuccessToast(t('stu_success_edit_posisi'))

      editingNode.value.longText = formPosition.value.namaPos
      editingNode.value.name = formPosition.value.namaPos
      editingNode.value.bodTag = formPosition.value.chief ? formPosition.value.chiefLevel : null
      editingNode.value.startDate = formPosition.value.mulai
      editingNode.value.endDate = formPosition.value.berakhir
    }

    if (editType.value === 'Anggota') {
      const payload = {
        startDate: toDateOnly(formMember.value.mulai),
        endDate: toDateOnly(formMember.value.berakhir)
      }
      await updateAssignPerson(editingNode.value.id, payload as any)
      showSuccessToast(t('stu_success_edit_anggota'))
      editingNode.value.startDate = payload.startDate
      editingNode.value.endDate = payload.endDate
    }

    showEditModal.value = false
    editingNode.value = null
    await fetchData(route.params.kode as string)
  } catch (err) {
    console.error('❌ gagal update:', err)
  } finally {
    isSavingEdit.value = false
  }
}

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(
  () => route.params.kode,
  (kode) => {
    if (!kode) return
    // Reset tree dan state lain agar tidak bocor data perusahaan sebelumnya
    organizationTree.value = []
    expandedNodes.value = {}
    selectedParentNode.value = null
    formPosition.value.idPos = ''
    fetchData(kode as string)
  },
  { immediate: true }
)

watch(
  () => formUnit.value.idsubArea,
  (id) => {
    if (!id) {
      formUnit.value.subarea = ''
      return
    }
    const selected = subAreaOptions.value.find((s) => s.sub_area === id)
    formUnit.value.subarea = selected?.shortText || selected?.longText || ''
  }
)

watch(
  () => formPosition.value.chief,
  (val) => {
    if (!val) {
      formPosition.value.chiefLevel = ''
      positionErrors.value.chiefLevel = false
    }
  }
)
</script>
