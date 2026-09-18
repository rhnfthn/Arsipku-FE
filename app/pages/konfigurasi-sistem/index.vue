<template>
  <div class="min-h-screen pt-5 bg-gray-50 dark:bg-gray-900">
    <EmptyState
      v-if="!canViewKonfigurasi"
      icon="i-lucide-lock"
      title="Akses Ditolak"
      description="Anda tidak punya izin melihat konfigurasi sistem. Hubungi administrator."
    />
    <div v-else class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <Heading variant="heading6b" class="text-mobile-md">
          {{ $t("konfig_title") }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Single Card -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Tab Bar: pill tabs yang bisa digeser saat menu banyak -->
        <div
          class="relative border-b border-gray-100 dark:border-gray-700 bg-linear-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <!-- Fade tepi kiri/kanan: indikasi daftar menu bisa digeser -->
          <div
            class="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-gray-50 to-transparent dark:from-gray-800 transition-opacity duration-300"
            :class="canScrollLeft ? 'opacity-100' : 'opacity-0'" />
          <div
            class="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-white to-transparent dark:from-gray-800 transition-opacity duration-300"
            :class="canScrollRight ? 'opacity-100' : 'opacity-0'" />

          <!-- Tombol geser (hanya layar sm ke atas; mobile cukup swipe) -->
          <button v-show="canScrollLeft" type="button" @click="scrollTabsBy(-1)"
            class="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center justify-center size-7 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-500 dark:text-gray-300 hover:text-primary hover:border-primary-300 dark:hover:border-primary-700 transition-all"
            :aria-label="t('konfig_tab_scroll_prev')">
            <UIcon name="i-lucide-chevron-left" class="size-4" />
          </button>
          <button v-show="canScrollRight" type="button" @click="scrollTabsBy(1)"
            class="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center justify-center size-7 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-500 dark:text-gray-300 hover:text-primary hover:border-primary-300 dark:hover:border-primary-700 transition-all"
            :aria-label="t('konfig_tab_scroll_next')">
            <UIcon name="i-lucide-chevron-right" class="size-4" />
          </button>

          <!-- Daftar tab: scroll horizontal tanpa scrollbar -->
          <div ref="tabScrollRef" role="tablist" @scroll.passive="updateScrollState" @keydown="handleTabKeydown"
            class="flex items-center gap-2 overflow-x-auto scrollbar-hide px-5 py-4">
            <button v-for="tab in tabs" :key="tab.value" type="button" role="tab" :data-tab="tab.value"
              :aria-selected="activeTab === tab.value" :tabindex="activeTab === tab.value ? 0 : -1"
              @click="activeTab = tab.value" :class="[
                'group flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 border transition-all duration-200',
                activeTab === tab.value
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary dark:hover:text-primary-300 hover:bg-primary-50/60 dark:hover:bg-primary-900/20',
              ]">
              <span :class="[
                'flex items-center justify-center size-6 rounded-full transition-colors duration-200',
                activeTab === tab.value
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 group-hover:text-primary dark:group-hover:text-primary-300',
              ]">
                <UIcon :name="tab.icon" class="size-3.5" />
              </span>
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- ===================== TAB: DIGSIG ===================== -->
        <div v-if="activeTab === 'digsig'" class="p-6">
          <Heading variant="heading9sb" class="text-mobile-md">
            {{ $t("konfig_digsig_title") }}
          </Heading>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-7 mt-1">
            {{ $t("konfig_digsig_desc") }}
          </p>

          <div v-if="isLoading" class="space-y-3">
            <div v-for="i in 5" :key="i"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-5 rounded-xl border border-gray-200 dark:border-gray-700">
              <div class="space-y-2">
                <USkeleton class="h-4 w-32 rounded" />
                <USkeleton class="h-3 w-48 rounded" />
              </div>
              <USkeleton class="h-9 w-full sm:w-[380px] rounded-lg shrink-0" />
            </div>
          </div>

          <!-- Data -->
          <div v-else class="space-y-3">
            <div v-for="doc in digsigList" :key="doc.id"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700/50 transition-colors">
              <div>
                <p class="text-sm font-semibold text-gray-800 dark:text-white">
                  {{ doc.description }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ $t("konfig_digsig_izinkan") }} {{ doc.description }}
                </p>
              </div>

              <div class="flex w-full sm:w-[380px] bg-[#f3f4f6] dark:bg-gray-800 rounded-lg p-1 shrink-0 gap-1">
                <button v-for="opt in getAvailableOptions(doc)" :key="opt.value" type="button"
                  @click="handleChangeSignType(doc, opt.value)" :disabled="isToggling === doc.jenisNaskah" :class="[
                    'flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap',
                    isSelected(doc, opt.value)
                      ? 'bg-[#457fb6] text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700'
                  ]">
                  {{ opt.label }}
                </button>
              </div>

            </div>
          </div>
          <div
            class="mt-6 flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-100 dark:border-primary-900">
            <UIcon name="i-lucide-info" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
            <div class="text-sm text-primary-800 dark:text-primary-200 leading-relaxed">
              <span class="font-semibold block mb-1">Informasi</span>
              <p>
                Pilih satu atau beberapa metode tanda tangan yang diizinkan untuk setiap jenis naskah. Jika mode
                <strong>Digsig</strong> terkendala atau pengguna tidak memiliki akun TTE, pengguna tetap dapat mengirim
                dokumen menggunakan metode lainnya.
              </p>
            </div>
          </div>
        </div>

        <!-- ===================== TAB: PENGUMUMAN ===================== -->
        <div v-if="activeTab === 'pengumuman'">
          <!-- Form buat pengumuman -->
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <Heading variant="heading9sb" class="text-mobile-md">
              {{ $t("konfig_pengumuman_title") }}
            </Heading>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-7 mt-1">
              {{ $t("konfig_pengumuman_desc") }}
            </p>
            <div class="space-y-4">
              <!-- Judul -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t("konfig_form_judul") }}
                  <span class="text-red-500">*</span>
                </label>
                <input v-model="announcementForm.judul" :placeholder="$t('konfig_form_judul_placeholder')"
                  class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm dark:text-gray-200 pl-3 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <!-- Pesan -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t("konfig_form_pesan") }}
                  <span class="text-red-500">*</span>
                </label>
                <textarea v-model="announcementForm.pesan" rows="3" :placeholder="$t('konfig_form_pesan_placeholder')"
                  class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm dark:text-gray-200 pl-3 pr-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
              </div>
              <!-- Jenis -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t("konfig_form_jenis") }}
                  <span class="text-red-500">*</span>
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <button @click="announcementForm.jenis = 'info'" :class="[
                    'flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all text-sm font-medium',
                    announcementForm.jenis === 'info'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300',
                  ]">
                    <UIcon name="i-lucide-info" class="w-5 h-5" />
                    {{ $t("konfig_jenis_info") }}
                  </button>
                  <button @click="announcementForm.jenis = 'warning'" :class="[
                    'flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all text-sm font-medium',
                    announcementForm.jenis === 'warning'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300',
                  ]">
                    <UIcon name="i-lucide-triangle-alert" class="w-5 h-5" />
                    {{ $t("konfig_jenis_peringatan") }}
                  </button>
                </div>
              </div>
              <!-- Submit -->
              <div class="flex justify-end pt-1">
                <button v-if="isSuperadmin || hasPermission('konfigurasi', 'update')" @click="handleCreateAnnouncement" :disabled="!announcementForm.judul ||
                  !announcementForm.pesan ||
                  isCreatingMessage
                  "
                  class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <Megaphone class="w-4 h-4" />
                  {{
                    isCreatingMessage
                      ? $t("konfig_btn_menyimpan")
                      : $t("konfig_btn_buat")
                  }}
                </button>
              </div>
            </div>
          </div>

          <!-- Daftar pengumuman -->
          <div class="p-6 space-y-4">
            <!-- Loading -->
            <div v-if="isLoadingMessage" class="py-12 text-center">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                {{ $t("konfig_loading") }}
              </p>
            </div>

            <!-- Empty -->
            <div v-else-if="messageList.length === 0" class="py-12 text-center">
              <UIcon name="i-lucide-megaphone-off" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                {{ $t("konfig_empty") }}
              </p>
            </div>

            <!-- Card tiap pengumuman -->
            <div v-for="(item, index) in messageList" :key="item.id"
              class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <!-- Toggle row -->
              <div
                class="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white">
                    {{ $t("konfig_aktifkan_title") }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ $t("konfig_aktifkan_desc") }}
                  </p>
                </div>
                <button type="button" @click="handleToggleBanner(item.id)" :disabled="isTogglingBanner === item.id"
                  :class="[
                    'relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    item.showBanner
                      ? 'bg-primary'
                      : 'bg-gray-200 dark:bg-gray-600',
                  ]">
                  <span :class="[
                    'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                    item.showBanner ? 'translate-x-6' : 'translate-x-0',
                  ]" />
                </button>
              </div>

              <!-- Preview row -->
              <div class="px-5 py-4 bg-white dark:bg-gray-800">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                      <span class="text-sm font-bold text-primary-600 dark:text-primary-400">{{ index + 1 }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-800 dark:text-white">
                        {{ $t("konfig_preview_label") }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ $t("konfig_preview_desc") }}
                      </p>
                    </div>
                  </div>
                  <div v-if="isSuperadmin || hasPermission('konfigurasi', 'update')" class="flex items-center gap-1">
                    <button @click="openEditModal(item)"
                      class="p-1.5 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950 rounded-md transition-colors">
                      <UIcon name="i-lucide-pencil" class="w-4 h-4" />
                    </button>
                    <button @click="openDeleteConfirm(item)"
                      class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors">
                      <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Banner preview -->
                <div :class="[
                  'flex items-start gap-3 p-4 mt-5 rounded-xl border',
                  item.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
                ]">
                  <UIcon :name="item.type === 'warning'
                    ? 'i-lucide-triangle-alert'
                    : 'i-lucide-info'
                    " :class="[
                      'w-5 h-5 flex-shrink-0 mt-0.5',
                      item.type === 'warning'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-blue-600 dark:text-blue-400',
                    ]" />
                  <div class="flex-1 min-w-0">
                    <p :class="[
                      'text-sm font-semibold mb-0.5',
                      item.type === 'warning'
                        ? 'text-yellow-800 dark:text-yellow-200'
                        : 'text-blue-800 dark:text-blue-200',
                    ]">
                      {{ item.title }}
                    </p>
                    <p :class="[
                      'text-sm leading-relaxed',
                      item.type === 'warning'
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-blue-700 dark:text-blue-300',
                    ]">
                      {{ item.message }}
                    </p>
                  </div>
                  <button :class="[
                    'flex-shrink-0 p-0.5 rounded',
                    item.type === 'warning'
                      ? 'text-yellow-500 hover:bg-yellow-100'
                      : 'text-blue-500 hover:bg-blue-100',
                  ]">
                    <UIcon name="i-lucide-x" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===================== TAB: UNIT TU ===================== -->
        <div v-if="activeTab === 'unit-tu'">
          <!-- Komponen Unit TU (CRUD assignment organization_tu) -->
          <UnitTuTab />

          <!-- Pindah Profile Unit Dokumen (hanya untuk user dengan delegasi unit_dokumen) -->
          <div class="p-6">
            <PindahProfileCard
              v-if="hasUnitDokumenDelegation"
              profile-value="unit_dokumen"
              profile-label="Unit Dokumen"
              profile-badge="Unit Dokumen"
              profile-description="Beralih ke profile Unit Dokumen"
            />
          </div>
        </div>

        <!-- ===================== TAB: UNIT LEGAL ===================== -->
        <div v-if="activeTab === 'unit-legal'">
          <UnitLegalTab />
        </div>

        <!-- ===================== TAB: NASKAH LAINNYA ===================== -->
        <div v-if="activeTab === 'naskah-lainnya'">
          <NaskahLainnyaTab />
        </div>

        <!-- ===================== TAB: GRUP PENERIMA ===================== -->
        <div v-if="activeTab === 'grup-penerima'">
          <GrupPenerimaTab />
        </div>

        <!-- ===================== TAB: SEARCH ENGINE ===================== -->
        <div v-if="activeTab === 'search'" class="p-6">
          <Heading variant="heading9sb" class="text-mobile-md">
            {{ $t("konfig_search_title") }}
          </Heading>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-7 mt-1">
            {{ $t("konfig_search_desc") }}
          </p>

          <div v-if="isLoadingSearchConfig" class="space-y-3">
            <div v-for="i in 2" :key="i"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-5 rounded-xl border border-gray-200 dark:border-gray-700">
              <div class="space-y-2">
                <USkeleton class="h-4 w-40 rounded" />
                <USkeleton class="h-3 w-56 rounded" />
              </div>
              <USkeleton class="h-9 w-full sm:w-[380px] rounded-lg shrink-0" />
            </div>
          </div>

          <div v-else class="space-y-3">
            <!-- Mode V3 (SQL) -->
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700/50 transition-colors">
              <div class="flex items-start gap-3">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                  <UIcon name="i-lucide-database" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </span>
                <div>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white">
                    {{ $t("konfig_search_v3_title") }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ $t("konfig_search_v3_desc") }}
                  </p>
                </div>
              </div>
              <button type="button" @click="handleSetSearchMode('v3')" :disabled="isSavingSearchConfig"
                :class="[
                  'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all shrink-0',
                  searchConfig?.mode === 'v3'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                ]">
                <UIcon :name="searchConfig?.mode === 'v3' ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
                  class="w-4 h-4" />
                {{ searchConfig?.mode === 'v3' ? $t("konfig_search_aktif") : $t("konfig_search_pilih") }}
              </button>
            </div>

            <!-- Mode Meilisearch -->
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700/50 transition-colors">
              <div class="flex items-start gap-3">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                  <UIcon name="i-lucide-search" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </span>
                <div>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white">
                    {{ $t("konfig_search_meili_title") }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ $t("konfig_search_meili_desc") }}
                  </p>
                </div>
              </div>
              <button type="button" @click="handleSetSearchMode('meili')" :disabled="isSavingSearchConfig"
                :class="[
                  'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all shrink-0',
                  searchConfig?.mode === 'meili'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                ]">
                <UIcon :name="searchConfig?.mode === 'meili' ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
                  class="w-4 h-4" />
                {{ searchConfig?.mode === 'meili' ? $t("konfig_search_aktif") : $t("konfig_search_pilih") }}
              </button>
            </div>
          </div>

          <div
            class="mt-6 flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-100 dark:border-primary-900">
            <UIcon name="i-lucide-info" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
            <div class="text-sm text-primary-800 dark:text-primary-200 leading-relaxed">
              <span class="font-semibold block mb-1">Informasi</span>
              <p>
                {{ $t("konfig_search_info") }}
              </p>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'routing'"><CorrespondenceRoutingTab /></div>
      </div>
    </div>

    <!-- MODAL EDIT -->
    <Teleport to="body">
      <Modal v-model="showEditModal" size="xl" @save="handleSaveEdit">
        <template #title>
          <div class="p-3 ml-2 mt-2">
            <h3 class="text-xl font-bold dark:text-white">
              {{ $t("konfig_modal_edit_title") }}
            </h3>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t("konfig_edit_judul") }} <span class="text-red-500">*</span>
            </label>
            <input v-model="editForm.judul" type="text" :placeholder="$t('konfig_edit_judul_placeholder')"
              class="mt-1 mb-2 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t("konfig_edit_pesan") }} <span class="text-red-500">*</span>
            </label>
            <textarea v-model="editForm.pesan" rows="4" :placeholder="$t('konfig_edit_pesan_placeholder')"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t("konfig_edit_jenis") }}
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button @click="editForm.jenis = 'info'" :class="[
                'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-medium',
                editForm.jenis === 'info'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
              ]">
                <UIcon name="i-lucide-info" class="w-4 h-4" />
                {{ $t("konfig_jenis_info") }}
              </button>
              <button @click="editForm.jenis = 'warning'" :class="[
                'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-medium',
                editForm.jenis === 'warning'
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
              ]">
                <UIcon name="i-lucide-triangle-alert" class="w-4 h-4" />
                {{ $t("konfig_jenis_peringatan") }}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- CONFIRM DELETE -->
    <ConfirmPopup v-model="showDeleteModal" type="danger" :title="$t('konfig_hapus_title')"
      :message="`${deleteMessagePrefix}&quot;${messageToDelete?.title}&quot;? ${deleteMessageSuffix}`"
      :confirm-text="$t('konfig_hapus_confirm')" :cancel-text="$t('konfig_hapus_batal')" :is-loading="isDeletingMessage"
      @confirm="handleDeleteMessage" @cancel="showDeleteModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Megaphone } from "lucide-vue-next";
import { useKonfigurasi } from "@/composables/useKonfigurasi";
import { Alert } from "@/composables/useAlert";
import type { KonfigurasiMessageItem } from "@/types/konfigurasi";

definePageMeta({ middleware: "auth" });

const { t } = useI18n();

const { hasPermission, isSuperadmin, user } = useAuth();
const { checkUser } = useOrganizationTu();

const canViewKonfigurasi = computed(() => hasPermission('konfigurasi', 'read'));

// Deteksi delegasi unit_dokumen.
// Prioritas: dari JWT tuRoles (cepat), fallback: query endpoint check-user (akurat).
const hasUnitDokumenDelegation = ref(false);

const detectUnitDokumenDelegation = async () => {
  if (!user.value?.persnum) return;
  // 1. Cek dari JWT tuRoles dulu (jika sudah ada).
  const roles = user.value?.tuRoles;
  if (Array.isArray(roles) && roles.includes('tu')) {
    hasUnitDokumenDelegation.value = true;
    return;
  }
  // 2. Fallback: query endpoint check-user untuk akurasi (JWT lama belum punya tuRoles).
  try {
    const result = await checkUser(user.value.persnum);
    if (result?.has_unit_dokumen) {
      hasUnitDokumenDelegation.value = true;
    }
  } catch (e) {
    console.error('[konfigurasi-sistem] detectUnitDokumenDelegation error:', e);
  }
};

onMounted(() => {
  fetchDigsig();
  fetchMessages(true);
  fetchSearchConfig();
  detectUnitDokumenDelegation();

  // Inisialisasi indikator scroll tab bar.
  nextTick(updateScrollState);
  window.addEventListener("resize", updateScrollState);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateScrollState);
});

// Re-detect saat user value berubah (mis. setelah getProfile selesai).
watch(() => user.value?.persnum, (newPersnum) => {
  if (newPersnum) detectUnitDokumenDelegation();
});

// ─── Computed breadcrumbs (locale-reactive) ───────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t("beranda"), to: "/beranda" },
  { label: t("konfig_title"), to: "/konfigurasi-sistem" },
]);

// Computed delete message parts for ConfirmPopup interpolation
const deleteMessagePrefix = computed(() =>
  t("locale") === "id"
    ? "Apakah Anda yakin ingin menghapus pengumuman "
    : "Are you sure you want to delete announcement ",
);
const deleteMessageSuffix = computed(() =>
  t("locale") === "id"
    ? "Tindakan ini tidak dapat dibatalkan."
    : "This action cannot be undone.",
);

const activeTab = ref("digsig");

// ================================
// TAB MENU
// ================================
interface KonfigTab {
  value: string;
  label: string;
  icon: string;
}

// Daftar tab data-driven: mudah ditambah dan otomatis menghormati izin akses.
const tabs = computed<KonfigTab[]>(() => {
  const list: KonfigTab[] = [
    { value: "digsig", label: t("konfig_tab_digsig"), icon: "i-lucide-shield-check" },
    { value: "pengumuman", label: t("konfig_tab_pengumuman"), icon: "i-lucide-megaphone" },
    { value: "unit-tu", label: "Unit TU", icon: "i-lucide-archive" },
    { value: "unit-legal", label: "Unit Legal", icon: "i-lucide-scale" },
    { value: "naskah-lainnya", label: "Naskah Lainnya", icon: "i-lucide-files" },
    { value: "search", label: t("konfig_tab_search"), icon: "i-lucide-search" },
  ];

  if (isSuperadmin.value || hasPermission("correspondence-routing", "read")) {
    list.push({ value: "routing", label: "Routing Persuratan", icon: "i-lucide-route" });
  }

  if (isSuperadmin.value || hasPermission("master-data", "update-grup-penerima")) {
    list.push({ value: "grup-penerima", label: "Grup Penerima", icon: "i-lucide-users" });
  }

  return list;
});

// ─── Scroll state untuk tab bar ─────────────────────────────────────────────
const tabScrollRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

const updateScrollState = () => {
  const el = tabScrollRef.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 8;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 8;
};

const scrollTabsBy = (direction: 1 | -1) => {
  const el = tabScrollRef.value;
  if (!el) return;
  el.scrollBy({
    left: direction * Math.max(Math.round(el.clientWidth * 0.7), 240),
    behavior: "smooth",
  });
};

// Navigasi keyboard: panah kiri/kanan berpindah tab (roving tabindex).
const handleTabKeydown = (e: KeyboardEvent) => {
  const values = tabs.value.map((tab) => tab.value);
  const currentIndex = values.indexOf(activeTab.value);
  if (currentIndex === -1) return;

  let nextIndex: number;
  if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % values.length;
  else if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + values.length) % values.length;
  else return;

  e.preventDefault();
  const target = values[nextIndex];
  activeTab.value = target;
  nextTick(() => {
    tabScrollRef.value
      ?.querySelector<HTMLButtonElement>(`[data-tab="${target}"]`)
      ?.focus();
  });
};

// Tab aktif otomatis digeser agar tetap terlihat saat berganti.
watch(activeTab, async () => {
  await nextTick();
  tabScrollRef.value
    ?.querySelector(`[data-tab="${activeTab.value}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
});

// Lebar label bisa berubah (locale/izin akses) → segarkan indikator scroll.
watch(tabs, () => {
  nextTick(updateScrollState);
});

// ================================
// COMPOSABLE
// ================================
const {
  digsigList,
  isLoading,
  isToggling,
  fetchDigsig,
  toggleDigsig,
  messageList,
  isLoadingMessage,
  isCreatingMessage,
  isUpdatingMessage,
  isDeletingMessage,
  isTogglingBanner,
  fetchMessages,
  createMessage,
  updateMessage,
  toggleBanner,
  deleteMessage,
  searchConfig,
  isLoadingSearchConfig,
  isSavingSearchConfig,
  fetchSearchConfig,
  updateSearchConfig,
  showToastSaveDigsig,
} = useKonfigurasi();

const isSavingDigsig = ref(false);
const saveDigsig = async () => {
  isSavingDigsig.value = true;
  try {
    await new Promise((r) => setTimeout(r, 800));
    showToastSaveDigsig();
  } finally {
    isSavingDigsig.value = false;
  }
};

// ================================
// SEARCH ENGINE - Mode Handler
// ================================
const handleSetSearchMode = async (mode: "v3" | "meili") => {
  if (isSavingSearchConfig.value) return;
  await updateSearchConfig({ mode });
};

// ================================
// DIGSIG - Dropdown Options
// ================================
const signOptions = [
  { label: 'Digsig', value: 'digsig' },
  { label: 'TTD QR', value: 'qr' },
  { label: 'TTD Basah', value: 'basah' },
  { label: 'Semua', value: 'semua' },
]

const getAvailableOptions = (_doc: any) => {
  return signOptions
}

const fieldMap: Record<string, string> = {
  digsig: 'digsig',
  qr: 'ttdQr',
  basah: 'ttdBasah',
}

const isAllSelected = (doc: any) => {
  return !!doc.digsig && !!doc.ttdQr && !!doc.ttdBasah
}

const isSelected = (doc: any, value: string) => {
  if (value === 'semua') return isAllSelected(doc)
  // Jika semua aktif, hanya tampilkan "Semua" yang highlight — yang lain tidak
  if (isAllSelected(doc)) return false
  const field = fieldMap[value]
  return field ? !!doc[field] : false
}

const handleChangeSignType = async (doc: any, value: string) => {
  if (isToggling.value === doc.jenisNaskah) return

  const prev = { digsig: doc.digsig, ttdQr: doc.ttdQr, ttdBasah: doc.ttdBasah }

  if (value === 'semua') {
    const allOn = isAllSelected(doc)
    // ✅ Jika semua sudah aktif, tolak — tidak boleh unselect semua
    if (allOn) {
      useToast().add({
        title: 'Tidak Diizinkan',
        description: 'Minimal satu metode tanda tangan harus aktif.',
        color: 'warning',
      })
      return
    }
    // Jika belum semua aktif, aktifkan semua
    doc.digsig = true
    doc.ttdQr = true
    doc.ttdBasah = true
  } else {
    const field = fieldMap[value]
    if (!field) return

    if (isAllSelected(doc)) {
      doc.digsig = false
      doc.ttdQr = false
      doc.ttdBasah = false
      doc[field] = true
    } else {
      const activeCount = [doc.digsig, doc.ttdQr, doc.ttdBasah].filter(Boolean).length
      if (activeCount <= 1 && doc[field]) {
        useToast().add({
          title: 'Tidak Diizinkan',
          description: 'Minimal satu metode tanda tangan harus aktif.',
          color: 'warning',
        })
        return
      }
      doc[field] = !doc[field]
    }
  }

  const willBeAllOn = isAllSelected(doc)

  try {
    await toggleDigsig(doc.jenisNaskah, {
      digsig: doc.digsig,
      ttd_qr: doc.ttdQr,
      ttd_basah: doc.ttdBasah,
    })

    useToast().add({
      title: 'Berhasil',
      description: `Konfigurasi tanda tangan ${doc.description} berhasil diperbarui.`,
      color: 'success',
    })

    if (willBeAllOn) {
      await Alert.warning(
        'Semua Metode Aktif',
        `Semua metode tanda tangan untuk <strong>${doc.description}</strong> kini diaktifkan.`
      )
      Alert.close()
    }

  } catch (error) {
    doc.digsig = prev.digsig
    doc.ttdQr = prev.ttdQr
    doc.ttdBasah = prev.ttdBasah

    useToast().add({
      title: 'Gagal',
      description: `Gagal memperbarui konfigurasi tanda tangan ${doc.description}.`,
      color: 'error',
    })
  }
}

// ================================
// PENGUMUMAN — form state
// ================================
const announcementForm = reactive({
  judul: "",
  pesan: "",
  jenis: "info" as "info" | "warning" | "success",
});

const handleCreateAnnouncement = async () => {
  if (!announcementForm.judul || !announcementForm.pesan) return;
  const ok = await createMessage({
    title: announcementForm.judul,
    message: announcementForm.pesan,
    type: announcementForm.jenis,
    show_banner: true,
  });
  if (ok) {
    announcementForm.judul = "";
    announcementForm.pesan = "";
    announcementForm.jenis = "info";
  }
};

const handleToggleBanner = async (id: string) => {
  await toggleBanner(id);
};

// ================================
// EDIT
// ================================
const showEditModal = ref(false);
const editTarget = ref<KonfigurasiMessageItem | null>(null);
const editForm = reactive({
  judul: "",
  pesan: "",
  jenis: "info" as "info" | "warning" | "success",
});

const openEditModal = (item: KonfigurasiMessageItem) => {
  editTarget.value = item;
  editForm.judul = item.title;
  editForm.pesan = item.message;
  editForm.jenis = item.type;
  showEditModal.value = true;
};

const handleSaveEdit = async () => {
  if (!editForm.judul || !editForm.pesan || !editTarget.value) return;
  const ok = await updateMessage(editTarget.value.id, {
    title: editForm.judul,
    message: editForm.pesan,
    type: editForm.jenis,
    show_banner: editTarget.value.showBanner,
  });
  if (ok) {
    showEditModal.value = false;
    editTarget.value = null;
  }
};

// ================================
// DELETE
// ================================
const showDeleteModal = ref(false);
const messageToDelete = ref<KonfigurasiMessageItem | null>(null);

const openDeleteConfirm = (item: KonfigurasiMessageItem) => {
  messageToDelete.value = item;
  showDeleteModal.value = true;
};

const handleDeleteMessage = async () => {
  if (!messageToDelete.value) return;
  const ok = await deleteMessage(messageToDelete.value.id);
  if (ok) {
    showDeleteModal.value = false;
    messageToDelete.value = null;
  }
};
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
