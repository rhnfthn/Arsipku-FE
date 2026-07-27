/**
 * Type data untuk "Riwayat Aktivitas Saya" (Admin & User).
 * Tidak menampilkan field sensitif seperti old_value, new_value, metadata.
 */

export interface MyActivity {
  id: string;
  createdAt: string;
  action: string;
  module: string;
  description: string | null;
  status: 'SUCCESS' | 'FAILED' | 'ERROR' | 'DENIED';
  ipAddress: string | null;
  userAgent: string | null;
  device?: string | null;
  entityType: string | null;
  entityId: string | null;
}

export interface MyActivityFilter {
  fromDate?: string;
  toDate?: string;
  action?: string;
  module?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MyActivityMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}