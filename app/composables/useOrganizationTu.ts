import { useApi } from '~/composables/useApi';
import type {
  OrganizationTuListApiResponse,
  OrganizationTuSingleApiResponse,
  OrganizationTuItem,
  CreateOrganizationTuPayload,
  UpdateOrganizationTuPayload,
  QueryOrganizationTuParams,
  CheckUserResponse,
} from '~/types/organization-tu';

export const useOrganizationTu = () => {
  const { apiGet, apiPost, apiPatch, apiDelete } = useApi();

  // GET LIST (paginated) — return inner data { data: [...], meta: {...} }
  const getOrganizationTuList = async (params: QueryOrganizationTuParams) => {
    const res = await apiGet<OrganizationTuListApiResponse>(
      '/organization-tu',
      { params },
      { skipCache: true }
    );
    return res?.data ?? res;
  };

  // GET DETAIL — return inner data { data: item }
  const getOrganizationTu = async (id: string) => {
    const res = await apiGet<OrganizationTuSingleApiResponse>(`/organization-tu/${id}`);
    return res?.data ?? res;
  };

  // CHECK USER
  const checkUser = async (persnum: number | string) => {
    const res = await apiGet<{ success: boolean; data: CheckUserResponse }>(
      `/organization-tu/check-user/${persnum}`
    );
    return res?.data ?? res;
  };

  // CREATE — return inner data { data: item }
  const createOrganizationTu = async (payload: CreateOrganizationTuPayload) => {
    const res = await apiPost<OrganizationTuSingleApiResponse>('/organization-tu', payload);
    return res?.data ?? res;
  };

  // UPDATE — return inner data { data: item }
  const updateOrganizationTu = async (id: string, payload: UpdateOrganizationTuPayload) => {
    const res = await apiPatch<OrganizationTuSingleApiResponse>(`/organization-tu/${id}`, payload);
    return res?.data ?? res;
  };

  // DELETE
  const deleteOrganizationTu = async (id: string) => {
    return await apiDelete(`/organization-tu/${id}`);
  };

  return {
    getOrganizationTuList,
    getOrganizationTu,
    checkUser,
    createOrganizationTu,
    updateOrganizationTu,
    deleteOrganizationTu,
  };
};
