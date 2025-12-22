// types/auth.ts

export interface UserProfile {
  persnum: number;
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
  bodTag: string;
  abbreviation: string;
  iat?: number; // Opsional (kadang tidak ada di respon raw DB)
  exp?: number; // Opsional
}

// Interface untuk kemudahan return value useAuth (Opsional tapi rapi)
export interface AuthComposable {
  user: Ref<UserProfile | null>;
  setUser: (data: UserProfile | null) => void;
  getProfile: () => Promise<UserProfile | null>;
  getSSORedirectUrl: () => Promise<string | null>;
  verifyToken: (token: string) => Promise<any>;
  logout: () => Promise<boolean>;
  refreshToken: () => Promise<string>;
}
