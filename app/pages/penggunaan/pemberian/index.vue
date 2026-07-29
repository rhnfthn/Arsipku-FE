<script setup lang="ts">
// Pemberian — list usulan berstatus AKSES_DITERBITKAN
// Tampilkan: divisi pemberi, periode akses, icon detail (timeline) + icon berkas
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Eye, FileText, Clock, Building2, User, Folder } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import UsulanAksesBerkasBadge from '~/components/usulan-akses-berkas/UsulanAksesBerkasBadge.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { StatusUsulan } from '~/types/usulan-akses-berkas';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Pemberian Akses Berkas' });

const { t } = useI18n();
const { usulanList, pending, pagination, fetchList } = useUsulanAksesBerkas();
const toast = useToast();

const extractErrorMessage = (err: any): string => {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) return beMessage.join(', ');
  if (typeof beMessage === 'string' && beMessage.trim()) return beMessage;
  return err?.message || 'Terjadi kesalahan';
};

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: 'Penggunaan', to: '#' },
  { label: 'Pemberian', to: '/penggunaan/pemberian' },
]);

const totalPages = computed(() => Math.ceil(pagination.total / itemsPerPage.value) || 1);

const loadData = async () => {
  try {
    await fetchList({
      status: StatusUsulan.AKSES_DITERBITKAN,
      page: currentPage.value,
      limit: itemsPerPage.value,
    });
  } catch (err: any) {
    toast.add({ title: 'Error', description: extractErrorMessage(err), color: 'error' });
  }
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage.value = 1; loadData(); }, 400);
});
watch(currentPage, () => loadData());

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const columns = [
  { key: 'nomorUsulan', label: 'Nomor Usulan' },
  { key: 'divisiPemberi', label: 'Divisi Pemberi' },
  { key: 'tanggalSelesai', label: 'Tanggal Berakhir Akses' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi' },
];

onMounted(() => { loadData(); });
</script>

<template>
  <div class="bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5 min-h-screen">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Pemberian Akses Berkas
        </h1>
      </template>
    </PageHeader>

    <div class="mt-4 rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <!-- Search -->
      <div class="flex w-full items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-700">
        <div class="relative min-w-[200px] flex-1">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
          <input v-model="searchQuery" type="text" placeholder="Cari nomor usulan…"
            class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-500 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        </div>
      </div>

      <DataTable :columns="columns" :rows="usulanList" :loading="pending"
        header-class="bg-primary dark:bg-primary-700 text-left text-white"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        empty-message="Belum ada akses berkas yang diterbitkan.">
        <template #cell-nomorUsulan="{ row }">
          <span class="font-mono text-xs text-gray-800 dark:text-gray-200">{{ row.nomorUsulan }}</span>
        </template>
        <template #cell-divisiPemberi="{ row }">
          <div class="flex items-center gap-2">
            <Building2 class="size-4 text-gray-400" />
            <div>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.divisiPemberiNama || row.divisiPemberiId }}</span>
              <p v-if="row.evpPemberiNama" class="text-xs text-gray-400">{{ row.evpPemberiNama }}</p>
            </div>
          </div>
        </template>
        <template #cell-tanggalSelesai="{ row }">
          <div class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Clock class="size-3" />
            {{ formatDate(row.tanggalSelesai) }}
          </div>
        </template>
        <template #cell-status="{ row }">
          <UsulanAksesBerkasBadge :status="row.status" />
        </template>
        <template #cell-aksi="{ row }">
          <div class="flex items-center gap-2">
            <!-- Icon mata: detail timeline -->
            <NuxtLink :to="`/penggunaan/pemberian/${row.id}`"
              class="inline-flex items-center justify-center rounded-md p-1.5 text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40"
              title="Detail Alur Usulan">
              <Eye class="size-4" />
            </NuxtLink>
            <!-- Icon kertas: detail berkas yang diberikan -->
            <NuxtLink :to="`/penggunaan/pemberian/${row.id}/berkas`"
              class="inline-flex items-center justify-center rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Berkas yang Diberikan">
              <FileText class="size-4" />
            </NuxtLink>
          </div>
        </template>
      </DataTable>

      <DataPagination v-model:current-page="currentPage" :total-items="pagination.total" :per-page="itemsPerPage" />
    </div>
  </div>
</template>