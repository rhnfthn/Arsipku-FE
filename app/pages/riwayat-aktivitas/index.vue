<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Riwayat Aktivitas Saya" :items="items" />
    </div>

    <!-- Subtitle -->
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 -mt-2">
      Lihat aktivitas yang Anda lakukan di sistem.
    </p>

    <!-- Filter Bar -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <!-- Row 1: Dari Tgl, Sampai Tgl, Aksi, Modul -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4">
        <!-- Dari Tanggal -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Dari Tanggal</label>
          <input
            v-model="f.fromDate"
            type="date"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          />
        </div>
        <!-- Sampai Tanggal -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Sampai Tanggal</label>
          <input
            v-model="f.toDate"
            type="date"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          />
        </div>
        <!-- Aksi -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Aksi</label>
          <select
            v-model="f.action"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          >
            <option value="">Semua</option>
            <option v-for="a in actionList" :key="a" :value="a">{{ actionLabels[a] }}</option>
          </select>
        </div>
        <!-- Modul -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Modul</label>
          <select
            v-model="f.module"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          >
            <option value="">Semua</option>
            <option v-for="m in moduleList" :key="m" :value="m">{{ moduleLabels[m] }}</option>
          </select>
        </div>
      </div>

      <!-- Row 2: Status, Pencarian, Buttons -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <!-- Status -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
          <select
            v-model="f.status"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          >
            <option value="">Semua</option>
            <option value="SUCCESS">Berhasil</option>
            <option value="FAILED">Gagal</option>
            <option value="ERROR">Error</option>
            <option value="DENIED">Ditolak</option>
          </select>
        </div>
        <!-- Pencarian -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pencarian</label>
          <div class="relative">
            <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              v-model="f.search"
              type="text"
              placeholder="Cari deskripsi aktivitas..."
              class="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
              @keydown.enter="reload"
            />
          </div>
        </div>
        <!-- Buttons -->
        <div class="flex items-end gap-2">
          <button
            @click="reload"
            class="h-10 px-4 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap"
          >
            <UIcon name="i-lucide-eye" class="w-4 h-4 mr-1 inline" />
            Tampilkan
          </button>
          <button
            @click="resetFilter"
            class="h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <MyActivityTable
        :rows="activities"
        :loading="loading"
        :page="f.page || 1"
        :limit="f.limit || 10"
        @view="openDetail"
      />

      <!-- Pagination -->
      <div
        v-if="meta && meta.total > 0"
        class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-3"
      >
        <!-- Info kiri -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }}
          dari <span class="font-medium text-gray-700 dark:text-gray-300">{{ meta.total }}</span> aktivitas
        </div>

        <!-- Navigasi kanan -->
        <div v-if="meta.totalPages > 1" class="flex items-center gap-1">
          <button
            :disabled="meta.page <= 1"
            @click="goPage(meta.page - 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
            Prev
          </button>

          <template v-for="p in visiblePages" :key="p">
            <span
              v-if="p === '...'"
              class="px-2 py-1.5 text-sm text-gray-400 dark:text-gray-500"
            >...</span>
            <button
              v-else
              @click="goPage(p as number)"
              :class="[
                'min-w-[36px] px-2 py-1.5 text-sm font-medium rounded-md transition-colors',
                p === meta.page
                  ? 'bg-[#457fb6] text-white shadow-sm'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              {{ p }}
            </button>
          </template>

          <button
            :disabled="meta.page >= meta.totalPages"
            @click="goPage(meta.page + 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div
        v-if="showDetail && selectedActivity"
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-10 sm:pt-20"
        @click.self="showDetail = false"
      >
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
          <!-- Modal Header -->
          <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Detail Aktivitas</h3>
            <button
              @click="showDetail = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="overflow-y-auto px-5 py-4 space-y-3 flex-1">
            <div v-if="detailLoading" class="flex items-center justify-center py-10">
              <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-[#457fb6]" />
            </div>
            <template v-else>
            <!-- Waktu + Status -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Waktu</label>
                <p class="text-gray-900 dark:text-white font-medium">{{ formatDateTime(selectedActivity.createdAt) }}</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                <span :class="statusBadge(selectedActivity.status)">{{ statusLabel(selectedActivity.status) }}</span>
              </div>
            </div>

            <!-- Aksi + Modul -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aksi</label>
                <span class="px-2 py-0.5 text-xs rounded-full bg-[#457fb6]/10 dark:bg-[#457fb6]/20 text-[#457fb6] dark:text-[#5a9ad4] font-medium">
                  {{ actionLabels[selectedActivity.action] || selectedActivity.action }}
                </span>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Modul</label>
                <p class="text-gray-900 dark:text-white font-medium">{{ moduleLabels[selectedActivity.module] || selectedActivity.module }}</p>
              </div>
            </div>

            <!-- Deskripsi -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Deskripsi</label>
              <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{{ selectedActivity.description || '-' }}</p>
            </div>

            <!-- IP Address -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">IP Address</label>
              <p class="text-sm text-gray-900 dark:text-white font-mono">{{ selectedActivity.ipAddress || '-' }}</p>
            </div>

            <!-- Browser / Device -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Browser / Device</label>
              <p class="text-sm text-gray-700 dark:text-gray-200 break-words">
                {{ selectedActivity.device || parseUserAgent(selectedActivity.userAgent) }}
              </p>
            </div>
            </template>
          </div>

          <!-- Modal Footer -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-end">
            <button
              @click="showDetail = false"
              class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useMyActivity } from '~/composables/useMyActivity';
import type { MyActivity, MyActivityFilter } from '~/types/my-activity';

definePageMeta({ middleware: ['auth'] });

const { fetchMyActivities, fetchMyActivityDetail, activities, loading, meta } = useMyActivity();

const items = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Riwayat Aktivitas', to: '/riwayat-aktivitas' },
];

// --- Filter State ---
const f = reactive<MyActivityFilter>({
  page: 1,
  limit: 10,
  fromDate: '',
  toDate: '',
  action: '',
  module: '',
  status: '',
  search: '',
});

const showDetail = ref(false);
const selectedActivity = ref<MyActivity | null>(null);
const detailLoading = ref(false);

// --- Dropdown Options ---
const actionList = [
  'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LIST',
  'APPROVE', 'REJECT', 'UPLOAD', 'DOWNLOAD', 'SIGN', 'VERIFY',
  'GENERATE', 'EXPORT', 'CONFIG_CHANGE',
];
const moduleList = [
  'AUTH', 'USER', 'RBAC', 'NASKAH', 'BERKAS', 'DISPOSISI', 'DELEGASI',
  'DIGSIG', 'MAIL', 'MASTER_DATA', 'CONFIG', 'USULAN_PINDAH', 'FAQ', 'AUDIT',
];

const actionLabels: Record<string, string> = {
  LOGIN: 'Login', LOGOUT: 'Logout', CREATE: 'Buat Data', UPDATE: 'Ubah Data', DELETE: 'Hapus Data',
  VIEW: 'Lihat', LIST: 'Daftar', APPROVE: 'Setujui', REJECT: 'Tolak', UPLOAD: 'Unggah',
  DOWNLOAD: 'Unduh', SIGN: 'Tanda Tangan', VERIFY: 'Verifikasi', GENERATE: 'Generate',
  EXPORT: 'Ekspor', CONFIG_CHANGE: 'Ubah Konfigurasi',
};
const moduleLabels: Record<string, string> = {
  AUTH: 'Autentikasi', USER: 'Pengguna', RBAC: 'Hak Akses', NASKAH: 'Naskah',
  BERKAS: 'Berkas', DISPOSISI: 'Disposisi', DELEGASI: 'Delegasi', DIGSIG: 'Tanda Tangan Digital',
  MAIL: 'Email', MASTER_DATA: 'Data Master', CONFIG: 'Konfigurasi',
  USULAN_PINDAH: 'Usulan Pindah', FAQ: 'FAQ', AUDIT: 'Audit',
};

// --- Visible pages with ellipsis ---
const visiblePages = computed(() => {
  if (!meta.value) return [];
  const total = meta.value.totalPages;
  const current = meta.value.page;
  const pages: (number | string)[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }
  return pages;
});

// --- Load ---
const loadActivities = async () => {
  try {
    await fetchMyActivities({ ...f });
  } catch (e) {
    console.error('Gagal memuat riwayat aktivitas:', e);
  }
};

const reload = () => {
  f.page = 1;
  loadActivities();
};

const resetFilter = () => {
  f.fromDate = '';
  f.toDate = '';
  f.action = '';
  f.module = '';
  f.status = '';
  f.search = '';
  f.page = 1;
  loadActivities();
};

const goPage = (page: number) => {
  f.page = page;
  loadActivities();
};

const openDetail = async (row: MyActivity) => {
  selectedActivity.value = row;
  showDetail.value = true;
  detailLoading.value = true;
  try {
    const detail = await fetchMyActivityDetail(row.id);
    if (detail) selectedActivity.value = detail;
  } catch (e) {
    console.error('Gagal memuat detail aktivitas:', e);
  } finally {
    detailLoading.value = false;
  }
};

// --- Helpers ---
const formatDateTime = (dt: string) => {
  try {
    const d = new Date(dt);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dt; }
};

const statusLabel = (s: string) => {
  const m: Record<string, string> = { SUCCESS: 'Berhasil', FAILED: 'Gagal', ERROR: 'Error', DENIED: 'Ditolak' };
  return m[s] || s;
};

const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    SUCCESS: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium',
    FAILED: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium',
    ERROR: 'px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-medium',
    DENIED: 'px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium',
  };
  return m[s] || m.SUCCESS;
};

const parseUserAgent = (ua: string | null) => {
  if (!ua) return '-';
  // Extract browser + OS sederhana
  let browser = 'Unknown';
  let os = 'Unknown';

  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';

  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os|macos/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ios/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return `${browser} — ${os}`;
};

onMounted(() => {
  loadActivities();
});
</script>