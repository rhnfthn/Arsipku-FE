<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ $t("stu_title") }}
          </h1>
          <!-- Breadcrumb -->
          <nav
            class="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <NuxtLink
              to="/beranda"
              class="text-gray-500 dark:text-gray-400 font-medium hover:text-primary dark:hover:text-primary-400 transition-colors text-xs"
            >
              {{ $t("beranda") }}
            </NuxtLink>
            <span class="mx-1.5 text-gray-400 dark:text-gray-500 text-xs"
              >/</span
            >
            <NuxtLink
              to="/master/perusahaan"
              class="text-gray-500 dark:text-gray-400 font-medium hover:text-primary dark:hover:text-primary-400 transition-colors text-xs"
            >
              {{ $t("stu_breadcrumb_master") }}
            </NuxtLink>
            <span class="mx-1.5 text-gray-400 dark:text-gray-500 text-xs"
              >/</span
            >
            <span
              class="text-primary-400 dark:text-primary-300 font-semibold text-xs"
            >
              {{ $t("stu_title") }}
            </span>
          </nav>
        </div>
        <NuxtLink
          :to="`/master/perusahaan/${route.params.kode}/area`"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
        >
          <MapPin class="w-4 h-4" />
          {{ $t("stu_kelola_area") }}
        </NuxtLink>
      </div>

      <!-- Search Bar -->
      <div class="mb-6">
        <div class="relative max-w-6xl">
          <Search
            class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="searchQuery"
            @input="handleSearch"
            :placeholder="$t('stu_cari_placeholder')"
            class="w-full pl-12 pr-12 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        <!-- Search Results Info -->
        <div
          v-if="searchQuery && !loadingSearch && !loadingExpand"
          class="mt-4 space-y-2"
        >
          <!-- Summary -->
          <div class="flex flex-wrap items-center gap-4">
            <div
              v-if="searchResults.organizations.length > 0"
              class="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary border border-primary-200 dark:border-primary-800 rounded-lg"
            >
              <Building
                class="w-4 h-4 text-primary-600 dark:text-primary-400"
              />
              <span class="text-sm">
                <span
                  class="font-semibold text-primary-700 dark:text-primary-300"
                >
                  {{ searchResults.organizations.length }}
                </span>
                <span class="text-primary-600 dark:text-primary-400">
                  {{ $t("stu_label_unit") }}
                </span>
              </span>
            </div>

            <div
              v-if="searchResults.positions.length > 0"
              class="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
            >
              <User class="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span class="text-sm">
                <span
                  class="font-semibold text-orange-700 dark:text-orange-300"
                >
                  {{ searchResults.positions.length }}
                </span>
                <span class="text-orange-600 dark:text-orange-400">
                  {{ $t("stu_label_posisi") }}
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
                  {{ $t("stu_label_anggota") }}
                </span>
              </span>
            </div>

            <p
              v-if="totalResults > 0"
              class="text-sm text-gray-600 dark:text-gray-400 ml-auto"
            >
              {{ $t("stu_total_hasil") }}
              <span
                class="font-semibold text-primary-600 dark:text-primary-400"
              >
                {{ totalResults }}
              </span>
              {{ $t("stu_hasil_untuk") }} "
              <span class="font-medium">{{ searchQuery }}</span
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
              {{ $t("stu_tidak_ada_hasil") }} "{{ searchQuery }}"
            </p>
          </div>
        </div>

        <div
          v-if="loadingSearch || loadingExpand"
          class="mt-3 flex items-center gap-2"
        >
          <div
            class="w-4 h-4 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"
          ></div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{
              loadingSearch
                ? $t("stu_loading_search")
                : $t("stu_loading_expand")
            }}
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
                <ChevronDown
                  v-if="companyExpanded"
                  class="w-5 h-5 text-white"
                />
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
                {{ $t("stu_tambah_unit") }}
              </button>
              <button
                @click="openEditModal(company, 'company')"
                class="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Pencil class="w-5 h-5" />
              </button>
              <button
                @click="openDelete(company)"
                class="p-2 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Organization Tree -->
        <div v-if="companyExpanded" class="p-8" ref="treeContainer">
          <div v-if="displayTree.length === 0" class="text-center py-12">
            <Building
              class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
            />
            <p class="text-gray-500 dark:text-gray-400 text-lg">
              {{ $t("stu_belum_ada_struktur") }}
            </p>
            <button
              @click="openAddUnitModal(null, 'company')"
              class="mt-4 flex items-center gap-2 mx-auto px-6 py-3 bg-primary hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus class="w-4 h-4" />
              {{ $t("stu_tambah_unit_pertama") }}
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
      <Modal v-model="showAddUnitModal" size="xl" @save="handleSaveUnit">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">
            {{ $t("stu_modal_add_unit") }}
          </h3>
        </template>

        <div class="space-y-4 p-1">
          <!-- Nama Unit -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_nama_unit") }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.namaUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              :placeholder="$t('stu_form_nama_unit_placeholder')"
            />
          </div>

          <!-- Nama Pendek -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_nama_pendek") }}
              <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.titelatur"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              :placeholder="$t('stu_form_nama_pendek_placeholder')"
            />
          </div>

          <!-- ID Unit -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_id_unit") }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.idUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              :placeholder="$t('stu_form_id_unit_placeholder')"
            />
          </div>

          <!-- Sub Area Dropdown -->
          <div class="sub-area-dropdown-container">
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_sub_area") }} <span class="text-red-500">*</span>
            </Heading>

            <div class="relative mt-1">
              <button
                type="button"
                @click="showSubAreaDropdown = !showSubAreaDropdown"
                class="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <span
                  :class="
                    formUnit.idsubArea ? 'text-gray-900' : 'text-gray-400'
                  "
                >
                  {{
                    getSelectedSubAreaText() || $t("stu_form_pilih_sub_area")
                  }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400" />
              </button>

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
                      formUnit.idsubArea === sub.sub_area
                        ? 'bg-primary-100 font-medium'
                        : '',
                    ]"
                  >
                    <p class="text-sm">
                      {{ sub.sub_area }} - {{ sub.shortText || sub.longText }}
                    </p>
                  </div>

                  <div
                    v-if="filteredSubAreas.length === 0"
                    class="px-3 py-4 text-center text-gray-500 text-sm"
                  >
                    {{ $t("stu_form_sub_area_not_found") }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tanggal -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_mulai") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formUnit.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_berakhir") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formUnit.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
          <p class="text-xs text-red-500">{{ $t("stu_form_tgl_warning") }}</p>
        </div>
      </Modal>
    </Teleport>

    <!-- ==================== ADD POSITION MODAL ==================== -->
    <Teleport to="body">
      <Modal
        v-model="showAddPositionModal"
        size="xl"
        @save="handleSavePosition"
      >
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">
            {{ $t("stu_modal_add_posisi") }}
          </h3>
        </template>

        <div class="space-y-4 p-1">
          <!-- Nama Posisi -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_nama_posisi") }}
              <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.namaPos"
              :placeholder="$t('stu_form_nama_posisi_placeholder')"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <!-- Nama Pendek / Titelatur -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_titelatur") }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.titelatur"
              :placeholder="$t('stu_form_titelatur_placeholder')"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <!-- ID Posisi -->
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_id_posisi") }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.idPos"
              :placeholder="$t('stu_form_id_posisi_placeholder')"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
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
              <span
                class="text-sm font-medium"
                :class="{ 'text-gray-400': parentHasChief }"
              >
                {{ $t("stu_form_chief") }}
              </span>
            </label>
            <p v-if="parentHasChief" class="text-xs text-red-500 mt-1">
              {{ $t("stu_form_chief_sudah_ada") }}
            </p>
          </div>

          <!-- Level Chief -->
          <div v-if="formPosition.chief">
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_level_chief") }}
              <span class="text-red-500">*</span>
            </Heading>
            <select
              v-model="formPosition.chiefLevel"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="">{{ $t("stu_form_pilih_level") }}</option>
              <option
                v-for="opt in chiefOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Tanggal -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_mulai") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formPosition.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_berakhir") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formPosition.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
          <p class="text-xs text-red-500">{{ $t("stu_form_tgl_warning") }}</p>
        </div>
      </Modal>
    </Teleport>

    <!-- ==================== ADD MEMBER MODAL ==================== -->
    <Teleport to="body">
      <Modal v-model="showAddMemberModal" size="xl" @save="handleSaveMember">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">
            {{ $t("stu_modal_add_anggota") }}
          </h3>
        </template>

        <div class="space-y-4 p-1">
          <!-- Person Dropdown -->
          <div class="person-dropdown-container mt-4">
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_nama_anggota") }}
              <span class="text-red-500">*</span>
            </Heading>

            <div class="relative mt-1">
              <button
                type="button"
                @click="togglePersonDropdown"
                class="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <span
                  :class="
                    formMember.personId ? 'text-gray-900' : 'text-gray-400'
                  "
                >
                  {{ getSelectedPersonText() || $t("stu_form_pilih_anggota") }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400" />
              </button>

              <div
                v-if="showPersonDropdown"
                class="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg"
                @click.stop
              >
                <div class="p-2 border-b border-gray-200">
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="personSearchQuery"
                      @input="filterPersons"
                      :placeholder="$t('stu_form_cari_anggota')"
                      class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      @click.stop
                    />
                  </div>
                </div>

                <!-- Loading State -->
                <div v-if="loadingPersons" class="p-4 text-center">
                  <div
                    class="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"
                  ></div>
                  <p class="text-sm text-gray-500 mt-2">
                    {{ $t("stu_form_memuat_anggota") }}
                  </p>
                </div>

                <!-- Options List -->
                <div v-else class="max-h-64 overflow-y-auto">
                  <div
                    v-for="p in filteredPersons"
                    :key="p.id"
                    @click="selectPerson(p)"
                    :class="[
                      'px-3 py-2 cursor-pointer hover:bg-primary-50 transition-colors',
                      formMember.personId === p.id
                        ? 'bg-primary-100 font-medium'
                        : '',
                    ]"
                  >
                    <p class="text-sm font-medium">{{ p.name }}</p>
                    <p class="text-xs text-gray-500">PN: {{ p.persnum }}</p>
                  </div>

                  <div
                    v-if="filteredPersons.length === 0"
                    class="px-3 py-4 text-center text-gray-500 text-sm"
                  >
                    {{ $t("stu_form_anggota_not_found") }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tanggal -->
          <div class="grid grid-cols-2 gap-4 mt-7 mb-8">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_mulai") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_berakhir") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
          <p class="text-xs text-red-500">{{ $t("stu_form_tgl_warning") }}</p>
        </div>
      </Modal>
    </Teleport>

    <!-- ==================== EDIT MODAL ==================== -->
    <Teleport to="body">
      <Modal v-model="showEditModal" size="xl" @save="handleSaveEdit">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-5 ml-5">
            {{ editTypeLabel }}
          </h3>
        </template>

        <!-- EDIT UNIT -->
        <div v-if="editType === 'Unit'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_nama_unit") }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.namaUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_kode_unit") }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.idUnit"
              disabled
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_mulai") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formUnit.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_berakhir") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formUnit.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
          <p class="text-xs text-red-500">{{ $t("stu_form_tgl_warning") }}</p>
        </div>

        <!-- EDIT POSISI -->
        <div v-if="editType === 'Posisi'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_nama_posisi") }}
              <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.namaPos"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_kode_posisi") }}
              <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.idPos"
              disabled
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_mulai") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formPosition.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_berakhir") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formPosition.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
          <p class="text-xs text-red-500">{{ $t("stu_form_tgl_warning") }}</p>
        </div>

        <!-- EDIT ANGGOTA -->
        <div v-if="editType === 'Anggota'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_nama_anggota") }}
              <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formMember.nama"
              disabled
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              {{ $t("stu_form_personal_number") }}
              <span class="text-red-500">*</span>
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
                {{ $t("stu_form_tgl_mulai") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                {{ $t("stu_form_tgl_berakhir") }}
                <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
          <p class="text-xs text-red-500">{{ $t("stu_form_tgl_warning") }}</p>
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
      @confirm="deleteNow"
      @cancel="confirmDeleteOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
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
  AlertCircle,
} from "lucide-vue-next";

definePageMeta({
  middleware: "auth",
});

import { useStruktur } from "~/composables/useStruktur";
import { useCompany } from "~/composables/useCompany";
import { useArea } from "~/composables/useArea";
import { useToast } from "#imports";
import { usePerson } from "~/composables/usePerson";

// ─── i18n ────────────────────────────────────────────────────────────────────
const { t } = useI18n();

// ─── Composables ─────────────────────────────────────────────────────────────
const { getPersons } = usePerson();

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
  updateOrganization,
} = useStruktur();

const { getCompanyByCode } = useCompany();
const { getSubAreasByCompany } = useArea();
const toast = useToast();
const route = useRoute();

// ─── State ───────────────────────────────────────────────────────────────────
const confirmDeleteOpen = ref(false);
const itemToDelete = ref(null);

const companyExpanded = ref(true);
const expandedNodes = ref<Record<string, boolean>>({});
const previousExpandedState = ref<Record<string, boolean>>({});
const hoveredNode = ref<string | null>(null);
const editingNode = ref<any>(null);
const highlightNodeId = ref<string | null>(null);
const treeContainer = ref<HTMLElement | null>(null);

const searchQuery = ref("");
const searchResults = ref<{
  organizations: any[];
  positions: any[];
  persons: any[];
}>({
  organizations: [],
  positions: [],
  persons: [],
});
const loadingSearch = ref(false);
const loadingExpand = ref(false);

// Modal search states
const subAreaSearchQuery = ref("");
const personSearchQuery = ref("");
const filteredSubAreas = ref<any[]>([]);
const filteredPersons = ref<any[]>([]);
const showSubAreaDropdown = ref(false);
const showPersonDropdown = ref(false);

// Modals
const showAddUnitModal = ref(false);
const showAddPositionModal = ref(false);
const showAddMemberModal = ref(false);
const showEditModal = ref(false);
const editType = ref<string | null>(null);

// Forms
const formUnit = ref({
  namaUnit: "",
  idUnit: "",
  titelatur: "",
  idsubArea: "",
  subarea: "",
  deskripsi: "",
  mulai: "",
  berakhir: "",
});

const formPosition = ref({
  namaPos: "",
  idPos: "",
  titelatur: "",
  chief: false,
  chiefLevel: "",
  mulai: "",
  berakhir: "",
});

const formMember = ref({
  personId: "",
  nama: "",
  mulai: "",
  berakhir: "",
});

// Data
const company = ref<any>(null);
const organizationTree = ref<any[]>([]);
const subAreaOptions = ref<any[]>([]);
const loadingSubArea = ref(false);
const parentHasChief = ref(false);
const personOptions = ref<any[]>([]);
const loadingPersons = ref(false);
const personsLoaded = ref(false);
const selectedParentNode = ref<any>(null);

const chiefOptions = [
  { label: "BOD", value: "BOD" },
  { label: "BOD-1", value: "BOD-1" },
  { label: "BOD-2", value: "BOD-2" },
  { label: "BOD-3", value: "BOD-3" },
];

const bodOrder: Record<string, number> = {
  BOD: 1,
  "BOD-1": 2,
  "BOD-2": 3,
  "BOD-3": 4,
};

// ─── Computed ─────────────────────────────────────────────────────────────────

// Judul edit modal — computed agar reaktif saat bahasa berubah
const editTypeLabel = computed(() => {
  if (editType.value === "Unit") return t("stu_modal_edit_unit");
  if (editType.value === "Posisi") return t("stu_modal_edit_posisi");
  if (editType.value === "Anggota") return t("stu_modal_edit_anggota");
  return "";
});

const totalResults = computed(
  () =>
    searchResults.value.organizations.length +
    searchResults.value.positions.length +
    searchResults.value.persons.length,
);

const searchResultsMap = computed(() => {
  const map: Record<string, string> = {};
  searchResults.value.organizations.forEach((org) => {
    map[org.id] = "organization";
  });
  searchResults.value.positions.forEach((pos) => {
    map[pos.id] = "position";
  });
  searchResults.value.persons.forEach((person) => {
    map[person.id] = "person";
  });
  return map;
});

const displayTree = computed(() => organizationTree.value);

// ─── Toast helper ─────────────────────────────────────────────────────────────
const showSuccessToast = (message: string) => {
  toast.add({
    title: t("berhasil"),
    description: message,
    color: "success",
    icon: "i-lucide-check-circle",
  });
};

// ─── Click-outside handler ────────────────────────────────────────────────────
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  if (showSubAreaDropdown.value) {
    const isClickInside = target.closest(".sub-area-dropdown-container");
    if (!isClickInside) showSubAreaDropdown.value = false;
  }

  if (showPersonDropdown.value) {
    const isClickInside = target.closest(".person-dropdown-container");
    if (!isClickInside) showPersonDropdown.value = false;
  }
};

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));

// ─── Search ───────────────────────────────────────────────────────────────────
let searchTimeout: any = null;

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    clearSearch();
    return;
  }
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    await performSearch();
  }, 300);
};

const performSearch = async () => {
  if (!company.value?.kode || !searchQuery.value.trim()) return;

  try {
    if (Object.keys(previousExpandedState.value).length === 0) {
      previousExpandedState.value = { ...expandedNodes.value };
    }

    expandedNodes.value = {};
    highlightNodeId.value = null;
    companyExpanded.value = false;
    loadingSearch.value = true;

    const [orgRes, posRes, personRes] = await Promise.all([
      searchOrganization(String(company.value.kode), searchQuery.value.trim()),
      searchPosition(String(company.value.kode), searchQuery.value.trim()),
      searchPerson(String(company.value.kode), searchQuery.value.trim()),
    ]);

    searchResults.value = {
      organizations: orgRes.data || [],
      positions: posRes.data || [],
      persons: personRes.data || [],
    };

    loadingSearch.value = false;

    if (totalResults.value > 0) {
      companyExpanded.value = true;
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      loadingExpand.value = true;
      await autoExpandSearchResults();
      loadingExpand.value = false;

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 200));
      await scrollToFirstResult();
    } else {
      companyExpanded.value = false;
    }
  } catch (err) {
    console.error("❌ Search error:", err);
    searchResults.value = { organizations: [], positions: [], persons: [] };
  } finally {
    loadingSearch.value = false;
    loadingExpand.value = false;
  }
};

const clearSearch = () => {
  searchQuery.value = "";

  if (Object.keys(previousExpandedState.value).length > 0) {
    expandedNodes.value = { ...previousExpandedState.value };
    companyExpanded.value = true;
  } else {
    expandedNodes.value = {};
    companyExpanded.value = true;
  }

  previousExpandedState.value = {};
  highlightNodeId.value = null;
  searchResults.value = { organizations: [], positions: [], persons: [] };
};

const scrollToFirstResult = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 500));

  let firstResultId: string | null = null;
  if (searchResults.value.persons.length > 0) {
    firstResultId = searchResults.value.persons[0].id;
  } else if (searchResults.value.positions.length > 0) {
    firstResultId = searchResults.value.positions[0].id;
  } else if (searchResults.value.organizations.length > 0) {
    firstResultId = searchResults.value.organizations[0].id;
  }

  if (firstResultId) {
    highlightNodeId.value = firstResultId;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 300));

    const element = document.querySelector(`[data-node-id="${firstResultId}"]`);
    const scrollTo = (el: Element) => {
      const offset = 200;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      setTimeout(() => {
        highlightNodeId.value = null;
      }, 3000);
    };

    if (element) {
      scrollTo(element);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const retry = document.querySelector(`[data-node-id="${firstResultId}"]`);
      if (retry) scrollTo(retry);
    }
  }
};

const autoExpandSearchResults = async () => {
  // Step 1: Organizations
  for (const org of searchResults.value.organizations) {
    const orgNode = findNodeInTree(
      organizationTree.value,
      (n) => n.id === org.id || n.organizationCode === org.organization,
    );
    if (orgNode) {
      expandedNodes.value[orgNode.id] = true;
      if (!orgNode._positionsLoaded) await loadPositions(orgNode);
      await expandParentNodes(orgNode.id);
    }
  }

  // Step 2: Positions
  for (const pos of searchResults.value.positions) {
    const orgNode = findNodeInTree(
      organizationTree.value,
      (n) =>
        (n.type === "unit" || n.type === "direktorat") &&
        n.organizationCode === pos.organization,
    );
    if (orgNode) {
      expandedNodes.value[orgNode.id] = true;
      if (!orgNode._positionsLoaded) await loadPositions(orgNode);

      const posNode = findNodeInTree(
        orgNode.children,
        (n) => n.type === "position" && n.positionCode === pos.position,
      );
      if (posNode) {
        expandedNodes.value[posNode.id] = true;
        if (!posNode._personsLoaded) await loadPersons(posNode);
      }
      await expandParentNodes(orgNode.id);
    }
  }

  // Step 3: Persons
  for (const person of searchResults.value.persons) {
    const searchAndExpandForPerson = async (nodes: any[]): Promise<boolean> => {
      for (const node of nodes) {
        if (node.type === "unit" || node.type === "direktorat") {
          if (!node._positionsLoaded) await loadPositions(node);

          for (const posNode of node.children.filter(
            (c: any) => c.type === "position",
          )) {
            if (!posNode._personsLoaded) await loadPersons(posNode);

            const personNode = posNode.children.find(
              (p: any) => p.type === "member" && p.persnum === person.persnum,
            );

            if (personNode) {
              expandedNodes.value[node.id] = true;
              expandedNodes.value[posNode.id] = true;
              expandedNodes.value[personNode.id] = true;
              await expandParentNodes(node.id);
              return true;
            }
          }

          const childUnits = node.children.filter(
            (c: any) => c.type === "unit" || c.type === "direktorat",
          );
          if (childUnits.length > 0) {
            const found = await searchAndExpandForPerson(childUnits);
            if (found) {
              expandedNodes.value[node.id] = true;
              return true;
            }
          }
        }
      }
      return false;
    };
    await searchAndExpandForPerson(organizationTree.value);
  }
};

const findNodeInTree = (
  nodes: any[],
  predicate: (node: any) => boolean,
): any => {
  for (const node of nodes) {
    if (predicate(node)) return node;
    if (node.children?.length) {
      const found = findNodeInTree(node.children, predicate);
      if (found) return found;
    }
  }
  return null;
};

const expandParentNodes = async (nodeId: string) => {
  const findAndExpand = async (
    nodes: any[],
    targetId: string,
  ): Promise<boolean> => {
    for (const node of nodes) {
      if (node.id === targetId) {
        expandedNodes.value[node.id] = true;
        if (
          (node.type === "unit" || node.type === "direktorat") &&
          !node._positionsLoaded
        )
          await loadPositions(node);
        if (node.type === "position" && !node._personsLoaded)
          await loadPersons(node);
        return true;
      }
      if (node.children?.length) {
        const found = await findAndExpand(node.children, targetId);
        if (found) {
          expandedNodes.value[node.id] = true;
          if (
            (node.type === "unit" || node.type === "direktorat") &&
            !node._positionsLoaded
          )
            await loadPositions(node);
          if (node.type === "position" && !node._personsLoaded)
            await loadPersons(node);
          return true;
        }
      }
    }
    return false;
  };
  await findAndExpand(organizationTree.value, nodeId);
};

// ─── Data Fetching ────────────────────────────────────────────────────────────
const fetchData = async (kode: string | number) => {
  try {
    const companyRes = await getCompanyByCode(String(kode));
    if (!companyRes) return;

    company.value = {
      kode: companyRes.company,
      namaPendek: companyRes.shortText,
      namaPanjang: companyRes.longText,
      tanggalMulai: companyRes.startDate,
      tanggalBerakhir: companyRes.endDate,
    };

    const res = await getCompanyTree(String(kode));
    organizationTree.value = await mapCompanyTree(res.data.tree);
  } catch (err) {
    console.error("❌ fetchData error:", err);
  }
};

const mapCompanyTree = async (nodes: any[], level = 0): Promise<any[]> => {
  const result = [];
  for (const node of nodes) {
    if (isExpired(node.endDate)) {
      await deleteOrganization(node.id);
      continue;
    }
    result.push({
      id: node.id,
      organizationCode: node.organization,
      type: level === 0 ? "direktorat" : "unit",
      level,
      shortText: node.shortText,
      longText: node.longText,
      name: node.longText || node.shortText,
      startDate: node.startDate,
      endDate: node.endDate,
      children: node.children
        ? await mapCompanyTree(node.children, level + 1)
        : [],
      _positionsLoaded: false,
    });
  }
  return result;
};

const mapPositionToNode = (pos: any) => ({
  id: pos.id,
  positionCode: pos.position,
  organizationCode: pos.organization,
  type: "position",
  longText: pos.long_text,
  shortText: pos.short_text,
  bodTag: pos.bod_tag,
  name: pos.long_text || pos.short_text || "-",
  startDate: pos.start_date,
  endDate: pos.end_date,
  children: [],
  _personsLoaded: false,
});

const mapPersonToNode = (person: any, positionCode: number) => ({
  id: person.id_relation_sp,
  type: "member",
  name: person.name,
  persnum: person.persnum,
  positionCode,
  startDate: person.start_date,
  endDate: person.end_date,
  children: [],
});

const isExpired = (endDate?: string) => {
  if (!endDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return end <= today;
};

const loadPositions = async (node: any) => {
  if (node._positionsLoaded) return;
  const res = await getPositionsByOrganization(String(node.organizationCode));
  const validPositions: any[] = [];
  for (const pos of res.data) {
    if (isExpired(pos.end_date)) {
      await deletePosition(pos.id);
      continue;
    }
    validPositions.push(mapPositionToNode(pos));
  }
  const sortedPositions = sortPositionsByBod(validPositions);
  node.children = [
    ...sortedPositions,
    ...(node.children || []).filter((c: any) => c.type !== "position"),
  ];
  node._positionsLoaded = true;
};

const loadPersons = async (node: any) => {
  if (node._personsLoaded) return;
  if (!node.positionCode) return;
  try {
    const res = await getPersonsByPosition(node.positionCode);
    const validPersons: any[] = [];
    for (const p of res.data) {
      if (isExpired(p.end_date)) {
        await deletePerson(p.id_relation_sp);
        continue;
      }
      validPersons.push(mapPersonToNode(p, node.positionCode));
    }
    node.children = validPersons;
    node._personsLoaded = true;
  } catch (err) {
    console.error("❌ gagal load person:", err);
  }
};

const loadPersonsIfNeeded = async () => {
  if (personsLoaded.value || loadingPersons.value) return;
  try {
    loadingPersons.value = true;
    const res = await getPersons();
    personOptions.value = res.data || [];
    filteredPersons.value = res.data || [];
    personsLoaded.value = true;
  } catch (err) {
    console.error("❌ gagal load person:", err);
  } finally {
    loadingPersons.value = false;
  }
};

const sortPositionsByBod = (positions: any[]) =>
  [...positions].sort((a, b) => {
    const aOrder = bodOrder[a.bodTag ?? ""] ?? 99;
    const bOrder = bodOrder[b.bodTag ?? ""] ?? 99;
    return aOrder - bOrder;
  });

const formatDate = (date: string) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toDateOnly = (val?: string) => (val ? val.split("T")[0] : null);

// ─── Dropdown helpers ─────────────────────────────────────────────────────────
const getSelectedSubAreaText = () => {
  if (!formUnit.value.idsubArea) return "";
  const selected = subAreaOptions.value.find(
    (sub) => sub.sub_area === formUnit.value.idsubArea,
  );
  return selected
    ? `${selected.sub_area} - ${selected.shortText || selected.longText}`
    : "";
};

const getSelectedPersonText = () => {
  if (!formMember.value.personId) return "";
  const selected = personOptions.value.find(
    (p) => p.id === formMember.value.personId,
  );
  return selected ? `${selected.name} (PN: ${selected.persnum})` : "";
};

const filterSubAreas = () => {
  const query = subAreaSearchQuery.value.toLowerCase().trim();
  filteredSubAreas.value = !query
    ? subAreaOptions.value
    : subAreaOptions.value.filter(
        (sub) =>
          String(sub.sub_area).toLowerCase().includes(query) ||
          (sub.shortText || "").toLowerCase().includes(query) ||
          (sub.longText || "").toLowerCase().includes(query),
      );
};

const selectSubArea = (sub: any) => {
  formUnit.value.idsubArea = sub.sub_area;
  formUnit.value.subarea = sub.shortText || sub.longText || "";
  showSubAreaDropdown.value = false;
  subAreaSearchQuery.value = "";
};

const filterPersons = () => {
  const query = personSearchQuery.value.toLowerCase().trim();
  filteredPersons.value = !query
    ? personOptions.value
    : personOptions.value.filter(
        (person) =>
          (person.name || "").toLowerCase().includes(query) ||
          String(person.persnum || "")
            .toLowerCase()
            .includes(query),
      );
};

const selectPerson = (person: any) => {
  formMember.value.personId = person.id;
  formMember.value.nama = person.name;
  showPersonDropdown.value = false;
  personSearchQuery.value = "";
};

const togglePersonDropdown = async () => {
  showPersonDropdown.value = !showPersonDropdown.value;
  if (showPersonDropdown.value) await loadPersonsIfNeeded();
};

// ─── Form resets ──────────────────────────────────────────────────────────────
const resetUnitForm = () => {
  formUnit.value = {
    namaUnit: "",
    idUnit: "",
    titelatur: "",
    idsubArea: "",
    subarea: "",
    deskripsi: "",
    mulai: "",
    berakhir: "",
  };
  subAreaSearchQuery.value = "";
};

const resetPositionForm = () => {
  formPosition.value = {
    namaPos: "",
    idPos: "",
    titelatur: "",
    chief: false,
    chiefLevel: "",
    mulai: "",
    berakhir: "",
  };
};

const resetMemberForm = () => {
  formMember.value = { personId: "", nama: "", mulai: "", berakhir: "" };
  personSearchQuery.value = "";
};

// ─── Node interaction ─────────────────────────────────────────────────────────
const toggleNode = async (node: any) => {
  const isExpanded = expandedNodes.value[node.id] ?? false;
  expandedNodes.value[node.id] = !isExpanded;
  if (isExpanded) return;
  if (
    (node.type === "unit" || node.type === "direktorat") &&
    !node._positionsLoaded
  )
    await loadPositions(node);
  if (node.type === "position") await loadPersons(node);
};

const setHoveredNode = (id: string | null) => {
  hoveredNode.value = id;
};

const hasChildren = (node: any) =>
  Array.isArray(node.children) && node.children.length > 0;

// ─── Modal openers ────────────────────────────────────────────────────────────
const openEditModal = (item: any) => {
  editingNode.value = item;

  if (item.type === "unit" || item.type === "direktorat") {
    editType.value = "Unit";
    formUnit.value = {
      namaUnit: item.longText || item.shortText,
      idUnit: item.organizationCode,
      titelatur: item.shortText,
      idsubArea: item.subArea,
      subarea: item.subAreaText,
      deskripsi: "",
      mulai: toDateOnly(item.startDate) ?? "",
      berakhir: toDateOnly(item.endDate) ?? "",
    };
  }

  if (item.type === "position") {
    editType.value = "Posisi";
    formPosition.value = {
      namaPos: item.longText,
      idPos: item.positionCode,
      titelatur: item.shortText,
      chief: !!item.bodTag,
      chiefLevel: item.bodTag ?? "",
      mulai: toDateOnly(item.startDate) ?? "",
      berakhir: toDateOnly(item.endDate) ?? "",
    };
  }

  if (item.type === "member") {
    editType.value = "Anggota";
    formMember.value = {
      nama: item.name,
      personId: item.persnum,
      mulai: toDateOnly(item.startDate) ?? "",
      berakhir: toDateOnly(item.endDate) ?? "",
    };
  }

  showEditModal.value = true;
};

const openDelete = (item: any) => {
  if (hasChildren(item)) {
    alert(t("stu_err_has_children"));
    return;
  }
  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const openAddUnitModal = async (parent: any, type: string) => {
  resetUnitForm();
  selectedParentNode.value = parent;
  showAddUnitModal.value = true;
  if (!company.value?.kode) return;
  const res = await getSubAreasByCompany(String(company.value.kode));
  subAreaOptions.value = res.data || [];
  filteredSubAreas.value = res.data || [];
};

const openAddPositionModal = async (parent: any) => {
  resetPositionForm();
  selectedParentNode.value = parent;
  if (!parent._positionsLoaded) await loadPositions(parent);
  parentHasChief.value = checkParentHasChief(parent);
  if (parentHasChief.value) {
    formPosition.value.chief = false;
    formPosition.value.chiefLevel = "";
  }
  showAddPositionModal.value = true;
};

const openAddMemberModal = (parent: any) => {
  resetMemberForm();
  selectedParentNode.value = parent;
  showAddMemberModal.value = true;
};

const checkParentHasChief = (parent: any) => {
  if (!parent?.children) return false;
  return parent.children.some((c: any) => c.type === "position" && !!c.bodTag);
};

// ─── CRUD handlers ────────────────────────────────────────────────────────────
const removeNodeById = (nodes: any[], id: string): boolean => {
  const index = nodes.findIndex((n) => n.id === id);
  if (index !== -1) {
    nodes.splice(index, 1);
    return true;
  }
  for (const node of nodes) {
    if (node.children?.length && removeNodeById(node.children, id)) return true;
  }
  return false;
};

const deleteNow = async () => {
  if (!itemToDelete.value) return;
  try {
    const item = itemToDelete.value;
    if (hasChildren(item)) {
      alert(t("stu_err_has_children"));
      return;
    }

    if (item.type === "member") {
      await deletePerson(item.id);
      removeNodeById(organizationTree.value, item.id);
      showSuccessToast(t("stu_success_delete_anggota"));
    } else if (item.type === "position") {
      await deletePosition(item.id);
      removeNodeById(organizationTree.value, item.id);
      showSuccessToast(t("stu_success_delete_posisi"));
    } else {
      await deleteOrganization(item.id);
      await fetchData(route.params.kode as string);
      showSuccessToast(t("stu_success_delete_unit"));
    }

    confirmDeleteOpen.value = false;
  } catch (error) {
    console.error("❌ Error deleting item:", error);
  } finally {
    itemToDelete.value = null;
  }
};

const handleSaveUnit = async () => {
  try {
    if (isNaN(Number(formUnit.value.idUnit))) {
      toast.add({
        title: t("gagal"),
        description: t("stu_err_id_unit_angka"),
        color: "error",
        icon: "i-lucide-x-circle",
      });
      return;
    }
    if (!company.value?.kode) return;

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
      endDate: formUnit.value.berakhir,
    };

    await createOrganization(payload);
    await fetchData(route.params.kode as string);
    showSuccessToast(t("stu_success_add_unit"));
    showAddUnitModal.value = false;
    resetUnitForm();
  } catch (err) {
    console.error("❌ gagal create organization:", err);
  }
};

const handleSavePosition = async () => {
  try {
    if (isNaN(Number(formPosition.value.idPos))) {
      toast.add({
        title: t("gagal"),
        description: t("stu_err_id_posisi_angka"),
        color: "error",
        icon: "i-lucide-x-circle",
      });
      return;
    }
    if (!company.value?.kode || !selectedParentNode.value) return;

    const payload = {
      company: Number(company.value.kode),
      position: Number(formPosition.value.idPos),
      shortText: formPosition.value.titelatur,
      longText: formPosition.value.namaPos,
      abbreviation: formPosition.value.namaPos,
      organization: Number(selectedParentNode.value.organizationCode),
      bodTag: formPosition.value.chief ? formPosition.value.chiefLevel : null,
      startDate: formPosition.value.mulai,
      endDate: formPosition.value.berakhir,
    };

    await createPosition(payload);
    selectedParentNode.value._positionsLoaded = false;
    await loadPositions(selectedParentNode.value);
    showSuccessToast(t("stu_success_add_posisi"));
    showAddPositionModal.value = false;
    resetPositionForm();
  } catch (err) {
    console.error("❌ gagal create position:", err);
  }
};

const handleSaveMember = async () => {
  try {
    if (!company.value?.kode || !selectedParentNode.value) return;
    const selectedPerson = personOptions.value.find(
      (p) => p.id === formMember.value.personId,
    );
    if (!selectedPerson) return;

    const payload = {
      persnum: Number(selectedPerson.persnum),
      company: Number(company.value.kode),
      position: Number(selectedParentNode.value.positionCode),
      startDate: formMember.value.mulai,
      endDate: formMember.value.berakhir,
    };

    await assignPersonToPosition(payload);
    selectedParentNode.value._personsLoaded = false;
    await loadPersons(selectedParentNode.value);
    showSuccessToast(t("stu_success_add_anggota"));
    showAddMemberModal.value = false;
    resetMemberForm();
  } catch (err) {
    console.error("❌ gagal assign person:", err);
  }
};

const handleSaveEdit = async () => {
  if (!editingNode.value) return;
  try {
    if (editType.value === "Unit") {
      const payload = {
        shortText: formUnit.value.titelatur,
        longText: formUnit.value.namaUnit,
        abbreviation: formUnit.value.namaUnit,
        subArea: Number(formUnit.value.idsubArea),
        subAreaText: formUnit.value.subarea,
        startDate: formUnit.value.mulai,
        endDate: formUnit.value.berakhir,
      };
      await updateOrganization(editingNode.value.id, payload);
      showSuccessToast(t("stu_success_edit_unit"));
    }

    if (editType.value === "Posisi") {
      const payload = {
        longText: formPosition.value.namaPos,
        abbreviation: formPosition.value.namaPos,
        bodTag: formPosition.value.chief ? formPosition.value.chiefLevel : null,
        startDate: toDateOnly(formPosition.value.mulai),
        endDate: toDateOnly(formPosition.value.berakhir),
      };
      await updatePosition(editingNode.value.id, payload);
      showSuccessToast(t("stu_success_edit_posisi"));

      editingNode.value.longText = formPosition.value.namaPos;
      editingNode.value.name = formPosition.value.namaPos;
      editingNode.value.bodTag = formPosition.value.chief
        ? formPosition.value.chiefLevel
        : null;
      editingNode.value.startDate = formPosition.value.mulai;
      editingNode.value.endDate = formPosition.value.berakhir;
    }

    if (editType.value === "Anggota") {
      const payload = {
        startDate: toDateOnly(formMember.value.mulai),
        endDate: toDateOnly(formMember.value.berakhir),
      };
      await updateAssignPerson(editingNode.value.id, payload);
      showSuccessToast(t("stu_success_edit_anggota"));
      editingNode.value.startDate = payload.startDate;
      editingNode.value.endDate = payload.endDate;
    }

    showEditModal.value = false;
    editingNode.value = null;
    await fetchData(route.params.kode as string);
  } catch (err) {
    console.error("❌ gagal update:", err);
  }
};

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(
  () => route.params.kode,
  (kode) => {
    if (!kode) return;
    fetchData(kode);
  },
  { immediate: true },
);

watch(
  () => formUnit.value.idsubArea,
  (id) => {
    if (!id) {
      formUnit.value.subarea = "";
      return;
    }
    const selected = subAreaOptions.value.find((s) => s.sub_area === id);
    formUnit.value.subarea = selected?.shortText || selected?.longText || "";
  },
);

watch(
  () => formPosition.value.chief,
  (val) => {
    if (!val) formPosition.value.chiefLevel = "";
  },
);
</script>
