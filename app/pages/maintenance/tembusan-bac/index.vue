<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900">
    <PageHeader title="Tembusan Berita Acara" :items="breadcrumbItems" />

    <div
      class="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20"
    >
      <div class="flex items-start gap-3">
        <UIcon
          name="i-lucide-info"
          class="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400"
        />
        <div>
          <p class="text-sm font-semibold text-blue-900 dark:text-blue-200">Tembusan BAC</p>
          <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
            Halaman ini bersifat read-only. Anda menerima informasi BAC sebagai tembusan dan tidak
            perlu melakukan tanda tangan.
          </p>
        </div>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div
        class="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Menunggu TTE
        </p>
        <p class="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-100">{{ waitingCount }}</p>
      </div>
      <div
        class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-900/20"
      >
        <p
          class="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
        >
          Sudah Ditandatangani
        </p>
        <p class="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-100">
          {{ signedCount }}
        </p>
      </div>
    </div>

    <div
      class="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div v-if="loading" class="space-y-3 p-5">
        <div
          v-for="n in 3"
          :key="n"
          class="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700"
        />
      </div>

      <div
        v-else-if="rows.length === 0"
        class="px-5 py-12 text-center text-gray-500 dark:text-gray-400"
      >
        <UIcon name="i-lucide-copy" class="mx-auto mb-3 h-10 w-10 opacity-40" />
        <p class="text-sm">Belum ada BAC yang diterima sebagai tembusan.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[#457fb6] text-left text-white">
            <tr>
              <th class="px-5 py-3 font-semibold">Nomor Usulan</th>
              <th class="px-5 py-3 font-semibold">Arsip</th>
              <th class="px-5 py-3 font-semibold">Pihak Pertama</th>
              <th class="px-5 py-3 font-semibold">Status TTE</th>
              <th class="px-5 py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              class="border-b border-gray-100 last:border-0 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
            >
              <td class="whitespace-nowrap px-5 py-4 font-medium text-gray-800 dark:text-gray-100">
                {{ row.nomorUsulan }}
                <div class="text-xs font-normal text-gray-500 dark:text-gray-400">
                  {{ row.beritaAcaraNomor || 'Nomor BAC belum tersedia' }}
                </div>
              </td>
              <td class="max-w-md px-5 py-4 text-gray-600 dark:text-gray-300">
                <div class="font-medium">{{ row.arsipKode || '-' }}</div>
                <div class="truncate text-xs text-gray-500 dark:text-gray-400">
                  {{ row.arsipPerihal }}
                </div>
              </td>
              <td class="px-5 py-4 text-gray-600 dark:text-gray-300">
                <div class="font-medium">{{ row.bacPihakPertamaName || '-' }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ row.bacPihakPertamaJabatan || '-' }}
                </div>
              </td>
              <td class="whitespace-nowrap px-5 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="
                    row.bacStatus === 'SUDAH_DITANDATANGANI'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  "
                >
                  {{
                    row.bacStatus === 'SUDAH_DITANDATANGANI'
                      ? 'Sudah ditandatangani'
                      : 'Menunggu tanda tangan'
                  }}
                </span>
                <div v-if="row.bacSignedAt" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(row.bacSignedAt) }}
                </div>
              </td>
              <td class="px-5 py-4 text-center">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  @click="openBac(row)"
                >
                  <UIcon name="i-lucide-eye" class="h-3.5 w-3.5" />
                  {{ row.beritaAcaraUrl ? 'Lihat BAC' : 'Lihat Detail' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="selectedRow"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="selectedRow = null"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Detail Tembusan BAC</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ selectedRow.nomorUsulan }}
            </p>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            @click="selectedRow = null"
          >
            <UIcon name="i-lucide-x" class="h-5 w-5" />
          </button>
        </div>

        <dl class="mt-5 space-y-3 text-sm">
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Arsip</dt>
            <dd class="font-medium text-gray-900 dark:text-white">
              {{ selectedRow.arsipKode || '-' }} — {{ selectedRow.arsipPerihal }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Pihak pertama</dt>
            <dd class="font-medium text-gray-900 dark:text-white">
              {{ selectedRow.bacPihakPertamaName || '-' }} —
              {{ selectedRow.bacPihakPertamaJabatan || '-' }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Status</dt>
            <dd class="font-medium text-gray-900 dark:text-white">
              {{
                selectedRow.bacStatus === 'SUDAH_DITANDATANGANI'
                  ? `Sudah ditandatangani${selectedRow.bacSignedAt ? ` pada ${formatDate(selectedRow.bacSignedAt)}` : ''}`
                  : 'Menunggu tanda tangan pihak pertama'
              }}
            </dd>
          </div>
        </dl>

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200"
            @click="selectedRow = null"
          >
            Tutup
          </button>
          <a
            v-if="selectedRow.beritaAcaraUrl"
            :href="selectedRow.beritaAcaraUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 rounded-lg bg-[#457fb6] px-4 py-2 text-sm text-white hover:bg-[#3a6d9c]"
          >
            <UIcon name="i-lucide-download" class="h-4 w-4" /> Lihat / Unduh BAC
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useApi } from '~/composables/useApi';
import type { BacTembusanListItem } from '~/types/transfer-active-to-inactive';

definePageMeta({ middleware: ['auth', 'evp-or-above'] });

const { apiGet } = useApi();
const toast = useToast();
const rows = ref<BacTembusanListItem[]>([]);
const selectedRow = ref<BacTembusanListItem | null>(null);
const loading = ref(false);

const breadcrumbItems = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/tembusan-bac' },
  { label: 'Tembusan Berita Acara', to: '/maintenance/tembusan-bac' },
];

const waitingCount = computed(
  () => rows.value.filter((row) => row.bacStatus === 'MENUNGGU_TANDA_TANGAN').length
);
const signedCount = computed(
  () => rows.value.filter((row) => row.bacStatus === 'SUDAH_DITANDATANGANI').length
);

const formatDate = (value: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(
    new Date(value)
  );
};

const loadRows = async () => {
  loading.value = true;
  try {
    const res: any = await apiGet(
      '/transfer-active-to-inactive/tembusan-list',
      {},
      { skipCache: true }
    );
    rows.value = Array.isArray(res?.data) ? res.data : [];
  } catch (error: any) {
    rows.value = [];
    toast.add({
      title: 'Gagal memuat tembusan BAC',
      description: error?.response?.data?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const openBac = (row: BacTembusanListItem) => {
  selectedRow.value = row;
};

onMounted(loadRows);
</script>
