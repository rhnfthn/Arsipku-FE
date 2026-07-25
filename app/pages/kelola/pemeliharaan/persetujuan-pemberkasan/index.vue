<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5 min-h-screen px-5">
    <div class="mb-5">
      <PageHeader
        title="Persetujuan Penutupan Berkas"
        :items="[
          { label: 'Kelola' },
          { label: 'Pemeliharaan' },
          { label: 'Persetujuan Pemberkasan' },
        ]"
      />
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Tinjau pengajuan penutupan berkas yang menunggu persetujuan Anda.
      </p>
    </div>

    <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-50 text-warning-600 dark:bg-warning-950/40"
          >
            <Clock3 class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Menunggu Persetujuan</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ statistik?.menunggu ?? 0 }}</p>
          </div>
        </div>
      </div>
      <div
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-950/40"
          >
            <FolderCheck class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Disetujui Hari Ini</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ statistik?.disetujui_hari_ini ?? 0 }}</p>
          </div>
        </div>
      </div>
      <div
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-error-50 text-error-600 dark:bg-error-950/40"
          >
            <ShieldCheck class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Ditolak</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ statistik?.ditolak ?? 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div
      class="rounded-lg border border-gray-200 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800"
    >
      <DataToolbar
        v-model="perPage"
        v-model:search="search"
        search-placeholder="Cari nama, kode, atau klasifikasi berkas…"
        :rows-choices="[10, 25, 50]"
        :show-export="false"
        @refresh="fetchData"
      />

      <DataTable
        :columns="columns"
        :rows="pengajuanList"
        :loading="pending"
        empty-message="Tidak ada pengajuan penutupan yang menunggu persetujuan Anda."
      >
        <template #cell-judulBerkas="{ row }">
          <div class="min-w-52">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ row.berkas?.judulBerkas || '-' }}
            </p>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ row.berkas?.klasifikasiTeks || row.berkas?.klasifikasi || '-' }}
            </p>
          </div>
        </template>
        <template #cell-kodeBerkas="{ row }">
          <span class="font-mono text-xs">{{ row.berkas?.kodeBerkas || '-' }}</span>
        </template>
        <template #cell-retensi="{ row }">
          <span class="text-xs"
            >{{ row.berkas?.retensiAktifTahun || 0 }}A /
            {{ row.berkas?.retensiInaktifTahun || 0 }}I</span
          >
        </template>
        <template #cell-createdAt="{ row }">
          <span class="text-xs text-gray-500 dark:text-gray-400">{{
            formatDate(row.createdAt)
          }}</span>
        </template>
        <template #cell-status>
          <span
            class="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-1 text-xs font-medium text-warning-700 dark:bg-warning-950/40 dark:text-warning-300"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-warning-500" />
            Menunggu Anda
          </span>
        </template>
        <template #cell-aksi="{ row }">
          <NuxtLink
            :to="`/kelola/pemeliharaan/persetujuan-pemberkasan/${row.berkasId || row.berkas?.id}/review`"
            class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40"
            title="Review Pengajuan"
          >
            <Eye class="h-4 w-4" />
            Review
          </NuxtLink>
        </template>
      </DataTable>

      <DataPagination
        v-model:current-page="currentPage"
        :total-items="totalItems"
        :per-page="perPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Clock3, Eye, FolderCheck, ShieldCheck } from 'lucide-vue-next';

const { getPengajuanPenutupan, getStatistikPersetujuan } = useArsipDinamis();
const toast = useToast();

const pengajuanList = ref<any[]>([]);
const pending = ref(false);
const search = ref('');
const perPage = ref(10);
const currentPage = ref(1);
const totalItems = ref(0);
const statistik = ref<{ menunggu: number; disetujui_hari_ini: number; ditolak: number } | null>(null);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const columns = [
  { key: 'judulBerkas', label: 'Nama Berkas' },
  { key: 'kodeBerkas', label: 'Kode Berkas' },
  { key: 'retensi', label: 'Retensi (A/I)' },
  { key: 'createdAt', label: 'Tanggal Pengajuan' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi' },
];

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const fetchData = async () => {
  pending.value = true;
  try {
    const [response, statsRes] = await Promise.all([
      getPengajuanPenutupan({
        search: search.value || undefined,
        page: currentPage.value,
        limit: perPage.value,
      }),
      getStatistikPersetujuan(),
    ]);

    // useApi mengembalikan envelope global `{ success, data }`, sedangkan
    // endpoint ini mengembalikan payload pagination `{ data, meta }`.
    const payload = response?.data?.data ? response.data : response;
    pengajuanList.value = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    totalItems.value = Number(payload?.meta?.total ?? pengajuanList.value.length);

    statistik.value = (statsRes?.data ?? statsRes) as any;
  } catch (e: any) {
    console.error('Gagal memuat pengajuan:', e);
    pengajuanList.value = [];
    totalItems.value = 0;
    toast.add({
      title: 'Gagal memuat persetujuan',
      description: e?.data?.message || e?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    pending.value = false;
  }
};

watch([currentPage, perPage], ([, newPerPage], [, oldPerPage]) => {
  if (newPerPage !== oldPerPage && currentPage.value !== 1) {
    currentPage.value = 1;
    return;
  }
  fetchData();
});

watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (currentPage.value !== 1) currentPage.value = 1;
    else fetchData();
  }, 350);
});

onMounted(fetchData);
</script>
