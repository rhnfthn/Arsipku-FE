/**
 * Tipe data untuk modul Audit Trail (Super Admin).
 * Backend: arsipku-be/src/modules/audit
 */

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'LIST'
  | 'APPROVE'
  | 'REJECT'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'SIGN'
  | 'VERIFY'
  | 'GENERATE'
  | 'EXPORT'
  | 'CONFIG_CHANGE';

export type AuditModuleType =
  | 'AUTH'
  | 'USER'
  | 'RBAC'
  | 'NASKAH'
  | 'BERKAS'
  | 'DISPOSISI'
  | 'DELEGASI'
  | 'DIGSIG'
  | 'MAIL'
  | 'MASTER_DATA'
  | 'CONFIG'
  | 'USULAN_PINDAH'
  | 'FAQ'
  | 'AUDIT'
  | 'TUGAS';

export type AuditStatus = 'SUCCESS' | 'FAILED' | 'ERROR' | 'DENIED';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AnomalyStatus = 'NEW' | 'REVIEWING' | 'RESOLVED' | 'IGNORED';

export type AnomalyType =
  | 'LOGIN_BRUTE_FORCE'
  | 'ACCESS_DENIED_REPEATED'
  | 'SENSITIVE_DELETE'
  | 'RBAC_CHANGE'
  | 'MASS_DOWNLOAD'
  | 'OFF_HOURS_ACCESS'
  | 'UNAUTHORIZED_STATUS_CHANGE';

export interface AuditTrail {
  id: string;
  createdAt: string;
  userId: string | null;
  persnum: number | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  idPosition: string | null;
  unitKerja: string | null;
  action: AuditAction | string;
  module: AuditModuleType | string;
  entityType: string | null;
  entityId: string | null;
  subEntityType: string | null;
  subEntityId: string | null;
  description: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  requestUrl: string | null;
  status: AuditStatus;
  errorMessage: string | null;
  metadata: AuditTrailMetadata | any;
}

export interface ActiveAccountSession {
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
}

export interface ActiveAccount {
  persnum: number;
  name: string | null;
  username: string | null;
  userRole: string | null;
  sessionCount: number;
  lastActivityAt: string;
  expiresAt: string;
  latestActivity: AuditTrail | null;
  sessions: ActiveAccountSession[];
}

/**
 * Metadata audit trail.
 *
 * Untuk log dengan status SUCCESS / DENIED, metadata hanya berisi field
 * teknis biasa (action, module, method, path, dll).
 *
 * Untuk log dengan status FAILED / ERROR, backend menambahkan field error
 * Sentry agar frontend bisa menampilkan detail error dan link ke Sentry:
 *   - sentryIssueId (string | null) — ID issue Sentry (null jika belum di-resolve)
 *   - sentryEventId (string | null) — ID event Sentry
 *   - sentryUrl (string | null) — URL lengkap ke halaman event Sentry
 *   - errorMessage (string) — pesan error
 *   - stackTrace (string | null) — stack trace error
 *   - endpoint (string) — endpoint yang gagal (method + path)
 */
export interface AuditTrailMetadata {
  action?: string;
  module?: string;
  method?: string;
  path?: string;
  success?: boolean;
  responseMessage?: string;
  // Field error Sentry (hanya untuk status FAILED / ERROR)
  sentryIssueId?: string | null;
  sentryEventId?: string | null;
  sentryUrl?: string | null;
  errorMessage?: string;
  stackTrace?: string | null;
  endpoint?: string;
  [key: string]: any;
}

export interface AuditAnomaly {
  id: string;
  createdAt: string;
  resolvedAt: string | null;
  auditTrailId: string | null;
  anomalyType: AnomalyType | string;
  severity: AnomalySeverity;
  title: string;
  description: string | null;
  userId: string | null;
  persnum: number | null;
  userName: string | null;
  userRole: string | null;
  ipAddress: string | null;
  relatedModule: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  evidence: any;
  status: AnomalyStatus;
  handledBy: string | null;
  handlingNote: string | null;
  notificationSent: boolean;
  notificationSentAt: string | null;
}

export interface AuditFilter {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
  persnum?: number;
  userRole?: string;
  action?: AuditAction;
  module?: AuditModuleType;
  status?: AuditStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AnomalyFilter {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: AnomalyStatus;
  severity?: AnomalySeverity;
  userId?: string;
  persnum?: number;
  anomalyType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AuditSummary {
  total: number;
  /** Jumlah log yang dibuat hari ini (00:00 – 23:59:59 lokal). */
  today?: number;
  /** Jumlah log dengan status FAILED atau ERROR (sesuai filter). */
  errorCount?: number;
  /** Timestamp log terbaru (null jika belum ada log). */
  lastLogAt?: string | null;
  byStatus: { status: string; count: number }[];
  byAction: { action: string; count: number }[];
  byModule: { module: string; count: number }[];
  daily: { date: string; count: number }[];
  recentLogs: {
    id: string;
    createdAt: string;
    userName: string | null;
    userRole: string | null;
    action: string;
    module: string;
    description: string | null;
    status: string;
  }[];
}

export interface AnomalySummary {
  total: number;
  new: number;
  reviewing: number;
  resolved: number;
  ignored: number;
  bySeverity: { severity: string; count: number }[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateAnomalyPayload {
  status: AnomalyStatus;
  handlingNote?: string | null;
}
