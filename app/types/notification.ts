// fe/app/types/notification.ts

export type NotificationType =
  | 'NASKAH_MASUK'
  | 'NASKAH_TEMBUSAN'
  | 'DISPOSISI'
  | 'DISPOSISI_SELESAI'
  | 'KONSEP_DISETUJUI'
  | 'KONSEP_DITOLAK'
  | 'PENOMORAN_USULAN'
  | 'PENOMORAN_PERSETUJUAN'
  | 'PENOMORAN_VERIFIKASI'
  | 'PENOMORAN_SELESAI'
  | 'PENOMORAN_DITOLAK'
  | 'DIGSIG_VERIFIKASI'
  | 'DIGSIG_TANDA_TANGAN'
  | 'DIGSIG_SELESAI'
  | 'DIGSIG_DITOLAK'
  | 'NASKAH_DINAS_VERIFIKATOR'
  | 'NASKAH_DINAS_VERIFIKASI_SELESAI'
  | 'NASKAH_DINAS_DITOLAK'
  | 'DELEGASI'
  | 'SYSTEM';

export type NotificationAction =
  | 'OPEN_INBOX_DETAIL'
  | 'OPEN_DISPOSISI_DETAIL'
  | 'OPEN_USULAN_PENOMORAN'
  | 'OPEN_PERSETUJUAN_PENOMORAN'
  | 'OPEN_VERIFIKASI_PENOMORAN'
  | 'OPEN_DETAIL_PENOMORAN'
  | 'OPEN_DIGSIG_VERIFIKASI'
  | 'OPEN_DIGSIG_PENANDATANGANAN'
  | 'OPEN_DIGSIG_DETAIL'
  | 'OPEN_NASKAH_DINAS_VERIFIKATOR'
  | 'OPEN_NASKAH_DINAS_DETAIL'
  | 'OPEN_DELEGASI'
  | 'OPEN_SYSTEM_ANNOUNCEMENT';

export interface NotificationData {
  action?: NotificationAction | string;
  [key: string]: any;
}

export interface NotificationItem {
  id: string;
  positionId: string;
  userPersnum: number | null;
  type: NotificationType | string;
  title: string;
  body: string;
  data: NotificationData | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationItem[];
  meta: NotificationListMeta;
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

export interface NotificationListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationFetchOptions {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}
