<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="bg-gray-50 dark:bg-gray-900 pt-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white">
          Verifikator Naskah
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <div class="bg-white mt-2 dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow-sm border border-gray-200">
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 p-3.5 border-b border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center gap-2">
          <div class="relative" ref="rowsRef">
            <button
              type="button"
              @click.stop="showRowsDropdown = !showRowsDropdown"
              class="h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
            >
              <span>{{ rowsPerPage }}</span>
              <ChevronDown
                class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': showRowsDropdown }"
              />
            </button>
            <div
              v-if="showRowsDropdown"
              class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                v-for="n in rowsChoices"
                :key="n"
                type="button"
                @click.stop="
                  rowsPerPage = n;
                  showRowsDropdown = false;
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
          </div>

          <div class="relative" ref="filterStatusRef">
            <button
              type="button"
              class="h-9 flex items-center justify-between gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white text-sm px-3 rounded-lg min-w-[160px] hover:border-primary transition-all"
              @click.stop="openFilterStatus = !openFilterStatus"
            >
              <span>{{ filterStatusLabel }}</span>
              <ChevronDown
                :class="[
                  'w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200',
                  openFilterStatus ? 'rotate-180' : ''
                ]"
              />
            </button>
            <div
              v-if="openFilterStatus"
              class="absolute left-0 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <button
                v-for="item in filterOptions"
                :key="item.value"
                class="w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors"
                :class="
                  filterStatus === item.value
                    ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                "
                @click.stop="selectFilterStatus(item)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="relative w-full md:flex-1">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            placeholder="Cari nomor dokumen atau perihal..."
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-primary-400 dark:bg-primary-700 text-white text-sm">
            <tr>
              <th class="px-4 py-3 font-semibold text-sm">Tanggal</th>
              <th class="px-4 py-3 font-semibold text-sm">No Dokumen</th>
              <th class="px-4 py-3 font-semibold text-sm">Asal Naskah</th>
              <th class="px-4 py-3 font-semibold text-sm">Perihal</th>
              <th class="px-4 py-3 font-semibold text-sm">Progress</th>
              <th class="px-4 py-3 font-semibold text-sm text-center">Dokumen</th>
              <th class="px-4 py-3 font-semibold text-sm text-center">Status</th>
              <th class="px-4 py-3 font-semibold text-sm text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-if="loadingVerifikatorDocuments"
              v-for="i in 5"
              :key="i"
              class="border-b border-gray-100 dark:border-gray-700"
            >
              <td v-for="j in 8" :key="j" class="px-4 py-3">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
              </td>
            </tr>

            <tr v-else-if="paginatedRows.length === 0">
              <td colspan="8" class="p-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <FileX class="w-12 h-12 text-gray-400 dark:text-gray-600" />
                  <p class="text-gray-500 dark:text-gray-400 font-medium">
                    Tidak ada naskah untuk diverifikasi
                  </p>
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="row in paginatedRows"
              :key="row.id"
              class="border-b border-gray-100 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition"
            >
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-white">
                {{ formatDate(row.tanggalDibuat || row.tanggal) }}
              </td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                <span v-html="highlight(row.nomor, search)" />
              </td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {{ row.pengirim?.nama || '-' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                <span v-html="highlight(row.perihal, search)" />
              </td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 min-w-[170px]">
                <div class="flex items-center gap-3">
                  <div class="h-2 w-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="getProgressBarClass(row)"
                      :style="{ width: `${getProgressPercent(row)}%` }"
                    />
                  </div>
                  <span class="text-xs font-medium">{{ getProgressLabel(row) }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  v-if="hasPermission('verifikasi-naskah', 'read-lihat')"
                  @click="viewDocument(row)"
                  :disabled="!row.final_pdf_url"
                  class="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-lg transition"
                  :class="
                    row.final_pdf_url
                      ? 'bg-blue-100 dark:bg-blue-900 text-primary-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  "
                >
                  <FileText class="w-4 h-4" />
                  Lihat
                </button>
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full"
                  :class="getVerifierStatusClass(row.myVerifikatorStatus)"
                >
                  {{ getVerifierStatusLabel(row.myVerifikatorStatus) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <button
                    v-if="hasPermission('verifikasi-naskah', 'read-detail')"
                    @click="handleViewDetail(row)"
                    class="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition"
                    title="Lihat Detail"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    v-if="hasPermission('verifikasi-naskah', 'confirm')"
                    @click="row.canVerify ? openVerifyModal(row) : null"
                    :disabled="!row.canVerify"
                    :class="[
                      'p-2 rounded-lg transition',
                      row.canVerify
                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700'
                        : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    ]"
                    title="Verifikasi"
                  >
                    <Check class="w-4 h-4" />
                  </button>
                  <button
                    v-if="hasPermission('verifikasi-naskah', 'reject')"
                    @click="row.canReject ? openRejectModal(row) : null"
                    :disabled="!row.canReject"
                    :class="[
                      'p-2 rounded-lg transition',
                      row.canReject
                        ? 'text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700'
                        : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    ]"
                    title="Tolak"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="flex flex-col md:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-4"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ $t('menampilkan') }} {{ startRow }} - {{ endRow }} {{ $t('dari') }} {{ totalRows }}
          {{ $t('data') }}
        </div>
        <div class="flex gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
            ]"
          >
            {{ $t('sebelumnya') }}
          </button>
          <button
            v-for="page in paginationPages"
            :key="page"
            @click="currentPage = page"
            :class="[
              'w-8 h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
              currentPage === page
                ? 'bg-primary dark:bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400'
            ]"
          >
            {{ page }}
          </button>
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'px-3 py-1 text-sm font-medium rounded-lg transition-all',
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

    <Teleport to="body">
      <Modal v-model="openDetail" :hideDefaultFooter="true" size="xl">
        <template #title>
          <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
            Detail Naskah
          </Heading>
        </template>
        <div v-if="loadingDetail" class="p-12 text-center">
          <div class="inline-flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            {{ $t('memuat_data') }}
          </div>
        </div>
        <div v-else-if="selectedDetail" class="px-6 pb-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p class="text-gray-500 dark:text-gray-400 mb-1">No Dokumen</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ selectedDetail.nomor || '-' }}</p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400 mb-1">Tanggal</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatDate(selectedDetail.tanggal) }}
              </p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400 mb-1">Asal Naskah</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ selectedDetail.pengirim?.nama || '-' }}
              </p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400 mb-1">Status Verifikasi</p>
              <span
                class="px-3 py-1 rounded-lg text-xs font-medium inline-block"
                :class="getDocumentStatusClass(selectedDetail.verifikatorProgress?.status)"
              >
                {{ getDocumentStatusLabel(selectedDetail.verifikatorProgress?.status) }}
              </span>
            </div>
            <div class="md:col-span-2">
              <p class="text-gray-500 dark:text-gray-400 mb-1">Perihal</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ selectedDetail.perihal || '-' }}</p>
            </div>
            <div class="md:col-span-2">
              <button
                v-if="selectedDetail.final_pdf_url"
                @click="viewDocument(selectedDetail, 'detail')"
                class="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-primary dark:text-blue-300 px-4 py-2 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition"
              >
                <FileText class="w-4 h-4" />
                Pratinjau Dokumen
              </button>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-primary-400 dark:bg-primary-700 text-white">
                <tr>
                  <th class="p-3 text-left font-semibold">No</th>
                  <th class="p-3 text-left font-semibold">Nama/Jabatan</th>
                  <th class="p-3 text-center font-semibold">Status</th>
                  <th class="p-3 text-left font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="verifikator in selectedDetail.verifikators || []"
                  :key="verifikator.id"
                  class="border-b border-gray-100 dark:border-gray-700"
                >
                  <td class="p-3 text-gray-900 dark:text-white">{{ verifikator.urutan }}</td>
                  <td class="p-3">
                    <div class="font-semibold text-gray-900 dark:text-white">
                      {{ verifikator.nama || '-' }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {{ verifikator.jabatan || '-' }}
                    </div>
                  </td>
                  <td class="p-3 text-center">
                    <span
                      class="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                      :class="getVerifierStatusClass(verifikator.status)"
                    >
                      {{ getVerifierStatusLabel(verifikator.status) }}
                    </span>
                  </td>
                  <td class="p-3 text-sm text-gray-700 dark:text-gray-300">
                    {{ verifikator.keterangan || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </Teleport>

    <Teleport to="body">
      <Modal v-model="openVerify" :hideDefaultFooter="true" size="lg">
        <template #title>
          <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
            Verifikasi Naskah
          </Heading>
        </template>
        <div class="px-6 pb-6 space-y-4">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Pastikan naskah sudah sesuai sebelum diverifikasi.
          </p>
          <textarea
            v-model="verifyNote"
            rows="3"
            class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Keterangan opsional"
          />
          <div class="flex gap-3 pt-2">
            <button
              class="flex-1 px-6 py-2 text-sm font-medium border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-900 dark:text-white"
              @click="openVerify = false"
            >
              Batal
            </button>
            <button
              class="flex-1 px-6 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
              :disabled="savingAction"
              @click="verifyNow"
            >
              {{ savingAction ? 'Memproses...' : 'Verifikasi' }}
            </button>
          </div>
        </div>
      </Modal>
    </Teleport>

    <Teleport to="body">
      <Modal v-model="openReject" :hideDefaultFooter="true" size="lg">
        <template #title>
          <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold text-red-600 dark:text-red-400">
            Tolak Naskah
          </Heading>
        </template>
        <div class="px-6 pb-6 space-y-4">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Penolakan akan menghentikan alur verifikasi naskah ini.
          </p>
          <textarea
            v-model="rejectReason"
            rows="3"
            class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Masukkan alasan penolakan"
          />
          <div class="flex gap-3 pt-2">
            <button
              class="flex-1 px-6 py-2 text-sm font-medium border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-900 dark:text-white"
              @click="openReject = false"
            >
              Batal
            </button>
            <button
              class="flex-1 px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition disabled:opacity-50"
              :disabled="!rejectReason.trim() || savingAction"
              @click="rejectNow"
            >
              {{ savingAction ? 'Memproses...' : 'Tolak' }}
            </button>
          </div>
        </div>
      </Modal>
    </Teleport>

    <USlideover
      v-model:open="isOpenPreview"
      title="Pratinjau Dokumen"
      side="bottom"
      :dismissible="true"
      :ui="{ content: 'h-screen max-h-screen', body: 'p-0' }"
    >
      <template #body>
        <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full border-0" />
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Check, ChevronDown, Eye, FileText, FileX, Search, X } from 'lucide-vue-next';
import type { BreadcrumbItem } from '@nuxt/ui';
import Modal from '~/components/Modal.vue';
import { useNaskahDinas } from '~/composables/useNaskahDinas';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const toast = useToast();
const { canAccessPage } = useFeatureAccess();
const { hasPermission } = useAuth();

const {
  verifikatorDocuments,
  loadingVerifikatorDocuments,
  loadingDetail,
  fetchVerifikatorDocuments,
  fetchVerifikatorDocumentDetail,
  verifyNaskahDinas,
  rejectNaskahDinas,
} = useNaskahDinas();

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_masuk'), to: '/naskah-dinas' },
  { label: 'Verifikator', to: '/naskah-dinas/verifikator' },
]);

const search = ref('');
const filterStatus = ref('');
const openFilterStatus = ref(false);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsChoices = [10, 25, 50, 100];
const showRowsDropdown = ref(false);
const rowsRef = ref<HTMLElement | null>(null);
const filterStatusRef = ref<HTMLElement | null>(null);

const openDetail = ref(false);
const openVerify = ref(false);
const openReject = ref(false);
const selectedRow = ref<any | null>(null);
const selectedDetail = ref<any | null>(null);
const verifyNote = ref('');
const rejectReason = ref('');
const savingAction = ref(false);

const isOpenPreview = ref(false);
const pdfUrl = ref<string | null>(null);
const previewReturnToDetail = ref(false);

const filterOptions = [
  { label: 'Semua', value: '' },
  { label: 'Menunggu', value: 'waiting' },
  { label: 'Terverifikasi', value: 'verified' },
  { label: 'Ditolak', value: 'rejected' },
  { label: 'Pending', value: 'pending' },
];

const filterStatusLabel = computed(() => {
  return filterOptions.find((item) => item.value === filterStatus.value)?.label || 'Semua';
});

const filteredRows = computed(() => {
  let rows = verifikatorDocuments.value || [];
  const keyword = search.value.toLowerCase().trim();

  if (filterStatus.value) {
    rows = rows.filter((row: any) => row.myVerifikatorStatus === filterStatus.value);
  }

  if (keyword) {
    rows = rows.filter((row: any) =>
      `${row.nomor || ''} ${row.perihal || ''} ${row.pengirim?.nama || ''}`
        .toLowerCase()
        .includes(keyword)
    );
  }

  return rows;
});

const totalRows = computed(() => filteredRows.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / rowsPerPage.value)));
const startRow = computed(() =>
  totalRows.value === 0 ? 0 : (currentPage.value - 1) * rowsPerPage.value + 1
);
const endRow = computed(() => Math.min(currentPage.value * rowsPerPage.value, totalRows.value));

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredRows.value.slice(start, start + rowsPerPage.value);
});

const paginationPages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages.value, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlight(text: string | null | undefined, keyword: string) {
  const safeText = escapeHtml(String(text ?? '-'));
  const q = keyword.trim();
  if (!q) return safeText;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return safeText.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">$1</mark>'
  );
}

function formatDate(value?: string | Date) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getProgress(row: any) {
  return row.verifikatorProgress || { verified: 0, total: 0, status: 'none' };
}

function getProgressPercent(row: any) {
  const progress = getProgress(row);
  if (!progress.total) return 0;
  if (progress.status === 'rejected') return 100;
  return Math.round((progress.verified / progress.total) * 100);
}

function getProgressLabel(row: any) {
  const progress = getProgress(row);
  return `${progress.verified || 0}/${progress.total || 0}`;
}

function getProgressBarClass(row: any) {
  const progress = getProgress(row);
  if (progress.status === 'rejected') return 'bg-red-500';
  if (progress.status === 'completed') return 'bg-green-500';
  return 'bg-primary-500';
}

function getVerifierStatusClass(status: string) {
  const map: Record<string, string> = {
    waiting: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    pending: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    verified: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  };
  return map[status] || map.pending;
}

function getVerifierStatusLabel(status: string) {
  const map: Record<string, string> = {
    waiting: 'Menunggu',
    pending: 'Pending',
    verified: 'Terverifikasi',
    rejected: 'Ditolak',
  };
  return map[status] || status;
}

function getDocumentStatusClass(status: string) {
  const map: Record<string, string> = {
    none: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    on_progress: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    completed: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  };
  return map[status] || map.none;
}

function getDocumentStatusLabel(status: string) {
  const map: Record<string, string> = {
    none: 'Tanpa Verifikator',
    on_progress: 'Berjalan',
    completed: 'Selesai',
    rejected: 'Ditolak',
  };
  return map[status] || '-';
}

function selectFilterStatus(item: { label: string; value: string }) {
  filterStatus.value = item.value;
  openFilterStatus.value = false;
  currentPage.value = 1;
}

function viewDocument(row: any, source?: 'detail') {
  if (!row.final_pdf_url) {
    toast.add({ title: 'Gagal', description: 'File pratinjau tidak tersedia', color: 'error' });
    return;
  }
  if (source === 'detail' && openDetail.value) {
    previewReturnToDetail.value = true;
    openDetail.value = false;
  }
  pdfUrl.value = row.final_pdf_url;
  isOpenPreview.value = true;
}

async function handleViewDetail(row: any) {
  selectedDetail.value = null;
  openDetail.value = true;
  try {
    selectedDetail.value = await fetchVerifikatorDocumentDetail(row.id);
  } catch (error: any) {
    openDetail.value = false;
    toast.add({
      title: 'Gagal',
      description: error?.response?.data?.message || 'Gagal memuat detail naskah',
      color: 'error',
    });
  }
}

function openVerifyModal(row: any) {
  selectedRow.value = row;
  verifyNote.value = '';
  openVerify.value = true;
}

function openRejectModal(row: any) {
  selectedRow.value = row;
  rejectReason.value = '';
  openReject.value = true;
}

async function verifyNow() {
  if (!selectedRow.value) return;
  savingAction.value = true;
  try {
    await verifyNaskahDinas(selectedRow.value.id, verifyNote.value.trim() || undefined);
    toast.add({ title: 'Berhasil', description: 'Naskah berhasil diverifikasi', color: 'success' });
    openVerify.value = false;
    await fetchVerifikatorDocuments({ page: 1, limit: 10000 });
  } catch (error: any) {
    toast.add({
      title: 'Gagal',
      description: error?.response?.data?.message || 'Gagal memverifikasi naskah',
      color: 'error',
    });
  } finally {
    savingAction.value = false;
  }
}

async function rejectNow() {
  if (!selectedRow.value || !rejectReason.value.trim()) return;
  savingAction.value = true;
  try {
    await rejectNaskahDinas(selectedRow.value.id, rejectReason.value.trim());
    toast.add({ title: 'Berhasil', description: 'Naskah berhasil ditolak', color: 'success' });
    openReject.value = false;
    await fetchVerifikatorDocuments({ page: 1, limit: 10000 });
  } catch (error: any) {
    toast.add({
      title: 'Gagal',
      description: error?.response?.data?.message || 'Gagal menolak naskah',
      color: 'error',
    });
  } finally {
    savingAction.value = false;
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (rowsRef.value && !rowsRef.value.contains(target)) showRowsDropdown.value = false;
  if (filterStatusRef.value && !filterStatusRef.value.contains(target)) openFilterStatus.value = false;
}

onMounted(async () => {
  if (!canAccessPage()) return;
  document.addEventListener('click', handleClickOutside);
  await fetchVerifikatorDocuments({ page: 1, limit: 10000 });
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch([search, filterStatus, rowsPerPage], () => {
  currentPage.value = 1;
});

watch(isOpenPreview, (isOpen) => {
  if (isOpen) return;
  pdfUrl.value = null;
  if (previewReturnToDetail.value) {
    previewReturnToDetail.value = false;
    openDetail.value = true;
  }
});
</script>
