import { useAuth } from './useAuth';

export interface FeaturePermission {
  resource: string;
  action: string;
}

/**
 * Map route path → required permission (resource:action).
 * Sesuai matrix Utama Super Admin.
 */
const routePermissions: Record<string, string> = {
  // Utama
  '/beranda': 'utama.beranda:read',
  '/korespondensi/draf': 'utama.draft:read',
  '/korespondensi/kotak-masuk': 'utama.kotak-masuk:read',
  '/korespondensi/terkirim': 'utama.terkirim:read',
  '/korespondensi/tertunda': 'utama.tertunda:read',
  '/korespondensi/tulis/disposisi': 'utama.tulis.disposisi:read',
  '/korespondensi/tulis/kajian': 'utama.tulis.kajian:read',
  '/korespondensi/tulis/naskah-umum': 'utama.tulis.naskah-lainnya:read',
  '/korespondensi/tulis/nota-dinas': 'utama.tulis.nota-dinas:read',
  '/korespondensi/tulis/surat-dinas-eksternal': 'utama.tulis.surat-dinas-eksternal:read',
  '/korespondensi/tulis/surat-dinas-internal': 'utama.tulis.surat-dinas-internal:read',
  // Utilitas (resource names sesuai seed-rbac.ts)
  '/digsig/verifikasi-dokumen': 'digsig:read-verifikasi-dokumen',
  '/digsig/penandatanganan': 'digsig:read-penandatanganan',
  '/penandatangan': 'digsig:read-penandatanganan',
  '/digsig/cek-dokumen': 'digsig:read-cek-dokumen',
  '/digsig/log-digsig': 'digsig:read-log-disdig',
  '/penyingkat-tautan': 'penyingkat-tautan:read',
  '/layanan-email': 'layanan-email:read',
  '/layanan-email/log': 'layanan-email:read-log',
  '/template': 'template:read',
  '/naskah-dinas/verifikator': 'verifikasi-naskah:read',
  // Administrasi
  '/delegasi': 'delegasi:read',
  '/titelatur': 'titelatur:read',
  '/penomoran/usulan': 'penomoran:read-usulan',
  '/usulan-penomoran': 'penomoran:read-usulan',
  '/penomoran/verifikasi': 'penomoran:read-verifikasi',
  '/penomoran/nomor': 'penomoran:read-penomoran',
  '/persetujuan-penomoran': 'penomoran:read-persetujuan',
  '/naskah-dinas': 'naskah-masuk:read-verifikasi',
  '/master/tertuju-eksternal': 'master-data:read-tertuju',
  '/master/perusahaan': 'master-data:read-perusahaan',
  '/master/klasifikasi': 'master-data:read-klasifikasi',
  '/master/jenis': 'master-data:read-jenis',
  '/master/grup-penerima': 'master-data:read',
  // RBAC management (superadmin only, but permission check for completeness)
  '/rbac/roles': 'role:read',
  '/rbac/permissions': 'role:read',
  '/rbac/resources': 'role:read',
  '/rbac/users': 'user:read',
  // Laporan
  '/laporan/rekap-naskah': 'laporan:read-rekap-naskah',
  '/laporan/detail-naskah': 'laporan:read-detail-naskah',
  '/laporan/naskah-masuk': 'laporan:read-naskah-masuk',
  // FAQ & Pedoman
  '/faq/menu': 'faq:read',
  '/faq/manajemen': 'faq:read',
  '/pedoman/menu': 'pedoman:read',
  '/pedoman/manajemen': 'pedoman:read',
  // Konfigurasi
  '/konfigurasi-sistem': 'konfigurasi:read',
};

// Regex matchers for dynamic routes (detail pages)
const routePermissionPatterns: { pattern: RegExp; perm: string }[] = [
  { pattern: /^\/korespondensi\/kotak-masuk\/[^/]+$/, perm: 'utama.kotak-masuk:read-detail' },
  { pattern: /^\/korespondensi\/terkirim\/[^/]+$/, perm: 'utama.terkirim:read-detail' },
  { pattern: /^\/korespondensi\/tertunda\/[^/]+$/, perm: 'utama.tertunda:read-detail' },
  { pattern: /^\/korespondensi\/draf\/[^/]+$/, perm: 'utama.draft:read-detail' },
  // Konsep & Finalisasi & Lanjut — inherit dari parent tulis permission
  { pattern: /^\/korespondensi\/tulis\/konsep\/nota-dinas/, perm: 'utama.tulis.nota-dinas:read' },
  { pattern: /^\/korespondensi\/tulis\/konsep\/surat-dinas-internal/, perm: 'utama.tulis.surat-dinas-internal:read' },
  { pattern: /^\/korespondensi\/tulis\/konsep\/surat-dinas-eksternal/, perm: 'utama.tulis.surat-dinas-eksternal:read' },
  { pattern: /^\/korespondensi\/tulis\/finalisasi\/nota-dinas/, perm: 'utama.tulis.nota-dinas:read' },
  { pattern: /^\/korespondensi\/tulis\/finalisasi\/surat-dinas-internal/, perm: 'utama.tulis.surat-dinas-internal:read' },
  { pattern: /^\/korespondensi\/tulis\/finalisasi\/surat-dinas-eksternal/, perm: 'utama.tulis.surat-dinas-eksternal:read' },
  { pattern: /^\/korespondensi\/tulis\/lanjut\/disposisi/, perm: 'utama.tulis.disposisi:read' },
  { pattern: /^\/korespondensi\/tulis\/lanjut\/nota-dinas/, perm: 'utama.tulis.nota-dinas:read' },
  { pattern: /^\/korespondensi\/tulis\/lanjut\/surat-dinas-internal/, perm: 'utama.tulis.surat-dinas-internal:read' },
  { pattern: /^\/korespondensi\/tulis\/lanjut\/surat-dinas-eksternal/, perm: 'utama.tulis.surat-dinas-eksternal:read' },
  // Master data — sub-pages inherit parent permission
  { pattern: /^\/master\/perusahaan\/[^/]+\/area$/, perm: 'master-data:read-perusahaan-area' },
  { pattern: /^\/master\/perusahaan\/[^/]+\/struktur$/, perm: 'master-data:read-perusahaan' },
];

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

  const currentRoutePermission = (path?: string): FeaturePermission | null => {
    const route = useRoute();
    const key = path ?? route.path;
    // Exact match
    const exact = routePermissions[key];
    if (exact) {
      const [resource, action] = exact.split(':');
      return { resource, action };
    }
    // Pattern match (dynamic routes)
    for (const { pattern, perm } of routePermissionPatterns) {
      if (pattern.test(key)) {
        const [resource, action] = perm.split(':');
        return { resource, action };
      }
    }
    return null;
  };

  const canAccessPage = (path?: string): boolean => {
    const perm = currentRoutePermission(path);
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
