<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader
      :title="berkas?.judulBerkas || 'Detail Berkas'"
      :items="[
        { label: 'Kelola' },
        { label: 'Pemeliharaan' },
        { label: 'Pemberkasan', to: backPath },
        { label: 'Detail Berkas' },
      ]"
    />

    <div v-if="pending" class="space-y-5" aria-busy="true">
      <div class="h-56 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
      <div class="h-72 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>

    <div
      v-else-if="loadError"
      class="rounded-xl border border-error-200 bg-white px-6 py-16 text-center shadow-sm dark:border-error-900/50 dark:bg-gray-800"
    >
      <div
        class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-50 dark:bg-error-900/30"
      >
        <CircleAlert class="h-7 w-7 text-error-500" />
      </div>
      <h2 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        Detail berkas tidak dapat dimuat
      </h2>
      <p class="mx-auto mt-1 max-w-lg text-sm text-gray-500 dark:text-gray-400">{{ loadError }}</p>
      <div class="mt-5 flex justify-center gap-2">
        <UButton variant="outline" icon="i-lucide-arrow-left" :to="backPath">Kembali</UButton>
        <UButton color="primary" icon="i-lucide-refresh-cw" @click="loadPage">Coba Lagi</UButton>
      </div>
    </div>

    <template v-else-if="berkas">
      <div class="flex flex-wrap justify-end gap-2 print:hidden">
        <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" :to="backPath">
          Kembali
        </UButton>
        <UButton color="neutral" variant="outline" icon="i-lucide-printer" @click="printPage">
          Cetak
        </UButton>
        <UButton
          v-if="canActivate"
          color="primary"
          icon="i-lucide-circle-play"
          :loading="isActivating"
          @click="handleActivateBerkas"
        >
          Aktifkan Berkas
        </UButton>
        <UButton
          v-if="canClose"
          color="primary"
          icon="i-lucide-lock-keyhole"
          :to="`${detailPath}/tutup`"
        >
          Ajukan Penutupan
        </UButton>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div
          v-for="card in quickInfoCards"
          :key="card.label"
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ card.label }}
          </p>
          <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ card.value }}</p>
        </div>
      </div>

      <div class="mt-6 border-b border-gray-200 dark:border-gray-700 print:hidden">
        <nav class="flex gap-6" aria-label="Bagian detail berkas">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="border-b-2 px-1 pb-3 text-sm font-semibold transition-colors"
            :class="
              activeTab === tab.value
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            "
            @click="activeTab = tab.value"
          >
            <span class="inline-flex items-center gap-2">
              <component :is="tab.icon" class="h-4 w-4" />{{ tab.label }}
              <span
                v-if="tab.value === 'naskah'"
                class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] dark:bg-gray-700"
                >{{ naskahTotal }}</span
              >
            </span>
          </button>
        </nav>
      </div>

      <section v-if="activeTab === 'overview'" class="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div class="space-y-5 xl:col-span-2">
          <div
            class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <FolderSearch class="h-5 w-5 text-primary-500" />Informasi Berkas
              </h2>
            </div>
            <dl class="grid grid-cols-1 gap-x-8 px-5 py-2 sm:grid-cols-2">
              <div
                v-for="item in metadataList"
                :key="item.label"
                class="border-b border-gray-100 py-4 last:border-0 dark:border-gray-700"
              >
                <dt
                  class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  {{ item.label }}
                </dt>
                <dd class="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">
                  {{ item.value }}
                </dd>
              </div>
            </dl>
          </div>
          <div
            class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <AlignLeft class="h-5 w-5 text-primary-500" />Uraian Berkas
            </h2>
            <p class="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
              {{ berkas.isiRingkas || 'Belum ada uraian berkas.' }}
            </p>
          </div>
        </div>

        <aside class="space-y-5">
          <div
            class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Clock3 class="h-5 w-5 text-primary-500" />Jadwal Retensi Arsip
            </h2>
            <div class="mt-5 space-y-5">
              <div v-for="item in retentionTimeline" :key="item.label" class="flex gap-3">
                <div class="flex flex-col items-center">
                  <span
                    :class="item.dotClass"
                    class="mt-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-gray-800"
                  />
                  <span v-if="!item.last" class="mt-1 h-full w-px bg-gray-200 dark:bg-gray-700" />
                </div>
                <div class="pb-2">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {{ item.label }}
                  </p>
                  <p class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {{ item.value }}
                  </p>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ item.helper }}</p>
                </div>
              </div>
            </div>
          </div>
          <div
            class="rounded-xl border border-primary-100 bg-primary-50 p-5 dark:border-primary-900/50 dark:bg-primary-900/20"
          >
            <div class="flex gap-3">
              <Info class="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <h3 class="text-sm font-semibold text-primary-800 dark:text-primary-300">
                  Dasar perhitungan retensi
                </h3>
                <p class="mt-1 text-xs leading-5 text-primary-700 dark:text-primary-400">
                  {{ berkas.hitungWaktuRetensiDari || 'Belum ditentukan' }} dengan tindakan akhir
                  <strong>{{ berkas.tindakanPenyusutanAkhir || 'belum ditentukan' }}</strong
                  >.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section v-else-if="activeTab === 'naskah'" class="mt-5">
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div
            class="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-white">Daftar Naskah</h2>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Naskah yang telah dikelompokkan ke dalam berkas ini.
              </p>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row">
              <UInput
                v-model="naskahSearch"
                icon="i-lucide-search"
                placeholder="Cari nomor atau perihal…"
                class="sm:w-72"
              />
              <UButton
                v-if="canAddNaskah"
                color="primary"
                icon="i-lucide-file-plus-2"
                @click="openAddNaskahModal"
                >Tambah Naskah</UButton
              >
            </div>
          </div>
          <DataTable
            :columns="naskahColumns"
            :rows="naskahList"
            :loading="naskahPending"
            empty-message="Belum ada naskah dalam berkas ini."
          >
            <template #cell-nomorSurat="{ row }"
              ><div class="min-w-40">
                <p class="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                  {{ row.nomorSurat || '-' }}
                </p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(row.tanggalNaskah) }}
                </p>
              </div></template
            >
            <template #cell-perihal="{ row }"
              ><p class="min-w-64 max-w-xl font-medium text-gray-800 dark:text-gray-200">
                {{ row.perihal || 'Tanpa perihal' }}
              </p></template
            >
            <template #cell-naskahTipe="{ row }"
              ><span
                class="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                >{{ getNaskahTypeLabel(row.naskahTipe) }}</span
              ></template
            >
            <template #cell-sumber="{ row }"
              ><span
                class="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"
                ><component :is="row.sumber === 'terkirim' ? Send : Inbox" class="h-3.5 w-3.5" />{{
                  getSourceLabel(row.sumber)
                }}</span
              ></template
            >
            <template #cell-aksi="{ row }">
              <div class="flex items-center gap-1">
                <NuxtLink
                  :to="getNaskahDetailLink(row)"
                  class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
                  title="Lihat naskah"
                  ><Eye class="h-4 w-4"
                /></NuxtLink>
                <button
                  v-if="canRemoveNaskah"
                  type="button"
                  class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30"
                  title="Keluarkan dari berkas"
                  @click="requestRemoveNaskah(row)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </template>
          </DataTable>
          <DataPagination
            v-if="naskahTotal > naskahPerPage"
            v-model:current-page="naskahPage"
            :total-items="naskahTotal"
            :per-page="naskahPerPage"
          />
        </div>
      </section>

      <section v-else-if="activeTab === 'timeline'" class="mt-5">
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <History class="h-5 w-5 text-primary-500" />Rantai Verifikasi & Status
          </h2>
          <div v-if="verifikasiList.length === 0" class="mt-4">
            <EmptyState
              icon="i-lucide-inbox"
              title="Belum ada aktivitas verifikasi"
              description="Berkas ini belum diajukan penutupan."
            />
          </div>
          <ol v-else class="mt-5 space-y-4">
            <li v-for="v in verifikasiList" :key="v.id" class="flex gap-3">
              <div class="flex flex-col items-center">
                <span
                  class="mt-1 h-3 w-3 rounded-full"
                  :class="v.status === 'approved' ? 'bg-success-500' : v.status === 'rejected' ? 'bg-error-500' : 'bg-warning-500'"
                />
                <span class="mt-1 h-full w-px bg-gray-200 dark:bg-gray-700" />
              </div>
              <div class="pb-3">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ v.jabatanVerifikator || `Verifikator ${v.urutan}` }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Status: {{ v.status }}{{ v.actionAt ? ` · ${formatDateTime(v.actionAt)}` : '' }}
                </p>
                <p v-if="v.catatan" class="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  "{{ v.catatan }}"
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section v-else-if="activeTab === 'activity-log'" class="mt-5">
        <EmptyState
          icon="i-lucide-list-tree"
          title="Activity Log belum tersedia"
          description="Modul audit log terpisah akan ditambahkan di phase berikutnya (spec §15.7)."
        />
      </section>
    </template>

    <UModal
      v-model:open="showAddNaskahModal"
      :ui="{ content: 'max-w-5xl', overlay: 'bg-black/50 backdrop-blur-sm' }"
    >
      <template #header
        ><div>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            Tambahkan Naskah ke Berkas
          </h3>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Pilih naskah final yang belum berada di berkas ini.
          </p>
        </div></template
      >
      <template #body>
        <div class="p-4">
          <UTabs v-model="addNaskahTab" :items="addNaskahTabs" class="mb-4" />
          <div class="mb-3 flex items-center justify-between gap-3">
            <UInput
              v-model="candidateSearch"
              icon="i-lucide-search"
              placeholder="Cari nomor atau perihal naskah…"
              class="w-full sm:w-80"
            />
            <label class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <input type="checkbox" v-model="showAlreadyInBerkasOnly" />
              Sudah Masuk Berkas
            </label>
          </div>
          <div class="max-h-[55vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <DataTable
              :columns="candidateColumns"
              :rows="filteredCandidates"
              :loading="candidatePending"
              empty-message="Tidak ada naskah pada tab ini."
            >
              <template #cell-select="{ row }">
                <UCheckbox
                  :model-value="isNaskahSelected(row.id)"
                  :disabled="!!row.sudah_masuk_berkas"
                  @update:model-value="toggleNaskahSelection(row)"
                />
              </template>
              <template #cell-nomor_surat="{ row }">
                <div class="min-w-40">
                  <p class="font-mono text-xs font-semibold">{{ row.nomor_surat || row.nomorSurat || '-' }}</p>
                  <p class="mt-1 text-xs text-gray-500">{{ formatDate(row.tanggal_naskah || row.tanggalNaskah) }}</p>
                </div>
              </template>
              <template #cell-perihal="{ row }">
                <p class="min-w-64 max-w-lg text-sm font-medium">{{ row.perihal || 'Tanpa perihal' }}</p>
              </template>
              <template #cell-sumber="{ row }">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="sourceBadgeClass(row.sumber)"
                >
                  <component :is="row.sumber === 'terkirim' ? Send : Inbox" class="h-3.5 w-3.5" />
                  {{ getSourceLabel(row.sumber) }}
                </span>
              </template>
              <template #cell-berkas="{ row }">
                <span
                  v-if="row.sudah_masuk_berkas"
                  class="inline-flex items-center gap-1 text-xs text-primary-700 dark:text-primary-400"
                >
                  <Folder class="h-3.5 w-3.5" /> {{ row.kode_berkas || 'Sudah Masuk Berkas' }}
                </span>
                <span v-else class="text-xs text-gray-400">Belum</span>
              </template>
            </DataTable>
          </div>
          <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {{ Object.keys(selectedNaskahSumber).length }} naskah dipilih
          </p>
        </div>
      </template>
      <template #footer
        ><div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" @click="showAddNaskahModal = false">Batal</UButton
          ><UButton
            color="primary"
            icon="i-lucide-folder-plus"
            :disabled="Object.keys(selectedNaskahSumber).length === 0"
            :loading="isSubmittingNaskah"
            @click="handleAddNaskah"
            >Tambahkan
            {{ Object.keys(selectedNaskahSumber).length ? `(${Object.keys(selectedNaskahSumber).length})` : '' }}</UButton
          >
        </div></template
      >
    </UModal>

    <UModal v-model:open="showRemoveModal" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header><h3 class="text-base font-semibold">Keluarkan Naskah</h3></template>
      <template #body
        ><div class="p-4 text-sm text-gray-600 dark:text-gray-300">
          Naskah <strong>{{ selectedNaskah?.nomorSurat || selectedNaskah?.perihal }}</strong> akan
          dikeluarkan dari berkas ini. Naskah asli tidak akan dihapus.
        </div></template
      >
      <template #footer
        ><div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" @click="showRemoveModal = false">Batal</UButton
          ><UButton
            color="error"
            icon="i-lucide-trash-2"
            :loading="isRemovingNaskah"
            @click="handleRemoveNaskah"
            >Keluarkan</UButton
          >
        </div></template
      >
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  AlignLeft,
  CircleAlert,
  Clock3,
  Eye,
  FileText,
  Folder,
  FolderSearch,
  History,
  Inbox,
  Info,
  ListTree,
  Send,
  Trash2,
} from 'lucide-vue-next';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const {
  activateBerkas,
  addNaskahToBerkas,
  getBerkasById,
  getBerkasStatusByNaskah,
  getDaftarNaskah,
  getNaskahSaya,
  getNaskahSiapArsip,
  getVerifikasiDetail,
  removeNaskahFromBerkas,
} = useArsipDinamis();
const toast = useToast();
const backPath = '/kelola/pemeliharaan/pemberkasan/berkas-saya';
const berkasId = computed(() => String(route.params.id || ''));
const detailPath = computed(() => `/kelola/pemeliharaan/pemberkasan/${berkasId.value}`);
const berkas = ref<Record<string, any> | null>(null);
const pending = ref(true);
const loadError = ref('');
const activeTab = ref<'overview' | 'naskah' | 'timeline' | 'activity-log'>('overview');
const naskahList = ref<Record<string, any>[]>([]);
const naskahSearch = ref('');
const naskahPending = ref(false);
const naskahPage = ref(1);
const naskahPerPage = 20;
const naskahTotal = ref(0);
const verifikasiList = ref<Record<string, any>[]>([]);
const showAddNaskahModal = ref(false);
const candidateList = ref<Record<string, any>[]>([]);
const candidateSearch = ref('');
const candidatePending = ref(false);
const selectedNaskahSumber = ref<Record<string, string>>({}); // id -> sumber
const isSubmittingNaskah = ref(false);
const addNaskahTab = ref<'kotak_masuk' | 'terkirim' | 'siap_arsip'>('siap_arsip');
const showAlreadyInBerkasOnly = ref(false);
const addNaskahTabs = [
  { label: 'Siap Arsip', value: 'siap_arsip' as const, icon: 'i-lucide-folder-check' },
  { label: 'Kotak Masuk', value: 'kotak_masuk' as const, icon: 'i-lucide-inbox' },
  { label: 'Terkirim', value: 'terkirim' as const, icon: 'i-lucide-send' },
];
const showRemoveModal = ref(false);
const selectedNaskah = ref<Record<string, any> | null>(null);
const isRemovingNaskah = ref(false);
const isActivating = ref(false);
let naskahSearchTimer: ReturnType<typeof setTimeout> | undefined;
let candidateSearchTimer: ReturnType<typeof setTimeout> | undefined;
let naskahRequestId = 0;
let candidateRequestId = 0;

const tabs = [
  { label: 'Ringkasan', value: 'overview' as const, icon: FolderSearch },
  { label: 'Daftar Naskah', value: 'naskah' as const, icon: FileText },
  { label: 'Timeline', value: 'timeline' as const, icon: History },
  { label: 'Activity Log', value: 'activity-log' as const, icon: ListTree },
];
const naskahColumns = [
  { key: 'nomorSurat', label: 'Nomor & Tanggal' },
  { key: 'perihal', label: 'Perihal' },
  { key: 'naskahTipe', label: 'Jenis' },
  { key: 'sumber', label: 'Sumber' },
  { key: 'aksi', label: 'Aksi', class: 'w-24' },
];
const candidateColumns = [
  { key: 'select', label: '', class: 'w-12' },
  { key: 'nomor_surat', label: 'Nomor & Tanggal' },
  { key: 'perihal', label: 'Perihal' },
  { key: 'sumber', label: 'Sumber' },
  { key: 'berkas', label: 'Status Berkas' },
];
const filteredCandidates = computed(() =>
  showAlreadyInBerkasOnly.value
    ? candidateList.value.filter((r) => r.sudah_masuk_berkas)
    : candidateList.value
);
const canAddNaskah = computed(() => berkas.value?.status === 'aktif');
const canRemoveNaskah = computed(() => ['aktif', 'ditolak'].includes(berkas.value?.status));
const canClose = computed(() => berkas.value?.status === 'aktif');
const canActivate = computed(() => berkas.value?.status === 'draft');
const quickInfoCards = computed(() => [
  { label: 'Kode Berkas', value: berkas.value?.kodeBerkas || '-' },
  { label: 'PIC', value: berkas.value?.picPersnum || '-' },
  { label: 'Jumlah Naskah', value: String(naskahTotal.value) },
  { label: 'Tanggal Dibuat', value: formatDate(berkas.value?.tanggalDibuat) },
  { label: 'Retensi Berakhir', value: formatDate(berkas.value?.tanggalRetensiAktifBerakhir) },
]);
const metadataList = computed(() => [
  { label: 'Kode Berkas', value: berkas.value?.kodeBerkas || '-' },
  { label: 'Kategori Berkas', value: berkas.value?.kategoriBerkas || '-' },
  { label: 'Kode Klasifikasi', value: berkas.value?.klasifikasi || '-' },
  { label: 'Nama Klasifikasi', value: berkas.value?.klasifikasiTeks || '-' },
  { label: 'Lokasi Fisik', value: berkas.value?.lokasi || '-' },
  { label: 'Unit Pencipta', value: berkas.value?.unitPenciptaId || '-' },
  { label: 'Tindakan Akhir', value: berkas.value?.tindakanPenyusutanAkhir || '-' },
  { label: 'Terakhir Diperbarui', value: formatDateTime(berkas.value?.updatedAt) },
]);
const retentionTimeline = computed(() => [
  {
    label: 'Berkas Dibuat',
    value: formatDate(berkas.value?.tanggalDibuat || berkas.value?.createdAt),
    helper: 'Awal siklus hidup berkas',
    dotClass: 'bg-primary-500',
    last: false,
  },
  {
    label: 'Retensi Aktif Berakhir',
    value: formatDate(berkas.value?.tanggalRetensiAktifBerakhir),
    helper: `${berkas.value?.retensiAktifTahun ?? 0} tahun masa aktif`,
    dotClass: 'bg-success-500',
    last: false,
  },
  {
    label: 'Retensi Inaktif Berakhir',
    value: formatDate(berkas.value?.tanggalRetensiInaktifBerakhir),
    helper: `${berkas.value?.retensiInaktifTahun ?? 0} tahun masa inaktif`,
    dotClass: 'bg-warning-500',
    last: true,
  },
]);

const unwrapEnvelope = <T = any,>(response: any): T => response?.data ?? response;
const unwrapPaginated = (response: any) => {
  const payload = unwrapEnvelope<any>(response);
  return {
    rows: Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta || {},
  };
};
const getErrorMessage = (error: any, fallback: string) => {
  const message = error?.response?.data?.message || error?.data?.message || error?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
};
function formatDate(value?: string | Date | null) {
  if (!value) return 'Belum tersedia';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(
        date
      );
}
function formatDateTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
}
function getNaskahTypeLabel(value?: string) {
  const labels: Record<string, string> = {
    ND: 'Nota Dinas',
    SDI: 'Surat Dinas Internal',
    SDE: 'Surat Dinas Eksternal',
    DI: 'Disposisi',
    K: 'Konsep',
  };
  return labels[String(value || '').toUpperCase()] || value || '-';
}
function getSourceLabel(value?: string) {
  return value === 'terkirim' ? 'Terkirim' : value === 'kotak_masuk' ? 'Kotak Masuk' : 'Siap Arsip';
}
function sourceBadgeClass(value?: string) {
  return value === 'terkirim'
    ? 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400'
    : 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400';
}
function getNaskahDetailLink(row: Record<string, any>) {
  const section = row.sumber === 'terkirim' ? 'terkirim' : 'kotak-masuk';
  return `/korespondensi/${section}/${row.naskahId}?jenis=${encodeURIComponent(row.naskahTipe || '')}`;
}

async function fetchBerkas() {
  const response = await getBerkasById(berkasId.value);
  const payload = unwrapEnvelope<Record<string, any>>(response);
  if (!payload?.id) throw new Error('Data detail berkas tidak ditemukan pada respons server.');
  berkas.value = payload;
}
async function fetchNaskah() {
  const requestId = ++naskahRequestId;
  naskahPending.value = true;
  try {
    const response = await getDaftarNaskah(berkasId.value, {
      search: naskahSearch.value.trim() || undefined,
      page: naskahPage.value,
      limit: naskahPerPage,
    });
    if (requestId !== naskahRequestId) return;
    const { rows, meta } = unwrapPaginated(response);
    naskahList.value = rows;
    naskahTotal.value = Number(meta.total ?? rows.length);
  } catch (error) {
    if (requestId === naskahRequestId) {
      naskahList.value = [];
      naskahTotal.value = 0;
      toast.add({
        title: 'Daftar naskah gagal dimuat',
        description: getErrorMessage(error, 'Silakan coba kembali.'),
        color: 'error',
      });
    }
  } finally {
    if (requestId === naskahRequestId) naskahPending.value = false;
  }
}
async function loadPage() {
  pending.value = true;
  loadError.value = '';
  try {
    await Promise.all([fetchBerkas(), fetchNaskah()]);
  } catch (error) {
    berkas.value = null;
    loadError.value = getErrorMessage(error, 'Terjadi kesalahan saat mengambil data dari server.');
  } finally {
    pending.value = false;
  }
}
async function fetchVerifikasi() {
  try {
    const response = await getVerifikasiDetail(berkasId.value);
    const payload = unwrapEnvelope<any>(response);
    verifikasiList.value = Array.isArray(payload) ? payload : [];
  } catch {
    verifikasiList.value = [];
  }
}
async function fetchCandidates() {
  const requestId = ++candidateRequestId;
  candidatePending.value = true;
  try {
    let rows: any[];
    if (addNaskahTab.value === 'siap_arsip') {
      const response = await getNaskahSiapArsip(berkasId.value, {
        search: candidateSearch.value.trim() || undefined,
        page: 1,
        limit: 100,
      });
      rows = unwrapPaginated(response).rows.map((r: any) => ({ ...r, sumber: r.sumber }));
      // Tandai naskah yang sudah ada di berkas lain (BE Task 3)
      if (rows.length) {
        const statusMap = await getBerkasStatusByNaskah(rows.map((r) => r.id));
        const arr: any[] = unwrapEnvelope<any>(statusMap) || [];
        const byId = new Map(arr.map((x: any) => [x.naskah_id, x]));
        rows = rows.map((r) => {
          const s = byId.get(r.id);
          return {
            ...r,
            sudah_masuk_berkas: s ? 1 : 0,
            kode_berkas: s?.kode_berkas || null,
            berkas_status: s?.berkas_status || null,
          };
        });
      }
    } else {
      const response = await getNaskahSaya(addNaskahTab.value, {
        search: candidateSearch.value.trim() || undefined,
        page: 1,
        limit: 100,
      });
      const payload = unwrapEnvelope<any>(response);
      rows = (Array.isArray(payload) ? payload : payload?.data || []).map((r: any) => ({
        ...r,
        sumber: addNaskahTab.value === 'terkirim' ? 'terkirim' : 'kotak_masuk',
      }));
    }
    if (requestId !== candidateRequestId) return;
    candidateList.value = rows;
  } catch (error) {
    if (requestId === candidateRequestId) {
      candidateList.value = [];
      toast.add({
        title: 'Naskah gagal dimuat',
        description: getErrorMessage(error, 'Coba lagi.'),
        color: 'error',
      });
    }
  } finally {
    if (requestId === candidateRequestId) candidatePending.value = false;
  }
}
async function handleActivateBerkas() {
  isActivating.value = true;
  try {
    await activateBerkas(berkasId.value);
    await fetchBerkas();
    toast.add({
      title: 'Berkas berhasil diaktifkan',
      description: 'Aksi Tambah Naskah dan Ajukan Penutupan kini tersedia.',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Gagal mengaktifkan berkas',
      description: getErrorMessage(error, 'Silakan coba kembali.'),
      color: 'error',
    });
  } finally {
    isActivating.value = false;
  }
}
function openAddNaskahModal() {
  selectedNaskahSumber.value = {};
  candidateSearch.value = '';
  addNaskahTab.value = 'siap_arsip';
  showAddNaskahModal.value = true;
  fetchCandidates();
}
function isNaskahSelected(id: string) {
  return Object.prototype.hasOwnProperty.call(selectedNaskahSumber.value, id);
}
function toggleNaskahSelection(row: any) {
  const id = row.id;
  if (isNaskahSelected(id)) {
    const copy = { ...selectedNaskahSumber.value };
    delete copy[id];
    selectedNaskahSumber.value = copy;
  } else {
    selectedNaskahSumber.value = { ...selectedNaskahSumber.value, [id]: row.sumber };
  }
}
async function handleAddNaskah() {
  const entries = Object.entries(selectedNaskahSumber.value);
  if (!entries.length) return;
  isSubmittingNaskah.value = true;
  try {
    const bySource = entries.reduce<Record<string, string[]>>((groups, [id, sumber]) => {
      (groups[sumber] ||= []).push(id);
      return groups;
    }, {});
    await Promise.all(
      Object.entries(bySource).map(([sumber, naskah_ids]) =>
        addNaskahToBerkas(berkasId.value, { sumber, naskah_ids })
      )
    );
    toast.add({
      title: `${entries.length} naskah berhasil ditambahkan`,
      color: 'success',
    });
    showAddNaskahModal.value = false;
    selectedNaskahSumber.value = {};
    naskahPage.value = 1;
    await fetchNaskah();
  } catch (error) {
    toast.add({
      title: 'Gagal menambahkan naskah',
      description: getErrorMessage(error, 'Coba lagi.'),
      color: 'error',
    });
  } finally {
    isSubmittingNaskah.value = false;
  }
}
function requestRemoveNaskah(row: Record<string, any>) {
  selectedNaskah.value = row;
  showRemoveModal.value = true;
}
async function handleRemoveNaskah() {
  if (!selectedNaskah.value?.naskahId) return;
  isRemovingNaskah.value = true;
  try {
    await removeNaskahFromBerkas(berkasId.value, selectedNaskah.value.naskahId);
    toast.add({ title: 'Naskah berhasil dikeluarkan dari berkas', color: 'success' });
    showRemoveModal.value = false;
    selectedNaskah.value = null;
    await fetchNaskah();
  } catch (error) {
    toast.add({
      title: 'Gagal mengeluarkan naskah',
      description: getErrorMessage(error, 'Silakan coba kembali.'),
      color: 'error',
    });
  } finally {
    isRemovingNaskah.value = false;
  }
}
function printPage() {
  window.print();
}
watch(naskahSearch, () => {
  clearTimeout(naskahSearchTimer);
  naskahSearchTimer = setTimeout(() => {
    if (naskahPage.value !== 1) naskahPage.value = 1;
    else fetchNaskah();
  }, 350);
});
watch(naskahPage, fetchNaskah);
watch(addNaskahTab, () => {
  selectedNaskahSumber.value = {};
  fetchCandidates();
});
watch(candidateSearch, () => {
  if (!showAddNaskahModal.value) return;
  clearTimeout(candidateSearchTimer);
  candidateSearchTimer = setTimeout(fetchCandidates, 350);
});
watch(berkasId, loadPage);
watch(activeTab, (tab) => {
  if (tab === 'timeline' && verifikasiList.value.length === 0) fetchVerifikasi();
});
onMounted(loadPage);
onBeforeUnmount(() => {
  clearTimeout(naskahSearchTimer);
  clearTimeout(candidateSearchTimer);
});
</script>
