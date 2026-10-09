interface PendingTteResult {
  status: string;
  signingUrl?: string | null;
  expiresAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
  completionError?: string | null;
}

type PendingTteFeedback =
  | { kind: 'redirect'; url: string }
  | {
      kind: 'toast';
      color: 'success' | 'error' | 'warning' | 'info';
      title: string;
      description?: string;
      errorDetail?: string;
    };

/** A successful status request does not mean the document was signed. */
export function pendingTteFeedback(
  result: PendingTteResult,
  resume = false,
  naskahStatus?: string
): PendingTteFeedback {
  if (result.completionError || result.status === 'FAILED') {
    return {
      kind: 'toast',
      color: 'error',
      title: 'df_tte_failed',
      description: naskahStatus === 'draf' ? 'df_tte_back_to_draft' : undefined,
      errorDetail: result.completionError || result.errorMessage || undefined,
    };
  }
  if (naskahStatus === 'draf') {
    return {
      kind: 'toast',
      color: 'warning',
      title: 'df_tte_not_completed',
      description: 'df_tte_back_to_draft',
    };
  }
  if (['CANCELLED', 'EXPIRED', 'PARTIAL'].includes(result.status)) {
    return {
      kind: 'toast',
      color: 'warning',
      title: 'df_tte_not_completed',
      description: result.status === 'PARTIAL' ? 'df_tte_partial' : 'df_tte_ended',
    };
  }
  if (result.status === 'SIGNED' && result.completedAt) {
    return { kind: 'toast', color: 'success', title: 'df_tte_completed' };
  }
  if (['PROCESSING', 'RECONCILING', 'SIGNED'].includes(result.status)) {
    return {
      kind: 'toast',
      color: 'info',
      title: 'df_tte_processing',
      description: 'df_tte_processing_detail',
    };
  }
  const live =
    ['PENDING', 'OPENED'].includes(result.status) &&
    (!result.expiresAt || new Date(result.expiresAt).getTime() > Date.now());
  if (resume && live && result.signingUrl) {
    return { kind: 'redirect', url: result.signingUrl };
  }
  return {
    kind: 'toast',
    color: resume || !live ? 'warning' : 'info',
    title: resume || !live ? 'df_tte_resume_unavailable' : 'df_tte_waiting',
    description: 'df_tte_not_signed',
  };
}
