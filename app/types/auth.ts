// types/auth.ts
import type { Ref, ComputedRef } from 'vue';

export type RoleName = 'SUPERADMIN' | 'ADMIN' | 'USER';

export interface ActiveRoleInfo {
  id: string;
  name: RoleName;
}

export interface ActivePermission {
  resource: string;
  actions: string[];
}

export interface AlamatInfo {
  kantor: string;
  gedung: string;
  kota: string;
  alamat: string;
}

export interface UserDelegation {
  id: string;
  delegated_role: {
    position_status: string;
    position_status_label: string;
    description: string;
    persnum: string;
    name: string;
    position: string;
    position_text: string;
    organization: string;
    organization_text: string;
    area: string;
    area_text: string;
    sub_area: string;
    sub_area_text: string;
    company: string;
    company_text: string;
  };
  delegated_from: {
    persnum: string;
    name: string;
    position: string;
    position_text: string;
  };
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface UserProfile {
  persnum: number | string; // Bisa number/string di JSON
  nama: string;
  role: string;
  company: string;
  companyText: string;
  area: string;
  areaText: string;
  subArea: string;
  subAreaText: string;
  organization: string;
  organizationText: string;
  position: any;
  positionText: string;
  position_id?: string | number;

  // --- Field Baru ---
  position_status?: string; // contoh: "PT", "Definitif"
  position_status_label?: string; // contoh: "Pelaksana Tugas"
  nik?: string;
  atasan_langsung?: any;
  // ------------------

  bodTag: string;
  abbreviation: string;
  iat?: number;
  exp?: number;
  alamatInfo?: AlamatInfo;

  // RBAC v2 (stateless di JWT)
  activeRole?: ActiveRoleInfo | null;
  activePermissions?: ActivePermission[];
  roles?: ActiveRoleInfo[]; // semua role milik user (untuk switcher)

  // Role tambahan dari tabel organization_tu (Unit TU): 'tu' | 'sekretaris'
  tuRoles?: string[];

  // Profile switching (sekretaris / unit dokumen)
  has_secretary_delegation?: boolean;
  available_profiles?: string[];
  active_profile?: 'akun_asli' | 'sekretaris' | 'unit_dokumen';

  // Opsional: Jika ingin menyimpan list delegasi di user profile
  delegations?: UserDelegation[];
}

export interface AuthComposable {
  user: Ref<UserProfile | null>;
  setUser: (data: UserProfile | null) => void;
  getProfile: () => Promise<UserProfile | null>;
  getSSORedirectUrl: () => Promise<string | null>;
  verifyToken: (token: string) => Promise<any>;
  logout: () => Promise<boolean>;
  refreshToken: () => Promise<string>;
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (resource: string, actions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  isSuperadmin: ComputedRef<boolean>;
  isAdmin: ComputedRef<boolean>;
  switchRole: (roleId: string) => Promise<void>;
  switchProfile: (profile: 'akun_asli' | 'sekretaris') => Promise<any>;
}
