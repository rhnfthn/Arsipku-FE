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
  // Utilitas
  '/digsig/verifikasi-dokumen': 'utilitas.ttd-digital.verifikasi-dokumen:read',
  '/digsig/penandatanganan': 'utilitas.ttd-digital.penandatanganan:read',
  '/digsig/cek-dokumen': 'utilitas.ttd-digital.cek-dokumen:read',
  '/digsig/log-digsig': 'utilitas.ttd-digital.log-disdig:read',
  '/penyingkat-tautan': 'utilitas.penyingkatan-tautan:read',
  '/layanan-email': 'utilitas.layanan-email:read',
  '/layanan-email/log': 'utilitas.layanan-email.log:read',
  '/template': 'utilitas.template:read',
};

// Regex matchers for dynamic routes (detail pages)
const routePermissionPatterns: { pattern: RegExp; perm: string }[] = [
  { pattern: /^\/korespondensi\/kotak-masuk\/[^/]+$/, perm: 'utama.kotak-masuk:read-detail' },
  { pattern: /^\/korespondensi\/terkirim\/[^/]+$/, perm: 'utama.terkirim:read-detail' },
  { pattern: /^\/korespondensi\/tertunda\/[^/]+$/, perm: 'utama.tertunda:read-detail' },
  { pattern: /^\/korespondensi\/draf\/[^/]+$/, perm: 'utama.draft:read-detail' },
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
