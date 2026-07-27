import { ref } from 'vue';
import { useApi } from './useApi';
import type { MyActivity, MyActivityFilter, MyActivityMeta } from '~/types/my-activity';

/**
 * Helper untuk capture error ke Sentry dari composable my-activity.
 *
 * Sentry HANYA aktif jika NUXT_PUBLIC_SENTRY_DSN di-set. Jika tidak,
 * fungsi ini no-op (aman dipanggil kapan saja).
 */
async function captureMyActivityError(
  error: unknown,
  context: { method: string; extra?: Record<string, unknown> } = { method: '' },
): Promise<void> {
  try {
    const config = useRuntimeConfig();
    const dsn = config.public.sentryDsn as string | undefined;
    if (!dsn) return; // Sentry tidak aktif → no-op

    const Sentry = await import('@sentry/vue');
    Sentry.captureException(error, {
      tags: {
        module: 'audit',
        composable: 'useMyActivity',
        method: context.method,
      },
      extra: context.extra,
    });
  } catch {
    // Sentry gagal load → swallow, jangan ganggu flow utama
  }
}

/**
 * Composable untuk "Riwayat Aktivitas Saya" (Admin & User).
 * Memanggil endpoint /audit/my-activities di backend.
 * Hanya mengembalikan log milik user yang sedang login.
 */
export const useMyActivity = () => {
  const { apiGet } = useApi();

  const activities = ref<MyActivity[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const meta = ref<MyActivityMeta | null>(null);

  /**
   * Ambil list riwayat aktivitas dengan filter & pagination.
   */
  const fetchMyActivities = async (filter: MyActivityFilter = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, any> = { ...filter };
      // Hapus key undefined/empty agar tidak dikirim
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') {
          delete params[k];
        }
      });
      const res: any = await apiGet('/audit/my-activities', { params }, { skipCache: true });
      activities.value = res?.data ?? [];
      meta.value = res?.meta ?? null;
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat riwayat aktivitas';
      activities.value = [];
      meta.value = null;
      captureMyActivityError(e, { method: 'fetchMyActivities', extra: { filter } });
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Ambil detail satu aktivitas (hanya jika milik sendiri).
   * Memanggil endpoint /audit/my-activities/:id yang strict filter by user.
   */
  const fetchMyActivityDetail = async (id: string): Promise<MyActivity | null> => {
    try {
      const res: any = await apiGet(`/audit/my-activities/${id}`, {}, { skipCache: true });
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat detail aktivitas';
      captureMyActivityError(e, { method: 'fetchMyActivityDetail', extra: { id } });
      return null;
    }
  };

  return {
    activities,
    loading,
    error,
    meta,
    fetchMyActivities,
    fetchMyActivityDetail,
  };
};