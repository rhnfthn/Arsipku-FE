<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronDown, Eye, Plus } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import UsulanAksesBerkasBadge from '~/components/usulan-akses-berkas/UsulanAksesBerkasBadge.vue';
import AddUsulanAksesBerkas from '~/components/usulan-akses-berkas/AddUsulanAksesBerkas.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { useAuth } from '~/composables/useAuth';
import { StatusUsulan } from '~/types/usulan-akses-berkas';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Persetujuan Usulan Akses Berkas' });

const { t } = useI18n();
const { usulanList, pending, pagination, fetchList } = useUsulanAksesBerkas();
const { user } = useAuth();
const toast = useToast();

// Helper: extract error message dari AxiosError (BE return { message: [...] | string })
const extractErrorMessage = (err: any): string => {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) {
    return beMessage.join(', ');
  }
  if (typeof beMessage === 'string' && beMessage.trim()) {
    return beMessage;
  }
  return err?.message || 'Terjadi kesalahan';
};

// Hanya Sekretaris yang didelegasikan (position_status = 'SE') yang dapat
// membuat usulan peminjaman berkas.
const isDelegatedSekretaris = computed(() => {
  return user.value?.position_status === 'SE';
});

const openAdd = ref(false);
const searchQuery = ref('');
const filterStatus = ref<string>('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

// ── Tab navigasi ─────────────────────────────────
// SE pengusul: default "Usulan Saya" (usulan yang dia buat)
// SE pemberi: default "Perlu Verifikasi Pemberi" (usulan masuk ke divisinya)
// Managerial: default "Perlu Verifikasi Saya" (usulan yang harus diverifikasi)
const activeTab = ref<'all' | 'mine' | 'verify-pemberi' | 'verify-me'>('all');

const tabs = computed(() => {
  const ps = user.value?.position_status;
  const isSE = ps === 'SE';
  const isMgr = !isSE && (() => {
    const pos = (user.value?.positionText || '').toUpperCase();
    return pos.includes('EVP') || pos.includes('AVP') || pos.includes(' VP ') || pos.startsWith('VP ') || pos === 'VP';
  })();

  const list = [
    { label: 'Semua', value: 'all' as const },
  ];

  if (isSE) {
    list.push({ label: 'Usulan Saya', value: 'mine' as const });
    list.push({ label: 'Perlu Verifikasi Pemberi', value: 'verify-pemberi' as const });
  }

  if (isMgr) {
    list.push({ label: 'Perlu Verifikasi Saya', value: 'verify-me' as const });
  }

  return list;
});

// Auto-select default tab berdasarkan peran
watchEffect(() => {
  if (activeTab.value === 'all' && tabs.value.length > 1) {
    const ps = user.value?.position_status;
    if (ps === 'SE') {
      activeTab.value = 'mine';
    } else {
      const pos = (user.value?.positionText || '').toUpperCase();
      if (pos.includes('EVP') || pos.includes('AVP') || pos.includes(' VP ') || pos.startsWith('VP ') || pos === 'VP') {
        activeTab.value = 'verify-me';
      }
    }
  }
});

// Status filter otomatis berdasarkan tab
const tabStatusFilter = computed(() => {
  switch (activeTab.value) {
    case 'verify-pemberi':
      // SE pemberi: semua usulan yang masuk ke divisinya (semua status)
      // BE sudah filter via scope=verify-pemberi (divisiPemberiId = userOrgId)
      return undefined;
    case 'verify-me':
      return undefined; // Managerial: semua usulan yang dia verifikator (BE sudah filter via findAll scope)
    case 'mine':
      return undefined; // SE pengusul: usulan yang dia buat (BE filter via pengusulPersnum)
    default:
      return undefined;
  }
});

const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: 'Persetujuan', to: '#' },
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
    // Tab filter override status filter (kecuali "Semua" yang pakai filterStatus manual)
    const status = activeTab.value === 'all'
      ? (filterStatus.value || undefined)
      : (tabStatusFilter.value || undefined);
    // Map tab ke scope BE
    const scopeMap: Record<string, string> = {
      mine: 'mine',
      'verify-pemberi': 'verify-pemberi',
      'verify-me': 'verify-me',
    };
    await fetchList({
      status,
      scope: scopeMap[activeTab.value],
      page: currentPage.value,
      limit: itemsPerPage.value,
    });
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: extractErrorMessage(err),
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
watch(activeTab, () => {
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

// ── Custom dropdown for rows per page (pemberkasan style) ───────
const openRowsPerPage = ref(false);
function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
}
function selectRowsPerPage(n: number) {
  itemsPerPage.value = n;
  openRowsPerPage.value = false;
  currentPage.value = 1;
  loadData();
}
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value = false;
}

// ── DataTable columns (pemberkasan style) ───────────────────────
const columns = [
  { key: 'nomorUsulan', label: 'Nomor Usulan' },
  { key: 'jenisBerkas', label: 'Jenis Berkas' },
  { key: 'tujuanAkses', label: 'Tujuan Akses' },
  { key: 'durasiAkses', label: 'Durasi' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Dibuat' },
  { key: 'aksi', label: 'Aksi' },
];

onMounted(() => {
  loadData();
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <div class="bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5 min-h-screen">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Persetujuan Usulan Akses Berkas
          </h1>
          <button
            v-if="isDelegatedSekretaris"
            @click="openAdd = true"
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
          >
            <UIcon name="i-lucide-plus" class="size-4" />
            Buat Usulan
          </button>
        </div>
      </template>
    </PageHeader>

    <!-- Tab Navigasi -->
    <div v-if="tabs.length > 1" class="mb-4 flex gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === tab.value
          ? 'bg-primary text-white shadow-sm dark:bg-primary-600'
          : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Main Card -->
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <!-- Toolbar -->
      <div class="flex w-full items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-700">
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <!-- Rows per page dropdown (pemberkasan style) -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleRowsPerPage"
              class="flex min-w-[70px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none transition-all hover:border-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <span>{{ itemsPerPage }}</span>
              <ChevronDown
                class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': openRowsPerPage }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openRowsPerPage"
                class="absolute left-0 top-full z-50 min-w-[80px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  v-for="n in [10, 25, 50]"
                  :key="n"
                  type="button"
                  @click.stop="selectRowsPerPage(n)"
                  :class="[
                    'w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700',
                    itemsPerPage === n
                      ? 'bg-primary/5 font-medium text-primary dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700'
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Search (pemberkasan style) -->
          <div class="relative min-w-[180px] flex-1">
            <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nomor usulan…"
              class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-500 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400 dark:focus:bg-gray-600"
            />
          </div>

          <!-- Status filter (only on "all" tab) -->
          <div v-if="activeTab === 'all'" class="relative">
            <select
              v-model="filterStatus"
              class="rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-sm text-gray-700 outline-none transition focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- DataTable (pemberkasan style) -->
      <DataTable
        :columns="columns"
        :rows="usulanList"
        :loading="pending"
        header-class="bg-primary dark:bg-primary-700 text-left text-white"
        body-class="divide-y divide-gray-100 dark:divide-gray-700"
        row-class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        empty-message="Belum ada usulan akses berkas."
      >
        <template #cell-nomorUsulan="{ row }">
          <span class="font-mono text-xs text-gray-800 dark:text-gray-200">{{ row.nomorUsulan }}</span>
        </template>
        <template #cell-jenisBerkas="{ row }">
          <span
            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
            :class="row.jenisBerkas === 'AKTIF'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'"
          >
            {{ row.jenisBerkas }}
          </span>
        </template>
        <template #cell-tujuanAkses="{ row }">
          <p class="max-w-xs truncate text-gray-700 dark:text-gray-300" :title="row.tujuanAkses">
            {{ row.tujuanAkses }}
          </p>
        </template>
        <template #cell-durasiAkses="{ row }">
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ row.durasiAkses?.replace('_', ' ') }}</span>
        </template>
        <template #cell-status="{ row }">
          <UsulanAksesBerkasBadge :status="row.status" />
        </template>
        <template #cell-createdAt="{ row }">
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #cell-aksi="{ row }">
          <NuxtLink
            :to="`/usulan-akses-berkas/${row.id}`"
            class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40"
            title="Lihat Detail"
          >
            <Eye class="h-4 w-4" />
            Detail
          </NuxtLink>
        </template>
      </DataTable>

      <!-- Pagination (pemberkasan style) -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="pagination.total"
        :per-page="itemsPerPage"
      />
    </div>

    <!-- Add Modal -->
    <Teleport to="body">
      <AddUsulanAksesBerkas v-model="openAdd" @created="handleCreated" />
    </Teleport>
  </div>
</template>