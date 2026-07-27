<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Anomali / Alert" :items="items" />
    </div>

    <!-- Summary Cards -->
    <div class="mb-4">
      <AnomalyCard :summary="anomalySummary" />
    </div>

    <!-- Filter bar -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <!-- Status -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
          <select
            v-model="filter.status"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
            @change="reload"
          >
            <option value="">Semua</option>
            <option value="NEW">Baru</option>
            <option value="REVIEWING">Sedang Ditinjau</option>
            <option value="RESOLVED">Selesai</option>
            <option value="IGNORED">Diabaikan</option>
          </select>
        </div>
        <!-- Severity -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Severity</label>
          <select
            v-model="filter.severity"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
            @change="reload"
          >
            <option value="">Semua</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <!-- Pencarian -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pencarian</label>
          <div class="relative">
            <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              v-model="filter.search"
              type="text"
              placeholder="Cari judul, deskripsi, user..."
              class="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
              @keydown.enter="reload"
            />
          </div>
        </div>
        <!-- Buttons -->
        <div class="flex items-end gap-2">
          <button
            @click="reload"
            class="h-10 px-4 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap flex-1"
          >
            <UIcon name="i-lucide-eye" class="w-4 h-4 mr-1 inline" />
            Tampilkan
          </button>
          <button
            @click="resetFilter"
            class="h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap flex-1"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <AnomalyTable
        :rows="anomalies"
        :loading="loading"
        :page="filter.page || 1"
        :limit="filter.limit || 20"
        @view="openDetail"
        @resolve="onResolve"
        @ignore="onIgnore"
      />

      <!-- Pagination -->
      <div
        v-if="meta && meta.total > 0"
        class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-3"
      >
        <!-- Info kiri -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }}
          dari <span class="font-medium text-gray-700 dark:text-gray-300">{{ meta.total }}</span> alert
        </div>

        <!-- Navigasi kanan -->
        <div v-if="meta.totalPages > 1" class="flex items-center gap-1">
          <!-- Previous -->
          <button
            :disabled="meta.page <= 1"
            @click="goPage(meta.page - 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
            Prev
          </button>

          <!-- Page Numbers -->
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

          <!-- Next -->
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
        v-if="showDetail && selectedAnomaly"
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-10 sm:pt-20"
        @click.self="showDetail = false"
      >
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
          <!-- Modal Header -->
          <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Detail Anomali</h3>
            <button
              @click="showDetail = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="overflow-y-auto px-5 py-4 space-y-4 flex-1">
            <!-- Title + Badges -->
            <div>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-2">{{ selectedAnomaly.title }}</h4>
              <div class="flex flex-wrap gap-2">
                <span :class="severityBadge(selectedAnomaly.severity)">{{ selectedAnomaly.severity }}</span>
                <span :class="statusBadge(selectedAnomaly.status)">{{ statusLabel(selectedAnomaly.status) }}</span>
                <span class="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
                  {{ anomalyTypeLabel(selectedAnomaly.anomalyType) }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <div v-if="selectedAnomaly.description">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Deskripsi</label>
              <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{{ selectedAnomaly.description }}</p>
            </div>

            <!-- User Info -->
            <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Informasi User</label>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Nama: </span>
                  <span class="text-gray-900 dark:text-white font-medium">{{ selectedAnomaly.userName || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Role: </span>
                  <span class="text-gray-900 dark:text-white font-medium">{{ selectedAnomaly.userRole || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Persnum: </span>
                  <span class="text-gray-900 dark:text-white font-medium">{{ selectedAnomaly.persnum || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">IP Address: </span>
                  <span class="text-gray-900 dark:text-white font-medium font-mono text-xs">{{ selectedAnomaly.ipAddress || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Evidence (JSON) -->
            <div v-if="selectedAnomaly.evidence !== null && selectedAnomaly.evidence !== undefined">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Evidence</label>
              <pre class="mt-1 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs overflow-x-auto text-gray-700 dark:text-gray-300 font-mono max-h-48">{{ formatJson(selectedAnomaly.evidence) }}</pre>
            </div>

            <!-- Riwayat Waktu -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Dibuat</label>
                <p class="text-gray-900 dark:text-white">{{ formatDate(selectedAnomaly.createdAt) }}</p>
              </div>
              <div v-if="selectedAnomaly.resolvedAt">
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Diselesaikan</label>
                <p class="text-gray-900 dark:text-white">{{ formatDate(selectedAnomaly.resolvedAt) }}</p>
              </div>
            </div>

            <!-- Handling Note -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Catatan Penanganan</label>
              <textarea
                v-model="handlingNote"
                rows="3"
                placeholder="Tambahkan catatan penanganan..."
                class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none resize-none"
              />
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-end gap-2">
            <button
              v-if="selectedAnomaly.status === 'NEW' || selectedAnomaly.status === 'REVIEWING'"
              @click="onModalResolve"
              :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
            >
              <UIcon name="i-lucide-check" class="w-4 h-4 mr-1 inline" />
              Tandai Resolved
            </button>
            <button
              v-if="selectedAnomaly.status === 'NEW' || selectedAnomaly.status === 'REVIEWING'"
              @click="onModalIgnore"
              :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" />
              Tandai Ignored
            </button>
            <button
              @click="showDetail = false"
              class="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
import { useAudit } from '~/composables/useAudit';
import type { AuditAnomaly, AnomalyFilter, AnomalySeverity, AnomalyStatus } from '~/types/audit';

definePageMeta({ middleware: ['auth', 'audit-admin'] });

const {
  fetchAnomalies,
  fetchAnomalySummary,
  updateAnomalyStatus,
  anomalies,
  anomalySummary,
  loading,
  meta,
} = useAudit();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Administrasi', to: '/admin/audit' },
  { label: 'Anomali / Alert', to: '/admin/audit/anomaly' },
];

const filter = reactive<AnomalyFilter>({
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'DESC',
});

const showDetail = ref(false);
const selectedAnomaly = ref<AuditAnomaly | null>(null);
const handlingNote = ref('');
const updatingStatus = ref(false);

// Visible page numbers with ellipsis
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

const loadAnomalies = async () => {
  try {
    await Promise.all([fetchAnomalies({ ...filter }), fetchAnomalySummary()]);
  } catch (e) {
    console.error('Gagal memuat anomali:', e);
  }
};

const reload = () => {
  filter.page = 1;
  loadAnomalies();
};

const resetFilter = () => {
  filter.status = undefined;
  filter.severity = undefined;
  filter.search = undefined;
  filter.page = 1;
  loadAnomalies();
};

const goPage = (page: number) => {
  filter.page = page;
  loadAnomalies();
};

const openDetail = (row: AuditAnomaly) => {
  selectedAnomaly.value = row;
  handlingNote.value = row.handlingNote || '';
  showDetail.value = true;
};

const onResolve = async (row: AuditAnomaly) => {
  if (!confirm(`Tandai anomali "${row.title}" sebagai RESOLVED?`)) return;
  try {
    await updateAnomalyStatus(row.id, { status: 'RESOLVED' });
    await loadAnomalies();
  } catch (e) {
    console.error('Gagal resolve anomali:', e);
    alert('Gagal memperbarui status anomali');
  }
};

const onIgnore = async (row: AuditAnomaly) => {
  if (!confirm(`Abaikan anomali "${row.title}"?`)) return;
  try {
    await updateAnomalyStatus(row.id, { status: 'IGNORED' });
    await loadAnomalies();
  } catch (e) {
    console.error('Gagal ignore anomali:', e);
    alert('Gagal memperbarui status anomali');
  }
};

const onModalResolve = async () => {
  if (!selectedAnomaly.value) return;
  updatingStatus.value = true;
  try {
    await updateAnomalyStatus(selectedAnomaly.value.id, {
      status: 'RESOLVED',
      handlingNote: handlingNote.value || null,
    });
    showDetail.value = false;
    await loadAnomalies();
  } catch (e) {
    console.error('Gagal resolve anomali:', e);
    alert('Gagal memperbarui status anomali');
  } finally {
    updatingStatus.value = false;
  }
};

const onModalIgnore = async () => {
  if (!selectedAnomaly.value) return;
  updatingStatus.value = true;
  try {
    await updateAnomalyStatus(selectedAnomaly.value.id, {
      status: 'IGNORED',
      handlingNote: handlingNote.value || null,
    });
    showDetail.value = false;
    await loadAnomalies();
  } catch (e) {
    console.error('Gagal ignore anomali:', e);
    alert('Gagal memperbarui status anomali');
  } finally {
    updatingStatus.value = false;
  }
};

// --- Formatters & Badge helpers ---
const formatDate = (d: string | Date) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatJson = (val: any) => {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'string') {
    try { return JSON.stringify(JSON.parse(val), null, 2); } catch { return val; }
  }
  try { return JSON.stringify(val, null, 2); } catch { return String(val); }
};

const statusLabel = (s: string) => {
  const m: Record<string, string> = { NEW: 'Baru', REVIEWING: 'Sedang Ditinjau', RESOLVED: 'Selesai', IGNORED: 'Diabaikan' };
  return m[s] || s;
};

const anomalyTypeLabel = (t: string) => {
  const m: Record<string, string> = {
    LOGIN_BRUTE_FORCE: 'Brute Force Login',
    ACCESS_DENIED_REPEATED: 'Akses Ditolak Berulang',
    SENSITIVE_DELETE: 'Hapus Data Sensitif',
    RBAC_CHANGE: 'Perubahan Hak Akses',
    MASS_DOWNLOAD: 'Download Massal',
    OFF_HOURS_ACCESS: 'Akses Di Luar Jam Kerja',
    UNAUTHORIZED_STATUS_CHANGE: 'Perubahan Status Tanpa Otorisasi',
  };
  return m[t] || t;
};

const severityBadge = (severity: AnomalySeverity) => {
  const map: Record<string, string> = {
    LOW: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium',
    MEDIUM: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 font-medium',
    HIGH: 'px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-medium',
    CRITICAL: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium',
  };
  return map[severity] || map.LOW;
};

const statusBadge = (status: AnomalyStatus) => {
  const map: Record<string, string> = {
    NEW: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium',
    REVIEWING: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium',
    RESOLVED: 'px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium',
    IGNORED: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium',
  };
  return map[status] || map.NEW;
};

onMounted(() => {
  loadAnomalies();
});
</script>