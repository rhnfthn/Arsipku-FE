// types/auth.ts

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
  position: string;
  positionText: string;

  // --- Field Baru ---
  position_status?: string; // contoh: "PT", "Definitif"
  position_status_label?: string; // contoh: "Pelaksana Tugas"
  nik?: string;
  // ------------------

  bodTag: string;
  abbreviation: string;
  iat?: number;
  exp?: number;
  alamatInfo?: AlamatInfo;

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
}
