// ==========================================
//   ORGANIZATION TU (Unit TU)
// ==========================================
export type OrganizationTuRole = 'unit_dokumen' | 'sekretaris_delegasi';

export interface OrganizationTuItem {
  id: string;
  persnum: number;
  user_name: string | null;
  role: OrganizationTuRole;
  area_id: string | null;
  area_text: string | null;
  organization_id: string | null;
  organization_text: string | null;
  sub_area_id: string | null;
  sub_area_text: string | null;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  is_currently_valid: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  delegasi_id: string | null;
}

export interface OrganizationTuListResponse {
  data: OrganizationTuItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Response backend di-wrap TransformResponseInterceptor: { success, data: <payload> }
export interface OrganizationTuListApiResponse {
  success: boolean;
  data: OrganizationTuListResponse;
}

export interface OrganizationTuSingleResponse {
  data: OrganizationTuItem;
}

export interface OrganizationTuSingleApiResponse {
  success: boolean;
  data: OrganizationTuSingleResponse;
}

export interface CreateOrganizationTuPayload {
  persnum: number;
  role: OrganizationTuRole;
  area_id?: string | null;
  organization_id?: string | null;
  sub_area_id?: string | null;
  valid_from: string;
  valid_to?: string | null;
  is_active?: boolean;
}

export interface UpdateOrganizationTuPayload {
  persnum?: number;
  role?: OrganizationTuRole;
  area_id?: string | null;
  organization_id?: string | null;
  sub_area_id?: string | null;
  valid_from?: string;
  valid_to?: string | null;
  is_active?: boolean;
}

export interface QueryOrganizationTuParams {
  search?: string;
  role?: OrganizationTuRole;
  area_id?: string;
  organization_id?: string;
  sub_area_id?: string;
  persnum?: string;
  is_active?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CheckUserResponse {
  persnum: number;
  has_unit_dokumen: boolean;
  has_sekretaris_delegasi: boolean;
  active_assignments: Array<{
    id: string;
    role: OrganizationTuRole;
    area_id: string | null;
    area_text: string | null;
    organization_id: string | null;
    organization_text: string | null;
    sub_area_id: string | null;
    sub_area_text: string | null;
    valid_from: string;
    valid_to: string | null;
  }>;
}
