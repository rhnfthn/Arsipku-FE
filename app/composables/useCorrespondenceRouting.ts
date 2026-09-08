export interface RoutingRole {
  id: string;
  code: string;
  name: string;
  is_active: number | boolean;
}

export interface RoutingRule extends RoutingRole {
  source_role_id: string;
  target_role_id: string;
  document_type: string;
  action_type: string;
  delivery_type: string;
  scope_type: string;
  valid_from: string;
  valid_to?: string | null;
}

export interface RoutingMember {
  id: string;
  position_id: number;
  valid_from: string;
  valid_to?: string | null;
  is_active: number | boolean;
  found: boolean;
  vacant: boolean;
  position?: {
    position_text?: string;
    position_abbreviation?: string;
    persnum_person_text?: string;
    area_text?: string;
    organization_text?: string;
  } | null;
}

export interface RoutingHealth {
  feature_flag_enabled: boolean;
  active_role_count: number;
  active_rule_count: number;
}

export interface RoutingPreview {
  effectiveRecipients: { position: number; position_text?: string; area_text?: string }[];
  mandatoryCc: { position: number; position_text?: string; area_text?: string }[];
  warnings: { code: string; message: string }[];
}

export interface RoutingBulkToggleResult {
  is_active: boolean;
  changed_count: number;
  changed_rule_ids: string[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
}

const unwrap = <T>(response: T | ApiEnvelope<T>): T => {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return (response as ApiEnvelope<T>).data;
  }
  return response as T;
};

export const useCorrespondenceRouting = () => {
  const { apiGet, apiPost, apiPatch } = useApi();
  const root = '/correspondence-routing';
  // Fetch every page so role selectors and client-side filters are never truncated.
  const list = async <T>(path: string) => {
    const items: T[] = [];
    let page = 1;
    while (true) {
      const response = await apiGet<PaginatedResult<T> | ApiEnvelope<PaginatedResult<T>>>(
        `${root}/${path}`,
        { params: { page, limit: 100, company: 10000 } },
        { skipCache: true }
      );
      const result = unwrap(response);
      if (!Array.isArray(result?.data)) {
        throw new Error(`Format response ${path} tidak valid`);
      }
      items.push(...result.data);
      if (!result.data.length || items.length >= Number(result.total || 0)) return items;
      page++;
    }
  };
  return {
    listRoles: () => list<RoutingRole>('roles'),
    listRules: () => list<RoutingRule>('rules'),
    listMembers: (roleId: string) => list<RoutingMember>(`roles/${roleId}/members`),
    health: async () =>
      unwrap(
        await apiGet<RoutingHealth | ApiEnvelope<RoutingHealth>>(
          `${root}/health`,
          {},
          { skipCache: true }
        )
      ),
    createRole: async (body: object) => unwrap(await apiPost(`${root}/roles`, body)),
    addMembers: async (id: string, body: object) =>
      unwrap(await apiPost(`${root}/roles/${id}/members`, body)),
    createRule: async (body: object) => unwrap(await apiPost(`${root}/rules`, body)),
    toggleRule: async (id: string, active: boolean) =>
      unwrap(await apiPatch(`${root}/rules/${id}/toggle-active`, { is_active: active })),
    toggleAllRules: async (active: boolean) =>
      unwrap(
        await apiPatch<RoutingBulkToggleResult | ApiEnvelope<RoutingBulkToggleResult>>(
          `${root}/rules/toggle-all`,
          { is_active: active }
        )
      ),
    preview: async (body: object) =>
      unwrap(await apiPost<RoutingPreview | ApiEnvelope<RoutingPreview>>(`${root}/preview`, body)),
  };
};
