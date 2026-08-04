<template>
  <nav
    class="bg-[#F6F8FC] dark:bg-gray-900 dark:border-gray-800 h-20 flex items-center transition-colors duration-300 gap-3 md:gap-5 justify-between sticky top-0 z-[50] relative"
  >
    <div class="flex items-center gap-3 flex-1">
      <button
        class="md:hidden me-2 mt-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        @click="$emit('open-mobile-sidebar')"
      >
        <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
      </button>

      <NuxtLink to="/beranda" class="md:hidden">
        <h1 class="font-bold text-xl tracking-tight text-neutral-900 dark:text-white">
          ArsipKu
        </h1>
      </NuxtLink>

      <!-- SEARCH BUTTON (DESKTOP) -->
      <div
        v-if="searchConfig.show"
        ref="searchBoxRef"
        class="hidden md:block w-full max-w-3xl relative"
      >
        <div class="relative flex items-center">
          <UIcon
            name="i-heroicons-magnifying-glass"
            class="absolute left-4 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none"
          />
          <input
            v-model="quickSearch"
            type="text"
            :placeholder="$t('sr_cari_perihal')"
            autocomplete="off"
            @keydown.enter="onSearchEnter"
            @keydown.down.prevent="onArrowDown"
            @keydown.up.prevent="onArrowUp"
            @keydown.esc="closeSuggestions"
            @focus="onSearchFocus"
            class="w-full pl-11 pr-12 py-3 bg-primary-50/80 dark:bg-gray-800 rounded-full hover:bg-white hover:shadow-md dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:shadow-md outline-none transition-all text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <UTooltip :text="$t('sr_filter_lanjutan')">
            <button
              @click="openSearchModal"
              class="absolute right-3 p-1.5 rounded-full hover:bg-primary-100 dark:hover:bg-gray-600 transition-colors"
            >
              <UIcon
                name="i-heroicons-adjustments-horizontal"
                class="text-primary-600 dark:text-primary-400 w-5 h-5"
              />
            </button>
          </UTooltip>
        </div>

        <!-- AUTOCOMPLETE DROPDOWN -->
        <div
          v-if="showSuggestions"
          class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden z-[60] max-h-[60vh] overflow-y-auto"
        >
          <!-- LOADING -->
          <div
            v-if="suggestionLoading"
            class="px-4 py-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400"
          >
            <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
            {{ $t('sr_mencari') }}
          </div>

          <!-- EMPTY -->
          <div
            v-else-if="suggestionItems.length === 0"
            class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ $t('sr_tidak_ada_hasil', { query: quickSearch }) }}
          </div>

          <!-- ITEMS -->
          <ul v-else class="py-1">
            <li
              v-for="(item, idx) in suggestionItems"
              :key="item.id_sirkulasi || item.id"
              :class="[
                'px-4 py-2.5 cursor-pointer flex items-start gap-3 transition-colors',
                selectedIndex === idx
                  ? 'bg-primary-50 dark:bg-gray-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/60'
              ]"
              @mouseenter="selectedIndex = idx"
              @mousedown.prevent="selectSuggestion(item)"
            >
              <UTooltip :text="resolveSourceMeta(item).label">
                <UIcon
                  :name="resolveSourceMeta(item).icon"
                  class="w-4 h-4 mt-0.5 shrink-0 text-gray-500 dark:text-gray-400"
                />
              </UTooltip>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-0.5">
                  <span
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0"
                    :class="getSuggestionBadgeClass(item.jenis)"
                  >
                    {{ item.jenis || '-' }}
                  </span>
                  <span
                    class="text-sm text-gray-900 dark:text-gray-100 truncate font-medium"
                    v-html="item._formatted?.perihal || item.perihal || '(tanpa perihal)'"
                  />
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                  <span
                    class="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <UIcon :name="resolveSourceMeta(item).icon" class="w-3 h-3" />
                    {{ resolveSourceMeta(item).label }}
                  </span>
                  <span v-if="item.nomor" class="truncate">{{ item.nomor }}</span>
                  <span v-if="item.nomor && item.pengirim?.nama">•</span>
                  <span v-if="item.pengirim?.nama" class="truncate">{{ item.pengirim.nama }}</span>
                </div>
              </div>
            </li>
          </ul>

          <!-- FOOTER: lihat semua hasil -->
          <button
            v-if="suggestionItems.length > 0"
            type="button"
            @mousedown.prevent="goToFullSearch"
            class="w-full text-left px-4 py-2.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700 transition-colors flex items-center gap-2"
          >
            <UIcon name="i-lucide-search" class="w-3.5 h-3.5" />
            {{ $t('sr_lihat_semua', { query: quickSearch }) }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 md:gap-5">
      <!-- SEARCH BUTTON (MOBILE) -->
      <button
        @click="openSearchModal"
        class="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-full transition-colors"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="w-6 h-6" />
      </button>

      <!-- NOTIFICATION BELL -->
      <NotificationBell />

      <!-- ANOMALY BELL (Super Admin only) -->
      <AuditAnomalyBell v-if="hasRole('SUPERADMIN')" />

      <UDropdownMenu
        :items="menuItems"
        :content="{ align: 'end' }"
        :ui="{
          content: 'w-72 dark:bg-gray-900 dark:ring-gray-800 max-h-[70vh] overflow-y-auto',
          item: 'px-4 py-3',
          itemLabel: 'text-sm'
        }"
      >
        <div class="flex items-center gap-2.5 cursor-pointer group pl-2">
          <div class="hidden md:flex flex-col items-end text-right justify-center gap-0.5">
            <span
              class="text-sm font-semibold leading-none text-gray-900 dark:text-gray-100 truncate max-w-[200px]"
            >
              {{ user?.nama }}
            </span>

            <UTooltip :text="user?.positionText" :popper="{ placement: 'bottom-end' }">
              <div class="flex items-center justify-end gap-1.5 leading-none">
                <UBadge
                  size="xs"
                  variant="subtle"
                  color="primary"
                  class="rounded px-1.5 py-0.5 text-[10px] shrink-0 font-medium capitalize leading-none"
                >
                  <span v-if="positionStatusLabel">{{ positionStatusLabel }} /</span>
                  {{ user?.role }}
                </UBadge>

                <span
                  class="text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[150px]"
                >
                  {{ user?.positionText }}
                </span>
              </div>
            </UTooltip>

            <UTooltip
              v-if="user?.companyText"
              :text="user?.companyText"
              :popper="{ placement: 'bottom-end' }"
            >
              <span
                class="text-[10px] font-medium leading-none text-gray-400 dark:text-gray-500 truncate max-w-[150px]"
              >
                {{ user?.companyText }}
              </span>
            </UTooltip>
          </div>

          <UAvatar
            size="md"
            class="ring-2 ring-transparent group-hover:ring-primary-500/30 transition-all duration-200 bg-primary-500 text-white font-bold flex items-center justify-center shadow-sm"
          >
            {{ getInitials(user?.nama || '') }}
          </UAvatar>
        </div>

        <template #delegation-item="{ item }: { item: any }">
          <div class="flex flex-col w-full min-w-0 gap-1 py-1 relative">
            <div class="flex items-center justify-between w-full gap-3">
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {{ item.uiName }}
              </span>

              <div class="flex items-center gap-1.5 shrink-0">
                <UBadge
                  size="xs"
                  variant="subtle"
                  color="primary"
                  class="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize leading-none whitespace-nowrap"
                >
                  {{ item.uiBadge }}
                </UBadge>
                <UIcon
                  v-if="item.isActive"
                  name="i-heroicons-check-circle-20-solid"
                  class="w-4 h-4 text-primary-600 dark:text-primary-400"
                />
              </div>
            </div>

            <div class="flex flex-col gap-0.5 w-full">
              <div v-if="item.uiPosition" class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 leading-snug">
                <UIcon name="i-lucide-briefcase" class="w-3 h-3 shrink-0 text-gray-400 dark:text-gray-500" />
                <span class="truncate">{{ item.uiPosition }}</span>
              </div>
              <div v-if="item.uiArea" class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 leading-snug">
                <UIcon name="i-lucide-map-pin" class="w-3 h-3 shrink-0 text-gray-400 dark:text-gray-500" />
                <span class="truncate">{{ item.uiArea }}</span>
              </div>
            </div>
          </div>
        </template>

        <template #profile-item="{ item }: { item: any }">
          <div class="flex items-center justify-between w-full gap-3">
            <span class="text-sm text-gray-900 dark:text-gray-100 truncate">
              {{ item.label }}
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
              <UBadge
                v-if="item.uiBadge"
                size="xs"
                variant="subtle"
                color="primary"
                class="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize leading-none"
              >
                {{ item.uiBadge }}
              </UBadge>
              <UIcon
                v-if="item.isActive"
                name="i-heroicons-check-circle-20-solid"
                class="w-4 h-4 text-primary-600 dark:text-primary-400"
              />
            </div>
          </div>
        </template>

        <template #theme-label>
          <div class="flex items-center justify-between w-full px-3">
            <span class="text-sm text-gray-700 dark:text-gray-200">Tampilan</span>
            <ClientOnly>
              <div
                class="flex items-center p-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <button
                  @click="isDark = false"
                  class="p-1 rounded-full transition-all flex items-center justify-center"
                  :class="
                    !isDark
                      ? 'bg-white text-orange-500 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  "
                >
                  <UIcon name="i-heroicons-sun" class="w-4 h-4" />
                </button>
                <button
                  @click="isDark = true"
                  class="p-1 rounded-full transition-all flex items-center justify-center"
                  :class="
                    isDark
                      ? 'bg-gray-700 text-yellow-300 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  "
                >
                  <UIcon name="i-heroicons-moon" class="w-4 h-4" />
                </button>
              </div>
              <template #fallback>
                <div
                  class="flex items-center p-0.5 rounded-full border border-gray-200 bg-gray-50"
                >
                  <div class="w-7 h-7" />
                  <div class="w-7 h-7" />
                </div>
              </template>
            </ClientOnly>
          </div>
        </template>

        <template #lang-label>
          <div class="flex items-center justify-between w-full px-3">
            <span class="text-sm text-gray-700 dark:text-gray-200">Bahasa</span>
            <div
              class="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5 border border-gray-200 dark:border-gray-700"
            >
              <UButton
                v-for="lang in locales"
                :key="lang.code"
                :label="lang.name"
                color="primary"
                :variant="locale === lang.code ? 'solid' : 'ghost'"
                @click="changeLocale(lang.code)"
                class="h-6 text-[10px] px-2"
              />
            </div>
          </div>
        </template>
      </UDropdownMenu>
    </div>
  </nav>

  <!-- SEARCH MODAL WITH BACKDROP BLUR -->
  <teleport to="body">
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isSearchModalOpen" class="fixed inset-0 z-[9999] overflow-y-auto">
        <!-- BACKDROP BLUR -->
        <div
          class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
          @click="((isSearchModalOpen = false), resetAdvancedFilters())"
        />

        <!-- MODAL CONTAINER -->
        <div class="flex min-h-full items-center justify-center p-4">
          <transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isSearchModalOpen"
              class="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl"
              @click.stop
            >
              <!-- MODAL HEADER -->
              <div
                class="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex items-center justify-center shrink-0 p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
                  >
                    <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5" />
                  </div>

                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ $t('sr_pencarian_surat') }}
                  </h3>
                </div>

                <button
                  @click="((isSearchModalOpen = false), resetAdvancedFilters())"
                  class="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
                </button>
              </div>

              <!-- MODAL CONTENT -->
              <div
                class="px-6 py-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
              >
                <div class="space-y-6">
                  <!-- NOMOR SURAT & PERIHAL -->

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div class="md:col-span-2">
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {{ $t('sr_nomor_surat') }}
                      </label>
                      <div class="relative">
                        <div
                          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                          <UIcon name="i-heroicons-hashtag" class="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          v-model="advancedFilters.nomorSurat"
                          placeholder="# 001/ADM/..."
                          class="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div class="md:col-span-2">
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {{ $t('sr_perihal') }}
                      </label>
                      <div class="relative">
                        <div
                          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                          <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          v-model="advancedFilters.perihal"
                          :placeholder="$t('sr_isi_perihal')"
                          class="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <!-- PENGIRIM -->
                    <div class="md:col-span-2">
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {{ $t('sr_pengirim') }}
                      </label>
                      <div class="relative">
                        <div
                          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                          <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                          >
                            <UIcon
                              v-if="!isPengirimLoading"
                              name="i-heroicons-user"
                              class="w-5 h-5 text-gray-400"
                            />
                            <UIcon
                              v-else
                              name="i-heroicons-arrow-path"
                              class="w-4 h-4 text-primary-400 animate-spin"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          v-model="advancedFilters.pengirim"
                          @input="handlePengirimInput"
                          @focus="handlePengirimFocus"
                          @blur="handlePengirimBlur"
                          :placeholder="$t('sr_nama_pengirim')"
                          class="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <div
                          v-if="showPengirimPopover && filteredPengirim.length > 0"
                          class="absolute z-[10000] w-full mt-1 max-h-60 overflow-y-auto p-1 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 rounded-lg"
                        >
                          <div
                            v-for="item in filteredPengirim"
                            :key="item.nama"
                            @mousedown.prevent="selectPengirim(item.nama)"
                            class="flex flex-col px-3 py-2 hover:bg-primary-50 dark:hover:bg-gray-800 cursor-pointer rounded-md transition-colors"
                          >
                            <span
                              class="text-sm font-semibold text-gray-900 dark:text-white"
                              v-html="highlightText(item.nama, advancedFilters.pengirim)"
                            ></span>
                            <span
                              class="text-xs text-gray-500 dark:text-gray-400"
                              v-html="highlightText(item.jabatan, advancedFilters.pengirim)"
                            ></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- PENERIMA -->
                    <div class="md:col-span-2">
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {{ $t('sr_penerima') }}
                      </label>
                      <div class="relative">
                        <div
                          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                          <UIcon
                            v-if="!isPenerimaLoading"
                            name="i-heroicons-user-group"
                            class="w-5 h-5 text-gray-400"
                          />
                          <UIcon
                            v-else
                            name="i-heroicons-arrow-path"
                            class="w-4 h-4 text-primary-400 animate-spin"
                          />
                        </div>
                        <input
                          type="text"
                          v-model="advancedFilters.penerima"
                          @input="handlePenerimaInput"
                          @focus="handlePenerimaFocus"
                          @blur="handlePenerimaBlur"
                          :placeholder="$t('sr_nama_penerima')"
                          class="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <div
                          v-if="showPenerimaPopover && filteredPenerima.length > 0"
                          class="absolute z-[10000] w-full mt-1 max-h-60 overflow-y-auto p-1 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 rounded-lg"
                        >
                          <div
                            v-for="item in filteredPenerima"
                            :key="item.nama"
                            @mousedown.prevent="selectPenerima(item.nama)"
                            class="flex flex-col px-3 py-2 hover:bg-primary-50 dark:hover:bg-gray-800 cursor-pointer rounded-md transition-colors"
                          >
                            <span
                              class="text-sm font-semibold text-gray-900 dark:text-white"
                              v-html="highlightText(item.nama, advancedFilters.penerima)"
                            ></span>
                            <span
                              class="text-xs text-gray-500 dark:text-gray-400"
                              v-html="highlightText(item.jabatan, advancedFilters.penerima)"
                            ></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- JENIS SURAT -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {{ $t('sr_jenis_surat') }}
                    </label>
                    <div class="flex flex-wrap gap-2.5">
                      <button
                        v-for="opt in jenisOptions"
                        :key="opt.label"
                        @click="
                          advancedFilters.jenis =
                            advancedFilters.jenis === opt.value ? '' : opt.value
                        "
                        :class="[
                          'px-4 py-1.5 text-sm font-medium rounded-full border border-transparent transition-all',
                          getCategoryStyle(opt.value || ''),
                          advancedFilters.jenis === opt.value
                            ? 'ring-2 ring-offset-1 ring-gray-400 opacity-100 font-bold shadow-sm'
                            : 'opacity-90 hover:opacity-100 hover:shadow-sm'
                        ]"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>

                  <!-- SIFAT & STATUS -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <!-- SIFAT -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {{ $t('sr_sifat') }}
                      </label>
                      <div class="relative">
                        <button
                          type="button"
                          @click.stop="toggleSifat"
                          class="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                        >
                          <span>{{ sifatLabel }}</span>
                          <UIcon
                            name="i-heroicons-chevron-down"
                            class="w-4 h-4 text-gray-400 transition-transform duration-200"
                            :class="{ 'rotate-180': openSifat }"
                          />
                        </button>
                        <Transition
                          enter-active-class="transition ease-out duration-150 origin-top"
                          enter-from-class="opacity-0 scale-y-90 -translate-y-1"
                          enter-to-class="opacity-100 scale-y-100 translate-y-0"
                          leave-active-class="transition ease-in duration-100 origin-top"
                          leave-from-class="opacity-100 scale-y-100 translate-y-0"
                          leave-to-class="opacity-0 scale-y-90 -translate-y-1"
                        >
                          <div
                            v-if="openSifat"
                            class="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[10001] overflow-hidden"
                          >
                            <button
                              v-for="opt in sifatOptions"
                              :key="String(opt.value)"
                              type="button"
                              @click.stop="selectSifat(opt.value)"
                              :class="[
                                'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0',
                                advancedFilters.sifat === opt.value
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              ]"
                            >
                              {{ opt.label }}
                            </button>
                          </div>
                        </Transition>
                      </div>
                    </div>

                    <!-- STATUS -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {{ $t('sr_status') }}
                      </label>
                      <div class="relative">
                        <button
                          type="button"
                          @click.stop="toggleStatus"
                          class="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                        >
                          <span>{{ statusLabel }}</span>
                          <UIcon
                            name="i-heroicons-chevron-down"
                            class="w-4 h-4 text-gray-400 transition-transform duration-200"
                            :class="{ 'rotate-180': openStatus }"
                          />
                        </button>
                        <Transition
                          enter-active-class="transition ease-out duration-150 origin-top"
                          enter-from-class="opacity-0 scale-y-90 -translate-y-1"
                          enter-to-class="opacity-100 scale-y-100 translate-y-0"
                          leave-active-class="transition ease-in duration-100 origin-top"
                          leave-from-class="opacity-100 scale-y-100 translate-y-0"
                          leave-to-class="opacity-0 scale-y-90 -translate-y-1"
                        >
                          <div
                            v-if="openStatus"
                            class="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[10001] overflow-hidden"
                          >
                            <button
                              v-for="opt in statusOptions"
                              :key="String(opt.value)"
                              type="button"
                              @click.stop="selectStatus(opt.value)"
                              :class="[
                                'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0',
                                advancedFilters.status === opt.value
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              ]"
                            >
                              {{ opt.label }}
                            </button>
                          </div>
                        </Transition>
                      </div>
                    </div>
                  </div>

                  <!-- LAMPIRAN & PRIORITAS -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <!-- LAMPIRAN -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {{ $t('sr_lampiran_filter') }}
                      </label>
                      <div class="relative">
                        <button
                          type="button"
                          @click.stop="toggleLampiran"
                          class="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                        >
                          <span>{{ lampiranLabel }}</span>
                          <UIcon
                            name="i-heroicons-chevron-down"
                            class="w-4 h-4 text-gray-400 transition-transform duration-200"
                            :class="{ 'rotate-180': openLampiran }"
                          />
                        </button>
                        <Transition
                          enter-active-class="transition ease-out duration-150 origin-top"
                          enter-from-class="opacity-0 scale-y-90 -translate-y-1"
                          enter-to-class="opacity-100 scale-y-100 translate-y-0"
                          leave-active-class="transition ease-in duration-100 origin-top"
                          leave-from-class="opacity-100 scale-y-100 translate-y-0"
                          leave-to-class="opacity-0 scale-y-90 -translate-y-1"
                        >
                          <div
                            v-if="openLampiran"
                            class="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[10001] overflow-hidden"
                          >
                            <button
                              v-for="opt in attachmentOptions"
                              :key="String(opt.value)"
                              type="button"
                              @click.stop="selectLampiran(opt.value)"
                              :class="[
                                'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0',
                                advancedFilters.hasAttachment === opt.value
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              ]"
                            >
                              {{ opt.label }}
                            </button>
                          </div>
                        </Transition>
                      </div>
                    </div>

                    <!-- PRIORITAS -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        {{ $t('sr_prioritas') }}
                      </label>
                      <div class="relative">
                        <button
                          type="button"
                          @click.stop="togglePriority"
                          class="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                        >
                          <span>{{ priorityLabel }}</span>
                          <UIcon
                            name="i-heroicons-chevron-down"
                            class="w-4 h-4 text-gray-400 transition-transform duration-200"
                            :class="{ 'rotate-180': openPriority }"
                          />
                        </button>
                        <Transition
                          enter-active-class="transition ease-out duration-150 origin-top"
                          enter-from-class="opacity-0 scale-y-90 -translate-y-1"
                          enter-to-class="opacity-100 scale-y-100 translate-y-0"
                          leave-active-class="transition ease-in duration-100 origin-top"
                          leave-from-class="opacity-100 scale-y-100 translate-y-0"
                          leave-to-class="opacity-0 scale-y-90 -translate-y-1"
                        >
                          <div
                            v-if="openPriority"
                            class="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[10001] overflow-hidden"
                          >
                            <button
                              v-for="opt in priorityOptions"
                              :key="String(opt.value)"
                              type="button"
                              @click.stop="selectPriority(opt.value)"
                              :class="[
                                'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0',
                                advancedFilters.priority === opt.value
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              ]"
                            >
                              {{ opt.label }}
                            </button>
                          </div>
                        </Transition>
                      </div>
                    </div>
                  </div>

                  <!-- RENTANG TANGGAL -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {{ $t('sr_rentang_tanggal') }}
                    </label>
                    <div class="grid grid-cols-2 gap-4 items-center">
                      <div class="relative">
                        <label
                          class="absolute -top-2 left-3 px-1 bg-white dark:bg-gray-900 text-[10px] text-gray-400 leading-none"
                        >
                          {{ $t('sr_dari') }}
                        </label>
                        <input
                          type="date"
                          v-model="advancedFilters.dateFrom"
                          class="block w-full px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                        />
                      </div>
                      <div class="relative">
                        <label
                          class="absolute -top-2 left-3 px-1 bg-white dark:bg-gray-900 text-[10px] text-gray-400 leading-none"
                        >
                          {{ $t('sr_sampai') }}
                        </label>
                        <input
                          type="date"
                          v-model="advancedFilters.dateTo"
                          class="block w-full px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- MODAL FOOTER -->
              <div
                class="flex items-center justify-between px-6 py-4 border-t rounded-b-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <button
                  @click="resetAdvancedFilters"
                  class="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
                  {{ $t('sr_reset_filter') }}
                </button>

                <div class="flex gap-3">
                  <button
                    @click="((isSearchModalOpen = false), resetAdvancedFilters())"
                    class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {{ $t('sr_batal') }}
                  </button>
                  <button
                    @click="handleAdvancedSearch"
                    class="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 shadow-sm transition-colors"
                  >
                    <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4" />
                    {{ $t('sr_terapkan') }}
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </teleport>

  <ConfirmPopup
    v-model="showLogoutPopup"
    type="warning"
    title="Keluar dari akun?"
    message="Anda akan keluar dari sistem. Pastikan semua pekerjaan sudah disimpan."
    confirmText="Keluar"
    cancelText="Batal"
    :isLoading="isLoggingOut"
    @confirm="confirmLogout"
    @cancel="showLogoutPopup = false"
  />

  <!-- VISUALISASI DIGSIG MODAL -->
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="showDigsigModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        @click.self="showDigsigModal = false"
      >
        <div
          class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          <!-- HEADER -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-pen-tool"
                class="w-5 h-5 text-primary-600 dark:text-primary-400"
              />
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
                Visualisasi Digsig (Visible)
              </h3>
            </div>
            <button
              @click="showDigsigModal = false"
              class="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>

          <!-- BODY -->
          <div class="px-6 py-5 space-y-4">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Pratinjau visualisasi tanda tangan digital berdasarkan profil aktif Anda.
              Ukuran kanvas <span class="font-medium">960×240 px</span>.
            </p>

            <div
              class="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 flex justify-center"
            >
              <canvas
                ref="digsigCanvasRef"
                width="960"
                height="240"
                class="max-w-full h-auto rounded-md bg-white"
              />
            </div>

            <div
              class="text-xs bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700 space-y-1"
            >
              <div class="flex gap-2">
                <span class="text-gray-500 dark:text-gray-400 w-20 shrink-0">Nama</span>
                <span class="text-gray-900 dark:text-gray-100 font-medium">{{
                  user?.nama || '-'
                }}</span>
              </div>
              <div class="flex gap-2">
                <span class="text-gray-500 dark:text-gray-400 w-20 shrink-0">Jabatan</span>
                <span class="text-gray-900 dark:text-gray-100 font-medium">{{
                  user?.positionText || '-'
                }}</span>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div
            class="flex flex-col sm:flex-row gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40"
          >
            <button
              @click="copyDigsigText"
              class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors"
            >
              <UIcon
                :name="digsigCopied ? 'i-lucide-check' : 'i-lucide-copy'"
                class="w-4 h-4"
              />
              {{ digsigCopied ? 'Tersalin' : 'Salin Teks' }}
            </button>
            <button
              @click="downloadDigsigVisual"
              class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary-600 hover:bg-primary-700 text-white transition-colors"
            >
              <UIcon name="i-lucide-download" class="w-4 h-4" />
              Unduh Visualisasi
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

  <LoadingOverlay :loading="isSwitching" :message="switchingMessage" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, reactive, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDark } from '@vueuse/core';
import type { DropdownMenuItem } from '#ui/types';

// --- INIT COMPOSABLES ---
const { user, getProfile, logout, hasPermission, hasRole } = useAuth();
const { getAvailableRoles, switchRole } = useDelegasi();
const { checkUser } = useOrganizationTu();
const toast = useToast();
const route = useRoute();
const router = useRouter();

// --- STATE ---
const isSearchModalOpen = ref(false);
const showLogoutPopup = ref(false);
const isLoggingOut = ref(false);
const search = ref('');
const delegationRoles = ref<any[]>([]);
const switchingMessage = ref('');

// --- VISUALISASI DIGSIG ---
const showDigsigModal = ref(false);
const digsigCanvasRef = ref<HTMLCanvasElement | null>(null);
const digsigCopied = ref(false);

const drawDigsigCanvas = () => {
  const canvas = digsigCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width; // 960
  const H = canvas.height; // 240

  // Background putih
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Border dark charcoal tebal
  const borderWidth = 4;
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = borderWidth;
  const half = borderWidth / 2;
  ctx.strokeRect(half, half, W - borderWidth, H - borderWidth);

  // Layout
  const padding = 24;
  const logoSize = 200;
  const logoX = padding + 4;
  const logoY = (H - logoSize) / 2;

  const drawTexts = () => {
    const textX = logoX + logoSize + 32;
    const textMaxW = W - textX - padding;

    // Font sizes (lebih besar agar canvas terisi penuh)
    const sizeBase = 22;
    const sizeName = Math.round(sizeBase * 1.5); // 33

    // Line spacing rapat
    const lhBase = sizeBase + 6; // 28
    const lhName = sizeName + 6; // 39
    const gapBetween = 4;
    const gapNama = 44;

    // Hitung tinggi total block teks utk centering vertikal
    const jabatan = (user.value?.positionText || '-').toString();
    const nama = (user.value?.nama || '-').toString();

    ctx.font = `${sizeBase}px "Times New Roman", Times, serif`;
    const headerLines = countWrapLines(ctx, 'Ditandatangani secara elektronik oleh', textMaxW);

    ctx.font = `bold ${sizeBase}px "Times New Roman", Times, serif`;
    const jabatanLines = countWrapLines(ctx, jabatan, textMaxW);

    ctx.font = `bold ${sizeName}px "Times New Roman", Times, serif`;
    const namaLines = countWrapLines(ctx, nama, textMaxW);

    const totalH =
      headerLines * lhBase +
      gapBetween +
      jabatanLines * lhBase +
      gapNama +
      namaLines * lhName;

    let cy = (H - totalH) / 2;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';

    // Baris 1: header (regular)
    ctx.font = `${sizeBase}px "Times New Roman", Times, serif`;
    wrapText(ctx, 'Ditandatangani secara elektronik oleh', textX, cy, textMaxW, lhBase);
    cy += headerLines * lhBase + gapBetween;

    // Baris 2: jabatan (bold)
    ctx.font = `bold ${sizeBase}px "Times New Roman", Times, serif`;
    wrapText(ctx, jabatan, textX, cy, textMaxW, lhBase);
    cy += jabatanLines * lhBase + gapNama;

    // Baris 3: nama (bold, 1.5x) - dengan jarak lebih lebar
    ctx.font = `bold ${sizeName}px "Times New Roman", Times, serif`;
    wrapText(ctx, nama, textX, cy, textMaxW, lhName);
  };

  // Logo Airnav (load async)
  const logo = new Image();
  logo.onload = () => {
    const ratio = Math.min(logoSize / logo.width, logoSize / logo.height);
    const w = logo.width * ratio;
    const h = logo.height * ratio;
    const x = logoX + (logoSize - w) / 2;
    const y = logoY + (logoSize - h) / 2;
    ctx.drawImage(logo, x, y, w, h);
    drawTexts();
  };
  logo.onerror = () => {
    drawTexts();
  };
  logo.src = '/logoAirnav.png';
};

const countWrapLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): number => {
  const words = text.split(' ');
  let line = '';
  let lines = 1;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      lines++;
      line = words[i] + ' ';
    } else {
      line = test;
    }
  }
  return lines;
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, cy);
      line = words[i] + ' ';
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, cy);
};

const openDigsigVisual = async () => {
  showDigsigModal.value = true;
  await nextTick();
  drawDigsigCanvas();
};

const downloadDigsigVisual = () => {
  const canvas = digsigCanvasRef.value;
  if (!canvas) return;
  const link = document.createElement('a');
  const safeName = (user.value?.nama || 'visualisasi-digsig')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  link.download = `digsig-${safeName || 'user'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

const copyDigsigText = async () => {
  const nama = user.value?.nama || '-';
  const jabatan = user.value?.positionText || '-';
  const text = `Ditandatangani secara elektronik oleh\n${jabatan}\n${nama}`;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  digsigCopied.value = true;
  toast.add({
    title: t('sr_berhasil_disalin'),
    description: t('sr_digsig_disalin'),
    icon: 'i-heroicons-check-circle',
    color: 'success'
  });
  setTimeout(() => (digsigCopied.value = false), 1500);
};

watch(showDigsigModal, (val) => {
  if (val) {
    nextTick(drawDigsigCanvas);
  } else {
    digsigCopied.value = false;
  }
});

// --- QUICK SEARCH ---
const quickSearch = ref('');

const handleQuickSearch = () => {
  if (!quickSearch.value.trim()) return;
  navigateTo({
    path: '/search',
    query: {
      page: 1,
      limit: 20,
      sortBy: 'tanggal',
      sortOrder: 'DESC',
      perihal: quickSearch.value.trim()
    }
  });
  quickSearch.value = '';
};

// --- QUICK SEARCH AUTOCOMPLETE DROPDOWN ---
const searchBoxRef = ref<HTMLElement | null>(null);
const showSuggestions = ref(false);
const suggestionLoading = ref(false);
const suggestionItems = ref<any[]>([]);
const selectedIndex = ref(-1);
let suggestionDebounce: ReturnType<typeof setTimeout> | null = null;
let suggestionAbort: AbortController | null = null;

const { apiGet: quickSearchGet } = useApi();

const fetchQuickSuggestions = async (q: string) => {
  // cancel inflight
  if (suggestionAbort) suggestionAbort.abort();
  suggestionAbort = new AbortController();

  suggestionLoading.value = true;
  try {
    const res = await quickSearchGet('/search/v3', {
      params: {
        perihal: q,
        page: 1,
        limit: 5,
        sortBy: 'tanggal',
        sortOrder: 'DESC'
      },
      signal: suggestionAbort.signal
    });
    if (res?.success) {
      suggestionItems.value = res.data?.items ?? [];
    } else {
      suggestionItems.value = [];
    }
  } catch (e: any) {
    if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
    suggestionItems.value = [];
  } finally {
    suggestionLoading.value = false;
  }
};

watch(quickSearch, (val) => {
  selectedIndex.value = -1;
  if (suggestionDebounce) clearTimeout(suggestionDebounce);

  const q = (val || '').trim();
  if (q.length < 3) {
    suggestionItems.value = [];
    showSuggestions.value = false;
    suggestionLoading.value = false;
    return;
  }

  showSuggestions.value = true;
  suggestionLoading.value = true;
  suggestionDebounce = setTimeout(() => fetchQuickSuggestions(q), 300);
});

const onSearchFocus = () => {
  if (quickSearch.value.trim().length >= 3) {
    showSuggestions.value = true;
  }
};

const closeSuggestions = () => {
  showSuggestions.value = false;
  selectedIndex.value = -1;
};

const onArrowDown = () => {
  if (!showSuggestions.value || suggestionItems.value.length === 0) return;
  selectedIndex.value = (selectedIndex.value + 1) % suggestionItems.value.length;
};

const onArrowUp = () => {
  if (!showSuggestions.value || suggestionItems.value.length === 0) return;
  selectedIndex.value =
    selectedIndex.value <= 0 ? suggestionItems.value.length - 1 : selectedIndex.value - 1;
};

const onSearchEnter = () => {
  if (
    showSuggestions.value &&
    selectedIndex.value >= 0 &&
    suggestionItems.value[selectedIndex.value]
  ) {
    selectSuggestion(suggestionItems.value[selectedIndex.value]);
    return;
  }
  closeSuggestions();
  handleQuickSearch();
};

const goToFullSearch = () => {
  closeSuggestions();
  handleQuickSearch();
};

const resolveDetailRoute = (item: any) => {
  const type = (item.source || item.folder || item.status || '').toString().toLowerCase();
  const roles: string[] = item.userRoles || [];

  if (item.status === 'draf') return 'draf';
  if (item.status === 'pending') return 'tertunda';
  if (roles.includes('pengirim') || ['sent', 'keluar', 'outbox'].some((k) => type.includes(k)))
    return 'terkirim';
  if (['draft', 'konsep'].some((k) => type.includes(k))) return 'draf';
  return 'kotak-masuk';
};

const resolveSourceMeta = (item: any) => {
  const type = (item.source || item.folder || item.status || '').toString().toLowerCase();
  const roles: string[] = item.userRoles || [];

  if (item.status === 'draf') {
    return {
      icon: 'i-lucide-file-edit',
      label: 'Draf',
      color: 'text-amber-500 dark:text-amber-400'
    };
  }
  if (item.status === 'pending') {
    return {
      icon: 'i-lucide-clock',
      label: 'Tertunda',
      color: 'text-orange-500 dark:text-orange-400'
    };
  }
  if (roles.includes('pengirim') || ['sent', 'keluar', 'outbox'].some((k) => type.includes(k))) {
    return {
      icon: 'i-lucide-send',
      label: 'Terkirim',
      color: 'text-sky-500 dark:text-sky-400'
    };
  }
  if (['draft', 'konsep'].some((k) => type.includes(k))) {
    return {
      icon: 'i-lucide-file-text',
      label: 'Konsep',
      color: 'text-purple-500 dark:text-purple-400'
    };
  }
  return {
    icon: 'i-lucide-inbox',
    label: 'Kotak Masuk',
    color: 'text-emerald-500 dark:text-emerald-400'
  };
};

const selectSuggestion = (item: any) => {
  if (!item?.id) return;
  const segment = resolveDetailRoute(item);
  closeSuggestions();
  quickSearch.value = '';
  navigateTo(`/korespondensi/${segment}/${item.id}?jenis=${item.jenis || ''}`);
};

const getSuggestionBadgeClass = (jenis?: string) => {
  const c = (jenis || '').toUpperCase();
  if (c === 'ND')
    return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  if (c === 'DI')
    return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
  if (c === 'SDI')
    return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
  if (c === 'SDE')
    return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
  if (c === 'KA')
    return 'bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800';
  return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
};

// click outside
const handleClickOutside = (e: MouseEvent) => {
  if (!searchBoxRef.value) return;
  if (!searchBoxRef.value.contains(e.target as Node)) {
    closeSuggestions();
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  if (suggestionDebounce) clearTimeout(suggestionDebounce);
  if (suggestionAbort) suggestionAbort.abort();
});

const advancedFilters = reactive({
  nomorSurat: '',
  perihal: '',
  pengirim: '',
  penerima: '',
  hasWords: '',
  doesntHave: '',
  dateFrom: '',
  dateTo: '',
  jenis: '' as string | null,
  sifat: '' as string | null,
  status: '' as string | null,
  hasAttachment: 'all',
  priority: null as boolean | null
});

const jenisOptions = computed(() => [
  { label: t('sr_semua'), value: null },
  { label: 'Nota Dinas (ND)', value: 'ND' },
  { label: 'Surat Dinas Internal (SDI)', value: 'SDI' },
  { label: 'Surat Dinas Eksternal (SDE)', value: 'SDE' },
  { label: 'Disposisi (DI)', value: 'DI' },
  { label: 'Kajian (KA)', value: 'KA' },
  { label: 'Konsep (K)', value: 'K' }
]);

// "Semua" sudah ada di index-0 masing-masing, tidak perlu duplikat di template
const sifatOptions = computed(() => [
  { label: t('sr_semua'), value: null },
  { label: t('sr_biasa'), value: 'biasa' },
  { label: t('sr_terbatas'), value: 'terbatas' },
  { label: t('sr_rahasia'), value: 'rahasia' },
  { label: t('sr_sangat_rahasia'), value: 'sangat_rahasia' },
  { label: t('sr_terbuka'), value: 'terbuka' }
]);

const statusOptions = computed(() => [
  { label: t('sr_semua'), value: null },
  { label: t('sr_draf'), value: 'draf' },
  { label: t('sr_final'), value: 'final' },
  { label: t('sr_final_tte'), value: 'final_tte' }
]);

const attachmentOptions = computed(() => [
  { label: t('sr_semua'), value: 'all' },
  { label: t('sr_ya'), value: true },
  { label: t('sr_tidak'), value: false }
]);

// --- CUSTOM DROPDOWN STATE ---
const openSifat = ref(false);
const openStatus = ref(false);
const openLampiran = ref(false);

const sifatLabel = computed(
  () => sifatOptions.value.find((s) => s.value === advancedFilters.sifat)?.label ?? t('sr_semua')
);
const statusLabel = computed(
  () => statusOptions.value.find((s) => s.value === advancedFilters.status)?.label ?? t('sr_semua')
);
const lampiranLabel = computed(() => {
  if (advancedFilters.hasAttachment === 'all' || advancedFilters.hasAttachment === null)
    return t('sr_semua');
  return attachmentOptions.value.find((a) => a.value === advancedFilters.hasAttachment)?.label ?? t('sr_semua');
});

function toggleSifat() {
  openSifat.value = !openSifat.value;
  openStatus.value = false;
  openLampiran.value = false;
}
function toggleStatus() {
  openStatus.value = !openStatus.value;
  openSifat.value = false;
  openLampiran.value = false;
}
function toggleLampiran() {
  openLampiran.value = !openLampiran.value;
  openSifat.value = false;
  openStatus.value = false;
}
function selectSifat(val: any) {
  advancedFilters.sifat = val;
  openSifat.value = false;
}
function selectStatus(val: any) {
  advancedFilters.status = val;
  openStatus.value = false;
}
function selectLampiran(val: any) {
  advancedFilters.hasAttachment = val;
  openLampiran.value = false;
}

// Tutup semua dropdown saat modal ditutup
watch(isSearchModalOpen, (val) => {
  if (!val) {
    openSifat.value = false;
    openStatus.value = false;
    openLampiran.value = false;
  }
});

const priorityOptions = computed(() => [
  { label: t('sr_semua'), value: null },
  { label: t('sr_prioritas'), value: true }
]);
const openPriority = ref(false);

const priorityLabel = computed(
  () => priorityOptions.value.find((p) => p.value === advancedFilters.priority)?.label ?? t('sr_semua')
);

function togglePriority() {
  openPriority.value = !openPriority.value;
  openSifat.value = false;
  openStatus.value = false;
  openLampiran.value = false;
}
function selectPriority(val: any) {
  advancedFilters.priority = val;
  openPriority.value = false;
}
// --- AUTOCOMPLETE PENGIRIM / PENERIMA ---
interface UserSuggestion {
  nama: string;
  jabatan: string;
}

const {
  suggestions: pengirimSuggestions,
  isSuggestionsLoading: isPengirimLoading,
  fetchSuggestions: fetchPengirimSuggestions
} = useSearch();

const {
  suggestions: penerimasuggestions,
  isSuggestionsLoading: isPenerimaLoading,
  fetchSuggestions: fetchPenerimaSuggestions
} = useSearch();

// AFTER
const filteredPengirim = computed(() => pengirimSuggestions.value);
const filteredPenerima = computed(() => penerimasuggestions.value);
const showPengirimPopover = ref(false);
const showPenerimaPopover = ref(false);

// Debounce timer
// AFTER
let pengirimTimer: ReturnType<typeof setTimeout> | null = null;
let penerimaTimer: ReturnType<typeof setTimeout> | null = null;

const handlePengirimInput = () => {
  if (pengirimTimer) clearTimeout(pengirimTimer);
  if (!advancedFilters.pengirim.trim()) {
    pengirimSuggestions.value = [];
    showPengirimPopover.value = false;
    return;
  }
  pengirimTimer = setTimeout(async () => {
    await fetchPengirimSuggestions(advancedFilters.pengirim, 'pengirim');
    showPengirimPopover.value = pengirimSuggestions.value.length > 0;
  }, 300);
};

const handlePengirimFocus = () => {
  if (advancedFilters.pengirim.trim().length >= 2)
    showPengirimPopover.value = pengirimSuggestions.value.length > 0;
};
const selectPengirim = (nama: string) => {
  advancedFilters.pengirim = nama;
  pengirimSuggestions.value = [];
  showPengirimPopover.value = false;
};
const handlePengirimBlur = () => {
  setTimeout(() => {
    showPengirimPopover.value = false;
  }, 200);
};

// Penerima — sekarang terisi penuh
const handlePenerimaInput = () => {
  if (penerimaTimer) clearTimeout(penerimaTimer);
  if (!advancedFilters.penerima.trim()) {
    penerimasuggestions.value = [];
    showPenerimaPopover.value = false;
    return;
  }
  penerimaTimer = setTimeout(async () => {
    await fetchPenerimaSuggestions(advancedFilters.penerima, 'penerima');
    showPenerimaPopover.value = penerimasuggestions.value.length > 0;
  }, 300);
};

const handlePenerimaFocus = () => {
  if (advancedFilters.penerima.trim().length >= 2)
    showPenerimaPopover.value = penerimasuggestions.value.length > 0;
};
const selectPenerima = (nama: string) => {
  advancedFilters.penerima = nama;
  penerimasuggestions.value = [];
  showPenerimaPopover.value = false;
};
const handlePenerimaBlur = () => {
  setTimeout(() => {
    showPenerimaPopover.value = false;
  }, 200);
};
const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const q = query.trim();
  const regex = new RegExp(`(${q})`, 'gi');
  return text.replace(
    regex,
    '<span class="text-primary-600 dark:text-primary-400 font-bold">$1</span>'
  );
};

// --- USER / DELEGATION ---
const isCurrentlyDelegated = computed(() => !!activeDelegationId.value);

const positionStatusLabel = computed(() => {
  const u = user.value;
  if (!u) return null;
  // Only show position_status when actually in delegated mode
  if (isCurrentlyDelegated.value && u.position_status) return u.position_status;
  return null;
});

const getStoredOriginalRole = () =>
  process.client ? localStorage.getItem('arsipku_original_position') : null;
const originalRoleLabel = ref(getStoredOriginalRole() || 'Posisi Utama');
const activeDelegationId = ref<string | null>(null);

const initActiveState = () => {
  if (process.client) {
    activeDelegationId.value = localStorage.getItem('arsipku_active_delegation_id');
    // JANGAN overwrite active_profile jika user sudah pilih profile manual
    // (unit_dokumen / sekretaris / akun_asli). Hanya set default jika belum ada.
    const currentStored = localStorage.getItem('active_profile') || localStorage.getItem('arsipku_active_profile');
    if (!currentStored) {
      // Default: akun_asli
      localStorage.setItem('active_profile', 'akun_asli');
      localStorage.setItem('arsipku_active_profile', 'akun_asli');
    }
  }
};

const fetchDelegationRoles = async () => {
  if (!user.value) return;
  try {
    const roles = await getAvailableRoles();
    delegationRoles.value = roles || [];
  } catch (e) {
    console.error('Error fetch roles', e);
  }
};

// ─── Pindah Profile (Sekretaris + Unit Dokumen) ───────────────────────────────
// Deteksi delegasi: dari JWT tuRoles (cepat), fallback checkUser endpoint (akurat).
// Dideklarasikan SEBELUM watch(user) agar bisa dipanggil dari watcher immediate.
const hasUnitDokumenDelegation = ref(false);
const hasSecretaryDelegation = ref(false);
// Simpan data assignment untuk label jabatan/lokasi.
const unitDokumenAssignment = ref<any>(null);
const sekretarisAssignment = ref<any>(null);

// Label jabatan untuk card profile.
// Sekretaris: "{jabatan_delegator} - Sekretaris" (dari delegasi SE) atau fallback.
// Unit Dokumen: "{jabatan_delegator} - Unit Dokumen" atau fallback jabatan asli user.
const sekretarisPositionLabel = computed(() => {
  // Cek dari delegationRoles (delegasi SE) — ambil jabatan delegator.
  const seDelegasi = (delegationRoles.value || []).find(
    (r: any) => r?.delegated_role?.position_status === 'SE'
  );
  if (seDelegasi?.delegated_from?.position_text) {
    return `${seDelegasi.delegated_from.position_text} - Sekretaris`;
  }
  // Fallback dari organization_tu assignment.
  if (sekretarisAssignment.value?.organization_text) {
    return `${sekretarisAssignment.value.organization_text} - Sekretaris`;
  }
  return 'Sekretaris';
});
const unitDokumenPositionLabel = computed(() => {
  // Dari organization_tu assignment — ambil organization_text sebagai jabatan.
  if (unitDokumenAssignment.value?.organization_text) {
    return `${unitDokumenAssignment.value.organization_text} - Unit Dokumen`;
  }
  // Fallback: jabatan asli user + "Unit Dokumen".
  if (user.value?.positionText) {
    return `${user.value.positionText} - Unit Dokumen`;
  }
  return 'Unit Dokumen';
});

const detectUnitDokumenDelegation = async () => {
  if (!user.value?.persnum) return;
  // 1. Cek dari JWT tuRoles dulu.
  const roles = user.value?.tuRoles;
  if (Array.isArray(roles)) {
    if (roles.includes('tu')) hasUnitDokumenDelegation.value = true;
    if (roles.includes('sekretaris')) hasSecretaryDelegation.value = true;
  }
  // 2. Fallback: query endpoint check-user (akurat, untuk JWT lama).
  try {
    const result = await checkUser(user.value.persnum) as any;
    if (result?.has_unit_dokumen) {
      hasUnitDokumenDelegation.value = true;
      // Simpan assignment unit_dokumen untuk label.
      const assignment = (result?.active_assignments || []).find(
        (a: any) => a.role === 'unit_dokumen'
      );
      if (assignment) unitDokumenAssignment.value = assignment;
    }
    if (result?.has_sekretaris_delegasi) {
      hasSecretaryDelegation.value = true;
      // Simpan assignment sekretaris untuk label.
      const assignment = (result?.active_assignments || []).find(
        (a: any) => a.role === 'sekretaris_delegasi'
      );
      if (assignment) sekretarisAssignment.value = assignment;
    }
  } catch (e) {
    console.error('[Navbar] detectUnitDokumenDelegation error:', e);
  }
};

// Baca active_profile dari localStorage (sumber utama), default 'akun_asli'.
const readStoredProfile = (): 'akun_asli' | 'unit_dokumen' | 'sekretaris' => {
  if (process.client) {
    const stored = localStorage.getItem('active_profile') || localStorage.getItem('arsipku_active_profile');
    if (stored === 'akun_asli' || stored === 'unit_dokumen' || stored === 'sekretaris') return stored;
  }
  return 'akun_asli';
};
const currentProfile = ref(readStoredProfile());

const handleSwitchProfile = (profile: 'akun_asli' | 'unit_dokumen' | 'sekretaris') => {
  if (profile === currentProfile.value) return;
  if (process.client) {
    localStorage.setItem('active_profile', profile);
    localStorage.setItem('arsipku_active_profile', profile);
    // Reset state delegasi (sumber kebenaran kedua) agar tidak ada centang
    // ganda saat beralih via path Pindah Profile. Satu sumber kebenaran:
    // active_profile. Tanpa ini, card delegasi lama tetap centang karena
    // arsipku_active_delegation_id belum di-clear.
    localStorage.removeItem('arsipku_active_delegation_id');
    localStorage.removeItem('arsipku_active_delegation_role');
    activeDelegationId.value = null;
    window.dispatchEvent(new Event('active_profile_changed'));
    window.dispatchEvent(new Event('profile-changed'));
    currentProfile.value = profile;
    // Reload agar sidebar & menu update konsisten.
    window.location.reload();
  }
};

watch(
  user,
  (newUser) => {
    if (!newUser) return;
    fetchDelegationRoles();
    detectUnitDokumenDelegation();
    // Capture the original (YBS) role only when NOT delegated — use the
    // authoritative position_status (Spec A), not the activeDelegationId
    // localStorage proxy (racy: initActiveState runs in onMounted, which may
    // fire after the watch resolves on profile-populate). When delegated,
    // keep the stored original so it never becomes the delegated position.
    if (!newUser.position_status) {
      originalRoleLabel.value = newUser.positionText;
      if (process.client) localStorage.setItem('arsipku_original_position', newUser.positionText);
    } else if (process.client) {
      const stored = localStorage.getItem('arsipku_original_position');
      if (stored) originalRoleLabel.value = stored;
    }
  },
  { immediate: true }
);

const isSwitching = ref(false);

const handleSwitchRole = async (target: { type: 'delegasi' | 'reset'; id?: string }) => {
  if (isSwitching.value) return;
  switchingMessage.value =
    target.type === 'delegasi' ? 'Mengalihkan ke Akun Delegasi...' : 'Kembali ke Akun Utama...';
  isSwitching.value = true;
  try {
    const payload =
      target.type === 'delegasi' && target.id
        ? { delegasiId: target.id }
        : { resetToOriginal: true };
    const res = await switchRole(payload);
    if (res?.success) {
      if (target.type === 'delegasi' && target.id) {
        localStorage.setItem('arsipku_active_delegation_id', target.id);
        if (res.data?.user?.role)
          localStorage.setItem('arsipku_active_delegation_role', res.data.user.role);
        // Sinkronkan active_profile: delegasi SE (Sekretaris) → 'sekretaris',
        // delegasi lain (VI/PT/dll) → tetap 'akun_asli' (bukan sekretaris).
        // Tanpa ini, setelah reload currentProfile tidak sinkron dengan delegasi
        // aktif → centang kembali ke Akun Asli.
        const newPosStatus = res.data?.user?.position_status;
        const profile = newPosStatus === 'SE' ? 'sekretaris' : 'akun_asli';
        localStorage.setItem('active_profile', profile);
        localStorage.setItem('arsipku_active_profile', profile);
      } else {
        localStorage.removeItem('arsipku_active_delegation_id');
        localStorage.removeItem('arsipku_active_delegation_role');
        // Reset ke akun asli → profile 'akun_asli'.
        localStorage.setItem('active_profile', 'akun_asli');
        localStorage.setItem('arsipku_active_profile', 'akun_asli');
      }
      // Beri tahu sidebar agar update tanpa reload manual.
      window.dispatchEvent(new Event('active_profile_changed'));
      window.dispatchEvent(new Event('profile-changed'));
      localStorage.setItem('switch_role_message', res.message || 'Berhasil mengganti role.');
      window.location.reload();
    } else {
      isSwitching.value = false;
    }
  } catch (error) {
    console.error('Gagal ganti role:', error);
    toast.add({
      title: 'Gagal',
      description: 'Gagal mengganti role.',
      color: 'error'
    });
    isSwitching.value = false;
  }
};

const confirmLogout = async () => {
  if (process.client) {
    localStorage.removeItem('arsipku_original_position');
    localStorage.removeItem('arsipku_active_delegation_id');
    localStorage.removeItem('arsipku_active_delegation_role');
    localStorage.removeItem('active_profile');
    localStorage.removeItem('arsipku_active_profile');
  }
  isLoggingOut.value = true;
  await logout();
  isLoggingOut.value = false;
  showLogoutPopup.value = false;
  navigateTo('/');
};

// --- SEARCH ---
const searchConfig = computed(() => ({
  show: hasPermission('smart-search', 'search'),
  placeholder: 'Cari surat...',
  key: ''
}));

const openSearchModal = () => {
  isSearchModalOpen.value = true;
};

const handleAdvancedSearch = () => {
  const queryParams: any = {
    page: 1,
    limit: 20,
    sortBy: 'tanggal',
    sortOrder: 'DESC'
  };
  if (advancedFilters.priority === true) {
    queryParams.scope = 'priority';
  }
  if (search.value) queryParams.keyword = search.value;
  if (advancedFilters.nomorSurat) queryParams.nomor = advancedFilters.nomorSurat;
  if (advancedFilters.perihal) queryParams.perihal = advancedFilters.perihal;
  if (advancedFilters.jenis) queryParams.jenis = advancedFilters.jenis;
  if (advancedFilters.sifat) queryParams.sifat = advancedFilters.sifat;
  if (advancedFilters.status) queryParams.status = advancedFilters.status;
  if (advancedFilters.pengirim) queryParams.from = advancedFilters.pengirim;
  if (advancedFilters.penerima) queryParams.to = advancedFilters.penerima;
  if (advancedFilters.dateFrom) queryParams.dateFrom = advancedFilters.dateFrom;
  if (advancedFilters.dateTo) queryParams.dateTo = advancedFilters.dateTo;
  if (advancedFilters.hasWords) queryParams.hasWords = advancedFilters.hasWords;
  if (advancedFilters.doesntHave) queryParams.doesntHave = advancedFilters.doesntHave;
  if (advancedFilters.hasAttachment !== 'Semua' && advancedFilters.hasAttachment !== null) {
    queryParams.hasAttachment = advancedFilters.hasAttachment;
  }

  isSearchModalOpen.value = false;
  navigateTo({ path: '/search', query: queryParams });
};

const resetAdvancedFilters = () => {
  advancedFilters.nomorSurat = '';
  advancedFilters.perihal = '';
  advancedFilters.pengirim = '';
  advancedFilters.penerima = '';
  advancedFilters.hasWords = '';
  advancedFilters.doesntHave = '';
  advancedFilters.dateFrom = '';
  advancedFilters.dateTo = '';
  advancedFilters.jenis = null;
  advancedFilters.sifat = null;
  advancedFilters.status = null;
  advancedFilters.priority = null;
  advancedFilters.hasAttachment = 'Semua';
  search.value = '';
  quickSearch.value = '';
  openSifat.value = false;
  openStatus.value = false;
  openLampiran.value = false;
  pengirimSuggestions.value = [];
  penerimasuggestions.value = [];
  pengirimSuggestions.value = [];
  penerimasuggestions.value = [];
  showPengirimPopover.value = false;
  showPenerimaPopover.value = false;
};

const handleReset = () => {
  search.value = '';
  router.push({ path: '/beranda', query: {} });
};

// --- THEME & LOCALE ---
const isDark = useDark();
const locales = [
  { code: 'id', name: 'ID' },
  { code: 'en', name: 'EN' }
];
const { locale, setLocale, t } = useI18n();
const currentLocale = locale;

const changeLocale = (code: string) => {
  setLocale(code as 'id' | 'en');
  if (process.client) {
    localStorage.setItem('arsipku_locale', code);
  }
};

const syncLocaleFromStorage = (e: StorageEvent) => {
  if (e.key === 'arsipku_locale' && e.newValue && ['id', 'en'].includes(e.newValue)) {
    setLocale(e.newValue as 'id' | 'en');
  }
};

// --- MENU ITEMS ---
const itemClass = 'text-sm truncate transition-colors cursor-pointer';

const menuItems = computed<DropdownMenuItem[][]>(() => {
  const currentId = activeDelegationId.value;
  const isMainAccountActive = !currentId;
  const hasDelegationData = delegationRoles.value && delegationRoles.value.length > 0;

  const mainAccountItem = {
    uiName: user.value?.nama || 'User',
    uiBadge: user.value?.role || 'User',
    uiPosition: originalRoleLabel.value,
    uiArea: user.value?.areaText || user.value?.companyText || '',
    label: originalRoleLabel.value,
    slot: 'delegation-item',
    isActive: currentProfile.value === 'akun_asli',
    disabled: false,
    click: () => handleSwitchProfile('akun_asli'),
    onSelect: () => handleSwitchProfile('akun_asli')
  };

  const delegasiItems = (delegationRoles.value || []).map((role) => {
    const details = role.delegated_role || {};
    const from = role.delegated_from || {};
    // Untuk delegasi SE (Sekretaris), tampilkan jabatan delegator + "Sekretaris".
    // Contoh: "EVP of Air Navigation Services - Sekretaris".
    // Untuk delegasi lain, tampilkan position_text delegasi seperti biasa.
    let uiPosition = details.position_text || 'Jabatan Tidak Tersedia';
    if (details.position_status === 'SE') {
      const delegatorPosition = from.position_text;
      if (delegatorPosition) {
        uiPosition = `${delegatorPosition} - Sekretaris`;
      } else {
        uiPosition = 'Sekretaris';
      }
    }
    return {
      uiName: details.name || 'Nama Tidak Tersedia',
      uiBadge: details.position_status_label || 'Delegasi',
      uiPosition,
      uiArea: details.area_text || details.company_text || '',
      label: details.position_text || 'Delegasi',
      slot: 'delegation-item',
      // Samakan sumber kebenaran dengan card profile lain: pakai currentProfile.
      // Delegasi SE (Sekretaris) → aktif saat currentProfile === 'sekretaris'.
      // Delegasi non-SE (VI/PT/dll) → aktif saat currentProfile === 'akun_asli'
      // DAN sedang dalam mode delegasi (activeDelegationId === role.id).
      // Sebelumnya pakai currentId === role.id saja, yang tidak sinkron dengan
      // active_profile sehingga bisa muncul centang ganda.
      isActive:
        details.position_status === 'SE'
          ? currentProfile.value === 'sekretaris'
          : currentProfile.value === 'akun_asli' && currentId === role.id,
      click: () => handleSwitchRole({ type: 'delegasi', id: role.id }),
      onSelect: () => handleSwitchRole({ type: 'delegasi', id: role.id })
    };
  });

  // Profile cards: Akun Asli + delegasi (Sekretaris/Unit Dokumen) dalam satu group.
  // Tidak ada label "PINDAH PROFILE" — langsung card berturut-turut.
  const profileCards: any[] = [mainAccountItem, ...delegasiItems];

  // Cek apakah delegasi SE (Sekretaris) sudah ada di delegasiItems (dari tabel delegasi).
  // Jika sudah ada, jangan push card Sekretaris lagi (hindari duplikat).
  const hasSekretarisInDelegasiItems = (delegationRoles.value || []).some(
    (r: any) => r?.delegated_role?.position_status === 'SE',
  );

  // Tambahkan card Sekretaris hanya jika punya delegasi sekretaris dari organization_tu
  // DAN belum ada di delegasiItems (hindari duplikat).
  if (hasSecretaryDelegation.value && !hasSekretarisInDelegasiItems) {
    profileCards.push({
      uiName: user.value?.nama || 'User',
      uiBadge: 'Sekretaris',
      uiPosition: sekretarisPositionLabel.value,
      uiArea: user.value?.areaText || user.value?.companyText || '',
      label: 'Sekretaris',
      slot: 'delegation-item',
      isActive: currentProfile.value === 'sekretaris',
      click: () => handleSwitchProfile('sekretaris'),
      onSelect: () => handleSwitchProfile('sekretaris'),
    });
  }

  // Tambahkan card Unit Dokumen jika punya delegasi unit_dokumen.
  if (hasUnitDokumenDelegation.value) {
    profileCards.push({
      uiName: user.value?.nama || 'User',
      uiBadge: 'Unit Dokumen',
      uiPosition: unitDokumenPositionLabel.value,
      uiArea: user.value?.areaText || user.value?.companyText || '',
      label: 'Unit Dokumen',
      slot: 'delegation-item',
      isActive: currentProfile.value === 'unit_dokumen',
      click: () => handleSwitchProfile('unit_dokumen'),
      onSelect: () => handleSwitchProfile('unit_dokumen'),
    });
  }

  return [
    profileCards,
    [
      {
        label: 'Profil & Pengaturan AI',
        icon: 'i-lucide-user-cog',
        class: itemClass,
        onSelect: () => navigateTo('/profil')
      },
      { label: 'Pindah Perusahaan', icon: 'i-lucide-building-2', class: itemClass,
        onSelect: () => {
          navigateTo('/switch');
        }
      },
      {
        label: 'Visualisasi Digsig (Visible)',
        icon: 'i-lucide-signature',
        class: itemClass,
        onSelect: () => openDigsigVisual()
      },
    ],
    [{ slot: 'theme-label', type: 'label' }],
    [{ slot: 'lang-label', type: 'label' }],
    [
      {
        label: 'Keluar',
        icon: 'i-lucide-log-out',
        class: 'text-sm text-error',
        onSelect: () => openLogoutPopup()
      }
    ]
  ];
});

// --- LIFECYCLE ---
onMounted(() => {
  if (process.client) {
    initActiveState();

    const savedLocale = localStorage.getItem('arsipku_locale');
    if (savedLocale && ['id', 'en'].includes(savedLocale)) {
      setLocale(savedLocale as 'id' | 'en');
    }

    window.addEventListener('storage', syncLocaleFromStorage);

    const successMsg = localStorage.getItem('switch_role_message');
    if (successMsg) {
      toast.add({
        title: 'Berhasil',
        description: successMsg,
        icon: 'i-heroicons-check-circle',
        color: 'success'
      });
      localStorage.removeItem('switch_role_message');
    }
  }
  if (!user.value) getProfile();
});

onBeforeUnmount(() => {
  if (process.client) {
    window.removeEventListener('storage', syncLocaleFromStorage);
  }
});

const openLogoutPopup = () => {
  showLogoutPopup.value = true;
};

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

defineEmits(['open-mobile-sidebar']);

const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS'].includes(c))
    return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c))
    return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300';
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c))
    return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300';
  if (['SDE', 'SURAT DINAS EKSTERNAL'].includes(c))
    return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300';
  if (['KAJIAN', 'KA'].includes(c))
    return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
};
</script>
