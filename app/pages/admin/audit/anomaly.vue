<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Anomali / Alert" :items="items" />
    </div>

    <!-- Filter, tabel, dan pagination digabung dalam satu card seperti Log Aktivitas -->
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <AuditLogFilter
        mode="anomaly"
        :model-value="filter"
        :can-export="canExport"
        :exporting="exporting"
        @update:model-value="syncFilter"
        @apply="onApplyFilter"
        @export="onExport"
      />
      <AuditAnomalyTable
        :rows="anomalies"
        :loading="loading"
        :page="filter.page || 1"
        :limit="filter.limit || 20"
        @view="openDetail"
        @resolve="onResolve"
        @ignore="onIgnore"
        @reviewing="onReviewing"
      />

      <DataPagination
        v-if="meta && meta.total > 0"
        :current-page="meta.page"
        :total-items="meta.total"
        :per-page="meta.limit"
        data-label="log"
        @update:current-page="goPage"
      />
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
                  <span class="text-gray-900 dark:text-white font-medium font-mono text-xs">{{ formatIpAddress(selectedAnomaly.ipAddress) }}</span>
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
              v-if="selectedAnomaly.status === 'NEW'"
              @click="onModalReviewing"
              :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              <UIcon name="i-lucide-search" class="w-4 h-4 mr-1 inline" />
              Tandai Reviewing
            </button>
            <button
              v-if="selectedAnomaly.status === 'NEW' || selectedAnomaly.status === 'REVIEWING'"
              @click="onModalResolve"
              :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
            >
              Tandai Resolved
            </button>
            <button
              v-if="selectedAnomaly.status === 'NEW' || selectedAnomaly.status === 'REVIEWING'"
              @click="onModalIgnore"
              :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
            >
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
import DataPagination from '~/components/DataPagination.vue';
import { formatIpAddress } from '~/utils/formatIpAddress';

definePageMeta({ middleware: ['auth', 'audit-admin'] });

const {
  fetchAnomalies,
  exportAnomalies,
  updateAnomalyStatus,
  anomalies,
  loading,
  meta,
} = useAudit();
const { hasPermission } = useAuth();
const canExport = computed(() => hasPermission('audit', 'export'));

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
const exporting = ref(false);

const loadAnomalies = async () => {
  try {
    await fetchAnomalies({ ...filter });
  } catch (e) {
    console.error('Gagal memuat anomali:', e);
  }
};

const syncFilter = (value: any) => {
  Object.assign(filter, value);
};

const onApplyFilter = (value: any) => {
  filter.status = undefined;
  filter.severity = undefined;
  filter.search = undefined;
  Object.assign(filter, value);
  filter.page = 1;
  loadAnomalies();
};

const onExport = async () => {
  exporting.value = true;
  try {
    await exportAnomalies({ ...filter });
  } catch (e) {
    console.error('Gagal export anomali:', e);
    alert('Gagal export anomali');
  } finally {
    exporting.value = false;
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

const onReviewing = async (row: AuditAnomaly) => {
  try {
    await updateAnomalyStatus(row.id, { status: 'REVIEWING' });
    await loadAnomalies();
  } catch (e) {
    console.error('Gagal tandai reviewing anomali:', e);
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

const onModalReviewing = async () => {
  if (!selectedAnomaly.value) return;
  updatingStatus.value = true;
  try {
    await updateAnomalyStatus(selectedAnomaly.value.id, {
      status: 'REVIEWING',
      handlingNote: handlingNote.value || null,
    });
    showDetail.value = false;
    await loadAnomalies();
  } catch (e) {
    console.error('Gagal tandai reviewing anomali:', e);
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
