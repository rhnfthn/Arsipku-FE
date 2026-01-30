<template>
  <nav
    class="bg-[#F6F8FC] dark:bg-gray-900 dark:border-gray-800 h-20 flex items-center transition-colors duration-300 gap-3 md:gap-5 justify-between sticky top-0 z-[50] relative">

    <div class="flex items-center gap-3 flex-1">
      <button
        class="md:hidden me-2 mt-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        @click="$emit('open-mobile-sidebar')">
        <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
      </button>

      <h1 class="font-bold text-xl tracking-tight text-neutral-900 dark:text-white md:hidden">
        ArsipKu
      </h1>

      <div v-if="searchConfig.show" class="hidden md:block w-full max-w-3xl relative z-[60]">

        <Teleport to="body">
          <div v-if="isAdvancedOpen" @click="isAdvancedOpen = false"
            class="fixed inset-0 z-[1] bg-black/50 backdrop-blur-sm transition-all duration-300">
          </div>
        </Teleport>


        <UInput v-model="search" :placeholder="searchConfig.placeholder" variant="none" size="xl"
          class="w-full rounded-full relative bg-transparent [&>input]:placeholder-gray-500 [&>input]:dark:placeholder-gray-400 z-[90]"
          @keyup.enter="handleSearch" :ui="{
            base: 'py-3 px-5 bg-primary-50/80 dark:bg-gray-800 rounded-full focus:bg-white focus:shadow-md dark:focus:bg-gray-700 transition-all',
            icon: { trailing: { pointer: 'pointer-events-auto cursor-pointer' } },
            trailing: { padding: { xl: 'pr-2' } }
          }">

          <template #leading>
            <UIcon name="i-heroicons-magnifying-glass" class="text-gray-400 dark:text-gray-500 w-5 h-5" />
          </template>

          <template #trailing>
            <div class="flex items-center">
              <UButton v-if="search" variant="ghost" color="gray" icon="i-heroicons-x-mark" :padded="false"
                @click="handleReset" class="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-8 h-8" />

              <UButton variant="ghost" color="gray" icon="i-heroicons-adjustments-horizontal" :padded="false"
                @click="isAdvancedOpen = !isAdvancedOpen"
                class="hover:bg-gray-200 dark:hover:bg-gray-700 text-primary-600 rounded-full w-10 h-10 transition-colors items-center justify-center"
                :class="{ 'bg-gray-200 dark:bg-gray-700 text-primary': isAdvancedOpen }" title="Pencarian Lanjutan" />
            </div>
          </template>
        </UInput>

        <div v-if="isAdvancedOpen"
          class="absolute top-full right-0 mt-2 w-full bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
            <h3 class="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UIcon name="i-heroicons-adjustments-horizontal" class="w-5 h-5 text-primary-600" />
              Filter Pencarian Lanjutan
            </h3>
            <button @click="isAdvancedOpen = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>

          <div class="px-6 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nomor Surat</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UIcon name="i-heroicons-hashtag" class="w-4 h-4 text-gray-400" />
                  </div>
                  <input type="text" v-model="advancedFilters.nomorSurat" placeholder="001/ADM/..."
                    class="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Perihal</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-gray-400" />
                  </div>
                  <input type="text" v-model="advancedFilters.perihal" placeholder="Isi perihal..."
                    class="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pengirim</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UIcon name="i-heroicons-user" class="w-4 h-4 text-gray-400" />
                  </div>
                  <input type="text" v-model="advancedFilters.pengirim" placeholder="Nama pengirim..."
                    class="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Penerima</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-gray-400" />
                  </div>
                  <input type="text" v-model="advancedFilters.penerima" placeholder="Nama penerima..."
                    class="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Jenis Surat</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="opt in jenisOptions" :key="opt.value"
                  @click="advancedFilters.jenis = advancedFilters.jenis === opt.value ? '' : opt.value" :class="[
                    'px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200',
                    getCategoryStyle(opt.value),
                    advancedFilters.jenis === opt.value
                      ? 'ring-2 ring-offset-1 ring-current border-transparent font-bold shadow-sm'
                      : 'border-transparent opacity-70 hover:opacity-100 grayscale-[0.2] hover:grayscale-0'
                  ]">
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sifat</label>
                <div class="relative">
                  <select v-model="advancedFilters.sifat"
                    class="appearance-none w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow cursor-pointer">
                    <option value="" disabled selected>Pilih Sifat</option>
                    <option v-for="opt in sifatOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-500">
                    <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                <div class="relative">
                  <select v-model="advancedFilters.status"
                    class="appearance-none w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow cursor-pointer">
                    <option value="" disabled selected>Pilih Status</option>
                    <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-500">
                    <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lampiran</label>
                <div class="relative">
                  <select v-model="advancedFilters.hasAttachment"
                    class="appearance-none w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow cursor-pointer">
                    <option value="" disabled selected>Semua</option>
                    <option v-for="opt in attachmentOptions" :key="opt.value" :value="opt.value">{{ opt.label }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-500">
                    <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rentang Tanggal</label>
                <div class="grid gap-3">
                  <div class="relative">
                    <span
                      class="absolute -top-2 left-2 px-1 bg-white dark:bg-gray-900 text-[10px] text-gray-400">Dari</span>
                    <input type="date" v-model="advancedFilters.dateFrom"
                      class="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div class="relative">
                    <span
                      class="absolute -top-2 left-2 px-1 bg-white dark:bg-gray-900 text-[10px] text-gray-400">Sampai</span>
                    <input type="date" v-model="advancedFilters.dateTo"
                      class="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kata Kunci</label>
                <div class="space-y-3">
                  <input type="text" v-model="advancedFilters.hasWords" placeholder="Berisi kata (include)..."
                    class="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                  <input type="text" v-model="advancedFilters.doesntHave" placeholder="Tidak berisi kata (exclude)..."
                    class="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>
          </div>

          <div
            class="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
            <button @click="resetAdvancedFilters"
              class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
              Reset Filter
            </button>

            <div class="flex gap-3">
              <button @click="isAdvancedOpen = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Batal
              </button>
              <button @click="handleAdvancedSearch"
                class="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4" />
                Terapkan
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>

    <div class="flex items-center gap-2 md:gap-5">

      <button @click="toggleMobileSearch"
        class="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-full transition-colors">
        <UIcon name="i-heroicons-magnifying-glass" class="w-6 h-6" />
      </button>

      <UDropdownMenu :items="menuItems" :content="{ align: 'end' }" :ui="{
        content: 'w-72 dark:bg-gray-900 dark:ring-gray-800',
        item: 'px-4 py-3',
        itemLabel: 'text-sm',
      }">
        <div class="flex items-center gap-3 cursor-pointer group">
          <div class="flex flex-col items-end text-right leading-tight">
            <span class="hidden md:block text-sm font-semibold text-gray-900 dark:text-gray-100 text-nowrap">
              {{ user?.nama }}
            </span>
            <UTooltip :text="user?.positionText" :popper="{ placement: 'bottom-end' }">
              <span
                class="hidden md:block text-[11px] font-medium text-gray-500 dark:text-gray-400 tracking-tight truncate max-w-[150px] lg:max-w-[200px]">
                {{ user?.positionText }}
              </span>
            </UTooltip>
          </div>
          <UAvatar size="md"
            class="ring-2 ring-transparent group-hover:ring-primary-500/50 transition-all bg-primary-400 text-white font-semibold flex items-center justify-center">
            {{ getInitials(user?.nama) }}
          </UAvatar>
        </div>

        <template #delegation-item="{ item }">
          <div class="flex items-center justify-between w-full gap-2 min-w-0">
            <div class="flex flex-col items-start min-w-0 w-full">
              <div class="flex items-center gap-2 max-w-full">
                <span class="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                  {{ item.uiName }}
                </span>
                <UBadge size="xs" variant="subtle" color="primary"
                  class="rounded px-1.5 py-0.5 text-[10px] shrink-0 font-medium capitalize">
                  {{ item.uiBadge }}
                </UBadge>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-left">
                {{ item.uiPosition }}
              </span>
            </div>
            <UIcon v-if="item.isActive" name="i-heroicons-check-circle-20-solid"
              class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
          </div>
        </template>
        <template #theme-label>
          <div class="flex items-center justify-between w-full px-3">
            <span class="text-sm text-gray-700 dark:text-gray-200">Tampilan</span>
            <div
              class="flex items-center p-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button @click="isDark = false" class="p-1 rounded-full transition-all flex items-center justify-center"
                :class="!isDark ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'">
                <UIcon name="i-heroicons-sun" class="w-4 h-4" />
              </button>
              <button @click="isDark = true" class="p-1 rounded-full transition-all flex items-center justify-center"
                :class="isDark ? 'bg-gray-700 text-yellow-300 shadow-sm' : 'text-gray-400 hover:text-gray-600'">
                <UIcon name="i-heroicons-moon" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </template>
        <template #lang-label>
          <div class="flex items-center justify-between w-full px-3">
            <span class="text-sm text-gray-700 dark:text-gray-200">Bahasa</span>
            <div
              class="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5 border border-gray-200 dark:border-gray-700">
              <UButton v-for="lang in locales" :key="lang.code" :label="lang.name" color="primary"
                :variant="currentLocale === lang.code ? 'solid' : 'ghost'" @click="setLocale(lang.code)"
                class="h-6 text-[10px] px-2" />
            </div>
          </div>
        </template>
      </UDropdownMenu>
    </div>

    <div v-if="isMobileSearchOpen"
      class="absolute top-20 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 z-40 md:hidden shadow-lg animate-in slide-in-from-top-2 max-h-[calc(100vh-5rem)] overflow-y-auto">

      <UInput v-model="search" :placeholder="searchConfig.placeholder" variant="outline" size="lg" class="w-full mb-2"
        @keyup.enter="handleSearch" :ui="{ icon: { trailing: { pointer: 'pointer-events-auto cursor-pointer' } } }">

        <template #leading>
          <UIcon name="i-heroicons-magnifying-glass" class="text-gray-400 dark:text-gray-500 w-5 h-5" />
        </template>

        <template #trailing>
          <div class="flex items-center gap-1">
            <UButton v-if="search" variant="ghost" color="gray" icon="i-heroicons-x-mark" :padded="false"
              @click="handleReset" class="hover:bg-gray-100 rounded-full w-7 h-7" />
            <UButton variant="ghost" color="gray" icon="i-heroicons-adjustments-horizontal" :padded="false"
              @click="isAdvancedOpen = !isAdvancedOpen"
              class="hover:bg-gray-100 text-primary-600 rounded-full w-8 h-8 transition-colors items-center justify-center"
              :class="{ 'bg-gray-100 text-primary': isAdvancedOpen }" />
          </div>
        </template>
      </UInput>

      <div v-if="isAdvancedOpen" class="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 pb-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-sm text-gray-900 dark:text-gray-100">Filter Lanjutan</h3>
          <button @click="resetAdvancedFilters"
            class="text-xs text-primary-600 hover:text-primary-700 font-medium">Reset</button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nomor Surat</label>
              <input type="text" v-model="advancedFilters.nomorSurat" placeholder="001/..."
                class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Perihal</label>
              <input type="text" v-model="advancedFilters.perihal" placeholder="Perihal..."
                class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Jenis Surat</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="opt in jenisOptions" :key="opt.value"
                @click="advancedFilters.jenis = advancedFilters.jenis === opt.value ? '' : opt.value" :class="[
                  'px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200',
                  getCategoryStyle(opt.value),
                  advancedFilters.jenis === opt.value
                    ? 'ring-2 ring-offset-1 ring-current border-transparent font-bold shadow-sm'
                    : 'border-transparent opacity-70 hover:opacity-100 grayscale-[0.2] hover:grayscale-0'
                ]">
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pengirim</label>
              <input type="text" v-model="advancedFilters.pengirim"
                class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Penerima</label>
              <input type="text" v-model="advancedFilters.penerima"
                class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sifat</label>
              <select v-model="advancedFilters.sifat"
                class="appearance-none w-full px-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                <option value="" disabled selected>Pilih Sifat</option>
                <option v-for="opt in sifatOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select v-model="advancedFilters.status"
                class="appearance-none w-full px-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                <option value="" disabled selected>Pilih Status</option>
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rentang Tanggal</label>
            <div class="grid grid-cols-2 gap-2">
              <input type="date" v-model="advancedFilters.dateFrom"
                class="w-full px-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
              <input type="date" v-model="advancedFilters.dateTo"
                class="w-full px-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            </div>
          </div>

          <div class="flex gap-2 pt-2">
            <button @click="isAdvancedOpen = false"
              class="flex-1 py-2 text-sm text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded-lg">Batal</button>
            <button @click="handleAdvancedSearch"
              class="flex-1 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-bold">Cari</button>
          </div>
        </div>
      </div>
    </div>

  </nav>

  <ConfirmPopup v-model="showLogoutPopup" type="warning" title="Keluar dari akun?"
    message="Anda akan keluar dari sistem. Pastikan semua pekerjaan sudah disimpan." confirmText="Keluar"
    cancelText="Batal" :isLoading="isLoggingOut" @confirm="confirmLogout" @cancel="showLogoutPopup = false" />

  <LoadingOverlay :loading="isSwitching" :message="switchingMessage" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDark } from "@vueuse/core";
import type { DropdownMenuItem } from "#ui/types";

// --- INIT COMPOSABLES ---
const { user, getProfile, logout } = useAuth();
const { getAvailableRoles, switchRole } = useDelegasi();
const toast = useToast();
const route = useRoute();
const router = useRouter();

// --- STATE BARU ---
const isMobileSearchOpen = ref(false); // State untuk toggle tampilan search mobile

// Toggle Mobile Search
const toggleMobileSearch = () => {
  isMobileSearchOpen.value = !isMobileSearchOpen.value;
  // Jika menutup mobile search, tutup juga advanced panelnya agar rapi saat dibuka kembali
  if (!isMobileSearchOpen.value) {
    isAdvancedOpen.value = false;
  }
};

// ... (LOGIC UTAMA) ...

// [MODIFIED] Logic Basic Search
const handleSearch = () => {
  if (!search.value.trim()) return;
  isAdvancedOpen.value = false;
  isMobileSearchOpen.value = false; // Close mobile wrapper too
  navigateTo({
    path: '/search',
    query: { keyword: search.value, page: 1 }
  });
};

// [MODIFIED] Logic Advanced Search - Mapping ke Params API
const handleAdvancedSearch = () => {
  // 1. Definisikan Default Pagination & Sorting
  const queryParams: any = {
    page: 1,
    limit: 20,
    sortBy: 'tanggal',
    sortOrder: 'DESC'
  };

  // 2. Mapping Keyword Global
  if (search.value) {
    queryParams.keyword = search.value;
  }

  // 3. Mapping Advanced Filters ke API Params
  // Format UI (advancedFilters) -> Format API (queryParams)
  if (advancedFilters.nomorSurat) queryParams.nomor = advancedFilters.nomorSurat;
  if (advancedFilters.perihal) queryParams.perihal = advancedFilters.perihal;
  if (advancedFilters.jenis) queryParams.jenis = advancedFilters.jenis;
  if (advancedFilters.sifat) queryParams.sifat = advancedFilters.sifat;
  if (advancedFilters.status) queryParams.status = advancedFilters.status;

  // Mapping 'pengirim' -> 'from'
  if (advancedFilters.pengirim) queryParams.from = advancedFilters.pengirim;

  // Mapping 'penerima' -> 'to'
  if (advancedFilters.penerima) queryParams.to = advancedFilters.penerima;

  if (advancedFilters.dateFrom) queryParams.dateFrom = advancedFilters.dateFrom;
  if (advancedFilters.dateTo) queryParams.dateTo = advancedFilters.dateTo;
  if (advancedFilters.hasWords) queryParams.hasWords = advancedFilters.hasWords;
  if (advancedFilters.doesntHave) queryParams.doesntHave = advancedFilters.doesntHave;

  // 4. Handle Logic Lampiran (Convert "Semua" -> remove, "true"/"false" boolean/string)
  if (advancedFilters.hasAttachment !== "Semua" && advancedFilters.hasAttachment !== null) {
    queryParams.hasAttachment = advancedFilters.hasAttachment;
  }

  // 5. Tutup Panel UI
  isAdvancedOpen.value = false;
  isMobileSearchOpen.value = false;

  console.log("Navigating with params:", queryParams);

  // 6. Navigasi ke Halaman Search
  navigateTo({
    path: '/search',
    query: queryParams
  });
};

const showLogoutPopup = ref(false);
const isLoggingOut = ref(false);
const search = ref("");
const delegationRoles = ref<any[]>([]);
const switchingMessage = ref("");
const isAdvancedOpen = ref(false);

// [MODIFIED] Reactive object disesuaikan dengan v-model di template
// (nama property harus sama persis dengan yang ada di v-model HTML)
const advancedFilters = reactive({
  nomorSurat: "",
  perihal: "",
  pengirim: "",
  penerima: "",
  hasWords: "",
  doesntHave: "",
  dateFrom: "",
  dateTo: "",
  jenis: null,
  sifat: null,
  status: null,
  hasAttachment: "Semua"
});

const jenisOptions = [
  { label: 'Semua', value: null },
  { label: 'Nota Dinas (ND)', value: 'ND' },
  { label: 'Surat Dinas Internal (SDI)', value: 'SDI' },
  { label: 'Surat Dinas Eksternal (SDE)', value: 'SDE' },
  { label: 'Disposisi (DI)', value: 'DI' },
  { label: 'Kajian (KA)', value: 'KA' },
  { label: 'Keputusan (K)', value: 'K' }
];

const sifatOptions = [
  { label: 'Semua', value: null },
  { label: 'Biasa', value: 'biasa' },
  { label: 'Terbatas', value: 'terbatas' },
  { label: 'Rahasia', value: 'rahasia' },
  { label: 'Sangat Rahasia', value: 'sangat_rahasia' },
  { label: 'Terbuka', value: 'terbuka' }
];

const statusOptions = [
  { label: 'Semua', value: null },
  { label: 'Draf', value: 'draf' },
  { label: 'Final', value: 'final' },
  { label: 'Final TTE', value: 'final_tte' }
];

const attachmentOptions = [
  { label: 'Semua', value: "Semua" },
  { label: 'Ya', value: true },
  { label: 'Tidak', value: false }
];

const getStoredOriginalRole = () => process.client ? localStorage.getItem('arsipku_original_position') : null;
const originalRoleLabel = ref(getStoredOriginalRole() || "Posisi Utama");
const activeDelegationId = ref<string | null>(null);

const initActiveState = () => {
  if (process.client) {
    activeDelegationId.value = localStorage.getItem('arsipku_active_delegation_id');
  }
};

watch(user, (newUser) => {
  if (newUser) {
    fetchDelegationRoles();
    if (!activeDelegationId.value) {
      originalRoleLabel.value = newUser.positionText;
      if (process.client) localStorage.setItem('arsipku_original_position', newUser.positionText);
    }
    else if (process.client) {
      const stored = localStorage.getItem('arsipku_original_position');
      if (stored) originalRoleLabel.value = stored;
    }
  }
}, { immediate: true });

const fetchDelegationRoles = async () => {
  if (!user.value) return;
  try {
    const roles = await getAvailableRoles();
    delegationRoles.value = roles || [];
  } catch (e) {
    console.error("Error fetch roles", e);
  }
};

const isSwitching = ref(false);

const handleSwitchRole = async (target: { type: 'delegasi' | 'reset', id?: string }) => {
  if (isSwitching.value) return;
  if (target.type === 'delegasi') {
    switchingMessage.value = "Mengalihkan ke Akun Delegasi...";
  } else {
    switchingMessage.value = "Kembali ke Akun Utama...";
  }
  isSwitching.value = true;
  try {
    let payload = {};
    if (target.type === 'delegasi' && target.id) {
      payload = { delegasiId: target.id };
    } else {
      payload = { resetToOriginal: true };
    }
    const res = await switchRole(payload);
    if (res?.success) {
      if (target.type === 'delegasi' && target.id) {
        localStorage.setItem('arsipku_active_delegation_id', target.id);
        if (res.data?.user?.role) {
          localStorage.setItem('arsipku_active_delegation_role', res.data.user.role);
        }
      } else {
        localStorage.removeItem('arsipku_active_delegation_id');
        localStorage.removeItem('arsipku_active_delegation_role');
      }
      localStorage.setItem('switch_role_message', res.message || 'Berhasil mengganti role.');
      window.location.reload();
    } else {
      isSwitching.value = false;
    }
  } catch (error) {
    console.error("Gagal ganti role:", error);
    toast.add({ title: 'Gagal', description: 'Gagal mengganti role.', color: 'red' });
    isSwitching.value = false;
  }
};

const confirmLogout = async () => {
  if (process.client) {
    localStorage.removeItem('arsipku_original_position');
    localStorage.removeItem('arsipku_active_delegation_id');
    localStorage.removeItem('arsipku_active_delegation_role');
  }
  isLoggingOut.value = true;
  await logout();
  isLoggingOut.value = false;
  showLogoutPopup.value = false;
  navigateTo("/");
};

const searchConfig = computed(() => ({ show: true, placeholder: "Cari surat...", key: "" }));

// [MODIFIED] Reset semua property reactive advancedFilters
const resetAdvancedFilters = () => {
  advancedFilters.nomorSurat = "";
  advancedFilters.perihal = "";
  advancedFilters.pengirim = "";
  advancedFilters.penerima = "";
  advancedFilters.hasWords = "";
  advancedFilters.doesntHave = "";
  advancedFilters.dateFrom = "";
  advancedFilters.dateTo = "";
  advancedFilters.jenis = null;
  advancedFilters.sifat = null;
  advancedFilters.status = null;
  advancedFilters.hasAttachment = "Semua";
  search.value = "";
};

const handleReset = () => {
  search.value = "";
  router.push({ path: "/beranda", query: {} });
};

const isDark = useDark();
const currentLocale = ref("id");
const locales = [{ code: "id", name: "ID" }, { code: "en", name: "EN" }];
const setLocale = (code: string) => (currentLocale.value = code);

const itemClass = "text-sm truncate transition-colors cursor-pointer";

const menuItems = computed<DropdownMenuItem[][]>(() => {
  const currentId = activeDelegationId.value;
  const isMainAccountActive = !currentId;
  const hasDelegationData = delegationRoles.value && delegationRoles.value.length > 0;

  const mainAccountItem = {
    uiName: user.value?.nama || 'User',
    uiBadge: user.value?.role,
    uiPosition: originalRoleLabel.value,
    label: originalRoleLabel.value,
    slot: 'delegation-item',
    isActive: isMainAccountActive,
    disabled: !hasDelegationData,
    click: hasDelegationData ? () => handleSwitchRole({ type: 'reset' }) : undefined,
    onSelect: hasDelegationData ? () => handleSwitchRole({ type: 'reset' }) : undefined
  };

  const delegasiItems = delegationRoles.value.map(role => {
    return {
      uiName: role.delegator_name || 'Empty Name',
      uiBadge: role.position_status_label,
      uiPosition: role.position_text,
      label: role.position_text,
      slot: 'delegation-item',
      isActive: currentId === role.id,
      click: () => handleSwitchRole({ type: 'delegasi', id: role.id }),
      onSelect: () => handleSwitchRole({ type: 'delegasi', id: role.id })
    };
  });

  const roleGroup = [mainAccountItem, ...delegasiItems];

  return [
    roleGroup,
    [
      { label: "Setting Notif Email", class: itemClass },
      { label: "Visualisasi Digsig (Visible)", class: itemClass },
      { label: "Setting Temporary File", class: itemClass },
    ],
    [{ slot: "theme-label", type: "label" }],
    [{ slot: "lang-label", type: "label" }],
    [{ label: "Keluar", class: "text-sm text-error", onSelect: () => openLogoutPopup() }],
  ];
});

onMounted(() => {
  if (process.client) {
    initActiveState();
    const successMsg = localStorage.getItem('switch_role_message');
    if (successMsg) {
      toast.add({ title: 'Berhasil', description: successMsg, icon: 'i-heroicons-check-circle', color: 'green' });
      localStorage.removeItem('switch_role_message');
    }
  }
  if (!user.value) getProfile();
});

const openLogoutPopup = () => { showLogoutPopup.value = true; };

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

defineEmits(["open-mobile-sidebar"]);

const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS'].includes(c)) return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300';
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c)) return 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300';
  if (['SDE', 'SURAT DINAS EKSTERNAL'].includes(c)) return 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300';
  if (['KAJIAN', 'KA'].includes(c)) return 'bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300';
  return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
};
</script>

<style scoped>
/* Custom scrollbar untuk form advanced search */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #374151;
}
</style>
