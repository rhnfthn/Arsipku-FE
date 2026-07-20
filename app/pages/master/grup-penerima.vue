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
        </div>

        <!-- TABLE -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-primary-400 text-white dark:bg-primary-600">
                <th
                  class="px-4 py-3 text-left font-medium cursor-pointer"
                  @click="sortBy('urutan')"
                >
                  <div class="flex items-center gap-1">
                    {{ t('gp_col_no') }} <ArrowUpDown class="w-3 h-3" />
                  </div>
                </th>
                <th class="px-4 py-3 text-left font-medium cursor-pointer" @click="sortBy('nama')">
                  <div class="flex items-center gap-1">
                    {{ t('gp_col_name') }} <ArrowUpDown class="w-3 h-3" />
                  </div>
                </th>
                <th class="px-4 py-3 text-left font-medium">{{ t('gp_col_company') }}</th>
                <th class="px-4 py-3 text-left font-medium">{{ t('gp_col_area') }}</th>
                <th class="px-4 py-3 text-left font-medium">{{ t('gp_col_members') }}</th>
                <th class="px-4 py-3 text-left font-medium">{{ t('gp_col_status') }}</th>
                <th class="px-4 py-3 text-center font-medium">{{ t('gp_col_actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading skeleton -->
              <template v-if="loading">
                <tr v-for="i in 5" :key="`skeleton-${i}`">
                  <td colspan="7" class="px-4 py-3">
                    <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </td>
                </tr>
              </template>
              <!-- Empty state -->
              <tr v-else-if="paginatedData.length === 0">
                <td colspan="7" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  {{ t('gp_empty') }}
                </td>
              </tr>
              <!-- Data rows -->
              <tr
                v-for="item in paginatedData"
                :key="item.id"
                class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ item.urutan ?? '-' }}</td>
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ item.nama }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ item.company || '-' }}
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ item.area || '-' }}</td>
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
                      class="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                    >
                      <Users class="w-4 h-4" />
                    </button>
                    <!-- Edit -->
                    <button
                      v-if="hasPermission('master-data', 'update-grup-penerima')"
                      @click="openEditModal(item)"
                      :title="t('gp_btn_edit')"
                      class="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 transition-colors"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                    <!-- Toggle aktif -->
                    <button
                      v-if="hasPermission('master-data', 'update-grup-penerima')"
                      @click="toggleAktif(item)"
                      :title="t('gp_btn_toggle')"
                      class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                      <Power class="w-4 h-4" />
                    </button>
                    <!-- Delete -->
                    <button
                      v-if="hasPermission('master-data', 'delete-grup-penerima')"
                      @click="confirmDelete(item)"
                      :title="t('gp_btn_delete')"
                      class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
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
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
            >
              ‹
            </button>
            <button
              v-for="p in totalPages"
              :key="p"
              @click="currentPage = p"
              :class="[
                'px-3 py-1.5 text-sm border rounded-lg transition-colors',
                currentPage === p
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300',
              ]"
            >
              {{ p }}
            </button>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
            >
              ›
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
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >{{ t('gp_col_area') }} <span class="text-red-500">*</span></label
              >
              <input
                v-model="addForm.area"
                type="text"
                placeholder="A000"
                class="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                :class="addErrors.area ? 'border-red-500' : 'border-gray-300'"
              />
              <p v-if="addErrors.area" class="text-xs text-red-500 mt-1">
                {{ t('gp_err_required') }}
              </p>
            </div>
            <div class="col-span-2">
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
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                t('gp_col_urutan')
              }}</label>
              <input
                v-model.number="addForm.urutan"
                type="number"
                placeholder="1"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >{{ t('gp_col_area') }} <span class="text-red-500">*</span></label
            >
            <input
              v-model="editForm.area"
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
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
              t('gp_col_urutan')
            }}</label>
            <input
              v-model.number="editForm.urutan"
              type="number"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
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
        size="md"
      >
        <template #title>
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center"
            >
              <Users class="w-4 h-4 text-primary" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
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
                  class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 class="w-3.5 h-3.5" />
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
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Plus,
  Search,
  RefreshCw,
  ChevronDown,
  ArrowUpDown,
  Pencil,
  Trash2,
  Users,
  Power,
  Check as CheckIcon,
} from 'lucide-vue-next';

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
const sortColumn = ref('urutan');
const sortDirection = ref<'asc' | 'desc'>('asc');

// Add modal
const showAddModal = ref(false);
const savingAdd = ref(false);
const addForm = ref({
  nama: '',
  company: 'PERUM LPPNPI',
  area: 'A000',
  deskripsi: '',
  urutan: undefined as number | undefined,
});
const addErrors = ref({ nama: false, company: false, area: false });
const addFormMembers = ref<string[]>([]);
const addMemberSearch = ref('');

// Edit modal
const showEditModal = ref(false);
const savingEdit = ref(false);
const editId = ref('');
const editForm = ref({
  nama: '',
  company: '',
  area: '',
  deskripsi: '',
  urutan: undefined as number | undefined,
});

// Delete
const showDeletePopup = ref(false);
const deleteTarget = ref<any>(null);

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
        item.area?.toLowerCase().includes(s)
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
    list.value = [];
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

// Add
const openAddModal = async () => {
  addForm.value = {
    nama: '',
    company: 'PERUM LPPNPI',
    area: 'A000',
    deskripsi: '',
    urutan: undefined,
  };
  addErrors.value = { nama: false, company: false, area: false };
  addFormMembers.value = [];
  addMemberSearch.value = '';
  showAddModal.value = true;
  if (positionOptions.value.length === 0) await fetchPositionOptions();
};

const submitAdd = async () => {
  addErrors.value = {
    nama: !addForm.value.nama,
    company: !addForm.value.company,
    area: !addForm.value.area,
  };
  if (addErrors.value.nama || addErrors.value.company || addErrors.value.area) return;
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
    area: item.area,
    deskripsi: item.deskripsi || '',
    urutan: item.urutan,
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
    await fetchData();
  } catch (err) {
    toast.add({ title: t('gp_toast_toggle_fail'), color: 'error' });
  }
};

// Delete
const confirmDelete = (item: any) => {
  deleteTarget.value = item;
  showDeletePopup.value = true;
};

const doDelete = async () => {
  if (!deleteTarget.value) return;
  try {
    await deleteGrupPenerima(deleteTarget.value.id);
    toast.add({ title: t('gp_toast_delete_ok'), color: 'success' });
    showDeletePopup.value = false;
    deleteTarget.value = null;
    await fetchData();
  } catch (err) {
    toast.add({ title: t('gp_toast_delete_fail'), color: 'error' });
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
