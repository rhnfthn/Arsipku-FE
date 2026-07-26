<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Search, Eye } from 'lucide-vue-next';
import Heading from '~/components/Heading.vue';
import PageHeader from '~/components/PageHeader.vue';
import UsulanAksesBerkasBadge from '~/components/usulan-akses-berkas/UsulanAksesBerkasBadge.vue';
import AddUsulanAksesBerkas from '~/components/usulan-akses-berkas/AddUsulanAksesBerkas.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { useFeatureAccess } from '~/composables/useFeatureAccess';
import { StatusUsulan } from '~/types/usulan-akses-berkas';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Usulan Akses Berkas' });

const { t } = useI18n();
const { canAccessPage, hasPermission } = useFeatureAccess();
const { usulanList, pending, pagination, fetchList } = useUsulanAksesBerkas();
const toast = useToast();

const openAdd = ref(false);
const searchQuery = ref('');
const filterStatus = ref<string>('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: 'Usulan Akses Berkas', to: '/usulan-akses-berkas' },
]);

const statusOptions = [
  { label: 'Semua', value: '' },
  { label: 'Menunggu Verifikasi Pengusul', value: StatusUsulan.MENUNGGU_VERIFIKASI_PENGUSUL },
  { label: 'Revisi Pengusul', value: StatusUsulan.REVISI_PENGUSUL },
  { label: 'Terkirim ke Pemberi', value: StatusUsulan.TERKIRIM_KE_PEMBERI },
  { label: 'Pemilihan Berkas', value: StatusUsulan.PEMILIHAN_BERKAS },
  { label: 'Menunggu Persetujuan Pemberi', value: StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI },
  { label: 'Akses Diterbitkan', value: StatusUsulan.AKSES_DITERBITKAN },
  { label: 'Ditolak', value: StatusUsulan.DITOLAK_PENGUSUL },
];

const totalPages = computed(() =>
  Math.ceil(pagination.total / itemsPerPage.value) || 1,
);

const loadData = async () => {
  try {
    await fetchList({
      status: filterStatus.value || undefined,
      page: currentPage.value,
      limit: itemsPerPage.value,
    });
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Gagal memuat data',
      color: 'error',
    });
  }
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadData();
  }, 400);
});

watch(currentPage, () => loadData());
watch(filterStatus, () => {
  currentPage.value = 1;
  loadData();
});

const handleCreated = () => {
  openAdd.value = false;
  currentPage.value = 1;
  loadData();
  toast.add({
    title: 'Berhasil',
    description: 'Usulan akses berkas berhasil dibuat',
    color: 'success',
  });
};

const goToDetail = (id: string) => {
  navigateTo(`/usulan-akses-berkas/${id}`);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <Heading variant="heading6b">Usulan Akses Berkas</Heading>
          <PageHeader :items="breadcrumbs" />
        </div>
        <button
          v-if="hasPermission('usulan-akses-berkas', 'create')"
          @click="openAdd = true"
          class="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus class="w-4 h-4" />
          Buat Usulan
        </button>
      </div>

      <!-- Card -->
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
        <!-- Toolbar -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div class="relative flex-1 max-w-sm">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nomor usulan..."
              class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            v-model="filterStatus"
            class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Nomor Usulan</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Jenis Berkas</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Tujuan Akses</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Durasi</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Dibuat</th>
                <th class="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="pending">
                <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                  <div class="animate-pulse">Memuat data...</div>
                </td>
              </tr>
              <tr v-else-if="usulanList.length === 0">
                <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                  Belum ada usulan akses berkas
                </td>
              </tr>
              <tr
                v-for="item in usulanList"
                :key="item.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td class="px-4 py-3 font-mono text-xs text-gray-800 dark:text-gray-200">
                  {{ item.nomorUsulan }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="item.jenisBerkas === 'AKTIF'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'"
                  >
                    {{ item.jenisBerkas }}
                  </span>
                </td>
                <td class="px-4 py-3 max-w-xs truncate text-gray-700 dark:text-gray-300" :title="item.tujuanAkses">
                  {{ item.tujuanAkses }}
                </td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {{ item.durasiAkses?.replace('_', ' ') }}
                </td>
                <td class="px-4 py-3">
                  <UsulanAksesBerkasBadge :status="item.status" />
                </td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {{ formatDate(item.createdAt) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <button
                    @click="goToDetail(item.id)"
                    class="inline-flex items-center gap-1 text-primary hover:text-primary-dark text-xs font-medium"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan {{ usulanList.length }} dari {{ pagination.total }} data
          </div>
          <div class="flex items-center gap-2">
            <button
              :disabled="currentPage === 1"
              @click="currentPage--"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Sebelumnya
            </button>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <button
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <Teleport to="body">
      <AddUsulanAksesBerkas v-model="openAdd" @created="handleCreated" />
    </Teleport>
  </div>
</template>