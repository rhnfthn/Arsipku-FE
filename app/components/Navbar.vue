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

      <!-- SEARCH BUTTON (DESKTOP) -->
      <div v-if="searchConfig.show" class="hidden md:block w-full max-w-3xl">
        <button @click="openSearchModal"
          class="w-full px-5 py-3 bg-primary-50/80 dark:bg-gray-800 rounded-full hover:bg-white hover:shadow-md dark:hover:bg-gray-700 transition-all flex items-center gap-3 text-left">
          <UIcon name="i-heroicons-magnifying-glass" class="text-gray-400 dark:text-gray-500 w-5 h-5" />
          <span class="text-gray-500 dark:text-gray-400 text-sm">
            {{ searchConfig.placeholder }}
          </span>
          <div class="ml-auto flex items-center gap-2">
            <UIcon name="i-heroicons-adjustments-horizontal" class="text-primary-600 w-5 h-5" />
          </div>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2 md:gap-5">
      <!-- SEARCH BUTTON (MOBILE) -->
      <button @click="openSearchModal"
        class="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-full transition-colors">
        <UIcon name="i-heroicons-magnifying-glass" class="w-6 h-6" />
      </button>

      <UDropdownMenu :items="menuItems" :content="{ align: 'end' }" :ui="{
        content: 'w-72 dark:bg-gray-900 dark:ring-gray-800',
        item: 'px-4 py-3',
        itemLabel: 'text-sm',
      }">
        <div class="flex items-center gap-2.5 cursor-pointer group pl-2">
          <div class="hidden md:flex flex-col items-end text-right justify-center gap-0.5">

            <span class="text-sm font-semibold leading-none text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
              {{ user?.nama }}
            </span>

            <UTooltip :text="user?.positionText" :popper="{ placement: 'bottom-end' }">
              <div class="flex items-center justify-end gap-1.5 leading-none">

                <UBadge size="xs" variant="subtle" color="primary"
                  class="rounded px-1.5 py-0.5 text-[10px] shrink-0 font-medium capitalize leading-none">
                  <span v-if="positionStatusLabel">{{ positionStatusLabel }} /</span> {{ user?.role }}
                </UBadge>

                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                  {{ user?.positionText }}
                </span>
              </div>
            </UTooltip>

            <UTooltip v-if="user?.companyText" :text="user?.companyText" :popper="{ placement: 'bottom-end' }">
              <span
                class="text-[10px] font-medium leading-none text-gray-400 dark:text-gray-500 truncate max-w-[150px]">
                {{ user?.companyText }}
              </span>
            </UTooltip>

          </div>

          <UAvatar size="md"
            class="ring-2 ring-transparent group-hover:ring-primary-500/30 transition-all duration-200 bg-primary-500 text-white font-bold flex items-center justify-center shadow-sm">
            {{ getInitials(user?.nama) }}
          </UAvatar>
        </div>


        <template #delegation-item="{ item }">
          <div class="flex flex-col w-full min-w-0 gap-0.5 py-1">

            <div class="flex items-center justify-between w-full gap-3">
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {{ item.uiName }}
              </span>

              <UBadge size="xs" variant="subtle" color="primary"
                class="rounded px-1.5 py-0.5 text-[10px] shrink-0 font-medium capitalize leading-none">
                {{ item.uiBadge }}
              </UBadge>
            </div>

            <div class="flex items-center justify-between tracking-tight w-full gap-3">
              <span
                class="text-xs text-gray-500 dark:text-gray-400 text-left whitespace-normal break-words leading-snug">
                {{ item.uiPosition }}
                <span class="mx-0.5 opacity-50">•</span>
                <span class="text-gray-400 dark:text-gray-500">{{ item.uiCompany }}</span>
              </span>

              <UIcon v-if="item.isActive" name="i-heroicons-check-circle-20-solid"
                class="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
            </div>

          </div>
        </template>
        <template #theme-label>
          <div class="flex items-center justify-between w-full px-3">
            <span class="text-sm text-gray-700 dark:text-gray-200">Tampilan</span>
            <div
              class="flex items-center p-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button @click="isDark = false" class="p-1 rounded-full transition-all flex items-center justify-center"
                :class="!isDark
                  ? 'bg-white text-orange-500 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
                  ">
                <UIcon name="i-heroicons-sun" class="w-4 h-4" />
              </button>
              <button @click="isDark = true" class="p-1 rounded-full transition-all flex items-center justify-center"
                :class="isDark
                  ? 'bg-gray-700 text-yellow-300 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
                  ">
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
  </nav>

  <!-- SEARCH MODAL WITH BACKDROP BLUR -->
  <teleport to="body">
    <transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition ease-in duration-200" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="isSearchModalOpen" class="fixed inset-0 z-[9999] overflow-y-auto">
        <!-- BACKDROP BLUR -->
        <div class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md" @click="isSearchModalOpen = false" />

        <!-- MODAL CONTAINER -->
        <div class="flex min-h-full items-center justify-center p-4">
          <transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
            <div v-if="isSearchModalOpen"
              class="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl" @click.stop>
              <!-- MODAL HEADER -->
              <div class="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">

                  <div
                    class="flex items-center justify-center shrink-0 p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
                    <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5" />
                  </div>

                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Pencarian Surat
                  </h3>
                </div>

                <button @click="isSearchModalOpen = false"
                  class="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                  <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
                </button>
              </div>

              <!-- MODAL CONTENT -->
              <div
                class="px-6 py-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                <div class="space-y-6">

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Nomor Surat
                      </label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UIcon name="i-heroicons-hashtag" class="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="text" v-model="advancedFilters.nomorSurat" placeholder="# 001/ADM/..."
                          class="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors" />
                      </div>
                    </div>

                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Perihal
                      </label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="text" v-model="advancedFilters.perihal" placeholder="Isi Perihal..."
                          class="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors" />
                      </div>
                    </div>

                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Pengirim/Tertuju
                      </label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UIcon name="i-heroicons-user" class="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="text" v-model="advancedFilters.pengirim" @input="handlePengirimInput"
                          @focus="handlePengirimFocus" @blur="handlePengirimBlur" placeholder="Nama/Jabatan Pengirim..."
                          class="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary-500" />

                        <!-- Dropdown Suggestions -->
                        <div v-if="showPengirimPopover && filteredPengirim.length > 0"
                          class="absolute z-[10000] w-full mt-1 max-h-60 overflow-y-auto p-1 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 rounded-lg">
                          <div v-for="item in filteredPengirim" :key="item.nama"
                            @mousedown.prevent="selectPengirim(item.nama)"
                            class="flex flex-col px-3 py-2 hover:bg-primary-50 dark:hover:bg-gray-800 cursor-pointer rounded-md transition-colors">
                            <span class="text-sm font-semibold text-gray-900 dark:text-white"
                              v-html="highlightText(item.nama, advancedFilters.pengirim)"></span>
                            <span class="text-xs text-gray-500 dark:text-gray-400"
                              v-html="highlightText(item.jabatan, advancedFilters.pengirim)"></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Penerima/Tembusan
                      </label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="text" v-model="advancedFilters.penerima" @input="handlePenerimaInput"
                          @focus="handlePenerimaFocus" @blur="handlePenerimaBlur" placeholder="Nama/Jabatan Penerima..."
                          class="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary-500" />

                        <!-- Dropdown Suggestions -->
                        <div v-if="showPenerimaPopover && filteredPenerima.length > 0"
                          class="absolute z-[10000] w-full mt-1 max-h-60 overflow-y-auto p-1 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 rounded-lg">
                          <div v-for="item in filteredPenerima" :key="item.nama"
                            @mousedown.prevent="selectPenerima(item.nama)"
                            class="flex flex-col px-3 py-2 hover:bg-primary-50 dark:hover:bg-gray-800 cursor-pointer rounded-md transition-colors">
                            <span class="text-sm font-semibold text-gray-900 dark:text-white"
                              v-html="highlightText(item.nama, advancedFilters.penerima)"></span>
                            <span class="text-xs text-gray-500 dark:text-gray-400"
                              v-html="highlightText(item.jabatan, advancedFilters.penerima)"></span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Jenis Surat
                    </label>
                    <div class="flex flex-wrap gap-2.5">

                      <button v-for="opt in jenisOptions" :key="opt.value"
                        @click="advancedFilters.jenis = advancedFilters.jenis === opt.value ? '' : opt.value" :class="[
                          'px-4 py-1.5 text-sm font-medium rounded-full border border-transparent transition-all',
                          // Gunakan getCategoryStyle untuk warna background pastel (misal: bg-blue-100 text-blue-700)
                          getCategoryStyle(opt.value),
                          advancedFilters.jenis === opt.value
                            ? 'ring-2 ring-offset-1 ring-gray-400 opacity-100 font-bold shadow-sm'
                            : 'opacity-90 hover:opacity-100 hover:shadow-sm'
                        ]">
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Sifat
                      </label>
                      <div class="relative">
                        <select v-model="advancedFilters.sifat"
                          class="appearance-none block w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors cursor-pointer">
                          <option value="" disabled selected>Semua</option>
                          <option v-for="opt in sifatOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                          </option>
                        </select>
                        <div
                          class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                          <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Status
                      </label>
                      <div class="relative">
                        <select v-model="advancedFilters.status"
                          class="appearance-none block w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors cursor-pointer">
                          <option value="" disabled selected>Semua</option>
                          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                          </option>
                        </select>
                        <div
                          class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                          <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Lampiran
                      </label>
                      <div class="relative">
                        <select v-model="advancedFilters.hasAttachment"
                          class="appearance-none block w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors cursor-pointer">
                          <option value="" disabled selected>Semua</option>
                          <option v-for="opt in attachmentOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                          </option>
                        </select>
                        <div
                          class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                          <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Prioritas
                      </label>
                      <div class="relative">
                        <select v-model="advancedFilters.prioritas"
                          class="appearance-none block w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors cursor-pointer">
                          <option value="" disabled selected>Semua</option>
                        </select>
                        <div
                          class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                          <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Rentang Tanggal
                    </label>
                    <div class="grid grid-cols-2 gap-4 items-center">
                      <div class="relative">
                        <label
                          class="absolute -top-2 left-3 px-1 bg-white dark:bg-gray-900 text-[10px] text-gray-400 leading-none">
                          Dari
                        </label>
                        <input type="date" v-model="advancedFilters.dateFrom"
                          class="block w-full px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors" />
                      </div>

                      <div class="relative">
                        <label
                          class="absolute -top-2 left-3 px-1 bg-white dark:bg-gray-900 text-[10px] text-gray-400 leading-none">
                          Sampai
                        </label>
                        <input type="date" v-model="advancedFilters.dateTo"
                          class="block w-full px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div
                class="flex items-center justify-between px-6 py-4 border-t rounded-b-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <button @click="resetAdvancedFilters"
                  class="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                  <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
                  Reset Filter
                </button>

                <div class="flex gap-3">
                  <button @click="isSearchModalOpen = false"
                    class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    Batal
                  </button>
                  <button @click="handleAdvancedSearch"
                    class="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 shadow-sm transition-colors">
                    <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4" />
                    Terapkan
                  </button>
                </div>
              </div>

            </div>
          </transition>
        </div>
      </div>
    </transition>
  </teleport>

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

// --- STATE ---
const isSearchModalOpen = ref(false);
const showLogoutPopup = ref(false);
const isLoggingOut = ref(false);
const search = ref("");
const delegationRoles = ref<any[]>([]);
const switchingMessage = ref("");

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
  hasAttachment: "Semua",
});

const jenisOptions = [
  { label: "Semua", value: null },
  { label: "Nota Dinas (ND)", value: "ND" },
  { label: "Surat Dinas Internal (SDI)", value: "SDI" },
  { label: "Surat Dinas Eksternal (SDE)", value: "SDE" },
  { label: "Disposisi (DI)", value: "DI" },
  { label: "Kajian (KA)", value: "KA" },
  { label: "Konsep (K)", value: "K" },
];

const sifatOptions = [
  { label: "Semua", value: null },
  { label: "Biasa", value: "biasa" },
  { label: "Terbatas", value: "terbatas" },
  { label: "Rahasia", value: "rahasia" },
  { label: "Sangat Rahasia", value: "sangat_rahasia" },
  { label: "Terbuka", value: "terbuka" },
];

const statusOptions = [
  { label: "Semua", value: null },
  { label: "Draf", value: "draf" },
  { label: "Final", value: "final" },
  { label: "Final TTE", value: "final_tte" },
];

const attachmentOptions = [
  { label: "Semua", value: "Semua" },
  { label: "Ya", value: true },
  { label: "Tidak", value: false },
];

interface UserSuggestion {
  nama: string;
  jabatan: string;
}

const userSuggestions = [
  { nama: 'Ahmad Subarjo', jabatan: 'Manager IT' },
  { nama: 'Budi Santoso', jabatan: 'Staff Administrasi' },
  { nama: 'Siti Aminah', jabatan: 'Kepala Divisi SDM' },
  { nama: 'Dewi Lestari', jabatan: 'Direktur Keuangan' },
  { nama: 'Eko Prasetyo', jabatan: 'Supervisor Operasional' },
  { nama: 'Fitri Handayani', jabatan: 'Manajer Marketing' },
];

const filteredPengirim = ref<UserSuggestion[]>([]);
const filteredPenerima = ref<UserSuggestion[]>([]);
const showPengirimPopover = ref(false);
const showPenerimaPopover = ref(false);

const searchUser = (query: string): UserSuggestion[] => {
  const q = query?.toLowerCase().trim();
  if (!q) return [];

  return userSuggestions.filter(u =>
    u.nama.toLowerCase().includes(q) ||
    u.jabatan.toLowerCase().includes(q)
  );
};

// Handler untuk Pengirim
const handlePengirimInput = () => {
  filteredPengirim.value = searchUser(advancedFilters.pengirim);
  showPengirimPopover.value = filteredPengirim.value.length > 0;
};

const handlePengirimFocus = () => {
  filteredPengirim.value = searchUser(advancedFilters.pengirim);
  showPengirimPopover.value = filteredPengirim.value.length > 0;
};

const selectPengirim = (nama: string) => {
  advancedFilters.pengirim = nama;
  filteredPengirim.value = [];
  showPengirimPopover.value = false;
};

const handlePengirimBlur = () => {
  // Delay untuk memungkinkan click event terjadi dulu
  setTimeout(() => {
    showPengirimPopover.value = false;
  }, 200);
};

// Handler untuk Penerima
const handlePenerimaInput = () => {
  filteredPenerima.value = searchUser(advancedFilters.penerima);
  showPenerimaPopover.value = filteredPenerima.value.length > 0;
};

const handlePenerimaFocus = () => {
  filteredPenerima.value = searchUser(advancedFilters.penerima);
  showPenerimaPopover.value = filteredPenerima.value.length > 0;
};

const selectPenerima = (nama: string) => {
  advancedFilters.penerima = nama;
  filteredPenerima.value = [];
  showPenerimaPopover.value = false;
};

const handlePenerimaBlur = () => {
  // Delay untuk memungkinkan click event terjadi dulu
  setTimeout(() => {
    showPenerimaPopover.value = false;
  }, 200);
};

// Fungsi Highlighting yang aman
const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const q = query.trim();
  const regex = new RegExp(`(${q})`, 'gi');
  return text.replace(regex, '<span class="text-primary-600 dark:text-primary-400 font-bold">$1</span>');
};

const positionStatusLabel = computed(() => {
  const u = user.value;
  if (!u) return null;

  // 1. Cek jika sudah di-mapping ke root (sesuai saran useAuth sebelumnya)
  if (u.position_status) return u.position_status;

  // 2. Cek di dalam array delegations (Sesuai JSON raw Anda)
  // Path: user -> delegations[0] -> delegated_role -> position_status
  if (u.delegations && u.delegations.length > 0) {
    return u.delegations[0].delegated_role?.position_status;
  }

  return null;
});

const getStoredOriginalRole = () =>
  process.client ? localStorage.getItem("arsipku_original_position") : null;
const originalRoleLabel = ref(getStoredOriginalRole() || "Posisi Utama");
const activeDelegationId = ref<string | null>(null);

const initActiveState = () => {
  if (process.client) {
    activeDelegationId.value = localStorage.getItem(
      "arsipku_active_delegation_id",
    );
  }
};

watch(
  user,
  (newUser) => {
    if (newUser) {
      fetchDelegationRoles();
      if (!activeDelegationId.value) {
        originalRoleLabel.value = newUser.positionText;
        if (process.client)
          localStorage.setItem(
            "arsipku_original_position",
            newUser.positionText,
          );
      } else if (process.client) {
        const stored = localStorage.getItem("arsipku_original_position");
        if (stored) originalRoleLabel.value = stored;
      }
    }
  },
  { immediate: true },
);

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

const handleSwitchRole = async (target: {
  type: "delegasi" | "reset";
  id?: string;
}) => {
  if (isSwitching.value) return;
  if (target.type === "delegasi") {
    switchingMessage.value = "Mengalihkan ke Akun Delegasi...";
  } else {
    switchingMessage.value = "Kembali ke Akun Utama...";
  }
  isSwitching.value = true;
  try {
    let payload = {};
    if (target.type === "delegasi" && target.id) {
      payload = { delegasiId: target.id };
    } else {
      payload = { resetToOriginal: true };
    }
    const res = await switchRole(payload);
    if (res?.success) {
      if (target.type === "delegasi" && target.id) {
        localStorage.setItem("arsipku_active_delegation_id", target.id);
        if (res.data?.user?.role) {
          localStorage.setItem(
            "arsipku_active_delegation_role",
            res.data.user.role,
          );
        }
      } else {
        localStorage.removeItem("arsipku_active_delegation_id");
        localStorage.removeItem("arsipku_active_delegation_role");
      }
      localStorage.setItem(
        "switch_role_message",
        res.message || "Berhasil mengganti role.",
      );
      window.location.reload();
    } else {
      isSwitching.value = false;
    }
  } catch (error) {
    console.error("Gagal ganti role:", error);
    toast.add({
      title: "Gagal",
      description: "Gagal mengganti role.",
      color: "red",
    });
    isSwitching.value = false;
  }
};

const confirmLogout = async () => {
  if (process.client) {
    localStorage.removeItem("arsipku_original_position");
    localStorage.removeItem("arsipku_active_delegation_id");
    localStorage.removeItem("arsipku_active_delegation_role");
  }
  isLoggingOut.value = true;
  await logout();
  isLoggingOut.value = false;
  showLogoutPopup.value = false;
  navigateTo("/");
};

const searchConfig = computed(() => ({
  show: true,
  placeholder: "Cari surat...",
  key: "",
}));

// Open Search Modal
const openSearchModal = () => {
  isSearchModalOpen.value = true;
};

// Advanced Search
const handleAdvancedSearch = () => {
  const queryParams: any = {
    page: 1,
    limit: 20,
    sortBy: "tanggal",
    sortOrder: "DESC",
  };

  if (search.value) queryParams.keyword = search.value;
  if (advancedFilters.nomorSurat)
    queryParams.nomor = advancedFilters.nomorSurat;
  if (advancedFilters.perihal) queryParams.perihal = advancedFilters.perihal;
  if (advancedFilters.jenis) queryParams.jenis = advancedFilters.jenis;
  if (advancedFilters.sifat) queryParams.sifat = advancedFilters.sifat;
  if (advancedFilters.status) queryParams.status = advancedFilters.status;
  if (advancedFilters.pengirim) queryParams.from = advancedFilters.pengirim;
  if (advancedFilters.penerima) queryParams.to = advancedFilters.penerima;
  if (advancedFilters.dateFrom) queryParams.dateFrom = advancedFilters.dateFrom;
  if (advancedFilters.dateTo) queryParams.dateTo = advancedFilters.dateTo;
  if (advancedFilters.hasWords) queryParams.hasWords = advancedFilters.hasWords;
  if (advancedFilters.doesntHave)
    queryParams.doesntHave = advancedFilters.doesntHave;

  if (
    advancedFilters.hasAttachment !== "Semua" &&
    advancedFilters.hasAttachment !== null
  ) {
    queryParams.hasAttachment = advancedFilters.hasAttachment;
  }

  isSearchModalOpen.value = false;
  console.log("Navigating with params:", queryParams);

  navigateTo({
    path: "/search",
    query: queryParams,
  });
};

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

  // Reset juga suggestion lists dan popover state
  filteredPengirim.value = [];
  filteredPenerima.value = [];
  showPengirimPopover.value = false;
  showPenerimaPopover.value = false;
};

const handleReset = () => {
  search.value = "";
  router.push({ path: "/beranda", query: {} });
};

const isDark = useDark();
const currentLocale = ref("id");
const locales = [
  { code: "id", name: "ID" },
  { code: "en", name: "EN" },
];
const setLocale = (code: string) => (currentLocale.value = code);

const itemClass = "text-sm truncate transition-colors cursor-pointer";

const menuItems = computed<DropdownMenuItem[][]>(() => {
  const currentId = activeDelegationId.value;
  const isMainAccountActive = !currentId;
  const hasDelegationData =
    delegationRoles.value && delegationRoles.value.length > 0;

  const mainAccountItem = {
    uiName: user.value?.nama || "User",
    uiBadge: user.value?.role,
    uiPosition: originalRoleLabel.value,
    uiCompany: user.value?.companyText,
    label: originalRoleLabel.value,
    slot: "delegation-item",
    isActive: isMainAccountActive,
    disabled: !hasDelegationData,
    click: hasDelegationData
      ? () => handleSwitchRole({ type: "reset" })
      : undefined,
    onSelect: hasDelegationData
      ? () => handleSwitchRole({ type: "reset" })
      : undefined,
  };

  const delegasiItems = (delegationRoles.value || []).map((role) => {
    // Ambil object delegated_role untuk mempermudah akses
    const details = role.delegated_role || {};

    return {
      // Mengambil nama dari delegated_role.name
      uiName: details.name || "Nama Tidak Tersedia",

      // Mengambil badge dari delegated_role.position_status_label (contoh: "Pelaksana Tugas")
      uiBadge: details.position_status_label || "Delegasi",

      // Mengambil jabatan dari delegated_role.position_text
      uiPosition: details.position_text || "Jabatan Tidak Tersedia",

      // Mengambil perusahaan dari delegated_role.company_text (ditambahkan agar UI lebih lengkap)
      uiCompany: details.company_text,

      // Label fallback untuk dropdown item standard
      label: details.position_text || "Delegasi",

      slot: "delegation-item",

      // ID tetap diambil dari root object (role.id) untuk switchRole
      isActive: currentId === role.id,
      click: () => handleSwitchRole({ type: "delegasi", id: role.id }),
      onSelect: () => handleSwitchRole({ type: "delegasi", id: role.id }),
    };
  });

  const roleGroup = [mainAccountItem, ...delegasiItems];

  return [
    roleGroup,
    [
      {
        label: "Pindah Perusahaan",
        class: itemClass,
        onSelect: () => {
          navigateTo("/switch");
        },
      },
      { label: "Setting Notif Email", class: itemClass },
      { label: "Visualisasi Digsig (Visible)", class: itemClass },
      { label: "Setting Temporary File", class: itemClass },
    ],
    [{ slot: "theme-label", type: "label" }],
    [{ slot: "lang-label", type: "label" }],
    [
      {
        label: "Keluar",
        class: "text-sm text-error",
        onSelect: () => openLogoutPopup(),
      },
    ],
  ];
});

onMounted(() => {
  if (process.client) {
    initActiveState();
    const successMsg = localStorage.getItem("switch_role_message");
    if (successMsg) {
      toast.add({
        title: "Berhasil",
        description: successMsg,
        icon: "i-heroicons-check-circle",
        color: "green",
      });
      localStorage.removeItem("switch_role_message");
    }
  }
  if (!user.value) getProfile();
});

const openLogoutPopup = () => {
  showLogoutPopup.value = true;
};

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return (
    parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
};

defineEmits(["open-mobile-sidebar"]);

const getCategoryStyle = (cat: string) => {
  const c = (cat || "").toUpperCase();
  if (["ND", "NOTA DINAS"].includes(c))
    return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300";
  if (["DI", "DISPOSISI"].includes(c))
    return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300";
  if (["SDI", "INTERNAL", "SURAT DINAS INTERNAL"].includes(c))
    return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300";
  if (["SDE", "SURAT DINAS EKSTERNAL"].includes(c))
    return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300";
  if (["KAJIAN", "KA"].includes(c))
    return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
};
</script>
