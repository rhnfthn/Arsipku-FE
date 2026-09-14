import { ref } from 'vue';
import { useApi } from './useApi';
import type {
  AuditTrail,
  AuditAnomaly,
  AuditFilter,
  AnomalyFilter,
  AuditSummary,
  AnomalySummary,
  PaginatedResponse,
  UpdateAnomalyPayload,
} from '~/types/audit';

/**
 * Helper untuk capture error ke Sentry dari composable audit.
 *
 * Sentry HANYA aktif jika NUXT_PUBLIC_SENTRY_DSN di-set. Jika tidak,
 * fungsi ini no-op (aman dipanggil kapan saja). Import dilakukan dinamis
 * agar tidak break jika @sentry/vue tidak terpasang.
 */
async function captureAuditError(
  error: unknown,
  context: { method: string; extra?: Record<string, unknown> } = { method: '' }
): Promise<void> {
  try {
    const config = useRuntimeConfig();
    const dsn = config.public.sentryDsn as string | undefined;
    if (!dsn) return; // Sentry tidak aktif → no-op

    const Sentry = await import('@sentry/vue');
    Sentry.captureException(error, {
      tags: {
        module: 'audit',
        composable: 'useAudit',
        method: context.method,
      },
      extra: context.extra,
    });
  } catch {
    // Sentry gagal load → swallow, jangan ganggu flow utama
  }
}

/**
 * Composable untuk modul Audit Trail (Super Admin).
 * Memanggil endpoint /audit/* di backend.
 */
export const useAudit = () => {
  const { apiGet, apiPost, apiPatch } = useApi();

  const logs = ref<AuditTrail[]>([]);
  const anomalies = ref<AuditAnomaly[]>([]);
  const notifications = ref<AuditAnomaly[]>([]);
  const summary = ref<AuditSummary | null>(null);
  const anomalySummary = ref<AnomalySummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const meta = ref<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

  /**
   * Ambil list log audit dengan filter & pagination.
   */
  const fetchLogs = async (filter: AuditFilter = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, any> = { ...filter };
      // Hapus key undefined agar tidak dikirim
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') {
          delete params[k];
        }
      });
      const res: any = await apiGet('/audit/logs', { params }, { skipCache: true });
      logs.value = res?.data ?? [];
      meta.value = res?.meta ?? null;
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat log audit';
      logs.value = [];
      meta.value = null;
      captureAuditError(e, { method: 'fetchLogs', extra: { filter } });
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Ambil detail satu log audit.
   */
  const fetchLogDetail = async (id: string): Promise<AuditTrail | null> => {
    try {
      const res: any = await apiGet(`/audit/logs/${id}`, {}, { skipCache: true });
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat detail log';
      captureAuditError(e, { method: 'fetchLogDetail', extra: { id } });
      throw e;
    }
  };

  /**
   * Ambil metadata lengkap log (old_value, new_value, metadata).
   */
  const fetchLogMetadata = async (id: string) => {
    try {
      const res: any = await apiGet(`/audit/logs/${id}/metadata`, {}, { skipCache: true });
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat metadata log';
      captureAuditError(e, { method: 'fetchLogMetadata', extra: { id } });
      throw e;
    }
  };

  /**
   * Ambil ringkasan dashboard audit dengan filter.
   */
  const fetchSummary = async (
    filters: {
      startDate?: string;
      endDate?: string;
      action?: string;
      module?: string;
      userRole?: string;
      search?: string;
    } = {}
  ) => {
    try {
      const params: Record<string, any> = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.action) params.action = filters.action;
      if (filters.module) params.module = filters.module;
      if (filters.userRole) params.userRole = filters.userRole;
      if (filters.search) params.search = filters.search;
      const res: any = await apiGet('/audit/report/summary', { params }, { skipCache: true });
      summary.value = res?.data ?? null;
      return res?.data;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat ringkasan audit';
      captureAuditError(e, { method: 'fetchSummary', extra: { filters } });
      throw e;
    }
  };

  /**
   * Export laporan audit (trigger download CSV).
   */
  const exportReport = async (filter: AuditFilter = {}) => {
    try {
      const params: Record<string, any> = { ...filter };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') {
          delete params[k];
        }
      });
      // apiPost mengembalikan JSON; untuk file download, kita pakai axios langsung
      // via $fetch atau window.open. Di sini kita panggil endpoint dan biarkan
      // browser menangani download via blob.
      const token = getStoredAccessToken();
      const config = useRuntimeConfig();
      const baseUrl = config.public.apiBaseUrl as string;
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
      const url = `${baseUrl}/audit/report/export${query.toString() ? `?${query.toString()}` : ''}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!resp.ok) throw new Error('Gagal export laporan');
      const blob = await resp.blob();
      const filename = `audit-trail-${Date.now()}.csv`;
      if (process.client) {
        const urlObj = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = urlObj;
        a.download = filename;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        window.URL.revokeObjectURL(urlObj);
      }
      return true;
    } catch (e: any) {
      error.value = e?.message || 'Gagal export laporan';
      captureAuditError(e, { method: 'exportReport', extra: { filter } });
      throw e;
    }
  };

  /**
   * Ambil list anomali dengan filter & pagination.
   */
  const fetchAnomalies = async (filter: AnomalyFilter = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, any> = { ...filter };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') {
          delete params[k];
        }
      });
      const res: any = await apiGet('/audit/anomalies', { params }, { skipCache: true });
      anomalies.value = res?.data ?? [];
      meta.value = res?.meta ?? null;
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat anomali';
      anomalies.value = [];
      meta.value = null;
      captureAuditError(e, { method: 'fetchAnomalies', extra: { filter } });
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Ambil detail satu anomali.
   */
  const fetchAnomalyDetail = async (id: string): Promise<AuditAnomaly | null> => {
    try {
      const res: any = await apiGet(`/audit/anomalies/${id}`, {}, { skipCache: true });
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat detail anomali';
      captureAuditError(e, { method: 'fetchAnomalyDetail', extra: { id } });
      throw e;
    }
  };

  /**
   * Update status anomali.
   */
  const updateAnomalyStatus = async (id: string, payload: UpdateAnomalyPayload) => {
    try {
      const res: any = await apiPatch(`/audit/anomalies/${id}`, payload);
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal update status anomali';
      captureAuditError(e, { method: 'updateAnomalyStatus', extra: { id, payload } });
      throw e;
    }
  };

  /**
   * Ambil notifikasi anomali terbaru untuk Super Admin.
   */
  const fetchNotifications = async (limit = 10) => {
    try {
      const res: any = await apiGet(
        '/audit/notifications',
        { params: { limit } },
        { skipCache: true }
      );
      notifications.value = res?.data ?? [];
      return res?.data ?? [];
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat notifikasi anomali';
      notifications.value = [];
      captureAuditError(e, { method: 'fetchNotifications', extra: { limit } });
      throw e;
    }
  };

  /**
   * Ambil ringkasan count anomali.
   */
  const fetchAnomalySummary = async () => {
    try {
      const res: any = await apiGet('/audit/anomalies/summary', {}, { skipCache: true });
      anomalySummary.value = res?.data ?? null;
      return res?.data;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat ringkasan anomali';
      captureAuditError(e, { method: 'fetchAnomalySummary' });
      throw e;
    }
  };

  return {
    logs,
    anomalies,
    notifications,
    summary,
    anomalySummary,
    loading,
    error,
    meta,
    fetchLogs,
    fetchLogDetail,
    fetchLogMetadata,
    fetchSummary,
    exportReport,
    fetchAnomalies,
    fetchAnomalyDetail,
    updateAnomalyStatus,
    fetchNotifications,
    fetchAnomalySummary,
  };
};
