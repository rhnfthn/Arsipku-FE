import { onMounted, onBeforeUnmount } from 'vue';

/**
 * Smart polling helper — visibility-aware.
 *
 * - Polling jalan saat tab aktif (document.visible).
 * - Otomatis pause saat user pindah tab / minimize.
 * - Resume + immediate refetch saat user balik ke tab.
 * - Auto cleanup saat component unmount.
 */
export function usePollingSmart(fn: () => unknown | Promise<unknown>, intervalMs = 60_000) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isRunning = false;

  const safeRun = async () => {
    if (isRunning) return; // prevent overlap kalau request lambat
    isRunning = true;
    try {
      await fn();
    } finally {
      isRunning = false;
    }
  };

  const start = () => {
    stop();
    intervalId = setInterval(safeRun, intervalMs);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const handleVisibility = () => {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      stop();
    } else {
      // Refetch sekali saat balik ke tab biar counter up-to-date
      void safeRun();
      start();
    }
  };

  onMounted(() => {
    if (typeof document === 'undefined') return;

    // initial fetch
    void safeRun();

    if (!document.hidden) start();

    document.addEventListener('visibilitychange', handleVisibility);
  });

  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibility);
    }
    stop();
  });

  return { start, stop, refetch: safeRun };
}
