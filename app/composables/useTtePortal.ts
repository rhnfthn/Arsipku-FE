/**
 * Types untuk integrasi Portal TTE (client).
 * Kontrak BE: be/src/modules/tte-portal/
 */

export interface TteCallbackResponse {
  transactionId: string;
  requestId: string;
  status: string;
  message: string;
}

export interface TteTransactionStatus {
  id: string;
  idNaskah: string | null;
  jenisNaskah: string | null;
  nomorNaskah: string | null;
  requestId: string | null;
  status: string;
  openedAt: string | null;
  processingAt: string | null;
  signedAt: string | null;
  cancelledAt: string | null;
  failedAt: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  completionError: string | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

const unwrapApiResponse = <T>(response: T | ApiEnvelope<T>): T => {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return (response as ApiEnvelope<T>).data;
  }

  return response as T;
};

/**
 * Composable integrasi Portal TTE.
 *
 * Alur:
 * Signing request selalu dibuat oleh service domain backend (ND/NU/NL), bukan
 * dari sourceKey/path yang dikirim browser. Composable ini hanya membaca mode,
 * memproses callback, dan membaca status aman.
 */
export const useTtePortal = () => {
  const { apiGet, apiPost } = useApi();

  /**
   * Cek jalur TTE untuk jenis naskah (konfigurasi admin).
   * - 'bsre_direct' → tampilkan modal passphrase (alur lama)
   * - 'portal' → pilihan digital tidak meminta passphrase, lalu redirect ke Portal TTE
   */
  const getTteMode = async (jenis: string): Promise<'bsre_direct' | 'portal'> => {
    const res = await apiGet<
      { mode: 'bsre_direct' | 'portal' } | ApiEnvelope<{ mode: 'bsre_direct' | 'portal' }>
    >(`/tte-portal/mode/${encodeURIComponent(jenis)}`, {}, { skipCache: true });
    const mode = unwrapApiResponse(res).mode;
    if (mode !== 'bsre_direct' && mode !== 'portal') {
      throw new Error('Respons mode TTE tidak valid');
    }
    return mode;
  };

  /**
   * Submit callback dari halaman /tte/callback.
   * BE memvalidasi state (constant-time, one-time) lalu exchange code.
   */
  const submitCallback = async (params: {
    code: string;
    state: string;
  }): Promise<TteCallbackResponse> => {
    const res = await apiPost<TteCallbackResponse | ApiEnvelope<TteCallbackResponse>>(
      '/tte-portal/callback',
      {
        code: params.code,
        state: params.state,
      }
    );
    return unwrapApiResponse(res);
  };

  /**
   * Status transaksi signing (BE merekonsiliasi ke portal bila belum terminal).
   */
  const getTransactionStatus = async (transactionId: string): Promise<TteTransactionStatus> => {
    const res = await apiGet<TteTransactionStatus | ApiEnvelope<TteTransactionStatus>>(
      `/tte-portal/transactions/${transactionId}`,
      {},
      { skipCache: true }
    );
    return unwrapApiResponse(res);
  };

  return {
    getTteMode,
    submitCallback,
    getTransactionStatus,
  };
};
