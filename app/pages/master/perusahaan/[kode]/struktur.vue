<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Struktur Organisasi</h1>
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <NuxtLink
              to="/master/perusahaan"
              class="text-gray-500 font-medium hover:text-primary transition-colors text-xs"
            >
              Master Perusahaan
            </NuxtLink>
            <span class="mx-1.5 text-gray-400 text-xs">/</span>
            <span class="text-primary-400 font-semibold text-xs">
              Struktur Organisasi
            </span>
          </nav>
        </div>
        <NuxtLink
          :to="`/master/perusahaan/${route.params.kode}/area`"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
        >
          <MapPin class="w-4 h-4" />
          Kelola Area
        </NuxtLink>
      </div>

      <!-- Search Bar -->
      <div class="mb-6">
        <div class="relative max-w-6xl">
          <Search
            class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="Cari unit, posisi, atau anggota..."
            class="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X class="w-4 h-4 text-gray-400" />
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
              class="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg"
            >
              <Building class="w-4 h-4 text-primary-600" />
              <span class="text-sm">
                <span class="font-semibold text-primary-700">{{
                  searchResults.organizations.length
                }}</span>
                <span class="text-primary-600"> Unit</span>
              </span>
            </div>

            <div
              v-if="searchResults.positions.length > 0"
              class="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg"
            >
              <User class="w-4 h-4 text-orange-600" />
              <span class="text-sm">
                <span class="font-semibold text-orange-700">{{
                  searchResults.positions.length
                }}</span>
                <span class="text-orange-600"> Posisi</span>
              </span>
            </div>

            <div
              v-if="searchResults.persons.length > 0"
              class="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg"
            >
              <Users class="w-4 h-4 text-green-600" />
              <span class="text-sm">
                <span class="font-semibold text-green-700">{{
                  searchResults.persons.length
                }}</span>
                <span class="text-green-600"> Anggota</span>
              </span>
            </div>

            <p v-if="totalResults > 0" class="text-sm text-gray-600 ml-auto">
              Total
              <span class="font-semibold text-primary-600">{{
                totalResults
              }}</span>
              hasil untuk "
              <span class="font-medium">{{ searchQuery }}</span
              >"
            </p>
          </div>

          <!-- No Results -->
          <div
            v-if="totalResults === 0"
            class="flex items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <AlertCircle class="w-5 h-5 text-gray-400" />
            <p class="text-sm text-gray-600">
              Tidak ada hasil untuk "{{ searchQuery }}"
            </p>
          </div>
        </div>

        <div
          v-if="loadingSearch || loadingExpand"
          class="mt-3 flex items-center gap-2"
        >
          <div
            class="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"
          ></div>
          <p class="text-sm text-gray-500">
            {{ loadingSearch ? "Mencari..." : "Membuka struktur..." }}
          </p>
        </div>
      </div>

      <!-- Organization Tree Card -->
      <div
        class="bg-white shadow-xl border border-gray-200 rounded-2xl overflow-hidden"
      >
        <!-- Company Header -->
        <div
          class="bg-gradient-to-r from-primary to-primary-600 text-white px-6 py-5"
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
              <span
                class="px-3 py-1 bg-white/20 rounded-lg text-xs font-medium"
              >
                KP
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="openAddUnitModal(null, 'company')"
                class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/90 rounded-lg transition-colors text-primary-600 text-sm font-medium shadow-sm"
              >
                <Plus class="w-4 h-4" />
                Tambah Unit
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
            <Building class="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-500 text-lg">Belum ada struktur organisasi</p>
            <button
              @click="openAddUnitModal(null, 'company')"
              class="mt-4 flex items-center gap-2 mx-auto px-6 py-3 bg-primary hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus class="w-4 h-4" />
              Tambah Unit Pertama
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

    <!-- Add Unit Modal -->
    <Teleport to="body">
      <Modal v-model="showAddUnitModal" size="xl" @save="handleSaveUnit">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">Tambah Unit</h3>
        </template>

        <div class="space-y-4 p-1">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Unit <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.namaUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              placeholder="Contoh: DIVISI KEUANGAN"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Pendek <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.titelatur"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              placeholder="Contoh: Manager"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              ID Unit <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.idUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              placeholder="Contoh: UNIT-001"
            />
          </div>

          <div class="sub-area-dropdown-container">
            <Heading variant="heading11m" class="text-xs">
              Sub Area <span class="text-red-500">*</span>
            </Heading>

            <!-- Dropdown Toggle -->
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
                  {{ getSelectedSubAreaText() || "Pilih Sub Area" }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400" />
              </button>

              <!-- Dropdown Panel -->
              <div
                v-if="showSubAreaDropdown"
                class="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg"
                @click.stop
              >
                <!-- Search Inside Dropdown -->
                <div class="p-2 border-b border-gray-200">
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="subAreaSearchQuery"
                      @input="filterSubAreas"
                      placeholder="Cari sub area..."
                      class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <!-- Options List -->
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
                    Tidak ada sub area ditemukan
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Mulai <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formUnit.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formUnit.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Add Position Modal -->
    <Teleport to="body">
      <Modal
        v-model="showAddPositionModal"
        size="xl"
        @save="handleSavePosition"
      >
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">Tambah Posisi</h3>
        </template>

        <div class="space-y-4 p-1">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Posisi <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.namaPos"
              placeholder="Direktur Utama"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Pendek <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.titelatur"
              placeholder="Masukkan titelatur"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              ID Posisi <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.idPos"
              placeholder="POS-001"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

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
                Chief
              </span>
            </label>
            <p v-if="parentHasChief" class="text-xs text-red-500 mt-1">
              Posisi chief sudah ada pada unit ini
            </p>
          </div>

          <div v-if="formPosition.chief">
            <Heading variant="heading11m" class="text-xs">
              Level Chief <span class="text-red-500">*</span>
            </Heading>
            <select
              v-model="formPosition.chiefLevel"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="">Pilih Level</option>
              <option
                v-for="opt in chiefOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Mulai <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formPosition.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formPosition.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Add Member Modal -->
    <Teleport to="body">
      <Modal v-model="showAddMemberModal" size="xl" @save="handleSaveMember">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">Tambah Anggota</h3>
        </template>

        <div class="space-y-4 p-1">
          <div class="person-dropdown-container mt-4">
            <Heading variant="heading11m" class="text-xs">
              Nama Anggota <span class="text-red-500">*</span>
            </Heading>

            <!-- Dropdown Toggle -->
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
                  {{ getSelectedPersonText() || "Pilih Anggota" }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400" />
              </button>

              <!-- Dropdown Panel -->
              <div
                v-if="showPersonDropdown"
                class="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg"
                @click.stop
              >
                <!-- Search Inside Dropdown -->
                <div class="p-2 border-b border-gray-200">
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="personSearchQuery"
                      @input="filterPersons"
                      placeholder="Cari anggota..."
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
                  <p class="text-sm text-gray-500 mt-2">Memuat data...</p>
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
                    Tidak ada anggota ditemukan
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-7 mb-8">
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Mulai <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
      <Modal v-model="showEditModal" size="xl" @save="handleSaveEdit">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-5 ml-5">
            Edit {{ editType }}
          </h3>
        </template>

        <!-- EDIT UNIT -->
        <div v-if="editType === 'Unit'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Unit <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.namaUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              Kode Unit <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.idUnit"
              disabled
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>

        <!-- EDIT POSISI -->
        <div v-if="editType === 'Posisi'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Posisi <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.namaPos"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              Kode Posisi <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.idPos"
              disabled
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>

        <!-- EDIT ANGGOTA -->
        <div v-if="editType === 'Anggota'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Anggota <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formMember.nama"
              disabled
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              Personal Number <span class="text-red-500">*</span>
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
                Tanggal Mulai <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </Heading>
              <input
                type="date"
                v-model="formMember.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Delete Confirm Popup -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      title="Hapus Data"
      message="Yakin ingin menghapus data ini?"
      confirmText="Hapus"
      cancelText="Batal"
      cancelColor="primary"
      @confirm="deleteNow"
      @cancel="confirmDeleteOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from "vue";
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

import { useStruktur } from "~/composables/useStruktur";
import { useCompany } from "~/composables/useCompany";
import { useArea } from "~/composables/useArea";
import { useToast } from "#imports";
import { usePerson } from "~/composables/usePerson";

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

const confirmDeleteOpen = ref(false);
const itemToDelete = ref(null);
const route = useRoute();

const companyExpanded = ref(true);
const expandedNodes = ref<Record<string, boolean>>({});

const hoveredNode = ref<string | null>(null);
const editingNode = ref<any>(null);
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
const highlightNodeId = ref<string | null>(null);
const treeContainer = ref<HTMLElement | null>(null);

// Modal search states
const subAreaSearchQuery = ref("");
const personSearchQuery = ref("");
const filteredSubAreas = ref<any[]>([]);
const filteredPersons = ref<any[]>([]);
const showSubAreaDropdown = ref(false);
const showPersonDropdown = ref(false);

const toast = useToast();

const showSuccessToast = (message: string) => {
  toast.add({
    title: "Berhasil",
    description: message,
    color: "success",
    icon: "i-lucide-check-circle",
  });
};

// Handle click outside dropdowns
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  // Close sub area dropdown if click outside
  if (showSubAreaDropdown.value) {
    const isClickInside = target.closest(".sub-area-dropdown-container");
    if (!isClickInside) {
      showSubAreaDropdown.value = false;
    }
  }

  // Close person dropdown if click outside
  if (showPersonDropdown.value) {
    const isClickInside = target.closest(".person-dropdown-container");
    if (!isClickInside) {
      showPersonDropdown.value = false;
    }
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Computed total results
const totalResults = computed(() => {
  return (
    searchResults.value.organizations.length +
    searchResults.value.positions.length +
    searchResults.value.persons.length
  );
});

// Create a map for quick lookup
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

// Search functionality
let searchTimeout: any = null;

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    // Reset ke state awal
    resetTreeState();
    searchResults.value = {
      organizations: [],
      positions: [],
      persons: [],
    };
    return;
  }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    await performSearch();
  }, 300);
};

const resetTreeState = () => {
  // Collapse semua nodes
  expandedNodes.value = {};
  highlightNodeId.value = null;
};

const performSearch = async () => {
  if (!company.value?.kode || !searchQuery.value.trim()) return;

  try {
    // Reset state sebelum search baru
    resetTreeState();

    loadingSearch.value = true;

    // Parallel search all endpoints
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

    // Auto-expand nodes yang ditemukan
    if (totalResults.value > 0) {
      loadingExpand.value = true;
      await autoExpandSearchResults();
      loadingExpand.value = false;

      // Jika hanya 1 hasil, scroll ke item tersebut
      if (totalResults.value === 1) {
        await scrollToSingleResult();
      }
    }
  } catch (err) {
    console.error("❌ Search error:", err);
    searchResults.value = {
      organizations: [],
      positions: [],
      persons: [],
    };
  } finally {
    loadingSearch.value = false;
    loadingExpand.value = false;
  }
};

const scrollToSingleResult = async () => {
  // Wait for DOM to be fully updated
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Get the single result ID
  let singleResultId: string | null = null;

  if (searchResults.value.organizations.length === 1) {
    singleResultId = searchResults.value.organizations[0].id;
  } else if (searchResults.value.positions.length === 1) {
    singleResultId = searchResults.value.positions[0].id;
  } else if (searchResults.value.persons.length === 1) {
    singleResultId = searchResults.value.persons[0].id;
  }

  console.log("🔍 Scrolling to single result:", singleResultId);

  if (singleResultId) {
    highlightNodeId.value = singleResultId;

    // Wait again for highlight to render
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Find element with attribute selector
    const element = document.querySelector(
      `[data-node-id="${singleResultId}"]`,
    );

    console.log("📍 Element found:", element);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      console.log("✅ Scrolled to element");
    } else {
      console.warn("⚠️ Element not found in DOM");
    }
  }
};

const autoExpandSearchResults = async () => {
  // Step 1: Expand Organizations
  for (const org of searchResults.value.organizations) {
    const orgNode = findNodeInTree(
      organizationTree.value,
      (n) => n.id === org.id || n.organizationCode === org.organization,
    );

    if (orgNode) {
      expandedNodes.value[orgNode.id] = true;

      if (!orgNode._positionsLoaded) {
        await loadPositions(orgNode);
      }

      await expandParentNodes(orgNode.id);
    }
  }

  // Step 2: Expand Positions
  for (const pos of searchResults.value.positions) {
    const orgNode = findNodeInTree(
      organizationTree.value,
      (n) =>
        (n.type === "unit" || n.type === "direktorat") &&
        n.organizationCode === pos.organization,
    );

    if (orgNode) {
      expandedNodes.value[orgNode.id] = true;

      if (!orgNode._positionsLoaded) {
        await loadPositions(orgNode);
      }

      const posNode = findNodeInTree(
        orgNode.children,
        (n) => n.type === "position" && n.positionCode === pos.position,
      );

      if (posNode) {
        expandedNodes.value[posNode.id] = true;

        if (!posNode._personsLoaded) {
          await loadPersons(posNode);
        }
      }

      await expandParentNodes(orgNode.id);
    }
  }

  // Step 3: Expand Persons
  for (const person of searchResults.value.persons) {
    const searchAndExpandForPerson = async (nodes: any[]): Promise<boolean> => {
      for (const node of nodes) {
        if (node.type === "unit" || node.type === "direktorat") {
          if (!node._positionsLoaded) {
            await loadPositions(node);
          }

          for (const posNode of node.children.filter(
            (c: any) => c.type === "position",
          )) {
            if (!posNode._personsLoaded) {
              await loadPersons(posNode);
            }

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
            const foundInChild = await searchAndExpandForPerson(childUnits);
            if (foundInChild) {
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
    if (predicate(node)) {
      return node;
    }

    if (node.children?.length) {
      const found = findNodeInTree(node.children, predicate);
      if (found) return found;
    }
  }

  return null;
};

const expandParentNodes = async (nodeId: string) => {
  const findAndExpandParent = async (
    nodes: any[],
    targetId: string,
    parentNode: any = null,
  ): Promise<boolean> => {
    for (const node of nodes) {
      if (node.id === targetId) {
        expandedNodes.value[node.id] = true;

        if (
          (node.type === "unit" || node.type === "direktorat") &&
          !node._positionsLoaded
        ) {
          await loadPositions(node);
        }

        if (node.type === "position" && !node._personsLoaded) {
          await loadPersons(node);
        }

        return true;
      }

      if (node.children?.length) {
        const found = await findAndExpandParent(node.children, targetId, node);
        if (found) {
          expandedNodes.value[node.id] = true;

          if (
            (node.type === "unit" || node.type === "direktorat") &&
            !node._positionsLoaded
          ) {
            await loadPositions(node);
          }

          if (node.type === "position" && !node._personsLoaded) {
            await loadPersons(node);
          }

          return true;
        }
      }
    }
    return false;
  };

  await findAndExpandParent(organizationTree.value, nodeId);
};

const clearSearch = () => {
  searchQuery.value = "";
  resetTreeState();
  searchResults.value = {
    organizations: [],
    positions: [],
    persons: [],
  };
};

// Modal search functions
const getSelectedSubAreaText = () => {
  if (!formUnit.value.idsubArea) return "";

  const selected = subAreaOptions.value.find(
    (sub) => sub.sub_area === formUnit.value.idsubArea,
  );

  if (!selected) return "";

  return `${selected.sub_area} - ${selected.shortText || selected.longText}`;
};

const getSelectedPersonText = () => {
  if (!formMember.value.personId) return "";

  const selected = personOptions.value.find(
    (p) => p.id === formMember.value.personId,
  );

  if (!selected) return "";

  return `${selected.name} (PN: ${selected.persnum})`;
};

const togglePersonDropdown = async () => {
  showPersonDropdown.value = !showPersonDropdown.value;

  if (showPersonDropdown.value) {
    await loadPersonsIfNeeded();
  }
};

const filterSubAreas = () => {
  const query = subAreaSearchQuery.value.toLowerCase().trim();

  if (!query) {
    filteredSubAreas.value = subAreaOptions.value;
    return;
  }

  filteredSubAreas.value = subAreaOptions.value.filter((sub) => {
    const subArea = String(sub.sub_area).toLowerCase();
    const shortText = (sub.shortText || "").toLowerCase();
    const longText = (sub.longText || "").toLowerCase();

    return (
      subArea.includes(query) ||
      shortText.includes(query) ||
      longText.includes(query)
    );
  });
};

const selectSubArea = (sub: any) => {
  formUnit.value.idsubArea = sub.sub_area;
  formUnit.value.subarea = sub.shortText || sub.longText || "";
  showSubAreaDropdown.value = false;
  subAreaSearchQuery.value = "";
};

const filterPersons = () => {
  const query = personSearchQuery.value.toLowerCase().trim();

  if (!query) {
    filteredPersons.value = personOptions.value;
    return;
  }

  filteredPersons.value = personOptions.value.filter((person) => {
    const name = (person.name || "").toLowerCase();
    const persnum = String(person.persnum || "").toLowerCase();

    return name.includes(query) || persnum.includes(query);
  });
};

const selectPerson = (person: any) => {
  formMember.value.personId = person.id;
  formMember.value.nama = person.name;
  showPersonDropdown.value = false;
  personSearchQuery.value = "";
};

// Computed property untuk display tree
const displayTree = computed(() => {
  return organizationTree.value;
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
  formMember.value = {
    personId: "",
    nama: "",
    mulai: "",
    berakhir: "",
  };
  personSearchQuery.value = "";
};

const personOptions = ref<any[]>([]);
const loadingPersons = ref(false);
const personsLoaded = ref(false);

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
    organizationTree.value = mapCompanyTree(res.data.tree);
  } catch (err) {
    console.error("❌ fetchData error:", err);
  }
};

const mapCompanyTree = (nodes: any[], level = 0): any[] => {
  return nodes.map((node) => ({
    id: node.id,
    organizationCode: node.organization,
    type: level === 0 ? "direktorat" : "unit",
    level,
    shortText: node.shortText,
    longText: node.longText,
    name: node.longText || node.shortText,
    startDate: node.startDate,
    endDate: node.endDate,
    children: node.children ? mapCompanyTree(node.children, level + 1) : [],
    _positionsLoaded: false,
  }));
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

const loadPositions = async (node: any) => {
  if (node._positionsLoaded) return;

  const res = await getPositionsByOrganization(String(node.organizationCode));
  const positions = res.data.map(mapPositionToNode);
  const sortedPositions = sortPositionsByBod(positions);

  node.children = [
    ...sortedPositions,
    ...(node.children || []).filter((c: any) => c.type !== "position"),
  ];

  node._positionsLoaded = true;
};

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

const loadPersons = async (node: any) => {
  if (node._personsLoaded) return;
  if (!node.positionCode) return;

  try {
    const res = await getPersonsByPosition(node.positionCode);
    node.children = res.data.map((p: any) =>
      mapPersonToNode(p, node.positionCode),
    );
    node._personsLoaded = true;
  } catch (err) {
    console.error("❌ gagal load person:", err);
  }
};

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
    if (!val) {
      formPosition.value.chiefLevel = "";
    }
  },
);

const organizationTree = ref<any[]>([]);

// Methods
const toggleNode = async (node: any) => {
  const isExpanded = expandedNodes.value[node.id] ?? false;
  expandedNodes.value[node.id] = !isExpanded;

  if (isExpanded) return;

  if (
    (node.type === "unit" || node.type === "direktorat") &&
    !node._positionsLoaded
  ) {
    await loadPositions(node);
  }

  if (node.type === "position") {
    await loadPersons(node);
  }
};

const setHoveredNode = (id: string | null) => {
  hoveredNode.value = id;
};

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
      mulai: item.startDate,
      berakhir: item.endDate,
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
      mulai: item.startDate,
      berakhir: item.endDate,
    };
  }

  if (item.type === "member") {
    editType.value = "Anggota";
    formMember.value = {
      nama: item.name,
      personId: item.persnum,
      mulai: toDateOnly(item.startDate),
      berakhir: toDateOnly(item.endDate),
    };
  }

  showEditModal.value = true;
};

const hasChildren = (node: any) => {
  return Array.isArray(node.children) && node.children.length > 0;
};

const openDelete = (item: any) => {
  if (hasChildren(item)) {
    alert(
      "Unit ini masih memiliki sub unit / posisi. Hapus atau pindahkan child terlebih dahulu.",
    );
    return;
  }

  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const removeNodeById = (nodes: any[], id: string): boolean => {
  const index = nodes.findIndex((n) => n.id === id);
  if (index !== -1) {
    nodes.splice(index, 1);
    return true;
  }

  for (const node of nodes) {
    if (node.children?.length) {
      const removed = removeNodeById(node.children, id);
      if (removed) return true;
    }
  }

  return false;
};

const deleteNow = async () => {
  if (!itemToDelete.value) return;

  try {
    const item = itemToDelete.value;

    if (hasChildren(item)) {
      alert("Tidak bisa menghapus data yang masih memiliki child.");
      return;
    }

    if (item.type === "member") {
      await deletePerson(item.id);
      removeNodeById(organizationTree.value, item.id);
      showSuccessToast("Anggota berhasil dikeluarkan dari posisi");
    } else if (item.type === "position") {
      await deletePosition(item.id);
      removeNodeById(organizationTree.value, item.id);
      showSuccessToast("Berhasil menghapus posisi");
    } else {
      await deleteOrganization(item.id);
      await fetchData(route.params.kode as string);
      showSuccessToast("Berhasil menghapus unit");
    }

    confirmDeleteOpen.value = false;
  } catch (error) {
    console.error("❌ Error deleting item:", error);
  } finally {
    itemToDelete.value = null;
  }
};

const subAreaOptions = ref<any[]>([]);
const loadingSubArea = ref(false);
const parentHasChief = ref(false);

const checkParentHasChief = (parent: any) => {
  if (!parent?.children) return false;
  return parent.children.some((c: any) => c.type === "position" && !!c.bodTag);
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

  if (!parent._positionsLoaded) {
    await loadPositions(parent);
  }

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

const selectedParentNode = ref<any>(null);

const handleSaveUnit = async () => {
  try {
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
    showSuccessToast("Berhasil menambahkan unit");

    showAddUnitModal.value = false;
    resetUnitForm();
  } catch (err) {
    console.error("❌ gagal create organization:", err);
  }
};

const chiefOptions = [
  { label: "BOD", value: "BOD" },
  { label: "BOD-1", value: "BOD-1" },
  { label: "BOD-2", value: "BOD-2" },
  { label: "BOD-3", value: "BOD-3" },
];

const handleSavePosition = async () => {
  try {
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

    showSuccessToast("Berhasil menambahkan posisi");
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

    showSuccessToast("Berhasil menambahkan anggota");
    showAddMemberModal.value = false;
    resetMemberForm();
  } catch (err) {
    console.error("❌ gagal assign person:", err);
  }
};

const toDateOnly = (val?: string) => {
  if (!val) return null;
  return val.split("T")[0];
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
      showSuccessToast("Berhasil mengubah unit");
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
      showSuccessToast("Berhasil mengubah posisi");

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
      showSuccessToast("Berhasil mengubah periode anggota");

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

const bodOrder: Record<string, number> = {
  BOD: 1,
  "BOD-1": 2,
  "BOD-2": 3,
  "BOD-3": 4,
};

const sortPositionsByBod = (positions: any[]) => {
  return [...positions].sort((a, b) => {
    const aOrder = bodOrder[a.bodTag ?? ""] ?? 99;
    const bOrder = bodOrder[b.bodTag ?? ""] ?? 99;
    return aOrder - bOrder;
  });
};
</script>
