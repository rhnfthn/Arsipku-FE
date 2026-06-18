import { ref } from 'vue';
import { useApi } from '~/composables/useApi';

interface RealtimeSummary {
  inboxCount: { count?: number } | null;
  labelCounts: Record<string, number>;
  bsreAlert: {
    isActive: boolean;
    message: string | null;
    activatedAt: string | null;
    activatedByName: string | null;
  } | null;
  generatedAt: string;
  cached?: boolean;
}

// State global agar bisa di-share antar komponen (Sidebar, AlertBsre, dll)
const summary = ref<RealtimeSummary | null>(null);
const isLoading = ref(false);
const error = ref<unknown>(null);

let inflight: Promise<void> | null = null;

export function useRealtimeSummary() {
  const { apiGet } = useApi();

  const fetchSummary = async () => {
    if (inflight) return inflight;

    isLoading.value = true;
    error.value = null;

    inflight = (async () => {
      try {
        const res = await apiGet<{ success: boolean; data: RealtimeSummary }>(
          '/dashboard/realtime',
        );
        if ((res as any)?.success) {
          summary.value = (res as any).data as RealtimeSummary;
        } else {
          // fallback: backend wrap interceptor sudah handle
          summary.value = res as unknown as RealtimeSummary;
        }
      } catch (err) {
        error.value = err;
      } finally {
        isLoading.value = false;
        inflight = null;
      }
    })();

    return inflight;
  };

  return {
    summary,
    isLoading,
    error,
    fetchSummary,
  };
}
