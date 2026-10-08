import { useAuth } from './useAuth';

export interface FeaturePermission {
  resource: string;
  action: string;
}

// Konfigurasi Sistem dibagi per fitur agar akses Read tiap tab dapat diatur
// secara mandiri di matrix RBAC.
export const CONFIGURATION_READ_PERMISSIONS = [
  { resource: 'konfigurasi', action: 'read-digsig' },
  { resource: 'konfigurasi', action: 'read-pengumuman' },
  { resource: 'konfigurasi', action: 'read-tema' },
  { resource: 'konfigurasi', action: 'read-unit-tu' },
  { resource: 'konfigurasi', action: 'read-unit-legal' },
  { resource: 'konfigurasi', action: 'read-naskah-lainnya' },
  { resource: 'smart-search', action: 'read' },
  { resource: 'correspondence-routing', action: 'read' },
] as const;

/**
 * Map route path → required permission (resource:action).
 * Sesuai matrix Utama Super Admin.
 */
const routePermissions: Record<string, string> = {
  '/beranda': 'utama.beranda:read',
  '/korespondensi/draf': 'utama.draft:read',
  '/korespondensi/kotak-masuk': 'utama.kotak-masuk:read',
  '/korespondensi/terkirim': 'utama.terkirim:read',
  '/korespondensi/tertunda': 'utama.tertunda:read',
  '/korespondensi/tulis/disposisi': 'utama.tulis.disposisi:read',
  '/korespondensi/tulis/kajian': 'utama.tulis.kajian:read',
  '/naskah-lainnya': 'utama.tulis.naskah-lainnya.halaman-daftar-naskah:read',
  '/naskah-lainnya/tulis': 'utama.tulis.naskah-lainnya.halaman-tulis-naskah:read',
  '/naskah-lainnya/persetujuan': 'utama.tulis.naskah-lainnya.halaman-persetujuan:read',
  '/naskah-lainnya/draf': 'utama.draft:read',
  '/korespondensi/tulis/nota-dinas': 'utama.tulis.nota-dinas:read',
  '/korespondensi/tulis/surat-dinas-eksternal': 'utama.tulis.surat-dinas-eksternal:read',
  '/korespondensi/tulis/surat-dinas-internal': 'utama.tulis.surat-dinas-internal:read',
  // SDE Massal
  '/korespondensi/sde-masal': 'sde-masal:read',
  '/korespondensi/sde-masal/verifikasi': 'sde-masal:read-verification',
  // Berbagi Naskah
  '/shared/saya-bagikan': 'naskah-share:read-saya-bagikan',
  '/shared/dibagikan-kepada-saya': 'naskah-share:read-dibagikan-kepada-saya',
  '/digsig/verifikasi-dokumen': 'digsig:read-verifikasi-dokumen',
  '/digsig/penandatanganan': 'digsig:read-penandatanganan',
  '/penandatangan': 'digsig:read-penandatanganan',
  '/digsig/cek-dokumen': 'digsig:read-cek-dokumen',
  '/digsig/log-digsig': 'digsig:read-log-disdig',
  '/penyingkat-tautan': 'penyingkat-tautan:read',
  '/layanan-email': 'layanan-email:read',
  '/layanan-email/log': 'layanan-email:read-log',
  '/naskah-dinas/verifikator': 'verifikasi-naskah:read',
  '/delegasi': 'delegasi:read',
  '/titelatur': 'titelatur:read',
  '/penomoran/usulan': 'penomoran:read-usulan',
  '/usulan-penomoran': 'penomoran:read-usulan',
  '/penomoran/verifikasi': 'penomoran:read-verifikasi',
  '/penomoran/nomor': 'penomoran:read-penomoran',
  '/persetujuan-penomoran': 'penomoran:read-persetujuan',
  '/naskah-dinas': 'naskah-masuk:read-verifikasi',
  '/master/tertuju-eksternal': 'master-data:read-tertuju',
  '/administrasi/datamaster/tertuju': 'master-data:read-tertuju',
  '/administrasi/tertuju': 'master-data:read-tertuju',
  '/utilitas/tertuju': 'master-data:read-tertuju',
  '/master/perusahaan': 'master-data:read-perusahaan',
  '/master/klasifikasi': 'master-data:read-klasifikasi',
  '/master/jenis': 'master-data:read-jenis',
  '/master/grup-penerima': 'master-data:read-grup-penerima',
  // RBAC management (superadmin only, but permission check for completeness)
  '/rbac/roles': 'role:read',
  '/rbac/permissions': 'role:read',
  '/rbac/resources': 'role:read',
  '/rbac/users': 'user:read',
  // Penyusutan — setiap submenu memiliki permission Read sendiri.
  '/maintenance/penyusutan/pengajuan-penyusutan':
    'pemeliharaan.penyusutan.pengajuan:read',
  '/maintenance/penyusutan/penataan-pemusnahan':
    'pemeliharaan.penyusutan.penataan-pemusnahan:read',
  '/maintenance/penyusutan/verifikasi-penyusutan':
    'pemeliharaan.penyusutan.verifikasi:read',
  '/maintenance/penyusutan/backup-status':
    'pemeliharaan.penyusutan.penataan-pemusnahan:read',
  // Audit Trail tetap dibatasi backend untuk SUPERADMIN melalui RolesGuard.
  '/admin/audit': 'audit:read-log',
  '/admin/audit/anomaly': 'audit:read-anomaly',
  '/admin/audit/report': 'audit:read-report',
  '/laporan/rekap-naskah': 'laporan:read-rekap-naskah',
  '/laporan/detail-naskah': 'laporan:read-detail-naskah',
  '/laporan/naskah-masuk': 'laporan:read-naskah-masuk',
  '/faq/menu': 'faq:read',
  '/faq/manajemen': 'faq:read',
  '/pedoman/menu': 'pedoman:read',
  '/pedoman/manajemen': 'pedoman:read',
};

const routePermissionPatterns: { pattern: RegExp; perm: string }[] = [
  { pattern: /^\/korespondensi\/kotak-masuk\/[^/]+$/, perm: 'utama.kotak-masuk:read-detail' },
  { pattern: /^\/korespondensi\/terkirim\/[^/]+$/, perm: 'utama.terkirim:read-detail' },
  { pattern: /^\/korespondensi\/tertunda\/[^/]+$/, perm: 'utama.tertunda:read-detail' },
  { pattern: /^\/korespondensi\/draf\/[^/]+$/, perm: 'utama.draft:read-detail' },
  { pattern: /^\/korespondensi\/tulis\/konsep\/nota-dinas/, perm: 'utama.tulis.nota-dinas:read' },
  {
    pattern: /^\/korespondensi\/tulis\/konsep\/surat-dinas-internal/,
    perm: 'utama.tulis.surat-dinas-internal:read',
  },
  {
    pattern: /^\/korespondensi\/tulis\/konsep\/surat-dinas-eksternal/,
    perm: 'utama.tulis.surat-dinas-eksternal:read',
  },
  {
    pattern: /^\/korespondensi\/tulis\/finalisasi\/nota-dinas/,
    perm: 'utama.tulis.nota-dinas:read',
  },
  {
    pattern: /^\/korespondensi\/tulis\/finalisasi\/surat-dinas-internal/,
    perm: 'utama.tulis.surat-dinas-internal:read',
  },
  {
    pattern: /^\/korespondensi\/tulis\/finalisasi\/surat-dinas-eksternal/,
    perm: 'utama.tulis.surat-dinas-eksternal:read',
  },
  { pattern: /^\/korespondensi\/tulis\/lanjut\/disposisi/, perm: 'utama.tulis.disposisi:read' },
  { pattern: /^\/korespondensi\/tulis\/lanjut\/nota-dinas/, perm: 'utama.tulis.nota-dinas:read' },
  {
    pattern: /^\/korespondensi\/tulis\/lanjut\/surat-dinas-internal/,
    perm: 'utama.tulis.surat-dinas-internal:read',
  },
  {
    pattern: /^\/korespondensi\/tulis\/lanjut\/surat-dinas-eksternal/,
    perm: 'utama.tulis.surat-dinas-eksternal:read',
  },
  { pattern: /^\/korespondensi\/sde-masal\/folder\/[^/]+$/, perm: 'sde-masal:read-detail' },
  { pattern: /^\/korespondensi\/sde-masal\/[^/]+$/, perm: 'sde-masal:read-detail' },
  { pattern: /^\/korespondensi\/sde-masal\/verifikasi-detail\/[^/]+$/, perm: 'sde-masal:read-verification' },
  { pattern: /^\/korespondensi\/tulis\/sde-masal(?:\/|$)/, perm: 'sde-masal:read' },
  { pattern: /^\/shared\/saya-bagikan\/.+$/, perm: 'naskah-share:read-saya-bagikan' },
  { pattern: /^\/shared\/dibagikan-kepada-saya\/.+$/, perm: 'naskah-share:read-dibagikan-kepada-saya' },
  { pattern: /^\/master\/perusahaan\/[^/]+\/area$/, perm: 'master-data:read-perusahaan-area' },
 { pattern: /^\/master\/perusahaan\/[^/]+\/struktur$/, perm: 'master-data:read-perusahaan' },
  { pattern: /^\/naskah-lainnya\/[^/]+(?:\/[^/]+)?$/, perm: 'utama.tulis.naskah-lainnya.halaman-daftar-naskah:read' },
  // Kelola — detail pages inherit the permission of their list page
  { pattern: /^\/kelola\/pemeliharaan\/pemberkasan(?:\/|$)/, perm: 'pemeliharaan.pemberkasan:read' },
  { pattern: /^\/kelola\/pemeliharaan\/persetujuan-pemberkasan(?:\/|$)/, perm: 'pemeliharaan.verifikasi:read' },
  { pattern: /^\/kelola\/penggunaan\/(?:usulan-akses-berkas|usulan-saya)(?:\/|$)/, perm: 'usulan-akses-berkas:read-usulan' },
  { pattern: /^\/kelola\/penggunaan\/verifikasi-usulan(?:\/|$)/, perm: 'usulan-akses-berkas:read-verifikasi' },
  { pattern: /^\/kelola\/penggunaan\/pemberian(?:\/|$)/, perm: 'usulan-akses-berkas:read-pemberian' },
  // Penyusutan — guard URL detail/aksi agar tidak bisa dibuka langsung
  // setelah permission Read submenu dicabut.
  {
    pattern: /^\/maintenance\/penyusutan\/pengajuan-penyusutan\/(?:ajukan|detail)\/[^/]+$/,
    perm: 'pemeliharaan.penyusutan.pengajuan:read',
  },
  {
    pattern: /^\/maintenance\/penyusutan\/penataan-pemusnahan\/[^/]+$/,
    perm: 'pemeliharaan.penyusutan.penataan-pemusnahan:read',
  },
  {
    pattern: /^\/maintenance\/penyusutan\/verifikasi-penyusutan\/(?:detail|tindak-lanjuti)\/[^/]+$/,
    perm: 'pemeliharaan.penyusutan.verifikasi:read',
  },
];

/**
 * Akses Naskah Lainnya berdasarkan position_status. Mirror BE helper
 * (canAccessNaskahLainnya). SE/VI/EXT ditolak; lainnya allow.
 */
const NASKAH_LAINNYA_BLOCKED_STATUSES = new Set(['SE', 'VI', 'EXT']);
export function canAccessNaskahLainnya(positionStatus: string | null | undefined): boolean {
  return !(positionStatus && NASKAH_LAINNYA_BLOCKED_STATUSES.has(positionStatus));
}

export function useFeatureAccess() {
  const auth = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    return auth.hasPermission(resource, action);
  };

  const can = (key: string): boolean => {
    if (key.includes(':')) {
      const [resource, action] = key.split(':');
      return hasPermission(resource, action);
    }
    const perm = routePermissions[key];
    if (!perm) return true;
    const [resource, action] = perm.split(':');
    return hasPermission(resource, action);
  };

  const currentRoutePermission = (
    path?: string,
    query?: Record<string, any>,
  ): FeaturePermission | null => {
    const route = useRoute();
    const key = path ?? route.path;
    const routeQuery = query ?? route.query;

    // Halaman detail/list lama dipakai oleh tiga submenu Penggunaan. Query
    // ini menjaga akses tetap mengikuti submenu asalnya, bukan permission
    // Read Usulan Akses secara otomatis.
    if (key === '/kelola/penggunaan/usulan-akses-berkas') {
      if (routeQuery.tab === 'verify-me' || routeQuery.from === 'verifikasi') {
        return { resource: 'usulan-akses-berkas', action: 'read-verifikasi' };
      }
      if (routeQuery.tab === 'verify-pemberi' || routeQuery.from === 'pemberian') {
        return { resource: 'usulan-akses-berkas', action: 'read-pemberian' };
      }
      return { resource: 'usulan-akses-berkas', action: 'read-usulan' };
    }

    if (/^\/kelola\/penggunaan\/usulan-akses-berkas\/[^/]+$/.test(key)) {
      if (routeQuery.from === 'verifikasi') {
        return { resource: 'usulan-akses-berkas', action: 'read-verifikasi' };
      }
      if (routeQuery.from === 'pemberian') {
        return { resource: 'usulan-akses-berkas', action: 'read-pemberian' };
      }
      return { resource: 'usulan-akses-berkas', action: 'read-usulan' };
    }

    const exact = routePermissions[key];
    if (exact) {
      const [resource, action] = exact.split(':');
      return { resource, action };
    }
    for (const { pattern, perm } of routePermissionPatterns) {
      if (pattern.test(key)) {
        const [resource, action] = perm.split(':');
        return { resource, action };
      }
    }
    return null;
  };

  const canAccessPage = (path?: string, query?: Record<string, any>): boolean => {
    // Gate position_status untuk Naskah Lainnya (SE/VI/EXT blocked) — sebelum cek permission
    const p = path ?? useRoute().path;
    if (
      p.startsWith('/naskah-lainnya') &&
      !canAccessNaskahLainnya(auth.user.value?.position_status)
    ) {
      return false;
    }

    // Satu halaman Konfigurasi Sistem berisi beberapa tab. Akses halaman
    // diberikan jika user memiliki Read pada minimal satu tab.
    if (p === '/konfigurasi-sistem') {
      return CONFIGURATION_READ_PERMISSIONS.some(({ resource, action }) =>
        hasPermission(resource, action),
      );
    }

    const perm = currentRoutePermission(path, query);
    if (!perm) return true;
    return hasPermission(perm.resource, perm.action);
  };

  return {
    hasPermission,
    can,
    currentRoutePermission,
    canAccessPage,
  };
}
