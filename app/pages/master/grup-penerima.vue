<template>
  <div class="space-y-6 pt-5 dark:bg-gray-900 min-h-screen transition-colors">
    <AccessDenied v-if="!canAccessPage()" />
    <div v-else class="min-h-screen">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
        <PageHeader :title="t('gp_title')" :items="items" />
        <button
          v-if="hasPermission('master-data', 'create-grup-penerima')"
          @click="openAddModal"
          class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors"
        >
          <Plus class="w-4 h-4" />
          {{ t('gp_btn_add') }}
        </button>
      </div>

      <!-- CARD TABLE -->
      <div
        class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
      >
        <!-- TOOLBAR -->
        <div
          class="flex flex-wrap gap-2 items-center p-3 border-b border-gray-200 dark:border-gray-700 transition-colors"
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
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Refresh -->
          <button
            @click="fetchData"
            class="h-8 w-8 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </button>

          <!-- Search -->
          <div class="relative flex-1 min-w-[150px]">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="search"
              type="text"
              :placeholder="t('gp_search_placeholder')"
              class="w-full h-8 pl-9 pr-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <!-- Export -->
          <button
            v-if="hasPermission('master-data', 'export-grup-penerima')"
            @click="onExport"
            class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap"
          >
            Export
          </button>
        </div>

        <!-- TABLE -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-primary-400 text-white dark:bg-primary-600">
                <th class="px-4 py-3 text-left font-medium cursor-pointer" @click="sortBy('nama')">
                  <div class="flex items-center gap-1">
                    {{ t('gp_col_name') }} <ArrowUpDown class="w-3 h-3" />
                  </div>
                </th>
                <th class="px-4 py-3 text-left font-medium">{{ t('gp_col_company') }}</th>
                <th class="px-4 py-3 text-left font-medium">{{ t('gp_col_desc') }}</th>
                <th class="px-4 py-3 text-left font-medium">{{ t('gp_col_members') }}</th>
                <th class="px-4 py-3 text-left font-medium">{{ t('gp_col_status') }}</th>
                <th class="px-4 py-3 text-center font-medium">{{ t('gp_col_actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading skeleton -->
              <template v-if="loading">
                <tr v-for="i in 5" :key="`skeleton-${i}`">
                  <td colspan="6" class="px-4 py-3">
                    <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </td>
                </tr>
              </template>
              <!-- Empty state -->
              <tr v-else-if="paginatedData.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  {{ t('gp_empty') }}
                </td>
              </tr>
              <!-- Data rows -->
              <tr
                v-for="item in paginatedData"
                :key="item.id"
                class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ item.nama }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ item.company || '-' }}
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ item.deskripsi || '-' }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ item.details?.length ?? 0 }} {{ t('gp_members_unit') }}
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2 py-1 rounded-lg text-xs font-medium',
                      item.aktif
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                    ]"
                  >
                    {{ item.aktif ? t('gp_active') : t('gp_inactive') }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1">
                    <!-- View members -->
                    <button
                      v-if="hasPermission('master-data', 'read-grup-penerima-detail')"
                      @click="viewMembers(item)"
                      :title="t('gp_btn_members')"
                      class="inline-flex h-8 w-8 items-center justify-center p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                    >
                      <Users class="w-4 h-4" />
                    </button>
                    <!-- Edit -->
                    <button
                      v-if="hasPermission('master-data', 'update-grup-penerima')"
                      @click="openEditModal(item)"
                      :title="t('gp_btn_edit')"
                      class="inline-flex h-8 w-8 items-center justify-center p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 transition-colors"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                    <!-- Toggle aktif -->
                    <button
                      v-if="hasPermission('master-data', 'update-grup-penerima')"
                      @click="toggleAktif(item)"
                      :title="t('gp_btn_toggle')"
                      class="inline-flex h-8 w-8 items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                      <Power class="w-4 h-4" />
                    </button>
                    <!-- Delete -->
                    <button
                      v-if="hasPermission('master-data', 'delete-grup-penerima')"
                      @click="confirmDelete(item)"
                      :title="t('gp_btn_delete')"
                      class="inline-flex h-8 w-8 items-center justify-center p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div
          class="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700"
        >
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('gp_showing') }} {{ (currentPage - 1) * perPage + 1 }}–{{
              Math.min(currentPage * perPage, filteredData.length)
            }}
            {{ t('gp_of') }} {{ filteredData.length }} {{ t('gp_data') }}
          </p>
          <div class="flex items-center gap-1">
            <button
              type="button"
              @click="currentPage--"
              :disabled="currentPage === 1"
              aria-label="Halaman sebelumnya"
              class="w-10 h-9 flex items-center justify-center text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              v-for="p in totalPages"
              :key="p"
              type="button"
              @click="currentPage = p"
              :class="[
                'w-10 h-9 flex items-center justify-center text-sm border rounded-lg transition-colors',
                currentPage === p
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300',
              ]"
            >
              {{ p }}
            </button>
            <button
              type="button"
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              aria-label="Halaman sesudahnya"
              class="w-10 h-9 flex items-center justify-center text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD MODAL -->
    <Teleport to="body">
      <Modal
        v-if="showAddModal"
        :model-value="showAddModal"
        @update:model-value="showAddModal = false"
        :hide-default-footer="true"
        size="lg"
      >
        <template #title>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ t('gp_add_title') }}</h3>
        </template>
        <div class="space-y-4 p-1 max-h-[70vh] overflow-y-auto">
          <!-- Group info -->
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >{{ t('gp_col_name') }} <span class="text-red-500">*</span></label
              >
              <input
                v-model="addForm.nama"
                type="text"
                :placeholder="t('gp_name_placeholder')"
                class="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                :class="addErrors.nama ? 'border-red-500' : 'border-gray-300'"
              />
              <p v-if="addErrors.nama" class="text-xs text-red-500 mt-1">
                {{ t('gp_err_required') }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >{{ t('gp_col_company') }} <span class="text-red-500">*</span></label
              >
              <input
                v-model="addForm.company"
                type="text"
                placeholder="PERUM LPPNPI"
                class="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                :class="addErrors.company ? 'border-red-500' : 'border-gray-300'"
              />
              <p v-if="addErrors.company" class="text-xs text-red-500 mt-1">
                {{ t('gp_err_required') }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                t('gp_col_desc')
              }}</label>
              <textarea
                v-model="addForm.deskripsi"
                rows="2"
                :placeholder="t('gp_desc_placeholder')"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
              ></textarea>
            </div>
          </div>

          <!-- Members section -->
          <div class="border-t border-gray-200 dark:border-gray-600 pt-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{
              t('gp_add_members_label')
            }}</label>
            <!-- Search position -->
            <div class="relative mb-2">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="addMemberSearch"
                type="text"
                :placeholder="t('gp_search_position')"
                class="w-full h-9 pl-9 pr-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <!-- Position dropdown -->
            <div
              class="border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto bg-white dark:bg-gray-800"
            >
              <div
                v-if="filteredAddPositions.length === 0"
                class="px-3 py-4 text-center text-sm text-gray-400"
              >
                {{ t('gp_no_positions') }}
              </div>
              <label
                v-for="pos in filteredAddPositions"
                :key="pos.position"
                :class="[
                  'flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0',
                  isPositionSelected(pos.position)
                    ? 'bg-green-50 dark:bg-green-900/20 cursor-not-allowed'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer',
                ]"
              >
                <input
                  type="checkbox"
                  :value="pos.position"
                  v-model="addFormMembers"
                  :disabled="isPositionSelected(pos.position)"
                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary shrink-0 disabled:opacity-50"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900 dark:text-white truncate">
                    {{ pos.position_text }}
                  </p>
                  <p class="text-xs text-gray-400">{{ pos.sub_area_text || pos.area || '-' }}</p>
                </div>
                <span
                  v-if="isPositionSelected(pos.position)"
                  class="text-xs text-green-600 dark:text-green-400 font-medium shrink-0"
                >
                  {{ t('gp_already_added') }}
                </span>
              </label>
            </div>
            <!-- Selected count -->
            <p v-if="addFormMembers.length > 0" class="text-xs text-primary mt-2">
              {{ addFormMembers.length }} {{ t('gp_selected') }}
            </p>
          </div>
        </div>
        <div class="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="showAddModal = false"
            class="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
          >
            {{ t('gp_btn_cancel') }}
          </button>
          <button
            @click="submitAdd"
            :disabled="savingAdd"
            class="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <span v-if="savingAdd">{{ t('gp_saving') }}</span>
            <span v-else>{{ t('gp_btn_save') }}</span>
          </button>
        </div>
      </Modal>
    </Teleport>

    <!-- EDIT MODAL -->
    <Teleport to="body">
      <Modal
        v-if="showEditModal"
        :model-value="showEditModal"
        @update:model-value="showEditModal = false"
        :hide-default-footer="true"
        size="md"
      >
        <template #title>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ t('gp_edit_title') }}</h3>
        </template>
        <div class="space-y-4 p-1">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >{{ t('gp_col_name') }} <span class="text-red-500">*</span></label
            >
            <input
              v-model="editForm.nama"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >{{ t('gp_col_company') }} <span class="text-red-500">*</span></label
            >
            <input
              v-model="editForm.company"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
              t('gp_col_desc')
            }}</label>
            <textarea
              v-model="editForm.deskripsi"
              rows="2"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
            ></textarea>
          </div>
        </div>
        <div class="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="showEditModal = false"
            class="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
          >
            {{ t('gp_btn_cancel') }}
          </button>
          <button
            @click="submitEdit"
            :disabled="savingEdit"
            class="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <span v-if="savingEdit">{{ t('gp_saving') }}</span>
            <span v-else>{{ t('gp_btn_update') }}</span>
          </button>
        </div>
      </Modal>
    </Teleport>

    <!-- MEMBERS MODAL -->
    <Teleport to="body">
      <Modal
        v-if="showMembersModal"
        :model-value="showMembersModal"
        @update:model-value="showMembersModal = false"
        :hide-default-footer="true"
        :hide-close-button="true"
        size="md"
      >
        <template #title>
          <div class="flex items-center gap-3 px-4 pt-2 pb-1">
            <div
              class="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"
            >
              <Users class="w-5 h-5 text-primary" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold leading-tight text-gray-900 dark:text-white">
              {{ selectedGrup?.nama }}
            </h3>
          </div>
        </template>
        <div class="space-y-3 p-1">
          <!-- Add member with search -->
          <div
            v-if="hasPermission('master-data', 'create-grup-penerima')"
            class="space-y-2"
          >
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400">{{
              t('gp_btn_add_member')
            }}</label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="addMemberDropdownSearch"
                type="text"
                :placeholder="t('gp_search_position')"
                class="w-full h-9 pl-9 pr-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div
              v-if="addMemberDropdownSearch"
              class="border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto bg-white dark:bg-gray-800"
            >
              <div
                v-for="pos in filteredAddMemberPositions"
                :key="pos.position"
                :class="[
                  'w-full flex items-center gap-2 px-3 py-2 text-left border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors',
                  isMemberAlreadyAdded(pos.position)
                    ? 'bg-green-50 dark:bg-green-900/20 cursor-not-allowed'
                    : 'hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer',
                ]"
                @click="!isMemberAlreadyAdded(pos.position) && addMemberFromDropdown(pos.position)"
              >
                <Plus
                  v-if="!isMemberAlreadyAdded(pos.position)"
                  class="w-3 h-3 text-primary shrink-0"
                />
                <CheckIcon v-else class="w-3 h-3 text-green-500 shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-gray-900 dark:text-white truncate">
                    {{ pos.position_text }}
                  </p>
                  <p class="text-xs text-gray-400 truncate">
                    {{ pos.sub_area_text || pos.area || '-' }}
                  </p>
                </div>
                <span
                  v-if="isMemberAlreadyAdded(pos.position)"
                  class="text-xs text-green-600 dark:text-green-400 font-medium shrink-0"
                >
                  {{ t('gp_already_added') }}
                </span>
              </div>
              <p
                v-if="filteredAddMemberPositions.length === 0"
                class="px-3 py-3 text-center text-xs text-gray-400"
              >
                {{ t('gp_no_positions') }}
              </p>
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-200 dark:border-gray-600 pt-2">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400">{{
                t('gp_members_title')
              }}</label>
              <span v-if="!membersLoading && membersList.length > 0" class="text-xs text-gray-400"
                >{{ membersList.length }} {{ t('gp_members_unit') }}</span
              >
            </div>

            <!-- Search members -->
            <div class="relative mb-2">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="memberSearch"
                type="text"
                :placeholder="t('gp_search_members')"
                class="w-full h-9 pl-9 pr-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <!-- Members list -->
            <div class="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              <div v-if="membersLoading" class="text-center py-8 text-gray-400">
                <RefreshCw class="w-5 h-5 animate-spin inline mb-2" />
                <p class="text-sm">{{ t('gp_loading_members') }}</p>
              </div>
              <div
                v-else-if="filteredMembers.length === 0"
                class="text-center py-8 text-gray-400 text-sm"
              >
                {{ memberSearch ? t('gp_no_search_results') : t('gp_no_members') }}
              </div>
              <div
                v-for="member in filteredMembers"
                :key="member.id"
                class="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div
                  class="w-7 h-7 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"
                >
                  <Users class="w-3.5 h-3.5 text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ member.position_detail?.position_text || t('gp_unknown_position') }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{
                      member.position_detail?.sub_area_text || member.position_detail?.area || '-'
                    }}
                  </p>
                </div>
                <button
                  v-if="hasPermission('master-data', 'delete-grup-penerima') || isSuperadmin"
                  @click="removeMember(member)"
                  :title="t('gp_btn_remove_member')"
                  class="inline-flex h-8 w-8 items-center justify-center p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="showMembersModal = false"
            class="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
          >
            {{ t('gp_btn_close') }}
          </button>
        </div>
      </Modal>
    </Teleport>

    <!-- DELETE CONFIRM -->
    <ConfirmPopup
      v-model="showDeletePopup"
      :title="t('gp_delete_title')"
      :message="t('gp_delete_msg', { name: deleteTarget?.nama })"
      type="danger"
      :confirm-text="t('gp_btn_delete')"
      :cancel-text="t('gp_btn_cancel')"
      :require-confirmation="true"
      confirmation-text="KONFIRMASI HAPUS DATA"
      @confirm="doDelete"
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
  </div>
</template>

<script setup lang="ts">
import {
  Plus,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Pencil,
  Trash2,
  Users,
  Power,
  Check,
  Check as CheckIcon,
} from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { canAccessPage } = useFeatureAccess();
const { hasPermission, isSuperadmin } = useAuth();
const { t } = useI18n();
const toast = useToast();
const {
  getGrupPenerima,
  createGrupPenerima,
  updateGrupPenerima,
  toggleAktifGrupPenerima,
  deleteGrupPenerima,
  checkGrupPenerimaUsage,
  getGrupPenerimaMembers,
  addGrupPenerimaMember,
  deleteGrupPenerimaMember,
} = useGrupPenerima();
const { get } = useApi();

// ─── Breadcrumb ───────────────────────────────────────────────
const items = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('master_data'), to: '/master/klasifikasi' },
  { label: t('gp_title'), to: '/master/grup-penerima' },
]);

// ─── State ────────────────────────────────────────────────────
const list = ref<any[]>([]);
const loading = ref(false);
const search = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const openRowsDropdown = ref(false);
const rowsChoices = [5, 10, 20, 50];
const sortColumn = ref('nama');
const sortDirection = ref<'asc' | 'desc'>('asc');

// Add modal
const showAddModal = ref(false);
const savingAdd = ref(false);
const addForm = ref({
  nama: '',
  company: 'PERUM LPPNPI',
  deskripsi: '',
});
const addErrors = ref({ nama: false, company: false });
const addFormMembers = ref<string[]>([]);
const addMemberSearch = ref('');

// Edit modal
const showEditModal = ref(false);
const savingEdit = ref(false);
const editId = ref('');
const editForm = ref({
  nama: '',
  company: '',
  deskripsi: '',
});

// Delete
const showDeletePopup = ref(false);
const showBlockedDeletePopup = ref(false);
const blockedDeleteMessage = ref('');
const deleteTarget = ref<any>(null);
const checkingDelete = ref(false);
const actionLoadingId = ref('');

// Members modal
const showMembersModal = ref(false);
const selectedGrup = ref<any>(null);
const membersList = ref<any[]>([]);
const membersLoading = ref(false);
const newMemberPosition = ref('');
const addingMember = ref(false);
const memberSearch = ref('');
const addMemberDropdownSearch = ref('');
const positionOptions = ref<any[]>([]);

// ─── Computed ──────────────────────────────────────────────────
const filteredData = computed(() => {
  let data = [...list.value];
  if (search.value) {
    const s = search.value.toLowerCase();
    data = data.filter(
      (item) =>
        item.nama?.toLowerCase().includes(s) ||
        item.company?.toLowerCase().includes(s) ||
        item.deskripsi?.toLowerCase().includes(s)
    );
  }
  data.sort((a, b) => {
    const dir = sortDirection.value === 'asc' ? 1 : -1;
    const av = a[sortColumn.value] ?? '';
    const bv = b[sortColumn.value] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
  return data;
});

const totalPages = computed(() => Math.ceil(filteredData.value.length / perPage.value) || 1);
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredData.value.slice(start, start + perPage.value);
});

// Filtered positions for add modal
const filteredAddPositions = computed(() => {
  if (!addMemberSearch.value) return positionOptions.value.slice(0, 50);
  const s = addMemberSearch.value.toLowerCase();
  return positionOptions.value
    .filter(
      (p) =>
        p.position_text?.toLowerCase().includes(s) ||
        p.sub_area_text?.toLowerCase().includes(s) ||
        p.nama?.toLowerCase().includes(s)
    )
    .slice(0, 50);
});

// Filtered members for members modal
const filteredMembers = computed(() => {
  if (!memberSearch.value) return membersList.value;
  const s = memberSearch.value.toLowerCase();
  return membersList.value.filter(
    (m) =>
      m.position_detail?.position_text?.toLowerCase().includes(s) ||
      m.position_detail?.sub_area_text?.toLowerCase().includes(s) ||
      m.position_detail?.area?.toLowerCase().includes(s)
  );
});

// Filtered positions for add member dropdown in members modal
const filteredAddMemberPositions = computed(() => {
  if (!addMemberDropdownSearch.value) return [];
  const s = addMemberDropdownSearch.value.toLowerCase();
  return positionOptions.value
    .filter(
      (p) =>
        p.position_text?.toLowerCase().includes(s) ||
        p.sub_area_text?.toLowerCase().includes(s) ||
        p.nama?.toLowerCase().includes(s)
    )
    .slice(0, 20);
});

// Check if position already selected in add form
const isPositionSelected = (position: string | number) => {
  return addFormMembers.value.some((p) => String(p) === String(position));
};

// Check if position already added as member in members modal
const isMemberAlreadyAdded = (position: string | number) => {
  return membersList.value.some((m) => String(m.position) === String(position));
};

// ─── Methods ──────────────────────────────────────────────────
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getGrupPenerima();
    list.value = res?.data || res || [];
  } catch (err) {
    console.error('❌ Error fetch grup penerima:', err);
    // Jangan kosongkan list agar data tidak "hilang" dari UI saat error
  } finally {
    loading.value = false;
  }
};

const sortBy = (col: string) => {
  if (sortColumn.value === col) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = col;
    sortDirection.value = 'asc';
  }
};

// Export
const onExport = () => {
  if (filteredData.value.length === 0) {
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

const exportColumns = computed(() => [
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'nama', label: t('gp_col_name'), desc: 'Nama grup penerima surat' },
  { key: 'company', label: t('gp_col_company'), desc: 'Perusahaan naungan grup' },
  { key: 'deskripsi', label: t('gp_col_desc'), desc: 'Keterangan tujuan grup' },
  { key: 'members', label: t('gp_col_members'), desc: 'Jumlah anggota posisi di dalam grup' },
  { key: 'status', label: t('gp_col_status'), desc: 'Status keaktifan grup penerima' }
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
  const data = filteredData.value.map((item, idx) => {
    const r: Record<string, any> = {};
    if (selectedKeys.includes('No')) r['No'] = idx + 1;
    if (selectedKeys.includes('nama')) r[t('gp_col_name')] = item.nama;
    if (selectedKeys.includes('company')) r[t('gp_col_company')] = item.company || '-';
    if (selectedKeys.includes('deskripsi')) r[t('gp_col_desc')] = item.deskripsi || '-';
    if (selectedKeys.includes('members')) r[t('gp_col_members')] = item.details?.length ?? 0;
    if (selectedKeys.includes('status')) r[t('gp_col_status')] = item.aktif ? t('gp_active') : t('gp_inactive');
    return r;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t('gp_title'));
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `master_grup_penerima_${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast.add({
    title: t('berhasil'),
    description: 'Export berhasil.',
    color: 'success',
    icon: 'i-lucide-file-down'
  });
  showExportModal.value = false;
};

// Add
const openAddModal = async () => {
  addForm.value = {
    nama: '',
    company: 'PERUM LPPNPI',
    deskripsi: '',
  };
  addErrors.value = { nama: false, company: false };
  addFormMembers.value = [];
  addMemberSearch.value = '';
  showAddModal.value = true;
  if (positionOptions.value.length === 0) await fetchPositionOptions();
};

const submitAdd = async () => {
  addErrors.value = {
    nama: !addForm.value.nama,
    company: !addForm.value.company,
  };
  if (addErrors.value.nama || addErrors.value.company) return;
  savingAdd.value = true;
  try {
    const res = await createGrupPenerima(addForm.value);
    // Add selected members if any
    const grupId = res?.id || res?.data?.id;
    if (grupId && addFormMembers.value.length > 0) {
      for (const pos of addFormMembers.value) {
        try {
          await addGrupPenerimaMember(grupId, pos);
        } catch (e) {
          console.error('❌ Failed to add member:', pos, e);
        }
      }
    }
    toast.add({ title: t('gp_toast_add_ok'), color: 'success' });
    showAddModal.value = false;
    await fetchData();
  } catch (err) {
    toast.add({ title: t('gp_toast_add_fail'), description: err instanceof Error ? err.message : String(err), color: 'error' });
  } finally {
    savingAdd.value = false;
  }
};

// Edit
const openEditModal = (item: any) => {
  editId.value = item.id;
  editForm.value = {
    nama: item.nama,
    company: item.company,
    deskripsi: item.deskripsi || '',
  };
  showEditModal.value = true;
};

const submitEdit = async () => {
  savingEdit.value = true;
  try {
    await updateGrupPenerima(editId.value, editForm.value);
    toast.add({ title: t('gp_toast_edit_ok'), color: 'success' });
    showEditModal.value = false;
    await fetchData();
  } catch (err) {
    toast.add({ title: t('gp_toast_edit_fail'), description: err instanceof Error ? err.message : String(err), color: 'error' });
  } finally {
    savingEdit.value = false;
  }
};

// Toggle aktif
const toggleAktif = async (item: any) => {
  try {
    await toggleAktifGrupPenerima(item.id);
    toast.add({ title: t('gp_toast_toggle_ok'), color: 'success' });
    // Update status lokal dulu agar UI langsung responsif
    item.aktif = !item.aktif;
    await fetchData();
  } catch (err) {
    toast.add({ title: t('gp_toast_toggle_fail'), color: 'error' });
  }
};

// Delete
const confirmDelete = async (item: any) => {
  if (checkingDelete.value) return;
  checkingDelete.value = true;
  deleteTarget.value = item;
  try {
    const usage = await checkGrupPenerimaUsage(item.id);
    const usageData = usage?.data ?? usage;
    if (usageData?.canDelete === false) {
      blockedDeleteMessage.value = usageData.reason || 'Grup penerima masih digunakan.';
      showBlockedDeletePopup.value = true;
      deleteTarget.value = null;
      return;
    }
    showDeletePopup.value = true;
  } catch (err) {
    toast.add({
      title: t('gp_toast_delete_fail'),
      description: err instanceof Error ? err.message : String(err),
      color: 'error',
    });
    deleteTarget.value = null;
  } finally {
    checkingDelete.value = false;
  }
};

const doDelete = async () => {
  if (!deleteTarget.value) return;
  actionLoadingId.value = deleteTarget.value.id;
  try {
    await deleteGrupPenerima(deleteTarget.value.id);
    toast.add({ title: t('gp_toast_delete_ok'), color: 'success' });
    showDeletePopup.value = false;
    deleteTarget.value = null;
    await fetchData();
  } catch (err) {
    toast.add({
      title: t('gp_toast_delete_fail'),
      description: err instanceof Error ? err.message : String(err),
      color: 'error',
    });
  } finally {
    actionLoadingId.value = '';
  }
};

// Members
const fetchPositionOptions = async () => {
  try {
    const res = await get('/person/with-position/all');
    const raw = res?.data ?? res;
    positionOptions.value = Array.isArray(raw) ? raw : [];
  } catch {
    positionOptions.value = [];
  }
};

const viewMembers = async (item: any) => {
  selectedGrup.value = item;
  showMembersModal.value = true;
  membersLoading.value = true;
  newMemberPosition.value = '';
  memberSearch.value = '';
  addMemberDropdownSearch.value = '';
  try {
    const res = await getGrupPenerimaMembers(item.id);
    membersList.value = res?.data || res || [];
  } catch {
    membersList.value = [];
  } finally {
    membersLoading.value = false;
  }
  if (positionOptions.value.length === 0) await fetchPositionOptions();
};

const addMember = async () => {
  if (!newMemberPosition.value || !selectedGrup.value) return;
  addingMember.value = true;
  try {
    await addGrupPenerimaMember(selectedGrup.value.id, newMemberPosition.value);
    toast.add({ title: t('gp_toast_member_add_ok'), color: 'success' });
    newMemberPosition.value = '';
    const res = await getGrupPenerimaMembers(selectedGrup.value.id);
    membersList.value = res?.data || res || [];
    await fetchData();
  } catch (err) {
    toast.add({ title: t('gp_toast_member_add_fail'), color: 'error' });
  } finally {
    addingMember.value = false;
  }
};

const addMemberFromDropdown = async (position: string) => {
  if (!selectedGrup.value) return;
  addingMember.value = true;
  try {
    await addGrupPenerimaMember(selectedGrup.value.id, position);
    toast.add({ title: t('gp_toast_member_add_ok'), color: 'success' });
    addMemberDropdownSearch.value = '';
    const res = await getGrupPenerimaMembers(selectedGrup.value.id);
    membersList.value = res?.data || res || [];
    await fetchData();
  } catch (err) {
    toast.add({ title: t('gp_toast_member_add_fail'), color: 'error' });
  } finally {
    addingMember.value = false;
  }
};

const removeMember = async (member: any) => {
  if (!selectedGrup.value) return;
  try {
    await deleteGrupPenerimaMember(selectedGrup.value.id, member.id);
    toast.add({ title: t('gp_toast_member_remove_ok'), color: 'success' });
    membersList.value = membersList.value.filter((m) => m.id !== member.id);
    await fetchData();
  } catch {
    toast.add({ title: t('gp_toast_member_remove_fail'), color: 'error' });
  }
};

// ─── Lifecycle ────────────────────────────────────────────────
onMounted(() => {
  fetchData();
});
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
</style>
