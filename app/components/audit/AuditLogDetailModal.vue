<template>
  <Modal
    :model-value="modelValue"
    :hide-default-footer="true"
    size="xl"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #title>
      <span class="text-sm font-semibold text-gray-900 dark:text-white">Detail Log Aktivitas</span>
    </template>

    <div class="space-y-5 pb-1">
        <div v-if="loading" class="flex items-center justify-center py-10">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary" />
        </div>
        <template v-else-if="log">
          <!-- Section 1: Informasi Umum -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 pb-1 border-b border-gray-100 dark:border-gray-700">Informasi Umum</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Waktu</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(log.createdAt) }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Status</span>
                <p><span :class="statusBadge(log.status)">{{ log.status }}</span></p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">User</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ log.userName || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Persnum</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ log.persnum || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Role</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ log.userRole || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">IP Address</span>
                <p class="text-gray-900 dark:text-white font-mono text-xs">{{ formatIpAddress(log.ipAddress) }}</p>
              </div>
              <div class="col-span-2">
                <span class="text-gray-500 dark:text-gray-400 text-xs">Browser / Device</span>
                <p class="text-gray-900 dark:text-white font-medium text-xs break-words">{{ parseDevice(log.userAgent) }}</p>
              </div>
            </div>
          </div>

          <!-- Section 2: Informasi Aksi -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 pb-1 border-b border-gray-100 dark:border-gray-700">Informasi Aksi</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Aksi</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ log.action }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Modul</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ log.module }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Entity Type</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ log.entityType || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Entity ID</span>
                <p class="text-gray-900 dark:text-white font-medium break-all text-xs">{{ log.entityId || '-' }}</p>
              </div>
            </div>
            <div class="mt-2">
              <span class="text-gray-500 dark:text-gray-400 text-xs">Deskripsi</span>
              <p class="text-gray-900 dark:text-white text-sm mt-1">{{ log.description || '-' }}</p>
            </div>
          </div>

          <!-- Section 3: Perubahan Data (context-aware berdasarkan aksi) -->
          <div v-if="hasDiffData">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 pb-1 border-b border-gray-100 dark:border-gray-700">{{ diffSectionTitle }}</h4>

            <!-- UPDATE / APPROVE / REJECT / CONFIG_CHANGE: side-by-side old vs new -->
            <div v-if="isBeforeAfterAction" class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs mb-1 block">Sebelumnya</span>
                <pre class="p-3 bg-red-50 dark:bg-red-900/20 rounded text-xs overflow-x-auto text-gray-700 dark:text-gray-300 max-h-48">{{ formatJson(log.oldValue) }}</pre>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs mb-1 block">Sesudahnya</span>
                <pre class="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded text-xs overflow-x-auto text-gray-700 dark:text-gray-300 max-h-48">{{ formatJson(log.newValue) }}</pre>
              </div>
            </div>

            <!-- DELETE: oldValue saja -->
            <div v-else-if="log.action === 'DELETE'">
              <pre class="p-3 bg-red-50 dark:bg-red-900/20 rounded text-xs overflow-x-auto text-gray-700 dark:text-gray-300 max-h-48">{{ formatJson(log.oldValue) }}</pre>
            </div>

            <!-- CREATE / LOGIN / LOGOUT / VIEW / LIST / UPLOAD / DOWNLOAD / SIGN / VERIFY / GENERATE / EXPORT: newValue saja -->
            <div v-else>
              <pre class="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded text-xs overflow-x-auto text-gray-700 dark:text-gray-300 max-h-48">{{ formatJson(log.newValue) }}</pre>
            </div>
          </div>

          <!-- Jika tidak ada old/new value sama sekali -->
          <div v-else>
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 pb-1 border-b border-gray-100 dark:border-gray-700">Perubahan Data</h4>
            <p class="text-sm text-gray-400 dark:text-gray-500 italic">Tidak ada data perubahan untuk aksi ini.</p>
          </div>

          <!-- Section 4: Informasi Error (hanya untuk status FAILED / ERROR) -->
          <div v-if="isErrorStatus">
            <h4 class="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 pb-1 border-b border-red-100 dark:border-red-900/40 flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
              Informasi Error
            </h4>
            <div class="space-y-3 text-sm">
              <!-- Pesan error -->
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Pesan Error</span>
                <p class="text-red-600 dark:text-red-400 text-xs mt-1 font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded break-words">
                  {{ sentryErrorInfo.errorMessage || log.errorMessage || '-' }}
                </p>
              </div>

              <!-- Endpoint yang gagal -->
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Endpoint yang Gagal</span>
                <p class="text-gray-900 dark:text-white font-mono text-xs mt-1 break-all">
                  {{ sentryErrorInfo.endpoint || log.requestUrl || '-' }}
                </p>
              </div>

              <!-- User yang melakukan aksi -->
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">User yang Melakukan Aksi</span>
                <p class="text-gray-900 dark:text-white font-medium text-sm mt-1">
                  {{ log.userName || log.persnum || '-' }}
                  <span v-if="log.userRole" class="text-gray-500 dark:text-gray-400 font-normal"> ({{ log.userRole }})</span>
                </p>
              </div>

              <!-- Waktu error -->
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Waktu Error</span>
                <p class="text-gray-900 dark:text-white font-medium text-sm mt-1">{{ formatDate(log.createdAt) }}</p>
              </div>

              <!-- Stack trace (jika tersedia dari Sentry) -->
              <div v-if="sentryErrorInfo.stackTrace">
                <span class="text-gray-500 dark:text-gray-400 text-xs mb-1 block">Stack Trace</span>
                <pre class="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto text-gray-700 dark:text-gray-300 max-h-64 whitespace-pre-wrap break-words">{{ sentryErrorInfo.stackTrace }}</pre>
              </div>

              <!-- Sentry Event / Issue ID (jika tersedia) -->
              <div v-if="sentryErrorInfo.sentryEventId" class="grid grid-cols-2 gap-3">
                <div>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">Sentry Event ID</span>
                  <p class="text-gray-900 dark:text-white font-mono text-xs mt-1 break-all">{{ sentryErrorInfo.sentryEventId }}</p>
                </div>
                <div v-if="sentryErrorInfo.sentryIssueId">
                  <span class="text-gray-500 dark:text-gray-400 text-xs">Sentry Issue ID</span>
                  <p class="text-gray-900 dark:text-white font-mono text-xs mt-1 break-all">{{ sentryErrorInfo.sentryIssueId }}</p>
                </div>
              </div>

              <!-- Tombol Lihat Detail di Sentry -->
              <div v-if="sentryErrorInfo.sentryUrl">
                <a
                  :href="sentryErrorInfo.sentryUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-[#362d59] text-white hover:bg-[#2a2347] transition-colors"
                >
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                  Lihat Detail di Sentry
                </a>
              </div>
              <p v-else-if="isErrorStatus" class="text-xs text-gray-400 dark:text-gray-500 italic">
                Sentry tidak dikonfigurasi (SENTRY_ORG kosong) — link tidak tersedia.
              </p>
            </div>
          </div>

          <!-- Section 5: Metadata Teknis -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 pb-1 border-b border-gray-100 dark:border-gray-700">Metadata Teknis</h4>
            <div class="grid grid-cols-2 gap-3 text-sm mb-2">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Request Method</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ log.requestMethod || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Request URL</span>
                <p class="text-gray-900 dark:text-white font-medium break-all text-xs">{{ log.requestUrl || '-' }}</p>
              </div>
            </div>
            <div v-if="log.errorMessage && !isErrorStatus" class="mb-2">
              <span class="text-gray-500 dark:text-gray-400 text-xs">Error Message</span>
              <p class="text-red-600 dark:text-red-400 text-xs mt-1 font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ log.errorMessage }}</p>
            </div>
            <div v-if="log.metadata !== null && log.metadata !== undefined">
              <span class="text-gray-500 dark:text-gray-400 text-xs mb-1 block">Metadata</span>
              <pre class="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto text-gray-700 dark:text-gray-300 max-h-48">{{ formatJson(log.metadata) }}</pre>
            </div>
          </div>
        </template>
        <div v-else class="text-center text-gray-400 py-10">Log tidak ditemukan</div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AuditTrail, AuditStatus } from '~/types/audit';
import Modal from '~/components/Modal.vue';
import { formatIpAddress } from '~/utils/formatIpAddress';

const props = defineProps<{
  modelValue: boolean;
  log: AuditTrail | null;
  loading: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const hasDiffData = computed(() => {
  if (!props.log) return false;
  return (
    (props.log.oldValue !== null && props.log.oldValue !== undefined) ||
    (props.log.newValue !== null && props.log.newValue !== undefined)
  );
});

const isBeforeAfterAction = computed(() => {
  if (!props.log) return false;
  return ['UPDATE', 'APPROVE', 'REJECT', 'CONFIG_CHANGE'].includes(props.log.action);
});

/**
 * Apakah log ini berstatus FAILED / ERROR (menampilkan section Informasi Error).
 * SUCCESS dan DENIED tidak menampilkan section error.
 */
const isErrorStatus = computed(() => {
  if (!props.log) return false;
  return props.log.status === 'FAILED' || props.log.status === 'ERROR';
});

/**
 * Ekstrak info error Sentry dari metadata log.
 *
 * Backend menyimpan field berikut di metadata saat status FAILED/ERROR:
 *   - sentryIssueId (string | null)
 *   - sentryEventId (string | null)
 *   - sentryUrl (string | null) — link lengkap ke halaman event Sentry
 *   - errorMessage (string)
 *   - stackTrace (string | null)
 *   - endpoint (string)
 */
const sentryErrorInfo = computed(() => {
  const meta: any = props.log?.metadata ?? {};
  return {
    sentryIssueId: meta.sentryIssueId ?? null,
    sentryEventId: meta.sentryEventId ?? null,
    sentryUrl: meta.sentryUrl ?? null,
    errorMessage: meta.errorMessage ?? null,
    stackTrace: meta.stackTrace ?? null,
    endpoint: meta.endpoint ?? null,
  };
});

const diffSectionTitle = computed(() => {
  if (!props.log) return 'Perubahan Data';
  const titles: Record<string, string> = {
    CREATE: 'Data Dibuat',
    UPDATE: 'Perubahan Data',
    DELETE: 'Data Dihapus',
    LOGIN: 'Informasi Login',
    LOGOUT: 'Informasi Logout',
    VIEW: 'Data yang Dilihat',
    LIST: 'Daftar yang Diakses',
    UPLOAD: 'File yang Diupload',
    DOWNLOAD: 'File yang Didownload',
    APPROVE: 'Status Disetujui',
    REJECT: 'Status Ditolak',
    SIGN: 'Informasi Tanda Tangan',
    VERIFY: 'Informasi Verifikasi',
    GENERATE: 'Dokumen yang Dihasilkan',
    EXPORT: 'Laporan yang Diekspor',
    CONFIG_CHANGE: 'Perubahan Konfigurasi',
  };
  return titles[props.log.action] || 'Detail';
});

const parseDevice = (ua: string | null) => {
  if (!ua) return '-';
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

const formatDate = (d: string | Date) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('id-ID');
};

const formatJson = (val: any) => {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'string') {
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  }
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
};

const statusBadge = (status: AuditStatus) => {
  // SUCCESS: hijau, FAILED: merah, ERROR: oranye, DENIED: abu-abu
  const map: Record<string, string> = {
    SUCCESS: 'px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium',
    FAILED: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium',
    ERROR: 'px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-medium',
    DENIED: 'px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium',
  };
  return map[status] || map.SUCCESS;
};
</script>
