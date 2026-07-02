<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <EmptyState
      v-if="!canViewLaporan"
      icon="i-lucide-lock"
      title="Akses Ditolak"
      description="Anda tidak punya izin melihat laporan. Hubungi administrator."
    />
    <div v-else>
    <div class="flex items-center justify-between">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white">
          {{ $t('dn_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        v-if="isSuperadmin || hasPermission('laporan', 'export')"
        @click="exportExcel"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-9 px-6 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
      >
        {{ $t('export') }}
      </button>
    </div>

    <!-- Table -->
    <div
      class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 mt-4"
    >
      <div class="bg-white dark:bg-gray-800 p-3">
        <div class="flex items-center gap-2 flex-nowrap w-full mt-1">
          <!-- REFRESH -->
          <button
            @click="refreshData"
            class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 disabled:opacity-50"
            :disabled="isRefreshing"
          >
            <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
          </button>

          <!-- ROWS PER PAGE -->
          <div class="relative">
            <button
              type="button"
              @click="toggle('rows')"
              class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
            >
              <span>{{ rowsPerPage }}</span>
              <ChevronDown
                class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': openDropdown === 'rows' }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openDropdown === 'rows'"
                class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  v-for="n in rowsChoices"
                  :key="n"
                  type="button"
                  @click="
                    rowsPerPage = n;
                    openDropdown = null;
                  "
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                    rowsPerPage === n
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER JENIS -->
          <div class="relative w-[160px] shrink-0">
            <div
              @click="toggle('jenis')"
              class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
            >
              <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                {{
                  jenisOptions.find((j) => j.jenis === filters.jenis)?.jenis_text ||
                  $t('semua_jenis')
                }}
              </span>
              <ChevronDown
                class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                :class="{ 'rotate-180': openDropdown === 'jenis' }"
              />
            </div>
            <Transition name="filter-dd">
              <div
                v-if="openDropdown === 'jenis'"
                class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
              >
                <div class="mb-1">
                  <input
                    v-model="jenisKeyword"
                    @click.stop
                    type="text"
                    :placeholder="$t('cari')"
                    class="h-7 w-full rounded-lg px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-primary"
                  />
                </div>
                <div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  <button
                    @mousedown.prevent
                    @click="
                      filters.jenis = '';
                      jenisKeyword = '';
                      openDropdown = null;
                    "
                    class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                    :class="
                      !filters.jenis
                        ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                    "
                  >
                    {{ $t('semua_jenis') }}
                  </button>
                  <button
                    v-for="jenis in filteredJenisOptions"
                    :key="jenis.jenis"
                    @mousedown.prevent
                    @click="
                      filters.jenis = jenis.jenis;
                      jenisKeyword = jenis.jenis_text;
                      openDropdown = null;
                    "
                    class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                    :class="
                      filters.jenis === jenis.jenis
                        ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                    "
                  >
                    {{ jenis.jenis_text }}
                  </button>
                  <div
                    v-if="filteredJenisOptions.length === 0"
                    class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 italic"
                  >
                    {{ $t('tidak_ditemukan') }}
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- FILTER LOKASI -->
          <div v-if="canSeeLocationFilter" class="relative w-[160px] shrink-0">
            <div
              @click="toggle('lokasi')"
              class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
            >
              <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                {{ areaOptions.find((a) => a.kode === filters.lokasi)?.nama || $t('semua_lokasi') }}
              </span>
              <ChevronDown
                class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                :class="{ 'rotate-180': openDropdown === 'lokasi' }"
              />
            </div>
            <Transition name="filter-dd">
              <div
                v-if="openDropdown === 'lokasi'"
                class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
              >
                <div class="mb-1">
                  <input
                    v-model="lokasiKeyword"
                    @click.stop
                    type="text"
                    :placeholder="$t('cari')"
                    class="h-7 w-full rounded-lg px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-primary"
                  />
                </div>
                <div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  <button
                    @mousedown.prevent
                    @click="
                      filters.lokasi = '';
                      lokasiKeyword = '';
                      openDropdown = null;
                    "
                    class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                    :class="
                      !filters.lokasi
                        ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                    "
                  >
                    {{ $t('semua_lokasi') }}
                  </button>
                  <button
                    v-for="area in filteredAreaOptions"
                    :key="area.kode"
                    @mousedown.prevent
                    @click="
                      filters.lokasi = area.kode;
                      lokasiKeyword = area.nama;
                      openDropdown = null;
                    "
                    class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                    :class="
                      filters.lokasi === area.kode
                        ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                    "
                  >
                    {{ area.nama }}
                  </button>
                  <div
                    v-if="filteredAreaOptions.length === 0"
                    class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 italic"
                  >
                    {{ $t('tidak_ditemukan') }}
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- STATUS FILTER -->
          <div class="relative w-[180px] shrink-0">
            <div
              @click="toggle('status')"
              class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
            >
              <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                {{
                  statusOptions.find((s) => s.value === selectedStatus)?.label || $t('semua_status')
                }}
              </span>
              <ChevronDown
                class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': openDropdown === 'status' }"
              />
            </div>
            <Transition name="filter-dd">
              <div
                v-if="openDropdown === 'status'"
                class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
              >
                <div class="flex flex-col gap-1">
                  <button
                    @mousedown.prevent
                    @click="
                      selectedStatus = '';
                      openDropdown = null;
                    "
                    class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                    :class="
                      !selectedStatus
                        ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                    "
                  >
                    {{ $t('semua_status') }}
                  </button>
                  <button
                    v-for="status in statusOptions"
                    :key="status.value"
                    @mousedown.prevent
                    @click="
                      selectedStatus = status.value;
                      openDropdown = null;
                    "
                    class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                    :class="
                      selectedStatus === status.value
                        ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                    "
                  >
                    {{ status.label }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- FILTER TAHUN -->
          <div class="relative w-[120px] shrink-0">
            <div
              @click="toggle('tahun')"
              class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
            >
              <span
                class="flex-1 truncate text-sm"
                :class="
                  filters.tahun ? 'text-gray-700 dark:text-white' : 'text-gray-400 dark:text-white'
                "
              >
                {{ filters.tahun || $t('semua_tahun') }}
              </span>
              <ChevronDown
                class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                :class="{ 'rotate-180': openDropdown === 'tahun' }"
              />
            </div>
            <Transition name="filter-dd">
              <div
                v-if="openDropdown === 'tahun'"
                class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
              >
                <div class="flex flex-col gap-1 max-h-60 overflow-y-auto">
                  <button
                    v-for="tahun in tahunOptions"
                    :key="tahun"
                    @mousedown.prevent
                    @click="
                      filters.tahun = tahun;
                      openDropdown = null;
                    "
                    class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                    :class="
                      filters.tahun === tahun
                        ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                    "
                  >
                    {{ tahun }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div class="relative overflow-x-auto">
        <table class="min-w-max border-collapse text-sm w-full">
          <thead class="text-left bg-primary dark:bg-primary-700 text-white">
            <tr>
              <th class="px-4 py-3 font-semibold">{{ $t('nomor') }}</th>
              <th
                @click="handleSort('tanggal')"
                class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-600 select-none"
              >
                <div class="flex items-center gap-2">
                  <span>{{ $t('tanggal') }}</span>
                  <ArrowUpDown
                    class="w-4 h-4 transition-transform duration-200"
                    :class="[
                      sortKey === 'tanggal' ? 'opacity-100' : 'opacity-40',
                      sortKey === 'tanggal' && sortOrder === 'desc' ? 'rotate-180' : ''
                    ]"
                  />
                </div>
              </th>
              <th class="px-4 py-3 font-semibold">{{ $t('perihal') }}</th>
              <th class="px-4 py-3 font-semibold">{{ $t('jabatan') }}</th>
              <th class="px-4 py-3 font-semibold">{{ $t('lokasi') }}</th>
              <th
                @click="handleSort('status')"
                class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-600 select-none"
              >
                <div class="flex items-center gap-2">
                  <span>{{ $t('sign_status') }}</span>
                  <ArrowUpDown
                    class="w-4 h-4 transition-transform duration-200"
                    :class="[
                      sortKey === 'status' ? 'opacity-100' : 'opacity-40',
                      sortKey === 'status' && sortOrder === 'desc' ? 'rotate-180' : ''
                    ]"
                  />
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- SKELETON LOADING -->
            <template v-if="loading">
              <tr
                v-for="n in skeletonRows"
                :key="'skeleton-' + n"
                class="hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition-colors animate-pulse"
              >
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                </td>
              </tr>
            </template>

            <!-- DATA ROWS -->
            <template v-else>
              <tr
                v-for="item in paginatedNaskah"
                :key="item.id"
                class="hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition-colors"
              >
                <td class="px-4 py-3 text-gray-900 dark:text-white">
                  {{ item.nomor }}
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ item.tanggal }}
                </td>
                <td class="px-4 py-3 text-gray-900 dark:text-white">
                  {{ item.perihal }}
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ item.jabatan }}
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ item.lokasi }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                    :class="{
                      'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300':
                        item.statusRaw === 'terpakai',
                      'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300':
                        item.statusRaw === 'terpakai_final',
                      'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300':
                        item.statusRaw === 'booking',
                      'bg-red-300 dark:bg-red-700 text-red-700 dark:text-red-300':
                        item.statusRaw === 'hangus'
                    }"
                  >
                    {{ formatStatusLabel(item.statusRaw) }}
                  </span>
                </td>
              </tr>

              <!-- EMPTY STATE -->
              <tr v-if="paginatedNaskah.length === 0">
                <td
                  colspan="6"
                  class="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500 italic"
                >
                  {{ $t('tidak_ada_data') }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="totalItems > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ $t('menampilkan') }} {{ paginatedNaskah.length }} {{ $t('dari') }} {{ totalItems }}
          {{ $t('data') }}
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
            ]"
          >
            {{ $t('sebelumnya') }}
          </button>

          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              1
            </button>
            <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400 dark:text-gray-500"
              >...</span
            >
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary dark:bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              ]"
            >
              {{ page }}
            </button>
            <span
              v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
              class="px-2 text-gray-400 dark:text-gray-500"
              >...</span
            >
            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {{ totalPages }}
            </button>
          </div>

          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
            ]"
          >
            {{ $t('selanjutnya') }}
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});

//IMPORT
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { FileDown, RotateCcw, ChevronDown, ArrowUpDown } from 'lucide-vue-next';
import { useToast } from '#imports';
import { useLaporan } from '~/composables/useLaporan';
import { useAuth } from '~/composables/useAuth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDateNumeric as formatTanggal } from '~/utils/mail-helpers';

//GLOBAL UTIL
const toast = useToast();
const { t } = useI18n();
const { getRekapNaskahDetail, getAreaList, getJenisList } = useLaporan();
const { user, getProfile, hasPermission, isSuperadmin } = useAuth();

const canViewLaporan = computed(() => hasPermission('laporan', 'read'));

//SORT
const sortKey = ref('');
const sortOrder = ref('asc');

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
}

//FILTER STATE
const loading = ref(false);
const isRefreshing = ref(false);

const jenisKeyword = ref('');
const lokasiKeyword = ref('');

const openDropdown = ref<null | string>(null);
const selectedStatus = ref('');

const currentYear = new Date().getFullYear();
const tahunMin = ref<number | null>(null);

const rowsPerPage = ref(10);
const rowsChoices = [5, 10, 20, 50];

//DATA STATE
const rawData = ref<any[]>([]);
const areaOptions = ref<{ kode: string; nama: string }[]>([]);
const jenisOptions = ref<{ jenis: string; jenis_text: string }[]>([]);

//COMPUTED - Check if user can see location filter
const canSeeLocationFilter = computed(() => {
  if (!user.value) return false;
  return user.value.area === 'A000' || user.value.subAreaText === 'Kantor Pusat';
});

//FILTER STATE
const filters = ref({
  jenis: '',
  lokasi: '',
  status: [] as string[],
  tahun: currentYear,
  search: ''
});

//DROPDOWN HANDLER
const toggle = (key: string) => {
  openDropdown.value = openDropdown.value === key ? null : key;
};

//OUTSIDE HANDLER
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative')) {
    openDropdown.value = null;
  }
};

//FILTERING
const filteredData = computed(() => {
  let result = [...rawData.value];
  if (selectedStatus.value) {
    result = result.filter((item) => item.statusRaw === selectedStatus.value);
  }
  return result;
});

const filteredJenisOptions = computed(() => {
  if (!jenisKeyword.value) return jenisOptions.value;
  return jenisOptions.value.filter((j) =>
    j.jenis_text.toLowerCase().includes(jenisKeyword.value.toLowerCase())
  );
});

const filteredAreaOptions = computed(() => {
  if (!lokasiKeyword.value) return areaOptions.value;
  return areaOptions.value.filter((a) =>
    a.nama.toLowerCase().includes(lokasiKeyword.value.toLowerCase())
  );
});

const tahunOptions = computed(() => {
  const start = tahunMin.value ?? currentYear;
  const years = [];
  for (let y = currentYear; y >= start; y--) {
    years.push(y);
  }
  return years;
});

//PAGINATION
const currentPage = ref(1);
const totalItems = ref(0);

const totalPages = computed(() => {
  if (!totalItems.value) return 1;
  return Math.ceil(totalItems.value / rowsPerPage.value);
});

const paginatedNaskah = computed(() => sortedData.value);

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else if (current <= 2) {
    pages.push(1, 2, 3, 4, 5);
  } else if (current >= total - 1) {
    pages.push(total - 2, total - 1, total);
  } else {
    pages.push(current - 1, current, current + 1);
  }
  return pages;
});

const skeletonRows = computed(() => rowsPerPage.value);

const sortedData = computed(() => {
  let data = [...filteredData.value];
  if (!sortKey.value) return data;
  data.sort((a, b) => {
    if (sortKey.value === 'tanggal') {
      return new Date(a.tanggalRaw).getTime() - new Date(b.tanggalRaw).getTime();
    }
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];
    if (valA < valB) return -1;
    if (valA > valB) return 1;
    return 0;
  });
  if (sortOrder.value === 'desc') data.reverse();
  return data;
});

//API FETCH
const fetchDetailNaskah = async () => {
  loading.value = true;
  try {
    const params: any = {
      tahun: Number(filters.value.tahun),
      page: currentPage.value,
      limit: rowsPerPage.value
    };
    if (filters.value.lokasi) params.area = filters.value.lokasi;
    if (filters.value.jenis) params.jenis = filters.value.jenis;

    const res = await getRekapNaskahDetail(params);
    currentPage.value = res.pagination?.page ?? 1;
    rowsPerPage.value = res.pagination?.limit ?? 10;
    totalItems.value = res.pagination?.total ?? 0;

    rawData.value = res.data.map((item: any) => ({
      id: item.id,
      nomor: item.nomor,
      tanggalRaw: item.tanggal,
      tanggal: formatTanggal(item.tanggal),
      perihal: item.perihal ?? '-',
      jabatan: item.jabatan,
      lokasi: item.lokasi,
      status: formatStatusLabel(item.status),
      statusRaw: item.status,
      jenis: item.jenis,
      jenis_text: item.jenis_text
    }));
  } finally {
    loading.value = false;
  }
};

const fetchAreaList = async () => {
  try {
    const res = await getAreaList();
    areaOptions.value = res.data.map((item: any) => ({
      kode: item.area,
      nama: item.longText
    }));
  } catch (err) {
    console.error('Gagal ambil area', err);
  }
};

const fetchJenis = async () => {
  try {
    const res = await getJenisList();
    jenisOptions.value = res.data;
  } catch (err) {
    console.error('Gagal ambil jenis', err);
  }
};

const fetchTahunRange = async () => {
  const res = await getRekapNaskahDetail({ page: 1, limit: 1 });
  const tanggalTerlama = res.meta?.min_tanggal;
  if (tanggalTerlama) {
    tahunMin.value = new Date(tanggalTerlama).getFullYear();
  }
};

//HELPER

const formatStatusLabel = (status: string) => {
  if (!status) return '-';
  if (status === 'terpakai_final') return t('nom_status_final');
  if (status === 'terpakai') return t('nom_status_terpakai');
  if (status === 'booking') return t('nom_status_booking');
  if (status === 'hangus') return t('nom_status_hangus');
  return status;
};

//EXCEL
const exportExcel = () => {
  if (!filteredData.value.length) {
    toast.add({
      title: t('export_dibatalkan'),
      description: t('export_tidak_ada'),
      color: 'warning',
      icon: 'i-lucide-alert-circle'
    });
    return;
  }

  const excelData = filteredData.value.map((item, index) => ({
    No: index + 1,
    Nomor: item.nomor,
    Tanggal: item.tanggal,
    Perihal: item.perihal,
    Jabatan: item.jabatan,
    Lokasi: item.lokasi,
    Status: formatStatusLabel(item.statusRaw ?? item.status)
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 12 },
    { wch: 40 },
    { wch: 25 },
    { wch: 20 },
    { wch: 15 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Detail Naskah');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const today = new Date().toISOString().split('T')[0];
  saveAs(blob, `detail-naskah-${today}.xlsx`);

  toast.add({
    title: t('export_berhasil'),
    description: t('export_file_berhasil'),
    color: 'success',
    icon: 'i-lucide-file-check'
  });
};

//REFRESH
const refreshData = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    filters.value = {
      jenis: '',
      lokasi: '',
      status: [],
      tahun: currentYear,
      search: ''
    };
    jenisKeyword.value = '';
    lokasiKeyword.value = '';
    selectedStatus.value = '';
    openDropdown.value = null;
    currentPage.value = 1;
    await fetchDetailNaskah();
  } catch (err) {
    console.error('Gagal refresh data', err);
  } finally {
    isRefreshing.value = false;
  }
};

//LIFECYCLE
onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  await getProfile();
  fetchDetailNaskah();
  fetchAreaList();
  fetchJenis();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

//WATCH
watch(selectedStatus, () => {
  currentPage.value = 1;
});
watch(
  () => [filters.value.tahun, filters.value.lokasi, filters.value.jenis],
  () => {
    currentPage.value = 1;
    fetchDetailNaskah();
  }
);
watch([currentPage, rowsPerPage], () => {
  fetchDetailNaskah();
});

//DATA STATIS
const statusOptions = computed(() => [
  { label: t('nom_status_final'), value: 'terpakai_final' },
  { label: t('nom_status_terpakai'), value: 'terpakai' },
  { label: t('nom_status_booking'), value: 'booking' },
  { label: t('nom_status_hangus'), value: 'hangus' }
]);

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('detail'), to: '/laporan/detail-naskah' }
]);
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

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
