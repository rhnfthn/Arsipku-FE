<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- ================= MASTER PERUSAHAAN ================= -->
      <div v-if="!showArea && !showStruktur">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Master Perusahaan</h1>
            <p class="text-gray-500 text-sm">Kelola daftar perusahaan Anda</p>
          </div>
          <button
            @click="openAddCompany = true"
            class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
          >
            <Plus class="w-4 h-4" />
            Tambah Perusahaan
          </button>
        </div>

        <!-- Card -->
        <div
          class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
        >
          <!-- Search -->
          <div
            class="p-6 border-b w-full border-gray-100 bg-gradient-to-r from-gray-50 to-white"
          >
            <div class="relative max-w-md w-full">
              <Search
                class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="search"
                placeholder="Cari perusahaan..."
                class="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-primary text-white">
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Tanggal Mulai
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Tanggal Berakhir
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Kode
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Nama Pendek
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Nama Panjang
                  </th>
                  <th class="px-6 py-4 text-center text-sm font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in rows"
                  :key="row.kode"
                  :class="[
                    'border-b border-gray-100 hover:bg-blue-50 transition-colors',
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                  ]"
                >
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ row.tanggalMulai }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ row.tanggalBerakhir }}
                  </td>
                  <td class="px-6 py-4 items-center">
                    <div
                      class="flex px-3 py-1 rounded-lg bg-blue-100 hover:bg-primary-600 hover:text-white text-blue-700"
                    >
                      <button
                        class="flex p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Building2 class="w-5 h-5" />
                      </button>
                      <button
                        @click="openStruktur(row)"
                        class="flex items-center text-sm font-semibold transition-colors"
                      >
                        {{ row.kode }}
                      </button>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">
                    {{ row.namaPendek }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ row.namaPanjang }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        class="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                      >
                        <Pencil
                          class="w-4 h-4 text-gray-400 group-hover:text-blue-600"
                        />
                      </button>
                      <button
                        @click="openDelete(row)"
                        class="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                      >
                        <Trash2
                          class="w-4 h-4 text-gray-400 group-hover:text-red-600"
                        />
                      </button>
                      <button
                        @click="openArea(row)"
                        class="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                      >
                        <MapPin
                          class="w-4 h-4 text-gray-400 group-hover:text-green-600"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ================= STRUKTUR ORGANISASI ================= -->
      <div v-else-if="showStruktur && !showArea">
        <!-- Back Button -->
        <button
          @click="showStruktur = false"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 group"
        >
          <ChevronLeft
            class="w-5 h-5 group-hover:-translate-x-1 transition-transform"
          />
          <span class="font-medium">Kembali ke Master Perusahaan</span>
        </button>

        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Struktur Organisasi
            </h1>
            <p class="text-gray-500 text-sm">
              Kelola struktur organisasi perusahaan
            </p>
            <div class="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <Building2 class="w-4 h-4" />
              <span>COMPANY</span>
              <span class="font-bold">{{ selectedCompany?.namaPanjang }}</span>
            </div>
          </div>
          <button
            @click="openArea(selectedCompany)"
            class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
          >
            <MapPin class="w-4 h-4" />
            Kelola Area
          </button>
        </div>

        <!-- Organization Tree Card -->
        <div
          class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <!-- Company Header -->
          <div class="bg-primary text-white p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <button
                  @click="toggleCompanyExpand"
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
                  <h2 class="text-xl font-bold">
                    {{ selectedCompany?.namaPanjang }}
                  </h2>
                  <p class="text-blue-100 text-sm">
                    {{ selectedCompany?.tanggalMulai }} -
                    {{ selectedCompany?.tanggalBerakhir }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium"
                >
                  KP
                </span>
                <button
                  class="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Info class="w-5 h-5" />
                </button>
                <button
                  class="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Building2 class="w-5 h-5" />
                </button>
                <button
                  class="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Pencil class="w-5 h-5" />
                </button>
                <button
                  @click="openDeleteConfirm(selectedCompany)"
                  class="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Organization Tree -->
          <div v-if="companyExpanded" class="p-6">
            <div
              v-for="direktorat in organizationTree"
              :key="direktorat.id"
              class="mb-4"
            >
              <!-- Direktorat Level -->
              <div
                class="flex items-center gap-3 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <button
                  @click="toggleNode(direktorat.id)"
                  class="p-1 hover:bg-yellow-200 rounded transition-colors"
                >
                  <ChevronDown
                    v-if="expandedNodes[direktorat.id]"
                    class="w-5 h-5 text-yellow-700"
                  />
                  <ChevronRight v-else class="w-5 h-5 text-yellow-700" />
                </button>
                <Building class="w-5 h-5 text-yellow-700" />
                <span class="font-semibold text-gray-900">{{
                  direktorat.name
                }}</span>
              </div>

              <!-- Direktur & Divisions -->
              <div
                v-if="expandedNodes[direktorat.id]"
                class="ml-12 mt-3 space-y-3"
              >
                <!-- Direktur -->
                <div
                  v-if="direktorat.direktur"
                  class="flex items-center gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded-lg"
                >
                  <button
                    @click="toggleNode(direktorat.direktur.id)"
                    class="p-1 hover:bg-orange-200 rounded transition-colors"
                  >
                    <ChevronDown
                      v-if="expandedNodes[direktorat.direktur.id]"
                      class="w-4 h-4 text-orange-700"
                    />
                    <ChevronRight v-else class="w-4 h-4 text-orange-700" />
                  </button>
                  <User class="w-4 h-4 text-orange-700" />
                  <span class="font-medium text-orange-900">{{
                    direktorat.direktur.name
                  }}</span>
                </div>

                <!-- Divisions under Direktur -->
                <div
                  v-if="expandedNodes[direktorat.direktur?.id]"
                  class="ml-12 space-y-2"
                >
                  <div
                    v-for="division in direktorat.direktur?.divisions"
                    :key="division.id"
                    class="flex items-center gap-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <button
                      @click="toggleNode(division.id)"
                      class="p-1 hover:bg-blue-200 rounded transition-colors"
                    >
                      <ChevronDown
                        v-if="expandedNodes[division.id]"
                        class="w-4 h-4 text-blue-700"
                      />
                      <ChevronRight v-else class="w-4 h-4 text-blue-700" />
                    </button>
                    <Building class="w-4 h-4 text-blue-700" />
                    <span class="text-sm font-medium text-blue-900">{{
                      division.name
                    }}</span>
                  </div>

                  <!-- Employees under Division -->
                  <div
                    v-if="expandedNodes[division.id]"
                    class="ml-12 space-y-1"
                  >
                    <div
                      v-for="employee in division.employees"
                      :key="employee.id"
                      class="flex items-center gap-3 p-2 bg-gray-50 border-l-2 border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    >
                      <User class="w-3 h-3 text-gray-600 ml-2" />
                      <div>
                        <span class="text-sm text-gray-900">{{
                          employee.name
                        }}</span>
                        <span class="text-xs text-gray-500 ml-2">{{
                          employee.code
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Direct Divisions (tanpa Direktur) -->
                <div
                  v-for="division in direktorat.divisions"
                  :key="division.id"
                  class="space-y-2"
                >
                  <div
                    class="flex items-center gap-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <button
                      @click="toggleNode(division.id)"
                      class="p-1 hover:bg-blue-200 rounded transition-colors"
                    >
                      <ChevronDown
                        v-if="expandedNodes[division.id]"
                        class="w-4 h-4 text-blue-700"
                      />
                      <ChevronRight v-else class="w-4 h-4 text-blue-700" />
                    </button>
                    <Building class="w-4 h-4 text-blue-700" />
                    <span class="text-sm font-medium text-blue-900">{{
                      division.name
                    }}</span>
                  </div>

                  <!-- Sub Division or Direktur Teknik -->
                  <div
                    v-if="expandedNodes[division.id]"
                    class="ml-12 space-y-2"
                  >
                    <!-- Direktur Teknik -->
                    <div
                      v-if="division.direktur"
                      class="flex items-center gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded-lg"
                    >
                      <button
                        @click="toggleNode(division.direktur.id)"
                        class="p-1 hover:bg-orange-200 rounded transition-colors"
                      >
                        <ChevronDown
                          v-if="expandedNodes[division.direktur.id]"
                          class="w-4 h-4 text-orange-700"
                        />
                        <ChevronRight v-else class="w-4 h-4 text-orange-700" />
                      </button>
                      <User class="w-4 h-4 text-orange-700" />
                      <span class="font-medium text-orange-900">{{
                        division.direktur.name
                      }}</span>
                    </div>

                    <!-- Sub Divisions under Direktur Teknik -->
                    <div
                      v-if="expandedNodes[division.direktur?.id]"
                      class="ml-12 space-y-2"
                    >
                      <div
                        v-for="subDiv in division.direktur?.subDivisions"
                        :key="subDiv.id"
                        class="flex items-center gap-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <button
                          @click="toggleNode(subDiv.id)"
                          class="p-1 hover:bg-blue-200 rounded transition-colors"
                        >
                          <ChevronDown
                            v-if="expandedNodes[subDiv.id]"
                            class="w-4 h-4 text-blue-700"
                          />
                          <ChevronRight v-else class="w-4 h-4 text-blue-700" />
                        </button>
                        <Building class="w-4 h-4 text-blue-700" />
                        <span class="text-sm font-medium text-blue-900">{{
                          subDiv.name
                        }}</span>
                      </div>

                      <!-- Employees under Sub Division -->
                      <div
                        v-if="expandedNodes[subDiv.id]"
                        class="ml-12 space-y-1"
                      >
                        <div
                          v-for="employee in subDiv.employees"
                          :key="employee.id"
                          class="flex items-center gap-3 p-2 bg-gray-50 border-l-2 border-gray-300 rounded hover:bg-gray-100 transition-colors"
                        >
                          <User class="w-3 h-3 text-gray-600 ml-2" />
                          <div>
                            <span class="text-sm text-gray-900">{{
                              employee.name
                            }}</span>
                            <span class="text-xs text-gray-500 ml-2">{{
                              employee.code
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= AREA VIEW ================= -->
      <div v-else-if="showArea">
        <!-- Back Button -->
        <button
          @click="backFromArea"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
        >
          <ChevronLeft
            class="w-5 h-5 group-hover:-translate-x-1 transition-transform"
          />
          <span class="font-medium">Kembali ke Struktur Organisasi</span>
        </button>

        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Kelola Area</h1>
            <p class="text-gray-500 text-sm">
              Kelola area dan sub area perusahaan
            </p>
            <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p class="text-sm text-blue-900">
                Perusahaan:
                <span class="font-bold">{{
                  selectedCompany?.namaPanjang
                }}</span>
              </p>
            </div>
          </div>
          <button
            @click="openAddAreaModal"
            class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
          >
            <Plus class="w-4 h-4" />
            Tambah {{ activeTab === "area" ? "Area" : "Sub Area" }}
          </button>
        </div>

        <!-- Card -->
        <div
          class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <!-- Tab & Actions -->
          <div
            class="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white"
          >
            <div class="flex items-center justify-between gap-4">
              <!-- Tabs -->
              <div class="flex bg-gray-100 rounded-xl p-1.5 gap-2">
                <button
                  @click="activeTab = 'area'"
                  :class="[
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
                    activeTab === 'area'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900',
                  ]"
                >
                  <MapPin class="w-4 h-4" />
                  Area
                </button>
                <button
                  @click="activeTab = 'subArea'"
                  :class="[
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
                    activeTab === 'subArea'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900',
                  ]"
                >
                  <Map class="w-4 h-4" />
                  Sub Area
                </button>
              </div>

              <!-- Search -->
              <div class="relative flex-1 w-full">
                <Search
                  class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  placeholder="Cari..."
                  class="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <!-- Area Table with Expandable Sub Areas -->
          <div v-if="activeTab === 'area'" class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-primary text-white">
                  <th
                    class="px-6 py-4 text-left text-sm font-semibold w-12"
                  ></th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Kode
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Nama
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Alamat
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Tanggal Mulai
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Tanggal Berakhir
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Sub Areas
                  </th>
                  <th class="px-6 py-4 text-center text-sm font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(area, idx) in areas" :key="area.kode">
                  <tr
                    :class="[
                      'border-b border-gray-100 hover:bg-blue-50 transition-colors',
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                    ]"
                  >
                    <td class="px-6 py-4">
                      <button
                        @click="toggleAreaExpand(area.kode)"
                        class="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <ChevronDown
                          v-if="expandedAreas[area.kode]"
                          class="w-5 h-5 text-blue-600"
                        />
                        <ChevronRight v-else class="w-5 h-5 text-gray-400" />
                      </button>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex items-center text-sm font-semibold"
                      >
                        {{ area.kode }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                      {{ area.nama }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-700">
                      {{ area.alamat }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-700">
                      {{ area.mulai }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-700">
                      {{ area.berakhir }}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex items-center text-xs font-semibold"
                      >
                        {{ area.subCount }} sub areas
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          class="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                        >
                          <Pencil
                            class="w-4 h-4 text-gray-400 group-hover:text-blue-600"
                          />
                        </button>
                        <button
                          @click="openDeleteConfirm(area)"
                          class="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                        >
                          <Trash2
                            class="w-4 h-4 text-gray-400 group-hover:text-red-600"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- Expanded Sub Areas -->
                  <tr v-if="expandedAreas[area.kode]">
                    <td
                      colspan="8"
                      class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50"
                    >
                      <div class="ml-12">
                        <div class="flex items-center gap-2 mb-3">
                          <Map class="w-4 h-4 text-blue-600" />
                          <h4 class="text-sm font-bold text-gray-900">
                            Sub Areas ({{
                              getSubAreasForArea(area.kode).length
                            }})
                          </h4>
                        </div>
                        <div class="space-y-2">
                          <div
                            v-for="sub in getSubAreasForArea(area.kode)"
                            :key="sub.kode"
                            class="bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div class="grid grid-cols-6 gap-4 items-center">
                              <div>
                                <span class="text-xs text-gray-500 block mb-1"
                                  >Kode</span
                                >
                                <span
                                  class="inline-flex items-center px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold"
                                >
                                  {{ sub.kode }}
                                </span>
                              </div>
                              <div>
                                <span class="text-xs text-gray-500 block mb-1"
                                  >Nama</span
                                >
                                <span
                                  class="text-sm font-semibold text-gray-900"
                                  >{{ sub.nama }}</span
                                >
                              </div>
                              <div>
                                <span class="text-xs text-gray-500 block mb-1"
                                  >Alamat</span
                                >
                                <span class="text-sm text-gray-700">{{
                                  sub.alamat
                                }}</span>
                              </div>
                              <div>
                                <span class="text-xs text-gray-500 block mb-1"
                                  >Tanggal Mulai</span
                                >
                                <span class="text-sm text-gray-700">{{
                                  sub.berakhir
                                }}</span>
                              </div>
                              <div>
                                <span class="text-xs text-gray-500 block mb-1"
                                  >Tanggal Berakhir</span
                                >
                                <span class="text-sm text-gray-700">{{
                                  sub.berakhir
                                }}</span>
                              </div>
                              <!-- <div class="flex items-center justify-end gap-2">
                                <button
                                  class="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                                >
                                  <Pencil
                                    class="w-4 h-4 text-gray-400 group-hover:text-blue-600"
                                  />
                                </button>
                                <button
                                  @click="openDeleteConfirm(sub)"
                                  class="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                                >
                                  <Trash2
                                    class="w-4 h-4 text-gray-400 group-hover:text-red-600"
                                  />
                                </button>
                              </div> -->
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Sub Area Table -->
          <div v-if="activeTab === 'subArea'" class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-primary text-white">
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Kode
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Nama
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Area
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Alamat
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Tanggal Mulai
                  </th>
                  <th class="px-6 py-4 text-left text-sm font-semibold">
                    Tanggal Berakhir
                  </th>
                  <th class="px-6 py-4 text-center text-sm font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(sub, idx) in subAreas"
                  :key="sub.kode"
                  :class="[
                    'border-b border-gray-100 hover:bg-blue-50 transition-colors',
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                  ]"
                >
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center text-sm font-semibold"
                    >
                      {{ sub.kode }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                    {{ sub.nama }}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold"
                    >
                      {{ sub.areaName }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ sub.alamat }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ sub.mulai }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ sub.berakhir }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        class="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                      >
                        <Pencil
                          class="w-4 h-4 text-gray-400 group-hover:text-blue-600"
                        />
                      </button>
                      <button
                        @click="openDeleteConfirm(sub)"
                        class="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                      >
                        <Trash2
                          class="w-4 h-4 text-gray-400 group-hover:text-red-600"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= MODALS ================= -->

    <!-- Add Company Modal -->
    <Teleport to="body">
      <div
        v-if="openAddCompany"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <div
          class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        >
          <div class="px-6 py-5 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold">Tambah Perusahaan</h2>
                <p class="text-sm mt-1">
                  Lengkapi formulir untuk menambahkan perusahaan baru
                </p>
              </div>
              <button
                @click="openAddCompany = false"
                class="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="p-6 space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Mulai <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Berakhir <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Kode Perusahaan <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 10000"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Nama Pendek <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: TELKOM"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Nama Panjang <span class="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="Contoh: PT Telekomunikasi Indonesia (Persero) Tbk"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div
            class="px-6 py-4 border-t border-gray-200 flex justify-between gap-3"
          >
            <button
              @click="openAddCompany = false"
              class="flex-1 px-3 py-2 rounded-lg border-2 border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
            <button
              class="flex-1 px-3 py-2 rounded-lg bg-primary border-t border-gray-200 text-white text-sm transition-colors"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Add Area/Sub Area Modal -->
    <Teleport to="body">
      <div
        v-if="openAddArea"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <div
          class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold">
                  Tambah
                  {{ activeTab === "area" ? "Area Baru" : "Sub Area Baru" }}
                </h2>
                <p class="text-sm mt-1">
                  Lengkapi formulir untuk menambahkan
                  {{ activeTab === "area" ? "area" : "sub area" }} baru
                </p>
              </div>
              <button
                @click="openAddArea = false"
                class="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Nama {{ activeTab === "area" ? "Area" : "Sub Area" }}
                <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formArea.nama"
                type="text"
                placeholder="Contoh: KANTOR PUSAT"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Kode {{ activeTab === "area" ? "Area" : "Sub Area" }}
                <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formArea.kode"
                type="text"
                placeholder="Contoh: AREA-001"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Alamat Lengkap
              </label>
              <textarea
                v-model="formArea.alamat"
                rows="3"
                placeholder="Masukkan alamat lengkap..."
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Mulai <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formArea.mulai"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Berakhir <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formArea.berakhir"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <div
            class="px-6 py-4 border-t border-gray-200 flex justify-between gap-3"
          >
            <button
              @click="openAddArea = false"
              class="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-primary-200 transition-colors"
            >
              Batal
            </button>
            <button
              @click="submitArea"
              class="flex-1 px-3 py-2 rounded-lg bg-primary text-white text-sm transition-colors"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation using ConfirmPopup Component -->
    <ConfirmPopup
      v-model="showDeleteConfirm"
      type="danger"
      :title="deleteTitle"
      :message="deleteMessage"
      confirmText="Hapus"
      cancelText="Batal"
      :isLoading="isDeleting"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  X,
  MapPin,
  Map,
  Pencil,
  Trash2,
  Building2,
  Building,
  User,
  Info,
} from "lucide-vue-next";

const search = ref("");
const showArea = ref(false);
const showStruktur = ref(false);
const selectedCompany = ref<any>(null);
const openAddCompany = ref(false);
const activeTab = ref<"area" | "subArea">("area");
const openAddArea = ref(false);
const showDeleteConfirm = ref(false);
const selectedRow = ref<any>(null);
const isDeleting = ref(false);
const expandedAreas = ref<Record<string, boolean>>({});
const companyExpanded = ref(true);
const expandedNodes = ref<Record<string, boolean>>({});

const deleteTitle = ref("Hapus");
const deleteMessage = ref("Apakah Anda yakin ingin menghapus item ini?");

const formArea = ref({
  nama: "",
  kode: "",
  alamat: "",
  mulai: "",
  berakhir: "",
});

const rows = [
  {
    tanggalMulai: "01/01/2023",
    tanggalBerakhir: "31/12/2025",
    kode: "10000",
    namaPendek: "AIRNAV",
    namaPanjang: "Perum LPPNPI",
  },
  {
    tanggalMulai: "15/03/2023",
    tanggalBerakhir: "14/03/2026",
    kode: "1001",
    namaPendek: "test",
    namaPanjang: "test123",
  },
];

const areas = ref([
  {
    kode: "AREA-001",
    nama: "KANTOR PUSAT",
    alamat: "Kantor Pusat Jakarta",
    mulai: "01/01/2020",
    berakhir: "31/12/2030",
    subCount: 4,
  },
  {
    kode: "AREA-002",
    nama: "CABANG BATISE",
    alamat: "Cabang Batam",
    mulai: "01/01/2021",
    berakhir: "31/12/2030",
    subCount: 1,
  },
]);

const subAreas = ref([
  {
    kode: "SUB-001",
    nama: "KANTOR PUSAT",
    area: "AREA-001",
    areaName: "KANTOR PUSAT",
    alamat: "-",
    mulai: "01/01/2020",
    berakhir: "31/12/2030",
  },
  {
    kode: "SUB-002",
    nama: "CABANG JATSC",
    area: "AREA-001",
    areaName: "KANTOR PUSAT",
    alamat: "-",
    mulai: "01/01/2020",
    berakhir: "31/12/2030",
  },
  {
    kode: "SUB-003",
    nama: "CABANG MASSC",
    area: "AREA-001",
    areaName: "KANTOR PUSAT",
    alamat: "-",
    mulai: "01/01/2020",
    berakhir: "31/12/2030",
  },
  {
    kode: "SUB-004",
    nama: "CABANG MALUM",
    area: "AREA-001",
    areaName: "KANTOR PUSAT",
    alamat: "-",
    mulai: "01/01/2021",
    berakhir: "31/12/2030",
  },
  {
    kode: "SUB-005",
    nama: "CABANG PENGATU CVENT",
    area: "AREA-002",
    areaName: "CABANG BATISE",
    alamat: "-",
    mulai: "01/01/2021",
    berakhir: "31/12/2030",
  },
]);

// Organization Tree Data
const organizationTree = ref([
  {
    id: "dir-1",
    name: "DIREKTORAT UTAMA",
    direktur: {
      id: "direktur-1",
      name: "DIREKTUR UTAMA",
      divisions: [
        {
          id: "div-1",
          name: "CORPORATE SECRETARY DIVISION",
        },
        {
          id: "div-2",
          name: "DIREKTORAT KESELAMATAN, KEAMANAN DAN STAN",
        },
      ],
    },
  },
  {
    id: "dir-2",
    name: "DIREKTORAT OPERASI",
    divisions: [],
  },
  {
    id: "dir-3",
    name: "DIREKTORAT SDM DAN UMUM",
    divisions: [],
  },
  {
    id: "dir-4",
    name: "DIREKTORAT TEKNIK",
    direktur: {
      id: "direktur-teknik",
      name: "DIREKTUR TEKNIK",
      subDivisions: [
        {
          id: "subdiv-1",
          name: "TECHNOLOGY SOLUTION DIVISION",
          employees: [{ id: "emp-1", name: "BUDI", code: "PN-2002" }],
        },
      ],
    },
  },
]);

function toggleCompanyExpand() {
  companyExpanded.value = !companyExpanded.value;
}

function toggleNode(id: string) {
  expandedNodes.value[id] = !expandedNodes.value[id];
}

function toggleAreaExpand(kode: string) {
  expandedAreas.value[kode] = !expandedAreas.value[kode];
}

function getSubAreasForArea(areaKode: string) {
  return subAreas.value.filter((sub) => sub.area === areaKode);
}

function openStruktur(row: any) {
  selectedCompany.value = row;
  showStruktur.value = true;
  showArea.value = false;
}

function openArea(row: any) {
  selectedCompany.value = row;
  showArea.value = true;
  showStruktur.value = false;
}

function backFromArea() {
  showArea.value = false;
  showStruktur.value = true;
}

function openDelete(row: any) {
  selectedRow.value = row;
  deleteTitle.value = "Hapus Perusahaan";
  deleteMessage.value = `Apakah Anda yakin ingin menghapus perusahaan ${row.namaPendek}?`;
  showDeleteConfirm.value = true;
}

function openDeleteConfirm(item: any) {
  selectedRow.value = item;
  if (item.namaPendek) {
    deleteTitle.value = "Hapus Perusahaan";
    deleteMessage.value = `Apakah Anda yakin ingin menghapus perusahaan ${item.namaPendek}?`;
  } else if (item.nama) {
    deleteTitle.value = item.kode?.startsWith("AREA")
      ? "Hapus Area"
      : "Hapus Sub Area";
    deleteMessage.value = `Apakah Anda yakin ingin menghapus ${item.nama}?`;
  }
  showDeleteConfirm.value = true;
}

async function handleDelete() {
  try {
    isDeleting.value = true;
    console.log("DELETE:", selectedRow.value);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    showDeleteConfirm.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    isDeleting.value = false;
  }
}

function openAddAreaModal() {
  openAddArea.value = true;
}

function submitArea() {
  console.log("SUBMIT:", {
    type: activeTab.value,
    ...formArea.value,
  });
  openAddArea.value = false;
  formArea.value = {
    nama: "",
    kode: "",
    alamat: "",
    mulai: "",
    berakhir: "",
  };
}
</script>
